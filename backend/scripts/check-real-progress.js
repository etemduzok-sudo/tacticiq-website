#!/usr/bin/env node
/**
 * Gerçek İlerleme Kontrol Script'i
 * Sadece yeni script'le çekilen verileri sayar
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRealProgress() {
  try {
    console.log('📊 Gerçek İlerleme Kontrol Ediliyor...\n');

    // İlerleme dosyasını kontrol et
    const progressFile = path.join(__dirname, '..', 'data', 'sync-squads-progress.json');
    const resultFile = path.join(__dirname, '..', 'data', 'sync-squads-result.json');
    
    let scriptProgress = null;
    let scriptResult = null;
    
    if (fs.existsSync(progressFile)) {
      scriptProgress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    }
    
    if (fs.existsSync(resultFile)) {
      scriptResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    }

    // Script istatistikleri
    console.log('═'.repeat(70));
    console.log('📊 SCRIPT İSTATİSTİKLERİ');
    console.log('═'.repeat(70));
    
    if (scriptProgress) {
      const stats = scriptProgress.stats;
      console.log(`Lig: ${scriptProgress.lastProcessedIndex + 1}/14`);
      console.log(`API Kullanımı: ${stats.apiRequests}/7300`);
      console.log(`İşlenen Takım: ${stats.teamsProcessed}`);
      console.log(`Kaydedilen Kadro: ${stats.squadsProcessed}`);
      console.log(`İşlenen Oyuncu: ${stats.playersProcessed}`);
      console.log(`Rating'li Oyuncu: ${stats.playersWithRatings}`);
      console.log(`Teknik Direktör: ${stats.coachesProcessed}`);
      console.log(`Son Güncelleme: ${new Date(scriptProgress.updatedAt).toLocaleString('tr-TR')}`);
    } else {
      console.log('⚠️ Script henüz ilerleme kaydetmemiş');
    }
    
    console.log('');
    
    // DB'den gerçek verileri çek (sadece son 24 saat içinde güncellenmiş)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentSquads, error } = await supabase
      .from('team_squads')
      .select('team_id, team_name, players, team_data, updated_at')
      .eq('season', 2025)
      .gte('updated_at', oneDayAgo.toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ DB Hata:', error.message);
      return;
    }

    // Analiz
    const recentTeams = recentSquads.length;
    const recentTeamsWithSquads = recentSquads.filter(s => s.players && Array.isArray(s.players) && s.players.length > 0).length;
    
    let recentStats = {
      totalPlayers: 0,
      playersWithRatings: 0,
      playersWithAllAttributes: 0,
      totalCoaches: 0,
    };

    recentSquads.forEach(squad => {
      if (squad.players && Array.isArray(squad.players)) {
        recentStats.totalPlayers += squad.players.length;
        
        squad.players.forEach(player => {
          if (player.rating && player.rating > 0) recentStats.playersWithRatings++;
          
          if (player.pace && player.shooting && player.passing && 
              player.dribbling && player.defending && player.physical && player.rating) {
            recentStats.playersWithAllAttributes++;
          }
        });
      }
      
      if (squad.team_data?.coach) {
        recentStats.totalCoaches++;
      }
    });

    // Hedefler (14 lig için gerçekçi)
    const TARGET_LEAGUES = 14;
    const TARGET_TEAMS = 250; // ~18 takım/lig × 14 lig
    const TARGET_PLAYERS = 6250; // ~25 oyuncu/takım × 250 takım
    const TARGET_PLAYERS_FULL = 6000; // Tüm yetenekleri + rating'i olan
    const TARGET_COACHES = 250;

    console.log('═'.repeat(70));
    console.log('📊 SON 24 SAATTE ÇEKİLEN VERİLER');
    console.log('═'.repeat(70));
    console.log(`Takımlar: ${recentTeams} / ${TARGET_TEAMS} (${Math.round((recentTeams/TARGET_TEAMS)*100)}%)`);
    console.log(`Kadro Olan: ${recentTeamsWithSquads}`);
    console.log(`Oyuncular: ${recentStats.totalPlayers} / ${TARGET_PLAYERS} (${Math.round((recentStats.totalPlayers/TARGET_PLAYERS)*100)}%)`);
    console.log(`Rating'li: ${recentStats.playersWithRatings} (${Math.round((recentStats.playersWithRatings/recentStats.totalPlayers)*100)}%)`);
    console.log(`Tam Veri (Yetenek+Rating): ${recentStats.playersWithAllAttributes} / ${TARGET_PLAYERS_FULL} (${Math.round((recentStats.playersWithAllAttributes/TARGET_PLAYERS_FULL)*100)}%)`);
    console.log(`Teknik Direktörler: ${recentStats.totalCoaches} / ${TARGET_COACHES} (${Math.round((recentStats.totalCoaches/TARGET_COACHES)*100)}%)`);
    console.log('');
    
    // Genel ilerleme
    const teamsPercent = Math.min(100, Math.round((recentTeams / TARGET_TEAMS) * 100));
    const playersPercent = Math.min(100, Math.round((recentStats.totalPlayers / TARGET_PLAYERS) * 100));
    const fullDataPercent = Math.min(100, Math.round((recentStats.playersWithAllAttributes / TARGET_PLAYERS_FULL) * 100));
    const coachesPercent = Math.min(100, Math.round((recentStats.totalCoaches / TARGET_COACHES) * 100));
    
    const overallProgress = Math.round((teamsPercent + playersPercent + fullDataPercent + coachesPercent) / 4);
    
    console.log('═'.repeat(70));
    console.log(`🎯 GENEL İLERLEME: ${overallProgress}%`);
    console.log('═'.repeat(70));
    console.log('');
    console.log('📝 NOT: Sadece son 24 saatte güncellenmiş veriler sayılmıştır.');
    console.log('      Eski veriler (önceki script\'lerden) dahil edilmemiştir.');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkRealProgress().then(() => process.exit(0));
