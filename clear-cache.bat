@echo off
REM ========================================
REM TacticIQ - Cache Cleaner
REM ========================================

echo.
echo ========================================
echo   CACHE TEMIZLEME BASLIYOR...
echo ========================================
echo.

REM 1. Metro Bundler'ı durdur
echo [1/5] Metro Bundler durduruluyor...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

REM 2. Expo Go cache'i temizle
echo [2/5] Expo Go cache temizleniyor...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell pm clear host.exp.exponent
timeout /t 2 /nobreak >nul

REM 3. Proje cache'lerini sil
echo [3/5] Proje cache'leri siliniyor...
cd /d C:\fan_manager_2026
if exist ".expo" rmdir /s /q ".expo"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM 4. Metro'yu yeniden başlat
echo [4/5] Metro Bundler yeniden baslatiliyor...
start "Metro Bundler" cmd /k "npx expo start --clear"
timeout /t 15 /nobreak >nul

REM 5. App'i yükle
echo [5/5] App yukleniyor...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell am start -a android.intent.action.VIEW -d "exp://192.168.254.149:8081"

echo.
echo ========================================
echo   TAMAMLANDI!
echo ========================================
echo.
echo Metro yeni pencerede baslatildi!
echo Expo Go temizlendi!
echo App yukleniyor...
echo.
pause
