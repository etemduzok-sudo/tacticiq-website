// ============================================
// LEADERBOARD SNAPSHOTS ROUTES
// ============================================
// Sıralama geçmişi endpoint'leri
// ============================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// ============================================
// GET /api/leaderboard/snapshots
// ============================================
// Son snapshot'ları getir
router.get('/', async (req, res) => {
  try {
    const { period = 'daily', limit = 10 } = req.query;
    
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('period', period)
      .order('snapshot_date', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      period,
      snapshots: data || [],
      count: data?.length || 0,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/leaderboard/snapshots/:date
// ============================================
// Belirli bir tarihin snapshot'ını getir
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { period = 'daily' } = req.query;
    
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('snapshot_date', date)
      .eq('period', period)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ success: false, error: 'Snapshot not found' });
    }
    
    res.json({
      success: true,
      snapshot: data,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/leaderboard/snapshots/weekly
// ============================================
// Haftalık snapshot'ları getir
router.get('/weekly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), limit = 52 } = req.query;
    
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('period', 'weekly')
      .eq('year', parseInt(year))
      .order('week_number', { ascending: false })
      .limit(parseInt(limit));
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      year: parseInt(year),
      snapshots: data || [],
      count: data?.length || 0,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET /api/leaderboard/user/:userId/history
// ============================================
// Kullanıcının sıralama geçmişi
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const { data, error } = await supabase
      .from('leaderboard_snapshots')
      .select('snapshot_date, rankings')
      .eq('period', 'daily')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });
    
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    // Kullanıcının sıralama geçmişini çıkar
    const history = (data || []).map(snapshot => {
      const userRanking = snapshot.rankings?.find(r => r.user_id === userId);
      return {
        date: snapshot.snapshot_date,
        rank: userRanking?.rank || null,
        points: userRanking?.total_points || null,
        accuracy: userRanking?.accuracy_percentage || null,
      };
    }).filter(h => h.rank !== null);
    
    res.json({
      success: true,
      userId,
      days: parseInt(days),
      history,
      count: history.length,
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// POST /api/leaderboard/snapshots/take
// ============================================
// Manuel snapshot al (admin only)
router.post('/take', async (req, res) => {
  try {
    const { period = 'daily' } = req.body;
    
    const snapshotService = require('../services/leaderboardSnapshotService');
    const result = await snapshotService.takeSnapshot(period);
    
    if (result) {
      res.json({ success: true, result });
    } else {
      res.status(500).json({ success: false, error: 'Snapshot failed' });
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
