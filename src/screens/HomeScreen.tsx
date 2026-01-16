import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import SafeIcon from '../components/SafeIcon';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../theme/theme';
import { Card, Badge, Avatar } from '../components/atoms';
import { MatchCard } from '../components/molecules';

interface HomeScreenProps {
  onMatchSelect: (matchId: string) => void;
  onProfileClick: () => void;
}

export default function HomeScreen({ onMatchSelect, onProfileClick }: HomeScreenProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const liveMatches = [
    {
      id: '1',
      homeTeam: { name: 'Galatasaray', logo: '🦁', score: 2 },
      awayTeam: { name: 'Fenerbahçe', logo: '🐤', score: 1 },
      status: 'live' as const,
      competition: 'Süper Lig',
      time: '67\'',
    },
  ];

  const upcomingMatches = [
    {
      id: '2',
      homeTeam: { name: 'Beşiktaş', logo: '🦅' },
      awayTeam: { name: 'Trabzonspor', logo: '⚓' },
      status: 'upcoming' as const,
      competition: 'Süper Lig',
      time: '19:00',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Hoş Geldiniz
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>TacticIQ</Text>
          </View>
          <TouchableOpacity onPress={onProfileClick}>
            <View>
              <SafeIcon name="notifications-outline" size={28} color={colors.text} />
              <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Live Matches Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={[styles.liveDot, { backgroundColor: colors.live }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Canlı Maçlar
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  Tümünü Gör
                </Text>
              </TouchableOpacity>
            </View>
            {liveMatches.map((match) => (
              <MatchCard
                key={match.id}
                {...match}
                onPress={() => onMatchSelect(match.id)}
              />
            ))}
          </View>

          {/* Upcoming Matches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Yaklaşan Maçlar
              </Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  Tümünü Gör
                </Text>
              </TouchableOpacity>
            </View>
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                {...match}
                onPress={() => onMatchSelect(match.id)}
              />
            ))}
          </View>

          {/* Pro Upgrade Card - Removed for now */}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
  },
  greeting: {
    ...TYPOGRAPHY.bodyMedium,
  },
  userName: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    padding: SPACING.base,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
  },
  seeAll: {
    ...TYPOGRAPHY.bodyMediumSemibold,
  },
  proCard: {
    marginTop: SPACING.lg,
  },
  proContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
  },
  proText: {
    flex: 1,
  },
  proTitle: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  proSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
