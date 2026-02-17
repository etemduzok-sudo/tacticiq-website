// useMatches Hook - Fetch live match data
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// ✅ Mock maç (999999) – Canlı: 52. dk, 1H, skor 5-4 (ev sahibi önde), ilk yarı 1 dk uzadı, 45+1'de ev sahibi kırmızı kart
const MOCK_MATCH_999999 = {
  fixture: {
    id: 999999,
    date: new Date().toISOString(),
    timestamp: Math.floor(Date.now() / 1000) - 52 * 60,
    status: { short: '2H', long: 'Second Half', elapsed: 52 },
    venue: { name: 'Mock Stadium' },
  },
  league: { id: 999, name: 'Mock League', country: 'TR', logo: null },
  teams: {
    home: { id: 9999, name: 'Mock Home Team', logo: null },
    away: { id: 9998, name: 'Mock Away Team', logo: null },
  },
  goals: { home: 5, away: 4 },
  score: {
    halftime: { home: 3, away: 2 },
    fulltime: { home: 5, away: 4 },
  },
};

// 3-5-2: Atak formasyonu (GK, CB, CB, CB, LWB, CM, CM, CM, RWB, ST, ST)
const MOCK_352_POSITIONS = ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'];
// 3-6-1: Defans formasyonu (GK, CB, CB, CB, LB, DM, DM, RB, LM, RM, ST)
const MOCK_361_POSITIONS = ['GK', 'CB', 'CB', 'CB', 'LB', 'DM', 'DM', 'RB', 'LM', 'RM', 'ST'];

const MOCK_HOME_NAMES = ['O. Yılmaz', 'E. Kaya', 'A. Demir', 'C. Şahin', 'M. Özkan', 'B. Arslan', 'K. Yıldız', 'S. Aydın', 'H. Çelik', 'F. Koç', 'D. Aksoy'];
const MOCK_HOME_SUBS = ['T. Polat', 'U. Kurt', 'V. Acar', 'Y. Öztürk', 'Z. Bayrak'];
const MOCK_AWAY_NAMES = ['R. Güneş', 'T. Yıldırım', 'U. Erdoğan', 'V. Kurt', 'Y. Acar', 'Z. Öztürk', 'G. Bayrak', 'İ. Koç', 'Ş. Aslan', 'Ö. Kılıç', 'Ç. Yılmaz'];
const MOCK_AWAY_SUBS = ['A. Sol', 'B. Merkez', 'C. Sağ', 'D. Stoper', 'E. Forvet'];

function buildMockLineups() {
  const homeStartXI = MOCK_352_POSITIONS.map((pos, i) => ({
    player: {
      id: 9000 + i,
      name: MOCK_HOME_NAMES[i],
      pos,
      number: i + 1,
      rating: 75 + (i % 3),
    },
  }));
  const homeSubs = MOCK_HOME_SUBS.map((name, i) => ({
    player: {
      id: 9016 + i,
      name,
      pos: i === 0 ? 'GK' : ['CB', 'CM', 'CM', 'ST'][i - 1],
      number: 12 + i,
      rating: 72 + i,
    },
  }));
  const awayStartXI = MOCK_352_POSITIONS.map((pos, i) => ({
    player: {
      id: 9011 + i,
      name: MOCK_AWAY_NAMES[i],
      pos,
      number: i + 1,
      rating: 74 + (i % 3),
    },
  }));
  const awaySubs = MOCK_AWAY_SUBS.map((name, i) => ({
    player: {
      id: 9022 + i,
      name,
      pos: i === 0 ? 'GK' : ['CB', 'CM', 'CM', 'ST'][i - 1],
      number: 12 + i,
      rating: 71 + i,
    },
  }));
  return [
    { team: { id: 9999, name: 'Mock Home Team' }, formation: '3-5-2', startXI: homeStartXI, substitutes: homeSubs },
    { team: { id: 9998, name: 'Mock Away Team' }, formation: '3-5-2', startXI: awayStartXI, substitutes: awaySubs },
  ];
}

// Hook for match details
// ✅ Canlı maçlar için periyodik güncelleme desteği (30 saniye)
export function useMatchDetails(matchId: number) {
  const [match, setMatch] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Canlı maç mı kontrol et
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'];
  const isMatchLive = match?.fixture?.status?.short 
    ? LIVE_STATUSES.includes(match.fixture.status.short)
    : false;

  // ✅ Maç timestamp'i geçmiş mi ama status NS mi (potansiyel canlı)?
  const isPotentiallyLive = useMemo(() => {
    if (!match?.fixture?.timestamp) return false;
    const now = Date.now();
    const matchTime = match.fixture.timestamp * 1000;
    const timeSinceStart = now - matchTime;
    const status = match?.fixture?.status?.short || '';
    
    // Maç zamanı geçmiş, 3 saatten az ve status NS/TBD
    return (status === 'NS' || status === 'TBD' || status === '') 
      && timeSinceStart > 0 
      && timeSinceStart < 3 * 60 * 60 * 1000;
  }, [match?.fixture?.timestamp, match?.fixture?.status?.short]);

  // ✅ Fetch fonksiyonu - reusable
  const fetchMatchDetails = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      // ✅ matchId 0 veya negatif ise API çağrısı yapma (preloadedMatch kullanılıyor demektir)
      if (!matchId || matchId <= 0) {
        logger.info(`⏭️ Skipping API call - matchId is ${matchId} (preloadedMatch kullanılıyor)`, { matchId }, 'MATCH_DETAILS');
        setLoading(false);
        return;
      }

      // ✅ Mock maç (999999): API çağrısı yapma, anında mock veri set et (uygulama takılmasın)
      if (matchId === 999999) {
        logger.info(`🔄 Mock match 999999 – using local data (no API)`, { matchId }, 'MATCH_DETAILS');
        setMatch(MOCK_MATCH_999999);
        setLineups(buildMockLineups());
        setStatistics(null);
        setEvents([]);
        setLoading(false);
        return;
      }
      
      logger.info(`🔄 ${isRefresh ? 'Refreshing' : 'Fetching'} match details for ${matchId}...`, { matchId, isRefresh }, 'MATCH_DETAILS');

      // ✅ Timeout wrapper for each API call (10 seconds max)
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      // ✅ Use Promise.allSettled to handle partial failures
      const [matchRes, statsRes, eventsRes, lineupsRes] = await Promise.allSettled([
        withTimeout(api.matches.getMatchDetails(matchId)),
        withTimeout(api.matches.getMatchStatistics(matchId)),
        withTimeout(api.matches.getMatchEvents(matchId)),
        withTimeout(api.matches.getMatchLineups(matchId)),
      ]);

      // ✅ Process results - partial data is OK
      if (matchRes.status === 'fulfilled' && matchRes.value.success) {
        setMatch(matchRes.value.data);
        logger.info(`✅ Match data loaded`, { matchId, status: matchRes.value.data?.fixture?.status?.short }, 'MATCH_DETAILS');
      } else {
        logger.warn(`⚠️ Match data failed`, { matchId, reason: matchRes.status === 'rejected' ? matchRes.reason : 'No data' }, 'MATCH_DETAILS');
      }
      
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStatistics(statsRes.value.data);
      }
      
      if (eventsRes.status === 'fulfilled' && eventsRes.value.success) {
        setEvents(eventsRes.value.data);
      }
      
      if (lineupsRes.status === 'fulfilled' && lineupsRes.value.success) {
        setLineups(lineupsRes.value.data);
      }

      // ✅ If match data failed, set error
      if (matchRes.status === 'rejected' || (matchRes.status === 'fulfilled' && !matchRes.value.success)) {
        setError('Maç detayları yüklenemedi');
      }

      logger.info(`📊 Match details ${isRefresh ? 'refresh' : 'fetch'} complete`, { matchId }, 'MATCH_DETAILS');
    } catch (err: any) {
      logger.error('Error fetching match details', { error: err, matchId }, 'MATCH_DETAILS');
      setError(err.message || 'Failed to fetch match details');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // ✅ İlk yükleme
  useEffect(() => {
    if (matchId && matchId > 0) {
      fetchMatchDetails(false);
    } else {
      // ✅ matchId 0 ise loading false olsun
      setLoading(false);
    }
  }, [matchId, fetchMatchDetails]);

  // ✅ Canlı maçlar için periyodik güncelleme (her 30 saniye)
  useEffect(() => {
    if (!matchId || matchId <= 0 || matchId === 999999) return;
    
    // Sadece canlı veya potansiyel canlı maçlarda güncelle
    if (!isMatchLive && !isPotentiallyLive) return;

    logger.info(`🔴 Canlı maç - periyodik güncelleme başlatılıyor`, { matchId, isMatchLive, isPotentiallyLive }, 'MATCH_DETAILS');
    
    const interval = setInterval(() => {
      fetchMatchDetails(true);
    }, 30000); // 30 saniye

    return () => {
      clearInterval(interval);
      logger.info(`⏹️ Canlı maç güncelleme durduruldu`, { matchId }, 'MATCH_DETAILS');
    };
  }, [matchId, isMatchLive, isPotentiallyLive, fetchMatchDetails]);

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
