# 🚀 React Native Versiyonu

Bu proje **React Native** versiyonu için tam kodları içerir.

## ⚠️ ÖNEMLİ

Bu dosyalar **Figma Make ortamında ÇALIŞMAZ**. React Native projesini kullanmak için:

1. Bu kodları **yerel bilgisayarınıza** kopyalayın
2. Aşağıdaki kurulum adımlarını izleyin
3. Expo ile çalıştırın

---

## 📦 Kurulum

### 1. Yeni Klasör Oluştur

```bash
mkdir fan-manager-2026-mobile
cd fan-manager-2026-mobile
```

### 2. package.json Oluştur

```json
{
  "name": "fan-manager-2026-rn",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "nativewind": "^4.0.1",
    "tailwindcss": "^3.3.2",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "4.4.0",
    "@react-navigation/native": "^7.0.13",
    "@react-navigation/native-stack": "^7.1.9",
    "@react-navigation/bottom-tabs": "^7.2.1",
    "expo-linear-gradient": "~14.0.1",
    "expo-blur": "~14.0.1",
    "@react-native-async-storage/async-storage": "2.1.0",
    "react-native-reanimated": "~3.16.5",
    "react-native-gesture-handler": "~2.20.2",
    "expo-haptics": "~14.0.0",
    "clsx": "2.1.1",
    "tailwind-merge": "3.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  },
  "private": true
}
```

### 3. Bağımlılıkları Yükle

```bash
npm install
```

### 4. Config Dosyalarını Oluştur

Bu dosyaları bu dokümantasyonun devamında bulabilirsiniz.

### 5. Çalıştır

```bash
# iOS
npm run ios

# Android
npm run android

# Expo Go
npm start
```

---

## 📁 Gerekli Config Dosyaları

### app.json

```json
{
  "expo": {
    "name": "Fan Manager 2026",
    "slug": "fan-manager-2026",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.fanmanager.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "com.fanmanager.app"
    }
  }
}
```

### babel.config.js

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F8FAFB',
          dark: '#0F172A',
        },
        foreground: {
          light: '#030213',
          dark: '#ffffff',
        },
        card: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        emerald: {
          DEFAULT: '#059669',
          foreground: '#ffffff',
        },
        gold: {
          DEFAULT: '#F59E0B',
          foreground: '#ffffff',
        },
        border: {
          light: 'rgba(0, 0, 0, 0.1)',
          dark: 'rgba(255, 255, 255, 0.1)',
        },
        input: {
          dark: '#1e293b',
        },
        muted: {
          foreground: '#64748b',
        },
        destructive: {
          DEFAULT: '#d4183d',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
}
```

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

---

## 📱 Component Kodları

Tüm React Native component kodları `/src/` klasöründe bulunur:

### Screens:
- `src/screens/SplashScreen.tsx`
- `src/screens/LanguageSelection.tsx`
- `src/screens/AuthScreens.tsx`
- `src/screens/FavoriteTeams.tsx`
- `src/screens/MatchList.tsx`

### Components:
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Avatar.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/match/MatchCard.tsx`
- `src/components/match/PlayerCard.tsx`
- `src/components/match/StatCard.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/BottomBar.tsx`

### Constants & Types:
- `src/constants/theme.ts`
- `src/types/index.ts`

---

## 🎯 Ana App.tsx

```typescript
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/screens/SplashScreen';
import { LanguageSelection } from './src/screens/LanguageSelection';
import { AuthScreens } from './src/screens/AuthScreens';
import { FavoriteTeams } from './src/screens/FavoriteTeams';
import { MatchList } from './src/screens/MatchList';
import type { Screen } from './src/types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  // ... rest of the code (tüm handler fonksiyonları)
}
```

> **Tüm dosya kodları** bu klasördeki diğer dosyalarda mevcuttur.

---

## 📖 Daha Fazla Bilgi

- `SETUP_GUIDE.md` - Detaylı kurulum
- `PROJECT_STRUCTURE.md` - Dosya yapısı

---

## 💡 İpucu

Kodları kopyalamak yerine **ZIP indir**:

1. Sağ üst → Download Files
2. Zip'i aç
3. `npm install` çalıştır
4. `npm start` ile başlat

---

**Ready for iOS & Android! 📱**
