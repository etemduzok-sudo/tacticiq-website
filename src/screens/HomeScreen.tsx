import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import SafeIcon from '../components/SafeIcon';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../theme/theme';
import { MatchCard } from '../components/molecules';
import api from '../services/api';

interface HomeScreenProps {
  onMatchSelect: (matchId: string) => void;
  onProfileClick: () => void;
}

export default function HomeScreen({ onMatchSelect, onProfileClick }: HomeScreenProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.getMatchesByDate(today);
      const matches = response?.data || response?.matches || [];

      const live: any[] = [];
      const upcoming: any[] = [];

      matches.forEach((match: any) => {
        const status = match?.fixture?.status?.short || match?.status;
        const transformed = {
          id: String(match?.fixture?.id || match?.id),
          homeTeam: {
            name: match?.teams?.home?.name || match?.home_team?.name || '?',
            logo: match?.teams?.home?.logo || match?.home_team?.logo || '',
            score: match?.goals?.home ?? match?.home_score ?? undefined,
          },
          awayTeam: {
            name: match?.teams?.away?.name || match?.away_team?.name || '?',
            logo: match?.teams?.away?.logo || match?.away_team?.logo || '',
            score: match?.goals?.away ?? match?.away_score ?? undefined,
          },
          competition: match?.league?.name || '',
          status: ['1H', '2H', 'HT', 'LIVE', 'ET', 'P', 'BT'].includes(status) ? 'live' as const
            : status === 'NS' ? 'upcoming' as const
            : 'finished' as const,
          time: match?.fixture?.status?.elapsed
            ? `${match.fixture.status.elapsed}'`
            : match?.fixture?.date
              ? new Date(match.fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              : '',
        };

        if (transformed.status === 'live') live.push(transformed);
        else if (transformed.status === 'upcoming') upcoming.push(transformed);
      });

      setLiveMatches(live);
      setUpcomingMatches(upcoming.slice(0, 5));
    } catch (error) {
      // API bağlantısı yoksa boş state göster
      setLiveMatches([]);
      setUpcomingMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hoş Geldiniz</Text>
            <Text style={[styles.userName, { color: colors.text }]}>TacticIQ</Text>
          </View>
          <TouchableOpacity onPress={onProfileClick}>
            <SafeIcon name="notifications-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Maçlar yükleniyor...</Text>
            </View>
          ) : (
            <>
              {/* Live Matches */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <View style={[styles.liveDot, { backgroundColor: colors.live || '#EF4444' }]} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Canlı Maçlar</Text>
                  </View>
                </View>
                {liveMatches.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Şu an canlı maç yok</Text>
                  </View>
                ) : (
                  liveMatches.map((match) => (
                    <MatchCard key={match.id} {...match} onPress={() => onMatchSelect(match.id)} />
                  ))
                )}
              </View>

              {/* Upcoming Matches */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Yaklaşan Maçlar</Text>
                </View>
                {upcomingMatches.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Bugün yaklaşan maç yok</Text>
                  </View>
                ) : (
                  upcomingMatches.map((match) => (
                    <MatchCard key={match.id} {...match} onPress={() => onMatchSelect(match.id)} />
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
  },
  greeting: { ...TYPOGRAPHY.bodyMedium },
  userName: { ...TYPOGRAPHY.h3, marginTop: SPACING.xs },
  content: { padding: SPACING.base },
  section: { marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { ...TYPOGRAPHY.h3 },
  loadingContainer: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  loadingText: { ...TYPOGRAPHY.bodyMedium, marginTop: SPACING.base },
  emptyCard: {
    padding: SPACING.lg,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { ...TYPOGRAPHY.bodyMedium },
});
