// Create Static Teams Views in Supabase
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createViews = async () => {
  try {
    console.log('📊 Creating static teams views...');

    // View: Aktif takımlar (son 2 ay içinde güncellenmiş)
    await pool.query(`
      CREATE OR REPLACE VIEW v_active_static_teams AS
      SELECT 
          id,
          api_football_id,
          name,
          country,
          league,
          league_type,
          team_type,
          colors,
          colors_primary,
          colors_secondary,
          coach,
          coach_api_id,
          logo_url,
          flag_url,
          last_updated
      FROM static_teams
      WHERE last_updated >= NOW() - INTERVAL '2 months'
      ORDER BY country, league, name;
    `);
    console.log('✅ v_active_static_teams view created');

    // View: Milli takımlar
    await pool.query(`
      CREATE OR REPLACE VIEW v_national_teams AS
      SELECT 
          id,
          api_football_id,
          name,
          country,
          colors,
          colors_primary,
          colors_secondary,
          coach,
          flag_url
      FROM static_teams
      WHERE team_type = 'national'
      AND last_updated >= NOW() - INTERVAL '2 months'
      ORDER BY country;
    `);
    console.log('✅ v_national_teams view created');

    // View: Kulüp takımları
    await pool.query(`
      CREATE OR REPLACE VIEW v_club_teams AS
      SELECT 
          id,
          api_football_id,
          name,
          country,
          league,
          colors,
          colors_primary,
          colors_secondary,
          coach
      FROM static_teams
      WHERE team_type = 'club'
      AND last_updated >= NOW() - INTERVAL '2 months'
      ORDER BY country, league, name;
    `);
    console.log('✅ v_club_teams view created');

    console.log('✅ All views created successfully!');
  } catch (error) {
    console.error('❌ Error creating views:', error.message);
    // View'lar yoksa tablo da yok olabilir, bu normal
    if (error.message.includes('does not exist')) {
      console.log('⚠️  static_teams table does not exist yet. Run sync first.');
    }
  } finally {
    await pool.end();
  }
};

createViews();
