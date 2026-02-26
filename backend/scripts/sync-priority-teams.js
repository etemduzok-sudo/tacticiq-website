/**
 * ÖNCELİKLİ TAKIMLARIN VERİLERİNİ GÜNCELLE
 * Sadece büyük liglerdeki takımları sync eder (API limiti için)
 * - Türkiye, İngiltere, İspanya, İtalya, Almanya, Fransa
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENT_SEASON = 2025;
const DELAY_MS = 1000;

// Öncelikli ülkeler
const PRIORITY_COUNTRIES = ['Turkey', 'England', 'Spain', 'Italy', 'Germany', 'France'];

// Bilinen takım renkleri
const KNOWN_TEAM_COLORS = {
  // Türkiye
  611: ['#FFED00', '#00205B'], 645: ['#FDB913', '#C41E3A'], 549: ['#000000', '#FFFFFF'],
  564: ['#F26522', '#1E3A5F'], 607: ['#8B0000', '#00205B'], 3563: ['#00529F', '#FFFFFF'],
  3589: ['#1E3A5F', '#FFED00'], 1001: ['#00529F', '#FFFFFF'], 1005: ['#009639', '#FFFFFF'],
  // İtalya
  496: ['#000000', '#FFFFFF'], 489: ['#AC1E2E', '#000000'], 505: ['#0066B3', '#000000'],
  492: ['#87CEEB', '#FFFFFF'], 497: ['#7B1818', '#FFC425'], 487: ['#6CC3E0', '#FFFFFF'],
  500: ['#0E274D', '#F0E130'], 502: ['#AC1E2D', '#FFFFFF'],
  // İspanya
  541: ['#FFFFFF', '#00529F'], 529: ['#A50044', '#004D98'], 530: ['#D81E05', '#FFFFFF'],
  536: ['#005BBB', '#FFFFFF'], 533: ['#004170', '#FFC72C'], 532: ['#003DA5', '#F2A900'],
  548: ['#005BBB', '#FFFFFF'], 531: ['#004D98', '#FFFFFF'],
  // İngiltere
  50: ['#6CABDD', '#FFFFFF'], 33: ['#DA020E', '#FFE500'], 40: ['#C8102E', '#FFFFFF'],
  42: ['#EF0107', '#FFFFFF'], 49: ['#034694', '#FFFFFF'], 47: ['#132257', '#FFFFFF'],
  66: ['#003399', '#FFFFFF'], 34: ['#241F20', '#FFFFFF'], 48: ['#D00027', '#003DA5'],
  51: ['#00A2E8', '#FFFFFF'], 45: ['#6C1D45', '#99D6EA'], 52: ['#EE2737', '#FFFFFF'],
  63: ['#FF0000', '#FFFFFF'], 35: ['#004D98', '#FFFFFF'], 65: ['#C41E3A', '#FFFFFF'],
  36: ['#D40027', '#000000'], 39: ['#FDB913', '#000000'],
  // Almanya
  157: ['#DC052D', '#FFFFFF'], 165: ['#FDE100', '#000000'], 173: ['#E32221', '#FFFFFF'],
  169: ['#005DAA', '#FFFFFF'], 168: ['#000000', '#FFFFFF'], 172: ['#1E5CB3', '#FFFFFF'],
  // Fransa
  85: ['#004170', '#DA291C'], 80: ['#ED1C24', '#FFFFFF'], 81: ['#1D428A', '#FFFFFF'],
  79: ['#E30613', '#FFFFFF'], 84: ['#E30613', '#004170'], 91: ['#ED1C24', '#000000'],
};

async function syncTeam(teamId, teamName) {
  const result = { ok: false, squad: 0, coach: null, colors: null };
  
  try {
    // Paralel olarak kadro, coach ve takım bilgisi çek
    const [squadData, coachData, teamInfoData] = await Promise.all([
      footballApi.getTeamSquad(teamId).catch(() => ({ response: [] })),
      footballApi.getTeamCoach(teamId).catch(() => ({ response: [] })),
      footballApi.getTeamInfo(teamId).catch(() => ({ response: [] })),
    ]);
    
    // Kadro
    let players = [];
    let teamData = { id: teamId, name: teamName };
    
    if (squadData.response && squadData.response.length > 0) {
      const firstItem = squadData.response[0];
      if (firstItem.players && Array.isArray(firstItem.players)) {
        players = firstItem.players;
        teamData = firstItem.team || teamData;
      }
    }
    
    if (players.length > 0) {
      await supabase.from('team_squads').upsert({
        team_id: teamId,
        season: CURRENT_SEASON,
        team_name: teamData.name || teamName,
        team_data: teamData,
        players: players.map(p => ({
          id: p.id, name: p.name, age: p.age, number: p.number, position: p.position, photo: p.photo,
        })),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_id,season' });
      result.squad = players.length;
    }
    
    // static_teams güncelle
    const updateData = { last_updated: new Date().toISOString() };
    
    // Coach
    if (coachData.response && coachData.response.length > 0) {
      const { selectActiveCoach } = require('../utils/selectActiveCoach');
      const selected = selectActiveCoach(coachData.response, teamId);
      if (selected) {
        updateData.coach = selected.name;
        updateData.coach_api_id = selected.id;
        result.coach = selected.name;
      }
    }
    
    // Renkler
    let colors = null;
    if (teamInfoData.response && teamInfoData.response.length > 0) {
      try {
        colors = await footballApi.getTeamColors(teamId, teamInfoData.response[0]);
      } catch (e) {}
    }
    if (!colors || colors.length < 2 || colors[0] === '#333333') {
      colors = KNOWN_TEAM_COLORS[teamId] || null;
    }
    if (colors && colors.length >= 2) {
      updateData.colors = JSON.stringify(colors);
      updateData.colors_primary = colors[0];
      updateData.colors_secondary = colors[1];
      result.colors = colors;
    }
    
    // DB güncelle
    if (Object.keys(updateData).length > 1) {
      await supabase.from('static_teams').update(updateData).eq('api_football_id', teamId);
    }
    
    result.ok = true;
    return result;
  } catch (err) {
    return { ...result, error: err.message };
  }
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     ÖNCELİKLİ TAKIMLAR SYNC (TR + Top 5 Ligler)                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Öncelikli ülkelerdeki takımları al
  const { data: teams, error } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country')
    .in('country', PRIORITY_COUNTRIES)
    .not('api_football_id', 'is', null);
  
  if (error) {
    console.error('❌ DB hatası:', error.message);
    return;
  }
  
  // Unique takımlar
  const uniqueTeams = Array.from(new Map(teams.map(t => [t.api_football_id, t])).values());
  
  console.log(`📋 ${uniqueTeams.length} takım bulundu`);
  console.log(`📊 Tahmini API kullanımı: ~${uniqueTeams.length * 3} çağrı`);
  console.log('');
  
  const stats = { total: uniqueTeams.length, ok: 0, fail: 0, coaches: 0, colors: 0, squads: 0 };
  const startTime = Date.now();
  
  for (let i = 0; i < uniqueTeams.length; i++) {
    const team = uniqueTeams[i];
    const result = await syncTeam(team.api_football_id, team.name);
    
    if (result.ok) {
      stats.ok++;
      if (result.coach) stats.coaches++;
      if (result.colors) stats.colors++;
      if (result.squad > 0) stats.squads++;
      
      const icon = result.coach ? '✅' : '⚠️';
      console.log(`${icon} [${i+1}/${uniqueTeams.length}] ${team.name}: ${result.squad} oyuncu${result.coach ? ', Coach: ' + result.coach : ''}`);
    } else {
      stats.fail++;
      console.log(`❌ [${i+1}/${uniqueTeams.length}] ${team.name}: ${result.error || 'Hata'}`);
    }
    
    // Her 50 takımda ilerleme
    if ((i + 1) % 50 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((elapsed / (i + 1)) * (uniqueTeams.length - i - 1));
      console.log(`\n📊 İlerleme: ${i+1}/${uniqueTeams.length} | Coach: ${stats.coaches} | Kalan: ~${Math.round(remaining/60)} dk\n`);
    }
    
    if (i < uniqueTeams.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                      SYNC TAMAMLANDI                             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Toplam: ${stats.total} | Başarılı: ${stats.ok} | Başarısız: ${stats.fail}`.padEnd(67) + '║');
  console.log(`║  Kadro: ${stats.squads} | Coach: ${stats.coaches} | Renkler: ${stats.colors}`.padEnd(67) + '║');
  console.log(`║  Süre: ${Math.round(totalTime/60)} dakika`.padEnd(67) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
