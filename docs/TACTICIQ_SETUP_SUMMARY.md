# TacticIQ Setup Summary

## ✅ Tamamlanan İşlemler

### 1. Global Rebranding ✅
- Tüm "Fan Manager 2026", "FanQuest", "PitchSide" metinleri "TacticIQ" olarak güncellendi
- `app.json`: name, slug, scheme → "TacticIQ"
- `package.json`: name → "tacticiq"
- Backend servisleri: Email templates, monitoring, server logs
- Bundle ID: `com.tacticiq.app` (Android ve iOS)

### 2. Native Klasörleri Oluşturuldu ✅
- **Android**: ✅ Oluşturuldu (`npx expo prebuild`)
- **iOS**: ⚠️ Windows'ta oluşturulamaz (macOS gerekiyor)
- Bundle ID: `com.tacticiq.app` ✅

### 3. SHA-1 Fingerprint ⚠️
- **Durum**: Java JDK gerekiyor
- **Talimatlar**: `docs/SHA1_FINGERPRINT_GUIDE.md` dosyasında detaylı adımlar var
- **Komut**: `cd android && .\gradlew.bat signingReport`
- **Alternatif**: `keytool -list -v -keystore android\app\debug.keystore -alias AndroidDebugKey`

### 4. Firebase iOS Setup ⚠️
- **Durum**: macOS ve iOS klasörü gerekiyor
- **Talimatlar**: `docs/IOS_FIREBASE_SETUP.md` dosyasında detaylı adımlar var
- **AppDelegate.mm**: iOS klasörü oluşturulduktan sonra Firebase import ve configure eklenecek

---

## 📋 Sonraki Adımlar (Manuel)

### SHA-1 Fingerprint İçin:
1. Java JDK yükleyin
2. JAVA_HOME ortam değişkenini ayarlayın
3. `cd android && .\gradlew.bat signingReport` çalıştırın
4. SHA-1 değerini Firebase Console'a ekleyin

### iOS Firebase Setup İçin:
1. macOS'ta `npx expo prebuild --platform ios` çalıştırın
2. `ios/tacticiq/AppDelegate.mm` dosyasını bulun
3. `#import <Firebase.h>` ekleyin
4. `[FIRApp configure];` ekleyin
5. GoogleService-Info.plist dosyasını ekleyin
6. URL Schemes yapılandırmasını yapın

---

## 📁 Oluşturulan Dosyalar

- `android/` - Android native projesi ✅
- `docs/SHA1_FINGERPRINT_GUIDE.md` - SHA-1 üretme rehberi
- `docs/IOS_FIREBASE_SETUP.md` - iOS Firebase setup rehberi
- `docs/FIREBASE_IOS_SETUP.md` - Firebase iOS başlatma rehberi

---

## 🔧 Yapılandırma Detayları

### Android
- **Package**: `com.tacticiq.app` ✅
- **Application ID**: `com.tacticiq.app` ✅
- **Keystore**: `android/app/debug.keystore` ✅

### iOS
- **Bundle Identifier**: `com.tacticiq.app` ✅
- **Google Services File**: `./GoogleService-Info.plist` ✅

### Environment Variables (.env)
- `GOOGLE_WEB_CLIENT_ID`: `278649047434-mok8e02lano8kk62j2sn09ooqn6lql7k.apps.googleusercontent.com` ✅
- `GOOGLE_IOS_CLIENT_ID`: `278649047434-65pqo1nk9s5bm7a7sj4s896n6s0kgrnc.apps.googleusercontent.com` ✅

---

## ⚠️ Önemli Notlar

1. **Klasör İsmi**: Klasör ismini `C:\TacticIQ` olarak değiştirmek için PowerShell'de:
   ```powershell
   cd C:\
   Rename-Item -Path "fan_manager_2026" -NewName "TacticIQ"
   ```
   **Not**: Bu işlem Cursor'ın workspace path'ini değiştirebilir. İşlemden sonra Cursor'ı yeniden başlatmanız gerekebilir.

2. **Java JDK**: SHA-1 fingerprint için Java JDK gereklidir. Yüklü değilse [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) veya [OpenJDK](https://openjdk.org/) indirin.

3. **iOS Build**: iOS build için macOS ve Xcode gereklidir. Windows'ta iOS build yapılamaz.

---

**Son Güncelleme**: 13 Ocak 2026
