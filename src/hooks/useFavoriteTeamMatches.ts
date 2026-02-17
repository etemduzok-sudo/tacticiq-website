// useFavoriteTeamMatches Hook - Get matches for favorite teams
// ✅ Bulk data cache entegrasyonu - anında yükleme desteği
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
// Mock data kaldırıldı - sadece gerçek API verisi kullanılıyor
import { logger } from '../utils/logger';
import { getAllBulkMatches, isBulkDataValid } from '../services/bulkDataService';
// 🧪 Mock test verileri
import { MOCK_TEST_ENABLED, getMockTestMatches, MOCK_MATCH_IDS, getNextMockMatchStartTime, logMockTestInfo } from '../data/mockTestData';

// Cache keys
const CACHE_KEY = 'tacticiq-matches-cache';
const CACHE_TIMESTAMP_KEY = 'tacticiq-matches-cache-timestamp';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 saat (ms)

// ✅ Mock canlı maç - her zaman "Oynanıyor" sekmesinde görünsün (test/demo için)
// useMatches.ts MOCK_MATCH_999999 ile SENKRON tutulmalı!
const MOCK_LIVE_MATCH: Match = {
  fixture: {
    id: 999999,
    date: new Date().toISOString(),
    timestamp: Math.floor(Date.now() / 1000) - 52 * 60, // 52. dakika
    status: { short: '2H', long: 'Second Half', elapsed: 52 }, // ✅ useMatches.ts ile aynı
    venue: { name: 'Mock Stadium' },
  },
  league: { id: 999, name: 'Mock League', country: 'TR', logo: null },
  teams: {
    home: { id: 9999, name: 'Mock Home Team', logo: null },
    away: { id: 9998, name: 'Mock Away Team', logo: null },
  },
  goals: { home: 5, away: 4 }, // ✅ useMatches.ts ile aynı
  score: {
    halftime: { home: 3, away: 2 }, // ✅ useMatches.ts ile aynı
    fulltime: { home: null, away: null },
  },
};

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

  // ✅ Dışarıdan geçilen favoriteTeams varsa onu kullan, yoksa hook'tan al
  // ⚠️ ÖNEMLİ: Bu tanımı yukarıya taşıdık çünkü loadFromCache ve useEffect'lerde kullanılıyor
  const { favoriteTeams: hookFavoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  const favoriteTeams = externalFavoriteTeams || hookFavoriteTeams;

  // 💾 Cache'den maçları yükle - ÖNCELİKLİ ve HIZLI
  const loadFromCache = useCallback(async (): Promise<boolean> => {
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
      
      // ✅ Tüm maçları birleştir ve güncel kategorileme mantığıyla yeniden kategorize et
      // Böylece eski cache formatı da doğru bölümlere ayrılır (canlı / yaklaşan / biten)
      const allCached = [...(past || []), ...(live || []), ...(upcoming || [])];
      const uniqueById = Array.from(
        new Map(allCached.map(m => [m.fixture?.id ?? (m as any).id, m])).values()
      ).filter((m): m is Match => !!m?.fixture);
      
      const favoriteTeamIds = favoriteTeams?.map(t => t.id) || [];
      const filterCachedMatches = (matches: Match[]) => {
        if (!matches || matches.length === 0) return [];
        if (favoriteTeamIds.length === 0) return matches;
        return matches.filter(m => {
          const matchId = m.fixture?.id || (m as any).id;
          // Mock maçlar (999999, GS-FB 888001, Real-Barça 888002) her zaman görünsün
          if (matchId === 999999 || matchId === MOCK_MATCH_IDS.GS_FB || matchId === MOCK_MATCH_IDS.REAL_BARCA) return true;
          return favoriteTeamIds.includes(m.teams?.home?.id) || 
                 favoriteTeamIds.includes(m.teams?.away?.id);
        });
      };
      
      const filteredMerged = filterCachedMatches(uniqueById);
      const { past: rePast, live: reLive, upcoming: reUpcoming } = categorizeMatches(filteredMerged);
      
      setPastMatches(rePast);
      setLiveMatches(reLive);
      setUpcomingMatches(reUpcoming);
      setHasLoadedOnce(true);
      setLoading(false); // ✅ Cache yüklenince loading'i kapat

      logger.info('⚡ Loaded from cache & re-categorized', {
        past: rePast.length,
        live: reLive.length,
        upcoming: reUpcoming.length,
        cachedTotal: allCached.length,
        ageMinutes: Math.round(cacheAge / 1000 / 60),
      }, 'CACHE');

      return true;
    } catch (error) {
      logger.error('Error loading cache', { error }, 'CACHE');
      return false;
    }
  }, [favoriteTeams]);
  
  // ✅ HIZLI BAŞLANGIÇ: Component mount olduğunda HEMEN cache'den yükle
  // Bu effect en önce çalışmalı - favoriteTeams beklenmeden
  // ✅ Bulk data cache'den de okur (offline mod desteği)
  useEffect(() => {
    if (cacheLoadedRef.current) return; // Sadece bir kez çalış
    cacheLoadedRef.current = true;
    
    const quickLoad = async () => {
      // ✅ Inline kategorileme fonksiyonu (PST = postponed, bitmiş değil!)
      const now = Date.now();
      const LIVE_STATUSES_QUICK = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
      const FINISHED_STATUSES_QUICK = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'ABD']; // ✅ PST kaldırıldı
      
      const categorizeQuick = (allCached: Match[]) => {
        const rePast: Match[] = [];
        const reLive: Match[] = [];
        const reUpcoming: Match[] = [];
        
        for (const match of allCached) {
          const status = match.fixture?.status?.short || '';
          const timestamp = (match.fixture?.timestamp || 0) * 1000;
          
          if (LIVE_STATUSES_QUICK.includes(status)) {
            reLive.push(match);
          } else if (FINISHED_STATUSES_QUICK.includes(status) || (status !== 'NS' && timestamp < now - 3 * 60 * 60 * 1000)) {
            rePast.push(match);
          } else {
            reUpcoming.push(match);
          }
        }
        
        rePast.sort((a, b) => (b.fixture?.timestamp || 0) - (a.fixture?.timestamp || 0));
        reUpcoming.sort((a, b) => (a.fixture?.timestamp || 0) - (b.fixture?.timestamp || 0));
        
        return { rePast, reLive, reUpcoming };
      };
      
      // ✅ 1. Önce standard cache'den dene (en hızlı)
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { past, live, upcoming } = JSON.parse(cachedData);
          const allCached = [...(past || []), ...(live || []), ...(upcoming || [])];
          
          if (allCached.length > 0) {
            const { rePast, reLive, reUpcoming } = categorizeQuick(allCached);
            
            setPastMatches(rePast);
            setLiveMatches(reLive);
            setUpcomingMatches(reUpcoming);
            setHasLoadedOnce(true);
            setLoading(false);
            logger.info('⚡ INSTANT cache load', { 
              total: allCached.length, 
              past: rePast.length, 
              live: reLive.length, 
              upcoming: reUpcoming.length 
            }, 'CACHE');
            return;
          }
        }
      } catch (e) {
        logger.debug('Quick cache load failed', { error: e }, 'CACHE');
      }
      
      // ✅ 2. Standard cache boşsa BULK cache'den dene (offline mod desteği)
      try {
        const teamIds = favoriteTeams?.map(t => t.id).filter(Boolean) || [];
        if (teamIds.length > 0) {
          const bulkValid = await isBulkDataValid(teamIds);
          if (bulkValid) {
            const bulkMatches = await getAllBulkMatches(teamIds);
            if (bulkMatches && bulkMatches.length > 0) {
              const { rePast, reLive, reUpcoming } = categorizeQuick(bulkMatches as Match[]);
              
              setPastMatches(rePast);
              setLiveMatches(reLive);
              setUpcomingMatches(reUpcoming);
              setHasLoadedOnce(true);
              setLoading(false);
              logger.info('⚡ INSTANT BULK cache load', { 
                total: bulkMatches.length, 
                past: rePast.length, 
                live: reLive.length, 
                upcoming: reUpcoming.length 
              }, 'BULK_CACHE');
              return;
            }
          }
        }
      } catch (e) {
        logger.debug('Bulk cache load failed', { error: e }, 'BULK_CACHE');
      }
      
      // Cache yoksa normal yüklemeyi bekle
      logger.debug('No instant cache, waiting for fetch', undefined, 'CACHE');
    };
    
    quickLoad();
  }, []); // ✅ Hiç dependency yok - sadece mount'ta çalış
  
  // ✅ Favori takımlar değiştiğinde maçları yeniden fetch et (yeni takım eklendiğinde VEYA değiştirildiğinde)
  const previousTeamIdsRef = useRef<string>('');
  useEffect(() => {
    if (!favoriteTeams || favoriteTeams.length === 0) {
      previousTeamIdsRef.current = '';
      return;
    }
    
    const currentTeamIds = favoriteTeams.map(t => t.id).sort().join(',');
    const previousTeamIds = previousTeamIdsRef.current;
    
    // İlk yükleme - ref'i kaydet ve çık
    if (!previousTeamIds) {
      previousTeamIdsRef.current = currentTeamIds;
      return;
    }
    
    // Takım ID'leri değişmediyse bir şey yapma
    if (currentTeamIds === previousTeamIds) {
      return;
    }
    
    // ✅ TAKIM DEĞİŞTİ: Hangi takımlar eklendi, hangileri çıkarıldı?
    const previousIds = previousTeamIds.split(',').map(id => parseInt(id, 10));
    const currentIds = currentTeamIds.split(',').map(id => parseInt(id, 10));
    const addedTeamIds = currentIds.filter(id => !previousIds.includes(id));
    const removedTeamIds = previousIds.filter(id => !currentIds.includes(id));
    
    logger.info('🔄 Favorite teams CHANGED!', { 
      addedTeams: addedTeamIds,
      removedTeams: removedTeamIds,
      previousCount: previousIds.length,
      currentCount: currentIds.length
    }, 'MATCHES');
    
    // ✅ Yeni takım eklendiyse: Cache'i temizle ve TÜM maçları yeniden fetch et
    if (addedTeamIds.length > 0) {
      logger.info('🆕 New teams added, clearing cache and fetching all matches...', { addedTeams: addedTeamIds }, 'MATCHES');
      clearMatchesCache().then(() => {
        fetchMatches();
      });
    } 
    // ✅ Sadece takım çıkarıldıysa: Mevcut maçları filtrele (cache temizleme gerekmez)
    else if (removedTeamIds.length > 0) {
      logger.info('🗑️ Teams removed, filtering existing matches...', { removedTeams: removedTeamIds }, 'MATCHES');
      const favoriteTeamIds = new Set(favoriteTeams.map(t => Number(t.id)));
      const filterMatches = (matches: Match[]) => {
        if (!matches || matches.length === 0) return [];
        return matches.filter(m => {
          const matchId = m.fixture?.id || (m as any).id;
          // Mock maçlar (999999, GS-FB 888001, Real-Barça 888002) her zaman görünsün
          if (matchId === 999999 || matchId === MOCK_MATCH_IDS.GS_FB || matchId === MOCK_MATCH_IDS.REAL_BARCA) return true;
          const homeId = m.teams?.home?.id != null ? Number(m.teams.home.id) : null;
          const awayId = m.teams?.away?.id != null ? Number(m.teams.away.id) : null;
          return (homeId != null && favoriteTeamIds.has(homeId)) || (awayId != null && favoriteTeamIds.has(awayId));
        });
      };
      
      setPastMatches(prev => filterMatches(prev));
      setLiveMatches(prev => filterMatches(prev));
      setUpcomingMatches(prev => filterMatches(prev));
    }
    
    previousTeamIdsRef.current = currentTeamIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteTeams?.map(t => t.id).sort().join(',') || '']); // ✅ Takım ID'leri değiştiğinde tetikle

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

    // Basit ve net kategorileme: önce status, sonra timestamp
    const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT'];
    const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC']; // ✅ ABD ve CANC eklendi
    const NOT_STARTED_STATUSES = ['NS', 'TBD', 'PST', 'SUSP']; // ✅ SUSP eklendi

    matches.forEach(match => {
      if (!match || !match.fixture) {
        return; // Skip invalid matches
      }

      const statusRaw = match.fixture.status;
      const status = typeof statusRaw === 'string'
        ? statusRaw
        : (statusRaw?.short ?? statusRaw?.long ?? 'NS');
      const matchTime = match.fixture.timestamp * 1000;
      const isFuture = matchTime > now;

      // 1) Canlı maçlar
      if (LIVE_STATUSES.includes(status)) {
        live.push(match);
        return;
      }

      // 2) Biten maçlar (skor belli)
      if (FINISHED_STATUSES.includes(status)) {
        past.push(match);
        return;
      }

      // 3) Henüz başlamamış veya bilinmeyen status → sadece zamana göre
      if (NOT_STARTED_STATUSES.includes(status) || !FINISHED_STATUSES.includes(status)) {
        if (isFuture) {
          upcoming.push(match);
        } else {
          past.push(match); // Geçmiş tarih = bitmiş/kaçırılmış say
        }
      }
    });

    // Sort: past (newest first), upcoming (soonest first)
    past.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
    upcoming.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    // ✅ Tüm planlı gelecek maçlar gösteriliyor (filtre yok - API'deki tüm gelecek maçlar)
    return { past, live, upcoming };
  };

  const fetchMatches = useCallback(async () => {
    logger.info('📡 fetchMatches started', { 
      teamsCount: favoriteTeams?.length || 0, 
      hasLoadedOnce,
      teamIds: favoriteTeams?.map(t => t.id) || [],
      teamNames: favoriteTeams?.map(t => t.name) || []
    }, 'MATCHES');
    
    try {
      // ✅ Sadece ilk yüklemede VE cache yoksa loading göster
      // Cache varsa arka planda sessizce güncelle
      if (!hasLoadedOnce && pastMatches.length === 0 && upcomingMatches.length === 0) {
        setLoading(true);
      }
      setError(null);

      if (!favoriteTeams || favoriteTeams.length === 0) {
        logger.warn('⚠️ No favorite teams to fetch matches for', undefined, 'MATCHES');
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
      const currentSeason = 2025; // Sadece mevcut sezon
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
        // Backend bağlantı hatası kontrolü (timeout dahil)
        if (err.message?.includes('Failed to fetch') || 
            err.message?.includes('NetworkError') || 
            err.message?.includes('ERR_CONNECTION_REFUSED') ||
            err.message?.includes('Backend bağlantısı') ||
            err.message?.includes('zaman aşımı') ||
            err.message?.includes('timed out') ||
            err.message?.includes('timeout') ||
            err.name === 'TimeoutError' ||
            err.name === 'AbortError') {
          backendConnectionError = true;
          logger.warn('Backend bağlantısı kurulamadı (live matches)', { error: err.message }, 'API');
        }
      }

      // ✅ PARALEL FETCH - Tüm takımlar aynı anda çekilir (5-6x daha hızlı!)
      logger.info('⚡ Fetching all teams in PARALLEL...', { 
        teamCount: favoriteTeams.length,
        teams: favoriteTeams.map(t => ({ id: t.id, name: t.name, type: t.type }))
      }, 'MATCHES');
      
      const fetchTeamMatches = async (team: FavoriteTeam): Promise<Match[]> => {
        if (!team || !team.id) {
          logger.warn('⚠️ Invalid team in fetchTeamMatches', { team }, 'MATCHES');
          return [];
        }
        
        logger.debug(`📥 Fetching matches for team: ${team.name} (${team.id})`, undefined, 'MATCHES');
        
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
                const fullUrl = `${api.getBaseUrl()}${url}`;
                logger.debug(`📥 Fetching ${team.name} season ${season} matches...`, { url: fullUrl }, 'MATCHES');
                const result = await fetch(fullUrl, {
                  headers: { 'Content-Type': 'application/json' },
                  signal: AbortSignal.timeout(25000)
                });
                if (result.ok) {
                  const response = await result.json();
                  logger.debug(`📥 ${team.name} season ${season} raw response`, { 
                    success: response.success, 
                    dataLength: response.data?.length || 0,
                    source: response.source,
                    hasData: !!response.data
                  }, 'MATCHES');
                  const matches = response.success && response.data ? response.data : [];
                  logger.debug(`✅ ${team.name} season ${season}: ${matches.length} matches`, undefined, 'MATCHES');
                  return matches;
                } else {
                  const errorText = await result.text();
                  logger.warn(`⚠️ ${team.name} season ${season}: HTTP ${result.status}`, { error: errorText }, 'MATCHES');
                  return [];
                }
              } catch (err: any) {
                logger.error(`❌ ${team.name} season ${season} fetch error`, { error: err.message, stack: err.stack }, 'MATCHES');
                // Timeout hatalarını yakala
                if (err.name === 'AbortError' || 
                    err.name === 'TimeoutError' ||
                    err.message?.includes('timed out') ||
                    err.message?.includes('timeout')) {
                  backendConnectionError = true;
                }
                return [];
              }
            });
            const seasonResults = await Promise.all(seasonPromises);
            seasonResults.forEach(matches => teamMatches.push(...matches));
          } else {
            // Kulüp takımı: Sadece mevcut sezon
            try {
              const url = `/matches/team/${team.id}/season/${currentSeason}`;
              const fullUrl = `${api.getBaseUrl()}${url}`;
              const result = await fetch(fullUrl, {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(25000)
              });
              if (result.ok) {
                const response = await result.json();
                if (response.success && response.data) {
                  const matches = Array.isArray(response.data) ? response.data : [];
                  teamMatches.push(...matches);
                  successfulFetches++;
                }
              }
            } catch (err: any) {
              logger.debug(`❌ ${team.name} season ${currentSeason} fetch error`, { error: (err as Error).message }, 'MATCHES');
              // Timeout hatalarını yakala
              if (err.name === 'AbortError' || 
                  err.name === 'TimeoutError' ||
                  err.message?.includes('timed out') ||
                  err.message?.includes('timeout')) {
                backendConnectionError = true;
              }
            }
          }
          
          return teamMatches;
        } catch (err: any) {
          // Timeout ve connection hatalarını yakala
          if (err.name === 'AbortError' || 
              err.name === 'TimeoutError' ||
              err.message?.includes('ERR_CONNECTION_REFUSED') ||
              err.message?.includes('timed out') ||
              err.message?.includes('timeout') ||
              err.message?.includes('zaman aşımı')) {
            backendConnectionError = true;
          }
          return [];
        }
      };
      
      // 🚀 Tüm takımları PARALEL olarak çek (bir takım hata verse bile diğerlerinin verisi kalsın)
      const teamMatchPromises = favoriteTeams.map(fetchTeamMatches);
      const settled = await Promise.allSettled(teamMatchPromises);
      
      settled.forEach((result, index) => {
        const team = favoriteTeams[index];
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          logger.debug(`✅ Team ${team.name} (${team.id}): ${result.value.length} matches`, undefined, 'MATCHES');
          allMatches.push(...result.value);
        } else {
          logger.warn(`⚠️ Team ${team.name} (${team.id}): fetch failed`, result.status === 'rejected' ? { reason: (result as PromiseRejectedResult).reason } : {}, 'MATCHES');
        }
      });
      
      logger.info('✅ All teams fetched', { 
        totalMatches: allMatches.length,
        teamsProcessed: favoriteTeams.length,
        matchesPerTeam: settled.map((result, i) => ({
          team: favoriteTeams[i]?.name || 'Unknown',
          count: result.status === 'fulfilled' && Array.isArray(result.value) ? result.value.length : 0
        }))
      }, 'MATCHES');

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
      
      // ✅ KRITIK: Sadece favori takımların maçlarını filtrele (ID-based, number/string güvenli)
      // Mock maç (ID: 999999) her zaman görünsün
      const favoriteTeamIds = favoriteTeams.map(t => Number(t.id));
      const favoriteIdSet = new Set(favoriteTeamIds);
      let favoriteMatchCount = 0;
      const favoriteMatches = uniqueMatches.filter(m => {
        const matchId = m.fixture?.id || (m as any).id;
        // Mock maçlar (999999, GS-FB 888001, Real-Barça 888002) her zaman görünsün
        if (matchId === 999999 || matchId === MOCK_MATCH_IDS.GS_FB || matchId === MOCK_MATCH_IDS.REAL_BARCA) {
          return true;
        }
        
        const homeId = m.teams?.home?.id != null ? Number(m.teams.home.id) : null;
        const awayId = m.teams?.away?.id != null ? Number(m.teams.away.id) : null;
        const isFavorite = (homeId != null && favoriteIdSet.has(homeId)) || (awayId != null && favoriteIdSet.has(awayId));
        
        // Log first few matches for debugging
        if (isFavorite && favoriteMatchCount < 3) {
          favoriteMatchCount++;
          logger.debug('✅ Favorite match found', {
            teams: `${m.teams?.home?.name} (${homeId}) vs ${m.teams?.away?.name} (${awayId})`,
            homeInFavorites: homeId != null && favoriteIdSet.has(homeId),
            awayInFavorites: awayId != null && favoriteIdSet.has(awayId)
          }, 'MATCHES');
        }
        
        return isFavorite;
      });
      
      logger.info('🔍 Favorite matches filtering', {
        totalUnique: uniqueMatches.length,
        favoriteTeamIds: favoriteTeamIds,
        favoriteTeamNames: favoriteTeams.map(t => t.name),
        afterFilter: favoriteMatches.length,
        filtered: uniqueMatches.length - favoriteMatches.length,
        sampleMatches: favoriteMatches.slice(0, 3).map(m => ({
          teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
          status: m.fixture?.status?.short
        }))
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
      
      // ✅ Gerçek veri yoksa - cache'deki maçları koru, sıfırlama!
      if (past.length === 0 && live.length === 0 && upcoming.length === 0) {
        logger.info('⚠️ No favorite team matches found from API', undefined, 'MATCHES');
        
        // ✅ Backend bağlantı hatası varsa cache'deki maçları koru, sıfırlama!
        if (backendConnectionError && successfulFetches === 0) {
          // Cache'den yüklenen maçlar varsa onları koru
          if (hasLoadedOnce) {
            logger.info('✅ Keeping cached matches (backend unavailable)', undefined, 'MATCHES');
            // Cache'deki maçları koru - setPastMatches, setLiveMatches, setUpcomingMatches çağırma
            setError(null); // Hata mesajını temizle, cache'den maçlar gösteriliyor
          } else {
            // Cache yoksa hata göster
            setError('Backend sunucusuna bağlanılamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
          }
        } else {
          // Backend hatası yoksa ama maç yoksa, cache'deki maçları koru
          if (hasLoadedOnce) {
            logger.info('✅ Keeping cached matches (no new matches from API)', undefined, 'MATCHES');
            setError(null);
          } else {
            // Cache yoksa ve API'den de maç yoksa boş göster
            setPastMatches([]);
            setLiveMatches([]);
            setUpcomingMatches([]);
          }
        }
      } else {
        setPastMatches(past);
        setLiveMatches(live);
        setUpcomingMatches(upcoming); // Tüm gelecek maçlar (limit yok)
        if (!hasLoadedOnce) {
          logger.info(`Matches loaded`, { past: past.length, live: live.length, upcoming: upcoming.length }, 'MATCHES');
        }
        await saveToCache(past, live, upcoming);
        
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
  }, [favoriteTeams, hasLoadedOnce, pastMatches.length, upcomingMatches.length]); // ✅ Dependencies eklendi

  // ✅ Favori takım ID'lerini string olarak takip et (değişiklik algılama için)
  const favoriteTeamIdsString = useMemo(() => {
    if (!favoriteTeams || favoriteTeams.length === 0) return '';
    return favoriteTeams.map(t => t.id).sort().join(',');
  }, [favoriteTeams]);

  // 🔴 CANLI MAÇ GÜNCELLEMESİ: Sadece /live endpoint'i, her 13 saniyede (dakika + biten maçlar hemen "Biten"e geçsin)
  const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC']; // ✅ ABD ve CANC eklendi
  const LIVE_POLL_INTERVAL_MS = 13 * 1000;
  const fetchLiveOnly = useCallback(async () => {
    try {
      const res = await api.matches.getLiveMatches();
      const newLiveRaw = (res?.data || []) as Match[];
      const favIds = favoriteTeams?.map(t => t.id) ?? [];
      const byFav = favIds.length === 0 ? newLiveRaw : newLiveRaw.filter(
        m => favIds.includes(m.teams?.home?.id) || favIds.includes(m.teams?.away?.id)
      );
      const statusShort = (m: Match) => typeof m.fixture?.status === 'string' ? m.fixture.status : (m.fixture?.status?.short ?? '');
      // Sadece gerçekten canlı olanları tut (FT/AET/PEN değil, uzatmalar olabilir - 90+ dakika kontrolü yok)
      const newLive = byFav.filter(m => {
        if (FINISHED_STATUSES.includes(statusShort(m))) return false; // FT/AET/PEN → bitmiş
        return LIVE_STATUSES.includes(statusShort(m)); // 1H/2H/ET/P/BT/LIVE → canlı (uzatmalar dahil)
      });
      const nowFinishedFromApi = byFav.filter(m => FINISHED_STATUSES.includes(statusShort(m)));
      setLiveMatches(prev => {
        const newIds = new Set(newLive.map(m => m.fixture?.id));
        // Listede artık yok VEYA status FT/AET/PEN ise bitmiş say (uzatmalar için 90+ kontrolü yok)
        const noLongerInLive = prev.filter(m => {
          if (!newIds.has(m.fixture?.id)) return true; // API'den gelen live listesinde yok → bitmiş
          const s = statusShort(m);
          if (FINISHED_STATUSES.includes(s)) return true; // Status FT/AET/PEN → bitmiş
          return false;
        });
        const asPast = [
          ...noLongerInLive.map(m => ({
            ...m,
            fixture: {
              ...m.fixture,
              status: { ...(m.fixture?.status || {}), short: 'FT' as const, long: 'Full Time', elapsed: (m.fixture?.status && typeof m.fixture.status === 'object' && 'elapsed' in m.fixture.status) ? (m.fixture.status as { elapsed?: number }).elapsed : undefined },
            },
          })),
          ...nowFinishedFromApi,
        ] as Match[];
        if (asPast.length > 0) setPastMatches(p => [...asPast, ...p]);
        return newLive;
      });
    } catch (_) {
      // Sessizce yoksay (ağ/backend geçici hata)
    }
  }, [favoriteTeams]);

  // ✅ Sadece favori takım ID'leri değiştiğinde fetch yap (teamsLoading ile tekrara girme)
  useEffect(() => {
    if (!favoriteTeamIdsString) {
      setPastMatches([]);
      setLiveMatches([]);
      setUpcomingMatches([]);
      setLoading(false);
      return;
    }
    if (teamsLoading && !externalFavoriteTeams) return;
    if (!favoriteTeams || favoriteTeams.length === 0) return;

    if (!hasLoadedOnce) setLoading(true);
    fetchMatches();
  }, [favoriteTeamIdsString]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔴 Canlı maç varken hemen + her 13 saniyede live endpoint'ini güncelle (biten maçlar "Biten"e taşınsın)
  useEffect(() => {
    if (!hasLoadedOnce || !favoriteTeamIdsString || liveMatches.length === 0) return;
    fetchLiveOnly(); // İlk güncelleme hemen (13 sn bekleme)
    const t = setInterval(fetchLiveOnly, LIVE_POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [hasLoadedOnce, favoriteTeamIdsString, liveMatches.length, fetchLiveOnly]);

  // 🔥 Genel güncelleme: Backend'den her 60 saniyede tam fetch (takım maçları + live)
  useEffect(() => {
    if (!hasLoadedOnce || !favoriteTeamIdsString) return;
    const t = setInterval(() => fetchMatches(), 60 * 1000);
    return () => clearInterval(t);
  }, [hasLoadedOnce, favoriteTeamIdsString]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Mock canlı maçı her zaman liveMatches'a ekle (henüz yoksa)
  const liveMatchesWithMock = useMemo(() => {
    const hasMock = liveMatches.some(m => (m.fixture?.id || (m as any).id) === 999999);
    if (hasMock) return liveMatches;
    return [MOCK_LIVE_MATCH, ...liveMatches];
  }, [liveMatches]);

  // 🧪 MOCK TEST: Mock test maçlarını enjekte et + canlıya geçiş timer'ı
  const [mockTestTick, setMockTestTick] = useState(0);

  // 🧪 Mock test bilgisini logla ve hasLoadedOnce'ı true yap (ilk mount'ta)
  useEffect(() => {
    if (MOCK_TEST_ENABLED) {
      logMockTestInfo();
      // Mock test aktifken loading'i kapat ki mock maçlar görünsün
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    }
  }, []);

  // 🧪 Mock test timer: Her 5 saniyede mock maçların durumunu kontrol et
  useEffect(() => {
    if (!MOCK_TEST_ENABLED) return;
    const interval = setInterval(() => {
      setMockTestTick(prev => prev + 1);
    }, 5000); // 5 saniyede bir güncelle (hem geri sayım hem canlı skor güncellemesi için)
    return () => clearInterval(interval);
  }, []);

  // 🧪 Mock test maçlarını upcoming, live ve past listelerine enjekte et
  const { finalUpcoming, finalLive, finalPast } = useMemo(() => {
    if (!MOCK_TEST_ENABLED) {
      return { finalUpcoming: upcomingMatches, finalLive: liveMatchesWithMock, finalPast: pastMatches };
    }

    // Her tick'te güncel mock veri al (status dinamik olarak değişir)
    const _tick = mockTestTick; // dependency olarak kullan
    const mockMatches = getMockTestMatches();
    
    const mockUpcoming: Match[] = [];
    const mockLive: Match[] = [];
    const mockPast: Match[] = [];

    for (const mock of mockMatches) {
      const status = mock.fixture?.status?.short || 'NS';
      if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status)) {
        mockLive.push(mock as Match);
      } else if (status === 'NS') {
        mockUpcoming.push(mock as Match);
      } else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(status)) {
        // ✅ Biten maçları past listesine ekle
        mockPast.push(mock as Match);
      }
    }

    // Mock ID'leri olan maçları mevcut listelerden çıkar (duplikasyon önleme)
    const mockIds = new Set([MOCK_MATCH_IDS.GS_FB, MOCK_MATCH_IDS.REAL_BARCA]);
    const cleanUpcoming = upcomingMatches.filter(m => !mockIds.has(m.fixture?.id));
    const cleanLive = liveMatchesWithMock.filter(m => !mockIds.has(m.fixture?.id));
    const cleanPast = pastMatches.filter(m => !mockIds.has(m.fixture?.id));

    return {
      finalUpcoming: [...mockUpcoming, ...cleanUpcoming],
      finalLive: [...mockLive, ...cleanLive],
      finalPast: [...mockPast, ...cleanPast], // ✅ Biten mock maçları en üste ekle (en yeni önce)
    };
  }, [upcomingMatches, liveMatchesWithMock, pastMatches, mockTestTick]);

  return {
    pastMatches: finalPast, // ✅ Mock maçlar dahil biten maçlar
    liveMatches: finalLive,
    upcomingMatches: finalUpcoming,
    loading,
    error,
    refetch: fetchMatches,
    hasLoadedOnce, // Return flag to prevent flickering
  };
}
