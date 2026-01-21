// TacticIQ - Enhanced Backend API Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const timeout = require('connect-timeout');
require('dotenv').config();

// Middleware
const {
  globalLimiter,
  corsOptions,
  helmetConfig,
  sanitizeRequest,
} = require('./middleware/security');

const {
  logger,
  requestLogger,
  performanceLogger,
  errorLogger,
  analyticsMiddleware,
  apiAnalytics,
} = require('./middleware/logger');

const { optionalAuth } = require('./middleware/auth');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// SECURITY MIDDLEWARE
// ======================

// Helmet security headers
app.use(helmet(helmetConfig));

// CORS
app.use(cors(corsOptions));

// Request timeout (30 seconds)
app.use(timeout('30s'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Sanitize requests
app.use(sanitizeRequest);

// ======================
// LOGGING MIDDLEWARE
// ======================

// HTTP request logging
app.use(requestLogger);

// Performance logging
app.use(performanceLogger);

// Analytics
app.use(analyticsMiddleware);

// ======================
// ROUTES
// ======================

const matchesRouter = require('./routes/matches.enhanced');
const leaguesRouter = require('./routes/leagues');
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const authRouter = require('./routes/auth');

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'TacticIQ API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      matches: '/api/matches',
      leagues: '/api/leagues',
      teams: '/api/teams',
      players: '/api/players',
      auth: '/api/auth',
      health: '/health',
      docs: '/api-docs',
      stats: '/api/stats',
    },
  });
});

// API Stats endpoint (admin only)
app.get('/api/stats', optionalAuth, (req, res) => {
  // In production, this should require admin role
  if (process.env.NODE_ENV === 'production' && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  
  const stats = apiAnalytics.getStats();
  res.json({
    success: true,
    data: stats,
  });
});

// Apply global rate limiting to all API routes
app.use('/api/', globalLimiter);

// Mount routers
app.use('/api/matches', matchesRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/auth', authRouter);

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
  });
});

// Error logger
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  // Timeout error
  if (req.timedout) {
    logger.error('Request timeout', {
      method: req.method,
      url: req.url,
    });
    
    return res.status(408).json({
      success: false,
      error: 'Request timeout',
    });
  }
  
  // CORS error
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  });
});

// ======================
// SERVER STARTUP
// ======================

let server;

function startServer() {
  server = app.listen(PORT, () => {
    logger.info(`🚀 TacticIQ Backend running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`📈 Stats: http://localhost:${PORT}/api/stats`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// ======================
// GRACEFUL SHUTDOWN
// ======================

function gracefulShutdown(signal) {
  logger.info(`${signal} received, closing server gracefully...`);
  
  server.close(() => {
    logger.info('Server closed successfully');
    
    // Close other connections (database, redis, etc.)
    // pool.end();
    // redisClient.quit();
    
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
});

// Start server
startServer();

// Export for testing
module.exports = app;
