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

function getApiKey(): string | null {
  const key =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_APIFOOTBALL_KEY;
  return key && String(key).trim() ? String(key).trim() : null;
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
 * BJK–GS canlı verisi: fixture + events.
 * Anahtar yoksa, kota dolduysa veya canlı BJK–GS maçı yoksa null döner.
 * Her başarılı çağrı 2 istek sayılır (fixtures + events); 100'e ulaşınca sistem eski haline döner.
 */
export async function fetchBjkGsLiveFromApiFootball(
  ourMatchId: string
): Promise<{
  matchData: Record<string, any>;
  events: any[];
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
    const eventsRaw = await fetchFixtureEvents(fixtureId);
    await incrementUsageAndMaybeExhaust(2);
    const matchData = mapFixtureToOurFormat(bjkGs, ourMatchId);
    const events = eventsRaw.map(mapEventToOurFormat);
    return { matchData, events };
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
