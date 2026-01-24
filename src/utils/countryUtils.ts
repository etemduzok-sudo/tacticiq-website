/**
 * Country name translation utilities
 * Translates country names based on current locale
 */

import i18n from '../i18n';

// Country code to English name mapping
const COUNTRY_CODES: Record<string, string> = {
  TR: 'Turkey',
  DE: 'Germany',
  FR: 'France',
  GB: 'England',
  ES: 'Spain',
  IT: 'Italy',
  BR: 'Brazil',
  AR: 'Argentina',
  PT: 'Portugal',
  NL: 'Netherlands',
  BE: 'Belgium',
  HR: 'Croatia',
  PL: 'Poland',
  UA: 'Ukraine',
  RU: 'Russia',
  SE: 'Sweden',
  AT: 'Austria',
  CH: 'Switzerland',
  US: 'USA',
  MX: 'Mexico',
  JP: 'Japan',
  KR: 'South-Korea',
  AU: 'Australia',
  SA: 'Saudi-Arabia',
};

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  Turkey: '🇹🇷',
  Germany: '🇩🇪',
  France: '🇫🇷',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Spain: '🇪🇸',
  Italy: '🇮🇹',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Portugal: '🇵🇹',
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Croatia: '🇭🇷',
  Poland: '🇵🇱',
  Ukraine: '🇺🇦',
  Russia: '🇷🇺',
  Sweden: '🇸🇪',
  Austria: '🇦🇹',
  Switzerland: '🇨🇭',
  USA: '🇺🇸',
  Mexico: '🇲🇽',
  Japan: '🇯🇵',
  'South-Korea': '🇰🇷',
  Australia: '🇦🇺',
  'Saudi-Arabia': '🇸🇦',
};

/**
 * Translate a country name to the current locale
 * @param countryName - The English country name (e.g., "Turkey")
 * @returns The translated country name
 */
export function translateCountry(countryName: string): string {
  if (!countryName) return '';
  
  // Normalize the country name (handle variations)
  const normalized = countryName.trim();
  
  // Try to get translation from i18n
  const translationKey = `countries.${normalized}`;
  const translated = i18n.t(translationKey);
  
  // If translation exists and is different from the key, use it
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback to original name
  return normalized;
}

/**
 * Get the flag emoji for a country
 * @param countryName - The English country name
 * @returns The flag emoji or empty string
 */
export function getCountryFlag(countryName: string): string {
  if (!countryName) return '';
  return COUNTRY_FLAGS[countryName] || '';
}

/**
 * Get country name from country code
 * @param code - ISO country code (e.g., "TR")
 * @returns The English country name
 */
export function getCountryFromCode(code: string): string {
  if (!code) return '';
  return COUNTRY_CODES[code.toUpperCase()] || code;
}

/**
 * Format country display with flag and translated name
 * @param countryName - The English country name
 * @returns Formatted string like "🇹🇷 Türkiye"
 */
export function formatCountryDisplay(countryName: string): string {
  if (!countryName) return '';
  
  const flag = getCountryFlag(countryName);
  const translated = translateCountry(countryName);
  
  return flag ? `${flag} ${translated}` : translated;
}

export default {
  translateCountry,
  getCountryFlag,
  getCountryFromCode,
  formatCountryDisplay,
};
