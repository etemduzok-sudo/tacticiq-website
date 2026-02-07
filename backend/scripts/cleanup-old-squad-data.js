#!/usr/bin/env node
/**
 * Eski Kadro Verilerini Temizleme Script'i
 * 
 * Bu script:
 * - Belirtilen tarihten eski kadro verilerini siler
 * - Sadece 2025 sezonu verilerini korur
 * - Güncel olmayan verileri temizler
 * 
 * Kullanım: node scripts/cleanup-old-squad-data.js [--before-date=YYYY-MM-DD] [--dry-run]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Komut satırı argümanları
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const beforeDateArg = args.find(arg => arg.startsWith('--before-date='));
const beforeDate = beforeDateArg 
  ? new Date(beforeDateArg.split('=')[1])
  : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Varsayılan: 30 gün öncesi

async function cleanupOldData() {
  try {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   ESKİ KADRO VERİLERİNİ TEMİZLEME                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (dryRun) {
      console.log('⚠️ DRY-RUN MODU: Hiçbir veri silinmeyecek, sadece analiz yapılacak\n');
    }

    console.log(`📅 Temizleme kriteri: ${beforeDate.toLocaleDateString('tr-TR')} tarihinden önce güncellenmiş veriler`);
    console.log(`📋 Sezon: 2025\n`);

    // 1. Eski verileri bul
    const { data: oldSquads, error: findError } = await supabase
      .from('team_squads')
      .select('team_id, team_name, updated_at, players')
      .eq('season', 2025)
      .lt('updated_at', beforeDate.toISOString())
      .order('updated_at', { ascending: true });

    if (findError) {
      console.error('❌ Hata:', findError.message);
      return;
    }

    if (!oldSquads || oldSquads.length === 0) {
      console.log('✅ Temizlenecek eski veri bulunamadı!');
      return;
    }

    // İstatistikler
    const totalOldSquads = oldSquads.length;
    let totalOldPlayers = 0;
    oldSquads.forEach(squad => {
      if (squad.players && Array.isArray(squad.players)) {
        totalOldPlayers += squad.players.length;
      }
    });

    console.log('═'.repeat(70));
    console.log('📊 BULUNAN ESKİ VERİLER:');
    console.log('═'.repeat(70));
    console.log(`   Eski Kadro: ${totalOldSquads}`);
    console.log(`   Eski Oyuncu: ${totalOldPlayers}`);
    console.log('');

    // Örnek göster
    if (oldSquads.length > 0) {
      console.log('📋 Örnek Eski Veriler (ilk 10):');
      oldSquads.slice(0, 10).forEach(squad => {
        const updateDate = new Date(squad.updated_at).toLocaleDateString('tr-TR');
        const playerCount = squad.players?.length || 0;
        console.log(`   - ${squad.team_name} (${squad.team_id}): ${playerCount} oyuncu, güncelleme: ${updateDate}`);
      });
      if (oldSquads.length > 10) {
        console.log(`   ... ve ${oldSquads.length - 10} kadro daha`);
      }
      console.log('');
    }

    // 2. Temizleme işlemi
    if (dryRun) {
      console.log('═'.repeat(70));
      console.log('⚠️ DRY-RUN: Veriler silinmeyecek');
      console.log(`   Silinecek kadro sayısı: ${totalOldSquads}`);
      console.log(`   Silinecek oyuncu sayısı: ${totalOldPlayers}`);
      console.log('═'.repeat(70));
      console.log('\n💡 Gerçekten silmek için --dry-run parametresini kaldırın');
      return;
    }

    // Onay iste
    console.log('═'.repeat(70));
    console.log('⚠️ UYARI: Bu işlem geri alınamaz!');
    console.log(`   ${totalOldSquads} kadro silinecek`);
    console.log(`   ${totalOldPlayers} oyuncu verisi silinecek`);
    console.log('═'.repeat(70));
    console.log('\n⏸️ Script durduruldu - Manuel olarak devam etmek için kodu güncelleyin');
    console.log('   Veya --dry-run ile önce analiz yapın\n');

    /* GERÇEK SİLME İŞLEMİ - GÜVENLİK İÇİN YORUM SATIRINDA
    console.log('🗑️ Eski veriler siliniyor...');
    
    const teamIds = oldSquads.map(s => s.team_id);
    
    // Batch olarak sil (her 100'de bir)
    let deletedCount = 0;
    for (let i = 0; i < teamIds.length; i += 100) {
      const batch = teamIds.slice(i, i + 100);
      
      const { error: deleteError } = await supabase
        .from('team_squads')
        .delete()
        .in('team_id', batch)
        .eq('season', 2025)
        .lt('updated_at', beforeDate.toISOString());
      
      if (deleteError) {
        console.error(`❌ Batch ${i}-${i + 100} silinirken hata:`, deleteError.message);
      } else {
        deletedCount += batch.length;
        console.log(`✅ ${deletedCount}/${totalOldSquads} kadro silindi...`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ TEMİZLEME TAMAMLANDI!');
    console.log('═'.repeat(70));
    console.log(`   Silinen kadro: ${deletedCount}`);
    console.log(`   Silinen oyuncu verisi: ${totalOldPlayers}`);
    console.log('═'.repeat(70));
    */

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

cleanupOldData().then(() => process.exit(0));
