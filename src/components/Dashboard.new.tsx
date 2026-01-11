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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
    emoji: '⚡',
    multiplier: 1.25,
    color: '#3B82F6',
    affects: ['Gol Dakikası', 'Oyun Temposu', 'Baskı'],
    description: 'Maçın hızına odaklan',
  },
  {
    id: 'discipline',
    name: 'Disiplin Analizi',
    emoji: '🟨',
    multiplier: 1.25,
    color: '#F59E0B',
    affects: ['Sarı/Kırmızı Kart', 'Faul', 'Penaltı'],
    description: 'Sert geçişleri öngör',
  },
  {
    id: 'fitness',
    name: 'Kondisyon Analizi',
    emoji: '💪',
    multiplier: 1.25,
    color: '#10B981',
    affects: ['Sakatlık', 'Oyuncu Değişikliği', '90+ Gol'],
    description: 'Fiziksel durumu değerlendir',
  },
  {
    id: 'star',
    name: 'Yıldız Analizi',
    emoji: '⭐',
    multiplier: 1.25,
    color: '#8B5CF6',
    affects: ['Maçın Adamı', 'Gol Atan Oyuncu', 'Asist'],
    description: 'Yıldız oyuncuları takip et',
  },
];

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData }: DashboardProps) {
  const insets = useSafeAreaInsets();
  const [selectedFocus, setSelectedFocus] = React.useState<string | null>(null);
  
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
      {/* Curved Header Panel */}
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.98)', 'rgba(15, 23, 42, 0.95)']}
        style={[
          styles.headerPanel,
          { 
            paddingTop: insets.top + 12,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.analystInfo}>
            <Text style={styles.analystLabel}>Analist</Text>
            <Text style={styles.analystName}>Futbol Aşığı</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>5 Seri</Text>
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate('profile')}
            style={styles.profileIconButton}
            activeOpacity={0.7}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>FM</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. YAKLAŞAN & CANLI MAÇLAR */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="football" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Yaklaşan & Canlı Maçlar</Text>
          </View>

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
                    { borderColor: focus.color },
                  ]}
                  onPress={() => setSelectedFocus(focus.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.focusEmoji, { backgroundColor: `${focus.color}20` }]}>
                    <Text style={styles.focusEmojiText}>{focus.emoji}</Text>
                  </View>
                  <Text style={styles.focusName}>{focus.name}</Text>
                  <Text style={styles.focusMultiplier}>x{focus.multiplier}</Text>
                  <Text style={styles.focusDescription}>{focus.description}</Text>
                  <View style={styles.focusAffects}>
                    {focus.affects.slice(0, 2).map((affect, i) => (
                      <Text key={i} style={styles.focusAffectTag}>{affect}</Text>
                    ))}
                  </View>
                  {selectedFocus === focus.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={focus.color} />
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchHistoryScroll}
          >
            {recentMatches.length > 0 ? recentMatches.map((match, index) => (
              <Animated.View key={match.fixture.id} entering={FadeInLeft.delay(700 + index * 100).springify()}>
                <TouchableOpacity
                  style={styles.historyCard}
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
                style={styles.viewAllBadgesCard}
                onPress={() => onNavigate('profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="trophy" size={32} color="#F59E0B" />
                <Text style={styles.viewAllBadgesText}>Tüm Rozetlerimi Gör</Text>
                <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
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

  // Curved Header Panel
  headerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  analystInfo: {
    flex: 1,
  },
  analystLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  analystName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginRight: 12,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  profileIconButton: {
    width: 40,
    height: 40,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  profileIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 100,
  },

  // Section
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
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

  // Live Match Card
  liveMatchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    gap: 12,
  },
  focusCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  focusCardSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  focusEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  focusEmojiText: {
    fontSize: 24,
  },
  focusName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFB',
    marginBottom: 4,
  },
  focusMultiplier: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  focusDescription: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  focusAffects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  focusAffectTag: {
    fontSize: 9,
    color: '#94A3B8',
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Match History
  matchHistoryScroll: {
    paddingRight: 16,
    gap: 12,
  },
  historyCard: {
    width: 200,
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
  viewAllBadgesCard: {
    width: 160,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
