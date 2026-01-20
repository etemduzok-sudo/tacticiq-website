@echo off
chcp 65001 >nul
title TacticIQ - Sistemleri Yeniden Baslat
color 0A

echo ========================================
echo   TacticIQ - Tum Sistemleri Yeniden Baslat
echo ========================================
echo.

REM 1. Tum Node sureclerini kapat
echo [1/5] Mevcut Node sureclerini kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Node surecleri kapatildi!

REM 2. Cache temizle
echo [2/5] Cache temizleniyor...
if exist "%CD%\.expo" rmdir /s /q "%CD%\.expo" >nul 2>&1
if exist "%CD%\node_modules\.cache" rmdir /s /q "%CD%\node_modules\.cache" >nul 2>&1
if exist "%CD%\website\.vite" rmdir /s /q "%CD%\website\.vite" >nul 2>&1
if exist "%CD%\website\node_modules\.vite" rmdir /s /q "%CD%\website\node_modules\.vite" >nul 2>&1
echo    Cache temizlendi!

REM 3. Backend baslat
echo [3/5] Backend baslatiliyor...
start "BACKEND SERVER" cmd /k "cd /d %CD%\backend && echo BACKEND SERVER && node server.js"
timeout /t 2 /nobreak >nul
echo    Backend basladi!

REM 4. Website baslat
echo [4/5] Website baslatiliyor...
start "WEBSITE (Vite)" cmd /k "cd /d %CD%\website && echo WEBSITE (Vite) && npm run dev"
timeout /t 2 /nobreak >nul
echo    Website basladi!

REM 5. Expo Web baslat (cache temizleyerek)
echo [5/5] Expo Web baslatiliyor (cache temizleniyor)...
start "EXPO WEB" cmd /k "cd /d %CD% && echo EXPO WEB && npx expo start --clear --web"
echo    Expo Web basladi!

echo.
echo ========================================
echo   Tum sistemler baslatildi!
echo ========================================
echo.
echo Acilan pencereler:
echo   - Backend: http://localhost:3001
echo   - Website: http://localhost:5173
echo   - Expo Web: http://localhost:8081
echo.
echo Bu pencereyi kapatabilirsiniz.
timeout /t 5 >nul
