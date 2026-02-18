#!/usr/bin/env node
/**
 * TÜM KADROLARI SIFIRLA VE 2025-26 SEZONUNU ÇEK
 * 
 * Bu script:
 * 1. team_squads tablosundaki TÜM eski verileri siler
 * 2. static_teams'deki coach verilerini sıfırlar
 * 3. Tüm takımlar için API'den güncel 2025 sezonu verilerini çeker
 * 4. Coach bilgilerini lineups'tan günceller
 * 
 * Kullanım: node scripts/reset-all-squads-2025.js [--dry-run] [--teams-only] [--squads-only]
 */

const path = require('path');
// Backend .env dosyasını yükle (API key burada)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// .env.local'dan Supabase bilgilerini al
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase bağlantısı
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing');
  console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// API-Football
const API_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPID_API_KEY;
const API_HOST = 'v3.football.api-sports.io';

// Argümanlar
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const teamsOnly = args.includes('--teams-only');
const squadsOnly = args.includes('--squads-only');

const CURRENT_SEASON = 2025;
const DELAY_MS = 1500; // API rate limit

// Önemli ligler (öncelikli sync için)
const PRIORITY_LEAGUES = [
  { id: 203, name: 'Süper Lig', country: 'Turkey' },
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 2, name: 'Champions League', country: 'World' },
  { id: 3, name: 'Europa League', country: 'World' },
];

async function apiRequest(endpoint, params = {}) {
  try {
    const url = `https://${API_HOST}${endpoint}`;
    const response = await axios.get(url, {
      headers: { 'x-apisports-key': API_KEY },
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clearOldSquads() {
  console.log('\n📋 ADIM 1: Eski kadro verilerini temizleme...');
  
  if (dryRun) {
    const { count } = await supabase
      .from('team_squads')
      .select('*', { count: 'exact', head: true });
    console.log(`   [DRY-RUN] ${count || 0} kadro silinecekti`);
    return;
  }

  // Tüm eski kadroları sil
  const { error } = await supabase
    .from('team_squads')
    .delete()
    .neq('team_id', 0); // Tümünü sil

  if (error) {
    console.error('❌ Kadro silme hatası:', error.message);
  } else {
    console.log('✅ Tüm eski kadro verileri silindi');
  }
}

async function clearOldCoaches() {
  console.log('\n📋 ADIM 2: Eski coach verilerini sıfırlama...');
  
  if (dryRun) {
    const { data } = await supabase
      .from('static_teams')
      .select('id, name, coach')
      .not('coach', 'is', null);
    console.log(`   [DRY-RUN] ${data?.length || 0} takımın coach verisi sıfırlanacaktı`);
    return;
  }

  // Tüm coach verilerini sıfırla (API'den yeniden çekilecek)
  const { error } = await supabase
    .from('static_teams')
    .update({ coach: null, coach_api_id: null })
    .neq('id', 0);

  if (error) {
    console.error('❌ Coach sıfırlama hatası:', error.message);
  } else {
    console.log('✅ Tüm coach verileri sıfırlandı');
  }
}

async function syncLeagueSquads(league) {
  console.log(`\n🏆 ${league.name} takımları sync ediliyor...`);
  
  // Lig takımlarını çek
  const teamsData = await apiRequest('/teams', { league: league.id, season: CURRENT_SEASON });
  if (!teamsData || !teamsData.response) {
    console.log(`   ⚠️ ${league.name} için takım verisi alınamadı`);
    return { synced: 0, failed: 0 };
  }

  const teams = teamsData.response;
  console.log(`   📊 ${teams.length} takım bulundu`);

  let synced = 0;
  let failed = 0;

  for (const teamData of teams) {
    const team = teamData.team;
    await sleep(DELAY_MS);

    try {
      // Kadro çek
      const squadData = await apiRequest('/players/squads', { team: team.id });
      if (!squadData || !squadData.response || squadData.response.length === 0) {
        console.log(`   ⚠️ ${team.name}: Kadro verisi yok`);
        failed++;
        continue;
      }

      const players = squadData.response[0].players || [];
      
      if (dryRun) {
        console.log(`   [DRY-RUN] ${team.name}: ${players.length} oyuncu sync edilecekti`);
        synced++;
        continue;
      }

      // DB'ye kaydet
      const { error } = await supabase
        .from('team_squads')
        .upsert({
          team_id: team.id,
          team_name: team.name,
          season: CURRENT_SEASON,
          players: players.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            number: p.number,
            position: p.position,
            nationality: null, // API squads endpoint nationality vermiyor
            rating: getDefaultRating(p.position),
            photo: null,
            injured: false,
            suspended: false,
            eligible_for_selection: true,
          })),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'team_id,season' });

      if (error) {
        console.log(`   ❌ ${team.name}: DB hatası - ${error.message}`);
        failed++;
      } else {
        console.log(`   ✅ ${team.name}: ${players.length} oyuncu`);
        synced++;
      }

      // Coach bilgisini de güncelle
      await updateTeamCoach(team.id, team.name);

    } catch (err) {
      console.log(`   ❌ ${team.name}: ${err.message}`);
      failed++;
    }
  }

  return { synced, failed };
}

async function updateTeamCoach(teamId, teamName) {
  try {
    // Coach bilgisini API'den çek
    const coachData = await apiRequest('/coachs', { team: teamId });
    if (!coachData || !coachData.response || coachData.response.length === 0) {
      return;
    }

    // Aktif coach'u bul (career.end = null olan)
    const coaches = coachData.response;
    const currentCoach = coaches.find(c => 
      c.career && c.career.some(car => car.team?.id == teamId && !car.end)
    ) || coaches[0];

    if (!currentCoach) return;

    if (dryRun) {
      console.log(`   [DRY-RUN] ${teamName} coach: ${currentCoach.name}`);
      return;
    }

    // DB'ye kaydet
    await supabase
      .from('static_teams')
      .update({ 
        coach: currentCoach.name,
        coach_api_id: currentCoach.id,
        last_updated: new Date().toISOString()
      })
      .eq('api_football_id', teamId);

  } catch (err) {
    // Coach hatası kritik değil, devam et
  }
}

function getDefaultRating(position) {
  if (!position) return 70;
  const pos = position.toLowerCase();
  if (pos.includes('goalkeeper')) return 72;
  if (pos.includes('defender')) return 71;
  if (pos.includes('midfielder')) return 72;
  if (pos.includes('attacker') || pos.includes('forward')) return 73;
  return 70;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   TÜM KADROLARI SIFIRLA VE 2025-26 SEZONUNU ÇEK               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Sezon: ${CURRENT_SEASON}`);
  console.log(`🔧 Mod: ${dryRun ? 'DRY-RUN (değişiklik yapılmayacak)' : 'GERÇEK (veriler silinip yeniden çekilecek)'}`);
  
  if (!API_KEY) {
    console.error('\n❌ API_FOOTBALL_KEY environment variable gerekli');
    process.exit(1);
  }

  const startTime = Date.now();
  let totalSynced = 0;
  let totalFailed = 0;

  // Adım 1: Eski verileri temizle
  if (!teamsOnly) {
    await clearOldSquads();
  }
  
  // Adım 2: Coach verilerini sıfırla
  if (!squadsOnly) {
    await clearOldCoaches();
  }

  // Adım 3: Tüm ligler için kadroları çek
  if (!teamsOnly) {
    console.log('\n📋 ADIM 3: Güncel kadroları çekme...');
    
    for (const league of PRIORITY_LEAGUES) {
      const result = await syncLeagueSquads(league);
      totalSynced += result.synced;
      totalFailed += result.failed;
      await sleep(1000); // Liglar arası bekleme
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   ÖZET                                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`   ✅ Sync edilen: ${totalSynced} takım`);
  console.log(`   ❌ Başarısız: ${totalFailed} takım`);
  console.log(`   ⏱️ Süre: ${elapsed} saniye`);
  
  if (dryRun) {
    console.log('\n⚠️ DRY-RUN modu: Hiçbir değişiklik yapılmadı');
    console.log('   Gerçek çalıştırma için: node scripts/reset-all-squads-2025.js');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
