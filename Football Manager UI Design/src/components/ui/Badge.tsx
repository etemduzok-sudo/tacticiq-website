import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'pro';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function Badge({
  text,
  variant = 'default',
  size = 'medium',
  style,
}: BadgeProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'pro':
        return colors.accent;
      default:
        return colors.surfaceLight;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'default':
        return colors.text;
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: SPACING.xs, paddingVertical: 2 };
      case 'large':
        return { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs };
      default:
        return { paddingHorizontal: SPACING.sm, paddingVertical: 4 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
