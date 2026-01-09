# 🚀 Supabase Database Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1️⃣ **Supabase Hesabı Oluştur**

1. https://supabase.com adresine git
2. **"Start your project"** butonuna tıkla
3. **GitHub** ile giriş yap (veya email ile kayıt ol)

---

### 2️⃣ **Yeni Proje Oluştur**

1. Dashboard'da **"New Project"** butonuna tıkla
2. Proje bilgilerini gir:
   - **Name:** `fan-manager-2026`
   - **Database Password:** Güçlü bir şifre belirle (**KAYDET!** 📝)
   - **Region:** `Europe West (Frankfurt)` (Türkiye'ye en yakın 🇹🇷)
   - **Pricing Plan:** `Free` (Başlangıç için yeterli ✅)
3. **"Create new project"** butonuna tıkla
4. Proje kurulumu **2-3 dakika** sürer, bekle ⏳

---

### 3️⃣ **Database Schema'larını Yükle**

#### **A) Ana Schema (Users, Predictions, vb.)**

1. Supabase Dashboard'da sol menüden **"SQL Editor"** sekmesine git
2. **"+ New query"** butonuna tıkla
3. `supabase/schema.sql` dosyasındaki **TÜM KODU** kopyala ve yapıştır
4. Sağ üstteki **"Run"** (▶️) butonuna tıkla
5. ✅ **"Success. No rows returned"** mesajı göreceksin

#### **B) Matches Schema (Maçlar, Takımlar, vb.)**

1. **"+ New query"** ile yeni bir sorgu aç
2. `supabase/schema_matches.sql` dosyasındaki **TÜM KODU** kopyala ve yapıştır
3. **"Run"** (▶️) butonuna tıkla
4. ✅ **"Success"** mesajı göreceksin

---

### 4️⃣ **API Keys'i Kopyala**

1. Sol menüden **"Settings" > "API"** sekmesine git
2. Aşağıdaki bilgileri kopyala:

   **a) Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   *(Bu sizin benzersiz URL'iniz)*

   **b) service_role key:** (altında "service_role" yazıyor, **secret** olarak işaretli)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```
   ⚠️ **DİKKAT:** `anon` key değil, **`service_role`** key'i kopyalayın!

---

### 5️⃣ **Backend .env Dosyasını Güncelle**

1. `backend/.env` dosyasını aç (yoksa `backend/env.template`'i kopyala)
2. Aşağıdaki satırları **kendi bilgilerinle** değiştir:

```bash
# ======================
# SUPABASE (Database)
# ======================
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Dosyayı **kaydet** 💾

---

### 6️⃣ **Backend'i Yeniden Başlat**

1. Mevcut backend process'ini **durdur** (Ctrl+C)
2. Backend'i yeniden başlat:

```bash
cd backend
npm run dev
```

3. Şu mesajları göreceksin:
```
🚀 Fan Manager Backend running on port 3000
💾 Database service enabled
```

✅ Eğer **"Database service disabled"** yazıyorsa, `.env` dosyasındaki Supabase bilgilerini kontrol et!

---

### 7️⃣ **Test Et**

#### **A) Health Check**

Tarayıcıda aç:
```
http://localhost:3000/health
```

Şunu göreceksin:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "message": "Supabase connection successful"
  }
}
```

#### **B) Maç Verilerini Çek ve Database'e Kaydet**

1. Uygulamayı web'de aç: `http://localhost:8083`
2. Favori takımını seç (örn: Fenerbahçe)
3. **Maçlar** sekmesine git
4. Backend console'da şu mesajları göreceksin:

```
📡 API Request #1/7400: /fixtures
💾 Synced match to DB: Fenerbahçe vs Galatasaray
💾 Synced 5/5 matches to database
```

#### **C) Supabase Dashboard'da Kontrol Et**

1. Supabase Dashboard > **"Table Editor"** sekmesine git
2. Sol menüden **`matches`** tablosunu seç
3. ✅ Maçların kaydedildiğini göreceksin!

---

## 📊 Database Yapısı

### **Maç Verileri Tabloları**

| Tablo | Açıklama | Kayıt Sayısı (Tahmini) |
|-------|----------|------------------------|
| `leagues` | Ligler (Premier League, La Liga, vb.) | ~50 |
| `teams` | Takımlar (Fenerbahçe, Barcelona, vb.) | ~500 |
| `matches` | Maçlar (geçmiş, canlı, gelecek) | ~10,000+ |
| `players` | Oyuncular | ~5,000+ |
| `match_players` | Maç kadroları | ~200,000+ |

### **Kullanıcı Verileri Tabloları**

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı profilleri (email, username, puan, rank) |
| `predictions` | Kullanıcı tahminleri (maç sonucu, skor, vs.) |
| `squads` | Seçilen kadrolar (formation, oyuncular) |
| `ratings` | Antrenör değerlendirmeleri |
| `achievements` | Kazanılan rozetler |
| `notifications` | Bildirimler |

---

## 🔄 Veri Akışı

```
API-Football.com (Gerçek Veri)
        ↓
Backend API (Express.js)
        ↓
    ┌───┴───┐
    ↓       ↓
Memory    Supabase
Cache     Database
    ↓       ↓
Frontend (React Native)
```

### **Avantajlar:**

✅ **Hızlı:** Memory cache sayesinde API limiti korunur
✅ **Kalıcı:** Database'de maç geçmişi saklanır
✅ **Offline:** Database'den veri okunabilir
✅ **Realtime:** Supabase Realtime ile canlı güncellemeler

---

## 🆘 Sorun Giderme

### ❌ "Supabase not configured" Hatası

**Sebep:** `.env` dosyasında Supabase bilgileri eksik

**Çözüm:**
1. `backend/.env` dosyasını aç
2. `SUPABASE_URL` ve `SUPABASE_SERVICE_KEY` değerlerini kontrol et
3. Backend'i yeniden başlat

---

### ❌ "Invalid API key" Hatası

**Sebep:** Yanlış API key kopyalandı

**Çözüm:**
1. Supabase Dashboard > Settings > API
2. **`service_role`** key'i kopyala (`anon` değil!)
3. `.env` dosyasına yapıştır
4. Backend'i yeniden başlat

---

### ❌ "Permission denied" Hatası

**Sebep:** Row Level Security (RLS) policy'leri yanlış

**Çözüm:**
1. Supabase Dashboard > SQL Editor
2. `schema_matches.sql` dosyasını **tekrar çalıştır**
3. **"Public can view matches"** policy'sinin aktif olduğunu kontrol et

---

### ❌ "Failed to fetch" Hatası

**Sebep:** İnternet bağlantısı veya Supabase projesi kapalı

**Çözüm:**
1. İnternet bağlantını kontrol et
2. Supabase Dashboard'da proje adının yanında **yeşil nokta** olmalı
3. Eğer kırmızı ise, projeyi "Resume" et

---

## 📈 İleri Seviye Özellikler

### **1. Realtime Subscriptions**

Canlı maç güncellemelerini dinle:

```javascript
const { supabase } = require('./config/supabase');

supabase
  .channel('matches')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'matches' },
    (payload) => {
      console.log('Match updated:', payload.new);
    }
  )
  .subscribe();
```

### **2. Scheduled Jobs (Cron)**

Supabase'de otomatik veri senkronizasyonu:

1. Dashboard > Database > Extensions
2. **"pg_cron"** extension'ını aktifleştir
3. SQL Editor'da:

```sql
SELECT cron.schedule(
  'sync-live-matches',
  '*/5 * * * *', -- Her 5 dakikada bir
  $$
  -- API'den veri çek ve kaydet
  $$
);
```

### **3. Database Backups**

Supabase otomatik backup yapar:
- **Free Plan:** 7 gün
- **Pro Plan:** 30 gün

Manuel backup:
1. Dashboard > Settings > Database
2. **"Download backup"** butonuna tıkla

---

## ✅ Kurulum Tamamlandı!

Artık uygulamanız **gerçek database** ile çalışıyor:

- ✅ API'den gelen maçlar database'e kaydediliyor
- ✅ Geçmiş maçlar saklanıyor
- ✅ Kullanıcı tahminleri database'de
- ✅ Leaderboard real-time çalışıyor
- ✅ Offline mod hazır

---

**Son Güncelleme:** 8 Ocak 2026
**Yazar:** Fan Manager 2026 Team
