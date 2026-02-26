-- =====================================================
-- static_teams.league_type sütununu yoksa ekle (sync script üst lig filtresi için)
-- Supabase SQL Editor'da çalıştırın.
-- =====================================================

-- Sütun yoksa ekle (PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'static_teams' AND column_name = 'league_type'
  ) THEN
    ALTER TABLE public.static_teams
    ADD COLUMN league_type VARCHAR(50) NOT NULL DEFAULT 'domestic_top';
    CREATE INDEX IF NOT EXISTS idx_static_teams_league_type ON public.static_teams(league_type);
    RAISE NOTICE 'league_type sütunu eklendi (default: domestic_top).';
  ELSE
    RAISE NOTICE 'league_type zaten mevcut.';
  END IF;
END $$;

-- Constraint güncelle (genişletilmiş değerler – 010 ile uyumlu)
ALTER TABLE public.static_teams DROP CONSTRAINT IF EXISTS static_teams_league_type_check;
ALTER TABLE public.static_teams ADD CONSTRAINT static_teams_league_type_check CHECK (
  league_type IN (
    'domestic_top', 'domestic_cup', 'continental', 'continental_club', 'continental_national',
    'confederation_format', 'global', 'international', 'world_cup', 'continental_championship'
  )
);
