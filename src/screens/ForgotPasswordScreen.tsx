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
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import authService from '../services/authService';

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Animasyonlar kaldırıldı (sıçrama yok)

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
      Alert.alert(t('common.error'), t('forgotPassword.invalidEmail'));
      return;
    }
    setIsLoading(true);
    const result = await authService.resetPassword(email.trim());
    setIsLoading(false);
    if (result.success) {
      setIsEmailSent(true);
    } else {
      Alert.alert(t('common.error'), `${t('forgotPassword.resetFailed')}: ${result.error}`);
    }
  };

  // Animasyonlar kaldırıldı (sıçrama yok)

  const mainContent = (
    <>
      <View style={styles.gridPattern} />
      <TouchableOpacity style={[styles.backButtonTop, isLight && { backgroundColor: themeColors.muted, borderColor: themeColors.border }]} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={isLight ? themeColors.foreground : WEBSITE_BRAND_COLORS.white} />
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.screenContainer}>
          <View style={styles.contentWrapper}>
            <View style={styles.content}>
              {!isEmailSent ? (
                <>
                  <View style={styles.brandZone}>
                    {Platform.OS === 'web' ? <img src="/TacticIQ.svg" alt="TacticIQ" style={{ width: 180, height: 180 }} /> : <Image source={require('../../assets/logo.png')} style={{ width: 180, height: 180 }} resizeMode="contain" />}
                  </View>
                  <View style={styles.socialZoneSpacer} />
                  <View style={styles.dividerZoneSpacer} />
                  <View style={styles.formZone}>
                    <View style={[styles.inputWrapper, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                      <Ionicons name="mail-outline" size={20} color={isLight ? themeColors.ring : '#059669'} style={styles.inputIcon} />
                      <TextInput style={[styles.input, emailStatus === 'available' && styles.inputSuccess, emailStatus === 'taken' && styles.inputError, isLight && { color: themeColors.foreground }]} placeholder={t('auth.email')} placeholderTextColor={isLight ? themeColors.mutedForeground : '#64748B'} value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                      {emailStatus !== 'idle' && <View style={styles.statusIndicator}>{emailStatus === 'checking' && <Text style={styles.checkingText}>⏳</Text>}{emailStatus === 'available' && <Text style={styles.availableText}>✅</Text>}{emailStatus === 'taken' && <Text style={styles.takenText}>❌</Text>}</View>}
                    </View>
                    <TouchableOpacity style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]} onPress={handleSendEmail} disabled={isLoading} activeOpacity={0.8}>
                      <LinearGradient colors={[WEBSITE_BRAND_COLORS.secondary, WEBSITE_BRAND_COLORS.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButtonGradient}>
                        {isLoading ? <View style={styles.loadingContainer}><ActivityIndicator color="#FFFFFF" /><Text style={styles.ctaButtonText}>{t('forgotPassword.sending')}</Text></View> : <Text style={styles.ctaButtonText}>{t('forgotPassword.sendResetLink')}</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.secondaryLinkContainer}>
                    <Text style={[styles.secondaryLinkText, isLight && { color: themeColors.mutedForeground }]}>{t('forgotPassword.rememberPassword')} </Text>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                      <Text style={[styles.secondaryLink, isLight && { color: themeColors.ring }]}>{t('forgotPassword.login')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.brandZone}>
                    <Image source={Platform.OS === 'web' ? { uri: '/TacticIQ.svg' } : require('../../assets/logo.png')} style={{ width: 180, height: 180 }} resizeMode="contain" />
                  </View>
                  <View style={[styles.successContainer, isLight && { backgroundColor: themeColors.card }]}>
                    <Ionicons name="checkmark-circle" size={64} color={isLight ? themeColors.ring : '#059669'} />
                    <Text style={[styles.successTitle, isLight && { color: themeColors.foreground }]}>{t('forgotPassword.emailSentTitle')}</Text>
                    <Text style={[styles.successMessage, isLight && { color: themeColors.mutedForeground }]}>{t('forgotPassword.emailSentMessage', { email })}</Text>
                    <View style={[styles.helpBox, isLight && { backgroundColor: themeColors.muted }]}>
                      <View style={styles.helpHeader}>
                        <Ionicons name="help-circle-outline" size={16} color={isLight ? themeColors.ring : '#059669'} />
                        <Text style={[styles.helpTitle, isLight && { color: themeColors.foreground }]}>{t('forgotPassword.emailNotReceived')}</Text>
                      </View>
                      <View style={styles.helpList}>
                        <Text style={[styles.helpItem, isLight && { color: themeColors.mutedForeground }]}>• {t('forgotPassword.checkSpam')}</Text>
                        <Text style={[styles.helpItem, isLight && { color: themeColors.mutedForeground }]}>• {t('forgotPassword.checkAddress')}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={[styles.retryButton, isLight && { backgroundColor: themeColors.ring }]} onPress={() => setIsEmailSent(false)} activeOpacity={0.8}>
                      <Text style={styles.retryButtonText}>{t('forgotPassword.retry')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
          <View style={styles.footerZone}>
            <Text style={[styles.footer, isLight && { color: themeColors.mutedForeground }]}>{t('auth.allRightsReserved')}</Text>
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
    backgroundColor: '#0F172A',
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
    borderWidth: 1,
    borderColor: `rgba(31, 162, 166, ${0.2})`,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: WDS_SPACING.xl + WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
  },
  contentWrapper: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
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
    color: 'rgba(255, 255, 255, 0.8)', // Daha okunabilir
    fontWeight: '500',
  },
  secondaryLink: {
    fontSize: 15, // Biraz daha büyük
    color: WEBSITE_BRAND_COLORS.white, // Beyaz renk
    fontWeight: '700', // Daha kalın
    textDecorationLine: 'underline', // Altı çizili
  },
  
  // Success Screen
  successContainer: {
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
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
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
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
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
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
