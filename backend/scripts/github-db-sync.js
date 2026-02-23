#!/usr/bin/env node
/**
 * GitHub Actions için DB Sync Script
 * Bilgisayardan bağımsız, bulutta çalışır.
 * 
 * Usage:
 *   node scripts/github-db-sync.js --phase=teams
 *   node scripts/github-db-sync.js --phase=ratings
 *   node scripts/github-db-sync.js --phase=teams --max-teams=100
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const { syncOneTeamSquad } = require('../services/squadSyncService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEASON = 2025;
const API_DAILY_LIMIT = 75000;

// Args
const args = process.argv.slice(2);
const PHASE = args.find(a => a.startsWith('--phase='))?.replace('--phase=', '') || 'teams';
const MAX_TEAMS = parseInt(args.find(a => a.startsWith('--max-teams='))?.replace('--max-teams=', '') || '0', 10);

// 75,000 API limiti ile hızlı çalış: ~25,000 çağrı gerekiyor = limitin %33'ü
const BATCH_SIZE = 50;
const BATCH_PAUSE_MS = 5000;  // 5 sec between batches
const TEAM_DELAY_MS = 800;    // 800ms between teams (~75 teams/min)

let apiCallCount = 0;
let teamsProcessed = 0;
const startTime = Date.now();
let coachUpdated = 0;
let colorsUpdated = 0;
let ratingsUpdated = 0;

async function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${msg}`);
}

async function fetchStats() {
  const { count: totalTeams } = await supabase.from('static_teams').select('*', { count: 'exact', head: true });
  const { count: withCoach } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('coach', 'is', null);
  const { count: withColors } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('colors_primary', 'is', null);
  const { count: squads2025 } = await supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', SEASON);
  
  return {
    totalTeams: totalTeams || 0,
    withCoach: withCoach || 0,
    withColors: withColors || 0,
    squads2025: squads2025 || 0,
    coachPct: totalTeams ? Math.round((withCoach || 0) / totalTeams * 100) : 0,
    colorsPct: totalTeams ? Math.round((withColors || 0) / totalTeams * 100) : 0,
    squadsPct: totalTeams ? Math.round((squads2025 || 0) / totalTeams * 100) : 0,
  };
}

async function getTeamsMissingData() {
  const pageSize = 1000;
  const allMissing = new Map();
  
  // Teams missing coach
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .is('coach', null)
      .not('api_football_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    data.forEach(t => allMissing.set(t.api_football_id, { ...t, missingCoach: true }));
    if (data.length < pageSize) break;
    page++;
  }
  
  // Teams missing colors
  page = 0;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .is('colors_primary', null)
      .not('api_football_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    data.forEach(t => {
      if (allMissing.has(t.api_football_id)) {
        allMissing.get(t.api_football_id).missingColors = true;
      } else {
        allMissing.set(t.api_football_id, { ...t, missingColors: true });
      }
    });
    if (data.length < pageSize) break;
    page++;
  }
  
  // Teams missing 2025 squad
  const { data: existingSquads } = await supabase
    .from('team_squads')
    .select('team_id')
    .eq('season', SEASON);
  const hasSquad = new Set((existingSquads || []).map(s => s.team_id));
  
  page = 0;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .not('api_football_id', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (!data || data.length === 0) break;
    data.forEach(t => {
      if (!hasSquad.has(t.api_football_id)) {
        if (allMissing.has(t.api_football_id)) {
          allMissing.get(t.api_football_id).missingSquad = true;
        } else {
          allMissing.set(t.api_football_id, { ...t, missingSquad: true });
        }
      }
    });
    if (data.length < pageSize) break;
    page++;
  }
  
  // Sort: coach missing first, then by number of missing fields
  const list = Array.from(allMissing.values());
  list.sort((a, b) => {
    if (a.missingCoach !== b.missingCoach) return a.missingCoach ? -1 : 1;
    const scoreA = (a.missingColors ? 1 : 0) + (a.missingSquad ? 1 : 0);
    const scoreB = (b.missingColors ? 1 : 0) + (b.missingSquad ? 1 : 0);
    return scoreB - scoreA;
  });
  
  return list;
}

async function runTeamsPhase() {
  const stats = await fetchStats();
  log(`Current: Coach ${stats.coachPct}% | Colors ${stats.colorsPct}% | Squads ${stats.squadsPct}%`);
  
  if (stats.coachPct >= 100 && stats.colorsPct >= 100 && stats.squadsPct >= 100) {
    log('✅ Team data already 100% complete!');
    return;
  }
  
  const teams = await getTeamsMissingData();
  const toProcess = MAX_TEAMS > 0 ? teams.slice(0, MAX_TEAMS) : teams;
  
  log(`Found ${teams.length} teams with missing data. Processing: ${toProcess.length}`);
  
  for (let i = 0; i < toProcess.length; i++) {
    const team = toProcess[i];
    
    // Check if we're approaching API limit (estimate ~5 calls per team)
    if (apiCallCount + 5 > API_DAILY_LIMIT * 0.95) {
      log(`⚠️ Approaching API limit (${apiCallCount}/${API_DAILY_LIMIT}). Stopping.`);
      break;
    }
    
    try {
      const result = await syncOneTeamSquad(team.api_football_id, team.name, {
        syncCoach: true,
        syncTeamInfo: true
      });
      
      teamsProcessed++;
      apiCallCount += 5; // Estimate
      
      if (result.coachUpdated) coachUpdated++;
      if (result.colorsUpdated) colorsUpdated++;
      
      if ((i + 1) % 25 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 60000);
        const eta = toProcess.length > 0 ? Math.round(elapsed * (toProcess.length - i - 1) / (i + 1)) : 0;
        log(`Progress: ${i + 1}/${toProcess.length} (${Math.round((i+1)/toProcess.length*100)}%) | API: ~${apiCallCount} | Coach: +${coachUpdated} | Colors: +${colorsUpdated} | ${elapsed}m elapsed, ~${eta}m remaining`);
      }
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('limit')) {
        log(`⚠️ Rate limited. Waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        i--; // Retry this team
        continue;
      }
      log(`❌ Error on team ${team.api_football_id}: ${err.message}`);
    }
    
    // Delay between teams
    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, TEAM_DELAY_MS));
    }
    
    // Batch pause
    if ((i + 1) % BATCH_SIZE === 0 && i < toProcess.length - 1) {
      log(`Batch ${Math.floor((i + 1) / BATCH_SIZE)} complete. Waiting ${BATCH_PAUSE_MS / 1000}s...`);
      await new Promise(r => setTimeout(r, BATCH_PAUSE_MS));
    }
  }
  
  const finalStats = await fetchStats();
  log(`\n=== TEAMS PHASE COMPLETE ===`);
  log(`Processed: ${teamsProcessed} teams`);
  log(`Coach updated: ${coachUpdated}`);
  log(`Colors updated: ${colorsUpdated}`);
  log(`Final: Coach ${finalStats.coachPct}% | Colors ${finalStats.colorsPct}% | Squads ${finalStats.squadsPct}%`);
}

async function runRatingsPhase() {
  log('Starting ratings phase...');
  
  // Import rating update function
  const { processAllTeamsFromDB } = require('./update-all-player-ratings');
  
  try {
    await processAllTeamsFromDB({
      maxTeams: MAX_TEAMS > 0 ? MAX_TEAMS : undefined,
      delayMs: 800,
      batchSize: 50,
      pauseAfterBatch: 5000
    });
    log('✅ Ratings phase complete');
  } catch (err) {
    if (err.message?.includes('limit')) {
      log('⚠️ API limit reached during ratings phase');
    } else {
      log(`❌ Ratings error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  GITHUB DB SYNC - Otomatik Veritabanı Güncelleme         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`   Phase: ${PHASE}`);
  console.log(`   Max teams: ${MAX_TEAMS || 'unlimited'}`);
  console.log(`   API daily limit: ${API_DAILY_LIMIT}`);
  console.log('');
  
  const startStats = await fetchStats();
  log(`Start: Coach ${startStats.coachPct}% | Colors ${startStats.colorsPct}% | Squads ${startStats.squadsPct}%`);
  
  if (PHASE === 'teams' || PHASE === 'all') {
    await runTeamsPhase();
  }
  
  if (PHASE === 'ratings' || PHASE === 'all') {
    await runRatingsPhase();
  }
  
  console.log('');
  log('=== SYNC COMPLETED ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
