# Email Confirmation Ayarını Bulma Rehberi

## 🔍 Email Confirmation Ayarı Nerede?

Supabase Dashboard'da Email confirmation ayarı genellikle şu konumlardan birinde olur:

### Yol 1: Authentication > Settings > Email

1. Sol menüden **Authentication** tıklayın
2. Üst menüden **Settings** (Ayarlar) sekmesine tıklayın
3. **Email** sekmesine tıklayın
4. "**Enable email signup**" altında veya **Email Templates** bölümünde olabilir

### Yol 2: Authentication > Settings > Auth Providers

1. **Authentication** > **Settings**
2. "**Auth Providers**" veya "**Email**" bölümünü bulun
3. "**Confirm email**" veya "**Email confirmation**" toggle'ını arayın

### Yol 3: Email Templates İçinde

Bazı Supabase versiyonlarında:
1. **Authentication** > **Settings** > **Email**
2. **Email Templates** sekmesine gidin
3. **Confirm signup** template'inin yanında bir toggle olabilir

## ⚠️ Eğer Email Confirmation Ayarı Görünmüyorsa

### Senaryo 1: Varsayılan Olarak Kapalı
- Email confirmation ayarı görünmüyorsa, varsayılan olarak **KAPALI** olabilir
- Bu durumda kullanıcılar direkt giriş yapabilir

### Senaryo 2: Artık Farklı Bir Yerde
Yeni Supabase versiyonlarında:
- Email confirmation ayarı kaldırılmış olabilir
- Veya "**Email Templates**" içinde kontrol edilebilir

### Senaryo 3: Database'de Kontrol Edin
Email confirmation, database seviyesinde de kontrol edilebilir:
```sql
-- Supabase SQL Editor'de çalıştırın
SELECT * FROM auth.config;
```

## ✅ Şu An Gördüğünüz Sayfa: Email Settings

Gördüğünüz sayfada:
- ✅ **Enable Email provider**: AÇIK (Email ile kayıt aktif)
- ✅ **Secure email change**: AÇIK
- ⚠️ **Secure password change**: KAPALI
- ⚠️ **Prevent use of leaked passwords**: KAPALI (Pro plan gerekli)

## 🎯 Email Confirmation Kontrolü

Eğer "Confirm email" toggle'ı yoksa:

1. **Varsayılan davranış kontrolü için:**
   - Web sitesinde email ile kayıt olun
   - Eğer **hemen giriş yapabiliyorsanız** → Email confirmation **KAPALI** ✅
   - Eğer "**email doğrulama linki gönderildi**" mesajı görüyorsanız → Email confirmation **AÇIK** ✅

2. **SMTP ayarları kontrolü:**
   - Email confirmation **AÇIK** ise, SMTP ayarları yapılandırılmalı
   - **Authentication** > **Settings** > **SMTP Settings** bölümüne bakın

## 🔧 Test Etmek İçin

1. Web sitesinde yeni bir email ile kayıt olun
2. Console'da veya sayfada ne mesaj görüyorsunuz?
   - ✅ "Hesabınız oluşturuldu" + direkt giriş → Confirmation KAPALI
   - 📧 "Email doğrulama linki gönderildi" → Confirmation AÇIK

## 📞 Destek

Eğer email confirmation ayarını bulamıyorsanız:

1. **Supabase Dashboard** > **Settings** > **API** sayfasına gidin
2. **Auth configuration** JSON'ını kontrol edin
3. Veya Supabase desteğine sorun: support@supabase.com

## 🎯 Mevcut Durum

Şu an email ile kayıt çalışıyor mu?
- ✅ Çalışıyorsa → Email confirmation muhtemelen KAPALI (varsayılan)
- ❌ Çalışmıyorsa → Email confirmation AÇIK ve SMTP yapılandırılmamış olabilir

**Öneri**: Test edin ve ne olduğunu bildirin, ona göre yönlendireyim!
