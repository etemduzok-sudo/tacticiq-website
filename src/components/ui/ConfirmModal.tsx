/**
 * Uygulama içi onay / uyarı popup (tarayıcı confirm/alert yerine).
 * TacticIQ dark tema, Modal + overlay + kart.
 */

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E3A3A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
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
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(107, 114, 128, 0.4)',
  },
  btnDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  btnDefault: {
    backgroundColor: 'rgba(31, 162, 166, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.6)',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={isProcessing ? undefined : onRequestClose}
          disabled={isProcessing}
        />
        <View style={[styles.card, { pointerEvents: 'auto' }]}>
          <View style={styles.iconRow}>
            <Ionicons name="warning" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonsRow}>
            {buttons.map((b, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  b.style === 'cancel' && styles.btnCancel,
                  b.style === 'destructive' && styles.btnDestructive,
                  (!b.style || b.style === 'default') && styles.btnDefault,
                  isProcessing && { opacity: 0.5 }, // ✅ Disabled görünümü
                ]}
                onPress={async () => {
                  // ✅ Çift tıklama koruması
                  if (isProcessing) return;
                  setIsProcessing(true);
                  
                  try {
                    const result = b.onPress();
                    if (result instanceof Promise) {
                      await result;
                    }
                  } catch (error) {
                    console.error('Button onPress error:', error);
                  } finally {
                    setIsProcessing(false);
                    onRequestClose?.();
                  }
                }}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                <Text
                  style={[
                    styles.btnText,
                    b.style === 'destructive' && styles.btnTextDestructive,
                  ]}
                >
                  {isProcessing && b.style === 'destructive' ? 'İşleniyor...' : b.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
