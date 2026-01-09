// Leagues Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');

// GET /api/leagues - Get all leagues or by country
router.get('/', async (req, res) => {
  try {
    const { country } = req.query;
    const data = await footballApi.getLeagues(country);
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

// GET /api/leagues/:id/standings - Get league standings
router.get('/:id/standings', async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;
    const data = await footballApi.getLeagueStandings(id, season);
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

module.exports = router;
