// ============================================
// DAILY SYNC SERVICE
// ============================================
// Otomatik günlük veri senkronizasyonu
// Her gün API-Football'dan veri çekip Supabase'e kaydeder
// ============================================

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('./footballApi');
const databaseService = require('./databaseService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// CONFIGURATION
// ============================================

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes (optimized for 7500/day limit)
const DAYS_TO_FETCH = 7; // Bugün + 7 gün ileri (topla 8 gün)
const MAX_API_CALLS_PER_SYNC = 150; // Use full API limit: 7500/day ÷ 48 syncs = ~156/sync

let syncTimer = null;
let isSyncing = false;
let lastSyncTime = null;
let syncStats = {
  totalSyncs: 0,
  lastSyncDate: null,
  lastSyncMatches: 0,
  apiCallsUsed: 0,
  errors: []
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get date range (yesterday + today + next N days for comprehensive coverage)
function getDateRange(days) {
  const dates = [];
  // Include yesterday (for matches that finished)
  for (let i = -1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// Upsert team into database
async function upsertTeam(team) {
  if (!team || !team.id) return;
  
  try {
    await supabase
      .from('teams')
      .upsert({
        id: team.id,
        name: team.name,
        code: team.code || null,
        logo: null, // ⚠️ TELİF HAKKI: Kulüp armaları telifli - ASLA kaydedilmez (sadece renkler kullanılır)
        country: team.country || null,
        founded: team.founded || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch (error) {
    console.error(`Error upserting team ${team.id}:`, error.message);
  }
}

// Upsert league into database
async function upsertLeague(league) {
  if (!league || !league.id) return;
  
  try {
    await supabase
      .from('leagues')
      .upsert({
        id: league.id,
        name: league.name,
        country: league.country || null,
        logo: null, // ⚠️ TELİF HAKKI: Organizasyon logo'ları (UEFA, FIFA) ASLA kullanılmaz
        season: league.season || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch (error) {
    console.error(`Error upserting league ${league.id}:`, error.message);
  }
}

// Upsert match into database
async function upsertMatch(fixture) {
  if (!fixture || !fixture.fixture || !fixture.fixture.id) return false;
  
  try {
    // First, ensure teams and league exist
    await upsertTeam(fixture.teams.home);
    await upsertTeam(fixture.teams.away);
    await upsertLeague(fixture.league);
    
    // Then upsert the match
    await supabase
      .from('matches')
      .upsert({
        id: fixture.fixture.id,
        fixture_date: fixture.fixture.date,
        fixture_timestamp: fixture.fixture.timestamp,
        status: fixture.fixture.status.short,
        status_long: fixture.fixture.status.long,
        elapsed: fixture.fixture.status.elapsed,
        home_team_id: fixture.teams.home.id,
        away_team_id: fixture.teams.away.id,
        home_score: fixture.goals.home,
        away_score: fixture.goals.away,
        halftime_home: fixture.score?.halftime?.home || null,
        halftime_away: fixture.score?.halftime?.away || null,
        fulltime_home: fixture.score?.fulltime?.home || null,
        fulltime_away: fixture.score?.fulltime?.away || null,
        league_id: fixture.league.id,
        season: fixture.league.season,
        round: fixture.league.round,
        venue_name: fixture.fixture.venue?.name || null,
        venue_city: fixture.fixture.venue?.city || null,
        referee: fixture.fixture.referee || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    return true;
  } catch (error) {
    console.error(`Error upserting match ${fixture.fixture.id}:`, error.message);
    return false;
  }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

async function syncMatches() {
  if (isSyncing) {
    console.log('⏳ Sync already in progress, skipping...');
    return;
  }

  isSyncing = true;
  lastSyncTime = new Date();
  
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     DAILY SYNC STARTED                 ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║ Time: ${lastSyncTime.toLocaleString('tr-TR').padEnd(30)} ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  let totalMatches = 0;
  let successCount = 0;
  let apiCalls = 0;

  try {
    // Get date range
    const dates = getDateRange(DAYS_TO_FETCH);
    console.log(`📅 Fetching matches for ${dates.length} days:`, dates);
    
    // Limit API calls
    if (apiCalls >= MAX_API_CALLS_PER_SYNC) {
      console.log(`⚠️ Max API calls reached (${MAX_API_CALLS_PER_SYNC}), stopping sync`);
      isSyncing = false;
      return;
    }

    // Fetch matches for each date
    for (const date of dates) {
      try {
        console.log(`\n🔍 Fetching matches for ${date}...`);
        
        const response = await footballApi.getFixturesByDate(date);
        apiCalls++;
        
        const fixtures = response.response || [];
        console.log(`   Found ${fixtures.length} matches`);
        
        if (fixtures.length === 0) continue;
        
        // Upsert each match
        for (const fixture of fixtures) {
          const success = await upsertMatch(fixture);
          if (success) successCount++;
          totalMatches++;
        }
        
        console.log(`   ✅ Synced ${successCount}/${totalMatches} matches`);
        
      } catch (error) {
        console.error(`   ❌ Error fetching ${date}:`, error.message);
        syncStats.errors.push({
          date,
          error: error.message,
          time: new Date()
        });
      }
    }

    // Update stats
    syncStats.totalSyncs++;
    syncStats.lastSyncDate = lastSyncTime;
    syncStats.lastSyncMatches = successCount;
    syncStats.apiCallsUsed = apiCalls;
    
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║     DAILY SYNC COMPLETED               ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Total Matches: ${successCount.toString().padEnd(23)} ║`);
    console.log(`║ API Calls Used: ${apiCalls.toString().padEnd(22)} ║`);
    console.log(`║ Duration: ${Math.round((new Date() - lastSyncTime) / 1000)}s`.padEnd(41) + '║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error in sync:', error);
    syncStats.errors.push({
      type: 'FATAL',
      error: error.message,
      time: new Date()
    });
  } finally {
    isSyncing = false;
  }
}

// ============================================
// SYNC CONTROL
// ============================================

// Start automatic sync
function startSync() {
  if (syncTimer) {
    console.log('⚠️ Daily sync already running');
    return;
  }

  const intervalMinutes = SYNC_INTERVAL / 1000 / 60;
  const syncsPerDay = (24 * 60) / intervalMinutes;
  const totalApiCallsPerDay = syncsPerDay * MAX_API_CALLS_PER_SYNC;
  
  console.log(`🔄 Starting daily sync (interval: ${intervalMinutes} minutes)`);
  console.log(`📊 Will fetch ${DAYS_TO_FETCH + 2} days (yesterday + today + ${DAYS_TO_FETCH} forward)`);
  console.log(`⚡ Max ${MAX_API_CALLS_PER_SYNC} API calls per sync`);
  console.log(`📈 Expected API usage: ~${totalApiCallsPerDay.toFixed(0)} calls/day (limit: 7500)`);
  
  // Run immediately on startup
  setTimeout(() => syncMatches(), 5000); // 5 seconds delay after startup
  
  // Then run on interval
  syncTimer = setInterval(syncMatches, SYNC_INTERVAL);
  
  console.log('✅ Daily sync started');
}

// Stop sync
function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⏹️ Daily sync stopped');
  }
}

// Get sync status
function getSyncStatus() {
  return {
    isRunning: syncTimer !== null,
    isSyncing,
    lastSyncTime,
    interval: SYNC_INTERVAL,
    daysToFetch: DAYS_TO_FETCH,
    maxApiCalls: MAX_API_CALLS_PER_SYNC,
    stats: syncStats
  };
}

// Manual sync trigger
function triggerSync() {
  if (isSyncing) {
    return { success: false, message: 'Sync already in progress' };
  }
  
  syncMatches();
  return { success: true, message: 'Sync triggered' };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  syncMatches,
  startSync,
  stopSync,
  getSyncStatus,
  triggerSync
};
