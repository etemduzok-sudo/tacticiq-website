// PaymentFailedModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../theme/theme';

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

interface PaymentFailedModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const PaymentFailedModal: React.FC<PaymentFailedModalProps> = ({
  visible,
  onClose,
  onRetry,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={isWeb ? undefined : FadeIn} style={[styles.container, isLight && { backgroundColor: themeColors.popover }]}>
          <Animated.View entering={isWeb ? undefined : ZoomIn.delay(200)}>
            <View style={styles.iconContainer}>
              <Ionicons name="close-circle" size={64} color="#EF4444" />
            </View>
          </Animated.View>

          <Text style={[styles.title, isLight && { color: themeColors.foreground }]}>Ödeme Başarısız</Text>
          <Text style={[styles.subtitle, isLight && { color: themeColors.mutedForeground }]}>
            Üzgünüz, ödeme işleminiz gerçekleştirilemedi.
          </Text>

          <View style={[styles.reasonsContainer, isLight && { backgroundColor: themeColors.muted }]}>
            <Text style={[styles.reasonsTitle, isLight && { color: themeColors.foreground }]}>Olası Nedenler:</Text>
            <View style={styles.reasonsList}>
              {[
                'Yetersiz bakiye',
                'Kart bilgileri hatalı',
                'Bağlantı sorunu',
                'İşlem limiti aşıldı',
              ].map((reason, index) => (
                <View key={index} style={styles.reasonItem}>
                  <Text style={styles.reasonBullet}>•</Text>
                  <Text style={[styles.reasonText, isLight && { color: themeColors.mutedForeground }]}>{reason}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, isLight && { color: themeColors.foreground }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  reasonsContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reasonBullet: {
    fontSize: 14,
    color: '#EF4444',
  },
  reasonText: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
