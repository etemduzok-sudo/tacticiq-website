// Mock Topluluk Verileri Oluşturucu
// Mock maç için topluluk tahmin istatistikleri oluşturur

const { supabase } = require('../config/supabase');

const MOCK_MATCH_ID = 999999;

// Mock topluluk tahmin verileri - Gerçek mock oyuncu isimleriyle
const MOCK_COMMUNITY_DATA = {
  // Skor tahminleri dağılımı
  scorePredictions: {
    '0-0': 12,
    '1-0': 45,
    '0-1': 23,
    '1-1': 67,
    '2-0': 34,
    '0-2': 18,
    '2-1': 89,  // En popüler
    '1-2': 56,
    '2-2': 43,
    '3-0': 21,
    '0-3': 9,
    '3-1': 78,
    '1-3': 32,
    '3-2': 65,
    '2-3': 28,
    '4-0': 15,
    '0-4': 5,
    '4-1': 54,
    '1-4': 19,
    '4-2': 47,
    '2-4': 16,
    '3-3': 38,
    '4-3': 29,
    '3-4': 12,
    '5+': 25
  },
  
  // Toplam gol tahminleri
  totalGoalsPredictions: {
    '0-1': 89,
    '2-3': 234,
    '4+': 156,
    '0': 45
  },
  
  // İlk yarı skoru tahminleri
  halftimePredictions: {
    '0-0': 145,
    '1-0': 178,  // En popüler
    '0-1': 89,
    '1-1': 112,
    '2-0': 34,
    '0-2': 22
  },
  
  // İlk gol tahminleri
  firstGoalPredictions: {
    'home': 312,
    'away': 198,
    'none': 67
  },
  
  // Kart tahminleri
  cardPredictions: {
    yellowCards: {
      '0-2': 89,
      '3-4': 234,
      '5-6': 156,
      '7+': 67
    },
    redCards: {
      '0': 412,
      '1': 145,
      '2+': 23
    }
  },
  
  // Uzatma süresi tahminleri (dakika)
  extraTimePredictions: {
    '0-2': 45,
    '3-4': 189,
    '5-6': 234,  // En popüler
    '7+': 112
  },
  
  // Toplam kullanıcı sayısı
  totalUsers: 580,
  
  // En popüler tahminler özeti
  popularPredictions: [
    { type: 'score', value: '2-1', count: 89, percentage: 15.3 },
    { type: 'totalGoals', value: '2-3', count: 234, percentage: 40.3 },
    { type: 'halftime', value: '1-0', count: 178, percentage: 30.7 },
    { type: 'firstGoal', value: 'home', count: 312, percentage: 53.8 },
    { type: 'yellowCards', value: '3-4', count: 234, percentage: 40.3 },
    { type: 'extraTime', value: '5-6', count: 234, percentage: 40.3 },
  ],
  
  // Formasyon tahminleri - Mock 999999: atak 3-5-2, defans 3-6-1 en çok seçilmiş
  formationPredictions: {
    attack: {
      '3-5-2': { count: 320, percentage: 55.2 },
      '4-3-3': { count: 234, percentage: 40.3 },
      '4-4-2': { count: 156, percentage: 26.9 },
      '4-2-3-1': { count: 67, percentage: 11.6 },
      '3-4-3': { count: 34, percentage: 5.9 }
    },
    defense: {
      '3-6-1': { count: 290, percentage: 50.0 },
      '4-4-2': { count: 189, percentage: 32.6 },
      '5-4-1': { count: 145, percentage: 25.0 },
      '4-5-1': { count: 112, percentage: 19.3 },
      '5-3-2': { count: 78, percentage: 13.4 }
    }
  },
  
  // Oyuncu tahminleri - Gerçek mock oyuncu isimleriyle (backend lineups'tan)
  playerPredictions: {
    // Gol atacak oyuncular
    goalScorers: [
      { playerId: 1001, playerName: 'A. Yıldız', team: 'home', count: 267, percentage: 46.0 },
      { playerId: 1031, playerName: 'F. Santrafor', team: 'home', count: 198, percentage: 34.1 },
      { playerId: 2001, playerName: 'M. Kaya', team: 'away', count: 178, percentage: 30.7 },
      { playerId: 1002, playerName: 'B. Öztürk', team: 'home', count: 145, percentage: 25.0 },
      { playerId: 2003, playerName: 'C. Demir', team: 'away', count: 123, percentage: 21.2 },
    ],
    // Asist yapacak oyuncular
    assistProviders: [
      { playerId: 1022, playerName: 'O. Sol', team: 'home', count: 212, percentage: 36.6 },
      { playerId: 1001, playerName: 'A. Yıldız', team: 'home', count: 189, percentage: 32.6 },
      { playerId: 2002, playerName: 'E. Şahin', team: 'away', count: 156, percentage: 26.9 },
      { playerId: 1021, playerName: 'O. Merkez', team: 'home', count: 134, percentage: 23.1 },
      { playerId: 2020, playerName: 'O. Sağkanat', team: 'away', count: 98, percentage: 16.9 },
    ],
    // Kart görecek oyuncular
    cardReceivers: [
      { playerId: 2003, playerName: 'C. Demir', team: 'away', cardType: 'yellow', count: 189, percentage: 32.6 },
      { playerId: 1020, playerName: 'O. Sağ', team: 'home', cardType: 'yellow', count: 145, percentage: 25.0 },
      { playerId: 2022, playerName: 'O. Merkez', team: 'away', cardType: 'yellow', count: 134, percentage: 23.1 },
      { playerId: 1011, playerName: 'D. Stoper1', team: 'home', cardType: 'yellow', count: 112, percentage: 19.3 },
      { playerId: 2011, playerName: 'D. Stoper1', team: 'away', cardType: 'red', count: 45, percentage: 7.8 },
    ],
    // Maçın yıldızı (MVP)
    mvp: [
      { playerId: 1001, playerName: 'A. Yıldız', team: 'home', count: 289, percentage: 49.8 },
      { playerId: 1022, playerName: 'O. Sol', team: 'home', count: 156, percentage: 26.9 },
      { playerId: 2001, playerName: 'M. Kaya', team: 'away', count: 89, percentage: 15.3 },
      { playerId: 1031, playerName: 'F. Santrafor', team: 'home', count: 46, percentage: 7.9 },
    ],
    // Oyuncu pozisyon tahminleri - Hangi oyuncu hangi slota en çok atandı
    positionAssignments: {
      // slot index -> en çok atanan oyuncular
      0: [{ playerId: 1000, playerName: 'K. Kaleci', count: 567, percentage: 97.8 }], // GK
      1: [{ playerId: 1013, playerName: 'S. Solbek', count: 345, percentage: 59.5 }], // LB
      2: [{ playerId: 1011, playerName: 'D. Stoper1', count: 456, percentage: 78.6 }], // CB
      3: [{ playerId: 1012, playerName: 'D. Stoper2', count: 423, percentage: 72.9 }], // CB
      4: [{ playerId: 1010, playerName: 'S. Sağbek', count: 389, percentage: 67.1 }], // RB
      5: [{ playerId: 1022, playerName: 'O. Sol', count: 378, percentage: 65.2 }], // LM/CM
      6: [{ playerId: 1021, playerName: 'O. Merkez', count: 456, percentage: 78.6 }], // CM
      7: [{ playerId: 1020, playerName: 'O. Sağ', count: 367, percentage: 63.3 }], // RM/CM
      8: [{ playerId: 1002, playerName: 'B. Öztürk', count: 312, percentage: 53.8 }], // LW
      9: [{ playerId: 1031, playerName: 'F. Santrafor', count: 489, percentage: 84.3 }], // ST
      10: [{ playerId: 1001, playerName: 'A. Yıldız', count: 534, percentage: 92.1 }], // RW
    }
  },
  
  // "Oyundan çıksın" topluluk oyları – Mock 999999: kaleci %26, santrafor (ST) %10
  subOutByPlayer: {
    totalPredictors: 580,
    players: {
      9000: { subOutVotes: 151, replacementName: 'T. Polat' },   // 26% kaleci
      9009: { subOutVotes: 58, replacementName: 'T. Polat' },     // 10% santrafor (3-5-2'de ST slot 9)
    }
  },

  // Güncel canlı tahmin durumu (maç devam ederken)
  liveUpdates: {
    lastUpdate: new Date().toISOString(),
    activeUsers: 127,
    recentPredictions: [
      { userId: 'user_123', type: 'nextGoal', value: 'home', time: new Date(Date.now() - 30000).toISOString() },
      { userId: 'user_456', type: 'nextCard', value: 'away', time: new Date(Date.now() - 45000).toISOString() },
      { userId: 'user_789', type: 'mvp', value: 1001, time: new Date(Date.now() - 60000).toISOString() },
    ]
  }
};

// Topluluk verilerini veritabanına kaydet (veya sadece API'de döndür)
async function createMockCommunityData() {
  console.log('\n📊 Mock Topluluk Verileri Oluşturuluyor...\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Maç ID: ${MOCK_MATCH_ID}`);
  console.log(`Toplam Kullanıcı: ${MOCK_COMMUNITY_DATA.totalUsers}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // En popüler skor tahminleri
  console.log('🏆 En Popüler Skor Tahminleri:');
  const sortedScores = Object.entries(MOCK_COMMUNITY_DATA.scorePredictions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  sortedScores.forEach(([score, count]) => {
    const percentage = ((count / MOCK_COMMUNITY_DATA.totalUsers) * 100).toFixed(1);
    console.log(`   ${score}: ${count} kullanıcı (${percentage}%)`);
  });

  console.log('\n⚽ Toplam Gol Tahminleri:');
  Object.entries(MOCK_COMMUNITY_DATA.totalGoalsPredictions).forEach(([range, count]) => {
    const percentage = ((count / MOCK_COMMUNITY_DATA.totalUsers) * 100).toFixed(1);
    console.log(`   ${range} gol: ${count} kullanıcı (${percentage}%)`);
  });

  console.log('\n🎯 İlk Gol Tahminleri:');
  Object.entries(MOCK_COMMUNITY_DATA.firstGoalPredictions).forEach(([team, count]) => {
    const percentage = ((count / MOCK_COMMUNITY_DATA.totalUsers) * 100).toFixed(1);
    const teamName = team === 'home' ? 'Ev Sahibi' : team === 'away' ? 'Deplasman' : 'Gol Yok';
    console.log(`   ${teamName}: ${count} kullanıcı (${percentage}%)`);
  });

  console.log('\n🟨 Sarı Kart Tahminleri:');
  Object.entries(MOCK_COMMUNITY_DATA.cardPredictions.yellowCards).forEach(([range, count]) => {
    const percentage = ((count / MOCK_COMMUNITY_DATA.totalUsers) * 100).toFixed(1);
    console.log(`   ${range} kart: ${count} kullanıcı (${percentage}%)`);
  });

  console.log('\n👤 En Çok Tahmin Edilen Golcüler:');
  MOCK_COMMUNITY_DATA.playerPredictions.goalScorers.forEach((player, index) => {
    console.log(`   ${index + 1}. ${player.playerName}: ${player.count} kullanıcı (${player.percentage}%)`);
  });

  console.log('\n✅ Topluluk verileri hazır!\n');
  
  return MOCK_COMMUNITY_DATA;
}

// Script çalıştır
if (require.main === module) {
  createMockCommunityData()
    .then(() => {
      console.log('✅ Mock topluluk verileri oluşturuldu!');
      console.log('\n💡 Bu veriler API endpoint\'inde döndürülecek:');
      console.log(`   GET /api/matches/${MOCK_MATCH_ID}/community-stats\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Hata:', error);
      process.exit(1);
    });
}

module.exports = { createMockCommunityData, MOCK_COMMUNITY_DATA };
