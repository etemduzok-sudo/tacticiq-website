# 🚨 Web 500 Hatası - Final Çözüm

## Sorun
Web'de 500 Internal Server Error alınıyor. Metro bundler bundle oluştururken hata veriyor.

## Olası Nedenler

1. **expo-router hala aktif**
   - `expo-router/_error.bundle` yüklenmeye çalışıyor
   - Metro config bypass yeterli değil

2. **Metro bundler hatası**
   - Terminal'deki hata mesajı görülmeli
   - Syntax hatası veya import hatası olabilir

3. **Entry point sorunu**
   - `index.js` veya `App.tsx` import edilemiyor
   - Dosya yolu hatası olabilir

## Çözüm Adımları

### Adım 1: Terminal'deki Hata Mesajını Görün

```bash
# Yeni terminal açın
cd C:\fan_manager_2026
npx expo start --web --clear
```

Terminal'deki **TÜM** hata mesajlarını kopyalayın ve paylaşın.

### Adım 2: expo-router'ı Geçici Olarak Kaldırın (Test)

```bash
# expo-router'ı geçici olarak kaldır
npm uninstall expo-router

# Web'i başlat
npx expo start --web --clear
```

**Not:** Native için gerekliyse, test sonrası geri yükleyin:
```bash
npm install expo-router@^3.5.0
```

### Adım 3: Metro Config'i Tamamen Sıfırlayın

```bash
# Metro config'i default'a döndür
cp metro.config.backup.js metro.config.js

# Veya minimal config kullan
cp metro.config.minimal.js metro.config.js
```

### Adım 4: Browser Cache Temizleyin

1. Browser'da `Ctrl+Shift+Delete`
2. "Cached images and files" seçin
3. Temizleyin
4. Hard refresh: `Ctrl+F5`

## Debug Komutları

```bash
# Metro bundler'ı verbose mode'da başlat
npx expo start --web --clear --verbose

# Node version kontrol
node --version

# Expo version kontrol
npx expo --version
```

## Terminal'deki Hata Mesajı Örnekleri

Eğer şu hataları görüyorsanız:

```
Error: Cannot find module 'expo-router'
→ expo-router kaldırılmalı veya ignore edilmeli

Error: Cannot resolve module './App'
→ App.tsx dosya yolu kontrol edilmeli

SyntaxError: Unexpected token
→ Metro config'de syntax hatası olabilir
```

## Son Çare

Eğer hiçbiri çalışmazsa:

1. `expo-router` package'ını tamamen kaldırın
2. Web için farklı bir entry point kullanın
3. Veya web için farklı bir bundler (Webpack) kullanın
