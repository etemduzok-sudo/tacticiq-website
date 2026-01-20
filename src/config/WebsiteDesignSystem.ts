/**
 * TACTICIQ WEBSITE DESIGN SYSTEM - Mobil Uygulama için Uyarlama
 * 
 * Bu dosya tacticiq.app websitesindeki renk hiyerarşisi, ikon yapısı ve stil tarzlarını
 * mobil uygulama için kullanılabilir hale getirir.
 * 
 * Kaynak: website/src/styles/theme.css ve website/DESIGN_SYSTEM.md
 * 
 * Version: 1.0.0
 * Last Updated: Ocak 2026
 */

import { Platform } from 'react-native';

// ============================================================================
// 🎨 MARKA RENKLERİ (BRAND COLORS) - ASLA DEĞİŞMEZ
// ============================================================================

/**
 * TacticIQ Core Brand Colors
 * Website ile %100 uyumlu - bu renkler hiçbir zaman değişmemelidir
 */
export const WEBSITE_BRAND_COLORS = {
  /** Primary - Koyu yeşil/deniz mavisi (Ana marka rengi) */
  primary: '#0F2A24',
  
  /** Secondary - Açık turkuaz/cyan (İkincil marka rengi) */
  secondary: '#1FA2A6',
  
  /** Accent - Altın/sarı (Vurgu rengi - rozet, başarı, premium) */
  accent: '#C9A44C',
  
  /** Error/Destructive - Koyu kırmızı (Hata mesajları) */
  error: '#8C3A3A',
  
  /** Dark - Koyu arka plan (Dark mode ana rengi) */
  dark: '#121212',
  
  /** Light - Açık arka plan (Light mode vurgu rengi) */
  light: '#E6E6E6',
  
  /** White - Beyaz */
  white: '#FFFFFF',
  
  /** Black - Siyah */
  black: '#000000',
} as const;

// ============================================================================
// 🌞 LIGHT MODE RENK PALETİ
// ============================================================================

/**
 * Light Mode Color System
 * Website'deki :root CSS variables ile eşleşir
 */
export const WEBSITE_LIGHT_COLORS = {
  // Background & Surfaces
  background: '#fafaf9',           // Ana arka plan (açık bej)
  foreground: '#0F2A24',           // Ana metin rengi (koyu yeşil - Primary)
  card: '#ffffff',                 // Kart arka planı (beyaz)
  cardForeground: '#0F2A24',       // Kart metin rengi
  popover: '#ffffff',              // Popup arka planı (beyaz)
  popoverForeground: '#0F2A24',    // Popup metin rengi
  
  // Interactive Elements
  primary: '#0F2A24',              // Primary buton rengi (koyu yeşil)
  primaryForeground: '#ffffff',     // Primary buton text (beyaz)
  secondary: '#1FA2A6',            // Secondary buton rengi (turkuaz)
  secondaryForeground: '#ffffff',  // Secondary buton text (beyaz)
  
  // Muted & Subtle
  muted: '#E6E6E6',                // Muted arka plan (açık gri)
  mutedForeground: '#0F2A24',      // Muted metin rengi (Primary)
  
  // Accent & Highlights
  accent: '#C9A44C',               // Vurgu rengi (altın)
  accentForeground: '#0F2A24',     // Accent text rengi (Primary)
  
  // Destructive Actions
  destructive: '#8C3A3A',          // Hata/silme rengi (koyu kırmızı)
  destructiveForeground: '#ffffff', // Destructive text (beyaz)
  
  // Borders & Inputs
  border: 'rgba(15, 42, 36, 0.1)', // Border rengi (Primary %10 opacity)
  input: 'transparent',            // Input border (şeffaf)
  inputBackground: '#f3f3f5',      // Input arka plan
  switchBackground: '#cbced4',     // Toggle/switch rengi
  ring: '#1FA2A6',                 // Focus ring (Secondary - turkuaz)
  
  // Chart Colors
  chart1: '#1FA2A6',               // Ana chart rengi (turkuaz - Secondary)
  chart2: '#C9A44C',               // İkincil chart (altın - Accent)
  chart3: '#0F2A24',                // Üçüncü chart (koyu yeşil - Primary)
  chart4: '#8C3A3A',                // Dördüncü chart (kırmızı - Error)
  chart5: '#E6E6E6',                // Beşinci chart (açık gri - Light)
  
  // Sidebar (eğer kullanılırsa)
  sidebar: '#0F2A24',
  sidebarForeground: '#ffffff',
  sidebarPrimary: '#1FA2A6',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#C9A44C',
  sidebarAccentForeground: '#0F2A24',
  sidebarBorder: 'rgba(255, 255, 255, 0.1)',
  sidebarRing: '#1FA2A6',
} as const;

// ============================================================================
// 🌙 DARK MODE RENK PALETİ
// ============================================================================

/**
 * Dark Mode Color System
 * Website'deki .dark CSS variables ile eşleşir
 */
export const WEBSITE_DARK_COLORS = {
  // Background & Surfaces
  background: '#0a1612',           // Ana arka plan (çok koyu yeşilimsi)
  foreground: '#E6E6E6',           // Ana metin rengi (açık gri - Brand Light)
  card: '#0f2420',                 // Kart arka planı (koyu yeşil - Primary variant)
  cardForeground: '#E6E6E6',       // Kart metin rengi
  popover: '#0f2420',              // Popup arka planı
  popoverForeground: '#E6E6E6',    // Popup metin rengi
  
  // Interactive Elements
  primary: '#1FA2A6',              // Primary buton (turkuaz - Secondary)
  primaryForeground: '#ffffff',     // Primary text (beyaz)
  secondary: '#C9A44C',            // Secondary buton (altın - Accent)
  secondaryForeground: '#0F2A24', // Secondary text (koyu - Primary)
  
  // Muted & Subtle
  muted: '#1a3630',                // Muted arka plan (koyu yeşil variant)
  mutedForeground: '#b8b8b8',      // Muted text (açık gri)
  
  // Accent & Highlights
  accent: '#C9A44C',               // Vurgu rengi (altın - Accent)
  accentForeground: '#0F2A24',     // Accent text (koyu - Primary)
  
  // Destructive Actions
  destructive: '#8C3A3A',          // Hata rengi (koyu kırmızı - Error)
  destructiveForeground: '#ffffff', // Destructive text (beyaz)
  
  // Borders & Inputs
  border: 'rgba(31, 162, 166, 0.2)', // Border (Secondary %20 opacity)
  input: 'rgba(230, 230, 230, 0.1)', // Input border (açık gri %10)
  inputBackground: '#0F2A24',      // Input arka plan (Primary)
  switchBackground: '#334155',     // Switch/toggle arka plan
  ring: '#1FA2A6',                 // Focus ring (Secondary - turkuaz)
  
  // Chart Colors (Dark Mode adjusted)
  chart1: '#1FA2A6',               // Turkuaz (Secondary)
  chart2: '#C9A44C',               // Altın (Accent)
  chart3: '#E6E6E6',                // Açık gri (Light)
  chart4: '#8C3A3A',                // Kırmızı (Error)
  chart5: '#0F2A24',                // Koyu yeşil (Primary)
  
  // Sidebar
  sidebar: '#0f2420',
  sidebarForeground: '#E6E6E6',
  sidebarPrimary: '#1FA2A6',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#C9A44C',
  sidebarAccentForeground: '#0F2A24',
  sidebarBorder: 'rgba(31, 162, 166, 0.2)',
  sidebarRing: '#1FA2A6',
} as const;

// ============================================================================
// 🎯 RENK HİYERARŞİSİ (COLOR HIERARCHY)
// ============================================================================

/**
 * Renk Kullanım Kuralları ve Hiyerarşisi
 * Website'deki kullanım alanlarına göre düzenlenmiştir
 */
export const WEBSITE_COLOR_HIERARCHY = {
  /**
   * Primary (#0F2A24) - Ana Marka Rengi
   * Kullanım:
   * - Ana butonlar (light mode)
   * - Başlıklar, header background
   * - Footer background
   * - Navigation ana renk
   * - Ana metin rengi (light mode)
   */
  primary: {
    color: WEBSITE_BRAND_COLORS.primary,
    usage: [
      'Ana butonlar (light mode)',
      'Header/Footer background',
      'Başlıklar',
      'Ana metin rengi (light mode)',
      'Kart metin rengi (light mode)',
    ],
    variants: {
      default: '#0F2A24',
      hover: 'rgba(15, 42, 36, 0.9)', // %90 opacity
      light: 'rgba(15, 42, 36, 0.1)',  // %10 opacity - backgrounds
      medium: 'rgba(15, 42, 36, 0.2)', // %20 opacity
    },
  },

  /**
   * Secondary (#1FA2A6) - İkincil Marka Rengi
   * Kullanım:
   * - CTA butonlar (join waitlist, call to action)
   * - Linkler
   * - İkonlar
   * - Focus states, ring
   * - Hover effects
   * - Primary buton (dark mode)
   */
  secondary: {
    color: WEBSITE_BRAND_COLORS.secondary,
    usage: [
      'CTA butonlar',
      'Linkler ve hover states',
      'İkonlar (dekoratif)',
      'Focus ring',
      'Primary buton (dark mode)',
      'Chart renkleri',
    ],
    variants: {
      default: '#1FA2A6',
      hover: 'rgba(31, 162, 166, 0.8)', // %80 opacity
      light: 'rgba(31, 162, 166, 0.1)',  // %10 opacity - backgrounds
      medium: 'rgba(31, 162, 166, 0.2)', // %20 opacity - borders
    },
  },

  /**
   * Accent (#C9A44C) - Vurgu Rengi
   * Kullanım:
   * - Premium özellikler
   * - Rozet/Badge
   * - Başarı göstergeleri
   * - Özel vurgular
   * - Secondary buton (dark mode)
   */
  accent: {
    color: WEBSITE_BRAND_COLORS.accent,
    usage: [
      'Premium badge/rozet',
      'Achievement stars',
      'Özel vurgular',
      'Secondary buton (dark mode)',
      'Chart renkleri',
    ],
    variants: {
      default: '#C9A44C',
      hover: 'rgba(201, 164, 76, 0.9)', // %90 opacity
      light: 'rgba(201, 164, 76, 0.1)',  // %10 opacity - backgrounds
      medium: 'rgba(201, 164, 76, 0.2)', // %20 opacity
      lighter: '#D4B86A',                 // Daha açık variant
    },
  },

  /**
   * Error (#8C3A3A) - Hata/Uyarı Rengi
   * Kullanım:
   * - Hata mesajları
   * - Uyarılar
   * - Silme işlemleri
   * - Destructive butonlar
   */
  error: {
    color: WEBSITE_BRAND_COLORS.error,
    usage: [
      'Hata mesajları',
      'Delete butonlar',
      'Uyarı toasts',
      'Destructive actions',
    ],
    variants: {
      default: '#8C3A3A',
      hover: 'rgba(140, 58, 58, 0.9)', // %90 opacity
      light: 'rgba(140, 58, 58, 0.1)',  // %10 opacity
      dark: 'rgba(140, 58, 58, 0.6)',   // %60 opacity (dark mode)
    },
  },
} as const;

// ============================================================================
// 📐 İKON YAPISI VE BOYUTLARI (ICON STRUCTURE & SIZES)
// ============================================================================

/**
 * Website'de Lucide-react ikonları kullanılıyor
 * İkon boyutları Tailwind size class'larına göre tanımlanmıştır
 */
export const WEBSITE_ICON_SIZES = {
  /** size-3 (12px) - Çok küçük ikonlar, chart legends, mini indicators */
  xs: 12,
  
  /** size-4 (16px) - Küçük ikonlar, butonlarda, inline icons, navigation */
  sm: 16,
  
  /** size-5 (20px) - Orta boy ikonlar, input icons, form elements */
  md: 20,
  
  /** size-6 (24px) - Büyük ikonlar, navigation, back buttons, feature icons */
  lg: 24,
  
  /** size-8 (32px) - Çok büyük ikonlar */
  xl: 32,
  
  /** size-12 (48px) - Ekstra büyük ikonlar */
  xxl: 48,
  
  /** size-20 (80px) - Dev ikonlar, logo, feature illustrations */
  xxxl: 80,
} as const;

/**
 * İkon Kullanım Alanları ve Standartları
 */
export const WEBSITE_ICON_USAGE = {
  /**
   * Buton İkonları
   * - Default button: size-4 (16px)
   * - Icon-only button: size-9 container (36px), icon içeride 16px
   */
  button: {
    default: WEBSITE_ICON_SIZES.sm,      // 16px
    container: 36,                        // Icon-only button container
    gap: 8,                               // Icon ile text arası gap (gap-2)
  },

  /**
   * Navigation İkonları
   * - Header icons: size-4 (16px)
   * - Menu icons: size-4 (16px)
   */
  navigation: {
    default: WEBSITE_ICON_SIZES.sm,      // 16px
  },

  /**
   * Feature/Stat İkonları
   * - Card içindeki büyük ikonlar: size-6 (24px)
   * - Gradient background'lı ikonlar: 48x48px container, 24px icon
   */
  feature: {
    default: WEBSITE_ICON_SIZES.lg,      // 24px
    container: 48,                        // Background container
  },

  /**
   * Form Input İkonları
   * - Input içindeki iconlar: size-5 (20px)
   */
  input: {
    default: WEBSITE_ICON_SIZES.md,      // 20px
  },

  /**
   * Badge/Indicator İkonları
   * - Küçük badge iconlar: size-4 (16px)
   */
  badge: {
    default: WEBSITE_ICON_SIZES.sm,      // 16px
  },
} as const;

/**
 * İkon Renkleri
 * Website'de ikonlar genellikle şu renklerle kullanılır:
 */
export const WEBSITE_ICON_COLORS = {
  /** Varsayılan ikon rengi - foreground color ile uyumlu */
  default: 'currentColor',
  
  /** Primary renkteki ikonlar */
  primary: WEBSITE_BRAND_COLORS.primary,
  
  /** Secondary renkteki ikonlar (CTA, links) */
  secondary: WEBSITE_BRAND_COLORS.secondary,
  
  /** Accent renkteki ikonlar (premium, vurgu) */
  accent: WEBSITE_BRAND_COLORS.accent,
  
  /** Muted renkteki ikonlar (disabled, subtle) */
  muted: WEBSITE_LIGHT_COLORS.mutedForeground,
  
  /** White ikonlar (dark backgrounds üzerinde) */
  white: WEBSITE_BRAND_COLORS.white,
  
  /** Error renkteki ikonlar */
  error: WEBSITE_BRAND_COLORS.error,
} as const;

// ============================================================================
// 🎨 STİL TARZLARI VE PATTERN'LER
// ============================================================================

/**
 * Website'deki stil pattern'leri ve best practice'ler
 */

/**
 * Border Radius Sistemi
 * Website'de rounded-md, rounded-lg, rounded-xl gibi class'lar kullanılır
 */
export const WEBSITE_BORDER_RADIUS = {
  /** rounded (4px) - Minimal radius */
  sm: 4,
  
  /** rounded-md (6px) - Small buttons, inputs */
  md: 6,
  
  /** rounded-lg (8px) - Default radius, cards, panels */
  lg: 8,
  
  /** rounded-xl (12px) - Large cards, hero sections */
  xl: 12,
  
  /** rounded-2xl (24px) - Extra large cards */
  xxl: 24,
  
  /** rounded-full - Pills, badges, circular elements */
  full: 9999,
  
  /** Website'deki default radius */
  default: 8, // rounded-lg
} as const;

/**
 * Spacing Sistemi (Gap ve Padding)
 * Website'de 4px grid sistemi kullanılır (Tailwind standard)
 */
export const WEBSITE_SPACING = {
  /** gap-1 (4px) - Çok küçük spacing */
  xs: 4,
  
  /** gap-1.5 (6px) - Küçük spacing */
  sm: 6,
  
  /** gap-2 (8px) - Default küçük spacing */
  md: 8,
  
  /** gap-3 (12px) - Orta spacing */
  lg: 12,
  
  /** gap-4 (16px) - Default orta spacing */
  xl: 16,
  
  /** gap-6 (24px) - Büyük spacing */
  xxl: 24,
  
  /** gap-8 (32px) - Çok büyük spacing */
  xxxl: 32,
} as const;

/**
 * Opacity Değerleri
 * Website'de /10, /20, /30, /50, /80, /90 gibi opacity kullanılır
 */
export const WEBSITE_OPACITY = {
  /** 5% opacity - Çok hafif arka planlar */
  5: 0.05,
  
  /** 10% opacity - Soft backgrounds, subtle tints */
  10: 0.1,
  
  /** 20% opacity - Medium backgrounds, borders */
  20: 0.2,
  
  /** 30% opacity - Muted cards, overlays */
  30: 0.3,
  
  /** 50% opacity - Semi-transparent, disabled states */
  50: 0.5,
  
  /** 80% opacity - Hover states, semi-opaque */
  80: 0.8,
  
  /** 90% opacity - Hover states, close button normal */
  90: 0.9,
  
  /** 100% opacity - Solid, default */
  100: 1.0,
} as const;

/**
 * Shadow Sistemi
 * Website'de card hover effects ve depth için shadow kullanılır
 */
export const WEBSITE_SHADOWS = {
  /** Küçük shadow - Subtle elevation */
  sm: Platform.OS === 'web' 
    ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
  
  /** Default shadow - Cards */
  md: Platform.OS === 'web'
    ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
  
  /** Büyük shadow - Hovered cards, prominent elements */
  lg: Platform.OS === 'web'
    ? { boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
      },
  
  /** Extra large shadow - Modals, dialogs */
  xl: Platform.OS === 'web'
    ? { boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 15,
      },
} as const;

// ============================================================================
// 📝 TYPOGRAPHY SİSTEMİ
// ============================================================================

/**
 * Website'deki tipografi sistemi
 * Font sizes Tailwind text-* class'larına göre
 */
export const WEBSITE_TYPOGRAPHY = {
  /** text-xs (12px) - Captions, labels */
  xs: 12,
  
  /** text-sm (14px) - Body text (small), secondary info */
  sm: 14,
  
  /** text-base (16px) - Body text (default) */
  base: 16,
  
  /** text-lg (18px) - Emphasized text, subtitles */
  lg: 18,
  
  /** text-xl (20px) - Section subtitles */
  xl: 20,
  
  /** text-2xl (24px) - Page titles, h2 */
  '2xl': 24,
  
  /** text-3xl (30px) - Hero titles */
  '3xl': 30,
  
  /** text-4xl (36px) - Large hero titles */
  '4xl': 36,
  
  /** text-5xl (48px) - Main hero title */
  '5xl': 48,
  
  /** Font weights */
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  /** Line heights */
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// 🎭 BUTON STİLLERİ (BUTTON STYLES)
// ============================================================================

/**
 * Website'deki buton variant'ları
 * Button component'teki variant'lara göre
 */
export const WEBSITE_BUTTON_VARIANTS = {
  /** Default - Primary buton (bg-primary) */
  default: {
    backgroundColor: WEBSITE_BRAND_COLORS.primary,
    color: WEBSITE_BRAND_COLORS.white,
    hover: 'rgba(15, 42, 36, 0.9)',
  },
  
  /** Secondary - CTA butonlar (bg-secondary) */
  secondary: {
    backgroundColor: WEBSITE_BRAND_COLORS.secondary,
    color: WEBSITE_BRAND_COLORS.white,
    hover: 'rgba(31, 162, 166, 0.8)',
  },
  
  /** Destructive - Silme/hata butonları (bg-destructive) */
  destructive: {
    backgroundColor: WEBSITE_BRAND_COLORS.error,
    color: WEBSITE_BRAND_COLORS.white,
    hover: 'rgba(140, 58, 58, 0.9)',
  },
  
  /** Outline - Bordered butonlar */
  outline: {
    backgroundColor: 'transparent',
    color: WEBSITE_LIGHT_COLORS.foreground,
    borderColor: WEBSITE_LIGHT_COLORS.border,
    borderWidth: 1,
    hover: {
      backgroundColor: WEBSITE_LIGHT_COLORS.accent + '10', // 10% opacity
    },
  },
  
  /** Ghost - Subtle butonlar */
  ghost: {
    backgroundColor: 'transparent',
    color: WEBSITE_LIGHT_COLORS.foreground,
    hover: {
      backgroundColor: WEBSITE_LIGHT_COLORS.accent + '10', // 10% opacity
    },
  },
  
  /** Link - Text link butonlar */
  link: {
    backgroundColor: 'transparent',
    color: WEBSITE_BRAND_COLORS.primary,
    textDecorationLine: 'underline' as const,
  },
} as const;

/**
 * Buton boyutları
 */
export const WEBSITE_BUTTON_SIZES = {
  /** sm - h-8 (32px) */
  sm: {
    height: 32,
    paddingHorizontal: 12, // px-3
    fontSize: WEBSITE_TYPOGRAPHY.sm,
  },
  
  /** default - h-9 (36px) */
  default: {
    height: 36,
    paddingHorizontal: 16, // px-4
    fontSize: WEBSITE_TYPOGRAPHY.sm,
  },
  
  /** lg - h-10 (40px) */
  lg: {
    height: 40,
    paddingHorizontal: 24, // px-6
    fontSize: WEBSITE_TYPOGRAPHY.base,
  },
  
  /** icon - size-9 (36x36px) */
  icon: {
    width: 36,
    height: 36,
  },
} as const;

// ============================================================================
// 🎯 HELPER FUNCTIONS
// ============================================================================

/**
 * Theme getter function
 * İstediğiniz mode'a göre renk paletini döndürür
 */
export const getWebsiteTheme = (isDark: boolean = false) => {
  return {
    colors: isDark ? WEBSITE_DARK_COLORS : WEBSITE_LIGHT_COLORS,
    brand: WEBSITE_BRAND_COLORS,
    hierarchy: WEBSITE_COLOR_HIERARCHY,
    icons: {
      sizes: WEBSITE_ICON_SIZES,
      usage: WEBSITE_ICON_USAGE,
      colors: WEBSITE_ICON_COLORS,
    },
    styles: {
      borderRadius: WEBSITE_BORDER_RADIUS,
      spacing: WEBSITE_SPACING,
      opacity: WEBSITE_OPACITY,
      shadows: WEBSITE_SHADOWS,
    },
    typography: WEBSITE_TYPOGRAPHY,
    buttons: {
      variants: WEBSITE_BUTTON_VARIANTS,
      sizes: WEBSITE_BUTTON_SIZES,
    },
  };
};

// ============================================================================
// 📦 EXPORTS
// ============================================================================

export default {
  WEBSITE_BRAND_COLORS,
  WEBSITE_LIGHT_COLORS,
  WEBSITE_DARK_COLORS,
  WEBSITE_COLOR_HIERARCHY,
  WEBSITE_ICON_SIZES,
  WEBSITE_ICON_USAGE,
  WEBSITE_ICON_COLORS,
  WEBSITE_BORDER_RADIUS,
  WEBSITE_SPACING,
  WEBSITE_OPACITY,
  WEBSITE_SHADOWS,
  WEBSITE_TYPOGRAPHY,
  WEBSITE_BUTTON_VARIANTS,
  WEBSITE_BUTTON_SIZES,
  getWebsiteTheme,
};
