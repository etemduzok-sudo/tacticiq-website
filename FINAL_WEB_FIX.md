# 🚨 Web Hermes Hatası - Final Çözüm

## Sorun
Expo Router web'de Hermes kullanmaya zorluyor. Metro config override'ları yeterli değil.

## Çözüm: Metro Serializer Override

### Yapılanlar
1. ✅ `app/` dizini → `app.disabled` (Expo Router devre dışı)
2. ✅ Metro serializer override eklendi
3. ✅ Web için zorla `index.web.js` kullanılıyor
4. ✅ `package.json` web entry point: `index.web.js`
5. ✅ `app.json` web entryPoint: `index.web.js`

### Metro Config Override
```javascript
config.serializer = {
  ...config.serializer,
  getEntryPoint: function(...args) {
    const isWeb = process.env.EXPO_PLATFORM === 'web' || 
                  process.argv.includes('--web') ||
                  args[0]?.platform === 'web';
    
    if (isWeb) {
      return 'index.web.js'; // Expo Router bypass
    }
    // Native için orijinal davranış
    return config.serializer.getEntryPoint.apply(this, args);
  },
};
```

### Kullanım
```bash
# Web'i başlat
npx expo start --web --clear
```

### Kontrol
Browser console'da şunu görmelisiniz:
- ✅ `transform.routerRoot=app` parametresi YOK
- ✅ `transform.engine=hermes` parametresi YOK
- ✅ Bundle JavaScript olarak dönecek

### Eğer Hala Hata Varsa
1. Browser cache temizle (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Terminal'de Metro loglarını kontrol et
4. `app.disabled` dizininin mevcut olduğundan emin ol

### Native İçin app/ Dizini Geri Al
```powershell
.\scripts\restore-app.ps1
```
