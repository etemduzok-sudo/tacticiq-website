-- =====================================================
-- Static Teams Database Schema
-- =====================================================
-- Bu tablo tüm önemli takımları içerir:
-- - Tüm ülkelerin en üst liglerindeki takımlar
-- - Yerel turnuva ve kupa takımları (örn: Türkiye Kupası)
-- - Kıta otoritelerinin kupaları (ŞL, EL, Konfederasyon Ligi)
-- - FIFA Dünya Kupası grup/playoff milli takımları
-- - Kıta kupaları (Afrika Uluslar Kupası, vs.)
-- 
-- Güncelleme: Haftada 1 kez (cron job ile)
-- Temizlik: 2 ay önceki veriler otomatik silinir
-- =====================================================

-- Static Teams Tablosu
CREATE TABLE IF NOT EXISTS static_teams (
    id SERIAL PRIMARY KEY,
    api_football_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    league VARCHAR(255),
    league_type VARCHAR(50) NOT NULL CHECK (league_type IN ('domestic_top', 'domestic_cup', 'continental', 'international', 'world_cup', 'continental_championship')),
    team_type VARCHAR(20) NOT NULL CHECK (team_type IN ('club', 'national')),
    colors JSONB, -- Resmi arma renkleri: ["#FF0000", "#FFFFFF"]
    colors_primary VARCHAR(7), -- Birincil renk (hızlı erişim için)
    colors_secondary VARCHAR(7), -- İkincil renk
    coach VARCHAR(255), -- Teknik direktör adı
    coach_api_id INTEGER, -- API-Football coach ID
    logo_url TEXT, -- ⚠️ TELİF HAKKI: Kulüp armaları ASLA kaydedilmez (sadece milli takımlar için NULL)
    flag_url TEXT, -- ✅ Milli takım bayrakları kullanılabilir (telifli değil)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index'ler
    INDEX idx_api_football_id (api_football_id),
    INDEX idx_team_type (team_type),
    INDEX idx_league_type (league_type),
    INDEX idx_country (country),
    INDEX idx_last_updated (last_updated),
    INDEX idx_name_search (name), -- Arama için
    FULLTEXT INDEX idx_fulltext_search (name, country, league) -- Full-text search
);

-- League Information Tablosu (Lig bilgileri)
-- ⚠️ TELİF HAKKI: UEFA, FIFA gibi organizasyonların logo'ları ASLA kaydedilmez
-- Sadece lig renkleri (brand colors) kullanılabilir
CREATE TABLE IF NOT EXISTS static_leagues (
    id SERIAL PRIMARY KEY,
    api_football_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    league_type VARCHAR(50) NOT NULL CHECK (league_type IN ('domestic_top', 'domestic_cup', 'continental', 'international', 'world_cup', 'continental_championship')),
    logo_url TEXT, -- ⚠️ TELİF HAKKI: Organizasyon logo'ları (UEFA, FIFA, vs.) ASLA kaydedilmez - her zaman NULL
    colors JSONB, -- ✅ Organizasyon renkleri (UEFA mavisi, FIFA kırmızısı, vs.) kullanılabilir
    colors_primary VARCHAR(7), -- Birincil renk (hızlı erişim için)
    colors_secondary VARCHAR(7), -- İkincil renk
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_football_id (api_football_id),
    INDEX idx_league_type (league_type),
    INDEX idx_country (country)
);

-- Update History Tablosu (Güncelleme geçmişi)
CREATE TABLE IF NOT EXISTS static_teams_update_history (
    id SERIAL PRIMARY KEY,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('full_sync', 'incremental', 'cleanup')),
    teams_added INTEGER DEFAULT 0,
    teams_updated INTEGER DEFAULT 0,
    teams_removed INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
);

-- Otomatik temizlik fonksiyonu (2 ay önceki verileri sil)
CREATE OR REPLACE FUNCTION cleanup_old_static_teams()
RETURNS void AS $$
BEGIN
    DELETE FROM static_teams
    WHERE last_updated < NOW() - INTERVAL '2 months'
    AND id NOT IN (
        SELECT DISTINCT team_id 
        FROM user_favorite_teams 
        WHERE team_id IS NOT NULL
    ); -- Kullanıcıların favori takımlarını koru
    
    -- Update history'den de eski kayıtları sil (6 ay)
    DELETE FROM static_teams_update_history
    WHERE started_at < NOW() - INTERVAL '6 months';
    
    RAISE NOTICE 'Cleanup completed: Old static teams removed';
END;
$$ LANGUAGE plpgsql;

-- Otomatik last_updated güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_static_teams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_static_teams_timestamp
    BEFORE UPDATE ON static_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_static_teams_timestamp();

-- View: Aktif takımlar (son 2 ay içinde güncellenmiş)
CREATE OR REPLACE VIEW v_active_static_teams AS
SELECT 
    id,
    api_football_id,
    name,
    country,
    league,
    league_type,
    team_type,
    colors,
    colors_primary,
    colors_secondary,
    coach,
    coach_api_id,
    logo_url,
    flag_url,
    last_updated
FROM static_teams
WHERE last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country, league, name;

-- View: Milli takımlar (hızlı erişim için)
CREATE OR REPLACE VIEW v_national_teams AS
SELECT 
    id,
    api_football_id,
    name,
    country,
    colors,
    colors_primary,
    colors_secondary,
    coach,
    flag_url
FROM static_teams
WHERE team_type = 'national'
AND last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country;

-- View: Kulüp takımları (hızlı erişim için)
-- ⚠️ TELİF HAKKI: logo_url ASLA döndürülmez (sadece renkler kullanılır)
CREATE OR REPLACE VIEW v_club_teams AS
SELECT 
    id,
    api_football_id,
    name,
    country,
    league,
    league_type,
    colors,
    colors_primary,
    colors_secondary,
    coach
    -- logo_url ASLA döndürülmez (telif koruması - sadece renkler kullanılır)
FROM static_teams
WHERE team_type = 'club'
AND last_updated >= NOW() - INTERVAL '2 months'
ORDER BY country, league, name;
