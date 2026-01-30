// src/components/MatchDetail.tsx
import React, { useState } from 'react';
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
import { MatchSummary } from './match/MatchSummary';
import { AnalysisFocusModal, AnalysisFocusType } from './AnalysisFocusModal';
import { ConfirmModal } from './ui/ConfirmModal';
import { STORAGE_KEYS } from '../config/constants';
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
  { id: 'summary', label: 'Özet', icon: 'document-text' },
];

export function MatchDetail({ matchId, onBack, initialTab = 'squad', analysisFocus, preloadedMatch }: MatchDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [coaches, setCoaches] = useState<{ home: string; away: string }>({ home: '', away: '' });
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  const { favoriteTeams } = useFavoriteTeams();
  const favoriteTeamIds = React.useMemo(() => favoriteTeams?.map(t => t.id) ?? [], [favoriteTeams]);
  const [showAnalysisFocusModal, setShowAnalysisFocusModal] = useState(false);
  const [analysisFocusOverride, setAnalysisFocusOverride] = useState<AnalysisFocusType | null>(null);
  const [showResetPredictionsModal, setShowResetPredictionsModal] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const effectiveAnalysisFocus = analysisFocusOverride ?? analysisFocus;

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
        const alt1 = `fan-manager-predictions-${matchId}-${homeId}`;
        const alt2 = `fan-manager-predictions-${matchId}-${awayId}`;
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
        || await AsyncStorage.getItem(`fan-manager-predictions-${matchId}`);
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
        await AsyncStorage.removeItem(`fan-manager-predictions-${matchId}-${teamToReset}`);
        const squadKey = `fan-manager-squad-${matchId}-${teamToReset}`;
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
        await AsyncStorage.removeItem(`fan-manager-predictions-${matchId}`);
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
        const squadKey = `fan-manager-squad-${matchId}`;
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

  // Transform API data to component format
  const matchData = match ? {
    id: match.fixture.id.toString(),
    homeTeam: {
      id: match.teams.home.id, // ✅ Team ID eklendi
      name: match.teams.home.name,
      logo: match.teams.home.logo || '⚽',
      color: getTeamColors(match.teams.home),
      manager: coaches.home || '', // ✅ Teknik direktör API'den
    },
    awayTeam: {
      id: match.teams.away.id, // ✅ Team ID eklendi
      name: match.teams.away.name,
      logo: match.teams.away.logo || '⚽',
      color: getTeamColors(match.teams.away),
      manager: coaches.away || '', // ✅ Teknik direktör API'den
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
            onPredictionsSaved={() => checkPredictions(homeId, awayId, bothFavorites)}
            onPredictionsSavedForTeam={(savedTeamId) => {
              checkPredictions(homeId, awayId, bothFavorites);
              if (bothFavorites && savedTeamId != null) {
                const otherId = savedTeamId === homeId ? awayId : homeId;
                setOtherTeamIdForOffer(otherId ?? null);
                setShowOfferOtherTeamModal(true);
              }
            }}
          />
        );
      
      case 'live':
        return <MatchLive matchData={matchData} matchId={matchId} events={events} />;
      
      case 'stats':
        return <MatchStats matchData={matchData} />;
      
      case 'ratings':
        return <MatchRatings matchData={matchData} />;
      
      case 'summary':
        return <MatchSummary matchData={matchData} />;
      
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
        {/* League Header with Back Button */}
        <View style={styles.leagueHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.leagueBadge}>
            <Ionicons name="trophy" size={14} color="#1FA2A6" />
            <Text style={styles.leagueText}>{matchData.league}</Text>
          </View>

          {hasPrediction && (
            <TouchableOpacity
              onPress={() => {
                if (bothFavorites) setShowResetTeamPickerModal(true);
                else setShowResetPredictionsModal(true);
              }}
              style={styles.starButton}
              hitSlop={12}
              accessibilityLabel="Tahminleri silmek istiyor musunuz?"
            >
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text style={styles.starButtonText}>Tahmin{'\n'}Yapıldı</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchData.homeTeam.name}</Text>
            {matchData.homeTeam.manager ? (
              <Text style={styles.managerName}>{matchData.homeTeam.manager}</Text>
            ) : null}
          </View>

          {/* Time & Stadium & Countdown */}
          <View style={styles.vsContainer}>
            <Text style={styles.matchTime}>{matchData.time}</Text>
            <Text style={styles.matchDate}>{matchData.date}</Text>
            {/* ✅ Geri Sayım - Basit metin olarak */}
            {countdownData && (
              <Text style={[styles.countdownText, { color: countdownData.color }]}>
                {countdownData.type === 'days' 
                  ? `${countdownData.days} gün kaldı`
                  : `${String(countdownData.hours).padStart(2, '0')}:${String(countdownData.minutes).padStart(2, '0')}:${String(countdownData.seconds).padStart(2, '0')}`
                }
              </Text>
            )}
            <View style={styles.stadiumBadge}>
              <Ionicons name="location" size={10} color="#64748B" />
              <Text style={styles.stadiumText}>{matchData.stadium}</Text>
            </View>
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchData.awayTeam.name}</Text>
            {matchData.awayTeam.manager ? (
              <Text style={styles.managerName}>{matchData.awayTeam.manager}</Text>
            ) : null}
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
              onPress={() => setActiveTab(tab.id)}
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
  // ✅ Sol kenar gradient şerit - Daha belirgin
  colorBarLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10, // ✅ 6px → 10px: Daha belirgin
    zIndex: 0,
    borderBottomLeftRadius: 12, // ✅ Overlay ile aynı yuvarlaklık
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  // ✅ Sağ kenar gradient şerit - Daha belirgin
  colorBarRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 10, // ✅ 6px → 10px: Daha belirgin
    zIndex: 0,
    borderBottomRightRadius: 12, // ✅ Overlay ile aynı yuvarlaklık
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.95)', // ✅ Standart: Diğer ekranlarla aynı
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Turkuaz ince border
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 42, 36, 0.95)', // ✅ Standart: Geri tuşuyla aynı
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1FA2A6', // ✅ Design System: Secondary/Turkuaz
  },
  starButton: {
    width: 50,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  starButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 11,
  },
  
  // Match Info
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1FA2A6', // ✅ Design System: Secondary/Turkuaz
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginBottom: 4, // ✅ Eşit boşluk
  },
  matchDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4, // ✅ Eşit boşluk
  },
  stadiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stadiumText: {
    fontSize: 9,
    color: '#64748B',
  },
  
  // ✅ Geri Sayım - Basit metin stili
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4, // ✅ Eşit boşluk
    letterSpacing: 1,
  },
  
  // Content
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 200 : 156,
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
