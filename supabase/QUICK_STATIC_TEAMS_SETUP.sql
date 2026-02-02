-- =====================================================
-- QUICK Static Teams Setup - Copy & Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/sql
-- =====================================================

-- 1. Create the static_teams table
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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_static_teams_api_football_id ON static_teams(api_football_id);
CREATE INDEX IF NOT EXISTS idx_static_teams_team_type ON static_teams(team_type);
CREATE INDEX IF NOT EXISTS idx_static_teams_country ON static_teams(country);
CREATE INDEX IF NOT EXISTS idx_static_teams_name_lower ON static_teams(LOWER(name));

-- 3. Enable RLS
ALTER TABLE static_teams ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (drop if exists first)
DROP POLICY IF EXISTS "Allow public read access" ON static_teams;
CREATE POLICY "Allow public read access" ON static_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role full access" ON static_teams;
CREATE POLICY "Allow service role full access" ON static_teams FOR ALL USING (auth.role() = 'service_role');

-- 5. Create views
CREATE OR REPLACE VIEW v_active_static_teams AS
SELECT * FROM static_teams WHERE last_updated >= NOW() - INTERVAL '2 months';

CREATE OR REPLACE VIEW v_national_teams AS
SELECT id, api_football_id, name, country, colors, colors_primary, colors_secondary, coach, flag_url
FROM static_teams WHERE team_type = 'national' AND last_updated >= NOW() - INTERVAL '2 months';

CREATE OR REPLACE VIEW v_club_teams AS
SELECT id, api_football_id, name, country, league, league_type, colors, colors_primary, colors_secondary, coach
FROM static_teams WHERE team_type = 'club' AND last_updated >= NOW() - INTERVAL '2 months';

-- 6. Insert initial data
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary, flag_url) VALUES
(1, 'Turkey', 'Turkey', 'International', 'international', 'national', '["#E30A17", "#FFFFFF"]', '#E30A17', '#FFFFFF', 'https://flagcdn.com/w80/tr.png'),
(2, 'Germany', 'Germany', 'International', 'international', 'national', '["#000000", "#DD0000"]', '#000000', '#DD0000', 'https://flagcdn.com/w80/de.png'),
(3, 'France', 'France', 'International', 'international', 'national', '["#002395", "#FFFFFF"]', '#002395', '#FFFFFF', 'https://flagcdn.com/w80/fr.png'),
(10, 'England', 'England', 'International', 'international', 'national', '["#FFFFFF", "#CF081F"]', '#FFFFFF', '#CF081F', 'https://flagcdn.com/w80/gb-eng.png'),
(9, 'Spain', 'Spain', 'International', 'international', 'national', '["#AA151B", "#F1BF00"]', '#AA151B', '#F1BF00', 'https://flagcdn.com/w80/es.png'),
(768, 'Italy', 'Italy', 'International', 'international', 'national', '["#009246", "#FFFFFF"]', '#009246', '#FFFFFF', 'https://flagcdn.com/w80/it.png'),
(6, 'Brazil', 'Brazil', 'International', 'international', 'national', '["#009C3B", "#FFDF00"]', '#009C3B', '#FFDF00', 'https://flagcdn.com/w80/br.png'),
(26, 'Argentina', 'Argentina', 'International', 'international', 'national', '["#74ACDF", "#FFFFFF"]', '#74ACDF', '#FFFFFF', 'https://flagcdn.com/w80/ar.png'),
(27, 'Portugal', 'Portugal', 'International', 'international', 'national', '["#006600", "#FF0000"]', '#006600', '#FF0000', 'https://flagcdn.com/w80/pt.png'),
(1118, 'Netherlands', 'Netherlands', 'International', 'international', 'national', '["#FF6600", "#FFFFFF"]', '#FF6600', '#FFFFFF', 'https://flagcdn.com/w80/nl.png'),
(15, 'Belgium', 'Belgium', 'International', 'international', 'national', '["#000000", "#FDDA25"]', '#000000', '#FDDA25', 'https://flagcdn.com/w80/be.png'),
(21, 'Croatia', 'Croatia', 'International', 'international', 'national', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF', 'https://flagcdn.com/w80/hr.png')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, flag_url = EXCLUDED.flag_url, last_updated = NOW();

-- Turkish Super Lig
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(611, 'Fenerbahce', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFED00", "#00205B"]', '#FFED00', '#00205B'),
(645, 'Galatasaray', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFD700"]', '#FF0000', '#FFD700'),
(549, 'Besiktas', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
(551, 'Trabzonspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#632134", "#00BFFF"]', '#632134', '#00BFFF'),
(3570, 'Basaksehir', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#F37021", "#000000"]', '#F37021', '#000000'),
(607, 'Adana Demirspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#0000FF", "#FFFFFF"]', '#0000FF', '#FFFFFF'),
(562, 'Antalyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF'),
(557, 'Konyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Premier League
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(50, 'Manchester City', 'England', 'Premier League', 'domestic_top', 'club', '["#6CABDD", "#1C2C5B"]', '#6CABDD', '#1C2C5B'),
(33, 'Manchester United', 'England', 'Premier League', 'domestic_top', 'club', '["#DA291C", "#FBE122"]', '#DA291C', '#FBE122'),
(40, 'Liverpool', 'England', 'Premier League', 'domestic_top', 'club', '["#C8102E", "#00B2A9"]', '#C8102E', '#00B2A9'),
(42, 'Arsenal', 'England', 'Premier League', 'domestic_top', 'club', '["#EF0107", "#FFFFFF"]', '#EF0107', '#FFFFFF'),
(49, 'Chelsea', 'England', 'Premier League', 'domestic_top', 'club', '["#034694", "#FFFFFF"]', '#034694', '#FFFFFF'),
(47, 'Tottenham', 'England', 'Premier League', 'domestic_top', 'club', '["#132257", "#FFFFFF"]', '#132257', '#FFFFFF'),
(66, 'Aston Villa', 'England', 'Premier League', 'domestic_top', 'club', '["#670E36", "#95BFE5"]', '#670E36', '#95BFE5'),
(34, 'Newcastle', 'England', 'Premier League', 'domestic_top', 'club', '["#241F20", "#FFFFFF"]', '#241F20', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- La Liga
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(541, 'Real Madrid', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFFFFF", "#00529F"]', '#FFFFFF', '#00529F'),
(529, 'Barcelona', 'Spain', 'La Liga', 'domestic_top', 'club', '["#004D98", "#A50044"]', '#004D98', '#A50044'),
(530, 'Atletico Madrid', 'Spain', 'La Liga', 'domestic_top', 'club', '["#CB3524", "#FFFFFF"]', '#CB3524', '#FFFFFF'),
(548, 'Real Sociedad', 'Spain', 'La Liga', 'domestic_top', 'club', '["#0067B1", "#FFFFFF"]', '#0067B1', '#FFFFFF'),
(538, 'Sevilla', 'Spain', 'La Liga', 'domestic_top', 'club', '["#F43333", "#FFFFFF"]', '#F43333', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Bundesliga
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(157, 'Bayern Munich', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#DC052D", "#FFFFFF"]', '#DC052D', '#FFFFFF'),
(165, 'Borussia Dortmund', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#FDE100", "#000000"]', '#FDE100', '#000000'),
(168, 'Bayer Leverkusen', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#E32221", "#000000"]', '#E32221', '#000000'),
(173, 'RB Leipzig', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#DD0741", "#FFFFFF"]', '#DD0741', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Serie A
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(489, 'AC Milan', 'Italy', 'Serie A', 'domestic_top', 'club', '["#AC1818", "#000000"]', '#AC1818', '#000000'),
(505, 'Inter', 'Italy', 'Serie A', 'domestic_top', 'club', '["#010E80", "#000000"]', '#010E80', '#000000'),
(496, 'Juventus', 'Italy', 'Serie A', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
(492, 'Napoli', 'Italy', 'Serie A', 'domestic_top', 'club', '["#12A0D7", "#FFFFFF"]', '#12A0D7', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Ligue 1
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary) VALUES
(85, 'Paris Saint Germain', 'France', 'Ligue 1', 'domestic_top', 'club', '["#004170", "#DA291C"]', '#004170', '#DA291C'),
(81, 'Marseille', 'France', 'Ligue 1', 'domestic_top', 'club', '["#2FAEE0", "#FFFFFF"]', '#2FAEE0', '#FFFFFF'),
(80, 'Lyon', 'France', 'Ligue 1', 'domestic_top', 'club', '["#0046A0", "#E10000"]', '#0046A0', '#E10000'),
(91, 'Monaco', 'France', 'Ligue 1', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Verify
SELECT 
  'SUCCESS! Static Teams Created' AS status,
  (SELECT COUNT(*) FROM static_teams) AS total_teams,
  (SELECT COUNT(*) FROM static_teams WHERE team_type = 'national') AS national_teams,
  (SELECT COUNT(*) FROM static_teams WHERE team_type = 'club') AS club_teams;
