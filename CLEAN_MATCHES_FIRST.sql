-- ÖNCE BU SQL'İ ÇALIŞTIR - MATCHES TABLOLARINI TEMİZLE

-- Drop tables in correct order (foreign key constraints)
DROP TABLE IF EXISTS match_events CASCADE;
DROP TABLE IF EXISTS match_statistics CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;

-- Drop triggers if exist
DROP TRIGGER IF EXISTS update_leagues_updated_at ON leagues;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TRIGGER IF EXISTS update_match_statistics_updated_at ON match_statistics;

SELECT 'Old matches tables cleaned successfully!' AS status;
