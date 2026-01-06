# Fan Manager 2026 - React Native

🎮 **Premium Futbol Menajerlik Oyunu** - React Native Versiyonu

---

## ⚠️ ÖNEMLI UYARI

**Bu proje FIGMA MAKE'te ÇALIŞMAZ!**

Bu bir **React Native** projesidir ve sadece **iOS/Android** cihazlarda çalışır.

✅ **Nasıl Çalıştırılır?**
1. Projeyi download edin
2. `npm install` 
3. `npm start`
4. Expo Go ile QR kodu taratın

📖 Detaylı kurulum için: **[SETUP_GUIDE.md](SETUP_GUIDE.md)**

---

## 📱 Proje Hakkında

Fan Manager 2026, premium spor estetiği ve kullanıcı tutma odaklı bir futbol menajerlik oyunu uygulamasıdır. Bu React Native versiyonu, iOS ve Android platformlarında çalışmak üzere optimize edilmiştir.

## 🎨 Tasarım İlkeleri

1. **Premium Spor Estetiği**: Lüks spor kanalı hissi veren arayüz
2. **Dinamik Hiyerarşi**: Kullanıcı deneyimini önceliklendiren layout
3. **Oyunlaştırma**: Rozetler, seviyeler ve görsel geri bildirimler
4. **Akıcı Etkileşim**: Pürüzsüz animasyonlar ve geçişler

## 🎨 Renk Paleti

### Dark Mode (Varsayılan)
- **Arka Plan**: `#0F172A`
- **Surface**: `#1E293B`
- **Primary**: `#059669` (Zümrüt Yeşili)
- **Accent**: `#F59E0B` (Altın Sarısı - Pro özellikler)

### Light Mode
- **Arka Plan**: `#F8FAFB`
- **Surface**: `#FFFFFF`
- **Primary**: `#059669` (Zümrüt Yeşili)
- **Accent**: `#F59E0B` (Altın Sarısı - Pro özellikler)

## 📐 Standartlar

- **Buton Yüksekliği**: 50px
- **Input Yüksekliği**: 50px
- **Bottom Bar Yüksekliği**: 52px
- **Border Radius**: 12px

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Expo CLI
- iOS Simulator (Mac için) veya Android Emulator

### Adım 1: Bağımlılıkları Yükle

```bash
npm install
# veya
yarn install
```

### Adım 2: Uygulamayı Başlat

```bash
npm start
# veya
expo start
```

### Adım 3: Platform Seçin

- **iOS**: `i` tuşuna basın veya QR kodu Expo Go ile tarayın
- **Android**: `a` tuşuna basın veya QR kodu Expo Go ile tarayın
- **Web**: `w` tuşuna basın (deneysel)

## 📁 Proje Yapısı

```
/
├── App.tsx                      # Ana uygulama ve navigation
├── app.json                     # Expo konfigürasyonu
├── package.json                 # Bağımlılıklar
│
├── src/
│   ├── screens/                 # Tüm ekranlar
│   │   ├── SplashScreen.tsx
│   │   ├── LanguageSelection.tsx
│   │   ├── AuthScreens.tsx
│   │   ├── FavoriteTeams.tsx
│   │   ├── MatchList.tsx
│   │   ├── MatchDetail.tsx
│   │   ├── Profile.tsx
│   │   └── ... (diğer ekranlar)
│   │
│   ├── components/              # Reusable componentler
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ... (diğer UI componentleri)
│   │   └── ... (özel componentler)
│   │
│   ├── contexts/                # React Context'ler
│   │   └── ThemeContext.tsx
│   │
│   ├── constants/               # Sabitler ve tema
│   │   └── theme.ts
│   │
│   └── types/                   # TypeScript tipleri
│       └── index.ts
```

## 📱 Ekranlar

### Onboarding Flow
1. **Splash Screen**: Hoş geldin animasyonu
2. **Language Selection**: 6 dil desteği (TR, EN, DE, FR, ES, IT)
3. **Auth Screens**: Giriş/Kayıt ekranları
4. **Favorite Teams**: Favori takım seçimi

### Ana Ekranlar
1. **Match List**: Maç listesi (Canlı, Gelecek, Biten)
2. **Match Detail**: Detaylı maç bilgileri
3. **Profile**: Kullanıcı profili ve ayarlar

### Alt Ekranlar
- Profile Settings
- Profile Badges
- Notifications
- Pro Upgrade
- Legal Documents
- Change Password
- Delete Account

## 🎯 Özellikler

### Tamamlananlar ✅
- ✅ React Navigation (Stack & Bottom Tabs)
- ✅ Dark/Light Mode Theme System
- ✅ AsyncStorage ile veri saklama
- ✅ Reusable UI Components (Button, Input, Card)
- ✅ TypeScript desteği
- ✅ Responsive tasarım
- ✅ Premium UI/UX

### Geliştirilebilecekler 🔨
- [ ] Maç detay sekmeleri (Özet, Kadro, İstatistikler, Canlı)
- [ ] Player profil sayfaları
- [ ] Gerçek API entegrasyonu
- [ ] Push notification
- [ ] Animasyonlar (react-native-reanimated)
- [ ] Gesture handling (swipe, drag)
- [ ] Haptic feedback
- [ ] Oyunlaştırma sistemi (XP, seviye, rozetler)
- [ ] Pro üyelik sistemi
- [ ] Çoklu dil desteği (i18n)

## 🛠️ Teknoloji Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation 7
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons (Ionicons)
- **Gradients**: expo-linear-gradient
- **Language**: TypeScript

## 🎨 UI Component Kullanımı

### Button

```tsx
import Button from '../components/ui/Button';

<Button
  title="Devam Et"
  onPress={handlePress}
  variant="primary" // primary, secondary, outline, ghost, pro
  fullWidth
/>
```

### Input

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

### Card

```tsx
import Card from '../components/ui/Card';

<Card variant="elevated">
  <Text>İçerik</Text>
</Card>
```

## 🌐 Theme Kullanımı

```tsx
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants/theme';

const { theme, toggleTheme } = useTheme();
const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

// Kullanım
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Merhaba</Text>
</View>
```

## 📝 Notlar

⚠️ **ÖNEMLİ**: Bu proje Figma Make ortamında çalışmaz! Sadece React Native/Expo ortamında çalışır.

### Kurulum Sonrası
1. Expo hesabı oluşturun (isteğe bağlı)
2. Expo Go uygulamasını indirin (iOS/Android)
3. QR kod ile cihazınızda test edin

### Test Edilmesi Gerekenler
- [ ] Tüm ekranlar arası navigation
- [ ] Dark/Light mode geçişi
- [ ] Form validasyonları
- [ ] Responsive tasarım (farklı ekran boyutları)
- [ ] iOS ve Android performansı

## 📄 Lisans

© 2026 Fan Manager. Tüm hakları saklıdır.

## 👨‍💻 Geliştirici

Bu proje, premium futbol menajerlik deneyimi sunmak amacıyla geliştirilmiştir.

---

**Destek için**: GitHub Issues'a ticket açabilirsiniz.

**Demo**: Expo Go ile QR kod okutarak test edebilirsiniz.

🚀 **İyi geliştirmeler!**