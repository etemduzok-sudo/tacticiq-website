import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND, COLORS, SIZES, TYPOGRAPHY, SHADOWS, SPACING } from '../../theme/theme';
import { PRIMARY_BUTTON_GRADIENT } from '../../theme/gradients';
import { ACTIVE_STATES, ANIMATION_DURATION } from '../../utils/premiumUX';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'pro' | 'gradient' | 'solid';
  size?: 'small' | 'default' | 'large' | 'auth';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Button Component - Design System Compliant
 * 
 * Sizes:
 * - small: 32px (h-8) - Design System Table
 * - default: 36px (h-9) - Design System Table
 * - large: 40px (h-10) - Design System Table
 * - auth: 50px (h-[50px]) - Custom Auth Buttons
 * 
 * Variants:
 * - primary: Solid emerald background
 * - gradient: Emerald gradient (Login, Register)
 * - secondary, outline, ghost, pro: Other variants
 */
const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  
  // Active state animation (press feedback)
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: ACTIVE_STATES.scale.pressed, // 0.95
      duration: ANIMATION_DURATION.fast, // 75ms
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: ACTIVE_STATES.scale.normal, // 1
      duration: ANIMATION_DURATION.fast, // 75ms
      useNativeDriver: true,
    }).start();
  };

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return SIZES.buttonSmHeight;       // 32px (h-8)
      case 'large':
        return SIZES.buttonLgHeight;       // 40px (h-10)
      case 'auth':
        return SIZES.buttonAuthHeight;     // 50px (h-[50px])
      default:
        return SIZES.buttonHeight;         // 36px (h-9)
    }
  };

  const getBorderRadius = () => {
    // Auth buttons use rounded-xl (12px), others use rounded-md (6px)
    return size === 'auth' ? SIZES.radiusLg : SIZES.radiusSm;
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: getButtonHeight(),
      borderRadius: getBorderRadius(),
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: size === 'small' ? SPACING.md : SPACING.base,
      flexDirection: 'row',
      gap: SPACING.sm,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : BRAND.emerald,
          ...(!disabled && SHADOWS.md),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.border : BRAND.emerald,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'pro':
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.surfaceLight : BRAND.gold,
          ...(!disabled && SHADOWS.lg),
        };
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...SHADOWS.emerald, // shadow-lg shadow-[#059669]/20
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = size === 'small' ? TYPOGRAPHY.buttonSmall : TYPOGRAPHY.button;

    switch (variant) {
      case 'primary':
      case 'solid':
        return {
          ...baseStyle,
          color: disabled ? colors.textTertiary : BRAND.white,
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? colors.textTertiary : colors.text,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? colors.textTertiary : BRAND.emerald,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? colors.textTertiary : colors.text,
        };
      case 'pro':
      case 'gradient':
        return {
          ...baseStyle,
          color: disabled ? colors.textTertiary : BRAND.white,
        };
      default:
        return baseStyle;
    }
  };

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator 
          color={
            variant === 'outline' || variant === 'ghost' 
              ? BRAND.emerald
              : BRAND.white
          } 
        />
      ) : (
        <>
          {icon && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </>
  );

  if (variant === 'gradient' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[getButtonStyle(), style]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, width: '100%' }}>
          <LinearGradient
            {...PRIMARY_BUTTON_GRADIENT}  // from-[#059669] to-[#047857]
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: getBorderRadius() },
            ]}
          />
          {buttonContent}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default Button;
