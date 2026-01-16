# 🎨 TacticIQ - Style Quick Reference

**Hızlı Erişim:** En sık kullanılan renkler, class'lar ve pattern'ler

---

## 🎯 Marka Renkleri (Hex Codes)

```
Primary (Koyu Yeşil):    #0F2A24
Secondary (Turkuaz):     #1FA2A6  
Accent (Altın):          #C9A44C
Error (Kırmızı):         #8C3A3A
Dark (Siyah):            #121212
Light (Açık Gri):        #E6E6E6
```

---

## 🎨 Tailwind Class Cheat Sheet

### Renkler (Background + Text)

```jsx
// Primary
className="bg-primary text-primary-foreground"

// Secondary  
className="bg-secondary text-secondary-foreground"

// Accent
className="bg-accent text-accent-foreground"

// Card
className="bg-card text-card-foreground"

// Muted (subtle)
className="bg-muted text-muted-foreground"

// Destructive
className="bg-destructive text-destructive-foreground"
```

### Buttons - Hızlı Kullanım

```jsx
<Button variant="default">     {/* Primary - koyu yeşil */}
<Button variant="secondary">   {/* Turkuaz */}
<Button variant="ghost">       {/* Şeffaf */}
<Button variant="outline">     {/* Bordered */}
<Button variant="destructive"> {/* Kırmızı */}
```

### Spacing - Sık Kullanılanlar

```jsx
p-4      // 16px padding (card default)
p-6      // 24px padding (section)
p-8      // 32px padding (hero)
gap-4    // 16px gap (grid/flex)
gap-6    // 24px gap (cards)
space-y-4  // 16px vertical spacing
```

### Responsive Grid

```jsx
// 3 sütunlu grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 2 sütunlu grid  
className="grid grid-cols-1 md:grid-cols-2 gap-8"

// 4 sütunlu (footer)
className="grid grid-cols-1 md:grid-cols-4 gap-8"
```

### Text Sizes

```jsx
text-sm     // 14px - küçük metin
text-base   // 16px - varsayılan
text-lg     // 18px - vurgulu metin
text-xl     // 20px - alt başlık
text-2xl    // 24px - başlık
text-3xl    // 30px - büyük başlık
text-4xl    // 36px - hero başlık
text-5xl    // 48px - ana hero
```

### Border Radius

```jsx
rounded-sm    // 4px
rounded-md    // 6px
rounded-lg    // 8px (default)
rounded-xl    // 12px
rounded-full  // Tam yuvarlak (pill)
```

### Shadows & Hover

```jsx
// Hover effect (card)
className="transition-all hover:shadow-lg hover:-translate-y-1"

// Smooth transition
className="transition-colors"

// Focus ring
className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
```

---

## 🧩 Sık Kullanılan Component Patterns

### Feature Card

```jsx
<Card className="transition-all hover:shadow-lg hover:-translate-y-1">
  <CardHeader>
    <div className="bg-secondary/10 text-secondary p-3 rounded-lg w-fit">
      <Icon className="size-6" />
    </div>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Description</p>
  </CardContent>
</Card>
```

### Badge (Category Tag)

```jsx
<Badge variant="secondary" className="text-xs">
  Analysis
</Badge>

<Badge className="bg-accent text-accent-foreground">
  Premium ⭐
</Badge>
```

### Section Header

```jsx
<div className="text-center mb-12">
  <h2 className="text-3xl md:text-4xl font-bold mb-4">
    {title}
  </h2>
  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
    {subtitle}
  </p>
</div>
```

### Icon with Text

```jsx
<div className="flex items-center gap-2">
  <TrendingUp className="size-5 text-secondary" />
  <span>Analytics</span>
</div>
```

### Stat Display

```jsx
<div className="text-center">
  <div className="text-4xl font-bold text-secondary">150K+</div>
  <div className="text-sm text-muted-foreground">Active Users</div>
</div>
```

---

## 📱 Responsive Breakpoints

```jsx
// Mobile first!
className="
  text-3xl           // Mobile
  md:text-4xl        // Tablet (768px+)
  lg:text-5xl        // Desktop (1024px+)
"

className="
  py-12              // Mobile: 48px
  md:py-16           // Tablet: 64px  
  lg:py-20           // Desktop: 80px
"
```

---

## 🎨 Light/Dark Mode

### Otomatik Çalışır

```jsx
// Light mode: bg-white, text-black
// Dark mode: bg-card, text-foreground
<div className="bg-card text-card-foreground">

// Light: #0F2A24, Dark: #1FA2A6
<button className="bg-primary text-primary-foreground">
```

### Manuel Dark Mode Class

```jsx
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">
```

---

## 🌍 RTL Support (Arabic)

```jsx
// ✅ GOOD - RTL aware
<div className="ms-4">        // margin-start
<div className="me-4">        // margin-end  
<div className="text-start">  // text alignment

// ❌ BAD - Not RTL aware
<div className="ml-4">        // always left
<div className="mr-4">        // always right
<div className="text-left">   // always left
```

---

## 🔧 Sık Hatalar ve Çözümleri

### ❌ Hardcoded Color

```jsx
// YANLIŞ
<div className="bg-[#0F2A24]">

// DOĞRU
<div className="bg-primary">
```

### ❌ Hardcoded Text

```jsx
// YANLIŞ  
<button>Join Waitlist</button>

// DOĞRU
<button>{t('hero.cta.primary')}</button>
```

### ❌ Mobile Son

```jsx
// YANLIŞ
<div className="lg:grid-cols-3 md:grid-cols-2 grid-cols-1">

// DOĞRU (mobile first)
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### ❌ Accessibility Eksik

```jsx
// YANLIŞ
<button>
  <X className="size-4" />
</button>

// DOĞRU
<button aria-label="Close">
  <X className="size-4" />
  <span className="sr-only">Close</span>
</button>
```

---

## 🚀 Kopyala-Yapıştır Snippets

### Responsive Container

```jsx
<section className="py-16 md:py-24">
  <div className="container mx-auto px-4">
    {/* content */}
  </div>
</section>
```

### CTA Button Group

```jsx
<div className="flex flex-col sm:flex-row gap-4">
  <Button variant="secondary" size="lg">Primary Action</Button>
  <Button variant="outline" size="lg">Secondary Action</Button>
</div>
```

### Loading State

```jsx
<Button disabled>
  <Loader2 className="size-4 animate-spin mr-2" />
  Loading...
</Button>
```

### Toast Notification

```jsx
import { toast } from 'sonner';

toast.success('Saved successfully!');
toast.error('Something went wrong');
```

### Image with Overlay

```jsx
<div className="relative aspect-video rounded-lg overflow-hidden">
  <img src={url} className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
</div>
```

---

## 📋 Component Import Cheat Sheet

```jsx
// Buttons & Inputs
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

// Cards
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';

// Badges
import { Badge } from '@/app/components/ui/badge';

// Icons (lucide-react)
import { TrendingUp, Download, X, Check } from 'lucide-react';

// Toast
import { toast } from 'sonner';

// Language
import { useLanguage } from '@/contexts/LanguageContext';
const { t, language } = useLanguage();
```

---

## 🎯 Non-Gambling Vurgusu

**Her sayfada belirtilmeli:**

```jsx
// Hero badge
<Badge className="bg-secondary/10 text-secondary">
  🏆 Skill-based Analysis - Not Gambling
</Badge>

// Footer disclaimer
<p className="text-sm text-muted-foreground text-center">
  TacticIQ is not a gambling platform. 
  It's a skill-based football analysis game.
</p>

// Product description
<p className="text-lg text-muted-foreground">
  ❌ No deposits, no withdrawals, no real money
</p>
```

---

## ✅ Pre-Launch Checklist

- [ ] Tüm renkler semantic tokens kullanıyor (bg-primary değil bg-[#hex])
- [ ] Tüm metinler translation key'leri kullanıyor
- [ ] Light ve Dark mode test edildi
- [ ] Mobile, tablet, desktop responsive kontrol edildi
- [ ] RTL (Arabic) layout kontrol edildi
- [ ] Accessibility (ARIA labels, focus states) tamamlandı
- [ ] Non-gambling disclaimer tüm sayfalarda
- [ ] Images optimize edildi (WebP, lazy loading)
- [ ] Loading ve error states eklendi
- [ ] Toast notifications çalışıyor

---

**🎨 TacticIQ Design System - Ready to Use!**

Detaylı bilgi için:
- `DESIGN_SYSTEM.md` - Tam tasarım sistemi
- `COMPONENTS_GUIDE.md` - Component detayları
