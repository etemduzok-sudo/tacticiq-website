const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const footballApi = require('../services/footballApi');

async function fix() {
  console.log('=== WORLD TAKIMLARINI DUZELT ===');
  
  // World olarak kaydedilmiÅŸ tÃ¼m takÄ±mlarÄ± Ã§ek
  const { data: worldTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name, league')
    .eq('country', 'World');
  
  console.log('World takimi:', worldTeams?.length);
  
  // Milli takÄ±mlarÄ± ayÄ±r (bunlar gerÃ§ekten World olmalÄ±)
  const nationalTeamNames = ['Belgium', 'France', 'Croatia', 'Brazil', 'Spain', 'England', 
    'Switzerland', 'Argentina', 'Portugal', 'Netherlands', 'Germany', 'Italy', 'Turkey',
    'Poland', 'Denmark', 'Austria', 'Sweden', 'Norway', 'Finland', 'Greece', 'Scotland',
    'Wales', 'Ireland', 'Czech Republic', 'Ukraine', 'Russia', 'Serbia', 'Colombia',
    'Uruguay', 'Chile', 'Mexico', 'USA', 'Canada', 'Japan', 'South Korea', 'Australia'];
  
  // Milli takÄ±m ve U17/U19/U21 takÄ±mlarÄ±nÄ± atla
  const clubTeams = worldTeams?.filter(t => {
    const isNational = nationalTeamNames.some(n => t.name === n || t.name.startsWith(n + ' U'));
    const isYouth = /U\d+/.test(t.name) && !t.name.includes('FC');
    return !isNational && !isYouth;
  }) || [];
  
  console.log('Kulup takimi (guncellenmeli):', clubTeams.length);
  console.log('');
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < clubTeams.length; i++) {
    const team = clubTeams[i];
    
    try {
      // API'den doÄŸru Ã¼lke bilgisini al
      const teamData = await footballApi.getTeamInfo(team.api_football_id);
      
      if (teamData.response && teamData.response.length > 0) {
        const realCountry = teamData.response[0].team.country;
        
        if (realCountry && realCountry !== 'World') {
          // GÃ¼ncelle
          const { error } = await supabase
            .from('static_teams')
            .update({ country: realCountry })
            .eq('api_football_id', team.api_football_id);
          
          if (!error) {
            updated++;
            if (updated <= 30 || updated % 20 === 0) {
              console.log('[' + updated + '] ' + team.name + ': World -> ' + realCountry);
            }
          } else {
            errors++;
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      errors++;
    }
  }
  
  console.log('');
  console.log('=== TAMAMLANDI ===');
  console.log('Guncellenen:', updated);
  console.log('Hata:', errors);
}

fix();
