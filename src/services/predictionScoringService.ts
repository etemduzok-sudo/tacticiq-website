// Prediction Scoring Service - Strategic Focus & Transparent Scoring
// Fan Manager 2026

import {
  AnalysisCluster,
  TrainingType,
  TRAINING_MULTIPLIERS,
  PREDICTION_CLUSTERS,
  PredictionScore,
  ClusterScore,
  MatchAnalysisReport,
  ANALYST_NOTES,
  SCORING_CONSTANTS,
  FocusPrediction,
} from '../types/prediction.types';

/**
 * Tahmin kategorisinin hangi kümeye ait olduğunu döndürür
 */
export function getCategoryCluster(category: string): AnalysisCluster {
  return PREDICTION_CLUSTERS[category] || AnalysisCluster.TEMPO_FLOW;
}

/**
 * Antrenman tipine göre küme çarpanını döndürür
 */
export function getTrainingMultiplier(
  trainingType: TrainingType | null,
  cluster: AnalysisCluster
): number {
  if (!trainingType) return 1.0;
  return TRAINING_MULTIPLIERS[trainingType]?.[cluster] || 1.0;
}

/**
 * Odak (Focus) çarpanını hesaplar
 */
export function getFocusMultiplier(isFocused: boolean, isCorrect: boolean): number {
  if (!isFocused) return 1.0;
  return isCorrect 
    ? SCORING_CONSTANTS.FOCUS_MULTIPLIER.CORRECT 
    : SCORING_CONSTANTS.FOCUS_MULTIPLIER.WRONG;
}

/**
 * Tahmin kategorisinin baz puanını döndürür
 */
export function getBasePoints(category: string): number {
  // Kolay tahminler
  const easyCategories = ['totalGoals', 'tempo', 'scenario', 'yellowCards'];
  if (easyCategories.includes(category)) {
    return SCORING_CONSTANTS.BASE_POINTS.EASY;
  }
  
  // Orta zorluk
  const mediumCategories = ['firstGoalTime', 'firstHalfInjuryTime', 'secondHalfInjuryTime', 'redCards'];
  if (mediumCategories.includes(category)) {
    return SCORING_CONSTANTS.BASE_POINTS.MEDIUM;
  }
  
  // Zor tahminler
  const hardCategories = ['goalScorer', 'assist', 'injury', 'substitutePlayer'];
  if (hardCategories.includes(category)) {
    return SCORING_CONSTANTS.BASE_POINTS.HARD;
  }
  
  // Çok zor tahminler
  const veryHardCategories = ['manOfTheMatch', 'penalty', 'secondYellowRed'];
  if (veryHardCategories.includes(category)) {
    return SCORING_CONSTANTS.BASE_POINTS.VERY_HARD;
  }
  
  return SCORING_CONSTANTS.BASE_POINTS.MEDIUM; // Default
}

/**
 * Tek bir tahminin puanını hesaplar
 */
export function calculatePredictionScore(
  category: string,
  isCorrect: boolean,
  trainingType: TrainingType | null,
  isFocused: boolean
): PredictionScore {
  const cluster = getCategoryCluster(category);
  const basePoints = getBasePoints(category);
  const trainingMultiplier = getTrainingMultiplier(trainingType, cluster);
  const focusMultiplier = getFocusMultiplier(isFocused, isCorrect);
  
  // Final puan hesaplama
  let finalPoints = basePoints * trainingMultiplier * focusMultiplier;
  
  // Yanlış tahminlerde puan vermeme (odaklanılmamışsa)
  if (!isCorrect && !isFocused) {
    finalPoints = 0;
  }
  
  return {
    category,
    cluster,
    basePoints,
    trainingMultiplier,
    focusMultiplier,
    finalPoints: Math.round(finalPoints),
    isCorrect,
    isFocused,
  };
}

/**
 * Tüm tahminlerin puanlarını hesaplar
 */
export function calculateAllScores(
  predictions: Record<string, any>,
  actualResults: Record<string, any>,
  trainingType: TrainingType | null,
  focusedPredictions: FocusPrediction[]
): PredictionScore[] {
  const scores: PredictionScore[] = [];
  
  Object.keys(predictions).forEach(category => {
    const predicted = predictions[category];
    const actual = actualResults[category];
    
    if (predicted === null || predicted === undefined) return;
    
    const isCorrect = predicted === actual;
    const isFocused = focusedPredictions.some(fp => fp.category === category && fp.isFocused);
    
    const score = calculatePredictionScore(category, isCorrect, trainingType, isFocused);
    scores.push(score);
  });
  
  return scores;
}

/**
 * Küme bazlı puan özetini oluşturur
 */
export function calculateClusterScores(scores: PredictionScore[]): ClusterScore[] {
  const clusterMap = new Map<AnalysisCluster, ClusterScore>();
  
  // Initialize clusters
  Object.values(AnalysisCluster).forEach(cluster => {
    clusterMap.set(cluster, {
      cluster,
      totalPoints: 0,
      correctPredictions: 0,
      totalPredictions: 0,
      accuracy: 0,
    });
  });
  
  // Aggregate scores by cluster
  scores.forEach(score => {
    const clusterScore = clusterMap.get(score.cluster)!;
    clusterScore.totalPoints += score.finalPoints;
    clusterScore.totalPredictions += 1;
    if (score.isCorrect) {
      clusterScore.correctPredictions += 1;
    }
  });
  
  // Calculate accuracy
  clusterMap.forEach(clusterScore => {
    if (clusterScore.totalPredictions > 0) {
      clusterScore.accuracy = Math.round(
        (clusterScore.correctPredictions / clusterScore.totalPredictions) * 100
      );
    }
  });
  
  return Array.from(clusterMap.values()).filter(cs => cs.totalPredictions > 0);
}

/**
 * En iyi ve en kötü kümeyi bulur
 */
export function findBestAndWorstClusters(clusterScores: ClusterScore[]): {
  best: AnalysisCluster;
  worst: AnalysisCluster;
} {
  if (clusterScores.length === 0) {
    return {
      best: AnalysisCluster.TEMPO_FLOW,
      worst: AnalysisCluster.TEMPO_FLOW,
    };
  }
  
  const sorted = [...clusterScores].sort((a, b) => b.accuracy - a.accuracy);
  
  return {
    best: sorted[0].cluster,
    worst: sorted[sorted.length - 1].cluster,
  };
}

/**
 * Dinamik analist notu oluşturur
 */
export function generateAnalystNote(
  bestCluster: AnalysisCluster,
  worstCluster: AnalysisCluster,
  overallAccuracy: number
): string {
  const bestNotes = ANALYST_NOTES[bestCluster].good;
  const worstNotes = ANALYST_NOTES[worstCluster].bad;
  
  const bestNote = bestNotes[Math.floor(Math.random() * bestNotes.length)];
  const worstNote = worstNotes[Math.floor(Math.random() * worstNotes.length)];
  
  if (overallAccuracy >= 70) {
    return `${bestNote} Genel performansın mükemmel! 🌟`;
  } else if (overallAccuracy >= 50) {
    return `${bestNote} Ancak ${getClusterName(worstCluster).toLowerCase()} alanında gelişim gerekli.`;
  } else {
    return `${worstNote} ${getClusterName(bestCluster)} alanında ise iyisin. Devam et! 💪`;
  }
}

/**
 * Küme adını Türkçe olarak döndürür
 */
export function getClusterName(cluster: AnalysisCluster): string {
  const names: Record<AnalysisCluster, string> = {
    [AnalysisCluster.TEMPO_FLOW]: 'Tempo & Akış',
    [AnalysisCluster.PHYSICAL_FATIGUE]: 'Fiziksel & Yıpranma',
    [AnalysisCluster.DISCIPLINE]: 'Disiplin',
    [AnalysisCluster.INDIVIDUAL]: 'Bireysel Performans',
  };
  return names[cluster];
}

/**
 * Küme ikonunu döndürür
 */
export function getClusterIcon(cluster: AnalysisCluster): string {
  const icons: Record<AnalysisCluster, string> = {
    [AnalysisCluster.TEMPO_FLOW]: '⚡',
    [AnalysisCluster.PHYSICAL_FATIGUE]: '💪',
    [AnalysisCluster.DISCIPLINE]: '🟨',
    [AnalysisCluster.INDIVIDUAL]: '⭐',
  };
  return icons[cluster];
}

/**
 * Maç sonu analiz raporu oluşturur
 */
export function generateMatchAnalysisReport(
  predictions: Record<string, any>,
  actualResults: Record<string, any>,
  trainingType: TrainingType | null,
  focusedPredictions: FocusPrediction[]
): MatchAnalysisReport {
  // Calculate all scores
  const scores = calculateAllScores(predictions, actualResults, trainingType, focusedPredictions);
  
  // Calculate cluster scores
  const clusterScores = calculateClusterScores(scores);
  
  // Find best and worst clusters
  const { best, worst } = findBestAndWorstClusters(clusterScores);
  
  // Calculate total points
  const totalPoints = scores.reduce((sum, score) => sum + score.finalPoints, 0);
  
  // Calculate overall accuracy
  const correctCount = scores.filter(s => s.isCorrect).length;
  const overallAccuracy = scores.length > 0 
    ? Math.round((correctCount / scores.length) * 100) 
    : 0;
  
  // Generate analyst note
  const analystNote = generateAnalystNote(best, worst, overallAccuracy);
  
  // Calculate focused predictions stats
  const focusedScores = scores.filter(s => s.isFocused);
  const focusedStats = {
    correct: focusedScores.filter(s => s.isCorrect).length,
    wrong: focusedScores.filter(s => !s.isCorrect).length,
    total: focusedScores.length,
  };
  
  return {
    totalPoints,
    clusterScores,
    bestCluster: best,
    worstCluster: worst,
    analystNote,
    focusedPredictions: focusedStats,
  };
}

/**
 * Antrenman tipinin adını döndürür
 */
export function getTrainingName(trainingType: TrainingType): string {
  const names: Record<TrainingType, string> = {
    [TrainingType.DEFENSE]: 'Savunma Antrenmanı',
    [TrainingType.ATTACK]: 'Hücum Antrenmanı',
    [TrainingType.MIDFIELD]: 'Orta Saha Antrenmanı',
    [TrainingType.PHYSICAL]: 'Fiziksel Antrenman',
    [TrainingType.TACTICAL]: 'Taktik Antrenman',
  };
  return names[trainingType];
}

/**
 * Antrenman tipinin ikonunu döndürür
 */
export function getTrainingIcon(trainingType: TrainingType): string {
  const icons: Record<TrainingType, string> = {
    [TrainingType.DEFENSE]: '🛡️',
    [TrainingType.ATTACK]: '⚔️',
    [TrainingType.MIDFIELD]: '🎯',
    [TrainingType.PHYSICAL]: '💪',
    [TrainingType.TACTICAL]: '🧠',
  };
  return icons[trainingType];
}
