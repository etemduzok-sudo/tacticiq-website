/**
 * Maç kartı ortak mantığı – Dashboard ve MatchListScreen'de tekrar eden
 * coach override, canlı status ve showAsLive kontrolünü tek yerden yönetir.
 */

import { shortenCoachName } from './coachNameUtils';

export const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'] as const;

export const KNOWN_COACH_OVERRIDE: Record<number, string> = {
  549: 'Sergen Yalçın',   // Beşiktaş
  645: 'Okan Buruk',      // Galatasaray
  611: 'Domenico Tedesco', // Fenerbahçe
  998: 'Fatih Tekke',     // Trabzonspor
};

/**
 * Teknik direktör adını döndürür.
 * Öncelik: hardcoded override > runtime cache > fallback '...'
 */
export function getCoachDisplayName(
  teamId: number | undefined,
  coachCache: Record<number, string>,
): string {
  if (teamId && KNOWN_COACH_OVERRIDE[teamId]) {
    return shortenCoachName(KNOWN_COACH_OVERRIDE[teamId]);
  }
  if (teamId && coachCache[teamId]) {
    return shortenCoachName(coachCache[teamId]);
  }
  return teamId ? '...' : 'Bilinmiyor';
}

/**
 * Maç kartında gerçekten canlı gösterilmeli mi?
 * Backend status='live' olsa bile fixture kısa kodu NS ise henüz başlamamış demektir.
 */
export function isShowAsLive(
  cardStatus: string,
  fixtureStatusShort: string,
  elapsed: number | null | undefined,
): boolean {
  if (cardStatus !== 'live') return false;
  const hasElapsed = elapsed != null && elapsed > 0;
  return LIVE_STATUSES.includes(fixtureStatusShort as any) || hasElapsed;
}
