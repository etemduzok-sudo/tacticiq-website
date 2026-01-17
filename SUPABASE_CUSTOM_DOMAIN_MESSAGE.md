# Supabase OAuth Redirect Mesajını Özelleştirme

## 🎯 Sorun

OAuth giriş sırasında Supabase redirect sayfasında şu mesaj görünüyor:
> "jxdgiskusjljlpzvrzau.supabase.co hesabında tekrar oturum açıyorsunuz"

Bu mesajı şu şekilde özelleştirmek istiyoruz:
> "TacticIQ.app'de oturum açıyorsunuz"

## ✅ Çözüm: Supabase Dashboard Ayarları

### 1. Supabase Dashboard'a Giriş Yapın
- [https://app.supabase.com](https://app.supabase.com)
- Projenizi seçin: `jxdgiskusjljlpzvrzau`

### 2. Authentication Settings'e Gidin
1. Sol menüden **"Authentication"** tıklayın
2. Üst menüden **"Settings"** (Ayarlar) sekmesine tıklayın
3. **"URL Configuration"** bölümünü bulun

### 3. Site URL ve Site Name Ayarlarını Güncelleyin

**Site URL:**
```
https://tacticiq.app
```

**Site Name (İsteğe bağlı ama önerilir):**
```
TacticIQ.app
```

**Redirect URLs (Mevcut ayarlar korunmalı):**
- `https://tacticiq.app/**`
- `http://localhost:5173/**`
- `http://localhost:5174/**`
- `http://localhost:5175/**`

### 4. Kaydet ve Test Et
1. **"Save"** butonuna tıklayın
2. Google/Apple ile giriş yapmayı deneyin
3. Redirect sayfasında "TacticIQ.app'de oturum açıyorsunuz" mesajı görünmeli

## 📝 Notlar

- **Site URL**: OAuth redirect'lerin döneceği ana URL
- **Site Name**: OAuth sayfasında gösterilen isim (bazı durumlarda)
- Bu ayarlar tüm OAuth provider'ları (Google, Apple) için geçerlidir

## 🔍 Alternatif: Custom Domain Kullanımı (İleri Seviye)

Eğer mesaj hala değişmiyorsa, Supabase'nin custom domain özelliğini kullanabilirsiniz:

1. Supabase Dashboard → **Project Settings** → **Custom Domains**
2. `auth.tacticiq.app` gibi bir subdomain ekleyin
3. DNS ayarlarını yapın (CNAME kaydı)
4. OAuth redirect URL'lerini custom domain'e güncelleyin

Bu işlem daha karmaşık olduğu için, önce yukarıdaki "Site URL" ve "Site Name" ayarlarını deneyin.
