@echo off
REM DB Yedekleme - Her gun 04:00'te calismasi icin once schedule-backup-task.ps1 calistirin.
REM Manuel yedek icin: bu .bat dosyasini calistirin veya: node scripts\backup-db.js (backend klasorundan)
REM
REM Otomatik gorev olusturma (bir kez):
REM   PowerShell: cd c:\TacticIQ\backend\scripts
REM   .\schedule-backup-task.ps1
REM

cd /d "c:\TacticIQ\backend"
if not exist ".env" (
  echo Uyari: .env bulunamadi. Yedek Supabase baglantisi yapilamayabilir.
)
echo [%date% %time%] DB Yedekleme basliyor...
node scripts\backup-db.js
echo [%date% %time%] Bitti.
