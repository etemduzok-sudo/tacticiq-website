# iOS Firebase Setup - TacticIQ

## Önemli Not
iOS klasörü Windows'ta oluşturulamaz. macOS gereklidir. Aşağıdaki adımları macOS'ta takip edin.

## Adımlar

### 1. iOS Klasörünü Oluştur
macOS'ta terminalde:
```bash
npx expo prebuild --platform ios
```

### 2. AppDelegate.mm Dosyasını Bul
iOS klasörü oluştuktan sonra:
- Dosya yolu: `ios/tacticiq/AppDelegate.mm` (veya `ios/[PROJECT_NAME]/AppDelegate.mm`)

### 3. Firebase Import Ekleyin
Dosyanın en üstüne ekleyin:
```objective-c
#import <Firebase.h>
```

### 4. Firebase Configure Ekleyin
`didFinishLaunchingWithOptions` metodunun içine ekleyin:
```objective-c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Firebase initialization
  [FIRApp configure];
  
  // ... existing code ...
  
  return YES;
}
```

### 5. GoogleService-Info.plist
- Firebase Console'dan `GoogleService-Info.plist` dosyasını indirin
- Proje root dizinine ekleyin (app.json'da `googleServicesFile: "./GoogleService-Info.plist"` olarak ayarlanmıştır)

### 6. URL Schemes
GoogleService-Info.plist dosyasındaki `REVERSED_CLIENT_ID` değerini okuyun ve Xcode'da:
1. Target → Info → URL Types
2. Yeni URL Type ekleyin
3. URL Schemes: `REVERSED_CLIENT_ID` değerini girin

---

**Not:** Windows'ta iOS build yapılamaz. macOS ve Xcode gereklidir.
