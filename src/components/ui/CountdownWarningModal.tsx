/**
 * Maç başlangıcına yakın tahmin yapma uyarısı popup
 * Maç başlangıcına 120 saniye kala gösterilir
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS } from '../../theme/theme';

type Props = {
  visible: boolean;
  remainingSeconds: number; // Kalan süre (saniye cinsinden, max 120)
  onContinue: () => void;
  onCancel?: () => void;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    borderColor: 'rgba(239, 68, 68, 0.4)',
    overflow: 'hidden',
    padding: 24,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
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
    marginBottom: 16,
  },
  countdownBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
    fontFamily: 'monospace',
  },
  warningText: {
    fontSize: 14,
    color: '#FCA5A5',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'rgba(107, 114, 128, 0.4)',
  },
  btnContinue: {
    backgroundColor: 'rgba(31, 162, 166, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.6)',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export function CountdownWarningModal({
  visible,
  remainingSeconds,
  onContinue,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;

  const [displaySeconds, setDisplaySeconds] = useState(remainingSeconds);

  // Kalan süreyi her saniye güncelle
  useEffect(() => {
    if (!visible) return;
    
    setDisplaySeconds(Math.min(remainingSeconds, 120)); // Max 120 sn
    
    const interval = setInterval(() => {
      setDisplaySeconds(prev => {
        const newValue = Math.max(0, prev - 1);
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, remainingSeconds]);

  if (!visible) return null;

  const displayValue = Math.min(displaySeconds, 120);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={[styles.card, { pointerEvents: 'auto' }, isLight && { backgroundColor: themeColors.popover, borderColor: themeColors.border }]}>
          <View style={styles.iconRow}>
            <Ionicons name="time-outline" size={48} color="#EF4444" />
          </View>
          
          <Text style={[styles.title, isLight && { color: themeColors.foreground }]}>{t('countdownModal.title')}</Text>
          
          <Text style={[styles.message, isLight && { color: themeColors.mutedForeground }]}>
            {t('countdownModal.remainingTime')}:
          </Text>
          
          <View style={[styles.countdownBox, isLight && { borderColor: themeColors.border }]}>
            <Text style={[styles.countdownLabel, isLight && { color: themeColors.mutedForeground }]}>{t('countdownModal.remainingTime')}</Text>
            <Text style={styles.countdownNumber}>{displayValue} sn</Text>
            {displayValue <= 30 && (
              <Text style={[styles.warningText, isLight && { color: '#B91C1C' }]}>
                ⚠️ Çok az süre kaldı!
              </Text>
            )}
          </View>
          
          <Text style={[styles.message, isLight && { color: themeColors.mutedForeground }]}>
            Lütfen tahminlerinizi yapın ya da tamamlayın. Maç başladıktan sonra 2 dakika daha süreniz olacak.
          </Text>
          
          <View style={styles.buttonsRow}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, isLight && { backgroundColor: themeColors.muted }]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnText, isLight && { color: themeColors.foreground }]}>{t('countdownModal.cancel')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnContinue]}
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{t('countdownModal.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
