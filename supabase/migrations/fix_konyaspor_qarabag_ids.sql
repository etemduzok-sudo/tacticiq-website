-- Konyaspor (556) / Qarabag (556) ID çakışması düzeltmesi
-- API-Football'da 556 = Qarabag (Azerbaijan), Konyaspor = 557

-- 1. 556 = Qarabag olarak güncelle (eskiden Konyaspor yanlış atanmıştı)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES (556, 'Qarabag', 'Azerbaijan', 'Premyer Liqa', 'domestic_top', 'club', '["#00AA00", "#FFFFFF"]', '#00AA00', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET 
  name = EXCLUDED.name, country = EXCLUDED.country, league = EXCLUDED.league,
  colors = EXCLUDED.colors, colors_primary = EXCLUDED.colors_primary, colors_secondary = EXCLUDED.colors_secondary,
  last_updated = NOW();

-- 2. Konyaspor 557 olarak ekle/güncelle
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES (557, 'Konyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET 
  name = EXCLUDED.name, league = EXCLUDED.league,
  last_updated = NOW();
