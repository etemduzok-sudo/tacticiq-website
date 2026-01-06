import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
// CheckBox için custom component kullanacağız

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

  // Rotating ball animation
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedBallStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleSocialRegister = (provider: string) => {
    Alert.alert(
      `${provider} ile Kayıt`,
      'Lütfen bekleyin...',
      [{ text: 'Tamam' }]
    );
    setTimeout(() => {
      onRegisterSuccess();
    }, 1500);
  };

  const handleRegister = () => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir email adresi girin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul etmelisiniz');
      return;
    }

    // Success
    Alert.alert(
      'Kayıt Başarılı!',
      'Hoş geldiniz!',
      [
        {
          text: 'Tamam',
          onPress: () => onRegisterSuccess(),
        },
      ]
    );
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
          <View style={styles.scrollContent}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#059669" />
            </TouchableOpacity>

            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <Ionicons name="shield" size={72} color="#F59E0B" />

                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>Fan Manager 2</Text>
                  <Animated.Text style={[styles.ballEmoji, animatedBallStyle]}>
                    ⚽
                  </Animated.Text>
                  <Text style={styles.titleText}>26</Text>
                </View>

                <Text style={styles.subtitle}>Kayıt Ol</Text>
              </View>

              {/* Social Register Buttons */}
              <View style={styles.socialButtonsContainer}>
                {/* Google Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => handleSocialRegister('Google')}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleButtonContent}>
                    <GoogleIcon />
                    <Text style={styles.googleButtonText}>Google ile Kayıt</Text>
                  </View>
                </TouchableOpacity>

                {/* Apple Button */}
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={() => handleSocialRegister('Apple')}
                  activeOpacity={0.8}
                >
                  <View style={styles.appleButtonContent}>
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>Apple ile Kayıt</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Form */}
              <View style={styles.formContainer}>
                {/* Username Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#059669"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Kullanıcı adı"
                    placeholderTextColor="#64748B"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#059669"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#059669"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Şifre"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
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

                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#059669"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Şifre tekrar"
                    placeholderTextColor="#64748B"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Terms Checkbox */}
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.8}
                    style={styles.checkboxButton}
                  >
                    <View style={[
                      styles.customCheckbox,
                      agreedToTerms && styles.customCheckboxChecked
                    ]}>
                      {agreedToTerms && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.checkboxTextContainer}>
                    <Text style={styles.checkboxText}>
                      <Text 
                        style={styles.linkText}
                        onPress={() => onNavigateToLegal?.('terms')}
                      >
                        Kullanım Koşulları
                      </Text>
                      <Text> ve </Text>
                      <Text 
                        style={styles.linkText}
                        onPress={() => onNavigateToLegal?.('privacy')}
                      >
                        Gizlilik Politikası
                      </Text>
                      <Text>'nı okudum ve kabul ediyorum</Text>
                    </Text>
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.registerButtonGradient}
                  >
                    <Text style={styles.registerButtonText}>Kayıt Ol</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.loginLinkText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                  <Text style={styles.loginLink}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>
              © 2026 Fan Manager. Tüm hakları saklıdır.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Google Icon Component
const GoogleIcon = () => (
  <Ionicons name="logo-google" size={20} color="#4285F4" />
);

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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  content: {
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    height: 148,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'center',
    height: 34,
  },
  titleText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ballEmoji: {
    fontSize: 20,
    marginHorizontal: -2,
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    height: 20,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Social Buttons
  socialButtonsContainer: {
    gap: 10,
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000000',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  appleButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 16,
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

  // Form
  formContainer: {
    gap: 10,
  },
  inputWrapper: {
    position: 'relative',
    height: 50,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 15,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 15,
    zIndex: 1,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 44,
    fontSize: 16,
    color: '#FFFFFF',
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
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748B',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customCheckboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },

  // Register Button
  registerButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  registerButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Login Link
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loginLink: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },

  // Footer
  footer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
