-- MATCHES SCHEMA - COPY PASTE THIS ENTIRE FILE

CREATE TABLE IF NOT EXISTS leagues (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  country_code VARCHAR(10),
  logo TEXT,
  flag TEXT,
  season INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_season ON leagues(season);
CREATE INDEX IF NOT EXISTS idx_leagues_country ON leagues(country);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),
  country VARCHAR(100),
  logo TEXT,
  is_national BOOLEAN DEFAULT false,
  founded INTEGER,
  venue_name VARCHAR(255),
  venue_city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  round VARCHAR(100),
  home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  fixture_date TIMESTAMPTZ NOT NULL,
  fixture_timestamp BIGINT,
  timezone VARCHAR(100) DEFAULT 'UTC',
  status VARCHAR(50) NOT NULL,
  status_long VARCHAR(100),
  elapsed INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  halftime_home INTEGER,
  halftime_away INTEGER,
  fulltime_home INTEGER,
  fulltime_away INTEGER,
  extratime_home INTEGER,
  extratime_away INTEGER,
  penalty_home INTEGER,
  penalty_away INTEGER,
  venue_name VARCHAR(255),
  venue_city VARCHAR(100),
  referee VARCHAR(255),
  has_lineups BOOLEAN DEFAULT false,
  has_statistics BOOLEAN DEFAULT false,
  has_events BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id)
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(fixture_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season);

CREATE TABLE IF NOT EXISTS match_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  shots_on_goal INTEGER DEFAULT 0,
  shots_off_goal INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  blocked_shots INTEGER DEFAULT 0,
  shots_inside_box INTEGER DEFAULT 0,
  shots_outside_box INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  corner_kicks INTEGER DEFAULT 0,
  offsides INTEGER DEFAULT 0,
  ball_possession INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  goalkeeper_saves INTEGER DEFAULT 0,
  total_passes INTEGER DEFAULT 0,
  passes_accurate INTEGER DEFAULT 0,
  passes_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_match_stats_match ON match_statistics(match_id);

CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  elapsed INTEGER NOT NULL,
  elapsed_plus INTEGER,
  type VARCHAR(50) NOT NULL,
  detail VARCHAR(100),
  comments TEXT,
  player_id INTEGER,
  player_name VARCHAR(255),
  assist_id INTEGER,
  assist_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_event_type CHECK (type IN ('Goal', 'Card', 'subst', 'Var'))
);

CREATE INDEX IF NOT EXISTS idx_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON match_events(type);
CREATE INDEX IF NOT EXISTS idx_events_elapsed ON match_events(elapsed);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_statistics_updated_at BEFORE UPDATE ON match_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leagues"
  ON leagues FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view match statistics"
  ON match_statistics FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view match events"
  ON match_events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage leagues"
  ON leagues FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage teams"
  ON teams FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage matches"
  ON matches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage match statistics"
  ON match_statistics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage match events"
  ON match_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT 'Matches schema created successfully!' AS status;
