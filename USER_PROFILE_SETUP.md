# User Profiles Tablosu Kurulum Rehberi

Google/Email ile kayıt olduktan sonra kullanıcı profili oluşturmak için Supabase'de `user_profiles` tablosu oluşturmanız gerekiyor.

## 🚀 Hızlı Kurulum

### 1. Supabase SQL Editor'e Git

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. Sol menüden **SQL Editor** seçin
3. **New Query** butonuna tıklayın

### 2. SQL Script'i Çalıştır

1. `SUPABASE_USER_PROFILES_TABLE.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. **RUN** butonuna tıklayın (veya F5)
4. "Success. No rows returned" mesajını görmelisiniz

### 3. Kontrol

1. Sol menüden **Table Editor** seçin
2. `user_profiles` tablosu görünmeli
3. Yeni bir kullanıcı kaydolduğunda otomatik olarak profil oluşturulmalı

## ✅ Script Neler Yapıyor?

1. ✅ `user_profiles` tablosunu oluşturur
2. ✅ RLS (Row Level Security) politikalarını ayarlar
3. ✅ Kullanıcılar kendi profillerini görebilir/güncelleyebilir
4. ✅ Yeni kullanıcı kaydolduğunda otomatik profil oluşturur (trigger)
5. ✅ Index'ler ekler (performans için)

## 🔧 Test Etme

Script'i çalıştırdıktan sonra:

1. Web sitesinde **Google ile giriş** yapın
2. Giriş yaptıktan sonra profil sayfasına gidin
3. Profil bilgileriniz görünmeli

## 🆘 Sorun Giderme

### "relation user_profiles does not exist" Hatası

- SQL script'i henüz çalıştırılmamış
- `SUPABASE_USER_PROFILES_TABLE.sql` dosyasını Supabase SQL Editor'de çalıştırın

### "permission denied" Hatası

- RLS politikaları yanlış ayarlanmış
- SQL script'i tekrar çalıştırın (önceki politikaları override eder)

### Profil Oluşturulmuyor

1. Supabase Dashboard > Table Editor > `user_profiles` tablosunu kontrol edin
2. Yeni kayıt var mı bakın
3. Eğer yoksa, trigger çalışmıyor olabilir - SQL script'i tekrar çalıştırın

### Manuel Profil Oluşturma (Eski Kullanıcılar İçin)

Eğer SQL script'teki test bölümünü (6. bölüm) aktif etmek isterseniz:

```sql
INSERT INTO public.user_profiles (id, email, name, plan)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;
```

Bu script, mevcut kullanıcılar için de profil oluşturur.

## 📝 Tablo Yapısı

```sql
user_profiles (
  id UUID (PK, FK -> auth.users)
  email TEXT
  name TEXT
  avatar TEXT
  plan TEXT ('free' | 'pro')
  favorite_teams TEXT[]
  preferred_language TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
  last_login_at TIMESTAMPTZ
)
```

## 🔗 İlgili Dosyalar

- `SUPABASE_USER_PROFILES_TABLE.sql` - Tablo oluşturma script'i
- `src/contexts/UserAuthContext.tsx` - Profil fetch/update fonksiyonları
