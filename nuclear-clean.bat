@echo off
echo ========================================
echo  NUCLEAR CLEAN - HER SEYI SIFIRLAMA
echo ========================================
echo.

echo [1/7] Node process durduruluyor...
taskkill /F /IM node.exe 2>nul

echo [2/7] node_modules siliniyor...
rmdir /s /q node_modules 2>nul

echo [3/7] package-lock.json siliniyor...
del package-lock.json 2>nul

echo [4/7] Expo cache siliniyor...
rmdir /s /q .expo 2>nul

echo [5/7] Watchman cache siliniyor...
watchman watch-del-all 2>nul

echo [6/7] npm cache temizleniyor...
npm cache clean --force

echo [7/7] Yeniden yukleniyor...
npm install

echo.
echo ========================================
echo  TEMIZLIK TAMAMLANDI!
echo  Simdi: npx expo start --clear
echo ========================================
pause
