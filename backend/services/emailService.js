// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'info@tacticiq.com',
    pass: process.env.SMTP_PASS || '', // App-specific password
  },
};

// Create reusable transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransporter(EMAIL_CONFIG);
  } catch (error) {
    console.error('❌ Email transporter oluşturulamadı:', error);
    return null;
  }
};

// Email templates
const EMAIL_TEMPLATES = {
  // Şifre sıfırlama maili
  passwordReset: (resetLink, userName) => ({
    subject: 'TacticIQ - Şifre Sıfırlama',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: bold; color: #FFFFFF; margin-bottom: 10px; }
          .shield { font-size: 48px; margin-bottom: 20px; }
          .content { color: #E2E8F0; line-height: 1.6; }
          .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 30px 0; }
          .button:hover { background: linear-gradient(135deg, #047857 0%, #065f46 100%); }
          .warning { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #64748B; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; }
          .link { color: #059669; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="shield">🛡️</div>
            <div class="logo">TacticIQ</div>
          </div>
          
          <div class="content">
            <h2 style="color: #FFFFFF;">Merhaba${userName ? ' ' + userName : ''},</h2>
            
            <p>Şifrenizi sıfırlama talebiniz alındı. Aşağıdaki butona tıklayarak yeni bir şifre belirleyebilirsiniz:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
            </div>
            
            <p>Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:</p>
            <p style="word-break: break-all; background-color: #0F172A; padding: 12px; border-radius: 8px; font-size: 14px;">
              <a href="${resetLink}" class="link">${resetLink}</a>
            </p>
            
            <div class="warning">
              <strong style="color: #EF4444;">⚠️ Önemli Güvenlik Uyarısı:</strong><br>
              • Bu link <strong>15 dakika</strong> içinde geçerliliğini yitirecektir.<br>
              • Şifre sıfırlama talebinde bulunmadıysanız, bu maili dikkate almayın.<br>
              • Bu linki kimseyle paylaşmayın.
            </div>
            
            <p>Sorunuz mu var? <a href="mailto:info@tacticiq.com" class="link">info@tacticiq.com</a> adresinden bize ulaşabilirsiniz.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 TacticIQ. Tüm hakları saklıdır.</p>
            <p>Bu mail otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
TacticIQ - Şifre Sıfırlama

Merhaba${userName ? ' ' + userName : ''},

Şifrenizi sıfırlama talebiniz alındı. Aşağıdaki linke tıklayarak yeni bir şifre belirleyebilirsiniz:

${resetLink}

⚠️ Bu link 15 dakika içinde geçerliliğini yitirecektir.

Şifre sıfırlama talebinde bulunmadıysanız, bu maili dikkate almayın.

Sorularınız için: info@fanmanager.com

© 2026 Fan Manager
    `,
  }),

  // Hoş geldin maili
  welcome: (userName) => ({
    subject: 'TacticIQ\'a Hoş Geldiniz! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .shield { font-size: 48px; margin-bottom: 20px; }
          .content { color: #E2E8F0; line-height: 1.6; }
          .feature { background-color: #0F172A; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #059669; }
          .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 30px 0; }
          .footer { text-align: center; color: #64748B; font-size: 14px; margin-top: 40px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="shield">🛡️⚽</div>
            <h1 style="color: #FFFFFF;">TacticIQ</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #FFFFFF;">Merhaba ${userName}! 👋</h2>
            
            <p>TacticIQ ailesine hoş geldiniz! Futbol tutkunuzu bir sonraki seviyeye taşımaya hazır mısınız?</p>
            
            <h3 style="color: #059669;">✨ Neler Yapabilirsiniz:</h3>
            
            <div class="feature">
              <strong style="color: #FFFFFF;">⚽ Maç Tahminleri</strong><br>
              Favori takımlarınızın maçlarına tahmin yapın ve puanlar kazanın.
            </div>
            
            <div class="feature">
              <strong style="color: #FFFFFF;">📊 İstatistikler</strong><br>
              Detaylı maç analizleri ve canlı skorlarla takibde kalın.
            </div>
            
            <div class="feature">
              <strong style="color: #FFFFFF;">🏆 Liderlik Tablosu</strong><br>
              Diğer fanlarla yarışın, en iyi tahminciyi gösterin!
            </div>
            
            <div style="text-align: center;">
              <a href="https://fanmanager.com" class="button">Hemen Başla</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Sorularınız için: <a href="mailto:info@tacticiq.com" style="color: #059669;">info@tacticiq.com</a></p>
            <p>© 2026 TacticIQ</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return { success: false, error: 'Email transporter yapılandırılamadı' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"TacticIQ" <${process.env.SMTP_USER || 'info@tacticiq.com'}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('✅ Email gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    return { success: false, error: error.message };
  }
};

// Şifre sıfırlama maili gönder
const sendPasswordResetEmail = async (email, resetLink, userName = '') => {
  const template = EMAIL_TEMPLATES.passwordReset(resetLink, userName);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

// Hoş geldin maili gönder
const sendWelcomeEmail = async (email, userName) => {
  const template = EMAIL_TEMPLATES.welcome(userName);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
};

// Send email to admin (for alerts)
const sendAdminEmail = async (subject, html, text) => {
  return await sendEmail({
    to: 'etemduzok@gmail.com',
    subject,
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminEmail,
};
