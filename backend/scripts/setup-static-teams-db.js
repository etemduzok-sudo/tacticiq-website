#!/usr/bin/env node
// =====================================================
// Static Teams Database Setup Script
// =====================================================
// Bu script static_teams tablosunu ve view'larını oluşturur
// Ayrıca başlangıç verileri ekler
// =====================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
});

async function runSetup() {
  console.log('🚀 Starting Static Teams Database Setup...\n');
  
  const client = await pool.connect();
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'create_static_teams_db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded:', sqlPath);
    console.log('📊 SQL content length:', sqlContent.length, 'characters\n');
    
    // Split by semicolons and filter empty statements
    const statements = sqlContent
      .split(/;(?=\s*(?:--|CREATE|INSERT|DROP|ALTER|SELECT|UPDATE|DELETE|$))/i)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 5);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (!statement || statement.length < 5) continue;
      
      // Get first line for logging
      const firstLine = statement.split('\n')[0].substring(0, 60);
      
      try {
        const result = await client.query(statement);
        successCount++;
        
        // Log special results
        if (statement.toUpperCase().includes('SELECT')) {
          if (result.rows && result.rows.length > 0) {
            console.log(`✅ [${i + 1}/${statements.length}] ${firstLine}...`);
            console.log('   Result:', JSON.stringify(result.rows[0]));
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] ${firstLine}...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i + 1}/${statements.length}] ${firstLine}...`);
        console.error(`   Error: ${error.message}`);
        
        // Continue on certain errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key')) {
          console.log('   (Continuing - item already exists)');
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Setup Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));
    
    // Verify tables exist
    console.log('\n🔍 Verifying database objects...\n');
    
    // Check static_teams table
    try {
      const teamsResult = await client.query('SELECT COUNT(*) as count FROM static_teams');
      console.log(`✅ static_teams table: ${teamsResult.rows[0].count} teams`);
    } catch (error) {
      console.error('❌ static_teams table not found:', error.message);
    }
    
    // Check static_leagues table
    try {
      const leaguesResult = await client.query('SELECT COUNT(*) as count FROM static_leagues');
      console.log(`✅ static_leagues table: ${leaguesResult.rows[0].count} leagues`);
    } catch (error) {
      console.log('⚠️  static_leagues table: 0 leagues (empty or not found)');
    }
    
    // Check views
    const views = ['v_active_static_teams', 'v_national_teams', 'v_club_teams'];
    for (const view of views) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${view}`);
        console.log(`✅ ${view}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.error(`❌ ${view}: ${error.message}`);
      }
    }
    
    // Test search
    console.log('\n🔍 Testing team search...\n');
    try {
      const searchResult = await client.query(
        "SELECT name, country, team_type, colors_primary FROM static_teams WHERE LOWER(name) LIKE '%fenerbahce%' OR LOWER(name) LIKE '%galatasaray%' LIMIT 5"
      );
      console.log('Search results for Turkish teams:');
      searchResult.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.country}) ${row.team_type} | ${row.colors_primary}`);
      });
    } catch (error) {
      console.error('Search test failed:', error.message);
    }
    
    console.log('\n✅ Static Teams Database Setup Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
runSetup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
