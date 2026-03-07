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
/** Bugün DB sync kapalı; kalan API canlı maç için. Bu dosyayı silince sync tekrar çalışır. */
const PAUSE_FILE = path.join(__dirname, '..', 'data', '.db-sync-paused');
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
const { syncOneTeamSquad, cleanupOrphanedSquads } = require('../services/squadSyncService');
const footballApi = require('../services/footballApi');

const API_USAGE_FILE = path.join(__dirname, '..', 'data', 'api-usage-now.json');
const API_USAGE_SERVER_FILE = path.join(__dirname, '..', 'data', 'api-usage-from-server.json');
const API_DAILY_LIMIT_TOTAL = 75000;
const API_MAX_USE = 40000;
const API_RESERVE_FOR_LIVE = API_DAILY_LIMIT_TOTAL - API_MAX_USE;
function getServerUsage() {
  try {
    if (fs.existsSync(API_USAGE_SERVER_FILE)) {
      const s = JSON.parse(fs.readFileSync(API_USAGE_SERVER_FILE, 'utf8'));
      return { used: s.used ?? 0, remaining: s.remaining ?? API_DAILY_LIMIT_TOTAL, limit: s.limit ?? API_DAILY_LIMIT_TOTAL };
    }
  } catch (_) {}
  return { used: 0, remaining: API_DAILY_LIMIT_TOTAL, limit: API_DAILY_LIMIT_TOTAL };
}
function shouldStopForReserve() {
  const s = getServerUsage();
  return s.used >= API_MAX_USE || s.remaining <= API_RESERVE_FOR_LIVE;
}
const API_USAGE_INTERVAL_MS = 5 * 60 * 1000; // 5 dk'da bir dosyaya yaz
const PROGRESS_TXT_FILE = path.join(__dirname, '..', 'data', 'db-update-progress.txt');

function writeApiUsage() {
  try {
    const stats = footballApi.getCacheStats ? footballApi.getCacheStats() : null;
    const count = stats ? (stats.requestCount ?? 0) : 0;
    const dataDir = path.dirname(API_USAGE_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(API_USAGE_FILE, JSON.stringify({
      count,
      limit: API_DAILY_LIMIT_TOTAL,
      maxUse: API_MAX_USE,
      reserveLive: API_RESERVE_FOR_LIVE,
      at: new Date().toISOString(),
    }, null, 0));
  } catch (e) { /* ignore */ }
}

// Progress artık tek dosyada: db-status-report.txt (db-status-report-every-5min.js tarafından yazılır)
async function writeProgressTxt() { /* no-op */ }

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error('Hata: .env icinde SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (veya SUPABASE_ANON_KEY) gerekli.');
  process.exit(1);
}
const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

const SEASON = 2025;
const DELAY_MS = Math.max(400, parseInt(process.argv.find(a => a.startsWith('--delay='))?.replace('--delay=', '') || '1000', 10));
// Takım sync: 1 takım = 1 geçişte koç+renk+kadro (4–6 API çağrısı). --delay= ile ayarlanır.
const TEAM_SYNC_BATCH_SIZE = 50;   // 30→50: daha az duraklama
const TEAM_SYNC_PAUSE_AFTER_BATCH_MS = 2000;  // 5sn→2sn: batch arası bekleme kısaltıldı
const TEAM_SYNC_DELAY_MS = Math.max(300, parseInt(process.argv.find(a => a.startsWith('--delay='))?.replace('--delay=', '') || '350', 10));
const MAX_TEAMS_PER_ROUND = (() => {
  const arg = process.argv.find(a => a.startsWith('--max-teams='));
  return arg ? Math.max(1, parseInt(arg.replace('--max-teams=', ''), 10) || 0) : 0;
})(); // 0 = sınırsız

async function fetchStats() {
  const scopeIds = await getInScopeTeamIds();

  // Kapsam dahili takım sayılarını client-side say (scope null = tümü)
  let totalTeams = 0, withCoach = 0, withColors = 0;
  const PAGE = 1000;
  let off = 0;
  while (true) {
    const { data } = await supabase.from('static_teams')
      .select('api_football_id, coach, colors_primary')
      .range(off, off + PAGE - 1);
    if (!data || !data.length) break;
    for (const t of data) {
      if (scopeIds && !scopeIds.has(t.api_football_id)) continue;
      totalTeams++;
      if (t.coach) withCoach++;
      if (t.colors_primary) withColors++;
    }
    if (data.length < PAGE) break;
    off += PAGE;
  }

  let squads2025 = 0, playersWithRating = 0, totalPlayers = 0;
  off = 0;
  while (true) {
    const { data: ratingSquads } = await supabase
      .from('team_squads')
      .select('team_id, players')
      .eq('season', SEASON)
      .order('team_id', { ascending: true })
      .range(off, off + 500 - 1);
    if (!ratingSquads?.length) break;
    for (const squad of ratingSquads) {
      if (scopeIds && !scopeIds.has(squad.team_id)) continue;
      squads2025++;
      if (Array.isArray(squad.players)) {
        totalPlayers += squad.players.length;
        playersWithRating += squad.players.filter(p => p.rating != null).length;
      }
    }
    if (ratingSquads.length < 500) break;
    off += 500;
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

const ALL_TEAMS = process.argv.includes('--all-teams');

// Kapsam dahili takım ID seti (lig adı + ülke eşleşmesi ile belirlenir)
let _inScopeTeamIds = null;
async function getInScopeTeamIds() {
  if (_inScopeTeamIds) return _inScopeTeamIds;
  if (ALL_TEAMS) {
    console.warn('   [--all-teams] Tüm takımlar işlenecek.');
    _inScopeTeamIds = null;
    return null;
  }
  const { getAllTrackedLeagues } = require('../config/leaguesScope');
  const trackedLeagues = getAllTrackedLeagues();
  const leagueNameCountryPairs = new Set(trackedLeagues.map(l => l.name + '|' + l.country));
  const trackedTypes = new Set(['international', 'global', 'continental_club', 'continental_national', 'confederation_format']);

  const ids = new Set();
  const PAGE = 1000;
  let off = 0;
  while (true) {
    const { data } = await supabase.from('static_teams')
      .select('api_football_id, league, country, league_type, team_type')
      .range(off, off + PAGE - 1);
    if (!data || !data.length) break;
    for (const t of data) {
      const key = (t.league || '') + '|' + (t.country || '');
      if (leagueNameCountryPairs.has(key) || trackedTypes.has(t.league_type) || t.team_type === 'national') {
        ids.add(t.api_football_id);
      }
    }
    if (data.length < PAGE) break;
    off += PAGE;
  }
  _inScopeTeamIds = ids;
  console.log(`   Kapsam dahili takım: ${ids.size}`);
  return ids;
}

async function getTeamsMissingAny(stats) {
  const scopeIds = await getInScopeTeamIds();
  const isInScope = (id) => !scopeIds || scopeIds.has(id);

  const pageSize = 1000;
  const hasSquad = new Set();
  let squadOffset = 0;
  while (true) {
    const { data: squadChunk } = await supabase.from('team_squads').select('team_id').eq('season', SEASON).order('team_id', { ascending: true }).range(squadOffset, squadOffset + pageSize - 1);
    if (!squadChunk?.length) break;
    squadChunk.forEach((r) => hasSquad.add(r.team_id));
    if (squadChunk.length < pageSize) break;
    squadOffset += pageSize;
  }
  const noSquadList = [];
  let lastTeamId = null;
  while (true) {
    let q = supabase.from('static_teams').select('api_football_id, name').not('api_football_id', 'is', null).order('api_football_id', { ascending: true }).limit(pageSize);
    if (lastTeamId != null) q = q.gt('api_football_id', lastTeamId);
    const { data: chunk, error } = await q;
    if (error) { console.warn('   getTeamsMissingAny noSquad sayfa hatasi:', error.message); break; }
    if (!chunk?.length) break;
    chunk.filter((t) => isInScope(t.api_football_id) && !hasSquad.has(t.api_football_id)).forEach((t) => noSquadList.push(t));
    lastTeamId = chunk[chunk.length - 1]?.api_football_id;
    if (chunk.length < pageSize) break;
  }
  if (stats && (stats.coachPct || 0) >= 100 && (stats.colorsPct || 0) >= 100) {
    return noSquadList.map((t) => ({ ...t, missingCoach: false, missingColors: false, missingSquad: true }));
  }

  const noCoachList = [];
  let page = 0;
  while (true) {
    let q = supabase.from('static_teams').select('api_football_id, name').is('coach', null).not('api_football_id', 'is', null);
    const { data: chunk } = await q.range(page * pageSize, (page + 1) * pageSize - 1);
    if (!chunk?.length) break;
    noCoachList.push(...chunk.filter(t => isInScope(t.api_football_id)));
    if (chunk.length < pageSize) break;
    page++;
  }
  const noColorsList = [];
  page = 0;
  while (true) {
    let q = supabase.from('static_teams').select('api_football_id, name').is('colors_primary', null).not('api_football_id', 'is', null);
    const { data: chunk } = await q.range(page * pageSize, (page + 1) * pageSize - 1);
    if (!chunk?.length) break;
    noColorsList.push(...chunk.filter(t => isInScope(t.api_football_id)));
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
    if (a.missingColors !== b.missingColors) return a.missingColors ? -1 : 1;
    if (a.missingCoach !== b.missingCoach) return a.missingCoach ? -1 : 1;
    return (b.missingSquad ? 1 : 0) - (a.missingSquad ? 1 : 0);
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
  console.log('   Kadrosu DOLU takımlar: hafif sync (sadece koç+renk, 2 API/takım). Kadrosu EKSİK: tam sync.');
  console.log('   Guncelleme kotasi: ' + API_MAX_USE + "; kalan " + API_RESERVE_FOR_LIVE + " API 10 sn'de bir canli mac icin.\n");
  let round = 0;
  while (true) {
    if (shouldStopForReserve()) {
      const s = getServerUsage();
      console.log(`\n   ⏹ KOTA: ${s.used} / ${API_MAX_USE} kullanildi. Kalan ${API_RESERVE_FOR_LIVE} canli mac icin, script durduruluyor.`);
      return;
    }
    const stats = await fetchStats();
    if ((stats.coachPct >= 100 && stats.colorsPct >= 100 && stats.squadsPct >= 100) || stats.totalTeams === 0) {
      console.log(`   Koç/Renk/Kadro hedefe ulaşıldı (${stats.coachPct}% / ${stats.colorsPct}% / ${stats.squadsPct}%).\n`);
      return;
    }
    const list = await getTeamsMissingAny(stats);
    if (list.length === 0) {
      console.log('   Eksik takım yok (Kadro %100 veya listede yok). Faz 1 bitti.\n');
      return;
    }
    round++;
    const toProcess = MAX_TEAMS_PER_ROUND ? list.slice(0, MAX_TEAMS_PER_ROUND) : list;
    const kadroEksik = list.filter((t) => t.missingSquad).length;
    const onlySquad = (stats.coachPct >= 100 && stats.colorsPct >= 100);
    console.log(`   Tur ${round}: ${list.length} takımda eksik var (kadro eksik: ${kadroEksik}). İşlenecek: ${toProcess.length}${MAX_TEAMS_PER_ROUND ? ' (--max-teams=' + MAX_TEAMS_PER_ROUND + ')' : ''}${onlySquad ? ' [sadece kadro - API kadroya odakli]' : ''}.`);
    let ok = 0, coachOk = 0, colorsOk = 0, noData = 0;
    for (let i = 0; i < toProcess.length; i++) {
      if (shouldStopForReserve()) {
        console.log(`\n   ⏹ KOTA: ${API_MAX_USE} kullanildi. Script durduruluyor.`);
        return;
      }
      const t = toProcess[i];
      const lightSync = !t.missingSquad;
      try {
        const result = await withRetry429(() =>
          syncOneTeamSquad(t.api_football_id, t.name, {
            syncCoach: true,
            syncTeamInfo: true,
            coachAndColorsOnly: lightSync,
          })
        );
        if (result.ok) ok++;
        if (result.coachUpdated) coachOk++;
        if (result.colorsUpdated) colorsOk++;
        if (!result.ok && !result.coachUpdated && !result.colorsUpdated) noData++;
      } catch (e) {
        console.warn(`   ⚠ ${t.name || t.api_football_id}: ${e.message}`);
      }
      if (i < toProcess.length - 1) {
        await delay(TEAM_SYNC_DELAY_MS);
        if ((i + 1) % TEAM_SYNC_BATCH_SIZE === 0) {
          console.log(`   [Takım] ${i + 1}/${toProcess.length} işlendi | güncellenen: ${ok} (koç: ${coachOk}, renk: ${colorsOk}) | API veri yok: ${noData} | ${TEAM_SYNC_PAUSE_AFTER_BATCH_MS / 1000} sn...`);
          await delay(TEAM_SYNC_PAUSE_AFTER_BATCH_MS);
        }
      }
    }
    const afterRound = await fetchStats();
    console.log(`   Tur sonu: işlenen: ${toProcess.length} | güncellenen: ${ok} (koç: +${coachOk}, renk: +${colorsOk}) | API'den veri gelmeyen: ${noData}`);
    console.log(`   Rapor: Koç ${afterRound.coachPct}% (${afterRound.withCoach}/${afterRound.totalTeams}) | Renk ${afterRound.colorsPct}% (${afterRound.withColors}/${afterRound.totalTeams}) | Kadro ${afterRound.squadsPct}%`);
    if (MAX_TEAMS_PER_ROUND) {
      console.log('   --max-teams ile sınırlı run bitti.');
      return;
    }
    if (list.length > 0 && coachOk === 0 && colorsOk === 0) {
      console.warn('   ⚠ Bu turda hiç koç/renk güncellenmedi. API veya DB kontrolü önerilir (scripts/test-one-team-sync.js).');
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
    if (shouldStopForReserve()) {
      console.log(`   ⏹ KOTA: ${API_MAX_USE} kullanildi, ${API_RESERVE_FOR_LIVE} canli mac (10 sn) icin ayrildi, rating fazi atlaniyor.\n`);
      return;
    }
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
    if (noProgressRuns >= 10) {
      console.log(`   Rating: 10 tur üst üste ilerleme yok (${stats.ratingPct}%). API limiti veya veri bitti. Çıkılıyor.\n`);
      return;
    }
    lastRatingPct = stats.ratingPct;
    console.log(`   Rating şu an: ${stats.ratingPct}%. update-all-player-ratings.js çalıştırılıyor (max ${API_MAX_USE} kullanilacak)...`);
    await new Promise((resolve, reject) => {
      const child = spawn('node', [path.join(__dirname, 'update-all-player-ratings.js'), '--api', '--max-use=' + API_MAX_USE], {
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
  if (fs.existsSync(PAUSE_FILE)) {
    console.log('DB sync bugun kapali (.db-sync-paused). Kalan API canli mac icin. Devam etmek icin bu dosyayi silin.');
    process.exit(0);
  }
  takeLock();
  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(0); });
  process.on('uncaughtException', (err) => {
    console.error('\n❌ Beklenmedik hata (Faz 1 kadro/rating devam etmeyi durdurdu):', err.message);
    releaseLock();
    process.exit(1);
  });
  writeApiUsage();
  writeProgressTxt();
  const apiUsageTimer = setInterval(writeApiUsage, API_USAGE_INTERVAL_MS);
  const progressTimer = setInterval(writeProgressTxt, API_USAGE_INTERVAL_MS);
  process.on('exit', () => {
    clearInterval(apiUsageTimer);
    clearInterval(progressTimer);
  });
  try {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  SIRALI DB TAM DOLDURMA: Takım (Koç+Renk+Kadro) → Rating %100   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`   API: guncelleme max ${API_MAX_USE} | canli mac icin ayrilan: ${API_RESERVE_FOR_LIVE} (10 sn'de bir).`);
    console.log(`   Ilerleme dosyasi (5 dk): ${PROGRESS_TXT_FILE}`);
    // Orphaned/duplicate squad kayitlarini temizle
    console.log('🧹 Orphaned squad kayitlari temizleniyor...');
    const cleanup = await cleanupOrphanedSquads();
    if (cleanup.removed > 0) console.log(`   ${cleanup.removed} orphaned kayit silindi`);
    else console.log('   Temiz - orphaned kayit yok');

    const initial = await fetchStats();
    console.log(`   Mevcut: Koç ${initial.coachPct}% | Renk ${initial.colorsPct}% | Kadro ${initial.squadsPct}% | Rating ${initial.ratingPct}%`);
    console.log('');

    await runTeamDataPhase();
    await writeProgressTxt();
    await runRatingsPhase();

    const final = await fetchStats();
    await writeProgressTxt();
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
