#!/usr/bin/env node
// =====================================================
// Static Teams Database Setup via Supabase REST API
// =====================================================
// Bu script static_teams tablosunu kontrol eder ve
// başlangıç verilerini Supabase'e yükler
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jxdgiskusjljlpzvrzau.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is not set in .env file');
  console.log('\nPlease run the following SQL in Supabase SQL Editor instead:');
  console.log('File: supabase/005_static_teams.sql');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initial team data
const NATIONAL_TEAMS = [
  { api_football_id: 1, name: 'Turkey', country: 'Turkey', league: 'International', league_type: 'international', team_type: 'national', colors: ['#E30A17', '#FFFFFF'], colors_primary: '#E30A17', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/tr.png' },
  { api_football_id: 2, name: 'Germany', country: 'Germany', league: 'International', league_type: 'international', team_type: 'national', colors: ['#000000', '#DD0000', '#FFCC00'], colors_primary: '#000000', colors_secondary: '#DD0000', flag_url: 'https://flagcdn.com/w80/de.png' },
  { api_football_id: 3, name: 'France', country: 'France', league: 'International', league_type: 'international', team_type: 'national', colors: ['#002395', '#FFFFFF', '#ED2939'], colors_primary: '#002395', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/fr.png' },
  { api_football_id: 10, name: 'England', country: 'England', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FFFFFF', '#CF081F'], colors_primary: '#FFFFFF', colors_secondary: '#CF081F', flag_url: 'https://flagcdn.com/w80/gb-eng.png' },
  { api_football_id: 9, name: 'Spain', country: 'Spain', league: 'International', league_type: 'international', team_type: 'national', colors: ['#AA151B', '#F1BF00'], colors_primary: '#AA151B', colors_secondary: '#F1BF00', flag_url: 'https://flagcdn.com/w80/es.png' },
  { api_football_id: 768, name: 'Italy', country: 'Italy', league: 'International', league_type: 'international', team_type: 'national', colors: ['#009246', '#FFFFFF', '#CE2B37'], colors_primary: '#009246', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/it.png' },
  { api_football_id: 6, name: 'Brazil', country: 'Brazil', league: 'International', league_type: 'international', team_type: 'national', colors: ['#009C3B', '#FFDF00'], colors_primary: '#009C3B', colors_secondary: '#FFDF00', flag_url: 'https://flagcdn.com/w80/br.png' },
  { api_football_id: 26, name: 'Argentina', country: 'Argentina', league: 'International', league_type: 'international', team_type: 'national', colors: ['#74ACDF', '#FFFFFF'], colors_primary: '#74ACDF', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/ar.png' },
  { api_football_id: 27, name: 'Portugal', country: 'Portugal', league: 'International', league_type: 'international', team_type: 'national', colors: ['#006600', '#FF0000'], colors_primary: '#006600', colors_secondary: '#FF0000', flag_url: 'https://flagcdn.com/w80/pt.png' },
  { api_football_id: 1118, name: 'Netherlands', country: 'Netherlands', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FF6600', '#FFFFFF'], colors_primary: '#FF6600', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/nl.png' },
  { api_football_id: 15, name: 'Belgium', country: 'Belgium', league: 'International', league_type: 'international', team_type: 'national', colors: ['#000000', '#FDDA25'], colors_primary: '#000000', colors_secondary: '#FDDA25', flag_url: 'https://flagcdn.com/w80/be.png' },
  { api_football_id: 21, name: 'Croatia', country: 'Croatia', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/hr.png' },
  { api_football_id: 1099, name: 'Poland', country: 'Poland', league: 'International', league_type: 'international', team_type: 'national', colors: ['#FFFFFF', '#DC143C'], colors_primary: '#FFFFFF', colors_secondary: '#DC143C', flag_url: 'https://flagcdn.com/w80/pl.png' },
  { api_football_id: 772, name: 'Ukraine', country: 'Ukraine', league: 'International', league_type: 'international', team_type: 'national', colors: ['#005BBB', '#FFD500'], colors_primary: '#005BBB', colors_secondary: '#FFD500', flag_url: 'https://flagcdn.com/w80/ua.png' },
  { api_football_id: 13, name: 'Denmark', country: 'Denmark', league: 'International', league_type: 'international', team_type: 'national', colors: ['#C60C30', '#FFFFFF'], colors_primary: '#C60C30', colors_secondary: '#FFFFFF', flag_url: 'https://flagcdn.com/w80/dk.png' },
];

const CLUB_TEAMS = [
  // Türk Süper Lig
  { api_football_id: 611, name: 'Fenerbahce', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FFED00', '#00205B'], colors_primary: '#FFED00', colors_secondary: '#00205B' },
  { api_football_id: 645, name: 'Galatasaray', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFD700'], colors_primary: '#FF0000', colors_secondary: '#FFD700' },
  { api_football_id: 549, name: 'Besiktas', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  { api_football_id: 551, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#632134', '#00BFFF'], colors_primary: '#632134', colors_secondary: '#00BFFF' },
  { api_football_id: 3570, name: 'Basaksehir', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#F37021', '#000000'], colors_primary: '#F37021', colors_secondary: '#000000' },
  { api_football_id: 607, name: 'Adana Demirspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#0000FF', '#FFFFFF'], colors_primary: '#0000FF', colors_secondary: '#FFFFFF' },
  { api_football_id: 562, name: 'Antalyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
  { api_football_id: 556, name: 'Konyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#FFFFFF'], colors_primary: '#006633', colors_secondary: '#FFFFFF' },
  { api_football_id: 564, name: 'Sivasspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
  { api_football_id: 3571, name: 'Kasimpasa', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#000066', '#FFFFFF'], colors_primary: '#000066', colors_secondary: '#FFFFFF' },
  
  // Premier League
  { api_football_id: 50, name: 'Manchester City', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#6CABDD', '#1C2C5B'], colors_primary: '#6CABDD', colors_secondary: '#1C2C5B' },
  { api_football_id: 33, name: 'Manchester United', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#DA291C', '#FBE122'], colors_primary: '#DA291C', colors_secondary: '#FBE122' },
  { api_football_id: 40, name: 'Liverpool', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#00B2A9'], colors_primary: '#C8102E', colors_secondary: '#00B2A9' },
  { api_football_id: 42, name: 'Arsenal', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#EF0107', '#FFFFFF'], colors_primary: '#EF0107', colors_secondary: '#FFFFFF' },
  { api_football_id: 49, name: 'Chelsea', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#034694', '#FFFFFF'], colors_primary: '#034694', colors_secondary: '#FFFFFF' },
  { api_football_id: 47, name: 'Tottenham', country: 'England', league: 'Premier League', league_type: 'domestic_top', team_type: 'club', colors: ['#132257', '#FFFFFF'], colors_primary: '#132257', colors_secondary: '#FFFFFF' },
  
  // La Liga
  { api_football_id: 541, name: 'Real Madrid', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#FFFFFF', '#00529F'], colors_primary: '#FFFFFF', colors_secondary: '#00529F' },
  { api_football_id: 529, name: 'Barcelona', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#004D98', '#A50044'], colors_primary: '#004D98', colors_secondary: '#A50044' },
  { api_football_id: 530, name: 'Atletico Madrid', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#CB3524', '#FFFFFF'], colors_primary: '#CB3524', colors_secondary: '#FFFFFF' },
  
  // Bundesliga
  { api_football_id: 157, name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#DC052D', '#FFFFFF'], colors_primary: '#DC052D', colors_secondary: '#FFFFFF' },
  { api_football_id: 165, name: 'Borussia Dortmund', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#FDE100', '#000000'], colors_primary: '#FDE100', colors_secondary: '#000000' },
  { api_football_id: 168, name: 'Bayer Leverkusen', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#E32221', '#000000'], colors_primary: '#E32221', colors_secondary: '#000000' },
  
  // Serie A
  { api_football_id: 489, name: 'AC Milan', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#AC1818', '#000000'], colors_primary: '#AC1818', colors_secondary: '#000000' },
  { api_football_id: 505, name: 'Inter', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#010E80', '#000000'], colors_primary: '#010E80', colors_secondary: '#000000' },
  { api_football_id: 496, name: 'Juventus', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
  { api_football_id: 492, name: 'Napoli', country: 'Italy', league: 'Serie A', league_type: 'domestic_top', team_type: 'club', colors: ['#12A0D7', '#FFFFFF'], colors_primary: '#12A0D7', colors_secondary: '#FFFFFF' },
  
  // Ligue 1
  { api_football_id: 85, name: 'Paris Saint Germain', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#004170', '#DA291C'], colors_primary: '#004170', colors_secondary: '#DA291C' },
  { api_football_id: 81, name: 'Marseille', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#2FAEE0', '#FFFFFF'], colors_primary: '#2FAEE0', colors_secondary: '#FFFFFF' },
  { api_football_id: 80, name: 'Lyon', country: 'France', league: 'Ligue 1', league_type: 'domestic_top', team_type: 'club', colors: ['#0046A0', '#E10000'], colors_primary: '#0046A0', colors_secondary: '#E10000' },
];

async function runSetup() {
  console.log('🚀 Starting Static Teams Setup via Supabase...\n');
  
  try {
    // Test connection
    console.log('🔗 Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('static_teams')
      .select('count')
      .limit(1);
    
    if (healthError) {
      const isTableMissing = healthError.message.includes('does not exist') || 
                             healthError.message.includes('schema cache') ||
                             healthError.code === '42P01';
      
      if (isTableMissing) {
        console.log('⚠️  static_teams table does not exist. Creating table...\n');
        
        // Try to create table via RPC (if exec_sql function exists)
        const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS static_teams (
              id SERIAL PRIMARY KEY,
              api_football_id INTEGER UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              country VARCHAR(100) NOT NULL,
              league VARCHAR(255),
              league_type VARCHAR(50) NOT NULL DEFAULT 'domestic_top',
              team_type VARCHAR(20) NOT NULL DEFAULT 'club',
              colors JSONB,
              colors_primary VARCHAR(7),
              colors_secondary VARCHAR(7),
              coach VARCHAR(255),
              coach_api_id INTEGER,
              logo_url TEXT,
              flag_url TEXT,
              last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE static_teams ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY IF NOT EXISTS "Allow public read access to static_teams" 
            ON static_teams FOR SELECT USING (true);
          `
        });
        
        if (createError) {
          console.log('⚠️  Could not auto-create table. Please create it manually.\n');
          console.log('📋 Run the following SQL in Supabase SQL Editor:');
          console.log('   File: c:\\TacticIQ\\supabase\\005_static_teams.sql\n');
          console.log('   Steps:');
          console.log('   1. Go to https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau');
          console.log('   2. Click "SQL Editor" in the left sidebar');
          console.log('   3. Copy and paste the contents of 005_static_teams.sql');
          console.log('   4. Click "Run"');
          console.log('\n   After running the SQL, run this script again to populate data.');
          return;
        }
        
        console.log('✅ Table created successfully!\n');
      } else {
        throw healthError;
      }
    } else {
      console.log('✅ Connection successful! Table exists.\n');
    }
    
    // Insert national teams
    console.log('📥 Inserting national teams...');
    for (const team of NATIONAL_TEAMS) {
      const { error } = await supabase
        .from('static_teams')
        .upsert(team, { onConflict: 'api_football_id' });
      
      if (error) {
        console.error(`   ❌ ${team.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${team.name}`);
      }
    }
    
    // Insert club teams
    console.log('\n📥 Inserting club teams...');
    for (const team of CLUB_TEAMS) {
      const { error } = await supabase
        .from('static_teams')
        .upsert(team, { onConflict: 'api_football_id' });
      
      if (error) {
        console.error(`   ❌ ${team.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${team.name}`);
      }
    }
    
    // Verify counts
    console.log('\n📊 Verifying data...');
    
    const { count: totalCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: nationalCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .eq('team_type', 'national');
    
    const { count: clubCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .eq('team_type', 'club');
    
    console.log(`   Total teams: ${totalCount}`);
    console.log(`   National teams: ${nationalCount}`);
    console.log(`   Club teams: ${clubCount}`);
    
    // Test search
    console.log('\n🔍 Testing search...');
    const { data: searchResults } = await supabase
      .from('static_teams')
      .select('name, country, team_type, colors_primary')
      .or('name.ilike.%fenerbahce%,name.ilike.%galatasaray%,name.ilike.%turkey%')
      .limit(5);
    
    if (searchResults && searchResults.length > 0) {
      console.log('   Search results:');
      searchResults.forEach(team => {
        console.log(`   - ${team.name} (${team.country}) ${team.team_type} | ${team.colors_primary}`);
      });
    }
    
    console.log('\n✅ Static Teams Setup Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run
runSetup();
