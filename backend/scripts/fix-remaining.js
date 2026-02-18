const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const footballApi = require('../services/footballApi');

async function fix() {
  console.log('=== KALAN EKSIK TAKIMLARI EKLE ===');
  
  // TÃ¼m takÄ±mlarÄ± Ã§ek
  let allDbTeams = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from('static_teams').select('api_football_id').range(from, from + 999);
    if (!data || data.length === 0) break;
    allDbTeams = allDbTeams.concat(data);
    from += 1000;
    if (data.length < 1000) break;
  }
  const dbTeamIds = new Set(allDbTeams.map(t => t.api_football_id));
  console.log('DB deki takim:', dbTeamIds.size);
  
  // TÃ¼m maÃ§larÄ± Ã§ek
  let allMatches = [];
  from = 0;
  while (true) {
    const { data } = await supabase.from('matches').select('home_team_id, away_team_id').range(from, from + 999);
    if (!data || data.length === 0) break;
    allMatches = allMatches.concat(data);
    from += 1000;
    if (data.length < 1000) break;
  }
  
  const matchTeamIds = new Set();
  allMatches.forEach(m => {
    if (m.home_team_id) matchTeamIds.add(m.home_team_id);
    if (m.away_team_id) matchTeamIds.add(m.away_team_id);
  });
  
  const missing = [...matchTeamIds].filter(id => !dbTeamIds.has(id));
  console.log('Eksik takim:', missing.length);
  
  let added = 0, errors = 0;
  
  for (let i = 0; i < missing.length; i++) {
    const teamId = missing[i];
    
    try {
      const teamData = await footballApi.getTeamInfo(teamId);
      if (!teamData.response || teamData.response.length === 0) {
        continue;
      }
      
      const team = teamData.response[0].team;
      
      let coach = null, coachId = null;
      try {
        const coachData = await footballApi.getTeamCoach(teamId);
        if (coachData.response && coachData.response.length > 0) {
          const activeCoach = coachData.response.find(c => 
            c.career && c.career.some(car => car.team?.id == teamId && !car.end)
          ) || coachData.response[0];
          coach = activeCoach?.name || null;
          coachId = activeCoach?.id || null;
        }
      } catch (e) {}
      
      // Country null olabilir, "Unknown" yap
      const { error } = await supabase.from('static_teams').insert({
        api_football_id: team.id,
        name: team.name,
        country: team.country || 'Unknown',
        logo_url: team.logo,
        coach: coach,
        coach_api_id: coachId,
        last_updated: new Date().toISOString(),
      });
      
      if (error && !error.message.includes('duplicate')) {
        errors++;
      } else if (!error) {
        added++;
        if (teamId === 7411 || (i+1) % 200 === 0) {
          console.log('[' + (i+1) + '/' + missing.length + '] ' + team.name + (teamId === 7411 ? ' âœ“ KOCAELISPOR' : ''));
        }
      }
      
      await new Promise(r => setTimeout(r, 30));
    } catch (e) {
      errors++;
    }
  }
  
  console.log('');
  console.log('=== TAMAMLANDI ===');
  console.log('Eklenen:', added);
  console.log('Hata:', errors);
}

fix();
