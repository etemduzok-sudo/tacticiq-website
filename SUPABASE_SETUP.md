# 🚀 Supabase Setup Guide - Fan Manager 2026

## 📋 Adımlar

### 1. **Supabase Hesabı Oluştur**
1. https://supabase.com adresine git
2. "Start your project" butonuna tıkla
3. GitHub ile giriş yap (veya email ile kayıt ol)

---

### 2. **Yeni Proje Oluştur**
1. Dashboard'da "New Project" butonuna tıkla
2. Proje bilgilerini gir:
   - **Name:** `fan-manager-2026`
   - **Database Password:** Güçlü bir şifre belirle (kaydet!)
   - **Region:** `Europe West (Frankfurt)` (Türkiye'ye en yakın)
   - **Pricing Plan:** `Free` (Başlangıç için yeterli)
3. "Create new project" butonuna tıkla
4. Proje kurulumu 2-3 dakika sürer, bekle

---

### 3. **Database Schema'yı Yükle**
1. Supabase Dashboard'da sol menüden **"SQL Editor"** sekmesine git
2. "+ New query" butonuna tıkla
3. `supabase/schema.sql` dosyasındaki **TÜM KODU** kopyala ve yapıştır
4. Sağ üstteki **"Run"** (▶️) butonuna tıkla
5. "Success" mesajı göreceksin

---

### 4. **API Keys'i Kopyala**
1. Sol menüden **"Settings" > "API"** sekmesine git
2. Aşağıdaki bilgileri kopyala:

   **a) Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **b) anon/public key:** (altında "anon" yazıyor)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

---

### 5. **Kodu Güncelle**
1. `src/config/supabase.ts` dosyasını aç
2. Aşağıdaki satırları kendi bilgilerinle değiştir:

```typescript
// ÖNCE:
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// SONRA:
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co'; // Kendi URL'in
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Kendi key'in
```

3. Dosyayı kaydet

---

### 6. **Row Level Security (RLS) Aktif Mi Kontrol Et**
1. Dashboard'da **"Authentication" > "Policies"** sekmesine git
2. Her tablo için policy'lerin aktif olduğunu görmelisin:
   - ✅ `users` - 2 policy (SELECT, UPDATE)
   - ✅ `predictions` - 4 policy (SELECT, INSERT, UPDATE, DELETE)
   - ✅ `squads` - 4 policy
   - ✅ `ratings` - 3 policy
   - ✅ `achievements` - 1 policy (SELECT)
   - ✅ `notifications` - 2 policy (SELECT, UPDATE)

Eğer policy'ler görünmüyorsa, `schema.sql` dosyasını tekrar çalıştır.

---

### 7. **Email Settings (Opsiyonel - Şifre Sıfırlama İçin)**
1. **"Authentication" > "Email Templates"** sekmesine git
2. "Reset Password" template'ini aç
3. Email gönderimi için SMTP ayarları yapabilirsin (veya Supabase'in default email'ini kullan)

---

### 8. **Test Et**
1. Uygulamayı başlat: `npm start` / `npx expo start`
2. Register ekranında yeni bir hesap oluştur
3. Login ekranında giriş yap
4. Eğer hata alırsan:
   - Console'da Supabase hata mesajlarını kontrol et
   - API URL ve Key'in doğru olduğunu kontrol et
   - Supabase Dashboard'da "Logs" sekmesinden hataları incele

---

## ✅ Kurulum Tamamlandı!

Artık uygulaman gerçek database ile çalışıyor:
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Tahminler database'e kaydediliyor
- ✅ Kadro seçimleri kaydediliyor
- ✅ Puanlama sistemi aktif
- ✅ Leaderboard real-time çalışıyor

---

## 🆘 Sorun Giderme

### "Invalid API key" Hatası
- API key'in doğru kopyalandığından emin ol (tamamını kopyala, kesme yok)
- `src/config/supabase.ts` dosyasındaki URL ve KEY'i kontrol et

### "User already registered" Hatası
- Email zaten kullanılıyor
- Farklı bir email dene veya Supabase Dashboard > Authentication > Users'dan silebilirsin

### "Failed to fetch" Hatası
- İnternet bağlantını kontrol et
- Supabase projesinin aktif olduğunu kontrol et (Dashboard'da proje adının yanında yeşil nokta)

### "Permission denied" Hatası
- Row Level Security (RLS) policy'leri doğru yüklenmemiş
- `schema.sql` dosyasını tekrar çalıştır

---

## 📊 Database Yapısı

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı profilleri (email, username, puan, rank) |
| `predictions` | Kullanıcı tahminleri (maç sonucu, skor, vs.) |
| `squads` | Seçilen kadrolar (formation, oyuncular) |
| `ratings` | Antrenör değerlendirmeleri |
| `achievements` | Kazanılan rozetler |
| `notifications` | Bildirimler |

---

**Son Güncelleme:** 7 Ocak 2026
