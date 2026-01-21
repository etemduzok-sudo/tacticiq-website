// ============================================
// TIMELINE ROUTES
// ============================================
// Maç akışı (goller, kartlar, değişiklikler) endpoint'leri
// ============================================

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// GET /api/timeline/:matchId
// ============================================
// Belirli bir maçın timeline'ını getir
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const { data, error } = await supabase
      .from('match_timeline')
      .select('*')
      .eq('match_id', parseInt(matchId))
      .order('elapsed', { ascending: true })
      .order('elapsed_extra', { ascending: true });
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      matchId: parseInt(matchId),
      events: data || [],
      count: data?.length || 0,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/timeline/:matchId/goals
// ============================================
// Sadece golleri getir
router.get('/:matchId/goals', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const { data, error } = await supabase
      .from('match_timeline')
      .select('*')
      .eq('match_id', parseInt(matchId))
      .eq('event_type', 'goal')
      .order('elapsed', { ascending: true });
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      matchId: parseInt(matchId),
      goals: data || [],
      count: data?.length || 0,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/timeline/:matchId/summary
// ============================================
// Maç özetini getir
router.get('/:matchId/summary', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const { data, error } = await supabase
      .from('match_summaries')
      .select('*')
      .eq('match_id', parseInt(matchId))
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found değilse
      return res.status(500).json({ success: false, error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Summary not found' });
    }
    
    res.json({
      success: true,
      summary: data,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/timeline/recent
// ============================================
// Son 24 saatteki önemli olaylar
router.get('/recent/events', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { data, error } = await supabase
      .from('match_timeline')
      .select('*')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .in('event_type', ['goal', 'card'])
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      events: data || [],
      count: data?.length || 0,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
