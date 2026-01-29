# TacticIQ - Backend Watchdog Script
# Backend'i sürekli izler ve durduğunda otomatik olarak yeniden başlatır

$ErrorActionPreference = "Continue"
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPort = 3001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TacticIQ - Backend Watchdog" -ForegroundColor Cyan
Write-Host "  Backend otomatik yeniden başlatma" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-BackendRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        # Port kontrolü de yap
        $portCheck = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
        return $null -ne $portCheck
    }
}

function Start-Backend {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backend başlatılıyor..." -ForegroundColor Yellow
    
    # Eski process'leri kapat
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        $_.Path -like "*backend*" 
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 1
    
    # Backend'i PORT=3001 ile başlat (frontend ile uyumlu)
    $env:PORT = "3001"
    $process = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendPath -PassThru -WindowStyle Hidden
    
    Start-Sleep -Seconds 3
    
    # Backend'in başladığını kontrol et
    $maxRetries = 10
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        if (Test-BackendRunning) {
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✅ Backend başarıyla başlatıldı!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $retryCount++
    }
    
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ⚠️ Backend başlatılamadı, tekrar denenecek..." -ForegroundColor Red
    return $false
}

# Ana döngü
Write-Host "Watchdog başlatıldı. Backend izleniyor..." -ForegroundColor Green
Write-Host "Çıkmak için Ctrl+C basın" -ForegroundColor Gray
Write-Host ""

Start-Backend

while ($true) {
    Start-Sleep -Seconds 5
    
    if (-not (Test-BackendRunning)) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ❌ Backend durdu! Yeniden başlatılıyor..." -ForegroundColor Red
        Start-Backend
    }
}
