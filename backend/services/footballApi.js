// Football API Service (API-Football.com)
const axios = require('axios');
const NodeCache = require('node-cache');
const sharp = require('sharp');
const https = require('https');
const http = require('http');

// Cache configuration
// stdTTL: 3600 = 1 hour cache
// checkperiod: 600 = check for expired keys every 10 minutes
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// ✅ SECURITY: API key must be from environment variable only
// Never hardcode API keys in source code
const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;

if (!API_KEY) {
  console.error('❌ CRITICAL: FOOTBALL_API_KEY environment variable is not set!');
  console.error('   Set FOOTBALL_API_KEY in backend/.env file');
}
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

// ✅ Ortak filtreleme fonksiyonu: Sadece belirtilen maçlar çekilecek + duplikasyon önleme
function filterMatches(matches) {
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return [];
  }

  // 🔥 DEDUPLİKASYON: fixture.id bazında tekil maçlar
  const seenIds = new Set();
  const uniqueMatches = matches.filter(match => {
    const fixtureId = match.fixture?.id;
    if (!fixtureId || seenIds.has(fixtureId)) {
      return false;
    }
    seenIds.add(fixtureId);
    return true;
  });

  return uniqueMatches.filter(match => {
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
    
    // ✅ INCLUDE: Sadece belirtilen maçlar (leaguesScope ile uyumlu)
    
    // 1. Ülkelerin en üst klasman erkek futbol ligleri (Domestic Top Tier)
    const isTopLeague = leagueName.includes('premier league') ||
                       leagueName.includes('la liga') ||
                       leagueName.includes('laliga') ||
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
                       leagueName.includes('liga profesional') ||
                       leagueName.includes('primera división') ||
                       leagueName.includes('brasileirão') ||
                       leagueName.includes('brasileiro') ||
                       leagueName.includes('campeonato brasileiro') ||
                       leagueName.includes('liga mx') ||
                       leagueName.includes('ligamx') ||
                       leagueName.includes('primera a') ||
                       leagueName.includes('mls') ||
                       leagueName.includes('j1 league') ||
                       leagueName.includes('j-league') ||
                       leagueName.includes('professional league') ||
                       leagueName.includes('uae pro league') ||
                       leagueName.includes('a-league') ||
                       leagueName.includes('super league') ||
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
    
    // 5. CONMEBOL kulüp turnuvaları (Boca, Palmeiras vb.)
    const isCONMEBOL = (leagueName.includes('copa libertadores') ||
                       leagueName.includes('copa sudamericana') ||
                       leagueName.includes('recopa sudamericana') ||
                       leagueName.includes('conmebol')) &&
                       !leagueName.includes('women') &&
                       !leagueName.includes('youth');
    
    // 6. Diğer kıta turnuvaları (AFC, CAF, CONCACAF)
    const isOtherContinental = (leagueName.includes('afc champions') ||
                               leagueName.includes('caf champions') ||
                               leagueName.includes('caf confederation') ||
                               leagueName.includes('concacaf champions') ||
                               leagueName.includes('ofc champions')) &&
                               !leagueName.includes('women') &&
                               !leagueName.includes('youth');
    
    // ✅ Sadece bu kategorilerden maçlar çekilecek
    return isTopLeague || isLocalCup || isFIFA || isUEFA || isCONMEBOL || isOtherContinental;
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

// Get team squad (players)
async function getTeamSquad(teamId, season = 2024) {
  return makeRequest('/players/squads', { team: teamId }, `team-squad-${teamId}-${season}`, 86400); // 24 hour cache
}

// Get injuries/suspensions for a team (sakatlık, sarı/kırmızı kart cezalılar)
async function getTeamInjuries(teamId, season = 2025) {
  try {
    const data = await makeRequest('/injuries', { team: teamId, season }, `team-injuries-${teamId}-${season}`, 43200); // 12h cache
    return data?.response || [];
  } catch (err) {
    return [];
  }
}

// Get team coach (teknik direktör)
async function getTeamCoach(teamId) {
  return makeRequest('/coachs', { team: teamId }, `team-coach-${teamId}`, 86400); // 24 hour cache - günde 1 kez güncellenir
}

// Get team seasons (available seasons for a team)
async function getTeamSeasons(teamId) {
  return makeRequest('/teams/seasons', { team: teamId }, `team-seasons-${teamId}`, 86400); // 24 hour cache
}

// Get countries (for national teams - includes flag information)
async function getCountries() {
  // API-Football uses /teams/countries endpoint for country data with flags
  return makeRequest('/teams/countries', {}, 'countries-all', 86400); // 24 hour cache
}

// Extract team colors from API response (kit colors)
function extractTeamColors(teamData) {
  if (!teamData || !teamData.team) return null;
  
  // API-Football provides kit colors in team.colors or team.team.colors
  const colors = teamData.team.colors || teamData.colors;
  if (colors && colors.primary && colors.secondary) {
    return [colors.primary, colors.secondary];
  }
  
  return null;
}

// Extract dominant colors from logo image (telif için logo yerine renkler kullanılacak)
async function extractColorsFromLogo(logoUrl) {
  if (!logoUrl) return null;
  
  try {
    // Download image
    const response = await axios({
      method: 'GET',
      url: logoUrl,
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TacticIQ/1.0)',
      },
    });

    const imageBuffer = Buffer.from(response.data);
    
    // Resize image for faster processing (max 200x200)
    const resized = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const { width, height, channels } = info;
    
    // Extract color palette using k-means-like approach (simplified)
    const colorMap = new Map();
    const sampleStep = 10; // Sample every 10th pixel for performance
    
    for (let i = 0; i < data.length; i += channels * sampleStep) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip very dark (almost black) and very light (almost white) pixels
      const brightness = (r + g + b) / 3;
      if (brightness < 30 || brightness > 225) continue;
      
      // Round colors to nearest 32 to group similar colors
      const roundedR = Math.round(r / 32) * 32;
      const roundedG = Math.round(g / 32) * 32;
      const roundedB = Math.round(b / 32) * 32;
      
      const colorKey = `${roundedR},${roundedG},${roundedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Sort by frequency and get top 2 colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([colorKey]) => {
        const [r, g, b] = colorKey.split(',').map(Number);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      });
    
    if (sortedColors.length === 0) return null;
    
    // If only one color found, duplicate it for secondary
    if (sortedColors.length === 1) {
      return [sortedColors[0], sortedColors[0]];
    }
    
    return sortedColors;
  } catch (error) {
    console.warn(`⚠️ Could not extract colors from logo ${logoUrl}:`, error.message);
    return null;
  }
}

// Get team colors from logo (telif için - ayrımcılık yapmadan tüm takımlar için çalışır)
async function getTeamColors(teamId, teamData) {
  // First try to extract from API response
  const apiColors = extractTeamColors(teamData);
  if (apiColors) {
    return apiColors;
  }
  
  // If no API colors, extract from logo
  const team = teamData?.team || teamData;
  const logoUrl = team?.logo;
  
  if (logoUrl) {
    const logoColors = await extractColorsFromLogo(logoUrl);
    if (logoColors) {
      return logoColors;
    }
  }
  
  return null;
}

// Extract country flag from API response (national teams)
function extractCountryFlag(countryData) {
  if (!countryData || !countryData.flag) return null;
  return countryData.flag; // Returns flag emoji or URL
}

// Map team to country flag (helper function)
async function getTeamFlag(teamCountry) {
  if (!teamCountry) return null;
  
  try {
    const countriesData = await getCountries();
    if (countriesData.response && countriesData.response.length > 0) {
      const country = countriesData.response.find(c => 
        c.name.toLowerCase() === teamCountry.toLowerCase() ||
        c.code.toLowerCase() === teamCountry.toLowerCase() ||
        c.name.toLowerCase().includes(teamCountry.toLowerCase())
      );
      return country ? country.flag : null;
    }
  } catch (error) {
    console.warn('Error fetching country flag:', error.message);
  }
  
  return null;
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
  // ✅ Internal API request function (for scripts)
  apiRequest: makeRequest,
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
  getTeamSquad,
  getTeamInjuries,
  getTeamCoach,
  getTeamSeasons,
  getCountries,
  extractTeamColors,
  extractCountryFlag,
  getTeamFlag,
  getTeamColors,
  getCacheStats,
  clearCache,
};
