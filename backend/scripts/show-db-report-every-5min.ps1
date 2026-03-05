# DB rapor dosyasini 5 dakikada bir okuyup son guncellemeyi gosterir.
# Kullanim: .\scripts\show-db-report-every-5min.ps1
# Durdurmak: Ctrl+C

$reportPath = Join-Path $PSScriptRoot "..\data\db-status-report.txt"
$intervalSeconds = 5 * 60  # 5 dakika

function Get-LastReportBlock {
    if (-not (Test-Path $reportPath)) {
        return "Rapor dosyasi bulunamadi: $reportPath"
    }
    $content = Get-Content $reportPath -Raw -Encoding UTF8
    $marker = "========== DB GUNCELLEME RAPORU"
    $idx = $content.LastIndexOf($marker)
    if ($idx -ge 0) {
        return $content.Substring($idx).Trim()
    }
    return $content.Substring([Math]::Max(0, $content.Length - 2500))
}

Write-Host "DB Rapor Izleyici - Her 5 dakikada bir guncelleme gosterilir."
Write-Host "Dosya: $reportPath"
Write-Host "Durdurmak icin Ctrl+C"
Write-Host ""

while ($true) {
    $block = Get-LastReportBlock
    Clear-Host
    Write-Host "========== SON GUNCELLEME ( $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ) ==========" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $block
    Write-Host ""
    Write-Host "Sonraki guncelleme: 5 dakika sonra..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $intervalSeconds
}
