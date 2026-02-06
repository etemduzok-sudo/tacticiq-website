// src/components/match/MatchLive.tsx
// ✅ Canlı Maç Timeline - TacticIQ Design System v2.1
// Sadece canlı olaylar (gol, kart, değişiklik). Maç istatistikleri İstatistik sekmesinde.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { BRAND, DARK_MODE } from '../../theme/theme';

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

interface MatchLiveScreenProps {
  matchData: any;
  matchId: string;
  events?: any[];
}

// =====================================
// COMPONENT
// =====================================
export const MatchLive: React.FC<MatchLiveScreenProps> = ({
  matchData,
  matchId,
  events: propEvents,
}) => {
  const { t } = useTranslation();
  
  // States – sadece canlı olaylar (istatistikler İstatistik sekmesinde)
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchNotStarted, setMatchNotStarted] = useState(false);
  const matchNotStartedRef = useRef(false);
  matchNotStartedRef.current = matchNotStarted;

  // Mock maç (999999): 52. dk, skor 5-4, ilk yarı 1 dk uzadı, 45+1 ev sahibi kırmızı kart, en az 8 event
  const MOCK_999999_EVENTS = [
    { time: { elapsed: 0, extra: null }, type: 'Goal', detail: 'Kick Off', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 10, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 1, away: 0 } },
    { time: { elapsed: 20, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ö. Kılıç' }, assist: null, goals: { home: 1, away: 1 } },
    { time: { elapsed: 28, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'D. Aksoy' }, assist: { name: 'H. Çelik' }, goals: { home: 2, away: 1 } },
    { time: { elapsed: 35, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ç. Yılmaz' }, assist: null, goals: { home: 2, away: 2 } },
    { time: { elapsed: 40, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'B. Arslan' }, assist: null, goals: { home: 3, away: 2 } },
    { time: { elapsed: 45, extra: null }, type: 'Goal', detail: 'First Half Extra Time', team: null, player: null, assist: null, goals: null, comments: '1' },
    { time: { elapsed: 45, extra: 1 }, type: 'Card', detail: 'Red Card', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'C. Şahin' }, assist: null, goals: null },
    { time: { elapsed: 45, extra: 1 }, type: 'Goal', detail: 'Half Time', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 46, extra: null }, type: 'Goal', detail: 'Second Half Started', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 47, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ş. Aslan' }, assist: null, goals: { home: 3, away: 3 } },
    { time: { elapsed: 49, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'K. Yıldız' }, assist: { name: 'M. Özkan' }, goals: { home: 4, away: 3 } },
    { time: { elapsed: 51, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 5, away: 3 } },
    { time: { elapsed: 52, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'İ. Koç' }, assist: { name: 'G. Bayrak' }, goals: { home: 5, away: 4 } },
  ];

  // =====================================
  // FETCH LIVE EVENTS
  // =====================================
  useEffect(() => {
    if (!matchId) return;
    const isMockMatch = String(matchId) === '999999';

    const fetchLiveData = async () => {
      try {
        if (!matchNotStartedRef.current) {
          setLoading(true);
        }
        setError(null);

        let events: any[] = [];
        // Mock maç (999999): Her zaman tam event listesi (45. dk uzatma, devre arası, 2. yarı) – API yanıtı kullanılmaz
        if (isMockMatch) {
          setMatchNotStarted(false);
          events = MOCK_999999_EVENTS;
        } else {
          try {
            const response = await api.matches.getMatchEventsLive(matchId);
            if (response?.matchNotStarted) {
              setMatchNotStarted(true);
              setLiveEvents([]);
              setLoading(false);
              return;
            }
            setMatchNotStarted(false);
            events = response?.events || [];
          } catch (apiErr) {
            throw apiErr;
          }
        }

        if (events && events.length > 0) {
          // API-Football event listesi: Kick Off, First Half Extra Time, Half Time, Second Half Started,
          // Match Finished, Normal Goal, Penalty, Own Goal, Yellow/Red Card, Substitution, Var
          const transformedEvents = events
            .filter((event: any) => event && event.time)
            .map((event: any) => {
              const eventType = event.type?.toLowerCase() || 'unknown';
              const detail = (event.detail || '').toLowerCase();
              const detailNorm = detail.replace(/-/g, ' ').trim();
              
              let description = '';
              let displayType = eventType;
              
              // API-Football: Maç / yarı başlangıç ve bitiş
              if (detail === 'match kick off' || detail === 'kick off' || detailNorm === '1st half' || detailNorm === 'first half') {
                description = 'Maç başladı';
                displayType = 'kickoff';
              } else if (detailNorm.includes('first half extra time') && (event.time?.extra == null || event.time?.extra === 0)) {
                const ex = Number(event.comments) || event.time?.extra || 0;
                description = ex > 0 ? `45. dk +${ex} dk uzatma` : '45. dk uzatma';
                displayType = 'stoppage';
              } else if (event.time?.elapsed === 90 && (event.time?.extra != null && event.time.extra > 0)) {
                const ex = event.time.extra;
                description = `90. dk +${ex} dk uzatma`;
                displayType = 'stoppage';
              } else if (detailNorm.includes('second half extra time') || (detailNorm.includes('extra time') && event.time?.elapsed === 90)) {
                const ex = event.time?.extra ?? 0;
                description = ex > 0 ? `90. dk +${ex} dk uzatma` : '90. dk uzatma';
                displayType = 'stoppage';
              } else if (detailNorm.includes('first half extra time') && (event.time?.extra != null && event.time.extra > 0)) {
                const ex = event.time?.extra ?? 0;
                description = ex > 0 ? `45. dk +${ex} dk uzatma` : '45. dk uzatma';
                displayType = 'stoppage';
              } else if ((detail === 'half time' || detail === 'halftime' || detailNorm === 'half time') && (event.time?.extra != null && event.time.extra > 0)) {
                description = 'İlk yarı bitti';
                displayType = 'halftime';
              } else if (detail === 'half time' || detail === 'halftime' || detailNorm === 'half time') {
                description = 'İlk yarı sonu';
                displayType = 'halftime';
              } else if (detailNorm.includes('second half') || detail === '2nd half' || detail === 'second half started') {
                description = 'İkinci yarı başladı';
                displayType = 'kickoff';
              } else if (detail === 'match finished' || detail === 'full time' || detailNorm.includes('full time')) {
                description = 'Maç bitti';
                displayType = 'fulltime';
              } else if (eventType === 'goal') {
                if (detail.includes('penalty')) {
                  description = 'Penaltı golü';
                } else if (detail.includes('own goal')) {
                  description = 'Kendi kalesine';
                } else if (detail.includes('free kick') || detail.includes('direct free kick') || detailNorm.includes('serbest vuruş')) {
                  description = 'Serbest vuruştan gol';
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
                description = 'Değişiklik';
                displayType = 'substitution';
              } else if (eventType === 'var') {
                description = 'VAR';
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
            // Sırala: yüksek dakika üstte. Aynı dakikada (örn. 45+1): önce oyuncu olayları (kırmızı kart, gol), sonra sistem (İlk yarı bitti)
            .sort((a: LiveEvent, b: LiveEvent) => {
              const aTime = a.minute + (a.extraTime || 0) * 0.01;
              const bTime = b.minute + (b.extraTime || 0) * 0.01;
              if (Math.abs(aTime - bTime) > 0.001) return bTime - aTime;
              const sys = ['kickoff', 'halftime', 'fulltime', 'stoppage'];
              const aSys = sys.includes(a.type) ? 0 : 1;
              const bSys = sys.includes(b.type) ? 0 : 1;
              return bSys - aSys;
            });
          
          setLiveEvents(transformedEvents);
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

  // Maçın şu anki dakikası (header ile tutarlı – timeline sadece bu dakikaya kadar gösterilir)
  const currentMinute = matchData?.minute ?? matchData?.fixture?.status?.elapsed ?? 99;
  const eventsUpToNow = liveEvents.filter((e) => {
    const eventMin = e.minute + (e.extraTime ?? 0) * 0.01;
    return eventMin <= currentMinute + 0.01;
  });

  // Dakika + uzatma metni (örn. 45+2, 90+3)
  const formatMinute = (event: LiveEvent) =>
    event.extraTime != null && event.extraTime > 0
      ? `${event.minute}+${event.extraTime}`
      : String(event.minute);

  // =====================================
  // GET EVENT STYLING
  // =====================================
  const getEventStyle = (event: LiveEvent) => {
    switch (event.type) {
      case 'goal':
        return { icon: 'football', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'card':
        if (event.detail?.toLowerCase().includes('yellow')) {
          return { icon: 'card', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
        }
        return { icon: 'card', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'substitution':
        return { icon: 'swap-horizontal', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'var':
        return { icon: 'tv', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'kickoff':
      case 'halftime':
      case 'fulltime':
      case 'stoppage':
        return { icon: 'time', color: BRAND.accent, bg: 'rgba(201, 164, 76, 0.15)' };
      default:
        return { icon: 'ellipse', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' };
    }
  };

  // =====================================
  // RENDER EVENT CARD
  // =====================================
  const renderEventCard = (event: LiveEvent, index: number) => {
    const style = getEventStyle(event);
    const isSystemEvent = ['kickoff', 'halftime', 'fulltime', 'stoppage'].includes(event.type);
    const isHome = event.team === 'home';
    const isAway = event.team === 'away';
    
    // Sistem eventleri ortada göster
    if (isSystemEvent) {
      return (
        <Animated.View
          key={index}
          entering={isWeb ? undefined : FadeIn.delay(index * 30)}
          style={styles.timelineRow}
        >
          {/* Sol boşluk */}
          <View style={styles.timelineSide} />
          
          {/* Orta çizgi + dakika */}
          <View style={styles.timelineCenter}>
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: style.color }]}>
              <Ionicons name={style.icon as any} size={12} color="#FFFFFF" />
            </View>
            <View style={styles.timelineMinuteBadge}>
              <Text style={styles.timelineMinuteText}>{formatMinute(event)}'</Text>
            </View>
          </View>
          
          {/* Sağ boşluk */}
          <View style={styles.timelineSide} />
          
          {/* Sistem event kartı - ortada */}
          <View style={[styles.systemEventOverlay]}>
            <View style={[styles.systemEventCard, { borderColor: style.color }]}>
              <Ionicons name={style.icon as any} size={14} color={style.color} />
              <Text style={[styles.systemEventText, { color: style.color }]}>
                {event.description}
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return (
      <Animated.View
        key={index}
        entering={isWeb ? undefined : FadeIn.delay(index * 30)}
        style={styles.timelineRow}
      >
        {/* Sol taraf - Ev sahibi eventleri */}
        <View style={[styles.timelineSide, styles.timelineSideLeft]}>
          {isHome && (
            <View style={[styles.eventCard, styles.eventCardLeft, { borderColor: style.color }]}>
              <View style={styles.eventCardHeader}>
                <View style={[styles.eventIcon, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon as any} size={14} color={style.color} />
                </View>
                <Text style={[styles.eventDescription, { color: style.color }]} numberOfLines={1}>
                  {event.description}
                </Text>
              </View>
              {event.player && (
                <Text style={styles.eventPlayer} numberOfLines={1}>{event.player}</Text>
              )}
              {event.assist && (
                <Text style={styles.eventAssist} numberOfLines={1}>⚡ {event.assist}</Text>
              )}
              {event.type === 'goal' && event.score && (
                <Text style={styles.eventScore}>{event.score}</Text>
              )}
            </View>
          )}
        </View>
        
        {/* Orta çizgi + dakika */}
        <View style={styles.timelineCenter}>
          <View style={styles.timelineLine} />
          <View style={[styles.timelineDot, { backgroundColor: style.color }]}>
            <Text style={styles.timelineDotText}>{formatMinute(event)}</Text>
          </View>
        </View>
        
        {/* Sağ taraf - Deplasman eventleri */}
        <View style={[styles.timelineSide, styles.timelineSideRight]}>
          {isAway && (
            <View style={[styles.eventCard, styles.eventCardRight, { borderColor: style.color }]}>
              <View style={styles.eventCardHeader}>
                <Text style={[styles.eventDescription, { color: style.color }]} numberOfLines={1}>
                  {event.description}
                </Text>
                <View style={[styles.eventIcon, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon as any} size={14} color={style.color} />
                </View>
              </View>
              {event.player && (
                <Text style={[styles.eventPlayer, styles.eventPlayerRight]} numberOfLines={1}>{event.player}</Text>
              )}
              {event.assist && (
                <Text style={[styles.eventAssist, styles.eventAssistRight]} numberOfLines={1}>⚡ {event.assist}</Text>
              )}
              {event.type === 'goal' && event.score && (
                <Text style={[styles.eventScore, styles.eventScoreRight]}>{event.score}</Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
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

  // Error state - API connection failed or other error
  if (error && liveEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.notStartedContainer}>
          <View style={styles.notStartedCard}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.notStartedTitle}>Bağlantı Hatası</Text>
            <Text style={styles.notStartedSubtitle}>
              Canlı maç verisi alınamadı.{'\n'}Lütfen internet bağlantınızı kontrol edin.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Canlı olay timeline – Olaylar/İstatistikler tab bar kaldırıldı; istatistikler İstatistik sekmesinde */}
      <ScrollView 
        style={styles.eventsScrollView}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        {eventsUpToNow.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color="#4B5563" />
            <Text style={styles.emptyStateTitle}>Henüz olay yok</Text>
            <Text style={styles.emptyStateSubtitle}>
              Maç devam ederken olaylar burada görünecek
            </Text>
          </View>
        ) : (
          <>
            {/* Sadece mevcut dakikaya kadar olan olaylar (header 65' ise 90+2 gösterilmez) */}
            {/* Sırala: yüksek dakika üstte. Aynı dakikada: önce oyuncu olayları (gol, kart), sonra sistem olayları (devre arası) */}
            {[...eventsUpToNow]
              .sort((a, b) => {
                const aTime = (a.minute || 0) + (a.extraTime || 0) * 0.01;
                const bTime = (b.minute || 0) + (b.extraTime || 0) * 0.01;
                if (Math.abs(aTime - bTime) > 0.001) return bTime - aTime;
                // Aynı dakikada: sistem olayları (kickoff, halftime, fulltime, stoppage) en sona
                const sys = ['kickoff', 'halftime', 'fulltime', 'stoppage'];
                const aSys = sys.includes(a.type) ? 0 : 1;
                const bSys = sys.includes(b.type) ? 0 : 1;
                return bSys - aSys;
              })
              .map((event, index) => renderEventCard(event, index))}
            <View style={styles.timelineStart}>
              <View style={styles.timelineStartLine} />
              <View style={styles.timelineStartDot}>
                <Text style={styles.timelineStartText}>0'</Text>
              </View>
              <Text style={styles.timelineStartLabel}>Başlangıç</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =====================================
// STYLES
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
    paddingVertical: 60,
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
  
  // Events ScrollView
  eventsScrollView: {
    flex: 1,
  },
  eventsContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  
  // Timeline Row
  timelineRow: {
    flexDirection: 'row',
    minHeight: 70,
    position: 'relative',
  },
  timelineSide: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineSideLeft: {
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timelineSideRight: {
    paddingLeft: 8,
    alignItems: 'flex-start',
  },
  
  // Timeline Center (vertical line)
  timelineCenter: {
    width: 50,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(31, 162, 166, 0.3)',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginTop: 20,
  },
  timelineDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineMinuteBadge: {
    position: 'absolute',
    top: 52,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineMinuteText: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.secondary,
  },
  
  // Event Card
  eventCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    maxWidth: '95%',
    minWidth: 120,
  },
  eventCardLeft: {
    borderLeftWidth: 3,
    borderRightWidth: 1,
  },
  eventCardRight: {
    borderRightWidth: 3,
    borderLeftWidth: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDescription: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  eventPlayer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 4,
  },
  eventPlayerRight: {
    textAlign: 'right',
  },
  eventAssist: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  eventAssistRight: {
    textAlign: 'right',
  },
  eventScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 4,
  },
  eventScoreRight: {
    textAlign: 'right',
  },
  
  // System Event (ortada gösterilir)
  systemEventOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    alignItems: 'center',
    zIndex: 2,
  },
  systemEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DARK_MODE.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  systemEventText: {
    fontSize: 11,
    fontWeight: '700',
  },
  
  // Timeline Start (altta)
  timelineStart: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  timelineStartLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(31, 162, 166, 0.3)',
  },
  timelineStartDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK_MODE.card,
    borderWidth: 2,
    borderColor: BRAND.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timelineStartText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.secondary,
  },
  timelineStartLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
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
});

export default MatchLive;
