@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    TACTICIQ - RESTART ALL SYSTEMS
echo ========================================
echo.
echo PowerShell script'i calistiriliyor...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0restart-all.ps1"
pause
