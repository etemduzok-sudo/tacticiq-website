@echo off
REM Coach + Renkler + Kadrolar gunluk guncelleme (max 1500 takim).
REM Cron veya Windows Task Scheduler ile gunluk calistirin (ornek: 03:00).
REM Pencereyi kapatmayin; bittiginde pause ile kalir.

cd /d "%~dp0.."
echo [%date% %time%] Gunluk job'lar basliyor...
echo Coach, renkler, kadrolar guncelleniyor (max 1500 takim).
echo.
node scripts/run-daily-jobs.js
echo.
echo [%date% %time%] Bitti.
pause
