#!/usr/bin/env node
// DB'deki tüm takımları listele ve API-Football ID'leri ile karşılaştır

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Supabase credentials missing');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// API'den çekilen doğru ID'ler
const apiTeamsPath = path.join(__dirname, '..', 'data', 'api-football-teams.json');
let apiTeams = null;
if (fs.existsSync(apiTeamsPath)) {
  apiTeams = JSON.parse(fs.readFileSync(apiTeamsPath, 'utf8'));
}

async function check() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Supabase static_teams Tablosu Analizi                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 1. Tüm takımları çek
  const { data: allTeams, error } = await supabase
    .from('static_teams')
    .select('*')
    .order('country', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) {
    console.error('❌ DB Error:', error.message);
    return;
  }
  
  console.log(`📊 TOPLAM TAKIM SAYISI: ${allTeams.length}\n`);
  
  // 2. Ülkelere göre grupla
  const byCountry = {};
  const byLeague = {};
  const byType = { club: 0, national: 0 };
  
  for (const team of allTeams) {
    // Ülke
    if (!byCountry[team.country]) byCountry[team.country] = [];
    byCountry[team.country].push(team);
    
    // Lig
    if (!byLeague[team.league]) byLeague[team.league] = [];
    byLeague[team.league].push(team);
    
    // Tip
    byType[team.team_type] = (byType[team.team_type] || 0) + 1;
  }
  
  // 3. Ülke bazlı özet
  console.log('🌍 ÜLKELERE GÖRE DAĞILIM:');
  const sortedCountries = Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length);
  for (const [country, teams] of sortedCountries) {
    console.log(`   ${country}: ${teams.length} takım`);
  }
  
  console.log('\n📋 LİGLERE GÖRE DAĞILIM:');
  const sortedLeagues = Object.entries(byLeague).sort((a, b) => b[1].length - a[1].length);
  for (const [league, teams] of sortedLeagues) {
    console.log(`   ${league}: ${teams.length} takım`);
  }
  
  console.log(`\n🏆 TİP: Kulüp: ${byType.club || 0}, Milli: ${byType.national || 0}`);
  
  // 4. Türk Süper Lig detayı
  console.log('\n\n🇹🇷 TÜRK SÜPER LİG TAKİMLARI:');
  console.log('─'.repeat(60));
  const turkishTeams = allTeams.filter(t => t.country === 'Turkey' && t.team_type === 'club');
  turkishTeams.forEach(t => {
    const colors = t.colors ? (Array.isArray(t.colors) ? t.colors.join(', ') : t.colors) : 'YOK';
    console.log(`   ${t.api_football_id.toString().padStart(5)}: ${t.name.padEnd(25)} | Renkler: ${colors}`);
  });
  
  // 5. API-Football ile karşılaştır
  if (apiTeams) {
    console.log('\n\n🔍 API-FOOTBALL İLE KARŞILAŞTIRMA:');
    console.log('─'.repeat(60));
    
    // Türk Süper Lig karşılaştırması
    const apiTurkish = apiTeams.leagues['Turkish Süper Lig']?.teams || [];
    const dbTurkishIds = new Set(turkishTeams.map(t => t.api_football_id));
    const apiTurkishIds = new Set(apiTurkish.map(t => t.id));
    
    const missingInDb = apiTurkish.filter(t => !dbTurkishIds.has(t.id));
    const extraInDb = turkishTeams.filter(t => !apiTurkishIds.has(t.api_football_id));
    
    if (missingInDb.length > 0) {
      console.log('\n   ❌ DB\'de EKSİK (API\'de var):');
      missingInDb.forEach(t => console.log(`      ${t.id}: ${t.name}`));
    } else {
      console.log('\n   ✅ Tüm Türk Süper Lig takımları DB\'de mevcut');
    }
    
    if (extraInDb.length > 0) {
      console.log('\n   ⚠️ DB\'de FAZLA (Eski/yanlış ID olabilir):');
      extraInDb.forEach(t => console.log(`      ${t.api_football_id}: ${t.name}`));
    }
  }
  
  // 6. Renk eksik olan takımlar
  console.log('\n\n🎨 RENK DURUMU:');
  const noColors = allTeams.filter(t => !t.colors || (Array.isArray(t.colors) && t.colors.length === 0));
  const withColors = allTeams.length - noColors.length;
  console.log(`   ✅ Rengi olan: ${withColors}`);
  console.log(`   ❌ Rengi olmayan: ${noColors.length}`);
  
  if (noColors.length > 0 && noColors.length <= 20) {
    console.log('\n   Rengi olmayan takımlar:');
    noColors.forEach(t => console.log(`      ${t.api_football_id}: ${t.name} (${t.country})`));
  }
  
  // 7. Özet
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 ÖZET:');
  console.log('═'.repeat(60));
  console.log(`   Toplam Takım: ${allTeams.length}`);
  console.log(`   Ülke Sayısı: ${Object.keys(byCountry).length}`);
  console.log(`   Lig Sayısı: ${Object.keys(byLeague).length}`);
  console.log(`   Kulüp: ${byType.club || 0}`);
  console.log(`   Milli Takım: ${byType.national || 0}`);
  console.log(`   Renkli: ${withColors}`);
  console.log(`   Renksiz: ${noColors.length}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
