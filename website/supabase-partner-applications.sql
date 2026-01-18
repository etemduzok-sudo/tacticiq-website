-- =====================================================
-- TacticIQ Partner Applications (Ortaklık Başvuruları)
-- =====================================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın
-- =====================================================

-- Partner Applications Table (Ortaklık Başvuruları)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  company_type TEXT CHECK (company_type IN ('media', 'sports', 'technology', 'gaming', 'agency', 'other')) DEFAULT 'other',
  partnership_type TEXT CHECK (partnership_type IN ('advertising', 'sponsorship', 'content', 'technology', 'distribution', 'other')) DEFAULT 'other',
  message TEXT,
  expected_reach TEXT, -- Tahmini erişim/kitle
  budget_range TEXT, -- Bütçe aralığı
  status TEXT CHECK (status IN ('new', 'reviewing', 'contacted', 'negotiating', 'approved', 'rejected')) DEFAULT 'new',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  admin_notes TEXT,
  is_read BOOLEAN DEFAULT false,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_priority ON partner_applications(priority);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created ON partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_applications_is_read ON partner_applications(is_read);

-- Enable RLS
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- Public can insert (for application form)
CREATE POLICY "Public can insert partner_applications" ON partner_applications FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin full access partner_applications" ON partner_applications FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON partner_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Success!
-- =====================================================
