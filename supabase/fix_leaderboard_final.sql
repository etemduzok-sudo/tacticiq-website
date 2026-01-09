-- Final fix for leaderboard function
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
    COALESCE(us.total_points, 0) as total_points,
    COALESCE(us.weekly_points, 0) as weekly_points,
    COALESCE(us.monthly_points, 0) as monthly_points,
    COALESCE(us.accuracy_percentage, 0) as accuracy_percentage,
    COALESCE(us.current_streak, 0) as current_streak,
    COALESCE(us.badges, '[]'::jsonb) as badges,
    CASE 
      WHEN p_period = 'weekly' THEN RANK() OVER (ORDER BY COALESCE(us.weekly_points, 0) DESC)
      WHEN p_period = 'monthly' THEN RANK() OVER (ORDER BY COALESCE(us.monthly_points, 0) DESC)
      ELSE RANK() OVER (ORDER BY COALESCE(us.total_points, 0) DESC)
    END as rank
  FROM users u
  LEFT JOIN user_stats us ON u.id = us.user_id
  WHERE us.total_predictions > 0
  ORDER BY 
    CASE 
      WHEN p_period = 'weekly' THEN COALESCE(us.weekly_points, 0)
      WHEN p_period = 'monthly' THEN COALESCE(us.monthly_points, 0)
      ELSE COALESCE(us.total_points, 0)
    END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Leaderboard function updated!' AS status;
