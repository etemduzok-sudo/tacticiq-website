/**
 * STANDARD LAYOUT CONSTANTS
 * Tüm auth ve onboarding ekranları için standart layout değerleri
 * TacticIQ Design System v1.0 uyumlu
 */

import { SPACING, SIZES } from '../theme/theme';

/**
 * STANDARD SCREEN LAYOUT ZONES
 * Tüm ekranlar için aynı layout yapısı
 */
export const STANDARD_LAYOUT = {
  // [A] TOP NAVIGATION ZONE
  screenPadding: 24,
  backButtonSize: 40,
  backButtonMarginBottom: 0,
  
  // [B] BRAND ZONE (Logo)
  brandZoneHeight: 100,
  logoSize: 96, // ✅ Standart logo boyutu (sıçrama yok)
  logoWidth: 96,
  logoHeight: 96,
  
  // [C] PRIMARY ACTION ZONE (Social Buttons - Optional)
  socialZoneHeight: 104, // 2x44 + 8 gap + 8 marginTop
  socialButtonHeight: 44,
  socialButtonGap: 8,
  socialZoneMarginTop: 8,
  
  // [D] DIVIDER ZONE (Optional)
  dividerZoneHeight: 40, // 8 + 24 + 8
  dividerMarginVertical: 8,
  
  // [E] FORM INPUT ZONE
  inputHeight: 48,
  inputGap: 12,
  inputIconTop: 14,
  inputPaddingLeft: 44,
  inputPaddingRight: 16,
  
  // [F] SECONDARY ACTION LINKS
  secondaryLinkMarginTop: 16,
  
  // [G] PRIMARY CTA BUTTON
  ctaButtonHeight: 48,
  ctaButtonMarginTop: 16,
  
  // [H] FOOTER ZONE
  footerMarginTop: 'auto',
  footerPaddingVertical: 16,
};

/**
 * STANDARD INPUT STYLES
 * Tüm input alanları için standart stiller
 */
export const STANDARD_INPUT = {
  height: STANDARD_LAYOUT.inputHeight,
  borderRadius: SIZES.radiusLg,
  backgroundColor: 'rgba(15, 42, 36, 0.95)', // DARK_MODE.inputBackground - opak (grid görünmesin)
  borderWidth: 1,
  borderColor: 'rgba(31, 162, 166, 0.3)', // BRAND.secondary with 30% opacity
  paddingLeft: STANDARD_LAYOUT.inputPaddingLeft,
  paddingRight: STANDARD_LAYOUT.inputPaddingRight,
  fontSize: 16,
  color: '#FFFFFF',
  placeholderTextColor: '#64748B',
};

/**
 * STANDARD BUTTON STYLES
 * Tüm butonlar için standart stiller
 */
export const STANDARD_BUTTON = {
  height: STANDARD_LAYOUT.ctaButtonHeight,
  borderRadius: SIZES.radiusLg,
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

/**
 * STANDARD COLORS
 * TacticIQ Design System v1.0 renkleri
 */
export const STANDARD_COLORS = {
  // Background
  background: '#121212', // DARK_MODE.background
  card: '#0F2A24', // DARK_MODE.card (Primary)
  
  // Text
  foreground: '#E6E6E6', // DARK_MODE.foreground
  mutedForeground: '#9CA3AF', // DARK_MODE.mutedForeground
  
  // Brand
  primary: '#0F2A24', // BRAND.primary
  secondary: '#1FA2A6', // BRAND.secondary
  accent: '#C9A44C', // BRAND.accent
  
  // Borders
  border: 'rgba(230, 230, 230, 0.1)', // DARK_MODE.border
  
  // Status
  success: '#059669', // Emerald (legacy)
  error: '#EF4444', // Red
};

export default {
  STANDARD_LAYOUT,
  STANDARD_INPUT,
  STANDARD_BUTTON,
  STANDARD_COLORS,
};
