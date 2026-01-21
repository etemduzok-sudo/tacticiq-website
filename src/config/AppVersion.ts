// App Version & Configuration
// Fan Manager 2026 - Centralized Version Control

/**
 * Application Version Information
 * Update these values for each release
 */
export const APP_VERSION = {
  // Current version (Semantic Versioning: MAJOR.MINOR.PATCH)
  current: '1.0.0',
  
  // Build number (increment with each build)
  buildNumber: 1,
  
  // Minimum required version for force update
  minRequired: '1.0.0',
  
  // Release date
  releaseDate: '2026-01-08',
  
  // Release notes
  releaseNotes: [
    'Stratejik Odak Sistemi eklendi',
    'Antrenman çarpanları sistemi',
    'Şeffaf puanlama ekranı',
    'Database entegrasyonu',
    'Mock data fallback sistemi',
  ],
};

/**
 * API Configuration
 * Centralized API endpoint management
 */
export const API_CONFIG = {
  // Backend API
  backend: {
    development: 'http://localhost:3000/api',
    production: 'https://api.fanmanager2026.com/api',
  },
  
  // Supabase
  supabase: {
    url: 'https://jxdgiskusjljlpzvrzau.supabase.co',
    anonKey: 'sb_publishable_Qjep7tf9H98yk5UBgcPtVw_x4iQUixY',
  },
  
  // API-Football
  apiFootball: {
    host: 'v3.football.api-sports.io',
    // Key is stored in backend .env
  },
  
  // Request timeout (ms)
  timeout: 90000, // 90 saniye (sezon maçları için)
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    delayMs: 1000,
  },
};

/**
 * Feature Flags
 * Enable/disable features without code changes
 */
export const FEATURE_FLAGS = {
  // Strategic Focus System
  strategicFocus: true,
  maxFocusPredictions: 3,
  
  // Training multipliers
  trainingMultipliers: true,
  
  // Database features
  useDatabase: true,
  useMockFallback: true,
  
  // Real-time updates
  realtimeUpdates: false, // Not implemented yet
  
  // Push notifications
  pushNotifications: false, // Not implemented yet
  
  // Pro features
  proFeatures: true,
  
  // Maintenance mode
  maintenanceMode: false,
};

/**
 * App Limits & Constraints
 */
export const APP_LIMITS = {
  // Predictions
  maxPredictionsPerMatch: 50,
  maxActivePredictions: 100,
  
  // Focus system
  maxFocusPredictions: 3,
  
  // Cache
  cacheExpiryMinutes: 30,
  
  // Pagination
  matchesPerPage: 20,
  leaderboardLimit: 100,
};

/**
 * Maintenance Configuration
 */
export const MAINTENANCE_CONFIG = {
  isActive: false,
  message: 'Sistem bakımda. Lütfen daha sonra tekrar deneyin.',
  estimatedEndTime: null as string | null,
  allowedUsers: [] as string[], // User IDs that can bypass maintenance
};

/**
 * Check if app needs force update
 */
export function needsForceUpdate(currentVersion: string): boolean {
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  const [minMajor, minMinor] = APP_VERSION.minRequired.split('.').map(Number);
  
  if (currentMajor < minMajor) return true;
  if (currentMajor === minMajor && currentMinor < minMinor) return true;
  
  return false;
}

/**
 * Get API endpoint based on environment
 */
export function getApiEndpoint(): string {
  const isDev = __DEV__;
  return isDev ? API_CONFIG.backend.development : API_CONFIG.backend.production;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true;
}

/**
 * Get app info string
 */
export function getAppInfo(): string {
  return `Fan Manager ${APP_VERSION.current} (${APP_VERSION.buildNumber})`;
}

/**
 * Log version info (for debugging)
 */
export function logVersionInfo(): void {
        console.log('╔════════════════════════════════════════╗');
        console.log('║         TACTICIQ - VERSION INFO        ║');
        console.log('╠════════════════════════════════════════╣');
  console.log(`║ Version: ${APP_VERSION.current.padEnd(28)} ║`);
  console.log(`║ Build: ${String(APP_VERSION.buildNumber).padEnd(30)} ║`);
  console.log(`║ Release: ${APP_VERSION.releaseDate.padEnd(26)} ║`);
  console.log(`║ Environment: ${(__DEV__ ? 'Development' : 'Production').padEnd(22)} ║`);
  console.log('╚════════════════════════════════════════╝');
}
