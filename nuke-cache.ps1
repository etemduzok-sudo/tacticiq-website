# TacticIQ - Cache tamamen temizle (Metro/Expo eski bundle vermesin)
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location.Path }

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  TacticIQ - CACHE NUKLE" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# 1. 3001 ve 8081 portlarini bosalt
Write-Host "[1/4] 3001 ve 8081 kapatiliyor..." -ForegroundColor Yellow
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
                }
            }
        }
    } catch { }
}
Start-Sleep -Seconds 2
Write-Host "   Tamam." -ForegroundColor Green

# 2. Proje cache
Write-Host "[2/4] .expo, node_modules\.cache siliniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$Root\.expo"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$Root\node_modules\.cache"
Write-Host "   Tamam." -ForegroundColor Green

# 3. Metro / Haste temp
Write-Host "[3/4] Metro/Haste temp siliniyor..." -ForegroundColor Yellow
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$env:TEMP\metro-*"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$env:TEMP\haste-*"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$env:LOCALAPPDATA\Temp\metro-*"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue "$env:LOCALAPPDATA\Temp\haste-*"
Write-Host "   Tamam." -ForegroundColor Green

# 4. Kaynaklari "touch" et (timestamp guncelle – Metro yeniden alir)
Write-Host "[4/4] MatchPrediction ve MatchSquad touch ediliyor..." -ForegroundColor Yellow
$files = @(
    "$Root\src\components\match\MatchPrediction.tsx",
    "$Root\src\components\match\MatchSquad.tsx"
)
foreach ($f in $files) {
    if (Test-Path $f) {
        (Get-Item $f).LastWriteTime = Get-Date
        Write-Host "   Touched $(Split-Path -Leaf $f)" -ForegroundColor Gray
    }
}
Write-Host "   Tamam." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Cache nuklendi!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Simdi calistir:" -ForegroundColor White
Write-Host "  .\start-dev-web.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tarayicida:" -ForegroundColor White
Write-Host "  1. F12 > Network > 'Disable cache' isaretle" -ForegroundColor Gray
Write-Host "  2. Ctrl+Shift+R (hard refresh)" -ForegroundColor Gray
Write-Host "  3. Console'da su logu ara: MatchPrediction mounted (build: focus+confirm+tamamla-fix)" -ForegroundColor Gray
Write-Host ""
