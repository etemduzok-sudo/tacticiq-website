import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface ConsentPreferences {
  essential: boolean; // Always true, required for app to function
  analytics: boolean;
  marketing: boolean;
  personalizedAds: boolean;
  dataTransfer: boolean; // For Turkey (KVKK)
  timestamp: string;
  region?: 'TR' | 'EU' | 'US' | 'CN' | 'BR' | 'OTHER';
}

const CONSENT_STORAGE_KEY = 'user-consent-preferences';

/**
 * Detect user region based on device locale or IP (simplified)
 * In production, use a GeoIP service
 */
export const detectRegion = async (): Promise<ConsentPreferences['region']> => {
  try {
    // Try to get from stored preferences first
    const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      const prefs: ConsentPreferences = JSON.parse(stored);
      if (prefs.region) {
        return prefs.region;
      }
    }

    // Fallback: Use device locale
    if (Platform.OS === 'web') {
      const lang = navigator.language || 'en';
      if (lang.startsWith('tr')) return 'TR';
      if (lang.startsWith('de') || lang.startsWith('fr') || lang.startsWith('es') || lang.startsWith('it')) return 'EU';
      if (lang.startsWith('zh')) return 'CN';
      if (lang.startsWith('pt')) return 'BR';
    }

    // Default to OTHER (will show GDPR-compliant flow)
    return 'OTHER';
  } catch (error) {
    console.error('Error detecting region:', error);
    return 'OTHER';
  }
};

/**
 * Get current consent preferences
 */
export const getConsentPreferences = async (): Promise<ConsentPreferences | null> => {
  try {
    const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Error getting consent preferences:', error);
    return null;
  }
};

/**
 * Save consent preferences
 */
export const saveConsentPreferences = async (preferences: ConsentPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving consent preferences:', error);
    throw error;
  }
};

/**
 * Check if consent is required for current region
 */
export const isConsentRequired = async (): Promise<boolean> => {
  const preferences = await getConsentPreferences();
  if (!preferences) {
    return true; // No consent given yet
  }

  const region = await detectRegion();
  
  // Turkey (KVKK): Always requires explicit consent for data transfer
  if (region === 'TR' && !preferences.dataTransfer) {
    return true;
  }

  // EU (GDPR): Requires consent for analytics and marketing
  if (region === 'EU' && (!preferences.analytics || !preferences.marketing)) {
    return true;
  }

  // US (CCPA): Requires opt-out option (not opt-in)
  // Consent not required, but preferences should be set

  return false;
};

/**
 * Get default consent preferences based on region
 */
export const getDefaultConsentPreferences = async (): Promise<ConsentPreferences> => {
  const region = await detectRegion();
  
  const defaults: ConsentPreferences = {
    essential: true, // Always required
    analytics: false, // Opt-in by default
    marketing: false, // Opt-in by default
    personalizedAds: false, // Opt-in by default
    dataTransfer: false, // Opt-in by default (especially for Turkey)
    timestamp: new Date().toISOString(),
    region,
  };

  // US (CCPA): Analytics can be opt-out (meets legitimate interest)
  if (region === 'US') {
    defaults.analytics = true;
  }

  return defaults;
};

/**
 * Check if user is in child mode (age < 13)
 */
export const isChildMode = async (): Promise<boolean> => {
  try {
    const childMode = await AsyncStorage.getItem('child-mode');
    return childMode === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Apply consent preferences to app behavior
 * This should be called after consent is given
 */
export const applyConsentPreferences = async (preferences: ConsentPreferences): Promise<void> => {
  // Disable analytics if not consented
  if (!preferences.analytics) {
    // Disable analytics SDKs
    await AsyncStorage.setItem('analytics-disabled', 'true');
  } else {
    await AsyncStorage.removeItem('analytics-disabled');
  }

  // Disable personalized ads if not consented
  if (!preferences.personalizedAds) {
    await AsyncStorage.setItem('personalized-ads-disabled', 'true');
  } else {
    await AsyncStorage.removeItem('personalized-ads-disabled');
  }

  // Disable marketing if not consented
  if (!preferences.marketing) {
    await AsyncStorage.setItem('marketing-disabled', 'true');
  } else {
    await AsyncStorage.removeItem('marketing-disabled');
  }

  // Child mode: Disable all non-essential data collection
  const childMode = await isChildMode();
  if (childMode) {
    await AsyncStorage.setItem('analytics-disabled', 'true');
    await AsyncStorage.setItem('personalized-ads-disabled', 'true');
    await AsyncStorage.setItem('marketing-disabled', 'true');
  }
};
