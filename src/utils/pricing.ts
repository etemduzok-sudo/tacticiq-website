/**
 * Pricing Utility - Çoklu Para Birimi Desteği
 * 
 * TacticIQ fiyatlandırması:
 * - Base fiyat: 479 TL/yıl (Normal)
 * - İndirimli: 383 TL/yıl (%20 indirim)
 * 
 * Günlük kur üzerinden diğer para birimlerine çevrilir
 */

export interface PricingData {
  currency: string;
  symbol: string;
  normalPrice: number;
  discountedPrice: number;
  period: string;
  showOriginalPrice?: boolean;
}

// Para birimi sembolleri
export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ', // UAE Dirham (Arapça ülkeler için)
  CNY: '¥', // Chinese Yuan
};

// Approximate exchange rates (güncellenebilir)
// Base: 479 TL normal, 383 TL discounted
export const EXCHANGE_RATES: Record<string, number> = {
  TRY: 1,
  USD: 0.029, // ~34 TL/USD → 479*0.029 = 13.89 ≈ 14 USD
  EUR: 0.027, // ~37 TL/EUR → 479*0.027 = 12.93 ≈ 13 EUR
  GBP: 0.023, // ~42 TL/GBP → 479*0.023 = 11.01 ≈ 11 GBP
  AED: 0.106, // ~9 TL/AED → 479*0.106 = 50.77 ≈ 51 AED
  CNY: 0.21, // ~4.76 TL/CNY → 479*0.21 = 100.59 ≈ 101 CNY
};

// Dil bazlı para birimi mapping
export const LANGUAGE_CURRENCY_MAP: Record<string, string> = {
  tr: 'TRY',
  en: 'USD',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
  ar: 'USD', // Arapça için USD (alternatif: AED)
  zh: 'USD', // Çince için USD (alternatif: CNY)
};

/**
 * Dile göre fiyatlandırma bilgilerini döndürür
 */
export function getPricingForLanguage(
  language: string,
  isDiscounted: boolean = false
): PricingData {
  const currency = LANGUAGE_CURRENCY_MAP[language] || 'USD';
  const rate = EXCHANGE_RATES[currency];
  const symbol = CURRENCY_SYMBOLS[currency];

  // Dil bazlı period metinleri
  const periodTexts: Record<string, string> = {
    tr: '/ Yıllık',
    en: '/ Yearly',
    de: '/ Jährlich',
    fr: '/ Annuel',
    es: '/ Anual',
    it: '/ Annuale',
    ar: '/ سنوياً',
    zh: '/ 每年',
  };

  const basePriceTRY = isDiscounted ? 383 : 479;
  const convertedPrice = Math.round(basePriceTRY * rate);

  return {
    currency,
    symbol,
    normalPrice: Math.round(479 * rate),
    discountedPrice: Math.round(383 * rate),
    period: periodTexts[language] || '/ Yearly',
    showOriginalPrice: isDiscounted,
  };
}

/**
 * Fiyat formatı (currency symbol + fiyat)
 */
export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  // TL için sağ tarafta, diğerleri sol tarafta
  if (currency === 'TRY') {
    return `${symbol}${amount}`;
  }
  
  // USD, EUR, GBP için sol tarafta
  return `${symbol}${amount}`;
}

/**
 * Animasyon için price değişim data'sı
 */
export function getPriceChangeData(language: string) {
  const pricing = getPricingForLanguage(language, false);
  const discountedPricing = getPricingForLanguage(language, true);
  
  return {
    from: pricing.normalPrice,
    to: discountedPricing.discountedPrice,
    currency: pricing.currency,
    symbol: pricing.symbol,
  };
}