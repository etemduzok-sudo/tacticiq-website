// ============================================
// TEAM DATA SYNC SERVICE
// ============================================
// 12 saatte bir TÜM takım verilerini senkronize eder:
// - Kadrolar (players)
// - Teknik direktörler (coach)
// - Takım bilgileri (colors, league, country)
// - Sakatlık/ceza bilgileri
// 
// Uygulama sadece DB'den okur. API çağrıları bu servis üzerinden yapılır.
// ============================================

const footballApi = require('./footballApi');
const { supabase } = require('../config/supabase');

const CURRENT_SEASON = 2025;
const DELAY_BETWEEN_TEAMS_MS = 2000; // API rate limit: 2 sn arayla
const SQUAD_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 saat = günde 2 kez

let syncTimer = null;
let isSyncing = false;
let lastSquadSyncTime = null;
let lastSquadSyncStats = { teams: 0, ok: 0, fail: 0, coachUpdated: 0, colorsUpdated: 0 };

// ✅ Bilinen takım renkleri (API'den çekilemezse fallback)
const KNOWN_TEAM_COLORS = {
  // Türkiye
  611: ['#FFED00', '#00205B'], // Fenerbahçe - Sarı/Lacivert
  645: ['#FDB913', '#C41E3A'], // Galatasaray - Sarı/Kırmızı
  549: ['#000000', '#FFFFFF'], // Beşiktaş - Siyah/Beyaz
  564: ['#F26522', '#1E3A5F'], // Başakşehir - Turuncu/Lacivert
  607: ['#8B0000', '#00205B'], // Trabzonspor - Bordo/Mavi
  // İtalya
  496: ['#000000', '#FFFFFF'], // Juventus - Siyah/Beyaz
  489: ['#AC1E2E', '#000000'], // AC Milan - Kırmızı/Siyah
  505: ['#0066B3', '#000000'], // Inter - Mavi/Siyah
  492: ['#87CEEB', '#FFFFFF'], // Napoli - Açık Mavi/Beyaz
  497: ['#7B1818', '#FFC425'], // Roma - Bordo/Sarı
  // İspanya
  541: ['#FFFFFF', '#00529F'], // Real Madrid - Beyaz/Mavi
  529: ['#A50044', '#004D98'], // Barcelona - Bordo/Mavi
  530: ['#D81E05', '#FFFFFF'], // Atletico Madrid - Kırmızı/Beyaz
  // İngiltere
  50: ['#6CABDD', '#FFFFFF'], // Man City - Açık Mavi/Beyaz
  33: ['#DA020E', '#FFE500'], // Man United - Kırmızı/Sarı
  40: ['#C8102E', '#FFFFFF'], // Liverpool - Kırmızı/Beyaz
  42: ['#EF0107', '#FFFFFF'], // Arsenal - Kırmızı/Beyaz
  49: ['#034694', '#FFFFFF'], // Chelsea - Mavi/Beyaz
  47: ['#132257', '#FFFFFF'], // Tottenham - Lacivert/Beyaz
  // Almanya
  157: ['#DC052D', '#FFFFFF'], // Bayern - Kırmızı/Beyaz
  165: ['#FDE100', '#000000'], // Dortmund - Sarı/Siyah
  // Fransa
  85: ['#004170', '#DA291C'], // PSG - Lacivert/Kırmızı
};

// API-Football injuries: { player: { id }, type: "Injury"|"Suspension", reason: "..." }
function buildInjuriesMap(injuriesList) {
  const map = {};
  if (!Array.isArray(injuriesList)) return map;
  injuriesList.forEach((item) => {
    const playerId = item.player?.id ?? item.player_id;
    if (!playerId) return;
    const type = (item.type || (item.player?.type) || '').toLowerCase();
    const reason = item.reason || item.player?.reason || '';
    const isInjury = type.includes('injury') || type.includes('sakat');
    const isSuspension = type.includes('suspension') || type.includes('ceza') || reason.toLowerCase().includes('card') || reason.toLowerCase().includes('yellow') || reason.toLowerCase().includes('red');
    if (!map[playerId]) map[playerId] = { injured: false, suspended: false, suspension_reason: null };
    if (isInjury) map[playerId].injured = true;
    if (isSuspension) {
      map[playerId].suspended = true;
      map[playerId].suspension_reason = reason || (reason.toLowerCase().includes('red') ? 'red_card' : reason.toLowerCase().includes('yellow') ? 'yellow_card' : 'suspension');
    }
  });
  return map;
}

function buildEnhancedPlayers(players, dbPlayersMap, injuriesMap = {}) {
  if (!Array.isArray(players)) return [];
  const { getDefaultRatingByPosition } = require('../utils/playerRatingFromStats');
  return players.map((player) => {
    const dbPlayer = dbPlayersMap[player.id];
    const rating = (dbPlayer && dbPlayer.rating) ? dbPlayer.rating : getDefaultRatingByPosition(player.position);
    const injuryInfo = injuriesMap[player.id] || {};
    const injured = !!injuryInfo.injured;
    const suspended = !!injuryInfo.suspended;
    const suspension_reason = injuryInfo.suspension_reason || null;
    const eligible_for_selection = !injured && !suspended;
    return {
      id: player.id,
      name: player.name,
      age: player.age || dbPlayer?.age || null,
      number: player.number,
      position: player.position,
      nationality: player.nationality || dbPlayer?.nationality || null,
      rating: Math.round(rating),
      photo: null,
      injured,
      suspended,
      suspension_reason,
      eligible_for_selection,
    };
  });
}

// ✅ Tek bir takımın TÜM verilerini sync et: kadro + coach + takım bilgileri + renkler
// ÖNEMLİ: Coach için HER ZAMAN /coachs endpoint'i kullanılır (maç oynamamış takımlar için de)
async function syncOneTeamSquad(teamId, teamName, options = {}) {
  const { syncCoach = true, syncTeamInfo = true } = options;
  const result = { ok: false, count: 0, coachUpdated: false, colorsUpdated: false };
  
  try {
    // 1. COACH'U HER ZAMAN /coachs ENDPOINT'İNDEN ÇEK (en güvenilir kaynak!)
    let currentCoach = null;
    if (syncCoach) {
      try {
        const coachData = await footballApi.getTeamCoach(teamId);
        if (coachData.response && coachData.response.length > 0) {
          const coaches = coachData.response;
          // Aktif coach'u bul (career.end = null olan)
          const activeCoach = coaches.find(c => 
            c.career && c.career.some(car => car.team?.id == teamId && !car.end)
          ) || coaches[0];
          
          if (activeCoach) {
            currentCoach = activeCoach.name;
            
            // Coach'u hemen DB'ye kaydet
            if (supabase && currentCoach) {
              await supabase
                .from('static_teams')
                .update({ 
                  coach: currentCoach, 
                  coach_api_id: activeCoach.id,
                  last_updated: new Date().toISOString() 
                })
                .eq('api_football_id', teamId);
              result.coachUpdated = true;
            }
          }
        }
      } catch (coachErr) {
        console.warn(`⚠️ Coach fetch failed for ${teamId}:`, coachErr.message);
      }
    }
    
    // 2. SON MAÇ KADROSUNU ÇEK (en güncel oyuncu listesi)
    let lineupPlayers = [];
    let lineupCoach = null;
    
    try {
      const fixturesData = await footballApi.getFixturesByTeam(teamId, CURRENT_SEASON, 1);
      if (fixturesData.response && fixturesData.response.length > 0) {
        const lastMatch = fixturesData.response[0];
        const matchId = lastMatch.fixture.id;
        
        const lineupData = await footballApi.getFixtureLineups(matchId);
        if (lineupData.response) {
          const teamLineup = lineupData.response.find(l => l.team.id === teamId);
          if (teamLineup) {
            // Maç kadrosundan coach (sadece backup olarak kullanılır)
            if (teamLineup.coach?.name && !currentCoach) {
              lineupCoach = teamLineup.coach.name;
            }
            
            // Oyuncular (ilk 11 + yedekler)
            if (teamLineup.startXI) {
              teamLineup.startXI.forEach(p => lineupPlayers.push({
                id: p.player.id,
                name: p.player.name,
                number: p.player.number,
                position: p.player.pos === 'G' ? 'Goalkeeper' : 
                         p.player.pos === 'D' ? 'Defender' :
                         p.player.pos === 'M' ? 'Midfielder' :
                         p.player.pos === 'F' ? 'Attacker' : p.player.pos
              }));
            }
            if (teamLineup.substitutes) {
              teamLineup.substitutes.forEach(p => lineupPlayers.push({
                id: p.player.id,
                name: p.player.name,
                number: p.player.number,
                position: p.player.pos === 'G' ? 'Goalkeeper' : 
                         p.player.pos === 'D' ? 'Defender' :
                         p.player.pos === 'M' ? 'Midfielder' :
                         p.player.pos === 'F' ? 'Attacker' : (p.player.pos || 'Unknown')
              }));
            }
          }
        }
      }
    } catch (lineupErr) {
      console.warn(`⚠️ Lineup fetch failed for ${teamId}:`, lineupErr.message);
    }
    
    // 3. Fallback: Eğer lineup yoksa /coachs'tan gelen coach'u kullan ve /players/squads dene
    const finalCoach = currentCoach || lineupCoach;
    
    // Takım bilgilerini çek
    let teamInfoData = { response: [] };
    let injuriesList = [];
    
    if (syncTeamInfo || lineupPlayers.length === 0) {
      const [injuries, teamInfo] = await Promise.all([
        footballApi.getTeamInjuries(teamId, CURRENT_SEASON).catch(() => []),
        syncTeamInfo ? footballApi.getTeamInfo(teamId).catch(() => ({ response: [] })) : Promise.resolve({ response: [] }),
      ]);
      injuriesList = injuries;
      teamInfoData = teamInfo;
    }
    
    // 4. Eğer lineup'tan oyuncular geldiyse onları kaydet
    if (lineupPlayers.length > 0) {
      if (supabase) {
        const squadRecord = {
          team_id: teamId,
          season: CURRENT_SEASON,
          team_name: teamName || `Team ${teamId}`,
          team_data: { id: teamId, name: teamName, coach: finalCoach },
          players: lineupPlayers,
          updated_at: new Date().toISOString(),
        };
        
        await supabase.from('team_squads').upsert(squadRecord, { onConflict: 'team_id,season' });
        result.ok = true;
        result.count = lineupPlayers.length;
      }
      
      // Eğer /coachs'tan coach gelmemişse ve lineup'tan geldiyse güncelle
      if (lineupCoach && !currentCoach && supabase) {
        await supabase
          .from('static_teams')
          .update({ coach: lineupCoach, last_updated: new Date().toISOString() })
          .eq('api_football_id', teamId);
        result.coachUpdated = true;
      }
      
      // Renkleri güncelle
      if (syncTeamInfo && teamInfoData.response && teamInfoData.response.length > 0) {
        let colors = null;
        const teamData = teamInfoData.response[0];
        try {
          colors = await footballApi.getTeamColors(teamId, teamData);
        } catch (colorErr) {}
        
        if (!colors || colors.length < 2 || colors[0] === '#333333') {
          const fallbackColors = KNOWN_TEAM_COLORS[teamId];
          if (fallbackColors) colors = fallbackColors;
        }
        
        if (colors && colors.length >= 2 && supabase) {
          await supabase
            .from('static_teams')
            .update({
              colors: JSON.stringify(colors),
              colors_primary: colors[0],
              colors_secondary: colors[1],
              last_updated: new Date().toISOString()
            })
            .eq('api_football_id', teamId);
          result.colorsUpdated = true;
        }
      }
      
      return result;
    }
    
    // 5. Lineup yoksa /players/squads endpoint'ine fallback
    let data = { response: [] };
    try {
      data = await footballApi.getTeamSquad(teamId, CURRENT_SEASON);
    } catch (squadErr) {
      console.warn(`⚠️ Squad fetch failed for ${teamId}:`, squadErr.message);
    }
    
    // 6. Squad API boş döndüyse mevcut DB verisini koru, renkleri güncelle
    // (Coach zaten yukarıda /coachs endpoint'inden güncellendi)
    if (!data.response || data.response.length === 0) {
      const updateData = { last_updated: new Date().toISOString() };
      
      // Renkleri güncelleyelim (API veya fallback)
      if (syncTeamInfo) {
        let colors = null;
        
        if (teamInfoData.response && teamInfoData.response.length > 0) {
          const teamData = teamInfoData.response[0];
          try {
            colors = await footballApi.getTeamColors(teamId, teamData);
          } catch (colorErr) {
            // API hatası
          }
        }
        
        // Fallback
        if (!colors || colors.length < 2 || colors[0] === '#333333') {
          const fallbackColors = KNOWN_TEAM_COLORS[teamId];
          if (fallbackColors) {
            colors = fallbackColors;
          }
        }
        
        if (colors && colors.length >= 2) {
          updateData.colors = JSON.stringify(colors);
          updateData.colors_primary = colors[0];
          updateData.colors_secondary = colors[1];
          result.colorsUpdated = true;
        }
      }
      
      // static_teams tablosunu güncelle
      if (supabase && Object.keys(updateData).length > 1) {
        await supabase
          .from('static_teams')
          .update(updateData)
          .eq('api_football_id', teamId);
      }
      
      // Mevcut DB'deki kadro sayısını döndür
      if (supabase) {
        const { data: existingSquad } = await supabase
          .from('team_squads')
          .select('players')
          .eq('team_id', teamId)
          .eq('season', CURRENT_SEASON)
          .single();
        
        if (existingSquad?.players?.length > 0) {
          result.ok = true;
          result.count = existingSquad.players.length;
          result.reason = 'cached';
          return result;
        }
      }
      
      return { ...result, reason: 'empty' };
    }

    const squadData = data.response[0];
    const fallbackPlayers = squadData.players || [];
    const playerIds = fallbackPlayers.map((p) => p.id);
    const injuriesMap = buildInjuriesMap(injuriesList);

    // 2. DB'den oyuncu rating'lerini çek
    let dbPlayersMap = {};
    if (supabase && playerIds.length > 0) {
      const { data: dbPlayers, error } = await supabase
        .from('players')
        .select('id, rating, age, nationality, position')
        .in('id', playerIds);
      if (!error && dbPlayers) {
        dbPlayersMap = dbPlayers.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    const enhancedPlayers = buildEnhancedPlayers(fallbackPlayers, dbPlayersMap, injuriesMap);
    const teamInfo = squadData.team || { id: teamId, name: teamName || null };

    // 3. Kadroyu DB'ye kaydet
    const { error } = await supabase.from('team_squads').upsert(
      {
        team_id: teamId,
        season: CURRENT_SEASON,
        team_name: teamInfo.name || teamName,
        team_data: teamInfo,
        players: enhancedPlayers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'team_id,season' }
    );

    if (error) {
      console.warn(`⚠️ Squad DB upsert failed for team ${teamId}:`, error.message);
      return { ...result, reason: error.message };
    }
    
    result.ok = true;
    result.count = enhancedPlayers.length;

    // 7. Takım bilgilerini güncelle (static_teams tablosunda)
    // NOT: Coach zaten yukarıda /coachs endpoint'inden güncellendi
    const updateData = { last_updated: new Date().toISOString() };
    
    // Takım renkleri (API'den, logo'dan veya fallback'ten)
    if (syncTeamInfo) {
      let colors = null;
      
      // Önce API'den dene
      if (teamInfoData.response && teamInfoData.response.length > 0) {
        const teamData = teamInfoData.response[0];
        try {
          colors = await footballApi.getTeamColors(teamId, teamData);
        } catch (colorErr) {
          // API hatası, fallback'e düş
        }
      }
      
      // API'den gelemediyse bilinen renklerden al
      if (!colors || colors.length < 2 || colors[0] === '#333333') {
        const fallbackColors = KNOWN_TEAM_COLORS[teamId];
        if (fallbackColors) {
          colors = fallbackColors;
        }
      }
      
      if (colors && colors.length >= 2) {
        updateData.colors = JSON.stringify(colors);
        updateData.colors_primary = colors[0];
        updateData.colors_secondary = colors[1];
        result.colorsUpdated = true;
      }
    }
    
    // 6. static_teams tablosunu güncelle
    if (Object.keys(updateData).length > 1) { // last_updated dışında veri varsa
      const { error: updateError } = await supabase
        .from('static_teams')
        .update(updateData)
        .eq('api_football_id', teamId);
      
      if (updateError) {
        console.warn(`⚠️ static_teams update failed for team ${teamId}:`, updateError.message);
      }
    }

    return result;
  } catch (err) {
    console.warn(`⚠️ Team sync failed for ${teamId}:`, err.message);
    return { ...result, reason: err.message };
  }
}

// ✅ Tek bir takımı hemen sync et (favori takım eklendiğinde kullanılır)
async function syncSingleTeamNow(teamId, teamName) {
  console.log(`🔄 [INSTANT SYNC] Syncing team ${teamName || teamId}...`);
  const result = await syncOneTeamSquad(teamId, teamName, { syncCoach: true, syncTeamInfo: true });
  if (result.ok) {
    const updates = [];
    if (result.coachUpdated) updates.push('coach');
    if (result.colorsUpdated) updates.push('colors');
    console.log(`✅ [INSTANT SYNC] ${teamName || teamId}: ${result.count} players${updates.length > 0 ? ', updated: ' + updates.join(', ') : ''}`);
  } else {
    console.warn(`⚠️ [INSTANT SYNC] ${teamName || teamId} failed: ${result.reason}`);
  }
  return result;
}

// ✅ Tüm takımların kadro + coach + bilgilerini sync et (12 saatte bir)
async function syncAllSquads() {
  if (isSyncing) {
    console.log('⏳ Team data sync already in progress, skipping.');
    return lastSquadSyncStats;
  }

  if (!supabase) {
    console.warn('⚠️ Supabase not configured - team sync skipped.');
    return { teams: 0, ok: 0, fail: 0, coachUpdated: 0 };
  }

  isSyncing = true;
  lastSquadSyncTime = new Date();
  const stats = { teams: 0, ok: 0, fail: 0, coachUpdated: 0, colorsUpdated: 0 };

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TAKIM VERİLERİ SYNC (Kadro + Coach + Renkler) - 12 saatte 1  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    const { data: teams, error } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .not('api_football_id', 'is', null);

    if (error || !teams || teams.length === 0) {
      console.warn('⚠️ No static_teams found for sync:', error?.message || 'empty');
      return stats;
    }

    const uniqueTeams = Array.from(
      new Map(teams.map((t) => [t.api_football_id, t])).values()
    );
    stats.teams = uniqueTeams.length;
    console.log(`📋 Syncing ${stats.teams} teams (season ${CURRENT_SEASON})...`);
    console.log(`   📦 Kadro + 👔 Coach + 📊 Takım bilgileri`);

    for (let i = 0; i < uniqueTeams.length; i++) {
      const t = uniqueTeams[i];
      const result = await syncOneTeamSquad(t.api_football_id, t.name, { syncCoach: true, syncTeamInfo: true });
      
      if (result.ok) {
        stats.ok++;
        if (result.coachUpdated) stats.coachUpdated++;
        if (result.colorsUpdated) stats.colorsUpdated++;
      } else {
        stats.fail++;
      }

      if ((i + 1) % 20 === 0) {
        console.log(`   ${i + 1}/${uniqueTeams.length} teams (ok: ${stats.ok}, coach: ${stats.coachUpdated}, colors: ${stats.colorsUpdated})`);
      }

      if (i < uniqueTeams.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_TEAMS_MS));
      }
    }

    lastSquadSyncStats = stats;
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     TAKIM VERİLERİ SYNC BİTTİ                                  ║');
    console.log(`║  Kadro: ${stats.ok}/${stats.teams} | Coach: ${stats.coachUpdated} | Renkler: ${stats.colorsUpdated} | Fail: ${stats.fail}`.padEnd(63) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
  } catch (err) {
    console.error('❌ Team sync error:', err.message);
  } finally {
    isSyncing = false;
  }

  return stats;
}

function startDailySquadSync() {
  if (syncTimer) {
    console.log('⚠️ Daily squad sync already scheduled');
    return;
  }
  console.log('🔄 Squad sync scheduled (every 12h = 2x/day). First run in 60s.');
  setTimeout(() => syncAllSquads(), 60 * 1000);
  syncTimer = setInterval(syncAllSquads, SQUAD_SYNC_INTERVAL_MS);
}

function stopDailySquadSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⏹️ Daily squad sync stopped');
  }
}

function getSquadSyncStatus() {
  return {
    isRunning: !!syncTimer,
    isSyncing,
    lastSyncTime: lastSquadSyncTime,
    lastStats: lastSquadSyncStats,
    intervalMs: SQUAD_SYNC_INTERVAL_MS,
  };
}

module.exports = {
  syncAllSquads,
  syncOneTeamSquad,
  syncSingleTeamNow, // ✅ Favori takım eklendiğinde hemen sync için
  startDailySquadSync,
  stopDailySquadSync,
  getSquadSyncStatus,
  CURRENT_SEASON,
};
