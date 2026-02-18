/**
 * Test ortamı oluştur: DB'deki gerçek Fenerbahçe + Beşiktaş maçlarından
 * 10 test maçı üret (3 geçmiş + 4 canlı + 3 yaklaşan)
 * Gerçek takım kadroları, oyuncu rating'leri korunur - sadece tarih/statü değişir
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { supabase } = require('../config/supabase');

const FENER_ID = 611;
const BESIKTAS_ID = 549;
const TEST_IDS = [900001, 900002, 900003, 900004, 900005, 900006, 900007, 900008, 900009, 900010];

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  TEST ORTAMI OLUŞTUR                                    ║');
  console.log('║  Fenerbahçe + Beşiktaş gerçek maçlarından 10 test maçı  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (!supabase) {
    console.error('❌ Supabase bağlantısı yok!');
    process.exit(1);
  }

  try {
    // 1. Mevcut test maçlarını sil (tablo yoksa upsert yeterli)
    try {
      await supabase.from('test_matches').delete().in('id', TEST_IDS);
      console.log('🗑️ Eski test maçları temizlendi');
    } catch (_) {
      console.log('⚠️ test_matches temizlenemedi (tablo yok olabilir), devam...');
    }

    // 2. Fenerbahçe'dan 5 FT maçı çek
    const { data: fbMatches, error: fbErr } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .or(`home_team_id.eq.${FENER_ID},away_team_id.eq.${FENER_ID}`)
      .eq('status', 'FT')
      .order('fixture_timestamp', { ascending: false })
      .limit(5);

    if (fbErr || !fbMatches?.length) {
      console.error('❌ Fenerbahçe maçları bulunamadı:', fbErr?.message || '0 maç');
      process.exit(1);
    }

    // 3. Beşiktaş'tan 5 FT maçı çek (Fenerbahçe ile çakışanları hariç tut)
    const fbMatchIds = new Set(fbMatches.map(m => m.id));
    const { data: bjkMatches, error: bjkErr } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .or(`home_team_id.eq.${BESIKTAS_ID},away_team_id.eq.${BESIKTAS_ID}`)
      .eq('status', 'FT')
      .order('fixture_timestamp', { ascending: false })
      .limit(10);

    const bjkFiltered = (bjkMatches || []).filter(m => !fbMatchIds.has(m.id)).slice(0, 5);
    if (bjkFiltered.length === 0) {
      console.error('❌ Beşiktaş maçları bulunamadı (Fenerbahçe ile çakışma olabilir)');
    }

    const sourceMatches = [...fbMatches, ...bjkFiltered].slice(0, 10);
    console.log(`📥 ${fbMatches.length} Fenerbahçe + ${bjkFiltered.length} Beşiktaş maçı alındı\n`);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(20, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0, 0);

    // 4. Test maçları oluştur
    const testRecords = [];
    const statusConfig = [
      { status: 'FT', elapsed: 90, date: yesterday, desc: 'Geçmiş' },
      { status: 'FT', elapsed: 90, date: yesterday, desc: 'Geçmiş' },
      { status: 'FT', elapsed: 90, date: yesterday, desc: 'Geçmiş' },
      { status: '1H', elapsed: 25, date: now, desc: 'Canlı 1Y' },
      { status: '2H', elapsed: 67, date: now, desc: 'Canlı 2Y' },
      { status: 'HT', elapsed: 45, date: now, desc: 'Canlı Devre' },
      { status: '2H', elapsed: 52, date: now, desc: 'Canlı 2Y' },
      { status: 'NS', elapsed: null, date: tomorrow, desc: 'Yaklaşan' },
      { status: 'NS', elapsed: null, date: tomorrow, desc: 'Yaklaşan' },
      { status: 'NS', elapsed: null, date: tomorrow, desc: 'Yaklaşan' },
    ];

    for (let i = 0; i < sourceMatches.length && i < 10; i++) {
      const src = sourceMatches[i];
      const cfg = statusConfig[i];
      const ts = Math.floor(cfg.date.getTime() / 1000);

      const record = {
        id: TEST_IDS[i],
        source_match_id: src.id,
        league_id: src.league_id,
        season: src.season,
        round: src.round,
        home_team_id: src.home_team_id,
        away_team_id: src.away_team_id,
        fixture_date: cfg.date.toISOString(),
        fixture_timestamp: ts,
        timezone: src.timezone || 'UTC',
        status: cfg.status,
        status_long: cfg.status === 'FT' ? 'Match Finished' : cfg.status === '1H' ? 'First Half' : cfg.status === '2H' ? 'Second Half' : cfg.status === 'HT' ? 'Halftime' : 'Not Started',
        elapsed: cfg.elapsed,
        home_score: cfg.status === 'FT' ? (src.home_score ?? 1) : (cfg.status === 'NS' ? null : src.home_score ?? 0),
        away_score: cfg.status === 'FT' ? (src.away_score ?? 0) : (cfg.status === 'NS' ? null : src.away_score ?? 0),
        halftime_home: cfg.status !== 'NS' ? (src.halftime_home ?? 0) : null,
        halftime_away: cfg.status !== 'NS' ? (src.halftime_away ?? 0) : null,
        fulltime_home: cfg.status === 'FT' ? src.home_score : null,
        fulltime_away: cfg.status === 'FT' ? src.away_score : null,
        extratime_home: null,
        extratime_away: null,
        penalty_home: null,
        penalty_away: null,
        venue_name: src.venue_name,
        venue_city: src.venue_city,
        referee: src.referee,
        has_lineups: src.has_lineups || false,
        has_statistics: src.has_statistics || false,
        has_events: src.has_events || false,
        lineups: src.lineups || null,
      };
      testRecords.push(record);
      console.log(`  ${TEST_IDS[i]}: ${src.home_team?.name || '?'} vs ${src.away_team?.name || '?'} → ${cfg.desc} (${cfg.status})`);
    }

    // 5. test_matches tablosuna ekle
    const { error: insErr } = await supabase.from('test_matches').upsert(testRecords, { onConflict: 'id' });

    if (insErr) {
      console.error('\n❌ Test maçları eklenemedi:', insErr.message);
      console.error('   Not: Önce "npx supabase db push" veya migration çalıştırın.');
      process.exit(1);
    }

    console.log('\n✅ Test ortamı oluşturuldu!');
    console.log('   TEST_MODE=true ile backend başlatın.');
    console.log('   Fenerbahçe ve Beşiktaş favorilere ekleyin.\n');
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
