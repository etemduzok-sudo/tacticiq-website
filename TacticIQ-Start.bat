@echo off
chcp 65001 >nul
title TacticIQ - All Systems Startup
color 0A

echo.
echo ========================================
echo    TacticIQ - All Systems Startup
echo ========================================
echo.

echo [1/5] Tum Node surecleri kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Surecler kapatildi!
echo.

echo [2/5] Cache temizleniyor...
rmdir /s /q "C:\TacticIQ\.expo" 2>nul
rmdir /s /q "C:\TacticIQ\node_modules\.cache" 2>nul
rmdir /s /q "C:\TacticIQ\website\.vite" 2>nul
rmdir /s /q "C:\TacticIQ\website\node_modules\.vite" 2>nul
echo       Cache temizlendi!
echo.

echo [3/5] Backend baslatiliyor...
start "TacticIQ Backend" cmd /k "cd /d C:\TacticIQ\backend && color 0E && echo BACKEND SERVER && echo =============== && node server.js"
timeout /t 2 /nobreak >nul
echo       Backend basladi!
echo.

echo [4/5] Website baslatiliyor...
start "TacticIQ Website" cmd /k "cd /d C:\TacticIQ\website && color 0B && echo WEBSITE (Vite) && echo =============== && npm run dev"
timeout /t 2 /nobreak >nul
echo       Website basladi!
echo.

echo [5/5] Expo Web baslatiliyor (cache temizleniyor)...
start "TacticIQ Expo" cmd /k "cd /d C:\TacticIQ && color 0D && echo EXPO WEB && echo =============== && npx expo start --clear --web"
echo       Expo Web basladi!
echo.

echo ========================================
echo    Tum sistemler baslatildi!
echo ========================================
echo.
echo Acilan pencereler:
echo   - Backend: http://localhost:3001
echo   - Website: http://localhost:5173
echo   - Expo Web: http://localhost:8081
echo.
echo Bu pencereyi kapatabilirsiniz.
echo.
pause
