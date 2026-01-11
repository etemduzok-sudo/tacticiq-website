// Fan Manager 2026 - Backend API Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

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
const aggressiveCacheService = require('./services/aggressiveCacheService');
aggressiveCacheService.startAggressiveCaching();

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
  
  const smartSyncService = require('./services/smartSyncService');
  smartSyncService.startSync();
  console.log(`🧠 Smart adaptive sync started (every 12s, adaptive 10s-60s)`);
  
  // NOTE: liveMatchService ve dailySyncService devre dışı (smartSync hepsini yapıyor)
  // const liveMatchService = require('./services/liveMatchService');
  // liveMatchService.startPolling();
  // const dailySyncService = require('./services/dailySyncService');
  // dailySyncService.startSync();
});
