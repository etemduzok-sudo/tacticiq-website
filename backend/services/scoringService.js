// ============================================
// SCORING SERVICE
// ============================================
// Strategic Focus System ile puan hesaplama
// ============================================

// Merkezi Supabase config kullan (eksik key'lerde null döner, crash olmaz)
const { supabase } = require('../config/supabase');

// ============================================
// SCORING RULES (from gameRules.ts)
// ============================================

// Tek maç max ~190 base + focus/training bonus = ~330 teorik max
// Gerçekçi iyi maç: 80-150 puan | Ortalama maç: 30-60 puan
const SCORING_RULES = {
  EXACT_SCORE: 50,        // Tam skor tahmini (en zor)
  CORRECT_WINNER: 30,     // Doğru kazanan
  CORRECT_DRAW: 25,       // Berabere doğru tahmin
  GOAL_DIFFERENCE: 15,    // Gol farkı doğru

  FIRST_GOAL: 20,         // İlk golü atan takım
  TOTAL_GOALS: 15,        // Toplam gol aralığı
  YELLOW_CARDS: 10,       // Sarı kartlar (±1 tolerans)
  RED_CARDS: 15,          // Kırmızı kartlar
  CORNERS: 10,            // Kornerler (±2 tolerans)

  // Strategic Focus System
  FOCUS_MULTIPLIER: 2.0,  // 2x puan (doğru focus)
  FOCUS_PENALTY: -1.5,    // -1.5x ceza (yanlış focus)

  // Training Multipliers
  TRAINING_BONUS: {
    attack: 1.20,   // %20 bonus (tempo + bireysel cluster)
    defense: 1.20,  // %20 bonus (disiplin + fiziksel cluster)
    balanced: 1.10  // %10 bonus (tüm cluster'lar)
  },

  // Analysis Clusters
  CLUSTERS: {
    tempo: ['first_goal', 'total_goals'],
    disiplin: ['yellow_cards', 'red_cards'],
    fiziksel: ['corners', 'total_goals'],
    bireysel: ['exact_score', 'first_goal']
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate exact score points
function calculateExactScorePoints(prediction, result) {
  if (prediction.home_score === result.home_score && 
      prediction.away_score === result.away_score) {
    return SCORING_RULES.EXACT_SCORE;
  }
  return 0;
}

// Calculate winner points
function calculateWinnerPoints(prediction, result) {
  const predWinner = prediction.home_score > prediction.away_score ? 'home' :
                     prediction.home_score < prediction.away_score ? 'away' : 'draw';
  const actualWinner = result.home_score > result.away_score ? 'home' :
                       result.home_score < result.away_score ? 'away' : 'draw';
  
  if (predWinner === actualWinner) {
    return predWinner === 'draw' ? SCORING_RULES.CORRECT_DRAW : SCORING_RULES.CORRECT_WINNER;
  }
  return 0;
}

// Calculate goal difference points
function calculateGoalDifferencePoints(prediction, result) {
  const predDiff = Math.abs(prediction.home_score - prediction.away_score);
  const actualDiff = Math.abs(result.home_score - result.away_score);
  
  if (predDiff === actualDiff) {
    return SCORING_RULES.GOAL_DIFFERENCE;
  }
  return 0;
}

// Calculate first goal points
function calculateFirstGoalPoints(prediction, result) {
  if (prediction.first_goal === result.first_goal) {
    return SCORING_RULES.FIRST_GOAL;
  }
  return 0;
}

// Calculate total goals points
function calculateTotalGoalsPoints(prediction, result) {
  if (prediction.total_goals === result.total_goals) {
    return SCORING_RULES.TOTAL_GOALS;
  }
  return 0;
}

// Calculate yellow cards points (±1 tolerance)
function calculateYellowCardsPoints(prediction, result) {
  if (!prediction.yellow_cards || !result.yellow_cards) return 0;
  
  const diff = Math.abs(prediction.yellow_cards - result.yellow_cards);
  if (diff <= 1) {
    return SCORING_RULES.YELLOW_CARDS;
  }
  return 0;
}

// Calculate red cards points
function calculateRedCardsPoints(prediction, result) {
  if (!prediction.red_cards || !result.red_cards) return 0;
  
  if (prediction.red_cards === result.red_cards) {
    return SCORING_RULES.RED_CARDS;
  }
  return 0;
}

// Calculate corners points (±2 tolerance)
function calculateCornersPoints(prediction, result) {
  if (!prediction.corners || !result.corners) return 0;
  
  const diff = Math.abs(prediction.corners - result.corners);
  if (diff <= 2) {
    return SCORING_RULES.CORNERS;
  }
  return 0;
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

async function calculatePredictionScore(predictionId, matchResult = null) {
  // Guard: Supabase not configured
  if (!supabase) {
    console.warn('⚠️ scoringService: Supabase not configured, skipping calculation');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // 1. Get prediction
    const { data: prediction, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError) throw predError;

    // 2. Get match result (from parameter or database)
    let result;
    if (matchResult) {
      // Use provided matchResult
      result = {
        home_score: matchResult.homeScore,
        away_score: matchResult.awayScore,
        first_goal: matchResult.firstGoal,
        total_goals: matchResult.totalGoals,
        yellow_cards: matchResult.yellowCards || 0,
        red_cards: matchResult.redCards || 0,
        corners: matchResult.corners || 0
      };
    } else {
      // Fetch from database
      const { data: dbResult, error: resultError } = await supabase
        .from('match_results')
        .select('*')
        .eq('match_id', prediction.match_id)
        .single();

      if (resultError) throw resultError;
      result = dbResult;
    }

    // 3. Calculate base points for each prediction
    const basePoints = {
      exact_score: calculateExactScorePoints(prediction, result),
      winner: calculateWinnerPoints(prediction, result),
      goal_difference: calculateGoalDifferencePoints(prediction, result),
      first_goal: calculateFirstGoalPoints(prediction, result),
      total_goals: calculateTotalGoalsPoints(prediction, result),
      yellow_cards: calculateYellowCardsPoints(prediction, result),
      red_cards: calculateRedCardsPoints(prediction, result),
      corners: calculateCornersPoints(prediction, result)
    };

    // 4. Group points by clusters
    const clusterScores = {
      tempo: basePoints.first_goal + basePoints.total_goals,
      disiplin: basePoints.yellow_cards + basePoints.red_cards,
      fiziksel: basePoints.corners + basePoints.total_goals,
      bireysel: basePoints.exact_score + basePoints.first_goal
    };

    // 5. Apply training multiplier to specific clusters
    const trainingType = prediction.training_type || 'balanced';
    const multiplier = SCORING_RULES.TRAINING_BONUS[trainingType] || 1.0;

    if (trainingType === 'attack') {
      // Attack training boosts tempo & bireysel
      clusterScores.tempo *= multiplier;
      clusterScores.bireysel *= multiplier;
    } else if (trainingType === 'defense') {
      // Defense training boosts disiplin & fiziksel
      clusterScores.disiplin *= multiplier;
      clusterScores.fiziksel *= multiplier;
    } else {
      // Balanced boosts all equally (10%)
      Object.keys(clusterScores).forEach(key => {
        clusterScores[key] *= multiplier;
      });
    }

    // 6. Apply Focus (Star) System
    let focusBonus = 0;
    const focusedPredictions = prediction.focused_predictions || [];
    
    focusedPredictions.forEach(focusedField => {
      const fieldPoints = basePoints[focusedField] || 0;
      if (fieldPoints > 0) {
        // Correct focused prediction: 2x bonus
        focusBonus += fieldPoints * (SCORING_RULES.FOCUS_MULTIPLIER - 1);
      } else {
        // Incorrect focused prediction: -1.5x penalty
        const penaltyAmount = SCORING_RULES[focusedField.toUpperCase()] || 0;
        focusBonus += penaltyAmount * SCORING_RULES.FOCUS_PENALTY;
      }
    });

    // 7. Calculate total score
    const baseTotal = Object.values(basePoints).reduce((sum, val) => sum + val, 0);
    const clusterTotal = Object.values(clusterScores).reduce((sum, val) => sum + val, 0);
    const totalScore = Math.max(0, Math.round(clusterTotal + focusBonus));

    // 8. Calculate accuracy
    const totalPredictions = Object.keys(basePoints).length;
    const correctPredictions = Object.values(basePoints).filter(p => p > 0).length;
    const accuracyPercentage = (correctPredictions / totalPredictions) * 100;

    // 9. Save score to database
    const scoreData = {
      prediction_id: predictionId,
      user_id: prediction.user_id,
      match_id: prediction.match_id,
      total_score: totalScore,
      tempo_score: Math.round(clusterScores.tempo),
      disiplin_score: Math.round(clusterScores.disiplin),
      fiziksel_score: Math.round(clusterScores.fiziksel),
      bireysel_score: Math.round(clusterScores.bireysel),
      focus_bonus: Math.round(focusBonus),
      training_multiplier_bonus: Math.round((multiplier - 1) * baseTotal),
      correct_predictions: correctPredictions,
      total_predictions: totalPredictions,
      accuracy_percentage: accuracyPercentage.toFixed(2)
    };

    const { data: savedScore, error: saveError } = await supabase
      .from('prediction_scores')
      .upsert(scoreData)
      .select()
      .single();

    if (saveError) throw saveError;

    // 10. Update user stats
    const isCorrect = correctPredictions > totalPredictions / 2; // More than half correct
    await supabase.rpc('update_user_score', {
      p_user_id: prediction.user_id,
      p_score: totalScore,
      p_is_correct: isCorrect
    });

    return {
      success: true,
      score: savedScore,
      breakdown: {
        basePoints,
        clusterScores,
        focusBonus,
        trainingMultiplier: multiplier,
        totalScore
      }
    };

  } catch (error) {
    console.error('Error calculating prediction score:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// FINALIZE MATCH (calculate all predictions)
// ============================================

async function finalizeMatch(matchId) {
  // Guard: Supabase not configured
  if (!supabase) {
    console.warn('⚠️ scoringService: Supabase not configured, skipping finalization');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log(`🎯 Finalizing match ${matchId}...`);

    // 1. Get all predictions for this match
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id, user_id')
      .eq('match_id', matchId);

    if (predError) throw predError;

    if (!predictions || predictions.length === 0) {
      console.log(`⚠️ No predictions found for match ${matchId}`);
      return {
        success: true,
        message: 'No predictions to finalize',
        count: 0
      };
    }

    console.log(`📊 Found ${predictions.length} predictions to calculate`);

    // 2. Calculate score for each prediction
    const results = [];
    for (const prediction of predictions) {
      const result = await calculatePredictionScore(prediction.id);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ Calculated score for user ${prediction.user_id}: ${result.score.total_score} points`);
      } else {
        console.error(`❌ Failed to calculate score for prediction ${prediction.id}:`, result.error);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`🎉 Finalization complete: ${successCount} success, ${failCount} failed`);

    return {
      success: true,
      message: `Finalized ${successCount} predictions`,
      count: successCount,
      failed: failCount,
      results
    };

  } catch (error) {
    console.error('Error finalizing match:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  calculatePredictionScore,
  finalizeMatch,
  SCORING_RULES
};
