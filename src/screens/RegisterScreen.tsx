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
import { AUTH_GRADIENT } from '../theme/gradients';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onBack }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const handleRegister = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul etmelisiniz.');
      return;
    }

    // Success - call handler
    onRegisterSuccess();
  };

  const handleSocialRegister = (provider: string) => {
    Alert.alert('Bilgi', `${provider} ile kayıt yakında eklenecek!`);
  };

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
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>

            {/* Logo ve Başlık */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.shield}>
                  <View style={styles.shieldInner} />
                </View>
              </View>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>Fan Manager'a katılın</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Sosyal Kayıt Butonları */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => handleSocialRegister('Google')}
                activeOpacity={0.8}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Google ile Kayıt Ol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.appleButton}
                onPress={() => handleSocialRegister('Apple')}
                activeOpacity={0.8}
              >
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleButtonText}>Apple ile Kayıt Ol</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Ad Soyad */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <View
                  style={[styles.inputWrapper, isNameFocused && styles.inputWrapperFocused]}
                >
                  <SafeIcon name="person" size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="Adınız Soyadınız"
                    placeholderTextColor="#999"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                  />
                </View>
              </View>

              {/* E-posta */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta</Text>
                <View
                  style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}
                >
                  <SafeIcon name="mail" size={20} color="#999" />
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
                  />
                </View>
              </View>

              {/* Şifre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View
                  style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}
                >
                  <SafeIcon name="lock-closed" size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <SafeIcon
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Şifre Tekrar */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre Tekrar</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isConfirmPasswordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <SafeIcon name="lock-closed" size={20} color="#999" />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <SafeIcon
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Kullanım Koşulları Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
                >
                  {acceptTerms && (
                    <SafeIcon name="checkmark" size={16} color={BRAND.white} />
                  )}
                </View>
                <Text style={styles.checkboxText}>
                  <Text style={styles.termsLink} onPress={() => navigation.navigate('LegalDocuments')}>
                    Kullanım Koşulları
                  </Text>
                  {' '}ve{' '}
                  <Text style={styles.termsLink} onPress={() => navigation.navigate('LegalDocuments')}>
                    Gizlilik Politikası
                  </Text>
                  'nı kabul ediyorum
                </Text>
              </TouchableOpacity>

              {/* Kayıt Ol Butonu */}
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.8}>
                <LinearGradient
                  {...PRIMARY_BUTTON_GRADIENT} // Design System compliant
                  style={styles.registerButton}
                >
                  <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Giriş Yap Linki */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={onBack}>
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
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },

  // Geri Butonu
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonIcon: {
    fontSize: 28,
    color: BRAND.emerald, // Yeşil ok
    fontWeight: '300',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  shield: {
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: BRAND.gold,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldInner: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: BRAND.gold,
    borderRadius: 30,
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Form
  formContainer: {
    width: '100%',
  },

  // Sosyal Butonlar
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 50,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA4335',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 50,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  appleIcon: {
    fontSize: 20,
    color: BRAND.white,
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginHorizontal: SPACING.md,
  },

  // Input
  inputGroup: {
    marginBottom: SPACING.md,
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
    paddingHorizontal: SPACING.md,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    gap: SPACING.sm,
  },
  inputWrapperFocused: {
    borderColor: BRAND.emerald, // Design System
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: BRAND.white,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND.emerald,
    borderColor: BRAND.emerald,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  termsLink: {
    color: BRAND.emerald,
    fontWeight: '600',
  },

  // Register Butonu
  registerButton: {
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
  registerButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: BRAND.emerald,
    fontSize: 14,
    fontWeight: '700',
  },
});
