// Teams Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const { calculateRatingFromStats } = require('../utils/playerRatingFromStats');
const { supabase } = require('../config/supabase');

if (!supabase) {
  console.warn('⚠️ Supabase not configured in routes/teams.js - some features will be disabled');
}

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

// GET /api/teams/:id/coach - Get team coach (teknik direktör)
router.get('/:id/coach', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👔 Fetching coach for team ${id}`);
    
    const data = await footballApi.getTeamCoach(id);
    
    if (!data.response || data.response.length === 0) {
      return res.json({
        success: true,
        data: {
          teamId: id,
          coach: null,
          message: 'No coach data available',
        },
        cached: data.cached || false,
      });
    }
    
    // Get the current coach (most recent)
    const coaches = data.response;
    const currentCoach = coaches.find(c => c.career && c.career.some(car => car.team?.id == id && !car.end)) 
      || coaches[0];
    
    console.log(`✅ Found coach for team ${id}: ${currentCoach.name}`);
    
    res.json({
      success: true,
      data: {
        teamId: id,
        coach: {
          id: currentCoach.id,
          name: currentCoach.name,
          firstName: currentCoach.firstname,
          lastName: currentCoach.lastname,
          age: currentCoach.age,
          nationality: currentCoach.nationality,
          // ⚠️ TELİF: Fotoğraflar telifli olabilir
          photo: null,
        },
      },
      cached: data.cached || false,
    });
  } catch (error) {
    console.error(`❌ Error fetching coach for team ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/teams/:id/squad - Get team squad from DB; yoksa tek seferlik API'den çek ve kaydet
router.get('/:id/squad', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { season } = req.query;
    const currentSeason = parseInt(season, 10) || 2025;

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
      });
    }

    const { data: row, error } = await supabase
      .from('team_squads')
      .select('team_id, team_name, team_data, players, updated_at')
      .eq('team_id', teamId)
      .eq('season', currentSeason)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ team_squads read error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Kadro DB'de yoksa tek seferlik API'den çek ve kaydet (on-demand sync)
    if (!row || !row.players || (Array.isArray(row.players) && row.players.length === 0)) {
      console.log(`🔄 Squad missing for team ${teamId}, triggering on-demand sync...`);
      try {
        const squadSyncService = require('../services/squadSyncService');
        const result = await squadSyncService.syncOneTeamSquad(teamId, null);
        if (result.ok) {
          // Tekrar DB'den oku
          const { data: newRow, error: newError } = await supabase
            .from('team_squads')
            .select('team_id, team_name, team_data, players, updated_at')
            .eq('team_id', teamId)
            .eq('season', currentSeason)
            .maybeSingle();

          if (!newError && newRow?.players?.length > 0) {
            return res.json({
              success: true,
              data: {
                team: newRow.team_data || { id: newRow.team_id, name: newRow.team_name },
                players: newRow.players,
              },
              cached: false,
            });
          }
        }
      } catch (syncErr) {
        console.warn('⚠️ On-demand squad sync failed:', syncErr.message);
      }

      return res.status(404).json({
        success: false,
        error: 'Squad not found for this team. Kadro henüz senkronize edilmedi veya API\'de veri yok.',
      });
    }

    res.json({
      success: true,
      data: {
        team: row.team_data || { id: row.team_id, name: row.team_name },
        players: row.players,
      },
      cached: true,
    });
  } catch (error) {
    console.error(`❌ Error fetching squad for team ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ Helper: Arka planda oyuncu rating'lerini çek ve DB'ye kaydet
async function fetchAndSavePlayerRatings(playerIds, allPlayers, teamId, season) {
  console.log(`🔄 Background: Fetching ratings for ${playerIds.length} players...`);
  
  // Rate limiting için batch'ler halinde işle (her batch'te max 3 oyuncu)
  const batchSize = 3;
  for (let i = 0; i < playerIds.length; i += batchSize) {
    const batch = playerIds.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (playerId) => {
      try {
        const player = allPlayers.find(p => p.id === playerId);
        if (!player) return;
        
        // API'den oyuncu bilgilerini çek (timeout ile)
        const apiData = await Promise.race([
          footballApi.getPlayerInfo(playerId, season),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]).catch(() => null);
        
        if (!apiData || !apiData.response || !apiData.response[0]) return;
        
        const apiPlayer = apiData.response[0];
        const playerData = apiPlayer.player || {};
        const statistics = apiPlayer.statistics || [];
        const latestStats = statistics.length > 0 ? statistics[0] : null;
        
        const rating = (latestStats && latestStats.games)
          ? calculateRatingFromStats(latestStats, playerData)
          : 75;
        
        // DB'ye kaydet
        await supabase
          .from('players')
          .upsert({
            id: playerId,
            name: playerData.name || player.name,
            firstname: playerData.firstname || null,
            lastname: playerData.lastname || null,
            age: playerData.age || player.age || null,
            nationality: playerData.nationality || player.nationality || null,
            position: playerData.position || player.position || null,
            rating: Math.round(rating),
            team_id: teamId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        console.log(`✅ Saved player ${playerId} (${playerData.name || player.name}) with rating ${Math.round(rating)}`);
      } catch (err) {
        console.warn(`⚠️ Failed to fetch/save player ${playerId}:`, err.message);
      }
    }));
    
    // Batch'ler arasında delay (rate limiting)
    if (i + batchSize < playerIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`✅ Background: Completed fetching ratings for ${playerIds.length} players`);
}

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
