/**
 * Mevcut kadrolara teknik direktör bilgisi ekle
 * team_data.coach eksik olan tüm kayıtları günceller
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const API_KEY = process.env.FOOTBALL_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const MAX_API = 6000;
const RATE_MS = 200;
let apiCalls = 0;

const PROGRESS_FILE = require('path').join(__dirname, '..', 'data', 'coach-backfill-progress.json');

async function fetchCoach(teamId) {
  if (apiCalls >= MAX_API) return null;
  apiCalls++;
  
  try {
    const res = await fetch(`https://v3.football.api-sports.io/coachs?team=${teamId}`, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      }
    });
    const data = await res.json();
    await new Promise(r => setTimeout(r, RATE_MS));
    
    const coach = data.response?.find(c => 
      c.career?.some(car => car.team?.id === teamId && !car.end)
    );
    return coach?.name || null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🔧 Teknik Direktör Backfill Başlıyor...\n');
  
  const { data: squads } = await supabase
    .from('team_squads')
    .select('team_id, team_name, team_data');
  
  const needCoach = squads?.filter(s => !s.team_data?.coach) || [];
  console.log(`📊 Coach eksik kadro: ${needCoach.length}/${squads?.length || 0}\n`);
  
  const fs = require('fs');
  let doneIds = new Set();
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      doneIds = new Set(p.doneIds || []);
      console.log(`🔄 Kaldığı yerden: ${doneIds.size} zaten tamamlandı\n`);
    }
  } catch (e) {}
  
  const toProcess = needCoach.filter(r => !doneIds.has(r.team_id));
  let updated = 0;
  for (const row of toProcess) {
    if (apiCalls >= MAX_API) {
      console.log('\n⚠️ API limit doldu');
      break;
    }
    
    const coach = await fetchCoach(row.team_id);
    const newTeamData = { ...(row.team_data || {}), id: row.team_id, name: row.team_name, coach };
    
    const { error } = await supabase
      .from('team_squads')
      .update({ team_data: newTeamData, updated_at: new Date().toISOString() })
      .eq('team_id', row.team_id)
      .eq('season', 2025);
    
    if (!error) {
      updated++;
      doneIds.add(row.team_id);
      if (updated % 50 === 0) {
        console.log(`   ✅ ${updated} güncellendi...`);
        try {
          fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ doneIds: [...doneIds], updatedAt: new Date().toISOString() }));
        } catch (e) {}
      }
    }
  }
  
  try {
    if (require('fs').existsSync(PROGRESS_FILE)) require('fs').unlinkSync(PROGRESS_FILE);
  } catch (e) {}
  console.log(`\n✅ Tamamlandı: ${updated} kadroya coach eklendi`);
  console.log(`📡 API Calls: ${apiCalls}`);
}

main().catch(console.error);
