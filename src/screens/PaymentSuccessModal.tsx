// PaymentSuccessModal.tsx
import React, { useEffect } from 'react';
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
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS } from '../theme/theme';

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  plan: any;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  visible,
  onClose,
  plan,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isWeb && visible) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isWeb ? 1 : scale.value }],
  }));

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
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.iconContainer}
            >
              <Animated.View style={animatedStyle}>
                <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.title, isLight && { color: themeColors.foreground }]}>{t('paymentSuccess.title')}</Text>
          <Text style={[styles.subtitle, isLight && { color: themeColors.mutedForeground }]}>
            {t('paymentSuccess.subtitle')}
          </Text>

          <View style={[styles.detailsContainer, isLight && { backgroundColor: themeColors.muted }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, isLight && { color: themeColors.mutedForeground }]}>{t('paymentSuccess.plan')}</Text>
              <Text style={[styles.detailValue, isLight && { color: themeColors.foreground }]}>{plan?.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, isLight && { color: themeColors.mutedForeground }]}>{t('paymentSuccess.amount')}</Text>
              <Text style={[styles.detailValue, isLight && { color: themeColors.foreground }]}>₺{plan?.price}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, isLight && { color: themeColors.mutedForeground }]}>{t('paymentSuccess.startDate')}</Text>
              <Text style={[styles.detailValue, isLight && { color: themeColors.foreground }]}>{t('paymentSuccess.startNow')}</Text>
            </View>
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={[styles.benefitsTitle, isLight && { color: themeColors.foreground }]}>{t('paymentSuccess.benefitsTitle')}</Text>
            <View style={styles.benefitsList}>
              {[
                t('paymentSuccess.benefitUnlimited'),
                t('paymentSuccess.benefitAdFree'),
                t('paymentSuccess.benefitTournaments'),
                t('paymentSuccess.benefitStats'),
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark" size={16} color="#059669" />
                  <Text style={[styles.benefitText, isLight && { color: themeColors.mutedForeground }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{t('paymentSuccess.buttonGreat')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
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
  detailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
