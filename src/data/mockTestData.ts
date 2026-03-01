/**
 * Mock test data - Test maçı (6 saat sonra başlayacak) ve mock veriler.
 * MOCK_TEST_ENABLED = true iken Dashboard'da test maçı görünür ve tüm güncellemeler test edilebilir.
 */

export const MOCK_TEST_ENABLED = true;

/** Canlı maç senaryosu: true iken mock maç "şu an oynanıyor" (1H, dakika ilerliyor) olarak gösterilir. */
export const MOCK_MATCH_SIMULATE_LIVE = true;

/** Test maçı: 6 saat sonra başlayacak (veya canlı simülasyonda geçmişte başlamış). */
export const MOCK_MATCH_IDS = {
  TEST_6H: 888001,
  GS_FB: 888001,   // aynı maç (geri uyumluluk)
  REAL_BARCA: 999002,
} as Record<string, number>;

/** Canlı simülasyonda: maç başlangıcı "şu an - 10 dakika" (1. yarı oynanıyor). Aksi halde 6 saat sonra. */
export function getMatch1Start(): number {
  if (typeof MOCK_MATCH_SIMULATE_LIVE !== 'undefined' && MOCK_MATCH_SIMULATE_LIVE) {
    return Date.now() - 10 * 60 * 1000; // 10 dakika önce başladı
  }
  return Date.now() + 6 * 60 * 60 * 1000;
}

export function getMatch2Start(): number {
  return getMatch1Start();
}

/** Canlı simülasyonda geçen dakika (maç başlangıcından bu yana). */
function getMockElapsedMinute(): number {
  if (typeof MOCK_MATCH_SIMULATE_LIVE !== 'undefined' && MOCK_MATCH_SIMULATE_LIVE) {
    const start = getMatch1Start();
    const elapsedMs = Date.now() - start;
    return Math.min(45, Math.max(0, Math.floor(elapsedMs / 60000)));
  }
  return 0;
}

/** Canlı simülasyonda fixture status (1H / 2H / HT). */
function getMockFixtureStatus(): { short: string; long: string; elapsed: number | null } {
  if (typeof MOCK_MATCH_SIMULATE_LIVE !== 'undefined' && MOCK_MATCH_SIMULATE_LIVE) {
    const elapsed = getMockElapsedMinute();
    if (elapsed >= 45) return { short: 'HT', long: 'Halftime', elapsed: 45 };
    return { short: '1H', long: 'First Half', elapsed };
  }
  return { short: 'NS', long: 'Not Started', elapsed: null };
}

export function getMockMatches(): any[] {
  if (!MOCK_TEST_ENABLED) return [];
  const start = getMatch1Start();
  const status = getMockFixtureStatus();
  return [
    {
      fixture: {
        id: MOCK_MATCH_IDS.TEST_6H,
        date: new Date(start).toISOString(),
        timestamp: Math.floor(start / 1000),
        status,
      },
      league: { id: 203, name: 'UEFA Europa League', country: 'Europe', logo: '' },
      teams: {
        home: { id: 65, name: 'Nottingham Forest', logo: '' },
        away: { id: 611, name: 'Fenerbahçe', logo: '' },
      },
      goals: { home: null, away: null },
      score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
    },
  ];
}

export function isMockTestMatch(matchId: number): boolean {
  if (!MOCK_TEST_ENABLED) return false;
  return matchId === MOCK_MATCH_IDS.TEST_6H || matchId === MOCK_MATCH_IDS.GS_FB;
}

/** Tahmin yapılacak takım (Fenerbahçe = 611) */
export function getMockUserTeamId(matchId: number): number | undefined {
  if (!isMockTestMatch(matchId)) return undefined;
  return 611;
}

export function getMockMatchStatistics(_matchId: number): any {
  return null;
}

export function getMockPlayerStatistics(_matchId: number): any[] | null {
  return null;
}

export function getMockMatchEvents(_matchId: number): any[] {
  return [];
}

/** Topluluk sinyalleri - oyuncu bazlı (canlı değerlendirme %10 üstü ikonlar için) */
export function getMockCommunitySignals(matchId: number): any {
  if (!isMockTestMatch(matchId)) return null;
  return {
    hasSufficientData: true,
    signals: {
      101: { goal: 24, assist: 12, yellowCard: 15, redCard: 3, substitutedOut: 35, totalPredictions: 100 },
      102: { goal: 18, assist: 22, yellowCard: 8, redCard: 1, substitutedOut: 12, totalPredictions: 100 },
      103: { goal: 8, assist: 5, yellowCard: 25, redCard: 2, substitutedOut: 45, totalPredictions: 100 },
    },
  };
}

/** Gerçek kadro (ilk 11 + yedekler) - API formatında */
const MOCK_LINEUP_PLAYERS = [
  { id: 101, name: 'O. Aydın', number: 70, position: 'F', rating: 65 },
  { id: 102, name: 'Alaettin', number: 54, position: 'F', rating: 76 },
  { id: 103, name: 'Talisca', number: 94, position: 'F', rating: 75 },
  { id: 104, name: 'E. Álvarez', number: 11, position: 'M', rating: 78 },
  { id: 105, name: 'Fred', number: 35, position: 'M', rating: 65 },
  { id: 106, name: 'M. Gue', number: 7, position: 'M', rating: 74 },
  { id: 107, name: 'A. Brown', number: 6, position: 'D', rating: 72 },
  { id: 108, name: 'Y. Demir', number: 3, position: 'D', rating: 68 },
  { id: 109, name: 'L. Mercan', number: 14, position: 'D', rating: 70 },
  { id: 110, name: 'M. Mül', number: 22, position: 'D', rating: 71 },
  { id: 111, name: 'E. Biterge', number: 39, position: 'G', rating: 73 },
  { id: 112, name: 'Julian Niehues', number: 16, position: 'M', rating: 72 },
  { id: 113, name: 'Behrens', number: 26, position: 'M', rating: 65 },
  { id: 114, name: 'Ibrahim', number: 22, position: 'F', rating: 68 },
];

export function getMockLineup(matchId: number): any {
  if (!isMockTestMatch(matchId)) return null;
  const startXI = MOCK_LINEUP_PLAYERS.slice(0, 11).map((p, i) => ({
    player: {
      id: p.id,
      name: p.name,
      number: p.number,
      pos: p.position,
      position: p.position,
      photo: '',
    },
    team: { id: 611, name: 'Fenerbahçe' },
  }));
  const subs = MOCK_LINEUP_PLAYERS.slice(11).map((p) => ({
    player: { id: p.id, name: p.name, number: p.number, pos: p.position, position: p.position, photo: '' },
    team: { id: 611, name: 'Fenerbahçe' },
  }));
  return {
    home: { startXI: [], substitutes: [] },
    away: {
      startXI,
      substitutes: subs,
      team: { id: 611, name: 'Fenerbahçe', logo: '' },
    },
  };
}

export const MATCH_1_EVENTS: any[] = [];
export const MATCH_2_EVENTS: any[] = [];

export function computeLiveState(_matchId: number): any {
  return null;
}

export function getUserPreferenceStats(_matchId: number, _teamId: number): import('../utils/squadPreferenceUtils').UserPreferenceStats | null {
  return null;
}

export function generateAutoSquad(
  _matchId: number,
  _teamId: number,
  _startingXI: { player: { id: number; name: string; number: number; pos: string } }[]
): import('../utils/squadPreferenceUtils').AutoGeneratedSquad | null {
  return null;
}
