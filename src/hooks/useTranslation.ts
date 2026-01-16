import { useTranslation as useI18nTranslation } from 'react-i18next';
import { isRTL } from '../i18n';

/**
 * Custom translation hook with RTL support
 * Usage: const { t, isRTL: isRTLMode } = useTranslation();
 * ✅ Güvenli: i18n initialize edilmemişse fallback döndürür
 */
export const useTranslation = () => {
  try {
    const { t, i18n } = useI18nTranslation();
    const currentIsRTL = isRTL();
    
    return {
      t: t || ((key: string, fallback?: string) => fallback || key),
      i18n: i18n || { language: 'tr' },
      isRTL: currentIsRTL,
      language: i18n?.language || 'tr',
    };
  } catch (error) {
    // ✅ i18n initialize edilmemişse fallback döndür
    console.warn('useTranslation: i18n not initialized, using fallback', error);
    return {
      t: (key: string, fallback?: string) => fallback || key,
      i18n: { language: 'tr' },
      isRTL: false,
      language: 'tr',
    };
  }
};

export default useTranslation;
