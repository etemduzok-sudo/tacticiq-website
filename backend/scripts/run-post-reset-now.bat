@echo off
cd /d "%~dp0.."
echo ========================================
echo   TacticIQ - API Sifirlama Sonrasi Tam Senkron
echo   ~30-60 dakika surebilir - kapatmayin
echo ========================================
echo.
node scripts/post-reset-full-sync.js
echo.
echo Tamamlandi!
pause
