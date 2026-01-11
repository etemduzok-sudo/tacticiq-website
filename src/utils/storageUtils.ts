// Storage Utilities - Safe AsyncStorage operations
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USER: 'fan-manager-user',
  LANGUAGE: 'fan-manager-language',
  FAVORITE_CLUBS: 'fan-manager-favorite-clubs',
  THEME: 'fan-manager-theme',
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

// ✅ MIGRATION: Eski milli takım ID'lerini yeni ID'lere çevir
const OLD_TO_NEW_TEAM_IDS: Record<number, number> = {
  2003: 777,  // Türkiye (kadın) -> Türkiye (erkek)
  2004: 25,   // Almanya (eski) -> Almanya (yeni)
  2005: 6,    // Brezilya (eski) -> Brezilya (yeni)
  2006: 26,   // Arjantin (eski) -> Arjantin (yeni)
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
      console.log(`🔄 Migrating team ID: ${team.id} -> ${OLD_TO_NEW_TEAM_IDS[team.id]} (${team.name})`);
      needsUpdate = true;
      return {
        ...team,
        id: OLD_TO_NEW_TEAM_IDS[team.id],
        logo: team.logo.replace(`/${team.id}.png`, `/${OLD_TO_NEW_TEAM_IDS[team.id]}.png`),
      };
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
      await AsyncStorage.removeItem('fan-manager-matches-cache');
      await AsyncStorage.removeItem('fan-manager-matches-cache-timestamp');
      console.log('✅ Matches cache cleared after migration');
    } catch (err) {
      console.warn('Could not clear matches cache:', err);
    }
  }
  
  return migratedTeams;
}

// Set favorite teams safely
export async function setFavoriteTeams(teams: Array<{ id: number; name: string; logo: string }>) {
  if (!validateFavoriteTeams(teams)) {
    console.error('Invalid favorite teams data');
    return false;
  }
  
  return setStorageItem(STORAGE_KEYS.FAVORITE_CLUBS, teams);
}
