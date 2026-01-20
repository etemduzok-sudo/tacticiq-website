// Test if ID 1759 returns men's or women's matches
const axios = require('axios');

const API_KEY = '8a7e3c18ff59d0c7d254d230f999a084';
const BASE_URL = 'https://v3.football.api-sports.io';

async function testTeam(teamId) {
  try {
    // Get team info
    const teamResponse = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { id: teamId },
    });

    if (teamResponse.data && teamResponse.data.response && teamResponse.data.response.length > 0) {
      const team = teamResponse.data.response[0].team;
      console.log(`\n📋 Team Info:`);
      console.log(`   Name: ${team.name}`);
      console.log(`   Country: ${team.country}`);
      console.log(`   National: ${team.national}`);
    }

    // Get matches
    const matchesResponse = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { team: teamId, season: 2024 },
    });

    if (matchesResponse.data && matchesResponse.data.response && matchesResponse.data.response.length > 0) {
      const matches = matchesResponse.data.response.slice(0, 5);
      console.log(`\n📊 Sample Matches (${matchesResponse.data.response.length} total):`);
      
      matches.forEach((match, idx) => {
        const leagueName = match.league?.name || 'Unknown';
        const homeTeam = match.teams?.home?.name || 'Unknown';
        const awayTeam = match.teams?.away?.name || 'Unknown';
        const isWomens = leagueName.toLowerCase().includes('women') ||
                        homeTeam.toLowerCase().includes('women') ||
                        awayTeam.toLowerCase().includes('women');
        
        console.log(`\n   ${idx + 1}. ${homeTeam} vs ${awayTeam}`);
        console.log(`      League: ${leagueName}`);
        console.log(`      ${isWomens ? '⚠️  WOMEN\'S MATCH' : '✅ MEN\'S MATCH'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

console.log('🔍 Testing Team ID 1759 (Turkey)...');
testTeam(1759)
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
