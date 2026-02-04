@echo off
REM Oyuncu rating seed - Bugunku API hakki (7450) kullanilir.
REM Tamamlanmasi ~35-40 dakika surer. Pencereyi kapatmayin.
REM Limit dolunca veya bittiginde otomatik kapanir; yarin tekrar calistirinca kaldigi yerden devam eder.

cd /d "%~dp0.."
echo [%date% %time%] Rating seed basliyor...
echo Kadrolardan oyuncu sayisi kadar API cagrisi yapilacak (gunluk max 7450).
echo.
node scripts/seed-initial-player-ratings.js
echo.
echo [%date% %time%] Bitti.
pause
