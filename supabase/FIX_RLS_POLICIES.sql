-- Fix RLS Policies for Public Read Access
-- TacticIQ - Supabase Database

-- ========================================
-- OPTION 1: Enable RLS with Public Read (RECOMMENDED)
-- ========================================

-- Matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on matches" ON matches;
CREATE POLICY "Allow public read access on matches"
ON matches FOR SELECT
USING (true);

-- Teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on teams" ON teams;
CREATE POLICY "Allow public read access on teams"
ON teams FOR SELECT
USING (true);

-- Leagues table
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on leagues" ON leagues;
CREATE POLICY "Allow public read access on leagues"
ON leagues FOR SELECT
USING (true);

-- Players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on players" ON players;
CREATE POLICY "Allow public read access on players"
ON players FOR SELECT
USING (true);

-- Match Players table
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on match_players" ON match_players;
CREATE POLICY "Allow public read access on match_players"
ON match_players FOR SELECT
USING (true);

-- ========================================
-- OPTION 2: Disable RLS Completely (QUICK FIX - NOT RECOMMENDED FOR PRODUCTION)
-- ========================================

-- Uncomment these lines if you want to disable RLS completely:

-- ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE players DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE match_players DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Verify Policies
-- ========================================

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
