// Fan Manager 2026 - Backend API Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// 🛡️ Global Error Handlers - Backend'in sürekli durmasını engeller
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION - Backend durduruluyor:', error);
  console.error('Stack:', error.stack);
  // Critical error - restart gerekli
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION - Promise rejected:', reason);
  console.error('Promise:', promise);
  // Log error but don't crash - allow server to continue
  // Sadece log'la, process.exit yapma
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
app.use(cors({
  origin: [
    'http://localhost:8081',   // Expo default
    'http://localhost:8082',   // Expo alternative port
    'http://localhost:19006',  // Expo web
    'http://localhost:3000',   // Self
  ],
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

app.use('/api/matches', matchesRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/auth', authRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/scoring', scoringRouter);
app.use('/api/email', require('./routes/email'));

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
    name: 'Fan Manager 2026 API',
    version: '1.0.0',
    endpoints: [
      '/api/matches',
      '/api/leagues',
      '/api/teams',
      '/api/players',
      '/api/predictions',
      '/api/scoring',
      '/health',
    ],
  });
});

// Sync status endpoint
app.get('/api/sync-status', (req, res) => {
  const smartSyncService = require('./services/smartSyncService');
  const status = smartSyncService.getStatus();
  res.json(status);
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
  console.log(`🚀 Fan Manager Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // ============================================
  // SYNC STRATEGY: SMART ADAPTIVE SYNC
  // ============================================
  // Her 12 saniyede bir çalışarak 7,500/day limitini maksimum kullanır
  // Canlı maç varsa 10 saniyeye düşer, gece 60 saniyeye çıkar
  // ============================================
  
  try {
    const smartSyncService = require('./services/smartSyncService');
    smartSyncService.startSync();
    console.log(`🧠 Smart adaptive sync started (every 12s, adaptive 10s-60s)`);
  } catch (error) {
    console.error('❌ Failed to start smart sync service:', error.message);
    console.error('Stack:', error.stack);
    // Don't exit - continue without smart sync
  }
  
  // ============================================
  // MONITORING & AUTO-RESTART SERVICE
  // ============================================
  // Backend'i izler, çökerse otomatik restart yapar
  // Admin'e email gönderir
  // ============================================
  
  try {
    const monitoringService = require('./services/monitoringService');
    // Start monitoring after a delay (to avoid checking during initial startup)
    setTimeout(() => {
      try {
        monitoringService.startMonitoring();
        console.log(`🔍 Monitoring service started`);
      } catch (error) {
        console.error('❌ Failed to start monitoring service:', error.message);
        console.error('Stack:', error.stack);
        // Don't exit - continue without monitoring
      }
    }, 10000); // 10 saniye sonra başlat
    console.log(`🔍 Monitoring service will start in 10 seconds`);
  } catch (error) {
    console.warn('⚠️ Monitoring service could not be loaded:', error.message);
    // Don't exit - continue without monitoring
  }
  
  // NOTE: liveMatchService ve dailySyncService devre dışı (smartSync hepsini yapıyor)
  // const liveMatchService = require('./services/liveMatchService');
  // liveMatchService.startPolling();
  // const dailySyncService = require('./services/dailySyncService');
  // dailySyncService.startSync();
});
