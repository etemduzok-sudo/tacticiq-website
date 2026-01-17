-- =====================================================
-- Mevcut Kullanıcılar İçin Profil Oluşturma
-- =====================================================
-- Bu script, Supabase'de kayıtlı olan ancak user_profiles 
-- tablosunda kaydı olmayan kullanıcılar için profil oluşturur.
-- 
-- Önce SUPABASE_USER_PROFILES_TABLE.sql'i çalıştırdığınızdan emin olun!

-- Mevcut kullanıcılar için manuel profil oluşturma
INSERT INTO public.user_profiles (
  id, 
  email, 
  name, 
  plan, 
  created_at, 
  last_login_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) as name,
  'free' as plan,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Sonuç kontrolü
SELECT 
  'Total users in auth.users:' as description,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Total profiles in user_profiles:' as description,
  COUNT(*) as count
FROM public.user_profiles;

-- Kullanıcı listesi (test için)
SELECT 
  up.id,
  up.email,
  up.name,
  up.plan,
  u.created_at as auth_created_at,
  up.created_at as profile_created_at,
  u.last_sign_in_at
FROM public.user_profiles up
LEFT JOIN auth.users u ON u.id = up.id
ORDER BY up.created_at DESC;
