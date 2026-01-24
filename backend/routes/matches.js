// Matches Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
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

// GET /api/matches/:id/lineups - Get match lineups
router.get('/:id/lineups', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getFixtureLineups(id);
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
