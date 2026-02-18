// ============================================
// TÜM EKSİK VERİLERİ TAMAMLA - OTOMATIK YENİDEN BAŞLATMA
// ============================================
// Script durursa otomatik yeniden başlatır
// Bugünkü tüm API stokunu kullanarak DB'yi tamamlar
// ============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { exec } = require('child_process');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY = process.env.FOOTBALL_API_KEY;
const SEASON = 2025;

let apiCalls = 0;
const MAX_API_CALLS = 74000; // 75,000'den 1,000 buffer

// ============================================
// API HELPER
// ============================================

async function api(endpoint, params = {}) {
  if (apiCalls >= MAX_API_CALLS) {
    throw new Error('API limit reached');
  }
  
  apiCalls++;
  
  try {
    const response = await axios.get(`https://v3.football.api-sports.io${endpoint}`, {
      params,
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    if (apiCalls % 1000 === 0) {
      console.log(`   [API: ${apiCalls}/${MAX_API_CALLS}]`);
    }
    
    await new Promise(r => setTimeout(r, 50)); // Rate limit
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('   Rate limited, waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      return api(endpoint, params);
    }
    throw error;
  }
}

// ============================================
// PHASE 1: RATING/SKILL (ÖNCELİK #1 - 60,000 API)
// ============================================

async function fillRatings(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: RATING/SKILL DOLDUR (ÖNCELİK #1)');
  console.log('='.repeat(70));
  
  // Tüm takımları al (pagination)
  let allTeams = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name, league')
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allTeams = allTeams.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  // Öncelik sırası: Büyük ligler önce
  const priorityLeagues = ['Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'Conference League'];
  
  const sortedTeams = allTeams.sort((a, b) => {
    const aIdx = priorityLeagues.indexOf(a.league) !== -1 ? priorityLeagues.indexOf(a.league) : 999;
    const bIdx = priorityLeagues.indexOf(b.league) !== -1 ? priorityLeagues.indexOf(b.league) : 999;
    return aIdx - bIdx;
  });
  
  console.log(`Toplam takım: ${sortedTeams.length}`);
  console.log(`API bütçesi: ${maxCalls}`);
  
  let squadsUpdated = 0;
  let ratingsUpdated = 0;
  let errors = 0;
  
  for (let i = 0; i < sortedTeams.length; i++) {
    if (apiCalls >= maxCalls) {
      console.log(`   API limit reached at team ${i}`);
      break;
    }
    
    const team = sortedTeams[i];
    
    try {
      // /players endpoint - rating dahil
      let allPlayers = [];
      let page = 1;
      let hasMore = true;
      let teamCalls = 0;
      
      while (hasMore && page <= 5 && teamCalls < 10) {
        if (apiCalls >= maxCalls) break;
        
        const data = await api('/players', {
          team: team.api_football_id,
          season: SEASON,
          page
        });
        
        teamCalls++;
        const players = data.response || [];
        allPlayers.push(...players);
        
        hasMore = data.paging?.current < data.paging?.total;
        page++;
      }
      
      if (allPlayers.length > 0) {
        // Oyuncuları işle
        const processedPlayers = allPlayers.map(p => {
          const stats = p.statistics?.[0] || {};
          const rating = stats.games?.rating ? parseFloat(stats.games.rating) : null;
          
          return {
            id: p.player.id,
            name: p.player.name,
            firstname: p.player.firstname,
            lastname: p.player.lastname,
            age: p.player.age,
            nationality: p.player.nationality,
            height: p.player.height,
            weight: p.player.weight,
            photo: p.player.photo,
            number: stats.games?.number || null,
            position: stats.games?.position || p.player.position,
            rating: rating,
            appearances: stats.games?.appearences || 0,
            lineups: stats.games?.lineups || 0,
            minutes: stats.games?.minutes || 0,
            goals: stats.goals?.total || 0,
            assists: stats.goals?.assists || 0,
            shots_total: stats.shots?.total || 0,
            shots_on: stats.shots?.on || 0,
            passes_total: stats.passes?.total || 0,
            passes_accuracy: stats.passes?.accuracy || null,
            tackles: stats.tackles?.total || 0,
            duels_won: stats.duels?.won || 0,
            dribbles_success: stats.dribbles?.success || 0,
            fouls_drawn: stats.fouls?.drawn || 0,
            fouls_committed: stats.fouls?.committed || 0,
            yellow_cards: stats.cards?.yellow || 0,
            red_cards: stats.cards?.red || 0,
            penalty_scored: stats.penalty?.scored || 0,
            penalty_missed: stats.penalty?.missed || 0,
            saves: stats.goals?.saves || 0,
            conceded: stats.goals?.conceded || 0
          };
        });
        
        // Upsert
        await supabase
          .from('team_squads')
          .upsert({
            team_id: team.api_football_id,
            season: SEASON,
            players: processedPlayers,
            updated_at: new Date().toISOString()
          }, { onConflict: 'team_id,season' });
        
        squadsUpdated++;
        ratingsUpdated += processedPlayers.filter(p => p.rating).length;
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`   [${i + 1}/${sortedTeams.length}] Kadro: ${squadsUpdated}, Rating: ${ratingsUpdated} oyuncu`);
      }
      
    } catch (e) {
      errors++;
      if (errors % 50 === 0) {
        console.log(`   Hatalar: ${errors}`);
      }
    }
  }
  
  console.log(`✅ Kadrolar: ${squadsUpdated} güncellendi`);
  console.log(`✅ Rating: ${ratingsUpdated} oyuncu`);
  console.log(`   Hatalar: ${errors}`);
  
  return { squadsUpdated, ratingsUpdated, errors };
}

// ============================================
// PHASE 2: KADROLAR (10,000 API)
// ============================================

async function fillSquads(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: KADRO EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(70));
  
  // Tüm takımları al
  let allTeams = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id')
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allTeams = allTeams.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  // Mevcut kadroları al
  let existingSquads = [];
  from = 0;
  while (true) {
    const { data } = await supabase
      .from('team_squads')
      .select('team_id')
      .eq('season', SEASON)
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    existingSquads = existingSquads.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  const existingSet = new Set(existingSquads.map(s => s.team_id));
  const teamsWithoutSquad = allTeams.filter(t => !existingSet.has(t.api_football_id));
  
  console.log(`Eksik kadro: ${teamsWithoutSquad.length} takım`);
  
  let updated = 0;
  let errors = 0;
  const teamsToProcess = teamsWithoutSquad.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
    const team = teamsToProcess[i];
    
    try {
      const data = await api('/players/squads', { team: team.api_football_id });
      
      if (data.response?.[0]?.players) {
        const players = data.response[0].players.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          number: p.number,
          position: p.position,
          photo: p.photo
        }));
        
        await supabase
          .from('team_squads')
          .upsert({
            team_id: team.api_football_id,
            season: SEASON,
            players,
            updated_at: new Date().toISOString()
          }, { onConflict: 'team_id,season' });
        
        updated++;
      }
      
      if ((i + 1) % 200 === 0) {
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} kadro güncellendi`);
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Kadrolar: ${updated} güncellendi, ${errors} hata`);
  return { updated, errors };
}

// ============================================
// PHASE 3: COACH (2,000 API)
// ============================================

async function fillCoaches(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3: COACH EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(70));
  
  let allTeams = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .is('coach', null)
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allTeams = allTeams.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  console.log(`Eksik coach: ${allTeams.length} takım`);
  
  let updated = 0;
  let errors = 0;
  const teamsToProcess = allTeams.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
    const team = teamsToProcess[i];
    
    try {
      const data = await api('/coachs', { team: team.api_football_id });
      
      if (data.response?.length > 0) {
        const activeCoach = data.response.find(c => 
          c.career?.some(car => car.team?.id == team.api_football_id && !car.end)
        ) || data.response[0];
        
        if (activeCoach) {
          await supabase
            .from('static_teams')
            .update({
              coach: activeCoach.name,
              coach_api_id: activeCoach.id,
              last_updated: new Date().toISOString()
            })
            .eq('api_football_id', team.api_football_id);
          
          updated++;
        }
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} coach güncellendi`);
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Coach: ${updated} güncellendi, ${errors} hata`);
  return { updated, errors };
}

// ============================================
// PHASE 4: RENKLER (2,000 API)
// ============================================

async function fillColors(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 4: RENK EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(70));
  
  let allTeams = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('static_teams')
      .select('api_football_id, name')
      .is('colors_primary', null)
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allTeams = allTeams.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  console.log(`Eksik renk: ${allTeams.length} takım`);
  
  let updated = 0;
  let errors = 0;
  const teamsToProcess = allTeams.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
    const team = teamsToProcess[i];
    
    try {
      const data = await api('/teams', { id: team.api_football_id });
      
      if (data.response?.[0]) {
        const info = data.response[0];
        const colors = info.team?.colors?.player;
        
        if (colors) {
          await supabase
            .from('static_teams')
            .update({
              colors_primary: colors.primary || null,
              colors_secondary: colors.secondary || null,
              last_updated: new Date().toISOString()
            })
            .eq('api_football_id', team.api_football_id);
          
          updated++;
        }
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} renk güncellendi`);
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Renkler: ${updated} güncellendi, ${errors} hata`);
  return { updated, errors };
}

// ============================================
// MAIN WITH AUTO-RESTART
// ============================================

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        TÜM EKSİK VERİLERİ TAMAMLA - OTOMATIK YENİDEN BAŞLATMA    ║');
  console.log('║        API Limit: 74,000 (75,000 - buffer)                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // Phase 1: Rating/Skill (60,000 API - EN ÖNEMLİ)
    console.log('\n🎯 ÖNCELİK #1: Rating/Skill');
    results.ratings = await fillRatings(60000);
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 2: Kadrolar (10,000 API)
    console.log('\n🎯 ÖNCELİK #2: Kadrolar');
    results.squads = await fillSquads(10000);
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 3: Coach (2,000 API)
    console.log('\n🎯 ÖNCELİK #3: Coach');
    results.coaches = await fillCoaches(2000);
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 4: Renkler (kalan API)
    console.log('\n🎯 ÖNCELİK #4: Renkler');
    const remaining = MAX_API_CALLS - apiCalls;
    results.colors = await fillColors(remaining);
    console.log(`   [Total API calls: ${apiCalls}]`);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    // Hata durumunda script'i yeniden başlat
    console.log('\n⚠️ Script hata verdi, 30 saniye sonra yeniden başlatılıyor...');
    await new Promise(r => setTimeout(r, 30000));
    return main(); // Yeniden başlat
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TAMAMLANDI                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Süre: ${duration} dakika                                              ║`);
  console.log(`║  Toplam API çağrısı: ${apiCalls.toString().padEnd(10)}                            ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Rating (oyuncu): ${(results.ratings?.ratingsUpdated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Kadro güncellenen: ${(results.squads?.updated || 0).toString().padEnd(10)}                            ║`);
  console.log(`║  Coach güncellenen: ${(results.coaches?.updated || 0).toString().padEnd(10)}                            ║`);
  console.log(`║  Renk güncellenen: ${(results.colors?.updated || 0).toString().padEnd(10)}                             ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  // Eğer hala API stoku varsa ve eksikler varsa, yeniden başlat
  if (apiCalls < MAX_API_CALLS - 1000) {
    console.log('\n🔄 Kalan API stoku var, eksikleri kontrol edip devam ediyor...');
    await new Promise(r => setTimeout(r, 5000));
    return main(); // Yeniden başlat
  }
}

// Auto-restart wrapper
async function runWithAutoRestart() {
  while (true) {
    try {
      await main();
      console.log('\n✅ Tüm işlemler tamamlandı!');
      break;
    } catch (error) {
      console.error('\n❌ Script durdu:', error.message);
      console.log('⏳ 60 saniye sonra yeniden başlatılıyor...');
      await new Promise(r => setTimeout(r, 60000));
      console.log('🔄 Yeniden başlatılıyor...');
    }
  }
}

runWithAutoRestart().then(() => process.exit(0)).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
