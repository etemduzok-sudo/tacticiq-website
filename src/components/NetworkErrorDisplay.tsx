/**
 * Ağ/bağlantı hatası gösterimi – üst bar + orta overlay (internet hatası ile aynı stil)
 * Diğer hatalarda da bu bileşen kullanılabilir.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BANNER_HEIGHT = 32;

type NetworkErrorDisplayProps = {
  /** Üst bar ve overlay'de gösterilecek ana mesaj */
  mainMessage?: string;
  /** Overlay alt metni */
  subMessage?: string;
  /** Geri / Kapat butonu metni */
  buttonText?: string;
  /** Buton tıklanınca */
  onButtonPress?: () => void;
};

const DEFAULT_MAIN = 'Veriler yüklenemedi';
const DEFAULT_SUB = 'İnternet bağlantınızı kontrol edin.';

export function NetworkErrorDisplay({
  mainMessage = DEFAULT_MAIN,
  subMessage = DEFAULT_SUB,
  buttonText = 'Geri Dön',
  onButtonPress,
}: NetworkErrorDisplayProps) {
  return (
    <View style={styles.container}>
      {/* Üst bar */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{subMessage}</Text>
      </View>
      {/* Orta overlay */}
      <View style={styles.overlayWrapper}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(18, 45, 38, 0.9)', 'rgba(28, 55, 47, 0.86)']}
            style={styles.cardGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.mainText}>{mainMessage}</Text>
            <Text style={styles.subText}>{subMessage}</Text>
            {onButtonPress && (
              <TouchableOpacity onPress={onButtonPress} style={styles.button} activeOpacity={0.8}>
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

export const NETWORK_ERROR_BANNER_HEIGHT = BANNER_HEIGHT;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    height: BANNER_HEIGHT,
    backgroundColor: 'rgba(100, 116, 139, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bannerText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '500',
  },
  overlayWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: 280,
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  cardGradient: {
    paddingVertical: 32,
    paddingHorizontal: 28,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainText: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  subText: {
    color: 'rgba(241, 245, 249, 0.78)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
