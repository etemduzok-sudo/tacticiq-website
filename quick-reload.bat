@echo off
REM ========================================
REM TacticIQ - Quick Reload
REM ========================================

echo.
echo [RELOAD] Expo Go yeniden yukleniyor...

REM Dev menu aç
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell input keyevent 82
timeout /t 1 /nobreak >nul

REM Reload seç
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell input keyevent 66

echo.
echo [TAMAM] Reload tamamlandi!
echo.
pause
