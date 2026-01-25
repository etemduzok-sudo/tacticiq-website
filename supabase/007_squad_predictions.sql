-- ============================================
-- TACTICIQ - SQUAD PREDICTIONS SCHEMA
-- ============================================
-- Kadro tahminleri ve istatistik toplama
-- ============================================

-- 1. SQUAD_PREDICTIONS TABLE - Kullanıcıların kadro tahminleri
CREATE TABLE IF NOT EXISTS squad_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  
  -- Atak Formasyonu
  attack_formation VARCHAR(20) NOT NULL,
  attack_players JSONB NOT NULL DEFAULT '{}',
  -- Format: { "0": { "playerId": 123, "playerName": "...", "position": "GK" }, ... }
  
  -- Defans Formasyonu
  defense_formation VARCHAR(20) NOT NULL,
  defense_players JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  analysis_focus VARCHAR(20) CHECK (analysis_focus IN ('attack', 'defense', 'midfield', 'physical', 'balanced')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_predictions_user_id ON squad_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_predictions_match_id ON squad_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_squad_predictions_attack_formation ON squad_predictions(attack_formation);
CREATE INDEX IF NOT EXISTS idx_squad_predictions_defense_formation ON squad_predictions(defense_formation);
CREATE INDEX IF NOT EXISTS idx_squad_predictions_created_at ON squad_predictions(created_at DESC);

-- ============================================

-- 2. FORMATION_STATISTICS - Formasyon popülerlik istatistikleri
CREATE TABLE IF NOT EXISTS formation_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER NOT NULL,
  formation_id VARCHAR(20) NOT NULL,
  formation_type VARCHAR(10) NOT NULL CHECK (formation_type IN ('attack', 'defense')),
  
  -- İstatistikler
  usage_count INTEGER DEFAULT 1,
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(match_id, formation_id, formation_type)
);

CREATE INDEX IF NOT EXISTS idx_formation_stats_match_id ON formation_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_formation_stats_formation_id ON formation_statistics(formation_id);

-- ============================================

-- 3. PLAYER_POSITION_STATISTICS - Oyuncu-Pozisyon eşleştirme istatistikleri
CREATE TABLE IF NOT EXISTS player_position_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  player_name VARCHAR(255),
  formation_id VARCHAR(20) NOT NULL,
  position_index INTEGER NOT NULL, -- 0-10 arası pozisyon indexi
  position_label VARCHAR(10) NOT NULL, -- GK, CB, CM, ST, etc.
  formation_type VARCHAR(10) NOT NULL CHECK (formation_type IN ('attack', 'defense')),
  
  -- İstatistikler
  assignment_count INTEGER DEFAULT 1,
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(match_id, player_id, formation_id, position_index, formation_type)
);

CREATE INDEX IF NOT EXISTS idx_player_pos_stats_match_id ON player_position_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_player_pos_stats_player_id ON player_position_statistics(player_id);
CREATE INDEX IF NOT EXISTS idx_player_pos_stats_formation_id ON player_position_statistics(formation_id);

-- ============================================

-- 4. MATCH_SQUAD_SUMMARY - Maç bazında özet istatistikler
CREATE TABLE IF NOT EXISTS match_squad_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER UNIQUE NOT NULL,
  
  -- Genel istatistikler
  total_predictions INTEGER DEFAULT 0,
  
  -- En popüler formasyonlar
  top_attack_formation VARCHAR(20),
  top_attack_formation_count INTEGER DEFAULT 0,
  top_attack_formation_percentage DECIMAL(5,2) DEFAULT 0,
  
  top_defense_formation VARCHAR(20),
  top_defense_formation_count INTEGER DEFAULT 0,
  top_defense_formation_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- En popüler oyuncu-pozisyon eşleştirmeleri (JSONB)
  popular_attack_assignments JSONB DEFAULT '[]',
  popular_defense_assignments JSONB DEFAULT '[]',
  -- Format: [{ "positionIndex": 0, "positionLabel": "GK", "playerId": 123, "playerName": "...", "percentage": 85.5 }, ...]
  
  -- Metadata
  last_calculated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_squad_summary_match_id ON match_squad_summary(match_id);

-- ============================================

-- 5. RLS POLICIES
ALTER TABLE squad_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_position_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_squad_summary ENABLE ROW LEVEL SECURITY;

-- Squad predictions - kendi tahminlerini görebilir/düzenleyebilir
DROP POLICY IF EXISTS "Users can view own squad predictions" ON squad_predictions;
CREATE POLICY "Users can view own squad predictions"
  ON squad_predictions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own squad predictions" ON squad_predictions;
CREATE POLICY "Users can insert own squad predictions"
  ON squad_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own squad predictions" ON squad_predictions;
CREATE POLICY "Users can update own squad predictions"
  ON squad_predictions FOR UPDATE
  USING (auth.uid() = user_id);

-- Statistics - herkes okuyabilir (anonim istatistik)
DROP POLICY IF EXISTS "Anyone can view formation statistics" ON formation_statistics;
CREATE POLICY "Anyone can view formation statistics"
  ON formation_statistics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view player position statistics" ON player_position_statistics;
CREATE POLICY "Anyone can view player position statistics"
  ON player_position_statistics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view match squad summary" ON match_squad_summary;
CREATE POLICY "Anyone can view match squad summary"
  ON match_squad_summary FOR SELECT
  USING (true);

-- ============================================

-- 6. TRIGGERS - updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_squad_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_squad_predictions_updated_at ON squad_predictions;
CREATE TRIGGER trigger_update_squad_predictions_updated_at
  BEFORE UPDATE ON squad_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_squad_predictions_updated_at();

-- ============================================

-- 7. FUNCTION: Update statistics after squad prediction
CREATE OR REPLACE FUNCTION update_squad_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Attack formation statistics
  INSERT INTO formation_statistics (match_id, formation_id, formation_type, usage_count)
  VALUES (NEW.match_id, NEW.attack_formation, 'attack', 1)
  ON CONFLICT (match_id, formation_id, formation_type) 
  DO UPDATE SET 
    usage_count = formation_statistics.usage_count + 1,
    last_updated = NOW();
  
  -- Defense formation statistics
  INSERT INTO formation_statistics (match_id, formation_id, formation_type, usage_count)
  VALUES (NEW.match_id, NEW.defense_formation, 'defense', 1)
  ON CONFLICT (match_id, formation_id, formation_type) 
  DO UPDATE SET 
    usage_count = formation_statistics.usage_count + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_squad_statistics ON squad_predictions;
CREATE TRIGGER trigger_update_squad_statistics
  AFTER INSERT ON squad_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_squad_statistics();

-- ============================================

SELECT 'Squad predictions schema created successfully!' AS status;
