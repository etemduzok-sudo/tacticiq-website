import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle }) => {
  return (
    <TouchableOpacity
      style={[styles.switch, enabled && styles.switchEnabled]}
      onPress={() => onToggle(!enabled)}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.switchThumb,
          enabled && styles.switchThumbEnabled,
        ]}
      />
    </TouchableOpacity>
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
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flex: 1,
    paddingRight: 16,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Toggle Switch
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  switchEnabled: {
    backgroundColor: '#059669',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  switchThumbEnabled: {
    transform: [{ translateX: 20 }],
  },

  // Details Box
  detailsBox: {
    marginTop: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(5, 150, 105, 0.2)',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Info Card
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoIcon: {
    fontSize: 16,
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

  // Preview Card
  previewCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    marginBottom: 12,
  },
  previewItemMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 0,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  previewTime: {
    fontSize: 11,
    color: '#64748B',
  },
});
