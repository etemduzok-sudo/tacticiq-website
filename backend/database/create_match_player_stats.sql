-- match_player_stats: Canlı maç oyuncu istatistiklerini cache'lemek için
-- aggressiveCacheService ve /matches/:id/players endpoint tarafından kullanılır
CREATE TABLE IF NOT EXISTS match_player_stats (
  match_id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_player_stats_updated 
  ON match_player_stats (updated_at);

-- RLS Policy (public read, service role write)
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_player_stats" ON match_player_stats
  FOR SELECT USING (true);

CREATE POLICY "Service role write match_player_stats" ON match_player_stats
  FOR ALL USING (true) WITH CHECK (true);
