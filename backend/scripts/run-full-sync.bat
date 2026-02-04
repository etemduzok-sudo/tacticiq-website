@echo off
cd /d "%~dp0.."
echo ========================================
echo   TacticIQ - Tam Veri Senkronizasyonu
echo ========================================
echo.
echo 1. Lig + Takim + Kadro + Teknik Direktor...
node scripts/sync-all-world-leagues.js
echo.
echo 2. Eksik teknik direktorleri tamamla...
node scripts/backfill-coaches.js
echo.
echo Tamamlandi!
pause
