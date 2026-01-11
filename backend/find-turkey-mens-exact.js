// Find Turkey men's national team - comprehensive search
const axios = require('axios');

const API_KEY = 'a7ac2f7672bcafcf6fdca1b021b74865';
const BASE_URL = 'https://v3.football.api-sports.io';

async function searchTeams(query, country = null) {
  try {
    const params = { search: query };
    if (country) params.country = country;
    
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params,
    });

    if (response.data && response.data.response) {
      return response.data.response.filter(t => t.team.national === true);
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getTeamById(teamId) {
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

async function checkMatches(teamId) {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      params: { team: teamId, season: 2024 },
    });

    if (response.data && response.data.response && response.data.response.length > 0) {
      const match = response.data.response[0];
      const teams = [
        match.teams?.home?.name,
        match.teams?.away?.name
      ].filter(Boolean);
      
      return {
        hasMatches: true,
        teams,
        league: match.league?.name,
        country: match.league?.country,
      };
    }
    return { hasMatches: false };
  } catch (error) {
    return { hasMatches: false, error: error.message };
  }
}

async function findTurkeyMens() {
  console.log('🔍 Finding Turkey Men\'s National Team...\n');
  
  // Try different search approaches
  const searches = [
    { query: 'Turkey', country: 'Turkey' },
    { query: 'Türkiye', country: 'Turkey' },
    { query: 'Turkish', country: null },
  ];
  
  let allTeams = [];
  
  for (const search of searches) {
    const teams = await searchTeams(search.query, search.country);
    allTeams = [...allTeams, ...teams];
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Remove duplicates
  const uniqueTeams = Array.from(
    new Map(allTeams.map(t => [t.team.id, t])).values()
  );
  
  console.log(`📋 Found ${uniqueTeams.length} unique Turkey national teams:\n`);
  
  for (const teamData of uniqueTeams) {
    const team = teamData.team;
    console.log(`  - ${team.name} (ID: ${team.id})`);
    console.log(`    Country: ${team.country}`);
    
    // Check if it's men's team (exclude women, youth, etc.)
    const name = team.name.toLowerCase();
    const isMens = !name.includes(' w') && 
                   !name.includes('women') && 
                   !name.includes('u21') && 
                   !name.includes('u19') &&
                   !name.includes('u20') &&
                   !name.includes('u23') &&
                   !name.includes('youth') &&
                   !name.includes('girls');
    
    if (isMens) {
      console.log(`    ✅ MEN'S TEAM`);
      
      // Check matches to confirm
      const matchInfo = await checkMatches(team.id);
      if (matchInfo.hasMatches) {
        console.log(`    📊 Has matches: ${matchInfo.league} (${matchInfo.country})`);
        console.log(`    Teams in match: ${matchInfo.teams.join(' vs ')}`);
      }
    } else {
      console.log(`    ⚠️  Not men's team (women/youth)`);
    }
    console.log('');
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Find the men's team
  const mensTeam = uniqueTeams.find(t => {
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
    console.log('\n⚠️  Men\'s team not found in search results');
    console.log('   Trying common IDs...\n');
    
    // Try common IDs
    const commonIds = [101, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    for (const id of commonIds) {
      const team = await getTeamById(id);
      if (team && team.national && team.country === 'Turkey') {
        const name = team.name.toLowerCase();
        const isMens = !name.includes(' w') && !name.includes('women');
        
        if (isMens) {
          console.log(`✅ Found: ${team.name} (ID: ${id})`);
          return id;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return null;
}

findTurkeyMens()
  .then(id => {
    if (id) {
      console.log(`\n📊 Turkey Men's National Team ID: ${id}`);
    } else {
      console.log('\n❌ Could not find Turkey men\'s national team');
      console.log('   You may need to check API-Football documentation');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
