// Maintenance Screen
// TacticIQ - Maintenance Mode UI

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, SPACING, TYPOGRAPHY } from '../theme/theme';
import { MAINTENANCE_CONFIG, APP_VERSION } from '../config/AppVersion';

interface MaintenanceScreenProps {
  message?: string;
  estimatedEndTime?: string | null;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message = MAINTENANCE_CONFIG.message,
  estimatedEndTime = MAINTENANCE_CONFIG.estimatedEndTime,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#020617']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="construct-outline" size={80} color={BRAND.emerald} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Bakım Modu</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Estimated End Time */}
          {estimatedEndTime && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={20} color="#94A3B8" />
              <Text style={styles.timeText}>
                Tahmini Bitiş: {new Date(estimatedEndTime).toLocaleString('tr-TR')}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.emerald} />
            <Text style={styles.loadingText}>Sistem güncelleniyor...</Text>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color={BRAND.emerald} />
              <Text style={styles.infoCardTitle}>Güvenlik</Text>
              <Text style={styles.infoCardText}>
                Verileriniz güvende ve korunuyor
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="rocket" size={24} color={BRAND.gold} />
              <Text style={styles.infoCardTitle}>Yenilikler</Text>
              <Text style={styles.infoCardText}>
                Yeni özellikler ekleniyor
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="speedometer" size={24} color={BRAND.emerald} />
              <Text style={styles.infoCardTitle}>Performans</Text>
              <Text style={styles.infoCardText}>
                Daha hızlı ve stabil
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              TacticIQ {APP_VERSION.current}
            </Text>
            <Text style={styles.footerSubtext}>
              Anlayışınız için teşekkür ederiz 🙏
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // DARK_MODE background
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.base,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: SPACING.base,
  },
  infoCards: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginBottom: SPACING['2xl'],
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoCardText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: SPACING.xs,
  },
});

export default MaintenanceScreen;
