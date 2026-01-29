-- Migration: Add rating column to players table
-- Date: 2026-01-29
-- Description: Add rating column to store player ratings calculated from API-Football statistics

-- Add rating column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1);

-- Add index for faster rating queries
CREATE INDEX IF NOT EXISTS idx_players_rating ON public.players(rating);

-- Add comment
COMMENT ON COLUMN public.players.rating IS 'Player rating calculated from API-Football statistics (65-95 range)';
