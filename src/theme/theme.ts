/**
 * FAN MANAGER 2026 - DESIGN SYSTEM
 * Complete Design System based on official documentation
 * Adapted from Tailwind CSS to React Native StyleSheet
 * Version: 1.0.0
 * Last Updated: 4 Ocak 2026
 */

import { Platform, TextStyle } from 'react-native';

// 🌟 MARKA RENKLERİ (BRAND COLORS)
export const BRAND = {
  emerald: '#059669',        // Zümrüt Yeşili - Ana vurgu, butonlar, başarı
  emeraldDark: '#047857',    // Koyu Zümrüt - Gradient bitiş, hover
  gold: '#F59E0B',           // Altın Sarısı - Pro özellikler, premium
  white: '#ffffff',          // Beyaz - Zümrüt ve Altın üzerindeki metin
};

// 🌅 STADYUM GRADIENT
export const STADIUM_GRADIENT = {
  start: '#1e3a8a',          // Mavi Başlangıç
  end: '#0F172A',            // Koyu Lacivert Bitiş
};

// ☀️ LIGHT MODE
export const LIGHT_MODE = {
  background: '#F8FAFB',           // Ana arka plan
  foreground: '#030213',           // Ana metin rengi (koyu gri/siyah)
  card: '#ffffff',                 // Kart arka planı
  cardForeground: '#030213',       // Kart metni
  popover: '#ffffff',              // Popup arka planı
  popoverForeground: '#030213',    // Popup metni
  primary: '#030213',              // Birincil renk (koyu)
  primaryForeground: '#ffffff',    // Birincil metin (beyaz)
  secondary: '#f3f4f6',            // İkincil renk (çok açık gri)
  secondaryForeground: '#030213',  // İkincil metin
  muted: '#ececf0',                // Soluk arka plan
  mutedForeground: '#717182',      // Soluk metin
  accent: '#e9ebef',               // Vurgu arka planı
  accentForeground: '#030213',     // Vurgu metni
  destructive: '#d4183d',          // Silme/hata rengi (kırmızı)
  destructiveForeground: '#ffffff', // Silme butonu metni
  border: 'rgba(0, 0, 0, 0.1)',    // Kenarlıklar (%10 siyah)
  input: 'transparent',            // Input arka planı
  inputBackground: '#f3f3f5',      // Input gerçek arka planı
  switchBackground: '#cbced4',     // Switch/toggle arka planı
  ring: '#b3b3b3',                 // Odak halkası (gri)
  
  // Grafik renkleri (Light Mode)
  chart1: '#c2763d',               // Turuncu/kahve
  chart2: '#7cb5b5',               // Turkuaz
  chart3: '#4d6b9e',               // Mavi
  chart4: '#d4d97f',               // Sarı/yeşil
  chart5: '#d4a068',               // Turuncu
};

// 🌙 DARK MODE
export const DARK_MODE = {
  background: '#0F172A',           // Ana arka plan (koyu lacivert)
  foreground: '#fafafa',           // Ana metin rengi (beyaz)
  card: '#1e293b',                 // Kart arka planı
  cardForeground: '#fafafa',       // Kart metni
  popover: '#1e293b',              // Popup arka planı
  popoverForeground: '#fafafa',    // Popup metni
  primary: '#fafafa',              // Birincil renk (beyaz)
  primaryForeground: '#1a1a1a',    // Birincil metin (koyu)
  secondary: '#334155',            // İkincil renk (koyu gri)
  secondaryForeground: '#fafafa',  // İkincil metin
  muted: '#334155',                // Soluk arka plan
  mutedForeground: '#b3b3b3',      // Soluk metin
  accent: '#334155',               // Vurgu arka planı
  accentForeground: '#fafafa',     // Vurgu metni
  destructive: '#9e3a3a',          // Silme/hata rengi
  destructiveForeground: '#d4a068', // Silme butonu metni
  border: 'rgba(255, 255, 255, 0.1)', // Kenarlıklar (%10 beyaz)
  input: '#334155',                // Input arka planı
  ring: '#6b6b6b',                 // Odak halkası
  
  // Grafik renkleri (Dark Mode)
  chart1: '#8b5fbf',               // Mor
  chart2: '#a8d5b0',               // Yeşil
  chart3: '#d4a068',               // Turuncu
  chart4: '#c57ba8',               // Pembe/mor
  chart5: '#d47761',               // Kırmızı/turuncu
};

// 🎨 ANA RENK PALETİ (COLORS)
export const COLORS = {
  light: {
    ...LIGHT_MODE,
    
    // Marka renkleri
    primary: BRAND.emerald,
    primaryDark: BRAND.emeraldDark,
    primaryLight: '#10b981',
    
    // Özel renkler
    success: BRAND.emerald,
    error: LIGHT_MODE.destructive,
    warning: BRAND.gold,
    info: '#3b82f6',
    
    // Pro/Premium
    premium: BRAND.gold,
    premiumLight: '#fbbf24',
    
    // Arka plan ve yüzeyler
    surface: LIGHT_MODE.card,
    surfaceLight: '#f9fafb',
    
    // Metin
    text: LIGHT_MODE.foreground,
    textSecondary: LIGHT_MODE.mutedForeground,
    textTertiary: '#9ca3af',
    
    // Gradient
    gradientStart: STADIUM_GRADIENT.start,
    gradientEnd: STADIUM_GRADIENT.end,
  },
  
  dark: {
    ...DARK_MODE,
    
    // Marka renkleri
    primary: BRAND.emerald,
    primaryDark: BRAND.emeraldDark,
    primaryLight: '#10b981',
    
    // Özel renkler
    success: BRAND.emerald,
    error: DARK_MODE.destructive,
    warning: BRAND.gold,
    info: '#3b82f6',
    
    // Pro/Premium
    premium: BRAND.gold,
    premiumLight: '#fbbf24',
    
    // Arka plan ve yüzeyler
    surface: DARK_MODE.card,
    surfaceLight: '#2d3b52',
    
    // Metin
    text: DARK_MODE.foreground,
    textSecondary: DARK_MODE.mutedForeground,
    textTertiary: '#6b7280',
    
    // Gradient
    gradientStart: STADIUM_GRADIENT.start,
    gradientEnd: STADIUM_GRADIENT.end,
  },
};

// 📏 SPACING (Boşluklar) - Based on Design System
// Tailwind: p-1 → 4px, p-2 → 8px, p-3 → 12px, p-4 → 16px
export const SPACING = {
  xs: 4,      // p-1, gap-1
  sm: 8,      // p-2, gap-2
  '2.5': 10,  // p-2.5 (goal cards)
  md: 12,     // p-3, px-3
  base: 16,   // p-4, px-4
  lg: 24,     // p-6
  xl: 32,     // p-8
  xxl: 48,    // p-12
  xxxl: 64,   // p-16
  '12.5': 50, // Custom for 50px buttons
};

// 📐 SIZES (Boyutlar) - Design System Standards
export const SIZES = {
  // Ekran boyutları
  screenWidth: '100%',
  screenHeight: '100%',
  
  // İkon boyutları (Lucide-react mapping)
  // w-3 h-3 → 12px, w-4 h-4 → 16px, w-5 h-5 → 20px, w-6 h-6 → 24px, w-20 h-20 → 80px
  iconXxs: 12,   // w-3 h-3 (chart legends, mini indicators)
  iconXs: 16,    // w-4 h-4 (button icons, inline icons)
  iconSm: 20,    // w-5 h-5 (input icons, form elements)
  iconMd: 24,    // w-6 h-6 (navigation, back buttons)
  iconLg: 32,    // w-8 h-8
  iconXl: 48,    // w-12 h-12
  iconXxl: 80,   // w-20 h-20 (logo, feature illustrations)
  
  // Avatar boyutları
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,
  
  // Buton boyutları (Design System)
  buttonSmHeight: 32,    // h-8 (small)
  buttonHeight: 36,      // h-9 (default)
  buttonLgHeight: 40,    // h-10 (large)
  buttonAuthHeight: 50,  // h-[50px] (custom auth buttons)
  buttonIconSize: 36,    // size-9 (icon only)
  
  // Input boyutları (Design System)
  inputHeight: 36,       // h-9 (default UI input)
  inputAuthHeight: 50,   // h-[50px] (custom auth input)
  
  // Border radius (Design System)
  // rounded → 4px, rounded-md → 6px, rounded-lg → 8px, rounded-xl → 12px
  radius: 4,             // rounded
  radiusSm: 6,           // rounded-md
  radiusMd: 8,           // rounded-lg
  radiusLg: 12,          // rounded-xl
  radiusXl: 24,          // rounded-2xl
  radiusFull: 9999,      // rounded-full
  
  // Badge sizes
  badgeSize: 28,         // w-7 h-7 (minute indicators)
  
  // Tab bar
  tabBarHeight: 64,
  
  // Header
  headerHeight: 56,
};

// 🔤 TYPOGRAPHY (Tipografi) - Complete Design System
export const TYPOGRAPHY = {
  // ===== HEADINGS =====
  // h1 - Large Title
  h1: {
    fontSize: 30,        // text-3xl
    fontWeight: '700' as const,
    lineHeight: 45,      // 1.5
  },
  
  // h1 Splash
  h1Splash: {
    fontSize: 48,        // text-5xl
    fontWeight: '700' as const,
    lineHeight: 57.6,    // 1.2
  },
  
  // h2 - Modal Titles, Section Headers
  h2: {
    fontSize: 24,        // text-2xl
    fontWeight: '700' as const,
    lineHeight: 36,      // 1.5
  },
  
  // h2 Small - Success Messages
  h2Small: {
    fontSize: 20,        // text-xl
    fontWeight: '700' as const,
    lineHeight: 30,      // 1.5
  },
  
  // h3 - Subsection Titles
  h3: {
    fontSize: 18,        // text-lg
    fontWeight: '700' as const,
    lineHeight: 27,      // 1.5
  },
  
  // h3 Small - Card Section Headers
  h3Small: {
    fontSize: 14,        // text-sm
    fontWeight: '700' as const,
    lineHeight: 21,      // 1.5
  },
  
  // h4 - Utility Heading
  h4: {
    fontSize: 16,        // text-base
    fontWeight: '700' as const,
    lineHeight: 24,      // 1.5
  },
  
  // ===== BODY TEXT =====
  // Body Large
  bodyLarge: {
    fontSize: 16,        // text-base
    fontWeight: '400' as const,
    lineHeight: 24,      // 1.5
  },
  
  // Body Default
  body: {
    fontSize: 14,        // text-sm
    fontWeight: '400' as const,
    lineHeight: 21,      // 1.5
  },
  
  // Body Medium (Semibold)
  bodyMedium: {
    fontSize: 14,        // text-sm
    fontWeight: '500' as const,
    lineHeight: 21,      // 1.5
  },
  
  // Body Medium Semibold
  bodyMediumSemibold: {
    fontSize: 15,        // text-[15px]
    fontWeight: '600' as const,
    lineHeight: 22.5,    // 1.5
  },
  
  // Body Small
  bodySmall: {
    fontSize: 12,        // text-xs
    fontWeight: '400' as const,
    lineHeight: 18,      // 1.5
  },
  
  // Body Small Semibold
  bodySmallSemibold: {
    fontSize: 12,        // text-xs
    fontWeight: '600' as const,
    lineHeight: 18,      // 1.5
  },
  
  // Caption - Match Info
  caption: {
    fontSize: 10,        // text-[10px]
    fontWeight: '400' as const,
    lineHeight: 15,      // 1.5
  },
  
  // Caption Bold - Minute Indicators
  captionBold: {
    fontSize: 10,        // text-[10px]
    fontWeight: '700' as const,
    lineHeight: 15,      // 1.5
  },
  
  // Micro - Team Names in Modal
  micro: {
    fontSize: 11,        // text-[11px]
    fontWeight: '400' as const,
    lineHeight: 16.5,    // 1.5
  },
  
  // ===== BUTTON TEXT =====
  button: {
    fontSize: 14,        // text-sm
    fontWeight: '500' as const,
    lineHeight: 21,      // 1.5
  },
  
  buttonSmall: {
    fontSize: 14,        // text-sm
    fontWeight: '500' as const,
    lineHeight: 21,      // 1.5
  },
  
  // ===== RAW VALUES (for custom usage) =====
  // Font Sizes (in px)
  '2xs': 10,           // text-[10px]
  xs: 12,              // text-xs
  sm: 14,              // text-sm
  base: 16,            // text-base
  lg: 18,              // text-lg
  xl: 20,              // text-xl
  '2xl': 24,           // text-2xl
  '3xl': 30,           // text-3xl
  '5xl': 48,           // text-5xl
  
  // Font Weights
  light: '300' as const,
  regular: '400' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
  heavy: '900' as const,
  
  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
  
  // Letter Spacing
  letterSpacingTight: -0.5,
  letterSpacingNormal: 0,
  letterSpacingWide: 0.5,
  letterSpacingWidest: 1.6,  // tracking-widest (0.1em on 16px)
};

// 🎭 FONTS (Font Families)
export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  heavy: Platform.select({
    ios: 'System',
    android: 'Roboto-Black',
    default: 'System',
  }),
};

// ✨ SHADOWS (Gölgeler) - Design System Standards
// Web için boxShadow, native için shadow* props

const createShadow = (offset: { width: number; height: number }, radius: number, opacity: number, color: string = '#000') => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.max(offset.height, radius),
  };
};

export const SHADOWS = {
  none: Platform.OS === 'web' 
    ? { boxShadow: 'none' }
    : {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
  // Extra Small - Checkbox, subtle borders
  xs: createShadow({ width: 0, height: 1 }, 2, 0.05),
  // Small - Small cards
  sm: createShadow({ width: 0, height: 1 }, 3, 0.1),
  // Medium (default) - Default cards
  md: createShadow({ width: 0, height: 2 }, 4, 0.1),
  // Large - Buttons, prominent cards
  lg: createShadow({ width: 0, height: 10 }, 15, 0.1),
  // Extra Large - Tooltips, popovers
  xl: createShadow({ width: 0, height: 20 }, 25, 0.1),
  // 2X Large - Modals, dialogs
  '2xl': createShadow({ width: 0, height: 25 }, 50, 0.25),
  // Emerald Shadow - Primary buttons
  emerald: Platform.OS === 'web'
    ? { boxShadow: '0 10px 15px rgba(5, 150, 105, 0.2)' }
    : {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
      },
};

// 🎭 OPACITY SCALE - Design System Standards
export const OPACITY = {
  // Background Opacity
  5: 0.05,    // bg-[color]/5 - Very subtle tint
  10: 0.1,    // bg-[color]/10 - Soft backgrounds (goal cards)
  20: 0.2,    // bg-[color]/20 - Medium backgrounds
  30: 0.3,    // bg-[color]/30 - Borders, muted cards
  40: 0.4,    // bg-[color]/40 - Cards, overlays
  50: 0.5,    // bg-[color]/50 - Inputs, semi-transparent
  60: 0.6,    // bg-[color]/60 - Backdrops
  70: 0.7,    // opacity-70 - Close button normal
  80: 0.8,    // bg-[color]/80 - Language cards, text hover
  90: 0.9,    // bg-[color]/90 - Close button BG, team names
  100: 1.0,   // opacity-100 - Solid
};

// 📚 Z-INDEX HIERARCHY - Design System Standards
export const Z_INDEX = {
  normal: 0,          // Default content, cards
  sticky: 10,         // Sticky headers, fixed elements
  closeButton: 20,    // Modal close button (relative)
  dropdown: 50,       // Dropdown menus, popovers
  backdrop: 9998,     // Modal backdrop
  modal: 9999,        // Modal content
  toast: 10000,       // Toast notifications
};

// 🎯 HELPER FUNCTIONS
export const getTheme = (isDark: boolean) => ({
  colors: isDark ? COLORS.dark : COLORS.light,
  spacing: SPACING,
  sizes: SIZES,
  typography: TYPOGRAPHY,
  fonts: FONTS,
  shadows: SHADOWS,
  opacity: OPACITY,
  zIndex: Z_INDEX,
  brand: BRAND,
  gradient: STADIUM_GRADIENT,
});

// Export tümü - Design System Complete
export default {
  BRAND,
  STADIUM_GRADIENT,
  LIGHT_MODE,
  DARK_MODE,
  COLORS,
  SPACING,
  SIZES,
  TYPOGRAPHY,
  FONTS,
  SHADOWS,
  OPACITY,
  Z_INDEX,
  getTheme,
};
