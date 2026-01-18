/**
 * TacticIQ - Unified Onboarding Screen
 * Website-aligned design (https://www.tacticiq.app/)
 * 
 * Flow: Language → Age → Legal → Complete
 * Features: SVG Logo, Website colors, Professional UI
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated as RNAnimated,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlagDE, FlagGB, FlagES, FlagFR, FlagIT, FlagTR, FlagAR, FlagCN } from '../components/flags';
import { useTranslation } from '../hooks/useTranslation';
import { LEGAL_DOCUMENTS, getLegalContent } from '../data/legalContent';
import {
  ConsentPreferences,
  detectRegion,
  getDefaultConsentPreferences,
  saveConsentPreferences,
  applyConsentPreferences,
} from '../services/consentService';
import {
  WEBSITE_COLORS,
  WEBSITE_GRADIENTS,
  WEBSITE_SPACING,
  WEBSITE_RADIUS,
  WEBSITE_TYPOGRAPHY,
  WEBSITE_SHADOWS,
  WEBSITE_CARDS,
} from '../theme/websiteTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingStep = 'language' | 'age' | 'legal';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t, i18n } = useTranslation();
  
  // Step Management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');
  
  // Age Gate
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR - 25);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isMinor, setIsMinor] = useState(false);
  
  // Legal & Consent
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [region, setRegion] = useState<ConsentPreferences['region']>('OTHER');
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalizedAds: false,
    dataTransfer: false,
    timestamp: new Date().toISOString(),
  });
  
  // Modal States
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'year' | 'month' | 'day' | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Animation
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(50)).current;

  useEffect(() => {
    // Animate in
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'legal') {
      initializeConsent();
    }
  }, [currentStep]);

  const initializeConsent = async () => {
    try {
      const detectedRegion = await detectRegion();
      setRegion(detectedRegion);
      const defaultPrefs = await getDefaultConsentPreferences();
      if (isMinor) {
        setPreferences({
          ...defaultPrefs,
          analytics: false,
          marketing: false,
          personalizedAds: false,
          dataTransfer: false,
        });
      } else {
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error initializing consent:', error);
    }
  };

  // Language selection
  const handleLanguageSelect = async (code: string) => {
    setSelectedLanguage(code);
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem('@user_language', code);
    
    // Animate transition
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      RNAnimated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => {
      setCurrentStep('age');
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    });
  };

  // Age verification
  const calculateAge = (): number => {
    const today = new Date();
    const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const handleAgeVerification = async () => {
    const age = calculateAge();
    const minor = age < 18;
    setIsMinor(minor);
    
    await AsyncStorage.setItem('@user_age_verified', 'true');
    await AsyncStorage.setItem('@user_is_minor', minor ? 'true' : 'false');
    await AsyncStorage.setItem('@user_birth_date', `${selectedYear}-${selectedMonth}-${selectedDay}`);
    
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      RNAnimated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => {
      setCurrentStep('legal');
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    });
  };

  // Legal
  const handleToggleConsent = (key: keyof ConsentPreferences) => {
    if (key === 'essential' || isMinor) return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenLegalDoc = (docType: string) => {
    setSelectedLegalDoc(docType);
    setShowLegalModal(true);
  };

  const handleComplete = async () => {
    if (!legalAccepted) {
      Alert.alert(
        t('consent.error') || 'Error',
        t('consent.mustAccept') || 'You must accept the legal documents to continue'
      );
      return;
    }

    setLoading(true);
    try {
      await saveConsentPreferences(preferences, region);
      await applyConsentPreferences(preferences);
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      setTimeout(() => onComplete(), 300);
    } catch (error) {
      console.error('Error saving consent:', error);
      Alert.alert(t('consent.error') || 'Error', t('consent.saveFailed') || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // Flag Component
  const FlagComponent = ({ code }: { code: string }) => {
    const size = 40;
    switch (code) {
      case 'de': return <FlagDE size={size} />;
      case 'en': return <FlagGB size={size} />;
      case 'es': return <FlagES size={size} />;
      case 'fr': return <FlagFR size={size} />;
      case 'it': return <FlagIT size={size} />;
      case 'tr': return <FlagTR size={size} />;
      case 'ar': return <FlagAR size={size} />;
      case 'zh': return <FlagCN size={size} />;
      default: return null;
    }
  };

  const languages = [
    { code: 'tr', name: 'Türkçe', native: 'Türkçe' },
    { code: 'en', name: 'English', native: 'English' },
    { code: 'de', name: 'Deutsch', native: 'Deutsch' },
    { code: 'es', name: 'Español', native: 'Español' },
    { code: 'fr', name: 'Français', native: 'Français' },
    { code: 'it', name: 'Italiano', native: 'Italiano' },
    { code: 'ar', name: 'العربية', native: 'العربية' },
    { code: 'zh', name: '中文', native: '中文' },
  ];

  // ===== RENDER: Language Selection =====
  const renderLanguageStep = () => (
    <RNAnimated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepIcon}>🌍</Text>
        <Text style={styles.stepTitle}>{t('onboarding.selectLanguage') || 'Select Language'}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding.choosePreferred') || 'Choose your preferred language'}</Text>
      </View>

      {/* Language Grid */}
      <View style={styles.languageGrid}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.languageCard}
            onPress={() => handleLanguageSelect(lang.code)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(31, 162, 166, 0.15)', 'rgba(15, 42, 36, 0.3)']}
              style={styles.languageCardGradient}
            >
              <View style={styles.flagWrapper}>
                <FlagComponent code={lang.code} />
              </View>
              <Text style={styles.languageName}>{lang.native}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </RNAnimated.View>
  );

  // ===== RENDER: Age Verification =====
  const renderAgeStep = () => (
    <RNAnimated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepIcon}>🎂</Text>
        <Text style={styles.stepTitle}>{t('ageGate.title') || 'Age Verification'}</Text>
        <Text style={styles.stepSubtitle}>{t('ageGate.subtitle') || 'Please enter your birth date'}</Text>
      </View>

      {/* Date Pickers */}
      <View style={styles.datePickerRow}>
        {/* Day */}
        <TouchableOpacity
          style={styles.datePickerCard}
          onPress={() => setShowDatePicker('day')}
        >
          <Text style={styles.datePickerLabel}>{t('ageGate.day') || 'Day'}</Text>
          <Text style={styles.datePickerValue}>{selectedDay}</Text>
        </TouchableOpacity>

        {/* Month */}
        <TouchableOpacity
          style={[styles.datePickerCard, styles.datePickerCardLarge]}
          onPress={() => setShowDatePicker('month')}
        >
          <Text style={styles.datePickerLabel}>{t('ageGate.month') || 'Month'}</Text>
          <Text style={styles.datePickerValue}>{MONTHS[selectedMonth - 1]?.label.substring(0, 3)}</Text>
        </TouchableOpacity>

        {/* Year */}
        <TouchableOpacity
          style={styles.datePickerCard}
          onPress={() => setShowDatePicker('year')}
        >
          <Text style={styles.datePickerLabel}>{t('ageGate.year') || 'Year'}</Text>
          <Text style={styles.datePickerValue}>{selectedYear}</Text>
        </TouchableOpacity>
      </View>

      {/* Age Display */}
      <View style={styles.ageDisplay}>
        <LinearGradient
          colors={['rgba(31, 162, 166, 0.2)', 'rgba(201, 164, 76, 0.1)']}
          style={styles.ageDisplayGradient}
        >
          <Text style={styles.ageDisplayLabel}>{t('ageGate.yourAge') || 'Your Age'}</Text>
          <Text style={styles.ageDisplayValue}>{calculateAge()}</Text>
          <Text style={styles.ageDisplayUnit}>{t('ageGate.years') || 'years'}</Text>
        </LinearGradient>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAgeVerification}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={WEBSITE_GRADIENTS.buttonPrimary.colors}
          style={styles.primaryButtonGradient}
          start={WEBSITE_GRADIENTS.buttonPrimary.start}
          end={WEBSITE_GRADIENTS.buttonPrimary.end}
        >
          <Text style={styles.primaryButtonText}>{t('common.continue') || 'Continue'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep('language')}
      >
        <Text style={styles.backButtonText}>← {t('common.back') || 'Back'}</Text>
      </TouchableOpacity>
    </RNAnimated.View>
  );

  // ===== RENDER: Legal Acceptance =====
  const renderLegalStep = () => (
    <RNAnimated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepIcon}>📋</Text>
        <Text style={styles.stepTitle}>{t('legal.title') || 'Legal Information'}</Text>
        <Text style={styles.stepSubtitle}>{t('legal.subtitle') || 'Please review and accept our terms'}</Text>
      </View>

      {/* Legal Documents */}
      <View style={styles.legalList}>
        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('terms')}>
          <View style={styles.legalItemIcon}><Text>📋</Text></View>
          <View style={styles.legalItemContent}>
            <Text style={styles.legalItemTitle}>{t('legal.terms.title') || 'Terms of Service'}</Text>
            <Text style={styles.legalItemDesc}>{t('legal.terms.desc') || 'Usage rules and conditions'}</Text>
          </View>
          <Text style={styles.legalItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('privacy')}>
          <View style={styles.legalItemIcon}><Text>🔒</Text></View>
          <View style={styles.legalItemContent}>
            <Text style={styles.legalItemTitle}>{t('legal.privacy.title') || 'Privacy Policy'}</Text>
            <Text style={styles.legalItemDesc}>{t('legal.privacy.desc') || 'How we handle your data'}</Text>
          </View>
          <Text style={styles.legalItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.legalItem} onPress={() => setShowCookieModal(true)}>
          <View style={styles.legalItemIcon}><Text>🍪</Text></View>
          <View style={styles.legalItemContent}>
            <Text style={styles.legalItemTitle}>{t('legal.cookies.title') || 'Cookie Settings'}</Text>
            <Text style={styles.legalItemDesc}>{t('legal.cookies.desc') || 'Manage your preferences'}</Text>
          </View>
          <Text style={styles.legalItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('kvkk')}>
          <View style={styles.legalItemIcon}><Text>⚖️</Text></View>
          <View style={styles.legalItemContent}>
            <Text style={styles.legalItemTitle}>{t('legal.kvkk.title') || 'KVKK Disclosure'}</Text>
            <Text style={styles.legalItemDesc}>{t('legal.kvkk.desc') || 'Data protection rights'}</Text>
          </View>
          <Text style={styles.legalItemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Acceptance Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setLegalAccepted(!legalAccepted)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
          {legalAccepted && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          {t('legal.iAccept') || 'I have read and accept the legal documents'}
        </Text>
      </TouchableOpacity>

      {/* Minor Notice */}
      {isMinor && (
        <View style={styles.minorNotice}>
          <Text style={styles.minorNoticeIcon}>⚠️</Text>
          <Text style={styles.minorNoticeText}>
            {t('legal.minorNotice') || 'Parental consent required for users under 18'}
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.primaryButton, !legalAccepted && styles.primaryButtonDisabled]}
        onPress={handleComplete}
        activeOpacity={0.8}
        disabled={!legalAccepted || loading}
      >
        <LinearGradient
          colors={legalAccepted ? WEBSITE_GRADIENTS.buttonPrimary.colors : ['#555', '#444']}
          style={styles.primaryButtonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color={WEBSITE_COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('common.getStarted') || 'Get Started'}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep('age')}
      >
        <Text style={styles.backButtonText}>← {t('common.back') || 'Back'}</Text>
      </TouchableOpacity>
    </RNAnimated.View>
  );

  // ===== RENDER: Date Picker Modal =====
  const renderDatePickerModal = () => {
    let items: { value: number; label: string }[] = [];
    let title = '';
    let onSelect: (value: number) => void = () => {};

    if (showDatePicker === 'year') {
      items = YEARS.map(y => ({ value: y, label: String(y) }));
      title = t('ageGate.selectYear') || 'Select Year';
      onSelect = (v) => { setSelectedYear(v); setShowDatePicker(null); };
    } else if (showDatePicker === 'month') {
      items = MONTHS;
      title = t('ageGate.selectMonth') || 'Select Month';
      onSelect = (v) => { setSelectedMonth(v); setShowDatePicker(null); };
    } else if (showDatePicker === 'day') {
      const daysCount = getDaysInMonth(selectedYear, selectedMonth);
      items = Array.from({ length: daysCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      title = t('ageGate.selectDay') || 'Select Day';
      onSelect = (v) => { setSelectedDay(v); setShowDatePicker(null); };
    }

    const selectedValue = showDatePicker === 'year' ? selectedYear : showDatePicker === 'month' ? selectedMonth : selectedDay;

    return (
      <Modal visible={showDatePicker !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {items.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.pickerItem, item.value === selectedValue && styles.pickerItemSelected]}
                  onPress={() => onSelect(item.value)}
                >
                  <Text style={[styles.pickerItemText, item.value === selectedValue && styles.pickerItemTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ===== RENDER: Legal Document Modal =====
  const renderLegalModal = () => (
    <Modal visible={showLegalModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.legalModal}>
          <View style={styles.legalModalHeader}>
            <Text style={styles.legalModalTitle}>
              {selectedLegalDoc && t(`legal.${selectedLegalDoc}.title`)}
            </Text>
            <TouchableOpacity onPress={() => setShowLegalModal(false)}>
              <Text style={styles.legalModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.legalModalScroll}>
            <Text style={styles.legalModalContent}>
              {selectedLegalDoc && getLegalContent(selectedLegalDoc, selectedLanguage)}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.legalModalButton}
            onPress={() => setShowLegalModal(false)}
          >
            <Text style={styles.legalModalButtonText}>{t('common.close') || 'Close'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ===== RENDER: Cookie Modal =====
  const renderCookieModal = () => (
    <Modal visible={showCookieModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.cookieModal}>
          <View style={styles.cookieModalHeader}>
            <Text style={styles.cookieModalTitle}>{t('legal.cookies.title') || 'Cookie Settings'}</Text>
            <TouchableOpacity onPress={() => setShowCookieModal(false)}>
              <Text style={styles.cookieModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cookieModalScroll}>
            {/* Essential - Always on */}
            <View style={styles.cookieItem}>
              <View style={styles.cookieItemInfo}>
                <Text style={styles.cookieItemTitle}>{t('cookies.essential') || 'Essential'}</Text>
                <Text style={styles.cookieItemDesc}>{t('cookies.essentialDesc') || 'Required for basic functionality'}</Text>
              </View>
              <View style={[styles.cookieToggle, styles.cookieToggleOn]}>
                <View style={styles.cookieToggleThumb} />
              </View>
            </View>

            {/* Analytics */}
            {!isMinor && (
              <TouchableOpacity style={styles.cookieItem} onPress={() => handleToggleConsent('analytics')}>
                <View style={styles.cookieItemInfo}>
                  <Text style={styles.cookieItemTitle}>{t('cookies.analytics') || 'Analytics'}</Text>
                  <Text style={styles.cookieItemDesc}>{t('cookies.analyticsDesc') || 'Help us improve'}</Text>
                </View>
                <View style={[styles.cookieToggle, preferences.analytics && styles.cookieToggleOn]}>
                  <View style={[styles.cookieToggleThumb, preferences.analytics && styles.cookieToggleThumbOn]} />
                </View>
              </TouchableOpacity>
            )}

            {/* Marketing */}
            {!isMinor && (
              <TouchableOpacity style={styles.cookieItem} onPress={() => handleToggleConsent('marketing')}>
                <View style={styles.cookieItemInfo}>
                  <Text style={styles.cookieItemTitle}>{t('cookies.marketing') || 'Marketing'}</Text>
                  <Text style={styles.cookieItemDesc}>{t('cookies.marketingDesc') || 'Personalized content'}</Text>
                </View>
                <View style={[styles.cookieToggle, preferences.marketing && styles.cookieToggleOn]}>
                  <View style={[styles.cookieToggleThumb, preferences.marketing && styles.cookieToggleThumbOn]} />
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.cookieSaveButton}
            onPress={() => setShowCookieModal(false)}
          >
            <LinearGradient colors={WEBSITE_GRADIENTS.buttonPrimary.colors} style={styles.cookieSaveGradient}>
              <Text style={styles.cookieSaveText}>{t('common.save') || 'Save Preferences'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ===== MAIN RENDER =====
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={WEBSITE_GRADIENTS.auth.colors}
        style={styles.container}
        start={WEBSITE_GRADIENTS.auth.start}
        end={WEBSITE_GRADIENTS.auth.end}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={Platform.OS === 'web' ? { uri: '/TacticIQ.svg' } : require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>TacticIQ</Text>
            <Text style={styles.brandTagline}>Football Analytics Platform</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, currentStep === 'language' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, currentStep === 'age' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, currentStep === 'legal' && styles.progressDotActive]} />
          </View>

          {/* Step Content */}
          {currentStep === 'language' && renderLanguageStep()}
          {currentStep === 'age' && renderAgeStep()}
          {currentStep === 'legal' && renderLegalStep()}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 TacticIQ. All rights reserved.</Text>
          </View>
        </ScrollView>

        {/* Modals */}
        {renderDatePickerModal()}
        {renderLegalModal()}
        {renderCookieModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WEBSITE_COLORS.dark,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: WEBSITE_SPACING.lg,
    paddingBottom: WEBSITE_SPACING.xl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: WEBSITE_SPACING.xl,
    marginBottom: WEBSITE_SPACING.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: WEBSITE_SPACING.sm,
  },
  brandName: {
    ...WEBSITE_TYPOGRAPHY.h1,
    color: WEBSITE_COLORS.white,
    marginTop: WEBSITE_SPACING.sm,
  },
  brandTagline: {
    ...WEBSITE_TYPOGRAPHY.bodySmall,
    color: WEBSITE_COLORS.secondary,
    marginTop: WEBSITE_SPACING.xs,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: WEBSITE_SPACING.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: WEBSITE_COLORS.secondary,
    borderColor: WEBSITE_COLORS.secondary,
    ...WEBSITE_SHADOWS.glow,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: WEBSITE_SPACING.xs,
  },

  // Step Content
  stepContent: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: WEBSITE_SPACING.xl,
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: WEBSITE_SPACING.md,
  },
  stepTitle: {
    ...WEBSITE_TYPOGRAPHY.h2,
    color: WEBSITE_COLORS.white,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: WEBSITE_SPACING.xs,
  },

  // Language Grid
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -WEBSITE_SPACING.xs,
  },
  languageCard: {
    width: '50%',
    paddingHorizontal: WEBSITE_SPACING.xs,
    marginBottom: WEBSITE_SPACING.md,
  },
  languageCardGradient: {
    height: 90,
    borderRadius: WEBSITE_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: WEBSITE_SPACING.sm,
  },
  flagWrapper: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageName: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.white,
  },

  // Date Picker
  datePickerRow: {
    flexDirection: 'row',
    gap: WEBSITE_SPACING.sm,
    marginBottom: WEBSITE_SPACING.lg,
  },
  datePickerCard: {
    flex: 1,
    ...WEBSITE_CARDS.glass,
    padding: WEBSITE_SPACING.md,
    alignItems: 'center',
  },
  datePickerCardLarge: {
    flex: 1.5,
  },
  datePickerLabel: {
    ...WEBSITE_TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: WEBSITE_SPACING.xs,
  },
  datePickerValue: {
    ...WEBSITE_TYPOGRAPHY.h3,
    color: WEBSITE_COLORS.white,
  },

  // Age Display
  ageDisplay: {
    marginBottom: WEBSITE_SPACING.xl,
    borderRadius: WEBSITE_RADIUS.xl,
    overflow: 'hidden',
  },
  ageDisplayGradient: {
    padding: WEBSITE_SPACING.lg,
    alignItems: 'center',
    borderRadius: WEBSITE_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  ageDisplayLabel: {
    ...WEBSITE_TYPOGRAPHY.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  ageDisplayValue: {
    fontSize: 56,
    fontWeight: '800',
    color: WEBSITE_COLORS.secondary,
    lineHeight: 64,
  },
  ageDisplayUnit: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Legal List
  legalList: {
    gap: WEBSITE_SPACING.sm,
    marginBottom: WEBSITE_SPACING.lg,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...WEBSITE_CARDS.glass,
    padding: WEBSITE_SPACING.md,
  },
  legalItemIcon: {
    width: 44,
    height: 44,
    borderRadius: WEBSITE_RADIUS.lg,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: WEBSITE_SPACING.md,
  },
  legalItemContent: {
    flex: 1,
  },
  legalItemTitle: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.white,
  },
  legalItemDesc: {
    ...WEBSITE_TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  legalItemArrow: {
    fontSize: 24,
    color: WEBSITE_COLORS.secondary,
    fontWeight: '300',
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...WEBSITE_CARDS.glass,
    padding: WEBSITE_SPACING.md,
    marginBottom: WEBSITE_SPACING.lg,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: WEBSITE_RADIUS.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: WEBSITE_SPACING.md,
  },
  checkboxChecked: {
    backgroundColor: WEBSITE_COLORS.secondary,
    borderColor: WEBSITE_COLORS.secondary,
  },
  checkboxIcon: {
    color: WEBSITE_COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: WEBSITE_COLORS.white,
    flex: 1,
  },

  // Minor Notice
  minorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 164, 76, 0.15)',
    borderRadius: WEBSITE_RADIUS.lg,
    padding: WEBSITE_SPACING.md,
    marginBottom: WEBSITE_SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.3)',
  },
  minorNoticeIcon: {
    fontSize: 20,
    marginRight: WEBSITE_SPACING.sm,
  },
  minorNoticeText: {
    ...WEBSITE_TYPOGRAPHY.bodySmall,
    color: WEBSITE_COLORS.accent,
    flex: 1,
  },

  // Buttons
  primaryButton: {
    borderRadius: WEBSITE_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: WEBSITE_SPACING.md,
    ...WEBSITE_SHADOWS.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
    ...WEBSITE_SHADOWS.sm,
  },
  primaryButtonGradient: {
    paddingVertical: WEBSITE_SPACING.md,
    paddingHorizontal: WEBSITE_SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.white,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: WEBSITE_SPACING.md,
  },
  backButtonText: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: WEBSITE_SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    ...WEBSITE_TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.3)',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: WEBSITE_SPACING.lg,
  },
  pickerModal: {
    width: '100%',
    maxWidth: 350,
    maxHeight: '70%',
    backgroundColor: WEBSITE_COLORS.primary,
    borderRadius: WEBSITE_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WEBSITE_COLORS.secondary,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: WEBSITE_SPACING.lg,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    ...WEBSITE_TYPOGRAPHY.h4,
    color: WEBSITE_COLORS.white,
  },
  pickerClose: {
    fontSize: 24,
    color: WEBSITE_COLORS.white,
    fontWeight: '300',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    padding: WEBSITE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
  },
  pickerItemText: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: WEBSITE_COLORS.white,
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: WEBSITE_COLORS.secondary,
    fontWeight: '700',
  },

  legalModal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: WEBSITE_COLORS.primary,
    borderRadius: WEBSITE_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WEBSITE_COLORS.secondary,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: WEBSITE_SPACING.lg,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  legalModalTitle: {
    ...WEBSITE_TYPOGRAPHY.h4,
    color: WEBSITE_COLORS.white,
    flex: 1,
  },
  legalModalClose: {
    fontSize: 24,
    color: WEBSITE_COLORS.white,
    fontWeight: '300',
  },
  legalModalScroll: {
    padding: WEBSITE_SPACING.lg,
  },
  legalModalContent: {
    ...WEBSITE_TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  legalModalButton: {
    padding: WEBSITE_SPACING.lg,
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    alignItems: 'center',
  },
  legalModalButtonText: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.secondary,
  },

  cookieModal: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: WEBSITE_COLORS.primary,
    borderRadius: WEBSITE_RADIUS.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WEBSITE_COLORS.secondary,
  },
  cookieModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: WEBSITE_SPACING.lg,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cookieModalTitle: {
    ...WEBSITE_TYPOGRAPHY.h4,
    color: WEBSITE_COLORS.white,
  },
  cookieModalClose: {
    fontSize: 24,
    color: WEBSITE_COLORS.white,
    fontWeight: '300',
  },
  cookieModalScroll: {
    padding: WEBSITE_SPACING.lg,
  },
  cookieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: WEBSITE_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cookieItemInfo: {
    flex: 1,
    marginRight: WEBSITE_SPACING.md,
  },
  cookieItemTitle: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.white,
  },
  cookieItemDesc: {
    ...WEBSITE_TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  cookieToggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  cookieToggleOn: {
    backgroundColor: WEBSITE_COLORS.secondary,
  },
  cookieToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: WEBSITE_COLORS.white,
  },
  cookieToggleThumbOn: {
    alignSelf: 'flex-end',
  },
  cookieSaveButton: {
    margin: WEBSITE_SPACING.lg,
    borderRadius: WEBSITE_RADIUS.lg,
    overflow: 'hidden',
  },
  cookieSaveGradient: {
    padding: WEBSITE_SPACING.md,
    alignItems: 'center',
  },
  cookieSaveText: {
    ...WEBSITE_TYPOGRAPHY.button,
    color: WEBSITE_COLORS.white,
  },
});
