/**
 * Oyuncu isim gösterimi: tam isim-soyisim; birden fazla isim varsa en az biri açık, diğerleri "Ad." kısaltılabilir.
 * DB/API'de firstname + lastname varsa bunlar kullanılır; yoksa name (fallback) kullanılır.
 */

export interface PlayerNameSource {
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
}

/**
 * Tam isim döndürür: firstname + lastname (varsa).
 * Birden fazla isim varsa (firstname içinde boşluk): ilk isim tam, diğerleri "X." kısaltması; en az bir isim açık yazılır.
 * Örnek: "Marcelo" -> "Marcelo Crespo"; "Addji Keaninkin Marc-Israel" -> "Addji K. M. Guéhi"
 */
export function formatPlayerDisplayName(player: PlayerNameSource): string {
  const first = player.firstname?.trim();
  const last = player.lastname?.trim();
  const fallback = player.name?.trim() || '';

  if (!first && !last) return fallback;
  if (!last) return first || fallback;
  if (!first) return last || fallback;

  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return `${first} ${last}`;

  // Birden fazla isim: ilki tam, diğerleri "X." (en az bir isim açık)
  const firstFull = parts[0];
  const restAbbrev = parts.slice(1).map((p) => (p.length > 0 ? p.charAt(0) + '.' : '')).join(' ');
  return `${firstFull} ${restAbbrev} ${last}`.replace(/\s+/g, ' ').trim();
}

/**
 * Sadece tek soyad döndürür, tek satır için (kadro kartları).
 * lastname varsa ilk kelimesini (birincil soyad); yoksa name'in son kelimesini döner.
 */
export function formatPlayerSurname(player: PlayerNameSource): string {
  const last = player.lastname?.trim();
  const fallback = player.name?.trim() || '';
  if (last) {
    const firstWord = last.split(/\s+/)[0];
    return firstWord || last;
  }
  if (!fallback) return '';
  const parts = fallback.split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1]! : fallback;
}
