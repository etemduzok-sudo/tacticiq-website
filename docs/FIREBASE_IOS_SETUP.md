# Firebase iOS Setup Guide - TacticIQ

## Firebase iOS Başlatma

Expo projesi olduğu için Firebase iOS başlatma native kod gerektirir. Aşağıdaki adımları takip edin:

### 1. GoogleService-Info.plist Dosyası

`GoogleService-Info.plist` dosyasını Firebase Console'dan indirin ve proje root dizinine ekleyin.

### 2. AppDelegate.mm Dosyasına Firebase Ekleme

Native iOS projesi oluşturulduktan sonra (`expo prebuild` veya `expo run:ios`), şu dosyayı düzenleyin:

**Dosya:** `ios/tacticiq/AppDelegate.mm` (veya `ios/[PROJECT_NAME]/AppDelegate.mm`)

**En üste ekleyin:**
```objective-c
#import <Firebase.h>
```

**didFinishLaunchingWithOptions metodunun içine ekleyin:**
```objective-c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Firebase initialization
  [FIRApp configure];
  
  // ... existing code ...
  
  return YES;
}
```

### 3. URL Schemes Yapılandırması

GoogleService-Info.plist dosyasındaki `REVERSED_CLIENT_ID` değerini okuyun ve Xcode projesindeki URL Types yapılandırmasına ekleyin:

1. Xcode'da projeyi açın
2. Target → Info → URL Types bölümüne gidin
3. Yeni bir URL Type ekleyin
4. URL Schemes alanına `REVERSED_CLIENT_ID` değerini girin

**Alternatif (app.json ile):**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["com.googleusercontent.apps.278649047434-REVERSED_CLIENT_ID"]
          }
        ]
      }
    }
  }
}
```

### 4. Podfile Güncellemesi

`ios/Podfile` dosyasına Firebase pod'unu ekleyin (genellikle otomatik olarak eklenir):

```ruby
pod 'Firebase/Core'
pod 'Firebase/Auth'
```

Sonra:
```bash
cd ios
pod install
```

### 5. Build ve Test

```bash
expo prebuild
expo run:ios
```

---

**Not:** Expo managed workflow kullanıyorsanız, `expo prebuild` komutu native projeyi oluşturur. Bundan sonra yukarıdaki adımları takip edebilirsiniz.
