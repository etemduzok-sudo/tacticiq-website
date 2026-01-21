-- =====================================================
-- Unified User Profiles Table for TacticIQ
-- Web + Mobile App Synchronized Profile System
-- =====================================================
-- Bu SQL script'i Supabase SQL Editor'de çalıştırın

-- =====================================================
-- 1. user_profiles Tablosuna Yeni Alanlar Ekle
-- =====================================================

-- Nickname alanı ekle (mobile username)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Oyun istatistikleri alanları
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS correct_predictions INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,2) DEFAULT 0.00;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS day_streak INTEGER DEFAULT 0;

-- Sıralama alanları
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS country_rank INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS global_rank INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'TR';

-- Milli takım ve kulüp takımları
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS national_team TEXT;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS club_teams TEXT[] DEFAULT '{}';

-- Rozet ve seviye bilgileri
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Tercihler
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Istanbul';

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- =====================================================
-- 2. Nickname Unique Index (opsiyonel)
-- =====================================================

-- Nickname benzersizlik kontrolü (boş değilse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_nickname 
ON public.user_profiles(nickname) 
WHERE nickname IS NOT NULL AND nickname != '';

-- =====================================================
-- 3. Yeni Indexler
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_country_rank 
ON public.user_profiles(country_rank) 
WHERE country_rank > 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_global_rank 
ON public.user_profiles(global_rank) 
WHERE global_rank > 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_total_points 
ON public.user_profiles(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_country 
ON public.user_profiles(country);

-- =====================================================
-- 4. Sıralama Güncelleme Fonksiyonu
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS void AS $$
BEGIN
  -- Türkiye sıralaması (country = 'TR' olanlar için)
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
    FROM public.user_profiles
    WHERE country = 'TR' AND total_points > 0
  )
  UPDATE public.user_profiles p
  SET country_rank = r.rank
  FROM ranked r
  WHERE p.id = r.id;

  -- Global sıralama (tüm kullanıcılar)
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
    FROM public.user_profiles
    WHERE total_points > 0
  )
  UPDATE public.user_profiles p
  SET global_rank = r.rank
  FROM ranked r
  WHERE p.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Accuracy Hesaplama Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_predictions > 0 THEN
    NEW.accuracy := ROUND((NEW.correct_predictions::NUMERIC / NEW.total_predictions) * 100, 2);
  ELSE
    NEW.accuracy := 0;
  END IF;
  
  -- Level hesapla (her 500 puan = 1 level)
  NEW.level := GREATEST(1, FLOOR(NEW.total_points / 500) + 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_accuracy ON public.user_profiles;

CREATE TRIGGER trigger_calculate_accuracy
  BEFORE UPDATE OF total_predictions, correct_predictions, total_points ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_accuracy();

-- =====================================================
-- 6. Toplam Oyuncu Sayısı View
-- =====================================================

CREATE OR REPLACE VIEW public.player_counts AS
SELECT 
  country,
  COUNT(*) as total_players
FROM public.user_profiles
WHERE total_points > 0 OR total_predictions > 0
GROUP BY country
UNION ALL
SELECT 
  'GLOBAL' as country,
  COUNT(*) as total_players
FROM public.user_profiles
WHERE total_points > 0 OR total_predictions > 0;

-- =====================================================
-- 7. handle_new_user Trigger Güncelle
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    email, 
    name, 
    nickname,
    plan, 
    country,
    preferred_language,
    theme,
    level,
    created_at, 
    last_login_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    'free',
    COALESCE(NEW.raw_user_meta_data->>'country', 'TR'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'tr'),
    'dark',
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login_at = NOW(),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Mevcut users Tablosundan Veri Taşıma (Migration)
-- =====================================================

-- Eğer eski users tablosu varsa, verileri taşı
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Mevcut users verilerini user_profiles'a taşı
    INSERT INTO public.user_profiles (
      id, email, nickname, total_points, current_streak, best_streak, 
      accuracy, country_rank, plan, created_at
    )
    SELECT 
      id, 
      email, 
      username,
      total_points,
      current_streak,
      best_streak,
      accuracy,
      rank,
      CASE WHEN is_premium THEN 'pro' ELSE 'free' END,
      created_at
    FROM public.users
    WHERE id NOT IN (SELECT id FROM public.user_profiles)
    ON CONFLICT (id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      total_points = EXCLUDED.total_points,
      current_streak = EXCLUDED.current_streak,
      best_streak = EXCLUDED.best_streak,
      accuracy = EXCLUDED.accuracy,
      country_rank = EXCLUDED.country_rank,
      updated_at = NOW();
    
    RAISE NOTICE 'Migrated data from users table to user_profiles';
  END IF;
END $$;

-- =====================================================
-- TAMAMLANDI!
-- =====================================================
-- Bu script çalıştırıldıktan sonra:
-- 1. user_profiles tablosu tüm oyun alanlarına sahip ✅
-- 2. Accuracy ve level otomatik hesaplanıyor ✅
-- 3. Sıralama fonksiyonu hazır ✅
-- 4. Eski users tablosundan veriler taşındı ✅
--
-- Web ve mobil artık aynı tabloyu kullanabilir!
