import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
  Platform,
} from 'react-native';
import SafeIcon from '../SafeIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND, COLORS, SIZES, TYPOGRAPHY, SPACING, OPACITY } from '../../theme/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: any;
  rightIcon?: any;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: ViewStyle;
  type?: 'text' | 'email' | 'password' | 'number';
  variant?: 'default' | 'auth';  // Auth variant for 50px height
  focusedBorderColor?: string;
  placeholderTextColor?: string;
}

/**
 * Input Component - Design System Compliant
 * 
 * Variants:
 * - default: 36px (h-9) - Standard UI Input
 * - auth: 50px (h-[50px]) - Auth Screens
 * 
 * Design System Reference:
 * - Standard Input: h-9, rounded-md (6px)
 * - Auth Input: h-[50px], rounded-xl (12px)
 * - Background: bg-[#0F172A]/50 (50% opacity)
 * - Border: border-[#059669]/30 (30%), focus: solid #059669
 */
const Input = React.memo(function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  type = 'text',
  variant = 'default',
  focusedBorderColor = BRAND.emerald,
  placeholderTextColor,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = type === 'password';
  const secureTextEntry = isPassword && !isPasswordVisible;

  const getInputHeight = () => {
    return variant === 'auth' ? SIZES.inputAuthHeight : SIZES.inputHeight;
  };

  const getBorderRadius = () => {
    return variant === 'auth' ? SIZES.radiusLg : SIZES.radiusSm;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          {
            height: getInputHeight(),
            borderRadius: getBorderRadius(),
            // bg-[#0F172A]/50 (Design System Section 2.1)
            backgroundColor: `rgba(15, 23, 42, ${OPACITY[50]})`,
            // border-[#059669]/30 (normal), solid (focus)
            borderColor: error
              ? colors.error
              : isFocused
              ? focusedBorderColor // Solid (focus)
              : `rgba(5, 150, 105, ${OPACITY[30]})`, // 30% (normal)
            borderWidth: isFocused || error ? 2 : 1,
          },
          inputStyle,
        ]}
      >
        {leftIcon && (
          <SafeIcon
            name={leftIcon}
            size={SIZES.iconSm}  // w-5 h-5 (20px) - Design System
            color={isFocused ? focusedBorderColor : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              paddingLeft: leftIcon ? 0 : SPACING.base,
            },
          ]}
          placeholderTextColor={placeholderTextColor || colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={
            type === 'email'
              ? 'email-address'
              : type === 'number'
              ? 'numeric'
              : 'default'
          }
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          // Web için focus sorununu önlemek
          {...(Platform.OS === 'web' ? { focusable: true } : {})}
          {...textInputProps}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <SafeIcon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={SIZES.iconSm}  // w-5 h-5 (20px)
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <SafeIcon
              name={rightIcon}
              size={SIZES.iconSm}  // w-5 h-5 (20px)
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,  // text-sm (14px) - Design System
    paddingHorizontal: SPACING.base,
  },
  leftIcon: {
    marginLeft: SPACING.base,
  },
  rightIcon: {
    marginRight: SPACING.base,
    padding: SPACING.xs,
  },
  error: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: SPACING.xs,
  },
});
