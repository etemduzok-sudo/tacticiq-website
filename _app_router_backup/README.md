# Expo Router yedek (web 500 hatası için devre dışı)

Bu klasör eskiden `app` idi. Web'de Metro'nun `routerRoot=./app` ekleyip 500 hatası vermemesi için kalıcı olarak `_app_router_backup` yapıldı.

- Giriş noktası: **index.js** (native) ve **index.web.js** (web) — ikisi de doğrudan `App` kullanıyor.
- Expo Router tekrar kullanmak isterseniz: bu klasörü tekrar `app` yapın ve `app.json` içine `expo-router` eklentisini ve `extra.router` ayarını ekleyin.
