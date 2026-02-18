// Qarabag maçlarının durumunu kontrol et
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { supabase } = require('../config/supabase');
const footballApi = require('../services/footballApi');

async function main() {
  console.log('🔍 Qarabag maçlarını kontrol ediyorum...\n');
  
  // 1. DB'den Qarabag maçlarını çek
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, fixture_date, fixture_timestamp, status, status_long, elapsed, home_score, away_score, home_team_id, away_team_id')
    .or('home_team_id.eq.556,away_team_id.eq.556') // Qarabag ID: 556
    .order('fixture_timestamp', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ DB hatası:', error);
    return;
  }
  
  console.log(`📊 DB'de ${matches.length} Qarabag maçı bulundu:\n`);
  
  for (const m of matches) {
    const date = new Date(m.fixture_timestamp * 1000);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    console.log(`  ID: ${m.id}`);
    console.log(`  Tarih: ${date.toLocaleString('tr-TR')}`);
    console.log(`  Statü: ${m.status} (${m.status_long || '-'})`);
    console.log(`  Skor: ${m.home_score ?? '-'} - ${m.away_score ?? '-'}`);
    console.log(`  Elapsed: ${m.elapsed ?? '-'}`);
    console.log(`  ${diffMins > 0 ? `${diffMins} dakika önce başladı` : `${-diffMins} dakika sonra başlayacak`}`);
    console.log('');
  }
  
  // 2. Bugünün Qarabag maçını API'den kontrol et
  const todayMatches = matches.filter(m => {
    const matchDate = new Date(m.fixture_timestamp * 1000);
    const today = new Date();
    return matchDate.toDateString() === today.toDateString();
  });
  
  if (todayMatches.length > 0) {
    console.log('\n🔄 Bugünkü maçı API\'den güncelleyeceğim...\n');
    
    for (const m of todayMatches) {
      try {
        const apiData = await footballApi.getFixtureDetails(m.id, true); // skipCache
        if (apiData.response && apiData.response.length > 0) {
          const apiMatch = apiData.response[0];
          console.log(`  API Status: ${apiMatch.fixture.status.short} (${apiMatch.fixture.status.long})`);
          console.log(`  API Elapsed: ${apiMatch.fixture.status.elapsed}`);
          console.log(`  API Score: ${apiMatch.goals?.home} - ${apiMatch.goals?.away}`);
          
          // DB'yi güncelle
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              status: apiMatch.fixture.status.short,
              status_long: apiMatch.fixture.status.long,
              elapsed: apiMatch.fixture.status.elapsed,
              home_score: apiMatch.goals?.home,
              away_score: apiMatch.goals?.away,
              updated_at: new Date().toISOString()
            })
            .eq('id', m.id);
          
          if (updateError) {
            console.error(`  ❌ Güncelleme hatası:`, updateError);
          } else {
            console.log(`  ✅ DB güncellendi!`);
          }
        } else {
          console.log(`  ⚠️ API'den veri gelmedi`);
        }
      } catch (err) {
        console.error(`  ❌ API hatası:`, err.message);
      }
    }
  }
  
  console.log('\n✅ Kontrol tamamlandı!');
  process.exit(0);
}

main().catch(console.error);
