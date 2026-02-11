// ============================================
// SMART SYNC SERVICE (Fixed 12s Interval)
// ============================================
// Dünya yuvarlak - her an bir yerde maç var!
// SABİT 12 saniyede bir tüm dünyadan maçları çek
// Günlük: 7,200 API çağrısı (%96 kullanım)
// ============================================

const { supabase } = require('../config/supabase');
const footballApi = require('./footballApi');
const databaseService = require('./databaseService');

// Timeline service - maç akışını kaydet
let timelineService;
try {
  timelineService = require('./timelineService');
} catch (error) {
  console.warn('⚠️ Timeline service not available:', error.message);
  timelineService = null;
}

if (!supabase) {
  console.warn('⚠️ Supabase not configured in smartSyncService.js - sync will be disabled');
}

// ============================================
// CONFIGURATION - SABİT 12 SANİYE
// ============================================
// Dünya genelinde her an maç oynanıyor:
// - Avrupa: 14:00-23:00 UTC
// - Amerika: 00:00-06:00 UTC  
// - Asya: 06:00-14:00 UTC
// Bu yüzden adaptif interval YANLIŞ!
// SABİT 12s = 7,200 calls/day = %96 kullanım
// ============================================

const FIXED_INTERVAL = 12000; // SABİT 12 saniye - dünya geneli
const DAILY_API_LIMIT = 7500;
const SAFE_DAILY_LIMIT = 7200; // %96 kullanım (300 buffer)

let syncTimer = null;
let currentInterval = FIXED_INTERVAL; // SABİT 12s
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
// SABİT INTERVAL (Adaptive değil!)
// ============================================
// Dünya yuvarlak - gece/gündüz ayrımı mantıksız
// Her zaman SABİT 12 saniye kullan
// ============================================

async function calculateOptimalInterval() {
  const remaining = getRemainingCalls();
  
  // EMERGENCY: Günlük limit doluyorsa yavaşla
  if (apiCallsToday >= SAFE_DAILY_LIMIT) {
    return {
      interval: 120000, // 2 dakika (emergency)
      reason: {
        message: 'Emergency throttle - daily limit approaching',
        apiUsage: remaining,
      }
    };
  }
  
  // Normal: SABİT 12 saniye
  return {
    interval: FIXED_INTERVAL,
    reason: {
      message: 'Fixed 12s interval - worldwide coverage',
      apiUsage: remaining,
    }
  };
}

// ============================================
// SMART FETCH STRATEGY (SABİT 12s)
// ============================================

async function smartFetch() {
  if (!canMakeApiCall()) {
    const remaining = getRemainingCalls();
    console.log(`⚠️ API limit reached! Daily: ${remaining.daily}`);
    return;
  }
  
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // ============================================
    // 1. CANLI MAÇLAR (Her 12 saniyede)
    // ============================================
    const liveResponse = await footballApi.getLiveMatches();
    trackApiCall();
    
    if (liveResponse.response && liveResponse.response.length > 0) {
      // Maçları DB'ye kaydet
      await databaseService.upsertMatches(liveResponse.response);
      
      // Timeline'a eventleri kaydet (goller, kartlar, vs.)
      if (timelineService) {
        try {
          await timelineService.processLiveMatches(liveResponse.response);
        } catch (err) {
          console.error('❌ Timeline process error:', err.message);
        }
      }
      
      console.log(`🔴 Updated ${liveResponse.response.length} live matches`);
    }
    
    // ============================================
    // 2. BUGÜNÜN MAÇLARI (Her 5 dakikada bir)
    // ============================================
    // Her 12 saniyede bugünün maçlarını çekmek gereksiz
    // 25 fetch'te 1 kez (25 x 12s = 5 dakika)
    if (apiCallsToday % 25 === 0 && canMakeApiCall()) {
      const todayResponse = await footballApi.getFixturesByDate(today);
      trackApiCall();
      
      if (todayResponse.response && todayResponse.response.length > 0) {
        await databaseService.upsertMatches(todayResponse.response);
        console.log(`📅 Updated ${todayResponse.response.length} matches for today`);
      }
    }
    
    // ============================================
    // 3. YARIN VE ÖBÜR GÜN (Her 30 dakikada bir)
    // ============================================
    // 150 fetch'te 1 kez (150 x 12s = 30 dakika)
    if (apiCallsToday % 150 === 0) {
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
    }
    
    // ============================================
    // 4. INTERVAL KONTROLÜ (Emergency durumu için)
    // ============================================
    const { interval, reason } = await calculateOptimalInterval();
    if (interval !== currentInterval) {
      currentInterval = interval;
      console.log(`⚙️ Interval changed to ${interval / 1000}s:`, reason.message);
      restartSync();
    }
    
  } catch (error) {
    console.error('❌ Smart fetch error:', error.message);
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
  console.log('║       🌍 WORLDWIDE SYNC SERVICE STARTED 🌍             ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Strategy: FIXED 12s Interval (Worldwide)               ║`);
  console.log(`║                                                        ║`);
  console.log(`║ 🌎 Americas (00-06 UTC) → MLS, Copa Libertadores       ║`);
  console.log(`║ 🌏 Asia (06-14 UTC)     → J-League, K-League, A-League ║`);
  console.log(`║ 🌍 Europe (14-23 UTC)   → Premier, LaLiga, Bundesliga  ║`);
  console.log(`║                                                        ║`);
  console.log(`║ Interval: ${FIXED_INTERVAL / 1000}s (fixed, no adaptive)                    ║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║ Daily API Limit: ${DAILY_API_LIMIT} calls                           ║`);
  console.log(`║ Expected Usage: ${SAFE_DAILY_LIMIT} calls/day (%96)               ║`);
  console.log(`║ Timeline Service: ${timelineService ? '✅ Active' : '❌ Disabled'}                          ║`);
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
