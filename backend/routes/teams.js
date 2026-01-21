// Teams Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');

// GET /api/teams/search/:query - Search teams by name
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`🔍 Searching teams: "${query}"`);
    const data = await footballApi.searchTeams(query);
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

// GET /api/teams/:id - Get team information with colors and flags
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getTeamInfo(id);
    
    if (!data.response || data.response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }
    
    const teamData = data.response[0];
    const team = teamData.team || teamData;
    
      // Extract team colors (for club teams - kit colors) and flags (for national teams)
      let colors = null;
      let flag = null;
      
      if (team.national) {
        // National team - get country flag from API
        flag = await footballApi.getTeamFlag(team.country);
      } else {
        // Club team - extract colors from logo (telif için logo yerine renkler - ayrımcılık yapmadan)
        colors = await footballApi.getTeamColors(team.id, teamData);
      }
    
    // Enhanced team data with colors and flags
    const enhancedTeam = {
      ...team,
      colors, // Kit colors for club teams (telif için)
      flag, // Flag for national teams
      type: team.national ? 'national' : 'club',
    };
    
    res.json({
      success: true,
      data: enhancedTeam,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/teams/:id/statistics - Get team statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const { league, season } = req.query;
    const data = await footballApi.getTeamStatistics(id, league, season);
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

// GET /api/teams/:id/colors - Get team kit colors (for club teams)
router.get('/:id/colors', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getTeamInfo(id);
    
    if (!data.response || data.response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }
    
    const teamData = data.response[0];
    const team = teamData.team || teamData;
    
    // Get colors from logo (telif için logo yerine renkler - ayrımcılık yapmadan)
    const colors = await footballApi.getTeamColors(team.id, teamData);
    
    res.json({
      success: true,
      data: {
        teamId: id,
        teamName: teamData.team?.name,
        colors: colors || null,
        note: colors ? 'Colors extracted from API' : 'Colors not available, may need manual mapping',
      },
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/teams/:id/flag - Get country flag (for national teams)
router.get('/:id/flag', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await footballApi.getTeamInfo(id);
    
    if (!data.response || data.response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }
    
    const teamData = data.response[0];
    const team = teamData.team || teamData;
    
    if (!team.national) {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only for national teams',
      });
    }
    
    // Get country flag from API
    const flag = await footballApi.getTeamFlag(team.country);
    
    res.json({
      success: true,
      data: {
        teamId: id,
        teamName: team.name,
        country: team.country,
        flag: flag || null,
      },
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/teams/search/:query - Enhanced search with colors and flags
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`🔍 Searching teams: "${query}"`);
    const data = await footballApi.searchTeams(query);
    
    if (!data.response || data.response.length === 0) {
      return res.json({
        success: true,
        data: [],
        cached: data.cached || false,
      });
    }
    
    // Enhance each team with colors and flags
    const enhancedTeams = await Promise.all(data.response.map(async (teamData) => {
      const team = teamData.team || teamData;
      let colors = null;
      let flag = null;
      
      if (team.national) {
        // National team - get country flag from API
        flag = await footballApi.getTeamFlag(team.country);
      } else {
        // Club team - extract colors from logo (telif için logo yerine renkler - ayrımcılık yapmadan)
        colors = await footballApi.getTeamColors(team.id, teamData);
      }
      
      return {
        ...team,
        colors,
        flag,
        type: team.national ? 'national' : 'club',
      };
    }));
    
    res.json({
      success: true,
      data: enhancedTeams,
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
