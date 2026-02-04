/**
 * API sayacı sıfırlandıktan sonra (saat 03:00) çalıştırılacak tam senkron
 * 1. Planlanmış maçlar (bugün + 30 gün)
 * 2. Eksik teknik direktörler
 * 3. Takımlar, kadrolar, renkler (lig bazlı)
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
  { name: 'Tüm takımlar maç listesi', file: 'sync-all-teams-matches.js' },
  { name: 'Planlanmış maçlar (tarih)', file: 'sync-planned-matches.js' },
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
