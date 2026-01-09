// Matches Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');

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

// GET /api/matches/live - Get live matches
router.get('/live', async (req, res) => {
  try {
    const data = await footballApi.getLiveMatches();
    
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
    const data = await footballApi.getFixtureDetails(id);
    res.json({
      success: true,
      data: data.response[0],
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id/statistics - Get match statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getFixtureStatistics(id);
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
