# ============================================
# Windows Task Scheduler ile DB Güncelleme Planla
# ============================================
# 6 saat sonra başlayacak şekilde zamanla
# Bilgisayar kapalı olsa bile çalışır (açıldığında)
# ============================================

$scriptPath = "c:\TacticIQ\backend\scripts\scheduled-db-update.js"
$nodePath = (Get-Command node).Source
$workingDir = "c:\TacticIQ\backend"

# 6 saat sonrasını hesapla
$startTime = (Get-Date).AddHours(6)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DB Güncelleme Zamanlama" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Script: $scriptPath" -ForegroundColor Gray
Write-Host "Başlangıç: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
Write-Host ""

# Task adı
$taskName = "TacticIQ_DB_Update"

# Mevcut task'ı sil (varsa)
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Eski task silindi" -ForegroundColor Gray
} catch {}

# Yeni task oluştur
$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`"" -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -Once -At $startTime
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "TacticIQ DB Güncelleme - Otomatik çalışır" | Out-Null

Write-Host "✅ Task oluşturuldu!" -ForegroundColor Green
Write-Host ""
Write-Host "Task bilgileri:" -ForegroundColor Cyan
Get-ScheduledTask -TaskName $taskName | Format-List TaskName, State, NextRunTime
Write-Host ""
Write-Host "Task'i görmek için:" -ForegroundColor Gray
Write-Host "  Get-ScheduledTask -TaskName $taskName" -ForegroundColor White
Write-Host ""
Write-Host "Task'i silmek için:" -ForegroundColor Gray
Write-Host "  Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false" -ForegroundColor White
