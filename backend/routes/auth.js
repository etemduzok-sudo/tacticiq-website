// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jxdgiskusjljlpzvrzau.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZGdpc2t1c2psamxwenZyemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NTYzNTIsImV4cCI6MjA1MjMzMjM1Mn0.W4Tv6C6H_xr9T_UdUY3LgZPLMRJY1SJhvuPmw9dXYkk'
);

// Şifre sıfırlama isteği
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email gerekli' });
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Geçersiz email formatı' });
    }

    // Reset token oluştur (gerçek uygulamada Supabase kullanın)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    
    // Reset link oluştur
    const resetLink = `${process.env.APP_URL || 'http://localhost:8082'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Email gönder
    const result = await sendPasswordResetEmail(email, resetLink);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Şifre sıfırlama linki email adresinize gönderildi.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Hoş geldin maili gönder
router.post('/send-welcome', async (req, res) => {
  try {
    const { email, userName } = req.body;

    if (!email || !userName) {
      return res.status(400).json({ error: 'Email ve kullanıcı adı gerekli' });
    }

    const result = await sendWelcomeEmail(email, userName);

    if (result.success) {
      res.json({ success: true, message: 'Hoş geldin maili gönderildi' });
    } else {
      res.status(500).json({ error: 'Email gönderilemedi' });
    }
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Şifre değiştirme
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Mevcut şifre, yeni şifre ve email gerekli' 
      });
    }

    // Şifre uzunluk kontrolü
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Yeni şifre en az 6 karakter olmalıdır' 
      });
    }

    // Mevcut şifreyi doğrula (Supabase ile)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword,
    });

    if (signInError || !signInData.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Mevcut şifre yanlış' 
      });
    }

    // Yeni şifreyi güncelle
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Update password error:', updateError);
      return res.status(500).json({ 
        success: false,
        error: 'Şifre güncellenemedi: ' + updateError.message 
      });
    }

    res.json({ 
      success: true,
      message: 'Şifre başarıyla değiştirildi' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sunucu hatası' 
    });
  }
});

// Kullanıcı adı müsaitlik kontrolü
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { currentUserId } = req.query; // Mevcut kullanıcının kendi username'ini kontrol ederken hariç tutmak için

    if (!username || username.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: 'Kullanıcı adı en az 3 karakter olmalıdır' 
      });
    }

    // Kullanıcı adı format kontrolü (sadece harf, rakam, alt çizgi)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.json({ 
        success: true,
        available: false,
        message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir' 
      });
    }

    // Supabase'de kontrol et
    let query = supabase
      .from('users')
      .select('id, username')
      .ilike('username', username)
      .limit(1);

    // Eğer currentUserId varsa, kendi kullanıcısını hariç tut
    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Username check error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Veritabanı hatası' 
      });
    }

    // Kullanıcı adı müsait mi?
    const available = !data || data.length === 0;

    res.json({ 
      success: true,
      available,
      message: available 
        ? 'Kullanıcı adı kullanılabilir' 
        : 'Bu kullanıcı adı zaten kullanılıyor'
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sunucu hatası' 
    });
  }
});

module.exports = router;
