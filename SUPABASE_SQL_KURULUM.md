# 🗄️ SUPABASE SQL KURULUM REHBERİ

**Adım adım Supabase SQL çalıştırma**

---

## 📋 ADIM 1: SUPABASE DASHBOARD'A GİT

1. Tarayıcıda aç: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ı tıklayın
4. **New Query** butonuna tıklayın

---

## 📋 ADIM 2: SCHEMA OLUŞTUR

### SQL 1: Predictions Schema

Aşağıdaki dosyanın içeriğini kopyalayın ve SQL Editor'a yapıştırın:

**Dosya:** `supabase/001_predictions_schema.sql`

Veya direkt bu SQL'i çalıştırın:

```sql
-- PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  home_score INTEGER CHECK (home_score >= 0 AND home_score <= 20),
  away_score INTEGER CHECK (away_score >= 0 AND away_score <= 20),
  first_goal VARCHAR(10) CHECK (first_goal IN ('home', 'away', 'none')),
  total_goals VARCHAR(10) CHECK (total_goals IN ('0-1', '2-3', '4+')),
  yellow_cards INTEGER CHECK (yellow_cards >= 0 AND yellow_cards <= 20),
  red_cards INTEGER CHECK (red_cards >= 0 AND red_cards <= 5),
  corners INTEGER CHECK (corners >= 0 AND corners <= 30),
  focused_predictions JSONB DEFAULT '[]',
  training_type VARCHAR(20) CHECK (training_type IN ('attack', 'defense', 'balanced')),
  training_multiplier DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- MATCH_RESULTS TABLE
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

-- PREDICTION_SCORES TABLE
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

-- USER_STATS UPDATES
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

-- LEADERBOARD VIEW
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

-- RLS POLICIES
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
  ON predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scores"
  ON prediction_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view leaderboard"
  ON user_stats FOR SELECT
  USING (true);

-- TRIGGERS
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

SELECT 'Predictions schema created successfully!' AS status;
```

**Çalıştır:** `RUN` butonuna bas veya `Ctrl+Enter`

**Beklenen Çıktı:**
```
✅ Predictions schema created successfully!
```

---

## 📋 ADIM 3: HELPER FUNCTIONS OLUŞTUR

### SQL 2: Helper Functions

Yeni bir query açın ve şunu çalıştırın:

**Dosya:** `supabase/002_helper_functions.sql`

```sql
-- INCREMENT USER PREDICTIONS
CREATE OR REPLACE FUNCTION increment_user_predictions(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats
  SET 
    total_predictions = total_predictions + 1,
    last_prediction_at = NOW()
  WHERE user_stats.user_id = increment_user_predictions.user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_predictions, last_prediction_at)
    VALUES (increment_user_predictions.user_id, 1, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DECREMENT USER PREDICTIONS
CREATE OR REPLACE FUNCTION decrement_user_predictions(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats
  SET total_predictions = GREATEST(0, total_predictions - 1)
  WHERE user_stats.user_id = decrement_user_predictions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- UPDATE USER SCORE
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

-- RESET WEEKLY POINTS
CREATE OR REPLACE FUNCTION reset_weekly_points()
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats SET weekly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RESET MONTHLY POINTS
CREATE OR REPLACE FUNCTION reset_monthly_points()
RETURNS VOID AS $$
BEGIN
  UPDATE user_stats SET monthly_points = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET USER RANK
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

-- GET LEADERBOARD
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

SELECT 'Helper functions created successfully!' AS status;
```

**Çalıştır:** `RUN` butonuna bas

**Beklenen Çıktı:**
```
✅ Helper functions created successfully!
```

---

## ✅ DOĞRULAMA

SQL Editor'da şunu çalıştır:

```sql
-- Tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('predictions', 'match_results', 'prediction_scores');

-- Functions kontrol et
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%prediction%' OR routine_name LIKE '%score%';
```

**Beklenen Çıktı:**
```
predictions
match_results
prediction_scores

increment_user_predictions
decrement_user_predictions
update_user_score
get_user_rank
get_leaderboard
```

---

## 🎉 TAMAMLANDI!

Database hazır! Şimdi backend'i başlatalım.

**Sonraki Adım:** Backend'i test et
