/**
 * Günlük API kotası takibi: 75K = 50K (DB güncellemeleri) + 25K (maç senkronu)
 * - matchSync: canlı maç, fixture sync, aggressive cache → max 25.000/gün
 * - dbUpdates: rating, takım, koç, kadro, takvim → max 50.000/gün
 * Restart sonrası kaçak önleme: matchSync kullanımı dosyaya yazılır, aynı gün yüklenir.
 */

const path = require('path');
const fs = require('fs');

const MATCH_SYNC_LIMIT = parseInt(process.env.API_LIMIT_MATCH_SYNC || '25000', 10);
const DB_UPDATES_LIMIT = parseInt(process.env.API_LIMIT_DB_UPDATES || '50000', 10);

const USAGE_FILE = path.join(__dirname, '..', 'data', 'api-match-sync-used.json');
let lastWriteTime = 0;
const WRITE_THROTTLE_MS = 15000; // En fazla 15 sn'de bir dosyaya yaz

let matchSyncToday = 0;
let dbUpdatesToday = 0;
let lastResetDate = null;

function loadMatchSyncFromFile() {
  try {
    if (!fs.existsSync(USAGE_FILE)) return;
    const raw = fs.readFileSync(USAGE_FILE, 'utf8');
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    if (data.date === today && typeof data.used === 'number') {
      matchSyncToday = Math.min(data.used, MATCH_SYNC_LIMIT);
      lastResetDate = today;
      console.log(`📊 [API USAGE] Maç sync kullanımı yüklendi: ${matchSyncToday}/${MATCH_SYNC_LIMIT} (restart sonrası devam)`);
    }
  } catch (e) { /* ignore */ }
}
loadMatchSyncFromFile();

function writeMatchSyncToFile() {
  const now = Date.now();
  if (now - lastWriteTime < WRITE_THROTTLE_MS) return;
  lastWriteTime = now;
  try {
    const dir = path.dirname(USAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USAGE_FILE, JSON.stringify({
      date: new Date().toDateString(),
      used: matchSyncToday,
      at: new Date().toISOString(),
    }, null, 0));
  } catch (e) { /* ignore */ }
}

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
  writeMatchSyncToFile();
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
