#!/usr/bin/env node
/**
 * DB senkronizasyonu + her 5 dakikada bir rapor.
 * - Raporu arka planda çalıştırır (backend/data/db-status-report.txt her 5 dk güncellenir).
 * - run-phased-db-complete.js ile koç/renk/kadro ve rating %100'e gider.
 *
 * Kullanım:
 *   node scripts/run-db-sync-and-report.js           # Rapor sürekli, sync bir kez
 *   node scripts/run-db-sync-and-report.js --loop     # Sync bittikten 6 saat sonra tekrar çalıştır
 *
 * Rapor dosyası: backend/data/db-status-report.txt
 * Tahmini süre raporun "OZET" bölümünde "TAHMINI SURE %100'E: ~X saat" olarak yazar.
 */

const path = require('path');
const { spawn } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '..');
const REPORT_SCRIPT = path.join(__dirname, 'db-status-report-every-5min.js');
const SYNC_SCRIPT = path.join(__dirname, 'update-coach-colors-squads.js');
const BATCH_SIZE = 200;
const BATCH_DELAY_MS = 2 * 60 * 1000; // Batch arası 2 dk (rapor güncellensin)

let reportChild = null;

function startReport() {
  reportChild = spawn(process.execPath, [REPORT_SCRIPT], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    env: { ...process.env },
  });
  reportChild.on('error', (err) => console.error('Rapor process hatasi:', err));
  reportChild.on('exit', (code) => {
    if (code !== 0 && code !== null) console.warn('Rapor process cikti:', code);
  });
}

function runSyncBatch() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SYNC_SCRIPT, `--max=${BATCH_SIZE}`, '--delay=400'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      env: { ...process.env },
    });
    child.on('close', (code) => resolve(code));
    child.on('error', (err) => {
      console.error('Sync hatasi:', err);
      resolve(1);
    });
  });
}

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TacticIQ DB Sync + Rapor (her 5 dk)                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  • Rapor: backend/data/db-status-report.txt (her 5 dakikada guncellenir)');
  console.log('  • Sync: update-coach-colors-squads.js (filtre yok, tum eksik takimlar)');
  console.log('  • Her batch: ' + BATCH_SIZE + ' takim, 2 dk arayla tekrar.');
  console.log('');

  startReport();

  await new Promise((r) => setTimeout(r, 4000));

  do {
    console.log('\n[Sync] update-coach-colors-squads.js baslatiliyor (max ' + BATCH_SIZE + ' takim)...\n');
    const code = await runSyncBatch();
    console.log('\n[Sync] batch bitti (cikis: ' + code + '). 2 dk sonra tekrar...\n');
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  } while (true);
}

process.on('SIGINT', () => {
  if (reportChild) {
    reportChild.kill('SIGINT');
  }
  process.exit(0);
});

main().catch((e) => {
  console.error(e);
  if (reportChild) reportChild.kill();
  process.exit(1);
});
