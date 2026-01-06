# ⚡ Quick Start - Fan Manager 2026

## 🚀 5 Dakikada Başla!

### 1️⃣ Kurulum

```bash
# Projeyi açın
cd fan-manager-2026

# Bağımlılıkları yükleyin
npm install
```

### 2️⃣ Başlatın

```bash
npm start
```

### 3️⃣ Test Edin

**Cihazınızda (Önerilen)**:
1. App Store/Play Store'dan **Expo Go** indirin
2. QR kodu telefonunuzun kamerasıyla tarayın
3. Uygulama açılacak! 🎉

**Emülatörde**:
- iOS: Terminalde `i` tuşuna basın
- Android: Terminalde `a` tuşuna basın

---

## 📱 Proje Özeti

✅ **13 Ekran** hazır  
✅ **Dark/Light Mode** desteği  
✅ **Premium UI/UX** tasarımı  
✅ **TypeScript** desteği  
✅ **React Navigation** kurulu  

---

## 🎯 İlk Adımlar

### Ekranları İnceleyin
```
/src/screens/
├── SplashScreen.tsx         ← Başlangıç
├── LanguageSelection.tsx    ← 6 dil seçimi
├── AuthScreens.tsx          ← Login/Register
├── FavoriteTeams.tsx        ← Takım seçimi
├── MatchList.tsx            ← Ana ekran
└── ... (9 ekran daha)
```

### UI Componentleri Kullanın
```tsx
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

// Kullanım:
<Button title="Devam Et" onPress={handlePress} variant="primary" />
<Input label="E-posta" placeholder="email@example.com" />
<Card variant="elevated">...</Card>
```

### Theme Sistemi
```tsx
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants/theme';

const { theme, toggleTheme } = useTheme();
const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
```

---

## 🛠️ Geliştirme İpuçları

### Hot Reload
Dosyaları düzenleyin, otomatik yenilenir ✨

### Cache Temizleme
```bash
npm start -- --clear
```

### Debug Menu
Cihazınızı sallayın veya `Cmd+D` (iOS) / `Cmd+M` (Android)

---

## 📖 Detaylı Dökümanlar

- **README.md**: Tam proje dökümantasyonu
- **SETUP_GUIDE.md**: Detaylı kurulum rehberi
- **PROJECT_STATUS.md**: Tamamlanan/eksik özellikler
- **REACT_NATIVE_MIGRATION.md**: Web'den Native'e geçiş detayları

---

## ⚠️ Önemli

❌ **Figma Make'te çalışmaz!**  
✅ **Sadece React Native/Expo ortamında çalışır**  

Projeyi download edip kendi bilgisayarınızda çalıştırın.

---

## 🎉 Hazırsınız!

Artık geliştirmeye başlayabilirsiniz!

**Sorun mu var?** → SETUP_GUIDE.md'de "Sorun Giderme" bölümüne bakın.

---

**Happy Coding! 🚀⚽**
