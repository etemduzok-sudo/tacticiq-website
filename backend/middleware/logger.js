// Logging Middleware
const winston = require('winston');
const morgan = require('morgan');
const path = require('path');

// ======================
// WINSTON LOGGER
// ======================

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'fan-manager-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// ======================
// MORGAN HTTP LOGGER
// ======================

// Custom token for user ID
morgan.token('user-id', (req) => req.user?.id || 'anonymous');

// Custom token for request body (sanitized)
morgan.token('body', (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    return JSON.stringify(sanitized);
  }
  return '-';
});

// Morgan format
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
  : ':method :url :status :response-time ms - :user-id';

// Morgan middleware
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

// ======================
// PERFORMANCE LOGGER
// ======================

const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id,
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request error', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
      });
    }
  });
  
  next();
};

// ======================
// ERROR LOGGER
// ======================

const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
  });
  
  next(err);
};

// ======================
// API ANALYTICS
// ======================

const apiAnalytics = {
  requests: {},
  errors: {},
  
  logRequest(endpoint, duration, statusCode) {
    if (!this.requests[endpoint]) {
      this.requests[endpoint] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        errors: 0,
      };
    }
    
    this.requests[endpoint].count++;
    this.requests[endpoint].totalDuration += duration;
    this.requests[endpoint].avgDuration = 
      this.requests[endpoint].totalDuration / this.requests[endpoint].count;
    
    if (statusCode >= 400) {
      this.requests[endpoint].errors++;
    }
  },
  
  getStats() {
    return {
      endpoints: this.requests,
      totalRequests: Object.values(this.requests).reduce((sum, r) => sum + r.count, 0),
      totalErrors: Object.values(this.requests).reduce((sum, r) => sum + r.errors, 0),
    };
  },
  
  reset() {
    this.requests = {};
    this.errors = {};
  },
};

// Analytics middleware
const analyticsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiAnalytics.logRequest(req.path, duration, res.statusCode);
  });
  
  next();
};

// ======================
// EXPORTS
// ======================

module.exports = {
  logger,
  requestLogger,
  performanceLogger,
  errorLogger,
  analyticsMiddleware,
  apiAnalytics,
};
