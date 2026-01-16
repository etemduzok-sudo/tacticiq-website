# Supabase Kurulum Rehberi

TacticIQ admin authentication sistemi için Supabase kurulum adımları.

## 📋 Gereksinimler

- Ücretsiz bir Supabase hesabı ([supabase.com](https://supabase.com))
- E-posta doğrulaması

## 🚀 Hızlı Başlangıç

### 1. Supabase Projesi Oluşturma

1. [https://supabase.com](https://supabase.com) adresine gidin
2. "Start your project" veya "New Project" butonuna tıklayın
3. Proje bilgilerini doldurun:
   - **Name**: TacticIQ (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Size en yakın bölge
   - **Pricing Plan**: Free tier yeterlidir

### 2. API Anahtarlarını Alma

1. Supabase projenize girin
2. Sol menüden **Settings** (Ayarlar) → **API** seçeneğine tıklayın
3. Aşağıdaki bilgileri kopyalayın:
   - **Project URL** (URL bölümünden)
   - **anon public** key (API Keys bölümünden)

### 3. Environment Variables Ayarlama

1. Proje kök dizininde `.env` dosyası oluşturun:
```bash
cp .env.example .env
```

2. `.env` dosyasını açın ve değerleri girin:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Admin Kullanıcısı Oluşturma

**🔑 Varsayılan Admin Bilgileri:**
- **Email**: etemduzok@gmail.com
- **Password**: *130923*Tdd*

#### Yöntem 1: Supabase Dashboard (Önerilen)

1. Supabase projenizde **Authentication** → **Users** seçeneğine gidin
2. **Add User** → **Create new user** butonuna tıklayın
3. Admin bilgilerini girin:
   - **Email**: etemduzok@gmail.com
   - **Password**: *130923*Tdd*
   - **Auto Confirm User**: ✅ İşaretleyin (e-posta doğrulaması atlanır)
4. **Create User** butonuna tıklayın

#### Yöntem 2: SQL Sorgusu ile

1. Supabase'de **SQL Editor** seçeneğine gidin
2. Aşağıdaki sorguyu çalıştırın:

```sql
-- Admin kullanıcısı oluştur
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'etemduzok@gmail.com',
  crypt('*130923*Tdd*', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  ''
);
```

### 5. Normal Kullanıcı Authentication Settings

Supabase'de **Authentication** → **Providers** seçeneğinden aşağıdaki sağlayıcıları aktif edin:

#### Email Authentication (Varsayılan Aktif)
- **Enable Email provider**: ✅ Aktif
- **Confirm email**: Disable edebilirsiniz (production'da enable edin)
- **Secure email change**: Enable olabilir

#### Google OAuth
1. **Enable Google provider**: ✅ İşaretleyin
2. Google Cloud Console'dan OAuth 2.0 credentials oluşturun:
   - [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   - **Create Credentials** → **OAuth 2.0 Client ID**
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. **Client ID** ve **Client Secret**'i Supabase'e girin
4. **Save** butonuna tıklayın

#### Apple Sign In
1. **Enable Apple provider**: ✅ İşaretleyin
2. Apple Developer hesabınızdan:
   - [https://developer.apple.com/account/resources/identifiers/list](https://developer.apple.com/account/resources/identifiers/list)
   - **Services ID** oluşturun
   - **Sign in with Apple** yapılandırın
   - **Return URL**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. **Service ID**, **Team ID** ve **Key ID** bilgilerini Supabase'e girin
4. **Private Key** (.p8 dosyası) yükleyin
5. **Save** butonuna tıklayın

### 6. Site URL ve Redirect URLs Ayarlama

Supabase'de **Authentication** → **URL Configuration**:

1. **Site URL**: Production URL'nizi ekleyin (örn: `https://tacticiq.app`)
2. **Redirect URLs**: İzin verilen yönlendirme URL'lerini ekleyin:
   - `http://localhost:5173/**` (development)
   - `https://tacticiq.app/**` (production)

### 7. Test Etme

1. Uygulamayı başlatın:
```bash
npm run dev
```

2. Footer'daki admin butonuna tıklayın
3. Oluşturduğunuz e-posta ve şifre ile giriş yapın

## 🔒 Güvenlik Notları

### ✅ Yapılması Gerekenler

- **Güçlü şifreler kullanın** (en az 12 karakter, büyük/küçük harf, sayı, özel karakter)
- **`.env` dosyasını Git'e commit etmeyin** (`.gitignore`'a eklenmiş)
- **Production'da e-posta doğrulamasını aktif edin**
- **Row Level Security (RLS) politikaları oluşturun**
- **API anahtarlarını düzenli olarak yenileyin**

### ❌ Yapılmaması Gerekenler

- **anon key'i gizli tutmaya çalışmayın** (client-side'da kullanılır, public'tir)
- **service_role key'i asla client-side'da kullanmayın**
- **Admin şifrelerini kodda hardcode etmeyin**
- **Aynı şifreyi farklı servislerde kullanmayın**

## 🛠️ Sorun Giderme

### "Invalid API key" Hatası

**Çözüm:**
1. `.env` dosyasındaki `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini kontrol edin
2. Supabase Dashboard'dan anahtarları tekrar kopyalayın
3. Development server'ı yeniden başlatın (`npm run dev`)
4. Tarayıcı cache'ini temizleyin

### "Invalid login credentials" Hatası

**Çözüm:**
1. E-posta ve şifrenin doğru olduğunu kontrol edin
2. Supabase Dashboard → Authentication → Users'da kullanıcının olduğunu kontrol edin
3. Kullanıcının `email_confirmed_at` değerinin dolu olduğunu kontrol edin

### Kullanıcı oluşturulamıyor

**Çözüm:**
1. Authentication → Settings → Email Auth'un aktif olduğunu kontrol edin
2. Şifrenin minimum gereksinimleri karşıladığını kontrol edin
3. E-posta formatının geçerli olduğunu kontrol edin

## 📚 Ek Kaynaklar

- [Supabase Resmi Dokümantasyon](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

## 🎯 Sonraki Adımlar

1. ✅ Supabase projesini oluşturdunuz
2. ✅ API anahtarlarını aldınız
3. ✅ Environment variables'ı ayarladınız
4. ✅ Admin kullanıcısını oluşturdunuz
5. ✅ Test ettiniz

**Artık admin paneline giriş yapabilirsiniz!** 🎉

### Production Checklist

Production'a geçmeden önce:

- [ ] E-posta doğrulamasını aktif edin
- [ ] Güçlü şifreler kullanın
- [ ] RLS politikalarını ayarlayın
- [ ] Rate limiting ekleyin
- [ ] CORS ayarlarını yapın
- [ ] Backup stratejisi oluşturun
- [ ] Monitoring ayarlayın

## 💬 Destek

Sorun yaşıyorsanız:

1. Bu dokümantasyonu tekrar okuyun
2. [Supabase Discord](https://discord.supabase.com) topluluğuna katılın
3. [GitHub Issues](https://github.com/supabase/supabase/issues) kontrol edin
4. TacticIQ dokümantasyonunu inceleyin