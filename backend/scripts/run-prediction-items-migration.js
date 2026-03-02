#!/usr/bin/env node
// ============================================
// prediction_items tablosu migration
// ============================================
// Supabase'de prediction_items yoksa veya RLS yüzünden erişilemiyorsa
// bu script ile tabloyu ve RLS politikalarını oluşturur.
//
// Gereksinim: DATABASE_URL veya SUPABASE_DB_URL (Postgres connection string)
// Örnek: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
//
// Alternatif: Supabase Dashboard → SQL Editor → 20260302_prediction_items.sql içeriğini yapıştırıp çalıştırın.
// ============================================

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL veya SUPABASE_DB_URL tanımlı değil.');
  console.error('   .env dosyasına ekleyin veya Supabase Dashboard → SQL Editor\'da');
  console.error('   supabase/migrations/20260302_prediction_items.sql içeriğini çalıştırın.');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260302_prediction_items.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration dosyası bulunamadı:', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf8');

// Yorum satırlarını kaldır, sonra ; ile ayır (tek satırda ; olan yapılar için)
const sqlClean = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');
const statements = sqlClean
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

async function main() {
  const pool = new Pool({ connectionString });
  let ok = 0;
  let err = 0;
  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      try {
        await pool.query(stmt);
        ok++;
      } catch (e) {
        if (e.message && (e.message.includes('already exists') || e.message.includes('does not exist'))) {
          ok++;
        } else {
          console.error(`❌ Statement ${i + 1}:`, e.message);
          err++;
        }
      }
    }
    console.log('✅ prediction_items migration tamamlandı:', ok, 'başarılı,', err, 'hata.');
  } finally {
    await pool.end();
  }
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
