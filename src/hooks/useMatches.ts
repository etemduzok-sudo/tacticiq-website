// useMatches Hook - Fetch live match data
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { Match, ApiResponse } from '../types/match.types';

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

    console.log(`🎯 Filtered ${filtered.length} matches from ${matchList.length} (favorites: ${favoriteTeamNames.join(', ')})`);
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
          console.log(`✅ Fetched ${filteredMatches.length} matches for ${targetDate} (total: ${response.data.length})`);
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        console.error('Error fetching matches by date:', err);
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
          console.log(`🔴 ${filteredLive.length} live matches (total: ${liveResponse.data.length})`);
        } else {
          setLiveMatches([]);
        }
      } catch (err: any) {
        console.warn('Error fetching live matches:', err);
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
      console.error('Error in fetchMatches:', err);
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
          console.log(`✅ Fetched ${response.data.length} matches for league ${leagueId}`);
        }
      } catch (err: any) {
        console.error('Error fetching league matches:', err);
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

        console.log(`✅ Fetched details for match ${matchId}`);
      } catch (err: any) {
        console.error('Error fetching match details:', err);
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
          console.log(`✅ Fetched standings for league ${leagueId}`);
        }
      } catch (err: any) {
        console.error('Error fetching standings:', err);
        setError(err.message || 'Failed to fetch standings');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, season]);

  return { standings, loading, error };
}
