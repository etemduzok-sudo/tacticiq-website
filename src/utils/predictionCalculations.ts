// Prediction Calculations
// TacticIQ - Pure Business Logic (NO UI)

import {
  PREDICTION_DIFFICULTY,
  FOCUS_RULES,
  TRAINING_MULTIPLIERS,
  BONUS_RULES,
  SCORING_RULES,
  TIME_RULES,
} from '../constants/gameRules';
import { AnalysisCluster, TrainingType } from '../types/prediction.types';

/**
 * ✅ PURE FUNCTIONS - NO SIDE EFFECTS
 * These functions should NEVER:
 * - Call setState
 * - Make API calls
 * - Access DOM
 * - Use React hooks
 */

/**
 * Calculate base points for a prediction category
 */
export function calculateBasePoints(category: string): number {
  return PREDICTION_DIFFICULTY[category as keyof typeof PREDICTION_DIFFICULTY] || 0;
}

/**
 * Check if prediction is correct
 */
export function isPredictionCorrect(
  predicted: any,
  actual: any,
  category: string
): boolean {
  if (predicted === null || predicted === undefined) return false;
  if (actual === null || actual === undefined) return false;

  // Exact match
  if (predicted === actual) return true;

  // Range-based (for totalGoals)
  if (category === 'totalGoals') {
    return isValueInRange(actual, predicted);
  }

  // Time-based (allow tolerance)
  if (category.includes('Time') || category.includes('Minute')) {
    const diff = Math.abs(Number(predicted) - Number(actual));
    return diff <= TIME_RULES.MINUTE_TOLERANCE;
  }

  return false;
}

/**
 * Check if value is in range
 */
function isValueInRange(value: number, range: string): boolean {
  if (range === '0-1 gol') return value >= 0 && value <= 1;
  if (range === '2-3 gol') return value >= 2 && value <= 3;
  if (range === '4-5 gol') return value >= 4 && value <= 5;
  if (range === '6+ gol') return value >= 6;
  return false;
}

/**
 * Get training multiplier for a cluster
 */
export function getTrainingMultiplier(
  training: TrainingType | null,
  cluster: AnalysisCluster
): number {
  if (!training) return 1.0;

  const multipliers = TRAINING_MULTIPLIERS[training];
  if (!multipliers) return 1.0;

  // Map cluster to multiplier key
  const clusterKey = cluster.toLowerCase().replace(/\s+/g, '');
  
  if (clusterKey.includes('tempo')) return multipliers.tempo || 1.0;
  if (clusterKey.includes('physical') || clusterKey.includes('fiziksel')) {
    return multipliers.physical || 1.0;
  }
  if (clusterKey.includes('discipline') || clusterKey.includes('disiplin')) {
    return multipliers.discipline || 1.0;
  }
  if (clusterKey.includes('individual') || clusterKey.includes('bireysel')) {
    return multipliers.individual || 1.0;
  }

  return 1.0;
}

/**
 * Get focus multiplier
 */
export function getFocusMultiplier(
  isFocused: boolean,
  isCorrect: boolean
): number {
  if (!isFocused) return 1.0;
  return isCorrect 
    ? FOCUS_RULES.CORRECT_MULTIPLIER 
    : FOCUS_RULES.WRONG_MULTIPLIER;
}

/**
 * Calculate final points for a single prediction
 */
export function calculatePredictionPoints(params: {
  category: string;
  predicted: any;
  actual: any;
  training?: TrainingType | null;
  isFocused?: boolean;
  cluster?: AnalysisCluster;
}): {
  basePoints: number;
  trainingMultiplier: number;
  focusMultiplier: number;
  finalPoints: number;
  isCorrect: boolean;
} {
  const {
    category,
    predicted,
    actual,
    training = null,
    isFocused = false,
    cluster = AnalysisCluster.TEMPO_FLOW,
  } = params;

  const isCorrect = isPredictionCorrect(predicted, actual, category);
  const basePoints = calculateBasePoints(category);
  const trainingMultiplier = getTrainingMultiplier(training, cluster);
  const focusMultiplier = getFocusMultiplier(isFocused, isCorrect);

  let finalPoints = basePoints * trainingMultiplier * focusMultiplier;

  // No points for incorrect non-focused predictions
  if (!isCorrect && !isFocused) {
    finalPoints = 0;
  }

  // Apply limits
  finalPoints = Math.max(
    SCORING_RULES.MIN_POINTS_PER_MATCH,
    Math.min(SCORING_RULES.MAX_POINTS_PER_MATCH, finalPoints)
  );

  return {
    basePoints,
    trainingMultiplier,
    focusMultiplier,
    finalPoints: Math.round(finalPoints),
    isCorrect,
  };
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(
  correctCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((correctCount / totalCount) * 100);
}

/**
 * Calculate accuracy bonus
 */
export function calculateAccuracyBonus(accuracy: number): number {
  const bonuses = Object.values(BONUS_RULES.accuracy).sort(
    (a, b) => b.threshold - a.threshold
  );

  for (const { threshold, bonus } of bonuses) {
    if (accuracy >= threshold) {
      return bonus;
    }
  }

  return 0;
}

/**
 * Calculate streak bonus
 */
export function calculateStreakBonus(streakCount: number): number {
  const streaks = Object.entries(BONUS_RULES.streak)
    .map(([count, bonus]) => ({ count: Number(count), bonus }))
    .sort((a, b) => b.count - a.count);

  for (const { count, bonus } of streaks) {
    if (streakCount >= count) {
      return bonus;
    }
  }

  return 0;
}

/**
 * Calculate total match points
 */
export function calculateTotalMatchPoints(
  predictions: Array<{
    category: string;
    predicted: any;
    actual: any;
    isFocused?: boolean;
    cluster?: AnalysisCluster;
  }>,
  training?: TrainingType | null
): {
  totalPoints: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  breakdown: Array<{
    category: string;
    points: number;
    isCorrect: boolean;
  }>;
} {
  let totalPoints = 0;
  let correctCount = 0;
  const breakdown: Array<{ category: string; points: number; isCorrect: boolean }> = [];

  for (const pred of predictions) {
    const result = calculatePredictionPoints({
      ...pred,
      training,
    });

    totalPoints += result.finalPoints;
    if (result.isCorrect) correctCount++;

    breakdown.push({
      category: pred.category,
      points: result.finalPoints,
      isCorrect: result.isCorrect,
    });
  }

  const accuracy = calculateAccuracy(correctCount, predictions.length);

  return {
    totalPoints: Math.round(totalPoints),
    correctCount,
    totalCount: predictions.length,
    accuracy,
    breakdown,
  };
}

/**
 * Validate prediction value
 */
export function validatePredictionValue(
  category: string,
  value: any
): { isValid: boolean; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: false, error: 'Değer boş olamaz' };
  }

  // Add specific validations based on category
  if (category.includes('Score')) {
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 20) {
      return { isValid: false, error: 'Skor 0-20 arasında olmalı' };
    }
  }

  if (category.includes('Minute') || category.includes('Time')) {
    const num = Number(value);
    if (isNaN(num) || num < 0 || num > 120) {
      return { isValid: false, error: 'Dakika 0-120 arasında olmalı' };
    }
  }

  return { isValid: true };
}

/**
 * Check if predictions can be submitted
 */
export function canSubmitPredictions(
  predictions: Record<string, any>,
  matchStartTime: Date
): { canSubmit: boolean; reason?: string } {
  const now = new Date();
  const deadline = new Date(
    matchStartTime.getTime() - TIME_RULES.PREDICTION_DEADLINE_MINUTES * 60000
  );

  if (now > deadline) {
    return {
      canSubmit: false,
      reason: 'Tahmin süresi doldu',
    };
  }

  const predictionCount = Object.values(predictions).filter(
    v => v !== null && v !== undefined
  ).length;

  if (predictionCount < SCORING_RULES.MIN_PREDICTIONS_FOR_SCORING) {
    return {
      canSubmit: false,
      reason: `En az ${SCORING_RULES.MIN_PREDICTIONS_FOR_SCORING} tahmin yapmalısınız`,
    };
  }

  return { canSubmit: true };
}

/**
 * Sort predictions by points (for leaderboard)
 */
export function sortPredictionsByPoints<T extends { points: number }>(
  predictions: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...predictions].sort((a, b) => {
    return order === 'desc' ? b.points - a.points : a.points - b.points;
  });
}

/**
 * Group predictions by cluster
 */
export function groupPredictionsByCluster(
  predictions: Array<{ category: string; points: number; cluster: AnalysisCluster }>
): Record<AnalysisCluster, { totalPoints: number; count: number }> {
  const grouped = {} as Record<AnalysisCluster, { totalPoints: number; count: number }>;

  for (const pred of predictions) {
    if (!grouped[pred.cluster]) {
      grouped[pred.cluster] = { totalPoints: 0, count: 0 };
    }
    grouped[pred.cluster].totalPoints += pred.points;
    grouped[pred.cluster].count += 1;
  }

  return grouped;
}

/**
 * Calculate leaderboard score
 * (weighted combination of points, accuracy, and streak)
 */
export function calculateLeaderboardScore(params: {
  totalPoints: number;
  accuracy: number;
  streak: number;
}): number {
  const { totalPoints, accuracy, streak } = params;
  const weights = BONUS_RULES.accuracy;

  const normalizedPoints = totalPoints / 100; // Normalize to 0-100 scale
  const normalizedAccuracy = accuracy; // Already 0-100
  const normalizedStreak = Math.min(streak / 10, 100); // Cap at 100

  const score =
    normalizedPoints * 0.5 + // 50% weight
    normalizedAccuracy * 0.3 + // 30% weight
    normalizedStreak * 0.2; // 20% weight

  return Math.round(score);
}
