#!/usr/bin/env node
/**
 * Coach, Renkler ve Kadrolar güncelleme job'ı
 * - static_teams: coach, colors_primary/colors_secondary (eksik olanlar)
 * - team_squads: 2025 sezon kadrosu (eksik olanlar)
 * Her takım için squadSyncService.syncOneTeamSquad çağrılır (coach + kadro + renkler tek seferde).
 *
 * Kullanım:
 *   node scripts/update-coach-colors-squads.js                    # Varsayılan: max 2000, 600ms, 1 takım
 *   node scripts/update-coach-colors-squads.js --all --delay=600 --concurrency=1   # Hızlı tam doldurma
 *   node scripts/update-coach-colors-squads.js --max=500 --delay=800
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const { syncOneTeamSquad } = require('../services/squadSyncService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEASON = 2025;

function parseArgs() {
  const args = process.argv.slice(2);
  let maxTeams = 2000;
  let delayMs = 600;
  let all = false;
  let concurrency = 1;
  for (const a of args) {
    if (a === '--all') all = true;
    if (a.startsWith('--max=')) maxTeams = Math.max(1, parseInt(a.replace('--max=', ''), 10) || 2000);
    if (a.startsWith('--delay=')) delayMs = Math.max(100, parseInt(a.replace('--delay=', ''), 10) || 600);
    if (a.startsWith('--concurrency=')) concurrency = Math.min(10, Math.max(1, parseInt(a.replace('--concurrency=', ''), 10) || 1));
  }
  if (all) maxTeams = 99999;
  return { maxTeams, delayMs, concurrency };
}

async function getTeamsMissingData() {
  // Coach eksik
  const { data: noCoach } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
    .not('api_football_id', 'is', null);
  const coachIds = new Set((noCoach || []).map(t => t.api_football_id));

  // Renk eksik
  const { data: noColors } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('colors_primary', null)
    .not('api_football_id', 'is', null);
  const colorIds = new Set((noColors || []).map(t => t.api_football_id));

  // 2025 kadro eksik: static_teams'te olup team_squads'da season=2025 kaydı olmayan
  const { data: allTeams } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .not('api_football_id', 'is', null);
  const { data: squads2025 } = await supabase
    .from('team_squads')
    .select('team_id')
    .eq('season', SEASON);
  const hasSquadIds = new Set((squads2025 || []).map(s => s.team_id));
  const noSquad = (allTeams || []).filter(t => !hasSquadIds.has(t.api_football_id));

  const byId = new Map();
  (noCoach || []).forEach(t => byId.set(t.api_football_id, t));
  (noColors || []).forEach(t => byId.set(t.api_football_id, t));
  noSquad.forEach(t => byId.set(t.api_football_id, t));

  const list = Array.from(byId.values());
  const priority = list.map(t => ({
    ...t,
    missing: [coachIds.has(t.api_football_id), colorIds.has(t.api_football_id), !hasSquadIds.has(t.api_football_id)].filter(Boolean).length,
  })).sort((a, b) => b.missing - a.missing);

  return {
    list: priority.map(({ api_football_id, name }) => ({ api_football_id, name })),
    stats: { noCoach: coachIds.size, noColors: colorIds.size, noSquad: noSquad.length },
  };
}

async function main() {
  const { maxTeams, delayMs, concurrency } = parseArgs();

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  COACH + RENKLER + KADROLAR GÜNCELLEME JOB                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  const { list, stats } = await getTeamsMissingData();
  console.log(`  Eksik coach: ${stats.noCoach} | Eksik renk: ${stats.noColors} | Eksik kadro ${SEASON}: ${stats.noSquad}`);
  console.log(`  İşlenecek (tekil) takım: ${list.length} (max: ${maxTeams}, aralık: ${delayMs}ms, eşzamanlı: ${concurrency})`);
  console.log('');

  if (list.length === 0) {
    console.log('  Eksik veri yok. Çıkılıyor.');
    process.exit(0);
  }

  const toProcess = list.slice(0, maxTeams);
  let ok = 0, fail = 0, coachUpdated = 0, colorsUpdated = 0;

  for (let i = 0; i < toProcess.length; i += concurrency) {
    const batch = toProcess.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((t) =>
        syncOneTeamSquad(t.api_football_id, t.name, { syncCoach: true, syncTeamInfo: true })
          .then((r) => ({ ok: true, result: r }))
          .catch((e) => {
            console.warn(`   ⚠ ${t.name || t.api_football_id}: ${e.message}`);
            return { ok: false, result: null };
          })
      )
    );
    for (const r of results) {
      if (r.ok && r.result) {
        if (r.result.ok) ok++;
        else fail++;
        if (r.result.coachUpdated) coachUpdated++;
        if (r.result.colorsUpdated) colorsUpdated++;
      } else fail++;
    }
    const done = Math.min(i + concurrency, toProcess.length);
    if (done % 100 === 0 || done === toProcess.length) {
      console.log(`   [${done}/${toProcess.length}] ok: ${ok}, coach: ${coachUpdated}, renk: ${colorsUpdated}, fail: ${fail}`);
    }
    if (done < toProcess.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  JOB BİTTİ                                                     ║');
  console.log(`║  İşlenen: ${toProcess.length} | Ok: ${ok} | Coach: ${coachUpdated} | Renk: ${colorsUpdated} | Fail: ${fail}`.padEnd(63) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Kalan eksikleri doldurmak için script\'i tekrar çalıştırın veya --all ile tümünü işleyin.');
  console.log('');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
