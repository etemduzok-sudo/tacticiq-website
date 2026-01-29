// Matches Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const { calculateRatingFromStats, calculatePlayerAttributesFromStats } = require('../utils/playerRatingFromStats');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 🔥 CACHE MEKANIZMASI - API kullanımını azaltmak için
const API_CACHE = {
  liveMatches: { data: null, timestamp: 0 },
  teamMatches: new Map(), // teamId_season -> { data, timestamp }
};

const CACHE_DURATION = {
  liveMatches: 12 * 1000, // 12 saniye (canlı maçlar için)
  teamMatches: 6 * 60 * 60 * 1000, // 6 saat (geçmiş/gelecek maçlar için)
};

// Helper: Check if cache is valid
function isCacheValid(timestamp, duration) {
  return Date.now() - timestamp < duration;
}

// ✅ Rating ve pozisyona göre 6 özniteliği türet (API bu alanları sağlamıyor)
function derivePlayerStats(rating, positionStr) {
  const pos = (positionStr || '').toLowerCase();
  let base = { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 };
  if (pos.includes('goalkeeper') || pos === 'gk' || pos === 'g') {
    base = { pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 92, physical: 88 };
  } else if (pos.includes('defender') || pos.includes('back') || /cb|lb|rb|lwb|rwb/i.test(pos)) {
    base = { pace: 72, shooting: 42, passing: 68, dribbling: 58, defending: 92, physical: 88 };
  } else if (pos.includes('midfielder') || pos.includes('mid') || /cm|cdm|cam|lm|rm|dm|am/i.test(pos)) {
    base = { pace: 76, shooting: 68, passing: 92, dribbling: 88, defending: 68, physical: 72 };
  } else if (pos.includes('attacker') || pos.includes('forward') || pos.includes('striker') || /st|cf|lw|rw|w/i.test(pos)) {
    base = { pace: 90, shooting: 90, passing: 72, dribbling: 88, defending: 38, physical: 72 };
  }
  const avgBase = (base.pace + base.shooting + base.passing + base.dribbling + base.defending + base.physical) / 6;
  const scale = (rating || 75) / avgBase;
  const clamp = (n) => Math.min(99, Math.max(65, Math.round(n)));
  return {
    pace: clamp(base.pace * scale),
    shooting: clamp(base.shooting * scale),
    passing: clamp(base.passing * scale),
    dribbling: clamp(base.dribbling * scale),
    defending: clamp(base.defending * scale),
    physical: clamp(base.physical * scale),
  };
}

// Helper: Get date range
function getDateRange(days) {
  const today = new Date();
  const dates = [];
  for (let i = -days; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// Helper: Update match from API response
async function updateMatchFromApi(fixture) {
  try {
    const matchData = {
      id: fixture.fixture.id,
      league_id: fixture.league.id,
      season: fixture.league.season,
      round: fixture.league.round,
      home_team_id: fixture.teams.home.id,
      away_team_id: fixture.teams.away.id,
      fixture_date: new Date(fixture.fixture.date),
      fixture_timestamp: fixture.fixture.timestamp,
      timezone: fixture.fixture.timezone,
      status: fixture.fixture.status.short,
      status_long: fixture.fixture.status.long,
      elapsed: fixture.fixture.status.elapsed,
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      halftime_home: fixture.score.halftime.home,
      halftime_away: fixture.score.halftime.away,
      fulltime_home: fixture.score.fulltime.home,
      fulltime_away: fixture.score.fulltime.away,
      extratime_home: fixture.score.extratime.home,
      extratime_away: fixture.score.extratime.away,
      penalty_home: fixture.score.penalty.home,
      penalty_away: fixture.score.penalty.away,
      venue_name: fixture.fixture.venue?.name,
      venue_city: fixture.fixture.venue?.city,
      referee: fixture.fixture.referee
    };

    // Upsert match
    const { error } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'id' });

    if (error) throw error;

    // Upsert teams if not exists
    await upsertTeam(fixture.teams.home);
    await upsertTeam(fixture.teams.away);

    // Upsert league if not exists
    await upsertLeague(fixture.league);

    return true;
  } catch (error) {
    console.error('Error updating match:', error);
    return false;
  }
}

// Helper: Upsert team
async function upsertTeam(team) {
  try {
    const teamData = {
      id: team.id,
      name: team.name,
      code: team.code,
      country: team.country,
      logo: null // ⚠️ TELİF HAKKI: Kulüp armaları telifli - ASLA döndürülmez (sadece renkler kullanılır)
    };

    await supabase
      .from('teams')
      .upsert(teamData, { onConflict: 'id' });
  } catch (error) {
    console.error('Error upserting team:', error);
  }
}

// Helper: Upsert league
async function upsertLeague(league) {
  try {
    const leagueData = {
      id: league.id,
      name: league.name,
      country: league.country,
      logo: null, // ⚠️ TELİF HAKKI: UEFA, FIFA gibi organizasyon logo'ları ASLA kullanılmaz
      flag: league.flag,
      season: league.season
    };

    await supabase
      .from('leagues')
      .upsert(leagueData, { onConflict: 'id' });
  } catch (error) {
    console.error('Error upserting league:', error);
  }
}

// Helper: Update match statistics from API
async function updateMatchStatisticsFromApi(matchId, statistics) {
  try {
    for (const stat of statistics) {
      const statsData = {
        match_id: matchId,
        team_id: stat.team.id,
        shots_on_goal: getStatValue(stat.statistics, 'Shots on Goal'),
        shots_off_goal: getStatValue(stat.statistics, 'Shots off Goal'),
        total_shots: getStatValue(stat.statistics, 'Total Shots'),
        blocked_shots: getStatValue(stat.statistics, 'Blocked Shots'),
        shots_inside_box: getStatValue(stat.statistics, 'Shots insidebox'),
        shots_outside_box: getStatValue(stat.statistics, 'Shots outsidebox'),
        fouls: getStatValue(stat.statistics, 'Fouls'),
        corner_kicks: getStatValue(stat.statistics, 'Corner Kicks'),
        offsides: getStatValue(stat.statistics, 'Offsides'),
        ball_possession: parseInt(getStatValue(stat.statistics, 'Ball Possession') || 0),
        yellow_cards: getStatValue(stat.statistics, 'Yellow Cards'),
        red_cards: getStatValue(stat.statistics, 'Red Cards'),
        goalkeeper_saves: getStatValue(stat.statistics, 'Goalkeeper Saves'),
        total_passes: getStatValue(stat.statistics, 'Total passes'),
        passes_accurate: getStatValue(stat.statistics, 'Passes accurate'),
        passes_percentage: parseInt(getStatValue(stat.statistics, 'Passes %') || 0)
      };

      await supabase
        .from('match_statistics')
        .upsert(statsData, { onConflict: 'match_id,team_id' });
    }
    return true;
  } catch (error) {
    console.error('Error updating match statistics:', error);
    return false;
  }
}

// Helper: Get stat value
function getStatValue(statistics, type) {
  const stat = statistics.find(s => s.type === type);
  return stat ? (parseInt(stat.value) || 0) : 0;
}

// GET /api/matches/live - Get live matches
router.get('/live', async (req, res) => {
  try {
    // 🔥 1. CHECK CACHE FIRST (12 saniye)
    if (isCacheValid(API_CACHE.liveMatches.timestamp, CACHE_DURATION.liveMatches)) {
      console.log('✅ [LIVE] Returning from MEMORY CACHE (age:', Math.round((Date.now() - API_CACHE.liveMatches.timestamp) / 1000), 'seconds)');
      return res.json({
        success: true,
        data: API_CACHE.liveMatches.data,
        source: 'memory-cache',
        cached: true,
      });
    }

    // 2. Try database first
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .in('status', ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'])
      .order('fixture_date', { ascending: true });

    // 3. If API key exists, try to get fresh data (ONLY if cache expired)
    if (process.env.API_FOOTBALL_KEY) {
      try {
        console.log('🌐 [LIVE] Fetching from API-FOOTBALL (cache expired)');
        const data = await footballApi.getLiveMatches();
        
        // 🔥 DEDUPLİKASYON: fixture.id bazında tekil maçlar (ekstra güvenlik)
        const seenIds = new Set();
        const uniqueMatches = (data.response || []).filter(match => {
          const fixtureId = match.fixture?.id;
          if (!fixtureId || seenIds.has(fixtureId)) {
            console.log('⚠️ [LIVE] Duplicate match filtered:', fixtureId, match.teams?.home?.name, 'vs', match.teams?.away?.name);
            return false;
          }
          seenIds.add(fixtureId);
          return true;
        });
        
        // 🔥 UPDATE CACHE with deduplicated data
        API_CACHE.liveMatches = {
          data: uniqueMatches,
          timestamp: Date.now(),
        };
        console.log('💾 [LIVE] Cached', uniqueMatches.length, 'unique matches for 12 seconds (filtered', (data.response?.length || 0) - uniqueMatches.length, 'duplicates)');
        
        // Sync to database if enabled (use unique matches)
        if (databaseService.enabled && uniqueMatches && uniqueMatches.length > 0) {
          await databaseService.upsertMatches(uniqueMatches);
        }
        
        return res.json({
          success: true,
          data: uniqueMatches,
          source: 'api',
          cached: false,
        });
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
    }

    // 4. Return database data or empty array
    res.json({
      success: true,
      data: (!dbError && dbMatches) ? dbMatches : [],
      source: dbMatches && dbMatches.length > 0 ? 'database' : 'empty',
      message: dbMatches && dbMatches.length === 0 ? 'No live matches at the moment' : undefined
    });

  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.json({
      success: true,
      data: [],
      source: 'empty',
      message: 'No live matches available'
    });
  }
});

// GET /api/matches/date/:date - Get matches by date (format: YYYY-MM-DD)
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const data = await footballApi.getFixturesByDate(date);
    
    // Sync to database if enabled
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/team/:teamId/season/:season - Get all matches for a team in a season
router.get('/team/:teamId/season/:season', async (req, res) => {
  try {
    const { teamId, season } = req.params;
    const cacheKey = `${teamId}_${season}`;
    
    console.log(`📅 Fetching all matches for team ${teamId} in season ${season}`);
    
    // 🔥 1. CHECK MEMORY CACHE FIRST (6 saat)
    if (API_CACHE.teamMatches.has(cacheKey)) {
      const cached = API_CACHE.teamMatches.get(cacheKey);
      if (isCacheValid(cached.timestamp, CACHE_DURATION.teamMatches)) {
        console.log(`✅ [TEAM] Returning from MEMORY CACHE (age: ${Math.round((Date.now() - cached.timestamp) / 1000 / 60)} minutes)`);
        return res.json({
          success: true,
          data: cached.data,
          source: 'memory-cache',
          cached: true,
          count: cached.data.length
        });
      }
    }
    
    // 2. TRY DATABASE (much faster than API!)
    if (databaseService.enabled) {
      try {
        const dbMatches = await databaseService.getTeamMatches(teamId, season);
        if (dbMatches && dbMatches.length > 0) {
          console.log(`✅ Found ${dbMatches.length} matches in DATABASE (fast!)`);
          
          // 🔥 CACHE IN MEMORY
          API_CACHE.teamMatches.set(cacheKey, {
            data: dbMatches,
            timestamp: Date.now(),
          });
          console.log(`💾 [TEAM] Cached ${dbMatches.length} matches for 6 hours`);
          
          return res.json({
            success: true,
            data: dbMatches,
            source: 'database',
            cached: true,
            count: dbMatches.length
          });
        }
      } catch (dbError) {
        console.warn('Database lookup failed, falling back to API:', dbError.message);
      }
    }
    
    // 3. Fallback to API if database is empty
    console.log('⚠️ Database empty, fetching from API-Football...');
    const data = await footballApi.getFixturesByTeam(teamId, season);
    
    // 🔥 CACHE IN MEMORY
    if (data.response && data.response.length > 0) {
      API_CACHE.teamMatches.set(cacheKey, {
        data: data.response,
        timestamp: Date.now(),
      });
      console.log(`💾 [TEAM] Cached ${data.response.length} matches from API for 6 hours`);
    }
    
    // Sync to database for next time
    if (databaseService.enabled && data.response && data.response.length > 0) {
      console.log(`💾 Syncing ${data.response.length} matches to database...`);
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      source: 'api',
      cached: false,
      count: data.response?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching team season matches:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/league/:leagueId - Get matches by league
router.get('/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { season } = req.query;
    const data = await footballApi.getFixturesByLeague(leagueId, season);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Try to get from database first
    const { data: dbMatch, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .eq('id', id)
      .single();

    // 2. If found in DB and not live, return it
    if (!dbError && dbMatch) {
      // If match is not live, return cached data
      if (!['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(dbMatch.status)) {
        return res.json({
          success: true,
          data: dbMatch,
          source: 'database',
          cached: true
        });
      }
    }

    // 3. If live or not in DB, fetch from API
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const apiData = await footballApi.getFixtureDetails(id);
        
        if (apiData && apiData.response && apiData.response[0]) {
          const fixture = apiData.response[0];
          
          // Update/insert into database
          await updateMatchFromApi(fixture);
          
          return res.json({
            success: true,
            data: fixture,
            source: 'api',
            cached: apiData.cached || false
          });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
    }

    // 4. Fallback: return DB data if exists, even if live
    if (!dbError && dbMatch) {
      return res.json({
        success: true,
        data: dbMatch,
        source: 'database',
        cached: true,
        warning: 'API unavailable, showing cached data'
      });
    }

    // 5. Return mock data as last resort
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        status: 'NS',
        home_team: { id: 1, name: 'Home Team', logo: null },
        away_team: { id: 2, name: 'Away Team', logo: null },
        league: { id: 1, name: 'Mock League', logo: null },
        home_score: null,
        away_score: null,
        fixture_date: new Date().toISOString()
      },
      source: 'mock',
      message: 'No API key or database entry. Using mock data.'
    });

  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/matches/:id/statistics - Get match statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Try database first
    const { data: dbStats, error: dbError } = await supabase
      .from('match_statistics')
      .select(`
        *,
        team:teams(id, name, logo)
      `)
      .eq('match_id', id);

    // 2. If match is finished and stats exist, return DB data
    if (!dbError && dbStats && dbStats.length > 0) {
      const { data: match } = await supabase
        .from('matches')
        .select('status')
        .eq('id', id)
        .single();

      if (match && ['FT', 'AET', 'PEN'].includes(match.status)) {
        return res.json({
          success: true,
          data: dbStats,
          source: 'database',
          cached: true
        });
      }
    }

    // 3. Fetch from API if available
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const apiData = await footballApi.getFixtureStatistics(id);
        
        if (apiData && apiData.response) {
          // Update database
          await updateMatchStatisticsFromApi(id, apiData.response);
          
          return res.json({
            success: true,
            data: apiData.response,
            source: 'api',
            cached: apiData.cached || false
          });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
      }
    }

    // 4. Fallback to DB data
    if (!dbError && dbStats) {
      return res.json({
        success: true,
        data: dbStats,
        source: 'database',
        cached: true
      });
    }

    // 5. No data
    res.json({
      success: true,
      data: [],
      message: 'No statistics available'
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/matches/:id/prediction-data - Get prediction data from API-Football
router.get('/:id/prediction-data', async (req, res) => {
  try {
    const { id } = req.params;
    
    // API-Football'dan statistics ve events çek
    const [statsData, eventsData] = await Promise.all([
      footballApi.getFixtureStatistics(id).catch(() => ({ response: [] })),
      footballApi.getFixtureEvents(id).catch(() => ({ response: [] })),
    ]);
    
    const statistics = statsData.response || [];
    const events = eventsData.response || [];
    
    // Statistics'ten verileri çıkar
    const homeStats = statistics.find(s => s.team?.id) || {};
    const awayStats = statistics.find(s => s.team?.id && s.team.id !== homeStats.team?.id) || {};
    
    const getStatValue = (stats, type) => {
      const stat = stats.statistics?.find(s => s.type === type);
      return stat ? parseInt(stat.value) || 0 : 0;
    };
    
    // Events'ten verileri çıkar
    const goals = events.filter(e => e.type === 'Goal');
    const yellowCards = events.filter(e => e.type === 'Card' && e.detail === 'Yellow Card');
    const redCards = events.filter(e => e.type === 'Card' && e.detail === 'Red Card');
    const firstGoal = goals.length > 0 ? goals[0] : null;
    
    // Prediction data'yı oluştur
    const predictionData = {
      // Cards
      yellowCards: {
        home: getStatValue(homeStats, 'Yellow Cards'),
        away: getStatValue(awayStats, 'Yellow Cards'),
        total: yellowCards.length,
      },
      redCards: {
        home: getStatValue(homeStats, 'Red Cards'),
        away: getStatValue(awayStats, 'Red Cards'),
        total: redCards.length,
      },
      
      // Possession
      possession: {
        home: getStatValue(homeStats, 'Ball Possession'),
        away: getStatValue(awayStats, 'Ball Possession'),
      },
      
      // Shots
      totalShots: {
        home: getStatValue(homeStats, 'Total Shots'),
        away: getStatValue(awayStats, 'Total Shots'),
        total: getStatValue(homeStats, 'Total Shots') + getStatValue(awayStats, 'Total Shots'),
      },
      shotsOnTarget: {
        home: getStatValue(homeStats, 'Shots on Goal'),
        away: getStatValue(awayStats, 'Shots on Goal'),
        total: getStatValue(homeStats, 'Shots on Goal') + getStatValue(awayStats, 'Shots on Goal'),
      },
      
      // Corners
      corners: {
        home: getStatValue(homeStats, 'Corner Kicks'),
        away: getStatValue(awayStats, 'Corner Kicks'),
        total: getStatValue(homeStats, 'Corner Kicks') + getStatValue(awayStats, 'Corner Kicks'),
      },
      
      // First Goal Time
      firstGoalTime: firstGoal ? firstGoal.time?.elapsed : null,
      
      // Goals
      goals: {
        home: goals.filter(g => g.team?.id === homeStats.team?.id).length,
        away: goals.filter(g => g.team?.id === awayStats.team?.id).length,
        total: goals.length,
      },
    };
    
    res.json({
      success: true,
      data: predictionData,
      source: 'api',
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id/events - Get match events (goals, cards, etc.)
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getFixtureEvents(id);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id/lineups - Get match lineups with team colors and player details
// ?refresh=1 ile cache atlanır, API'den taze çekilir ve rating'ler güncellenir
router.get('/:id/lineups', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    
    // 1. Önce DB'den cache kontrol et (refresh=1 ise atla)
    const { data: cachedMatch, error: cacheError } = skipCache ? { data: null, error: null } : await supabase
      .from('matches')
      .select('lineups, home_team_id, away_team_id')
      .eq('id', matchId)
      .single();
    
    // Eğer DB'de lineups varsa, rating'leri players tablosundan doldurup döndür
    if (cachedMatch?.lineups && Array.isArray(cachedMatch.lineups) && cachedMatch.lineups.length > 0) {
      console.log(`✅ [Lineups] Cache hit for match ${matchId}, enriching with ratings from DB...`);
      const playerIds = [];
      for (const lineup of cachedMatch.lineups) {
        for (const item of (lineup.startXI || [])) {
          const p = item.player || item;
          if (p && p.id) playerIds.push(p.id);
        }
        for (const item of (lineup.substitutes || [])) {
          const p = item.player || item;
          if (p && p.id) playerIds.push(p.id);
        }
      }
      let ratingsMap = {};
      if (playerIds.length > 0) {
        try {
          const { data: playersRows } = await supabase
            .from('players')
            .select('id, rating')
            .in('id', [...new Set(playerIds)]);
          if (playersRows) {
            ratingsMap = playersRows.reduce((acc, row) => {
              if (row.rating != null) acc[row.id] = row.rating;
              return acc;
            }, {});
          }
        } catch (e) {
          console.warn('⚠️ [Lineups] Failed to fetch ratings for cached lineups:', e.message);
        }
      }
      const applyRating = (list) => (list || []).map((item) => {
        const p = item.player || item;
        const id = p && p.id;
        const dbRating = id ? ratingsMap[id] : null;
        const raw = dbRating != null ? dbRating : (p && (p.rating != null && p.rating !== undefined) ? p.rating : 75);
        const rating = Math.round(Number(raw)) || 75;
        const positionStr = p && (p.position || p.pos) || '';
        const stats = derivePlayerStats(rating, positionStr);
        if (item.player) {
          return { ...item, player: { ...item.player, rating, stats } };
        }
        return { ...item, rating, stats };
      });
      const enrichedCached = cachedMatch.lineups.map((lineup) => ({
        ...lineup,
        startXI: applyRating(lineup.startXI),
        substitutes: applyRating(lineup.substitutes),
      }));
      return res.json({
        success: true,
        data: enrichedCached,
        cached: true,
        source: 'database',
      });
    }
    
    // 2. API'den çek
    console.log(`📡 [Lineups] Fetching from API for match ${matchId}`);
    const data = await footballApi.getFixtureLineups(matchId);
    
    if (!data.response || data.response.length === 0) {
      return res.json({
        success: true,
        data: [],
        cached: false,
        message: 'Lineups not available yet',
      });
    }
    
    // ✅ Fallback renk listesi (static_teams'de yoksa)
    const FALLBACK_COLORS = {
      // Türkiye
      611: ['#FFED00', '#00205B'], // Fenerbahçe
      645: ['#E30613', '#FDB913'], // Galatasaray
      549: ['#000000', '#FFFFFF'], // Beşiktaş
      551: ['#632134', '#00BFFF'], // Trabzonspor
      // UEFA
      2594: ['#E30613', '#00205B'], // FCSB
      194: ['#D2122E', '#FFFFFF'], // Ajax
      212: ['#003399', '#FFFFFF'], // Porto
      // Premier League
      50: ['#6CABDD', '#1C2C5B'], // Man City
      33: ['#DA291C', '#FBE122'], // Man United
      40: ['#C8102E', '#00B2A9'], // Liverpool
      42: ['#EF0107', '#FFFFFF'], // Arsenal
      49: ['#034694', '#FFFFFF'], // Chelsea
      66: ['#95BFE5', '#670E36'], // Aston Villa
      // La Liga
      541: ['#FFFFFF', '#00529F'], // Real Madrid
      529: ['#004D98', '#A50044'], // Barcelona
      530: ['#CB3524', '#FFFFFF'], // Atletico
      // Bundesliga
      157: ['#DC052D', '#FFFFFF'], // Bayern
      165: ['#FDE100', '#000000'], // Dortmund
      // Serie A
      489: ['#AC1818', '#000000'], // AC Milan
      505: ['#010E80', '#000000'], // Inter
      496: ['#000000', '#FFFFFF'], // Juventus
      // Ligue 1
      85: ['#004170', '#DA291C'], // PSG
    };
    
    // 3. Team colors'ı static_teams'den al ve lineups'ı zenginleştir
    const enrichedLineups = await Promise.all(data.response.map(async (lineup) => {
      const teamId = lineup.team?.id;
      const teamName = (lineup.team?.name || '').toLowerCase();
      
      // Static teams'den renkleri al
      let teamColors = null;
      if (teamId) {
        try {
          const { data: staticTeam } = await supabase
            .from('static_teams')
            .select('colors_primary, colors_secondary, colors')
            .eq('api_football_id', teamId)
            .single();
          
          if (staticTeam && (staticTeam.colors_primary || staticTeam.colors)) {
            teamColors = {
              primary: staticTeam.colors_primary,
              secondary: staticTeam.colors_secondary,
              all: staticTeam.colors,
            };
          }
        } catch (dbError) {
          console.warn(`⚠️ DB lookup failed for team ${teamId}:`, dbError.message);
        }
      }
      
      // ✅ Fallback: Hardcoded renklerden al
      if (!teamColors && teamId && FALLBACK_COLORS[teamId]) {
        const [primary, secondary] = FALLBACK_COLORS[teamId];
        teamColors = { primary, secondary, all: [primary, secondary] };
      }
      
      // ✅ Son fallback: İsimden tahmin et
      if (!teamColors) {
        let primary = '#1E40AF';
        let secondary = '#FFFFFF';
        
        // Yaygın takım isimlerini kontrol et
        if (teamName.includes('fenerbahce') || teamName.includes('fenerbahçe')) {
          primary = '#FFED00'; secondary = '#00205B';
        } else if (teamName.includes('galatasaray')) {
          primary = '#E30613'; secondary = '#FDB913';
        } else if (teamName.includes('fcsb') || teamName.includes('steaua')) {
          primary = '#E30613'; secondary = '#00205B';
        }
        
        teamColors = { primary, secondary, all: [primary, secondary] };
      }
      
      // ✅ Oyuncuları zenginleştir - API-Football'dan gerçek verilerle
      const enrichPlayers = async (players, teamId, season = 2025) => {
        if (!players || !Array.isArray(players)) return [];
        
        // Rate limiting için batch'ler halinde işle (her batch'te max 5 oyuncu)
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < players.length; i += batchSize) {
          batches.push(players.slice(i, i + batchSize));
        }
        
        const enriched = [];
        for (const batch of batches) {
          const batchResults = await Promise.all(batch.map(async (item) => {
          const player = item.player || item;
          const playerId = player.id;
          
          if (!playerId) {
            // Fallback: Eğer player ID yoksa basit rating kullan
            const posCode = player.pos || player.position?.charAt(0) || 'M';
            const positionRatings = {
              'G': 78, 'D': 75, 'M': 76, 'F': 77,
            };
            return {
              id: null,
              name: player.name,
              number: player.number,
              position: player.pos || player.position,
              grid: item.player?.grid || player.grid,
              rating: positionRatings[posCode] || 75,
              age: player.age || null,
              nationality: player.nationality || null,
            };
          }
          
          // 1. Önce veritabanından kontrol et
          let dbPlayer = null;
          try {
            const { data, error } = await supabase
              .from('players')
              .select('*')
              .eq('id', playerId)
              .single();
            
            if (!error && data) {
              dbPlayer = data;
            }
          } catch (dbError) {
            console.warn(`⚠️ DB check failed for player ${playerId}:`, dbError.message);
          }
          
          // 2. Eğer DB'de yoksa veya güncel değilse API'den çek
          let playerStats = null;
          let calculatedRating = 75; // Default rating
          let statsFromApi = null; // API'den gelen 6 öznitelik (pace, shooting, ...)
          
          if (!dbPlayer || !dbPlayer.rating) {
            try {
              // API-Football'dan oyuncu bilgilerini çek (sezon bazlı istatistiklerle)
              // Rate limiting için timeout ekle
              const apiData = await Promise.race([
                footballApi.getPlayerInfo(playerId, season),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('API timeout')), 5000)
                )
              ]).catch((err) => {
                console.warn(`⚠️ Player API timeout/failed for ${playerId}:`, err.message);
                return null;
              });
              
              if (apiData && apiData.response && apiData.response.length > 0 && apiData.response[0]) {
                const apiPlayer = apiData.response[0];
                const playerData = apiPlayer.player || {};
                const statistics = apiPlayer.statistics || [];
                
                // En son sezonun istatistiklerini kullan
                const latestStats = statistics.length > 0 ? statistics[0] : null;
                
                // Kendi reyting + 6 öznitelik (hız, şut, pas, dribling, defans, fizik) API istatistiklerinden
                if (latestStats && latestStats.games) {
                  const games = latestStats.games;
                  const attrs = calculatePlayerAttributesFromStats(latestStats, playerData);
                  calculatedRating = attrs.rating;
                  playerStats = {
                    rating: calculatedRating,
                    games: games.appearences || 0,
                    goals: latestStats.goals?.total || 0,
                    assists: latestStats.goals?.assists || 0,
                    minutes: games.minutes || 0,
                  };
                  // 6 öznitelik (stats) aşağıda attrs'tan alınacak
                  statsFromApi = {
                    pace: attrs.pace,
                    shooting: attrs.shooting,
                    passing: attrs.passing,
                    dribbling: attrs.dribbling,
                    defending: attrs.defending,
                    physical: attrs.physical,
                  };
                  console.log(`✅ Player ${playerId} (${playerData.name || player.name}): Rating=${calculatedRating}, Stats from API`);
                } else {
                  console.warn(`⚠️ Player ${playerId} (${playerData.name || player.name}): No stats from API, will use fallback`);
                }
                
                  // Veritabanına kaydet/güncelle
                try {
                  const playerRecord = {
                    id: playerId,
                    name: playerData.name || player.name,
                    firstname: playerData.firstname || null,
                    lastname: playerData.lastname || null,
                    age: playerData.age || player.age || null,
                    nationality: playerData.nationality || player.nationality || null,
                    position: playerData.position || player.pos || player.position || null,
                    height: playerData.height || null,
                    weight: playerData.weight || null,
                    rating: calculatedRating, // ✅ Rating'i kaydet
                    team_id: teamId,
                    updated_at: new Date().toISOString(),
                  };
                  
                  await supabase
                    .from('players')
                    .upsert(playerRecord, { onConflict: 'id' });
                  
                  console.log(`✅ Saved player ${playerId} (${playerData.name || player.name}) with rating ${calculatedRating}`);
                } catch (saveError) {
                  console.warn(`⚠️ Failed to save player ${playerId} to DB:`, saveError.message);
                }
              }
            } catch (apiError) {
              console.warn(`⚠️ API fetch failed for player ${playerId}:`, apiError.message);
              // Fallback: DB'deki rating'i kullan veya default
              if (dbPlayer && dbPlayer.rating) {
                calculatedRating = dbPlayer.rating;
              }
            }
          } else {
            // DB'de varsa onu kullan
            calculatedRating = dbPlayer.rating || 75;
          }
          
          // ✅ Rating'i clamp et: minimum 65, maximum 95 (FIFA benzeri)
          let finalRating = Math.round(Number(calculatedRating)) || 75;
          if (finalRating < 65) {
            console.warn(`⚠️ Rating too low for player ${playerId}: ${finalRating}, clamping to 65`);
            finalRating = 65;
          }
          if (finalRating > 95) {
            finalRating = 95;
          }
          
          const positionStr = player.pos || player.position || dbPlayer?.position || '';
          
          // ✅ Stats: API'den gelmediyse derivePlayerStats kullan, ama rating düşükse bile pozisyona göre mantıklı değerler üret
          let stats = statsFromApi;
          if (!stats) {
            stats = derivePlayerStats(finalRating, positionStr);
            // Eğer rating çok düşükse (65-70), stats'ları pozisyona göre minimum değerlere ayarla
            if (finalRating < 70) {
              const pos = (positionStr || '').toLowerCase();
              if (pos.includes('goalkeeper') || pos === 'gk' || pos === 'g') {
                stats = { pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 85, physical: 80 };
              } else if (pos.includes('defender') || pos.includes('back') || /cb|lb|rb|lwb|rwb/i.test(pos)) {
                stats = { pace: 65, shooting: 40, passing: 65, dribbling: 55, defending: 85, physical: 80 };
              } else if (pos.includes('midfielder') || pos.includes('mid') || /cm|cdm|cam|lm|rm|dm|am/i.test(pos)) {
                stats = { pace: 70, shooting: 65, passing: 85, dribbling: 80, defending: 65, physical: 70 };
              } else if (pos.includes('attacker') || pos.includes('forward') || pos.includes('striker') || /st|cf|lw|rw|w/i.test(pos)) {
                stats = { pace: 80, shooting: 80, passing: 70, dribbling: 80, defending: 40, physical: 70 };
              }
            }
          }
          return {
            id: playerId,
            name: player.name,
            number: player.number,
            position: player.pos || player.position,
            grid: item.player?.grid || player.grid,
            rating: finalRating,
            age: player.age || dbPlayer?.age || null,
            nationality: player.nationality || dbPlayer?.nationality || null,
            stats,
          };
          }));
          
          enriched.push(...batchResults);
          
          // Batch'ler arasında kısa bir delay (rate limiting)
          if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        return enriched;
      };
      
      // ✅ Gerçek oyuncu verilerini kullan
      const season = new Date().getFullYear(); // Mevcut sezon
      const enrichedStartXI = await enrichPlayers(lineup.startXI, teamId, season);
      const enrichedSubstitutes = await enrichPlayers(lineup.substitutes, teamId, season);
      
      return {
        team: {
          id: lineup.team?.id,
          name: lineup.team?.name,
          colors: teamColors,
        },
        formation: lineup.formation,
        startXI: enrichedStartXI,
        substitutes: enrichedSubstitutes,
        coach: lineup.coach,
      };
    }));
    
    // 4. DB'ye cache'le
    if (enrichedLineups.length > 0) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          lineups: enrichedLineups,
          has_lineups: true,
        })
        .eq('id', matchId);
      
      if (updateError) {
        console.warn(`⚠️ [Lineups] Failed to cache lineups for match ${matchId}:`, updateError.message);
      } else {
        console.log(`💾 [Lineups] Cached lineups for match ${matchId}`);
      }
    }
    
    res.json({
      success: true,
      data: enrichedLineups,
      cached: false,
      source: 'api',
    });
  } catch (error) {
    console.error(`❌ [Lineups] Error for match ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/h2h/:team1/:team2 - Get head to head
router.get('/h2h/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    const data = await footballApi.getHeadToHead(team1, team2);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/team/:teamId/last - Get team's last matches
router.get('/team/:teamId/last', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`📥 Fetching ${limit} past matches for team ${teamId}`);
    
    const data = await footballApi.getTeamLastMatches(teamId, limit);
    
    // Sync to database
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      source: 'api'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/team/:teamId/upcoming - Get team's upcoming matches
router.get('/team/:teamId/upcoming', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 15 } = req.query; // Increased to 15 for better UX
    
    console.log(`📥 Fetching ${limit} upcoming matches for team ${teamId}`);
    
    const data = await footballApi.getTeamUpcomingMatches(teamId, limit);
    
    // Sync to database
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      source: 'api'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/favorites - Get matches for favorite teams
router.get('/favorites', async (req, res) => {
  try {
    const { teamIds } = req.query; // Comma-separated team IDs
    
    if (!teamIds) {
      return res.status(400).json({
        success: false,
        error: 'teamIds parameter is required',
      });
    }

    const ids = teamIds.split(',').map(id => parseInt(id.trim()));
    const allMatches = [];

    // Fetch last 5, live, and next 5 matches for each team
    for (const teamId of ids) {
      try {
        const [lastMatches, upcomingMatches] = await Promise.all([
          footballApi.getTeamLastMatches(teamId, 5),
          footballApi.getTeamUpcomingMatches(teamId, 5),
        ]);

        if (lastMatches.response) {
          allMatches.push(...lastMatches.response);
        }
        if (upcomingMatches.response) {
          allMatches.push(...upcomingMatches.response);
        }
      } catch (err) {
        console.warn(`Failed to fetch matches for team ${teamId}:`, err.message);
      }
    }

    // Remove duplicates and sort by date
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.fixture.id, m])).values()
    ).sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

    res.json({
      success: true,
      data: uniqueMatches,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
