// Enhanced Matches Routes with Security & Validation
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const { logger } = require('../middleware/logger');
const { apiLimiter, strictLimiter, validateDate, validateId, validateLeagueId, validateTeamId, validateH2H, validateFavorites } = require('../middleware/security');
const { optionalAuth, authenticateToken, requirePro } = require('../middleware/auth');

// Apply API rate limiting to all routes
router.use(apiLimiter);

// ======================
// PUBLIC ROUTES
// ======================

/**
 * GET /api/matches/live
 * Get live matches
 * Rate limit: 10 req/min
 */
router.get('/live', async (req, res) => {
  try {
    logger.info('Fetching live matches');
    const data = await footballApi.getLiveMatches();
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        count: data.response?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching live matches', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Canlı maçlar yüklenemedi',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/matches/date/:date
 * Get matches by date
 * Validation: date must be ISO8601 format (YYYY-MM-DD)
 */
router.get('/date/:date', validateDate, async (req, res) => {
  try {
    const { date } = req.params;
    logger.info('Fetching matches by date', { date });
    
    const data = await footballApi.getFixturesByDate(date);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        date,
        count: data.response?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching matches by date', {
      error: error.message,
      date: req.params.date,
    });
    
    res.status(500).json({
      success: false,
      error: 'Maçlar yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/league/:leagueId
 * Get matches by league
 * Query params: season (optional, default: 2024)
 */
router.get('/league/:leagueId', validateLeagueId, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { season = 2024 } = req.query;
    
    logger.info('Fetching matches by league', { leagueId, season });
    
    const data = await footballApi.getFixturesByLeague(leagueId, season);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        leagueId,
        season,
        count: data.response?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching matches by league', {
      error: error.message,
      leagueId: req.params.leagueId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Lig maçları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/:id
 * Get match details
 */
router.get('/:id', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching match details', { matchId: id });
    
    const data = await footballApi.getFixtureDetails(id);
    
    if (!data.response || data.response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Maç bulunamadı',
      });
    }
    
    res.json({
      success: true,
      data: data.response[0],
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching match details', {
      error: error.message,
      matchId: req.params.id,
    });
    
    res.status(500).json({
      success: false,
      error: 'Maç detayları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/:id/statistics
 * Get match statistics
 */
router.get('/:id/statistics', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching match statistics', { matchId: id });
    
    const data = await footballApi.getFixtureStatistics(id);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching match statistics', {
      error: error.message,
      matchId: req.params.id,
    });
    
    res.status(500).json({
      success: false,
      error: 'Maç istatistikleri yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/:id/events
 * Get match events (goals, cards, etc.)
 */
router.get('/:id/events', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching match events', { matchId: id });
    
    const data = await footballApi.getFixtureEvents(id);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching match events', {
      error: error.message,
      matchId: req.params.id,
    });
    
    res.status(500).json({
      success: false,
      error: 'Maç olayları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/:id/lineups
 * Get match lineups
 */
router.get('/:id/lineups', validateId, async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching match lineups', { matchId: id });
    
    const data = await footballApi.getFixtureLineups(id);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching match lineups', {
      error: error.message,
      matchId: req.params.id,
    });
    
    res.status(500).json({
      success: false,
      error: 'Maç kadroları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/h2h/:team1/:team2
 * Get head to head
 * Strict rate limit: 3 req/min
 */
router.get('/h2h/:team1/:team2', strictLimiter, validateH2H, async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    logger.info('Fetching head to head', { team1, team2 });
    
    const data = await footballApi.getHeadToHead(team1, team2);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        team1,
        team2,
      },
    });
  } catch (error) {
    logger.error('Error fetching head to head', {
      error: error.message,
      team1: req.params.team1,
      team2: req.params.team2,
    });
    
    res.status(500).json({
      success: false,
      error: 'Karşılaşma geçmişi yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/team/:teamId/last
 * Get team's last matches
 */
router.get('/team/:teamId/last', validateTeamId, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    
    logger.info('Fetching team last matches', { teamId, limit });
    
    const data = await footballApi.getTeamLastMatches(teamId, limit);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        teamId,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching team last matches', {
      error: error.message,
      teamId: req.params.teamId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Takım maçları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/team/:teamId/upcoming
 * Get team's upcoming matches
 */
router.get('/team/:teamId/upcoming', validateTeamId, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    
    logger.info('Fetching team upcoming matches', { teamId, limit });
    
    const data = await footballApi.getTeamUpcomingMatches(teamId, limit);
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      meta: {
        timestamp: new Date().toISOString(),
        teamId,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching team upcoming matches', {
      error: error.message,
      teamId: req.params.teamId,
    });
    
    res.status(500).json({
      success: false,
      error: 'Takım maçları yüklenemedi',
    });
  }
});

/**
 * GET /api/matches/favorites
 * Get matches for favorite teams
 * Query params: teamIds (comma-separated)
 * Strict rate limit: 3 req/min
 */
router.get('/favorites', strictLimiter, validateFavorites, async (req, res) => {
  try {
    const { teamIds } = req.query;
    const ids = teamIds.split(',').map(id => parseInt(id.trim()));
    
    logger.info('Fetching favorite team matches', { teamIds: ids });
    
    const allMatches = [];
    
    // Fetch matches in parallel
    const promises = ids.map(teamId => 
      Promise.allSettled([
        footballApi.getTeamLastMatches(teamId, 5),
        footballApi.getTeamUpcomingMatches(teamId, 5),
      ])
    );
    
    const results = await Promise.all(promises);
    
    // Process results
    results.forEach((result, index) => {
      const teamId = ids[index];
      
      if (result[0].status === 'fulfilled' && result[0].value.response) {
        allMatches.push(...result[0].value.response);
      } else {
        logger.warn(`Failed to fetch last matches for team ${teamId}`);
      }
      
      if (result[1].status === 'fulfilled' && result[1].value.response) {
        allMatches.push(...result[1].value.response);
      } else {
        logger.warn(`Failed to fetch upcoming matches for team ${teamId}`);
      }
    });
    
    // Remove duplicates and sort by date
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.fixture.id, m])).values()
    ).sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
    
    res.json({
      success: true,
      data: uniqueMatches,
      cached: false,
      meta: {
        timestamp: new Date().toISOString(),
        teamIds: ids,
        count: uniqueMatches.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching favorite team matches', {
      error: error.message,
      teamIds: req.query.teamIds,
    });
    
    res.status(500).json({
      success: false,
      error: 'Favori takım maçları yüklenemedi',
    });
  }
});

module.exports = router;
