// Find Turkey men's national team
const axios = require('axios');

const API_KEY = '8a7e3c18ff59d0c7d254d230f999a084';
const BASE_URL = 'https://v3.football.api-sports.io';

async function searchTurkey() {
  try {
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { search: 'Turkey', country: 'Turkey' },
    });

    if (response.data && response.data.response) {
      const teams = response.data.response.filter(team => 
        team.team.national === true
      );
      
      console.log('🔍 Turkey National Teams Found:');
      teams.forEach(team => {
        console.log(`  - ${team.team.name} (ID: ${team.team.id})`);
        console.log(`    Country: ${team.team.country}`);
      });
      
      // Find men's team (not W, not U21, not U19, etc.)
      const mensTeam = teams.find(t => {
        const name = t.team.name.toLowerCase();
        return !name.includes(' w') && 
               !name.includes('women') && 
               !name.includes('u21') && 
               !name.includes('u19') &&
               !name.includes('u20') &&
               !name.includes('u23') &&
               !name.includes('youth');
      });
      
      if (mensTeam) {
        console.log(`\n✅ Turkey Men's National Team: ${mensTeam.team.name} (ID: ${mensTeam.team.id})`);
        return mensTeam.team.id;
      } else {
        console.log('\n⚠️  Men\'s team not found, using first result');
        return teams[0]?.team.id;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  return null;
}

searchTurkey()
  .then(id => {
    if (id) {
      console.log(`\n📊 Turkey ID: ${id}`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
