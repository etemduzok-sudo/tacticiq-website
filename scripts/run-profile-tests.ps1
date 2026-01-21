# TacticIQ Profil Test Botu - PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TacticIQ Profil Test Botu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Playwright kontrol ediliyor..." -ForegroundColor Blue
$playwrightInstalled = Get-Command playwright -ErrorAction SilentlyContinue

if (-not $playwrightInstalled) {
    Write-Host "Playwright bulunamadı, kuruluyor..." -ForegroundColor Yellow
    npm install --save-dev playwright
    npx playwright install chromium
}

Write-Host ""
Write-Host "[2/3] Web sunucusu kontrol ediliyor..." -ForegroundColor Blue
Write-Host "Web sunucusunun çalıştığından emin olun: cd website && npm run dev" -ForegroundColor Yellow
Write-Host ""
$response = Read-Host "Devam etmek için Enter'a basın"

Write-Host ""
Write-Host "[3/3] Test botu çalıştırılıyor..." -ForegroundColor Blue
node scripts/profile-test-bot.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test tamamlandı!" -ForegroundColor Green
Write-Host "Sonuçlar: test-results-profile-bot.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
