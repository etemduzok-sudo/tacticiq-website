# TacticIQ - Mobil Web Başlatma Script
# Backend (API) + Expo Web başlatır, Edge'de mobil görünümde açar.
# localhost bağlanmayı reddetti hatası = Backend kapalı; bu script ikisini de açar.

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TacticIQ - Mobil Web Baslatiliyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Mevcut Expo / Node süreçlerini kapat (backend dahil)
Write-Host "[1/4] Mevcut Node/Expo sureclerini kapatiliyor..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Cache temizle
Write-Host "[2/4] Cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue ".expo"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "node_modules\.cache"
Write-Host "   Cache temizlendi!" -ForegroundColor Green

# 3. Backend (API) başlat – localhost:3001
Write-Host "[3/4] Backend (API) baslatiliyor – http://localhost:3001 ..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PORT='3001'; cd '$backendDir'; Write-Host 'BACKEND API (port 3001)' -ForegroundColor Green; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 5
Write-Host "   Backend basladi!" -ForegroundColor Green

# 4. Expo Web'i başlat
Write-Host "[4/4] Expo Web baslatiliyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'EXPO WEB (Mobil)' -ForegroundColor Magenta; npx expo start --web --clear" -WindowStyle Normal
Start-Sleep -Seconds 8

# 5. Edge'i mobil görünümde aç
Write-Host "Edge tarayicisi mobil gorunumde aciliyor..." -ForegroundColor Yellow
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edgePath)) {
    $edgePath = "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe"
}

if (Test-Path $edgePath) {
    # Edge'i mobil görünümde aç (F12 Developer Tools ile)
    Start-Process $edgePath -ArgumentList "--new-window", "http://localhost:8081", "--auto-open-devtools-for-tabs"
    Write-Host "   Edge acildi! F12'ye basip mobil gorunum modunu aktif edin." -ForegroundColor Green
} else {
    Write-Host "   Edge bulunamadi. Lutfen manuel olarak http://localhost:8081 adresini acin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hazir!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Gray
Write-Host "Expo Web:    http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mobil gorunum icin:" -ForegroundColor White
Write-Host "  1. Edge'de F12'ye basin" -ForegroundColor Gray
Write-Host "  2. Device Toolbar ikonuna tiklayin (Ctrl+Shift+M)" -ForegroundColor Gray
Write-Host "  3. Pixel 6 veya baska bir mobil cihaz secin" -ForegroundColor Gray
Write-Host ""
