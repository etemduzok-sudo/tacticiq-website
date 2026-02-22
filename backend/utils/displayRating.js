/**
 * Gösterilen rating: Şimdilik sadece API; oyuncu için en az 2 topluluk oyu (n >= 2) oluşunca
 * sistem otomatik olarak blend kullanır. Ek job yok; maç/kadro API'leri bu modülü kullanır.
 * Formül: R = (10 * R_api + n * R_user_avg) / (10 + n); n < 2 ise sadece R_api.
 */

const COMMUNITY_WEIGHT = 10;
const MIN_COMMUNITY_VOTES = 2;

/**
 * Toplu display rating hesapla.
 * @param {number[]} playerIds - Oyuncu id listesi
 * @param {Record<number, number>} apiRatingsMap - playerId -> API rating (players.rating)
 * @param {object} supabase - Supabase client
 * @returns {Promise<Map<number, number>>} playerId -> display rating (65-95 bandında)
 */
async function getDisplayRatingsMap(playerIds, apiRatingsMap, supabase) {
  const map = new Map();
  if (!playerIds || playerIds.length === 0) return map;
  const uniqueIds = [...new Set(playerIds)].filter(Boolean);
  if (!supabase) {
    uniqueIds.forEach((id) => {
      const r = apiRatingsMap?.[id] != null ? Number(apiRatingsMap[id]) : null;
      if (r != null) map.set(id, clampRating(r));
    });
    return map;
  }

  try {
    const { data: rows, error } = await supabase
      .from('player_community_ratings')
      .select('player_id, rating')
      .in('player_id', uniqueIds);

    if (error) {
      uniqueIds.forEach((id) => {
        const r = apiRatingsMap?.[id] != null ? Number(apiRatingsMap[id]) : null;
        if (r != null) map.set(id, clampRating(r));
      });
      return map;
    }

    const byPlayer = new Map();
    (rows || []).forEach((row) => {
      const id = row.player_id;
      if (!byPlayer.has(id)) byPlayer.set(id, []);
      byPlayer.get(id).push(Number(row.rating));
    });

    uniqueIds.forEach((playerId) => {
      const apiRating = apiRatingsMap?.[playerId] != null ? Number(apiRatingsMap[playerId]) : null;
      const votes = byPlayer.get(playerId) || [];
      const n = votes.length;
      let display;
      if (n >= MIN_COMMUNITY_VOTES && apiRating != null) {
        const avg = votes.reduce((a, b) => a + b, 0) / n;
        display = (COMMUNITY_WEIGHT * apiRating + n * avg) / (COMMUNITY_WEIGHT + n);
      } else if (apiRating != null) {
        display = apiRating;
      } else {
        display = null;
      }
      if (display != null) map.set(playerId, clampRating(display));
    });
  } catch (e) {
    uniqueIds.forEach((id) => {
      const r = apiRatingsMap?.[id] != null ? Number(apiRatingsMap[id]) : null;
      if (r != null) map.set(id, clampRating(r));
    });
  }
  return map;
}

function clampRating(r) {
  const n = Number(r);
  if (Number.isNaN(n)) return 75;
  return Math.max(65, Math.min(95, Math.round(n)));
}

module.exports = {
  getDisplayRatingsMap,
  clampRating,
  COMMUNITY_WEIGHT,
  MIN_COMMUNITY_VOTES,
};
