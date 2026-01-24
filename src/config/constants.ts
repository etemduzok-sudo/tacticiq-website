// Application Constants
// TacticIQ - Centralized Constants Management

/**
 * Scoring Constants
 * All point values and multipliers
 */
export const SCORING = {
  // Base points by difficulty
  BASE_POINTS: {
    VERY_EASY: 5,
    EASY: 10,
    MEDIUM: 20,
    HARD: 30,
    VERY_HARD: 50,
    EXPERT: 100,
  },
  
  // Focus multipliers
  FOCUS: {
    CORRECT: 2.0,   // 2x points if correct
    WRONG: -1.5,    // -1.5x penalty if wrong
    MAX_FOCUS: 3,   // Maximum 3 focused predictions
  },
  
  // Training multipliers
  TRAINING: {
    DEFENSE: {
      DISCIPLINE: 1.2,
      PHYSICAL: 1.2,
    },
    ATTACK: {
      TEMPO: 1.2,
      INDIVIDUAL: 1.2,
    },
    MIDFIELD: {
      TEMPO: 1.15,
      DISCIPLINE: 1.15,
    },
    PHYSICAL: {
      PHYSICAL: 1.25,
    },
    TACTICAL: {
      TEMPO: 1.15,
      INDIVIDUAL: 1.15,
    },
  },
  
  // Accuracy bonuses
  ACCURACY_BONUS: {
    PERFECT: 100,     // 100% accuracy
    EXCELLENT: 50,    // 90%+ accuracy
    GOOD: 25,         // 80%+ accuracy
    DECENT: 10,       // 70%+ accuracy
  },
  
  // Streak bonuses
  STREAK_BONUS: {
    5: 50,
    10: 150,
    20: 500,
    50: 2000,
  },
};

/**
 * UI Constants
 * Colors, sizes, animations
 */
export const UI = {
  // Animation durations (ms)
  ANIMATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Delays (ms)
  DELAY: {
    SHORT: 100,
    MEDIUM: 300,
    LONG: 500,
  },
  
  // Refresh intervals (ms)
  REFRESH: {
    LIVE_MATCHES: 30000,      // 30 seconds
    UPCOMING_MATCHES: 300000,  // 5 minutes
    LEADERBOARD: 60000,        // 1 minute
  },
  
  // Pagination
  ITEMS_PER_PAGE: {
    MATCHES: 20,
    PREDICTIONS: 10,
    LEADERBOARD: 50,
  },
};

/**
 * Text Constants
 * All user-facing text
 */
export const TEXT = {
  // App name
  APP_NAME: 'TacticIQ',
  
  // Error messages
  ERRORS: {
    NETWORK: 'İnternet bağlantısı kurulamadı',
    API: 'Veriler yüklenemedi. Lütfen tekrar deneyin.',
    AUTH: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
    VALIDATION: 'Lütfen tüm alanları doldurun',
    UNKNOWN: 'Bir hata oluştu. Lütfen tekrar deneyin.',
  },
  
  // Success messages
  SUCCESS: {
    PREDICTION_SAVED: 'Tahminler başarıyla kaydedildi!',
    PROFILE_UPDATED: 'Profil güncellendi',
    SETTINGS_SAVED: 'Ayarlar kaydedildi',
  },
  
  // Confirmation messages
  CONFIRM: {
    DELETE_ACCOUNT: 'Hesabınızı silmek istediğinizden emin misiniz?',
    LOGOUT: 'Çıkış yapmak istediğinizden emin misiniz?',
    RESET_PREDICTIONS: 'Tüm tahminleri sıfırlamak istediğinizden emin misiniz?',
  },
  
  // Loading messages
  LOADING: {
    MATCHES: 'Maçlar yükleniyor...',
    PREDICTIONS: 'Tahminler yükleniyor...',
    PROFILE: 'Profil yükleniyor...',
    GENERAL: 'Yükleniyor...',
  },
  
  // Empty states
  EMPTY: {
    MATCHES: 'Bugün maç bulunamadı',
    PREDICTIONS: 'Henüz tahmin yapmadınız',
    NOTIFICATIONS: 'Bildirim yok',
    ACHIEVEMENTS: 'Henüz başarı kazanmadınız',
  },
  
  // Analyst notes templates
  ANALYST_NOTES: {
    TEMPO_FLOW: {
      GOOD: [
        'Bugün tempoyu harika okudun! 🎯',
        'Maçın akışını mükemmel tahmin ettin! ⚡',
        'Tempo analizi çok güçlü! 🔥',
      ],
      BAD: [
        'Tempo tahminlerinde zayıf kaldın. 📉',
        'Maçın akışını okumakta zorlandın. 🤔',
        'Tempo analizi geliştirilmeli. 💡',
      ],
    },
    PHYSICAL_FATIGUE: {
      GOOD: [
        'Fiziksel durumu çok iyi değerlendirdin! 💪',
        'Oyuncu yıpranmasını mükemmel öngördün! 🏃',
        'Sakatlık ve değişiklik tahminleri harika! ⚕️',
      ],
      BAD: [
        'Fiziksel durum tahminleri zayıf. 😓',
        'Oyuncu yıpranmasını okuyamadın. 🤕',
        'Sakatlık tahminlerinde gelişim gerekli. 📊',
      ],
    },
    DISCIPLINE: {
      GOOD: [
        'Kart tahminleri mükemmel! 🟨🟥',
        'Disiplin analizinde çok başarılısın! 👏',
        'Hakem kararlarını harika öngördün! ⚖️',
      ],
      BAD: [
        'Kart tahminlerinde zayıf kaldın. 🟨',
        'Disiplin analizini geliştir. 📝',
        'Hakem kararlarını okumakta zorlandın. 🤷',
      ],
    },
    INDIVIDUAL: {
      GOOD: [
        'Bireysel performans tahminleri harika! ⭐',
        'Oyuncu analizinde çok güçlüsün! 🎖️',
        'Gol ve asist tahminleri mükemmel! ⚽',
      ],
      BAD: [
        'Bireysel performans tahminleri zayıf. 😔',
        'Oyuncu analizini geliştirmelisin. 📈',
        'Gol ve asist tahminlerinde gelişim gerekli. 🎯',
      ],
    },
  },
};

/**
 * Time Constants
 */
export const TIME = {
  // Cache durations (seconds)
  CACHE: {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 1800,       // 30 minutes
    VERY_LONG: 3600,  // 1 hour
  },
  
  // Countdown thresholds
  COUNTDOWN: {
    URGENT: 3600,     // 1 hour
    SOON: 86400,      // 24 hours
    UPCOMING: 604800, // 7 days
  },
};

/**
 * Storage Keys
 * AsyncStorage keys
 */
export const STORAGE_KEYS = {
  USER: 'tacticiq-user',
  LANGUAGE: 'tacticiq-language',
  THEME: 'tacticiq-theme',
  FAVORITE_TEAMS: 'tacticiq-favorite-clubs',
  FAVORITE_CLUBS: 'tacticiq-favorite-clubs', // Alias for FAVORITE_TEAMS
  PREDICTIONS: 'tacticiq-predictions-',  // Append matchId
  RATINGS: 'tacticiq-ratings-',          // Append matchId
  ONBOARDING: 'tacticiq-onboarding-complete',
  PRO_STATUS: 'tacticiq-pro-status',
  PROFILE_SETUP: 'tacticiq-profile-setup',
};

/**
 * Validation Rules
 */
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 50,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};

/**
 * External Links
 */
export const LINKS = {
  PRIVACY_POLICY: 'https://tacticiq.com/privacy',
  TERMS_OF_SERVICE: 'https://tacticiq.com/terms',
  SUPPORT: 'https://tacticiq.com/support',
  GITHUB: 'https://github.com/tacticiq',
};

/**
 * Ad Configuration
 */
export const ADS = {
  ENABLED: true,
  FREQUENCY: {
    MATCHES: 5,  // Show ad every 5 matches
    PREDICTIONS: 3,  // Show ad every 3 predictions
  },
  POSITIONS: ['top', 'bottom', 'middle'] as const,
};
