// Football API Service (API-Football.com)
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache configuration
// stdTTL: 3600 = 1 hour cache
// checkperiod: 600 = check for expired keys every 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const API_KEY = process.env.FOOTBALL_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://v3.football.api-sports.io';

// Request counter (resets daily)
let requestCount = 0;
let lastResetDate = new Date().toDateString();

// Reset counter daily
function checkAndResetCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    requestCount = 0;
    lastResetDate = today;
    console.log('📊 Request counter reset for new day');
  }
}

// Make API request with caching
async function makeRequest(endpoint, params = {}, cacheKey = null, cacheDuration = 3600) {
  checkAndResetCounter();

  // Check rate limit
  if (requestCount >= 7400) {
    throw new Error('Daily API rate limit reached (7400 requests)');
  }

  // Check cache first
  if (cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cachedData;
    }
    console.log(`❌ Cache MISS: ${cacheKey}`);
  }

  try {
    // Make API request
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params,
    });

    requestCount++;
    console.log(`📡 API Request #${requestCount}/7400: ${endpoint}`);

    const data = response.data;

    // Cache the response
    if (cacheKey && data) {
      cache.set(cacheKey, data, cacheDuration);
      console.log(`💾 Cached: ${cacheKey} (${cacheDuration}s)`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}

// ====================
// API METHODS
// ====================

// Get live matches
async function getLiveMatches() {
  return makeRequest('/fixtures', { live: 'all' }, 'live-matches', 60); // 1 min cache
}

// Get fixtures by date
async function getFixturesByDate(date) {
  return makeRequest('/fixtures', { date }, `fixtures-${date}`, 1800); // 30 min cache
}

// Get fixtures by league
async function getFixturesByLeague(leagueId, season = 2024) {
  return makeRequest('/fixtures', { league: leagueId, season }, `fixtures-league-${leagueId}-${season}`, 3600);
}

// Get fixture details
async function getFixtureDetails(fixtureId) {
  return makeRequest('/fixtures', { id: fixtureId }, `fixture-${fixtureId}`, 300); // 5 min cache
}

// Get fixture statistics
async function getFixtureStatistics(fixtureId) {
  return makeRequest('/fixtures/statistics', { fixture: fixtureId }, `stats-${fixtureId}`, 300);
}

// Get fixture events (goals, cards, etc.)
async function getFixtureEvents(fixtureId) {
  return makeRequest('/fixtures/events', { fixture: fixtureId }, `events-${fixtureId}`, 120); // 2 min cache
}

// Get fixture lineups
async function getFixtureLineups(fixtureId) {
  return makeRequest('/fixtures/lineups', { fixture: fixtureId }, `lineups-${fixtureId}`, 300);
}

// Get team information
async function getTeamInfo(teamId) {
  return makeRequest('/teams', { id: teamId }, `team-${teamId}`, 86400); // 24 hour cache
}

// Get team statistics
async function getTeamStatistics(teamId, leagueId, season = 2024) {
  return makeRequest('/teams/statistics', { team: teamId, league: leagueId, season }, `team-stats-${teamId}-${leagueId}`, 3600);
}

// Get player information
async function getPlayerInfo(playerId, season = 2024) {
  return makeRequest('/players', { id: playerId, season }, `player-${playerId}-${season}`, 3600);
}

// Get head to head
async function getHeadToHead(team1Id, team2Id) {
  return makeRequest('/fixtures/headtohead', { h2h: `${team1Id}-${team2Id}` }, `h2h-${team1Id}-${team2Id}`, 86400);
}

// Get league standings
async function getLeagueStandings(leagueId, season = 2024) {
  return makeRequest('/standings', { league: leagueId, season }, `standings-${leagueId}-${season}`, 3600);
}

// Get leagues
async function getLeagues(country = null) {
  const params = country ? { country } : {};
  const cacheKey = country ? `leagues-${country}` : 'leagues-all';
  return makeRequest('/leagues', params, cacheKey, 86400);
}

// Get team's last matches
async function getTeamLastMatches(teamId, limit = 10) {
  return makeRequest('/fixtures', { team: teamId, last: limit }, `team-last-${teamId}-${limit}`, 1800); // 30 min cache
}

// Get team's upcoming matches
async function getTeamUpcomingMatches(teamId, limit = 10) {
  return makeRequest('/fixtures', { team: teamId, next: limit }, `team-next-${teamId}-${limit}`, 1800); // 30 min cache
}

// ====================
// CACHE MANAGEMENT
// ====================

// Get cache statistics
function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    requestCount,
    requestLimit: 7400,
    requestsRemaining: 7400 - requestCount,
  };
}

// Clear cache
function clearCache() {
  cache.flushAll();
  console.log('🗑️ Cache cleared');
}

// Export
module.exports = {
  getLiveMatches,
  getFixturesByDate,
  getFixturesByLeague,
  getFixtureDetails,
  getFixtureStatistics,
  getFixtureEvents,
  getFixtureLineups,
  getTeamInfo,
  getTeamStatistics,
  getPlayerInfo,
  getHeadToHead,
  getLeagueStandings,
  getLeagues,
  getTeamLastMatches,
  getTeamUpcomingMatches,
  getCacheStats,
  clearCache,
};
