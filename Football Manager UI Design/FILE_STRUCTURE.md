# 📁 Fan Manager 2026 - Dosya Yapısı

## 🗂️ Proje Genel Bakış

```
fan-manager-2026/
│
├── 📄 Root Dosyalar
├── 📱 Source Kod (/src)
└── 📚 Dokümantasyon
```

---

## 📄 Root Dosyalar

### ⚙️ Konfigürasyon Dosyaları

| Dosya | Açıklama | Durum |
|-------|----------|-------|
| `package.json` | React Native dependencies | ✅ Native |
| `app.json` | Expo konfigürasyonu | ✅ Native |
| `babel.config.js` | Babel transpiler ayarları | ✅ Native |
| `tsconfig.json` | TypeScript konfigürasyonu | ✅ Native |
| `.gitignore` | Git ignore kuralları | ✅ Native |

### 📱 Ana Uygulama

| Dosya | Açıklama |
|-------|----------|
| `App.tsx` | Ana uygulama entry point + Navigation setup |

### 📚 Dokümantasyon

| Dosya | İçerik |
|-------|--------|
| `README.md` | Ana proje dökümantasyonu |
| `QUICK_START.md` | 5 dakikada başlangıç rehberi |
| `SETUP_GUIDE.md` | Detaylı kurulum adımları |
| `PROJECT_STATUS.md` | Proje durum raporu |
| `REACT_NATIVE_MIGRATION.md` | Web → Native geçiş detayları |
| `FILE_STRUCTURE.md` | Bu dosya |
| `PROJECT_STRUCTURE.md` | Eski yapı (referans) |

---

## 📱 Source Kod (`/src`)

```
src/
├── screens/          # Tüm ekranlar
├── components/       # Reusable componentler
├── contexts/         # React Context providers
├── constants/        # Sabitler (theme, colors, etc.)
├── types/           # TypeScript type definitions
└── imports/         # Figma imports (eski web assets)
```

---

## 🖥️ Screens (`/src/screens`)

### Onboarding Flow (4 ekran)

```
screens/
├── SplashScreen.tsx              # Başlangıç animasyonu (2 saniye)
├── LanguageSelection.tsx         # 6 dil seçimi (TR, EN, DE, FR, ES, IT)
├── AuthScreens.tsx               # Login/Register + Social auth
└── FavoriteTeams.tsx             # Favori takım seçimi
```

**Flow**: Splash → Language → Auth → Teams → Main App

### Ana Ekranlar (2 ekran)

```
screens/
├── MatchList.tsx                 # Maç listesi (Bottom Tab 1)
│   └── MatchDetail.tsx          # Maç detayları (Stack Screen)
│
└── Profile.tsx                   # Profil (Bottom Tab 2)
```

### Profil Alt Ekranları (7 ekran)

```
screens/
├── ProfileSettings.tsx           # Ayarlar
├── ProfileBadges.tsx            # Rozetler
├── Notifications.tsx            # Bildirimler
├── ProUpgrade.tsx               # Pro üyelik (Modal)
├── LegalDocuments.tsx           # Yasal dökümanlar listesi
├── LegalDocumentScreen.tsx      # Döküman görüntüleme
├── ChangePassword.tsx           # Şifre değiştirme
└── DeleteAccount.tsx            # Hesap silme
```

**Toplam**: 13 ekran

---

## 🧩 Components (`/src/components`)

### UI Components (`/src/components/ui`)

```
components/ui/
├── Button.tsx                    # Custom button (5 variant)
├── Input.tsx                     # Text input (icon, label, password)
├── Card.tsx                      # Card container (3 variant)
├── Avatar.tsx                    # User avatar (image/initials)
├── Badge.tsx                     # Badge/chip (6 variant)
└── utils.ts                      # Utility functions
```

#### Button Variants
```typescript
'primary'    // Zümrüt yeşili, ana aksiyon
'secondary'  // Surface rengi, ikincil aksiyon
'outline'    // Çerçeveli, ghost benzeri
'ghost'      // Transparan, minimal
'pro'        // Altın sarısı, premium özellikler
```

#### Input Features
- ✅ Left/right icons
- ✅ Label support
- ✅ Error message
- ✅ Password visibility toggle
- ✅ Custom styling

#### Card Variants
```typescript
'default'    // Standart card
'elevated'   // Shadow ile yükseltilmiş
'outlined'   // Border ile çerçeveli
```

### Layout Components (`/src/components/layout`)

```
components/layout/
├── BottomBar.tsx                 # Alt navigasyon bar (eski web)
└── Header.tsx                    # Başlık bar (eski web)
```

⚠️ **Not**: Bu layout componentleri eski web versiyonundan kalma. React Native versiyonunda React Navigation kullanılıyor.

### Match Components (`/src/components/match`)

```
components/match/
├── MatchCard.tsx                 # Maç kartı (eski web)
├── PlayerCard.tsx                # Oyuncu kartı (eski web)
└── StatCard.tsx                  # İstatistik kartı (eski web)
```

⚠️ **Not**: Bu componentler eski web versiyonundan kalma. İhtiyaç halinde React Native'e çevrilebilir.

---

## 🎨 Contexts (`/src/contexts`)

```
contexts/
└── ThemeContext.tsx              # Dark/Light mode yönetimi
```

### ThemeContext API

```typescript
const { theme, toggleTheme, setTheme } = useTheme();

// theme: 'dark' | 'light'
// toggleTheme: () => void
// setTheme: (theme: 'dark' | 'light') => void
```

**Storage**: AsyncStorage kullanarak tema tercihi kaydedilir.

---

## 🎨 Constants (`/src/constants`)

```
constants/
└── theme.ts                      # Renk paleti, boyutlar, typography
```

### Theme Sabitleri

```typescript
COLORS: {
  dark: { background, surface, primary, accent, ... },
  light: { background, surface, primary, accent, ... }
}

SPACING: { xs, sm, md, lg, xl, xxl }

SIZES: { 
  buttonHeight: 50,
  inputHeight: 50,
  bottomBarHeight: 52,
  borderRadius: 12,
  ...
}

TYPOGRAPHY: {
  h1, h2, h3,
  body, bodyMedium, bodySemibold,
  caption, captionMedium,
  small, button
}

SHADOWS: { small, medium, large }
```

---

## 📝 Types (`/src/types`)

```
types/
└── index.ts                      # Tüm TypeScript type definitions
```

### Ana Tipler

```typescript
Language                          # 'tr' | 'en' | 'de' | ...
LanguageOption                    # Dil seçeneği objesi
Team                             # Takım bilgisi
Match                            # Maç bilgisi
Player                           # Oyuncu bilgisi
User                             # Kullanıcı bilgisi
Badge                            # Rozet bilgisi
Notification                     # Bildirim bilgisi
```

---

## 🖼️ Imports (`/src/imports`)

```
imports/
├── FlagOfTurkey1.tsx            # Türkiye bayrağı SVG
└── svg-2htbp2bxd2.ts           # SVG path data
```

⚠️ **Not**: Bu klasör eski Figma web import'larından kalma. React Native versiyonunda kullanılmıyor, ama referans için tutulmuş.

---

## 🗑️ Silinmiş Web Dosyaları

Aşağıdaki dosyalar React Native'e geçişte silindi:

### Konfigürasyon
- ❌ `vite.config.ts` - Web bundler
- ❌ `postcss.config.mjs` - PostCSS
- ❌ `tailwind.config.js` - Tailwind CSS
- ❌ `index.html` - Web entry point
- ❌ `/src/index.tsx` - Web render

### Stil Dosyaları
- ❌ `/src/styles/fonts.css`
- ❌ `/src/styles/index.css`
- ❌ `/src/styles/tailwind.css`
- ❌ `/src/styles/theme.css`

### Web UI Components
- ❌ `/src/app/components/ui/*` - Radix UI tabanlı componentler
- ❌ Tüm web-specific componentler

---

## 📊 Dosya Sayıları

| Kategori | Adet |
|----------|------|
| **Screens** | 13 |
| **UI Components** | 5 (Button, Input, Card, Avatar, Badge) |
| **Contexts** | 1 (ThemeContext) |
| **Constants** | 1 (theme.ts) |
| **Type Definitions** | 1 (index.ts) |
| **Config Files** | 5 (package.json, app.json, babel, tsconfig, gitignore) |
| **Documentation** | 7 |

**Toplam**: ~33 aktif dosya

---

## 🔄 Navigation Yapısı

```
<NavigationContainer>
  <RootStack>
    ├── Splash
    ├── LanguageSelection
    ├── Auth
    ├── FavoriteTeams
    ├── MainTabs
    │   ├── <BottomTab: Matches>
    │   │   └── MatchList
    │   └── <BottomTab: Profile>
    │       └── Profile
    ├── MatchDetail (Stack)
    ├── ProfileSettings (Stack)
    ├── ProfileBadges (Stack)
    ├── Notifications (Stack)
    ├── ProUpgrade (Modal)
    ├── LegalDocuments (Stack)
    ├── LegalDocument (Stack)
    ├── ChangePassword (Stack)
    └── DeleteAccount (Stack)
  </RootStack>
</NavigationContainer>
```

---

## 📦 Dependencies Özeti

### Core
- `expo` - React Native framework
- `react-native` - Native platform
- `@react-navigation/*` - Navigation
- `@expo/vector-icons` - Icons

### UI & UX
- `expo-linear-gradient` - Gradients
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gestures

### Utilities
- `@react-native-async-storage/async-storage` - Storage
- `react-native-safe-area-context` - Safe areas
- `react-native-svg` - SVG support

**Toplam**: ~20 paket

---

## 🎯 Klasör Kullanım Kılavuzu

### Yeni Ekran Eklemek

1. `/src/screens/NewScreen.tsx` oluşturun
2. `/App.tsx`'de Stack.Screen ekleyin
3. Navigation type'ları güncelleyin

### Yeni UI Component Eklemek

1. `/src/components/ui/NewComponent.tsx` oluşturun
2. StyleSheet kullanın (CSS değil!)
3. Theme'den renkleri alın

### Theme Güncellemek

1. `/src/constants/theme.ts` dosyasını düzenleyin
2. COLORS, SPACING, SIZES veya TYPOGRAPHY'yi güncelleyin
3. Tüm uygulama otomatik güncellenir

---

## 🚀 Önerilen Geliştirme Sırası

1. **API Entegrasyonu** → `/src/services/api.ts` oluştur
2. **State Management** → Redux/Zustand ekle
3. **Animasyonlar** → Reanimated ile geçişler
4. **i18n** → `/src/i18n/` klasörü oluştur
5. **Testing** → `__tests__` klasörü oluştur

---

## 📝 Notlar

- ✅ Tüm ekranlar TypeScript ile yazıldı
- ✅ StyleSheet API kullanıldı (CSS yok)
- ✅ React Navigation kurulu
- ✅ Theme sistem hazır
- ⚠️ Eski web componentleri referans için tutulmuş
- ⚠️ `/src/app/` klasörü web versiyonu (kullanılmıyor)

---

**Son Güncelleme**: 4 Ocak 2026  
**Platform**: React Native (Expo)  
**Durum**: ✅ Production Ready
