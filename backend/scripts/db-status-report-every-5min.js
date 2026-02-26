#!/usr/bin/env node
/**
 * DB güncelleme raporu - 5 dakikada bir çalışır, önceki raporla karşılaştırmalı yazar.
 * Çıktı: konsol + backend/data/db-status-report.txt (yeni blok eklenir, son MAX_REPORT_BLOCKS blok tutulur)
 * Kullanım: node scripts/db-status-report-every-5min.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const REPORT_FILE = path.join(__dirname, '..', 'data', 'db-status-report.txt');
const LAST_SNAPSHOT_FILE = path.join(__dirname, '..', 'data', 'db-status-last.json');
const BASELINE_FILE = path.join(__dirname, '..', 'data', 'db-status-baseline.json');
const INTERVAL_MS = 5 * 60 * 1000; // 5 dakika
const MAX_REPORT_BLOCKS = 100;     // Son 100 blok (~8 saat) tutulur

function ensureDataDir() {
  const dir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadPrevious() {
  try {
    if (fs.existsSync(LAST_SNAPSHOT_FILE)) {
      return JSON.parse(fs.readFileSync(LAST_SNAPSHOT_FILE, 'utf8'));
    }
  } catch (e) {}
  return null;
}

/** Günlük baseline: bugünün tarihi son baseline tarihinden farklıysa mevcut snapshot'ı baseline yap. */
function loadOrUpdateBaseline(currentSnapshot) {
  const today = new Date().toDateString();
  let baseline = null;
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      const baselineDay = baseline.at ? new Date(baseline.at).toDateString() : '';
      if (baselineDay !== today) {
        baseline = null;
      }
    }
  } catch (e) {}
  if (!baseline) {
    baseline = { ...currentSnapshot, at: new Date().toISOString(), _label: 'Baseline bugun' };
    ensureDataDir();
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 0));
  }
  return baseline;
}

function saveSnapshot(data) {
  ensureDataDir();
  fs.writeFileSync(LAST_SNAPSHOT_FILE, JSON.stringify({ ...data, at: new Date().toISOString() }, null, 0));
}

function formatDiff(now, prev) {
  if (prev == null) return '';
  const d = now - prev;
  if (d === 0) return ' (degismedi)';
  if (d > 0) return ` (+${d})`;
  return ` (${d})`;
}

/** Tahmini sure (saat) %100 tamamlanmaya - koç/renk/kadro ~45 takım/dk, rating ~400 oyuncu/saat. */
function estimateHoursTo100(stats) {
  if (!stats || stats.avgPct >= 100) return 0;
  const totalTeams = stats.totalTeams || 1;
  const totalPlayers = stats.totalPlayers || 0;
  const teamsToSync = totalTeams - Math.min(stats.withCoach || 0, stats.withColors || 0, stats.squads2025 || 0);
  const teamHours = Math.max(0, teamsToSync) / 45 / 60;
  const playersWithoutRating = totalPlayers - (stats.playersWithRating || 0);
  const ratingHours = Math.max(0, playersWithoutRating) / 400;
  return Math.round((teamHours + ratingHours) * 10) / 10;
}

function appendReportBlock(newBlockText) {
  ensureDataDir();
  const separator = '========== DB GUNCELLEME RAPORU (5 dk) ==========';
  let existing = '';
  if (fs.existsSync(REPORT_FILE)) {
    existing = fs.readFileSync(REPORT_FILE, 'utf8');
  }
  const blocks = existing.split(separator).map(b => b.trim()).filter(Boolean);
  blocks.push(newBlockText.trim());
  const kept = blocks.length > MAX_REPORT_BLOCKS ? blocks.slice(-MAX_REPORT_BLOCKS) : blocks;
  const content = kept.map(b => (b.startsWith('==========') ? b : separator + '\n' + b)).join('\n\n');
  fs.writeFileSync(REPORT_FILE, content + '\n');
}

async function fetchStats() {
  const { count: totalTeams } = await supabase.from('static_teams').select('*', { count: 'exact', head: true });
  const { count: withCoach } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('coach', 'is', null);
  const { count: withColors } = await supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('colors_primary', 'is', null);
  const { count: squads2025 } = await supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', 2025);

  // Rating: tum kadrolar uzerinden sayim (sayfalı, 500'er)
  let teamsWithRating = 0, playersWithRating = 0, totalPlayers = 0;
  const pageSize = 500;
  let offset = 0;
  while (true) {
    const { data: ratingSquads } = await supabase
      .from('team_squads')
      .select('team_id, players')
      .eq('season', 2025)
      .order('team_id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (!ratingSquads?.length) break;
    for (const squad of ratingSquads) {
      if (Array.isArray(squad.players)) {
        totalPlayers += squad.players.length;
        const withRating = squad.players.filter(p => p.rating !== undefined && p.rating !== null);
        if (withRating.length > 0) {
          teamsWithRating++;
          playersWithRating += withRating.length;
        }
      }
    }
    if (ratingSquads.length < pageSize) break;
    offset += pageSize;
  }

  const coachPct = totalTeams ? Math.round(withCoach / totalTeams * 100) : 0;
  const colorsPct = totalTeams ? Math.round(withColors / totalTeams * 100) : 0;
  const squadsPct = totalTeams ? Math.round(squads2025 / totalTeams * 100) : 0;
  const ratingPct = totalPlayers > 0 ? Math.round(playersWithRating / totalPlayers * 100) : 0;
  const avgPct = Math.round((coachPct + colorsPct + squadsPct + ratingPct) / 4);

  return {
    at: new Date().toISOString(),
    totalTeams: totalTeams || 0,
    withCoach: withCoach || 0,
    withColors: withColors || 0,
    squads2025: squads2025 || 0,
    teamsWithRating,
    playersWithRating,
    totalPlayers,
    coachPct,
    colorsPct,
    squadsPct,
    ratingPct,
    avgPct,
  };
}

async function runReport() {
  const now = new Date();
  const prev = loadPrevious();
  const s = await fetchStats();

  const baseline = loadOrUpdateBaseline(s);
  const baselineDate = baseline?.at ? new Date(baseline.at).toLocaleDateString('tr-TR') : '-';

  const lines = [];
  lines.push('');
  lines.push('========== DB GUNCELLEME RAPORU (5 dk) ==========');
  lines.push('Zaman: ' + now.toLocaleString('tr-TR'));
  lines.push('');

  const fmt = (label, nowVal, prevVal, suffix = '') => {
    const diff = prevVal != null ? (nowVal - prevVal) : null;
    let diffStr = '';
    if (diff !== null) {
      if (diff > 0) diffStr = `  [+${diff}]`;
      else if (diff < 0) diffStr = `  [${diff}]`;
      else diffStr = '  [degismedi]';
    }
    return `  ${label}: ${nowVal}${suffix}${diffStr}`;
  };

  lines.push('--- 5 DK ONCEKI OLCUM vs SIMDI ---');
  lines.push(fmt('Toplam takim', s.totalTeams, prev?.totalTeams));
  lines.push(fmt('Coach ile', s.withCoach, prev?.withCoach, ` (${s.coachPct}%)`));
  lines.push(fmt('Renkler ile', s.withColors, prev?.withColors, ` (${s.colorsPct}%)`));
  lines.push(fmt('Kadrolar 2025', s.squads2025, prev?.squads2025, ` (${s.squadsPct}%)`));
  lines.push(fmt('Oyuncu (ratingli)', s.playersWithRating, prev?.playersWithRating));
  lines.push(fmt('Toplam oyuncu', s.totalPlayers, prev?.totalPlayers));
  lines.push(fmt('Rating %', s.ratingPct, prev?.ratingPct, '%'));
  lines.push(fmt('ORTALAMA %', s.avgPct, prev?.avgPct, '%'));
  lines.push('');
  lines.push(`--- BASELINE (${baselineDate}) ile KARSILASTIRMA - Gunluk ilerleme ---`);
  lines.push(fmt('Toplam takim', s.totalTeams, baseline?.totalTeams));
  lines.push(fmt('Coach ile', s.withCoach, baseline?.withCoach, ` (${s.coachPct}%)`));
  lines.push(fmt('Renkler ile', s.withColors, baseline?.withColors, ` (${s.colorsPct}%)`));
  lines.push(fmt('Kadrolar 2025', s.squads2025, baseline?.squads2025, ` (${s.squadsPct}%)`));
  lines.push(fmt('Oyuncu (ratingli)', s.playersWithRating, baseline?.playersWithRating));
  lines.push(fmt('Toplam oyuncu', s.totalPlayers, baseline?.totalPlayers));
  lines.push(fmt('Rating %', s.ratingPct, baseline?.ratingPct, '%'));
  lines.push(fmt('ORTALAMA %', s.avgPct, baseline?.avgPct, '%'));
  lines.push('');
  const tahminiSaat = estimateHoursTo100(s);
  lines.push('--- OZET ---');
  lines.push(`  Coach: ${s.coachPct}% | Renkler: ${s.colorsPct}% | Kadrolar: ${s.squadsPct}% | Rating: ${s.ratingPct}%`);
  lines.push(`  GENEL TAMAMLANMA: ${s.avgPct}%`);
  if (s.avgPct < 100 && tahminiSaat > 0) {
    lines.push(`  TAHMINI SURE %100'E: ~${tahminiSaat} saat (sync script calisirsa).`);
  } else if (s.avgPct >= 100) {
    lines.push('  Hedef: %100 tamamlandi.');
  }
  lines.push('  Not: Ilerleme icin run-db-sync-and-report.js veya run-phased-db-complete.js calismali.');
  lines.push('================================================');
  lines.push('');

  const text = lines.join('\n');
  console.log(text);
  appendReportBlock(text);
  saveSnapshot(s);
}

async function main() {
  ensureDataDir();
  console.log('DB raporu 5 dakikada bir yazilacak. Rapor dosyasi: ' + REPORT_FILE);
  console.log('Ilk rapor simdi aliniyor...\n');

  await runReport();

  setInterval(async () => {
    await runReport();
  }, INTERVAL_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
