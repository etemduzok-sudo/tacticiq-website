#!/usr/bin/env node
/**
 * SADECE KOÇ GÜNCELLEME – 1 API çağrısı / takım
 *
 * ⚠ Koç %100 olduktan sonra bu script'i ÇALIŞTIRMAYIN. Renkler için: node scripts/run-colors-only-fast.js
 *
 * API-Football'da "tüm koçları tek sorguda çekmek" YOK; sadece /coachs?team={id} var.
 * Bu script sadece koç çeker (kadro/renk yok) → 1 istek/takım.
 *
 * Kullanım:
 *   node scripts/run-coach-only-fast.js              # delay=250ms, izlenen ligler
 *   node scripts/run-coach-only-fast.js --delay=400
 *   node scripts/run-coach-only-fast.js --all-teams  # tüm takımlar
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const { selectActiveCoach } = require('../utils/selectActiveCoach');

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

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getTeamsMissingCoach() {
  let q = supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
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
  console.log('║  SADECE KOÇ GÜNCELLEME (1 API / takım – kadro/renk yok)         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`   Gecikme: ${DELAY_MS}ms | ${ALL_TEAMS ? 'Tüm takımlar' : 'Sadece izlenen ligler'}`);
  console.log('');

  const list = await getTeamsMissingCoach();
  if (list.length === 0) {
    console.log('   Eksik koç yok. Çıkılıyor.');
    process.exit(0);
  }

  console.log(`   Koç eksik: ${list.length} takım. Başlıyor...\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    try {
      const coachData = await footballApi.getTeamCoach(t.api_football_id);
      const response = coachData?.response;
      if (!response || response.length === 0) {
        notFound++;
      } else {
        const selected = selectActiveCoach(response, t.api_football_id);
        if (selected) {
          const { error } = await supabase
            .from('static_teams')
            .update({
              coach: selected.name,
              coach_api_id: selected.id,
              last_updated: new Date().toISOString(),
            })
            .eq('api_football_id', t.api_football_id);
          if (!error) updated++;
        } else {
          notFound++;
        }
      }
    } catch (e) {
      errors++;
      if (errors <= 5) console.warn(`   ⚠ ${t.name || t.api_football_id}: ${e.message}`);
    }

    if ((i + 1) % 50 === 0) {
      console.log(`   [${i + 1}/${list.length}] Güncellenen: ${updated} | Bulunamadı: ${notFound} | Hata: ${errors}`);
    }

    if (i < list.length - 1) await delay(DELAY_MS);
  }

  console.log('');
  console.log('   Bitti. Güncellenen: ' + updated + ' | Bulunamadı: ' + notFound + ' | Hata: ' + errors);
  console.log('');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
