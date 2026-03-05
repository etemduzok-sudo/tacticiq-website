/**
 * Mock test data - Test maçı (6 saat sonra başlayacak) ve mock veriler.
 * MOCK_TEST_ENABLED = true iken Dashboard'da test maçı görünür ve tüm güncellemeler test edilebilir.
 */

/** Mock maç kapalı: 75K API kotası 50K DB güncelleme + 25K canlı maç testi için kullanılacak. */
export const MOCK_TEST_ENABLED = true;

/** Canlı maç senaryosu: true iken mock maç "şu an oynanıyor" (1H, dakika ilerliyor) olarak gösterilir. */
export const MOCK_MATCH_SIMULATE_LIVE = true;

/** Mock canlı maç 999999: Dashboard canlı listesinde gösterilir; topluluk verileri var, kullanıcı tahmini yok. */
export const MOCK_LIVE_999999_ENABLED = true;

/** Test maçı: 6 saat sonra başlayacak (veya canlı simülasyonda geçmişte başlamış). */
export const MOCK_MATCH_IDS = {
  TEST_6H: 888001,
  GS_FB: 888001,   // aynı maç (geri uyumluluk)
  TEST_1H: 888002, // 1 saat sonra başlayacak yeni mock maç
  REAL_BARCA: 999002,
} as Record<string, number>;

/** Canlı simülasyonda: maç başlangıcı "şu an - 10 dakika" (1. yarı oynanıyor). Aksi halde 6 saat sonra. */
export function getMatch1Start(): number {
  if (typeof MOCK_MATCH_SIMULATE_LIVE !== 'undefined' && MOCK_MATCH_SIMULATE_LIVE) {
    return Date.now() - 10 * 60 * 1000; // 10 dakika önce başladı
  }
  return Date.now() + 6 * 60 * 60 * 1000;
}

/** 1 saat sonra başlayacak mock maç (TEST_1H) için başlangıç zamanı. */
export function getMatch1HStart(): number {
  return Date.now() + 60 * 60 * 1000;
}

export function getMatch2Start(): number {
  return getMatch1Start();
}

/** Mock maç ID'sine göre başlangıç zamanı (saniye cinsinden timestamp). */
export function getMockMatchStart(matchId: number): number {
  if (matchId === MOCK_MATCH_IDS.TEST_1H) return getMatch1HStart();
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

/** 1 saat sonra başlayacak mock maç için fixture status (henüz başlamadı). */
function getMockFixtureStatus1H(): { short: string; long: string; elapsed: number | null } {
  return { short: 'NS', long: 'Not Started', elapsed: null };
}

export function getMockMatches(): any[] {
  if (!MOCK_TEST_ENABLED) return [];
  const start6h = getMatch1Start();
  const status6h = getMockFixtureStatus();
  const start1h = getMatch1HStart();
  const status1h = getMockFixtureStatus1H();
  return [
    {
      fixture: {
        id: MOCK_MATCH_IDS.TEST_6H,
        date: new Date(start6h).toISOString(),
        timestamp: Math.floor(start6h / 1000),
        status: status6h,
      },
      league: { id: 203, name: 'UEFA Europa League', country: 'Europe', logo: '' },
      teams: {
        home: { id: 65, name: 'Nottingham Forest', logo: '' },
        away: { id: 611, name: 'Fenerbahçe', logo: '' },
      },
      goals: { home: null, away: null },
      score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
    },
    {
      fixture: {
        id: MOCK_MATCH_IDS.TEST_1H,
        date: new Date(start1h).toISOString(),
        timestamp: Math.floor(start1h / 1000),
        status: status1h,
      },
      league: { id: 204, name: 'Mock Lig', country: 'TR', logo: '' },
      teams: {
        home: { id: 100, name: 'Mock Ev Sahibi', logo: '' },
        away: { id: 611, name: 'Fenerbahçe', logo: '' },
      },
      goals: { home: null, away: null },
      score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
    },
  ];
}

/** Mock canlı maç ID (topluluk verisi var, kullanıcı tahmini yok senaryosu). */
export const MOCK_LIVE_999999_ID = 999999;

/** Canlı listede gösterilecek mock maç 999999 – 52. dk, 2H, skor 5-4. */
export function getMockLiveMatch999999(): any {
  const start = Date.now() - 52 * 60 * 1000;
  return {
    fixture: {
      id: MOCK_LIVE_999999_ID,
      date: new Date(start).toISOString(),
      timestamp: Math.floor(start / 1000),
      status: { short: '2H', long: 'Second Half', elapsed: 52 },
      venue: { name: 'Mock Stadium' },
    },
    league: { id: 999, name: 'Mock League', country: 'TR', logo: null },
    teams: {
      home: { id: 9999, name: 'Mock Home Team', logo: null },
      away: { id: 9998, name: 'Mock Away Team', logo: null },
    },
    goals: { home: 5, away: 4 },
    score: {
      halftime: { home: 3, away: 2 },
      fulltime: { home: 5, away: 4 },
    },
  };
}

export function isMockTestMatch(matchId: number): boolean {
  if (!MOCK_TEST_ENABLED) return false;
  return matchId === MOCK_MATCH_IDS.TEST_6H || matchId === MOCK_MATCH_IDS.GS_FB || matchId === MOCK_MATCH_IDS.TEST_1H;
}

export function isMockLive999999(matchId: number): boolean {
  return matchId === MOCK_LIVE_999999_ID;
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

/**
 * Canlı saha (Gerçek kadro) üzerinde topluluk değerlendirme ikonlarını göstermek için mock veri.
 * Sayılar (count) formatında; yüzde >10 çıkacak şekilde (gol atar, oyundan çıkar, sarı/kırmızı kart).
 */
export function getMockCommunityDataForLivePitch(player: { id?: number; position?: string; pos?: string }): {
  goal: number;
  assist: number;
  yellowCard: number;
  redCard: number;
  penalty: number;
  substitutedOut: number;
  injuredOut: number;
  totalPredictions: number;
} {
  const id = Number(player?.id) ?? 0;
  const pos = (player?.position || player?.pos || '').toUpperCase();
  const seed = id % 11;
  const total = 100;
  const isGK = pos === 'GK' || pos === 'G';
  const isDef = /D|CB|LB|RB/.test(pos);
  const isMid = /M|CM|CDM|CAM/.test(pos);
  if (isGK) {
    return { goal: 2, assist: 1, yellowCard: 8, redCard: 1, penalty: 12, substitutedOut: 6, injuredOut: 2, totalPredictions: total };
  }
  if (isDef) {
    return {
      goal: 6 + seed,
      assist: 10 + seed,
      yellowCard: 18 + (seed % 10),
      redCard: 1 + (seed % 3),
      penalty: 4,
      substitutedOut: 14 + (seed % 8),
      injuredOut: 2,
      totalPredictions: total,
    };
  }
  if (isMid) {
    return {
      goal: 20 + (seed % 15),
      assist: 28 + (seed % 10),
      yellowCard: 12 + (seed % 8),
      redCard: 1,
      penalty: 8 + (seed % 5),
      substitutedOut: 22 + (seed % 12),
      injuredOut: 3,
      totalPredictions: total,
    };
  }
  // Forvet
  return {
    goal: 38 + (seed % 12),
    assist: 22 + (seed % 8),
    yellowCard: 10 + (seed % 6),
    redCard: 2,
    penalty: 18 + (seed % 7),
    substitutedOut: 18 + (seed % 10),
    injuredOut: 1,
    totalPredictions: total,
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

/** Mock canlı maç 999999 için kadro (Mock Home Team 9999, Mock Away Team 9998) – bağlantı hatasında sahada gösterilir */
export function getMockLineup999999(): any {
  const homePlayers = [
    { id: 201, name: 'F. Koç', number: 9, position: 'F', grid: '1:1', rating: 78 },
    { id: 202, name: 'D. Aksoy', number: 11, position: 'F', grid: '1:2', rating: 76 },
    { id: 203, name: 'B. Arslan', number: 7, position: 'F', grid: '1:3', rating: 74 },
    { id: 204, name: 'K. Yıldız', number: 10, position: 'M', grid: '2:1', rating: 82 },
    { id: 205, name: 'M. Özkan', number: 8, position: 'M', grid: '2:2', rating: 79 },
    { id: 206, name: 'H. Çelik', number: 6, position: 'M', grid: '2:3', rating: 77 },
    { id: 207, name: 'A. Yılmaz', number: 3, position: 'D', grid: '3:1', rating: 75 },
    { id: 208, name: 'S. Kaya', number: 4, position: 'D', grid: '3:2', rating: 76 },
    { id: 209, name: 'E. Demir', number: 5, position: 'D', grid: '3:3', rating: 74 },
    { id: 210, name: 'C. Şahin', number: 2, position: 'D', grid: '3:4', rating: 73 },
    { id: 211, name: 'O. Kaleci', number: 1, position: 'G', grid: '4:1', rating: 80 },
  ];
  const awayPlayers = [
    { id: 301, name: 'Ö. Kılıç', number: 9, position: 'F', grid: '1:1', rating: 77 },
    { id: 302, name: 'Ç. Yılmaz', number: 11, position: 'F', grid: '1:2', rating: 75 },
    { id: 303, name: 'Ş. Aslan', number: 7, position: 'F', grid: '1:3', rating: 76 },
    { id: 304, name: 'İ. Koç', number: 10, position: 'M', grid: '2:1', rating: 81 },
    { id: 305, name: 'G. Bayrak', number: 8, position: 'M', grid: '2:2', rating: 78 },
    { id: 306, name: 'T. Yıldırım', number: 6, position: 'M', grid: '2:3', rating: 76 },
    { id: 307, name: 'U. Tekin', number: 3, position: 'D', grid: '3:1', rating: 74 },
    { id: 308, name: 'R. Öztürk', number: 4, position: 'D', grid: '3:2', rating: 75 },
    { id: 309, name: 'V. Aydın', number: 5, position: 'D', grid: '3:3', rating: 73 },
    { id: 310, name: 'Z. Korkmaz', number: 2, position: 'D', grid: '3:4', rating: 72 },
    { id: 311, name: 'K. Kaleci', number: 1, position: 'G', grid: '4:1', rating: 79 },
  ];
  const toStartXI = (list: typeof homePlayers, teamId: number, teamName: string) =>
    list.map((p) => ({
      player: { id: p.id, name: p.name, number: p.number, pos: p.position, position: p.position, photo: '', grid: p.grid, rating: p.rating },
      grid: p.grid,
      team: { id: teamId, name: teamName },
    }));
  // Yedek oyuncular – "Yerine kim girmeli?" seçimi için (canlı/biten maç mock)
  const homeSubs = [
    { id: 212, name: 'E. Yılmaz', number: 12, position: 'D', rating: 70 },
    { id: 213, name: 'S. Özdemir', number: 14, position: 'M', rating: 72 },
    { id: 214, name: 'A. Çetin', number: 15, position: 'M', rating: 71 },
    { id: 215, name: 'M. Güneş', number: 17, position: 'F', rating: 73 },
    { id: 216, name: 'K. Öztürk', number: 19, position: 'F', rating: 69 },
    { id: 217, name: 'B. Kaya', number: 20, position: 'G', rating: 68 },
  ];
  const awaySubs = [
    { id: 312, name: 'Y. Demir', number: 12, position: 'D', rating: 70 },
    { id: 313, name: 'R. Şahin', number: 14, position: 'M', rating: 71 },
    { id: 314, name: 'E. Aydın', number: 15, position: 'M', rating: 72 },
    { id: 315, name: 'O. Koç', number: 17, position: 'F', rating: 70 },
    { id: 316, name: 'T. Arslan', number: 19, position: 'F', rating: 69 },
    { id: 317, name: 'S. Yıldız', number: 20, position: 'G', rating: 67 },
  ];
  const toSubstitute = (list: { id: number; name: string; number: number; position: string; rating?: number }[], teamId: number, teamName: string) =>
    list.map((p) => ({
      player: { id: p.id, name: p.name, number: p.number, pos: p.position, position: p.position, photo: '', rating: p.rating ?? 70 },
      team: { id: teamId, name: teamName },
    }));
  return [
    { team: { id: 9999, name: 'Mock Home Team' }, startXI: toStartXI(homePlayers, 9999, 'Mock Home Team'), formation: '4-3-3', substitutes: toSubstitute(homeSubs, 9999, 'Mock Home Team') },
    { team: { id: 9998, name: 'Mock Away Team' }, startXI: toStartXI(awayPlayers, 9998, 'Mock Away Team'), formation: '4-3-3', substitutes: toSubstitute(awaySubs, 9998, 'Mock Away Team') },
  ];
}

export function getMockLineup(matchId: number): any {
  if (isMockLive999999(matchId)) {
    const lineups = getMockLineup999999();
    return { home: lineups[0], away: lineups[1] };
  }
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
