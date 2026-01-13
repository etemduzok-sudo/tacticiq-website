// src/utils/styleHelpers.ts
// Style Helper Functions for Standardization
import { StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { SPACING, SIZES, TYPOGRAPHY, SHADOWS, OPACITY, COLORS, BRAND } from '../theme/theme';

/**
 * Common Container Styles
 */
export const containerStyles = {
  // Screen Container
  screen: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  } as ViewStyle,

  // Safe Area Container - Standardized for all screens
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 0, // SafeAreaView otomatik ayarlar
  } as ViewStyle,

  // Scroll Content Container
  scrollContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,

  // Card Container
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.base,
    ...SHADOWS.md,
  } as ViewStyle,

  // Section Container
  section: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.base,
  } as ViewStyle,
};

/**
 * Common Header Styles
 */
export const headerStyles = {
  // Standard Header
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.base, // 16px yatay padding
    height: 56, // Sabit yükseklik - tüm header'lar için standart
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  } as ViewStyle,

  // Header Title
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark.foreground,
  } as TextStyle,

  // Header Button (Back, Settings, etc.)
  headerButton: {
    width: SIZES.buttonIconSize,
    height: SIZES.buttonIconSize,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
};

/**
 * Common Text Styles
 */
export const textStyles = {
  // Title Text
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark.foreground,
  } as TextStyle,

  // Subtitle Text
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
  } as TextStyle,

  // Body Text
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.foreground,
  } as TextStyle,

  // Secondary Text
  secondary: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
  } as TextStyle,

  // Caption Text
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dark.mutedForeground,
  } as TextStyle,

  // Label Text
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.dark.foreground,
    fontWeight: '600' as const,
  } as TextStyle,
};

/**
 * Common Button Styles
 */
export const buttonStyles = {
  // Primary Button Container
  primaryButton: {
    height: SIZES.buttonAuthHeight,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SPACING.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.emerald,
  } as ViewStyle,

  // Primary Button Text
  primaryButtonText: {
    ...TYPOGRAPHY.button,
    color: BRAND.white,
    fontWeight: '600' as const,
  } as TextStyle,

  // Secondary Button Container
  secondaryButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,

  // Secondary Button Text
  secondaryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.dark.foreground,
  } as TextStyle,

  // Icon Button
  iconButton: {
    width: SIZES.buttonIconSize,
    height: SIZES.buttonIconSize,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
};

/**
 * Common Card Styles
 */
export const cardStyles = {
  // Standard Card
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.base,
    ...SHADOWS.md,
  } as ViewStyle,

  // Elevated Card
  elevatedCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.base,
    ...SHADOWS.lg,
  } as ViewStyle,

  // Gradient Card
  gradientCard: {
    borderRadius: SIZES.radiusLg,
    padding: SPACING.base,
    ...SHADOWS.md,
  } as ViewStyle,
};

/**
 * Common Input Styles
 */
export const inputStyles = {
  // Standard Input Container
  inputContainer: {
    height: SIZES.inputAuthHeight,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.dark.input,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  // Input Text
  inputText: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.foreground,
    flex: 1,
  } as TextStyle,

  // Input Placeholder
  inputPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
  } as TextStyle,
};

/**
 * Common Badge Styles
 */
export const badgeStyles = {
  // Standard Badge
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.dark.secondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,

  // Badge Text
  badgeText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: COLORS.dark.foreground,
  } as TextStyle,

  // Primary Badge
  primaryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
    backgroundColor: BRAND.emerald,
  } as ViewStyle,

  // Primary Badge Text
  primaryBadgeText: {
    ...TYPOGRAPHY.bodySmallSemibold,
    color: BRAND.white,
  } as TextStyle,
};

/**
 * Common Loading & Error Styles
 */
export const stateStyles = {
  // Loading Container
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: SPACING.xl,
  } as ViewStyle,

  // Loading Text
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.md,
  } as TextStyle,

  // Error Container
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: SPACING.xl,
  } as ViewStyle,

  // Error Text
  errorText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark.error,
    marginTop: SPACING.md,
  } as TextStyle,

  // Error Subtext
  errorSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark.mutedForeground,
    marginTop: SPACING.sm,
    textAlign: 'center' as const,
  } as TextStyle,
};

/**
 * Common Spacing Helpers
 */
export const spacingHelpers = {
  // Margin Top
  mt: (size: keyof typeof SPACING) => ({
    marginTop: SPACING[size],
  }),

  // Margin Bottom
  mb: (size: keyof typeof SPACING) => ({
    marginBottom: SPACING[size],
  }),

  // Margin Horizontal
  mx: (size: keyof typeof SPACING) => ({
    marginHorizontal: SPACING[size],
  }),

  // Margin Vertical
  my: (size: keyof typeof SPACING) => ({
    marginVertical: SPACING[size],
  }),

  // Padding
  p: (size: keyof typeof SPACING) => ({
    padding: SPACING[size],
  }),

  // Padding Horizontal
  px: (size: keyof typeof SPACING) => ({
    paddingHorizontal: SPACING[size],
  }),

  // Padding Vertical
  py: (size: keyof typeof SPACING) => ({
    paddingVertical: SPACING[size],
  }),
};

/**
 * Create standardized stylesheet
 */
export const createStandardStyles = (customStyles: any) => {
  return StyleSheet.create({
    ...containerStyles,
    ...headerStyles,
    ...textStyles,
    ...buttonStyles,
    ...cardStyles,
    ...inputStyles,
    ...badgeStyles,
    ...stateStyles,
    ...customStyles,
  });
};

/**
 * Export all helpers
 */
export default {
  containerStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  cardStyles,
  inputStyles,
  badgeStyles,
  stateStyles,
  spacingHelpers,
  createStandardStyles,
};
