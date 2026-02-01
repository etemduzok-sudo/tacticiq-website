/**
 * Saat dilimi yardımcıları - kullanıcının seçtiği saat dilimine göre tarih/saat formatlama
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TIMEZONE_KEY = '@user_timezone';
const DEFAULT_TZ = 'Europe/Istanbul';

let cachedTimezone: string | null = null;

export async function getUserTimezone(): Promise<string> {
  if (cachedTimezone) return cachedTimezone;
  try {
    if (Platform.OS === 'web' && typeof window?.localStorage !== 'undefined') {
      cachedTimezone = window.localStorage.getItem(TIMEZONE_KEY);
    } else {
      cachedTimezone = await AsyncStorage.getItem(TIMEZONE_KEY);
    }
    return cachedTimezone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
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
 * Senkron format - önce cached timezone kullan
 */
export function formatDateInUserTimezoneSync(
  timestamp: number | Date,
  timezone: string = cachedTimezone || DEFAULT_TZ,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  }
): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: timezone }).format(date);
}
