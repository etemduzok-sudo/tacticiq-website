@echo off
REM Sırayla: Koç %100 -> Renk %100 -> Kadro %100 -> Rating %100. Her biri bitmeden digerine gecilmez.
cd /d "%~dp0.."
echo [%date% %time%] Sıralı DB tam doldurma basliyor...
node scripts/run-phased-db-complete.js --delay=1000
echo [%date% %time%] Bitti.
pause
