/**
 * TacticIQ Database Backup Script
 * Supabase'deki kritik tabloları JSON olarak yedekler
 * 
 * Kullanım: node scripts/backup-db.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Yedeklenecek tablolar
const TABLES_TO_BACKUP = [
  'static_teams',
  'team_squads',
  'matches',
  'profiles',
  'predictions',
  'squad_predictions',
  'user_badges'
];

// Yedek klasörü
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function fetchAllRows(tableName) {
  const allRows = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error(`❌ ${tableName} okuma hatası:`, error.message);
      return null;
    }
    
    if (!data || data.length === 0) break;
    
    allRows.push(...data);
    offset += limit;
    
    if (data.length < limit) break;
  }
  
  return allRows;
}

async function backupTable(tableName) {
  console.log(`📦 ${tableName} yedekleniyor...`);
  
  const data = await fetchAllRows(tableName);
  
  if (data === null) {
    return { table: tableName, success: false, count: 0 };
  }
  
  return { table: tableName, success: true, count: data.length, data };
}

async function main() {
  console.log('🚀 TacticIQ Database Backup Başlıyor...\n');
  
  // Backup klasörünü oluştur
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Tarih damgası
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFolder = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });
  
  const results = [];
  const fullBackup = {};
  
  for (const table of TABLES_TO_BACKUP) {
    const result = await backupTable(table);
    results.push(result);
    
    if (result.success && result.data) {
      // Her tablo ayrı dosyaya
      const filePath = path.join(backupFolder, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
      console.log(`  ✅ ${table}: ${result.count} kayıt`);
      
      fullBackup[table] = result.data;
    } else {
      console.log(`  ⚠️ ${table}: Yedeklenemedi`);
    }
  }
  
  // Tek dosyada tam yedek
  const fullBackupPath = path.join(backupFolder, '_full_backup.json');
  fs.writeFileSync(fullBackupPath, JSON.stringify(fullBackup, null, 2));
  
  // Özet rapor
  const summaryPath = path.join(backupFolder, '_summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    tables: results.map(r => ({ table: r.table, success: r.success, count: r.count })),
    totalRecords: results.reduce((sum, r) => sum + (r.count || 0), 0)
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n========================================');
  console.log(`✅ Yedekleme tamamlandı!`);
  console.log(`📁 Konum: ${backupFolder}`);
  console.log(`📊 Toplam: ${summary.totalRecords} kayıt`);
  console.log('========================================');
}

main().catch(console.error);
