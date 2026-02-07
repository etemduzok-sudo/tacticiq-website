# TacticIQ - Tüm sistemleri başlat (Backend + Frontend ayrı PS pencerelerinde)
# Kullanım: .\scripts\start-all-systems.ps1

# Script c:\TacticIQ\scripts\ içinde; proje kökü bir üst dizin
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$root\package.json")) { $root = "c:\TacticIQ" }

Write-Host "TacticIQ sistemleri baslatiliyor..." -ForegroundColor Cyan
Write-Host "  Backend : $root\backend" -ForegroundColor Gray
Write-Host "  Frontend: $root (web:dev)" -ForegroundColor Gray
Write-Host ""

# 1) Backend - Yeni PowerShell penceresi
Write-Host "[1/2] Backend penceresi aciliyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\backend'; Write-Host '=== TacticIQ BACKEND ===' -ForegroundColor Green; npm run dev"
)

Start-Sleep -Seconds 1

# 2) Frontend (Web) - Yeni PowerShell penceresi
Write-Host "[2/2] Frontend (Web) penceresi aciliyor..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root'; Write-Host '=== TacticIQ FRONTEND (Web) ===' -ForegroundColor Green; npm run web:dev"
)

Write-Host ""
Write-Host "Iki PowerShell penceresi acildi:" -ForegroundColor Green
Write-Host "  - Backend  : npm run dev (nodemon)" -ForegroundColor White
Write-Host "  - Frontend : npm run web:dev (Expo web)" -ForegroundColor White
Write-Host "Tarayicida http://localhost:8081 acilacak." -ForegroundColor Gray
