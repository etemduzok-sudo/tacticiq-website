// ============================================
// SQUAD PREDICTIONS API ROUTES
// ============================================
// Kadro tahminleri ve istatistik sistemi
// ============================================

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const validateSquadPrediction = [
  body('matchId').isInt().withMessage('Match ID must be an integer'),
  body('attackFormation').isString().notEmpty().withMessage('Attack formation is required'),
  body('attackPlayers').isObject().withMessage('Attack players must be an object'),
  body('defenseFormation').isString().notEmpty().withMessage('Defense formation is required'),
  body('defensePlayers').isObject().withMessage('Defense players must be an object'),
  body('analysisFocus').optional().isIn(['attack', 'defense', 'midfield', 'physical', 'balanced']),
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

// Update player position statistics
async function updatePlayerPositionStats(matchId, players, formationId, formationType) {
  try {
    for (const [index, player] of Object.entries(players)) {
      if (player && player.id) {
        await supabase.rpc('upsert_player_position_stat', {
          p_match_id: matchId,
          p_player_id: player.id,
          p_player_name: player.name || 'Unknown',
          p_formation_id: formationId,
          p_position_index: parseInt(index),
          p_position_label: player.position || 'N/A',
          p_formation_type: formationType
        });
      }
    }
  } catch (error) {
    console.error('Error updating player position stats:', error);
  }
}

// Calculate match summary statistics
async function calculateMatchSummary(matchId) {
  try {
    // Get total predictions count
    const { count: totalCount } = await supabase
      .from('squad_predictions')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId);

    if (!totalCount || totalCount === 0) return;

    // Get top attack formation
    const { data: topAttack } = await supabase
      .from('formation_statistics')
      .select('formation_id, usage_count')
      .eq('match_id', matchId)
      .eq('formation_type', 'attack')
      .order('usage_count', { ascending: false })
      .limit(1)
      .single();

    // Get top defense formation
    const { data: topDefense } = await supabase
      .from('formation_statistics')
      .select('formation_id, usage_count')
      .eq('match_id', matchId)
      .eq('formation_type', 'defense')
      .order('usage_count', { ascending: false })
      .limit(1)
      .single();

    // Upsert match summary
    await supabase
      .from('match_squad_summary')
      .upsert({
        match_id: matchId,
        total_predictions: totalCount,
        top_attack_formation: topAttack?.formation_id || null,
        top_attack_formation_count: topAttack?.usage_count || 0,
        top_attack_formation_percentage: topAttack ? (topAttack.usage_count / totalCount * 100).toFixed(2) : 0,
        top_defense_formation: topDefense?.formation_id || null,
        top_defense_formation_count: topDefense?.usage_count || 0,
        top_defense_formation_percentage: topDefense ? (topDefense.usage_count / totalCount * 100).toFixed(2) : 0,
        last_calculated: new Date().toISOString()
      }, {
        onConflict: 'match_id'
      });

  } catch (error) {
    console.error('Error calculating match summary:', error);
  }
}

// ============================================
// ROUTES
// ============================================

// 1. CREATE/UPDATE SQUAD PREDICTION
// POST /api/squad-predictions
router.post('/', authenticateToken, validateSquadPrediction, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      matchId,
      attackFormation,
      attackPlayers,
      defenseFormation,
      defensePlayers,
      analysisFocus
    } = req.body;

    // Validate 11 players in each formation
    const attackPlayerCount = Object.values(attackPlayers).filter(Boolean).length;
    const defensePlayerCount = Object.values(defensePlayers).filter(Boolean).length;

    if (attackPlayerCount !== 11) {
      return res.status(400).json({
        success: false,
        message: `Attack formation must have exactly 11 players, got ${attackPlayerCount}`
      });
    }

    if (defensePlayerCount !== 11) {
      return res.status(400).json({
        success: false,
        message: `Defense formation must have exactly 11 players, got ${defensePlayerCount}`
      });
    }

    // Upsert squad prediction
    const { data, error } = await supabase
      .from('squad_predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        attack_formation: attackFormation,
        attack_players: attackPlayers,
        defense_formation: defenseFormation,
        defense_players: defensePlayers,
        analysis_focus: analysisFocus || 'balanced',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,match_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Update statistics in background
    updatePlayerPositionStats(matchId, attackPlayers, attackFormation, 'attack');
    updatePlayerPositionStats(matchId, defensePlayers, defenseFormation, 'defense');
    calculateMatchSummary(matchId);

    res.json({
      success: true,
      message: 'Squad prediction saved successfully',
      data
    });

  } catch (error) {
    console.error('Error saving squad prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save squad prediction',
      error: error.message
    });
  }
});

// 2. GET USER'S SQUAD PREDICTION FOR A MATCH
// GET /api/squad-predictions/match/:matchId
router.get('/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = parseInt(req.params.matchId);

    const { data, error } = await supabase
      .from('squad_predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      success: true,
      data: data || null
    });

  } catch (error) {
    console.error('Error fetching squad prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch squad prediction',
      error: error.message
    });
  }
});

// 3. GET MATCH STATISTICS
// GET /api/squad-predictions/stats/:matchId
router.get('/stats/:matchId', optionalAuth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const userId = req.user?.id;

    // Get match summary
    const { data: summary, error: summaryError } = await supabase
      .from('match_squad_summary')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;

    // Get all formation statistics for this match
    const { data: formationStats } = await supabase
      .from('formation_statistics')
      .select('*')
      .eq('match_id', matchId)
      .order('usage_count', { ascending: false });

    // Get user's prediction if authenticated
    let userPrediction = null;
    let userComparison = null;

    if (userId) {
      const { data: userPred } = await supabase
        .from('squad_predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('match_id', matchId)
        .single();

      userPrediction = userPred;

      if (userPred && summary) {
        // Calculate comparison
        const attackFormationMatch = userPred.attack_formation === summary.top_attack_formation;
        const defenseFormationMatch = userPred.defense_formation === summary.top_defense_formation;

        userComparison = {
          attackFormationMatches: attackFormationMatch,
          attackFormationPopularity: summary.top_attack_formation_percentage,
          defenseFormationMatches: defenseFormationMatch,
          defenseFormationPopularity: summary.top_defense_formation_percentage,
          overallCompatibility: (attackFormationMatch && defenseFormationMatch) ? 'high' :
                                (attackFormationMatch || defenseFormationMatch) ? 'medium' : 'low'
        };
      }
    }

    res.json({
      success: true,
      data: {
        summary: summary || {
          total_predictions: 0,
          top_attack_formation: null,
          top_defense_formation: null
        },
        formationStats: formationStats || [],
        userPrediction,
        userComparison
      }
    });

  } catch (error) {
    console.error('Error fetching match statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match statistics',
      error: error.message
    });
  }
});

// 4. GET POPULAR FORMATIONS (Global)
// GET /api/squad-predictions/popular-formations
router.get('/popular-formations', async (req, res) => {
  try {
    const formationType = req.query.type || 'attack';

    const { data, error } = await supabase
      .from('formation_statistics')
      .select('formation_id, formation_type, usage_count')
      .eq('formation_type', formationType)
      .order('usage_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Group by formation and sum counts
    const formationTotals = {};
    data.forEach(stat => {
      if (!formationTotals[stat.formation_id]) {
        formationTotals[stat.formation_id] = 0;
      }
      formationTotals[stat.formation_id] += stat.usage_count;
    });

    const sortedFormations = Object.entries(formationTotals)
      .map(([formation, count]) => ({ formation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: sortedFormations
    });

  } catch (error) {
    console.error('Error fetching popular formations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular formations',
      error: error.message
    });
  }
});

// 5. GET USER'S ALL SQUAD PREDICTIONS
// GET /api/squad-predictions/user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('squad_predictions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching user squad predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user squad predictions',
      error: error.message
    });
  }
});

module.exports = router;
