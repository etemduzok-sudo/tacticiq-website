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

// Fallback takım listesi (DB yoksa kullanılır)
const FALLBACK_NATIONAL_TEAMS = [
  { id: 1, name: 'Türkiye', country: 'Turkey', type: 'national', colors: ['#E30A17', '#FFFFFF'], flag: 'https://flagcdn.com/w80/tr.png' },
  { id: 2, name: 'Germany', country: 'Germany', type: 'national', colors: ['#000000', '#DD0000', '#FFCC00'], flag: 'https://flagcdn.com/w80/de.png' },
  { id: 3, name: 'France', country: 'France', type: 'national', colors: ['#002395', '#FFFFFF', '#ED2939'], flag: 'https://flagcdn.com/w80/fr.png' },
  { id: 4, name: 'England', country: 'England', type: 'national', colors: ['#FFFFFF', '#CF081F'], flag: 'https://flagcdn.com/w80/gb-eng.png' },
  { id: 5, name: 'Spain', country: 'Spain', type: 'national', colors: ['#AA151B', '#F1BF00'], flag: 'https://flagcdn.com/w80/es.png' },
  { id: 6, name: 'Italy', country: 'Italy', type: 'national', colors: ['#009246', '#FFFFFF', '#CE2B37'], flag: 'https://flagcdn.com/w80/it.png' },
  { id: 7, name: 'Brazil', country: 'Brazil', type: 'national', colors: ['#009C3B', '#FFDF00'], flag: 'https://flagcdn.com/w80/br.png' },
  { id: 8, name: 'Argentina', country: 'Argentina', type: 'national', colors: ['#74ACDF', '#FFFFFF'], flag: 'https://flagcdn.com/w80/ar.png' },
  { id: 9, name: 'Portugal', country: 'Portugal', type: 'national', colors: ['#006600', '#FF0000'], flag: 'https://flagcdn.com/w80/pt.png' },
  { id: 10, name: 'Netherlands', country: 'Netherlands', type: 'national', colors: ['#FF6600', '#FFFFFF'], flag: 'https://flagcdn.com/w80/nl.png' },
];

const FALLBACK_CLUB_TEAMS = [
  { id: 611, name: 'Fenerbahçe', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFED00', '#00205B'], logo: null },
  { id: 645, name: 'Galatasaray', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFD700'], logo: null },
  { id: 549, name: 'Beşiktaş', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#000000', '#FFFFFF'], logo: null },
  { id: 551, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#632134', '#00BFFF'], logo: null },
  { id: 50, name: 'Manchester City', country: 'England', league: 'Premier League', type: 'club', colors: ['#6CABDD', '#1C2C5B'], logo: null },
  { id: 33, name: 'Manchester United', country: 'England', league: 'Premier League', type: 'club', colors: ['#DA291C', '#FBE122'], logo: null },
  { id: 40, name: 'Liverpool', country: 'England', league: 'Premier League', type: 'club', colors: ['#C8102E', '#00B2A9'], logo: null },
  { id: 541, name: 'Real Madrid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#00529F'], logo: null },
  { id: 529, name: 'Barcelona', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#004D98', '#A50044'], logo: null },
  { id: 157, name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#DC052D', '#FFFFFF'], logo: null },
];

/**
 * Takım ara (Hızlı - Static DB'den, fallback ile)
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
    const errorMessage = error.message || String(error) || 'Unknown error';
    console.error('Static teams search error:', errorMessage);
    
    // Static teams DB henüz kurulmamış olabilir - fallback listesini kullan
    console.warn('⚠️  static_teams error, using fallback list. Error:', errorMessage);
    
    // req.query'den değerleri al (catch bloğunda type/query tanımsız olabilir)
    const { q: queryParam, type: typeParam } = req.query;
    
    const fallbackTeams = typeParam === 'national' ? FALLBACK_NATIONAL_TEAMS : 
                          typeParam === 'club' ? FALLBACK_CLUB_TEAMS : 
                          [...FALLBACK_NATIONAL_TEAMS, ...FALLBACK_CLUB_TEAMS];
    
    // Query ile filtrele
    const filteredTeams = queryParam ? fallbackTeams.filter(team => 
      team.name.toLowerCase().includes(queryParam.toLowerCase()) ||
      team.country.toLowerCase().includes(queryParam.toLowerCase())
    ) : fallbackTeams;
    
    return res.json({
      success: true,
      data: filteredTeams,
      source: 'fallback',
      count: filteredTeams.length,
      message: 'Using fallback team list. Database not available.',
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
    // Fallback kullan
    return res.json({
      success: true,
      data: FALLBACK_NATIONAL_TEAMS,
      source: 'fallback',
      count: FALLBACK_NATIONAL_TEAMS.length,
      message: 'Using fallback team list. Database not available.',
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
    // Fallback kullan
    const { country } = req.query;
    let filtered = FALLBACK_CLUB_TEAMS;
    if (country) {
      filtered = FALLBACK_CLUB_TEAMS.filter(t => t.country.toLowerCase().includes(country.toLowerCase()));
    }
    return res.json({
      success: true,
      data: filtered,
      source: 'fallback',
      count: filtered.length,
      message: 'Using fallback team list. Database not available.',
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
