// PaymentOptionsModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { PaymentFailedModal } from './PaymentFailedModal';

const { height } = Dimensions.get('window');

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

interface PaymentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPlan: any;
}

const paymentMethods = [
  {
    id: 'google-pay',
    name: 'Google Pay',
    icon: 'logo-google',
    description: 'Hızlı ve güvenli ödeme',
    color: '#EA4335',
  },
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    icon: 'logo-apple',
    description: 'Apple cihazlar için',
    color: '#000000',
  },
];

export const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedPlan,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failedModalVisible, setFailedModalVisible] = useState(false);

  const handlePayment = () => {
    if (!selectedMethod) return;

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);

      // Simulate 90% success rate
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        setSuccessModalVisible(true);
      } else {
        setFailedModalVisible(true);
      }
    }, 2000);
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    onSuccess();
    onClose();
  };

  const handleFailedClose = () => {
    setFailedModalVisible(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View entering={isWeb ? undefined : FadeIn} style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Ödeme Yöntemi Seç</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Plan Summary */}
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.1)', 'transparent']}
              style={styles.planSummary}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{selectedPlan?.title} Plan</Text>
                <Text style={styles.planPrice}>₺{selectedPlan?.price}</Text>
              </View>
              {selectedPlan?.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{selectedPlan.savings}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Payment Methods */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Ödeme Yöntemleri</Text>

              {paymentMethods.map((method, index) => (
                <Animated.View
                  key={method.id}
                  entering={isWeb ? undefined : FadeInDown.delay(index * 50)}
                >
                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      selectedMethod === method.id && styles.paymentMethodSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.methodIcon,
                        { backgroundColor: `${method.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={method.color}
                      />
                    </View>

                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>
                        {method.description}
                      </Text>
                    </View>

                    {selectedMethod === method.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#059669"
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}

              {/* Security Info */}
              <View style={styles.securityInfo}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={styles.securityText}>
                  256-bit SSL şifreleme ile güvenli ödeme
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomButton}>
              <TouchableOpacity
                style={[
                  styles.payButton,
                  !selectedMethod && styles.payButtonDisabled,
                ]}
                onPress={handlePayment}
                disabled={!selectedMethod || processing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedMethod
                      ? ['#F59E0B', '#D97706']
                      : ['#64748B', '#475569']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payButtonGradient}
                >
                  {processing ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.payButtonText}>İşleniyor...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>
                        ₺{selectedPlan?.price} Öde
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <PaymentSuccessModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        plan={selectedPlan}
      />

      {/* Failed Modal */}
      <PaymentFailedModal
        visible={failedModalVisible}
        onClose={handleFailedClose}
        onRetry={() => {
          setFailedModalVisible(false);
          handlePayment();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Plan Summary
  planSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  savingsBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Payment Methods
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#059669',
    flex: 1,
  },

  // Bottom Button
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
