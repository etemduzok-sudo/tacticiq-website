import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ALL_BADGES } from '../constants/badges';

interface ProfileCardProps {
  onPress: () => void;
}

// Helper: Badge tier'a göre renk döndür
const getBadgeTierColor = (tier: 1 | 2 | 3 | 4 | 5): string => {
  switch (tier) {
    case 1: return '#10B981'; // Çaylak - Yeşil
    case 2: return '#3B82F6'; // Amatör - Mavi
    case 3: return '#F59E0B'; // Profesyonel - Turuncu
    case 4: return '#EF4444'; // Uzman - Kırmızı
    case 5: return '#8B5CF6'; // Efsane - Mor
    default: return '#9CA3AF';
  }
};

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

      {/* Badges - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {ALL_BADGES.map((badge) => {
          // Tek kelimeye kısalt
          const shortName = badge.name.split(' ')[0];
          
          return (
            <View 
              key={badge.id} 
              style={[
                styles.badge, 
                { backgroundColor: `${getBadgeTierColor(badge.tier)}20` } // %12 opacity
              ]}
            >
              <Text style={styles.badgeIcon}>{badge.emoji}</Text>
              <Text style={[styles.badgeLabel, { color: getBadgeTierColor(badge.tier) }]}>
                {shortName}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
  badgesScroll: {
    paddingRight: 12,
    gap: 10,
  },
  badge: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60, // Sabit genişlik
    height: 60, // Sabit yükseklik
    borderRadius: 12,
    // backgroundColor dinamik olarak set ediliyor (tier renginin %12'si)
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
