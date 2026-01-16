# TacticIQ - Otomatik Servis Başlatıcı ve Hata Kontrolü
# Bu script tüm servisleri başlatır ve hataları otomatik kontrol eder

$ErrorActionPreference = "Continue"
$BackendPort = 3000
$ExpoPort = 8081
$CheckInterval = 10 # Saniye

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TACTICIQ - OTOMATIK SERVIS BASLATICISI" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# Backend başlatma fonksiyonu
function Start-Backend {
    Write-Host "[BACKEND] Başlatılıyor..." -ForegroundColor Yellow
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        node server.js 2>&1
    }
    Start-Sleep -Seconds 3
    
    # Backend kontrolü
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "[BACKEND] ✅ Çalışıyor (Port: $BackendPort)" -ForegroundColor Green
        return $backendJob
    } catch {
        Write-Host "[BACKEND] ⚠️  Başlatılıyor, kontrol ediliyor..." -ForegroundColor Yellow
        return $backendJob
    }
}

# Expo başlatma fonksiyonu
function Start-Expo {
    Write-Host "[EXPO] Başlatılıyor..." -ForegroundColor Yellow
    $expoJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $env:EXPO_PUBLIC_PLATFORM = "web"
        npx expo start --web --clear 2>&1
    }
    Start-Sleep -Seconds 5
    
    # Expo kontrolü
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$ExpoPort" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[EXPO] ✅ Çalışıyor (Port: $ExpoPort)" -ForegroundColor Green
        return $expoJob
    } catch {
        Write-Host "[EXPO] ⚠️  Başlatılıyor, kontrol ediliyor..." -ForegroundColor Yellow
        return $expoJob
    }
}

# Hata kontrolü fonksiyonu
function Check-Errors {
    param($Job, $ServiceName)
    
    $output = Receive-Job -Job $Job -ErrorAction SilentlyContinue
    if ($output) {
        $errorLines = $output | Where-Object { 
            $_ -match "error|Error|ERROR|failed|Failed|FAILED|500|syntax|Syntax|SyntaxError" 
        }
        
        if ($errorLines) {
            Write-Host "`n[$ServiceName] ❌ HATA TESPIT EDILDI:" -ForegroundColor Red
            $errorLines | Select-Object -First 5 | ForEach-Object {
                Write-Host "  $_" -ForegroundColor Red
            }
            return $true
        }
    }
    return $false
}

# Servis durumu kontrolü
function Check-ServiceHealth {
    param($Port, $ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 2 -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Ana başlatma
Write-Host "1️⃣  Backend servisi başlatılıyor..." -ForegroundColor Cyan
$backendJob = Start-Backend

Write-Host "`n2️⃣  Expo servisi başlatılıyor..." -ForegroundColor Cyan
$expoJob = Start-Expo

Write-Host "`n✅ Servisler başlatıldı!" -ForegroundColor Green
Write-Host "`n📊 Durum:" -ForegroundColor Cyan
Write-Host "  • Backend: http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  • Expo: http://localhost:$ExpoPort" -ForegroundColor White
Write-Host "`n🔄 Otomatik hata kontrolü aktif (Her $CheckInterval saniyede bir)" -ForegroundColor Yellow
Write-Host "   Çıkmak için Ctrl+C basın`n" -ForegroundColor Gray

# Sürekli hata kontrolü döngüsü
$iteration = 0
while ($true) {
    Start-Sleep -Seconds $CheckInterval
    $iteration++
    
    # Her 6. iterasyonda (1 dakika) durum kontrolü
    if ($iteration % 6 -eq 0) {
        $backendOk = Check-ServiceHealth -Port $BackendPort -ServiceName "BACKEND"
        $expoOk = Check-ServiceHealth -Port $ExpoPort -ServiceName "EXPO"
        
        if (-not $backendOk) {
            Write-Host "[BACKEND] ⚠️  Servis durmuş, yeniden başlatılıyor..." -ForegroundColor Yellow
            Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
            Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
            $backendJob = Start-Backend
        }
        
        if (-not $expoOk) {
            Write-Host "[EXPO] ⚠️  Servis durmuş, yeniden başlatılıyor..." -ForegroundColor Yellow
            Stop-Job -Job $expoJob -ErrorAction SilentlyContinue
            Remove-Job -Job $expoJob -ErrorAction SilentlyContinue
            $expoJob = Start-Expo
        }
    }
    
    # Hata kontrolü
    $backendError = Check-Errors -Job $backendJob -ServiceName "BACKEND"
    $expoError = Check-Errors -Job $expoJob -ServiceName "EXPO"
    
    if ($backendError -or $expoError) {
        Write-Host "`n⚠️  Hata tespit edildi, loglar kontrol ediliyor..." -ForegroundColor Yellow
    }
}
