/**
 * Planlanmış maç listesini API-Football'dan çekip DB'ye kaydeder
 * Bugün + önümüzdeki 30 gün (toplam 31 gün)
 * Uygulama maçları DB'den çeker - API limitini korumak için
 */

require('dotenv').config();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const path = require('path');
const fs = require('fs');

const DAYS_AHEAD = 30; // Bugün dahil 31 gün
const RATE_MS = 250;
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'planned-matches-progress.json');

function getDateRange() {
  const dates = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PLANLANMIŞ MAÇLAR - DB SENKRONU                              ║');
  console.log('║   Bugün + 30 gün | API → Supabase matches                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (!databaseService.enabled) {
    console.log('❌ Supabase yapılandırılmamış');
    process.exit(1);
  }

  const dates = getDateRange();
  console.log(`📅 İşlenecek tarihler: ${dates[0]} → ${dates[dates.length - 1]} (${dates.length} gün)\n`);

  let totalMatches = 0;
  let totalSaved = 0;

  for (const date of dates) {
    try {
      const response = await footballApi.getFixturesByDate(date);
      const fixtures = response?.response || [];
      
      if (fixtures.length > 0) {
        const saved = await databaseService.upsertMatches(fixtures);
        totalSaved += Array.isArray(saved) ? saved.length : 0;
        totalMatches += fixtures.length;
        console.log(`   ${date}: ${fixtures.length} maç → DB'ye kaydedildi`);
      } else {
        console.log(`   ${date}: maç yok`);
      }
      
      await new Promise(r => setTimeout(r, RATE_MS));
    } catch (error) {
      console.error(`   ❌ ${date}: ${error.message}`);
    }
  }

  // Progress kaydet (opsiyonel - son çalışma zamanı)
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    lastRun: new Date().toISOString(),
    datesProcessed: dates.length,
    totalMatches,
    totalSaved
  }, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Tamamlandı: ${totalMatches} maç işlendi, DB'ye kaydedildi`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
