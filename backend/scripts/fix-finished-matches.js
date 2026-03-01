/**
 * Fix Finished Matches - DB'de statüsü hâlâ 1H/2H/HT olan ama başlaması 3.5+ saat önce olan maçları FT yapar.
 * Kaynak: DB'de sync/API güncellemesi kaçan maçlar "canlı" görünmeye devam ediyordu.
 *
 * Kullanım: node scripts/fix-finished-matches.js
 * .env'de SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { supabase } = require('../config/supabase');

const MAX_LIVE_WINDOW_SEC = 3.5 * 60 * 60; // 3.5 saat
const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];

async function fixFinishedMatches() {
  if (!supabase) {
    console.error('❌ Supabase yapılandırılmamış. .env kontrol et.');
    process.exit(1);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoff = nowSec - MAX_LIVE_WINDOW_SEC;

  console.log('\n🔧 Fix Finished Matches – DB\'de eski "canlı" statüleri FT yapıyor...\n');
  console.log('  Şu an (unix):', nowSec);
  console.log('  Kesim (başlama < bu değer → FT):', cutoff, new Date(cutoff * 1000).toISOString());
  console.log('');

  try {
    const { data: stale, error: selectError } = await supabase
      .from('matches')
      .select('id, fixture_timestamp, fixture_date, status, home_team_id, away_team_id')
      .in('status', LIVE_STATUSES)
      .lt('fixture_timestamp', cutoff);

    if (selectError) {
      console.error('❌ Select hatası:', selectError.message);
      process.exit(1);
    }

    if (!stale || stale.length === 0) {
      console.log('✅ Güncellenecek maç yok (tüm canlı statüler gerçekten canlı).');
      process.exit(0);
    }

    console.log(`📋 ${stale.length} maç FT yapılacak:\n`);
    for (const m of stale.slice(0, 20)) {
      console.log(`   ID ${m.id} | ${m.fixture_date || m.fixture_timestamp} | status: ${m.status}`);
    }
    if (stale.length > 20) console.log(`   ... ve ${stale.length - 20} maç daha.\n`);

    const ids = stale.map(m => m.id);
    // Sadece bu 3 alan güncellenir; skor, tarih, takım/lig id'leri vb. dokunulmaz.
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: 'FT',
        status_long: 'Match Finished',
        elapsed: 90,
      })
      .in('id', ids);

    if (updateError) {
      console.error('❌ Update hatası:', updateError.message);
      process.exit(1);
    }

    console.log(`✅ ${ids.length} maç statüsü FT olarak güncellendi.\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
}

fixFinishedMatches();
