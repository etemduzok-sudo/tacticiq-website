@echo off
echo ========================================
echo TacticIQ Profil Test Botu
echo ========================================
echo.

echo [1/3] Playwright kontrol ediliyor...
where playwright >nul 2>&1
if %errorlevel% neq 0 (
    echo Playwright bulunamadi, kuruluyor...
    call npm install --save-dev playwright
    call npx playwright install chromium
)

echo.
echo [2/3] Web sunucusu kontrol ediliyor...
echo Web sunucusunun calistigindan emin olun: cd website ^&^& npm run dev
echo.
pause

echo.
echo [3/3] Test botu calistiriliyor...
call node scripts/profile-test-bot.js

echo.
echo ========================================
echo Test tamamlandi!
echo Sonuclar: test-results-profile-bot.json
echo ========================================
pause
