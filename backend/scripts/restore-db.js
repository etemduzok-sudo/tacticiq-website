/**
 * TacticIQ Database Restore Script
 * JSON yedeklerinden Supabase'e geri yükler
 * 
 * Kullanım: node scripts/restore-db.js <backup-folder>
 * Örnek: node scripts/restore-db.js backups/backup-2026-02-02T12-00-00
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Tablo restore sırası (foreign key bağımlılıkları için)
const RESTORE_ORDER = [
  'static_teams',
  'team_squads',
  'profiles',
  'matches',
  'predictions',
  'squad_predictions',
  'user_badges'
];

// Her tablonun primary key'i
const TABLE_KEYS = {
  'static_teams': 'api_football_id',
  'team_squads': ['team_id', 'season'],
  'profiles': 'id',
  'matches': 'id',
  'predictions': 'id',
  'squad_predictions': 'id',
  'user_badges': 'id'
};

async function restoreTable(tableName, data, options = {}) {
  console.log(`📥 ${tableName} geri yükleniyor (${data.length} kayıt)...`);
  
  const key = TABLE_KEYS[tableName];
  const batchSize = 500;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { 
        onConflict: Array.isArray(key) ? key.join(',') : key,
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`  ❌ Batch ${i}-${i + batch.length} hatası:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }
  
  return { table: tableName, inserted, errors };
}

async function main() {
  const backupFolder = process.argv[2];
  
  if (!backupFolder) {
    console.log('Kullanım: node scripts/restore-db.js <backup-folder>');
    console.log('');
    
    // Mevcut yedekleri listele
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupsDir)) {
      const backups = fs.readdirSync(backupsDir).filter(f => f.startsWith('backup-'));
      if (backups.length > 0) {
        console.log('Mevcut yedekler:');
        backups.forEach(b => console.log(`  - ${b}`));
      }
    }
    return;
  }
  
  // Backup klasörünü bul
  let fullPath = backupFolder;
  if (!path.isAbsolute(backupFolder)) {
    fullPath = path.join(__dirname, '..', backupFolder);
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(__dirname, '..', 'backups', backupFolder);
    }
  }
  
  if (!fs.existsSync(fullPath)) {
    console.error('❌ Backup klasörü bulunamadı:', backupFolder);
    return;
  }
  
  console.log('🚀 TacticIQ Database Restore Başlıyor...');
  console.log(`📁 Kaynak: ${fullPath}\n`);
  
  // Summary oku
  const summaryPath = path.join(fullPath, '_summary.json');
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    console.log(`📅 Yedek tarihi: ${summary.timestamp}`);
    console.log(`📊 Toplam kayıt: ${summary.totalRecords}\n`);
  }
  
  const results = [];
  
  for (const table of RESTORE_ORDER) {
    const filePath = path.join(fullPath, `${table}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ${table}.json bulunamadı, atlanıyor...`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = await restoreTable(table, data);
    results.push(result);
    
    console.log(`  ✅ ${result.inserted} eklendi, ${result.errors} hata`);
  }
  
  console.log('\n========================================');
  console.log('✅ Restore tamamlandı!');
  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  console.log(`📊 Toplam: ${totalInserted} eklendi, ${totalErrors} hata`);
  console.log('========================================');
}

main().catch(console.error);
