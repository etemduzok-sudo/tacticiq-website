# TacticIQ - All Systems Start Script
# Bu script tüm sistemleri temiz bir şekilde başlatır

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TacticIQ - All Systems Startup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tüm Node süreçlerini kapat
Write-Host "[1/5] Mevcut Node sureclerini kapatiliyor..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# 2. Cache temizle
Write-Host "[2/5] Cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\.expo"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\node_modules\.cache"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\website\.vite"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$PSScriptRoot\website\node_modules\.vite"
Write-Host "   Cache temizlendi!" -ForegroundColor Green

# 3. Backend başlat
Write-Host "[3/5] Backend baslatiliyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'BACKEND SERVER' -ForegroundColor Green; node server.js" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "   Backend basladi!" -ForegroundColor Green

# 4. Website başlat
Write-Host "[4/5] Website baslatiliyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\website'; Write-Host 'WEBSITE (Vite)' -ForegroundColor Blue; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2
Write-Host "   Website basladi!" -ForegroundColor Green

# 5. Expo Web başlat (cache temizleyerek)
Write-Host "[5/5] Expo Web baslatiliyor (cache temizleniyor)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'EXPO WEB' -ForegroundColor Magenta; npx expo start --clear --web" -WindowStyle Normal
Write-Host "   Expo Web basladi!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tum sistemler baslatildi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acilan pencereler:" -ForegroundColor White
Write-Host "  - Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host "  - Website: http://localhost:5173" -ForegroundColor Gray
Write-Host "  - Expo Web: http://localhost:8081" -ForegroundColor Gray
Write-Host ""
