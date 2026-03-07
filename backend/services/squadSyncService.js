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
/** API'den gelmeyen koç/oyuncu vb. için standart gösterim (rapor + UI tutarlı) */
const UNKNOWN_LABEL = 'Bilinmiyor';
const DELAY_BETWEEN_TEAMS_MS = 2000; // API rate limit: 2 sn arayla
const SQUAD_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 saat = günde 2 kez

let syncTimer = null;
let isSyncing = false;
let lastSquadSyncTime = null;
let lastSquadSyncStats = { teams: 0, ok: 0, fail: 0, coachUpdated: 0, colorsUpdated: 0 };

const { selectActiveCoach } = require('../utils/selectActiveCoach');

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
    // Forma numarası kontrolü: null, undefined veya 99'dan büyükse (player ID olabilir) null yap
    let playerNumber = player.number;
    if (playerNumber == null || playerNumber === '' || playerNumber > 99) {
      playerNumber = null;
    }
    
    const fullName = (player.firstname && player.lastname)
      ? `${String(player.firstname).trim()} ${String(player.lastname).trim()}`
      : player.name;
    return {
      id: player.id,
      name: fullName || player.name || UNKNOWN_LABEL,
      firstname: player.firstname || null,
      lastname: player.lastname || null,
      age: player.age || dbPlayer?.age || null,
      number: playerNumber,
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

// 429 gelirse 60 sn bekleyip tekrar dene (max 2 retry) — koç/renk güncellemesi atlanmasın
async function withRetry429(fn, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const is429 = (e?.response?.status === 429) || (e?.message && String(e.message).includes('429'));
      if (is429 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 60000));
      } else {
        throw e;
      }
    }
  }
}

// ✅ Tek bir takımın TÜM verilerini sync et: kadro + coach + takım bilgileri + renkler
// coachAndColorsOnly: true → sadece /coachs + /teams (2 çağrı), kadro/lineup/injuries atlanır — API tasarrufu
async function syncOneTeamSquad(teamId, teamName, options = {}) {
  const { syncCoach = true, syncTeamInfo = true, coachAndColorsOnly = false } = options;
  const result = { ok: false, count: 0, coachUpdated: false, colorsUpdated: false };
  
  try {
    // 1. COACH'U HER ZAMAN /coachs ENDPOINT'İNDEN ÇEK (429'da 60sn bekleyip tekrar dene)
    let currentCoach = null;
    if (syncCoach) {
      try {
        const coachData = await withRetry429(() => footballApi.getTeamCoach(teamId));
        if (coachData.response && coachData.response.length > 0) {
          const selected = selectActiveCoach(coachData.response, teamId);
          
          if (selected) {
            currentCoach = selected.name;
            
            // Coach'u hemen DB'ye kaydet (api_football_id sayı olarak eşleşsin)
            if (supabase && currentCoach) {
              const tid = Number(teamId) || teamId;
              const { error } = await supabase
                .from('static_teams')
                .update({ 
                  coach: currentCoach, 
                  coach_api_id: selected.id,
                  last_updated: new Date().toISOString() 
                })
                .eq('api_football_id', tid);
              if (error) {
                console.warn(`⚠️ Coach DB update failed for ${teamId}:`, error.message);
              } else {
                result.coachUpdated = true;
              }
            }
          }
        }
      } catch (coachErr) {
        console.warn(`⚠️ Coach fetch failed for ${teamId}:`, coachErr.message);
      }
      // API'den koç gelmediyse ve DB'de de yoksa standart "Bilinmiyor" yaz — rapor ve UI tutarlı olsun
      if (!currentCoach && supabase) {
        const { data: row } = await supabase.from('static_teams').select('coach').eq('api_football_id', teamId).maybeSingle();
        if (row && (row.coach == null || row.coach === '')) {
          const { error } = await supabase.from('static_teams').update({ coach: UNKNOWN_LABEL, last_updated: new Date().toISOString() }).eq('api_football_id', teamId);
          if (!error) result.coachUpdated = true;
        }
      }
    }
    
    // HAFİF SYNC: Sadece koç + renk (kadro zaten var). 2 API çağrısı (coach + team info) — büyük API tasarrufu
    if (coachAndColorsOnly && syncTeamInfo) {
      try {
        const teamInfo = await footballApi.getTeamInfo(teamId).catch(() => ({ response: [] }));
        const teamInfoData = teamInfo?.response?.length ? { response: teamInfo.response } : { response: [] };
        let colors = null;
        if (teamInfoData.response?.length > 0) {
          try { colors = await footballApi.getTeamColors(teamId, teamInfoData.response[0]); } catch (e) {}
        }
        if (!colors?.length || colors[0] === '#333333') colors = KNOWN_TEAM_COLORS[teamId];
        if (!colors?.length) colors = ['#1a1a2e', '#334155'];
        if (supabase && colors?.length >= 2) {
          await supabase.from('static_teams').update({
            colors: JSON.stringify(colors), colors_primary: colors[0], colors_secondary: colors[1],
            last_updated: new Date().toISOString()
          }).eq('api_football_id', teamId);
          result.colorsUpdated = true;
        }
        result.ok = true;
        return result;
      } catch (e) {
        if (supabase) {
          await supabase.from('static_teams').update({
            colors_primary: '#1a1a2e', colors_secondary: '#334155', last_updated: new Date().toISOString()
          }).eq('api_football_id', teamId);
          result.colorsUpdated = true;
        }
        result.ok = true;
        return result;
      }
    }
    
    // 2. ÖNCELİK: /players/squads - TAM KADRO (resmi liste, transferler dahil)
    //    Lineup sadece 18 oyuncu (11+7) ve son maça göre - güncel değil!
    let squadData = null;
    try {
      const squadApi = await footballApi.getTeamSquad(teamId, CURRENT_SEASON, true); // skipCache = taze veri
      if (squadApi.response && squadApi.response.length > 0 && squadApi.response[0].players?.length > 0) {
        squadData = squadApi.response[0];
      }
    } catch (squadErr) {
      console.warn(`⚠️ Squad fetch failed for ${teamId}:`, squadErr.message);
    }

    // 3. Lineup (son maç) - sadece /players/squads boşsa fallback
    let lineupPlayers = [];
    let lineupCoach = null;
    if (!squadData || !squadData.players?.length) {
      try {
        const fixturesData = await footballApi.getFixturesByTeam(teamId, CURRENT_SEASON, 1);
        if (fixturesData.response && fixturesData.response.length > 0) {
          const lastMatch = fixturesData.response[0];
          const matchId = lastMatch.fixture.id;
          const lineupData = await footballApi.getFixtureLineups(matchId);
          if (lineupData.response) {
            const teamLineup = lineupData.response.find(l => l.team.id === teamId);
            if (teamLineup) {
              if (teamLineup.coach?.name && !currentCoach) lineupCoach = teamLineup.coach.name;
              if (teamLineup.startXI) {
                teamLineup.startXI.forEach(p => lineupPlayers.push({
                  id: p.player.id, name: p.player?.name || UNKNOWN_LABEL, number: p.player?.number ?? 0,
                  position: p.player.pos === 'G' ? 'Goalkeeper' : p.player.pos === 'D' ? 'Defender' :
                    p.player.pos === 'M' ? 'Midfielder' : p.player.pos === 'F' ? 'Attacker' : p.player.pos
                }));
              }
              if (teamLineup.substitutes) {
                teamLineup.substitutes.forEach(p => lineupPlayers.push({
                  id: p.player?.id, name: p.player?.name || UNKNOWN_LABEL, number: p.player?.number ?? 0,
                  position: p.player.pos === 'G' ? 'Goalkeeper' : p.player.pos === 'D' ? 'Defender' :
                    p.player.pos === 'M' ? 'Midfielder' : p.player.pos === 'F' ? 'Attacker' : (p.player.pos || 'Unknown')
                }));
              }
            }
          }
        }
      } catch (lineupErr) {
        console.warn(`⚠️ Lineup fetch failed for ${teamId}:`, lineupErr.message);
      }
    }

    const finalCoach = currentCoach || lineupCoach;

    // Takım bilgileri (renkler için) ve sakatlıklar
    // API tasarrufu: injuries sadece kadro veya lineup varsa çekilir (aksi halde kullanılmıyor)
    const needInjuries = (squadData?.players?.length > 0) || (lineupPlayers.length > 0);
    let teamInfoData = { response: [] };
    let injuriesList = [];
    const [injuries, teamInfo] = await Promise.all([
      needInjuries ? footballApi.getTeamInjuries(teamId, CURRENT_SEASON).catch(() => []) : Promise.resolve([]),
      syncTeamInfo ? footballApi.getTeamInfo(teamId).catch(() => ({ response: [] })) : Promise.resolve({ response: [] }),
    ]);
    injuriesList = Array.isArray(injuries) ? injuries : [];
    teamInfoData = teamInfo || { response: [] };

    // 4a. /players/squads'tan tam kadro varsa kaydet (rating + sakatlık dahil)
    if (squadData && squadData.players && squadData.players.length > 0) {
      const fallbackPlayers = squadData.players;
      const playerIds = fallbackPlayers.map((p) => p.id);
      const injuriesMap = buildInjuriesMap(injuriesList);

      let dbPlayersMap = {};
      if (supabase && playerIds.length > 0) {
        const { data: dbPlayers, error } = await supabase
          .from('players')
          .select('id, team_id, rating, age, nationality, position')
          .in('id', playerIds);
        if (!error && dbPlayers) {
          dbPlayersMap = dbPlayers.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        }

        // /players/squads bu takımın güncel kadrosudur (API-Football resmi kaynak).
        // players tablosundaki team_id'yi bu takıma güncelle - stale verileri düzelt.
        const stalePlayerIds = playerIds.filter(pid => {
          const dbPlayer = dbPlayersMap[pid];
          return dbPlayer && Number(dbPlayer.team_id) !== Number(teamId);
        });
        if (stalePlayerIds.length > 0 && supabase) {
          await supabase
            .from('players')
            .update({ team_id: Number(teamId) })
            .in('id', stalePlayerIds);
          console.log(`📝 [SQUAD SYNC] ${teamName || teamId}: Updated team_id for ${stalePlayerIds.length} player(s) to match squad`);
        }
      }

      const enhancedPlayers = buildEnhancedPlayers(fallbackPlayers, dbPlayersMap, injuriesMap);
      const teamInfo = squadData.team || { id: teamId, name: teamName || null };

      const { error } = await supabase.from('team_squads').upsert(
        {
          team_id: teamId,
          season: CURRENT_SEASON,
          team_name: teamInfo.name || teamName,
          team_data: { ...teamInfo, coach: finalCoach },
          players: enhancedPlayers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,season' }
      );

      if (!error) {
        result.ok = true;
        result.count = enhancedPlayers.length;
        result.source = 'players/squads';
        // Renkleri güncelle
        if (syncTeamInfo && teamInfoData.response?.length > 0) {
          let colors = null;
          try {
            colors = await footballApi.getTeamColors(teamId, teamInfoData.response[0]);
          } catch (e) {}
          if (!colors?.length || colors[0] === '#333333') colors = KNOWN_TEAM_COLORS[teamId];
          if (!colors?.length) colors = ['#1a1a2e', '#334155'];
          if (colors?.length >= 2 && supabase) {
            await supabase.from('static_teams').update({
              colors: JSON.stringify(colors), colors_primary: colors[0], colors_secondary: colors[1],
              last_updated: new Date().toISOString()
            }).eq('api_football_id', teamId);
            result.colorsUpdated = true;
          }
        }
        return result;
      }
    }

    // 4b. Lineup fallback (sadece 18 oyuncu - /players/squads boşsa)
    // KORUMA: Mevcut DB'de daha büyük kadro varsa lineup ile üzerine yazma
    if (lineupPlayers.length > 0) {
      if (supabase) {
        const { data: existingSquad } = await supabase
          .from('team_squads')
          .select('players')
          .eq('team_id', teamId)
          .eq('season', CURRENT_SEASON)
          .maybeSingle();
        
        const existingCount = existingSquad?.players?.length || 0;
        
        if (existingCount > lineupPlayers.length) {
          console.log(`⚠️ [LINEUP SKIP] ${teamName || teamId}: Mevcut kadro (${existingCount}) lineup'tan (${lineupPlayers.length}) büyük, üzerine yazılmadı`);
          result.ok = true;
          result.count = existingCount;
          result.source = 'cached';
        } else {
          await supabase.from('team_squads').upsert({
            team_id: teamId, season: CURRENT_SEASON, team_name: teamName || `Team ${teamId}`,
            team_data: { id: teamId, name: teamName, coach: finalCoach },
            players: lineupPlayers, updated_at: new Date().toISOString(),
          }, { onConflict: 'team_id,season' });
          result.ok = true;
          result.count = lineupPlayers.length;
          result.source = 'lineup';
        }
      }
      if (lineupCoach && !currentCoach && supabase) {
        await supabase.from('static_teams').update({ coach: lineupCoach, last_updated: new Date().toISOString() }).eq('api_football_id', teamId);
        result.coachUpdated = true;
      }
      if (syncTeamInfo && teamInfoData.response?.length > 0) {
        let colors = null;
        try { colors = await footballApi.getTeamColors(teamId, teamInfoData.response[0]); } catch (e) {}
        if (!colors?.length || colors[0] === '#333333') colors = KNOWN_TEAM_COLORS[teamId];
        if (!colors?.length) colors = ['#1a1a2e', '#334155'];
        if (colors?.length >= 2 && supabase) {
          await supabase.from('static_teams').update({
            colors: JSON.stringify(colors), colors_primary: colors[0], colors_secondary: colors[1],
            last_updated: new Date().toISOString()
          }).eq('api_football_id', teamId);
          result.colorsUpdated = true;
        }
      }
      return result;
    }

    // 5. Her iki kaynak da boş - mevcut DB verisini koru, renkleri güncelle
    const updateData = { last_updated: new Date().toISOString() };
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
      // Hiç renk yoksa varsayılan yaz — raporda "Renkler ile" sayısı artsın, sonra gerçek renk gelirse güncellenir
      if (!colors || colors.length < 2) {
        colors = ['#1a1a2e', '#334155'];
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
      await supabase.from('static_teams').update(updateData).eq('api_football_id', teamId);
    }

    // API'den kadro gelmedi: yine de team_squads'a minimal satir yaz (Kadrolar 2025 sayisi artsin, ayni takim tekrar islenmesin)
    if (supabase) {
      const { data: existingSquad } = await supabase
        .from('team_squads')
        .select('players')
        .eq('team_id', teamId)
        .eq('season', CURRENT_SEASON)
        .maybeSingle();
      if (existingSquad?.players?.length > 0) {
        result.ok = true;
        result.count = existingSquad.players.length;
        result.reason = 'cached';
      } else {
        const { error: upsertErr } = await supabase.from('team_squads').upsert(
          {
            team_id: teamId,
            season: CURRENT_SEASON,
            team_name: teamName || `Team ${teamId}`,
            team_data: { id: teamId, name: teamName, coach: finalCoach },
            players: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'team_id,season' }
        );
        if (!upsertErr) {
          result.ok = true;
          result.count = 0;
          result.reason = 'empty';
        }
      }
    }
    return { ...result, reason: result.reason || 'empty' };
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

/**
 * Orphaned squad kayitlarini temizle:
 * 1. static_teams'te olmayan takimlarin kadrolarini sil
 * 2. Ayni (team_id, season) ciftinden birden fazla kayit varsa en yenisini tut
 */
async function cleanupOrphanedSquads() {
  if (!supabase) return { removed: 0, deduped: 0 };
  let removed = 0, deduped = 0;
  const PAGE = 1000;

  try {
    const validIds = new Set();
    let off = 0;
    while (true) {
      const { data } = await supabase
        .from('static_teams')
        .select('api_football_id')
        .range(off, off + PAGE - 1);
      if (!data || data.length === 0) break;
      data.forEach(t => validIds.add(t.api_football_id));
      if (data.length < PAGE) break;
      off += PAGE;
    }
    if (validIds.size === 0) return { removed: 0, deduped: 0 };

    const allSquads = [];
    off = 0;
    while (true) {
      const { data } = await supabase
        .from('team_squads')
        .select('team_id, season, updated_at')
        .eq('season', CURRENT_SEASON)
        .range(off, off + PAGE - 1);
      if (!data || data.length === 0) break;
      allSquads.push(...data);
      if (data.length < PAGE) break;
      off += PAGE;
    }

    const orphanedIds = new Set();
    const seen = new Map();
    const duplicateRows = [];

    for (const sq of allSquads) {
      if (!validIds.has(sq.team_id)) {
        orphanedIds.add(sq.team_id);
        continue;
      }
      const key = `${sq.team_id}_${sq.season}`;
      const existing = seen.get(key);
      if (existing) {
        const keepThis = (sq.updated_at || '') > (existing.updated_at || '');
        if (keepThis) {
          duplicateRows.push({ team_id: existing.team_id, season: existing.season, updated_at: existing.updated_at });
          seen.set(key, sq);
        } else {
          duplicateRows.push({ team_id: sq.team_id, season: sq.season, updated_at: sq.updated_at });
        }
      } else {
        seen.set(key, sq);
      }
    }

    if (orphanedIds.size > 0) {
      const ids = [...orphanedIds];
      const batchSize = 200;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from('team_squads')
          .delete()
          .eq('season', CURRENT_SEASON)
          .in('team_id', batch);
        if (!error) removed += batch.length;
        else console.error('[CLEANUP] Orphan silme hatasi:', error.message);
      }
      console.log(`🧹 [CLEANUP] ${removed} orphaned squad kaydi silindi (static_teams'te yok)`);
    }

    if (duplicateRows.length > 0) {
      console.log(`🧹 [CLEANUP] ${duplicateRows.length} duplicate squad kaydi tespit edildi`);
      deduped = duplicateRows.length;
    }

  } catch (err) {
    console.error('[CLEANUP] Hata:', err.message);
  }

  return { removed, deduped };
}

module.exports = {
  syncAllSquads,
  syncOneTeamSquad,
  syncSingleTeamNow,
  startDailySquadSync,
  stopDailySquadSync,
  getSquadSyncStatus,
  cleanupOrphanedSquads,
  CURRENT_SEASON,
};
