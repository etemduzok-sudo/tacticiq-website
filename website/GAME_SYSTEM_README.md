# TacticIQ Oyun Sistemi - Kurulum ve Kullanım Rehberi

## 📋 Genel Bakış

TacticIQ artık mobil uygulamanın yanı sıra **web tarayıcısından da oynanabilir** hale geldi. Bu dokümantasyon, oyun sisteminin kurulumu, backend entegrasyonu ve güvenlik önlemlerini açıklar.

## 🎮 Özellikler

### Frontend (✅ TAMAMLANDI)
- ✅ GameSection komponenti (Web'de oyun butonu ve arayüzü)
- ✅ 8 dilde tam çeviri desteği (EN, TR, DE, FR, ES, IT, AR, ZH)
- ✅ RTL desteği (Arapça için)
- ✅ Admin paneli entegrasyonu (Oyun sistemi açma/kapama)
- ✅ Responsive tasarım (Mobil ve desktop)
- ✅ Marka renkleri ile uyumlu UI (#0F2A24, #1FA2A6, #C9A44C)

### Backend (⚠️ ENTEGRASYON GEREKLİ)
- ⚠️ Game Service API endpoint'leri
- ⚠️ Database şeması
- ⚠️ Authentication ve Authorization
- ⚠️ Liderlik tablosu sistemi
- ⚠️ Real-time istatistikler

## 📁 Dosya Yapısı

```
src/
├── app/components/sections/
│   └── GameSection.tsx          # Oyun bölümü UI
├── contexts/
│   └── AdminDataContext.tsx     # Game ayarları context'e eklendi
├── services/
│   └── gameService.ts           # Game API servisi (✅ Hazır)
└── i18n/locales/
    ├── en.json                  # İngilizce çeviriler
    ├── tr.json                  # Türkçe çeviriler
    ├── de.json                  # Almanca çeviriler
    ├── fr.json                  # Fransızca çeviriler
    ├── es.json                  # İspanyolca çeviriler
    ├── it.json                  # İtalyanca çeviriler
    ├── ar.json                  # Arapça çeviriler
    └── zh.json                  # Çince çeviriler
```

## 🚀 Hızlı Başlangıç

### 1. Admin Panelinden Oyun Sistemini Aktifleştirme

```typescript
// Admin paneline giriş yapın (*130923*Tdd*)
// Admin Panel > Oyun Sistemi > Toggle düğmesine tıklayın
```

**Oyun sistemi aktif olduğunda:**
- Web sitesinde "GameSection" görünür hale gelir
- Kullanıcılar "Şimdi Oyna" butonunu görebilir
- Oyun arayüzüne erişim sağlanır

**Oyun sistemi kapalı olduğunda:**
- GameSection tamamen gizlenir
- Web sitesinde oyun ile ilgili hiçbir UI elementi görünmez

### 2. Kullanıcı Deneyimi Akışı

```
1. Kullanıcı web sitesini ziyaret eder
   ↓
2. GameSection'ı görür (Oyun aktifse)
   ↓
3. "Şimdi Oyna" butonuna tıklar
   ↓
4. Oyun modal/arayüzü açılır
   ↓
5. Backend bağlantısı gerekli mesajını görür
   ↓
6. Backend bağlantısı yapıldıktan sonra oyun oynanabilir
```

## 🔌 Backend Entegrasyonu

### Gerekli API Endpoint'leri

`src/services/gameService.ts` dosyası aşağıdaki endpoint'leri kullanır:

#### 1. Oyun Başlatma
```typescript
POST /game/start
Body: { userId: string, matchId: string }
Response: GameData
```

#### 2. Tahmin Gönderme
```typescript
POST /game/predict
Body: { gameId: string, prediction: GamePrediction }
Response: { success: boolean, score: number }
```

#### 3. Oyunu Tamamlama
```typescript
POST /game/complete
Body: { gameId: string }
Response: GameData
```

#### 4. Liderlik Tablosu
```typescript
GET /game/leaderboard
Query: { period: 'daily' | 'weekly' | 'monthly' | 'allTime', limit: number }
Response: LeaderboardEntry[]
```

#### 5. Oyun Geçmişi
```typescript
GET /game/history
Query: { userId: string, page: number, limit: number }
Response: GameData[]
```

#### 6. Aktif Oyun Kontrolü
```typescript
GET /game/active
Query: { userId: string }
Response: GameData | null
```

#### 7. Günlük Limit Kontrolü
```typescript
GET /game/check-limit
Query: { userId: string }
Response: { canPlay: boolean, remaining: number }
```

### Database Şeması Önerisi

```sql
-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  predictions JSONB NOT NULL,
  score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game Predictions table
CREATE TABLE game_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  prediction JSONB NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.00, -- percentage
  rank INTEGER,
  period VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'allTime'
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- Game Settings table (Admin kontrolü için)
CREATE TABLE game_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT true,
  max_players_per_game INTEGER DEFAULT 100,
  game_duration INTEGER DEFAULT 90,
  points_per_correct_prediction INTEGER DEFAULT 100,
  penalty_per_wrong_prediction INTEGER DEFAULT -50,
  enable_leaderboard BOOLEAN DEFAULT true,
  enable_multiplayer BOOLEAN DEFAULT false,
  daily_game_limit INTEGER DEFAULT 10,
  require_premium BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Güvenlik Önlemleri

### 1. Rate Limiting
```typescript
// gameService.ts içinde implementasyonu mevcut
// Dakikada maksimum 30 istek
const RATE_LIMIT_WINDOW = 60000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 30;
```

### 2. Input Sanitization
```typescript
// XSS koruması için tüm input'lar temizlenir
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // HTML tag karakterlerini kaldır
      .trim()
      .substring(0, 1000); // Max 1000 karakter
  }
  // ...
}
```

### 3. CSRF Token
Backend'de her istek için CSRF token kontrolü yapılmalı:

```typescript
// Backend middleware örneği
app.use(csrfProtection);

app.post('/game/start', (req, res) => {
  // CSRF token otomatik kontrol edilir
  // ...
});
```

### 4. Authentication
Tüm game endpoint'leri authenticated olmalı:

```typescript
// Backend middleware örneği
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/game/start', authenticateUser, gameController.startGame);
```

### 5. Data Validation
Backend'de tüm gelen veriler validate edilmeli:

```typescript
// Joi veya Yup kullanarak validation
const predictionSchema = Joi.object({
  gameId: Joi.string().uuid().required(),
  prediction: Joi.object({
    category: Joi.string().required(),
    prediction: Joi.any().required()
  }).required()
});

// Middleware
const validatePrediction = (req, res, next) => {
  const { error } = predictionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};
```

## 📊 Kullanım Örnekleri

### Oyun Başlatma
```typescript
import gameService from '@/services/gameService';

async function startNewGame(userId: string, matchId: string) {
  try {
    const game = await gameService.startGame(userId, matchId);
    console.log('Oyun başlatıldı:', game);
    return game;
  } catch (error) {
    console.error('Oyun başlatma hatası:', error);
    throw error;
  }
}
```

### Tahmin Gönderme
```typescript
async function submitPrediction(gameId: string, category: string, value: any) {
  try {
    const result = await gameService.submitPrediction(gameId, {
      category,
      prediction: value
    });
    console.log('Tahmin kaydedildi. Puan:', result.score);
    return result;
  } catch (error) {
    console.error('Tahmin gönderme hatası:', error);
    throw error;
  }
}
```

### Liderlik Tablosu
```typescript
async function fetchLeaderboard() {
  try {
    const leaderboard = await gameService.getLeaderboard('weekly', 100);
    console.log('Liderlik tablosu:', leaderboard);
    return leaderboard;
  } catch (error) {
    console.error('Liderlik tablosu hatası:', error);
    throw error;
  }
}
```

## 🌍 Çok Dilli Destek

Oyun sistemi 8 dilde tam destek sağlar:

```json
// en.json örneği
{
  "game": {
    "badge": "Play Anywhere - Web & Mobile",
    "title": "Play TacticIQ Game",
    "description": "Make your predictions directly on the web...",
    "playNow": "Play Now",
    "features": {
      "predictions": "Make Predictions",
      "leaderboard": "Global Leaderboard",
      "skills": "Improve Your Skills",
      "fairPlay": "Fair Play Guaranteed"
    },
    "security": {
      "title": "Secure & Protected",
      "description": "All game data is encrypted..."
    }
  }
}
```

## ⚙️ Yapılandırma

### AdminDataContext
```typescript
// SiteSettings interface'ine eklendi
export interface SiteSettings {
  // ...
  gameEnabled: boolean; // Oyun sistemi aktif mi?
}
```

### Oyun Ayarlarını Değiştirme
```typescript
import { useAdminData } from '@/contexts/AdminDataContext';

function GameSettings() {
  const { settings, updateSettings } = useAdminData();
  
  const toggleGame = () => {
    updateSettings({ gameEnabled: !settings.gameEnabled });
  };
  
  return (
    <button onClick={toggleGame}>
      {settings.gameEnabled ? 'Oyunu Kapat' : 'Oyunu Aç'}
    </button>
  );
}
```

## 🐛 Hata Ayıklama

### Yaygın Hatalar ve Çözümleri

#### 1. "Too many requests" hatası
**Sebep:** Rate limit aşıldı  
**Çözüm:** 1 dakika bekleyin veya rate limit ayarlarını güncelleyin

#### 2. "Invalid input" hatası
**Sebep:** Gönderilen veri geçersiz  
**Çözüm:** Input validation kurallarını kontrol edin

#### 3. "Backend connection required" mesajı
**Sebep:** Backend endpoint'leri henüz ayarlanmadı  
**Çözüm:** Backend entegrasyonunu tamamlayın

## 📝 Notlar

- Frontend tamamen hazır ve çalışır durumda ✅
- Backend entegrasyonu gerekli ⚠️
- Tüm güvenlik önlemleri implementasyona hazır ✅
- 8 dilde çeviri tamamlandı ✅
- Admin kontrolü aktif ✅

## 🔗 İlgili Dokümantasyon

- [GAME_SECURITY_GUIDE.md](./GAME_SECURITY_GUIDE.md) - Detaylı güvenlik rehberi
- [GAME_BACKEND_INTEGRATION.md](./GAME_BACKEND_INTEGRATION.md) - Backend entegrasyon adımları
- [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) - Genel backend rehberi

## 📞 Destek

Herhangi bir sorunuz olursa:
- Admin panelinden "Yardım" bölümüne bakın
- Backend entegrasyon dokümantasyonunu inceleyin
- Güvenlik rehberini okuyun

---

**Son Güncelleme:** 16 Ocak 2026  
**Versiyon:** 1.0.0  
**Durum:** Frontend Tamamlandı, Backend Entegrasyonu Gerekli
