// Scoring Engine
// Fan Manager 2026 - Centralized Scoring Logic

import { SCORING } from '../config/constants';
import {
  AnalysisCluster,
  TrainingType,
  FocusPrediction,
  PredictionScore,
  ClusterScore,
  MatchAnalysisReport,
} from '../types/prediction.types';

/**
 * Scoring Engine Class
 * Handles all prediction scoring logic
 */
export class ScoringEngine {
  /**
   * Calculate score for a single prediction
   */
  static calculatePredictionScore(
    category: string,
    predictedValue: any,
    actualValue: any,
    options: {
      training?: TrainingType | null;
      isFocused?: boolean;
      cluster?: AnalysisCluster;
    } = {}
  ): PredictionScore {
    const { training, isFocused = false, cluster } = options;
    
    // Determine if prediction is correct
    const isCorrect = this.isPredictionCorrect(category, predictedValue, actualValue);
    
    // Get base points
    const basePoints = this.getBasePoints(category);
    
    // Get cluster
    const predictionCluster = cluster || this.getCategoryCluster(category);
    
    // Get training multiplier
    const trainingMultiplier = training 
      ? this.getTrainingMultiplier(training, predictionCluster)
      : 1.0;
    
    // Get focus multiplier
    const focusMultiplier = this.getFocusMultiplier(isFocused, isCorrect);
    
    // Calculate final points
    let finalPoints = basePoints * trainingMultiplier * focusMultiplier;
    
    // No points for incorrect non-focused predictions
    if (!isCorrect && !isFocused) {
      finalPoints = 0;
    }
    
    return {
      category,
      cluster: predictionCluster,
      basePoints,
      trainingMultiplier,
      focusMultiplier,
      finalPoints: Math.round(finalPoints),
      isCorrect,
      isFocused,
    };
  }

  /**
   * Check if prediction is correct
   */
  private static isPredictionCorrect(
    category: string,
    predicted: any,
    actual: any
  ): boolean {
    if (predicted === null || predicted === undefined) return false;
    if (actual === null || actual === undefined) return false;
    
    // Exact match for most categories
    if (predicted === actual) return true;
    
    // Range-based categories
    if (category === 'totalGoals') {
      return this.isInRange(actual, predicted);
    }
    
    // Time-based categories (allow ±5 minutes tolerance)
    if (category.includes('Time') || category.includes('Minute')) {
      const diff = Math.abs(Number(predicted) - Number(actual));
      return diff <= 5;
    }
    
    return false;
  }

  /**
   * Check if value is in range
   */
  private static isInRange(value: number, range: string): boolean {
    if (range === '0-1 gol') return value >= 0 && value <= 1;
    if (range === '2-3 gol') return value >= 2 && value <= 3;
    if (range === '4-5 gol') return value >= 4 && value <= 5;
    if (range === '6+ gol') return value >= 6;
    return false;
  }

  /**
   * Get base points for a category
   */
  private static getBasePoints(category: string): number {
    // Very easy predictions
    const veryEasy = ['totalGoals', 'possession'];
    if (veryEasy.includes(category)) {
      return SCORING.BASE_POINTS.VERY_EASY;
    }
    
    // Easy predictions
    const easy = ['tempo', 'scenario', 'yellowCards'];
    if (easy.includes(category)) {
      return SCORING.BASE_POINTS.EASY;
    }
    
    // Medium predictions
    const medium = [
      'firstGoalTime', 'firstHalfInjuryTime', 'secondHalfInjuryTime',
      'redCards', 'totalShots', 'shotsOnTarget', 'totalCorners'
    ];
    if (medium.includes(category)) {
      return SCORING.BASE_POINTS.MEDIUM;
    }
    
    // Hard predictions
    const hard = [
      'goalScorer', 'assist', 'injury', 'substitutePlayer',
      'firstHalfHomeScore', 'firstHalfAwayScore',
      'secondHalfHomeScore', 'secondHalfAwayScore'
    ];
    if (hard.includes(category)) {
      return SCORING.BASE_POINTS.HARD;
    }
    
    // Very hard predictions
    const veryHard = ['manOfTheMatch', 'penalty', 'secondYellowRed'];
    if (veryHard.includes(category)) {
      return SCORING.BASE_POINTS.VERY_HARD;
    }
    
    // Default
    return SCORING.BASE_POINTS.MEDIUM;
  }

  /**
   * Get category cluster
   */
  private static getCategoryCluster(category: string): AnalysisCluster {
    // Tempo & Flow
    const tempoFlow = [
      'firstGoalTime', 'firstHalfInjuryTime', 'secondHalfInjuryTime',
      'tempo', 'scenario', 'totalGoals', 'possession'
    ];
    if (tempoFlow.includes(category)) {
      return AnalysisCluster.TEMPO_FLOW;
    }
    
    // Physical & Fatigue
    const physical = [
      'injury', 'injurySubstitutePlayer', 'substitutePlayer', 'substitution'
    ];
    if (physical.includes(category)) {
      return AnalysisCluster.PHYSICAL_FATIGUE;
    }
    
    // Discipline
    const discipline = [
      'yellowCard', 'redCard', 'secondYellowRed', 'yellowCards', 'redCards', 'penalty'
    ];
    if (discipline.includes(category)) {
      return AnalysisCluster.DISCIPLINE;
    }
    
    // Individual Performance (default)
    return AnalysisCluster.INDIVIDUAL;
  }

  /**
   * Get training multiplier
   */
  private static getTrainingMultiplier(
    training: TrainingType,
    cluster: AnalysisCluster
  ): number {
    const multipliers = SCORING.TRAINING[training.toUpperCase() as keyof typeof SCORING.TRAINING];
    if (!multipliers) return 1.0;
    
    const clusterKey = cluster.toUpperCase().replace('_', '') as keyof typeof multipliers;
    return (multipliers as any)[clusterKey] || 1.0;
  }

  /**
   * Get focus multiplier
   */
  private static getFocusMultiplier(isFocused: boolean, isCorrect: boolean): number {
    if (!isFocused) return 1.0;
    return isCorrect ? SCORING.FOCUS.CORRECT : SCORING.FOCUS.WRONG;
  }

  /**
   * Calculate total score for all predictions
   */
  static calculateTotalScore(
    predictions: Record<string, any>,
    actualResults: Record<string, any>,
    options: {
      training?: TrainingType | null;
      focusedPredictions?: FocusPrediction[];
    } = {}
  ): PredictionScore[] {
    const { training, focusedPredictions = [] } = options;
    const scores: PredictionScore[] = [];
    
    Object.entries(predictions).forEach(([category, predictedValue]) => {
      if (predictedValue === null || predictedValue === undefined) return;
      
      const actualValue = actualResults[category];
      const isFocused = focusedPredictions.some(
        fp => fp.category === category && fp.isFocused
      );
      
      const score = this.calculatePredictionScore(
        category,
        predictedValue,
        actualValue,
        { training, isFocused }
      );
      
      scores.push(score);
    });
    
    return scores;
  }

  /**
   * Group scores by cluster
   */
  static groupScoresByCluster(scores: PredictionScore[]): ClusterScore[] {
    const clusterMap = new Map<AnalysisCluster, ClusterScore>();
    
    // Initialize all clusters
    Object.values(AnalysisCluster).forEach(cluster => {
      clusterMap.set(cluster, {
        cluster,
        totalPoints: 0,
        correctPredictions: 0,
        totalPredictions: 0,
        accuracy: 0,
      });
    });
    
    // Aggregate scores
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
    
    // Return only clusters with predictions
    return Array.from(clusterMap.values()).filter(cs => cs.totalPredictions > 0);
  }

  /**
   * Generate match analysis report
   */
  static generateAnalysisReport(
    predictions: Record<string, any>,
    actualResults: Record<string, any>,
    options: {
      training?: TrainingType | null;
      focusedPredictions?: FocusPrediction[];
    } = {}
  ): MatchAnalysisReport {
    // Calculate all scores
    const scores = this.calculateTotalScore(predictions, actualResults, options);
    
    // Group by cluster
    const clusterScores = this.groupScoresByCluster(scores);
    
    // Calculate total points
    const totalPoints = scores.reduce((sum, score) => sum + score.finalPoints, 0);
    
    // Find best and worst clusters
    const sortedClusters = [...clusterScores].sort((a, b) => b.accuracy - a.accuracy);
    const bestCluster = sortedClusters[0]?.cluster || AnalysisCluster.TEMPO_FLOW;
    const worstCluster = sortedClusters[sortedClusters.length - 1]?.cluster || AnalysisCluster.TEMPO_FLOW;
    
    // Calculate overall accuracy
    const correctCount = scores.filter(s => s.isCorrect).length;
    const overallAccuracy = scores.length > 0 
      ? Math.round((correctCount / scores.length) * 100) 
      : 0;
    
    // Generate analyst note
    const analystNote = this.generateAnalystNote(bestCluster, worstCluster, overallAccuracy);
    
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
      bestCluster,
      worstCluster,
      analystNote,
      focusedPredictions: focusedStats,
    };
  }

  /**
   * Generate analyst note based on performance
   */
  private static generateAnalystNote(
    bestCluster: AnalysisCluster,
    worstCluster: AnalysisCluster,
    overallAccuracy: number
  ): string {
    const clusterNames: Record<AnalysisCluster, string> = {
      [AnalysisCluster.TEMPO_FLOW]: 'Tempo & Akış',
      [AnalysisCluster.PHYSICAL_FATIGUE]: 'Fiziksel & Yıpranma',
      [AnalysisCluster.DISCIPLINE]: 'Disiplin',
      [AnalysisCluster.INDIVIDUAL]: 'Bireysel Performans',
    };
    
    if (overallAccuracy >= 70) {
      return `Mükemmel performans! ${clusterNames[bestCluster]} analizinde çok güçlüsün! 🌟`;
    } else if (overallAccuracy >= 50) {
      return `${clusterNames[bestCluster]} alanında iyisin, ancak ${clusterNames[worstCluster]} geliştirilmeli. 📊`;
    } else {
      return `${clusterNames[worstCluster]} alanında gelişim gerekli. Çalışmaya devam et! 💪`;
    }
  }

  /**
   * Calculate streak bonus
   */
  static calculateStreakBonus(streakCount: number): number {
    const streakBonuses = SCORING.STREAK_BONUS;
    const thresholds = Object.keys(streakBonuses).map(Number).sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      if (streakCount >= threshold) {
        return streakBonuses[threshold as keyof typeof streakBonuses];
      }
    }
    
    return 0;
  }

  /**
   * Calculate accuracy bonus
   */
  static calculateAccuracyBonus(accuracy: number): number {
    if (accuracy >= 100) return SCORING.ACCURACY_BONUS.PERFECT;
    if (accuracy >= 90) return SCORING.ACCURACY_BONUS.EXCELLENT;
    if (accuracy >= 80) return SCORING.ACCURACY_BONUS.GOOD;
    if (accuracy >= 70) return SCORING.ACCURACY_BONUS.DECENT;
    return 0;
  }
}

// Export singleton instance
export default ScoringEngine;
