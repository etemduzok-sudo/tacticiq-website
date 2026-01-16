# 🧩 TacticIQ Components Guide

**Version:** 1.0  
**Framework:** React 18 + TypeScript + Tailwind CSS v4  
**Component Library:** Custom UI Components (shadcn/ui inspired)

---

## 📋 Table of Contents

1. [Button Component](#button-component)
2. [Card Component](#card-component)
3. [Badge Component](#badge-component)
4. [Input Component](#input-component)
5. [Modal/Dialog Component](#modaldialog-component)
6. [Toast Notifications](#toast-notifications)
7. [Section Components](#section-components)
8. [Layout Components](#layout-components)

---

## 🔘 Button Component

### Location
`/src/app/components/ui/button.tsx`

### Variants

```typescript
type ButtonVariant = 
  | "default"      // Primary button (bg-primary)
  | "secondary"    // Secondary button (bg-secondary)
  | "ghost"        // Transparent with hover
  | "outline"      // Bordered button
  | "destructive"  // Delete/error actions (bg-destructive)
  | "link";        // Text-only link style
```

### Sizes

```typescript
type ButtonSize = 
  | "default"  // Medium (h-10 px-4 py-2)
  | "sm"       // Small (h-9 px-3)
  | "lg"       // Large (h-11 px-8)
  | "icon";    // Square icon button (h-10 w-10)
```

### Usage Examples

```jsx
import { Button } from '@/app/components/ui/button';

// Primary button (default)
<Button variant="default" size="default">
  Join Waitlist
</Button>

// Secondary button with icon
<Button variant="secondary" size="lg" className="gap-2">
  <Download className="size-4" />
  Download App
</Button>

// Ghost button (subtle)
<Button variant="ghost" size="sm">
  Learn More
</Button>

// Outline button
<Button variant="outline" size="default">
  Cancel
</Button>

// Destructive button
<Button variant="destructive" size="sm">
  <Trash2 className="size-4" />
  Delete
</Button>

// Icon-only button
<Button variant="ghost" size="icon" aria-label="Close">
  <X className="size-4" />
</Button>

// Link style
<Button variant="link" asChild>
  <a href="/blog">Read Blog</a>
</Button>
```

### Button States

```jsx
// Disabled state
<Button disabled>
  Disabled Button
</Button>

// Loading state (custom)
<Button disabled>
  <Loader2 className="size-4 animate-spin mr-2" />
  Loading...
</Button>

// Full width
<Button className="w-full">
  Full Width Button
</Button>
```

### Color Mapping

| Variant | Background | Text | Hover |
|---------|------------|------|-------|
| `default` | `primary` | `primary-foreground` | `primary/90` |
| `secondary` | `secondary` | `secondary-foreground` | `secondary/90` |
| `ghost` | `transparent` | `foreground` | `muted` |
| `outline` | `transparent` | `foreground` | `muted` |
| `destructive` | `destructive` | `destructive-foreground` | `destructive/90` |
| `link` | `transparent` | `foreground` | `underline` |

---

## 🃏 Card Component

### Location
`/src/app/components/ui/card.tsx`

### Sub-components

```jsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/app/components/ui/card';
```

### Basic Card

```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description or subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Hoverable Feature Card

```jsx
<Card className="transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
  <CardHeader>
    <div className="bg-secondary/10 text-secondary p-3 rounded-lg w-fit">
      <TrendingUp className="size-6" />
    </div>
    <CardTitle className="mt-4">Feature Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">
      Feature description with detailed information.
    </p>
  </CardContent>
</Card>
```

### Blog Card Example

```jsx
<Card className="overflow-hidden group">
  <div className="aspect-video overflow-hidden">
    <img 
      src={imageUrl} 
      alt={title}
      className="w-full h-full object-cover transition-transform group-hover:scale-110"
    />
  </div>
  <CardHeader>
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
      <Badge variant="secondary">{category}</Badge>
      <span>{date}</span>
    </div>
    <CardTitle className="line-clamp-2">{title}</CardTitle>
    <CardDescription className="line-clamp-3">
      {description}
    </CardDescription>
  </CardHeader>
  <CardFooter>
    <Button variant="ghost" className="w-full">
      Read More →
    </Button>
  </CardFooter>
</Card>
```

### Pricing Card

```jsx
<Card className="border-2 border-accent relative">
  {/* Popular badge */}
  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
    <Badge className="bg-accent text-accent-foreground">
      MOST POPULAR
    </Badge>
  </div>
  
  <CardHeader>
    <CardTitle className="text-2xl">Pro Plan</CardTitle>
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-bold">€9.99</span>
      <span className="text-muted-foreground">/ month</span>
    </div>
  </CardHeader>
  
  <CardContent>
    <ul className="space-y-3">
      {features.map(feature => (
        <li key={feature} className="flex items-start gap-2">
          <Check className="size-5 text-secondary shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </CardContent>
  
  <CardFooter>
    <Button variant="default" className="w-full">
      Get Pro
    </Button>
  </CardFooter>
</Card>
```

---

## 🏷️ Badge Component

### Location
`/src/app/components/ui/badge.tsx`

### Variants

```typescript
type BadgeVariant = 
  | "default"      // Primary badge
  | "secondary"    // Secondary badge
  | "outline"      // Outlined badge
  | "destructive"; // Error/warning badge
```

### Usage Examples

```jsx
import { Badge } from '@/app/components/ui/badge';

// Default badge
<Badge variant="default">New</Badge>

// Secondary badge (most common)
<Badge variant="secondary">Analysis</Badge>

// Outline badge
<Badge variant="outline">Draft</Badge>

// Destructive badge
<Badge variant="destructive">Error</Badge>

// Custom styled badge
<Badge className="bg-accent text-accent-foreground">
  Premium
</Badge>

// Large badge
<Badge className="px-4 py-2 text-base">
  🏆 Top Analyst
</Badge>

// Pill badge (rounded-full)
<Badge className="rounded-full">
  Live
</Badge>
```

### Common Use Cases

```jsx
// Category tag
<Badge variant="secondary" className="text-xs">
  {category}
</Badge>

// Status indicator
<Badge className="bg-green-500/10 text-green-600 border-green-500/20">
  Active
</Badge>

// Premium feature indicator
<Badge className="bg-accent/10 text-accent border-accent/20">
  ⭐ Pro
</Badge>

// Count badge
<Badge variant="destructive" className="rounded-full size-6 p-0 flex items-center justify-center">
  3
</Badge>
```

---

## 📝 Input Component

### Location
`/src/app/components/ui/input.tsx`

### Basic Input

```jsx
import { Input } from '@/app/components/ui/input';

<Input 
  type="text"
  placeholder="Enter your email"
  className="max-w-md"
/>
```

### Input with Label

```jsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email Address
  </label>
  <Input 
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>
```

### Input with Icon

```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
  <Input 
    type="search"
    placeholder="Search..."
    className="pl-10"
  />
</div>
```

### Input States

```jsx
// Disabled
<Input disabled placeholder="Disabled input" />

// Error state
<Input 
  className="border-destructive focus:ring-destructive"
  placeholder="Error input"
/>

// Success state
<Input 
  className="border-green-500 focus:ring-green-500"
  placeholder="Valid input"
/>
```

---

## 🗨️ Modal/Dialog Component

### Toast Notifications (Sonner)

```jsx
import { toast } from 'sonner';

// Success toast
toast.success('Prediction saved successfully!');

// Error toast
toast.error('Failed to save prediction');

// Info toast
toast('Match starting in 5 minutes');

// Custom toast
toast.custom((t) => (
  <div className="bg-card border rounded-lg p-4 shadow-lg">
    <h4 className="font-medium mb-2">New Achievement! 🏆</h4>
    <p className="text-sm text-muted-foreground">
      You've reached Level 10
    </p>
  </div>
));

// Toast with action
toast('Match prediction submitted', {
  action: {
    label: 'View',
    onClick: () => navigate('/predictions'),
  },
});
```

### Custom Modal Example

```jsx
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Modal Title</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📦 Section Components

### Hero Section Pattern

```jsx
export function HeroSection() {
  return (
    <section className="bg-primary text-primary-foreground py-12 md:py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <Badge className="bg-secondary/10 text-secondary">
            🏆 Non-Gambling Platform
          </Badge>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            {t('hero.title')}
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground/80">
            {t('hero.description')}
          </p>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              {t('hero.cta.primary')}
            </Button>
            <Button variant="outline" size="lg">
              {t('hero.cta.secondary')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Feature Grid Section

```jsx
export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className="transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="bg-secondary/10 text-secondary p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="size-6" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Blog Section with Carousel

```jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function BlogSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">{t('blog.title')}</h2>
          
          {/* Navigation */}
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
        
        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Blog cards here */}
        </div>
      </div>
    </section>
  );
}
```

---

## 🏗️ Layout Components

### Header Component

```jsx
export function Header() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Trophy className="size-6" />
            </div>
            <span className="text-xl font-bold">TacticIQ</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="hover:text-secondary transition-colors">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="hover:text-secondary transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="#blog" className="hover:text-secondary transition-colors">
              {t('nav.blog')}
            </a>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="secondary" size="sm">
              {t('nav.signup')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### Footer Component

```jsx
export function Footer() {
  return (
    <footer className="bg-primary text-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">TacticIQ</h3>
            <p className="text-sm text-white/80">
              {t('footer.tagline')}
            </p>
          </div>
          
          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('footer.product.title')}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#features">{t('footer.product.features')}</a></li>
              <li><a href="#pricing">{t('footer.product.pricing')}</a></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('footer.legal.title')}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><button onClick={openTerms}>{t('footer.legal.terms')}</button></li>
              <li><button onClick={openPrivacy}>{t('footer.legal.privacy')}</button></li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">{t('footer.support.title')}</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="mailto:support@tacticiq.app">{t('footer.support.email')}</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="border-t border-white/20 pt-8">
          <p className="text-xs text-white/60 text-center">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

## 🎨 Common Patterns

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
  <div className="text-4xl font-bold text-secondary mb-2">
    150K+
  </div>
  <div className="text-sm text-muted-foreground">
    Active Users
  </div>
</div>
```

### Image with Gradient Overlay

```jsx
<div className="relative aspect-video overflow-hidden rounded-lg">
  <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  <div className="absolute bottom-4 left-4 text-white">
    <h3 className="text-xl font-bold">{title}</h3>
  </div>
</div>
```

### Loading Spinner

```jsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="size-8 animate-spin text-secondary" />
</div>
```

### Empty State

```jsx
<div className="text-center py-12">
  <div className="bg-muted/30 rounded-full size-16 mx-auto mb-4 flex items-center justify-center">
    <Inbox className="size-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-2">No predictions yet</h3>
  <p className="text-muted-foreground mb-6">
    Start analyzing matches to see your predictions here
  </p>
  <Button variant="secondary">
    Browse Matches
  </Button>
</div>
```

---

## ✅ Best Practices Checklist

When creating components:

- [ ] Use semantic HTML elements (`<nav>`, `<section>`, `<article>`)
- [ ] Include proper ARIA labels for accessibility
- [ ] Support both light and dark modes
- [ ] Implement responsive design (mobile-first)
- [ ] Add hover/focus states for interactive elements
- [ ] Use translation keys instead of hardcoded text
- [ ] Test RTL layout for Arabic language
- [ ] Add loading and error states
- [ ] Optimize images with proper sizes
- [ ] Include TypeScript types for all props

---

**© 2025 TacticIQ - Components Guide v1.0**
