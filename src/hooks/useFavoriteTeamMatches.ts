// useFavoriteTeamMatches Hook - Get matches for favorite teams
// ✅ Bulk data cache entegrasyonu - anında yükleme desteği
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFavoriteTeams } from './useFavoriteTeams';
import { logger } from '../utils/logger';
import { getAllBulkMatches, isBulkDataValid } from '../services/bulkDataService';

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
  hasLoadedOnce: boolean;
}

// ✅ Veri formatını normalize et - backend bazen DB formatında (home_team, away_team),
// bazen API formatında (teams.home, teams.away) döndürüyor
function normalizeMatchFormat(raw: any): Match | null {
  if (!raw) return null;
  
  // Zaten API formatındaysa (fixture + teams var)
  if (raw.fixture && raw.teams?.home?.id != null) {
    return raw as Match;
  }
  
  // DB formatından API formatına dönüştür
  const fixtureId = raw.fixture?.id || raw.id || raw.source_match_id;
  if (!fixtureId) return null;
  
  const homeTeam = raw.teams?.home || raw.home_team || { id: raw.home_team_id, name: null, logo: null };
  const awayTeam = raw.teams?.away || raw.away_team || { id: raw.away_team_id, name: null, logo: null };
  
  // fixture.status normalize
  let status = raw.fixture?.status;
  if (!status || typeof status === 'string') {
    status = {
      short: (typeof raw.fixture?.status === 'string' ? raw.fixture.status : null) || raw.status || 'NS',
      long: raw.status_long || 'Not Started',
      elapsed: raw.elapsed || raw.fixture?.status?.elapsed || null,
    };
  }
  
  const timestamp = raw.fixture?.timestamp 
    || raw.fixture_timestamp 
    || (raw.fixture?.date ? new Date(raw.fixture.date).getTime() / 1000 : 0)
    || (raw.fixture_date ? new Date(raw.fixture_date).getTime() / 1000 : 0);

  return {
    fixture: {
      id: fixtureId,
      date: raw.fixture?.date || raw.fixture_date || new Date().toISOString(),
      timestamp,
      status,
    },
    league: raw.league || { id: raw.league_id, name: null, country: null, logo: null },
    teams: {
      home: { id: homeTeam.id || homeTeam.api_football_id, name: homeTeam.name, logo: homeTeam.logo },
      away: { id: awayTeam.id || awayTeam.api_football_id, name: awayTeam.name, logo: awayTeam.logo },
    },
    goals: raw.goals || { home: raw.home_score ?? null, away: raw.away_score ?? null },
    score: raw.score || {
      halftime: { home: raw.halftime_home ?? null, away: raw.halftime_away ?? null },
      fulltime: { home: raw.fulltime_home ?? raw.home_score ?? null, away: raw.fulltime_away ?? raw.away_score ?? null },
    },
  } as Match;
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
  const { favoriteTeams: hookFavoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  const favoriteTeams = externalFavoriteTeams || hookFavoriteTeams;
  
  // ✅ Güncel favoriteTeams referansı - closure stale olmaması için
  const favoriteTeamsRef = useRef(favoriteTeams);
  useEffect(() => {
    favoriteTeamsRef.current = favoriteTeams;
  }, [favoriteTeams]);

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
          const homeId = m.teams?.home?.id;
          const awayId = m.teams?.away?.id;
          return favoriteTeamIds.includes(homeId) || favoriteTeamIds.includes(awayId);
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
      
      // ✅ TEMİZ KATEGORİLEME: Sadece API statüsüne güven, varsayım yapma
      const categorizeQuick = (allCached: Match[]) => {
        const rePast: Match[] = [];
        const reLive: Match[] = [];
        const reUpcoming: Match[] = [];
        
        for (const match of allCached) {
          const status = match.fixture?.status?.short || '';
          const timestamp = (match.fixture?.timestamp || 0) * 1000;
          const isFuture = timestamp > now;
          
          if (LIVE_STATUSES_QUICK.includes(status)) {
            reLive.push(match);
          } else if (FINISHED_STATUSES_QUICK.includes(status)) {
            rePast.push(match);
          } else if (isFuture) {
            reUpcoming.push(match);
          } else {
            // Geçmiş ama NS - backend güncelleme yapana kadar upcoming'de tut
            // (Backend fixture ID bazlı polling ile güncelleyecek)
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
    
    // ✅ Yeni takım eklendiyse: Ref'i güncelle, cache'i temizle ve TÜM maçları yeniden fetch et
    if (addedTeamIds.length > 0) {
      logger.info('🆕 New teams added, clearing cache and fetching all matches...', { addedTeams: addedTeamIds }, 'MATCHES');
      // ✅ KRITIK: Ref'i hemen güncelle - fetchMatches ref'ten okuyacak
      favoriteTeamsRef.current = favoriteTeams;
      setLoading(true);
      clearMatchesCache().then(async () => {
        await fetchMatches();
        // ✅ Canlı maçları da hemen kontrol et (yeni takımın canlı maçı olabilir)
        fetchLiveOnly();
      });
    } 
    // ✅ Sadece takım çıkarıldıysa: Mevcut maçları filtrele (cache temizleme gerekmez)
    else if (removedTeamIds.length > 0) {
      logger.info('🗑️ Teams removed, filtering existing matches...', { removedTeams: removedTeamIds }, 'MATCHES');
      const favoriteTeamIds = new Set(favoriteTeams.map(t => Number(t.id)));
      const filterMatches = (matches: Match[]) => {
        if (!matches || matches.length === 0) return [];
        return matches.filter(m => {
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

  // ✅ TEMİZ KATEGORİLEME: Sadece API statüsüne güven, varsayım yapma
  // Backend fixture ID bazlı polling ile stale NS maçları güncelleyecek
  const categorizeMatches = (matches: Match[]) => {
    if (!matches || matches.length === 0) {
      return { past: [], live: [], upcoming: [] };
    }

    const now = Date.now();
    const past: Match[] = [];
    const live: Match[] = [];
    const upcoming: Match[] = [];

    const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT'];
    const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC'];
    // Maç başlama saati geçti ama API/DB hâlâ NS döndürüyorsa bu süre içinde "Oynanıyor"da göster (yaklaşık maç süresi + uzatma)
    const MAX_LIVE_WINDOW_MS = 3.5 * 60 * 60 * 1000;

    matches.forEach(match => {
      if (!match || !match.fixture) {
        return;
      }

      const statusRaw = match.fixture.status;
      const status = typeof statusRaw === 'string'
        ? statusRaw
        : (statusRaw?.short ?? statusRaw?.long ?? 'NS');
      const matchTime = match.fixture.timestamp * 1000;
      const isFuture = matchTime > now;
      const startedAgo = now - matchTime;
      const withinLiveWindow = startedAgo >= 0 && startedAgo <= MAX_LIVE_WINDOW_MS;

      // 1) Canlı maçlar (API'den gelen kesin canlı statü)
      if (LIVE_STATUSES.includes(status)) {
        live.push(match);
        return;
      }

      // 2) Biten maçlar (API'den gelen kesin bitmiş statü)
      if (FINISHED_STATUSES.includes(status)) {
        past.push(match);
        return;
      }

      // 3) Henüz başlamamış → yaklaşan
      if (isFuture) {
        upcoming.push(match);
        return;
      }

      // 4) Başlama saati geçmiş ama statü hâlâ NS/TBD → "Oynanıyor"da göster (API 1H/2H/FT dönene kadar)
      if (withinLiveWindow) {
        live.push(match);
      } else {
        // Çok eski ve hâlâ NS → Biten'e SADECE API FT döndüğünde geçecek, süreyle değil. Şimdilik yaklaşanda bırak.
        upcoming.push(match);
      }
    });

    past.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
    upcoming.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    return { past, live, upcoming };
  };

  const fetchMatches = useCallback(async () => {
    // ✅ Her zaman en güncel favoriteTeams'i kullan (stale closure önleme)
    const teams = favoriteTeamsRef.current;
    
    logger.info('📡 fetchMatches started', { 
      teamsCount: teams?.length || 0, 
      hasLoadedOnce,
      teamIds: teams?.map(t => t.id) || [],
      teamNames: teams?.map(t => t.name) || []
    }, 'MATCHES');
    
    try {
      if (!hasLoadedOnce && pastMatches.length === 0 && upcomingMatches.length === 0) {
        setLoading(true);
      }
      setError(null);

      if (!teams || teams.length === 0) {
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
          const normalizedLive = (liveResponse.data as any[]).map(m => normalizeMatchFormat(m)).filter(Boolean) as Match[];
          liveMatchesFromAPI.push(...normalizedLive);
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
        teamCount: teams.length,
        teams: teams.map(t => ({ id: t.id, name: t.name, type: t.type }))
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
          
          return teamMatches.map(m => normalizeMatchFormat(m)).filter(Boolean) as Match[];
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
      const teamMatchPromises = teams.map(fetchTeamMatches);
      const settled = await Promise.allSettled(teamMatchPromises);
      
      settled.forEach((result, index) => {
        const team = teams[index];
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          logger.debug(`✅ Team ${team.name} (${team.id}): ${result.value.length} matches`, undefined, 'MATCHES');
          allMatches.push(...result.value);
        } else {
          logger.warn(`⚠️ Team ${team.name} (${team.id}): fetch failed`, result.status === 'rejected' ? { reason: (result as PromiseRejectedResult).reason } : {}, 'MATCHES');
        }
      });
      
      logger.info('✅ All teams fetched', { 
        totalMatches: allMatches.length,
        teamsProcessed: teams.length,
        matchesPerTeam: settled.map((result, i) => ({
          team: teams[i]?.name || 'Unknown',
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
      const favoriteTeamIds = teams.map(t => Number(t.id));
      const favoriteIdSet = new Set(favoriteTeamIds);
      let favoriteMatchCount = 0;
      const favoriteMatches = uniqueMatches.filter(m => {
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
        favoriteTeamNames: teams.map(t => t.name),
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
        
        // ✅ İlk yüklemeden sonra HEMEN canlı maçları da çek
        // Bu, cache'den NS ile gelen ama gerçekte canlı olan maçları yakalar
        console.log('🔴 fetchMatches tamamlandı, fetchLiveOnly çağrılıyor...');
        
        // ✅ DEBUG: Juventus maçlarını logla
        const allMatches = [...past, ...live, ...upcoming];
        const juvMatches = allMatches.filter(m => {
          const home = (m.teams?.home?.name || '').toLowerCase();
          const away = (m.teams?.away?.name || '').toLowerCase();
          return home.includes('juve') || away.includes('juve');
        });
        console.log('🔴 Juventus maçları (tüm kategoriler):', juvMatches.map(m => ({
          id: m.fixture?.id,
          home: m.teams?.home?.name,
          homeId: m.teams?.home?.id,
          away: m.teams?.away?.name,
          awayId: m.teams?.away?.id,
          status: m.fixture?.status?.short,
          timestamp: m.fixture?.timestamp,
          date: new Date((m.fixture?.timestamp || 0) * 1000).toLocaleString(),
          category: past.includes(m) ? 'past' : live.includes(m) ? 'live' : 'upcoming'
        })));
        
        setTimeout(() => {
          fetchLiveOnly();
        }, 100); // Küçük delay - state'lerin yerleşmesi için
      }

    } catch (err: any) {
      logger.error('Error fetching favorite team matches', { error: err, favoriteTeamsCount: teams.length }, 'MATCHES');
      setError(err.message || 'Maçlar yüklenemedi');
    } finally {
      logger.debug('Fetch complete, setting loading=false', undefined, 'MATCHES');
      setLoading(false);
    }
  }, [hasLoadedOnce, pastMatches.length, upcomingMatches.length]); // ✅ favoriteTeams çıkarıldı, ref kullanılıyor

  // ✅ Favori takım ID'lerini string olarak takip et (değişiklik algılama için)
  const favoriteTeamIdsString = useMemo(() => {
    if (!favoriteTeams || favoriteTeams.length === 0) return '';
    return favoriteTeams.map(t => t.id).sort().join(',');
  }, [favoriteTeams]);

  // 🔴 CANLI MAÇ GÜNCELLEMESİ: Sadece /live endpoint'i, her 13 saniyede (dakika + biten maçlar hemen "Biten"e geçsin)
  const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC']; // ✅ ABD ve CANC eklendi
  const LIVE_POLL_INTERVAL_MS = 13 * 1000;
  const MAX_LIVE_WINDOW_MS_POLL = 3.5 * 60 * 60 * 1000; // categorizeMatches ile aynı pencere
  const isTimeBasedLive = (m: Match) => {
    if (!m?.fixture?.timestamp) return false;
    const startedAgo = Date.now() - m.fixture.timestamp * 1000;
    return startedAgo >= 0 && startedAgo <= MAX_LIVE_WINDOW_MS_POLL;
  };
  // ✅ TEMİZ CANLI MAÇ POLLING: API + "saat bazlı canlı" (başlama saati geçti, statü güncellenmemiş)
  const fetchLiveOnly = useCallback(async () => {
    try {
      const res = await api.matches.getLiveMatches();
      const rawData = (res?.data || []) as any[];
      
      // ✅ Veri formatını normalize et (API ve DB formatı farklı olabiliyor)
      const newLiveRaw = rawData.map(m => normalizeMatchFormat(m)).filter(Boolean) as Match[];
      
      // ✅ Her zaman en güncel favoriteTeams'i kullan (stale closure önleme)
      const currentTeams = favoriteTeamsRef.current;
      const favIds = currentTeams?.map(t => Number(t.id)) ?? [];
      
      // Favori takımların maçlarını filtrele - ID'leri number olarak karşılaştır
      const byFav = favIds.length === 0 ? newLiveRaw : newLiveRaw.filter(m => {
        const homeId = Number(m.teams?.home?.id);
        const awayId = Number(m.teams?.away?.id);
        return favIds.includes(homeId) || favIds.includes(awayId);
      });
      
      const statusShort = (m: Match) => typeof m.fixture?.status === 'string' ? m.fixture.status : (m.fixture?.status?.short ?? '');
      
      const newLive = byFav.filter(m => {
        if (FINISHED_STATUSES.includes(statusShort(m))) return false;
        return LIVE_STATUSES.includes(statusShort(m));
      });
      
      const nowFinishedFromApi = byFav.filter(m => FINISHED_STATUSES.includes(statusShort(m)));
      
      const liveMatchIds = new Set(newLive.map(m => m.fixture?.id));
      
      if (newLiveRaw.length > 0) {
        console.log('🔴 fetchLiveOnly:', {
          total: newLiveRaw.length,
          filtered: byFav.length,
          live: newLive.length,
          favIds: favIds.slice(0, 6),
          firstMatch: newLiveRaw[0] ? `${newLiveRaw[0].teams?.home?.name} (${newLiveRaw[0].teams?.home?.id}) vs ${newLiveRaw[0].teams?.away?.name} (${newLiveRaw[0].teams?.away?.id}) [${statusShort(newLiveRaw[0])}]` : null,
          rawFormat: rawData[0] ? { hasFixture: !!rawData[0].fixture, hasTeams: !!rawData[0].teams, hasHomeTeam: !!rawData[0].home_team, keys: Object.keys(rawData[0]).slice(0, 8) } : null,
        });
      }
      
      // Upcoming ve past'tan canlı olan maçları çıkar
      if (liveMatchIds.size > 0) {
        setUpcomingMatches(prev => prev.filter(m => !liveMatchIds.has(m.fixture?.id)));
        setPastMatches(prev => prev.filter(m => !liveMatchIds.has(m.fixture?.id)));
      }
      
      // Live maçları güncelle: API canlıları + "saat bazlı canlı". Biten'e SADECE API'den FT/bitiş statüsü gelince geçir.
      setLiveMatches(prev => {
        const newIds = new Set(newLive.map(m => m.fixture?.id));
        const timeBasedStillLive = prev.filter(m => isTimeBasedLive(m) && !newIds.has(m.fixture?.id));
        const asPast = [...nowFinishedFromApi];
        if (asPast.length > 0) {
          setPastMatches(p => [...asPast, ...p]);
        }
        return [...newLive, ...timeBasedStillLive];
      });
    } catch (err) {
      console.log('🔴 Canlı maç fetch hatası:', err);
    }
  }, []); // ✅ favoriteTeams çıkarıldı, ref kullanılıyor

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

    // ✅ Ref'i hemen güncelle - fetchMatches ref'ten okuyacak
    favoriteTeamsRef.current = favoriteTeams;
    if (!hasLoadedOnce) setLoading(true);
    fetchMatches();
  }, [favoriteTeamIdsString]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔴 CANLI MAÇ POLLING: Canlı maç varsa sık, yoksa seyrek kontrol et
  useEffect(() => {
    if (!hasLoadedOnce || !favoriteTeamIdsString) return;
    
    const interval = liveMatches.length > 0 ? LIVE_POLL_INTERVAL_MS : 60 * 1000;
    
    if (liveMatches.length > 0) {
      console.log('🔴 Canlı maç polling başlatılıyor', { liveCount: liveMatches.length });
    }
    
    fetchLiveOnly();
    const t = setInterval(fetchLiveOnly, interval);
    return () => clearInterval(t);
  }, [hasLoadedOnce, favoriteTeamIdsString, liveMatches.length, fetchLiveOnly]);

  // 🔥 Genel güncelleme: Backend'den her 60 saniyede tam fetch (takım maçları + live)
  useEffect(() => {
    if (!hasLoadedOnce || !favoriteTeamIdsString) return;
    const t = setInterval(() => fetchMatches(), 60 * 1000);
    return () => clearInterval(t);
  }, [hasLoadedOnce, favoriteTeamIdsString]); // eslint-disable-line react-hooks/exhaustive-deps

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
