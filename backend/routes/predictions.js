// ============================================
// PREDICTIONS API ROUTES
// ============================================
// Tahmin sistemi için API endpoint'leri
// ✅ SECURITY: All mutation routes require authentication
// ============================================

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

if (!supabase) {
  console.warn('⚠️ Supabase not configured in routes/predictions.js - some features will be disabled');
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const validatePrediction = [
  body('matchId').isInt().withMessage('Match ID must be an integer'),
  body('homeScore').isInt({ min: 0, max: 20 }).withMessage('Home score must be between 0-20'),
  body('awayScore').isInt({ min: 0, max: 20 }).withMessage('Away score must be between 0-20'),
  body('firstGoal').optional().isIn(['home', 'away', 'none']).withMessage('Invalid first goal value'),
  body('totalGoals').optional().isIn(['0-1', '2-3', '4+']).withMessage('Invalid total goals value'),
  body('yellowCards').optional().isInt({ min: 0, max: 20 }).withMessage('Yellow cards must be between 0-20'),
  body('redCards').optional().isInt({ min: 0, max: 5 }).withMessage('Red cards must be between 0-5'),
  body('corners').optional().isInt({ min: 0, max: 30 }).withMessage('Corners must be between 0-30'),
  body('focusedPredictions').optional().isArray({ max: 3 }).withMessage('Max 3 focused predictions'),
  body('trainingType').optional().isIn(['attack', 'defense', 'balanced']).withMessage('Invalid training type'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate training multiplier
function calculateTrainingMultiplier(trainingType) {
  const multipliers = {
    attack: 1.20,
    defense: 1.20,
    balanced: 1.10
  };
  return multipliers[trainingType] || 1.00;
}

// Calculate total goals category
function calculateTotalGoalsCategory(homeScore, awayScore) {
  const total = homeScore + awayScore;
  if (total <= 1) return '0-1';
  if (total <= 3) return '2-3';
  return '4+';
}

// Check if match has started
async function hasMatchStarted(matchId) {
  try {
    const { data: match, error } = await supabase
      .from('matches')
      .select('date')
      .eq('id', matchId)
      .single();

    if (error) throw error;
    
    const matchDate = new Date(match.date);
    const now = new Date();
    
    return now >= matchDate;
  } catch (error) {
    console.error('Error checking match start time:', error);
    return false;
  }
}

// ============================================
// ROUTES
// ============================================

// 1. CREATE PREDICTION
// POST /api/predictions
// ✅ SECURITY: Requires authentication
router.post('/', authenticateToken, validatePrediction, async (req, res) => {
  try {
    const {
      matchId,
      homeScore,
      awayScore,
      firstGoal,
      totalGoals,
      yellowCards,
      redCards,
      corners,
      focusedPredictions,
      trainingType
    } = req.body;
    const userId = req.user?.id || req.body.userId;

    // Check if match has started
    const matchStarted = await hasMatchStarted(matchId);
    if (matchStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create prediction after match has started'
      });
    }

    // Calculate training multiplier
    const trainingMultiplier = calculateTrainingMultiplier(trainingType);

    // Auto-calculate total goals if not provided
    const calculatedTotalGoals = totalGoals || calculateTotalGoalsCategory(homeScore, awayScore);

    // Insert prediction
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        first_goal: firstGoal || null,
        total_goals: calculatedTotalGoals,
        yellow_cards: yellowCards || null,
        red_cards: redCards || null,
        corners: corners || null,
        focused_predictions: focusedPredictions || [],
        training_type: trainingType || 'balanced',
        training_multiplier: trainingMultiplier
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Prediction already exists for this match'
        });
      }
      throw error;
    }

    // Update user stats
    await supabase.rpc('increment_user_predictions', { user_id: userId });

    res.status(201).json({
      success: true,
      message: 'Prediction created successfully',
      data
    });

  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prediction',
      error: error.message
    });
  }
});

// ============================================

// 2. GET USER PREDICTIONS
// GET /api/predictions/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, matchId } = req.query;

    let query = supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by specific match if provided
    if (matchId) {
      query = query.eq('match_id', matchId);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching user predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      error: error.message
    });
  }
});

// ============================================

// 3. GET PREDICTION BY ID
// GET /api/predictions/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Prediction not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction',
      error: error.message
    });
  }
});

// ============================================

// 4. UPDATE PREDICTION
// PUT /api/predictions/:id
// ✅ SECURITY: Requires authentication
router.put('/:id', authenticateToken, validatePrediction, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      homeScore,
      awayScore,
      firstGoal,
      totalGoals,
      yellowCards,
      redCards,
      corners,
      focusedPredictions,
      trainingType
    } = req.body;

    // Get existing prediction
    const { data: existing, error: fetchError } = await supabase
      .from('predictions')
      .select('match_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if match has started
    const matchStarted = await hasMatchStarted(existing.match_id);
    if (matchStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update prediction after match has started'
      });
    }

    // Calculate training multiplier
    const trainingMultiplier = calculateTrainingMultiplier(trainingType);

    // Auto-calculate total goals if not provided
    const calculatedTotalGoals = totalGoals || calculateTotalGoalsCategory(homeScore, awayScore);

    // Update prediction
    const { data, error } = await supabase
      .from('predictions')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        first_goal: firstGoal || null,
        total_goals: calculatedTotalGoals,
        yellow_cards: yellowCards || null,
        red_cards: redCards || null,
        corners: corners || null,
        focused_predictions: focusedPredictions || [],
        training_type: trainingType || 'balanced',
        training_multiplier: trainingMultiplier,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prediction',
      error: error.message
    });
  }
});

// ============================================

// 5. DELETE PREDICTION
// DELETE /api/predictions/:id
// ✅ SECURITY: Requires authentication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing prediction
    const { data: existing, error: fetchError } = await supabase
      .from('predictions')
      .select('match_id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if match has started
    const matchStarted = await hasMatchStarted(existing.match_id);
    if (matchStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete prediction after match has started'
      });
    }

    // Delete prediction
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Decrement user stats
    await supabase.rpc('decrement_user_predictions', { user_id: existing.user_id });

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prediction',
      error: error.message
    });
  }
});

// ============================================

// 6. GET MATCH PREDICTIONS (for leaderboard/comparison)
// GET /api/predictions/match/:matchId
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from('predictions')
      .select('id, user_id, home_score, away_score, first_goal, total_goals, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching match predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match predictions',
      error: error.message
    });
  }
});

// ============================================

// 7. GET PREDICTION STATISTICS
// GET /api/predictions/stats/:userId
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) throw statsError;

    // Get recent predictions
    const { data: recentPredictions, error: predError } = await supabase
      .from('predictions')
      .select('id, match_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (predError) throw predError;

    // Get prediction scores
    const { data: scores, error: scoresError } = await supabase
      .from('prediction_scores')
      .select('total_score, accuracy_percentage, calculated_at')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(10);

    if (scoresError) throw scoresError;

    res.json({
      success: true,
      data: {
        stats,
        recentPredictions,
        recentScores: scores
      }
    });

  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction statistics',
      error: error.message
    });
  }
});

// ============================================

module.exports = router;
