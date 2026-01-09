// Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ======================
// JWT FUNCTIONS
// ======================

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'fan-manager-api',
    audience: 'fan-manager-app',
  });
}

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'fan-manager-api',
      audience: 'fan-manager-app',
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Refresh JWT token
 * @param {String} token - Old JWT token
 * @returns {String} New JWT token
 */
function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      ignoreExpiration: true, // Allow expired tokens for refresh
    });
    
    // Generate new token with same payload
    return generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });
  } catch (error) {
    throw new Error('Cannot refresh token');
  }
}

// ======================
// MIDDLEWARE
// ======================

/**
 * Authenticate JWT token
 * Extracts token from Authorization header and verifies it
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      url: req.url,
    });
    
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }
  
  try {
    const verified = verifyToken(token);
    req.user = verified;
    
    logger.info('User authenticated', {
      userId: verified.id,
      role: verified.role,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', {
      error: error.message,
      ip: req.ip,
    });
    
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication
 * If token is provided, verify it. If not, continue without user.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const verified = verifyToken(token);
      req.user = verified;
    } catch (error) {
      // Invalid token, but continue without user
      logger.warn('Optional auth: Invalid token', { error: error.message });
    }
  }
  
  next();
}

/**
 * Role-based authorization
 * @param {...String} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated');
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please login.',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Insufficient permissions.',
      });
    }
    
    next();
  };
}

/**
 * Check if user is Pro
 */
function requirePro(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
  
  if (!req.user.isPro) {
    return res.status(403).json({
      success: false,
      error: 'Bu özellik Pro üyelere özeldir',
      upgradeUrl: '/api/upgrade/pro',
    });
  }
  
  next();
}

/**
 * API Key authentication (for external services)
 */
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
    });
  }
  
  // Validate API key (should be stored in database)
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
    });
    
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
    });
  }
  
  next();
}

// ======================
// EXPORTS
// ======================

module.exports = {
  // Functions
  generateToken,
  verifyToken,
  refreshToken,
  
  // Middleware
  authenticateToken,
  optionalAuth,
  authorize,
  requirePro,
  authenticateApiKey,
};
