// TacticIQ - Backend API Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// ✅ SECURITY: Import auth middleware for protected endpoints
const { authenticateApiKey } = require('./middleware/auth');

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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Web için esnek
  crossOriginEmbedderPolicy: false,
})); // Security headers
// ✅ SECURITY: Restrictive CORS configuration
const allowedOrigins = [
  // Production
  'https://tacticiq.app',
  'https://www.tacticiq.app',
  'https://tacticiq-website.vercel.app',
  // Development only (NODE_ENV check)
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:8081',   // Expo default
    'http://localhost:8082',   // Expo alternative port
    'http://localhost:19006',  // Expo web
    'http://localhost:3000',   // Self
    'http://localhost:3001',   // Self (correct port)
    'http://localhost:5173',   // Vite (Website)
    'http://localhost:5174',   // Vite alternative port
    'http://127.0.0.1:5173',   // Vite (127.0.0.1)
    'http://127.0.0.1:8081',   // Expo (127.0.0.1)
  ] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      // ✅ SECURITY: Only allow no-origin in development
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Origin required'), false);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow LAN IPs only in development
    if (process.env.NODE_ENV === 'development' && /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
      return callback(null, true);
    }
    
    console.warn('⚠️ CORS: Blocked origin:', origin);
    callback(new Error('CORS policy violation'), false);
  },
  credentials: true,
})); // Enable CORS for web
app.use(compression()); // Compress responses
app.use(express.json());

// 🔥 API Rate Limiter (7,500 calls/day)
const { rateLimiterMiddleware, getStats } = require('./middleware/rateLimiter');
app.use(rateLimiterMiddleware);

// 🚀 Aggressive Cache Service (maximize API usage)
try {
  const aggressiveCacheService = require('./services/aggressiveCacheService');
  aggressiveCacheService.startAggressiveCaching();
} catch (error) {
  console.error('❌ Failed to start aggressive cache service:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit - continue without aggressive caching
}

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 🔥 Rate Limiter Stats
app.get('/api/rate-limit/stats', (req, res) => {
  const stats = getStats();
  res.json({
    success: true,
    ...stats,
  });
});

// 🚀 Aggressive Cache Stats
app.get('/api/cache/stats', (req, res) => {
  const cacheStats = aggressiveCacheService.getStats();
  res.json({
    success: true,
    ...cacheStats,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TacticIQ API',
    version: '2.0.0',
    description: 'Worldwide Football Data Platform',
    endpoints: {
      core: [
        '/api/matches',
        '/api/leagues',
        '/api/teams',
        '/api/players',
        '/api/predictions',
        '/api/scoring',
      ],
      data: [
        '/api/static-teams',
        '/api/timeline/:matchId',
        '/api/timeline/:matchId/goals',
        '/api/timeline/:matchId/summary',
      ],
      leaderboard: [
        '/api/leaderboard/snapshots',
        '/api/leaderboard/snapshots/weekly',
        '/api/leaderboard/user/:userId/history',
      ],
      status: [
        '/health',
        '/api/sync-status',
        '/api/static-teams/status',
        '/api/leaderboard/snapshot-status',
        '/api/system-status',
      ],
    },
  });
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

// Full system status
app.get('/api/system-status', (req, res) => {
  try {
    const smartSyncService = require('./services/smartSyncService');
    const staticTeamsScheduler = require('./services/staticTeamsScheduler');
    const snapshotService = require('./services/leaderboardSnapshotService');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        worldwideSync: smartSyncService.getStatus(),
        staticTeams: staticTeamsScheduler.getStatus(),
        leaderboardSnapshots: snapshotService.getStatus(),
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
app.post('/api/services/control', authenticateApiKey, (req, res) => {
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
    
    // Stop all
    smartSyncService.stopSync();
    staticTeamsScheduler.stopScheduler();
    snapshotService.stopSnapshotService();
    aggressiveCacheService.stopAggressiveCaching();
    
    // Wait a bit then start all
    setTimeout(() => {
      smartSyncService.startSync();
      staticTeamsScheduler.startScheduler();
      snapshotService.startSnapshotService();
      aggressiveCacheService.startAggressiveCaching();
    }, 1000);
    
    console.log('🔄 All services restarted');
    res.json({ success: true, message: 'Tüm servisler yeniden başlatıldı' });
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

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           🚀 TACTICIQ BACKEND STARTED 🚀                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Port: ${PORT}                                                  ║`);
  console.log(`║ Health: http://localhost:${PORT}/health                       ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // ============================================
  // 1. WORLDWIDE SYNC SERVICE (Sabit 12s)
  // ============================================
  // Dünya genelinde her an maç var - SABİT 12s interval
  // Günlük: 7,200 API çağrısı (%96 kullanım)
  // Timeline service ile maç akışını kaydeder
  // ============================================
  
  try {
    const smartSyncService = require('./services/smartSyncService');
    smartSyncService.startSync();
    console.log(`🌍 Worldwide sync started (fixed 12s interval)`);
  } catch (error) {
    console.error('❌ Failed to start smart sync service:', error.message);
    // Don't exit - continue without smart sync
  }
  
  // ============================================
  // 2. STATIC TEAMS SCHEDULER (Günde 2x)
  // ============================================
  // Takım verilerini günde 2 kez günceller (08:00 ve 20:00 UTC)
  // Aylık API bütçesi: 62 çağrı (31 gün × 2)
  // ============================================
  
  try {
    const staticTeamsScheduler = require('./services/staticTeamsScheduler');
    staticTeamsScheduler.startScheduler();
    console.log(`🏆 Static teams scheduler started (daily at 08:00 & 20:00 UTC)`);
  } catch (error) {
    console.error('❌ Failed to start static teams scheduler:', error.message);
    // Don't exit - continue without scheduler
  }
  
  // ============================================
  // 3. LEADERBOARD SNAPSHOT SERVICE
  // ============================================
  // Günlük, haftalık ve aylık sıralama snapshot'ları
  // Kullanıcılar geçmiş sıralamaları görebilir
  // ============================================
  
  try {
    const snapshotService = require('./services/leaderboardSnapshotService');
    snapshotService.startSnapshotService();
    console.log(`📸 Leaderboard snapshot service started`);
  } catch (error) {
    console.error('❌ Failed to start snapshot service:', error.message);
    // Don't exit - continue without snapshots
  }
  
  // ============================================
  // 4. MONITORING SERVICE
  // ============================================
  // Backend'i izler, çökerse otomatik restart yapar
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
    }, 10000); // 10 saniye sonra başlat
  } catch (error) {
    console.warn('⚠️ Monitoring service could not be loaded:', error.message);
  }
  
  // ============================================
  // STARTUP COMPLETE
  // ============================================
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           ✅ ALL SERVICES INITIALIZED                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Active Services:                                          ║');
  console.log('║   • Worldwide Sync (12s) - Live matches & timeline        ║');
  console.log('║   • Static Teams (2x/day) - Team data updates             ║');
  console.log('║   • Leaderboard Snapshots - Daily/weekly rankings         ║');
  console.log('║   • Monitoring - Health checks & alerts                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
});
