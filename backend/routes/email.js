// Email Routes
// TacticIQ - Email Forwarding & Webhook

const express = require('express');
const router = express.Router();
const { processIncomingEmail } = require('../services/emailForwardingService');

/**
 * POST /api/email/webhook
 * Email webhook endpoint (for SendGrid, Mailgun, etc.)
 * Receives incoming emails and forwards them to admin
 */
router.post('/webhook', async (req, res) => {
  try {
    // Parse email from webhook payload
    // Format depends on email service provider
    const emailData = {
      from: req.body.from || req.body.sender || req.body.envelope?.from,
      to: req.body.to || req.body.recipient || req.body.envelope?.to,
      subject: req.body.subject,
      text: req.body.text || req.body['body-plain'],
      html: req.body.html || req.body['body-html'],
      date: req.body.date || new Date().toISOString(),
    };

    if (!emailData.to || !emailData.to.includes('info@fanmanager.com')) {
      return res.status(400).json({
        success: false,
        error: 'Email not for info@fanmanager.com',
      });
    }

    const result = await processIncomingEmail(emailData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email forwarded to admin',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/email/test-forward
 * Test email forwarding (admin only)
 */
router.post('/test-forward', async (req, res) => {
  try {
    const { forwardEmailToAdmin } = require('../services/emailForwardingService');
    
    const testEmail = {
      from: 'test@example.com',
      to: 'info@fanmanager.com',
      subject: 'Test Email - ' + new Date().toISOString(),
      text: 'This is a test email to verify forwarding functionality.',
      html: '<p>This is a test email to verify forwarding functionality.</p>',
      date: new Date().toISOString(),
    };

    const result = await forwardEmailToAdmin(testEmail);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email forwarded successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Test forward error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
