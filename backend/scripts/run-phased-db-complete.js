#!/usr/bin/env node
/**
 * 1) Takım verisi (Koç + Renk + Kadro) %100 → 2) Rating %100
 * Bir API kullanımı = bir takım için koç + renk + kadro hepsi birlikte çekilir (syncOneTeamSquad).
 * Kullanım: node scripts/run-phased-db-complete.js [--delay=600]
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const LOCK_FILE = path.join(__dirname, '..', 'data', '.phased-db-complete.lock');
function takeLock() {
  try {
    const dataDir = path.dirname(LOCK_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(LOCK_FILE)) {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'), 10);
      try { process.kill(pid, 0); } catch (_) { fs.unlinkSync(LOCK_FILE); }
      if (fs.existsSync(LOCK_FILE)) {
        console.error('Zaten bir phased DB script çalışıyor (PID ' + pid + '). Tek instance yeterli.');
        process.exit(1);
      }
    }
    fs.writeFileSync(LOCK_FILE, String(process.pid));
  } catch (e) {
    console.warn('Lock alınamadı:', e.message);
  }
}
function releaseLock() {
  try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch (_) {}
}

const { createClient } = require('@supabase/supabase-js');
const { syncOneTeamSquad } = require('../services/squadSyncService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEASON = 2025;
const API_DAILY_LIMIT = 75000; // Günlük sorgu limiti (API-Football)
const DELAY_MS = Math.max(400, parseInt(process.argv.find(a => a.startsWith('--delay='))?.replace('--delay=', '') || '1000', 10));
// Takım sync: 1 takım = 1 geçişte koç+renk+kadro (4–6 API çağrısı). Dakikada ~10 takım = 429 önlemek.
const TEAM_SYNC_BATCH_SIZE = 10;
const TEAM_SYNC_PAUSE_AFTER_BATCH_MS = 60000; // 60 sn
const TEAM_SYNC_DELAY_MS = 6000; // Takım başı ~6 sn (içinde 4–6 API var)
const MAX_TEAMS_PER_ROUND = (() => {
  const arg = process.argv.find(a => a.startsWith('--max-teams='));
  return arg ? Math.max(1, parseInt(arg.replace('--max-teams=', ''), 10) || 0) : 0;
})(); // 0 = sınırsız

async function fetchStats() {
  const { count: totalTeams } = await supabase.from('static_teams').select('*', { count: 'exact', head: true });
  const { count: withCoach } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('coach', 'is', null);
  const { count: withColors } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('colors_primary', 'is', null);
  const { count: squads2025 } = await supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', SEASON);

  const { data: ratingSquads } = await supabase
    .from('team_squads')
    .select('team_id, players')
    .eq('season', SEASON)
    .limit(2000);

  let playersWithRating = 0, totalPlayers = 0;
  for (const squad of (ratingSquads || [])) {
    if (Array.isArray(squad.players)) {
      totalPlayers += squad.players.length;
      playersWithRating += squad.players.filter(p => p.rating != null).length;
    }
  }

  const coachPct = totalTeams ? Math.round((withCoach || 0) / totalTeams * 100) : 0;
  const colorsPct = totalTeams ? Math.round((withColors || 0) / totalTeams * 100) : 0;
  const squadsPct = totalTeams ? Math.round((squads2025 || 0) / totalTeams * 100) : 0;
  const ratingPct = totalPlayers > 0 ? Math.round(playersWithRating / totalPlayers * 100) : 0;

  return {
    totalTeams: totalTeams || 0,
    withCoach: withCoach || 0,
    withColors: withColors || 0,
    squads2025: squads2025 || 0,
    playersWithRating,
    totalPlayers,
    coachPct,
    colorsPct,
    squadsPct,
    ratingPct,
  };
}

/** Koç, renk veya kadro eksik olan takımlar. KOÇ EKSİK OLANLAR ÖNCE (raporlarda koç artması için). */
async function getTeamsMissingAny() {
  const pageSize = 1000;
  const noCoachList = [];
  let page = 0;
  while (true) {
    const { data: chunk } = await supabase.from('static_teams').select('api_football_id, name').is('coach', null).not('api_football_id', 'is', null).range(page * pageSize, (page + 1) * pageSize - 1);
    if (!chunk?.length) break;
    noCoachList.push(...chunk);
    if (chunk.length < pageSize) break;
    page++;
  }
  const noColorsList = [];
  page = 0;
  while (true) {
    const { data: chunk } = await supabase.from('static_teams').select('api_football_id, name').is('colors_primary', null).not('api_football_id', 'is', null).range(page * pageSize, (page + 1) * pageSize - 1);
    if (!chunk?.length) break;
    noColorsList.push(...chunk);
    if (chunk.length < pageSize) break;
    page++;
  }
  const { data: squads } = await supabase.from('team_squads').select('team_id').eq('season', SEASON);
  const hasSquad = new Set((squads || []).map(s => s.team_id));
  const noSquadList = [];
  page = 0;
  while (true) {
    const { data: chunk } = await supabase.from('static_teams').select('api_football_id, name').not('api_football_id', 'is', null).range(page * pageSize, (page + 1) * pageSize - 1);
    if (!chunk?.length) break;
    chunk.filter(t => !hasSquad.has(t.api_football_id)).forEach(t => noSquadList.push(t));
    if (chunk.length < pageSize) break;
    page++;
  }
  const noCoachIds = new Set(noCoachList.map(t => t.api_football_id));
  const noColorsIds = new Set(noColorsList.map(t => t.api_football_id));
  const noSquadIds = new Set(noSquadList.map(t => t.api_football_id));
  const byId = new Map();
  noCoachList.forEach(t => byId.set(t.api_football_id, { ...t, missingCoach: true, missingColors: noColorsIds.has(t.api_football_id), missingSquad: noSquadIds.has(t.api_football_id) }));
  noColorsList.forEach(t => { if (!byId.has(t.api_football_id)) byId.set(t.api_football_id, { ...t, missingCoach: false, missingColors: true, missingSquad: noSquadIds.has(t.api_football_id) }); });
  noSquadList.forEach(t => { if (!byId.has(t.api_football_id)) byId.set(t.api_football_id, { ...t, missingCoach: noCoachIds.has(t.api_football_id), missingColors: noColorsIds.has(t.api_football_id), missingSquad: true }); });
  const list = Array.from(byId.values());
  list.sort((a, b) => {
    if (a.missingCoach !== b.missingCoach) return a.missingCoach ? -1 : 1;
    const scoreA = (a.missingColors ? 1 : 0) + (a.missingSquad ? 1 : 0);
    const scoreB = (b.missingColors ? 1 : 0) + (b.missingSquad ? 1 : 0);
    return scoreB - scoreA;
  });
  return list;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** 429 (rate limit) gelirse 60 sn bekleyip tekrar dene, max 2 retry */
async function withRetry429(fn, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const is429 = (e?.response?.status === 429) || (e?.message && String(e.message).includes('429'));
      if (is429 && attempt < retries) {
        console.warn(`   ⏳ Rate limit (429), 60 sn bekleniyor, tekrar denenecek...`);
        await delay(60000);
      } else {
        throw e;
      }
    }
  }
}

// —— Faz 1: Takım verisi (Koç + Renk + Kadro) — 1 takım = 1 sync = hepsi güncellenir ——
async function runTeamDataPhase() {
  console.log('\n╔══ FAZ 1: TAKIM VERİSİ (Koç + Renk + Kadro) %100 ══╗');
  console.log('   Bir API kullanımı = bir takım için koç, renk ve kadro birlikte çekilip DB güncellenir.\n');
  let round = 0;
  while (true) {
    const stats = await fetchStats();
    if ((stats.coachPct >= 100 && stats.colorsPct >= 100 && stats.squadsPct >= 100) || stats.totalTeams === 0) {
      console.log(`   Koç/Renk/Kadro hedefe ulaşıldı (${stats.coachPct}% / ${stats.colorsPct}% / ${stats.squadsPct}%).\n`);
      return;
    }
    const list = await getTeamsMissingAny();
    if (list.length === 0) {
      console.log('   Eksik takım yok.\n');
      return;
    }
    round++;
    const toProcess = MAX_TEAMS_PER_ROUND ? list.slice(0, MAX_TEAMS_PER_ROUND) : list;
    console.log(`   Tur ${round}: ${list.length} takımda eksik var. İşlenecek: ${toProcess.length}${MAX_TEAMS_PER_ROUND ? ' (--max-teams=' + MAX_TEAMS_PER_ROUND + ')' : ''}.`);
    let ok = 0, coachOk = 0, colorsOk = 0;
    for (let i = 0; i < toProcess.length; i++) {
      const t = toProcess[i];
      try {
        const result = await withRetry429(() =>
          syncOneTeamSquad(t.api_football_id, t.name, { syncCoach: true, syncTeamInfo: true })
        );
        if (result.ok) ok++;
        if (result.coachUpdated) coachOk++;
        if (result.colorsUpdated) colorsOk++;
      } catch (e) {
        console.warn(`   ⚠ ${t.name || t.api_football_id}: ${e.message}`);
      }
      if (i < toProcess.length - 1) {
        await delay(TEAM_SYNC_DELAY_MS);
        if ((i + 1) % TEAM_SYNC_BATCH_SIZE === 0) {
          console.log(`   [Takım] ${i + 1}/${toProcess.length} işlendi, ${TEAM_SYNC_PAUSE_AFTER_BATCH_MS / 1000} sn bekleniyor (API limiti)...`);
          await delay(TEAM_SYNC_PAUSE_AFTER_BATCH_MS);
        }
      }
    }
    console.log(`   Güncellenen: ${ok} takım (koç: ${coachOk}, renk: ${colorsOk}).`);
    if (MAX_TEAMS_PER_ROUND) {
      console.log('   --max-teams ile sınırlı run bitti.');
      return;
    }
    await delay(2000);
  }
}

// —— Faz 2: Rating %100 (oyuncu başı API; alt process ile) ——
async function runRatingsPhase() {
  console.log('\n╔══ FAZ 4: RATING %100 ══╗\n');
  let lastRatingPct = -1;
  let noProgressRuns = 0;
  while (true) {
    const stats = await fetchStats();
    if (stats.ratingPct >= 100) {
      console.log(`   Rating: ${stats.ratingPct}% (hedefe ulaşıldı).\n`);
      return;
    }
    if (stats.totalPlayers === 0) {
      console.log('   Rating: Kadroda oyuncu yok, önce kadrolar tamamlanmalı.\n');
      return;
    }
    if (lastRatingPct === stats.ratingPct) noProgressRuns++; else noProgressRuns = 0;
    if (noProgressRuns >= 2) {
      console.log(`   Rating: İlerleme yok (${stats.ratingPct}%). API limiti veya veri bitti. Çıkılıyor.\n`);
      return;
    }
    lastRatingPct = stats.ratingPct;
    console.log(`   Rating şu an: ${stats.ratingPct}%. update-all-player-ratings.js çalıştırılıyor...`);
    await new Promise((resolve, reject) => {
      const child = spawn('node', [path.join(__dirname, 'update-all-player-ratings.js'), '--api'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true,
      });
      child.on('close', code => (code === 0 ? resolve() : resolve()));
      child.on('error', reject);
    });
    await delay(5000);
  }
}

async function main() {
  takeLock();
  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(0); });
  try {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  SIRALI DB TAM DOLDURMA: Takım (Koç+Renk+Kadro) → Rating %100   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`   Günlük API limiti: ${API_DAILY_LIMIT} sorgu. 1 takım sync = koç+renk+kadro birlikte.`);
    const initial = await fetchStats();
    console.log(`   Mevcut: Koç ${initial.coachPct}% | Renk ${initial.colorsPct}% | Kadro ${initial.squadsPct}% | Rating ${initial.ratingPct}%`);
    console.log('');

    await runTeamDataPhase();
    await runRatingsPhase();

    const final = await fetchStats();
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  BİTTİ                                                        ║');
    console.log(`║  Koç: ${String(final.coachPct).padStart(3)}% | Renk: ${String(final.colorsPct).padStart(3)}% | Kadro: ${String(final.squadsPct).padStart(3)}% | Rating: ${String(final.ratingPct).padStart(3)}%`.padEnd(63) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
  } finally {
    releaseLock();
  }
}

main().catch(e => {
  console.error(e);
  releaseLock();
  process.exit(1);
});
