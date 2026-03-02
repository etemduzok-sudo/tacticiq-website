// TacticIQ - Backend API Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
// Her zaman backend/.env kullan (proje kökünden çalıştırılsa bile)
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ✅ SECURITY: Import auth middleware for protected endpoints
const { authenticateApiKey } = require('./middleware/auth');

// 📊 Player Ratings Scheduler (Haftalık güncelleme)
const playerRatingsScheduler = require('./services/playerRatingsScheduler');

// 🔴 Live Match Service (Canlı maç senkronizasyonu)
const liveMatchService = require('./services/liveMatchService');

// 🛡️ Global Error Handlers - Backend'in sürekli durmasını engeller
process.on('uncaughtException', (error) => {
  const timestamp = new Date().toISOString();
  console.error(`\n❌ [${timestamp}] UNCAUGHT EXCEPTION:`);
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  // ⚠️ Critical error - ama backend'i durdurma, sadece log'la
  // Watchdog script backend'i yeniden başlatacak
  console.error('⚠️ Backend çalışmaya devam ediyor... (Watchdog yeniden başlatabilir)');
  console.error('');
  // process.exit(1); // KALDIRILDI - Backend durmasın
});

process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString();
  console.error(`\n❌ [${timestamp}] UNHANDLED REJECTION:`);
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  // Log error but don't crash - allow server to continue
  // Sadece log'la, process.exit yapma
  console.error('⚠️ Backend çalışmaya devam ediyor...');
  console.error('');
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received - shutting down gracefully');
  process.exit(0);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Web için esnek
  crossOriginEmbedderPolicy: false,
})); // Security headers

// ========== RENDER HEALTH CHECK - EN BAŞTA (CORS'dan ÖNCE) ==========
// Panelden fetch yapıldığında CORS gerekli; yoksa tarayıcı yanıtı engeller ve "çalışmıyor" görünür
function setHealthCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
}
app.options('/health', (req, res) => {
  setHealthCors(req, res);
  res.sendStatus(204);
});
app.get('/health', (req, res) => {
  setHealthCors(req, res);
  res.status(200).setHeader('Content-Type', 'application/json').end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
});
app.get('/', (req, res) => {
  res.status(200).setHeader('Content-Type', 'application/json').end(JSON.stringify({
    status: 'ok',
    service: 'TacticIQ Backend API',
    version: '2.0.0',
  }));
});
// ========== /HEALTH BİTTİ ==========

// ✅ SECURITY: Restrictive CORS configuration
const allowedOrigins = [
  // Production
  'https://tacticiq.app',
  'https://www.tacticiq.app',
  'https://admin.tacticiq.app',
  'https://tacticiq-website.vercel.app',
  // Development only (NODE_ENV check)
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:8081',   // Expo default
    'http://localhost:8082',   // Expo alternative port
    'http://localhost:8085',   // Expo web (current)
    'http://localhost:8086',   // Expo web alternative
    'http://localhost:19006',  // Expo web (old)
    'http://localhost:3000',   // Self
    'http://localhost:3001',   // Self (correct port)
    'http://localhost:5173',   // Vite (Website)
    'http://localhost:5174',   // Vite alternative port
    'http://127.0.0.1:5173',   // Vite (127.0.0.1)
    'http://127.0.0.1:8081',   // Expo (127.0.0.1)
  ] : []),
];

// Development = NODE_ENV !== 'production' (undefined da kabul)
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: (origin, callback) => {
    // Origin yoksa (Postman, mobil) izin ver
    if (!origin) return callback(null, true);
    // Development'ta localhost ve 127.0.0.1 her port için izin ver
    if (isDev && (origin.includes('localhost') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    // Development'ta LAN IP
    if (isDev && /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('⚠️ CORS: Blocked origin:', origin);
    callback(new Error('CORS policy violation'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204,
})); // Enable CORS for web
app.use(compression()); // Compress responses
app.use(express.json());

// 🔥 API Rate Limiter (7,500 calls/day)
const { rateLimiterMiddleware, getStats, resetCounter, DISABLE_RATE_LIMITER } = require('./middleware/rateLimiter');
app.use(rateLimiterMiddleware);

// Development modunda rate limiter durumunu logla
if (DISABLE_RATE_LIMITER) {
  console.log('⚠️ [RATE LIMITER] Development modunda DEVRE DIŞI');
}

// 🚀 Aggressive Cache Service: Render için listen'den SONRA başlatılacak (setImmediate içinde)

// Routes
const matchesRouter = require('./routes/matches');
const leaguesRouter = require('./routes/leagues');
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const authRouter = require('./routes/auth');
const predictionsRouter = require('./routes/predictions');
const scoringRouter = require('./routes/scoring');
const staticTeamsRouter = require('./routes/staticTeams');
const squadPredictionsRouter = require('./routes/squadPredictions'); // 📋 Kadro tahminleri
const bulkDataRouter = require('./routes/bulkData'); // 📦 Bulk veri indirme

app.use('/api/matches', matchesRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/auth', authRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/scoring', scoringRouter);
app.use('/api/email', require('./routes/email'));
app.use('/api/static-teams', staticTeamsRouter); // ⚡ Hızlı statik takımlar
app.use('/api/timeline', require('./routes/timeline')); // 📊 Maç akışı
app.use('/api/leaderboard/snapshots', require('./routes/leaderboardSnapshots')); // 📸 Sıralama geçmişi
app.use('/api/squad-predictions', squadPredictionsRouter); // 📋 Kadro tahminleri ve istatistikler
app.use('/api/bulk-data', bulkDataRouter); // 📦 Tüm takım verilerini tek seferde indir (offline)

// 🔥 API kullanım: 75K = 50K (DB güncellemeleri) + 25K (maç sync)
app.get('/api/usage', (req, res) => {
  try {
    const apiUsageTracker = require('./services/apiUsageTracker');
    const status = apiUsageTracker.getStatus();
    res.json({ success: true, ...status });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 🔥 Rate Limiter Stats — API-Football günlük çağrı (maç sync + DB güncellemeleri)
app.get('/api/rate-limit/stats', (req, res) => {
  const stats = getStats();
  let usage = { matchSync: { used: 0, limit: 25000 }, dbUpdates: { used: 0, limit: 50000 } };
  try {
    const apiUsageTracker = require('./services/apiUsageTracker');
    usage = apiUsageTracker.getStatus();
  } catch (e) { /* */ }
  const todaysCalls = usage.matchSync.used + usage.dbUpdates.used;
  const limit = 75000;
  const remaining = Math.max(0, limit - todaysCalls);
  res.json({
    success: true,
    ...stats,
    todaysCalls,
    remaining,
    limit,
    matchSync: usage.matchSync,
    dbUpdates: usage.dbUpdates,
    rateLimiterDisabled: DISABLE_RATE_LIMITER,
  });
});

// 🔄 Rate Limiter Reset (Development only)
app.post('/api/rate-limit/reset', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, error: 'Only available in development mode' });
  }
  const result = resetCounter();
  console.log('🔄 [RATE LIMITER] Counter reset via API');
  res.json({ success: true, ...result, message: 'Rate limiter counter reset successfully' });
});

// 🚀 Aggressive Cache Stats
app.get('/api/cache/stats', (req, res) => {
  try {
    const aggressiveCacheService = require('./services/aggressiveCacheService');
    const cacheStats = aggressiveCacheService.getStats();
    res.json({ success: true, ...cacheStats });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============================================
// STATUS ENDPOINTS
// ============================================

// Sync status endpoint
app.get('/api/sync-status', (req, res) => {
  try {
    const smartSyncService = require('./services/smartSyncService');
    const status = smartSyncService.getStatus();
    res.json(status);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Static teams status
app.get('/api/static-teams/status', (req, res) => {
  try {
    const staticTeamsScheduler = require('./services/staticTeamsScheduler');
    const status = staticTeamsScheduler.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Leaderboard snapshot status
app.get('/api/leaderboard/snapshot-status', (req, res) => {
  try {
    const snapshotService = require('./services/leaderboardSnapshotService');
    const status = snapshotService.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DB güncelleme ilerleme raporu (yüzde: koç, renk, kadro, rating, genel)
app.get('/api/db-update-status', async (req, res) => {
  try {
    const dbStatusReportService = require('./services/dbStatusReportService');
    const stats = await dbStatusReportService.fetchStats();
    if (!stats) {
      return res.status(503).json({ success: false, error: 'Supabase yapılandırılmadı veya veri alınamadı.' });
    }
    res.json({
      success: true,
      at: stats.at,
      percent: {
        coach: stats.coachPct,
        colors: stats.colorsPct,
        squads: stats.squadsPct,
        rating: stats.ratingPct,
        abilities: stats.abilitiesPct,
        overall: stats.avgPct,
      },
      counts: {
        totalTeams: stats.totalTeams,
        withCoach: stats.withCoach,
        withColors: stats.withColors,
        squads2025: stats.squads2025,
        totalPlayers: stats.totalPlayers,
        playersWithRating: stats.playersWithRating,
        playersWithAbilities: stats.playersWithAbilities,
      },
      summary: `DB güncellemesi: ${stats.avgPct}% (Koç ${stats.coachPct}% | Renk ${stats.colorsPct}% | Kadro ${stats.squadsPct}% | Rating ${stats.ratingPct}%)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Full system status
app.get('/api/system-status', (req, res) => {
  try {
    const smartSyncService = require('./services/smartSyncService');
    const staticTeamsScheduler = require('./services/staticTeamsScheduler');
    const snapshotService = require('./services/leaderboardSnapshotService');
    
    // Player Ratings Scheduler durumu
    let playerRatingsStatus = null;
    try {
      if (process.env.RUN_PLAYER_RATINGS_JOB === 'true') {
        playerRatingsStatus = playerRatingsScheduler.getSchedulerStatus();
      }
    } catch (err) {
      playerRatingsStatus = { error: err.message };
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        worldwideSync: smartSyncService.getStatus(),
        staticTeams: staticTeamsScheduler.getStatus(),
        leaderboardSnapshots: snapshotService.getStatus(),
        playerRatings: playerRatingsStatus,
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ============================================
// SERVICE CONTROL ENDPOINTS
// ✅ SECURITY: Requires API key authentication
// ============================================

// Control a specific service
app.post('/api/services/control', authenticateApiKey, async (req, res) => {
  const { serviceId, action } = req.body;
  
  if (!serviceId || !action) {
    return res.status(400).json({ success: false, error: 'serviceId and action required' });
  }
  
  if (!['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ success: false, error: 'action must be start, stop, or restart' });
  }
  
  try {
    let result = { success: true, message: '' };
    
    switch (serviceId) {
      case 'smartSync':
      case 'worldwideSync': {
        const smartSyncService = require('./services/smartSyncService');
        if (action === 'stop') {
          smartSyncService.stopSync();
          result.message = 'Worldwide Sync durduruldu';
        } else if (action === 'start' || action === 'restart') {
          if (action === 'restart') smartSyncService.stopSync();
          smartSyncService.startSync();
          result.message = 'Worldwide Sync başlatıldı';
        }
        break;
      }
      
      case 'staticTeams': {
        const staticTeamsScheduler = require('./services/staticTeamsScheduler');
        if (action === 'stop') {
          staticTeamsScheduler.stopScheduler();
          result.message = 'Static Teams Scheduler durduruldu';
        } else if (action === 'start' || action === 'restart') {
          if (action === 'restart') staticTeamsScheduler.stopScheduler();
          staticTeamsScheduler.startScheduler();
          result.message = 'Static Teams Scheduler başlatıldı';
        }
        break;
      }
      
      case 'leaderboard': {
        const snapshotService = require('./services/leaderboardSnapshotService');
        if (action === 'stop') {
          snapshotService.stopSnapshotService();
          result.message = 'Leaderboard Snapshots durduruldu';
        } else if (action === 'start' || action === 'restart') {
          if (action === 'restart') snapshotService.stopSnapshotService();
          snapshotService.startSnapshotService();
          result.message = 'Leaderboard Snapshots başlatıldı';
        }
        break;
      }
      
      case 'cache': {
        const aggressiveCacheService = require('./services/aggressiveCacheService');
        if (action === 'stop') {
          aggressiveCacheService.stopAggressiveCaching();
          result.message = 'Cache Service durduruldu';
        } else if (action === 'start' || action === 'restart') {
          if (action === 'restart') aggressiveCacheService.stopAggressiveCaching();
          aggressiveCacheService.startAggressiveCaching();
          result.message = 'Cache Service başlatıldı';
        }
        break;
      }
      
      case 'monitoring': {
        const monitoringService = require('./services/monitoringService');
        if (action === 'stop') {
          monitoringService.stopMonitoring();
          result.message = 'Monitoring durduruldu';
        } else if (action === 'start' || action === 'restart') {
          if (action === 'restart') monitoringService.stopMonitoring();
          monitoringService.startMonitoring();
          result.message = 'Monitoring başlatıldı';
        }
        break;
      }
      
      case 'expo': {
        // Expo sadece yerel ortamda başlatılabilir (Render'da spawn yok)
        if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
          result.success = false;
          result.message = 'Expo sadece yerel ortamda (backend localhost\'ta çalışırken) Başlat ile açılabilir.';
          break;
        }
        // Expo Web servisi kontrolü
        if (action === 'stop') {
          // Windows'ta port 8081'i kullanan process'i durdur
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Expo*'], { shell: true, detached: true });
            } else {
              spawn('pkill', ['-f', 'expo.*web'], { shell: true, detached: true });
            }
            result.message = 'Expo Web durduruldu';
          } catch (error) {
            result.success = false;
            result.message = `Expo durdurulamadı: ${error.message}`;
          }
        } else if (action === 'start' || action === 'restart') {
          try {
            const projectRoot = path.resolve(__dirname, '..');
            const isWindows = process.platform === 'win32';
            
            if (action === 'restart') {
              // Önce durdur
              if (isWindows) {
                spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Expo*'], { shell: true, detached: true });
              } else {
                spawn('pkill', ['-f', 'expo.*web'], { shell: true, detached: true });
              }
              // Kısa bir bekleme (non-blocking)
              setTimeout(() => {
                // Restart işlemi devam ediyor
              }, 1000);
            }
            
            // Expo'yu başlat
            const expoProcess = spawn(
              isWindows ? 'npx.cmd' : 'npx',
              ['expo', 'start', '--web', '--clear'],
              {
                cwd: projectRoot,
                detached: true,
                stdio: 'ignore',
                shell: isWindows,
                windowsVerbatimArguments: false,
              }
            );
            
            expoProcess.unref();
            result.message = 'Expo Web başlatıldı (arka planda çalışıyor)';
          } catch (error) {
            result.success = false;
            result.message = `Expo başlatılamadı: ${error.message}. Lütfen terminalden manuel olarak başlatın: npx expo start --web`;
          }
        }
        break;
      }
      
      case 'website': {
        // Website sadece yerel ortamda başlatılabilir (Render'da spawn yok)
        if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
          result.success = false;
          result.message = 'Website sadece yerel ortamda (backend localhost\'ta çalışırken) Başlat ile açılabilir.';
          break;
        }
        // Website (Vite) servisi kontrolü
        if (action === 'stop') {
          // Windows'ta port 5173'ü kullanan process'i durdur
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Website*'], { shell: true, detached: true });
            } else {
              spawn('pkill', ['-f', 'vite.*5173'], { shell: true, detached: true });
            }
            result.message = 'Website durduruldu';
          } catch (error) {
            result.success = false;
            result.message = `Website durdurulamadı: ${error.message}`;
          }
        } else if (action === 'start' || action === 'restart') {
          try {
            const websiteDir = path.resolve(__dirname, '..', 'website');
            
            // Website klasörünün var olduğunu kontrol et
            if (!fs.existsSync(websiteDir)) {
              result.success = false;
              result.message = 'Website klasörü bulunamadı';
              break;
            }
            
            if (action === 'restart') {
              // Önce durdur
              if (process.platform === 'win32') {
                spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Website*'], { shell: true, detached: true });
              } else {
                spawn('pkill', ['-f', 'vite.*5173'], { shell: true, detached: true });
              }
              // Kısa bir bekleme (non-blocking)
              setTimeout(() => {
                // Restart işlemi devam ediyor
              }, 1000);
            }
            
            // Website'i başlat
            const websiteProcess = spawn(
              process.platform === 'win32' ? 'npm.cmd' : 'npm',
              ['run', 'dev'],
              {
                cwd: websiteDir,
                detached: true,
                stdio: 'ignore',
                shell: process.platform === 'win32',
                windowsVerbatimArguments: false,
              }
            );
            
            websiteProcess.unref();
            result.message = 'Website başlatıldı (arka planda çalışıyor)';
          } catch (error) {
            result.success = false;
            result.message = `Website başlatılamadı: ${error.message}. Lütfen terminalden manuel olarak başlatın: cd website && npm run dev`;
          }
        }
        break;
      }
      
      case 'backend': {
        // Render API ile backend'i restart et
        if (action === 'restart' || action === 'start') {
          const renderApiKey = process.env.RENDER_API_KEY;
          const renderServiceId = process.env.RENDER_SERVICE_ID || 'srv-d5vim9juibrs73cr23cg';
          
          if (!renderApiKey) {
            result.success = false;
            result.message = 'Render API Key bulunamadı. Backend .env dosyasına RENDER_API_KEY ekleyin.';
            break;
          }
          
          try {
            const renderRes = await axios.post(
              `https://api.render.com/v1/services/${renderServiceId}/deploys`,
              { clearBuildCache: false },
              {
                headers: {
                  'Authorization': `Bearer ${renderApiKey}`,
                  'Content-Type': 'application/json',
                },
                timeout: 30000,
              }
            );
            
            result.success = true;
            result.message = `Backend restart tetiklendi. Deploy ID: ${renderRes.data.deploy?.id || 'N/A'}`;
            result.deployId = renderRes.data.deploy?.id;
          } catch (error) {
            result.success = false;
            result.message = `Render API hatası: ${error.response?.data?.message || error.message}`;
          }
        } else if (action === 'stop') {
          result.success = false;
          result.message = 'Backend\'i durdurmak için Render Dashboard kullanın.';
        } else {
          result.success = false;
          result.message = 'Backend kendisini kontrol edemez. Lütfen terminalden manuel olarak yönetin.';
        }
        break;
      }
      
      case 'supabase': {
        // Supabase cloud servis, kontrol edilemez
        result.success = false;
        result.message = 'Supabase cloud servisidir ve buradan kontrol edilemez. Durum kontrolü için Supabase Dashboard kullanın.';
        break;
      }
      
      default:
        return res.status(400).json({ success: false, error: `Unknown service: ${serviceId}` });
    }
    
    console.log(`🔧 Service control: ${serviceId} - ${action} - ${result.message}`);
    res.json(result);
  } catch (error) {
    console.error(`❌ Service control error: ${serviceId} - ${action}`, error);
    res.json({ success: false, error: error.message });
  }
});

// Restart all services
// ✅ SECURITY: Requires API key authentication
app.post('/api/services/restart-all', authenticateApiKey, (req, res) => {
  try {
    const smartSyncService = require('./services/smartSyncService');
    const staticTeamsScheduler = require('./services/staticTeamsScheduler');
    const snapshotService = require('./services/leaderboardSnapshotService');
    const aggressiveCacheService = require('./services/aggressiveCacheService');
    
    // Stop all backend services
    try {
      smartSyncService.stopSync();
    } catch (e) { console.warn('Sync stop error:', e.message); }
    
    try {
      staticTeamsScheduler.stopScheduler();
    } catch (e) { console.warn('Teams stop error:', e.message); }
    
    try {
      snapshotService.stopSnapshotService();
    } catch (e) { console.warn('Leaderboard stop error:', e.message); }
    
    try {
      aggressiveCacheService.stopAggressiveCaching();
    } catch (e) { console.warn('Cache stop error:', e.message); }
    
    // Stop Expo and Website if running
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Expo*'], { shell: true, detached: true });
        spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *Website*'], { shell: true, detached: true });
      } else {
        spawn('pkill', ['-f', 'expo.*web'], { shell: true, detached: true });
        spawn('pkill', ['-f', 'vite.*5173'], { shell: true, detached: true });
      }
    } catch (e) { console.warn('External services stop error:', e.message); }
    
    // Wait a bit then start all
    setTimeout(() => {
      try {
        smartSyncService.startSync();
        staticTeamsScheduler.startScheduler();
        snapshotService.startSnapshotService();
        aggressiveCacheService.startAggressiveCaching();
      } catch (e) {
        console.error('Error starting backend services:', e.message);
      }
      
      // Start Expo and Website
      try {
        const projectRoot = path.resolve(__dirname, '..');
        const websiteDir = path.resolve(__dirname, '..', 'website');
        const isWindows = process.platform === 'win32';
        
        // Start Expo
        if (fs.existsSync(projectRoot)) {
          const expoProcess = spawn(
            isWindows ? 'npx.cmd' : 'npx',
            ['expo', 'start', '--web', '--clear'],
            {
              cwd: projectRoot,
              detached: true,
              stdio: 'ignore',
              shell: isWindows,
              windowsVerbatimArguments: false,
            }
          );
          expoProcess.unref();
        }
        
        // Start Website
        if (fs.existsSync(websiteDir)) {
          const websiteProcess = spawn(
            isWindows ? 'npm.cmd' : 'npm',
            ['run', 'dev'],
            {
              cwd: websiteDir,
              detached: true,
              stdio: 'ignore',
              shell: isWindows,
              windowsVerbatimArguments: false,
            }
          );
          websiteProcess.unref();
        }
      } catch (e) {
        console.warn('Error starting external services:', e.message);
      }
    }, 2000);
    
    console.log('🔄 All services restart initiated');
    res.json({ success: true, message: 'Tüm servisler yeniden başlatılıyor (arka planda)...' });
  } catch (error) {
    console.error('❌ Restart all services error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Auto-restart configuration
let autoRestartEnabled = true;
let autoRestartInterval = null;

app.get('/api/services/auto-restart-status', (req, res) => {
  res.json({ 
    success: true, 
    enabled: autoRestartEnabled,
    checkInterval: 30000 // 30 seconds
  });
});

app.post('/api/services/auto-restart', (req, res) => {
  const { enabled } = req.body;
  autoRestartEnabled = enabled !== false;
  
  if (autoRestartEnabled && !autoRestartInterval) {
    // Start auto-restart checker
    autoRestartInterval = setInterval(() => {
      try {
        const smartSyncService = require('./services/smartSyncService');
        const status = smartSyncService.getStatus();
        
        if (!status.isRunning) {
          console.log('🔄 Auto-restart: Worldwide Sync was stopped, restarting...');
          smartSyncService.startSync();
        }
      } catch (error) {
        console.error('❌ Auto-restart check error:', error);
      }
    }, 30000); // Check every 30 seconds
    
    console.log('✅ Auto-restart enabled');
  } else if (!autoRestartEnabled && autoRestartInterval) {
    clearInterval(autoRestartInterval);
    autoRestartInterval = null;
    console.log('⏹️ Auto-restart disabled');
  }
  
  res.json({ success: true, enabled: autoRestartEnabled });
});

// ============================================
// PLAYER RATINGS API
// ============================================

// GET /api/admin/player-ratings/status - Scheduler durumu
// Admin giriş bildirimi: giriş yapıldığında e-posta gönder (API key gerekli)
const { sendAdminLoginNotification } = require('./services/emailService');
app.post('/api/admin/login-notify', authenticateApiKey, async (req, res) => {
  try {
    const { email, userAgent } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'email gerekli' });
    }
    const ip = req.ip || req.socket?.remoteAddress || '';
    const result = await sendAdminLoginNotification(email.trim(), ip, userAgent || '');
    if (result.success) {
      return res.json({ success: true, message: 'Bildirim gönderildi' });
    }
    return res.status(500).json({ success: false, error: result.error || 'E-posta gönderilemedi' });
  } catch (error) {
    console.error('Admin login-notify error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/player-ratings/status', authenticateApiKey, (req, res) => {
  const status = playerRatingsScheduler.getSchedulerStatus();
  res.json({ success: true, ...status });
});

// POST /api/admin/player-ratings/update - Manuel güncelleme tetikle
app.post('/api/admin/player-ratings/update', authenticateApiKey, async (req, res) => {
  const { leagueId } = req.body;
  
  try {
    const result = await playerRatingsScheduler.triggerManualUpdate(leagueId || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/player-ratings/leagues - Desteklenen ligler
app.get('/api/admin/player-ratings/leagues', authenticateApiKey, (req, res) => {
  const { SUPPORTED_LEAGUES } = require('./scripts/update-all-player-ratings');
  res.json({ 
    success: true, 
    leagues: Object.entries(SUPPORTED_LEAGUES).map(([name, info]) => ({
      name,
      id: info.id,
      country: info.country,
      priority: info.priority,
    }))
  });
});

// GET/POST /api/admin/backup-db - DB yedek alır ve Supabase Storage'a yükler (cron-job.org varsayılan GET ile tetiklenebilir)
// API key: header x-api-key veya query ?api_key=XXX (cron-job.org'da POST/header yoksa URL'de api_key kullanın)
const BACKUP_STORAGE_BUCKET = 'db-backups';
function copyBackupApiKeyFromQuery(req, res, next) {
  if (!req.headers['x-api-key'] && req.query.api_key) {
    req.headers['x-api-key'] = req.query.api_key;
  }
  next();
}
async function handleBackupDb(req, res) {
  try {
    const { supabase } = require('./config/supabase');
    const { TABLES_TO_BACKUP, fetchOneTable } = require('./services/backupService');
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase yapılandırılmadı.' });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const folderName = `backup-${timestamp}`;
    const uploaded = [];
    const results = [];
    let totalRecords = 0;
    // Tablo tablo oku + yükle (aynı anda tek tablo bellekte = 512MB limitinde OOM riski azalır)
    for (const tableName of TABLES_TO_BACKUP) {
      const data = await fetchOneTable(supabase, tableName);
      if (data === null) {
        results.push({ table: tableName, success: false, count: 0 });
        continue;
      }
      const body = Buffer.from(JSON.stringify(data), 'utf8');
      const { error } = await supabase.storage
        .from(BACKUP_STORAGE_BUCKET)
        .upload(`${folderName}/${tableName}.json`, body, { contentType: 'application/json', upsert: true });
      if (error) {
        console.error(`[backup-db] Storage upload ${tableName}:`, error.message);
        return res.status(500).json({
          success: false,
          error: `Storage yükleme hatası: ${error.message}. Supabase Dashboard → Storage → "${BACKUP_STORAGE_BUCKET}" bucket'ını oluşturun (public değil).`,
          folderName,
          uploaded,
        });
      }
      uploaded.push(tableName);
      results.push({ table: tableName, success: true, count: data.length });
      totalRecords += data.length;
    }
    const summary = {
      timestamp: new Date().toISOString(),
      folderName,
      tables: results,
      totalRecords,
    };
    const summaryBody = Buffer.from(JSON.stringify(summary), 'utf8');
    const { error: summaryErr } = await supabase.storage
      .from(BACKUP_STORAGE_BUCKET)
      .upload(`${folderName}/_summary.json`, summaryBody, { contentType: 'application/json', upsert: true });
    if (summaryErr) {
      console.warn('[backup-db] _summary upload:', summaryErr.message);
    } else {
      uploaded.push('_summary.json');
    }
    res.json({
      success: true,
      folderName,
      totalRecords,
      uploaded,
      message: 'Yedek Supabase Storage\'a yüklendi. Bilgisayar kapalıyken cron-job.org vb. ile bu endpoint günlük tetiklenebilir.',
    });
  } catch (err) {
    console.error('[backup-db]', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
app.get('/api/admin/backup-db', copyBackupApiKeyFromQuery, authenticateApiKey, handleBackupDb);
app.post('/api/admin/backup-db', authenticateApiKey, handleBackupDb);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server - Render: host 0.0.0.0 ZORUNLU (port scan timeout önleme)
app.listen(PORT, '0.0.0.0', () => {
  // Render port scan için KRİTİK - hemen log (setImmediate'den ÖNCE)
  console.log('\n');
  console.log('============================================================');
  console.log(`✅ SERVER LISTENING ON PORT ${PORT}`);
  console.log(`✅ Health: http://0.0.0.0:${PORT}/health`);
  console.log('============================================================\n');
  
  // Servisleri async başlat (port bind edildikten sonra)
  setImmediate(() => {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           🚀 TACTICIQ BACKEND STARTED 🚀                   ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Port: ${PORT}                                                  ║`);
    console.log(`║ Health: http://localhost:${PORT}/health                       ║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // ============================================
    // 0. AGGRESSIVE CACHE (Render: listen sonrası, health check önceliği)
    // ============================================
    try {
      const aggressiveCacheService = require('./services/aggressiveCacheService');
      aggressiveCacheService.startAggressiveCaching();
      console.log(`🚀 Aggressive cache service started`);
    } catch (error) {
      console.error('❌ Failed to start aggressive cache service:', error.message);
    }

    // ============================================
    // 1. WORLDWIDE SYNC SERVICE (Sabit 12s)
    // ============================================
    try {
      const smartSyncService = require('./services/smartSyncService');
      smartSyncService.startSync();
      console.log(`🌍 Worldwide sync started (fixed 12s interval)`);
    } catch (error) {
      console.error('❌ Failed to start smart sync service:', error.message);
    }
    
    // ============================================
    // 2. STATIC TEAMS SCHEDULER (Günde 2x)
    // ============================================
    try {
      const staticTeamsScheduler = require('./services/staticTeamsScheduler');
      staticTeamsScheduler.startScheduler();
      console.log(`🏆 Static teams scheduler started (daily at 08:00 & 20:00 UTC)`);
    } catch (error) {
      console.error('❌ Failed to start static teams scheduler:', error.message);
    }

    // ============================================
    // 2.5 KADRO SYNC (Günde 1 kez - API kotası aşılmaz)
    // ============================================
    try {
      const squadSyncService = require('./services/squadSyncService');
      squadSyncService.startDailySquadSync();
      console.log(`👥 Kadro sync started (every 24h, app reads from DB only)`);
    } catch (error) {
      console.error('❌ Failed to start squad sync:', error.message);
    }
    
    // ============================================
    // 3. LEADERBOARD SNAPSHOT SERVICE
    // ============================================
    try {
      const snapshotService = require('./services/leaderboardSnapshotService');
      snapshotService.startSnapshotService();
      console.log(`📸 Leaderboard snapshot service started`);
    } catch (error) {
      console.error('❌ Failed to start snapshot service:', error.message);
    }
    
    // ============================================
    // 4. MONITORING SERVICE
    // ============================================
    try {
      const monitoringService = require('./services/monitoringService');
      setTimeout(() => {
        try {
          monitoringService.startMonitoring();
          console.log(`🔍 Monitoring service started`);
        } catch (error) {
          console.error('❌ Failed to start monitoring service:', error.message);
        }
      }, 10000);
    } catch (error) {
      console.warn('⚠️ Monitoring service could not be loaded:', error.message);
    }
    
    // ============================================
    // 5. PLAYER RATINGS SCHEDULER
    // ============================================
    if (process.env.RUN_PLAYER_RATINGS_JOB === 'true') {
      try {
        playerRatingsScheduler.startScheduler();
        console.log(`📊 Player ratings scheduler started`);
      } catch (error) {
        console.warn('⚠️ Player ratings scheduler could not be started:', error.message);
      }
    } else {
      console.log('⏭️  Player ratings scheduler skipped (RUN_PLAYER_RATINGS_JOB not set)');
    }
    
    // ============================================
    // 6. LIVE MATCH SERVICE (15s polling - canlı maç durumu senkronizasyonu)
    // ============================================
    try {
      liveMatchService.startPolling();
      console.log(`🔴 Live match polling started (15s interval)`);
    } catch (error) {
      console.error('❌ Failed to start live match polling:', error.message);
    }

    // ============================================
    // 7. DB GÜNCELLEME RAPORU (5 dk'da bir - lig, takım, koç, kadro, rating, yetenek)
    // ============================================
    try {
      const dbStatusReportService = require('./services/dbStatusReportService');
      dbStatusReportService.startPeriodicReport(5 * 60 * 1000);
    } catch (error) {
      console.warn('⚠️ DB rapor servisi başlatılamadı:', error.message);
    }
  });
  
  // ============================================
  // STARTUP COMPLETE
  // ============================================
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           ✅ ALL SERVICES INITIALIZED                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Active Services:                                          ║');
  console.log('║   • Worldwide Sync (12s) - Live matches & timeline        ║');
  console.log('║   • Live Match Polling (15s) - Real-time status sync      ║');
  console.log('║   • Static Teams (2x/day) - Team data updates             ║');
  console.log('║   • Leaderboard Snapshots - Daily/weekly rankings         ║');
  console.log('║   • Monitoring - Health checks & alerts                   ║');
  console.log('║   • Player Ratings (Weekly) - Attributes & ratings        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
});
