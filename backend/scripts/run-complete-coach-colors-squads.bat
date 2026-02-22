@echo off
REM Coach + Renkler + Kadrolar - TUM eksikleri tamamla (bir kez).
REM DB %100 olana kadar calistir. Bittikten sonra rutin icin run-daily-jobs.bat kullanin.

cd /d "%~dp0.."
echo [%date% %time%] Coach + Renkler + Kadrolar TAM DOLDURMA basliyor...
echo API limiti nedeniyle 600ms aralik. ~20-40 dakika surebilir.
echo.
node scripts/update-coach-colors-squads.js --all --delay=600
echo.
echo [%date% %time%] Bitti. Rutin gunluk guncelleme icin: run-daily-jobs.bat
pause
