-- Test ortamı: Gerçek maç verilerinden türetilmiş test maçları
-- Fenerbahçe + Beşiktaş: 3 geçmiş (FT) + 4 canlı (1H/2H/HT) + 3 yaklaşan (NS)

CREATE TABLE IF NOT EXISTS test_matches (
  id INTEGER PRIMARY KEY,
  source_match_id INTEGER,
  league_id INTEGER,
  season INTEGER NOT NULL,
  round VARCHAR(100),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  league_id INTEGER REFERENCES leagues(id),
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
  lineups JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_matches_status ON test_matches(status);
CREATE INDEX IF NOT EXISTS idx_test_matches_date ON test_matches(fixture_date);
CREATE INDEX IF NOT EXISTS idx_test_matches_teams ON test_matches(home_team_id, away_team_id);

COMMENT ON TABLE test_matches IS 'Test ortamı - gerçek maç verilerinden türetilmiş (tarih/statü değiştirilmiş)';
