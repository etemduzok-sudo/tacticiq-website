// useFavoriteTeamMatches Hook - Get matches for favorite teams
import React, { useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
// Mock data kaldırıldı - sadece gerçek API verisi kullanılıyor
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

interface FavoriteTeam {
  id: number;
  name: string;
  logo?: string;
  league?: string;
  colors?: string[];
  type?: 'club' | 'national';
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

// ✅ Dışarıdan favoriteTeams alabilir veya kendi hook'unu kullanabilir
export function useFavoriteTeamMatches(externalFavoriteTeams?: FavoriteTeam[]): UseFavoriteTeamMatchesResult {
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true); // ✅ Başlangıçta true - cache yüklenene kadar
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track if we've successfully loaded data
  const cacheLoadedRef = useRef(false); // ✅ Cache yüklenip yüklenmediğini takip et

  // 💾 Cache'den maçları yükle - ÖNCELİKLİ ve HIZLI
  const loadFromCache = async (): Promise<boolean> => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (!cachedData || !cacheTimestamp) {
        logger.debug('No cache found', undefined, 'CACHE');
        return false;
      }

      const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
      // ✅ Cache süresi 24 saate çıkarıldı - açılışta hızlı yükleme için
      const isCacheUsable = cacheAge < 24 * 60 * 60 * 1000; // 24 saat

      if (!isCacheUsable) {
        logger.debug('Cache too old', { ageMinutes: Math.round(cacheAge / 1000 / 60) }, 'CACHE');
        return false;
      }

      const { past, live, upcoming } = JSON.parse(cachedData);
      setPastMatches(past || []);
      setLiveMatches(live || []);
      setUpcomingMatches(upcoming || []);
      setHasLoadedOnce(true);
      setLoading(false); // ✅ Cache yüklenince loading'i kapat

      logger.info('⚡ Loaded from cache instantly', {
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
  
  // ✅ HIZLI BAŞLANGIÇ: Component mount olduğunda HEMEN cache'den yükle
  useEffect(() => {
    if (cacheLoadedRef.current) return; // Sadece bir kez çalış
    cacheLoadedRef.current = true;
    
    const quickLoad = async () => {
      const cacheLoaded = await loadFromCache();
      if (!cacheLoaded) {
        // Cache yoksa loading'i göstermeye devam et
        logger.debug('No cache available, waiting for fetch', undefined, 'CACHE');
      }
    };
    
    quickLoad();
  }, []);

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

  // ✅ Mock data fonksiyonu kaldırıldı - sadece gerçek API verisi kullanılıyor
  
  // ✅ Dışarıdan geçilen favoriteTeams varsa onu kullan, yoksa hook'tan al
  const { favoriteTeams: hookFavoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  const favoriteTeams = externalFavoriteTeams || hookFavoriteTeams;
  
  // 🔍 DEBUG: Hook state kontrolü
  logger.debug('useFavoriteTeamMatches state', { 
    externalTeamsCount: externalFavoriteTeams?.length || 0,
    hookTeamsCount: hookFavoriteTeams.length,
    finalTeamsCount: favoriteTeams.length,
    teamsLoading,
    hasLoadedOnce,
    loading
  }, 'MATCHES');

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
    logger.info('📡 fetchMatches started', { teamsCount: favoriteTeams.length, hasLoadedOnce }, 'MATCHES');
    
    try {
      // ✅ Sadece ilk yüklemede VE cache yoksa loading göster
      // Cache varsa arka planda sessizce güncelle
      if (!hasLoadedOnce && pastMatches.length === 0 && upcomingMatches.length === 0) {
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
      let backendConnectionError = false; // Backend bağlantı hatası flag'i
      let successfulFetches = 0; // Başarılı fetch sayısı
      
      // Fetch live matches separately (we'll filter for favorite teams later)
      logger.info('🔴 Fetching live matches...', undefined, 'MATCHES');
      try {
        const liveResponse = await api.matches.getLiveMatches();
        logger.info('✅ Live matches response', { success: liveResponse.success, count: liveResponse.data?.length || 0 }, 'MATCHES');
        if (liveResponse.success && liveResponse.data) {
          liveMatchesFromAPI.push(...liveResponse.data);
          successfulFetches++;
        }
      } catch (err: any) {
        logger.error('❌ Live matches fetch error', { error: err.message }, 'MATCHES');
        // Backend bağlantı hatası kontrolü
        if (err.message?.includes('Failed to fetch') || 
            err.message?.includes('NetworkError') || 
            err.message?.includes('ERR_CONNECTION_REFUSED') ||
            err.message?.includes('Backend bağlantısı')) {
          backendConnectionError = true;
          logger.warn('Backend bağlantısı kurulamadı (live matches)', { error: err.message }, 'API');
        }
      }

      // ✅ PARALEL FETCH - Tüm takımlar aynı anda çekilir (5-6x daha hızlı!)
      logger.info('⚡ Fetching all teams in PARALLEL...', { teamCount: favoriteTeams.length }, 'MATCHES');
      
      const fetchTeamMatches = async (team: FavoriteTeam): Promise<Match[]> => {
        if (!team || !team.id) return [];
        
        try {
          const nationalTeamIds = [777, 25, 6, 26];
          const isNationalTeam = nationalTeamIds.includes(team.id) ||
                                 team.league === 'UEFA' || 
                                 team.league === 'CONMEBOL' || 
                                 team.name === 'Türkiye' || 
                                 team.name === 'Almanya' || 
                                 team.name === 'Brezilya' || 
                                 team.name === 'Arjantin' ||
                                 (team as any).type === 'national';
          
          const teamMatches: Match[] = [];
          
          if (isNationalTeam) {
            // Milli takım: Paralel olarak 3 sezonu çek
            const nationalSeasons = [2024, 2025, 2026];
            const seasonPromises = nationalSeasons.map(async (season) => {
              try {
                const url = `/matches/team/${team.id}/season/${season}`;
                const result = await fetch(`${api.getBaseUrl()}${url}`, {
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(15000)
                });
                if (result.ok) {
                  const response = await result.json();
                  return response.success && response.data ? response.data : [];
                }
                return [];
              } catch {
                return [];
              }
            });
            const seasonResults = await Promise.all(seasonPromises);
            seasonResults.forEach(matches => teamMatches.push(...matches));
          } else {
            // Kulüp takımı: Sadece güncel sezon
            try {
              const url = `/matches/team/${team.id}/season/${currentSeason}`;
              const result = await fetch(`${api.getBaseUrl()}${url}`, {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000)
              });
              if (result.ok) {
                const response = await result.json();
                if (response.success && response.data) {
                  teamMatches.push(...response.data);
                  successfulFetches++;
                }
              }
            } catch {
              // Silent fail
            }
          }
          
          return teamMatches;
        } catch (err: any) {
          if (err.name === 'AbortError' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
            backendConnectionError = true;
          }
          return [];
        }
      };
      
      // 🚀 Tüm takımları PARALEL olarak çek
      const teamMatchPromises = favoriteTeams.map(fetchTeamMatches);
      const teamMatchResults = await Promise.all(teamMatchPromises);
      teamMatchResults.forEach(matches => allMatches.push(...matches));
      
      logger.info('✅ All teams fetched', { totalMatches: allMatches.length }, 'MATCHES');

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
      
      // ✅ KRITIK: Sadece favori takımların maçlarını filtrele (ID-based)
      const favoriteTeamIds = favoriteTeams.map(t => t.id);
      const favoriteMatches = uniqueMatches.filter(m => 
        favoriteTeamIds.includes(m.teams?.home?.id) || 
        favoriteTeamIds.includes(m.teams?.away?.id)
      );
      
      logger.debug('Favorite matches filtering', {
        totalUnique: uniqueMatches.length,
        favoriteTeamIds: favoriteTeamIds,
        afterFilter: favoriteMatches.length,
        filtered: uniqueMatches.length - favoriteMatches.length
      }, 'MATCHES');
      
      if (favoriteMatches.length > 0) {
        logger.debug('First 5 favorite team matches', {
          matches: favoriteMatches.slice(0, 5).map(m => ({
            teams: `${m.teams.home.name} (${m.teams.home.id}) vs ${m.teams.away.name} (${m.teams.away.id})`,
            status: m.fixture.status?.short || m.fixture.status,
            date: new Date(m.fixture.timestamp * 1000).toLocaleDateString('tr-TR'),
          }))
        }, 'MATCHES');
      }

      // ✅ KRITIK FIX: Kategorize sadece FAVORİ TAKIMLARIN maçlarını yap
      // ÖNCEKİ HATA: uniqueMatches kullanılıyordu, favoriteMatches olmalı!
      logger.info('🔄 Categorizing matches...', { favoriteMatchesCount: favoriteMatches.length }, 'MATCHES');
      const { past, live, upcoming } = categorizeMatches(favoriteMatches);
      logger.info('📊 Categorized results', { past: past.length, live: live.length, upcoming: upcoming.length }, 'MATCHES');
      
      // ✅ Gerçek veri yoksa boş göster - MOCK DATA KULLANMA
      if (past.length === 0 && live.length === 0 && upcoming.length === 0) {
        logger.info('⚠️ No favorite team matches found from API', undefined, 'MATCHES');
        setPastMatches([]);
        setLiveMatches([]);
        setUpcomingMatches([]);
        
        // Backend bağlantı hatası varsa kullanıcıya bildir
        if (backendConnectionError && successfulFetches === 0) {
          setError('Backend sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
        }
        // Mock data kullanmıyoruz - gerçek veri bekliyoruz
      } else {
        setPastMatches(past);
        setLiveMatches(live);
        setUpcomingMatches(upcoming.slice(0, 10)); // Limit upcoming to 10 matches
        // Sadece ilk yüklemede veya değişiklik olduğunda logla
        if (!hasLoadedOnce) {
          logger.info(`Matches loaded`, { past: past.length, live: live.length, upcoming: upcoming.length }, 'MATCHES');
        }
        
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

  // ✅ Favori takım ID'lerini string olarak takip et (değişiklik algılama için)
  const favoriteTeamIdsString = useMemo(() => {
    return favoriteTeams.map(t => t.id).sort().join(',');
  }, [favoriteTeams]);

  useEffect(() => {
    logger.info('useEffect triggered', { 
      favoriteTeamIdsString, 
      teamsCount: favoriteTeams.length,
      teamsLoading 
    }, 'MATCHES');
    
    // Skip if no favorite teams
    if (!favoriteTeams || favoriteTeams.length === 0) {
      logger.debug('No favorite teams yet, skipping fetch', undefined, 'MATCHES');
      setPastMatches([]);
      setLiveMatches([]);
      setUpcomingMatches([]);
      setLoading(false); // Stop loading if no teams
      return;
    }

    // 🚀 Arka planda fetch yap - cache zaten yüklendi
    logger.info('🚀 Starting background match fetch', { 
      teamsCount: favoriteTeams.length, 
      teamIds: favoriteTeamIdsString,
      hasLoadedOnce 
    }, 'MATCHES');
    
    // ✅ Sadece cache yoksa loading göster (hasLoadedOnce false ise)
    if (!hasLoadedOnce) {
      setLoading(true);
    }
    
    // ✅ Arka planda fetch - cache varsa kullanıcı beklemez
    fetchMatches();
  }, [favoriteTeamIdsString]); // ✅ Takım ID'leri değiştiğinde yeniden fetch yap

  // 🔥 AUTO-REFRESH: Backend'den her 30 saniyede güncelle (performans için artırıldı)
  useEffect(() => {
    if (!hasLoadedOnce) return; // İlk yükleme tamamlanana kadar bekleme
    
    const refreshInterval = setInterval(() => {
      // Sessiz güncelleme - her seferinde log basma
      fetchMatches();
    }, 30 * 1000); // 30 saniye (12'den artırıldı - daha az API çağrısı)
    
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
