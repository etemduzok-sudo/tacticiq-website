#!/usr/bin/env node
/**
 * Türk Süper Lig takımlarının kadrolarını API'den çek
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BASE_URL = 'https://v3.football.api-sports.io';
const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

// Türk Süper Lig takım ID'leri (API-Football)
const TURKISH_TEAMS = [
  { id: 611, name: 'Fenerbahçe' },
  { id: 645, name: 'Galatasaray' },
  { id: 549, name: 'Beşiktaş' },
  { id: 998, name: 'Trabzonspor' },
  { id: 564, name: 'Başakşehir' },
  { id: 3563, name: 'Adana Demirspor' },
  { id: 1005, name: 'Antalyaspor' },
  { id: 607, name: 'Konyaspor' },
  { id: 1002, name: 'Sivasspor' },
  { id: 1004, name: 'Kasımpaşa' },
  { id: 994, name: 'Göztepe' },
  { id: 1001, name: 'Kayserispor' },
  { id: 1007, name: 'Rizespor' },
  { id: 3575, name: 'Hatayspor' },
  { id: 3603, name: 'Samsunspor' },
  { id: 3573, name: 'Gaziantep FK' },
  { id: 996, name: 'Alanyaspor' },
  { id: 3588, name: 'Eyüpspor' },
  { id: 3583, name: 'BB Bodrumspor' },
];

let requestCount = 0;

async function fetchSquad(teamId, teamName) {
  try {
    console.log(`\n📥 ${teamName} (ID: ${teamId})...`);
    
    const response = await axios.get(`${BASE_URL}/players/squads`, {
      headers,
      params: { team: teamId }
    });
    
    requestCount++;
    console.log(`   API Request #${requestCount}`);
    
    if (response.data?.response?.[0]?.players) {
      const players = response.data.response[0].players;
      const team = response.data.response[0].team;
      
      console.log(`   ✅ ${players.length} oyuncu bulundu`);
      
      // DB'ye kaydet
      const { error } = await supabase
        .from('team_squads')
        .upsert({
          team_id: teamId,
          team_name: team?.name || teamName,
          season: 2025,
          team_data: team,
          players: players,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,season' });
      
      if (error) {
        console.log(`   ⚠️ DB kayıt hatası: ${error.message}`);
      } else {
        console.log(`   💾 DB'ye kaydedildi`);
      }
      
      return { success: true, playerCount: players.length };
    }
    
    console.log('   ⚠️ Kadro bulunamadı');
    return { success: false, playerCount: 0 };
  } catch (error) {
    console.error(`   ❌ Hata: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Türk Süper Lig Kadro Senkronizasyonu                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  let success = 0, failed = 0;
  
  for (const team of TURKISH_TEAMS) {
    const result = await fetchSquad(team.id, team.name);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
    
    // Rate limiting - 300ms arası
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 ÖZET:');
  console.log('═'.repeat(60));
  console.log(`   Toplam API çağrısı: ${requestCount}`);
  console.log(`   Başarılı: ${success}`);
  console.log(`   Başarısız: ${failed}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
