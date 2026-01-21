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
    // ⚠️ TELİF HAKKI: Kulüp armaları ASLA döndürülmez, sadece renkler kullanılır
    const enhancedTeam = {
      ...team,
      logo: null, // ⚠️ TELİF HAKKI: Kulüp armaları telifli - ASLA döndürülmez (sadece renkler kullanılır)
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
      console.log(`❌ No teams found for query: "${query}"`);
      return res.json({
        success: true,
        data: [],
        cached: data.cached || false,
      });
    }
    
    console.log(`✅ Found ${data.response.length} teams from API`);
    
    // Enhance each team with colors and flags (with timeout to avoid slow responses)
    const enhancedTeams = await Promise.all(
      data.response.slice(0, 50).map(async (teamData) => { // Limit to first 50 teams
        try {
          const team = teamData.team || teamData;
          let colors = null;
          let flag = null;
          
          // Only enhance if team has basic data
          if (!team || !team.id) {
            return null;
          }
          
          if (team.national) {
            // National team - get country flag from API (fast)
            flag = await Promise.race([
              footballApi.getTeamFlag(team.country),
              new Promise((resolve) => setTimeout(() => resolve(null), 2000)) // 2s timeout
            ]);
          } else {
            // Club team - extract colors from logo (can be slow, so timeout)
            colors = await Promise.race([
              footballApi.getTeamColors(team.id, teamData),
              new Promise((resolve) => setTimeout(() => resolve(null), 3000)) // 3s timeout
            ]);
          }
          
          return {
            ...team,
            colors,
            flag,
            type: team.national ? 'national' : 'club',
          };
        } catch (error) {
          console.warn(`⚠️ Error enhancing team ${teamData.team?.id}:`, error.message);
          // Return basic team data even if enhancement fails
          const team = teamData.team || teamData;
          return {
            ...team,
            colors: null,
            flag: null,
            type: team.national ? 'national' : 'club',
          };
        }
      })
    );
    
    // Filter out null values
    const validTeams = enhancedTeams.filter(team => team !== null);
    
    console.log(`✅ Returning ${validTeams.length} enhanced teams`);
    
    res.json({
      success: true,
      data: validTeams,
      cached: data.cached || false,
    });
  } catch (error) {
    console.error('❌ Error in team search:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
