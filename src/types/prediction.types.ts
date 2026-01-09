// Prediction System Types - Strategic Focus & Transparent Scoring
// Fan Manager 2026

/**
 * 4 Ana Analiz Kümesi (Analysis Clusters)
 */
export enum AnalysisCluster {
  TEMPO_FLOW = 'tempo_flow',           // Tempo & Akış
  PHYSICAL_FATIGUE = 'physical_fatigue', // Fiziksel & Yıpranma
  DISCIPLINE = 'discipline',            // Disiplin
  INDIVIDUAL = 'individual',            // Bireysel Performans
}

/**
 * Antrenman Tipleri ve Çarpanları
 */
export enum TrainingType {
  DEFENSE = 'defense',     // Savunma Antrenmanı
  ATTACK = 'attack',       // Hücum Antrenmanı
  MIDFIELD = 'midfield',   // Orta Saha Antrenmanı
  PHYSICAL = 'physical',   // Fiziksel Antrenman
  TACTICAL = 'tactical',   // Taktik Antrenman
}

/**
 * Antrenman çarpanları (multipliers)
 */
export const TRAINING_MULTIPLIERS: Record<TrainingType, Partial<Record<AnalysisCluster, number>>> = {
  [TrainingType.DEFENSE]: {
    [AnalysisCluster.DISCIPLINE]: 1.2,      // +20% Disiplin puanı
    [AnalysisCluster.PHYSICAL_FATIGUE]: 1.2, // +20% Fiziksel puanı
  },
  [TrainingType.ATTACK]: {
    [AnalysisCluster.TEMPO_FLOW]: 1.2,      // +20% Tempo puanı
    [AnalysisCluster.INDIVIDUAL]: 1.2,      // +20% Bireysel puanı
  },
  [TrainingType.MIDFIELD]: {
    [AnalysisCluster.TEMPO_FLOW]: 1.15,     // +15% Tempo puanı
    [AnalysisCluster.DISCIPLINE]: 1.15,     // +15% Disiplin puanı
  },
  [TrainingType.PHYSICAL]: {
    [AnalysisCluster.PHYSICAL_FATIGUE]: 1.25, // +25% Fiziksel puanı
  },
  [TrainingType.TACTICAL]: {
    [AnalysisCluster.TEMPO_FLOW]: 1.15,     // +15% Tempo puanı
    [AnalysisCluster.INDIVIDUAL]: 1.15,     // +15% Bireysel puanı
  },
};

/**
 * Tahmin kategorilerinin analiz kümelerine göre gruplandırılması
 */
export const PREDICTION_CLUSTERS: Record<string, AnalysisCluster> = {
  // TEMPO & FLOW (Tempo & Akış)
  'firstGoalTime': AnalysisCluster.TEMPO_FLOW,
  'firstHalfInjuryTime': AnalysisCluster.TEMPO_FLOW,
  'secondHalfInjuryTime': AnalysisCluster.TEMPO_FLOW,
  'tempo': AnalysisCluster.TEMPO_FLOW,
  'scenario': AnalysisCluster.TEMPO_FLOW,
  'totalGoals': AnalysisCluster.TEMPO_FLOW,
  
  // PHYSICAL & FATIGUE (Fiziksel & Yıpranma)
  'injury': AnalysisCluster.PHYSICAL_FATIGUE,
  'injurySubstitutePlayer': AnalysisCluster.PHYSICAL_FATIGUE,
  'substitutePlayer': AnalysisCluster.PHYSICAL_FATIGUE,
  'substitution': AnalysisCluster.PHYSICAL_FATIGUE,
  
  // DISCIPLINE (Disiplin)
  'yellowCard': AnalysisCluster.DISCIPLINE,
  'redCard': AnalysisCluster.DISCIPLINE,
  'secondYellowRed': AnalysisCluster.DISCIPLINE,
  'yellowCards': AnalysisCluster.DISCIPLINE,
  'redCards': AnalysisCluster.DISCIPLINE,
  'penalty': AnalysisCluster.DISCIPLINE,
  
  // INDIVIDUAL PERFORMANCE (Bireysel Performans)
  'manOfTheMatch': AnalysisCluster.INDIVIDUAL,
  'goalScorer': AnalysisCluster.INDIVIDUAL,
  'assist': AnalysisCluster.INDIVIDUAL,
  'firstHalfHomeScore': AnalysisCluster.INDIVIDUAL,
  'firstHalfAwayScore': AnalysisCluster.INDIVIDUAL,
  'secondHalfHomeScore': AnalysisCluster.INDIVIDUAL,
  'secondHalfAwayScore': AnalysisCluster.INDIVIDUAL,
};

/**
 * Odak (Focus/Star) sistemi için tip
 */
export interface FocusPrediction {
  category: string;
  playerId?: number;
  isFocused: boolean;
}

/**
 * Tahmin puanı detayı
 */
export interface PredictionScore {
  category: string;
  cluster: AnalysisCluster;
  basePoints: number;
  trainingMultiplier: number;
  focusMultiplier: number; // 2x if correct, -1.5x if wrong
  finalPoints: number;
  isCorrect: boolean;
  isFocused: boolean;
}

/**
 * Küme bazlı puan özeti
 */
export interface ClusterScore {
  cluster: AnalysisCluster;
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number; // %
}

/**
 * Maç sonu analiz raporu
 */
export interface MatchAnalysisReport {
  totalPoints: number;
  clusterScores: ClusterScore[];
  bestCluster: AnalysisCluster;
  worstCluster: AnalysisCluster;
  analystNote: string;
  focusedPredictions: {
    correct: number;
    wrong: number;
    total: number;
  };
}

/**
 * Analist notları (dinamik mesajlar)
 */
export const ANALYST_NOTES: Record<AnalysisCluster, { good: string[]; bad: string[] }> = {
  [AnalysisCluster.TEMPO_FLOW]: {
    good: [
      'Bugün tempoyu harika okudun! 🎯',
      'Maçın akışını mükemmel tahmin ettin! ⚡',
      'Tempo analizi çok güçlü! 🔥',
    ],
    bad: [
      'Tempo tahminlerinde zayıf kaldın. 📉',
      'Maçın akışını okumakta zorlandın. 🤔',
      'Tempo analizi geliştirilmeli. 💡',
    ],
  },
  [AnalysisCluster.PHYSICAL_FATIGUE]: {
    good: [
      'Fiziksel durumu çok iyi değerlendirdin! 💪',
      'Oyuncu yıpranmasını mükemmel öngördün! 🏃',
      'Sakatlık ve değişiklik tahminleri harika! ⚕️',
    ],
    bad: [
      'Fiziksel durum tahminleri zayıf. 😓',
      'Oyuncu yıpranmasını okuyamadın. 🤕',
      'Sakatlık tahminlerinde gelişim gerekli. 📊',
    ],
  },
  [AnalysisCluster.DISCIPLINE]: {
    good: [
      'Kart tahminleri mükemmel! 🟨🟥',
      'Disiplin analizinde çok başarılısın! 👏',
      'Hakem kararlarını harika öngördün! ⚖️',
    ],
    bad: [
      'Kart tahminlerinde zayıf kaldın. 🟨',
      'Disiplin analizini geliştir. 📝',
      'Hakem kararlarını okumakta zorlandın. 🤷',
    ],
  },
  [AnalysisCluster.INDIVIDUAL]: {
    good: [
      'Bireysel performans tahminleri harika! ⭐',
      'Oyuncu analizinde çok güçlüsün! 🎖️',
      'Gol ve asist tahminleri mükemmel! ⚽',
    ],
    bad: [
      'Bireysel performans tahminleri zayıf. 😔',
      'Oyuncu analizini geliştirmelisin. 📈',
      'Gol ve asist tahminlerinde gelişim gerekli. 🎯',
    ],
  },
};

/**
 * Puan hesaplama sabitleri
 */
export const SCORING_CONSTANTS = {
  BASE_POINTS: {
    EASY: 10,      // Kolay tahminler (ör: toplam gol)
    MEDIUM: 20,    // Orta zorluk (ör: ilk gol dakikası)
    HARD: 30,      // Zor tahminler (ör: spesifik oyuncu)
    VERY_HARD: 50, // Çok zor (ör: maçın adamı)
  },
  FOCUS_MULTIPLIER: {
    CORRECT: 2.0,   // Odaklanılan tahmin doğruysa 2x
    WRONG: -1.5,    // Odaklanılan tahmin yanlışsa -1.5x (ceza)
  },
  MAX_FOCUS: 3,     // Maksimum 3 tahmin odaklanabilir
};
