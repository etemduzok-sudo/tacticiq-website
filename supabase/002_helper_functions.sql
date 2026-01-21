-- ============================================
-- TACTICIQ - HELPER FUNCTIONS
-- ============================================
-- Supabase RPC functions for predictions
-- ============================================

-- 1. INCREMENT USER PREDICTIONS COUNT
CREATE OR REPLACE FUNCTION increment_user_predictions(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats
  SET 
    total_predictions = total_predictions + 1,
    last_prediction_at = NOW()
  WHERE user_stats.user_id = increment_user_predictions.user_id;
  
  -- Create user_stats if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_predictions, last_prediction_at)
    VALUES (increment_user_predictions.user_id, 1, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 2. DECREMENT USER PREDICTIONS COUNT
CREATE OR REPLACE FUNCTION decrement_user_predictions(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats
  SET total_predictions = GREATEST(0, total_predictions - 1)
  WHERE user_stats.user_id = decrement_user_predictions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 3. UPDATE USER SCORE
CREATE OR REPLACE FUNCTION update_user_score(
  p_user_id UUID,
  p_score INTEGER,
  p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats
  SET 
    total_points = total_points + p_score,
    weekly_points = weekly_points + p_score,
    monthly_points = monthly_points + p_score,
    correct_predictions = CASE WHEN p_is_correct THEN correct_predictions + 1 ELSE correct_predictions END,
    accuracy_percentage = CASE 
      WHEN total_predictions > 0 
      THEN (correct_predictions::DECIMAL / total_predictions::DECIMAL) * 100 
      ELSE 0 
    END,
    current_streak = CASE WHEN p_is_correct THEN current_streak + 1 ELSE 0 END,
    best_streak = CASE 
      WHEN p_is_correct AND (current_streak + 1) > best_streak 
      THEN current_streak + 1 
      ELSE best_streak 
    END,
    last_score_update_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 4. RESET WEEKLY POINTS (for cron job)
CREATE OR REPLACE FUNCTION reset_weekly_points()
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats SET weekly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 5. RESET MONTHLY POINTS (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 6. GET USER RANK
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS TABLE (
  overall_rank INTEGER,
  weekly_rank INTEGER,
  monthly_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) + 1 FROM user_stats WHERE total_points > (SELECT total_points FROM user_stats WHERE user_id = p_user_id))::INTEGER as overall_rank,
    (SELECT COUNT(*) + 1 FROM user_stats WHERE weekly_points > (SELECT weekly_points FROM user_stats WHERE user_id = p_user_id))::INTEGER as weekly_rank,
    (SELECT COUNT(*) + 1 FROM user_stats WHERE monthly_points > (SELECT monthly_points FROM user_stats WHERE user_id = p_user_id))::INTEGER as monthly_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

-- 7. GET LEADERBOARD (with pagination)
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_period VARCHAR DEFAULT 'overall' -- 'overall', 'weekly', 'monthly'
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
    u.avatar,
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

-- ============================================

SELECT 'Helper functions created successfully!' AS status;
