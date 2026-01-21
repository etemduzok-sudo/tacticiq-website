import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  currentLanguage: string;
  language: string; // Alias for currentLanguage for compatibility
  changeLanguage: (lang: string) => void;
  setLanguage: (lang: string) => void; // Alias for changeLanguage for compatibility
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      
      // Set RTL for Arabic
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved language
      const savedLang = localStorage.getItem('language');
      if (savedLang && savedLang !== i18n.language) {
        changeLanguage(savedLang);
      }
      
      // Set initial RTL
      if (i18n.language === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      }
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage: i18n.language,
    language: i18n.language, // Alias for compatibility
    changeLanguage,
    setLanguage: changeLanguage, // Alias for compatibility
    t,
    isRTL: i18n.language === 'ar',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}