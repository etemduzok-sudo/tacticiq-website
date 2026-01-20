@echo off
chcp 65001 >nul
title TacticIQ - Tum Sistemleri Durdur
color 0C

echo ========================================
echo   TacticIQ - Tum Sistemleri Durdur
echo ========================================
echo.

echo Tum Node surecleri kapatiliyor...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    Tum surecler kapatildi!
) else (
    echo    Zaten durdurulmus veya surec bulunamadi.
)

echo.
echo ========================================
echo   Tum sistemler durduruldu!
echo ========================================
echo.
echo Bu pencereyi kapatabilirsiniz.
timeout /t 3 >nul
