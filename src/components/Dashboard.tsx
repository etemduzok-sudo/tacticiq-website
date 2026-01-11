// components/Dashboard.tsx - Analist Kontrol Paneli
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInLeft,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

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

  // Handle focus selection with haptic feedback
  const handleFocusSelect = (focusId: string) => {
    // Haptic feedback (only on mobile)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedFocus(focusId);
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

  // Show loading ONLY on first load
  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Kontrol paneli yükleniyor...</Text>
      </View>
    );
  }

  // Get upcoming matches (next 24 hours)
  const now = Date.now() / 1000;
  const next24Hours = now + (24 * 60 * 60);
  const upcomingNext24h = upcomingMatches.filter(match => {
    const matchTime = match.fixture.timestamp;
    return matchTime >= now && matchTime <= next24Hours;
  });

  // Get last 3 matches for history
  const recentMatches = pastMatches.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. YAKLAŞAN & CANLI MAÇLAR - Horizontal Scroll */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.section, styles.firstSection]}>
            <View style={styles.sectionHeader}>
            <Ionicons name="football" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Yaklaşan & Canlı Maçlar</Text>
            </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.upcomingMatchesScroll}
          >
            {/* Live Matches */}
          {liveMatches.length > 0 && liveMatches.slice(0, 2).map((match, index) => (
            <Animated.View key={match.fixture.id} entering={FadeInDown.delay(200 + index * 100).springify()}>
                <TouchableOpacity
                style={styles.liveMatchCard}
                  onPress={() => onNavigate('match-detail', { id: match.fixture.id })}
                  activeOpacity={0.8}
                >
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>CANLI</Text>
                    <Text style={styles.liveMinute}>{match.fixture.status.elapsed}'</Text>
                  </View>

                <View style={styles.matchTeams}>
                  <View style={styles.matchTeam}>
                    <Text style={styles.teamLogo}>{match.teams.home.logo || '⚽'}</Text>
                    <Text style={styles.teamName}>{match.teams.home.name}</Text>
                    </View>
                  <View style={styles.matchScore}>
                    <Text style={styles.scoreText}>{match.goals.home} - {match.goals.away}</Text>
                    </View>
                  <View style={styles.matchTeam}>
                    <Text style={styles.teamLogo}>{match.teams.away.logo || '⚽'}</Text>
                    <Text style={styles.teamName}>{match.teams.away.name}</Text>
                  </View>
                </View>

                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.liveTrackButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="eye" size={16} color="#FFFFFF" />
                  <Text style={styles.liveTrackText}>Canlı Takip</Text>
                </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}

          {/* Upcoming Matches (Next 24h) */}
          {upcomingNext24h.length > 0 ? upcomingNext24h.slice(0, 3).map((match, index) => (
            <Animated.View key={match.fixture.id} entering={FadeInDown.delay(300 + index * 100).springify()}>
                <TouchableOpacity
                style={styles.upcomingMatchCard}
                onPress={() => onNavigate('match-detail', { id: match.fixture.id })}
                  activeOpacity={0.8}
                >
                <View style={styles.matchHeader}>
                  <Text style={styles.matchLeague}>{match.league.name}</Text>
                  <Text style={styles.matchTime}>{api.utils.formatMatchTime(match.fixture.timestamp)}</Text>
                  </View>

                  <View style={styles.matchTeams}>
                  <View style={styles.matchTeam}>
                    <Text style={styles.teamLogo}>{match.teams.home.logo || '⚽'}</Text>
                    <Text style={styles.teamName}>{match.teams.home.name}</Text>
                    </View>
                  <Text style={styles.vsText}>VS</Text>
                  <View style={styles.matchTeam}>
                    <Text style={styles.teamLogo}>{match.teams.away.logo || '⚽'}</Text>
                    <Text style={styles.teamName}>{match.teams.away.name}</Text>
                  </View>
                    </View>

                {/* Analyst Advice Balloon */}
                {selectedFocus && getAnalystAdvice(match) && (
                  <View style={[styles.adviceBalloon, { backgroundColor: `${getAnalystAdvice(match)!.color}20` }]}>
                    <Text style={styles.adviceIcon}>{getAnalystAdvice(match)!.icon}</Text>
                    <Text style={[styles.adviceText, { color: getAnalystAdvice(match)!.color }]}>
                      {getAnalystAdvice(match)!.text}
                      </Text>
                    </View>
                )}

                    <LinearGradient
                      colors={['#059669', '#047857']}
                  style={styles.predictButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                  <Ionicons name="analytics" size={16} color="#FFFFFF" />
                  <Text style={styles.predictButtonText}>Analizini Gir</Text>
                  <View style={styles.glowDot} />
                    </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#64748B" />
              <Text style={styles.emptyText}>24 saat içinde maç yok</Text>
            </View>
          )}
          </ScrollView>
        </Animated.View>

        {/* 2. STRATEJİK ODAK (STRATEGIC FOCUS) */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Analiz Odağı Seç</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Seçtiğin odak x1.25 puan çarpanı kazandırır</Text>

          <View style={styles.focusGrid}>
            {strategicFocusOptions.map((focus, index) => (
              <Animated.View key={focus.id} entering={FadeInLeft.delay(500 + index * 50).springify()}>
                <TouchableOpacity
                  style={[
                    styles.focusCard,
                    selectedFocus === focus.id && styles.focusCardSelected,
                    selectedFocus && selectedFocus !== focus.id && styles.focusCardUnselected,
                    { 
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
                    <Text style={styles.focusDescription}>{focus.description}</Text>
                    
                    {/* Affects Tags */}
                    <View style={styles.focusAffects}>
                      {focus.affects.map((affect, i) => (
                        <View key={i} style={[styles.focusAffectTag, { backgroundColor: `${focus.color}20` }]}>
                          <Text style={[styles.focusAffectText, { color: focus.color }]}>{affect}</Text>
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
            ))}
          </View>
        </Animated.View>

        {/* 3. ROZETLİ MAÇ ÖZETLERİ (SON 3 MAÇ) */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Son Performansın</Text>
        </View>

          <View style={styles.matchHistoryVertical}>
            {recentMatches.length > 0 ? recentMatches.map((match, index) => (
              <Animated.View key={match.fixture.id} entering={FadeInLeft.delay(700 + index * 100).springify()}>
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
                      {match.goals.home} - {match.goals.away}
                    </Text>
        </View>
                  
                  <Text style={styles.historyTeams} numberOfLines={2}>
                    {match.teams.home.name} vs {match.teams.away.name}
                  </Text>

                  <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.historyStatText}>350 Puan</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Ionicons name="analytics" size={16} color="#059669" />
                      <Text style={styles.historyStatText}>%85 Tempo</Text>
                    </View>
                  </View>

                  {/* Badge Stamps */}
                  <View style={styles.badgeStamps}>
                    <Text style={styles.badgeStamp}>🏆</Text>
                    <Text style={styles.badgeStamp}>⚡</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )) : (
              <View style={styles.emptyHistoryState}>
                <Ionicons name="time-outline" size={48} color="#64748B" />
                <Text style={styles.emptyText}>Henüz maç geçmişin yok</Text>
              </View>
            )}

            {/* View All Badges Button */}
            <Animated.View entering={FadeInLeft.delay(1000).springify()}>
              <TouchableOpacity
                style={styles.viewAllBadgesButton}
                onPress={() => onNavigate('profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.viewAllBadgesText}>Tüm Rozetlerimi Gör</Text>
                <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

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
  },
  firstSection: {
    marginTop: 20, // ProfileCard'ın altına boşluk bırak
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
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
    paddingHorizontal: 16,
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

  // Upcoming Match Card
  upcomingMatchCard: {
    width: 320, // Fixed width for horizontal scroll
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
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
    justifyContent: 'space-between',
    gap: 12,
  },
  focusCard: {
    width: (width - 44) / 2, // 2 columns
    height: 160, // Fixed height for equal rectangles
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  focusCardSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)',
      },
    }),
  },
  focusCardUnselected: {
    opacity: 0.6,
  },
  focusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  focusContent: {
    flex: 1,
  },
  focusName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFB',
    marginBottom: 4,
  },
  focusMultiplier: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  focusDescription: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 14,
  },
  focusAffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto',
  },
  focusAffectTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  focusAffectText: {
    fontSize: 9,
    fontWeight: '600',
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
});
