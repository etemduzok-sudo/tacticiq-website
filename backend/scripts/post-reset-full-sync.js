/**
 * API sayacı sıfırlandıktan sonra (saat 03:00) çalıştırılacak tam senkron
 * 
 * SIRALAMA (minimum API kullanımı):
 * 1. Planlanmış maçlar - 1 API çağrısı (bugün → sezon sonu, from-to)
 * 2. Lig bazlı maç listesi - ~130 API (geçmiş + sezon maçları)
 * 3. Teknik direktörler - eksik kadrolar için
 * 4. Lig/Takım/Kadro - takımlar, renkler, kadrolar
 * 
 * Uygulama DB-first: /date ve /team/season route'ları önce DB'den okur, API fallback
 * 
 * Windows Görev Zamanlayıcı: 03:00 her gün
 *   Program: node
 *   Argüman: c:\TacticIQ\backend\scripts\post-reset-full-sync.js
 *   Başlangıç: c:\TacticIQ\backend
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { spawn } = require('child_process');
const path = require('path');

const SCRIPTS = [
  { name: 'Planlanmış maçlar (1 API, sezon sonuna kadar)', file: 'sync-planned-matches.js' },
  { name: 'Tüm takımlar maç listesi (lig bazlı)', file: 'sync-all-teams-matches.js' },
  { name: 'Teknik direktörler', file: 'backfill-coaches.js' },
  { name: 'Lig/Takım/Kadro', file: 'sync-all-world-leagues.js' },
];

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
    child.on('error', reject);
  });
}

async function main() {
  const start = Date.now();
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   API SIFIRLAMA SONRASI - TAM SENKRON                           ║');
  console.log('║   ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  for (const { name, file } of SCRIPTS) {
    const scriptPath = path.join(__dirname, file);
    console.log(`\n▶ ${name} (${file})...`);
    try {
      await runScript(scriptPath);
      console.log(`   ✅ ${name} tamamlandı`);
    } catch (err) {
      console.error(`   ❌ ${name} hata:`, err.message);
    }
  }

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Tüm senkron işlemleri bitti (${Math.floor(elapsed / 60)}dk ${elapsed % 60}sn)`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
