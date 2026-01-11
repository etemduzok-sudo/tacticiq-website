// Find all Turkey teams and identify men's national team
const axios = require('axios');

const API_KEY = 'a7ac2f7672bcafcf6fdca1b021b74865';
const BASE_URL = 'https://v3.football.api-sports.io';

async function getAllTurkeyTeams() {
  try {
    // Get all teams from Turkey
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { country: 'Turkey' },
    });

    if (response.data && response.data.response) {
      const allTeams = response.data.response;
      const nationalTeams = allTeams.filter(t => t.team.national === true);
      
      console.log(`\n📋 Found ${nationalTeams.length} Turkey national teams:\n`);
      
      nationalTeams.forEach((teamData, idx) => {
        const team = teamData.team;
        const name = team.name.toLowerCase();
        const isMens = !name.includes(' w') && 
                      !name.includes('women') && 
                      !name.includes('u21') && 
                      !name.includes('u19') &&
                      !name.includes('u20') &&
                      !name.includes('u23') &&
                      !name.includes('youth') &&
                      !name.includes('girls');
        
        console.log(`${idx + 1}. ${team.name} (ID: ${team.id})`);
        console.log(`   ${isMens ? '✅ MEN\'S TEAM' : '⚠️  Not men\'s team'}`);
        console.log('');
      });
      
      const mensTeam = nationalTeams.find(t => {
        const name = t.team.name.toLowerCase();
        return !name.includes(' w') && 
               !name.includes('women') && 
               !name.includes('u21') && 
               !name.includes('u19') &&
               !name.includes('u20') &&
               !name.includes('u23') &&
               !name.includes('youth') &&
               !name.includes('girls');
      });
      
      if (mensTeam) {
        console.log(`\n✅ Turkey Men's National Team: ${mensTeam.team.name} (ID: ${mensTeam.team.id})`);
        return mensTeam.team.id;
      } else {
        console.log('\n⚠️  No men\'s national team found in API');
        console.log('   The men\'s team might not be available in API-Football');
        console.log('   or might be listed under a different name');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  return null;
}

getAllTurkeyTeams()
  .then(id => {
    if (id) {
      console.log(`\n📊 Recommended ID: ${id}`);
    } else {
      console.log('\n💡 Recommendation:');
      console.log('   - Keep using ID 1759 but the filter will exclude women\'s matches');
      console.log('   - Or check API-Football dashboard for the correct men\'s team ID');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
