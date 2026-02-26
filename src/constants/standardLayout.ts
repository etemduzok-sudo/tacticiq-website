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
 * STANDARD INPUT STYLES (Dark – auth ekranları varsayılan)
 */
export const STANDARD_INPUT = {
  height: STANDARD_LAYOUT.inputHeight,
  borderRadius: SIZES.radiusLg,
  backgroundColor: 'rgba(15, 42, 36, 0.95)',
  borderWidth: 1,
  borderColor: 'rgba(31, 162, 166, 0.3)',
  paddingLeft: STANDARD_LAYOUT.inputPaddingLeft,
  paddingRight: STANDARD_LAYOUT.inputPaddingRight,
  fontSize: 16,
  color: '#FFFFFF',
  placeholderTextColor: '#64748B',
};

/** Açık mod input: yumuşak dolgu, belirgin çerçeve */
export const STANDARD_INPUT_LIGHT = {
  ...STANDARD_INPUT,
  backgroundColor: '#f0f2f1',
  borderColor: 'rgba(15, 42, 36, 0.2)',
  color: '#0F2A24',
  placeholderTextColor: '#64748B',
};

/**
 * STANDARD BUTTON STYLES
 */
export const STANDARD_BUTTON = {
  height: STANDARD_LAYOUT.ctaButtonHeight,
  borderRadius: SIZES.radiusLg,
  fontSize: 16,
  fontWeight: '600' as const,
  color: '#FFFFFF',
};

/** Açık mod CTA: daha yumuşak primary (çok koyu olmasın) */
export const STANDARD_BUTTON_LIGHT = {
  ...STANDARD_BUTTON,
  color: '#FFFFFF',
};

/**
 * STANDARD COLORS (Dark – varsayılan)
 */
export const STANDARD_COLORS = {
  background: '#121212',
  card: '#0F2A24',
  foreground: '#E6E6E6',
  mutedForeground: '#9CA3AF',
  primary: '#0F2A24',
  secondary: '#1FA2A6',
  accent: '#C9A44C',
  border: 'rgba(230, 230, 230, 0.1)',
  success: '#059669',
  error: '#EF4444',
};

/**
 * STANDARD COLORS – Açık mod (konteyner ayrımı + belirgin çerçeve)
 */
export const STANDARD_COLORS_LIGHT = {
  background: '#fafaf9',
  card: 'rgba(255, 255, 255, 0.97)',
  foreground: '#0F2A24',
  mutedForeground: '#475569',
  primary: '#0F2A24',
  secondary: '#1FA2A6',
  accent: '#C9A44C',
  border: 'rgba(15, 42, 36, 0.18)',
  success: '#059669',
  error: '#EF4444',
};

export default {
  STANDARD_LAYOUT,
  STANDARD_INPUT,
  STANDARD_INPUT_LIGHT,
  STANDARD_BUTTON,
  STANDARD_BUTTON_LIGHT,
  STANDARD_COLORS,
  STANDARD_COLORS_LIGHT,
};
