// Teams Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const { calculateRatingFromStats } = require('../utils/playerRatingFromStats');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

// GET /api/teams/:id/squad - Get team squad (players)
router.get('/:id/squad', async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;
    const currentSeason = season || 2025;
    console.log(`👥 Fetching squad for team ${id}, season ${currentSeason}`);
    
    // 1. API-Football'dan takım kadrosunu çek
    const data = await footballApi.getTeamSquad(id, currentSeason);
    
    if (!data.response || data.response.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Squad not found for this team',
      });
    }
    
    // Extract players from response
    const squadData = data.response[0];
    const players = squadData.players || [];
    
    // 2. DB'den tüm oyuncuların rating'lerini tek seferde çek
    const playerIds = players.map(p => p.id);
    let dbPlayersMap = {};
    
    try {
      const { data: dbPlayers, error } = await supabase
        .from('players')
        .select('id, rating, age, nationality, position')
        .in('id', playerIds);
      
      if (!error && dbPlayers) {
        dbPlayersMap = dbPlayers.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    } catch (dbError) {
      console.warn('⚠️ DB batch query failed:', dbError.message);
    }
    
    // 3. Oyuncuları zenginleştir - DB'de varsa kullan, yoksa pozisyon bazlı default
    const enhancedPlayers = players.map((player) => {
      const dbPlayer = dbPlayersMap[player.id];
      let rating = 75; // Default rating
      
      if (dbPlayer && dbPlayer.rating) {
        rating = dbPlayer.rating;
      } else {
        // Pozisyon bazlı default rating
        const pos = (player.position || '').toLowerCase();
        if (pos.includes('goalkeeper')) rating = 78;
        else if (pos.includes('defender')) rating = 75;
        else if (pos.includes('midfielder')) rating = 76;
        else if (pos.includes('attacker')) rating = 77;
      }
      
      return {
        id: player.id,
        name: player.name,
        age: player.age || dbPlayer?.age || null,
        number: player.number,
        position: player.position,
        nationality: player.nationality || dbPlayer?.nationality || null,
        rating: Math.round(rating), // ✅ Gerçek rating
        photo: null, // ⚠️ TELİF: Oyuncu fotoğrafları telifli - kullanmıyoruz
      };
    });
    
    // 4. Arka planda DB'de olmayan oyuncuları API'den çekip kaydet (rate limit için)
    const missingPlayerIds = playerIds.filter(id => !dbPlayersMap[id]);
    if (missingPlayerIds.length > 0) {
      // Async olarak arka planda çalıştır - response'u bekletme
      fetchAndSavePlayerRatings(missingPlayerIds, players, id, currentSeason).catch(err => {
        console.warn('⚠️ Background player fetch failed:', err.message);
      });
    }
    
    console.log(`✅ Found ${enhancedPlayers.length} players for team ${id} (${Object.keys(dbPlayersMap).length} from DB)`);
    
    res.json({
      success: true,
      data: {
        team: squadData.team,
        players: enhancedPlayers,
      },
      cached: data.cached || false,
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
