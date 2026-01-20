# TacticIQ - All Systems Stop Script
# Bu script tüm sistemleri durdurur

Write-Host "========================================" -ForegroundColor Red
Write-Host "  TacticIQ - Stopping All Systems" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Tüm Node süreçlerini kapat
Write-Host "Tum Node surecleri kapatiliyor..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Write-Host "   Tum surecler kapatildi!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Tum sistemler durduruldu!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
