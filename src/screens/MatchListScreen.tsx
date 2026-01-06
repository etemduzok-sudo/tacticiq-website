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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';

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
  const [selectedTeam, setSelectedTeam] = useState('all');

  const handleMatchClick = (match: any) => {
    if (match.status === 'locked') return;
    
    // Biten maçlar için özet ekranına git
    if (match.status === 'finished') {
      onMatchResultSelect(match.id);
    } else {
      // Diğer maçlar için maç detay ekranına git
      onMatchSelect(match.id);
    }
  };

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

          {/* Team Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamFilterContainer}
          >
            {teams.map((team) => {
              const isSelected = selectedTeam === team.id;
              return (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamChip,
                    isSelected && styles.teamChipSelected,
                  ]}
                  onPress={() => setSelectedTeam(team.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={isSelected ? ['#059669', '#047857'] : team.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.teamDot}
                  />
                  <Text
                    style={[
                      styles.teamName,
                      isSelected && styles.teamNameSelected,
                    ]}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Match Cards */}
        <ScrollView
          style={styles.matchList}
          contentContainerStyle={styles.matchListContent}
          showsVerticalScrollIndicator={false}
        >
          {matches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              index={index}
              onPress={() => handleMatchClick(match)}
            />
          ))}
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
  // Animated pulsing for LIVE badge
  const pulseOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (match.status === 'live') {
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
      entering={FadeInDown.delay(index * 100)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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

  // Team Filter
  teamFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E293B',
  },
  teamChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  teamNameSelected: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
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
});
