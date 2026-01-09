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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { matchesApi } from '../../services/api';
import { handleErrorWithContext, NetworkError } from '../../utils/errorUtils';

const { width, height } = Dimensions.get('window');

interface MatchLiveScreenProps {
  matchData: any;
  matchId?: string | number;
  events?: any[];
}

// Mock match metadata
const liveStats = {
  status: '2H',
  minute: 67,
  addedTime: null,
  halfTimeScore: { home: 1, away: 0 },
  currentScore: { home: 2, away: 1 },
};

// Mock maç akışı olayları
const liveEvents = [
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

export const MatchLive: React.FC<MatchLiveScreenProps> = ({
  matchData,
  matchId,
  events: propEvents,
}) => {
  // State for live data
  const [liveEvents, setLiveEvents] = useState<any[]>(propEvents || liveEvents);
  const [liveStats, setLiveStats] = useState<any>(liveStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pulsing CANLI badge animation
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
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
  }, []);

  // 🔴 FETCH LIVE DATA FROM API
  useEffect(() => {
    if (!matchId) return;

    const fetchLiveData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch match events
        const eventsResponse = await matchesApi.getMatchEvents(Number(matchId));
        if (eventsResponse.success && eventsResponse.data) {
          setLiveEvents(eventsResponse.data);
          console.log('✅ Live events loaded:', eventsResponse.data.length);
        }

        // Fetch match details for current score/minute
        const detailsResponse = await matchesApi.getMatchDetails(Number(matchId));
        if (detailsResponse.success && detailsResponse.data) {
          const match = detailsResponse.data;
          setLiveStats({
            status: match.fixture?.status?.short || '1H',
            minute: match.fixture?.status?.elapsed || 0,
            addedTime: match.fixture?.status?.extra || null,
            halfTimeScore: match.score?.halftime || { home: 0, away: 0 },
            currentScore: match.goals || { home: 0, away: 0 },
          });
          console.log('✅ Live stats loaded');
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
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading State */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#059669" />
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
            {liveEvents.map((event, index) => {
              const isCentered = !event.team || 
                event.type === 'kickoff' || 
                event.type === 'half-time' || 
                event.type === 'var-check';
              const isHome = event.team === 'home';

              if (isCentered) {
                return (
                  <Animated.View
                    key={index}
                    entering={FadeIn.delay(index * 50)}
                    style={styles.centeredEventContainer}
                  >
                    <View style={styles.centeredEventCard}>
                      <View style={styles.centeredEventIcon}>
                        <Text style={styles.centeredEventEmoji}>
                          {event.type === 'kickoff' && '⚽'}
                          {event.type === 'half-time' && '⏸️'}
                          {event.type === 'var-check' && '📺'}
                        </Text>
                      </View>
                      <View style={styles.centeredEventInfo}>
                        <Text style={styles.centeredEventMinute}>{event.minute}'</Text>
                        <Text style={styles.centeredEventDescription}>{event.description}</Text>
                        {event.result && (
                          <Text style={styles.centeredEventResult}>{event.result}</Text>
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
                    entering={FadeIn.delay(index * 50)}
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
                        <Text style={styles.eventMinute}>{event.minute}'</Text>
                        <Text style={styles.eventIcon}>
                          {event.type === 'goal' && '⚽'}
                          {event.type === 'own-goal' && '⚽'}
                          {event.type === 'goal-cancelled' && '❌'}
                          {event.type === 'penalty-missed' && '🚫'}
                          {event.type === 'penalty-saved' && '🧤'}
                          {event.type === 'yellow' && '🟨'}
                          {event.type === 'red' && '🟥'}
                          {event.type === 'second-yellow' && '🟨🟥'}
                          {event.type === 'substitution' && '🔁'}
                          {event.type === 'injury' && '🤕'}
                        </Text>
                      </View>

                      {/* Event Details */}
                      <View style={styles.eventDetails}>
                        {/* Goal Event */}
                        {event.type === 'goal' && (
                          <>
                            <Text style={styles.eventTitle}>⚽ GOL!</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                            {event.assist && (
                              <Text style={styles.eventAssist}>Asist: {event.assist}</Text>
                            )}
                            <Text style={styles.eventScore}>{event.score}</Text>
                          </>
                        )}

                        {/* Own Goal */}
                        {event.type === 'own-goal' && (
                          <>
                            <Text style={styles.eventTitleError}>KENDI KALESİNE GOL</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                            <Text style={styles.eventScore}>{event.score}</Text>
                          </>
                        )}

                        {/* Goal Cancelled */}
                        {event.type === 'goal-cancelled' && (
                          <>
                            <Text style={styles.eventTitleError}>GOL İPTAL</Text>
                            <Text style={styles.eventPlayerCancelled}>{event.player}</Text>
                            <Text style={styles.eventReason}>{event.reason}</Text>
                          </>
                        )}

                        {/* Penalty Missed */}
                        {event.type === 'penalty-missed' && (
                          <>
                            <Text style={styles.eventTitleError}>PENALTI KAÇTI</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                          </>
                        )}

                        {/* Penalty Saved */}
                        {event.type === 'penalty-saved' && (
                          <>
                            <Text style={styles.eventTitleSuccess}>PENALTI KURTARILDI</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                            <Text style={styles.eventAssist}>Atan: {event.penaltyTaker}</Text>
                          </>
                        )}

                        {/* Yellow Card */}
                        {event.type === 'yellow' && (
                          <>
                            <Text style={styles.eventTitleYellow}>SARI KART</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                          </>
                        )}

                        {/* Red Card */}
                        {event.type === 'red' && (
                          <>
                            <Text style={styles.eventTitleError}>KIRMIZI KART</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                            {event.reason && (
                              <Text style={styles.eventReason}>{event.reason}</Text>
                            )}
                          </>
                        )}

                        {/* Second Yellow */}
                        {event.type === 'second-yellow' && (
                          <>
                            <Text style={styles.eventTitleError}>İKİNCİ SARI KART</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                          </>
                        )}

                        {/* Substitution */}
                        {event.type === 'substitution' && (
                          <>
                            <Text style={styles.eventTitle}>OYUNCU DEĞİŞİKLİĞİ</Text>
                            <Text style={styles.eventPlayerOut}>↓ {event.playerOut}</Text>
                            <Text style={styles.eventPlayerIn}>↑ {event.playerIn}</Text>
                          </>
                        )}

                        {/* Injury */}
                        {event.type === 'injury' && (
                          <>
                            <Text style={styles.eventTitleWarning}>SAKATLIK</Text>
                            <Text style={styles.eventPlayer}>{event.player}</Text>
                            <Text style={styles.eventAssist}>{event.description}</Text>
                          </>
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
    backgroundColor: '#0F172A',
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
    backgroundColor: '#059669',
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
    color: '#059669',
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
    color: '#059669',
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
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#0F172A',
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
    color: '#059669',
  },
  eventIcon: {
    fontSize: 16,
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
    color: '#059669',
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
    color: '#059669',
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
});
