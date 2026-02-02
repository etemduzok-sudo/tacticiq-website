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

// ✅ MIGRATION: Takım ismine göre doğru API-Football ID'lerini ata
// 2026-02-02: API-Football v3 ile tam senkronize edildi
const TEAM_NAME_TO_CORRECT_ID: Record<string, number> = {
  // Turkish Süper Lig
  'konyaspor': 607,
  'trabzonspor': 998,
  'başakşehir': 564,
  'basaksehir': 564,
  'göztepe': 994,
  'goztepe': 994,
  'alanyaspor': 996,
  'kayserispor': 1001,
  'sivasspor': 1002,
  'kasımpaşa': 1004,
  'kasimpasa': 1004,
  'antalyaspor': 1005,
  'rizespor': 1007,
  'hatayspor': 3575,
  'samsunspor': 3603,
  'gaziantep': 3573,
  'gazişehir': 3573,
  'adana demirspor': 3563,
  'eyüpspor': 3588,
  'eyupspor': 3588,
  // Argentine Primera
  'boca juniors': 451,
  'boca': 451,
  'san lorenzo': 460,
  'racing club': 436,
  'racing': 436,
  'independiente': 453,
  'estudiantes': 450,
  'vélez sarsfield': 438,
  'velez sarsfield': 438,
  'vélez': 438,
  'velez': 438,
  // Bundesliga
  'freiburg': 160,
  'sc freiburg': 160,
  // Eredivisie
  'az alkmaar': 201,
  'feyenoord': 209,
  'utrecht': 207,
  'sparta rotterdam': 426,
  'heerenveen': 210,
  'groningen': 202,
  'twente': 415,
  // Brasileirão
  'atlético-mg': 1062,
  'atletico-mg': 1062,
  'atlético mineiro': 1062,
  'atletico mineiro': 1062,
  // Las Palmas
  'las palmas': 534,
  // Other
  'qarabag': 556,
  'qarabağ': 556,
};

// Get favorite teams safely with ID migration
export async function getFavoriteTeams() {
  const teams = await getStorageItem<Array<{ id: number; name: string; logo: string }>>(
    STORAGE_KEYS.FAVORITE_CLUBS,
    validateFavoriteTeams
  );
  
  if (!teams) return null;
  
  // ✅ Migrate to correct API-Football IDs based on team name
  let needsUpdate = false;
  const migratedTeams = teams.map(team => {
    const teamNameLower = team.name?.toLowerCase().trim() || '';
    const correctId = TEAM_NAME_TO_CORRECT_ID[teamNameLower];
    
    // İsme göre doğru ID'yi bul ve güncelle
    if (correctId && team.id !== correctId) {
      console.log(`🔄 Migrating ${team.name}: ${team.id} -> ${correctId}`);
      needsUpdate = true;
      const logo = team.logo && typeof team.logo === 'string'
        ? team.logo.replace(`/${team.id}.png`, `/${correctId}.png`) : (team.logo ?? '');
      return { ...team, id: correctId, logo };
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
