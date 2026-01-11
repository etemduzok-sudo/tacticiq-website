// Find Turkey national team ID
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function checkTeam(teamId) {
  try {
    const response = await axios.get(`${BASE_URL}/matches/team/${teamId}/season/2024`, {
      timeout: 8000,
    });

    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      const matches = response.data.data.slice(0, 3);
      const teamNames = new Set();
      
      matches.forEach(match => {
        if (match.teams?.home?.name) teamNames.add(match.teams.home.name);
        if (match.teams?.away?.name) teamNames.add(match.teams.away.name);
      });
      
      const namesArray = Array.from(teamNames);
      
      // Check for Turkey indicators
      const hasTurkey = namesArray.some(name => 
        name.toLowerCase().includes('turkey') ||
        name.toLowerCase().includes('türkiye') ||
        name.toLowerCase().includes('turkish')
      );
      
      // Check if it's national teams (not clubs)
      const hasNationalTeams = namesArray.some(name => {
        const lower = name.toLowerCase();
        return lower.includes('national') ||
               lower.includes('england') ||
               lower.includes('france') ||
               lower.includes('spain') ||
               lower.includes('italy') ||
               lower.includes('germany') ||
               lower.includes('portugal') ||
               lower.includes('netherlands') ||
               lower.includes('belgium') ||
               lower.includes('croatia') ||
               lower.includes('switzerland') ||
               lower.includes('austria') ||
               lower.includes('poland') ||
               lower.includes('greece') ||
               lower.includes('romania') ||
               lower.includes('bulgaria') ||
               lower.includes('hungary') ||
               lower.includes('czech') ||
               lower.includes('slovakia') ||
               lower.includes('slovenia') ||
               lower.includes('serbia') ||
               lower.includes('montenegro') ||
               lower.includes('bosnia') ||
               lower.includes('albania') ||
               lower.includes('macedonia') ||
               lower.includes('ukraine') ||
               lower.includes('russia');
      });
      
      if (hasTurkey) {
        console.log(`\n🎯 FOUND TURKEY! ID: ${teamId}`);
        console.log(`   Teams: ${namesArray.join(', ')}`);
        console.log(`   Total matches: ${response.data.data.length}`);
        return true;
      } else if (hasNationalTeams && !namesArray.some(n => n.includes('West Ham') || n.includes('Aston Villa') || n.includes('Manchester'))) {
        console.log(`\n✅ ID ${teamId}: National teams found (${response.data.data.length} matches)`);
        console.log(`   Teams: ${namesArray.join(', ')}`);
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function findTurkey() {
  console.log('🔍 Searching for Turkey national team ID...\n');
  
  // Test common ranges
  const ranges = [
    [1, 50],      // Common national team IDs
    [100, 150],   // Another common range
    [200, 250],   // Another range
    [500, 550],   // Another range
  ];
  
  for (const [start, end] of ranges) {
    console.log(`\n📋 Testing IDs ${start}-${end}:`);
    let found = false;
    
    for (let id = start; id <= end; id++) {
      const result = await checkTeam(id);
      if (result) {
        found = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (found) break;
  }
  
  console.log('\n✅ Search complete!');
}

findTurkey()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
