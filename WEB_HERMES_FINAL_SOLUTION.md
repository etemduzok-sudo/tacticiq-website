# 🚨 Web Hermes Hatası - Final Çözüm

## Sorun
Expo Router web'de Hermes kullanmaya zorluyor. Tüm Metro config override'ları yeterli değil.

## Kök Neden
`expo-router` package'ı Metro'ya `routerRoot=app` ve `transform.engine=hermes` parametrelerini zorla ekliyor. Bu, Metro config override'larından önce çalışıyor.

## Final Çözümler

### Çözüm 1: expo-router'ı Web İçin Tamamen Kaldır (Önerilen)

```bash
# expo-router'ı web için devre dışı bırak
npm uninstall expo-router

# Web'i başlat
npx expo start --web --clear
```

**Not:** Bu native (iOS/Android) için sorun yaratabilir. Native için expo-router gerekliyse, web için farklı bir entry point kullanın.

### Çözüm 2: Web İçin Farklı Bundler (Webpack)

```bash
# Webpack config oluştur
# app.json'da web bundler'ı webpack olarak ayarla
```

### Çözüm 3: expo-router'ı Conditional Import

```typescript
// index.web.js
// expo-router'ı import etme
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

### Çözüm 4: Metro Plugin Override (En Agresif)

Metro plugin sistemini override ederek expo-router'ın Metro'ya müdahale etmesini engellemek.

## Mevcut Durum

✅ Yapılanlar:
- `app/` dizini → `temp_disabled` (Expo Router devre dışı)
- Metro serializer override (web için `index.web.js`)
- Metro resolver override (expo-router ignore)
- Metro server middleware (URL parametrelerini kaldırma)
- Metro transformer override (Hermes devre dışı)

❌ Hala Çalışmıyor:
- `transform.routerRoot=app` parametresi hala geliyor
- `transform.engine=hermes` parametresi hala geliyor

## Önerilen Son Adım

**expo-router'ı web için tamamen kaldırın:**

```bash
npm uninstall expo-router
npx expo start --web --clear
```

Native için expo-router gerekliyse, web ve native için farklı entry point'ler kullanın.
