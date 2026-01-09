# 💳 In-App Purchase (IAP) Setup Guide
## Google Play & Apple App Store - Fan Manager 2026

---

## 📱 **Google Play Console Setup**

### 1. **Google Play Console'a Giriş Yap**
1. https://play.google.com/console adresine git
2. Developer hesabınla giriş yap
3. "Fan Manager 2026" uygulamanı seç

---

### 2. **Uygulama İçi Ürünleri Oluştur**

1. Sol menüden **"Monetization" > "Products" > "Subscriptions"** sekmesine git
2. **"Create subscription"** butonuna tıkla

#### **Ürün 1: Aylık Premium**
- **Product ID:** `fan_manager_premium_monthly`
- **Name:** Fan Manager Premium - Aylık
- **Description:** 1 ay boyunca tüm premium özelliklere erişim
- **Status:** Active
- **Pricing:**
  - Base Plan: Monthly
  - Price: ₺29.99 TRY
  - Billing period: 1 month
  - Free trial: 7 days (opsiyonel)
- **"Save"** butonuna tıkla

#### **Ürün 2: 3 Aylık Premium**
- **Product ID:** `fan_manager_premium_quarterly`
- **Name:** Fan Manager Premium - 3 Aylık
- **Description:** 3 ay boyunca tüm premium özelliklere erişim
- **Status:** Active
- **Pricing:**
  - Base Plan: Quarterly
  - Price: ₺69.99 TRY (20% indirim)
  - Billing period: 3 months
- **"Save"** butonuna tıkla

#### **Ürün 3: Yıllık Premium**
- **Product ID:** `fan_manager_premium_yearly`
- **Name:** Fan Manager Premium - Yıllık
- **Description:** 1 yıl boyunca tüm premium özelliklere erişim
- **Status:** Active
- **Pricing:**
  - Base Plan: Yearly
  - Price: ₺179.99 TRY (50% indirim)
  - Billing period: 12 months
- **"Save"** butonuna tıkla

---

### 3. **Test Lisansı Oluştur**

1. **"Settings" > "License Testing"** sekmesine git
2. **"License Test Accounts"** kısmına test email'lerini ekle:
   ```
   test@example.com
   developer@example.com
   ```
3. Test hesapları ile satın alma işlemleri gerçek para ödemeden test edilebilir

---

### 4. **Closed Testing Track Oluştur**

1. **"Testing" > "Closed Testing"** sekmesine git
2. **"Create new release"** butonuna tıkla
3. APK/AAB dosyasını yükle
4. Test kullanıcılarını ekle
5. **"Save"** ve **"Start rollout to Closed Testing"** butonuna tıkla

---

## 🍎 **Apple App Store Connect Setup**

### 1. **App Store Connect'e Giriş Yap**
1. https://appstoreconnect.apple.com adresine git
2. Apple Developer hesabınla giriş yap
3. **"My Apps"** sekmesinden "Fan Manager 2026" uygulamanı seç

---

### 2. **In-App Purchases Oluştur**

1. **"Features"** sekmesinden **"In-App Purchases"** seçeneğine git
2. **"+"** butonuna tıkla → **"Auto-Renewable Subscription"** seç

#### **Subscription Group Oluştur**
- **Reference Name:** Fan Manager Premium
- **App Store Localization:**
  - Display Name: Premium Üyelik
  - Description: Tüm premium özelliklere sınırsız erişim

#### **Ürün 1: Aylık Premium**
- **Product ID:** `fan_manager_premium_monthly`
- **Reference Name:** Monthly Premium
- **Subscription Duration:** 1 Month
- **Pricing:**
  - Turkey: ₺29.99
  - USA: $2.99
- **Localization (Turkish):**
  - Display Name: Aylık Premium
  - Description: 1 ay boyunca tüm premium özelliklere erişim
- **Review Screenshot:** Uygulama içi satın alma ekranı görüntüsü
- **"Save"** butonuna tıkla

#### **Ürün 2: 3 Aylık Premium**
- **Product ID:** `fan_manager_premium_quarterly`
- **Reference Name:** Quarterly Premium
- **Subscription Duration:** 3 Months
- **Pricing:**
  - Turkey: ₺69.99
  - USA: $6.99
- **Localization (Turkish):**
  - Display Name: 3 Aylık Premium
  - Description: 3 ay boyunca tüm premium özelliklere erişim
- **"Save"** butonuna tıkla

#### **Ürün 3: Yıllık Premium**
- **Product ID:** `fan_manager_premium_yearly`
- **Reference Name:** Yearly Premium
- **Subscription Duration:** 1 Year
- **Pricing:**
  - Turkey: ₺179.99
  - USA: $17.99
- **Localization (Turkish):**
  - Display Name: Yıllık Premium
  - Description: 1 yıl boyunca tüm premium özelliklere erişim
- **"Save"** butonuna tıkla

---

### 3. **Sandbox Test Hesabı Oluştur**

1. **"Users and Access" > "Sandbox Testers"** sekmesine git
2. **"+"** butonuna tıkla
3. Test hesabı bilgilerini gir:
   - First Name: Test
   - Last Name: User
   - Email: `testuser+sandbox@example.com` (gerçek olmayan email)
   - Password: Güçlü bir şifre
   - Country: Turkey
4. **"Invite"** butonuna tıkla

**ÖNEMLİ:** Test cihazında:
- Settings > App Store > Sandbox Account > testuser+sandbox@example.com ile giriş yap
- Bu hesap ile satın alma işlemleri gerçek para ödemeden test edilir

---

### 4. **App Review Bilgileri**

1. **"App Information"** sekmesine git
2. **"App Review Information"** kısmını doldur:
   - Demo Account (premium özellikleri test etmek için)
   - Contact Information
   - Notes: "Premium üyelik sistemi eklendi. Test hesabı: demo@fanmanager.com / password123"

---

## 🔧 **Expo/React Native Konfigürasyonu**

### 1. **Android (app.json)**

```json
{
  "expo": {
    "android": {
      "permissions": [
        "com.android.vending.BILLING"
      ],
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXX~XXXXXXXXX"
      }
    }
  }
}
```

### 2. **iOS (app.json)**

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "SKAdNetworkItems": []
      }
    }
  }
}
```

---

## 🧪 **Test Etme**

### **Android Test:**
1. Internal Testing track'e APK yükle
2. Test hesabını Google Play Console'da ekle
3. Test cihazında Play Store'dan uygulamayı indir
4. Satın alma işlemini test et (gerçek para ödemeden)

### **iOS Test:**
1. TestFlight'a build yükle
2. Sandbox test hesabıyla cihazda giriş yap (Settings > App Store)
3. TestFlight'tan uygulamayı indir
4. Satın alma işlemini test et (gerçek para ödemeden)

---

## ✅ **IAP Kurulumu Tamamlandı!**

### **Kontrol Listesi:**
- ✅ Google Play Console'da 3 subscription oluşturuldu
- ✅ Apple App Store Connect'te 3 subscription oluşturuldu
- ✅ Test hesapları oluşturuldu
- ✅ `react-native-iap` kütüphanesi yüklendi
- ✅ `iapService.ts` dosyası oluşturuldu
- ✅ `ProUpgradeScreen.tsx` güncellendi

---

## 🆘 **Sorun Giderme**

### **"No subscriptions available" Hatası**
- Google Play Console / App Store Connect'te ürünlerin "Active" olduğundan emin ol
- Ürün ID'lerinin kod ile eşleştiğinden emin ol
- Uygulama bundle ID'sinin doğru olduğunu kontrol et

### **"Purchase failed" Hatası**
- Test hesabıyla giriş yaptığından emin ol
- İnternet bağlantını kontrol et
- Google Play / App Store servisleri aktif mi kontrol et

### **"Already owned" Hatası**
- Test hesabındaki eski satın almaları iptal et
- Google Play: Subscriptions > Cancel
- iOS: Settings > Apple ID > Subscriptions > Cancel

---

## 📊 **Fiyatlandırma Stratejisi**

| Plan | Fiyat | Aylık Maliyet | İndirim |
|------|-------|---------------|---------|
| Aylık | ₺29.99 | ₺29.99 | - |
| 3 Aylık | ₺69.99 | ₺23.33 | 20% |
| Yıllık | ₺179.99 | ₺15.00 | 50% ⭐ |

**Önerilen:** Yıllık planı öne çıkar (popular badge + indirim badge)

---

**Son Güncelleme:** 7 Ocak 2026
