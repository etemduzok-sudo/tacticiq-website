// Backend API Test Script
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Fan Manager Backend API...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data);
    console.log('');

    // 2. Get Today's Turkish Super League Matches
    console.log('2️⃣ Testing Turkish Super League Matches...');
    const today = new Date().toISOString().split('T')[0];
    const matches = await axios.get(`${BASE_URL}/api/matches/date/${today}`);
    console.log(`✅ Found ${matches.data.data?.length || 0} matches for ${today}`);
    if (matches.data.data?.[0]) {
      const match = matches.data.data[0];
      console.log(`   Example: ${match.teams.home.name} vs ${match.teams.away.name}`);
    }
    console.log('   Cached:', matches.data.cached);
    console.log('');

    // 3. Get Turkish Super League Standings
    console.log('3️⃣ Testing Turkish Super League Standings...');
    const standings = await axios.get(`${BASE_URL}/api/leagues/203/standings?season=2024`);
    console.log('✅ Standings retrieved');
    if (standings.data.data?.[0]?.league?.standings?.[0]) {
      const top3 = standings.data.data[0].league.standings[0].slice(0, 3);
      console.log('   Top 3:');
      top3.forEach(team => {
        console.log(`   ${team.rank}. ${team.team.name} - ${team.points} points`);
      });
    }
    console.log('   Cached:', standings.data.cached);
    console.log('');

    // 4. Get Galatasaray Team Info
    console.log('4️⃣ Testing Galatasaray Team Info...');
    const galatasaray = await axios.get(`${BASE_URL}/api/teams/548`);
    console.log('✅ Team:', galatasaray.data.data?.team?.name);
    console.log('   Founded:', galatasaray.data.data?.team?.founded);
    console.log('   Venue:', galatasaray.data.data?.venue?.name);
    console.log('   Cached:', galatasaray.data.cached);
    console.log('');

    // 5. Get Live Matches
    console.log('5️⃣ Testing Live Matches...');
    const live = await axios.get(`${BASE_URL}/api/matches/live`);
    console.log(`✅ Found ${live.data.data?.length || 0} live matches`);
    if (live.data.data?.[0]) {
      const liveMatch = live.data.data[0];
      console.log(`   Live: ${liveMatch.teams.home.name} ${liveMatch.goals.home} - ${liveMatch.goals.away} ${liveMatch.teams.away.name}`);
      console.log(`   Status: ${liveMatch.fixture.status.short} (${liveMatch.fixture.status.elapsed}')`);
    }
    console.log('   Cached:', live.data.cached);
    console.log('');

    console.log('✅ ALL TESTS PASSED! 🎉');
    console.log('');
    console.log('🔥 Backend is working perfectly with live data!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run tests
testAPI();
