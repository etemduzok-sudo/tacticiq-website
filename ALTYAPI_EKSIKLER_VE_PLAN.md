# 🏗️ FAN MANAGER 2026 - ALTYAPI EKSİKLERİ VE PLAN

**Tarih:** 9 Ocak 2026  
**Hedef:** Altyapıyı sağlamlaştır, UI'ya sonra bak

---

## 🎯 ALTYAPI EKSİKLERİ (Öncelik Sırasına Göre)

### 🔴 1. **MAÇ DETAY API & DATA FLOW**

**Eksik:**
```typescript
❌ Match details API endpoint eksik
❌ Match statistics API eksik
❌ Match events (goller, kartlar) API eksik
❌ Match lineups (kadro) API eksik
```

**Yapılacak:**
```typescript
// Backend: routes/matches.js
GET /api/matches/:id/details    // Maç detayları
GET /api/matches/:id/statistics // İstatistikler
GET /api/matches/:id/events     // Olaylar (goller, kartlar)
GET /api/matches/:id/lineups    // Kadro (11'ler)
```

**Süre:** 2 saat

---

### 🔴 2. **TAHMİN SİSTEMİ API**

**Eksik:**
```typescript
❌ Tahmin kaydetme API yok
❌ Tahmin güncelleme API yok
❌ Kullanıcının tahminlerini getirme API yok
❌ Tahmin validation yok
```

**Yapılacak:**
```typescript
// Backend: routes/predictions.js
POST   /api/predictions          // Yeni tahmin
GET    /api/predictions/user/:userId  // Kullanıcının tahminleri
GET    /api/predictions/match/:matchId  // Maç tahminleri
PUT    /api/predictions/:id      // Tahmin güncelle
DELETE /api/predictions/:id      // Tahmin sil

// Database: predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  home_score INTEGER,
  away_score INTEGER,
  first_goal VARCHAR(10),
  total_goals VARCHAR(10),
  yellow_cards INTEGER,
  corners INTEGER,
  focused_predictions JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Süre:** 3 saat

---

### 🔴 3. **PUAN HESAPLAMA SİSTEMİ**

**Eksik:**
```typescript
❌ Puan hesaplama logic yok (backend)
❌ Maç bitişi trigger yok
❌ Leaderboard güncelleme yok
❌ Rozet kazanma logic yok
```

**Yapılacak:**
```typescript
// Backend: services/scoringService.js
class ScoringService {
  calculateScore(prediction, actualResult) {
    // Strategic Focus System logic
    // Training Multiplier logic
    // Transparent Scoring logic
    return {
      totalScore: number,
      breakdown: {
        tempo: number,
        disiplin: number,
        fiziksel: number,
        bireysel: number
      },
      focusBonus: number,
      trainingMultiplier: number
    };
  }
  
  updateLeaderboard(userId, score) {
    // Leaderboard güncelle
  }
  
  checkAndAwardBadges(userId, stats) {
    // Rozet kontrolü
  }
}

// Backend: routes/scoring.js
POST /api/scoring/calculate      // Puan hesapla
POST /api/scoring/finalize/:matchId  // Maç bitişi
```

**Süre:** 3 saat

---

### 🔴 4. **CANLI MAÇ GÜNCELLEMESİ**

**Eksik:**
```typescript
❌ Canlı maç polling sistemi yok
❌ Skor değişikliği detection yok
❌ Real-time data sync yok
```

**Yapılacak:**
```typescript
// Backend: services/liveMatchService.js
class LiveMatchService {
  async pollLiveMatches() {
    // API-Football'dan canlı maçları çek
    // Database'i güncelle
    // Değişiklikleri tespit et
  }
  
  async detectScoreChanges(oldData, newData) {
    // Skor değişti mi?
    // Gol oldu mu?
    // Kart çıktı mı?
  }
}

// Cron job: Her 10 saniyede bir
setInterval(() => {
  liveMatchService.pollLiveMatches();
}, 10000);
```

**Süre:** 2 saat

---

### 🟡 5. **DATABASE SCHEMA GÜNCELLEMELERİ**

**Eksik:**
```sql
❌ predictions table yok
❌ user_stats table eksik
❌ match_results table yok
❌ leaderboard view yok
```

**Yapılacak:**
```sql
-- predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  first_goal VARCHAR(10),
  total_goals VARCHAR(10),
  yellow_cards INTEGER,
  corners INTEGER,
  focused_predictions JSONB DEFAULT '[]',
  training_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- match_results table
CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id INTEGER UNIQUE NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  first_goal VARCHAR(10),
  total_goals VARCHAR(10),
  yellow_cards INTEGER,
  corners INTEGER,
  events JSONB,
  finalized_at TIMESTAMP DEFAULT NOW()
);

-- user_stats table (genişletme)
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0;

-- leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.avatar,
  us.total_points,
  us.accuracy_percentage,
  us.current_streak,
  us.badges,
  RANK() OVER (ORDER BY us.total_points DESC) as rank
FROM users u
JOIN user_stats us ON u.id = us.user_id
ORDER BY us.total_points DESC;
```

**Süre:** 1 saat

---

### 🟡 6. **ERROR HANDLING & VALIDATION**

**Eksik:**
```typescript
❌ API error handling eksik
❌ Input validation yok
❌ Rate limiting yok
❌ Authentication middleware eksik
```

**Yapılacak:**
```typescript
// Backend: middleware/validation.js
const { body, param, validationResult } = require('express-validator');

const validatePrediction = [
  body('matchId').isInt(),
  body('homeScore').isInt({ min: 0, max: 20 }),
  body('awayScore').isInt({ min: 0, max: 20 }),
  body('focusedPredictions').isArray({ max: 3 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Backend: middleware/auth.js
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Token doğrulama
  next();
};

// Backend: middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // 100 request
});
```

**Süre:** 2 saat

---

### 🟡 7. **FRONTEND STATE MANAGEMENT**

**Eksik:**
```typescript
❌ Prediction state management karmaşık
❌ Match detail state dağınık
❌ User stats cache yok
```

**Yapılacak:**
```typescript
// src/contexts/PredictionContext.tsx
interface PredictionContextType {
  predictions: Prediction[];
  savePrediction: (prediction: Prediction) => Promise<void>;
  updatePrediction: (id: string, data: Partial<Prediction>) => Promise<void>;
  getUserPredictions: (userId: string) => Promise<Prediction[]>;
  loading: boolean;
  error: string | null;
}

// src/contexts/MatchContext.tsx
interface MatchContextType {
  selectedMatch: Match | null;
  matchDetails: MatchDetails | null;
  matchStatistics: MatchStatistics | null;
  matchEvents: MatchEvent[];
  matchLineups: MatchLineups | null;
  fetchMatchDetails: (matchId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// src/hooks/useUserStats.ts
export function useUserStats(userId: string) {
  // Cache user stats
  // Auto-refresh every 5 minutes
  // Optimistic updates
}
```

**Süre:** 2 saat

---

### 🟢 8. **TESTING & MONITORING**

**Eksik:**
```typescript
❌ API testleri yok
❌ Integration testleri yok
❌ Error logging yok
❌ Performance monitoring yok
```

**Yapılacak:**
```typescript
// Backend: tests/predictions.test.js
describe('Predictions API', () => {
  test('POST /api/predictions - creates new prediction', async () => {
    // Test logic
  });
  
  test('GET /api/predictions/user/:userId - returns user predictions', async () => {
    // Test logic
  });
});

// Backend: services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Süre:** 3 saat (opsiyonel)

---

## 📋 ALTYAPI TAMAMLAMA PLANI

### **GÜN 1: CORE API'LER** (8 saat)

#### Sabah (4 saat)
1. ✅ Database schema güncelle (1 saat)
2. ✅ Tahmin API'leri yaz (3 saat)
   - POST /api/predictions
   - GET /api/predictions/user/:userId
   - PUT /api/predictions/:id

#### Öğleden Sonra (4 saat)
3. ✅ Maç detay API'leri yaz (2 saat)
   - GET /api/matches/:id/details
   - GET /api/matches/:id/statistics
   - GET /api/matches/:id/events
4. ✅ Validation & Error Handling (2 saat)

---

### **GÜN 2: SCORING & LIVE UPDATES** (8 saat)

#### Sabah (4 saat)
5. ✅ Puan hesaplama sistemi (3 saat)
   - ScoringService
   - POST /api/scoring/calculate
   - Leaderboard güncelleme
6. ✅ Rozet sistemi entegrasyonu (1 saat)

#### Öğleden Sonra (4 saat)
7. ✅ Canlı maç güncelleme (2 saat)
   - LiveMatchService
   - Polling sistemi
8. ✅ Frontend state management (2 saat)
   - PredictionContext
   - MatchContext

---

### **GÜN 3: INTEGRATION & TEST** (4-6 saat)

9. ✅ Frontend-Backend entegrasyonu (2 saat)
10. ✅ End-to-end test (2 saat)
11. ✅ Bug fixing (2 saat)

---

## 🎯 BAŞARI KRİTERLERİ

### Altyapı Tamamlandı Sayılır Eğer:

1. ✅ Kullanıcı tahmin yapabilir
2. ✅ Tahmin database'e kaydedilir
3. ✅ Maç bitince puan hesaplanır
4. ✅ Leaderboard otomatik güncellenir
5. ✅ Canlı maçlar 10 saniyede bir güncellenir
6. ✅ Tüm API'ler error handling'e sahip
7. ✅ Frontend state management düzenli

---

## 📊 ALTYAPI TAMAMLANMA DURUMU

| Modül | Mevcut | Hedef | Süre |
|-------|--------|-------|------|
| **Database Schema** | 60% | 100% | 1 saat |
| **Tahmin API** | 0% | 100% | 3 saat |
| **Maç Detay API** | 40% | 100% | 2 saat |
| **Scoring System** | 80% | 100% | 3 saat |
| **Live Updates** | 20% | 100% | 2 saat |
| **Error Handling** | 30% | 100% | 2 saat |
| **State Management** | 50% | 100% | 2 saat |
| **Testing** | 10% | 80% | 3 saat |

**TOPLAM SÜRE:** 18-20 saat (2-3 gün)

---

## 🚀 HEMEN BAŞLAYALIM

### İlk Adım: Database Schema

```sql
-- Şimdi çalıştıralım
CREATE TABLE predictions (...);
CREATE TABLE match_results (...);
ALTER TABLE user_stats ADD COLUMN ...;
```

### İkinci Adım: Tahmin API

```typescript
// Backend: routes/predictions.js
router.post('/predictions', validatePrediction, async (req, res) => {
  // Tahmin kaydet
});
```

---

**Hazır mısınız? Hemen başlayalım! İlk olarak database schema'yı güncelleyelim mi?**
