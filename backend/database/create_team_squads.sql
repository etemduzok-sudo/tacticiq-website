-- =====================================================
-- Team Squads Cache (Kadro önbelleği)
-- =====================================================
-- Kadrolar günde 1 kez API'den çekilir, uygulama sadece bu tablodan okur.
-- API kotası aşılmaz.
-- =====================================================

CREATE TABLE IF NOT EXISTS team_squads (
    team_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    team_name VARCHAR(255),
    team_data JSONB,
    players JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, season)
);

CREATE INDEX IF NOT EXISTS idx_team_squads_team_id ON team_squads(team_id);
CREATE INDEX IF NOT EXISTS idx_team_squads_updated_at ON team_squads(updated_at);

COMMENT ON TABLE team_squads IS 'Takım kadroları - günde 1 kez sync edilir, uygulama sadece buradan okur.';
