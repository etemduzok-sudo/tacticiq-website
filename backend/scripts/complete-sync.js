/**
 * KAPSAMLI DB GÜNCELLEMESİ
 * - Eksik coach'lar
 * - Eksik kadrolar  
 * - Daha fazla lig maçları
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const CURRENT_SEASON = 2025;
let apiCalls = 0;
let updated = { squads: 0, coaches: 0, matches: 0 };

// Ek ligler (henüz güncellenmemiş)
const MORE_LEAGUES = [
  { id: 71, name: 'Serie A Brazil' },
  { id: 128, name: 'Liga Argentina' },
  { id: 253, name: 'MLS' },
  { id: 169, name: 'Chinese Super League' },
  { id: 179, name: 'Scottish Premiership' },
  { id: 106, name: 'Ekstraklasa' },
  { id: 113, name: 'Super League Greece' },
  { id: 235, name: 'Russian Premier League' },
  { id: 333, name: 'Ukrainian Premier League' },
  { id: 1, name: 'World Cup' },
  { id: 4, name: 'Euro Championship' },
  { id: 119, name: 'Danish Superliga' },
  { id: 103, name: 'Norwegian Eliteserien' },
  { id: 113, name: 'Swiss Super League' },
  { id: 218, name: 'Austrian Bundesliga' },
];

async function updateTeamSquadAndCoach(team) {
  try {
    apiCalls++;
    const fixturesData = await footballApi.apiRequest('/fixtures', { 
      team: team.api_football_id, 
      season: CURRENT_SEASON, 
      last: 1 
    });
    
    if (!fixturesData.response?.length) return false;
    
    const matchId = fixturesData.response[0].fixture.id;
    
    apiCalls++;
    const lineupData = await footballApi.apiRequest('/fixtures/lineups', { fixture: matchId });
    
    if (!lineupData.response) return false;
    
    const teamLineup = lineupData.response.find(l => l.team.id === team.api_football_id);
    if (!teamLineup) return false;
    
    // Oyuncuları topla
    const players = [];
    const coach = teamLineup.coach?.name || null;
    
    const allPlayers = [...(teamLineup.startXI || []), ...(teamLineup.substitutes || [])];
    
    allPlayers.forEach(p => {
      const pos = p.player.pos;
      players.push({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        position: pos === 'G' ? 'Goalkeeper' : 
                 pos === 'D' ? 'Defender' :
                 pos === 'M' ? 'Midfielder' :
                 pos === 'F' ? 'Attacker' : (pos || 'Unknown')
      });
    });
    
    if (players.length > 0) {
      await supabase.from('team_squads').upsert({
        team_id: team.api_football_id,
        season: CURRENT_SEASON,
        team_name: team.name,
        team_data: { id: team.api_football_id, name: team.name, coach },
        players: players,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_id,season' });
      updated.squads++;
    }
    
    if (coach) {
      await supabase
        .from('static_teams')
        .update({ coach, last_updated: new Date().toISOString() })
        .eq('api_football_id', team.api_football_id);
      updated.coaches++;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

async function syncLeagueMatches(league) {
  try {
    apiCalls++;
    const data = await footballApi.apiRequest('/fixtures', { 
      league: league.id, 
      season: CURRENT_SEASON 
    });
    
    if (!data.response?.length) {
      console.log(`  ⚠️ ${league.name}: 0`);
      return 0;
    }
    
    let count = 0;
    for (const m of data.response) {
      const record = {
        id: m.fixture.id,
        league_id: m.league.id,
        season: m.league.season,
        round: m.league.round,
        home_team_id: m.teams.home.id,
        away_team_id: m.teams.away.id,
        fixture_date: m.fixture.date,
        fixture_timestamp: m.fixture.timestamp,
        timezone: m.fixture.timezone,
        status: m.fixture.status.short,
        status_long: m.fixture.status.long,
        elapsed: m.fixture.status.elapsed,
        home_score: m.goals.home,
        away_score: m.goals.away,
        halftime_home: m.score.halftime?.home,
        halftime_away: m.score.halftime?.away,
        fulltime_home: m.score.fulltime?.home,
        fulltime_away: m.score.fulltime?.away,
        venue_name: m.fixture.venue?.name,
        venue_city: m.fixture.venue?.city,
        referee: m.fixture.referee,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase.from('matches').upsert(record, { onConflict: 'id' });
      if (!error) count++;
    }
    
    updated.matches += count;
    console.log(`  ✅ ${league.name}: ${count}`);
    return count;
  } catch (err) {
    console.log(`  ❌ ${league.name}: ${err.message}`);
    return 0;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('              KAPSAMLI DB GÜNCELLEMESİ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}\n`);
  
  // 1. Eksik coach olan takımları güncelle
  console.log('📋 ADIM 1: EKSİK COACH GÜNCELLEME...\n');
  
  const { data: teamsWithoutCoach } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
    .limit(500);
  
  console.log(`  ${teamsWithoutCoach?.length || 0} takımın coach'u eksik`);
  
  let processed = 0;
  for (const team of (teamsWithoutCoach || [])) {
    await updateTeamSquadAndCoach(team);
    processed++;
    
    if (processed % 100 === 0) {
      console.log(`  İlerleme: ${processed}/${teamsWithoutCoach.length}, Coach: ${updated.coaches}, API: ${apiCalls}`);
    }
    
    // Rate limit
    if (apiCalls > 5000) {
      console.log('  ⚠️ API limit yaklaşıyor, durduruluyor...');
      break;
    }
  }
  
  console.log(`\n  ✅ ${updated.coaches} coach güncellendi`);
  
  // 2. Ek liglerin maçlarını güncelle
  console.log('\n📋 ADIM 2: EK LİG MAÇLARI...\n');
  
  for (const league of MORE_LEAGUES) {
    await syncLeagueMatches(league);
    await new Promise(r => setTimeout(r, 300));
  }
  
  // ÖZET
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`API: ${apiCalls} | Kadro: ${updated.squads} | Coach: ${updated.coaches} | Maç: ${updated.matches}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
