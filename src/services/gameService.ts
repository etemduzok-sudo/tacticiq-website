/**
 * Game Service
 * Oyun verilerini yönetir ve backend ile iletişim kurar
 * 
 * GÜVENLİK ÖNLEMLERİ:
 * - Input validation
 * - Rate limiting
 * - XSS protection
 * - CSRF token kontrolü
 */

import api from './apiService';
import { GameData, GamePrediction, LeaderboardEntry, GameSettings } from '@/contexts/AdminDataContext';

// Rate limiting için basit kontrol
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 dakika
const MAX_REQUESTS_PER_WINDOW = 30; // Dakikada max 30 istek

/**
 * Rate limiting kontrolü
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Eski istekleri temizle
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit aşıldı
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

/**
 * Input sanitization - XSS koruması
 */
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // HTML tag karakterlerini kaldır
      .trim()
      .substring(0, 1000); // Max 1000 karakter
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

/**
 * Yeni oyun başlat
 */
export async function startGame(userId: string, matchId: string): Promise<GameData> {
  // Rate limit kontrolü
  if (!checkRateLimit(userId)) {
    throw new Error('Too many requests. Please wait before starting a new game.');
  }

  // Input validation
  if (!userId || !matchId) {
    throw new Error('Invalid input: userId and matchId are required');
  }

  const sanitizedUserId = sanitizeInput(userId);
  const sanitizedMatchId = sanitizeInput(matchId);

  try {
    const response = await api.post('/game/start', {
      userId: sanitizedUserId,
      matchId: sanitizedMatchId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Start game error:', error);
    throw new Error(error.response?.data?.message || 'Failed to start game');
  }
}

/**
 * Tahmin kaydet
 */
export async function submitPrediction(
  gameId: string,
  prediction: GamePrediction
): Promise<{ success: boolean; score: number }> {
  // Input validation
  if (!gameId || !prediction || !prediction.category) {
    throw new Error('Invalid prediction data');
  }

  const sanitizedGameId = sanitizeInput(gameId);
  const sanitizedPrediction = sanitizeInput(prediction);

  try {
    const response = await api.post('/game/predict', {
      gameId: sanitizedGameId,
      prediction: sanitizedPrediction,
    });
    return response.data;
  } catch (error: any) {
    console.error('Submit prediction error:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit prediction');
  }
}

/**
 * Oyunu tamamla
 */
export async function completeGame(gameId: string): Promise<GameData> {
  if (!gameId) {
    throw new Error('Invalid gameId');
  }

  const sanitizedGameId = sanitizeInput(gameId);

  try {
    const response = await api.post('/game/complete', {
      gameId: sanitizedGameId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Complete game error:', error);
    throw new Error(error.response?.data?.message || 'Failed to complete game');
  }
}

/**
 * Kullanıcının oyun geçmişini getir
 */
export async function getUserGameHistory(userId: string, page = 1, limit = 10): Promise<GameData[]> {
  if (!userId) {
    throw new Error('Invalid userId');
  }

  const sanitizedUserId = sanitizeInput(userId);

  try {
    const response = await api.get('/game/history', {
      params: {
        userId: sanitizedUserId,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Get game history error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get game history');
  }
}

/**
 * Liderlik tablosunu getir
 */
export async function getLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'weekly',
  limit = 100
): Promise<LeaderboardEntry[]> {
  try {
    const response = await api.get('/game/leaderboard', {
      params: { period, limit },
    });
    return response.data;
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get leaderboard');
  }
}

/**
 * Aktif oyunu getir
 */
export async function getActiveGame(userId: string): Promise<GameData | null> {
  if (!userId) {
    throw new Error('Invalid userId');
  }

  const sanitizedUserId = sanitizeInput(userId);

  try {
    const response = await api.get('/game/active', {
      params: { userId: sanitizedUserId },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Aktif oyun yok
    }
    console.error('Get active game error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get active game');
  }
}

/**
 * Oyun ayarlarını getir
 */
export async function getGameSettings(): Promise<GameSettings> {
  try {
    const response = await api.get('/game/settings');
    return response.data;
  } catch (error: any) {
    console.error('Get game settings error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get game settings');
  }
}

/**
 * Oyun ayarlarını güncelle (Admin only)
 */
export async function updateGameSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
  const sanitizedSettings = sanitizeInput(settings);

  try {
    const response = await api.put('/game/settings', sanitizedSettings);
    return response.data;
  } catch (error: any) {
    console.error('Update game settings error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update game settings');
  }
}

/**
 * Maç verilerini getir
 */
export async function getMatchData(matchId: string): Promise<any> {
  if (!matchId) {
    throw new Error('Invalid matchId');
  }

  const sanitizedMatchId = sanitizeInput(matchId);

  try {
    const response = await api.get(`/game/match/${sanitizedMatchId}`);
    return response.data;
  } catch (error: any) {
    console.error('Get match data error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get match data');
  }
}

/**
 * Kullanıcının günlük oyun limitini kontrol et
 */
export async function checkDailyLimit(userId: string): Promise<{ canPlay: boolean; remaining: number }> {
  if (!userId) {
    throw new Error('Invalid userId');
  }

  const sanitizedUserId = sanitizeInput(userId);

  try {
    const response = await api.get('/game/check-limit', {
      params: { userId: sanitizedUserId },
    });
    return response.data;
  } catch (error: any) {
    console.error('Check daily limit error:', error);
    throw new Error(error.response?.data?.message || 'Failed to check daily limit');
  }
}

export default {
  startGame,
  submitPrediction,
  completeGame,
  getUserGameHistory,
  getLeaderboard,
  getActiveGame,
  getGameSettings,
  updateGameSettings,
  getMatchData,
  checkDailyLimit,
};
