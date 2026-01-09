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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import authService from '../services/authService'; // Real Supabase
import authService from '../services/mockAuthService'; // Mock (geçici test için)
import Animated, { 
  SlideInLeft,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { BRAND } from '../theme/theme';
// Logo component removed - using text placeholder

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
      Alert.alert('Hata', '❌ E-posta adresi boş bırakılamaz');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      Alert.alert('Hata', '❌ Geçerli bir e-posta adresi girin');
      return;
    }

    if (!loginPassword.trim()) {
      Alert.alert('Hata', '❌ Şifre boş bırakılamaz');
      return;
    }

    if (loginPassword.length < 6) {
      Alert.alert('Hata', '❌ Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    const result = await authService.signIn(loginEmail.trim(), loginPassword);
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Başarılı', '✅ Giriş başarılı!');
      onLoginSuccess();
    } else {
      Alert.alert('Hata', `❌ ${result.error || 'Giriş başarısız'}`);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.screenContainer}>
            <View style={styles.contentWrapper}>
              {/* [A] TOP NAVIGATION ZONE */}
              <View style={styles.topNavZone}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#059669" />
                </TouchableOpacity>
              </View>

              <Animated.View 
                entering={SlideInLeft.duration(300)}
                style={styles.content}
              >
              {/* [B] BRAND ZONE */}
              <View style={styles.brandZone}>
                <Text style={styles.logoText}>FM 2026</Text>
              </View>

              {/* [C] PRIMARY ACTION ZONE - Social Buttons */}
              <View style={styles.socialZone}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => handleSocialLogin('Google')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText}>Google ile Giriş</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={() => handleSocialLogin('Apple')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={styles.appleButtonText}>Apple ile Giriş</Text>
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
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta</Text>
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
                  <Text style={styles.label}>Şifre</Text>
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
                  <Text style={styles.forgotPasswordText}>Şifremi Unuttum?</Text>
                </TouchableOpacity>

                {/* [G] PRIMARY CTA BUTTON */}
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.ctaButtonText}>Giriş Yap</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Secondary Link */}
              <View style={styles.secondaryLinkContainer}>
                <Text style={styles.secondaryLinkText}>Hesabınız yok mu? </Text>
                <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
                  <Text style={styles.secondaryLink}>Kayıt Ol</Text>
                </TouchableOpacity>
              </View>
              </Animated.View>
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
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 12,
  },
  contentWrapper: {
    flex: 1,
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
    flex: 1,
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
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: BRAND.white,
    letterSpacing: 3,
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
    backgroundColor: '#FFFFFF',
    height: LAYOUT.socialButtonHeight,
    borderRadius: 12,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: LAYOUT.socialButtonHeight,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appleButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: '#374151',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // [E] FORM INPUT ZONE
  formZone: {
    gap: LAYOUT.inputGap,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    color: '#FFFFFF',
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
  
  // [F] SECONDARY ACTION LINKS
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#059669',
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
    fontSize: 16,
    color: '#FFFFFF',
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
    fontSize: 14,
    color: '#9CA3AF',
  },
  secondaryLink: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  
  // [H] FOOTER ZONE - FIXED AT BOTTOM (GLOBAL FOOTER)
  footerZone: {
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#059669',
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
});
