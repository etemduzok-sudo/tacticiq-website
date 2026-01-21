-- ============================================
-- TACTICIQ - ENHANCED MATCH TRACKING SYSTEM
-- ============================================
-- Canlı maç akışı, özetler ve sıralama geçmişi
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. MATCH_TIMELINE TABLE
-- ============================================
-- Maç dakika dakika akışı (canlı feed geçmişi)
-- Her olay ayrı satır olarak kaydedilir
-- ============================================

CREATE TABLE IF NOT EXISTS match_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER NOT NULL,
  
  -- Zaman bilgisi
  elapsed INTEGER NOT NULL, -- Dakika (0-90+)
  elapsed_extra INTEGER DEFAULT 0, -- Uzatma dakikası (90+3 için 3)
  
  -- Olay bilgisi
  event_type VARCHAR(50) NOT NULL, -- goal, card, substitution, var, kickoff, halftime, fulltime, etc.
  event_detail VARCHAR(100), -- Normal Goal, Penalty, Own Goal, Yellow Card, Red Card, Second Yellow, etc.
  
  -- Takım ve oyuncu
  team_id INTEGER,
  team_name VARCHAR(255),
  player_id INTEGER,
  player_name VARCHAR(255),
  assist_id INTEGER,
  assist_name VARCHAR(255),
  
  -- O anki skor
  score_home INTEGER DEFAULT 0,
  score_away INTEGER DEFAULT 0,
  
  -- Ek bilgiler
  comments TEXT,
  var_decision VARCHAR(100), -- Goal Confirmed, Goal Cancelled, Penalty Confirmed, etc.
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint (aynı dakikada aynı olay tekrar eklenmesin)
  CONSTRAINT unique_timeline_event UNIQUE (match_id, elapsed, elapsed_extra, event_type, player_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timeline_match_id ON match_timeline(match_id);
CREATE INDEX IF NOT EXISTS idx_timeline_elapsed ON match_timeline(elapsed);
CREATE INDEX IF NOT EXISTS idx_timeline_event_type ON match_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON match_timeline(created_at DESC);

-- ============================================
-- 2. MATCH_SUMMARIES TABLE
-- ============================================
-- Biten maçların AI-generated özetleri
-- ============================================

CREATE TABLE IF NOT EXISTS match_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER UNIQUE NOT NULL,
  
  -- Temel bilgiler
  home_team_name VARCHAR(255),
  away_team_name VARCHAR(255),
  final_score_home INTEGER,
  final_score_away INTEGER,
  
  -- Özetler
  summary_tr TEXT, -- Türkçe özet
  summary_en TEXT, -- İngilizce özet
  
  -- Önemli anlar
  key_moments JSONB DEFAULT '[]', -- [{elapsed: 23, type: 'goal', description: 'Icardi opened the score'}]
  
  -- Maçın yıldızı
  man_of_match_id INTEGER,
  man_of_match_name VARCHAR(255),
  man_of_match_rating DECIMAL(3,1),
  
  -- İstatistik özeti
  stats_summary JSONB DEFAULT '{}', -- {possession: [55, 45], shots: [12, 8], etc.}
  
  -- TacticIQ analizi
  our_analysis TEXT, -- Bizim oluşturduğumuz taktiksel analiz
  prediction_accuracy DECIMAL(5,2), -- Tahmin doğruluk oranı
  
  -- Metadata
  match_date TIMESTAMPTZ,
  league_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_summaries_match_id ON match_summaries(match_id);
CREATE INDEX IF NOT EXISTS idx_summaries_match_date ON match_summaries(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON match_summaries(created_at DESC);

-- ============================================
-- 3. LEADERBOARD_SNAPSHOTS TABLE
-- ============================================
-- Sıralama geçmişi (günlük, haftalık, aylık)
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Zaman bilgisi
  snapshot_date DATE NOT NULL,
  period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, season
  
  -- Hafta/Ay numarası (opsiyonel)
  week_number INTEGER,
  month_number INTEGER,
  year INTEGER,
  
  -- Sıralama verileri (top 100)
  rankings JSONB NOT NULL, -- [{rank: 1, user_id: 'xxx', username: 'user1', total_points: 1500, ...}]
  
  -- İstatistikler
  total_users INTEGER,
  total_predictions INTEGER,
  average_accuracy DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_snapshot UNIQUE (snapshot_date, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_period ON leaderboard_snapshots(period);
CREATE INDEX IF NOT EXISTS idx_snapshots_year_week ON leaderboard_snapshots(year, week_number);

-- ============================================
-- 4. MATCH_LIVE_STATUS TABLE (Opsiyonel)
-- ============================================
-- Canlı maç durumu geçmişi (12 saniyede bir)
-- Sadece canlı maçlar için, maç bitince silinir
-- ============================================

CREATE TABLE IF NOT EXISTS match_live_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id INTEGER NOT NULL,
  
  -- Anlık durum
  status VARCHAR(20) NOT NULL, -- NS, 1H, HT, 2H, ET, P, FT, etc.
  elapsed INTEGER,
  score_home INTEGER DEFAULT 0,
  score_away INTEGER DEFAULT 0,
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_status_match_id ON match_live_status(match_id);
CREATE INDEX IF NOT EXISTS idx_live_status_recorded_at ON match_live_status(recorded_at DESC);

-- Otomatik temizlik için: 24 saatten eski kayıtları sil
-- Bu fonksiyon cron job ile çağrılabilir
CREATE OR REPLACE FUNCTION cleanup_old_live_status()
RETURNS void AS $$
BEGIN
  DELETE FROM match_live_status 
  WHERE recorded_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. API_USAGE_LOG TABLE
-- ============================================
-- API kullanım takibi
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tarih bilgisi
  log_date DATE NOT NULL,
  
  -- Kullanım verileri
  total_calls INTEGER DEFAULT 0,
  live_match_calls INTEGER DEFAULT 0,
  fixture_calls INTEGER DEFAULT 0,
  team_calls INTEGER DEFAULT 0,
  other_calls INTEGER DEFAULT 0,
  
  -- Limit bilgisi
  daily_limit INTEGER DEFAULT 7500,
  remaining_calls INTEGER DEFAULT 7500,
  usage_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_api_log_date UNIQUE (log_date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage_log(log_date DESC);

-- ============================================
-- 6. STATIC_TEAMS_SYNC_LOG TABLE
-- ============================================
-- Günde 2 kez takım güncelleme logu
-- ============================================

CREATE TABLE IF NOT EXISTS static_teams_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync bilgisi
  sync_date DATE NOT NULL,
  sync_time TIME NOT NULL,
  sync_type VARCHAR(20) NOT NULL, -- morning, evening, manual
  
  -- Sonuçlar
  teams_synced INTEGER DEFAULT 0,
  teams_added INTEGER DEFAULT 0,
  teams_updated INTEGER DEFAULT 0,
  api_calls_used INTEGER DEFAULT 0,
  
  -- Durum
  status VARCHAR(20) NOT NULL, -- success, partial, failed
  error_message TEXT,
  duration_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_teams_sync_date ON static_teams_sync_log(sync_date DESC);

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE match_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_live_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE static_teams_sync_log ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view match timeline"
  ON match_timeline FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view match summaries"
  ON match_summaries FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view leaderboard snapshots"
  ON leaderboard_snapshots FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can view live status"
  ON match_live_status FOR SELECT
  TO authenticated, anon
  USING (true);

-- Service role write access
CREATE POLICY "Service role can manage timeline"
  ON match_timeline FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage summaries"
  ON match_summaries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage snapshots"
  ON leaderboard_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage live status"
  ON match_live_status FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage api usage"
  ON api_usage_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage sync log"
  ON static_teams_sync_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Maç timeline'ına event ekle
CREATE OR REPLACE FUNCTION add_timeline_event(
  p_match_id INTEGER,
  p_elapsed INTEGER,
  p_event_type VARCHAR,
  p_team_id INTEGER DEFAULT NULL,
  p_team_name VARCHAR DEFAULT NULL,
  p_player_name VARCHAR DEFAULT NULL,
  p_event_detail VARCHAR DEFAULT NULL,
  p_score_home INTEGER DEFAULT 0,
  p_score_away INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO match_timeline (
    match_id, elapsed, event_type, team_id, team_name, 
    player_name, event_detail, score_home, score_away
  ) VALUES (
    p_match_id, p_elapsed, p_event_type, p_team_id, p_team_name,
    p_player_name, p_event_detail, p_score_home, p_score_away
  )
  ON CONFLICT (match_id, elapsed, elapsed_extra, event_type, player_id) 
  DO NOTHING
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Maç özeti oluştur/güncelle
CREATE OR REPLACE FUNCTION upsert_match_summary(
  p_match_id INTEGER,
  p_home_team VARCHAR,
  p_away_team VARCHAR,
  p_score_home INTEGER,
  p_score_away INTEGER,
  p_summary_tr TEXT DEFAULT NULL,
  p_key_moments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO match_summaries (
    match_id, home_team_name, away_team_name, 
    final_score_home, final_score_away,
    summary_tr, key_moments, match_date
  ) VALUES (
    p_match_id, p_home_team, p_away_team,
    p_score_home, p_score_away,
    p_summary_tr, p_key_moments, NOW()
  )
  ON CONFLICT (match_id) 
  DO UPDATE SET
    final_score_home = EXCLUDED.final_score_home,
    final_score_away = EXCLUDED.final_score_away,
    summary_tr = COALESCE(EXCLUDED.summary_tr, match_summaries.summary_tr),
    key_moments = EXCLUDED.key_moments,
    updated_at = NOW()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Leaderboard snapshot al
CREATE OR REPLACE FUNCTION take_leaderboard_snapshot(
  p_period VARCHAR DEFAULT 'daily'
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
  rankings_data JSONB;
  total_user_count INTEGER;
  total_pred_count INTEGER;
  avg_acc DECIMAL(5,2);
BEGIN
  -- Top 100 kullanıcıyı al
  SELECT jsonb_agg(row_to_json(t))
  INTO rankings_data
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY us.total_points DESC) as rank,
      u.id as user_id,
      u.username,
      us.total_points,
      us.weekly_points,
      us.monthly_points,
      us.accuracy_percentage,
      us.current_streak,
      us.total_predictions
    FROM user_stats us
    JOIN users u ON u.id = us.user_id
    WHERE us.total_predictions > 0
    ORDER BY us.total_points DESC
    LIMIT 100
  ) t;
  
  -- İstatistikleri hesapla
  SELECT 
    COUNT(*),
    SUM(total_predictions),
    AVG(accuracy_percentage)
  INTO total_user_count, total_pred_count, avg_acc
  FROM user_stats
  WHERE total_predictions > 0;
  
  -- Snapshot kaydet
  INSERT INTO leaderboard_snapshots (
    snapshot_date, period, week_number, month_number, year,
    rankings, total_users, total_predictions, average_accuracy
  ) VALUES (
    CURRENT_DATE,
    p_period,
    EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    COALESCE(rankings_data, '[]'),
    total_user_count,
    total_pred_count,
    COALESCE(avg_acc, 0)
  )
  ON CONFLICT (snapshot_date, period) 
  DO UPDATE SET
    rankings = EXCLUDED.rankings,
    total_users = EXCLUDED.total_users,
    total_predictions = EXCLUDED.total_predictions,
    average_accuracy = EXCLUDED.average_accuracy
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- Eski verileri temizle
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- 24 saatten eski canlı durum kayıtlarını sil
  DELETE FROM match_live_status 
  WHERE recorded_at < NOW() - INTERVAL '24 hours';
  
  -- 90 günden eski timeline kayıtlarını sil (isteğe bağlı)
  -- DELETE FROM match_timeline 
  -- WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- 1 yıldan eski leaderboard snapshot'larını sil (günlük olanları)
  DELETE FROM leaderboard_snapshots 
  WHERE period = 'daily' 
  AND snapshot_date < CURRENT_DATE - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_summary_updated_at
  BEFORE UPDATE ON match_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_summary_updated_at();

-- ============================================
-- 10. GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION add_timeline_event TO service_role;
GRANT EXECUTE ON FUNCTION upsert_match_summary TO service_role;
GRANT EXECUTE ON FUNCTION take_leaderboard_snapshot TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_data TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_live_status TO service_role;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

SELECT 'Enhanced match tracking schema created successfully!' AS status;
