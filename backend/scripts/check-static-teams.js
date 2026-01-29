#!/usr/bin/env node
// =====================================================
// Static Teams Kontrol Scripti
// =====================================================
// Bu script static_teams tablosunun durumunu kontrol eder
// ve gerekirse veri yükleme talimatları verir
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jxdgiskusjljlpzvrzau.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is not set in .env file');
  console.log('\n💡 Please add SUPABASE_SERVICE_KEY to backend/.env file');
  console.log('   Or use Supabase SQL Editor method (see below)\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkStaticTeams() {
  console.log('\n🔍 Checking static_teams table...\n');
  
  try {
    // 1. Tablo var mı kontrol et
    const { data: testQuery, error: tableError } = await supabase
      .from('static_teams')
      .select('count')
      .limit(1);
    
    if (tableError) {
      const isTableMissing = tableError.message.includes('does not exist') || 
                             tableError.message.includes('schema cache') ||
                             tableError.code === '42P01';
      
      if (isTableMissing) {
        console.log('❌ static_teams table does NOT exist!\n');
        console.log('📋 SOLUTION: Create table first\n');
        console.log('   Option 1 - Supabase SQL Editor (Recommended):');
        console.log('   1. Go to: https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/sql');
        console.log('   2. Copy contents of: supabase/005_static_teams.sql');
        console.log('   3. Paste and click "Run"');
        console.log('   4. Then run this script again\n');
        console.log('   Option 2 - Auto-create (if RPC enabled):');
        console.log('   Run: node scripts/setup-static-teams-supabase.js\n');
        return;
      } else {
        throw tableError;
      }
    }
    
    console.log('✅ Table exists!\n');
    
    // 2. Veri sayısını kontrol et
    const { count, error: countError } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    console.log(`📊 Total teams in database: ${count || 0}\n`);
    
    if (count === 0) {
      console.log('⚠️  Table is EMPTY! No teams found.\n');
      console.log('📋 SOLUTION: Populate data\n');
      console.log('   Option 1 - Node.js Script (Easiest):');
      console.log('   Run: node scripts/setup-static-teams-supabase.js\n');
      console.log('   Option 2 - Supabase SQL Editor:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/sql');
      console.log('   2. Copy contents of: supabase/005_static_teams.sql');
      console.log('   3. Paste and click "Run"\n');
      return;
    }
    
    // 3. Örnek verileri göster
    const { data: sampleTeams, error: sampleError } = await supabase
      .from('static_teams')
      .select('api_football_id, name, country, team_type, colors_primary, colors_secondary')
      .limit(10);
    
    if (sampleError) {
      throw sampleError;
    }
    
    console.log('✅ Sample teams (first 10):');
    sampleTeams.forEach((team, index) => {
      const colors = team.colors_primary && team.colors_secondary 
        ? `${team.colors_primary}/${team.colors_secondary}`
        : 'N/A';
      console.log(`   ${index + 1}. ${team.name} (ID: ${team.api_football_id}) - ${team.country} [${team.team_type}] - ${colors}`);
    });
    
    // 4. Kategorilere göre sayıları göster
    const { count: nationalCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .eq('team_type', 'national');
    
    const { count: clubCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .eq('team_type', 'club');
    
    console.log(`\n📈 Breakdown:`);
    console.log(`   - National teams: ${nationalCount || 0}`);
    console.log(`   - Club teams: ${clubCount || 0}`);
    
    // 5. Önemli takımları kontrol et
    console.log(`\n🔍 Checking important teams...`);
    const importantTeams = [
      { id: 611, name: 'Fenerbahce' },
      { id: 645, name: 'Galatasaray' },
      { id: 157, name: 'Bayern Munich' },
      { id: 1, name: 'Turkey' },
    ];
    
    for (const team of importantTeams) {
      const { data: found } = await supabase
        .from('static_teams')
        .select('name, colors_primary, colors_secondary')
        .eq('api_football_id', team.id)
        .single();
      
      if (found) {
        const colors = found.colors_primary && found.colors_secondary
          ? `${found.colors_primary}/${found.colors_secondary}`
          : '⚠️ No colors';
        console.log(`   ✅ ${found.name} (ID: ${team.id}) - ${colors}`);
      } else {
        console.log(`   ❌ ${team.name} (ID: ${team.id}) - NOT FOUND`);
      }
    }
    
    // 6. Renkleri olmayan takımları kontrol et
    const { count: noColorsCount } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .is('colors_primary', null);
    
    if (noColorsCount > 0) {
      console.log(`\n⚠️  Warning: ${noColorsCount} teams without colors`);
    } else {
      console.log(`\n✅ All teams have colors!`);
    }
    
    console.log('\n✅ static_teams table is ready!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env');
    console.error('   2. Verify Supabase project is accessible');
    console.error('   3. Check network connection\n');
    process.exit(1);
  }
}

checkStaticTeams();
