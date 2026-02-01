/**
 * Cihaz bölgesi - uygulamanın indirildiği/kullanıldığı ülke
 * Sıralama gösterimi için kullanılır (Türkiye/Fransa/Brezilya vs.)
 */

import * as Localization from 'expo-localization';
import { Platform } from 'react-native';

// Bölge kodu -> ISO ülke kodu (expo regionCode bazen "TR" bazen "US" döner)
const REGION_TO_COUNTRY: Record<string, string> = {
  TR: 'TR', US: 'US', GB: 'GB', FR: 'FR', DE: 'DE', BR: 'BR', ES: 'ES', IT: 'IT',
  AR: 'AR', MX: 'MX', JP: 'JP', KR: 'KR', AU: 'AU', CA: 'CA', IN: 'IN', RU: 'RU',
  NL: 'NL', BE: 'BE', PT: 'PT', PL: 'PL', UA: 'UA', GH: 'GH', NG: 'NG', ZA: 'ZA',
  EG: 'EG', SA: 'SA', CN: 'CN', IR: 'IR', QA: 'QA', AE: 'AE', SE: 'SE', NO: 'NO',
  AT: 'AT', CH: 'CH', GR: 'GR', CZ: 'CZ', HU: 'HU', RO: 'RO', RS: 'RS', HR: 'HR',
  CO: 'CO', CL: 'CL', PE: 'PE', UY: 'UY', EC: 'EC', PY: 'PY', VE: 'VE', BO: 'BO',
  SN: 'SN', MA: 'MA', DZ: 'DZ', TN: 'TN', CM: 'CM', CI: 'CI', CD: 'CD', ML: 'ML',
};

let cachedCountry: string | null = null;

/**
 * Cihazın bölge koduna göre ülke kodu (TR, FR, BR, GH vs.)
 * Uygulama hangi ülkeden indirildiyse o ülkenin sıralaması gösterilir
 */
export function getDeviceCountryCode(): string {
  if (cachedCountry) return cachedCountry;
  try {
    const locales = Localization.getLocales();
    const region = locales[0]?.regionCode || locales[0]?.countryCode;
    if (region) {
      cachedCountry = REGION_TO_COUNTRY[region.toUpperCase()] || region.toUpperCase().slice(0, 2);
      return cachedCountry;
    }
    // Web'de navigator.language'dan çıkar (örn. "tr-TR" -> TR)
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.language) {
      const parts = navigator.language.split('-');
      if (parts.length >= 2) {
        cachedCountry = parts[1].toUpperCase().slice(0, 2);
        return cachedCountry;
      }
    }
  } catch (e) {
    // ignore
  }
  cachedCountry = 'TR'; // varsayılan
  return cachedCountry;
}
