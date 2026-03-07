#!/usr/bin/env node
/**
 * Sadece 2024 sezonu verilerini DB'den siler.
 * Silinen tablolar: matches (season=2024), team_squads (season=2024), leagues (season=2024), player_power_scores (season=2024).
 * Başka hiçbir tabloya dokunulmaz (kullanıcı, tahmin, profil vb. silinmez).
 *
 * Kullanım: node scripts/delete-season-2024-data.js [--dry-run]
 *   --dry-run  Silme yapmaz, sadece silinecek kayıt sayılarını raporlar.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

const SEASON_2024 = 2024;
const DRY_RUN = process.argv.includes('--dry-run');

async function count(table, column, value) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);
  if (error) return { count: 0, error };
  return { count: count ?? 0, error: null };
}

async function main() {
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_PROJECT_URL) {
    console.error('SUPABASE_URL gerekli (.env)');
    process.exit(1);
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY veya SUPABASE_SERVICE_KEY gerekli (.env)');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  2024 SEZONU VERİLERİNİ SİLME (sadece season=2024)');
  console.log('═══════════════════════════════════════════════════════════');
  if (DRY_RUN) {
    console.log('  [DRY-RUN] Silme yapılmayacak, sadece sayılar gösterilecek.\n');
  }

  const tables = [
    { table: 'matches', column: 'season', label: 'Maçlar' },
    { table: 'team_squads', column: 'season', label: 'Takım kadroları' },
    { table: 'leagues', column: 'season', label: 'Ligler' },
    { table: 'player_power_scores', column: 'season', label: 'Oyuncu power score' },
  ];

  let totalDeleted = 0;

  for (const { table, column, label } of tables) {
    const { count: c, error } = await count(table, column, SEASON_2024);
    if (error) {
      if (error.code === '42P01') {
        console.log(`  ${label} (${table}): tablo yok, atlanıyor.`);
      } else {
        console.error(`  ${label} (${table}): hata`, error.message);
      }
      continue;
    }
    console.log(`  ${label} (${table}): season=${SEASON_2024} → ${c} kayıt`);

    if (!DRY_RUN && c > 0) {
      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .eq(column, SEASON_2024);
      if (delErr) {
        console.error(`    Silme hatası:`, delErr.message);
      } else {
        console.log(`    Silindi: ${c}`);
        totalDeleted += c;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  if (DRY_RUN) {
    console.log('  DRY-RUN bitti. Gerçekten silmek için --dry-run olmadan çalıştır.');
  } else {
    console.log(`  Toplam silinen: ${totalDeleted}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
