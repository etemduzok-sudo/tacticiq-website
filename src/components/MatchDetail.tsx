// src/components/MatchDetail.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
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
// MatchSummary artık kullanılmıyor - Özet bilgileri biten maç kartlarında gösteriliyor
// import { MatchSummary } from './match/MatchSummary';
import { AnalysisFocusModal, AnalysisFocusType } from './AnalysisFocusModal';
import { ConfirmModal } from './ui/ConfirmModal';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../config/constants';
import { predictionsDb } from '../services/databaseService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, COLORS, SPACING, SIZES } from '../theme/theme';
import { getTeamColors as getTeamColorsUtil } from '../utils/teamColors';
import { isMockTestMatch, MOCK_MATCH_IDS, getMatch1Start, getMatch2Start, MATCH_1_EVENTS, MATCH_2_EVENTS, computeLiveState } from '../data/mockTestData';

interface MatchDetailProps {
  matchId: string;
  onBack: () => void;
  initialTab?: string; // ✅ Başlangıç sekmesi (squad, prediction, live, stats, ratings, summary)
  analysisFocus?: string; // ✅ Analiz odağı (defense, offense, midfield, physical, tactical, player)
  preloadedMatch?: any; // ✅ Dashboard'dan gelen maç verisi (API çağrısını atlar)
  forceResultSummary?: boolean; // ✅ Biten maçlar için sonuç özetini zorla göster
  predictionTeamId?: number; // ✅ İki favori takım maçında hangi takım için tahmin yapılacağı
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

export function MatchDetail({ matchId, onBack, initialTab = 'squad', analysisFocus, preloadedMatch, forceResultSummary, predictionTeamId }: MatchDetailProps) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = windowWidth < 420;
  const centerInfoMinWidth = isNarrow ? 100 : 160;
  const countdownPadding = isNarrow ? 4 : 8;

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

  // ✅ Kaydedilmemiş değişiklik kontrolü - Tahmin sekmesi
  const [predictionHasUnsavedChanges, setPredictionHasUnsavedChanges] = useState(false);
  const [predictionSaveFn, setPredictionSaveFn] = useState<(() => Promise<void>) | null>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null);

  // ✅ Kaydedilmemiş değişiklik kontrolü - Kadro sekmesi
  const [squadHasUnsavedChanges, setSquadHasUnsavedChanges] = useState(false);
  const [showSquadUnsavedModal, setShowSquadUnsavedModal] = useState(false);
  const [pendingBackAction, setPendingBackAction] = useState(false);

  // ✅ Memoize onHasUnsavedChanges callback to prevent infinite re-renders
  const handleHasUnsavedChanges = useCallback((hasChanges: boolean, saveFn: () => Promise<void>) => {
    setPredictionHasUnsavedChanges(hasChanges);
    setPredictionSaveFn(() => saveFn);
  }, []);

  // ✅ Kadro için unsaved changes callback
  const handleSquadUnsavedChanges = useCallback((hasChanges: boolean) => {
    setSquadHasUnsavedChanges(hasChanges);
  }, []);

  // ✅ Geri dönme kontrolü - kaydedilmemiş değişiklik varsa uyarı göster
  const handleBackPress = useCallback(() => {
    if (activeTab === 'squad' && squadHasUnsavedChanges) {
      setShowSquadUnsavedModal(true);
      setPendingBackAction(true);
      return;
    }
    onBack();
  }, [activeTab, squadHasUnsavedChanges, onBack]);

  // ✅ İki favori takım maçı: ev sahibi ve deplasman favorilerde
  // ✅ Dashboard'dan gelen predictionTeamId prop'unu kullan, yoksa null
  const [selectedPredictionTeamId, setSelectedPredictionTeamId] = useState<number | null>(
    predictionTeamId !== undefined ? predictionTeamId : null
  );
  // ✅ "Hangi favori takıma tahmin yapmak istersiniz?" modal'ı kaldırıldı (Dashboard'da zaten seçim yapılıyor)
  // ✅ "Diğer takım için de tahmin yapmak ister misiniz?" modal'ı kaldırıldı
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
      // ✅ Analiz odağı seçildikten sonra modal'ı kapat (geri dönüşte tekrar açılmasını önle)
      setShowAnalysisFocusModal(false);
    }
  }, [effectiveAnalysisFocus]);
  
  // ✅ Analiz odağı seçildikten sonra geri dönüşte modal'ın tekrar açılmasını önle
  // Sadece gerçekten atak formasyonu değiştiğinde modal açılmalı
  React.useEffect(() => {
    // Eğer analiz odağı zaten seçilmişse, modal'ı açma
    if (effectiveAnalysisFocus && showAnalysisFocusModal) {
      setShowAnalysisFocusModal(false);
    }
  }, [effectiveAnalysisFocus, showAnalysisFocusModal]);
  
  // ✅ Mock maçlar için sabit başlangıç zamanı (her render'da yeniden hesaplanmaması için)
  const mockMatchStartTimeRef = React.useRef<number | null>(null);
  
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
  const { match: apiMatch, statistics, events, lineups: apiLineups, loading: apiLoading, error } = useMatchDetails(
    shouldFetchFromApi ? Number(matchId) : 0 // 0 = API çağrısı yapılmaz
  );
  
  // ✅ preloadedMatch varsa onu kullan, yoksa API'den gelen veriyi kullan
  const match = preloadedMatch || apiMatch;
  const loading = shouldFetchFromApi ? apiLoading : false;
  
  // ✅ Mock maçlar için sabit başlangıç zamanı (her render'da yeniden hesaplanmaması için)
  // Bu useEffect'i match yüklendikten sonra çalıştır
  React.useEffect(() => {
    if (isMockTestMatch(Number(matchId)) && mockMatchStartTimeRef.current === null) {
      // İlk render'da timestamp'i sabitle
      // Öncelik sırası: preloadedMatch > match > getMatch1Start()
      let timestampToUse: number | null = null;
      
      if (preloadedMatch?.fixture?.timestamp) {
        // preloadedMatch'ten gelen timestamp saniye cinsinden, milisaniyeye çevir
        timestampToUse = preloadedMatch.fixture.timestamp * 1000;
        console.log('📌 preloadedMatch.timestamp kullanılıyor:', new Date(timestampToUse).toISOString());
      } else if (preloadedMatch?.fixture?.date) {
        // date varsa onu kullan
        timestampToUse = new Date(preloadedMatch.fixture.date).getTime();
        console.log('📌 preloadedMatch.date kullanılıyor:', new Date(timestampToUse).toISOString());
      } else if (match?.fixture?.timestamp) {
        // match yüklendikten sonra timestamp'i sabitle
        timestampToUse = match.fixture.timestamp * 1000;
        console.log('📌 match.timestamp kullanılıyor:', new Date(timestampToUse).toISOString());
      } else if (match?.fixture?.date) {
        // date varsa onu kullan
        timestampToUse = new Date(match.fixture.date).getTime();
        console.log('📌 match.date kullanılıyor:', new Date(timestampToUse).toISOString());
      } else {
        // Hiçbiri yoksa getMatch1Start() kullan
        timestampToUse = getMatch1Start();
        console.log('📌 getMatch1Start() kullanılıyor:', new Date(timestampToUse).toISOString());
      }
      
      // Timestamp'i sabitle
      if (timestampToUse !== null) {
        mockMatchStartTimeRef.current = timestampToUse;
        const remainingSeconds = Math.floor((timestampToUse - Date.now()) / 1000);
        console.log('🔒 Mock maç timestamp sabitlendi:', new Date(timestampToUse).toISOString(), 'Kalan süre:', remainingSeconds, 'saniye');
      }
    }
  }, [matchId, preloadedMatch, match]);
  
  // ✅ Canlı maçta otomatik olarak canlı sekmesine yönlendir
  React.useEffect(() => {
    if (!match || initialTabSet) return;
    
    const matchStatus = match?.fixture?.status?.short || match?.status || '';
    const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(matchStatus);
    
    if (isLive && initialTab !== 'live') {
      // Canlı maçta ve henüz canlı sekmesine geçilmemişse, canlı sekmesine yönlendir
      setActiveTab('live');
      setInitialTabSet(true);
    } else {
      setInitialTabSet(true);
    }
  }, [match, initialTab, initialTabSet]);
  
  // ✅ Lineups state - her zaman kullanılabilir
  const [manualLineups, setManualLineups] = React.useState<any>(null);
  const lineups = apiLineups || manualLineups;
  
  // ✅ preloadedMatch varken de lineups'ı çek (arka planda)
  React.useEffect(() => {
    if (preloadedMatch && matchId && !apiLineups) {
      const fetchLineups = async () => {
        try {
          const response = await api.matches.getMatchLineups(Number(matchId));
          if (response?.success && response?.data) {
            setManualLineups(response.data);
          }
        } catch (e) {
          // Sessizce başarısız ol
        }
      };
      fetchLineups();
    }
  }, [preloadedMatch, matchId, apiLineups]);

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

  // ✅ Teknik direktör bilgilerini çek (timeout ile hızlı fallback)
  React.useEffect(() => {
    const fetchCoaches = async () => {
      if (!match?.teams?.home?.id || !match?.teams?.away?.id) return;
      
      // ✅ 3 saniye timeout - daha hızlı fallback için
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      try {
        const [homeCoach, awayCoach] = await Promise.allSettled([
          Promise.race([api.teams.getTeamCoach(match.teams.home.id), timeoutPromise]),
          Promise.race([api.teams.getTeamCoach(match.teams.away.id), timeoutPromise]),
        ]);
        
        const homeName = homeCoach.status === 'fulfilled' && (homeCoach.value as any)?.data?.coach?.name 
          ? (homeCoach.value as any).data.coach.name 
          : '';
        const awayName = awayCoach.status === 'fulfilled' && (awayCoach.value as any)?.data?.coach?.name 
          ? (awayCoach.value as any).data.coach.name 
          : '';
        
        // Sadece API'den veri geldiyse güncelle
        if (homeName || awayName) {
          setCoaches({ home: homeName, away: awayName });
          console.log('👔 Coaches loaded from API:', { home: homeName || 'N/A', away: awayName || 'N/A' });
        }
      } catch (error) {
        // Timeout veya hata - fallback listesi kullanılacak
        console.log('⚠️ Coach API timeout/error, using fallback list');
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

  // ✅ Fallback teknik direktör listesi (2026 Ocak güncel)
  const getCoachFallback = (teamName: string): string => {
    if (!teamName) return '';
    const name = teamName.toLowerCase();
    const coaches: Record<string, string> = {
      // Türk Takımları (2026 Ocak güncel)
      'galatasaray': 'Okan Buruk',
      'fenerbahçe': 'Domenico Tedesco',
      'fenerbahce': 'Domenico Tedesco',
      'beşiktaş': 'Sergen Yalçın',
      'besiktas': 'Sergen Yalçın',
      'trabzonspor': 'Şenol Güneş',
      'başakşehir': 'Çağdaş Atan',
      'basaksehir': 'Çağdaş Atan',
      'adana demirspor': 'Vincenzo Montella',
      'konyaspor': 'Recep Uçar',
      'antalyaspor': 'Alex de Souza',
      'sivasspor': 'Bülent Uygun',
      'kasımpaşa': 'Kemal Özdeş',
      'kasimpasa': 'Kemal Özdeş',
      'alanyaspor': 'Fatih Tekke',
      'kayserispor': 'Burak Yılmaz',
      'samsunspor': 'Thomas Reis',
      'hatayspor': 'Serkan Özbalta',
      'pendikspor': 'Ivo Vieira',
      'karagümrük': 'Emre Belözoğlu',
      'karagumruk': 'Emre Belözoğlu',
      'istanbulspor': 'Osman Zeki Korkmaz',
      'rizespor': 'İlhan Palut',
      'gaziantep': 'Selçuk İnan',
      // Avrupa Takımları
      'real madrid': 'Carlo Ancelotti',
      'barcelona': 'Hansi Flick',
      'atletico madrid': 'Diego Simeone',
      'bayern': 'Vincent Kompany',
      'manchester city': 'Pep Guardiola',
      'manchester united': 'Ruben Amorim',
      'liverpool': 'Arne Slot',
      'arsenal': 'Mikel Arteta',
      'chelsea': 'Enzo Maresca',
      'juventus': 'Thiago Motta',
      'inter': 'Simone Inzaghi',
      'milan': 'Sergio Conceição',
      'psg': 'Luis Enrique',
      'paris saint-germain': 'Luis Enrique',
    };
    for (const [key, coach] of Object.entries(coaches)) {
      if (name.includes(key)) return coach;
    }
    return '';
  };

  // Teknik direktör: önce coaches API, yoksa lineups'tan al, yoksa fallback
  const getManagerFromLineups = (teamId: number) => {
    const arr = Array.isArray(lineups) ? lineups : lineups?.data;
    if (!arr?.length) return '';
    const lineup = arr.find((l: any) => l.team?.id === teamId);
    const coach = lineup?.coach;
    if (typeof coach === 'string') return coach;
    if (coach?.name) return coach.name;
    return '';
  };
  const homeManager = coaches.home || getManagerFromLineups(match?.teams?.home?.id) || getCoachFallback(match?.teams?.home?.name);
  const awayManager = coaches.away || getManagerFromLineups(match?.teams?.away?.id) || getCoachFallback(match?.teams?.away?.name);

  // ✅ Maç canlı mı kontrol et
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO']; // Biten maç statüleri
  // ✅ Mock maçlar için gerçek zamandan status belirle - countdownTicker ile her saniye güncellensin
  const matchStatus = useMemo(() => {
    const apiStatus = match?.fixture?.status?.short || '';
    if (!isMockTestMatch(Number(matchId))) {
      return apiStatus;
    }
    // Mock maçlar için gerçek zamandan kontrol et
    const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
    const now = Date.now();
    const elapsedMs = now - matchStart;
    const elapsedSeconds = elapsedMs / 1000;
    const elapsedMinutes = Math.floor(elapsedSeconds);
    
    if (elapsedMinutes < 0) {
      return 'NS'; // Not Started
    } else if (elapsedMinutes >= 112) {
      return 'FT'; // Finished
    } else if (elapsedMinutes < 45) {
      return '1H'; // First Half
    } else if (elapsedMinutes <= 48) {
      return '1H'; // First Half Extra Time
    } else if (elapsedMinutes < 60) {
      return 'HT'; // Half Time
    } else if (elapsedMinutes < 90) {
      return '2H'; // Second Half
    } else if (elapsedMinutes <= 94) {
      return '2H'; // Second Half Extra Time
    } else {
      return 'FT'; // Finished
    }
  }, [matchId, match?.fixture?.status?.short, countdownTicker]); // ✅ countdownTicker: mock maçlar için her saniye güncelle
  const isMatchLive = LIVE_STATUSES.includes(matchStatus);
  const isMatchFinished = FINISHED_STATUSES.includes(matchStatus);
  // ✅ Mock maçlarda dakika her saniye güncellenir (countdownTicker ile); yoksa API'den gelen elapsed
  const rawMatchMinute = match?.fixture?.status?.elapsed ?? 0;
  // ✅ Dakika, uzatma ve salise hesaplama (mock maçlarda gerçek zamandan)
  const { matchMinute, matchExtraTime, matchSecond } = (() => {
    if (!matchId || !match?.fixture) return { matchMinute: rawMatchMinute, matchExtraTime: null, matchSecond: 0 };
    if (!isMockTestMatch(Number(matchId))) {
      // Gerçek maçlar için API'den gelen extraTime bilgisini kullan
      const extraTime = match?.fixture?.status?.extraTime ?? null;
      return { matchMinute: rawMatchMinute, matchExtraTime: extraTime, matchSecond: 0 };
    }
    
    const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
    const now = Date.now();
    const elapsedMs = now - matchStart;
    const elapsedSeconds = elapsedMs / 1000; // Ondalıklı saniye (örn: 5.234)
    const elapsedMinutes = Math.floor(elapsedSeconds); // Tam dakika (örn: 5)
    const salise = Math.floor((elapsedSeconds - elapsedMinutes) * 100); // Salise (0-99)
    
    if (elapsedMinutes < 0) {
      return { matchMinute: 0, matchExtraTime: null, matchSecond: 0 };
    }
    if (elapsedMinutes >= 112) {
      return { matchMinute: 90, matchExtraTime: 4, matchSecond: 0 };
    }
    
    // ✅ İlk yarı: 0-45 dk (normal)
    if (elapsedMinutes < 45) {
      return { matchMinute: elapsedMinutes, matchExtraTime: null, matchSecond: salise };
    }
    
    // ✅ İlk yarı uzatması: 45-48 dk → "45+1", "45+2", "45+3" formatında
    if (elapsedMinutes <= 48) {
      const extraTime = elapsedMinutes - 45;
      return { matchMinute: 45, matchExtraTime: extraTime, matchSecond: salise };
    }
    
    // ✅ Devre arası: 48-60 dk (15 saniye = 15 dakika simülasyon)
    if (elapsedMinutes < 60) {
      return { matchMinute: 45, matchExtraTime: 3, matchSecond: 0 };
    }
    
    // ✅ İkinci yarı: 60-90 dk → 46. dk'dan başlar (45+3'ten sonra)
    if (elapsedMinutes < 90) {
      const secondHalfMinute = 46 + (elapsedMinutes - 60); // 60. dk = 46. dk
      return { matchMinute: secondHalfMinute, matchExtraTime: null, matchSecond: salise };
    }
    
    // ✅ İkinci yarı uzatması: 90-94 dk → "90+1", "90+2", "90+3", "90+4" formatında
    if (elapsedMinutes <= 94) {
      const extraTime = elapsedMinutes - 90;
      return { matchMinute: 90, matchExtraTime: extraTime, matchSecond: salise };
    }
    
    return { matchMinute: 90, matchExtraTime: 4, matchSecond: 0 };
  })();
  // ✅ Mock maçlarda skorları gerçek zamandan hesapla (goller eventlerden gelir)
  const { homeScore: computedHomeScore, awayScore: computedAwayScore, halftimeScore: computedHalftimeScore } = (() => {
    if (!matchId || !match?.fixture || !isMockTestMatch(Number(matchId))) {
      return {
        homeScore: match?.goals?.home ?? 0,
        awayScore: match?.goals?.away ?? 0,
        halftimeScore: match?.score?.halftime || null,
      };
    }
    
    const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
    const events = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? MATCH_1_EVENTS : MATCH_2_EVENTS;
    
    // ✅ Güvenlik kontrolü: events undefined olabilir
    if (!events || !Array.isArray(events)) {
      return {
        homeScore: match?.goals?.home ?? 0,
        awayScore: match?.goals?.away ?? 0,
        halftimeScore: match?.score?.halftime || null,
      };
    }
    
    const state = computeLiveState(matchStart, events);
    
    // İlk yarı skorunu hesapla (45. dakikaya kadar olan goller)
    const firstHalfEvents = events.filter(e => e.minuteOffset <= 45 && e.type === 'Goal');
    const firstHalfHomeGoals = firstHalfEvents.filter(e => e.teamSide === 'home').length;
    const firstHalfAwayGoals = firstHalfEvents.filter(e => e.teamSide === 'away').length;
    
    return {
      homeScore: state.homeGoals ?? 0,
      awayScore: state.awayGoals ?? 0,
      halftimeScore: matchMinute >= 45 ? { home: firstHalfHomeGoals, away: firstHalfAwayGoals } : null,
    };
  })();
  
  const homeScore = computedHomeScore;
  const awayScore = computedAwayScore;
  const halftimeScore = computedHalftimeScore;
  
  // ✅ Biten maçlar için varsayılan sekme (Canlı sekmesi kalır – oynanan maç olayları görünsün)
  React.useEffect(() => {
    if (match && !initialTabSet && initialTab === 'squad') {
      if (isMatchFinished) {
        setActiveTab('stats');
        setInitialTabSet(true);
      }
    }
  }, [match, isMatchFinished, initialTab, initialTabSet]);

  // Transform API data to component format
  // ✅ useMemo ile sarmalayarak mock maçlar için timestamp'i sabitle
  const matchData = useMemo(() => match ? {
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
    date: new Date(match.fixture.date).toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }),
    time: api.utils.formatMatchTime(new Date(match.fixture.date).getTime() / 1000),
    timestamp: (() => {
      // ✅ Mock maçlar için sabit timestamp kullan
      if (isMockTestMatch(Number(matchId))) {
        // Öncelikle mockMatchStartTimeRef.current'i kullan (zaten sabitlenmişse)
        if (mockMatchStartTimeRef.current !== null) {
          return mockMatchStartTimeRef.current / 1000;
        }
        // Henüz sabitlenmemişse, match.fixture.timestamp'i kullan ve sabitle
        // Bu sadece ilk render'da olacak
        const ts = match.fixture.timestamp || new Date(match.fixture.date).getTime() / 1000;
        // Hemen sabitle (synchronous olarak) - sadece bir kez
        mockMatchStartTimeRef.current = ts * 1000;
        console.log('🔒 Mock maç timestamp matchData içinde sabitlendi:', new Date(mockMatchStartTimeRef.current).toISOString(), 'Kalan:', Math.floor((mockMatchStartTimeRef.current - Date.now()) / 1000), 'sn');
        // Sabitlenmiş değeri döndür
        return mockMatchStartTimeRef.current / 1000;
      }
      // Normal maçlar için match.fixture.timestamp kullan
      return match.fixture.timestamp || new Date(match.fixture.date).getTime() / 1000;
    })(), // ✅ Geri sayım için
    // ✅ Canlı maç bilgileri
    isLive: isMatchLive,
    minute: matchMinute,
    extraTime: matchExtraTime, // ✅ Uzatma dakikası (null veya 1-4 arası)
    second: matchSecond, // ✅ Salise bilgisi (0-99)
    homeScore: homeScore,
    awayScore: awayScore,
    halftimeScore: halftimeScore,
    status: matchStatus,
  } : null, [
    // ✅ match objesini dependency'den çıkar çünkü her render'da değişiyor
    // Sadece gerçekten değişmesi gereken değerleri ekle
    match?.fixture?.id, // Match ID değiştiğinde yeniden hesapla
    match?.teams?.home?.id,
    match?.teams?.away?.id,
    match?.teams?.home?.name,
    match?.teams?.away?.name,
    match?.league?.name,
    match?.fixture?.venue?.name,
    match?.fixture?.date, // Date değiştiğinde yeniden hesapla
    homeManager,
    awayManager,
    isMatchLive,
    matchMinute,
    matchExtraTime, // ✅ Uzatma dakikası
    matchSecond, // ✅ Salise bilgisi
    homeScore,
    awayScore,
    halftimeScore,
    matchStatus,
    matchId,
    // ✅ Mock maçlarda dakika ve skor her saniye güncellensin (countdownTicker her saniye artar)
    countdownTicker, // Skorlar da bu ticker'a bağlı (homeScore, awayScore, halftimeScore, matchStatus)
    mockMatchStartTimeRef.current,
    matchStatus, // ✅ Mock maçlar için status değiştiğinde güncellensin
    ...(isMockTestMatch(Number(matchId)) ? [] : [match?.fixture?.timestamp]),
  ]);
  
  // ✅ Geri sayım hesaplama - useMemo ile optimize et
  const countdownData = useMemo(() => {
    // countdownTicker'ı kullanarak her saniye güncellemeyi tetikle
    const _ = countdownTicker;
    
    const now = Date.now() / 1000;
    let matchTime: number | null = null;
    
    // ✅ Mock maçlar için özel geri sayım: Sabit başlangıç zamanını kullan
    if (isMockTestMatch(Number(matchId))) {
      // Sadece mockMatchStartTimeRef.current'i kullan (useEffect'te sabitlenmiş olmalı)
      if (mockMatchStartTimeRef.current !== null) {
        matchTime = mockMatchStartTimeRef.current / 1000;
      } else {
        // Henüz sabitlenmemişse, null döndür (useEffect henüz çalışmamış)
        return null;
      }
    } else {
      // Normal maçlar için matchData.timestamp kullan
      if (!matchData?.timestamp) return null;
      matchTime = matchData.timestamp;
    }
    
    if (matchTime === null) return null;
    
    const timeDiff = matchTime - now;
    
    // Debug log - her 5 saniyede bir
    if (isMockTestMatch(Number(matchId)) && countdownTicker % 5 === 0) {
      console.log('⏱️ Geri sayım:', {
        matchTime: new Date(matchTime * 1000).toISOString(),
        now: new Date(now * 1000).toISOString(),
        timeDiff: Math.floor(timeDiff),
        seconds: Math.floor(timeDiff % 60),
        minutes: Math.floor((timeDiff % 3600) / 60),
        mockRef: mockMatchStartTimeRef.current ? new Date(mockMatchStartTimeRef.current).toISOString() : 'null',
        countdownTicker,
      });
    }
    
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
  }, [
    countdownTicker, // ✅ Her saniye güncelle (bu sayede geri sayım her saniye yeniden hesaplanır)
    matchId,
    // ✅ Normal maçlar için matchData?.timestamp'i dependency'ye ekle
    // Mock maçlar için mockMatchStartTimeRef.current'i dependency'ye ekleme (ref olduğu için çalışmaz)
    // Bunun yerine countdownTicker her saniye değiştiği için countdownData her saniye yeniden hesaplanacak
    // ve mockMatchStartTimeRef.current her seferinde okunacak
    isMockTestMatch(Number(matchId)) ? null : matchData?.timestamp,
  ]);

  // ✅ İki favori takım maçı: ev sahibi ve deplasman favorilerde
  const homeId = matchData?.teams?.home?.id ?? matchData?.homeTeam?.id;
  const awayId = matchData?.teams?.away?.id ?? matchData?.awayTeam?.id;
  const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);

  // ✅ Dashboard'dan gelen predictionTeamId prop'unu selectedPredictionTeamId'ye set et
  React.useEffect(() => {
    if (predictionTeamId !== undefined) {
      setSelectedPredictionTeamId(predictionTeamId ?? null);
    }
  }, [predictionTeamId]);
  
  // ✅ "Hangi favori takıma tahmin yapmak istersiniz?" modal'ı kaldırıldı
  // Dashboard'da zaten maç kartına tıklayınca takım seçimi yapılıyor

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
    // ✅ predictionTeamId prop'u varsa onu kullan, yoksa selectedPredictionTeamId state'ini kullan
    const effectivePredictionTeamId = predictionTeamId !== undefined && predictionTeamId !== null
      ? predictionTeamId 
      : (bothFavorites ? selectedPredictionTeamId : null);
    const predictionTeamIdForProps = bothFavorites ? (effectivePredictionTeamId ?? undefined) : undefined;

    switch (activeTab) {
      case 'squad':
        if (bothFavorites && !effectivePredictionTeamId) {
          return (
            <View style={styles.centerContent}>
              <Text style={styles.placeholderText}>Hangi takım için kadro seçeceğinizi yukarıdaki pencereden seçin.</Text>
            </View>
          );
        }
        return (
          <MatchSquad
            key={`squad-${matchId}-${predictionTeamIdForProps ?? 'all'}`}
            matchData={matchData}
            matchId={matchId}
            lineups={lineups}
            favoriteTeamIds={favoriteTeamIds}
            predictionTeamId={predictionTeamIdForProps}
            onComplete={() => setActiveTab('prediction')}
            onAttackFormationChangeConfirmed={() => {
              // ✅ Sadece analiz odağı seçilmemişse modal'ı aç
              // Analiz odağı zaten seçilmişse tekrar açma
              if (!effectiveAnalysisFocus) {
                setShowAnalysisFocusModal(true);
              }
            }}
            isVisible={activeTab === 'squad'}
            isMatchFinished={isMatchFinished}
            isMatchLive={isMatchLive}
            onHasUnsavedChanges={handleSquadUnsavedChanges}
          />
        );
      
      case 'prediction':
        if (bothFavorites && !effectivePredictionTeamId) {
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
            predictionTeamId={predictionTeamIdForProps}
            isMatchLive={isMatchLive}
            isMatchFinished={isMatchFinished}
            initialAnalysisFocus={effectiveAnalysisFocus}
            lineups={lineups}
            favoriteTeamIds={favoriteTeamIds}
            onPredictionsSaved={() => checkPredictions(homeId, awayId, bothFavorites)}
            onPredictionsSavedForTeam={async (savedTeamId) => {
              // ✅ "Diğer takım için de tahmin yapmak ister misiniz?" popup'ı kaldırıldı
              // Artık kullanıcı maç kartına tıklayınca baştan takım seçimi yapacak
              await checkPredictions(homeId, awayId, bothFavorites);
            }}
            onHasUnsavedChanges={handleHasUnsavedChanges}
          />
        );
      
      case 'live':
        return <MatchLive matchData={matchData} matchId={matchId} events={events} />;
      
      case 'stats':
        return <MatchStats matchData={matchData} matchId={matchId} />;
      
      case 'ratings':
        return <MatchRatings matchData={matchData} lineups={lineups} favoriteTeamIds={favoriteTeamIds} />;
      
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
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
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
            <View style={styles.teamNameWrap}>
              <Text style={styles.teamNameLarge} numberOfLines={1} ellipsizeMode="tail">{matchData.homeTeam.name}</Text>
            </View>
            {matchData.homeTeam.manager?.trim() ? (
              <Text style={styles.managerText}>{matchData.homeTeam.manager.trim()}</Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            {/* Canlı veya biten maçta skor göster */}
            {(matchData.isLive || isMatchFinished) && (
              <View style={styles.liveScoreBox}>
                <Text style={styles.liveScoreText}>{matchData.homeScore}</Text>
              </View>
            )}
          </View>

          {/* Center: Canlıda sadece CANLI + dakika (Rule 1/3); biten maçta tarih/saat; başlamamışta geri sayım */}
          <View style={[styles.centerInfo, { minWidth: centerInfoMinWidth, paddingHorizontal: countdownPadding }]}>
            {matchData.isLive ? (
              <>
                {/* CANLI Badge */}
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>CANLI</Text>
                </View>
                {/* Dakika:Salise formatında göster - uzatma varsa "45+3" formatında */}
                <Text style={styles.liveMinuteText}>
                  {matchData.extraTime != null && matchData.extraTime > 0
                    ? `${matchData.minute}+${matchData.extraTime}`
                    : `${matchData.minute}:${String(matchData.second ?? 0).padStart(2, '0')}`}
                </Text>
                {/* İlk yarı / İkinci yarı bilgisi - skor gösterilmez (zaten takımların altında gösteriliyor) */}
                {/* Mantık: 45+ uzatma dakikaları İLK YARIYA dahil, 90+ uzatma dakikaları İKİNCİ YARIYA dahil */}
                <Text style={styles.halftimeText}>
                  {(matchData.minute ?? 0) < 46 || ((matchData.minute ?? 0) === 45 && matchData.extraTime != null)
                    ? 'İlk Yarı' 
                    : 'İkinci Yarı'}
                </Text>
              </>
            ) : isMatchFinished ? (
              <>
                <Text style={styles.dateText}>● {matchData.date}</Text>
                <Text style={styles.liveMinuteText}>
                  {matchData.minute ?? 90}:{String(matchData.second ?? 0).padStart(2, '0')}
                </Text>
              </>
            ) : (
              <>
                {/* Tarih - Dashboard stili ile aynı */}
                <View style={styles.dateInfoRow}>
                  <Ionicons name="time" size={9} color="#94A3B8" />
                  <Text style={styles.dateText}>{matchData.date}</Text>
                </View>
                
                {/* Saat Badge - Dashboard stili ile aynı */}
                <LinearGradient
                  colors={['#1FA2A6', '#047857']}
                  style={styles.timeBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.timeBadgeText}>{matchData.time}</Text>
                </LinearGradient>
                
                {/* Countdown - Dashboard stili ile aynı */}
                {countdownData && countdownData.type === 'countdown' && (
                  <View style={styles.countdownRow}>
                    <LinearGradient
                      colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                      style={styles.countdownBox}
                    >
                      <Text style={styles.countdownNumber}>{String(countdownData.hours).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Saat</Text>
                    </LinearGradient>
                    
                    <Text style={[styles.countdownSeparator, { color: countdownData.color }]}>:</Text>
                    
                    <LinearGradient
                      colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                      style={styles.countdownBox}
                    >
                      <Text style={styles.countdownNumber}>{String(countdownData.minutes).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Dakika</Text>
                    </LinearGradient>
                    
                    <Text style={[styles.countdownSeparator, { color: countdownData.color }]}>:</Text>
                    
                    <LinearGradient
                      colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                      style={styles.countdownBox}
                    >
                      <Text style={styles.countdownNumber}>{String(countdownData.seconds).padStart(2, '0')}</Text>
                      <Text style={styles.countdownLabel}>Saniye</Text>
                    </LinearGradient>
                  </View>
                )}
                {countdownData && countdownData.type === 'days' && (
                  <LinearGradient
                    colors={['#f97316', '#ea580c']}
                    style={styles.daysRemainingBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.daysRemainingText}>
                      MAÇA {countdownData.days} GÜN KALDI
                    </Text>
                  </LinearGradient>
                )}
              </>
            )}
          </View>

          {/* Away Team */}
          <View style={[styles.teamSide, styles.teamSideAway]}>
            <View style={styles.teamNameWrap}>
              <Text style={styles.teamNameLarge} numberOfLines={1} ellipsizeMode="tail">{matchData.awayTeam.name}</Text>
            </View>
            {matchData.awayTeam.manager?.trim() ? (
              <Text style={styles.managerText}>{matchData.awayTeam.manager.trim()}</Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            {/* Canlı veya biten maçta skor göster */}
            {(matchData.isLive || isMatchFinished) && (
              <View style={styles.liveScoreBox}>
                <Text style={styles.liveScoreText}>{matchData.awayScore}</Text>
              </View>
            )}
          </View>
        </View>
        </View>
      </View>

      {/* Tab Content – flex ile bar'ın üstünde biter, bar içeriği kesmez */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Bottom Navigation – overlay değil, akışta; bilgi kutusunu kesmez */}

      {/* ✅ Kadro kaydedilmemiş değişiklik uyarısı - geri dönme veya sekme değiştirme */}
      {showSquadUnsavedModal && (
        <ConfirmModal
          visible={true}
          title="Kaydedilmemiş Değişiklikler"
          message="Kadronuzda kaydedilmemiş değişiklikler var. Çıkmadan önce 'Tamamla' butonuna basarak kaydetmelisiniz, yoksa değişiklikler kaybolacak."
          buttons={[
            { 
              text: 'Geri Dön', 
              style: 'cancel', 
              onPress: () => { 
                setShowSquadUnsavedModal(false); 
                setPendingBackAction(false);
                setPendingTabChange(null);
              } 
            },
            { 
              text: 'Kaydetmeden Çık', 
              style: 'destructive', 
              onPress: () => { 
                setShowSquadUnsavedModal(false); 
                setPendingBackAction(false);
                // Sekme değişiyorsa sekmeyi değiştir, değilse geri dön
                if (pendingTabChange) {
                  setActiveTab(pendingTabChange);
                  setPendingTabChange(null);
                } else {
                  onBack();
                }
              } 
            },
          ]}
          onRequestClose={() => { setShowSquadUnsavedModal(false); setPendingBackAction(false); setPendingTabChange(null); }}
        />
      )}

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
      {/* ✅ "Hangi favori takıma tahmin yapmak istersiniz?" modal'ı kaldırıldı */}
      {/* Dashboard'da zaten maç kartına tıklayınca takım seçimi yapılıyor */}

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
      {/* ✅ "Diğer takım için de tahmin yapmak ister misiniz?" modal'ı kaldırıldı */}

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

      <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                // ✅ Kadro sekmesinden ayrılırken kaydedilmemiş değişiklik kontrolü
                if (activeTab === 'squad' && tab.id !== 'squad' && squadHasUnsavedChanges) {
                  setPendingTabChange(tab.id);
                  setShowSquadUnsavedModal(true);
                  return;
                }
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
  
  // Match Card Overlay - Dashboard canlı maç kartı ile aynı yükseklik (~158px içerik + status bar)
  matchCardOverlay: {
    position: 'absolute',
    top: 0, // ✅ Ekranın en üstünden başla
    left: 0,
    right: 0,
    zIndex: 9999,
    // ✅ Dashboard kartı minHeight: 158 kullanıyor; biz içerik + status bar padding
    height: Platform.OS === 'ios' ? 200 : Platform.OS === 'web' ? 158 : 170, // iOS: 44 + 156, Web: 158, Android: 12 + 158
    backgroundColor: '#0F2A24', // ✅ ProfileCard ile aynı renk
    borderTopLeftRadius: 0, // ✅ Üst köşeler düz (ProfileCard gibi)
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12, // ✅ ProfileCard ile aynı (25 değil 12)
    borderBottomRightRadius: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : Platform.OS === 'web' ? 8 : 12, // Status bar için padding
    paddingBottom: 8,
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
    marginBottom: 6,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadges: {
    alignItems: 'center',
    gap: 3,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    minWidth: 0,
    alignItems: 'center',
  },
  teamSideAway: {},
  teamNameWrap: {
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
  },
  teamNameLarge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 2,
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
    paddingVertical: 6,
    minWidth: 100,
    flexShrink: 0,
  },
  // ✅ Tarih satırı - Dashboard stili
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  // ✅ Saat badge - Dashboard stili
  timeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  timeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ✅ Geri sayım - Dashboard stili
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 36,
  },
  countdownNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  countdownLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 1,
  },
  countdownSeparator: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ✅ Gün kaldı badge - Dashboard stili
  daysRemainingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  daysRemainingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // ✅ Canlı Maç Stilleri - Dashboard ile uyumlu (fontSize 16)
  liveScoreBox: {
    backgroundColor: '#0F2A24',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 26, // ✅ Sabit yükseklik - Dashboard ile aynı
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#334155',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(30, 41, 59, 0.3)',
      },
    }),
  },
  liveScoreText: {
    fontSize: 14, // ✅ Dashboard ile aynı
    fontWeight: 'bold',
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
    fontSize: 16, // Dashboard: 16
    fontWeight: '800',
    color: '#ef4444',
  },
  halftimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8', // Daha açık gri - daha okunabilir
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Content – bar artık akışta; alt boşluk yok (her tab kendi paddingBottom'unu yönetir)
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 208 : Platform.OS === 'web' ? 166 : 178, // ✅ Kart yüksekliği + 8px boşluk
    paddingBottom: 0,
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
  
  // Bottom Navigation – overlay değil, layout akışında; üst çizgi yok (kesilme olmasın)
  bottomNavBar: {
    backgroundColor: '#0F2A24',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 0,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.25)',
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
