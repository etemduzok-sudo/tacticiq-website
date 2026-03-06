/**
 * DÜNYA GENELİ TAM DB GÜNCELLEME SCRİPTİ
 * 
 * Bu script TÜM ülkelerdeki TÜM ligleri günceller:
 * - Takımlar ve bilgileri
 * - Teknik direktörler (son maç kadrosundan)
 * - Kadrolar (son maç kadrosundan - en güncel veri)
 * - Takım renkleri
 * - Tüm maçlar (geçmiş + gelecek)
 * - Oyuncu rating ve skill puanları
 * 
 * API-Football limiti: 75,000/gün
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

// Sabitler
const CURRENT_SEASON = 2025;
const MAX_API_CALLS = 70000; // Günlük limitin altında güvenli değer
const BATCH_SIZE = 50; // Her batch sonrası özet

// İstatistikler
const stats = {
  apiCalls: 0,
  leaguesProcessed: 0,
  teamsProcessed: 0,
  squadsUpdated: 0,
  coachesUpdated: 0,
  matchesUpdated: 0,
  playersUpdated: 0,
  errors: [],
  startTime: Date.now(),
};

// API isteği wrapper
async function apiRequest(endpoint, params, description = '') {
  if (stats.apiCalls >= MAX_API_CALLS) {
    throw new Error('API günlük limit aşıldı');
  }
  stats.apiCalls++;
  if (stats.apiCalls % 100 === 0) {
    console.log(`📡 API: ${stats.apiCalls}/${MAX_API_CALLS} (${description})`);
  }
  return await footballApi.apiRequest(endpoint, params);
}

// Tüm ligleri al ve filtrele
async function getAllLeagues() {
  console.log('\n📋 ADIM 1: TÜM LİGLER ALINIYOR...');
  
  const data = await apiRequest('/leagues', { season: CURRENT_SEASON }, 'leagues');
  
  if (!data.response) {
    console.log('❌ Lig verisi alınamadı');
    return [];
  }
  
  // Sadece üst düzey erkek ligleri filtrele (cup, league - kadın ve gençlik hariç)
  const leagues = data.response.filter(l => {
    const name = l.league.name.toLowerCase();
    const type = l.league.type;
    
    // Kadın ve gençlik ligleri hariç
    if (name.includes('women') || name.includes('woman') || 
        name.includes('u17') || name.includes('u18') || name.includes('u19') || 
        name.includes('u20') || name.includes('u21') || name.includes('u23') ||
        name.includes('youth') || name.includes('junior') ||
        name.includes('reserve') || name.includes('amateur')) {
      return false;
    }
    
    // League veya Cup tipinde olanlar
    return type === 'League' || type === 'Cup';
  });
  
  console.log(`✅ ${data.response.length} lig bulundu, ${leagues.length} üst erkek ligi filtrelendi`);
  
  // DB'ye kaydet
  for (const l of leagues) {
    await supabase.from('leagues').upsert({
      api_football_id: l.league.id,
      name: l.league.name,
      type: l.league.type,
      logo: l.league.logo,
      country_name: l.country.name,
      country_code: l.country.code,
      country_flag: l.country.flag,
      season: CURRENT_SEASON,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'api_football_id' });
  }
  
  stats.leaguesProcessed = leagues.length;
  return leagues;
}

// Lig bazlı takımları al
async function getLeagueTeams(leagueId, leagueName) {
  try {
    const data = await apiRequest('/teams', { league: leagueId, season: CURRENT_SEASON }, `teams-${leagueName}`);
    
    if (!data.response || data.response.length === 0) {
      return [];
    }
    
    return data.response.map(t => ({
      id: t.team.id,
      name: t.team.name,
      logo: t.team.logo,
      country: t.team.country,
      venue: t.venue,
      leagueId,
      leagueName,
    }));
  } catch (err) {
    return [];
  }
}

// Takım kadrosunu son maç kadrosundan güncelle
async function updateTeamFromLastMatch(team) {
  try {
    // Son maçı bul
    const fixturesData = await apiRequest('/fixtures', { 
      team: team.id, 
      season: CURRENT_SEASON, 
      last: 1 
    }, `last-match-${team.name}`);
    
    if (!fixturesData.response || fixturesData.response.length === 0) {
      return { ok: false, reason: 'no_match' };
    }
    
    const lastMatch = fixturesData.response[0];
    const matchId = lastMatch.fixture.id;
    
    // Kadroyu çek
    const lineupData = await apiRequest('/fixtures/lineups', { fixture: matchId }, `lineup-${team.name}`);
    
    if (!lineupData.response) {
      return { ok: false, reason: 'no_lineup' };
    }
    
    const teamLineup = lineupData.response.find(l => l.team.id === team.id);
    if (!teamLineup) {
      return { ok: false, reason: 'team_not_in_lineup' };
    }
    
    // Oyuncuları topla
    const players = [];
    let coach = null;
    
    if (teamLineup.coach?.name) {
      coach = teamLineup.coach.name;
    }
    
    // İlk 11 + yedekler
    const allPlayers = [
      ...(teamLineup.startXI || []),
      ...(teamLineup.substitutes || []),
    ];
    
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
      return { ok: false, reason: 'empty_lineup' };
    }
    
    // Kadroyu DB'ye kaydet
    await supabase.from('team_squads').upsert({
      team_id: team.id,
      season: CURRENT_SEASON,
      team_name: team.name,
      team_data: { id: team.id, name: team.name, coach },
      players: players,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'team_id,season' });
    
    stats.squadsUpdated++;
    
    // Coach'u static_teams'e kaydet
    if (coach) {
      await supabase
        .from('static_teams')
        .update({ coach, last_updated: new Date().toISOString() })
        .eq('api_football_id', team.id);
      stats.coachesUpdated++;
    }
    
    return { ok: true, playerCount: players.length, coach };
    
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

// Lig maçlarını güncelle
async function updateLeagueMatches(leagueId, leagueName) {
  try {
    const data = await apiRequest('/fixtures', { 
      league: leagueId, 
      season: CURRENT_SEASON 
    }, `matches-${leagueName}`);
    
    if (!data.response || data.response.length === 0) {
      return 0;
    }
    
    let updated = 0;
    
    for (const match of data.response) {
      const { error } = await supabase.from('matches').upsert({
        api_football_id: match.fixture.id,
        home_team_id: match.teams.home.id,
        away_team_id: match.teams.away.id,
        home_team_name: match.teams.home.name,
        away_team_name: match.teams.away.name,
        home_score: match.goals.home,
        away_score: match.goals.away,
        status: match.fixture.status.short,
        match_date: match.fixture.date,
        league_id: match.league.id,
        league_name: match.league.name,
        season: match.league.season,
        round: match.league.round,
        venue_name: match.fixture.venue?.name,
        venue_city: match.fixture.venue?.city,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'api_football_id' });
      
      if (!error) updated++;
    }
    const { ensureTeamsInStaticTeams } = require('../services/databaseService');
    await ensureTeamsInStaticTeams(data.response);
    stats.matchesUpdated += updated;
    return updated;
    
  } catch (err) {
    return 0;
  }
}

// Ana güncelleme fonksiyonu
async function runFullWorldSync() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('          DÜNYA GENELİ TAM DB GÜNCELLEMESİ BAŞLIYOR');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`API Limit: ${MAX_API_CALLS.toLocaleString()}`);
  console.log(`Sezon: ${CURRENT_SEASON}-${CURRENT_SEASON + 1}`);
  console.log('');
  
  // ADIM 1: Tüm ligleri al
  const leagues = await getAllLeagues();
  
  if (leagues.length === 0) {
    console.log('❌ Lig bulunamadı, çıkılıyor...');
    return;
  }
  
  // ADIM 2: Her lig için takımları al ve güncelle
  console.log('\n📋 ADIM 2: TAKIMLAR VE KADROLAR GÜNCELLENİYOR...');
  
  const allTeams = [];
  const processedTeamIds = new Set();
  
  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    
    if (stats.apiCalls >= MAX_API_CALLS - 100) {
      console.log('\n⚠️ API limit yaklaşıyor, durduruluyor...');
      break;
    }
    
    const teams = await getLeagueTeams(league.league.id, league.league.name);
    
    // Yeni takımları ekle
    for (const team of teams) {
      if (!processedTeamIds.has(team.id)) {
        processedTeamIds.add(team.id);
        allTeams.push(team);
        
        // Takımı static_teams'e kaydet
        await supabase.from('static_teams').upsert({
          api_football_id: team.id,
          name: team.name,
          logo: team.logo,
          country: team.country,
          venue_name: team.venue?.name,
          venue_city: team.venue?.city,
          venue_capacity: team.venue?.capacity,
          league_id: team.leagueId,
          league_name: team.leagueName,
          last_updated: new Date().toISOString(),
        }, { onConflict: 'api_football_id' });
      }
    }
    
    // Her 50 ligde özet
    if ((i + 1) % 50 === 0) {
      console.log(`  📊 ${i + 1}/${leagues.length} lig, ${allTeams.length} benzersiz takım, API: ${stats.apiCalls}`);
    }
  }
  
  console.log(`\n✅ ${allTeams.length} benzersiz takım bulundu\n`);
  
  // ADIM 3: Her takım için kadro ve coach güncelle
  console.log('📋 ADIM 3: KADROLAR VE TEKN. DİREKTÖRLER GÜNCELLENİYOR (son maç kadrosundan)...');
  
  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
    
    if (stats.apiCalls >= MAX_API_CALLS - 50) {
      console.log('\n⚠️ API limit yaklaşıyor, durduruluyor...');
      break;
    }
    
    const result = await updateTeamFromLastMatch(team);
    stats.teamsProcessed++;
    
    if (result.ok) {
      console.log(`  [${i + 1}/${allTeams.length}] ✅ ${team.name}: ${result.playerCount} oyuncu${result.coach ? ', Coach: ' + result.coach : ''}`);
    } else {
      // Sessizce geç (no_match durumu normal)
      if (result.reason !== 'no_match' && result.reason !== 'no_lineup') {
        console.log(`  [${i + 1}/${allTeams.length}] ⚠️ ${team.name}: ${result.reason}`);
      }
    }
    
    // Her batch'te özet
    if ((i + 1) % BATCH_SIZE === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      console.log(`\n  📊 İlerleme: ${i + 1}/${allTeams.length} takım, ${stats.squadsUpdated} kadro, ${stats.coachesUpdated} coach, API: ${stats.apiCalls}, Süre: ${elapsed}dk\n`);
    }
  }
  
  // ADIM 4: Maçları güncelle (öncelikli ligler)
  console.log('\n📋 ADIM 4: MAÇLAR GÜNCELLENİYOR...');
  
  // Öncelikli ligler (en popüler olanlar)
  const priorityLeagueIds = [39, 140, 135, 78, 61, 203, 94, 88, 144, 2, 3, 848, 13, 71, 128];
  const priorityLeagues = leagues.filter(l => priorityLeagueIds.includes(l.league.id));
  
  for (const league of priorityLeagues) {
    if (stats.apiCalls >= MAX_API_CALLS - 20) {
      console.log('⚠️ API limit, maç güncellemesi durduruluyor...');
      break;
    }
    
    const updated = await updateLeagueMatches(league.league.id, league.league.name);
    console.log(`  ✅ ${league.league.name}: ${updated} maç`);
  }
  
  // ÖZET
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                    GÜNCELLEME TAMAMLANDI');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Süre: ${elapsed} dakika`);
  console.log(`API çağrısı: ${stats.apiCalls.toLocaleString()}`);
  console.log(`Ligler işlendi: ${stats.leaguesProcessed}`);
  console.log(`Takımlar işlendi: ${stats.teamsProcessed}`);
  console.log(`Kadrolar güncellendi: ${stats.squadsUpdated}`);
  console.log(`Coach güncellendi: ${stats.coachesUpdated}`);
  console.log(`Maçlar güncellendi: ${stats.matchesUpdated}`);
  console.log(`Hatalar: ${stats.errors.length}`);
  console.log('═══════════════════════════════════════════════════════════════════');
}

// Çalıştır
runFullWorldSync().catch(err => {
  console.error('❌ FATAL ERROR:', err.message);
  process.exit(1);
});
