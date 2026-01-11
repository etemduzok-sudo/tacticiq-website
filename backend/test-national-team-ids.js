// Test script to find correct national team IDs
// This will test common IDs and see which one returns Turkey matches

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Common API-Football national team IDs to test
const testIds = {
  Turkey: [101, 2003, 3, 26, 48, 1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 49, 50],
  Germany: [48, 2004, 4, 5, 6, 7, 8, 9, 10],
  Brazil: [26, 2005, 5, 6, 7],
  Argentina: [3, 2006, 1, 2, 4, 26],
};

async function testTeamId(teamId, expectedName) {
  try {
    const response = await axios.get(`${BASE_URL}/matches/team/${teamId}/season/2024`, {
      timeout: 5000,
    });

    if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
      const firstMatch = response.data.data[0];
      const teamNames = [
        firstMatch.teams?.home?.name,
        firstMatch.teams?.away?.name,
      ].filter(Boolean);

      // Check if any team name contains the expected name
      const hasExpectedTeam = teamNames.some(name => 
        name.toLowerCase().includes(expectedName.toLowerCase())
      );

      if (hasExpectedTeam || teamNames.length > 0) {
        return {
          success: true,
          teamId,
          teamNames,
          matchCount: response.data.data.length,
          hasExpectedTeam,
        };
      }
    }
    return { success: false, teamId };
  } catch (error) {
    return { success: false, teamId, error: error.message };
  }
}

async function findCorrectIds() {
  console.log('🔍 Testing national team IDs...\n');

  for (const [country, ids] of Object.entries(testIds)) {
    console.log(`\n📋 Testing ${country}:`);
    
    for (const id of ids) {
      const result = await testTeamId(id, country === 'Turkey' ? 'Turkey' : country);
      
      if (result.success) {
        console.log(`  ✅ ID ${id}: Found ${result.matchCount} matches`);
        console.log(`     Teams: ${result.teamNames.join(', ')}`);
        
        // Check for national team indicators
        const isNationalMatch = result.teamNames.some(name => 
          name.toLowerCase().includes('national') ||
          name.toLowerCase().includes('turkey') ||
          name.toLowerCase().includes('türkiye') ||
          name.toLowerCase().includes('germany') ||
          name.toLowerCase().includes('deutschland') ||
          name.toLowerCase().includes('brazil') ||
          name.toLowerCase().includes('brasil') ||
          name.toLowerCase().includes('argentina')
        );
        
        if (result.hasExpectedTeam || isNationalMatch) {
          console.log(`     🎯 CORRECT! This is ${country} national team`);
          break;
        }
      } else {
        if (!result.error || !result.error.includes('timeout')) {
          console.log(`  ❌ ID ${id}: ${result.error || 'No matches'}`);
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

findCorrectIds()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
