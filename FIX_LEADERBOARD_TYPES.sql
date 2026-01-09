-- Fix leaderboard function return types

DROP FUNCTION IF EXISTS get_leaderboard(INTEGER, INTEGER, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_period VARCHAR DEFAULT 'overall'
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  weekly_points INTEGER,
  monthly_points INTEGER,
  accuracy_percentage NUMERIC,
  current_streak INTEGER,
  best_streak INTEGER,
  total_predictions INTEGER,
  correct_predictions INTEGER,
  badges JSONB,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_period = 'overall' THEN
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.accuracy_percentage DESC) as rank,
      u.id as user_id,
      u.username::TEXT,
      u.email::TEXT,
      u.avatar_url,
      us.total_points,
      us.weekly_points,
      us.monthly_points,
      us.accuracy_percentage,
      us.current_streak,
      us.best_streak,
      us.total_predictions,
      us.correct_predictions,
      us.badges,
      us.updated_at::TIMESTAMPTZ
    FROM 
      user_stats us
      INNER JOIN users u ON u.id = us.user_id
    WHERE 
      us.total_predictions > 0
    ORDER BY 
      us.total_points DESC,
      us.accuracy_percentage DESC
    LIMIT p_limit
    OFFSET p_offset;
    
  ELSIF p_period = 'weekly' THEN
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY us.weekly_points DESC, us.accuracy_percentage DESC) as rank,
      u.id as user_id,
      u.username::TEXT,
      u.email::TEXT,
      u.avatar_url,
      us.total_points,
      us.weekly_points,
      us.monthly_points,
      us.accuracy_percentage,
      us.current_streak,
      us.best_streak,
      us.total_predictions,
      us.correct_predictions,
      us.badges,
      us.updated_at::TIMESTAMPTZ
    FROM 
      user_stats us
      INNER JOIN users u ON u.id = us.user_id
    WHERE 
      us.total_predictions > 0
      AND us.weekly_points > 0
    ORDER BY 
      us.weekly_points DESC,
      us.accuracy_percentage DESC
    LIMIT p_limit
    OFFSET p_offset;
    
  ELSIF p_period = 'monthly' THEN
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY us.monthly_points DESC, us.accuracy_percentage DESC) as rank,
      u.id as user_id,
      u.username::TEXT,
      u.email::TEXT,
      u.avatar_url,
      us.total_points,
      us.weekly_points,
      us.monthly_points,
      us.accuracy_percentage,
      us.current_streak,
      us.best_streak,
      us.total_predictions,
      us.correct_predictions,
      us.badges,
      us.updated_at::TIMESTAMPTZ
    FROM 
      user_stats us
      INNER JOIN users u ON u.id = us.user_id
    WHERE 
      us.total_predictions > 0
      AND us.monthly_points > 0
    ORDER BY 
      us.monthly_points DESC,
      us.accuracy_percentage DESC
    LIMIT p_limit
    OFFSET p_offset;
    
  ELSE
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.accuracy_percentage DESC) as rank,
      u.id as user_id,
      u.username::TEXT,
      u.email::TEXT,
      u.avatar_url,
      us.total_points,
      us.weekly_points,
      us.monthly_points,
      us.accuracy_percentage,
      us.current_streak,
      us.best_streak,
      us.total_predictions,
      us.correct_predictions,
      us.badges,
      us.updated_at::TIMESTAMPTZ
    FROM 
      user_stats us
      INNER JOIN users u ON u.id = us.user_id
    WHERE 
      us.total_predictions > 0
    ORDER BY 
      us.total_points DESC,
      us.accuracy_percentage DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER, INTEGER, VARCHAR) TO authenticated, anon;

SELECT 'Leaderboard function types fixed!' AS status;
