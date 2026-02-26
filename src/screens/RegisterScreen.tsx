import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Animasyonlar kaldırıldı (sıçrama yok)
import { BRAND, COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_INPUT, STANDARD_COLORS } from '../constants/standardLayout';
import { WEBSITE_COLORS, WEBSITE_GRADIENTS, WEBSITE_SPACING, WEBSITE_TYPOGRAPHY } from '../theme/websiteTheme';
import {
  WEBSITE_BRAND_COLORS,
  WEBSITE_DARK_COLORS,
  WEBSITE_BORDER_RADIUS,
  WEBSITE_SPACING as WDS_SPACING,
  WEBSITE_ICON_SIZES,
  WEBSITE_TYPOGRAPHY as WDS_TYPOGRAPHY,
} from '../config/WebsiteDesignSystem';
import { AUTH_LOGO_SIZE, AUTH_LOGO_MARGIN_TOP, AUTH_LOGO_MARGIN_BOTTOM } from '../constants/logoConstants';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import authService from '../services/authService';
import socialAuthService from '../services/socialAuthService'; // Google & Apple Sign In
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// SHARED LAYOUT CONSTANTS (MUST BE IDENTICAL)
// ============================================
const LAYOUT = {
  // [A] TOP NAVIGATION ZONE
  screenPadding: 24,
  backButtonSize: 40,
  backButtonMarginBottom: 0,
  
  // [B] BRAND ZONE
  brandZoneHeight: 100,
  logoSize: 48,
  titleFontSize: 22,
  titleLineHeight: 28,
  ballEmojiSize: 16,
  subtitleFontSize: 14,
  subtitleMarginTop: 6,
  
  // [C] PRIMARY ACTION ZONE (Social Buttons)
  socialZoneHeight: 104, // 2x44 + 8 gap + 8 marginTop
  socialButtonHeight: 44,
  socialButtonGap: 8,
  socialZoneMarginTop: 8,
  
  // [D] DIVIDER ZONE
  dividerZoneHeight: 40, // 8 + 24 + 8
  dividerMarginVertical: 8,
  
  // [E] FORM INPUT ZONE
  inputHeight: 48,
  inputGap: 12,
  inputIconTop: 14,
  
  // [F] SECONDARY ACTION LINKS
  secondaryLinkMarginTop: 16,
  
  // [G] PRIMARY CTA BUTTON
  ctaButtonHeight: 48,
  ctaButtonMarginTop: 16,
  
  // [H] FOOTER ZONE
  footerMarginTop: 'auto',
};

interface RegisterScreenProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
  onNavigateToLegal?: (documentType: string) => void;
}

export default function RegisterScreen({
  onBack,
  onRegisterSuccess,
  onNavigateToLegal,
}: RegisterScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Availability check states
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<'idle' | 'match' | 'mismatch'>('idle');

  const scrollViewRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, []);

  // Real-time username check
  const checkUsernameTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setUsernameStatus('idle');
    if (checkUsernameTimeout.current) clearTimeout(checkUsernameTimeout.current);
    if (text.trim().length >= 3) {
      setUsernameStatus('checking');
      checkUsernameTimeout.current = setTimeout(async () => {
        const result = await authService.checkUsernameAvailability(text.trim());
        if (result.success) setUsernameStatus(result.available ? 'available' : 'taken');
        else setUsernameStatus('idle');
      }, 800);
    }
  };

  // Real-time email check
  const checkEmailTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailStatus('idle');
    if (checkEmailTimeout.current) clearTimeout(checkEmailTimeout.current);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(text.trim())) {
      setEmailStatus('checking');
      checkEmailTimeout.current = setTimeout(async () => {
        const result = await authService.checkEmailAvailability(text.trim());
        if (result.success) setEmailStatus(result.available ? 'available' : 'taken');
        else setEmailStatus('idle');
      }, 800);
    }
  };

  // Password match check
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text.length === 0) setPasswordMatchStatus('idle');
    else if (text.length > 0 && password.length > 0) {
      setPasswordMatchStatus(password === text ? 'match' : 'mismatch');
    }
  };

  React.useEffect(() => {
    if (confirmPassword.length > 0 && password.length > 0) {
      setPasswordMatchStatus(password === confirmPassword ? 'match' : 'mismatch');
    } else {
      setPasswordMatchStatus('idle');
    }
  }, [password, confirmPassword]);

  const handleSocialRegister = async (provider: 'Google' | 'Apple') => {
    setLoading(true);
    
    try {
      console.log(`🔑 ${provider} ile kayıt başlatıldı...`);
      
      const result = provider === 'Google'
        ? await socialAuthService.signInWithGoogle()
        : await socialAuthService.signInWithApple();
      
      setLoading(false);
      
      if (result.success) {
        console.log(`✅ ${provider} kayıt başarılı, favori takım seçimine yönlendiriliyor...`);
        // Web'de Alert.alert çalışmadığı için direkt yönlendir
        onRegisterSuccess();
      } else {
        Alert.alert(t('common.error'), `❌ ${result.error || `${provider} ${t('register.socialRegisterFailed')}`}`);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), `❌ ${error.message || t('register.errorOccurred')}`);
    }
  };

  const handleRegister = async () => {
    // ✅ ZORUNLU: Kullanıcı adı kontrolü
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert(`❌ ${t('common.error')}`, t('register.usernameMinLength'));
      return;
    }
    // ✅ ZORUNLU: Kullanıcı adı müsait mi?
    if (usernameStatus !== 'available') {
      Alert.alert(`❌ ${t('common.error')}`, t('register.usernameAvailable'));
      return;
    }
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert(`❌ ${t('common.error')}`, t('register.fillAllFields'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(`❌ ${t('common.error')}`, t('register.validEmail'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(`❌ ${t('common.error')}`, t('register.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(`❌ ${t('common.error')}`, t('register.passwordsDontMatch'));
      return;
    }
    await proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    // 18 yaş altı kontrolü
    try {
      const birthDateStr = await AsyncStorage.getItem('@user_birth_date');
      const isMinorStr = await AsyncStorage.getItem('@user_is_minor');
      
      if (isMinorStr === 'true' || birthDateStr) {
        // Yaş bilgisi varsa kontrol et
        if (birthDateStr) {
          const [year, month, day] = birthDateStr.split('-').map(Number);
          const today = new Date();
          const birthDate = new Date(year, month - 1, day);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age < 18) {
            Alert.alert(`❌ ${t('register.underAgeTitle')}`, t('register.underAgeMessage'));
            setLoading(false);
            return;
          }
        } else if (isMinorStr === 'true') {
          Alert.alert(`❌ ${t('register.underAgeTitle')}`, t('register.underAgeMessage'));
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking age:', error);
    }

    setLoading(true);
    try {
      const result = await authService.signUp(email.trim(), password, username.trim());
      setLoading(false);
      if (result.success) {
        Alert.alert(`✅ ${t('register.welcomeTitle')}`, t('register.welcomeMessage'), [
          { text: 'Tamam', onPress: () => onRegisterSuccess() },
        ]);
      } else {
        Alert.alert(`❌ ${t('common.error')}`, result.error || t('register.registerFailed'));
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert(`❌ ${t('common.error')}`, error.message || t('register.errorOccurred'));
    }
  };

  const mainContent = (
    <>
      <View style={styles.gridPattern} />
      <TouchableOpacity style={[styles.backButtonTop, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={isLight ? themeColors.foreground : WEBSITE_BRAND_COLORS.white} />
      </TouchableOpacity>
      <View style={styles.screenContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.brandZone}>
              {Platform.OS === 'web' ? <img src="/TacticIQ.svg" alt="TacticIQ" style={{ width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE }} /> : <Image source={require('../../assets/logo.png')} style={{ width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE }} resizeMode="contain" />}
            </View>
            <View style={styles.socialZone}>
              <TouchableOpacity style={styles.googleButton} onPress={() => handleSocialRegister('Google')} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>{t('register.googleSignUp')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.appleButton, isLight && { backgroundColor: themeColors.foreground }]} onPress={() => handleSocialRegister('Apple')} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={20} color={isLight ? themeColors.background : '#FFFFFF'} />
                <Text style={[styles.appleButtonText, isLight && { color: themeColors.background }]}>{t('register.appleSignUp')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dividerZone}>
              <View style={[styles.dividerLine, isLight && { backgroundColor: themeColors.border }]} />
              <Text style={[styles.dividerText, isLight && { color: themeColors.mutedForeground }]}>{t('register.or')}</Text>
              <View style={[styles.dividerLine, isLight && { backgroundColor: themeColors.border }]} />
            </View>
            <View style={styles.formZone}>
              <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="person-outline" size={20} color={isLight ? themeColors.ring : BRAND.emerald} style={styles.inputIcon} />
                <TextInput style={[styles.input, isLight && { color: themeColors.foreground }]} placeholder={t('register.usernamePlaceholder')} placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={username} onChangeText={handleUsernameChange} autoCapitalize="none" autoCorrect={false} />
                {usernameStatus !== 'idle' && <View style={styles.statusIndicator}>{usernameStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}{usernameStatus === 'available' && <Text style={styles.availableText}>✅</Text>}{usernameStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}</View>}
              </View>
              <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="mail-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                <TextInput style={[styles.input, isLight && { color: themeColors.foreground }]} placeholder={t('auth.email')} placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                {emailStatus !== 'idle' && <View style={styles.statusIndicator}>{emailStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}{emailStatus === 'available' && <Text style={styles.availableText}>✅</Text>}{emailStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}</View>}
              </View>
              <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.inputWithRightIcon, isLight && { color: themeColors.foreground }]} placeholder={t('register.passwordPlaceholder')} placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isLight ? themeColors.mutedForeground : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.inputWithRightIcon, passwordMatchStatus === 'mismatch' && styles.inputError, passwordMatchStatus === 'match' && styles.inputSuccess, isLight && { color: themeColors.foreground }]} placeholder={t('register.confirmPasswordPlaceholder')} placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={confirmPassword} onChangeText={handleConfirmPasswordChange} secureTextEntry={!showConfirmPassword} autoCapitalize="none" autoCorrect={false} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)} activeOpacity={0.7}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isLight ? themeColors.mutedForeground : '#9CA3AF'} />
                </TouchableOpacity>
                {passwordMatchStatus !== 'idle' && <View style={[styles.statusIndicator, { right: 44 }]}>{passwordMatchStatus === 'match' && <Text style={styles.availableText}>✅</Text>}{passwordMatchStatus === 'mismatch' && <Text style={styles.takenText}>❌</Text>}</View>}
              </View>
              <TouchableOpacity style={styles.ctaButton} onPress={handleRegister} activeOpacity={0.8}>
                <LinearGradient colors={[WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButtonGradient}>
                  <Text style={styles.ctaButtonText}>{t('register.signUp')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.secondaryLinkContainer}>
              <Text style={[styles.secondaryLinkText, isLight && { color: themeColors.mutedForeground }]}>{t('register.alreadyHaveAccount')} </Text>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                <Text style={[styles.secondaryLink, isLight && { color: themeColors.ring }]}>{t('register.login')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressRow}>
              <View style={[styles.progressDot, isLight && { backgroundColor: themeColors.muted }]} />
              <View style={[styles.progressLine, isLight && { backgroundColor: themeColors.border }]} />
              <View style={[styles.progressDot, isLight && { backgroundColor: themeColors.muted }]} />
              <View style={[styles.progressLine, isLight && { backgroundColor: themeColors.border }]} />
              <View style={[styles.progressDot, isLight && { backgroundColor: themeColors.muted }]} />
              <View style={[styles.progressLine, isLight && { backgroundColor: themeColors.border }]} />
              <View style={[styles.progressDot, styles.progressDotActive, isLight && { backgroundColor: themeColors.ring || WEBSITE_BRAND_COLORS.primary }]} />
              <View style={[styles.progressLine, isLight && { backgroundColor: themeColors.border }]} />
              <View style={[styles.progressDot, isLight && { backgroundColor: themeColors.muted }]} />
            </View>
          </View>
        </View>
        <View style={styles.footerZone}>
          <Text style={[styles.footer, isLight && { color: themeColors.mutedForeground }]}>{t('auth.allRightsReserved')}</Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isLight && { backgroundColor: themeColors.background }]}>
      {isLight ? (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>{mainContent}</View>
      ) : (
        <LinearGradient colors={['#0a1612', '#0F2A24', '#0a1612']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>{mainContent}</LinearGradient>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
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
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  // Back Button - Sol üst köşe (standardize)
  backButtonTop: {
    position: 'absolute',
    top: WDS_SPACING.xl,
    left: WDS_SPACING.xl,
    width: WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
    height: WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
    borderRadius: WEBSITE_BORDER_RADIUS.lg,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderWidth: 1,
    borderColor: `rgba(31, 162, 166, ${0.2})`,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: WDS_SPACING.xl + WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24, // "Giriş Yap" yazısını görünür hale getir
  },
  
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // [B] BRAND ZONE - OnboardingScreen ile aynı konum (sıçrama olmasın)
  brandZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AUTH_LOGO_MARGIN_TOP,
    marginBottom: AUTH_LOGO_MARGIN_BOTTOM,
    height: AUTH_LOGO_SIZE,
    paddingVertical: 0,
  },
  brandTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.white,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
  
  // [C] PRIMARY ACTION ZONE - Social Buttons
  socialZone: {
    gap: 6, // Azaltıldı
    marginTop: 0,
    justifyContent: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.white,
    height: 42, // AuthScreen ile aynı (sıçrama olmasın)
    borderRadius: SIZES.radiusLg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: 42, // AuthScreen ile aynı (sıçrama olmasın)
    borderRadius: SIZES.radiusLg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appleButtonText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: BRAND.white,
    fontWeight: '500',
  },
  
  // [D] DIVIDER ZONE
  dividerZone: {
    height: 20, // AuthScreen ile aynı
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 5, // AuthScreen ile aynı
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dark.border,
  },
  dividerText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.dark.mutedForeground,
  },
  
  // [E] FORM INPUT ZONE
  formZone: {
    gap: 8, // Azaltıldı
  },
  inputWrapper: {
    position: 'relative',
    height: 42, // Azaltıldı
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  input: {
    ...STANDARD_INPUT,
    paddingRight: 44, // Eye icon için
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  
  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  checkboxButton: {
    padding: 0,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: SIZES.radiusSm,
    borderWidth: 2,
    borderColor: COLORS.dark.mutedForeground,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customCheckboxChecked: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.dark.mutedForeground,
    lineHeight: 18,
  },
  linkText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: BRAND.emerald,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  
  // [G] PRIMARY CTA BUTTON
  ctaButton: {
    height: 42, // Azaltıldı
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8, // Azaltıldı
  },
  ctaButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 16,
    color: BRAND.white,
    fontWeight: '600',
  },
  
  // Secondary Link
  secondaryLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 28, // "Giriş Yap" yazısını görünür hale getir
  },
  secondaryLinkText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Daha okunabilir
    fontWeight: '500',
  },
  secondaryLink: {
    ...TYPOGRAPHY.body,
    fontSize: 15, // Biraz daha büyük
    color: WEBSITE_BRAND_COLORS.white, // Beyaz renk
    fontWeight: '700', // Daha kalın
    textDecorationLine: 'underline', // Altı çizili
  },
  
  // [H] FOOTER ZONE - FIXED AT BOTTOM (GLOBAL FOOTER)
  // Progress Indicator
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0, // Progress bar pozisyonu sabit
    marginBottom: 12,
    height: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: WEBSITE_BRAND_COLORS.secondary,
    borderColor: WEBSITE_BRAND_COLORS.secondary,
  },
  progressLine: {
    width: 28,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  
  footerZone: {
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  footer: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: COLORS.dark.mutedForeground,
    textAlign: 'center',
  },
  
  // Status Indicators
  statusIndicator: {
    position: 'absolute',
    right: 12,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  checkingText: {
    fontSize: 16,
  },
  availableText: {
    fontSize: 16,
    color: BRAND.emerald,
  },
  takenText: {
    fontSize: 16,
    color: COLORS.dark.error,
  },
  inputSuccess: {
    borderColor: BRAND.emerald,
  },
  inputError: {
    borderColor: COLORS.dark.error,
  },
});
