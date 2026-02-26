/**
 * API-Football /coachs yanıtından güncel (aktif) teknik direktörü seçer.
 * Birden fazla koç aynı takım için end=null dönerse (API gecikmesi), en son başlayanı alır.
 *
 * @param {Array} coaches - API response (coach objeleri)
 * @param {number|string} teamId - Takım api_football_id
 * @returns {{ name: string, id: number } | null}
 */
function selectActiveCoach(coaches, teamId) {
  if (!Array.isArray(coaches) || coaches.length === 0) return null;
  const tid = Number(teamId);

  const getCareerEntry = (c) => {
    const career = c.career || [];
    return career.find((car) => (car.team?.id ?? car.team_id) == tid);
  };

  // 1. end=null olan (aktif) kariyer kaydı olan koçları filtrele
  const active = coaches.filter((c) => {
    const entry = getCareerEntry(c);
    return entry && (entry.end == null || entry.end === '');
  });

  // 2. Aktif varsa, start tarihine göre en günceli seç (API bazen eski koçu da end=null döndürebilir)
  const toSort = active.length > 0 ? active : coaches;
  const sorted = [...toSort].sort((a, b) => {
    const aEntry = getCareerEntry(a);
    const bEntry = getCareerEntry(b);
    const aStart = aEntry?.start ? new Date(aEntry.start).getTime() : 0;
    const bStart = bEntry?.start ? new Date(bEntry.start).getTime() : 0;
    return bStart - aStart; // en yeni önce
  });

  const chosen = sorted[0];
  if (!chosen) return null;
  // Tam isim tercih et (firstname + lastname); name alanı "O. Buruk" gibi kısaltılmış olabilir
  const displayName =
    chosen.firstname && chosen.lastname
      ? `${chosen.firstname} ${chosen.lastname}`.trim()
      : chosen.name;
  return { name: displayName || chosen.name, id: chosen.id };
}

module.exports = { selectActiveCoach };
