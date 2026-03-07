// ============================================
// AGGRESSIVE CACHE SERVICE
// ============================================
// GÖREV: Canlı maç istatistikleri, puan durumu, yaklaşan maçlar, takım sezonu
// CANLI MAÇ LİSTESİ ÇAĞIRMAZ — o iş sadece liveMatchService'e ait.
//
// API Bütçesi (25K/gün maç sync):
//   liveMatchService  : 30 sn'de 1 = ~2,880/gün
//   refreshLiveStats  : 60 sn'de max 3×2 = ~8,640/gün (canlı maç varken)
//   upcoming (1 saat) : 6 lig = ~144/gün
//   teamSeasons (4 saat): 4 takım = ~24/gün
//   standings (4 saat): 6 lig = ~36/gün
//   syncToday (5 dk)  : ~288/gün (smartSyncService)
//   syncFuture (30 dk): ~96/gün (smartSyncService)
//   TOPLAM: ~12,108/gün — kota dahilinde, %48
// ============================================

const footballApi = require('./footballApi');
const databaseService = require('./databaseService');
const { supabase } = require('../config/supabase');
const apiUsageTracker = require('./apiUsageTracker');

const MATCH_SYNC_LIMIT = apiUsageTracker.MATCH_SYNC_LIMIT;

const REFRESH_INTERVALS = {
  liveStatistics: 60 * 1000,             // 60 sn — max 3 maç/run
  upcomingMatches: 4 * 60 * 60 * 1000,   // 4 saat (smartSync zaten 5dk'da bugünü alıyor)
  teamSeasons: 6 * 60 * 60 * 1000,       // 6 saat
  standings: 4 * 60 * 60 * 1000,         // 4 saat
};

let trackedTeams = new Set([611, 645, 644, 643]);

const trackedLeagues = [203, 39, 140, 135, 78, 61];

let stats = {
  totalCalls: 0,
  callsToday: 0,
  lastReset: Date.now(),
  breakdown: { liveStatistics: 0, upcomingMatches: 0, teamSeasons: 0, standings: 0 },
};

let cacheIntervals = [];
let isRunning = false;

function resetDailyStats() {
  const now = Date.now();
  if (now - stats.lastReset >= 24 * 60 * 60 * 1000) {
    console.log(`📊 [CACHE] Günlük stats: ${stats.callsToday} API çağrısı`);
    stats.callsToday = 0;
    stats.lastReset = now;
    stats.breakdown = { liveStatistics: 0, upcomingMatches: 0, teamSeasons: 0, standings: 0 };
  }
}

function incrementCallCounter(type, count = 1) {
  resetDailyStats();
  stats.totalCalls += count;
  stats.callsToday += count;
  stats.breakdown[type] = (stats.breakdown[type] || 0) + count;
  apiUsageTracker.incrementMatchSync(count);
}

// Canlı maç istatistikleri + oyuncu performansı (max 3 maç/run)
const LIVE_STATS_MAX_MATCHES = 3;
const LIVE_STATS_MIN_REMAINING = 500;

async function refreshLiveStatistics() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  if (apiUsageTracker.getMatchSyncRemaining() < LIVE_STATS_MIN_REMAINING) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: liveMatches } = await supabase
      .from('matches')
      .select('id, status')
      .in('status', ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'])
      .gte('fixture_date', `${today}T00:00:00`);

    if (!liveMatches || liveMatches.length === 0) return;
    const capped = liveMatches.slice(0, LIVE_STATS_MAX_MATCHES);

    for (const match of capped) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      try {
        const [statsData, playersData] = await Promise.all([
          footballApi.getFixtureStatistics(match.id, true),
          footballApi.getFixturePlayers(match.id),
        ]);
        incrementCallCounter('liveStatistics', 2);

        if (statsData?.response && statsData.response.length >= 2) {
          for (const stat of statsData.response) {
            if (!stat?.team?.id) continue;
            const getSV = (arr, type) => {
              const s = (arr || []).find(x => x.type === type);
              return s ? (parseInt(s.value) || 0) : 0;
            };
            await supabase.from('match_statistics').upsert({
              match_id: match.id,
              team_id: stat.team.id,
              shots_on_goal: getSV(stat.statistics, 'Shots on Goal'),
              shots_off_goal: getSV(stat.statistics, 'Shots off Goal'),
              total_shots: getSV(stat.statistics, 'Total Shots'),
              blocked_shots: getSV(stat.statistics, 'Blocked Shots'),
              shots_inside_box: getSV(stat.statistics, 'Shots insidebox'),
              shots_outside_box: getSV(stat.statistics, 'Shots outsidebox'),
              fouls: getSV(stat.statistics, 'Fouls'),
              corner_kicks: getSV(stat.statistics, 'Corner Kicks'),
              offsides: getSV(stat.statistics, 'Offsides'),
              ball_possession: parseInt(getSV(stat.statistics, 'Ball Possession') || 0),
              yellow_cards: getSV(stat.statistics, 'Yellow Cards'),
              red_cards: getSV(stat.statistics, 'Red Cards'),
              goalkeeper_saves: getSV(stat.statistics, 'Goalkeeper Saves'),
              total_passes: getSV(stat.statistics, 'Total passes'),
              passes_accurate: getSV(stat.statistics, 'Passes accurate'),
              passes_percentage: parseInt(getSV(stat.statistics, 'Passes %') || 0),
            }, { onConflict: 'match_id,team_id' });
          }
        }

        if (playersData?.response && playersData.response.length > 0) {
          await supabase
            .from('match_player_stats')
            .upsert({ match_id: match.id, data: playersData.response, updated_at: new Date().toISOString() }, { onConflict: 'match_id' });
        }
      } catch (err) {
        console.error(`❌ [LIVE STATS] Match ${match.id}:`, err.message);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (error) {
    console.error('❌ [LIVE STATS] Error:', error.message);
  }
}

async function refreshUpcomingMatches() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    for (const leagueId of trackedLeagues) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getFixturesByLeague(leagueId, 2025);
      incrementCallCounter('upcomingMatches');
      if (data.response && data.response.length > 0) {
        const upcoming = data.response.filter(m => new Date(m.fixture.date) > new Date());
        await databaseService.upsertMatches(upcoming);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    console.error('❌ [UPCOMING] Error:', error.message);
  }
}

async function refreshTeamSeasons() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    for (const teamId of Array.from(trackedTeams)) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getFixturesByTeam(teamId, 2025);
      incrementCallCounter('teamSeasons');
      if (data.response && data.response.length > 0) {
        await databaseService.upsertMatches(data.response);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    console.error('❌ [TEAMS] Error:', error.message);
  }
}

async function refreshStandings() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    for (const leagueId of trackedLeagues) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getLeagueStandings(leagueId, 2025);
      incrementCallCounter('standings');
      if (data.response && data.response.length > 0) {
        console.log(`✅ [STANDINGS] League ${leagueId} güncellendi`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    console.error('❌ [STANDINGS] Error:', error.message);
  }
}

function stopAggressiveCaching() {
  cacheIntervals.forEach(i => clearInterval(i));
  cacheIntervals = [];
  isRunning = false;
}

function startAggressiveCaching() {
  if (isRunning) return;
  stopAggressiveCaching();

  console.log('🚀 [CACHE] Servis başlatılıyor (liveStats/upcoming/teams/standings)');
  console.log(`📊 Kota: ${MATCH_SYNC_LIMIT}/gün | liveStats: 60s, upcoming: 1h, teams: 4h, standings: 4h`);

  isRunning = true;

  refreshLiveStatistics().catch(e => console.error('❌', e.message));
  refreshUpcomingMatches().catch(e => console.error('❌', e.message));
  refreshTeamSeasons().catch(e => console.error('❌', e.message));
  refreshStandings().catch(e => console.error('❌', e.message));

  cacheIntervals.push(setInterval(() => {
    refreshLiveStatistics().catch(e => console.error('❌ liveStats:', e.message));
  }, REFRESH_INTERVALS.liveStatistics));

  cacheIntervals.push(setInterval(() => {
    refreshUpcomingMatches().catch(e => console.error('❌ upcoming:', e.message));
  }, REFRESH_INTERVALS.upcomingMatches));

  cacheIntervals.push(setInterval(() => {
    refreshTeamSeasons().catch(e => console.error('❌ teams:', e.message));
  }, REFRESH_INTERVALS.teamSeasons));

  cacheIntervals.push(setInterval(() => {
    refreshStandings().catch(e => console.error('❌ standings:', e.message));
  }, REFRESH_INTERVALS.standings));

  cacheIntervals.push(setInterval(() => {
    const remaining = apiUsageTracker.getMatchSyncRemaining();
    const pct = ((apiUsageTracker.getMatchSyncCalls() / MATCH_SYNC_LIMIT) * 100).toFixed(1);
    console.log(`📊 [KOTA] ${apiUsageTracker.getMatchSyncCalls()}/${MATCH_SYNC_LIMIT} (${pct}%) | Kalan: ${remaining}`);
  }, 10 * 60 * 1000));
}

function getStats() {
  resetDailyStats();
  return { ...stats, target: MATCH_SYNC_LIMIT, remaining: MATCH_SYNC_LIMIT - stats.callsToday };
}

function addTrackedTeam(teamId) { trackedTeams.add(teamId); }

module.exports = {
  startAggressiveCaching,
  stopAggressiveCaching,
  getStats,
  addTrackedTeam,
  refreshLiveStatistics,
  isRunning: () => isRunning,
};
