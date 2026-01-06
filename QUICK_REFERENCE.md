# Fan Manager 2026 - Quick Reference

**Design System Hızlı Erişim Kılavuzu**

---

## 🎨 Renk Kullanımı

```typescript
import { BRAND } from '@/theme/theme';

// Marka renkleri
BRAND.emerald       // #059669 - Ana aksiyon rengi
BRAND.emeraldDark   // #047857 - Hover, gradient bitiş
BRAND.gold          // #F59E0B - Premium özellikler
BRAND.white         // #ffffff - Beyaz metin
```

---

## 📏 Spacing (Boşluklar)

```typescript
import { SPACING } from '@/theme/theme';

padding: SPACING.xs,        // 4px  (p-1)
padding: SPACING.sm,        // 8px  (p-2)
padding: SPACING['2.5'],    // 10px (p-2.5)
padding: SPACING.md,        // 12px (p-3)
padding: SPACING.base,      // 16px (p-4)
padding: SPACING.lg,        // 24px (p-6)
padding: SPACING.xl,        // 32px (p-8)
```

---

## 📐 Sizes (Boyutlar)

### İkonlar:
```typescript
import { SIZES } from '@/theme/theme';

// w-3 h-3 → SIZES.iconXxs (12px) - Chart legends
// w-4 h-4 → SIZES.iconXs (16px)  - Button icons
// w-5 h-5 → SIZES.iconSm (20px)  - Input icons
// w-6 h-6 → SIZES.iconMd (24px)  - Navigation
// w-20 h-20 → SIZES.iconXxl (80px) - Logo

<SafeIcon name="mail" size={SIZES.iconSm} />
```

### Border Radius:
```typescript
// rounded → SIZES.radius (4px)
// rounded-md → SIZES.radiusSm (6px)
// rounded-lg → SIZES.radiusMd (8px)
// rounded-xl → SIZES.radiusLg (12px)
// rounded-full → SIZES.radiusFull (9999)

borderRadius: SIZES.radiusLg,  // 12px (rounded-xl)
```

### Component Heights:
```typescript
height: SIZES.buttonAuthHeight,  // 50px (Auth buttons)
height: SIZES.inputAuthHeight,   // 50px (Auth inputs)
height: SIZES.badgeSize,         // 28px (Minute badges)
```

---

## 🔡 Typography

```typescript
import { TYPOGRAPHY } from '@/theme/theme';

// Headings
<Text style={TYPOGRAPHY.h1}>Title</Text>          // 30px, bold
<Text style={TYPOGRAPHY.h1Splash}>Splash</Text>   // 48px, bold
<Text style={TYPOGRAPHY.h2}>Section</Text>        // 24px, bold
<Text style={TYPOGRAPHY.h3}>Subsection</Text>     // 18px, bold

// Body
<Text style={TYPOGRAPHY.body}>Default</Text>      // 14px, normal
<Text style={TYPOGRAPHY.bodyLarge}>Large</Text>   // 16px, normal
<Text style={TYPOGRAPHY.bodySmall}>Small</Text>   // 12px, normal
<Text style={TYPOGRAPHY.caption}>Info</Text>      // 10px, normal

// Button
<Text style={TYPOGRAPHY.button}>Click Me</Text>   // 14px, medium (500)
```

---

## ✨ Shadows (Gölgeler)

```typescript
import { SHADOWS } from '@/theme/theme';

const styles = StyleSheet.create({
  card: {
    ...SHADOWS.md,        // Default card shadow
  },
  button: {
    ...SHADOWS.emerald,   // Green glow (primary buttons)
  },
  modal: {
    ...SHADOWS['2xl'],    // Modal shadow
  },
});
```

---

## 🎭 Opacity

```typescript
import { OPACITY } from '@/theme/theme';

// Goal card background
backgroundColor: `rgba(5, 150, 105, ${OPACITY[10]})`,  // 10%

// Input background
backgroundColor: `rgba(15, 23, 42, ${OPACITY[50]})`,   // 50%

// Modal backdrop
backgroundColor: `rgba(0, 0, 0, ${OPACITY[60]})`,      // 60%

// Border
borderColor: `rgba(5, 150, 105, ${OPACITY[30]})`,      // 30%
```

---

## 🌈 Gradients

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { AUTH_GRADIENT, PRIMARY_BUTTON_GRADIENT } from '@/theme/gradients';

// Auth page background
<LinearGradient
  colors={AUTH_GRADIENT.colors}
  start={AUTH_GRADIENT.start}
  end={AUTH_GRADIENT.end}
  style={styles.container}
/>

// Primary button
<LinearGradient
  colors={PRIMARY_BUTTON_GRADIENT.colors}
  start={PRIMARY_BUTTON_GRADIENT.start}
  end={PRIMARY_BUTTON_GRADIENT.end}
  style={styles.button}
/>
```

---

## 📚 Z-Index

```typescript
import { Z_INDEX } from '@/theme/theme';

zIndex: Z_INDEX.normal,    // 0 - Default content
zIndex: Z_INDEX.sticky,    // 10 - Fixed headers
zIndex: Z_INDEX.dropdown,  // 50 - Dropdowns
zIndex: Z_INDEX.backdrop,  // 9998 - Modal backdrop
zIndex: Z_INDEX.modal,     // 9999 - Modal content
zIndex: Z_INDEX.toast,     // 10000 - Notifications
```

---

## 🎯 Component Patterns

### Auth Button:
```typescript
<TouchableOpacity activeOpacity={0.8}>
  <LinearGradient
    colors={PRIMARY_BUTTON_GRADIENT.colors}
    start={PRIMARY_BUTTON_GRADIENT.start}
    end={PRIMARY_BUTTON_GRADIENT.end}
    style={styles.button}
  >
    <Text style={styles.buttonText}>Giriş Yap</Text>
  </LinearGradient>
</TouchableOpacity>

const styles = StyleSheet.create({
  button: {
    height: SIZES.buttonAuthHeight,    // 50px
    borderRadius: SIZES.radiusLg,      // 12px
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,   // 16px
    ...SHADOWS.emerald,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: BRAND.white,
  },
});
```

### Auth Input:
```typescript
<View style={styles.inputContainer}>
  <SafeIcon name="mail" size={SIZES.iconSm} color="#999" />
  <TextInput
    style={styles.input}
    placeholder="ornek@email.com"
    placeholderTextColor={`rgba(255, 255, 255, ${OPACITY[60]})`}
  />
</View>

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(15, 23, 42, ${OPACITY[50]})`,  // bg-[#0F172A]/50
    borderWidth: 1,
    borderColor: `rgba(5, 150, 105, ${OPACITY[30]})`,     // border-[#059669]/30
    borderRadius: SIZES.radiusLg,                         // 12px
    height: SIZES.inputAuthHeight,                        // 50px
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: BRAND.white,
  },
});
```

### Goal Card:
```typescript
<View style={styles.goalCard}>
  <View style={styles.minuteBadge}>
    <Text style={styles.minuteText}>23'</Text>
  </View>
  <Text style={styles.playerName}>Icardi</Text>
</View>

const styles = StyleSheet.create({
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(5, 150, 105, ${OPACITY[10]})`,  // bg-[#059669]/10
    borderLeftWidth: 2,
    borderLeftColor: BRAND.emerald,                        // Solid
    borderRadius: SIZES.radiusMd,                          // 8px
    padding: SPACING['2.5'],                               // 10px
    gap: SPACING.md,
  },
  minuteBadge: {
    width: SIZES.badgeSize,
    height: SIZES.badgeSize,
    borderRadius: SIZES.radiusFull,
    backgroundColor: BRAND.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minuteText: {
    ...TYPOGRAPHY.captionBold,
    color: BRAND.white,
  },
  playerName: {
    ...TYPOGRAPHY.bodyMediumSemibold,
    color: BRAND.white,
    flex: 1,
  },
});
```

---

## ❌ Don't / ✅ Do

### ❌ Don't (Hard-coded):
```typescript
fontSize: 14,
padding: 16,
borderRadius: 12,
backgroundColor: '#059669',
shadowColor: '#000',
shadowOpacity: 0.2,
```

### ✅ Do (Design System):
```typescript
...TYPOGRAPHY.body,
padding: SPACING.base,
borderRadius: SIZES.radiusLg,
backgroundColor: BRAND.emerald,
...SHADOWS.emerald,
```

---

**Version:** 1.0.0  
**Last Updated:** 4 Ocak 2026  
**Detaylı Döküman:** `DESIGN_SYSTEM.md`
