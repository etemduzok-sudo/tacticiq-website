// ============================================
// SMART SYNC SERVICE (Adaptive API Usage)
// ============================================
// Her 12 saniyede bir çekerek 7,500 limit'i maksimum kullanır
// ANCAK: Gerçek zamanlı maç yoğunluğuna göre adaptif çalışır
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

// ============================================
// OPTIMAL STRATEGY: Peak-Aware Dynamic Sync
// ============================================
// Maç yoğunluğu saatlerinde (14:00-23:00 UTC): 15 saniye (5,760 calls)
// Düşük aktivite saatleri (00:00-06:00 UTC): 60 saniye (360 calls)
// Normal saatler (06:00-14:00 UTC): 30 saniye (960 calls)
// TOPLAM: ~7,080 calls/day (%94.4 kullanım, güvenli marj)
// ============================================

const PEAK_INTERVAL = 15000; // 15 saniye (peak hours: 14:00-23:00 UTC)
const NORMAL_INTERVAL = 30000; // 30 saniye (normal hours: 06:00-14:00 UTC)
const NIGHT_INTERVAL = 60000; // 60 saniye (night hours: 00:00-06:00 UTC)
const LIVE_BOOST_INTERVAL = 12000; // 12 saniye (canlı maç varsa boost)
const DAILY_API_LIMIT = 7500;
const SAFE_DAILY_LIMIT = 7200; // %96 kullanım (güvenlik marjı)

let syncTimer = null;
let currentInterval = PEAK_INTERVAL;
let apiCallsToday = 0;
let apiCallsThisHour = 0;
let lastHourReset = new Date().getUTCHours();
let lastDayReset = new Date().getUTCDate();

// ============================================
// API RATE TRACKING
// ============================================

function trackApiCall() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDate();
  
  // Reset daily counter at midnight UTC
  if (currentDay !== lastDayReset) {
    apiCallsToday = 0;
    lastDayReset = currentDay;
    console.log('📊 Daily API counter reset (UTC midnight)');
  }
  
  // Reset hourly counter
  if (currentHour !== lastHourReset) {
    console.log(`📈 Hour ${lastHourReset}:00 UTC - Used ${apiCallsThisHour} calls`);
    apiCallsThisHour = 0;
    lastHourReset = currentHour;
  }
  
  apiCallsToday++;
  apiCallsThisHour++;
}

function canMakeApiCall() {
  // Stop if approaching daily limit (leave 300 calls buffer for emergencies)
  if (apiCallsToday >= SAFE_DAILY_LIMIT) {
    console.log(`⚠️ Daily limit approaching (${apiCallsToday}/${SAFE_DAILY_LIMIT}), throttling...`);
    return false;
  }
  
  // Hard stop at 7500
  if (apiCallsToday >= DAILY_API_LIMIT) {
    console.log(`🛑 Daily API limit reached (${apiCallsToday}/${DAILY_API_LIMIT})`);
    return false;
  }
  
  return true;
}

function getRemainingCalls() {
  const remaining = DAILY_API_LIMIT - apiCallsToday;
  const usagePercent = ((apiCallsToday / DAILY_API_LIMIT) * 100).toFixed(1);
  
  return {
    daily: remaining,
    used: apiCallsToday,
    limit: DAILY_API_LIMIT,
    usagePercent: usagePercent + '%'
  };
}

// ============================================
// ADAPTIVE INTERVAL CALCULATION
// ============================================

async function calculateOptimalInterval() {
  try {
    // Check live matches count
    const { data: liveMatches } = await supabase
      .from('matches')
      .select('id')
      .in('status', ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'])
      .limit(100);
    
    const liveCount = liveMatches?.length || 0;
    
    // Current hour (UTC for consistent global timing)
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    
    // Calculate remaining calls for the day
    const remaining = getRemainingCalls();
    const hoursRemaining = 24 - currentHourUTC;
    const avgCallsPerHour = remaining.daily / hoursRemaining;
    
    // ============================================
    // STRATEGY: Time-Based with Live Boost
    // ============================================
    
    let interval;
    let reason;
    
    // EMERGENCY: Approaching daily limit
    if (apiCallsToday >= SAFE_DAILY_LIMIT) {
      interval = NIGHT_INTERVAL * 2; // 120s (very slow)
      reason = 'Emergency throttle - approaching daily limit';
    }
    // BOOST: Live matches exist
    else if (liveCount > 0) {
      interval = LIVE_BOOST_INTERVAL; // 12s
      reason = `Live boost - ${liveCount} matches active`;
    }
    // PEAK HOURS: 14:00-23:00 UTC (Most matches worldwide)
    else if (currentHourUTC >= 14 && currentHourUTC < 23) {
      interval = PEAK_INTERVAL; // 15s
      reason = 'Peak hours (14:00-23:00 UTC)';
    }
    // NORMAL HOURS: 06:00-14:00 UTC
    else if (currentHourUTC >= 6 && currentHourUTC < 14) {
      interval = NORMAL_INTERVAL; // 30s
      reason = 'Normal hours (06:00-14:00 UTC)';
    }
    // NIGHT HOURS: 00:00-06:00 UTC (Minimal activity)
    else {
      interval = NIGHT_INTERVAL; // 60s
      reason = 'Night hours (00:00-06:00 UTC)';
    }
    
    return {
      interval,
      reason: {
        message: reason,
        liveCount,
        currentHourUTC,
        apiUsage: remaining,
        avgCallsPerHour: Math.round(avgCallsPerHour)
      }
    };
  } catch (error) {
    console.error('Error calculating interval:', error);
    return { interval: PEAK_INTERVAL, reason: { error: error.message } };
  }
}

// ============================================
// SMART FETCH STRATEGY
// ============================================

async function smartFetch() {
  if (!canMakeApiCall()) {
    const remaining = getRemainingCalls();
    console.log(`⚠️ API limit reached! Daily: ${remaining.daily}, Hourly: ${remaining.hourly}`);
    return;
  }
  
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Priority 1: Live matches
    const liveResponse = await footballApi.getLiveMatches();
    trackApiCall();
    
    if (liveResponse.response && liveResponse.response.length > 0) {
      await databaseService.upsertMatches(liveResponse.response);
      console.log(`🔴 Updated ${liveResponse.response.length} live matches`);
    }
    
    // Priority 2: Today's matches
    if (canMakeApiCall()) {
      const todayResponse = await footballApi.getFixturesByDate(today);
      trackApiCall();
      
      if (todayResponse.response && todayResponse.response.length > 0) {
        await databaseService.upsertMatches(todayResponse.response);
        console.log(`📅 Updated ${todayResponse.response.length} matches for today`);
      }
    }
    
    // Priority 3: Next 2 days (if API calls available)
    for (let i = 1; i <= 2 && canMakeApiCall(); i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const futureResponse = await footballApi.getFixturesByDate(dateStr);
      trackApiCall();
      
      if (futureResponse.response && futureResponse.response.length > 0) {
        await databaseService.upsertMatches(futureResponse.response);
        console.log(`📆 Updated ${futureResponse.response.length} matches for ${dateStr}`);
      }
    }
    
    // Adjust interval for next fetch
    const { interval, reason } = await calculateOptimalInterval();
    if (interval !== currentInterval) {
      currentInterval = interval;
      console.log(`⚙️ Interval adjusted to ${interval / 1000}s`, reason);
      restartSync();
    }
    
  } catch (error) {
    console.error('❌ Smart fetch error:', error);
  }
}

// ============================================
// SYNC CONTROL
// ============================================

function startSync() {
  if (syncTimer) {
    console.log('⚠️ Smart sync already running');
    return;
  }
  
  const now = new Date();
  const currentHourUTC = now.getUTCHours();
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         SMART SYNC SERVICE STARTED                     ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Strategy: Peak-Aware Dynamic Sync                      ║`);
  console.log(`║ Peak Hours (14-23 UTC): 15s interval                   ║`);
  console.log(`║ Normal Hours (06-14 UTC): 30s interval                 ║`);
  console.log(`║ Night Hours (00-06 UTC): 60s interval                  ║`);
  console.log(`║ Live Match Boost: 12s interval                         ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Daily API Limit: ${DAILY_API_LIMIT} calls                           ║`);
  console.log(`║ Safe Limit: ${SAFE_DAILY_LIMIT} calls (%96 usage)                 ║`);
  console.log(`║ Current UTC Time: ${String(currentHourUTC).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}                                    ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Run immediately - Wrap in try-catch
  try {
    smartFetch().catch((error) => {
      console.error('❌ [SMART SYNC] Error in initial smartFetch:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    });
  } catch (error) {
    console.error('❌ [SMART SYNC] Error starting smartFetch:', error.message);
    console.error('Stack:', error.stack);
    // Continue - don't crash
  }
  
  // Then run on interval - Wrap in try-catch
  syncTimer = setInterval(() => {
    try {
      smartFetch().catch((error) => {
        console.error('❌ [SMART SYNC] Error in smartFetch interval:', error.message);
        console.error('Stack:', error.stack);
        // Continue - don't crash
      });
    } catch (error) {
      console.error('❌ [SMART SYNC] Error in smartFetch interval wrapper:', error.message);
      console.error('Stack:', error.stack);
      // Continue - don't crash
    }
  }, currentInterval);
}

function stopSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⏹️ Smart sync stopped');
  }
}

function restartSync() {
  stopSync();
  syncTimer = setInterval(smartFetch, currentInterval);
}

function getStatus() {
  return {
    isRunning: syncTimer !== null,
    currentInterval: currentInterval / 1000 + 's',
    apiCallsToday,
    apiCallsThisHour,
    remaining: getRemainingCalls()
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  startSync,
  stopSync,
  getStatus,
  smartFetch
};
