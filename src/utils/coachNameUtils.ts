/**
 * Teknik direktör isimlerini "İsim Soyad" tek satır göstermek için kısaltır.
 * Uzun isimler (örn. José Mário dos Santos Mourinho Félix) → José Mourinho.
 * Dashboard ve MatchDetail maç kartlarında aynı görünüm için kullanılır.
 */
const MAX_COACH_DISPLAY_LENGTH = 22;

export function shortenCoachName(fullName: string): string {
  if (!fullName) return fullName;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  if (parts.length === 1)
    return fullName.length > MAX_COACH_DISPLAY_LENGTH ? fullName.slice(0, MAX_COACH_DISPLAY_LENGTH - 1) + '…' : fullName;
  if (parts.length === 2)
    return fullName.length > MAX_COACH_DISPLAY_LENGTH ? fullName.slice(0, MAX_COACH_DISPLAY_LENGTH - 1) + '…' : fullName;
  const first = parts[0];
  const surname = parts.length >= 4 ? parts[parts.length - 2] : parts[parts.length - 1];
  const short = `${first} ${surname}`;
  return short.length > MAX_COACH_DISPLAY_LENGTH ? short.slice(0, MAX_COACH_DISPLAY_LENGTH - 1) + '…' : short;
}
