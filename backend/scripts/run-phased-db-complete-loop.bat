@echo off
REM Sıralı DB tam doldurma - bittiğinde veya durduğunda otomatik tekrar çalıştır. Durdurmak için Ctrl+C.
cd /d "%~dp0.."
:loop
echo.
echo [%date% %time%] === Sıralı DB tam doldurma basliyor (durdurulunca tekrar baslayacak) ===
echo.
node scripts/run-phased-db-complete.js --delay=1000
echo.
echo [%date% %time%] Script durdu. 15 saniye sonra tekrar baslatiliyor...
timeout /t 15 /nobreak >nul
goto loop
