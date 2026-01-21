-- =====================================================
-- Static Teams Database Schema (PostgreSQL/Supabase)
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Static Teams Tablosu
CREATE TABLE IF NOT EXISTS static_teams (
    id SERIAL PRIMARY KEY,
    api_football_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    league VARCHAR(255),
    league_type VARCHAR(50) NOT NULL CHECK (league_type IN ('domestic_top', 'domestic_cup', 'continental', 'international', 'world_cup', 'continental_championship')),
    team_type VARCHAR(20) NOT NULL CHECK (team_type IN ('club', 'national')),
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

-- Indexes for static_teams
CREATE INDEX IF NOT EXISTS idx_static_teams_api_football_id ON static_teams(api_football_id);
CREATE INDEX IF NOT EXISTS idx_static_teams_team_type ON static_teams(team_type);
CREATE INDEX IF NOT EXISTS idx_static_teams_league_type ON static_teams(league_type);
CREATE INDEX IF NOT EXISTS idx_static_teams_country ON static_teams(country);
CREATE INDEX IF NOT EXISTS idx_static_teams_last_updated ON static_teams(last_updated);
CREATE INDEX IF NOT EXISTS idx_static_teams_name ON static_teams(name);
CREATE INDEX IF NOT EXISTS idx_static_teams_name_lower ON static_teams(LOWER(name));

-- Static Leagues Tablosu
CREATE TABLE IF NOT EXISTS static_leagues (
    id SERIAL PRIMARY KEY,
    api_football_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    league_type VARCHAR(50) NOT NULL CHECK (league_type IN ('domestic_top', 'domestic_cup', 'continental', 'international', 'world_cup', 'continental_championship')),
    logo_url TEXT,
    colors JSONB,
    colors_primary VARCHAR(7),
    colors_secondary VARCHAR(7),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for static_leagues
CREATE INDEX IF NOT EXISTS idx_static_leagues_api_football_id ON static_leagues(api_football_id);
CREATE INDEX IF NOT EXISTS idx_static_leagues_league_type ON static_leagues(league_type);
CREATE INDEX IF NOT EXISTS idx_static_leagues_country ON static_leagues(country);

-- Update History Tablosu
CREATE TABLE IF NOT EXISTS static_teams_update_history (
    id SERIAL PRIMARY KEY,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('full_sync', 'incremental', 'cleanup')),
    teams_added INTEGER DEFAULT 0,
    teams_updated INTEGER DEFAULT 0,
    teams_removed INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT
);

-- Indexes for update_history
CREATE INDEX IF NOT EXISTS idx_static_teams_update_history_started_at ON static_teams_update_history(started_at);
CREATE INDEX IF NOT EXISTS idx_static_teams_update_history_status ON static_teams_update_history(status);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_static_teams()
RETURNS void AS $$
BEGIN
    DELETE FROM static_teams
    WHERE last_updated < NOW() - INTERVAL '2 months';
    
    DELETE FROM static_teams_update_history
    WHERE started_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION update_static_teams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_update_static_teams_timestamp ON static_teams;
CREATE TRIGGER trigger_update_static_teams_timestamp
    BEFORE UPDATE ON static_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_static_teams_timestamp();

-- View: Aktif takımlar
CREATE OR REPLACE VIEW v_active_static_teams AS
SELECT 
    id, api_football_id, name, country, league, league_type, team_type,
    colors, colors_primary, colors_secondary, coach, coach_api_id,
    logo_url, flag_url, last_updated
FROM static_teams
WHERE last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country, league, name;

-- View: Milli takımlar
CREATE OR REPLACE VIEW v_national_teams AS
SELECT 
    id, api_football_id, name, country, colors, colors_primary,
    colors_secondary, coach, flag_url
FROM static_teams
WHERE team_type = 'national'
AND last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country;

-- View: Kulüp takımları
CREATE OR REPLACE VIEW v_club_teams AS
SELECT 
    id, api_football_id, name, country, league, league_type,
    colors, colors_primary, colors_secondary, coach
FROM static_teams
WHERE team_type = 'club'
AND last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country, league, name;

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE static_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_teams_update_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access to static_teams (no auth required for reading)
CREATE POLICY "Allow public read access to static_teams" ON static_teams
    FOR SELECT USING (true);

-- Allow service role to manage static_teams
CREATE POLICY "Allow service role to manage static_teams" ON static_teams
    FOR ALL USING (auth.role() = 'service_role');

-- Allow public read access to static_leagues
CREATE POLICY "Allow public read access to static_leagues" ON static_leagues
    FOR SELECT USING (true);

-- Allow service role to manage static_leagues
CREATE POLICY "Allow service role to manage static_leagues" ON static_leagues
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- Initial Data: Fallback Teams
-- =====================================================

-- Milli Takımlar
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary, flag_url)
VALUES
    (1, 'Turkey', 'Turkey', 'International', 'international', 'national', '["#E30A17", "#FFFFFF"]', '#E30A17', '#FFFFFF', 'https://flagcdn.com/w80/tr.png'),
    (2, 'Germany', 'Germany', 'International', 'international', 'national', '["#000000", "#DD0000", "#FFCC00"]', '#000000', '#DD0000', 'https://flagcdn.com/w80/de.png'),
    (3, 'France', 'France', 'International', 'international', 'national', '["#002395", "#FFFFFF", "#ED2939"]', '#002395', '#FFFFFF', 'https://flagcdn.com/w80/fr.png'),
    (10, 'England', 'England', 'International', 'international', 'national', '["#FFFFFF", "#CF081F"]', '#FFFFFF', '#CF081F', 'https://flagcdn.com/w80/gb-eng.png'),
    (9, 'Spain', 'Spain', 'International', 'international', 'national', '["#AA151B", "#F1BF00"]', '#AA151B', '#F1BF00', 'https://flagcdn.com/w80/es.png'),
    (768, 'Italy', 'Italy', 'International', 'international', 'national', '["#009246", "#FFFFFF", "#CE2B37"]', '#009246', '#FFFFFF', 'https://flagcdn.com/w80/it.png'),
    (6, 'Brazil', 'Brazil', 'International', 'international', 'national', '["#009C3B", "#FFDF00"]', '#009C3B', '#FFDF00', 'https://flagcdn.com/w80/br.png'),
    (26, 'Argentina', 'Argentina', 'International', 'international', 'national', '["#74ACDF", "#FFFFFF"]', '#74ACDF', '#FFFFFF', 'https://flagcdn.com/w80/ar.png'),
    (27, 'Portugal', 'Portugal', 'International', 'international', 'national', '["#006600", "#FF0000"]', '#006600', '#FF0000', 'https://flagcdn.com/w80/pt.png'),
    (1118, 'Netherlands', 'Netherlands', 'International', 'international', 'national', '["#FF6600", "#FFFFFF"]', '#FF6600', '#FFFFFF', 'https://flagcdn.com/w80/nl.png'),
    (15, 'Belgium', 'Belgium', 'International', 'international', 'national', '["#000000", "#FDDA25", "#EF3340"]', '#000000', '#FDDA25', 'https://flagcdn.com/w80/be.png'),
    (21, 'Croatia', 'Croatia', 'International', 'international', 'national', '["#FF0000", "#FFFFFF", "#171796"]', '#FF0000', '#FFFFFF', 'https://flagcdn.com/w80/hr.png'),
    (1099, 'Poland', 'Poland', 'International', 'international', 'national', '["#FFFFFF", "#DC143C"]', '#FFFFFF', '#DC143C', 'https://flagcdn.com/w80/pl.png'),
    (772, 'Ukraine', 'Ukraine', 'International', 'international', 'national', '["#005BBB", "#FFD500"]', '#005BBB', '#FFD500', 'https://flagcdn.com/w80/ua.png'),
    (1103, 'Austria', 'Austria', 'International', 'international', 'national', '["#ED2939", "#FFFFFF"]', '#ED2939', '#FFFFFF', 'https://flagcdn.com/w80/at.png'),
    (13, 'Denmark', 'Denmark', 'International', 'international', 'national', '["#C60C30", "#FFFFFF"]', '#C60C30', '#FFFFFF', 'https://flagcdn.com/w80/dk.png'),
    (1091, 'Switzerland', 'Switzerland', 'International', 'international', 'national', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF', 'https://flagcdn.com/w80/ch.png'),
    (1104, 'Serbia', 'Serbia', 'International', 'international', 'national', '["#C6363C", "#FFFFFF", "#0C4076"]', '#C6363C', '#FFFFFF', 'https://flagcdn.com/w80/rs.png'),
    (1100, 'Czech Republic', 'Czech Republic', 'International', 'international', 'national', '["#11457E", "#D7141A", "#FFFFFF"]', '#11457E', '#D7141A', 'https://flagcdn.com/w80/cz.png'),
    (1106, 'Scotland', 'Scotland', 'International', 'international', 'national', '["#0065BF", "#FFFFFF"]', '#0065BF', '#FFFFFF', 'https://flagcdn.com/w80/gb-sct.png')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    flag_url = EXCLUDED.flag_url,
    last_updated = CURRENT_TIMESTAMP;

-- Türk Süper Lig Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (611, 'Fenerbahce', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFED00", "#00205B"]', '#FFED00', '#00205B'),
    (645, 'Galatasaray', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFD700"]', '#FF0000', '#FFD700'),
    (549, 'Besiktas', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
    (551, 'Trabzonspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#632134", "#00BFFF"]', '#632134', '#00BFFF'),
    (3570, 'Başakşehir', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#F37021", "#000000"]', '#F37021', '#000000'),
    (607, 'Adana Demirspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#0000FF", "#FFFFFF"]', '#0000FF', '#FFFFFF'),
    (562, 'Antalyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF'),
    (556, 'Konyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF'),
    (564, 'Sivasspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF'),
    (3571, 'Kasimpasa', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#000066", "#FFFFFF"]', '#000066', '#FFFFFF'),
    (550, 'Goztepe', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFD700", "#C8102E"]', '#FFD700', '#C8102E'),
    (553, 'Kayserispor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFD700"]', '#FF0000', '#FFD700'),
    (563, 'Rizespor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#0000FF"]', '#006633', '#0000FF'),
    (3563, 'Hatayspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#C8102E"]', '#006633', '#C8102E'),
    (565, 'Samsunspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (552, 'Gaziantep FK', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#C8102E", "#000000"]', '#C8102E', '#000000'),
    (3574, 'Alanyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF6600", "#006633"]', '#FF6600', '#006633'),
    (559, 'Bursaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- Premier League Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (50, 'Manchester City', 'England', 'Premier League', 'domestic_top', 'club', '["#6CABDD", "#1C2C5B"]', '#6CABDD', '#1C2C5B'),
    (33, 'Manchester United', 'England', 'Premier League', 'domestic_top', 'club', '["#DA291C", "#FBE122"]', '#DA291C', '#FBE122'),
    (40, 'Liverpool', 'England', 'Premier League', 'domestic_top', 'club', '["#C8102E", "#00B2A9"]', '#C8102E', '#00B2A9'),
    (42, 'Arsenal', 'England', 'Premier League', 'domestic_top', 'club', '["#EF0107", "#FFFFFF"]', '#EF0107', '#FFFFFF'),
    (49, 'Chelsea', 'England', 'Premier League', 'domestic_top', 'club', '["#034694", "#FFFFFF"]', '#034694', '#FFFFFF'),
    (47, 'Tottenham', 'England', 'Premier League', 'domestic_top', 'club', '["#132257", "#FFFFFF"]', '#132257', '#FFFFFF'),
    (66, 'Aston Villa', 'England', 'Premier League', 'domestic_top', 'club', '["#670E36", "#95BFE5"]', '#670E36', '#95BFE5'),
    (34, 'Newcastle', 'England', 'Premier League', 'domestic_top', 'club', '["#241F20", "#FFFFFF"]', '#241F20', '#FFFFFF'),
    (51, 'Brighton', 'England', 'Premier League', 'domestic_top', 'club', '["#0057B8", "#FFFFFF"]', '#0057B8', '#FFFFFF'),
    (39, 'Wolverhampton', 'England', 'Premier League', 'domestic_top', 'club', '["#FDB913", "#231F20"]', '#FDB913', '#231F20'),
    (48, 'West Ham', 'England', 'Premier League', 'domestic_top', 'club', '["#7A263A", "#1BB1E7"]', '#7A263A', '#1BB1E7'),
    (52, 'Crystal Palace', 'England', 'Premier League', 'domestic_top', 'club', '["#1B458F", "#C4122E"]', '#1B458F', '#C4122E'),
    (36, 'Fulham', 'England', 'Premier League', 'domestic_top', 'club', '["#FFFFFF", "#000000"]', '#FFFFFF', '#000000'),
    (55, 'Brentford', 'England', 'Premier League', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (65, 'Nottingham Forest', 'England', 'Premier League', 'domestic_top', 'club', '["#DD0000", "#FFFFFF"]', '#DD0000', '#FFFFFF'),
    (35, 'Bournemouth', 'England', 'Premier League', 'domestic_top', 'club', '["#B50E12", "#000000"]', '#B50E12', '#000000'),
    (45, 'Everton', 'England', 'Premier League', 'domestic_top', 'club', '["#003399", "#FFFFFF"]', '#003399', '#FFFFFF'),
    (46, 'Leicester', 'England', 'Premier League', 'domestic_top', 'club', '["#003090", "#FDBE11"]', '#003090', '#FDBE11'),
    (57, 'Ipswich', 'England', 'Premier League', 'domestic_top', 'club', '["#0000FF", "#FFFFFF"]', '#0000FF', '#FFFFFF'),
    (41, 'Southampton', 'England', 'Premier League', 'domestic_top', 'club', '["#D71920", "#FFFFFF"]', '#D71920', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- La Liga Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (541, 'Real Madrid', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFFFFF", "#00529F"]', '#FFFFFF', '#00529F'),
    (529, 'Barcelona', 'Spain', 'La Liga', 'domestic_top', 'club', '["#004D98", "#A50044"]', '#004D98', '#A50044'),
    (530, 'Atletico Madrid', 'Spain', 'La Liga', 'domestic_top', 'club', '["#CB3524", "#FFFFFF"]', '#CB3524', '#FFFFFF'),
    (548, 'Real Sociedad', 'Spain', 'La Liga', 'domestic_top', 'club', '["#0067B1", "#FFFFFF"]', '#0067B1', '#FFFFFF'),
    (538, 'Sevilla', 'Spain', 'La Liga', 'domestic_top', 'club', '["#F43333", "#FFFFFF"]', '#F43333', '#FFFFFF'),
    (532, 'Valencia', 'Spain', 'La Liga', 'domestic_top', 'club', '["#EE7500", "#000000"]', '#EE7500', '#000000'),
    (543, 'Real Betis', 'Spain', 'La Liga', 'domestic_top', 'club', '["#00954C", "#FFFFFF"]', '#00954C', '#FFFFFF'),
    (531, 'Athletic Bilbao', 'Spain', 'La Liga', 'domestic_top', 'club', '["#EE2523", "#FFFFFF"]', '#EE2523', '#FFFFFF'),
    (533, 'Villarreal', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFFF00", "#005592"]', '#FFFF00', '#005592'),
    (723, 'Almeria', 'Spain', 'La Liga', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (540, 'Espanyol', 'Spain', 'La Liga', 'domestic_top', 'club', '["#007FC8", "#FFFFFF"]', '#007FC8', '#FFFFFF'),
    (539, 'Levante', 'Spain', 'La Liga', 'domestic_top', 'club', '["#004B93", "#C8102E"]', '#004B93', '#C8102E'),
    (536, 'Getafe', 'Spain', 'La Liga', 'domestic_top', 'club', '["#004999", "#FFFFFF"]', '#004999', '#FFFFFF'),
    (798, 'Mallorca', 'Spain', 'La Liga', 'domestic_top', 'club', '["#C8102E", "#000000"]', '#C8102E', '#000000'),
    (728, 'Rayo Vallecano', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFFFFF", "#C8102E"]', '#FFFFFF', '#C8102E'),
    (797, 'Elche', 'Spain', 'La Liga', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF'),
    (534, 'Las Palmas', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFFF00", "#0000FF"]', '#FFFF00', '#0000FF'),
    (542, 'Celta Vigo', 'Spain', 'La Liga', 'domestic_top', 'club', '["#8AC3EE", "#FFFFFF"]', '#8AC3EE', '#FFFFFF'),
    (547, 'Girona', 'Spain', 'La Liga', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (727, 'Osasuna', 'Spain', 'La Liga', 'domestic_top', 'club', '["#0A3B76", "#C8102E"]', '#0A3B76', '#C8102E')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- Bundesliga Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (157, 'Bayern Munich', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#DC052D", "#FFFFFF"]', '#DC052D', '#FFFFFF'),
    (165, 'Borussia Dortmund', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#FDE100", "#000000"]', '#FDE100', '#000000'),
    (173, 'RB Leipzig', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#DD0741", "#FFFFFF"]', '#DD0741', '#FFFFFF'),
    (168, 'Bayer Leverkusen', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#E32221", "#000000"]', '#E32221', '#000000'),
    (169, 'Eintracht Frankfurt', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#000000", "#E1000F"]', '#000000', '#E1000F'),
    (167, 'SC Freiburg', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#000000", "#E2001A"]', '#000000', '#E2001A'),
    (160, 'Union Berlin', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#EB1923", "#FFFFFF"]', '#EB1923', '#FFFFFF'),
    (162, 'Werder Bremen', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#1D9053", "#FFFFFF"]', '#1D9053', '#FFFFFF'),
    (182, 'VfB Stuttgart', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#E32219", "#FFFFFF"]', '#E32219', '#FFFFFF'),
    (159, 'Hertha Berlin', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#005DAC", "#FFFFFF"]', '#005DAC', '#FFFFFF'),
    (161, 'VfL Wolfsburg', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#65B32E", "#FFFFFF"]', '#65B32E', '#FFFFFF'),
    (163, 'Borussia Monchengladbach', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
    (164, 'FSV Mainz 05', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (170, 'FC Augsburg', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#C8102E", "#006633"]', '#C8102E', '#006633'),
    (172, 'VfL Bochum', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#0000FF", "#FFFFFF"]', '#0000FF', '#FFFFFF'),
    (174, 'FC Koln', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#ED1C24", "#FFFFFF"]', '#ED1C24', '#FFFFFF'),
    (192, 'FC Schalke 04', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#004D9D", "#FFFFFF"]', '#004D9D', '#FFFFFF'),
    (180, 'Hoffenheim', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#1E88E5", "#FFFFFF"]', '#1E88E5', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- Serie A Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (489, 'AC Milan', 'Italy', 'Serie A', 'domestic_top', 'club', '["#AC1818", "#000000"]', '#AC1818', '#000000'),
    (505, 'Inter', 'Italy', 'Serie A', 'domestic_top', 'club', '["#010E80", "#000000"]', '#010E80', '#000000'),
    (496, 'Juventus', 'Italy', 'Serie A', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
    (492, 'Napoli', 'Italy', 'Serie A', 'domestic_top', 'club', '["#12A0D7", "#FFFFFF"]', '#12A0D7', '#FFFFFF'),
    (497, 'AS Roma', 'Italy', 'Serie A', 'domestic_top', 'club', '["#8E1F2F", "#F0BC42"]', '#8E1F2F', '#F0BC42'),
    (487, 'Lazio', 'Italy', 'Serie A', 'domestic_top', 'club', '["#87D8F7", "#FFFFFF"]', '#87D8F7', '#FFFFFF'),
    (500, 'Atalanta', 'Italy', 'Serie A', 'domestic_top', 'club', '["#1B478D", "#000000"]', '#1B478D', '#000000'),
    (502, 'Fiorentina', 'Italy', 'Serie A', 'domestic_top', 'club', '["#472C84", "#FFFFFF"]', '#472C84', '#FFFFFF'),
    (503, 'Torino', 'Italy', 'Serie A', 'domestic_top', 'club', '["#8B0000", "#FFFFFF"]', '#8B0000', '#FFFFFF'),
    (504, 'Hellas Verona', 'Italy', 'Serie A', 'domestic_top', 'club', '["#FFFF00", "#003366"]', '#FFFF00', '#003366'),
    (488, 'Sassuolo', 'Italy', 'Serie A', 'domestic_top', 'club', '["#000000", "#006633"]', '#000000', '#006633'),
    (494, 'Udinese', 'Italy', 'Serie A', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
    (490, 'Cagliari', 'Italy', 'Serie A', 'domestic_top', 'club', '["#9F0200", "#003399"]', '#9F0200', '#003399'),
    (495, 'Genoa', 'Italy', 'Serie A', 'domestic_top', 'club', '["#A7082B", "#0033A0"]', '#A7082B', '#0033A0'),
    (498, 'Sampdoria', 'Italy', 'Serie A', 'domestic_top', 'club', '["#005BAC", "#FFFFFF"]', '#005BAC', '#FFFFFF'),
    (499, 'Spezia', 'Italy', 'Serie A', 'domestic_top', 'club', '["#FFFFFF", "#000000"]', '#FFFFFF', '#000000'),
    (511, 'Empoli', 'Italy', 'Serie A', 'domestic_top', 'club', '["#005CA9", "#FFFFFF"]', '#005CA9', '#FFFFFF'),
    (514, 'Lecce', 'Italy', 'Serie A', 'domestic_top', 'club', '["#FFD700", "#C8102E"]', '#FFD700', '#C8102E'),
    (515, 'Monza', 'Italy', 'Serie A', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (520, 'Bologna', 'Italy', 'Serie A', 'domestic_top', 'club', '["#1A2F4F", "#C8102E"]', '#1A2F4F', '#C8102E')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- Ligue 1 Takımları
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
    (85, 'Paris Saint Germain', 'France', 'Ligue 1', 'domestic_top', 'club', '["#004170", "#DA291C"]', '#004170', '#DA291C'),
    (81, 'Marseille', 'France', 'Ligue 1', 'domestic_top', 'club', '["#2FAEE0", "#FFFFFF"]', '#2FAEE0', '#FFFFFF'),
    (79, 'Lille', 'France', 'Ligue 1', 'domestic_top', 'club', '["#E3001B", "#FFFFFF"]', '#E3001B', '#FFFFFF'),
    (80, 'Lyon', 'France', 'Ligue 1', 'domestic_top', 'club', '["#0046A0", "#E10000"]', '#0046A0', '#E10000'),
    (91, 'Monaco', 'France', 'Ligue 1', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (94, 'Rennes', 'France', 'Ligue 1', 'domestic_top', 'club', '["#000000", "#D10B14"]', '#000000', '#D10B14'),
    (84, 'Nice', 'France', 'Ligue 1', 'domestic_top', 'club', '["#000000", "#FF0000"]', '#000000', '#FF0000'),
    (93, 'Reims', 'France', 'Ligue 1', 'domestic_top', 'club', '["#B1102E", "#FFFFFF"]', '#B1102E', '#FFFFFF'),
    (116, 'Lens', 'France', 'Ligue 1', 'domestic_top', 'club', '["#FFE100", "#D20000"]', '#FFE100', '#D20000'),
    (82, 'Montpellier', 'France', 'Ligue 1', 'domestic_top', 'club', '["#F58025", "#004A99"]', '#F58025', '#004A99'),
    (83, 'Nantes', 'France', 'Ligue 1', 'domestic_top', 'club', '["#FCE100", "#008D36"]', '#FCE100', '#008D36'),
    (78, 'Bordeaux', 'France', 'Ligue 1', 'domestic_top', 'club', '["#142032", "#FFFFFF"]', '#142032', '#FFFFFF'),
    (77, 'Angers', 'France', 'Ligue 1', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
    (95, 'Strasbourg', 'France', 'Ligue 1', 'domestic_top', 'club', '["#0087D0", "#FFFFFF"]', '#0087D0', '#FFFFFF'),
    (96, 'Toulouse', 'France', 'Ligue 1', 'domestic_top', 'club', '["#7A3998", "#FFFFFF"]', '#7A3998', '#FFFFFF'),
    (97, 'Lorient', 'France', 'Ligue 1', 'domestic_top', 'club', '["#F47216", "#000000"]', '#F47216', '#000000'),
    (99, 'Brest', 'France', 'Ligue 1', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
    (108, 'Auxerre', 'France', 'Ligue 1', 'domestic_top', 'club', '["#0052A5", "#FFFFFF"]', '#0052A5', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
    name = EXCLUDED.name,
    league = EXCLUDED.league,
    colors = EXCLUDED.colors,
    colors_primary = EXCLUDED.colors_primary,
    colors_secondary = EXCLUDED.colors_secondary,
    last_updated = CURRENT_TIMESTAMP;

-- =====================================================
-- Verify data
-- =====================================================
SELECT 
    'Static Teams DB Created!' AS status,
    (SELECT COUNT(*) FROM static_teams) AS total_teams,
    (SELECT COUNT(*) FROM static_teams WHERE team_type = 'national') AS national_teams,
    (SELECT COUNT(*) FROM static_teams WHERE team_type = 'club') AS club_teams;
