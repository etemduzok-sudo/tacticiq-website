/**
 * TÜM LİGLERİN MAÇLARINI GÜNCELLE
 * Geçmiş ve gelecek tüm maçları DB'ye kaydeder
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const CURRENT_SEASON = 2025;
const MAX_API_CALLS = 60000;

// Öncelikli ligler (en popüler)
const PRIORITY_LEAGUES = [
  // Avrupa Top 5 + Türkiye
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
  { id: 203, name: 'Süper Lig' },
  // Diğer önemli Avrupa ligleri
  { id: 94, name: 'Primeira Liga' },
  { id: 88, name: 'Eredivisie' },
  { id: 144, name: 'Jupiler Pro League' },
  { id: 179, name: 'Scottish Premiership' },
  { id: 106, name: 'Ekstraklasa' },
  { id: 113, name: 'Super League Greece' },
  { id: 235, name: 'Russian Premier League' },
  { id: 333, name: 'Ukrainian Premier League' },
  // UEFA Turnuvaları
  { id: 2, name: 'Champions League' },
  { id: 3, name: 'Europa League' },
  { id: 848, name: 'Conference League' },
  { id: 4, name: 'Euro Championship' },
  // Güney Amerika
  { id: 13, name: 'Copa Libertadores' },
  { id: 71, name: 'Serie A Brazil' },
  { id: 128, name: 'Liga Profesional Argentina' },
  { id: 11, name: 'Copa America' },
  // Kuzey/Orta Amerika
  { id: 253, name: 'MLS' },
  { id: 262, name: 'Liga MX' },
  { id: 9, name: 'CONCACAF Champions League' },
  // Asya
  { id: 17, name: 'AFC Champions League' },
  { id: 98, name: 'J1 League' },
  { id: 292, name: 'K League 1' },
  { id: 169, name: 'Chinese Super League' },
  { id: 307, name: 'Saudi Pro League' },
  // FIFA
  { id: 1, name: 'World Cup' },
  { id: 15, name: 'FIFA Club World Cup' },
];

const stats = {
  apiCalls: 0,
  matchesUpdated: 0,
  leaguesProcessed: 0,
  startTime: Date.now(),
};

async function apiRequest(endpoint, params) {
  if (stats.apiCalls >= MAX_API_CALLS) throw new Error('API limit');
  stats.apiCalls++;
  return await footballApi.apiRequest(endpoint, params);
}

async function updateLeagueMatches(league) {
  try {
    const data = await apiRequest('/fixtures', { 
      league: league.id, 
      season: CURRENT_SEASON 
    });
    
    if (!data.response?.length) {
      console.log(`  ⚠️ ${league.name}: Maç yok`);
      return 0;
    }
    
    let updated = 0;
    
    for (const match of data.response) {
      const { error } = await supabase.from('matches').upsert({
        api_football_id: match.fixture.id,
        home_team_id: match.teams.home.id,
        away_team_id: match.teams.away.id,
        home_team_name: match.teams.home.name,
        away_team_name: match.teams.away.name,
        home_score: match.goals.home,
        away_score: match.goals.away,
        status: match.fixture.status.short,
        match_date: match.fixture.date,
        league_id: match.league.id,
        league_name: match.league.name,
        season: match.league.season,
        round: match.league.round,
        venue_name: match.fixture.venue?.name,
        venue_city: match.fixture.venue?.city,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'api_football_id' });
      
      if (!error) updated++;
    }
    
    stats.matchesUpdated += updated;
    stats.leaguesProcessed++;
    console.log(`  ✅ ${league.name}: ${updated} maç`);
    return updated;
    
  } catch (err) {
    console.log(`  ❌ ${league.name}: ${err.message}`);
    return 0;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TÜM ÖNCELİKLİ LİGLERİN MAÇLARI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`Lig sayısı: ${PRIORITY_LEAGUES.length}\n`);
  
  for (const league of PRIORITY_LEAGUES) {
    if (stats.apiCalls >= MAX_API_CALLS - 10) {
      console.log('\n⚠️ API limit');
      break;
    }
    await updateLeagueMatches(league);
  }
  
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`Süre: ${elapsed}dk | API: ${stats.apiCalls} | Ligler: ${stats.leaguesProcessed} | Maçlar: ${stats.matchesUpdated}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
