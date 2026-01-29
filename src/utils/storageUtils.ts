// Storage Utilities - Safe AsyncStorage operations
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS as CONSTANTS_STORAGE_KEYS } from '../config/constants';

// Export STORAGE_KEYS with additional utility-specific keys
export const STORAGE_KEYS = {
  ...CONSTANTS_STORAGE_KEYS,
  ERROR_COUNT: 'error-count',
  IMAGE_CACHE_MAP: 'image-cache-map',
} as const;

// Safe get with validation
export async function getStorageItem<T>(
  key: string,
  validator?: (data: any) => boolean
): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;

    const parsed = JSON.parse(value);
    
    // Validate if validator provided
    if (validator && !validator(parsed)) {
      console.warn(`Invalid data for key: ${key}`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed as T;
  } catch (error) {
    console.error(`Error reading storage key ${key}:`, error);
    return null;
  }
}

// Safe set with validation
export async function setStorageItem<T>(
  key: string,
  value: T
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing storage key ${key}:`, error);
    return false;
  }
}

// Safe remove
export async function removeStorageItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing storage key ${key}:`, error);
    return false;
  }
}

// Clear all app data
export async function clearAllStorage(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    console.log('✅ All storage cleared');
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

// Validate favorite teams data
export function validateFavoriteTeams(data: any): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every(team => 
    team &&
    typeof team === 'object' &&
    typeof team.id === 'number' &&
    typeof team.name === 'string' &&
    team.name.length > 0
  );
}

// ✅ MIGRATION: Eski / yanlış takım ID'lerini API-Football ID'lerine çevir (maç API uyumu)
const OLD_TO_NEW_TEAM_IDS: Record<number, number> = {
  2003: 777,   // Türkiye (kadın) -> Türkiye (erkek)
  2004: 25,    // Almanya (eski) -> Almanya (yeni)
  2005: 6,     // Brezilya (eski) -> Brezilya (yeni)
  2006: 26,    // Arjantin (eski) -> Arjantin (yeni)
  6890: 562,   // Antalyaspor (fallback yanlış ID) -> API-Football 562
  3563: 556,   // Konyaspor (fallback yanlış ID) -> API-Football 556
};

// Get favorite teams safely with ID migration
export async function getFavoriteTeams() {
  const teams = await getStorageItem<Array<{ id: number; name: string; logo: string }>>(
    STORAGE_KEYS.FAVORITE_CLUBS,
    validateFavoriteTeams
  );
  
  if (!teams) return null;
  
  // ✅ Migrate old IDs to new IDs
  let needsUpdate = false;
  const migratedTeams = teams.map(team => {
    if (OLD_TO_NEW_TEAM_IDS[team.id]) {
      const newId = OLD_TO_NEW_TEAM_IDS[team.id];
      console.log(`🔄 Migrating team ID: ${team.id} -> ${newId} (${team.name})`);
      needsUpdate = true;
      const logo = team.logo && typeof team.logo === 'string'
        ? team.logo.replace(`/${team.id}.png`, `/${newId}.png`) : (team.logo ?? '');
      return { ...team, id: newId, logo };
    }
    return team;
  });
  
  // Save migrated teams if any changes were made
  if (needsUpdate) {
    await setFavoriteTeams(migratedTeams);
    console.log('✅ Team IDs migrated successfully');
    
    // Clear matches cache to force refresh with new IDs
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('tacticiq-matches-cache');
      await AsyncStorage.removeItem('tacticiq-matches-cache-timestamp');
      console.log('✅ Matches cache cleared after migration');
    } catch (err) {
      console.warn('Could not clear matches cache:', err);
    }
  }
  
  return migratedTeams;
}

// Set favorite teams safely
export async function setFavoriteTeams(teams: Array<{ id: number; name: string; logo: string; colors?: string[] }>) {
  if (!validateFavoriteTeams(teams)) {
    console.error('Invalid favorite teams data');
    return false;
  }
  
  return setStorageItem(STORAGE_KEYS.FAVORITE_CLUBS, teams);
}
