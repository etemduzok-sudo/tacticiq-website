# Script Monitor - Durursa otomatik yeniden başlatır
# Kullanım: powershell -ExecutionPolicy Bypass -File monitor-script.ps1

$scriptPath = "c:\TacticIQ\backend\scripts\complete-all-data-auto-restart.js"
$maxRestarts = 100
$checkInterval = 300 # 5 dakika

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Script Monitor Başlatıldı" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Script: $scriptPath" -ForegroundColor Gray
Write-Host "Kontrol aralığı: $checkInterval saniye" -ForegroundColor Gray
Write-Host ""

$restartCount = 0

while ($restartCount -lt $maxRestarts) {
    # Script çalışıyor mu kontrol et
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*complete-all-data-auto-restart.js*"
    }
    
    if ($processes.Count -eq 0) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Script durmuş! Yeniden başlatılıyor..." -ForegroundColor Yellow
        
        Start-Process node -ArgumentList $scriptPath -WindowStyle Hidden
        
        $restartCount++
        Write-Host "  Yeniden başlatma sayısı: $restartCount" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    } else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Script çalışıyor ✓ (PID: $($processes[0].Id))" -ForegroundColor Green
    }
    
    Start-Sleep -Seconds $checkInterval
}

Write-Host "Maksimum yeniden başlatma sayısına ulaşıldı!" -ForegroundColor Red
