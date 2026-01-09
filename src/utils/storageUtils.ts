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

// Get favorite teams safely
export async function getFavoriteTeams() {
  return getStorageItem<Array<{ id: number; name: string; logo: string }>>(
    STORAGE_KEYS.FAVORITE_CLUBS,
    validateFavoriteTeams
  );
}

// Set favorite teams safely
export async function setFavoriteTeams(teams: Array<{ id: number; name: string; logo: string }>) {
  if (!validateFavoriteTeams(teams)) {
    console.error('Invalid favorite teams data');
    return false;
  }
  
  return setStorageItem(STORAGE_KEYS.FAVORITE_CLUBS, teams);
}
