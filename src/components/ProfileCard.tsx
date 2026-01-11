import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ProfileCardProps {
  onPress: () => void;
}

const badges = [
  { id: 'streak', icon: 'flame', label: '5 Seri', color: '#EF4444' },
  { id: 'master', icon: 'trophy', label: 'Usta', color: '#F59E0B' },
  { id: 'target', icon: 'analytics', label: '%85', color: '#059669' },
  { id: 'lightning', icon: 'flash', label: 'Hızlı', color: '#3B82F6' },
];

export const ProfileCard: React.FC<ProfileCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.profileButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.profileContainer}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>FM</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>Futbol Aşığı</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.profileStats}>Level 12 • 2,845 Puan</Text>
          </View>
        </View>
        <View style={styles.profileRight}>
          <Text style={styles.rankingLabel}>Türkiye Sıralaması</Text>
          <Text style={styles.rankingValue}>#156 / 2,365</Text>
        </View>
      </View>

      {/* Badges - Inline */}
      <View style={styles.badgesContainer}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badge}>
            <Ionicons name={badge.icon as any} size={10} color={badge.color} />
            <Text style={[styles.badgeLabel, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFB',
    marginRight: 6,
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileStats: {
    fontSize: 11,
    color: '#94A3B8',
  },
  profileRight: {
    alignItems: 'flex-end',
  },
  rankingLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 1,
  },
  rankingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    gap: 3,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
