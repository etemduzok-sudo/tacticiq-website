#!/usr/bin/env node
/**
 * Yakında başlayacak maçları bul (1 saat, 2 saat, 3 saat içinde)
 * İlgilendiğimiz liglerden örnekler
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const footballApi = require('../services/footballApi');

// İlgilendiğimiz ligler
const PRIORITY_LEAGUES = [
  { id: 203, name: 'Süper Lig', country: 'Turkey' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 61, name: 'Ligue 1', country: 'France' },
];

async function findUpcomingMatches() {
  const now = new Date();
  const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const threeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  console.log('🔍 Yakında başlayacak maçlar aranıyor...\n');
  console.log(`Şu an: ${now.toISOString()}`);
  console.log(`1 saat içinde: ${oneHour.toISOString()}`);
  console.log(`2 saat içinde: ${twoHours.toISOString()}`);
  console.log(`3 saat içinde: ${threeHours.toISOString()}\n`);

  const results = {
    oneHour: [],
    twoHours: [],
    threeHours: [],
  };

  for (const league of PRIORITY_LEAGUES) {
    try {
      console.log(`📋 ${league.name} kontrol ediliyor...`);
      
      // Bugün ve yarın için maçları çek
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await footballApi.getFixturesByLeague(league.id, 2025);
      
      if (data && data.response) {
        const matches = data.response.filter(match => {
          const fixtureDate = new Date(match.fixture.date);
          return fixtureDate >= now && fixtureDate <= threeHours;
        });

        for (const match of matches) {
          const fixtureDate = new Date(match.fixture.date);
          const matchInfo = {
            id: match.fixture.id,
            date: match.fixture.date,
            home: match.teams.home.name,
            away: match.teams.away.name,
            league: league.name,
            leagueId: league.id,
          };

          if (fixtureDate <= oneHour) {
            results.oneHour.push(matchInfo);
          } else if (fixtureDate <= twoHours) {
            results.twoHours.push(matchInfo);
          } else if (fixtureDate <= threeHours) {
            results.threeHours.push(matchInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ ${league.name} için hata:`, error.message);
    }
  }

  // Sonuçları göster
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 YAKINDA BAŞLAYACAK MAÇLAR');
  console.log('═══════════════════════════════════════════════════\n');

  if (results.oneHour.length > 0) {
    console.log('⏰ 1 SAAT İÇİNDE BAŞLAYACAK:');
    results.oneHour.slice(0, 3).forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.home} vs ${match.away} (${match.league})`);
      console.log(`      ID: ${match.id}, Tarih: ${new Date(match.date).toLocaleString('tr-TR')}`);
    });
    console.log('');
  } else {
    console.log('⏰ 1 SAAT İÇİNDE: Maç bulunamadı\n');
  }

  if (results.twoHours.length > 0) {
    console.log('⏰ 2 SAAT İÇİNDE BAŞLAYACAK:');
    results.twoHours.slice(0, 3).forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.home} vs ${match.away} (${match.league})`);
      console.log(`      ID: ${match.id}, Tarih: ${new Date(match.date).toLocaleString('tr-TR')}`);
    });
    console.log('');
  } else {
    console.log('⏰ 2 SAAT İÇİNDE: Maç bulunamadı\n');
  }

  if (results.threeHours.length > 0) {
    console.log('⏰ 3 SAAT İÇİNDE BAŞLAYACAK:');
    results.threeHours.slice(0, 3).forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.home} vs ${match.away} (${match.league})`);
      console.log(`      ID: ${match.id}, Tarih: ${new Date(match.date).toLocaleString('tr-TR')}`);
    });
    console.log('');
  } else {
    console.log('⏰ 3 SAAT İÇİNDE: Maç bulunamadı\n');
  }

  // JSON formatında da göster
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📋 JSON FORMAT:');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(JSON.stringify({
    oneHour: results.oneHour.slice(0, 1),
    twoHours: results.twoHours.slice(0, 1),
    threeHours: results.threeHours.slice(0, 1),
  }, null, 2));
}

findUpcomingMatches().catch(console.error);
