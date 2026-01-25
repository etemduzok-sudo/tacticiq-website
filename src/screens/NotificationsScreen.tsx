import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ScreenLayout, StandardHeader } from '../components/layouts';
import { containerStyles, textStyles, cardStyles } from '../utils/styleHelpers';
import { SPACING, COLORS } from '../theme/theme';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
}) => {
  const [matchReminders, setMatchReminders] = useState(true);
  const [teamNews, setTeamNews] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleToggle = (type: string, value: boolean) => {
    switch (type) {
      case 'match':
        setMatchReminders(value);
        break;
      case 'team':
        setTeamNews(value);
        break;
      case 'stats':
        setWeeklyStats(value);
        break;
      case 'email':
        setEmailNotifications(value);
        break;
    }

    Alert.alert('Başarılı', 'Bildirim ayarları güncellendi');
  };

  return (
    <ScreenLayout safeArea scrollable>
      <StandardHeader
        title="Bildirimler"
        onBack={onBack}
      />

      {/* Content */}
          {/* Match Reminders Card */}
          <Animated.View entering={FadeInDown.delay(0)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Maç Bildirimleri</Text>
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationTitle}>Maç Hatırlatıcıları</Text>
                <Text style={styles.notificationSubtitle}>
                  Favori takımlarınızın maçlarından önce bildirim alın
                </Text>
              </View>
              <ToggleSwitch
                enabled={matchReminders}
                onToggle={(value) => handleToggle('match', value)}
              />
            </View>

            {/* Match Reminder Details */}
            {matchReminders && (
              <View style={styles.detailsBox}>
                <View style={styles.detailItem}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailText}>Maçtan 1 saat önce</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailText}>Maç başladığında</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailText}>Maç bittiğinde</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Team News Card */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Takım Haberleri</Text>
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationTitle}>Takım Güncellemeleri</Text>
                <Text style={styles.notificationSubtitle}>
                  Favori takımlarınız hakkında transfer ve haberler
                </Text>
              </View>
              <ToggleSwitch
                enabled={teamNews}
                onToggle={(value) => handleToggle('team', value)}
              />
            </View>
          </Animated.View>

          {/* Weekly Stats Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>İstatistikler</Text>
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationTitle}>Haftalık Özet</Text>
                <Text style={styles.notificationSubtitle}>
                  Haftalık performans özetinizi her Pazartesi alın
                </Text>
              </View>
              <ToggleSwitch
                enabled={weeklyStats}
                onToggle={(value) => handleToggle('stats', value)}
              />
            </View>
          </Animated.View>

          {/* Email Notifications Card */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail-outline" size={20} color="#059669" />
              <Text style={styles.cardTitle}>E-posta Bildirimleri</Text>
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationLeft}>
                <Text style={styles.notificationTitle}>E-posta ile Bildir</Text>
                <Text style={styles.notificationSubtitle}>
                  Bildirimleri e-posta olarak da alın
                </Text>
              </View>
              <ToggleSwitch
                enabled={emailNotifications}
                onToggle={(value) => handleToggle('email', value)}
              />
            </View>
          </Animated.View>

          {/* Info Card */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoTitle}>İpucu:</Text>
            </View>
            <Text style={styles.infoText}>
              Bildirim ayarlarınızı cihaz ayarlarından da yönetebilirsiniz.
            </Text>
          </Animated.View>

          {/* Notification Preview Card */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.previewCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
              <Text style={styles.cardTitle}>Bildirim Önizleme</Text>
            </View>

            <View style={styles.previewItem}>
              <View style={styles.previewIcon}>
                <Ionicons name="trophy" size={20} color="#059669" />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>Galatasaray - Fenerbahçe</Text>
                <Text style={styles.previewSubtitle}>Maç 1 saat içinde başlıyor!</Text>
                <Text style={styles.previewTime}>Şimdi</Text>
              </View>
            </View>

            <View style={[styles.previewItem, styles.previewItemMuted]}>
              <View style={styles.previewIcon}>
                <Ionicons name="newspaper" size={20} color="#3B82F6" />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>Transfer Haberi</Text>
                <Text style={styles.previewSubtitle}>
                  Galatasaray yeni transferini açıkladı
                </Text>
                <Text style={styles.previewTime}>2 saat önce</Text>
              </View>
            </View>
          </Animated.View>
    </ScreenLayout>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle }) => {
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withTiming(enabled ? 20 : 0, { duration: 200 }) }],
    };
  });

  return (
    <TouchableOpacity
      style={[styles.switch, enabled && styles.switchEnabled]}
      onPress={() => onToggle(!enabled)}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          thumbAnimatedStyle,
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Card
  card: {
    ...cardStyles.card,
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
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
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flex: 1,
    paddingRight: SPACING.base,
  },
  notificationTitle: {
    ...textStyles.body,
    fontWeight: '500',
    color: COLORS.dark.foreground,
    marginBottom: SPACING.xs,
  },
  notificationSubtitle: {
    ...textStyles.secondary,
    lineHeight: 18,
  },

  // Toggle Switch
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151', // Daha görünür kapalı durum rengi
    padding: 2,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4B5563', // Border ile daha belirgin
  },
  switchEnabled: {
    backgroundColor: COLORS.dark.primary,
    borderColor: COLORS.dark.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF', // Beyaz thumb daha görünür
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    }),
  },

  // Details Box
  detailsBox: {
    marginTop: SPACING.base,
    paddingLeft: SPACING.base,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.dark.primary,
    opacity: 0.2,
    gap: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.dark.mutedForeground,
  },
  detailText: {
    ...textStyles.secondary,
  },

  // Info Card
  infoCard: {
    backgroundColor: `${COLORS.dark.info}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.info}40`,
    borderRadius: SPACING.md,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoTitle: {
    ...textStyles.label,
    color: COLORS.dark.foreground,
  },
  infoText: {
    ...textStyles.secondary,
    lineHeight: 18,
  },

  // Preview Card
  previewCard: {
    ...cardStyles.card,
    backgroundColor: COLORS.dark.card,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: `${COLORS.dark.primary}20`,
    borderWidth: 1,
    borderColor: `${COLORS.dark.primary}40`,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewItemMuted: {
    backgroundColor: `${COLORS.dark.foreground}10`,
    borderColor: COLORS.dark.border,
    marginBottom: 0,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: SPACING.sm,
    backgroundColor: `${COLORS.dark.foreground}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: COLORS.dark.foreground,
    marginBottom: SPACING.xs,
  },
  previewSubtitle: {
    ...textStyles.secondary,
    marginBottom: SPACING.xs,
  },
  previewTime: {
    ...textStyles.caption,
  },
});
