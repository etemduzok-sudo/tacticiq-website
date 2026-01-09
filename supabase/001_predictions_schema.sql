-- ============================================
-- FAN MANAGER 2026 - PREDICTIONS SCHEMA
-- ============================================
-- Tahmin sistemi için gerekli tablolar
-- Çalıştırma: Supabase SQL Editor'da çalıştır
-- ============================================

-- 1. PREDICTIONS TABLE
-- Kullanıcıların maç tahminleri
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
  focused_predictions JSONB DEFAULT '[]', -- Max 3 predictions
  training_type VARCHAR(20) CHECK (training_type IN ('attack', 'defense', 'balanced')),
  training_multiplier DECIMAL(3,2) DEFAULT 1.00,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, match_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- ============================================

-- 2. MATCH_RESULTS TABLE
-- Maç sonuçları ve gerçek veriler
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER UNIQUE NOT NULL,
  
  -- Gerçek sonuçlar
  home_score INTEGER,
  away_score INTEGER,
  
  -- Detaylı sonuçlar
  first_goal VARCHAR(10), -- 'home', 'away', 'none'
  total_goals VARCHAR(10), -- '0-1', '2-3', '4+'
  yellow_cards INTEGER,
  red_cards INTEGER,
  corners INTEGER,
  
  -- Maç olayları (goller, kartlar, değişiklikler)
  events JSONB DEFAULT '[]',
  
  -- Metadata
  finalized_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_finalized_at ON match_results(finalized_at DESC);

-- ============================================

-- 3. PREDICTION_SCORES TABLE
-- Tahmin puanları ve detaylı breakdown
CREATE TABLE IF NOT EXISTS prediction_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  
  -- Toplam puan
  total_score INTEGER DEFAULT 0,
  
  -- Strategic Focus System breakdown
  tempo_score INTEGER DEFAULT 0,
  disiplin_score INTEGER DEFAULT 0,
  fiziksel_score INTEGER DEFAULT 0,
  bireysel_score INTEGER DEFAULT 0,
  
  -- Bonuslar
  focus_bonus INTEGER DEFAULT 0,
  training_multiplier_bonus INTEGER DEFAULT 0,
  
  -- Doğruluk
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(prediction_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_prediction_scores_user_id ON prediction_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_scores_match_id ON prediction_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_scores_total_score ON prediction_scores(total_score DESC);

-- ============================================

-- 4. USER_STATS TABLE UPDATES
-- Kullanıcı istatistiklerini genişlet
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  total_predictions INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  correct_predictions INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  accuracy_percentage DECIMAL(5,2) DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  current_streak INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  best_streak INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  total_points INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  weekly_points INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  monthly_points INTEGER DEFAULT 0;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  last_prediction_at TIMESTAMP;

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  last_score_update_at TIMESTAMP;

-- ============================================

-- 5. LEADERBOARD VIEW
-- Sıralama için optimize edilmiş view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.avatar,
  u.is_pro,
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

-- 6. RLS POLICIES FOR PREDICTIONS
-- Row Level Security politikaları

-- Enable RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own predictions
CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own predictions
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own predictions (before match starts)
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own scores
CREATE POLICY "Users can view own scores"
  ON prediction_scores FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view leaderboard (via view)
CREATE POLICY "Public can view leaderboard"
  ON user_stats FOR SELECT
  USING (true);

-- ============================================

-- 7. TRIGGERS FOR AUTO-UPDATE

-- Update predictions.updated_at on change
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

-- ============================================

-- 8. HELPER FUNCTIONS

-- Function to calculate total goals category
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

-- Function to check if prediction can be updated
CREATE OR REPLACE FUNCTION can_update_prediction(p_match_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  match_date TIMESTAMP;
BEGIN
  SELECT date INTO match_date FROM matches WHERE id = p_match_id;
  RETURN match_date > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- 9. SAMPLE DATA (for testing)

-- Insert sample match result
INSERT INTO match_results (match_id, home_score, away_score, first_goal, total_goals, yellow_cards, red_cards, corners)
VALUES (1234567, 2, 1, 'home', '2-3', 4, 0, 8)
ON CONFLICT (match_id) DO NOTHING;

-- ============================================

COMMENT ON TABLE predictions IS 'Kullanıcıların maç tahminleri';
COMMENT ON TABLE match_results IS 'Maç sonuçları ve gerçek veriler';
COMMENT ON TABLE prediction_scores IS 'Tahmin puanları ve detaylı breakdown';
COMMENT ON VIEW leaderboard IS 'Sıralama tablosu (optimize edilmiş view)';

-- ============================================
-- SCHEMA CREATION COMPLETE
-- ============================================

SELECT 'Predictions schema created successfully!' AS status;
