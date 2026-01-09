# 🚀 Backend Kurulum Rehberi

Fan Manager 2026 Backend API'yi kurmak için adım adım rehber.

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- API-Football API Key

---

## ⚡ Hızlı Kurulum (5 Dakika)

### 1️⃣ API Key Alma

1. [API-Football.com](https://www.api-football.com/) adresine git
2. **"Sign Up"** ile ücretsiz hesap oluştur
3. Email doğrula
4. Dashboard'a gir
5. **"My Account"** → **"API Key"** bölümünden key'ini kopyala

**Ücretsiz Plan:**
- ✅ 100 istek/gün
- ✅ Tüm endpoint'ler
- ✅ Kredi kartı gerektirmez

**Pro Plan** (Opsiyonel):
- ✅ 7400 istek/gün
- ✅ Daha hızlı cache
- ✅ Öncelikli destek

### 2️⃣ Backend Kurulumu

```bash
# Backend klasörüne git
cd backend

# Dependencies yükle
npm install

# .env dosyası oluştur
copy .env.example .env
```

### 3️⃣ API Key Ekle

`.env` dosyasını aç ve API key'ini ekle:

```env
PORT=3000
NODE_ENV=development
FOOTBALL_API_KEY=buraya_api_keyini_yapistir
MAX_DAILY_REQUESTS=7400
```

### 4️⃣ Backend'i Başlat

**Windows:**
```bash
npm run dev
```

**veya batch dosyasıyla:**
```bash
start-backend.bat
```

Backend şu adreste çalışacak:
```
http://localhost:3000
```

### 5️⃣ Test Et

Tarayıcıda aç:
```
http://localhost:3000/health
```

Görmek istediğin:
```json
{
  "status": "ok",
  "timestamp": "2026-01-07...",
  "uptime": 5.123
}
```

---

## 🧪 API Test Etme

### Canlı Maçlar
```
http://localhost:3000/api/matches/live
```

### Bugünün Maçları
```
http://localhost:3000/api/matches/date/2026-01-07
```

### Süper Lig Puan Durumu
```
http://localhost:3000/api/leagues/203/standings?season=2024
```

### Galatasaray Bilgisi
```
http://localhost:3000/api/teams/548
```

---

## 📱 React Native Bağlantısı

### Development (Emulator/Simulator)

Backend otomatik localhost'tan bağlanır:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3000/api';
```

### Fiziksel Cihaz (USB Debug)

Backend'i bilgisayarının IP adresine değiştir:

```typescript
const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
```

IP adresini bulmak için:
```bash
# Windows
ipconfig

# Wireless LAN adapter Wi-Fi:
# IPv4 Address: 192.168.1.XXX
```

---

## 🎯 Kullanım Örnekleri

### React Native'de API Kullanımı

```typescript
import api from './src/services/api';

// Canlı maçları getir
const getLiveMatches = async () => {
  try {
    const response = await api.matches.getLiveMatches();
    console.log(response.data); // Maç listesi
  } catch (error) {
    console.error('Error:', error);
  }
};

// Maç detayı getir
const getMatchDetails = async (matchId: number) => {
  try {
    const response = await api.matches.getMatchDetails(matchId);
    console.log(response.data); // Maç detayı
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 💾 Caching Nasıl Çalışır?

Backend otomatik olarak tüm istekleri cache'ler:

| İstek Tipi | Cache Süresi | Açıklama |
|------------|--------------|----------|
| Canlı Maçlar | 1 dakika | Sık güncellenir |
| Maç Olayları | 2 dakika | Goller, kartlar |
| Maç Detayları | 5 dakika | Genel bilgiler |
| Fikstür | 30 dakika | Maç programı |
| Puan Durumu | 1 saat | Seyrek değişir |
| Takım Bilgileri | 24 saat | Statik veri |

**Cache Avantajları:**
- ✅ API isteği tasarrufu (günlük limit koruması)
- ✅ Daha hızlı yanıt
- ✅ Maliyet tasarrufu

---

## 📊 Rate Limiting

Backend günlük istek sayısını takip eder:

```javascript
// Console'da göreceksin:
📡 API Request #1/7400: /fixtures
📡 API Request #2/7400: /teams
...
```

Limit dolduğunda:
```
⚠️ Daily API rate limit reached (7400 requests)
```

---

## 🐛 Sorun Giderme

### "Cannot find module 'express'"
```bash
cd backend
npm install
```

### ".env file not found"
```bash
copy .env.example .env
# Sonra .env'yi düzenle ve API key ekle
```

### "API Error: Unauthorized"
```
API key yanlış veya eksik
→ .env dosyasını kontrol et
→ API-Football.com'dan key'ini doğrula
```

### "EADDRINUSE: Port 3000 already in use"
```bash
# Port zaten kullanımda
# Başka bir port kullan:
# .env dosyasında PORT=3001 yap
```

### "fetch failed"
```
Backend çalışmıyor
→ Backend'i başlat: npm run dev
```

---

## 🚀 Production Deployment

### Vercel'e Deploy

```bash
cd backend
npm install -g vercel
vercel --prod
```

### Heroku'ya Deploy

```bash
heroku create fan-manager-backend
git push heroku main
heroku config:set FOOTBALL_API_KEY=your_key
```

### Railway'e Deploy

```bash
npm install -g @railway/cli
railway up
```

Production'da React Native API URL'ini güncelle:
```typescript
const API_BASE_URL = 'https://your-backend.vercel.app/api';
```

---

## 📖 Daha Fazla Bilgi

- [API-Football Docs](https://www.api-football.com/documentation-v3)
- [Express.js Docs](https://expressjs.com/)
- [Node-cache Docs](https://www.npmjs.com/package/node-cache)

---

## ✅ Başarıyla Kuruldu!

Artık backend çalışıyor! 🎉

**Şimdi ne yapabilirsin:**
1. ✅ React Native uygulamasını başlat
2. ✅ Maç listesini görüntüle
3. ✅ Maç detaylarını aç
4. ✅ Tahminleri kaydet

**Backend Console'da göreceksin:**
- ✅ API istekleri
- ✅ Cache hit/miss
- ✅ Request counter

---

## 🤝 Yardım

Sorun mu yaşıyorsun? 

1. Backend log'larını kontrol et
2. `.env` dosyasını doğrula
3. API key'ini test et
4. Port çakışması kontrolü

Başarılar! 🚀
