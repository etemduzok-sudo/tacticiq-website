# Supabase OAuth Provider Kurulum Rehberi

Bu rehber, Google ve Apple ile kayıt/giriş için Supabase OAuth provider'larını nasıl aktif edeceğinizi açıklar.

## 📋 Adımlar

### 1. Supabase Dashboard'a Giriş

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin: `jxdgiskusjljlpzvrzau`

### 2. Google OAuth Provider Kurulumu

#### A. Supabase Dashboard'da:

1. **Authentication** > **Providers** sayfasına gidin
2. **Google** provider'ını bulun ve **Enable** butonuna tıklayın
3. Şu bilgileri girin:
   - **Client ID (for OAuth)**: Google Cloud Console'dan alınacak
   - **Client Secret (for OAuth)**: Google Cloud Console'dan alınacak

#### B. Google Cloud Console'da:

1. [Google Cloud Console](https://console.cloud.google.com) adresine gidin
2. Proje seçin veya yeni proje oluşturun
3. **APIs & Services** > **Credentials** sayfasına gidin
4. **Create Credentials** > **OAuth client ID** seçin
5. **Application type**: Web application
6. **Authorized redirect URIs** ekleyin:
   ```
   https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback
   ```
7. **Authorized JavaScript origins** ekleyin:
   ```
   https://jxdgiskusjljlpzvrzau.supabase.co
   https://tacticiq.app
   ```
8. **Client ID** ve **Client Secret**'i kopyalayın
9. Supabase Dashboard'a geri dönün ve bu bilgileri yapıştırın
10. **Save** butonuna tıklayın

### 3. Apple OAuth Provider Kurulumu

#### A. Apple Developer Console'da:

1. [Apple Developer Portal](https://developer.apple.com/account) adresine gidin
2. **Certificates, Identifiers & Profiles** sayfasına gidin
3. **Identifiers** > **Services IDs** > **+** butonuna tıklayın
4. **Services ID** oluşturun:
   - **Description**: TacticIQ Web App
   - **Identifier**: `com.tacticiq.web` (veya benzersiz bir ID)
5. **Sign in with Apple** seçeneğini aktif edin
6. **Configure** butonuna tıklayın:
   - **Primary App ID**: App ID'nizi seçin
   - **Website URLs**:
     - **Domains and Subdomains**: `tacticiq.app`
     - **Return URLs**: `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback`

#### B. Secret Key (JWT) Oluşturma:

**ÖNEMLİ**: Apple OAuth için Secret Key, bir JWT (JSON Web Token) formatında olmalıdır. `.p8` dosyasını direkt kullanamazsınız!

1. Apple Developer Console'da:
   - **Keys** bölümünden yeni key oluşturun
   - **Sign in with Apple** seçeneğini işaretleyin
   - `.p8` dosyasını indirin (sadece bir kez indirebilirsiniz!)
   - **Key ID** ve **Team ID**'yi not edin

2. JWT oluşturma:
   - Detaylı rehber için: `APPLE_OAUTH_JWT_GUIDE.md` dosyasını inceleyin
   - Hızlı yöntem: [JWT.io](https://jwt.io) veya Node.js script kullanın
   - JWT formatında bir token oluşturmanız gerekir (`.p8` dosyası değil!)

#### C. Supabase Dashboard'da:

1. **Authentication** > **Providers** sayfasına gidin
2. **Apple** provider'ını bulun ve **Enable** butonuna tıklayın
3. Şu bilgileri girin:
   - **Services ID**: `com.tacticiq.web` (oluşturduğunuz Services ID)
   - **Secret Key**: ⚠️ **JWT token'ı** yapıştırın (`.p8` dosyasını değil!)
   - **Team ID**: Apple Developer hesabınızın Team ID'si
   - **Key ID**: Apple Developer'da oluşturduğunuz Key ID
4. **Save** butonuna tıklayın

**Detaylı JWT oluşturma rehberi için**: `APPLE_OAUTH_JWT_GUIDE.md` dosyasına bakın.

### 4. Email Signup Ayarları

1. **Authentication** > **Settings** sayfasına gidin
2. **Auth Providers** bölümünde:
   - **Enable email signup**: ✅ Aktif olmalı
   - **Confirm email**: İsteğe bağlı (production'da önerilir)
3. **Email Templates** bölümünden email şablonlarını özelleştirebilirsiniz

### 5. Redirect URL'leri Ayarla

1. **Authentication** > **URL Configuration** sayfasına gidin
2. **Site URL**:
   ```
   https://tacticiq.app
   ```
3. **Redirect URLs** listesine ekleyin:
   ```
   https://tacticiq.app/**
   http://localhost:5173/**
   http://localhost:5174/**
   http://localhost:5175/**
   ```

### 6. Test Etme

Provider'ları aktif ettikten sonra:

1. Web sitesinde **Kayıt Ol** butonuna tıklayın
2. **Google ile kayıt ol** butonunu test edin
3. **Apple ile kayıt ol** butonunu test edin
4. **E-posta ile kayıt ol** butonunu test edin

## ⚠️ Önemli Notlar

- Google ve Apple provider'ları aktif edilmeden OAuth girişi çalışmaz
- Provider'ları aktif ettikten sonra birkaç dakika beklemeniz gerekebilir
- Canlı site için redirect URL'lerin mutlaka `https://tacticiq.app` içermesi gerekir
- Email signup için SMTP ayarları yapılandırılmalı (isteğe bağlı ama önerilir)

## 🔧 Sorun Giderme

### "Unsupported provider: provider is not enabled" Hatası

- Supabase Dashboard'da provider'ın **Enable** durumunu kontrol edin
- Provider ayarlarının doğru girildiğinden emin olun

### "Invalid redirect URL" Hatası

- **URL Configuration** sayfasında redirect URL'lerin doğru eklendiğinden emin olun
- Google Cloud Console ve Apple Developer Portal'da redirect URL'lerin eşleştiğinden emin olun

### Email Signup Çalışmıyor

- **Authentication** > **Settings** > **Enable email signup** kontrol edin
- Email confirmation aktifse, kullanıcıların email'lerini doğrulaması gerekir

## 📞 Destek

Sorun yaşarsanız:
1. Supabase Dashboard'daki **Logs** sayfasını kontrol edin
2. Browser console'daki hata mesajlarını kontrol edin
3. Supabase dokümantasyonunu inceleyin: https://supabase.com/docs/guides/auth
