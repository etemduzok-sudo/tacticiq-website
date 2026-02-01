import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform, I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import tr from '../locales/tr.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import ar from '../locales/ar.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import hi from '../locales/hi.json';

// RTL languages - Arabic excluded per user request (only text translation, no layout change)
// Keep Hebrew, Farsi, Urdu for future RTL support if needed
const RTL_LANGUAGES = ['he', 'fa', 'ur'];

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'tacticiq-language';

// Get device language or default to Turkish
const getDeviceLanguage = async (): Promise<string> => {
  try {
    // Web için localStorage kullan (runtime'da kontrol)
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (saved) return saved;
          
          // Browser language detection (sadece browser'da)
          if (typeof navigator !== 'undefined' && navigator.language) {
            const browserLang = navigator.language.split('-')[0];
            const supportedLanguages = ['tr', 'en', 'es', 'de', 'fr', 'it', 'ar', 'zh', 'ru', 'hi'];
            if (supportedLanguages.includes(browserLang)) return browserLang;
          }
        }
      } catch (e) {
        // Web'de localStorage erişilemezse devam et
      }
      return 'en'; // Web için default
    }
    
    // Native için AsyncStorage
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }
    
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    const supportedLanguages = ['tr', 'en', 'es', 'de', 'fr', 'it', 'ar', 'zh', 'ru', 'hi'];
    
    return supportedLanguages.includes(deviceLocale) ? deviceLocale : 'en';
  } catch (error) {
    console.warn('Error getting device language:', error);
    return 'tr';
  }
};

// Configure RTL
const configureRTL = (language: string) => {
  const isRTL = RTL_LANGUAGES.includes(language);
  
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
    // Note: App restart may be required for RTL changes to take full effect
  }
};

// Initialize i18n
const initI18n = async () => {
  const language = await getDeviceLanguage();
  
  // Configure RTL
  configureRTL(language);
  
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        tr: { translation: tr },
        en: { translation: en },
        es: { translation: es },
        de: { translation: de },
        fr: { translation: fr },
        it: { translation: it },
        ar: { translation: ar },
        zh: { translation: zh },
        ru: { translation: ru },
        hi: { translation: hi },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });
  
  return language;
};

// Change language function
export const changeLanguage = async (language: string) => {
  try {
    // Web için localStorage'a kaydet
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      window.localStorage.setItem('@user_language', language);
    }
    
    // Native için AsyncStorage'a kaydet
    if (Platform.OS !== 'web') {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await AsyncStorage.setItem('@user_language', language);
    }
    
    configureRTL(language);
    await i18n.changeLanguage(language);
    
    // Force re-render için event dispatch (web için)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('languagechange'));
    }
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'tr';
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return RTL_LANGUAGES.includes(getCurrentLanguage());
};

// Initialize i18n - Basit ve güvenli yaklaşım
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        tr: { translation: tr },
        en: { translation: en },
        es: { translation: es },
        de: { translation: de },
        fr: { translation: fr },
        it: { translation: it },
        ar: { translation: ar },
        zh: { translation: zh },
        ru: { translation: ru },
        hi: { translation: hi },
      },
      lng: 'en', // Default, runtime'da güncellenecek
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  
  // Runtime'da dil ayarla (hem web hem native için)
  getDeviceLanguage().then(language => {
    configureRTL(language);
    i18n.changeLanguage(language);
  }).catch(() => {
    // Hata durumunda default 'en' kullan
    i18n.changeLanguage('en');
  });
}

// Export i18n instance
export { i18n };
export default i18n;
