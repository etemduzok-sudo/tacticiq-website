# OAuth Redirect URL Hatası Düzeltme

## 🔴 Hata
```
ERR_CONNECTION_REFUSED
localhost:3000 bağlanmayı reddetti
```

## 🔍 Sorun
OAuth callback'i yanlış bir URL'ye (`localhost:3000`) yönleniyor. Bu, Supabase'deki Redirect URL ayarlarından kaynaklanıyor olabilir.

## ✅ Çözüm

### 1. Supabase Dashboard'da Redirect URL Kontrolü

1. [Supabase Dashboard](https://app.supabase.com) → Projeniz
2. **Authentication** > **URL Configuration** sayfasına gidin
3. **Site URL** kontrol edin:
   ```
   https://tacticiq.app
   ```
   veya development için:
   ```
   http://localhost:5173
   ```

4. **Redirect URLs** listesini kontrol edin ve şunları ekleyin:
   ```
   http://localhost:5173/**
   http://localhost:5174/**
   http://localhost:5175/**
   https://tacticiq.app/**
   ```
   
   ⚠️ **ÖNEMLİ**: Her URL'nin sonunda `/**` olmalı (wildcard için)

5. **Save** butonuna tıklayın

### 2. Google Cloud Console'da Redirect URI Kontrolü

1. [Google Cloud Console](https://console.cloud.google.com) → Projeniz
2. **APIs & Services** > **Credentials** > OAuth client'ınızı açın
3. **Authorized redirect URIs** listesini kontrol edin:
   - ✅ Supabase callback URL olmalı: `https://jxdgiskusjljlpzvrzau.supabase.co/auth/v1/callback`
   - ❌ `localhost:3000` gibi yanlış URL'ler olmamalı

4. Yanlış URL'ler varsa **silin**
5. Doğru URL'ler varsa **değiştirmeyin** (Supabase kendi callback URL'ini kullanır)

### 3. Kod Tarafında Kontrol

Kodda redirect URL otomatik olarak `window.location.origin` kullanıyor, bu doğru. Ancak test etmek için:

1. Dev server'ın hangi port'ta çalıştığını kontrol edin
2. Browser console'da şunu kontrol edin:
   ```javascript
   console.log(window.location.origin);
   ```
   Bu, `http://localhost:5173` gibi bir değer göstermeli

### 4. Test Etme

1. Dev server'ın çalıştığından emin olun:
   ```bash
   npm run dev
   ```

2. Hangi port'ta çalıştığını not edin (örn: `http://localhost:5173`)

3. Browser'da o portta açık olduğundan emin olun

4. Google ile giriş deneyin

5. Callback URL'ini kontrol edin - `localhost:3000` değil, çalışan port (5173, 5174, vb.) olmalı

## 🔧 Supabase Redirect URL Ayarı Detayları

Supabase'de **Redirect URLs** alanına eklediğiniz URL'ler:
- Wildcard (`/**`) ile eşleşir
- Development ve production için farklı URL'ler ekleyebilirsiniz
- Örnek format: `http://localhost:5173/**`

**Doğru Format:**
```
http://localhost:5173/**
http://localhost:5174/**
http://localhost:5175/**
https://tacticiq.app/**
```

**Yanlış Format:**
```
http://localhost:3000  (sonunda /** yok)
localhost:5173/**     (http:// eksik)
```

## 📝 Checklist

- [ ] Supabase > Authentication > URL Configuration > Redirect URLs'e development URL'ler eklendi mi?
- [ ] Redirect URL'ler `/**` ile bitiyor mu?
- [ ] Dev server çalışıyor mu?
- [ ] Dev server'ın port'u Supabase Redirect URLs'de var mı?
- [ ] Google Cloud Console'daki redirect URI sadece Supabase callback URL'i içeriyor mu?
- [ ] Browser'da doğru port'ta açık mı?

## 🆘 Hala Çalışmıyorsa

1. **Supabase Logs'u kontrol edin:**
   - Dashboard > Logs > Authentication
   - Google OAuth denemelerinde ne hatası var?

2. **Browser Console'u kontrol edin:**
   - F12 > Console
   - OAuth ile ilgili hata mesajlarını inceleyin

3. **Network sekmesini kontrol edin:**
   - F12 > Network
   - OAuth isteklerini inceleyin
   - Callback URL'ini kontrol edin

4. **Tüm cache'i temizleyin:**
   - Ctrl+Shift+Delete
   - "Cached images and files" seçin
   - Temizleyin ve tekrar deneyin
