// React Query - Matches Hook
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Match, ApiResponse } from '../../types/match.types';
import { useFavoriteTeams } from '../useFavoriteTeams';

export const QUERY_KEYS = {
  matches: {
    all: ['matches'] as const,
    byDate: (date: string) => ['matches', 'date', date] as const,
    live: () => ['matches', 'live'] as const,
    byLeague: (leagueId: number, season?: number) => ['matches', 'league', leagueId, season] as const,
    details: (matchId: number) => ['matches', 'details', matchId] as const,
    statistics: (matchId: number) => ['matches', 'statistics', matchId] as const,
    events: (matchId: number) => ['matches', 'events', matchId] as const,
    lineups: (matchId: number) => ['matches', 'lineups', matchId] as const,
  },
};

// Get matches by date
export function useMatchesByDate(date?: string, filterByFavorites: boolean = false) {
  const { favoriteTeams } = useFavoriteTeams();
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: QUERY_KEYS.matches.byDate(targetDate),
    queryFn: async () => {
      const response = await api.matches.getMatchesByDate(targetDate);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch matches');
      }

      let matches = response.data;

      // Filter by favorites if enabled
      if (filterByFavorites && favoriteTeams.length > 0) {
        const favoriteTeamNames = favoriteTeams
          .filter(t => t && t.name)
          .map(t => t.name.toLowerCase());

        matches = matches.filter((match: Match) => {
          if (!match?.teams?.home || !match?.teams?.away) return false;
          
          const homeName = match.teams.home.name?.toLowerCase() || '';
          const awayName = match.teams.away.name?.toLowerCase() || '';
          
          return favoriteTeamNames.some(favName => 
            homeName.includes(favName) || favName.includes(homeName) ||
            awayName.includes(favName) || favName.includes(awayName)
          );
        });
      }

      return matches;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get live matches
export function useLiveMatches(filterByFavorites: boolean = false) {
  const { favoriteTeams } = useFavoriteTeams();

  return useQuery({
    queryKey: QUERY_KEYS.matches.live(),
    queryFn: async () => {
      const response = await api.matches.getLiveMatches();
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch live matches');
      }

      let matches = response.data;

      // Filter by favorites if enabled
      if (filterByFavorites && favoriteTeams.length > 0) {
        const favoriteTeamNames = favoriteTeams
          .filter(t => t && t.name)
          .map(t => t.name.toLowerCase());

        matches = matches.filter((match: Match) => {
          if (!match?.teams?.home || !match?.teams?.away) return false;
          
          const homeName = match.teams.home.name?.toLowerCase() || '';
          const awayName = match.teams.away.name?.toLowerCase() || '';
          
          return favoriteTeamNames.some(favName => 
            homeName.includes(favName) || favName.includes(homeName) ||
            awayName.includes(favName) || favName.includes(awayName)
          );
        });
      }

      return matches;
    },
    staleTime: 10 * 1000, // 10 seconds (live data)
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}

// Get match details
export function useMatchDetails(matchId: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.matches.details(matchId),
    queryFn: async () => {
      const [matchRes, statsRes, eventsRes, lineupsRes] = await Promise.allSettled([
        api.matches.getMatchDetails(matchId),
        api.matches.getMatchStatistics(matchId),
        api.matches.getMatchEvents(matchId),
        api.matches.getMatchLineups(matchId),
      ]);

      const match = matchRes.status === 'fulfilled' && matchRes.value.success 
        ? matchRes.value.data 
        : null;
      
      const statistics = statsRes.status === 'fulfilled' && statsRes.value.success 
        ? statsRes.value.data 
        : null;
      
      const events = eventsRes.status === 'fulfilled' && eventsRes.value.success 
        ? eventsRes.value.data 
        : null;
      
      const lineups = lineupsRes.status === 'fulfilled' && lineupsRes.value.success 
        ? lineupsRes.value.data 
        : null;

      if (!match) {
        throw new Error('Failed to fetch match details');
      }

      return {
        match,
        statistics,
        events,
        lineups,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Prefetch match details (for better UX)
export function usePrefetchMatchDetails() {
  const queryClient = useQueryClient();

  return (matchId: number) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.matches.details(matchId),
      queryFn: async () => {
        const response = await api.matches.getMatchDetails(matchId);
        return response.data;
      },
    });
  };
}

// Invalidate matches cache
export function useInvalidateMatches() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matches.all });
  };
}
