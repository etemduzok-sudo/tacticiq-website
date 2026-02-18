// TacticIQ - Minimalist Puanlama Sistemi Tipleri
// Puan skalası: 0 - ~5,000 (yıllık aktif kullanıcı)

/**
 * Analiz Odağı Türleri
 */
export type AnalysisFocusType = 
  | 'attack'    // ⚔️ Atak Odaklı
  | 'defense'   // 🛡️ Defans Odaklı
  | 'balanced'  // ⚖️ Dengeli
  | 'score'     // 🎯 Skor Odaklı
  | 'squad';    // 👥 Kadro Odaklı

/**
 * Analiz Odağı Çarpanları
 */
export const ANALYSIS_FOCUS_MULTIPLIERS: Record<AnalysisFocusType, {
  label: string;
  emoji: string;
  affectedCategories: string[];
  multiplier: number;
}> = {
  attack: {
    label: 'Atak Odaklı',
    emoji: '⚔️',
    affectedCategories: ['totalGoals', 'goalScorer', 'assist', 'attackFormation'],
    multiplier: 1.5,
  },
  defense: {
    label: 'Defans Odaklı',
    emoji: '🛡️',
    affectedCategories: ['defenseFormation', 'cleanSheet', 'goalsAgainst'],
    multiplier: 1.5,
  },
  balanced: {
    label: 'Dengeli',
    emoji: '⚖️',
    affectedCategories: ['all'],
    multiplier: 1.2,
  },
  score: {
    label: 'Skor Odaklı',
    emoji: '🎯',
    affectedCategories: ['exactScore', 'goalDifference', 'winner'],
    multiplier: 2.0,
  },
  squad: {
    label: 'Kadro Odaklı',
    emoji: '👥',
    affectedCategories: ['squadPlayers', 'formation'],
    multiplier: 1.8,
  },
};

/**
 * Temel Puan Değerleri (Minimalist)
 */
export const BASE_SCORES = {
  // Skor Tahminleri
  SCORE_EXACT: 10,           // Tam skor isabet (2-1 → 2-1)
  SCORE_GOAL_DIFF: 5,        // Gol farkı doğru (2-1 → 3-2)
  SCORE_WINNER: 2,           // Galibiyet doğru (2-1 → 1-0)
  
  // Toplam Gol
  TOTAL_GOALS_EXACT: 4,      // Tam isabet
  TOTAL_GOALS_CLOSE: 2,      // ±1 fark
  
  // Kadro Tahminleri
  SQUAD_PER_PLAYER: 0.5,     // Her doğru oyuncu (max 5.5)
  
  // Formasyon Tahminleri
  ATTACK_FORMATION_EXACT: 3, // Atak formasyonu tam
  ATTACK_FORMATION_SIMILAR: 1, // Benzer tip
  DEFENSE_FORMATION_EXACT: 2, // Defans formasyonu tam
  DEFENSE_FORMATION_SIMILAR: 0.5, // Benzer tip
  
  // Oyuncu Tahminleri
  PLAYER_GOAL: 3,            // Gol atacak
  PLAYER_ASSIST: 2.5,        // Asist yapacak
  PLAYER_YELLOW_CARD: 1.5,   // Sarı kart
  PLAYER_RED_CARD: 4,        // Kırmızı kart
  PLAYER_SUBSTITUTED: 1,     // Oyundan çıkacak
  PLAYER_MAN_OF_MATCH: 5,    // Maçın adamı
  PLAYER_PENALTY_TAKER: 2,   // Penaltı kullanacak
  PLAYER_PENALTY_SCORED: 3,  // Penaltı atacak
  PLAYER_PENALTY_MISSED: 6,  // Penaltı kaçıracak
};

/**
 * Zaman Bonusu Sistemi
 */
export const TIME_BONUS = {
  // Kadro açıklanmadan önce tahmin: +15% bonus
  BEFORE_LINEUP_ANNOUNCED: 1.15,
  // Kadro açıklandıktan sonra: standart
  AFTER_LINEUP_ANNOUNCED: 1.0,
  // Maç başlamadan son 2 saat: -10% ceza
  LAST_2_HOURS_PENALTY: 0.90,
};

/**
 * Seri Bonusları
 */
export const STREAK_BONUSES = {
  STREAK_3: 2,    // 3 maç üst üste skor bilme
  STREAK_5: 5,    // 5 maç üst üste
  STREAK_7: 10,   // 7 maç üst üste
  STREAK_10: 20,  // 10 maç üst üste + rozet
};

/**
 * Seviye Sistemi
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, maxPoints: 50, title: 'Çaylak', color: '#9CA3AF' },
  { level: 2, minPoints: 50, maxPoints: 150, title: 'Amatör', color: '#6B7280' },
  { level: 3, minPoints: 150, maxPoints: 300, title: 'Meraklı', color: '#3B82F6' },
  { level: 4, minPoints: 300, maxPoints: 500, title: 'Analist', color: '#10B981' },
  { level: 5, minPoints: 500, maxPoints: 800, title: 'Uzman', color: '#F59E0B' },
  { level: 6, minPoints: 800, maxPoints: 1200, title: 'Profesyonel', color: '#8B5CF6' },
  { level: 7, minPoints: 1200, maxPoints: 1800, title: 'Elit', color: '#EC4899' },
  { level: 8, minPoints: 1800, maxPoints: 2500, title: 'Efsane', color: '#EF4444' },
  { level: 9, minPoints: 2500, maxPoints: 3500, title: 'Grandmaster', color: '#C9A44C' },
  { level: 10, minPoints: 3500, maxPoints: Infinity, title: 'Hall of Fame', color: '#FFD700' },
];

/**
 * Maç Puanı Detayı
 */
export interface MatchScoreDetail {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  analysisFocus: AnalysisFocusType;
  
  // Temel puanlar
  baseScores: {
    scoreCorrect: number;
    totalGoalsCorrect: number;
    squadCorrect: number;
    attackFormationCorrect: number;
    defenseFormationCorrect: number;
  };
  
  // Oyuncu tahminleri
  playerPredictions: {
    playerId: number;
    playerName: string;
    predictionType: string;
    points: number;
    isCorrect: boolean;
  }[];
  
  // Çarpanlar
  multipliers: {
    analysisFocusMultiplier: number;
    timeBonusMultiplier: number;
    streakBonus: number;
  };
  
  // Toplam
  subtotalBase: number;
  subtotalPlayerPredictions: number;
  subtotalBonuses: number;
  totalScore: number;
  
  // Meta
  predictedAt: string;
  lineupAnnouncedAt?: string;
  matchStartedAt: string;
}

/**
 * Kullanıcı Puanlama Özeti
 */
export interface UserScoringProfile {
  userId: string;
  totalPoints: number;
  level: number;
  levelTitle: string;
  levelProgress: number; // 0-100%
  
  // Sıralamalar
  rankTurkey: number;
  rankWorld: number;
  totalUsersTurkey: number;
  totalUsersWorld: number;
  
  // Başarı oranları
  successRates: {
    score: number;      // Skor tahmin başarısı %
    squad: number;      // Kadro tahmin başarısı %
    player: number;     // Oyuncu tahmin başarısı %
  };
  
  // Aktif seri
  currentStreak: number;
  bestStreak: number;
  
  // Son maçlar
  recentMatches: MatchScoreDetail[];
}

/**
 * Oyuncu Tahmin Türleri (Penaltı dahil)
 */
export type PlayerPredictionType = 
  | 'goal'              // Gol atacak
  | 'assist'            // Asist yapacak
  | 'yellowCard'        // Sarı kart
  | 'redCard'           // Kırmızı kart (direkt veya 2. sarı)
  | 'substitutedOut'    // Oyundan çıkacak
  | 'manOfTheMatch'     // Maçın adamı
  | 'penaltyTaker'      // Penaltı kullanacak
  | 'penaltyScored'     // Penaltı atacak
  | 'penaltyMissed';    // Penaltı kaçıracak

/**
 * Oyuncu Tahmin Değerleri ve Puanları
 */
export const PLAYER_PREDICTION_CONFIG: Record<PlayerPredictionType, {
  label: string;
  emoji: string;
  points: number;
  description: string;
}> = {
  goal: {
    label: 'Gol Atacak',
    emoji: '⚽',
    points: BASE_SCORES.PLAYER_GOAL,
    description: 'Bu oyuncu maçta gol atacak',
  },
  assist: {
    label: 'Asist Yapacak',
    emoji: '🎯',
    points: BASE_SCORES.PLAYER_ASSIST,
    description: 'Bu oyuncu asist yapacak',
  },
  yellowCard: {
    label: 'Sarı Kart',
    emoji: '🟨',
    points: BASE_SCORES.PLAYER_YELLOW_CARD,
    description: 'Bu oyuncu sarı kart görecek',
  },
  redCard: {
    label: 'Kırmızı Kart',
    emoji: '🟥',
    points: BASE_SCORES.PLAYER_RED_CARD,
    description: 'Bu oyuncu kırmızı kart görecek',
  },
  substitutedOut: {
    label: 'Oyundan Çıkacak',
    emoji: '🔄',
    points: BASE_SCORES.PLAYER_SUBSTITUTED,
    description: 'Bu oyuncu değiştirilecek',
  },
  manOfTheMatch: {
    label: 'Maçın Adamı',
    emoji: '⭐',
    points: BASE_SCORES.PLAYER_MAN_OF_MATCH,
    description: 'Bu oyuncu maçın adamı olacak',
  },
  penaltyTaker: {
    label: 'Penaltı Kullanacak',
    emoji: '🥅',
    points: BASE_SCORES.PLAYER_PENALTY_TAKER,
    description: 'Bu oyuncu penaltı kullanacak',
  },
  penaltyScored: {
    label: 'Penaltı Atacak',
    emoji: '✅',
    points: BASE_SCORES.PLAYER_PENALTY_SCORED,
    description: 'Bu oyuncu penaltı atacak',
  },
  penaltyMissed: {
    label: 'Penaltı Kaçıracak',
    emoji: '❌',
    points: BASE_SCORES.PLAYER_PENALTY_MISSED,
    description: 'Bu oyuncu penaltı kaçıracak',
  },
};

/**
 * Sıralama Filtre Türleri
 */
export type LeaderboardFilterType = 
  | 'turkey'      // Türkiye sıralaması
  | 'world'       // Dünya sıralaması
  | 'team';       // Takım bazlı (favori takım)

/**
 * Sıralama Zaman Filtresi
 */
export type LeaderboardTimeFilter = 
  | 'all_time'    // Tüm zamanlar
  | 'this_week'   // Bu hafta
  | 'this_month'  // Bu ay
  | 'this_season'; // Bu sezon

/**
 * Sıralama Girişi
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalPoints: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  isPro: boolean;
  isCurrentUser: boolean;
  rankChange: number; // +/- son 7 günde değişim
}
