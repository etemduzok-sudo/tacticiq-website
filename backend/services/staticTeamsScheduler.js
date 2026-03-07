// ============================================
// STATIC TEAMS SCHEDULER
// ============================================
// Günde 2 kez takım verilerini günceller
// Sabah 08:00 ve Akşam 20:00 (UTC)
// Aylık API kullanımı: 62 çağrı (31 gün × 2)
// ============================================

const axios = require('axios');
require('dotenv').config();
const { supabase } = require('../config/supabase');

// API-Football Config
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY;

// Sync saatleri (UTC)
const SYNC_HOURS = [8, 20]; // 08:00 ve 20:00 UTC

// Son sync zamanı
let lastSyncDate = null;
let lastSyncHour = null;
let syncTimer = null;

// Monthly API budget for static teams (tüm ligler + kadro kotası aşılmaması için makul)
const MONTHLY_API_BUDGET = 450; // ~1 full sync/day (25 lig + milli)
let apiCallsThisMonth = 0;
let currentMonth = new Date().getMonth();

// ============================================
// RATE LIMITING
// ============================================
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 saniye (10 req/min limit)

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedRequest(endpoint) {
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
    apiCallsThisMonth++;
    
    if (response.data?.response) {
      return response.data.response;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ API-Football error for ${endpoint}:`, error.message);
    throw error;
  }
}

// ============================================
// TAKİP EDİLEN LİGLER – Tüm 5 kategori
// ============================================
const {
  getAllTrackedLeagues,
  getAllTrackedLeagueIds,
  DOMESTIC_TOP_TIER,
  DOMESTIC_SECOND_TIER,
  DOMESTIC_CUP,
  DOMESTIC_SUPER_CUP,
  CONTINENTAL_CLUB,
  CONTINENTAL_NATIONAL,
  CONFEDERATION_LEAGUE_FORMAT,
  GLOBAL_COMPETITIONS,
} = require('../config/leaguesScope');
const TRACKED_LEAGUES = getAllTrackedLeagues();

function getLeagueType(leagueId) {
  if (DOMESTIC_TOP_TIER.some(l => l.id === leagueId)) return 'domestic_top';
  if (DOMESTIC_SECOND_TIER && DOMESTIC_SECOND_TIER.some(l => l.id === leagueId)) return 'domestic_top';
  if (DOMESTIC_CUP && DOMESTIC_CUP.some(l => l.id === leagueId)) return 'domestic_top';
  if (DOMESTIC_SUPER_CUP && DOMESTIC_SUPER_CUP.some(l => l.id === leagueId)) return 'domestic_top';
  if (CONTINENTAL_CLUB.some(l => l.id === leagueId)) return 'continental_club';
  if (CONTINENTAL_NATIONAL.some(l => l.id === leagueId)) return 'continental_national';
  if (CONFEDERATION_LEAGUE_FORMAT.some(l => l.id === leagueId)) return 'confederation_format';
  if (GLOBAL_COMPETITIONS.some(l => l.id === leagueId)) return 'global';
  return 'domestic_top';
}

// ============================================
// TAKIM RENKLERİ (Bilinen takımlar için)
// ============================================
const KNOWN_TEAM_COLORS = {
  // Türkiye
  'Galatasaray': { primary: '#FFA500', secondary: '#FF0000' },
  'Fenerbahce': { primary: '#FFED00', secondary: '#00205B' },
  'Besiktas': { primary: '#000000', secondary: '#FFFFFF' },
  'Trabzonspor': { primary: '#632134', secondary: '#00BFFF' },
  
  // İngiltere
  'Manchester City': { primary: '#6CABDD', secondary: '#1C2C5B' },
  'Manchester United': { primary: '#DA291C', secondary: '#FBE122' },
  'Liverpool': { primary: '#C8102E', secondary: '#00B2A9' },
  'Arsenal': { primary: '#EF0107', secondary: '#FFFFFF' },
  'Chelsea': { primary: '#034694', secondary: '#FFFFFF' },
  'Tottenham': { primary: '#132257', secondary: '#FFFFFF' },
  
  // İspanya
  'Real Madrid': { primary: '#FFFFFF', secondary: '#00529F' },
  'Barcelona': { primary: '#004D98', secondary: '#A50044' },
  'Atletico Madrid': { primary: '#CB3524', secondary: '#FFFFFF' },
  
  // Almanya
  'Bayern Munich': { primary: '#DC052D', secondary: '#FFFFFF' },
  'Borussia Dortmund': { primary: '#FDE100', secondary: '#000000' },
  
  // İtalya
  'Juventus': { primary: '#000000', secondary: '#FFFFFF' },
  'AC Milan': { primary: '#AC1818', secondary: '#000000' },
  'Inter': { primary: '#010E80', secondary: '#000000' },
  
  // Fransa
  'Paris Saint Germain': { primary: '#004170', secondary: '#DA291C' },

  // Arjantin / Güney Amerika – Boca, River, vb.
  'Boca Juniors': { primary: '#0066B3', secondary: '#FBD914' },
  'River Plate': { primary: '#E30613', secondary: '#FFFFFF' },
  'Boca': { primary: '#0066B3', secondary: '#FBD914' },
  'River': { primary: '#E30613', secondary: '#FFFFFF' },
  // Brezilya
  'Corinthians': { primary: '#000000', secondary: '#FFFFFF' },
  'Flamengo': { primary: '#CC0000', secondary: '#000000' },
  'Palmeiras': { primary: '#006437', secondary: '#FFFFFF' },
  'Sao Paulo': { primary: '#E30613', secondary: '#FFFFFF' },
  'Santos': { primary: '#FFFFFF', secondary: '#000000' },
  // Meksika
  'America': { primary: '#FBD914', secondary: '#C8102E' },
  'Chivas': { primary: '#E30613', secondary: '#FFFFFF' },
  'Cruz Azul': { primary: '#0047AB', secondary: '#FFFFFF' },
};

function getTeamColors(teamName) {
  // Bilinen takımlardan bul
  for (const [name, colors] of Object.entries(KNOWN_TEAM_COLORS)) {
    if (teamName.toLowerCase().includes(name.toLowerCase())) {
      return colors;
    }
  }
  
  // Default renkler
  return { primary: '#1E40AF', secondary: '#FFFFFF' };
}

// ============================================
// TAKIM SENKRONİZASYONU
// ============================================
async function syncTeamsForLeague(league) {
  const season = new Date().getFullYear();
  
  try {
    console.log(`📋 Syncing teams for ${league.name}...`);
    
    const teams = await rateLimitedRequest(`/teams?league=${league.id}&season=${season}`);
    
    if (!teams || teams.length === 0) {
      console.log(`⚠️ No teams found for ${league.name}`);
      return { added: 0, updated: 0 };
    }
    
    let added = 0;
    let updated = 0;
    
    for (const item of teams) {
      const team = item.team;
      const colors = getTeamColors(team.name);
      
      const leagueType = getLeagueType(league.id);
      
      const { data, error } = await supabase
        .from('static_teams')
        .upsert({
          api_football_id: team.id,
          name: team.name,
          country: league.country,
          league: league.name,
          league_type: leagueType,
          team_type: 'club',
          colors: JSON.stringify([colors.primary, colors.secondary]),
          colors_primary: colors.primary,
          colors_secondary: colors.secondary,
          logo_url: null, // TELİF KORUMASI: Logo kullanmıyoruz
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'api_football_id',
        });
      
      if (error) {
        console.error(`❌ Error saving team ${team.name}:`, error.message);
      } else {
        updated++;
      }
    }
    
    console.log(`✅ ${league.name}: ${updated} teams synced`);
    return { added, updated };
    
  } catch (error) {
    console.error(`❌ Error syncing ${league.name}:`, error.message);
    return { added: 0, updated: 0 };
  }
}

// ============================================
// MİLLİ TAKIMLAR SENKRONİZASYONU
// ============================================
async function syncNationalTeams() {
  try {
    console.log('🏳️ Syncing national teams...');
    
    const teams = await rateLimitedRequest('/teams?type=national');
    
    if (!teams || teams.length === 0) {
      console.log('⚠️ No national teams found');
      return 0;
    }
    
    let synced = 0;
    
    // Tüm milli takımlar (FIFA üyeleri – seçilebilir olsun)
    const importantTeams = teams.slice(0, 150);
    
    for (const item of importantTeams) {
      const team = item.team;
      
      const { error } = await supabase
        .from('static_teams')
        .upsert({
          api_football_id: team.id,
          name: team.name,
          country: team.country || team.name,
          league: 'International',
          league_type: 'international',
          team_type: 'national',
          colors: JSON.stringify(['#1E40AF', '#FFFFFF']),
          colors_primary: '#1E40AF',
          colors_secondary: '#FFFFFF',
          flag_url: team.logo || null, // Milli takımlar için bayrak OK
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'api_football_id',
        });
      
      if (!error) synced++;
    }
    
    console.log(`✅ National teams: ${synced} synced`);
    return synced;
    
  } catch (error) {
    console.error('❌ Error syncing national teams:', error.message);
    return 0;
  }
}

// ============================================
// TAM SENKRONİZASYON
// ============================================
async function runFullSync(syncType = 'scheduled') {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        🏆 STATIC TEAMS SYNC STARTED                    ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Sync Type: ${syncType.padEnd(43)}║`);
  console.log(`║ API Budget: ${apiCallsThisMonth}/${MONTHLY_API_BUDGET} calls this month            ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  let totalTeams = 0;
  let totalApiCalls = 0;
  
  try {
    // Ligleri senkronize et
    for (const league of TRACKED_LEAGUES) {
      // API budget kontrolü
      if (apiCallsThisMonth >= MONTHLY_API_BUDGET) {
        console.log('⚠️ Monthly API budget reached, stopping sync');
        break;
      }
      
      const result = await syncTeamsForLeague(league);
      totalTeams += result.updated;
      totalApiCalls++;
      
      await delay(500); // Rate limiting
    }
    
    // Milli takımları senkronize et
    if (apiCallsThisMonth < MONTHLY_API_BUDGET) {
      const nationalCount = await syncNationalTeams();
      totalTeams += nationalCount;
      totalApiCalls++;
    }
    
    // Eski verileri temizle (2 aydan eski)
    await supabase.rpc('cleanup_old_static_teams').catch(() => {
      console.log('ℹ️ Cleanup function not available');
    });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Sync log'a kaydet
    await supabase
      .from('static_teams_sync_log')
      .insert({
        sync_date: new Date().toISOString().split('T')[0],
        sync_time: new Date().toISOString().split('T')[1].substring(0, 8),
        sync_type: syncType,
        teams_synced: totalTeams,
        api_calls_used: totalApiCalls,
        status: 'success',
        duration_seconds: duration,
      })
      .catch(err => console.error('Sync log error:', err.message));
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        ✅ STATIC TEAMS SYNC COMPLETED                  ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Teams Synced: ${String(totalTeams).padEnd(40)}║`);
    console.log(`║ API Calls Used: ${String(totalApiCalls).padEnd(38)}║`);
    console.log(`║ Duration: ${String(duration + 's').padEnd(44)}║`);
    console.log(`║ Monthly Budget: ${apiCallsThisMonth}/${MONTHLY_API_BUDGET}                            ║`);
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    return { success: true, totalTeams, totalApiCalls, duration };
    
  } catch (error) {
    console.error('❌ Full sync failed:', error.message);
    
    // Hata log'a kaydet
    await supabase
      .from('static_teams_sync_log')
      .insert({
        sync_date: new Date().toISOString().split('T')[0],
        sync_time: new Date().toISOString().split('T')[1].substring(0, 8),
        sync_type: syncType,
        status: 'failed',
        error_message: error.message,
      })
      .catch(() => {});
    
    return { success: false, error: error.message };
  }
}

// ============================================
// SCHEDULER
// ============================================
function checkAndSync() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDate = now.toISOString().split('T')[0];
  
  // Ay değiştiyse sayacı sıfırla
  if (now.getMonth() !== currentMonth) {
    currentMonth = now.getMonth();
    apiCallsThisMonth = 0;
    console.log('📅 New month - API budget reset');
  }
  
  // Sync saati mi kontrol et
  if (SYNC_HOURS.includes(currentHour)) {
    // Bugün bu saatte zaten sync yapıldı mı?
    if (lastSyncDate === currentDate && lastSyncHour === currentHour) {
      return; // Zaten yapıldı
    }
    
    // Sync yap
    console.log(`⏰ Scheduled sync time: ${currentHour}:00 UTC`);
    lastSyncDate = currentDate;
    lastSyncHour = currentHour;
    
    const syncType = currentHour === 8 ? 'morning' : 'evening';
    runFullSync(syncType);
  }
}

// ============================================
// START/STOP
// ============================================
function startScheduler() {
  if (syncTimer) {
    console.log('⚠️ Static teams scheduler already running');
    return;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║      📅 STATIC TEAMS SCHEDULER STARTED                 ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Schedule: Daily at 08:00 and 20:00 UTC                 ║`);
  console.log(`║ Monthly API Budget: ${MONTHLY_API_BUDGET} calls                          ║`);
  console.log(`║ Tracked Leagues: ${TRACKED_LEAGUES.length}                                  ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Her dakika kontrol et
  syncTimer = setInterval(checkAndSync, 60 * 1000);
  
  // İlk kontrolü hemen yap
  checkAndSync();
}

function stopScheduler() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⏹️ Static teams scheduler stopped');
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  startScheduler,
  stopScheduler,
  runFullSync,
  syncTeamsForLeague,
  syncNationalTeams,
  getStatus: () => ({
    isRunning: syncTimer !== null,
    lastSyncDate,
    lastSyncHour,
    apiCallsThisMonth,
    monthlyBudget: MONTHLY_API_BUDGET,
  }),
};
