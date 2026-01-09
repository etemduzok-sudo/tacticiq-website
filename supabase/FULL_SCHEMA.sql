-- =============================================
-- Fan Manager 2026 - COMPLETE DATABASE SCHEMA
-- =============================================
-- Copy this entire file and run it in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau/sql
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PART 1: USER DATA TABLES
-- =============================================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0.00,
  rank INTEGER,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  favorite_teams TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('match_result', 'score', 'scorer', 'cards', 'first_goal', 'corner_count')),
  prediction_value JSONB NOT NULL,
  points_earned INTEGER,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, prediction_type)
);

-- SQUADS TABLE
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  formation TEXT NOT NULL,
  selected_players JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('home', 'away')),
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, team, category)
);

-- ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('match_start', 'result', 'achievement', 'premium', 'leaderboard')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PART 2: MATCH DATA TABLES
-- =============================================

-- LEAGUES TABLE
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

-- TEAMS TABLE
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

-- MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
  id INTEGER PRIMARY KEY,
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
  events JSONB,
  lineups JSONB,
  statistics JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLAYERS TABLE
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

-- MATCH_PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES public.teams(id),
  position TEXT,
  grid TEXT,
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

-- User data indexes
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_squads_user_id ON public.squads(user_id);
CREATE INDEX IF NOT EXISTS idx_squads_match_id ON public.squads(match_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_match_id ON public.ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_rank ON public.users(rank);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);

-- Match data indexes
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

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Prediction policies
CREATE POLICY "Users can view own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Squad policies
CREATE POLICY "Users can view own squads" ON public.squads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own squads" ON public.squads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own squads" ON public.squads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own squads" ON public.squads
  FOR DELETE USING (auth.uid() = user_id);

-- Rating policies
CREATE POLICY "Users can view own ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievement policies
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for match data
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

-- Function to update user ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET rank = subquery.new_rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) AS new_rank
    FROM public.users
  ) AS subquery
  WHERE public.users.id = subquery.id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user accuracy
CREATE OR REPLACE FUNCTION calculate_user_accuracy(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_predictions INTEGER;
  correct_predictions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_predictions
  FROM public.predictions
  WHERE user_id = p_user_id AND is_correct IS NOT NULL;
  
  IF total_predictions = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO correct_predictions
  FROM public.predictions
  WHERE user_id = p_user_id AND is_correct = TRUE;
  
  RETURN ROUND((correct_predictions::NUMERIC / total_predictions::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats
CREATE OR REPLACE FUNCTION update_user_stats_on_prediction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct IS NOT NULL AND OLD.is_correct IS NULL THEN
    IF NEW.points_earned IS NOT NULL THEN
      UPDATE public.users
      SET total_points = total_points + NEW.points_earned
      WHERE id = NEW.user_id;
    END IF;
    
    UPDATE public.users
    SET accuracy = calculate_user_accuracy(NEW.user_id)
    WHERE id = NEW.user_id;
    
    PERFORM update_user_ranks();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER UPDATE ON public.predictions
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_prediction();

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
-- DONE! 
-- =============================================
-- All tables, indexes, policies, functions, and triggers are created.
-- You can now use the database with your Fan Manager 2026 app!
