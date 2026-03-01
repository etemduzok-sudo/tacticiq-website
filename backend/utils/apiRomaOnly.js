// API kullanımı sadece Roma (favori takım) ile ilgili maçlar için. 100/gün plan.
const ROMA_TEAM_ID = 497; // API-Football team id: AS Roma

function parseFavoriteIds(favIdsParam) {
  if (!favIdsParam || typeof favIdsParam !== 'string' || !favIdsParam.trim()) return new Set();
  return new Set(
    favIdsParam.split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n))
  );
}

function hasRomaInFavorites(favIdsParam) {
  return parseFavoriteIds(favIdsParam).has(ROMA_TEAM_ID);
}

function isRomaTeam(teamId) {
  return Number(teamId) === ROMA_TEAM_ID;
}

function isRomaMatch(match) {
  if (!match) return false;
  const home = match.home_team_id ?? match.teams?.home?.id;
  const away = match.away_team_id ?? match.teams?.away?.id;
  return (home != null && Number(home) === ROMA_TEAM_ID) || (away != null && Number(away) === ROMA_TEAM_ID);
}

module.exports = {
  ROMA_TEAM_ID,
  hasRomaInFavorites,
  isRomaTeam,
  isRomaMatch,
  parseFavoriteIds,
};
