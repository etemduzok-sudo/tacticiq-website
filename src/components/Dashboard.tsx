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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInLeft,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '../services/api';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { COLORS, SPACING, TYPOGRAPHY, SIZES, SHADOWS } from '../theme/theme';

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
  };
}

// Strategic Focus Options
const strategicFocusOptions = [
  {
    id: 'tempo',
    name: 'Tempo Analizi',
    icon: 'flash',
    iconOutline: 'flash-outline',
    multiplier: 1.25,
    color: COLORS.dark.chart3,
    affects: ['Gol Dakikası', 'Oyun Temposu'],
    description: 'Maçın hızına odaklan',
  },
  {
    id: 'discipline',
    name: 'Disiplin Analizi',
    icon: 'warning',
    iconOutline: 'warning-outline',
    multiplier: 1.25,
    color: BRAND.gold,
    affects: ['Kart', 'Faul'],
    description: 'Sert geçişleri öngör',
  },
  {
    id: 'fitness',
    name: 'Kondisyon Analizi',
    icon: 'fitness',
    iconOutline: 'fitness-outline',
    multiplier: 1.25,
    color: COLORS.dark.primaryLight,
    affects: ['Sakatlık', 'Değişiklik'],
    description: 'Fiziksel durumu değerlendir',
  },
  {
    id: 'star',
    name: 'Yıldız Analizi',
    icon: 'star',
    iconOutline: 'star-outline',
    multiplier: 1.25,
    color: COLORS.dark.chart1,
    affects: ['Maçın Adamı', 'Gol'],
    description: 'Yıldız oyuncuları takip et',
  },
];

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData }: DashboardProps) {
  const [selectedFocus, setSelectedFocus] = React.useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null); // Seçilen maç
  const [isPremium, setIsPremium] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null); // Seçilen favori takım
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  
  const scrollViewRef = useRef<ScrollView>(null);
  const focusSectionRef = useRef<View>(null);
  const continueButtonRef = useRef<View>(null);
  const [focusSectionY, setFocusSectionY] = useState(0);
  const [continueButtonY, setContinueButtonY] = useState(0);
  const dropdownRef = useRef<View>(null);
  
  // ✅ Load favorite teams
  const { favoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  
  // ✅ Geri sayım için interval (her saniye güncelle)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCountdownTicker(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Takım ismine göre forma renkleri
  const getTeamColors = (teamName: string): string[] => {
    const name = teamName.toLowerCase();
    const teamColors: Record<string, string[]> = {
      'galatasaray': ['#FFA500', '#FF0000'], // Sarı-Kırmızı
      'fenerbahçe': ['#FFFF00', '#000080'], // Sarı-Lacivert
      'fenerbahce': ['#FFFF00', '#000080'],
      'beşiktaş': ['#000000', '#FFFFFF'], // Siyah-Beyaz
      'besiktas': ['#000000', '#FFFFFF'],
      'trabzonspor': ['#800020', '#0000FF'], // Bordo-Mavi
      'real madrid': ['#FFFFFF', '#FFD700'], // Beyaz-Altın
      'barcelona': ['#A50044', '#004D98'], // Kırmızı-Mavi
      'paris saint germain': ['#004170', '#ED1C24'], // Mavi-Kırmızı
      'psg': ['#004170', '#ED1C24'],
      'türkiye': ['#E30A17', '#FFFFFF'], // Kırmızı-Beyaz
      'turkey': ['#E30A17', '#FFFFFF'],
      'almanya': ['#000000', '#DD0000', '#FFCE00'], // Siyah-Kırmızı-Altın
      'germany': ['#000000', '#DD0000', '#FFCE00'],
      'brezilya': ['#009C3B', '#FFDF00'], // Yeşil-Sarı
      'brazil': ['#009C3B', '#FFDF00'],
      'arjantin': ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
      'argentina': ['#74ACDF', '#FFFFFF'],
    };
    
    for (const [key, colors] of Object.entries(teamColors)) {
      if (name.includes(key)) return colors;
    }
    
    // Varsayılan renkler
    return ['#1E40AF', '#FFFFFF'];
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
  
  // ✅ Teknik direktör ismini al
  const getCoachName = (teamName: string): string => {
    const name = teamName.toLowerCase();
    const coaches: Record<string, string> = {
      'galatasaray': 'Okan Buruk',
      'fenerbahçe': 'İsmail Kartal',
      'fenerbahce': 'İsmail Kartal',
      'beşiktaş': 'Fernando Santos',
      'besiktas': 'Fernando Santos',
      'trabzonspor': 'Abdullah Avcı',
      'real madrid': 'Carlo Ancelotti',
      'barcelona': 'Xavi Hernández',
      'türkiye': 'Vincenzo Montella',
      'turkey': 'Vincenzo Montella',
      'almanya': 'Julian Nagelsmann',
      'germany': 'Julian Nagelsmann',
      'brezilya': 'Dorival Júnior',
      'brazil': 'Dorival Júnior',
      'arjantin': 'Lionel Scaloni',
      'argentina': 'Lionel Scaloni',
      'paris saint germain': 'Luis Enrique',
      'psg': 'Luis Enrique',
      'fethiyespor': 'Mustafa Akçay',
    };
    for (const [key, coach] of Object.entries(coaches)) {
      if (name.includes(key)) return coach;
    }
    return 'Bilinmiyor';
  };
  
  // ✅ Maç kartı bileşeni
  const renderMatchCard = (match: any, status: 'upcoming' | 'live' | 'finished', onPress?: () => void) => {
    const homeColors = getTeamColors(match.teams.home.name);
    const awayColors = getTeamColors(match.teams.away.name);
    const refereeInfo = getRefereeInfo(match);
    
    // Geri sayım hesaplama (countdownTicker ile her saniye güncellenir)
    const _ = countdownTicker; // Re-render için kullan
    
    const now = Date.now() / 1000;
    const matchTime = match.fixture.timestamp;
    const timeDiff = matchTime - now;
    const hours24 = 24 * 60 * 60;
    const dayInSeconds = 24 * 60 * 60;
    
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    let daysRemaining = 0;
    
    if (status === 'upcoming' && timeDiff > 0) {
      if (timeDiff > hours24) {
        // 24 saatten uzun süre varsa gün sayısını hesapla
        daysRemaining = Math.floor(timeDiff / dayInSeconds);
      } else {
        // 24 saatten az kaldıysa geri sayım göster
        timeLeft = {
          hours: Math.floor(timeDiff / 3600),
          minutes: Math.floor((timeDiff % 3600) / 60),
          seconds: Math.floor(timeDiff % 60),
        };
      }
    }
    
    // Pulse animasyonu için (sadece live durumunda)
    const [pulseAnim] = React.useState(() => new RNAnimated.Value(1));
    
    React.useEffect(() => {
      if (status === 'live') {
        const animation = RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(pulseAnim, {
              toValue: 0.3,
              duration: 750,
              useNativeDriver: true,
            }),
            RNAnimated.timing(pulseAnim, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ])
        );
        animation.start();
        return () => animation.stop();
      } else {
        pulseAnim.setValue(1);
      }
    }, [status]);
    
    return (
      <TouchableOpacity
        style={styles.matchCardContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.dark.background, COLORS.dark.card, COLORS.dark.background]}
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
              {/* Turnuva Badge - En Üstte Ortada */}
            <View style={styles.matchCardTournamentBadge}>
              <Ionicons name="trophy" size={9} color={COLORS.dark.primaryLight} />
              <Text style={styles.matchCardTournamentText}>{match.league.name}</Text>
            </View>
            
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
                <Text style={styles.matchCardTeamName} numberOfLines={1}>{match.teams.home.name}</Text>
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
                    colors={['#10b981', '#059669']}
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
                <Text style={[styles.matchCardTeamName, styles.matchCardTeamNameRight]} numberOfLines={1}>{match.teams.away.name}</Text>
                <Text style={styles.matchCardCoachNameAway}>{getCoachName(match.teams.away.name)}</Text>
                {(status === 'live' || status === 'finished') && (
                  <View style={status === 'live' ? styles.matchCardScoreBoxLive : styles.matchCardScoreBox}>
                    <Text style={status === 'live' ? styles.matchCardScoreTextLive : styles.matchCardScoreText}>{match.goals?.away ?? 0}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Durum Badge'i (Canlı, Bitti, Geri Sayım) */}
            {status === 'live' ? (
              <View style={styles.matchCardLiveContainer}>
                <LinearGradient
                  colors={['#dc2626', '#b91c1c']}
                  style={styles.matchCardLiveBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <RNAnimated.View style={[styles.matchCardLiveDot, { opacity: pulseAnim }]} />
                  <Text style={styles.matchCardLiveText}>ŞUAN OYNANIYOR</Text>
                </LinearGradient>
                
                {match.fixture.status?.elapsed && (
                  <View style={styles.matchCardLiveMinuteBadge}>
                    <Ionicons name="time" size={14} color="#10b981" />
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
              </View>
            ) : (
              status === 'upcoming' && timeDiff > 0 ? (
                daysRemaining > 0 ? (
                  // 24 saatten uzun süre varsa gün sayısını göster
                  <View style={styles.matchCardDaysRemainingContainer}>
                    <LinearGradient
                      colors={['#f97316', '#ea580c']}
                      style={styles.matchCardDaysRemainingBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.matchCardDaysRemainingText}>
                        MAÇA {daysRemaining} {daysRemaining === 1 ? 'GÜN' : 'GÜN'} KALDI
                      </Text>
                    </LinearGradient>
                  </View>
                ) : (
                  // 24 saatten az kaldıysa geri sayım sayacını göster
                  timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0 ? (
                    <View style={styles.matchCardCountdownContainer}>
                      <View style={styles.matchCardCountdownCard}>
                        <View style={styles.matchCardCountdownRow}>
                          <LinearGradient
                            colors={['#f97316', '#ea580c']}
                            style={styles.matchCardCountdownBox}
                          >
                            <Text style={styles.matchCardCountdownNumber}>
                              {String(timeLeft.hours).padStart(2, '0')}
                            </Text>
                            <Text style={styles.matchCardCountdownUnit}>Saat</Text>
                          </LinearGradient>
                          
                          <Text style={styles.matchCardCountdownSeparator}>:</Text>
                          
                          <LinearGradient
                            colors={['#f97316', '#ea580c']}
                            style={styles.matchCardCountdownBox}
                          >
                            <Text style={styles.matchCardCountdownNumber}>
                              {String(timeLeft.minutes).padStart(2, '0')}
                            </Text>
                            <Text style={styles.matchCardCountdownUnit}>Dakika</Text>
                          </LinearGradient>
                          
                          <Text style={styles.matchCardCountdownSeparator}>:</Text>
                          
                          <LinearGradient
                            colors={['#f97316', '#ea580c']}
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
  
  // ✅ Check if user is premium
  React.useEffect(() => {
    const checkPremium = async () => {
      try {
        const userData = await AsyncStorage.getItem('fan-manager-user');
        if (userData) {
          const parsed = JSON.parse(userData);
          // ✅ Pro kontrolü: is_pro, isPro, isPremium, plan === 'pro' veya plan === 'premium'
          const isPremium = parsed.is_pro === true || parsed.isPro === true || parsed.isPremium === true || parsed.plan === 'pro' || parsed.plan === 'premium';
          setIsPremium(isPremium);
          logger.debug('User Pro status', { isPremium, is_pro: parsed.is_pro, isPro: parsed.isPro, isPremium: parsed.isPremium, plan: parsed.plan }, 'DASHBOARD');
        }
      } catch (error) {
        logger.error('Error checking premium status', { error }, 'DASHBOARD');
      }
    };
    checkPremium();
  }, []);

  // Maç seçildiğinde scroll animasyonu
  const handleMatchSelect = (matchId: string | number) => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const matchIdStr = String(matchId);
    
    // Eğer aynı maç tekrar seçilirse, seçimi kaldır
    if (String(selectedMatchId) === matchIdStr) {
      setSelectedMatchId(null);
      setSelectedFocus(null);
      return;
    }

    setSelectedMatchId(matchIdStr);
    setSelectedFocus(null); // Odak seçimini sıfırla

    // ✅ Maç seçildikten sonra analiz odağı bölümüne scroll yap
    // Biraz bekle ki React render etsin, sonra scroll yap
    setTimeout(() => {
      if (focusSectionY > 0) {
        scrollViewRef.current?.scrollTo({
          y: focusSectionY - 20, // Biraz üstten başlasın
          animated: true,
        });
      } else {
        // Eğer focusSectionY henüz hesaplanmadıysa, biraz daha bekle
        setTimeout(() => {
          if (focusSectionY > 0) {
            scrollViewRef.current?.scrollTo({
              y: focusSectionY - 20,
              animated: true,
            });
          }
        }, 200);
      }
    }, 300);
  };

  // Handle focus selection with haptic feedback
  const handleFocusSelect = (focusId: string) => {
    // Haptic feedback (only on mobile)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Eğer aynı focus tekrar seçilirse, seçimi kaldır
    if (selectedFocus === focusId) {
      setSelectedFocus(null);
      return;
    }
    
    setSelectedFocus(focusId);

    // Eğer bir maç seçilmişse, "Devam Et" butonuna scroll yap
    if (selectedMatchId) {
      setTimeout(() => {
        // Önce continueButtonY'yi kontrol et
        if (continueButtonY > 0) {
          scrollViewRef.current?.scrollTo({
            y: continueButtonY - 150, // Butonun üstüne biraz boşluk bırak
            animated: true,
          });
        } else if (focusSectionY > 0) {
          // Eğer continueButtonY henüz hesaplanmadıysa, focusSectionY'ye ek bir offset ekle
          // Focus kartları yaklaşık 200px yüksekliğinde, buton da ~80px, toplam ~280px
          scrollViewRef.current?.scrollTo({
            y: focusSectionY + 350, // Focus kartlarının altına, butonun görüneceği yere scroll
            animated: true,
          });
        }
      }, 300); // Biraz daha uzun bekle ki layout hesaplansın
    }
  };

  // Devam Et butonu - Direkt match-detail'e geç, scroll yapma
  const handleContinueToMatch = () => {
    if (selectedMatchId) {
      // ✅ Direkt match-detail ekranına geç, scroll yapma
      onNavigate('match-detail', {
        id: selectedMatchId,
        focus: selectedFocus,
        initialTab: 'squad', // İlk sekme olarak Kadro'yu aç
      });
      
      // Reset (ama navigation sonrası, state temizlenmesin diye)
      // setSelectedMatchId(null);
      // setSelectedFocus(null);
    }
  };

  // Get analyst advice based on selected focus and match data
  const getAnalystAdvice = (match: any) => {
    if (!selectedFocus) return null;

    const adviceMap: Record<string, { icon: string; text: string; color: string }> = {
      tempo: {
        icon: '⚡',
        text: 'Hızlı tempolu maç bekleniyor!',
        color: COLORS.dark.chart3,
      },
      discipline: {
        icon: '🛡️',
        text: 'Bu hakem kart sever, odağın isabetli!',
        color: BRAND.gold,
      },
      fitness: {
        icon: '💪',
        text: 'Uzun sezonda kondisyon kritik!',
        color: COLORS.dark.primaryLight,
      },
      star: {
        icon: '⭐',
        text: 'Yıldız oyuncular sahada olacak!',
        color: COLORS.dark.chart1,
      },
    };

    return adviceMap[selectedFocus] || null;
  };
  
  const { 
    pastMatches, 
    liveMatches, 
    upcomingMatches, 
    loading, 
    error,
    hasLoadedOnce
  } = matchData;

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

  // Show loading ONLY on first load
  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Kontrol paneli yükleniyor...</Text>
      </View>
    );
  }

  // Get all upcoming matches (not just 24 hours)
  const now = Date.now() / 1000;
  const allUpcomingMatches = upcomingMatches.filter(match => {
    const matchTime = match.fixture.timestamp;
    return matchTime >= now;
  });

  // ✅ Filter matches by selected team (ID and name matching)
  const filterMatchesByTeam = React.useCallback((matches: any[], teamId: number | null) => {
    if (!teamId) return matches;
    
    const selectedTeam = favoriteTeams.find(t => t.id === teamId);
    if (!selectedTeam) {
      logger.warn(`Team not found: ${teamId}`, { teamId }, 'DASHBOARD');
      return matches;
    }

    const filtered = matches.filter(match => {
      if (!match?.teams?.home || !match?.teams?.away) return false;
      
      const homeId = match.teams.home.id;
      const awayId = match.teams.away.id;
      const homeName = (match.teams.home.name || '').toLowerCase();
      const awayName = (match.teams.away.name || '').toLowerCase();
      const teamName = selectedTeam.name.toLowerCase();
      
      // ID eşleşmesi (öncelikli)
      const idMatch = String(homeId) === String(teamId) || String(awayId) === String(teamId);
      if (idMatch) {
        return true;
      }
      
      // İsim eşleşmesi (fallback - API'de ID farklı olabilir)
      const nameMatch = homeName.includes(teamName) || teamName.includes(homeName) ||
                       awayName.includes(teamName) || teamName.includes(awayName);
      
      return nameMatch;
    });

    logger.debug(`Filtering matches for team: ${selectedTeam.name}`, {
      teamId,
      teamName: selectedTeam.name,
      totalMatches: matches.length,
      filteredCount: filtered.length,
      firstMatch: filtered.length > 0 ? {
        home: filtered[0].teams.home.name,
        homeId: filtered[0].teams.home.id,
        away: filtered[0].teams.away.name,
        awayId: filtered[0].teams.away.id,
      } : null,
    }, 'DASHBOARD');

    return filtered;
  }, [favoriteTeams]);

  const filteredUpcomingMatches = React.useMemo(() => {
    return filterMatchesByTeam(allUpcomingMatches, selectedTeamId);
  }, [allUpcomingMatches, selectedTeamId, filterMatchesByTeam]);

  const filteredPastMatches = React.useMemo(() => {
    return filterMatchesByTeam(pastMatches, selectedTeamId);
  }, [pastMatches, selectedTeamId, filterMatchesByTeam]);

  const selectedTeamName = React.useMemo(() => {
    if (!selectedTeamId) return null;
    const team = favoriteTeams.find(t => t.id === selectedTeamId);
    return team?.name || null;
  }, [selectedTeamId, favoriteTeams]);

  // Handle team selection
  const handleTeamSelect = (teamId: number | null) => {
    if (teamId) {
      const team = favoriteTeams.find(t => t.id === teamId);
      logger.debug(`Team selected: ${team?.name}`, { teamId, teamName: team?.name }, 'DASHBOARD');
    } else {
      logger.debug('Filter cleared - showing all matches', undefined, 'DASHBOARD');
    }
    
    setSelectedTeamId(teamId);
    setDropdownOpen(false);
    setSelectedMatchId(null);
    setSelectedFocus(null);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };


  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 0. FAVORİ TAKIM FİLTRESİ (Pro kullanıcı için) - Tek satır dropdown */}
        {!selectedMatchId && isPremium && favoriteTeams.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.sectionWithDropdown}>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setDropdownOpen(!dropdownOpen)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownButtonContent}>
                  <Ionicons name="trophy" size={18} color="#F59E0B" />
                  <Text style={styles.dropdownButtonText}>
                    {selectedTeamName ? `${selectedTeamName} Maçları` : 'Favori Takımlarım'}
                  </Text>
                  {selectedTeamId && (
                    <TouchableOpacity
                      style={styles.clearFilterButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTeamSelect(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={18} color="#64748B" />
                    </TouchableOpacity>
                  )}
                  </View>
                <Ionicons 
                  name={dropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#94A3B8" 
                />
              </TouchableOpacity>
              
              {dropdownOpen && (
                <View style={styles.dropdownMenu} ref={dropdownRef}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, !selectedTeamId && styles.dropdownItemActive]}
                      onPress={() => handleTeamSelect(null)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="list" size={18} color={!selectedTeamId ? "#059669" : "#94A3B8"} />
                      <Text style={[styles.dropdownItemText, !selectedTeamId && styles.dropdownItemTextActive]}>
                        Tümü
                      </Text>
                      {!selectedTeamId && <Ionicons name="checkmark" size={18} color="#059669" />}
                    </TouchableOpacity>
                    
                    {favoriteTeams.map((team) => {
                      const isSelected = selectedTeamId === team.id;
                      return (
                  <TouchableOpacity
                          key={team.id}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => handleTeamSelect(team.id)}
                          activeOpacity={0.7}
                        >
                          {team.colors && team.colors.length > 0 ? (
                            <View style={styles.dropdownTeamBadge}>
                              <View style={[styles.dropdownTeamStripe, { backgroundColor: team.colors[0] }]} />
                              {team.colors[1] && (
                                <View style={[styles.dropdownTeamStripe, { backgroundColor: team.colors[1] }]} />
                              )}
                      </View>
                          ) : (
                            <View style={styles.dropdownTeamPlaceholder}>
                              <Text style={styles.dropdownTeamEmoji}>⚽</Text>
                    </View>
                          )}
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]} numberOfLines={1}>
                            {team.name}
                          </Text>
                          {isSelected && <Ionicons name="checkmark" size={18} color="#059669" />}
                  </TouchableOpacity>
                      );
                    })}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* 1. YAKLAŞAN MAÇLAR - Her zaman göster */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>
              {selectedTeamName ? `${selectedTeamName} Maçları` : 'Yaklaşan Maçlar'} ({filteredUpcomingMatches.length})
            </Text>
          </View>

          {filteredUpcomingMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingMatchesScroll}
              pagingEnabled={true}
              decelerationRate="fast"
              snapToAlignment="start"
            >
              {filteredUpcomingMatches.slice(0, 10).map((match, index) => (
              <Animated.View key={match.fixture.id} entering={FadeInDown.delay(200 + index * 100).springify()}>
                  {renderMatchCard(match, 'upcoming', () => handleMatchSelect(String(match.fixture.id)))}
              </Animated.View>
            ))}
          </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
            </View>
          )}
        </Animated.View>

        {/* ✅ ANALİZ ODAĞI BÖLÜMÜ - Her zaman görünür */}
          <View 
            ref={focusSectionRef}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              // ScrollView içindeki pozisyonu hesapla
              if (layout.y > 0) {
                setFocusSectionY(layout.y);
              }
            }}
            style={styles.focusSectionContainer}
          >
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            {/* Seçilen Maç Bilgisi - Sadece maç seçildiyse göster */}
            {selectedMatchId && (
              <View style={styles.selectedMatchInfo}>
                <Text style={styles.selectedMatchTitle}>Seçilen Maç:</Text>
                <Text style={styles.selectedMatchTeams}>
                  {allUpcomingMatches.find(m => String(m.fixture.id) === String(selectedMatchId))?.teams.home.name} 
                  {' vs '}
                  {allUpcomingMatches.find(m => String(m.fixture.id) === String(selectedMatchId))?.teams.away.name}
                </Text>
              </View>
            )}

              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Analiz Odağı Seç</Text>
              </View>
            <Text style={styles.sectionSubtitle}>Seçtiğin odak x1.25 puan çarpanı kazandırır</Text>

              <View style={styles.focusGrid}>
                {strategicFocusOptions.map((focus, index) => {
                  // Her kartın genişliğini hesapla: (ekran genişliği - section padding - gap) / 2
                  const sectionPadding = 32; // 16 * 2 (left + right)
                  const gap = 12;
                  const cardWidth = (width - sectionPadding - gap) / 2;
                  return (
                    <Animated.View 
                      key={focus.id} 
                      entering={FadeInLeft.delay(200 + index * 50).springify()}
                      style={{ width: cardWidth }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.focusCard,
                          selectedFocus === focus.id && styles.focusCardSelected,
                          selectedFocus && selectedFocus !== focus.id && styles.focusCardUnselected,
                          { 
                            width: '100%',
                            borderColor: selectedFocus === focus.id ? focus.color : '#334155',
                            transform: [{ scale: selectedFocus === focus.id ? 1.05 : selectedFocus ? 0.95 : 1 }],
                          },
                        ]}
                        onPress={() => handleFocusSelect(focus.id)}
                        activeOpacity={0.8}
                      >
                      {/* Icon Container */}
                      <View style={[styles.focusIconContainer, { backgroundColor: `${focus.color}15` }]}>
                        <Ionicons
                          name={selectedFocus === focus.id ? focus.icon : focus.iconOutline} 
                          size={32} 
                          color={focus.color} 
                        />
                      </View>

                      {/* Content */}
                      <View style={styles.focusContent}>
                        <Text style={styles.focusName}>{focus.name}</Text>
                        <Text style={styles.focusMultiplier}>x{focus.multiplier}</Text>
                        <Text style={styles.focusDescription} numberOfLines={2}>{focus.description}</Text>
                        
                        {/* Affects Tags */}
                        <View style={styles.focusAffects}>
                          {focus.affects && focus.affects.slice(0, 2).map((affect, i) => (
                            <View key={i} style={[styles.focusAffectTag, { backgroundColor: `${focus.color}20` }]}>
                              <Text style={[styles.focusAffectText, { color: focus.color }]} numberOfLines={1}>{affect}</Text>
                          </View>
                          ))}
                        </View>
                      </View>

                      {/* Selected Badge */}
                      {selectedFocus === focus.id && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color={focus.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                  );
                })}
              </View>

              {/* DEVAM ET Butonu - Sadece maç seçildiğinde görünür */}
              {selectedMatchId && (
                <Animated.View 
                  ref={continueButtonRef}
                  entering={FadeInDown.delay(400).springify()} 
                  style={styles.continueButtonContainer}
                  onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    // Absolute pozisyonu hesapla: focusSectionY (parent) + layout.y (relative)
                    const absoluteY = focusSectionY > 0 ? focusSectionY + layout.y : layout.y;
                    setContinueButtonY(absoluteY);
                  }}
                >
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinueToMatch}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#059669', '#047857']}
                      style={styles.continueButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.continueButtonText}>
                        {selectedFocus ? `Devam Et (${strategicFocusOptions.find(f => f.id === selectedFocus)?.name} ✓)` : 'Devam Et'}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          </View>

        {/* 3. KAZANILAN ROZETLER - Sadece maç seçilmediğinde göster */}
        {!selectedMatchId && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Kazanılan Rozetler</Text>
            </View>

            {/* View All Badges Button */}
            <Animated.View entering={FadeInLeft.delay(600).springify()}>
              <TouchableOpacity
                style={styles.viewAllBadgesButton}
                onPress={() => onNavigate('profile', { showBadges: true })}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.viewAllBadgesText}>Tüm Rozetlerimi Gör</Text>
                <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}

        {/* 3. GEÇMİŞ MAÇLAR - Sadece maç seçilmediğinde göster */}
        {!selectedMatchId && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>
              {selectedTeamName ? `${selectedTeamName} Maçları` : 'Geçmiş Maçlar'} ({filteredPastMatches.length})
                      </Text>
                    </View>
                    
          {filteredPastMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingMatchesScroll}
            >
              {filteredPastMatches.slice(0, 10).map((match, index) => (
                <Animated.View key={match.fixture.id} entering={FadeInLeft.delay(350 + index * 50).springify()}>
                  {renderMatchCard(match, 'finished', () => onNavigate('match-result-summary', { id: match.fixture.id }))}
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyHistoryState}>
              <Ionicons name="time-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>Henüz geçmiş maç yok</Text>
            </View>
          )}
        </Animated.View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.base,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 130, // ✅ Profil kartının altından başlaması için (iOS: 44 top + 8 paddingTop + ~70 içerik + 8 paddingBottom = 130px)
    paddingBottom: 100,
  },

  // Section
  section: {
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.base,
  },
  sectionWithDropdown: {
    marginBottom: SPACING.base,
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.xl,
    zIndex: 10000,
    elevation: 10000,
    position: 'relative',
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
    paddingRight: 16,
    gap: 0,
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
    overflow: 'hidden',
    ...SHADOWS.sm,
      },
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
    shadowColor: BRAND.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
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
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: COLORS.dark.warning,
    borderWidth: 2,
    shadowColor: COLORS.dark.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
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
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
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
    backgroundColor: `rgba(5, 150, 105, 0.1)`, // COLORS.dark.primary with opacity
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
  
  // ✅ Yeni Maç Kartı Stilleri (Verilen koddan)
  matchCardContainer: {
    width: width,
    maxWidth: 768,
    marginRight: 0,
    minHeight: 175,
    paddingHorizontal: SPACING.base,
  },
  matchCard: {
    width: '100%',
    minHeight: 175,
    borderRadius: SIZES.radiusXl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.dark.border + '80', // 50% opacity
    ...SHADOWS.md,
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
        shadowColor: '#10b981',
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
    ...Platform.select({
      web: {
        textShadow: '1px 1px 0px #00ffff, -1px -1px 0px #ff6b35',
      },
      default: {
        textShadowColor: '#00ffff',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
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
    ...Platform.select({
      web: {
        textShadow: '1px 1px 0px #00ffff, -1px -1px 0px #ff6b35',
      },
      default: {
        textShadowColor: '#00ffff',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});
