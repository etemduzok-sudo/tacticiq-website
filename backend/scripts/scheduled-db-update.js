// ============================================
// ZAMANLANMIŞ DB GÜNCELLEME
// ============================================
// 6 saat sonra başlar, yarın saat 12:00'a kadar çalışır
// Günlük 75,000 API sorgu limitini kullanır
// ============================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY = process.env.FOOTBALL_API_KEY;
const SEASON = 2025;

let apiCalls = 0;
const DAILY_API_LIMIT = 75000;
const API_BUFFER = 1000;
const MAX_API_CALLS = DAILY_API_LIMIT - API_BUFFER; // 74,000

// ============================================
// ZAMANLAMA KONTROLÜ
// ============================================

function shouldContinue() {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(12, 0, 0, 0); // Yarın saat 12:00
  
  // Eğer şu an 12:00'dan sonraysa, yarın 12:00'ı hedefle
  if (now.getHours() >= 12) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return now < targetTime;
}

// ============================================
// API HELPER
// ============================================

async function api(endpoint, params = {}) {
  if (apiCalls >= MAX_API_CALLS) {
    throw new Error('API limit reached');
  }
  
  if (!shouldContinue()) {
    throw new Error('Target time reached (12:00)');
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
      const now = new Date();
      console.log(`   [${now.toLocaleTimeString()}] API: ${apiCalls}/${MAX_API_CALLS}`);
    }
    
    await new Promise(r => setTimeout(r, 50));
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
// PHASE 1: RATING/SKILL (ÖNCELİK #1)
// ============================================

async function fillRatings(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: RATING/SKILL DOLDUR');
  console.log('='.repeat(70));
  
  // Rating'i olmayan takımları bul
  const { data: allSquads } = await supabase
    .from('team_squads')
    .select('team_id, players')
    .eq('season', SEASON);
  
  const teamsWithoutRating = [];
  
  for (const squad of (allSquads || [])) {
    if (!Array.isArray(squad.players)) continue;
    const hasRating = squad.players.some(p => p.rating !== undefined && p.rating !== null);
    if (!hasRating) {
      teamsWithoutRating.push(squad.team_id);
    }
  }
  
  // Takım bilgilerini al
  const { data: teams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, league')
    .in('api_football_id', teamsWithoutRating.slice(0, 1000)); // İlk 1000
  
  // Öncelik sırası
  const priorityLeagues = ['Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'Conference League'];
  
  const sortedTeams = (teams || []).sort((a, b) => {
    const aIdx = priorityLeagues.indexOf(a.league) !== -1 ? priorityLeagues.indexOf(a.league) : 999;
    const bIdx = priorityLeagues.indexOf(b.league) !== -1 ? priorityLeagues.indexOf(b.league) : 999;
    return aIdx - bIdx;
  });
  
  console.log(`Rating eksik takım: ${teamsWithoutRating.length}`);
  console.log(`İşlenecek: ${sortedTeams.length}`);
  
  let squadsUpdated = 0;
  let ratingsUpdated = 0;
  
  for (let i = 0; i < sortedTeams.length; i++) {
    if (!shouldContinue() || apiCalls >= maxCalls) break;
    
    const team = sortedTeams[i];
    
    try {
      let allPlayers = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 5 && apiCalls < maxCalls) {
        if (!shouldContinue()) break;
        
        const data = await api('/players', {
          team: team.api_football_id,
          season: SEASON,
          page
        });
        
        const players = data.response || [];
        allPlayers.push(...players);
        
        hasMore = data.paging?.current < data.paging?.total;
        page++;
      }
      
      if (allPlayers.length > 0) {
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
      
      if ((i + 1) % 50 === 0) {
        console.log(`   [${i + 1}/${sortedTeams.length}] Kadro: ${squadsUpdated}, Rating: ${ratingsUpdated}`);
      }
    } catch (e) {
      if (e.message.includes('Target time')) break;
    }
  }
  
  console.log(`✅ Rating: ${ratingsUpdated} oyuncu`);
  return { squadsUpdated, ratingsUpdated };
}

// ============================================
// PHASE 2: KADROLAR
// ============================================

async function fillSquads(maxCalls) {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: KADRO EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(70));
  
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
  
  console.log(`Eksik kadro: ${teamsWithoutSquad.length}`);
  
  let updated = 0;
  const teamsToProcess = teamsWithoutSquad.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (!shouldContinue() || apiCalls >= MAX_API_CALLS) break;
    
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
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} kadro`);
      }
    } catch (e) {
      if (e.message.includes('Target time')) break;
    }
  }
  
  console.log(`✅ Kadrolar: ${updated}`);
  return { updated };
}

// ============================================
// PHASE 3: COACH
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
  
  console.log(`Eksik coach: ${allTeams.length}`);
  
  let updated = 0;
  const teamsToProcess = allTeams.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (!shouldContinue() || apiCalls >= MAX_API_CALLS) break;
    
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
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} coach`);
      }
    } catch (e) {
      if (e.message.includes('Target time')) break;
    }
  }
  
  console.log(`✅ Coach: ${updated}`);
  return { updated };
}

// ============================================
// PHASE 4: RENKLER
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
  
  console.log(`Eksik renk: ${allTeams.length}`);
  
  let updated = 0;
  const teamsToProcess = allTeams.slice(0, maxCalls);
  
  for (let i = 0; i < teamsToProcess.length; i++) {
    if (!shouldContinue() || apiCalls >= MAX_API_CALLS) break;
    
    const team = teamsToProcess[i];
    
    try {
      const data = await api('/teams', { id: team.api_football_id });
      
      if (data.response?.[0]) {
        const colors = data.response[0].team?.colors?.player;
        
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
        console.log(`   [${i + 1}/${teamsToProcess.length}] ${updated} renk`);
      }
    } catch (e) {
      if (e.message.includes('Target time')) break;
    }
  }
  
  console.log(`✅ Renkler: ${updated}`);
  return { updated };
}

// ============================================
// MAIN
// ============================================

async function main() {
  const startTime = new Date();
  const targetTime = new Date();
  targetTime.setHours(12, 0, 0, 0);
  if (startTime.getHours() >= 12) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        ZAMANLANMIŞ DB GÜNCELLEME                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Başlangıç: ${startTime.toLocaleString('tr-TR')}                    ║`);
  console.log(`║  Hedef: ${targetTime.toLocaleString('tr-TR')} (12:00)              ║`);
  console.log(`║  API Limit: ${MAX_API_CALLS}                                        ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  const results = {};
  
  while (shouldContinue() && apiCalls < MAX_API_CALLS) {
    try {
      // Phase 1: Rating (60% bütçe)
      if (apiCalls < MAX_API_CALLS * 0.6) {
        results.ratings = await fillRatings(Math.floor(MAX_API_CALLS * 0.6));
        console.log(`   [Total API: ${apiCalls}]`);
      }
      
      // Phase 2: Kadrolar (20% bütçe)
      if (shouldContinue() && apiCalls < MAX_API_CALLS * 0.8) {
        results.squads = await fillSquads(Math.floor(MAX_API_CALLS * 0.2));
        console.log(`   [Total API: ${apiCalls}]`);
      }
      
      // Phase 3: Coach (10% bütçe)
      if (shouldContinue() && apiCalls < MAX_API_CALLS * 0.9) {
        results.coaches = await fillCoaches(Math.floor(MAX_API_CALLS * 0.1));
        console.log(`   [Total API: ${apiCalls}]`);
      }
      
      // Phase 4: Renkler (kalan)
      if (shouldContinue() && apiCalls < MAX_API_CALLS) {
        const remaining = MAX_API_CALLS - apiCalls;
        results.colors = await fillColors(remaining);
        console.log(`   [Total API: ${apiCalls}]`);
      }
      
      // Eğer hala zaman varsa ve eksikler varsa, tekrar dene
      if (!shouldContinue()) {
        console.log('\n⏰ Hedef saate ulaşıldı (12:00)');
        break;
      }
      
      // Kısa bekleme
      await new Promise(r => setTimeout(r, 5000));
      
    } catch (error) {
      if (error.message.includes('Target time')) {
        console.log('\n⏰ Hedef saate ulaşıldı');
        break;
      }
      console.error('Error:', error.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  
  const duration = Math.round((new Date() - startTime) / 1000 / 60);
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TAMAMLANDI                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Süre: ${duration} dakika                                              ║`);
  console.log(`║  API çağrısı: ${apiCalls.toString().padEnd(10)}                            ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Rating: ${(results.ratings?.ratingsUpdated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Kadro: ${(results.squads?.updated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Coach: ${(results.coaches?.updated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Renk: ${(results.colors?.updated || 0).toString().padEnd(10)}                             ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
