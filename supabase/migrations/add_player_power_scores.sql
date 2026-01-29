-- Migration: player_power_scores tablosu (PowerScore + 6 oznitelik, pozisyona gore agirlikli)
-- Tarih: 2026-01-29
-- Ayda 1 batch job ile doldurulur; kadro ekrani bu tabloyu okur.

CREATE TABLE IF NOT EXISTS public.player_power_scores (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id BIGINT NOT NULL,
  league_id BIGINT NOT NULL,
  season INTEGER NOT NULL,
  position TEXT,
  power_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  shooting NUMERIC(5,2),
  passing NUMERIC(5,2),
  dribbling NUMERIC(5,2),
  defense NUMERIC(5,2),
  physical NUMERIC(5,2),
  pace NUMERIC(5,2),
  form NUMERIC(5,2),
  discipline NUMERIC(5,2),
  fitness_status TEXT NOT NULL DEFAULT 'fit' CHECK (fitness_status IN ('fit', 'doubtful', 'injured')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, team_id, league_id, season)
);

CREATE INDEX IF NOT EXISTS idx_player_power_scores_player ON public.player_power_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_player_power_scores_team_league_season ON public.player_power_scores(team_id, league_id, season);
CREATE INDEX IF NOT EXISTS idx_player_power_scores_updated ON public.player_power_scores(updated_at);

COMMENT ON TABLE public.player_power_scores IS 'Pozisyona gore agirlikli PowerScore + 6 attribute (0-100). Ayda 1 API-Football batch ile guncellenir.';
