/**
 * Currency Exchange Service
 * 
 * Gerçek zamanlı kur güncellemesi için API servisi
 * Not: Gerçek bir API anahtarı gerektirir (örn: exchangerate-api.com, fixer.io)
 */

import { EXCHANGE_RATES, CURRENCY_SYMBOLS } from '@/utils/pricing';

export interface ExchangeRates {
  [key: string]: number;
}

/**
 * API'den güncel döviz kurlarını çeker
 * NOT: Bu örnek fonksiyon - gerçek API anahtarı eklenmelidir
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
  try {
    // ÖRNEK: Gerçek API çağrısı için bu URL'yi kullanabilirsiniz
    // const API_KEY = 'YOUR_API_KEY_HERE';
    // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/TRY`);
    
    // Şimdilik mock data döndürüyoruz (güncel kurlar)
    // Gerçek uygulamada üstteki API çağrısını aktif edin
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simüle edilmiş güncel kurlar (16 Ocak 2026)
        resolve({
          TRY: 1,
          USD: 0.029,    // ~34.5 TL/USD
          EUR: 0.027,    // ~37 TL/EUR
          GBP: 0.023,    // ~43.5 TL/GBP
          AED: 0.106,    // ~9.4 TL/AED
          CNY: 0.21,     // ~4.76 TL/CNY
        });
      }, 1000);
    });
  } catch (error) {
    console.error('Kur bilgileri alınamadı:', error);
    return null;
  }
}

/**
 * localStorage'dan son güncelleme zamanını kontrol eder
 */
export function shouldUpdateRates(): boolean {
  const lastUpdate = localStorage.getItem('lastCurrencyUpdate');
  if (!lastUpdate) return true;

  const lastUpdateTime = new Date(lastUpdate).getTime();
  const now = Date.now();
  const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

  // 24 saatten eski ise güncelle
  return hoursSinceUpdate >= 24;
}

/**
 * Kur bilgilerini localStorage'a kaydeder
 */
export function saveExchangeRates(rates: ExchangeRates): void {
  localStorage.setItem('exchangeRates', JSON.stringify(rates));
  localStorage.setItem('lastCurrencyUpdate', new Date().toISOString());
}

/**
 * localStorage'dan kur bilgilerini okur
 */
export function getStoredExchangeRates(): ExchangeRates | null {
  const stored = localStorage.getItem('exchangeRates');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Otomatik kur güncellemesi yapar (eğer gerekiyorsa)
 */
export async function autoUpdateRates(forceUpdate: boolean = false): Promise<ExchangeRates> {
  // Force update yoksa ve güncelleme gerekli değilse mevcut kurları kullan
  if (!forceUpdate && !shouldUpdateRates()) {
    const stored = getStoredExchangeRates();
    if (stored) return stored;
  }

  // API'den güncel kurları çek
  const freshRates = await fetchExchangeRates();
  
  if (freshRates) {
    saveExchangeRates(freshRates);
    return freshRates;
  }

  // API başarısız olursa mevcut kurları kullan
  const storedRates = getStoredExchangeRates();
  if (storedRates) return storedRates;

  // Hiçbir şey yoksa varsayılan kurları döndür
  return EXCHANGE_RATES;
}

/**
 * Fiyat hesaplama (TRY bazlı)
 */
export function convertPrice(
  priceInTRY: number,
  targetCurrency: string,
  rates: ExchangeRates
): number {
  const rate = rates[targetCurrency] || EXCHANGE_RATES[targetCurrency] || 1;
  return Math.round(priceInTRY * rate);
}

/**
 * Formatlanmış fiyat string'i döndürür
 */
export function formatCurrencyPrice(
  amount: number,
  currency: string
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  
  // TL için sağ tarafta, diğerleri sol tarafta
  if (currency === 'TRY') {
    return `${symbol}${amount}`;
  }
  
  return `${symbol}${amount}`;
}

/**
 * API Anahtarı Konfigürasyonu
 * 
 * Kullanılabilecek ücretsiz/ücretli API servisleri:
 * 
 * 1. exchangerate-api.com (Ücretsiz: 1500 request/ay)
 *    https://www.exchangerate-api.com/
 * 
 * 2. fixer.io (Ücretli, güvenilir)
 *    https://fixer.io/
 * 
 * 3. openexchangerates.org (Kısıtlı ücretsiz plan)
 *    https://openexchangerates.org/
 * 
 * 4. currencyapi.com (Ücretsiz: 300 request/ay)
 *    https://currencyapi.com/
 * 
 * Kullanım:
 * - API anahtarınızı .env dosyasına ekleyin: VITE_CURRENCY_API_KEY=your_key
 * - fetchExchangeRates() fonksiyonunda ilgili API URL'ini aktif edin
 */

export const CURRENCY_API_PROVIDERS = {
  exchangeRateApi: {
    name: 'ExchangeRate-API',
    url: 'https://api.exchangerate-api.com/v4/latest/TRY',
    requiresKey: false,
    free: true,
  },
  fixer: {
    name: 'Fixer.io',
    url: 'https://api.fixer.io/latest?base=TRY',
    requiresKey: true,
    free: false,
  },
  openExchangeRates: {
    name: 'Open Exchange Rates',
    url: 'https://openexchangerates.org/api/latest.json?base=TRY',
    requiresKey: true,
    free: true, // Kısıtlı
  },
};
