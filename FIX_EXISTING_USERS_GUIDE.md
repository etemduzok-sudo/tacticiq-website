# Mevcut Kullanıcılar İçin Profil Oluşturma Rehberi

Supabase Dashboard'da kullanıcılar görünüyor ama web sitesinde profil görünmüyorsa, muhtemelen `user_profiles` tablosunda kayıtları yok.

## 🔍 Sorun Teşhisi

1. **Supabase Dashboard'da kullanıcılar görünüyor** ✅
   - `auth.users` tablosunda kayıt var
2. **Web sitesinde profil görünmüyor** ❌
   - `user_profiles` tablosunda kayıt yok
   - Veya session düzgün yüklenmiyor

## ✅ Çözüm Adımları

### Adım 1: `user_profiles` Tablosunu Oluşturun

Eğer henüz oluşturmadıysanız:

1. Supabase Dashboard > **SQL Editor**
2. `SUPABASE_USER_PROFILES_TABLE.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **RUN** ile çalıştırın
4. "Success. No rows returned" mesajını görmelisiniz

### Adım 2: Mevcut Kullanıcılar İçin Profil Oluşturun

1. Supabase Dashboard > **SQL Editor**
2. `SUPABASE_MIGRATE_EXISTING_USERS.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **RUN** ile çalıştırın
4. Şu sonuçları göreceksiniz:
   ```
   description                           | count
   --------------------------------------|-------
   Total users in auth.users:            | 2
   Total profiles in user_profiles:      | 2
   ```

### Adım 3: Test Edin

1. Web sitesini hard refresh yapın (Ctrl+F5)
2. Google ile giriş yapın veya email ile giriş yapın
3. Console'da şu log'ları görmelisiniz:
   - `✅ Session found, setting user: ...`
   - `✅ Profile found in Supabase: ...`
   - `✅ Profile set in state: ...`

## 🐛 Sorun Giderme

### Profil Hala Görünmüyor

**Console log'larını kontrol edin:**

1. Browser Developer Tools > Console
2. Şu log'ları arayın:
   - `🔍 Initial session check:` - Session var mı?
   - `✅ Profile found in Supabase:` - Profil Supabase'den geldi mi?
   - `❌ Profile insert error:` - Profil oluşturulurken hata var mı?

### "Profile insert error" Görüyorsanız

**RLS Policy Hatası:**
- `user_profiles` tablosunda RLS politikaları doğru ayarlanmamış olabilir
- `SUPABASE_USER_PROFILES_TABLE.sql` script'ini tekrar çalıştırın

**Tablo Yok Hatası:**
- "table does not exist" hatası görüyorsanız
- `SUPABASE_USER_PROFILES_TABLE.sql` script'ini önce çalıştırın

### Session Var Ama Profil Yok

**Manuel Profil Oluşturma:**

Supabase SQL Editor'de:

```sql
-- Belirli bir kullanıcı için profil oluştur
INSERT INTO public.user_profiles (id, email, name, plan)
SELECT 
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as name,
  'free' as plan
FROM auth.users
WHERE email = 'etemduzok@gmail.com'
ON CONFLICT (id) DO NOTHING;
```

## 📊 Kontrol Sorguları

**Kullanıcı ve Profil Eşleşmesi:**

```sql
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  up.id as profile_id,
  up.name as profile_name,
  up.created_at as profile_created
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;
```

**Profili Olmayan Kullanıcılar:**

```sql
SELECT u.id, u.email, u.created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.user_profiles);
```

## ✅ Başarı Kriterleri

1. ✅ `user_profiles` tablosu oluşturuldu
2. ✅ Tüm kullanıcılar için profil oluşturuldu
3. ✅ Web sitesinde giriş yapınca profil görünüyor
4. ✅ Header'da kullanıcı adı ve menü görünüyor
5. ✅ Console'da hata yok

## 🔄 Sonraki Adımlar

Profil oluşturulduktan sonra:

1. Web sitesinde giriş yapın
2. Profil bölümüne gidin
3. Kullanıcı bilgilerini güncelleyebilirsiniz
4. Plan yükseltme yapabilirsiniz
