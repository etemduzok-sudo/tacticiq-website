/**
 * TacticIQ - Tüm Oyuncu Reytinglerini Güncelle
 * =====================================================
 * Bu script tüm desteklenen liglerdeki oyuncuların:
 * - Rating (65-95 arası)
 * - Alt özellikler (pace, shooting, passing, dribbling, defending, physical)
 * - Form ve disiplin puanları
 * 
 * Güncelleme: Haftalık (Pazartesi 03:00)
 * Kullanım: node scripts/update-all-player-ratings.js [--league=203] [--all]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase env kontrolü - yoksa script sessizce çık, backend'i çökertme
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase env missing. update-all-player-ratings SKIPPED.');
  process.exit(0);
}

// Supabase key formatı: 'eyJ...' (JWT) veya 'sb_...' olabilir
if (!supabaseKey || supabaseKey.trim() === '') {
  console.warn('⚠️ Supabase key empty. SKIPPED.');
  process.exit(0);
}

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const {
  calculatePlayerAttributesFromStats,
  calculateForm,
  getFitnessMultiplier,
  clamp0_100,
} = require('../utils/playerRatingFromStats');

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// DESTEKLENEN LİGLER (API-Football League IDs)
// =====================================================
const SUPPORTED_LEAGUES = {
  // Türkiye
  'Süper Lig': { id: 203, country: 'Turkey', priority: 1 },
  'TFF 1. Lig': { id: 204, country: 'Turkey', priority: 2 },
  'Türkiye Kupası': { id: 206, country: 'Turkey', priority: 2 },
  
  // İngiltere
  'Premier League': { id: 39, country: 'England', priority: 1 },
  'Championship': { id: 40, country: 'England', priority: 2 },
  'FA Cup': { id: 45, country: 'England', priority: 2 },
  'EFL Cup': { id: 48, country: 'England', priority: 3 },
  
  // İspanya
  'La Liga': { id: 140, country: 'Spain', priority: 1 },
  'La Liga 2': { id: 141, country: 'Spain', priority: 2 },
  'Copa del Rey': { id: 143, country: 'Spain', priority: 2 },
  
  // Almanya
  'Bundesliga': { id: 78, country: 'Germany', priority: 1 },
  '2. Bundesliga': { id: 79, country: 'Germany', priority: 2 },
  'DFB Pokal': { id: 81, country: 'Germany', priority: 2 },
  
  // İtalya
  'Serie A': { id: 135, country: 'Italy', priority: 1 },
  'Serie B': { id: 136, country: 'Italy', priority: 2 },
  'Coppa Italia': { id: 137, country: 'Italy', priority: 2 },
  
  // Fransa
  'Ligue 1': { id: 61, country: 'France', priority: 1 },
  'Ligue 2': { id: 62, country: 'France', priority: 2 },
  'Coupe de France': { id: 66, country: 'France', priority: 2 },
  
  // Hollanda
  'Eredivisie': { id: 88, country: 'Netherlands', priority: 1 },
  
  // Portekiz
  'Primeira Liga': { id: 94, country: 'Portugal', priority: 1 },
  
  // Belçika
  'Pro League': { id: 144, country: 'Belgium', priority: 2 },
  
  // Rusya
  'Russian Premier League': { id: 235, country: 'Russia', priority: 2 },
  
  // UEFA Kupaları
  'Champions League': { id: 2, country: 'World', priority: 1 },
  'Europa League': { id: 3, country: 'World', priority: 1 },
  'Conference League': { id: 848, country: 'World', priority: 2 },
  'UEFA Super Cup': { id: 531, country: 'World', priority: 3 },
  
  // Uluslararası
  'World Cup': { id: 1, country: 'World', priority: 1 },
  'Euro Championship': { id: 4, country: 'World', priority: 1 },
  'Nations League': { id: 5, country: 'World', priority: 2 },
  'World Cup Qualifiers - Europe': { id: 32, country: 'World', priority: 2 },
};

const CURRENT_SEASON = 2025;

// API limit: 7500 günlük - 250 yedek = 7250 kullanılabilir
const API_RESERVE = 250;
const API_DAILY_LIMIT = 7500;
const MAX_API_CALLS = API_DAILY_LIMIT - API_RESERVE;

// En büyük ligler (öncelik sırası - 1 = en yüksek)
const LEAGUE_PRIORITY = {
  39: 1,   // Premier League
  140: 2,  // La Liga
  78: 3,   // Bundesliga
  135: 4,  // Serie A
  61: 5,   // Ligue 1
  203: 6,  // Süper Lig
  2: 7,    // Champions League
  3: 8,    // Europa League
  88: 9,   // Eredivisie
  94: 10,  // Primeira Liga
  4: 11,   // Euro
  1: 12,   // World Cup
  848: 13, // Conference League
  40: 14,  // Championship
  141: 15, // La Liga 2
  79: 16,  // 2. Bundesliga
  136: 17, // Serie B
  62: 18,  // Ligue 2
  204: 19, // TFF 1. Lig
  144: 20, // Pro League
  235: 21, // Russian Premier League
};

// Rate limiting
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL = 6500; // 6.5 saniye (güvenli aralık)

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedRequest(fn) {
  requestCount++;
  if (requestCount % 10 === 0) {
    console.log(`📊 ${requestCount} request completed, waiting for rate limit...`);
    await delay(REQUEST_INTERVAL);
  }
  return fn();
}

// =====================================================
// YARDIMCI FONKSİYONLAR (DB-FIRST)
// =====================================================

/**
 * DB'den tüm takımları ve kadrolarını çek (team_squads tablosu)
 * API çağrısı YOK - veriler zaten DB'de
 * Supabase 1000 satır limiti var, pagination ile tümünü çek
 */
async function getAllTeamsFromDB() {
  try {
    const allTeams = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('team_squads')
        .select('team_id, team_name, players, team_data, season')
        .not('players', 'is', null)
        .order('team_name', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allTeams.push(...data);
      console.log(`📦 Sayfa ${page + 1}: ${data.length} takım (toplam: ${allTeams.length})`);
      
      if (data.length < pageSize) break; // Son sayfa
      page++;
    }
    
    console.log(`📦 DB'den toplam ${allTeams.length} takım kadrosu yüklendi`);
    return allTeams;
  } catch (error) {
    console.warn(`⚠️ DB'den takımlar çekilemedi:`, error.message);
    return [];
  }
}

/**
 * Maçlardan takım->lig eşlemesi (en büyük liglerden başlamak için)
 */
async function getTeamToLeagueMap() {
  try {
    const teamToLeague = new Map();
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, league_id')
        .not('league_id', 'is', null)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      for (const row of data) {
        if (row.home_team_id && row.league_id) {
          const existing = teamToLeague.get(row.home_team_id);
          const pri = LEAGUE_PRIORITY[row.league_id] ?? 99;
          if (!existing || pri < LEAGUE_PRIORITY[existing]) {
            teamToLeague.set(row.home_team_id, row.league_id);
          }
        }
        if (row.away_team_id && row.league_id) {
          const existing = teamToLeague.get(row.away_team_id);
          const pri = LEAGUE_PRIORITY[row.league_id] ?? 99;
          if (!existing || pri < LEAGUE_PRIORITY[existing]) {
            teamToLeague.set(row.away_team_id, row.league_id);
          }
        }
      }
      if (data.length < pageSize) break;
      page++;
    }
    
    console.log(`   🏆 ${teamToLeague.size} takım için lig eşlemesi yapıldı`);
    return teamToLeague;
  } catch (error) {
    console.warn('   ⚠️ Lig eşlemesi yapılamadı, alfabetik sıra kullanılacak:', error.message);
    return new Map();
  }
}

/**
 * Takımları lig önceliğine göre sırala (en büyük ligler önce)
 */
function sortTeamsByLeaguePriority(teams, teamToLeague) {
  return [...teams].sort((a, b) => {
    const priA = LEAGUE_PRIORITY[teamToLeague.get(a.team_id)] ?? 99;
    const priB = LEAGUE_PRIORITY[teamToLeague.get(b.team_id)] ?? 99;
    if (priA !== priB) return priA - priB;
    return (a.team_name || '').localeCompare(b.team_name || '');
  });
}

/**
 * DB'den toplam oyuncu sayısını hesapla
 */
async function countTotalPlayersInDB() {
  try {
    const teams = await getAllTeamsFromDB();
    let total = 0;
    for (const team of teams) {
      total += (team.players || []).length;
    }
    return total;
  } catch (error) {
    return 0;
  }
}

/**
 * Oyuncu istatistiklerini çek
 */
async function getPlayerStats(playerId, season = CURRENT_SEASON) {
  try {
    const response = await rateLimitedRequest(() => 
      footballApi.getPlayerInfo(playerId, season)
    );
    return response?.response?.[0] || null;
  } catch (error) {
    console.warn(`⚠️ Oyuncu ${playerId} istatistikleri çekilemedi:`, error.message);
    return null;
  }
}

/**
 * Oyuncuyu DB'ye kaydet/güncelle
 */
async function savePlayerToDb(playerData) {
  try {
    const { error } = await supabase
      .from('players')
      .upsert(playerData, { onConflict: 'id' });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn(`⚠️ Oyuncu ${playerData.id} kaydedilemedi:`, error.message);
    return false;
  }
}

/**
 * PowerScore tablosuna kaydet
 */
async function savePowerScore(scoreData) {
  try {
    const { error } = await supabase
      .from('player_power_scores')
      .upsert(scoreData, { onConflict: 'player_id,team_id,league_id,season' });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn(`⚠️ PowerScore kaydedilemedi:`, error.message);
    return false;
  }
}

// =====================================================
// ANA İŞLEM FONKSİYONLARI
// =====================================================

/**
 * Tek bir oyuncunun rating'ini hesapla ve kaydet
 */
async function processPlayer(player, teamId, leagueId, season) {
  const playerStats = await getPlayerStats(player.id, season);
  
  let attrs = {
    pace: 70,
    shooting: 65,
    passing: 70,
    dribbling: 65,
    defense: 65,
    physical: 70,
    form: 50,
    discipline: 70,
    rating: 75,
    powerScore: 70,
  };
  
  // API'den istatistikler geldiyse hesapla
  if (playerStats?.statistics?.length > 0) {
    const latestStats = playerStats.statistics[0];
    const playerData = playerStats.player || {};
    const calculated = calculatePlayerAttributesFromStats(latestStats, playerData);
    attrs = { ...attrs, ...calculated };
  } else {
    // İstatistik yoksa pozisyona göre default değerler
    attrs = getDefaultAttributesByPosition(player.position);
  }
  
  // Oyuncu tablosuna kaydet
  const playerRecord = {
    id: player.id,
    name: player.name,
    firstname: playerStats?.player?.firstname || null,
    lastname: playerStats?.player?.lastname || null,
    age: player.age || playerStats?.player?.age || null,
    nationality: player.nationality || playerStats?.player?.nationality || null,
    position: player.position || playerStats?.player?.position || null,
    rating: attrs.rating,
    team_id: teamId,
    updated_at: new Date().toISOString(),
  };
  
  await savePlayerToDb(playerRecord);
  
  // PowerScore tablosuna kaydet
  const powerScoreRecord = {
    player_id: player.id,
    team_id: teamId,
    league_id: leagueId,
    season: season,
    position: player.position,
    power_score: attrs.powerScore || attrs.rating,
    shooting: attrs.shooting,
    passing: attrs.passing,
    dribbling: attrs.dribbling,
    defense: attrs.defense || attrs.defending,
    physical: attrs.physical,
    pace: attrs.pace,
    form: attrs.form || 50,
    discipline: attrs.discipline || 70,
    fitness_status: 'fit',
    updated_at: new Date().toISOString(),
  };
  
  await savePowerScore(powerScoreRecord);
  
  return attrs;
}

/**
 * Pozisyona göre default özellikler
 */
function getDefaultAttributesByPosition(position) {
  const pos = (position || '').toLowerCase();
  
  // Kaleci
  if (pos.includes('goalkeeper')) {
    return {
      pace: 55, shooting: 35, passing: 60, dribbling: 40,
      defense: 80, physical: 75, form: 50, discipline: 80,
      rating: 75, powerScore: 75,
    };
  }
  
  // Defans
  if (pos.includes('defender')) {
    if (pos.includes('centre') || pos.includes('center')) {
      return {
        pace: 65, shooting: 45, passing: 65, dribbling: 55,
        defense: 78, physical: 78, form: 50, discipline: 75,
        rating: 76, powerScore: 76,
      };
    }
    // Bek
    return {
      pace: 75, shooting: 50, passing: 68, dribbling: 65,
      defense: 72, physical: 72, form: 50, discipline: 72,
      rating: 75, powerScore: 75,
    };
  }
  
  // Orta saha
  if (pos.includes('midfielder')) {
    if (pos.includes('defensive')) {
      return {
        pace: 68, shooting: 58, passing: 75, dribbling: 68,
        defense: 75, physical: 75, form: 50, discipline: 75,
        rating: 76, powerScore: 76,
      };
    }
    if (pos.includes('attacking')) {
      return {
        pace: 72, shooting: 72, passing: 78, dribbling: 78,
        defense: 50, physical: 65, form: 50, discipline: 70,
        rating: 77, powerScore: 77,
      };
    }
    // Genel orta saha
    return {
      pace: 70, shooting: 65, passing: 75, dribbling: 72,
      defense: 65, physical: 70, form: 50, discipline: 72,
      rating: 76, powerScore: 76,
    };
  }
  
  // Forvet
  if (pos.includes('attacker') || pos.includes('forward')) {
    return {
      pace: 80, shooting: 78, passing: 65, dribbling: 78,
      defense: 40, physical: 70, form: 50, discipline: 68,
      rating: 78, powerScore: 78,
    };
  }
  
  // Default
  return {
    pace: 70, shooting: 65, passing: 70, dribbling: 68,
    defense: 65, physical: 70, form: 50, discipline: 70,
    rating: 75, powerScore: 75,
  };
}

/**
 * Tüm takımları DB'den işle (lig ayrımı yok)
 * @param {boolean} fetchApiStats - API'den istatistik çek (7500 limit!)
 */
async function processAllTeamsFromDB(fetchApiStats = false, season = CURRENT_SEASON) {
  console.log(`\n🏆 TÜM TAKIMLAR İŞLENİYOR (DB-FIRST)...`);
  console.log(`   📡 API Stats: ${fetchApiStats ? `EVET (max ${MAX_API_CALLS} çağrı, ${API_RESERVE} yedek)` : 'HAYIR (pozisyon default)'}`);
  
  // DB'den tüm takımları çek (API çağrısı YOK)
  let teams = await getAllTeamsFromDB();
  console.log(`   📋 ${teams.length} takım bulundu (DB'den)`);
  
  // API kullanılacaksa en büyük liglerden başla
  if (fetchApiStats && teams.length > 0) {
    console.log(`   🏆 En büyük liglerden başlayarak sıralanıyor...`);
    const teamToLeague = await getTeamToLeagueMap();
    teams = sortTeamsByLeaguePriority(teams, teamToLeague);
  }
  
  let totalPlayers = 0;
  let processedPlayers = 0;
  let errors = 0;
  let apiCalls = 0;
  
  for (const teamData of teams) {
    const teamId = teamData.team_id;
    const teamName = teamData.team_name || teamData.team_data?.name || `Team ${teamId}`;
    const players = teamData.players || [];
    
    if (players.length === 0) continue;
    
    console.log(`   ⚽ ${teamName} (${players.length} oyuncu)`);
    totalPlayers += players.length;
    
    for (const player of players) {
      try {
        // API limit kontrolü
        if (fetchApiStats && apiCalls >= MAX_API_CALLS) {
          console.log(`\n⚠️ API limit yaklaşıyor (${apiCalls}/${MAX_API_CALLS}). Durduruluyor...`);
          return { total: totalPlayers, processed: processedPlayers, errors, apiCalls };
        }
        
        await processPlayerFromDB(player, teamId, season, fetchApiStats);
        processedPlayers++;
        if (fetchApiStats) apiCalls++;
        
        // Her 50 oyuncuda bir ilerleme göster
        if (processedPlayers % 50 === 0) {
          console.log(`      ✅ ${processedPlayers} oyuncu işlendi${fetchApiStats ? ` (${apiCalls} API)` : ''}`);
        }
        
        // Rate limiting (sadece API çağrısı varsa)
        if (fetchApiStats) await delay(300);
      } catch (error) {
        errors++;
      }
    }
  }
  
  console.log(`\n✅ TAMAMLANDI: ${processedPlayers}/${totalPlayers} oyuncu (${errors} hata, ${apiCalls} API çağrısı)`);
  
  return { total: totalPlayers, processed: processedPlayers, errors, apiCalls };
}

/**
 * DB'deki oyuncu verisini kullanarak rating hesapla ve kaydet
 */
async function processPlayerFromDB(player, teamId, season, fetchApiStats = false) {
  let attrs = getDefaultAttributesByPosition(player.position);
  
  // API'den istatistik çek (opsiyonel - 7500 limit!)
  if (fetchApiStats && player.id) {
    const playerStats = await getPlayerStats(player.id, season);
    if (playerStats?.statistics?.length > 0) {
      const latestStats = playerStats.statistics[0];
      const playerData = playerStats.player || {};
      const calculated = calculatePlayerAttributesFromStats(latestStats, playerData);
      attrs = { ...attrs, ...calculated };
    }
  }
  
  // Mevcut rating varsa koru, yoksa hesaplananı kullan
  const finalRating = player.rating || attrs.rating;
  
  // Oyuncu tablosuna kaydet
  const playerRecord = {
    id: player.id,
    name: player.name,
    age: player.age || null,
    nationality: player.nationality || null,
    position: player.position || null,
    rating: finalRating,
    team_id: teamId,
    photo: player.photo || null,
    updated_at: new Date().toISOString(),
  };
  
  await savePlayerToDb(playerRecord);
  return attrs;
}


// =====================================================
// CLI
// =====================================================
const args = process.argv.slice(2);
let fetchApiStats = false;
let season = CURRENT_SEASON;

args.forEach(arg => {
  if (arg === '--api' || arg === '--with-api') {
    fetchApiStats = true;
  }
  if (arg.startsWith('--season=')) {
    season = parseInt(arg.split('=')[1], 10);
  }
});

async function main() {
  console.log('🚀 TacticIQ Oyuncu Rating Güncelleme Sistemi (DB-FIRST)');
  console.log('='.repeat(50));
  console.log(`📅 Sezon: ${season}`);
  console.log(`📦 Kaynak: team_squads tablosu (DB)`);
  console.log(`📡 API Stats: ${fetchApiStats ? 'EVET (istatistik çekilecek)' : 'HAYIR (sadece pozisyon default)'}`);
  console.log('='.repeat(50));
  
  if (fetchApiStats) {
    console.log(`\n⚠️  API istatistik çekme aktif!`);
    console.log(`   - Max ${MAX_API_CALLS} API çağrısı (${API_RESERVE} yedek bırakıldı)`);
    console.log(`   - En büyük liglerden başlayarak işlenecek\n`);
  }
  
  // DB'deki tüm takımları işle
  const result = await processAllTeamsFromDB(fetchApiStats, season);
  
  console.log('\n📊 SONUÇ ÖZETİ');
  console.log('='.repeat(50));
  console.log(`   Toplam Oyuncu: ${result.total}`);
  console.log(`   İşlenen: ${result.processed}`);
  console.log(`   Hatalar: ${result.errors}`);
  console.log(`   API Çağrısı: ${result.apiCalls || 0}`);
  console.log('='.repeat(50));
}

// ✅ SADECE DOĞRUDAN ÇALIŞTIRILDIĞINDA ÇALIŞ
// require() ile import edildiğinde çalışmasın!
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}

// Scheduler için export
module.exports = {
  processAllTeamsFromDB,
  getAllTeamsFromDB,
  getDefaultAttributesByPosition,
  SUPPORTED_LEAGUES,
  CURRENT_SEASON,
};
