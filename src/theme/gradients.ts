/**
 * Fan Manager 2026 - Gradient Helpers
 * Design System Documentation'a göre hazır gradient fonksiyonları
 */

import { BRAND, DARK_MODE } from './theme';

/**
 * GRADIENT HELPERS - Design System Section 4.1
 * Bu fonksiyonlar LinearGradient component'inde kullanılmak üzere hazırlanmıştır
 */

// ===== BACKGROUND GRADIENTS =====

/**
 * Splash Screen Gradient
 * Direction: to-br (135°)
 * Stops: #059669 (0%) → #047857 (50%) → #065f46 (100%)
 */
export const SPLASH_GRADIENT = {
  colors: ['#059669', '#047857', '#065f46'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

/**
 * Auth Pages Gradient (Login, Register, ForgotPassword)
 * Direction: to-br (135°)
 * Stops: #0F172A (0%) → #1E293B (50%) → #0F172A (100%)
 */
export const AUTH_GRADIENT = {
  colors: ['#0F172A', '#1E293B', '#0F172A'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

// ===== BUTTON GRADIENTS =====

/**
 * Primary Button Gradient
 * Direction: to-r (0°)
 * Stops: #059669 (0%) → #047857 (100%)
 */
export const PRIMARY_BUTTON_GRADIENT = {
  colors: [BRAND.emerald, BRAND.emeraldDark],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 }, // Horizontal (to-r)
};

/**
 * Primary Button Gradient - Hover State (Reversed)
 * Direction: to-r (0°)
 * Stops: #047857 (0%) → #059669 (100%)
 */
export const PRIMARY_BUTTON_GRADIENT_HOVER = {
  colors: [BRAND.emeraldDark, BRAND.emerald],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 }, // Horizontal (to-r)
};

/**
 * Match Header Gradient (Modal)
 * Direction: to-br (135°)
 * Stops: #059669 (0%) → #047857 (100%)
 */
export const MATCH_HEADER_GRADIENT = {
  colors: [BRAND.emerald, BRAND.emeraldDark],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

// ===== COMPONENT GRADIENTS =====

/**
 * Football Field Gradient
 * Direction: to-b (90°)
 * Stops: green-600 (0%) → green-500 (50%) → green-600 (100%)
 */
export const FOOTBALL_FIELD_GRADIENT = {
  colors: ['#16a34a', '#22c55e', '#16a34a'],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 }, // Vertical (to-b)
};

/**
 * Player Card Gradient
 * Direction: to-br (135°)
 * Stops: slate-800 (0%) → slate-900 (100%)
 */
export const PLAYER_CARD_GRADIENT = {
  colors: ['#1e293b', '#0f172a'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

/**
 * Jersey Number Badge Gradient
 * Direction: to-br (135°)
 * Stops: #059669 (0%) → #047857 (100%)
 */
export const JERSEY_NUMBER_GRADIENT = {
  colors: [BRAND.emerald, BRAND.emeraldDark],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

// ===== FADE OVERLAYS =====

/**
 * Fade Overlay - Top
 * Direction: to-b (90°)
 * Stops: card (0%) → transparent (100%)
 */
export const FADE_OVERLAY_TOP = {
  colors: [DARK_MODE.card, 'transparent'],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 }, // Vertical (to-b)
};

/**
 * Fade Overlay - Bottom
 * Direction: to-t (270°)
 * Stops: card (0%) → transparent (100%)
 */
export const FADE_OVERLAY_BOTTOM = {
  colors: [DARK_MODE.card, 'transparent'],
  start: { x: 0.5, y: 1 },
  end: { x: 0.5, y: 0 }, // Vertical reverse (to-t)
};

// ===== STAT CARD GRADIENTS =====

/**
 * Home Team Stats Gradient
 * Direction: to-br (135°)
 * Stops: rgba(5,150,105,0.2) (0%) → rgba(5,150,105,0.05) (100%)
 */
export const HOME_STATS_GRADIENT = {
  colors: ['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0.05)'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

/**
 * Away Team Stats Gradient
 * Direction: to-br (135°)
 * Stops: rgba(245,158,11,0.2) (0%) → rgba(245,158,11,0.05) (100%)
 */
export const AWAY_STATS_GRADIENT = {
  colors: ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 }, // 135° (to-br)
};

/**
 * Pro Feature Banner Gradient
 * Direction: to-r (0°)
 * Stops: rgba(245,158,11,0.1) (0%) → transparent (100%)
 */
export const PRO_FEATURE_GRADIENT = {
  colors: ['rgba(245, 158, 11, 0.1)', 'transparent'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 }, // Horizontal (to-r)
};

// ===== HELPER FUNCTION =====

/**
 * Gradient Helper - Derece açısını React Native formatına çevirir
 * @param degree - Tailwind derece (0, 90, 135, 180, 270)
 * @returns React Native start/end koordinatları
 */
export const getGradientDirection = (degree: number) => {
  const directions: Record<number, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
    0: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }, // to-r
    90: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }, // to-b
    135: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }, // to-br
    180: { start: { x: 1, y: 0 }, end: { x: 0, y: 0 } }, // to-l
    270: { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } }, // to-t
  };
  return directions[degree] || directions[0];
};

// Export all
export default {
  SPLASH_GRADIENT,
  AUTH_GRADIENT,
  PRIMARY_BUTTON_GRADIENT,
  PRIMARY_BUTTON_GRADIENT_HOVER,
  MATCH_HEADER_GRADIENT,
  FOOTBALL_FIELD_GRADIENT,
  PLAYER_CARD_GRADIENT,
  JERSEY_NUMBER_GRADIENT,
  FADE_OVERLAY_TOP,
  FADE_OVERLAY_BOTTOM,
  HOME_STATS_GRADIENT,
  AWAY_STATS_GRADIENT,
  PRO_FEATURE_GRADIENT,
  getGradientDirection,
};
