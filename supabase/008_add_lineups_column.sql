-- ============================================
-- ADD LINEUPS COLUMN TO MATCHES TABLE
-- ============================================
-- Kadro verilerini cache'lemek için lineups kolonu ekleniyor
-- Bu sayede her kullanıcı için API çağrısı yapılmaz
-- ============================================

-- Lineups kolonu ekle (JSONB - esnek yapı)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS lineups JSONB DEFAULT NULL;

-- Comment ekle
COMMENT ON COLUMN matches.lineups IS 'Cached lineup data from API-Football. Array of team lineups with startXI, substitutes, formation, and coach info.';

-- Index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_matches_lineups ON matches USING GIN (lineups);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS matches_updated_at_trigger ON matches;
CREATE TRIGGER matches_updated_at_trigger
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_updated_at();

-- ============================================
-- VERIFY
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'matches' AND column_name = 'lineups';
