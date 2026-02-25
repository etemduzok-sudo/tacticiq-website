# TacticIQ - Tüm Sistemleri Başlat
# Kullanım: .\scripts\start-all-systems.ps1
# veya: powershell -ExecutionPolicy Bypass -File scripts\start-all-systems.ps1

$backendDir = Split-Path -Parent $PSScriptRoot  # backend/
Set-Location $backendDir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TacticIQ - TUM SISTEMLERI BASLAT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 5 dakikalık DB rapor script'i
Write-Host "[1/3] 5 dk rapor script'i baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "scripts/db-status-report-every-5min.js" -WindowStyle Hidden -WorkingDirectory $backendDir
Write-Host "      OK - db-status-report-every-5min.js" -ForegroundColor Green

# 2. DB sync (run-phased-db-complete)
Write-Host "[2/3] DB sync script'i baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "scripts/run-phased-db-complete.js" -WindowStyle Hidden -WorkingDirectory $backendDir
Write-Host "      OK - run-phased-db-complete.js" -ForegroundColor Green

# 3. Backend API server
Write-Host "[3/3] Backend API server baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden -WorkingDirectory $backendDir
Write-Host "      OK - server.js (port 3001)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUM SISTEMLER BASLATILDI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  - 5 dk rapor: backend/data/db-status-report.txt" -ForegroundColor Gray
Write-Host "  - DB sync log: db-sync-progress.log (proje kokunde)" -ForegroundColor Gray
Write-Host "  - API: http://localhost:3001" -ForegroundColor Gray
Write-Host ""
