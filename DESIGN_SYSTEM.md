# 🎨 Fan Manager 2026 - Design System

**React Native Design System Implementation**  
*Adapted from Tailwind CSS Documentation v1.0.0*

---

## 📖 Overview

This Design System provides a complete, standardized set of design tokens for the Fan Manager 2026 mobile application. All values are sourced from the official **Fan Manager 2026 - Design System Documentation** and adapted for React Native.

---

## 🚀 Quick Start

### Import the theme:

```typescript
import { BRAND, SPACING, TYPOGRAPHY, SIZES, SHADOWS, OPACITY, Z_INDEX } from '@/theme/theme';
```

### Usage Example:

```typescript
import { StyleSheet } from 'react-native';
import { BRAND, SPACING, TYPOGRAPHY, SIZES, SHADOWS } from '@/theme/theme';

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: BRAND.emerald,
    height: SIZES.buttonAuthHeight,  // 50px
    borderRadius: SIZES.radiusLg,    // 12px (rounded-xl)
    paddingHorizontal: SPACING.base, // 16px
    ...SHADOWS.emerald,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: BRAND.white,
  },
});
```

---

## 📐 Design Tokens

### 🎨 Colors (`BRAND`)

```typescript
BRAND.emerald       // #059669 - Primary action color
BRAND.emeraldDark   // #047857 - Gradient end, hover states
BRAND.gold          // #F59E0B - Premium features
BRAND.white         // #ffffff - Text on emerald/gold
```

### 📏 Spacing (`SPACING`)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `xs` | 4px | `p-1` | Minimal padding |
| `sm` | 8px | `p-2` | Small gaps |
| `'2.5'` | 10px | `p-2.5` | Goal cards |
| `md` | 12px | `p-3` | Form elements |
| `base` | 16px | `p-4` | Cards, containers |
| `lg` | 24px | `p-6` | Sections |
| `xl` | 32px | `p-8` | Large sections |
| `'12.5'` | 50px | `h-[50px]` | Auth buttons |

**Example:**
```typescript
paddingHorizontal: SPACING.base,  // 16px
gap: SPACING.sm,                  // 8px
marginBottom: SPACING.lg,         // 24px
```

### 🔡 Typography (`TYPOGRAPHY`)

#### Headings:
```typescript
TYPOGRAPHY.h1         // 30px, bold - Auth page titles
TYPOGRAPHY.h1Splash   // 48px, bold - Splash screen
TYPOGRAPHY.h2         // 24px, bold - Modal headers
TYPOGRAPHY.h3         // 18px, bold - Section headers
```

#### Body Text:
```typescript
TYPOGRAPHY.body           // 14px, normal - Default text
TYPOGRAPHY.bodyLarge      // 16px, normal - Paragraphs
TYPOGRAPHY.bodySmall      // 12px, normal - Timestamps
TYPOGRAPHY.caption        // 10px, normal - Match info
```

#### Usage:
```typescript
<Text style={styles.title}>Fan Manager 2026</Text>

const styles = StyleSheet.create({
  title: {
    ...TYPOGRAPHY.h1,
    color: BRAND.white,
  },
});
```

### 📦 Sizes (`SIZES`)

#### Icons (Lucide-react mapping):
```typescript
SIZES.iconXxs   // 12px - w-3 h-3 (chart legends)
SIZES.iconXs    // 16px - w-4 h-4 (button icons)
SIZES.iconSm    // 20px - w-5 h-5 (input icons)
SIZES.iconMd    // 24px - w-6 h-6 (navigation)
SIZES.iconXxl   // 80px - w-20 h-20 (logo)
```

#### Border Radius:
```typescript
SIZES.radius      // 4px - rounded
SIZES.radiusSm    // 6px - rounded-md
SIZES.radiusMd    // 8px - rounded-lg
SIZES.radiusLg    // 12px - rounded-xl
SIZES.radiusFull  // 9999 - rounded-full
```

#### Component Sizes:
```typescript
SIZES.buttonAuthHeight  // 50px - Custom auth buttons
SIZES.inputAuthHeight   // 50px - Custom auth inputs
SIZES.badgeSize         // 28px - Minute indicators
```

### ✨ Shadows (`SHADOWS`)

```typescript
SHADOWS.none      // No shadow
SHADOWS.xs        // Subtle - Checkboxes
SHADOWS.sm        // Small cards
SHADOWS.md        // Default cards
SHADOWS.lg        // Buttons
SHADOWS.emerald   // Primary buttons (green glow)
SHADOWS['2xl']    // Modals
```

**Example:**
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.md,
  },
});
```

### 🎭 Opacity (`OPACITY`)

```typescript
OPACITY[5]    // 0.05 - Very subtle tint
OPACITY[10]   // 0.1 - Goal card backgrounds
OPACITY[20]   // 0.2 - Medium backgrounds
OPACITY[30]   // 0.3 - Borders
OPACITY[50]   // 0.5 - Input backgrounds
OPACITY[60]   // 0.6 - Modal backdrops
OPACITY[80]   // 0.8 - Hover states
```

**Usage with colors:**
```typescript
// Goal card (home team)
backgroundColor: `rgba(5, 150, 105, ${OPACITY[10]})`,  // #059669/10

// Input background
backgroundColor: `rgba(15, 23, 42, ${OPACITY[50]})`,   // #0F172A/50
```

### 📚 Z-Index (`Z_INDEX`)

```typescript
Z_INDEX.normal       // 0 - Default content
Z_INDEX.sticky       // 10 - Fixed headers
Z_INDEX.dropdown     // 50 - Dropdowns
Z_INDEX.backdrop     // 9998 - Modal backdrop
Z_INDEX.modal        // 9999 - Modal content
Z_INDEX.toast        // 10000 - Notifications
```

---

## 🎯 Component Patterns

### Primary Button (Auth Style)

```typescript
import { LinearGradient } from 'expo-linear-gradient';

<TouchableOpacity activeOpacity={0.8}>
  <LinearGradient
    colors={[BRAND.emerald, BRAND.emeraldDark]}  // #059669 → #047857
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
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
    ...SHADOWS.emerald,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: BRAND.white,
  },
});
```

### Input Field (Auth Style)

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

### Goal Card

```typescript
<View style={styles.goalCard}>
  <View style={styles.minuteBadge}>
    <Text style={styles.minuteText}>23'</Text>
  </View>
  <Text style={styles.playerName}>Icardi</Text>
  <SafeIcon name="football" size={SIZES.iconXs} color={BRAND.white} />
</View>

const styles = StyleSheet.create({
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(5, 150, 105, ${OPACITY[10]})`,  // bg-[#059669]/10
    borderLeftWidth: 2,
    borderLeftColor: BRAND.emerald,                        // Solid emerald
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

### Modal with Backdrop

```typescript
<View style={styles.modalContainer}>
  {/* Backdrop */}
  <View style={styles.backdrop} />
  
  {/* Modal Content */}
  <View style={styles.modal}>
    <Text>Modal Content</Text>
  </View>
</View>

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `rgba(0, 0, 0, ${OPACITY[60]})`,  // bg-black/60
    zIndex: Z_INDEX.backdrop,
  },
  modal: {
    backgroundColor: COLORS.dark.background,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SPACING.lg,
    zIndex: Z_INDEX.modal,
    ...SHADOWS['2xl'],
  },
});
```

---

## 🔄 Tailwind to React Native Mapping

| Tailwind | React Native | Value |
|----------|--------------|-------|
| `w-4 h-4` | `SIZES.iconXs` | 16px |
| `w-5 h-5` | `SIZES.iconSm` | 20px |
| `w-6 h-6` | `SIZES.iconMd` | 24px |
| `p-4` | `SPACING.base` | 16px |
| `gap-2` | `gap: SPACING.sm` | 8px |
| `rounded-xl` | `borderRadius: SIZES.radiusLg` | 12px |
| `text-sm` | `...TYPOGRAPHY.body` | 14px |
| `font-bold` | `fontWeight: '700'` | 700 |
| `bg-[#059669]/10` | `rgba(5,150,105,${OPACITY[10]})` | 10% opacity |
| `shadow-lg` | `...SHADOWS.lg` | Large shadow |

---

## ✅ Best Practices

### ❌ Don't:
```typescript
// Hard-coded values
fontSize: 14,
padding: 16,
borderRadius: 12,
backgroundColor: '#059669',
```

### ✅ Do:
```typescript
// Design System tokens
...TYPOGRAPHY.body,
padding: SPACING.base,
borderRadius: SIZES.radiusLg,
backgroundColor: BRAND.emerald,
```

---

## 📚 Full Token Reference

See `src/theme/theme.ts` for the complete Design System implementation with:
- ✅ 240+ design tokens
- ✅ Complete typography system
- ✅ Opacity scale (5%-100%)
- ✅ Z-Index hierarchy
- ✅ Shadow system
- ✅ Icon size mapping
- ✅ Spacing scale
- ✅ Color palette (light/dark modes)

---

**Version:** 1.0.0  
**Last Updated:** 4 Ocak 2026  
**Source:** Fan Manager 2026 - Design System Documentation
