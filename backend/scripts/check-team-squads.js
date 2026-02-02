#!/usr/bin/env node
// Team Squads tablosunu kontrol et

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function check() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Team Squads Tablosu Analizi                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 1. Tablo var mı kontrol et
  const { data: squads, error } = await supabase
    .from('team_squads')
    .select('team_id, team_name, season, updated_at')
    .order('updated_at', { ascending: false });
  
  if (error) {
    if (error.message.includes('does not exist')) {
      console.log('❌ team_squads tablosu MEVCUT DEĞİL!');
      console.log('   Tabloyu oluşturmak için: supabase/migrations/create_team_squads.sql');
    } else {
      console.error('❌ DB Error:', error.message);
    }
    return;
  }
  
  console.log(`📊 TOPLAM KADRO KAYDI: ${squads.length}\n`);
  
  if (squads.length === 0) {
    console.log('⚠️ Henüz kadro verisi yok!');
    console.log('   Backend çalışırken favorilere takım ekleyince otomatik çekilir.');
    return;
  }
  
  // 2. Takım bazlı özet
  console.log('🏆 KADROSU OLAN TAKIMLAR:');
  console.log('─'.repeat(60));
  
  const byTeam = {};
  for (const squad of squads) {
    if (!byTeam[squad.team_id]) {
      byTeam[squad.team_id] = {
        name: squad.team_name,
        seasons: [],
        lastUpdate: squad.updated_at
      };
    }
    byTeam[squad.team_id].seasons.push(squad.season);
  }
  
  const sortedTeams = Object.entries(byTeam).sort((a, b) => 
    new Date(b[1].lastUpdate) - new Date(a[1].lastUpdate)
  );
  
  for (const [teamId, info] of sortedTeams.slice(0, 30)) {
    const seasons = info.seasons.join(', ');
    const lastUpdate = new Date(info.lastUpdate).toLocaleDateString('tr-TR');
    console.log(`   ${teamId.toString().padStart(5)}: ${(info.name || 'Unknown').padEnd(25)} | Sezon: ${seasons} | Son: ${lastUpdate}`);
  }
  
  if (sortedTeams.length > 30) {
    console.log(`   ... ve ${sortedTeams.length - 30} takım daha`);
  }
  
  // 3. Türk takımlarının kadro durumu
  const turkishTeamIds = [611, 645, 549, 998, 564, 3563, 1005, 607, 1002, 1004, 994, 1001, 1007, 3575, 3603, 3573, 996, 3588, 3583];
  
  console.log('\n\n🇹🇷 TÜRK TAKIMLARI KADRO DURUMU:');
  console.log('─'.repeat(60));
  
  for (const tid of turkishTeamIds) {
    const squad = byTeam[tid];
    if (squad) {
      console.log(`   ✅ ${tid}: ${squad.name}`);
    } else {
      // Takım adını static_teams'den al
      const { data: teamData } = await supabase
        .from('static_teams')
        .select('name')
        .eq('api_football_id', tid)
        .single();
      console.log(`   ❌ ${tid}: ${teamData?.name || 'Bilinmiyor'} - KADRO YOK`);
    }
  }
  
  // 4. Özet
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 ÖZET:');
  console.log('═'.repeat(60));
  console.log(`   Kadrosu olan takım: ${Object.keys(byTeam).length}`);
  console.log(`   Toplam kadro kaydı: ${squads.length}`);
  
  const turkishWithSquad = turkishTeamIds.filter(id => byTeam[id]).length;
  console.log(`   Türk takımları kadrosu: ${turkishWithSquad}/${turkishTeamIds.length}`);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
