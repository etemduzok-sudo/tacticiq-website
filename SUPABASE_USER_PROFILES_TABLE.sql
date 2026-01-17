-- =====================================================
-- User Profiles Table for TacticIQ Website
-- =====================================================
-- Bu SQL script'i Supabase SQL Editor'de çalıştırın
-- Supabase Dashboard > SQL Editor > New Query

-- =====================================================
-- 1. user_profiles Tablosunu Oluştur
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  favorite_teams TEXT[] DEFAULT '{}',
  preferred_language TEXT DEFAULT 'tr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- =====================================================
-- 2. Indexler
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles(plan);

-- =====================================================
-- 3. updated_at Trigger (Otomatik Güncelleme)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Row Level Security (RLS) Politikaları
-- =====================================================

-- RLS'yi aktif et
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can create profile on signup" ON public.user_profiles;

-- Kullanıcılar kendi profillerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Herkes yeni kullanıcı profil oluşturabilir (signup sırasında)
CREATE POLICY "Public can create profile on signup"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 5. Otomatik Profil Oluşturma Trigger
-- =====================================================

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, plan, created_at, last_login_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. Test (Opsiyonel)
-- =====================================================

-- Mevcut kullanıcılar için manuel profil oluşturma (opsiyonel)
-- INSERT INTO public.user_profiles (id, email, name, plan)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 'free'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.user_profiles)
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TAMAMLANDI!
-- =====================================================
-- Bu script'i çalıştırdıktan sonra:
-- 1. Tablo oluşturuldu ✅
-- 2. RLS politikaları aktif ✅
-- 3. Yeni kullanıcılar otomatik profil alacak ✅
-- 
-- Test için Google ile giriş yapın, profil otomatik oluşturulmalı.
