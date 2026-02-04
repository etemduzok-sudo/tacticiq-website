#!/usr/bin/env node
/**
 * TÜM TAKIMLAR İÇİN TÜM MAÇ LİSTESİ
 * Her lig için sezon maçlarını çekip DB'ye kaydeder
 * ~130 lig × 1 API = ~130 çağrı
 * API hakkı sıfırlanınca çalıştır (post-reset-full-sync içinde)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const { getAllTrackedLeagues } = require('../config/leaguesScope');
const path = require('path');
const fs = require('fs');

const SEASON = 2025;
const RATE_MS = 300;
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'all-matches-progress.json');

// sync-all-world-leagues'deki ligler (benzersiz ID'ler)
const WORLD_LEAGUE_IDS = new Set([
  39, 140, 78, 135, 61, 88, 94, 144, 203, 235, 333, 179, 218, 207, 197, 119, 103, 113, 106, 345, 210, 286, 283, 172, 271, 318, 384, 244, 164, 357, 408, 110, 332, 373, 116, 387, 420, 325, 342, 441, 155, 428, 423, 310, 409, 261, 392, 329, 363, 360, 370,
  71, 128, 239, 265, 268, 274, 281, 242, 299, 158,
  262, 253, 162, 247, 240, 230, 277, 256,
  98, 292, 169, 307, 301, 305, 252, 296, 188, 323, 249, 378, 382, 340, 254, 258, 259, 149, 269, 390, 440, 352, 365,
  233, 200, 202, 186, 288, 267, 237, 355, 368, 159, 228, 419, 396, 412, 255, 351, 381, 372, 358, 398, 374, 375, 324, 400, 320, 316, 399, 385, 354, 376, 359, 377, 397,
  167,
  // Kıta turnuvaları
  2, 3, 848, 829, 13, 137, 538, 15, 384, 545,
  4, 9, 16, 17, 22, 23,
  5, 1, 10,
]);

function getAllLeagueIds() {
  const fromScope = getAllTrackedLeagues().map(l => l.id);
  const combined = new Set([...fromScope, ...WORLD_LEAGUE_IDS]);
  return Array.from(combined);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TÜM TAKIMLAR - TÜM MAÇ LİSTESİ                                ║');
  console.log('║   Lig bazlı sezon maçları → DB                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (!databaseService.enabled) {
    console.log('❌ Supabase yapılandırılmamış');
    process.exit(1);
  }

  const leagues = getAllLeagueIds();
  console.log(`📋 ${leagues.length} lig işlenecek (sezon ${SEASON})\n`);

  let totalMatches = 0;
  let totalSaved = 0;
  let processed = 0;
  let startIndex = 0;

  // Kaldığı yerden devam
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      startIndex = (p.lastLeagueIndex ?? -1) + 1;
      if (startIndex > 0) console.log(`🔄 Kaldığı yerden: ${startIndex}/${leagues.length}\n`);
    } catch (e) {}
  }

  const dataDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  for (let i = startIndex; i < leagues.length; i++) {
    const leagueId = leagues[i];
    try {
      const data = await footballApi.getFixturesByLeague(leagueId, SEASON);
      const fixtures = data?.response || [];

      if (fixtures.length > 0) {
        const saved = await databaseService.upsertMatches(fixtures);
        const count = Array.isArray(saved) ? saved.length : 0;
        totalSaved += count;
        totalMatches += fixtures.length;
        console.log(`   [${i + 1}/${leagues.length}] Lig ${leagueId}: ${fixtures.length} maç → DB`);
      }

      processed++;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        lastLeagueIndex: i,
        totalMatches,
        totalSaved,
        updatedAt: new Date().toISOString()
      }, null, 2));

      await new Promise(r => setTimeout(r, RATE_MS));
    } catch (err) {
      console.error(`   ❌ Lig ${leagueId}: ${err.message}`);
    }
  }

  try {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  } catch (e) {}

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Tamamlandı: ${totalMatches} maç işlendi, DB'ye kaydedildi`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
