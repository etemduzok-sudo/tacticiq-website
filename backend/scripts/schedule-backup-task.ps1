# ============================================
# Windows Görev Zamanlayıcı - Günlük DB Yedekleme
# ============================================
# Her gün 04:00'te backup-db.js çalıştırır.
# Çalıştırmak: PowerShell'de bu script'i yönetici olmadan çalıştırın.
#   cd c:\TacticIQ\backend\scripts
#   .\schedule-backup-task.ps1
# ============================================

$taskName = "TacticIQ_Daily_DB_Backup"
$workingDir = "c:\TacticIQ\backend"
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Host "Hata: 'node' bulunamadi. Node.js yuklu olmali." -ForegroundColor Red
    exit 1
}
$scriptArg = "scripts\backup-db.js"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Günlük DB Yedekleme Zamanlamasi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Calisma dizini: $workingDir" -ForegroundColor Gray
Write-Host "Komut: node $scriptArg" -ForegroundColor Gray
Write-Host "Zamanlama: Her gun 04:00" -ForegroundColor Yellow
Write-Host "Yedek klasoru: $workingDir\backups\backup-YYYY-MM-DDTHH-MM-SS" -ForegroundColor Gray
Write-Host ""

# Eski gorev varsa sil
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Eski gorev kaldirildi." -ForegroundColor Gray
}

# Yeni gorev: her gun 04:00
$action = New-ScheduledTaskAction -Execute $nodePath -Argument $scriptArg -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -Daily -At "04:00"
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
    -Description "TacticIQ DB yedekleme - backup-db.js her gun 04:00'te calisir" | Out-Null

Write-Host "Gorev olusturuldu: $taskName" -ForegroundColor Green
Write-Host ""
Get-ScheduledTask -TaskName $taskName | Format-List TaskName, State, @{N='NextRun';E={$_.NextRunTime}}
Write-Host ""
Write-Host "Gorev Zamanlayici'da gormek icin: taskschd.msc" -ForegroundColor Gray
Write-Host "Gorevu kaldirmak icin: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host "Manuel yedek icin: cd $workingDir ; node scripts\backup-db.js" -ForegroundColor Gray
Write-Host ""
