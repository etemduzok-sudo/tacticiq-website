// Email Forwarding Service
// Forwards all emails from info@fanmanager.com to etemduzok@gmail.com

const { sendEmail } = require('./emailService');

const INFO_EMAIL = 'info@fanmanager.com';
const ADMIN_EMAIL = 'etemduzok@gmail.com';

/**
 * Forward email from info@fanmanager.com to admin
 * This should be called whenever an email is received at info@fanmanager.com
 */
const forwardEmailToAdmin = async (originalEmail) => {
  try {
    const forwardedContent = {
      subject: `[FORWARDED] ${originalEmail.subject || 'No Subject'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .forward-badge { background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; padding: 12px; margin: 20px 0; border-radius: 8px; }
            .content { color: #E2E8F0; line-height: 1.6; }
            .original-email { background-color: #0F172A; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #64748B; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3B82F6;">📧 Email Forwarded</h1>
            </div>
            
            <div class="content">
              <div class="forward-badge">
                <strong style="color: #3B82F6;">ℹ️ Bu email info@fanmanager.com adresine gelen bir mesajdır ve size otomatik olarak iletilmiştir.</strong>
              </div>
              
              <div class="original-email">
                <h3 style="color: #FFFFFF; margin-top: 0;">Orijinal Email:</h3>
                <p><strong>Gönderen:</strong> ${originalEmail.from || 'Bilinmiyor'}</p>
                <p><strong>Konu:</strong> ${originalEmail.subject || 'Konu yok'}</p>
                <p><strong>Tarih:</strong> ${originalEmail.date || new Date().toISOString()}</p>
                <hr style="border-color: #334155; margin: 20px 0;">
                <div style="white-space: pre-wrap;">${originalEmail.html || originalEmail.text || 'İçerik yok'}</div>
              </div>
              
              <p style="color: #64748B; font-size: 12px;">
                <strong>Not:</strong> Bu email otomatik olarak iletilmiştir. Orijinal gönderene yanıt vermek isterseniz, 
                lütfen doğrudan ${originalEmail.from || 'gönderen'} adresine yanıt verin.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2026 Fan Manager - Email Forwarding System</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
📧 Email Forwarded

Bu email info@fanmanager.com adresine gelen bir mesajdır ve size otomatik olarak iletilmiştir.

Orijinal Email:
Gönderen: ${originalEmail.from || 'Bilinmiyor'}
Konu: ${originalEmail.subject || 'Konu yok'}
Tarih: ${originalEmail.date || new Date().toISOString()}

${originalEmail.text || originalEmail.html || 'İçerik yok'}

Not: Bu email otomatik olarak iletilmiştir.

© 2026 Fan Manager - Email Forwarding System
      `,
    };

    const result = await sendEmail({
      to: ADMIN_EMAIL,
      ...forwardedContent,
    });

    if (result.success) {
      console.log('✅ Email forwarded to admin:', originalEmail.subject);
      return { success: true, messageId: result.messageId };
    } else {
      console.error('❌ Failed to forward email:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Email forwarding error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process incoming email (to be called by email webhook or IMAP listener)
 * This is a placeholder - in production, you'd integrate with:
 * - Email webhook (SendGrid, Mailgun, etc.)
 * - IMAP listener (node-imap)
 * - Email service API
 */
const processIncomingEmail = async (emailData) => {
  // Check if email is to info@fanmanager.com
  if (emailData.to && emailData.to.includes(INFO_EMAIL)) {
    console.log('📧 Processing incoming email to info@fanmanager.com');
    return await forwardEmailToAdmin(emailData);
  }
  
  return { success: false, error: 'Email not for info@fanmanager.com' };
};

module.exports = {
  forwardEmailToAdmin,
  processIncomingEmail,
  INFO_EMAIL,
  ADMIN_EMAIL,
};
