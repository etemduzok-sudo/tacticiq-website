# Mobil Uygulama Başlatma Rehberi

## ✅ Doğru Başlatma Yöntemi

### Mobil için (Android/iOS Emulator veya Fiziksel Cihaz):

```bash
# 1. Cache temizle (eğer sorun varsa)
npm start -- --clear

# 2. Normal modda başlat (web modu DEĞİL)
npm start
```

### QR Kod ile:
1. `npm start` çalıştır
2. Terminal'de QR kod görünecek
3. Expo Go uygulamasıyla QR kodu tara
4. Uygulama otomatik yüklenecek

### Android Emulator için:
```bash
npm run android
```

### iOS Simulator için (Mac):
```bash
npm run ios
```

---

## ❌ Yapılmayacaklar

1. **Web modunda başlatma** - Mobil için gerekli değil
   ```bash
   # ❌ YAPMAYIN
   npm start -- --web
   ```

2. **Metro bundler web hatası** - Web modu mobil için gerekli değil
   - `localhost:8081` web bundle hatası normaldir
   - Mobil için normal mod yeterli

---

## 🔧 Sorun Giderme

### Metro bundler hata veriyorsa:
```bash
# Tüm node processleri durdur
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Cache temizle
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Yeniden başlat
npm start -- --clear
```

### Yerel Ağ İzni:
- Metro bundler cihaz bulmak için izin ister
- **Engelle** diyebilirsiniz - mobil çalışması için gerekli değil
- Sadece hot reload için kullanılır

---

## 📱 Mobil Profil Ekranları Test

1. `npm start` ile Metro bundler'ı başlat
2. QR kodu Expo Go ile tara
3. Profil sekmesine git
4. Test edilecek bölümler:
   - ✅ Profil Header (Avatar, İsim, PRO badge)
   - ✅ Ranking (Top %X formatında)
   - ✅ İstatistikler
   - ✅ Favori Takımlar (Düzenle butonu ile)
   - ✅ Profil Düzenleme (İsim, Soyisim, Nickname)
   - ✅ Ayarlar (Dil, Bildirimler)
   - ✅ Güvenlik ve Hesap (Şifre, Çıkış, Sil)

---

## 🌐 Web İçin

Web için **ayrı** bir proje var: `website/`
- Web için: `cd website && npm run dev`
- Mobil web için: `npm start -- --web` (şimdilik gerekli değil)
