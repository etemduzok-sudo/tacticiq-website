/**
 * COACH'U EKSİK TAKIMLARI GÜNCELLE
 * Kadrosu olan ama coach'u olmayan takımları günceller
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const CURRENT_SEASON = 2025;
const MAX_API_CALLS = 65000;

const stats = {
  apiCalls: 0,
  coachesUpdated: 0,
  skipped: 0,
  startTime: Date.now(),
};

async function apiRequest(endpoint, params) {
  if (stats.apiCalls >= MAX_API_CALLS) throw new Error('API limit');
  stats.apiCalls++;
  return await footballApi.apiRequest(endpoint, params);
}

async function updateCoach(team) {
  try {
    const fixturesData = await apiRequest('/fixtures', { 
      team: team.api_football_id, 
      season: CURRENT_SEASON, 
      last: 1 
    });
    
    if (!fixturesData.response?.length) {
      stats.skipped++;
      return null;
    }
    
    const matchId = fixturesData.response[0].fixture.id;
    const lineupData = await apiRequest('/fixtures/lineups', { fixture: matchId });
    
    if (!lineupData.response) {
      stats.skipped++;
      return null;
    }
    
    const teamLineup = lineupData.response.find(l => l.team.id === team.api_football_id);
    if (!teamLineup?.coach?.name) {
      stats.skipped++;
      return null;
    }
    
    const coach = teamLineup.coach.name;
    
    await supabase
      .from('static_teams')
      .update({ coach, last_updated: new Date().toISOString() })
      .eq('api_football_id', team.api_football_id);
    
    stats.coachesUpdated++;
    return coach;
    
  } catch (err) {
    stats.skipped++;
    return null;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         COACH EKSİK TAKIMLARI GÜNCELLE');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Coach'u olmayan takımları al
  const { data: teams } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
    .order('api_football_id');
  
  console.log(`📋 ${teams?.length || 0} takımın coach'u eksik\n`);
  
  if (!teams?.length) return;
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    
    if (stats.apiCalls >= MAX_API_CALLS - 50) {
      console.log('\n⚠️ API limit');
      break;
    }
    
    const coach = await updateCoach(team);
    
    if (coach) {
      console.log(`[${i + 1}/${teams.length}] ✅ ${team.name}: ${coach}`);
    }
    
    if ((i + 1) % 200 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      console.log(`\n📊 ${i + 1}/${teams.length}, Coach: ${stats.coachesUpdated}, API: ${stats.apiCalls}, ${elapsed}dk\n`);
    }
  }
  
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`Süre: ${elapsed}dk | API: ${stats.apiCalls} | Coach: ${stats.coachesUpdated} | Atlanan: ${stats.skipped}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
