import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import SafeIcon from '../SafeIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';
import Card from '../atoms/Card';
import { formatPlayerDisplayName } from '../../utils/playerNameUtils';

interface PlayerCardProps {
  player: {
    name: string;
    firstname?: string | null;
    lastname?: string | null;
    number: number;
    position: string;
    photo?: string;
  };
  stats?: {
    label: string;
    value: string | number;
  }[];
  onPress?: () => void;
  compact?: boolean;
}

const PlayerCard = React.memo(function PlayerCard({ player, stats, onPress, compact = false }: PlayerCardProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
      <Card variant="outlined" padding={compact ? 'small' : 'medium'}>
        <View style={styles.container}>
          <View style={styles.playerInfo}>
            {player.photo ? (
              <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
            ) : (
              <View style={[styles.playerPhotoPlaceholder, { backgroundColor: colors.surfaceLight }]}>
                <SafeIcon name="person" size={24} color={colors.textSecondary} />
              </View>
            )}

            <View style={styles.playerDetails}>
              <View style={styles.nameRow}>
                <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.numberText}>{player.number}</Text>
                </View>
                <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>
                  {formatPlayerDisplayName(player)}
                </Text>
              </View>
              <Text style={[styles.position, { color: colors.textSecondary }]}>
                {player.position}
              </Text>
            </View>
          </View>

          {stats && stats.length > 0 && (
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default PlayerCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  playerPhoto: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    resizeMode: 'cover',
  },
  playerPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerDetails: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: '#FFFFFF',
  },
  playerName: {
    ...TYPOGRAPHY.bodyLargeSemibold,
    flex: 1,
  },
  position: {
    ...TYPOGRAPHY.bodySmall,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 40,
  },
  statValue: {
    ...TYPOGRAPHY.h4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
});
