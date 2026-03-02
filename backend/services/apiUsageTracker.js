/**
 * Günlük API kotası takibi: 75K = 50K (DB güncellemeleri) + 25K (maç senkronu)
 * - matchSync: canlı maç, fixture sync, aggressive cache → max 25.000/gün
 * - dbUpdates: rating, takım, koç, kadro, takvim → max 50.000/gün
 */

const MATCH_SYNC_LIMIT = parseInt(process.env.API_LIMIT_MATCH_SYNC || '25000', 10);
const DB_UPDATES_LIMIT = parseInt(process.env.API_LIMIT_DB_UPDATES || '50000', 10);

let matchSyncToday = 0;
let dbUpdatesToday = 0;
let lastResetDate = null;

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    matchSyncToday = 0;
    dbUpdatesToday = 0;
    lastResetDate = today;
    console.log(`📊 [API USAGE] Günlük sayaçlar sıfırlandı (${today})`);
  }
}

function incrementMatchSync(count = 1) {
  resetIfNewDay();
  matchSyncToday += count;
}

function incrementDbUpdates(count = 1) {
  resetIfNewDay();
  dbUpdatesToday += count;
}

function getMatchSyncCalls() {
  resetIfNewDay();
  return matchSyncToday;
}

function getDbUpdatesCalls() {
  resetIfNewDay();
  return dbUpdatesToday;
}

function canMakeMatchSyncCall() {
  resetIfNewDay();
  return matchSyncToday < MATCH_SYNC_LIMIT;
}

function canMakeDbUpdateCall() {
  resetIfNewDay();
  return dbUpdatesToday < DB_UPDATES_LIMIT;
}

function getMatchSyncRemaining() {
  return Math.max(0, MATCH_SYNC_LIMIT - getMatchSyncCalls());
}

function getDbUpdatesRemaining() {
  return Math.max(0, DB_UPDATES_LIMIT - getDbUpdatesCalls());
}

function getStatus() {
  resetIfNewDay();
  return {
    matchSync: { used: matchSyncToday, limit: MATCH_SYNC_LIMIT, remaining: getMatchSyncRemaining() },
    dbUpdates: { used: dbUpdatesToday, limit: DB_UPDATES_LIMIT, remaining: getDbUpdatesRemaining() },
    totalUsed: matchSyncToday + dbUpdatesToday,
    totalLimit: 75000,
  };
}

module.exports = {
  MATCH_SYNC_LIMIT,
  DB_UPDATES_LIMIT,
  incrementMatchSync,
  incrementDbUpdates,
  getMatchSyncCalls,
  getDbUpdatesCalls,
  canMakeMatchSyncCall,
  canMakeDbUpdateCall,
  getMatchSyncRemaining,
  getDbUpdatesRemaining,
  getStatus,
};
