/**
 * API Configuration
 * Backend API URL yapılandırması
 */

// Environment variables - Production'da gerçek backend URL'inizi buraya ekleyin
export const API_CONFIG = {
  // Base URL - .env dosyasından veya default değerden alınır
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  
  // API versiyonu
  VERSION: 'v1',
  
  // Timeout ayarları (milisaniye)
  TIMEOUT: 30000,
  
  // Retry ayarları
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD_CONFIRM: '/auth/reset-password-confirm',
  },
  
  // User Management
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    DELETE: '/users/:id',
    LIST: '/users/list',
  },
  
  // Content Management
  CONTENT: {
    BASE: '/content',
    CREATE: '/content/create',
    UPDATE: '/content/:id',
    DELETE: '/content/:id',
    LIST: '/content/list',
    PUBLISH: '/content/:id/publish',
  },
  
  // Statistics & Analytics
  STATS: {
    DASHBOARD: '/stats/dashboard',
    VISITORS: '/stats/visitors',
    REVENUE: '/stats/revenue',
    USERS: '/stats/users',
  },
  
  // Advertisements
  ADS: {
    BASE: '/advertisements',
    CREATE: '/advertisements/create',
    UPDATE: '/advertisements/:id',
    DELETE: '/advertisements/:id',
    LIST: '/advertisements/list',
    SETTINGS: '/advertisements/settings',
    INCREMENT_VIEW: '/advertisements/:id/view',
  },
  
  // Website Settings
  SETTINGS: {
    BASE: '/settings',
    UPDATE: '/settings/update',
    GET: '/settings/get',
  },
  
  // Activity Logs
  LOGS: {
    BASE: '/logs',
    LIST: '/logs/list',
    CREATE: '/logs/create',
  },
  
  // Blog
  BLOG: {
    BASE: '/blog',
    CREATE: '/blog/create',
    UPDATE: '/blog/:id',
    DELETE: '/blog/:id',
    LIST: '/blog/list',
    GET: '/blog/:id',
  },
  
  // Teams (Backend API - Supabase üzerinden)
  TEAMS: {
    SEARCH: '/teams/search',
    GET: '/teams/:id',
    COLORS: '/teams/:id/colors',
    FLAG: '/teams/:id/flag',
    STATISTICS: '/teams/:id/statistics',
  },
  
  // Matches (Backend API)
  MATCHES: {
    BASE: '/matches',
    LIVE: '/matches/live',
    TODAY: '/matches/today',
    UPCOMING: '/matches/upcoming',
    BY_DATE: '/matches/date/:date',
    BY_TEAM: '/matches/team/:teamId',
  },
} as const;

// Error Messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ağ hatası. Lütfen internet bağlantınızı kontrol edin.',
  SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  UNAUTHORIZED: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
  FORBIDDEN: 'Bu işlem için yetkiniz yok.',
  NOT_FOUND: 'İstenen kaynak bulunamadı.',
  VALIDATION_ERROR: 'Girdiğiniz bilgilerde hata var.',
  TIMEOUT: 'İstek zaman aşımına uğradı.',
} as const;