#!/usr/bin/env node
/**
 * Sadece Türk Süper Lig takımlarını senkronize et
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BASE_URL = 'https://v3.football.api-sports.io';
const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

// Türk takım renkleri
const TURKISH_COLORS = {
  549: ['#000000', '#FFFFFF'], // Beşiktaş
  564: ['#F37021', '#000000'], // Başakşehir
  607: ['#006633', '#FFFFFF'], // Konyaspor
  611: ['#FFED00', '#00205B'], // Fenerbahçe
  645: ['#FF0000', '#FFD700'], // Galatasaray
  994: ['#FFD700', '#C8102E'], // Göztepe
  996: ['#FF6600', '#006633'], // Alanyaspor
  998: ['#632134', '#00BFFF'], // Trabzonspor
  1001: ['#FF0000', '#FFD700'], // Kayserispor
  1002: ['#FF0000', '#FFFFFF'], // Sivasspor
  1004: ['#000066', '#FFFFFF'], // Kasımpaşa
  1005: ['#FF0000', '#FFFFFF'], // Antalyaspor
  1007: ['#006633', '#0000FF'], // Rizespor
  3563: ['#0000FF', '#FFFFFF'], // Adana Demirspor
  3573: ['#C8102E', '#000000'], // Gaziantep
  3575: ['#006633', '#C8102E'], // Hatayspor
  3583: ['#1E90FF', '#FFFFFF'], // BB Bodrumspor
  3588: ['#FFD700', '#000000'], // Eyüpspor
  3603: ['#C8102E', '#FFFFFF'], // Samsunspor
};

async function main() {
  console.log('🇹🇷 Türk Süper Lig Senkronizasyonu\n');
  
  // 2024 sezonu
  const response = await axios.get(`${BASE_URL}/teams`, {
    headers,
    params: { league: 203, season: 2024 }
  });
  
  if (!response.data?.response?.length) {
    console.log('❌ Takım bulunamadı');
    return;
  }
  
  const teams = response.data.response;
  console.log(`✅ ${teams.length} takım bulundu\n`);
  
  let success = 0;
  for (const team of teams) {
    const colors = TURKISH_COLORS[team.team.id] || ['#E30A17', '#FFFFFF'];
    
    const teamData = {
      api_football_id: team.team.id,
      name: team.team.name,
      country: 'Turkey',
      league: 'Süper Lig',
      league_type: 'domestic_top',
      team_type: 'club',
      colors: colors,
      colors_primary: colors[0],
      colors_secondary: colors[1],
      logo_url: team.team.logo,
      last_updated: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('static_teams')
      .upsert(teamData, { onConflict: 'api_football_id' });
    
    if (error) {
      console.log(`❌ ${team.team.name}: ${error.message}`);
    } else {
      console.log(`✅ ${team.team.id}: ${team.team.name}`);
      success++;
    }
  }
  
  console.log(`\n📊 Sonuç: ${success}/${teams.length} takım kaydedildi`);
  
  // Kadroları da çek
  console.log('\n📋 Kadrolar çekiliyor...\n');
  
  for (const team of teams) {
    const squadRes = await axios.get(`${BASE_URL}/players/squads`, {
      headers,
      params: { team: team.team.id }
    });
    
    if (squadRes.data?.response?.[0]?.players) {
      const players = squadRes.data.response[0].players;
      
      const { error } = await supabase
        .from('team_squads')
        .upsert({
          team_id: team.team.id,
          team_name: team.team.name,
          season: 2025,
          players: players,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,season' });
      
      if (!error) {
        console.log(`💾 ${team.team.name}: ${players.length} oyuncu`);
      }
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n✅ Tamamlandı!');
}

main().catch(console.error);
