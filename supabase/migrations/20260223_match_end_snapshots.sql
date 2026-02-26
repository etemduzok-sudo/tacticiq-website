-- Maç bitiş düdüğü anında (API-Football FT döndüğü anda) alınan tek snapshot.
-- Biten maç detayı isteğinde bu veri döndürülür; bitiş anındaki istatistik/event verisi korunur.
CREATE TABLE IF NOT EXISTS match_end_snapshots (
  match_id BIGINT PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE match_end_snapshots IS 'API-Football bitiş düdüğü (FT) anında alınan maç verisi; başka snapshot kabul edilmez.';

CREATE INDEX IF NOT EXISTS idx_match_end_snapshots_match_id ON match_end_snapshots(match_id);
