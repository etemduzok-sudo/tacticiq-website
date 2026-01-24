@echo off
chcp 65001 >nul
echo ========================================
echo TacticIQ - Backend Watchdog Baslat
echo Backend otomatik yeniden baslatma ile
echo ========================================
echo.

cd /d "%~dp0\backend"
powershell.exe -ExecutionPolicy Bypass -File "watchdog-backend.ps1"

pause
