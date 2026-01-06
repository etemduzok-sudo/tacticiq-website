import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

interface DeleteAccountScreenProps {
  onBack: () => void;
  onDeleteConfirm: () => void;
}

export const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({
  onBack,
  onDeleteConfirm,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const handleDelete = () => {
    if (confirmText.toLowerCase() !== 'sil') {
      Alert.alert('Hata', 'Lütfen "SIL" yazarak onaylayın');
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

  const isDeleteEnabled = confirmText.toLowerCase() === 'sil';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hesabı Sil</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

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
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 96,
  },

  // Warning Card
  warningCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 8,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dataDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginTop: 6,
  },
  dataText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardTitleRed: {
    color: '#EF4444',
    marginBottom: 0,
  },

  // Alternative Options
  optionsContainer: {
    gap: 12,
  },
  optionBox: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Input Group
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  labelBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  warningBoxBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Delete Button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    marginBottom: 24,
  },
  deleteButtonDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.5)',
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Info Card
  infoCard: {
    padding: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
