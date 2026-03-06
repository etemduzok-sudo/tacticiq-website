// ============================================
// COMPREHENSIVE SYNC SERVICE
// ============================================
// 4 saatte bir çalışan kapsamlı veri senkronizasyonu
// Günlük 75,000 API sorgu limitini optimal kullanır
// ============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// CONFIGURATION - 75,000/gün için optimize edildi
// ============================================

const CONFIG = {
  // API Limitleri
  DAILY_API_LIMIT: 75000,
  SYNCS_PER_DAY: 6, // 4 saatte bir = günde 6 kez
  API_CALLS_PER_SYNC: 12500, // 75000 / 6 = 12500 çağrı/sync
  
  // Sync Aralığı
  SYNC_INTERVAL_MS: 4 * 60 * 60 * 1000, // 4 saat
  
  // Veri öncelikleri (yüzde olarak API bütçesi dağılımı)
  BUDGET_ALLOCATION: {
    LIVE_MATCHES: 5,      // %5 - Canlı maçlar (en yüksek öncelik, sık güncelleme)
    PLAYER_RATINGS: 35,   // %35 - Oyuncu rating/skill (en büyük veri)
    TEAM_INFO: 15,        // %15 - Takım bilgileri (coach, renkler)
    SQUADS: 20,           // %20 - Kadrolar
    MATCHES: 20,          // %20 - Geçmiş/Gelecek maçlar
    NATIONAL_TEAMS: 5     // %5 - Milli takımlar
  },
  
  // Rate limiting
  REQUEST_DELAY_MS: 100, // API çağrıları arası bekleme
  BATCH_SIZE: 50,        // Batch işlem boyutu
  
  // Season
  CURRENT_SEASON: 2025
};

// ============================================
// STATE
// ============================================

let syncState = {
  isRunning: false,
  lastSyncTime: null,
  currentPhase: null,
  apiCallsThisSync: 0,
  stats: {
    teamsUpdated: 0,
    playersUpdated: 0,
    matchesUpdated: 0,
    ratingsUpdated: 0,
    errors: []
  }
};

// ============================================
// API HELPER
// ============================================

async function apiRequest(endpoint, params = {}) {
  syncState.apiCallsThisSync++;
  
  try {
    const response = await axios.get(`https://v3.football.api-sports.io${endpoint}`, {
      params,
      headers: {
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    await new Promise(r => setTimeout(r, CONFIG.REQUEST_DELAY_MS));
    return response.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// ============================================
// PHASE 1: LIVE MATCHES (Her 4 saatte ~625 çağrı)
// ============================================

async function syncLiveMatches() {
  console.log('\n📺 PHASE 1: Live Matches Sync');
  syncState.currentPhase = 'LIVE_MATCHES';
  
  try {
    const data = await apiRequest('/fixtures', { live: 'all' });
    const liveMatches = data.response || [];
    
    console.log(`   Found ${liveMatches.length} live matches`);
    
    for (const fixture of liveMatches) {
      await updateMatchInDb(fixture);
    }
    
    console.log(`   ✅ Live matches synced`);
    return liveMatches.length;
  } catch (error) {
    console.error('   ❌ Live matches sync failed:', error.message);
    return 0;
  }
}

// ============================================
// PHASE 2: PLAYER RATINGS & SKILLS (~4375 çağrı)
// ============================================

async function syncPlayerRatings(maxCalls) {
  console.log('\n⭐ PHASE 2: Player Ratings Sync');
  syncState.currentPhase = 'PLAYER_RATINGS';
  
  // Öncelikli takımları belirle (favori takımlar, büyük ligler)
  const { data: priorityTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .in('league', ['Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
                   'Champions League', 'Europa League', 'Conference League'])
    .order('last_updated', { ascending: true, nullsFirst: true })
    .limit(Math.floor(maxCalls / 3)); // Her takım ~2-3 sayfa = ~3 çağrı
  
  console.log(`   Processing ${priorityTeams?.length || 0} priority teams`);
  
  let updated = 0;
  let calls = 0;
  
  for (const team of (priorityTeams || [])) {
    if (calls >= maxCalls) break;
    
    try {
      // Oyuncu istatistiklerini çek (sayfalı)
      let page = 1;
      let hasMore = true;
      const allPlayers = [];
      
      while (hasMore && calls < maxCalls) {
        const data = await apiRequest('/players', {
          team: team.api_football_id,
          season: CONFIG.CURRENT_SEASON,
          page
        });
        calls++;
        
        const players = data.response || [];
        allPlayers.push(...players);
        
        hasMore = data.paging?.current < data.paging?.total;
        page++;
        
        if (page > 5) break; // Max 5 sayfa per takım
      }
      
      // Oyuncuları DB'ye kaydet
      if (allPlayers.length > 0) {
        await savePlayerRatings(team.api_football_id, allPlayers);
        updated += allPlayers.length;
      }
      
      if ((priorityTeams.indexOf(team) + 1) % 20 === 0) {
        console.log(`   [${priorityTeams.indexOf(team) + 1}/${priorityTeams.length}] ${team.name} - ${allPlayers.length} players`);
      }
      
    } catch (error) {
      syncState.stats.errors.push({ team: team.name, error: error.message });
    }
  }
  
  console.log(`   ✅ ${updated} player ratings updated`);
  syncState.stats.ratingsUpdated = updated;
  return calls;
}

async function savePlayerRatings(teamId, players) {
  // Mevcut kadroyu güncelle
  const { data: existingSquad } = await supabase
    .from('team_squads')
    .select('players')
    .eq('team_id', teamId)
    .eq('season', CONFIG.CURRENT_SEASON)
    .single();
  
  const enrichedPlayers = players.map(p => {
    const stats = p.statistics?.[0] || {};
    return {
      id: p.player.id,
      name: p.player.name,
      age: p.player.age,
      number: stats.games?.number || null,
      position: stats.games?.position || p.player.position,
      photo: p.player.photo,
      // Rating ve istatistikler
      rating: stats.games?.rating ? parseFloat(stats.games.rating) : null,
      appearances: stats.games?.appearences || 0,
      goals: stats.goals?.total || 0,
      assists: stats.goals?.assists || 0,
      minutes: stats.games?.minutes || 0,
      // Detaylı istatistikler
      stats: {
        shots: stats.shots || {},
        passes: stats.passes || {},
        tackles: stats.tackles || {},
        duels: stats.duels || {},
        dribbles: stats.dribbles || {},
        fouls: stats.fouls || {},
        cards: stats.cards || {},
        penalty: stats.penalty || {}
      }
    };
  });
  
  // Upsert
  await supabase
    .from('team_squads')
    .upsert({
      team_id: teamId,
      season: CONFIG.CURRENT_SEASON,
      players: enrichedPlayers,
      updated_at: new Date().toISOString()
    }, { onConflict: 'team_id,season' });
}

// ============================================
// PHASE 3: TEAM INFO (Coach, Colors) (~1875 çağrı)
// ============================================

async function syncTeamInfo(maxCalls) {
  console.log('\n🏟️ PHASE 3: Team Info Sync');
  syncState.currentPhase = 'TEAM_INFO';
  
  // Coach eksik veya eski olan takımları bul
  const { data: teamsToUpdate } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach, colors_primary')
    .or('coach.is.null,colors_primary.is.null')
    .limit(Math.floor(maxCalls / 2)); // Her takım 2 çağrı (teams + coachs)
  
  console.log(`   Processing ${teamsToUpdate?.length || 0} teams`);
  
  let updated = 0;
  let calls = 0;
  
  for (const team of (teamsToUpdate || [])) {
    if (calls >= maxCalls) break;
    
    try {
      // Takım bilgisi
      if (!team.colors_primary) {
        const teamData = await apiRequest('/teams', { id: team.api_football_id });
        calls++;
        
        if (teamData.response?.[0]) {
          const info = teamData.response[0];
          await supabase
            .from('static_teams')
            .update({
              colors_primary: info.team?.colors?.player?.primary || null,
              colors_secondary: info.team?.colors?.player?.secondary || null,
              last_updated: new Date().toISOString()
            })
            .eq('api_football_id', team.api_football_id);
        }
      }
      
      // Coach bilgisi
      if (!team.coach) {
        const coachData = await apiRequest('/coachs', { team: team.api_football_id });
        calls++;
        
        if (coachData.response?.length > 0) {
          const { selectActiveCoach } = require('../utils/selectActiveCoach');
          const selected = selectActiveCoach(coachData.response, team.api_football_id);
          if (selected) {
            await supabase
              .from('static_teams')
              .update({
                coach: selected.name,
                coach_api_id: selected.id,
              last_updated: new Date().toISOString()
            })
              .eq('api_football_id', team.api_football_id);
          }
        }
      }
      
      updated++;
    } catch (error) {
      syncState.stats.errors.push({ team: team.name, error: error.message });
    }
  }
  
  console.log(`   ✅ ${updated} teams updated`);
  syncState.stats.teamsUpdated = updated;
  return calls;
}

// ============================================
// PHASE 4: SQUADS (~2500 çağrı)
// ============================================

async function syncSquads(maxCalls) {
  console.log('\n👥 PHASE 4: Squads Sync');
  syncState.currentPhase = 'SQUADS';
  
  // Kadrosu olmayan takımları bul
  const { data: allTeams } = await supabase
    .from('static_teams')
    .select('api_football_id');
  
  const { data: teamsWithSquad } = await supabase
    .from('team_squads')
    .select('team_id')
    .eq('season', CONFIG.CURRENT_SEASON);
  
  const teamsWithSquadSet = new Set(teamsWithSquad?.map(t => t.team_id) || []);
  const teamsWithoutSquad = allTeams?.filter(t => !teamsWithSquadSet.has(t.api_football_id)) || [];
  
  console.log(`   ${teamsWithoutSquad.length} teams without squad`);
  
  let updated = 0;
  let calls = 0;
  const teamsToProcess = teamsWithoutSquad.slice(0, maxCalls);
  
  for (const team of teamsToProcess) {
    if (calls >= maxCalls) break;
    
    try {
      const data = await apiRequest('/players/squads', { team: team.api_football_id });
      calls++;
      
      if (data.response?.[0]?.players) {
        const players = data.response[0].players.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          number: p.number,
          position: p.position,
          photo: p.photo
        }));
        
        await supabase
          .from('team_squads')
          .upsert({
            team_id: team.api_football_id,
            season: CONFIG.CURRENT_SEASON,
            players,
            updated_at: new Date().toISOString()
          }, { onConflict: 'team_id,season' });
        
        updated++;
      }
    } catch (error) {
      // Skip
    }
  }
  
  console.log(`   ✅ ${updated} squads synced`);
  return calls;
}

// ============================================
// PHASE 5: MATCHES (~2500 çağrı)
// ============================================

async function syncMatches(maxCalls) {
  console.log('\n⚽ PHASE 5: Matches Sync');
  syncState.currentPhase = 'MATCHES';
  
  let calls = 0;
  let matchesUpdated = 0;
  
  // Bugün ve gelecek 30 gün
  const today = new Date();
  const dates = [];
  
  // Dün + bugün + 14 gün ileri
  for (let i = -1; i <= 14 && calls < maxCalls; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  console.log(`   Fetching matches for ${dates.length} days`);
  
  for (const date of dates) {
    if (calls >= maxCalls) break;
    
    try {
      const data = await apiRequest('/fixtures', { date });
      calls++;
      
      const fixtures = data.response || [];
      
      for (const fixture of fixtures) {
        await updateMatchInDb(fixture);
        matchesUpdated++;
      }
    } catch (error) {
      // Skip
    }
  }
  
  console.log(`   ✅ ${matchesUpdated} matches synced`);
  syncState.stats.matchesUpdated = matchesUpdated;
  return calls;
}

async function updateMatchInDb(fixture) {
  const match = {
    id: fixture.fixture.id,
    fixture_date: fixture.fixture.date,
    status: fixture.fixture.status.short,
    status_long: fixture.fixture.status.long,
    elapsed: fixture.fixture.status.elapsed,
    home_team_id: fixture.teams.home.id,
    away_team_id: fixture.teams.away.id,
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    league_id: fixture.league.id,
    league_name: fixture.league.name,
    league_country: fixture.league.country,
    season: fixture.league.season,
    round: fixture.league.round,
    updated_at: new Date().toISOString()
  };
  
  await supabase.from('matches').upsert(match, { onConflict: 'id' });
  const { ensureTeamsInStaticTeams } = require('./databaseService');
  await ensureTeamsInStaticTeams([fixture]);
}

// ============================================
// PHASE 6: NATIONAL TEAMS (~625 çağrı)
// ============================================

async function syncNationalTeams(maxCalls) {
  console.log('\n🌍 PHASE 6: National Teams Sync');
  syncState.currentPhase = 'NATIONAL_TEAMS';
  
  // Milli takımları bul
  const { data: nationalTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach')
    .eq('country', 'World')
    .is('coach', null)
    .limit(maxCalls);
  
  console.log(`   Processing ${nationalTeams?.length || 0} national teams`);
  
  let updated = 0;
  let calls = 0;
  
  for (const team of (nationalTeams || [])) {
    if (calls >= maxCalls) break;
    
    try {
      const coachData = await apiRequest('/coachs', { team: team.api_football_id });
      calls++;
      
      if (coachData.response?.length > 0) {
        const { selectActiveCoach } = require('../utils/selectActiveCoach');
        const selected = selectActiveCoach(coachData.response, team.api_football_id);
        if (selected) {
          await supabase
            .from('static_teams')
            .update({
              coach: selected.name,
              coach_api_id: selected.id,
            last_updated: new Date().toISOString()
          })
          .eq('api_football_id', team.api_football_id);
          updated++;
        }
      }
    } catch (error) {
      // Skip
    }
  }
  
  console.log(`   ✅ ${updated} national teams updated`);
  return calls;
}

// ============================================
// MAIN SYNC ORCHESTRATOR
// ============================================

async function runComprehensiveSync() {
  if (syncState.isRunning) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }
  
  syncState.isRunning = true;
  syncState.lastSyncTime = new Date();
  syncState.apiCallsThisSync = 0;
  syncState.stats = { teamsUpdated: 0, playersUpdated: 0, matchesUpdated: 0, ratingsUpdated: 0, errors: [] };
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          COMPREHENSIVE SYNC STARTED                       ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Time: ${syncState.lastSyncTime.toISOString()}              ║`);
  console.log(`║  Budget: ${CONFIG.API_CALLS_PER_SYNC} API calls                            ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const budget = CONFIG.API_CALLS_PER_SYNC;
  const allocation = CONFIG.BUDGET_ALLOCATION;
  
  try {
    // Phase 1: Live Matches (5%)
    await syncLiveMatches();
    
    // Phase 2: Player Ratings (35%)
    const ratingsCalls = Math.floor(budget * allocation.PLAYER_RATINGS / 100);
    await syncPlayerRatings(ratingsCalls);
    
    // Phase 3: Team Info (15%)
    const teamInfoCalls = Math.floor(budget * allocation.TEAM_INFO / 100);
    await syncTeamInfo(teamInfoCalls);
    
    // Phase 4: Squads (20%)
    const squadsCalls = Math.floor(budget * allocation.SQUADS / 100);
    await syncSquads(squadsCalls);
    
    // Phase 5: Matches (20%)
    const matchesCalls = Math.floor(budget * allocation.MATCHES / 100);
    await syncMatches(matchesCalls);
    
    // Phase 6: National Teams (5%)
    const nationalCalls = Math.floor(budget * allocation.NATIONAL_TEAMS / 100);
    await syncNationalTeams(nationalCalls);
    
  } catch (error) {
    console.error('❌ Fatal sync error:', error);
    syncState.stats.errors.push({ type: 'FATAL', error: error.message });
  }
  
  syncState.isRunning = false;
  
  const duration = Math.round((new Date() - syncState.lastSyncTime) / 1000);
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          COMPREHENSIVE SYNC COMPLETED                     ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Duration: ${duration}s                                           ║`);
  console.log(`║  API Calls Used: ${syncState.apiCallsThisSync}                               ║`);
  console.log(`║  Teams Updated: ${syncState.stats.teamsUpdated}                                  ║`);
  console.log(`║  Ratings Updated: ${syncState.stats.ratingsUpdated}                                ║`);
  console.log(`║  Matches Updated: ${syncState.stats.matchesUpdated}                                ║`);
  console.log(`║  Errors: ${syncState.stats.errors.length}                                          ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  return syncState.stats;
}

// ============================================
// SCHEDULER
// ============================================

let syncTimer = null;

function startScheduler() {
  if (syncTimer) {
    console.log('⚠️ Scheduler already running');
    return;
  }
  
  console.log('\n🚀 Starting Comprehensive Sync Scheduler');
  console.log(`   Interval: ${CONFIG.SYNC_INTERVAL_MS / 1000 / 60 / 60} hours`);
  console.log(`   API Budget per sync: ${CONFIG.API_CALLS_PER_SYNC}`);
  console.log(`   Daily API Budget: ${CONFIG.DAILY_API_LIMIT}`);
  console.log('');
  
  // İlk sync'i 30 saniye sonra başlat
  setTimeout(() => {
    runComprehensiveSync();
  }, 30000);
  
  // 4 saatte bir tekrarla
  syncTimer = setInterval(() => {
    runComprehensiveSync();
  }, CONFIG.SYNC_INTERVAL_MS);
  
  console.log('✅ Scheduler started');
}

function stopScheduler() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⏹️ Scheduler stopped');
  }
}

function getStatus() {
  return {
    isSchedulerRunning: syncTimer !== null,
    ...syncState,
    config: CONFIG
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  runComprehensiveSync,
  startScheduler,
  stopScheduler,
  getStatus,
  CONFIG
};

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  console.log('Running comprehensive sync manually...');
  runComprehensiveSync().then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
