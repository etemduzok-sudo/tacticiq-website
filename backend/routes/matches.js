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
      logo: team.logo
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
      logo: league.logo,
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
    // 1. Try database first
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

    // 2. If API key exists, try to get fresh data
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const data = await footballApi.getLiveMatches();
        
        // Sync to database if enabled
        if (databaseService.enabled && data.response && data.response.length > 0) {
          await databaseService.upsertMatches(data.response);
        }
        
        return res.json({
          success: true,
          data: data.response,
          source: 'api',
          cached: data.cached || false,
        });
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
    }

    // 3. Return database data or empty array
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
    
    console.log(`📅 Fetching all matches for team ${teamId} in season ${season}`);
    
    // Try database first
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, country, logo)
      `)
      .eq('season', season)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('fixture_date', { ascending: true });
    
    if (dbError) {
      console.error('❌ Database error:', dbError);
    }
    
    // Eğer database'de yeterli maç varsa (en az 100), database'den dön
    // NOT: Threshold yüksek tutuldu çünkü database'de yanlış takım maçları var
    if (dbMatches && dbMatches.length >= 100) {
      console.log(`✅ Found ${dbMatches.length} matches for team ${teamId} in database (sufficient)`);
      
      // DEBUG: Log first 3 matches to verify team IDs
      if (dbMatches.length > 0) {
        console.log('🔍 First 3 matches:', dbMatches.slice(0, 3).map(m => ({
          id: m.id,
          homeTeam: m.home_team?.name || m.home_team_id,
          awayTeam: m.away_team?.name || m.away_team_id,
          homeTeamId: m.home_team_id,
          awayTeamId: m.away_team_id,
          date: m.fixture_date
        })));
      }
      
      return res.json({
        success: true,
        data: dbMatches,
        source: 'database',
        count: dbMatches.length
      });
    }
    
    // Yetersiz veri varsa API'den çek
    if (dbMatches && dbMatches.length > 0) {
      console.log(`⚠️ Only ${dbMatches.length} matches in database, fetching from API for complete data...`);
    } else {
      console.log(`⚠️ No matches in database, fetching from API...`);
    }
    
    const data = await footballApi.getFixturesByTeam(teamId, season);
    
    // Sync to database
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      source: 'api',
      cached: data.cached || false,
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
    const data = await footballApi.getTeamLastMatches(teamId, limit);
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

// GET /api/matches/team/:teamId/upcoming - Get team's upcoming matches
router.get('/team/:teamId/upcoming', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    const data = await footballApi.getTeamUpcomingMatches(teamId, limit);
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
