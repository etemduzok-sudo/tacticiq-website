/**
 * TacticIQ - Oyuncu Rating Güncelleyici (Scheduler)
 * =====================================================
 * Haftalık otomatik güncelleme: Her Pazartesi 03:00 (Türkiye saati)
 * 
 * Yaptığı işler:
 * 1. Tüm liglerdeki oyuncu rating'lerini güncelle
 * 2. Alt özellikleri (pace, shooting, vb.) hesapla
 * 3. Form puanlarını son 5 maça göre güncelle
 * 4. Kullanıcı oylarını formüle dahil et (gelecek özellik)
 */

const cron = require('node-cron');
const path = require('path');

// Güncelleme scripti (DB-FIRST yaklaşım)
const {
  processAllTeamsFromDB,
  SUPPORTED_LEAGUES,
  CURRENT_SEASON,
} = require('../scripts/update-all-player-ratings');

// Scheduler durumu
let isRunning = false;
let lastRunTime = null;
let lastRunStats = null;

/**
 * Haftalık tam güncelleme (tüm ligler)
 * Her Pazartesi 03:00 Türkiye saati (UTC+3 = 00:00 UTC)
 */
const weeklyFullUpdate = cron.schedule('0 0 * * 1', async () => {
  if (isRunning) {
    console.log('⚠️ Önceki güncelleme hala çalışıyor, atlanıyor...');
    return;
  }
  
  console.log('🌙 Haftalık tam güncelleme başladı (DB-FIRST)...');
  isRunning = true;
  
  try {
    // DB'den tüm takımları işle, API stats çekme (false)
    lastRunStats = await processAllTeamsFromDB(false, CURRENT_SEASON);
    lastRunTime = new Date();
    console.log('✅ Haftalık güncelleme tamamlandı');
  } catch (error) {
    console.error('❌ Haftalık güncelleme hatası:', error);
  } finally {
    isRunning = false;
  }
}, {
  scheduled: false, // Manuel başlatılacak
  timezone: 'Europe/Istanbul',
});

/**
 * Günlük öncelikli lig güncellemesi (API kullanmadan – pozisyon varsayılanı)
 * Her gün 04:00 Türkiye saati
 */
const dailyPriorityUpdate = cron.schedule('0 1 * * *', async () => {
  if (isRunning) {
    console.log('⚠️ Önceki güncelleme hala çalışıyor, atlanıyor...');
    return;
  }
  
  console.log('🌅 Günlük öncelikli güncelleme başladı (DB-FIRST, API yok)...');
  isRunning = true;
  
  try {
    lastRunStats = await processAllTeamsFromDB(false, CURRENT_SEASON);
    lastRunTime = new Date();
    console.log('✅ Günlük güncelleme tamamlandı');
  } catch (error) {
    console.error('❌ Günlük güncelleme hatası:', error);
  } finally {
    isRunning = false;
  }
}, {
  scheduled: false,
  timezone: 'Europe/Istanbul',
});

/**
 * Haftalık API'li rating güncellemesi (API hakkı kullanır – gerçek istatistik + game rating)
 * Her Pazar 05:00 Türkiye saati (02:00 UTC) – yarın da çalışır, API kotası burada harcanır
 */
const weeklyApiRatingUpdate = cron.schedule('0 2 * * 0', async () => {
  if (isRunning) {
    console.log('⚠️ Önceki güncelleme hala çalışıyor, API güncellemesi atlanıyor...');
    return;
  }
  
  console.log('📡 Haftalık API\'li rating güncellemesi başladı (istatistik + game rating)...');
  isRunning = true;
  
  try {
    lastRunStats = await processAllTeamsFromDB(true, CURRENT_SEASON);
    lastRunTime = new Date();
    console.log('✅ API\'li rating güncellemesi tamamlandı', lastRunStats?.apiCalls ? `(${lastRunStats.apiCalls} API çağrısı)` : '');
  } catch (error) {
    console.error('❌ API\'li rating güncellemesi hatası:', error);
  } finally {
    isRunning = false;
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul',
});

/**
 * Scheduler'ı başlat
 */
function startScheduler() {
  console.log('⏰ Oyuncu Rating Scheduler başlatılıyor...');
  console.log('   📅 Haftalık (API yok): Her Pazartesi 00:00 UTC');
  console.log('   🌅 Günlük (API yok): Her gün 04:00 TR');
  console.log('   📡 Haftalık API\'li rating: Her Pazar 05:00 TR (API hakkı kullanılır)');
  
  weeklyFullUpdate.start();
  dailyPriorityUpdate.start();
  weeklyApiRatingUpdate.start();
  
  console.log('✅ Scheduler aktif');
}

/**
 * Scheduler'ı durdur
 */
function stopScheduler() {
  weeklyFullUpdate.stop();
  dailyPriorityUpdate.stop();
  weeklyApiRatingUpdate.stop();
  console.log('⏹️ Scheduler durduruldu');
}

/**
 * Manuel güncelleme tetikle
 */
async function triggerManualUpdate(fetchApiStats = false) {
  if (isRunning) {
    return { success: false, message: 'Güncelleme zaten çalışıyor' };
  }
  
  isRunning = true;
  
  try {
    // DB'den tüm takımları işle
    lastRunStats = await processAllTeamsFromDB(fetchApiStats, CURRENT_SEASON);
    lastRunTime = new Date();
    return { success: true, message: 'Tüm takımlar güncellendi (DB-FIRST)', stats: lastRunStats };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    isRunning = false;
  }
}

/**
 * Scheduler durumunu al
 */
function getSchedulerStatus() {
  return {
    isRunning,
    lastRunTime,
    lastRunStats,
    supportedLeagues: Object.keys(SUPPORTED_LEAGUES).length,
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  triggerManualUpdate,
  getSchedulerStatus,
  weeklyFullUpdate,
  dailyPriorityUpdate,
  weeklyApiRatingUpdate,
};
