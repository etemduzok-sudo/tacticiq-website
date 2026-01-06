export const COLORS = {
  // Dark Mode
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#F8FAFB',
    textSecondary: '#94A3B8',
    primary: '#059669',
    primaryLight: '#10B981',
    accent: '#F59E0B',
    border: '#334155',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  // Light Mode
  light: {
    background: '#F8FAFB',
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#059669',
    primaryLight: '#10B981',
    accent: '#F59E0B',
    border: '#E2E8F0',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  buttonHeight: 50,
  inputHeight: 50,
  bottomBarHeight: 52,
  borderRadius: 12,
  borderRadiusLarge: 16,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};
