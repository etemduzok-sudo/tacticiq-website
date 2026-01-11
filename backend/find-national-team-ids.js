// Script to find correct API-Football IDs for national teams
const axios = require('axios');

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const nationalTeams = [
  { name: 'Turkey', searchTerms: ['Turkey', 'Türkiye', 'Turkish'] },
  { name: 'Germany', searchTerms: ['Germany', 'Deutschland', 'German'] },
  { name: 'Brazil', searchTerms: ['Brazil', 'Brasil', 'Brazilian'] },
  { name: 'Argentina', searchTerms: ['Argentina', 'Argentine'] },
];

async function searchTeam(searchTerm) {
  try {
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { search: searchTerm },
    });

    if (response.data && response.data.response) {
      // Filter for national teams only
      const nationalTeams = response.data.response.filter(team => 
        team.team.national === true
      );
      return nationalTeams;
    }
    return [];
  } catch (error) {
    console.error(`Error searching for ${searchTerm}:`, error.message);
    return [];
  }
}

async function findNationalTeamIds() {
  console.log('🔍 Searching for national team IDs...\n');

  for (const team of nationalTeams) {
    console.log(`\n📋 Searching for ${team.name}:`);
    
    let found = false;
    for (const searchTerm of team.searchTerms) {
      const results = await searchTeam(searchTerm);
      
      if (results.length > 0) {
        // Find the exact match
        const exactMatch = results.find(t => 
          t.team.name.toLowerCase().includes(team.name.toLowerCase()) ||
          t.team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (exactMatch) {
          console.log(`  ✅ Found: ${exactMatch.team.name} (ID: ${exactMatch.team.id})`);
          console.log(`     Country: ${exactMatch.team.country}`);
          console.log(`     National: ${exactMatch.team.national}`);
          found = true;
          break;
        } else if (results.length > 0) {
          console.log(`  ⚠️  Found ${results.length} results, but no exact match:`);
          results.slice(0, 3).forEach(t => {
            console.log(`     - ${t.team.name} (ID: ${t.team.id})`);
          });
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!found) {
      console.log(`  ❌ No results found for ${team.name}`);
    }
  }
}

if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ API key not found! Set FOOTBALL_API_KEY or API_FOOTBALL_KEY in .env');
  process.exit(1);
}

findNationalTeamIds()
  .then(() => {
    console.log('\n✅ Search complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
