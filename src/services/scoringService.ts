// TacticIQ - Puanlama Hesaplama Servisi
import {
  AnalysisFocusType,
  ANALYSIS_FOCUS_MULTIPLIERS,
  BASE_SCORES,
  TIME_BONUS,
  STREAK_BONUSES,
  LEVEL_THRESHOLDS,
  MatchScoreDetail,
  UserScoringProfile,
  PlayerPredictionType,
  PLAYER_PREDICTION_CONFIG,
} from '../types/scoring.types';

/**
 * Skor tahmini puanı hesapla
 */
export function calculateScorePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): { points: number; type: 'exact' | 'goalDiff' | 'winner' | 'wrong' } {
  // Tam isabet
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: BASE_SCORES.SCORE_EXACT, type: 'exact' };
  }
  
  // Gol farkı doğru
  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;
  if (predictedDiff === actualDiff) {
    return { points: BASE_SCORES.SCORE_GOAL_DIFF, type: 'goalDiff' };
  }
  
  // Galibiyet doğru
  const predictedWinner = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'draw';
  const actualWinner = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'draw';
  if (predictedWinner === actualWinner) {
    return { points: BASE_SCORES.SCORE_WINNER, type: 'winner' };
  }
  
  return { points: 0, type: 'wrong' };
}

/**
 * Toplam gol tahmini puanı hesapla
 */
export function calculateTotalGoalsPoints(
  predictedTotal: number,
  actualTotal: number
): { points: number; type: 'exact' | 'close' | 'wrong' } {
  if (predictedTotal === actualTotal) {
    return { points: BASE_SCORES.TOTAL_GOALS_EXACT, type: 'exact' };
  }
  
  if (Math.abs(predictedTotal - actualTotal) === 1) {
    return { points: BASE_SCORES.TOTAL_GOALS_CLOSE, type: 'close' };
  }
  
  return { points: 0, type: 'wrong' };
}

/**
 * Kadro tahmini puanı hesapla
 */
export function calculateSquadPoints(
  predictedPlayerIds: number[],
  actualPlayerIds: number[]
): { points: number; correctCount: number; totalCount: number } {
  const actualSet = new Set(actualPlayerIds);
  let correctCount = 0;
  
  predictedPlayerIds.forEach(playerId => {
    if (actualSet.has(playerId)) {
      correctCount++;
    }
  });
  
  return {
    points: correctCount * BASE_SCORES.SQUAD_PER_PLAYER,
    correctCount,
    totalCount: predictedPlayerIds.length,
  };
}

/**
 * Formasyon tahmini puanı hesapla
 */
export function calculateFormationPoints(
  predictedFormation: string,
  actualFormation: string,
  isAttack: boolean
): { points: number; type: 'exact' | 'similar' | 'wrong' } {
  const baseExact = isAttack ? BASE_SCORES.ATTACK_FORMATION_EXACT : BASE_SCORES.DEFENSE_FORMATION_EXACT;
  const baseSimilar = isAttack ? BASE_SCORES.ATTACK_FORMATION_SIMILAR : BASE_SCORES.DEFENSE_FORMATION_SIMILAR;
  
  // Tam isabet
  if (predictedFormation === actualFormation) {
    return { points: baseExact, type: 'exact' };
  }
  
  // Benzer formasyon (aynı tipte: 4-x-x gibi)
  const predictedBase = predictedFormation.split('-')[0];
  const actualBase = actualFormation.split('-')[0];
  if (predictedBase === actualBase) {
    return { points: baseSimilar, type: 'similar' };
  }
  
  return { points: 0, type: 'wrong' };
}

/**
 * Oyuncu tahmini puanı hesapla
 */
export function calculatePlayerPredictionPoints(
  predictionType: PlayerPredictionType,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;
  return PLAYER_PREDICTION_CONFIG[predictionType]?.points || 0;
}

/**
 * Analiz odağı çarpanını uygula
 */
export function applyAnalysisFocusMultiplier(
  basePoints: number,
  category: string,
  analysisFocus: AnalysisFocusType
): number {
  const focusConfig = ANALYSIS_FOCUS_MULTIPLIERS[analysisFocus];
  if (!focusConfig) return basePoints;
  
  // 'all' kategorisi tüm puanlara uygulanır (dengeli mod)
  if (focusConfig.affectedCategories.includes('all')) {
    return basePoints * focusConfig.multiplier;
  }
  
  // Spesifik kategorilere çarpan uygula
  if (focusConfig.affectedCategories.includes(category)) {
    return basePoints * focusConfig.multiplier;
  }
  
  return basePoints;
}

/**
 * Zaman bonusu çarpanını hesapla
 */
export function calculateTimeBonus(
  predictedAt: Date,
  lineupAnnouncedAt: Date | null,
  matchStartedAt: Date
): number {
  const now = new Date();
  const hoursBeforeMatch = (matchStartedAt.getTime() - predictedAt.getTime()) / (1000 * 60 * 60);
  
  // Son 2 saat: ceza
  if (hoursBeforeMatch <= 2) {
    return TIME_BONUS.LAST_2_HOURS_PENALTY;
  }
  
  // Kadro açıklanmadan önce: bonus
  if (lineupAnnouncedAt && predictedAt < lineupAnnouncedAt) {
    return TIME_BONUS.BEFORE_LINEUP_ANNOUNCED;
  }
  
  // Standart
  return TIME_BONUS.AFTER_LINEUP_ANNOUNCED;
}

/**
 * Seri bonusu hesapla
 */
export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak >= 10) return STREAK_BONUSES.STREAK_10;
  if (currentStreak >= 7) return STREAK_BONUSES.STREAK_7;
  if (currentStreak >= 5) return STREAK_BONUSES.STREAK_5;
  if (currentStreak >= 3) return STREAK_BONUSES.STREAK_3;
  return 0;
}

/**
 * Kullanıcı seviyesini hesapla
 */
export function calculateLevel(totalPoints: number): {
  level: number;
  title: string;
  color: string;
  progress: number;
  pointsToNextLevel: number;
} {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (totalPoints >= threshold.minPoints) {
      const pointsInLevel = totalPoints - threshold.minPoints;
      const levelRange = threshold.maxPoints - threshold.minPoints;
      const progress = Math.min(100, (pointsInLevel / levelRange) * 100);
      const pointsToNextLevel = threshold.maxPoints === Infinity ? 0 : threshold.maxPoints - totalPoints;
      
      return {
        level: threshold.level,
        title: threshold.title,
        color: threshold.color,
        progress,
        pointsToNextLevel,
      };
    }
  }
  
  // Fallback to level 1
  return {
    level: 1,
    title: 'Çaylak',
    color: '#9CA3AF',
    progress: 0,
    pointsToNextLevel: 50,
  };
}

/**
 * Maç puanı detaylı hesaplama
 */
export function calculateMatchScore(params: {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  analysisFocus: AnalysisFocusType;
  predictions: {
    homeScore: number;
    awayScore: number;
    totalGoals: number;
    squadPlayerIds: number[];
    attackFormation: string;
    defenseFormation: string;
    playerPredictions: {
      playerId: number;
      playerName: string;
      type: PlayerPredictionType;
    }[];
  };
  actuals: {
    homeScore: number;
    awayScore: number;
    squadPlayerIds: number[];
    attackFormation: string;
    defenseFormation: string;
    playerEvents: {
      playerId: number;
      type: PlayerPredictionType;
    }[];
  };
  predictedAt: Date;
  lineupAnnouncedAt: Date | null;
  matchStartedAt: Date;
  currentStreak: number;
}): MatchScoreDetail {
  const { predictions, actuals, analysisFocus } = params;
  
  // 1. Skor puanı
  const scoreResult = calculateScorePoints(
    predictions.homeScore,
    predictions.awayScore,
    actuals.homeScore,
    actuals.awayScore
  );
  
  // 2. Toplam gol puanı
  const actualTotalGoals = actuals.homeScore + actuals.awayScore;
  const totalGoalsResult = calculateTotalGoalsPoints(predictions.totalGoals, actualTotalGoals);
  
  // 3. Kadro puanı
  const squadResult = calculateSquadPoints(predictions.squadPlayerIds, actuals.squadPlayerIds);
  
  // 4. Formasyon puanları
  const attackFormationResult = calculateFormationPoints(
    predictions.attackFormation,
    actuals.attackFormation,
    true
  );
  const defenseFormationResult = calculateFormationPoints(
    predictions.defenseFormation,
    actuals.defenseFormation,
    false
  );
  
  // 5. Oyuncu tahminleri
  const actualEventsMap = new Map<string, boolean>();
  actuals.playerEvents.forEach(event => {
    actualEventsMap.set(`${event.playerId}-${event.type}`, true);
  });
  
  const playerPredictionResults = predictions.playerPredictions.map(pred => {
    const isCorrect = actualEventsMap.has(`${pred.playerId}-${pred.type}`);
    const basePoints = calculatePlayerPredictionPoints(pred.type, isCorrect);
    const finalPoints = applyAnalysisFocusMultiplier(basePoints, pred.type, analysisFocus);
    
    return {
      playerId: pred.playerId,
      playerName: pred.playerName,
      predictionType: pred.type,
      points: finalPoints,
      isCorrect,
    };
  });
  
  // 6. Temel puanları analiz odağıyla çarp
  const scorePoints = applyAnalysisFocusMultiplier(scoreResult.points, 'exactScore', analysisFocus);
  const totalGoalsPoints = applyAnalysisFocusMultiplier(totalGoalsResult.points, 'totalGoals', analysisFocus);
  const squadPoints = applyAnalysisFocusMultiplier(squadResult.points, 'squadPlayers', analysisFocus);
  const attackFormationPoints = applyAnalysisFocusMultiplier(attackFormationResult.points, 'attackFormation', analysisFocus);
  const defenseFormationPoints = applyAnalysisFocusMultiplier(defenseFormationResult.points, 'defenseFormation', analysisFocus);
  
  // 7. Alt toplamlar
  const subtotalBase = scorePoints + totalGoalsPoints + squadPoints + attackFormationPoints + defenseFormationPoints;
  const subtotalPlayerPredictions = playerPredictionResults.reduce((sum, p) => sum + p.points, 0);
  
  // 8. Çarpanlar
  const timeBonusMultiplier = calculateTimeBonus(
    params.predictedAt,
    params.lineupAnnouncedAt,
    params.matchStartedAt
  );
  const streakBonus = calculateStreakBonus(params.currentStreak);
  
  // 9. Toplam hesaplama
  const baseTotal = subtotalBase + subtotalPlayerPredictions;
  const withTimeBonus = baseTotal * timeBonusMultiplier;
  const totalScore = withTimeBonus + streakBonus;
  
  return {
    matchId: params.matchId,
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    matchDate: params.matchDate,
    analysisFocus,
    baseScores: {
      scoreCorrect: scorePoints,
      totalGoalsCorrect: totalGoalsPoints,
      squadCorrect: squadPoints,
      attackFormationCorrect: attackFormationPoints,
      defenseFormationCorrect: defenseFormationPoints,
    },
    playerPredictions: playerPredictionResults,
    multipliers: {
      analysisFocusMultiplier: ANALYSIS_FOCUS_MULTIPLIERS[analysisFocus]?.multiplier || 1,
      timeBonusMultiplier,
      streakBonus,
    },
    subtotalBase,
    subtotalPlayerPredictions,
    subtotalBonuses: (withTimeBonus - baseTotal) + streakBonus,
    totalScore: Math.round(totalScore * 10) / 10, // 1 ondalık basamak
    predictedAt: params.predictedAt.toISOString(),
    lineupAnnouncedAt: params.lineupAnnouncedAt?.toISOString(),
    matchStartedAt: params.matchStartedAt.toISOString(),
  };
}

/**
 * Kullanıcı profili hesaplama
 */
export function calculateUserProfile(
  userId: string,
  totalPoints: number,
  matchScores: MatchScoreDetail[],
  currentStreak: number,
  bestStreak: number,
  rankTurkey: number,
  rankWorld: number,
  totalUsersTurkey: number,
  totalUsersWorld: number
): UserScoringProfile {
  const levelInfo = calculateLevel(totalPoints);
  
  // Başarı oranları hesapla
  let totalScorePredictions = 0;
  let correctScorePredictions = 0;
  let totalSquadPlayers = 0;
  let correctSquadPlayers = 0;
  let totalPlayerPredictions = 0;
  let correctPlayerPredictions = 0;
  
  matchScores.forEach(match => {
    // Skor
    totalScorePredictions++;
    if (match.baseScores.scoreCorrect > 0) correctScorePredictions++;
    
    // Kadro (tahmini olarak 11 oyuncu)
    totalSquadPlayers += 11;
    correctSquadPlayers += Math.round(match.baseScores.squadCorrect / BASE_SCORES.SQUAD_PER_PLAYER);
    
    // Oyuncu tahminleri
    match.playerPredictions.forEach(pred => {
      totalPlayerPredictions++;
      if (pred.isCorrect) correctPlayerPredictions++;
    });
  });
  
  return {
    userId,
    totalPoints,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelProgress: Math.round(levelInfo.progress),
    rankTurkey,
    rankWorld,
    totalUsersTurkey,
    totalUsersWorld,
    successRates: {
      score: totalScorePredictions > 0 ? Math.round((correctScorePredictions / totalScorePredictions) * 100) : 0,
      squad: totalSquadPlayers > 0 ? Math.round((correctSquadPlayers / totalSquadPlayers) * 100) : 0,
      player: totalPlayerPredictions > 0 ? Math.round((correctPlayerPredictions / totalPlayerPredictions) * 100) : 0,
    },
    currentStreak,
    bestStreak,
    recentMatches: matchScores.slice(0, 10), // Son 10 maç
  };
}

/**
 * Kısa takım adı oluştur (RMA, BAR, GS, FB gibi)
 */
export function getShortTeamName(teamName: string): string {
  // Bilinen takımlar için kısaltmalar
  const knownTeams: Record<string, string> = {
    'Real Madrid': 'RMA',
    'Barcelona': 'BAR',
    'Atletico Madrid': 'ATM',
    'Galatasaray': 'GS',
    'Fenerbahce': 'FB',
    'Fenerbahçe': 'FB',
    'Besiktas': 'BJK',
    'Beşiktaş': 'BJK',
    'Trabzonspor': 'TS',
    'Liverpool': 'LIV',
    'Manchester City': 'MCI',
    'Manchester United': 'MUN',
    'Chelsea': 'CHE',
    'Arsenal': 'ARS',
    'Tottenham': 'TOT',
    'Bayern Munich': 'BAY',
    'Bayern München': 'BAY',
    'Borussia Dortmund': 'BVB',
    'Juventus': 'JUV',
    'AC Milan': 'MIL',
    'Inter Milan': 'INT',
    'Paris Saint-Germain': 'PSG',
    'PSG': 'PSG',
  };
  
  if (knownTeams[teamName]) {
    return knownTeams[teamName];
  }
  
  // Bilinmeyen takımlar için ilk 3 harf
  return teamName.substring(0, 3).toUpperCase();
}
