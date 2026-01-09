# 🚨 Web Hermes Hatası - Agresif Çözüm

## Sorun
Expo Router web'de Hermes kullanmaya zorluyor. Metro config bypass'ları yeterli değil.

## Çözüm: app/ Dizinini Web İçin Geçici Olarak Devre Dışı Bırak

### Adım 1: app/ Dizinini Yeniden Adlandır
```powershell
# Web için app/ dizinini geçici olarak devre dışı bırak
Rename-Item -Path "app" -NewName "app.disabled" -Force
```

### Adım 2: Web'i Başlat
```bash
npx expo start --web --clear
```

### Adım 3: Web Çalıştıktan Sonra Geri Al
```powershell
# Native için app/ dizinini geri al
Rename-Item -Path "app.disabled" -NewName "app" -Force
```

## Alternatif: Otomatik Script

`scripts/web-start.ps1` dosyası oluştur:
```powershell
# app/ dizinini geçici olarak devre dışı bırak
if (Test-Path "app") {
    Rename-Item -Path "app" -NewName "app.disabled" -Force
    Write-Host "✅ app/ dizini devre dışı bırakıldı" -ForegroundColor Green
}

# Web'i başlat
Write-Host "Web başlatılıyor..." -ForegroundColor Cyan
npx expo start --web --clear

# Process sonlandığında geri al
# (Manuel olarak yapılmalı: Rename-Item -Path "app.disabled" -NewName "app" -Force)
```

## Not
- Bu çözüm web için Expo Router'ı tamamen devre dışı bırakır
- Native (iOS/Android) için app/ dizini gerekli olduğunda geri alınmalı
- Web çalıştıktan sonra app/ dizini geri alınabilir (hot reload çalışır)
