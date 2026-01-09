-- LEADERBOARD COMPLETE - COPY PASTE THIS ENTIRE FILE

DROP VIEW IF EXISTS leaderboard CASCADE;
DROP FUNCTION IF EXISTS get_leaderboard(INTEGER, INTEGER, VARCHAR) CASCADE;

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.accuracy_percentage DESC) as rank,
  u.id as user_id,
  u.username,
  u.email,
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
  us.updated_at
FROM 
  user_stats us
  INNER JOIN users u ON u.id = us.user_id
WHERE 
  us.total_predictions > 0
ORDER BY 
  us.total_points DESC,
  us.accuracy_percentage DESC;

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_period VARCHAR DEFAULT 'overall'
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username VARCHAR,
  email VARCHAR,
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
      u.username,
      u.email,
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
      us.updated_at
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
      u.username,
      u.email,
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
      us.updated_at
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
      u.username,
      u.email,
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
      us.updated_at
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
      u.username,
      u.email,
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
      us.updated_at
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

CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID, p_period VARCHAR DEFAULT 'overall')
RETURNS TABLE (
  rank BIGINT,
  total_users BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_period = 'overall' THEN
    RETURN QUERY
    WITH ranked_users AS (
      SELECT 
        user_id,
        ROW_NUMBER() OVER (ORDER BY total_points DESC, accuracy_percentage DESC) as user_rank
      FROM user_stats
      WHERE total_predictions > 0
    )
    SELECT 
      ru.user_rank,
      (SELECT COUNT(*) FROM user_stats WHERE total_predictions > 0) as total_users
    FROM ranked_users ru
    WHERE ru.user_id = p_user_id;
    
  ELSIF p_period = 'weekly' THEN
    RETURN QUERY
    WITH ranked_users AS (
      SELECT 
        user_id,
        ROW_NUMBER() OVER (ORDER BY weekly_points DESC, accuracy_percentage DESC) as user_rank
      FROM user_stats
      WHERE total_predictions > 0 AND weekly_points > 0
    )
    SELECT 
      ru.user_rank,
      (SELECT COUNT(*) FROM user_stats WHERE total_predictions > 0 AND weekly_points > 0) as total_users
    FROM ranked_users ru
    WHERE ru.user_id = p_user_id;
    
  ELSIF p_period = 'monthly' THEN
    RETURN QUERY
    WITH ranked_users AS (
      SELECT 
        user_id,
        ROW_NUMBER() OVER (ORDER BY monthly_points DESC, accuracy_percentage DESC) as user_rank
      FROM user_stats
      WHERE total_predictions > 0 AND monthly_points > 0
    )
    SELECT 
      ru.user_rank,
      (SELECT COUNT(*) FROM user_stats WHERE total_predictions > 0 AND monthly_points > 0) as total_users
    FROM ranked_users ru
    WHERE ru.user_id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER, INTEGER, VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_rank(UUID, VARCHAR) TO authenticated, anon;
GRANT SELECT ON leaderboard TO authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_weekly_points ON user_stats(weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_monthly_points ON user_stats(monthly_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_accuracy ON user_stats(accuracy_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

SELECT 'Leaderboard system created successfully!' AS status;
