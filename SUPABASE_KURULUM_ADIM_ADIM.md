# 🚀 SUPABASE KURULUM - ADIM ADIM REHBERİ

**Süre:** ~10 dakika  
**Zorluk:** Kolay  
**Gereksinimler:** Supabase hesabı

---

## 📋 ADIM 1: SUPABASE DASHBOARD'A GİRİN

1. Tarayıcınızda açın: **https://supabase.com/dashboard**
2. Giriş yapın (yoksa ücretsiz hesap oluşturun)
3. Projenizi seçin (yoksa yeni proje oluşturun)

### Yeni Proje Oluşturma (İhtiyaç Halinde)
- **Organization:** Kendi organizasyonunuz
- **Name:** `fan-manager-2026`
- **Database Password:** Güçlü bir şifre (kaydedin!)
- **Region:** Europe West (Frankfurt) - En yakın bölge
- **Pricing Plan:** Free (başlangıç için yeterli)

---

## 📋 ADIM 2: SQL EDITOR'Ü AÇIN

1. Sol menüden **SQL Editor** sekmesine tıklayın
2. Sağ üstten **New Query** butonuna tıklayın
3. Boş bir SQL editör açılacak

---

## 📋 ADIM 3: SCHEMA SQL'İNİ ÇALIŞTIRIN

### 3.1. SQL Dosyasını Açın

Cursor'da `supabase/001_predictions_schema.sql` dosyasını açın

### 3.2. Tüm İçeriği Kopyalayın

- `Ctrl+A` (tümünü seç)
- `Ctrl+C` (kopyala)

### 3.3. Supabase'e Yapıştırın

- Supabase SQL Editor'a geri dönün
- `Ctrl+V` (yapıştır)
- SQL editörde ~280 satır kod görmelisiniz

### 3.4. Çalıştırın

- Sağ alttaki **RUN** butonuna tıklayın (veya `Ctrl+Enter`)
- ⏳ Birkaç saniye bekleyin...

### 3.5. Sonucu Kontrol Edin

Aşağıdaki mesajı görmelisiniz:

```
✅ Predictions schema created successfully!
```

**Eğer hata alırsanız:**
- `users` tablosu yoksa önce onu oluşturun (aşağıda)
- `user_stats` tablosu yoksa önce onu oluşturun (aşağıda)

---

## 📋 ADIM 4: HELPER FUNCTIONS SQL'İNİ ÇALIŞTIRIN

### 4.1. Yeni Query Açın

- SQL Editor'da **New Query** butonuna tekrar tıklayın
- Yeni boş bir editör açılacak

### 4.2. SQL Dosyasını Açın

Cursor'da `supabase/002_helper_functions.sql` dosyasını açın

### 4.3. Tüm İçeriği Kopyalayın

- `Ctrl+A` (tümünü seç)
- `Ctrl+C` (kopyala)

### 4.4. Supabase'e Yapıştırın

- Supabase SQL Editor'a geri dönün
- `Ctrl+V` (yapıştır)
- SQL editörde ~160 satır kod görmelisiniz

### 4.5. Çalıştırın

- **RUN** butonuna tıklayın (veya `Ctrl+Enter`)
- ⏳ Birkaç saniye bekleyin...

### 4.6. Sonucu Kontrol Edin

Aşağıdaki mesajı görmelisiniz:

```
✅ Helper functions created successfully!
```

---

## 📋 ADIM 5: TABLOLARI DOĞRULAYIN

### 5.1. Table Editor'ü Açın

- Sol menüden **Table Editor** sekmesine tıklayın

### 5.2. Tabloları Kontrol Edin

Aşağıdaki tabloları görmelisiniz:

- ✅ `predictions` - Kullanıcı tahminleri
- ✅ `match_results` - Maç sonuçları
- ✅ `prediction_scores` - Puan kayıtları
- ✅ `user_stats` - Kullanıcı istatistikleri (güncellenmiş)

### 5.3. Predictions Tablosunu İnceleyin

`predictions` tablosuna tıklayın ve kolonları görün:

- `id` (UUID)
- `user_id` (UUID)
- `match_id` (INTEGER)
- `home_score` (INTEGER)
- `away_score` (INTEGER)
- `first_goal` (VARCHAR)
- `total_goals` (VARCHAR)
- `yellow_cards` (INTEGER)
- `red_cards` (INTEGER)
- `corners` (INTEGER)
- `focused_predictions` (JSONB)
- `training_type` (VARCHAR)
- `training_multiplier` (DECIMAL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## 📋 ADIM 6: API KEYS'LERİ ALIN

### 6.1. Settings'e Gidin

- Sol menüden **Settings** → **API** sekmesine tıklayın

### 6.2. URL'yi Kopyalayın

**Project URL** altında:
```
https://xxxxxxxxxxxxxx.supabase.co
```

Bu URL'yi kopyalayın ve bir yere kaydedin.

### 6.3. Service Role Key'i Kopyalayın

**Project API keys** altında:

- `anon` `public` - Bu DEĞİL!
- `service_role` `secret` - **BU!** ✅

`service_role` key'in yanındaki **Copy** butonuna tıklayın.

⚠️ **ÖNEMLİ:** Bu key'i kimseyle paylaşmayın! Backend'de kullanılacak.

---

## 📋 ADIM 7: ENVIRONMENT VARIABLES OLUŞTURUN

### 7.1. Backend .env Dosyası Oluşturun

Cursor'da `backend/.env` dosyası oluşturun:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API-Football (Opsiyonel)
API_FOOTBALL_KEY=your-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 7.2. Değerleri Doldurun

- `SUPABASE_URL`: Adım 6.2'de kopyaladığınız URL
- `SUPABASE_SERVICE_KEY`: Adım 6.3'te kopyaladığınız key

### 7.3. API-Football Key (Opsiyonel)

Eğer gerçek maç verisi çekmek istiyorsanız:

1. https://www.api-football.com/ adresine gidin
2. Ücretsiz hesap oluşturun (100 istek/gün)
3. Dashboard'dan API key'inizi alın
4. `.env` dosyasına ekleyin

---

## 📋 ADIM 8: BACKEND'İ YENİDEN BAŞLATIN

### 8.1. Backend'i Durdurun

Terminal'de backend çalışıyorsa:
- `Ctrl+C` ile durdurun

### 8.2. Backend'i Başlatın

```powershell
cd backend
npm run dev
```

### 8.3. Logları Kontrol Edin

Şu mesajları görmelisiniz:

```
💾 Database service enabled
🚀 Fan Manager Backend running on port 3000
📊 Health check: http://localhost:3000/health
🚀 Starting live match polling (interval: 10000ms)
```

---

## 📋 ADIM 9: API'LERİ TEST EDİN

### 9.1. Test Script'ini Çalıştırın

Yeni bir terminal açın:

```powershell
powershell -ExecutionPolicy Bypass -File backend/test-backend.ps1
```

### 9.2. Sonuçları Kontrol Edin

Tüm testler ✅ olmalı:

```
✅ Health Check: OK
✅ Prediction Created: OK
✅ User Predictions: OK
✅ Live Matches: OK
✅ Score Calculated: OK
✅ Leaderboard: OK
```

---

## 🎉 TAMAMLANDI!

Backend ve database tamamen hazır! 🚀

### Artık Yapabilecekleriniz:

1. ✅ Kullanıcılar tahmin yapabilir
2. ✅ Puanlar otomatik hesaplanır
3. ✅ Lider tablosu çalışır
4. ✅ Canlı maçlar takip edilir
5. ✅ İstatistikler güncellenir

---

## 🔧 SORUN GİDERME

### Hata: "users" tablosu bulunamadı

**Çözüm:** Users tablosunu oluşturun:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar VARCHAR(500),
  is_pro BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Hata: "user_stats" tablosu bulunamadı

**Çözüm:** User stats tablosunu oluşturun:

```sql
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Hata: RLS policy zaten var

**Çözüm:** Normal, ignore edin. SQL'de `CREATE POLICY` yerine `CREATE OR REPLACE POLICY` kullanın.

### Hata: Backend'e bağlanamıyor

**Çözüm:**
1. Backend çalışıyor mu? `npm run dev`
2. `.env` dosyası var mı?
3. Port 3000 açık mı?

### Hata: Supabase bağlantı hatası

**Çözüm:**
1. `SUPABASE_URL` doğru mu?
2. `SUPABASE_SERVICE_KEY` doğru mu?
3. Internet bağlantınız var mı?

---

## 📞 YARDIM

Hala sorun mu yaşıyorsunuz?

1. Backend loglarını kontrol edin
2. Supabase Dashboard → Logs sekmesine bakın
3. Browser console'u kontrol edin
4. Bana hata mesajını gönderin!

---

## 📚 SONRAKI ADIMLAR

1. ✅ **Database kuruldu** (bu adım)
2. ⏳ **Frontend entegrasyonu** (bir sonraki)
3. ⏳ **UI/UX iyileştirmeleri**
4. ⏳ **Real-time features**

---

**Hazırlayan:** Cursor AI  
**Proje:** Fan Manager 2026  
**Tarih:** 9 Ocak 2026

**Başarılar! 🎉**
