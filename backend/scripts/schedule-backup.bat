@echo off
REM DB Yedekleme - Windows GOREV ZAMANLAYICI ile 04:00'de her gun calistir
REM (post-reset-full-sync 03:00'de calistigi icin yedek sync sonrasi alinir)
REM
REM Gorev Olusturma:
REM   1. Gorev Zamanlayici ac (taskschd.msc)
REM   2. Temel Gorev Olustur
REM   3. Tetikleyici: Gunluk, 04:00
REM   4. Eylem: Program baslat -> Bu .bat dosyasi
REM

cd /d "%~dp0.."
echo [%date% %time%] DB Yedekleme basliyor...
node scripts\backup-db.js
echo [%date% %time%] Bitti.
