#!/usr/bin/env node
/**
 * TÜM DÜNYA 1. LİGLERİ - TAM SENKRONİZASYON
 * 127 lig, ~2300 takım, ~2300 kadro
 * 
 * Tahmini süre: 30-45 dakika
 * Tahmini API çağrısı: ~2500
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Credentials missing');
  console.log('   API_KEY:', API_KEY ? '✓' : '✗');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.log('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BASE_URL = 'https://v3.football.api-sports.io';
const headers = {
  'x-apisports-key': API_KEY,
};

// 127 dünya 1. ligi
const TOP_TIER_LEAGUES = {
  // Europe - Big 5
  'England': { id: 39, name: 'Premier League' },
  'Spain': { id: 140, name: 'La Liga' },
  'Germany': { id: 78, name: 'Bundesliga' },
  'Italy': { id: 135, name: 'Serie A' },
  'France': { id: 61, name: 'Ligue 1' },
  // Europe - Other
  'Netherlands': { id: 88, name: 'Eredivisie' },
  'Portugal': { id: 94, name: 'Primeira Liga' },
  'Belgium': { id: 144, name: 'Jupiler Pro League' },
  'Turkey': { id: 203, name: 'Süper Lig' },
  'Russia': { id: 235, name: 'Premier League' },
  'Ukraine': { id: 333, name: 'Premier League' },
  'Scotland': { id: 179, name: 'Premiership' },
  'Austria': { id: 218, name: 'Bundesliga' },
  'Switzerland': { id: 207, name: 'Super League' },
  'Greece': { id: 197, name: 'Super League' },
  'Denmark': { id: 119, name: 'Superliga' },
  'Norway': { id: 103, name: 'Eliteserien' },
  'Sweden': { id: 113, name: 'Allsvenskan' },
  'Poland': { id: 106, name: 'Ekstraklasa' },
  'Czech-Republic': { id: 345, name: 'Czech Liga' },
  'Croatia': { id: 210, name: 'HNL' },
  'Serbia': { id: 286, name: 'Super Liga' },
  'Romania': { id: 283, name: 'Liga I' },
  'Bulgaria': { id: 172, name: 'First League' },
  'Hungary': { id: 271, name: 'NB I' },
  'Cyprus': { id: 318, name: 'First Division' },
  'Israel': { id: 384, name: 'Ligat Ha\'al' },
  'Finland': { id: 244, name: 'Veikkausliiga' },
  'Iceland': { id: 164, name: 'Úrvalsdeild' },
  'Ireland': { id: 357, name: 'Premier Division' },
  'Northern-Ireland': { id: 408, name: 'Premiership' },
  'Wales': { id: 110, name: 'Premier League' },
  'Slovakia': { id: 332, name: 'Super Liga' },
  'Slovenia': { id: 373, name: 'PrvaLiga' },
  'Belarus': { id: 116, name: 'Premier League' },
  'Kazakhstan': { id: 387, name: 'Premier League' },
  'Azerbaijan': { id: 420, name: 'Premyer Liqa' },
  'Georgia': { id: 325, name: 'Erovnuli Liga' },
  'Armenia': { id: 342, name: 'Premier League' },
  'Moldova': { id: 441, name: 'Super Liga' },
  'Bosnia': { id: 155, name: 'Premijer Liga' },
  'North-Macedonia': { id: 428, name: 'First League' },
  'Montenegro': { id: 423, name: 'First League' },
  'Albania': { id: 310, name: 'Superliga' },
  'Kosovo': { id: 409, name: 'Superliga' },
  'Luxembourg': { id: 261, name: 'National Division' },
  'Malta': { id: 392, name: 'Premier League' },
  'Estonia': { id: 329, name: 'Meistriliiga' },
  'Latvia': { id: 363, name: 'Virsliga' },
  'Lithuania': { id: 360, name: 'A Lyga' },
  'Faroe-Islands': { id: 370, name: 'Premier League' },
  // South America
  'Brazil': { id: 71, name: 'Serie A' },
  'Argentina': { id: 128, name: 'Liga Profesional' },
  'Colombia': { id: 239, name: 'Liga BetPlay' },
  'Chile': { id: 265, name: 'Primera División' },
  'Uruguay': { id: 268, name: 'Primera División' },
  'Paraguay': { id: 274, name: 'División Profesional' },
  'Peru': { id: 281, name: 'Liga 1' },
  'Ecuador': { id: 242, name: 'Liga Pro' },
  'Venezuela': { id: 299, name: 'Primera División' },
  'Bolivia': { id: 158, name: 'División Profesional' },
  // North/Central America
  'Mexico': { id: 262, name: 'Liga MX' },
  'USA': { id: 253, name: 'MLS' },
  'Costa-Rica': { id: 162, name: 'Primera División' },
  'Honduras': { id: 247, name: 'Liga Nacional' },
  'Guatemala': { id: 240, name: 'Liga Nacional' },
  'El-Salvador': { id: 230, name: 'Primera División' },
  'Panama': { id: 277, name: 'Liga Panameña' },
  'Jamaica': { id: 256, name: 'Premier League' },
  // Asia
  'Japan': { id: 98, name: 'J1 League' },
  'South-Korea': { id: 292, name: 'K League 1' },
  'China': { id: 169, name: 'Super League' },
  'Saudi-Arabia': { id: 307, name: 'Pro League' },
  'United-Arab-Emirates': { id: 301, name: 'Pro League' },
  'Qatar': { id: 305, name: 'Stars League' },
  'Iran': { id: 252, name: 'Persian Gulf Pro League' },
  'Thailand': { id: 296, name: 'Thai League 1' },
  'Australia': { id: 188, name: 'A-League' },
  'India': { id: 323, name: 'Indian Super League' },
  'Indonesia': { id: 249, name: 'Liga 1' },
  'Malaysia': { id: 378, name: 'Super League' },
  'Singapore': { id: 382, name: 'Premier League' },
  'Vietnam': { id: 340, name: 'V.League 1' },
  'Iraq': { id: 254, name: 'Stars League' },
  'Jordan': { id: 258, name: 'Pro League' },
  'Kuwait': { id: 259, name: 'Premier League' },
  'Bahrain': { id: 149, name: 'Premier League' },
  'Oman': { id: 269, name: 'Professional League' },
  'Lebanon': { id: 390, name: 'Premier League' },
  'Syria': { id: 440, name: 'Premier League' },
  'Uzbekistan': { id: 352, name: 'Super League' },
  'Hong-Kong': { id: 365, name: 'Premier League' },
  // Africa
  'Egypt': { id: 233, name: 'Premier League' },
  'Morocco': { id: 200, name: 'Botola Pro' },
  'Tunisia': { id: 202, name: 'Ligue 1' },
  'Algeria': { id: 186, name: 'Ligue 1' },
  'South-Africa': { id: 288, name: 'Premier Soccer League' },
  'Nigeria': { id: 267, name: 'NPFL' },
  'Ghana': { id: 237, name: 'Premier League' },
  'Ivory-Coast': { id: 355, name: 'Ligue 1' },
  'Senegal': { id: 368, name: 'Ligue 1' },
  'Cameroon': { id: 159, name: 'Elite One' },
  'DR-Congo': { id: 228, name: 'Linafoot' },
  'Tanzania': { id: 419, name: 'Premier League' },
  'Kenya': { id: 396, name: 'Premier League' },
  'Uganda': { id: 412, name: 'Premier League' },
  'Zambia': { id: 255, name: 'Super League' },
  'Zimbabwe': { id: 351, name: 'Premier Soccer League' },
  'Angola': { id: 381, name: 'Girabola' },
  'Mozambique': { id: 372, name: 'Moçambola' },
  'Ethiopia': { id: 358, name: 'Premier League' },
  'Sudan': { id: 398, name: 'Premier League' },
  'Libya': { id: 374, name: 'Premier League' },
  'Mali': { id: 375, name: 'Première Division' },
  'Burkina-Faso': { id: 324, name: 'Premier League' },
  'Niger': { id: 400, name: 'Ligue 1' },
  'Guinea': { id: 320, name: 'Ligue 1' },
  'Benin': { id: 316, name: 'Ligue Pro' },
  'Togo': { id: 399, name: 'Championnat National' },
  'Rwanda': { id: 385, name: 'Premier League' },
  'Burundi': { id: 354, name: 'Ligue A' },
  'Malawi': { id: 376, name: 'Super League' },
  'Botswana': { id: 359, name: 'Premier League' },
  'Namibia': { id: 377, name: 'Premier League' },
  'Mauritius': { id: 397, name: 'Premier League' },
  // Oceania
  'New-Zealand': { id: 167, name: 'Premiership' },
};

// İstatistikler
let stats = {
  apiRequests: 0,
  leaguesProcessed: 0,
  teamsFound: 0,
  teamsInserted: 0,
  squadsFound: 0,
  squadsInserted: 0,
  errors: []
};

// Varsayılan renkler (ülke bazlı)
const DEFAULT_COLORS = {
  'England': ['#FF0000', '#FFFFFF'],
  'Spain': ['#FF0000', '#FFFF00'],
  'Germany': ['#000000', '#FFFFFF'],
  'Italy': ['#0000FF', '#FFFFFF'],
  'France': ['#0055A4', '#FFFFFF'],
  'Turkey': ['#E30A17', '#FFFFFF'],
  'Brazil': ['#009739', '#FFDF00'],
  'Argentina': ['#75AADB', '#FFFFFF'],
  'default': ['#333333', '#FFFFFF']
};

function getDefaultColors(country) {
  return DEFAULT_COLORS[country] || DEFAULT_COLORS['default'];
}

async function apiRequest(endpoint, params = {}) {
  stats.apiRequests++;
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { headers, params });
    
    // Rate limit kontrolü
    const remaining = response.headers['x-ratelimit-requests-remaining'];
    if (remaining && parseInt(remaining) < 100) {
      console.log(`   ⚠️ API limit yaklaşıyor: ${remaining} kaldı`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('   ⏳ Rate limit! 60 saniye bekleniyor...');
      await sleep(60000);
      return apiRequest(endpoint, params);
    }
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTeamsForLeague(leagueId, leagueName, country) {
  try {
    const data = await apiRequest('/teams', { league: leagueId, season: 2024 });
    
    if (!data.response || data.response.length === 0) {
      // 2025 sezonunu dene
      const data2025 = await apiRequest('/teams', { league: leagueId, season: 2025 });
      if (data2025.response && data2025.response.length > 0) {
        return data2025.response;
      }
      return [];
    }
    
    return data.response;
  } catch (error) {
    stats.errors.push(`Teams fetch error for ${leagueName}: ${error.message}`);
    return [];
  }
}

async function fetchSquad(teamId, teamName) {
  try {
    const data = await apiRequest('/players/squads', { team: teamId });
    
    if (data.response && data.response[0]?.players) {
      return data.response[0].players;
    }
    return null;
  } catch (error) {
    stats.errors.push(`Squad fetch error for ${teamName}: ${error.message}`);
    return null;
  }
}

async function fetchCoach(teamId) {
  try {
    const data = await apiRequest('/coachs', { team: teamId });
    const coach = data.response?.find(c => c.career?.some(car => car.team?.id === teamId && !car.end));
    return coach?.name || null;
  } catch (error) {
    return null;
  }
}

async function saveTeamToDB(team, country, leagueName) {
  const colors = getDefaultColors(country);
  
  const teamData = {
    api_football_id: team.team.id,
    name: team.team.name,
    country: country,
    league: leagueName,
    league_type: 'domestic_top',
    team_type: 'club',
    colors: colors,
    colors_primary: colors[0],
    colors_secondary: colors[1],
    logo_url: team.team.logo || null,
    last_updated: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('static_teams')
    .upsert(teamData, { onConflict: 'api_football_id' });
  
  if (error) {
    stats.errors.push(`DB save error for ${team.team.name}: ${error.message}`);
    return false;
  }
  
  stats.teamsInserted++;
  return true;
}

async function saveSquadToDB(teamId, teamName, players, coachName) {
  const squadData = {
    team_id: teamId,
    team_name: teamName,
    season: 2025,
    team_data: { id: teamId, name: teamName, coach: coachName || null },
    players: players,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('team_squads')
    .upsert(squadData, { onConflict: 'team_id,season' });
  
  if (error) {
    stats.errors.push(`Squad save error for ${teamName}: ${error.message}`);
    return false;
  }
  
  stats.squadsInserted++;
  return true;
}

async function processLeague(country, league) {
  console.log(`\n📋 ${country} - ${league.name} (ID: ${league.id})`);
  
  // 1. Takımları çek
  const teams = await fetchTeamsForLeague(league.id, league.name, country);
  
  if (teams.length === 0) {
    console.log(`   ⚠️ Takım bulunamadı`);
    return;
  }
  
  console.log(`   ✅ ${teams.length} takım bulundu`);
  stats.teamsFound += teams.length;
  
  // 2. Her takımı işle
  for (const team of teams) {
    // Takımı kaydet (renkler dahil)
    await saveTeamToDB(team, country, league.name);
    
    // Kadro + Teknik direktör çek
    const players = await fetchSquad(team.team.id, team.team.name);
    let coachName = null;
    if (players) {
      stats.squadsFound++;
      coachName = await fetchCoach(team.team.id);
      await saveSquadToDB(team.team.id, team.team.name, players, coachName);
    }
    
    // Rate limiting - 250ms arası
    await sleep(250);
  }
  
  stats.leaguesProcessed++;
  console.log(`   💾 ${teams.length} takım kaydedildi`);
}

async function main() {
  const startTime = Date.now();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TÜM DÜNYA 1. LİGLERİ - TAM SENKRONİZASYON                    ║');
  console.log('║   127 Lig | ~2300 Takım | ~2300 Kadro                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const leagues = Object.entries(TOP_TIER_LEAGUES);
  console.log(`📊 İşlenecek lig sayısı: ${leagues.length}\n`);
  
  // İlerleme dosyası
  const progressFile = path.join(__dirname, '..', 'data', 'sync-progress.json');
  let startIndex = 0;
  
  // Eğer önceden yarıda kalmışsa devam et
  if (fs.existsSync(progressFile)) {
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    if (progress.lastProcessedIndex !== undefined) {
      startIndex = progress.lastProcessedIndex + 1;
      stats = progress.stats || stats;
      console.log(`🔄 Kaldığı yerden devam ediliyor: ${startIndex}/${leagues.length}\n`);
    }
  }
  
  // Her ligi işle
  for (let i = startIndex; i < leagues.length; i++) {
    const [country, league] = leagues[i];
    
    console.log(`\n[${ i + 1}/${leagues.length}] ════════════════════════════════════`);
    
    try {
      await processLeague(country, league);
    } catch (error) {
      console.error(`   ❌ Hata: ${error.message}`);
      stats.errors.push(`League error ${country}: ${error.message}`);
    }
    
    // İlerlemeyi kaydet
    fs.writeFileSync(progressFile, JSON.stringify({
      lastProcessedIndex: i,
      stats,
      updatedAt: new Date().toISOString()
    }, null, 2));
    
    // Her 10 ligde bir özet
    if ((i + 1) % 10 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n📊 İLERLEME: ${i + 1}/${leagues.length} lig | ${stats.teamsFound} takım | ${stats.squadsFound} kadro | ${stats.apiRequests} API | ${elapsed}s`);
    }
  }
  
  // Sonuç
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 TAMAMLANDI!');
  console.log('═'.repeat(70));
  console.log(`   Toplam süre       : ${Math.floor(totalTime / 60)} dakika ${totalTime % 60} saniye`);
  console.log(`   API istekleri     : ${stats.apiRequests}`);
  console.log(`   İşlenen lig       : ${stats.leaguesProcessed}`);
  console.log(`   Bulunan takım     : ${stats.teamsFound}`);
  console.log(`   Kaydedilen takım  : ${stats.teamsInserted}`);
  console.log(`   Bulunan kadro     : ${stats.squadsFound}`);
  console.log(`   Kaydedilen kadro  : ${stats.squadsInserted}`);
  console.log(`   Hatalar           : ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️ HATALAR:');
    stats.errors.slice(0, 20).forEach(e => console.log(`   - ${e}`));
    if (stats.errors.length > 20) {
      console.log(`   ... ve ${stats.errors.length - 20} hata daha`);
    }
  }
  
  // İlerleme dosyasını temizle
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }
  
  // Sonuçları kaydet
  const resultFile = path.join(__dirname, '..', 'data', 'sync-result.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    completedAt: new Date().toISOString(),
    duration: totalTime,
    stats
  }, null, 2));
  
  console.log(`\n💾 Sonuçlar kaydedildi: ${resultFile}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
