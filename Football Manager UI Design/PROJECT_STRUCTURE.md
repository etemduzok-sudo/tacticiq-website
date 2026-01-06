# 📁 Fan Manager 2026 - Proje Yapısı

Bu dokümantasyon, projedeki her dosyanın ve klasörün amacını açıklar.

## 📊 Genel Bakış

```
fan-manager-2026-rn/
├── 📱 App.tsx                 # Ana uygulama giriş noktası
├── 📦 package.json            # NPM bağımlılıkları ve scriptler
├── ⚙️  app.json               # Expo yapılandırması
├── 🔧 babel.config.js         # Babel transpiler yapılandırması
├── 🎨 tailwind.config.js      # Tailwind CSS yapılandırması
├── 📝 tsconfig.json           # TypeScript yapılandırması
├── 🚇 metro.config.js         # Metro bundler yapılandırması
├── 📖 README.md               # Proje dokümantasyonu
├── 🚀 SETUP_GUIDE.md          # Detaylı kurulum rehberi
├── 📋 PROJECT_STRUCTURE.md    # Bu dosya
│
├── 📂 src/
│   ├── 🧩 components/         # Yeniden kullanılabilir bileşenler
│   │   ├── ui/               # Genel UI bileşenleri
│   │   │   ├── Button.tsx           # Buton bileşeni
│   │   │   ├── Input.tsx            # Input bileşeni
│   │   │   ├── Card.tsx             # Card container
│   │   │   ├── Avatar.tsx           # Kullanıcı avatarı
│   │   │   ├── Badge.tsx            # Rozet/etiket bileşeni
│   │   │   └── utils.ts             # Utility fonksiyonları (cn)
│   │   │
│   │   ├── match/            # Maç ile ilgili bileşenler
│   │   │   ├── MatchCard.tsx        # Maç kartı
│   │   │   ├── PlayerCard.tsx       # Oyuncu kartı
│   │   │   └── StatCard.tsx         # İstatistik kartı
│   │   │
│   │   └── layout/           # Layout bileşenleri
│   │       ├── Header.tsx           # Sayfa başlığı
│   │       └── BottomBar.tsx        # Alt navigasyon barı
│   │
│   ├── 📄 screens/            # Uygulama ekranları
│   │   ├── SplashScreen.tsx         # Açılış ekranı
│   │   ├── LanguageSelection.tsx    # Dil seçimi
│   │   ├── AuthScreens.tsx          # Giriş/Kayıt ekranları
│   │   ├── FavoriteTeams.tsx        # Favori takım seçimi
│   │   └── MatchList.tsx            # Maç listesi ana ekranı
│   │
│   ├── 🎨 constants/          # Sabitler ve yapılandırma
│   │   └── theme.ts                 # Renk paleti, boyutlar
│   │
│   └── 📐 types/              # TypeScript tip tanımları
│       └── index.ts                 # Ana tip tanımları
│
└── 📦 node_modules/           # NPM bağımlılıkları (git'e dahil değil)
```

---

## 📱 Kök Dizin Dosyaları

### App.tsx
**Amaç:** Uygulamanın ana giriş noktası  
**İçerik:**
- State yönetimi (currentScreen, selectedMatchId, vb.)
- Ekran geçiş mantığı
- SafeAreaProvider wrapper
- StatusBar yapılandırması

**Önemli Fonksiyonlar:**
- `handleSplashComplete()` - Splash ekranı sonrası yönlendirme
- `handleAuthComplete()` - Giriş sonrası yönlendirme
- `handleMatchSelect()` - Maç seçimi işlemi

### package.json
**Amaç:** NPM bağımlılıkları ve proje metadata  
**Önemli Bağımlılıklar:**
- `expo` - Expo framework
- `react-native` - React Native core
- `nativewind` - Tailwind CSS for RN
- `@react-navigation/*` - Navigasyon
- `@react-native-async-storage/async-storage` - Veri saklama

**Scriptler:**
- `npm start` - Expo dev server başlat
- `npm run ios` - iOS'ta çalıştır
- `npm run android` - Android'de çalıştır

### app.json
**Amaç:** Expo ve uygulama yapılandırması  
**İçerik:**
- Uygulama adı ve slug
- Icon ve splash screen yolları
- iOS ve Android yapılandırması
- Bundle identifier'lar

### babel.config.js
**Amaç:** JavaScript transpiler yapılandırması  
**İçerik:**
- `babel-preset-expo` - Expo preset
- `nativewind/babel` - NativeWind plugin
- `react-native-reanimated/plugin` - Animasyon plugin

### tailwind.config.js
**Amaç:** Tailwind CSS yapılandırması  
**İçerik:**
- Content paths (hangi dosyaları tara)
- Özel renkler (emerald, gold, vb.)
- NativeWind preset

### tsconfig.json
**Amaç:** TypeScript compiler yapılandırması  
**İçerik:**
- Strict mode enabled
- Path aliasing (@/*)
- Expo type definitions

---

## 🧩 Components Dizini

### 📂 ui/

#### Button.tsx
**Props:**
```typescript
{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gold' | 'destructive';
  size?: 'default' | 'small' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}
```
**Özellikler:**
- 5 farklı variant
- Loading state
- Icon desteği
- Tam genişlik opsiyonu

#### Input.tsx
**Props:**
```typescript
{
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
}
```
**Özellikler:**
- Label desteği
- Hata mesajı gösterimi
- Farklı klavye tipleri
- Multiline desteği

#### Card.tsx
**Props:**
```typescript
{
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}
```
**Özellikler:**
- 3 farklı variant
- Flexible children
- Custom className desteği

#### Avatar.tsx
**Props:**
```typescript
{
  source?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  showBadge?: boolean;
  badgeColor?: string;
}
```
**Özellikler:**
- Resim veya initial gösterimi
- 3 farklı boyut
- Badge desteği

#### Badge.tsx
**Props:**
```typescript
{
  text: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gold';
  size?: 'small' | 'medium';
}
```
**Özellikler:**
- 5 farklı renk variant
- 2 farklı boyut

---

### 📂 match/

#### MatchCard.tsx
**Amaç:** Maç bilgilerini gösterir  
**Kullanım:** MatchList ekranında  
**Özellikler:**
- Live, upcoming, finished durumları
- Skor gösterimi
- Dakika gösterimi (live için)
- Temel istatistikler

#### PlayerCard.tsx
**Amaç:** Oyuncu bilgilerini gösterir  
**Kullanım:** Kadro ekranında  
**Özellikler:**
- Forma numarası
- Avatar
- Pozisyon
- Rating (varsa)

#### StatCard.tsx
**Amaç:** İstatistik karşılaştırması gösterir  
**Kullanım:** Maç detay ekranında  
**Özellikler:**
- Home/Away karşılaştırma
- Progress bar gösterimi
- Percentage veya sayı desteği

---

### 📂 layout/

#### Header.tsx
**Amaç:** Sayfa başlığı ve navigasyon  
**Özellikler:**
- Geri butonu
- Başlık
- Sağ component (opsiyonel)
- SafeArea desteği

#### BottomBar.tsx
**Amaç:** Alt navigasyon barı  
**Özellikler:**
- Tab sistemi
- Aktif tab gösterimi
- Icon ve label
- 52px yükseklik (standart)

---

## 📄 Screens Dizini

### SplashScreen.tsx
**Amaç:** Uygulama açılış animasyonu  
**Süre:** 4 saniye  
**İşlevler:**
- Logo animasyonu
- Kullanıcı kontrolü (AsyncStorage)
- Otomatik yönlendirme

### LanguageSelection.tsx
**Amaç:** Dil seçimi ekranı  
**Diller:**
- 🇩🇪 Deutsch
- 🇬🇧 English
- 🇪🇸 Español
- 🇫🇷 Français
- 🇮🇹 Italiano
- 🇹🇷 Türkçe

### AuthScreens.tsx
**Amaç:** Giriş ve kayıt ekranları  
**İki Mod:**
1. **Login Mode:**
   - Email/şifre girişi
   - Sosyal medya girişi (Google, Apple)
   - Şifremi unuttum linki

2. **Register Mode:**
   - Kullanıcı adı
   - Email
   - Şifre (2x)
   - Kullanım koşulları checkbox

### FavoriteTeams.tsx
**Amaç:** Favori takım seçimi  
**Özellikler:**
- Arama fonksiyonu
- En fazla 5 takım
- Seçim göstergesi
- AsyncStorage'a kaydetme

### MatchList.tsx
**Amaç:** Ana maç listesi ekranı  
**Tabs:**
- 🔴 Canlı
- ⏰ Yaklaşan
- ✅ Biten

**Özellikler:**
- Tab navigasyonu
- Maç kartları
- Bottom bar
- Profile navigasyonu

---

## 🎨 Constants Dizini

### theme.ts
**Amaç:** Tasarım sistem sabitleri  

**COLORS:**
```typescript
{
  light: { background, card, text, border },
  dark: { background, card, text, border },
  emerald: '#059669',
  gold: '#F59E0B',
  destructive: '#d4183d'
}
```

**SIZES:**
```typescript
{
  buttonHeight: 50,
  bottomBarHeight: 52,
  screenWidth: 393,
  screenHeight: 852,
  headerHeight: 60
}
```

---

## 📐 Types Dizini

### index.ts
**Amaç:** Global TypeScript tip tanımları  

**Match Interface:**
```typescript
interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'finished' | 'upcoming';
  minute?: number;
  league: string;
}
```

**User Interface:**
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  level: number;
  coins: number;
  isPro: boolean;
}
```

**Player Interface:**
```typescript
interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  rating?: number;
  photo?: string;
}
```

---

## 🔄 Veri Akışı

### 1. Uygulama Başlatma
```
App.tsx (splash)
  → SplashScreen
  → AsyncStorage kontrolü
  → Language veya Matches'e yönlendirme
```

### 2. Onboarding Akışı
```
Language Selection
  → AsyncStorage.setItem('language')
  → Auth Screens
  → Login/Register
  → Favorite Teams
  → AsyncStorage.setItem('favorite-clubs')
  → Match List
```

### 3. Veri Saklama (AsyncStorage)
- `fan-manager-user` - Kullanıcı oturumu
- `fan-manager-language` - Seçilen dil
- `fan-manager-favorite-clubs` - Favori takımlar
- `fan-manager-theme` - Tema tercihi (dark/light)

---

## 🎯 Önemli Notlar

### NativeWind Kullanımı
- Web Tailwind CSS ile %95 aynı
- `className` prop'u kullan
- `w-[50px]` gibi arbitrary values destekleniyor
- `flex`, `gap`, `rounded-lg` gibi utility'ler çalışıyor

### AsyncStorage
- Promise-based API
- Key-value storage
- JSON.stringify/parse kullan

### Navigation
- State-based navigation (şu an)
- React Navigation'a kolayca geçilebilir
- Stack, Tab, Drawer desteklenir

### Animasyonlar
- React Native Animated API
- Reanimated 2 (gelecek için)
- LayoutAnimation (basit animasyonlar için)

---

## 📚 Ek Kaynaklar

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Güncel Tutulan:** 2026-01-04  
**Versiyon:** 1.0.0
