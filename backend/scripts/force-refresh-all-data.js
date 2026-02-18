#!/usr/bin/env node
/**
 * TÜM VERİLERİ ZORLA YENİLE
 * 
 * Bu script:
 * 1. team_squads tablosundaki TÜM eski verileri siler
 * 2. static_teams'deki coach verilerini sıfırlar  
 * 3. Backend squadSyncService'i tetikler (API'den taze veri çeker)
 * 
 * Kullanım: node scripts/force-refresh-all-data.js [--dry-run]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase bağlantısı
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/"/g, '');
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');

// Service key varsa onu kullan (RLS bypass için), yoksa anon key
const SUPABASE_KEY = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TÜM VERİLERİ ZORLA YENİLE (2025-26 SEZONU)                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n🔧 Mod: ${dryRun ? 'DRY-RUN' : 'GERÇEK'}`);
  console.log(`🔑 Service Key: ${SUPABASE_SERVICE_KEY ? 'VAR (RLS bypass)' : 'YOK (anon key)'}`);

  // ================================
  // ADIM 1: Mevcut durumu analiz et
  // ================================
  console.log('\n📊 ADIM 1: Mevcut durum analizi...');
  
  const { data: squads, count: squadCount } = await supabase
    .from('team_squads')
    .select('team_id, team_name, season, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(10);

  console.log(`   📋 Toplam kadro: ${squadCount || 0}`);
  
  if (squads && squads.length > 0) {
    console.log('   📅 Son güncellenen kadrolar:');
    squads.slice(0, 5).forEach(s => {
      const date = new Date(s.updated_at).toLocaleDateString('tr-TR');
      console.log(`      - ${s.team_name} (sezon: ${s.season}, güncelleme: ${date})`);
    });
  }

  // Eski sezon verilerini say
  const { count: oldSeasonCount } = await supabase
    .from('team_squads')
    .select('*', { count: 'exact', head: true })
    .lt('season', 2025);

  const { count: currentSeasonCount } = await supabase
    .from('team_squads')
    .select('*', { count: 'exact', head: true })
    .eq('season', 2025);

  console.log(`   📆 2025 öncesi kadrolar: ${oldSeasonCount || 0}`);
  console.log(`   📆 2025 sezonu kadrolar: ${currentSeasonCount || 0}`);

  // ================================
  // ADIM 2: Eski season verilerini sil
  // ================================
  console.log('\n🗑️ ADIM 2: Eski sezon verilerini temizle (< 2025)...');
  
  if (dryRun) {
    console.log(`   [DRY-RUN] ${oldSeasonCount || 0} eski sezon kaydı silinecekti`);
  } else if (oldSeasonCount > 0) {
    const { error } = await supabase
      .from('team_squads')
      .delete()
      .lt('season', 2025);
    
    if (error) {
      console.log(`   ❌ Silme hatası: ${error.message}`);
    } else {
      console.log(`   ✅ ${oldSeasonCount} eski sezon kaydı silindi`);
    }
  } else {
    console.log('   ✅ Silinecek eski sezon verisi yok');
  }

  // ================================
  // ADIM 3: 30 günden eski 2025 verilerini sil
  // ================================
  console.log('\n🗑️ ADIM 3: 30 günden eski 2025 kadro verilerini temizle...');
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { count: staleCount } = await supabase
    .from('team_squads')
    .select('*', { count: 'exact', head: true })
    .eq('season', 2025)
    .lt('updated_at', thirtyDaysAgo);

  if (dryRun) {
    console.log(`   [DRY-RUN] ${staleCount || 0} eski kadro silinecekti`);
  } else if (staleCount > 0) {
    const { error } = await supabase
      .from('team_squads')
      .delete()
      .eq('season', 2025)
      .lt('updated_at', thirtyDaysAgo);
    
    if (error) {
      console.log(`   ❌ Silme hatası: ${error.message}`);
    } else {
      console.log(`   ✅ ${staleCount} eski kadro silindi`);
    }
  } else {
    console.log('   ✅ Silinecek eski kadro yok');
  }

  // ================================
  // ADIM 4: Coach verilerini güncelle
  // ================================
  console.log('\n👔 ADIM 4: Coach verilerini sıfırla (yeniden API\'den çekilecek)...');
  
  const { data: teamsWithOldCoach } = await supabase
    .from('static_teams')
    .select('id, name, coach')
    .not('coach', 'is', null);

  const oldCoachCount = teamsWithOldCoach?.length || 0;

  if (dryRun) {
    console.log(`   [DRY-RUN] ${oldCoachCount} takımın coach verisi sıfırlanacaktı`);
  } else if (oldCoachCount > 0) {
    const { error } = await supabase
      .from('static_teams')
      .update({ coach: null, coach_api_id: null })
      .not('id', 'is', null);
    
    if (error) {
      console.log(`   ❌ Güncelleme hatası: ${error.message}`);
    } else {
      console.log(`   ✅ ${oldCoachCount} takımın coach verisi sıfırlandı`);
    }
  } else {
    console.log('   ✅ Sıfırlanacak coach verisi yok');
  }

  // ================================
  // ADIM 5: Backend'e sync tetikle
  // ================================
  console.log('\n🔄 ADIM 5: Backend squadSyncService tetikle...');
  
  if (dryRun) {
    console.log('   [DRY-RUN] Backend sync tetiklenmedi');
  } else {
    try {
      // Backend'in health endpoint'ini kontrol et
      const healthResponse = await axios.get('http://localhost:3001/health', { timeout: 5000 });
      
      if (healthResponse.data) {
        console.log('   ✅ Backend çalışıyor');
        
        // Squad sync endpoint'ini tetikle (varsa)
        try {
          await axios.post('http://localhost:3001/api/admin/sync-squads', {}, { timeout: 5000 });
          console.log('   ✅ Squad sync tetiklendi');
        } catch (syncErr) {
          console.log('   ⚠️ Squad sync endpoint yok, backend otomatik sync kullanılacak');
          console.log('   💡 Backend her 12 saatte bir otomatik sync yapar');
        }
      }
    } catch (err) {
      console.log('   ⚠️ Backend\'e bağlanılamadı:', err.message);
      console.log('   💡 Backend çalışırken kadrolar otomatik sync edilecek');
    }
  }

  // ================================
  // ÖZET
  // ================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   İŞLEM TAMAMLANDI                                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  if (dryRun) {
    console.log('\n⚠️ DRY-RUN: Hiçbir değişiklik yapılmadı');
    console.log('   Gerçek çalıştırma: node scripts/force-refresh-all-data.js');
  } else {
    console.log('\n✅ Tüm eski veriler temizlendi');
    console.log('💡 Backend her 12 saatte bir veya uygulama açıldığında güncel verileri çekecek');
    console.log('💡 Hemen güncellemek için backend\'i yeniden başlatın');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
