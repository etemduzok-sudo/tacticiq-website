// FULL DATABASE SYNC - Tüm dünya futbol verileri
// Tüm kıtalar, tüm üst ligler, tüm takımlar, tüm maçlar

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const API_KEY = process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(r => setTimeout(r, ms));

// API çağrı sayacı
let apiCalls = 0;
const MAX_API_CALLS = 70000; // Günlük limit 75000, güvenlik payı

async function apiRequest(endpoint, params = {}) {
  if (apiCalls >= MAX_API_CALLS) {
    console.log('⚠️ API limit yaklaşıyor, durduruluyor...');
    return null;
  }
  
  try {
    const res = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY },
      params,
      timeout: 30000
    });
    apiCalls++;
    return res.data;
  } catch (err) {
    console.log(`  API Hata: ${err.message}`);
    return null;
  }
}

// ============================================
// 1. TÜM LİGLERİ GETİR
// ============================================
async function getAllLeagues() {
  console.log('\n' + '='.repeat(60));
  console.log('ADIM 1: TÜM LİGLERİ GETİR');
  console.log('='.repeat(60));
  
  const data = await apiRequest('/leagues', { season: 2025 });
  if (!data || !data.response) {
    console.log('Lig verisi alınamadı!');
    return [];
  }
  
  // Sadece üst erkek ligleri filtrele
  const leagues = data.response.filter(l => {
    const name = l.league.name.toLowerCase();
    const type = l.league.type;
    
    // Hariç tutulacaklar
    if (name.includes('women') || name.includes('kadın')) return false;
    if (name.includes('u17') || name.includes('u18') || name.includes('u19')) return false;
    if (name.includes('u20') || name.includes('u21') || name.includes('u23')) return false;
    if (name.includes('youth') || name.includes('genç')) return false;
    if (name.includes('reserve') || name.includes('amateur')) return false;
    if (name.includes('friendly') && !name.includes('cup')) return false;
    
    // Sadece League ve Cup türleri
    return type === 'League' || type === 'Cup';
  });
  
  console.log(`Toplam lig: ${data.response.length}`);
  console.log(`Filtrelenmiş (üst erkek): ${leagues.length}`);
  
  // DB'ye kaydet
  for (const l of leagues) {
    await supabase.from('leagues').upsert({
      id: l.league.id,
      name: l.league.name,
      country: l.country.name,
      type: l.league.type,
      logo: null, // Telif
      season: 2025,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }
  
  console.log(`✅ ${leagues.length} lig DB'ye kaydedildi`);
  
  return leagues.map(l => ({
    id: l.league.id,
    name: l.league.name,
    country: l.country.name
  }));
}

// ============================================
// 2. TÜM TAKIMLARI GETİR VE GÜNCELLE
// ============================================
async function syncAllTeams(leagues) {
  console.log('\n' + '='.repeat(60));
  console.log('ADIM 2: TÜM TAKIMLARI GÜNCELLE');
  console.log('='.repeat(60));
  
  let totalTeams = 0;
  let updatedTeams = 0;
  
  // Öncelikli ligler (daha fazla detay)
  const priorityLeagueIds = [
    203, // Türkiye Süper Lig
    135, // Serie A
    140, // La Liga
    39,  // Premier League
    78,  // Bundesliga
    61,  // Ligue 1
    94,  // Primeira Liga (Portekiz)
    88,  // Eredivisie (Hollanda)
    144, // Jupiler Pro (Belçika)
    2,   // Champions League
    3,   // Europa League
    848, // Conference League
    1,   // World Cup
    4,   // Euro
  ];
  
  // Öncelikli ligleri önce işle
  const sortedLeagues = leagues.sort((a, b) => {
    const aPriority = priorityLeagueIds.includes(a.id) ? 0 : 1;
    const bPriority = priorityLeagueIds.includes(b.id) ? 0 : 1;
    return aPriority - bPriority;
  });
  
  for (let i = 0; i < sortedLeagues.length; i++) {
    const league = sortedLeagues[i];
    
    if (apiCalls >= MAX_API_CALLS) {
      console.log('⚠️ API limit, durduruluyor...');
      break;
    }
    
    process.stdout.write(`[${i+1}/${sortedLeagues.length}] ${league.country} - ${league.name}... `);
    
    const data = await apiRequest('/teams', { league: league.id, season: 2025 });
    await delay(100);
    
    if (!data || !data.response) {
      console.log('veri yok');
      continue;
    }
    
    const teams = data.response;
    totalTeams += teams.length;
    
    for (const t of teams) {
      const team = t.team;
      
      // static_teams'e kaydet/güncelle
      await supabase.from('static_teams').upsert({
        api_football_id: team.id,
        name: team.name,
        country: team.country,
        founded: team.founded,
        venue_name: t.venue?.name,
        venue_city: t.venue?.city,
        venue_capacity: t.venue?.capacity,
        last_updated: new Date().toISOString()
      }, { onConflict: 'api_football_id' });
      
      updatedTeams++;
    }
    
    console.log(`${teams.length} takım`);
  }
  
  console.log(`\n✅ Toplam: ${totalTeams} takım, Güncellenen: ${updatedTeams}`);
  return updatedTeams;
}

// ============================================
// 3. TEKNİK DİREKTÖRLER VE KADROLAR
// ============================================
async function syncCoachesAndSquads() {
  console.log('\n' + '='.repeat(60));
  console.log('ADIM 3: TEKNİK DİREKTÖRLER VE KADROLAR');
  console.log('='.repeat(60));
  
  // Öncelikli takımları al
  const { data: teams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country')
    .in('country', [
      'Turkey', 'England', 'Spain', 'Germany', 'Italy', 'France',
      'Portugal', 'Netherlands', 'Belgium', 'Brazil', 'Argentina',
      'Saudi-Arabia', 'USA', 'Japan', 'South-Korea', 'China'
    ])
    .order('name');
  
  console.log(`İşlenecek takım sayısı: ${teams?.length || 0}`);
  
  let coachUpdated = 0;
  let squadUpdated = 0;
  
  for (let i = 0; i < (teams?.length || 0); i++) {
    const team = teams[i];
    
    if (apiCalls >= MAX_API_CALLS) {
      console.log('⚠️ API limit, durduruluyor...');
      break;
    }
    
    // Her 50 takımda bir ilerleme göster
    if (i % 50 === 0) {
      console.log(`\n[${i}/${teams.length}] İşleniyor... (API: ${apiCalls})`);
    }
    
    try {
      // Son maçı bul
      const fixturesData = await apiRequest('/fixtures', { 
        team: team.api_football_id, 
        last: 1, 
        season: 2025 
      });
      await delay(100);
      
      if (!fixturesData?.response?.length) continue;
      
      const matchId = fixturesData.response[0].fixture.id;
      
      // Kadroyu çek
      const lineupData = await apiRequest('/fixtures/lineups', { fixture: matchId });
      await delay(100);
      
      if (!lineupData?.response) continue;
      
      const teamLineup = lineupData.response.find(l => l.team.id === team.api_football_id);
      if (!teamLineup) continue;
      
      // Teknik direktörü güncelle
      if (teamLineup.coach?.name) {
        await supabase.from('static_teams').update({
          coach: teamLineup.coach.name,
          last_updated: new Date().toISOString()
        }).eq('api_football_id', team.api_football_id);
        coachUpdated++;
      }
      
      // Kadroyu kaydet
      const players = [];
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
      if (teamLineup.substitutes) {
        teamLineup.substitutes.forEach(p => players.push({
          id: p.player.id,
          name: p.player.name,
          number: p.player.number,
          position: p.player.pos || 'Unknown'
        }));
      }
      
      if (players.length > 0) {
        await supabase.from('team_squads').upsert({
          team_id: team.api_football_id,
          season: 2025,
          team_name: team.name,
          team_data: { id: team.api_football_id, name: team.name, coach: teamLineup.coach?.name },
          players: players,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,season' });
        squadUpdated++;
      }
      
    } catch (err) {
      // Sessizce devam
    }
  }
  
  console.log(`\n✅ Teknik Direktör: ${coachUpdated}, Kadro: ${squadUpdated}`);
}

// ============================================
// 4. TÜM MAÇLAR (GEÇMİŞ + GELECEK)
// ============================================
async function syncAllMatches(leagues) {
  console.log('\n' + '='.repeat(60));
  console.log('ADIM 4: TÜM MAÇLAR (GEÇMİŞ + GELECEK)');
  console.log('='.repeat(60));
  
  // Öncelikli ligler
  const priorityLeagueIds = [
    203, 135, 140, 39, 78, 61, // Top 6 ligler
    94, 88, 144, 2, 3, 848, 1, 4 // Diğer önemli turnuvalar
  ];
  
  const priorityLeagues = leagues.filter(l => priorityLeagueIds.includes(l.id));
  
  console.log(`İşlenecek lig sayısı: ${priorityLeagues.length}`);
  
  let totalMatches = 0;
  
  // Tarih aralığı: -30 gün ile sezon sonu (Mayıs 2026)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  const toDate = new Date('2026-06-30');
  
  console.log(`Tarih aralığı: ${fromDate.toISOString().split('T')[0]} - ${toDate.toISOString().split('T')[0]}`);
  
  for (const league of priorityLeagues) {
    if (apiCalls >= MAX_API_CALLS) {
      console.log('⚠️ API limit, durduruluyor...');
      break;
    }
    
    process.stdout.write(`${league.country} - ${league.name}... `);
    
    const data = await apiRequest('/fixtures', {
      league: league.id,
      season: 2025,
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0]
    });
    await delay(150);
    
    if (!data?.response) {
      console.log('veri yok');
      continue;
    }
    
    const fixtures = data.response;
    
    for (const fix of fixtures) {
      await supabase.from('matches').upsert({
        id: fix.fixture.id,
        league_id: fix.league.id,
        season: fix.league.season,
        round: fix.league.round,
        home_team_id: fix.teams.home.id,
        away_team_id: fix.teams.away.id,
        fixture_date: fix.fixture.date,
        fixture_timestamp: fix.fixture.timestamp,
        timezone: fix.fixture.timezone,
        status: fix.fixture.status.short,
        status_long: fix.fixture.status.long,
        elapsed: fix.fixture.status.elapsed,
        home_score: fix.goals.home,
        away_score: fix.goals.away,
        halftime_home: fix.score?.halftime?.home,
        halftime_away: fix.score?.halftime?.away,
        fulltime_home: fix.score?.fulltime?.home,
        fulltime_away: fix.score?.fulltime?.away,
        venue_name: fix.fixture.venue?.name,
        venue_city: fix.fixture.venue?.city,
        referee: fix.fixture.referee,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      totalMatches++;
    }
    
    console.log(`${fixtures.length} maç`);
  }
  
  console.log(`\n✅ Toplam: ${totalMatches} maç güncellendi`);
}

// ============================================
// ANA FONKSİYON
// ============================================
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          FULL DATABASE SYNC - TÜM DÜNYA FUTBOLU            ║');
  console.log('║                     Şubat 2026                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nAPI Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'YOK!');
  console.log('Başlangıç:', new Date().toLocaleString('tr-TR'));
  
  const startTime = Date.now();
  
  // 1. Ligleri getir
  const leagues = await getAllLeagues();
  
  // 2. Takımları güncelle
  await syncAllTeams(leagues);
  
  // 3. Teknik direktörler ve kadrolar
  await syncCoachesAndSquads();
  
  // 4. Maçlar
  await syncAllMatches(leagues);
  
  // Özet
  const duration = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      SYNC TAMAMLANDI                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Süre: ${duration} dakika`);
  console.log(`API Çağrısı: ${apiCalls}`);
  console.log('Bitiş:', new Date().toLocaleString('tr-TR'));
}

main().catch(console.error);
