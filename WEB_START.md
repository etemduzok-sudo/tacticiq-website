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

### Çözüm (500 / routerRoot hatası)
1. **Port 8081/8083 doluysa** önce: `npm run web:kill` çalıştır. Sonra devam et.
2. **Sadece bir terminalde** şunu çalıştır:
   ```bash
   npm run web:dev
   ```
   (`web:dev` zaten önce `web:kill` çalıştırır; yine de "Port zaten kullanılıyor" hatası alırsan bir kez elle `npm run web:kill` yap.)
3. "TARAYICIDA SADECE BUNU AC: http://localhost:8081" yazısını gördükten sonra tarayıcıda **sadece** http://localhost:8081 aç. **8083 veya başka port açma** — 500 alırsın.
4. Eski bir sekmede 8081 açıksa **o sekmeyi kapat**, yeni sekmede tekrar http://localhost:8081 aç.

---

## 📱 En Kolay Yöntem: Expo Go

1. `npm start` ile Metro bundler'ı başlat
2. QR kodu Expo Go ile tara
3. Profil ekranlarını mobil cihazda test et

Bu yöntem en güvenilir ve hızlı olanıdır.
