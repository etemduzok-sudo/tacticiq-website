#!/usr/bin/env node
/**
 * Günlük job'ları çalıştırır (cron / Windows Task Scheduler ile kullanılır).
 * - Coach + Renkler + Kadrolar: update-coach-colors-squads.js (--max=1500, API kotası rating script'e kalsın)
 *
 * Örnek cron (her gün 03:00):
 *   0 3 * * * cd /path/to/TacticIQ/backend && node scripts/run-daily-jobs.js
 *
 * Windows Task Scheduler: backend klasöründe "node scripts/run-daily-jobs.js" çalıştır, başlangıç: backend
 */

const path = require('path');
const { spawn } = require('child_process');

const BACKEND_DIR = path.join(__dirname, '..');
const DELAY_MS = 600;
const MAX_TEAMS = 1500;

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, scriptName), ...args], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('');
  console.log('=== RUN DAILY JOBS ===');
  console.log('');

  try {
    console.log('1/1 Coach + Renkler + Kadrolar güncelleniyor (max ' + MAX_TEAMS + ' takım)...');
    await runScript('update-coach-colors-squads.js', [`--max=${MAX_TEAMS}`, `--delay=${DELAY_MS}`]);
    console.log('');
    console.log('=== TAMAMLANDI ===');
  } catch (e) {
    console.error('Hata:', e.message);
    process.exit(1);
  }
}

main();
