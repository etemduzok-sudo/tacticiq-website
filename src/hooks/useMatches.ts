// useMatches Hook - Fetch live match data
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { Match, ApiResponse } from '../types/match.types';
import { logger } from '../utils/logger';

interface UseMatchesResult {
  matches: Match[];
  liveMatches: Match[];
  pastMatches: Match[];
  upcomingMatches: Match[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMatches(date?: string, filterByFavorites: boolean = false): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favoriteTeams } = useFavoriteTeams();

  const filterMatchesByFavorites = (matchList: Match[]) => {
    if (!filterByFavorites || !favoriteTeams || favoriteTeams.length === 0) {
      return matchList;
    }

    if (!matchList || matchList.length === 0) {
      return [];
    }

    // İsimle eşleştir (API-Football'da takım isimleri farklı olabilir)
    const favoriteTeamNames = favoriteTeams
      .filter(t => t && t.name)
      .map(t => t.name.toLowerCase());
    
    if (favoriteTeamNames.length === 0) {
      return matchList;
    }

    const filtered = matchList.filter(match => {
      if (!match || !match.teams || !match.teams.home || !match.teams.away) {
        return false;
      }

      const homeName = match.teams.home.name?.toLowerCase() || '';
      const awayName = match.teams.away.name?.toLowerCase() || '';
      
      return favoriteTeamNames.some(favName => 
        homeName.includes(favName) || favName.includes(homeName) ||
        awayName.includes(favName) || favName.includes(awayName)
      );
    });

    logger.debug(`Filtered matches`, { filtered: filtered.length, total: matchList.length, favorites: favoriteTeamNames }, 'MATCHES');
    return filtered;
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      let hasMatches = false;
      let hasLiveMatches = false;

      // Fetch today's matches or specific date
      const targetDate = date || api.utils.getTodayDate();
      try {
        const response = await api.matches.getMatchesByDate(targetDate);
        
        if (response.success && response.data && response.data.length > 0) {
          const filteredMatches = filterMatchesByFavorites(response.data);
          setMatches(filteredMatches);
          hasMatches = filteredMatches.length > 0;
          logger.info(`Fetched matches for ${targetDate}`, { filtered: filteredMatches.length, total: response.data.length, date: targetDate }, 'MATCHES');
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        logger.error('Error fetching matches by date', { error: err, date: targetDate }, 'MATCHES');
        setMatches([]);
        // Don't set error here, try to fetch live matches anyway
      }

      // Also fetch live matches (non-blocking)
      try {
        const liveResponse = await api.matches.getLiveMatches();
        if (liveResponse.success && liveResponse.data && liveResponse.data.length > 0) {
          const filteredLive = filterMatchesByFavorites(liveResponse.data);
          setLiveMatches(filteredLive);
          hasLiveMatches = filteredLive.length > 0;
          logger.info(`${filteredLive.length} live matches`, { filtered: filteredLive.length, total: liveResponse.data.length }, 'MATCHES');
        } else {
          setLiveMatches([]);
        }
      } catch (err: any) {
        logger.warn('Error fetching live matches', { error: err }, 'MATCHES');
        setLiveMatches([]);
        // Don't fail the whole request if live matches fail
      }

      // Only set error if both requests failed and we have no data
      if (!hasMatches && !hasLiveMatches) {
        if (filterByFavorites && favoriteTeams.length > 0) {
          setError('Favori takımlarınızın maçı bulunamadı.');
        } else {
          setError('Maçlar yüklenemedi. Lütfen tekrar deneyin.');
        }
      }

    } catch (err: any) {
      logger.error('Error in fetchMatches', { error: err, date, filterByFavorites }, 'MATCHES');
      setError(err.message || 'Maçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    
    // Refetch live matches every 30 seconds
    const interval = setInterval(() => {
      fetchMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [date, filterByFavorites, favoriteTeams]);

  return {
    matches,
    liveMatches,
    loading,
    error,
    refetch: fetchMatches,
  };
}

// Hook for specific league matches
export function useLeagueMatches(leagueId: number, season?: number) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.matches.getMatchesByLeague(leagueId, season);
        
        if (response.success && response.data) {
          setMatches(response.data);
          logger.info(`Fetched matches for league ${leagueId}`, { count: response.data.length, leagueId, season }, 'MATCHES');
        }
      } catch (err: any) {
        logger.error('Error fetching league matches', { error: err, leagueId, season }, 'MATCHES');
        setError(err.message || 'Failed to fetch league matches');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueMatches();
  }, [leagueId, season]);

  return { matches, loading, error };
}

// Hook for match details
export function useMatchDetails(matchId: number) {
  const [match, setMatch] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all match data in parallel
        const [matchRes, statsRes, eventsRes, lineupsRes] = await Promise.all([
          api.matches.getMatchDetails(matchId),
          api.matches.getMatchStatistics(matchId),
          api.matches.getMatchEvents(matchId),
          api.matches.getMatchLineups(matchId),
        ]);

        if (matchRes.success) setMatch(matchRes.data);
        if (statsRes.success) setStatistics(statsRes.data);
        if (eventsRes.success) setEvents(eventsRes.data);
        if (lineupsRes.success) setLineups(lineupsRes.data);

        logger.info(`Fetched details for match ${matchId}`, { matchId }, 'MATCH_DETAILS');
      } catch (err: any) {
        logger.error('Error fetching match details', { error: err, matchId }, 'MATCH_DETAILS');
        setError(err.message || 'Failed to fetch match details');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  return { match, statistics, events, lineups, loading, error };
}

// Hook for league standings
export function useLeagueStandings(leagueId: number, season?: number) {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.leagues.getLeagueStandings(leagueId, season);
        
        if (response.success && response.data?.[0]?.league?.standings) {
          setStandings(response.data[0].league.standings[0]);
          logger.info(`Fetched standings for league ${leagueId}`, { leagueId, season }, 'STANDINGS');
        }
      } catch (err: any) {
        logger.error('Error fetching standings', { error: err, leagueId, season }, 'STANDINGS');
        setError(err.message || 'Failed to fetch standings');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, season]);

  return { standings, loading, error };
}
