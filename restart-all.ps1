# TacticIQ - Tüm Sistemleri Kapat ve Yeniden Başlat
# Bu script önce tüm servisleri durdurur, sonra yeniden başlatır

Write-Host "========================================" -ForegroundColor Red
Write-Host "  TACTICIQ - TUM SISTEMLERI KAPAT" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# 1. Tüm Node süreçlerini kapat
Write-Host "[1/3] Tum Node surecleri kapatiliyor..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2
Write-Host "   Node surecleri kapatildi!" -ForegroundColor Green

# 2. Backend, Expo, Website ile ilgili PowerShell pencerelerini kapat
Write-Host "[2/3] Backend/Expo/Website PowerShell pencereleri kapatiliyor..." -ForegroundColor Yellow
Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -match "BACKEND|EXPO|WEBSITE|WATCHDOG|TACTICIQ"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   PowerShell pencereleri kapatildi!" -ForegroundColor Green

# 3. Cache temizle
Write-Host "[3/3] Cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\.expo"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\node_modules\.cache"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\website\.vite"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\website\node_modules\.vite"
Write-Host "   Cache temizlendi!" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Tum sistemler kapatildi!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUM SISTEMLERI YENIDEN BASLAT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 3 saniye bekle
Start-Sleep -Seconds 3

# start-all.ps1'yi çalıştır
Write-Host "start-all.ps1 calistiriliyor..." -ForegroundColor Yellow
& "$PSScriptRoot\start-all.ps1"
