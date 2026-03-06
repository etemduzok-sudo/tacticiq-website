/**
 * Mock test data - Hibrit test: GERÇEK maçlar + MOCK topluluk verileri.
 * Mock maçlar kapatıldı; topluluk verileri (tahmin %, ikonlar) her maç için mock döner.
 */

/** Mock maçlar kapalı – sadece API/DB'den gelen gerçek maçlar gösterilir. */
export const MOCK_TEST_ENABLED = false;

/** Canlı maç senaryosu – mock maç yok, kullanılmıyor. */
export const MOCK_MATCH_SIMULATE_LIVE = false;

/** Mock canlı maç 999999 kapalı – sadece gerçek maçlar. */
export const MOCK_LIVE_999999_ENABLED = false;

/** 2 mock maç: 1 saat sonra başlar, geri sayım + başlayınca gerçek zamanlı canlı ilerler. */
export const MOCK_1H_TWO_LIVE_ENABLED = true;

/** Hibrit test: Gerçek maçlar üzerinde topluluk verileri mock. true = her maçta mock topluluk verisi kullan. */
export const USE_MOCK_COMMUNITY_HYBRID = true;

/** 1 saatlik geri sayım sadece kullanıcı "Tamam" deyince başlar. Başlatılmadan önce maçlar "1 saat sonra" görünür, sayacı donmuş kalır. */
let _mock1hScheduledStartMs = 0;
let _mock1hCountdownStarted = false;

export function isMock1HCountdownStarted(): boolean {
  return _mock1hCountdownStarted;
}

/** "Tamam" denince çağrılır; 1 saatlik geri sayımı gerçek zamanlı başlatır. */
export function startMock1HCountdown(): void {
  if (_mock1hCountdownStarted) return;
  _mock1hCountdownStarted = true;
  _mock1hScheduledStartMs = Date.now() + 60 * 60 * 1000;
}

/** Başlangıç zamanı (ms). Başlatılmadıysa maçlar "1 saat sonra" görünsün diye şu an + 1 saat (sadece gösterim). */
export function getMock1HScheduledStartMs(): number {
  if (_mock1hCountdownStarted) return _mock1hScheduledStartMs;
  return Date.now() + 60 * 60 * 1000;
}

/** Eski export uyumluluğu. */
export const MOCK_1H_SCHEDULED_START_MS = 0;
/** Kadro açıklanır: maçtan 5 dk önce. */
export const MOCK_1H_LINEUP_ANNOUNCE_BEFORE_MS = 5 * 60 * 1000;
/** Topluluk tahminleri açılır: maçtan 50 dk önce. */
export const MOCK_1H_COMMUNITY_AVAILABLE_BEFORE_MS = 50 * 60 * 1000;

export function getMock1HLineupAnnounced(): boolean {
  return _mock1hCountdownStarted && Date.now() >= getMock1HScheduledStartMs() - MOCK_1H_LINEUP_ANNOUNCE_BEFORE_MS;
}
export function isMock1HCommunityAvailable(): boolean {
  return _mock1hCountdownStarted && Date.now() >= getMock1HScheduledStartMs() - MOCK_1H_COMMUNITY_AVAILABLE_BEFORE_MS;
}

/** Test maçı: 6 saat sonra başlayacak (veya canlı simülasyonda geçmişte başlamış). */
export const MOCK_MATCH_IDS = {
  TEST_6H: 888001,
  GS_FB: 888001,   // aynı maç (geri uyumluluk)
  TEST_1H: 888002, // 1 saat sonra başlayacak yeni mock maç
  MOCK_1H_A: 888003, // 1h sonra başlayan canlı simülasyon maç 1
  MOCK_1H_B: 888004, // 1h sonra başlayan canlı simülasyon maç 2
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

/** Mock maç ID'sine göre başlangıç zamanı (ms; saniye için /1000). */
export function getMockMatchStart(matchId: number): number {
  if (matchId === MOCK_MATCH_IDS.TEST_1H) return getMatch1HStart();
  if (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B) return getMock1HScheduledStartMs();
  return getMatch1Start();
}

/** 1 saat sonra başlayan 2 mock maç için anlık durum (NS → 1H → HT → 2H → FT). */
export function getMock1HLiveStatus(): { short: string; long: string; elapsed: number | null } {
  const now = Date.now();
  const scheduled = getMock1HScheduledStartMs();
  if (now < scheduled) return { short: 'NS', long: 'Not Started', elapsed: null };
  const elapsedMs = now - scheduled;
  const totalMinutes = elapsedMs / 60000;
  if (totalMinutes < 45) return { short: '1H', long: 'First Half', elapsed: Math.min(44, Math.floor(totalMinutes)) };
  if (totalMinutes < 50) return { short: 'HT', long: 'Halftime', elapsed: 45 };
  if (totalMinutes < 95) return { short: '2H', long: 'Second Half', elapsed: Math.min(90, 45 + Math.floor(totalMinutes - 50)) };
  return { short: 'FT', long: 'Match Finished', elapsed: 90 };
}

/** Canlı skor simülasyonu: 23' gol ev sahibi, 67' gol deplasman. */
function getMock1HLiveGoals(elapsed: number | null): { home: number; away: number } {
  if (elapsed == null || elapsed < 23) return { home: 0, away: 0 };
  if (elapsed < 67) return { home: 1, away: 0 };
  return { home: 1, away: 1 };
}

/** 2 mock maç: 1 saat sonra başlar, geri sayımdan sonra gerçek zamanlı 1H/HT/2H/FT + skor. */
export function getMock1HLiveMatches(): any[] {
  const status = getMock1HLiveStatus();
  const goals = getMock1HLiveGoals(status.elapsed);
  const scheduled = getMock1HScheduledStartMs();
  const ts = Math.floor(scheduled / 1000);
  const base = {
    fixture: {
      date: new Date(scheduled).toISOString(),
      timestamp: ts,
      status,
    },
    goals: { home: goals.home, away: goals.away },
    score: {
      halftime: { home: status.elapsed != null && status.elapsed >= 45 ? (goals.home >= 1 ? 1 : 0) : null, away: status.elapsed != null && status.elapsed >= 45 ? (goals.away >= 1 ? 1 : 0) : null },
      fulltime: { home: goals.home, away: goals.away },
    },
  };
  return [
    {
      ...base,
      fixture: { ...base.fixture, id: MOCK_MATCH_IDS.MOCK_1H_A },
      league: { id: 901, name: 'Mock Demo Lig', country: 'TR', logo: '' },
      teams: { home: { id: 9011, name: 'Demo Ev Sahibi', logo: '' }, away: { id: 9012, name: 'Demo Deplasman', logo: '' } },
    },
    {
      ...base,
      fixture: { ...base.fixture, id: MOCK_MATCH_IDS.MOCK_1H_B },
      league: { id: 902, name: 'Mock Test Lig', country: 'TR', logo: '' },
      teams: { home: { id: 9021, name: 'Test Takım A', logo: '' }, away: { id: 9022, name: 'Test Takım B', logo: '' } },
    },
  ];
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

/** 1h canlı mock maçları (888003, 888004) veya eski test maçları. */
export function isMockTestMatch(matchId: number): boolean {
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B)) return true;
  return false;
}

export function isMockLive999999(matchId: number): boolean {
  return matchId === MOCK_LIVE_999999_ID;
}

/** Tahmin yapılacak takım (Fenerbahçe = 611) */
export function getMockUserTeamId(matchId: number): number | undefined {
  if (!isMockTestMatch(matchId)) return undefined;
  return 611;
}

/** Takım istatistikleri – canlı dakikaya göre simüle (API format: type, home, away). */
function getMock1HLiveMatchStatistics(elapsed: number | null): { type: string; home: number | string; away: number | string }[] {
  if (elapsed == null) {
    return [
      { type: 'Ball Possession', home: '50%', away: '50%' },
      { type: 'Total Shots', home: 0, away: 0 },
      { type: 'Shots on Goal', home: 0, away: 0 },
      { type: 'Corner Kicks', home: 0, away: 0 },
      { type: 'Offsides', home: 0, away: 0 },
      { type: 'Fouls', home: 0, away: 0 },
      { type: 'Yellow Cards', home: 0, away: 0 },
      { type: 'Red Cards', home: 0, away: 0 },
      { type: 'Goalkeeper Saves', home: 0, away: 0 },
      { type: 'Total Passes', home: 0, away: 0 },
      { type: 'Passes Accurate', home: 0, away: 0 },
      { type: 'Passes %', home: '0%', away: '0%' },
    ];
  }
  const t = Math.min(90, elapsed);
  const homePoss = 48 + Math.floor((t / 90) * 8) + (elapsed >= 23 ? 2 : 0) - (elapsed >= 67 ? 2 : 0);
  const awayPoss = 100 - homePoss;
  const homeShots = Math.min(18, Math.floor((t / 90) * 14) + (elapsed >= 23 ? 2 : 0));
  const awayShots = Math.min(12, Math.floor((t / 90) * 10) + (elapsed >= 67 ? 2 : 0));
  const homeSog = Math.min(8, Math.floor(homeShots * 0.45));
  const awaySog = Math.min(5, Math.floor(awayShots * 0.4));
  const corners = Math.floor((t / 90) * 10);
  const homeCorners = Math.min(6, Math.floor(corners * 0.55));
  const awayCorners = corners - homeCorners;
  const homeFouls = Math.min(14, Math.floor((t / 90) * 11));
  const awayFouls = Math.min(12, Math.floor((t / 90) * 10));
  const homeY = elapsed >= 58 ? 1 : 0;
  const awayY = elapsed >= 34 ? 1 : 0;
  const homeSaves = Math.min(4, Math.floor((t / 90) * 3) + (elapsed >= 67 ? 1 : 0));
  const awaySaves = Math.min(5, Math.floor((t / 90) * 4) + (elapsed >= 23 ? 1 : 0));
  const homePasses = Math.min(520, 80 + Math.floor((t / 90) * 420));
  const awayPasses = Math.min(480, 70 + Math.floor((t / 90) * 380));
  const homeAcc = Math.floor(homePasses * 0.88);
  const awayAcc = Math.floor(awayPasses * 0.85);
  return [
    { type: 'Ball Possession', home: `${homePoss}%`, away: `${awayPoss}%` },
    { type: 'Total Shots', home: homeShots, away: awayShots },
    { type: 'Shots on Goal', home: homeSog, away: awaySog },
    { type: 'Corner Kicks', home: homeCorners, away: awayCorners },
    { type: 'Offsides', home: Math.min(3, Math.floor(t / 35)), away: Math.min(2, Math.floor(t / 45)) },
    { type: 'Fouls', home: homeFouls, away: awayFouls },
    { type: 'Yellow Cards', home: homeY, away: awayY },
    { type: 'Red Cards', home: 0, away: 0 },
    { type: 'Goalkeeper Saves', home: homeSaves, away: awaySaves },
    { type: 'Total Passes', home: homePasses, away: awayPasses },
    { type: 'Passes Accurate', home: homeAcc, away: awayAcc },
    { type: 'Passes %', home: `${Math.round((homeAcc / homePasses) * 100)}%`, away: `${Math.round((awayAcc / awayPasses) * 100)}%` },
  ];
}

export function getMockMatchStatistics(matchId: number): any {
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B)) {
    const status = getMock1HLiveStatus();
    return getMock1HLiveMatchStatistics(status.elapsed);
  }
  return null;
}

/** Oyuncu istatistikleri – kadrodaki ilk 11 + yedeklerden oynayanlar (API: home/away array). */
function getMock1HLivePlayerStats(matchId: number): { home: any[]; away: any[] } {
  const status = getMock1HLiveStatus();
  const elapsed = status.elapsed ?? 0;
  const arr = getMock1HLiveLineupArray(matchId);
  if (!arr || arr.length < 2) return { home: [], away: [] };
  const toPlayerStat = (p: any, minutes: number, isHome: boolean): any => {
    const base = (p.player?.id ?? p.id) % 10;
    const passes = minutes > 0 ? Math.min(80, 15 + Math.floor((minutes / 90) * 65) + base) : 0;
    const shots = p.player?.position === 'F' || p.player?.position === 'M' ? (minutes > 0 ? Math.min(5, Math.floor(minutes / 25) + (base % 2)) : 0) : 0;
    const rating = minutes > 0 ? (6.2 + (base * 0.15) + (minutes > 60 ? 0.3 : 0)).toFixed(1) : null;
    return {
      id: p.player?.id ?? p.id,
      name: p.player?.name ?? p.name,
      position: p.player?.position ?? p.position,
      number: p.player?.number ?? p.number,
      minutesPlayed: minutes,
      rating: rating ? parseFloat(rating) : null,
      passes: { total: passes, accurate: Math.floor(passes * 0.9) },
      shots: { total: shots, on: Math.min(shots, 2) },
      goals: 0,
      assists: 0,
    };
  };
  const homeStart = arr[0].startXI || [];
  const awayStart = arr[1].startXI || [];
  const homeSubs = arr[0].substitutes || [];
  const awaySubs = arr[1].substitutes || [];
  const homeSubOn65 = homeSubs[0]?.player?.id ?? homeSubs[0]?.id;
  const awaySubOn72 = awaySubs[0]?.player?.id ?? awaySubs[0]?.id;
  const homeMinutes = (id: number) => {
    if (homeStart.some((x: any) => (x.player?.id ?? x.id) === id)) return Math.min(90, elapsed);
    if (elapsed >= 65 && homeSubOn65 != null && id === homeSubOn65) return Math.max(0, Math.min(90, elapsed - 65));
    return 0;
  };
  const awayMinutes = (id: number) => {
    if (awayStart.some((x: any) => (x.player?.id ?? x.id) === id)) return Math.min(90, elapsed);
    if (elapsed >= 72 && awaySubOn72 != null && id === awaySubOn72) return Math.max(0, Math.min(90, elapsed - 72));
    return 0;
  };
  const allHome = [...homeStart, ...homeSubs].map((item: any) => toPlayerStat(item, homeMinutes(item.player?.id ?? item.id), true)).filter((p: any) => p.minutesPlayed > 0 || p.rating != null);
  const allAway = [...awayStart, ...awaySubs].map((item: any) => toPlayerStat(item, awayMinutes(item.player?.id ?? item.id), false)).filter((p: any) => p.minutesPlayed > 0 || p.rating != null);
  if (elapsed >= 23) {
    const scorer = allHome.find((p: any) => p.number === 9 || p.name?.includes('T. Demir'));
    if (scorer) scorer.goals = 1;
  }
  if (elapsed >= 67) {
    const scorer = allAway.find((p: any) => p.number === 9 || p.name?.includes('Santrafor'));
    if (scorer) scorer.goals = 1;
  }
  return { home: allHome.length ? allHome : [], away: allAway.length ? allAway : [] };
}

export function getMockPlayerStatistics(matchId: number): any[] | null {
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B)) {
    return getMock1HLivePlayerStats(matchId) as any;
  }
  return null;
}

export function getMockMatchEvents(matchId: number): any[] {
  if (!MOCK_1H_TWO_LIVE_ENABLED || (matchId !== MOCK_MATCH_IDS.MOCK_1H_A && matchId !== MOCK_MATCH_IDS.MOCK_1H_B)) return [];
  const status = getMock1HLiveStatus();
  const elapsed = status.elapsed ?? 0;
  const events: any[] = [];
  const homeName = matchId === MOCK_MATCH_IDS.MOCK_1H_A ? 'Demo Ev Sahibi' : 'Test Takım A';
  const awayName = matchId === MOCK_MATCH_IDS.MOCK_1H_A ? 'Demo Deplasman' : 'Test Takım B';
  if (elapsed >= 23) events.push({ time: { elapsed: 23 }, team: { name: homeName }, player: { name: 'T. Demir' }, type: 'Goal', detail: 'Normal Goal' });
  if (elapsed >= 34) events.push({ time: { elapsed: 34 }, team: { name: awayName }, player: { name: 'N. Stoper' }, type: 'Card', detail: 'Yellow Card' });
  if (elapsed >= 45) events.push({ time: { elapsed: 45 }, team: { name: homeName }, type: 'Goal', detail: 'First Half Extra Time' });
  if (elapsed >= 46) events.push({ time: { elapsed: 46 }, team: { name: awayName }, type: 'Goal', detail: 'Second Half Started' });
  if (elapsed >= 58) events.push({ time: { elapsed: 58 }, team: { name: homeName }, player: { name: 'C. Aydın' }, type: 'Card', detail: 'Yellow Card' });
  if (elapsed >= 65) events.push({ time: { elapsed: 65 }, team: { name: homeName }, detail: 'Substitution', type: 'Subst', player: { name: 'V. Sol' }, assist: { name: 'İ. Yılmaz' } });
  if (elapsed >= 67) events.push({ time: { elapsed: 67 }, team: { name: awayName }, player: { name: 'D2. Santrafor' }, type: 'Goal', detail: 'Normal Goal' });
  if (elapsed >= 72) events.push({ time: { elapsed: 72 }, team: { name: awayName }, detail: 'Substitution', type: 'Subst', player: { name: 'E2. Sol Kanat' }, assist: { name: 'Z. Orta Saha' } });
  if (elapsed >= 90) events.push({ time: { elapsed: 90 }, team: { name: homeName }, type: 'Goal', detail: 'Match Finished' });
  return events;
}

/** Topluluk sinyalleri - oyuncu bazlı. Hibrit modda (USE_MOCK_COMMUNITY_HYBRID) tüm maçlar için mock döner. */
export function getMockCommunitySignals(matchId: number): any {
  if (!USE_MOCK_COMMUNITY_HYBRID) return null;
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B) && !isMock1HCommunityAvailable()) return null;
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
 * 1h mock maçlarda topluluk verisi maçtan 50 dk önce açılır (matchId ile kontrol edilmez; sayfa açıkken zaman geçer).
 */
const EMPTY_COMMUNITY_PITCH = { goal: 0, assist: 0, yellowCard: 0, redCard: 0, penalty: 0, substitutedOut: 0, injuredOut: 0, totalPredictions: 0 };

export function getMockCommunityDataForLivePitch(player: { id?: number; position?: string; pos?: string }, _matchId?: number): {
  goal: number;
  assist: number;
  yellowCard: number;
  redCard: number;
  penalty: number;
  substitutedOut: number;
  injuredOut: number;
  totalPredictions: number;
} {
  if (_matchId != null && MOCK_1H_TWO_LIVE_ENABLED && (_matchId === MOCK_MATCH_IDS.MOCK_1H_A || _matchId === MOCK_MATCH_IDS.MOCK_1H_B) && !isMock1HCommunityAvailable())
    return EMPTY_COMMUNITY_PITCH;
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

// ═══════════════════════════════════════════════════════════════════
// 1 SAAT SONRA BAŞLAYAN MOCK MAÇLAR – 25 kişilik kadrolar (3 kaleci)
// ═══════════════════════════════════════════════════════════════════
interface SquadPlayer { id: number; name: string; number: number; position: string; }
function build25ManSquad(teamId: number, baseId: number, names: { gk: string[]; d: string[]; m: string[]; f: string[] }): SquadPlayer[] {
  const out: SquadPlayer[] = [];
  let id = baseId;
  const num = (n: number) => n;
  names.gk.forEach((name, i) => { out.push({ id: id++, name, number: i === 0 ? 1 : 12 + i, position: 'G' }); });
  names.d.forEach((name, i) => { out.push({ id: id++, name, number: 2 + i, position: 'D' }); });
  names.m.forEach((name, i) => { out.push({ id: id++, name, number: 6 + i, position: 'M' }); });
  names.f.forEach((name, i) => { out.push({ id: id++, name, number: 9 + i, position: 'F' }); });
  return out;
}
const MOCK_1H_SQUAD_DEMO_HOME = build25ManSquad(9011, 90101, {
  gk: ['E. Demir', 'O. Kaya', 'S. Yıldız'],
  d: ['A. Öztürk', 'B. Şahin', 'C. Aydın', 'D. Koç', 'E. Arslan', 'F. Güneş', 'G. Çelik', 'H. Mercan'],
  m: ['İ. Yılmaz', 'J. Korkmaz', 'K. Bayrak', 'L. Aslan', 'M. Tekin', 'N. Özdemir', 'P. Acar', 'R. Polat'],
  f: ['T. Demir', 'U. Kurt', 'V. Sol', 'Y. Merkez', 'Z. Sağ', 'W. Forvet'],
});
const MOCK_1H_SQUAD_DEMO_AWAY = build25ManSquad(9012, 90126, {
  gk: ['K. Kaleci', 'L. Yedek', 'M. Üçüncü'],
  d: ['N. Stoper', 'O. Sol Bek', 'P. Sağ Bek', 'Q. Stoper', 'R. Libero', 'S. Kanat', 'T. Bek', 'U. Defans'],
  m: ['V. Önde', 'W. Merkez', 'X. Defansif', 'Y. Kanat', 'Z. Orta Saha', 'A2. Boks', 'B2. İkili', 'C2. Üçlü'],
  f: ['D2. Santrafor', 'E2. Sol Kanat', 'F2. Sağ Kanat', 'G2. Forvet', 'H2. Pivot', 'I2. Uç'],
});
const MOCK_1H_SQUAD_TEST_A = build25ManSquad(9021, 90201, {
  gk: ['Can Kaleci', 'Yedek GK A', 'Üçüncü GK A'],
  d: ['Defans A1', 'Defans A2', 'Defans A3', 'Defans A4', 'Defans A5', 'Defans A6', 'Defans A7', 'Defans A8'],
  m: ['Orta A1', 'Orta A2', 'Orta A3', 'Orta A4', 'Orta A5', 'Orta A6', 'Orta A7', 'Orta A8'],
  f: ['Forvet A1', 'Forvet A2', 'Forvet A3', 'Forvet A4', 'Forvet A5', 'Forvet A6'],
});
const MOCK_1H_SQUAD_TEST_B = build25ManSquad(9022, 90226, {
  gk: ['Kaleci B', 'Yedek GK B', 'Üçüncü GK B'],
  d: ['Defans B1', 'Defans B2', 'Defans B3', 'Defans B4', 'Defans B5', 'Defans B6', 'Defans B7', 'Defans B8'],
  m: ['Orta B1', 'Orta B2', 'Orta B3', 'Orta B4', 'Orta B5', 'Orta B6', 'Orta B7', 'Orta B8'],
  f: ['Forvet B1', 'Forvet B2', 'Forvet B3', 'Forvet B4', 'Forvet B5', 'Forvet B6'],
});

function toStartXIEntry(p: SquadPlayer, teamId: number, teamName: string, grid: string) {
  return {
    player: { id: p.id, name: p.name, number: p.number, pos: p.position, position: p.position, photo: '', grid, rating: 72 + (p.id % 15) },
    grid,
    team: { id: teamId, name: teamName },
  };
}
function toSubEntry(p: SquadPlayer, teamId: number, teamName: string) {
  return {
    player: { id: p.id, name: p.name, number: p.number, pos: p.position, position: p.position, photo: '', rating: 68 + (p.id % 12) },
    team: { id: teamId, name: teamName },
  };
}
/** İlk 11: 1 GK, 4 D, 3 M, 3 F. Kalan 14 yedek. */
function squadToLineup(squad: SquadPlayer[], teamId: number, teamName: string): { startXI: any[]; substitutes: any[]; formation: string } {
  const gk = squad.filter(x => x.position === 'G');
  const d = squad.filter(x => x.position === 'D');
  const m = squad.filter(x => x.position === 'M');
  const f = squad.filter(x => x.position === 'F');
  const startXI = [
    toStartXIEntry(gk[0], teamId, teamName, '4:1'),
    toStartXIEntry(d[0], teamId, teamName, '3:1'),
    toStartXIEntry(d[1], teamId, teamName, '3:2'),
    toStartXIEntry(d[2], teamId, teamName, '3:3'),
    toStartXIEntry(d[3], teamId, teamName, '3:4'),
    toStartXIEntry(m[0], teamId, teamName, '2:1'),
    toStartXIEntry(m[1], teamId, teamName, '2:2'),
    toStartXIEntry(m[2], teamId, teamName, '2:3'),
    toStartXIEntry(f[0], teamId, teamName, '1:1'),
    toStartXIEntry(f[1], teamId, teamName, '1:2'),
    toStartXIEntry(f[2], teamId, teamName, '1:3'),
  ];
  const subs = [...gk.slice(1), ...d.slice(4), ...m.slice(3), ...f.slice(3)].map(p => toSubEntry(p, teamId, teamName));
  return { startXI, substitutes: subs, formation: '4-3-3' };
}

/** 888003/888004 için kadro (maçtan 5 dk önce açıklanır). Dizi formatı: [ev sahibi, deplasman]. */
export function getMock1HLiveLineupArray(matchId: number): any[] | null {
  if (!MOCK_1H_TWO_LIVE_ENABLED || (matchId !== MOCK_MATCH_IDS.MOCK_1H_A && matchId !== MOCK_MATCH_IDS.MOCK_1H_B)) return null;
  if (!getMock1HLineupAnnounced()) return null;
  if (matchId === MOCK_MATCH_IDS.MOCK_1H_A) {
    const home = squadToLineup(MOCK_1H_SQUAD_DEMO_HOME, 9011, 'Demo Ev Sahibi');
    const away = squadToLineup(MOCK_1H_SQUAD_DEMO_AWAY, 9012, 'Demo Deplasman');
    return [
      { team: { id: 9011, name: 'Demo Ev Sahibi' }, ...home },
      { team: { id: 9012, name: 'Demo Deplasman' }, ...away },
    ];
  }
  const home = squadToLineup(MOCK_1H_SQUAD_TEST_A, 9021, 'Test Takım A');
  const away = squadToLineup(MOCK_1H_SQUAD_TEST_B, 9022, 'Test Takım B');
  return [
    { team: { id: 9021, name: 'Test Takım A' }, ...home },
    { team: { id: 9022, name: 'Test Takım B' }, ...away },
  ];
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
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B)) {
    const arr = getMock1HLiveLineupArray(matchId);
    if (arr && arr.length >= 2) return { home: arr[0], away: arr[1] };
    return null;
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

export function computeLiveState(matchIdOrStart: number, _events?: any): any {
  const matchId = matchIdOrStart;
  if (MOCK_1H_TWO_LIVE_ENABLED && (matchId === MOCK_MATCH_IDS.MOCK_1H_A || matchId === MOCK_MATCH_IDS.MOCK_1H_B)) {
    const status = getMock1HLiveStatus();
    const goals = getMock1HLiveGoals(status.elapsed);
    return {
      status: status.short,
      statusLong: status.long,
      elapsed: status.elapsed,
      homeScore: goals.home,
      awayScore: goals.away,
      homeGoals: goals.home,
      awayGoals: goals.away,
      timestamp: Math.floor(getMock1HScheduledStartMs() / 1000),
    };
  }
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
