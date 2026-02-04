// Mock Topluluk Verileri Oluşturucu
// Mock maç için topluluk tahmin istatistikleri oluşturur

const { supabase } = require('../config/supabase');

const MOCK_MATCH_ID = 999999;

// Mock topluluk tahmin verileri
const MOCK_COMMUNITY_DATA = {
  // Skor tahminleri dağılımı
  scorePredictions: {
    '0-0': 12,
    '1-0': 45,
    '0-1': 23,
    '1-1': 67,
    '2-0': 34,
    '0-2': 18,
    '2-1': 89,
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
  
  // Toplam kullanıcı sayısı
  totalUsers: 580,
  
  // En popüler tahminler
  popularPredictions: [
    { type: 'score', value: '2-1', count: 89, percentage: 15.3 },
    { type: 'totalGoals', value: '2-3', count: 234, percentage: 40.3 },
    { type: 'firstGoal', value: 'home', count: 312, percentage: 53.8 },
    { type: 'yellowCards', value: '3-4', count: 234, percentage: 40.3 },
  ],
  
  // Oyuncu tahminleri (en çok tahmin edilenler)
  playerPredictions: {
    goalScorers: [
      { playerId: 9009, playerName: 'Home FWD1', count: 234, percentage: 40.3 },
      { playerId: 9010, playerName: 'Home FWD2', count: 189, percentage: 32.6 },
      { playerId: 8009, playerName: 'Away FWD1', count: 156, percentage: 26.9 },
      { playerId: 9011, playerName: 'Home FWD3', count: 123, percentage: 21.2 },
      { playerId: 8010, playerName: 'Away FWD2', count: 98, percentage: 16.9 },
    ],
    assistProviders: [
      { playerId: 9006, playerName: 'Home MID1', count: 198, percentage: 34.1 },
      { playerId: 9007, playerName: 'Home MID2', count: 167, percentage: 28.8 },
      { playerId: 8006, playerName: 'Away MID1', count: 145, percentage: 25.0 },
      { playerId: 8007, playerName: 'Away MID2', count: 112, percentage: 19.3 },
    ],
    mvp: [
      { playerId: 9009, playerName: 'Home FWD1', count: 267, percentage: 46.0 },
      { playerId: 9007, playerName: 'Home MID2', count: 189, percentage: 32.6 },
      { playerId: 8009, playerName: 'Away FWD1', count: 134, percentage: 23.1 },
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
