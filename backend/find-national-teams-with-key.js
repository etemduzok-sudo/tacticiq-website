// Find correct national team IDs using API key
const axios = require('axios');

const API_KEY = '8a7e3c18ff59d0c7d254d230f999a084';
const BASE_URL = 'https://v3.football.api-sports.io';

const nationalTeams = [
  { name: 'Turkey', searchTerms: ['Turkey', 'Türkiye'] },
  { name: 'Germany', searchTerms: ['Germany', 'Deutschland'] },
  { name: 'Brazil', searchTerms: ['Brazil', 'Brasil'] },
  { name: 'Argentina', searchTerms: ['Argentina'] },
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
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    return [];
  }
}

async function findNationalTeamIds() {
  console.log('🔍 Searching for national team IDs with API key...\n');

  const results = {};

  for (const team of nationalTeams) {
    console.log(`\n📋 Searching for ${team.name}:`);
    
    let found = false;
    for (const searchTerm of team.searchTerms) {
      const searchResults = await searchTeam(searchTerm);
      
      if (searchResults.length > 0) {
        // Find the exact match
        const exactMatch = searchResults.find(t => {
          const teamName = t.team.name.toLowerCase();
          const searchLower = team.name.toLowerCase();
          return teamName.includes(searchLower) || 
                 teamName.includes(searchTerm.toLowerCase()) ||
                 (teamName === searchTerm.toLowerCase());
        });
        
        if (exactMatch) {
          console.log(`  ✅ Found: ${exactMatch.team.name} (ID: ${exactMatch.team.id})`);
          console.log(`     Country: ${exactMatch.team.country}`);
          console.log(`     National: ${exactMatch.team.national}`);
          results[team.name] = exactMatch.team.id;
          found = true;
          break;
        } else {
          console.log(`  ⚠️  Found ${searchResults.length} results:`);
          searchResults.slice(0, 3).forEach(t => {
            console.log(`     - ${t.team.name} (ID: ${t.team.id}, National: ${t.team.national})`);
          });
          // Use first result if it's national
          if (searchResults[0].team.national) {
            results[team.name] = searchResults[0].team.id;
            found = true;
            break;
          }
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!found) {
      console.log(`  ❌ No results found for ${team.name}`);
    }
  }

  console.log('\n\n📊 RESULTS:');
  console.log('='.repeat(50));
  for (const [name, id] of Object.entries(results)) {
    console.log(`${name}: ${id}`);
  }
  console.log('='.repeat(50));
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
