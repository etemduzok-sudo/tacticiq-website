# ⚡ TacticIQ - Hızlı Referans Kılavuzu

> **Bu dosya:** Uygulama arayüzleri geliştirirken hızlı referans için kullan

---

## 🎨 RENK PALETİ - HIZLI KULLANIM

### Tailwind Class'ları (Direkt Kullan)

```jsx
// ===== ANA RENKLER =====
bg-primary              // Light: #0F2A24 (koyu yeşil), Dark: #1FA2A6 (turkuaz)
bg-secondary            // Light: #1FA2A6 (turkuaz), Dark: #C9A44C (altın)
bg-accent               // #C9A44C (altın) - her ikisinde de aynı
bg-destructive          // #8C3A3A (kırmızı) - hata/silme

// ===== YÜZEYLER =====
bg-background           // Sayfa arka planı (light: bej, dark: siyah)
bg-card                 // Kart arka planı (light: beyaz, dark: koyu yeşil)
bg-muted                // Hafif arka plan (light: açık gri, dark: koyu yeşil)

// ===== METİN =====
text-foreground         // Ana metin (light: koyu, dark: açık)
text-primary            // Primary metin
text-secondary          // Secondary metin
text-muted-foreground   // Hafif metin

// ===== BORDER =====
border-border           // Varsayılan border rengi
border-primary          // Primary border
border-secondary        // Secondary border
```

---

## 🔘 BUTON STİLLERİ

```jsx
// === PRIMARY (Ana CTA) ===
<Button variant="default" size="default">
  Join Waitlist
</Button>

// === SECONDARY (İkincil) ===
<Button variant="secondary" size="lg">
  Learn More
</Button>

// === OUTLINE (Bordered) ===
<Button variant="outline" size="default">
  Cancel
</Button>

// === GHOST (Subtle) ===
<Button variant="ghost" size="sm">
  Skip
</Button>

// === DESTRUCTIVE (Silme) ===
<Button variant="destructive" size="default">
  Delete
</Button>

// === RESPONSIVE WIDTH ===
<Button className="w-full md:w-auto">
  Responsive Button
</Button>
```

**Button Sizes:**
- `sm` → 32px height
- `default` → 36px height (MOST COMMON)
- `lg` → 40px height (Hero CTA)
- `icon` → 36px × 36px (Icon-only)

---

## 🃏 KART STİLLERİ

### Standart Kart
```jsx
<div className="bg-card text-card-foreground rounded-lg border p-6">
  {/* Content */}
</div>
```

### Hover Efektli Kart
```jsx
<div className="
  bg-card 
  rounded-lg 
  border 
  p-6 
  transition-all 
  hover:shadow-lg 
  hover:-translate-y-1
">
  {/* Content */}
</div>
```

### Muted Kart (Hafif arka plan)
```jsx
<div className="bg-muted/30 rounded-lg p-6">
  {/* Content */}
</div>
```

### Premium/Accent Kart
```jsx
<div className="
  bg-accent/10 
  border-accent/20 
  rounded-lg 
  p-6
">
  {/* Content */}
</div>
```

---

## 🏷️ BADGE/PILL STİLLERİ

```jsx
// === SUCCESS BADGE (Turkuaz) ===
<span className="
  bg-secondary/10 
  text-secondary 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-medium
">
  New Feature
</span>

// === PREMIUM BADGE (Altın) ===
<span className="
  bg-accent 
  text-accent-foreground 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-medium
">
  ⭐ Premium
</span>

// === CATEGORY TAG (Muted) ===
<span className="
  bg-muted 
  text-muted-foreground 
  px-3 py-1 
  rounded 
  text-xs
">
  Football
</span>

// === WARNING BADGE ===
<span className="
  bg-accent/10 
  text-accent 
  px-3 py-1 
  rounded-full 
  text-sm
">
  ⚠️ Beta
</span>
```

---

## 📝 TİPOGRAFİ - HIZLI REFERANS

### Heading Sizes (Responsive)
```jsx
// === HERO TITLE ===
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Main Hero Title
</h1>

// === SECTION TITLE ===
<h2 className="text-2xl md:text-3xl lg:text-4xl font-medium">
  Section Title
</h2>

// === SUBSECTION TITLE ===
<h3 className="text-xl md:text-2xl font-medium">
  Subsection Title
</h3>

// === CARD TITLE ===
<h4 className="text-lg md:text-xl font-medium">
  Card Title
</h4>
```

### Text Sizes
```jsx
text-xs       // 12px - Captions, timestamps
text-sm       // 14px - Secondary text, labels
text-base     // 16px - Body text (DEFAULT)
text-lg       // 18px - Emphasized text
text-xl       // 20px - Card titles
text-2xl      // 24px - Section titles
text-3xl      // 30px - Hero (mobile)
text-4xl      // 36px - Hero (tablet)
text-5xl      // 48px - Hero (desktop)
```

### Font Weights
```jsx
font-normal   // 400 - Body text
font-medium   // 500 - Headings, buttons (DEFAULT for emphasis)
font-semibold // 600 - Strong emphasis
font-bold     // 700 - Very strong (use sparingly)
```

---

## 📏 SPACING - EN ÇOK KULLANILAN

### Padding (p-)
```jsx
p-1    // 4px  - Icon padding
p-2    // 8px  - Tight padding
p-3    // 12px - Button padding
p-4    // 16px - Standard card padding
p-6    // 24px - Large card padding (COMMON)
p-8    // 32px - XL card padding
```

### Gap (gap-)
```jsx
gap-2  // 8px  - Tight gaps
gap-3  // 12px - Small gaps
gap-4  // 16px - Standard gaps (MOST COMMON)
gap-6  // 24px - Large gaps (COMMON)
gap-8  // 32px - XL gaps
```

### Section Padding (Responsive)
```jsx
// === STANDARD SECTION ===
<section className="py-12 md:py-16 lg:py-20">
  {/* Mobile: 48px, Tablet: 64px, Desktop: 80px */}
</section>

// === HERO SECTION ===
<section className="py-12 md:py-20 lg:py-28">
  {/* Mobile: 48px, Tablet: 80px, Desktop: 112px */}
</section>

// === TIGHT SECTION ===
<section className="py-8 md:py-12">
  {/* Mobile: 32px, Tablet+: 48px */}
</section>
```

---

## 📱 RESPONSIVE GRID PATTERNS

### 1 → 2 → 3 Columns (Features)
```jsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-6
">
  {/* Feature cards */}
</div>
```

### 1 → 2 Columns (Blog)
```jsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  gap-8
">
  {/* Blog cards */}
</div>
```

### 1 → 4 Columns (Footer)
```jsx
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-4 
  gap-8
">
  {/* Footer columns */}
</div>
```

### Flexbox - Vertical → Horizontal
```jsx
<div className="
  flex 
  flex-col 
  md:flex-row 
  gap-4 
  md:gap-6
">
  {/* Content */}
</div>
```

---

## 🎯 COMPONENT ŞABLONLARI

### Hero Section Template
```jsx
<section className="
  bg-primary 
  text-primary-foreground 
  py-12 md:py-20 lg:py-28
">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl mx-auto text-center space-y-6">
      {/* Badge */}
      <span className="
        inline-block
        bg-secondary/10 
        text-secondary 
        px-4 py-2 
        rounded-full 
        text-sm 
        font-medium
      ">
        🏆 Skill-based Analysis
      </span>

      {/* Title */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
        Football Intelligence Platform
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl text-primary-foreground/80">
        Analyze matches like a pro
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="secondary" size="lg">
          Join Waitlist
        </Button>
        <Button variant="outline" size="lg">
          Learn More
        </Button>
      </div>
    </div>
  </div>
</section>
```

### Feature Card Template
```jsx
<div className="
  bg-card 
  text-card-foreground 
  rounded-lg 
  border 
  p-6 
  transition-all 
  hover:shadow-lg 
  hover:-translate-y-1
">
  {/* Icon */}
  <div className="
    bg-secondary/10 
    text-secondary 
    p-3 
    rounded-lg 
    w-fit 
    mb-4
  ">
    <TrendingUp className="size-6" />
  </div>

  {/* Title */}
  <h3 className="text-xl font-medium mb-2">
    Advanced Analytics
  </h3>

  {/* Description */}
  <p className="text-muted-foreground mb-4">
    Deep dive into match statistics and player performance.
  </p>

  {/* CTA */}
  <Button variant="ghost" size="sm" className="mt-auto">
    Learn More →
  </Button>
</div>
```

### Section Header Template
```jsx
<div className="text-center mb-12">
  {/* Badge */}
  <span className="
    inline-block 
    bg-accent/10 
    text-accent 
    px-3 py-1 
    rounded-full 
    text-sm 
    font-medium 
    mb-4
  ">
    Features
  </span>

  {/* Title */}
  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
    Why Choose TacticIQ?
  </h2>

  {/* Description */}
  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
    Skill-based football analysis platform for tactical intelligence
  </p>
</div>
```

---

## 🎨 ANİMASYON VE GEÇIŞLER

### Card Hover Effect
```jsx
<div className="
  transition-all 
  duration-300 
  hover:shadow-lg 
  hover:-translate-y-1
">
```

### Button Hover Effect
```jsx
<button className="
  transition-all 
  hover:scale-105 
  hover:bg-primary/90
">
```

### Focus Ring (Input/Button)
```jsx
<input className="
  focus:ring-2 
  focus:ring-ring 
  focus:border-ring
">
```

### Smooth Background Transition
```jsx
<div className="transition-colors hover:bg-muted">
```

---

## 🌐 RTL SUPPORT (Arapça)

### RTL-Friendly Classes
```jsx
// ❌ YANLIŞ
<div className="ml-4">         // Always left
<p className="text-left">      // Always left align

// ✅ DOĞRU
<div className="ms-4">         // Start (left in LTR, right in RTL)
<p className="text-start">     // Reading direction

// Margin/Padding
ms-4  // margin-start
me-4  // margin-end
ps-4  // padding-start
pe-4  // padding-end
```

---

## 📋 FORM ŞABLONLARı

### Input Group
```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email Address</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="your@email.com"
    className="w-full"
  />
  <span className="text-xs text-muted-foreground">
    We'll never share your email
  </span>
</div>
```

### Checkbox Group
```jsx
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms" className="font-normal">
    I agree to the terms and conditions
  </Label>
</div>
```

### Select Dropdown
```jsx
<div className="space-y-2">
  <Label>Select Option</Label>
  <Select>
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Choose..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">Option 1</SelectItem>
      <SelectItem value="2">Option 2</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## 🎯 KULLANIM İPUÇLARI

### ✅ YAPILACAKLAR
- `bg-primary`, `bg-secondary` gibi semantic renkleri kullan
- Mobile-first responsive design yap (varsayılan → `md:` → `lg:`)
- Hover ve focus states ekle
- 4px grid spacing kullan (`gap-4`, `p-6`)
- forwardRef kullan (component'lerde)
- displayName ekle (React DevTools için)
- RTL-friendly classes kullan (`ms-4` instead of `ml-4`)

### ❌ YAPILMAYACAKLAR
- `bg-[#0F2A24]` gibi hardcoded renkler kullanma
- `text-2xl`, `font-bold` gibi font style'ları değiştirme (varsayılanları kullan)
- `ml-4`, `mr-4` gibi RTL-aware olmayan classes kullanma
- 4px grid dışında custom spacing kullanma
- Component'leri override etme (variants kullan)

---

## 🔧 HIZLI KONTROL LİSTESİ

Yeni component oluştururken:

- [ ] Semantic color tokens (`bg-primary` ✅, not `bg-[#0F2A24]` ❌)
- [ ] Responsive classes (`text-3xl md:text-4xl lg:text-5xl`)
- [ ] Hover states (`hover:shadow-lg hover:-translate-y-1`)
- [ ] Focus states (`focus:ring-2 focus:ring-ring`)
- [ ] Dark mode test edildi
- [ ] RTL layout test edildi (Arapça)
- [ ] Accessibility (ARIA labels, contrast)
- [ ] 4px spacing grid (`gap-4`, `p-6`)
- [ ] Smooth transitions (`transition-all`)
- [ ] forwardRef kullanıldı mı?

---

## 📂 COMPONENT IMPORT'LAR

```tsx
// UI Components
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';

// Icons (Lucide)
import { TrendingUp, Shield, Target, Award, X, Menu } from 'lucide-react';

// Contexts
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
```

---

## 🎨 RENK REFERANSI (HEX CODES)

| Renk | HEX | RGB |
|------|-----|-----|
| **Primary** | `#0F2A24` | `rgb(15, 42, 36)` |
| **Secondary** | `#1FA2A6` | `rgb(31, 162, 166)` |
| **Accent** | `#C9A44C` | `rgb(201, 164, 76)` |
| **Error** | `#8C3A3A` | `rgb(140, 58, 58)` |
| **Dark** | `#121212` | `rgb(18, 18, 18)` |
| **Light** | `#E6E6E6` | `rgb(230, 230, 230)` |

---

**⚡ Hızlı Referans - TacticIQ.app © 2025**
