/**
 * MAÇ GÜNCELLEME SCRİPTİ
 * Son 30 gün + gelecek 60 gün maçlarını günceller
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || (process.env.VITE_SUPABASE_URL || '').replace(/'/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const PRIORITY_LEAGUES = [
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
  { id: 203, name: 'Süper Lig' },
  { id: 206, name: 'Türkiye Kupası' },
  { id: 94, name: 'Primeira Liga' },
  { id: 88, name: 'Eredivisie' },
  { id: 144, name: 'Jupiler Pro League' },
  { id: 2, name: 'Champions League' },
  { id: 3, name: 'Europa League' },
  { id: 848, name: 'Conference League' },
];

let apiCalls = 0;
let matchesUpdated = 0;

async function apiRequest(endpoint, params) {
  apiCalls++;
  return await footballApi.apiRequest(endpoint, params);
}

async function updateLeagueMatches(leagueId, leagueName, season) {
  try {
    console.log(`  📅 ${leagueName} (${season}): Tüm sezon maçları...`);
    
    // Tüm sezon maçlarını çek (from/to olmadan)
    const fixturesData = await apiRequest('/fixtures', {
      league: leagueId,
      season: season,
    });
    
    if (!fixturesData.response || fixturesData.response.length === 0) {
      console.log(`  ⚠️ ${leagueName}: Maç bulunamadı`);
      return 0;
    }
    
    const matches = fixturesData.response;
    let updated = 0;
    
    for (const match of matches) {
      const fixture = match.fixture;
      const teams = match.teams;
      const goals = match.goals;
      const league = match.league;
      
      const matchRecord = {
        api_football_id: fixture.id,
        home_team_id: teams.home.id,
        away_team_id: teams.away.id,
        home_team_name: teams.home.name,
        away_team_name: teams.away.name,
        home_score: goals.home,
        away_score: goals.away,
        status: fixture.status.short,
        match_date: fixture.date,
        league_id: league.id,
        league_name: league.name,
        season: league.season,
        round: league.round,
        venue_name: fixture.venue?.name,
        venue_city: fixture.venue?.city,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('matches')
        .upsert(matchRecord, { onConflict: 'api_football_id' });
      
      if (!error) {
        updated++;
      }
    }
    
    matchesUpdated += updated;
    console.log(`  ✅ ${leagueName}: ${updated} maç güncellendi`);
    return updated;
    
  } catch (err) {
    console.error(`  ❌ ${leagueName} hata:`, err.message);
    return 0;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('               MAÇ GÜNCELLEME BAŞLIYOR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log('');
  
  // Sadece güncel sezon 2025-26 (2024 kullanılmaz)
  console.log('📋 2025 Sezonu Maçları:');
  for (const league of PRIORITY_LEAGUES) {
    await updateLeagueMatches(league.id, league.name, 2025);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    TAMAMLANDI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`API çağrısı: ${apiCalls}`);
  console.log(`Maç güncellendi: ${matchesUpdated}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
