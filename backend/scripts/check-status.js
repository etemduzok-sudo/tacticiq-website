const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    GÜNCEL DB DURUMU                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  
  // TAKIMLAR
  const { count: totalTeams } = await supabase.from('static_teams').select('*', { count: 'exact', head: true });
  const { count: withCoach } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('coach', 'is', null);
  const { count: withColors } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('colors_primary', 'is', null);
  
  console.log('║                                                                   ║');
  console.log('║  TAKIMLAR                                                         ║');
  console.log('║    Toplam:            ' + totalTeams.toString().padEnd(8) + '                                ║');
  console.log('║    Coach ile:         ' + withCoach.toString().padEnd(8) + ' (' + Math.round(withCoach/totalTeams*100) + '%)                          ║');
  console.log('║    Renkler ile:       ' + withColors.toString().padEnd(8) + ' (' + Math.round(withColors/totalTeams*100) + '%)                          ║');
  console.log('║    Eksik Coach:       ' + (totalTeams - withCoach).toString().padEnd(8) + '                                ║');
  console.log('║    Eksik Renk:        ' + (totalTeams - withColors).toString().padEnd(8) + '                                ║');
  
  // KADROLAR
  const { count: squads2025 } = await supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', 2025);
  
  console.log('║                                                                   ║');
  console.log('║  KADROLAR                                                         ║');
  console.log('║    2025 sezonu:       ' + squads2025.toString().padEnd(8) + '                                ║');
  console.log('║    Eksik kadro:       ' + (totalTeams - squads2025).toString().padEnd(8) + '                                ║');
  console.log('║    Kadro tamamlanma:  ' + Math.round(squads2025/totalTeams*100).toString().padEnd(5) + '%                                ║');
  
  // RATING - Detaylı kontrol
  const { data: ratingSquads } = await supabase
    .from('team_squads')
    .select('team_id, players')
    .eq('season', 2025)
    .limit(2000);
  
  let teamsWithRating = 0;
  let playersWithRating = 0;
  let totalPlayers = 0;
  
  for (const squad of (ratingSquads || [])) {
    if (Array.isArray(squad.players)) {
      totalPlayers += squad.players.length;
      const withRating = squad.players.filter(p => p.rating !== undefined && p.rating !== null);
      if (withRating.length > 0) {
        teamsWithRating++;
        playersWithRating += withRating.length;
      }
    }
  }
  
  console.log('║                                                                   ║');
  console.log('║  RATING/SKILL                                                     ║');
  console.log('║    Takım (rating):    ' + teamsWithRating.toString().padEnd(8) + '                                ║');
  console.log('║    Oyuncu (rating):   ' + playersWithRating.toString().padEnd(8) + '                                ║');
  console.log('║    Toplam oyuncu:     ' + totalPlayers.toString().padEnd(8) + '                                ║');
  console.log('║    Rating tamamlanma: ' + (totalPlayers > 0 ? Math.round(playersWithRating/totalPlayers*100).toString().padEnd(5) : '0').padEnd(5) + '%                                ║');
  
  // MACLAR
  const { count: totalMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  const now = new Date().toISOString();
  const { count: futureMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).gte('fixture_date', now);
  
  console.log('║                                                                   ║');
  console.log('║  MACLAR                                                           ║');
  console.log('║    Toplam:            ' + totalMatches.toString().padEnd(8) + '                                ║');
  console.log('║    Gelecek:           ' + futureMatches.toString().padEnd(8) + '                                ║');
  
  // MILLI TAKIMLAR
  const { count: nationalWithCoach } = await supabase
    .from('static_teams')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'World')
    .not('coach', 'is', null);
  
  const { count: nationalTotal } = await supabase
    .from('static_teams')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'World');
  
  console.log('║                                                                   ║');
  console.log('║  MILLI TAKIMLAR                                                   ║');
  console.log('║    Toplam:            ' + nationalTotal.toString().padEnd(8) + '                                ║');
  console.log('║    Coach ile:         ' + nationalWithCoach.toString().padEnd(8) + ' (' + Math.round(nationalWithCoach/nationalTotal*100) + '%)                          ║');
  
  // ÖZET
  console.log('║                                                                   ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log('║  GENEL TAMAMLANMA ORANI                                           ║');
  const coachPct = Math.round(withCoach/totalTeams*100);
  const colorsPct = Math.round(withColors/totalTeams*100);
  const squadsPct = Math.round(squads2025/totalTeams*100);
  const ratingPct = totalPlayers > 0 ? Math.round(playersWithRating/totalPlayers*100) : 0;
  const avgPct = Math.round((coachPct + colorsPct + squadsPct + ratingPct) / 4);
  
  console.log('║    Coach:             ' + coachPct.toString().padEnd(5) + '%                                ║');
  console.log('║    Renkler:           ' + colorsPct.toString().padEnd(5) + '%                                ║');
  console.log('║    Kadrolar:          ' + squadsPct.toString().padEnd(5) + '%                                ║');
  console.log('║    Rating:            ' + ratingPct.toString().padEnd(5) + '%                                ║');
  console.log('║    ORTALAMA:          ' + avgPct.toString().padEnd(5) + '%                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
}

check();
