#!/usr/bin/env node
/**
 * DB Durum Kontrol Script'i
 * Şu ana kadar çekilen veriyi gösterir
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

async function checkDBStatus() {
  try {
    console.log('📊 DB Durumu Kontrol Ediliyor...\n');

    // 1. Takım sayısı
    const { data: squads, error } = await supabase
      .from('team_squads')
      .select('team_id, team_name, players, team_data, season')
      .eq('season', 2025);

    if (error) {
      console.error('❌ Hata:', error.message);
      return;
    }

    // İstatistikler
    const totalTeams = squads.length;
    const teamsWithSquads = squads.filter(s => s.players && Array.isArray(s.players) && s.players.length > 0).length;
    
    let totalPlayers = 0;
    let playersWithRatings = 0;
    let playersWithAllAttributes = 0;
    let totalCoaches = 0;

    squads.forEach(squad => {
      if (squad.players && Array.isArray(squad.players)) {
        totalPlayers += squad.players.length;
        
        squad.players.forEach(player => {
          if (player.rating && player.rating > 0) {
            playersWithRatings++;
          }
          
          // Tüm yetenekler var mı?
          if (player.pace && player.shooting && player.passing && 
              player.dribbling && player.defending && player.physical) {
            playersWithAllAttributes++;
          }
        });
      }
      
      if (squad.team_data?.coach) {
        totalCoaches++;
      }
    });

    // Hedefler (14 lig için tahmini)
    const TARGET_LEAGUES = 14;
    const TARGET_TEAMS = 200; // ~14-20 takım/lig × 14 lig
    const TARGET_PLAYERS = 5000; // ~25-30 oyuncu/takım × 200 takım
    const TARGET_PLAYERS_WITH_RATINGS = 4500; // %90'ında rating olmalı

    // Yüzdeler
    const teamsPercent = Math.round((totalTeams / TARGET_TEAMS) * 100);
    const playersPercent = Math.round((totalPlayers / TARGET_PLAYERS) * 100);
    const ratingsPercent = Math.round((playersWithRatings / TARGET_PLAYERS_WITH_RATINGS) * 100);
    const attributesPercent = totalPlayers > 0 ? Math.round((playersWithAllAttributes / totalPlayers) * 100) : 0;

    // Sonuçları göster
    console.log('═'.repeat(70));
    console.log('📊 DB VERİ DURUMU - 2025-2026 SEZONU');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📋 TAKIMLAR:');
    console.log(`   Toplam Takım: ${totalTeams} / ${TARGET_TEAMS} (${teamsPercent}%)`);
    console.log(`   Kadro Olan Takım: ${teamsWithSquads}`);
    console.log('');
    console.log('👥 OYUNCULAR:');
    console.log(`   Toplam Oyuncu: ${totalPlayers} / ${TARGET_PLAYERS} (${playersPercent}%)`);
    console.log(`   Rating'li Oyuncu: ${playersWithRatings} / ${TARGET_PLAYERS_WITH_RATINGS} (${ratingsPercent}%)`);
    console.log(`   Tüm Yetenekleri Olan: ${playersWithAllAttributes} (${attributesPercent}%)`);
    console.log('');
    console.log('👔 TEKNİK DİREKTÖRLER:');
    console.log(`   Toplam: ${totalCoaches}`);
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    
    // Genel ilerleme
    const overallProgress = Math.round((teamsPercent + playersPercent + ratingsPercent) / 3);
    console.log(`🎯 GENEL İLERLEME: ${overallProgress}%`);
    console.log('');
    
    // Detaylı istatistikler
    if (squads.length > 0) {
      console.log('📈 DETAYLI İSTATİSTİKLER:');
      console.log(`   Ortalama Oyuncu/Takım: ${Math.round(totalPlayers / teamsWithSquads)}`);
      console.log(`   Rating Oranı: ${totalPlayers > 0 ? Math.round((playersWithRatings / totalPlayers) * 100) : 0}%`);
      console.log(`   Tam Yetenek Oranı: ${totalPlayers > 0 ? Math.round((playersWithAllAttributes / totalPlayers) * 100) : 0}%`);
      console.log('');
    }

    // Lig bazında dağılım (eğer team_data'da league bilgisi varsa)
    const leagueCounts = {};
    squads.forEach(squad => {
      const league = squad.team_data?.league || 'Bilinmiyor';
      if (!leagueCounts[league]) {
        leagueCounts[league] = { teams: 0, players: 0 };
      }
      leagueCounts[league].teams++;
      if (squad.players) {
        leagueCounts[league].players += squad.players.length;
      }
    });

    if (Object.keys(leagueCounts).length > 0) {
      console.log('🏆 LİG BAZINDA DAĞILIM:');
      Object.entries(leagueCounts)
        .sort((a, b) => b[1].players - a[1].players)
        .slice(0, 10)
        .forEach(([league, stats]) => {
          console.log(`   ${league}: ${stats.teams} takım, ${stats.players} oyuncu`);
        });
      console.log('');
    }

    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

checkDBStatus().then(() => process.exit(0));
