// Security Middleware
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

// ======================
// RATE LIMITING
// ======================

// Global rate limiter (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

// API rate limiter (10 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Çok fazla API isteği. Lütfen 1 dakika sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for expensive operations (3 requests per minute)
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Bu işlem için çok fazla istek. Lütfen 1 dakika sonra tekrar deneyin.',
  },
});

// ======================
// INPUT VALIDATION
// ======================

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Geçersiz istek parametreleri',
      details: errors.array(),
    });
  }
  next();
};

// Date validation
const validateDate = [
  param('date')
    .isISO8601()
    .withMessage('Geçersiz tarih formatı (YYYY-MM-DD bekleniyor)')
    .custom((value) => {
      const date = new Date(value);
      const minDate = new Date('2020-01-01');
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      
      if (date < minDate || date > maxDate) {
        throw new Error('Tarih 2020-2027 aralığında olmalıdır');
      }
      return true;
    }),
  handleValidationErrors,
];

// ID validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz ID (pozitif tam sayı bekleniyor)'),
  handleValidationErrors,
];

// League ID validation
const validateLeagueId = [
  param('leagueId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz lig ID'),
  query('season')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Geçersiz sezon (2000-2030 arası)'),
  handleValidationErrors,
];

// Team ID validation
const validateTeamId = [
  param('teamId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz takım ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit 1-50 arasında olmalıdır'),
  handleValidationErrors,
];

// H2H validation
const validateH2H = [
  param('team1')
    .isInt({ min: 1 })
    .withMessage('Geçersiz takım 1 ID'),
  param('team2')
    .isInt({ min: 1 })
    .withMessage('Geçersiz takım 2 ID')
    .custom((value, { req }) => {
      if (value === req.params.team1) {
        throw new Error('Takımlar farklı olmalıdır');
      }
      return true;
    }),
  handleValidationErrors,
];

// Favorites validation
const validateFavorites = [
  query('teamIds')
    .notEmpty()
    .withMessage('teamIds parametresi gereklidir')
    .custom((value) => {
      const ids = value.split(',').map(id => parseInt(id.trim()));
      
      if (ids.length === 0) {
        throw new Error('En az 1 takım ID gereklidir');
      }
      
      if (ids.length > 10) {
        throw new Error('Maksimum 10 takım seçilebilir');
      }
      
      if (ids.some(id => isNaN(id) || id < 1)) {
        throw new Error('Geçersiz takım ID formatı');
      }
      
      return true;
    }),
  handleValidationErrors,
];

// ======================
// CORS CONFIGURATION
// ======================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL,
    ].filter(Boolean); // Remove undefined values
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ======================
// HELMET CONFIGURATION
// ======================

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://v3.football.api-sports.io"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
};

// ======================
// SANITIZATION
// ======================

// Sanitize request data
const sanitizeRequest = (req, res, next) => {
  // Remove any potential XSS from query params
  Object.keys(req.query).forEach(key => {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
    }
  });
  
  // Remove any potential XSS from body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    });
  }
  
  next();
};

// ======================
// EXPORTS
// ======================

module.exports = {
  // Rate limiters
  globalLimiter,
  apiLimiter,
  strictLimiter,
  
  // Validators
  validateDate,
  validateId,
  validateLeagueId,
  validateTeamId,
  validateH2H,
  validateFavorites,
  handleValidationErrors,
  
  // Configuration
  corsOptions,
  helmetConfig,
  
  // Sanitization
  sanitizeRequest,
};
