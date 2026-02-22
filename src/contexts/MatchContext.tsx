// ============================================
// MATCH CONTEXT
// ============================================
// Maç detay state management
// ============================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================

export interface Match {
  id: number;
  date: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
}

export interface MatchStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: string | number;
  }>;
}

export interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: string; // 'Goal', 'Card', 'subst'
  detail: string;
  comments: string | null;
}

export interface MatchLineups {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
    };
  }>;
}

interface MatchContextType {
  selectedMatch: Match | null;
  matchStatistics: MatchStatistics[] | null;
  matchEvents: MatchEvent[];
  matchLineups: MatchLineups[] | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSelectedMatch: (match: Match | null) => void;
  fetchMatchDetails: (matchId: number) => Promise<void>;
  fetchMatchStatistics: (matchId: number) => Promise<void>;
  fetchMatchEvents: (matchId: number) => Promise<void>;
  fetchMatchLineups: (matchId: number) => Promise<void>;
  fetchAllMatchData: (matchId: number) => Promise<void>;
  clearError: () => void;
  clearMatchData: () => void;
}

// ============================================
// CONTEXT
// ============================================

const MatchContext = createContext<MatchContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface MatchProviderProps {
  children: ReactNode;
}

export function MatchProvider({ children }: MatchProviderProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchStatistics, setMatchStatistics] = useState<MatchStatistics[] | null>(null);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchLineups, setMatchLineups] = useState<MatchLineups[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Base URL - Backend port 3001
  const API_URL = __DEV__ 
    ? 'http://localhost:3001/api'
    : 'https://api.tacticiq.com/api';

  // ============================================
  // ACTIONS
  // ============================================

  // Fetch match details
  const fetchMatchDetails = useCallback(async (matchId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch match details');
      }

      // Transform API data to Match type
      const apiData = result.data;
      const match: Match = {
        id: apiData.fixture.id,
        date: apiData.fixture.date,
        status: apiData.fixture.status.short,
        homeTeam: {
          id: apiData.teams.home.id,
          name: apiData.teams.home.name,
          logo: apiData.teams.home.logo,
        },
        awayTeam: {
          id: apiData.teams.away.id,
          name: apiData.teams.away.name,
          logo: apiData.teams.away.logo,
        },
        homeScore: apiData.goals.home,
        awayScore: apiData.goals.away,
        league: {
          id: apiData.league.id,
          name: apiData.league.name,
          country: apiData.league.country,
          logo: apiData.league.logo,
        },
      };

      setSelectedMatch(match);
      console.log('✅ Match details fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching match details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch match statistics
  const fetchMatchStatistics = useCallback(async (matchId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}/statistics`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch statistics');
      }

      setMatchStatistics(result.data);
      console.log('✅ Match statistics fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching statistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch match events
  const fetchMatchEvents = useCallback(async (matchId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}/events`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch events');
      }

      setMatchEvents(result.data);
      console.log('✅ Match events fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch match lineups
  const fetchMatchLineups = useCallback(async (matchId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}/lineups`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch lineups');
      }

      setMatchLineups(result.data);
      console.log('✅ Match lineups fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching lineups:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch all match data at once
  const fetchAllMatchData = useCallback(async (matchId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [detailsRes, statsRes, eventsRes, lineupsRes] = await Promise.all([
        fetch(`${API_URL}/matches/${matchId}`),
        fetch(`${API_URL}/matches/${matchId}/statistics`),
        fetch(`${API_URL}/matches/${matchId}/events`),
        fetch(`${API_URL}/matches/${matchId}/lineups`),
      ]);

      const [detailsData, statsData, eventsData, lineupsData] = await Promise.all([
        detailsRes.json(),
        statsRes.json(),
        eventsRes.json(),
        lineupsRes.json(),
      ]);

      // Set match details
      if (detailsData.success) {
        const apiData = detailsData.data;
        const match: Match = {
          id: apiData.fixture.id,
          date: apiData.fixture.date,
          status: apiData.fixture.status.short,
          homeTeam: {
            id: apiData.teams.home.id,
            name: apiData.teams.home.name,
            logo: apiData.teams.home.logo,
          },
          awayTeam: {
            id: apiData.teams.away.id,
            name: apiData.teams.away.name,
            logo: apiData.teams.away.logo,
          },
          homeScore: apiData.goals.home,
          awayScore: apiData.goals.away,
          league: {
            id: apiData.league.id,
            name: apiData.league.name,
            country: apiData.league.country,
            logo: apiData.league.logo,
          },
        };
        setSelectedMatch(match);
      }

      // Set statistics
      if (statsData.success) {
        setMatchStatistics(statsData.data);
      }

      // Set events
      if (eventsData.success) {
        setMatchEvents(eventsData.data);
      }

      // Set lineups
      if (lineupsData.success) {
        setMatchLineups(lineupsData.data);
      }

      console.log('✅ All match data fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching all match data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear match data
  const clearMatchData = useCallback(() => {
    setSelectedMatch(null);
    setMatchStatistics(null);
    setMatchEvents([]);
    setMatchLineups(null);
    setError(null);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: MatchContextType = {
    selectedMatch,
    matchStatistics,
    matchEvents,
    matchLineups,
    loading,
    error,
    setSelectedMatch,
    fetchMatchDetails,
    fetchMatchStatistics,
    fetchMatchEvents,
    fetchMatchLineups,
    fetchAllMatchData,
    clearError,
    clearMatchData,
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within MatchProvider');
  }
  return context;
}
