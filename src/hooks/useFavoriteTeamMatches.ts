// useFavoriteTeamMatches Hook - Get matches for favorite teams
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { getMockMatches } from '../services/mockDataService';
import { logger } from '../utils/logger';

// Cache keys
const CACHE_KEY = 'tacticiq-matches-cache';
const CACHE_TIMESTAMP_KEY = 'tacticiq-matches-cache-timestamp';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 saat (ms)

// ✅ Clear cache when team IDs change (migration)
export async function clearMatchesCache() {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    logger.debug('Matches cache cleared', undefined, 'CACHE');
  } catch (error) {
    logger.error('Error clearing cache', { error }, 'CACHE');
  }
}

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
        logger.debug('No cache found', undefined, 'CACHE');
        return false;
      }

      const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
      const isCacheValid = cacheAge < CACHE_DURATION;

      if (!isCacheValid) {
        logger.debug('Cache expired', { ageMinutes: Math.round(cacheAge / 1000 / 60) }, 'CACHE');
        return false;
      }

      const { past, live, upcoming } = JSON.parse(cachedData);
      setPastMatches(past || []);
      setLiveMatches(live || []);
      setUpcomingMatches(upcoming || []);
      setHasLoadedOnce(true);

      logger.debug('Loaded from cache', {
        past: past?.length || 0,
        live: live?.length || 0,
        upcoming: upcoming?.length || 0,
        ageMinutes: Math.round(cacheAge / 1000 / 60),
      }, 'CACHE');

      return true;
    } catch (error) {
      logger.error('Error loading cache', { error }, 'CACHE');
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
      logger.debug('Saved to cache', { past: past.length, live: live.length, upcoming: upcoming.length }, 'CACHE');
    } catch (error) {
      logger.error('Error saving cache', { error }, 'CACHE');
    }
  };

  // Generate mock matches for testing
  const generateMockMatches = async (): Promise<Match[]> => {
    const mockData = getMockMatches('all');
    return mockData
      .filter((match: any) => match && match.league && match.home_team && match.away_team) // Safety check
      .map((match: any) => {
        // Additional safety checks
        if (!match.league || !match.home_team || !match.away_team) {
          logger.warn('Invalid mock match data', { match }, 'MOCK_DATA');
          return null;
        }
        return {
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
        id: match.league?.id || 0,
        name: match.league?.name || 'Unknown League',
        country: match.league?.country || 'Unknown',
        logo: match.league?.logo || '',
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
    };
      })
      .filter((match: any) => match !== null) as Match[]; // Remove null entries
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
        logger.debug('Match categorization', {
          teams: `${match.teams.home.name} vs ${match.teams.away.name}`,
          status,
          timestamp: match.fixture.timestamp,
          date: new Date(matchTime).toLocaleDateString('tr-TR'),
          isLive: ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(status),
          isFinished: ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status),
          isUpcoming: ['NS', 'TBD', 'PST'].includes(status),
          isFuture: matchTime > now,
        }, 'MATCH_CATEGORIZATION');
      }
      
      // ✅ NATIONAL TEAM: Check league type for better categorization
      const leagueName = match.league?.name?.toLowerCase() || '';
      const round = match.league?.round?.toLowerCase() || '';
      const isNationalMatch = leagueName.includes('world cup') ||
                              leagueName.includes('euro') ||
                              leagueName.includes('qualification') ||
                              leagueName.includes('play-off') ||
                              leagueName.includes('playoff') ||
                              leagueName.includes('nations league') ||
                              leagueName.includes('copa america') ||
                              leagueName.includes('africa cup') ||
                              leagueName.includes('asian cup') ||
                              leagueName.includes('uefa') ||
                              leagueName.includes('conmebol');
      
      // Check if it's group stage or playoff
      const isGroupStage = round.includes('group') || round.includes('grupp') || 
                          round.includes('matchday') || round.includes('round 1') ||
                          round.includes('round 2') || round.includes('round 3');
      const isPlayoff = round.includes('play-off') || round.includes('playoff') ||
                        round.includes('qualification') || round.includes('final') ||
                        round.includes('semi') || round.includes('quarter') ||
                        round.includes('round of 16') || round.includes('round of 8') ||
                        round.includes('knockout');
      
      // Live matches (1H, HT, 2H, ET, P, BT, LIVE, etc.)
      if (['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(status)) {
        live.push(match);
      }
      // Finished matches (FT, AET, PEN, etc.)
      else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status)) {
        // ✅ NATIONAL TEAM: Grup maçları geçmişte, play-off maçları gelecekte
        if (isNationalMatch) {
          if (isGroupStage) {
            // Grup maçları her zaman geçmişte (bitmiş olarak kabul edilir)
            past.push(match);
          } else if (isPlayoff && matchTime > now) {
            // Play-off maçları gelecekteyse geleceğe ekle
            upcoming.push(match);
          } else {
            // Diğer durumlar için normal mantık
            past.push(match);
          }
        } else {
          past.push(match);
        }
      }
      // Upcoming matches (NS, TBD, etc.)
      else if (['NS', 'TBD', 'PST'].includes(status)) {
        // ✅ NATIONAL TEAM: Play-off maçları gelecekte, grup maçları geçmişte
        if (isNationalMatch) {
          if (isPlayoff) {
            // Play-off maçları gelecekte
            upcoming.push(match);
          } else if (isGroupStage) {
            // Grup maçları geçmişte (genellikle bitmiş olur)
            past.push(match);
          } else {
            // Diğer durumlar için normal mantık
            upcoming.push(match);
          }
        } else {
          upcoming.push(match);
        }
      }
      // Fallback: check timestamp
      else if (match.fixture.timestamp * 1000 > now) {
        // ✅ NATIONAL TEAM: Play-off maçları gelecekte
        if (isNationalMatch && isPlayoff) {
          upcoming.push(match);
        } else if (isNationalMatch && isGroupStage) {
          // Grup maçları geçmişte (nadiren gelecekte olur)
          past.push(match);
        } else {
          upcoming.push(match);
        }
      } else {
        // ✅ NATIONAL TEAM: Grup maçları geçmişte
        if (isNationalMatch && isGroupStage) {
          past.push(match);
        } else {
          past.push(match);
        }
      }
    });

    // Sort: past (newest first), upcoming (soonest first)
    past.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
    upcoming.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    // ✅ NATIONAL TEAM: Play-off ve turnuva maçları için daha uzun süre göster
    // Grup maçları için filtreleme yok (hepsi geçmişte)
    const isNationalTeamMatch = (match: Match) => {
      const leagueName = match.league?.name?.toLowerCase() || '';
      return leagueName.includes('world cup') || leagueName.includes('euro') ||
             leagueName.includes('qualification') || leagueName.includes('play-off') ||
             leagueName.includes('playoff') || leagueName.includes('nations league') ||
             leagueName.includes('copa america') || leagueName.includes('africa cup') ||
             leagueName.includes('asian cup');
    };
    
    // Filter upcoming matches
    // Milli takım maçları için 90 gün, kulüp maçları için 15 gün
    const upcomingFiltered = upcoming.filter(match => {
      const matchTime = match.fixture.timestamp * 1000;
      const isNational = isNationalTeamMatch(match);
      const maxDays = isNational ? 90 : 15; // Milli takım maçları için 90 gün (play-off'lar için)
      const maxTime = now + (maxDays * 24 * 60 * 60 * 1000);
      return matchTime <= maxTime;
    });

    return { past, live, upcoming: upcomingFiltered };
  };

  const fetchMatches = async () => {
    try {
      // Only show loading spinner on first load
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      setError(null);

      if (!favoriteTeams || favoriteTeams.length === 0) {
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
      
      // Fetch live matches separately (we'll filter for favorite teams later)
      try {
        const liveResponse = await api.matches.getLiveMatches();
        if (liveResponse.success && liveResponse.data) {
          liveMatchesFromAPI.push(...liveResponse.data);
        }
      } catch (err) {
        // Silent fail - backend çalışmıyor olabilir
      }

      // Fetch ALL matches for each favorite team (but optimized with single endpoint)
      for (const team of favoriteTeams) {
        if (!team || !team.id) continue;
        
        try {
          // ✅ Check if team is national team
          // Milli takım ID'leri: 777 (Türkiye), 25 (Almanya), 6 (Brezilya), 26 (Arjantin)
          const nationalTeamIds = [777, 25, 6, 26];
          const isNationalTeam = nationalTeamIds.includes(team.id) ||
                                 team.league === 'UEFA' || 
                                 team.league === 'CONMEBOL' || 
                                 team.name === 'Türkiye' || 
                                 team.name === 'Almanya' || 
                                 team.name === 'Brezilya' || 
                                 team.name === 'Arjantin' ||
                                 (team as any).type === 'national';
          
          if (isNationalTeam) {
            // ✅ NATIONAL TEAM: Fetch matches from multiple seasons (2024, 2025, 2026)
            // Milli takımlar için Dünya Kupası, Avrupa Şampiyonası, Play-off maçları farklı sezonlarda olabilir
            const nationalSeasons = [2024, 2025, 2026]; // Son 3 yıl + gelecek yıl
            let backendAvailable = true; // Backend kontrolü için flag
            
            for (const season of nationalSeasons) {
              try {
                const url = `/matches/team/${team.id}/season/${season}`;
                const fullUrl = `${api.getBaseUrl()}${url}`;
                
                const result = await fetch(fullUrl, {
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(5000) // 5 saniye timeout
                });
                
                if (result.ok) {
                  const response = await result.json();
                  if (response.success && response.data && response.data.length > 0) {
                    allMatches.push(...response.data);
                  }
                }
              } catch (seasonErr: any) {
                // Backend çalışmıyorsa sadece bir kez log göster
                if (seasonErr.name === 'AbortError' || seasonErr.message?.includes('ERR_CONNECTION_REFUSED')) {
                  if (backendAvailable) {
                    logger.warn('Backend sunucusu çalışmıyor. Milli takım maçları yüklenemiyor.', { teamId: team.id, teamName: team.name }, 'API');
                    backendAvailable = false; // Bir kez göster
                  }
                }
                // Continue with next season
              }
            }
          } else {
            // ✅ CLUB TEAM: Fetch current season matches only
            const url = `/matches/team/${team.id}/season/${currentSeason}`;
            const fullUrl = `${api.getBaseUrl()}${url}`;
            
            const result = await fetch(fullUrl, {
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000) // 5 saniye timeout
            });
            
            if (!result.ok) {
              // Silent fail - backend çalışmıyor olabilir
              continue;
            }
            
            const response = await result.json();
            logger.debug('Response received', { success: response.success, dataLength: response.data?.length, source: response.source, teamId: team.id }, 'API');
            
            if (response.success && response.data && response.data.length > 0) {
              allMatches.push(...response.data);
            }
          }
          
        } catch (err: any) {
          // Backend çalışmıyorsa sessizce devam et
          if (err.name !== 'AbortError' && !err.message?.includes('ERR_CONNECTION_REFUSED')) {
            // Sadece beklenmeyen hataları logla
          }
        }
      }

      // 🔥 CANLI MAÇLARI DA EKLE (bu eksikti!)
      if (liveMatchesFromAPI.length > 0) {
        logger.debug('Adding live matches from API', { count: liveMatchesFromAPI.length }, 'MATCHES');
        allMatches.push(...liveMatchesFromAPI);
      }

      // Remove duplicates (handle both fixture.id and id)
      const uniqueMatches = Array.from(
        new Map(allMatches.map(m => [m.fixture?.id || (m as any).id, m])).values()
      ).filter(m => {
        // Ensure match has required structure
        if (!m) return false;
        if (!m.fixture) {
          // Try to fix if it's in database format
          if ((m as any).id && (m as any).fixture_date) {
            // This should have been transformed by api.ts, but just in case
            return false; // Skip, let transform function handle it
          }
          return false;
        }
        return true;
      });
      
      logger.debug('Unique matches after deduplication', { 
        total: allMatches.length, 
        unique: uniqueMatches.length,
        duplicatesRemoved: allMatches.length - uniqueMatches.length
      }, 'MATCHES');
      
      // Filter favorite team matches (ID-based)
      const favoriteTeamIds = favoriteTeams.map(t => t.id);
      const favoriteMatches = uniqueMatches.filter(m => 
        favoriteTeamIds.includes(m.teams?.home?.id) || 
        favoriteTeamIds.includes(m.teams?.away?.id)
      );
      
      if (favoriteMatches.length > 0) {
        logger.debug('First 5 favorite team matches', {
          matches: favoriteMatches.slice(0, 5).map(m => ({
            teams: `${m.teams.home.name} (${m.teams.home.id}) vs ${m.teams.away.name} (${m.teams.away.id})`,
            status: m.fixture.status?.short || m.fixture.status,
            date: new Date(m.fixture.timestamp * 1000).toLocaleDateString('tr-TR'),
          }))
        }, 'MATCHES');
      }

      // Categorize matches
      const { past, live, upcoming } = categorizeMatches(uniqueMatches);
      
      // If no matches found, use mock data (without filtering by favorite teams)
      if (past.length === 0 && live.length === 0 && upcoming.length === 0) {
        logger.info('No favorite team matches found, using MOCK DATA', undefined, 'MATCHES');
        const mockMatches = await generateMockMatches();
        const categorized = categorizeMatches(mockMatches);
        setPastMatches(categorized.past);
        setLiveMatches(categorized.live);
        setUpcomingMatches(categorized.upcoming.slice(0, 10));
        logger.info(`Mock data loaded`, { past: categorized.past.length, live: categorized.live.length, upcoming: categorized.upcoming.length }, 'MATCHES');
      } else {
        setPastMatches(past);
        setLiveMatches(live);
        setUpcomingMatches(upcoming.slice(0, 10)); // Limit upcoming to 10 matches
        logger.info(`Matches loaded`, { past: past.length, live: live.length, upcoming: upcoming.length }, 'MATCHES');
        
        // 💾 Cache'e kaydet
        await saveToCache(past, live, upcoming.slice(0, 10));
        
        // Mark as successfully loaded
        if (past.length > 0 || live.length > 0 || upcoming.length > 0) {
          setHasLoadedOnce(true);
        }
      }

    } catch (err: any) {
      logger.error('Error fetching favorite team matches', { error: err, favoriteTeamsCount: favoriteTeams.length }, 'MATCHES');
      setError(err.message || 'Maçlar yüklenemedi');
    } finally {
      logger.debug('Fetch complete, setting loading=false', undefined, 'MATCHES');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip if no favorite teams
    if (!favoriteTeams || favoriteTeams.length === 0) {
      logger.debug('No favorite teams yet, skipping fetch', undefined, 'MATCHES');
      setLoading(false); // Stop loading if no teams
      return;
    }

    // 🚀 CACHE STRATEJİSİ: Önce cache'den yükle, sonra arka planda güncelle
    const initializeMatches = async () => {
      const cacheLoaded = await loadFromCache();
      
      if (cacheLoaded) {
        logger.debug('Cache loaded, fetching in background', undefined, 'MATCHES');
        // Cache'den yüklendi, arka planda güncelle (loading gösterme)
        fetchMatches();
      } else {
        logger.debug('No cache, fetching with loading', undefined, 'MATCHES');
        // Cache yok, loading göster
        setLoading(true);
        fetchMatches();
      }
    };

    // Only fetch ONCE on initial load
    if (!hasLoadedOnce) {
      initializeMatches();
    } else {
      logger.debug('Data already loaded, skipping fetch', undefined, 'MATCHES');
    }
  }, [favoriteTeams.length]); // Only re-run when team count changes

  // 🔥 AUTO-REFRESH: Backend'den her 12 saniyede güncelle
  useEffect(() => {
    if (!hasLoadedOnce) return; // İlk yükleme tamamlanana kadar bekleme
    
    const refreshInterval = setInterval(() => {
      logger.debug('AUTO-REFRESH: Fetching updates from backend', undefined, 'MATCHES');
      fetchMatches(); // Arka planda güncelle (loading gösterme)
    }, 12 * 1000); // 12 saniye
    
    return () => clearInterval(refreshInterval);
  }, [hasLoadedOnce, favoriteTeams.length]);

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
