# TacticIQ Profil Test Botu

Web ve mobil profil kartları için kapsamlı otomatik test botu.

## Özellikler

- ✅ Aynı kullanıcılarla web ve mobil'de giriş yapar
- ✅ Tüm butonları test eder (Düzenle, Kaydet, İptal, Şifre Değiştir, Çıkış Yap, Hesabı Sil)
- ✅ Tüm switch'leri test eder (E-posta, Haftalık Özet, Kampanya, Push Bildirimler)
- ✅ Dil ve saat dilimi seçimlerini test eder
- ✅ Profil bilgilerini güncellemeyi test eder
- ✅ Takım seçimlerini test eder (Milli Takım, Kulüp Takımları)
- ✅ Badges tab'ını test eder
- ✅ Web ve mobil arası senkronizasyonu kontrol eder
- ✅ Scroll overflow kontrolü yapar (sağdan kesilme)
- ✅ Hızlı mod desteği

## Kullanım

### Web Testi (Playwright)

```bash
# Normal mod (görsel)
npm run test:profile

# Hızlı mod (bazı testleri atla)
FAST_MODE=true npm run test:profile

# Headless mod (arka planda)
HEADLESS=true npm run test:profile

# Özel URL
WEB_URL=http://localhost:3001 npm run test:profile
```

### Mobil Testi (Detox)

Test botu otomatik olarak `e2e/profile-test-bot.test.ts` dosyasını oluşturur.

```bash
# iOS
npm run detox:test:ios -- e2e/profile-test-bot.test.ts

# Android
npm run detox:test:android -- e2e/profile-test-bot.test.ts
```

## Test Kullanıcıları

Varsayılan test kullanıcıları:
- `test@tacticiq.app` / `Test123456!`
- `test2@tacticiq.app` / `Test123456!`

Bu kullanıcıların Supabase'de mevcut olması gerekir.

## Test Edilen Özellikler

### Web Profil Testleri

1. ✅ Giriş yapma
2. ✅ Profil sayfasına gitme
3. ✅ Profil header (avatar, isim)
4. ✅ Tab navigation (Profil/Rozetler)
5. ✅ Ranking Table (Ülke, Türkiye Sırası, Dünya Sırası)
6. ✅ Achievements Card
7. ✅ Performance Card (XP Gain bölümü dahil)
8. ✅ Kişisel Bilgiler (Düzenle, İsim, Soyisim, Nickname, Kaydet, İptal)
9. ✅ Milli Takım seçimi (dropdown açma, arama)
10. ✅ Ayarlar (Dil, Saat Dilimi)
11. ✅ Bildirim switch'leri (E-posta, Haftalık, Kampanya)
12. ✅ Push bildirim onay butonu
13. ✅ Güvenlik butonları (Şifre Değiştir, Çıkış Yap, Hesabı Sil)
14. ✅ Scroll overflow kontrolü

### Mobil Profil Testleri

1. ✅ Giriş yapma
2. ✅ Profil sayfasına gitme
3. ✅ Profil header
4. ✅ Tab navigation
5. ✅ Ranking Table/Card
6. ✅ Achievements Card
7. ✅ Performance Card (XP Gain)
8. ✅ Düzenle butonu ve input'lar
9. ✅ Bildirim switch'leri
10. ✅ Push bildirim onay butonu
11. ✅ Güvenlik butonları
12. ✅ Badges tab
13. ✅ Dil ve saat dilimi seçimleri
14. ✅ Takım seçimleri

## Test Sonuçları

Test sonuçları `test-results-profile-bot.json` dosyasına kaydedilir.

Format:
```json
{
  "timestamp": "2026-01-21T...",
  "duration": "45.23s",
  "summary": {
    "total": 50,
    "passed": 45,
    "failed": 3,
    "skipped": 2
  },
  "results": {
    "web": [...],
    "mobile": [...],
    "sync": [...],
    "errors": [...]
  }
}
```

## Hızlı Test Modu

Hızlı modda bazı testler atlanır:
- Screenshot'lar alınmaz
- Bazı scroll işlemleri atlanır
- Bekleme süreleri kısaltılır

```bash
FAST_MODE=true npm run test:profile
```

## Sorun Giderme

### Web testi çalışmıyor

1. Web sunucusunun çalıştığından emin olun: `npm run web:dev`
2. Port kontrolü: `http://localhost:3000` erişilebilir olmalı
3. Playwright kurulu mu: `npm install playwright`

### Mobil testi çalışmıyor

1. Detox kurulu mu: `npm install -g detox-cli`
2. iOS Simulator/Android Emulator çalışıyor mu
3. Test dosyası oluşturuldu mu: `e2e/profile-test-bot.test.ts`

### Giriş başarısız

1. Test kullanıcılarının Supabase'de mevcut olduğundan emin olun
2. Şifrelerin doğru olduğundan emin olun
3. Supabase bağlantısını kontrol edin

## Notlar

- Web testleri Playwright ile gerçek tarayıcıda çalışır
- Mobil testleri Detox ile gerçek cihaz/simulator'de çalışır
- Her iki platform da aynı Supabase `user_profiles` tablosunu kullanır
- Senkronizasyon otomatik olarak çalışmalı (aynı veri kaynağı)
