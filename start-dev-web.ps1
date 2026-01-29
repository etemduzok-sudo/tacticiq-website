# TacticIQ - Backend + Expo Web (Tek script, guvenilir)
# Backend port 3001, Expo/Metro port 8081. Sadece bu portlari temizler, tum node'u oldurmez.

$ErrorActionPreference = "Stop"
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location.Path }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TacticIQ - Backend + Expo Web" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Sadece 3001 ve 8081 portlarini kullanan prosesleri kapat (tum node'u oldurme)
Write-Host "[1/4] 3001 ve 8081 portlari bosaltiliyor..." -ForegroundColor Yellow
$killed = @{}
foreach ($port in @(3001, 8081)) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conn) {
            foreach ($c in $conn) {
                $pid = $c.OwningProcess
                if ($pid -gt 0 -and -not $killed[$pid]) {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    $killed[$pid] = $true
                    Write-Host "   Port $port -> PID $pid kapatildi." -ForegroundColor Gray
                }
            }
        }
    } catch { }
}
if ($killed.Count -eq 0) { Write-Host "   Portlar zaten bos." -ForegroundColor Gray }
else { Write-Host "   $($killed.Count) process kapatildi." -ForegroundColor Gray }
Start-Sleep -Seconds 2
Write-Host ""

# 2. Cache temizle
Write-Host "[2/4] Cache temizleniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$Root\.expo"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$Root\node_modules\.cache"
Write-Host "   Cache temizlendi." -ForegroundColor Green
Write-Host ""

# 3. Backend baslat (ayri pencere)
Write-Host "[3/4] Backend baslatiliyor (ayri pencere)..." -ForegroundColor Yellow
$backendCmd = "cd '$Root\backend'; `$host.UI.RawUI.WindowTitle='TacticIQ Backend'; Write-Host 'BACKEND - http://localhost:3001' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
Start-Sleep -Seconds 3

# Backend hazir olana kadar bekle (max 60 sn)
$healthUrl = "http://localhost:3001/health"
$maxWait = 60
$waited = 0
Write-Host "   Backend health check bekleniyor..." -ForegroundColor Gray
while ($waited -lt $maxWait) {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "   Backend hazir (${waited}s)." -ForegroundColor Green
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $waited++
    if ($waited % 5 -eq 0) { Write-Host "   Bekleniyor... ${waited}s" -ForegroundColor Gray }
}
if ($waited -ge $maxWait) {
    Write-Host "   UYARI: Backend ${maxWait}s icinde hazir olmadi. Yine de Expo aciliyor." -ForegroundColor Yellow
}
Write-Host ""

# 4. Expo Web (Metro) baslat (ayri pencere)
Write-Host "[4/4] Expo Web (Metro) baslatiliyor (ayri pencere)..." -ForegroundColor Yellow
$expoCmd = "cd '$Root'; `$host.UI.RawUI.WindowTitle='TacticIQ Expo Web'; Write-Host 'EXPO WEB - http://localhost:8081' -ForegroundColor Magenta; npx expo start --web --clear"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $expoCmd -WindowStyle Normal
Start-Sleep -Seconds 5

# 8081 dinlenene kadar kisa bekle (opsiyonel)
$waited2 = 0
while ($waited2 -lt 30) {
    try {
        $c = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
        if ($c) {
            Write-Host "   Expo/Metro hazir (port 8081)." -ForegroundColor Green
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $waited2++
}
if ($waited2 -ge 30) {
    Write-Host "   Expo penceresinde 'Bundled' yazisini gorene kadar bekleyin." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hazir!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "  Expo Web: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iki ayri PowerShell penceresi acildi. Kapatmayin." -ForegroundColor White
Write-Host "Tarayicida http://localhost:8081 acin." -ForegroundColor White
Write-Host ""
