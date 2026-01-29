# Lineups Endpoint Test Rehberi

## 🎯 Yapılan Değişiklikler

### 1. **Lineups Endpoint Güncellendi** (`backend/routes/matches.js`)
- ✅ Lineups önce DB'den cache kontrol ediliyor
- ✅ Yoksa API-Football'dan çekiliyor
- ✅ Team colors `static_teams` tablosundan alınıyor
- ✅ Player rating hesaplanıyor (pozisyona göre)
- ✅ Lineups DB'ye cache'leniyor (`matches.lineups` JSONB)

### 2. **Frontend Güncellendi** (`src/components/match/MatchSquad.tsx`)
- ✅ Backend'den gelen enriched format destekleniyor
- ✅ Team colors artık player objelerinde mevcut

### 3. **Database Migration** (`supabase/008_add_lineups_column.sql`)
- ✅ `matches` tablosuna `lineups` JSONB kolonu eklendi

---

## 🚀 Test Adımları

### Adım 1: Supabase Migration Çalıştır

Supabase SQL Editor'de çalıştır:
```sql
-- Lineups kolonu ekle
ALTER TABLE matches ADD COLUMN IF NOT EXISTS lineups JSONB DEFAULT NULL;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_matches_lineups ON matches USING GIN (lineups);
```

### Adım 2: Static Teams Tablosunu Kontrol Et

```bash
cd backend
node scripts/test-lineups-endpoint.js 1451296
```

Eğer `static_teams` tablosu boşsa:
```bash
# Supabase SQL Editor'de çalıştır:
# File: supabase/005_static_teams.sql

# VEYA script ile:
node scripts/setup-static-teams-supabase.js
```

### Adım 3: Backend'i Başlat

```bash
cd backend
npm run dev
```

Backend `http://localhost:3000` adresinde çalışacak.

### Adım 4: Lineups Endpoint'ini Test Et

**Test Script ile:**
```bash
cd backend
node scripts/test-lineups-endpoint.js 1451296
```

**Manuel Test (curl):**
```bash
curl http://localhost:3000/api/matches/1451296/lineups
```

**Beklenen Response:**
```json
{
  "success": true,
  "data": [
    {
      "team": {
        "id": 611,
        "name": "Fenerbahce",
        "colors": {
          "primary": "#FFED00",
          "secondary": "#00205B",
          "all": ["#FFED00", "#00205B"]
        }
      },
      "formation": "4-3-3",
      "startXI": [
        {
          "id": 12345,
          "name": "Player Name",
          "number": 10,
          "position": "M",
          "rating": 82,
          "age": 28,
          "nationality": "Turkey"
        }
      ],
      "substitutes": [...],
      "coach": "Coach Name"
    }
  ],
  "cached": false,
  "source": "api"
}
```

---

## ✅ Kontrol Listesi

- [ ] Supabase migration çalıştırıldı (`008_add_lineups_column.sql`)
- [ ] `static_teams` tablosu dolu (en azından test edilecek takımlar)
- [ ] Backend çalışıyor (`http://localhost:3000/health`)
- [ ] Lineups endpoint test edildi
- [ ] Frontend'de team colors görünüyor
- [ ] Player ratings görünüyor

---

## 🔍 Sorun Giderme

### Problem: `static_teams` tablosu boş
**Çözüm:**
```bash
# Supabase SQL Editor'de:
# File: supabase/005_static_teams.sql çalıştır
```

### Problem: Backend başlamıyor
**Çözüm:**
```bash
cd backend
npm install
# .env dosyasını kontrol et
npm run dev
```

### Problem: Lineups cache'lenmiyor
**Çözüm:**
- `matches` tablosunda `lineups` kolonu var mı kontrol et
- Supabase bağlantısı çalışıyor mu kontrol et
- Backend loglarını kontrol et

### Problem: Team colors gelmiyor
**Çözüm:**
- `static_teams` tablosunda takım var mı kontrol et
- `api_football_id` eşleşiyor mu kontrol et
- Backend loglarında hata var mı kontrol et

---

## 📊 Veri Akışı

```
1. Frontend: GET /api/matches/:id/lineups
   ↓
2. Backend: DB'den cache kontrol
   ↓ (cache yoksa)
3. Backend: API-Football'dan lineups çek
   ↓
4. Backend: static_teams'den team colors al
   ↓
5. Backend: Player rating hesapla
   ↓
6. Backend: DB'ye cache'le
   ↓
7. Backend: Enriched data döndür
   ↓
8. Frontend: Team colors ve player data göster
```

---

## 🎨 Team Colors Format

Backend'den gelen format:
```json
{
  "team": {
    "colors": {
      "primary": "#FFED00",      // Ana renk
      "secondary": "#00205B",     // İkincil renk
      "all": ["#FFED00", "#00205B"] // Tüm renkler
    }
  }
}
```

Frontend'de kullanım:
```typescript
const teamColors = player.teamColors;
// teamColors.primary -> "#FFED00"
// teamColors.secondary -> "#00205B"
```

---

## 📝 Notlar

- Lineups ilk çağrıda API'den çekilir ve DB'ye cache'lenir
- Sonraki çağrılarda DB'den döner (hızlı)
- Team colors `static_teams` tablosundan alınır
- Player rating pozisyona göre hesaplanır (basit algoritma)
- Gerçek rating API-Football'dan gelmez (PRO plan gerekli)
