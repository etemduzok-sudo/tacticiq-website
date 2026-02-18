// ============================================
// TÜM EKSİK VERİLERİ DOLDUR
// ============================================
// Coach, Renkler, Kadrolar, Rating/Skill
// API Limiti: 75,000/gün - Tamamını kullan
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
const MAX_API_CALLS = 70000; // 75000'den 5000 buffer bırak

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
    
    // Rate limit - her 10 çağrıda bir durum göster
    if (apiCalls % 500 === 0) {
      console.log(`   [API: ${apiCalls}/${MAX_API_CALLS}]`);
    }
    
    await new Promise(r => setTimeout(r, 80)); // Rate limit
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
// PHASE 1: COACH EKSİKLERİ (~2000 takım)
// ============================================

async function fillMissingCoaches() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1: COACH EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(60));
  
  // Tüm eksik coach'ları al (pagination ile)
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
  const teams = allTeams;
  
  console.log(`Eksik coach: ${teams?.length || 0} takım`);
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < (teams?.length || 0); i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
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
          
          updated++;
        }
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`   [${i + 1}/${teams.length}] ${updated} coach güncellendi`);
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Coach: ${updated} güncellendi, ${errors} hata`);
  return { updated, errors };
}

// ============================================
// PHASE 2: RENK EKSİKLERİ (~4000 takım)
// ============================================

async function fillMissingColors() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: RENK EKSİKLERİNİ DOLDUR');
  console.log('='.repeat(60));
  
  // Tüm eksik renkleri al (pagination ile)
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
  const teams = allTeams;
  
  console.log(`Eksik renk: ${teams?.length || 0} takım`);
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < (teams?.length || 0); i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
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
          
          updated++;
        }
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`   [${i + 1}/${teams.length}] ${updated} renk güncellendi`);
      }
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Renkler: ${updated} güncellendi, ${errors} hata`);
  return { updated, errors };
}

// ============================================
// PHASE 3: KADRO + RATING (EN ÖNEMLİ)
// ============================================

async function fillSquadsAndRatings() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: KADRO + RATING DOLDUR');
  console.log('='.repeat(60));
  
  // Tüm takımları al (pagination ile)
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
  
  // Mevcut kadroları al (pagination ile)
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
  
  const existingSet = new Set(existingSquads?.map(s => s.team_id) || []);
  
  // Öncelik sırası: Büyük ligler önce
  const priorityLeagues = ['Süper Lig', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  
  const sortedTeams = (allTeams || []).sort((a, b) => {
    const aIdx = priorityLeagues.indexOf(a.league) !== -1 ? priorityLeagues.indexOf(a.league) : 999;
    const bIdx = priorityLeagues.indexOf(b.league) !== -1 ? priorityLeagues.indexOf(b.league) : 999;
    return aIdx - bIdx;
  });
  
  console.log(`Toplam takım: ${sortedTeams.length}`);
  console.log(`Mevcut kadro: ${existingSet.size}`);
  
  let squadsUpdated = 0;
  let ratingsUpdated = 0;
  let playersWithRating = 0;
  let errors = 0;
  
  for (let i = 0; i < sortedTeams.length; i++) {
    if (apiCalls >= MAX_API_CALLS) {
      console.log(`   API limit reached at team ${i}`);
      break;
    }
    
    const team = sortedTeams[i];
    
    try {
      // /players endpoint - rating dahil detaylı veri
      let allPlayers = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore && page <= 5) { // Max 5 sayfa
        if (apiCalls >= MAX_API_CALLS) break;
        
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
        // Oyuncuları işle
        const processedPlayers = allPlayers.map(p => {
          const stats = p.statistics?.[0] || {};
          const rating = stats.games?.rating ? parseFloat(stats.games.rating) : null;
          
          if (rating) playersWithRating++;
          
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
            // RATING
            rating: rating,
            // İSTATİSTİKLER
            appearances: stats.games?.appearences || 0,
            lineups: stats.games?.lineups || 0,
            minutes: stats.games?.minutes || 0,
            goals: stats.goals?.total || 0,
            assists: stats.goals?.assists || 0,
            // DETAYLI İSTATİSTİKLER
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
            // KALECI İSTATİSTİKLERİ
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
      
      if ((i + 1) % 50 === 0) {
        console.log(`   [${i + 1}/${sortedTeams.length}] Kadro: ${squadsUpdated}, Rating: ${ratingsUpdated} oyuncu`);
      }
      
    } catch (e) {
      errors++;
    }
  }
  
  console.log(`✅ Kadrolar: ${squadsUpdated} güncellendi`);
  console.log(`✅ Rating: ${ratingsUpdated} oyuncu`);
  console.log(`   Hatalar: ${errors}`);
  
  return { squadsUpdated, ratingsUpdated, playersWithRating, errors };
}

// ============================================
// PHASE 4: MACLAR (Gelecek maçlar)
// ============================================

async function fillMatches() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 4: MAÇLARI GÜNCELLE');
  console.log('='.repeat(60));
  
  let matchesUpdated = 0;
  
  // Bugün + 30 gün ileri
  const today = new Date();
  
  for (let i = 0; i <= 30; i++) {
    if (apiCalls >= MAX_API_CALLS) break;
    
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
      
      console.log(`   ${dateStr}: ${fixtures.length} maç`);
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`✅ Maçlar: ${matchesUpdated} güncellendi`);
  return { matchesUpdated };
}

// ============================================
// PHASE 5: MİLLİ TAKIMLAR
// ============================================

async function fillNationalTeams() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 5: MİLLİ TAKIMLAR');
  console.log('='.repeat(60));
  
  const { data: teams } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .eq('country', 'World')
    .is('coach', null);
  
  console.log(`Eksik milli takım coach: ${teams?.length || 0}`);
  
  let updated = 0;
  
  for (const team of (teams || [])) {
    if (apiCalls >= MAX_API_CALLS) break;
    
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
        
        updated++;
      }
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`✅ Milli takımlar: ${updated} coach güncellendi`);
  return { updated };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║           TÜM EKSİK VERİLERİ DOLDUR                               ║');
  console.log('║           API Limit: 70,000 (75,000 - buffer)                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // Phase 1: Coach
    results.coaches = await fillMissingCoaches();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 2: Renkler
    results.colors = await fillMissingColors();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 3: Kadro + Rating (EN ÖNEMLİ - kalan API'yi kullan)
    results.squads = await fillSquadsAndRatings();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 4: Maçlar
    results.matches = await fillMatches();
    console.log(`   [Total API calls: ${apiCalls}]`);
    
    // Phase 5: Milli Takımlar
    results.national = await fillNationalTeams();
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
  console.log(`║  Coach güncellenen: ${(results.coaches?.updated || 0).toString().padEnd(10)}                            ║`);
  console.log(`║  Renk güncellenen: ${(results.colors?.updated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Kadro güncellenen: ${(results.squads?.squadsUpdated || 0).toString().padEnd(10)}                            ║`);
  console.log(`║  Rating (oyuncu): ${(results.squads?.ratingsUpdated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Maç güncellenen: ${(results.matches?.matchesUpdated || 0).toString().padEnd(10)}                             ║`);
  console.log(`║  Milli takım: ${(results.national?.updated || 0).toString().padEnd(10)}                                 ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
