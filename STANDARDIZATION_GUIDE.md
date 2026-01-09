# 🎯 Fan Manager 2026 - Standardization Guide

## 📋 **Genel Bakış**

Bu doküman, uygulama içindeki tüm yapıların standardizasyonu için rehberdir. Arayüzlerin görselliğini bozmadan tutarlılık sağlamak için oluşturulmuştur.

---

## 🏗️ **Component Yapısı**

### **1. Screen Layout Standardı**

**Her ekran şu yapıyı kullanmalı:**

```typescript
import { ScreenLayout } from '../components/layouts/ScreenLayout';
import { StandardHeader } from '../components/layouts/StandardHeader';

export function MyScreen() {
  return (
    <ScreenLayout
      safeArea={true}
      scrollable={true}
      gradient={false}
    >
      <StandardHeader
        title="Ekran Başlığı"
        onBack={() => {}}
        rightAction={{
          icon: 'settings-outline',
          onPress: () => {},
        }}
      />
      
      {/* Screen Content */}
    </ScreenLayout>
  );
}
```

**Özellikler:**
- ✅ `ScreenLayout` - Tutarlı ekran yapısı
- ✅ `StandardHeader` - Standart header
- ✅ SafeAreaView desteği
- ✅ ScrollView desteği
- ✅ Gradient background (opsiyonel)

---

### **2. Style Helper Kullanımı**

**Hard-coded style'lar yerine helper'ları kullan:**

```typescript
// ❌ YANLIŞ
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
});

// ✅ DOĞRU
import { containerStyles, textStyles } from '../utils/styleHelpers';

const styles = StyleSheet.create({
  container: {
    ...containerStyles.screen,
    ...containerStyles.scrollContent,
  },
  title: {
    ...textStyles.title,
  },
});
```

---

### **3. Design System Kullanımı**

**Tüm değerler theme'den gelmeli:**

```typescript
// ❌ YANLIŞ
<View style={{ padding: 16, backgroundColor: '#0F172A' }}>
  <Text style={{ fontSize: 14, color: '#F8FAFB' }}>Text</Text>
</View>

// ✅ DOĞRU
import { SPACING, COLORS, TYPOGRAPHY } from '../theme/theme';

<View style={{ padding: SPACING.base, backgroundColor: COLORS.dark.background }}>
  <Text style={TYPOGRAPHY.body}>Text</Text>
</View>
```

---

## 📐 **Spacing Standardı**

### **Kullanım:**

```typescript
import { SPACING } from '../theme/theme';
import { spacingHelpers } from '../utils/styleHelpers';

// Margin
<View style={spacingHelpers.mt('lg')} />  // marginTop: 24
<View style={spacingHelpers.mb('base')} /> // marginBottom: 16
<View style={spacingHelpers.mx('sm')} />  // marginHorizontal: 8

// Padding
<View style={spacingHelpers.p('base')} /> // padding: 16
<View style={spacingHelpers.px('lg')} />  // paddingHorizontal: 24
```

### **Spacing Değerleri:**

| Token | Değer | Kullanım |
|-------|-------|----------|
| `xs` | 4px | Minimal padding |
| `sm` | 8px | Small gaps |
| `md` | 12px | Form elements |
| `base` | 16px | Cards, containers (default) |
| `lg` | 24px | Sections |
| `xl` | 32px | Large sections |
| `xxl` | 48px | Extra large |
| `xxxl` | 64px | Maximum spacing |

---

## 🎨 **Typography Standardı**

### **Kullanım:**

```typescript
import { TYPOGRAPHY } from '../theme/theme';
import { textStyles } from '../utils/styleHelpers';

// ✅ DOĞRU
<Text style={TYPOGRAPHY.h1}>Başlık</Text>
<Text style={TYPOGRAPHY.body}>Normal metin</Text>
<Text style={TYPOGRAPHY.caption}>Küçük metin</Text>

// Veya helper kullan
<Text style={textStyles.title}>Başlık</Text>
<Text style={textStyles.body}>Normal metin</Text>
```

### **Typography Tipleri:**

| Tip | Font Size | Font Weight | Kullanım |
|-----|-----------|-------------|----------|
| `h1` | 30px | 700 | Ana başlıklar |
| `h2` | 24px | 700 | Modal başlıkları |
| `h3` | 18px | 700 | Alt başlıklar |
| `body` | 14px | 400 | Normal metin |
| `bodySmall` | 12px | 400 | Küçük metin |
| `caption` | 10px | 400 | Açıklamalar |
| `button` | 14px | 500 | Buton metinleri |

---

## 🎯 **Button Standardı**

### **Kullanım:**

```typescript
import Button from '../components/atoms/Button';

// ✅ DOĞRU
<Button
  title="Giriş Yap"
  onPress={handleLogin}
  variant="gradient"
  size="auth"
  fullWidth
  loading={isLoading}
/>
```

### **Button Variants:**

| Variant | Açıklama | Kullanım |
|---------|----------|----------|
| `primary` | Solid emerald | Genel aksiyonlar |
| `gradient` | Emerald gradient | Auth butonları |
| `secondary` | Outlined | İkincil aksiyonlar |
| `outline` | Border only | Ters aksiyonlar |
| `ghost` | Transparent | Minimal aksiyonlar |
| `pro` | Gold background | Premium özellikler |

### **Button Sizes:**

| Size | Height | Kullanım |
|------|--------|----------|
| `small` | 32px | Kompakt alanlar |
| `default` | 36px | Genel kullanım |
| `large` | 40px | Önemli aksiyonlar |
| `auth` | 50px | Auth ekranları |

---

## 🃏 **Card Standardı**

### **Kullanım:**

```typescript
import Card from '../components/atoms/Card';

// ✅ DOĞRU
<Card variant="elevated" padding="large">
  <Text>Card Content</Text>
</Card>
```

### **Card Variants:**

| Variant | Açıklama | Kullanım |
|---------|----------|----------|
| `default` | Basic card | Genel kartlar |
| `elevated` | With shadow | Öne çıkan kartlar |
| `outlined` | With border | Minimal kartlar |

### **Card Padding:**

| Padding | Değer | Kullanım |
|---------|-------|----------|
| `none` | 0px | Custom padding |
| `small` | 8px | Kompakt kartlar |
| `medium` | 16px | Default |
| `large` | 32px | Büyük kartlar |

---

## 📱 **Screen Standardı**

### **Her Ekran İçin:**

1. **ScreenLayout kullan**
2. **StandardHeader kullan**
3. **Style helper'ları kullan**
4. **Design system değerlerini kullan**

### **Örnek Tam Ekran:**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../components/layouts/ScreenLayout';
import { StandardHeader } from '../components/layouts/StandardHeader';
import { containerStyles, textStyles } from '../utils/styleHelpers';
import { SPACING } from '../theme/theme';

export function MyScreen() {
  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader
        title="Başlık"
        onBack={() => {}}
      />
      
      <View style={styles.content}>
        <Text style={textStyles.title}>İçerik</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.base,
  },
});
```

---

## 🎨 **Color Standardı**

### **Kullanım:**

```typescript
import { COLORS, BRAND } from '../theme/theme';

// ✅ DOĞRU
<View style={{ backgroundColor: COLORS.dark.background }}>
  <Text style={{ color: COLORS.dark.foreground }}>Text</Text>
  <View style={{ backgroundColor: BRAND.emerald }} />
</View>
```

### **Color Tokens:**

| Token | Açıklama | Kullanım |
|-------|----------|----------|
| `COLORS.dark.background` | Ana arka plan | Screen backgrounds |
| `COLORS.dark.card` | Kart arka planı | Card backgrounds |
| `COLORS.dark.foreground` | Ana metin | Primary text |
| `COLORS.dark.mutedForeground` | İkincil metin | Secondary text |
| `BRAND.emerald` | Ana renk | Buttons, accents |
| `BRAND.gold` | Premium renk | Premium features |

---

## 🔧 **Migration Checklist**

### **Mevcut Ekranları Güncelleme:**

- [ ] `ScreenLayout` component'ini kullan
- [ ] `StandardHeader` component'ini kullan
- [ ] Hard-coded style'ları `styleHelpers` ile değiştir
- [ ] Hard-coded spacing'leri `SPACING` ile değiştir
- [ ] Hard-coded colors'ları `COLORS` ile değiştir
- [ ] Hard-coded typography'leri `TYPOGRAPHY` ile değiştir
- [ ] `Button` component'ini kullan (hard-coded butonlar yerine)
- [ ] `Card` component'ini kullan (hard-coded kartlar yerine)

---

## 📊 **Öncelik Sırası**

### **1. Yüksek Öncelik:**
- ✅ ScreenLayout kullanımı
- ✅ StandardHeader kullanımı
- ✅ Design system değerleri (SPACING, COLORS, TYPOGRAPHY)

### **2. Orta Öncelik:**
- ✅ Button component kullanımı
- ✅ Card component kullanımı
- ✅ Style helper kullanımı

### **3. Düşük Öncelik:**
- ✅ Spacing helper kullanımı
- ✅ Animasyon standardizasyonu
- ✅ Loading state standardizasyonu

---

## 🎯 **Best Practices**

### **DO:**
- ✅ Design system değerlerini kullan
- ✅ Reusable component'leri kullan
- ✅ Style helper'ları kullan
- ✅ Tutarlı spacing kullan
- ✅ Tutarlı typography kullan

### **DON'T:**
- ❌ Hard-coded değerler kullanma
- ❌ Her yerde farklı style'lar yazma
- ❌ Component'leri tekrar tekrar yazma
- ❌ Design system'i bypass etme

---

## 📝 **Örnekler**

### **Örnek 1: Basit Ekran**

```typescript
import { ScreenLayout, StandardHeader } from '../components/layouts';
import { textStyles } from '../utils/styleHelpers';

export function SimpleScreen() {
  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader title="Basit Ekran" onBack={() => {}} />
      <Text style={textStyles.body}>İçerik</Text>
    </ScreenLayout>
  );
}
```

### **Örnek 2: Form Ekranı**

```typescript
import { ScreenLayout, StandardHeader } from '../components/layouts';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { SPACING } from '../theme/theme';

export function FormScreen() {
  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader title="Form" />
      
      <View style={{ padding: SPACING.base }}>
        <Input placeholder="Email" />
        <Input placeholder="Password" secureTextEntry />
        <Button title="Gönder" variant="gradient" fullWidth />
      </View>
    </ScreenLayout>
  );
}
```

---

**Son Güncelleme:** 7 Ocak 2026
