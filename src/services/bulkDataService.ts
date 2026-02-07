/**
 * Bulk Data Service - Favori takımların TÜM verilerini tek seferde indir
 * 
 * Veriler:
 * - Tüm sezon maçları (geçmiş + gelecek, tüm kupalar)
 * - Takım kadrosu (tüm oyuncular)
 * - Teknik direktör bilgisi
 * - Takım bilgisi (kuruluş, stadyum vb.)
 * 
 * Toplam boyut: ~1-5 MB (6 takım için)
 * Avantajlar:
 * - Uygulama anında açılır (cache'den)
 * - Offline oynanabilir
 * - API çağrısı azalır
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiEndpoint, API_CONFIG } from '../config/AppVersion';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

// ============ STORAGE KEYS ============
export const BULK_STORAGE_KEYS = {
  /** Ana bulk veri deposu (tüm takımlar) */
  BULK_DATA: 'tacticiq-bulk-data',
  /** Bulk veri indirme timestamp'i */
  BULK_TIMESTAMP: 'tacticiq-bulk-timestamp',
  /** Bulk veri versiyon (takım ID'leri değişince artırılır) */
  BULK_VERSION: 'tacticiq-bulk-version',
  /** Bulk indirme durumu */
  BULK_STATUS: 'tacticiq-bulk-status',
  /** Takım bazlı maç cache (hızlı erişim) */
  BULK_MATCHES_PREFIX: 'tacticiq-bulk-matches-',
  /** Takım bazlı kadro cache */
  BULK_SQUAD_PREFIX: 'tacticiq-bulk-squad-',
  /** Takım bazlı koç cache */
  BULK_COACH_PREFIX: 'tacticiq-bulk-coach-',
  /** Takım bazlı bilgi cache */
  BULK_INFO_PREFIX: 'tacticiq-bulk-info-',
} as const;

// ============ TYPES ============
export interface BulkTeamData {
  info: {
    id: number;
    name: string;
    code?: string;
    country?: string;
    founded?: number;
    national?: boolean;
    venue?: {
      name: string;
      city: string;
      capacity?: number;
    } | null;
  } | null;
  coach: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    nationality?: string;
  } | null;
  squad: Array<{
    id: number;
    number?: number;
    name: string;
    age?: number;
    position?: string;
    photo?: string | null;
  }>;
  matches: Array<any>; // Match type from match.types.ts
}

export interface BulkDataResponse {
  success: boolean;
  data: Record<number, BulkTeamData>;
  meta?: {
    teamCount: number;
    totalMatches: number;
    totalPlayers: number;
    sizeKB: number;
    elapsedMs: number;
    season: number;
    downloadedAt: string;
  };
}

export interface BulkDownloadProgress {
  phase: 'starting' | 'downloading' | 'saving' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  teamCount?: number;
  matchCount?: number;
  playerCount?: number;
  sizeKB?: number;
  error?: string;
}

export type ProgressCallback = (progress: BulkDownloadProgress) => void;

// ============ API URL ============
function getBaseUrl(): string {
  const useProductionInDev =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_USE_PRODUCTION_API === 'true';

  if (Platform.OS === 'web' || __DEV__ || typeof window !== 'undefined') {
    if (useProductionInDev) return API_CONFIG.backend.production;
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname.replace(':8081', '')}:3001/api`;
      }
    }
    return 'http://localhost:3001/api';
  }
  return getApiEndpoint();
}

// ============ BULK DATA CACHE DURATION ============
/** Bulk veri cache süresi: 12 saat */
const BULK_CACHE_DURATION = 12 * 60 * 60 * 1000;

// ============ MAIN FUNCTIONS ============

/**
 * Favori takımlar için tüm verileri tek seferde indir ve cache'le
 * @param teamIds Favori takım ID'leri
 * @param onProgress Progress callback (UI güncellemesi için)
 * @returns Bulk data response veya null (hata durumunda)
 */
export async function downloadBulkData(
  teamIds: number[],
  onProgress?: ProgressCallback
): Promise<BulkDataResponse | null> {
  if (!teamIds || teamIds.length === 0) {
    logger.warn('No team IDs provided for bulk download', undefined, 'BULK');
    return null;
  }

  const validIds = teamIds.filter(id => id && typeof id === 'number' && id > 0);
  if (validIds.length === 0) {
    logger.warn('No valid team IDs for bulk download', { teamIds }, 'BULK');
    return null;
  }

  logger.info('📦 Starting bulk data download', {
    teamCount: validIds.length,
    teamIds: validIds,
  }, 'BULK');

  // Phase 1: Starting
  onProgress?.({
    phase: 'starting',
    progress: 5,
    message: 'Takım verileri hazırlanıyor...',
  });

  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/bulk-data/download`;

    // Phase 2: Downloading
    onProgress?.({
      phase: 'downloading',
      progress: 15,
      message: 'Veriler indiriliyor...',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 dakika timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamIds: validIds,
        season: 2025,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result: BulkDataResponse = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Bulk data response unsuccessful');
    }

    // Phase 3: Progress update
    onProgress?.({
      phase: 'downloading',
      progress: 60,
      message: `${result.meta?.totalMatches || 0} maç, ${result.meta?.totalPlayers || 0} oyuncu indirildi`,
      teamCount: result.meta?.teamCount,
      matchCount: result.meta?.totalMatches,
      playerCount: result.meta?.totalPlayers,
      sizeKB: result.meta?.sizeKB,
    });

    // Phase 4: Saving to AsyncStorage
    onProgress?.({
      phase: 'saving',
      progress: 70,
      message: 'Veriler cihaza kaydediliyor...',
    });

    await saveBulkDataToStorage(result.data, validIds);

    // Phase 5: Complete
    onProgress?.({
      phase: 'complete',
      progress: 100,
      message: 'Tüm veriler başarıyla indirildi!',
      teamCount: result.meta?.teamCount,
      matchCount: result.meta?.totalMatches,
      playerCount: result.meta?.totalPlayers,
      sizeKB: result.meta?.sizeKB,
    });

    logger.info('📦 Bulk download complete', {
      teams: Object.keys(result.data).length,
      totalMatches: result.meta?.totalMatches,
      totalPlayers: result.meta?.totalPlayers,
      sizeKB: result.meta?.sizeKB,
      elapsedMs: result.meta?.elapsedMs,
    }, 'BULK');

    return result;
  } catch (error: any) {
    const errorMsg = error.name === 'AbortError'
      ? 'İndirme zaman aşımına uğradı'
      : error.message || 'Bilinmeyen hata';

    logger.error('❌ Bulk download failed', { error: errorMsg }, 'BULK');

    onProgress?.({
      phase: 'error',
      progress: 0,
      message: 'İndirme başarısız oldu',
      error: errorMsg,
    });

    return null;
  }
}

/**
 * Bulk veriyi AsyncStorage'a parçalar halinde kaydet
 * Hem toplu hem de takım bazlı erişim için ayrı key'ler kullanılır
 */
async function saveBulkDataToStorage(
  data: Record<number, BulkTeamData>,
  teamIds: number[]
): Promise<void> {
  try {
    const operations: Array<[string, string]> = [];

    // 1. Ana bulk veriyi kaydet (tüm takımlar tek key'de)
    operations.push([BULK_STORAGE_KEYS.BULK_DATA, JSON.stringify(data)]);

    // 2. Timestamp
    operations.push([BULK_STORAGE_KEYS.BULK_TIMESTAMP, Date.now().toString()]);

    // 3. Version (takım ID'leri hash'i)
    const version = teamIds.sort().join(',');
    operations.push([BULK_STORAGE_KEYS.BULK_VERSION, version]);

    // 4. Status
    operations.push([BULK_STORAGE_KEYS.BULK_STATUS, 'complete']);

    // 5. Takım bazlı parça verileri (hızlı erişim için)
    for (const [teamIdStr, teamData] of Object.entries(data)) {
      const teamId = parseInt(teamIdStr, 10);

      // Maçlar - Bu en büyük veri, ayrı key'de tutuyoruz
      if (teamData.matches && teamData.matches.length > 0) {
        operations.push([
          `${BULK_STORAGE_KEYS.BULK_MATCHES_PREFIX}${teamId}`,
          JSON.stringify(teamData.matches),
        ]);
      }

      // Kadro
      if (teamData.squad && teamData.squad.length > 0) {
        operations.push([
          `${BULK_STORAGE_KEYS.BULK_SQUAD_PREFIX}${teamId}`,
          JSON.stringify(teamData.squad),
        ]);
      }

      // Koç
      if (teamData.coach) {
        operations.push([
          `${BULK_STORAGE_KEYS.BULK_COACH_PREFIX}${teamId}`,
          JSON.stringify(teamData.coach),
        ]);
      }

      // Takım bilgisi
      if (teamData.info) {
        operations.push([
          `${BULK_STORAGE_KEYS.BULK_INFO_PREFIX}${teamId}`,
          JSON.stringify(teamData.info),
        ]);
      }
    }

    // 6. Maçları birleştirip mevcut cache formatına da kaydet
    // (useFavoriteTeamMatches ile uyumluluk için)
    const allMatches = Object.values(data).flatMap(td => td.matches || []);
    if (allMatches.length > 0) {
      const now = Date.now();
      const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
      const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

      const past: any[] = [];
      const live: any[] = [];
      const upcoming: any[] = [];

      // Deduplicate
      const seenIds = new Set<number>();
      for (const match of allMatches) {
        const fid = match.fixture?.id;
        if (!fid || seenIds.has(fid)) continue;
        seenIds.add(fid);

        const status = match.fixture?.status?.short || '';
        const timestamp = (match.fixture?.timestamp || 0) * 1000;

        if (LIVE_STATUSES.includes(status)) {
          live.push(match);
        } else if (FINISHED_STATUSES.includes(status) || (status !== 'NS' && timestamp < now - 3 * 60 * 60 * 1000)) {
          past.push(match);
        } else {
          upcoming.push(match);
        }
      }

      // Sırala
      past.sort((a, b) => (b.fixture?.timestamp || 0) - (a.fixture?.timestamp || 0));
      upcoming.sort((a, b) => (a.fixture?.timestamp || 0) - (b.fixture?.timestamp || 0));

      // Mevcut cache formatına kaydet (useFavoriteTeamMatches uyumlu)
      operations.push([
        'tacticiq-matches-cache',
        JSON.stringify({ past, live, upcoming }),
      ]);
      operations.push([
        'tacticiq-matches-cache-timestamp',
        Date.now().toString(),
      ]);

      logger.info('📦 Bulk matches saved to compatible cache', {
        past: past.length,
        live: live.length,
        upcoming: upcoming.length,
        total: past.length + live.length + upcoming.length,
      }, 'BULK');
    }

    // multiSet ile hepsini tek seferde kaydet
    await AsyncStorage.multiSet(operations);

    logger.info('💾 Bulk data saved to storage', {
      keys: operations.length,
      totalSizeKB: Math.round(operations.reduce((acc, [, v]) => acc + v.length, 0) / 1024),
    }, 'BULK');
  } catch (error: any) {
    logger.error('❌ Failed to save bulk data to storage', { error: error.message }, 'BULK');
    throw error;
  }
}

// ============ READ FUNCTIONS ============

/**
 * Bulk data cache'inin geçerli olup olmadığını kontrol et
 */
export async function isBulkDataValid(teamIds: number[]): Promise<boolean> {
  try {
    const [timestamp, version] = await AsyncStorage.multiGet([
      BULK_STORAGE_KEYS.BULK_TIMESTAMP,
      BULK_STORAGE_KEYS.BULK_VERSION,
    ]);

    const ts = timestamp[1] ? parseInt(timestamp[1], 10) : 0;
    const ver = version[1] || '';
    const expectedVersion = teamIds.sort().join(',');

    // Cache süresi kontrolü (12 saat)
    if (Date.now() - ts > BULK_CACHE_DURATION) {
      logger.debug('Bulk cache expired', { ageHours: Math.round((Date.now() - ts) / 3600000) }, 'BULK');
      return false;
    }

    // Takım ID'leri değişmiş mi?
    if (ver !== expectedVersion) {
      logger.debug('Bulk cache version mismatch', { cached: ver, expected: expectedVersion }, 'BULK');
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Belirli bir takımın maçlarını bulk cache'den oku
 */
export async function getBulkMatches(teamId: number): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(
      `${BULK_STORAGE_KEYS.BULK_MATCHES_PREFIX}${teamId}`
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Tüm favori takımların maçlarını bulk cache'den oku
 */
export async function getAllBulkMatches(teamIds: number[]): Promise<any[] | null> {
  try {
    const keys = teamIds.map(id => `${BULK_STORAGE_KEYS.BULK_MATCHES_PREFIX}${id}`);
    const results = await AsyncStorage.multiGet(keys);
    
    const allMatches: any[] = [];
    for (const [, value] of results) {
      if (value) {
        const matches = JSON.parse(value);
        if (Array.isArray(matches)) {
          allMatches.push(...matches);
        }
      }
    }

    if (allMatches.length === 0) return null;

    // Deduplicate
    const seenIds = new Set<number>();
    return allMatches.filter(m => {
      const fid = m.fixture?.id;
      if (!fid || seenIds.has(fid)) return false;
      seenIds.add(fid);
      return true;
    });
  } catch {
    return null;
  }
}

/**
 * Belirli bir takımın kadrosunu bulk cache'den oku
 */
export async function getBulkSquad(teamId: number): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(
      `${BULK_STORAGE_KEYS.BULK_SQUAD_PREFIX}${teamId}`
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Belirli bir takımın teknik direktörünü bulk cache'den oku
 */
export async function getBulkCoach(teamId: number): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(
      `${BULK_STORAGE_KEYS.BULK_COACH_PREFIX}${teamId}`
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Belirli bir takımın bilgilerini bulk cache'den oku
 */
export async function getBulkTeamInfo(teamId: number): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(
      `${BULK_STORAGE_KEYS.BULK_INFO_PREFIX}${teamId}`
    );
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Bulk cache meta bilgilerini oku
 */
export async function getBulkDataMeta(): Promise<{
  downloadedAt: number;
  teamIds: number[];
  isValid: boolean;
} | null> {
  try {
    const [timestamp, version] = await AsyncStorage.multiGet([
      BULK_STORAGE_KEYS.BULK_TIMESTAMP,
      BULK_STORAGE_KEYS.BULK_VERSION,
    ]);

    const ts = timestamp[1] ? parseInt(timestamp[1], 10) : 0;
    const ver = version[1] || '';

    if (!ts || !ver) return null;

    return {
      downloadedAt: ts,
      teamIds: ver.split(',').map(Number).filter(Boolean),
      isValid: Date.now() - ts < BULK_CACHE_DURATION,
    };
  } catch {
    return null;
  }
}

/**
 * Bulk cache'i temizle (takım değişikliğinde)
 */
export async function clearBulkData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const bulkKeys = allKeys.filter(key =>
      key.startsWith('tacticiq-bulk-')
    );

    if (bulkKeys.length > 0) {
      await AsyncStorage.multiRemove(bulkKeys);
      logger.info('🗑️ Bulk data cache cleared', { keysRemoved: bulkKeys.length }, 'BULK');
    }
  } catch (error: any) {
    logger.error('Failed to clear bulk data', { error: error.message }, 'BULK');
  }
}
