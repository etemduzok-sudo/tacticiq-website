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
  ActivityIndicator,
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
  onViewLegalDoc?: (documentType: string) => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({ 
  onComplete, 
  onBack,
  onViewLegalDoc 
}) => {
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
  const [saving, setSaving] = useState(false);

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
    if (isChild) {
      Alert.alert(
        t('common.info') || 'Bilgi',
        t('consent.childModeRestriction') || 'Çocuk modunda tüm özellikler kabul edilemez'
      );
      return;
    }

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
    setSaving(true);
    try {
      const finalPreferences: ConsentPreferences = {
        ...preferences,
        region,
        timestamp: new Date().toISOString(),
      };

      await saveConsentPreferences(finalPreferences);
      await applyConsentPreferences(finalPreferences);
      
      Alert.alert(
        t('common.done') || 'Tamam',
        t('consent.saveSuccess') || 'Tercihleriniz kaydedildi',
        [
          {
            text: t('common.done') || 'Tamam',
            onPress: () => onComplete(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('common.error') || 'Hata',
        t('consent.saveError') || 'Tercihler kaydedilemedi'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleViewLegal = (documentType: string) => {
    if (onViewLegalDoc) {
      onViewLegalDoc(documentType);
    }
  };

  const getInfoMessage = () => {
    switch (region) {
      case 'TR':
        return t('consent.kvkkInfo') || 'Gizliliğinizi önemsiyoruz. Bu tercihler KVKK kapsamında korunmaktadır.';
      case 'EU':
        return t('consent.gdprInfo') || 'Gizliliğinizi önemsiyoruz. Bu tercihler GDPR kapsamında korunmaktadır.';
      case 'US':
        return t('consent.ccpaInfo') || 'Gizliliğinizi önemsiyoruz. Bu tercihler CCPA kapsamında korunmaktadır.';
      default:
        return t('consent.defaultInfo') || 'Verilerinizi korumak için tercihlerinizi belirleyin.';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={AUTH_GRADIENT.colors}
          style={styles.container}
          start={AUTH_GRADIENT.start}
          end={AUTH_GRADIENT.end}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.emerald} />
            <Text style={styles.loadingText}>
              {t('common.loading') || 'Yükleniyor...'}
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
      >
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
            <Text style={styles.infoText}>{getInfoMessage()}</Text>
          </AnimatedView>

          {/* Consent Options */}
          <AnimatedView style={styles.optionsContainer}>
            {/* Essential (Always On) */}
            <View style={styles.optionCard}>
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>
                    {t('consent.essential') || 'Zorunlu Çerezler'}
                  </Text>
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>
                      {t('consent.required') || 'Zorunlu'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {t('consent.essentialDesc') || 'Uygulamanın çalışması için gerekli'}
                </Text>
              </View>
              <View style={[styles.toggle, styles.toggleDisabled]}>
                <Text style={styles.toggleText}>✓</Text>
              </View>
            </View>

            {/* Analytics */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleToggle('analytics')}
              disabled={isChild}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>
                    {t('consent.analytics') || 'Analitik'}
                  </Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>
                      {t('consent.optional') || 'İsteğe Bağlı'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {t('consent.analyticsDesc') || 'Uygulama performansını analiz etmek için'}
                </Text>
              </View>
              <View style={[styles.toggle, preferences.analytics && styles.toggleActive]}>
                <Text style={styles.toggleText}>
                  {preferences.analytics ? '✓' : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Marketing */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleToggle('marketing')}
              disabled={isChild}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>
                    {t('consent.marketing') || 'Pazarlama'}
                  </Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>
                      {t('consent.optional') || 'İsteğe Bağlı'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {t('consent.marketingDesc') || 'Kampanya ve bildirimler için'}
                </Text>
              </View>
              <View style={[styles.toggle, preferences.marketing && styles.toggleActive]}>
                <Text style={styles.toggleText}>
                  {preferences.marketing ? '✓' : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Personalized Ads */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleToggle('personalizedAds')}
              disabled={isChild}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>
                    {t('consent.personalizedAds') || 'Kişiselleştirilmiş Reklamlar'}
                  </Text>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalText}>
                      {t('consent.optional') || 'İsteğe Bağlı'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  {t('consent.personalizedAdsDesc') || 'İlgi alanlarınıza göre reklamlar'}
                </Text>
              </View>
              <View style={[styles.toggle, preferences.personalizedAds && styles.toggleActive]}>
                <Text style={styles.toggleText}>
                  {preferences.personalizedAds ? '✓' : ''}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Data Transfer (Turkey specific) */}
            {region === 'TR' && (
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleToggle('dataTransfer')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>
                      {t('consent.dataTransfer') || 'Yurt Dışına Veri Aktarımı'}
                    </Text>
                    <View style={styles.optionalBadge}>
                      <Text style={styles.optionalText}>
                        {t('consent.optional') || 'İsteğe Bağlı'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.optionDescription}>
                    {t('consent.dataTransferDesc') || 'KVKK kapsamında açık rıza gereklidir'}
                  </Text>
                </View>
                <View style={[styles.toggle, preferences.dataTransfer && styles.toggleActive]}>
                  <Text style={styles.toggleText}>
                    {preferences.dataTransfer ? '✓' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </AnimatedView>

          {/* Action Buttons */}
          <AnimatedView style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={handleRejectAll}
              style={styles.rejectButton}
              activeOpacity={0.8}
              disabled={saving}
            >
              <Text style={styles.rejectButtonText}>
                {t('consent.rejectAll') || 'Tümünü Reddet'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAcceptAll}
              style={styles.acceptButton}
              activeOpacity={0.8}
              disabled={saving || isChild}
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
              disabled={saving}
            >
              <LinearGradient
                colors={[BRAND.emerald, '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={BRAND.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {t('consent.save') || 'Kaydet ve Devam Et'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedView>

          {/* Legal Links */}
          <AnimatedView style={styles.linksContainer}>
            <TouchableOpacity
              onPress={() => handleViewLegal('privacy')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                {t('consent.viewPrivacyPolicy') || 'Gizlilik Politikası'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.linkSeparator}>•</Text>
            
            <TouchableOpacity
              onPress={() => handleViewLegal('cookies')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                {t('consent.viewCookiePolicy') || 'Çerez Politikası'}
              </Text>
            </TouchableOpacity>

            {region === 'TR' && (
              <>
                <Text style={styles.linkSeparator}>•</Text>
                <TouchableOpacity
                  onPress={() => handleViewLegal('kvkk')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>
                    {t('consent.viewKvkkInfo') || 'KVKK Aydınlatma'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </AnimatedView>
        </ScrollView>
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
    gap: SPACING.md,
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
    fontSize: 26,
    fontWeight: '700',
    color: BRAND.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.4)',
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: BRAND.white,
    textAlign: 'center',
    lineHeight: 21,
  },
  optionsContainer: {
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  optionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  optionTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    flex: 1,
  },
  optionDescription: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 19,
  },
  requiredBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.emerald,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.emerald,
    textTransform: 'uppercase',
  },
  optionalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
  },
  toggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toggleDisabled: {
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
    borderColor: BRAND.emerald,
  },
  toggleText: {
    color: BRAND.white,
    fontSize: 22,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  rejectButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
    borderRadius: 14,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND.emerald,
  },
  acceptButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  saveContainer: {
    marginBottom: SPACING.xl,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.white,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  linkText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  linkSeparator: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '400',
  },
});
