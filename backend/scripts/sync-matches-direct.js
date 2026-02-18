const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const LEAGUES = [
  { id: 203, name: 'SÃ¼per Lig' },
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
];

let totalMatches = 0;

async function syncLeague(league) {
  const data = await footballApi.apiRequest('/fixtures', { 
    league: league.id, 
    season: 2025 
  });
  
  if (!data.response?.length) {
    console.log('  âš ï¸ ' + league.name + ': 0 maÃ§');
    return;
  }
  
  let updated = 0;
  for (const m of data.response) {
    const { error } = await supabase.from('matches').upsert({
      api_football_id: m.fixture.id,
      home_team_id: m.teams.home.id,
      away_team_id: m.teams.away.id,
      home_team_name: m.teams.home.name,
      away_team_name: m.teams.away.name,
      home_score: m.goals.home,
      away_score: m.goals.away,
      status: m.fixture.status.short,
      match_date: m.fixture.date,
      league_id: m.league.id,
      league_name: m.league.name,
      season: m.league.season,
      round: m.league.round,
      venue_name: m.fixture.venue?.name,
      venue_city: m.fixture.venue?.city,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'api_football_id' });
    if (!error) updated++;
  }
  
  totalMatches += updated;
  console.log('  âœ… ' + league.name + ': ' + updated + ' maÃ§');
}

async function run() {
  console.log('=== MAÃ‡ GÃœNCELLEMESÄ° ===\\n');
  
  for (const league of LEAGUES) {
    await syncLeague(league);
  }
  
  console.log('\\n=== TOPLAM: ' + totalMatches + ' maÃ§ gÃ¼ncellendi ===');
}

run();
