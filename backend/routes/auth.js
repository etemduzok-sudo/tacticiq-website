// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');

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

module.exports = router;
