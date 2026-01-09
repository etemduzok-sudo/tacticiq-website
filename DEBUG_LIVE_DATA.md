# 🔍 Canlı Veri Debug Rehberi

## 📊 Durum

- ✅ **Backend çalışıyor** (port 3000)
- ✅ **Frontend çalışıyor** (port 8081)
- ✅ **SmartSync aktif** (maçlar DB'ye kaydediliyor)
- ❓ **Frontend veri alamıyor** (kullanıcı: "henüz veri yok diyor")

---

## 🧪 Debug Adımları

### 1. **Web Console'u Aç** (F12)

```
1. Maça tıkla (CR Belouizdad vs JS Kabylie)
2. Canlı sekmesine geç
3. Console'da şu log'ları ara:
```

#### Beklenen Log'lar:

```javascript
// ✅ Component mount
📊 MatchLive render: {matchId: "1234", events: [...]}

// ✅ API call başlatıldı
🔄 Fetching live data for match: 1234

// ✅ API response
📥 Raw events from API: [...]
📥 Raw stats from API: {...}

// ✅ Transform success
✅ Live events loaded: 15
✅ Live stats loaded

// ❌ Eğer bu log'lar yoksa:
⚠️ No events from API - empty array
❌ Events API failed: Error...
```

---

### 2. **Network Tab Kontrol**

```
1. F12 → Network tab
2. Maça tıkla → Canlı sekmesi
3. Şu API call'ları ara:
```

#### Beklenen API Calls:

```
GET http://localhost:3000/api/matches/{matchId}/events
GET http://localhost:3000/api/matches/{matchId}/statistics
GET http://localhost:3000/api/matches/{matchId}/lineups
```

#### Kontrol Et:

- **Status Code:** 200 OK mi?
- **Response:** Boş array mı yoksa data var mı?
- **Error:** 404, 500, CORS hatası var mı?

---

### 3. **Backend API Test**

Terminal'de direkt API'yi test et:

```powershell
# Events endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/matches/1234/events" | Select-Object -ExpandProperty Content

# Statistics endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/matches/1234/statistics" | Select-Object -ExpandProperty Content

# Lineups endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/matches/1234/lineups" | Select-Object -ExpandProperty Content
```

#### Beklenen Response:

```json
// Events
{
  "data": [
    {
      "time": { "elapsed": 67 },
      "type": "Goal",
      "team": { "id": 123, "name": "CR Belouizdad" },
      "player": { "name": "Icardi" },
      "detail": "Normal Goal",
      "comments": null
    }
  ]
}

// Statistics
{
  "data": [
    {
      "team": { "id": 123, "name": "CR Belouizdad" },
      "statistics": [
        { "type": "Shots on Goal", "value": 5 },
        { "type": "Ball Possession", "value": "55%" }
      ]
    }
  ]
}
```

---

### 4. **Supabase DB Kontrol**

Maç DB'de var mı?

```sql
-- Supabase Dashboard → SQL Editor
SELECT 
  id, 
  home_team_name, 
  away_team_name, 
  status, 
  fixture_date
FROM matches
WHERE id = 1234;
```

#### Beklenen Sonuç:

```
id   | home_team_name  | away_team_name | status | fixture_date
-----|-----------------|----------------|--------|-------------
1234 | CR Belouizdad   | JS Kabylie     | 1H     | 2026-01-09
```

---

## 🔴 Olası Sorunlar & Çözümler

### Problem 1: **API 404 - Match Not Found**

```
❌ GET /api/matches/1234/events → 404
```

**Sebep:** Match ID yanlış veya DB'de yok

**Çözüm:**
1. Console'da `matchId` log'una bak
2. Doğru ID'yi kullandığından emin ol
3. DB'de match var mı kontrol et

---

### Problem 2: **API 200 ama Boş Array**

```
✅ GET /api/matches/1234/events → 200
📦 Response: { "data": [] }
```

**Sebep:** Maç başladı ama henüz event yok (gerçekten)

**Çözüm:**
- Normal! Maç başladığında ilk 5-10 dakika event olmayabilir
- "Henüz canlı event yok" mesajı doğru

---

### Problem 3: **CORS Error**

```
❌ Access to fetch at 'http://localhost:3000' from origin 'http://localhost:8081' has been blocked by CORS policy
```

**Sebep:** Backend CORS ayarı yanlış

**Çözüm:**

```javascript
// backend/server.js
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006'],
  credentials: true
}));
```

---

### Problem 4: **API-Football 403**

```
❌ API Error: Request failed with status code 403
```

**Sebep:** API key yanlış veya limit aşıldı

**Çözüm:**
1. `backend/.env` dosyasında API key kontrol et
2. https://dashboard.api-football.com → Günlük limit kontrol et
3. Limit aşıldıysa yarın tekrar dene

---

### Problem 5: **Frontend API Import Hatası**

```
❌ TypeError: api.getMatchEvents is not a function
```

**Sebep:** API import yanlış

**Çözüm:**

```typescript
// ❌ WRONG
import matchesApi from '../../services/matchesApi';

// ✅ CORRECT
import api from '../../services/api';

// Usage
const events = await api.getMatchEvents(matchId);
```

---

## 🎯 Hızlı Test

### Test 1: Backend Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health"
```

**Beklenen:** `{"status":"ok","timestamp":"..."}`

---

### Test 2: Live Matches

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/matches/live" | ConvertFrom-Json
```

**Beklenen:** Canlı maçların listesi

---

### Test 3: Specific Match

```powershell
# CR Belouizdad vs JS Kabylie match ID'sini bul
Invoke-WebRequest -Uri "http://localhost:3000/api/matches/date/2026-01-09" | ConvertFrom-Json | Select-Object -ExpandProperty data | Where-Object { $_.home_team_name -like "*Belouizdad*" }
```

**Beklenen:** Match ID ve detaylar

---

## 📝 Kullanıcıya Sorulacak Sorular

1. **Console'da hangi log'ları görüyorsun?**
   - `📊 MatchLive render` var mı?
   - `🔄 Fetching live data` var mı?
   - `❌ Error` var mı?

2. **Network tab'da API call'lar başarılı mı?**
   - Status code: 200, 404, 500?
   - Response: Boş array mı, data var mı?

3. **Hangi maça tıkladın?**
   - Match ID nedir?
   - Maç gerçekten canlı mı? (19:00'da başladı mı?)

4. **"Henüz veri yok" mesajı nerede görünüyor?**
   - Canlı sekmesinde mi?
   - Tüm sekmeler mi boş?

---

## 🚀 Sonraki Adımlar

1. **Console log'larını paylaş**
2. **Network tab screenshot'u paylaş**
3. **Match ID'yi paylaş**
4. **Backend terminal log'unu kontrol et** (events sync oluyor mu?)

---

**Debug Date:** 9 Ocak 2026  
**Status:** 🔍 Investigating  
**Backend:** ✅ Running  
**Frontend:** ✅ Running  
**Issue:** ❓ Frontend not receiving live data  
