import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, TYPOGRAPHY, SPACING } from '../../theme/theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pro';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const Badge = React.memo(function Badge({
  label,
  variant = 'primary',
  size = 'medium',
  style,
}: BadgeProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      case 'pro':
        return colors.accent;
      case 'neutral':
      default:
        return colors.surfaceLight;
    }
  };

  const getTextColor = () => {
    if (variant === 'neutral') {
      return colors.text;
    }
    return '#FFFFFF';
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    paddingHorizontal: size === 'small' ? SPACING.sm : SPACING.md,
    paddingVertical: size === 'small' ? SPACING.xs : SPACING.sm,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    ...(size === 'small' ? TYPOGRAPHY.caption : TYPOGRAPHY.bodySmallSemibold),
    color: getTextColor(),
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
});

export default Badge;
