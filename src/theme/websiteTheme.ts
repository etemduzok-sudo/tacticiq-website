/**
 * TacticIQ Website Theme - React Native Uyumlu
 * https://www.tacticiq.app/ ile %100 uyumlu renk paleti
 * 
 * CSS Variables → React Native Constants
 */

import { Platform } from 'react-native';

// ===== BRAND COLORS (Website CSS Variables) =====
export const WEBSITE_COLORS = {
  // Primary Brand Colors
  primary: '#0F2A24',        // --color-brand-primary: Koyu yeşil
  secondary: '#1FA2A6',      // --color-brand-secondary: Turkuaz
  accent: '#C9A44C',         // --color-brand-accent: Altın
  error: '#8C3A3A',          // --color-brand-error: Koyu kırmızı
  dark: '#121212',           // --color-brand-dark
  light: '#E6E6E6',          // --color-brand-light
  
  // Functional
  white: '#FFFFFF',
  black: '#000000',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// ===== LIGHT MODE (Website :root) =====
export const LIGHT_THEME = {
  background: '#fafaf9',
  foreground: '#0F2A24',
  card: '#ffffff',
  cardForeground: '#0F2A24',
  popover: '#ffffff',
  popoverForeground: '#0F2A24',
  primary: '#0F2A24',
  primaryForeground: '#ffffff',
  secondary: '#1FA2A6',
  secondaryForeground: '#ffffff',
  muted: '#E6E6E6',
  mutedForeground: '#0F2A24',
  accent: '#C9A44C',
  accentForeground: '#0F2A24',
  destructive: '#8C3A3A',
  destructiveForeground: '#ffffff',
  border: 'rgba(15, 42, 36, 0.1)',
  input: 'transparent',
  inputBackground: '#f3f3f5',
  ring: '#1FA2A6',
};

// ===== DARK MODE (Website .dark) =====
export const DARK_THEME = {
  background: '#0a1612',
  foreground: '#E6E6E6',
  card: '#0f2420',
  cardForeground: '#E6E6E6',
  popover: '#0f2420',
  popoverForeground: '#E6E6E6',
  primary: '#1FA2A6',
  primaryForeground: '#ffffff',
  secondary: '#C9A44C',
  secondaryForeground: '#0F2A24',
  muted: '#1a3630',
  mutedForeground: '#b8b8b8',
  accent: '#C9A44C',
  accentForeground: '#0F2A24',
  destructive: '#8C3A3A',
  destructiveForeground: '#ffffff',
  border: 'rgba(31, 162, 166, 0.2)',
  input: 'rgba(230, 230, 230, 0.1)',
  ring: '#1FA2A6',
};

// ===== GRADIENTS =====
export const WEBSITE_GRADIENTS = {
  // Primary gradient (dark mode background)
  primary: {
    colors: ['#0a1612', '#0f2420', '#1a3630'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Secondary gradient (buttons, accents)
  secondary: {
    colors: ['#1FA2A6', '#0F2A24'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Accent gradient (premium, gold)
  accent: {
    colors: ['#C9A44C', '#8B7355'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // Auth screens
  auth: {
    colors: ['#0a1612', '#0F2A24', '#1a3630'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  // Button hover/active
  buttonPrimary: {
    colors: ['#1FA2A6', '#178a8d'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  buttonAccent: {
    colors: ['#C9A44C', '#a88a3d'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};

// ===== SPACING (Consistent with website) =====
export const WEBSITE_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ===== BORDER RADIUS =====
export const WEBSITE_RADIUS = {
  sm: 4,  // calc(0.5rem - 4px)
  md: 6,  // calc(0.5rem - 2px)
  lg: 8,  // 0.5rem
  xl: 12, // calc(0.5rem + 4px)
  xxl: 16,
  full: 9999,
};

// ===== TYPOGRAPHY =====
export const WEBSITE_TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
};

// ===== SHADOWS =====
export const WEBSITE_SHADOWS = {
  sm: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }),
  },
  md: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    }),
  },
  lg: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    }),
  },
  xl: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.2,
      shadowRadius: 25,
      elevation: 12,
    }),
  },
  glow: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 20px rgba(31, 162, 166, 0.4)',
    } : {
      shadowColor: '#1FA2A6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  goldGlow: {
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 20px rgba(201, 164, 76, 0.4)',
    } : {
      shadowColor: '#C9A44C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
};

// ===== BUTTON STYLES =====
export const WEBSITE_BUTTONS = {
  primary: {
    backgroundColor: WEBSITE_COLORS.secondary,
    textColor: WEBSITE_COLORS.white,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: 'transparent',
    textColor: WEBSITE_COLORS.secondary,
    borderColor: WEBSITE_COLORS.secondary,
  },
  accent: {
    backgroundColor: WEBSITE_COLORS.accent,
    textColor: WEBSITE_COLORS.primary,
    borderColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: WEBSITE_COLORS.light,
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: WEBSITE_COLORS.error,
    textColor: WEBSITE_COLORS.white,
    borderColor: 'transparent',
  },
};

// ===== CARD STYLES =====
export const WEBSITE_CARDS = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(31, 162, 166, 0.2)',
    borderWidth: 1,
    borderRadius: WEBSITE_RADIUS.xl,
  },
  elevated: {
    backgroundColor: 'rgba(15, 36, 32, 0.8)',
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderWidth: 1,
    borderRadius: WEBSITE_RADIUS.xl,
    ...WEBSITE_SHADOWS.md,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: WEBSITE_RADIUS.xxl,
  },
};

// Export all
export default {
  colors: WEBSITE_COLORS,
  light: LIGHT_THEME,
  dark: DARK_THEME,
  gradients: WEBSITE_GRADIENTS,
  spacing: WEBSITE_SPACING,
  radius: WEBSITE_RADIUS,
  typography: WEBSITE_TYPOGRAPHY,
  shadows: WEBSITE_SHADOWS,
  buttons: WEBSITE_BUTTONS,
  cards: WEBSITE_CARDS,
};
