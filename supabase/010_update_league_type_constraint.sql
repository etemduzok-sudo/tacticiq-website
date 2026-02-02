-- =====================================================
-- static_teams league_type CHECK constraint güncellemesi
-- =====================================================
-- Yeni lig kategorileri: continental_club, continental_national,
-- confederation_format, global
-- =====================================================

-- Mevcut CHECK constraint'i kaldır (PostgreSQL auto-generated isim)
ALTER TABLE static_teams DROP CONSTRAINT IF EXISTS static_teams_league_type_check;

-- Genişletilmiş league_type değerleri ile yeni constraint ekle
ALTER TABLE static_teams ADD CONSTRAINT static_teams_league_type_check CHECK (
    league_type IN (
        'domestic_top',
        'domestic_cup',
        'continental',
        'continental_club',
        'continental_national',
        'confederation_format',
        'global',
        'international',
        'world_cup',
        'continental_championship'
    )
);
