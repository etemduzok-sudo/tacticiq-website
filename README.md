# TacticIQ.app

Modern ve profesyonel bir futbol yönetim uygulaması.

## 🚀 Özellikler

- ✅ Splash Screen & Dil Seçimi
- ✅ Kayıt/Giriş Sistemi
- ✅ Favori Takım Seçimi
- ✅ Maç Listesi & Detayları
- ✅ Canlı Maç Takibi
- ✅ Tahmin Sistemi
- ✅ Profil Yönetimi
- ✅ Dark/Light Mode
- ✅ Pro Üyelik Sistemi

## 🛠️ Teknolojiler

- React Native 0.76.5
- Expo 52.0.0
- TypeScript
- React Navigation 7.x
- Async Storage
- Linear Gradient
- Vector Icons

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Projeyi başlat
npm start

# iOS'ta çalıştır (Mac gerekli)
npm run ios

# Android'de çalıştır
npm run android
```

## 📱 Mobil Cihazda Test

1. **Expo Go** uygulamasını App Store veya Play Store'dan indirin
2. `npm start` komutuyla projeyi başlatın
3. QR kodu tarayın
4. Uygulama otomatik olarak açılacak

## 📁 Proje Yapısı

```
src/
├── components/
│   ├── atoms/          # Temel UI bileşenleri (Button, Input, Card)
│   ├── molecules/      # Birleşik bileşenler (MatchCard, PlayerCard)
│   └── organisms/      # Karmaşık bileşenler (Header, BottomBar)
├── screens/            # Uygulama ekranları
├── navigation/         # Navigation yapılandırması
├── contexts/           # React Context'ler (Theme)
├── theme/              # Tema, renkler, tipografi
├── types/              # TypeScript tip tanımları
└── utils/              # Yardımcı fonksiyonlar
```

## 🎨 Tasarım Sistemi

Proje **Atomic Design** prensiplerine göre yapılandırılmıştır:
- **Atoms**: Button, Input, Card, Avatar, Badge
- **Molecules**: MatchCard, PlayerCard
- **Organisms**: Header, BottomBar
- **Templates**: Screen layouts
- **Pages**: Complete screens

## 🌙 Tema Sistemi

Uygulama tam dark/light mode desteği ile gelir:
- Otomatik sistem teması algılama
- Manuel tema değiştirme
- AsyncStorage ile tema kaydı
- Tüm componentler tema destekli

## 📄 Lisans

© 2026 Fan Manager. Tüm hakları saklıdır.
