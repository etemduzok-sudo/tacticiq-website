# 🌐 Mobil Web Başlatma Rehberi

## ⚠️ Bilinen Sorun

Expo web modu (`npm run web:dev`) Metro bundler ile Expo Router çakışması yaşayabilir. 

## ✅ Önerilen Çözüm

### 1. QR Kod ile Expo Go (En Kolay)
```bash
npm start
```
- Terminal'de QR kod görünecek
- Expo Go uygulamasıyla QR kodu tara
- Profil ekranlarını mobil cihazda test et

### 2. Android Emulator
```bash
npm run android
```

### 3. iOS Simulator (Mac)
```bash
npm run ios
```

---

## 🔧 Web Modu Sorunları

### Sorun:
```
GET http://localhost:8081/index.bundle?platform=web...
ERR_ABORTED 500 (Internal Server Error)
MIME type ('application/json') is not executable
```

### Neden:
- Expo Router web modunda Metro bundler ile sorun çıkarıyor
- `routerRoot=app` parametresi var ama app/ klasörü yok veya sorunlu

### Geçici Çözüm:
Eğer web modunda görmek istiyorsanız:
1. `app/` klasörünü geçici olarak devre dışı bırakın
2. `scripts/start-web.ps1` script'ini kullanın

```powershell
.\scripts\start-web.ps1
```

Bu script:
- `app/` klasörünü `app.disabled` olarak yeniden adlandırır
- Cache temizler
- Web modunu başlatır

---

## 📱 En Kolay Yöntem: Expo Go

1. `npm start` ile Metro bundler'ı başlat
2. QR kodu Expo Go ile tara
3. Profil ekranlarını mobil cihazda test et

Bu yöntem en güvenilir ve hızlı olanıdır.
