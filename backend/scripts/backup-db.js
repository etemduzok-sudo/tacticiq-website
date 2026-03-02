/**
 * TacticIQ Database Backup Script
 * Supabase'deki kritik tabloları JSON olarak yedekler (yerel backups/ klasörüne).
 *
 * Kullanım: node scripts/backup-db.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const fs = require('fs');
const { supabase } = require('../config/supabase');
const { runBackup } = require('../services/backupService');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function main() {
  if (!supabase) {
    console.error('❌ Supabase yapılandırılmadı. .env içinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY kontrol edin.');
    process.exit(1);
  }

  console.log('🚀 TacticIQ Database Backup Başlıyor...\n');

  const { folderName, tables, summary } = await runBackup(supabase);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backupFolder = path.join(BACKUP_DIR, folderName);
  fs.mkdirSync(backupFolder, { recursive: true });

  const fullBackup = {};
  for (const [tableName, data] of Object.entries(tables)) {
    const filePath = path.join(backupFolder, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✅ ${tableName}: ${data.length} kayıt`);
    fullBackup[tableName] = data;
  }

  fs.writeFileSync(
    path.join(backupFolder, '_full_backup.json'),
    JSON.stringify(fullBackup, null, 2)
  );
  fs.writeFileSync(
    path.join(backupFolder, '_summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n========================================');
  console.log(`✅ Yedekleme tamamlandı!`);
  console.log(`📁 Konum: ${backupFolder}`);
  console.log(`📊 Toplam: ${summary.totalRecords} kayıt`);
  console.log('========================================');
}

main().catch(console.error);
