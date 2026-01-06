# 🔄 React Native Migration Guide

## ✅ TAMAMLANDI - Web'den React Native'e Geçiş

Bu proje başarıyla **React Web'den React Native'e** dönüştürüldü!

---

## 📊 Değişiklikler Özeti

### 🗑️ Silinen Web Dosyaları

| Dosya | Neden Silindi |
|-------|---------------|
| `vite.config.ts` | Vite web bundler, React Native'de kullanılmaz |
| `postcss.config.mjs` | PostCSS web için, React Native CSS kullanmaz |
| `tailwind.config.js` | Tailwind CSS web için, React Native style objesi kullanır |
| `/src/styles/*.css` | CSS dosyaları React Native'de kullanılmaz |
| `/src/app/` klasörü | Web component yapısı |

### ➕ Eklenen React Native Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `app.json` | Expo konfigürasyonu |
| `babel.config.js` | Babel transpiler ayarları |
| `tsconfig.json` | TypeScript ayarları |
| `/App.tsx` | Ana uygulama + React Navigation |
| `/src/screens/` | Tüm ekranlar React Native formatında |
| `/src/components/ui/` | Native UI componentleri |
| `/src/contexts/ThemeContext.tsx` | Theme yönetimi (AsyncStorage ile) |
| `/src/constants/theme.ts` | Style sabitleri |

---

## 🔄 Çeviri Karşılaştırması

### 🎨 CSS → StyleSheet

**ÖNCESİ (Web - Tailwind CSS)**:
```tsx
<div className="flex items-center justify-center bg-[#0F172A] rounded-xl p-4">
  <h1 className="text-2xl text-white font-bold">Merhaba</h1>
</div>
```

**SONRASI (React Native - StyleSheet)**:
```tsx
<View style={styles.container}>
  <Text style={styles.title}>Merhaba</Text>
</View>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
```

### 🧭 React Router → React Navigation

**ÖNCESİ (Web)**:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</BrowserRouter>
```

**SONRASI (React Native)**:
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Home" component={Home} />
    <Stack.Screen name="Profile" component={Profile} />
  </Stack.Navigator>
</NavigationContainer>
```

### 🎭 HTML → Native Components

| Web (HTML) | React Native |
|------------|--------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1>` | `<Text>` |
| `<img>` | `<Image>` |
| `<button>` | `<TouchableOpacity>` + `<Text>` |
| `<input>` | `<TextInput>` |
| `<a>` | `<TouchableOpacity>` + Navigation |

### 💾 localStorage → AsyncStorage

**ÖNCESİ (Web)**:
```tsx
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');
```

**SONRASI (React Native)**:
```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('theme', 'dark');
const theme = await AsyncStorage.getItem('theme');
```

---

## 📦 Package.json Değişiklikleri

### 🗑️ Kaldırılan Web Paketleri

```json
// Web bundler & build tools
"vite": "❌",
"@vitejs/plugin-react": "❌",
"tailwindcss": "❌",
"@tailwindcss/vite": "❌",
"postcss": "❌",

// Web-only React libraries
"react-dom": "❌",
"react-router-dom": "❌",

// Web UI libraries
"@radix-ui/*": "❌",
"vaul": "❌",
"sonner": "❌",
"lucide-react": "❌"
```

### ➕ Eklenen React Native Paketleri

```json
{
  "expo": "~52.0.0",
  "expo-status-bar": "~2.0.0",
  "react-native": "0.76.5",
  "react-native-safe-area-context": "4.12.0",
  "react-native-screens": "4.4.0",
  "@react-navigation/native": "^7.0.11",
  "@react-navigation/native-stack": "^7.1.8",
  "@react-navigation/bottom-tabs": "^7.2.0",
  "react-native-gesture-handler": "~2.20.2",
  "react-native-reanimated": "~3.16.3",
  "expo-linear-gradient": "~14.0.1",
  "expo-blur": "~14.0.1",
  "@expo/vector-icons": "^14.0.4",
  "react-native-svg": "15.8.0",
  "@react-native-async-storage/async-storage": "2.1.0"
}
```

---

## 🏗️ Proje Yapısı Değişiklikleri

### ÖNCESİ (Web)
```
/src/
  app/
    App.tsx (Web component)
    components/ (Web UI)
  styles/
    tailwind.css
    theme.css
    fonts.css
```

### SONRASI (React Native)
```
/
  App.tsx (React Navigation)
  src/
    screens/ (Native screens)
    components/
      ui/ (Native UI components)
    contexts/ (React Context)
    constants/ (Theme constants)
    types/ (TypeScript types)
```

---

## 🎯 Özellik Karşılaştırması

| Özellik | Web | React Native | Durum |
|---------|-----|--------------|-------|
| Navigation | React Router | React Navigation | ✅ Çevrildi |
| Styling | Tailwind CSS | StyleSheet | ✅ Çevrildi |
| Theme | CSS Variables | React Context | ✅ Çevrildi |
| Storage | localStorage | AsyncStorage | ✅ Çevrildi |
| Icons | lucide-react | @expo/vector-icons | ✅ Çevrildi |
| Animations | motion/react | react-native-reanimated | ⏳ Eklenebilir |
| Forms | react-hook-form | Native | ✅ Çevrildi |

---

## 🎨 UI Component Dönüşümleri

### Button Component

**ÖNCESİ (Web - Tailwind)**:
```tsx
<button className="bg-[#059669] text-white h-[50px] px-6 rounded-xl">
  Devam Et
</button>
```

**SONRASI (React Native - Custom Component)**:
```tsx
import Button from '../components/ui/Button';

<Button
  title="Devam Et"
  onPress={handlePress}
  variant="primary"
  fullWidth
/>
```

### Input Component

**ÖNCESİ (Web)**:
```tsx
<input
  type="email"
  className="h-[50px] px-4 bg-[#1E293B] text-white rounded-xl"
  placeholder="E-posta"
/>
```

**SONRASI (React Native)**:
```tsx
import Input from '../components/ui/Input';

<Input
  label="E-posta"
  placeholder="ornek@email.com"
  leftIcon="mail-outline"
  value={email}
  onChangeText={setEmail}
/>
```

### Card Component

**ÖNCESİ (Web)**:
```tsx
<div className="bg-[#1E293B] rounded-xl p-4 shadow-lg">
  <h2>Başlık</h2>
  <p>İçerik</p>
</div>
```

**SONRASI (React Native)**:
```tsx
import Card from '../components/ui/Card';

<Card variant="elevated">
  <Text style={styles.title}>Başlık</Text>
  <Text style={styles.content}>İçerik</Text>
</Card>
```

---

## 🔧 Çalıştırma Komutları

### ÖNCESİ (Web - Vite)
```bash
npm run dev        # Development server (port 5173)
npm run build      # Production build
npm run preview    # Preview production build
```

### SONRASI (React Native - Expo)
```bash
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web (experimental)
```

---

## 📱 Platform Desteği

### ÖNCESİ (Web)
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Desktop & Mobile browsers
- ❌ Native mobile apps

### SONRASI (React Native)
- ✅ iOS (iPhone, iPad)
- ✅ Android (Phone, Tablet)
- ⚠️ Web (Experimental, performans düşük)

---

## 🚀 Deployment Değişiklikleri

### ÖNCESİ (Web)
```bash
# Build
npm run build

# Deploy (Vercel, Netlify, etc.)
# /dist klasörünü deploy et
```

### SONRASI (React Native)
```bash
# iOS Build (App Store)
eas build --platform ios

# Android Build (Play Store)
eas build --platform android

# Over-the-air updates
eas update
```

---

## ✅ Migration Checklist

- [x] package.json güncellendi (React Native dependencies)
- [x] Web config dosyaları silindi (vite, tailwind, postcss)
- [x] CSS dosyaları silindi
- [x] React Navigation kuruldu
- [x] Tüm ekranlar React Native'e çevrildi
- [x] UI componentleri StyleSheet ile yazıldı
- [x] Theme system (AsyncStorage ile)
- [x] TypeScript konfigürasyonu
- [x] Babel konfigürasyonu
- [x] app.json (Expo config)
- [x] README.md güncellendi
- [x] SETUP_GUIDE.md oluşturuldu

---

## 📝 Önemli Notlar

### ⚠️ Breaking Changes

1. **CSS Desteği Yok**: React Native CSS kullanmaz, StyleSheet API kullanır
2. **HTML Elementleri Yok**: `<div>`, `<span>`, `<button>` gibi elementler yoktur
3. **Web API'leri Yok**: `window`, `document`, `localStorage` gibi Web API'leri kullanılamaz
4. **Routing Farklı**: React Router değil, React Navigation kullanılır
5. **Animasyonlar Farklı**: CSS animations değil, Animated API veya Reanimated kullanılır

### ✅ Avantajlar

1. **Native Performance**: Web'e göre daha hızlı ve akıcı
2. **Native UI**: Platform'a özgü native componentler
3. **Gesture Support**: Dokunmatik jestler için optimize edilmiş
4. **Offline First**: Network olmadan çalışabilir
5. **Push Notifications**: Native push notification desteği
6. **Device APIs**: Kamera, GPS, Accelerometer vs. erişim

### ⏳ Eksik Özellikler (Geliştirilebilir)

- [ ] Animasyonlar (react-native-reanimated ile eklenebilir)
- [ ] Haptic feedback
- [ ] Çoklu dil desteği (i18n)
- [ ] Gerçek API entegrasyonu
- [ ] Push notifications
- [ ] Oyunlaştırma sistemi (XP, badges)

---

## 🎓 Öğrenme Kaynakları

- **React Native Docs**: [reactnative.dev](https://reactnative.dev)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **React Navigation**: [reactnavigation.org](https://reactnavigation.org)
- **StyleSheet API**: [reactnative.dev/docs/stylesheet](https://reactnative.dev/docs/stylesheet)

---

## 🎉 Migration Tamamlandı!

Proje başarıyla React Native'e çevrildi. Artık iOS ve Android cihazlarda test edebilirsiniz.

**Sonraki Adımlar**:
1. `npm install` ile bağımlılıkları yükle
2. `npm start` ile uygulamayı başlat
3. Expo Go ile test et
4. Eksik özellikleri geliştir

**İyi Geliştirmeler! 🚀**
