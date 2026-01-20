// Find Turkey men's national team - try different approaches
const axios = require('axios');

const API_KEY = '8a7e3c18ff59d0c7d254d230f999a084';
const BASE_URL = 'https://v3.football.api-sports.io';

async function getTeamInfo(teamId) {
  try {
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { id: teamId },
    });

    if (response.data && response.data.response && response.data.response.length > 0) {
      return response.data.response[0].team;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function searchAllTurkeyTeams() {
  try {
    // Try different search terms
    const searches = ['Turkey', 'Türkiye', 'Turkish'];
    
    for (const term of searches) {
      const response = await axios.get(`${BASE_URL}/teams`, {
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
        params: { search: term, country: 'Turkey' },
      });

      if (response.data && response.data.response) {
        const nationalTeams = response.data.response.filter(t => t.team.national === true);
        
        console.log(`\n📋 Search: "${term}" - Found ${nationalTeams.length} national teams:`);
        nationalTeams.forEach(team => {
          const t = team.team;
          console.log(`  - ${t.name} (ID: ${t.id})`);
          console.log(`    Country: ${t.country}, National: ${t.national}`);
        });
        
        // Check if we found men's team
        const mensTeam = nationalTeams.find(t => {
          const name = t.team.name.toLowerCase();
          return name === 'turkey' || 
                 name === 'türkiye' ||
                 (name.includes('turkey') && !name.includes(' w') && !name.includes('women'));
        });
        
        if (mensTeam) {
          console.log(`\n✅ Found Men's Team: ${mensTeam.team.name} (ID: ${mensTeam.team.id})`);
          return mensTeam.team.id;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  return null;
}

// Also check common IDs
async function checkCommonIds() {
  console.log('\n🔍 Checking common IDs:');
  const commonIds = [101, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  
  for (const id of commonIds) {
    const team = await getTeamInfo(id);
    if (team && team.national && team.country === 'Turkey') {
      console.log(`\n✅ Found: ${team.name} (ID: ${id})`);
      return id;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return null;
}

async function main() {
  console.log('🔍 Finding Turkey Men\'s National Team...\n');
  
  let id = await searchAllTurkeyTeams();
  
  if (!id) {
    id = await checkCommonIds();
  }
  
  if (id) {
    console.log(`\n📊 Turkey Men's National Team ID: ${id}`);
  } else {
    console.log('\n⚠️  Could not find men\'s team, using 1759 (women\'s team)');
    console.log('   You may need to check API-Football documentation for the correct ID');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
