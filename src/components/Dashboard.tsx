// components/Dashboard.tsx - Analist Kontrol Paneli
import React, { useState, useRef } from 'react';
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
    color: '#3B82F6',
    affects: ['Gol Dakikası', 'Oyun Temposu'],
    description: 'Maçın hızına odaklan',
  },
  {
    id: 'discipline',
    name: 'Disiplin Analizi',
    icon: 'warning',
    iconOutline: 'warning-outline',
    multiplier: 1.25,
    color: '#F59E0B',
    affects: ['Kart', 'Faul'],
    description: 'Sert geçişleri öngör',
  },
  {
    id: 'fitness',
    name: 'Kondisyon Analizi',
    icon: 'fitness',
    iconOutline: 'fitness-outline',
    multiplier: 1.25,
    color: '#10B981',
    affects: ['Sakatlık', 'Değişiklik'],
    description: 'Fiziksel durumu değerlendir',
  },
  {
    id: 'star',
    name: 'Yıldız Analizi',
    icon: 'star',
    iconOutline: 'star-outline',
    multiplier: 1.25,
    color: '#8B5CF6',
    affects: ['Maçın Adamı', 'Gol'],
    description: 'Yıldız oyuncuları takip et',
  },
];

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData }: DashboardProps) {
  const [selectedFocus, setSelectedFocus] = React.useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null); // Seçilen maç
  const [isPremium, setIsPremium] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const focusSectionRef = useRef<View>(null);
  const continueButtonRef = useRef<View>(null);
  const [focusSectionY, setFocusSectionY] = useState(0);
  const [continueButtonY, setContinueButtonY] = useState(0);
  
  // ✅ Load favorite teams
  const { favoriteTeams, loading: teamsLoading } = useFavoriteTeams();
  
  // ✅ Check if user is premium
  React.useEffect(() => {
    const checkPremium = async () => {
      try {
        const userData = await AsyncStorage.getItem('fan-manager-user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setIsPremium(parsed.isPremium === true || parsed.isPro === true || parsed.plan === 'pro' || parsed.plan === 'premium');
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
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
        color: '#3B82F6',
      },
      discipline: {
        icon: '🛡️',
        text: 'Bu hakem kart sever, odağın isabetli!',
        color: '#F59E0B',
      },
      fitness: {
        icon: '💪',
        text: 'Uzun sezonda kondisyon kritik!',
        color: '#10B981',
      },
      star: {
        icon: '⭐',
        text: 'Yıldız oyuncular sahada olacak!',
        color: '#8B5CF6',
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
    console.log('📊 [Dashboard] Match Data:', {
      past: pastMatches.length,
      live: liveMatches.length,
      upcoming: upcomingMatches.length,
      loading,
      error,
    });
    if (pastMatches.length > 0) {
      console.log('📊 [Dashboard] First past match:', {
        teams: `${pastMatches[0].teams?.home?.name} vs ${pastMatches[0].teams?.away?.name}`,
        league: pastMatches[0].league?.name,
      });
    }
    if (upcomingMatches.length > 0) {
      console.log('📊 [Dashboard] First upcoming match:', {
        teams: `${upcomingMatches[0].teams?.home?.name} vs ${upcomingMatches[0].teams?.away?.name}`,
        league: upcomingMatches[0].league?.name,
        date: new Date(upcomingMatches[0].fixture.timestamp * 1000).toLocaleString('tr-TR'),
      });
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

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 0. SEÇİLİ TAKIMLAR (Pro kullanıcı için) - Sadece maç seçilmediğinde göster */}
        {!selectedMatchId && isPremium && favoriteTeams.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Favori Takımlarım ({favoriteTeams.length})</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.teamsScroll}
            >
              {favoriteTeams.map((team, index) => (
                <Animated.View key={team.id} entering={FadeInLeft.delay(100 + index * 50).springify()}>
                  <View style={styles.teamBadge}>
                    {team.logo ? (
                      <Image source={{ uri: team.logo }} style={styles.teamBadgeLogo} />
                    ) : (
                      <View style={styles.teamBadgePlaceholder}>
                        <Text style={styles.teamBadgeEmoji}>⚽</Text>
                      </View>
                    )}
                    <Text style={styles.teamBadgeName} numberOfLines={1}>{team.name}</Text>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* 1. CANLI MAÇLAR - Sadece maç seçilmediğinde göster */}
        {!selectedMatchId && liveMatches.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="radio" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Canlı Maçlar</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingMatchesScroll}
            >
              {liveMatches.slice(0, 10).map((match, index) => (
                <Animated.View key={match.fixture.id} entering={FadeInDown.delay(150 + index * 50).springify()}>
                  <TouchableOpacity
                    style={[styles.upcomingMatchCard, styles.liveMatchCard]}
                    onPress={() => onNavigate('match-detail', { id: match.fixture.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchHeader}>
                      <Text style={styles.matchLeague}>{match.league.name}</Text>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>CANLI</Text>
                      </View>
                    </View>
                    <View style={styles.matchTeams}>
                      <View style={styles.matchTeam}>
                        <Text style={styles.teamName}>{match.teams.home.name}</Text>
                        <Text style={styles.teamScore}>{match.goals.home ?? 0}</Text>
                      </View>
                      <Text style={styles.vsText}>VS</Text>
                      <View style={styles.matchTeam}>
                        <Text style={styles.teamName}>{match.teams.away.name}</Text>
                        <Text style={styles.teamScore}>{match.goals.away ?? 0}</Text>
                      </View>
                    </View>
                    {match.fixture.status.elapsed && (
                      <Text style={styles.elapsedTime}>{match.fixture.status.elapsed}'</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* 2. YAKLAŞAN MAÇLAR - Her zaman göster */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Yaklaşan Maçlar ({allUpcomingMatches.length})</Text>
          </View>

          {allUpcomingMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingMatchesScroll}
              pagingEnabled={false}
              snapToInterval={width - 32} // Her kart için snap
              decelerationRate="fast"
              snapToAlignment="start"
            >
              {allUpcomingMatches.slice(0, 10).map((match, index) => (
              <Animated.View key={match.fixture.id} entering={FadeInDown.delay(200 + index * 100).springify()}>
                <TouchableOpacity
                style={[
                  styles.upcomingMatchCard,
                  String(selectedMatchId) === String(match.fixture.id) && styles.selectedMatchCard,
                ]}
                onPress={() => handleMatchSelect(String(match.fixture.id))}
                  activeOpacity={0.8}
                >
                <View style={styles.matchHeader}>
                  <Text style={styles.matchLeague}>{match.league.name}</Text>
                  {/* ✅ Sağa kaydırma ipucu - Sadece birden fazla maç varsa göster */}
                  {allUpcomingMatches.length > 1 && (
                    <View style={styles.scrollHintIcon}>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </View>
                  )}
                </View>

                    <View style={styles.matchTeams}>
                      <View style={styles.matchTeam}>
                        {/* ✅ Sadece milli takımlar için bayrak göster */}
                        {(() => {
                          const isNationalTeam = (teamName: string) => {
                            const nationalTeams = ['Türkiye', 'Turkey', 'Almanya', 'Germany', 'Brezilya', 'Brazil', 'Arjantin', 'Argentina', 'Romania', 'Portugal', 'Spain', 'İspanya', 'France', 'Fransa', 'Italy', 'İtalya'];
                            return nationalTeams.some(nt => teamName.includes(nt));
                          };
                          
                          if (isNationalTeam(match.teams.home.name) && match.teams.home.logo) {
                            return <Image source={{ uri: match.teams.home.logo }} style={styles.teamLogoImage} />;
                          }
                          return null;
                        })()}
                        <Text style={styles.teamName} numberOfLines={2}>{match.teams.home.name}</Text>
                      </View>
                      <View style={styles.matchCenterInfo}>
                        <Text style={styles.vsText}>VS</Text>
                        {/* Stad */}
                        {(match.fixture as any).venue?.name && (
                          <View style={styles.matchInfoRow}>
                            <Ionicons name="location" size={12} color="#64748B" />
                            <Text style={styles.matchInfoText} numberOfLines={1}>
                              {(match.fixture as any).venue.name}
                            </Text>
                          </View>
                        )}
                        {/* Tarih */}
                        <Text style={styles.matchDateText}>
                          {new Date(match.fixture.date).toLocaleDateString('tr-TR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </Text>
                        {/* Saat */}
                        <Text style={styles.matchTimeText}>
                          {api.utils.formatMatchTime(match.fixture.timestamp)}
                        </Text>
                      </View>
                      <View style={styles.matchTeam}>
                        {/* ✅ Sadece milli takımlar için bayrak göster */}
                        {(() => {
                          const isNationalTeam = (teamName: string) => {
                            const nationalTeams = ['Türkiye', 'Turkey', 'Almanya', 'Germany', 'Brezilya', 'Brazil', 'Arjantin', 'Argentina', 'Romania', 'Portugal', 'Spain', 'İspanya', 'France', 'Fransa', 'Italy', 'İtalya'];
                            return nationalTeams.some(nt => teamName.includes(nt));
                          };
                          
                          if (isNationalTeam(match.teams.away.name) && match.teams.away.logo) {
                            return <Image source={{ uri: match.teams.away.logo }} style={styles.teamLogoImage} />;
                          }
                          return null;
                        })()}
                        <Text style={styles.teamName} numberOfLines={2}>{match.teams.away.name}</Text>
                      </View>
                    </View>
                </TouchableOpacity>
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

        {/* ✅ ANALİZ ODAĞI BÖLÜMÜ - Sadece maç seçildiğinde görünür */}
        {selectedMatchId && (
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
              {/* Seçilen Maç Bilgisi */}
              <View style={styles.selectedMatchInfo}>
                <Text style={styles.selectedMatchTitle}>Seçilen Maç:</Text>
                <Text style={styles.selectedMatchTeams}>
                  {allUpcomingMatches.find(m => String(m.fixture.id) === String(selectedMatchId))?.teams.home.name} 
                  {' vs '}
                  {allUpcomingMatches.find(m => String(m.fixture.id) === String(selectedMatchId))?.teams.away.name}
                </Text>
              </View>

              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Bu maç için analiz odağını seç</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Seçersen x1.25 puan çarpanı kazanırsın (opsiyonel)</Text>

              <View style={styles.focusGrid}>
                {strategicFocusOptions.map((focus, index) => {
                  // Her kartın genişliğini hesapla: (ekran genişliği - padding - gap) / 2
                  const cardWidth = (width - 32 - 12) / 2; // 32 = section padding (16*2), 12 = gap
                  return (
                    <Animated.View key={focus.id} entering={FadeInLeft.delay(200 + index * 50).springify()}>
                      <TouchableOpacity
                        style={[
                          styles.focusCard,
                          selectedFocus === focus.id && styles.focusCardSelected,
                          selectedFocus && selectedFocus !== focus.id && styles.focusCardUnselected,
                          { 
                            width: cardWidth,
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
                          {focus.affects.slice(0, 2).map((affect, i) => (
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

              {/* DEVAM ET Butonu (Sadece maç seçildiğinde görünür) */}
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
        )}

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
            <Text style={styles.sectionTitle}>Geçmiş Maçlar ({pastMatches.length})</Text>
          </View>

          {pastMatches.length > 0 ? (
            <View style={styles.matchHistoryVertical}>
              {pastMatches.slice(0, 5).map((match, index) => (
                <Animated.View key={match.fixture.id} entering={FadeInLeft.delay(350 + index * 50).springify()}>
                  <TouchableOpacity
                    style={styles.historyCardVertical}
                    onPress={() => onNavigate('match-result-summary', { id: match.fixture.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {new Date(match.fixture.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.historyScore}>
                        {match.goals.home ?? 0} - {match.goals.away ?? 0}
                      </Text>
                    </View>
                    
                    <Text style={styles.historyLeague}>{match.league.name}</Text>
                    
                    <Text style={styles.historyTeams} numberOfLines={2}>
                      {match.teams.home.name} vs {match.teams.away.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
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
    backgroundColor: '#0F172A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120, // Space for ProfileCard overlay
    paddingBottom: 100,
  },

  // Section
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
    marginTop: 20, // ProfileCard'ın altına boşluk bırak
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
    marginLeft: 8,
    flex: 1,
  },
  scrollHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    marginLeft: 28,
  },

  // Upcoming Matches Scroll (Horizontal)
  upcomingMatchesScroll: {
    paddingRight: 16,
    gap: 12,
  },
  
  // Live Match Card
  liveMatchCard: {
    width: 320, // Fixed width for horizontal scroll
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginRight: 8,
  },
  liveMinute: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
  },
  matchScore: {
    paddingHorizontal: 16,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  matchCenterInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 120,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  matchInfoText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    maxWidth: 100,
  },
  matchDateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  matchTimeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  teamScore: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFB',
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444420',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elapsedTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  historyLeague: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 8,
  },
  liveTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  liveTrackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Upcoming Match Card - Tam ekran genişliği
  upcomingMatchCard: {
    width: width - 32, // Ekran genişliği - sadece yan padding (16*2)
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  selectedMatchCard: {
    borderColor: '#F59E0B',
    borderWidth: 3,
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
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectedMatchTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedMatchTeams: {
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchLeague: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  scrollHintIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
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
    color: '#FFFFFF',
  },
  glowDot: {
    position: 'absolute',
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
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
    width: '100%', // Inline style ile override edilecek
    height: 180, // Fixed height
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden', // 🔥 Prevent content overflow
  },
  focusCardSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  focusCardUnselected: {
    opacity: 0.6,
  },
  focusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  focusContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  focusName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFB',
    marginBottom: 3,
    lineHeight: 18,
  },
  focusMultiplier: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  focusDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 15,
    fontWeight: '500',
  },
  focusAffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto',
  },
  focusAffectTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '48%',
  },
  focusAffectText: {
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
    gap: 12,
  },
  historyCardVertical: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#64748B',
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  historyTeams: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
    height: 32,
  },
  historyStats: {
    gap: 6,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyStatText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  badgeStamps: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badgeStamp: {
    fontSize: 20,
    opacity: 0.8,
  },
  viewAllBadgesButton: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  viewAllBadgesText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryState: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  // Selected Teams Section
  teamsScroll: {
    paddingRight: 16,
    gap: 12,
  },
  teamBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamBadgeLogo: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  teamBadgePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamBadgeEmoji: {
    fontSize: 20,
  },
  teamBadgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    maxWidth: 80,
  },
});
