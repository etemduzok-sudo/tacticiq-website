import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ScreenLayout, StandardHeader } from '../components/layouts';
import { textStyles, cardStyles, buttonStyles, inputStyles } from '../utils/styleHelpers';
import { SPACING, COLORS, SIZES, TYPOGRAPHY } from '../theme/theme';
import { useTranslation } from '../hooks/useTranslation';

interface DeleteAccountScreenProps {
  onBack: () => void;
  onDeleteConfirm: () => void;
}

export const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({
  onBack,
  onDeleteConfirm,
}) => {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handleDelete = () => {
    const confirmWord = (t('deleteAccount.confirmWord') || 'sil').toLowerCase().trim();
    if (confirmText.toLowerCase().trim() !== confirmWord) {
      Alert.alert(t('common.error'), t('deleteAccount.typeSilToConfirm'));
      return;
    }

    setShowFinalConfirm(true);
  };

  const handleFinalConfirm = () => {
    setShowFinalConfirm(false);
    // Direkt hesap silme işlemini çağır - modal'da zaten onay alındı
    setTimeout(() => {
      onDeleteConfirm();
    }, 100);
  };

  const isDeleteEnabled = confirmText.toLowerCase().trim() === (t('deleteAccount.confirmWord') || 'sil').toLowerCase().trim();

  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader
        title="Hesabı Sil"
        onBack={onBack}
      />

      {/* Content */}
          {/* Warning Card */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.warningTitle}>Dikkat!</Text>
                <Text style={styles.warningSubtitle}>Bu işlem geri alınamaz</Text>
              </View>
            </View>

            <Text style={styles.warningDescription}>
              Hesabınızı sildiğinizde aşağıdaki veriler{' '}
              <Text style={styles.warningBold}>kalıcı olarak</Text> silinecektir:
            </Text>

            <View style={styles.dataList}>
              {[
                'Tüm tahminleriniz ve istatistikleriniz',
                'Seviye, puan ve rozetleriniz',
                'Favori takımlarınız',
                'Profil bilgileriniz',
                'PRO üyeliğiniz (varsa)',
              ].map((item, index) => (
                <View key={index} style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataText}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Alternative Options Card */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <Text style={styles.cardTitle}>Alternatif Seçenekler</Text>

            <View style={styles.optionsContainer}>
              <View style={styles.optionBox}>
                <Text style={styles.optionTitle}>Sadece veri silmek isterseniz</Text>
                <Text style={styles.optionDescription}>
                  Tahminlerinizi ve istatistiklerinizi sıfırlayabilirsiniz
                </Text>
              </View>

              <View style={styles.optionBox}>
                <Text style={styles.optionTitle}>Mola vermek isterseniz</Text>
                <Text style={styles.optionDescription}>
                  Bildirimleri kapatıp daha sonra geri dönebilirsiniz
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Confirmation Input Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.cardTitle, styles.cardTitleRed]}>
                Hesabı Kalıcı Olarak Sil
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Devam etmek için <Text style={styles.labelBold}>SIL</Text> yazın
              </Text>
              <TextInput
                style={styles.input}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="SIL"
                placeholderTextColor="#64748B"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningBoxText}>
                Bu işlem <Text style={styles.warningBoxBold}>geri alınamaz</Text> ve
                tüm verileriniz kalıcı olarak silinecektir.
              </Text>
            </View>
          </Animated.View>

          {/* Delete Button */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                !isDeleteEnabled && styles.deleteButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={!isDeleteEnabled}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Hesabı Kalıcı Olarak Sil</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Safety Net Info */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.infoTitle}>Güvenlik</Text>
            </View>
            <Text style={styles.infoText}>
              Hesap silme işlemi güvenliğiniz için 30 gün süreyle askıya alınır. Bu
              süre içinde geri dönmek isterseniz destek ekibimizle iletişime
              geçebilirsiniz.
            </Text>
          </Animated.View>

      {/* Final Confirmation Modal */}
      <Modal
        visible={showFinalConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinalConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn} style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={SIZES.iconLg} color={COLORS.dark.error} />
            </View>

            <Text style={styles.modalTitle}>Son Onay</Text>
            <Text style={styles.modalMessage}>
              Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowFinalConfirm(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleFinalConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonConfirmText}>Evet, Sil</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Warning Card
  warningCard: {
    backgroundColor: `${COLORS.dark.error}20`,
    borderWidth: 2,
    borderColor: `${COLORS.dark.error}50`,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: 16,
  },
  warningIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningSubtitle: {
    fontSize: 14,
    color: '#EF4444',
  },
  warningDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: 'bold',
  },

  // Data List
  dataList: {
    gap: SPACING.sm,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  dataDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark.error,
    marginTop: 6,
  },
  dataText: {
    flex: 1,
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    lineHeight: 20,
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
    marginBottom: SPACING.base,
  },
  cardTitleRed: {
    color: COLORS.dark.error,
    marginBottom: 0,
  },

  // Alternative Options
  optionsContainer: {
    gap: SPACING.md,
  },
  optionBox: {
    padding: SPACING.base,
    backgroundColor: `${COLORS.dark.foreground}10`,
    borderRadius: SPACING.md,
  },
  optionTitle: {
    ...textStyles.body,
    fontWeight: '500',
    color: COLORS.dark.foreground,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    ...textStyles.secondary,
    lineHeight: 18,
  },

  // Input Group
  inputGroup: {
    marginBottom: SPACING.base,
  },
  label: {
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.sm,
  },
  labelBold: {
    fontWeight: 'bold',
    color: COLORS.dark.foreground,
  },
  input: {
    ...inputStyles.inputContainer,
    height: SIZES.inputAuthHeight,
    backgroundColor: COLORS.dark.input,
    borderColor: `${COLORS.dark.error}50`,
    fontWeight: '600',
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: `${COLORS.dark.warning}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.warning}40`,
    borderRadius: SPACING.sm,
  },
  warningBoxText: {
    flex: 1,
    ...textStyles.secondary,
    lineHeight: 18,
  },
  warningBoxBold: {
    fontWeight: 'bold',
    color: COLORS.dark.foreground,
  },

  // Delete Button
  deleteButton: {
    ...buttonStyles.primaryButton,
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.dark.error,
    marginBottom: SPACING.lg,
  },
  deleteButtonDisabled: {
    backgroundColor: `${COLORS.dark.error}80`,
    opacity: 0.5,
  },
  deleteButtonText: {
    ...buttonStyles.primaryButtonText,
  },

  // Info Card
  infoCard: {
    padding: SPACING.base,
    backgroundColor: `${COLORS.dark.primary}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.primary}40`,
    borderRadius: SPACING.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    ...textStyles.label,
    color: COLORS.dark.foreground,
  },
  infoText: {
    ...textStyles.secondary,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  modalContent: {
    backgroundColor: COLORS.dark.card,
    borderRadius: SIZES.radiusLg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.dark.error}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  modalTitle: {
    ...textStyles.title,
    fontSize: TYPOGRAPHY.h3.fontSize,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...textStyles.body,
    color: COLORS.dark.mutedForeground,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    height: SIZES.buttonLgHeight + 8,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    ...buttonStyles.secondaryButtonText,
  },
  modalButtonConfirm: {
    flex: 1,
    height: SIZES.buttonLgHeight + 8,
    borderRadius: SIZES.radiusLg,
    backgroundColor: COLORS.dark.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    ...buttonStyles.primaryButtonText,
  },
});
