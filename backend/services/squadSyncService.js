// ============================================
// SQUAD SYNC SERVICE
// ============================================
// Kadrolar günde 2 kez API'den çekilir; sakatlık/ceza bilgisi birleştirilir.
// Uygulama sadece DB'den okur. Sakat/cezalı oyuncular eligible_for_selection=false.
// ============================================

const footballApi = require('./footballApi');
const { supabase } = require('../config/supabase');

const CURRENT_SEASON = 2025;
const DELAY_BETWEEN_TEAMS_MS = 2000; // API rate limit: 2 sn arayla
const SQUAD_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 saat = günde 2 kez

let syncTimer = null;
let isSyncing = false;
let lastSquadSyncTime = null;
let lastSquadSyncStats = { teams: 0, ok: 0, fail: 0 };

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
  return players.map((player) => {
    const dbPlayer = dbPlayersMap[player.id];
    let rating = 75;
    if (dbPlayer && dbPlayer.rating) {
      rating = dbPlayer.rating;
    } else {
      const pos = (player.position || '').toLowerCase();
      if (pos.includes('goalkeeper')) rating = 78;
      else if (pos.includes('defender')) rating = 75;
      else if (pos.includes('midfielder')) rating = 76;
      else if (pos.includes('attacker')) rating = 77;
    }
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

async function syncOneTeamSquad(teamId, teamName) {
  try {
    const [squadDataRes, injuriesList] = await Promise.all([
      footballApi.getTeamSquad(teamId, CURRENT_SEASON),
      footballApi.getTeamInjuries(teamId, CURRENT_SEASON).catch(() => []),
    ]);
    const data = squadDataRes;
    if (!data.response || data.response.length === 0) return { ok: false, reason: 'empty' };

    const squadData = data.response[0];
    const players = squadData.players || [];
    const playerIds = players.map((p) => p.id);
    const injuriesMap = buildInjuriesMap(injuriesList);

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

    const enhancedPlayers = buildEnhancedPlayers(players, dbPlayersMap, injuriesMap);
    const teamInfo = squadData.team || { id: teamId, name: teamName || null };

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
      return { ok: false, reason: error.message };
    }
    return { ok: true, count: enhancedPlayers.length };
  } catch (err) {
    console.warn(`⚠️ Squad API failed for team ${teamId}:`, err.message);
    return { ok: false, reason: err.message };
  }
}

async function syncAllSquads() {
  if (isSyncing) {
    console.log('⏳ Squad sync already in progress, skipping.');
    return lastSquadSyncStats;
  }

  if (!supabase) {
    console.warn('⚠️ Supabase not configured - squad sync skipped.');
    return { teams: 0, ok: 0, fail: 0 };
  }

  isSyncing = true;
  lastSquadSyncTime = new Date();
  const stats = { teams: 0, ok: 0, fail: 0 };

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     KADRO SYNC BAŞLADI                 ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const { data: teams, error } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .not('api_football_id', 'is', null);

    if (error || !teams || teams.length === 0) {
      console.warn('⚠️ No static_teams found for squad sync:', error?.message || 'empty');
      return stats;
    }

    const uniqueTeams = Array.from(
      new Map(teams.map((t) => [t.api_football_id, t])).values()
    );
    stats.teams = uniqueTeams.length;
    console.log(`📋 Syncing squads for ${stats.teams} teams (season ${CURRENT_SEASON})...`);

    for (let i = 0; i < uniqueTeams.length; i++) {
      const t = uniqueTeams[i];
      const result = await syncOneTeamSquad(t.api_football_id, t.name);
      if (result.ok) stats.ok++;
      else stats.fail++;

      if ((i + 1) % 20 === 0) {
        console.log(`   ${i + 1}/${uniqueTeams.length} teams done (ok: ${stats.ok}, fail: ${stats.fail})`);
      }

      if (i < uniqueTeams.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_TEAMS_MS));
      }
    }

    lastSquadSyncStats = stats;
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     KADRO SYNC BİTTİ                  ║');
    console.log(`║     OK: ${stats.ok}, Fail: ${stats.fail}, Toplam: ${stats.teams}`.padEnd(39) + '║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
  } catch (err) {
    console.error('❌ Squad sync error:', err.message);
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
  startDailySquadSync,
  stopDailySquadSync,
  getSquadSyncStatus,
  CURRENT_SEASON,
};
