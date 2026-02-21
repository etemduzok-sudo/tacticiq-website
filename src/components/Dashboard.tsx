// components/Dashboard.tsx - Analist Kontrol Paneli
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  Animated as RNAnimated,
  Alert,
  Modal,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInLeft,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api, { teamsApi } from '../services/api';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../services/profileService';
import { isSuperAdmin } from '../config/constants';
import { AnalysisFocusModal, AnalysisFocusType } from './AnalysisFocusModal';
import { ConfirmModal } from './ui/ConfirmModal';
// CountdownWarningModal kaldırıldı - 120 saniyelik kural artık yok
import { getTeamColors } from '../utils/teamColors';
import { useMatchesWithPredictions } from '../hooks/useMatchesWithPredictions';
import { useTranslation } from '../hooks/useTranslation';
import { matchesDb } from '../services/databaseService';
// Coach cache - takım ID'sine göre teknik direktör isimlerini cache'le (global)
// Bu global cache, component remount'larında bile korunur
const globalCoachCache: Record<number, string> = {};
import { logger } from '../utils/logger';
import { COLORS, SPACING, TYPOGRAPHY, SIZES, SHADOWS, BRAND } from '../theme/theme';
import { WEBSITE_DARK_COLORS } from '../config/WebsiteDesignSystem';
import { cardStyles, textStyles, containerStyles } from '../utils/styleHelpers';
import { translateCountry } from '../utils/countryUtils';

const { width } = Dimensions.get('window');

interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
  matchData: {
    pastMatches: any[];
    liveMatches: any[];
    upcomingMatches: any[];
    loading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
    refetch?: () => void; // ✅ Tekrar yükleme fonksiyonu
  };
  selectedTeamIds?: number[]; // ✅ App.tsx'ten gelen seçili takımlar
}

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData, selectedTeamIds = [] }: DashboardProps) {
  const { t } = useTranslation();
  const [isPremium, setIsPremium] = useState(false);
  // ✅ selectedTeamIds artık App.tsx'ten prop olarak geliyor
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  
  const scrollViewRef = useRef<ScrollView>(null);
  const dropdownRef = useRef<View>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [pastMatchesCollapsed, setPastMatchesCollapsed] = useState(true); // ✅ Biten maçlar varsayılan küçültülmüş
  
  // ✅ Analiz Odağı Modal State
  const [analysisFocusModalVisible, setAnalysisFocusModalVisible] = useState(false);
  const [selectedMatchForAnalysis, setSelectedMatchForAnalysis] = useState<any>(null);
  // ✅ İki favori takım maçlarında seçilen takım ID'si (analiz odağı seçildikten sonra kullanılır)
  const [selectedPredictionTeamIdForAnalysis, setSelectedPredictionTeamIdForAnalysis] = useState<number | null>(null);
  // ✅ Tahmin silme popup state
  const [deletePredictionModal, setDeletePredictionModal] = useState<{ matchId: number; onDelete: () => void } | null>(null);
  // ✅ İki favori takım için tahmin silme modal state (seçilebilir seçenekler + onay butonu)
  const [deletePredictionTeamModal, setDeletePredictionTeamModal] = useState<{
    matchId: number;
    homeId: number;
    awayId: number;
    homeTeamName: string;
    awayTeamName: string;
  } | null>(null);
  const [selectedTeamToDelete, setSelectedTeamToDelete] = useState<'home' | 'away' | 'both' | null>(null);
  // ✅ İki favori takım için maç kartı tıklama modal state (hangi takım için devam edilecek)
  const [teamSelectionModal, setTeamSelectionModal] = useState<{
    match: any;
    homeId: number;
    awayId: number;
    homeTeamName: string;
    awayTeamName: string;
    initialTab: string;
    hasPrediction: boolean;
    isLive: boolean;
    isFinished: boolean;
  } | null>(null);
  // ✅ 120 saniyelik uyarı state'i kaldırıldı - artık kullanılmıyor
  
  // ✅ Maça tıklandığında: İki favori takım varsa popup göster, yoksa direkt devam et
  const handleMatchPress = (match: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Web'de Haptics çalışmayabilir, sorun değil
    }
    
    // ✅ 120 saniyelik uyarı kaldırıldı - artık maç başlayana kadar serbestçe tahmin yapılabilir
    // Normal akışa devam et
    handleMatchPressInternal(match);
  };
  
  // ✅ İç fonksiyon: Normal maç kartı tıklama mantığı
  const handleMatchPressInternal = (match: any) => {
    // ✅ İki favori takım kontrolü
    const homeId = match?.teams?.home?.id;
    const awayId = match?.teams?.away?.id;
    const favoriteTeamIds = favoriteTeams.map(t => t.id);
    const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);
    
    // ✅ İki favori takım varsa: Hangi favori takım için devam ediyorsunuz?
    if (bothFavorites) {
      const homeTeamName = match?.teams?.home?.name || 'Ev Sahibi';
      const awayTeamName = match?.teams?.away?.name || 'Deplasman';
      
      // ✅ Maç durumuna göre initialTab belirle
      const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC'];
      const matchStatus = match?.fixture?.status?.short || '';
      const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(matchStatus);
      // ✅ Timestamp kontrolü: Maç tarihi 2+ saat geçmişse ve statü NS/boş ise bitmiş say
      const matchTimestampBoth = match?.fixture?.timestamp;
      const nowBoth = Date.now();
      const hoursSinceMatchBoth = matchTimestampBoth ? (nowBoth - matchTimestampBoth * 1000) / (1000 * 60 * 60) : 0;
      const isFinished = FINISHED_STATUSES.includes(matchStatus) || 
        (hoursSinceMatchBoth > 2 && (matchStatus === 'NS' || matchStatus === '' || matchStatus === 'TBD'));
      const hasPrediction = match?.fixture?.id != null && matchIdsWithPredictions.has(match.fixture.id);
      
      let initialTab = 'squad'; // Varsayılan
      if (isLive) {
        // ✅ Canlı maçta tahmin yoksa kadro sekmesine yönlendir
        initialTab = hasPrediction ? 'live' : 'squad';
      } else if (isFinished) {
        initialTab = 'stats'; // Biten maçlar için stats
      } else if (hasPrediction) {
        initialTab = 'squad'; // Tahmin yapılmış yaklaşan maç
      } else {
        // Tahmin yok: analiz odağı seçimi gösterilecek
      }
      
      // ✅ Web için özel modal kullan (Alert.alert web'de çalışmıyor)
      setTeamSelectionModal({
        match,
        homeId: homeId!,
        awayId: awayId!,
        homeTeamName,
        awayTeamName,
        initialTab,
        hasPrediction,
        isLive,
        isFinished,
      });
      return;
    }
    
    // ✅ Tek favori takım: Mevcut mantık
    const FINISHED_STATUSES_SINGLE = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'ABD', 'CANC'];
    const matchStatusSingle = match?.fixture?.status?.short || '';
    const isLive = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(matchStatusSingle);
    // ✅ Timestamp kontrolü: Maç tarihi 2+ saat geçmişse ve statü NS/boş ise bitmiş say
    const matchTimestamp = match?.fixture?.timestamp;
    const now = Date.now();
    const hoursSinceMatch = matchTimestamp ? (now - matchTimestamp * 1000) / (1000 * 60 * 60) : 0;
    const isFinished = FINISHED_STATUSES_SINGLE.includes(matchStatusSingle) || 
      (hoursSinceMatch > 2 && (matchStatusSingle === 'NS' || matchStatusSingle === '' || matchStatusSingle === 'TBD'));
    const hasPrediction = match?.fixture?.id != null && matchIdsWithPredictions.has(match.fixture.id);
    
    // ✅ DEBUG: Maç kontrolü
    console.log('📊 [Dashboard] Maç tıklandı:', {
      matchId: match?.fixture?.id,
      status: matchStatusSingle,
      isLive,
      isFinished,
      hasPrediction,
      hoursSinceMatch: hoursSinceMatch.toFixed(1),
      timestamp: matchTimestamp,
    });
    
    if (isLive) {
      // ✅ Canlı maçta tahmin yoksa kadro sekmesine yönlendir
      // Sistem otomatik kadro oluşturmuş olacak, kullanıcı tahmin yapabilir
      const liveInitialTab = hasPrediction ? 'live' : 'squad';
      onNavigate('match-detail', {
        id: String(match.fixture.id),
        initialTab: liveInitialTab,
        matchData: match,
      });
      return;
    }
    
    if (isFinished) {
      onNavigate('match-detail', {
        id: String(match.fixture.id),
        initialTab: 'stats',
        matchData: match,
      });
      return;
    }
    
    if (hasPrediction) {
      onNavigate('match-detail', {
        id: String(match.fixture.id),
        initialTab: 'squad',
        matchData: match,
      });
      return;
    }
    
    // Tahmin yok: analiz odağı seçimi göster
    setSelectedMatchForAnalysis(match);
    setAnalysisFocusModalVisible(true);
  };
  
  // ✅ Analiz odağı seçildiğinde maç detayına git
  const handleAnalysisFocusSelect = (focus: AnalysisFocusType) => {
    setAnalysisFocusModalVisible(false);
    if (selectedMatchForAnalysis) {
      onNavigate('match-detail', { 
        id: String(selectedMatchForAnalysis.fixture.id), // ✅ String'e çevir
        analysisFocus: focus,
        initialTab: 'squad', // Kadro sekmesiyle başla
        matchData: selectedMatchForAnalysis, // ✅ Maç verisi doğrudan geçiriliyor - API çağrısı yok!
        predictionTeamId: selectedPredictionTeamIdForAnalysis, // ✅ İki favori takım maçlarında seçilen takım
      });
    }
    setSelectedMatchForAnalysis(null);
    setSelectedPredictionTeamIdForAnalysis(null);
  };
  
  // ✅ Load favorite teams
  const { favoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  
  // ✅ DEBUG: Log favorite teams
  React.useEffect(() => {
    logger.debug('Favorite Teams Loaded', {
      count: favoriteTeams.length,
      teams: favoriteTeams.map(t => ({ id: t.id, name: t.name })),
      loading: teamsLoading,
    }, 'DASHBOARD');
  }, [favoriteTeams, teamsLoading]);
  
  // ✅ Geri sayım için interval (her saniye güncelle)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTicker(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  

  // ✅ Lig öncelik sıralaması (düşük sayı = yüksek öncelik)
  const getLeaguePriority = (leagueName: string): number => {
    const name = leagueName.toLowerCase();
    const leaguePriorities: Record<string, number> = {
      // Uluslararası Turnuvalar (En yüksek öncelik)
      'uefa champions league': 1,
      'champions league': 1,
      'şampiyonlar ligi': 1,
      'uefa europa league': 2,
      'europa league': 2,
      'avrupa ligi': 2,
      'uefa conference league': 3,
      'conference league': 3,
      'world cup': 4,
      'dünya kupası': 4,
      'euro championship': 5,
      'euro': 5,
      'avrupa şampiyonası': 5,
      // Büyük 5 Lig
      'premier league': 10,
      'la liga': 11,
      'bundesliga': 12,
      'serie a': 13,
      'ligue 1': 14,
      // Türkiye
      'süper lig': 20,
      'super lig': 20,
      'trendyol süper lig': 20,
      '1. lig': 25,
      'tff 1. lig': 25,
      // Diğer Avrupa Ligleri
      'eredivisie': 30,
      'primeira liga': 31,
      'scottish premiership': 32,
      // Milli Takım
      'friendlies': 50,
      'hazırlık maçı': 50,
    };
    
    for (const [key, priority] of Object.entries(leaguePriorities)) {
      if (name.includes(key)) return priority;
    }
    
    // Varsayılan (bilinmeyen ligler)
    return 100;
  };
  
  // ✅ Geri sayım fonksiyonu (24 saat kala başlar)
  const getCountdown = (matchTimestamp: number): string | null => {
    // countdownTicker'ı kullanarak her saniye güncellemeyi tetikle
    const _ = countdownTicker; // ✅ Re-render için kullan
    
    const now = Date.now() / 1000; // Saniye cinsinden
    const matchTime = matchTimestamp;
    const timeDiff = matchTime - now;
    const hours24 = 24 * 60 * 60; // 24 saat = 86400 saniye
    
    // 24 saatten fazla varsa null döndür
    if (timeDiff > hours24) {
      return null;
    }
    
    // 24 saatten az kaldıysa geri sayım göster
    if (timeDiff > 0) {
      const hours = Math.floor(timeDiff / 3600);
      const minutes = Math.floor((timeDiff % 3600) / 60);
      const seconds = Math.floor(timeDiff % 60);
      
      if (hours > 0) {
        return `${hours}s ${minutes}d ${seconds}sn`;
      } else if (minutes > 0) {
        return `${minutes}d ${seconds}sn`;
      } else {
        return `${seconds}sn`;
      }
    }
    
    return null; // Maç başladı
  };
  
  // ✅ Hakem bilgisini al (API'den veya null)
  const getRefereeInfo = (match: any): { main: string | null; var: string | null } => {
    // API'den hakem bilgisi gelirse
    if (match.fixture?.referee) {
      return {
        main: match.fixture.referee,
        var: match.fixture.varReferee || null,
      };
    }
    
    // Henüz belli değil
    return {
      main: null,
      var: null,
    };
  };
  
  // ✅ Coach cache state (component içinde re-render trigger için)
  const [coachCacheVersion, setCoachCacheVersion] = useState(0);
  
  // ✅ Maçlar yüklendiğinde coach verilerini API'den toplu çek
  useEffect(() => {
    const fetchCoachesForMatches = async () => {
      // Tüm maçlardaki takım ID'lerini topla
      const allMatches = [
        ...matchData.upcomingMatches,
        ...matchData.liveMatches,
        ...matchData.pastMatches.slice(0, 10), // Biten maçlardan sadece son 10
      ];
      
      const teamIds: number[] = [];
      allMatches.forEach(match => {
        if (match.teams?.home?.id && !globalCoachCache[match.teams.home.id]) {
          teamIds.push(match.teams.home.id);
        }
        if (match.teams?.away?.id && !globalCoachCache[match.teams.away.id]) {
          teamIds.push(match.teams.away.id);
        }
      });
      
      // Benzersiz ID'leri al
      const uniqueIds = [...new Set(teamIds)];
      
      if (uniqueIds.length === 0) return;
      
      try {
        const response = await teamsApi.getBulkCoaches(uniqueIds);
        if (response?.success && response?.data) {
          const coachData = response.data as Record<string, { coach: string | null }>;
          let updated = false;
          
          Object.entries(coachData).forEach(([teamId, data]) => {
            if (data.coach) {
              globalCoachCache[parseInt(teamId, 10)] = data.coach;
              updated = true;
            }
          });
          
          // State'i güncelle (re-render trigger)
          if (updated) {
            setCoachCacheVersion(v => v + 1);
          }
        }
      } catch (error) {
        // API hatası - sessizce devam et
        logger.warn('Coach bulk fetch failed', { error }, 'Dashboard');
      }
    };
    
    // Maçlar yüklendiğinde çek
    if (matchData.hasLoadedOnce && !matchData.loading) {
      fetchCoachesForMatches();
    }
  }, [matchData.hasLoadedOnce, matchData.loading, matchData.upcomingMatches.length, matchData.liveMatches.length]);
  
  // ✅ Teknik direktör ismini al - sadece cache'ten oku (DB/API'den doldurulur)
  const getCoachName = (teamName: string, teamId?: number): string => {
    // Eğer teamId varsa ve cache'te varsa, cache'ten döndür
    if (teamId && globalCoachCache[teamId]) {
      return globalCoachCache[teamId];
    }
    
    // Cache'te yoksa "Yükleniyor..." veya boş göster
    // Not: API bulk fetch arka planda çalışıyor, cache dolacak
    return teamId ? '...' : 'Bilinmiyor';
  };

  // ✅ Takım adını çevir (milli takımlar için)
  const getDisplayTeamName = (teamName: string): string => {
    // Milli takım isimleri için çeviri yap
    const nationalTeamNames = [
      'Turkey', 'Germany', 'France', 'England', 'Spain', 'Italy', 'Brazil', 
      'Argentina', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland',
      'Ukraine', 'Russia', 'Sweden', 'Austria', 'Switzerland', 'USA', 'Mexico',
      'Japan', 'South-Korea', 'Australia', 'Saudi-Arabia', 'Czech Republic',
      'Georgia', 'Scotland', 'Wales', 'Serbia', 'Denmark', 'Norway', 'Finland',
      'Greece', 'Romania', 'Hungary', 'Morocco', 'Nigeria', 'Senegal', 'Egypt',
      'Ghana', 'Cameroon', 'South Africa', 'Iran', 'Iraq', 'Qatar', 'Japan',
      'China', 'India', 'Indonesia', 'Thailand', 'Vietnam'
    ];
    
    // Eğer milli takım ise çevir
    if (nationalTeamNames.includes(teamName)) {
      return translateCountry(teamName);
    }
    
    // Kulüp takımı ise olduğu gibi döndür
    return teamName;
  };
  
  // ✅ Maç kartı bileşeni – tahmin belirteci ve silme seçeneği
  const renderMatchCard = (
    match: any,
    status: 'upcoming' | 'live' | 'finished',
    onPress?: () => void,
    options?: { hasPrediction?: boolean; matchId?: number; onDeletePrediction?: (matchId: number) => void }
  ) => {
    const homeColors = getTeamColors(match.teams.home.name);
    const awayColors = getTeamColors(match.teams.away.name);
    const refereeInfo = getRefereeInfo(match);
    const hasPrediction = options?.hasPrediction ?? false;
    const matchId = options?.matchId;
    const onDeletePrediction = options?.onDeletePrediction;
    
    // ✅ İki favori takım kontrolü (badge için)
    const homeId = match?.teams?.home?.id;
    const awayId = match?.teams?.away?.id;
    const favoriteTeamIds = favoriteTeams.map(t => t.id);
    const bothFavorites = homeId != null && awayId != null && favoriteTeamIds.includes(homeId) && favoriteTeamIds.includes(awayId);

    const handleLongPress = () => {
      if (hasPrediction && matchId != null && onDeletePrediction) {
        Alert.alert(
          'Tahmini sil',
          'Bu maça yaptığınız tahmini silmek istiyor musunuz? Maç detayına girerek kadro ve tahminleri tekrar kurabilir veya güncelleyebilirsiniz.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => onDeletePrediction(matchId) },
          ]
        );
      }
    };
    
    // Geri sayım hesaplama (countdownTicker ile her saniye güncellenir)
    const _ = countdownTicker; // Re-render için kullan
    
    const now = Date.now() / 1000;
    const matchTime = match.fixture.timestamp;
    const timeDiff = matchTime - now;
    const hours24 = 24 * 60 * 60;
    const dayInSeconds = 24 * 60 * 60;
    const days10 = 10 * dayInSeconds; // 10 güne kadar tahmin açık
    
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    let daysRemaining = 0;
    let isLocked = false; // 10 günden uzak maçlar tahmine kapalı
    let countdownColor = '#10b981'; // Varsayılan yeşil
    
    if (status === 'upcoming' && timeDiff > 0) {
      // 10 günden fazla ise tahmine kapalı
      if (timeDiff > days10) {
        isLocked = true;
        daysRemaining = Math.floor(timeDiff / dayInSeconds);
      } else if (timeDiff > hours24) {
        // 24 saatten uzun ama 10 günden az - gün sayısını göster
        daysRemaining = Math.floor(timeDiff / dayInSeconds);
      } else {
        // 24 saatten az kaldıysa geri sayım göster
        timeLeft = {
          hours: Math.floor(timeDiff / 3600),
          minutes: Math.floor((timeDiff % 3600) / 60),
          seconds: Math.floor(timeDiff % 60),
        };
        
        // Renk değişimi: yeşil -> sarı -> turuncu -> kırmızı
        const hoursLeft = timeDiff / 3600;
        if (hoursLeft <= 1) {
          countdownColor = '#EF4444'; // Kırmızı - 1 saatten az
        } else if (hoursLeft <= 3) {
          countdownColor = '#F97316'; // Turuncu - 3 saatten az
        } else if (hoursLeft <= 6) {
          countdownColor = '#F59E0B'; // Sarı - 6 saatten az
        } else if (hoursLeft <= 12) {
          countdownColor = '#84CC16'; // Açık yeşil - 12 saatten az
        }
        // 12+ saat için varsayılan yeşil kalır
      }
    }
    
    // Pulse animasyonu için (sadece live durumunda) - Hook olmadan, CSS ile
    // Note: Hook'lar component seviyesinde olmalı, render fonksiyonunda olamaz
    
    return (
      <TouchableOpacity
        style={styles.matchCardContainer}
        onPress={isLocked ? undefined : onPress}
        onLongPress={handleLongPress}
        activeOpacity={isLocked ? 1 : 0.8}
        disabled={isLocked}
      >
        <LinearGradient
          colors={['#1A3A34', '#162E29', '#122520']}
          style={styles.matchCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Sol kenar gradient şerit */}
          <LinearGradient
            colors={homeColors}
            style={styles.matchCardLeftStrip}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          {/* Sağ kenar gradient şerit */}
          <LinearGradient
            colors={[...awayColors].reverse()}
            style={styles.matchCardRightStrip}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          <View style={styles.matchCardContent}>
              {/* Turnuva Badge - En Üstte Ortada (Tahmin varsa sarı ve tıklanabilir) */}
            {hasPrediction && matchId != null && onDeletePrediction ? (
              <TouchableOpacity
                style={styles.matchCardTournamentBadgePrediction}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  
                  if (bothFavorites) {
                    // ✅ İki favori takım varsa: Özel modal göster (seçilebilir seçenekler + onay butonu)
                    const homeTeamName = match?.teams?.home?.name || 'Ev Sahibi';
                    const awayTeamName = match?.teams?.away?.name || 'Deplasman';
                    setDeletePredictionTeamModal({
                      matchId,
                      homeId: homeId!,
                      awayId: awayId!,
                      homeTeamName,
                      awayTeamName,
                    });
                    setSelectedTeamToDelete(null);
                  } else {
                    // ✅ Tek favori takım: direkt silme modal'ı göster
                    setDeletePredictionModal({ matchId, onDelete: async () => await onDeletePrediction(matchId) });
                  }
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="trophy" size={9} color="#fbbf24" />
                <Text style={styles.matchCardTournamentTextPrediction}>{match.league.name}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.matchCardTournamentBadge}>
                <Ionicons name="trophy" size={9} color={COLORS.dark.primaryLight} />
                <Text style={styles.matchCardTournamentText}>{match.league.name}</Text>
              </View>
            )}
            
            {/* Stadyum Bilgisi - Turnuva Badge'in Altında */}
            {(() => {
              // Tüm olası veri kaynaklarını kontrol et
              const venueName = 
                (match.fixture as any)?.venue?.name || 
                (match as any)?.fixture?.venue?.name ||
                (match as any)?.venue?.name || 
                (match as any)?.venue_name ||
                (match as any)?.venue ||
                (typeof (match as any)?.venue === 'string' ? (match as any).venue : null) ||
                null;
              
              // Debug: Venue bilgisini kontrol et
              logger.debug('Venue kontrolü', {
                'match.fixture?.venue?.name': (match.fixture as any)?.venue?.name,
                'match.venue?.name': (match as any)?.venue?.name,
                'match.venue_name': (match as any)?.venue_name,
                'match.venue (string)': typeof (match as any)?.venue === 'string' ? (match as any).venue : 'not string',
                'final venueName': venueName,
                'match object keys': Object.keys(match || {}),
                'fixture keys': match.fixture ? Object.keys(match.fixture) : 'no fixture',
              }, 'MATCH_CARD');
              
              return (
                <View style={styles.matchCardVenueContainer}>
                  <Ionicons name="location" size={9} color={COLORS.dark.mutedForeground} />
                  <Text style={styles.matchCardVenueText} numberOfLines={1}>
                    {venueName || 'Stadyum bilgisi yok'}
                  </Text>
                </View>
              );
            })()}
            
            {/* Takımlar Bölümü */}
            <View style={styles.matchCardTeamsContainer}>
              {/* Ev Sahibi Takım */}
              <View style={styles.matchCardTeamLeft}>
                <Text style={styles.matchCardTeamName} numberOfLines={1} ellipsizeMode="tail">{getDisplayTeamName(match.teams.home.name)}</Text>
                <Text style={styles.matchCardCoachName}>{getCoachName(match.teams.home.name, match.teams.home.id)}</Text>
                {/* ✅ Her zaman aynı yükseklikte skor alanı - sıçrama olmasın */}
                {(status === 'live' || status === 'finished') ? (
                  <View style={status === 'live' ? styles.matchCardScoreBoxLive : styles.matchCardScoreBox}>
                    <Text style={status === 'live' ? styles.matchCardScoreTextLive : styles.matchCardScoreText}>{match.goals?.home ?? 0}</Text>
                  </View>
                ) : (
                  <View style={styles.matchCardScoreBoxPlaceholder} />
                )}
              </View>
              
              {/* Ortada Maç Bilgileri */}
              <View style={styles.matchCardCenterInfo}>
                <View style={styles.matchCardMatchInfoCard}>
                  {/* Tarih */}
                  <View style={styles.matchCardInfoRow}>
                    <Ionicons name="time" size={9} color={COLORS.dark.mutedForeground} />
                    <Text style={styles.matchCardInfoTextBold}>
                      {new Date(match.fixture.date).toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                  
                  {/* Saat veya canlı dakika */}
                  {status === 'live' ? (
                    // ✅ Canlı maçlar için özel tasarım - maç dakikasını göster
                    (() => {
                      const _ = countdownTicker; // ✅ Re-render için kullan - mock maçlar için gerçek zamanlı güncelleme
                      const matchId = match.fixture?.id;
                      let displayTime = '';
                      
                      if (matchId && isMockTestMatch(Number(matchId))) {
                        // ✅ Mock maçlar için MatchDetail ile aynı mantık - maç dakikasını hesapla
                        const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
                        const now = Date.now();
                        const elapsedMs = now - matchStart;
                        const elapsedSeconds = elapsedMs / 1000; // Ondalıklı saniye
                        const elapsedMinutes = Math.floor(elapsedSeconds); // Tam dakika (simülasyon)
                        
                        if (elapsedMinutes < 0) {
                          displayTime = "0'";
                        } else if (elapsedMinutes >= 112) {
                          displayTime = "90+4'";
                        } else if (elapsedMinutes < 45) {
                          // İlk yarı normal dakikalar
                          displayTime = `${elapsedMinutes}'`;
                        } else if (elapsedMinutes <= 48) {
                          // İlk yarı uzatması: 45+1, 45+2, 45+3
                          const extraTime = elapsedMinutes - 45;
                          displayTime = `45+${extraTime}'`;
                        } else if (elapsedMinutes < 60) {
                          // Devre arası
                          displayTime = "45+3'";
                        } else if (elapsedMinutes < 90) {
                          // İkinci yarı normal dakikalar: 46'dan başlar
                          const secondHalfMinute = 46 + (elapsedMinutes - 60);
                          displayTime = `${secondHalfMinute}'`;
                        } else if (elapsedMinutes <= 94) {
                          // İkinci yarı uzatması: 90+1, 90+2, 90+3, 90+4
                          const extraTime = elapsedMinutes - 90;
                          displayTime = `90+${extraTime}'`;
                        } else {
                          displayTime = "90+4'";
                        }
                      } else {
                        // ✅ Gerçek maçlar için: API'den elapsed varsa kullan, yoksa timestamp'den hesapla
                        const elapsed = match.fixture?.status?.elapsed;
                        const extraTime = match.fixture?.status?.extraTime;
                        const matchTimestamp = match.fixture?.timestamp * 1000;
                        const nowMs = Date.now();
                        const timeSinceStart = nowMs - matchTimestamp;
                        
                        if (elapsed != null && elapsed > 0) {
                          // API'den gelen elapsed değeri var
                          if (extraTime != null && extraTime > 0) {
                            displayTime = `${elapsed}+${extraTime}'`;
                          } else {
                            displayTime = `${elapsed}'`;
                          }
                        } else if (timeSinceStart > 0 && timeSinceStart < 3 * 60 * 60 * 1000) {
                          // ✅ YENİ: API'den elapsed yok ama maç başlamış olmalı (timestamp geçmiş)
                          // Gerçek zamandan dakika hesapla (yaklaşık)
                          const estimatedMinutes = Math.floor(timeSinceStart / 60000);
                          
                          if (estimatedMinutes < 45) {
                            displayTime = `${estimatedMinutes}'`;
                          } else if (estimatedMinutes < 60) {
                            // Muhtemelen ilk yarı uzatması veya devre arası
                            displayTime = `45+${Math.min(estimatedMinutes - 45, 5)}'`;
                          } else if (estimatedMinutes < 105) {
                            // İkinci yarı
                            const secondHalfMinute = 46 + (estimatedMinutes - 60);
                            displayTime = `${Math.min(secondHalfMinute, 90)}'`;
                          } else {
                            // İkinci yarı uzatması
                            displayTime = `90+${Math.min(estimatedMinutes - 105, 5)}'`;
                          }
                        } else {
                          displayTime = api.utils.formatMatchTime(match.fixture.timestamp);
                        }
                      }
                      
                      return (
                        <View style={styles.matchCardLiveTimeContainer}>
                          <Text style={styles.matchCardLiveTimeText}>
                            {displayTime}
                          </Text>
                        </View>
                      );
                    })()
                  ) : (
                    <LinearGradient
                      colors={[BRAND.primary, BRAND.primaryDark || '#047857']}
                      style={styles.matchCardTimeBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.matchCardTimeText}>
                        {api.utils.formatMatchTime(match.fixture.timestamp)}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </View>
              
              {/* Deplasman Takım */}
              <View style={styles.matchCardTeamRight}>
                <Text style={[styles.matchCardTeamName, styles.matchCardTeamNameRight]} numberOfLines={1} ellipsizeMode="tail">{getDisplayTeamName(match.teams.away.name)}</Text>
                <Text style={styles.matchCardCoachNameAway}>{getCoachName(match.teams.away.name, match.teams.away.id)}</Text>
                {/* ✅ Her zaman aynı yükseklikte skor alanı - sıçrama olmasın */}
                {(status === 'live' || status === 'finished') ? (
                  <View style={status === 'live' ? styles.matchCardScoreBoxLive : styles.matchCardScoreBox}>
                    <Text style={status === 'live' ? styles.matchCardScoreTextLive : styles.matchCardScoreText}>{match.goals?.away ?? 0}</Text>
                  </View>
                ) : (
                  <View style={styles.matchCardScoreBoxPlaceholder} />
                )}
              </View>
            </View>
            
            {/* Durum Badge'i (Canlı, Bitti, Geri Sayım, Kilitli) */}
            {/* ✅ Her zaman aynı yükseklikte container - kart yüksekliği sabit kalsın */}
            <View style={styles.matchCardLiveContainer}>
              {status === 'live' ? (
                <LinearGradient
                  colors={['#dc2626', '#b91c1c']}
                  style={styles.matchCardLiveBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.matchCardLiveDot} />
                  <Text style={styles.matchCardLiveText}>OYNANIYOR</Text>
                </LinearGradient>
              ) : status === 'finished' ? (
                <View style={styles.matchCardFinishedContainer}>
                  <LinearGradient
                    colors={['#475569', '#334155']}
                    style={styles.matchCardFinishedBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="checkmark-circle" size={14} color="#94a3b8" />
                    <Text style={styles.matchCardFinishedText}>MAÇ BİTTİ</Text>
                    <Ionicons name="chevron-forward" size={12} color="#94a3b8" />
                  </LinearGradient>
                </View>
            ) : (
              status === 'upcoming' && timeDiff > 0 ? (
                isLocked ? (
                  // 10 günden fazla - tahmine kapalı
                  <View style={styles.matchCardLockedContainer}>
                    <View style={styles.matchCardLockedBadge}>
                      <Ionicons name="lock-closed" size={14} color="#64748B" />
                      <Text style={styles.matchCardLockedText}>
                        {daysRemaining} GÜN SONRA • TAHMİNE KAPALI
                      </Text>
                    </View>
                  </View>
                ) : daysRemaining > 0 ? (
                  // 24 saatten uzun ama 10 günden az - gün sayısını göster
                  <View style={styles.matchCardDaysRemainingContainer}>
                    <LinearGradient
                      colors={['#f97316', '#ea580c']}
                      style={styles.matchCardDaysRemainingBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.matchCardDaysRemainingText}>
                        MAÇA {daysRemaining} GÜN KALDI
                      </Text>
                    </LinearGradient>
                  </View>
                ) : (
                  // 24 saatten az kaldıysa geri sayım sayacını göster (renk değişimi ile)
                  // ✅ Her zaman aynı yükseklikte container - sıçrama olmasın
                  <View style={styles.matchCardCountdownContainer}>
                    {timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                      <View style={styles.matchCardCountdownCard}>
                        <View style={styles.matchCardCountdownRow}>
                          <LinearGradient
                            colors={[countdownColor, countdownColor === '#EF4444' ? '#B91C1C' : countdownColor === '#F97316' ? '#EA580C' : countdownColor === '#F59E0B' ? '#D97706' : countdownColor === '#84CC16' ? '#65A30D' : '#059669']}
                            style={styles.matchCardCountdownBox}
                          >
                            <Text style={styles.matchCardCountdownNumber}>
                              {String(timeLeft.hours).padStart(2, '0')}
                            </Text>
                            <Text style={styles.matchCardCountdownUnit}>Saat</Text>
                          </LinearGradient>
                          
                          <Text style={[styles.matchCardCountdownSeparator, { color: countdownColor }]}>:</Text>
                          
                          <LinearGradient
                            colors={[countdownColor, countdownColor === '#EF4444' ? '#B91C1C' : countdownColor === '#F97316' ? '#EA580C' : countdownColor === '#F59E0B' ? '#D97706' : countdownColor === '#84CC16' ? '#65A30D' : '#059669']}
                            style={styles.matchCardCountdownBox}
                          >
                            <Text style={styles.matchCardCountdownNumber}>
                              {String(timeLeft.minutes).padStart(2, '0')}
                            </Text>
                            <Text style={styles.matchCardCountdownUnit}>Dakika</Text>
                          </LinearGradient>
                          
                          <Text style={[styles.matchCardCountdownSeparator, { color: countdownColor }]}>:</Text>
                          
                          <LinearGradient
                            colors={[countdownColor, countdownColor === '#EF4444' ? '#B91C1C' : countdownColor === '#F97316' ? '#EA580C' : countdownColor === '#F59E0B' ? '#D97706' : countdownColor === '#84CC16' ? '#65A30D' : '#059669']}
                            style={styles.matchCardCountdownBox}
                          >
                            <Text style={styles.matchCardCountdownNumber}>
                              {String(timeLeft.seconds).padStart(2, '0')}
                            </Text>
                            <Text style={styles.matchCardCountdownUnit}>Saniye</Text>
                          </LinearGradient>
                        </View>
                      </View>
                    ) : null}
                  </View>
                )
              ) : null
            )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  
  // ✅ Check if user is premium (Super admin = otomatik Pro)
  React.useEffect(() => {
    const checkPremium = async () => {
      try {
        // ✅ profileService üzerinden kontrol (super admin desteği dahil)
        const profile = await profileService.getProfile();
        if (profile) {
          const isPro = profileService.isPro() || isSuperAdmin(profile.email);
          setIsPremium(isPro);
          logger.debug('User Pro status', { isPro, email: profile.email, plan: profile.plan }, 'DASHBOARD');
        }
      } catch (error) {
        logger.error('Error checking premium status', { error }, 'DASHBOARD');
      }
    };
    checkPremium();
  }, []);

  
  // ✅ Safe destructure with defaults
  const { 
    pastMatches = [], 
    liveMatches = [], 
    upcomingMatches = [], 
    loading = false, 
    error = null,
    hasLoadedOnce = false,
    refetch
  } = matchData || {};

  // ✅ DEBUG: Log match data
  React.useEffect(() => {
    logger.debug('Match Data', {
      past: pastMatches.length,
      live: liveMatches.length,
      upcoming: upcomingMatches.length,
      loading,
      error,
    }, 'DASHBOARD');
    if (pastMatches.length > 0) {
      logger.debug('First past match', {
        teams: `${pastMatches[0].teams?.home?.name} vs ${pastMatches[0].teams?.away?.name}`,
        league: pastMatches[0].league?.name,
      }, 'DASHBOARD');
    }
    if (upcomingMatches.length > 0) {
      logger.debug('First upcoming match', {
        teams: `${upcomingMatches[0].teams?.home?.name} vs ${upcomingMatches[0].teams?.away?.name}`,
        league: upcomingMatches[0].league?.name,
        date: new Date(upcomingMatches[0].fixture.timestamp * 1000).toLocaleString('tr-TR'),
      }, 'DASHBOARD');
    }
  }, [pastMatches, liveMatches, upcomingMatches]);

  // Get all upcoming matches (not just 24 hours)
  const now = Date.now() / 1000;
  const allUpcomingMatches = upcomingMatches.filter(match => {
    const matchTime = match.fixture.timestamp;
    return matchTime >= now;
  });

  // ✅ Filter matches by selected teams (ID and name matching) - ÇOKLU SEÇİM
  // IMPORTANT: This hook MUST be before any early returns to follow Rules of Hooks
  const filterMatchesByTeam = React.useCallback((matches: any[], teamIds: number[]) => {
    // ✅ Eğer favori takım yoksa, TÜM maçları göster (filtreleme yapma)
    if (favoriteTeams.length === 0) {
      return matches; // Tüm maçları göster
    }
    
    // Eğer hiç takım seçilmemişse (boş array), TÜM favori takımların maçlarını göster
    // Eğer takımlar seçilmişse, sadece seçili takımların maçlarını göster
    const teamsToFilter = teamIds.length === 0
      ? favoriteTeams
      : favoriteTeams.filter(t => teamIds.includes(t.id));
    
    // Eğer seçili takımlar favori listesinde yoksa, tüm favorileri kullan
    if (teamsToFilter.length === 0) {
      // Hiç filtreleme yapma, favoriler arasında seçili ID yok
      // Bu durumda tüm favorilerin maçlarını göster
      return matches.filter(match => {
        if (!match?.teams?.home || !match?.teams?.away) return false;
        
        const homeId = match.teams.home.id;
        const awayId = match.teams.away.id;
        return favoriteTeams.some(t => t.id === homeId || t.id === awayId);
      });
    }

    const filtered = matches.filter(match => {
      if (!match?.teams?.home || !match?.teams?.away) return false;
      
      const homeId = match.teams.home.id;
      const awayId = match.teams.away.id;
      const homeName = (match.teams.home.name || '').toLowerCase();
      const awayName = (match.teams.away.name || '').toLowerCase();
      
      // Her favori takım için kontrol et
      for (const team of teamsToFilter) {
        const teamIdStr = String(team.id);
        const teamName = team.name.toLowerCase();
        
        // ID eşleşmesi (öncelikli)
        const idMatch = String(homeId) === teamIdStr || String(awayId) === teamIdStr;
        if (idMatch) {
          return true;
        }
        
        // İsim eşleşmesi (fallback - API'de ID farklı olabilir)
        const nameMatch = homeName.includes(teamName) || teamName.includes(homeName) ||
                         awayName.includes(teamName) || teamName.includes(awayName);
        
        if (nameMatch) {
          return true;
        }
      }
      
      return false;
    });

    logger.debug(`Filtering matches`, {
      selectedTeamIds: teamIds.length === 0 ? 'ALL_FAVORITES' : teamIds,
      teamsCount: teamsToFilter.length,
      teamNames: teamsToFilter.map(t => t.name),
      teamIds: teamsToFilter.map(t => t.id),
      totalMatches: matches.length,
      filteredCount: filtered.length,
      sampleMatch: filtered.length > 0 ? {
        home: filtered[0].teams?.home?.name,
        homeId: filtered[0].teams?.home?.id,
        away: filtered[0].teams?.away?.name,
        awayId: filtered[0].teams?.away?.id,
      } : null,
    }, 'DASHBOARD');

    return filtered;
  }, [favoriteTeams]);

  // ✅ Canlı maçları filtrele (Dashboard'da biten/yaklaşan maçların arasında gösterilecek)
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'];
  const filteredLiveMatches = React.useMemo(() => {
    // ✅ Mevcut zaman (her render'da güncel - countdownTicker her saniye tetikliyor)
    const now = Date.now();
    
    // ✅ TÜM maçlardan canlı olanları bul (liveMatches + upcomingMatches + pastMatches)
    // Cache'den NS statüsü ile gelen ama gerçekte canlı olan maçlar upcoming/past'ta olabilir
    const allMatches = [...liveMatches, ...allUpcomingMatches, ...pastMatches];
    const filtered = filterMatchesByTeam(allMatches, selectedTeamIds);
    
    // ✅ TEMİZ CANLI MAÇ KONTROLÜ: Sadece API statüsüne güven
    const isMatchLive = (m: any) => {
      const status = m.fixture?.status?.short || '';
      return LIVE_STATUSES.includes(status);
    };
    
    // Sadece gerçekten canlı olanları tut
    const liveOnly = filtered.filter(isMatchLive);
    
    // Duplicate kaldır
    const uniqueLive = liveOnly.reduce((acc: any[], match) => {
      const fixtureId = match.fixture?.id;
      if (fixtureId && !acc.some(m => m.fixture?.id === fixtureId)) {
        acc.push(match);
      }
      return acc;
    }, []);
    
    // Timestamp'e göre sırala (en yeni en üstte)
    return uniqueLive.sort((a, b) => (b.fixture?.timestamp || 0) - (a.fixture?.timestamp || 0));
  }, [liveMatches, allUpcomingMatches, pastMatches, selectedTeamIds, filterMatchesByTeam, countdownTicker]);

  const filteredUpcomingMatches = React.useMemo(() => {
    // ✅ Mock maçları da filtreleme fonksiyonundan geçir
    const filtered = filterMatchesByTeam(allUpcomingMatches, selectedTeamIds);
    
    // Birleştir: filtrelenmiş maçlar (mock + gerçek birlikte filtrelendi)
    const combined = filtered;
    
    // ✅ Duplicate fixture ID'leri kaldır (canlı maçları da hariç tut)
    const liveIds = new Set(filteredLiveMatches.map(m => m.fixture?.id));
    const uniqueMatches = combined.reduce((acc: any[], match) => {
      const fixtureId = match.fixture?.id;
      if (fixtureId && !acc.some(m => m.fixture?.id === fixtureId) && !liveIds.has(fixtureId)) {
        acc.push(match);
      }
      return acc;
    }, []);
    
    // Tarih sırasına göre sırala (en yakın en üstte)
    return uniqueMatches.sort((a, b) => {
      const timeDiff = a.fixture.timestamp - b.fixture.timestamp;
      if (timeDiff !== 0) return timeDiff;
      return getLeaguePriority(a.league.name) - getLeaguePriority(b.league.name);
    });
  }, [allUpcomingMatches, selectedTeamIds, filterMatchesByTeam, filteredLiveMatches]);

  // ✅ Filtrelenmiş geçmiş maçlar (selectedTeamIds'e göre)
  const filteredPastMatches = React.useMemo(() => {
    const filtered = filterMatchesByTeam(pastMatches, selectedTeamIds);
    
    // ✅ Duplicate fixture ID'leri kaldır VE canlı maçları hariç tut
    const liveIds = new Set(filteredLiveMatches.map(m => m.fixture?.id));
    const uniqueMatches = filtered.reduce((acc: any[], match) => {
      const fixtureId = match.fixture?.id;
      // ✅ Canlı maçlar past listesinde görünmemeli
      if (fixtureId && !acc.some(m => m.fixture?.id === fixtureId) && !liveIds.has(fixtureId)) {
        acc.push(match);
      }
      return acc;
    }, []);
    
    // ✅ Sırala: En son biten maç en üstte
    return uniqueMatches.sort((a, b) => {
      return (b.fixture?.timestamp || 0) - (a.fixture?.timestamp || 0);
    });
  }, [pastMatches, selectedTeamIds, filterMatchesByTeam, filteredLiveMatches]);

  // ✅ Tüm maç ID'lerini birleştir (tahmin kontrolü için - canlı, yaklaşan VE biten)
  const allActiveMatchIds = React.useMemo(() => {
    const upcomingIds = filteredUpcomingMatches.map(m => m.fixture.id);
    const liveIds = filteredLiveMatches.map(m => m.fixture.id);
    const pastIds = filteredPastMatches.map((m: any) => m.fixture?.id).filter(Boolean);
    return [...new Set([...upcomingIds, ...liveIds, ...pastIds])]; // Unique ID'ler
  }, [filteredUpcomingMatches, filteredLiveMatches, filteredPastMatches]);
  const { matchIdsWithPredictions, clearPredictionForMatch, refresh: refreshPredictions } = useMatchesWithPredictions(allActiveMatchIds);
  
  // ✅ Mock maçları (test_matches) yükle
  const [mockMatches, setMockMatches] = React.useState<any[]>([]);
  const [mockMatchesLoading, setMockMatchesLoading] = React.useState(false);
  
  // ✅ Mock maçları tahmin yapılan/yapılmayan olarak kategorize et (useMemo önce tanımlanmalı)
  const mockMatchesWithPrediction = React.useMemo(() => {
    if (!mockMatches || !matchIdsWithPredictions) return [];
    return mockMatches.filter(m => m?.fixture?.id && matchIdsWithPredictions.has(m.fixture.id));
  }, [mockMatches, matchIdsWithPredictions]);
  
  const mockMatchesWithoutPrediction = React.useMemo(() => {
    if (!mockMatches || !matchIdsWithPredictions) return [];
    return mockMatches.filter(m => m?.fixture?.id && !matchIdsWithPredictions.has(m.fixture.id));
  }, [mockMatches, matchIdsWithPredictions]);
  
  React.useEffect(() => {
    const loadMockMatches = async () => {
      setMockMatchesLoading(true);
      try {
        console.log('🔍 [Dashboard] Loading mock matches...');
        const result = await matchesDb.getTestMatches();
        console.log('🔍 [Dashboard] Mock matches result:', { 
          success: result.success, 
          count: result.data?.length || 0, 
          error: result.error,
          data: result.data ? result.data.slice(0, 2) : null // İlk 2 maçı göster
        });
        if (result.success && result.data && result.data.length > 0) {
          console.log('✅ [Dashboard] Mock matches loaded:', result.data.length, 'matches');
          console.log('📋 [Dashboard] First mock match:', result.data[0]);
          setMockMatches(result.data);
        } else {
          console.log('⚠️ [Dashboard] Mock matches failed or empty:', result.error || 'No data', { 
            success: result.success, 
            dataLength: result.data?.length || 0 
          });
          setMockMatches([]);
        }
      } catch (error: any) {
        console.error('❌ Error loading mock matches:', error?.message || error, error);
        setMockMatches([]);
      } finally {
        setMockMatchesLoading(false);
        console.log('🏁 [Dashboard] Mock matches loading finished');
      }
    };
    
    loadMockMatches();
  }, []);
  
  // Debug: Mock matches state değişikliklerini izle
  React.useEffect(() => {
    if (mockMatches.length > 0) {
      console.log('📊 [Dashboard] Mock matches state changed:', { 
        count: mockMatches.length, 
        withPrediction: mockMatchesWithPrediction.length,
        withoutPrediction: mockMatchesWithoutPrediction.length,
        loading: mockMatchesLoading
      });
    }
  }, [mockMatches, mockMatchesLoading, mockMatchesWithPrediction.length, mockMatchesWithoutPrediction.length]);
  
  // ✅ Dashboard'a geri dönüldüğünde tahminleri yenile (AppState listener)
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshPredictions();
      }
    });
    return () => subscription.remove();
  }, [refreshPredictions]);

  // ✅ Maç kartı yüksekliği (sabit height + marginBottom)
  // matchCardContainer.height (175) + matchCardWrapper.marginBottom (8) = 183
  const MATCH_CARD_HEIGHT = 175 + 8;


  // ✅ Scroll pozisyonunu kaydetmek için ref
  const hasScrolledRef = React.useRef(false);
  const pastSectionHeightRef = React.useRef(0);
  
  // ✅ Sayfa hazır olduğunda görünür yap
  // Geçmiş maç varsa onLayout'ta scroll yapılır, yoksa direkt görünür yap
  React.useEffect(() => {
    if (!initialScrollDone && filteredPastMatches.length === 0) {
      // Geçmiş maç yoksa direkt görünür yap (scroll gerekmiyor)
      const timer = setTimeout(() => {
        setInitialScrollDone(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialScrollDone, filteredPastMatches.length]);

  // ✅ Filtreleme değiştiğinde veya canlı maç geldiğinde doğru pozisyona scroll yap
  // Canlı maç varsa ona, yoksa en yakın yaklaşan maça scroll et
  const lastSelectedTeamIdsRef = React.useRef<number[]>([]);
  React.useEffect(() => {
    // Filtre değişikliğini tespit et
    const filterChanged = JSON.stringify(selectedTeamIds) !== JSON.stringify(lastSelectedTeamIdsRef.current);
    lastSelectedTeamIdsRef.current = selectedTeamIds;
    
    if ((filterChanged || filteredLiveMatches.length > 0) && scrollViewRef.current) {
      // Biten maçların yüksekliği kadar scroll et - canlı/yaklaşan maç görünsün
      const targetY = pastSectionHeightRef.current;
      setTimeout(() => {
        (scrollViewRef.current as any)?.scrollTo?.({ y: targetY, animated: filterChanged });
        if (!initialScrollDone) {
          setInitialScrollDone(true);
        }
      }, 100);
    }
  }, [filteredLiveMatches.length, selectedTeamIds, initialScrollDone]);

  // ✅ Snap noktalarını hesapla - her maç kartının başlangıç noktası
  // snapToOffsets prop'u için kullanılır
  const snapOffsets = React.useMemo(() => {
    const offsets: number[] = [];
    const pastCount = filteredPastMatches.length;
    const liveCount = filteredLiveMatches.length;
    const upcomingCount = filteredUpcomingMatches.length;
    
    // Biten maçlar (0'dan başlar)
    for (let i = 0; i < pastCount; i++) {
      offsets.push(i * MATCH_CARD_HEIGHT);
    }
    
    // Canlı maçlar (biten maçlardan sonra başlar)
    const liveStart = pastCount * MATCH_CARD_HEIGHT;
    for (let i = 0; i < liveCount; i++) {
      offsets.push(liveStart + i * MATCH_CARD_HEIGHT);
    }
    
    // Yaklaşan maçlar (canlı maçlardan sonra başlar)
    const upcomingStart = liveStart + liveCount * MATCH_CARD_HEIGHT;
    for (let i = 0; i < upcomingCount; i++) {
      offsets.push(upcomingStart + i * MATCH_CARD_HEIGHT);
    }
    
    return offsets;
  }, [MATCH_CARD_HEIGHT, filteredPastMatches.length, filteredLiveMatches.length, filteredUpcomingMatches.length]);

  // ✅ Loading durumunda da grid pattern göster
  // Maçlar yüklenirken veya backend çalışmıyorken bile UI gösterilmeli
  const showLoadingIndicator = loading && !hasLoadedOnce;
  

  // ✅ handleTeamSelect artık App.tsx'te - ProfileCard üzerinden yönetiliyor


  return (
    <View style={styles.container}>
      {/* Grid Pattern Background - Splash screen ile uyumlu */}
      <View style={styles.gridPattern} />
      
      {/* ✅ Takım filtresi artık ProfileCard içinde - App.tsx'ten yönetiliyor */}

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { opacity: initialScrollDone ? 1 : 0 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
      >

        {/* ✅ Loading Indicator - Grid pattern üzerinde */}
        {showLoadingIndicator && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.primary} />
            <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
          </View>
        )}

        {/* 
          SCROLL YAPISI (yukarıdan aşağıya sıralama):
          ─────────────────────────────────────────────
          [Biten Maç 2 - en eski]     ← Ekranın en üstü (aşağı kaydırınca görünür)
          [Biten Maç 1 - daha yeni]
          ═══ ProfileCard alt çizgisi ═══ (SABİT, bu seviyede görünür)
          [Canlı Maç]                 ← Sayfa açıldığında bu görünür
          [Yaklaşan Maç 1 - en yakın]
          [Yaklaşan Maç 2]
          [Yaklaşan Maç 3 - en uzak]  ← Ekranın en altı (yukarı kaydırınca görünür)
        */}

        {/* ✅ BİTEN MAÇLAR - Aşağı kaydırınca görünür (en eski en üstte) */}
        {!showLoadingIndicator && filteredPastMatches.length > 0 && (
          <View 
            style={styles.matchesListContainer}
            onLayout={(e) => {
              const pastMatchesHeight = e.nativeEvent.layout.height;
              pastSectionHeightRef.current = pastMatchesHeight;
              // Biten maçlar yüklendikten sonra canlı/yaklaşan maçlara scroll et
              if (!hasScrolledRef.current && scrollViewRef.current) {
                hasScrolledRef.current = true;
                // Biten maçların sonuna scroll et - canlı/yaklaşan maç ProfileCard altında görünsün
                setTimeout(() => {
                  if (scrollViewRef.current) {
                    (scrollViewRef.current as any).scrollTo?.({ y: pastMatchesHeight, animated: false });
                    setInitialScrollDone(true);
                  }
                }, 50);
              }
            }}
          >
            {/* Biten maçları TERS sırada göster (en eski en üstte) */}
            {[...filteredPastMatches].reverse().map((match, index) => (
              <Animated.View 
                key={`past-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'finished', () => handleMatchPress(match), {
                  hasPrediction: matchIdsWithPredictions.has(match.fixture.id),
                  matchId: match.fixture.id,
                  onDeletePrediction: clearPredictionForMatch,
                })}
              </Animated.View>
            ))}
          </View>
        )}

        {/* ✅ CANLI MAÇLAR - ProfileCard'ın hemen altında görünür */}
        {!showLoadingIndicator && filteredLiveMatches.length > 0 && (
          <View style={styles.matchesListContainer}>
            {filteredLiveMatches.map((match, index) => (
              <Animated.View 
                key={`live-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'live', () => handleMatchPress(match), {
                  hasPrediction: matchIdsWithPredictions.has(match.fixture.id),
                  matchId: match.fixture.id,
                  onDeletePrediction: clearPredictionForMatch,
                })}
              </Animated.View>
            ))}
          </View>
        )}

        {/* ✅ YAKLAŞAN MAÇLAR - Yukarı kaydırınca görünür (en yakın en üstte) */}
        {!showLoadingIndicator && filteredUpcomingMatches.length > 0 && (
          <View style={styles.matchesListContainer}>
            {filteredUpcomingMatches.map((match, index) => (
              <Animated.View 
                key={`upcoming-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'upcoming', () => handleMatchPress(match), {
                  hasPrediction: matchIdsWithPredictions.has(match.fixture.id),
                  matchId: match.fixture.id,
                  onDeletePrediction: clearPredictionForMatch,
                })}
              </Animated.View>
            ))}
          </View>
        )}

        {/* ✅ MOCK MAÇLAR - Test ortamı için */}
        {!showLoadingIndicator && mockMatches.length > 0 && (
          <>
            {/* Tahmin Yapılan Mock Maçlar */}
            {mockMatchesWithPrediction.length > 0 && (
              <View style={styles.matchesListContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.sectionTitle}>Tahmin Yapılan Mock Maçlar ({mockMatchesWithPrediction.length})</Text>
                </View>
                {mockMatchesWithPrediction.map((match, index) => (
                  <Animated.View 
                    key={`mock-predicted-${match.fixture.id}`} 
                    entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                    style={styles.matchCardWrapper}
                  >
                    {renderMatchCard(match, 'upcoming', () => handleMatchPress(match), {
                      hasPrediction: true,
                      matchId: match.fixture.id,
                      onDeletePrediction: clearPredictionForMatch,
                    })}
                  </Animated.View>
                ))}
              </View>
            )}
            
            {/* Tahmin Yapılmayan Mock Maçlar */}
            {mockMatchesWithoutPrediction.length > 0 && (
              <View style={styles.matchesListContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="ellipse-outline" size={20} color="#64748B" />
                  <Text style={styles.sectionTitle}>Tahmin Yapılmayan Mock Maçlar ({mockMatchesWithoutPrediction.length})</Text>
                </View>
                {mockMatchesWithoutPrediction.map((match, index) => (
                  <Animated.View 
                    key={`mock-unpredicted-${match.fixture.id}`} 
                    entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                    style={styles.matchCardWrapper}
                  >
                    {renderMatchCard(match, 'upcoming', () => handleMatchPress(match), {
                      hasPrediction: false,
                      matchId: match.fixture.id,
                      onDeletePrediction: clearPredictionForMatch,
                    })}
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Boş Durum - Hiç maç yoksa (ne canlı ne yaklaşan ne geçmiş ne mock) */}
        {!showLoadingIndicator && filteredUpcomingMatches.length === 0 && filteredLiveMatches.length === 0 && filteredPastMatches.length === 0 && mockMatches.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color="#64748B" />
            <Text style={styles.emptyText}>
              {favoriteTeams.length === 0 
                ? t('dashboard.selectFavoriteTeam')
                : error 
                  ? t('dashboard.matchLoadError')
                  : t('dashboard.noMatchesFound')}
            </Text>
            {favoriteTeams.length === 0 && (
              <TouchableOpacity 
                style={styles.selectTeamButton}
                onPress={() => onNavigate?.('profile')}
              >
                <Ionicons name="heart-outline" size={16} color="#1FA2A6" />
                <Text style={styles.selectTeamText}>{t('dashboard.selectTeam')}</Text>
              </TouchableOpacity>
            )}
            {error && favoriteTeams.length > 0 && refetch && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => refetch()}
              >
                <Ionicons name="refresh-outline" size={16} color="#1FA2A6" />
                <Text style={styles.selectTeamText}>{t('dashboard.retry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 + SIZES.tabBarHeight }} />
      </ScrollView>
      
      {/* ✅ Analiz Odağı Seçim Modal'ı */}
      <AnalysisFocusModal
        visible={analysisFocusModalVisible}
        onClose={() => {
          setAnalysisFocusModalVisible(false);
          setSelectedMatchForAnalysis(null);
        }}
        onSelectFocus={handleAnalysisFocusSelect}
        matchInfo={selectedMatchForAnalysis ? {
          homeTeam: selectedMatchForAnalysis.teams?.home?.name || 'Ev Sahibi',
          awayTeam: selectedMatchForAnalysis.teams?.away?.name || 'Deplasman',
          date: new Date(selectedMatchForAnalysis.fixture?.timestamp * 1000).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        } : undefined}
      />

      {/* ✅ Tahmin silme popup - Dashboard maç kartındaki yıldız */}
      {deletePredictionModal && (
        <ConfirmModal
          visible={true}
          title="Tahmini sil"
          message="Bu maça yaptığınız tahmini silmek istiyor musunuz? Analiz odağı seçimi de sıfırlanacak."
          buttons={[
            { text: 'Vazgeç', style: 'cancel', onPress: () => setDeletePredictionModal(null) },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: async () => {
                const matchId = deletePredictionModal.matchId;
                console.log('🗑️ Tahmin siliniyor, matchId:', matchId);
                // ✅ clearPredictionForMatch state'i otomatik günceller
                await clearPredictionForMatch(matchId);
                console.log('✅ Tahmin silme işlemi tamamlandı, matchId:', matchId);
                // ✅ Başarılı - modal ConfirmModal tarafından kapatılacak
              },
            },
          ]}
          onRequestClose={() => setDeletePredictionModal(null)}
        />
      )}

      {/* ✅ İki favori takım için tahmin silme modal (seçilebilir seçenekler + onay butonu) */}
      {deletePredictionTeamModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setDeletePredictionTeamModal(null);
            setSelectedTeamToDelete(null);
          }}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                setDeletePredictionTeamModal(null);
                setSelectedTeamToDelete(null);
              }}
            />
            <View style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(31, 162, 166, 0.4)',
              overflow: 'hidden',
              padding: 24,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="warning" size={40} color="#F59E0B" />
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 12,
              }}>Tahminleri Sil</Text>
              <Text style={{
                fontSize: 15,
                color: '#E5E7EB',
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 24,
              }}>Hangi takıma ait tahmini silmek istiyorsunuz?</Text>
              
              {/* Seçilebilir seçenekler */}
              <View style={{ gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: selectedTeamToDelete === 'home' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'home' ? '#EF4444' : 'rgba(107, 114, 128, 0.4)',
                  }}
                  onPress={() => setSelectedTeamToDelete('home')}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'home' ? '#EF4444' : '#64748B',
                    backgroundColor: selectedTeamToDelete === 'home' ? '#EF4444' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selectedTeamToDelete === 'home' && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                      }} />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selectedTeamToDelete === 'home' ? '#FFFFFF' : '#E5E7EB',
                  }}>{deletePredictionTeamModal.homeTeamName} tahminini sil</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: selectedTeamToDelete === 'away' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'away' ? '#EF4444' : 'rgba(107, 114, 128, 0.4)',
                  }}
                  onPress={() => setSelectedTeamToDelete('away')}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'away' ? '#EF4444' : '#64748B',
                    backgroundColor: selectedTeamToDelete === 'away' ? '#EF4444' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selectedTeamToDelete === 'away' && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                      }} />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selectedTeamToDelete === 'away' ? '#FFFFFF' : '#E5E7EB',
                  }}>{deletePredictionTeamModal.awayTeamName} tahminini sil</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: selectedTeamToDelete === 'both' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'both' ? '#EF4444' : 'rgba(107, 114, 128, 0.4)',
                  }}
                  onPress={() => setSelectedTeamToDelete('both')}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selectedTeamToDelete === 'both' ? '#EF4444' : '#64748B',
                    backgroundColor: selectedTeamToDelete === 'both' ? '#EF4444' : 'transparent',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {selectedTeamToDelete === 'both' && (
                      <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                      }} />
                    )}
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selectedTeamToDelete === 'both' ? '#FFFFFF' : '#E5E7EB',
                  }}>Her ikisini de sil</Text>
                </TouchableOpacity>
              </View>
              
              {/* Onay butonları */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'flex-end',
              }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    minWidth: 100,
                    alignItems: 'center',
                    backgroundColor: 'rgba(107, 114, 128, 0.4)',
                  }}
                  onPress={() => {
                    setDeletePredictionTeamModal(null);
                    setSelectedTeamToDelete(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    minWidth: 100,
                    alignItems: 'center',
                    backgroundColor: selectedTeamToDelete ? 'rgba(239, 68, 68, 0.3)' : 'rgba(107, 114, 128, 0.3)',
                    borderWidth: 1,
                    borderColor: selectedTeamToDelete ? 'rgba(239, 68, 68, 0.6)' : 'rgba(107, 114, 128, 0.4)',
                    opacity: selectedTeamToDelete ? 1 : 0.5,
                  }}
                  onPress={async () => {
                    if (!selectedTeamToDelete) return;
                    
                    try {
                      const matchId = deletePredictionTeamModal.matchId;
                      console.log('🗑️ İki takım için tahmin siliniyor, matchId:', matchId, 'team:', selectedTeamToDelete);
                      if (selectedTeamToDelete === 'home') {
                        await clearPredictionForMatch(matchId, deletePredictionTeamModal.homeId);
                      } else if (selectedTeamToDelete === 'away') {
                        await clearPredictionForMatch(matchId, deletePredictionTeamModal.awayId);
                      } else if (selectedTeamToDelete === 'both') {
                        await clearPredictionForMatch(matchId);
                      }
                      console.log('✅ İki takım için tahmin silme işlemi tamamlandı');
                      // ✅ Modal'ı kapat
                      setDeletePredictionTeamModal(null);
                      setSelectedTeamToDelete(null);
                    } catch (error) {
                      console.error('❌ Tahmin silme hatası:', error);
                      Alert.alert('Hata', 'Tahmin silinirken bir hata oluştu. Lütfen tekrar deneyin.');
                    }
                  }}
                  activeOpacity={selectedTeamToDelete ? 0.8 : 1}
                  disabled={!selectedTeamToDelete}
                >
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selectedTeamToDelete ? '#FCA5A5' : '#9CA3AF',
                  }}>Tahmini Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ İki favori takım için maç kartı tıklama modal (hangi takım için devam edilecek) */}
      {teamSelectionModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setTeamSelectionModal(null)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setTeamSelectionModal(null)}
            />
            <View style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(31, 162, 166, 0.4)',
              overflow: 'hidden',
              padding: 24,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="people" size={40} color="#1FA2A6" />
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 12,
              }}>Takım Seçimi</Text>
              <Text style={{
                fontSize: 15,
                color: '#E5E7EB',
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 24,
              }}>Hangi favori takım için devam ediyorsunuz?</Text>
              
              {/* Takım seçenekleri */}
              <View style={{ gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: 'rgba(31, 162, 166, 0.2)',
                    borderWidth: 2,
                    borderColor: 'rgba(31, 162, 166, 0.6)',
                  }}
                  onPress={() => {
                    const { match, homeId, initialTab, hasPrediction, isLive, isFinished } = teamSelectionModal;
                    if (hasPrediction || isLive || isFinished) {
                      onNavigate('match-detail', {
                        id: String(match.fixture.id),
                        initialTab,
                        matchData: match,
                        predictionTeamId: homeId, // ✅ predictionTeamId eklendi
                      });
                    } else {
                      // Tahmin yok: analiz odağı seçimi göster
                      setSelectedMatchForAnalysis(match);
                      setSelectedPredictionTeamIdForAnalysis(homeId); // ✅ Seçilen takım ID'sini sakla
                      setAnalysisFocusModalVisible(true);
                    }
                    setTeamSelectionModal(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home" size={20} color="#1FA2A6" style={{ marginRight: 12 }} />
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    flex: 1,
                  }}>{teamSelectionModal.homeTeamName}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: 'rgba(31, 162, 166, 0.2)',
                    borderWidth: 2,
                    borderColor: 'rgba(31, 162, 166, 0.6)',
                  }}
                  onPress={() => {
                    const { match, awayId, initialTab, hasPrediction, isLive, isFinished } = teamSelectionModal;
                    if (hasPrediction || isLive || isFinished) {
                      onNavigate('match-detail', {
                        id: String(match.fixture.id),
                        initialTab,
                        matchData: match,
                        predictionTeamId: awayId, // ✅ predictionTeamId eklendi
                      });
                    } else {
                      // Tahmin yok: analiz odağı seçimi göster
                      setSelectedMatchForAnalysis(match);
                      setSelectedPredictionTeamIdForAnalysis(awayId); // ✅ Seçilen takım ID'sini sakla
                      setAnalysisFocusModalVisible(true);
                    }
                    setTeamSelectionModal(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="airplane" size={20} color="#1FA2A6" style={{ marginRight: 12 }} />
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    flex: 1,
                  }}>{teamSelectionModal.awayTeamName}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              {/* Vazgeç butonu */}
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: 'rgba(107, 114, 128, 0.4)',
                }}
                onPress={() => setTeamSelectionModal(null)}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ 120 saniyelik CountdownWarningModal kaldırıldı - artık kullanılmıyor */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2A24', // Koyu yeşil taban - Splash screen ile uyumlu
    position: 'relative',
  },
  // Grid Pattern Background - Profil ekranı ile aynı (belirgin grid)
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
          linear-gradient(to right, rgba(31, 162, 166, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      } as any,
      default: {
        // Native'de grid pattern: border trick ile ızgara efekti
        backgroundColor: 'transparent',
        borderColor: 'rgba(31, 162, 166, 0.06)',
        borderWidth: 0,
      },
    }),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.base,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent', // Grid pattern görünsün
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 238 : 228, // ✅ ProfileCard yüksekliği + filtre barı + boşluk (2px yukarı)
    paddingBottom: 100 + SIZES.tabBarHeight, // ✅ Footer navigation için extra padding
    backgroundColor: 'transparent', // Grid pattern görünsün
  },

  // Section - %75 azaltılmış boşluklar
  section: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.md,
  },
  sectionWithDropdown: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    zIndex: 10000,
    elevation: 10000,
    position: 'relative',
  },
  
  // ✅ Takım Filtre Barı Stilleri - SABİT KONUM (Profil kartı gibi)
  teamFilterBarFixed: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 195 : 185, // Profil kartının tam altında (daha aşağı)
    left: 12,
    right: 12,
    zIndex: 9000,
    elevation: 9000,
    backgroundColor: '#1E3A3A', // ✅ BottomNavigation ile aynı renk
    paddingVertical: 12,
    paddingHorizontal: SPACING.base,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(31, 162, 166, 0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  teamFilterBar: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.base,
    zIndex: 100,
  },
  teamFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(75, 85, 99, 0.5)',
  },
  teamChipActive: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  teamChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  teamChipTextActive: {
    color: '#FFFFFF',
  },
  teamChipBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  teamChipStripe: {
    flex: 1,
    height: '100%',
  },
  teamChipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamChipEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamChipEmptyText: {
    fontSize: 12,
    color: '#64748B',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark.foreground,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  scrollHint: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.base,
    marginLeft: 28,
  },

  // Upcoming Matches Scroll (Horizontal)
  upcomingMatchesScroll: {
    paddingHorizontal: SPACING.base, // ✅ Ortada hizalanması için yan padding
    paddingRight: SPACING.base + SPACING.md, // Son kart için ekstra padding
    gap: 0,
    ...(Platform.OS === 'web' && {
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
    } as any),
  },
  liveMatchesScroll: {
    paddingBottom: 16,
    gap: 16,
  },
  liveMatchCardWrapper: {
    width: '100%',
    marginBottom: 0,
  },
  
  // Live Match Card
  liveMatchCard: {
    width: 320, // Fixed width for horizontal scroll
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusXl,
    padding: SPACING.base,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.dark.error,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dark.error,
    marginRight: SPACING.md,
  },
  liveText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.error,
    marginRight: SPACING.sm,
  },
  liveMinute: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.error,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchTeam: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: 4,
  },
  teamLogoImage: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  teamName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.dark.foreground,
    textAlign: 'center',
  },
  matchScore: {
    paddingHorizontal: SPACING.base,
  },
  scoreText: {
    ...TYPOGRAPHY.h2,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark.foreground,
  },
  vsText: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    color: COLORS.dark.foreground,
    marginBottom: SPACING.md,
  },
  matchCenterInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    minWidth: 120,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 3,
    marginBottom: 1,
  },
  matchInfoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
    fontWeight: '500',
    maxWidth: 100,
  },
  matchDateText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
    fontWeight: '600',
    marginTop: SPACING.xs,
    marginBottom: 2,
  },
  matchTimeText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.primary,
    marginTop: 0,
  },
  teamScore: {
    ...TYPOGRAPHY.xl,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark.foreground,
    marginTop: SPACING.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
  },
  elapsedTime: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.error,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  historyLeague: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  liveTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: SIZES.radiusLg,
    gap: SPACING.md,
  },
  liveTrackText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: BRAND.white,
  },

  // Upcoming Match Card - Tam ekran genişliği
  upcomingMatchCard: {
    width: width - SPACING.base * 2, // Ekran genişliği - sadece yan padding
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    height: 160, // ✅ Sabit yükseklik - tüm kartlar aynı
    position: 'relative',
    ...(Platform.OS === 'web' && {
      scrollSnapAlign: 'center',
      scrollSnapStop: 'always',
    } as any),
    overflow: 'hidden',
    ...SHADOWS.sm,
    ...Platform.select({
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  // ✅ Sol kenar gradient şerit - takım renkleri
  matchColorStripeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6, // ✅ Resimdeki gibi ince şerit
    zIndex: 0,
  },
  // ✅ Sağ kenar gradient şerit - takım renkleri
  matchColorStripeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6, // ✅ Resimdeki gibi ince şerit
    zIndex: 0,
  },
  // ✅ Lige göre ikon ve isim container'ı
  matchLeagueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // ✅ Takımlar ve maç bilgileri container'ı
  matchContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
    zIndex: 1,
  },
  // ✅ Sol takım
  matchTeamLeft: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 6,
    zIndex: 1,
  },
  // ✅ Sağ takım
  matchTeamRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 6,
    zIndex: 1,
  },
  // ✅ Ortada VS ve maç bilgileri
  matchCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  // ✅ Takım ismi (güncellenmiş)
  matchTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark.foreground,
    marginBottom: 3,
    lineHeight: 16,
  },
  // ✅ Teknik direktör ismi
  matchCoachName: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.dark.mutedForeground,
    fontStyle: 'italic',
    marginTop: 1,
    lineHeight: 14,
  },
  // ✅ Geri sayım container'ı
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  countdownText: {
    fontSize: 10,
    color: BRAND.gold,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // ✅ Stad container'ı (daha belirgin)
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
    zIndex: 1,
  },
  venueText: {
    fontSize: 11,
    color: COLORS.dark.foreground,
    fontWeight: '600',
    flex: 1,
  },
  // ✅ Hakem container'ı (en altta)
  refereeContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
    gap: SPACING.xs,
    zIndex: 1,
  },
  refereeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  refereeLabel: {
    fontSize: 9,
    color: COLORS.dark.mutedForeground,
    fontWeight: '500',
  },
  refereeName: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    color: COLORS.dark.mutedForeground,
    fontWeight: '600',
    flex: 1,
  },
  selectedMatchCard: {
    borderColor: BRAND.gold,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.5)',
      },
    }),
  },
  focusSectionContainer: {
    marginBottom: 24,
  },
  selectedMatchInfo: {
    backgroundColor: BRAND.emerald,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  selectedMatchTitle: {
    fontSize: 12,
    color: BRAND.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedMatchTeams: {
    fontSize: 16,
    color: BRAND.white,
    fontWeight: '700',
  },
  continueButtonContainer: {
    marginTop: 20,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  matchLeague: {
    fontSize: 11,
    color: COLORS.dark.mutedForeground,
    flex: 1,
    fontWeight: '600',
  },
  scrollHintIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark.primary,
  },
  adviceBalloon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    gap: 6,
  },
  adviceIcon: {
    fontSize: 14,
  },
  adviceText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    position: 'relative',
  },
  predictButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.white,
  },
  glowDot: {
    position: 'absolute',
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.white,
    ...Platform.select({
      web: {
        boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
      },
      default: {
        shadowColor: BRAND.white,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },

  // Strategic Focus
  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  focusCard: {
    width: '100%',
    minHeight: 180,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusXl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    position: 'relative',
    overflow: 'hidden',
  },
  focusCardSelected: {
    backgroundColor: `${BRAND.primary}14`, // BRAND.primary with 8% opacity
    borderColor: COLORS.dark.warning,
    borderWidth: 2,
    // Gölge efektleri kaldırıldı
  },
  focusCardUnselected: {
    opacity: 0.6,
  },
  focusIconContainer: {
    width: SIZES.iconMd,
    height: SIZES.iconMd,
    borderRadius: SIZES.iconMd / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  focusContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  focusName: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.foreground,
    marginBottom: 3,
  },
  focusMultiplier: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark.primary,
    marginBottom: SPACING.xs,
  },
  focusDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  focusAffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 'auto',
  },
  focusAffectTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: SIZES.radiusSm,
    maxWidth: '48%',
  },
  focusAffectText: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '700',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Match History (Vertical)
  matchHistoryVertical: {
    gap: 7, // ✅ %45 azaltıldı (12 → 7: 12 * 0.55 = 6.6)
  },
  historyCardVertical: {
    width: '100%',
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusXl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.dark.mutedForeground,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark.foreground,
  },
  historyTeams: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.md,
    height: 32,
  },
  historyStats: {
    gap: SPACING.md,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  historyStatText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
  },
  badgeStamps: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badgeStamp: {
    fontSize: 20,
    opacity: 0.8,
  },
  viewAllBadgesButton: {
    width: '100%',
    backgroundColor: `rgba(245, 158, 11, 0.1)`, // BRAND.gold with opacity
    borderRadius: SIZES.radiusXl,
    padding: SPACING.base,
    borderWidth: 2,
    borderColor: `rgba(245, 158, 11, 0.3)`, // BRAND.gold with opacity
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  viewAllBadgesText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 13,
    color: BRAND.gold,
    textAlign: 'center',
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyHistoryState: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  selectTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  selectTeamText: {
    color: '#1FA2A6',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  // Dropdown Filter
  dropdownContainer: {
    position: 'relative',
    zIndex: 10001,
    elevation: 10001, // Android için - çok yüksek
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a3a34', // Daha belirgin koyu yeşil arka plan
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BRAND.primary,
    zIndex: 10001,
    elevation: 10001, // Android için - çok yüksek
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.base,
  },
  dropdownButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.dark.foreground,
    flex: 1,
  },
  clearFilterButton: {
    marginLeft: SPACING.sm,
    minWidth: 44, // Minimum touch target (iOS/Android standard)
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    overflow: 'hidden',
    ...SHADOWS.lg,
    maxHeight: 300,
    zIndex: 10002, // En yüksek z-index
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    minHeight: 44, // Minimum touch target (iOS/Android standard)
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  dropdownItemActive: {
    backgroundColor: `${BRAND.primary}1A`, // BRAND.primary with 10% opacity
  },
  dropdownItemText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.dark.mutedForeground,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: COLORS.dark.foreground,
    fontWeight: '600',
  },
  dropdownTeamBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  dropdownTeamStripe: {
    flex: 1,
    height: '100%',
  },
  dropdownTeamPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownTeamEmoji: {
    fontSize: 12,
  },
  dropdownEmptyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: COLORS.dark.mutedForeground,
    fontStyle: 'italic',
  },
  
  // ✅ Yeni Maç Kartı Stilleri (Verilen koddan)
  matchCardContainer: {
    width: '100%',
    maxWidth: 768,
    height: 175, // ✅ Sabit yükseklik - tam 3 kart ekrana sığsın
  },
  matchCardPredictionStarHitArea: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  matchCardPredictionStarText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fbbf24',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 10,
  },
  matchCardWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.base,
    marginBottom: 8,
  },
  matchesListContainer: {
    width: '100%',
  },
  
  // ✅ Biten Maçlar Section
  pastMatchesSection: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  pastMatchesCollapsedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: SPACING.base,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderStyle: 'dashed',
  },
  pastMatchesCollapsedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pastMatchesExpandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 12,
    marginHorizontal: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  pastMatchesExpandedList: {
    marginTop: SPACING.md,
  },
  // ✅ Canlı/Yaklaşan Maçlar Divider
  liveMatchesDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  // ✅ Biten Maçlar Header - Çizgili ayraç stili
  pastMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  pastMatchesHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  pastMatchesHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 16,
    marginHorizontal: SPACING.sm,
  },
  pastMatchesHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pastMatchesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pastMatchesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pastMatchesCount: {
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 10,
    minWidth: 22,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pastMatchesCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  pastMatchesCompact: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    gap: 6,
  },
  pastMatchCompactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  pastMatchCompactTeams: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    flex: 1,
  },
  pastMatchCompactDate: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
  },
  pastMatchesMoreText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 4,
  },

  // ✅ Canlı Maçlar Header
  liveMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  liveIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  liveMatchesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    flex: 1,
  },
  liveMatchesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // ✅ Yaklaşan Maçlar Header
  upcomingMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  upcomingMatchesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
    flex: 1,
  },
  upcomingMatchesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: BRAND.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // ✅ Tekrar Dene butonu
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },

  // ✅ Biten Maçlar Header
  finishedMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  finishedMatchesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
  },
  finishedMatchesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1FA2A6',
  },

  matchCard: {
    width: '100%',
    height: 175, // ✅ Sabit yükseklik - tam 3 kart ekrana sığsın
    borderRadius: SIZES.radiusXl,
    borderBottomLeftRadius: 25, // ✅ Profil kartı gibi yuvarlatılmış alt köşeler
    borderBottomRightRadius: 25, // ✅ Profil kartı gibi yuvarlatılmış alt köşeler
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(31, 162, 166, 0.25)', // Turkuaz border
    backgroundColor: '#1A3A34', // Koyu yeşil - zemin ile uyumlu
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(100, 116, 139, 0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    }),
  },
  matchCardLeftStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SPACING.sm,
    height: '100%',
    zIndex: 0,
  },
  matchCardRightStrip: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: SPACING.sm,
    height: '100%',
    zIndex: 0,
  },
  matchCardContent: {
    flex: 1,
    paddingTop: 6,
    paddingHorizontal: 10,
    paddingBottom: 2,
    zIndex: 1,
    justifyContent: 'space-between', // ✅ İçeriği eşit dağıt
  },
  matchCardTournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  matchCardTournamentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 3,
    backgroundColor: `rgba(16, 185, 129, 0.1)`,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: `rgba(16, 185, 129, 0.2)`,
    marginBottom: 2,
  },
  // ✅ Tahmin yapılmış maçlar için sarı turnuva badge (tıklanabilir)
  matchCardTournamentBadgePrediction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 3,
    backgroundColor: `rgba(251, 191, 36, 0.15)`, // Altın sarısı arka plan
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    marginBottom: SPACING.xs,
  },
  matchCardTeamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  matchCardTeamLeft: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0, // ✅ Text overflow için
  },
  matchCardTeamRight: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0, // ✅ Text overflow için
  },
  matchCardTeamName: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontWeight: 'bold',
    color: BRAND.white,
    marginBottom: 2,
  },
  matchCardTeamNameRight: {
    textAlign: 'right',
  },
  matchCardCoachName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
  },
  matchCardCoachNameAway: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.warning,
  },
  matchCardCenterInfo: {
    alignItems: 'center',
    minWidth: 140,
    maxWidth: 160,
  },
  matchCardTournamentText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.dark.success,
  },
  // ✅ Tahmin yapılmış maçlar için sarı turnuva yazısı
  matchCardTournamentTextPrediction: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#fbbf24', // Altın sarısı
  },
  matchCardVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: 1,
    marginBottom: 3,
  },
  matchCardVenueInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  matchCardVenueText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
    fontWeight: '500',
  },
  matchCardMatchInfoCard: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
  },
  matchCardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  matchCardInfoText: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    color: COLORS.dark.mutedForeground,
    fontWeight: '500',
  },
  matchCardInfoTextBold: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.dark.mutedForeground,
    fontWeight: '600',
  },
  matchCardTimeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
    marginTop: 1,
    height: 28, // ✅ Sabit yükseklik - canlı maçlarla aynı olsun
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  matchCardTimeText: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  matchCardTimeTextLive: {
    color: '#ef4444',
  },
  matchCardLiveTimeContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Koyu arka plan - daha elit görünüm
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
    marginTop: 1,
    height: 28, // ✅ Sabit yükseklik - yaklaşan maçlarla aynı olsun
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)', // Hafif kırmızı border - canlı maç vurgusu
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)',
      },
    }),
  },
  matchCardLiveTimeText: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FEE2E2', // Açık kırmızımsı beyaz - daha okunabilir ve elit
    textAlign: 'center',
  },
  matchCardLiveContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: 0,
    height: 38, // ✅ Sabit yükseklik - tüm durumlar için aynı (kompakt)
  },
  matchCardLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.error,
    height: 30, // ✅ Tüm badge'ler 30px
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
      },
    }),
  },
  matchCardLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.white,
  },
  matchCardLiveText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  matchCardMinuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  matchCardMinuteText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark.success,
  },
  matchCardLiveMinuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchCardLiveMinuteText: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
  matchCardCountdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ marginTop/marginBottom kaldırıldı - ana container içinde ortalanıyor
  },
  matchCardDaysRemainingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ marginTop/marginBottom kaldırıldı - ana container içinde ortalanıyor
  },
  matchCardDaysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 30, // ✅ Tüm badge'ler 30px
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.warning,
    ...Platform.select({
      ios: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)',
      },
    }),
  },
  matchCardDaysRemainingText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  // Kilitli maç stilleri (7 günden uzak)
  matchCardLockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ marginTop/marginBottom kaldırıldı - ana container içinde ortalanıyor
  },
  matchCardLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 30, // ✅ Tüm badge'ler 30px
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    borderStyle: 'dashed',
  },
  matchCardLockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  matchCardCountdownCard: {
    alignItems: 'center',
    width: '100%',
  },
  matchCardCountdownLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    color: COLORS.dark.mutedForeground,
    fontWeight: '600',
    marginBottom: 1,
  },
  matchCardCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  matchCardCountdownBox: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    height: 30, // ✅ Container height: 38 içine sığacak şekilde
  },
  matchCardCountdownNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: BRAND.white,
    lineHeight: 16,
  },
  matchCardCountdownUnit: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    lineHeight: 9,
  },
  matchCardCountdownSeparator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark.warning,
    marginHorizontal: 1,
  },
  matchCardFinishedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ marginTop/marginBottom kaldırıldı - ana container içinde ortalanıyor
  },
  matchCardFinishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 8,
    height: 30, // ✅ Tüm badge'ler 30px
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    ...Platform.select({
      ios: {
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(71, 85, 105, 0.4)',
      },
    }),
  },
  matchCardFinishedText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  matchCardFinishedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 6,
  },
  matchCardFinishedHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  matchCardRefereeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  matchCardRefereeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  matchCardVarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 28, 135, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  matchCardVarText: {
    ...TYPOGRAPHY.caption,
    fontSize: 7,
    fontWeight: 'bold',
    color: COLORS.dark.accent,
  },
  matchCardRefereeInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  matchCardRefereeLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 8,
    color: COLORS.dark.mutedForeground,
    marginBottom: 1,
  },
  matchCardRefereeName: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.dark.mutedForeground,
    fontWeight: '700',
  },
  matchCardScoreBoxPlaceholder: {
    marginTop: 3,
    minWidth: 36,
    width: 36,
    height: 26, // Skor kutusu ile aynı yükseklik
    opacity: 0,
  },
  matchCardScoreBox: {
    marginTop: 3,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 26, // ✅ Sabit yükseklik - kompakt
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
  matchCardScoreText: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  matchCardScoreBoxLive: {
    marginTop: 3,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 26, // ✅ Sabit yükseklik - kompakt
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
  matchCardScoreTextLive: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.white,
  },
});
