// API Service - TacticIQ
// Bu servis bizim backend'imize bağlanır, backend API-Football'a bağlanır
// Hybrid mode: Önce database'den çeker, yoksa backend'den çeker

import { Platform } from 'react-native';
import { matchesDb, teamsDb, leaguesDb } from './databaseService';
import { formatDateInUserTimezoneSync } from '../utils/timezoneUtils';
// Mock data imports removed - using real API only
import { getApiEndpoint, API_CONFIG } from '../config/AppVersion';
import { handleNetworkError, handleApiError } from '../utils/GlobalErrorHandler';
import { logger, logApiCall } from '../utils/logger';

// Platform-specific API URL
// In development: use localhost by default so the app works when you run the backend locally.
// Set EXPO_PUBLIC_USE_PRODUCTION_API=true to use https://api.tacticiq.com/api in dev (when that domain is live).
const getApiBaseUrl = () => {
  const useProductionInDev =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_USE_PRODUCTION_API === 'true';

  // Web/Dev mode
  if (Platform.OS === 'web' || __DEV__ || typeof window !== 'undefined') {
    if (useProductionInDev) {
      logger.info('Using production API (dev override)', { url: API_CONFIG.backend.production }, 'API');
      return API_CONFIG.backend.production;
    }
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const lanUrl = `http://${hostname.replace(':8081', '')}:3001/api`;
        logger.debug('Using LAN URL (dev)', { url: lanUrl }, 'API');
        return lanUrl;
      }
    }
    logger.debug('Using localhost (dev)', { url: 'http://localhost:3001/api' }, 'API');
    return 'http://localhost:3001/api';
  }

  // Production build - always use production API
  logger.info('Using production API', undefined, 'API');
  return getApiEndpoint();
};

const API_BASE_URL = getApiBaseUrl();

logger.debug('Base URL set', { url: API_BASE_URL }, 'API');

// Request helper with timeout and error handling
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If not JSON, use status text
      }
      
      // Log error with context
      handleApiError(errorMessage, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Network errors (connection refused, timeout, etc.)
    if (error.name === 'AbortError') {
      const timeoutError = 'İstek zaman aşımına uğradı';
      handleNetworkError(timeoutError, { endpoint, timeout: API_CONFIG.timeout });
      throw new Error(timeoutError);
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      // Log network errors with context (even in dev, but with appropriate level)
      const networkError = new Error('Backend bağlantısı kurulamadı');
      handleNetworkError(networkError.message, { 
        endpoint, 
        method: options?.method || 'GET',
        timeout: API_CONFIG.timeout,
        timestamp: new Date().toISOString(),
      });
      throw networkError;
    }
    
    logger.error('API Request Error', { error, endpoint }, 'API');
    throw error;
  }
}

// ====================
// HELPER: Transform database format to API format
// ====================

/**
 * Transform database match format to API format
 * Database: { fixture_date, status, home_team, away_team, ... }
 * API: { fixture: { id, date, status: { short, long } }, teams: { home, away }, ... }
 */
function transformDbMatchToApiFormat(dbMatch: any): any {
  // If already in API format, return as is
  if (dbMatch.fixture && dbMatch.teams) {
    return dbMatch;
  }

  // Transform database format to API format
  const timestamp = dbMatch.fixture_timestamp 
    ? dbMatch.fixture_timestamp 
    : (dbMatch.fixture_date ? new Date(dbMatch.fixture_date).getTime() / 1000 : Date.now() / 1000);

  return {
    id: dbMatch.id,
    fixture: {
      id: dbMatch.id,
      date: dbMatch.fixture_date || new Date().toISOString(),
      timestamp: timestamp,
      status: {
        short: dbMatch.status || 'NS',
        long: dbMatch.status_long || 'Not Started',
        elapsed: dbMatch.elapsed || null,
      },
      venue: {
        name: dbMatch.venue_name || null,
        city: dbMatch.venue_city || null,
      },
    },
    league: dbMatch.league || {
      id: dbMatch.league_id,
      name: null,
      country: null,
      logo: null,
    },
    teams: {
      home: dbMatch.home_team || {
        id: dbMatch.home_team_id,
        name: null,
        logo: null,
      },
      away: dbMatch.away_team || {
        id: dbMatch.away_team_id,
        name: null,
        logo: null,
      },
    },
    goals: {
      home: dbMatch.home_score || null,
      away: dbMatch.away_score || null,
    },
    score: {
      halftime: {
        home: dbMatch.halftime_home || null,
        away: dbMatch.halftime_away || null,
      },
      fulltime: {
        home: dbMatch.fulltime_home || dbMatch.home_score || null,
        away: dbMatch.fulltime_away || dbMatch.away_score || null,
      },
    },
  };
}

// ====================
// MATCHES API (Hybrid: DB first, then Backend)
// ====================

export const matchesApi = {
  // Get live matches - direkt backend'den çek (database sorgusu timeout'a neden oluyordu)
  getLiveMatches: async () => {
    try {
      // ✅ Direkt backend'den çek - database sorgusu atlandı
      try {
        const backendResult = await request('/matches/live');
        return backendResult;
      } catch (backendError: any) {
        logger.error('Backend failed for live matches', { error: backendError }, 'API');
        throw new Error('Could not fetch live matches from backend');
      }
    } catch (error) {
      logger.error('Error fetching live matches', { error }, 'API');
      throw error;
    }
  },

  // Get matches by date (try DB first, fallback to backend, then mock)
  getMatchesByDate: async (date: string) => {
    try {
      // Try database first
      const dbResult = await matchesDb.getMatchesByDate(date);
      if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
        logger.debug(`Matches for ${date} from DATABASE`, { date, count: dbResult.data.length }, 'API');
        // Transform database format to API format
        const transformedData = dbResult.data.map(transformDbMatchToApiFormat);
        return { success: true, data: transformedData, source: 'database' };
      }
      
      // Try backend (only for today and tomorrow to reduce errors)
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      // Try backend for all dates
      try {
        const backendResult = await request(`/matches/date/${date}`);
        return backendResult;
      } catch (backendError: any) {
        logger.error(`Backend failed for matches on ${date}`, { date, error: backendError }, 'API');
        throw new Error(`Could not fetch matches for ${date} from backend`);
      }
    } catch (error) {
      logger.error(`Error fetching matches for ${date}`, { date, error }, 'API');
      throw error;
    }
  },

  // Get matches by league
  getMatchesByLeague: (leagueId: number, season?: number) => {
    const params = season ? `?season=${season}` : '';
    return request(`/matches/league/${leagueId}${params}`);
  },

  // Get match details (try DB first)
  getMatchDetails: async (matchId: number) => {
    try {
      // ✅ Mock maç (999999) için doğrudan backend kullan – DB formatı uyumsuz olabilir
      if (matchId === 999999) {
        logger.debug(`Match ${matchId} MOCK – using backend directly`, { matchId }, 'API');
        const backendResult = await request(`/matches/${matchId}`);
        return backendResult;
      }

      // Try database first
      const dbResult = await matchesDb.getMatchById(matchId);
      if (dbResult.success && dbResult.data) {
        logger.debug(`Match ${matchId} from DATABASE`, { matchId }, 'API');
        // Transform database format to API format
        const transformedData = transformDbMatchToApiFormat(dbResult.data);
        return { success: true, data: transformedData, source: 'database' };
      }
      
      // Try backend
      logger.debug(`Match ${matchId} not in DB, trying BACKEND...`, { matchId }, 'API');
      try {
        const backendResult = await request(`/matches/${matchId}`);
        return backendResult;
      } catch (backendError) {
        logger.error(`Backend failed for match ${matchId}`, { matchId, error: backendError }, 'API');
        throw new Error(`Match ${matchId} not found`);
      }
    } catch (error) {
      logger.error(`Error in getMatchDetails(${matchId})`, { matchId, error }, 'API');
      throw error;
    }
  },

  // Get match statistics
  getMatchStatistics: (matchId: number) => request(`/matches/${matchId}/statistics`),

  // Get match events (goals, cards, etc.)
  getMatchEvents: (matchId: number) => request(`/matches/${matchId}/events`),

  // Get live events (DB + API hybrid, 15sn güncelleme) - maç başlamadıysa matchNotStarted: true
  getMatchEventsLive: (matchId: number | string) =>
    request(`/matches/${matchId}/events/live`),

  // Get community stats (topluluk tahmin istatistikleri)
  getCommunityStats: (matchId: number | string) =>
    request(`/matches/${matchId}/community-stats`),

  // Get prediction data (statistics + events combined)
  getPredictionData: (matchId: number) => request(`/matches/${matchId}/prediction-data`),

  // Get match lineups
  getMatchLineups: (matchId: number) => request(`/matches/${matchId}/lineups`),

  // Get head to head
  getHeadToHead: (team1Id: number, team2Id: number) => 
    request(`/matches/h2h/${team1Id}/${team2Id}`),
  
  // Get all matches for a team in a season (all competitions)
  getTeamSeasonMatches: async (teamId: number, season: number = 2025) => {
    try {
      const result = await request(`/matches/team/${teamId}/season/${season}`);
      
      // If data comes from database, transform it
      if (result.success && result.data && result.source === 'database') {
        const transformedData = result.data.map(transformDbMatchToApiFormat);
        return { ...result, data: transformedData };
      }
      
      return result;
    } catch (error) {
      logger.error('Error fetching team season matches', { teamId, season, error }, 'API');
      throw error;
    }
  },
  
  // Get upcoming matches for a team (next 30 days) - FASTER!
  getUpcomingMatches: async (teamId: number) => {
    try {
      // Calculate date range
      const today = new Date();
      const next30Days = new Date(today);
      next30Days.setDate(today.getDate() + 30);
      
      const fromDate = today.toISOString().split('T')[0];
      const toDate = next30Days.toISOString().split('T')[0];
      
      logger.debug(`Fetching matches from ${fromDate} to ${toDate}`, { teamId, fromDate, toDate }, 'API');
      
      const result = await request(`/matches/team/${teamId}?from=${fromDate}&to=${toDate}`);
      
      // If data comes from database, transform it
      if (result.success && result.data && result.source === 'database') {
        const transformedData = result.data.map(transformDbMatchToApiFormat);
        return { ...result, data: transformedData };
      }
      
      return result;
    } catch (error) {
      logger.error('Error fetching upcoming matches', { teamId, error }, 'API');
      // Fallback to season matches if date range fails
      return matchesApi.getTeamSeasonMatches(teamId, 2025);
    }
  },
    
  // Subscribe to real-time match updates
  subscribeToMatch: (matchId: number, callback: (payload: any) => void) => {
    return matchesDb.subscribeToMatch(matchId, callback);
  },
};

// ====================
// LEAGUES API
// ====================

export const leaguesApi = {
  // Get all leagues or by country
  getLeagues: (country?: string) => {
    const params = country ? `?country=${country}` : '';
    return request(`/leagues${params}`);
  },

  // Get league standings
  getLeagueStandings: (leagueId: number, season?: number) => {
    const params = season ? `?season=${season}` : '';
    return request(`/leagues/${leagueId}/standings${params}`);
  },
};

// ====================
// TEAMS API
// ====================

export const teamsApi = {
  // Get team information
  getTeamInfo: (teamId: number) => request(`/teams/${teamId}`),

  // Get team coach (teknik direktör) - API'den dinamik
  getTeamCoach: (teamId: number) => request(`/teams/${teamId}/coach`),

  // Get team squad (oyuncu kadrosu)
  getTeamSquad: (teamId: number, season?: number) => {
    const params = season ? `?season=${season}` : '';
    return request(`/teams/${teamId}/squad${params}`);
  },

  // Search teams by name - ✅ Static teams database'den hızlı arama
  searchTeams: (query: string, type?: 'club' | 'national') => {
    const encodedQuery = encodeURIComponent(query);
    const typeParam = type ? `&type=${type}` : '';
    return request(`/static-teams/search?q=${encodedQuery}${typeParam}`);
  },

  // Get team statistics
  getTeamStatistics: (teamId: number, leagueId: number, season?: number) => {
    const params = new URLSearchParams({
      league: leagueId.toString(),
      ...(season && { season: season.toString() }),
    });
    return request(`/teams/${teamId}/statistics?${params}`);
  },
};

// ====================
// PLAYERS API
// ====================

export const playersApi = {
  // Get player information
  getPlayerInfo: (playerId: number, season?: number) => {
    const params = season ? `?season=${season}` : '';
    return request(`/players/${playerId}${params}`);
  },
};

// ====================
// HELPER FUNCTIONS
// ====================

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Get date range
export function getDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// Format match time - kullanıcının seçtiği saat dilimine göre
export function formatMatchTime(timestamp: number): string {
  return formatDateInUserTimezoneSync(timestamp * 1000, undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format match date - kullanıcının seçtiği saat dilimine göre
export function formatMatchDate(timestamp: number): string {
  return formatDateInUserTimezoneSync(timestamp * 1000, undefined, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Check if match is live
export function isMatchLive(status: string): boolean {
  return ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status);
}

// Check if match is finished
export function isMatchFinished(status: string): boolean {
  return ['FT', 'AET', 'PEN'].includes(status);
}

// ====================
// LEGAL DOCUMENTS API
// ====================

export interface LegalDocument {
  id: string;
  document_id: string;
  language: string;
  title: string;
  content: string;
  enabled: boolean;
}

export const legalDocumentsApi = {
  /**
   * Tüm yasal belgeleri dil bazında getir
   */
  async getAll(language: string = 'tr'): Promise<LegalDocument[]> {
    try {
      const data = await request<{ success: boolean; data: LegalDocument[] }>(`/legal-documents?language=${language}`);
      return data.data || [];
    } catch (error) {
      logger.error('Failed to fetch legal documents', { error, language }, 'LEGAL_DOCS');
      return [];
    }
  },

  /**
   * Belirli bir belgeyi getir
   */
  async get(documentId: string, language: string = 'tr'): Promise<LegalDocument | null> {
    try {
      const data = await request<{ success: boolean; data: LegalDocument }>(`/legal-documents/${documentId}?language=${language}`);
      return data.data || null;
    } catch (error) {
      logger.error('Failed to fetch legal document', { error, documentId, language }, 'LEGAL_DOCS');
      return null;
    }
  },
};

// ====================
// SQUAD PREDICTIONS API
// ====================
export const squadPredictionsApi = {
  /**
   * Kadro tahmini kaydet
   */
  saveSquadPrediction: async (data: {
    matchId: number;
    attackFormation: string;
    attackPlayers: Record<number, any>;
    defenseFormation: string;
    defensePlayers: Record<number, any>;
    analysisFocus?: string;
  }, authToken: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/squad-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    } catch (error: any) {
      logger.error('Save squad prediction error', { error }, 'SQUAD_API');
      return { success: false, message: error.message || 'Kadro kaydedilemedi' };
    }
  },

  /**
   * Kullanıcının maç için kadro tahmini
   */
  getUserSquadPrediction: async (matchId: number, authToken: string): Promise<{ success: boolean; data?: any }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/squad-predictions/match/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const result = await response.json();
      return result;
    } catch (error: any) {
      logger.error('Get squad prediction error', { error, matchId }, 'SQUAD_API');
      return { success: false };
    }
  },

  /**
   * Maç istatistikleri ve karşılaştırma
   */
  getMatchStats: async (matchId: number, authToken?: string): Promise<{
    success: boolean;
    data?: {
      summary: {
        total_predictions: number;
        top_attack_formation: string | null;
        top_attack_formation_percentage: number;
        top_defense_formation: string | null;
        top_defense_formation_percentage: number;
      };
      formationStats: any[];
      userPrediction: any;
      userComparison: {
        attackFormationMatches: boolean;
        attackFormationPopularity: number;
        defenseFormationMatches: boolean;
        defenseFormationPopularity: number;
        overallCompatibility: 'high' | 'medium' | 'low';
      } | null;
    };
  }> => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const response = await fetch(`${API_BASE_URL}/squad-predictions/stats/${matchId}`, { headers });
      const result = await response.json();
      return result;
    } catch (error: any) {
      logger.error('Get match stats error', { error, matchId }, 'SQUAD_API');
      return { success: false };
    }
  },

  /**
   * En popüler formasyonlar
   */
  getPopularFormations: async (type: 'attack' | 'defense' = 'attack'): Promise<{
    success: boolean;
    data?: Array<{ formation: string; count: number }>;
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/squad-predictions/popular-formations?type=${type}`);
      const result = await response.json();
      return result;
    } catch (error: any) {
      logger.error('Get popular formations error', { error, type }, 'SQUAD_API');
      return { success: false };
    }
  },
};

// Export all
export default {
  matches: matchesApi,
  leagues: leaguesApi,
  teams: teamsApi,
  players: playersApi,
  legalDocuments: legalDocumentsApi,
  squadPredictions: squadPredictionsApi,
  utils: {
    getTodayDate,
    getDateRange,
    formatMatchTime,
    formatMatchDate,
    isMatchLive,
    isMatchFinished,
  },
  getBaseUrl: () => API_BASE_URL, // Export base URL for direct fetch
};

// ====================
// AUTH API
// ====================
export const authApi = {
  /**
   * Kullanıcı adı müsaitlik kontrolü
   */
  checkUsername: async (username: string, currentUserId?: string): Promise<{
    success: boolean;
    available: boolean;
    message: string;
  }> => {
    try {
      const queryParams = currentUserId ? `?currentUserId=${currentUserId}` : '';
      const response = await fetch(`${API_BASE_URL}/auth/check-username/${username}${queryParams}`);
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Check username error', { username, error }, 'API');
      return {
        success: false,
        available: false,
        message: 'Bağlantı hatası',
      };
    }
  },

  /**
   * Şifre değiştirme
   */
  changePassword: async (currentPassword: string, newPassword: string, email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    try {
      logApiCall('/auth/change-password', 'POST', { email });
      const response = await request<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          email,
        }),
      });
      return response;
    } catch (error: any) {
      logger.error('Change password error', { error }, 'API');
      return {
        success: false,
        error: error.message || 'Şifre değiştirilemedi',
      };
    }
  },
};
