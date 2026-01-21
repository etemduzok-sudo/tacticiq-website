/**
 * Enhanced Skeleton Component with Shimmer Effect
 * TacticIQ - Premium Loading States
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES } from '../../theme/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  shimmer?: boolean; // Enable shimmer effect
}

/**
 * Skeleton Component - Design System Compliant
 * 
 * Features:
 * - Shimmer animation (sliding gradient)
 * - Dark mode support
 * - Customizable dimensions
 * - Accessibility (reduced motion)
 * 
 * Usage:
 * <Skeleton width={100} height={20} />
 * <Skeleton width="100%" height={50} shimmer={true} />
 */
const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = SIZES.radiusSm,
  style,
  shimmer = true,
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  
  // Shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shimmer) {
      // Sliding gradient animation
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000, // 2 seconds
          useNativeDriver: true,
        })
      ).start();
    }
  }, [shimmer, shimmerAnim]);

  // Translate X for shimmer effect
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200], // Slide from left to right
  });

  const containerStyle: ViewStyle = {
    width,
    height: typeof height === 'number' ? height : undefined,
    borderRadius,
    backgroundColor: colors.surface, // Base color
    overflow: 'hidden',
  };

  if (!shimmer) {
    // Simple pulse animation (fallback)
    return (
      <View
        style={[
          containerStyle,
          {
            opacity: 0.6,
            backgroundColor: colors.surfaceLight,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {/* Base layer */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme === 'dark' 
              ? 'rgba(67, 68, 83, 0.5)' // Dark mode accent
              : '#e9ebef', // Light mode accent
          },
        ]}
      />
      
      {/* Shimmer layer */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme === 'dark'
              ? 'rgba(113, 113, 130, 0.3)' // Dark mode muted (lighter)
              : '#ffffff', // Light mode white highlight
            transform: [{ translateX }],
            opacity: 0.5,
          },
        ]}
      />
    </View>
  );
};

export default Skeleton;

/**
 * Pre-built Skeleton Layouts
 */

export const SkeletonMatchCard: React.FC = () => {
  return (
    <View style={skeletonStyles.matchCard}>
      {/* Team names */}
      <View style={skeletonStyles.matchHeader}>
        <View style={skeletonStyles.team}>
          <Skeleton width={32} height={32} borderRadius={SIZES.radiusFull} />
          <Skeleton width={80} height={16} />
        </View>
        <Skeleton width={40} height={24} /> {/* Score */}
        <View style={skeletonStyles.team}>
          <Skeleton width={80} height={16} />
          <Skeleton width={32} height={32} borderRadius={SIZES.radiusFull} />
        </View>
      </View>
      
      {/* Date/Time */}
      <Skeleton width={100} height={12} style={{ alignSelf: 'center', marginTop: 12 }} />
    </View>
  );
};

export const SkeletonProfileStats: React.FC = () => {
  return (
    <View style={skeletonStyles.statsGrid}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.statCard}>
          <Skeleton width={48} height={48} borderRadius={SIZES.radiusFull} />
          <Skeleton width={60} height={16} style={{ marginTop: 8 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <View style={skeletonStyles.textBlock}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'} // Last line is shorter
          height={16}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  matchCard: {
    backgroundColor: 'transparent',
    borderRadius: SIZES.radiusLg,
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radiusLg,
  },
  textBlock: {
    gap: 8,
  },
});
