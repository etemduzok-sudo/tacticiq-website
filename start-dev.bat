@echo off
REM ========================================
REM TacticIQ - Development Launcher
REM ========================================

echo.
echo ========================================
echo   TACTICIQ - DEV LAUNCHER
echo ========================================
echo.

REM 1. Android Studio'yu aç (arka planda)
echo [1/4] Android Studio baslatiliyor...
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe"
timeout /t 3 /nobreak >nul

REM 2. Emülatörü başlat (Pixel 6)
echo [2/4] Emulator (Pixel 6) baslatiliyor...
start "" "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" -avd Pixel_6
timeout /t 10 /nobreak >nul

REM 3. Metro Bundler'ı başlat
echo [3/4] Metro Bundler baslatiliyor...
start "Metro Bundler" cmd /k "cd /d %~dp0 && npx expo start --clear"
timeout /t 5 /nobreak >nul

REM 4. Expo Go'yu aç ve app'i yükle (20 saniye sonra)
echo [4/4] 20 saniye bekleniyor (emulator acilsin)...
timeout /t 20 /nobreak >nul

echo.
echo Expo Go ve App yukleniyor...
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell monkey -p host.exp.exponent 1
timeout /t 2 /nobreak >nul
"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell am start -a android.intent.action.VIEW -d "exp://192.168.254.149:8081"

echo.
echo ========================================
echo   TAMAMLANDI!
echo ========================================
echo.
echo Android Studio: ACIK
echo Emulator (Pixel 6): ACIK
echo Metro Bundler: CALISIOR (yeni pencerede)
echo Expo Go: APP YUKLENIYOR...
echo.
echo Metro penceresinde QR kodu goreceksin!
echo.
pause
