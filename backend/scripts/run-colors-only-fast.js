#!/usr/bin/env node
/**
 * SADECE RENK GÜNCELLEME – 1 API çağrısı / takım (/teams?id=)
 *
 * Koç %100 olduktan sonra renkleri tamamlamak için. Kadro/koç çekilmez.
 *
 * Kullanım:
 *   node scripts/run-colors-only-fast.js
 *   node scripts/run-colors-only-fast.js --delay=400
 *   node scripts/run-colors-only-fast.js --all-teams
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error('Hata: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

const DELAY_MS = Math.max(150, parseInt(process.argv.find(a => a.startsWith('--delay='))?.replace('--delay=', '') || '250', 10));
const ALL_TEAMS = process.argv.includes('--all-teams');

const TRACKED_LEAGUE_TYPES = [
  'domestic_top', 'domestic_cup', 'continental', 'continental_club', 'continental_national',
  'confederation_format', 'global', 'international', 'world_cup', 'continental_championship',
];

const KNOWN_TEAM_COLORS = {
  611: ['#FFED00', '#00205B'], 645: ['#FDB913', '#C41E3A'], 549: ['#000000', '#FFFFFF'],
  564: ['#F26522', '#1E3A5F'], 607: ['#8B0000', '#00205B'], 496: ['#000000', '#FFFFFF'],
  489: ['#AC1E2E', '#000000'], 505: ['#0066B3', '#000000'], 492: ['#87CEEB', '#FFFFFF'],
  497: ['#7B1818', '#FFC425'], 541: ['#FFFFFF', '#00529F'], 529: ['#A50044', '#004D98'],
  530: ['#D81E05', '#FFFFFF'], 50: ['#6CABDD', '#FFFFFF'], 33: ['#DA020E', '#FFE500'],
  40: ['#C8102E', '#FFFFFF'], 42: ['#EF0107', '#FFFFFF'], 49: ['#034694', '#FFFFFF'],
  47: ['#132257', '#FFFFFF'], 157: ['#DC052D', '#FFFFFF'], 165: ['#FDE100', '#000000'],
  85: ['#004170', '#DA291C'],
};

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getTeamsMissingColors() {
  let q = supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('colors_primary', null)
    .not('api_football_id', 'is', null);
  if (!ALL_TEAMS) {
    try {
      const { error } = await supabase.from('static_teams').select('league_type').limit(1).maybeSingle();
      if (!error) q = q.in('league_type', TRACKED_LEAGUE_TYPES);
    } catch (_) {}
  }
  const { data } = await q.order('api_football_id', { ascending: true });
  return data || [];
}

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  SADECE RENK GÜNCELLEME (1 API / takım – koç/kadro yok)            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`   Gecikme: ${DELAY_MS}ms | ${ALL_TEAMS ? 'Tüm takımlar' : 'Sadece izlenen ligler'}`);
  console.log('');

  const list = await getTeamsMissingColors();
  if (list.length === 0) {
    console.log('   Eksik renk yok. Çıkılıyor.');
    process.exit(0);
  }

  console.log(`   Renk eksik: ${list.length} takım. Başlıyor...\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    try {
      const teamInfo = await footballApi.getTeamInfo(t.api_football_id);
      const raw = teamInfo?.response?.[0];
      let colors = raw ? await footballApi.getTeamColors(t.api_football_id, raw).catch(() => null) : null;
      if (!colors?.length || colors[0] === '#333333') colors = KNOWN_TEAM_COLORS[t.api_football_id];
      if (!colors?.length) colors = ['#1a1a2e', '#334155'];

      const { error } = await supabase
        .from('static_teams')
        .update({
          colors: JSON.stringify(colors),
          colors_primary: colors[0],
          colors_secondary: colors[1] || colors[0],
          last_updated: new Date().toISOString(),
        })
        .eq('api_football_id', t.api_football_id);
      if (!error) updated++; else notFound++;
    } catch (e) {
      errors++;
      if (errors <= 5) console.warn(`   ⚠ ${t.name || t.api_football_id}: ${e.message}`);
    }

    if ((i + 1) % 50 === 0) {
      console.log(`   [${i + 1}/${list.length}] Güncellenen: ${updated} | Hata: ${errors}`);
    }

    if (i < list.length - 1) await delay(DELAY_MS);
  }

  console.log('');
  console.log('   Bitti. Güncellenen: ' + updated + ' | Hata: ' + errors);
  console.log('');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
