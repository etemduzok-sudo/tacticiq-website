@echo off
chcp 65001 >nul
title TacticIQ - Stop All Systems
color 0C

echo.
echo ========================================
echo    TacticIQ - Stopping All Systems
echo ========================================
echo.

echo Tum Node surecleri kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1
echo    Tum surecler kapatildi!
echo.

echo ========================================
echo    Tum sistemler durduruldu!
echo ========================================
echo.
pause
