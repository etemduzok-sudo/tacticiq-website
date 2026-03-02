/**
 * TacticIQ - Tüm Oyuncu Reytingleri ve Yetenek Dağılımlarını Güncelle
 * =====================================================
 * Tek API çağrısı = 1 oyuncu için TAM veri:
 *   GET /players?id=&season= → rating + pas, şut, dribling, defans, fizik, hız (6 öznitelik)
 * 
 * DB'ye yazılanlar:
 *   - players.rating (65-95)
 *   - player_power_scores: shooting, passing, dribbling, defense, physical, pace, form, discipline, power_score
 * 
 * API tasarrufu:
 *   - Gerçek rating/yetenek verisi olan oyuncular atlanır
 *   - 250 yedek bırakılır, kalan günlük hak kullanılır
 *   - En büyük liglerden başlanır
 * 
 * Kullanım: node scripts/update-all-player-ratings.js --api [--season=2025]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =====================================================
// DESTEKLENEN LİGLER (API-Football League IDs) - env'den bağımsız, her zaman export
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

// Supabase env kontrolü - script doğrudan çalıştırılıyorsa çık; require edildiyse stub export (backend çökmesin)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY;

const hasSupabase = supabaseUrl && supabaseKey && supabaseKey.trim() !== '';

if (!hasSupabase) {
  if (require.main === module) {
    console.warn('⚠️ Supabase env missing. update-all-player-ratings SKIPPED.');
    process.exit(0);
  }
  // Require edildi (server/scheduler): process.exit YAPMA, stub export et
  console.warn('⚠️ Supabase env missing. update-all-player-ratings SKIPPED (stub export).');
  module.exports = {
    processAllTeamsFromDB: async () => ({ teamsProcessed: 0, skipped: 0, errors: [] }),
    getAllTeamsFromDB: async () => [],
    getDefaultAttributesByPosition: () => ({}),
    SUPPORTED_LEAGUES,
    CURRENT_SEASON,
  };
  return;
}

// ✅ Script çökmesin: yakalanmamış hata ve rejection'larda sadece logla, çıkma
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ [unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ [uncaughtException]', err.message);
});

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const {
  calculatePlayerAttributesFromStats,
  calculateForm,
  getFitnessMultiplier,
  clamp0_100,
} = require('../utils/playerRatingFromStats');

const supabase = createClient(supabaseUrl, supabaseKey);

// DB güncellemeleri (rating, takım, koç, kadro, takvim): max 50K/gün (kalan 25K = maç sync)
const API_RESERVE = 500;
const API_DAILY_LIMIT = parseInt(process.env.API_LIMIT_DB_UPDATES || '50000', 10);

/**
 * Mevcut API kullanımını kontrol et ve kalan hakkı hesapla
 */
async function getAvailableApiCalls() {
  let usedToday = 0;
  
  // smartSyncService'den mevcut kullanımı al
  try {
    const smartSyncService = require('../services/smartSyncService');
    const syncStatus = smartSyncService.getStatus();
    if (syncStatus && typeof syncStatus.apiCallsToday === 'number') {
      usedToday += syncStatus.apiCallsToday;
    }
  } catch (e) {
    // smartSync yoksa devam et
  }
  
  // aggressiveCacheService'den mevcut kullanımı al
  try {
    const aggressiveCacheService = require('../services/aggressiveCacheService');
    const cacheStats = aggressiveCacheService.getStats();
    if (cacheStats && typeof cacheStats.callsToday === 'number') {
      usedToday += cacheStats.callsToday;
    }
  } catch (e) {
    // aggressiveCache yoksa devam et
  }
  
  // Maç sync (aggressive + smartSync) ayrı 25K kullanır; bu script max 50K
  const remaining = Math.max(0, API_DAILY_LIMIT - usedToday);
  const available = Math.min(API_DAILY_LIMIT, Math.max(0, remaining - API_RESERVE));

  console.log(`📊 [DB GÜNCELLEME] Kota: ${API_DAILY_LIMIT}, Kalan: ${remaining}, Kullanılabilir: ${available}`);
  return available;
}

// Dinamik olarak hesaplanacak
let MAX_API_CALLS = 0;

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

// Rate limiting - API-Football PRO: 100 requests/minute (aggressive for 75k daily limit)
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 100;
const REQUEST_INTERVAL = 600; // 0.6 saniye (100 req/min = her 0.6 saniyede 1 req)

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limiting artık getPlayerStats içinde yapılıyor

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
 * Oyuncu istatistiklerini çek (optimize edilmiş - cache kontrolü ile)
 */
async function getPlayerStats(playerId, season = CURRENT_SEASON) {
  try {
    // Cache key ile API çağrısı yap (footballApi içinde cache var)
    const response = await footballApi.getPlayerInfo(playerId, season);
    
    // Rate limiting tracking (her çağrıyı say)
    requestCount++;
    if (requestCount % 50 === 0) {
      console.log(`📊 ${requestCount} oyuncu API çağrısı tamamlandı, rate limit kontrolü...`);
    }
    
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
    // Name null ise atla (DB constraint hatası önleme)
    if (!playerData.name || playerData.name.trim() === '') {
      console.warn(`⚠️ Oyuncu ${playerData.id} name bilgisi yok, atlanıyor`);
      return false;
    }
    
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

/**
 * Takım kadrosundaki oyuncuların rating'lerini players tablosundan alıp team_squads.players[] ile senkronize et.
 * check-status rating sayısını team_squads üzerinden yaptığı için bu gerekli.
 */
async function syncTeamSquadRatings(teamId, season = CURRENT_SEASON) {
  try {
    const { data: squad, error: squadErr } = await supabase
      .from('team_squads')
      .select('players')
      .eq('team_id', teamId)
      .eq('season', season)
      .single();
    if (squadErr || !squad?.players?.length) return;

    const { data: playerRows, error: playersErr } = await supabase
      .from('players')
      .select('id, rating')
      .eq('team_id', teamId);
    if (playersErr || !playerRows?.length) return;

    const ratingByPlayerId = new Map(playerRows.map(p => [p.id, p.rating]));
    let updated = 0;
    const newPlayers = squad.players.map(p => {
      const id = p.id || p.player_id;
      const r = ratingByPlayerId.get(id);
      if (r != null && r !== p.rating) {
        updated++;
        return { ...p, rating: r };
      }
      return p;
    });

    if (updated > 0) {
      await supabase
        .from('team_squads')
        .update({ players: newPlayers, updated_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('season', season);
    }
  } catch (e) {
    console.warn(`⚠️ team_squads sync (team ${teamId}):`, e.message);
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
  // Name fallback: API'den gelen name yoksa mevcut name'i kullan veya firstname+lastname kombinasyonu
  const playerName = player.name || 
                     (playerStats?.player?.firstname && playerStats?.player?.lastname 
                       ? `${playerStats.player.firstname} ${playerStats.player.lastname}` 
                       : `Unknown Player ${player.id}`);
  
  const playerRecord = {
    id: player.id,
    name: playerName,
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
 * Default rating değerleri (pozisyon bazlı - bunlar gerçek API rating'i değil)
 */
const DEFAULT_RATINGS = [75, 76, 77, 78]; // Pozisyon default'ları

/**
 * player_power_scores tablosunda gerçek verileri olan oyuncuları kontrol et
 */
async function getPlayersWithoutPowerScores(teamId, playerIds, leagueId, season) {
  try {
    if (!playerIds || playerIds.length === 0) return [];
    if (!leagueId) return playerIds; // League ID yoksa hepsini çek
    
    const { data, error } = await supabase
      .from('player_power_scores')
      .select('player_id, shooting, passing, dribbling, defense, physical, pace, updated_at')
      .in('player_id', playerIds)
      .eq('team_id', teamId)
      .eq('league_id', leagueId)
      .eq('season', season);
    
    if (error) {
      console.warn(`⚠️ PowerScore kontrol hatası (team ${teamId}):`, error.message);
      return playerIds; // Hata durumunda hepsini çek
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Gerçek yetenek verileri olan oyuncuları bul
    const playersWithRealStats = new Set();
    
    (data || []).forEach(p => {
      const updatedAt = p.updated_at ? new Date(p.updated_at) : null;
      
      // Tüm yetenekler null ise → çek
      if (!p.shooting && !p.passing && !p.dribbling && !p.defense && !p.physical && !p.pace) {
        return; // Bu oyuncuyu çek
      }
      
      // updated_at çok eski ise (30 günden eski) → yenile
      if (updatedAt && updatedAt < thirtyDaysAgo) {
        return; // Bu oyuncuyu çek
      }
      
      // Gerçek veriler var ve güncel → atla
      playersWithRealStats.add(p.player_id);
    });
    
    // Gerçek verileri olmayan oyuncuları filtrele
    const playersWithoutStats = playerIds.filter(id => !playersWithRealStats.has(id));
    
    return playersWithoutStats;
  } catch (error) {
    console.warn(`⚠️ PowerScore kontrol hatası:`, error.message);
    return playerIds; // Hata durumunda hepsini çek
  }
}

/**
 * DB'den gerçek rating'i olmayan oyuncuları filtrele (API çağrısından önce)
 * - Rating null/0 olanlar → çek
 * - Rating default değerlerden biri olanlar (75-78) → çek (bunlar pozisyon default'u)
 * - Rating gerçek API'den çekilmiş görünüyorsa (65-95 arası, default değil) → atla
 * - updated_at 30 günden eski ise → yenile
 */
async function getPlayersWithoutRatings(teamId, playerIds) {
  try {
    if (!playerIds || playerIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('players')
      .select('id, rating, updated_at')
      .in('id', playerIds)
      .eq('team_id', teamId);
    
    if (error) {
      console.warn(`⚠️ DB kontrol hatası (team ${teamId}):`, error.message);
      return playerIds; // Hata durumunda hepsini çek
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Gerçek rating'i olan oyuncuları bul
    const playersWithRealRating = new Set();
    
    (data || []).forEach(p => {
      const rating = p.rating;
      const updatedAt = p.updated_at ? new Date(p.updated_at) : null;
      
      // Rating yoksa veya 0 ise → çek
      if (!rating || rating === 0) {
        return; // Bu oyuncuyu çek
      }
      
      // Default rating değerlerinden biri ise → çek (gerçek değil)
      if (DEFAULT_RATINGS.includes(rating)) {
        return; // Bu oyuncuyu çek
      }
      
      // updated_at çok eski ise (30 günden eski) → yenile
      if (updatedAt && updatedAt < thirtyDaysAgo) {
        return; // Bu oyuncuyu çek
      }
      
      // Gerçek API rating'i var (65-95 arası, default değil, güncel) → atla
      if (rating >= 65 && rating <= 95 && !DEFAULT_RATINGS.includes(rating)) {
        playersWithRealRating.add(p.id);
      }
    });
    
    // Gerçek rating'i olmayan oyuncuları filtrele
    const playersWithoutRating = playerIds.filter(id => !playersWithRealRating.has(id));
    
    return playersWithoutRating;
  } catch (error) {
    console.warn(`⚠️ Rating kontrol hatası:`, error.message);
    return playerIds; // Hata durumunda hepsini çek
  }
}

/**
 * Tüm takımları DB'den işle (lig ayrımı yok)
 * @param {boolean} fetchApiStats - API'den istatistik çek (75000 limit!)
 */
async function processAllTeamsFromDB(fetchApiStats = false, season = CURRENT_SEASON) {
  console.log(`\n🏆 TÜM TAKIMLAR İŞLENİYOR (DB-FIRST)...`);
  console.log(`   📡 API Stats: ${fetchApiStats ? `EVET (max ${MAX_API_CALLS} çağrı, ${API_RESERVE} yedek)` : 'HAYIR (pozisyon default)'}`);
  
  // DB'den tüm takımları çek (API çağrısı YOK)
  let teams = await getAllTeamsFromDB();
  console.log(`   📋 ${teams.length} takım bulundu (DB'den)`);
  
  // Takım->lig eşlemesi (sıralama + leagueId için tek seferde)
  let teamToLeague = new Map();
  if (teams.length > 0) {
    teamToLeague = await getTeamToLeagueMap();
    if (fetchApiStats) {
      console.log(`   🏆 En büyük liglerden başlayarak sıralanıyor...`);
      teams = sortTeamsByLeaguePriority(teams, teamToLeague);
    }
  }
  
  let totalPlayers = 0;
  let processedPlayers = 0;
  let skippedPlayers = 0; // Rating'i zaten olanlar
  let errors = 0;
  let apiCalls = 0;
  
  for (const teamData of teams) {
    const teamId = teamData.team_id;
    const teamName = teamData.team_name || teamData.team_data?.name || `Team ${teamId}`;
    const players = teamData.players || [];
    const leagueId = teamToLeague.get(teamId) || null; // Ekstra DB sorgusu yok
    
    if (players.length === 0) continue;
    
    totalPlayers += players.length;
    
    // API kullanılacaksa, sadece rating'i veya yetenek verileri olmayan oyuncuları filtrele
    let playersToProcess = players;
    if (fetchApiStats) {
      const playerIds = players.map(p => p.id).filter(Boolean);
      
      // Önce rating kontrolü
      const playersWithoutRating = await getPlayersWithoutRatings(teamId, playerIds);
      
      // Sonra PowerScore kontrolü (league_id teamToLeague'dan)
      const playersWithoutPowerScores = leagueId 
        ? await getPlayersWithoutPowerScores(teamId, playerIds, leagueId, season)
        : playerIds;
      
      // Her iki kontrolü de geçen oyuncuları al (birinde eksik varsa çek)
      const playersToFetch = new Set([
        ...playersWithoutRating,
        ...playersWithoutPowerScores
      ]);
      
      playersToProcess = players.filter(p => playersToFetch.has(p.id));
      skippedPlayers += (players.length - playersToProcess.length);
      
      if (playersToProcess.length === 0) {
        continue; // Bu takımda işlenecek oyuncu yok
      }
    }
    
    console.log(`   ⚽ ${teamName} (${playersToProcess.length}/${players.length} oyuncu${fetchApiStats ? ` - ${players.length - playersToProcess.length} zaten rating'li` : ''})`);
    
    // Batch işlem: Aynı anda 30 oyuncu için API çağrısı yap (rate limit korunur)
    // API-Football PRO: 100 req/min = her 0.6 saniyede 1 req, batch'ler arası 0.6s delay ile 30 paralel güvenli
    const batchSize = fetchApiStats ? 30 : 50;
    for (let i = 0; i < playersToProcess.length; i += batchSize) {
      const batch = playersToProcess.slice(i, i + batchSize);
      
      // API limit kontrolü
      if (fetchApiStats && apiCalls >= MAX_API_CALLS) {
        console.log(`\n⚠️ API limit yaklaşıyor (${apiCalls}/${MAX_API_CALLS}). Durduruluyor...`);
        return { total: totalPlayers, processed: processedPlayers, skipped: skippedPlayers, errors, apiCalls };
      }
      
      // Batch'i paralel işle (sadece API çağrısı varsa)
      await Promise.all(batch.map(async (player) => {
        try {
          await processPlayerFromDB(player, teamId, season, fetchApiStats, leagueId);
          processedPlayers++;
          if (fetchApiStats) apiCalls++;
        } catch (error) {
          errors++;
          console.warn(`⚠️ Oyuncu ${player.id} işlenemedi:`, error.message);
        }
      }));
      
      // Her 50 oyuncuda bir ilerleme göster
      if (processedPlayers % 50 === 0) {
        console.log(`      ✅ ${processedPlayers} oyuncu işlendi${fetchApiStats ? ` (${apiCalls} API, ${skippedPlayers} atlandı)` : ''}`);
      }
      
      // Rate limiting (sadece API çağrısı varsa) - batch'ler arası delay
      // API-Football PRO: 100 req/min = her 0.6 saniyede 1 req
      if (fetchApiStats && i + batchSize < playersToProcess.length) {
        await delay(REQUEST_INTERVAL); // Batch'ler arası 0.6 saniye (rate limit korunur)
      }
    }

    // ✅ Takım bitti: players tablosundaki rating'leri team_squads.players[] ile senkronize et (check-status buradan sayıyor)
    await syncTeamSquadRatings(teamId, season);
  }
  
  console.log(`\n✅ TAMAMLANDI: ${processedPlayers}/${totalPlayers} oyuncu işlendi (${skippedPlayers} zaten rating'li, ${errors} hata, ${apiCalls} API çağrısı)`);
  
  return { total: totalPlayers, processed: processedPlayers, skipped: skippedPlayers, errors, apiCalls };
}

/**
 * DB'deki oyuncu verisini kullanarak rating ve tüm yetenekleri hesapla ve kaydet
 * @param {object} player - Oyuncu objesi
 * @param {number} teamId - Takım ID
 * @param {number} season - Sezon
 * @param {boolean} fetchApiStats - API'den istatistik çek
 * @param {number|null} leagueId - Takımın lig ID'si (teamToLeague'dan, ekstra sorgu yok)
 */
async function processPlayerFromDB(player, teamId, season, fetchApiStats = false, leagueId = null) {
  try {
    let attrs = getDefaultAttributesByPosition(player.position);
    
    // API'den istatistik çek (opsiyonel - 75000 limit!)
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
    
    // Oyuncu tablosuna kaydet (rating)
    const playerName = player.name || `Unknown Player ${player.id}`;
    
    const playerRecord = {
      id: player.id,
      name: playerName,
      age: player.age || null,
      nationality: player.nationality || null,
      position: player.position || null,
      rating: finalRating,
      team_id: teamId,
      photo: player.photo || null,
      updated_at: new Date().toISOString(),
    };
    
    await savePlayerToDb(playerRecord);
    
    // player_power_scores tablosuna kaydet (pas, şut, dribling, defans, fizik, hız)
    if (leagueId) {
      const powerScoreRecord = {
        player_id: player.id,
        team_id: teamId,
        league_id: leagueId,
        season: season,
        position: player.position || null,
        power_score: attrs.powerScore || attrs.rating || 75,
        shooting: attrs.shooting || null,
        passing: attrs.passing || null,
        dribbling: attrs.dribbling || null,
        defense: attrs.defense || attrs.defending || null,
        physical: attrs.physical || null,
        pace: attrs.pace || null,
        form: attrs.form || 50,
        discipline: attrs.discipline || 70,
        fitness_status: attrs.fitnessStatus || 'fit',
        updated_at: new Date().toISOString(),
      };
      
      await savePowerScore(powerScoreRecord);
    }
    
    return attrs;
  } catch (err) {
    console.warn(`⚠️ processPlayerFromDB ${player?.id}:`, err.message);
    return null;
  }
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
    // Mevcut API kullanımını kontrol et ve kalan hakkı hesapla
    MAX_API_CALLS = await getAvailableApiCalls();
    
    if (MAX_API_CALLS <= 0) {
      console.log(`\n⚠️  Kullanılabilir API hakkı yok!`);
      console.log(`   Bugünkü limit dolmuş veya yeterli yedek yok.`);
      console.log(`   Yarın tekrar deneyin veya --api parametresi olmadan çalıştırın.\n`);
      return;
    }
    
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
  if (fetchApiStats && result.skipped) {
    console.log(`   Atlandı (zaten rating'li): ${result.skipped}`);
  }
  console.log(`   Hatalar: ${result.errors}`);
  if (fetchApiStats) {
    console.log(`   API Çağrısı: ${result.apiCalls || 0}`);
    console.log(`   API Verimliliği: ${result.apiCalls > 0 ? ((result.processed / result.apiCalls) * 100).toFixed(1) : 0}% (${result.processed} oyuncu/${result.apiCalls} API)`);
  }
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
