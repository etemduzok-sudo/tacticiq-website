@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    TACTICIQ - OTOMATIK SERVIS BASLATICISI
echo ========================================
echo.
echo PowerShell script'i çalıştırılıyor...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
pause
