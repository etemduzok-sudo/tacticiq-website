/**
 * TÜM TAKIMLARIN VERİLERİNİ GÜNCELLE
 * - Kadrolar (oyuncular)
 * - Teknik direktörler
 * - Takım renkleri
 * 
 * API Limiti: 7500/gün - Bu script öncelikli ligleri sync eder
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');

// Supabase bağlantısı
const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENT_SEASON = 2025;
const DELAY_MS = 1500; // API rate limit için bekleme

// Öncelikli ligler (büyük ligler önce)
const PRIORITY_LEAGUES = [
  203, // Süper Lig
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
  94,  // Primeira Liga
  88,  // Eredivisie
  144, // Jupiler Pro League
  40,  // Championship
  2,   // Champions League
  3,   // Europa League
  848, // Conference League
  1,   // World Cup
  4,   // Euro
];

// Bilinen takım renkleri
const KNOWN_TEAM_COLORS = {
  // Türkiye
  611: ['#FFED00', '#00205B'], // Fenerbahçe
  645: ['#FDB913', '#C41E3A'], // Galatasaray
  549: ['#000000', '#FFFFFF'], // Beşiktaş
  564: ['#F26522', '#1E3A5F'], // Başakşehir
  607: ['#8B0000', '#00205B'], // Trabzonspor
  3563: ['#00529F', '#FFFFFF'], // Adana Demirspor
  3589: ['#1E3A5F', '#FFED00'], // Ankaragücü
  1001: ['#00529F', '#FFFFFF'], // Kasımpaşa
  1005: ['#009639', '#FFFFFF'], // Konyaspor
  // İtalya
  496: ['#000000', '#FFFFFF'], // Juventus
  489: ['#AC1E2E', '#000000'], // AC Milan
  505: ['#0066B3', '#000000'], // Inter
  492: ['#87CEEB', '#FFFFFF'], // Napoli
  497: ['#7B1818', '#FFC425'], // Roma
  487: ['#6CC3E0', '#FFFFFF'], // Lazio
  500: ['#0E274D', '#F0E130'], // Atalanta
  502: ['#AC1E2D', '#FFFFFF'], // Fiorentina
  // İspanya
  541: ['#FFFFFF', '#00529F'], // Real Madrid
  529: ['#A50044', '#004D98'], // Barcelona
  530: ['#D81E05', '#FFFFFF'], // Atletico Madrid
  536: ['#005BBB', '#FFFFFF'], // Sevilla
  533: ['#004170', '#FFC72C'], // Villarreal
  532: ['#003DA5', '#F2A900'], // Valencia
  548: ['#005BBB', '#FFFFFF'], // Real Sociedad
  531: ['#004D98', '#FFFFFF'], // Athletic Bilbao
  // İngiltere
  50: ['#6CABDD', '#FFFFFF'],  // Man City
  33: ['#DA020E', '#FFE500'],  // Man United
  40: ['#C8102E', '#FFFFFF'],  // Liverpool
  42: ['#EF0107', '#FFFFFF'],  // Arsenal
  49: ['#034694', '#FFFFFF'],  // Chelsea
  47: ['#132257', '#FFFFFF'],  // Tottenham
  66: ['#003399', '#FFFFFF'],  // Aston Villa
  34: ['#241F20', '#FFFFFF'],  // Newcastle
  48: ['#D00027', '#003DA5'],  // West Ham
  51: ['#00A2E8', '#FFFFFF'],  // Brighton
  45: ['#6C1D45', '#99D6EA'],  // Everton
  52: ['#EE2737', '#FFFFFF'],  // Crystal Palace
  63: ['#FF0000', '#FFFFFF'],  // Fulham
  35: ['#004D98', '#FFFFFF'],  // Bournemouth
  65: ['#C41E3A', '#FFFFFF'],  // Nottingham Forest
  36: ['#D40027', '#000000'],  // Brentford
  39: ['#00A650', '#FFFFFF'],  // Wolves - Altın/Siyah
  // Almanya
  157: ['#DC052D', '#FFFFFF'], // Bayern
  165: ['#FDE100', '#000000'], // Dortmund
  173: ['#E32221', '#FFFFFF'], // RB Leipzig
  169: ['#005DAA', '#FFFFFF'], // Leverkusen
  168: ['#000000', '#FFFFFF'], // Frankfurt
  172: ['#1E5CB3', '#FFFFFF'], // Stuttgart
  // Fransa
  85: ['#004170', '#DA291C'],  // PSG
  80: ['#ED1C24', '#FFFFFF'],  // Monaco
  81: ['#1D428A', '#FFFFFF'],  // Marseille
  79: ['#E30613', '#FFFFFF'],  // Lille
  84: ['#E30613', '#004170'],  // Nice
  91: ['#ED1C24', '#000000'],  // Rennes
  93: ['#005DAA', '#FFFFFF'],  // Reims
  // Portekiz
  211: ['#E21B24', '#FFFFFF'], // Benfica
  212: ['#0052A0', '#FFFFFF'], // Porto
  228: ['#008000', '#FFFFFF'], // Sporting
  // Hollanda
  194: ['#DC001C', '#FFFFFF'], // Ajax
  197: ['#DC001C', '#FFFFFF'], // PSV
  209: ['#004D98', '#FFFFFF'], // Feyenoord
  // Belçika
  569: ['#461B7E', '#FFFFFF'], // Anderlecht
  631: ['#0066B3', '#000000'], // Club Brugge
};

async function syncTeam(teamId, teamName) {
  const result = { ok: false, players: 0, coach: null, colors: null };
  
  try {
    // 1. Kadro çek (season parametresiz - API güncel kadroyu döndürür)
    const squadData = await footballApi.getTeamSquad(teamId);
    await new Promise(r => setTimeout(r, DELAY_MS));
    
    // 2. Coach çek
    const coachData = await footballApi.getTeamCoach(teamId).catch(() => ({ response: [] }));
    await new Promise(r => setTimeout(r, DELAY_MS));
    
    // 3. Takım bilgisi çek (renkler için)
    const teamInfoData = await footballApi.getTeamInfo(teamId).catch(() => ({ response: [] }));
    
    // API response formatı: { response: [{ team: {...}, players: [...] }] }
    // veya bazen: { response: [{ player: {...} }] }
    let players = [];
    let teamData = { id: teamId, name: teamName };
    
    if (squadData.response && squadData.response.length > 0) {
      const firstItem = squadData.response[0];
      
      // Format 1: { team, players } - normal kadro response
      if (firstItem.players && Array.isArray(firstItem.players)) {
        players = firstItem.players;
        teamData = firstItem.team || teamData;
      }
      // Format 2: response doğrudan player listesi
      else if (firstItem.player || firstItem.id) {
        players = squadData.response.map(item => item.player || item);
      }
    }
    
    // Kadroyu kaydet
    if (players.length > 0) {
      const { error } = await supabase.from('team_squads').upsert({
        team_id: teamId,
        season: CURRENT_SEASON,
        team_name: teamData.name || teamName,
        team_data: teamData,
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          number: p.number,
          position: p.position,
          photo: p.photo,
        })),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_id,season' });
      
      if (!error) {
        result.players = players.length;
      }
    }
    
    // static_teams güncelle
    const updateData = { last_updated: new Date().toISOString() };
    
    // Coach
    if (coachData.response && coachData.response.length > 0) {
      const coaches = coachData.response;
      const currentCoach = coaches.find(c => 
        c.career && c.career.some(car => car.team?.id == teamId && !car.end)
      ) || coaches[0];
      
      if (currentCoach) {
        updateData.coach = currentCoach.name;
        updateData.coach_api_id = currentCoach.id;
        result.coach = currentCoach.name;
      }
    }
    
    // Renkler
    let colors = null;
    if (teamInfoData.response && teamInfoData.response.length > 0) {
      const teamData = teamInfoData.response[0];
      try {
        colors = await footballApi.getTeamColors(teamId, teamData);
      } catch (e) {}
    }
    
    // Fallback renkler
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
      await supabase
        .from('static_teams')
        .update(updateData)
        .eq('api_football_id', teamId);
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
  console.log('║       TÜM TAKIMLAR TAM SYNC (Kadro + Coach + Renkler)            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Öncelikli ülkeler (büyük ligler)
  const priorityCountries = ['Turkey', 'England', 'Spain', 'Italy', 'Germany', 'France', 'Portugal', 'Netherlands', 'Belgium'];
  
  // API limiti nedeniyle sadece öncelikli ülkelerdeki takımları sync et
  const { data: allTeams, error: pErr } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country')
    .in('country', priorityCountries)
    .not('api_football_id', 'is', null);
  
  if (pErr) {
    console.error('❌ DB sorgu hatası:', pErr.message);
    return;
  }
  
  // Unique takımlar
  const uniqueTeams = Array.from(
    new Map(allTeams.map(t => [t.api_football_id, t])).values()
  );
  
  console.log(`📋 Öncelikli liglerde ${uniqueTeams.length} takım bulundu`);
  console.log(`📊 Tahmini API kullanımı: ~${uniqueTeams.length * 3} çağrı`);
  console.log('');
  
  const stats = { total: uniqueTeams.length, ok: 0, fail: 0, coaches: 0, colors: 0 };
  const startTime = Date.now();
  
  for (let i = 0; i < uniqueTeams.length; i++) {
    const team = uniqueTeams[i];
    const result = await syncTeam(team.api_football_id, team.name);
    
    if (result.ok) {
      stats.ok++;
      if (result.coach) stats.coaches++;
      if (result.colors) stats.colors++;
      
      const icon = result.coach ? '✅' : '⚠️';
      console.log(`${icon} [${i+1}/${uniqueTeams.length}] ${team.name}: ${result.players} oyuncu${result.coach ? ', Coach: ' + result.coach : ''}`);
    } else {
      stats.fail++;
      console.log(`❌ [${i+1}/${uniqueTeams.length}] ${team.name}: ${result.error || 'Hata'}`);
    }
    
    // Her 50 takımda ilerleme raporu
    if ((i + 1) % 50 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((elapsed / (i + 1)) * (uniqueTeams.length - i - 1));
      console.log(`\n📊 İlerleme: ${i+1}/${uniqueTeams.length} | Başarılı: ${stats.ok} | Kalan süre: ~${Math.round(remaining/60)} dk\n`);
    }
    
    // API rate limit için bekle
    if (i < uniqueTeams.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                      SYNC TAMAMLANDI                             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Toplam Takım: ${stats.total}`.padEnd(67) + '║');
  console.log(`║  Başarılı: ${stats.ok} | Başarısız: ${stats.fail}`.padEnd(67) + '║');
  console.log(`║  Coach Güncellenen: ${stats.coaches}`.padEnd(67) + '║');
  console.log(`║  Renk Güncellenen: ${stats.colors}`.padEnd(67) + '║');
  console.log(`║  Toplam Süre: ${Math.round(totalTime/60)} dakika`.padEnd(67) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
