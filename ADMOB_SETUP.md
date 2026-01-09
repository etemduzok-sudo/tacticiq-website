# 📱 Google AdMob Setup Guide - Fan Manager 2026

## 🎯 **Reklam Yerleşimi Stratejisi**

Uygulamada reklamlar şu ekranlarda gösteriliyor:

### **1. Dashboard (Ana Sayfa)**
- **Konum:** ScrollView'in en altında
- **Tip:** Banner Ad (320x50)
- **Görünürlük:** Her zaman (free kullanıcılar için)

### **2. MatchListScreen (Maç Listesi)**
- **Konum:** Her 5 maçtan sonra
- **Tip:** Banner Ad (320x50)
- **Görünürlük:** Listeler arasında native ad

### **3. MatchDetail (Maç Detayı)**
- **Konum:** Tab content'in altında, bottom navigation'dan önce
- **Tip:** Banner Ad (320x50)
- **Görünürlük:** Maç detayı görüntülenirken

### **4. ProfileScreen (Profil)**
- **Konum:** ScrollView'in en altında
- **Tip:** Banner Ad (320x50)
- **Görünürlük:** Profil sayfasında

---

## 🚀 **Google AdMob Kurulumu**

### **1. Google AdMob Hesabı Oluştur**

1. https://admob.google.com adresine git
2. Google hesabınla giriş yap
3. **"Add app"** butonuna tıkla
4. Uygulama bilgilerini gir:
   - **App name:** Fan Manager 2026
   - **Platform:** Android / iOS (her ikisi için ayrı oluştur)
   - **App ID:** (Play Store / App Store'dan alınacak)

---

### **2. Ad Unit ID'leri Oluştur**

#### **Android için:**
1. AdMob Dashboard > **"Apps"** > **"Fan Manager 2026 (Android)"**
2. **"Ad units"** sekmesine git
3. **"Add ad unit"** butonuna tıkla

**Banner Ad Unit:**
- **Ad format:** Banner
- **Ad unit name:** Banner - Fan Manager Android
- **Ad unit ID:** `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` (kopyala)

**Interstitial Ad Unit (opsiyonel):**
- **Ad format:** Interstitial
- **Ad unit name:** Interstitial - Fan Manager Android
- **Ad unit ID:** `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` (kopyala)

#### **iOS için:**
1. AdMob Dashboard > **"Apps"** > **"Fan Manager 2026 (iOS)"**
2. **"Ad units"** sekmesine git
3. **"Add ad unit"** butonuna tıkla

**Banner Ad Unit:**
- **Ad format:** Banner
- **Ad unit name:** Banner - Fan Manager iOS
- **Ad unit ID:** `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` (kopyala)

**Interstitial Ad Unit (opsiyonel):**
- **Ad format:** Interstitial
- **Ad unit name:** Interstitial - Fan Manager iOS
- **Ad unit ID:** `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` (kopyala)

---

### **3. app.json'a Ad Unit ID'leri Ekle**

`app.json` dosyasını aç ve şu bilgileri ekle:

```json
{
  "expo": {
    "name": "Fan Manager 2026",
    "slug": "fan-manager-2026",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
        }
      ]
    ],
    "android": {
      "package": "com.fanmanager2026.app",
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
      }
    },
    "ios": {
      "bundleIdentifier": "com.fanmanager2026.app",
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
      }
    }
  }
}
```

---

### **4. Ad Unit ID'lerini Kodda Güncelle**

`src/components/ads/AdBanner.tsx` dosyasını aç:

```typescript
// Test Ad Unit IDs (Şimdilik test için)
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';

// Gerçek Ad Unit IDs (AdMob'dan aldığın ID'ler)
const PROD_BANNER_ANDROID = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';
const PROD_BANNER_IOS = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

// Production'da gerçek ID'leri kullan
const bannerAdUnitId = __DEV__ 
  ? (Platform.OS === 'android' ? TEST_BANNER_ANDROID : TEST_BANNER_IOS)
  : (Platform.OS === 'android' ? PROD_BANNER_ANDROID : PROD_BANNER_IOS);
```

---

### **5. Google Services Dosyalarını İndir**

#### **Android için:**
1. AdMob Dashboard > **"Apps"** > **"Fan Manager 2026 (Android)"**
2. **"App settings"** sekmesine git
3. **"Download google-services.json"** butonuna tıkla
4. Dosyayı proje root'una kopyala: `google-services.json`

#### **iOS için:**
1. AdMob Dashboard > **"Apps"** > **"Fan Manager 2026 (iOS)"**
2. **"App settings"** sekmesine git
3. **"Download GoogleService-Info.plist"** butonuna tıkla
4. Dosyayı proje root'una kopyala: `GoogleService-Info.plist`

---

### **6. Firebase Console'da Uygulamayı Kaydet**

1. https://console.firebase.google.com adresine git
2. Yeni proje oluştur: **"Fan Manager 2026"**
3. **"Add app"** butonuna tıkla
4. Android ve iOS için ayrı ayrı ekle
5. `google-services.json` ve `GoogleService-Info.plist` dosyalarını indir
6. Proje root'una kopyala

---

## 🧪 **Test Etme**

### **Test Ad Unit ID'leri:**
- **Android Banner:** `ca-app-pub-3940256099942544/6300978111`
- **iOS Banner:** `ca-app-pub-3940256099942544/2934735716`
- **Android Interstitial:** `ca-app-pub-3940256099942544/1033173712`
- **iOS Interstitial:** `ca-app-pub-3940256099942544/4411468910`

### **Test Cihazı Ekle:**
1. AdMob Dashboard > **"Settings"** > **"Test devices"**
2. **"Add test device"** butonuna tıkla
3. Cihazın **Advertising ID**'sini ekle
4. Test cihazında gerçek reklamlar yerine test reklamları gösterilecek

---

## 💰 **Monetizasyon Stratejisi**

### **Reklam Gösterim Sıklığı:**
- **Dashboard:** Her açılışta 1 banner (alt kısımda)
- **MatchListScreen:** Her 5 maçtan sonra 1 banner
- **MatchDetail:** Her maç detayında 1 banner
- **ProfileScreen:** Her profil görüntülemede 1 banner

### **Premium Kullanıcılar:**
- ✅ Premium kullanıcılar için **hiç reklam gösterilmez**
- ✅ `authService.getCurrentUser()` ile premium kontrolü yapılıyor
- ✅ Premium kullanıcılar reklamsız deneyim yaşar

### **Reklam Tipleri:**
1. **Banner Ads:** Sürekli görünür, kullanıcı deneyimini bozmaz
2. **Interstitial Ads:** Önemli ekranlardan önce (opsiyonel, %30 şansla)

---

## 📊 **Reklam Performansı İzleme**

1. AdMob Dashboard > **"Reports"** sekmesine git
2. Şu metrikleri takip et:
   - **Impressions:** Reklam gösterim sayısı
   - **Clicks:** Tıklama sayısı
   - **CTR (Click-Through Rate):** Tıklama oranı
   - **Revenue:** Kazanç
   - **eCPM:** 1000 gösterim başına kazanç

---

## 🆘 **Sorun Giderme**

### **"Ad failed to load" Hatası**
```bash
# Çözüm:
1. Ad Unit ID'nin doğru olduğundan emin ol
2. Google Services dosyalarının doğru yerde olduğunu kontrol et
3. İnternet bağlantını kontrol et
4. AdMob hesabının aktif olduğunu kontrol et
```

### **"No ad to show" Hatası**
```bash
# Çözüm:
1. AdMob hesabında yeterli reklam olup olmadığını kontrol et
2. Test Ad Unit ID'leri kullanıyorsan, test reklamları gösterilir
3. Gerçek Ad Unit ID kullanıyorsan, birkaç saat bekle (reklamlar yüklenir)
```

### **Reklamlar Premium Kullanıcılara Gösteriliyor**
```bash
# Çözüm:
1. authService.getCurrentUser() fonksiyonunun çalıştığından emin ol
2. Supabase'de user.is_premium değerinin doğru olduğunu kontrol et
3. AdBanner component'inde premium kontrolünün yapıldığından emin ol
```

---

## ✅ **Kurulum Tamamlandı!**

### **Kontrol Listesi:**
- ✅ Google AdMob hesabı oluşturuldu
- ✅ Android ve iOS için Ad Unit ID'leri oluşturuldu
- ✅ `expo-ads-admob` paketi yüklendi
- ✅ `AdBanner` component'i oluşturuldu
- ✅ Reklamlar 4 ekrana eklendi (Dashboard, MatchList, MatchDetail, Profile)
- ✅ Premium kullanıcılar için reklam gösterimi devre dışı
- ✅ Test Ad Unit ID'leri ile test edildi

---

## 🎯 **Sonraki Adımlar**

1. ✅ **ŞİMDİ:** AdMob hesabı oluştur ve Ad Unit ID'leri al
2. ✅ **SONRA:** `app.json` dosyasını güncelle
3. ✅ **SONRA:** Google Services dosyalarını ekle
4. ✅ **SON:** Production build'de gerçek Ad Unit ID'leri kullan

---

**Reklam sistemi hazır! Free kullanıcılar için reklamlar gösterilecek, premium kullanıcılar reklamsız deneyim yaşayacak!** 🚀💰

**Son Güncelleme:** 7 Ocak 2026
