import React, { useState } from 'react';
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
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../theme/theme';
import { MatchCard } from '../components/molecules';
import { Badge } from '../components/atoms';

type FilterType = 'all' | 'live' | 'upcoming' | 'finished';

interface MatchesScreenProps {
  onMatchSelect: (matchId: string) => void;
  onBack: () => void;
}

export default function MatchesScreen({ onMatchSelect, onBack }: MatchesScreenProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters: { label: string; value: FilterType; icon: string }[] = [
    { label: 'Tümü', value: 'all', icon: 'trophy' },
    { label: 'Canlı', value: 'live', icon: 'clock' },
    { label: 'Yaklaşan', value: 'upcoming', icon: 'calendar' },
    { label: 'Biten', value: 'finished', icon: 'check-circle' },
  ];

  const matches = [
    {
      id: '1',
      homeTeam: { name: 'Galatasaray', logo: '🦁', score: 2 },
      awayTeam: { name: 'Fenerbahçe', logo: '🐤', score: 1 },
      status: 'live' as const,
      competition: 'Süper Lig',
      time: '67\'',
    },
    {
      id: '2',
      homeTeam: { name: 'Beşiktaş', logo: '🦅' },
      awayTeam: { name: 'Trabzonspor', logo: '⚓' },
      status: 'upcoming' as const,
      competition: 'Süper Lig',
      time: '19:00',
      date: 'Bugün',
    },
    {
      id: '3',
      homeTeam: { name: 'Başakşehir', logo: '🔷', score: 1 },
      awayTeam: { name: 'Antalyaspor', logo: '🔴', score: 1 },
      status: 'finished' as const,
      competition: 'Süper Lig',
      date: 'Dün',
    },
  ];

  const filteredMatches = matches.filter((match) => {
    if (activeFilter === 'all') return true;
    return match.status === activeFilter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Maçlar</Text>
        <TouchableOpacity>
          <SafeIcon name="filter" size={SIZES.iconMd} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => setActiveFilter(filter.value)}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  activeFilter === filter.value ? colors.primary : colors.surface,
                borderColor: activeFilter === filter.value ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <SafeIcon
              name={filter.icon}
              size={18}
              color={activeFilter === filter.value ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                {
                  color: activeFilter === filter.value ? '#FFFFFF' : colors.text,
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Matches List */}
      <ScrollView
        contentContainerStyle={styles.matchesList}
        showsVerticalScrollIndicator={false}
      >
        {filteredMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <SafeIcon name="football-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Maç Bulunamadı
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Bu kategoride gösterilecek maç yok
            </Text>
          </View>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              {...match}
              onPress={() => onMatchSelect(match.id)}
            />
          ))
        )}
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
  title: {
    ...TYPOGRAPHY.h2,
  },
  filtersContainer: {
    maxHeight: 60,
  },
  filtersContent: {
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  filterText: {
    ...TYPOGRAPHY.bodyMediumSemibold,
  },
  matchesList: {
    padding: SPACING.base,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodyMedium,
  },
});
