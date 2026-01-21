// ============================================
// LEADERBOARD SNAPSHOT SERVICE
// ============================================
// Günlük, haftalık ve aylık sıralama snapshot'ları alır
// Kullanıcılar geçmiş sıralamaları görebilir
// ============================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let snapshotTimer = null;
let lastDailySnapshot = null;
let lastWeeklySnapshot = null;
let lastMonthlySnapshot = null;

// ============================================
// SNAPSHOT AL
// ============================================
async function takeSnapshot(period = 'daily') {
  try {
    console.log(`📸 Taking ${period} leaderboard snapshot...`);
    
    // Top 100 kullanıcıyı çek
    const { data: users, error: usersError } = await supabase
      .from('user_stats')
      .select(`
        user_id,
        total_points,
        weekly_points,
        monthly_points,
        accuracy_percentage,
        current_streak,
        best_streak,
        total_predictions,
        correct_predictions,
        badges
      `)
      .gt('total_predictions', 0)
      .order('total_points', { ascending: false })
      .limit(100);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return null;
    }
    
    // Kullanıcı bilgilerini al
    const userIds = users.map(u => u.user_id);
    const { data: userProfiles } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);
    
    // Birleştir
    const rankings = users.map((user, index) => {
      const profile = userProfiles?.find(p => p.id === user.user_id) || {};
      return {
        rank: index + 1,
        user_id: user.user_id,
        username: profile.username || 'Unknown',
        avatar_url: profile.avatar_url,
        total_points: user.total_points,
        weekly_points: user.weekly_points,
        monthly_points: user.monthly_points,
        accuracy_percentage: user.accuracy_percentage,
        current_streak: user.current_streak,
        total_predictions: user.total_predictions,
      };
    });
    
    // İstatistikleri hesapla
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('total_predictions, accuracy_percentage')
      .gt('total_predictions', 0);
    
    const totalUsers = statsData?.length || 0;
    const totalPredictions = statsData?.reduce((sum, u) => sum + (u.total_predictions || 0), 0) || 0;
    const avgAccuracy = totalUsers > 0 
      ? statsData.reduce((sum, u) => sum + (u.accuracy_percentage || 0), 0) / totalUsers 
      : 0;
    
    // Tarih bilgileri
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const monthNumber = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Snapshot kaydet
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .upsert({
        snapshot_date: now.toISOString().split('T')[0],
        period: period,
        week_number: weekNumber,
        month_number: monthNumber,
        year: year,
        rankings: rankings,
        total_users: totalUsers,
        total_predictions: totalPredictions,
        average_accuracy: Math.round(avgAccuracy * 100) / 100,
      }, {
        onConflict: 'snapshot_date,period',
      });
    
    if (error) {
      console.error('❌ Error saving snapshot:', error.message);
      return null;
    }
    
    console.log(`✅ ${period} snapshot saved: ${rankings.length} users, ${totalPredictions} predictions`);
    
    return { period, users: rankings.length, totalPredictions };
    
  } catch (error) {
    console.error(`❌ Snapshot error (${period}):`, error.message);
    return null;
  }
}

// Hafta numarası hesapla
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================================
// GEÇMİŞ SNAPSHOT'LARI GETİR
// ============================================
async function getSnapshot(date, period = 'daily') {
  try {
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('snapshot_date', date)
      .eq('period', period)
      .single();
    
    if (error) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching snapshot:', error.message);
    return null;
  }
}

// ============================================
// HAFTALIK SNAPSHOT'LAR
// ============================================
async function getWeeklySnapshots(year, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('period', 'weekly')
      .eq('year', year)
      .order('week_number', { ascending: false })
      .limit(limit);
    
    if (error) {
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching weekly snapshots:', error.message);
    return [];
  }
}

// ============================================
// KULLANICI SIRALAMA GEÇMİŞİ
// ============================================
async function getUserRankHistory(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('snapshot_date, rankings')
      .eq('period', 'daily')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });
    
    if (error || !data) {
      return [];
    }
    
    // Kullanıcının sıralama geçmişini çıkar
    const history = data.map(snapshot => {
      const userRanking = snapshot.rankings?.find(r => r.user_id === userId);
      return {
        date: snapshot.snapshot_date,
        rank: userRanking?.rank || null,
        points: userRanking?.total_points || null,
      };
    }).filter(h => h.rank !== null);
    
    return history;
    
  } catch (error) {
    console.error('Error fetching user rank history:', error.message);
    return [];
  }
}

// ============================================
// OTOMATİK SNAPSHOT SCHEDULER
// ============================================
function checkAndTakeSnapshots() {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentHour = now.getUTCHours();
  const dayOfWeek = now.getUTCDay(); // 0 = Pazar
  const dayOfMonth = now.getUTCDate();
  
  // Günlük snapshot: Her gün 00:00 UTC
  if (currentHour === 0 && lastDailySnapshot !== currentDate) {
    lastDailySnapshot = currentDate;
    takeSnapshot('daily');
  }
  
  // Haftalık snapshot: Pazar günü 00:00 UTC
  if (dayOfWeek === 0 && currentHour === 0 && lastWeeklySnapshot !== currentDate) {
    lastWeeklySnapshot = currentDate;
    takeSnapshot('weekly');
  }
  
  // Aylık snapshot: Ayın 1'i 00:00 UTC
  if (dayOfMonth === 1 && currentHour === 0 && lastMonthlySnapshot !== currentDate) {
    lastMonthlySnapshot = currentDate;
    takeSnapshot('monthly');
  }
}

// ============================================
// ESKİ SNAPSHOT'LARI TEMİZLE
// ============================================
async function cleanupOldSnapshots() {
  try {
    // 30 günden eski günlük snapshot'ları sil
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error } = await supabase
      .from('leaderboard_snapshots')
      .delete()
      .eq('period', 'daily')
      .lt('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0]);
    
    if (error) {
      console.error('Cleanup error:', error.message);
    } else {
      console.log('🧹 Old daily snapshots cleaned up');
    }
    
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

// ============================================
// START/STOP
// ============================================
function startSnapshotService() {
  if (snapshotTimer) {
    console.log('⚠️ Snapshot service already running');
    return;
  }
  
  console.log('📸 Leaderboard snapshot service started');
  console.log('   - Daily snapshots at 00:00 UTC');
  console.log('   - Weekly snapshots on Sunday 00:00 UTC');
  console.log('   - Monthly snapshots on 1st of month 00:00 UTC');
  
  // Her dakika kontrol et
  snapshotTimer = setInterval(checkAndTakeSnapshots, 60 * 1000);
  
  // Her gün temizlik yap
  setInterval(cleanupOldSnapshots, 24 * 60 * 60 * 1000);
  
  // İlk kontrolü hemen yap
  checkAndTakeSnapshots();
}

function stopSnapshotService() {
  if (snapshotTimer) {
    clearInterval(snapshotTimer);
    snapshotTimer = null;
    console.log('⏹️ Snapshot service stopped');
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  startSnapshotService,
  stopSnapshotService,
  takeSnapshot,
  getSnapshot,
  getWeeklySnapshots,
  getUserRankHistory,
  cleanupOldSnapshots,
  getStatus: () => ({
    isRunning: snapshotTimer !== null,
    lastDailySnapshot,
    lastWeeklySnapshot,
    lastMonthlySnapshot,
  }),
};
