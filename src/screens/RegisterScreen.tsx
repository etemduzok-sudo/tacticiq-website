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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
} from 'react-native-reanimated';
import { BRAND, COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
// Logo component removed - using text placeholder
// import authService from '../services/authService'; // Real Supabase
import authService from '../services/mockAuthService'; // Mock (geçici test için)
import socialAuthService from '../services/socialAuthService'; // Google & Apple Sign In

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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
        Alert.alert('Hata', `❌ ${result.error || `${provider} ile kayıt başarısız`}`);
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Hata', `❌ ${error.message || 'Bir hata oluştu'}`);
    }
  };

  const handleRegister = async () => {
    // ✅ ZORUNLU: Kullanıcı adı kontrolü
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('❌ Hata', 'Kullanıcı adı en az 3 karakter olmalıdır');
      return;
    }
    // ✅ ZORUNLU: Kullanıcı adı müsait mi?
    if (usernameStatus !== 'available') {
      Alert.alert('❌ Hata', 'Lütfen müsait bir kullanıcı adı seçin');
      return;
    }
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('❌ Hata', 'Lütfen tüm alanları doldurun');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('❌ Hata', 'Geçerli bir e-posta adresi girin');
      return;
    }
    if (password.length < 6) {
      Alert.alert('❌ Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('❌ Hata', 'Şifreler eşleşmiyor');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('❌ Hata', 'Kullanım koşullarını kabul etmelisiniz');
      return;
    }
    await proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    try {
      const result = await authService.signUp(email.trim(), password, username.trim());
      setLoading(false);
      if (result.success) {
        Alert.alert('✅ Kayıt Başarılı!', 'Hoş geldiniz!', [
          { text: 'Tamam', onPress: () => onRegisterSuccess() },
        ]);
      } else {
        Alert.alert('❌ Hata', result.error || 'Kayıt başarısız oldu');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('❌ Hata', error.message || 'Bir hata oluştu');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.dark.background, COLORS.dark.card, COLORS.dark.background]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.screenContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* [A] TOP NAVIGATION ZONE */}
            <View style={styles.topNavZone}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color={BRAND.emerald} />
              </TouchableOpacity>
            </View>

            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
            {/* [B] BRAND ZONE */}
            <View style={styles.brandZone}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* [C] PRIMARY ACTION ZONE - Social Buttons */}
            <View style={styles.socialZone}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => handleSocialRegister('Google')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>Google ile Kayıt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.appleButton}
                onPress={() => handleSocialRegister('Apple')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                <Text style={styles.appleButtonText}>Apple ile Kayıt</Text>
              </TouchableOpacity>
            </View>

            {/* [D] DIVIDER ZONE */}
            <View style={styles.dividerZone}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* [E] FORM INPUT ZONE */}
            <View style={styles.formZone}>
              {/* Username */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={BRAND.emerald} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Kullanıcı adı"
                  placeholderTextColor="#64748B"
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameStatus !== 'idle' && (
                  <View style={styles.statusIndicator}>
                    {usernameStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}
                    {usernameStatus === 'available' && <Text style={styles.availableText}>✅</Text>}
                    {usernameStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}
                  </View>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  placeholderTextColor="#64748B"
                  value={email}
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

              {/* Password */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithRightIcon]}
                  placeholder="Şifre"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithRightIcon,
                    passwordMatchStatus === 'mismatch' && styles.inputError,
                    passwordMatchStatus === 'match' && styles.inputSuccess,
                  ]}
                  placeholder="Şifre tekrar"
                  placeholderTextColor="#64748B"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
                {passwordMatchStatus !== 'idle' && (
                  <View style={[styles.statusIndicator, { right: 44 }]}>
                    {passwordMatchStatus === 'match' && <Text style={styles.availableText}>✅</Text>}
                    {passwordMatchStatus === 'mismatch' && <Text style={styles.takenText}>❌</Text>}
                  </View>
                )}
              </View>

              {/* Terms Checkbox */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.8}
                  style={styles.checkboxButton}
                >
                  <View style={[styles.customCheckbox, agreedToTerms && styles.customCheckboxChecked]}>
                    {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxText}>
                    <Text style={styles.linkText} onPress={() => onNavigateToLegal?.('terms')}>
                      Kullanım Koşulları
                    </Text>
                    <Text> ve </Text>
                    <Text style={styles.linkText} onPress={() => onNavigateToLegal?.('privacy')}>
                      Gizlilik Politikası
                    </Text>
                    <Text>'nı okudum ve kabul ediyorum</Text>
                  </Text>
                </View>
              </View>

              {/* [G] PRIMARY CTA BUTTON */}
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleRegister}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>Kayıt Ol</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Secondary Link */}
            <View style={styles.secondaryLinkContainer}>
              <Text style={styles.secondaryLinkText}>Zaten hesabınız var mı? </Text>
              <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                <Text style={styles.secondaryLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
            </Animated.View>
          </ScrollView>

          {/* [H] FOOTER ZONE - FIXED AT BOTTOM (OUTSIDE SCROLLABLE CONTENT) */}
          <View style={styles.footerZone}>
            <Text style={styles.footer}>
              © 2026. Tüm hakları saklıdır.
            </Text>
          </View>
        </View>
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
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  
  // [A] TOP NAVIGATION ZONE
  topNavZone: {
    height: LAYOUT.backButtonSize,
    justifyContent: 'center',
  },
  backButton: {
    width: LAYOUT.backButtonSize,
    height: LAYOUT.backButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // [B] BRAND ZONE
  brandZone: {
    height: LAYOUT.brandZoneHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  
  // [C] PRIMARY ACTION ZONE - Social Buttons
  socialZone: {
    height: LAYOUT.socialZoneHeight,
    gap: LAYOUT.socialButtonGap,
    marginTop: LAYOUT.socialZoneMarginTop,
    justifyContent: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.white,
    height: LAYOUT.socialButtonHeight,
    borderRadius: SIZES.radiusLg,
    gap: SPACING.md,
  },
  googleButtonText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.dark.foreground,
    fontWeight: '500',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: LAYOUT.socialButtonHeight,
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
    height: LAYOUT.dividerZoneHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: LAYOUT.inputGap,
  },
  inputWrapper: {
    position: 'relative',
    height: LAYOUT.inputHeight,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: LAYOUT.inputIconTop,
    zIndex: 1,
  },
  input: {
    height: LAYOUT.inputHeight,
    backgroundColor: `rgba(15, 23, 42, 0.5)`,
    borderWidth: 1,
    borderColor: `rgba(5, 150, 105, 0.3)`,
    borderRadius: SIZES.radiusLg,
    paddingLeft: 44,
    paddingRight: 44,
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: BRAND.white,
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
    height: LAYOUT.ctaButtonHeight,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
    marginTop: LAYOUT.secondaryLinkMarginTop,
  },
  secondaryLinkText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.dark.mutedForeground,
  },
  secondaryLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: BRAND.emerald,
    fontWeight: '500',
  },
  
  // [H] FOOTER ZONE - FIXED AT BOTTOM (GLOBAL FOOTER)
  footerZone: {
    paddingTop: 16,
    paddingBottom: 16,
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
