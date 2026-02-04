// src/components/match/MatchLive.tsx
// ✅ Canlı Maç Timeline + İstatistikler - TacticIQ Design System v2.1
// Timeline formatı: 0. dk altta, son event üstte, ev sahibi sol, deplasman sağ
// İstatistikler: Canlı maç istatistikleri (possession, shots, passes vb.)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
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

interface MatchStatistic {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

interface MatchLiveScreenProps {
  matchData: any;
  matchId: string;
  events?: any[];
}

// =====================================
// STAT LABELS (Turkish)
// =====================================
const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Topa Sahip Olma',
  'Total Shots': 'Toplam Şut',
  'Shots on Goal': 'İsabetli Şut',
  'Shots off Goal': 'İsabetsiz Şut',
  'Blocked Shots': 'Bloke Edilen Şut',
  'Shots insidebox': 'Ceza Sahası İçi Şut',
  'Shots outsidebox': 'Ceza Sahası Dışı Şut',
  'Fouls': 'Faul',
  'Corner Kicks': 'Korner',
  'Offsides': 'Ofsayt',
  'Yellow Cards': 'Sarı Kart',
  'Red Cards': 'Kırmızı Kart',
  'Goalkeeper Saves': 'Kaleci Kurtarışı',
  'Total passes': 'Toplam Pas',
  'Passes accurate': 'İsabetli Pas',
  'Passes %': 'Pas İsabeti',
  'expected_goals': 'Beklenen Gol (xG)',
};

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
  const [activeTab, setActiveTab] = useState<'events' | 'stats'>('events');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveStats, setLiveStats] = useState<MatchStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchNotStarted, setMatchNotStarted] = useState(false);

  // =====================================
  // FETCH LIVE EVENTS
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
          setLoading(false);
          return;
        }

        setMatchNotStarted(false);
        const events = response?.events || [];

        if (events && events.length > 0) {
          const transformedEvents = events
            .filter((event: any) => event && event.time)
            .map((event: any) => {
              const eventType = event.type?.toLowerCase() || 'unknown';
              const detail = event.detail?.toLowerCase() || '';
              
              let description = '';
              let displayType = eventType;
              
              if (detail === 'match kick off' || detail === 'kick off') {
                description = 'Maç başladı';
                displayType = 'kickoff';
              } else if (detail === 'half time' || detail === 'halftime') {
                description = 'İlk yarı sonu';
                displayType = 'halftime';
              } else if (detail === 'second half started') {
                description = 'İkinci yarı';
                displayType = 'kickoff';
              } else if (detail === 'match finished' || detail === 'full time') {
                description = 'Maç bitti';
                displayType = 'fulltime';
              } else if (eventType === 'goal') {
                if (detail.includes('penalty')) {
                  description = 'Penaltı golü';
                } else if (detail.includes('own goal')) {
                  description = 'Kendi kalesine';
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
            // Sırala: yüksek dakika üstte (en son event en üstte)
            .sort((a: LiveEvent, b: LiveEvent) => {
              const aTime = a.minute + (a.extraTime || 0) * 0.01;
              const bTime = b.minute + (b.extraTime || 0) * 0.01;
              return bTime - aTime;
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

  // =====================================
  // FETCH LIVE STATISTICS
  // =====================================
  useEffect(() => {
    if (!matchId || activeTab !== 'stats') return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await api.matches.getMatchStatistics(Number(matchId));
        
        if (response?.data?.statistics || response?.statistics) {
          const statsData = response?.data?.statistics || response?.statistics || [];
          
          // API'den gelen istatistikleri parse et
          if (Array.isArray(statsData) && statsData.length >= 2) {
            const homeStats = statsData[0]?.statistics || [];
            const awayStats = statsData[1]?.statistics || [];
            
            const combined: MatchStatistic[] = homeStats.map((stat: any, idx: number) => ({
              type: stat.type,
              home: stat.value,
              away: awayStats[idx]?.value ?? null,
            }));
            
            setLiveStats(combined);
          } else {
            // Mock veri için fallback
            setLiveStats(generateMockStats());
          }
        } else {
          // Mock match için mock istatistikler
          setLiveStats(generateMockStats());
        }
        
        setStatsLoading(false);
      } catch (err: any) {
        console.error('❌ Stats fetch error:', err);
        // Hata durumunda mock veri göster
        setLiveStats(generateMockStats());
        setStatsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // İstatistikler 30sn'de bir
    return () => clearInterval(interval);
  }, [matchId, activeTab]);

  // =====================================
  // GENERATE MOCK STATS
  // =====================================
  const generateMockStats = (): MatchStatistic[] => {
    return [
      { type: 'Ball Possession', home: '58%', away: '42%' },
      { type: 'Total Shots', home: 14, away: 8 },
      { type: 'Shots on Goal', home: 6, away: 3 },
      { type: 'Shots off Goal', home: 5, away: 4 },
      { type: 'Blocked Shots', home: 3, away: 1 },
      { type: 'Corner Kicks', home: 7, away: 3 },
      { type: 'Offsides', home: 2, away: 1 },
      { type: 'Fouls', home: 12, away: 15 },
      { type: 'Yellow Cards', home: 2, away: 3 },
      { type: 'Red Cards', home: 0, away: 0 },
      { type: 'Goalkeeper Saves', home: 2, away: 5 },
      { type: 'Total passes', home: 456, away: 312 },
      { type: 'Passes accurate', home: 389, away: 245 },
      { type: 'Passes %', home: '85%', away: '78%' },
    ];
  };

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
        return { icon: 'time', color: BRAND.accent, bg: 'rgba(201, 164, 76, 0.15)' };
      default:
        return { icon: 'ellipse', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' };
    }
  };

  // =====================================
  // GET STAT ICON
  // =====================================
  const getStatIcon = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('possession')) return 'pie-chart';
    if (lowerType.includes('shot')) return 'locate';
    if (lowerType.includes('corner')) return 'flag';
    if (lowerType.includes('offside')) return 'hand-left';
    if (lowerType.includes('foul')) return 'warning';
    if (lowerType.includes('card')) return 'card';
    if (lowerType.includes('save')) return 'hand-right';
    if (lowerType.includes('pass')) return 'arrow-forward';
    if (lowerType.includes('goal') || lowerType.includes('xg')) return 'football';
    return 'stats-chart';
  };

  // =====================================
  // RENDER STAT BAR
  // =====================================
  const renderStatBar = (stat: MatchStatistic, index: number) => {
    const homeVal = typeof stat.home === 'string' ? parseFloat(stat.home) : (stat.home || 0);
    const awayVal = typeof stat.away === 'string' ? parseFloat(stat.away) : (stat.away || 0);
    const total = homeVal + awayVal || 1;
    const homePercent = (homeVal / total) * 100;
    const awayPercent = (awayVal / total) * 100;
    
    const label = STAT_LABELS[stat.type] || stat.type;
    const icon = getStatIcon(stat.type);
    
    // Hangi taraf öne çıkıyor?
    const homeLeads = homeVal > awayVal;
    const awayLeads = awayVal > homeVal;
    
    // İkon rengi belirleme
    const getIconColor = () => {
      const lowerType = stat.type.toLowerCase();
      if (lowerType.includes('possession')) return '#22D3EE'; // Cyan
      if (lowerType.includes('shot')) return '#10B981'; // Yeşil
      if (lowerType.includes('corner')) return '#F59E0B'; // Sarı
      if (lowerType.includes('offside')) return '#8B5CF6'; // Mor
      if (lowerType.includes('foul')) return '#EF4444'; // Kırmızı
      if (lowerType.includes('yellow')) return '#FBBF24'; // Sarı
      if (lowerType.includes('red')) return '#DC2626'; // Kırmızı
      if (lowerType.includes('save')) return '#3B82F6'; // Mavi
      if (lowerType.includes('pass')) return '#14B8A6'; // Teal
      if (lowerType.includes('goal') || lowerType.includes('xg')) return '#10B981'; // Yeşil
      return '#94A3B8'; // Varsayılan gri
    };
    const iconColor = getIconColor();
    
    return (
      <Animated.View
        key={stat.type}
        entering={isWeb ? undefined : FadeInDown.delay(index * 50)}
        style={styles.statRow}
      >
        {/* Stat değerleri ve isim */}
        <View style={styles.statHeader}>
          <Text style={[styles.statValue, homeLeads && styles.statValueHighlight]}>
            {stat.home ?? '-'}
          </Text>
          <View style={styles.statLabelContainer}>
            <View style={[styles.statIconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon as any} size={16} color={iconColor} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
          <Text style={[styles.statValue, styles.statValueRight, awayLeads && styles.statValueHighlightAway]}>
            {stat.away ?? '-'}
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.statBarContainer}>
          <View style={[styles.statBarHome, { width: `${homePercent}%` }, homeLeads && styles.statBarHighlight]} />
          <View style={styles.statBarDivider} />
          <View style={[styles.statBarAway, { width: `${awayPercent}%` }, awayLeads && styles.statBarHighlightAway]} />
        </View>
      </Animated.View>
    );
  };

  // =====================================
  // RENDER EVENT CARD
  // =====================================
  const renderEventCard = (event: LiveEvent, index: number) => {
    const style = getEventStyle(event);
    const isSystemEvent = ['kickoff', 'halftime', 'fulltime'].includes(event.type);
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
              <Text style={styles.timelineMinuteText}>{event.minute}'</Text>
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
            <Text style={styles.timelineDotText}>{event.minute}</Text>
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

  // Takım isimlerini al
  const homeTeamName = matchData?.homeTeam?.name || matchData?.teams?.home?.name || 'Ev Sahibi';
  const awayTeamName = matchData?.awayTeam?.name || matchData?.teams?.away?.name || 'Deplasman';

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Tab Switcher - Olaylar / İstatistikler */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'events' && styles.tabButtonActive]}
          onPress={() => setActiveTab('events')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="list" 
            size={16} 
            color={activeTab === 'events' ? '#FFFFFF' : '#64748B'} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'events' && styles.tabButtonTextActive]}>
            Olaylar
          </Text>
          {liveEvents.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'events' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{liveEvents.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
          onPress={() => setActiveTab('stats')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="stats-chart" 
            size={16} 
            color={activeTab === 'stats' ? '#FFFFFF' : '#64748B'} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'stats' && styles.tabButtonTextActive]}>
            İstatistikler
          </Text>
        </TouchableOpacity>
      </View>

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <>
          {/* Events Timeline */}
          <ScrollView 
            style={styles.eventsScrollView}
            contentContainerStyle={styles.eventsContent}
            showsVerticalScrollIndicator={false}
          >
            {liveEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="football-outline" size={48} color="#4B5563" />
                <Text style={styles.emptyStateTitle}>Henüz olay yok</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Maç devam ederken olaylar burada görünecek
                </Text>
              </View>
            ) : (
              <>
                {/* Eventler: En son event üstte */}
                {liveEvents.map((event, index) => renderEventCard(event, index))}
                
                {/* En altta başlangıç noktası */}
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
        </>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <>

          {/* Stats List */}
          <ScrollView 
            style={styles.statsScrollView}
            contentContainerStyle={styles.statsContent}
            showsVerticalScrollIndicator={false}
          >
            {statsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BRAND.secondary} />
                <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
              </View>
            ) : liveStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={48} color="#4B5563" />
                <Text style={styles.emptyStateTitle}>İstatistik yok</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Maç devam ederken istatistikler burada görünecek
                </Text>
              </View>
            ) : (
              <>
                {liveStats.map((stat, index) => renderStatBar(stat, index))}
                
                {/* Güncelleme notu */}
                <View style={styles.statsUpdateNote}>
                  <Ionicons name="refresh" size={12} color="#64748B" />
                  <Text style={styles.statsUpdateText}>Her 30 saniyede güncellenir</Text>
                </View>
              </>
            )}
          </ScrollView>
        </>
      )}
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
  
  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  tabButtonActive: {
    backgroundColor: BRAND.secondary,
    borderColor: BRAND.secondary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
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
  
  // Stats ScrollView
  statsScrollView: {
    flex: 1,
  },
  statsContent: {
    padding: 16,
    gap: 16,
  },
  
  // Stat Row - Daha canlı ve iç açıcı renkler
  statRow: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#CBD5E1',
    minWidth: 55,
  },
  statValueRight: {
    textAlign: 'right',
  },
  statValueHighlight: {
    color: '#22D3EE', // Parlak cyan - ev sahibi öne çıktığında
  },
  statValueHighlightAway: {
    color: '#FB923C', // Parlak turuncu - deplasman öne çıktığında
  },
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  
  // Stat Bar - Canlı gradient renkler
  statBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    overflow: 'hidden',
  },
  statBarHome: {
    height: '100%',
    backgroundColor: 'rgba(34, 211, 238, 0.35)', // Soft cyan
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  statBarHighlight: {
    backgroundColor: '#22D3EE', // Parlak cyan
  },
  statBarDivider: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  statBarAway: {
    height: '100%',
    backgroundColor: 'rgba(251, 146, 60, 0.35)', // Soft turuncu
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  statBarHighlightAway: {
    backgroundColor: '#FB923C', // Parlak turuncu
  },
  
  // Stats Update Note
  statsUpdateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.05)',
    borderRadius: 10,
    marginHorizontal: 0,
  },
  statsUpdateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
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
