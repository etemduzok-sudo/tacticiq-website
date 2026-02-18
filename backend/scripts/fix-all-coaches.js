/**
 * TÜM EKSİK COACH'LARI DÜZELT
 * /coachs endpoint'ini kullanarak HER takımın coach'unu günceller
 * (Maç oynamamış takımlar dahil)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

let stats = { total: 0, updated: 0, notFound: 0, errors: 0, apiCalls: 0 };

async function updateCoach(team) {
  try {
    stats.apiCalls++;
    const coachData = await footballApi.getTeamCoach(team.api_football_id);
    
    if (!coachData.response || coachData.response.length === 0) {
      stats.notFound++;
      return null;
    }
    
    const coaches = coachData.response;
    // Aktif coach'u bul (career.end = null olan)
    const activeCoach = coaches.find(c => 
      c.career && c.career.some(car => car.team?.id == team.api_football_id && !car.end)
    ) || coaches[0];
    
    if (!activeCoach) {
      stats.notFound++;
      return null;
    }
    
    const coachName = activeCoach.name;
    
    // DB'ye kaydet
    await supabase
      .from('static_teams')
      .update({ 
        coach: coachName, 
        coach_api_id: activeCoach.id,
        last_updated: new Date().toISOString() 
      })
      .eq('api_football_id', team.api_football_id);
    
    stats.updated++;
    return coachName;
    
  } catch (err) {
    stats.errors++;
    return null;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        TÜM EKSİK COACH\'LARI GÜNCELLE (/coachs)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Başlangıç: ${new Date().toLocaleString('tr-TR')}\n`);
  
  // Önce Süper Lig takımlarını güncelle (öncelikli)
  console.log('📋 ADIM 1: SÜPER LİG TAKIMLARI...\n');
  
  // Süper Lig maçlarından takım ID'lerini bul
  const { data: slMatches } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id')
    .eq('league_id', 203)
    .limit(500);
  
  const superLigTeamIds = new Set();
  slMatches?.forEach(m => {
    superLigTeamIds.add(m.home_team_id);
    superLigTeamIds.add(m.away_team_id);
  });
  
  // Bu takımların bilgilerini al
  const { data: slTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach')
    .in('api_football_id', [...superLigTeamIds]);
  
  console.log(`  Süper Lig takım sayısı: ${slTeams?.length || 0}`);
  
  // Coach'u olmayan Süper Lig takımları
  const slWithoutCoach = slTeams?.filter(t => !t.coach) || [];
  console.log(`  Coach eksik: ${slWithoutCoach.length}\n`);
  
  for (const team of slWithoutCoach) {
    const coach = await updateCoach(team);
    if (coach) {
      console.log(`  ✅ ${team.name}: ${coach}`);
    } else {
      console.log(`  ⚠️ ${team.name}: Coach bulunamadı`);
    }
  }
  
  // Diğer tüm coach'u eksik takımlar
  console.log('\n📋 ADIM 2: DİĞER EKSİK COACH\'LAR...\n');
  
  const { data: allWithoutCoach } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
    .limit(1000);
  
  stats.total = allWithoutCoach?.length || 0;
  console.log(`  Toplam coach eksik: ${stats.total}\n`);
  
  let processed = 0;
  for (const team of (allWithoutCoach || [])) {
    const coach = await updateCoach(team);
    processed++;
    
    if (coach) {
      console.log(`  [${processed}/${stats.total}] ✅ ${team.name}: ${coach}`);
    }
    
    // Her 100'de özet
    if (processed % 100 === 0) {
      console.log(`\n  📊 İlerleme: ${processed}/${stats.total} | Güncellenen: ${stats.updated} | API: ${stats.apiCalls}\n`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 100));
  }
  
  // ÖZET
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`Toplam: ${stats.total} | Güncellenen: ${stats.updated} | Bulunamadı: ${stats.notFound} | Hata: ${stats.errors}`);
  console.log(`API çağrısı: ${stats.apiCalls}`);
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
