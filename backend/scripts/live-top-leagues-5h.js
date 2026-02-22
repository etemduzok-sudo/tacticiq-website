#!/usr/bin/env node
// Önümüzdeki 5 saat - SADECE en üst lig erkek takımları (top 5 Avrupa + Süper Lig + Primeira + Eredivisie + Arjantin/Brezilya 1. lig)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const footballApi = require('../services/footballApi');

const { isTopLeague, isExcluded } = require('../utils/liveMatchFilter');

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

async function main() {
  const now = Math.floor(Date.now() / 1000);
  const today = toDateStr(new Date());
  const tomorrow = toDateStr(new Date(Date.now() + 86400000));

  let liveNow = [];
  let allFixtures = [];
  try {
    const [live, d1, d2] = await Promise.all([
      footballApi.getLiveMatches(),
      footballApi.getFixturesByDate(today),
      footballApi.getFixturesByDate(tomorrow),
    ]);
    liveNow = (live.response || []).filter(m => !isExcluded(m) && isTopLeague(m.league?.name));
    allFixtures = [...(d1.response || []), ...(d2.response || [])].filter(m => !isExcluded(m) && isTopLeague(m.league?.name));
  } catch (e) {
    console.error('API hatası:', e.message);
    process.exit(1);
  }

  console.log('\n📅 Önümüzdeki 5 saat - SADECE en üst lig erkek takımları:\n');

  for (let h = 0; h <= 5; h++) {
    let teams = ['-', '-'];
    if (h === 0 && liveNow.length > 0) {
      const m = liveNow[0];
      teams = [m.teams?.home?.name || '?', m.teams?.away?.name || '?'];
    } else {
      const start = now + h * 3600;
      const end = now + (h + 1) * 3600;
      const inWindow = allFixtures.filter((m) => {
        const ts = m.fixture?.timestamp || 0;
        return ts >= start && ts < end && m.fixture?.status?.short === 'NS';
      });
      if (inWindow.length > 0) {
        const m = inWindow[0];
        teams = [m.teams?.home?.name || '?', m.teams?.away?.name || '?'];
      }
    }
    const label = h === 0 ? 'Şu an' : `${h} saat sonra`;
    console.log(`  ${label}: ${teams[0]} vs ${teams[1]}`);
  }
  console.log('');
  process.exit(0);
}

main();
