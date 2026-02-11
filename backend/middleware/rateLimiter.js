// API Rate Limiter Middleware
// Günlük 7,500 API call limiti

const API_CALL_LIMIT = 7500; // Günlük limit
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 saat (ms)

// Development modunda rate limiter devre dışı bırakılabilir
const DISABLE_RATE_LIMITER = process.env.DISABLE_RATE_LIMITER === 'true' || process.env.NODE_ENV === 'development';

// In-memory counter (production'da Redis kullanılmalı)
let apiCallCount = 0;
let lastResetTime = Date.now();

// Reset counter every 24 hours
function checkAndResetCounter() {
  const now = Date.now();
  if (now - lastResetTime >= RESET_INTERVAL) {
    console.log(`🔄 [RATE LIMITER] Resetting counter (was: ${apiCallCount})`);
    apiCallCount = 0;
    lastResetTime = now;
  }
}

// Increment counter
function incrementCounter() {
  checkAndResetCounter();
  apiCallCount++;
  
  const remaining = API_CALL_LIMIT - apiCallCount;
  const percentage = ((apiCallCount / API_CALL_LIMIT) * 100).toFixed(1);
  
  // Log every 100 calls
  if (apiCallCount % 100 === 0) {
    console.log(`📊 [RATE LIMITER] API Calls: ${apiCallCount}/${API_CALL_LIMIT} (${percentage}%) | Remaining: ${remaining}`);
  }
  
  // Warning at 80%
  if (apiCallCount === Math.floor(API_CALL_LIMIT * 0.8)) {
    console.warn(`⚠️ [RATE LIMITER] WARNING: 80% of daily limit reached (${apiCallCount}/${API_CALL_LIMIT})`);
  }
  
  // Warning at 90%
  if (apiCallCount === Math.floor(API_CALL_LIMIT * 0.9)) {
    console.warn(`🚨 [RATE LIMITER] CRITICAL: 90% of daily limit reached (${apiCallCount}/${API_CALL_LIMIT})`);
  }
}

// Check if limit exceeded
function isLimitExceeded() {
  checkAndResetCounter();
  return apiCallCount >= API_CALL_LIMIT;
}

// Get current stats
function getStats() {
  checkAndResetCounter();
  const remaining = API_CALL_LIMIT - apiCallCount;
  const percentage = ((apiCallCount / API_CALL_LIMIT) * 100).toFixed(1);
  const timeUntilReset = RESET_INTERVAL - (Date.now() - lastResetTime);
  const hoursUntilReset = Math.floor(timeUntilReset / (60 * 60 * 1000));
  const minutesUntilReset = Math.floor((timeUntilReset % (60 * 60 * 1000)) / (60 * 1000));
  
  return {
    current: apiCallCount,
    limit: API_CALL_LIMIT,
    remaining,
    percentage: parseFloat(percentage),
    resetIn: `${hoursUntilReset}h ${minutesUntilReset}m`,
    lastReset: new Date(lastResetTime).toISOString(),
  };
}

// Manuel reset fonksiyonu (development için)
function resetCounter() {
  const oldCount = apiCallCount;
  apiCallCount = 0;
  lastResetTime = Date.now();
  console.log(`🔄 [RATE LIMITER] Counter manually reset (was: ${oldCount})`);
  return { oldCount, newCount: apiCallCount };
}

// Middleware
function rateLimiterMiddleware(req, res, next) {
  // Skip rate limiting for non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Development modunda rate limiter'ı devre dışı bırak
  if (DISABLE_RATE_LIMITER) {
    return next();
  }
  
  // Check limit
  if (isLimitExceeded()) {
    const stats = getStats();
    console.error(`🚫 [RATE LIMITER] LIMIT EXCEEDED: ${stats.current}/${stats.limit}`);
    
    return res.status(429).json({
      success: false,
      error: 'API rate limit exceeded',
      message: `Günlük API çağrı limiti aşıldı (${stats.limit} call/gün). Lütfen ${stats.resetIn} sonra tekrar deneyin.`,
      stats,
    });
  }
  
  // Increment counter for API calls
  incrementCounter();
  
  // Add stats to response headers
  const stats = getStats();
  res.setHeader('X-RateLimit-Limit', API_CALL_LIMIT);
  res.setHeader('X-RateLimit-Remaining', stats.remaining);
  res.setHeader('X-RateLimit-Reset', lastResetTime + RESET_INTERVAL);
  
  next();
}

// Export
module.exports = {
  rateLimiterMiddleware,
  getStats,
  incrementCounter,
  isLimitExceeded,
  resetCounter,
  DISABLE_RATE_LIMITER,
};
