/**
 * Canlı maç filtreleme - Sadece üst lig erkek maçları.
 * Deportivo Zap, kadın maçları, 2. ligler hariç.
 * Arjantin, Liga MX, Şili, Kosta Rika, Kolombiya 1. lig dahil.
 */

const TOP_LEAGUES = [
  'premier league', 'la liga', 'laliga', 'serie a', 'bundesliga', 'ligue 1',
  'süper lig', 'super lig', 'primeira liga', 'eredivisie',
  'scottish premiership', 'belgian pro league', 'austrian bundesliga', 'swiss super league',
  'liga profesional', 'primera división', 'campeonato brasileiro', 'brasileirão',
  'liga mx', 'ekstraklasa', 'russian premier league', 'super league',
  // La Liga (İspanya) – Celta Vigo vb. için tüm varyantlar
  'la liga española', 'la liga santander', 'laliga santander', 'primera división de españa', 'spanish la liga',
  // Güney/Kuzey Amerika üst ligleri
  'chilean primera', 'primera división de chile', 'chile primera',
  'costa rica primera', 'liga fpd', 'primera división de costa rica',
  'categoría primera a', 'colombian primera', 'liga águila', 'primera a',
];

function isTopLeague(leagueName) {
  const ln = (leagueName || '').toLowerCase();
  return TOP_LEAGUES.some(t => ln.includes(t));
}

function isExcluded(m) {
  const leagueName = (m.league?.name || '').toLowerCase();
  const home = (m.teams?.home?.name || '').toLowerCase();
  const away = (m.teams?.away?.name || '').toLowerCase();
  if (leagueName.includes('women') || leagueName.includes(' w ') || home.includes(' w ') || away.includes(' w ')) return true;
  if (leagueName.includes('u18') || leagueName.includes('u19') || leagueName.includes('u20') || leagueName.includes('u21') || leagueName.includes('youth')) return true;
  if (leagueName.includes('2.') || leagueName.includes('second') || leagueName.includes('division 2') || leagueName.includes('segunda')) return true;
  if (leagueName.includes('rfef') || leagueName.includes('usl')) return true;
  if (leagueName.includes('expansion') || leagueName.includes('expansión') || leagueName.includes('ascenso') || leagueName.includes('primera b') || leagueName.includes('segunda división')) return true;
  if (leagueName.includes('liga premier')) return true;
  if (leagueName.includes('ligue 2') || leagueName.includes('2. bundesliga') || leagueName.includes('serie b')) return true;
  if (leagueName.includes('championship') && !leagueName.includes('scottish')) return true;
  return false;
}

/** Sadece üst lig maçlarını döndür (kadın/alt lig hariç) */
function filterTopLeagueMatches(matches) {
  if (!Array.isArray(matches)) return [];
  return matches.filter(m => !isExcluded(m) && isTopLeague(m.league?.name));
}

module.exports = { isTopLeague, isExcluded, filterTopLeagueMatches };
