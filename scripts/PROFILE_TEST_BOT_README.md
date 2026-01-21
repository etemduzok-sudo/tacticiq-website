# TacticIQ Profil Test Botu

Web ve mobil profil kartları için otomatik test botu.

## 🚀 Kurulum

### 1. Playwright Kurulumu (Web Testleri İçin)

```bash
npm install --save-dev playwright
npx playwright install chromium
```

### 2. Test Botunu Çalıştırma

```bash
# Web testleri (Playwright)
npm run test:profile

# Veya direkt
node scripts/profile-test-bot.js
```

### 3. Mobil Testleri (Detox)

Mobil testleri için önce Detox test dosyası oluşturulur, sonra manuel çalıştırılır:

```bash
# iOS
npm run detox:test:ios -- e2e/profile-test-bot.test.ts

# Android
npm run detox:test:android -- e2e/profile-test-bot.test.ts
```

## 📋 Test Kapsamı

### Web Testleri (Playwright)
- ✅ Profil sayfasına erişim
- ✅ Profil header ve avatar kontrolü
- ✅ Tab navigation (Profil/Rozetler)
- ✅ Ranking Table görünürlüğü
- ✅ Achievements Card
- ✅ Performance Card ve XP Gain
- ✅ Kişisel Bilgiler düzenleme
  - İsim, Soyisim, Nickname input'ları
  - Düzenle/Kaydet butonları
- ✅ Milli Takım seçici
- ✅ Ayarlar bölümü
  - Dil seçimi
  - Saat dilimi seçimi
- ✅ Bildirim switch'leri (toggle testi)
- ✅ Push bildirim onay butonu
- ✅ Güvenlik ve Hesap butonları
  - Şifre değiştir
  - Çıkış yap
  - Hesabı sil
- ✅ Scroll overflow kontrolü (sağdan kesilme)

### Mobil Testleri (Detox)
- ✅ Giriş yapma
- ✅ Profil sayfasına navigasyon
- ✅ Profil header görünürlüğü
- ✅ Ranking table görünürlüğü
- ✅ Achievements card
- ✅ Performance card ve XP Gain
- ✅ Düzenle butonu ve input'lar
- ✅ Bildirim switch'leri
- ✅ Push bildirim butonu
- ✅ Güvenlik butonları
- ✅ Rozetler sekmesi

### Senkronizasyon Testleri
- ✅ Web ve mobil arası veri senkronizasyonu
- ✅ Aynı kullanıcı ile her iki platformda test

## 🔧 Yapılandırma

### Test Kullanıcıları

`scripts/profile-test-bot.js` dosyasında test kullanıcılarını düzenleyebilirsiniz:

```javascript
const TEST_USERS = [
  {
    email: 'test@tacticiq.app',
    password: 'Test123456!',
    name: 'Test User',
  },
];
```

### Web URL

Varsayılan olarak `http://localhost:3000` kullanılır. Değiştirmek için:

```javascript
await page.goto('http://localhost:3000', { ... });
```

## 📊 Test Sonuçları

Test sonuçları `test-results-profile-bot.json` dosyasına kaydedilir:

```json
{
  "timestamp": "2026-01-21T...",
  "duration": "45.23s",
  "summary": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "skipped": 0
  },
  "results": {
    "web": [...],
    "mobile": [...],
    "sync": [...],
    "errors": [...]
  }
}
```

## 🐛 Sorun Giderme

### Playwright Kurulum Hatası

```bash
npm install --save-dev playwright
npx playwright install chromium
```

### Web Sunucusu Çalışmıyor

Test botu çalışmadan önce web sunucusunun çalıştığından emin olun:

```bash
cd website
npm run dev
```

### Detox Testleri Çalışmıyor

Detox için önce uygulamayı build etmeniz gerekir:

```bash
npm run detox:build:ios
npm run detox:test:ios
```

## 📝 Notlar

- Web testleri görsel olarak çalışır (headless: false)
- Test adımları yavaşlatılmıştır (slowMo: 300ms)
- Gerçek kaydetme işlemleri yapılmaz (sadece UI testi)
- Mobil testleri için Detox kurulumu gerekir
