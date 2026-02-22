// Players Routes
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET /api/players/:id - Get player information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;
    const data = await footballApi.getPlayerInfo(id, season);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/players/:id/rate - Topluluk rating oyu (giriş yapan kullanıcı)
// Body: { rating: 1-100 }. n >= 2 olunca gösterilen rating = (10*R_api + n*avg)/(10+n)
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    let rating = req.body?.rating != null ? Number(req.body.rating) : null;
    if (Number.isNaN(playerId) || playerId <= 0) {
      return res.status(400).json({ success: false, error: 'Geçersiz oyuncu id.' });
    }
    if (rating == null || Number.isNaN(rating)) {
      return res.status(400).json({ success: false, error: 'rating (1-100) gerekli.' });
    }
    rating = Math.max(1, Math.min(100, Math.round(rating)));
    const userId = req.user.id;

    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Veritabanı kullanılamıyor.' });
    }

    const { error } = await supabase
      .from('player_community_ratings')
      .upsert(
        {
          player_id: playerId,
          user_id: String(userId),
          rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,user_id' }
      );

    if (error) {
      console.warn('player_community_ratings upsert:', error.message);
      return res.status(500).json({ success: false, error: 'Oy kaydedilemedi.' });
    }
    return res.json({ success: true, message: 'Oy kaydedildi.' });
  } catch (e) {
    console.error('POST /players/:id/rate', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
