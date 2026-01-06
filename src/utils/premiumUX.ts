/**
 * Premium UX Utilities for Fan Manager 2026
 * Safe Area Insets, Haptic Feedback, Touch Optimization
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Safe Area Hook - iOS Notch & Home Indicator uyumu
 * 
 * Usage:
 * const insets = useSafeAreaPadding();
 * <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
 */
export const useSafeAreaPadding = () => {
  const insets = useSafeAreaInsets();
  
  return {
    top: Math.max(insets.top, 16), // Minimum 16px padding
    bottom: Math.max(insets.bottom, 16),
    left: Math.max(insets.left, 16),
    right: Math.max(insets.right, 16),
  };
};

/**
 * Haptic Feedback - Button press hissiyatı
 * 
 * Types:
 * - 'light': Hafif dokunma (toggle, tab değiştirme)
 * - 'medium': Normal buton tıklaması
 * - 'heavy': Önemli aksiyon (kaydet, gönder)
 * - 'success': Başarı işlemi
 * - 'warning': Uyarı
 * - 'error': Hata
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
  if (Platform.OS === 'ios') {
    // iOS Haptic Feedback (requires expo-haptics)
    // Uncomment when expo-haptics is installed
    /*
    const Haptics = require('expo-haptics');
    
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
    */
  } else if (Platform.OS === 'android') {
    // Android Vibration (basic)
    // Uncomment when react-native vibration is needed
    /*
    const { Vibration } = require('react-native');
    const duration = type === 'light' ? 10 : type === 'heavy' ? 50 : 25;
    Vibration.vibrate(duration);
    */
  }
};

/**
 * Active State Animation Values
 * 
 * For use with Animated or Reanimated
 */
export const ACTIVE_STATES = {
  scale: {
    normal: 1,
    pressed: 0.95, // Button shrinks to 95%
  },
  opacity: {
    normal: 1,
    pressed: 0.8, // Color darkens to 80%
  },
  duration: 75, // Fast feedback (75ms)
};

/**
 * Touch Area Minimum Sizes
 * Based on Apple & Google guidelines
 */
export const TOUCH_TARGET = {
  minimum: 44, // Apple iOS minimum
  recommended: 48, // Google Material Design
  icon: 48, // Icon buttons
  list: 52, // List items minimum height
};

/**
 * Animation Durations (milliseconds)
 */
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 75,
  quick: 150,
  normal: 200,
  moderate: 300,
  slow: 500,
  drawer: 500,
  splash: 600,
};

/**
 * Animation Easing
 */
export const ANIMATION_EASING = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'spring',
};

/**
 * Safe Area Styles Helper
 * Returns style object with safe area padding
 */
export const getSafeAreaStyle = (position: 'top' | 'bottom' | 'all') => {
  const insets = useSafeAreaInsets();
  
  switch (position) {
    case 'top':
      return { paddingTop: Math.max(insets.top, 16) };
    case 'bottom':
      return { paddingBottom: Math.max(insets.bottom, 16) };
    case 'all':
      return {
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
      };
  }
};

export default {
  useSafeAreaPadding,
  triggerHaptic,
  ACTIVE_STATES,
  TOUCH_TARGET,
  ANIMATION_DURATION,
  ANIMATION_EASING,
  getSafeAreaStyle,
};
