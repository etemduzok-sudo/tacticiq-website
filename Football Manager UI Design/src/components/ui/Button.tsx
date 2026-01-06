import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pro';
  size?: 'default' | 'small' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: SIZES.buttonHeight,
      borderRadius: SIZES.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : colors.primary,
          ...SHADOWS.medium,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : colors.surfaceLight,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.border : colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'pro':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : colors.accent,
          ...SHADOWS.large,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...TYPOGRAPHY.button,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: colors.text,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? colors.textSecondary : colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? colors.textSecondary : colors.text,
        };
      case 'pro':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
