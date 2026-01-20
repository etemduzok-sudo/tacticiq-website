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
// import authService from '../services/authService'; // Real Supabase
import authService from '../services/mockAuthService'; // Mock (geçici test için)
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
    setLoading(true);
    
    try {
      console.log(`🔑 ${provider} ile giriş başlatıldı...`);
      
      const result = provider === 'Google'
        ? await socialAuthService.signInWithGoogle()
        : await socialAuthService.signInWithApple();
      
      setLoading(false);
      
      if (result.success) {
        console.log(`✅ ${provider} giriş başarılı, ana sayfaya yönlendiriliyor...`);
        // Web'de Alert.alert çalışmadığı için direkt yönlendir
        onLoginSuccess();
      } else {
        Alert.alert(t('common.error'), `❌ ${result.error || `${provider} ${t('auth.socialLoginFailed')}`}`);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), `❌ ${error.message || t('auth.errorOccurred')}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1612', '#0F2A24', '#0a1612']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Grid Pattern Background */}
        <View style={styles.gridPattern} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Back Button - Sol üst köşe */}
          {onBack && (
            <TouchableOpacity style={styles.backButtonTop} onPress={onBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={WEBSITE_BRAND_COLORS.white} />
            </TouchableOpacity>
          )}

          <View style={styles.screenContainer}>
            <View style={styles.contentWrapper}>

              <View style={styles.content}>
              {/* [B] BRAND ZONE - OnboardingScreen ile aynı konum (sıçrama olmasın) */}
              <View style={styles.brandZone}>
                {Platform.OS === 'web' ? (
                  <img 
                    src="/TacticIQ.svg" 
                    alt="TacticIQ" 
                    style={{ width: 270, height: 270 }} 
                  />
                ) : (
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 270, height: 270 }}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* [C] PRIMARY ACTION ZONE - Social Buttons */}
              <View style={styles.socialZone}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => handleSocialLogin('Google')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText} numberOfLines={1} adjustsFontSizeToFit>
                    Google ile Giriş Yap
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={() => handleSocialLogin('Apple')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.appleButtonText} numberOfLines={1} adjustsFontSizeToFit>
                    Apple ile Giriş Yap
                  </Text>
                </TouchableOpacity>
              </View>

              {/* [D] DIVIDER ZONE */}
              <View style={styles.dividerZone}>
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
              </View>

              {/* [E] FORM INPUT ZONE */}
              <View style={styles.formZone}>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color="#059669" 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[
                        styles.input,
                        emailStatus === 'available' && styles.inputSuccess,
                        emailStatus === 'taken' && styles.inputError,
                      ]}
                      placeholder="ornek@email.com"
                      placeholderTextColor="#64748B"
                      value={loginEmail}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {emailStatus !== 'idle' && (
                      <View style={styles.statusIndicator}>
                        {emailStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}
                        {emailStatus === 'available' && <Text style={styles.availableText}>✅</Text>}
                        {emailStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}
                      </View>
                    )}
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color="#059669" 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={[styles.input, styles.inputWithRightIcon]}
                      placeholder="••••••••"
                      placeholderTextColor="#64748B"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* [F] SECONDARY ACTION LINKS */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={onForgotPassword}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
                </TouchableOpacity>

                {/* [G] PRIMARY CTA BUTTON */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.ctaButtonText} numberOfLines={1} adjustsFontSizeToFit>
                        {t('auth.login')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Secondary Link */}
              <View style={styles.secondaryLinkContainer}>
                <Text style={styles.secondaryLinkText}>Hesabınız yok mu? </Text>
                <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
                  <Text style={styles.secondaryLink} numberOfLines={1} adjustsFontSizeToFit>
                    Kayıt Ol
                  </Text>
                </TouchableOpacity>
              </View>
              </View>

              {/* Progress Indicator - 5 noktalı (Language, Age, Legal, Auth, FavoriteTeams) */}
              <View style={styles.progressRow}>
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
                <View style={styles.progressLine} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressLine} />
                <View style={styles.progressDot} />
              </View>
            </View>

            {/* [H] FOOTER ZONE - FIXED AT BOTTOM (OUTSIDE SCROLLABLE CONTENT) */}
            <View style={styles.footerZone}>
              <Text style={styles.footer}>
                © 2026. Tüm hakları saklıdır.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
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
    marginTop: 30, // LOGO_MARGIN_TOP ile aynı
    marginBottom: 6, // Biraz daha azaltıldı
    height: 270, // LOGO_SIZE ile aynı
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
