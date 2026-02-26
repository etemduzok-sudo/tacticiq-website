import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import SafeIcon from '../SafeIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, SIZES, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import Card from '../atoms/Card';
import Badge from '../atoms/Badge';

interface MatchCardProps {
  homeTeam: {
    name: string;
    logo?: string;
    score?: number;
  };
  awayTeam: {
    name: string;
    logo?: string;
    score?: number;
  };
  date?: string;
  time?: string;
  status: 'live' | 'upcoming' | 'finished';
  competition?: string;
  onPress?: () => void;
}

const MatchCard = React.memo(function MatchCard({
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  competition,
  onPress,
}: MatchCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return <Badge label={t('matchCard.live')} variant="error" size="small" />;
      case 'upcoming':
        return (
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {time || date}
          </Text>
        );
      case 'finished':
        return (
          <Text style={[styles.finished, { color: colors.textSecondary }]}>
            {t('matchCard.fullTime')}
          </Text>
        );
    }
  };

  const TeamInfo = ({ team, side }: { team: typeof homeTeam; side: 'home' | 'away' }) => (
    <View style={[styles.teamContainer, side === 'away' && styles.teamContainerReverse]}>
      {team.logo ? (
        <Image source={{ uri: team.logo }} style={styles.teamLogo} />
      ) : (
        <View style={[styles.teamLogoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
          <SafeIcon name="shield" size={24} color={colors.primary} />
        </View>
      )}
      <Text
        style={[
          styles.teamName,
          { color: colors.text },
          side === 'away' && styles.teamNameRight,
        ]}
        numberOfLines={1}
      >
        {team.name}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
      <Card variant="elevated" padding="medium" style={styles.card}>
        {competition && (
          <View style={styles.competitionContainer}>
            <SafeIcon name="trophy-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.competition, { color: colors.textSecondary }]}>
              {competition}
            </Text>
          </View>
        )}

        <View style={styles.matchContent}>
          <TeamInfo team={homeTeam} side="home" />

          <View style={styles.scoreContainer}>
            {status === 'upcoming' ? (
              <View style={styles.upcomingContainer}>
                {getStatusBadge()}
              </View>
            ) : (
              <>
                <View style={styles.scoreBox}>
                  <Text style={[styles.score, { color: colors.text }]}>
                    {homeTeam.score ?? 0}
                  </Text>
                  <Text style={[styles.scoreDivider, { color: colors.textSecondary }]}>
                    -
                  </Text>
                  <Text style={[styles.score, { color: colors.text }]}>
                    {awayTeam.score ?? 0}
                  </Text>
                </View>
                {getStatusBadge()}
              </>
            )}
          </View>

          <TeamInfo team={awayTeam} side="away" />
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default MatchCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  competitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  competition: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  teamContainerReverse: {
    flexDirection: 'column-reverse',
  },
  teamLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  teamLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    textAlign: 'center',
  },
  teamNameRight: {
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  score: {
    ...TYPOGRAPHY.scoreMedium,
  },
  scoreDivider: {
    ...TYPOGRAPHY.h3,
  },
  upcomingContainer: {
    paddingVertical: SPACING.sm,
  },
  time: {
    ...TYPOGRAPHY.bodyMediumSemibold,
  },
  finished: {
    ...TYPOGRAPHY.bodySmallSemibold,
  },
});
