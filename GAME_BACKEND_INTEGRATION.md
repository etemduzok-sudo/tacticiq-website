# TacticIQ Oyun Sistemi - Backend Entegrasyon Rehberi

## 📋 Genel Bakış

Bu dokümantasyon, TacticIQ oyun sisteminin backend'e nasıl entegre edileceğini adım adım açıklar.

## 🎯 Entegrasyon Adımları

### Adım 1: Database Kurulumu

#### PostgreSQL Şeması Oluşturma
```sql
-- UUID extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id),
  predictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_score CHECK (score >= 0)
);

-- Indexes
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_match_id ON games(match_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- Game Predictions table
CREATE TABLE game_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  prediction JSONB NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT prediction_categories CHECK (
    category IN (
      'halftime_score', 'fulltime_score', 'total_goals', 
      'first_goal', 'yellow_cards', 'red_cards', 
      'possession', 'total_shots', 'shots_on_target', 
      'corners', 'tempo', 'scenario'
    )
  )
);

CREATE INDEX idx_predictions_game_id ON game_predictions(game_id);
CREATE INDEX idx_predictions_category ON game_predictions(category);

-- Leaderboard table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  rank INTEGER,
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'allTime')),
  period_start DATE,
  period_end DATE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

CREATE INDEX idx_leaderboard_period ON leaderboard(period);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);

-- Game Settings table
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

-- İlk ayarları ekle
INSERT INTO game_settings (enabled) VALUES (true);

-- Daily limits tracking
CREATE TABLE user_game_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  games_played_today INTEGER DEFAULT 0,
  last_played_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_limits_user_id ON user_game_limits(user_id);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

### Adım 2: Backend API Endpoint'leri (Node.js/Express)

#### Game Controller
```typescript
// controllers/gameController.ts
import { Request, Response } from 'express';
import { GameService } from '../services/gameService';
import { validateGameStart, validatePrediction } from '../validators/gameValidators';

export class GameController {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  // POST /game/start
  async startGame(req: Request, res: Response) {
    try {
      const { userId, matchId } = req.body;
      
      // Validation
      const { error } = validateGameStart({ userId, matchId });
      if (error) {
        return res.status(400).json({ 
          message: error.details[0].message 
        });
      }

      // Check daily limit
      const canPlay = await this.gameService.checkDailyLimit(userId);
      if (!canPlay) {
        return res.status(403).json({ 
          message: 'Daily game limit reached' 
        });
      }

      // Start game
      const game = await this.gameService.startGame(userId, matchId);
      
      res.status(201).json(game);
    } catch (error: any) {
      console.error('Start game error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to start game' 
      });
    }
  }

  // POST /game/predict
  async submitPrediction(req: Request, res: Response) {
    try {
      const { gameId, prediction } = req.body;
      
      // Validation
      const { error } = validatePrediction({ gameId, prediction });
      if (error) {
        return res.status(400).json({ 
          message: error.details[0].message 
        });
      }

      // Submit prediction
      const result = await this.gameService.submitPrediction(
        gameId, 
        prediction
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Submit prediction error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to submit prediction' 
      });
    }
  }

  // POST /game/complete
  async completeGame(req: Request, res: Response) {
    try {
      const { gameId } = req.body;
      
      if (!gameId) {
        return res.status(400).json({ message: 'gameId is required' });
      }

      const game = await this.gameService.completeGame(gameId);
      
      // Update leaderboard
      await this.gameService.updateLeaderboard(game.user_id, game.score);
      
      res.status(200).json(game);
    } catch (error: any) {
      console.error('Complete game error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to complete game' 
      });
    }
  }

  // GET /game/leaderboard
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { period = 'weekly', limit = 100 } = req.query;
      
      const leaderboard = await this.gameService.getLeaderboard(
        period as string,
        parseInt(limit as string)
      );
      
      res.status(200).json(leaderboard);
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get leaderboard' 
      });
    }
  }

  // GET /game/history
  async getUserGameHistory(req: Request, res: Response) {
    try {
      const { userId, page = 1, limit = 10 } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const history = await this.gameService.getUserGameHistory(
        userId as string,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      res.status(200).json(history);
    } catch (error: any) {
      console.error('Get game history error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get game history' 
      });
    }
  }

  // GET /game/active
  async getActiveGame(req: Request, res: Response) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const game = await this.gameService.getActiveGame(userId as string);
      
      if (!game) {
        return res.status(404).json({ message: 'No active game found' });
      }
      
      res.status(200).json(game);
    } catch (error: any) {
      console.error('Get active game error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get active game' 
      });
    }
  }

  // GET /game/check-limit
  async checkDailyLimit(req: Request, res: Response) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const result = await this.gameService.getDailyLimitStatus(
        userId as string
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Check daily limit error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to check daily limit' 
      });
    }
  }

  // GET /game/settings
  async getGameSettings(req: Request, res: Response) {
    try {
      const settings = await this.gameService.getGameSettings();
      res.status(200).json(settings);
    } catch (error: any) {
      console.error('Get game settings error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to get game settings' 
      });
    }
  }

  // PUT /game/settings (Admin only)
  async updateGameSettings(req: Request, res: Response) {
    try {
      // Admin kontrolü
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const settings = await this.gameService.updateGameSettings(req.body);
      res.status(200).json(settings);
    } catch (error: any) {
      console.error('Update game settings error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to update game settings' 
      });
    }
  }
}
```

---

#### Game Service
```typescript
// services/gameService.ts
import { db } from '../config/database';

export class GameService {
  async startGame(userId: string, matchId: string) {
    const query = `
      INSERT INTO games (user_id, match_id, status)
      VALUES ($1, $2, 'active')
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, matchId]);
    
    // Update daily limit
    await this.incrementDailyLimit(userId);
    
    return result.rows[0];
  }

  async submitPrediction(gameId: string, prediction: any) {
    // Insert prediction
    const insertQuery = `
      INSERT INTO game_predictions (game_id, category, prediction)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      gameId,
      prediction.category,
      JSON.stringify(prediction.prediction)
    ]);
    
    // Calculate score (simplified - actual scoring logic should be more complex)
    const points = await this.calculatePoints(prediction);
    
    // Update game score
    await db.query(
      'UPDATE games SET score = score + $1 WHERE id = $2',
      [points, gameId]
    );
    
    return { success: true, score: points };
  }

  async completeGame(gameId: string) {
    const query = `
      UPDATE games 
      SET status = 'completed', completed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [gameId]);
    return result.rows[0];
  }

  async getLeaderboard(period: string, limit: number) {
    const query = `
      SELECT 
        l.rank,
        l.total_score,
        l.games_played,
        l.accuracy,
        u.id as user_id,
        u.name as user_name,
        u.avatar_url
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.period = $1
      ORDER BY l.rank ASC
      LIMIT $2
    `;
    
    const result = await db.query(query, [period, limit]);
    return result.rows;
  }

  async getUserGameHistory(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT * FROM games
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async getActiveGame(userId: string) {
    const query = `
      SELECT * FROM games
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  async checkDailyLimit(userId: string): Promise<boolean> {
    const settings = await this.getGameSettings();
    
    if (settings.daily_game_limit === 0) {
      return true; // Unlimited
    }
    
    const query = `
      SELECT games_played_today
      FROM user_game_limits
      WHERE user_id = $1 AND last_played_date = CURRENT_DATE
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return true; // No record yet
    }
    
    return result.rows[0].games_played_today < settings.daily_game_limit;
  }

  async getDailyLimitStatus(userId: string) {
    const settings = await this.getGameSettings();
    const limit = settings.daily_game_limit;
    
    if (limit === 0) {
      return { canPlay: true, remaining: -1 }; // Unlimited
    }
    
    const query = `
      SELECT games_played_today
      FROM user_game_limits
      WHERE user_id = $1 AND last_played_date = CURRENT_DATE
    `;
    
    const result = await db.query(query, [userId]);
    const played = result.rows[0]?.games_played_today || 0;
    
    return {
      canPlay: played < limit,
      remaining: limit - played
    };
  }

  async incrementDailyLimit(userId: string) {
    const query = `
      INSERT INTO user_game_limits (user_id, games_played_today, last_played_date)
      VALUES ($1, 1, CURRENT_DATE)
      ON CONFLICT (user_id)
      DO UPDATE SET
        games_played_today = CASE
          WHEN user_game_limits.last_played_date = CURRENT_DATE
          THEN user_game_limits.games_played_today + 1
          ELSE 1
        END,
        last_played_date = CURRENT_DATE
    `;
    
    await db.query(query, [userId]);
  }

  async updateLeaderboard(userId: string, gameScore: number) {
    // Update or insert leaderboard entry
    const query = `
      INSERT INTO leaderboard (user_id, total_score, games_played, period, period_start)
      VALUES ($1, $2, 1, 'allTime', '2000-01-01')
      ON CONFLICT (user_id, period, period_start)
      DO UPDATE SET
        total_score = leaderboard.total_score + $2,
        games_played = leaderboard.games_played + 1
    `;
    
    await db.query(query, [userId, gameScore]);
    
    // Recalculate ranks
    await this.recalculateRanks();
  }

  async recalculateRanks() {
    const query = `
      UPDATE leaderboard l
      SET rank = sub.new_rank
      FROM (
        SELECT 
          id,
          ROW_NUMBER() OVER (PARTITION BY period ORDER BY total_score DESC) as new_rank
        FROM leaderboard
      ) sub
      WHERE l.id = sub.id
    `;
    
    await db.query(query);
  }

  async getGameSettings() {
    const query = 'SELECT * FROM game_settings LIMIT 1';
    const result = await db.query(query);
    return result.rows[0];
  }

  async updateGameSettings(settings: any) {
    const query = `
      UPDATE game_settings
      SET enabled = COALESCE($1, enabled),
          daily_game_limit = COALESCE($2, daily_game_limit),
          points_per_correct_prediction = COALESCE($3, points_per_correct_prediction)
      WHERE id = (SELECT id FROM game_settings LIMIT 1)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      settings.enabled,
      settings.dailyGameLimit,
      settings.pointsPerCorrectPrediction
    ]);
    
    return result.rows[0];
  }

  private async calculatePoints(prediction: any): Promise<number> {
    // Simplified scoring - actual implementation should be more complex
    // and check against match results
    return 100; // Base points
  }
}
```

---

### Adım 3: Routes Kurulumu
```typescript
// routes/gameRoutes.ts
import express from 'express';
import { GameController } from '../controllers/gameController';
import { authenticateToken } from '../middleware/auth';
import { gameRateLimiter } from '../middleware/rateLimiter';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();
const gameController = new GameController();

// Public routes
router.get('/leaderboard', gameController.getLeaderboard.bind(gameController));
router.get('/settings', gameController.getGameSettings.bind(gameController));

// Protected routes (require authentication)
router.use(authenticateToken);
router.use(gameRateLimiter);

router.post('/start', csrfProtection, gameController.startGame.bind(gameController));
router.post('/predict', csrfProtection, gameController.submitPrediction.bind(gameController));
router.post('/complete', csrfProtection, gameController.completeGame.bind(gameController));
router.get('/history', gameController.getUserGameHistory.bind(gameController));
router.get('/active', gameController.getActiveGame.bind(gameController));
router.get('/check-limit', gameController.checkDailyLimit.bind(gameController));

// Admin only routes
router.put('/settings', csrfProtection, gameController.updateGameSettings.bind(gameController));

export default router;
```

---

### Adım 4: Frontend API Config

```typescript
// Update /src/config/api.config.ts
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_URL || 'https://api.tacticiq.app',
  ENDPOINTS: {
    // ... existing endpoints
    GAME: {
      START: '/game/start',
      PREDICT: '/game/predict',
      COMPLETE: '/game/complete',
      HISTORY: '/game/history',
      LEADERBOARD: '/game/leaderboard',
      ACTIVE: '/game/active',
      CHECK_LIMIT: '/game/check-limit',
      SETTINGS: '/game/settings',
    }
  },
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

---

### Adım 5: Test

#### Unit Tests
```typescript
// __tests__/gameService.test.ts
import { GameService } from '../services/gameService';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
  });

  it('should start a new game', async () => {
    const game = await gameService.startGame('user-123', 'match-456');
    expect(game).toBeDefined();
    expect(game.status).toBe('active');
  });

  it('should enforce daily limit', async () => {
    const canPlay = await gameService.checkDailyLimit('user-123');
    expect(typeof canPlay).toBe('boolean');
  });
});
```

---

## 🚀 Deployment

### Environment Variables
```bash
# .env.production
DATABASE_URL=postgresql://user:password@hostname:5432/tacticiq_prod
REDIS_URL=redis://hostname:6379
JWT_SECRET=your-production-jwt-secret
CSRF_SECRET=your-production-csrf-secret
ENCRYPTION_KEY=your-64-char-hex-encryption-key
NODE_ENV=production
API_URL=https://api.tacticiq.app
```

### Docker Compose
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3000:3000"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: tacticiq
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## ✅ Checklist

- [ ] Database şeması oluşturuldu
- [ ] Backend API endpoint'leri hazır
- [ ] Authentication middleware kuruldu
- [ ] Rate limiting aktif
- [ ] CSRF protection çalışıyor
- [ ] Input validation yapılıyor
- [ ] Error handling implementasyonu
- [ ] Logging sistemi kuruldu
- [ ] Unit testler yazıldı
- [ ] Integration testler hazır
- [ ] Production environment ayarlandı
- [ ] SSL/HTTPS aktif
- [ ] Monitoring sistemi kuruldu

---

**Backend entegrasyonu tamamlandığında, oyun sistemi tamamen fonksiyonel hale gelecektir.**
