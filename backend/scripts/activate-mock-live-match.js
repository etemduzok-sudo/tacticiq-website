// Mock Canlı Maçı Aktif Et
// Mock maçı LIVE durumuna getirir ve canlı eventleri ekler

const { supabase } = require('../config/supabase');

const MOCK_MATCH_ID = 999999;

// Canlı maç durumu (şu an 67. dakika, 2-1 skor)
const LIVE_MATCH_STATE = {
  status: '2H',
  elapsed: 67,
  home_score: 2,
  away_score: 1,
  halftime_home: 1,
  halftime_away: 0,
};

// Canlı eventler (67. dakikaya kadar)
const LIVE_EVENTS = [
  { elapsed: 5, type: 'Goal', team_id: 9999, player_name: 'Home FWD1', assist_name: 'Home MID1', detail: 'Normal Goal' },
  { elapsed: 12, type: 'Card', team_id: 9998, player_name: 'Away DEF1', detail: 'Yellow Card' },
  { elapsed: 23, type: 'Goal', team_id: 9998, player_name: 'Away FWD1', assist_name: 'Away MID1', detail: 'Normal Goal' },
  { elapsed: 28, type: 'Card', team_id: 9999, player_name: 'Home MID2', detail: 'Yellow Card' },
  { elapsed: 35, type: 'Goal', team_id: 9999, player_name: 'Home FWD2', assist_name: 'Home MID2', detail: 'Normal Goal' },
  { elapsed: 45, type: 'Card', team_id: 9998, player_name: 'Away MID2', detail: 'Yellow Card' },
  { elapsed: 52, type: 'subst', team_id: 9999, player_name: 'Home MID1', detail: 'Substitution' },
  { elapsed: 52, type: 'subst', team_id: 9999, player_name: 'Home MID4', detail: 'Substitution' },
  { elapsed: 58, type: 'Goal', team_id: 9998, player_name: 'Away FWD2', assist_name: 'Away MID2', detail: 'Normal Goal' },
  { elapsed: 64, type: 'Card', team_id: 9999, player_name: 'Home DEF1', detail: 'Yellow Card' },
  { elapsed: 67, type: 'Goal', team_id: 9999, player_name: 'Home FWD3', assist_name: 'Home MID2', detail: 'Normal Goal' },
];

async function activateMockLiveMatch() {
  console.log('\n🔴 Mock Canlı Maç Aktif Ediliyor...\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Maç ID: ${MOCK_MATCH_ID}`);
  console.log(`Durum: ${LIVE_MATCH_STATE.status} - ${LIVE_MATCH_STATE.elapsed}'`);
  console.log(`Skor: ${LIVE_MATCH_STATE.home_score}-${LIVE_MATCH_STATE.away_score}`);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Bugünün tarihini al (maç bugün başlamış gibi göster)
    const today = new Date();
    const matchStartTime = new Date(today.getTime() - LIVE_MATCH_STATE.elapsed * 60 * 1000); // Maç X dakika önce başladı

    // Maçı LIVE durumuna getir ve bugünün tarihine güncelle
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        status: LIVE_MATCH_STATE.status,
        status_long: LIVE_MATCH_STATE.status === '2H' ? 'Second Half' : 'First Half',
        elapsed: LIVE_MATCH_STATE.elapsed,
        home_score: LIVE_MATCH_STATE.home_score,
        away_score: LIVE_MATCH_STATE.away_score,
        halftime_home: LIVE_MATCH_STATE.halftime_home,
        halftime_away: LIVE_MATCH_STATE.halftime_away,
        fixture_date: matchStartTime.toISOString(), // Bugünün tarihine güncelle
        fixture_timestamp: Math.floor(matchStartTime.getTime() / 1000),
        updated_at: new Date().toISOString()
      })
      .eq('id', MOCK_MATCH_ID);

    if (matchError) throw matchError;

    console.log('✅ Maç LIVE durumuna getirildi');

    // Mevcut eventleri temizle
    const { error: deleteError } = await supabase
      .from('match_events')
      .delete()
      .eq('match_id', MOCK_MATCH_ID);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️ Event temizleme hatası (normal olabilir):', deleteError.message);
    }

    // Canlı eventleri ekle
    console.log('\n📊 Canlı Eventler Ekleniyor...\n');
    for (const event of LIVE_EVENTS) {
      const eventData = {
        match_id: MOCK_MATCH_ID,
        elapsed: event.elapsed,
        type: event.type,
        team_id: event.team_id,
        player_name: event.player_name,
        assist_name: event.assist_name || null,
        detail: event.detail || null
      };

      const { error: eventError } = await supabase
        .from('match_events')
        .insert(eventData);

      if (eventError) {
        console.error(`   ❌ ${event.elapsed}' - Event eklenemedi:`, eventError.message);
      } else {
        const eventType = event.type === 'Goal' ? '⚽' : event.type === 'Card' ? '🟨' : '🔄';
        console.log(`   ${eventType} ${event.elapsed}' - ${event.player_name}${event.assist_name ? ` (Asist: ${event.assist_name})` : ''}`);
      }
    }

    console.log('\n✅ Mock canlı maç aktif edildi!');
    console.log('\n💡 Şimdi frontend\'de canlı maç sayfasını açabilirsiniz:');
    console.log(`   Maç ID: ${MOCK_MATCH_ID}`);
    console.log('   Canlı eventler ve topluluk verileri görünecek\n');

  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  }
}

// Script çalıştır
if (require.main === module) {
  activateMockLiveMatch()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { activateMockLiveMatch };
