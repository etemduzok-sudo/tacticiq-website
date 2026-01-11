// useFavoriteTeamMatches Hook - Get matches for favorite teams
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { getMockMatches } from '../services/mockDataService';

// Cache keys
const CACHE_KEY = 'fan-manager-matches-cache';
const CACHE_TIMESTAMP_KEY = 'fan-manager-matches-cache-timestamp';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 saat (ms)

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
  hasLoadedOnce: boolean; // Flag to prevent flickering on subsequent loads
}

export function useFavoriteTeamMatches(): UseFavoriteTeamMatchesResult {
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false); // Cache'den yüklenirse loading gösterme
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track if we've successfully loaded data

  // 💾 Cache'den maçları yükle
  const loadFromCache = async (): Promise<boolean> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (!cachedData || !cacheTimestamp) {
        console.log('📦 No cache found');
        return false;
      }

      const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
      const isCacheValid = cacheAge < CACHE_DURATION;

      if (!isCacheValid) {
        console.log('⏰ Cache expired (age:', Math.round(cacheAge / 1000 / 60), 'minutes)');
        return false;
      }

      const { past, live, upcoming } = JSON.parse(cachedData);
      setPastMatches(past || []);
      setLiveMatches(live || []);
      setUpcomingMatches(upcoming || []);
      setHasLoadedOnce(true);

      console.log('✅ Loaded from cache:', {
        past: past?.length || 0,
        live: live?.length || 0,
        upcoming: upcoming?.length || 0,
        age: Math.round(cacheAge / 1000 / 60) + ' minutes',
      });

      return true;
    } catch (error) {
      console.error('❌ Error loading cache:', error);
      return false;
    }
  };

  // 💾 Maçları cache'e kaydet
  const saveToCache = async (past: Match[], live: Match[], upcoming: Match[]) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ past, live, upcoming })
      );
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 Saved to cache:', { past: past.length, live: live.length, upcoming: upcoming.length });
    } catch (error) {
      console.error('❌ Error saving cache:', error);
    }
  };

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
      const matchTime = match.fixture.timestamp * 1000;
      
      // Debug: Log first 3 matches
      if (past.length + live.length + upcoming.length < 3) {
        console.log(`🔍 Match categorization:`, {
          teams: `${match.teams.home.name} vs ${match.teams.away.name}`,
          status,
          timestamp: match.fixture.timestamp,
          date: new Date(matchTime).toLocaleDateString('tr-TR'),
          isLive: ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(status),
          isFinished: ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status),
          isUpcoming: ['NS', 'TBD', 'PST'].includes(status),
          isFuture: matchTime > now,
        });
      }
      
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

    // Filter upcoming matches to only show next 15 days
    const fifteenDaysFromNow = now + (15 * 24 * 60 * 60 * 1000);
    const upcomingFiltered = upcoming.filter(match => {
      const matchTime = match.fixture.timestamp * 1000;
      return matchTime <= fifteenDaysFromNow;
    });

    return { past, live, upcoming: upcomingFiltered };
  };

  const fetchMatches = async () => {
    try {
      // Only show loading spinner on first load
      if (!hasLoadedOnce) {
        console.log('🔄 [useFavoriteTeamMatches] First load, showing spinner');
        setLoading(true);
      } else {
        console.log('🔄 [useFavoriteTeamMatches] Background refresh, keeping UI');
      }
      setError(null);

      if (!favoriteTeams || favoriteTeams.length === 0) {
        console.log('⚠️ [fetchMatches] No favorite teams available');
        setPastMatches([]);
        setLiveMatches([]);
        setUpcomingMatches([]);
        setError('Favori takım seçilmemiş');
        setLoading(false);
        return;
      }

      // ✅ Fetch ALL season matches for favorite teams (all competitions)
      const allMatches: Match[] = [];
      const liveMatchesFromAPI: Match[] = [];
      const currentSeason = 2025; // 2025-26 sezonu (aktif sezon)
      
      console.log(`📅 Fetching all season matches for ${favoriteTeams.length} favorite teams...`);
      
      // Fetch live matches separately (we'll filter for favorite teams later)
      try {
        const liveResponse = await api.matches.getLiveMatches();
        if (liveResponse.success && liveResponse.data) {
          liveMatchesFromAPI.push(...liveResponse.data);
          console.log(`✅ Found ${liveResponse.data.length} live matches (all teams)`);
        }
      } catch (err) {
        console.warn('Failed to fetch live matches:', err);
      }

      // Fetch ALL matches for each favorite team (but optimized with single endpoint)
      for (const team of favoriteTeams) {
        if (!team || !team.id) continue;
        
        try {
          console.log(`📥 Fetching ALL matches for ${team.name} (ID: ${team.id})...`);
          
          // Fetch all season matches in one call
          const url = `/matches/team/${team.id}/season/${currentSeason}`;
          const fullUrl = `${api.getBaseUrl()}${url}`;
          console.log(`🌐 Requesting: ${fullUrl}`);
          
          const result = await fetch(fullUrl, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          console.log(`📡 Response status: ${result.status}`);
          
          if (!result.ok) {
            const errorText = await result.text();
            console.error(`❌ HTTP Error ${result.status}:`, errorText);
            continue;
          }
          
          const response = await result.json();
          console.log(`📦 Response:`, { success: response.success, dataLength: response.data?.length, source: response.source });
          
          if (response.success && response.data && response.data.length > 0) {
            console.log(`✅ Found ${response.data.length} total matches for ${team.name}`);
            allMatches.push(...response.data);
          } else {
            console.log(`⚠️ No matches found for ${team.name}`);
          }
          
        } catch (err) {
          console.error(`❌ Failed to fetch matches for team ${team.name}:`, err);
        }
      }
      
      console.log(`📊 Total team season matches fetched: ${allMatches.length}`);
      
      // Debug: Check first match structure
      if (allMatches.length > 0) {
        console.log('🔍 First match structure:', {
          hasFixture: !!allMatches[0].fixture,
          hasId: !!allMatches[0].id,
          hasFixtureDate: !!allMatches[0].fixture_date,
          keys: Object.keys(allMatches[0]),
          sample: allMatches[0]
        });
      }

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

      console.log(`📊 After removing duplicates: ${uniqueMatches.length} matches`);
      
      // Debug: Log favorite team matches specifically (ID-based)
      const favoriteTeamIds = favoriteTeams.map(t => t.id);
      const favoriteMatches = uniqueMatches.filter(m => 
        favoriteTeamIds.includes(m.teams?.home?.id) || 
        favoriteTeamIds.includes(m.teams?.away?.id)
      );
      console.log(`🟡 Favorite team matches found: ${favoriteMatches.length} (IDs: ${favoriteTeamIds.join(', ')})`);
      if (favoriteMatches.length > 0) {
        console.log('🟡 First 5 favorite team matches:', favoriteMatches.slice(0, 5).map(m => ({
          teams: `${m.teams.home.name} (${m.teams.home.id}) vs ${m.teams.away.name} (${m.teams.away.id})`,
          status: m.fixture.status?.short || m.fixture.status,
          date: new Date(m.fixture.timestamp * 1000).toLocaleDateString('tr-TR'),
        })));
      }

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
        
        // 💾 Cache'e kaydet
        await saveToCache(past, live, upcoming.slice(0, 10));
        
        // Mark as successfully loaded
        if (past.length > 0 || live.length > 0 || upcoming.length > 0) {
          setHasLoadedOnce(true);
        }
      }

    } catch (err: any) {
      console.error('Error fetching favorite team matches:', err);
      setError(err.message || 'Maçlar yüklenemedi');
    } finally {
      console.log('✅ [useFavoriteTeamMatches] Fetch complete, setting loading=false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip if no favorite teams
    if (!favoriteTeams || favoriteTeams.length === 0) {
      console.log('⚠️ No favorite teams yet, skipping fetch');
      setLoading(false); // Stop loading if no teams
      return;
    }

    // 🚀 CACHE STRATEJİSİ: Önce cache'den yükle, sonra arka planda güncelle
    const initializeMatches = async () => {
      const cacheLoaded = await loadFromCache();
      
      if (cacheLoaded) {
        console.log('✅ Cache loaded, fetching in background...');
        // Cache'den yüklendi, arka planda güncelle (loading gösterme)
        fetchMatches();
      } else {
        console.log('❌ No cache, fetching with loading...');
        // Cache yok, loading göster
        setLoading(true);
        fetchMatches();
      }
    };

    // Only fetch ONCE on initial load
    if (!hasLoadedOnce) {
      initializeMatches();
    } else {
      console.log('✅ Data already loaded, skipping fetch');
    }
  }, [favoriteTeams.length]); // Only re-run when team count changes

  return {
    pastMatches,
    liveMatches,
    upcomingMatches,
    loading,
    error,
    refetch: fetchMatches,
    hasLoadedOnce, // Return flag to prevent flickering
  };
}
