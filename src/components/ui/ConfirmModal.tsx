/**
 * Uygulama içi onay / uyarı popup (tarayıcı confirm/alert yerine).
 * Birleşik popup stili: koyu kart (#0F1F1F), Vazgeç/Tamam butonları standart.
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { showAlert } from '../../utils/alertHelper';
import { Ionicons } from '@expo/vector-icons';

export type ConfirmButton = {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress: () => void | Promise<void>;
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttons: ConfirmButton[];
  onRequestClose?: () => void;
};

// ✅ Resim 6/7 ile aynı birleşik popup stili (Tahminler Silinecek, Tahmini Sil vb.)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F1F1F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.35)',
    overflow: 'hidden',
    padding: 24,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  btnDefault: {
    backgroundColor: 'rgba(31, 162, 166, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.5)',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnTextCancel: {
    color: '#94A3B8',
  },
  btnTextDestructive: {
    color: '#FCA5A5',
  },
});

export function ConfirmModal({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
}: Props) {
  // ✅ Loading state - çift tıklama koruması
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  // ✅ Modal kapandığında state'i sıfırla
  React.useEffect(() => {
    if (!visible) {
      setIsProcessing(false);
    }
  }, [visible]);
  
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={isProcessing ? undefined : onRequestClose}
      >
        <TouchableOpacity
          style={styles.cardWrap}
          activeOpacity={1}
          onPress={(e: any) => e?.stopPropagation?.()}
        >
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <Ionicons name="warning" size={44} color="#F59E0B" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonsRow}>
              {buttons.map((b, i) => {
                const isCancel = b.style === 'cancel';
                const isDestructive = b.style === 'destructive';
                const isDefault = !b.style || b.style === 'default';
                return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                    isDefault && styles.btnDefault,
                    isProcessing && { opacity: 0.5 },
                  ]}
                  onPress={async () => {
                    if (isProcessing) return;
                    if (isCancel) {
                      b.onPress();
                      return;
                    }
                    setIsProcessing(true);
                    try {
                      const result = b.onPress();
                      if (result instanceof Promise) await result;
                      onRequestClose?.();
                    } catch (error: any) {
                      console.error('Button onPress error:', error);
                      showAlert(
                        'Hata',
                        error?.message || 'İşlem sırasında bir hata oluştu.',
                        [{ text: 'Tamam', style: 'default', onPress: () => onRequestClose?.() }]
                      );
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                    ]}
                  >
                    {isProcessing && isDestructive ? 'İşleniyor...' : b.text}
                  </Text>
                </TouchableOpacity>
              );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
