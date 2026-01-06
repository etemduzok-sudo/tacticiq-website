import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SafeIcon from '../components/SafeIcon';
import { BRAND, TYPOGRAPHY, SPACING, DARK_MODE, OPACITY } from '../theme/theme';
import { MATCH_HEADER_GRADIENT } from '../theme/gradients';

interface Goal {
  minute: number;
  player: string;
  type: 'home' | 'away';
}

interface Stat {
  label: string;
  home: number;
  away: number;
}

const { width, height } = Dimensions.get('window');

interface MatchDetailScreenProps {
  matchId: string;
  onBack: () => void;
}

export default function MatchDetailScreen({ matchId, onBack }: MatchDetailScreenProps) {
  // Mock data - gerçek uygulamada API'den gelecek
  const match = {
    homeTeam: 'Galatasaray',
    awayTeam: 'Fenerbahçe',
    homeScore: 2,
    awayScore: 1,
    date: '15 Ocak 2026',
    time: '19:00',
    venue: 'Rams Park',
    status: 'Bitti',
  };

  const goals: Goal[] = [
    { minute: 23, player: 'Icardi', type: 'home' },
    { minute: 67, player: 'Dzeko', type: 'away' },
    { minute: 89, player: 'Zaha', type: 'home' },
  ];

  const stats: Stat[] = [
    { label: 'Toplam Şut', home: 15, away: 12 },
    { label: 'İsabetli Şut', home: 7, away: 5 },
    { label: 'Pas Yüzdesi', home: 78, away: 74 },
    { label: 'Top Hakimiyeti', home: 58, away: 42 },
    { label: 'Korner', home: 6, away: 4 },
    { label: 'Faul', home: 11, away: 14 },
  ];

  return (
    <View style={styles.modalContainer}>
      {/* Backdrop with Blur */}
      <View style={styles.backdrop} />

      {/* Modal Content */}
      <View style={styles.modalContent}>
        {/* Header with Gradient */}
        <LinearGradient
          {...MATCH_HEADER_GRADIENT} // Design System compliant
          style={styles.headerGradient}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.9}
          >
            <SafeIcon name="close" size={24} color={DARK_MODE.foreground} />
          </TouchableOpacity>

          {/* Match Info */}
          <View style={styles.matchHeader}>
            <Text style={styles.matchDate}>{match.date}</Text>
            <Text style={styles.matchTime}>{match.time}</Text>
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.teamSection}>
              <Text style={styles.teamName}>{match.homeTeam}</Text>
              <Text style={styles.score}>{match.homeScore}</Text>
            </View>

            <View style={styles.scoreDivider}>
              <Text style={styles.vsText}>-</Text>
            </View>

            <View style={styles.teamSection}>
              <Text style={styles.teamName}>{match.awayTeam}</Text>
              <Text style={styles.score}>{match.awayScore}</Text>
            </View>
          </View>

          <View style={styles.venueContainer}>
            <SafeIcon name="location" size={14} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.venueText}>{match.venue}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{match.status}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Goals Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goller</Text>

            {goals.map((goal, index) => (
              <View
                key={index}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor:
                      goal.type === 'home'
                        ? `rgba(5, 150, 105, ${OPACITY[10]})` // bg-[#059669]/10 - Design System
                        : `rgba(245, 158, 11, ${OPACITY[10]})`, // bg-[#F59E0B]/10 - Design System
                    borderColor:
                      goal.type === 'home'
                        ? BRAND.emerald // Solid renk
                        : BRAND.gold, // Solid renk
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={styles.goalMinuteBadge}>
                  <Text style={styles.goalMinuteText}>{goal.minute}'</Text>
                </View>
                <Text style={styles.goalPlayerName}>{goal.player}</Text>
                <SafeIcon name="football" size={18} color={BRAND.white} />
              </View>
            ))}
          </View>

          {/* Statistics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>

            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statRow}>
                  <Text style={styles.statValue}>{stat.home}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.away}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.statBar}>
                  <View
                    style={[
                      styles.statBarHome,
                      {
                        width: `${(stat.home / (stat.home + stat.away)) * 100}%`,
                        backgroundColor: BRAND.emerald,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.statBarAway,
                      {
                        width: `${(stat.away / (stat.home + stat.away)) * 100}%`,
                        backgroundColor: BRAND.gold,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Substitutions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Değişiklikler</Text>

            <View style={styles.substitutionCard}>
              <View style={styles.substitutionRow}>
                <SafeIcon name="arrow-up" size={16} color={BRAND.emerald} />
                <Text style={styles.substitutionPlayer}>Mertens</Text>
                <SafeIcon name="arrow-down" size={16} color="#d4183d" />
                <Text style={styles.substitutionPlayer}>Torreira</Text>
                <Text style={styles.substitutionMinute}>72'</Text>
              </View>
            </View>

            <View style={styles.substitutionCard}>
              <View style={styles.substitutionRow}>
                <SafeIcon name="arrow-up" size={16} color={BRAND.emerald} />
                <Text style={styles.substitutionPlayer}>Batshuayi</Text>
                <SafeIcon name="arrow-down" size={16} color="#d4183d" />
                <Text style={styles.substitutionPlayer}>Valencia</Text>
                <Text style={styles.substitutionMinute}>80'</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // bg-black/60
    // Not: React Native'de backdrop-blur-sm için 'BlurView' component kullanılması gerekir
    // Şimdilik temel backdrop ile devam ediyorum
  },
  modalContent: {
    height: height * 0.9,
    backgroundColor: DARK_MODE.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // bg-white/90
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  matchHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  matchDate: {
    ...TYPOGRAPHY.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)', // text-white/80
    marginBottom: SPACING.xs,
  },
  matchTime: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)', // text-white/80
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    ...TYPOGRAPHY.h4,
    color: BRAND.white,
    opacity: 0.9, // opacity-90
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: BRAND.white,
  },
  scoreDivider: {
    marginHorizontal: SPACING.lg,
  },
  vsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BRAND.white,
    opacity: 0.5,
  },
  venueContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  venueText: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)', // text-white/80
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 12,
    marginLeft: SPACING.sm,
  },
  statusText: {
    ...TYPOGRAPHY.bodySmall,
    color: BRAND.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: BRAND.white,
    marginBottom: SPACING.md,
    fontWeight: 'bold',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  goalMinuteBadge: {
    backgroundColor: BRAND.emerald,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 8,
  },
  goalMinuteText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: BRAND.white,
  },
  goalPlayerName: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    color: BRAND.white,
    flex: 1,
  },
  statCard: {
    backgroundColor: 'rgba(158, 158, 168, 0.4)', // bg-muted/40
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: BRAND.white,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
  },
  statLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: DARK_MODE.mutedForeground,
    flex: 1,
    textAlign: 'center',
  },
  statBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: DARK_MODE.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarHome: {
    height: 4,
  },
  statBarAway: {
    height: 4,
  },
  substitutionCard: {
    backgroundColor: 'rgba(158, 158, 168, 0.3)', // bg-muted/30
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  substitutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  substitutionPlayer: {
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    flex: 1,
  },
  substitutionMinute: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: DARK_MODE.mutedForeground,
  },
});
