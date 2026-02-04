/**
 * TacticIQ Auto Squad Sync Script
 * API limitini kontrol eder ve müsaitse eksik kadroları senkronize eder
 * 
 * Kullanım: node scripts/auto-sync-squads.js
 * 
 * Önerilen: Günde 1-2 kez çalıştır (cron job veya manuel)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const API_KEY = process.env.FOOTBALL_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Progress dosyası
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'squad-sync-progress.json');

// Öncelikli ülkeler
const PRIORITY_COUNTRIES = [
  'Turkey', 'England', 'Spain', 'Germany', 'Italy', 'France',
  'Netherlands', 'Portugal', 'Belgium', 'Brazil', 'Argentina'
];

// API limit ayarları - tüm limit kullanılabilir
const MAX_API_CALLS_PER_RUN = 7000; // Günlük 7500'ün büyük kısmı
const RATE_LIMIT_MS = 200; // 200ms bekleme (hız için)

let apiCalls = 0;

async function checkAPIStatus() {
  try {
    const url = 'https://v3.football.api-sports.io/status';
    const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
    const data = await res.json();
    
    if (data.errors?.requests) {
      return { available: false, message: data.errors.requests };
    }
    
    const account = data.response?.account;
    const subscription = data.response?.subscription;
    const requests = data.response?.requests;
    
    return {
      available: true,
      current: requests?.current || 0,
      limit: requests?.limit_day || 7500,
      remaining: (requests?.limit_day || 7500) - (requests?.current || 0)
    };
  } catch (error) {
    return { available: false, message: error.message };
  }
}

async function fetchFromAPI(endpoint) {
  if (apiCalls >= MAX_API_CALLS_PER_RUN) {
    return null;
  }
  
  apiCalls++;
  
  try {
    const url = `https://v3.football.api-sports.io${endpoint}`;
    const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
    const data = await res.json();
    
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    
    return data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    return null;
  }
}

async function syncTeamSquad(teamId, teamName) {
  // Kadro çek
  const squadData = await fetchFromAPI(`/players/squads?team=${teamId}`);
  
  if (!squadData?.response?.[0]?.players?.length) {
    return { success: false, reason: 'no_data' };
  }
  
  const players = squadData.response[0].players;
  
  // Teknik direktör çek
  const coachData = await fetchFromAPI(`/coachs?team=${teamId}`);
  const coach = coachData?.response?.find(c => c.career?.some(car => car.team?.id === teamId && !car.end));
  
  // DB'ye kaydet
  const currentYear = new Date().getFullYear();
  const squadRecord = {
    team_id: teamId,
    season: currentYear,
    team_name: teamName,
    team_data: { id: teamId, name: teamName, coach: coach?.name || null },
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      number: p.number,
      position: p.position,
      photo: p.photo
    })),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('team_squads')
    .upsert(squadRecord, { onConflict: 'team_id,season' });
  
  if (error) {
    return { success: false, reason: error.message };
  }
  
  return { success: true, players: players.length, coach: coach?.name };
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {}
  return { completedTeams: [], lastRun: null };
}

function saveProgress(progress) {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
  console.log('🚀 TacticIQ Auto Squad Sync\n');
  
  // 1. API durumunu kontrol et
  console.log('📡 API durumu kontrol ediliyor...');
  const apiStatus = await checkAPIStatus();
  
  if (!apiStatus.available) {
    console.log(`❌ API kullanılamıyor: ${apiStatus.message}`);
    console.log('⏰ Yarın tekrar deneyin.');
    return;
  }
  
  console.log(`✅ API müsait: ${apiStatus.remaining}/${apiStatus.limit} kalan`);
  
  if (apiStatus.remaining < 100) {
    console.log('⚠️ API limiti çok düşük, senkronizasyon atlanıyor.');
    return;
  }
  
  // 2. Eksik kadroları bul
  console.log('\n📊 Eksik kadrolar analiz ediliyor...');
  
  const { data: allTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country')
    .in('country', PRIORITY_COUNTRIES)
    .order('country');
  
  const { data: existingSquads } = await supabase
    .from('team_squads')
    .select('team_id');
  
  const squadSet = new Set(existingSquads?.map(s => s.team_id) || []);
  const progress = loadProgress();
  const completedSet = new Set(progress.completedTeams);
  
  const missingTeams = allTeams?.filter(t => 
    !squadSet.has(t.api_football_id) && !completedSet.has(t.api_football_id)
  ) || [];
  
  console.log(`📋 Eksik kadro: ${missingTeams.length} takım`);
  
  if (missingTeams.length === 0) {
    console.log('✅ Tüm öncelikli takımların kadrosu mevcut!');
    return;
  }
  
  // 3. Senkronizasyon başlat
  console.log(`\n🔄 Senkronizasyon başlıyor (max ${MAX_API_CALLS_PER_RUN} API call)...\n`);
  
  let synced = 0;
  let failed = 0;
  let noData = 0;
  
  for (const team of missingTeams) {
    if (apiCalls >= MAX_API_CALLS_PER_RUN) {
      console.log('\n⚠️ API call limiti doldu, sonraki çalıştırmada devam edilecek.');
      break;
    }
    
    process.stdout.write(`  ${team.country} | ${team.name}... `);
    
    const result = await syncTeamSquad(team.api_football_id, team.name);
    
    if (result.success) {
      console.log(`✅ ${result.players} oyuncu, TD: ${result.coach || 'Yok'}`);
      synced++;
      progress.completedTeams.push(team.api_football_id);
    } else if (result.reason === 'no_data') {
      console.log('⚠️ API\'de veri yok');
      noData++;
      progress.completedTeams.push(team.api_football_id); // Tekrar deneme
    } else {
      console.log(`❌ ${result.reason}`);
      failed++;
    }
  }
  
  // 4. Progress kaydet
  progress.lastRun = new Date().toISOString();
  saveProgress(progress);
  
  // 5. Özet
  console.log('\n========================================');
  console.log(`✅ Senkronize: ${synced}`);
  console.log(`⚠️ Veri yok: ${noData}`);
  console.log(`❌ Hata: ${failed}`);
  console.log(`📡 API Calls: ${apiCalls}`);
  console.log(`📋 Kalan eksik: ${missingTeams.length - synced - noData - failed}`);
  console.log('========================================');
}

main().catch(console.error);
