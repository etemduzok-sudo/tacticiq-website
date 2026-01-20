import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { BRAND, SPACING, TYPOGRAPHY } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { useTranslation } from '../hooks/useTranslation';
import {
  ConsentPreferences,
  detectRegion,
  getDefaultConsentPreferences,
  saveConsentPreferences,
  applyConsentPreferences,
} from '../services/consentService';
import { LEGAL_DOCUMENTS, getLegalContent } from '../data/legalContent';

const logoImage = require('../../assets/logo.png');

interface AgeGateScreenProps {
  onComplete: (isMinor: boolean) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
// Years array - dynamically starts from 18 years ago (updates daily)
const getYearsArray = () => {
  const year18YearsAgo = CURRENT_YEAR - 18;
  return Array.from({ length: 83 }, (_, i) => year18YearsAgo - i);
};
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const AgeGateScreen: React.FC<AgeGateScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  
  // No pre-selected date - user must choose
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Get years array dynamically
  const YEARS = getYearsArray();
  
  const [region, setRegion] = useState<ConsentPreferences['region']>('OTHER');
  // Tüm çerezler ön tanımlı olarak işaretlenmiş halde gelsin
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: true,
    marketing: true,
    personalizedAds: true,
    dataTransfer: true,
    timestamp: new Date().toISOString(),
  });
  
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);
  const [expandedConsent, setExpandedConsent] = useState<string | null>(null);
  const [isChild, setIsChild] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  useEffect(() => {
    initializeConsent();
  }, []);

  const initializeConsent = async () => {
    try {
      const detectedRegion = await detectRegion();
      setRegion(detectedRegion);
      
      // Tüm çerezler ön tanımlı olarak işaretlenmiş halde gelsin
      // getDefaultConsentPreferences yerine tümünü true yap
      setPreferences((prev) => ({
        ...prev,
        essential: true,
        analytics: true,
        marketing: true,
        personalizedAds: true,
        dataTransfer: detectedRegion === 'TR' ? true : prev.dataTransfer,
        region: detectedRegion,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error initializing consent:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (): number | null => {
    if (selectedYear === null || selectedMonth === null || selectedDay === null) {
      return null;
    }
    
    const today = new Date();
    const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Ses efekti için (tık tık)
  const playTickSound = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptic feedback desteklenmiyorsa sessizce devam et
      }
    }
  };

  const handleToggleConsent = (key: keyof ConsentPreferences) => {
    if (key === 'essential') return;
    
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
    if (isChild) return;

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

  const handleSaveConsent = () => {
    setShowConsentModal(false);
  };

  const handleContinue = async () => {
    if (!legalAccepted) {
      Alert.alert(
        t('common.error') || 'Hata',
        'Lütfen yasal belgeleri okuyup kabul edin'
      );
      return;
    }

    // Tarih seçilmiş mi kontrol et
    if (selectedYear === null || selectedMonth === null || selectedDay === null) {
      Alert.alert(
        t('common.error') || 'Hata',
        'Lütfen doğum tarihinizi seçin'
      );
      return;
    }

    setSaving(true);
    try {
      const age = calculateAge();

      if (age === null) {
        Alert.alert(
          t('common.error') || 'Hata',
          'Lütfen doğum tarihinizi seçin'
        );
        setSaving(false);
        return;
      }

      // 18 yaş kontrolü - gün itibarı ile
      if (age < 18) {
        Alert.alert(
          t('common.error') || 'Hata',
          '18 yaşından küçükler kayıt olamaz. Lütfen doğum tarihinizi kontrol edin.'
        );
        setSaving(false);
        return;
      }

      if (age < 0 || age > 120) {
        Alert.alert(
          t('common.error') || 'Hata',
          t('ageGate.invalidDate') || 'Geçersiz doğum tarihi'
        );
        setSaving(false);
        return;
      }

      await AsyncStorage.setItem('user-age', JSON.stringify({
        year: selectedYear,
        month: selectedMonth,
        day: selectedDay,
        age,
        verifiedAt: new Date().toISOString(),
      }));

      const isMinor = age < 13;

      if (isMinor) {
        await AsyncStorage.setItem('child-mode', 'true');
        await AsyncStorage.setItem('data-collection-disabled', 'true');
        preferences.analytics = false;
        preferences.marketing = false;
        preferences.personalizedAds = false;
        preferences.dataTransfer = false;
      } else {
        await AsyncStorage.setItem('child-mode', 'false');
      }

      const finalPreferences: ConsentPreferences = {
        ...preferences,
        region,
        timestamp: new Date().toISOString(),
      };

      await saveConsentPreferences(finalPreferences);
      await applyConsentPreferences(finalPreferences);
      
      onComplete(isMinor);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(t('common.error') || 'Hata', 'Bir hata oluştu');
      setSaving(false);
    }
  };

  const renderPicker = (
    items: number[],
    selectedValue: number | null,
    onSelect: (val: number) => void,
    formatter?: (val: number) => string
  ) => {
    return (
      <ScrollView
        style={styles.pickerScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity
              key={item}
              onPress={async () => {
                // Ses ve haptic feedback (tık tık)
                await playTickSound();
                onSelect(item);
              }}
              style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                {formatter ? formatter(item) : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderConsentModal = () => (
    <Modal
      visible={showConsentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowConsentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('consent.title') || 'Gizlilik Tercihleri'}</Text>
            <TouchableOpacity onPress={() => setShowConsentModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Essential */}
            <TouchableOpacity style={styles.consentItem} onPress={() => setExpandedConsent(expandedConsent === 'essential' ? null : 'essential')}>
              <View style={styles.consentRow}>
                <Text style={styles.consentLabel}>{t('consent.essential') || 'Zorunlu Çerezler'}</Text>
                <View style={[styles.toggle, styles.toggleActive]}>
                  <Text style={styles.toggleText}>✓</Text>
                </View>
              </View>
              {expandedConsent === 'essential' && (
                <Text style={styles.consentDesc}>{t('consent.essentialDesc')}</Text>
              )}
            </TouchableOpacity>

            {/* Analytics */}
            <TouchableOpacity style={styles.consentItem} onPress={() => setExpandedConsent(expandedConsent === 'analytics' ? null : 'analytics')}>
              <View style={styles.consentRow}>
                <Text style={styles.consentLabel}>{t('consent.analytics') || 'Analitik'}</Text>
                <TouchableOpacity
                  style={[styles.toggle, preferences.analytics && styles.toggleActive]}
                  onPress={(e) => { e.stopPropagation(); handleToggleConsent('analytics'); }}
                  disabled={isChild}
                >
                  <Text style={styles.toggleText}>{preferences.analytics ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
              {expandedConsent === 'analytics' && (
                <Text style={styles.consentDesc}>{t('consent.analyticsDesc')}</Text>
              )}
            </TouchableOpacity>

            {/* Marketing */}
            <TouchableOpacity style={styles.consentItem} onPress={() => setExpandedConsent(expandedConsent === 'marketing' ? null : 'marketing')}>
              <View style={styles.consentRow}>
                <Text style={styles.consentLabel}>{t('consent.marketing') || 'Pazarlama'}</Text>
                <TouchableOpacity
                  style={[styles.toggle, preferences.marketing && styles.toggleActive]}
                  onPress={(e) => { e.stopPropagation(); handleToggleConsent('marketing'); }}
                  disabled={isChild}
                >
                  <Text style={styles.toggleText}>{preferences.marketing ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
              {expandedConsent === 'marketing' && (
                <Text style={styles.consentDesc}>{t('consent.marketingDesc')}</Text>
              )}
            </TouchableOpacity>

            {/* Personalized Ads */}
            <TouchableOpacity style={styles.consentItem} onPress={() => setExpandedConsent(expandedConsent === 'personalizedAds' ? null : 'personalizedAds')}>
              <View style={styles.consentRow}>
                <Text style={styles.consentLabel}>{t('consent.personalizedAds') || 'Kişisel Reklamlar'}</Text>
                <TouchableOpacity
                  style={[styles.toggle, preferences.personalizedAds && styles.toggleActive]}
                  onPress={(e) => { e.stopPropagation(); handleToggleConsent('personalizedAds'); }}
                  disabled={isChild}
                >
                  <Text style={styles.toggleText}>{preferences.personalizedAds ? '✓' : ''}</Text>
                </TouchableOpacity>
              </View>
              {expandedConsent === 'personalizedAds' && (
                <Text style={styles.consentDesc}>{t('consent.personalizedAdsDesc')}</Text>
              )}
            </TouchableOpacity>

            {/* Data Transfer (TR only) */}
            {region === 'TR' && (
              <TouchableOpacity style={styles.consentItem} onPress={() => setExpandedConsent(expandedConsent === 'dataTransfer' ? null : 'dataTransfer')}>
                <View style={styles.consentRow}>
                  <Text style={styles.consentLabel}>{t('consent.dataTransfer') || 'Veri Aktarımı'}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, preferences.dataTransfer && styles.toggleActive]}
                    onPress={(e) => { e.stopPropagation(); handleToggleConsent('dataTransfer'); }}
                  >
                    <Text style={styles.toggleText}>{preferences.dataTransfer ? '✓' : ''}</Text>
                  </TouchableOpacity>
                </View>
                {expandedConsent === 'dataTransfer' && (
                  <Text style={styles.consentDesc}>{t('consent.dataTransferDesc')}</Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectAll}>
                <Text style={styles.rejectText}>{t('consent.rejectAll') || 'Reddet'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptAll} disabled={isChild}>
                <Text style={styles.acceptText}>{t('consent.acceptAll') || 'Kabul Et'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveConsent}>
            <LinearGradient colors={[BRAND.emerald, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSaveGradient}>
              <Text style={styles.modalSaveText}>{t('common.save') || 'Kaydet'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLegalModal = () => (
    <Modal
      visible={showLegalModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowLegalModal(false)}
    >
      <SafeAreaView style={styles.legalModalContainer}>
        <LinearGradient colors={AUTH_GRADIENT.colors} style={styles.legalGradient} start={AUTH_GRADIENT.start} end={AUTH_GRADIENT.end}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalHeaderTitle}>{t('legal.title') || 'Yasal Belgeler'}</Text>
            <TouchableOpacity onPress={() => setShowLegalModal(false)}>
              <Text style={styles.legalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.legalScroll} showsVerticalScrollIndicator={false}>
            {LEGAL_DOCUMENTS.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.legalDocItem}
                onPress={() => setSelectedLegalDoc(selectedLegalDoc === doc.id ? null : doc.id)}
                activeOpacity={0.8}
              >
                <View style={styles.legalDocHeader}>
                  <Text style={styles.legalDocIcon}>{doc.icon}</Text>
                  <Text style={styles.legalDocTitle}>{t(doc.titleKey) || doc.titleKey}</Text>
                  <Text style={styles.legalDocArrow}>{selectedLegalDoc === doc.id ? '▼' : '▶'}</Text>
                </View>
                {selectedLegalDoc === doc.id && (
                  <View style={styles.legalDocContent}>
                    <ScrollView style={styles.legalContentScroll} nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                      <Text style={styles.legalDocText}>
                        {getLegalContent(doc.id, t)?.content || t(`legal.${doc.id}.fullContent`) || 'İçerik yükleniyor...'}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.legalAcceptButton} onPress={() => { setLegalAccepted(true); setShowLegalModal(false); }}>
            <LinearGradient colors={[BRAND.emerald, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.legalAcceptGradient}>
              <Text style={styles.legalAcceptText}>{t('legal.accept') || 'Kabul Ediyorum'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );

  const renderScrollablePicker = (
    items: number[],
    selectedValue: number | null,
    onSelect: (val: number) => void,
    formatter?: (val: number) => string
  ) => {
    return (
      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <TouchableOpacity 
              key={item} 
              onPress={async () => {
                // Ses ve haptic feedback
                await playTickSound();
                onSelect(item);
              }} 
              style={[styles.pickerItem, isSelected && styles.pickerItemSelected]} 
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                {formatter ? formatter(item) : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={AUTH_GRADIENT.colors} style={styles.container} start={AUTH_GRADIENT.start} end={AUTH_GRADIENT.end}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.emerald} />
            <Text style={styles.loadingText}>{t('common.loading') || 'Yükleniyor...'}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={AUTH_GRADIENT.colors} style={styles.container} start={AUTH_GRADIENT.start} end={AUTH_GRADIENT.end}>
        <View style={styles.content}>
          {Platform.OS === 'web' ? (
            <img 
              src="/TacticIQ.svg" 
              alt="TacticIQ" 
              style={{ width: 250, height: 250 }} 
            />
          ) : (
            <Image 
              source={logoImage} 
              style={{ width: 250, height: 250 }} 
              resizeMode="contain" 
            />
          )}
          
          <Text style={styles.title}>{t('ageGate.title') || 'Yaş Doğrulama'}</Text>
          <Text style={styles.subtitle}>{t('ageGate.subtitle') || 'Doğum tarihinizi seçin'}</Text>

          <View style={styles.pickersContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>{t('ageGate.year') || 'Yıl'}</Text>
              <View style={styles.pickerWrapper}>
                {renderScrollablePicker(YEARS, selectedYear, setSelectedYear)}
              </View>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>{t('ageGate.month') || 'Ay'}</Text>
              <View style={styles.pickerWrapper}>
                {renderScrollablePicker(MONTHS, selectedMonth, setSelectedMonth, (m) => m.toString().padStart(2, '0'))}
              </View>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>{t('ageGate.day') || 'Gün'}</Text>
              <View style={styles.pickerWrapper}>
                {renderScrollablePicker(DAYS, selectedDay, setSelectedDay, (d) => d.toString().padStart(2, '0'))}
              </View>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.linkButton} onPress={() => setShowLegalModal(true)}>
              <Text style={styles.linkButtonText}>📋 {t('legal.title') || 'Yasal Belgeler'}</Text>
              {legalAccepted && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => setShowConsentModal(true)}>
              <Text style={styles.linkButtonText}>🔒 {t('consent.title') || 'Gizlilik'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} disabled={saving || !legalAccepted}>
            <LinearGradient colors={[BRAND.emerald, '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueGradient}>
              {saving ? (
                <ActivityIndicator size="small" color={BRAND.white} />
              ) : (
                <Text style={styles.continueText}>{t('common.next') || 'Devam Et'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {renderConsentModal()}
        {renderLegalModal()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AUTH_GRADIENT.colors[0] },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xs, justifyContent: 'flex-start', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: BRAND.white, fontSize: 16, marginTop: SPACING.sm },
  // Logo artık inline style ile 250px
  title: { ...TYPOGRAPHY.h2, fontSize: 24, fontWeight: '700', color: BRAND.white, textAlign: 'center', marginBottom: SPACING.xs },
  subtitle: { ...TYPOGRAPHY.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: SPACING.lg },
  
  pickersContainer: { flexDirection: 'row', gap: SPACING.sm, height: 140, marginBottom: SPACING.lg },
  pickerColumn: { flex: 1 },
  pickerLabel: { fontSize: 12, color: BRAND.white, textAlign: 'center', marginBottom: SPACING.xs, fontWeight: '600' },
  pickerWrapper: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  pickerScroll: { flex: 1 },
  pickerItem: { paddingVertical: 10, alignItems: 'center' },
  pickerItemSelected: { backgroundColor: 'rgba(5,150,105,0.25)' },
  pickerItemText: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  pickerItemTextSelected: { color: BRAND.emerald, fontWeight: '700', fontSize: 17 },
  
  buttonsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  linkButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs },
  linkButtonText: { fontSize: 13, fontWeight: '600', color: BRAND.white },
  checkmark: { fontSize: 16, color: BRAND.emerald, fontWeight: '700' },
  
  continueButton: { borderRadius: 14, overflow: 'hidden' },
  continueGradient: { paddingVertical: SPACING.md, alignItems: 'center', minHeight: 52 },
  continueText: { fontSize: 16, fontWeight: '700', color: BRAND.white },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: BRAND.white },
  modalClose: { fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },
  modalContent: { maxHeight: 400, paddingHorizontal: SPACING.lg },
  consentItem: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: SPACING.md, minHeight: 56, marginVertical: SPACING.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  consentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consentLabel: { fontSize: 14, fontWeight: '600', color: BRAND.white, flex: 1 },
  consentDesc: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: SPACING.sm, lineHeight: 16 },
  toggle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  toggleActive: { backgroundColor: BRAND.emerald, borderColor: BRAND.emerald },
  toggleText: { color: BRAND.white, fontSize: 16, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.lg },
  rejectBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  rejectText: { fontSize: 13, fontWeight: '600', color: BRAND.white },
  acceptBtn: { flex: 1, backgroundColor: 'rgba(5,150,105,0.2)', borderRadius: 12, paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: BRAND.emerald },
  acceptText: { fontSize: 13, fontWeight: '600', color: BRAND.white },
  modalSaveButton: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: 14, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  modalSaveText: { fontSize: 16, fontWeight: '700', color: BRAND.white },
  
  legalModalContainer: { flex: 1, backgroundColor: AUTH_GRADIENT.colors[0] },
  legalGradient: { flex: 1 },
  legalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  legalHeaderTitle: { fontSize: 22, fontWeight: '700', color: BRAND.white },
  legalClose: { fontSize: 32, color: BRAND.white, fontWeight: '300' },
  legalScroll: { flex: 1, paddingHorizontal: SPACING.lg },
  legalDocItem: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: SPACING.md, minHeight: 56, marginVertical: SPACING.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  legalDocHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  legalDocIcon: { fontSize: 22 },
  legalDocTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: BRAND.white },
  legalDocArrow: { fontSize: 14, color: BRAND.emerald },
  legalDocContent: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', maxHeight: 200 },
  legalContentScroll: { maxHeight: 180 },
  legalDocText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  legalAcceptButton: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.lg, borderRadius: 14, overflow: 'hidden' },
  legalAcceptGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  legalAcceptText: { fontSize: 16, fontWeight: '700', color: BRAND.white },
});
