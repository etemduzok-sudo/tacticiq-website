import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND, COLORS, SPACING, TYPOGRAPHY, DARK_MODE } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_INPUT, STANDARD_COLORS } from '../constants/standardLayout';
import { useTranslation } from '../hooks/useTranslation';
import {
  ConsentPreferences,
  detectRegion,
  getDefaultConsentPreferences,
  saveConsentPreferences,
  applyConsentPreferences,
  isChildMode,
} from '../services/consentService';

// Logo
const logoImage = require('../../assets/logo.png');

interface AgeGateScreenProps {
  onComplete: (isMinor: boolean) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export const AgeGateScreen: React.FC<AgeGateScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');

  // Consent states
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
      setPreferences(defaultPrefs);
    } catch (error) {
      console.error('Error initializing consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (): number | null => {
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const day = parseInt(birthDay);

    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (year < CURRENT_YEAR - 120 || year > CURRENT_YEAR) {
      return null;
    }

    if (month < 1 || month > 12) {
      return null;
    }

    if (day < 1 || day > 31) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    
    // Validate date
    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // ✅ handleAgeContinue kaldırıldı - Artık handleSave içinde yaş doğrulaması yapılıyor

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
      // ✅ Önce yaş doğrulaması yap
      const age = calculateAge();

      if (age === null) {
        Alert.alert(
          t('common.error') || 'Hata',
          t('ageGate.pleaseEnterDate') || 'Lütfen doğum tarihinizi giriniz'
        );
        return;
      }

      if (age < 0 || age > 120) {
        Alert.alert(
          t('common.error') || 'Hata',
          t('ageGate.invalidDate') || 'Geçersiz doğum tarihi'
        );
        return;
      }

      // Save age info
      await AsyncStorage.setItem('user-age', JSON.stringify({
        year: parseInt(birthYear),
        month: parseInt(birthMonth),
        day: parseInt(birthDay),
        age,
        verifiedAt: new Date().toISOString(),
      }));

      // Determine if minor based on region
      const isMinor = age < 13; // Using COPPA standard as most restrictive

      // Enable child mode if minor
      if (isMinor) {
        await AsyncStorage.setItem('child-mode', 'true');
        await AsyncStorage.setItem('data-collection-disabled', 'true');
        setIsChild(true);
        // Disable all non-essential for children
        setPreferences({
          ...preferences,
          analytics: false,
          marketing: false,
          personalizedAds: false,
          dataTransfer: false,
        });
      } else {
        await AsyncStorage.setItem('child-mode', 'false');
        setIsChild(false);
      }

      // ✅ Sonra consent tercihlerini kaydet
      const finalPreferences: ConsentPreferences = {
        ...preferences,
        region,
        timestamp: new Date().toISOString(),
      };

      await saveConsentPreferences(finalPreferences);
      await applyConsentPreferences(finalPreferences);
      
      // ✅ Her ikisi de tamamlandı, devam et
      console.log('✅ AgeGateScreen: handleSave completed, calling onComplete', { isMinor });
      onComplete(isMinor);
    } catch (error) {
      console.error('❌ AgeGateScreen: handleSave error', error);
      Alert.alert(
        t('common.error') || 'Hata',
        t('consent.saveError') || 'Tercihler kaydedilemedi'
      );
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo - Standart boyut (96x96), sıçrama yok */}
            <View style={styles.brandContainer}>
              <Image 
                source={logoImage} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* ✅ Yaş Doğrulama ve Yasal Bilgilendirme - Tek Ekranda Birleştirildi */}
            
            {/* Age Verification Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {t('ageGate.title') || 'Yaş Doğrulama'}
              </Text>
              <Text style={styles.subtitle}>
                {t('ageGate.subtitle') || 'Lütfen doğum tarihinizi giriniz'}
              </Text>
            </View>

            {/* Date Inputs - Tek Satır */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('ageGate.year') || 'Yıl'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('ageGate.yearPlaceholder') || 'YYYY'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={birthYear}
                    onChangeText={(text) => setBirthYear(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={4}
                    autoComplete="off"
                    editable={true}
                    selectTextOnFocus={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('ageGate.month') || 'Ay'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('ageGate.monthPlaceholder') || 'MM'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={birthMonth}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 12)) {
                        setBirthMonth(num);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    autoComplete="off"
                    editable={true}
                    selectTextOnFocus={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {t('ageGate.day') || 'Gün'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('ageGate.dayPlaceholder') || 'DD'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={birthDay}
                    onChangeText={(text) => {
                      const num = text.replace(/[^0-9]/g, '');
                      if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 31)) {
                        setBirthDay(num);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    autoComplete="off"
                    editable={true}
                    selectTextOnFocus={false}
                  />
                </View>
              </View>
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {t('ageGate.info') || 'Bu bilgi güvenliğiniz ve yasal uyumluluk için gereklidir.'}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Consent Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>
                {t('consent.title') || 'Gizlilik Tercihleri'}
              </Text>
              <Text style={styles.subtitle}>
                {t('consent.subtitle') || 'Verilerinizin nasıl kullanılacağını seçin'}
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {region === 'TR' && (t('consent.kvkkInfo') || 'KVKK (6698 sayılı Kanun) kapsamında kişisel verilerinizin korunması için tercihlerinizi belirleyin.') ||
                 region === 'EU' && (t('consent.gdprInfo') || 'GDPR kapsamında verilerinizin korunması için tercihlerinizi belirleyin.') ||
                 region === 'US' && (t('consent.ccpaInfo') || 'CCPA kapsamında verilerinizin korunması için tercihlerinizi belirleyin.') ||
                 t('consent.defaultInfo') || 'Verilerinizi korumak için tercihlerinizi belirleyin.'}
              </Text>
            </View>

                {/* Consent Options */}
                <View style={styles.optionsContainer}>
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
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
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
                </View>

                {/* Save Button */}
                <View style={styles.saveContainer}>
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
                </View>

            {/* Privacy Policy Link */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>
                {t('consent.privacyPolicyLink') || 'Detaylı bilgi için Gizlilik Politikası'}
              </Text>
            </View>
          </View>
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
  },
  loadingText: {
    color: BRAND.white,
    fontSize: 16,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  titleContainer: {
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
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: BRAND.white,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    ...STANDARD_INPUT,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 50,
    textAlign: 'center', // ✅ Ortalanmış metin (tek satır görünümü için)
  },
  infoContainer: {
    marginBottom: SPACING.lg,
  },
  infoText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },
  // Consent styles
  infoBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING.xl,
    marginHorizontal: SPACING.lg,
  },
});
