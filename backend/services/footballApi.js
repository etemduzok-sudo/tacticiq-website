// Football API Service (API-Football.com)
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache configuration
// stdTTL: 3600 = 1 hour cache
// checkperiod: 600 = check for expired keys every 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Try both possible env var names for flexibility
// Default API key provided by user
const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY || '8a7e3c18ff59d0c7d254d230f999a084';
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
// MATCH FILTERING
// ====================

// ✅ Ortak filtreleme fonksiyonu: Sadece belirtilen maçlar çekilecek
function filterMatches(matches) {
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  return matches.filter(match => {
    const leagueName = (match.league?.name || '').toLowerCase();
    const leagueType = (match.league?.type || '').toLowerCase();
    const country = (match.league?.country || '').toLowerCase();
    const homeTeamName = (match.teams?.home?.name || '').toLowerCase();
    const awayTeamName = (match.teams?.away?.name || '').toLowerCase();
    
    // ❌ EXCLUDE: Kadın futbol ligi maçları
    const isWomens = leagueName.includes('women') ||
                    leagueName.includes(' w ') ||
                    leagueName.includes(' w.') ||
                    leagueName.includes('womens') ||
                    leagueName.includes('feminine') ||
                    leagueName.includes('ladies') ||
                    leagueName.includes('girls') ||
                    homeTeamName.includes('women') ||
                    homeTeamName.includes(' w ') ||
                    homeTeamName.includes('ladies') ||
                    awayTeamName.includes('women') ||
                    awayTeamName.includes(' w ') ||
                    awayTeamName.includes('ladies');
    
    if (isWomens) {
      return false;
    }
    
    // ❌ EXCLUDE: U18, U19, U20, U21, U23, U17, Youth takımları
    const isYouth = leagueName.includes('u18') ||
                   leagueName.includes('u19') ||
                   leagueName.includes('u20') ||
                   leagueName.includes('u21') ||
                   leagueName.includes('u23') ||
                   leagueName.includes('u17') ||
                   leagueName.includes('under 18') ||
                   leagueName.includes('under 19') ||
                   leagueName.includes('under 20') ||
                   leagueName.includes('under 21') ||
                   leagueName.includes('youth') ||
                   leagueName.includes('reserve') ||
                   homeTeamName.includes('u18') ||
                   homeTeamName.includes('u19') ||
                   homeTeamName.includes('u20') ||
                   homeTeamName.includes('u21') ||
                   homeTeamName.includes('youth') ||
                   awayTeamName.includes('u18') ||
                   awayTeamName.includes('u19') ||
                   awayTeamName.includes('u20') ||
                   awayTeamName.includes('u21') ||
                   awayTeamName.includes('youth');
    
    if (isYouth) {
      return false;
    }
    
    // ❌ EXCLUDE: Alt ligler (2. lig, 3. lig, vb.)
    const isLowerLeague = leagueName.includes('2.') ||
                         leagueName.includes('second') ||
                         leagueName.includes('third') ||
                         leagueName.includes('fourth') ||
                         leagueName.includes('division 2') ||
                         leagueName.includes('division 3') ||
                         leagueName.includes('liga 2') ||
                         leagueName.includes('liga 3');
    
    if (isLowerLeague) {
      return false;
    }
    
    // ✅ INCLUDE: Sadece belirtilen maçlar
    
    // 1. Ülkelerin en üst klasman erkek futbol takımlarının maçları
    const isTopLeague = leagueName.includes('premier league') ||
                       leagueName.includes('la liga') ||
                       leagueName.includes('serie a') ||
                       leagueName.includes('bundesliga') ||
                       leagueName.includes('ligue 1') ||
                       leagueName.includes('süper lig') ||
                       leagueName.includes('super lig') ||
                       leagueName.includes('primeira liga') ||
                       leagueName.includes('eredivisie') ||
                       leagueName.includes('scottish premiership') ||
                       leagueName.includes('belgian pro league') ||
                       leagueName.includes('austrian bundesliga') ||
                       leagueName.includes('swiss super league') ||
                       leagueName.includes('russian premier league') ||
                       (leagueName.includes('championship') && country === 'england');
    
    // 2. Ülkedeki yerel turnuvalar (Türkiye Kupası, FA Cup, Copa del Rey, vb.)
    const isLocalCup = (leagueName.includes('cup') ||
                       leagueName.includes('fa cup') ||
                       leagueName.includes('copa del rey') ||
                       leagueName.includes('coppa italia') ||
                       leagueName.includes('dfb pokal') ||
                       leagueName.includes('coupe de france') ||
                       leagueName.includes('türkiye kupası') ||
                       leagueName.includes('turkey cup') ||
                       leagueName.includes('tff kupa') ||
                       leagueName.includes('kupa')) &&
                       !leagueName.includes('women') &&
                       !leagueName.includes('youth') &&
                       !leagueName.includes('u18') &&
                       !leagueName.includes('u19') &&
                       !leagueName.includes('u20') &&
                       !leagueName.includes('u21');
    
    // 3. FIFA Dünya Kupası - gruplar ve eleme turlarındaki maçların tamamı
    const isFIFA = (leagueName.includes('world cup') ||
                   leagueName.includes('fifa world cup') ||
                   leagueName.includes('world cup qualification') ||
                   leagueName.includes('world cup group') ||
                   leagueName.includes('world cup qualifiers') ||
                   leagueName.includes('copa america') ||
                   leagueName.includes('africa cup') ||
                   leagueName.includes('asian cup') ||
                   leagueName.includes('concacaf')) &&
                   !leagueName.includes('women') &&
                   !leagueName.includes('youth');
    
    // 4. UEFA kupalarındaki maçlar
    const isUEFA = (leagueName.includes('uefa') ||
                   leagueName.includes('champions league') ||
                   leagueName.includes('europa league') ||
                   leagueName.includes('europa conference') ||
                   leagueName.includes('euro') ||
                   leagueName.includes('nations league') ||
                   leagueName.includes('european championship') ||
                   leagueName.includes('euro qualification')) &&
                   !leagueName.includes('women') &&
                   !leagueName.includes('youth');
    
    // ✅ Sadece bu kategorilerden maçlar çekilecek
    return isTopLeague || isLocalCup || isFIFA || isUEFA;
  });
}

// ====================
// API METHODS
// ====================

// Get live matches
async function getLiveMatches() {
  const data = await makeRequest('/fixtures', { live: 'all' }, 'live-matches', 60); // 1 min cache
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  return data;
}

// Get fixtures by date
async function getFixturesByDate(date) {
  const data = await makeRequest('/fixtures', { date }, `fixtures-${date}`, 1800); // 30 min cache
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  return data;
}

// Get fixtures by league
async function getFixturesByLeague(leagueId, season = 2024) {
  const data = await makeRequest('/fixtures', { league: leagueId, season }, `fixtures-league-${leagueId}-${season}`, 3600);
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  return data;
}

// Get fixtures by team (only top leagues, UEFA/FIFA, and local cups)
async function getFixturesByTeam(teamId, season = 2025) { // 2025-26 sezonu
  const data = await makeRequest('/fixtures', { team: teamId, season }, `fixtures-team-${teamId}-${season}`, 3600);
  
  // ✅ Ortak filtreleme fonksiyonunu kullan
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
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
  const data = await makeRequest('/fixtures', { team: teamId, last: limit }, `team-last-${teamId}-${limit}`, 1800); // 30 min cache
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  return data;
}

// Get team's upcoming matches
async function getTeamUpcomingMatches(teamId, limit = 10) {
  const data = await makeRequest('/fixtures', { team: teamId, next: limit }, `team-next-${teamId}-${limit}`, 1800); // 30 min cache
  if (data.response && data.response.length > 0) {
    const filtered = filterMatches(data.response);
    return {
      ...data,
      response: filtered,
      results: filtered.length,
    };
  }
  return data;
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
