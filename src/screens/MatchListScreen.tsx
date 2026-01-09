import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavoriteTeamMatches } from '../hooks/useFavoriteTeamMatches';
import api from '../services/api';
import { AdBanner } from '../components/ads/AdBanner';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

const { width } = Dimensions.get('window');

interface MatchListScreenProps {
  onMatchSelect: (matchId: string) => void;
  onMatchResultSelect: (matchId: string) => void;
  onProfileClick: () => void;
}

const teams = [
  { id: 'all', name: 'Tümü', logo: '⚽', colors: ['#059669', '#059669'] },
  { id: 'gs', name: 'Galatasaray', logo: '🦁', colors: ['#FDB913', '#E30613'] },
  { id: 'fb', name: 'Fenerbahçe', logo: '🐤', colors: ['#FCCF1E', '#001A70'] },
  { id: 'bjk', name: 'Beşiktaş', logo: '🦅', colors: ['#000000', '#FFFFFF'] },
  { id: 'ts', name: 'Trabzonspor', logo: '⚡', colors: ['#6C2C91', '#76B0E0'] },
];

const badges = [
  { id: 'streak', icon: 'flame', label: '5 Seri', color: '#EF4444' },
  { id: 'master', icon: 'trophy', label: 'Usta', color: '#F59E0B' },
  { id: 'target', icon: 'analytics', label: '%85', color: '#059669' },
  { id: 'lightning', icon: 'flash', label: 'Hızlı', color: '#3B82F6' },
];

const matches = [
  {
    id: '2',
    status: 'finished',
    homeTeam: {
      name: 'Beşiktaş',
      logo: '🦅',
      colors: ['#000000', '#FFFFFF'],
      score: 1,
      manager: 'Şenol Güneş',
    },
    awayTeam: {
      name: 'Trabzonspor',
      logo: '⚡',
      colors: ['#6C2C91', '#76B0E0'],
      score: 1,
      manager: 'Abdullah Avcı',
    },
    league: 'Süper Lig',
    stadium: 'Vodafone Park',
    date: '26 Ara 2025',
    time: '20:00',
  },
  {
    id: '1',
    status: 'live',
    homeTeam: {
      name: 'Galatasaray',
      logo: '🦁',
      colors: ['#FDB913', '#E30613'],
      score: 2,
      manager: 'Okan Buruk',
    },
    awayTeam: {
      name: 'Fenerbahçe',
      logo: '🐤',
      colors: ['#FCCF1E', '#001A70'],
      score: 1,
      manager: 'İsmail Kartal',
    },
    league: 'Süper Lig',
    stadium: 'Ali Sami Yen',
    date: '28 Ara 2025',
    time: '19:00',
    minute: 67,
    period: '2H',
    halftimeScore: '1-0',
    referees: {
      main: 'A.Dursun',
      assistant1: 'M.Yılmaz',
      assistant2: 'E.Kaya',
      fourth: 'H.Özkan',
      var: 'C.Arslan',
    },
  },
  {
    id: '3',
    status: 'upcoming',
    homeTeam: {
      name: 'Galatasaray',
      logo: '🦁',
      colors: ['#FDB913', '#E30613'],
      score: null,
      manager: 'Okan Buruk',
    },
    awayTeam: {
      name: 'Real Madrid',
      logo: '👑',
      colors: ['#FFFFFF', '#FFD700'],
      score: null,
      manager: 'Carlo Ancelotti',
    },
    league: 'Şampiyonlar Ligi',
    stadium: 'Ali Sami Yen',
    date: '8 Oca 2026',
    time: '22:45',
    countdown: '8 gün',
  },
  {
    id: '4',
    status: 'locked',
    homeTeam: {
      name: 'Barcelona',
      logo: '🔵',
      colors: ['#A50044', '#004D98'],
      score: null,
      manager: 'Xavi Hernandez',
    },
    awayTeam: {
      name: 'Bayern Munich',
      logo: '🔴',
      colors: ['#DC052D', '#0066B2'],
      score: null,
      manager: 'Thomas Tuchel',
    },
    league: 'Şampiyonlar Ligi',
    stadium: 'Camp Nou',
    date: '15 Oca 2026',
    time: '22:45',
    unlockText: '1 hafta kala aktif',
  },
];

export const MatchListScreen: React.FC<MatchListScreenProps> = ({
  onMatchSelect,
  onMatchResultSelect,
  onProfileClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'past' | 'live' | 'upcoming'>('live');
  
  // Fetch favorite team matches (past, live, upcoming)
  const { pastMatches, liveMatches, upcomingMatches, loading, error } = useFavoriteTeamMatches();

  // Transform API data to component format
  const transformMatch = (apiMatch: any) => {
    const isLive = api.utils.isMatchLive(apiMatch.fixture.status.short);
    const isFinished = api.utils.isMatchFinished(apiMatch.fixture.status.short);
    
    return {
      id: apiMatch.fixture.id.toString(),
      status: isLive ? 'live' : isFinished ? 'finished' : 'upcoming',
      homeTeam: {
        name: apiMatch.teams.home.name,
        logo: apiMatch.teams.home.logo || '⚽',
        colors: ['#059669', '#059669'], // Default colors
        score: apiMatch.goals.home || 0,
        manager: 'TBA',
      },
      awayTeam: {
        name: apiMatch.teams.away.name,
        logo: apiMatch.teams.away.logo || '⚽',
        colors: ['#F59E0B', '#F59E0B'], // Default colors
        score: apiMatch.goals.away || 0,
        manager: 'TBA',
      },
      league: apiMatch.league.name,
      stadium: apiMatch.fixture.venue?.name || 'TBA',
      date: new Date(apiMatch.fixture.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: api.utils.formatMatchTime(apiMatch.fixture.timestamp),
      minute: apiMatch.fixture.status.elapsed || 0,
      period: apiMatch.fixture.status.short,
      halftimeScore: `${apiMatch.score?.halftime?.home || 0}-${apiMatch.score?.halftime?.away || 0}`,
    };
  };

  // Get matches based on selected category
  const getCurrentMatches = () => {
    switch (selectedCategory) {
      case 'past':
        return pastMatches.map(transformMatch);
      case 'live':
        return liveMatches.map(transformMatch);
      case 'upcoming':
        return upcomingMatches.map(transformMatch);
      default:
        return [];
    }
  };

  const allMatches = getCurrentMatches();

  const handleMatchClick = (match: any) => {
    if (match.status === 'locked') return;
    
    // match zaten transform edilmiş, fixture yok
    const matchStatus = match.status;
    
    // Biten maçlar için özet ekranına git
    if (matchStatus === 'finished') {
      onMatchResultSelect(match.id);
    } else {
      // Diğer maçlar için maç detay ekranına git
      onMatchSelect(match.id);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Veriler yüklenemedi</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sticky Profile Header */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfileClick}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(5, 150, 105, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileContent}>
                <View style={styles.profileLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>FM</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName}>Futbol Aşığı</Text>
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    </View>
                    <Text style={styles.profileStats}>Level 12 • 2,845 Puan</Text>
                  </View>
                </View>
                <View style={styles.profileRight}>
                  <Text style={styles.rankingLabel}>Türkiye Sıralaması</Text>
                  <Text style={styles.rankingValue}>#156 / 2,365</Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgesContainer}>
                {badges.map((badge) => (
                  <View
                    key={badge.id}
                    style={[
                      styles.badge,
                      {
                        borderColor: `${badge.color}30`,
                        backgroundColor: `${badge.color}10`,
                      },
                    ]}
                  >
                    <Ionicons name={badge.icon as any} size={12} color={badge.color} />
                    <Text style={[styles.badgeLabel, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Category Filter (Geçmiş/Canlı/Gelecek) */}
          <View style={styles.categoryFilterContainer}>
            {[
              { id: 'past', label: `Geçmiş (${pastMatches.length})`, icon: 'time-outline' },
              { id: 'live', label: `Canlı (${liveMatches.length})`, icon: 'radio-outline' },
              { id: 'upcoming', label: `Gelecek (${upcomingMatches.length})`, icon: 'calendar-outline' },
            ].map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id as 'past' | 'live' | 'upcoming')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : '#9CA3AF'} 
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Match Cards */}
        <ScrollView
          style={styles.matchList}
          contentContainerStyle={styles.matchListContent}
          showsVerticalScrollIndicator={false}
        >
          {allMatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="football-outline" size={64} color="#64748B" />
              <Text style={styles.emptyText}>Bugün maç bulunamadı</Text>
              <Text style={styles.emptySubtext}>Yakında maçlar burada görünecek</Text>
            </View>
          ) : (
            allMatches.map((match, index) => (
              <React.Fragment key={match.id}>
                <MatchCard
                  match={match}
                  index={index}
                  onPress={() => handleMatchClick(match)}
                />
                {/* Show ad after every 5 matches */}
                {(index + 1) % 5 === 0 && (
                  <View style={styles.adContainer}>
                    <AdBanner position="bottom" />
                  </View>
                )}
              </React.Fragment>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Match Card Component
interface MatchCardProps {
  match: any;
  index: number;
  onPress: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, index, onPress }) => {
  // Animated pulsing for LIVE badge (disabled on web)
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (!isWeb && match.status === 'live') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 750 }),
          withTiming(1, { duration: 750 })
        ),
        -1,
        false
      );
    }
  }, [match.status]);

  const liveBadgeStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      entering={isWeb ? undefined : FadeInDown.delay(index * 100)}
      style={styles.matchCard}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={match.status === 'locked'}
        activeOpacity={0.7}
      >
        {/* League Badge */}
        <LinearGradient
          colors={['rgba(5, 150, 105, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leagueBadge}
        >
          <Ionicons name="trophy" size={14} color="#059669" />
          <Text style={styles.leagueText}>{match.league}</Text>
        </LinearGradient>

        {/* Match Content */}
        <View style={styles.matchContent}>
          {/* Home Team Color Bar */}
          <LinearGradient
            colors={match.homeTeam.colors}
            style={[styles.colorBar, styles.colorBarLeft]}
          />

          {/* Away Team Color Bar */}
          <LinearGradient
            colors={match.awayTeam.colors}
            style={[styles.colorBar, styles.colorBarRight]}
          />

          {match.status === 'live' ? (
            <LiveMatchContent match={match} liveBadgeStyle={liveBadgeStyle} />
          ) : match.status === 'finished' ? (
            <FinishedMatchContent match={match} />
          ) : (
            <UpcomingMatchContent match={match} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Live Match Content
const LiveMatchContent: React.FC<{ match: any; liveBadgeStyle: any }> = ({
  match,
  liveBadgeStyle,
}) => (
  <View style={styles.liveContainer}>
    {/* LIVE Badge */}
    <View style={styles.liveBadgeContainer}>
      <Animated.View style={[styles.liveBadge, liveBadgeStyle]}>
        <Text style={styles.liveBadgeText}>CANLI</Text>
      </Animated.View>
    </View>

    {/* Teams + Scores */}
    <View style={styles.teamsRow}>
      {/* Home Team */}
      <View style={styles.teamColumn}>
        <Text style={styles.teamNameLive}>{match.homeTeam.name}</Text>
        <Text style={styles.managerName}>{match.homeTeam.manager}</Text>
        <Text style={styles.scoreLive}>{match.homeTeam.score}</Text>
      </View>

      {/* Center: Minute */}
      <View style={styles.centerColumn}>
        <Text style={styles.liveMinute}>{match.minute}'</Text>
        <Text style={styles.separator}>-</Text>
        {match.halftimeScore && (
          <Text style={styles.halftimeScore}>HT: {match.halftimeScore}</Text>
        )}
      </View>

      {/* Away Team */}
      <View style={styles.teamColumn}>
        <Text style={styles.teamNameLive}>{match.awayTeam.name}</Text>
        <Text style={styles.managerName}>{match.awayTeam.manager}</Text>
        <Text style={styles.scoreLive}>{match.awayTeam.score}</Text>
      </View>
    </View>

    {/* Match Info */}
    <View style={styles.matchInfoRow}>
      <View style={styles.matchInfoItem}>
        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.date}</Text>
      </View>
      <View style={styles.matchInfoDivider} />
      <View style={styles.matchInfoItem}>
        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.time}</Text>
      </View>
      <View style={styles.matchInfoDivider} />
      <View style={styles.matchInfoItem}>
        <Ionicons name="location-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.stadium}</Text>
      </View>
    </View>

    {/* Referee Info */}
    {match.referees && (
      <View style={styles.refereeRow}>
        <Text style={styles.refereeText}>Hakem:</Text>
        <Text style={styles.refereeMain}>{match.referees.main}</Text>
        <Text style={styles.refereeSeparator}>•</Text>
        <Text style={styles.refereeText}>VAR: {match.referees.var}</Text>
      </View>
    )}
  </View>
);

// Finished Match Content
const FinishedMatchContent: React.FC<{ match: any }> = ({ match }) => (
  <View style={styles.finishedContainer}>
    {/* Status */}
    <Text style={styles.finishedStatus}>Maç Sonu</Text>

    {/* Teams + Scores */}
    <View style={styles.teamsRow}>
      {/* Home Team */}
      <View style={styles.teamColumn}>
        <Text style={styles.teamNameFinished}>{match.homeTeam.name}</Text>
        <Text style={styles.managerName}>{match.homeTeam.manager}</Text>
        <Text style={styles.scoreFinished}>{match.homeTeam.score}</Text>
      </View>

      {/* Center: Separator */}
      <View style={styles.centerColumnFinished}>
        <Text style={styles.separatorFinished}>-</Text>
      </View>

      {/* Away Team */}
      <View style={styles.teamColumn}>
        <Text style={styles.teamNameFinished}>{match.awayTeam.name}</Text>
        <Text style={styles.managerName}>{match.awayTeam.manager}</Text>
        <Text style={styles.scoreFinished}>{match.awayTeam.score}</Text>
      </View>
    </View>

    {/* Match Info */}
    <View style={styles.matchInfoRow}>
      <View style={styles.matchInfoItem}>
        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.date}</Text>
      </View>
      <View style={styles.matchInfoDivider} />
      <View style={styles.matchInfoItem}>
        <Ionicons name="time-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.time}</Text>
      </View>
      <View style={styles.matchInfoDivider} />
      <View style={styles.matchInfoItem}>
        <Ionicons name="location-outline" size={12} color="#9CA3AF" />
        <Text style={styles.matchInfoText}>{match.stadium}</Text>
      </View>
    </View>
  </View>
);

// Upcoming Match Content
const UpcomingMatchContent: React.FC<{ match: any }> = ({ match }) => (
  <View style={styles.upcomingContainer}>
    <View style={styles.upcomingRow}>
      {/* Home Team */}
      <View style={styles.upcomingTeam}>
        <Text style={styles.upcomingTeamName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
        <Text style={styles.upcomingManager} numberOfLines={1}>
          {match.homeTeam.manager}
        </Text>
      </View>

      {/* Center Details */}
      <View style={styles.upcomingCenter}>
        <Text style={styles.upcomingVs}>VS</Text>

        <View style={styles.upcomingInfo}>
          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
          <Text style={styles.upcomingInfoText}>{match.date}</Text>
        </View>

        <View style={styles.upcomingInfo}>
          <Ionicons name="time-outline" size={12} color="#9CA3AF" />
          <Text style={styles.upcomingInfoText}>{match.time}</Text>
        </View>

        <View style={styles.upcomingInfo}>
          <Ionicons name="location-outline" size={12} color="#9CA3AF" />
          <Text style={styles.upcomingInfoText} numberOfLines={1}>
            {match.stadium}
          </Text>
        </View>

        {match.status === 'upcoming' && match.countdown && (
          <View style={styles.countdown}>
            <Ionicons name="star" size={12} color="#059669" />
            <Text style={styles.countdownText}>{match.countdown}</Text>
          </View>
        )}

        {match.status === 'locked' && (
          <View style={styles.locked}>
            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
            <Text style={styles.lockedText}>{match.unlockText}</Text>
          </View>
        )}
      </View>

      {/* Away Team */}
      <View style={styles.upcomingTeam}>
        <Text style={styles.upcomingTeamName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
        <Text style={styles.upcomingManager} numberOfLines={1}>
          {match.awayTeam.manager}
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Sticky Header
  stickyHeader: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },

  // Profile Button
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileGradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileStats: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileRight: {
    alignItems: 'flex-end',
  },
  rankingLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rankingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },

  // Badges
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Category Filter (Geçmiş/Canlı/Gelecek)
  categoryFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  categoryChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },

  // Match List
  matchList: {
    flex: 1,
  },
  matchListContent: {
    padding: 16,
    gap: 16,
  },

  // Match Card
  matchCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },

  // League Badge
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  leagueText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Match Content
  matchContent: {
    position: 'relative',
    padding: 16,
  },

  // Color Bars
  colorBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    borderRadius: 3,
  },
  colorBarLeft: {
    left: 0,
  },
  colorBarRight: {
    right: 0,
  },

  // Live Match
  liveContainer: {
    gap: 12,
  },
  liveBadgeContainer: {
    alignItems: 'center',
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#059669',
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamNameLive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  teamNameFinished: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  managerName: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scoreLive: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreFinished: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  centerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  centerColumnFinished: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  liveMinute: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  separator: {
    fontSize: 20,
    fontWeight: '900',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  separatorFinished: {
    fontSize: 20,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  halftimeScore: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  matchInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  matchInfoDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refereeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 8,
  },
  refereeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  refereeMain: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  refereeSeparator: {
    fontSize: 12,
    color: '#64748B',
  },

  // Finished Match
  finishedContainer: {
    gap: 12,
  },
  finishedStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Upcoming Match
  upcomingContainer: {
    paddingHorizontal: 8,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  upcomingTeam: {
    flex: 1,
    alignItems: 'center',
  },
  upcomingTeamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  upcomingManager: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  upcomingCenter: {
    alignItems: 'center',
    gap: 4,
  },
  upcomingVs: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  upcomingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lockedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Loading & Error States
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Ad Container
  adContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
