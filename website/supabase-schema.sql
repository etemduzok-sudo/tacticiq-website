-- =====================================================
-- TacticIQ Admin Panel - Supabase Database Schema
-- =====================================================
-- Bu SQL dosyasını Supabase Dashboard > SQL Editor'de çalıştırın
-- =====================================================

-- 1. Admin Config Table (Key-Value Store)
-- Tüm ayarları saklar: priceSettings, discountSettings, sectionSettings, adSettings, notificationSettings
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(config_key);

-- 2. Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  category TEXT,
  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  avatar TEXT,
  bio TEXT,
  linkedin TEXT,
  twitter TEXT,
  email TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Advertisements Table
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')) DEFAULT 'image',
  placement TEXT CHECK (placement IN ('popup', 'banner', 'sidebar')) DEFAULT 'popup',
  media_url TEXT,
  link_url TEXT,
  duration INTEGER DEFAULT 10,
  frequency INTEGER DEFAULT 5,
  display_count INTEGER,
  current_displays INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Feature Categories Table (15 Tahmin Kategorisi)
CREATE TABLE IF NOT EXISTS feature_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '⚽',
  featured BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Press Releases Table (Basın Bültenleri)
CREATE TABLE IF NOT EXISTS press_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  release_date DATE,
  category TEXT CHECK (category IN ('product', 'partnership', 'award', 'event', 'other')) DEFAULT 'other',
  content TEXT,
  image_url TEXT,
  pdf_url TEXT,
  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  author TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Press Kit Files Table (Basın Kiti Dosyaları)
CREATE TABLE IF NOT EXISTS press_kit_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('logo', 'brand-guide', 'screenshot', 'document', 'other')) DEFAULT 'other',
  format TEXT,
  size TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Section Media Table (Bölüm Görselleri ve Metinleri)
CREATE TABLE IF NOT EXISTS section_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'text')) DEFAULT 'image',
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for section lookups
CREATE INDEX IF NOT EXISTS idx_section_media_section ON section_media(section_id);

-- 9. Games Table (Partner Oyunlar)
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  link TEXT,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT CHECK (log_type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  message TEXT NOT NULL,
  details JSONB,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for log filtering
CREATE INDEX IF NOT EXISTS idx_admin_logs_type ON admin_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- 11. Users Table (Kullanıcılar)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  plan TEXT CHECK (plan IN ('Free', 'Premium')) DEFAULT 'Free',
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Admin Stats Table
CREATE TABLE IF NOT EXISTS admin_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_key TEXT UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_kit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for website (SELECT only)
CREATE POLICY "Public read access" ON admin_config FOR SELECT USING (true);
CREATE POLICY "Public read access" ON partners FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON advertisements FOR SELECT USING (true);
CREATE POLICY "Public read access" ON feature_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON press_releases FOR SELECT USING (true);
CREATE POLICY "Public read access" ON press_kit_files FOR SELECT USING (true);
CREATE POLICY "Public read access" ON section_media FOR SELECT USING (true);
CREATE POLICY "Public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access" ON admin_stats FOR SELECT USING (true);

-- Admin full access (for authenticated users - later can be restricted to admin role)
CREATE POLICY "Admin full access" ON admin_config FOR ALL USING (true);
CREATE POLICY "Admin full access" ON partners FOR ALL USING (true);
CREATE POLICY "Admin full access" ON team_members FOR ALL USING (true);
CREATE POLICY "Admin full access" ON advertisements FOR ALL USING (true);
CREATE POLICY "Admin full access" ON feature_categories FOR ALL USING (true);
CREATE POLICY "Admin full access" ON press_releases FOR ALL USING (true);
CREATE POLICY "Admin full access" ON press_kit_files FOR ALL USING (true);
CREATE POLICY "Admin full access" ON section_media FOR ALL USING (true);
CREATE POLICY "Admin full access" ON games FOR ALL USING (true);
CREATE POLICY "Admin full access" ON admin_logs FOR ALL USING (true);
CREATE POLICY "Admin full access" ON users FOR ALL USING (true);
CREATE POLICY "Admin full access" ON admin_stats FOR ALL USING (true);

-- =====================================================
-- Default Data - Feature Categories
-- =====================================================

INSERT INTO feature_categories (key, title, description, emoji, featured, enabled, sort_order) VALUES
  ('halftime_score', 'İlk Yarı Skor Tahmini', 'İlk yarı için tam skor tahmini yapın (örn: 1-0, 2-1)', '⚽', true, true, 1),
  ('halftime_extra', 'İlk Yarı Ek Tahminler', 'Alt/Üst gol, karşılıklı gol, handikap tahminleri', '⏱️', false, true, 2),
  ('fulltime_score', 'Maç Sonu Skor Tahmini', 'Normal süre sonunda tam skor tahmini yapın', '⚽', true, true, 3),
  ('fulltime_extra', 'Maç Sonu Ek Tahminler', 'Gol yok, tek taraflı gol, farklı galip tahminleri', '⏱️', false, true, 4),
  ('yellow_cards', 'Sarı Kart Sayısı', 'Toplam sarı kart sayısını tahmin edin (0-8+)', '🟨', false, true, 5),
  ('red_cards', 'Kırmızı Kart', 'Kırmızı kart görülüp görülmeyeceğini tahmin edin', '🟥', false, true, 6),
  ('total_shots', 'Toplam Şut Sayısı', 'Her iki takımın toplam şut sayısını tahmin edin', '🎯', false, true, 7),
  ('shots_on_target', 'İsabetli Şut Sayısı', 'Kaleye giden şut sayısını tahmin edin', '🎯', false, true, 8),
  ('tempo', 'Maç Temposu', 'Maçın hızlı, dengeli veya yavaş geçeceğini tahmin edin', '🏃', false, true, 9),
  ('scenario', 'Maç Senaryosu', 'Maçın nasıl gelişeceğini tahmin edin (baskılı başlangıç, geç gol vb.)', '🧠', true, true, 10),
  ('total_goals', 'Toplam Gol Sayısı', 'Maçta atılacak toplam gol sayısını tahmin edin (0-5+)', '🧮', true, true, 11),
  ('first_goal', 'İlk Gol Zamanı', 'İlk golün hangi dakika aralığında atılacağını tahmin edin', '⏰', true, true, 12),
  ('possession', 'Top Hakimiyeti', 'Hangi takımın daha fazla top hakimiyetine sahip olacağını tahmin edin', '📊', false, true, 13),
  ('corners', 'Korner Sayısı', 'Toplam korner sayısını tahmin edin (0-15+)', '🚩', false, true, 14),
  ('goal_expectation', 'Gol Beklentisi (xG)', 'Her iki takımın beklenen gol değerini (Expected Goals) tahmin edin', '⚡', true, true, 15)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Default Data - Admin Config (Initial Settings)
-- =====================================================

INSERT INTO admin_config (config_key, config_value) VALUES
  ('price_settings', '{"proPrice": 99.99, "baseCurrency": "TRY", "freeTrialDays": 7, "monthlyPrice": 29.99, "yearlyPrice": 99.99, "billingPeriod": "yearly"}'),
  ('discount_settings', '{"enabled": false, "discountPercent": 20, "showDiscountOnWeb": true, "showDiscountViaPopup": false, "dailyShowLimit": 3, "showDelay": 5000, "timerDuration": 600, "maxShowsPerUser": 5, "cooldownAfterClose": 3600, "showOnEveryPage": false, "popupTitle": "Özel Teklif!", "popupDescription": "Sınırlı süre için özel indirim fırsatı", "ctaButtonText": "Hemen Al"}'),
  ('ad_settings', '{"systemEnabled": false, "popupEnabled": false, "bannerEnabled": false, "sidebarEnabled": false, "adminEmail": "admin@tacticiq.app"}'),
  ('notification_settings', '{"notificationEmail": "etemduzok@gmail.com", "sendOnExit": true, "sendOnImportantChanges": true}'),
  ('section_settings', '{"hero": {"enabled": true, "showStats": true, "showEmailSignup": true, "showPlayButton": true}, "features": {"enabled": true, "maxFeatures": 5}, "howItWorks": {"enabled": true}, "product": {"enabled": true}, "playerPrediction": {"enabled": false}, "training": {"enabled": false}, "pricing": {"enabled": true, "showFreeOption": true, "discountEnabled": true}, "blog": {"enabled": true, "maxPosts": 5}, "appDownload": {"enabled": false, "showQRCodes": false}, "cta": {"enabled": true}, "game": {"enabled": false}, "testimonials": {"enabled": true, "showStats": true}, "about": {"enabled": true, "showTeam": true, "showMission": true}, "partners": {"enabled": false}, "press": {"enabled": false}, "faq": {"enabled": true}, "contact": {"enabled": true, "emailAddress": "info@tacticiq.app", "officeAddress": "İstanbul, Türkiye", "workingHours": "09:00 - 17:00", "workingDays": "Pzt - Cmt", "responseTime": "24 saat içinde"}, "newsletter": {"enabled": true}, "footer": {"enabled": true, "showVisitorCounter": true, "showSocialLinks": true, "showAppDownloadButtons": true}, "auth": {"enabled": true, "requireAgeVerification": true, "minimumAge": 18, "enableGoogleAuth": true, "enableAppleAuth": false, "enableEmailAuth": true, "requireEmailConfirmation": true, "requireTermsAcceptance": true, "requirePrivacyAcceptance": true}}')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- Functions for Auto-Update Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_categories_updated_at BEFORE UPDATE ON feature_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_press_releases_updated_at BEFORE UPDATE ON press_releases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_press_kit_files_updated_at BEFORE UPDATE ON press_kit_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_section_media_updated_at BEFORE UPDATE ON section_media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_stats_updated_at BEFORE UPDATE ON admin_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Success Message
-- =====================================================
-- Eğer buraya kadar hata olmadan geldiyseniz, tüm tablolar başarıyla oluşturuldu!
-- Artık TacticIQ Admin Panel Supabase'e bağlanabilir.
