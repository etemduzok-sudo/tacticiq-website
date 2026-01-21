-- ============================================
-- TACTICIQ - PREDICTIONS SCHEMA (CLEAN)
-- ============================================
-- Policy hatalarını atlayan temiz versiyon
-- ============================================

-- 1. PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  
  -- Temel tahminler
  home_score INTEGER CHECK (home_score >= 0 AND home_score <= 20),
  away_score INTEGER CHECK (away_score >= 0 AND away_score <= 20),
  
  -- Detaylı tahminler
  first_goal VARCHAR(10) CHECK (first_goal IN ('home', 'away', 'none')),
  total_goals VARCHAR(10) CHECK (total_goals IN ('0-1', '2-3', '4+')),
  yellow_cards INTEGER CHECK (yellow_cards >= 0 AND yellow_cards <= 20),
  red_cards INTEGER CHECK (red_cards >= 0 AND red_cards <= 5),
  corners INTEGER CHECK (corners >= 0 AND corners <= 30),
  
  -- Strategic Focus System
  focused_predictions JSONB DEFAULT '[]',
  training_type VARCHAR(20) CHECK (training_type IN ('attack', 'defense', 'balanced')),
  training_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- ============================================

-- 2. MATCH_RESULTS TABLE
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER UNIQUE NOT NULL,
  
  home_score INTEGER,
  away_score INTEGER,
  first_goal VARCHAR(10),
  total_goals VARCHAR(10),
  yellow_cards INTEGER,
  red_cards INTEGER,
  corners INTEGER,
  events JSONB DEFAULT '[]',
  
  finalized_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_finalized_at ON match_results(finalized_at DESC);

-- ============================================

-- 3. PREDICTION_SCORES TABLE
CREATE TABLE IF NOT EXISTS prediction_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  
  total_score INTEGER DEFAULT 0,
  tempo_score INTEGER DEFAULT 0,
  disiplin_score INTEGER DEFAULT 0,
  fiziksel_score INTEGER DEFAULT 0,
  bireysel_score INTEGER DEFAULT 0,
  focus_bonus INTEGER DEFAULT 0,
  training_multiplier_bonus INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(prediction_id)
);

CREATE INDEX IF NOT EXISTS idx_prediction_scores_user_id ON prediction_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_scores_match_id ON prediction_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_scores_total_score ON prediction_scores(total_score DESC);

-- ============================================

-- 4. USER_STATS TABLE UPDATES
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS correct_predictions INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS accuracy_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_prediction_at TIMESTAMP;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS last_score_update_at TIMESTAMP;

-- ============================================

-- 5. LEADERBOARD VIEW
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.avatar_url as avatar,
  u.is_premium as is_pro,
  us.total_points,
  us.accuracy_percentage,
  us.current_streak,
  us.best_streak,
  us.total_predictions,
  us.correct_predictions,
  us.badges,
  RANK() OVER (ORDER BY us.total_points DESC, us.accuracy_percentage DESC) as rank,
  RANK() OVER (ORDER BY us.weekly_points DESC) as weekly_rank,
  RANK() OVER (ORDER BY us.monthly_points DESC) as monthly_rank
FROM users u
JOIN user_stats us ON u.id = us.user_id
WHERE us.total_predictions > 0
ORDER BY us.total_points DESC;

-- ============================================

-- 6. RLS POLICIES (sadece yoksa oluştur)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own predictions" ON predictions;
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own scores" ON prediction_scores;
CREATE POLICY "Users can view own scores"
  ON prediction_scores FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================

-- 7. TRIGGERS
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_predictions_updated_at ON predictions;
CREATE TRIGGER trigger_update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

-- ============================================

-- 8. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION calculate_total_goals_category(home_score INTEGER, away_score INTEGER)
RETURNS VARCHAR(10) AS $$
DECLARE
  total INTEGER;
BEGIN
  total := home_score + away_score;
  IF total <= 1 THEN
    RETURN '0-1';
  ELSIF total <= 3 THEN
    RETURN '2-3';
  ELSE
    RETURN '4+';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================

SELECT 'Predictions schema created successfully!' AS status;
