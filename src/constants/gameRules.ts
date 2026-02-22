// Game Rules & Business Logic Constants
// TacticIQ - Centralized Game Rules
// KAYNAK: Backend scoringService.js - Frontend sadece gösterir

/**
 * PUANLAMA KURALLARI - 1000 Tam Puan Sistemi
 * Gerçek hesaplama backend'de yapılır.
 * Bu değerler UI'da zorluk göstergesi ve puan önizleme içindir.
 */

// Base Points (Zorluk Seviyesine Göre)
export const BASE_POINTS = {
  TRIVIAL: 10,       // Çok kolay (örn: maç sonucu)
  VERY_EASY: 20,     // Kolay (örn: toplam gol aralığı)
  EASY: 30,          // Kolay (örn: sarı kart sayısı)
  MEDIUM: 40,        // Orta (örn: ilk gol dakikası)
  HARD: 60,          // Zor (örn: gol atan oyuncu)
  VERY_HARD: 100,    // Çok zor (örn: maçın adamı)
  EXPERT: 150,       // Uzman (örn: penaltı + dakika)
} as const;

// Prediction Difficulty Mapping
export const PREDICTION_DIFFICULTY = {
  // Match Outcome
  matchResult: BASE_POINTS.TRIVIAL,
  
  // Goals
  totalGoals: BASE_POINTS.VERY_EASY,
  firstHalfHomeScore: BASE_POINTS.MEDIUM,
  firstHalfAwayScore: BASE_POINTS.MEDIUM,
  secondHalfHomeScore: BASE_POINTS.MEDIUM,
  secondHalfAwayScore: BASE_POINTS.MEDIUM,
  firstGoalTime: BASE_POINTS.MEDIUM,
  
  // Cards
  yellowCards: BASE_POINTS.EASY,
  redCards: BASE_POINTS.HARD,
  
  // Match Stats
  possession: BASE_POINTS.VERY_EASY,
  totalShots: BASE_POINTS.MEDIUM,
  shotsOnTarget: BASE_POINTS.MEDIUM,
  totalCorners: BASE_POINTS.MEDIUM,
  
  // Injury Time
  firstHalfInjuryTime: BASE_POINTS.MEDIUM,
  secondHalfInjuryTime: BASE_POINTS.MEDIUM,
  
  // Tempo & Scenario
  tempo: BASE_POINTS.EASY,
  scenario: BASE_POINTS.EASY,
  
  // Player Predictions
  goalScorer: BASE_POINTS.HARD,
  assistProvider: BASE_POINTS.HARD,
  yellowCard: BASE_POINTS.HARD,
  redCard: BASE_POINTS.VERY_HARD,
  secondYellowRed: BASE_POINTS.EXPERT,
  injury: BASE_POINTS.VERY_HARD,
  substitutePlayer: BASE_POINTS.HARD,
  injurySubstitutePlayer: BASE_POINTS.VERY_HARD,
  manOfTheMatch: BASE_POINTS.VERY_HARD,
} as const;

/**
 * 🎯 ODAK SİSTEMİ (FOCUS/STAR)
 */
export const FOCUS_RULES = {
  MAX_FOCUSED_PREDICTIONS: 3,
  CORRECT_MULTIPLIER: 2.0,      // Doğru tahmin: 2x puan
  WRONG_MULTIPLIER: -1.5,       // Yanlış tahmin: -1.5x ceza
  MIN_PREDICTIONS_FOR_FOCUS: 5, // En az 5 tahmin yapılmalı
} as const;

/**
 * 🏋️ ANTRENMAn ÇARPANLARI
 */
export const TRAINING_MULTIPLIERS = {
  defense: {
    discipline: 1.20,    // Disiplin +20%
    physical: 1.20,      // Fiziksel +20%
  },
  attack: {
    tempo: 1.20,         // Tempo +20%
    individual: 1.20,    // Bireysel +20%
  },
  midfield: {
    tempo: 1.15,         // Tempo +15%
    discipline: 1.15,    // Disiplin +15%
  },
  physical: {
    physical: 1.25,      // Fiziksel +25%
  },
  tactical: {
    tempo: 1.15,         // Tempo +15%
    individual: 1.15,    // Bireysel +15%
  },
} as const;

/**
 * 🎖️ BONUS SİSTEMİ
 */
export const BONUS_RULES = {
  // Accuracy Bonuses
  accuracy: {
    PERFECT: { threshold: 100, bonus: 100 },      // %100 doğruluk
    EXCELLENT: { threshold: 90, bonus: 50 },      // %90+ doğruluk
    GOOD: { threshold: 80, bonus: 25 },           // %80+ doğruluk
    DECENT: { threshold: 70, bonus: 10 },         // %70+ doğruluk
  },
  
  // Streak Bonuses (Ardışık doğru tahminler)
  streak: {
    5: 50,
    10: 150,
    20: 500,
    50: 2000,
    100: 10000,
  },
  
  // Daily Bonus
  dailyLogin: 10,
  
  // First Prediction Bonus
  firstPredictionOfDay: 20,
} as const;

/**
 * ⏱️ ZAMAN KURALLARI
 */
export const TIME_RULES = {
  // Tahmin yapma süresi (maç başlangıcından önce)
  PREDICTION_DEADLINE_MINUTES: 5,
  
  // Dakika sapma toleransı (örn: "35. dakika" tahmini için ±5 dk)
  MINUTE_TOLERANCE: 5,
  
  // Maç güncellemesi aralığı (canlı maçlar)
  LIVE_MATCH_UPDATE_INTERVAL_MS: 30000, // 30 saniye
  
  // Cache süresi
  CACHE_DURATION_MINUTES: 30,
} as const;

/**
 * 📊 SKOR HESAPLAMA KURALLARI
 */
export const SCORING_RULES = {
  // Minimum tahmin sayısı
  MIN_PREDICTIONS_FOR_SCORING: 3,
  
  // Maksimum puan limiti (tek maç)
  MAX_POINTS_PER_MATCH: 1000,
  
  // Negatif puan limiti
  MIN_POINTS_PER_MATCH: -500,
  
  // Cluster ağırlıkları (toplam 100%)
  clusterWeights: {
    tempo: 25,        // %25
    physical: 25,     // %25
    discipline: 25,   // %25
    individual: 25,   // %25
  },
} as const;

/**
 * 🎮 OYUN LİMİTLERİ
 */
export const GAME_LIMITS = {
  // Tahmin limitleri
  MAX_PREDICTIONS_PER_MATCH: 50,
  MAX_ACTIVE_PREDICTIONS: 100,
  MAX_PLAYER_PREDICTIONS: 11,  // Maksimum 11 oyuncu tahmini
  
  // Kadro limitleri
  MIN_PLAYERS_IN_LINEUP: 11,
  MAX_SUBSTITUTES: 7,
  
  // Lig limitleri
  MAX_FAVORITE_TEAMS: 5,
  MIN_FAVORITE_TEAMS: 1,
} as const;

/**
 * 📈 LEADERBOARD KURALLARI
 */
export const LEADERBOARD_RULES = {
  // Sıralama kriterleri ağırlıkları
  weights: {
    totalPoints: 0.50,      // %50 - Toplam puan
    accuracy: 0.30,         // %30 - Doğruluk oranı
    streak: 0.20,           // %20 - Seri
  },
  
  // Minimum tahmin sayısı (leaderboard'a girmek için)
  MIN_PREDICTIONS_FOR_LEADERBOARD: 10,
  
  // Gösterilecek kullanıcı sayısı
  TOP_USERS_COUNT: 100,
  
  // Haftalık/aylık reset
  WEEKLY_RESET_DAY: 1, // Pazartesi
} as const;

/**
 * 🏆 BAŞARI SİSTEMİ (ACHIEVEMENTS)
 */
export const ACHIEVEMENTS = {
  firstPrediction: {
    id: 'first_prediction',
    title: 'İlk Tahmin',
    description: 'İlk tahminini yaptın!',
    points: 10,
  },
  perfectMatch: {
    id: 'perfect_match',
    title: 'Mükemmel Maç',
    description: 'Bir maçta tüm tahminleri doğru yaptın!',
    points: 500,
  },
  streak10: {
    id: 'streak_10',
    title: '10 Seri',
    description: '10 ardışık doğru tahmin!',
    points: 150,
  },
  weeklyChampion: {
    id: 'weekly_champion',
    title: 'Haftalık Şampiyon',
    description: 'Haftalık liderlik tablosunda 1. oldun!',
    points: 1000,
  },
} as const;

/**
 * 🎨 UI KURALLARI
 */
export const UI_RULES = {
  // Animasyon süreleri (ms)
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast mesaj süreleri (ms)
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
  },
  
  // Pagination
  ITEMS_PER_PAGE: {
    MATCHES: 20,
    PREDICTIONS: 10,
    LEADERBOARD: 50,
  },
} as const;

/**
 * 🔢 VALIDATION KURALLARI
 */
export const VALIDATION_RULES = {
  // Skor limitleri
  MIN_SCORE: 0,
  MAX_SCORE: 20,
  
  // Dakika limitleri
  MIN_MINUTE: 0,
  MAX_MINUTE: 120,
  
  // Kart limitleri
  MIN_CARDS: 0,
  MAX_YELLOW_CARDS: 15,
  MAX_RED_CARDS: 5,
  
  // Possession limitleri
  MIN_POSSESSION: 0,
  MAX_POSSESSION: 100,
  
  // Shot limitleri
  MIN_SHOTS: 0,
  MAX_SHOTS: 50,
  
  // Corner limitleri
  MIN_CORNERS: 0,
  MAX_CORNERS: 30,
} as const;

/**
 * 💰 PRO ÖZELLİKLERİ
 */
export const PRO_FEATURES = {
  // Pro kullanıcı avantajları
  EXTRA_FOCUS_SLOTS: 2,           // +2 odak slotu (toplam 5)
  PREDICTION_EDIT_TIME_MINUTES: 10, // Tahmin düzenleme süresi
  ADVANCED_STATS: true,            // Gelişmiş istatistikler
  NO_ADS: true,                    // Reklamsız deneyim
  CUSTOM_THEMES: true,             // Özel temalar
  PRIORITY_SUPPORT: true,          // Öncelikli destek
} as const;

/**
 * 📱 PLATFORM KURALLARI
 */
export const PLATFORM_RULES = {
  // Minimum desteklenen versiyonlar
  MIN_IOS_VERSION: '13.0',
  MIN_ANDROID_VERSION: '8.0',
  
  // Önerilen RAM
  RECOMMENDED_RAM_MB: 2048,
  
  // Maksimum cache boyutu
  MAX_CACHE_SIZE_MB: 100,
} as const;

// Type exports for TypeScript
export type PredictionCategory = keyof typeof PREDICTION_DIFFICULTY;
export type TrainingType = keyof typeof TRAINING_MULTIPLIERS;
export type BonusType = keyof typeof BONUS_RULES;
