// Test script for lineups endpoint with team colors
// Usage: node scripts/test-lineups-endpoint.js <matchId>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testLineupsEndpoint(matchId) {
  console.log(`\n🧪 Testing lineups endpoint for match ${matchId}...\n`);
  
  try {
    // 1. Check if static_teams table has data
    console.log('1️⃣ Checking static_teams table...');
    const { data: staticTeams, error: staticError } = await supabase
      .from('static_teams')
      .select('api_football_id, name, colors_primary, colors_secondary')
      .limit(5);
    
    if (staticError) {
      console.error('❌ Error querying static_teams:', staticError.message);
      console.log('⚠️  static_teams table might not exist or be empty');
    } else if (!staticTeams || staticTeams.length === 0) {
      console.log('⚠️  static_teams table is empty!');
      console.log('💡 Run: node scripts/setup-static-teams-supabase.js');
    } else {
      console.log(`✅ static_teams has ${staticTeams.length} teams (showing first 5):`);
      staticTeams.forEach(team => {
        console.log(`   - ${team.name} (ID: ${team.api_football_id}): ${team.colors_primary}/${team.colors_secondary}`);
      });
    }
    
    // 2. Check if match exists in DB
    console.log('\n2️⃣ Checking match in database...');
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, lineups, has_lineups')
      .eq('id', matchId)
      .single();
    
    if (matchError) {
      console.error('❌ Error querying match:', matchError.message);
    } else if (!match) {
      console.log(`⚠️  Match ${matchId} not found in database`);
    } else {
      console.log(`✅ Match found:`);
      console.log(`   - Home Team ID: ${match.home_team_id}`);
      console.log(`   - Away Team ID: ${match.away_team_id}`);
      console.log(`   - Has Lineups: ${match.has_lineups}`);
      console.log(`   - Cached Lineups: ${match.lineups ? 'Yes (' + match.lineups.length + ' teams)' : 'No'}`);
      
      // Check team colors for this match
      if (match.home_team_id && match.away_team_id) {
        console.log('\n3️⃣ Checking team colors for this match...');
        const { data: homeTeam } = await supabase
          .from('static_teams')
          .select('name, colors_primary, colors_secondary')
          .eq('api_football_id', match.home_team_id)
          .single();
        
        const { data: awayTeam } = await supabase
          .from('static_teams')
          .select('name, colors_primary, colors_secondary')
          .eq('api_football_id', match.away_team_id)
          .single();
        
        if (homeTeam) {
          console.log(`   ✅ Home: ${homeTeam.name} - ${homeTeam.colors_primary}/${homeTeam.colors_secondary}`);
        } else {
          console.log(`   ⚠️  Home team (ID: ${match.home_team_id}) not found in static_teams`);
        }
        
        if (awayTeam) {
          console.log(`   ✅ Away: ${awayTeam.name} - ${awayTeam.colors_primary}/${awayTeam.colors_secondary}`);
        } else {
          console.log(`   ⚠️  Away team (ID: ${match.away_team_id}) not found in static_team`);
        }
      }
    }
    
    // 3. Test API endpoint (if backend is running)
    console.log('\n4️⃣ Testing API endpoint...');
    const axios = require('axios');
    try {
      const response = await axios.get(`http://localhost:3000/api/matches/${matchId}/lineups`);
      console.log('✅ API endpoint responded:');
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - Cached: ${response.data.cached || false}`);
      console.log(`   - Source: ${response.data.source || 'unknown'}`);
      console.log(`   - Lineups: ${response.data.data?.length || 0} teams`);
      
      if (response.data.data && response.data.data.length > 0) {
        const lineup = response.data.data[0];
        console.log(`\n   📋 Sample lineup:`);
        console.log(`      - Team: ${lineup.team?.name}`);
        console.log(`      - Colors: ${lineup.team?.colors?.primary}/${lineup.team?.colors?.secondary || 'N/A'}`);
        console.log(`      - Formation: ${lineup.formation || 'N/A'}`);
        console.log(`      - StartXI: ${lineup.startXI?.length || 0} players`);
        console.log(`      - Substitutes: ${lineup.substitutes?.length || 0} players`);
        
        if (lineup.startXI && lineup.startXI.length > 0) {
          const samplePlayer = lineup.startXI[0];
          console.log(`\n   👤 Sample player:`);
          console.log(`      - Name: ${samplePlayer.name}`);
          console.log(`      - Position: ${samplePlayer.position}`);
          console.log(`      - Rating: ${samplePlayer.rating}`);
          console.log(`      - Age: ${samplePlayer.age || 'N/A'}`);
          console.log(`      - Nationality: ${samplePlayer.nationality || 'N/A'}`);
        }
      }
    } catch (apiError) {
      if (apiError.code === 'ECONNREFUSED') {
        console.log('⚠️  Backend is not running!');
        console.log('💡 Start backend: cd backend && npm run dev');
      } else {
        console.error('❌ API Error:', apiError.message);
      }
    }
    
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Get matchId from command line
const matchId = process.argv[2];
if (!matchId) {
  console.error('Usage: node scripts/test-lineups-endpoint.js <matchId>');
  console.error('Example: node scripts/test-lineups-endpoint.js 1451296');
  process.exit(1);
}

testLineupsEndpoint(parseInt(matchId));
