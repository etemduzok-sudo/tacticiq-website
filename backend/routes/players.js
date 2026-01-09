// Players Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');

// GET /api/players/:id - Get player information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;
    const data = await footballApi.getPlayerInfo(id, season);
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
