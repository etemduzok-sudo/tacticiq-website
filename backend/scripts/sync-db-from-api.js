#!/usr/bin/env node
/**
 * API-Football'dan çekilen takım verilerini Supabase'e senkronize et
 * Tüm ligleri doğru ID'lerle günceller
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// API'den çekilen veriler
const apiTeamsPath = path.join(__dirname, '..', 'data', 'api-football-teams.json');
if (!fs.existsSync(apiTeamsPath)) {
  console.log('❌ API teams data not found. Run sync-all-team-ids.js first');
  process.exit(1);
}
const apiData = JSON.parse(fs.readFileSync(apiTeamsPath, 'utf8'));

// Takım renkleri (manuel tanımlı)
const TEAM_COLORS = {
  // Turkish Süper Lig
  611: ['#FFED00', '#00205B'], // Fenerbahçe
  645: ['#FF0000', '#FFD700'], // Galatasaray
  549: ['#000000', '#FFFFFF'], // Beşiktaş
  998: ['#632134', '#00BFFF'], // Trabzonspor
  564: ['#F37021', '#000000'], // Başakşehir
  3563: ['#0000FF', '#FFFFFF'], // Adana Demirspor
  1005: ['#FF0000', '#FFFFFF'], // Antalyaspor
  607: ['#006633', '#FFFFFF'], // Konyaspor
  1002: ['#FF0000', '#FFFFFF'], // Sivasspor
  1004: ['#000066', '#FFFFFF'], // Kasımpaşa
  994: ['#FFD700', '#C8102E'], // Göztepe
  1001: ['#FF0000', '#FFD700'], // Kayserispor
  1007: ['#006633', '#0000FF'], // Rizespor
  3575: ['#006633', '#C8102E'], // Hatayspor
  3603: ['#C8102E', '#FFFFFF'], // Samsunspor
  3573: ['#C8102E', '#000000'], // Gaziantep
  996: ['#FF6600', '#006633'], // Alanyaspor
  3588: ['#FFD700', '#000000'], // Eyüpspor
  3583: ['#1E90FF', '#FFFFFF'], // BB Bodrumspor
  // Premier League
  50: ['#6CABDD', '#1C2C5B'], 33: ['#DA291C', '#FBE122'], 40: ['#C8102E', '#00B2A9'],
  42: ['#EF0107', '#FFFFFF'], 49: ['#034694', '#FFFFFF'], 47: ['#132257', '#FFFFFF'],
  66: ['#670E36', '#95BFE5'], 34: ['#241F20', '#FFFFFF'], 48: ['#7A263A', '#1BB1E7'],
  51: ['#0057B8', '#FFFFFF'], 52: ['#1B458F', '#C4122E'], 55: ['#E30613', '#FFB81C'],
  36: ['#000000', '#FFFFFF'], 39: ['#FDB913', '#231F20'], 35: ['#DA291C', '#000000'],
  65: ['#DD0000', '#FFFFFF'], 45: ['#003399', '#FFFFFF'], 46: ['#003090', '#FDBE11'],
  41: ['#D71920', '#FFFFFF'], 57: ['#0000FF', '#FFFFFF'],
  // La Liga
  541: ['#FFFFFF', '#00529F'], 529: ['#004D98', '#A50044'], 530: ['#CB3524', '#FFFFFF'],
  536: ['#F43333', '#FFFFFF'], 533: ['#FFE667', '#005487'], 548: ['#143C8B', '#FFFFFF'],
  543: ['#00954C', '#FFFFFF'], 531: ['#EE2523', '#FFFFFF'], 532: ['#FFFFFF', '#EE7D00'],
  534: ['#FFD700', '#0000FF'], 547: ['#CD2534', '#FFFFFF'], 727: ['#D91A21', '#000066'],
  538: ['#8AC3EE', '#FFFFFF'], 798: ['#E20E17', '#000000'], 728: ['#FFFFFF', '#E30613'],
  546: ['#005999', '#FFFFFF'], 542: ['#0039A6', '#FFFFFF'], 540: ['#007FC8', '#FFFFFF'],
  537: ['#0055A5', '#FFFFFF'], 720: ['#6F2C91', '#FFFFFF'],
  // Bundesliga
  157: ['#DC052D', '#FFFFFF'], 165: ['#FDE100', '#000000'], 168: ['#E32221', '#000000'],
  173: ['#DD0741', '#FFFFFF'], 169: ['#E1000F', '#000000'], 172: ['#E32219', '#FFFFFF'],
  161: ['#65B32E', '#FFFFFF'], 163: ['#000000', '#FFFFFF'], 160: ['#E2001A', '#000000'],
  167: ['#1961B5', '#FFFFFF'], 182: ['#EB1923', '#FFFFFF'], 162: ['#1D9053', '#FFFFFF'],
  170: ['#BA3733', '#FFFFFF'], 164: ['#C3141E', '#FFFFFF'], 176: ['#005BA1', '#FFFFFF'],
  180: ['#E30613', '#0046AA'], 186: ['#6D4C2F', '#FFFFFF'], 191: ['#003DA5', '#FFFFFF'],
  // Serie A
  489: ['#AC1818', '#000000'], 505: ['#010E80', '#000000'], 496: ['#000000', '#FFFFFF'],
  492: ['#12A0D7', '#FFFFFF'], 497: ['#8E1F2F', '#F0BC42'], 487: ['#87D8F7', '#FFFFFF'],
  499: ['#1E71B8', '#000000'], 502: ['#482E92', '#FFFFFF'], 500: ['#A11E22', '#1A2F4E'],
  503: ['#8B0000', '#FFFFFF'], 494: ['#000000', '#FFFFFF'], 495: ['#A52A2A', '#00205B'],
  1579: ['#CE2029', '#FFFFFF'], 867: ['#FFD700', '#C8102E'], 511: ['#004B93', '#FFFFFF'],
  504: ['#003DA5', '#FFD700'], 490: ['#A52A2A', '#0033A0'], 523: ['#FFFF00', '#0000FF'],
  517: ['#FF6600', '#000000'], 895: ['#0047AB', '#FFFFFF'],
  // Ligue 1
  85: ['#004170', '#DA291C'], 81: ['#2FAEE0', '#FFFFFF'], 80: ['#0046A0', '#E10000'],
  91: ['#C8102E', '#FFFFFF'], 79: ['#C8102E', '#FFFFFF'], 94: ['#D4111E', '#000000'],
  84: ['#C8102E', '#000000'], 116: ['#FFD100', '#C8102E'], 95: ['#0055A4', '#FFFFFF'],
  106: ['#E2001A', '#FFFFFF'], 83: ['#009E60', '#FFD700'], 96: ['#5B2E86', '#FFFFFF'],
  93: ['#C8102E', '#FFFFFF'], 82: ['#FF6600', '#003DA5'], 77: ['#000000', '#FFFFFF'],
  1063: ['#006633', '#FFFFFF'], 111: ['#00A0E3', '#FFFFFF'], 108: ['#0055A4', '#FFFFFF'],
  // Eredivisie
  194: ['#D2122E', '#FFFFFF'], 197: ['#E30613', '#FFFFFF'], 209: ['#E30613', '#FFFFFF'],
  201: ['#E30613', '#FFFFFF'], 415: ['#E30613', '#FFFFFF'], 207: ['#CC0000', '#FFFFFF'],
  426: ['#E30613', '#FFFFFF'], 210: ['#003399', '#FFFFFF'], 202: ['#006633', '#FFFFFF'],
  410: ['#FFD700', '#FF0000'], 413: ['#FF0000', '#006633'], 205: ['#FFD700', '#006633'],
  193: ['#0000FF', '#FFFFFF'], 195: ['#E30613', '#FFFFFF'],
  // Primeira Liga
  211: ['#FF0000', '#FFFFFF'], 212: ['#003DA5', '#FFFFFF'], 228: ['#006633', '#FFFFFF'],
  217: ['#FF0000', '#FFFFFF'], 224: ['#000000', '#FFFFFF'], 226: ['#006633', '#FFFFFF'],
  222: ['#000000', '#FFFFFF'], 227: ['#FF0000', '#FFFFFF'], 242: ['#0000FF', '#FFFFFF'],
  215: ['#006633', '#FFFFFF'], 230: ['#FFD700', '#0000FF'], 762: ['#FF0000', '#FFFFFF'],
  240: ['#FFD700', '#000000'], 4716: ['#000080', '#FFFFFF'],
  // Argentine Primera
  435: ['#FFFFFF', '#E30613'], 451: ['#0066B3', '#FFFF00'], 460: ['#E30613', '#0000FF'],
  436: ['#FFFFFF', '#0066B3'], 453: ['#E30613', '#FFFFFF'], 450: ['#FFFFFF', '#E30613'],
  438: ['#006633', '#FFFFFF'], 457: ['#CC0000', '#000000'], 437: ['#FFD700', '#0000FF'],
  456: ['#002D62', '#FFFFFF'], 455: ['#0066B3', '#FFFFFF'], 439: ['#0000FF', '#FFFFFF'],
  442: ['#FFD700', '#006633'], 446: ['#800020', '#FFFFFF'], 441: ['#FF0000', '#FFFFFF'],
  445: ['#FFFFFF', '#C8102E'], 434: ['#0066B3', '#FFFFFF'], 449: ['#006633', '#FFFFFF'],
  452: ['#0066B3', '#E30613'], 458: ['#E30613', '#FFFFFF'], 440: ['#87CEEB', '#FFFFFF'],
  473: ['#0000FF', '#FFFFFF'], 474: ['#006633', '#FFFFFF'], 476: ['#FF0000', '#FFFFFF'],
  478: ['#FF0000', '#FFFFFF'], 1064: ['#800020', '#FFFFFF'], 1065: ['#000000', '#FFFFFF'],
  2432: ['#FF0000', '#FFFFFF'],
  // Brasileirão
  131: ['#000000', '#FFFFFF'], 127: ['#C8102E', '#000000'], 121: ['#006437', '#FFFFFF'],
  126: ['#FFFFFF', '#E30613'], 119: ['#E30613', '#FFFFFF'], 130: ['#003366', '#FFFFFF'],
  1062: ['#000000', '#FFFFFF'], 135: ['#0033A0', '#FFFFFF'], 120: ['#000000', '#FFFFFF'],
  124: ['#7F1734', '#00843D'], 133: ['#000000', '#FFFFFF'], 118: ['#003366', '#FFFFFF'],
  134: ['#E30613', '#000000'], 154: ['#003366', '#FFFFFF'], 152: ['#006633', '#FFFFFF'],
  1193: ['#FFD700', '#006633'], 136: ['#E30613', '#000000'], 794: ['#E30613', '#FFFFFF'],
  140: ['#FFD700', '#000000'], 144: ['#FF0000', '#000000'],
  // Saudi Pro League
  2932: ['#0066B3', '#FFFFFF'], 2939: ['#FFD700', '#0000FF'], 2938: ['#000000', '#FFD700'],
  2929: ['#006633', '#FFFFFF'], 2934: ['#006633', '#FFFFFF'], 2940: ['#FFFFFF', '#000000'],
  2936: ['#FFD700', '#006633'], 2931: ['#006633', '#FFFFFF'], 2935: ['#C8102E', '#FFFFFF'],
  2944: ['#800020', '#FFFFFF'], 2956: ['#800020', '#FFD700'], 10511: ['#006633', '#FFFFFF'],
  2928: ['#0066B3', '#FFFFFF'], 2933: ['#FFD700', '#000000'], 2937: ['#FFFFFF', '#C8102E'],
  2961: ['#006633', '#FFFFFF'], 2977: ['#006633', '#FFFFFF'], 10509: ['#FF0000', '#FFFFFF'],
  // Azerbaijan
  556: ['#00AA00', '#FFFFFF'], // Qarabag
  // National Teams
  777: ['#E30A17', '#FFFFFF'], 25: ['#000000', '#DD0000'], 2: ['#002395', '#FFFFFF'],
  10: ['#FFFFFF', '#CF081F'], 9: ['#AA151B', '#F1BF00'], 768: ['#009246', '#FFFFFF'],
  6: ['#009C3B', '#FFDF00'], 26: ['#74ACDF', '#FFFFFF'], 27: ['#006600', '#FF0000'],
  1118: ['#FF6600', '#FFFFFF'], 1: ['#000000', '#FDDA25'], 3: ['#FF0000', '#FFFFFF'],
  24: ['#FFFFFF', '#DC143C'], 772: ['#005BBB', '#FFD500'], 21: ['#C60C30', '#FFFFFF'],
  15: ['#FF0000', '#FFFFFF'],
};

// Lig ismi -> league_type mapping
const LEAGUE_TYPE_MAP = {
  'International': 'international',
  'Süper Lig': 'domestic_top',
  'Premier League': 'domestic_top',
  'La Liga': 'domestic_top',
  'Bundesliga': 'domestic_top',
  'Serie A': 'domestic_top',
  'Ligue 1': 'domestic_top',
  'Eredivisie': 'domestic_top',
  'Primeira Liga': 'domestic_top',
  'Liga Profesional': 'domestic_top',
  'Argentine Primera': 'domestic_top',
  'Brasileirão': 'domestic_top',
  'Saudi Pro League': 'domestic_top',
  'Premyer Liqa': 'domestic_top',
};

async function syncTeams() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   API-Football → Supabase Senkronizasyonu              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const teamsToInsert = [];
  
  // 1. Liglerdeki takımları işle
  for (const [leagueName, leagueData] of Object.entries(apiData.leagues)) {
    if (!leagueData.teams || leagueData.teams.length === 0) continue;
    
    console.log(`\n📋 ${leagueName} (${leagueData.teams.length} takım)`);
    
    for (const team of leagueData.teams) {
      const colors = TEAM_COLORS[team.id] || ['#333333', '#FFFFFF'];
      
      teamsToInsert.push({
        api_football_id: team.id,
        name: team.name,
        country: team.country || leagueName.split(' ')[0],
        league: leagueName.replace('Turkish ', '').replace(' League', ''),
        league_type: LEAGUE_TYPE_MAP[leagueName] || 'domestic_top',
        team_type: team.national ? 'national' : 'club',
        colors: colors,
        colors_primary: colors[0],
        colors_secondary: colors[1] || colors[0],
      });
    }
  }
  
  // 2. Milli takımları ekle
  console.log(`\n🌍 Milli Takımlar (${apiData.nationalTeams.length} takım)`);
  for (const team of apiData.nationalTeams) {
    if (team.name.includes(' W')) continue; // Kadın takımlarını atla
    
    const colors = TEAM_COLORS[team.id] || ['#333333', '#FFFFFF'];
    
    teamsToInsert.push({
      api_football_id: team.id,
      name: team.name,
      country: team.country,
      league: 'International',
      league_type: 'international',
      team_type: 'national',
      colors: colors,
      colors_primary: colors[0],
      colors_secondary: colors[1] || colors[0],
    });
  }
  
  console.log(`\n📊 Toplam ${teamsToInsert.length} takım işlenecek...`);
  
  // 3. Eski yanlış ID'leri sil
  const wrongIds = [551, 562, 556, 3570, 607]; // Eski yanlış Türk takım ID'leri
  console.log('\n🗑️ Eski yanlış ID\'ler siliniyor...');
  for (const wrongId of wrongIds) {
    const { error } = await supabase
      .from('static_teams')
      .delete()
      .eq('api_football_id', wrongId);
    if (!error) {
      console.log(`   ✓ Silindi: ${wrongId}`);
    }
  }
  
  // 4. Batch upsert
  console.log('\n💾 Takımlar veritabanına yazılıyor...');
  
  let success = 0, failed = 0;
  
  // 50'lik batch'ler halinde yaz
  for (let i = 0; i < teamsToInsert.length; i += 50) {
    const batch = teamsToInsert.slice(i, i + 50);
    
    const { error } = await supabase
      .from('static_teams')
      .upsert(batch, { 
        onConflict: 'api_football_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i/50) + 1} hatası:`, error.message);
      failed += batch.length;
    } else {
      success += batch.length;
      console.log(`   ✅ Batch ${Math.floor(i/50) + 1}: ${batch.length} takım`);
    }
  }
  
  console.log(`\n✅ Tamamlandı: ${success} başarılı, ${failed} hatalı`);
  
  // 5. Sonuç özeti
  const { data: finalCount } = await supabase
    .from('static_teams')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 DB'deki toplam takım: ${finalCount?.length || 'bilinmiyor'}`);
}

syncTeams().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
