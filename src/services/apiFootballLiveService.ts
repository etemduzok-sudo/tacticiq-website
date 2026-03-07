/**
 * Api-Football (api-sports.io) canlı maç verisi – sadece BJK–GS maçı için deneme.
 *
 * - EXPO_PUBLIC_APIFOOTBALL_KEY=your_api_key ile kullanın.
 * - Sadece bu maç için dakikada 1 güncelleme (100 hak ~100 dakika).
 * - 100 API hakkı bitince otomatik eski sisteme döner (backend); kota kalıcı kaydedilir.
 *
 * Eskiye dönmek: EXPO_PUBLIC_APIFOOTBALL_KEY'i silin veya kota bitince otomatik döner.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/AppVersion';

const APIFOOTBALL_BJK_ID = 549;
const APIFOOTBALL_GS_ID = 645;
const BASE_URL = 'https://v3.football.api-sports.io';

const STORAGE_KEY_USAGE = 'apifootball_bjk_gs_usage';
const STORAGE_KEY_EXHAUSTED = 'apifootball_quota_exhausted';
const QUOTA_LIMIT = 100;

let quotaExhaustedCache: boolean | null = null;
let _keyMissingWarned = false;

function getApiKey(): string | null {
  const fromProcess =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APIFOOTBALL_KEY;
  const fromWindow =
    typeof window !== 'undefined' && (window as any).__EXPO_PUBLIC_APIFOOTBALL_KEY;
  const key = fromProcess || fromWindow;
  const value = key && String(key).trim() ? String(key).trim() : null;
  if (!value && typeof __DEV__ !== 'undefined' && __DEV__ && !_keyMissingWarned) {
    _keyMissingWarned = true;
    try {
      (console as any).warn?.('[ApiFootball] EXPO_PUBLIC_APIFOOTBALL_KEY yok; .env dosyasinda tanimli olmali ve "npm run web" yeniden baslatilmali.');
    } catch (_) {}
  }
  return value;
}

/** Kota doldu mu? (bir kez dolunca kalıcı – sistem eski haline döner) */
export async function isQuotaExhausted(): Promise<boolean> {
  if (quotaExhaustedCache !== null) return quotaExhaustedCache;
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY_EXHAUSTED);
    quotaExhaustedCache = v === '1';
  } catch {
    quotaExhaustedCache = false;
  }
  return quotaExhaustedCache;
}

/** Kullanılan istek sayısını artır; 100'e ulaşınca kotayı doldur (eski sisteme dön) */
async function incrementUsageAndMaybeExhaust(requestsUsed: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USAGE);
    const current = Math.min(QUOTA_LIMIT, parseInt(raw || '0', 10) || 0);
    const next = Math.min(QUOTA_LIMIT, current + requestsUsed);
    await AsyncStorage.setItem(STORAGE_KEY_USAGE, String(next));
    if (next >= QUOTA_LIMIT) {
      await AsyncStorage.setItem(STORAGE_KEY_EXHAUSTED, '1');
      quotaExhaustedCache = true;
    }
  } catch (_) {}
}

/** Maç BJK–GS mi? (uygulama takım id'leri: 549 Beşiktaş, 645 Galatasaray) */
export function isBjkGsMatch(matchData: {
  teams?: { home?: { id?: number }; away?: { id?: number } };
}): boolean {
  const home = matchData?.teams?.home?.id;
  const away = matchData?.teams?.away?.id;
  if (home == null || away == null) return false;
  const bjk = APIFOOTBALL_BJK_ID;
  const gs = APIFOOTBALL_GS_ID;
  return (home === bjk && away === gs) || (home === gs && away === bjk);
}

export function isApiFootballBjkGsEnabled(): boolean {
  return getApiKey() != null;
}

/** Api-Football'dan canlı maç listesini çek */
async function fetchLiveFixtures(): Promise<any[]> {
  const key = getApiKey();
  if (!key) return [];
  const res = await fetch(`${BASE_URL}/fixtures?live=all`, {
    method: 'GET',
    headers: {
      'x-rapidapi-host': API_CONFIG.apiFootball.host,
      'x-rapidapi-key': key,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const list = data?.response;
  return Array.isArray(list) ? list : [];
}

/** Canlı maç listesinden BJK–GS maçını bul (takım adına göre) */
function findBjkGsFixture(fixtures: any[]): any | null {
  for (const f of fixtures) {
    const home = (f.teams?.home?.name || '').toLowerCase();
    const away = (f.teams?.away?.name || '').toLowerCase();
    const hasBjk =
      home.includes('beşiktaş') ||
      home.includes('besiktas') ||
      away.includes('beşiktaş') ||
      away.includes('besiktas');
    const hasGs =
      home.includes('galatasaray') || away.includes('galatasaray');
    if (hasBjk && hasGs) return f;
  }
  return null;
}

/** Belirli fixture için event listesini çek */
async function fetchFixtureEvents(fixtureId: number): Promise<any[]> {
  const key = getApiKey();
  if (!key) return [];
  const res = await fetch(
    `${BASE_URL}/fixtures/events?fixture=${fixtureId}`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': API_CONFIG.apiFootball.host,
        'x-rapidapi-key': key,
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const list = data?.response;
  return Array.isArray(list) ? list : [];
}

/** Api-Football fixture statistics (PRO plan) – [{ team, statistics: [{ type, value }] }] */
async function fetchFixtureStatistics(fixtureId: number): Promise<any[] | null> {
  const key = getApiKey();
  if (!key) return null;
  const res = await fetch(
    `${BASE_URL}/fixtures/statistics?fixture=${fixtureId}`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': API_CONFIG.apiFootball.host,
        'x-rapidapi-key': key,
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const list = data?.response;
  if (!Array.isArray(list) || list.length < 2) return null;
  return list;
}

/** Api-Football fixture players (PRO plan) – [{ team, players: [{ player, statistics }] }] */
async function fetchFixturePlayers(fixtureId: number): Promise<any[] | null> {
  const key = getApiKey();
  if (!key) return null;
  const res = await fetch(
    `${BASE_URL}/fixtures/players?fixture=${fixtureId}`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': API_CONFIG.apiFootball.host,
        'x-rapidapi-key': key,
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const list = data?.response;
  if (!Array.isArray(list) || list.length === 0) return null;
  return list;
}

/** Api-Football players response → { home: PlayerStats[], away: PlayerStats[] } (MatchStats format) */
function transformApiPlayersToApp(apiResponse: any[]): { home: any[]; away: any[] } {
  const result = { home: [] as any[], away: [] as any[] };
  apiResponse.forEach((teamData: any, index: number) => {
    const teamKey = index === 0 ? 'home' : 'away';
    const teamId = teamData.team?.id;
    const teamName = teamData.team?.name;
    if (!teamData.players || !Array.isArray(teamData.players)) return;
    result[teamKey] = teamData.players.map((playerData: any) => {
      const player = playerData.player || {};
      const stats = playerData.statistics?.[0] || {};
      const games = stats.games || {};
      const shots = stats.shots || {};
      const goals = stats.goals || {};
      const passes = stats.passes || {};
      const tackles = stats.tackles || {};
      const duels = stats.duels || {};
      const dribbles = stats.dribbles || {};
      const fouls = stats.fouls || {};
      const cards = stats.cards || {};
      const posStr = String(games.position || '').toUpperCase();
      const isGoalkeeper = posStr === 'G' || posStr === 'GK' || String(games.position || '').toLowerCase().includes('goalkeeper');
      const passesCompletedRaw = parseInt(passes.accuracy, 10) || 0;
      const passesTotalRaw = parseInt(passes.total, 10) || 0;
      const passAccuracy = passesTotalRaw > 0 ? Math.round((passesCompletedRaw / passesTotalRaw) * 100) : 0;
      const rawSaves = stats.goalkeeper?.saves ?? stats.goals?.saves ?? stats.saves;
      const gkSaves = isGoalkeeper ? (parseInt(rawSaves, 10) || 0) : 0;
      const rawConceded = goals.conceded ?? stats.goals?.conceded;
      const gkConceded = isGoalkeeper ? (parseInt(rawConceded, 10) || 0) : 0;
      const savePct = (gkSaves + gkConceded) > 0 ? Math.round((100 * gkSaves) / (gkSaves + gkConceded)) : 0;
      return {
        id: player.id,
        name: player.name,
        photo: player.photo,
        number: games.number,
        position: games.position || 'MF',
        rating: parseFloat(games.rating) || 0,
        minutesPlayed: games.minutes || 0,
        goals: goals.total || 0,
        assists: goals.assists || 0,
        shots: shots.total || 0,
        shotsOnTarget: shots.on || 0,
        totalPasses: passesTotalRaw,
        passesCompleted: passesCompletedRaw,
        passAccuracy,
        keyPasses: passes.key || 0,
        dribbleAttempts: dribbles.attempts || 0,
        dribbleSuccess: dribbles.success || 0,
        tackles: tackles.total || 0,
        blocks: tackles.blocks || 0,
        interceptions: tackles.interceptions || 0,
        duelsTotal: duels.total || 0,
        duelsWon: duels.won || 0,
        foulsDrawn: fouls.drawn || 0,
        foulsCommitted: fouls.committed || 0,
        yellowCards: cards.yellow || 0,
        redCards: cards.red || 0,
        isGoalkeeper,
        saves: gkSaves,
        goalsAgainst: gkConceded,
        savePercentage: isGoalkeeper ? savePct : undefined,
        teamId,
        teamName,
      };
    });
  });
  return result;
}

/** Api-Football fixture → uygulama matchData formatı (fixture + goals + teams) */
function mapFixtureToOurFormat(
  apiFixture: any,
  ourMatchId: string
): Record<string, any> {
  const fixture = apiFixture?.fixture || {};
  const goals = apiFixture?.goals || {};
  const teams = apiFixture?.teams || {};
  const status = fixture?.status || {};
  return {
    id: ourMatchId,
    fixture: {
      id: ourMatchId,
      date: fixture.date,
      timestamp: fixture.timestamp
        ? Math.floor(new Date(fixture.date).getTime() / 1000)
        : undefined,
      status: {
        short: status.short || 'NS',
        long: status.long || 'Not Started',
        elapsed: status.elapsed ?? null,
        extraTime: null,
      },
    },
    goals: { home: goals.home ?? 0, away: goals.away ?? 0 },
    score: {
      halftime: apiFixture?.score?.halftime
        ? {
            home: apiFixture.score.halftime.home,
            away: apiFixture.score.halftime.away,
          }
        : null,
      fulltime: null,
    },
    teams: {
      home: teams.home
        ? {
            id: APIFOOTBALL_GS_ID === teams.home?.id ? 645 : 549,
            name: teams.home.name,
            logo: teams.home.logo,
          }
        : undefined,
      away: teams.away
        ? {
            id: APIFOOTBALL_GS_ID === teams.away?.id ? 645 : 549,
            name: teams.away.name,
            logo: teams.away.logo,
          }
        : undefined,
    },
  };
}

/** Api-Football event → uygulama event formatı (MatchLive aynen işleyebilir) */
function mapEventToOurFormat(e: any): any {
  const time = e?.time || {};
  return {
    time: {
      elapsed: time.elapsed ?? 0,
      extra: time.extra ?? null,
    },
    elapsed: time.elapsed,
    minute: time.elapsed,
    extra: time.extra,
    type: e?.type || 'Unknown',
    detail: e?.detail || '',
    comments: e?.comments ?? null,
    team: e?.team,
    player: e?.player,
    assist: e?.assist,
  };
}

/**
 * BJK–GS canlı verisi: fixture + events + statistics + players.
 * Anahtar yoksa, kota dolduysa veya canlı BJK–GS maçı yoksa null döner.
 * Her başarılı çağrı 4 istek sayılır (fixtures + events + statistics + players); 100'e ulaşınca sistem eski haline döner.
 */
export async function fetchBjkGsLiveFromApiFootball(
  ourMatchId: string
): Promise<{
  matchData: Record<string, any>;
  events: any[];
  statistics?: any[] | null;
  players?: { home: any[]; away: any[] } | null;
} | null> {
  const key = getApiKey();
  if (!key) return null;
  if (await isQuotaExhausted()) return null;
  try {
    const fixtures = await fetchLiveFixtures();
    const bjkGs = findBjkGsFixture(fixtures);
    if (!bjkGs) return null;
    const fixtureId = bjkGs?.fixture?.id;
    if (!fixtureId) return null;
    const [eventsRaw, statsRaw, playersRaw] = await Promise.all([
      fetchFixtureEvents(fixtureId),
      fetchFixtureStatistics(fixtureId),
      fetchFixturePlayers(fixtureId),
    ]);
    await incrementUsageAndMaybeExhaust(4);
    const matchData = mapFixtureToOurFormat(bjkGs, ourMatchId);
    const events = eventsRaw.map(mapEventToOurFormat);
    const players = playersRaw && playersRaw.length > 0 ? transformApiPlayersToApp(playersRaw) : null;
    return {
      matchData,
      events,
      statistics: statsRaw && statsRaw.length >= 2 ? statsRaw : null,
      players: players && (players.home.length > 0 || players.away.length > 0) ? players : null,
    };
  } catch (err) {
    console.warn('[ApiFootball] BJK-GS canlı veri alınamadı:', err);
    return null;
  }
}

/**
 * Canlı event listesi – sadece BJK–GS ve anahtar varsa Api-Football kullanılır.
 * Aksi halde null döner (çağıran normal backend'e gidecek).
 */
export async function getBjkGsLiveEvents(
  ourMatchId: string
): Promise<{ events: any[]; matchNotStarted?: boolean } | null> {
  const data = await fetchBjkGsLiveFromApiFootball(ourMatchId);
  if (!data) return null;
  return {
    events: data.events,
    matchNotStarted: false,
  };
}
