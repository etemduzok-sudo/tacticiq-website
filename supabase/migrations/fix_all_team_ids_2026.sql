-- =====================================================
-- API-Football v3 Team ID Migration (2026-02-02)
-- TÜM TAKIMLARI DOĞRU ID'LERLE GÜNCELLİYOR
-- =====================================================

-- Turkish Süper Lig (Verified from API-Football)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
  (611, 'Fenerbahce', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFED00", "#00205B"]', '#FFED00', '#00205B'),
  (645, 'Galatasaray', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFD700"]', '#FF0000', '#FFD700'),
  (549, 'Besiktas', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
  (998, 'Trabzonspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#632134", "#00BFFF"]', '#632134', '#00BFFF'),
  (564, 'Basaksehir', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#F37021", "#000000"]', '#F37021', '#000000'),
  (3563, 'Adana Demirspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#0000FF", "#FFFFFF"]', '#0000FF', '#FFFFFF'),
  (1005, 'Antalyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF'),
  (607, 'Konyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF'),
  (1002, 'Sivasspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFFFFF"]', '#FF0000', '#FFFFFF'),
  (1004, 'Kasimpasa', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#000066", "#FFFFFF"]', '#000066', '#FFFFFF'),
  (994, 'Goztepe', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFD700", "#C8102E"]', '#FFD700', '#C8102E'),
  (1001, 'Kayserispor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF0000", "#FFD700"]', '#FF0000', '#FFD700'),
  (1007, 'Rizespor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#0000FF"]', '#006633', '#0000FF'),
  (3575, 'Hatayspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#006633", "#C8102E"]', '#006633', '#C8102E'),
  (3603, 'Samsunspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#C8102E", "#FFFFFF"]', '#C8102E', '#FFFFFF'),
  (3573, 'Gaziantep FK', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#C8102E", "#000000"]', '#C8102E', '#000000'),
  (996, 'Alanyaspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FF6600", "#006633"]', '#FF6600', '#006633'),
  (3588, 'Eyupspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#FFD700", "#000000"]', '#FFD700', '#000000'),
  (3583, 'BB Bodrumspor', 'Turkey', 'Süper Lig', 'domestic_top', 'club', '["#1E90FF", "#FFFFFF"]', '#1E90FF', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, country = EXCLUDED.country, league = EXCLUDED.league,
  colors = EXCLUDED.colors, colors_primary = EXCLUDED.colors_primary, colors_secondary = EXCLUDED.colors_secondary,
  last_updated = NOW();

-- Azerbaijan (Qarabag)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES (556, 'Qarabag', 'Azerbaijan', 'Premyer Liqa', 'domestic_top', 'club', '["#00AA00", "#FFFFFF"]', '#00AA00', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, country = EXCLUDED.country, league = EXCLUDED.league,
  colors = EXCLUDED.colors, last_updated = NOW();

-- Argentine Primera (Verified from API-Football)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
  (451, 'Boca Juniors', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#0066B3", "#FFFF00"]', '#0066B3', '#FFFF00'),
  (435, 'River Plate', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#FFFFFF", "#E30613"]', '#FFFFFF', '#E30613'),
  (460, 'San Lorenzo', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#E30613", "#0000FF"]', '#E30613', '#0000FF'),
  (436, 'Racing Club', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#FFFFFF", "#0066B3"]', '#FFFFFF', '#0066B3'),
  (453, 'Independiente', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#E30613", "#FFFFFF"]', '#E30613', '#FFFFFF'),
  (450, 'Estudiantes L.P.', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#FFFFFF", "#E30613"]', '#FFFFFF', '#E30613'),
  (438, 'Velez Sarsfield', 'Argentina', 'Liga Profesional', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Brasileirão (Verified from API-Football)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
  (1062, 'Atletico-MG', 'Brazil', 'Brasileirao', 'domestic_top', 'club', '["#000000", "#FFFFFF"]', '#000000', '#FFFFFF'),
  (121, 'Palmeiras', 'Brazil', 'Brasileirao', 'domestic_top', 'club', '["#006437", "#FFFFFF"]', '#006437', '#FFFFFF'),
  (126, 'Sao Paulo', 'Brazil', 'Brasileirao', 'domestic_top', 'club', '["#FFFFFF", "#E30613"]', '#FFFFFF', '#E30613')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- La Liga (Las Palmas)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES (534, 'Las Palmas', 'Spain', 'La Liga', 'domestic_top', 'club', '["#FFD700", "#0000FF"]', '#FFD700', '#0000FF')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Bundesliga (Freiburg)
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES (160, 'SC Freiburg', 'Germany', 'Bundesliga', 'domestic_top', 'club', '["#E2001A", "#000000"]', '#E2001A', '#000000')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Eredivisie
INSERT INTO static_teams (api_football_id, name, country, league, league_type, team_type, colors, colors_primary, colors_secondary)
VALUES
  (201, 'AZ Alkmaar', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#E30613", "#FFFFFF"]', '#E30613', '#FFFFFF'),
  (209, 'Feyenoord', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#E30613", "#FFFFFF"]', '#E30613', '#FFFFFF'),
  (415, 'Twente', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#E30613", "#FFFFFF"]', '#E30613', '#FFFFFF'),
  (207, 'Utrecht', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#CC0000", "#FFFFFF"]', '#CC0000', '#FFFFFF'),
  (426, 'Sparta Rotterdam', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#E30613", "#FFFFFF"]', '#E30613', '#FFFFFF'),
  (210, 'Heerenveen', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#003399", "#FFFFFF"]', '#003399', '#FFFFFF'),
  (202, 'Groningen', 'Netherlands', 'Eredivisie', 'domestic_top', 'club', '["#006633", "#FFFFFF"]', '#006633', '#FFFFFF')
ON CONFLICT (api_football_id) DO UPDATE SET
  name = EXCLUDED.name, colors = EXCLUDED.colors, last_updated = NOW();

-- Delete old incorrect IDs that no longer exist
DELETE FROM static_teams WHERE api_football_id IN (551, 3570, 562, 557, 550, 3574, 553, 564, 3571, 563, 367, 565, 552, 114, 192);
