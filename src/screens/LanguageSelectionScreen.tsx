import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated as RNAnimated,
  Image,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlagDE, FlagGB, FlagES, FlagFR, FlagIT, FlagTR, FlagAR, FlagCN } from '../components/flags';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_COLORS } from '../constants/standardLayout';
import { useTranslation } from '../hooks/useTranslation';
import { BRAND, SPACING, TYPOGRAPHY } from '../theme/theme';
import { LEGAL_DOCUMENTS, getLegalContent, getLegalContentSync } from '../data/legalContent';
import { getCurrentLanguage } from '../i18n';

// Logo
const logoImage = require('../../assets/logo.png');

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelect,
  onBack,
}: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n?.language || 'en');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({
    analytics: false,
    marketing: false,
    personalized: false,
  });

  // Scrolling welcome text animation (8 languages, tek satırda yanyana)
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const welcomeTexts = [
    'Welcome',      // English
    'Hoş Geldiniz', // Türkçe
    'Willkommen',   // Deutsch
    'Bienvenido',   // Español
    'Bienvenue',    // Français
    'Benvenuto',    // Italiano
    'مرحبا',        // Arabic
    '欢迎',          // Chinese
  ];
  // ✅ 8 dilde tek satırda yanyana, her dil arasında " • " ayırıcı
  const welcomeString = welcomeTexts.join('  •  ') + '  •  ';
  const textWidth = welcomeString.length * 9;

  useEffect(() => {
    // ✅ Web için useNativeDriver: false (uyarıyı önlemek için)
    const animation = RNAnimated.loop(
      RNAnimated.timing(scrollX, {
        toValue: -textWidth,
        duration: 20000,
        useNativeDriver: false, // ✅ Web için false
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Dil seçildiğinde translation'ı güncelle ve direkt ilerle
  const handleLanguagePress = (langCode: string) => {
    setSelectedLanguage(langCode);
    i18n?.changeLanguage?.(langCode);
    setShowLanguageModal(false);
    // Direkt dil seçimini onayla ve ilerle
    onLanguageSelect(langCode);
  };

  // Yasal belge aç
  const handleOpenLegalDoc = (docId: string) => {
    setSelectedLegalDoc(docId);
    setShowLegalModal(true);
  };

  // Çerez modal'ını kapat
  const handleCloseCookieModal = () => {
    setShowCookieModal(false);
  };

  // Devam butonu
  const handleContinue = () => {
    if (!legalAccepted) {
      Alert.alert(
        t('common.error') || 'Error',
        t('languageSelection.pleaseAccept') || 'Please read and accept legal documents'
      );
      return;
    }
    onLanguageSelect(selectedLanguage);
  };

  // ✅ SVG Flag Components
  const FlagComponent = ({ code }: { code: string }) => {
    switch (code) {
      case 'de': return <FlagDE size={48} />;
      case 'en': return <FlagGB size={48} />;
      case 'es': return <FlagES size={48} />;
      case 'fr': return <FlagFR size={48} />;
      case 'it': return <FlagIT size={48} />;
      case 'tr': return <FlagTR size={48} />;
      case 'ar': return <FlagAR size={48} />;
      case 'zh': return <FlagCN size={48} />;
      default: return null;
    }
  };

  const languages = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
  ];

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || 'English';
  };

  // Render Language Modal
  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.languageModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('languageSelection.title') || 'Language Selection'}</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {languages.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                  onPress={() => handleLanguagePress(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemContent}>
                    <View style={styles.languageFlag}>
                      <FlagComponent code={lang.code} />
                    </View>
                    <Text style={[styles.languageItemText, isSelected && styles.languageItemTextSelected]}>
                      {lang.name}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.languageCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Legal Document Modal
  const renderLegalModal = () => {
    if (!selectedLegalDoc) return null;
    const language = getCurrentLanguage();
    const legalContent = getLegalContentSync(selectedLegalDoc, t, language);
    
    return (
      <Modal
        visible={showLegalModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLegalModal(false)}
      >
        <SafeAreaView style={styles.legalModalContainer}>
          <LinearGradient colors={AUTH_GRADIENT.colors} style={styles.legalGradient} start={AUTH_GRADIENT.start} end={AUTH_GRADIENT.end}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>{legalContent?.title || 'Legal Document'}</Text>
              <TouchableOpacity onPress={() => setShowLegalModal(false)}>
                <Text style={styles.legalModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.legalModalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.legalModalText}>{legalContent?.content || ''}</Text>
            </ScrollView>
            
            <TouchableOpacity style={styles.legalModalCloseButton} onPress={() => setShowLegalModal(false)}>
              <LinearGradient colors={[BRAND.emerald, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.legalModalCloseGradient}>
                <Text style={styles.legalModalCloseText}>{t('common.close') || 'Close'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    );
  };

  // Render Cookie Consent Modal
  const renderCookieModal = () => (
    <Modal
      visible={showCookieModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseCookieModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cookieModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🍪 {t('consent.title') || 'Cookie Preferences'}</Text>
            <TouchableOpacity onPress={handleCloseCookieModal}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.cookieScrollContent} showsVerticalScrollIndicator={false}>
            {/* Essential - Always On */}
            <View style={styles.cookieItem}>
              <View style={styles.cookieItemHeader}>
                <Text style={styles.cookieItemTitle}>{t('consent.essential') || 'Essential Cookies'}</Text>
                <View style={[styles.cookieToggle, styles.cookieToggleOn]}>
                  <Text style={styles.cookieToggleText}>✓</Text>
                </View>
              </View>
              <Text style={styles.cookieItemDesc}>{t('consent.essentialDesc') || 'Required for the app to function'}</Text>
            </View>

            {/* Analytics */}
            <TouchableOpacity style={styles.cookieItem} onPress={() => setCookiePrefs(prev => ({ ...prev, analytics: !prev.analytics }))}>
              <View style={styles.cookieItemHeader}>
                <Text style={styles.cookieItemTitle}>{t('consent.analytics') || 'Analytics'}</Text>
                <View style={[styles.cookieToggle, cookiePrefs.analytics && styles.cookieToggleOn]}>
                  {cookiePrefs.analytics && <Text style={styles.cookieToggleText}>✓</Text>}
                </View>
              </View>
              <Text style={styles.cookieItemDesc}>{t('consent.analyticsDesc') || 'Improve performance'}</Text>
            </TouchableOpacity>

            {/* Marketing */}
            <TouchableOpacity style={styles.cookieItem} onPress={() => setCookiePrefs(prev => ({ ...prev, marketing: !prev.marketing }))}>
              <View style={styles.cookieItemHeader}>
                <Text style={styles.cookieItemTitle}>{t('consent.marketing') || 'Marketing'}</Text>
                <View style={[styles.cookieToggle, cookiePrefs.marketing && styles.cookieToggleOn]}>
                  {cookiePrefs.marketing && <Text style={styles.cookieToggleText}>✓</Text>}
                </View>
              </View>
              <Text style={styles.cookieItemDesc}>{t('consent.marketingDesc') || 'Campaigns and offers'}</Text>
            </TouchableOpacity>

            {/* Personalized Ads */}
            <TouchableOpacity style={styles.cookieItem} onPress={() => setCookiePrefs(prev => ({ ...prev, personalized: !prev.personalized }))}>
              <View style={styles.cookieItemHeader}>
                <Text style={styles.cookieItemTitle}>{t('consent.personalizedAds') || 'Personalized Ads'}</Text>
                <View style={[styles.cookieToggle, cookiePrefs.personalized && styles.cookieToggleOn]}>
                  {cookiePrefs.personalized && <Text style={styles.cookieToggleText}>✓</Text>}
                </View>
              </View>
              <Text style={styles.cookieItemDesc}>{t('consent.personalizedAdsDesc') || 'Ads based on interests'}</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.cookieModalSaveButton} onPress={handleCloseCookieModal}>
            <LinearGradient colors={[BRAND.emerald, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cookieModalSaveGradient}>
              <Text style={styles.cookieModalSaveText}>{t('common.save') || 'Save Preferences'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
      >
        {/* Grid Pattern Background */}
        <View style={styles.gridPattern} />
        <View style={styles.screenContainer}>
          <View style={styles.content}>
            {/* Logo - %300 Büyük (288px -> 864px) */}
            <View style={styles.logoContainer}>
              <Image 
                source={logoImage} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Bilgilendirme Alanı */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>
                {selectedLanguage === 'tr' ? 'Dil Seçimi' : 
                 selectedLanguage === 'en' ? 'Language Selection' :
                 selectedLanguage === 'de' ? 'Sprachauswahl' :
                 selectedLanguage === 'es' ? 'Selección de Idioma' :
                 selectedLanguage === 'fr' ? 'Sélection de la Langue' :
                 selectedLanguage === 'it' ? 'Selezione Lingua' :
                 selectedLanguage === 'ar' ? 'اختيار اللغة' :
                 selectedLanguage === 'ru' ? 'Выбор языка' : 'Language Selection'}
              </Text>
              <Text style={styles.infoSubtitle}>
                {selectedLanguage === 'tr' ? 'Lütfen tercih ettiğiniz dili seçin' : 
                 selectedLanguage === 'en' ? 'Please select your preferred language' :
                 selectedLanguage === 'de' ? 'Bitte wählen Sie Ihre bevorzugte Sprache' :
                 selectedLanguage === 'es' ? 'Por favor seleccione su idioma preferido' :
                 selectedLanguage === 'fr' ? 'Veuillez sélectionner votre langue préférée' :
                 selectedLanguage === 'it' ? 'Seleziona la tua lingua preferita' :
                 selectedLanguage === 'ar' ? 'يرجى اختيار لغتك المفضلة' :
                 selectedLanguage === 'ru' ? 'Пожалуйста, выберите предпочитаемый язык' : 'Please select your preferred language'}
              </Text>
            </View>

            {/* 8 Dil Seçim Butonları - Grid Layout */}
            <View style={styles.languageGrid}>
              {languages.map((lang) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.languageButton, isSelected && styles.languageButtonSelected]}
                    onPress={() => handleLanguagePress(lang.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageButtonFlag}>
                      <FlagComponent code={lang.code} />
                    </View>
                    <Text style={[styles.languageButtonText, isSelected && styles.languageButtonTextSelected]}>
                      {lang.name}
                    </Text>
                    {isSelected && <Text style={styles.languageButtonCheckmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Modals */}
        {renderLanguageModal()}
        {renderLegalModal()}
        {renderCookieModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: STANDARD_COLORS.background,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  
  // Logo Container - Büyük
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 864, // %300 büyük (288px * 3)
    height: 864,
  },
  
  // Bilgilendirme Alanı
  infoContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  infoSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Language Grid - 8 Buton, 2 Sütun
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  languageButton: {
    width: '45%',
    aspectRatio: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    position: 'relative',
  },
  languageButtonSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: BRAND.emerald,
    borderWidth: 2,
  },
  languageButtonFlag: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    textAlign: 'center',
  },
  languageButtonTextSelected: {
    color: BRAND.emerald,
    fontWeight: '700',
  },
  languageButtonCheckmark: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    fontSize: 20,
    color: BRAND.emerald,
    fontWeight: '700',
  },
  
  
  // Modals - Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.white,
  },
  modalClose: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '300',
  },

  // Language Modal
  languageModalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  languageList: {
    maxHeight: 400,
    paddingHorizontal: SPACING.lg,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageItemSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: BRAND.emerald,
    borderWidth: 2,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  languageFlag: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: BRAND.white,
  },
  languageItemTextSelected: {
    fontWeight: '700',
    color: BRAND.emerald,
  },
  languageCheckmark: {
    fontSize: 20,
    color: BRAND.emerald,
    fontWeight: '700',
  },

  // Legal Document Modal
  legalModalContainer: {
    flex: 1,
    backgroundColor: AUTH_GRADIENT.colors[0],
  },
  legalGradient: {
    flex: 1,
  },
  legalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.white,
    flex: 1,
  },
  legalModalClose: {
    fontSize: 32,
    color: BRAND.white,
    fontWeight: '300',
  },
  legalModalScroll: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  legalModalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    paddingVertical: SPACING.lg,
  },
  legalModalCloseButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: 14,
    overflow: 'hidden',
  },
  legalModalCloseGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  legalModalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },

  // Cookie Modal
  cookieModalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: SPACING.xl,
  },
  cookieScrollContent: {
    maxHeight: 350,
    paddingHorizontal: SPACING.lg,
  },
  cookieItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cookieItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cookieItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
    flex: 1,
  },
  cookieItemDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  cookieToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cookieToggleOn: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
  },
  cookieToggleText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cookieModalSaveButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cookieModalSaveGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cookieModalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },

  // Footer
  footerZone: {
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});
