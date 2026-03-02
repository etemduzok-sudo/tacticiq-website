/**
 * DB güncelleme ilerleme raporu - ligler, takımlar, koç, kadro, oyuncu rating/yetenekler.
 * Takım sayıları sadece İZLENEN LİGLER (üst lig / profesyonel); U19/alt lig/amatör dahil değil.
 */

const { supabase, isConfigured } = require('../config/supabase');

const TRACKED_LEAGUE_TYPES = [
  'domestic_top', 'domestic_cup', 'continental', 'continental_club', 'continental_national',
  'confederation_format', 'global', 'international', 'world_cup', 'continental_championship',
];

let lastStats = null;

async function fetchStats() {
  if (!isConfigured || !supabase) {
    return null;
  }
  try {
    const [rLeagues, rMatches, rTeams, rCoach, rColors, rSquads] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }).in('league_type', TRACKED_LEAGUE_TYPES),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }).in('league_type', TRACKED_LEAGUE_TYPES).not('coach', 'is', null),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }).in('league_type', TRACKED_LEAGUE_TYPES).not('colors_primary', 'is', null),
      supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', 2025),
    ]);
    if (rTeams.error) {
      console.error('❌ [DB RAPOR] static_teams hatasi:', rTeams.error.message, rTeams.error.code || '');
      return null;
    }
    if (rLeagues.error) console.error('❌ [DB RAPOR] leagues:', rLeagues.error.message);
    if (rMatches.error) console.error('❌ [DB RAPOR] matches:', rMatches.error.message);
    if (rSquads.error) console.error('❌ [DB RAPOR] team_squads:', rSquads.error.message);
    const totalLeagues = rLeagues.count ?? 0;
    const totalMatches = rMatches.count ?? 0;
    const totalTeams = rTeams.count ?? 0;
    const withCoach = rCoach.count ?? 0;
    const withColors = rColors.count ?? 0;
    let squads2025 = rSquads.count ?? 0;

    const { data: trackedIds } = await supabase.from('static_teams').select('api_football_id').in('league_type', TRACKED_LEAGUE_TYPES);
    const trackedIdSet = new Set((trackedIds || []).map((r) => r.api_football_id));

    let teamsWithRating = 0, playersWithRating = 0, totalPlayers = 0, playersWithAbilities = 0;
    let squads2025Tracked = 0;
    const pageSize = 500;
    let offset = 0;
    while (true) {
      const { data: ratingSquads, error: rangeErr } = await supabase
        .from('team_squads')
        .select('team_id, players')
        .eq('season', 2025)
        .order('team_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (rangeErr) {
        console.error('❌ [DB RAPOR] team_squads range:', rangeErr.message);
        break;
      }
      if (!ratingSquads?.length) break;
      for (const squad of ratingSquads) {
        if (!trackedIdSet.has(squad.team_id)) continue;
        squads2025Tracked++;
        if (Array.isArray(squad.players)) {
          totalPlayers += squad.players.length;
          const withRating = squad.players.filter(p => p.rating != null);
          const withAbilities = squad.players.filter(p => p.pace != null || p.shooting != null);
          if (withRating.length > 0) {
            teamsWithRating++;
            playersWithRating += withRating.length;
          }
          playersWithAbilities += withAbilities.length;
        }
      }
      if (ratingSquads.length < pageSize) break;
      offset += pageSize;
    }
    squads2025 = trackedIdSet.size > 0 ? squads2025Tracked : squads2025;

    const totalT = totalTeams || 0;
    const coachPct = totalT ? Math.round((withCoach || 0) / totalT * 100) : 0;
    const colorsPct = totalT ? Math.round((withColors || 0) / totalT * 100) : 0;
    const squadsPct = totalT ? Math.round((squads2025 || 0) / totalT * 100) : 0;
    const ratingPct = totalPlayers > 0 ? Math.round(playersWithRating / totalPlayers * 100) : 0;
    const abilitiesPct = totalPlayers > 0 ? Math.round(playersWithAbilities / totalPlayers * 100) : 0;
    const avgPct = Math.round((coachPct + colorsPct + squadsPct + ratingPct) / 4);

    return {
      at: new Date().toISOString(),
      totalLeagues: totalLeagues || 0,
      totalMatches: totalMatches || 0,
      totalTeams: totalT,
      withCoach: withCoach || 0,
      withColors: withColors || 0,
      squads2025: squads2025 || 0,
      teamsWithRating,
      playersWithRating,
      playersWithAbilities,
      totalPlayers,
      coachPct,
      colorsPct,
      squadsPct,
      ratingPct,
      abilitiesPct,
      avgPct,
    };
  } catch (err) {
    console.error('❌ [DB RAPOR] fetchStats hatası:', err.message);
    return null;
  }
}

function formatDiff(now, prev) {
  if (prev == null) return '';
  const d = now - prev;
  if (d === 0) return ' (→)';
  if (d > 0) return ` (+${d})`;
  return ` (${d})`;
}

function printReport() {
  return (async () => {
    const s = await fetchStats();
    if (!s) return;
    const prev = lastStats;
    lastStats = s;
    const now = new Date();
    const diff = (label, val, p) => (p != null ? `${val}${formatDiff(val, p)}` : `${val}`);

    const d = (val, p) => (p != null ? `${val}${formatDiff(val, p)}` : `${val}`);
    const lines = [
      '',
      '═══════════════════════════════════════════════════════════════',
      '  📊 DB GÜNCELLEME RAPORU (5 dk) — ' + now.toLocaleString('tr-TR'),
      '═══════════════════════════════════════════════════════════════',
      `  Ligler:     ${d(s.totalLeagues, prev?.totalLeagues)}`,
      `  Maçlar:     ${d(s.totalMatches, prev?.totalMatches)}`,
      `  Takımlar:   ${d(s.totalTeams, prev?.totalTeams)}`,
      '  ─────────────────────────────────────────────────────────',
      `  Koç:        ${s.withCoach} / ${s.totalTeams}  (${s.coachPct}%) ${formatDiff(s.withCoach, prev?.withCoach)}`,
      `  Renkler:    ${s.withColors} / ${s.totalTeams}  (${s.colorsPct}%) ${formatDiff(s.withColors, prev?.withColors)}`,
      `  Kadro 2025: ${s.squads2025} / ${s.totalTeams}  (${s.squadsPct}%) ${formatDiff(s.squads2025, prev?.squads2025)}`,
      `  Oyuncu (rating):  ${s.playersWithRating} / ${s.totalPlayers}  (${s.ratingPct}%) ${formatDiff(s.playersWithRating, prev?.playersWithRating)}`,
      `  Oyuncu (yetenek): ${s.playersWithAbilities} / ${s.totalPlayers}  (${s.abilitiesPct}%) ${formatDiff(s.playersWithAbilities, prev?.playersWithAbilities)}`,
      '  ─────────────────────────────────────────────────────────',
      `  ÖZET: Coach ${s.coachPct}% | Renkler ${s.colorsPct}% | Kadrolar ${s.squadsPct}% | Rating ${s.ratingPct}% | Yetenek ${s.abilitiesPct}%`,
      `  GENEL TAMAMLANMA: ${s.avgPct}%`,
      ...(s.totalTeams === 0 ? [
        '  ⚠️  static_teams boş — önce full-world-db-sync.js veya full-db-sync.js çalıştırın.',
      ] : []),
      '═══════════════════════════════════════════════════════════════',
      '',
    ];
    console.log(lines.join('\n'));
  })();
}

function startPeriodicReport(intervalMs = 5 * 60 * 1000) {
  if (!isConfigured) {
    console.log('⏭️ [DB RAPOR] Supabase yok, 5 dk raporu kapalı.');
    return;
  }
  console.log(`📊 [DB RAPOR] Her ${intervalMs / 60000} dakikada bir rapor yazılacak. İlk rapor 30 sn sonra...`);
  setTimeout(() => printReport(), 30 * 1000);
  setInterval(() => printReport(), intervalMs);
}

module.exports = {
  fetchStats,
  printReport,
  startPeriodicReport,
};
