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
import { COLORS, SPACING, TYPOGRAPHY, SIZES, SHADOWS, BRAND } from '../theme/theme';
import { WEBSITE_DARK_COLORS } from '../config/WebsiteDesignSystem';
import { cardStyles, textStyles, containerStyles } from '../utils/styleHelpers';

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
  selectedTeamIds?: number[]; // ✅ App.tsx'ten gelen seçili takımlar
}

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData, selectedTeamIds = [] }: DashboardProps) {
  const [isPremium, setIsPremium] = useState(false);
  // ✅ selectedTeamIds artık App.tsx'ten prop olarak geliyor
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countdownTicker, setCountdownTicker] = useState(0); // ✅ Geri sayım için ticker
  
  const scrollViewRef = useRef<ScrollView>(null);
  const dropdownRef = useRef<View>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  
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
    const days7 = 7 * dayInSeconds; // 7 gün
    
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    let daysRemaining = 0;
    let isLocked = false; // 7 günden uzak maçlar kilitli
    let countdownColor = '#10b981'; // Varsayılan yeşil
    
    if (status === 'upcoming' && timeDiff > 0) {
      // 7 günden fazla ise kilitli
      if (timeDiff > days7) {
        isLocked = true;
        daysRemaining = Math.floor(timeDiff / dayInSeconds);
      } else if (timeDiff > hours24) {
        // 24 saatten uzun ama 7 günden az - gün sayısını göster
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
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1A3A34', '#162E29', '#122520']} // Koyu yeşil gradient - zemin ile uyumlu
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
                <Text style={[styles.matchCardTeamName, styles.matchCardTeamNameRight]} numberOfLines={1}>{match.teams.away.name}</Text>
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
                  <Text style={styles.matchCardLiveText}>ŞUAN OYNANIYOR</Text>
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
              </View>
            ) : (
              status === 'upcoming' && timeDiff > 0 ? (
                isLocked ? (
                  // 7 günden fazla - KİLİTLİ
                  <View style={styles.matchCardLockedContainer}>
                    <View style={styles.matchCardLockedBadge}>
                      <Ionicons name="lock-closed" size={14} color="#64748B" />
                      <Text style={styles.matchCardLockedText}>
                        {daysRemaining} GÜN SONRA • TAHMİNE KAPALI
                      </Text>
                    </View>
                  </View>
                ) : daysRemaining > 0 ? (
                  // 24 saatten uzun ama 7 günden az - gün sayısını göster
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

  
  // ✅ Safe destructure with defaults
  const { 
    pastMatches = [], 
    liveMatches = [], 
    upcomingMatches = [], 
    loading = false, 
    error = null,
    hasLoadedOnce = false
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
    // Eğer favori takım yoksa, tüm maçları göster
    if (favoriteTeams.length === 0) {
      return matches;
    }
    
    // Eğer hiç takım seçilmemişse (boş array), TÜM favori takımların maçlarını göster
    // Eğer takımlar seçilmişse, sadece seçili takımların maçlarını göster
    const teamsToFilter = teamIds.length === 0
      ? favoriteTeams
      : favoriteTeams.filter(t => teamIds.includes(t.id));
    
    if (teamsToFilter.length === 0) {
      return matches;
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
    // Tarih sırasına göre sırala (en yakın en üstte, en uzak en altta)
    return [...filtered].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  }, [allUpcomingMatches, selectedTeamIds, filterMatchesByTeam]);

  const filteredPastMatches = React.useMemo(() => {
    const filtered = filterMatchesByTeam(pastMatches, selectedTeamIds);
    // Geçmiş maçları tarih sırasına göre sırala (en eski en üstte, en yeni en altta)
    // Böylece scroll edilince en eski maçlar profil kartının arkasında kalır
    return [...filtered].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  }, [pastMatches, selectedTeamIds, filterMatchesByTeam]);

  // ✅ Canlı maçları da favori takımlara göre filtrele ve sırala
  const filteredLiveMatches = React.useMemo(() => {
    const filtered = filterMatchesByTeam(liveMatches, selectedTeamIds);
    // En erken başlayan maç en üstte (timestamp'e göre artan sıra)
    return [...filtered].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  }, [liveMatches, selectedTeamIds, filterMatchesByTeam]);

  // ✅ Sayfa açıldığında geçmiş maçları atlayıp gelecek maçlara scroll yap
  React.useEffect(() => {
    if (!initialScrollDone && filteredPastMatches.length > 0 && scrollViewRef.current) {
      // Her maç kartı yaklaşık 200px yüksekliğinde
      const pastMatchesHeight = filteredPastMatches.length * 200;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: pastMatchesHeight, animated: false });
        setInitialScrollDone(true);
      }, 100);
    } else if (!initialScrollDone && filteredPastMatches.length === 0) {
      setInitialScrollDone(true);
    }
  }, [filteredPastMatches.length, initialScrollDone]);

  // Show loading ONLY on first load (after all hooks are called)
  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>Kontrol paneli yükleniyor...</Text>
      </View>
    );
  }

  // ✅ handleTeamSelect artık App.tsx'te - ProfileCard üzerinden yönetiliyor


  return (
    <View style={styles.container}>
      {/* Grid Pattern Background - Splash screen ile uyumlu */}
      <View style={styles.gridPattern} />
      
      {/* ✅ Takım filtresi artık ProfileCard içinde - App.tsx'ten yönetiliyor */}

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* GEÇMİŞ MAÇLAR - En üstte (yukarı scroll yapınca görünür) */}
        {filteredPastMatches.length > 0 && (
          <View style={styles.matchesListContainer}>
            {filteredPastMatches.map((match, index) => (
              <Animated.View 
                key={`past-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(100 + index * 50).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'finished', () => onNavigate('match-result-summary', { id: match.fixture.id }))}
              </Animated.View>
            ))}
          </View>
        )}

        {/* ✅ CANLI MAÇLAR - Favori takımlardan */}
        {filteredLiveMatches.length > 0 && (
          <View style={styles.matchesListContainer}>
            <View style={styles.liveMatchesHeader}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveMatchesTitle}>Canlı Maçlar</Text>
              <Text style={styles.liveMatchesCount}>{filteredLiveMatches.length}</Text>
            </View>
            {filteredLiveMatches.map((match, index) => (
              <Animated.View 
                key={`live-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(50 + index * 30).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'live', () => onNavigate('match-detail', { id: match.fixture.id }))}
              </Animated.View>
            ))}
          </View>
        )}

        {/* GELECEK MAÇLAR - Tarih sırasına göre */}
        <View style={styles.matchesListContainer}>
          {filteredUpcomingMatches.length > 0 ? (
            filteredUpcomingMatches.map((match, index) => (
              <Animated.View 
                key={`upcoming-${match.fixture.id}`} 
                entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(200 + index * 50).springify()}
                style={styles.matchCardWrapper}
              >
                {renderMatchCard(match, 'upcoming', () => onNavigate('match-detail', { id: match.fixture.id }))}
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>Yaklaşan maç yok</Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 + SIZES.tabBarHeight }} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2A24', // Koyu yeşil taban - Splash screen ile uyumlu
    position: 'relative',
  },
  // Grid Pattern Background - Splash screen ile uyumlu (40px, flu)
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.08) 1px, transparent 1px)
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
    paddingTop: Platform.OS === 'ios' ? 220 : 210, // ✅ ProfileCard (filtre dahil) altından başlaması için
    paddingBottom: 100 + SIZES.tabBarHeight, // ✅ Footer navigation için extra padding
    backgroundColor: 'transparent', // Grid pattern görünsün
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
    width: '100%', // ✅ Dikey liste için tam genişlik
    maxWidth: 768,
    minHeight: 175,
  },
  matchCardWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  matchesListContainer: {
    width: '100%',
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
    ...(Platform.OS === 'web' && {
      animation: 'pulse 1.5s ease-in-out infinite',
    } as any),
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
