#!/usr/bin/env node
/**
 * Zamanlanmış job'ları çalıştırır.
 * - Coach + Renkler + Kadrolar: update-coach-colors-squads.js her 12 saatte bir (--max=1500, API kotası paylaşımı için).
 *
 * Kullanım:
 *   node scripts/run-scheduled-jobs.js
 *   pm2 start scripts/run-scheduled-jobs.js --name tacticiq-jobs
 */

const path = require('path');
const { spawn } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '..');
const COACH_SQUADS_SCRIPT = path.join(__dirname, 'update-coach-colors-squads.js');
const INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 saat
const FIRST_RUN_DELAY_MS = 60 * 1000;    // İlk çalıştırma 1 dk sonra
const MAX_TEAMS_PER_RUN = 1500;          // Rating script ile günlük kotayı paylaşmak için

function runCoachColorsSquads() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [COACH_SQUADS_SCRIPT, `--max=${MAX_TEAMS_PER_RUN}`, '--delay=600'],
      {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        env: { ...process.env },
      }
    );
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`exit ${code}`));
    });
    child.on('error', reject);
  });
}

function schedule() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TacticIQ Zamanlanmış Job\'lar                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`  Coach+Renkler+Kadrolar: her 12 saatte bir (max ${MAX_TEAMS_PER_RUN} takım)`);
  console.log(`  İlk çalıştırma: ${FIRST_RUN_DELAY_MS / 1000} saniye sonra`);
  console.log('');

  const run = () => {
    console.log(`\n[${new Date().toISOString()}] Coach+Renkler+Kadrolar job başlatılıyor...`);
    runCoachColorsSquads()
      .then(() => console.log(`[${new Date().toISOString()}] Coach+Renkler+Kadrolar job bitti.`))
      .catch((e) => console.warn(`[${new Date().toISOString()}] Job hata:`, e.message));
  };

  setTimeout(run, FIRST_RUN_DELAY_MS);
  setInterval(run, INTERVAL_MS);
}

schedule();
