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
  Alert,
  Modal,
  ScrollView,
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
// CountdownWarningModal kaldırıldı - 120 saniyelik kural artık yok
import { STORAGE_KEYS } from '../config/constants';
import { predictionsDb } from '../services/databaseService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, COLORS, SPACING, SIZES, LIGHT_MODE } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { getTeamColors as getTeamColorsUtil } from '../utils/teamColors';
import { isMockTestMatch, MOCK_MATCH_IDS, getMatch1Start, getMatch2Start, MATCH_1_EVENTS, MATCH_2_EVENTS, computeLiveState, getMockUserTeamId } from '../data/mockTestData';

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

const TAB_IDS = [
  { id: 'squad', icon: 'people' as const },
  { id: 'prediction', icon: 'analytics' as const },
  { id: 'live', icon: 'pulse' as const },
  { id: 'stats', icon: 'bar-chart' as const },
  { id: 'ratings', icon: 'star' as const },
];

export function MatchDetail({ matchId, onBack, initialTab = 'squad', analysisFocus, preloadedMatch, forceResultSummary, predictionTeamId }: MatchDetailProps) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const tabs = React.useMemo(() => TAB_IDS.map(tab => ({ ...tab, label: t(`matchDetail.tabs.${tab.id}`) })), [t]);
  const themeColors = theme === 'light' ? COLORS.light : COLORS.dark;
  const isNarrow = windowWidth < 420;
  const centerInfoMinWidth = isNarrow ? 100 : 160;
  const countdownPadding = isNarrow ? 4 : 8;

  // ✅ Maç durumuna göre varsayılan sekme belirlenir (biten maçlar için stats/ratings)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [coaches, setCoaches] = useState<{ home: string; away: string }>({ home: '', away: '' });
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  const { favoriteTeams, loading: favoriteTeamsLoading } = useFavoriteTeams();
  const favoriteTeamIds = React.useMemo(() => favoriteTeams?.map(t => t.id) ?? [], [favoriteTeams]);
  
  // ✅ Debug: Favori takımların yüklenme durumu
  React.useEffect(() => {
    if (!favoriteTeamsLoading && favoriteTeamIds.length > 0) {
      console.log('✅ [MatchDetail] Favori takımlar hazır:', favoriteTeamIds);
    }
  }, [favoriteTeamsLoading, favoriteTeamIds]);
  const [showAnalysisFocusModal, setShowAnalysisFocusModal] = useState(false);
  const [analysisFocusOverride, setAnalysisFocusOverride] = useState<AnalysisFocusType | null>(null);
  const [showResetPredictionsModal, setShowResetPredictionsModal] = useState(false);
  const [hasPrediction, setHasPrediction] = useState<boolean | null>(null); // null = henüz kontrol edilmedi
  const [hasViewedCommunityData, setHasViewedCommunityData] = useState(false); // ✅ Topluluk verilerini gördü mü?
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
  // ✅ 120 saniyelik kural kaldırıldı - artık maç başlayana kadar tahmin yapılabilir
  // pageOpenedAt sadece analitik için korunuyor
  const [pageOpenedAt, setPageOpenedAt] = useState<number | null>(null);
  
  // ✅ İlk 11 popup'ı gösterildi mi? (sekme değişse bile korunur)
  const [startingXIPopupShown, setStartingXIPopupShown] = useState(false);
  
  // ✅ Maç sonu popup'ı - sonuçları, puanları ve rozetleri gösterir
  const [showMatchEndPopup, setShowMatchEndPopup] = useState(false);
  const [matchEndPopupShown, setMatchEndPopupShown] = useState(false); // Popup gösterildi mi?
  
  // ✅ Reyting hatırlatıcısı - biten maçlar için
  const [showRatingReminder, setShowRatingReminder] = useState(false);
  const [pendingRatingMatches, setPendingRatingMatches] = useState<{matchId: string; teamName: string; date: string}[]>([]);

  // ✅ Memoize onHasUnsavedChanges callback to prevent infinite re-renders
  const handleHasUnsavedChanges = useCallback((hasChanges: boolean, saveFn: () => Promise<void>) => {
    setPredictionHasUnsavedChanges(hasChanges);
    setPredictionSaveFn(() => saveFn);
  }, []);

  // ✅ Kadro için unsaved changes callback
  const handleSquadUnsavedChanges = useCallback((hasChanges: boolean) => {
    setSquadHasUnsavedChanges(hasChanges);
  }, []);

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
      const fixtureId = Number(matchId);
      const isMockMatch = isMockTestMatch(fixtureId);
      const effectiveTeamId = isMockMatch ? getMockUserTeamId(fixtureId) : (selectedPredictionTeamId ?? predictionTeamId);
      
      if (bothFav && homeId != null && awayId != null) {
        const key1 = `${STORAGE_KEYS.PREDICTIONS}${matchId}-${homeId}`;
        const key2 = `${STORAGE_KEYS.PREDICTIONS}${matchId}-${awayId}`;
        const raw1 = await AsyncStorage.getItem(key1);
        const raw2 = await AsyncStorage.getItem(key2);
        let has = false;
        if (raw1) {
          const p = JSON.parse(raw1);
          has = has || !!(p?.matchPredictions && Object.values(p.matchPredictions).some((v: any) => v != null)) || !!(p?.playerPredictions && Object.keys(p.playerPredictions).length > 0);
        }
        if (raw2) {
          const p = JSON.parse(raw2);
          has = has || !!(p?.matchPredictions && Object.values(p.matchPredictions).some((v: any) => v != null)) || !!(p?.playerPredictions && Object.keys(p.playerPredictions).length > 0);
        }
        // ✅ Kadro tamamlanmış mı? (mock + gerçek maç – iki favori için her iki takım)
        const squadKey1 = `${STORAGE_KEYS.SQUAD}${matchId}-${homeId}`;
        const squadKey2 = `${STORAGE_KEYS.SQUAD}${matchId}-${awayId}`;
        for (const squadKey of [squadKey1, squadKey2]) {
          const squadRaw = await AsyncStorage.getItem(squadKey);
          if (squadRaw) {
            try {
              const squad = JSON.parse(squadRaw);
              const hasSquad = squad.isCompleted === true && squad.attackPlayersArray?.length >= 11;
              if (isMockMatch) has = has || (hasSquad && squad.matchId === fixtureId);
              else has = has || hasSquad;
            } catch (_) {}
          }
        }
        setHasPrediction(has);
        // ✅ İki favori maçta da hasViewedCommunityData oku (her iki takımın tahmin kaydından)
        let viewedCommunity = false;
        if (raw1) {
          try {
            const p1 = JSON.parse(raw1);
            if (p1?.hasViewedCommunityData === true) viewedCommunity = true;
          } catch (_) {}
        }
        if (!viewedCommunity && raw2) {
          try {
            const p2 = JSON.parse(raw2);
            if (p2?.hasViewedCommunityData === true) viewedCommunity = true;
          } catch (_) {}
        }
        if (!viewedCommunity) {
          const cKey1 = `community_viewed_${matchId}-${homeId}`;
          const cKey2 = `community_viewed_${matchId}-${awayId}`;
          if (await AsyncStorage.getItem(cKey1) || await AsyncStorage.getItem(cKey2)) viewedCommunity = true;
        }
        setHasViewedCommunityData(viewedCommunity);
        return;
      }
      
      // ✅ Tek favori takım veya mock maç
      const predKey = effectiveTeamId != null ? `${STORAGE_KEYS.PREDICTIONS}${matchId}-${effectiveTeamId}` : `${STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const predRaw = await AsyncStorage.getItem(predKey);
      
      let hasPred = false;
      if (predRaw) {
        const pred = JSON.parse(predRaw);
        const hasMatchPred = pred?.matchPredictions && Object.values(pred.matchPredictions).some((v: any) => v != null);
        const hasPlayerPred = pred?.playerPredictions && Object.keys(pred.playerPredictions).length > 0;
        hasPred = !!hasMatchPred || !!hasPlayerPred;
      }
      
      // ✅ Kadro tamamlanmış mı? (mock + gerçek maç – Tahmin sekmesinde kadronun görünmesi için)
      const squadKey = effectiveTeamId != null ? `${STORAGE_KEYS.SQUAD}${matchId}-${effectiveTeamId}` : `${STORAGE_KEYS.SQUAD}${matchId}`;
      const squadRaw = await AsyncStorage.getItem(squadKey);
      if (squadRaw) {
        try {
          const squad = JSON.parse(squadRaw);
          const hasSquad = squad.isCompleted === true && squad.attackPlayersArray?.length >= 11;
          if (isMockMatch) hasPred = hasPred || (hasSquad && squad.matchId === fixtureId);
          else hasPred = hasPred || hasSquad;
        } catch (_) {}
      }

      setHasPrediction(hasPred);
      
      // ✅ hasViewedCommunityData değerini de oku
      let viewedCommunity = false;
      if (predRaw) {
        try {
          const pred = JSON.parse(predRaw);
          if (pred?.hasViewedCommunityData === true) {
            viewedCommunity = true;
          }
        } catch (_) {}
      }
      // ✅ Ayrı key kontrolü (tahmin silinip yeniden yapılmış olabilir)
      if (!viewedCommunity) {
        const communityKey = `community_viewed_${matchId}${effectiveTeamId != null ? `-${effectiveTeamId}` : ''}`;
        const communityRaw = await AsyncStorage.getItem(communityKey);
        if (communityRaw) {
          viewedCommunity = true;
        }
      }
      setHasViewedCommunityData(viewedCommunity);
    } catch (e) {
      console.warn('checkPredictions error:', e);
      setHasPrediction(false);
    }
  }, [matchId, selectedPredictionTeamId, predictionTeamId]);

  const handleResetPredictionsConfirm = async (targetTeamId?: number | null) => {
    const teamToReset = targetTeamId ?? resetTargetTeamId;
    setShowResetPredictionsModal(false);
    setResetTargetTeamId(null);
    const homeId = matchData?.teams?.home?.id ?? matchData?.homeTeam?.id;
    const awayId = matchData?.teams?.away?.id ?? matchData?.awayTeam?.id;
    const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);
    
    // ✅ Mock maçlar için doğru team ID'yi bul
    const fixtureId = Number(matchId);
    const isMockMatch = isMockTestMatch(fixtureId);
    const effectiveTeamId = isMockMatch ? getMockUserTeamId(fixtureId) : (teamToReset ?? selectedPredictionTeamId ?? predictionTeamId);

    try {
      // ✅ İki favori takım veya mock maç: Takıma özel storage key kullan
      if ((bothFavorites && teamToReset != null) || (isMockMatch && effectiveTeamId != null)) {
        const teamIdToUse = teamToReset ?? effectiveTeamId;
        await AsyncStorage.removeItem(`${STORAGE_KEYS.PREDICTIONS}${matchId}-${teamIdToUse}`);
        const squadKey = `${STORAGE_KEYS.SQUAD}${matchId}-${teamIdToUse}`;
        // ✅ Storage'dan tamamen sil (isCompleted = false yapmak yerine)
        await AsyncStorage.removeItem(squadKey);
        
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
      } else {
        // ✅ Tek favori takım: Normal storage key kullan
        await AsyncStorage.removeItem(STORAGE_KEYS.PREDICTIONS + matchId);
        const squadKey = `${STORAGE_KEYS.SQUAD}${matchId}`;
        // ✅ Storage'dan tamamen sil
        await AsyncStorage.removeItem(squadKey);
        
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
      }
      
      setHasPrediction(false);
      if (bothFavorites) checkPredictions(homeId, awayId, true);
      else checkPredictions();
      
      console.log('✅ Tahminler silindi:', { matchId, teamId: teamToReset ?? effectiveTeamId, isMockMatch });
    } catch (e) { 
      console.error('❌ Reset predictions failed', e); 
      Alert.alert(t('common.error'), t('matchDetail.errorDeletingPredictions'));
    }
    // ✅ Analiz odağı modal'ını açma - kullanıcı tahmin yapmadığı için gerek yok
    // setShowAnalysisFocusModal(true);
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
  const lineupsRetryRef = React.useRef<{ t2: ReturnType<typeof setTimeout> | null; t5: ReturnType<typeof setTimeout> | null }>({ t2: null, t5: null });
  
  // ✅ Geri sayım ticker - her saniye güncelle
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Kullanıcının sayfayı ne zaman açtığını takip et
  React.useEffect(() => {
    setPageOpenedAt(Date.now());
  }, [matchId]);
  
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
    if (isMockTestMatch(Number(matchId))) {
      // ✅ Her zaman güncel başlangıç zamanını kullan (sayfa yenilendiğinde de doğru olsun)
      const expectedStartTime = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
      
      // Eğer ref null ise veya beklenen zamanla uyumsuzsa güncelle
      if (mockMatchStartTimeRef.current === null || mockMatchStartTimeRef.current !== expectedStartTime) {
        // Öncelik sırası: preloadedMatch > match > getMatch1Start/getMatch2Start
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
          // Hiçbiri yoksa getMatch1Start/getMatch2Start kullan
          timestampToUse = expectedStartTime;
          console.log(`📌 ${Number(matchId) === MOCK_MATCH_IDS.GS_FB ? 'getMatch1Start' : 'getMatch2Start'}() kullanılıyor:`, new Date(timestampToUse).toISOString());
        }
        
        // Timestamp'i sabitle
        if (timestampToUse !== null) {
          mockMatchStartTimeRef.current = timestampToUse;
          const remainingSeconds = Math.floor((timestampToUse - Date.now()) / 1000);
          console.log('🔒 Mock maç timestamp sabitlendi:', new Date(timestampToUse).toISOString(), 'Kalan süre:', remainingSeconds, 'saniye');
        }
      }
    }
  }, [matchId, preloadedMatch, match]);
  
  // ✅ Canlı maçta otomatik olarak sekme yönlendirmesi
  // - Tahmin yapılmamış canlı maç → Kadro sekmesi (İlk 11 popup gösterilecek)
  // - Tahmin yapılmış canlı maç → Canlı sekmesi
  React.useEffect(() => {
    if (!match || initialTabSet) return;
    if (hasPrediction === null) return; // ✅ Tahmin kontrolü henüz tamamlanmadı, bekle
    
    const matchStatus = match?.fixture?.status?.short || match?.status || '';
    const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(matchStatus);
    
    if (isLive) {
      if (hasPrediction) {
        // ✅ Tahmin yapılmış canlı maç → Canlı sekmesine yönlendir
        setActiveTab('live');
        console.log('📺 Canlı maç (tahmin yapılmış) → Live sekmesine yönlendirildi');
      } else {
        // ✅ Tahmin yapılmamış canlı maç → Kadro sekmesinde kal (İlk 11 popup gösterilecek)
        setActiveTab('squad');
        console.log('📋 Canlı maç (tahmin yapılmamış) → Kadro sekmesinde kalındı');
      }
      setInitialTabSet(true);
    } else {
      setInitialTabSet(true);
    }
  }, [match, initialTab, initialTabSet, hasPrediction]);
  
  // ✅ Lineups state - her zaman kullanılabilir
  const [manualLineups, setManualLineups] = React.useState<any>(null);
  const lineups = apiLineups || manualLineups;
  
  // ✅ Canlı maç verileri state (preloadedMatch kullanıldığında da güncellenir)
  const [liveMatchData, setLiveMatchData] = React.useState<any>(null);
  const [liveEvents, setLiveEvents] = React.useState<any[]>([]);
  const [liveStatistics, setLiveStatistics] = React.useState<any>(null);
  
  // ✅ Canlı maç mı kontrol et (erken kontrol - canlı güncelleme için)
  // 1) Status canlı ise (1H, 2H, HT ...) VEYA
  // 2) Maç başlama saati geçtiyse ve bitmemişse → canlı kabul et ve polling başlat (ilk poll'da gerçek status gelir)
  const LIVE_STATUSES_EARLY = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'ABD', 'AWD', 'WO', 'CANC', 'PST', 'SUSP'];
  const earlyMatchStatus = liveMatchData?.fixture?.status?.short || match?.fixture?.status?.short || match?.status?.short || preloadedMatch?.fixture?.status?.short || preloadedMatch?.status?.short || '';
  const isStatusLive = LIVE_STATUSES_EARLY.includes(earlyMatchStatus);
  const isStatusFinished = FINISHED_STATUSES.some(s => earlyMatchStatus?.startsWith?.(s) || earlyMatchStatus === s);
  const fixtureDate = liveMatchData?.fixture?.date || match?.fixture?.date || preloadedMatch?.fixture?.date || match?.fixture_date || preloadedMatch?.fixture_date;
  const startTimeMs = fixtureDate ? new Date(fixtureDate).getTime() : 0;
  const nowMs = Date.now();
  const matchStartedByTime = startTimeMs > 0 && nowMs >= startTimeMs - 60000; // 1 dk tolerans
  const matchNotFinishedByTime = startTimeMs > 0 && (nowMs - startTimeMs) < 3.5 * 60 * 60 * 1000; // 3.5 saat içinde
  const isPotentiallyLive = matchStartedByTime && matchNotFinishedByTime && !isStatusFinished;
  const isMatchLiveEarly = isStatusLive || isPotentiallyLive;
  
  // ✅ Lineups'ı çek. Canlı/bitmiş maçta ilk istek refresh=1 ile (cache atla, API'den taze kadro gelsin).
  React.useEffect(() => {
    if (!matchId) return;
    const isLiveOrFinished = earlyMatchStatus && (LIVE_STATUSES_EARLY.includes(earlyMatchStatus) || FINISHED_STATUSES.some((s: string) => earlyMatchStatus?.startsWith?.(s) || earlyMatchStatus === s));
    const refresh = !!isLiveOrFinished;
    const fetchLineups = async (doRefresh: boolean): Promise<boolean> => {
      try {
        const response = await api.matches.getMatchLineups(Number(matchId), doRefresh);
        if (response?.success && response?.data && response.data.length > 0) {
          const hasStartXI = response.data.some((l: any) => l.startXI && l.startXI.length >= 11);
          if (hasStartXI) {
            setManualLineups(response.data);
            console.log('📋 Lineups yüklendi:', response.data[0]?.team?.name, response.data[0]?.formation);
            return true;
          }
        }
        if (isLiveOrFinished) {
          console.warn('📋 Lineups boş döndü (canlı/bitmiş maç)', { matchId, refresh: doRefresh });
        }
      } catch (e) {
        console.log('📋 Lineups yükleme hatası:', e);
      }
      return false;
    };

    fetchLineups(refresh).then((ok) => {
      if (isLiveOrFinished && !ok) {
        lineupsRetryRef.current.t2 = setTimeout(() => fetchLineups(true), 2000);
        lineupsRetryRef.current.t5 = setTimeout(() => fetchLineups(true), 5000);
      }
    });

    return () => {
      if (lineupsRetryRef.current.t2) clearTimeout(lineupsRetryRef.current.t2);
      if (lineupsRetryRef.current.t5) clearTimeout(lineupsRetryRef.current.t5);
      lineupsRetryRef.current.t2 = null;
      lineupsRetryRef.current.t5 = null;
    };
  }, [matchId, earlyMatchStatus]);

  // ✅ CANLI MAÇTA KADRO BOŞSA PERİYODİK YENİDEN ÇEK – maç başladıktan sonra API kadroyu açıklar
  const lineupsHasStartXI = React.useMemo(() => {
    const arr = apiLineups || manualLineups;
    if (!arr || !Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((l: any) => l.startXI && l.startXI.length >= 11);
  }, [apiLineups, manualLineups]);

  React.useEffect(() => {
    if (!matchId || !isMatchLiveEarly || lineupsHasStartXI) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 8;
    const INTERVAL_MS = 15000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const pollLineups = async () => {
      attempts += 1;
      try {
        const response = await api.matches.getMatchLineups(Number(matchId), true);
        if (response?.success && response?.data && response.data.length > 0) {
          const hasStartXI = response.data.some((l: any) => l.startXI && l.startXI.length >= 11);
          if (hasStartXI) {
            setManualLineups(response.data);
            console.log('📋 [Canlı] Kadro açıklandı, lineups güncellendi:', response.data[0]?.team?.name);
            if (intervalId) clearInterval(intervalId);
            return true;
          }
        }
      } catch (_) {}
      return false;
    };

    pollLineups();
    intervalId = setInterval(() => {
      if (attempts >= MAX_ATTEMPTS && intervalId) {
        clearInterval(intervalId);
        return;
      }
      pollLineups();
    }, INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [matchId, isMatchLiveEarly, lineupsHasStartXI]);
  
  // ✅ CANLI MAÇ GÜNCELLEME - preloadedMatch kullanılsa bile
  React.useEffect(() => {
    if (!matchId || !isMatchLiveEarly) return;
    
    console.log('🔴 Canlı maç güncelleme döngüsü başlatıldı:', matchId);
    
    const fetchLiveData = async () => {
      try {
        // ✅ Paralel: canlı veriler + lineups (refresh ile; kadro açıklanınca hemen gelsin)
        const [matchRes, eventsRes, statsRes, lineupsRes] = await Promise.allSettled([
          api.matches.getMatchDetails(Number(matchId), true),
          api.matches.getMatchEvents(Number(matchId), true),
          api.matches.getMatchStatistics(Number(matchId), true),
          api.matches.getMatchLineups(Number(matchId), true),
        ]);
        
        // ✅ Backend bazen DB formatı döner (fixture yok, data.elapsed / data.status) – API formatına normalize et
        if (matchRes.status === 'fulfilled' && matchRes.value?.success && matchRes.value.data) {
          const raw = matchRes.value.data;
          let toSet = raw;
          if (!raw.fixture && (raw.elapsed != null || raw.status != null)) {
            toSet = {
              fixture: {
                id: raw.id ?? matchId,
                date: raw.fixture_date || raw.fixture?.date || new Date().toISOString(),
                timestamp: raw.fixture_timestamp ?? new Date(raw.fixture_date || raw.fixture?.date).getTime() / 1000,
                status: {
                  short: raw.status || 'NS',
                  long: raw.status_long || raw.status || 'Not Started',
                  elapsed: raw.elapsed ?? raw.fixture?.status?.elapsed ?? null,
                  extraTime: raw.extra_time ?? raw.fixture?.status?.extraTime ?? null,
                },
                venue: raw.venue_name ? { name: raw.venue_name, city: raw.venue_city } : raw.fixture?.venue,
              },
              goals: { home: raw.home_score ?? raw.goals?.home, away: raw.away_score ?? raw.goals?.away },
              score: {
                halftime: raw.halftime_home != null ? { home: raw.halftime_home, away: raw.halftime_away } : raw.score?.halftime,
                fulltime: raw.fulltime_home != null ? { home: raw.fulltime_home, away: raw.fulltime_away } : raw.score?.fulltime,
              },
              teams: raw.teams ?? {
                home: raw.home_team ?? { id: raw.home_team_id, name: null, logo: null },
                away: raw.away_team ?? { id: raw.away_team_id, name: null, logo: null },
              },
              league: raw.league ?? raw.league_id,
            };
          }
          const short = toSet.fixture?.status?.short ?? toSet.fixture?.status?.long ?? '';
          const elapsed = toSet.fixture?.status?.elapsed;
          if (short !== '' || elapsed != null) {
            setLiveMatchData(toSet);
          }
        }
        
        if (eventsRes.status === 'fulfilled' && eventsRes.value?.success) {
          const newEvents = eventsRes.value.data ?? [];
          // ✅ Yeni event listesi boş gelse bile mevcut eventleri asla silme; sadece yeni veri geldiyse güncelle
          if (newEvents.length > 0) setLiveEvents(newEvents);
        }
        
        if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value.data != null) {
          // ✅ İstatistikleri boş/null ile asla silme; sadece anlamlı veri geldiyse güncelle
          setLiveStatistics(statsRes.value.data);
        }

        if (lineupsRes.status === 'fulfilled' && lineupsRes.value?.success && lineupsRes.value.data?.length > 0) {
          const hasStartXI = lineupsRes.value.data.some((l: any) => l.startXI && l.startXI.length >= 11);
          if (hasStartXI) {
            setManualLineups(lineupsRes.value.data);
            console.log('📋 [Canlı döngü] Lineups güncellendi:', lineupsRes.value.data[0]?.team?.name);
          }
        }
        
        const normalizedElapsed = matchRes.status === 'fulfilled' && matchRes.value?.data
          ? (matchRes.value.data.fixture?.status?.elapsed ?? matchRes.value.data.elapsed)
          : null;
        console.log('🔄 Canlı veriler güncellendi:', {
          elapsed: normalizedElapsed,
          eventsCount: eventsRes.status === 'fulfilled' ? (eventsRes.value?.data?.length ?? 0) : 0
        });
      } catch (e) {
        console.log('🔴 Canlı veri güncelleme hatası:', e);
      }
    };
    
    // İlk çağrı hemen
    fetchLiveData();
    
    // En geç 15 sn içinde görünsün: her 8 saniyede bir güncelle
    const interval = setInterval(fetchLiveData, 8000);
    
    return () => {
      console.log('⏹️ Canlı maç güncelleme döngüsü durduruldu');
      clearInterval(interval);
    };
  }, [matchId, isMatchLiveEarly]);
  
  // ✅ Güncel maç verisi - canlı veri varsa onu kullan
  const currentMatch = liveMatchData || match;
  const currentEvents = (liveEvents.length > 0 ? liveEvents : events) || [];

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
      'juventus': 'Luciano Spalletti', // 2025-26 sezonu
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

  // ✅ Teknik direktör: önce lineups'tan al (maça özel, en güncel), yoksa fallback
  const getManagerFromLineups = (teamId: number) => {
    const arr = Array.isArray(lineups) ? lineups : lineups?.data;
    if (!arr?.length) return '';
    const lineup = arr.find((l: any) => l.team?.id === teamId);
    const coach = lineup?.coach;
    return typeof coach === 'string' ? coach : coach?.name || '';
  };
  
  // ✅ Teknik direktör öncelik sırası:
  // 1. Teams/Coach API state'inden (en güncel, maça özel)
  // 2. Lineups'tan (maça özel)
  // 3. Fallback listesinden (son çare)
  const homeManager = coaches.home
    || getManagerFromLineups(match?.teams?.home?.id) 
    || getCoachFallback(match?.teams?.home?.name);
  const awayManager = coaches.away
    || getManagerFromLineups(match?.teams?.away?.id) 
    || getCoachFallback(match?.teams?.away?.name);

  // Biten maç (ertelenen PST/SUSP hariç) – FINISHED_STATUSES yukarıda tanımlı
  const REALLY_FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC'];
  
  // ✅ Mock maçlar için gerçek zamandan status belirle - countdownTicker ile her saniye güncellensin
  // ✅ DÜZELTME: currentMatch kullan; boş status'ta match (preloaded) ile yedekle ki canlı maç "başlamadı" görünmesin
  const matchStatus = useMemo(() => {
    const statusFromCurrent = currentMatch?.fixture?.status;
    const statusFromMatch = match?.fixture?.status;
    const statusRaw = statusFromCurrent || statusFromMatch;
    const apiStatus = typeof statusRaw === 'string'
      ? statusRaw
      : (statusRaw?.short || statusRaw?.long || '');
    
    if (!isMockTestMatch(Number(matchId))) {
      // ✅ Gerçek maçlar için timestamp kontrolü
      const matchTimestamp = currentMatch?.fixture?.timestamp;
      if (matchTimestamp) {
        const matchTime = matchTimestamp * 1000;
        const now = Date.now();
        const timeSinceStart = now - matchTime;
        const hoursSinceMatch = timeSinceStart / (1000 * 60 * 60);
        
        // ✅ YENİ: Maç başlamış ama statü NS - muhtemelen canlı (cache stale)
        // Son 3 saat içinde başlamış ve statü NS/TBD/boş ise → potansiyel canlı
        if (timeSinceStart > 0 && timeSinceStart < 3 * 60 * 60 * 1000 && 
            (apiStatus === 'NS' || apiStatus === '' || apiStatus === 'TBD' || !apiStatus)) {
          const estimatedMinutes = Math.floor(timeSinceStart / 60000);
          console.log(`🔴 [MatchDetail] Maç ${matchId} potansiyel canlı (NS ama ${estimatedMinutes}dk geçmiş) - 1H döndürülüyor`);
          // ✅ 45 dakikadan az ise 1H, 45-60 arası HT, 60+ ise 2H varsay
          if (estimatedMinutes < 45) {
            return '1H';
          } else if (estimatedMinutes < 60) {
            return 'HT';
          } else if (estimatedMinutes < 105) {
            return '2H';
          } else {
            // 105+ dakika - muhtemelen bitmiş
            return 'FT';
          }
        }
        
        // Maç başlamasından 3+ saat geçtiyse ve statü hala NS, boş veya belirsiz ise, FT say
        if (hoursSinceMatch > 3 && (apiStatus === 'NS' || apiStatus === '' || apiStatus === 'TBD' || !apiStatus)) {
          console.log(`⚠️ [MatchDetail] Maç ${matchId} için statü güncellendi: "${apiStatus}" → FT (${hoursSinceMatch.toFixed(1)} saat geçmiş)`);
          return 'FT';
        }
      }
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
  }, [matchId, currentMatch?.fixture?.status, currentMatch?.fixture?.timestamp, match?.fixture?.status, match?.fixture?.timestamp, liveMatchData, countdownTicker]);
  
  const isMatchLive = LIVE_STATUSES_EARLY.includes(matchStatus);
  const isMatchFinished = REALLY_FINISHED_STATUSES.includes(matchStatus);
  
  // ✅ DEBUG: Maç statüsünü konsola yazdır
  React.useEffect(() => {
    console.log(`📊 [MatchDetail] Maç ${matchId} statüsü:`, {
      matchStatus,
      isMatchLive,
      isMatchFinished,
      hasPrediction,
      apiStatus: match?.fixture?.status,
      timestamp: match?.fixture?.timestamp,
    });
  }, [matchId, matchStatus, isMatchLive, isMatchFinished, hasPrediction, match?.fixture?.status, match?.fixture?.timestamp]);
  
  // ✅ YENİ KURAL: Kadro kilitli mi? (maç başladığında kilitlenir, 120 sn kuralı kaldırıldı)
  // Maç canlı veya bitmişse kadro düzenlenemez
  const isKadroLocked = isMatchLive || isMatchFinished;
  
  // ✅ Maç bittiğinde popup göster
  React.useEffect(() => {
    if (isMatchFinished && !matchEndPopupShown && hasPrediction) {
      // Maç bitti ve daha önce popup gösterilmedi ve tahmin yapılmış
      setShowMatchEndPopup(true);
      setMatchEndPopupShown(true);
    }
  }, [isMatchFinished, matchEndPopupShown, hasPrediction]);
  
  // ✅ Reyting hatırlatıcısı - yeni tahmin sayfasına girince biten maçları kontrol et
  // MAX 3 KEZ: Her maç için en fazla 3 kez hatırlatma, sonra bırak
  React.useEffect(() => {
    // Sadece gelecek/canlı maçlarda kontrol et (biten maçta değilken)
    if (isMatchFinished) return;
    
    const checkPendingRatings = async () => {
      try {
        const now = Date.now();
        
        // ✅ Biten maçları tara - RATINGS storage'ından kontrol et
        const allKeys = await AsyncStorage.getAllKeys();
        const ratingKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.RATINGS));
        const predictionKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.PREDICTIONS));
        
        const pendingMatches: {matchId: string; teamName: string; date: string; reminderCount: number}[] = [];
        
        for (const key of predictionKeys) {
          try {
            const raw = await AsyncStorage.getItem(key);
            if (!raw) continue;
            
            const pred = JSON.parse(raw);
            // Match ID'yi key'den çıkar
            const matchIdMatch = key.match(/predictions-(\d+)/);
            if (!matchIdMatch) continue;
            
            const predMatchId = matchIdMatch[1];
            
            // ✅ Maç bitmiş mi kontrol et (24 saat içinde)
            const matchEndTime = pred.matchEndTime ? new Date(pred.matchEndTime).getTime() : 0;
            const hoursSinceEnd = (now - matchEndTime) / (1000 * 60 * 60);
            
            if (matchEndTime > 0 && hoursSinceEnd < 24) {
              // ✅ Reyting verilmiş mi kontrol et
              const ratingsKey = `${STORAGE_KEYS.RATINGS}${predMatchId}`;
              const ratingsRaw = await AsyncStorage.getItem(ratingsKey);
              const hasCoachRating = ratingsRaw ? JSON.parse(ratingsRaw).isLocked === true : false;
              
              const playerRatingsKey = `${STORAGE_KEYS.RATINGS}${predMatchId}_players`;
              const playerRatingsRaw = await AsyncStorage.getItem(playerRatingsKey);
              const hasPlayerRating = playerRatingsRaw ? JSON.parse(playerRatingsRaw).isLocked === true : false;
              
              // ✅ Her iki reyting de verilmediyse hatırlat
              if (!hasCoachRating || !hasPlayerRating) {
                // ✅ Hatırlatma sayısını kontrol et (max 3)
                const reminderCountKey = `rating_reminder_count_${predMatchId}`;
                const reminderCountRaw = await AsyncStorage.getItem(reminderCountKey);
                const reminderCount = reminderCountRaw ? parseInt(reminderCountRaw, 10) : 0;
                
                if (reminderCount < 3) {
                  pendingMatches.push({
                    matchId: predMatchId,
                    teamName: pred.teamName || t('matchDetail.team'),
                    date: pred.matchDate || '',
                    reminderCount: reminderCount,
                  });
                }
              }
            }
          } catch (_) {
            // JSON parse hatası, devam et
          }
        }
        
        if (pendingMatches.length > 0) {
          // ✅ En fazla 3 maç göster (en düşük reminder count önce)
          pendingMatches.sort((a, b) => a.reminderCount - b.reminderCount);
          setPendingRatingMatches(pendingMatches.slice(0, 3));
          setShowRatingReminder(true);
          
          // ✅ Gösterilen maçların hatırlatma sayısını artır
          for (const m of pendingMatches.slice(0, 3)) {
            const reminderCountKey = `rating_reminder_count_${m.matchId}`;
            await AsyncStorage.setItem(reminderCountKey, String(m.reminderCount + 1));
          }
        }
      } catch (e) {
        console.warn('Rating reminder check error:', e);
      }
    };
    
    // 2 saniye gecikme ile kontrol et (sayfa yüklensin)
    const timer = setTimeout(checkPendingRatings, 2000);
    return () => clearTimeout(timer);
  }, [isMatchFinished]);
  
  // ✅ Mock maçlarda dakika her saniye güncellenir (countdownTicker ile); yoksa API'den gelen elapsed
  // ✅ DÜZELTME: currentMatch (liveMatchData || match) kullan (canlı güncelleme için)
  const rawMatchMinute = currentMatch?.fixture?.status?.elapsed ?? 0;
  // ✅ Dakika, uzatma ve salise hesaplama (mock maçlarda gerçek zamandan)
  const { matchMinute, matchExtraTime, matchSecond } = (() => {
    if (!matchId || !currentMatch?.fixture) return { matchMinute: rawMatchMinute, matchExtraTime: null, matchSecond: 0 };
    if (!isMockTestMatch(Number(matchId))) {
      // Gerçek maçlar için API'den gelen extraTime bilgisini kullan
      const extraTime = currentMatch?.fixture?.status?.extraTime ?? null;
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
    if (!matchId || !currentMatch?.fixture || !isMockTestMatch(Number(matchId))) {
      return {
        homeScore: currentMatch?.goals?.home ?? 0,
        awayScore: currentMatch?.goals?.away ?? 0,
        halftimeScore: currentMatch?.score?.halftime || null,
      };
    }
    
    const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
    const events = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? MATCH_1_EVENTS : MATCH_2_EVENTS;
    
    // ✅ Güvenlik kontrolü: events undefined olabilir
    if (!events || !Array.isArray(events)) {
      return {
        homeScore: currentMatch?.goals?.home ?? 0,
        awayScore: currentMatch?.goals?.away ?? 0,
        halftimeScore: currentMatch?.score?.halftime || null,
      };
    }
    
    const state = computeLiveState(matchStart, events);
    
    // İlk yarı skorunu hesapla (45. dakikaya kadar olan goller)
    // ✅ Kendi kalesine gol durumunda teamSide tersine çevrilir
    const firstHalfEvents = events.filter(e => e.minuteOffset <= 45 && e.type === 'Goal');
    const firstHalfHomeGoals = firstHalfEvents.filter(e => {
      if (e.detail === 'Own Goal') {
        return e.teamSide === 'away'; // Away takımından own goal = home takımına gol
      }
      return e.teamSide === 'home';
    }).length;
    const firstHalfAwayGoals = firstHalfEvents.filter(e => {
      if (e.detail === 'Own Goal') {
        return e.teamSide === 'home'; // Home takımından own goal = away takımına gol
      }
      return e.teamSide === 'away';
    }).length;
    
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
  
  // ✅ Biten maçlarda tahmin sekmesi görüntüleme modunda kalır (değişiklik yapılamaz ama görüntülenebilir)

  // ✅ Geri dönme kontrolü - kaydedilmemiş değişiklik varsa uyarı göster
  // ✅ Biten maçlarda veya kilitli kadrolarda uyarı gösterilmez (değişiklik yapılamaz)
  // ✅ isMatchFinished ve isKadroLocked tanımlandıktan sonra tanımlanmalı
  const handleBackPress = useCallback(() => {
    // ✅ Kadro kilitliyse (maç canlı/bitti ve 2 dk geçti) uyarı gösterme
    if (activeTab === 'squad' && squadHasUnsavedChanges && !isMatchFinished && !isKadroLocked) {
      setShowSquadUnsavedModal(true);
      setPendingBackAction(true);
      return;
    }
    // ✅ Tahmin sekmesinde de kaydedilmemiş değişiklik kontrolü
    // ✅ Kilitli durumda uyarı gösterme
    if (activeTab === 'prediction' && predictionHasUnsavedChanges && !isMatchFinished && !isKadroLocked) {
      setPendingBackAction(true);
      setShowUnsavedChangesModal(true);
      return;
    }
    onBack();
  }, [activeTab, squadHasUnsavedChanges, predictionHasUnsavedChanges, isMatchFinished, isKadroLocked, onBack]);

  // Transform API data to component format
  // ✅ useMemo ile sarmalayarak mock maçlar için timestamp'i sabitle
  // ✅ currentMatch kullanarak canlı verileri yansıt; eksik veri (rate limit vb.) durumunda match'e düş
  const matchData = useMemo(() => {
    const safe = (currentMatch?.fixture?.id != null && currentMatch?.teams?.home && currentMatch?.teams?.away)
      ? currentMatch
      : match;
    if (!safe?.fixture?.id || !safe?.teams?.home || !safe?.teams?.away) return null;
    const m = safe;
    return {
    id: m.fixture.id.toString(),
    homeTeam: {
      id: m.teams.home.id,
      name: m.teams.home.name,
      logo: m.teams.home.logo || '⚽',
      color: getTeamColors(m.teams.home),
      manager: homeManager,
    },
    awayTeam: {
      id: m.teams.away.id,
      name: m.teams.away.name,
      logo: m.teams.away.logo || '⚽',
      color: getTeamColors(m.teams.away),
      manager: awayManager,
    },
    teams: {
      home: { id: m.teams.home.id, name: m.teams.home.name },
      away: { id: m.teams.away.id, name: m.teams.away.name },
    },
    league: m.league?.name ?? '',
    stadium: m.fixture?.venue?.name || 'TBA',
    date: new Date(m.fixture.date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    time: api.utils.formatMatchTime(new Date(m.fixture.date).getTime() / 1000),
    timestamp: (() => {
      if (isMockTestMatch(Number(matchId))) {
        if (mockMatchStartTimeRef.current !== null) {
          return mockMatchStartTimeRef.current / 1000;
        }
        const ts = m.fixture.timestamp || new Date(m.fixture.date).getTime() / 1000;
        mockMatchStartTimeRef.current = ts * 1000;
        return mockMatchStartTimeRef.current / 1000;
      }
      return m.fixture.timestamp || new Date(m.fixture.date).getTime() / 1000;
    })(),
    // ✅ Canlı maç bilgileri
    isLive: isMatchLive,
    minute: matchMinute,
    extraTime: matchExtraTime, // ✅ Uzatma dakikası (null veya 1-4 arası)
    second: matchSecond, // ✅ Salise bilgisi (0-99)
    homeScore: homeScore,
    awayScore: awayScore,
    halftimeScore: halftimeScore,
    status: matchStatus,
  };
  }, [
    // ✅ currentMatch objesini dependency'e ekle çünkü canlı maçlarda güncelleniyor
    // Sadece gerçekten değişmesi gereken değerleri ekle
    currentMatch?.fixture?.id, // Match ID değiştiğinde yeniden hesapla
    currentMatch?.teams?.home?.id,
    currentMatch?.teams?.away?.id,
    currentMatch?.teams?.home?.name,
    currentMatch?.teams?.away?.name,
    currentMatch?.league?.name,
    currentMatch?.fixture?.venue?.name,
    currentMatch?.fixture?.date, // Date değiştiğinde yeniden hesapla
    currentMatch?.goals?.home, // ✅ Canlı skor güncellemesi
    currentMatch?.goals?.away, // ✅ Canlı skor güncellemesi
    currentMatch?.fixture?.status?.elapsed, // ✅ Canlı dakika güncellemesi
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
    match, // ✅ Eksik currentMatch durumunda fallback
  ]);
  
  // ✅ 120 saniyelik geri sayım kaldırıldı - countdownData artık kullanılmıyor
  const countdownData = null as any; // ✅ Kaldırılan countdown için placeholder
  // NOT: countdownTicker zaten yukarıda useState ile tanımlı (satır 91)

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

  // Loading state - favoriteTeamIds hazır olana kadar bekle
  if (loading || !matchData || favoriteTeamsLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1FA2A6" />
        <Text style={styles.loadingText}>{t('matchDetail.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{t('matchDetail.dataLoadError')}</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity onPress={onBack} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{t('matchDetail.goBack')}</Text>
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
              <Text style={styles.placeholderText}>{t('matchDetail.selectTeamSquad')}</Text>
            </View>
          );
        }
        // ✅ 120 saniyelik kural kaldırıldı - allowEditingAfterMatchStart, countdownData, countdownTicker artık geçilmiyor
        // ✅ MatchSquad her zaman render edilir - favoriteTeamIds boş olsa bile ev sahibi takım seçilir
        // ✅ favoriteTeamIds değiştiğinde yeniden mount et (key değişir)
        return (
          <MatchSquad
            key={`squad-${matchId}-${predictionTeamIdForProps ?? 'all'}-fav${favoriteTeamIds.length}`}
            matchData={matchData}
            matchId={matchId}
            lineups={lineups}
            favoriteTeamIds={favoriteTeamIds}
            predictionTeamId={predictionTeamIdForProps}
            onComplete={() => setActiveTab('prediction')}
            onAttackFormationChangeConfirmed={() => {
              // ✅ Sadece analiz odağı seçilmemişse modal'ı aç
              // Analiz odağı zaten seçilmişse tekrar açma
              // ✅ Maç canlıysa VEYA bitmişse analiz odağı atlanır (tahmin yapılamaz)
              if (!effectiveAnalysisFocus && !isMatchLive && !isMatchFinished) {
                setShowAnalysisFocusModal(true);
              }
            }}
            isVisible={activeTab === 'squad'}
            isMatchFinished={isMatchFinished}
            isMatchLive={isMatchLive}
            onHasUnsavedChanges={handleSquadUnsavedChanges}
            startingXIPopupShown={startingXIPopupShown}
            onStartingXIPopupShown={() => setStartingXIPopupShown(true)}
            hasViewedCommunityData={hasViewedCommunityData}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        );
      
      case 'prediction':
        if (bothFavorites && !effectivePredictionTeamId) {
          return (
            <View style={styles.centerContent}>
              <Text style={styles.placeholderText}>{t('matchDetail.selectTeamPrediction')}</Text>
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
            hasPrediction={hasPrediction === true}
            initialAnalysisFocus={effectiveAnalysisFocus}
            lineups={lineups}
            liveEvents={currentEvents}
            liveStatistics={liveStatistics}
            favoriteTeamIds={favoriteTeamIds}
            onPredictionsSaved={() => checkPredictions(homeId, awayId, bothFavorites)}
            onPredictionsSavedForTeam={async (savedTeamId) => {
              await checkPredictions(homeId, awayId, bothFavorites);
            }}
            onHasUnsavedChanges={handleHasUnsavedChanges}
            onViewedCommunityData={() => setHasViewedCommunityData(true)}
          />
        );
      
      case 'live':
        return <MatchLive matchData={matchData} matchId={matchId} events={currentEvents} />;
      
      case 'stats':
        return <MatchStats matchData={matchData} matchId={matchId} favoriteTeamIds={favoriteTeamIds} events={currentEvents} liveStatistics={liveStatistics} isMatchLive={!!isMatchLiveEarly} />;
      
      case 'ratings':
        return <MatchRatings matchData={matchData} lineups={lineups} favoriteTeamIds={favoriteTeamIds} hasPrediction={hasPrediction === true} />;
      
      // Özet sekmesi kaldırıldı - Artık biten maç kartlarında gösteriliyor
      
      default:
        return null;
    }
  };

  const isLight = theme === 'light';
  const headerBg = isLight ? themeColors.muted : '#0F2A24';
  const headerFg = isLight ? themeColors.foreground : '#F8FAFB';
  const headerMuted = isLight ? themeColors.mutedForeground : '#94A3B8';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      
      {/* ✅ Grid Pattern – İstatistik/Canlı sekmelerinde daha net kareli yapı */}
      <View style={[
        styles.gridPattern,
        (activeTab === 'stats' || activeTab === 'live') && styles.gridPatternStrong,
        isLight && Platform.OS === 'web' && {
          backgroundImage: `linear-gradient(to right, rgba(15, 42, 36, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 42, 36, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        },
      ]} />

      {/* Sticky Match Card Header - ProfileCard overlay gibi - tema ile uyumlu */}
      <View style={[styles.matchCardOverlay, { backgroundColor: headerBg }]}>
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
          <TouchableOpacity onPress={handleBackPress} style={[styles.backButton, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]}>
            <Ionicons name="arrow-back" size={20} color={headerFg} />
          </TouchableOpacity>

          <View style={styles.centerBadges}>
            <View style={[styles.leagueBadge, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]}>
              <Ionicons name="trophy" size={12} color="#1FA2A6" />
              <Text style={[styles.leagueText, isLight && { color: themeColors.foreground }]}>{matchData.league}</Text>
            </View>
            <View style={styles.stadiumBadge}>
              <Ionicons name="location" size={10} color={headerMuted} />
              <Text style={[styles.stadiumText, { color: headerMuted }]}>{matchData.stadium}</Text>
            </View>
          </View>

          {hasPrediction ? (
            <TouchableOpacity
              onPress={() => {
                if (isMatchLive || isMatchFinished) {
                  Alert.alert(t('matchDetail.cannotDeletePredictionTitle'), t('matchDetail.cannotDeletePredictionMessage'));
                  return;
                }
                if (bothFavorites) setShowResetTeamPickerModal(true);
                else setShowResetPredictionsModal(true);
              }}
              style={styles.starButton}
              hitSlop={12}
              accessibilityLabel={t('matchDetail.confirmDeletePredictions')}
            >
              <Ionicons name="star" size={20} color="#EAB308" />
              <Text style={styles.starButtonText}>{t('matchDetail.predictionDone')}</Text>
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
              <Text style={[styles.teamNameLarge, { color: headerFg }]} numberOfLines={1} ellipsizeMode="tail">{matchData.homeTeam.name}</Text>
            </View>
            {matchData.homeTeam.manager?.trim() ? (
              <Text style={[styles.managerText, { color: headerMuted }]}>{matchData.homeTeam.manager.trim()}</Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            {/* Canlı veya biten maçta skor göster */}
            {(matchData.isLive || isMatchFinished) && (
              <View style={styles.liveScoreBox}>
                <Text style={[styles.liveScoreText, { color: headerFg }]}>{matchData.homeScore}</Text>
              </View>
            )}
          </View>

          {/* Center: Canlıda sadece CANLI + dakika (Rule 1/3); biten maçta tarih/saat; başlamamışta geri sayım */}
          <View style={[styles.centerInfo, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]}>
            {matchData.isLive ? (
              <>
                {/* CANLI Badge */}
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={[styles.liveBadgeText, { color: headerFg }]}>{t('matchCard.live')}</Text>
                </View>
                {/* Dakika: 1./2. uzatma için 90+1..90+15 ve 105+1..105+15; normalde dakika:salise veya 45+3 */}
                <Text style={[styles.liveMinuteText, { color: headerFg }]}>
                  {(() => {
                    const min = matchData.minute ?? 0;
                    if (min >= 106) return `${min - 105}:${String(matchData.second ?? 0).padStart(2, '0')}`;
                    if (min >= 91) return `${min - 90}:${String(matchData.second ?? 0).padStart(2, '0')}`;
                    if (matchData.extraTime != null && matchData.extraTime > 0) return `${matchData.minute}+${matchData.extraTime}`;
                    return `${matchData.minute}:${String(matchData.second ?? 0).padStart(2, '0')}`;
                  })()}
                </Text>
                {/* İlk yarı / İkinci yarı / 1. Uzatma / 2. Uzatma */}
                <Text style={[styles.halftimeText, { color: headerMuted }]}>
                  {(() => {
                    const min = matchData.minute ?? 0;
                    const status = matchData.status || '';
                    if (min >= 106 || status === 'AET' || status === 'PEN') return t('matchDetail.extraTime2');
                    if (min >= 91 || status === 'ET') return t('matchDetail.extraTime1');
                    if (min < 46 || (min === 45 && matchData.extraTime != null)) return t('matchDetail.firstHalf');
                    return t('matchDetail.secondHalf');
                  })()}
                </Text>
              </>
            ) : isMatchFinished ? (
              <>
                <Text style={[styles.dateText, { color: headerMuted }]}>● {matchData.date}</Text>
                <Text style={[styles.liveMinuteText, { color: headerFg }]}>
                  {matchData.minute ?? 90}:{String(matchData.second ?? 0).padStart(2, '0')}
                </Text>
              </>
            ) : (
              <>
                {/* Tarih ve saat konteyner içinde ortalı */}
                <View style={styles.dateInfoRow}>
                  <Ionicons name="time" size={9} color={headerMuted} />
                  <Text style={[styles.dateText, { color: headerMuted }]}>{matchData.date}</Text>
                </View>
                
                {/* Saat Badge - ortalı */}
                {isLight ? (
                  <View style={[styles.timeBadge, { backgroundColor: themeColors.muted, borderWidth: 1, borderColor: themeColors.border, alignSelf: 'center' }]}>
                    <Text style={[styles.timeBadgeText, { color: themeColors.foreground }]}>{matchData.time}</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#1FA2A6', '#047857']}
                    style={[styles.timeBadge, { alignSelf: 'center' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.timeBadgeText}>{matchData.time}</Text>
                  </LinearGradient>
                )}
                
                {/* Countdown - Sadece 120 sn kala giren kullanıcılar için, yanıp söner */}
                {/* ✅ Container her zaman render ediliyor - layout sabit kalıyor */}
                <View style={styles.countdownRow}>
                  {countdownData && countdownData.type === 'countdown' && countdownData.isVisible ? (
                    <View style={[styles.countdownContent, { pointerEvents: 'none' }]}>
                      <View style={{ opacity: countdownData.shouldBlink && countdownData.seconds > 30 ? (countdownTicker % 2 === 0 ? 1 : 0.3) : 1 }}>
                        <LinearGradient
                          colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                          style={styles.countdownBox}
                        >
                          <Text style={styles.countdownNumber}>{String(countdownData.hours).padStart(2, '0')}</Text>
                          <Text style={styles.countdownLabel}>{t('matchDetail.countdownHours')}</Text>
                        </LinearGradient>
                      </View>
                      
                      <View style={{ opacity: countdownData.shouldBlink && countdownData.seconds > 30 ? (countdownTicker % 2 === 0 ? 1 : 0.3) : 1 }}>
                        <Text style={[styles.countdownSeparator, { color: countdownData.color }]}>:</Text>
                      </View>
                      
                      <View style={{ opacity: countdownData.shouldBlink && countdownData.seconds > 30 ? (countdownTicker % 2 === 0 ? 1 : 0.3) : 1 }}>
                        <LinearGradient
                          colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                          style={styles.countdownBox}
                        >
                          <Text style={styles.countdownNumber}>{String(countdownData.minutes).padStart(2, '0')}</Text>
                          <Text style={styles.countdownLabel}>{t('matchDetail.countdownMinutes')}</Text>
                        </LinearGradient>
                      </View>
                      
                      <View style={{ opacity: countdownData.shouldBlink && countdownData.seconds > 30 ? (countdownTicker % 2 === 0 ? 1 : 0.3) : 1 }}>
                        <Text style={[styles.countdownSeparator, { color: countdownData.color }]}>:</Text>
                      </View>
                      
                      <View style={{ opacity: countdownData.shouldBlink && countdownData.seconds > 30 ? (countdownTicker % 2 === 0 ? 1 : 0.3) : 1 }}>
                        <LinearGradient
                          colors={[countdownData.color, countdownData.color === '#EF4444' ? '#B91C1C' : countdownData.color === '#F97316' ? '#EA580C' : countdownData.color === '#F59E0B' ? '#D97706' : countdownData.color === '#84CC16' ? '#65A30D' : '#059669']}
                          style={styles.countdownBox}
                        >
                          <Text style={styles.countdownNumber}>{String(countdownData.seconds).padStart(2, '0')}</Text>
                          <Text style={styles.countdownLabel}>{t('matchDetail.countdownSeconds')}</Text>
                        </LinearGradient>
                      </View>
                    </View>
                  ) : null}
                </View>
                {countdownData && countdownData.type === 'days' && (
                  <LinearGradient
                    colors={['#f97316', '#ea580c']}
                    style={styles.daysRemainingBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.daysRemainingText}>
                      {t('matchDetail.daysLeft', { count: countdownData.days })}
                    </Text>
                  </LinearGradient>
                )}
              </>
            )}
          </View>

          {/* Away Team */}
          <View style={[styles.teamSide, styles.teamSideAway]}>
            <View style={styles.teamNameWrap}>
              <Text style={[styles.teamNameLarge, { color: headerFg }]} numberOfLines={1} ellipsizeMode="tail">{matchData.awayTeam.name}</Text>
            </View>
            {matchData.awayTeam.manager?.trim() ? (
              <Text style={[styles.managerText, { color: headerMuted }]}>{matchData.awayTeam.manager.trim()}</Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
            {/* Canlı veya biten maçta skor göster */}
            {(matchData.isLive || isMatchFinished) && (
              <View style={styles.liveScoreBox}>
                <Text style={[styles.liveScoreText, { color: headerFg }]}>{matchData.awayScore}</Text>
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
          title={t('matchDetail.unsavedSquadTitle')}
          message={t('matchDetail.unsavedSquadMessage')}
          buttons={[
            { 
              text: t('matchDetail.goBackBtn'), 
              style: 'cancel', 
              onPress: () => { 
                setShowSquadUnsavedModal(false); 
                setPendingBackAction(false);
                setPendingTabChange(null);
              } 
            },
            { 
              text: t('matchDetail.leaveWithoutSaving'), 
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
          title={t('matchDetail.deletePredictionsTitle')}
          message={t('matchDetail.deletePredictionsMessage')}
          buttons={[
            { text: t('matchDetail.no'), style: 'cancel', onPress: () => { setShowResetPredictionsModal(false); setActiveTab('squad'); } },
            { text: t('matchDetail.delete'), style: 'destructive', onPress: () => handleResetPredictionsConfirm() },
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
          title={t('matchDetail.whichTeamDeleteTitle')}
          message={t('matchDetail.whichTeamDeleteMessage')}
          buttons={[
            { text: String(matchData.homeTeam?.name ?? t('matchDetail.homeTeam')), onPress: () => { setShowResetTeamPickerModal(false); handleResetPredictionsConfirm(homeId!); } },
            { text: String(matchData.awayTeam?.name ?? t('matchDetail.awayTeam')), onPress: () => { setShowResetTeamPickerModal(false); handleResetPredictionsConfirm(awayId!); } },
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
          title={t('matchDetail.unsavedPredictionTitle')}
          message={t('matchDetail.unsavedPredictionMessage')}
          buttons={[
            { 
              text: t('matchDetail.dontSave'), 
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
              text: t('matchDetail.save'), 
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

      {/* ✅ 120 saniyelik CountdownWarningModal kaldırıldı - artık kullanılmıyor */}

      <View style={[styles.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: headerBg }]}>
        <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                // ✅ Kadro sekmesinden ayrılırken kaydedilmemiş değişiklik kontrolü
                // ✅ Biten maçlarda veya kilitli kadrolarda uyarı gösterilmez (değişiklik yapılamaz)
                if (activeTab === 'squad' && tab.id !== 'squad' && squadHasUnsavedChanges && !isMatchFinished && !isKadroLocked) {
                  setPendingTabChange(tab.id);
                  setShowSquadUnsavedModal(true);
                  return;
                }
                // ✅ Tahmin sekmesinden ayrılırken kaydedilmemiş değişiklik kontrolü
                // ✅ Biten maçlarda veya kilitli kadrolarda uyarı gösterilmez (değişiklik yapılamaz)
                if (activeTab === 'prediction' && tab.id !== 'prediction' && predictionHasUnsavedChanges && !isMatchFinished && !isKadroLocked) {
                  setPendingTabChange(tab.id);
                  setShowUnsavedChangesModal(true);
                  return;
                }
                
                // ✅ 120 saniyelik tahmin uyarısı kaldırıldı - artık maç başlayana kadar serbestçe tahmin yapılabilir
                
                setActiveTab(tab.id);
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

      {/* ✅ Maç Sonu Popup - açık temada açık kart + okunaklı metin */}
      <Modal
        visible={showMatchEndPopup}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMatchEndPopup(false)}
      >
        <View style={matchEndStyles.overlay}>
          <View style={[matchEndStyles.modal, isLight && { borderColor: themeColors.border }]}>
            {isLight ? (
              <View style={[matchEndStyles.gradient, { backgroundColor: themeColors.card }]}>
                <View style={matchEndStyles.header}>
                  <Ionicons name="trophy" size={32} color="#C9A44C" />
                  <Text style={[matchEndStyles.title, { color: themeColors.foreground }]}>{t('matchDetail.matchEndTitle')}</Text>
                </View>
                <View style={[matchEndStyles.scoreContainer, { backgroundColor: themeColors.muted }]}>
                  <View style={matchEndStyles.teamScore}>
                    <Text style={[matchEndStyles.teamName, { color: themeColors.mutedForeground }]}>{matchData.homeName || t('matchDetail.homeTeam')}</Text>
                    <Text style={[matchEndStyles.scoreText, { color: themeColors.foreground }]}>{matchData.homeScore ?? 0}</Text>
                  </View>
                  <Text style={[matchEndStyles.scoreSeparator, { color: themeColors.mutedForeground }]}>-</Text>
                  <View style={matchEndStyles.teamScore}>
                    <Text style={[matchEndStyles.teamName, { color: themeColors.mutedForeground }]}>{matchData.awayName || t('matchDetail.awayTeam')}</Text>
                    <Text style={[matchEndStyles.scoreText, { color: themeColors.foreground }]}>{matchData.awayScore ?? 0}</Text>
                  </View>
                </View>
                <View style={matchEndStyles.summarySection}>
                  <Text style={[matchEndStyles.sectionTitle, { color: themeColors.mutedForeground }]}>{t('matchDetail.yourPredictionPoints')}</Text>
                  <View style={matchEndStyles.pointsGrid}>
                    <View style={[matchEndStyles.pointItem, { backgroundColor: themeColors.muted }]}>
                      <Ionicons name="people" size={20} color="#1FA2A6" />
                      <Text style={[matchEndStyles.pointLabel, { color: themeColors.mutedForeground }]}>{t('matchDetail.squadLabel')}</Text>
                      <Text style={[matchEndStyles.pointValue, { color: '#059669' }]}>+25</Text>
                    </View>
                    <View style={[matchEndStyles.pointItem, { backgroundColor: themeColors.muted }]}>
                      <Ionicons name="analytics" size={20} color="#8B5CF6" />
                      <Text style={[matchEndStyles.pointLabel, { color: themeColors.mutedForeground }]}>{t('matchDetail.matchPredictionLabel')}</Text>
                      <Text style={[matchEndStyles.pointValue, { color: '#7C3AED' }]}>+15</Text>
                    </View>
                    <View style={[matchEndStyles.pointItem, { backgroundColor: themeColors.muted }]}>
                      <Ionicons name="person" size={20} color="#F59E0B" />
                      <Text style={[matchEndStyles.pointLabel, { color: themeColors.mutedForeground }]}>{t('matchDetail.playerLabel')}</Text>
                      <Text style={[matchEndStyles.pointValue, { color: '#D97706' }]}>+10</Text>
                    </View>
                  </View>
                  <View style={[matchEndStyles.totalPoints, { backgroundColor: themeColors.muted }]}>
                    <Text style={[matchEndStyles.totalLabel, { color: themeColors.foreground }]}>{t('matchDetail.totalPointsLabel')}</Text>
                    <Text style={[matchEndStyles.totalValue, { color: '#059669' }]}>+50</Text>
                  </View>
                </View>
                <View style={matchEndStyles.badgeSection}>
                  <Text style={[matchEndStyles.sectionTitle, { color: themeColors.mutedForeground }]}>{t('matchDetail.earnedBadges')}</Text>
                  <View style={matchEndStyles.badgeRow}>
                    <View style={[matchEndStyles.badge, { backgroundColor: themeColors.muted }]}>
                      <Text style={matchEndStyles.badgeEmoji}>🎯</Text>
                      <Text style={[matchEndStyles.badgeName, { color: themeColors.foreground }]}>{t('matchDetail.badgeScorePrediction')}</Text>
                    </View>
                    <View style={[matchEndStyles.badge, { backgroundColor: themeColors.muted }]}>
                      <Text style={matchEndStyles.badgeEmoji}>⚡</Text>
                      <Text style={[matchEndStyles.badgeName, { color: themeColors.foreground }]}>{t('matchDetail.badgeQuickPrediction')}</Text>
                    </View>
                  </View>
                </View>
                <View style={matchEndStyles.buttonContainer}>
                  <TouchableOpacity style={matchEndStyles.primaryButton} onPress={() => { setShowMatchEndPopup(false); setActiveTab('ratings'); }}>
                    <LinearGradient colors={['#1FA2A6', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={matchEndStyles.buttonGradient}>
                      <Ionicons name="star" size={18} color="#FFFFFF" />
                      <Text style={matchEndStyles.buttonText}>{t('matchDetail.doRating')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={matchEndStyles.secondaryButton} onPress={() => setShowMatchEndPopup(false)}>
                    <Text style={[matchEndStyles.secondaryButtonText, { color: themeColors.mutedForeground }]}>{t('matchDetail.later')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <LinearGradient colors={['#0F2A24', '#1E3A3A', '#0F2A24']} style={matchEndStyles.gradient}>
                <View style={matchEndStyles.header}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                  <Text style={matchEndStyles.title}>{t('matchDetail.matchEndTitle')}</Text>
                </View>
                <View style={matchEndStyles.scoreContainer}>
                  <View style={matchEndStyles.teamScore}>
                    <Text style={matchEndStyles.teamName}>{matchData.homeName || t('matchDetail.homeTeam')}</Text>
                    <Text style={matchEndStyles.scoreText}>{matchData.homeScore ?? 0}</Text>
                  </View>
                  <Text style={matchEndStyles.scoreSeparator}>-</Text>
                  <View style={matchEndStyles.teamScore}>
                    <Text style={matchEndStyles.teamName}>{matchData.awayName || t('matchDetail.awayTeam')}</Text>
                    <Text style={matchEndStyles.scoreText}>{matchData.awayScore ?? 0}</Text>
                  </View>
                </View>
                <View style={matchEndStyles.summarySection}>
                  <Text style={matchEndStyles.sectionTitle}>{t('matchDetail.yourPredictionPoints')}</Text>
                  <View style={matchEndStyles.pointsGrid}>
                    <View style={matchEndStyles.pointItem}>
                      <Ionicons name="people" size={20} color="#1FA2A6" />
                      <Text style={matchEndStyles.pointLabel}>{t('matchDetail.squadLabel')}</Text>
                      <Text style={matchEndStyles.pointValue}>+25</Text>
                    </View>
                    <View style={matchEndStyles.pointItem}>
                      <Ionicons name="analytics" size={20} color="#8B5CF6" />
                      <Text style={matchEndStyles.pointLabel}>{t('matchDetail.matchPredictionLabel')}</Text>
                      <Text style={matchEndStyles.pointValue}>+15</Text>
                    </View>
                    <View style={matchEndStyles.pointItem}>
                      <Ionicons name="person" size={20} color="#F59E0B" />
                      <Text style={matchEndStyles.pointLabel}>{t('matchDetail.playerLabel')}</Text>
                      <Text style={matchEndStyles.pointValue}>+10</Text>
                    </View>
                  </View>
                  <View style={matchEndStyles.totalPoints}>
                    <Text style={matchEndStyles.totalLabel}>{t('matchDetail.totalPointsLabel')}</Text>
                    <Text style={matchEndStyles.totalValue}>+50</Text>
                  </View>
                </View>
                <View style={matchEndStyles.badgeSection}>
                  <Text style={matchEndStyles.sectionTitle}>{t('matchDetail.earnedBadges')}</Text>
                  <View style={matchEndStyles.badgeRow}>
                    <View style={matchEndStyles.badge}>
                      <Text style={matchEndStyles.badgeEmoji}>🎯</Text>
                      <Text style={matchEndStyles.badgeName}>{t('matchDetail.badgeScorePrediction')}</Text>
                    </View>
                    <View style={matchEndStyles.badge}>
                      <Text style={matchEndStyles.badgeEmoji}>⚡</Text>
                      <Text style={matchEndStyles.badgeName}>{t('matchDetail.badgeQuickPrediction')}</Text>
                    </View>
                  </View>
                </View>
                <View style={matchEndStyles.buttonContainer}>
                  <TouchableOpacity style={matchEndStyles.primaryButton} onPress={() => { setShowMatchEndPopup(false); setActiveTab('ratings'); }}>
                    <LinearGradient colors={['#1FA2A6', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={matchEndStyles.buttonGradient}>
                      <Ionicons name="star" size={18} color="#FFFFFF" />
                      <Text style={matchEndStyles.buttonText}>{t('matchDetail.doRating')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={matchEndStyles.secondaryButton} onPress={() => setShowMatchEndPopup(false)}>
                    <Text style={matchEndStyles.secondaryButtonText}>{t('matchDetail.later')}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}
          </View>
        </View>
      </Modal>
      
      {/* ✅ Reyting Hatırlatıcısı Modal - Biten maçlar için */}
      <Modal
        visible={showRatingReminder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingReminder(false)}
      >
        <View style={matchEndStyles.overlay}>
          <View style={[matchEndStyles.modal, { maxWidth: 340 }]}>
            <LinearGradient
              colors={['#1A2F4D', '#0F2A24', '#1A2F4D']}
              style={matchEndStyles.gradient}
            >
              {/* Header */}
              <View style={matchEndStyles.header}>
                <Ionicons name="notifications-outline" size={32} color="#F59E0B" />
                <Text style={[matchEndStyles.title, { fontSize: 20 }]}>{t('matchDetail.ratingReminderTitle')}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  {t('matchDetail.ratingReminderMessage')}
                </Text>
              </View>
              
              {/* Biten Maçlar Listesi */}
              <View style={{ marginVertical: 16 }}>
                {pendingRatingMatches.map((m, idx) => (
                  <View key={idx} style={{
                    backgroundColor: 'rgba(31, 162, 166, 0.1)',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: '#1FA2A6',
                  }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>
                      {m.teamName}
                    </Text>
                    {m.date && (
                      <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                        {m.date}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
              
              {/* Butonlar */}
              <View style={matchEndStyles.buttonContainer}>
                <TouchableOpacity
                  style={matchEndStyles.primaryButton}
                  onPress={() => {
                    setShowRatingReminder(false);
                    // TODO: Biten maçlar listesine yönlendir
                    // onNavigate?.('finished-matches');
                  }}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={matchEndStyles.buttonGradient}
                  >
                    <Ionicons name="star" size={16} color="#FFFFFF" />
                    <Text style={matchEndStyles.buttonText}>{t('matchDetail.giveRating')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={matchEndStyles.secondaryButton}
                  onPress={() => setShowRatingReminder(false)}
                >
                  <Text style={matchEndStyles.secondaryButtonText}>{t('matchDetail.remindLater')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Maç Sonu Popup Stilleri
const matchEndStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  gradient: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#64748B',
    marginHorizontal: 16,
  },
  summarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pointItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  pointLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  pointValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  totalPoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeSection: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    minWidth: 80,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

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
  // İstatistik/Canlı sekmelerinde daha net kareli yapı
  gridPatternStrong: Platform.select({
    web: {
      backgroundImage: `
        linear-gradient(to right, rgba(31, 162, 166, 0.22) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(31, 162, 166, 0.22) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    },
    default: {},
  }),
  
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
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
    paddingVertical: 12,
    width: 100, // ✅ Sabit genişlik - layout kaymasını önler
    flexShrink: 0,
    height: 80, // ✅ Sabit yükseklik - geri sayım için yeterli alan
  },
  // ✅ Tarih satırı - konteyner içinde ortalı
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
    width: '100%',
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
    height: 32, // ✅ Sabit yükseklik - yanıp sönme sırasında layout kaymasını önler
    width: '100%', // ✅ Tam genişlik
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // ✅ Layout'u etkilememesi için
  },
  countdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'absolute', // ✅ Absolute positioning - layout'u etkilemez
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
