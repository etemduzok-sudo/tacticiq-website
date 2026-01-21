// =====================================================
// Static Teams Routes
// =====================================================
// Hızlı takım arama için statik DB kullanır
// API-Football'a direkt bağlanmaz (rate limit korunur)
// =====================================================

const express = require('express');
const router = express.Router();
const staticTeamsService = require('../services/staticTeamsService');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Takım ara (Hızlı - Static DB'den)
 * GET /api/static-teams/search?q=query&type=club|national
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, type } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Query must be at least 2 characters',
      });
    }
    
    const teams = await staticTeamsService.searchTeams(query, type || null);
    
    // Format response
    // ⚠️ TELİF HAKKI: Kulüp armaları (logo) ASLA döndürülmez, sadece renkler kullanılır
    // ✅ Milli takım bayrakları (flag) kullanılabilir
    const formattedTeams = teams.map(team => ({
      id: team.api_football_id,
      name: team.name,
      country: team.country,
      league: team.league || null,
      type: team.team_type,
      colors: team.colors || [team.colors_primary, team.colors_secondary],
      logo: null, // ⚠️ Kulüp armaları telifli - ASLA döndürülmez (sadece renkler kullanılır)
      flag: team.team_type === 'national' ? (team.flag_url || null) : null, // ✅ Sadece milli takımlar için bayrak
      coach: team.coach || null,
    }));
    
    res.json({
      success: true,
      data: formattedTeams,
      source: 'static_db',
      count: formattedTeams.length,
    });
  } catch (error) {
    console.error('Static teams search error:', error);
    
    // Eğer tablo/view yoksa boş sonuç döndür (henüz sync yapılmamış olabilir)
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.warn('⚠️  static_teams table/view does not exist. Returning empty results.');
      return res.json({
        success: true,
        data: [],
        source: 'static_db',
        count: 0,
        message: 'Static teams database not initialized yet. Please run sync first.',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to search teams',
      message: error.message,
    });
  }
});

/**
 * Tüm milli takımları getir (Hızlı)
 * GET /api/static-teams/national
 */
router.get('/national', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM v_national_teams LIMIT 200');
    
    const formatted = result.rows.map(team => ({
      id: team.api_football_id,
      name: team.name,
      country: team.country,
      colors: team.colors || [team.colors_primary, team.colors_secondary],
      flag: team.flag_url, // ✅ Milli takım bayrakları kullanılabilir
      coach: team.coach || null,
    }));
    
    res.json({
      success: true,
      data: formatted,
      source: 'static_db',
      count: formatted.length,
    });
  } catch (error) {
    console.error('Get national teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get national teams',
    });
  }
});

/**
 * Tüm kulüp takımlarını getir (Hızlı - Ülkeye göre)
 * GET /api/static-teams/clubs?country=Türkiye
 */
router.get('/clubs', async (req, res) => {
  try {
    const { country } = req.query;
    
    let sql = 'SELECT * FROM v_club_teams';
    const params = [];
    
    if (country) {
      sql += ' WHERE country = $1';
      params.push(country);
    }
    
    sql += ' ORDER BY country, league, name LIMIT 500';
    
    const result = await pool.query(sql, params);
    
    const formatted = result.rows.map(team => ({
      id: team.api_football_id,
      name: team.name,
      country: team.country,
      league: team.league,
      colors: team.colors || [team.colors_primary, team.colors_secondary],
      logo: null, // ⚠️ Kulüp armaları telifli - ASLA döndürülmez (sadece renkler kullanılır)
      coach: team.coach || null,
    }));
    
    res.json({
      success: true,
      data: formatted,
      source: 'static_db',
      count: formatted.length,
    });
  } catch (error) {
    console.error('Get club teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get club teams',
    });
  }
});

/**
 * Full sync başlat (Admin only - Haftada 1 kez)
 * POST /api/static-teams/sync
 */
router.post('/sync', async (req, res) => {
  try {
    // Admin kontrolü yapılabilir
    const { admin_key } = req.body;
    
    if (admin_key !== process.env.ADMIN_SYNC_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }
    
    // Async olarak başlat (hızlı response)
    staticTeamsService.syncAllTeams().catch(error => {
      console.error('Background sync error:', error);
    });
    
    res.json({
      success: true,
      message: 'Sync started in background',
    });
  } catch (error) {
    console.error('Start sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start sync',
    });
  }
});

module.exports = router;
