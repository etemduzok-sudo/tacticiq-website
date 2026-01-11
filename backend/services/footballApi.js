// Football API Service (API-Football.com)
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache configuration
// stdTTL: 3600 = 1 hour cache
// checkperiod: 600 = check for expired keys every 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Try both possible env var names for flexibility
// Default API key provided by user
const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY || 'a7ac2f7672bcafcf6fdca1b021b74865';
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

  // Check rate limit (7500 for PRO plan)
  if (requestCount >= 7500) {
    throw new Error('Daily API rate limit reached (7500 requests)');
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
    // Check if API key is missing or invalid
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE' || API_KEY.trim() === '') {
      // Silently return empty response when API key is missing
      // Frontend will handle the fallback to mock data
      return { response: [], results: 0, errors: [] };
    }

    // Make API request
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params,
    });

    requestCount++;
    console.log(`📡 API Request #${requestCount}/7500: ${endpoint}`);

    const data = response.data;

    // Cache the response
    if (cacheKey && data) {
      cache.set(cacheKey, data, cacheDuration);
      console.log(`💾 Cached: ${cacheKey} (${cacheDuration}s)`);
    }

    return data;
  } catch (error) {
    // Silently handle 403 (Forbidden) errors - API key issues
    if (error.response && error.response.status === 403) {
      // Return empty response instead of throwing error
      return { response: [], results: 0, errors: ['API key invalid or missing'] };
    }
    
    // For other errors, log but still return empty response
    console.error('API Error:', error.message);
    return { response: [], results: 0, errors: [error.message] };
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

// Get fixtures by team (only top leagues, UEFA/FIFA, and local cups)
async function getFixturesByTeam(teamId, season = 2025) { // 2025-26 sezonu
  const data = await makeRequest('/fixtures', { team: teamId, season }, `fixtures-team-${teamId}-${season}`, 3600);
  
  // Filter: Only MEN'S top leagues, UEFA/FIFA competitions, and local cups
  if (data.response && data.response.length > 0) {
    const filtered = data.response.filter(match => {
      const leagueName = (match.league?.name || '').toLowerCase();
      const leagueType = (match.league?.type || '').toLowerCase();
      const country = (match.league?.country || '').toLowerCase();
      
      // ✅ EXCLUDE: Women's teams, women's leagues, women's cups
      const isWomens = leagueName.includes('women') ||
                      leagueName.includes(' w ') ||
                      leagueName.includes(' w.') ||
                      leagueName.includes('womens') ||
                      leagueName.includes('feminine') ||
                      leagueName.includes('ladies') ||
                      leagueName.includes('girls') ||
                      (match.teams?.home?.name && (
                        match.teams.home.name.toLowerCase().includes('women') ||
                        match.teams.home.name.toLowerCase().includes(' w ') ||
                        match.teams.home.name.toLowerCase().includes('ladies')
                      )) ||
                      (match.teams?.away?.name && (
                        match.teams.away.name.toLowerCase().includes('women') ||
                        match.teams.away.name.toLowerCase().includes(' w ') ||
                        match.teams.away.name.toLowerCase().includes('ladies')
                      ));
      
      if (isWomens) {
        return false; // Exclude women's matches
      }
      
      // ✅ EXCLUDE: Youth teams and lower leagues
      const isLowerLeague = leagueName.includes('2.') ||
                           leagueName.includes('second') ||
                           leagueName.includes('third') ||
                           leagueName.includes('fourth') ||
                           leagueName.includes('reserve') ||
                           leagueName.includes('youth') ||
                           leagueName.includes('u21') ||
                           leagueName.includes('u19') ||
                           leagueName.includes('u20') ||
                           leagueName.includes('u23') ||
                           leagueName.includes('u17') ||
                           leagueName.includes('u18');
      
      if (isLowerLeague) {
        return false; // Exclude lower leagues
      }
      
      // ✅ INCLUDE: Only MEN'S competitions
      // 1. Top tier MEN'S leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Süper Lig, etc.)
      const isTopLeague = leagueName.includes('premier league') ||
                         leagueName.includes('la liga') ||
                         leagueName.includes('serie a') ||
                         leagueName.includes('bundesliga') ||
                         leagueName.includes('ligue 1') ||
                         leagueName.includes('süper lig') ||
                         leagueName.includes('super lig') ||
                         leagueName.includes('primeira liga') ||
                         leagueName.includes('eredivisie') ||
                         (leagueName.includes('championship') && country === 'england');
      
      // 2. UEFA MEN'S competitions (Champions League, Europa League, Nations League, Euro, etc.)
      const isUEFA = (leagueName.includes('uefa') ||
                    leagueName.includes('champions league') ||
                    leagueName.includes('europa league') ||
                    leagueName.includes('euro') ||
                    leagueName.includes('nations league') ||
                    leagueName.includes('european championship')) &&
                    !leagueName.includes('women');
      
      // 3. FIFA MEN'S competitions (World Cup, etc.)
      const isFIFA = (leagueName.includes('world cup') ||
                    leagueName.includes('fifa') ||
                    leagueName.includes('copa america') ||
                    leagueName.includes('africa cup') ||
                    leagueName.includes('asian cup')) &&
                    !leagueName.includes('women');
      
      // 4. Local MEN'S cups (Cup, FA Cup, Copa del Rey, etc.)
      const isLocalCup = (leagueName.includes('cup') ||
                        leagueName.includes('fa cup') ||
                        leagueName.includes('copa del rey') ||
                        leagueName.includes('coppa italia') ||
                        leagueName.includes('dfb pokal') ||
                        leagueName.includes('coupe de france') ||
                        leagueName.includes('türkiye kupası') ||
                        leagueName.includes('turkey cup')) &&
                        !leagueName.includes('women');
      
      // 5. MEN'S National team matches (qualification, friendly, etc.)
      const isNationalTeam = (leagueType === 'cup' || match.teams?.home?.national || match.teams?.away?.national) && (
        leagueName.includes('qualification') ||
        leagueName.includes('friendly') ||
        leagueName.includes('international') ||
        leagueName.includes('world cup qualification') ||
        leagueName.includes('euro qualification')
      ) && !leagueName.includes('women');
      
      return isTopLeague || isUEFA || isFIFA || isLocalCup || isNationalTeam;
    });
    
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  
  return data;
}

// Get fixture details
async function getFixtureDetails(fixtureId) {
  return makeRequest('/fixtures', { id: fixtureId }, `fixture-${fixtureId}`, 300); // 5 min cache
}

// Get fixture statistics (PRO plan)
async function getFixtureStatistics(fixtureId) {
  return makeRequest('/fixtures/statistics', { fixture: fixtureId }, `stats-${fixtureId}`, 300); // 5 min cache
}

// Get fixture events (goals, cards, etc.)
async function getFixtureEvents(fixtureId) {
  return makeRequest('/fixtures/events', { fixture: fixtureId }, `events-${fixtureId}`, 120); // 2 min cache
}

// Get fixture lineups (PRO plan)
async function getFixtureLineups(fixtureId) {
  return makeRequest('/fixtures/lineups', { fixture: fixtureId }, `lineups-${fixtureId}`, 300); // 5 min cache
}

// Search teams by name
async function searchTeams(teamName) {
  return makeRequest('/teams', { search: teamName }, `team-search-${teamName}`, 86400); // 24 hour cache
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
    requestLimit: 7500,
    requestsRemaining: 7500 - requestCount,
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
  getFixturesByTeam,
  getFixtureDetails,
  getFixtureStatistics,
  getFixtureEvents,
  getFixtureLineups,
  searchTeams,
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
