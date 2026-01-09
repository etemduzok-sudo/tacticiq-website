// ============================================
// SCORING API ROUTES
// ============================================
// Puan hesaplama ve maç finalize endpoint'leri
// ============================================

const express = require('express');
const router = express.Router();
const { calculatePredictionScore, finalizeMatch } = require('../services/scoringService');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// ROUTES
// ============================================

// 1. CALCULATE SINGLE PREDICTION SCORE
// POST /api/scoring/calculate/:predictionId
// Body: { matchResult: { homeScore, awayScore, firstGoal, totalGoals, etc } }
router.post('/calculate/:predictionId', async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { matchResult } = req.body;

    if (!matchResult) {
      return res.status(400).json({
        success: false,
        message: 'matchResult is required in request body'
      });
    }

    // Get prediction
    const { data: prediction, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError || !prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Calculate score manually (simplified)
    const scoringService = require('../services/scoringService');
    const scoreResult = await scoringService.calculatePredictionScore(predictionId, matchResult);

    if (!scoreResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate score',
        error: scoreResult.error
      });
    }

    res.json({
      success: true,
      message: 'Score calculated successfully',
      data: scoreResult
    });

  } catch (error) {
    console.error('Error in calculate endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ============================================

// 2. FINALIZE MATCH (calculate all predictions)
// POST /api/scoring/finalize/:matchId
router.post('/finalize/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check if match result exists
    const { data: result, error: resultError } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (resultError || !result) {
      return res.status(404).json({
        success: false,
        message: 'Match result not found. Please add match result first.'
      });
    }

    const finalizationResult = await finalizeMatch(matchId);

    if (!finalizationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to finalize match',
        error: finalizationResult.error
      });
    }

    res.json({
      success: true,
      message: finalizationResult.message,
      data: {
        matchId,
        predictionsCalculated: finalizationResult.count,
        failed: finalizationResult.failed
      }
    });

  } catch (error) {
    console.error('Error in finalize endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ============================================

// 3. ADD MATCH RESULT
// POST /api/scoring/result/:matchId
router.post('/result/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const {
      homeScore,
      awayScore,
      firstGoal,
      totalGoals,
      yellowCards,
      redCards,
      corners,
      events
    } = req.body;

    // Validate required fields
    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Home score and away score are required'
      });
    }

    // Auto-calculate total goals if not provided
    const calculatedTotalGoals = totalGoals || (() => {
      const total = homeScore + awayScore;
      if (total <= 1) return '0-1';
      if (total <= 3) return '2-3';
      return '4+';
    })();

    // Insert or update match result
    const { data, error } = await supabase
      .from('match_results')
      .upsert({
        match_id: parseInt(matchId),
        home_score: homeScore,
        away_score: awayScore,
        first_goal: firstGoal || null,
        total_goals: calculatedTotalGoals,
        yellow_cards: yellowCards || null,
        red_cards: redCards || null,
        corners: corners || null,
        events: events || []
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Match result saved successfully',
      data
    });

  } catch (error) {
    console.error('Error saving match result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save match result',
      error: error.message
    });
  }
});

// ============================================

// 4. GET MATCH SCORES
// GET /api/scoring/match/:matchId
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const { data, error } = await supabase
      .from('prediction_scores')
      .select('*')
      .eq('match_id', matchId)
      .order('total_score', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching match scores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match scores',
      error: error.message
    });
  }
});

// ============================================

// 5. GET USER SCORE HISTORY
// GET /api/scoring/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('prediction_scores')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate total stats
    const totalScore = data.reduce((sum, score) => sum + score.total_score, 0);
    const avgScore = data.length > 0 ? totalScore / data.length : 0;
    const avgAccuracy = data.length > 0 
      ? data.reduce((sum, score) => sum + parseFloat(score.accuracy_percentage), 0) / data.length 
      : 0;

    res.json({
      success: true,
      data,
      stats: {
        totalMatches: data.length,
        totalScore,
        averageScore: avgScore.toFixed(2),
        averageAccuracy: avgAccuracy.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error fetching user score history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user score history',
      error: error.message
    });
  }
});

// ============================================

// 6. GET LEADERBOARD
// GET /api/scoring/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { period = 'overall', limit = 100, offset = 0 } = req.query;

    // Use RPC function for optimal performance
    const { data, error } = await supabase
      .rpc('get_leaderboard', {
        p_limit: parseInt(limit),
        p_offset: parseInt(offset),
        p_period: period
      });

    if (error) throw error;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_stats')
      .select('user_id', { count: 'exact', head: true })
      .gt('total_predictions', 0);

    if (countError) console.error('Count error:', countError);

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

// ============================================

// 7. GET USER STATS
// GET /api/scoring/stats/:userId
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      if (statsError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User stats not found'
        });
      }
      throw statsError;
    }

    // Get user rank
    const { data: rankData, error: rankError } = await supabase
      .rpc('get_user_rank', { p_user_id: userId });

    if (rankError) throw rankError;

    res.json({
      success: true,
      data: {
        ...stats,
        ranks: rankData[0] || { overall_rank: 0, weekly_rank: 0, monthly_rank: 0 }
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message
    });
  }
});

// ============================================

module.exports = router;
