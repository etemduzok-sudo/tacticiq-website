/**
 * MEVCUT TÜM TAKIMLARI GÜNCELLE
 * 
 * DB'de zaten 2648 takım var. Bu script hepsinin:
 * - Kadrolarını (son maç kadrosundan)
 * - Teknik direktörlerini
 * güncelleyecek.
 * 
 * Daha verimli: Yeni takım aramak yerine mevcut takımları güncelle
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

const CURRENT_SEASON = 2025;
const MAX_API_CALLS = 70000;

const stats = {
  apiCalls: 0,
  teamsProcessed: 0,
  squadsUpdated: 0,
  coachesUpdated: 0,
  skipped: 0,
  errors: 0,
  startTime: Date.now(),
};

async function apiRequest(endpoint, params) {
  if (stats.apiCalls >= MAX_API_CALLS) {
    throw new Error('API limit');
  }
  stats.apiCalls++;
  return await footballApi.apiRequest(endpoint, params);
}

async function updateTeam(team) {
  try {
    // Son maçı bul
    const fixturesData = await apiRequest('/fixtures', { 
      team: team.api_football_id, 
      season: CURRENT_SEASON, 
      last: 1 
    });
    
    if (!fixturesData.response || fixturesData.response.length === 0) {
      stats.skipped++;
      return { ok: false, reason: 'no_match' };
    }
    
    const matchId = fixturesData.response[0].fixture.id;
    
    // Kadroyu çek
    const lineupData = await apiRequest('/fixtures/lineups', { fixture: matchId });
    
    if (!lineupData.response) {
      stats.skipped++;
      return { ok: false, reason: 'no_lineup' };
    }
    
    const teamLineup = lineupData.response.find(l => l.team.id === team.api_football_id);
    if (!teamLineup) {
      stats.skipped++;
      return { ok: false, reason: 'not_in_lineup' };
    }
    
    // Oyuncuları topla
    const players = [];
    let coach = teamLineup.coach?.name || null;
    
    const allPlayers = [...(teamLineup.startXI || []), ...(teamLineup.substitutes || [])];
    
    allPlayers.forEach(p => {
      const pos = p.player.pos;
      players.push({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        position: pos === 'G' ? 'Goalkeeper' : 
                 pos === 'D' ? 'Defender' :
                 pos === 'M' ? 'Midfielder' :
                 pos === 'F' ? 'Attacker' : (pos || 'Unknown')
      });
    });
    
    if (players.length === 0) {
      stats.skipped++;
      return { ok: false, reason: 'empty' };
    }
    
    // Kadroyu kaydet
    await supabase.from('team_squads').upsert({
      team_id: team.api_football_id,
      season: CURRENT_SEASON,
      team_name: team.name,
      team_data: { id: team.api_football_id, name: team.name, coach },
      players: players,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,season' });
    
    stats.squadsUpdated++;
    
    // Coach güncelle
    if (coach) {
      await supabase
        .from('static_teams')
        .update({ coach, last_updated: new Date().toISOString() })
        .eq('api_football_id', team.api_football_id);
      stats.coachesUpdated++;
    }
    
    return { ok: true, players: players.length, coach };
    
  } catch (err) {
    stats.errors++;
    return { ok: false, reason: err.message };
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     MEVCUT TÜM TAKIMLARIN KADRO/COACH GÜNCELLEMESİ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}`);
  console.log('');
  
  // Kadrosu eksik veya eski olan takımları al
  const { data: teams, error } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach, last_updated')
    .order('api_football_id');
  
  if (error || !teams) {
    console.error('❌ Takımlar alınamadı:', error?.message);
    return;
  }
  
  console.log(`📋 ${teams.length} takım bulundu\n`);
  
  // Kadrosu olmayan takımları öncelikle işle
  const { data: squads } = await supabase
    .from('team_squads')
    .select('team_id')
    .eq('season', CURRENT_SEASON);
  
  const teamsWithSquad = new Set(squads?.map(s => s.team_id) || []);
  
  // Önce kadrosu olmayanlar, sonra diğerleri
  const teamsWithoutSquad = teams.filter(t => !teamsWithSquad.has(t.api_football_id));
  const teamsWithExistingSquad = teams.filter(t => teamsWithSquad.has(t.api_football_id));
  
  console.log(`📊 Kadrosu olmayan: ${teamsWithoutSquad.length}`);
  console.log(`📊 Kadrosu olan: ${teamsWithExistingSquad.length}\n`);
  
  // Önce kadrosu olmayanları güncelle
  console.log('📋 KADROSU OLMAYAN TAKIMLAR GÜNCELLENİYOR...\n');
  
  for (let i = 0; i < teamsWithoutSquad.length; i++) {
    const team = teamsWithoutSquad[i];
    
    if (stats.apiCalls >= MAX_API_CALLS - 50) {
      console.log('\n⚠️ API limit, durduruluyor...');
      break;
    }
    
    stats.teamsProcessed++;
    const result = await updateTeam(team);
    
    if (result.ok) {
      console.log(`[${i + 1}/${teamsWithoutSquad.length}] ✅ ${team.name}: ${result.players} oyuncu, Coach: ${result.coach || '-'}`);
    }
    
    // Her 100 takımda özet
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      console.log(`\n📊 ${i + 1}/${teamsWithoutSquad.length}, Kadro: ${stats.squadsUpdated}, Coach: ${stats.coachesUpdated}, API: ${stats.apiCalls}, ${elapsed}dk\n`);
    }
  }
  
  // Sonra mevcut kadroları güncelle (coach eksik olanlar)
  const teamsWithoutCoach = teamsWithExistingSquad.filter(t => !t.coach);
  
  if (teamsWithoutCoach.length > 0 && stats.apiCalls < MAX_API_CALLS - 100) {
    console.log(`\n📋 COACH'U OLMAYAN ${teamsWithoutCoach.length} TAKIM GÜNCELLENİYOR...\n`);
    
    for (let i = 0; i < teamsWithoutCoach.length; i++) {
      const team = teamsWithoutCoach[i];
      
      if (stats.apiCalls >= MAX_API_CALLS - 50) {
        console.log('\n⚠️ API limit, durduruluyor...');
        break;
      }
      
      stats.teamsProcessed++;
      const result = await updateTeam(team);
      
      if (result.ok && result.coach) {
        console.log(`[${i + 1}/${teamsWithoutCoach.length}] ✅ ${team.name}: Coach: ${result.coach}`);
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`\n📊 ${i + 1}/${teamsWithoutCoach.length}, Coach: ${stats.coachesUpdated}, API: ${stats.apiCalls}\n`);
      }
    }
  }
  
  // ÖZET
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    GÜNCELLEME TAMAMLANDI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Süre: ${elapsed} dakika`);
  console.log(`API çağrısı: ${stats.apiCalls}`);
  console.log(`Takım işlendi: ${stats.teamsProcessed}`);
  console.log(`Kadro güncellendi: ${stats.squadsUpdated}`);
  console.log(`Coach güncellendi: ${stats.coachesUpdated}`);
  console.log(`Atlanan (maç yok): ${stats.skipped}`);
  console.log(`Hata: ${stats.errors}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
