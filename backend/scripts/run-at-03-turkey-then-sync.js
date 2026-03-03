#!/usr/bin/env node
/**
 * API kotası 03:00 (Türkiye) = 00:00 UTC'de sıfırlanana kadar bekler,
 * sonra sırayla: 1) Kadrolar  2) Oyuncu ratingleri  günceller.
 *
 * Kullanım: node scripts/run-at-03-turkey-then-sync.js
 * (Şimdi çalıştır; 03:00'a kadar bekleyip sonra run-phased-db-complete.js başlatır)
 */

const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 03:00 Türkiye = 00:00 UTC (gece yarısı UTC)
function getNextMidnightUTC() {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return next;
}

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${h} saat ${m % 60} dk`;
}

async function main() {
  const now = new Date();
  const nextRun = getNextMidnightUTC();
  let waitMs = nextRun - now;

  // Eğer şu an zaten 00:00 UTC sonrasıysa hemen başlat
  if (waitMs <= 0) {
    waitMs = 0;
    console.log('  00:00 UTC gecti, hemen baslatiliyor.');
  }

  const baslamaTR = nextRun.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  API CAGRILARI DURDURULDU                                      ║');
  console.log('║  03:00 (Turkiye) = 00:00 UTC\'de kota sifirlanir.               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Simdi:    ' + now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
  console.log('  Baslama: ' + baslamaTR + ' (03:00 TR / 00:00 UTC)');
  console.log('  Bekleme: ' + formatDuration(waitMs));
  console.log('');
  console.log('  Sira: 1) Kadrolar  2) Oyuncu ratingleri (run-phased-db-complete.js)');
  console.log('  Bu pencereyi kapatmayin; saat gelince otomatik baslayacak.');
  console.log('');

  let lastLog = 0;
  const logInterval = 15 * 60 * 1000; // 15 dk'da bir log
  const timer = setInterval(() => {
    const remaining = nextRun - new Date();
    if (remaining <= 0) {
      clearInterval(timer);
      return;
    }
    if (Date.now() - lastLog >= logInterval) {
      lastLog = Date.now();
      console.log('  [Bekleniyor] ' + formatDuration(remaining) + ' kaldi. Baslama: 03:00 (TR)');
    }
  }, 60 * 1000);

  await new Promise((r) => setTimeout(r, waitMs));
  clearInterval(timer);

  console.log('');
  console.log('  *** 03:00 (TR) / 00:00 UTC - Kadro + Rating guncellemesi basliyor... ***');
  console.log('');

  const phased = path.join(__dirname, 'run-phased-db-complete.js');
  const child = spawn(process.execPath, [phased, '--delay=350'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
  child.on('close', (code) => {
    console.log('');
    console.log('  Phased script cikti:', code);
    process.exit(code === null ? 0 : code);
  });
  child.on('error', (err) => {
    console.error('  Hata:', err.message);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
