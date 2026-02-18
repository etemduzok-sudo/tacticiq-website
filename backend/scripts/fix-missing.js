const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const footballApi = require('../services/footballApi');

async function fix() {
  console.log('=== EKSIK TAKIMLARI EKLE ===');
  
  // MaÃ§lardaki tÃ¼m takÄ±mlarÄ± Ã§ek
  const { data: matches } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id')
    .limit(25000);
  
  const matchTeamIds = new Set();
  matches?.forEach(m => {
    if (m.home_team_id) matchTeamIds.add(m.home_team_id);
    if (m.away_team_id) matchTeamIds.add(m.away_team_id);
  });
  
  // DB'deki takÄ±mlar
  const { data: dbTeams } = await supabase
    .from('static_teams')
    .select('api_football_id');
  
  const dbTeamIds = new Set(dbTeams?.map(t => t.api_football_id) || []);
  
  // Eksik olanlar
  const missing = [...matchTeamIds].filter(id => !dbTeamIds.has(id));
  
  console.log('Eksik takÄ±m sayÄ±sÄ±:', missing.length);
  console.log('');
  
  let added = 0;
  let errors = 0;
  
  for (let i = 0; i < missing.length; i++) {
    const teamId = missing[i];
    
    try {
      // API'den takÄ±m bilgisi Ã§ek
      const teamData = await footballApi.getTeamInfo(teamId);
      
      if (!teamData.response || teamData.response.length === 0) {
        console.log('[' + (i+1) + '/' + missing.length + '] TakÄ±m ' + teamId + ' bulunamadÄ±');
        continue;
      }
      
      const team = teamData.response[0].team;
      
      // Coach Ã§ek
      let coach = null;
      let coachId = null;
      try {
        const coachData = await footballApi.getTeamCoach(teamId);
        if (coachData.response && coachData.response.length > 0) {
          const activeCoach = coachData.response.find(c => 
            c.career && c.career.some(car => car.team?.id == teamId && !car.end)
          ) || coachData.response[0];
          coach = activeCoach?.name || null;
          coachId = activeCoach?.id || null;
        }
      } catch (e) { }
      
      // DoÄŸru ÅŸemayla kayÄ±t oluÅŸtur
      const record = {
        api_football_id: team.id,
        name: team.name,
        country: team.country,
        logo_url: team.logo,
        coach: coach,
        coach_api_id: coachId,
        last_updated: new Date().toISOString(),
      };
      
      // Insert
      const { error } = await supabase
        .from('static_teams')
        .insert(record);
      
      if (error) {
        console.log('[' + (i+1) + '/' + missing.length + '] HATA ' + team.name + ':', error.message);
        errors++;
      } else {
        console.log('[' + (i+1) + '/' + missing.length + '] ' + team.name + ' | Coach: ' + (coach || '-'));
        added++;
      }
      
      // Her 100 takÄ±mda durum yazdÄ±r
      if ((i+1) % 100 === 0) {
        console.log('');
        console.log('=== ' + (i+1) + '/' + missing.length + ' tamamlandÄ±, ' + added + ' eklendi ===');
        console.log('');
      }
      
      // Rate limit iÃ§in kÃ¼Ã§Ã¼k bekleme
      await new Promise(r => setTimeout(r, 100));
      
    } catch (e) {
      console.log('[' + (i+1) + '/' + missing.length + '] TakÄ±m ' + teamId + ' hata:', e.message);
      errors++;
    }
  }
  
  console.log('');
  console.log('=== TAMAMLANDI ===');
  console.log('Eklenen:', added);
  console.log('Hata:', errors);
}

fix();
