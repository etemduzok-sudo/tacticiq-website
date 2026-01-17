# Email Confirmation Redirect URL Sorunu

## 🐛 Sorun

Email doğrulama linkine tıklayınca `localhost` adresine yönlendiriliyor ve telefon/canlı siteden erişilemiyor.

## 🔍 Neden Oluyor?

Email confirmation linkleri, kayıt sırasında aktif olan URL'yi kullanır. Eğer development'ta (localhost) kayıt olduysanız, link localhost içerir.

## ✅ Çözüm

### 1. Supabase Dashboard'da Redirect URL'leri Ayarlayın

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** > **URL Configuration** sayfasına gidin
3. **Site URL** ayarını kontrol edin:
   ```
   https://tacticiq.app
   ```
   (localhost değil, production URL'i olmalı)

4. **Redirect URLs** listesine şunları ekleyin:
   ```
   https://tacticiq.app/**
   http://localhost:5173/**
   http://localhost:5174/**
   http://localhost:5175/**
   ```

5. **Save** butonuna tıklayın

### 2. Email Template'leri Kontrol Edin

1. **Authentication** > **Email Templates** sayfasına gidin
2. **Confirm signup** template'ini açın
3. Redirect URL'nin doğru olduğundan emin olun

### 3. Yeni Email Gönderin (Gerekirse)

Eğer eski email link'i kullanıyorsanız:

1. Supabase Dashboard > **Authentication** > **Users**
2. Kullanıcıyı bulun
3. **Actions** > **Send confirmation email** butonuna tıklayın
4. Yeni email, güncel redirect URL ile gönderilecek

## 🔧 Alternatif Çözüm: Email Confirmation'ı Geçici Olarak Kapat

**Sadece test için:**

1. **Authentication** > **Settings** > **Email** sekmesine gidin
2. **Confirm email** toggle'ını **KAPAT** (eğer görünüyorsa)
3. Bu durumda kullanıcılar direkt giriş yapabilir

**⚠️ Production için email confirmation açık olmalı!**

## 📱 Mobil Erişim İçin

Email confirmation link'i telefon üzerinden açıldığında:

1. Link `https://tacticiq.app` içermeli (localhost değil)
2. Supabase otomatik olarak doğrulama yapar
3. Sonra `https://tacticiq.app` adresine yönlendirir

## 🧪 Test Etme

1. **Production URL'den** kayıt olun: `https://tacticiq.app`
2. Email'i kontrol edin
3. Link'e tıklayın (telefon veya bilgisayardan)
4. `https://tacticiq.app` adresine yönlendirilmelisiniz

## 🆘 Hala Çalışmıyorsa

1. Email confirmation link'inin tam halini kontrol edin
2. Link'te hangi URL var? (`localhost` mu, `tacticiq.app` mi?)
3. Supabase Dashboard > **Logs** > **Auth Logs** sayfasını kontrol edin
4. Redirect URL'lerin doğru eklendiğinden emin olun

## 📝 Notlar

- Email confirmation link'leri, **kayıt sırasındaki site URL'ini** kullanır
- Eğer `localhost:5173`'ten kayıt olduysanız, link localhost içerir
- Production'da her zaman `https://tacticiq.app` üzerinden kayıt olun
- Development için `localhost` redirect URL'leri de ekleyin (test için)
