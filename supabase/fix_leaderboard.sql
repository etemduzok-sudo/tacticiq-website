-- Fix leaderboard function (avatar -> avatar_url)
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_period VARCHAR DEFAULT 'overall'
)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  avatar VARCHAR,
  total_points INTEGER,
  weekly_points INTEGER,
  monthly_points INTEGER,
  accuracy_percentage DECIMAL,
  current_streak INTEGER,
  badges JSONB,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar_url as avatar,
    us.total_points,
    us.weekly_points,
    us.monthly_points,
    us.accuracy_percentage,
    us.current_streak,
    us.badges,
    CASE 
      WHEN p_period = 'weekly' THEN RANK() OVER (ORDER BY us.weekly_points DESC)
      WHEN p_period = 'monthly' THEN RANK() OVER (ORDER BY us.monthly_points DESC)
      ELSE RANK() OVER (ORDER BY us.total_points DESC)
    END as rank
  FROM users u
  JOIN user_stats us ON u.id = us.user_id
  WHERE us.total_predictions > 0
  ORDER BY 
    CASE 
      WHEN p_period = 'weekly' THEN us.weekly_points
      WHEN p_period = 'monthly' THEN us.monthly_points
      ELSE us.total_points
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Leaderboard function fixed!' AS status;
