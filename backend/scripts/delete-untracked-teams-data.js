#!/usr/bin/env node
/**
 * İzlenen liglerde OLMAYAN takımlara ait tüm veriyi DB'den siler.
 * TRACKED_LEAGUE_TYPES dışındaki (ve league_type=null) takımlar + team_squads, ilgili maçlar, favori kayıtları temizlenir.
 *
 * Kullanım: node scripts/delete-untracked-teams-data.js [--dry-run]
 *   --dry-run  Silme yapmaz, sadece silinecek kayıt sayılarını raporlar.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

const TRACKED_LEAGUE_TYPES = [
  'domestic_top', 'domestic_cup', 'continental', 'continental_club', 'continental_national',
  'confederation_format', 'global', 'international', 'world_cup', 'continental_championship',
];

const DRY_RUN = process.argv.includes('--dry-run');

// İzlenmeyen takım isim kalıpları: U17/U19/U21, B takımı (isim sonu), rezerv, akademi (II hariç - Willem II gibi asıl kulüpler var)
const UNWANTED_NAME_PATTERN = /\b(U1[789]|U2[0-3]|U-19|U-21|U18|U17)\b| B$| Reserve| Youth| Academy| Amateur/i;

function isUntrackedByName(name) {
  return name && UNWANTED_NAME_PATTERN.test(String(name));
}

async function getUntrackedTeamIds() {
  // İzlenmeyen = league_type NULL / TRACKED dışı VEYA isim U19, B, II vb. içeriyor
  const { data: tracked } = await supabase
    .from('static_teams')
    .select('api_football_id')
    .in('league_type', TRACKED_LEAGUE_TYPES);
  const trackedSet = new Set((tracked || []).map((r) => r.api_football_id));

  const { data: all } = await supabase.from('static_teams').select('api_football_id, name, league_type');
  const untrackedList = (all || []).filter((r) => !trackedSet.has(r.api_football_id) || isUntrackedByName(r.name));
  const untracked = untrackedList.map((r) => r.api_football_id);
  return { untracked, sample: untrackedList.slice(0, 20) };
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env)');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  İzlenmeyen takım verilerini DB\'den ayıklama');
  console.log('  TRACKED_LEAGUE_TYPES dışı / league_type null → silinecek');
  if (DRY_RUN) console.log('  [--dry-run] Silme yapılmayacak, sadece rapor.');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const { untracked: untrackedIds, sample: sampleRows } = await getUntrackedTeamIds();
  const { count: totalTeams } = await supabase.from('static_teams').select('*', { count: 'exact', head: true });
  const trackedCount = (totalTeams ?? 0) - untrackedIds.length;
  console.log(`  Toplam takım: ${totalTeams ?? 0} | İzlenen (kalacak): ${trackedCount} | İzlenmeyen (silinecek): ${untrackedIds.length}`);

  if (untrackedIds.length === 0) {
    console.log('  Silinecek izlenmeyen takım yok. Çıkılıyor.');
    return;
  }

  if (sampleRows.length > 0) {
    console.log('  Örnek izlenmeyen takımlar:');
    sampleRows.forEach((r) => console.log(`    - ${r.name} (id: ${r.api_football_id}, league_type: ${r.league_type ?? 'null'})`));
  }
  if (untrackedIds.length <= 20) {
    console.log(`  Tüm ID'ler: ${untrackedIds.join(', ')}`);
  } else {
    console.log(`  İlk 20 ID: ${untrackedIds.slice(0, 20).join(', ')} ...`);
  }
  console.log('');

  const BATCH = 500;
  const report = { team_squads: 0, predictions: 0, match_results: 0, matches: 0, favorite_teams: 0, substitution_votes: 0, static_teams: 0 };

  // 1) team_squads: team_id = api_football_id
  for (let i = 0; i < untrackedIds.length; i += BATCH) {
    const chunk = untrackedIds.slice(i, i + BATCH);
    const { count } = await supabase.from('team_squads').select('*', { count: 'exact', head: true }).in('team_id', chunk);
    report.team_squads += count ?? 0;
    if (!DRY_RUN && (count ?? 0) > 0) {
      await supabase.from('team_squads').delete().in('team_id', chunk);
    }
  }
  console.log(`  team_squads: ${report.team_squads} satır ${DRY_RUN ? '(dry-run)' : 'silindi'}`);

  // 2) matches: home_team_id veya away_team_id izlenmeyen olan maçlar
  const matchIdSet = new Set();
  for (let i = 0; i < untrackedIds.length; i += BATCH) {
    const chunk = untrackedIds.slice(i, i + BATCH);
    const { data: home } = await supabase.from('matches').select('id').in('home_team_id', chunk);
    const { data: away } = await supabase.from('matches').select('id').in('away_team_id', chunk);
    (home || []).forEach((m) => matchIdSet.add(m.id));
    (away || []).forEach((m) => matchIdSet.add(m.id));
  }
  const matchIdsToDelete = Array.from(matchIdSet);
  report.matches = matchIdsToDelete.length;

  if (matchIdsToDelete.length > 0) {
    // Maçlara bağlı tahmin ve sonuçları önce sil (FK / tutarlılık)
    for (let i = 0; i < matchIdsToDelete.length; i += BATCH) {
      const chunk = matchIdsToDelete.slice(i, i + BATCH);
      const { count: predCount } = await supabase.from('predictions').select('*', { count: 'exact', head: true }).in('match_id', chunk);
      report.predictions += predCount ?? 0;
      if (!DRY_RUN && (predCount ?? 0) > 0) {
        await supabase.from('predictions').delete().in('match_id', chunk);
      }
      const { count: resCount } = await supabase.from('match_results').select('*', { count: 'exact', head: true }).in('match_id', chunk);
      report.match_results += resCount ?? 0;
      if (!DRY_RUN && (resCount ?? 0) > 0) {
        await supabase.from('match_results').delete().in('match_id', chunk);
      }
    }
    if (report.predictions > 0) console.log(`  predictions: ${report.predictions} satır ${DRY_RUN ? '(dry-run)' : 'silindi'}`);
    if (report.match_results > 0) console.log(`  match_results: ${report.match_results} satır ${DRY_RUN ? '(dry-run)' : 'silindi'}`);

    if (!DRY_RUN) {
      for (let i = 0; i < matchIdsToDelete.length; i += BATCH) {
        const chunk = matchIdsToDelete.slice(i, i + BATCH);
        await supabase.from('matches').delete().in('id', chunk);
      }
    }
    console.log(`  matches: ${report.matches} maç ${DRY_RUN ? '(dry-run)' : 'silindi'}`);
  } else {
    console.log('  matches: 0');
  }

  // 3) favorite_teams: team_id = api_football_id
  for (let i = 0; i < untrackedIds.length; i += BATCH) {
    const chunk = untrackedIds.slice(i, i + BATCH);
    const { count } = await supabase.from('favorite_teams').select('*', { count: 'exact', head: true }).in('team_id', chunk);
    report.favorite_teams += count ?? 0;
    if (!DRY_RUN && (count ?? 0) > 0) {
      await supabase.from('favorite_teams').delete().in('team_id', chunk);
    }
  }
  console.log(`  favorite_teams: ${report.favorite_teams} satır ${DRY_RUN ? '(dry-run)' : 'silindi'}`);

  // 4) substitution_votes: team_id (varsa)
  try {
    for (let i = 0; i < untrackedIds.length; i += BATCH) {
      const chunk = untrackedIds.slice(i, i + BATCH);
      const { count } = await supabase.from('substitution_votes').select('*', { count: 'exact', head: true }).in('team_id', chunk);
      report.substitution_votes += count ?? 0;
      if (!DRY_RUN && (count ?? 0) > 0) {
        await supabase.from('substitution_votes').delete().in('team_id', chunk);
      }
    }
    console.log(`  substitution_votes: ${report.substitution_votes} satır ${DRY_RUN ? '(dry-run)' : 'silindi'}`);
  } catch (e) {
    console.log('  substitution_votes: (tablo yok veya hata, atlandı)');
  }

  // 5) static_teams: izlenmeyen takımlar
  report.static_teams = untrackedIds.length;
  if (!DRY_RUN) {
    for (let i = 0; i < untrackedIds.length; i += BATCH) {
      const chunk = untrackedIds.slice(i, i + BATCH);
      await supabase.from('static_teams').delete().in('api_football_id', chunk);
    }
  }
  console.log(`  static_teams: ${report.static_teams} takım ${DRY_RUN ? '(dry-run)' : 'silindi'}`);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  if (DRY_RUN) {
    console.log('  Özet (dry-run): Yukarıdaki satırlar silinmedi. Silmek için --dry-run olmadan çalıştırın.');
  } else {
    console.log('  Tamamlandı.');
  }
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
