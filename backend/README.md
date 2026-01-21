# TacticIQ - Backend API

Backend API ara katmanı. React Native uygulaması ile Football API arasında köprü görevi görür.

## 🎯 Amaç

- **Rate Limiting Koruması**: Günlük 7400 sorgu limitini yönetir
- **Caching**: Tekrarlayan istekleri önbelleğe alır (hız + maliyet tasarrufu)
- **Tek Nokta Kontrolü**: Tüm API istekleri tek noktadan geçer
- **Error Handling**: Hata yönetimi ve fallback mekanizmaları

## 🚀 Kurulum

### 1. Dependencies Yükle

```bash
cd backend
npm install
```

### 2. Environment Variables

`.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve API key'inizi ekleyin:

```
FOOTBALL_API_KEY=your_actual_api_key_here
```

### 3. API Key Alma

1. [API-Football.com](https://www.api-football.com/) adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'dan API key'inizi alın
4. `.env` dosyasına ekleyin

**Free Plan**: 100 istek/gün  
**Pro Plan**: 7400 istek/gün

### 4. Sunucuyu Başlat

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Sunucu `http://localhost:3000` adresinde çalışacak.

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Matches (Maçlar)
```
GET /api/matches/live                    # Canlı maçlar
GET /api/matches/date/:date              # Belirli gün (YYYY-MM-DD)
GET /api/matches/league/:leagueId        # Lig bazlı
GET /api/matches/:id                     # Maç detayı
GET /api/matches/:id/statistics          # Maç istatistikleri
GET /api/matches/:id/events              # Maç olayları (gol, kart)
GET /api/matches/:id/lineups             # Kadro dizilişi
GET /api/matches/h2h/:team1/:team2       # Kafa kafaya
```

### Leagues (Ligler)
```
GET /api/leagues                         # Tüm ligler
GET /api/leagues?country=Turkey          # Ülkeye göre
GET /api/leagues/:id/standings           # Puan durumu
```

### Teams (Takımlar)
```
GET /api/teams/:id                       # Takım bilgisi
GET /api/teams/:id/statistics            # Takım istatistikleri
```

### Players (Oyuncular)
```
GET /api/players/:id                     # Oyuncu bilgisi
```

## 💾 Caching Stratejisi

| Endpoint | Cache Süresi | Açıklama |
|----------|--------------|----------|
| Live Matches | 60 saniye | Canlı maçlar (sık güncellenir) |
| Match Events | 2 dakika | Gol, kart gibi olaylar |
| Match Details | 5 dakika | Maç detayları |
| Fixtures | 30 dakika | Maç programı |
| Standings | 1 saat | Puan durumu |
| Team Info | 24 saat | Takım bilgileri (değişmez) |

## 📊 Rate Limiting

- **Günlük Limit**: 7400 istek
- **Sayaç Reset**: Her gün 00:00'da otomatik
- **Limit Aşımı**: `Daily API rate limit reached` hatası

## 🔒 Güvenlik

- **Helmet**: HTTP header güvenliği
- **CORS**: Cross-origin istekler kontrollü
- **Compression**: Response sıkıştırma
- **Error Handling**: Detaylı hata yönetimi

## 📝 Response Format

### Başarılı Yanıt
```json
{
  "success": true,
  "data": {...},
  "cached": false
}
```

### Hata Yanıtı
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🛠️ Development

```bash
# Dependencies yükle
npm install

# Development server (auto-reload)
npm run dev

# Production build
npm start
```

## 📦 Dependencies

- **express**: Web framework
- **axios**: HTTP client
- **node-cache**: In-memory caching
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **compression**: Response compression
- **dotenv**: Environment variables

## 🚀 Production Deployment

### Option 1: Heroku
```bash
heroku create fan-manager-backend
git push heroku main
heroku config:set FOOTBALL_API_KEY=your_key
```

### Option 2: Vercel
```bash
vercel --prod
```

### Option 3: Railway
```bash
railway up
```

## 📈 Monitoring

Sunucu loglarını takip edin:

```bash
npm run dev
```

Cache istatistikleri:
- Cache hits/misses
- Request count
- Remaining daily requests

## ⚠️ Önemli Notlar

1. **API Key Güvenliği**: `.env` dosyasını git'e eklemeyin
2. **Rate Limiting**: Günlük limit takibi yapın
3. **Caching**: Cache sürelerini ihtiyaca göre ayarlayın
4. **CORS**: Production'da sadece kendi domain'inizi izinlendirin

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details
