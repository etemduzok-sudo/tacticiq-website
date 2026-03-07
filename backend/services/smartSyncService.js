// ============================================
// SMART SYNC SERVICE – Zamanlanmış Veri Senkronu
// ============================================
// GÖREV: Bugünün, yarının ve öbür günün maç programını DB'ye kaydetmek.
// CANLI MAÇ ÇAĞIRMAZ — o iş sadece liveMatchService'e ait.
// ============================================

const footballApi = require('./footballApi');
const databaseService = require('./databaseService');
const apiUsageTracker = require('./apiUsageTracker');

let timelineService;
try { timelineService = require('./timelineService'); } catch { timelineService = null; }

// Her 5 dakikada bir bugünün maçlarını güncelle, her 30 dakikada yarın/öbürgün
const TODAY_INTERVAL = 5 * 60 * 1000;
const FUTURE_INTERVAL = 30 * 60 * 1000;

let todayTimer = null;
let futureTimer = null;

async function syncTodayMatches() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const resp = await footballApi.getFixturesByDate(today);
    apiUsageTracker.incrementMatchSync(1);
    if (resp.response && resp.response.length > 0) {
      await databaseService.upsertMatches(resp.response);
      console.log(`📅 [SYNC] Bugünün maçları güncellendi: ${resp.response.length}`);
    }
  } catch (err) {
    console.error('❌ [SYNC] Bugün maç güncelleme hatası:', err.message);
  }
}

async function syncFutureMatches() {
  if (!apiUsageTracker.canMakeMatchSyncCall()) return;
  try {
    for (let i = 1; i <= 2; i++) {
      if (!apiUsageTracker.canMakeMatchSyncCall()) break;
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const resp = await footballApi.getFixturesByDate(dateStr);
      apiUsageTracker.incrementMatchSync(1);
      if (resp.response && resp.response.length > 0) {
        await databaseService.upsertMatches(resp.response);
        console.log(`📆 [SYNC] ${dateStr} maçları güncellendi: ${resp.response.length}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('❌ [SYNC] Gelecek maç güncelleme hatası:', err.message);
  }
}

function startSync() {
  if (todayTimer) { console.log('⚠️ Smart sync already running'); return; }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       📅 SCHEDULED SYNC SERVICE STARTED                ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║ Bugünün maçları: 5 dk\'da bir (1 API/run = 288/gün)    ║');
  console.log('║ Yarın+öbürgün: 30 dk\'da bir (2 API/run = 96/gün)     ║');
  console.log('║ Canlı maçlar: BU SERVİS ÇAĞIRMAZ (liveMatchService)  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  syncTodayMatches().catch(e => console.error('❌ [SYNC] Initial today error:', e.message));
  syncFutureMatches().catch(e => console.error('❌ [SYNC] Initial future error:', e.message));

  todayTimer = setInterval(() => {
    syncTodayMatches().catch(e => console.error('❌ [SYNC] today error:', e.message));
  }, TODAY_INTERVAL);

  futureTimer = setInterval(() => {
    syncFutureMatches().catch(e => console.error('❌ [SYNC] future error:', e.message));
  }, FUTURE_INTERVAL);
}

function stopSync() {
  if (todayTimer) { clearInterval(todayTimer); todayTimer = null; }
  if (futureTimer) { clearInterval(futureTimer); futureTimer = null; }
  console.log('⏹️ Scheduled sync stopped');
}

function getStatus() {
  return {
    isRunning: todayTimer !== null,
    todayInterval: TODAY_INTERVAL / 1000 + 's',
    futureInterval: FUTURE_INTERVAL / 1000 + 's',
    quota: apiUsageTracker.getStatus(),
  };
}

module.exports = { startSync, stopSync, getStatus };
