// TacticIQ - Tahmin Zamanlama Badge Komponenti
// LOCK-FREE: Asla "Kapalı/Locked" göstermez!

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimingBadgeProps } from '../../utils/predictionTiming';

interface Props extends TimingBadgeProps {
  /** Kompakt mod - sadece emoji ve çarpan gösterir */
  compact?: boolean;
}

/**
 * Tahmin zamanlama durumunu gösteren badge
 * 
 * 🟢 Canlı tahmin (1.0x)
 * 🟡 Geç yapıldı – etki azaldı (0.5x)
 * 🔵 Olay sonrası tahmin (0.1x)
 * 
 * ❌ ASLA "Kapalı/Locked/Unavailable" göstermez!
 */
export const TimingBadge: React.FC<Props> = ({
  status,
  emoji,
  text,
  color,
  multiplier,
  compact = false,
}) => {
  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: `${color}20` }]}>
        <Text style={styles.compactEmoji}>{emoji}</Text>
        <Text style={[styles.compactMultiplier, { color }]}>
          {multiplier}x
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color }]}>{text}</Text>
        <Text style={[styles.multiplierText, { color: `${color}CC` }]}>
          Etki: {multiplier}x
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  multiplierText: {
    fontSize: 11,
    marginTop: 2,
  },
  // Kompakt stil
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  compactEmoji: {
    fontSize: 10,
  },
  compactMultiplier: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TimingBadge;
