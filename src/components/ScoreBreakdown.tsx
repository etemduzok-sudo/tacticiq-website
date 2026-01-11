// ScoreBreakdown.tsx - Puanlama Şeffaflığı Komponenti
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

interface ScoreBreakdownProps {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  strategicFocus?: string;
  breakdown: Array<{
    category: string;
    points: number;
    icon: string;
  }>;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  basePoints,
  bonusPoints,
  totalPoints,
  strategicFocus,
  breakdown,
}) => {
  const bonusPercentage = ((bonusPoints / basePoints) * 100).toFixed(0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <Ionicons name="analytics" size={24} color="#059669" />
        <Text style={styles.headerTitle}>Puan Dağılımı</Text>
      </Animated.View>

      {/* Breakdown Items */}
      <View style={styles.breakdownList}>
        {breakdown.map((item, index) => (
          <Animated.View
            key={item.category}
            entering={FadeInDown.delay(200 + index * 50).springify()}
            style={styles.breakdownItem}
          >
            <View style={styles.breakdownLeft}>
              <Ionicons name={item.icon as any} size={18} color="#94A3B8" />
              <Text style={styles.breakdownCategory}>{item.category}</Text>
            </View>
            <Text style={styles.breakdownPoints}>+{item.points}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Base Points */}
      <Animated.View
        entering={FadeInDown.delay(400).springify()}
        style={styles.subtotalRow}
      >
        <Text style={styles.subtotalLabel}>Temel Puan</Text>
        <Text style={styles.subtotalValue}>{basePoints}</Text>
      </Animated.View>

      {/* Strategic Focus Bonus */}
      {strategicFocus && bonusPoints > 0 && (
        <Animated.View
          entering={ZoomIn.delay(500).springify()}
          style={styles.bonusContainer}
        >
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
            style={styles.bonusGradient}
          >
            <View style={styles.bonusHeader}>
              <View style={styles.bonusIcon}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
              </View>
              <View style={styles.bonusTextContainer}>
                <Text style={styles.bonusTitle}>Stratejik Odak Bonusu</Text>
                <Text style={styles.bonusSubtitle}>{strategicFocus}</Text>
              </View>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>+{bonusPercentage}%</Text>
              </View>
            </View>
            <View style={styles.bonusPoints}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.bonusPointsText}>+{bonusPoints} Bonus Puan</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Total Points */}
      <Animated.View
        entering={ZoomIn.delay(600).springify()}
        style={styles.totalContainer}
      >
        <LinearGradient
          colors={['#059669', '#047857']}
          style={styles.totalGradient}
        >
          <Text style={styles.totalLabel}>Toplam Puan</Text>
          <Text style={styles.totalValue}>{totalPoints}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Bonus Applied Badge */}
      {bonusPoints > 0 && (
        <Animated.View
          entering={ZoomIn.delay(700).springify()}
          style={styles.appliedBadge}
        >
          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          <Text style={styles.appliedBadgeText}>✨ Bonus Uygulandı!</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  breakdownList: {
    gap: 12,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownCategory: {
    fontSize: 14,
    color: '#94A3B8',
  },
  breakdownPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 16,
  },
  subtotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  bonusContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bonusGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  bonusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTextContainer: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  bonusSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bonusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bonusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  bonusPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bonusPointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  totalContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  totalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  appliedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
  },
});
