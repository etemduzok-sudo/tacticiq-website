// src/components/match/MatchLive.tsx
// ✅ Canlı Maç Akışı - TacticIQ Design System v1.0
// Elit tasarım: Kadro ve Tahmin sekmeleriyle uyumlu

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { BRAND, DARK_MODE, SPACING, SIZES } from '../../theme/theme';

// ✅ Ses efekti için Audio import (hazırlık)
// import { Audio } from 'expo-av';

const isWeb = Platform.OS === 'web';

// =====================================
// TYPES
// =====================================
interface LiveEvent {
  minute: number;
  extraTime?: number | null;
  type: string;
  team: 'home' | 'away' | null;
  player?: string | null;
  assist?: string | null;
  description: string;
  detail?: string;
  score?: string | null;
}

interface LiveStats {
  status: string;
  minute: number;
  addedTime: number | null;
  halfTimeScore: { home: number; away: number };
  currentScore: { home: number; away: number };
}

interface MatchLiveScreenProps {
  matchData: any;
  matchId: string;
  events?: any[];
}

// =====================================
// EVENT SOUND EFFECTS (Hazırlık)
// =====================================
const EVENT_SOUNDS = {
  goal: 'goal.mp3',
  yellowCard: 'yellow_card.mp3',
  redCard: 'red_card.mp3',
  substitution: 'substitution.mp3',
  whistle: 'whistle.mp3',
  var: 'var.mp3',
};

// ✅ Ses çalma fonksiyonu (şimdilik placeholder)
const playEventSound = async (eventType: string) => {
  // TODO: Ses dosyaları eklendikten sonra aktif edilecek
  // const soundFile = EVENT_SOUNDS[eventType];
  // if (soundFile) {
  //   const { sound } = await Audio.Sound.createAsync(
  //     require(`../../assets/sounds/${soundFile}`)
  //   );
  //   await sound.playAsync();
  // }
  console.log(`🔊 [Sound] Would play: ${eventType}`);
};

// =====================================
// EVENT CATEGORIES
// =====================================
const EVENT_CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: 'grid', filter: () => true },
  { id: 'goals', label: 'Goller', icon: 'football', filter: (e: LiveEvent) => e.type === 'goal' },
  { id: 'cards', label: 'Kartlar', icon: 'card', filter: (e: LiveEvent) => e.type === 'card' },
  { id: 'subs', label: 'Değişiklik', icon: 'swap-horizontal', filter: (e: LiveEvent) => e.type === 'substitution' },
];

// =====================================
// COMPONENT
// =====================================
export const MatchLive: React.FC<MatchLiveScreenProps> = ({
  matchData,
  matchId,
  events: propEvents,
}) => {
  const { t } = useTranslation();
  
  // States
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    status: 'NS',
    minute: 0,
    addedTime: null,
    halfTimeScore: { home: 0, away: 0 },
    currentScore: { home: 0, away: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [matchNotStarted, setMatchNotStarted] = useState(false);
  
  // Animation for LIVE badge
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (!isWeb) {
      pulseScale.value = withRepeat(withTiming(1.15, { duration: 800 }), -1, true);
      pulseOpacity.value = withRepeat(withTiming(0.6, { duration: 800 }), -1, true);
    }
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // =====================================
  // FETCH LIVE DATA
  // =====================================
  useEffect(() => {
    if (!matchId) return;

    const fetchLiveData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.matches.getMatchEventsLive(matchId);
        
        if (response?.matchNotStarted) {
          setMatchNotStarted(true);
          setLiveEvents([]);
          setLiveStats({
            status: 'NS',
            minute: 0,
            addedTime: null,
            halfTimeScore: { home: 0, away: 0 },
            currentScore: { home: 0, away: 0 },
          });
          setLoading(false);
          return;
        }

        setMatchNotStarted(false);
        const events = response?.events || [];

        setLiveStats({
          status: response?.status || 'NS',
          minute: response?.minute || 0,
          addedTime: null,
          halfTimeScore: response?.halftimeScore || { home: 0, away: 0 },
          currentScore: response?.score || { home: 0, away: 0 },
        });

        if (events && events.length > 0) {
          const transformedEvents = events
            .filter((event: any) => event && event.time)
            .map((event: any) => {
              const eventType = event.type?.toLowerCase() || 'unknown';
              const detail = event.detail?.toLowerCase() || '';
              
              let description = '';
              let displayType = eventType;
              
              if (detail === 'match kick off' || detail === 'kick off') {
                description = '⚽ Maç başladı!';
                displayType = 'kickoff';
              } else if (detail === 'half time' || detail === 'halftime') {
                description = '⏸️ İlk yarı sona erdi';
                displayType = 'halftime';
              } else if (detail === 'second half started') {
                description = '▶️ İkinci yarı başladı';
                displayType = 'kickoff';
              } else if (detail === 'match finished' || detail === 'full time') {
                description = '🏁 Maç bitti';
                displayType = 'fulltime';
              } else if (eventType === 'goal') {
                if (detail.includes('penalty')) {
                  description = 'Penaltı golü!';
                } else if (detail.includes('own goal')) {
                  description = 'Kendi kalesine gol';
                } else {
                  description = 'GOL!';
                }
              } else if (eventType === 'card') {
                if (detail.includes('yellow')) {
                  description = 'Sarı kart';
                } else if (detail.includes('red')) {
                  description = 'Kırmızı kart';
                }
              } else if (eventType === 'subst') {
                description = 'Oyuncu değişikliği';
                displayType = 'substitution';
              } else if (eventType === 'var') {
                description = 'VAR incelemesi';
              } else {
                description = event.comments || event.detail || '';
              }
              
              // Team matching
              let teamSide: 'home' | 'away' | null = null;
              if (event.team?.id) {
                const homeTeamId = matchData?.teams?.home?.id || matchData?.homeTeam?.id;
                const awayTeamId = matchData?.teams?.away?.id || matchData?.awayTeam?.id;
                if (event.team.id === homeTeamId) teamSide = 'home';
                else if (event.team.id === awayTeamId) teamSide = 'away';
              } else if (event.team?.name) {
                const homeTeamName = matchData?.teams?.home?.name || matchData?.homeTeam?.name || '';
                teamSide = event.team.name.toLowerCase().includes(homeTeamName.toLowerCase()) ? 'home' : 'away';
              }
              
              return {
                minute: event.time?.elapsed || 0,
                extraTime: event.time?.extra || null,
                type: displayType,
                team: teamSide,
                player: typeof event.player === 'string' ? event.player : event.player?.name || null,
                assist: typeof event.assist === 'string' ? event.assist : (event.assist?.name || null),
                description: description,
                detail: event.detail || '',
                score: event.goals ? `${event.goals.home}-${event.goals.away}` : null,
              };
            })
            .sort((a: any, b: any) => b.minute - a.minute);
          
          setLiveEvents(transformedEvents);
          console.log('✅ Live events loaded:', transformedEvents.length);
        } else {
          setLiveEvents([]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Live data fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, [matchId, matchData]);

  // =====================================
  // FILTER EVENTS
  // =====================================
  const filteredEvents = React.useMemo(() => {
    const category = EVENT_CATEGORIES.find(c => c.id === activeCategory);
    if (!category) return liveEvents;
    return liveEvents.filter(category.filter);
  }, [liveEvents, activeCategory]);

  // =====================================
  // GET EVENT ICON
  // =====================================
  const getEventIcon = (event: LiveEvent) => {
    switch (event.type) {
      case 'goal':
        return { icon: 'football', color: BRAND.secondary, bg: 'rgba(31, 162, 166, 0.2)' };
      case 'card':
        if (event.detail?.includes('yellow')) {
          return { icon: 'card', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
        }
        return { icon: 'card', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
      case 'substitution':
        return { icon: 'swap-horizontal', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' };
      case 'var':
        return { icon: 'tv', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' };
      case 'kickoff':
      case 'halftime':
      case 'fulltime':
        return { icon: 'time', color: BRAND.accent, bg: 'rgba(201, 164, 76, 0.2)' };
      default:
        return { icon: 'ellipse', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.2)' };
    }
  };

  // =====================================
  // RENDER
  // =====================================
  
  // Loading state
  if (loading && liveEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.secondary} />
          <Text style={styles.loadingText}>Canlı veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Match not started
  if (matchNotStarted) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.notStartedContainer}>
          <View style={styles.notStartedCard}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons name="time-outline" size={48} color={BRAND.accent} />
            </View>
            <Text style={styles.notStartedTitle}>Maç Henüz Başlamadı</Text>
            <Text style={styles.notStartedSubtitle}>
              Maç başladığında canlı olaylar{'\n'}burada görünecek
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Score Banner */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreRow}>
          {/* Home Score */}
          <View style={styles.scoreTeam}>
            <Text style={styles.teamName} numberOfLines={1}>
              {matchData?.homeTeam?.name || matchData?.teams?.home?.name || 'Ev Sahibi'}
            </Text>
            <Text style={styles.scoreValue}>{liveStats.currentScore.home}</Text>
          </View>
          
          {/* Live Badge */}
          <View style={styles.scoreCenterSection}>
            <Animated.View style={[styles.liveBadge, !isWeb && pulseStyle]}>
              <Text style={styles.liveBadgeText}>CANLI</Text>
            </Animated.View>
            <Text style={styles.minuteDisplay}>{liveStats.minute}'</Text>
            {liveStats.halfTimeScore && (
              <Text style={styles.htScore}>
                İY: {liveStats.halfTimeScore.home}-{liveStats.halfTimeScore.away}
              </Text>
            )}
          </View>
          
          {/* Away Score */}
          <View style={styles.scoreTeam}>
            <Text style={styles.teamName} numberOfLines={1}>
              {matchData?.awayTeam?.name || matchData?.teams?.away?.name || 'Deplasman'}
            </Text>
            <Text style={styles.scoreValue}>{liveStats.currentScore.away}</Text>
          </View>
        </View>
      </View>

      {/* Category Tabs - Favori Takım Filtre Stilinde */}
      <View style={styles.categoryTabsSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {EVENT_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const count = category.id === 'all' 
              ? liveEvents.length 
              : liveEvents.filter(category.filter).length;
            
            // Kategori için renk
            const getCategoryColor = () => {
              if (category.id === 'goals') return ['#10B981', '#059669'];
              if (category.id === 'cards') return ['#F59E0B', '#D97706'];
              if (category.id === 'subs') return ['#8B5CF6', '#7C3AED'];
              return [BRAND.secondary, BRAND.secondary];
            };
            const colors = getCategoryColor();
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setActiveCategory(category.id)}
                activeOpacity={0.7}
              >
                {/* Kategori renk badge */}
                {category.id !== 'all' && (
                  <View style={styles.categoryChipBadge}>
                    <View style={[styles.categoryChipStripe, { backgroundColor: colors[0] }]} />
                    <View style={[styles.categoryChipStripe, { backgroundColor: colors[1] }]} />
                  </View>
                )}
                <Ionicons 
                  name={category.icon as any} 
                  size={14} 
                  color={isActive ? '#FFFFFF' : '#94A3B8'} 
                />
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {category.label}
                </Text>
                {count > 0 && isActive && (
                  <View style={styles.categoryChipCheck}>
                    <Text style={styles.categoryChipCheckText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView 
        style={styles.eventsScrollView}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color="#4B5563" />
            <Text style={styles.emptyStateTitle}>
              {liveEvents.length === 0 ? 'Henüz olay yok' : 'Bu kategoride olay yok'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {liveEvents.length === 0 
                ? 'Maç devam ederken olaylar burada görünecek'
                : 'Diğer kategorilere bakabilirsiniz'}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event, index) => {
            const eventIcon = getEventIcon(event);
            const isSystemEvent = ['kickoff', 'halftime', 'fulltime'].includes(event.type);
            
            return (
              <Animated.View
                key={index}
                entering={isWeb ? undefined : FadeIn.delay(index * 30)}
                style={[
                  styles.eventCard,
                  isSystemEvent && styles.eventCardSystem,
                ]}
              >
                {/* Event Icon */}
                <View style={[styles.eventIconContainer, { backgroundColor: eventIcon.bg }]}>
                  <Ionicons name={eventIcon.icon as any} size={20} color={eventIcon.color} />
                </View>
                
                {/* Event Content */}
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: eventIcon.color }]}>
                      {event.description}
                    </Text>
                    <View style={styles.eventTimeBadge}>
                      <Text style={styles.eventTimeText}>
                        {event.minute}'
                        {event.extraTime && <Text style={styles.extraTimeText}>+{event.extraTime}</Text>}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Player Info */}
                  {event.player && (
                    <Text style={styles.eventPlayer}>{event.player}</Text>
                  )}
                  
                  {/* Assist */}
                  {event.assist && (
                    <Text style={styles.eventAssist}>Asist: {event.assist}</Text>
                  )}
                  
                  {/* Score after goal */}
                  {event.type === 'goal' && event.score && (
                    <View style={styles.goalScoreBadge}>
                      <Ionicons name="football" size={12} color={BRAND.secondary} />
                      <Text style={styles.goalScoreText}>{event.score}</Text>
                    </View>
                  )}
                  
                  {/* Team indicator */}
                  {event.team && !isSystemEvent && (
                    <Text style={styles.eventTeam}>
                      {event.team === 'home' 
                        ? (matchData?.homeTeam?.name || matchData?.teams?.home?.name) 
                        : (matchData?.awayTeam?.name || matchData?.teams?.away?.name)}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =====================================
// STYLES - Design System Uyumlu
// =====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Not Started
  notStartedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notStartedCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    maxWidth: 320,
  },
  notStartedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notStartedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notStartedSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Score Banner
  scoreBanner: {
    backgroundColor: DARK_MODE.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTeam: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreCenterSection: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  liveBadge: {
    backgroundColor: BRAND.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  minuteDisplay: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.secondary,
  },
  htScore: {
    fontSize: 11,
    color: '#64748B',
  },
  
  // Category Tabs - Favori Takım Filtre Stilinde
  categoryTabsSection: {
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(75, 85, 99, 0.4)',
  },
  categoryChipActive: {
    backgroundColor: BRAND.secondary,
    borderColor: BRAND.secondary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    maxWidth: 80,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  categoryChipStripe: {
    flex: 1,
    height: '100%',
  },
  categoryChipCheck: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  categoryChipCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Events List
  eventsScrollView: {
    flex: 1,
  },
  eventsContent: {
    padding: 16,
    gap: 12,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  
  // Event Card
  eventCard: {
    flexDirection: 'row',
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  eventCardSystem: {
    backgroundColor: 'rgba(201, 164, 76, 0.08)',
    borderColor: 'rgba(201, 164, 76, 0.2)',
  },
  eventIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventContent: {
    flex: 1,
    gap: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  eventTimeBadge: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.secondary,
  },
  extraTimeText: {
    fontSize: 10,
    color: '#F59E0B',
  },
  eventPlayer: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  eventAssist: {
    fontSize: 12,
    color: '#94A3B8',
  },
  goalScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  goalScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.secondary,
  },
  eventTeam: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default MatchLive;
