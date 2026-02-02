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

// Lig kategorileri için import
const {
  getAllTrackedLeagues,
  DOMESTIC_TOP_TIER,
  CONTINENTAL_CLUB,
  CONTINENTAL_NATIONAL,
  CONFEDERATION_LEAGUE_FORMAT,
  GLOBAL_COMPETITIONS,
} = require('../config/leaguesScope');

// Lig ID'sine göre kategori belirleme
function getLeagueTypeFromId(leagueId) {
  // 1. Domestic Top Tier
  if (DOMESTIC_TOP_TIER.some(l => l.id === leagueId)) {
    return 'domestic_top';
  }
  // 2. Continental Club
  if (CONTINENTAL_CLUB.some(l => l.id === leagueId)) {
    return 'continental_club';
  }
  // 3. Continental National
  if (CONTINENTAL_NATIONAL.some(l => l.id === leagueId)) {
    return 'continental_national';
  }
  // 4. Confederation League Format
  if (CONFEDERATION_LEAGUE_FORMAT.some(l => l.id === leagueId)) {
    return 'confederation_format';
  }
  // 5. Global Competitions
  if (GLOBAL_COMPETITIONS.some(l => l.id === leagueId)) {
    return 'global';
  }
  // Default (eski kod uyumluluğu için)
  return 'domestic_top';
}

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
    
    // Tüm takip edilen ligler için sync (leaguesScope.js'den)
    const trackedLeagues = getAllTrackedLeagues();
    
    for (const league of trackedLeagues) {
      console.log(`📋 Processing ${league.name} (${league.id})...`);
      const teams = await fetchLeagueTeams(league.id, 2025);
      
      // Lig tipini belirle
      const leagueType = getLeagueTypeFromId(league.id);
      // Takım tipi: Continental National ve Global (World Cup) için 'national', diğerleri için 'club'
      const teamType = (leagueType === 'continental_national' || leagueType === 'global') ? 'national' : 'club';
      
      for (const team of teams) {
        const saved = await saveTeam(team, { league: { name: league.name }, country: { name: league.country } }, leagueType, teamType);
        if (saved) teamsAdded++;
        await delay(100); // Rate limiting
      }
    }
    
    // Milli takımlar (tüm FIFA üyeleri)
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

// Fallback teams data (used when DB is not available)
const FALLBACK_TEAMS = [
  // National teams
  { api_football_id: 1, name: 'Turkey', country: 'Turkey', league: 'International', league_type: 'international', team_type: 'national', colors: ['#E30A17', '#FFFFFF'], colors_primary: '#E30A17', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/tr.png' },
  { api_football_id: 2, name: 'Germany', country: 'Germany', league: 'International', league_type: 'international', team_type: 'national', colors: ['#000000', '#DD0000'], colors_primary: '#000000', colors_secondary: '#DD0000', flag_url: 'https://flagcdn.com/w80/de.png' },
  { api_football_id: 3, name: 'France', country: 'France', league: 'International', league_type: 'international', team_type: 'national', colors: ['#002395', '#FFFFFF'], colors_primary: '#002395', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/fr.png' },
  { api_football_id: 10, name: 'England', country: 'England', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FFFFFF', '#CF081F'], colors_primary: '#FFFFFF', colors_secondary: '#CF081F', flag_url: 'https://flagcdn.com/w80/gb-eng.png' },
  { api_football_id: 9, name: 'Spain', country: 'Spain', league: 'International', league_type: 'international', team_type: 'national', colors: ['#AA151B', '#F1BF00'], colors_primary: '#AA151B', colors_secondary: '#F1BF00', flag_url: 'https://flagcdn.com/w80/es.png' },
  { api_football_id: 768, name: 'Italy', country: 'Italy', league: 'International', league_type: 'international', team_type: 'national', colors: ['#009246', '#FFFFFF'], colors_primary: '#009246', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/it.png' },
  { api_football_id: 6, name: 'Brazil', country: 'Brazil', league: 'International', league_type: 'international', team_type: 'national', colors: ['#009C3B', '#FFDF00'], colors_primary: '#009C3B', colors_secondary: '#FFDF00', flag_url: 'https://flagcdn.com/w80/br.png' },
  { api_football_id: 26, name: 'Argentina', country: 'Argentina', league: 'International', league_type: 'international', team_type: 'national', colors: ['#74ACDF', '#FFFFFF'], colors_primary: '#74ACDF', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/ar.png' },
  { api_football_id: 27, name: 'Portugal', country: 'Portugal', league: 'International', league_type: 'international', team_type: 'national', colors: ['#006600', '#FF0000'], colors_primary: '#006600', colors_secondary: '#FF0000', flag_url: 'https://flagcdn.com/w80/pt.png' },
  { api_football_id: 1118, name: 'Netherlands', country: 'Netherlands', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FF6600', '#FFFFFF'], colors_primary: '#FF6600', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/nl.png' },
  // Turkish Super Lig - API-Football v3 IDs (2026-02-02 verified)
  { api_football_id: 611, name: 'Fenerbahce', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FFED00', '#00205B'], colors_primary: '#FFED00', colors_secondary: '#00205B' },
  { api_football_id: 645, name: 'Galatasaray', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFD700'], colors_primary: '#FF0000', colors_secondary: '#FFD700' },
  { api_football_id: 549, name: 'Besiktas', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  { api_football_id: 998, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#632134', '#00BFFF'], colors_primary: '#632134', colors_secondary: '#00BFFF' },
  { api_football_id: 564, name: 'Basaksehir', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#F37021', '#000000'], colors_primary: '#F37021', colors_secondary: '#000000' },
  { api_football_id: 3563, name: 'Adana Demirspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#0000FF', '#FFFFFF'], colors_primary: '#0000FF', colors_secondary: '#FFFFFF' },
  { api_football_id: 1005, name: 'Antalyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
  { api_football_id: 607, name: 'Konyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#FFFFFF'], colors_primary: '#006633', colors_secondary: '#FFFFFF' },
  { api_football_id: 1002, name: 'Sivasspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
  { api_football_id: 1004, name: 'Kasimpasa', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#000066', '#FFFFFF'], colors_primary: '#000066', colors_secondary: '#FFFFFF' },
  { api_football_id: 994, name: 'Goztepe', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FFD700', '#C8102E'], colors_primary: '#FFD700', colors_secondary: '#C8102E' },
  { api_football_id: 1001, name: 'Kayserispor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFD700'], colors_primary: '#FF0000', colors_secondary: '#FFD700' },
  { api_football_id: 1007, name: 'Rizespor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#0000FF'], colors_primary: '#006633', colors_secondary: '#0000FF' },
  { api_football_id: 3575, name: 'Hatayspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#C8102E'], colors_primary: '#006633', colors_secondary: '#C8102E' },
  { api_football_id: 3603, name: 'Samsunspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#FFFFFF'], colors_primary: '#C8102E', colors_secondary: '#FFFFFF' },
  { api_football_id: 3573, name: 'Gaziantep FK', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#000000'], colors_primary: '#C8102E', colors_secondary: '#000000' },
  { api_football_id: 996, name: 'Alanyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF6600', '#006633'], colors_primary: '#FF6600', colors_secondary: '#006633' },
  { api_football_id: 556, name: 'Qarabag', country: 'Azerbaijan', league: 'Premyer Liqa', league_type: 'domestic_top', team_type: 'club', colors: ['#00AA00', '#FFFFFF'], colors_primary: '#00AA00', colors_secondary: '#FFFFFF' },
  // Premier League
  { api_football_id: 50, name: 'Manchester City', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#6CABDD', '#1C2C5B'], colors_primary: '#6CABDD', colors_secondary: '#1C2C5B' },
  { api_football_id: 33, name: 'Manchester United', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#DA291C', '#FBE122'], colors_primary: '#DA291C', colors_secondary: '#FBE122' },
  { api_football_id: 40, name: 'Liverpool', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#00B2A9'], colors_primary: '#C8102E', colors_secondary: '#00B2A9' },
  { api_football_id: 42, name: 'Arsenal', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#EF0107', '#FFFFFF'], colors_primary: '#EF0107', colors_secondary: '#FFFFFF' },
  { api_football_id: 49, name: 'Chelsea', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#034694', '#FFFFFF'], colors_primary: '#034694', colors_secondary: '#FFFFFF' },
  { api_football_id: 47, name: 'Tottenham', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#132257', '#FFFFFF'], colors_primary: '#132257', colors_secondary: '#FFFFFF' },
  // La Liga
  { api_football_id: 541, name: 'Real Madrid', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#FFFFFF', '#00529F'], colors_primary: '#FFFFFF', colors_secondary: '#00529F' },
  { api_football_id: 529, name: 'Barcelona', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#004D98', '#A50044'], colors_primary: '#004D98', colors_secondary: '#A50044' },
  { api_football_id: 530, name: 'Atletico Madrid', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#CB3524', '#FFFFFF'], colors_primary: '#CB3524', colors_secondary: '#FFFFFF' },
  // Bundesliga
  { api_football_id: 157, name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#DC052D', '#FFFFFF'], colors_primary: '#DC052D', colors_secondary: '#FFFFFF' },
  { api_football_id: 165, name: 'Borussia Dortmund', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#FDE100', '#000000'], colors_primary: '#FDE100', colors_secondary: '#000000' },
  { api_football_id: 168, name: 'Bayer Leverkusen', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#E32221', '#000000'], colors_primary: '#E32221', colors_secondary: '#000000' },
  // Serie A
  { api_football_id: 489, name: 'AC Milan', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#AC1818', '#000000'], colors_primary: '#AC1818', colors_secondary: '#000000' },
  { api_football_id: 505, name: 'Inter', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#010E80', '#000000'], colors_primary: '#010E80', colors_secondary: '#000000' },
  { api_football_id: 496, name: 'Juventus', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  { api_football_id: 492, name: 'Napoli', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#12A0D7', '#FFFFFF'], colors_primary: '#12A0D7', colors_secondary: '#FFFFFF' },
  // Ligue 1
  { api_football_id: 85, name: 'Paris Saint Germain', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#004170', '#DA291C'], colors_primary: '#004170', colors_secondary: '#DA291C' },
  { api_football_id: 81, name: 'Marseille', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#2FAEE0', '#FFFFFF'], colors_primary: '#2FAEE0', colors_secondary: '#FFFFFF' },
  { api_football_id: 80, name: 'Lyon', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#0046A0', '#E10000'], colors_primary: '#0046A0', colors_secondary: '#E10000' },
  // Arjantin / Güney Amerika - API-Football v3 IDs (2026-02-02 verified)
  { api_football_id: 451, name: 'Boca Juniors', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#0066B3', '#FBD914'], colors_primary: '#0066B3', colors_secondary: '#FBD914' },
  { api_football_id: 435, name: 'River Plate', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
  { api_football_id: 460, name: 'San Lorenzo', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#0000FF'], colors_primary: '#E30613', colors_secondary: '#0000FF' },
  { api_football_id: 436, name: 'Racing Club', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#FFFFFF', '#0066B3'], colors_primary: '#FFFFFF', colors_secondary: '#0066B3' },
  { api_football_id: 453, name: 'Independiente', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
  // Brasileirão - API-Football v3 IDs
  { api_football_id: 131, name: 'Corinthians', country: 'Brazil', league: 'Brasileirao', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  { api_football_id: 127, name: 'Flamengo', country: 'Brazil', league: 'Brasileirao', league_type: 'domestic_top', team_type: 'club', colors: ['#CC0000', '#000000'], colors_primary: '#CC0000', colors_secondary: '#000000' },
  { api_football_id: 121, name: 'Palmeiras', country: 'Brazil', league: 'Brasileirao', league_type: 'domestic_top', team_type: 'club', colors: ['#006437', '#FFFFFF'], colors_primary: '#006437', colors_secondary: '#FFFFFF' },
  { api_football_id: 1062, name: 'Atletico-MG', country: 'Brazil', league: 'Brasileirao', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  // La Liga extras
  { api_football_id: 534, name: 'Las Palmas', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#FFD700', '#0000FF'], colors_primary: '#FFD700', colors_secondary: '#0000FF' },
  // Bundesliga extras
  { api_football_id: 160, name: 'SC Freiburg', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#E2001A', '#000000'], colors_primary: '#E2001A', colors_secondary: '#000000' },
  // Eredivisie
  { api_football_id: 201, name: 'AZ Alkmaar', country: 'Netherlands', league: 'Eredivisie', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
  { api_football_id: 209, name: 'Feyenoord', country: 'Netherlands', league: 'Eredivisie', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
];

/**
 * Takım ara (Hızlı erişim için)
 * DB varsa DB'den, yoksa fallback listesinden döner
 */
async function searchTeams(query, type = null) {
  const searchQuery = `%${query.toLowerCase()}%`;
  
  // Önce view'ı dene, yoksa direkt tabloyu kullan
  let sql = `
    SELECT * FROM static_teams
    WHERE LOWER(name) LIKE $1
  `;
  
  const params = [searchQuery];
  
  if (type) {
    sql += ` AND team_type = $2`;
    params.push(type);
  }
  
  // Tüm kayıtlı takımlar aranabilsin (Boca, River vb. eski sync’te gelse bile)
  sql += ` AND (last_updated >= NOW() - INTERVAL '12 months' OR last_updated IS NULL)`;
  
  const prefixParam = type ? 3 : 2;
  params.push(query.toLowerCase());
  sql += ` ORDER BY CASE WHEN LOWER(name) LIKE $${prefixParam} || '%' THEN 0 WHEN LOWER(name) LIKE $1 THEN 1 ELSE 2 END, name LIMIT 80`;
  
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    const errorMessage = error.message || String(error);
    console.warn('⚠️  Static teams DB error, using fallback:', errorMessage.substring(0, 100));
    
    const { filterAndSortTeams } = require('../utils/teamFilter');
    let filtered = filterAndSortTeams(FALLBACK_TEAMS, query, t => t.name);
    if (type) filtered = filtered.filter(team => team.team_type === type);
    return filtered.slice(0, 50);
  }
}

module.exports = {
  syncAllTeams,
  searchTeams,
  cleanupOldTeams: async () => {
    await pool.query('SELECT cleanup_old_static_teams()');
  },
};
