import { useTranslation as useI18nTranslation } from 'react-i18next';
import { isRTL } from '../i18n';

/**
 * Custom translation hook with RTL support
 * Usage: const { t, isRTL: isRTLMode } = useTranslation();
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const currentIsRTL = isRTL();
  
  return {
    t,
    i18n,
    isRTL: currentIsRTL,
    language: i18n.language,
  };
};

export default useTranslation;
