// useFavoriteTeamMatches Hook - Get matches for favorite teams
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { getMockMatches } from '../services/mockDataService';

interface Match {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface UseFavoriteTeamMatchesResult {
  pastMatches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFavoriteTeamMatches(): UseFavoriteTeamMatchesResult {
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial load

  // Generate mock matches for testing
  const generateMockMatches = async (): Promise<Match[]> => {
    const mockData = getMockMatches('all');
    return mockData.map((match: any) => ({
      fixture: {
        id: match.id,
        date: match.date,
        timestamp: new Date(match.date).getTime() / 1000,
        status: {
          short: match.status_short,
          long: match.status_long,
          elapsed: match.elapsed,
        },
        venue: {
          name: 'Stadium',
        },
      },
      league: {
        id: match.league.id,
        name: match.league.name,
        country: match.league.country,
        logo: match.league.logo,
      },
      teams: {
        home: {
          id: match.home_team.id,
          name: match.home_team.name,
          logo: match.home_team.logo,
        },
        away: {
          id: match.away_team.id,
          name: match.away_team.name,
          logo: match.away_team.logo,
        },
      },
      goals: {
        home: match.home_score,
        away: match.away_score,
      },
      score: {
        halftime: {
          home: match.home_score ? Math.floor(match.home_score / 2) : null,
          away: match.away_score ? Math.floor(match.away_score / 2) : null,
        },
        fulltime: {
          home: match.home_score,
          away: match.away_score,
        },
      },
    }));
  };
  const { favoriteTeams } = useFavoriteTeams();

  const categorizeMatches = (matches: Match[]) => {
    if (!matches || matches.length === 0) {
      return { past: [], live: [], upcoming: [] };
    }

    const now = Date.now();
    const past: Match[] = [];
    const live: Match[] = [];
    const upcoming: Match[] = [];

    matches.forEach(match => {
      if (!match || !match.fixture) {
        return; // Skip invalid matches
      }

      // Handle both API format (status.short) and direct status string
      const status = match.fixture.status?.short || match.fixture.status || 'NS';
      
      // Live matches (1H, HT, 2H, ET, P, BT, LIVE, etc.)
      if (['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(status)) {
        live.push(match);
      }
      // Finished matches (FT, AET, PEN, etc.)
      else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status)) {
        past.push(match);
      }
      // Upcoming matches (NS, TBD, etc.)
      else if (['NS', 'TBD', 'PST'].includes(status)) {
        upcoming.push(match);
      }
      // Fallback: check timestamp
      else if (match.fixture.timestamp * 1000 > now) {
        upcoming.push(match);
      } else {
        past.push(match);
      }
    });

    // Sort: past (newest first), upcoming (soonest first)
    past.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
    upcoming.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    return { past, live, upcoming };
  };

  const fetchMatches = async () => {
    try {
      console.log('🔄 [useFavoriteTeamMatches] Starting fetch, setting loading=true');
      setLoading(true);
      setError(null);

      if (favoriteTeams.length === 0) {
        setPastMatches([]);
        setLiveMatches([]);
        setUpcomingMatches([]);
        setError('Favori takım seçilmemiş');
        return;
      }

      // ✅ Fetch ALL season matches for favorite teams (all competitions)
      const allMatches: Match[] = [];
      const currentSeason = 2025; // 2025-26 sezonu (aktif sezon)
      
      console.log(`📅 Fetching all season matches for ${favoriteTeams.length} favorite teams...`);
      
      // Fetch live matches first
      try {
        const liveResponse = await api.matches.getLiveMatches();
        if (liveResponse.success && liveResponse.data) {
          allMatches.push(...liveResponse.data);
          console.log(`✅ Found ${liveResponse.data.length} live matches`);
        }
      } catch (err) {
        console.warn('Failed to fetch live matches:', err);
      }

      // Fetch all season matches for each favorite team
      for (const team of favoriteTeams) {
        if (!team || !team.id) continue;
        
        try {
          console.log(`📥 Fetching season matches for ${team.name} (ID: ${team.id})...`);
          const response = await api.matches.getTeamSeasonMatches(team.id, currentSeason);
          
          if (response.success && response.data && response.data.length > 0) {
            console.log(`✅ Found ${response.data.length} matches for ${team.name}`);
            
            // Add matches (avoid duplicates by checking fixture ID)
            const existingIds = new Set(allMatches.map(m => m.fixture.id));
            const newMatches = response.data.filter((match: any) => {
              const fixtureId = match.fixture?.id || match.id;
              return !existingIds.has(fixtureId);
            });
            
            allMatches.push(...newMatches);
          } else {
            console.log(`⚠️ No matches found for ${team.name}`);
          }
        } catch (err) {
          console.warn(`Failed to fetch matches for team ${team.name}:`, err);
        }
      }
      
      console.log(`📊 Total matches fetched: ${allMatches.length}`);

      // Remove duplicates (handle both fixture.id and id)
      const uniqueMatches = Array.from(
        new Map(allMatches.map(m => [m.fixture?.id || m.id, m])).values()
      ).filter(m => {
        // Ensure match has required structure
        if (!m) return false;
        if (!m.fixture) {
          // Try to fix if it's in database format
          if (m.id && m.fixture_date) {
            // This should have been transformed by api.ts, but just in case
            return false; // Skip, let transform function handle it
          }
          return false;
        }
        return true;
      });

      // Categorize matches
      const { past, live, upcoming } = categorizeMatches(uniqueMatches);
      
      // If no matches found, use mock data (without filtering by favorite teams)
      if (past.length === 0 && live.length === 0 && upcoming.length === 0) {
        console.log('📊 No favorite team matches found, using MOCK DATA...');
        const mockMatches = await generateMockMatches();
        const categorized = categorizeMatches(mockMatches);
        setPastMatches(categorized.past);
        setLiveMatches(categorized.live);
        setUpcomingMatches(categorized.upcoming.slice(0, 10));
        console.log(`✅ Mock data loaded: ${categorized.past.length} past, ${categorized.live.length} live, ${categorized.upcoming.length} upcoming`);
      } else {
        setPastMatches(past);
        setLiveMatches(live);
        setUpcomingMatches(upcoming.slice(0, 10)); // Limit upcoming to 10 matches
        console.log(`✅ Matches loaded: ${past.length} past, ${live.length} live, ${upcoming.length} upcoming`);
      }

    } catch (err: any) {
      console.error('Error fetching favorite team matches:', err);
      setError(err.message || 'Maçlar yüklenemedi');
    } finally {
      console.log('✅ [useFavoriteTeamMatches] Fetch complete, setting loading=false');
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    
    // Refetch every 30 seconds
    const interval = setInterval(() => {
      fetchMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [favoriteTeams]);

  return {
    pastMatches,
    liveMatches,
    upcomingMatches,
    loading,
    error,
    refetch: fetchMatches,
  };
}
