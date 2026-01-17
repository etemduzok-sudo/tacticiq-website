# Supabase Email Confirmation Ayarları

Kayıt olduktan sonra "Hesabınız oluşturuldu, e-postanızı kontrol edin" mesajı görünüyorsa, email confirmation aktif demektir.

## 📧 Email Confirmation Kontrolü

### 1. Supabase Dashboard'da

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** > **Settings** sayfasına gidin
3. **Auth Providers** bölümünde **Email** sekmesine gidin
4. **"Confirm email"** seçeneğini kontrol edin

### 2. İki Seçenek

#### Seçenek A: Email Confirmation'ı Kapat (Development/Test İçin)

**Avantaj:** Hemen giriş yapabilir, email doğrulama gerektirmez  
**Dezavantaj:** Güvenlik açısından daha az güvenli

1. **Authentication** > **Settings** > **Email** sekmesi
2. **"Confirm email"** toggle'ını **KAPAT**
3. **Save** butonuna tıklayın

#### Seçenek B: Email Confirmation'ı Açık Tut (Production İçin - Önerilen)

**Avantaj:** Daha güvenli, spam hesapları önler  
**Dezavantaj:** Kullanıcılar email'lerini doğrulamalı

1. **"Confirm email"** toggle'ını **AÇIK** tutun
2. **Email Templates** bölümünden email şablonlarını özelleştirebilirsiniz
3. Kullanıcılar email'lerindeki doğrulama linkine tıklayarak hesabı aktif ederler

### 3. SMTP Ayarları (Email Gönderimi İçin)

Email confirmation aktifse, SMTP ayarları yapılandırılmalı:

1. **Authentication** > **Settings** > **SMTP Settings** sekmesine gidin
2. SMTP sunucu bilgilerinizi girin:
   - **SMTP Host**: `smtp.gmail.com` (Gmail için) veya başka bir SMTP sunucusu
   - **SMTP Port**: `587`
   - **SMTP User**: Email adresiniz
   - **SMTP Password**: App password veya normal şifre
   - **Sender Email**: Gönderici email adresi

**Gmail için:**
- [Google Account](https://myaccount.google.com/) > **Security** > **2-Step Verification** aktif olmalı
- **App Passwords** bölümünden uygulama şifresi oluşturun
- Bu app password'ü SMTP Password olarak kullanın

### 4. Test Etme

**Email Confirmation Kapalıysa:**
1. Email ile kayıt ol
2. Hemen giriş yapabilmelisiniz
3. Profil otomatik görünmeli

**Email Confirmation Açıksa:**
1. Email ile kayıt ol
2. Email'inizi kontrol edin
3. Doğrulama linkine tıklayın
4. Sonra giriş yapın

## 🔧 Kod Tarafında Email Confirmation Kontrolü

Kodda email confirmation durumunu kontrol ediyoruz:

```typescript
// UserAuthContext.tsx - signUpWithEmail fonksiyonunda
if (data.user && !data.session) {
  // Email confirmation required
  return { 
    success: true, 
    error: 'E-posta adresinize bir doğrulama linki gönderildi...' 
  };
}
```

Bu durumda kullanıcı session'ı olmaz, email'ini doğrulaması gerekir.

## ✅ Öneri

**Development/Test için:**
- Email Confirmation'ı **KAPAT**
- Hemen test edebilirsiniz

**Production için:**
- Email Confirmation'ı **AÇIK TUT**
- SMTP ayarlarını yapılandırın
- Email şablonlarını özelleştirin

## 🆘 Sorun Giderme

### Email Gelmiyor

1. **SMTP Settings** kontrol edin
2. **Email Templates** kontrol edin
3. **Spam** klasörünü kontrol edin
4. Supabase Dashboard > **Logs** > **Auth Logs** bölümünden email gönderim loglarını kontrol edin

### "Confirm email" Toggle Bulunamıyor

- Supabase'in eski versiyonunda farklı isimle olabilir
- "Enable email confirmations" veya "Require email confirmation" gibi isimlerle aranabilir
