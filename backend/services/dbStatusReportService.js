/**
 * DB güncelleme ilerleme raporu - ligler, takımlar, koç, kadro, oyuncu rating/yetenekler.
 * Sunucu her 5 dakikada bir bu raporu konsola yazar.
 */

const { supabase, isConfigured } = require('../config/supabase');

let lastStats = null;

async function fetchStats() {
  if (!isConfigured || !supabase) {
    return null;
  }
  try {
    const [
      { count: totalLeagues },
      { count: totalMatches },
      { count: totalTeams },
      { count: withCoach },
      { count: withColors },
      { count: squads2025 },
    ] = await Promise.all([
      supabase.from('leagues').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('coach', 'is', null),
      supabase.from('static_teams').select('*', { count: 'exact', head: true }).not('colors_primary', 'is', null),
      supabase.from('team_squads').select('*', { count: 'exact', head: true }).eq('season', 2025),
    ]);

    let teamsWithRating = 0, playersWithRating = 0, totalPlayers = 0, playersWithAbilities = 0;
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
