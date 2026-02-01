// Admin Data Constants
// All constants and helper functions for AdminDataContext

// Currency Exchange Rates (TRY bazlı - 1 TRY = X)
export const EXCHANGE_RATES = {
  TRY: 1,
  USD: 0.029, // 1 TRY = 0.029 USD
  EUR: 0.027, // 1 TRY = 0.027 EUR
  GBP: 0.023, // 1 TRY = 0.023 GBP
  AED: 0.106, // 1 TRY = 0.106 AED
  CNY: 0.211, // 1 TRY = 0.211 CNY
};

// Dil Kodları - Dil Adları Eşleştirmesi (i18n.language -> LANGUAGE_CURRENCY_MAP için)
export const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  'tr': 'Türkçe',
  'en': 'English',
  'de': 'Deutsch',
  'fr': 'Français',
  'es': 'Español',
  'it': 'Italiano',
  'ar': 'العربية',
  'zh': '中文',
  'ru': 'Русский',
  'hi': 'हिन्दी',
};

// Dil - Para Birimi Eşleştirmesi
export const LANGUAGE_CURRENCY_MAP: Record<string, 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'> = {
  'Türkçe': 'TRY',
  'English': 'USD',
  'Deutsch': 'EUR',
  'Français': 'EUR',
  'Español': 'EUR',
  'Italiano': 'EUR',
  'العربية': 'AED',
  '中文': 'CNY',
  'Русский': 'USD',
  'हिन्दी': 'USD',
  // Dil kodları için direkt mapping (ek güvenlik)
  'tr': 'TRY',
  'en': 'USD',
  'de': 'EUR',
  'fr': 'EUR',
  'es': 'EUR',
  'it': 'EUR',
  'ar': 'AED',
  'zh': 'CNY',
  'ru': 'USD',
  'hi': 'USD',
};

// Para Birimi Sembolleri
export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  CNY: '¥',
};

// Para birimi çevirme fonksiyonu
export function convertCurrency(
  amount: number,
  fromCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY',
  toCurrency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'
): number {
  // Önce TRY'ye çevir
  const amountInTRY = amount / EXCHANGE_RATES[fromCurrency];
  // Sonra hedef para birimine çevir
  return amountInTRY * EXCHANGE_RATES[toCurrency];
}

// Fiyat formatla
export function formatPrice(
  amount: number,
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CNY'
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toFixed(2)}`;
}
