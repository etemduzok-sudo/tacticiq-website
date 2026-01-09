# Web için Expo Router'ı devre dışı bırak ve web'i başlat
# Kullanım: .\scripts\start-web.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "WEB BASLATILIYOR (Expo Router Devre Disi)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# app/ dizinini geçici olarak devre dışı bırak
if (Test-Path "app") {
    Write-Host "app/ dizini devre disi birakiliyor..." -ForegroundColor Yellow
    Rename-Item -Path "app" -NewName "app.disabled" -Force
    Write-Host "✅ app/ dizini devre disi birakildi (app.disabled)" -ForegroundColor Green
} else {
    Write-Host "⚠️ app/ dizini zaten yok veya devre disi" -ForegroundColor Gray
}

# Cache temizle
Write-Host "`nCache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
Write-Host "✅ Cache temizlendi`n" -ForegroundColor Green

# Web'i başlat
Write-Host "Web baslatiliyor..." -ForegroundColor Cyan
Write-Host "NOT: Web calisirken app/ dizini yok sayilacak`n" -ForegroundColor Yellow

npx expo start --web --clear

# Process sonlandığında geri almak için:
# Rename-Item -Path "app.disabled" -NewName "app" -Force
