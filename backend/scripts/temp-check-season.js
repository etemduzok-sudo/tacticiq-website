require('dotenv').config({ path: __dirname + '/../.env' });
const footballApi = require('../services/footballApi');

async function check() {
  // Süper Lig için mevcut sezon maçlarını kontrol et
  console.log('Süper Lig maçları kontrol ediliyor...');
  
  // 2025-26 sezonu (season: 2025)
  const data = await footballApi.apiRequest('/fixtures', { 
    league: 203, 
    season: 2025,
    last: 5
  });
  
  if (data.response && data.response.length > 0) {
    console.log('Son 5 maç:');
    data.response.forEach(m => {
      const homeTeam = m.teams.home.name;
      const awayTeam = m.teams.away.name;
      const homeGoals = m.goals.home;
      const awayGoals = m.goals.away;
      console.log('  ' + m.fixture.date + ': ' + homeTeam + ' vs ' + awayTeam + ' (' + homeGoals + '-' + awayGoals + ')');
    });
  } else {
    console.log('Maç bulunamadı');
  }
  
  // Gelecek maçlar
  const future = await footballApi.apiRequest('/fixtures', { 
    league: 203, 
    season: 2025,
    next: 5
  });
  
  if (future.response && future.response.length > 0) {
    console.log('\nGelecek 5 maç:');
    future.response.forEach(m => {
      const homeTeam = m.teams.home.name;
      const awayTeam = m.teams.away.name;
      console.log('  ' + m.fixture.date + ': ' + homeTeam + ' vs ' + awayTeam);
    });
  } else {
    console.log('Gelecek maç bulunamadı');
  }
}

check();
