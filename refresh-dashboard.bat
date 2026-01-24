@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   DASHBOARD YENILEME
echo ========================================
echo.
echo [1/3] Metro Bundler durduruluyor...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Cache temizleniyor...
cd /d "%~dp0"
if exist ".expo" rmdir /s /q ".expo"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo [3/3] Metro Bundler yeniden baslatiliyor (cache temizlenerek)...
start "Metro Bundler" cmd /k "npx expo start --clear"

echo.
echo ========================================
echo   TAMAMLANDI!
echo ========================================
echo.
echo Metro yeni pencerede baslatildi!
echo Expo Go'da "r" tusuna basin veya app'i yeniden yukleyin!
echo.
pause
