import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ALL_BADGES } from '../constants/badges';

interface ProfileCardProps {
  onPress: () => void;
  newBadge?: { id: string; name: string; emoji: string; description: string; tier: number } | null;
  onBadgePopupClose?: () => void;
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

export const ProfileCard: React.FC<ProfileCardProps> = ({ onPress, newBadge, onBadgePopupClose }) => {
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const badgeSlideAnim = useRef(new Animated.Value(-100)).current; // Sol taraftan başlar
  const popupScaleAnim = useRef(new Animated.Value(0)).current;

  // Yeni rozet geldiğinde popup aç
  useEffect(() => {
    if (newBadge) {
      setShowBadgePopup(true);
      // Popup scale animasyonu
      Animated.spring(popupScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Rozet kartına slide animasyonu (soldan sağa)
      Animated.timing(badgeSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [newBadge]);

  const handleClosePopup = () => {
    Animated.timing(popupScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowBadgePopup(false);
      if (onBadgePopupClose) onBadgePopupClose();
    });
  };

  return (
    <>
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
        {ALL_BADGES.map((badge, index) => {
          // Tek kelimeye kısalt
          const shortName = badge.name.split(' ')[0];
          
          // Yeni rozet ise animasyonlu göster
          const isNewBadge = newBadge && newBadge.id === badge.id;
          
          return (
            <Animated.View
              key={badge.id}
              style={[
                styles.badge,
                { backgroundColor: `${getBadgeTierColor(badge.tier)}20` },
                isNewBadge && {
                  transform: [{ translateX: badgeSlideAnim }],
                },
              ]}
            >
              <Text style={styles.badgeIcon}>{badge.emoji}</Text>
              <Text style={[styles.badgeLabel, { color: getBadgeTierColor(badge.tier) }]}>
                {shortName}
              </Text>
              {isNewBadge && (
                <View style={styles.newBadgeIndicator}>
                  <Text style={styles.newBadgeText}>YENİ!</Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    </TouchableOpacity>

      {/* 🎉 Yeni Rozet Popup Modal */}
      <Modal
        visible={showBadgePopup}
        transparent
        animationType="none"
        onRequestClose={handleClosePopup}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.badgePopupCard,
              {
                transform: [{ scale: popupScaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.badgePopupGradient}
            >
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
                <Ionicons name="close-circle" size={32} color="#F59E0B" />
              </TouchableOpacity>

              {/* Badge Icon */}
              <View style={styles.popupBadgeIcon}>
                <Text style={styles.popupBadgeEmoji}>{newBadge?.emoji}</Text>
              </View>

              {/* Congrats Text */}
              <Text style={styles.congratsText}>🎉 Tebrikler!</Text>
              <Text style={styles.badgeNamePopup}>{newBadge?.name}</Text>
              <Text style={styles.badgeDescriptionPopup}>{newBadge?.description}</Text>

              {/* Tier Badge */}
              <View style={[styles.tierBadgePopup, { backgroundColor: newBadge ? getBadgeTierColor(newBadge.tier as 1 | 2 | 3 | 4 | 5) : '#9CA3AF' }]}>
                <Text style={styles.tierTextPopup}>Tier {newBadge?.tier}</Text>
              </View>

              {/* Continue Button */}
              <TouchableOpacity style={styles.continueButton} onPress={handleClosePopup}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.continueButtonText}>Devam Et</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </>
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
  newBadgeIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 🎉 Badge Popup Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  badgePopupCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgePopupGradient: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  popupBadgeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  popupBadgeEmoji: {
    fontSize: 60,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 10,
  },
  badgeNamePopup: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeDescriptionPopup: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tierBadgePopup: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  tierTextPopup: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
