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
const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const {
  calculatePlayerAttributesFromStats,
  calculateForm,
  getFitnessMultiplier,
  clamp0_100,
} = require('../utils/playerRatingFromStats');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
// YARDIMCI FONKSİYONLAR
// =====================================================

/**
 * Lig takımlarını çek
 */
async function getLeagueTeams(leagueId, season = CURRENT_SEASON) {
  try {
    const response = await rateLimitedRequest(() => 
      footballApi.apiRequest(`/teams?league=${leagueId}&season=${season}`)
    );
    return response?.response || [];
  } catch (error) {
    console.warn(`⚠️ Lig ${leagueId} takımları çekilemedi:`, error.message);
    return [];
  }
}

/**
 * Takım kadrosunu çek
 */
async function getTeamSquad(teamId, season = CURRENT_SEASON) {
  try {
    const response = await rateLimitedRequest(() => 
      footballApi.getTeamSquad(teamId, season)
    );
    return response?.response?.[0]?.players || [];
  } catch (error) {
    console.warn(`⚠️ Takım ${teamId} kadrosu çekilemedi:`, error.message);
    return [];
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
 * Tek bir ligi işle
 */
async function processLeague(leagueName, leagueInfo, season = CURRENT_SEASON) {
  console.log(`\n🏆 ${leagueName} (ID: ${leagueInfo.id}) işleniyor...`);
  
  const teams = await getLeagueTeams(leagueInfo.id, season);
  console.log(`   📋 ${teams.length} takım bulundu`);
  
  let totalPlayers = 0;
  let processedPlayers = 0;
  let errors = 0;
  
  for (const teamData of teams) {
    const team = teamData.team || teamData;
    console.log(`   ⚽ ${team.name} kadrosu işleniyor...`);
    
    const players = await getTeamSquad(team.id, season);
    totalPlayers += players.length;
    
    for (const player of players) {
      try {
        await processPlayer(player, team.id, leagueInfo.id, season);
        processedPlayers++;
        
        // Her 20 oyuncuda bir ilerleme göster
        if (processedPlayers % 20 === 0) {
          console.log(`      ✅ ${processedPlayers} oyuncu işlendi`);
        }
        
        // Rate limiting
        await delay(200);
      } catch (error) {
        errors++;
        console.warn(`      ⚠️ ${player.name} işlenemedi:`, error.message);
      }
    }
  }
  
  console.log(`   ✅ ${leagueName} tamamlandı: ${processedPlayers}/${totalPlayers} oyuncu (${errors} hata)`);
  
  return { total: totalPlayers, processed: processedPlayers, errors };
}

/**
 * Tüm ligleri işle
 */
async function processAllLeagues(season = CURRENT_SEASON) {
  console.log('🌍 TÜM LİGLER İŞLENİYOR...');
  console.log(`📅 Sezon: ${season}`);
  console.log('='.repeat(50));
  
  // Önceliğe göre sırala (1 = en yüksek öncelik)
  const sortedLeagues = Object.entries(SUPPORTED_LEAGUES)
    .sort((a, b) => a[1].priority - b[1].priority);
  
  const stats = {
    totalLeagues: sortedLeagues.length,
    processedLeagues: 0,
    totalPlayers: 0,
    processedPlayers: 0,
    errors: 0,
    startTime: Date.now(),
  };
  
  for (const [name, info] of sortedLeagues) {
    try {
      const result = await processLeague(name, info, season);
      stats.totalPlayers += result.total;
      stats.processedPlayers += result.processed;
      stats.errors += result.errors;
      stats.processedLeagues++;
    } catch (error) {
      console.error(`❌ ${name} ligi işlenirken hata:`, error.message);
    }
  }
  
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SONUÇ ÖZETİ');
  console.log('='.repeat(50));
  console.log(`   Ligler: ${stats.processedLeagues}/${stats.totalLeagues}`);
  console.log(`   Oyuncular: ${stats.processedPlayers}/${stats.totalPlayers}`);
  console.log(`   Hatalar: ${stats.errors}`);
  console.log(`   Süre: ${duration} dakika`);
  console.log('='.repeat(50));
  
  return stats;
}

// =====================================================
// CLI
// =====================================================
const args = process.argv.slice(2);
let targetLeague = null;
let processAll = false;
let season = CURRENT_SEASON;

args.forEach(arg => {
  if (arg.startsWith('--league=')) {
    targetLeague = parseInt(arg.split('=')[1], 10);
  }
  if (arg === '--all') {
    processAll = true;
  }
  if (arg.startsWith('--season=')) {
    season = parseInt(arg.split('=')[1], 10);
  }
});

async function main() {
  console.log('🚀 TacticIQ Oyuncu Rating Güncelleme Sistemi');
  console.log('='.repeat(50));
  
  if (processAll) {
    await processAllLeagues(season);
  } else if (targetLeague) {
    const leagueEntry = Object.entries(SUPPORTED_LEAGUES)
      .find(([, info]) => info.id === targetLeague);
    
    if (leagueEntry) {
      await processLeague(leagueEntry[0], leagueEntry[1], season);
    } else {
      console.error(`❌ Lig bulunamadı: ${targetLeague}`);
      console.log('Desteklenen ligler:');
      Object.entries(SUPPORTED_LEAGUES).forEach(([name, info]) => {
        console.log(`   ${info.id}: ${name}`);
      });
    }
  } else {
    // Default: Sadece Süper Lig
    console.log('💡 Varsayılan: Sadece Süper Lig işlenecek');
    console.log('   Tüm ligler için: node update-all-player-ratings.js --all');
    await processLeague('Süper Lig', SUPPORTED_LEAGUES['Süper Lig'], season);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

module.exports = {
  processAllLeagues,
  processLeague,
  processPlayer,
  SUPPORTED_LEAGUES,
};
