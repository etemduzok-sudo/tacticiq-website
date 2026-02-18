// ============================================
// TÜM EKSİKLERİ BUGÜN TAMAMLA
// ============================================
// 75,000 API limitini tam kullanarak
// Tüm eksik verileri doldur
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
const MAX_API_CALLS = 75000; // Tam limit

let apiCalls = 0;
const stats = {
  coaches: 0,
  colors: 0,
  squads: 0,
  ratings: 0,
  matches: 0,
  national: 0,
  errors: 0
};

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
// PAGINATION HELPER
// ============================================

async function getAllTeams(condition = {}) {
  let all = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    let query = supabase.from('static_teams').select('api_football_id, name, league');
    
    Object.entries(condition).forEach(([key, value]) => {
      if (value === null) {
        query = query.is(key, null);
      } else {
        query = query.eq(key, value);
      }
    });
    
    const { data } = await query.range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  return all;
}

// ============================================
// PHASE 1: RATING + KADRO (ÖNCELİK - 40,000 çağrı)
// ============================================

async function fillRatingsAndSquads() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: RATING + KADRO (ÖNCELİK)');
  console.log('='.repeat(70));
  
  // Tüm takımları al
  const allTeams = await getAllTeams();
  
  // Öncelik sırası: Büyük ligler önce
  const priorityLeagues = ['Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'Conference League'];
  
  const sortedTeams = allTeams.sort((a, b) => {
    const aIdx = priorityLeagues.indexOf(a.league) !== -1 ? priorityLeagues.indexOf(a.league) : 999;
    const bIdx = priorityLeagues.indexOf(b.league) !== -1 ? priorityLeagues.indexOf(b.league) : 999;
    return aIdx - bIdx;
  });
  
  console.log(`Toplam takım: ${sortedTeams.length}`);
  console.log(`API bütçesi: 40,000 çağrı`);
  
  const maxCalls = 40000;
  let processed = 0;
  
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
      
      while (hasMore && page <= 5 && apiCalls < maxCalls) {
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
        
        const withRating = processedPlayers.filter(p => p.rating).length;
        stats.squads++;
        stats.ratings += withRating;
        processed++;
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`   [${i + 1}/${sortedTeams.length}] Kadro: ${stats.squads}, Rating: ${stats.ratings} oyuncu`);
      }
      
    } catch (e) {
      stats.errors++;
    }
  }
  
  console.log(`✅ Kadrolar: ${stats.squads} güncellendi`);
  console.log(`✅ Rating: ${stats.ratings} oyuncu`);
  return processed;
}

// ============================================
// PHASE 2: COACH (15,000 çağrı)
// ============================================

async function fillCoaches() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: COACH EKSİKLERİ');
  console.log('='.repeat(70));
  
  const teams = await getAllTeams({ coach: null });
  console.log(`Eksik coach: ${teams.length} takım`);
  
  const maxCalls = 15000;
  let updated = 0;
  
  for (let i = 0; i < teams.length; i++) {
    if (apiCalls >= MAX_API_CALLS || (apiCalls - 40000) >= maxCalls) break;
    
    const team = teams[i];
    
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
          
          stats.coaches++;
          updated++;
        }
      }
      
      if ((i + 1) % 200 === 0) {
        console.log(`   [${i + 1}/${teams.length}] ${updated} coach güncellendi`);
      }
    } catch (e) {
      stats.errors++;
    }
  }
  
  console.log(`✅ Coach: ${updated} güncellendi`);
  return updated;
}

// ============================================
// PHASE 3: RENKLER (10,000 çağrı)
// ============================================

async function fillColors() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3: RENK EKSİKLERİ');
  console.log('='.repeat(70));
  
  const teams = await getAllTeams({ colors_primary: null });
  console.log(`Eksik renk: ${teams.length} takım`);
  
  const maxCalls = 10000;
  let updated = 0;
  
  for (let i = 0; i < teams.length; i++) {
    if (apiCalls >= MAX_API_CALLS || (apiCalls - 55000) >= maxCalls) break;
    
    const team = teams[i];
    
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
          
          stats.colors++;
          updated++;
        }
      }
      
      if ((i + 1) % 200 === 0) {
        console.log(`   [${i + 1}/${teams.length}] ${updated} renk güncellendi`);
      }
    } catch (e) {
      stats.errors++;
    }
  }
  
  console.log(`✅ Renkler: ${updated} güncellendi`);
  return updated;
}

// ============================================
// PHASE 4: MAÇLAR (5,000 çağrı)
// ============================================

async function fillMatches() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 4: MAÇLAR');
  console.log('='.repeat(70));
  
  let matchesUpdated = 0;
  const maxCalls = 5000;
  
  // Bugün + 30 gün ileri
  const today = new Date();
  
  for (let i = 0; i <= 30; i++) {
    if (apiCalls >= MAX_API_CALLS || (apiCalls - 65000) >= maxCalls) break;
    
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const data = await api('/fixtures', { date: dateStr });
      const fixtures = data.response || [];
      
      for (const fixture of fixtures) {
        await supabase.from('matches').upsert({
          id: fixture.fixture.id,
          fixture_date: fixture.fixture.date,
          status: fixture.fixture.status.short,
          status_long: fixture.fixture.status.long,
          elapsed: fixture.fixture.status.elapsed,
          home_team_id: fixture.teams.home.id,
          away_team_id: fixture.teams.away.id,
          home_score: fixture.goals.home,
          away_score: fixture.goals.away,
          league_id: fixture.league.id,
          league_name: fixture.league.name,
          league_country: fixture.league.country,
          season: fixture.league.season,
          round: fixture.league.round,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        matchesUpdated++;
      }
      
      if (fixtures.length > 0) {
        console.log(`   ${dateStr}: ${fixtures.length} maç`);
      }
    } catch (e) {
      // Skip
    }
  }
  
  stats.matches = matchesUpdated;
  console.log(`✅ Maçlar: ${matchesUpdated} güncellendi`);
  return matchesUpdated;
}

// ============================================
// PHASE 5: MİLLİ TAKIMLAR (5,000 çağrı)
// ============================================

async function fillNationalTeams() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 5: MİLLİ TAKIMLAR');
  console.log('='.repeat(70));
  
  const teams = await getAllTeams({ country: 'World' });
  const teamsWithoutCoach = teams.filter(t => {
    // Coach kontrolü için ayrı sorgu gerekli
    return true; // Tümünü kontrol edelim
  });
  
  console.log(`Milli takım: ${teams.length}`);
  
  const maxCalls = 5000;
  let updated = 0;
  
  for (let i = 0; i < teams.length; i++) {
    if (apiCalls >= MAX_API_CALLS || (apiCalls - 70000) >= maxCalls) break;
    
    const team = teams[i];
    
    try {
      const data = await api('/coachs', { team: team.api_football_id });
      
      if (data.response?.length > 0) {
        await supabase
          .from('static_teams')
          .update({
            coach: data.response[0].name,
            coach_api_id: data.response[0].id,
            last_updated: new Date().toISOString()
          })
          .eq('api_football_id', team.api_football_id);
        
        stats.national++;
        updated++;
      }
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`✅ Milli takımlar: ${updated} coach güncellendi`);
  return updated;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           TÜM EKSİKLERİ BUGÜN TAMAMLA                            ║');
  console.log('║           API Limit: 75,000 (TAM KULLANIM)                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // Phase 1: Rating + Kadro (40,000)
    await fillRatingsAndSquads();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 2: Coach (15,000)
    await fillCoaches();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 3: Renkler (10,000)
    await fillColors();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 4: Maçlar (5,000)
    await fillMatches();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 5: Milli Takımlar (5,000)
    await fillNationalTeams();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TAMAMLANDI                                 ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Süre: ${duration} dakika                                              ║`);
  console.log(`║  Toplam API çağrısı: ${apiCalls.toString().padEnd(10)}                            ║`);
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Kadro güncellenen: ${stats.squads.toString().padEnd(10)}                            ║`);
  console.log(`║  Rating (oyuncu): ${stats.ratings.toString().padEnd(10)}                             ║`);
  console.log(`║  Coach güncellenen: ${stats.coaches.toString().padEnd(10)}                            ║`);
  console.log(`║  Renk güncellenen: ${stats.colors.toString().padEnd(10)}                             ║`);
  console.log(`║  Maç güncellenen: ${stats.matches.toString().padEnd(10)}                             ║`);
  console.log(`║  Milli takım: ${stats.national.toString().padEnd(10)}                                 ║`);
  console.log(`║  Hatalar: ${stats.errors.toString().padEnd(10)}                                 ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
