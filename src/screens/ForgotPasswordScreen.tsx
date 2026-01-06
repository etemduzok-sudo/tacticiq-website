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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({
  onBack,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Success icon scale animation
  const successScale = useSharedValue(0);

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      alert('Geçersiz email adresi\nLütfen geçerli bir email adresi girin.');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsEmailSent(true);
    
    // Animate success icon
    successScale.value = withSpring(1, {
      damping: 10,
      stiffness: 200,
    });
  };

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#059669" />
            </TouchableOpacity>

            <Animated.View entering={FadeIn.duration(300)} style={styles.content}>
              {!isEmailSent ? (
                <>
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
                    
                    <Text style={styles.subtitle}>Şifre Sıfırlama</Text>
                  </View>

                  {/* Spacer (matches social buttons height on register) */}
                  <View style={styles.spacer} />

                  {/* Form */}
                  <View style={styles.formContainer}>
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

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        isLoading && styles.submitButtonDisabled,
                      ]}
                      onPress={handleSendEmail}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitButtonGradient}
                      >
                        {isLoading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>
                              Gönderiliyor...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.submitButtonText}>
                            Şifre Sıfırlama Linki Gönder
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Back to Login */}
                  <View style={styles.backToLoginContainer}>
                    <Text style={styles.backToLoginText}>
                      Şifrenizi hatırladınız mı?{' '}
                    </Text>
                    <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                      <Text style={styles.backToLoginLink}>Giriş Yap</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
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
                    
                    <Text style={styles.subtitle}>Şifre Sıfırlama</Text>
                  </View>

                  {/* Success Message */}
                  <View style={styles.successContainer}>
                    <Animated.View style={successIconStyle}>
                      <Ionicons
                        name="checkmark-circle"
                        size={64}
                        color="#059669"
                      />
                    </Animated.View>

                    <Text style={styles.successTitle}>Email Gönderildi!</Text>
                    
                    <Text style={styles.successMessage}>
                      Şifre sıfırlama bağlantısı{' '}
                      <Text style={styles.successEmail}>{email}</Text> adresine
                      gönderildi.
                    </Text>

                    {/* Help Box */}
                    <View style={styles.helpBox}>
                      <View style={styles.helpHeader}>
                        <Ionicons
                          name="help-circle-outline"
                          size={16}
                          color="#059669"
                        />
                        <Text style={styles.helpTitle}>Email gelmediyse:</Text>
                      </View>
                      <View style={styles.helpList}>
                        <Text style={styles.helpItem}>• Spam klasörünü kontrol edin</Text>
                        <Text style={styles.helpItem}>
                          • Email adresini doğru yazdığınızdan emin olun
                        </Text>
                      </View>
                    </View>

                    {/* Retry Button */}
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

            {/* Footer */}
            <Text style={styles.footer}>
              © 2026 Fan Manager. Tüm hakları saklıdır.
            </Text>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  content: {
    flex: 1,
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

  // Spacer (matches social buttons + divider height = 146px: 2x50px buttons + 10px gap + 12px marginBottom + 24px divider)
  spacer: {
    height: 146,
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
  input: {
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Submit Button
  submitButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Back to Login
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  backToLoginLink: {
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

  // Help Box
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

  // Retry Button
  retryButton: {
    width: '100%',
    height: 50,
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

  // Footer
  footer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
