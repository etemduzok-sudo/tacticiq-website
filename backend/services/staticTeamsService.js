// =====================================================
// Static Teams Service
// =====================================================
// Bu servis API-Football'dan tüm önemli takımları çeker:
// - Üst lig takımları
// - Yerel kupalar
// - Kıta kupaları (ŞL, EL, vs.)
// - Milli takımlar (Dünya Kupası, Kıta Kupaları)
// 
// Güncelleme: Haftada 1 kez (cron job ile)
// Temizlik: 2 ay önceki veriler otomatik silinir
// =====================================================

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// API-Football Config
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

// Rate limiting: 10 requests/minute (API-Football limit)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 saniye (10 req/min)

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiFootballRequest(endpoint) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  
  try {
    const response = await axios.get(`${API_FOOTBALL_BASE_URL}${endpoint}`, {
      headers: {
        'x-rapidapi-key': API_FOOTBALL_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      timeout: 30000,
    });
    
    lastRequestTime = Date.now();
    
    if (response.data?.response) {
      return response.data.response;
    }
    
    return [];
  } catch (error) {
    console.error(`API-Football error for ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Tüm üst ligleri çek (Premier League, La Liga, Serie A, vs.)
 */
async function fetchTopLeagues() {
  console.log('📋 Fetching top leagues...');
  
  const leagues = await apiFootballRequest('/leagues');
  
  // Sadece en üst ligleri filtrele
  const topLeagues = leagues.filter(league => {
    const name = league.league?.name?.toLowerCase() || '';
    const country = league.country?.name || '';
    
    // Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Süper Lig, vs.
    const topLeagueNames = [
      'premier league', 'la liga', 'serie a', 'bundesliga', 
      'ligue 1', 'süper lig', 'super lig', 'eredivisie',
      'primeira liga', 'russian premier league', 'mls'
    ];
    
    return topLeagueNames.some(topName => name.includes(topName));
  });
  
  console.log(`✅ Found ${topLeagues.length} top leagues`);
  return topLeagues;
}

/**
 * Yerel kupaları çek (Türkiye Kupası, FA Cup, vs.)
 */
async function fetchDomesticCups() {
  console.log('📋 Fetching domestic cups...');
  
  const leagues = await apiFootballRequest('/leagues');
  
  // Yerel kupaları filtrele
  const domesticCups = leagues.filter(league => {
    const name = league.league?.name?.toLowerCase() || '';
    
    return name.includes('cup') || 
           name.includes('kupa') || 
           name.includes('copa') ||
           name.includes('coupe');
  });
  
  console.log(`✅ Found ${domesticCups.length} domestic cups`);
  return domesticCups;
}

/**
 * Kıta kupalarını çek (ŞL, EL, Konfederasyon Ligi)
 */
async function fetchContinentalLeagues() {
  console.log('📋 Fetching continental leagues...');
  
  const leagues = await apiFootballRequest('/leagues');
  
  const continentalLeagues = leagues.filter(league => {
    const name = league.league?.name?.toLowerCase() || '';
    
    return name.includes('champions league') ||
           name.includes('europa league') ||
           name.includes('conference league') ||
           name.includes('libertadores') ||
           name.includes('copa sudamericana') ||
           name.includes('afc champions league') ||
           name.includes('afc cup');
  });
  
  console.log(`✅ Found ${continentalLeagues.length} continental leagues`);
  return continentalLeagues;
}

/**
 * Milli takımları çek (Dünya Kupası, Kıta Kupaları)
 */
async function fetchNationalTeams() {
  console.log('📋 Fetching national teams...');
  
  // Tüm milli takımları çek
  const teams = await apiFootballRequest('/teams?type=national');
  
  console.log(`✅ Found ${teams.length} national teams`);
  return teams;
}

/**
 * Lig takımlarını çek
 */
async function fetchLeagueTeams(leagueId, season = 2025) {
  try {
    const teams = await apiFootballRequest(`/teams?league=${leagueId}&season=${season}`);
    return teams.map(item => ({
      ...item.team,
      league_id: leagueId,
      season: season,
    }));
  } catch (error) {
    console.error(`Error fetching teams for league ${leagueId}:`, error.message);
    return [];
  }
}

/**
 * Takım renklerini çek (resmi arma renkleri)
 */
function extractTeamColors(teamData) {
  // API-Football'dan gelen renk bilgisi yoksa, default renkler
  const colors = teamData.colors?.player?.primary || 
                 teamData.colors?.player?.number || 
                 null;
  
  if (colors) {
    return {
      primary: colors || '#1E40AF',
      secondary: teamData.colors?.player?.secondary || '#FFFFFF',
    };
  }
  
  // Takım adına göre bilinen renkler
  const teamName = (teamData.name || '').toLowerCase();
  
  // Türk takımları
  if (teamName.includes('galatasaray')) return { primary: '#FFA500', secondary: '#FF0000' };
  if (teamName.includes('fenerbahçe') || teamName.includes('fenerbahce')) return { primary: '#FFFF00', secondary: '#000080' };
  if (teamName.includes('beşiktaş') || teamName.includes('besiktas')) return { primary: '#000000', secondary: '#FFFFFF' };
  if (teamName.includes('trabzonspor')) return { primary: '#800020', secondary: '#0000FF' };
  
  // İspanya
  if (teamName.includes('real madrid')) return { primary: '#FFFFFF', secondary: '#FFD700' };
  if (teamName.includes('barcelona')) return { primary: '#A50044', secondary: '#004D98' };
  if (teamName.includes('atletico')) return { primary: '#CB3524', secondary: '#FFFFFF' };
  
  // İngiltere
  if (teamName.includes('manchester united')) return { primary: '#DA291C', secondary: '#FFE500' };
  if (teamName.includes('manchester city')) return { primary: '#6CABDD', secondary: '#FFFFFF' };
  if (teamName.includes('liverpool')) return { primary: '#C8102E', secondary: '#FFFFFF' };
  if (teamName.includes('chelsea')) return { primary: '#034694', secondary: '#FFFFFF' };
  if (teamName.includes('arsenal')) return { primary: '#EF0107', secondary: '#FFFFFF' };
  
  // Milli takımlar
  if (teamName.includes('türkiye') || teamName.includes('turkey')) return { primary: '#E30A17', secondary: '#FFFFFF' };
  if (teamName.includes('germany') || teamName.includes('almanya')) return { primary: '#000000', secondary: '#DD0000' };
  if (teamName.includes('france') || teamName.includes('fransa')) return { primary: '#002654', secondary: '#FFFFFF' };
  if (teamName.includes('spain') || teamName.includes('ispanya')) return { primary: '#AA151B', secondary: '#F1BF00' };
  if (teamName.includes('italy') || teamName.includes('italya')) return { primary: '#009246', secondary: '#FFFFFF' };
  if (teamName.includes('england') || teamName.includes('ingiltere')) return { primary: '#FFFFFF', secondary: '#C8102E' };
  if (teamName.includes('brazil') || teamName.includes('brezilya')) return { primary: '#009739', secondary: '#FEDD00' };
  if (teamName.includes('argentina') || teamName.includes('arjantin')) return { primary: '#74ACDF', secondary: '#FFFFFF' };
  
  // Default
  return { primary: '#1E40AF', secondary: '#FFFFFF' };
}

/**
 * Takım bilgilerini DB'ye kaydet
 * ⚠️ TELİF HAKKI: Kulüp armaları (logo_url) ASLA kaydedilmez, sadece renkler kullanılır
 * ✅ Milli takım bayrakları (flag_url) kullanılabilir
 */
async function saveTeam(teamData, leagueInfo, leagueType, teamType) {
  const colors = extractTeamColors(teamData);
  
  // ⚠️ TELİF HAKKI KORUMASI: Kulüp takımları için logo_url ASLA kaydedilmez
  // Sadece milli takımlar için flag_url kullanılabilir
  const logoUrl = teamType === 'club' ? null : null; // Kulüp armaları telifli - ASLA kullanılmaz
  const flagUrl = teamType === 'national' ? (teamData.flag || null) : null; // Sadece milli takımlar için bayrak
  
  const query = `
    INSERT INTO static_teams (
      api_football_id, name, country, league, league_type, team_type,
      colors, colors_primary, colors_secondary, coach, logo_url, flag_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (api_football_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      league = EXCLUDED.league,
      league_type = EXCLUDED.league_type,
      team_type = EXCLUDED.team_type,
      colors = EXCLUDED.colors,
      colors_primary = EXCLUDED.colors_primary,
      colors_secondary = EXCLUDED.colors_secondary,
      coach = EXCLUDED.coach,
      logo_url = EXCLUDED.logo_url, -- Kulüp takımları için NULL (telif koruması)
      flag_url = EXCLUDED.flag_url, -- Sadece milli takımlar için
      last_updated = CURRENT_TIMESTAMP
  `;
  
  const values = [
    teamData.id,
    teamData.name,
    teamData.country || leagueInfo?.country?.name || 'Unknown',
    leagueInfo?.league?.name || 'Unknown',
    leagueType,
    teamType,
    JSON.stringify([colors.primary, colors.secondary]),
    colors.primary,
    colors.secondary,
    null, // Coach bilgisi ayrı endpoint'ten gelecek
    logoUrl, // ⚠️ Kulüp takımları için NULL (telif koruması)
    flagUrl, // ✅ Sadece milli takımlar için bayrak
  ];
  
  try {
    await pool.query(query, values);
    return true;
  } catch (error) {
    console.error(`Error saving team ${teamData.name}:`, error.message);
    return false;
  }
}

/**
 * Tüm takımları senkronize et (Full Sync)
 */
async function syncAllTeams() {
  console.log('🚀 Starting full sync of static teams...');
  const startTime = Date.now();
  
  let historyId;
  try {
    // Update history kaydı oluştur
    const historyResult = await pool.query(
      'INSERT INTO static_teams_update_history (update_type, status) VALUES ($1, $2) RETURNING id',
      ['full_sync', 'running']
    );
    historyId = historyResult.rows[0].id;
    
    let teamsAdded = 0;
    let teamsUpdated = 0;
    
    // 1. Üst lig takımları
    const topLeagues = await fetchTopLeagues();
    for (const league of topLeagues) {
      console.log(`📋 Processing ${league.league?.name}...`);
      const teams = await fetchLeagueTeams(league.league?.id, 2025);
      
      for (const team of teams) {
        const saved = await saveTeam(team, league, 'domestic_top', 'club');
        if (saved) teamsAdded++;
        await delay(100); // Rate limiting
      }
    }
    
    // 2. Yerel kupalar
    const domesticCups = await fetchDomesticCups();
    for (const cup of domesticCups.slice(0, 50)) { // İlk 50 kupa
      const teams = await fetchLeagueTeams(cup.league?.id, 2025);
      
      for (const team of teams) {
        const saved = await saveTeam(team, cup, 'domestic_cup', 'club');
        if (saved) teamsAdded++;
        await delay(100);
      }
    }
    
    // 3. Kıta kupaları
    const continentalLeagues = await fetchContinentalLeagues();
    for (const league of continentalLeagues) {
      const teams = await fetchLeagueTeams(league.league?.id, 2025);
      
      for (const team of teams) {
        const saved = await saveTeam(team, league, 'continental', 'club');
        if (saved) teamsAdded++;
        await delay(100);
      }
    }
    
    // 4. Milli takımlar
    const nationalTeams = await fetchNationalTeams();
    for (const team of nationalTeams) {
      const saved = await saveTeam(team, null, 'international', 'national');
      if (saved) teamsAdded++;
      await delay(100);
    }
    
    // 5. Eski verileri temizle (2 ay önceki)
    await pool.query('SELECT cleanup_old_static_teams()');
    
    // Update history'yi güncelle
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await pool.query(
      'UPDATE static_teams_update_history SET completed_at = CURRENT_TIMESTAMP, status = $1, teams_added = $2 WHERE id = $3',
      ['completed', teamsAdded, historyId]
    );
    
    console.log(`✅ Full sync completed in ${duration}s. Added/Updated: ${teamsAdded} teams`);
    
    return {
      success: true,
      teamsAdded,
      duration,
    };
  } catch (error) {
    console.error('❌ Full sync failed:', error);
    
    // Update history'yi hata ile işaretle
    if (historyId) {
      await pool.query(
        'UPDATE static_teams_update_history SET completed_at = CURRENT_TIMESTAMP, status = $1, error_message = $2 WHERE id = $3',
        ['failed', error.message, historyId]
      );
    }
    
    throw error;
  }
}

/**
 * Takım ara (Hızlı erişim için)
 */
async function searchTeams(query, type = null) {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  let sql = `
    SELECT * FROM v_active_static_teams
    WHERE LOWER(name) LIKE $1
  `;
  
  const params = [searchQuery];
  
  if (type) {
    sql += ` AND team_type = $2`;
    params.push(type);
  }
  
  sql += ` ORDER BY country, name LIMIT 50`;
  
  const result = await pool.query(sql, params);
  return result.rows;
}

module.exports = {
  syncAllTeams,
  searchTeams,
  cleanupOldTeams: async () => {
    await pool.query('SELECT cleanup_old_static_teams()');
  },
};
