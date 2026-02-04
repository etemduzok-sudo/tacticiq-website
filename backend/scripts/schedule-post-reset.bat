@echo off
REM API sayaci saat 03:00'de sifirlaninca calistirilacak tam senkron
REM Windows GOREV ZAMANLAYICI ile 03:00'de her gun calistir
REM
REM Gorev Olusturma:
REM   1. Gorev Zamanlayici ac
REM   2. Temel Gorev Olustur
REM   3. Tetikleyici: Gunluk, 03:00
REM   4. Eylem: Program baslat -> Bu .bat dosyasi
REM

cd /d "%~dp0.."
echo [%date% %time%] Post-API-Reset Full Sync basliyor...
node scripts\post-reset-full-sync.js
echo [%date% %time%] Bitti.
