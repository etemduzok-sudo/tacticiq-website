/**
 * Eksik kadroları tamamla - Öncelikli ligler
 * API-Football'dan kadro + teknik direktör bilgisi çeker
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const API_KEY = process.env.FOOTBALL_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Öncelikli ülkeler (büyük ligler)
const PRIORITY_COUNTRIES = [
  'England', 'Spain', 'Germany', 'Italy', 'France', 'Turkey',
  'Netherlands', 'Portugal', 'Belgium', 'Scotland', 'Brazil', 'Argentina',
  'Mexico', 'USA', 'Japan', 'South-Korea', 'Saudi-Arabia', 'Australia'
];

let apiCalls = 0;
const MAX_API_CALLS = 500; // Güvenli limit

async function fetchFromAPI(endpoint) {
  if (apiCalls >= MAX_API_CALLS) {
    console.log(`⚠️ API limit reached (${MAX_API_CALLS})`);
    return null;
  }
  
  apiCalls++;
  const url = `https://v3.football.api-sports.io${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await response.json();
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 250));
    
    return data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
}

async function fetchAndSaveSquad(teamId, teamName) {
  const currentYear = new Date().getFullYear();
  const season = currentYear; // 2026
  
  // 1. Kadro çek
  const squadData = await fetchFromAPI(`/players/squads?team=${teamId}`);
  if (!squadData?.response?.[0]?.players) {
    console.log(`  ❌ Kadro bulunamadı: ${teamName}`);
    return false;
  }
  
  const players = squadData.response[0].players;
  
  // 2. Teknik direktör çek
  const coachData = await fetchFromAPI(`/coachs?team=${teamId}`);
  const coach = coachData?.response?.[0];
  
  // 3. DB'ye kaydet
  const squadRecord = {
    team_id: teamId,
    season: season,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      number: p.number,
      position: p.position,
      photo: p.photo
    })),
    coach_id: coach?.id || null,
    coach_name: coach?.name || null,
    coach_photo: coach?.photo || null,
    coach_nationality: coach?.nationality || null,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('team_squads')
    .upsert(squadRecord, { onConflict: 'team_id,season' });
  
  if (error) {
    console.log(`  ❌ DB kayıt hatası: ${teamName} - ${error.message}`);
    return false;
  }
  
  console.log(`  ✅ ${teamName}: ${players.length} oyuncu, TD: ${coach?.name || 'Bilinmiyor'}`);
  return true;
}

async function main() {
  console.log('🚀 Eksik kadroları tamamlama başlıyor...\n');
  
  // Öncelikli ülkelerdeki takımları al
  const { data: priorityTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country, league')
    .in('country', PRIORITY_COUNTRIES)
    .order('country');
  
  // Mevcut kadroları al
  const { data: existingSquads } = await supabase
    .from('team_squads')
    .select('team_id');
  
  const squadSet = new Set(existingSquads?.map(s => s.team_id) || []);
  
  // Kadrosu eksik takımları bul
  const missingTeams = priorityTeams?.filter(t => !squadSet.has(t.api_football_id)) || [];
  
  console.log(`📊 Öncelikli ülkelerde kadrosu eksik: ${missingTeams.length} takım`);
  console.log(`🔑 API Key: ${API_KEY ? 'Mevcut' : 'YOK!'}\n`);
  
  if (!API_KEY) {
    console.error('❌ FOOTBALL_API_KEY bulunamadı!');
    return;
  }
  
  // Ülke bazlı grupla
  const byCountry = {};
  missingTeams.forEach(t => {
    if (!byCountry[t.country]) byCountry[t.country] = [];
    byCountry[t.country].push(t);
  });
  
  let totalSaved = 0;
  let totalFailed = 0;
  
  for (const [country, teams] of Object.entries(byCountry)) {
    console.log(`\n🏴 ${country} (${teams.length} takım)`);
    
    for (const team of teams) {
      if (apiCalls >= MAX_API_CALLS) {
        console.log('\n⚠️ API limit doldu, durduruluyor...');
        break;
      }
      
      const success = await fetchAndSaveSquad(team.api_football_id, team.name);
      if (success) totalSaved++;
      else totalFailed++;
    }
    
    if (apiCalls >= MAX_API_CALLS) break;
  }
  
  console.log('\n========================================');
  console.log(`✅ Kaydedilen: ${totalSaved}`);
  console.log(`❌ Başarısız: ${totalFailed}`);
  console.log(`📡 API Calls: ${apiCalls}/${MAX_API_CALLS}`);
  console.log('========================================');
}

main().catch(console.error);
