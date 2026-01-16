import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND, SPACING, TYPOGRAPHY } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { useTranslation } from '../hooks/useTranslation';
import { View as RNView } from 'react-native';

// Platform-specific Animated - Web için basit View, native için reanimated
const AnimatedView = Platform.OS === 'web' 
  ? RNView 
  : (() => {
      try {
        const Reanimated = require('react-native-reanimated');
        return (Reanimated.default || Reanimated).View || RNView;
      } catch {
        return RNView;
      }
    })();

// Platform-specific FadeInDown - Web için no-op, native için reanimated
const getFadeInDown = () => {
  if (Platform.OS === 'web') {
    return { delay: () => getFadeInDown(), springify: () => getFadeInDown() };
  }
  try {
    const Reanimated = require('react-native-reanimated');
    return Reanimated.FadeInDown || { delay: () => getFadeInDown(), springify: () => getFadeInDown() };
  } catch {
    return { delay: () => getFadeInDown(), springify: () => getFadeInDown() };
  }
};
const FadeInDown = getFadeInDown();

import {
  ConsentPreferences,
  detectRegion,
  getDefaultConsentPreferences,
  saveConsentPreferences,
  applyConsentPreferences,
  isChildMode,
} from '../services/consentService';

interface ConsentScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ onComplete, onBack }) => {
  // All hooks must be called unconditionally and in the same order
  const { t } = useTranslation();
  const [region, setRegion] = useState<ConsentPreferences['region']>('OTHER');
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalizedAds: false,
    dataTransfer: false,
    timestamp: new Date().toISOString(),
  });
  const [isChild, setIsChild] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeConsent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeConsent = async () => {
    try {
      const detectedRegion = await detectRegion();
      setRegion(detectedRegion);
      
      const defaultPrefs = await getDefaultConsentPreferences();
      
      const childMode = await isChildMode();
      setIsChild(childMode);

      // If child mode, disable all non-essential
      if (childMode) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof ConsentPreferences) => {
    if (key === 'essential') return; // Essential cannot be disabled
    
    if (isChild && (key === 'analytics' || key === 'marketing' || key === 'personalizedAds')) {
      Alert.alert(
        t('common.info') || 'Bilgi',
        t('consent.childModeRestriction') || 'Çocuk modunda bu özellikler devre dışıdır'
      );
      return;
    }

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      personalizedAds: true,
      dataTransfer: region === 'TR' ? true : preferences.dataTransfer,
      timestamp: new Date().toISOString(),
      region,
    });
  };

  const handleRejectAll = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalizedAds: false,
      dataTransfer: false,
      timestamp: new Date().toISOString(),
      region,
    });
  };

  const handleSave = async () => {
    try {
      const finalPreferences: ConsentPreferences = {
        ...preferences,
        region,
        timestamp: new Date().toISOString(),
      };

      await saveConsentPreferences(finalPreferences);
      await applyConsentPreferences(finalPreferences);
      
      onComplete();
    } catch (error) {
      Alert.alert(
        t('common.error') || 'Hata',
        t('consent.saveError') || 'Tercihler kaydedilemedi'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t('common.loading') || 'Yükleniyor...'}
            </Text>
          </View>
        ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <AnimatedView style={styles.header}>
            <Text style={styles.title}>
              {t('consent.title') || 'Gizlilik Tercihleri'}
            </Text>
            <Text style={styles.subtitle}>
              {t('consent.subtitle') || 'Verilerinizin nasıl kullanılacağını seçin'}
            </Text>
          </AnimatedView>

          {/* Info Box */}
          <AnimatedView style={styles.infoBox}>
            <Text style={styles.infoText}>
              {region === 'TR' && t('consent.kvkkInfo') || 
               region === 'EU' && t('consent.gdprInfo') ||
               region === 'US' && t('consent.ccpaInfo') ||
               t('consent.defaultInfo') || 'Verilerinizi korumak için tercihlerinizi belirleyin'}
            </Text>
          </AnimatedView>

          {/* Consent Options */}
          <AnimatedView style={styles.optionsContainer}>
            {/* Essential (Always On) */}
            <View style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('consent.essential') || 'Zorunlu Çerezler'}
                </Text>
                <Text style={styles.optionDescription}>
                  {t('consent.essentialDesc') || 'Uygulamanın çalışması için gerekli'}
                </Text>
              </View>
              <View style={[styles.toggle, styles.toggleDisabled]}>
                <Text style={styles.toggleText}>✓</Text>
              </View>
            </View>

            {/* Analytics */}
            <View style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('consent.analytics') || 'Analitik'}
                </Text>
                <Text style={styles.optionDescription}>
                  {t('consent.analyticsDesc') || 'Uygulama performansını analiz etmek için'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, preferences.analytics && styles.toggleActive]}
                onPress={() => handleToggle('analytics')}
                disabled={isChild}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {preferences.analytics ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Marketing */}
            <View style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('consent.marketing') || 'Pazarlama'}
                </Text>
                <Text style={styles.optionDescription}>
                  {t('consent.marketingDesc') || 'Kampanya ve bildirimler için'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, preferences.marketing && styles.toggleActive]}
                onPress={() => handleToggle('marketing')}
                disabled={isChild}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {preferences.marketing ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Personalized Ads */}
            <View style={styles.optionCard}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t('consent.personalizedAds') || 'Kişiselleştirilmiş Reklamlar'}
                </Text>
                <Text style={styles.optionDescription}>
                  {t('consent.personalizedAdsDesc') || 'İlgi alanlarınıza göre reklamlar'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, preferences.personalizedAds && styles.toggleActive]}
                onPress={() => handleToggle('personalizedAds')}
                disabled={isChild}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {preferences.personalizedAds ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Data Transfer (Turkey specific) */}
            {region === 'TR' && (
              <View style={styles.optionCard}>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    {t('consent.dataTransfer') || 'Yurt Dışına Veri Aktarımı'}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {t('consent.dataTransferDesc') || 'KVKK kapsamında açık rıza gereklidir'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, preferences.dataTransfer && styles.toggleActive]}
                  onPress={() => handleToggle('dataTransfer')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleText}>
                    {preferences.dataTransfer ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </AnimatedView>

          {/* Action Buttons */}
          <AnimatedView style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleRejectAll}
              style={styles.rejectButton}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectButtonText}>
                {t('consent.rejectAll') || 'Tümünü Reddet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAcceptAll}
              style={styles.acceptButton}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptButtonText}>
                {t('consent.acceptAll') || 'Tümünü Kabul Et'}
              </Text>
            </TouchableOpacity>
          </AnimatedView>

          {/* Save Button */}
          <AnimatedView style={styles.saveContainer}>
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.8}
              style={styles.saveButton}
            >
              <LinearGradient
                colors={[BRAND.emerald, '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {t('consent.save') || 'Kaydet ve Devam Et'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          {/* Privacy Policy Link */}
          <AnimatedView style={styles.linkContainer}>
            <Text style={styles.linkText}>
              {t('consent.privacyPolicyLink') || 'Detaylı bilgi için Gizlilik Politikası'}
            </Text>
          </AnimatedView>
        </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_GRADIENT.colors[0],
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: BRAND.white,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: BRAND.white,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  optionTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  toggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
  },
  toggleDisabled: {
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
    borderColor: BRAND.emerald,
  },
  toggleText: {
    color: BRAND.white,
    fontSize: 20,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rejectButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND.emerald,
  },
  acceptButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  saveContainer: {
    marginBottom: SPACING.lg,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
});
