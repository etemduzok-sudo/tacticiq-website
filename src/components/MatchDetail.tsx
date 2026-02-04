// src/components/MatchDetail.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useMatchDetails } from '../hooks/useMatches';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import api from '../services/api';
import { MatchSquad } from './match/MatchSquad';
import { MatchPrediction } from './match/MatchPrediction';
import { MatchLive } from './match/MatchLive';
import { MatchStats } from './match/MatchStats';
import { MatchRatings } from './match/MatchRatings';
import { MatchResultSummary } from './match/MatchResultSummary';
// MatchSummary artık kullanılmıyor - Özet bilgileri biten maç kartlarında gösteriliyor
// import { MatchSummary } from './match/MatchSummary';
import { AnalysisFocusModal, AnalysisFocusType } from './AnalysisFocusModal';
import { ConfirmModal } from './ui/ConfirmModal';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../config/constants';
import { predictionsDb } from '../services/databaseService';
import { BRAND, COLORS, SPACING, SIZES } from '../theme/theme';
import { getTeamColors as getTeamColorsUtil } from '../utils/teamColors';

const { width, height } = Dimensions.get('window');

interface MatchDetailProps {
  matchId: string;
  onBack: () => void;
  initialTab?: string; // ✅ Başlangıç sekmesi (squad, prediction, live, stats, ratings, summary)
  analysisFocus?: string; // ✅ Analiz odağı (defense, offense, midfield, physical, tactical, player)
  preloadedMatch?: any; // ✅ Dashboard'dan gelen maç verisi (API çağrısını atlar)
}

// Mock match data
const matchData = {
  id: '1',
  homeTeam: {
    name: 'Galatasaray',
    logo: '🦁',
    color: ['#FDB913', '#E30613'],
    manager: 'Okan Buruk',
  },
  awayTeam: {
    name: 'Fenerbahçe',
    logo: '🐤',
    color: ['#FCCF1E', '#001A70'],
    manager: 'İsmail Kartal',
  },
  league: 'Süper Lig',
  stadium: 'Ali Sami Yen',
  date: '2 Oca 2026',
  time: '20:00',
};

const tabs = [
  { id: 'squad', label: 'Kadro', icon: 'people' },
  { id: 'prediction', label: 'Tahmin', icon: 'analytics' },
  { id: 'live', label: 'Canlı', icon: 'pulse' },
  { id: 'stats', label: 'İstatistik', icon: 'bar-chart' },
  { id: 'ratings', label: 'Reyting', icon: 'star' },
  // Özet sekmesi kaldırıldı - Artık biten maç kartlarında gösteriliyor
];

export function MatchDetail({ matchId, onBack, initialTab = 'squad', analysisFocus, preloadedMatch }: MatchDetailProps) {
  // ✅ Maç durumuna göre varsayılan sekme belirlenir (biten maçlar için stats/ratings)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [coaches, setCoaches] = useState<{ home: string; away: string }>({ home: '', away: '' });
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  const { favoriteTeams } = useFavoriteTeams();
  const favoriteTeamIds = React.useMemo(() => favoriteTeams?.map(t => t.id) ?? [], [favoriteTeams]);
  const [showAnalysisFocusModal, setShowAnalysisFocusModal] = useState(false);
  const [analysisFocusOverride, setAnalysisFocusOverride] = useState<AnalysisFocusType | null>(null);
  const [showResetPredictionsModal, setShowResetPredictionsModal] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const effectiveAnalysisFocus = analysisFocusOverride ?? analysisFocus;

  // ✅ Kaydedilmemiş değişiklik kontrolü
  const [predictionHasUnsavedChanges, setPredictionHasUnsavedChanges] = useState(false);
  const [predictionSaveFn, setPredictionSaveFn] = useState<(() => Promise<void>) | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);

  // ✅ Memoize onHasUnsavedChanges callback to prevent infinite re-renders
  const handleHasUnsavedChanges = useCallback((hasChanges: boolean, saveFn: () => Promise<void>) => {
    setPredictionHasUnsavedChanges(hasChanges);
    setPredictionSaveFn(() => saveFn);
  }, []);

  // ✅ İki favori takım maçı: ev sahibi ve deplasman favorilerde
  const [selectedPredictionTeamId, setSelectedPredictionTeamId] = useState<number | null>(null);
  const [showTeamPickerModal, setShowTeamPickerModal] = useState(false);
  const [showOfferOtherTeamModal, setShowOfferOtherTeamModal] = useState(false);
  const [otherTeamIdForOffer, setOtherTeamIdForOffer] = useState<number | null>(null);
  const [resetTargetTeamId, setResetTargetTeamId] = useState<number | null>(null);
  const [showResetTeamPickerModal, setShowResetTeamPickerModal] = useState(false);

  // ✅ Tahmin kontrolü fonksiyonu - tek takım veya iki takım (favori) maçı
  const checkPredictions = React.useCallback(async (homeId?: number, awayId?: number, bothFav?: boolean) => {
    if (!matchId) return;
    try {
      if (bothFav && homeId != null && awayId != null) {
        const key1 = `${STORAGE_KEYS.PREDICTIONS}${matchId}-${homeId}`;
        const key2 = `${STORAGE_KEYS.PREDICTIONS}${matchId}-${awayId}`;
        const alt1 = `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}-${homeId}`;
        const alt2 = `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}-${awayId}`;
        const raw1 = await AsyncStorage.getItem(key1) || await AsyncStorage.getItem(alt1);
        const raw2 = await AsyncStorage.getItem(key2) || await AsyncStorage.getItem(alt2);
        let has = false;
        if (raw1) {
          const p = JSON.parse(raw1);
          has = has || !!(p?.matchPredictions && Object.values(p.matchPredictions).some((v: any) => v != null)) || !!(p?.playerPredictions && Object.keys(p.playerPredictions).length > 0);
        }
        if (raw2) {
          const p = JSON.parse(raw2);
          has = has || !!(p?.matchPredictions && Object.values(p.matchPredictions).some((v: any) => v != null)) || !!(p?.playerPredictions && Object.keys(p.playerPredictions).length > 0);
        }
        setHasPrediction(has);
        return;
      }
      const predRaw = await AsyncStorage.getItem(STORAGE_KEYS.PREDICTIONS + matchId)
        || await AsyncStorage.getItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`);
      if (predRaw) {
        const pred = JSON.parse(predRaw);
        const hasMatchPred = pred?.matchPredictions && Object.values(pred.matchPredictions).some((v: any) => v != null);
        const hasPlayerPred = pred?.playerPredictions && Object.keys(pred.playerPredictions).length > 0;
        setHasPrediction(!!hasMatchPred || !!hasPlayerPred);
      } else {
        setHasPrediction(false);
      }
    } catch (e) {
      setHasPrediction(false);
    }
  }, [matchId]);

  const handleResetPredictionsConfirm = async (targetTeamId?: number | null) => {
    const teamToReset = targetTeamId ?? resetTargetTeamId;
    setShowResetPredictionsModal(false);
    setResetTargetTeamId(null);
    const homeId = matchData?.teams?.home?.id ?? matchData?.homeTeam?.id;
    const awayId = matchData?.teams?.away?.id ?? matchData?.awayTeam?.id;
    const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);

    try {
      if (bothFavorites && teamToReset != null) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.PREDICTIONS}${matchId}-${teamToReset}`);
        await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}-${teamToReset}`);
        const squadKey = `${STORAGE_KEYS.SQUAD}${matchId}-${teamToReset}`;
        const raw = await AsyncStorage.getItem(squadKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.isCompleted = false;
          await AsyncStorage.setItem(squadKey, JSON.stringify(parsed));
        }
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId)); // DB'de match bazlı; ek filtre gerekebilir
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PREDICTIONS + matchId);
        await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`);
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
        const squadKey = `${STORAGE_KEYS.SQUAD}${matchId}`;
        const raw = await AsyncStorage.getItem(squadKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.isCompleted = false;
          await AsyncStorage.setItem(squadKey, JSON.stringify(parsed));
        }
      }
      setHasPrediction(false);
      if (bothFavorites) checkPredictions(homeId, awayId, true);
      else checkPredictions();
    } catch (e) { console.warn('Reset predictions failed', e); }
    setShowAnalysisFocusModal(true);
  };

  React.useEffect(() => {
    if (effectiveAnalysisFocus) {
      console.log('📊 Analiz Odağı:', effectiveAnalysisFocus);
    }
  }, [effectiveAnalysisFocus]);
  
  // ✅ Geri sayım ticker - her saniye güncelle
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Eğer preloadedMatch varsa, API çağrısı yapma
  const shouldFetchFromApi = !preloadedMatch;
  
  // Fetch match details from API (sadece preloadedMatch yoksa)
  const { match: apiMatch, statistics, events, lineups, loading: apiLoading, error } = useMatchDetails(
    shouldFetchFromApi ? Number(matchId) : 0 // 0 = API çağrısı yapılmaz
  );
  
  // ✅ preloadedMatch varsa onu kullan, yoksa API'den gelen veriyi kullan
  const match = preloadedMatch || apiMatch;
  const loading = shouldFetchFromApi ? apiLoading : false;

  // ✅ Tahmin kontrolü - match yüklendikten sonra; iki favori maçta çift anahtar
  React.useEffect(() => {
    if (!match?.teams?.home?.id || !match?.teams?.away?.id) {
      checkPredictions();
      const interval = setInterval(checkPredictions, 2000);
      return () => clearInterval(interval);
    }
    const hid = match.teams.home.id;
    const aid = match.teams.away.id;
    const bothFav = favoriteTeamIds.includes(hid) && favoriteTeamIds.includes(aid);
    const fn = () => (bothFav ? checkPredictions(hid, aid, true) : checkPredictions());
    fn();
    const interval = setInterval(fn, 2000);
    return () => clearInterval(interval);
  }, [match?.teams?.home?.id, match?.teams?.away?.id, favoriteTeamIds, checkPredictions]);

  // ✅ Teknik direktör bilgilerini çek
  React.useEffect(() => {
    const fetchCoaches = async () => {
      if (!match?.teams?.home?.id || !match?.teams?.away?.id) return;
      
      try {
        const [homeCoach, awayCoach] = await Promise.allSettled([
          api.teams.getTeamCoach(match.teams.home.id),
          api.teams.getTeamCoach(match.teams.away.id),
        ]);
        
        setCoaches({
          home: homeCoach.status === 'fulfilled' && homeCoach.value?.data?.coach?.name 
            ? homeCoach.value.data.coach.name 
            : '',
          away: awayCoach.status === 'fulfilled' && awayCoach.value?.data?.coach?.name 
            ? awayCoach.value.data.coach.name 
            : '',
        });
        
        console.log('👔 Coaches loaded:', {
          home: homeCoach.status === 'fulfilled' ? homeCoach.value?.data?.coach?.name : 'N/A',
          away: awayCoach.status === 'fulfilled' ? awayCoach.value?.data?.coach?.name : 'N/A',
        });
      } catch (error) {
        console.log('⚠️ Coach fetch error:', error);
      }
    };
    
    fetchCoaches();
  }, [match?.teams?.home?.id, match?.teams?.away?.id]);

  // Helper function to get team colors from API or generate from team name
  // ✅ STANDART: teamColors.ts utility'sini kullan (tutarlılık için)
  const getTeamColors = (team: any): [string, string] => {
    // Try to get colors from API first
    if (team.colors?.player?.primary) {
      const primary = team.colors.player.primary;
      const secondary = team.colors.player.number || primary;
      return [primary, secondary];
    }
    
    // ✅ teamColors.ts utility'sini kullan (standart renkler için)
    const teamName = typeof team === 'string' ? team : team.name;
    const colors = getTeamColorsUtil(teamName);
    
    // Eğer teamColors.ts'den renk geldiyse kullan
    if (colors && colors.length >= 2 && colors[0] !== '#1E40AF') {
      return [colors[0], colors[1]];
    }
    
    // Fallback: Default colors based on home/away - Design System colors
    const isHome = typeof team === 'object' && team.home;
    return isHome ? ['#1FA2A6', '#0F2A24'] : ['#C9A44C', '#8B7833'];
  };

  // Teknik direktör: önce coaches API, yoksa lineups'tan al
  const getManagerFromLineups = (teamId: number) => {
    const arr = Array.isArray(lineups) ? lineups : lineups?.data;
    if (!arr?.length) return '';
    const lineup = arr.find((l: any) => l.team?.id === teamId);
    const coach = lineup?.coach;
    if (typeof coach === 'string') return coach;
    if (coach?.name) return coach.name;
    return '';
  };
  const homeManager = coaches.home || getManagerFromLineups(match?.teams?.home?.id);
  const awayManager = coaches.away || getManagerFromLineups(match?.teams?.away?.id);

  // ✅ Maç canlı mı kontrol et
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO']; // Biten maç statüleri
  const matchStatus = match?.fixture?.status?.short || '';
  const isMatchLive = LIVE_STATUSES.includes(matchStatus);
  const isMatchFinished = FINISHED_STATUSES.includes(matchStatus);
  const matchMinute = match?.fixture?.status?.elapsed || 0;
  const homeScore = match?.goals?.home ?? 0;
  const awayScore = match?.goals?.away ?? 0;
  const halftimeScore = match?.score?.halftime || null;
  
  // ✅ Biten maçlar için varsayılan sekme ayarı
  React.useEffect(() => {
    if (match && !initialTabSet && initialTab === 'squad') {
      // Eğer maç bitmişse ve initialTab belirtilmemişse, stats sekmesine git
      if (isMatchFinished) {
        setActiveTab('stats');
        setInitialTabSet(true);
      }
    }
  }, [match, isMatchFinished, initialTab, initialTabSet]);

  // Transform API data to component format
  const matchData = match ? {
    id: match.fixture.id.toString(),
    homeTeam: {
      id: match.teams.home.id, // ✅ Team ID eklendi
      name: match.teams.home.name,
      logo: match.teams.home.logo || '⚽',
      color: getTeamColors(match.teams.home),
      manager: homeManager,
    },
    awayTeam: {
      id: match.teams.away.id, // ✅ Team ID eklendi
      name: match.teams.away.name,
      logo: match.teams.away.logo || '⚽',
      color: getTeamColors(match.teams.away),
      manager: awayManager,
    },
    // ✅ Geriye uyumluluk için teams objesi de ekle
    teams: {
      home: { id: match.teams.home.id, name: match.teams.home.name },
      away: { id: match.teams.away.id, name: match.teams.away.name },
    },
    league: match.league.name,
    stadium: match.fixture.venue?.name || 'TBA',
    date: new Date(match.fixture.date).toLocaleDateString('tr-TR'),
    time: api.utils.formatMatchTime(new Date(match.fixture.date).getTime() / 1000),
    timestamp: match.fixture.timestamp || new Date(match.fixture.date).getTime() / 1000, // ✅ Geri sayım için
    // ✅ Canlı maç bilgileri
    isLive: isMatchLive,
    minute: matchMinute,
    homeScore: homeScore,
    awayScore: awayScore,
    halftimeScore: halftimeScore,
    status: matchStatus,
  } : null;
  
  // ✅ Geri sayım hesaplama
  const getCountdownData = () => {
    if (!matchData?.timestamp) return null;
    
    // countdownTicker'ı kullanarak her saniye güncellemeyi tetikle
    const _ = countdownTicker;
    
    const now = Date.now() / 1000;
    const matchTime = matchData.timestamp;
    const timeDiff = matchTime - now;
    
    // Maç başladıysa veya bittiyse geri sayım gösterme
    if (timeDiff <= 0) return null;
    
    const hours24 = 24 * 60 * 60;
    const days7 = 7 * 24 * 60 * 60;
    
    let countdownColor = '#10b981'; // Varsayılan yeşil
    const hoursLeft = timeDiff / 3600;
    
    // Renk değişimi
    if (hoursLeft <= 1) {
      countdownColor = '#EF4444'; // Kırmızı
    } else if (hoursLeft <= 3) {
      countdownColor = '#F97316'; // Turuncu
    } else if (hoursLeft <= 6) {
      countdownColor = '#F59E0B'; // Sarı
    } else if (hoursLeft <= 12) {
      countdownColor = '#84CC16'; // Açık yeşil
    }
    
    // 7 günden fazla ise gün sayısını göster
    if (timeDiff > days7) {
      const days = Math.floor(timeDiff / (24 * 60 * 60));
      return { type: 'days', days, color: countdownColor };
    }
    
    // 24 saatten fazla ama 7 günden az ise gün sayısını göster
    if (timeDiff > hours24) {
      const days = Math.floor(timeDiff / (24 * 60 * 60));
      return { type: 'days', days, color: countdownColor };
    }
    
    // 24 saatten az kaldıysa saat:dakika:saniye göster
    return {
      type: 'countdown',
      hours: Math.floor(timeDiff / 3600),
      minutes: Math.floor((timeDiff % 3600) / 60),
      seconds: Math.floor(timeDiff % 60),
      color: countdownColor,
    };
  };
  
  const countdownData = getCountdownData();

  // ✅ İki favori takım maçı: ev sahibi ve deplasman favorilerde
  const homeId = matchData?.teams?.home?.id ?? matchData?.homeTeam?.id;
  const awayId = matchData?.teams?.away?.id ?? matchData?.awayTeam?.id;
  const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);

  // ✅ İki favori maçta girişte takım seçici göster (seçim yapılmamışsa)
  React.useEffect(() => {
    if (matchData && bothFavorites && selectedPredictionTeamId === null) {
      setShowTeamPickerModal(true);
    }
  }, [matchData, bothFavorites, selectedPredictionTeamId]);

  // Loading state
  if (loading || !matchData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1FA2A6" />
        <Text style={styles.loadingText}>Maç detayları yükleniyor...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Veriler yüklenemedi</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity onPress={onBack} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => {
    const predictionTeamId = bothFavorites ? (selectedPredictionTeamId ?? undefined) : undefined;

    switch (activeTab) {
      case 'squad':
        if (bothFavorites && !selectedPredictionTeamId) {
          return (
            <View style={styles.centerContent}>
              <Text style={styles.placeholderText}>Hangi takım için kadro seçeceğinizi yukarıdaki pencereden seçin.</Text>
            </View>
          );
        }
        return (
          <MatchSquad
            key={`squad-${matchId}-${predictionTeamId ?? 'all'}`}
            matchData={matchData}
            matchId={matchId}
            lineups={lineups}
            favoriteTeamIds={favoriteTeamIds}
            predictionTeamId={predictionTeamId}
            onComplete={() => setActiveTab('prediction')}
            onAttackFormationChangeConfirmed={() => setShowAnalysisFocusModal(true)}
            isVisible={activeTab === 'squad'}
          />
        );
      
      case 'prediction':
        if (bothFavorites && !selectedPredictionTeamId) {
          return (
            <View style={styles.centerContent}>
              <Text style={styles.placeholderText}>Hangi takım için tahmin yapacağınızı yukarıdaki pencereden seçin.</Text>
            </View>
          );
        }
        return (
          <MatchPrediction
            matchData={matchData}
            matchId={matchId}
            predictionTeamId={predictionTeamId}
            initialAnalysisFocus={effectiveAnalysisFocus}
            lineups={lineups}
            favoriteTeamIds={favoriteTeamIds}
            onPredictionsSaved={() => checkPredictions(homeId, awayId, bothFavorites)}
            onPredictionsSavedForTeam={(savedTeamId) => {
              checkPredictions(homeId, awayId, bothFavorites);
              if (bothFavorites && savedTeamId != null) {
                const otherId = savedTeamId === homeId ? awayId : homeId;
                setOtherTeamIdForOffer(otherId ?? null);
                setShowOfferOtherTeamModal(true);
              }
            }}
            onHasUnsavedChanges={handleHasUnsavedChanges}
          />
        );
      
      case 'live':
        return <MatchLive matchData={matchData} matchId={matchId} events={events} />;
      
      case 'stats':
        // Biten maçlar için MatchResultSummary, devam eden/gelecek maçlar için MatchStats
        if (isMatchFinished) {
          return <MatchResultSummary matchId={matchId} matchData={matchData} />;
        }
        return <MatchStats matchData={matchData} />;
      
      case 'ratings':
        return <MatchRatings matchData={matchData} />;
      
      // Özet sekmesi kaldırıldı - Artık biten maç kartlarında gösteriliyor
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ✅ Grid Pattern Background - Dashboard ile aynı */}
      <View style={styles.gridPattern} />

      {/* Sticky Match Card Header - ProfileCard overlay gibi */}
      <View style={styles.matchCardOverlay}>
        {/* ✅ Home Team Color Bar – beyaz varsa diğer takımla farklı konumda (biri üstte biri altta) */}
        <LinearGradient
          colors={matchData.homeTeam.color}
          style={styles.colorBarLeft}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* ✅ Away Team Color Bar – ikisinde de beyaz varsa deplasmanın beyazı ters tarafta (görsel ayrım) */}
        <LinearGradient
          colors={(() => {
            const home = matchData.homeTeam.color as string[];
            const away = matchData.awayTeam.color as string[];
            const white = (c: string) => (c || '').toUpperCase() === '#FFFFFF' || (c || '').toUpperCase() === '#FFF';
            const homeHasWhite = home?.some(white);
            const awayHasWhite = away?.some(white);
            if (homeHasWhite && awayHasWhite && away?.length >= 2) return [...away].reverse();
            return away;
          })()}
          style={styles.colorBarRight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.matchCard}>
        {/* Top Row: Back Button + League Badge + Prediction Star */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.centerBadges}>
            <View style={styles.leagueBadge}>
              <Ionicons name="trophy" size={12} color="#1FA2A6" />
              <Text style={styles.leagueText}>{matchData.league}</Text>
            </View>
            <View style={styles.stadiumBadge}>
              <Ionicons name="location" size={10} color="#94A3B8" />
              <Text style={styles.stadiumText}>{matchData.stadium}</Text>
            </View>
          </View>

          {hasPrediction ? (
            <TouchableOpacity
              onPress={() => {
                if (bothFavorites) setShowResetTeamPickerModal(true);
                else setShowResetPredictionsModal(true);
              }}
              style={styles.starButton}
              hitSlop={12}
              accessibilityLabel="Tahminleri silmek istiyor musunuz?"
            >
              <Ionicons name="star" size={20} color="#EAB308" />
              <Text style={styles.starButtonText}>Tahmin{'\n'}Yapıldı</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </View>

        {/* Main Match Info - Teams & Time/Score */}
        <View style={styles.matchInfoRow}>
          {/* Home Team */}
          <View style={styles.teamSide}>
            <Text style={styles.teamNameLarge}>{matchData.homeTeam.name}</Text>
            {matchData.homeTeam.manager && (
              <Text style={styles.managerText}>{matchData.homeTeam.manager}</Text>
            )}
            {/* Canlı maçta skor göster */}
            {matchData.isLive && (
              <View style={styles.liveScoreBox}>
                <Text style={styles.liveScoreText}>{matchData.homeScore}</Text>
              </View>
            )}
          </View>

          {/* Center: Date, Time, Countdown OR Live Status */}
          <View style={styles.centerInfo}>
            {matchData.isLive ? (
              <>
                {/* CANLI Badge */}
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>CANLI</Text>
                </View>
                {/* Dakika */}
                <Text style={styles.liveMinuteText}>{matchData.minute}'</Text>
                {/* İlk yarı skoru */}
                {matchData.halftimeScore && (
                  <Text style={styles.halftimeText}>
                    İY: {matchData.halftimeScore.home}-{matchData.halftimeScore.away}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.dateText}>● {matchData.date}</Text>
                <Text style={styles.timeText}>{matchData.time}</Text>
                {/* Countdown Boxes */}
                {countdownData && countdownData.type === 'countdown' && (
                  <View style={styles.countdownRow}>
                    <View style={[styles.countdownBox, styles.countdownBoxHours]}>
                      <Text style={styles.countdownNumber}>{String(countdownData.hours).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Saat</Text>
                    </View>
                    <View style={[styles.countdownBox, styles.countdownBoxMinutes]}>
                      <Text style={styles.countdownNumber}>{String(countdownData.minutes).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Dakika</Text>
                    </View>
                    <View style={[styles.countdownBox, styles.countdownBoxSeconds]}>
                      <Text style={styles.countdownNumber}>{String(countdownData.seconds).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Saniye</Text>
                    </View>
                  </View>
                )}
                {countdownData && countdownData.type === 'days' && (
                  <Text style={[styles.daysText, { color: countdownData.color }]}>
                    {countdownData.days} gün kaldı
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSide}>
            <Text style={styles.teamNameLarge}>{matchData.awayTeam.name}</Text>
            {matchData.awayTeam.manager && (
              <Text style={styles.managerText}>{matchData.awayTeam.manager}</Text>
            )}
            {/* Canlı maçta skor göster */}
            {matchData.isLive && (
              <View style={styles.liveScoreBox}>
                <Text style={styles.liveScoreText}>{matchData.awayScore}</Text>
              </View>
            )}
          </View>
        </View>
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Tahminleri sil popup – header yıldızına basınca (tek takım) */}
      {showResetPredictionsModal && (
        <ConfirmModal
          visible={true}
          title="Tahminleri sil"
          message="Bu maça yapılan tahminleri silmek istiyor musunuz?"
          buttons={[
            { text: 'Hayır', style: 'cancel', onPress: () => { setShowResetPredictionsModal(false); setActiveTab('squad'); } },
            { text: 'Sil', style: 'destructive', onPress: () => handleResetPredictionsConfirm() },
          ]}
          onRequestClose={() => setShowResetPredictionsModal(false)}
        />
      )}

      {/* İki favori maç: Hangi takım için tahmin yapmak / değiştirmek istiyorsunuz? */}
      {showTeamPickerModal && matchData && bothFavorites && (
        <ConfirmModal
          visible={true}
          title="Hangi favori takıma tahmin yapmak istersiniz?"
          message="Önce bir takım seçin; kadro ve tahmin süreci o takım için açılacak."
          buttons={[
            { text: String(matchData.homeTeam?.name ?? 'Ev Sahibi'), onPress: () => { setSelectedPredictionTeamId(homeId!); setShowTeamPickerModal(false); } },
            { text: String(matchData.awayTeam?.name ?? 'Deplasman'), onPress: () => { setSelectedPredictionTeamId(awayId!); setShowTeamPickerModal(false); } },
          ]}
          onRequestClose={() => setShowTeamPickerModal(false)}
        />
      )}

      {/* İki favori maç: Yıldıza basınca – Hangi takım için tahmini silmek istiyorsunuz? */}
      {showResetTeamPickerModal && matchData && bothFavorites && (
        <ConfirmModal
          visible={true}
          title="Hangi takım için tahmini silmek istiyorsunuz?"
          message="Silmek istediğiniz takımın tahminlerini seçin."
          buttons={[
            { text: String(matchData.homeTeam?.name ?? 'Ev Sahibi'), onPress: () => { setShowResetTeamPickerModal(false); handleResetPredictionsConfirm(homeId!); } },
            { text: String(matchData.awayTeam?.name ?? 'Deplasman'), onPress: () => { setShowResetTeamPickerModal(false); handleResetPredictionsConfirm(awayId!); } },
          ]}
          onRequestClose={() => setShowResetTeamPickerModal(false)}
        />
      )}

      {/* İki favori maç: Tahmin kaydedildikten sonra – Diğer takım için de tahmin yapmak ister misin? */}
      {showOfferOtherTeamModal && matchData && otherTeamIdForOffer != null && (
        <ConfirmModal
          visible={true}
          title="Diğer takım için de tahmin yapmak ister misiniz?"
          message={`${otherTeamIdForOffer === homeId ? matchData.homeTeam?.name : matchData.awayTeam?.name} için de tahmin yapabilirsiniz.`}
          buttons={[
            { text: 'Hayır', style: 'cancel', onPress: () => { setShowOfferOtherTeamModal(false); setOtherTeamIdForOffer(null); } },
            { text: 'Evet', onPress: () => { setSelectedPredictionTeamId(otherTeamIdForOffer); setActiveTab('squad'); setShowOfferOtherTeamModal(false); setOtherTeamIdForOffer(null); } },
          ]}
          onRequestClose={() => { setShowOfferOtherTeamModal(false); setOtherTeamIdForOffer(null); }}
        />
      )}

      {/* ✅ Kaydedilmemiş değişiklik uyarısı - Tab değiştirilirken gösterilir */}
      {showUnsavedChangesModal && (
        <ConfirmModal
          visible={true}
          title="Kaydedilmemiş Değişiklikler"
          message="Tahminlerinizde kaydedilmemiş değişiklikler var. Kaydetmek ister misiniz?"
          buttons={[
            { 
              text: 'Kaydetme', 
              style: 'cancel', 
              onPress: () => { 
                setShowUnsavedChangesModal(false);
                setPredictionHasUnsavedChanges(false);
                if (pendingTabChange) {
                  setActiveTab(pendingTabChange);
                  setPendingTabChange(null);
                }
              } 
            },
            { 
              text: 'Kaydet', 
              onPress: async () => { 
                if (predictionSaveFn) {
                  await predictionSaveFn();
                }
                setShowUnsavedChangesModal(false);
                if (pendingTabChange) {
                  setActiveTab(pendingTabChange);
                  setPendingTabChange(null);
                }
              } 
            },
          ]}
          onRequestClose={() => { setShowUnsavedChangesModal(false); setPendingTabChange(null); }}
        />
      )}

      {/* Analiz Odağı Modal - Onay (formasyon değişikliği) sonrası gösterilir */}
      <AnalysisFocusModal
        visible={showAnalysisFocusModal}
        onClose={() => setShowAnalysisFocusModal(false)}
        onSelectFocus={(focus) => {
          setAnalysisFocusOverride(focus);
          setShowAnalysisFocusModal(false);
        }}
        matchInfo={matchData ? {
          homeTeam: matchData.homeTeam.name,
          awayTeam: matchData.awayTeam.name,
          date: `${matchData.date} ${matchData.time}`,
        } : undefined}
      />

      {/* Bottom Navigation - 6 Tabs - BottomNavigation gibi */}
      <View style={styles.bottomNavOverlay}>
        <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                // ✅ Tahmin sekmesinden ayrılırken kaydedilmemiş değişiklik kontrolü
                if (activeTab === 'prediction' && tab.id !== 'prediction' && predictionHasUnsavedChanges) {
                  setPendingTabChange(tab.id);
                  setShowUnsavedChangesModal(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={isActive ? '#1FA2A6' : '#64748B'}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {/* ✅ Active Indicator - Yazının altında (BottomNavigation gibi) */}
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2A24', // ✅ Design System: Koyu yeşil taban - Dashboard ile aynı
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // ✅ iOS: Status bar için alan
    position: 'relative',
  },
  
  // ✅ Grid Pattern Background - Dashboard ile aynı
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  
  // Match Card Overlay - ProfileCard ile aynı stil
  matchCardOverlay: {
    position: 'absolute',
    top: 0, // ✅ Ekranın en üstünden başla
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#0F2A24', // ✅ ProfileCard ile aynı renk
    borderTopLeftRadius: 0, // ✅ Üst köşeler düz (ProfileCard gibi)
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12, // ✅ ProfileCard ile aynı (25 değil 12)
    borderBottomRightRadius: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12, // ✅ Status bar için padding
    paddingBottom: 12,
    overflow: 'hidden', // ✅ Renk çubukları köşelerde kesilsin
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  
  // Match Card Header
  matchCard: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
    position: 'relative',
    zIndex: 1, // ✅ İçerik renk çubuklarının üstünde
  },
  // ✅ Sol kenar gradient şerit - Zarif ve ince
  colorBarLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    zIndex: 0,
    borderBottomLeftRadius: 12,
    opacity: 0.9,
  },
  // ✅ Sağ kenar gradient şerit - Zarif ve ince
  colorBarRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 5,
    zIndex: 0,
    borderBottomRightRadius: 12,
    opacity: 0.9,
  },
  // Top Row - Back + Badges + Star
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadges: {
    alignItems: 'center',
    gap: 4,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  leagueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  stadiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stadiumText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  starButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  starButtonText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#EAB308',
    textAlign: 'center',
    marginTop: 1,
    lineHeight: 10,
  },
  emptySpace: {
    width: 36,
  },
  
  // Main Match Info Row
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameLarge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 3,
  },
  managerText: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  teamColorStrip: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 6,
  },
  centerInfo: {
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
    paddingVertical: 8,
    minWidth: 160,
  },
  dateText: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
    marginBottom: 6,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 6,
  },
  countdownBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 40,
  },
  countdownBoxHours: {
    backgroundColor: 'rgba(31, 162, 166, 0.8)',
  },
  countdownBoxMinutes: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  countdownBoxSeconds: {
    backgroundColor: 'rgba(234, 179, 8, 0.8)',
  },
  countdownNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  countdownLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 1,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // ✅ Canlı Maç Stilleri - Kompakt tasarım (maç kartı yüksekliği tutarlı olsun)
  liveScoreBox: {
    backgroundColor: '#0F2A24',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  liveScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1FA2A6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveMinuteText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ef4444',
  },
  halftimeText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  
  // Content
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 210 : 175,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  
  // Placeholder
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderCard: {
    alignItems: 'center',
    backgroundColor: '#1A3A34', // ✅ Design System: Koyu yeşil kart
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)', // ✅ Turkuaz border
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Bottom Navigation Overlay - BottomNavigation ile aynı stil
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#0F2A24', // ✅ BottomNavigation ile aynı renk
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1, // ✅ Turkuaz ince border
    borderTopColor: 'rgba(31, 162, 166, 0.2)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4), 0 -2px 8px rgba(31, 162, 166, 0.15)',
      },
    }),
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative', // ✅ activeIndicator için
  },
  // ✅ Active Indicator - BottomNavigation gibi alt çizgi
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#1FA2A6',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B', // ✅ BottomNavigation ile aynı
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#1FA2A6', // ✅ Design System: Secondary/Turkuaz
    fontWeight: '600',
  },
  
  // Loading & Error
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1FA2A6', // ✅ Design System: Secondary/Turkuaz
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
