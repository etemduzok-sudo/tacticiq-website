# 🚀 Fan Manager 2026 - Hızlı Kurulum Rehberi

## ⚡ Hızlı Başlangıç (5 Dakika)

### 1️⃣ Node.js Yüklü mü Kontrol Et

```bash
node --version
# v18 veya üzeri olmalı
```

Yüklü değilse: [nodejs.org](https://nodejs.org) adresinden indirin.

### 2️⃣ Projeyi Aç

```bash
cd fan-manager-2026
```

### 3️⃣ Bağımlılıkları Yükle

```bash
npm install
```

⏱️ Bu işlem 2-3 dakika sürebilir.

### 4️⃣ Uygulamayı Başlat

```bash
npm start
```

Tarayıcınızda Expo DevTools açılacak.

### 5️⃣ Cihazınızda Test Edin

**iOS (iPhone/iPad)**
1. App Store'dan "Expo Go" indir
2. QR kodu iPhone kamerasıyla tarat
3. Expo Go'da aç

**Android**
1. Play Store'dan "Expo Go" indir
2. Expo Go uygulamasında "Scan QR Code"
3. QR kodu tarat

**Emülatör/Simulator**
- iOS Simulator: Terminalde `i` tuşuna bas
- Android Emulator: Terminalde `a` tuşuna bas

---

## 🛠️ Detaylı Kurulum

### Gereksinimler

| Araç | Minimum Versiyon | İndirme Linki |
|------|------------------|---------------|
| Node.js | 18.0+ | [nodejs.org](https://nodejs.org) |
| npm | 8.0+ | Node.js ile gelir |
| Expo Go | Son versiyon | [App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) |

### Platform-Specific Kurulum

#### 🍎 macOS (iOS Development)

```bash
# Homebrew yüklü değilse
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Watchman (isteğe bağlı ama önerilen)
brew install watchman

# Xcode Command Line Tools
xcode-select --install
```

#### 🪟 Windows (Android Development)

```bash
# Chocolatey yüklü değilse (PowerShell Admin)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Node.js
choco install nodejs

# Android Studio (Android Emulator için)
choco install androidstudio
```

#### 🐧 Linux

```bash
# Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Watchman
sudo apt-get install watchman
```

---

## 📱 Emülatör Kurulumu (İsteğe Bağlı)

### iOS Simulator (Sadece macOS)

1. **Xcode Yükle**:
   - Mac App Store'dan "Xcode" indir
   - İlk açılışta ek componentler yüklenecek

2. **Simulator Aç**:
   ```bash
   open -a Simulator
   ```

3. **Expo'dan iOS Simulator Başlat**:
   ```bash
   npm start
   # Sonra terminalde 'i' tuşuna bas
   ```

### Android Emulator

1. **Android Studio Yükle**:
   - [developer.android.com/studio](https://developer.android.com/studio) adresinden indir

2. **AVD Manager ile Emülatör Oluştur**:
   - Android Studio > Tools > AVD Manager
   - "Create Virtual Device"
   - Pixel 6 seç > Next
   - API 33 (Android 13) seç > Download > Next
   - Finish

3. **Emülatörü Başlat**:
   - AVD Manager'dan emülatörü başlat
   - Expo'dan:
   ```bash
   npm start
   # Sonra terminalde 'a' tuşuna bas
   ```

---

## 🔧 Sorun Giderme

### "EACCES: permission denied" Hatası

```bash
# npm global dizinini değiştir
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### "Metro bundler" Hatası

```bash
# Cache temizle
npm start -- --clear
# veya
expo start -c
```

### "Watchman" Hatası (macOS)

```bash
brew install watchman
```

### Port 8081 Zaten Kullanımda

```bash
# 8081 portunu kullanan process'i bul
lsof -i :8081

# Process'i kapat
kill -9 <PID>

# Veya farklı port kullan
npm start -- --port 8082
```

### iOS Simulator Açılmıyor

```bash
# Xcode Command Line Tools'u sıfırla
sudo xcode-select --reset
xcode-select --install
```

### Android Emulator Yavaş

1. Android Studio > AVD Manager
2. Emülatörü düzenle
3. "Graphics" ayarını "Hardware" yap
4. RAM'i artır (min 2GB)

---

## 📦 Bağımlılık Sorunları

### Tüm Bağımlılıkları Sıfırla

```bash
# node_modules ve package-lock.json'ı sil
rm -rf node_modules package-lock.json

# Tekrar yükle
npm install
```

### Spesifik Paket Hatası

```bash
# Önce o paketi sil
npm uninstall <paket-adi>

# Sonra tekrar yükle
npm install <paket-adi>
```

---

## 🌐 Build Alma (İsteğe bağlı)

### iOS Build

```bash
# Expo hesabı gerekli
eas build --platform ios
```

### Android Build

```bash
# Expo hesabı gerekli
eas build --platform android
```

**Not**: EAS Build için [expo.dev](https://expo.dev) üzerinden ücretsiz hesap oluşturabilirsiniz.

---

## ✅ Kurulum Testi

Kurulum başarılı mı kontrol edin:

```bash
# Node.js
node --version # v18.0.0 veya üzeri

# npm
npm --version # 8.0.0 veya üzeri

# Expo CLI
npx expo --version # 50.0.0 veya üzeri
```

Uygulamayı çalıştırın:

```bash
npm start
```

✅ **Başarılı**: Tarayıcıda Expo DevTools ve QR kod göründü  
✅ **Başarılı**: Expo Go ile QR kodu taratınca uygulama açıldı  
✅ **Başarılı**: Splash screen ve dil seçimi ekranı göründü

---

## 📞 Destek

Sorun mu yaşıyorsunuz?

1. **README.md** dosyasını okuyun
2. **GitHub Issues** açın
3. **Expo Forums**: [forums.expo.dev](https://forums.expo.dev)
4. **React Native Docs**: [reactnative.dev](https://reactnative.dev)

---

## 🎉 Hazırsınız!

Artık uygulamayı geliştirebilir ve test edebilirsiniz.

**Sonraki Adımlar**:
- `/src/screens/` klasöründeki ekranları inceleyin
- `/src/components/ui/` klasöründeki UI componentlerini kullanın
- `/src/constants/theme.ts` dosyasından renk ve boyutları alın

**İyi Geliştirmeler! 🚀**
