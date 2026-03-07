// Teams Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const { calculateRatingFromStats, getDefaultRatingByPosition } = require('../utils/playerRatingFromStats');
const { getDisplayRatingsMap } = require('../utils/displayRating');
const { supabase } = require('../config/supabase');

if (!supabase) {
  console.warn('⚠️ Supabase not configured in routes/teams.js - some features will be disabled');
}

const { selectActiveCoach } = require('../utils/selectActiveCoach');

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

// POST /api/teams/coaches/refresh - Stale coach'ları API'den çekip DB güncelle
// teamIds: number[] - max 5 (rate limit)
router.post('/coaches/refresh', async (req, res) => {
  try {
    const { teamIds } = req.body;
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ success: false, error: 'teamIds required' });
    }
    const ids = teamIds.slice(0, 5);
    const results = {};
    for (const teamId of ids) {
      try {
        const data = await footballApi.getTeamCoach(teamId);
        const selected = data.response?.length ? selectActiveCoach(data.response, teamId) : null;
        if (selected && supabase) {
          await supabase.from('static_teams').update({
            coach: selected.name,
            coach_api_id: selected.id,
            last_updated: new Date().toISOString(),
          }).eq('api_football_id', teamId);
          results[teamId] = { coach: selected.name, updated: true };
        } else {
          results[teamId] = { coach: null, updated: false };
        }
      } catch (e) {
        results[teamId] = { coach: null, updated: false, error: e.message };
      }
    }
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/teams/coaches/bulk - Get coaches for multiple teams at once
// ✅ Toplu coach çekme - maç listesi için optimize edilmiş
// ⚠️ Bu route :id route'larından ÖNCE tanımlanmalı (Express routing order)
router.post('/coaches/bulk', async (req, res) => {
  try {
    const { teamIds } = req.body;
    
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'teamIds array is required',
      });
    }
    
    // Max 20 takım sınırı (API rate limit koruma)
    const limitedIds = teamIds.slice(0, 20);
    console.log(`👔 Bulk coach fetch for ${limitedIds.length} teams`);
    
    const results = {};
    
    if (supabase) {
      // Veritabanından toplu çek
      const { data: teamsData, error: dbError } = await supabase
        .from('static_teams')
        .select('api_football_id, coach, coach_api_id, name, last_updated')
        .in('api_football_id', limitedIds);
      
      if (!dbError && teamsData) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        for (const team of teamsData) {
          const lastUpdated = team.last_updated ? new Date(team.last_updated) : null;
          const isRecent = lastUpdated && lastUpdated > sevenDaysAgo;
          
          results[team.api_football_id] = {
            coach: team.coach || null,
            coachId: team.coach_api_id || null,
            teamName: team.name,
            source: 'database',
            isStale: !isRecent,
          };
        }
        
        console.log(`✅ DB'den ${teamsData.length} takımın coach bilgisi alındı`);
      }
    }
    
    // DB'de bulunmayanlar için null döndür (API'den çekmiyoruz - rate limit)
    for (const id of limitedIds) {
      if (!results[id]) {
        results[id] = {
          coach: null,
          coachId: null,
          teamName: null,
          source: 'not_found',
          isStale: true,
        };
      }
    }
    
    res.json({
      success: true,
      data: results,
      count: Object.keys(results).length,
    });
  } catch (error) {
    console.error('❌ Error in bulk coach fetch:', error.message);
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
// ✅ DB-first yaklaşımı: Önce veritabanına bak, yoksa/eskiyse API'den çek ve DB'ye kaydet
router.get('/:id/coach', async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id, 10);
    const forceRefresh = req.query.refresh === 'true';
    
    console.log(`👔 Fetching coach for team ${id}${forceRefresh ? ' (force refresh)' : ''}`);
    
    // 1. Önce veritabanından kontrol et (güncel mi?)
    if (supabase && !forceRefresh) {
      const { data: teamData, error: dbError } = await supabase
        .from('static_teams')
        .select('coach, coach_api_id, last_updated, name')
        .eq('api_football_id', teamId)
        .single();
      
      if (!dbError && teamData && teamData.coach) {
        // Coach verisi var, güncelliğini kontrol et (7 gün içinde güncellenmişse kullan)
        const lastUpdated = teamData.last_updated ? new Date(teamData.last_updated) : null;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (lastUpdated && lastUpdated > sevenDaysAgo) {
          console.log(`✅ DB'den coach bulundu (${teamData.coach}) - güncel veri`);
          return res.json({
            success: true,
            data: {
              teamId: id,
              coach: {
                id: teamData.coach_api_id || null,
                name: teamData.coach,
              },
              source: 'database',
            },
            cached: true,
          });
        } else {
          console.log(`⚠️ DB'deki coach verisi eski (${lastUpdated?.toISOString()}), API'den güncellenecek`);
        }
      }
    }
    
    // 2. API'den çek
    const data = await footballApi.getTeamCoach(teamId);
    
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
    
    // Güncel coach seç (birden fazla end=null varsa en son başlayan)
    const selected = selectActiveCoach(data.response, teamId);
    const apiCoach = selected && data.response.find((c) => c.id === selected.id);
    
    if (!selected || !apiCoach) {
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
    
    console.log(`✅ API'den coach bulundu: ${selected.name}`);
    
    // 3. Veritabanına kaydet (güncel tutmak için)
    if (supabase && selected.name) {
      const { error: updateError } = await supabase
        .from('static_teams')
        .update({ 
          coach: selected.name,
          coach_api_id: selected.id,
          last_updated: new Date().toISOString()
        })
        .eq('api_football_id', teamId);
      
      if (updateError) {
        console.warn(`⚠️ Coach DB güncelleme hatası (team ${teamId}):`, updateError.message);
      } else {
        console.log(`💾 Coach DB'ye kaydedildi: ${selected.name}`);
      }
    }
    
    res.json({
      success: true,
      data: {
        teamId: id,
        coach: {
          id: apiCoach.id,
          name: selected.name,
          firstName: apiCoach.firstname,
          lastName: apiCoach.lastname,
          age: apiCoach.age,
          nationality: apiCoach.nationality,
          // ⚠️ TELİF: Fotoğraflar telifli olabilir
          photo: null,
        },
        source: 'api',
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
// ?refresh=1 veya ?refresh=true → Kadroyu API'den zorla yenile (eski oyuncular sorunu için)
router.get('/:id/squad', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const { season, refresh } = req.query;
    const currentSeason = parseInt(season, 10) || 2025;
    const forceRefresh = refresh === '1' || refresh === 'true';

    if (!supabase) {
      // 🧪 Supabase yoksa bile mock test kadroları döndür
      const mockFallback = getMockTestSquad(teamId);
      if (mockFallback) {
        console.log(`🧪 Returning mock squad for team ${teamId} (no supabase)`);
        return res.json(mockFallback);
      }
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
      });
    }

    let { data: row, error } = await supabase
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

    // Kadro DB'de yoksa veya ?refresh=1 ile zorla yenileme istenirse API'den çek
    const needsSync = !row || !row.players || (Array.isArray(row.players) && row.players.length === 0) || forceRefresh;
    if (needsSync) {
      console.log(`🔄 Squad ${forceRefresh ? 'refresh' : 'missing'} for team ${teamId}, triggering on-demand sync...`);
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
            const playerIds = newRow.players.map((p) => p.id).filter(Boolean);
            const apiMap = newRow.players.reduce((acc, p) => { acc[p.id] = p.rating; return acc; }, {});
            const displayMap = await getDisplayRatingsMap(playerIds, apiMap, supabase);
            const playersWithDisplayRating = newRow.players.map((p) => {
              let r = displayMap.get(p.id) ?? p.rating;
              if (r === 65 && (p.position || p.pos)) r = getDefaultRatingByPosition(p.position || p.pos);
              return { ...p, rating: r };
            });
            return res.json({
              success: true,
              data: {
                team: newRow.team_data || { id: newRow.team_id, name: newRow.team_name },
                players: playersWithDisplayRating,
              },
              cached: false,
            });
          }
        }
      } catch (syncErr) {
        console.warn('⚠️ On-demand squad sync failed:', syncErr.message);
      }

      // 🧪 MOCK TEST: Mock takımlar için kadro verisi döndür
      const mockSquads = getMockTestSquad(teamId);
      if (mockSquads) {
        console.log(`🧪 Returning mock squad for team ${teamId}`);
        return res.json(mockSquads);
      }

      return res.status(404).json({
        success: false,
        error: 'Squad not found for this team. Kadro henüz senkronize edilmedi veya API\'de veri yok.',
      });
    }

    const players = row.players || [];
    const playerIds = players.map((p) => p.id).filter(Boolean);
    const apiMap = players.reduce((acc, p) => { acc[p.id] = p.rating; return acc; }, {});
    const displayMap = await getDisplayRatingsMap(playerIds, apiMap, supabase);
    const playersWithDisplayRating = players.map((p) => {
      let r = displayMap.get(p.id) ?? p.rating;
      if (r === 65 && (p.position || p.pos)) r = getDefaultRatingByPosition(p.position || p.pos);
      return { ...p, rating: r };
    });

    res.json({
      success: true,
      data: {
        team: row.team_data || { id: row.team_id, name: row.team_name },
        players: playersWithDisplayRating,
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

// 🧪 MOCK TEST: Takım kadroları (test bitince silinebilir)
function getMockTestSquad(teamId) {
  const squads = {
    // Galatasaray
    645: {
      success: true,
      data: {
        team: { id: 645, name: 'Galatasaray' },
        players: [
          { id: 50001, name: 'F. Muslera', number: 1, age: 37, position: 'Goalkeeper', photo: null },
          { id: 50002, name: 'S. Boey', number: 20, age: 24, position: 'Defender', photo: null },
          { id: 50003, name: 'D. Nelsson', number: 4, age: 25, position: 'Defender', photo: null },
          { id: 50004, name: 'A. Bardakcı', number: 42, age: 29, position: 'Defender', photo: null },
          { id: 50005, name: 'A. Kurzawa', number: 12, age: 31, position: 'Defender', photo: null },
          { id: 50006, name: 'L. Torreira', number: 34, age: 28, position: 'Midfielder', photo: null },
          { id: 50007, name: 'K. Aktürkoğlu', number: 7, age: 25, position: 'Midfielder', photo: null },
          { id: 50008, name: 'D. Mertens', number: 14, age: 37, position: 'Midfielder', photo: null },
          { id: 50009, name: 'B. Yılmaz', number: 17, age: 39, position: 'Attacker', photo: null },
          { id: 50010, name: 'M. Icardi', number: 9, age: 31, position: 'Attacker', photo: null },
          { id: 50011, name: 'V. Osimhen', number: 45, age: 26, position: 'Attacker', photo: null },
          { id: 50012, name: 'O. Bayram', number: 88, age: 25, position: 'Goalkeeper', photo: null },
          { id: 50013, name: 'K. Seri', number: 6, age: 33, position: 'Midfielder', photo: null },
          { id: 50014, name: 'Y. Bakasetas', number: 10, age: 31, position: 'Midfielder', photo: null },
          { id: 50015, name: 'E. Kılınç', number: 11, age: 29, position: 'Attacker', photo: null },
          { id: 50016, name: 'H. Dervişoğlu', number: 99, age: 25, position: 'Attacker', photo: null },
        ],
      },
      cached: false,
      source: 'mock-test',
    },
    // Fenerbahçe
    611: {
      success: true,
      data: {
        team: { id: 611, name: 'Fenerbahçe' },
        players: [
          { id: 50101, name: 'D. Livakovic', number: 1, age: 29, position: 'Goalkeeper', photo: null },
          { id: 50102, name: 'B. Osayi-Samuel', number: 2, age: 26, position: 'Defender', photo: null },
          { id: 50103, name: 'A. Djiku', number: 4, age: 29, position: 'Defender', photo: null },
          { id: 50104, name: 'Ç. Söyüncü', number: 3, age: 28, position: 'Defender', photo: null },
          { id: 50105, name: 'F. Kadıoğlu', number: 5, age: 24, position: 'Defender', photo: null },
          { id: 50106, name: 'İ. Kahveci', number: 6, age: 28, position: 'Midfielder', photo: null },
          { id: 50107, name: 'F. Amrabat', number: 8, age: 28, position: 'Midfielder', photo: null },
          { id: 50108, name: 'S. Szymanski', number: 10, age: 25, position: 'Midfielder', photo: null },
          { id: 50109, name: 'D. Tadic', number: 11, age: 35, position: 'Attacker', photo: null },
          { id: 50110, name: 'E. Dzeko', number: 9, age: 38, position: 'Attacker', photo: null },
          { id: 50111, name: 'Ç. Ünder', number: 17, age: 27, position: 'Attacker', photo: null },
          { id: 50112, name: 'İ. Bayındır', number: 12, age: 26, position: 'Goalkeeper', photo: null },
          { id: 50113, name: 'J. Oosterwolde', number: 23, age: 24, position: 'Defender', photo: null },
          { id: 50114, name: 'M. Crespo', number: 7, age: 25, position: 'Midfielder', photo: null },
          { id: 50115, name: 'R. Batshuayi', number: 20, age: 30, position: 'Attacker', photo: null },
          { id: 50116, name: 'E. Valencia', number: 18, age: 28, position: 'Attacker', photo: null },
        ],
      },
      cached: false,
      source: 'mock-test',
    },
    // Real Madrid
    541: {
      success: true,
      data: {
        team: { id: 541, name: 'Real Madrid' },
        players: [
          { id: 50201, name: 'T. Courtois', number: 1, age: 32, position: 'Goalkeeper', photo: null },
          { id: 50202, name: 'D. Carvajal', number: 2, age: 32, position: 'Defender', photo: null },
          { id: 50203, name: 'A. Rüdiger', number: 22, age: 31, position: 'Defender', photo: null },
          { id: 50204, name: 'D. Alaba', number: 4, age: 31, position: 'Defender', photo: null },
          { id: 50205, name: 'F. Mendy', number: 23, age: 29, position: 'Defender', photo: null },
          { id: 50206, name: 'T. Kroos', number: 8, age: 34, position: 'Midfielder', photo: null },
          { id: 50207, name: 'L. Modrić', number: 10, age: 38, position: 'Midfielder', photo: null },
          { id: 50208, name: 'J. Bellingham', number: 5, age: 21, position: 'Midfielder', photo: null },
          { id: 50209, name: 'Vinícius Jr.', number: 7, age: 24, position: 'Attacker', photo: null },
          { id: 50210, name: 'K. Mbappé', number: 9, age: 27, position: 'Attacker', photo: null },
          { id: 50211, name: 'Rodrygo', number: 11, age: 23, position: 'Attacker', photo: null },
          { id: 50212, name: 'A. Lunin', number: 13, age: 25, position: 'Goalkeeper', photo: null },
          { id: 50213, name: 'E. Militão', number: 3, age: 26, position: 'Defender', photo: null },
          { id: 50214, name: 'E. Camavinga', number: 12, age: 21, position: 'Midfielder', photo: null },
          { id: 50215, name: 'F. Valverde', number: 15, age: 26, position: 'Midfielder', photo: null },
        ],
      },
      cached: false,
      source: 'mock-test',
    },
    // Barcelona
    529: {
      success: true,
      data: {
        team: { id: 529, name: 'Barcelona' },
        players: [
          { id: 50301, name: 'M. ter Stegen', number: 1, age: 32, position: 'Goalkeeper', photo: null },
          { id: 50302, name: 'J. Cancelo', number: 2, age: 30, position: 'Defender', photo: null },
          { id: 50303, name: 'R. Araújo', number: 4, age: 25, position: 'Defender', photo: null },
          { id: 50304, name: 'A. Christensen', number: 15, age: 28, position: 'Defender', photo: null },
          { id: 50305, name: 'A. Baldé', number: 3, age: 21, position: 'Defender', photo: null },
          { id: 50306, name: 'Pedri', number: 8, age: 21, position: 'Midfielder', photo: null },
          { id: 50307, name: 'F. de Jong', number: 21, age: 27, position: 'Midfielder', photo: null },
          { id: 50308, name: 'Gavi', number: 6, age: 20, position: 'Midfielder', photo: null },
          { id: 50309, name: 'L. Yamal', number: 19, age: 17, position: 'Attacker', photo: null },
          { id: 50310, name: 'R. Lewandowski', number: 9, age: 36, position: 'Attacker', photo: null },
          { id: 50311, name: 'Raphinha', number: 11, age: 27, position: 'Attacker', photo: null },
          { id: 50312, name: 'İ. Peña', number: 13, age: 25, position: 'Goalkeeper', photo: null },
          { id: 50313, name: 'J. Koundé', number: 23, age: 25, position: 'Defender', photo: null },
          { id: 50314, name: 'İ. Gündoğan', number: 22, age: 33, position: 'Midfielder', photo: null },
          { id: 50315, name: 'F. Torres', number: 17, age: 24, position: 'Midfielder', photo: null },
          { id: 50316, name: 'A. Fati', number: 10, age: 22, position: 'Attacker', photo: null },
        ],
      },
      cached: false,
      source: 'mock-test',
    },
  };
  return squads[teamId] || null;
}

// ✅ GET /api/teams/:id/injuries - Takım sakatlık ve ceza listesi
router.get('/:id/injuries', async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);
    const { season = 2025 } = req.query;
    
    console.log(`🏥 [INJURIES] Fetching injuries for team ${teamId}`);
    
    const injuries = await footballApi.getTeamInjuries(teamId, parseInt(season));
    
    // API response formatı: [{ player: { id, name, photo, type, reason }, team: {...}, fixture: {...}, league: {...} }]
    const injuryList = injuries.map(inj => ({
      playerId: inj.player?.id,
      playerName: inj.player?.name,
      playerPhoto: inj.player?.photo,
      type: inj.player?.type || 'Unknown', // "Missing Fixture", "Questionable", "Injury", "Suspension"
      reason: inj.player?.reason || 'Unknown',
      teamId: inj.team?.id,
      teamName: inj.team?.name,
    }));
    
    res.json({
      success: true,
      data: injuryList,
      count: injuryList.length,
    });
  } catch (error) {
    console.error(`❌ [INJURIES] Error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
});

// ✅ POST /api/teams/:id/sync - Favori takım eklendiğinde hemen sync tetikle
// Bu endpoint kullanıcı bir takımı favorilere eklediğinde çağrılır
// Kadro + Coach + Takım bilgileri hemen güncellenir
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);
    const { teamName } = req.body;
    
    console.log(`🔄 [FAVORITE SYNC] Team ${teamName || teamId} added to favorites, syncing...`);
    
    const squadSyncService = require('../services/squadSyncService');
    const result = await squadSyncService.syncSingleTeamNow(teamId, teamName);
    
    if (result.ok) {
      res.json({
        success: true,
        message: `Team ${teamName || teamId} synced successfully`,
        data: {
          playerCount: result.count,
          coachUpdated: result.coachUpdated || false,
          colorsUpdated: result.colorsUpdated || false,
        },
      });
    } else {
      res.json({
        success: false,
        message: `Sync failed: ${result.reason}`,
        data: null,
      });
    }
  } catch (error) {
    console.error(`❌ [FAVORITE SYNC] Error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
