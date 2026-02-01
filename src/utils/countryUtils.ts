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
  GH: 'Ghana',
  NG: 'Nigeria',
  EG: 'Egypt',
  ZA: 'South Africa',
  MA: 'Morocco',
  SN: 'Senegal',
  CO: 'Colombia',
  CL: 'Chile',
  UY: 'Uruguay',
  PE: 'Peru',
  EC: 'Ecuador',
  IN: 'India',
  CN: 'China',
  IR: 'Iran',
  QA: 'Qatar',
  AE: 'UAE',
};

// Country name -> ISO 3166-1 alpha-2 code (flagcdn.com için)
const COUNTRY_TO_CODE: Record<string, string> = {
  Turkey: 'tr', Türkiye: 'tr', Germany: 'de', France: 'fr', England: 'gb-eng',
  Spain: 'es', Italy: 'it', Brazil: 'br', Argentina: 'ar', Portugal: 'pt',
  Netherlands: 'nl', Belgium: 'be', Croatia: 'hr', Poland: 'pl', Ukraine: 'ua',
  Russia: 'ru', Sweden: 'se', Austria: 'at', Switzerland: 'ch', USA: 'us',
  Mexico: 'mx', Japan: 'jp', 'South Korea': 'kr', 'South-Korea': 'kr', Australia: 'au',
  'Saudi Arabia': 'sa', 'Saudi-Arabia': 'sa', Iran: 'ir', Qatar: 'qa', UAE: 'ae',
  China: 'cn', India: 'in', Iraq: 'iq', Uzbekistan: 'uz', 'New Zealand': 'nz',
  Nigeria: 'ng', 'South Africa': 'za', Egypt: 'eg', Morocco: 'ma', Senegal: 'sn',
  Algeria: 'dz', Tunisia: 'tn', Cameroon: 'cm', Ghana: 'gh', 'Ivory Coast': 'ci',
  'DR Congo': 'cd', Mali: 'ml', Uruguay: 'uy', Colombia: 'co', Chile: 'cl',
  Peru: 'pe', Ecuador: 'ec', Paraguay: 'py', Venezuela: 've', Bolivia: 'bo',
  Canada: 'ca', 'Costa Rica': 'cr', Jamaica: 'jm', Panama: 'pa',
  Scotland: 'gb-sct', Wales: 'gb-wls', Ireland: 'ie', Norway: 'no', Finland: 'fi',
  'Czech Republic': 'cz', Hungary: 'hu', Romania: 'ro', Serbia: 'rs', Greece: 'gr',
  Slovenia: 'si', Slovakia: 'sk', Albania: 'al', 'North Macedonia': 'mk',
  Georgia: 'ge', Iceland: 'is', Kosovo: 'xk', Montenegro: 'me', 'Bosnia and Herzegovina': 'ba',
  'Northern Ireland': 'gb-nir',
};

// Country flag emojis (fallback)
const COUNTRY_FLAGS: Record<string, string> = {
  Turkey: '🇹🇷', Türkiye: '🇹🇷', Germany: '🇩🇪', France: '🇫🇷', England: '🇬🇧',
  Spain: '🇪🇸', Italy: '🇮🇹', Brazil: '🇧🇷', Argentina: '🇦🇷', Portugal: '🇵🇹',
  Netherlands: '🇳🇱', Belgium: '🇧🇪', Croatia: '🇭🇷', Poland: '🇵🇱', Ukraine: '🇺🇦',
  Russia: '🇷🇺', Sweden: '🇸🇪', Austria: '🇦🇹', Switzerland: '🇨🇭', USA: '🇺🇸',
  Mexico: '🇲🇽', Japan: '🇯🇵', 'South-Korea': '🇰🇷', Australia: '🇦🇺', 'Saudi-Arabia': '🇸🇦',
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
 * Get flag image URL for a country (flagcdn.com)
 * @param countryName - The English country name
 * @returns URL like https://flagcdn.com/w80/tr.png
 */
export function getCountryFlagUrl(countryName: string): string | null {
  if (!countryName) return null;
  const code = COUNTRY_TO_CODE[countryName] || COUNTRY_TO_CODE[countryName.trim()];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
}

// Sıralama etiketi: "Türkiye Sıralaması", "Fransa Sıralaması" vs. (i18n key veya fallback)
const COUNTRY_RANKING_LABELS: Record<string, string> = {
  TR: 'Türkiye Sıralaması', Turkey: 'Türkiye Sıralaması', Türkiye: 'Türkiye Sıralaması',
  FR: 'Fransa Sıralaması', France: 'Fransa Sıralaması',
  BR: 'Brezilya Sıralaması', Brazil: 'Brezilya Sıralaması',
  GH: 'Gana Sıralaması', Ghana: 'Gana Sıralaması',
  DE: 'Almanya Sıralaması', Germany: 'Almanya Sıralaması',
  ES: 'İspanya Sıralaması', Spain: 'İspanya Sıralaması',
  IT: 'İtalya Sıralaması', Italy: 'İtalya Sıralaması',
  GB: 'İngiltere Sıralaması', England: 'İngiltere Sıralaması',
  AR: 'Arjantin Sıralaması', Argentina: 'Arjantin Sıralaması',
  PT: 'Portekiz Sıralaması', Portugal: 'Portekiz Sıralaması',
  NL: 'Hollanda Sıralaması', Netherlands: 'Hollanda Sıralaması',
  US: 'ABD Sıralaması', USA: 'ABD Sıralaması',
  MX: 'Meksika Sıralaması', Mexico: 'Meksika Sıralaması',
  JP: 'Japonya Sıralaması', Japan: 'Japonya Sıralaması',
  KR: 'Güney Kore Sıralaması', 'South Korea': 'Güney Kore Sıralaması',
  AU: 'Avustralya Sıralaması', Australia: 'Avustralya Sıralaması',
  NG: 'Nijerya Sıralaması', Nigeria: 'Nijerya Sıralaması',
  EG: 'Mısır Sıralaması', Egypt: 'Mısır Sıralaması',
  MA: 'Fas Sıralaması', Morocco: 'Fas Sıralaması',
  SN: 'Senegal Sıralaması', Senegal: 'Senegal Sıralaması',
  ZA: 'Güney Afrika Sıralaması', 'South Africa': 'Güney Afrika Sıralaması',
  SA: 'Suudi Arabistan Sıralaması', 'Saudi Arabia': 'Suudi Arabistan Sıralaması',
};

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
 * Cihaz/kullanıcı ülkesine göre sıralama etiketi
 * Örn: TR → "Türkiye Sıralaması", FR → "Fransa Sıralaması"
 */
export function getCountryRankingLabel(countryCodeOrName: string): string {
  if (!countryCodeOrName) return 'Türkiye Sıralaması';
  const key = countryCodeOrName.toUpperCase().slice(0, 2);
  return COUNTRY_RANKING_LABELS[countryCodeOrName] || COUNTRY_RANKING_LABELS[key] || `${countryCodeOrName} Sıralaması`;
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
