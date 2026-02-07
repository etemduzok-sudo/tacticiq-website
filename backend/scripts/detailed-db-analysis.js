#!/usr/bin/env node
/**
 * Detaylı DB Analiz Script'i
 * Mevcut veriyi analiz eder ve eksikleri gösterir
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

async function analyzeDB() {
  try {
    console.log('📊 Detaylı DB Analizi Yapılıyor...\n');

    // Sadece 2025 sezonu ve son 7 gün içinde güncellenmiş kadroları çek
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: squads, error } = await supabase
      .from('team_squads')
      .select('team_id, team_name, players, team_data, season, updated_at')
      .eq('season', 2025)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Hata:', error.message);
      return;
    }

    // Analiz
    const totalTeams = squads.length;
    const teamsWithSquads = squads.filter(s => s.players && Array.isArray(s.players) && s.players.length > 0).length;
    
    let stats = {
      totalPlayers: 0,
      playersWithRatings: 0,
      playersWithPace: 0,
      playersWithShooting: 0,
      playersWithPassing: 0,
      playersWithDribbling: 0,
      playersWithDefending: 0,
      playersWithPhysical: 0,
      playersWithAllAttributes: 0,
      playersWithNoAttributes: 0,
      totalCoaches: 0,
    };

    squads.forEach(squad => {
      if (squad.players && Array.isArray(squad.players)) {
        stats.totalPlayers += squad.players.length;
        
        squad.players.forEach(player => {
          if (player.rating && player.rating > 0) stats.playersWithRatings++;
          if (player.pace) stats.playersWithPace++;
          if (player.shooting) stats.playersWithShooting++;
          if (player.passing) stats.playersWithPassing++;
          if (player.dribbling) stats.playersWithDribbling++;
          if (player.defending) stats.playersWithDefending++;
          if (player.physical) stats.playersWithPhysical++;
          
          // Tüm yetenekler var mı?
          if (player.pace && player.shooting && player.passing && 
              player.dribbling && player.defending && player.physical && player.rating) {
            stats.playersWithAllAttributes++;
          }
          
          // Hiç yetenek yok mu?
          if (!player.pace && !player.shooting && !player.passing && 
              !player.dribbling && !player.defending && !player.physical && !player.rating) {
            stats.playersWithNoAttributes++;
          }
        });
      }
      
      if (squad.team_data?.coach) {
        stats.totalCoaches++;
      }
    });

    // Sonuçları göster
    console.log('═'.repeat(70));
    console.log('📊 DETAYLI DB ANALİZİ - 2025-2026 SEZONU');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📋 TAKIMLAR:');
    console.log(`   Toplam: ${totalTeams}`);
    console.log(`   Kadro Olan: ${teamsWithSquads} (${Math.round((teamsWithSquads/totalTeams)*100)}%)`);
    console.log('');
    console.log('👥 OYUNCULAR:');
    console.log(`   Toplam: ${stats.totalPlayers}`);
    console.log(`   Rating'li: ${stats.playersWithRatings} (${Math.round((stats.playersWithRatings/stats.totalPlayers)*100)}%)`);
    console.log('');
    console.log('⚽ YETENEKLER:');
    console.log(`   Hız (Pace): ${stats.playersWithPace} (${Math.round((stats.playersWithPace/stats.totalPlayers)*100)}%)`);
    console.log(`   Şut (Shooting): ${stats.playersWithShooting} (${Math.round((stats.playersWithShooting/stats.totalPlayers)*100)}%)`);
    console.log(`   Pas (Passing): ${stats.playersWithPassing} (${Math.round((stats.playersWithPassing/stats.totalPlayers)*100)}%)`);
    console.log(`   Dribling: ${stats.playersWithDribbling} (${Math.round((stats.playersWithDribbling/stats.totalPlayers)*100)}%)`);
    console.log(`   Defans: ${stats.playersWithDefending} (${Math.round((stats.playersWithDefending/stats.totalPlayers)*100)}%)`);
    console.log(`   Fizik: ${stats.playersWithPhysical} (${Math.round((stats.playersWithPhysical/stats.totalPlayers)*100)}%)`);
    console.log('');
    console.log('✅ TAM VERİ:');
    console.log(`   Tüm Yetenekleri + Rating'i Olan: ${stats.playersWithAllAttributes} (${Math.round((stats.playersWithAllAttributes/stats.totalPlayers)*100)}%)`);
    console.log(`   Hiç Yeteneği Olmayan: ${stats.playersWithNoAttributes} (${Math.round((stats.playersWithNoAttributes/stats.totalPlayers)*100)}%)`);
    console.log('');
    console.log('👔 TEKNİK DİREKTÖRLER:');
    console.log(`   Toplam: ${stats.totalCoaches} / ${totalTeams} (${Math.round((stats.totalCoaches/totalTeams)*100)}%)`);
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    
    // İlerleme hesaplama - Gerçekçi hedefler
    // 14 lig × ortalama 18 takım = ~250 takım
    // 250 takım × ortalama 25 oyuncu = ~6,250 oyuncu
    const TARGET_TEAMS = 250;
    const TARGET_PLAYERS = 6250;
    const TARGET_PLAYERS_FULL = 6000; // Tüm yetenekleri + rating'i olan
    const TARGET_COACHES = 250;
    
    const teamsPercent = Math.min(100, Math.round((totalTeams / TARGET_TEAMS) * 100));
    const playersPercent = Math.min(100, Math.round((stats.totalPlayers / TARGET_PLAYERS) * 100));
    const fullDataPercent = Math.min(100, Math.round((stats.playersWithAllAttributes / TARGET_PLAYERS_FULL) * 100));
    const coachesPercent = Math.min(100, Math.round((stats.totalCoaches / TARGET_COACHES) * 100));
    
    console.log(`🎯 VERİ ÇEKME İLERLEMESİ (Son 7 Gün - 2025 Sezonu):`);
    console.log(`   Takımlar: ${teamsPercent}% (${totalTeams}/${TARGET_TEAMS})`);
    console.log(`   Oyuncular: ${playersPercent}% (${stats.totalPlayers}/${TARGET_PLAYERS})`);
    console.log(`   Tam Veri (Yetenek+Rating): ${fullDataPercent}% (${stats.playersWithAllAttributes}/${TARGET_PLAYERS_FULL})`);
    console.log(`   Teknik Direktörler: ${coachesPercent}% (${stats.totalCoaches}/${TARGET_COACHES})`);
    console.log('');
    console.log(`📊 GENEL İLERLEME: ${Math.round((teamsPercent + playersPercent + fullDataPercent + coachesPercent) / 4)}%`);
    console.log('');
    console.log('⚠️ NOT: Sadece son 7 gün içinde güncellenmiş veriler sayılmıştır.');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

analyzeDB().then(() => process.exit(0));
