import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenLayout, StandardHeader } from '../components/layouts';
import { textStyles, inputStyles, buttonStyles, cardStyles } from '../utils/styleHelpers';
import { SPACING, COLORS, BRAND, SIZES, TYPOGRAPHY } from '../theme/theme';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { STORAGE_KEYS } from '../config/constants';
import { useTranslation } from '../hooks/useTranslation';

interface ChangePasswordScreenProps {
  onBack: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onBack,
}) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Get user email from AsyncStorage
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserEmail(userData.email || null);
        }
      } catch (error) {
        logger.error('Error loading user email', { error }, 'CHANGE_PASSWORD');
      }
    };
    loadUserEmail();
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('changePassword.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('changePassword.newPasswordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('changePassword.newPasswordsDontMatch'));
      return;
    }

    if (!userEmail) {
      Alert.alert(t('common.error'), t('changePassword.userNotFound'));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.changePassword(currentPassword, newPassword, userEmail);
      
      if (result.success) {
    Alert.alert(
      'Başarılı',
      'Şifre başarıyla değiştirildi! ✓\nYeni şifrenizle giriş yapabilirsiniz.',
      [
        {
          text: 'Tamam',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => onBack(), 500);
          },
        },
      ]
    );
      } else {
        Alert.alert(t('common.error'), result.error || t('changePassword.passwordChangeFailed'));
      }
    } catch (error: any) {
      logger.error('Change password error', { error }, 'CHANGE_PASSWORD');
      Alert.alert(t('common.error'), error.message || t('changePassword.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (newPassword.length < 6) return { color: '#64748B', text: '' };
    if (newPassword.length < 10) return { color: '#F59E0B', text: 'Orta' };
    return { color: '#059669', text: 'Güçlü' };
  };

  const strength = getPasswordStrength();
  const isPasswordLengthValid = newPassword.length >= 6;
  const isPasswordMatch = newPassword === confirmPassword && newPassword !== '';

  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader
        title="Şifre Değiştir"
        onBack={onBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
            {/* Current Password Card */}
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(0)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={20} color="#059669" />
                <Text style={styles.cardTitle}>Mevcut Şifre</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mevcut Şifreniz</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifrenizi girin"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* New Password Card */}
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(100)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={20} color="#059669" />
                <Text style={styles.cardTitle}>Yeni Şifre</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Yeni Şifreniz</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="En az 6 karakter"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && (
                  <Text style={[styles.strengthText, { color: strength.color }]}>
                    {strength.text}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Şifre Tekrarı</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Yeni şifrenizi tekrar girin"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Requirements */}
              <View style={styles.requirementsBox}>
                <Text style={styles.requirementsTitle}>Şifre gereksinimleri:</Text>
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        isPasswordLengthValid && styles.requirementDotActive,
                      ]}
                    />
                    <Text style={styles.requirementText}>En az 6 karakter</Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <View
                      style={[
                        styles.requirementDot,
                        isPasswordMatch && styles.requirementDotActive,
                      ]}
                    />
                    <Text style={styles.requirementText}>Şifreler eşleşmeli</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(200)}>
              <TouchableOpacity 
                onPress={handleSubmit} 
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Şifreyi Değiştir</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Security Tips */}
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(300)} style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.tipsTitle}>Güvenlik İpuçları</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Büyük ve küçük harf kullanın</Text>
                <Text style={styles.tipItem}>• Rakam ve özel karakter ekleyin</Text>
                <Text style={styles.tipItem}>
                  • Başka hesaplarda kullandığınız şifreleri kullanmayın
                </Text>
              </View>
            </Animated.View>
        </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // KeyboardAvoidingView
  keyboardView: {
    flex: 1,
  },

  // Card
  card: {
    ...cardStyles.card,
    backgroundColor: COLORS.dark.card,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...textStyles.label,
    color: COLORS.dark.foreground,
  },

  // Input
  inputGroup: {
    marginBottom: SPACING.base,
  },
  label: {
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    ...inputStyles.inputContainer,
    height: SIZES.inputAuthHeight,
    backgroundColor: COLORS.dark.input,
    borderColor: COLORS.dark.primary,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: 15,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthText: {
    ...textStyles.secondary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },

  // Requirements Box
  requirementsBox: {
    padding: SPACING.md,
    backgroundColor: `${COLORS.dark.foreground}10`,
    borderRadius: SPACING.sm,
  },
  requirementsTitle: {
    ...textStyles.secondary,
    fontWeight: '600',
    color: COLORS.dark.foreground,
    marginBottom: SPACING.sm,
  },
  requirementsList: {
    gap: SPACING.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark.mutedForeground,
  },
  requirementDotActive: {
    backgroundColor: COLORS.dark.primary,
  },
  requirementText: {
    ...textStyles.secondary,
  },

  // Submit Button
  submitButton: {
    ...buttonStyles.primaryButton,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  submitButtonText: {
    ...buttonStyles.primaryButtonText,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },

  // Tips Box
  tipsBox: {
    padding: SPACING.base,
    backgroundColor: `${COLORS.dark.info}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.info}40`,
    borderRadius: SPACING.md,
    marginTop: SPACING.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tipsTitle: {
    ...textStyles.label,
    color: COLORS.dark.foreground,
  },
  tipsList: {
    gap: SPACING.xs,
  },
  tipItem: {
    ...textStyles.secondary,
    lineHeight: 18,
  },
});
