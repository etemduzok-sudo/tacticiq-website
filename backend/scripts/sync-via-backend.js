/**
 * BACKEND API ÜZERİNDEN TAM SYNC
 * Backend'in mevcut /api/teams/:id/sync endpoint'ini kullanarak
 * tüm öncelikli takımları günceller
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const BACKEND_URL = 'http://localhost:3001';
const DELAY_MS = 3000; // Backend rate limiting için

// Öncelikli ülkeler
const PRIORITY_COUNTRIES = ['Turkey', 'England', 'Spain', 'Italy', 'Germany', 'France'];

function syncTeam(teamId, teamName) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ teamName });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/teams/${teamId}/sync`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });
    
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     BACKEND API ÜZERİNDEN TAM SYNC                               ║');
  console.log('║     (Kadro + Coach + Renkler)                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Öncelikli ülkelerdeki takımları al
  const { data: teams, error } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country')
    .in('country', PRIORITY_COUNTRIES)
    .not('api_football_id', 'is', null);
  
  if (error) {
    console.error('❌ DB hatası:', error.message);
    return;
  }
  
  const uniqueTeams = Array.from(new Map(teams.map(t => [t.api_football_id, t])).values());
  
  console.log(`📋 ${uniqueTeams.length} takım bulundu`);
  console.log(`⏱️  Tahmini süre: ~${Math.round(uniqueTeams.length * DELAY_MS / 60000)} dakika`);
  console.log('');
  
  const stats = { total: uniqueTeams.length, ok: 0, fail: 0, coaches: 0, colors: 0 };
  const startTime = Date.now();
  
  for (let i = 0; i < uniqueTeams.length; i++) {
    const team = uniqueTeams[i];
    const result = await syncTeam(team.api_football_id, team.name);
    
    if (result.success) {
      stats.ok++;
      if (result.data?.coachUpdated) stats.coaches++;
      if (result.data?.colorsUpdated) stats.colors++;
      
      const playerCount = result.data?.playerCount || 0;
      const icon = result.data?.coachUpdated ? '✅' : '⚠️';
      console.log(`${icon} [${i+1}/${uniqueTeams.length}] ${team.name}: ${playerCount} oyuncu${result.data?.coachUpdated ? ' ✔coach' : ''}${result.data?.colorsUpdated ? ' ✔renkler' : ''}`);
    } else {
      stats.fail++;
      console.log(`❌ [${i+1}/${uniqueTeams.length}] ${team.name}: ${result.error || result.message || 'Hata'}`);
    }
    
    // Her 20 takımda ilerleme
    if ((i + 1) % 20 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((elapsed / (i + 1)) * (uniqueTeams.length - i - 1));
      console.log(`\n📊 İlerleme: ${i+1}/${uniqueTeams.length} | OK: ${stats.ok} | Coach: ${stats.coaches} | Kalan: ~${Math.round(remaining/60)} dk\n`);
    }
    
    if (i < uniqueTeams.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                      SYNC TAMAMLANDI                             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Toplam: ${stats.total} | Başarılı: ${stats.ok} | Başarısız: ${stats.fail}`.padEnd(67) + '║');
  console.log(`║  Coach: ${stats.coaches} | Renkler: ${stats.colors}`.padEnd(67) + '║');
  console.log(`║  Süre: ${Math.round(totalTime/60)} dakika`.padEnd(67) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
