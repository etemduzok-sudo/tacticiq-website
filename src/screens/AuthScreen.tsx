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
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, OPACITY, TYPOGRAPHY, SPACING, SIZES } from '../theme/theme';
import { AUTH_GRADIENT, PRIMARY_BUTTON_GRADIENT } from '../theme/gradients';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  onBack?: () => void; // Optional back to language
}

export default function AuthScreen({ onLoginSuccess, onForgotPassword, onRegister, onBack }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = () => {
    // In production, validate and call API
    onLoginSuccess();
  };

  return (
    <LinearGradient
      {...AUTH_GRADIENT} // Design System compliant gradient
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
          {/* BACK BUTTON (if onBack provided) */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backButtonIcon}>←</Text>
            </TouchableOpacity>
          )}

          {/* Logo + Başlık */}
          <View style={styles.header}>
            {/* Shield Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.shield}>
                <View style={styles.shieldInner} />
              </View>
            </View>

            {/* Başlık */}
            <Text style={styles.title}>Fan Manager 2⚽26</Text>
            
            {/* Hoş Geldiniz */}
            <Text style={styles.subtitle}>Hoş Geldiniz</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Sosyal Giriş Butonları (ÖNCE) */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Google ile Giriş</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleButton} activeOpacity={0.8}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleButtonText}>Apple ile Giriş</Text>
            </TouchableOpacity>

            {/* Divider (VEYA) */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* E-posta Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <View style={[
                styles.inputWrapper,
                isEmailFocused && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>✉️</Text>
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

            {/* Şifre Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={[
                styles.inputWrapper,
                isPasswordFocused && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Şifremi Unuttum */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={onForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            {/* Giriş Yap Butonu - Gradient ile */}
            <TouchableOpacity 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                {...PRIMARY_BUTTON_GRADIENT} // Design System compliant gradient
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Kayıt Ol Linki */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Hesabınız yok mu? </Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2026 Fan Manager. Tüm hakları saklıdır.</Text>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  
  // ===== BACK BUTTON =====
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
  
  // ===== GERİ BUTONU =====
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: BRAND.emerald,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ===== HEADER =====
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  shield: {
    width: 70,
    height: 80,
    borderWidth: 3,
    borderColor: BRAND.gold,
    borderRadius: 12,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldInner: {
    width: 52,
    height: 62,
    borderWidth: 2,
    borderColor: BRAND.gold,
    borderRadius: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    opacity: 0.5,
  },
  title: {
    ...TYPOGRAPHY.h2, // 24px, fontWeight: '700'
    color: BRAND.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm, // 8px
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium, // 14px
    color: `rgba(255, 255, 255, ${OPACITY[70]})`, // text-white/70
    textAlign: 'center',
  },
  
  // ===== FORM =====
  formContainer: {
    width: '100%',
  },
  
  // Sosyal Butonlar
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.white,
    borderRadius: SIZES.radiusLg, // 12px (rounded-xl)
    height: SIZES.buttonAuthHeight, // 50px
    marginBottom: SPACING.md, // 12px
  },
  googleIcon: {
    fontSize: 20,
    marginRight: SPACING.sm, // 8px
    fontWeight: '700',
  },
  googleButtonText: {
    color: '#000',
    ...TYPOGRAPHY.button, // 14px, fontWeight: '500'
    fontWeight: '600',
  },
  
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: SIZES.radiusLg, // 12px
    height: SIZES.buttonAuthHeight, // 50px
    marginBottom: SPACING.base, // 16px
  },
  appleIcon: {
    fontSize: 20,
    marginRight: SPACING.sm, // 8px
  },
  appleButtonText: {
    color: BRAND.white,
    ...TYPOGRAPHY.button,
    fontWeight: '600',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.base, // 16px
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `rgba(255, 255, 255, ${OPACITY[20]})`,
  },
  dividerText: {
    color: `rgba(255, 255, 255, ${OPACITY[50]})`,
    ...TYPOGRAPHY.bodyMedium, // 14px
    paddingHorizontal: SPACING.base,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(15, 23, 42, ${OPACITY[50]})`, // bg-[#0F172A]/50 - Design System
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: `rgba(5, 150, 105, ${OPACITY[30]})`, // border-[#059669]/30 - Design System
  },
  inputWrapperFocused: {
    borderColor: BRAND.emerald, // Solid (focus) - Design System
    backgroundColor: 'rgba(15, 23, 42, 0.5)', // Aynı arka plan
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: BRAND.white,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 6,
  },
  eyeIconText: {
    fontSize: 16,
  },
  
  // Şifremi Unuttum
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: BRAND.emerald,
    fontWeight: '500',
  },
  
  // Giriş Yap Butonu
  loginButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // shadow-lg shadow-[#059669]/20 - Design System
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10, // Android için
  },
  loginButtonText: {
    color: BRAND.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Kayıt Ol
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  registerLink: {
    color: BRAND.emerald,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Footer
  footer: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '400',
  },
});
