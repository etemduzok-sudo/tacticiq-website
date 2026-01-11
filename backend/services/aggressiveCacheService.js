// Aggressive Cache Service
// Günlük 7,498-7,499 API call ile maksimum veri toplama

const footballApi = require('./footballApi');
const databaseService = require('./databaseService');

// 🎯 OPTIMIZED: Target 7,368 API calls/day (98.2% usage)
const REFRESH_INTERVALS = {
  liveMatches: 12 * 1000,              // 12 sn → 7,200 call/gün
  upcomingMatches: 2 * 60 * 60 * 1000, // 2 saat → 72 call/gün (6 lig)
  teamSeasons: 4 * 60 * 60 * 1000,     // 4 saat → 60 call/gün (10 takım)
  standings: 4 * 60 * 60 * 1000,       // 4 saat → 36 call/gün (6 lig)
};

// TOPLAM: 7,368 call/gün
// Buffer: 132 call (manuel sorgular için)

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

// Increment call counter
function incrementCallCounter(type) {
  resetDailyStats();
  stats.totalCalls++;
  stats.callsToday++;
  stats.breakdown[type]++;
  
  // Log every 100 calls
  if (stats.callsToday % 100 === 0) {
    const remaining = 7500 - stats.callsToday;
    const percentage = ((stats.callsToday / 7500) * 100).toFixed(1);
    console.log(`📊 [AGGRESSIVE CACHE] ${stats.callsToday}/7500 calls (${percentage}%) | Remaining: ${remaining}`);
  }
}

// 1. Refresh Live Matches (every 12 seconds) - 7,200 calls/day
async function refreshLiveMatches() {
  try {
    console.log('🔴 [LIVE] Fetching live matches...');
    const data = await footballApi.getLiveMatches();
    incrementCallCounter('liveMatches');
    
    if (data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
      console.log(`✅ [LIVE] Updated ${data.response.length} live matches`);
    }
  } catch (error) {
    console.error('❌ [LIVE] Error:', error.message);
  }
}

// 2. Refresh Upcoming Matches (every 2 hours) - 72 calls/day
async function refreshUpcomingMatches() {
  try {
    console.log('📅 [UPCOMING] Fetching upcoming matches...');
    
    for (const leagueId of trackedLeagues) {
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

// 3. Refresh Team Season Data (every 4 hours) - 60 calls/day
async function refreshTeamSeasons() {
  try {
    console.log('🏆 [TEAMS] Fetching team season data...');
    
    for (const teamId of Array.from(trackedTeams)) {
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

// 4. Refresh League Standings (every 4 hours) - 36 calls/day
async function refreshStandings() {
  try {
    console.log('📊 [STANDINGS] Fetching league standings...');
    
    for (const leagueId of trackedLeagues) {
      const data = await footballApi.getStandings(leagueId, 2025);
      incrementCallCounter('standings');
      
      if (data.response && data.response.length > 0) {
        // Store standings in database
        await databaseService.upsertStandings(leagueId, data.response);
        console.log(`✅ [STANDINGS] Updated standings for league ${leagueId}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
  } catch (error) {
    console.error('❌ [STANDINGS] Error:', error.message);
  }
}

// Start aggressive caching
function startAggressiveCaching() {
  console.log('🚀 [AGGRESSIVE CACHE] Starting aggressive caching service...');
  console.log(`📊 Target: 7,368 API calls per day (98.2% usage)`);
  console.log(`📊 Breakdown:`);
  console.log(`   - Live Matches: 7,200 calls (12s interval)`);
  console.log(`   - Upcoming: 72 calls (2h interval, 6 leagues)`);
  console.log(`   - Teams: 60 calls (4h interval, 10 teams)`);
  console.log(`   - Standings: 36 calls (4h interval, 6 leagues)`);
  
  // Initial fetch
  refreshLiveMatches();
  refreshUpcomingMatches();
  refreshTeamSeasons();
  refreshStandings();
  
  // Set intervals
  setInterval(refreshLiveMatches, REFRESH_INTERVALS.liveMatches);
  setInterval(refreshUpcomingMatches, REFRESH_INTERVALS.upcomingMatches);
  setInterval(refreshTeamSeasons, REFRESH_INTERVALS.teamSeasons);
  setInterval(refreshStandings, REFRESH_INTERVALS.standings);
  
  // Stats logging every 10 minutes
  setInterval(() => {
    const percentage = ((stats.callsToday / 7500) * 100).toFixed(1);
    const targetPercentage = ((stats.callsToday / 7368) * 100).toFixed(1);
    console.log(`📊 [AGGRESSIVE CACHE] Stats:`, {
      totalToday: stats.callsToday,
      target: 7368,
      hardLimit: 7500,
      remaining: 7500 - stats.callsToday,
      usageVsTarget: targetPercentage + '%',
      usageVsLimit: percentage + '%',
      breakdown: stats.breakdown,
    });
  }, 10 * 60 * 1000);
}

// Get stats
function getStats() {
  resetDailyStats();
  return {
    ...stats,
    target: 7500,
    remaining: 7500 - stats.callsToday,
    percentage: ((stats.callsToday / 7500) * 100).toFixed(1),
  };
}

// Add tracked team
function addTrackedTeam(teamId) {
  trackedTeams.add(teamId);
  console.log(`✅ [AGGRESSIVE CACHE] Added team ${teamId} to tracking`);
}

module.exports = {
  startAggressiveCaching,
  getStats,
  addTrackedTeam,
  refreshLiveMatches,
};
