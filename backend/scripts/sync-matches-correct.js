/**
 * MAÇ GÜNCELLEMESİ - DOĞRU ŞEMA
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const LEAGUES = [
  { id: 203, name: 'Süper Lig' },
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
  { id: 2, name: 'Champions League' },
  { id: 3, name: 'Europa League' },
  { id: 848, name: 'Conference League' },
  { id: 94, name: 'Primeira Liga' },
  { id: 88, name: 'Eredivisie' },
  { id: 144, name: 'Jupiler Pro League' },
  { id: 71, name: 'Serie A Brazil' },
  { id: 128, name: 'Liga Argentina' },
  { id: 253, name: 'MLS' },
  { id: 262, name: 'Liga MX' },
];

let totalMatches = 0;
let apiCalls = 0;

async function syncLeague(league) {
  apiCalls++;
  const data = await footballApi.apiRequest('/fixtures', { 
    league: league.id, 
    season: 2025 
  });
  
  if (!data.response?.length) {
    console.log(`  ⚠️ ${league.name}: 0 maç`);
    return;
  }
  
  let updated = 0;
  for (const m of data.response) {
    // Doğru şema kullan
    const record = {
      id: m.fixture.id, // api_football_id yerine id
      league_id: m.league.id,
      season: m.league.season,
      round: m.league.round,
      home_team_id: m.teams.home.id,
      away_team_id: m.teams.away.id,
      fixture_date: m.fixture.date, // match_date yerine fixture_date
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
    
    const { error } = await supabase
      .from('matches')
      .upsert(record, { onConflict: 'id' });
    
    if (!error) updated++;
  }
  
  totalMatches += updated;
  console.log(`  ✅ ${league.name}: ${updated} maç`);
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('              MAÇ GÜNCELLEMESİ (DOĞRU ŞEMA)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}\n`);
  
  for (const league of LEAGUES) {
    await syncLeague(league);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`API: ${apiCalls} | Maç: ${totalMatches}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
