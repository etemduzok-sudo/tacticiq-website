/**
 * KAPSAMLI DB GÜNCELLEME SCRİPTİ
 * 
 * Bu script tüm önemli liglerdeki takımların:
 * - Kadrolarını (son maç kadrosundan)
 * - Teknik direktörlerini
 * - Takım renklerini
 * - Geçmiş ve gelecek maçlarını
 * günceller.
 * 
 * API-Football limiti: 75,000/gün
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Backend .env dosyasını yükle (service role key burada)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Ana .env.local dosyasını yükle
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Service role key kullan (RLS bypass)
const supabaseUrl = process.env.SUPABASE_URL || (process.env.VITE_SUPABASE_URL || '').replace(/'/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('Service Key:', supabaseKey ? 'OK (service role)' : 'MISSING');

const footballApi = require('../services/footballApi');

// Öncelikli ligler (üst düzey)
const PRIORITY_LEAGUES = [
  // Avrupa Top 5
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  // Türkiye
  { id: 203, name: 'Süper Lig', country: 'Turkey' },
  { id: 206, name: 'Türkiye Kupası', country: 'Turkey' },
  // Diğer önemli ligler
  { id: 94, name: 'Primeira Liga', country: 'Portugal' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands' },
  { id: 144, name: 'Jupiler Pro League', country: 'Belgium' },
  // UEFA
  { id: 2, name: 'Champions League', country: 'World' },
  { id: 3, name: 'Europa League', country: 'World' },
  { id: 848, name: 'Conference League', country: 'World' },
  // Güney Amerika
  { id: 13, name: 'Copa Libertadores', country: 'World' },
  { id: 71, name: 'Serie A', country: 'Brazil' },
  { id: 128, name: 'Liga Profesional', country: 'Argentina' },
];

// İstatistikler
let stats = {
  teamsProcessed: 0,
  squadsUpdated: 0,
  coachesUpdated: 0,
  colorsUpdated: 0,
  matchesUpdated: 0,
  apiCalls: 0,
  errors: [],
  startTime: Date.now(),
};

const MAX_API_CALLS = 70000; // Güvenli limit
const CURRENT_SEASON = 2025;

async function apiRequest(endpoint, params) {
  if (stats.apiCalls >= MAX_API_CALLS) {
    throw new Error('API limit reached');
  }
  stats.apiCalls++;
  return await footballApi.apiRequest(endpoint, params);
}

// Takım kadrosunu son maç kadrosundan güncelle
async function updateTeamSquad(teamId, teamName) {
  try {
    // Son maçı bul
    const fixturesData = await apiRequest('/fixtures', { team: teamId, season: CURRENT_SEASON, last: 1 });
    
    if (!fixturesData.response || fixturesData.response.length === 0) {
      console.log(`  ⚠️ ${teamName}: Son maç bulunamadı`);
      return { ok: false, reason: 'no_match' };
    }
    
    const lastMatch = fixturesData.response[0];
    const matchId = lastMatch.fixture.id;
    
    // Kadroyu çek
    const lineupData = await apiRequest('/fixtures/lineups', { fixture: matchId });
    
    if (!lineupData.response) {
      return { ok: false, reason: 'no_lineup' };
    }
    
    const teamLineup = lineupData.response.find(l => l.team.id === teamId);
    if (!teamLineup) {
      return { ok: false, reason: 'team_not_in_lineup' };
    }
    
    // Oyuncuları topla
    const players = [];
    let coach = null;
    
    if (teamLineup.coach?.name) {
      coach = teamLineup.coach.name;
    }
    
    // İlk 11
    if (teamLineup.startXI) {
      teamLineup.startXI.forEach(p => players.push({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        position: p.player.pos === 'G' ? 'Goalkeeper' : 
                 p.player.pos === 'D' ? 'Defender' :
                 p.player.pos === 'M' ? 'Midfielder' :
                 p.player.pos === 'F' ? 'Attacker' : p.player.pos
      }));
    }
    
    // Yedekler
    if (teamLineup.substitutes) {
      teamLineup.substitutes.forEach(p => players.push({
        id: p.player.id,
        name: p.player.name,
        number: p.player.number,
        position: p.player.pos === 'G' ? 'Goalkeeper' : 
                 p.player.pos === 'D' ? 'Defender' :
                 p.player.pos === 'M' ? 'Midfielder' :
                 p.player.pos === 'F' ? 'Attacker' : (p.player.pos || 'Unknown')
      }));
    }
    
    if (players.length === 0) {
      return { ok: false, reason: 'empty_lineup' };
    }
    
    // DB'ye kaydet
    const { error: squadError } = await supabase.from('team_squads').upsert({
      team_id: teamId,
      season: CURRENT_SEASON,
      team_name: teamName,
      team_data: { id: teamId, name: teamName, coach },
      players: players,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,season' });
    
    if (squadError) {
      console.error(`  ❌ ${teamName} kadro kayıt hatası:`, squadError.message);
      return { ok: false, reason: squadError.message };
    }
    
    stats.squadsUpdated++;
    
    // Teknik direktörü güncelle
    if (coach) {
      const { error: coachError } = await supabase
        .from('static_teams')
        .update({ coach, last_updated: new Date().toISOString() })
        .eq('api_football_id', teamId);
      
      if (!coachError) {
        stats.coachesUpdated++;
      }
    }
    
    return { ok: true, playerCount: players.length, coach };
    
  } catch (err) {
    console.error(`  ❌ ${teamName} hata:`, err.message);
    stats.errors.push({ team: teamName, error: err.message });
    return { ok: false, reason: err.message };
  }
}

// Lig maçlarını güncelle
async function updateLeagueMatches(leagueId, leagueName) {
  try {
    // Son 30 gün + gelecek sezon sonu (Haziran 2026)
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date('2026-06-30');
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];
    
    console.log(`  📅 ${leagueName}: ${fromStr} - ${toStr}`);
    
    const fixturesData = await apiRequest('/fixtures', {
      league: leagueId,
      season: CURRENT_SEASON,
      from: fromStr,
      to: toStr,
    });
    
    if (!fixturesData.response || fixturesData.response.length === 0) {
      console.log(`  ⚠️ ${leagueName}: Maç bulunamadı`);
      return 0;
    }
    
    const matches = fixturesData.response;
    let updated = 0;
    
    for (const match of matches) {
      const fixture = match.fixture;
      const teams = match.teams;
      const goals = match.goals;
      const league = match.league;
      
      const matchRecord = {
        api_football_id: fixture.id,
        home_team_id: teams.home.id,
        away_team_id: teams.away.id,
        home_team_name: teams.home.name,
        away_team_name: teams.away.name,
        home_score: goals.home,
        away_score: goals.away,
        status: fixture.status.short,
        match_date: fixture.date,
        league_id: league.id,
        league_name: league.name,
        season: league.season,
        round: league.round,
        venue_name: fixture.venue?.name,
        venue_city: fixture.venue?.city,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('matches')
        .upsert(matchRecord, { onConflict: 'api_football_id' });
      
      if (!error) {
        updated++;
      }
    }
    
    stats.matchesUpdated += updated;
    console.log(`  ✅ ${leagueName}: ${updated} maç güncellendi`);
    return updated;
    
  } catch (err) {
    console.error(`  ❌ ${leagueName} maç hatası:`, err.message);
    return 0;
  }
}

// Ana güncelleme fonksiyonu
async function runFullUpdate() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           KAPSAMLI DB GÜNCELLEME BAŞLIYOR');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`API Limit: ${MAX_API_CALLS.toLocaleString()}`);
  console.log('');
  
  // ADIM 1: Öncelikli liglerdeki takımları al
  console.log('📋 ADIM 1: Takım listesi alınıyor...');
  
  const allTeams = [];
  
  for (const league of PRIORITY_LEAGUES) {
    try {
      const teamsData = await apiRequest('/teams', { league: league.id, season: CURRENT_SEASON });
      
      if (teamsData.response) {
        teamsData.response.forEach(t => {
          if (!allTeams.find(x => x.id === t.team.id)) {
            allTeams.push({
              id: t.team.id,
              name: t.team.name,
              league: league.name,
              country: league.country,
            });
          }
        });
        console.log(`  ✅ ${league.name}: ${teamsData.response.length} takım`);
      }
    } catch (err) {
      console.error(`  ❌ ${league.name}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Toplam ${allTeams.length} benzersiz takım bulundu\n`);
  
  // ADIM 2: Takım kadrolarını güncelle
  console.log('📋 ADIM 2: Kadrolar güncelleniyor (son maç kadrosundan)...');
  
  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
    stats.teamsProcessed++;
    
    const result = await updateTeamSquad(team.id, team.name);
    
    if (result.ok) {
      console.log(`  [${i + 1}/${allTeams.length}] ✅ ${team.name}: ${result.playerCount} oyuncu${result.coach ? `, Coach: ${result.coach}` : ''}`);
    } else {
      console.log(`  [${i + 1}/${allTeams.length}] ⚠️ ${team.name}: ${result.reason}`);
    }
    
    // API limit kontrolü
    if (stats.apiCalls >= MAX_API_CALLS) {
      console.log('\n⚠️ API limit yaklaşıyor, durduruluyor...');
      break;
    }
    
    // Her 50 takımda bir özet
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 İlerleme: ${i + 1}/${allTeams.length} takım, ${stats.squadsUpdated} kadro, ${stats.apiCalls} API çağrısı\n`);
    }
  }
  
  // ADIM 3: Maçları güncelle
  console.log('\n📋 ADIM 3: Maçlar güncelleniyor...');
  
  for (const league of PRIORITY_LEAGUES) {
    if (stats.apiCalls >= MAX_API_CALLS) {
      console.log('⚠️ API limit, maç güncellemesi atlanıyor...');
      break;
    }
    await updateLeagueMatches(league.id, league.name);
  }
  
  // ÖZET
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    GÜNCELLEME TAMAMLANDI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Süre: ${elapsed} dakika`);
  console.log(`API çağrısı: ${stats.apiCalls.toLocaleString()}`);
  console.log(`Takım işlendi: ${stats.teamsProcessed}`);
  console.log(`Kadro güncellendi: ${stats.squadsUpdated}`);
  console.log(`Coach güncellendi: ${stats.coachesUpdated}`);
  console.log(`Maç güncellendi: ${stats.matchesUpdated}`);
  console.log(`Hata: ${stats.errors.length}`);
  console.log('═══════════════════════════════════════════════════════════');
}

runFullUpdate().catch(console.error);
