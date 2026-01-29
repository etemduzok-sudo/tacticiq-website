// MatchLiveScreen.tsx - React Native FULL VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import api from '../../services/api';
import { handleErrorWithContext, NetworkError } from '../../utils/errorUtils';

const { width, height } = Dimensions.get('window');

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

interface MatchLiveScreenProps {
  matchData: any;
  matchId?: string | number;
  events?: any[];
}

// Mock match metadata
const MOCK_LIVE_STATS = {
  status: '2H',
  minute: 67,
  addedTime: null,
  halfTimeScore: { home: 1, away: 0 },
  currentScore: { home: 2, away: 1 },
};

// Mock maç akışı olayları
const MOCK_LIVE_EVENTS = [
  { minute: 67, type: 'goal', team: 'home', player: 'Icardi', assist: 'Zaha', score: '2-1' },
  { minute: 65, type: 'var-check', description: 'VAR İncelemesi', result: 'Gol onayla' },
  { minute: 63, type: 'substitution', team: 'away', playerOut: 'Valencia', playerIn: 'Dzeko' },
  { minute: 58, type: 'yellow', team: 'home', player: 'Nelsson' },
  { minute: 55, type: 'penalty-missed', team: 'away', player: 'Mertens' },
  { minute: 52, type: 'goal', team: 'away', player: 'Rossi', assist: 'Mertens', score: '1-1' },
  { minute: 48, type: 'injury', team: 'home', player: 'Zaha', description: 'Sakatlık tedavisi' },
  { minute: 46, type: 'kickoff', description: 'İkinci yarı başladı' },
  { minute: 45, type: 'half-time', description: 'İlk yarı sona erdi' },
  { minute: 40, type: 'var-check', description: 'VAR İncelemesi', result: 'Penaltı reddedildi' },
  { minute: 34, type: 'yellow', team: 'away', player: 'Torreira' },
  { minute: 28, type: 'goal', team: 'home', player: 'Icardi', assist: null, score: '1-0' },
  { minute: 22, type: 'red', team: 'away', player: 'Torreira', reason: 'Direkt kırmızı' },
  { minute: 19, type: 'penalty-saved', team: 'home', player: 'Muslera', penaltyTaker: 'Rossi' },
  { minute: 15, type: 'own-goal', team: 'away', player: 'Nelsson', score: '1-0' },
  { minute: 12, type: 'substitution', team: 'home', playerOut: 'Mertens', playerIn: 'Aktürkoğlu' },
  { minute: 8, type: 'second-yellow', team: 'away', player: 'Fernandes' },
  { minute: 3, type: 'goal-cancelled', team: 'home', player: 'Icardi', reason: 'Ofsayt' },
  { minute: 1, type: 'kickoff', description: 'Maç başladı' },
];

// Event categories for tabs
const EVENT_TABS = [
  { id: 'all', label: 'Tümü', icon: '📋' },
  { id: 'goals', label: 'Goller', icon: '⚽' },
  { id: 'cards', label: 'Kartlar', icon: '🟨' },
  { id: 'substitutions', label: 'Değişiklikler', icon: '🔄' },
  { id: 'var', label: 'VAR', icon: '📺' },
  { id: 'other', label: 'Diğer', icon: '📝' },
];

export const MatchLive: React.FC<MatchLiveScreenProps> = ({
  matchData,
  matchId,
  events: propEvents,
}) => {
  // State for live data - NO MORE MOCK DATA, start with empty
  const [liveEvents, setLiveEvents] = useState<any[]>(propEvents || []);
  const [liveStats, setLiveStats] = useState<any>({
    status: 'NS',
    minute: 0,
    addedTime: null,
    halfTimeScore: { home: 0, away: 0 },
    currentScore: { home: 0, away: 0 },
  });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all'); // ✅ Active tab state

  // Pulsing CANLI badge animation
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (!isWeb) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 750 }),
        -1,
        true
      );
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 750 }),
        -1,
        true
      );
    }
  }, []);

  // 🔴 FETCH LIVE DATA FROM API
  useEffect(() => {
    if (!matchId) return;

    const fetchLiveData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 [NEW CODE] Fetching live data for match:', matchId);
        
        // Fetch match events
        try {
          const response = await api.matches.getMatchEvents(matchId);
          console.log('📥 Raw events response from API:', response);
          
          const events = response?.data || [];
          
          if (events && events.length > 0) {
            // Transform API events to our format
            const transformedEvents = events
              .filter((event: any) => event && event.time) // Filter out invalid events
              .map((event: any) => {
                const eventType = event.type?.toLowerCase() || 'unknown';
                const detail = event.detail?.toLowerCase() || '';
                
                // Determine event description based on type and detail
                let description = '';
                let displayType = eventType;
                
                // Match status events
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
                }
                // Goal events
                else if (eventType === 'goal') {
                  if (detail.includes('penalty')) {
                    description = '⚽ Penaltı golü';
                  } else if (detail.includes('own goal')) {
                    description = '⚽ Kendi kalesine gol';
                  } else {
                    description = '⚽ GOL!';
                  }
                }
                // Card events
                else if (eventType === 'card') {
                  if (detail.includes('yellow')) {
                    description = '🟨 Sarı kart';
                  } else if (detail.includes('red')) {
                    description = '🟥 Kırmızı kart';
                  }
                }
                // Substitution events
                else if (eventType === 'subst') {
                  description = '🔄 Oyuncu değişikliği';
                  displayType = 'substitution';
                }
                // Var events
                else if (eventType === 'var') {
                  description = '📺 VAR incelemesi';
                }
                // Other events
                else {
                  description = event.comments || event.detail || '';
                }
                
                return {
                  minute: event.time?.elapsed || 0,
                  extraTime: event.time?.extra || null,
                  type: displayType,
                  team: event.team?.name ? 
                    (event.team.name.toLowerCase().includes(matchData?.homeTeam?.name?.toLowerCase() || '') ? 'home' : 'away') 
                    : null,
                  player: event.player?.name || null,
                  assist: event.assist?.name || null,
                  description: description,
                  detail: event.detail || '',
                  score: event.goals ? `${event.goals.home}-${event.goals.away}` : null,
                };
              })
              .sort((a: any, b: any) => b.minute - a.minute); // Sort by minute descending
            
            setLiveEvents(transformedEvents);
            console.log('✅ Live events loaded:', transformedEvents.length);
            console.log('📊 Transformed events:', transformedEvents.slice(0, 3));
            
            // Calculate score from goal events
            const homeGoals = transformedEvents.filter(e => e.type === 'goal' && e.team === 'home').length;
            const awayGoals = transformedEvents.filter(e => e.type === 'goal' && e.team === 'away').length;
            console.log('⚽ Goals from events - Home:', homeGoals, 'Away:', awayGoals);
          } else {
            console.log('⚠️ No events from API - empty array');
            setLiveEvents([]);
          }
        } catch (eventErr) {
          console.error('❌ Events API failed:', eventErr);
          setLiveEvents([]);
        }

        // Fetch match details for current score/minute
        try {
          const response = await api.matches.getMatchDetails(matchId);
          console.log('📥 Raw match details response from API:', response);
          
          const match = response?.data;
          if (match) {
            // Get score from match data
            const apiScore = match.goals || match.score || { home: 0, away: 0 };
            
            // Calculate score from events (more accurate for live matches)
            const homeGoals = liveEvents.filter(e => e.type === 'goal' && e.team === 'home').length;
            const awayGoals = liveEvents.filter(e => e.type === 'goal' && e.team === 'away').length;
            
            // Use event-based score if available, otherwise use API score
            const finalScore = (homeGoals > 0 || awayGoals > 0) 
              ? { home: homeGoals, away: awayGoals }
              : apiScore;
            
            console.log('📊 Score - API:', apiScore, 'Events:', { home: homeGoals, away: awayGoals }, 'Final:', finalScore);
            
            setLiveStats({
              status: match.fixture?.status?.short || match.status || '1H',
              minute: match.fixture?.status?.elapsed || match.elapsed || 0,
              addedTime: match.fixture?.status?.extra || null,
              halfTimeScore: match.score?.halftime || { home: 0, away: 0 },
              currentScore: finalScore,
            });
            console.log('✅ Live stats loaded:', match.fixture?.status || match.status);
          }
        } catch (statsErr) {
          console.log('⚠️ Stats API failed:', statsErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Error fetching live data:', err);
        handleErrorWithContext(
          new NetworkError('Failed to fetch live match data', 0, `/matches/${matchId}/events`),
          { matchId, action: 'fetch_live_data' },
          { severity: 'medium', showAlert: false }
        );
        setError('Canlı veri yüklenemedi');
        setLoading(false);
        // Keep using mock data
      }
    };

    fetchLiveData();

    // 🔄 Auto-refresh every 30 seconds for live matches
    const interval = setInterval(fetchLiveData, 30000);

    return () => clearInterval(interval);
  }, [matchId]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isWeb ? 1 : scale.value }],
    opacity: isWeb ? 1 : opacity.value,
  }));

  // Debug log
  React.useEffect(() => {
    console.log('📊 MatchLive render - Events count:', liveEvents.length);
    console.log('📊 First 3 events:', liveEvents.slice(0, 3));
  }, [liveEvents]);

  // ✅ Filter events by category
  const filterEventsByCategory = (events: any[], category: string) => {
    if (category === 'all') return events;
    
    return events.filter(event => {
      switch (category) {
        case 'goals':
          return event.type === 'goal' || event.type === 'penalty' || event.type === 'own-goal';
        case 'cards':
          return event.type === 'card' || event.type === 'yellow' || event.type === 'red' || event.type === 'second-yellow';
        case 'substitutions':
          return event.type === 'substitution' || event.type === 'subst';
        case 'var':
          return event.type === 'var' || event.type === 'var-check';
        case 'other':
          return !['goal', 'penalty', 'own-goal', 'card', 'yellow', 'red', 'second-yellow', 'substitution', 'subst', 'var', 'var-check'].includes(event.type);
        default:
          return true;
      }
    });
  };

  // ✅ Get filtered events for active tab
  const filteredEvents = React.useMemo(() => {
    return filterEventsByCategory(liveEvents, activeTab);
  }, [liveEvents, activeTab]);

  // ✅ Get event count for each tab
  const getTabEventCount = (category: string) => {
    return filterEventsByCategory(liveEvents, category).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading State */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1FA2A6" />
          <Text style={styles.loadingText}>Canlı veriler yükleniyor...</Text>
        </View>
      )}

      {/* Compact Score Banner */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreContent}>
          {/* Home Score */}
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreText}>{liveStats.currentScore.home}</Text>
          </View>

          {/* Center Info */}
          <View style={styles.scoreCenter}>
            {/* CANLI Badge */}
            <Animated.View style={[styles.canliBadge, animatedBadgeStyle]}>
              <Text style={styles.canliText}>CANLI</Text>
            </Animated.View>

            {/* Minute */}
            <Text style={styles.minuteText}>{liveStats.minute}'</Text>

            {/* HT Score */}
            <Text style={styles.htText}>
              HT: {liveStats.halfTimeScore.home}-{liveStats.halfTimeScore.away}
            </Text>
          </View>

          {/* Away Score */}
          <View style={styles.scoreRight}>
            <Text style={styles.scoreText}>{liveStats.currentScore.away}</Text>
          </View>
        </View>
      </View>

      {/* ✅ Event Category Tabs */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {EVENT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabEventCount = getTabEventCount(tab.id);
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              {tabEventCount > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {tabEventCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Match Events Timeline */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineContainer}>
          {/* Center Timeline Line */}
          <View style={styles.timelineLine} />

          {/* Events */}
          <View style={styles.eventsContainer}>
            {/* Debug: Show event count */}
            {filteredEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {liveEvents.length === 0 
                    ? 'Henüz canlı event yok'
                    : `${EVENT_TABS.find(t => t.id === activeTab)?.label || 'Bu kategori'} için event yok`}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {liveEvents.length === 0
                    ? 'Maç başladığında eventler burada görünecek'
                    : 'Diğer kategorilere bakabilirsiniz'}
                </Text>
              </View>
            )}
            
            {filteredEvents.map((event, index) => {
              const isCentered = !event.team || 
                event.type === 'kickoff' || 
                event.type === 'halftime' ||
                event.type === 'fulltime' ||
                event.type === 'var';
              const isHome = event.team === 'home';

              if (isCentered) {
                // Determine emoji based on event type
                let emoji = '⚽';
                if (event.type === 'kickoff') emoji = '⚽';
                else if (event.type === 'halftime') emoji = '⏸️';
                else if (event.type === 'fulltime') emoji = '🏁';
                else if (event.type === 'var') emoji = '📺';
                
                return (
                  <Animated.View
                    key={index}
                    entering={isWeb ? undefined : FadeIn.delay(index * 50)}
                    style={styles.centeredEventContainer}
                  >
                    <View style={styles.centeredEventCard}>
                      <View style={styles.centeredEventIcon}>
                        <Text style={styles.centeredEventEmoji}>{emoji}</Text>
                      </View>
                      <View style={styles.centeredEventInfo}>
                        <Text style={styles.centeredEventMinute}>
                          {event.minute}'
                          {event.extraTime && <Text style={styles.extraTime}>+{event.extraTime}</Text>}
                        </Text>
                        <Text style={styles.centeredEventDescription}>{event.description}</Text>
                        {event.score && (
                          <Text style={styles.centeredEventResult}>{event.score}</Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                );
              }

              return (
                <View key={index} style={styles.timelineEvent}>
                  {/* Timeline Dot */}
                  <View style={styles.timelineDot} />

                  {/* Event Card */}
                  <Animated.View
                    entering={isWeb ? undefined : FadeIn.delay(index * 50)}
                    style={[
                      styles.eventCardWrapper,
                      isHome ? styles.eventCardLeft : styles.eventCardRight,
                    ]}
                  >
                    <View style={styles.eventCard}>
                      {/* Header */}
                      <View style={[
                        styles.eventHeader,
                        !isHome && styles.eventHeaderReverse,
                      ]}>
                        <Text style={styles.eventMinute}>
                          {event.minute}'
                          {event.extraTime && <Text style={styles.extraTime}>+{event.extraTime}</Text>}
                        </Text>
                        <Text style={styles.eventIcon}>
                          {event.type === 'goal' && '⚽'}
                          {event.type === 'card' && (event.detail?.includes('yellow') ? '🟨' : '🟥')}
                          {event.type === 'substitution' && '🔄'}
                          {event.type === 'var' && '📺'}
                        </Text>
                      </View>

                      {/* Event Details */}
                      <View style={styles.eventDetails}>
                        {/* Description */}
                        <Text style={styles.eventTitle}>{event.description}</Text>
                        
                        {/* Player name */}
                        {event.player && (
                          <Text style={styles.eventPlayer}>{event.player}</Text>
                        )}
                        
                        {/* Assist */}
                        {event.assist && (
                          <Text style={styles.eventAssist}>Asist: {event.assist}</Text>
                        )}
                        
                        {/* Score */}
                        {event.score && (
                          <Text style={styles.eventScore}>{event.score}</Text>
                        )}
                        
                        {/* Additional detail */}
                        {event.detail && event.detail !== event.description && (
                          <Text style={styles.eventDetail}>{event.detail}</Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Grid pattern görünsün - MatchDetail'den geliyor
  },
  
  // Score Banner
  scoreBanner: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.3)',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  scoreLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scoreRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreCenter: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  canliBadge: {
    backgroundColor: '#1FA2A6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  canliText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  minuteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  htText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  
  // Timeline
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  timelineContainer: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    transform: [{ translateX: -1 }],
  },
  eventsContainer: {
    gap: 24,
  },
  
  // Centered Event
  centeredEventContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  centeredEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centeredEventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredEventEmoji: {
    fontSize: 20,
  },
  centeredEventInfo: {
    gap: 2,
  },
  centeredEventMinute: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  centeredEventDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  centeredEventResult: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // Timeline Event
  timelineEvent: {
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1FA2A6',
    borderWidth: 2,
    borderColor: '#0F2A24',
    transform: [{ translateX: -6 }, { translateY: -6 }],
    zIndex: 20,
  },
  eventCardWrapper: {
    width: '47%',
  },
  eventCardLeft: {
    alignSelf: 'flex-start',
  },
  eventCardRight: {
    alignSelf: 'flex-end',
  },
  eventCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventHeaderReverse: {
    flexDirection: 'row-reverse',
  },
  eventMinute: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  extraTime: {
    fontSize: 9,
    fontWeight: 'normal',
    color: '#F59E0B',
  },
  eventIcon: {
    fontSize: 16,
  },
  eventDetail: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  eventDetails: {
    gap: 4,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  eventTitleSuccess: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  eventTitleError: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  eventTitleYellow: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  eventTitleWarning: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F97316',
  },
  eventPlayer: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  eventPlayerCancelled: {
    fontSize: 11,
    color: '#FFFFFF',
    textDecorationLine: 'line-through',
  },
  eventAssist: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  eventScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  eventReason: {
    fontSize: 10,
    color: '#EF4444',
  },
  eventPlayerOut: {
    fontSize: 10,
    color: '#EF4444',
  },
  eventPlayerIn: {
    fontSize: 10,
    color: '#22C55E',
  },
  
  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // ✅ Event Category Tabs
  tabsContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.3)',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabIconActive: {
    // Same for active
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
});
