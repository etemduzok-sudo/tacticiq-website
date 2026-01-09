-- Add missing columns to user_stats
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0;

SELECT 'Missing columns added!' AS status;
