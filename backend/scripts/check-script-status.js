// Script durumunu kontrol et
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkScriptStatus() {
  try {
    // Windows'ta çalışan node process'lerini kontrol et
    const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
    
    const lines = stdout.split('\n').filter(l => l.includes('node.exe'));
    console.log(`\n📊 Çalışan Node.js process'leri: ${lines.length - 1}`);
    
    if (lines.length > 1) {
      console.log('✅ Script çalışıyor olabilir');
    } else {
      console.log('⚠️ Node.js process bulunamadı');
    }
    
    // DB durumunu kontrol et
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Hızlı durum kontrolü
    const { count: totalTeams } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: teamsWithCoach } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .not('coach', 'is', null);
    
    const { count: teamsWithColors } = await supabase
      .from('static_teams')
      .select('*', { count: 'exact', head: true })
      .not('colors_primary', 'is', null);
    
    const { count: squads } = await supabase
      .from('team_squads')
      .select('*', { count: 'exact', head: true })
      .eq('season', 2025);
    
    console.log('\n📈 Hızlı DB Durumu:');
    console.log(`   Takımlar: ${totalTeams}`);
    console.log(`   Coach: ${teamsWithCoach}/${totalTeams} (${Math.round(teamsWithCoach/totalTeams*100)}%)`);
    console.log(`   Renkler: ${teamsWithColors}/${totalTeams} (${Math.round(teamsWithColors/totalTeams*100)}%)`);
    console.log(`   Kadrolar: ${squads}`);
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkScriptStatus();
