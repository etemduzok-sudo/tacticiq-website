-- =====================================================
-- TacticIQ Admin Configuration Tables
-- Supabase SQL - Sadece website admin panel için
-- =====================================================

-- Admin Config Table (Key-Value yapısı)
-- Tüm admin ayarlarını tek tabloda saklar
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partners Table (Ortaklar)
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  link VARCHAR(500),
  category VARCHAR(100),
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table (Ekip Üyeleri)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  avatar VARCHAR(10),
  bio TEXT,
  linkedin VARCHAR(500),
  twitter VARCHAR(500),
  email VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advertisements Table (Reklamlar)
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'image',
  placement VARCHAR(50) DEFAULT 'popup',
  media_url TEXT,
  link_url TEXT,
  duration INTEGER DEFAULT 10,
  frequency INTEGER DEFAULT 5,
  display_count INTEGER,
  current_displays INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Logs Table (Sistem Logları)
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type VARCHAR(50) DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(config_key);
CREATE INDEX IF NOT EXISTS idx_partners_enabled ON partners(enabled);
CREATE INDEX IF NOT EXISTS idx_partners_order ON partners(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_members_enabled ON team_members(enabled);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(sort_order);
CREATE INDEX IF NOT EXISTS idx_advertisements_enabled ON advertisements(enabled);
CREATE INDEX IF NOT EXISTS idx_admin_logs_type ON admin_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- =====================================================
-- Row Level Security (RLS) - Opsiyonel
-- =====================================================
-- Admin authentication için RLS politikaları eklenebilir
-- Şimdilik public erişim açık (admin panel için)

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Public read access (website'de gösterim için)
CREATE POLICY "Public read access" ON partners FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON advertisements FOR SELECT USING (true);

-- Authenticated write access (sadece giriş yapmış kullanıcılar)
CREATE POLICY "Authenticated write access" ON admin_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON partners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON team_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON advertisements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write access" ON admin_logs FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- Updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Data (Varsayılan ayarlar)
-- =====================================================
INSERT INTO admin_config (config_key, config_value) VALUES
  ('discount_settings', '{"enabled": false, "discountPercent": 0, "dailyShowLimit": 3, "showDelay": 5000, "timerDuration": 600, "originalPrice": 0, "baseCurrency": "TRY", "maxShowsPerUser": 5, "cooldownAfterClose": 3600, "showOnEveryPage": false, "popupTitle": "Özel Teklif!", "popupDescription": "Sınırlı süre için özel indirim fırsatı", "ctaButtonText": "Hemen Al"}'),
  ('ad_settings', '{"systemEnabled": true, "popupEnabled": true, "bannerEnabled": true, "sidebarEnabled": false, "adminEmail": "admin@tacticiq.app"}'),
  ('section_settings', '{"hero": {"enabled": true, "showStats": true, "showEmailSignup": true, "showPlayButton": true}, "features": {"enabled": true}, "howItWorks": {"enabled": true}, "testimonials": {"enabled": true}, "pricing": {"enabled": true}, "faq": {"enabled": true}, "blog": {"enabled": true}, "partners": {"enabled": true}, "newsletter": {"enabled": true}, "contact": {"enabled": true}, "about": {"enabled": true}, "stats": {"enabled": true}}'),
  ('site_settings', '{"siteName": "TacticIQ", "siteUrl": "https://tacticiq.app", "defaultLanguage": "Türkçe", "timezone": "Europe/Istanbul", "gameEnabled": true}')
ON CONFLICT (config_key) DO NOTHING;
