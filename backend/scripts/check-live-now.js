// Şu an canlı maçları kontrol et
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const footballApi = require('../services/footballApi');

async function main() {
  console.log('🔴 Canlı maçları kontrol ediyorum...\n');
  
  try {
    const data = await footballApi.getLiveMatches();
    const matches = data.response || [];
    
    console.log(`📊 Toplam ${matches.length} canlı maç\n`);
    
    if (matches.length === 0) {
      console.log('  Şu an canlı maç yok.');
    } else {
      for (const m of matches) {
        console.log(`  ID: ${m.fixture.id}`);
        console.log(`  ${m.teams.home.name} vs ${m.teams.away.name}`);
        console.log(`  Lig: ${m.league.name} (${m.league.country})`);
        console.log(`  Statü: ${m.fixture.status.short} (${m.fixture.status.long}) - ${m.fixture.status.elapsed}'`);
        console.log(`  Skor: ${m.goals?.home ?? 0} - ${m.goals?.away ?? 0}`);
        console.log('');
      }
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }
  
  process.exit(0);
}

main();
