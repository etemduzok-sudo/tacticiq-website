# 🚀 Web Hatası Hızlı Çözüm

## Sorun
- 500 Internal Server Error
- MIME type hatası (application/json)
- Bundle yüklenemiyor

## Çözüm

### 1. Metro Cache Temizle ve Yeniden Başlat

```bash
# Mevcut process'i durdur (Ctrl+C)
# Sonra:
npx expo start --web --clear
```

veya

```bash
npm start -- --web --clear
```

### 2. Eğer Hala Çalışmazsa

```bash
# Node modules cache temizle
rm -rf node_modules/.cache
rm -rf .expo

# Yeniden başlat
npx expo start --web --clear
```

### 3. Port Kontrolü

Eğer port 8081 kullanımdaysa:

```bash
# Farklı port kullan
npx expo start --web --port 8082
```

## Yapılan Değişiklikler

✅ Metro config güncellendi:
- Asset extensions eklendi
- Source extensions eklendi  
- Transformer ayarları eklendi

✅ Logo path düzeltildi:
- SplashScreen'de logo aktif
- Path: `src/assets/images/brand/fan_manager_shield.png`

## Logo Dosyası

Logo dosyanızı şuraya koyun:
```
src/assets/images/brand/fan_manager_shield.png
```

**Format:** PNG (transparent background)
**Boyut:** 200x200px veya 400x400px
