// Qarabag'ın bugünkü maçını API'den bul
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const footballApi = require('../services/footballApi');
const { supabase } = require('../config/supabase');

async function main() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  console.log(`🔍 Bugünün tarihinde (${today}) Qarabag maçını arıyorum...\n`);
  
  // Qarabag'ın tüm maçlarını çek (team ID: 556)
  try {
    const data = await footballApi.getFixturesByTeam(556, 2025); // 2025-26 sezonu
    const matches = data.response || [];
    
    console.log(`📊 Toplam ${matches.length} maç bulundu\n`);
    
    // Bugünkü maçları filtrele
    const todayMatches = matches.filter(m => {
      const matchDate = new Date(m.fixture.date).toISOString().split('T')[0];
      return matchDate === today;
    });
    
    console.log(`🔴 Bugünkü maçlar (${today}):\n`);
    
    if (todayMatches.length === 0) {
      console.log('  Bugün maç yok!');
      
      // Son 3 günün maçlarını göster
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentMatches = matches.filter(m => {
        const matchDate = new Date(m.fixture.date).toISOString().split('T')[0];
        return matchDate >= threeDaysAgo && matchDate <= today;
      });
      
      console.log(`\n📅 Son 3 günün maçları:\n`);
      for (const m of recentMatches) {
        console.log(`  ID: ${m.fixture.id}`);
        console.log(`  ${m.teams.home.name} vs ${m.teams.away.name}`);
        console.log(`  Tarih: ${new Date(m.fixture.date).toLocaleString('tr-TR')}`);
        console.log(`  Statü: ${m.fixture.status.short} (${m.fixture.status.long})`);
        console.log(`  Skor: ${m.goals?.home ?? '-'} - ${m.goals?.away ?? '-'}`);
        console.log('');
      }
    } else {
      for (const m of todayMatches) {
        console.log(`  ID: ${m.fixture.id}`);
        console.log(`  ${m.teams.home.name} vs ${m.teams.away.name}`);
        console.log(`  Tarih: ${new Date(m.fixture.date).toLocaleString('tr-TR')}`);
        console.log(`  Statü: ${m.fixture.status.short} (${m.fixture.status.long})`);
        console.log(`  Skor: ${m.goals?.home ?? '-'} - ${m.goals?.away ?? '-'}`);
        console.log('');
        
        // DB'yi güncelle
        console.log('  🔄 DB güncelleniyor...');
        const { error } = await supabase
          .from('matches')
          .upsert({
            id: m.fixture.id,
            fixture_date: m.fixture.date,
            fixture_timestamp: m.fixture.timestamp,
            status: m.fixture.status.short,
            status_long: m.fixture.status.long,
            elapsed: m.fixture.status.elapsed,
            home_team_id: m.teams.home.id,
            away_team_id: m.teams.away.id,
            home_score: m.goals?.home,
            away_score: m.goals?.away,
            league_id: m.league.id,
            season: m.league.season,
            round: m.league.round,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (error) {
          console.log(`  ❌ Hata: ${error.message}`);
        } else {
          console.log(`  ✅ DB güncellendi!`);
        }
      }
    }
  } catch (err) {
    console.error('❌ API hatası:', err.message);
  }
  
  console.log('\n✅ Tamamlandı!');
  process.exit(0);
}

main().catch(console.error);
