#!/usr/bin/env node
// Roma (AS Roma) kadro + teknik direktör – sadece DB'den kontrol. API çağrısı YOK.
// Kullanım: node scripts/check-roma-db.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { supabase } = require('../config/supabase');

const ROMA_API_ID = 497; // API-Football team id for AS Roma
const SEASON = 2025;

async function main() {
  if (!supabase) {
    console.error('❌ Supabase yapılandırılmamış. .env içinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('🔴 ROMA (AS Roma) – DB kontrolü (API kullanılmıyor)');
  console.log('═'.repeat(60));

  // 1. Teknik direktör – static_teams
  const { data: teamRow, error: teamErr } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach, coach_api_id, last_updated')
    .eq('api_football_id', ROMA_API_ID)
    .maybeSingle();

  if (teamErr) {
    console.error('❌ static_teams okuma hatası:', teamErr.message);
  } else if (!teamRow) {
    console.log('\n⚠️ Roma (api_football_id=497) static_teams tablosunda bulunamadı.');
    console.log('   Favori takım eklediysen static_teams’e eklenmesi gerekebilir (sync/seed).');
  } else {
    console.log('\n📋 Takım (static_teams):');
    console.log('   Takım adı:', teamRow.name || '(yok)');
    console.log('   Teknik direktör:', teamRow.coach || '(yok)');
    console.log('   Coach API id:', teamRow.coach_api_id ?? '(yok)');
    console.log('   Son güncelleme:', teamRow.last_updated || '(yok)');
    const coachOk = teamRow.coach && String(teamRow.coach).trim().length > 0;
    console.log('   API ile uyum:', coachOk ? '✅ Coach alanı dolu (API’deki gibi isim beklenir)' : '⚠️ Coach boş – API’den çekilip kaydedilmemiş olabilir');
  }

  // 2. Kadro – team_squads
  const { data: squadRow, error: squadErr } = await supabase
    .from('team_squads')
    .select('team_id, team_name, season, players, updated_at')
    .eq('team_id', ROMA_API_ID)
    .eq('season', SEASON)
    .maybeSingle();

  if (squadErr) {
    console.error('\n❌ team_squads okuma hatası:', squadErr.message);
  } else if (!squadRow) {
    console.log('\n⚠️ Roma kadrosu (team_id=497, season=' + SEASON + ') team_squads tablosunda bulunamadı.');
    console.log('   Kadro sync çalıştırıldığında veya /api/teams/497/squad ilk kez çağrıldığında yazılır.');
  } else {
    const players = Array.isArray(squadRow.players) ? squadRow.players : [];
    console.log('\n📋 Kadro (team_squads):');
    console.log('   Takım:', squadRow.team_name || '(yok)');
    console.log('   Sezon:', squadRow.season);
    console.log('   Oyuncu sayısı:', players.length);
    console.log('   Son güncelleme:', squadRow.updated_at || '(yok)');
    if (players.length > 0) {
      const byPos = {};
      players.forEach((p) => {
        const pos = (p.position || 'Unknown').trim() || 'Unknown';
        byPos[pos] = (byPos[pos] || 0) + 1;
      });
      console.log('   Pozisyona göre:', Object.entries(byPos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', '));
      console.log('   İlk 5 oyuncu:', players.slice(0, 5).map((p) => p.name || p.id).join(', '));
    }
    console.log('   API ile uyum:', players.length > 0 ? '✅ Kadro dolu (API’deki players listesi ile uyumlu olmalı)' : '⚠️ Oyuncu listesi boş');
  }

  console.log('\n' + '═'.repeat(60));
  console.log('Özet: Roma’nın coach ve squad verisi yukarıda. API çağrısı yapılmadı.');
  console.log('Canlı maç testi için backend’te dakikada 1 API çağrısı sınırı aktif.');
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
