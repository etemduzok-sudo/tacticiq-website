// Aggressive Cache Service
// Maç senkronu: max 25.000 API/gün (kalan 50K = rating, takım, koç, kadro, takvim)

const footballApi = require('./footballApi');
const databaseService = require('./databaseService');
const { supabase } = require('../config/supabase');
const apiUsageTracker = require('./apiUsageTracker');

// 🎯 Maç sync kotası: 25K/gün (75K - 50K DB güncellemeleri)
const REFRESH_INTERVALS = {
  liveMatches: 5 * 1000,               // 5 sn → ~17,280 call/gün (canlı maç + event)
  liveStatistics: 8 * 1000,            // 8 sn → ~10,800 call/gün (maç istatistik + oyuncu verisi)
  upcomingMatches: 1 * 60 * 60 * 1000, // 1 saat → 144 call/gün (6 lig)
  teamSeasons: 2 * 60 * 60 * 1000,     // 2 saat → 120 call/gün (10 takım)
  standings: 2 * 60 * 60 * 1000,       // 2 saat → 72 call/gün (6 lig)
};

// TOPLAM: ~28,416 call/gün (arka plan) + frontend polling ~30K = ~58K
// Buffer: ~17K call (yedek)

// Tracked teams (will be populated from user favorites)
let trackedTeams = new Set([
  611, // Fenerbahçe
  645, // Galatasaray
  644, // Beşiktaş
  643, // Trabzonspor
  // Add more popular teams
]);

// Tracked leagues
const trackedLeagues = [
  203, // Süper Lig
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
];

// Statistics
let stats = {
  totalCalls: 0,
  callsToday: 0,
  lastReset: Date.now(),
  breakdown: {
    liveMatches: 0,
    upcomingMatches: 0,
    recentMatches: 0,
    teamSeasons: 0,
    matchEvents: 0,
    standings: 0,
    statistics: 0,
  },
};

// Store interval references for stop functionality
let cacheIntervals = [];
let isRunning = false;

// Reset daily stats
function resetDailyStats() {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  if (now - stats.lastReset >= dayInMs) {
    console.log(`📊 [AGGRESSIVE CACHE] Daily stats: ${stats.callsToday} API calls`);
    stats.callsToday = 0;
    stats.lastReset = now;
    stats.breakdown = {
      liveMatches: 0,
      upcomingMatches: 0,
      recentMatches: 0,
      teamSeasons: 0,
      matchEvents: 0,
      standings: 0,
      statistics: 0,
    };
  }
}

const MATCH_SYNC_LIMIT = apiUsageTracker.MATCH_SYNC_LIMIT;

// Increment call counter (maç sync kotasına da yaz)
function incrementCallCounter(type, count = 1) {
  resetDailyStats();
  stats.totalCalls++;
  stats.callsToday += count;
  stats.breakdown[type] = (stats.breakdown[type] || 0) + count;
  apiUsageTracker.incrementMatchSync(count);
  if (stats.callsToday % 500 === 0) {
    const remaining = MATCH_SYNC_LIMIT - stats.callsToday;
    const percentage = ((stats.callsToday / MATCH_SYNC_LIMIT) * 100).toFixed(1);
    console.log(`📊 [MAÇ SYNC] ${stats.callsToday}/${MATCH_SYNC_LIMIT} (${percentage}%) | Kalan: ${remaining}`);
  }
}

// 1. Refresh Live Matches (every 12 seconds)
async function refreshLiveMatches() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) {
    return;
  }
  try {
    console.log('🔴 [LIVE] Fetching live matches with events...');
    const data = await footballApi.getLiveMatches();
    incrementCallCounter('liveMatches');
    
    if (data.response && data.response.length > 0) {
      // ✅ Event'leri kaydet
      const timelineService = require('./timelineService');
      let totalEventsSaved = 0;
      let matchesWithEvents = 0;
      
      for (const match of data.response) {
        // Event'ler match.events array'inde geliyor (API-Football v3)
        if (match.events && Array.isArray(match.events) && match.events.length > 0) {
          const matchData = {
            fixture: match.fixture,
            events: match.events,
            goals: match.goals,
            teams: match.teams,
            league: match.league,
          };
          
          const savedCount = await timelineService.saveMatchEvents(matchData);
          if (savedCount > 0) {
            totalEventsSaved += savedCount;
            matchesWithEvents++;
          }
        }
      }
      
      // Maçları DB'ye kaydet
      await databaseService.upsertMatches(data.response);
      
      console.log(`✅ [LIVE] Updated ${data.response.length} live matches`);
      if (totalEventsSaved > 0) {
        console.log(`   📊 Saved ${totalEventsSaved} events from ${matchesWithEvents} matches`);
      }
    }
  } catch (error) {
    console.error('❌ [LIVE] Error:', error.message);
  }
}

// 2. Refresh Live Match Statistics + Player Stats (every 8 seconds for live matches)
async function refreshLiveStatistics() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) {
    return;
  }
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: liveMatches } = await supabase
      .from('matches')
      .select('id, status')
      .in('status', ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'])
      .gte('fixture_date', `${today}T00:00:00`);

    if (!liveMatches || liveMatches.length === 0) return;

    for (const match of liveMatches) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      try {
        const [statsData, playersData] = await Promise.all([
          footballApi.getFixtureStatistics(match.id, true),
          footballApi.getFixturePlayers(match.id),
        ]);
        incrementCallCounter('statistics', 2);

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
            .upsert({
              match_id: match.id,
              data: playersData.response,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'match_id' });
        }
      } catch (err) {
        console.error(`❌ [LIVE STATS] Error for match ${match.id}:`, err.message);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('❌ [LIVE STATS] Error:', error.message);
  }
}

// 3. Refresh Upcoming Matches (every 1 hour)
async function refreshUpcomingMatches() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    console.log('📅 [UPCOMING] Fetching upcoming matches...');
    for (const leagueId of trackedLeagues) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getFixturesByLeague(leagueId, 2025);
      incrementCallCounter('upcomingMatches');
      
      if (data.response && data.response.length > 0) {
        const upcoming = data.response.filter(m => 
          new Date(m.fixture.date) > new Date()
        );
        await databaseService.upsertMatches(upcoming);
        console.log(`✅ [UPCOMING] Updated ${upcoming.length} matches for league ${leagueId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
  } catch (error) {
    console.error('❌ [UPCOMING] Error:', error.message);
  }
}

// 3. Refresh Team Season Data (every 4 hours)
async function refreshTeamSeasons() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    console.log('🏆 [TEAMS] Fetching team season data...');
    for (const teamId of Array.from(trackedTeams)) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getFixturesByTeam(teamId, 2025);
      incrementCallCounter('teamSeasons');
      
      if (data.response && data.response.length > 0) {
        await databaseService.upsertMatches(data.response);
        console.log(`✅ [TEAMS] Updated ${data.response.length} matches for team ${teamId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
  } catch (error) {
    console.error('❌ [TEAMS] Error:', error.message);
  }
}

// 4. Refresh League Standings (every 4 hours)
async function refreshStandings() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    console.log('📊 [STANDINGS] Fetching league standings...');
    for (const leagueId of trackedLeagues) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const data = await footballApi.getLeagueStandings(leagueId, 2025);
      incrementCallCounter('standings');
      
      if (data.response && data.response.length > 0) {
        // Store standings in database (TODO: implement upsertStandings in databaseService)
        // await databaseService.upsertStandings(leagueId, data.response);
        console.log(`✅ [STANDINGS] Fetched standings for league ${leagueId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
  } catch (error) {
    console.error('❌ [STANDINGS] Error:', error.message);
  }
}

// Stop aggressive caching
function stopAggressiveCaching() {
  if (cacheIntervals.length > 0) {
    cacheIntervals.forEach(interval => clearInterval(interval));
    cacheIntervals = [];
    isRunning = false;
    console.log('⏹️ [AGGRESSIVE CACHE] Stopped');
  }
}

// Start aggressive caching
function startAggressiveCaching() {
  // Prevent multiple starts
  if (isRunning) {
    console.log('⚠️ [AGGRESSIVE CACHE] Already running, skipping start');
    return;
  }
  
  // Clear any existing intervals
  stopAggressiveCaching();
  
  console.log('🚀 [AGGRESSIVE CACHE] Maç sync başlatılıyor (max 25K API/gün)...');
  console.log(`📊 Kota: ${MATCH_SYNC_LIMIT} çağrı/gün (kalan 50K = rating, takım, koç, kadro)`);
  console.log(`📊 Live / Upcoming / Teams / Standings`);
  
  isRunning = true;
  
  // Initial fetch
  refreshLiveMatches();
  refreshLiveStatistics();
  refreshUpcomingMatches();
  refreshTeamSeasons();
  refreshStandings();
  
  // Set intervals - Wrap in try-catch to prevent crashes
  cacheIntervals.push(setInterval(() => {
    try {
      refreshLiveMatches();
    } catch (error) {
      console.error('❌ [AGGRESSIVE CACHE] Error in refreshLiveMatches interval:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    }
  }, REFRESH_INTERVALS.liveMatches));
  
  cacheIntervals.push(setInterval(() => {
    try {
      refreshLiveStatistics();
    } catch (error) {
      console.error('❌ [AGGRESSIVE CACHE] Error in refreshLiveStatistics interval:', error.message);
    }
  }, REFRESH_INTERVALS.liveStatistics));
  
  cacheIntervals.push(setInterval(() => {
    try {
      refreshUpcomingMatches();
    } catch (error) {
      console.error('❌ [AGGRESSIVE CACHE] Error in refreshUpcomingMatches interval:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    }
  }, REFRESH_INTERVALS.upcomingMatches));
  
  cacheIntervals.push(setInterval(() => {
    try {
      refreshTeamSeasons();
    } catch (error) {
      console.error('❌ [AGGRESSIVE CACHE] Error in refreshTeamSeasons interval:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    }
  }, REFRESH_INTERVALS.teamSeasons));
  
  cacheIntervals.push(setInterval(() => {
    try {
      refreshStandings();
    } catch (error) {
      console.error('❌ [AGGRESSIVE CACHE] Error in refreshStandings interval:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    }
  }, REFRESH_INTERVALS.standings));
  
  cacheIntervals.push(setInterval(() => {
    const percentage = ((stats.callsToday / MATCH_SYNC_LIMIT) * 100).toFixed(1);
    console.log('📊 [MAÇ SYNC] Stats:', {
      totalToday: stats.callsToday,
      limit: MATCH_SYNC_LIMIT,
      remaining: MATCH_SYNC_LIMIT - stats.callsToday,
      usage: percentage + '%',
    });
  }, 10 * 60 * 1000));
}

// Get stats
function getStats() {
  resetDailyStats();
  return {
    ...stats,
    target: MATCH_SYNC_LIMIT,
    remaining: MATCH_SYNC_LIMIT - stats.callsToday,
    percentage: ((stats.callsToday / MATCH_SYNC_LIMIT) * 100).toFixed(1),
  };
}

// Add tracked team
function addTrackedTeam(teamId) {
  trackedTeams.add(teamId);
  console.log(`✅ [AGGRESSIVE CACHE] Added team ${teamId} to tracking`);
}

module.exports = {
  startAggressiveCaching,
  stopAggressiveCaching,
  getStats,
  addTrackedTeam,
  refreshLiveMatches,
  refreshLiveStatistics,
  isRunning: () => isRunning,
};
