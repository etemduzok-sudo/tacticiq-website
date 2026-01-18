-- =====================================================
-- TacticIQ Waitlist (Bekleme Listesi) - Supabase Schema
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- =====================================================

-- Waitlist Table (Bekleme Listesi)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website', -- website, social, referral, etc.
  status TEXT CHECK (status IN ('pending', 'contacted', 'converted', 'unsubscribed')) DEFAULT 'pending',
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  welcome_email_sent BOOLEAN DEFAULT false,
  welcome_email_sent_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  email_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can insert (for signup form)
CREATE POLICY "Public can insert waitlist" ON waitlist FOR INSERT WITH CHECK (true);

-- Public can read their own entry (by email)
CREATE POLICY "Public read own waitlist" ON waitlist FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin full access waitlist" ON waitlist FOR ALL USING (true);

-- Email Templates Table (E-posta Taslakları)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[], -- ['{{name}}', '{{email}}', '{{date}}']
  category TEXT CHECK (category IN ('welcome', 'update', 'promotion', 'announcement', 'custom')) DEFAULT 'custom',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read email_templates" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Admin full access email_templates" ON email_templates FOR ALL USING (true);

-- Email Logs Table (Gönderilen E-postalar)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('sent', 'failed', 'pending', 'opened', 'clicked')) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Index for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access email_logs" ON email_logs FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Default Email Templates
-- =====================================================

INSERT INTO email_templates (name, slug, subject, body_html, body_text, variables, category) VALUES
(
  'Hoş Geldin - Bekleme Listesi',
  'welcome-waitlist',
  'TacticIQ Bekleme Listesine Hoş Geldiniz! 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; background: #f9fafb; }
    .highlight { background: #0d9488; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { padding: 10px 0; border-bottom: 1px solid #eee; }
    .feature:last-child { border-bottom: none; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚽ TacticIQ''ya Hoş Geldiniz!</h1>
  </div>
  <div class="content">
    <p>Merhaba {{name}},</p>
    <p>TacticIQ bekleme listesine katıldığınız için teşekkür ederiz! Artık yapay zeka destekli futbol tahmin platformumuzun gelişmelerinden <strong>ilk siz haberdar olacaksınız</strong>.</p>
    
    <div class="highlight">
      <strong>🎯 Erken Erişim Avantajları:</strong>
      <ul>
        <li>Lansman öncesi beta erişimi</li>
        <li>Özel indirimler ve teklifler</li>
        <li>Yeni özellikler hakkında öncelikli bilgilendirme</li>
        <li>Geri bildirim verme ve ürünü şekillendirme fırsatı</li>
      </ul>
    </div>
    
    <div class="features">
      <h3>🚀 TacticIQ ile Neler Yapabileceksiniz?</h3>
      <div class="feature">⚽ 15 farklı tahmin kategorisi</div>
      <div class="feature">📊 Yapay zeka destekli maç analizleri</div>
      <div class="feature">🏆 Global liderlik tabloları</div>
      <div class="feature">🎮 Oyunlaştırılmış tahmin deneyimi</div>
      <div class="feature">📱 iOS ve Android uygulamaları</div>
    </div>
    
    <div class="cta">
      <a href="https://www.tacticiq.app">Web Sitemizi Ziyaret Edin</a>
    </div>
    
    <p>Sorularınız mı var? Bize her zaman <a href="mailto:info@tacticiq.app">info@tacticiq.app</a> adresinden ulaşabilirsiniz.</p>
    
    <p>Futbol sevgisiyle,<br><strong>TacticIQ Ekibi</strong></p>
  </div>
  <div class="footer">
    <p>Bu e-postayı {{email}} adresine gönderiyoruz çünkü TacticIQ bekleme listesine kaydoldunuz.</p>
    <p>© 2026 TacticIQ. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  'Merhaba {{name}},

TacticIQ bekleme listesine katıldığınız için teşekkür ederiz!

Artık yapay zeka destekli futbol tahmin platformumuzun gelişmelerinden ilk siz haberdar olacaksınız.

Erken Erişim Avantajları:
- Lansman öncesi beta erişimi
- Özel indirimler ve teklifler
- Yeni özellikler hakkında öncelikli bilgilendirme
- Geri bildirim verme ve ürünü şekillendirme fırsatı

Web sitemizi ziyaret edin: https://www.tacticiq.app

Sorularınız mı var? Bize info@tacticiq.app adresinden ulaşabilirsiniz.

Futbol sevgisiyle,
TacticIQ Ekibi',
  ARRAY['{{name}}', '{{email}}', '{{date}}'],
  'welcome'
),
(
  'Yeni Güncelleme Duyurusu',
  'update-announcement',
  'TacticIQ''da Heyecan Verici Gelişmeler! 🚀',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; background: #f9fafb; }
    .update-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Yeni Güncelleme!</h1>
  </div>
  <div class="content">
    <p>Merhaba {{name}},</p>
    <p>TacticIQ''da heyecan verici gelişmeler var ve sizinle paylaşmak istedik!</p>
    
    <div class="update-box">
      <h3>📢 Bu Haftanın Güncellemeleri:</h3>
      <p>{{update_content}}</p>
    </div>
    
    <div class="cta">
      <a href="https://www.tacticiq.app">Detayları Görüntüle</a>
    </div>
    
    <p>Geri bildirimlerinizi bekliyoruz!</p>
    
    <p>Futbol sevgisiyle,<br><strong>TacticIQ Ekibi</strong></p>
  </div>
  <div class="footer">
    <p>© 2026 TacticIQ. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  'Merhaba {{name}},

TacticIQ''da heyecan verici gelişmeler var!

{{update_content}}

Detaylar için: https://www.tacticiq.app

Futbol sevgisiyle,
TacticIQ Ekibi',
  ARRAY['{{name}}', '{{email}}', '{{update_content}}'],
  'update'
),
(
  'Lansman Duyurusu',
  'launch-announcement',
  '🎉 TacticIQ Yayında! Erken Erişim Fırsatınız!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; background: #f9fafb; }
    .special-offer { background: #fbbf24; color: #1f2937; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { background: #0d9488; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Büyük Gün Geldi!</h1>
  </div>
  <div class="content">
    <p>Merhaba {{name}},</p>
    <p><strong>Beklediğiniz an geldi!</strong> TacticIQ artık yayında ve siz bekleme listesinde olduğunuz için <strong>özel bir fırsat</strong> sizin için!</p>
    
    <div class="special-offer">
      <h2>🎁 Erken Erişim İndirimi</h2>
      <p style="font-size: 24px; font-weight: bold;">%{{discount}}  İNDİRİM!</p>
      <p>Sadece bekleme listesi üyeleri için geçerli</p>
      <p><strong>Kod: {{promo_code}}</strong></p>
    </div>
    
    <div class="cta">
      <a href="https://www.tacticiq.app">Hemen Başla</a>
    </div>
    
    <p>Bu fırsat sınırlı sürelidir. Kaçırmayın!</p>
    
    <p>Futbol sevgisiyle,<br><strong>TacticIQ Ekibi</strong></p>
  </div>
  <div class="footer">
    <p>© 2026 TacticIQ. Tüm hakları saklıdır.</p>
  </div>
</body>
</html>',
  'Merhaba {{name}},

Beklediğiniz an geldi! TacticIQ artık yayında!

Bekleme listesinde olduğunuz için özel bir fırsat:
%{{discount}} İNDİRİM!
Kod: {{promo_code}}

Hemen başlayın: https://www.tacticiq.app

Futbol sevgisiyle,
TacticIQ Ekibi',
  ARRAY['{{name}}', '{{email}}', '{{discount}}', '{{promo_code}}'],
  'announcement'
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Success!
-- =====================================================
