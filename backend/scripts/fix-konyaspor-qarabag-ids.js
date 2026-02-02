#!/usr/bin/env node
// API-Football v3 ID Migration - Supabase static_teams güncelle
// 2026-02-02: Tüm takım ID'leri API-Football'dan doğrulandı

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('⚠️ Supabase credentials missing - skipping DB migration');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

async function fix() {
  console.log('🔧 API-Football v3 Team ID Migration...\n');
  
  const teams = [
    // Turkish Süper Lig (VERIFIED)
    { api_football_id: 607, name: 'Konyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#FFFFFF'], colors_primary: '#006633', colors_secondary: '#FFFFFF' },
    { api_football_id: 998, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#632134', '#00BFFF'], colors_primary: '#632134', colors_secondary: '#00BFFF' },
    { api_football_id: 564, name: 'Basaksehir', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#F37021', '#000000'], colors_primary: '#F37021', colors_secondary: '#000000' },
    { api_football_id: 3563, name: 'Adana Demirspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#0000FF', '#FFFFFF'], colors_primary: '#0000FF', colors_secondary: '#FFFFFF' },
    { api_football_id: 1005, name: 'Antalyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
    { api_football_id: 1002, name: 'Sivasspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFFFFF'], colors_primary: '#FF0000', colors_secondary: '#FFFFFF' },
    { api_football_id: 1004, name: 'Kasimpasa', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#000066', '#FFFFFF'], colors_primary: '#000066', colors_secondary: '#FFFFFF' },
    { api_football_id: 994, name: 'Goztepe', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FFD700', '#C8102E'], colors_primary: '#FFD700', colors_secondary: '#C8102E' },
    { api_football_id: 1001, name: 'Kayserispor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF0000', '#FFD700'], colors_primary: '#FF0000', colors_secondary: '#FFD700' },
    { api_football_id: 1007, name: 'Rizespor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#0000FF'], colors_primary: '#006633', colors_secondary: '#0000FF' },
    { api_football_id: 3575, name: 'Hatayspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#006633', '#C8102E'], colors_primary: '#006633', colors_secondary: '#C8102E' },
    { api_football_id: 3603, name: 'Samsunspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#FFFFFF'], colors_primary: '#C8102E', colors_secondary: '#FFFFFF' },
    { api_football_id: 3573, name: 'Gaziantep FK', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#C8102E', '#000000'], colors_primary: '#C8102E', colors_secondary: '#000000' },
    { api_football_id: 996, name: 'Alanyaspor', country: 'Turkey', league: 'Süper Lig', league_type: 'domestic_top', team_type: 'club', colors: ['#FF6600', '#006633'], colors_primary: '#FF6600', colors_secondary: '#006633' },
    // Azerbaijan
    { api_football_id: 556, name: 'Qarabag', country: 'Azerbaijan', league: 'Premyer Liqa', league_type: 'domestic_top', team_type: 'club', colors: ['#00AA00', '#FFFFFF'], colors_primary: '#00AA00', colors_secondary: '#FFFFFF' },
    // Argentina (VERIFIED)
    { api_football_id: 451, name: 'Boca Juniors', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#0066B3', '#FFFF00'], colors_primary: '#0066B3', colors_secondary: '#FFFF00' },
    { api_football_id: 460, name: 'San Lorenzo', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#0000FF'], colors_primary: '#E30613', colors_secondary: '#0000FF' },
    { api_football_id: 436, name: 'Racing Club', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#FFFFFF', '#0066B3'], colors_primary: '#FFFFFF', colors_secondary: '#0066B3' },
    { api_football_id: 453, name: 'Independiente', country: 'Argentina', league: 'Liga Profesional', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
    // Brazil (VERIFIED)
    { api_football_id: 1062, name: 'Atletico-MG', country: 'Brazil', league: 'Brasileirao', league_type: 'domestic_top', team_type: 'club', colors: ['#000000', '#FFFFFF'], colors_primary: '#000000', colors_secondary: '#FFFFFF' },
    // Germany (VERIFIED)
    { api_football_id: 160, name: 'SC Freiburg', country: 'Germany', league: 'Bundesliga', league_type: 'domestic_top', team_type: 'club', colors: ['#E2001A', '#000000'], colors_primary: '#E2001A', colors_secondary: '#000000' },
    // Netherlands (VERIFIED)
    { api_football_id: 201, name: 'AZ Alkmaar', country: 'Netherlands', league: 'Eredivisie', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
    { api_football_id: 209, name: 'Feyenoord', country: 'Netherlands', league: 'Eredivisie', league_type: 'domestic_top', team_type: 'club', colors: ['#E30613', '#FFFFFF'], colors_primary: '#E30613', colors_secondary: '#FFFFFF' },
    // Spain (VERIFIED)
    { api_football_id: 534, name: 'Las Palmas', country: 'Spain', league: 'La Liga', league_type: 'domestic_top', team_type: 'club', colors: ['#FFD700', '#0000FF'], colors_primary: '#FFD700', colors_secondary: '#0000FF' },
  ];
  
  let success = 0, failed = 0;
  
  for (const row of teams) {
    const { error } = await supabase.from('static_teams').upsert(row, { 
      onConflict: 'api_football_id',
      ignoreDuplicates: false 
    });
    if (error) {
      console.warn(`   ❌ ${row.name} (${row.api_football_id}): ${error.message}`);
      failed++;
    } else {
      console.log(`   ✅ ${row.name} (${row.api_football_id})`);
      success++;
    }
  }
  
  console.log(`\n✅ Tamamlandı: ${success} başarılı, ${failed} hatalı`);
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
