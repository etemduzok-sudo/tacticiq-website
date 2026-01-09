// src/components/PremiumBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'medium',
  showLabel = false,
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeMap = {
    small: { width: 20, height: 20, fontSize: 10 },
    medium: { width: 28, height: 28, fontSize: 14 },
    large: { width: 40, height: 40, fontSize: 20 },
  };

  const dimensions = sizeMap[size];

  return (
    <View style={[styles.container, showLabel && styles.containerWithLabel]}>
      <Animated.View style={[animatedStyle]}>
        <LinearGradient
          colors={['#F59E0B', '#D97706', '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            {
              width: dimensions.width,
              height: dimensions.height,
            },
          ]}
        >
          <Text style={[styles.crownIcon, { fontSize: dimensions.fontSize }]}>
            👑
          </Text>
        </LinearGradient>
      </Animated.View>
      
      {showLabel && (
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.labelContainer}
        >
          <Text style={styles.labelText}>PREMIUM</Text>
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerWithLabel: {
    gap: 8,
  },
  badge: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  crownIcon: {
    textAlign: 'center',
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  labelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
});
