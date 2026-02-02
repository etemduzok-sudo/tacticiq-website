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
import { getTeamColors } from '../utils/teamColors';
import { useMatchesWithPredictions } from '../hooks/useMatchesWithPredictions';
import { useTranslation } from '../hooks/useTranslation';

// Coach cache - takım ID'sine göre teknik direktör isimlerini cache'le
const coachCache: Record<number, string> = {};
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
  // ✅ Tahmin silme popup state
  const [deletePredictionModal, setDeletePredictionModal] = useState<{ matchId: number; onDelete: () => void } | null>(null);
  
  // ✅ Maça tıklandığında: tahmin varsa doğrudan Tahmin sekmesine git, yoksa analiz odağı modal'ını aç
  const handleMatchPress = (match: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const hasPrediction = match?.fixture?.id != null && matchIdsWithPredictions.has(match.fixture.id);
    if (hasPrediction) {
      onNavigate('match-detail', {
        id: String(match.fixture.id),
        initialTab: 'prediction',
        matchData: match,
      });
      return;
    }
    setSelectedMatchForAnalysis(match);
    setAnalysisFocusModalVisible(true);
  };
  
  // ✅ Analiz odağı seçildiğinde maç detayına git
  const handleAnalysisFocusSelect = (focus: AnalysisFocusType) => {
    setAnalysisFocusModalVisible(false);
    if (selectedMatchForAnalysis) {
      onNavigate('match-detail', { 
        id: selectedMatchForAnalysis.fixture.id,
        analysisFocus: focus,
        initialTab: 'squad', // Kadro sekmesiyle başla
        matchData: selectedMatchForAnalysis, // ✅ Maç verisi doğrudan geçiriliyor - API çağrısı yok!
      });
    }
    setSelectedMatchForAnalysis(null);
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
  
  // ✅ Teknik direktör ismini al (2026 Ocak güncel - API fallback)
  // Önce cache'e bak, yoksa fallback listesini kullan
  // API endpoint'i: /api/teams/:id/coach (arka planda çekilecek)
  const getCoachName = (teamName: string, teamId?: number): string => {
    // Eğer teamId varsa ve cache'te varsa, cache'ten döndür
    if (teamId && coachCache[teamId]) {
      return coachCache[teamId];
    }
    
    const name = teamName.toLowerCase();
    // ✅ Fallback liste - Ocak 2026 güncel (web search ile doğrulandı)
    const coaches: Record<string, string> = {
      // Türk Takımları (2026 Ocak güncel)
      'galatasaray': 'Okan Buruk',
      'fenerbahçe': 'Domenico Tedesco', // ✅ Mourinho ayrıldı, Tedesco geldi
      'fenerbahce': 'Domenico Tedesco',
      'beşiktaş': 'Sergen Yalçın', // ✅ Solskjaer ayrıldı, Sergen geldi
      'besiktas': 'Sergen Yalçın',
      'trabzonspor': 'Şenol Güneş',
      'başakşehir': 'Çağdaş Atan',
      'basaksehir': 'Çağdaş Atan',
      // La Liga
      'real madrid': 'Carlo Ancelotti',
      'barcelona': 'Hansi Flick',
      'atletico madrid': 'Diego Simeone',
      'sevilla': 'García Pimienta',
      'villarreal': 'Marcelino',
      'real sociedad': 'Imanol Alguacil',
      // Premier League
      'manchester city': 'Pep Guardiola',
      'arsenal': 'Mikel Arteta',
      'liverpool': 'Arne Slot',
      'manchester united': 'Ruben Amorim',
      'chelsea': 'Enzo Maresca',
      'tottenham': 'Ange Postecoglou',
      // Bundesliga
      'bayern munich': 'Vincent Kompany',
      'bayern': 'Vincent Kompany',
      'borussia dortmund': 'Nuri Şahin',
      'dortmund': 'Nuri Şahin',
      'rb leipzig': 'Marco Rose',
      'leverkusen': 'Xabi Alonso',
      'bayer leverkusen': 'Xabi Alonso',
      // Serie A
      'juventus': 'Thiago Motta',
      'inter': 'Simone Inzaghi',
      'milan': 'Paulo Fonseca',
      'ac milan': 'Paulo Fonseca',
      'napoli': 'Antonio Conte',
      'roma': 'Claudio Ranieri',
      // Ligue 1
      'paris saint germain': 'Luis Enrique',
      'psg': 'Luis Enrique',
      'marseille': 'Roberto De Zerbi',
      // Milli Takımlar
      'türkiye': 'Vincenzo Montella',
      'turkey': 'Vincenzo Montella',
      'almanya': 'Julian Nagelsmann',
      'germany': 'Julian Nagelsmann',
      'brezilya': 'Dorival Júnior',
      'brazil': 'Dorival Júnior',
      'arjantin': 'Lionel Scaloni',
      'argentina': 'Lionel Scaloni',
      'fransa': 'Didier Deschamps',
      'france': 'Didier Deschamps',
      'ingiltere': 'Thomas Tuchel',
      'england': 'Thomas Tuchel',
      'ispanya': 'Luis de la Fuente',
      'spain': 'Luis de la Fuente',
      'italya': 'Luciano Spalletti',
      'italy': 'Luciano Spalletti',
      'portekiz': 'Roberto Martínez',
      'portugal': 'Roberto Martínez',
      'hollanda': 'Ronald Koeman',
      'netherlands': 'Ronald Koeman',
      'belçika': 'Domenico Tedesco',
      'belgium': 'Domenico Tedesco',
    };
    for (const [key, coach] of Object.entries(coaches)) {
      if (name.includes(key)) return coach;
    }
    return 'Bilinmiyor';
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
                  setDeletePredictionModal({ matchId, onDelete: () => onDeletePrediction(matchId) });
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
                <Text style={styles.matchCardTeamName} numberOfLines={1}>{getDisplayTeamName(match.teams.home.name)}</Text>
                <Text style={styles.matchCardCoachName}>{getCoachName(match.teams.home.name)}</Text>
                {(status === 'live' || status === 'finished') && (
                  <View style={status === 'live' ? styles.matchCardScoreBoxLive : styles.matchCardScoreBox}>
                    <Text style={status === 'live' ? styles.matchCardScoreTextLive : styles.matchCardScoreText}>{match.goals?.home ?? 0}</Text>
                  </View>
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
                  
                  {/* Saat */}
                  <LinearGradient
                    colors={[BRAND.primary, BRAND.primaryDark || '#047857']} // Sistem renkleri
                    style={styles.matchCardTimeBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.matchCardTimeText}>
                      {api.utils.formatMatchTime(match.fixture.timestamp)}
                    </Text>
                  </LinearGradient>
                </View>
              </View>
              
              {/* Deplasman Takım */}
              <View style={styles.matchCardTeamRight}>
                <Text style={[styles.matchCardTeamName, styles.matchCardTeamNameRight]} numberOfLines={1}>{getDisplayTeamName(match.teams.away.name)}</Text>
                <Text style={styles.matchCardCoachNameAway}>{getCoachName(match.teams.away.name)}</Text>
                {(status === 'live' || status === 'finished') && (
                  <View style={status === 'live' ? styles.matchCardScoreBoxLive : styles.matchCardScoreBox}>
                    <Text style={status === 'live' ? styles.matchCardScoreTextLive : styles.matchCardScoreText}>{match.goals?.away ?? 0}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Durum Badge'i (Canlı, Bitti, Geri Sayım, Kilitli) */}
            {status === 'live' ? (
              <View style={styles.matchCardLiveContainer}>
                <LinearGradient
                  colors={['#dc2626', '#b91c1c']}
                  style={styles.matchCardLiveBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.matchCardLiveDot} />
                  <Text style={styles.matchCardLiveText}>OYNANIYOR</Text>
                </LinearGradient>
                
                {match.fixture.status?.elapsed && (
                  <View style={styles.matchCardLiveMinuteBadge}>
                    <Ionicons name="time" size={14} color={BRAND.primary} />
                    <Text style={styles.matchCardLiveMinuteText}>{match.fixture.status.elapsed}'</Text>
                  </View>
                )}
              </View>
            ) : status === 'finished' ? (
              <View style={styles.matchCardFinishedContainer}>
                <LinearGradient
                  colors={['#475569', '#334155']}
                  style={styles.matchCardFinishedBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.matchCardFinishedText}>MAÇ BİTTİ</Text>
                </LinearGradient>
                {/* ✅ İstatistik ve özet için bilgi notu */}
                <View style={styles.matchCardFinishedHint}>
                  <Ionicons name="stats-chart" size={12} color="#64748B" />
                  <Text style={styles.matchCardFinishedHintText}>
                    İstatistikler ve maç özeti için tıklayın
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#64748B" />
                </View>
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
                  timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                    <View style={styles.matchCardCountdownContainer}>
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
                    </View>
                  ) : null
                )
              ) : null
            )}
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

  const filteredUpcomingMatches = React.useMemo(() => {
    const filtered = filterMatchesByTeam(allUpcomingMatches, selectedTeamIds);
    
    // ✅ Duplicate fixture ID'leri kaldır
    const uniqueMatches = filtered.reduce((acc: any[], match) => {
      const fixtureId = match.fixture?.id;
      if (fixtureId && !acc.some(m => m.fixture?.id === fixtureId)) {
        acc.push(match);
      }
      return acc;
    }, []);
    
    // Tarih sırasına göre sırala (en yakın en üstte)
    // Aynı saatte başlayanlar için lig önceliğine göre sırala
    return uniqueMatches.sort((a, b) => {
      const timeDiff = a.fixture.timestamp - b.fixture.timestamp;
      if (timeDiff !== 0) return timeDiff;
      // Aynı zamanda başlıyorlarsa, lig önceliğine göre sırala
      return getLeaguePriority(a.league.name) - getLeaguePriority(b.league.name);
    });
  }, [allUpcomingMatches, selectedTeamIds, filterMatchesByTeam]);

  const upcomingMatchIds = React.useMemo(() => filteredUpcomingMatches.map(m => m.fixture.id), [filteredUpcomingMatches]);
  const { matchIdsWithPredictions, clearPredictionForMatch } = useMatchesWithPredictions(upcomingMatchIds);

  // ✅ Maç kartı yüksekliği (minHeight + marginBottom)
  const MATCH_CARD_HEIGHT = 175 + SPACING.md; // ~187px

  // ✅ İlk scroll pozisyonu: her zaman en üstten başla (yaklaşan maçlar görünsün)
  const initialScrollOffset = React.useMemo(() => {
    // Biten maçlar küçültülmüş olduğu için direkt 0'dan başla
    return 0;
  }, []);

  // ✅ Sayfa hazır olduğunda işaretle (kıpırdama önleme)
  React.useEffect(() => {
    if (!initialScrollDone) {
      // Kısa bir gecikme ile içeriğin hazır olmasını bekle
      const timer = setTimeout(() => {
        setInitialScrollDone(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialScrollDone]);

  // ✅ Scroll bırakıldığında en yakın maç kartına snap yap (sadece yaklaşan maçlar)
  const handleScrollEnd = React.useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // En yakın yaklaşan maç kartına snap yap
    const cardIndex = Math.round(scrollY / MATCH_CARD_HEIGHT);
    const snapPosition = Math.max(0, cardIndex * MATCH_CARD_HEIGHT);
    
    // Yumuşak animasyon ile scroll
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: snapPosition, animated: true });
    }, 10);
  }, [MATCH_CARD_HEIGHT]);

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
        contentOffset={{ x: 0, y: initialScrollOffset }}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          // Momentum yoksa (yavaş bırakma) direkt snap yap
          const velocity = e.nativeEvent.velocity?.y || 0;
          if (Math.abs(velocity) < 0.5) {
            handleScrollEnd(e);
          }
        }}
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

        {/* Ana sayfa: planlanan maçlar (başlık yok) */}
        {!showLoadingIndicator && filteredUpcomingMatches.length > 0 && (
          <View style={styles.matchesListContainer}>
            {filteredUpcomingMatches.map((match, index) => (
              <Animated.View 
                key={`upcoming-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                style={styles.matchCardWrapper}
              >
                {/* ✅ Yaklaşan maçlarda Analiz Odağı Modal'ı aç */}
                {renderMatchCard(match, 'upcoming', () => handleMatchPress(match), {
                  hasPrediction: matchIdsWithPredictions.has(match.fixture.id),
                  matchId: match.fixture.id,
                  onDeletePrediction: clearPredictionForMatch,
                })}
              </Animated.View>
            ))}
          </View>
        )}

        {/* Boş Durum - Yaklaşan maç yoksa (loading değilse göster) */}
        {!showLoadingIndicator && filteredUpcomingMatches.length === 0 && (
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
          message="Bu maça yaptığınız tahmini silmek istiyor musunuz?"
          buttons={[
            { text: 'Vazgeç', style: 'cancel', onPress: () => setDeletePredictionModal(null) },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: () => {
                deletePredictionModal.onDelete();
                setDeletePredictionModal(null);
              },
            },
          ]}
          onRequestClose={() => setDeletePredictionModal(null)}
        />
      )}
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
    paddingTop: Platform.OS === 'ios' ? 245 : 235, // ✅ ProfileCard + team filter altından başlaması için
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
    minHeight: 175,
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
    marginBottom: SPACING.md,
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
  // ✅ Biten Maçlar Header (Küçültülebilir) - Eski stiller
  pastMatchesHeader: {
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
    minHeight: 175,
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
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 1,
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
    backgroundColor: `rgba(16, 185, 129, 0.1)`, // COLORS.dark.success with opacity
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: `rgba(16, 185, 129, 0.2)`, // COLORS.dark.success with opacity
    marginBottom: SPACING.xs,
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
    marginBottom: 10,
    gap: 8,
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
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
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
    minHeight: 28, // Ensure readable touch target
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
  matchCardLiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    marginTop: 2,
  },
  matchCardLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.dark.error,
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
    marginBottom: 0,
    marginTop: 2,
  },
  matchCardDaysRemainingContainer: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 2,
  },
  matchCardDaysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    minHeight: 32,
    borderRadius: 10,
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
    marginBottom: 0,
    marginTop: 2,
  },
  matchCardLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
    borderRadius: 10,
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
    gap: 5,
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
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchCardCountdownNumber: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND.white,
    marginBottom: 1,
  },
  matchCardCountdownUnit: {
    ...TYPOGRAPHY.caption,
    fontSize: 7,
    color: COLORS.dark.warning,
    fontWeight: '500',
  },
  matchCardCountdownSeparator: {
    ...TYPOGRAPHY.bodySmallSemibold,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark.warning,
    marginHorizontal: 1,
  },
  matchCardFinishedContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  matchCardFinishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: 10,
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
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 8,
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
  matchCardScoreBox: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 45,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND.white,
    // Sistem renkleri - mavi text shadow kaldırıldı
  },
  matchCardScoreBoxLive: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 45,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND.white,
    // Sistem renkleri - mavi text shadow kaldırıldı
  },
});
