/**
 * Saat dilimi yardımcıları - kullanıcının seçtiği saat dilimine göre tarih/saat formatlama
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TIMEZONE_KEY = '@user_timezone';
const DEFAULT_TZ = 'Europe/Istanbul';

let cachedTimezone: string | null = null;

/** Cihazın yerel saat dilimi (KKTC, Türkiye vb. – kullanıcı profil saat dilimi seçene kadar) */
function getDeviceTimezoneSync(): string {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
    }
  } catch (_) {}
  return DEFAULT_TZ;
}

export async function getUserTimezone(): Promise<string> {
  if (cachedTimezone) return cachedTimezone;
  try {
    if (Platform.OS === 'web' && typeof window?.localStorage !== 'undefined') {
      cachedTimezone = window.localStorage.getItem(TIMEZONE_KEY);
    } else {
      cachedTimezone = await AsyncStorage.getItem(TIMEZONE_KEY);
    }
    cachedTimezone = cachedTimezone || getDeviceTimezoneSync() || DEFAULT_TZ;
    return cachedTimezone;
  } catch {
    return getDeviceTimezoneSync() || DEFAULT_TZ;
  }
}

export async function setUserTimezone(tz: string): Promise<void> {
  cachedTimezone = tz;
  try {
    if (Platform.OS === 'web' && typeof window?.localStorage !== 'undefined') {
      window.localStorage.setItem(TIMEZONE_KEY, tz);
    } else {
      await AsyncStorage.setItem(TIMEZONE_KEY, tz);
    }
  } catch (e) {
    console.warn('Could not persist timezone:', e);
  }
}

/**
 * Kullanıcının saat dilimine göre tarih formatla
 */
export async function formatDateInUserTimezone(
  timestamp: number | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  }
): Promise<string> {
  const tz = await getUserTimezone();
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: tz }).format(date);
}

/**
 * Senkron format - kullanıcı profil saat dilimi yoksa cihaz yerel saat dilimi kullanılır (KKTC vb.)
 */
export function formatDateInUserTimezoneSync(
  timestamp: number | Date,
  timezone: string = cachedTimezone ?? getDeviceTimezoneSync() ?? DEFAULT_TZ,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  }
): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const tz = timezone || cachedTimezone || getDeviceTimezoneSync() || DEFAULT_TZ;
  return new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: tz }).format(date);
}
