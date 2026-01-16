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
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BRAND, COLORS, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';
import { STANDARD_LAYOUT, STANDARD_INPUT, STANDARD_COLORS } from '../constants/standardLayout';
// Logo component removed - using text placeholder
// import authService from '../services/authService'; // Real Supabase
import authService from '../services/mockAuthService'; // Mock (geçici test için)

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

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({
  onBack,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const successScale = useSharedValue(0);

  // Real-time email check (for password reset: need REGISTERED email)
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
        if (result.success) {
          // For password reset: "taken" (registered) = ✅, "available" (not registered) = ❌
          setEmailStatus(result.available ? 'taken' : 'available');
        } else {
          setEmailStatus('idle');
        }
      }, 800);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Hata', 'Geçersiz email adresi');
      return;
    }
    setIsLoading(true);
    const result = await authService.resetPassword(email.trim());
    setIsLoading(false);
    if (result.success) {
      setIsEmailSent(true);
      successScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    } else {
      Alert.alert('Hata', `Şifre sıfırlama başarısız: ${result.error}`);
    }
  };

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
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

              <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {!isEmailSent ? (
                <>
                  {/* [B] BRAND ZONE */}
                  <View style={styles.brandZone}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* [C] PRIMARY ACTION ZONE - SPACER (no social buttons on this screen) */}
                  <View style={styles.socialZoneSpacer} />

                  {/* [D] DIVIDER ZONE - SPACER (no divider on this screen) */}
                  <View style={styles.dividerZoneSpacer} />

                  {/* [E] FORM INPUT ZONE */}
                  <View style={styles.formZone}>
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

                    {/* [G] PRIMARY CTA BUTTON */}
                    <TouchableOpacity
                      style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
                      onPress={handleSendEmail}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.ctaButtonGradient}
                      >
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#FFFFFF" />
                            <Text style={styles.ctaButtonText}>Gönderiliyor...</Text>
                          </View>
                        ) : (
                          <Text style={styles.ctaButtonText}>Şifre Sıfırlama Linki Gönder</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* [F] SECONDARY ACTION LINKS */}
                  <View style={styles.secondaryLinkContainer}>
                    <Text style={styles.secondaryLinkText}>Şifrenizi hatırladınız mı? </Text>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                      <Text style={styles.secondaryLink}>Giriş Yap</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* [B] BRAND ZONE */}
                  <View style={styles.brandZone}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Success Message */}
                  <View style={styles.successContainer}>
                    <Animated.View style={successIconStyle}>
                      <Ionicons name="checkmark-circle" size={64} color="#059669" />
                    </Animated.View>
                    <Text style={styles.successTitle}>Email Gönderildi!</Text>
                    <Text style={styles.successMessage}>
                      Şifre sıfırlama bağlantısı{' '}
                      <Text style={styles.successEmail}>{email}</Text> adresine gönderildi.
                    </Text>

                    <View style={styles.helpBox}>
                      <View style={styles.helpHeader}>
                        <Ionicons name="help-circle-outline" size={16} color="#059669" />
                        <Text style={styles.helpTitle}>Email gelmediyse:</Text>
                      </View>
                      <View style={styles.helpList}>
                        <Text style={styles.helpItem}>• Spam klasörünü kontrol edin</Text>
                        <Text style={styles.helpItem}>• Email adresini doğru yazdığınızdan emin olun</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        setIsEmailSent(false);
                        successScale.value = 0;
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
    paddingTop: 8, // %30 azaltıldı (12 * 0.7)
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 15, // %30 azaltıldı (22 * 0.7 - tahmini üst boşluk)
    marginBottom: 15, // %30 azaltıldı (22 * 0.7 - tahmini alt boşluk)
    paddingVertical: 0,
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  
  // [C] PRIMARY ACTION ZONE - SPACER
  socialZoneSpacer: {
    height: LAYOUT.socialZoneHeight,
  },
  
  // [D] DIVIDER ZONE - SPACER
  dividerZoneSpacer: {
    height: LAYOUT.dividerZoneHeight,
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
    ...STANDARD_INPUT,
  },
  
  // [G] PRIMARY CTA BUTTON
  ctaButton: {
    height: LAYOUT.ctaButtonHeight,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // [F] SECONDARY ACTION LINKS
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
  
  // Success Screen
  successContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  successTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  successEmail: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  helpBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  helpTitle: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  helpList: {
    marginTop: 4,
  },
  helpItem: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  retryButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
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
