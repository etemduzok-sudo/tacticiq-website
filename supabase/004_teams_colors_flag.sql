-- ============================================
-- TEAMS TABLE - Colors and Flag Extension
-- ============================================
-- Takım forma renkleri ve milli takım bayrakları için kolonlar
-- ============================================

-- Add colors column (JSON array for kit colors - telif için logo yerine)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT NULL;

-- Add flag column (emoji or URL for national teams)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS flag TEXT DEFAULT NULL;

-- Add national column if not exists (for national teams)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS national BOOLEAN DEFAULT false;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_national ON teams(national);
CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country);

-- Comments
COMMENT ON COLUMN teams.colors IS 'Kit colors as JSON array [primary, secondary] - used instead of logos for copyright';
COMMENT ON COLUMN teams.flag IS 'Country flag emoji or URL for national teams';
COMMENT ON COLUMN teams.national IS 'Whether this is a national team';

-- ============================================
-- TEAMS COLORS AND FLAG EXTENSION COMPLETE
-- ============================================

SELECT 'Teams colors and flag columns added successfully!' AS status;
