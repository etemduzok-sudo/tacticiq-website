// Mock Canlı Maç Oluşturucu
// İlk 90 dakikayı simüle eder ve canlı verileri gösterir

const { supabase } = require('../config/supabase');

// Mock takımlar ve oyuncular
const MOCK_TEAMS = {
  home: {
    id: 9999,
    name: 'Mock Home Team',
    logo: null
  },
  away: {
    id: 9998,
    name: 'Mock Away Team',
    logo: null
  }
};

// Mock oyuncular (her takım için 11 oyuncu)
const MOCK_PLAYERS = {
  home: [
    { id: 9001, name: 'Home GK', position: 'GK', number: 1 },
    { id: 9002, name: 'Home DEF1', position: 'DEF', number: 2 },
    { id: 9003, name: 'Home DEF2', position: 'DEF', number: 3 },
    { id: 9004, name: 'Home DEF3', position: 'DEF', number: 4 },
    { id: 9005, name: 'Home DEF4', position: 'DEF', number: 5 },
    { id: 9006, name: 'Home MID1', position: 'MID', number: 6 },
    { id: 9007, name: 'Home MID2', position: 'MID', number: 7 },
    { id: 9008, name: 'Home MID3', position: 'MID', number: 8 },
    { id: 9009, name: 'Home FWD1', position: 'FWD', number: 9 },
    { id: 9010, name: 'Home FWD2', position: 'FWD', number: 10 },
    { id: 9011, name: 'Home FWD3', position: 'FWD', number: 11 },
  ],
  away: [
    { id: 8001, name: 'Away GK', position: 'GK', number: 1 },
    { id: 8002, name: 'Away DEF1', position: 'DEF', number: 2 },
    { id: 8003, name: 'Away DEF2', position: 'DEF', number: 3 },
    { id: 8004, name: 'Away DEF3', position: 'DEF', number: 4 },
    { id: 8005, name: 'Away DEF4', position: 'DEF', number: 5 },
    { id: 8006, name: 'Away MID1', position: 'MID', number: 6 },
    { id: 8007, name: 'Away MID2', position: 'MID', number: 7 },
    { id: 8008, name: 'Away MID3', position: 'MID', number: 8 },
    { id: 8009, name: 'Away FWD1', position: 'FWD', number: 9 },
    { id: 8010, name: 'Away FWD2', position: 'FWD', number: 10 },
    { id: 8011, name: 'Away FWD3', position: 'FWD', number: 11 },
  ]
};

// Maç eventleri (dakika bazında)
const MATCH_EVENTS = [
  { minute: 5, type: 'Goal', team: 'home', player: 'Home FWD1', assist: 'Home MID1', detail: 'Normal Goal' },
  { minute: 12, type: 'Card', team: 'away', player: 'Away DEF1', detail: 'Yellow Card' },
  { minute: 23, type: 'Goal', team: 'away', player: 'Away FWD1', assist: 'Away MID1', detail: 'Normal Goal' },
  { minute: 28, type: 'Card', team: 'home', player: 'Home MID2', detail: 'Yellow Card' },
  { minute: 35, type: 'Goal', team: 'home', player: 'Home FWD2', assist: 'Home MID2', detail: 'Normal Goal' },
  { minute: 45, type: 'Card', team: 'away', player: 'Away MID2', detail: 'Yellow Card' },
  // İkinci yarı
  { minute: 52, type: 'subst', team: 'home', playerOut: 'Home MID1', playerIn: 'Home MID4' },
  { minute: 58, type: 'Goal', team: 'away', player: 'Away FWD2', assist: 'Away MID2', detail: 'Normal Goal' },
  { minute: 64, type: 'Card', team: 'home', player: 'Home DEF1', detail: 'Yellow Card' },
  { minute: 71, type: 'subst', team: 'away', playerOut: 'Away FWD1', playerIn: 'Away FWD4' },
  { minute: 78, type: 'Goal', team: 'home', player: 'Home FWD3', assist: 'Home MID2', detail: 'Normal Goal' },
  { minute: 83, type: 'Card', team: 'away', player: 'Away DEF2', detail: 'Red Card' },
  { minute: 90, type: 'Goal', team: 'home', player: 'Home FWD1', assist: null, detail: 'Normal Goal' },
];

const MOCK_MATCH_ID = 999999;
const MOCK_LEAGUE_ID = 999;

// Mock lig ve takımları oluştur
async function createMockLeagueAndTeams() {
  try {
    // Mock lig oluştur
    const { error: leagueError } = await supabase
      .from('leagues')
      .upsert({
        id: MOCK_LEAGUE_ID,
        name: 'Mock League',
        country: 'Mock Country',
        logo: null,
        season: 2025
      }, { onConflict: 'id' });

    if (leagueError && leagueError.code !== '23505') throw leagueError;

    // Mock takımları oluştur
    const { error: homeTeamError } = await supabase
      .from('teams')
      .upsert({
        id: MOCK_TEAMS.home.id,
        name: MOCK_TEAMS.home.name,
        logo: null,
        country: 'Mock Country'
      }, { onConflict: 'id' });

    if (homeTeamError && homeTeamError.code !== '23505') throw homeTeamError;

    const { error: awayTeamError } = await supabase
      .from('teams')
      .upsert({
        id: MOCK_TEAMS.away.id,
        name: MOCK_TEAMS.away.name,
        logo: null,
        country: 'Mock Country'
      }, { onConflict: 'id' });

    if (awayTeamError && awayTeamError.code !== '23505') throw awayTeamError;

    console.log('✅ Mock lig ve takımlar oluşturuldu');
  } catch (error) {
    console.error('❌ Lig/takım oluşturma hatası:', error.message);
    throw error;
  }
}

// Maç oluştur
async function createMockMatch() {
  const now = new Date();
  const matchDate = new Date(now.getTime() - 5 * 60 * 1000); // 5 dakika önce başladı

  const matchData = {
    id: MOCK_MATCH_ID,
    league_id: MOCK_LEAGUE_ID,
    season: 2025,
    round: 'Mock Round',
    home_team_id: MOCK_TEAMS.home.id,
    away_team_id: MOCK_TEAMS.away.id,
    fixture_date: matchDate.toISOString(),
    fixture_timestamp: Math.floor(matchDate.getTime() / 1000),
    timezone: 'UTC',
    status: '1H', // İlk yarı
    status_long: 'First Half',
    elapsed: 5, // 5. dakika
    home_score: 0,
    away_score: 0,
    halftime_home: null,
    halftime_away: null,
    fulltime_home: null,
    fulltime_away: null,
    venue_name: 'Mock Stadium',
    venue_city: 'Mock City',
    referee: 'Mock Referee',
    updated_at: now.toISOString()
  };

  try {
    // Maçı oluştur
    const { error: matchError } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'id' });

    if (matchError) throw matchError;

    console.log('✅ Mock maç oluşturuldu:', MOCK_MATCH_ID);
    return matchData;
  } catch (error) {
    console.error('❌ Maç oluşturma hatası:', error);
    throw error;
  }
}

// Event ekle
async function addEvent(event, currentMinute) {
  // Subst event'leri için özel işleme
  if (event.type === 'subst') {
    // Çıkış eventi
    const eventDataOut = {
      match_id: MOCK_MATCH_ID,
      elapsed: event.minute,
      type: 'subst',
      team_id: event.team === 'home' ? MOCK_TEAMS.home.id : MOCK_TEAMS.away.id,
      player_name: event.playerOut,
      detail: 'Substitution'
    };
    
    // Giriş eventi
    const eventDataIn = {
      match_id: MOCK_MATCH_ID,
      elapsed: event.minute,
      type: 'subst',
      team_id: event.team === 'home' ? MOCK_TEAMS.home.id : MOCK_TEAMS.away.id,
      player_name: event.playerIn,
      detail: 'Substitution'
    };

    try {
      await supabase.from('match_events').insert(eventDataOut);
      await supabase.from('match_events').insert(eventDataIn);
      console.log(`   🔄 ${event.minute}' - Değişiklik: ${event.playerOut} → ${event.playerIn}`);
      return;
    } catch (error) {
      console.error('   ❌ Event ekleme hatası:', error.message);
      return;
    }
  }

  // Diğer event'ler
  const eventData = {
    match_id: MOCK_MATCH_ID,
    elapsed: event.minute,
    type: event.type,
    team_id: event.team === 'home' ? MOCK_TEAMS.home.id : MOCK_TEAMS.away.id,
    player_name: event.player || null,
    assist_name: event.assist || null,
    detail: event.detail || null
  };

  try {
    const { error } = await supabase
      .from('match_events')
      .insert(eventData);

    if (error) throw error;
    console.log(`   ⚽ ${event.minute}' - ${event.type}: ${event.player || event.playerOut || 'N/A'}`);
  } catch (error) {
    console.error('   ❌ Event ekleme hatası:', error.message);
  }
}

// Skoru güncelle
async function updateScore(homeScore, awayScore, elapsed, status) {
  const updateData = {
    home_score: homeScore,
    away_score: awayScore,
    elapsed: elapsed,
    status: status,
    status_long: status === '1H' ? 'First Half' : status === 'HT' ? 'Half Time' : status === '2H' ? 'Second Half' : 'Match Finished',
    updated_at: new Date().toISOString()
  };

  // Devre arası skor
  if (status === 'HT' || status === '2H') {
    updateData.halftime_home = homeScore;
    updateData.halftime_away = awayScore;
  }

  // Maç bitti
  if (status === 'FT') {
    updateData.fulltime_home = homeScore;
    updateData.fulltime_away = awayScore;
  }

  try {
    const { error } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', MOCK_MATCH_ID);

    if (error) throw error;
    
    console.log(`\n📊 ${elapsed}' - Skor: ${homeScore}-${awayScore} (${status})`);
  } catch (error) {
    console.error('❌ Skor güncelleme hatası:', error);
  }
}

// Ana simülasyon fonksiyonu
async function simulateMatch() {
  console.log('\n🎮 Mock Canlı Maç Simülasyonu Başlıyor...\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🏆 ${MOCK_TEAMS.home.name} vs ${MOCK_TEAMS.away.name}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Mock lig ve takımları oluştur
  await createMockLeagueAndTeams();

  // Maçı oluştur
  await createMockMatch();

  let homeScore = 0;
  let awayScore = 0;
  let currentMinute = 5;
  let processedEvents = 0;

  // İlk 90 dakikayı simüle et
  while (currentMinute <= 90) {
    // Bu dakikadaki eventleri işle
    const eventsThisMinute = MATCH_EVENTS.filter(e => e.minute === currentMinute);
    
    for (const event of eventsThisMinute) {
      await addEvent(event, currentMinute);
      
      // Gol eventi
      if (event.type === 'Goal') {
        if (event.team === 'home') {
          homeScore++;
        } else {
          awayScore++;
        }
      }
    }

    // Skoru güncelle
    let status = '1H';
    if (currentMinute === 45) {
      status = 'HT';
    } else if (currentMinute === 46) {
      status = '2H';
    } else if (currentMinute > 45 && currentMinute <= 90) {
      status = '2H';
    }

    await updateScore(homeScore, awayScore, currentMinute, status);

    // Devre arası
    if (currentMinute === 45) {
      console.log('\n⏸️  DEVRE ARASI\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Bir sonraki dakikaya geç
    currentMinute++;
    processedEvents += eventsThisMinute.length;

    // Her dakika arasında 1 saniye bekle (hızlandırılmış simülasyon)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Maç bitti
  await updateScore(homeScore, awayScore, 90, 'FT');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏁 MAÇ BİTTİ!');
  console.log(`📊 Final Skor: ${homeScore}-${awayScore}`);
  console.log(`📈 Toplam Event: ${processedEvents}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// Script çalıştır
if (require.main === module) {
  simulateMatch()
    .then(() => {
      console.log('✅ Simülasyon tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simülasyon hatası:', error);
      process.exit(1);
    });
}

module.exports = { simulateMatch, createMockMatch };
