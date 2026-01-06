import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, OPACITY, SPACING, TYPOGRAPHY, SIZES } from '../theme/theme';
import { AUTH_GRADIENT, PRIMARY_BUTTON_GRADIENT } from '../theme/gradients';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSendResetLink = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    // Simülasyon - gerçek uygulamada API çağrısı yapılır
    setTimeout(() => {
      setIsEmailSent(true);
    }, 1000);
  };

  const handleBackToLogin = () => {
    onBack();
  };

  if (isEmailSent) {
    return (
      <LinearGradient
        {...AUTH_GRADIENT} // Design System compliant
        style={styles.container}
      >
        <View style={styles.successContainer}>
          {/* Başarı İkonu */}
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>

          {/* Başlık */}
          <Text style={styles.successTitle}>E-posta Gönderildi!</Text>

          {/* Açıklama */}
          <Text style={styles.successDescription}>
            Şifre sıfırlama bağlantısı {email} adresine gönderildi. Lütfen e-posta kutunuzu kontrol edin.
          </Text>

          {/* Geri Dön Butonu */}
          <TouchableOpacity onPress={handleBackToLogin} activeOpacity={0.8}>
            <LinearGradient
              {...PRIMARY_BUTTON_GRADIENT} // Design System compliant
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Giriş Sayfasına Dön</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* E-posta Gelmedi? */}
          <TouchableOpacity
            style={styles.resendContainer}
            onPress={() => setIsEmailSent(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.resendText}>
              E-posta gelmediyse{' '}
              <Text style={styles.resendLink}>tekrar gönder</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      {...AUTH_GRADIENT} // Design System compliant
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Geri Butonu */}
          <TouchableOpacity style={styles.backButtonTop} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* İkon ve Başlık */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
            
            <Text style={styles.title}>Şifremi Unuttum</Text>
            <Text style={styles.subtitle}>
              E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
              {/* E-posta Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta Adresi</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isEmailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.emailIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Gönder Butonu */}
              <TouchableOpacity onPress={handleSendResetLink} activeOpacity={0.8}>
                <LinearGradient
                  {...PRIMARY_BUTTON_GRADIENT} // Design System compliant
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>Sıfırlama Bağlantısı Gönder</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Giriş Yap Linki */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>Şifrenizi hatırladınız mı? </Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={styles.loginLink}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },

  // Üst Geri Butonu
  backButtonTop: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    color: BRAND.emerald,
    fontWeight: '300',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },

  // Form
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 14,
    color: BRAND.white,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    gap: 8,
  },
  emailIcon: {
    fontSize: 20,
  },
  inputWrapperFocused: {
    borderColor: BRAND.emerald, // Design System
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: BRAND.white,
    fontWeight: '400',
  },

  // Submit Butonu
  submitButton: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: BRAND.emerald, // Design System
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  submitButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Giriş Linki
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: BRAND.emerald,
    fontSize: 14,
    fontWeight: '700',
  },

  // Başarı Ekranı
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successIcon: {
    marginBottom: 32, // SPACING.xl
  },
  successEmoji: {
    fontSize: 80,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    borderRadius: 12,
    height: 56,
    paddingHorizontal: SPACING.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: BRAND.emerald, // Design System
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  backButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    marginTop: SPACING.md,
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
  },
  resendLink: {
    color: BRAND.emerald,
    fontWeight: '700',
  },
});
