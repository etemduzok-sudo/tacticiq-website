-- Fan Manager 2026 - Matches & Teams Schema Extension
-- Run this AFTER the main schema.sql

-- =============================================
-- LEAGUES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  logo TEXT,
  season INTEGER NOT NULL,
  type TEXT CHECK (type IN ('league', 'cup')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  country TEXT,
  logo TEXT,
  founded INTEGER,
  venue_name TEXT,
  venue_capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.matches (
  id INTEGER PRIMARY KEY, -- API-Football fixture ID
  league_id INTEGER REFERENCES public.leagues(id),
  season INTEGER NOT NULL,
  round TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  timestamp BIGINT NOT NULL,
  timezone TEXT,
  venue TEXT,
  referee TEXT,
  
  -- Status
  status_long TEXT NOT NULL,
  status_short TEXT NOT NULL,
  status_elapsed INTEGER,
  
  -- Teams
  home_team_id INTEGER REFERENCES public.teams(id),
  away_team_id INTEGER REFERENCES public.teams(id),
  
  -- Score
  home_goals INTEGER,
  away_goals INTEGER,
  home_halftime_goals INTEGER,
  away_halftime_goals INTEGER,
  home_fulltime_goals INTEGER,
  away_fulltime_goals INTEGER,
  
  -- Additional Data
  events JSONB, -- Goals, cards, substitutions
  lineups JSONB, -- Starting XI and bench
  statistics JSONB, -- Possession, shots, etc.
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PLAYERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  firstname TEXT,
  lastname TEXT,
  age INTEGER,
  nationality TEXT,
  photo TEXT,
  height TEXT,
  weight TEXT,
  position TEXT,
  team_id INTEGER REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MATCH_PLAYERS TABLE (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES public.teams(id),
  position TEXT, -- Goalkeeper, Defender, Midfielder, Attacker
  grid TEXT, -- e.g., "4:3"
  rating NUMERIC(3,1),
  minutes_played INTEGER,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  is_starter BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status_short);
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_timestamp ON public.matches(timestamp);
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON public.match_players(player_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Public read access for matches, teams, leagues, players
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth required)
CREATE POLICY "Public can view leagues" ON public.leagues
  FOR SELECT USING (true);

CREATE POLICY "Public can view teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Public can view matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Public can view players" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Public can view match_players" ON public.match_players
  FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_leagues_updated_at
BEFORE UPDATE ON public.leagues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get live matches
CREATE OR REPLACE FUNCTION get_live_matches()
RETURNS TABLE (
  match_id INTEGER,
  league_name TEXT,
  home_team TEXT,
  away_team TEXT,
  home_goals INTEGER,
  away_goals INTEGER,
  status TEXT,
  elapsed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    l.name,
    ht.name,
    at.name,
    m.home_goals,
    m.away_goals,
    m.status_short,
    m.status_elapsed
  FROM public.matches m
  JOIN public.leagues l ON m.league_id = l.id
  JOIN public.teams ht ON m.home_team_id = ht.id
  JOIN public.teams at ON m.away_team_id = at.id
  WHERE m.status_short IN ('1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE')
  ORDER BY m.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Get matches by date range
CREATE OR REPLACE FUNCTION get_matches_by_date_range(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  match_id INTEGER,
  league_name TEXT,
  home_team TEXT,
  away_team TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    l.name,
    ht.name,
    at.name,
    m.date,
    m.status_short
  FROM public.matches m
  JOIN public.leagues l ON m.league_id = l.id
  JOIN public.teams ht ON m.home_team_id = ht.id
  JOIN public.teams at ON m.away_team_id = at.id
  WHERE m.date BETWEEN start_date AND end_date
  ORDER BY m.date ASC;
END;
$$ LANGUAGE plpgsql;

-- Get matches by team
CREATE OR REPLACE FUNCTION get_matches_by_team(team_id_param INTEGER)
RETURNS TABLE (
  match_id INTEGER,
  league_name TEXT,
  home_team TEXT,
  away_team TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  home_goals INTEGER,
  away_goals INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    l.name,
    ht.name,
    at.name,
    m.date,
    m.home_goals,
    m.away_goals,
    m.status_short
  FROM public.matches m
  JOIN public.leagues l ON m.league_id = l.id
  JOIN public.teams ht ON m.home_team_id = ht.id
  JOIN public.teams at ON m.away_team_id = at.id
  WHERE m.home_team_id = team_id_param OR m.away_team_id = team_id_param
  ORDER BY m.date DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL SEED DATA (Optional)
-- =============================================
-- Uncomment to insert test data

/*
-- Insert sample leagues
INSERT INTO public.leagues (id, name, country, season, type) VALUES
(39, 'Premier League', 'England', 2025, 'league'),
(140, 'La Liga', 'Spain', 2025, 'league'),
(203, 'Süper Lig', 'Turkey', 2025, 'league')
ON CONFLICT (id) DO NOTHING;

-- Insert sample teams
INSERT INTO public.teams (id, name, code, country) VALUES
(33, 'Manchester United', 'MUN', 'England'),
(34, 'Newcastle', 'NEW', 'England'),
(529, 'Barcelona', 'BAR', 'Spain'),
(541, 'Real Madrid', 'RMA', 'Spain'),
(645, 'Fenerbahçe', 'FEN', 'Turkey'),
(646, 'Galatasaray', 'GAL', 'Turkey')
ON CONFLICT (id) DO NOTHING;
*/
