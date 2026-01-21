/**
 * Change Password Modal Component (Mobile)
 * Web'deki ChangePasswordModal ile aynı işlevsellik
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { theme, SPACING, TYPOGRAPHY, SIZES } from '../../theme/theme';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!oldPassword) {
      Alert.alert('Hata', 'Mevcut şifrenizi girin');
      return false;
    }

    if (!newPassword) {
      Alert.alert('Hata', 'Yeni şifrenizi girin');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
      return false;
    }

    if (newPassword === oldPassword) {
      Alert.alert('Hata', 'Yeni şifre eskisiyle aynı olamaz');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { supabase } = await import('../../config/supabase');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi', [
        {
          text: 'Tamam',
          onPress: () => {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.modalContent}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons name="lock-closed" size={24} color={theme.primary} />
              </View>
              <Text style={styles.title}>Şifre Değiştir</Text>
              <Text style={styles.description}>
                Güvenliğiniz için şifrenizi düzenli olarak değiştirin.
              </Text>
            </View>

            {/* Mevcut Şifre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mevcut Şifre</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Mevcut şifrenizi girin"
                  secureTextEntry={!showOldPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowOldPassword(!showOldPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showOldPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Yeni Şifre */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Yeni şifrenizi girin"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {newPassword && (
                <View style={styles.requirements}>
                  <Text
                    style={[
                      styles.requirementText,
                      newPassword.length >= 6 && styles.requirementTextValid,
                    ]}
                  >
                    {newPassword.length >= 6 ? '✓' : '✗'} En az 6 karakter
                  </Text>
                </View>
              )}
            </View>

            {/* Şifre Tekrar */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre Tekrar</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Yeni şifrenizi tekrar girin"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && (
                <Text
                  style={[
                    styles.matchText,
                    newPassword === confirmPassword && styles.matchTextValid,
                  ]}
                >
                  {newPassword === confirmPassword
                    ? '✓ Şifreler eşleşiyor'
                    : '✗ Şifreler eşleşmiyor'}
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primary + 'DD']}
                  style={styles.submitButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.primaryForeground} />
                  ) : (
                    <Text style={styles.submitButtonText}>Şifreyi Değiştir</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.foreground,
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.base,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    paddingVertical: SPACING.sm,
    minHeight: SIZES.inputHeight,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  requirements: {
    marginTop: SPACING.xs,
  },
  requirementText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.destructive,
  },
  requirementTextValid: {
    color: '#059669',
  },
  matchText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.destructive,
    marginTop: SPACING.xs,
  },
  matchTextValid: {
    color: '#059669',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    backgroundColor: theme.muted,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.button,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
  },
  submitButton: {
    flex: 1,
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.buttonHeight,
  },
  submitButtonText: {
    ...TYPOGRAPHY.button,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.primaryForeground,
  },
};
