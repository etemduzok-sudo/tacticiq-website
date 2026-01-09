# app/ dizinini geri al (Native için gerekli)
# Kullanım: .\scripts\restore-app.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "app/ DIZINI GERI ALINIYOR" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if (Test-Path "app.disabled") {
    Write-Host "app.disabled -> app olarak geri aliniyor..." -ForegroundColor Yellow
    Rename-Item -Path "app.disabled" -NewName "app" -Force
    Write-Host "✅ app/ dizini geri alindi" -ForegroundColor Green
    Write-Host "`nNative (iOS/Android) icin app/ dizini aktif`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ app.disabled dizini bulunamadi" -ForegroundColor Yellow
    Write-Host "app/ dizini zaten aktif olabilir`n" -ForegroundColor Gray
}
