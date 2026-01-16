import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      de: { translation: translations.de },
      fr: { translation: translations.fr },
      es: { translation: translations.es },
      it: { translation: translations.it },
      tr: { translation: translations.tr },
      ar: { translation: translations.ar },
      zh: { translation: translations.zh },
    },
    lng: 'tr',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
