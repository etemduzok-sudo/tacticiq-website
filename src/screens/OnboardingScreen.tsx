/**
 * TacticIQ - Premium Onboarding Screen
 * 9 dil, premium tasarım, büyük butonlar
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlagDE, FlagGB, FlagES, FlagFR, FlagIT, FlagTR, FlagAR, FlagCN, FlagRU, FlagIN } from '../components/flags';
import { useTranslation } from '../hooks/useTranslation';
import { changeLanguage as changeI18nLanguage } from '../i18n';
import { getLegalContent, getLegalContentSync } from '../data/legalContent';
import { getCurrentLanguage } from '../i18n';
import {
  ConsentPreferences,
  detectRegion,
  getDefaultConsentPreferences,
  saveConsentPreferences,
  applyConsentPreferences,
} from '../services/consentService';
import { Ionicons } from '@expo/vector-icons';
import {
  WEBSITE_BRAND_COLORS,
  WEBSITE_DARK_COLORS,
  WEBSITE_BORDER_RADIUS,
  WEBSITE_SPACING,
  WEBSITE_ICON_SIZES,
  WEBSITE_TYPOGRAPHY,
} from '../config/WebsiteDesignSystem';
import { AUTH_LOGO_SIZE, AUTH_LOGO_MARGIN_TOP, AUTH_LOGO_MARGIN_BOTTOM } from '../constants/logoConstants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

type OnboardingStep = 'language' | 'age' | 'legal';

// Yerel tarih (indirildiği bölgedeki tarih)
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1; // 1-12 formatı
const CURRENT_DAY = TODAY.getDate();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

const MONTHS_BY_LANG: Record<string, string[]> = {
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
};

const languages = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिन्दी' },
];

// Logo sabitleri logoConstants.ts'den import ediliyor (AUTH_LOGO_SIZE, AUTH_LOGO_MARGIN_TOP, AUTH_LOGO_MARGIN_BOTTOM)

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t, i18n } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');
  
  // Varsayılan: Bugünkü yerel tarih (yaş 0 olarak başlar)
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedDay, setSelectedDay] = useState(CURRENT_DAY);
  const [isMinor, setIsMinor] = useState(true); // Bugünkü tarih = 0 yaş = minor
  
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [region, setRegion] = useState<ConsentPreferences['region']>('OTHER');
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: true, // Ön tanımlı açık
    marketing: true, // Ön tanımlı açık
    personalizedAds: true, // Ön tanımlı açık
    dataTransfer: true, // Ön tanımlı açık
    timestamp: new Date().toISOString(),
  });
  
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'year' | 'month' | 'day' | null>(null);
  const [loading, setLoading] = useState(false);
  const languageSelectingRef = useRef(false);

  // Animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // 🌍 Dönen dil subtitle animasyonu
  const [subtitleLangIndex, setSubtitleLangIndex] = useState(0);
  const subtitleFade = useRef(new Animated.Value(1)).current;
  
  // Tüm dillerde subtitle metinleri (bayraklar kaldırıldı - altta zaten var)
  const subtitleTranslations = [
    { lang: 'tr', text: 'Lütfen dilinizi seçin' },
    { lang: 'en', text: 'Please select your language' },
    { lang: 'de', text: 'Bitte wählen Sie Ihre Sprache' },
    { lang: 'es', text: 'Por favor seleccione su idioma' },
    { lang: 'fr', text: 'Veuillez sélectionner votre langue' },
    { lang: 'it', text: 'Seleziona la tua lingua' },
    { lang: 'ar', text: 'يرجى اختيار لغتك' },
    { lang: 'zh', text: '请选择您的语言' },
    { lang: 'ru', text: 'Пожалуйста, выберите ваш язык' },
    { lang: 'hi', text: 'कृपया अपनी भाषा चुनें' },
  ];
  
  // Subtitle döngüsü efekti
  useEffect(() => {
    if (currentStep !== 'language') return;
    
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(subtitleFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
        easing: Easing.out(Easing.ease),
      }).start(() => {
        // Sonraki dil
        setSubtitleLangIndex(prev => (prev + 1) % subtitleTranslations.length);
        
        // Fade in
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
          easing: Easing.in(Easing.ease),
        }).start();
      });
    }, 2500); // 2.5 saniyede bir değiş
    
    return () => clearInterval(interval);
  }, [currentStep]);

  // Sayfa geçiş animasyonu
  const animateTransition = (direction: 'forward' | 'backward', callback: () => void) => {
    const slideValue = direction === 'forward' ? -30 : 30;
    
    // Fade out + slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
      Animated.timing(slideAnim, {
        toValue: slideValue,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'forward' ? 30 : -30);
      
      // Fade in + slide back
      Animated.parallel([
        Animated.timing(fadeAnim, {
        toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
        Animated.timing(slideAnim, {
        toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }),
    ]).start();
    });
  };

  useEffect(() => {
    if (currentStep === 'legal') {
      initializeConsent();
    }
  }, [currentStep]);

  const initializeConsent = async () => {
    try {
      const detectedRegion = await detectRegion();
      setRegion(detectedRegion);
      // Ön tanımlı olarak tüm çerezler açık (essential zaten true, diğerleri de true)
      const defaultPrefs: ConsentPreferences = {
        essential: true,
        analytics: true,
        marketing: true,
        personalizedAds: true,
        dataTransfer: true,
        timestamp: new Date().toISOString(),
      };
      if (isMinor) {
        // 18 yaş altı için bazı çerezler kapalı
        setPreferences({ ...defaultPrefs, analytics: false, marketing: false, personalizedAds: false, dataTransfer: false });
      } else {
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error initializing consent:', error);
    }
  };

  const handleLanguageSelect = (code: string) => {
    if (languageSelectingRef.current) return;
    languageSelectingRef.current = true;
    setSelectedLanguage(code);
    setCurrentStep('age');
    (async () => {
      try {
        await changeI18nLanguage(code);
        await AsyncStorage.setItem('@user_language', code);
        await AsyncStorage.setItem('tacticiq-language', code);
      } catch (error) {
        console.error('Language change error:', error);
      } finally {
        languageSelectingRef.current = false;
      }
    })();
  };

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

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

  const handleAgeVerification = async () => {
    const age = calculateAge();
    const minor = age < 18;
    setIsMinor(minor);
    await AsyncStorage.setItem('@user_age_verified', 'true');
    await AsyncStorage.setItem('@user_is_minor', minor ? 'true' : 'false');
    
    // Animasyonlu geçiş
    animateTransition('forward', () => {
      setCurrentStep('legal');
    });
  };

  const handleOpenLegalDoc = (docType: string) => {
    setSelectedLegalDoc(docType);
    setShowLegalModal(true);
  };

  const handleComplete = async () => {
    if (!legalAccepted) {
      Alert.alert(t('consent.error') || 'Hata', t('consent.mustAccept') || 'Devam etmek için yasal belgeleri kabul etmelisiniz');
      return;
    }
    setLoading(true);
    try {
      // Include region in preferences
      await saveConsentPreferences({ ...preferences, region });
      await applyConsentPreferences(preferences);
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      setTimeout(() => onComplete(), 300);
    } catch (error) {
      console.error('Error saving consent:', error);
      Alert.alert(t('consent.error') || 'Hata', t('consent.saveFailed') || 'Kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'age') {
      animateTransition('backward', () => {
        setCurrentStep('language');
      });
    } else if (currentStep === 'legal') {
      animateTransition('backward', () => {
        setCurrentStep('age');
      });
    }
  };

  const FlagComponent = ({ code }: { code: string }) => {
    const size = 28; // Kompakt kartlar için küçültüldü
    switch (code) {
      case 'de': return <FlagDE size={size} />;
      case 'en': return <FlagGB size={size} />;
      case 'es': return <FlagES size={size} />;
      case 'fr': return <FlagFR size={size} />;
      case 'it': return <FlagIT size={size} />;
      case 'tr': return <FlagTR size={size} />;
      case 'ar': return <FlagAR size={size} />;
      case 'zh': return <FlagCN size={size} />;
      case 'ru': return <FlagRU size={size} />;
      case 'hi': return <FlagIN size={size} />;
      default: return null;
    }
  };

  const getMonthLabel = (monthIndex: number) => {
    const months = MONTHS_BY_LANG[selectedLanguage] || MONTHS_BY_LANG['en'];
    return months[monthIndex] || '';
  };

  const getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      'languageSelection.title': {
        tr: 'Dil Seçimi', en: 'Language Selection', de: 'Sprachauswahl', es: 'Selección de idioma',
        fr: 'Sélection de la langue', it: 'Selezione della lingua', ar: 'اختيار اللغة', zh: '语言选择',
        ru: 'Выбор языка', hi: 'भाषा चयन'
      },
      'languageSelection.subtitle': {
        tr: 'Lütfen dilinizi seçin', en: 'Please select your language', de: 'Bitte wählen Sie Ihre Sprache',
        es: 'Por favor seleccione su idioma', fr: 'Veuillez sélectionner votre langue', it: 'Seleziona la tua lingua',
        ar: 'يرجى اختيار لغتك', zh: '请选择您的语言', ru: 'Пожалуйста, выберите ваш язык', hi: 'कृपया अपनी भाषा चुनें'
      },
      'ageGate.title': {
        tr: 'Yaş Doğrulama', en: 'Age Verification', de: 'Altersverifikation', es: 'Verificación de edad',
        fr: "Vérification de l'âge", it: "Verifica dell'età", ar: 'التحقق من العمر', zh: '年龄验证',
        ru: 'Проверка возраста', hi: 'आयु सत्यापन'
      },
      'ageGate.subtitle': {
        tr: 'Doğum tarihinizi seçin', en: 'Select your date of birth', de: 'Wählen Sie Ihr Geburtsdatum',
        es: 'Seleccione su fecha de nacimiento', fr: 'Sélectionnez votre date de naissance', it: 'Seleziona la tua data di nascita',
        ar: 'اختر تاريخ ميلادك', zh: '选择您的出生日期', ru: 'Выберите дату рождения', hi: 'अपनी जन्म तिथि चुनें'
      },
      'ageGate.day': { tr: 'Gün', en: 'Day', de: 'Tag', es: 'Día', fr: 'Jour', it: 'Giorno', ar: 'اليوم', zh: '日', ru: 'День', hi: 'दिन' },
      'ageGate.month': { tr: 'Ay', en: 'Month', de: 'Monat', es: 'Mes', fr: 'Mois', it: 'Mese', ar: 'الشهر', zh: '月', ru: 'Месяц', hi: 'महीना' },
      'ageGate.year': { tr: 'Yıl', en: 'Year', de: 'Jahr', es: 'Año', fr: 'Année', it: 'Anno', ar: 'السنة', zh: '年', ru: 'Год', hi: 'वर्ष' },
      'ageGate.yearsOld': { tr: 'yaşında', en: 'years old', de: 'Jahre alt', es: 'años', fr: 'ans', it: 'anni', ar: 'سنة', zh: '岁', ru: 'лет', hi: 'वर्ष' },
      'ageGate.selectDay': { tr: 'Gün Seçin', en: 'Select Day', de: 'Tag wählen', es: 'Seleccionar día', fr: 'Sélectionner le jour', it: 'Seleziona giorno', ar: 'اختر اليوم', zh: '选择日', ru: 'Выберите день', hi: 'दिन चुनें' },
      'ageGate.selectMonth': { tr: 'Ay Seçin', en: 'Select Month', de: 'Monat wählen', es: 'Seleccionar mes', fr: 'Sélectionner le mois', it: 'Seleziona mese', ar: 'اختر الشهر', zh: '选择月', ru: 'Выберите месяц', hi: 'महीना चुनें' },
      'ageGate.selectYear': { tr: 'Yıl Seçin', en: 'Select Year', de: 'Jahr wählen', es: 'Seleccionar año', fr: "Sélectionner l'année", it: 'Seleziona anno', ar: 'اختر السنة', zh: '选择年', ru: 'Выберите год', hi: 'वर्ष चुनें' },
      'legal.title': { tr: 'Yasal Belgeler', en: 'Legal Documents', de: 'Rechtliche Dokumente', es: 'Documentos legales', fr: 'Documents légaux', it: 'Documenti legali', ar: 'المستندات القانونية', zh: '法律文件', ru: 'Правовые документы', hi: 'कानूनी दस्तावेज़' },
      'legal.subtitle': { tr: 'Lütfen belgeleri inceleyin', en: 'Please review the documents', de: 'Bitte überprüfen Sie die Dokumente', es: 'Por favor revise los documentos', fr: 'Veuillez lire les documents', it: 'Si prega di leggere i documenti', ar: 'يرجى مراجعة المستندات', zh: '请阅读文件', ru: 'Пожалуйста, ознакомьтесь', hi: 'कृपया दस्तावेज़ देखें' },
      'legal.iAccept': { tr: 'Okudum ve kabul ediyorum', en: 'I have read and accept', de: 'Ich habe gelesen und akzeptiere', es: 'He leído y acepto', fr: "J'ai lu et j'accepte", it: 'Ho letto e accetto', ar: 'قرأت وأوافق', zh: '我已阅读并接受', ru: 'Я прочитал и принимаю', hi: 'मैंने पढ़ा और स्वीकार करता हूं' },
      'legal.minorNotice': { tr: '18 yaş altı için ebeveyn onayı gerekli', en: 'Parental consent required for under 18', de: 'Elterliche Zustimmung für unter 18', es: 'Consentimiento parental requerido para menores de 18', fr: 'Consentement parental requis pour les moins de 18 ans', it: 'Consenso parentale richiesto per i minori di 18 anni', ar: 'موافقة الوالدين مطلوبة لمن هم دون 18', zh: '18岁以下需要父母同意', ru: 'Требуется согласие родителей для лиц младше 18 лет', hi: '18 वर्ष से कम आयु के लिए माता-पिता की सहमति आवश्यक' },
      'legal.terms.title': { tr: 'Kullanım Koşulları', en: 'Terms of Service', de: 'Nutzungsbedingungen', es: 'Términos de servicio', fr: "Conditions d'utilisation", it: 'Termini di servizio', ar: 'شروط الخدمة', zh: '服务条款', ru: 'Условия использования', hi: 'सेवा की शर्तें' },
      'legal.privacy.title': { tr: 'Gizlilik Politikası', en: 'Privacy Policy', de: 'Datenschutzrichtlinie', es: 'Política de privacidad', fr: 'Politique de confidentialité', it: 'Informativa sulla privacy', ar: 'سياسة الخصوصية', zh: '隐私政策', ru: 'Политика конфиденциальности', hi: 'गोपनीयता नीति' },
      'legal.cookies.title': { tr: 'Çerez Politikası', en: 'Cookie Policy', de: 'Cookie-Richtlinie', es: 'Política de cookies', fr: 'Politique des cookies', it: 'Politica sui cookie', ar: 'سياسة ملفات تعريف الارتباط', zh: 'Cookie政策', ru: 'Политика Cookie', hi: 'कुकी नीति' },
      'legal.kvkk.title': { tr: 'KVKK Aydınlatma', en: 'KVKK Disclosure', de: 'KVKK-Offenlegung', es: 'Divulgación KVKK', fr: 'Divulgation KVKK', it: 'Informativa KVKK', ar: 'إفصاح KVKK', zh: 'KVKK披露', ru: 'Раскрытие KVKK', hi: 'KVKK प्रकटीकरण' },
      'legal.consent.title': { tr: 'Açık Rıza Metni', en: 'Consent Form', de: 'Einwilligungsformular', es: 'Formulario de consentimiento', fr: 'Formulaire de consentement', it: 'Modulo di consenso', ar: 'نموذج الموافقة', zh: '同意书', ru: 'Форма согласия', hi: 'सहमति फॉर्म' },
      'legal.sales.title': { tr: 'Mesafeli Satış Sözleşmesi', en: 'Distance Sales Agreement', de: 'Fernabsatzvertrag', es: 'Contrato de venta a distancia', fr: 'Contrat de vente à distance', it: 'Contratto di vendita a distanza', ar: 'اتفاقية البيع عن بعد', zh: '远程销售协议', ru: 'Договор дистанционной продажи', hi: 'दूरस्थ बिक्री समझौता' },
      'legal.copyright.title': { tr: 'Telif Hakkı Bildirimi', en: 'Copyright Notice', de: 'Urheberrechtshinweis', es: 'Aviso de derechos de autor', fr: 'Avis de droit d\'auteur', it: 'Avviso di copyright', ar: 'إشعار حقوق النشر', zh: '版权声明', ru: 'Уведомление об авторских правах', hi: 'कॉपीराइट नोटिस' },
      'common.continue': { tr: 'Devam Et', en: 'Continue', de: 'Weiter', es: 'Continuar', fr: 'Continuer', it: 'Continua', ar: 'متابعة', zh: '继续', ru: 'Продолжить', hi: 'जारी रखें' },
      'common.getStarted': { tr: 'Başla', en: 'Get Started', de: 'Loslegen', es: 'Empezar', fr: 'Commencer', it: 'Inizia', ar: 'ابدأ', zh: '开始', ru: 'Начать', hi: 'शुरू करें' },
      'common.back': { tr: 'Geri', en: 'Back', de: 'Zurück', es: 'Atrás', fr: 'Retour', it: 'Indietro', ar: 'رجوع', zh: '返回', ru: 'Назад', hi: 'वापस' },
      'common.close': { tr: 'Kapat', en: 'Close', de: 'Schließen', es: 'Cerrar', fr: 'Fermer', it: 'Chiudi', ar: 'إغلاق', zh: '关闭', ru: 'Закрыть', hi: 'बंद करें' },
      'consent.error': { tr: 'Hata', en: 'Error', de: 'Fehler', es: 'Error', fr: 'Erreur', it: 'Errore', ar: 'خطأ', zh: '错误', ru: 'Ошибка', hi: 'त्रुटि' },
      'consent.mustAccept': { tr: 'Devam etmek için yasal belgeleri kabul etmelisiniz', en: 'You must accept the legal documents to continue', de: 'Sie müssen die Dokumente akzeptieren', es: 'Debe aceptar los documentos para continuar', fr: 'Vous devez accepter les documents', it: 'Devi accettare i documenti', ar: 'يجب قبول المستندات للمتابعة', zh: '您必须接受文件才能继续', ru: 'Вы должны принять документы', hi: 'जारी रखने के लिए आपको दस्तावेज़ स्वीकार करने होंगे' },
    };
    return translations[key]?.[selectedLanguage] || translations[key]?.['en'] || t(key) || key;
  };

  // ===== LANGUAGE STEP - PREMIUM DESIGN (No Scroll) =====
  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      {/* 🌍 Animasyonlu dönen subtitle - tüm dillerde */}
      <Animated.View style={{ 
        opacity: subtitleFade,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 0,
      }}>
        <Text style={[styles.stepSubtitle, { fontSize: 15, fontWeight: '600', marginBottom: 0 }]}>{subtitleTranslations[subtitleLangIndex].text}</Text>
      </Animated.View>

      {/* 2 sütun 5 satır grid - 10 dil için - NO SCROLL */}
      <View style={styles.languageGridPremium}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.languageCardPremium}
            onPress={() => handleLanguageSelect(lang.code)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(15, 42, 36, 0.95)', 'rgba(15, 42, 36, 0.95)']}
              style={styles.languageCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.flagWrapperGrid}>
                <FlagComponent code={lang.code} />
              </View>
              <Text style={styles.languageNameGrid}>{lang.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ===== AGE STEP =====
  const renderAgeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{getTranslation('ageGate.title')}</Text>
      <Text style={styles.stepSubtitle}>{getTranslation('ageGate.subtitle')}</Text>

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateCard} onPress={() => setShowDatePicker('day')}>
          <Text style={styles.dateLabel}>{getTranslation('ageGate.day')}</Text>
          <Text style={styles.dateValue}>{selectedDay}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.dateCard, styles.dateCardWide]} onPress={() => setShowDatePicker('month')}>
          <Text style={styles.dateLabel}>{getTranslation('ageGate.month')}</Text>
          <Text style={styles.dateValue}>{getMonthLabel(selectedMonth - 1)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateCard} onPress={() => setShowDatePicker('year')}>
          <Text style={styles.dateLabel}>{getTranslation('ageGate.year')}</Text>
          <Text style={styles.dateValue}>{selectedYear}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ageDisplayBox}>
        <Text style={styles.ageNumber}>{calculateAge()}</Text>
        <Text style={styles.ageUnit}>{getTranslation('ageGate.yearsOld')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, calculateAge() < 18 && styles.primaryBtnDisabled]} 
        onPress={handleAgeVerification}
        disabled={calculateAge() < 18}
      >
        <LinearGradient
          colors={calculateAge() < 18 ? ['#444', '#333'] : [WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]} 
          style={styles.primaryBtnGradient} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.primaryBtnText}>{getTranslation('common.continue')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ===== LEGAL STEP =====
  const renderLegalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{getTranslation('legal.title')}</Text>
      <Text style={styles.stepSubtitle}>{getTranslation('legal.subtitle')}</Text>

      {/* Scroll edilebilir yasal döküman listesi */}
      <ScrollView style={styles.legalListScroll} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
      <View style={styles.legalList}>
          {/* Kullanım Koşulları */}
        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('terms')}>
            <Text style={styles.legalIcon}>📋</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.terms.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
        </TouchableOpacity>

          {/* Gizlilik Politikası */}
        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('privacy')}>
            <Text style={styles.legalIcon}>🔒</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.privacy.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
        </TouchableOpacity>

          {/* Çerez Politikası */}
          <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('cookies')}>
            <Text style={styles.legalIcon}>🍪</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.cookies.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
        </TouchableOpacity>

          {/* KVKK */}
        <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('kvkk')}>
            <Text style={styles.legalIcon}>⚖️</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.kvkk.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>

          {/* Açık Rıza Metni */}
          <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('consent')}>
            <Text style={styles.legalIcon}>✅</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.consent.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>

          {/* Mesafeli Satış Sözleşmesi */}
          <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('sales')}>
            <Text style={styles.legalIcon}>💳</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.sales.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
          </TouchableOpacity>

          {/* Telif Hakkı */}
          <TouchableOpacity style={styles.legalItem} onPress={() => handleOpenLegalDoc('copyright')}>
            <Text style={styles.legalIcon}>©️</Text>
            <Text style={styles.legalTitle}>{getTranslation('legal.copyright.title')}</Text>
            <Text style={styles.legalArrow}>›</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      <TouchableOpacity style={styles.checkboxRow} onPress={() => setLegalAccepted(!legalAccepted)}>
        <View style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}>
          {legalAccepted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>{getTranslation('legal.iAccept')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, !legalAccepted && styles.primaryBtnDisabled]} 
        onPress={handleComplete}
        disabled={!legalAccepted || loading}
      >
        <LinearGradient
          colors={legalAccepted ? [WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary] : ['#444', '#333']} 
          style={styles.primaryBtnGradient} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
        >
          {loading ? <ActivityIndicator color={WEBSITE_BRAND_COLORS.white} size="small" /> : <Text style={styles.primaryBtnText}>{getTranslation('common.getStarted')}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ===== DATE PICKER MODAL =====
  const renderDatePickerModal = () => {
    let items: { value: number; label: string }[] = [];
    let title = '';
    let onSelect: (value: number) => void = () => {};

    if (showDatePicker === 'year') {
      items = YEARS.map(y => ({ value: y, label: String(y) }));
      title = getTranslation('ageGate.selectYear');
      onSelect = (v) => { setSelectedYear(v); setShowDatePicker(null); };
    } else if (showDatePicker === 'month') {
      items = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthLabel(i) }));
      title = getTranslation('ageGate.selectMonth');
      onSelect = (v) => { setSelectedMonth(v); setShowDatePicker(null); };
    } else if (showDatePicker === 'day') {
      const daysCount = getDaysInMonth(selectedYear, selectedMonth);
      items = Array.from({ length: daysCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
      title = getTranslation('ageGate.selectDay');
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

  // ===== LEGAL MODAL =====
  const renderLegalModal = () => {
    const language = getCurrentLanguage();
    const legalContent = selectedLegalDoc ? getLegalContentSync(selectedLegalDoc, t, language) : null;
    const isCookiesModal = selectedLegalDoc === 'cookies';
    
    const toggleCookiePreference = (key: keyof ConsentPreferences) => {
      if (key === 'essential') return; // Zorunlu çerezler değiştirilemez
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    return (
    <Modal visible={showLegalModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.legalModal}>
          <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>{legalContent?.title || ''}</Text>
            <TouchableOpacity onPress={() => setShowLegalModal(false)}>
              <Text style={styles.legalModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {isCookiesModal ? (
            <ScrollView style={styles.legalModalScroll} showsVerticalScrollIndicator={true}>
              {/* Çerez içeriği */}
              <Text style={styles.legalModalContent}>{legalContent?.content || ''}</Text>
              
              {/* Çerez türleri için toggle butonları */}
              <View style={styles.cookieControls}>
                  <Text style={styles.cookieControlsTitle}>Çerez Tercihleri</Text>
                  
                  {/* Zorunlu Çerezler */}
                  <View style={styles.cookieToggleRow}>
                    <View style={styles.cookieToggleInfo}>
                      <Text style={styles.cookieToggleLabel}>{getTranslation('cookies.essential') || 'Zorunlu Çerezler'}</Text>
                      <Text style={styles.cookieToggleDesc}>{getTranslation('cookies.essentialDesc') || 'Uygulamanın çalışması için gerekli'}</Text>
          </View>
                    <View style={[styles.cookieToggleSwitch, styles.cookieToggleSwitchActive]}>
                      <Text style={styles.cookieToggleSwitchText}>✓</Text>
              </View>
            </View>

                  {/* Analitik Çerezler */}
                  <View style={styles.cookieToggleRow}>
                    <View style={styles.cookieToggleInfo}>
                      <Text style={styles.cookieToggleLabel}>{getTranslation('cookies.analytics') || 'Analitik Çerezler'}</Text>
                      <Text style={styles.cookieToggleDesc}>{getTranslation('cookies.analyticsDesc') || 'Performansı iyileştirmemize yardımcı olur'}</Text>
                </View>
                    <TouchableOpacity 
                      style={[styles.cookieToggleSwitch, preferences.analytics && styles.cookieToggleSwitchActive]}
                      onPress={() => toggleCookiePreference('analytics')}
                    >
                      <Text style={styles.cookieToggleSwitchText}>{preferences.analytics ? '✓' : ''}</Text>
              </TouchableOpacity>
                  </View>

                  {/* Pazarlama Çerezleri */}
                  <View style={styles.cookieToggleRow}>
                    <View style={styles.cookieToggleInfo}>
                      <Text style={styles.cookieToggleLabel}>{getTranslation('cookies.marketing') || 'Pazarlama Çerezleri'}</Text>
                      <Text style={styles.cookieToggleDesc}>{getTranslation('cookies.marketingDesc') || 'Kişiselleştirilmiş içerik sunar'}</Text>
                </View>
          <TouchableOpacity
                      style={[styles.cookieToggleSwitch, preferences.marketing && styles.cookieToggleSwitchActive]}
                      onPress={() => toggleCookiePreference('marketing')}
          >
                      <Text style={styles.cookieToggleSwitchText}>{preferences.marketing ? '✓' : ''}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.legalModalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.legalModalContent}>{legalContent?.content || ''}</Text>
            </ScrollView>
          )}
            <TouchableOpacity style={styles.legalModalBtn} onPress={() => setShowLegalModal(false)}>
              <Text style={styles.legalModalBtnText}>{getTranslation('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  };

  // ===== MAIN RENDER =====
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0a1612', '#0F2A24', '#0a1612']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <View style={styles.gridPattern} />
        
        <View style={styles.mainContent}>
          {/* Back Button - Sol üst köşe */}
          {currentStep !== 'language' && (
            <TouchableOpacity style={styles.backButtonTop} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={WEBSITE_BRAND_COLORS.white} />
              </TouchableOpacity>
            )}

          {/* Logo - Her sayfada aynı yerde ve boyutta */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Content - İçerik alta yakın (Animasyonlu) */}
          <Animated.View 
            style={[
              styles.contentWrapper,
              {
                opacity: fadeAnim,
                transform: [
                  { translateX: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            {currentStep === 'language' && renderLanguageStep()}
            {currentStep === 'age' && renderAgeStep()}
            {currentStep === 'legal' && renderLegalStep()}
          </Animated.View>

          {/* Progress - 5 noktalı (Language, Age, Legal, Auth, FavoriteTeams) */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, currentStep === 'language' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, currentStep === 'age' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={[styles.progressDot, currentStep === 'legal' && styles.progressDotActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 TacticIQ</Text>
          </View>
        </View>

        {renderDatePickerModal()}
        {renderLegalModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WEBSITE_BRAND_COLORS.primary },
  container: { flex: 1 },
  gridPattern: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 1, zIndex: 0,
    pointerEvents: 'none',
    ...Platform.select({
      web: { 
        backgroundImage: `linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)`, 
        backgroundSize: '40px 40px' 
      },
      default: { backgroundColor: 'transparent' },
    }),
  },
  mainContent: { 
    flex: 1,
    zIndex: 1,
    paddingHorizontal: WEBSITE_SPACING.xxl,
    paddingTop: WEBSITE_SPACING.xl + WEBSITE_ICON_SIZES.xl + WEBSITE_SPACING.md, // Tüm sayfalarla aynı (56px)
  },
  // Back Button - Sol üst köşe
  backButtonTop: {
    position: 'absolute',
    top: WEBSITE_SPACING.xl,
    left: WEBSITE_SPACING.xl,
    width: WEBSITE_ICON_SIZES.xl + WEBSITE_SPACING.md,
    height: WEBSITE_ICON_SIZES.xl + WEBSITE_SPACING.md,
    borderRadius: WEBSITE_BORDER_RADIUS.lg,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },

  // Logo - Her sayfada aynı (sıçrama yok)
  logoContainer: {
    alignItems: 'center',
    marginTop: AUTH_LOGO_MARGIN_TOP, 
    marginBottom: AUTH_LOGO_MARGIN_BOTTOM,
    height: AUTH_LOGO_SIZE,
    justifyContent: 'center',
  },
  logo: { width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE },

  // Progress - Tüm sayfalarda altta (sıçrama ve çakışma önleme)
  progressRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 0,
    height: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)' 
  },
  progressDotActive: { backgroundColor: WEBSITE_BRAND_COLORS.secondary, borderColor: WEBSITE_BRAND_COLORS.secondary },
  progressLine: { width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  // Content Wrapper - İçerik merkeze yakın
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 8,
  },
  
  stepContainer: { 
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  stepTitle: {
    fontSize: WEBSITE_TYPOGRAPHY['2xl'], 
    fontWeight: WEBSITE_TYPOGRAPHY.weights.bold, 
    color: WEBSITE_BRAND_COLORS.white, 
    textAlign: 'center',
    marginTop: 0,
    marginBottom: WEBSITE_SPACING.xs,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontSize: WEBSITE_TYPOGRAPHY.sm, 
    color: `rgba(255,255,255,${0.65})`, 
    textAlign: 'center',
    marginBottom: WEBSITE_SPACING.lg,
  },

  // PREMIUM Language Grid - 2 sütun 5 satır (10 dil için) - NO SCROLL
  languageGridPremium: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'space-between',
  },
  languageCardPremium: { 
    width: '48%',
    borderRadius: 10, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `rgba(31,162,166,${0.25})`,
    marginBottom: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  languageCardGradient: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  flagWrapperGrid: { 
    width: 28, 
    height: 28, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  languageNameGrid: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: WEBSITE_BRAND_COLORS.white,
    textAlign: 'center',
  },

  // Date Row
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateCard: { 
    flex: 1,
    backgroundColor: 'rgba(15, 42, 36, 0.95)', 
    borderRadius: 14, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: 'rgba(31, 162, 166, 0.3)' 
  },
  dateCardWide: { flex: 1.5 },
  dateLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  dateValue: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // Age Display
  ageDisplayBox: { 
    backgroundColor: 'rgba(15, 42, 36, 0.95)', 
    borderRadius: 18, 
    padding: 24, 
    alignItems: 'center',
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)' 
  },
  ageNumber: { fontSize: 56, fontWeight: '800', color: '#1FA2A6', letterSpacing: 1 },
  ageUnit: { fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  // Legal List
  legalListScroll: { 
    maxHeight: 200, // Scroll alanı sınırla
    marginBottom: 8,
  },
  legalList: { gap: 4, paddingBottom: 4 },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.95)', 
    borderRadius: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(31, 162, 166, 0.3)' 
  },
  legalIcon: { fontSize: 16, marginRight: 8 },
  legalTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  legalArrow: { fontSize: 24, color: '#1FA2A6' },

  // Checkbox - Amber/Gold accent for distinction
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: 'rgba(201, 164, 76, 0.08)', // Hafif amber arka plan
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 14, 
    marginBottom: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(201, 164, 76, 0.4)' // Amber border
  },
  checkbox: {
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    borderWidth: 2,
    borderColor: '#C9A44C', // Amber border
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 
  },
  checkboxChecked: { backgroundColor: '#C9A44C', borderColor: '#C9A44C' }, // Amber checked
  checkmark: { color: '#0F2A24', fontSize: 16, fontWeight: '800' }, // Koyu yeşil checkmark
  checkboxText: { flex: 1, fontSize: 14, color: '#E8DCC8', lineHeight: 20, fontWeight: '500' }, // Açık amber text

  // Minor Notice
  minorNotice: {
    backgroundColor: 'rgba(15, 42, 36, 0.95)', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12, 
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)' 
  },
  minorText: { fontSize: 13, color: '#C9A44C', lineHeight: 18 },

  // Buttons
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 0, marginTop: 4 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnGradient: { paddingVertical: WEBSITE_SPACING.lg, alignItems: 'center' },
  primaryBtnText: { fontSize: WEBSITE_TYPOGRAPHY.lg, fontWeight: WEBSITE_TYPOGRAPHY.weights.bold, color: WEBSITE_BRAND_COLORS.white, letterSpacing: 0.5 },

  // Footer
  footer: { paddingVertical: 16, alignItems: 'center' },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20 
  },
  pickerModal: {
    width: '100%',
    maxWidth: 340, 
    maxHeight: '65%', 
    backgroundColor: '#0F2A24', 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1FA2A6' 
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18, 
    backgroundColor: 'rgba(15, 42, 36, 0.95)', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.3)' 
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  pickerClose: { fontSize: 24, color: '#fff' },
  pickerScroll: { maxHeight: 320 },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pickerItemSelected: { backgroundColor: 'rgba(31, 162, 166, 0.4)' },
  pickerItemText: { fontSize: 16, color: '#fff', textAlign: 'center' },
  pickerItemTextSelected: { color: '#1FA2A6', fontWeight: '700' },

  legalModal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%', // Daha fazla içerik göster
    backgroundColor: '#0F2A24', 
    borderRadius: 20,
    overflow: 'hidden', // İçeriğin taşmasını engelle 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1FA2A6' 
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18, 
    backgroundColor: 'rgba(15, 42, 36, 1)', // Tam opak
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.3)', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.3)' 
  },
  legalModalTitle: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1 },
  legalModalClose: { fontSize: 24, color: '#fff' },
  legalModalScroll: {
    flex: 1, // Kalan alanı kapla
    padding: 20,
    paddingBottom: 10,
  },
  legalModalContent: {
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', // Daha okunabilir
    lineHeight: 24, // Daha iyi satır aralığı
    letterSpacing: 0.3,
  },
  legalModalContentNoScroll: { 
    padding: 20,
    flex: 1,
  },
  legalModalBtn: { 
    padding: 16, 
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.3)',
  },
  legalModalBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  
  // Cookie Controls
  cookieControls: {
    marginTop: 0,
    paddingTop: 0,
  },
  cookieControlsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  cookieToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  cookieToggleInfo: {
    flex: 1,
  },
  cookieToggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cookieToggleDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cookieToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookieToggleSwitchActive: {
    backgroundColor: WEBSITE_BRAND_COLORS.secondary,
    borderColor: WEBSITE_BRAND_COLORS.secondary,
  },
  cookieToggleSwitchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
