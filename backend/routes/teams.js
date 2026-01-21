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
    
    // Extract team colors (for club teams - kit colors)
    // Note: API-Football doesn't directly provide kit colors, so we'll need to map them
    // For now, we'll use country flag for national teams
    let colors = null;
    let flag = null;
    
    if (team.national) {
      // National team - get country flag
      try {
        const countriesData = await footballApi.getCountries();
        if (countriesData.response) {
          const country = countriesData.response.find(c => 
            c.name.toLowerCase() === (team.country || '').toLowerCase() ||
            c.name.toLowerCase().includes((team.country || '').toLowerCase())
          );
          if (country) {
            flag = country.flag; // Flag emoji or URL
          }
        }
      } catch (err) {
        console.warn('Could not fetch country flag:', err.message);
      }
    } else {
      // Club team - extract or map colors from team data
      // API-Football doesn't provide kit colors directly, so we'll need a mapping
      // For now, return null and we'll map them in the frontend
      colors = footballApi.extractTeamColors(teamData) || null;
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
    const colors = footballApi.extractTeamColors(teamData);
    
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
    
    // Get country flag
    let flag = null;
    try {
      const countriesData = await footballApi.getCountries();
      if (countriesData.response) {
        const country = countriesData.response.find(c => 
          c.name.toLowerCase() === (team.country || '').toLowerCase() ||
          c.name.toLowerCase().includes((team.country || '').toLowerCase())
        );
        if (country) {
          flag = country.flag;
        }
      }
    } catch (err) {
      console.warn('Could not fetch country flag:', err.message);
    }
    
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
        // National team - get country flag
        try {
          const countriesData = await footballApi.getCountries();
          if (countriesData.response) {
            const country = countriesData.response.find(c => 
              c.name.toLowerCase() === (team.country || '').toLowerCase() ||
              c.name.toLowerCase().includes((team.country || '').toLowerCase())
            );
            if (country) {
              flag = country.flag;
            }
          }
        } catch (err) {
          // Ignore flag fetch errors
        }
      } else {
        // Club team - extract colors
        colors = footballApi.extractTeamColors(teamData) || null;
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
