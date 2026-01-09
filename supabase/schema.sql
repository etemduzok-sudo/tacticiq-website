-- Fan Manager 2026 - Supabase Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
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

-- =============================================
-- PREDICTIONS TABLE
-- =============================================
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

-- =============================================
-- SQUADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  formation TEXT NOT NULL,
  selected_players JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- =============================================
-- RATINGS TABLE
-- =============================================
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

-- =============================================
-- ACHIEVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
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
-- INDEXES FOR PERFORMANCE
-- =============================================
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

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Predictions: Users can CRUD their own predictions
CREATE POLICY "Users can view own predictions" ON public.predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON public.predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON public.predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions" ON public.predictions
  FOR DELETE USING (auth.uid() = user_id);

-- Squads: Users can CRUD their own squads
CREATE POLICY "Users can view own squads" ON public.squads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own squads" ON public.squads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own squads" ON public.squads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own squads" ON public.squads
  FOR DELETE USING (auth.uid() = user_id);

-- Ratings: Users can CRUD their own ratings
CREATE POLICY "Users can view own ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: Users can view and update their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update user rank based on total points
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

-- Trigger to update user stats when prediction is marked correct/incorrect
CREATE OR REPLACE FUNCTION update_user_stats_on_prediction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct IS NOT NULL AND OLD.is_correct IS NULL THEN
    -- Update total points
    IF NEW.points_earned IS NOT NULL THEN
      UPDATE public.users
      SET total_points = total_points + NEW.points_earned
      WHERE id = NEW.user_id;
    END IF;
    
    -- Update accuracy
    UPDATE public.users
    SET accuracy = calculate_user_accuracy(NEW.user_id)
    WHERE id = NEW.user_id;
    
    -- Update ranks for all users
    PERFORM update_user_ranks();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
AFTER UPDATE ON public.predictions
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_prediction();

-- =============================================
-- INITIAL DATA / SEED
-- =============================================
-- Uncomment to insert test user (optional)
-- INSERT INTO public.users (email, username, total_points, current_streak, best_streak, accuracy, is_premium)
-- VALUES ('test@example.com', 'testuser', 1250, 5, 12, 78.50, false);
