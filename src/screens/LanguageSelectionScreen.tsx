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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlagDE, FlagGB, FlagES, FlagFR, FlagIT, FlagTR, FlagAR, FlagCN } from '../components/flags';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_COLORS } from '../constants/standardLayout';
import { useTranslation } from '../hooks/useTranslation';
import { BRAND, SPACING, TYPOGRAPHY } from '../theme/theme';
import { LEGAL_DOCUMENTS, getLegalContent } from '../data/legalContent';

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

  // Dil seçildiğinde translation'ı güncelle
  const handleLanguagePress = (langCode: string) => {
    setSelectedLanguage(langCode);
    i18n?.changeLanguage?.(langCode);
    setShowLanguageModal(false);
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
    const legalContent = getLegalContent(selectedLegalDoc, t);
    
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
        <ScrollView
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screenContainer}>
            <View style={styles.content}>
              {/* Logo & Brand */}
              <View style={styles.brandZone}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={logoImage} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandTitle}>TacticIQ</Text>
                <Text style={styles.brandSubtitle}>{t('languageSelection.subtitle') || 'Welcome'}</Text>
              </View>

              {/* Language Selector Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🌐 {t('languageSelection.title') || 'Select Language'}</Text>
                <TouchableOpacity
                  style={styles.languageSelectorButton}
                  onPress={() => setShowLanguageModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.languageSelectorContent}>
                    <View style={styles.languageSelectorFlag}>
                      <FlagComponent code={selectedLanguage} />
                    </View>
                    <Text style={styles.languageSelectorText}>{getLanguageName(selectedLanguage)}</Text>
                  </View>
                  <View style={styles.languageSelectorArrowContainer}>
                    <Text style={styles.languageSelectorArrow}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Legal Information Card */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📋 {t('languageSelection.legalSummaryTitle') || 'Legal Information'}</Text>
                <Text style={styles.sectionDescription}>
                  {t('languageSelection.legalSummaryDesc') || 'Please review our legal documents'}
                </Text>
                
                <View style={styles.legalLinks}>
                  <TouchableOpacity
                    style={styles.legalLinkCard}
                    onPress={() => handleOpenLegalDoc('terms')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.legalLinkLeft}>
                      <View style={styles.legalLinkIconContainer}>
                        <Text style={styles.legalLinkIcon}>📋</Text>
                      </View>
                      <View style={styles.legalLinkTextContainer}>
                        <Text style={styles.legalLinkTitle}>{t('legal.terms.title') || 'Terms of Service'}</Text>
                        <Text style={styles.legalLinkSubtitle}>Read terms</Text>
                      </View>
                    </View>
                    <Text style={styles.legalLinkArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.legalLinkCard}
                    onPress={() => handleOpenLegalDoc('privacy')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.legalLinkLeft}>
                      <View style={styles.legalLinkIconContainer}>
                        <Text style={styles.legalLinkIcon}>🔒</Text>
                      </View>
                      <View style={styles.legalLinkTextContainer}>
                        <Text style={styles.legalLinkTitle}>{t('legal.privacy.title') || 'Privacy Policy'}</Text>
                        <Text style={styles.legalLinkSubtitle}>Data protection</Text>
                      </View>
                    </View>
                    <Text style={styles.legalLinkArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.legalLinkCard}
                    onPress={() => setShowCookieModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.legalLinkLeft}>
                      <View style={styles.legalLinkIconContainer}>
                        <Text style={styles.legalLinkIcon}>🍪</Text>
                      </View>
                      <View style={styles.legalLinkTextContainer}>
                        <Text style={styles.legalLinkTitle}>{t('legal.cookies.title') || 'Cookie Settings'}</Text>
                        <Text style={styles.legalLinkSubtitle}>Manage preferences</Text>
                      </View>
                    </View>
                    <Text style={styles.legalLinkArrow}>›</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.legalLinkCard}
                    onPress={() => handleOpenLegalDoc('kvkk')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.legalLinkLeft}>
                      <View style={styles.legalLinkIconContainer}>
                        <Text style={styles.legalLinkIcon}>⚖️</Text>
                      </View>
                      <View style={styles.legalLinkTextContainer}>
                        <Text style={styles.legalLinkTitle}>{t('legal.kvkk.title') || 'KVKK Disclosure'}</Text>
                        <Text style={styles.legalLinkSubtitle}>Privacy rights</Text>
                      </View>
                    </View>
                    <Text style={styles.legalLinkArrow}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Acceptance Checkbox */}
                <View style={styles.acceptanceContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setLegalAccepted(!legalAccepted)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
                      {legalAccepted && <Text style={styles.checkboxIcon}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      {t('languageSelection.iAccept') || 'I have read and accept the legal documents'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.continueButton, !legalAccepted && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={!legalAccepted}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={legalAccepted ? [BRAND.emerald, '#047857'] : ['rgba(100, 100, 100, 0.5)', 'rgba(80, 80, 80, 0.5)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>
                    {t('common.continue') || 'Continue'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footerZone}>
                <Text style={styles.footer}>
                  © 2026 TacticIQ. All rights reserved.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

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
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  content: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  
  // Brand Zone
  brandZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  brandTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.white,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  
  // Language Selector
  languageSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    minHeight: 64,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  languageSelectorFlag: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageSelectorText: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.white,
  },
  languageSelectorArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSelectorArrow: {
    fontSize: 12,
    color: BRAND.emerald,
    fontWeight: '700',
  },
  
  // Legal Links
  legalLinks: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  legalLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 64,
  },
  legalLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  legalLinkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalLinkIcon: {
    fontSize: 22,
  },
  legalLinkTextContainer: {
    flex: 1,
  },
  legalLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
    marginBottom: 2,
  },
  legalLinkSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  legalLinkArrow: {
    fontSize: 24,
    color: BRAND.emerald,
    fontWeight: '300',
    marginLeft: SPACING.sm,
  },
  
  // Acceptance
  acceptanceContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
  },
  checkboxIcon: {
    color: BRAND.white,
    fontSize: 18,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: BRAND.white,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  
  // Continue Button
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  continueButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.white,
    letterSpacing: 0.5,
  },
  
  // Footer
  footerZone: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
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
