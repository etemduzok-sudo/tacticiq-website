#!/usr/bin/env node
/**
 * Watchdog Script - Squad Sync Script'i Sürekli Çalışır Tutar
 * 
 * Bu script:
 * - Her 30 saniyede bir squad sync script'inin çalışıp çalışmadığını kontrol eder
 * - Script durmuşsa otomatik olarak yeniden başlatır
 * - İlerlemeyi takip eder ve loglar
 * - API limitine yaklaşıldığında uyarır
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'sync-full-squads-with-ratings-2025.js');
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'sync-squads-progress.json');
const RESULT_FILE = path.join(__dirname, '..', 'data', 'sync-squads-result.json');
const CHECK_INTERVAL = 30000; // 30 saniye
const MAX_IDLE_TIME = 120000; // 2 dakika (script hiç ilerleme yapmazsa yeniden başlat)

let scriptProcess = null;
let lastProgressUpdate = Date.now();
let lastStats = null;
let restartCount = 0;

/**
 * Script'i başlat
 */
function startScript() {
  if (scriptProcess && !scriptProcess.killed) {
    console.log('⚠️ Script zaten çalışıyor');
    return;
  }

  console.log(`\n🚀 Script başlatılıyor... (${new Date().toLocaleString('tr-TR')})`);
  restartCount++;
  
  scriptProcess = spawn('node', [SCRIPT_PATH], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  scriptProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output.trim());
  });

  scriptProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`❌ [ERROR] ${error.trim()}`);
  });

  scriptProcess.on('exit', (code) => {
    console.log(`\n⚠️ Script durdu (exit code: ${code})`);
    scriptProcess = null;
    
    // Script başarıyla tamamlandıysa (code 0) tekrar başlatma
    if (code === 0) {
      console.log('✅ Script başarıyla tamamlandı!');
      checkCompletion();
    } else {
      console.log('🔄 Script hata ile durdu, yeniden başlatılacak...');
    }
  });

  console.log(`✅ Script başlatıldı (PID: ${scriptProcess.pid})`);
}

/**
 * İlerleme dosyasını kontrol et
 */
function checkProgress() {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) {
      // İlerleme dosyası yoksa script çalışmıyor demektir
      return null;
    }

    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    const now = Date.now();
    const updateTime = new Date(progress.updatedAt).getTime();
    const age = now - updateTime;

    // İlerleme güncel mi? (2 dakikadan eski değilse)
    if (age < MAX_IDLE_TIME) {
      lastProgressUpdate = updateTime;
      return progress;
    }

    // İlerleme eski, script takılmış olabilir
    console.log(`⚠️ İlerleme dosyası eski (${Math.round(age / 1000)}s), script takılmış olabilir`);
    return null;
  } catch (error) {
    console.error(`❌ İlerleme dosyası okunamadı: ${error.message}`);
    return null;
  }
}

/**
 * Script tamamlanmış mı kontrol et
 */
function checkCompletion() {
  try {
    if (fs.existsSync(RESULT_FILE)) {
      const result = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
      console.log('\n' + '═'.repeat(70));
      console.log('📊 SCRIPT TAMAMLANDI!');
      console.log('═'.repeat(70));
      console.log(`   Toplam süre: ${Math.floor(result.duration / 60)} dakika ${result.duration % 60} saniye`);
      console.log(`   API istekleri: ${result.stats.apiRequests}/7300`);
      console.log(`   İşlenen lig: ${result.stats.leaguesProcessed}`);
      console.log(`   İşlenen takım: ${result.stats.teamsProcessed}`);
      console.log(`   Kaydedilen kadro: ${result.stats.squadsProcessed}`);
      console.log(`   İşlenen oyuncu: ${result.stats.playersProcessed}`);
      console.log(`   Rating'li oyuncu: ${result.stats.playersWithRatings}`);
      console.log(`   Teknik direktör: ${result.stats.coachesProcessed}`);
      console.log(`   Tamamlanma zamanı: ${result.completedAt}`);
      console.log('═'.repeat(70) + '\n');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * İstatistikleri göster
 */
function showStats(progress) {
  if (!progress) return;

  const stats = progress.stats;
  const isNew = !lastStats || JSON.stringify(stats) !== JSON.stringify(lastStats);

  if (isNew) {
    console.log('\n📊 İLERLEME RAPORU:');
    console.log('═══════════════════════════════════');
    console.log(`Lig: ${progress.lastProcessedIndex + 1}/14`);
    console.log(`API İstekleri: ${stats.apiRequests}/7300 (${Math.round(stats.apiRequests / 73)}%)`);
    console.log(`İşlenen Takım: ${stats.teamsProcessed}`);
    console.log(`Kaydedilen Kadro: ${stats.squadsProcessed}`);
    console.log(`İşlenen Oyuncu: ${stats.playersProcessed}`);
    console.log(`Rating'li Oyuncu: ${stats.playersWithRatings}`);
    console.log(`Teknik Direktör: ${stats.coachesProcessed}`);
    console.log(`Hatalar: ${stats.errors.length}`);
    console.log(`Son Güncelleme: ${new Date(progress.updatedAt).toLocaleString('tr-TR')}`);
    console.log(`Yeniden Başlatma: ${restartCount} kez`);
    console.log('═══════════════════════════════════\n');

    lastStats = JSON.parse(JSON.stringify(stats));
  }
}

/**
 * Ana kontrol döngüsü
 */
function watch() {
  // Script çalışıyor mu?
  if (!scriptProcess || scriptProcess.killed) {
    console.log('⚠️ Script çalışmıyor, başlatılıyor...');
    startScript();
    return;
  }

  // İlerleme kontrolü
  const progress = checkProgress();
  
  if (progress) {
    showStats(progress);
    
    // API limit kontrolü
    if (progress.stats.apiRequests >= 7200) {
      console.log('⚠️ API limit yaklaşıyor! Script durdurulacak.');
      if (scriptProcess) {
        scriptProcess.kill('SIGTERM');
      }
      return;
    }
  } else {
    // İlerleme yok, script takılmış olabilir
    const now = Date.now();
    const idleTime = now - lastProgressUpdate;
    
    if (idleTime > MAX_IDLE_TIME) {
      console.log(`⚠️ Script ${Math.round(idleTime / 1000)}s'dir ilerleme yapmıyor, yeniden başlatılıyor...`);
      if (scriptProcess) {
        scriptProcess.kill('SIGTERM');
        scriptProcess = null;
      }
      setTimeout(() => startScript(), 5000);
      return;
    }
  }

  // Tamamlanma kontrolü
  if (checkCompletion()) {
    console.log('✅ Script başarıyla tamamlandı, watchdog durduruluyor.');
    process.exit(0);
  }
}

// İlk başlatma
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   WATCHDOG - Squad Sync Script Monitor                         ║');
console.log('║   Script sürekli çalışır tutulacak                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

startScript();

// Her 30 saniyede bir kontrol et
const watchInterval = setInterval(watch, CHECK_INTERVAL);

// İlk kontrolü hemen yap
setTimeout(watch, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Watchdog durduruluyor...');
  if (scriptProcess) {
    scriptProcess.kill('SIGTERM');
  }
  clearInterval(watchInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️ Watchdog durduruluyor...');
  if (scriptProcess) {
    scriptProcess.kill('SIGTERM');
  }
  clearInterval(watchInterval);
  process.exit(0);
});
