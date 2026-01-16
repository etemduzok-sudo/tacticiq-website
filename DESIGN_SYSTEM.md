# 🎨 TacticIQ Design System & Style Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Framework:** React 18 + TypeScript + Tailwind CSS v4

---

## 📋 Table of Contents

1. [Brand Colors](#brand-colors)
2. [Color Palette - Light Mode](#color-palette-light-mode)
3. [Color Palette - Dark Mode](#color-palette-dark-mode)
4. [Typography System](#typography-system)
5. [Spacing & Layout](#spacing--layout)
6. [Component Variants](#component-variants)
7. [Animations & Transitions](#animations--transitions)
8. [Responsive Breakpoints](#responsive-breakpoints)
9. [RTL Support](#rtl-support)
10. [Accessibility](#accessibility)

---

## 🎨 Brand Colors

TacticIQ kullanır **3 ana marka rengi** + 3 sistem rengi:

### Core Brand Identity

```css
/* Primary - Koyu yeşil/deniz mavisi (Ana marka rengi) */
--color-brand-primary: #0F2A24

/* Secondary - Açık turkuaz/cyan (İkincil marka rengi) */
--color-brand-secondary: #1FA2A6

/* Accent - Altın/sarı (Vurgu rengi - rozet, başarı, premium) */
--color-brand-accent: #C9A44C

/* Error/Destructive - Koyu kırmızı (Hata mesajları) */
--color-brand-error: #8C3A3A

/* Dark - Koyu arka plan (Dark mode ana rengi) */
--color-brand-dark: #121212

/* Light - Açık arka plan (Light mode vurgu rengi) */
--color-brand-light: #E6E6E6
```

### 🎯 Renk Kullanım Kuralları

| Renk | Hex Code | Kullanım Alanları | Örnekler |
|------|----------|-------------------|----------|
| **Primary** | `#0F2A24` | Ana butonlar, başlıklar, header, footer | Header background, primary buttons |
| **Secondary** | `#1FA2A6` | CTA butonlar, linkler, iconlar | "Join Waitlist" button, hover states |
| **Accent** | `#C9A44C` | Premium özellikler, rozetler, vurgular | Pro badge, achievement stars |
| **Error** | `#8C3A3A` | Hata mesajları, uyarılar, silme işlemleri | Delete buttons, error toasts |
| **Dark** | `#121212` | Dark mode arka planı | Body background (dark mode) |
| **Light** | `#E6E6E6` | Light mode vurgu, muted text | Muted backgrounds, dividers |

---

## 🌞 Color Palette - Light Mode

### Semantic Colors (Light Theme)

```css
:root {
  /* Background & Surfaces */
  --background: #fafaf9;              /* Ana arka plan (açık bej) */
  --foreground: #0F2A24;              /* Ana metin rengi (koyu yeşil) */
  --card: #ffffff;                     /* Kart arka planı (beyaz) */
  --card-foreground: #0F2A24;         /* Kart metin rengi */
  
  /* Popover & Dialogs */
  --popover: #ffffff;                  /* Popup arka planı */
  --popover-foreground: #0F2A24;      /* Popup metin rengi */
  
  /* Interactive Elements */
  --primary: #0F2A24;                  /* Primary buton rengi */
  --primary-foreground: #ffffff;       /* Primary buton text */
  --secondary: #1FA2A6;                /* Secondary buton rengi */
  --secondary-foreground: #ffffff;     /* Secondary buton text */
  
  /* Muted & Subtle */
  --muted: #E6E6E6;                    /* Muted arka plan */
  --muted-foreground: #0F2A24;        /* Muted metin rengi */
  
  /* Accent & Highlights */
  --accent: #C9A44C;                   /* Vurgu rengi (altın) */
  --accent-foreground: #0F2A24;       /* Accent text rengi */
  
  /* Destructive Actions */
  --destructive: #8C3A3A;              /* Hata/silme rengi */
  --destructive-foreground: #ffffff;   /* Destructive text */
  
  /* Borders & Inputs */
  --border: rgba(15, 42, 36, 0.1);    /* Border rengi (10% opacity) */
  --input: transparent;                 /* Input border (şeffaf) */
  --input-background: #f3f3f5;         /* Input arka plan */
  --switch-background: #cbced4;        /* Toggle/switch rengi */
  --ring: #1FA2A6;                     /* Focus ring (secondary) */
  
  /* Chart Colors */
  --chart-1: #1FA2A6;                  /* Ana chart rengi (turkuaz) */
  --chart-2: #C9A44C;                  /* İkincil chart (altın) */
  --chart-3: #0F2A24;                  /* Üçüncü chart (koyu yeşil) */
  --chart-4: #8C3A3A;                  /* Dördüncü chart (kırmızı) */
  --chart-5: #E6E6E6;                  /* Beşinci chart (açık gri) */
}
```

### 🎨 Tailwind Class Kullanımı (Light Mode)

```jsx
// Background & Text
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="bg-muted text-muted-foreground">

// Buttons
<button className="bg-primary text-primary-foreground">Primary</button>
<button className="bg-secondary text-secondary-foreground">Secondary</button>
<button className="bg-accent text-accent-foreground">Accent</button>
<button className="bg-destructive text-destructive-foreground">Delete</button>

// Borders
<div className="border border-border">
<input className="bg-input-background border-border">
```

---

## 🌙 Color Palette - Dark Mode

### Semantic Colors (Dark Theme)

```css
.dark {
  /* Background & Surfaces */
  --background: #121212;               /* Ana arka plan (siyah) */
  --foreground: #E6E6E6;              /* Ana metin rengi (açık gri) */
  --card: #0F2A24;                     /* Kart arka planı (koyu yeşil) */
  --card-foreground: #E6E6E6;         /* Kart metin rengi */
  
  /* Popover & Dialogs */
  --popover: #0F2A24;                  /* Popup arka planı */
  --popover-foreground: #E6E6E6;      /* Popup metin rengi */
  
  /* Interactive Elements */
  --primary: #1FA2A6;                  /* Primary buton (turkuaz) */
  --primary-foreground: #ffffff;       /* Primary text */
  --secondary: #C9A44C;                /* Secondary buton (altın) */
  --secondary-foreground: #0F2A24;    /* Secondary text (koyu) */
  
  /* Muted & Subtle */
  --muted: #0F2A24;                    /* Muted arka plan */
  --muted-foreground: #E6E6E6;        /* Muted text */
  
  /* Accent & Highlights */
  --accent: #C9A44C;                   /* Vurgu rengi (altın) */
  --accent-foreground: #0F2A24;       /* Accent text */
  
  /* Destructive Actions */
  --destructive: #8C3A3A;              /* Hata rengi */
  --destructive-foreground: #ffffff;   /* Destructive text */
  
  /* Borders & Inputs */
  --border: rgba(230, 230, 230, 0.1); /* Border (10% beyaz) */
  --input: rgba(230, 230, 230, 0.1);  /* Input border */
  --ring: #1FA2A6;                     /* Focus ring */
  
  /* Chart Colors (Adjusted for dark) */
  --chart-1: #1FA2A6;                  /* Turkuaz */
  --chart-2: #C9A44C;                  /* Altın */
  --chart-3: #E6E6E6;                  /* Açık gri */
  --chart-4: #8C3A3A;                  /* Kırmızı */
  --chart-5: #0F2A24;                  /* Koyu yeşil */
}
```

### 💡 Dark Mode Özel Notlar

- **Primary renk değişir:** Light'ta `#0F2A24`, Dark'ta `#1FA2A6`
- **Card arka planları:** Light'ta beyaz, Dark'ta koyu yeşil
- **Kontrast oranları:** WCAG AA standartlarına uygun (4.5:1 minimum)
- **Transparent overlay'ler:** Dark mode'da daha fazla opacity kullanılır

---

## ✍️ Typography System

### Font Configuration

```css
html {
  font-size: 16px;  /* Base font size */
}

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
```

### Heading Styles (Default - Override edilebilir)

```css
h1 {
  font-size: var(--text-2xl);        /* 2rem / 32px */
  font-weight: 500;
  line-height: 1.5;
}

h2 {
  font-size: var(--text-xl);         /* 1.5rem / 24px */
  font-weight: 500;
  line-height: 1.5;
}

h3 {
  font-size: var(--text-lg);         /* 1.25rem / 20px */
  font-weight: 500;
  line-height: 1.5;
}

h4 {
  font-size: var(--text-base);       /* 1rem / 16px */
  font-weight: 500;
  line-height: 1.5;
}
```

### Typography Scale (Tailwind Classes)

| Class | Size | Pixels | Use Case |
|-------|------|--------|----------|
| `text-xs` | 0.75rem | 12px | Captions, labels |
| `text-sm` | 0.875rem | 14px | Body text (small), secondary info |
| `text-base` | 1rem | 16px | Body text (default) |
| `text-lg` | 1.125rem | 18px | Emphasized text, subtitles |
| `text-xl` | 1.25rem | 20px | Section subtitles |
| `text-2xl` | 1.5rem | 24px | Page titles, h2 |
| `text-3xl` | 1.875rem | 30px | Hero titles |
| `text-4xl` | 2.25rem | 36px | Large hero titles |
| `text-5xl` | 3rem | 48px | Main hero title |

### Font Weight Classes

```jsx
<p className="font-normal">  {/* 400 */}
<p className="font-medium">  {/* 500 - Default for headings/buttons */}
<p className="font-semibold"> {/* 600 */}
<p className="font-bold">    {/* 700 - Use sparingly */}
```

### Typography Best Practices

✅ **DO:**
- Use `font-medium` for headings and buttons
- Use `text-base` for body text
- Maintain 1.5 line-height for readability
- Use semantic HTML (h1, h2, p) instead of styled divs

❌ **DON'T:**
- Don't use font sizes smaller than `text-xs` (12px)
- Don't override heading sizes unless absolutely necessary
- Don't use more than 3 font weights in a single component

---

## 📏 Spacing & Layout

### Border Radius System

```css
--radius: 0.5rem;  /* 8px - Base radius */

/* Variants */
--radius-sm: 4px;   /* Small - Pills, tags */
--radius-md: 6px;   /* Medium - Small buttons */
--radius-lg: 8px;   /* Large - Cards, panels (default) */
--radius-xl: 12px;  /* Extra large - Hero cards */
```

### Tailwind Spacing Classes (Used in Design)

| Spacing | Class | Pixels | Common Use |
|---------|-------|--------|------------|
| xs | `p-1` | 4px | Icon padding |
| sm | `p-2` | 8px | Tight spacing |
| md | `p-3` | 12px | Button padding |
| base | `p-4` | 16px | Card padding |
| lg | `p-6` | 24px | Section padding |
| xl | `p-8` | 32px | Hero section padding |
| 2xl | `p-12` | 48px | Large section gaps |
| 3xl | `p-16` | 64px | Page margins |

### Container & Max Widths

```jsx
// Standard container (used throughout site)
<div className="container mx-auto px-4">
  // Max-width: 1280px (default Tailwind container)
  // Side padding: 16px (px-4)
</div>

// Narrow content (blog, legal pages)
<div className="container mx-auto px-4 max-w-4xl">
  // Max-width: 896px
</div>

// Wide content (hero sections)
<div className="container mx-auto px-4 max-w-7xl">
  // Max-width: 1280px
</div>
```

### Grid System Examples

```jsx
// 3-column grid (features)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 2-column grid (blog cards)
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">

// 4-column grid (footer)
<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
```

---

## 🎯 Component Variants

### Button Styles

```jsx
// Primary - Main CTA
<Button variant="default" size="default">
  className="bg-primary text-primary-foreground hover:bg-primary/90"
</Button>

// Secondary - Alternative actions
<Button variant="secondary" size="default">
  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
</Button>

// Ghost - Subtle actions
<Button variant="ghost" size="sm">
  className="bg-transparent hover:bg-muted"
</Button>

// Outline - Bordered buttons
<Button variant="outline" size="default">
  className="border border-border bg-transparent hover:bg-muted"
</Button>

// Destructive - Delete/Remove
<Button variant="destructive" size="sm">
  className="bg-destructive text-destructive-foreground"
</Button>
```

### Card Styles

```jsx
// Standard card
<div className="bg-card text-card-foreground rounded-lg border p-6">

// Hoverable card (blog, features)
<div className="bg-card rounded-lg border p-6 transition-all hover:shadow-lg hover:-translate-y-1">

// Muted card (background sections)
<div className="bg-muted/30 rounded-lg p-6">

// Accent card (premium features)
<div className="bg-accent/10 border-accent/20 rounded-lg p-6">
```

### Badge/Pill Styles

```jsx
// Success badge
<span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm">

// Warning badge
<span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm">

// Premium badge
<span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">

// Category tag
<span className="bg-muted text-muted-foreground px-3 py-1 rounded text-xs">
```

---

## ✨ Animations & Transitions

### CSS Animations (Defined globally)

```css
/* Fade in from bottom */
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

/* Fade in up (larger movement) */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Auto-applied to all sections */
section {
  animation: fade-in 0.6s ease-out;
}
```

### Card Hover Effect

```css
.card-hover-effect {
  transition: all 0.3s ease;
}

.card-hover-effect:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

### Tailwind Transition Classes

```jsx
// Standard transition (150ms)
<div className="transition-colors">  {/* Color transitions */}
<div className="transition-transform"> {/* Transform transitions */}
<div className="transition-all">     {/* All properties */}

// Hover states
<button className="hover:bg-primary/90 hover:scale-105">
<div className="hover:shadow-lg hover:-translate-y-1">

// Focus states
<input className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
```

### Global Smooth Transitions

```css
/* Applied to ALL elements */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: ease-in-out;
  transition-duration: 150ms;
}
```

---

## 📱 Responsive Breakpoints

### Tailwind Breakpoints (Mobile-First)

| Breakpoint | Min Width | Device | Prefix |
|------------|-----------|--------|--------|
| **xs** | 0px | Mobile (default) | *(no prefix)* |
| **sm** | 640px | Large mobile | `sm:` |
| **md** | 768px | Tablet | `md:` |
| **lg** | 1024px | Desktop | `lg:` |
| **xl** | 1280px | Large desktop | `xl:` |
| **2xl** | 1536px | Extra large | `2xl:` |

### Responsive Design Patterns

```jsx
// Mobile-first approach (stack vertically by default)
<div className="
  flex flex-col          // Mobile: vertical stack
  md:flex-row            // Tablet+: horizontal row
  gap-4                  // 16px gap on all screens
  md:gap-6               // 24px gap on tablet+
">

// Text sizing
<h1 className="
  text-3xl               // Mobile: 30px
  md:text-4xl            // Tablet: 36px
  lg:text-5xl            // Desktop: 48px
">

// Padding/Spacing
<section className="
  py-12                  // Mobile: 48px vertical
  md:py-16               // Tablet: 64px vertical
  lg:py-20               // Desktop: 80px vertical
">

// Grid columns
<div className="
  grid
  grid-cols-1            // Mobile: 1 column
  md:grid-cols-2         // Tablet: 2 columns
  lg:grid-cols-3         // Desktop: 3 columns
">
```

### Common Responsive Patterns in TacticIQ

```jsx
// Hero Section
<section className="py-12 md:py-20 lg:py-28">
  <h1 className="text-3xl md:text-4xl lg:text-5xl">
  <p className="text-base md:text-lg">

// Feature Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Footer
<div className="grid grid-cols-1 md:grid-cols-4 gap-8">

// Blog Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 🌐 RTL Support

### RTL Configuration

```css
/* Defined in index.css */
[dir='rtl'] {
  direction: rtl;
}

[dir='ltr'] {
  direction: ltr;
}
```

### RTL Language Detection (Arabic)

```jsx
// In LanguageContext
const isRTL = language === 'ar';

<html dir={isRTL ? 'rtl' : 'ltr'}>
```

### RTL Best Practices

✅ **DO:**
- Use logical properties when possible: `margin-inline-start`, `padding-inline-end`
- Use Tailwind's RTL-aware classes: `ms-4` (margin-start), `me-4` (margin-end)
- Test all components in both LTR and RTL modes

❌ **DON'T:**
- Don't use `margin-left` or `margin-right` for directional spacing
- Don't hardcode text alignment (use `text-start` instead of `text-left`)

### RTL-Friendly Class Examples

```jsx
// ✅ GOOD - RTL aware
<div className="ms-4">      {/* margin-start (left in LTR, right in RTL) */}
<div className="me-4">      {/* margin-end (right in LTR, left in RTL) */}
<div className="text-start"> {/* Aligns to reading direction */}

// ❌ BAD - Not RTL aware
<div className="ml-4">      {/* Always left margin */}
<div className="mr-4">      {/* Always right margin */}
<div className="text-left">  {/* Always left align */}
```

---

## ♿ Accessibility

### Focus States

```css
/* Global focus ring */
* {
  @apply outline-ring/50;
}

--ring: #1FA2A6;  /* Secondary color for focus */
```

```jsx
// Button focus
<button className="focus:ring-2 focus:ring-ring focus:ring-offset-2">

// Input focus
<input className="focus:border-ring focus:ring-2 focus:ring-ring">
```

### Color Contrast Ratios

All color combinations meet **WCAG AA standards (4.5:1 minimum)**:

| Combination | Ratio | Status |
|-------------|-------|--------|
| Primary (#0F2A24) on White | 13.5:1 | ✅ AAA |
| Secondary (#1FA2A6) on White | 3.9:1 | ⚠️ Use for large text only |
| Accent (#C9A44C) on Primary | 5.2:1 | ✅ AA |
| Foreground on Background (Light) | 13.5:1 | ✅ AAA |
| Foreground on Background (Dark) | 10.8:1 | ✅ AAA |

### Semantic HTML

```jsx
// ✅ GOOD - Semantic
<header>
<nav>
  <ul><li><a href="#">
</nav>
<main>
  <section>
    <h2>
    <article>
<footer>

// ❌ BAD - Non-semantic
<div className="header">
<div className="nav">
```

### ARIA Labels

```jsx
// Icon-only buttons
<button aria-label="Close menu">
  <X className="size-4" />
</button>

// Screen reader only text
<span className="sr-only">Delete</span>

// Language switcher
<select aria-label="Select language">
```

---

## 🎨 Design Tokens Summary

### Quick Reference Table

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `background` | `#fafaf9` | `#121212` | Page background |
| `foreground` | `#0F2A24` | `#E6E6E6` | Text color |
| `primary` | `#0F2A24` | `#1FA2A6` | Primary actions |
| `secondary` | `#1FA2A6` | `#C9A44C` | Secondary actions |
| `accent` | `#C9A44C` | `#C9A44C` | Highlights |
| `destructive` | `#8C3A3A` | `#8C3A3A` | Errors/Delete |
| `muted` | `#E6E6E6` | `#0F2A24` | Subtle backgrounds |
| `border` | `rgba(15,42,36,0.1)` | `rgba(230,230,230,0.1)` | Borders |
| `radius` | `8px` | `8px` | Border radius |

---

## 🛠️ Usage Examples

### Complete Component Example

```jsx
import { Button } from '@/app/components/ui/button';

export function FeatureCard() {
  return (
    <div className="
      bg-card 
      text-card-foreground 
      rounded-lg 
      border 
      border-border 
      p-6 
      transition-all 
      hover:shadow-lg 
      hover:-translate-y-1
    ">
      <div className="flex items-center gap-3 mb-4">
        <div className="
          bg-secondary/10 
          text-secondary 
          p-3 
          rounded-lg
        ">
          <TrendingUp className="size-6" />
        </div>
        <h3 className="text-xl font-medium">
          Advanced Analytics
        </h3>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Deep dive into match statistics, player performance, 
        and tactical decisions with our AI-powered insights.
      </p>
      
      <div className="flex gap-3">
        <Button variant="default" size="default">
          Learn More
        </Button>
        <Button variant="ghost" size="default">
          Try Demo
        </Button>
      </div>
    </div>
  );
}
```

### Hero Section Example

```jsx
export function HeroSection() {
  return (
    <section className="
      bg-primary 
      text-primary-foreground 
      py-12 md:py-20 lg:py-28
    ">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-block">
            <span className="
              bg-secondary/10 
              text-secondary 
              px-4 py-2 
              rounded-full 
              text-sm 
              font-medium
            ">
              🏆 Skill-based Football Analysis
            </span>
          </div>
          
          {/* Title */}
          <h1 className="
            text-4xl md:text-5xl lg:text-6xl 
            font-bold 
            leading-tight
          ">
            Football Intelligence Platform
          </h1>
          
          {/* Description */}
          <p className="
            text-lg md:text-xl 
            text-primary-foreground/80
          ">
            Analyze matches like a pro. Make data-driven predictions 
            and improve your tactical knowledge.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              className="text-base md:text-lg px-8 py-6"
            >
              Join Waitlist
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base md:text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 📦 File Structure

```
/src/styles/
├── index.css          # Main entry, imports all styles
├── tailwind.css       # Tailwind directives
├── theme.css          # Color tokens, semantic variables
└── fonts.css          # Font imports (if any)

/src/app/components/ui/
├── button.tsx         # Button component with variants
├── card.tsx           # Card component
├── badge.tsx          # Badge/pill component
└── input.tsx          # Input component
```

---

## 🎯 Design Principles

### 1. **Consistency**
- Use design tokens (CSS variables) instead of hardcoded colors
- Maintain consistent spacing (4px grid system)
- Use semantic component variants

### 2. **Accessibility First**
- Minimum 4.5:1 contrast ratio for all text
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA labels where needed

### 3. **Mobile-First Responsive**
- Design for mobile, enhance for desktop
- Test on 320px minimum width
- Use responsive breakpoints appropriately

### 4. **Performance**
- Use CSS transitions (hardware accelerated)
- Avoid layout shifts (CLS)
- Optimize images with proper sizes

### 5. **Internationalization**
- RTL support for Arabic
- No hardcoded text
- Translation keys for all content
- Test in all 8 supported languages

---

## 🚀 Quick Start Checklist

When creating a new component:

- [ ] Use semantic color tokens (e.g., `bg-primary`, not `bg-[#0F2A24]`)
- [ ] Apply responsive classes (mobile-first)
- [ ] Add hover/focus states
- [ ] Test in light AND dark mode
- [ ] Verify RTL layout (if using Arabic)
- [ ] Check accessibility (contrast, focus, ARIA)
- [ ] Use appropriate spacing (4px grid)
- [ ] Add transitions for smooth interactions

---

## 📝 Notes

- **Tailwind v4** kullanıyoruz - config dosyası yok, CSS variables ile yönetiliyor
- **Dark mode** otomatik - sistem tercihine göre ya da manual toggle
- **8 dil desteği** - TR, EN, DE, FR, ES, IT, AR, ZH
- **Non-gambling vurgusu** - Tüm sayfalarda belirtilmeli
- **Marka renkleri değişmez** - Primary, Secondary, Accent sabittir

---

**© 2025 TacticIQ - Design System v1.0**
