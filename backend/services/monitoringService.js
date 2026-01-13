// Backend Monitoring & Auto-Restart Service
// TacticIQ - Backend Health Monitoring

const { sendEmail } = require('./emailService');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const ADMIN_EMAIL = 'etemduzok@gmail.com';
const INFO_EMAIL = 'info@tacticiq.com';
const HEALTH_CHECK_INTERVAL = 30000; // 30 saniye
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_COOLDOWN = 60000; // 1 dakika

let healthCheckInterval = null;
let restartAttempts = 0;
let lastRestartTime = 0;
let isRestarting = false;

// Health check function
const checkBackendHealth = async () => {
  return new Promise((resolve) => {
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const healthData = JSON.parse(data);
            console.log('✅ Backend health check OK:', healthData);
            restartAttempts = 0; // Reset on success
            resolve(true);
          } catch (error) {
            console.error('❌ Failed to parse health response:', error);
            resolve(false);
          }
        } else {
          console.error(`❌ Health check failed: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Backend health check failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Health check timeout');
      resolve(false);
    });

    req.setTimeout(5000);
    req.end();
  });
};

// Restart backend function
const restartBackend = async () => {
  if (isRestarting) {
    console.log('⚠️ Restart already in progress, skipping...');
    return;
  }

  const now = Date.now();
  if (now - lastRestartTime < RESTART_COOLDOWN) {
    console.log('⚠️ Restart cooldown active, skipping...');
    return;
  }

  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('❌ Max restart attempts reached, sending alert...');
    await sendAdminAlert('CRITICAL: Backend failed to restart after multiple attempts');
    return;
  }

  isRestarting = true;
  restartAttempts++;
  lastRestartTime = now;

  console.log(`🔄 Attempting to restart backend (Attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})...`);

  try {
    // Find and kill existing node process on port 3000
    const killCommand = process.platform === 'win32' 
      ? `netstat -ano | findstr :3000 | findstr LISTENING | for /f "tokens=5" %a in ('more') do taskkill /F /PID %a`
      : `lsof -ti:3000 | xargs kill -9`;

    exec(killCommand, (error) => {
      if (error) {
        console.warn('⚠️ Could not kill existing process:', error.message);
      }

      // Wait a bit then start backend
      setTimeout(() => {
        const backendPath = path.join(__dirname, '..');
        const startCommand = process.platform === 'win32'
          ? `cd ${backendPath} && npm run dev`
          : `cd ${backendPath} && npm run dev`;

        exec(startCommand, { 
          detached: true,
          stdio: 'ignore'
        }, (error) => {
          if (error) {
            console.error('❌ Failed to restart backend:', error);
            sendAdminAlert(`CRITICAL: Failed to restart backend - ${error.message}`);
          } else {
            console.log('✅ Backend restart command executed');
            setTimeout(() => {
              isRestarting = false;
            }, 10000); // Wait 10 seconds before allowing another restart
          }
        });
      }, 2000);
    });
  } catch (error) {
    console.error('❌ Restart error:', error);
    isRestarting = false;
    await sendAdminAlert(`CRITICAL: Restart error - ${error.message}`);
  }
};

// Send admin alert email
const sendAdminAlert = async (errorMessage) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    message: errorMessage,
    restartAttempts,
    serverInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
    },
  };

  const emailContent = {
    subject: '🚨 TacticIQ Backend - Critical Alert',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0F172A; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .alert-icon { font-size: 48px; margin-bottom: 20px; }
          .content { color: #E2E8F0; line-height: 1.6; }
          .error-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 16px; margin: 20px 0; border-radius: 8px; }
          .info-box { background-color: rgba(59, 130, 246, 0.1); border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #FFFFFF !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #64748B; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; }
          pre { background-color: #0F172A; padding: 16px; border-radius: 8px; overflow-x: auto; color: #E2E8F0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">🚨</div>
            <h1 style="color: #EF4444;">Backend Critical Alert</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #FFFFFF;">Merhaba Admin,</h2>
            
            <div class="error-box">
              <strong style="color: #EF4444;">⚠️ Backend Servisi Çalışmıyor!</strong><br>
              ${errorMessage}
            </div>
            
            <h3 style="color: #FFFFFF;">📋 Hata Detayları:</h3>
            <pre>${JSON.stringify(errorDetails, null, 2)}</pre>
            
            <div class="info-box">
              <strong style="color: #3B82F6;">🔧 Yapılması Gerekenler:</strong><br><br>
              
              <strong>1. Backend'i Başlatın:</strong><br>
              <code style="background-color: #0F172A; padding: 4px 8px; border-radius: 4px; display: block; margin: 8px 0;">
                cd backend<br>
                npm run dev
              </code><br>
              
              <strong>2. Diğer Servisleri Kontrol Edin:</strong><br>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Frontend (Expo): <code>npm run web</code></li>
                <li>Database (Supabase): Kontrol panelinden kontrol edin</li>
                <li>API-Football: API key'in geçerli olduğundan emin olun</li>
              </ul><br>
              
              <strong>3. Log'ları Kontrol Edin:</strong><br>
              <code style="background-color: #0F172A; padding: 4px 8px; border-radius: 4px; display: block; margin: 8px 0;">
                backend/logs/error.log
              </code>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/health" class="button">Backend Health Check</a>
            </div>
            
            <p><strong>Not:</strong> Bu mail otomatik olarak gönderilmiştir. Backend servisi düzeltildikten sonra sistem normal çalışmaya devam edecektir.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 TacticIQ - Monitoring System</p>
            <p>Bu mail otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🚨 TacticIQ Backend - Critical Alert

Merhaba Admin,

Backend servisi çalışmıyor!

Hata: ${errorMessage}

Hata Detayları:
${JSON.stringify(errorDetails, null, 2)}

Yapılması Gerekenler:

1. Backend'i Başlatın:
   cd backend
   npm run dev

2. Diğer Servisleri Kontrol Edin:
   - Frontend (Expo): npm run web
   - Database (Supabase): Kontrol panelinden kontrol edin
   - API-Football: API key'in geçerli olduğundan emin olun

3. Log'ları Kontrol Edin:
   backend/logs/error.log

Backend Health Check: http://localhost:3000/health

Not: Bu mail otomatik olarak gönderilmiştir.

© 2026 TacticIQ - Monitoring System
    `,
  };

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      ...emailContent,
    });
    console.log('✅ Admin alert email sent');
  } catch (error) {
    console.error('❌ Failed to send admin alert:', error);
  }
};

// Start monitoring
const startMonitoring = () => {
  console.log('🔍 Starting backend monitoring service...');
  
  healthCheckInterval = setInterval(async () => {
    const isHealthy = await checkBackendHealth();
    
    if (!isHealthy && !isRestarting) {
      console.log('⚠️ Backend is down, attempting restart...');
      await sendAdminAlert('Backend health check failed - Auto-restart initiated');
      await restartBackend();
    }
  }, HEALTH_CHECK_INTERVAL);
  
  console.log(`✅ Monitoring started (checking every ${HEALTH_CHECK_INTERVAL / 1000} seconds)`);
};

// Stop monitoring
const stopMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 Monitoring stopped');
  }
};

// HTTP module is used directly in checkBackendHealth function

module.exports = {
  startMonitoring,
  stopMonitoring,
  checkBackendHealth,
  restartBackend,
  sendAdminAlert,
};
