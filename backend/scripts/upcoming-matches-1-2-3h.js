/**
 * 1, 2 ve 3 saat içinde başlayacak GERÇEK maçları API'den listeler.
 * Favori takım eklemek için takım isimlerini verir.
 *
 * Kullanım: node backend/scripts/upcoming-matches-1-2-3h.js
 * (backend klasöründen: node scripts/upcoming-matches-1-2-3h.js)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const footballApi = require('../services/footballApi');

const MS_PER_HOUR = 60 * 60 * 1000;

function toLocalISO(d) {
  const t = new Date(d);
  return t.toISOString().replace('Z', '') + ' (UTC)';
}

async function main() {
  const now = Date.now();
  const in1h = now + 1 * MS_PER_HOUR;
  const in2h = now + 2 * MS_PER_HOUR;
  const in3h = now + 3 * MS_PER_HOUR;

  const bucket1 = []; // 0–1 saat içinde başlayacak
  const bucket2 = []; // 1–2 saat
  const bucket3 = []; // 2–3 saat

  const today = new Date();
  const dateToday = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateTomorrow = tomorrow.toISOString().slice(0, 10);

  console.log('\n⏱️  Şu an (UTC):', toLocalISO(now));
  console.log('📅 Bugün:', dateToday, '| Yarın:', dateTomorrow);
  console.log('');

  try {
    const [dataToday, dataTomorrow] = await Promise.all([
      footballApi.getFixturesByDate(dateToday),
      footballApi.getFixturesByDate(dateTomorrow),
    ]);

    const all = [
      ...(dataToday.response || []),
      ...(dataTomorrow.response || []),
    ];

    for (const m of all) {
      const fixture = m.fixture;
      if (!fixture || !fixture.date) continue;
      const startMs = new Date(fixture.date).getTime();
      if (startMs < now) continue; // geçmiş maç

      const home = m.teams?.home?.name || '?';
      const away = m.teams?.away?.name || '?';
      const league = m.league?.name || '?';
      const homeId = m.teams?.home?.id;
      const awayId = m.teams?.away?.id;
      const fixtureId = fixture.id;

      const entry = {
        home,
        away,
        league,
        homeId,
        awayId,
        fixtureId,
        start: startMs,
        startISO: fixture.date,
      };

      if (startMs < in1h) bucket1.push(entry);
      else if (startMs < in2h) bucket2.push(entry);
      else if (startMs < in3h) bucket3.push(entry);
    }

    // Sırala
    [bucket1, bucket2, bucket3].forEach(b => b.sort((a, b) => a.start - b.start));

    const fmt = (arr, label) => {
      if (arr.length === 0) {
        console.log(`\n🔹 ${label}: (maç yok)`);
        return;
      }
      console.log(`\n🔹 ${label}:`);
      arr.forEach(({ home, away, league, startISO }) => {
        console.log(`   ${home} – ${away}  (${league})  ${startISO}`);
      });
      const teams = new Set();
      arr.forEach(({ home, away }) => { teams.add(home); teams.add(away); });
      console.log(`   → Favori için takım isimleri: ${[...teams].join(', ')}`);
    };

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  GERÇEK MAÇLAR – 1 / 2 / 3 SAAT İÇİNDE BAŞLAYACAK');
    console.log('═══════════════════════════════════════════════════════════');

    fmt(bucket1, '1 saat içinde başlayacak');
    fmt(bucket2, '2 saat içinde başlayacak');
    fmt(bucket3, '3 saat içinde başlayacak');

    const allTeams = new Set();
    [...bucket1, ...bucket2, ...bucket3].forEach(({ home, away }) => {
      allTeams.add(home);
      allTeams.add(away);
    });
    if (allTeams.size > 0) {
      console.log('\n📌 Tüm takım isimleri (favori eklemek için):');
      console.log('   ' + [...allTeams].sort().join(', '));
    }
    console.log('');

  } catch (err) {
    console.error('Hata:', err.message || err);
    process.exit(1);
  }
}

main();
