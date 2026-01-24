@echo off
chcp 65001 >nul
echo ========================================
echo TacticIQ - Backend Watchdog
echo Backend otomatik yeniden baslatma
echo ========================================
echo.

:loop
echo [%date% %time%] Backend baslatiliyor...
cd /d "%~dp0"

REM Backend'i baslat
start /B node server.js

REM Backend'in calisip calismadigini kontrol et
:check
timeout /t 5 /nobreak >nul
netstat -an | findstr ":3001" >nul
if errorlevel 1 (
    echo [%date% %time%] Backend durdu! Yeniden baslatiliyor...
    taskkill /F /IM node.exe 2>nul
    timeout /t 2 /nobreak >nul
    goto loop
) else (
    goto check
)
