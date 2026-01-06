import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/theme';
import Card from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '../types';

type MatchListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    homeTeam: { name: 'Manchester United', logo: '🔴', score: 2 },
    awayTeam: { name: 'Liverpool', logo: '🔴', score: 1 },
    date: '2026-01-04',
    time: '16:30',
    status: 'live',
    league: 'Premier League',
    minute: 67,
  },
  {
    id: '2',
    homeTeam: { name: 'Real Madrid', logo: '⚪' },
    awayTeam: { name: 'Barcelona', logo: '🔵' },
    date: '2026-01-04',
    time: '21:00',
    status: 'upcoming',
    league: 'La Liga',
  },
  {
    id: '3',
    homeTeam: { name: 'Bayern München', logo: '🔴', score: 3 },
    awayTeam: { name: 'Borussia Dortmund', logo: '🟡', score: 3 },
    date: '2026-01-04',
    time: '14:30',
    status: 'finished',
    league: 'Bundesliga',
  },
];

export default function MatchList() {
  const navigation = useNavigation<MatchListNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredMatches = selectedFilter === 'all' 
    ? MOCK_MATCHES 
    : MOCK_MATCHES.filter(m => m.status === selectedFilter);

  const handleMatchPress = (matchId: string) => {
    navigation.navigate('MatchDetail', { matchId });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Maçlar</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {[
          { key: 'all', label: 'Tümü' },
          { key: 'live', label: 'Canlı' },
          { key: 'upcoming', label: 'Gelecek' },
          { key: 'finished', label: 'Biten' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === filter.key ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedFilter === filter.key ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Match List */}
      <ScrollView
        style={styles.matchList}
        contentContainerStyle={styles.matchListContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredMatches.map((match) => (
          <TouchableOpacity
            key={match.id}
            onPress={() => handleMatchPress(match.id)}
            activeOpacity={0.7}
          >
            <Card variant="elevated" style={styles.matchCard}>
              {/* League & Status */}
              <View style={styles.matchHeader}>
                <Text style={[styles.leagueText, { color: colors.textSecondary }]}>
                  {match.league}
                </Text>
                {match.status === 'live' && (
                  <View style={[styles.liveBadge, { backgroundColor: colors.error }]}>
                    <Text style={styles.liveBadgeText}>CANLI • {match.minute}'</Text>
                  </View>
                )}
              </View>

              {/* Teams */}
              <View style={styles.teamsContainer}>
                {/* Home Team */}
                <View style={styles.team}>
                  <Text style={styles.teamLogo}>{match.homeTeam.logo}</Text>
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {match.homeTeam.name}
                  </Text>
                </View>

                {/* Score or Time */}
                <View style={styles.scoreContainer}>
                  {match.status === 'upcoming' ? (
                    <Text style={[styles.matchTime, { color: colors.textSecondary }]}>
                      {match.time}
                    </Text>
                  ) : (
                    <View style={styles.score}>
                      <Text style={[styles.scoreText, { color: colors.text }]}>
                        {match.homeTeam.score}
                      </Text>
                      <Text style={[styles.scoreSeparator, { color: colors.textSecondary }]}>
                        -
                      </Text>
                      <Text style={[styles.scoreText, { color: colors.text }]}>
                        {match.awayTeam.score}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Away Team */}
                <View style={styles.team}>
                  <Text style={styles.teamLogo}>{match.awayTeam.logo}</Text>
                  <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
                    {match.awayTeam.name}
                  </Text>
                </View>
              </View>

              {/* Match Date */}
              <Text style={[styles.matchDate, { color: colors.textSecondary }]}>
                {new Date(match.date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  filtersContainer: {
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  filterText: {
    ...TYPOGRAPHY.captionMedium,
  },
  matchList: {
    flex: 1,
  },
  matchListContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  matchCard: {
    marginBottom: SPACING.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  leagueText: {
    ...TYPOGRAPHY.caption,
  },
  liveBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    ...TYPOGRAPHY.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  teamName: {
    ...TYPOGRAPHY.captionMedium,
    textAlign: 'center',
  },
  scoreContainer: {
    marginHorizontal: SPACING.md,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreText: {
    ...TYPOGRAPHY.h1,
  },
  scoreSeparator: {
    ...TYPOGRAPHY.h2,
  },
  matchTime: {
    ...TYPOGRAPHY.h3,
  },
  matchDate: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
});
