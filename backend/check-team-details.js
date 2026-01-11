// Check team details for specific IDs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function checkTeamDetails(teamId, countryName) {
  try {
    const response = await axios.get(`${BASE_URL}/matches/team/${teamId}/season/2024`, {
      timeout: 10000,
    });

    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      const matches = response.data.data.slice(0, 5); // First 5 matches
      
      console.log(`\n📋 Team ID ${teamId} (${countryName}):`);
      console.log(`   Total matches: ${response.data.data.length}`);
      
      const allTeamNames = new Set();
      matches.forEach(match => {
        if (match.teams?.home?.name) allTeamNames.add(match.teams.home.name);
        if (match.teams?.away?.name) allTeamNames.add(match.teams.away.name);
      });
      
      console.log(`   Teams in matches: ${Array.from(allTeamNames).join(', ')}`);
      
      // Check if it's a national team match
      const hasNationalTeam = Array.from(allTeamNames).some(name => 
        name.toLowerCase().includes('turkey') ||
        name.toLowerCase().includes('türkiye') ||
        name.toLowerCase().includes('germany') ||
        name.toLowerCase().includes('deutschland') ||
        name.toLowerCase().includes('brazil') ||
        name.toLowerCase().includes('brasil') ||
        name.toLowerCase().includes('argentina')
      );
      
      if (hasNationalTeam) {
        console.log(`   ✅ This appears to be a NATIONAL TEAM`);
      } else {
        console.log(`   ⚠️  This appears to be a CLUB TEAM`);
      }
      
      return { teamId, isNational: hasNationalTeam, teamNames: Array.from(allTeamNames) };
    }
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function checkAll() {
  console.log('🔍 Checking team details...\n');
  
  const teamsToCheck = [
    { id: 101, name: 'Turkey' },
    { id: 26, name: 'Turkey/Brazil' },
    { id: 6, name: 'Brazil' },
    { id: 3, name: 'Argentina' },
    { id: 48, name: 'Germany' },
  ];
  
  for (const team of teamsToCheck) {
    await checkTeamDetails(team.id, team.name);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

checkAll()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
