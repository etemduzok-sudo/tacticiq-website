/**
 * Planlanmış maç listesini API-Football'dan çekip DB'ye kaydeder
 * Sezonun kalanı için tüm belirlenmiş maçlar (bugün → sezon sonu)
 * 1 API çağrısı ile tüm tarih aralığı (from-to) - minimum API kullanımı
 */

require('dotenv').config();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const path = require('path');
const fs = require('fs');

const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'planned-matches-progress.json');

// Sezon sonu: Avrupa ligleri genelde Haziran, Güney Amerika Aralık
// Bugünden 2026-06-30'a kadar (Avrupa sezonu kapsar)
function getDateRange() {
  const from = new Date();
  const y = from.getFullYear();
  const m = from.getMonth();
  // Şu an Ocak-Haziran arasıysa bu sezon, Temmuz+ ise gelecek sezon
  const seasonEnd = (m >= 6) ? new Date(y + 1, 5, 30) : new Date(y, 5, 30); // 30 Haziran
  return {
    from: from.toISOString().split('T')[0],
    to: seasonEnd.toISOString().split('T')[0],
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PLANLANMIŞ MAÇLAR - SEZONUN KALANI (1 API çağrısı!)           ║');
  console.log('║   Bugün → sezon sonu | from-to → Supabase                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (!databaseService.enabled) {
    console.log('❌ Supabase yapılandırılmamış');
    process.exit(1);
  }

  const { from, to } = getDateRange();
  console.log(`📅 Tarih aralığı: ${from} → ${to} (1 API çağrısı)\n`);

  let totalMatches = 0;
  let totalSaved = 0;

  try {
    const response = await footballApi.getFixturesByDateRange(from, to);
    const fixtures = response?.response || [];
    
    if (fixtures.length > 0) {
      const saved = await databaseService.upsertMatches(fixtures, { quiet: true, bulk: true });
      totalSaved = Array.isArray(saved) ? saved.length : fixtures.length;
      totalMatches = fixtures.length;
      console.log(`   ✅ ${totalMatches} maç tek çağrıda çekildi → DB'ye kaydedildi`);
    } else {
      console.log(`   Bu aralıkta maç bulunamadı`);
    }
  } catch (error) {
    console.error(`   ❌ Hata: ${error.message}`);
  }

  // Progress kaydet (opsiyonel - son çalışma zamanı)
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    lastRun: new Date().toISOString(),
    dateRange: { from, to },
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
