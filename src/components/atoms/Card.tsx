import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, SPACING, SHADOWS } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

/**
 * Card Component - Design System Compliant
 * 
 * Design System Reference (Section 2.3):
 * - Background: var(--card)
 * - Border: 1px solid var(--border)
 * - Border Radius: 12px (rounded-xl)
 * - Padding: 16px (p-4)
 * - Shadow: SHADOWS.md (default), SHADOWS.lg (elevated)
 */
const Card = React.memo(function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}: CardProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return SPACING.sm;     // 8px (p-2)
      case 'large':
        return SPACING.xl;     // 32px (p-8)
      default:
        return SPACING.base;   // 16px (p-4) - Design System default
    }
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: SIZES.radiusLg,  // 12px (rounded-xl) - Design System
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...SHADOWS.md,  // Default card shadow
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return baseStyle;
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
});

export default Card;
