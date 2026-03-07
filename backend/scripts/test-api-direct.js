// API'yi direkt test et - tüm cache ve filtreleme olmadan
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function main() {
  console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'YOK!');
  console.log('📡 Base URL:', BASE_URL);
  console.log('');
  
  if (!API_KEY) {
    console.error('❌ API Key bulunamadı!');
    process.exit(1);
  }
  
  try {
    // 1. API Status kontrolü
    console.log('1️⃣ API Status kontrolü...');
    const statusRes = await axios.get(`${BASE_URL}/status`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });
    console.log('   Account:', statusRes.data.response?.account?.firstname, statusRes.data.response?.account?.lastname);
    console.log('   Email:', statusRes.data.response?.account?.email);
    console.log('   Plan:', statusRes.data.response?.subscription?.plan);
    console.log('   Active:', statusRes.data.response?.subscription?.active);
    console.log('   Requests today:', statusRes.data.response?.requests?.current, '/', statusRes.data.response?.requests?.limit_day);
    console.log('');
    
    // 2. Canlı maçlar
    console.log('2️⃣ Canlı maçlar (/fixtures?live=all)...');
    const liveRes = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { live: 'all' }
    });
    console.log('   Results:', liveRes.data.results);
    console.log('   Errors:', liveRes.data.errors);
    if (liveRes.data.response && liveRes.data.response.length > 0) {
      console.log('   İlk 3 maç:');
      liveRes.data.response.slice(0, 3).forEach((m, i) => {
        console.log(`      ${i + 1}. ${m.teams.home.name} vs ${m.teams.away.name} | ${m.league.name}`);
      });
    }
    console.log('');
    
    // 3. Bugünün maçları
    const today = new Date().toISOString().split('T')[0];
    console.log(`3️⃣ Bugünün maçları (${today})...`);
    const todayRes = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { date: today }
    });
    console.log('   Results:', todayRes.data.results);
    console.log('   Errors:', todayRes.data.errors);
    if (todayRes.data.response && todayRes.data.response.length > 0) {
      // Qarabag veya Newcastle ara
      const qarabag = todayRes.data.response.filter(m => 
        m.teams.home.name.toLowerCase().includes('qarabag') || 
        m.teams.away.name.toLowerCase().includes('qarabag') ||
        m.teams.home.name.toLowerCase().includes('newcastle') || 
        m.teams.away.name.toLowerCase().includes('newcastle')
      );
      if (qarabag.length > 0) {
        console.log('   🔴 Qarabag/Newcastle maçları:');
        qarabag.forEach(m => {
          console.log(`      ${m.fixture.id}: ${m.teams.home.name} vs ${m.teams.away.name}`);
          console.log(`         Status: ${m.fixture.status.short} (${m.fixture.status.long})`);
          console.log(`         Score: ${m.goals?.home} - ${m.goals?.away}`);
        });
      }
    }
    console.log('');
    
    // 4. Fenerbahçe maçları (team 611)
    console.log('4️⃣ Fenerbahçe maçları (team=611, season=2025)...');
    const fbRes = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { team: 611, season: 2025 }
    });
    console.log('   Results:', fbRes.data.results);
    if (fbRes.data.response && fbRes.data.response.length > 0) {
      console.log('   Son 3 maç:');
      fbRes.data.response.slice(-3).forEach((m, i) => {
        console.log(`      ${m.teams.home.name} vs ${m.teams.away.name} | ${m.fixture.status.short}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.response?.status, error.response?.data || error.message);
  }
  
  process.exit(0);
}

main();
