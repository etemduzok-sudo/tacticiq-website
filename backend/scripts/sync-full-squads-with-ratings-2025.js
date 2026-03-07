#!/usr/bin/env node
/**
 * TAM KADRO SENKRONİZASYONU - 2025-2026 SEZONU
 * =====================================================
 * 
 * Bu script:
 * 1. Tüm takımları çeker (2025-2026 sezonu)
 * 2. Her takımın kadrosunu çeker (oyuncular)
 * 3. Her oyuncu için GERÇEK yetenekleri çeker (pas, şut, dribling, hız, defans, fizik)
 * 4. Her oyuncu için GERÇEK rating'i hesaplar
 * 5. Teknik direktör bilgilerini çeker
 * 6. Takım renklerini çeker
 * 7. Tümünü DB'ye kaydeder
 * 
 * API Kullanımı:
 * - /teams?league={id}&season=2025 → Takımlar (1 istek/lig)
 * - /players/squads?team={id} → Kadro (1 istek/takım)
 * - /players?id={id}&season=2025 → Oyuncu yetenekleri (1 istek/oyuncu)
 * - /coachs?team={id} → Teknik direktör (1 istek/takım)
 * 
 * Tahmini API kullanımı (127 lig, ~2300 takım, ~50,000 oyuncu):
 * - Takımlar: ~127 istek
 * - Kadrolar: ~2300 istek
 * - Oyuncu yetenekleri: ~50,000 istek
 * - Teknik direktörler: ~2300 istek
 * - TOPLAM: ~54,727 istek (7350 limit içinde değil!)
 * 
 * ÇÖZÜM: Sadece önemli liglerden başla, API limitine göre durdur
 * 
 * Kullanım: node scripts/sync-full-squads-with-ratings-2025.js
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Rating hesaplama fonksiyonlarını import et
const {
  calculatePlayerAttributesFromStats,
  calculateForm,
  getFitnessMultiplier,
  clamp0_100,
} = require('../utils/playerRatingFromStats');

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
  'x-rapidapi-host': 'v3.football.api-sports.io',
};

const CURRENT_SEASON = 2025; // 2025-26 sezonu
const API_LIMIT = 7350; // Kullanıcının API limiti
const API_RESERVE = 50; // Yedek bırak
const MAX_API_CALLS = API_LIMIT - API_RESERVE; // 7300 kullanılabilir

// Rate limiting: API-Football PRO = 10 requests/minute
const REQUEST_INTERVAL = 6000; // 6 saniye (10 req/min)

// ÖNCELİKLİ LİGLER (Süper Lig öncelikli!)
const PRIORITY_LEAGUES = [
  // Türkiye - EN ÖNCE!
  { id: 203, name: 'Süper Lig', country: 'Turkey', priority: 1 },
  
  // Big 5
  { id: 39, name: 'Premier League', country: 'England', priority: 2 },
  { id: 140, name: 'La Liga', country: 'Spain', priority: 3 },
  { id: 78, name: 'Bundesliga', country: 'Germany', priority: 4 },
  { id: 135, name: 'Serie A', country: 'Italy', priority: 5 },
  { id: 61, name: 'Ligue 1', country: 'France', priority: 6 },
  
  // UEFA Kupaları
  { id: 2, name: 'Champions League', country: 'World', priority: 7 },
  { id: 3, name: 'Europa League', country: 'World', priority: 8 },
  
  // Diğer önemli ligler
  { id: 88, name: 'Eredivisie', country: 'Netherlands', priority: 9 },
  { id: 94, name: 'Primeira Liga', country: 'Portugal', priority: 10 },
  { id: 144, name: 'Pro League', country: 'Belgium', priority: 11 },
  { id: 235, name: 'Premier League', country: 'Russia', priority: 12 },
  
  // Uluslararası
  { id: 1, name: 'World Cup', country: 'World', priority: 13 },
  { id: 4, name: 'Euro Championship', country: 'World', priority: 14 },
];

// İstatistikler
let stats = {
  apiRequests: 0,
  leaguesProcessed: 0,
  teamsProcessed: 0,
  squadsProcessed: 0,
  playersProcessed: 0,
  playersWithRatings: 0,
  coachesProcessed: 0,
  errors: [],
};

// Varsayılan renkler
const DEFAULT_COLORS = {
  'England': ['#FF0000', '#FFFFFF'],
  'Spain': ['#FF0000', '#FFFF00'],
  'Germany': ['#000000', '#FFFFFF'],
  'Italy': ['#0000FF', '#FFFFFF'],
  'France': ['#0055A4', '#FFFFFF'],
  'Turkey': ['#E30A17', '#FFFFFF'],
  'Netherlands': ['#FF6600', '#FFFFFF'],
  'Portugal': ['#006600', '#FF0000'],
  'Belgium': ['#FF0000', '#FFFF00'],
  'Russia': ['#0033CC', '#FFFFFF'],
  'default': ['#333333', '#FFFFFF']
};

function getDefaultColors(country) {
  return DEFAULT_COLORS[country] || DEFAULT_COLORS['default'];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API isteği yap (rate limiting ile)
 */
async function apiRequest(endpoint, params = {}) {
  // Rate limiting kontrolü
  if (stats.apiRequests > 0 && stats.apiRequests % 10 === 0) {
    console.log(`   ⏳ Rate limit: 6 saniye bekleniyor... (${stats.apiRequests} istek)`);
    await sleep(REQUEST_INTERVAL);
  }
  
  // API limit kontrolü
  if (stats.apiRequests >= MAX_API_CALLS) {
    throw new Error(`API limit aşıldı! ${stats.apiRequests}/${MAX_API_CALLS} istek kullanıldı`);
  }
  
  stats.apiRequests++;
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { headers, params });
    
    // Rate limit kontrolü
    const remaining = response.headers['x-ratelimit-requests-remaining'];
    if (remaining && parseInt(remaining) < 100) {
      console.log(`   ⚠️ API limit yaklaşıyor: ${remaining} kaldı`);
    }
    
    // Debug: API yanıtını logla (ilk birkaç çağrı için)
    if (stats.apiRequests <= 3) {
      console.log(`   🔍 API Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
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

/**
 * Oyuncu yeteneklerini ve rating'i hesapla
 * API-Football'dan gelen statistics verisinden
 * Mevcut playerRatingFromStats.js fonksiyonlarını kullan
 */
function calculatePlayerAttributes(playerStats) {
  if (!playerStats || !playerStats.statistics || playerStats.statistics.length === 0) {
    return null;
  }
  
  try {
    const latestStats = playerStats.statistics[0];
    const position = playerStats.player?.position || 'M';
    
    // Mevcut fonksiyonu kullan
    const attributes = calculatePlayerAttributesFromStats(latestStats, position);
    
    if (!attributes) {
      return null;
    }
    
    // Rating'i hesapla (6 yeteneğin ortalaması)
    const rating = Math.round(
      (attributes.shooting + attributes.passing + attributes.dribbling + 
       attributes.defending + attributes.physical + attributes.pace) / 6
    );
    
    return {
      pace: clamp0_100(attributes.pace),
      shooting: clamp0_100(attributes.shooting),
      passing: clamp0_100(attributes.passing),
      dribbling: clamp0_100(attributes.dribbling),
      defending: clamp0_100(attributes.defending),
      physical: clamp0_100(attributes.physical),
      rating: Math.max(65, Math.min(95, rating)), // 65-95 arası
    };
  } catch (error) {
    console.error(`   ⚠️ Rating hesaplama hatası: ${error.message}`);
    return null;
  }
}

/**
 * Ligdeki takımları çek
 */
async function fetchTeamsForLeague(leagueId, leagueName) {
  // Sadece güncel sezon (2025-26)
  const seasonsToTry = [2025];
  
  for (const season of seasonsToTry) {
    try {
      console.log(`   🔍 API çağrısı: /teams?league=${leagueId}&season=${season}`);
      const data = await apiRequest('/teams', { league: leagueId, season });
      
      if (!data) {
        console.log(`   ⚠️ ${season} sezonu için API boş yanıt döndü`);
        continue;
      }
      
      if (data.errors && data.errors.length > 0) {
        console.log(`   ⚠️ ${season} sezonu için API hatası: ${JSON.stringify(data.errors)}`);
        continue;
      }
      
      if (data.response && data.response.length > 0) {
        console.log(`   ✅ ${season} sezonu için ${data.response.length} takım bulundu`);
        return data.response;
      }
      
      console.log(`   ⚠️ ${season} sezonu için takım yok (response length: ${data.response?.length || 0})`);
    } catch (error) {
      console.log(`   ❌ ${season} sezonu için hata: ${error.message}`);
      if (error.response) {
        console.log(`   📋 Status: ${error.response.status}`);
      }
      // Bir sonraki sezonu dene
      continue;
    }
    
    // Rate limiting için kısa bekleme
    await sleep(100);
  }
  
  // Hiçbir sezonda takım bulunamadı
  stats.errors.push(`Teams fetch error for ${leagueName}: No teams found in any season`);
  return [];
}

/**
 * Takım kadrosunu çek
 */
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

/**
 * Teknik direktörü çek
 */
async function fetchCoach(teamId) {
  try {
    const data = await apiRequest('/coachs', { team: teamId });
    const coach = data.response?.find(c => 
      c.career?.some(car => car.team?.id === teamId && !car.end)
    );
    
    if (coach) {
      return {
        id: coach.id,
        name: coach.name,
        photo: coach.photo || null,
        nationality: coach.nationality || null,
        age: coach.age || null,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Oyuncu yeteneklerini ve rating'ini çek
 */
async function fetchPlayerStats(playerId, playerName) {
  try {
    const data = await apiRequest('/players', { id: playerId, season: CURRENT_SEASON });
    
    if (data.response && data.response.length > 0) {
      const playerData = data.response[0];
      const attributes = calculatePlayerAttributes(playerData);
      
      return {
        ...attributes,
        position: playerData.player?.position || 'M',
        age: playerData.player?.age || null,
        nationality: playerData.player?.nationality || null,
      };
    }
    
    return null;
  } catch (error) {
    // Sessizce devam et (oyuncu verisi yoksa)
    return null;
  }
}

/**
 * Mevcut kadroyu kontrol et (DB'de var mı, güncel mi?)
 */
async function getExistingSquad(teamId) {
  try {
    const { data, error } = await supabase
      .from('team_squads')
      .select('players, updated_at')
      .eq('team_id', teamId)
      .eq('season', CURRENT_SEASON)
      .single();
    
    if (error || !data) return null;
    
    // 7 günden eskiyse güncelle
    const updatedAt = new Date(data.updated_at);
    const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 7) {
      return null; // Eski, güncelle
    }
    
    return data.players || [];
  } catch (error) {
    return null;
  }
}

/**
 * Kadroyu zenginleştir (oyuncu yetenekleri ekle)
 * Sadece rating'i olmayan oyuncular için API çağrısı yap
 */
async function enrichSquad(players, teamId, teamName) {
  const enrichedPlayers = [];
  
  for (const player of players) {
    if (!player.id) continue;
    
    // Mevcut oyuncu verisini kontrol et
    const hasRating = player.rating != null && player.rating > 0;
    const hasAttributes = player.pace != null && player.shooting != null;
    
    // Eğer zaten rating ve yetenekler varsa, sadece mevcut veriyi kullan
    if (hasRating && hasAttributes) {
      enrichedPlayers.push({
        id: player.id,
        number: player.number || null,
        name: player.name || 'Bilinmiyor',
        position: player.position || 'M',
        photo: player.photo || null,
        age: player.age || null,
        nationality: player.nationality || null,
        rating: player.rating,
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physical: player.physical,
      });
      
      stats.playersProcessed++;
      stats.playersWithRatings++;
      continue;
    }
    
    // Rating/yetenek yoksa API'den çek
    const playerStats = await fetchPlayerStats(player.id, player.name);
    
    const enrichedPlayer = {
      id: player.id,
      number: player.number || null,
      name: player.name || 'Bilinmiyor',
      position: playerStats?.position || player.position || 'M',
      photo: player.photo || null,
      age: playerStats?.age || player.age || null,
      nationality: playerStats?.nationality || player.nationality || null,
      rating: playerStats?.rating || null,
      // Yetenekler
      pace: playerStats?.pace || null,
      shooting: playerStats?.shooting || null,
      passing: playerStats?.passing || null,
      dribbling: playerStats?.dribbling || null,
      defending: playerStats?.defending || null,
      physical: playerStats?.physical || null,
    };
    
    enrichedPlayers.push(enrichedPlayer);
    
    if (playerStats?.rating) {
      stats.playersWithRatings++;
    }
    
    stats.playersProcessed++;
    
    // Her 10 oyuncuda bir ilerleme göster
    if (stats.playersProcessed % 10 === 0) {
      console.log(`      📊 ${stats.playersProcessed} oyuncu işlendi, ${stats.playersWithRatings} rating'li`);
    }
    
    // API limit kontrolü
    if (stats.apiRequests >= MAX_API_CALLS) {
      console.log(`   ⚠️ API limit yaklaşıyor! Kalan oyuncular atlanacak...`);
      break;
    }
  }
  
  return enrichedPlayers;
}

/**
 * Takımı DB'ye kaydet
 */
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
  
  return true;
}

/**
 * Kadroyu DB'ye kaydet
 */
async function saveSquadToDB(teamId, teamName, players, coach) {
  const squadData = {
    team_id: teamId,
    team_name: teamName,
    season: CURRENT_SEASON,
    team_data: {
      id: teamId,
      name: teamName,
      coach: coach || null,
    },
    players: players,
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('team_squads')
    .upsert(squadData, { onConflict: 'team_id,season' });
  
  if (error) {
    stats.errors.push(`Squad save error for ${teamName}: ${error.message}`);
    return false;
  }
  
  stats.squadsProcessed++;
  return true;
}

/**
 * Ligi işle
 */
async function processLeague(league) {
  console.log(`\n📋 ${league.country} - ${league.name} (ID: ${league.id})`);
  
  // 1. Takımları çek
  const teams = await fetchTeamsForLeague(league.id, league.name);
  
  if (teams.length === 0) {
    console.log(`   ⚠️ Takım bulunamadı`);
    return;
  }
  
  console.log(`   ✅ ${teams.length} takım bulundu`);
  stats.teamsProcessed += teams.length;
  
  // 2. Her takımı işle
  for (const team of teams) {
    // API limit kontrolü
    if (stats.apiRequests >= MAX_API_CALLS) {
      console.log(`\n⚠️ API LIMIT AŞILDI! ${stats.apiRequests}/${MAX_API_CALLS} istek kullanıldı`);
      return;
    }
    
    const teamId = team.team.id;
    const teamName = team.team.name;
    
    console.log(`   📥 ${teamName} (${teamId})...`);
    
    // Takımı kaydet
    await saveTeamToDB(team, league.country, league.name);
    
    // Mevcut kadroyu kontrol et
    const existingSquad = await getExistingSquad(teamId);
    
    let players = null;
    let needsUpdate = false;
    
    if (!existingSquad || existingSquad.length === 0) {
      // Kadro yok, çek
      players = await fetchSquad(teamId, teamName);
      needsUpdate = true;
    } else {
      // Mevcut kadroyu kullan ama kontrol et
      players = existingSquad;
      // Eğer oyuncuların çoğunda rating yoksa güncelle
      const playersWithoutRating = existingSquad.filter(p => !p.rating || p.rating === 0).length;
      if (playersWithoutRating > existingSquad.length * 0.3) {
        // %30'dan fazlasında rating yoksa güncelle
        console.log(`      🔄 ${playersWithoutRating}/${existingSquad.length} oyuncuda rating yok, güncelleniyor...`);
        const freshSquad = await fetchSquad(teamId, teamName);
        if (freshSquad && freshSquad.length > 0) {
          players = freshSquad;
          needsUpdate = true;
        }
      }
    }
    
    if (players && players.length > 0) {
      // Teknik direktör çek
      const coach = await fetchCoach(teamId);
      if (coach) {
        stats.coachesProcessed++;
      }
      
      // Oyuncu yeteneklerini çek ve zenginleştir
      console.log(`      🔍 ${players.length} oyuncu için yetenekler çekiliyor...`);
      const enrichedPlayers = await enrichSquad(players, teamId, teamName);
      
      // DB'ye kaydet
      await saveSquadToDB(teamId, teamName, enrichedPlayers, coach);
      
      console.log(`      ✅ ${enrichedPlayers.length} oyuncu kaydedildi (${stats.playersWithRatings} rating'li)`);
    }
    
    // Rate limiting
    await sleep(250);
  }
  
  stats.leaguesProcessed++;
  console.log(`   💾 ${teams.length} takım işlendi`);
}

/**
 * Ana fonksiyon
 */
async function main() {
  const startTime = Date.now();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TAM KADRO SENKRONİZASYONU - 2025-2026 SEZONU                ║');
  console.log('║   Oyuncu Yetenekleri + Rating + Teknik Direktör + Renkler    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 API Limit: ${MAX_API_CALLS} istek`);
  console.log(`📋 İşlenecek lig sayısı: ${PRIORITY_LEAGUES.length}\n`);
  
  // İlerleme dosyası
  const progressFile = path.join(__dirname, '..', 'data', 'sync-squads-progress.json');
  let startIndex = 0;
  
  // Eğer önceden yarıda kalmışsa devam et
  if (fs.existsSync(progressFile)) {
    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    if (progress.lastProcessedIndex !== undefined) {
      startIndex = progress.lastProcessedIndex + 1;
      stats = progress.stats || stats;
      console.log(`🔄 Kaldığı yerden devam ediliyor: ${startIndex}/${PRIORITY_LEAGUES.length}\n`);
    }
  }
  
  // Her ligi işle
  for (let i = startIndex; i < PRIORITY_LEAGUES.length; i++) {
    const league = PRIORITY_LEAGUES[i];
    
    console.log(`\n[${i + 1}/${PRIORITY_LEAGUES.length}] ════════════════════════════════════`);
    
    try {
      await processLeague(league);
    } catch (error) {
      console.error(`   ❌ Hata: ${error.message}`);
      stats.errors.push(`League error ${league.name}: ${error.message}`);
      
      // API limit aşıldıysa durdur
      if (error.message.includes('API limit')) {
        console.log('\n⚠️ API LIMIT AŞILDI! Script durduruluyor...');
        break;
      }
    }
    
    // İlerlemeyi kaydet
    fs.writeFileSync(progressFile, JSON.stringify({
      lastProcessedIndex: i,
      stats,
      updatedAt: new Date().toISOString()
    }, null, 2));
    
    // Her ligde özet
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n📊 İLERLEME: ${i + 1}/${PRIORITY_LEAGUES.length} lig | ${stats.teamsProcessed} takım | ${stats.squadsProcessed} kadro | ${stats.playersProcessed} oyuncu | ${stats.playersWithRatings} rating'li | ${stats.apiRequests} API | ${elapsed}s`);
  }
  
  // Sonuç
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('\n\n' + '═'.repeat(70));
  console.log('📊 TAMAMLANDI!');
  console.log('═'.repeat(70));
  console.log(`   Toplam süre       : ${Math.floor(totalTime / 60)} dakika ${totalTime % 60} saniye`);
  console.log(`   API istekleri     : ${stats.apiRequests}/${MAX_API_CALLS}`);
  console.log(`   İşlenen lig       : ${stats.leaguesProcessed}`);
  console.log(`   İşlenen takım     : ${stats.teamsProcessed}`);
  console.log(`   Kaydedilen kadro  : ${stats.squadsProcessed}`);
  console.log(`   İşlenen oyuncu    : ${stats.playersProcessed}`);
  console.log(`   Rating'li oyuncu  : ${stats.playersWithRatings}`);
  console.log(`   Teknik direktör   : ${stats.coachesProcessed}`);
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
  const resultFile = path.join(__dirname, '..', 'data', 'sync-squads-result.json');
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
