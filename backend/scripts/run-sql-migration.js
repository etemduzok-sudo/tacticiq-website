// ============================================
// SQL MIGRATION RUNNER
// ============================================
// Supabase'de SQL dosyalarını çalıştırır
// ============================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL veya SUPABASE_SERVICE_KEY bulunamadı!');
  console.error('   .env dosyasını kontrol edin.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Çalıştırılacak SQL dosyaları
const SQL_FILES = [
  '006_enhanced_match_tracking.sql',
];

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', '..', 'supabase', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Dosya bulunamadı: ${filePath}`);
    return false;
  }
  
  console.log(`📄 Çalıştırılıyor: ${filename}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // SQL'i parçalara ayır (her statement ayrı ayrı)
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`   ${statements.length} SQL statement bulundu`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty lines
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Bazı hatalar görmezden gelinebilir
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          console.log(`   ⚠️  Statement ${i + 1}: ${error.message.substring(0, 50)}...`);
        } else {
          console.error(`   ❌ Statement ${i + 1}: ${error.message.substring(0, 100)}`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      // RPC not available, try direct query approach
      console.log(`   ⚠️  RPC not available, skipping statement ${i + 1}`);
    }
  }
  
  console.log(`   ✅ Başarılı: ${successCount}, ❌ Hata: ${errorCount}`);
  return errorCount === 0;
}

async function createTablesDirectly() {
  console.log('\n📦 Tabloları doğrudan oluşturuluyor...\n');
  
  // Match Timeline Table
  console.log('1️⃣ match_timeline tablosu...');
  const { error: timelineError } = await supabase.from('match_timeline').select('id').limit(1);
  if (timelineError && timelineError.message.includes('does not exist')) {
    console.log('   ❌ Tablo yok - Supabase SQL Editor\'da manuel oluşturulmalı');
  } else if (timelineError) {
    console.log(`   ⚠️  ${timelineError.message}`);
  } else {
    console.log('   ✅ Tablo mevcut');
  }
  
  // Match Summaries Table
  console.log('2️⃣ match_summaries tablosu...');
  const { error: summaryError } = await supabase.from('match_summaries').select('id').limit(1);
  if (summaryError && summaryError.message.includes('does not exist')) {
    console.log('   ❌ Tablo yok - Supabase SQL Editor\'da manuel oluşturulmalı');
  } else if (summaryError) {
    console.log(`   ⚠️  ${summaryError.message}`);
  } else {
    console.log('   ✅ Tablo mevcut');
  }
  
  // Leaderboard Snapshots Table
  console.log('3️⃣ leaderboard_snapshots tablosu...');
  const { error: snapshotError } = await supabase.from('leaderboard_snapshots').select('id').limit(1);
  if (snapshotError && snapshotError.message.includes('does not exist')) {
    console.log('   ❌ Tablo yok - Supabase SQL Editor\'da manuel oluşturulmalı');
  } else if (snapshotError) {
    console.log(`   ⚠️  ${snapshotError.message}`);
  } else {
    console.log('   ✅ Tablo mevcut');
  }
  
  // Match Live Status Table
  console.log('4️⃣ match_live_status tablosu...');
  const { error: liveError } = await supabase.from('match_live_status').select('id').limit(1);
  if (liveError && liveError.message.includes('does not exist')) {
    console.log('   ❌ Tablo yok - Supabase SQL Editor\'da manuel oluşturulmalı');
  } else if (liveError) {
    console.log(`   ⚠️  ${liveError.message}`);
  } else {
    console.log('   ✅ Tablo mevcut');
  }
  
  // Static Teams Sync Log Table
  console.log('5️⃣ static_teams_sync_log tablosu...');
  const { error: syncLogError } = await supabase.from('static_teams_sync_log').select('id').limit(1);
  if (syncLogError && syncLogError.message.includes('does not exist')) {
    console.log('   ❌ Tablo yok - Supabase SQL Editor\'da manuel oluşturulmalı');
  } else if (syncLogError) {
    console.log(`   ⚠️  ${syncLogError.message}`);
  } else {
    console.log('   ✅ Tablo mevcut');
  }
}

async function checkExistingTables() {
  console.log('\n📊 Mevcut tabloları kontrol ediliyor...\n');
  
  const tables = [
    'users', 'user_stats', 'user_profiles', 'predictions', 'prediction_scores',
    'matches', 'teams', 'leagues', 'static_teams', 'favorite_teams',
    'match_timeline', 'match_summaries', 'leaderboard_snapshots'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`   ❌ ${table}: YOK`);
      } else {
        console.log(`   ⚠️  ${table}: ${error.message.substring(0, 40)}`);
      }
    } else {
      console.log(`   ✅ ${table}: VAR`);
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║           SQL MIGRATION RUNNER                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? '***' + SUPABASE_SERVICE_KEY.slice(-8) : 'YOK'}`);
  
  await checkExistingTables();
  await createTablesDirectly();
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   ⚠️  MANUEL İŞLEM GEREKLİ                              ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║                                                        ║');
  console.log('║   Yeni tabloları oluşturmak için:                      ║');
  console.log('║   1. Supabase Dashboard\'a gidin                        ║');
  console.log('║   2. SQL Editor\'ı açın                                 ║');
  console.log('║   3. 006_enhanced_match_tracking.sql içeriğini         ║');
  console.log('║      yapıştırıp çalıştırın                             ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
