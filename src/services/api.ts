// API Service - Fan Manager 2026
// Bu servis bizim backend'imize bağlanır, backend API-Football'a bağlanır
// Hybrid mode: Önce database'den çeker, yoksa backend'den çeker

import { Platform } from 'react-native';
import { matchesDb, teamsDb, leaguesDb } from './databaseService';
import { getMockMatches, getMockMatchById, getMockMatchesByDate } from './mockDataService';
import { getApiEndpoint, API_CONFIG } from '../config/AppVersion';
import { handleNetworkError, handleApiError } from '../utils/GlobalErrorHandler';

// Platform-specific API URL
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Web platform için localhost, mobile için localhost veya IP
    if (Platform.OS === 'web') {
      return 'http://localhost:3000/api';
    }
    // Mobile (iOS/Android) - emulator/simulator için localhost çalışır
    return 'http://localhost:3000/api';
  }
  // Production - Use centralized config
  return getApiEndpoint();
};

const API_BASE_URL = getApiBaseUrl();

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
      // Silently handle network errors (backend is expected to be off in dev)
      // Don't log or show errors for expected backend unavailability
      throw new Error('Backend bağlantısı kurulamadı');
    }
    
    console.error('API Request Error:', error);
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
  // Get live matches (try DB first, fallback to backend, then mock)
  getLiveMatches: async () => {
    try {
      // Try database first
      const dbResult = await matchesDb.getLiveMatches();
      if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
        console.log('✅ Live matches from DATABASE');
        // Transform database format to API format
        const transformedData = dbResult.data.map(transformDbMatchToApiFormat);
        return { success: true, data: transformedData, source: 'database' };
      }
      
      // Try backend (silently fail to reduce console noise)
      try {
        const backendResult = await request('/matches/live');
        return backendResult;
      } catch (backendError: any) {
        // Silently fallback to mock data
        const mockData = getMockMatches('live');
        return { success: true, data: mockData, source: 'mock' };
      }
    } catch (error) {
      // Silently fallback to mock data (errors are expected when backend is off)
      const mockData = getMockMatches('live');
      return { success: true, data: mockData, source: 'mock' };
    }
  },

  // Get matches by date (try DB first, fallback to backend, then mock)
  getMatchesByDate: async (date: string) => {
    try {
      // Try database first
      const dbResult = await matchesDb.getMatchesByDate(date);
      if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
        console.log(`✅ Matches for ${date} from DATABASE`);
        // Transform database format to API format
        const transformedData = dbResult.data.map(transformDbMatchToApiFormat);
        return { success: true, data: transformedData, source: 'database' };
      }
      
      // Try backend (only for today and tomorrow to reduce errors)
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      if (date === today || date === tomorrow) {
        try {
          const backendResult = await request(`/matches/date/${date}`);
          return backendResult;
        } catch (backendError: any) {
          // Silently fallback to mock data (don't log every failed attempt)
          const mockData = getMockMatchesByDate(date);
          return { success: true, data: mockData, source: 'mock' };
        }
      } else {
        // For other dates, directly use mock data (no backend attempt)
        const mockData = getMockMatchesByDate(date);
        return { success: true, data: mockData, source: 'mock' };
      }
    } catch (error) {
      // Silently fallback to mock data (errors are expected when backend is off)
      const mockData = getMockMatchesByDate(date);
      return { success: true, data: mockData, source: 'mock' };
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
      // Try database first
      const dbResult = await matchesDb.getMatchById(matchId);
      if (dbResult.success && dbResult.data) {
        console.log(`✅ Match ${matchId} from DATABASE`);
        // Transform database format to API format
        const transformedData = transformDbMatchToApiFormat(dbResult.data);
        return { success: true, data: transformedData, source: 'database' };
      }
      
      // Try backend
      console.log(`⚠️ Match ${matchId} not in DB, trying BACKEND...`);
      try {
        const backendResult = await request(`/matches/${matchId}`);
        return backendResult;
      } catch (backendError) {
        console.log(`⚠️ Backend failed for match ${matchId}, using MOCK DATA...`);
        // Fallback to mock data
        const mockMatch = getMockMatchById(matchId);
        if (mockMatch) {
          return { success: true, data: mockMatch, source: 'mock' };
        }
        throw new Error('Match not found');
      }
    } catch (error) {
      console.error(`❌ Error in getMatchDetails(${matchId}):`, error);
      throw error;
    }
  },

  // Get match statistics
  getMatchStatistics: (matchId: number) => request(`/matches/${matchId}/statistics`),

  // Get match events (goals, cards, etc.)
  getMatchEvents: (matchId: number) => request(`/matches/${matchId}/events`),

  // Get match lineups
  getMatchLineups: (matchId: number) => request(`/matches/${matchId}/lineups`),

  // Get head to head
  getHeadToHead: (team1Id: number, team2Id: number) => 
    request(`/matches/h2h/${team1Id}/${team2Id}`),
  
  // Get all matches for a team in a season (all competitions)
  getTeamSeasonMatches: (teamId: number, season: number = 2025) => // 2025-26 sezonu
    request(`/matches/team/${teamId}/season/${season}`),
    
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

// Format match time
export function formatMatchTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format match date
export function formatMatchDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('tr-TR', {
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

// Export all
export default {
  matches: matchesApi,
  leagues: leaguesApi,
  teams: teamsApi,
  players: playersApi,
  utils: {
    getTodayDate,
    getDateRange,
    formatMatchTime,
    formatMatchDate,
    isMatchLive,
    isMatchFinished,
  },
};
