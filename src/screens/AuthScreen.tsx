import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';
import socialAuthService from '../services/socialAuthService'; // Google & Apple Sign In
// Animasyonlar kaldırıldı (sıçrama yok)
import { BRAND, COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_INPUT, STANDARD_COLORS } from '../constants/standardLayout';
import { useTranslation } from '../hooks/useTranslation';
import TacticIQLogo from '../components/TacticIQLogo';
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

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  onBack?: () => void;
}

export default function AuthScreen({
  onLoginSuccess,
  onForgotPassword,
  onRegister,
  onBack,
}: AuthScreenProps) {
  const { t, isRTL } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false); // ✅ OAuth tam ekran loading
  
  // Email availability check states
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');


  // Real-time email check with debounce
  const checkEmailTimeout = React.useRef<NodeJS.Timeout | null>(null);
  
  const handleEmailChange = (text: string) => {
    setLoginEmail(text);
    setEmailStatus('idle');
    
    // Clear previous timeout
    if (checkEmailTimeout.current) {
      clearTimeout(checkEmailTimeout.current);
    }
    
    // Only check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(text.trim())) {
      setEmailStatus('checking');
      checkEmailTimeout.current = setTimeout(async () => {
        const result = await authService.checkEmailAvailability(text.trim());
        if (result.success) {
          setEmailStatus(result.available ? 'available' : 'taken');
        } else {
          setEmailStatus('idle');
        }
      }, 800);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert(t('common.error'), `❌ ${t('auth.emailRequired')}`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      Alert.alert(t('common.error'), `❌ ${t('auth.emailInvalid')}`);
      return;
    }

    if (!loginPassword.trim()) {
      Alert.alert(t('common.error'), `❌ ${t('auth.passwordRequired')}`);
      return;
    }

    if (loginPassword.length < 6) {
      Alert.alert(t('common.error'), `❌ ${t('auth.passwordMinLength')}`);
      return;
    }

    setLoading(true);
    const result = await authService.signIn(loginEmail.trim(), loginPassword);
    setLoading(false);
    
    if (result.success) {
      Alert.alert(t('common.done'), `✅ ${t('auth.loginSuccess')}`);
      onLoginSuccess();
    } else {
      Alert.alert(t('common.error'), `❌ ${result.error || t('auth.loginFailed')}`);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
    // ✅ HEMEN tam ekran loading göster (flaş sorununu önler)
    setOauthLoading(true);
    setLoading(true);
    
    try {
      console.log(`🔑 ${provider} ile giriş başlatıldı...`);
      
      // ✅ Web için: localStorage'a OAuth başladığını işaretle
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem('tacticiq_oauth_initiating', 'true');
        console.log('📍 OAuth initiating flag set');
      }
      
      const result = provider === 'Google'
        ? await socialAuthService.signInWithGoogle()
        : await socialAuthService.signInWithApple();
      
      // ✅ Web'de buraya ASLA ulaşılmaz çünkü signInWithGoogle/Apple
      // never-resolving promise döndürür (sayfa yönlendiriliyor)
      // Bu sayede aşağıdaki kod çalışmaz ve "flaş" sorunu oluşmaz
      setLoading(false);
      setOauthLoading(false);
      
      if (result.success) {
        // Mobil için: OAuth tamamlandı, ana sayfaya yönlendir
        console.log(`✅ ${provider} giriş başarılı, ana sayfaya yönlendiriliyor...`);
        onLoginSuccess();
      } else {
        // OAuth başarısız oldu, flag'i temizle
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.localStorage.removeItem('tacticiq_oauth_initiating');
        }
        Alert.alert(t('common.error'), `❌ ${result.error || `${provider} ${t('auth.socialLoginFailed')}`}`);
      }
    } catch (error: any) {
      setLoading(false);
      setOauthLoading(false);
      // Hata durumunda flag'i temizle
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem('tacticiq_oauth_initiating');
      }
      Alert.alert(t('common.error'), `❌ ${error.message || t('auth.errorOccurred')}`);
    }
  };

  // ✅ OAuth tam ekran loading – dil t() ile güncellenir; açık mod tema uyumlu
  if (oauthLoading) {
    const loadingContent = (
      <>
        <View style={[styles.gridPattern, isLight && Platform.OS === 'web' && { backgroundImage: `linear-gradient(to right, rgba(15,42,36,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,42,36,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }]} />
        <View style={styles.oauthLoadingContent}>
          {Platform.OS === 'web' ? (
            <img src="/TacticIQ.svg" alt="TacticIQ" style={{ width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE, marginBottom: 32 }} />
          ) : (
            <Image source={require('../../assets/logo.png')} style={{ width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE, marginBottom: 32 }} resizeMode="contain" />
          )}
          <ActivityIndicator size="large" color={isLight ? themeColors.ring : '#1FA2A6'} style={{ marginBottom: 16 }} />
          <Text style={[styles.oauthLoadingText, isLight && { color: themeColors.foreground }]}>{t('auth.loggingIn')}</Text>
          <Text style={[styles.oauthLoadingSubtext, isLight && { color: themeColors.mutedForeground }]}>{t('auth.pleaseWait')}</Text>
        </View>
      </>
    );
    return (
      <SafeAreaView style={[styles.safeArea, isLight && { backgroundColor: themeColors.background }]}>
        {isLight ? (
          <View style={[styles.container, styles.oauthLoadingContainer, { backgroundColor: themeColors.background }]}>{loadingContent}</View>
        ) : (
          <LinearGradient colors={['#0a1612', '#0F2A24', '#0a1612']} style={[styles.container, styles.oauthLoadingContainer]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            {loadingContent}
          </LinearGradient>
        )}
      </SafeAreaView>
    );
  }

  const mainContent = (
    <>
      <View style={[styles.gridPattern, isLight && Platform.OS === 'web' && { backgroundImage: `linear-gradient(to right, rgba(15,42,36,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,42,36,0.08) 1px, transparent 1px)`, backgroundSize: '40px 40px' }]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {onBack && (
          <TouchableOpacity style={[styles.backButtonTop, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={isLight ? themeColors.foreground : WEBSITE_BRAND_COLORS.white} />
          </TouchableOpacity>
        )}
        <View style={styles.screenContainer}>
          <View style={styles.contentWrapper}>
            <View style={styles.content}>
              <View style={styles.brandZone}>
                {Platform.OS === 'web' ? <img src="/TacticIQ.svg" alt="TacticIQ" style={{ width: 180, height: 180 }} /> : <Image source={require('../../assets/logo.png')} style={{ width: 180, height: 180 }} resizeMode="contain" />}
              </View>
              <View style={styles.socialZone}>
                <TouchableOpacity style={styles.googleButton} onPress={() => handleSocialLogin('Google')} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText} numberOfLines={1} adjustsFontSizeToFit>{t('auth.signInWithGoogle')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.appleButton, isLight && { backgroundColor: themeColors.foreground }]} onPress={() => handleSocialLogin('Apple')} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={20} color={isLight ? themeColors.background : '#FFFFFF'} />
                  <Text style={[styles.appleButtonText, isLight && { color: themeColors.background }]} numberOfLines={1} adjustsFontSizeToFit>{t('auth.signInWithApple')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dividerZone}>
                <Text style={[styles.dividerText, isLight && { color: themeColors.mutedForeground }]}>{t('auth.orContinueWith')}</Text>
              </View>
              <View style={styles.formZone}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isLight && { color: themeColors.foreground }]}>{t('auth.email')}</Text>
                  <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Ionicons name="mail-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                    <TextInput style={[styles.input, emailStatus === 'available' && styles.inputSuccess, emailStatus === 'taken' && styles.inputError, isLight && { color: themeColors.foreground }]} placeholder="ornek@email.com" placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={loginEmail} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                    {emailStatus !== 'idle' && <View style={styles.statusIndicator}>{emailStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}{emailStatus === 'available' && <Text style={styles.availableText}>✅</Text>}{emailStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}</View>}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isLight && { color: themeColors.foreground }]}>{t('auth.password')}</Text>
                  <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                    <TextInput style={[styles.input, styles.inputWithRightIcon, isLight && { color: themeColors.foreground }]} placeholder="••••••••" placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={loginPassword} onChangeText={setLoginPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isLight ? themeColors.mutedForeground : '#64748B'} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword} activeOpacity={0.7}>
                  <Text style={[styles.forgotPasswordText, isLight && { color: themeColors.ring }]}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctaButton} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
                  <LinearGradient colors={[WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButtonGradient}>
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaButtonText} numberOfLines={1} adjustsFontSizeToFit>{t('auth.login')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <View style={styles.secondaryLinkContainer}>
                <Text style={[styles.secondaryLinkText, isLight && { color: themeColors.mutedForeground }]}>{t('auth.noAccount')} </Text>
                <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
                  <Text style={[styles.secondaryLink, isLight && { color: themeColors.ring }]} numberOfLines={1} adjustsFontSizeToFit>{t('auth.signUp')}</Text>
                </TouchableOpacity>
              </View>
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
          <View style={styles.footerZone}>
            <Text style={[styles.footer, isLight && { color: themeColors.mutedForeground }]}>© 2026. {t('auth.allRightsReserved')}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    zIndex: 1,
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
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: WDS_SPACING.xl + WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 8, // Progress ve footer için minimum boşluk
  },
  
  content: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
    paddingBottom: 32, // Progress bar ile çakışmayı önle (artırıldı)
  },
  
  // [B] BRAND ZONE - OnboardingScreen ile aynı konum (sıçrama olmasın)
  brandZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12, // Tüm ekranlarda aynı
    marginBottom: 8,
    height: 180, // Tüm ekranlarda aynı logo boyutu
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
    height: 42, // Azaltıldı
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
    height: 42, // Azaltıldı
    borderRadius: SIZES.radiusLg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appleButtonText: {
    ...TYPOGRAPHY.body,
    color: BRAND.white,
    fontWeight: '500',
  },
  
  // [D] DIVIDER ZONE
  dividerZone: {
    height: 20, // Biraz daha azaltıldı
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5, // Biraz daha azaltıldı
  },
  dividerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
  },
  
  // [E] FORM INPUT ZONE
  formZone: {
    gap: 10, // Azaltıldı
    marginTop: 0,
  },
  inputGroup: {
    gap: 8, // Azaltıldı
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark.mutedForeground,
  },
  inputWrapper: {
    position: 'relative',
    height: 46, // Azaltıldı
  },
  inputIcon: {
    position: 'absolute',
    left: SPACING.md,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  input: {
    ...STANDARD_INPUT,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  
  // [F] SECONDARY ACTION LINKS
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 15, // Biraz daha büyük
    fontWeight: '700', // Daha kalın
    color: WEBSITE_BRAND_COLORS.white, // Beyaz renk
    textDecorationLine: 'underline', // Altı çizili
  },
  
  // [G] PRIMARY CTA BUTTON
  ctaButton: {
    height: 46, // Azaltıldı
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginTop: 10, // Azaltıldı
    marginBottom: 6, // Azaltıldı
  },
  ctaButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    ...TYPOGRAPHY.button,
    color: BRAND.white,
    fontWeight: '600',
  },
  
  // Secondary Link
  secondaryLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 24, // Progress ile yeterli boşluk
  },
  secondaryLinkText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Daha okunabilir
    fontWeight: '500',
  },
  secondaryLink: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 15, // Biraz daha büyük
    fontWeight: '700', // Daha kalın
    color: WEBSITE_BRAND_COLORS.white, // Beyaz renk
    textDecorationLine: 'underline', // Altı çizili
  },
  
  // [H] FOOTER ZONE - FIXED AT BOTTOM (GLOBAL FOOTER)
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
    right: SPACING.md,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  checkingText: {
    ...TYPOGRAPHY.body,
  },
  availableText: {
    ...TYPOGRAPHY.body,
    color: BRAND.emerald,
  },
  takenText: {
    fontSize: 16,
    color: '#EF4444',
  },
  inputSuccess: {
    borderColor: '#059669',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  
  // ✅ OAuth Loading Overlay
  oauthLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  oauthLoadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  oauthLoadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1FA2A6',
    marginBottom: 8,
  },
  oauthLoadingSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  
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
});
