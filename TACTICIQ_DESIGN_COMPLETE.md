# 🎨 TacticIQ - Kapsamlı Tasarım Dokümantasyonu

**Version:** 2.0  
**Last Updated:** Ocak 2025  
**Framework:** React 18 + TypeScript + Tailwind CSS v4  
**Diller:** TR, EN, DE, FR, ES, IT, AR, ZH (RTL desteği)

---

## 📑 İçindekiler

1. [Marka Kimliği ve Renk Sistemi](#1-marka-kimliği-ve-renk-sistemi)
2. [Component Hiyerarşisi](#2-component-hiyerarşisi)
3. [Tipografi ve Font Sistemi](#3-tipografi-ve-font-sistemi)
4. [Spacing ve Layout Sistemi](#4-spacing-ve-layout-sistemi)
5. [Responsive Tasarım](#5-responsive-tasarım)
6. [Dark Mode Sistemi](#6-dark-mode-sistemi)
7. [Component Kütüphanesi](#7-component-kütüphanesi)
8. [Animasyon ve Geçişler](#8-animasyon-ve-geçişler)
9. [RTL Desteği](#9-rtl-desteği)
10. [Accessibility (Erişilebilirlik)](#10-accessibility-erişilebilirlik)

---

## 1. Marka Kimliği ve Renk Sistemi

### 🎯 Ana Marka Renkleri

```css
/* ========================================
   TacticIQ BRAND COLORS - ASLA DEĞİŞMEZ
   ======================================== */

--color-brand-primary: #0F2A24    /* Koyu Yeşil/Deniz Mavisi - Ana marka */
--color-brand-secondary: #1FA2A6  /* Turkuaz/Cyan - İkincil marka */
--color-brand-accent: #C9A44C     /* Altın/Sarı - Vurgu rengi */
--color-brand-error: #8C3A3A      /* Koyu Kırmızı - Hata/Uyarı */
--color-brand-dark: #121212       /* Siyah - Dark mode arka plan */
--color-brand-light: #E6E6E6      /* Açık Gri - Light mode vurgu */
```

### 🎨 Renk Kullanım Rehberi

| Renk | HEX | RGB | Kullanım Alanı | Örnekler |
|------|-----|-----|----------------|----------|
| **Primary** | `#0F2A24` | `rgb(15, 42, 36)` | • Ana butonlar<br>• Header/Footer background<br>• Başlıklar<br>• Navigation | • "Katıl" butonu (light mode)<br>• Header background<br>• Ana menü hover |
| **Secondary** | `#1FA2A6` | `rgb(31, 162, 166)` | • CTA butonlar<br>• Linkler<br>• İkonlar<br>• Focus states | • "Join Waitlist" butonu<br>• Link hover effects<br>• Focus rings |
| **Accent** | `#C9A44C` | `rgb(201, 164, 76)` | • Premium özellikler<br>• Rozet/Badge<br>• Başarı göstergeleri<br>• Özel vurgular | • Pro badge<br>• Achievement stars<br>• Premium icon |
| **Error** | `#8C3A3A` | `rgb(140, 58, 58)` | • Hata mesajları<br>• Uyarı toastları<br>• Silme butonları<br>• Validation errors | • Delete button<br>• Error toast<br>• Form validation |
| **Dark** | `#121212` | `rgb(18, 18, 18)` | • Dark mode background<br>• Koyu yüzeyler | • Body bg (dark mode)<br>• Dark cards |
| **Light** | `#E6E6E6` | `rgb(230, 230, 230)` | • Muted backgrounds<br>• Subtle dividers<br>• Placeholder text | • Muted sections<br>• Border colors |

---

### 🌞 Light Mode Renk Paleti

```css
/* ===========================
   LIGHT MODE SEMANTIC COLORS
   =========================== */

/* Ana Yüzeyler */
--background: #fafaf9              /* Ana sayfa arka planı (açık bej) */
--foreground: #0F2A24              /* Ana metin rengi (koyu yeşil) */
--card: #ffffff                     /* Kart/Panel arka planı (beyaz) */
--card-foreground: #0F2A24         /* Kart içi metin */

/* Interactive Elements (Butonlar, Linkler) */
--primary: #0F2A24                  /* Primary buton/element */
--primary-foreground: #ffffff       /* Primary buton text */
--secondary: #1FA2A6                /* Secondary buton/element */
--secondary-foreground: #ffffff     /* Secondary buton text */

/* Accent ve Vurgular */
--accent: #C9A44C                   /* Accent color */
--accent-foreground: #0F2A24       /* Accent text */
--muted: #E6E6E6                    /* Muted background */
--muted-foreground: #0F2A24        /* Muted text */

/* Destructive (Hata/Silme) */
--destructive: #8C3A3A              /* Hata/silme rengi */
--destructive-foreground: #ffffff   /* Destructive text */

/* Borders ve Inputs */
--border: rgba(15, 42, 36, 0.1)    /* Border rengi (10% opacity) */
--input: transparent                 /* Input border */
--input-background: #f3f3f5         /* Input arka plan */
--ring: #1FA2A6                     /* Focus ring (secondary) */

/* Chart/Graph Colors */
--chart-1: #1FA2A6                  /* Ana chart (turkuaz) */
--chart-2: #C9A44C                  /* İkincil chart (altın) */
--chart-3: #0F2A24                  /* 3. chart (koyu yeşil) */
--chart-4: #8C3A3A                  /* 4. chart (kırmızı) */
--chart-5: #E6E6E6                  /* 5. chart (gri) */
```

### 🌙 Dark Mode Renk Paleti

```css
/* ===========================
   DARK MODE SEMANTIC COLORS
   =========================== */

/* Ana Yüzeyler */
--background: #121212               /* Ana sayfa arka planı (siyah) */
--foreground: #E6E6E6              /* Ana metin rengi (açık gri) */
--card: #0F2A24                     /* Kart arka planı (koyu yeşil) */
--card-foreground: #E6E6E6         /* Kart içi metin */

/* Interactive Elements */
--primary: #1FA2A6                  /* Primary buton (turkuaz - daha parlak) */
--primary-foreground: #ffffff       /* Primary text */
--secondary: #C9A44C                /* Secondary buton (altın) */
--secondary-foreground: #0F2A24    /* Secondary text (koyu) */

/* Accent ve Vurgular */
--accent: #C9A44C                   /* Accent (altın - aynı) */
--accent-foreground: #0F2A24       /* Accent text */
--muted: #0F2A24                    /* Muted background (koyu yeşil) */
--muted-foreground: #E6E6E6        /* Muted text (açık) */

/* Destructive */
--destructive: #8C3A3A              /* Hata rengi (aynı) */
--destructive-foreground: #ffffff   /* Destructive text */

/* Borders ve Inputs */
--border: rgba(230, 230, 230, 0.1) /* Border (10% beyaz) */
--input: rgba(230, 230, 230, 0.1)  /* Input border */
--ring: #1FA2A6                     /* Focus ring */

/* Charts (Dark'a optimize) */
--chart-1: #1FA2A6                  /* Turkuaz */
--chart-2: #C9A44C                  /* Altın */
--chart-3: #E6E6E6                  /* Açık gri */
--chart-4: #8C3A3A                  /* Kırmızı */
--chart-5: #0F2A24                  /* Koyu yeşil */
```

### 🎨 Tailwind Class Örnekleri

```jsx
// ============================================
// BACKGROUND VE TEXT RENKLERI
// ============================================

// Sayfa arka planı
<div className="bg-background text-foreground">

// Kart/Panel
<div className="bg-card text-card-foreground">

// Muted (hafif arka plan)
<div className="bg-muted text-muted-foreground">

// ============================================
// BUTON RENKLERİ
// ============================================

// Primary buton (light: koyu yeşil, dark: turkuaz)
<button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Secondary buton (light: turkuaz, dark: altın)
<button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">

// Accent buton (her ikisinde de altın)
<button className="bg-accent text-accent-foreground hover:bg-accent/90">

// Destructive buton (kırmızı)
<button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">

// ============================================
// BORDER VE INPUT
// ============================================

// Border
<div className="border border-border">

// Input
<input className="bg-input-background border-border focus:ring-2 focus:ring-ring">

// ============================================
// OPACITY VE HOVER STATES
// ============================================

// Background opacity
<div className="bg-secondary/10">        // 10% opacity
<div className="bg-accent/20">           // 20% opacity

// Hover states
<button className="hover:bg-primary/90">  // 90% opacity on hover
```

---

## 2. Component Hiyerarşisi

### 📦 Component Yapısı

```
/src/app/components/
│
├── 📁 ui/                          # Temel UI Component'leri (Shadcn/UI)
│   ├── button.tsx                  # Button component (5 variant)
│   ├── input.tsx                   # Form input
│   ├── label.tsx                   # Form label
│   ├── textarea.tsx                # Textarea
│   ├── checkbox.tsx                # Checkbox
│   ├── switch.tsx                  # Toggle switch
│   ├── select.tsx                  # Dropdown select
│   ├── card.tsx                    # Card component
│   ├── badge.tsx                   # Badge/Pill
│   ├── dialog.tsx                  # Modal/Dialog
│   ├── separator.tsx               # Divider
│   └── ...                         # Diğer UI primitives
│
├── 📁 layout/                      # Layout Component'leri
│   ├── Header.tsx                  # Ana header (navigation)
│   ├── Footer.tsx                  # Footer (4 sütun grid)
│   ├── MobileMenu.tsx              # Mobil hamburger menü
│   └── LanguageSwitcher.tsx        # Dil değiştirici
│
├── 📁 sections/                    # Sayfa Bölümleri (Ana sayfa)
│   ├── HeroSection.tsx             # Hero/Banner
│   ├── FeaturesSection.tsx         # Özellikler (grid)
│   ├── PredictionsSection.tsx      # Tahmin kategorileri
│   ├── AnalysisSection.tsx         # Analiz odak noktaları
│   ├── DownloadSection.tsx         # App download
│   ├── PaymentSection.tsx          # Ödeme yöntemleri
│   ├── FAQSection.tsx              # Sık sorulan sorular
│   └── CTASection.tsx              # Final CTA
│
├── 📁 auth/                        # Authentication
│   └── AuthModal.tsx               # Login/Signup modal
│
├── 📁 legal/                       # Yasal Belgeler
│   └── LegalSection.tsx            # Yasal modal içeriği
│
└── 📁 figma/                       # Figma import'ları
    └── ImageWithFallback.tsx       # Image component
```

### 🔗 Component İlişkileri

```
App.tsx
│
├─→ Header
│   ├─→ LanguageSwitcher
│   ├─→ Button (Auth)
│   └─→ MobileMenu
│
├─→ Main Content
│   ├─→ HeroSection
│   │   ├─→ Badge
│   │   └─→ Button (CTA)
│   │
│   ├─→ FeaturesSection
│   │   └─→ Card (Grid)
│   │       ├─→ Badge
│   │       └─→ Button
│   │
│   ├─→ PredictionsSection
│   │   └─→ Card (Match/Player predictions)
│   │
│   ├─→ AnalysisSection
│   │   └─→ Card
│   │
│   ├─→ DownloadSection
│   │   ├─→ Badge
│   │   └─→ Button (Store links)
│   │
│   ├─→ PaymentSection
│   │   ├─→ Card
│   │   └─→ Button
│   │
│   ├─→ FAQSection
│   │   └─→ Accordion
│   │
│   └─→ CTASection
│       └─→ Button
│
├─→ Footer
│   ├─→ Badge
│   └─→ LegalSection (Modal trigger)
│
└─→ Modals
    ├─→ AuthModal (Dialog)
    │   ├─→ Input
    │   ├─→ Label
    │   ├─→ Button
    │   └─→ Separator
    │
    └─→ LegalSection (Dialog)
        └─→ Tabs/Content
```

---

## 3. Tipografi ve Font Sistemi

### 📝 Font Hierarchy

```css
/* ===========================
   TYPOGRAPHY SYSTEM
   =========================== */

/* Base */
html { font-size: 16px; }

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
```

### 📏 Font Size Scale (Tailwind Classes)

| Class | Size (rem) | Pixels | Line Height | Kullanım Alanı |
|-------|-----------|--------|-------------|----------------|
| `text-xs` | 0.75rem | **12px** | 1rem | • Captions<br>• Timestamps<br>• Fine print |
| `text-sm` | 0.875rem | **14px** | 1.25rem | • Body text (small)<br>• Secondary info<br>• Labels |
| `text-base` | 1rem | **16px** | 1.5rem | • Body text (default)<br>• Paragraphs<br>• Button text |
| `text-lg` | 1.125rem | **18px** | 1.75rem | • Emphasized text<br>• Subtitles<br>• Lead paragraphs |
| `text-xl` | 1.25rem | **20px** | 1.75rem | • Section subtitles<br>• Card titles |
| `text-2xl` | 1.5rem | **24px** | 2rem | • Page titles<br>• H2 headings |
| `text-3xl` | 1.875rem | **30px** | 2.25rem | • Hero titles (mobile)<br>• H1 headings |
| `text-4xl` | 2.25rem | **36px** | 2.5rem | • Hero titles (tablet)<br>• Large headings |
| `text-5xl` | 3rem | **48px** | 1 | • Hero titles (desktop)<br>• Landing page hero |
| `text-6xl` | 3.75rem | **60px** | 1 | • Extra large hero |

### 🎯 Heading Defaults (Auto-applied)

```css
/* Bu stiller otomatik uygulanır - Override edilebilir */

h1 {
  font-size: var(--text-2xl);    /* 24px / 1.5rem */
  font-weight: 500;               /* Medium */
  line-height: 1.5;
}

h2 {
  font-size: var(--text-xl);     /* 20px / 1.25rem */
  font-weight: 500;
  line-height: 1.5;
}

h3 {
  font-size: var(--text-lg);     /* 18px / 1.125rem */
  font-weight: 500;
  line-height: 1.5;
}

h4 {
  font-size: var(--text-base);   /* 16px / 1rem */
  font-weight: 500;
  line-height: 1.5;
}

label, button {
  font-size: var(--text-base);
  font-weight: 500;
}

input {
  font-size: var(--text-base);
  font-weight: 400;
}
```

### ✍️ Tipografi Kullanım Örnekleri

```jsx
// ============================================
// HERO SECTION TYPOGRAPHY
// ============================================
<section>
  {/* Badge - text-sm */}
  <span className="text-sm font-medium">
    🏆 Skill-based Football Analysis
  </span>

  {/* Hero Title - Responsive */}
  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
    Football Intelligence Platform
  </h1>

  {/* Hero Description */}
  <p className="text-lg md:text-xl text-muted-foreground">
    Analyze matches like a pro
  </p>
</section>

// ============================================
// FEATURE CARD TYPOGRAPHY
// ============================================
<div className="bg-card">
  {/* Card Title */}
  <h3 className="text-xl font-medium">
    Advanced Analytics
  </h3>

  {/* Card Description */}
  <p className="text-base text-muted-foreground">
    Deep dive into match statistics...
  </p>

  {/* Small label */}
  <span className="text-sm text-secondary">
    Premium Feature
  </span>
</div>

// ============================================
// BUTTON TYPOGRAPHY
// ============================================
<button className="text-base font-medium">
  Join Waitlist
</button>

<button className="text-sm font-medium">
  Learn More
</button>

// ============================================
// FORM TYPOGRAPHY
// ============================================
<label className="text-sm font-medium">
  Email Address
</label>

<input 
  className="text-base font-normal"
  placeholder="your@email.com"
/>

<span className="text-xs text-muted-foreground">
  We'll never share your email
</span>
```

### 📐 Line Height Sistem

| Class | Value | Kullanım |
|-------|-------|----------|
| `leading-none` | 1 | Başlıklar (sıkı) |
| `leading-tight` | 1.25 | Başlıklar |
| `leading-snug` | 1.375 | Alt başlıklar |
| `leading-normal` | 1.5 | Body text (default) |
| `leading-relaxed` | 1.625 | Uzun paragraflar |
| `leading-loose` | 2 | Çok uzun metinler |

---

## 4. Spacing ve Layout Sistemi

### 📏 Tailwind Spacing Scale (4px grid)

| Tailwind | Value | Pixels | Kullanım Alanı |
|----------|-------|--------|----------------|
| `0` | 0 | 0px | Reset |
| `0.5` | 0.125rem | 2px | Çok küçük gaps |
| `1` | 0.25rem | **4px** | Icon padding, tight gaps |
| `2` | 0.5rem | **8px** | Button padding (vertical) |
| `3` | 0.75rem | **12px** | Button padding (horizontal) |
| `4` | 1rem | **16px** | Card padding, default gap |
| `5` | 1.25rem | 20px | Medium gaps |
| `6` | 1.5rem | **24px** | Section padding, card padding |
| `8` | 2rem | **32px** | Large gaps |
| `10` | 2.5rem | 40px | Section spacing |
| `12` | 3rem | **48px** | Section padding (mobile) |
| `16` | 4rem | **64px** | Section padding (tablet) |
| `20` | 5rem | **80px** | Section padding (desktop) |
| `24` | 6rem | 96px | Large section spacing |
| `32` | 8rem | 128px | XL section spacing |

### 📦 Padding Patterns (En Çok Kullanılan)

```jsx
// ============================================
// SECTION PADDING (Responsive)
// ============================================

// Hero Section
<section className="py-12 md:py-16 lg:py-20">
  {/* Mobile: 48px, Tablet: 64px, Desktop: 80px */}
</section>

// Standard Section
<section className="py-12 md:py-16">
  {/* Mobile: 48px, Tablet+: 64px */}
</section>

// Tight Section
<section className="py-8 md:py-12">
  {/* Mobile: 32px, Tablet+: 48px */}
</section>

// ============================================
// CARD PADDING
// ============================================

// Standard Card
<div className="p-6">
  {/* 24px all sides */}
</div>

// Large Card
<div className="p-8">
  {/* 32px all sides */}
</div>

// Small Card
<div className="p-4">
  {/* 16px all sides */}
</div>

// ============================================
// BUTTON PADDING
// ============================================

// Default Button
<button className="px-4 py-2">
  {/* Horizontal: 16px, Vertical: 8px */}
</button>

// Large Button
<button className="px-6 py-3">
  {/* Horizontal: 24px, Vertical: 12px */}
</button>

// Small Button
<button className="px-3 py-1.5">
  {/* Horizontal: 12px, Vertical: 6px */}
</button>

// ============================================
// CONTAINER PADDING
// ============================================

// Page container
<div className="container mx-auto px-4">
  {/* Max-width: 1280px, Side padding: 16px */}
</div>

// Wide container
<div className="container mx-auto px-4 max-w-7xl">
  {/* Max-width: 1280px */}
</div>

// Narrow container
<div className="container mx-auto px-4 max-w-4xl">
  {/* Max-width: 896px (blog, legal) */}
</div>
```

### 📐 Gap System (Flexbox/Grid)

```jsx
// ============================================
// FLEX GAPS
// ============================================

// Small gap (8px)
<div className="flex gap-2">

// Medium gap (16px) - MOST COMMON
<div className="flex gap-4">

// Large gap (24px)
<div className="flex gap-6">

// XL gap (32px)
<div className="flex gap-8">

// ============================================
// GRID GAPS
// ============================================

// Feature grid
<div className="grid grid-cols-3 gap-6">
  {/* 24px gap between items */}
</div>

// Blog grid
<div className="grid grid-cols-2 gap-8">
  {/* 32px gap */}
</div>

// Footer grid
<div className="grid grid-cols-4 gap-8">
  {/* 32px gap */}
</div>
```

### 🎯 Border Radius System

```css
--radius: 0.5rem;  /* 8px - Base */

/* Variants */
--radius-sm: 4px;   /* Küçük - Pills, tags */
--radius-md: 6px;   /* Orta - Small buttons */
--radius-lg: 8px;   /* Büyük - Cards (default) */
--radius-xl: 12px;  /* XL - Hero cards */
```

```jsx
// Tailwind classes
<div className="rounded-sm">    {/* 4px */}
<div className="rounded-md">    {/* 6px */}
<div className="rounded-lg">    {/* 8px - MOST COMMON */}
<div className="rounded-xl">    {/* 12px */}
<div className="rounded-2xl">   {/* 16px */}
<div className="rounded-full">  {/* 9999px - Pills/Badges */}
```

---

## 5. Responsive Tasarım

### 📱 Breakpoint Sistemi (Mobile-First)

| Breakpoint | Min Width | Device Type | Prefix | Örnek |
|------------|-----------|-------------|--------|-------|
| **xs** | 0px - 639px | Mobile (default) | *(yok)* | `text-base` |
| **sm** | 640px+ | Large Mobile / Small Tablet | `sm:` | `sm:text-lg` |
| **md** | 768px+ | Tablet | `md:` | `md:text-xl` |
| **lg** | 1024px+ | Desktop | `lg:` | `lg:text-2xl` |
| **xl** | 1280px+ | Large Desktop | `xl:` | `xl:text-3xl` |
| **2xl** | 1536px+ | Extra Large | `2xl:` | `2xl:text-4xl` |

### 🎯 Responsive Patterns (En Çok Kullanılan)

```jsx
// ============================================
// LAYOUT - STACK → ROW
// ============================================

<div className="
  flex 
  flex-col          /* Mobile: vertical stack */
  md:flex-row       /* Tablet+: horizontal */
  gap-4 
  md:gap-6
">

// ============================================
// TYPOGRAPHY - RESPONSIVE SIZES
// ============================================

// Hero Title
<h1 className="
  text-3xl          /* Mobile: 30px */
  md:text-4xl       /* Tablet: 36px */
  lg:text-5xl       /* Desktop: 48px */
">

// Section Title
<h2 className="
  text-2xl          /* Mobile: 24px */
  md:text-3xl       /* Tablet: 30px */
  lg:text-4xl       /* Desktop: 36px */
">

// Body Text
<p className="
  text-base         /* Mobile: 16px */
  md:text-lg        /* Tablet+: 18px */
">

// ============================================
// GRID - RESPONSIVE COLUMNS
// ============================================

// 1 → 2 → 3 columns
<div className="
  grid 
  grid-cols-1       /* Mobile: 1 column */
  md:grid-cols-2    /* Tablet: 2 columns */
  lg:grid-cols-3    /* Desktop: 3 columns */
  gap-6
">

// 1 → 2 columns
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  gap-8
">

// 1 → 4 columns (Footer)
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-4 
  gap-8
">

// ============================================
// SPACING - RESPONSIVE PADDING
// ============================================

// Section padding
<section className="
  py-12            /* Mobile: 48px */
  md:py-16         /* Tablet: 64px */
  lg:py-20         /* Desktop: 80px */
">

// Container padding
<div className="
  px-4             /* Mobile: 16px */
  md:px-6          /* Tablet: 24px */
  lg:px-8          /* Desktop: 32px */
">

// ============================================
// VISIBILITY - HIDE/SHOW
// ============================================

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="block md:hidden">

// Mobile menu example
<button className="md:hidden">  {/* Hamburger */}
<nav className="hidden md:flex"> {/* Desktop nav */}

// ============================================
// WIDTH - RESPONSIVE MAX-WIDTH
// ============================================

<div className="
  w-full           /* Mobile: 100% */
  md:w-1/2         /* Tablet: 50% */
  lg:w-1/3         /* Desktop: 33.33% */
">
```

### 📐 Common Component Responsive Patterns

```jsx
// ============================================
// HERO SECTION
// ============================================
<section className="
  bg-primary 
  text-primary-foreground 
  py-12 md:py-20 lg:py-28
">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl mx-auto text-center space-y-6">
      {/* Badge */}
      <span className="
        text-sm md:text-base 
        px-3 py-1.5 md:px-4 md:py-2
      ">
      
      {/* Title */}
      <h1 className="
        text-4xl md:text-5xl lg:text-6xl 
        font-bold
      ">
      
      {/* Description */}
      <p className="
        text-lg md:text-xl 
        max-w-2xl mx-auto
      ">
      
      {/* CTA Buttons */}
      <div className="
        flex 
        flex-col sm:flex-row 
        gap-4 
        justify-center
      ">
        <Button size="lg" className="w-full sm:w-auto">
        <Button size="lg" className="w-full sm:w-auto">
      </div>
    </div>
  </div>
</section>

// ============================================
// FEATURE CARDS
// ============================================
<section className="py-12 md:py-16 lg:py-20">
  <div className="container mx-auto px-4">
    {/* Section Header */}
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
      <p className="text-lg md:text-xl text-muted-foreground">
    </div>
    
    {/* Cards Grid */}
    <div className="
      grid 
      grid-cols-1 md:grid-cols-2 lg:grid-cols-3 
      gap-6 lg:gap-8
    ">
      <Card className="p-6 md:p-8">
        {/* Card content */}
      </Card>
    </div>
  </div>
</section>

// ============================================
// FOOTER
// ============================================
<footer className="bg-primary text-primary-foreground py-12">
  <div className="container mx-auto px-4">
    <div className="
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      md:grid-cols-4 
      gap-8
    ">
      {/* Footer columns */}
    </div>
  </div>
</footer>
```

---

## 6. Dark Mode Sistemi

### 🌓 Dark Mode Implementasyonu

```tsx
// ThemeContext.tsx
const [theme, setTheme] = useState<'light' | 'dark'>('light');

// Auto-detect system preference
useEffect(() => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(isDark ? 'dark' : 'light');
}, []);

// Apply to HTML
<html className={theme === 'dark' ? 'dark' : ''}>
```

### 🎨 Dark Mode Renk Farklılıkları

| Element | Light Mode | Dark Mode | Neden Değişti? |
|---------|------------|-----------|----------------|
| **Background** | `#fafaf9` (açık bej) | `#121212` (siyah) | Göz yorgunluğu azaltmak |
| **Foreground** | `#0F2A24` (koyu yeşil) | `#E6E6E6` (açık gri) | Kontrast sağlamak |
| **Primary** | `#0F2A24` (koyu) | `#1FA2A6` (parlak turkuaz) | Dark'ta daha görünür olması |
| **Secondary** | `#1FA2A6` (turkuaz) | `#C9A44C` (altın) | Renk çeşitliliği |
| **Card** | `#ffffff` (beyaz) | `#0F2A24` (koyu yeşil) | Katmanlı görünüm |
| **Muted** | `#E6E6E6` (açık gri) | `#0F2A24` (koyu yeşil) | Subtle contrast |

### ✅ Dark Mode Kullanım Örnekleri

```jsx
// ============================================
// AUTO DARK MODE SUPPORT
// ============================================

// Bu classlar otomatik dark mode'a geçer
<div className="bg-background text-foreground">
  {/* Light: #fafaf9 + #0F2A24 */}
  {/* Dark: #121212 + #E6E6E6 */}
</div>

<div className="bg-card text-card-foreground">
  {/* Light: #ffffff + #0F2A24 */}
  {/* Dark: #0F2A24 + #E6E6E6 */}
</div>

<button className="bg-primary text-primary-foreground">
  {/* Light: #0F2A24 (koyu yeşil) + beyaz */}
  {/* Dark: #1FA2A6 (turkuaz) + beyaz */}
</button>

// ============================================
// MANUAL DARK MODE CLASSES
// ============================================

// Explicitly set dark mode color
<div className="dark:bg-slate-800 dark:text-white">

// Border in dark mode
<div className="border dark:border-white/10">

// Hover state dark mode
<button className="
  hover:bg-gray-100 
  dark:hover:bg-gray-800
">
```

### 🔧 Dark Mode Toggle Button

```jsx
// Component örneği
<button
  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
  className="
    p-2 
    rounded-lg 
    bg-muted 
    hover:bg-muted/80
  "
  aria-label="Toggle theme"
>
  {theme === 'light' ? (
    <Moon className="size-5" />
  ) : (
    <Sun className="size-5" />
  )}
</button>
```

---

## 7. Component Kütüphanesi

### 🔘 Button Component

```tsx
// 5 Variant + 4 Size
<Button variant="default" size="default">Primary</Button>
<Button variant="secondary" size="lg">Secondary</Button>
<Button variant="outline" size="sm">Outline</Button>
<Button variant="ghost" size="icon">Ghost</Button>
<Button variant="destructive" size="default">Delete</Button>

// Kullanım örnekleri
<Button 
  variant="default" 
  size="lg"
  className="w-full md:w-auto"
>
  Join Waitlist
</Button>
```

**Button Variants:**

| Variant | Background | Text | Border | Kullanım |
|---------|-----------|------|--------|----------|
| `default` | Primary | White | None | Ana CTA butonları |
| `secondary` | Secondary | White | None | İkincil aksiyonlar |
| `outline` | Transparent | Foreground | Border | Alternatif seçenekler |
| `ghost` | Transparent | Foreground | None | Subtle actions |
| `destructive` | Error | White | None | Silme/İptal |
| `link` | Transparent | Primary | None | Text link |

**Button Sizes:**

| Size | Height | Padding | Icon Size | Kullanım |
|------|--------|---------|-----------|----------|
| `sm` | 32px | 12px/24px | 16px | Small actions |
| `default` | 36px | 16px/32px | 16px | Standard buttons |
| `lg` | 40px | 24px/48px | 20px | Hero CTA, emphasis |
| `icon` | 36px | Square | 20px | Icon-only |

### 🃏 Card Component

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
} from '@/app/components/ui/card';

<Card className="p-6 hover:shadow-lg hover:-translate-y-1 transition-all">
  <CardHeader>
    <CardTitle>Advanced Analytics</CardTitle>
    <CardDescription>Deep insights into performance</CardDescription>
  </CardHeader>
  
  <CardContent>
    <p className="text-muted-foreground">
      Analyze match statistics...
    </p>
  </CardContent>
  
  <CardFooter>
    <Button variant="ghost">Learn More</Button>
  </CardFooter>
</Card>
```

### 🏷️ Badge Component

```tsx
<Badge variant="default">Premium</Badge>
<Badge variant="secondary">New</Badge>
<Badge variant="outline">Beta</Badge>
<Badge variant="destructive">Deprecated</Badge>

// Custom badge
<span className="
  inline-flex items-center
  bg-secondary/10 
  text-secondary 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-medium
">
  ⚽ Football
</span>
```

### 📝 Form Components

```tsx
// Input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="your@email.com"
    className="w-full"
  />
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea 
    id="message" 
    placeholder="Type your message..."
    className="min-h-32"
  />
</div>

// Checkbox
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to terms</Label>
</div>

// Switch
<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>

// Select
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### 💬 Dialog/Modal Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Modal description text here
      </DialogDescription>
    </DialogHeader>
    
    {/* Modal content */}
    <div className="space-y-4">
      {/* ... */}
    </div>
  </DialogContent>
</Dialog>
```

---

## 8. Animasyon ve Geçişler

### ✨ CSS Animations (Global)

```css
/* Fade in (applied to all sections automatically) */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

section {
  animation: fade-in 0.6s ease-out;
}
```

### 🎭 Transition Classes

```jsx
// ============================================
// BASIC TRANSITIONS
// ============================================

// Colors only (150ms)
<div className="transition-colors">

// Transform only
<div className="transition-transform">

// All properties
<div className="transition-all">

// Custom duration
<div className="transition-all duration-300">

// ============================================
// HOVER EFFECTS
// ============================================

// Card hover (lift + shadow)
<div className="
  transition-all 
  hover:shadow-lg 
  hover:-translate-y-1
">

// Button hover (scale)
<button className="
  transition-transform 
  hover:scale-105
">

// Background hover
<button className="
  transition-colors 
  hover:bg-primary/90
">

// ============================================
// FOCUS STATES
// ============================================

// Input focus (ring)
<input className="
  transition-all
  focus:ring-2 
  focus:ring-ring 
  focus:border-ring
">

// Button focus
<button className="
  transition-all
  focus:ring-2 
  focus:ring-offset-2 
  focus:ring-ring
">
```

### 🎨 Animation Duration

| Class | Duration | Kullanım |
|-------|----------|----------|
| `duration-75` | 75ms | Very fast |
| `duration-100` | 100ms | Fast |
| `duration-150` | 150ms | **Default** |
| `duration-200` | 200ms | Standard |
| `duration-300` | 300ms | Smooth |
| `duration-500` | 500ms | Slow |
| `duration-700` | 700ms | Very slow |

### 🎯 Animation Examples

```jsx
// ============================================
// CARD HOVER ANIMATION
// ============================================
<div className="
  bg-card 
  rounded-lg 
  border 
  p-6 
  transition-all 
  duration-300 
  ease-in-out
  hover:shadow-xl 
  hover:-translate-y-2
  hover:border-secondary
">
  {/* Card content */}
</div>

// ============================================
// BUTTON PRESS ANIMATION
// ============================================
<button className="
  transition-all 
  active:scale-95
  hover:scale-105
">
  Click Me
</button>

// ============================================
// FADE IN ON SCROLL (with motion/react)
// ============================================
import { motion } from 'motion/react';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  {/* Content */}
</motion.div>
```

---

## 9. RTL Desteği

### 🌐 RTL Konfigürasyonu

```tsx
// LanguageContext.tsx
const isRTL = language === 'ar';

// Apply to HTML
<html dir={isRTL ? 'rtl' : 'ltr'} lang={language}>
```

### 📝 RTL-Friendly Classes

| ❌ Bad (Not RTL-aware) | ✅ Good (RTL-aware) | Açıklama |
|------------------------|---------------------|----------|
| `ml-4` (margin-left) | `ms-4` (margin-start) | LTR: left, RTL: right |
| `mr-4` (margin-right) | `me-4` (margin-end) | LTR: right, RTL: left |
| `pl-4` (padding-left) | `ps-4` (padding-start) | Padding start |
| `pr-4` (padding-right) | `pe-4` (padding-end) | Padding end |
| `text-left` | `text-start` | Align to reading direction |
| `text-right` | `text-end` | Align to end |

### 🔄 RTL Examples

```jsx
// ============================================
// MARGINS (RTL-aware)
// ============================================

// ❌ BAD - Always left margin
<div className="ml-4">

// ✅ GOOD - Margin at start (left in LTR, right in RTL)
<div className="ms-4">

// ============================================
// TEXT ALIGNMENT
// ============================================

// ❌ BAD - Always left align
<p className="text-left">

// ✅ GOOD - Align to reading direction
<p className="text-start">

// ============================================
// FLEX DIRECTION
// ============================================

// ❌ BAD - Fixed order
<div className="flex">
  <Icon />
  <Text />
</div>

// ✅ GOOD - Respects reading direction
<div className="flex flex-row">
  <Icon className="me-2" />  {/* End margin */}
  <Text />
</div>

// ============================================
// COMPLETE RTL EXAMPLE
// ============================================
<div className="
  flex 
  items-center 
  gap-3 
  ps-4              /* Padding start */
  text-start        /* Text align start */
">
  <Icon className="me-2" />  /* Margin end */
  <span>Text content</span>
</div>
```

---

## 10. Accessibility (Erişilebilirlik)

### ♿ Focus States

```css
/* Global focus ring */
* {
  @apply outline-ring/50;
}

--ring: #1FA2A6;  /* Secondary color */
```

```jsx
// Button focus
<button className="
  focus:ring-2 
  focus:ring-ring 
  focus:ring-offset-2 
  focus:outline-none
">

// Input focus
<input className="
  focus:border-ring 
  focus:ring-2 
  focus:ring-ring 
  focus:ring-offset-0
">
```

### 🎨 Color Contrast Ratios (WCAG AA/AAA)

| Combination | Ratio | Standard | Status |
|-------------|-------|----------|--------|
| Primary (#0F2A24) on White | 13.5:1 | AAA | ✅ |
| Secondary (#1FA2A6) on White | 3.9:1 | Large text only | ⚠️ |
| Accent (#C9A44C) on Primary | 5.2:1 | AA | ✅ |
| Light text (#E6E6E6) on Dark (#121212) | 10.8:1 | AAA | ✅ |

### 🏷️ ARIA Labels

```jsx
// Icon-only button
<button aria-label="Close menu">
  <X className="size-4" />
</button>

// Screen reader only text
<button>
  <Trash2 className="size-4" />
  <span className="sr-only">Delete item</span>
</button>

// Language switcher
<select aria-label="Select language">
  <option value="en">English</option>
  <option value="tr">Türkçe</option>
</select>

// Form labels (always pair with input)
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

### 📱 Keyboard Navigation

```jsx
// Tab index
<div tabIndex={0} role="button">

// Skip to content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>

// Dialog close on Escape (auto-handled by Radix UI)
<Dialog>
  {/* Closes on Esc automatically */}
</Dialog>
```

---

## 📚 Ek Kaynaklar

### 📁 Dosya Konumları

```
/src/styles/
├── index.css          # Ana stil dosyası
├── tailwind.css       # Tailwind imports
├── theme.css          # Renk token'ları
└── fonts.css          # Font imports

/src/app/components/ui/
├── button.tsx         # Button component
├── card.tsx           # Card component
├── dialog.tsx         # Modal/Dialog
└── ...                # Diğer UI components

/src/translations/
├── tr.ts              # Türkçe
├── en.ts              # İngilizce
├── de.ts              # Almanca
├── fr.ts              # Fransızca
├── es.ts              # İspanyolca
├── it.ts              # İtalyanca
├── ar.ts              # Arapça
└── zh.ts              # Çince
```

### 🔗 Kullanışlı Linkler

- **Tailwind CSS v4 Docs:** https://tailwindcss.com/docs
- **Radix UI:** https://radix-ui.com
- **Lucide Icons:** https://lucide.dev
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref

### ✅ Component Checklist

Yeni component oluştururken:

- [ ] Semantic color tokens kullan (`bg-primary`, not `bg-[#0F2A24]`)
- [ ] Responsive classes ekle (mobile-first)
- [ ] Hover ve focus states ekle
- [ ] Light ve Dark mode'da test et
- [ ] RTL layout kontrol et (Arapça)
- [ ] Accessibility kontrol et (kontrast, focus, ARIA)
- [ ] 4px spacing grid kullan
- [ ] Smooth transition'lar ekle
- [ ] forwardRef kullan (ref forwarding)
- [ ] displayName ekle (DevTools için)

---

**© 2025 TacticIQ.app - Kapsamlı Tasarım Sistemi Dokümantasyonu**
