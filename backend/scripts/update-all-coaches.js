/**
 * TÜM TAKIMLARIN TEKNİK DİREKTÖR VERİLERİNİ GÜNCELLE
 * 
 * Bu script:
 * 1. static_teams tablosundaki tüm takımları çeker
 * 2. Her takım için API-Football'dan güncel coach verisi çeker
 * 3. Veritabanını günceller
 * 
 * Kullanım: 
 *   node scripts/update-all-coaches.js              # Tüm takımlar
 *   node scripts/update-all-coaches.js --priority   # Sadece favori takımlar (öncelikli)
 *   node scripts/update-all-coaches.js --stale      # Sadece eski veriler (7+ gün)
 *   node scripts/update-all-coaches.js --dry-run    # Sadece kontrol et, güncelleme yapma
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// API-Football config
const API_KEY = process.env.API_FOOTBALL_KEY;
const API_HOST = 'v3.football.api-sports.io';

if (!API_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found in environment');
  process.exit(1);
}

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  console.error('   Required: SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting
const DELAY_MS = 350; // API rate limit: ~300 req/min
const MAX_API_CALLS = 400; // Günlük limit koruma
let apiCalls = 0;

// Priority takımlar (favori olabilecek büyük takımlar)
const PRIORITY_TEAM_IDS = [
  // Türkiye
  645, 611, 549, 618, 628, // GS, FB, BJK, Trabzon, Başakşehir
  // Premier League
  33, 34, 40, 42, 47, 49, // Man Utd, Newcastle, Liverpool, Arsenal, Tottenham, Chelsea
  50, // Man City
  // La Liga  
  529, 530, 541, 548, // Barcelona, Atletico, Real Madrid, Real Sociedad
  // Serie A
  489, 492, 496, 497, 505, // AC Milan, Napoli, Juventus, Roma, Inter
  // Bundesliga
  157, 165, 168, 169, // Bayern, Dortmund, Leverkusen, Frankfurt
  // Ligue 1
  85, 81, 91, // PSG, Marseille, Monaco
  // Milli takımlar
  2, 1, 9, 10, 6, 4, 5, 3, 15, 25, // TR, DE, ES, FR, BR, AR, IT, PO, EN, NL
];

async function apiRequest(endpoint, params = {}) {
  apiCalls++;
  
  const url = new URL(`https://${API_HOST}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-host': API_HOST,
      'x-rapidapi-key': API_KEY,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchCoachForTeam(teamId) {
  try {
    const data = await apiRequest('/coachs', { team: teamId });
    
    if (!data.response || data.response.length === 0) {
      return null;
    }
    
    // Aktif coach'u bul (end tarihi olmayan)
    const currentCoach = data.response.find(c => 
      c.career && c.career.some(car => car.team?.id === teamId && !car.end)
    );
    
    if (currentCoach) {
      return {
        name: currentCoach.name,
        id: currentCoach.id,
      };
    }
    
    // Aktif bulunamadıysa en son kariyer kaydına bak
    const sortedByCareer = data.response.sort((a, b) => {
      const aLatest = a.career?.find(c => c.team?.id === teamId);
      const bLatest = b.career?.find(c => c.team?.id === teamId);
      const aStart = aLatest?.start ? new Date(aLatest.start) : new Date(0);
      const bStart = bLatest?.start ? new Date(bLatest.start) : new Date(0);
      return bStart - aStart;
    });
    
    if (sortedByCareer[0]) {
      return {
        name: sortedByCareer[0].name,
        id: sortedByCareer[0].id,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`  ❌ Coach fetch error for team ${teamId}:`, error.message);
    return null;
  }
}

async function updateCoachInDB(teamId, coach, dryRun = false) {
  if (dryRun) {
    console.log(`  🧪 [DRY-RUN] Would update team ${teamId}: ${coach?.name || 'null'}`);
    return true;
  }
  
  try {
    const { error } = await supabase
      .from('static_teams')
      .update({ 
        coach: coach?.name || null,
        coach_api_id: coach?.id || null,
        last_updated: new Date().toISOString()
      })
      .eq('api_football_id', teamId);
    
    if (error) {
      console.error(`  ❌ DB update error for team ${teamId}:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`  ❌ DB update exception for team ${teamId}:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const priorityOnly = args.includes('--priority');
  const staleOnly = args.includes('--stale');
  const dryRun = args.includes('--dry-run');
  
  console.log('🔄 COACH VERİLERİ GÜNCELLEME SCRIPT\'İ');
  console.log('=====================================');
  console.log(`📋 Mod: ${priorityOnly ? 'Priority takımlar' : staleOnly ? 'Eski veriler' : 'Tüm takımlar'}`);
  console.log(`🧪 Dry-run: ${dryRun ? 'EVET' : 'HAYIR'}`);
  console.log('');
  
  // Takımları çek
  let query = supabase
    .from('static_teams')
    .select('api_football_id, name, coach, last_updated')
    .not('api_football_id', 'is', null);
  
  if (priorityOnly) {
    query = query.in('api_football_id', PRIORITY_TEAM_IDS);
  }
  
  const { data: teams, error } = await query;
  
  if (error) {
    console.error('❌ Takımlar çekilemedi:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Toplam ${teams.length} takım bulundu`);
  
  // Filtreleme
  let teamsToUpdate = teams;
  
  if (staleOnly) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    teamsToUpdate = teams.filter(t => {
      const lastUpdated = t.last_updated ? new Date(t.last_updated) : null;
      return !lastUpdated || lastUpdated < sevenDaysAgo;
    });
    console.log(`📊 ${teamsToUpdate.length} takımın verisi eski (7+ gün)`);
  }
  
  if (teamsToUpdate.length === 0) {
    console.log('✅ Güncellenecek takım yok!');
    return;
  }
  
  const stats = {
    total: teamsToUpdate.length,
    updated: 0,
    noChange: 0,
    notFound: 0,
    errors: 0,
    startTime: Date.now(),
  };
  
  console.log('');
  console.log('🚀 Güncelleme başlıyor...');
  console.log('');
  
  for (let i = 0; i < teamsToUpdate.length; i++) {
    const team = teamsToUpdate[i];
    
    if (apiCalls >= MAX_API_CALLS) {
      console.log(`\n⚠️ API limiti (${MAX_API_CALLS}) aşıldı, durduruluyor...`);
      break;
    }
    
    process.stdout.write(`[${i + 1}/${teamsToUpdate.length}] ${team.name} (${team.api_football_id})... `);
    
    // API'den coach çek
    const coach = await fetchCoachForTeam(team.api_football_id);
    
    if (!coach) {
      console.log('❌ Coach bulunamadı');
      stats.notFound++;
    } else if (coach.name === team.coach) {
      console.log(`✓ Değişiklik yok (${coach.name})`);
      stats.noChange++;
      // Yine de last_updated'ı güncelle
      await updateCoachInDB(team.api_football_id, coach, dryRun);
    } else {
      const oldCoach = team.coach || 'null';
      console.log(`✅ ${oldCoach} → ${coach.name}`);
      const success = await updateCoachInDB(team.api_football_id, coach, dryRun);
      if (success) stats.updated++;
      else stats.errors++;
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, DELAY_MS));
    
    // Progress
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
      console.log(`\n📊 İlerleme: ${i + 1}/${teamsToUpdate.length}, API: ${apiCalls}, Süre: ${elapsed}dk\n`);
    }
  }
  
  // Sonuç özeti
  const elapsed = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  console.log('');
  console.log('=====================================');
  console.log('📊 SONUÇ ÖZETİ');
  console.log('=====================================');
  console.log(`✅ Güncellenen: ${stats.updated}`);
  console.log(`➖ Değişiklik yok: ${stats.noChange}`);
  console.log(`❌ Coach bulunamadı: ${stats.notFound}`);
  console.log(`⚠️ Hatalar: ${stats.errors}`);
  console.log(`📡 API çağrıları: ${apiCalls}`);
  console.log(`⏱️ Toplam süre: ${elapsed} dakika`);
  console.log('=====================================');
}

main().catch(console.error);
