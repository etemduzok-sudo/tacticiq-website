import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ALL_BADGES } from '../constants/badges';
import { getUserBadges } from '../services/badgeService';

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
  const [earnedBadges, setEarnedBadges] = useState<Array<{ id: string; name: string; emoji: string; tier: number }>>([]);
  const badgeSlideAnim = useRef(new Animated.Value(-100)).current; // Sol taraftan başlar
  const popupScaleAnim = useRef(new Animated.Value(0)).current;
  const shownBadgeIdsRef = useRef<Set<string>>(new Set()); // Track badges shown in this component instance
  
  // ✅ Kullanıcı bilgilerini yükle
  const [userName, setUserName] = useState('FM');
  const [userDisplayName, setUserDisplayName] = useState('Futbol Aşığı');
  
  // ✅ Her 2 saniyede bir AsyncStorage'ı kontrol et (kullanıcı ayarlardan dönünce güncellensin)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const userDataStr = await AsyncStorage.getItem('fan-manager-user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.name) {
            setUserDisplayName(userData.name);
            // Avatar için isim ve soyisimden ilk harfleri al
            const nameParts = userData.name.trim().split(' ').filter((n: string) => n.length > 0);
            if (nameParts.length >= 2) {
              // İsim ve soyisim varsa her ikisinin ilk harfi
              const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
              setUserName(initials);
            } else if (nameParts.length === 1) {
              // Sadece isim varsa ilk 2 harfi
              setUserName(nameParts[0].substring(0, 2).toUpperCase());
            }
          } else if (userData.username) {
            // Name yoksa username'den al
            setUserDisplayName(userData.username);
            const usernameParts = userData.username.trim().split(' ').filter((n: string) => n.length > 0);
            if (usernameParts.length >= 2) {
              const initials = (usernameParts[0][0] + usernameParts[usernameParts.length - 1][0]).toUpperCase();
              setUserName(initials);
            } else {
              setUserName(userData.username.substring(0, 2).toUpperCase());
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data in ProfileCard:', error);
      }
    };
    
    loadUserData();
    
    // ✅ Her 2 saniyede bir tekrar kontrol et (Settings'den dönünce güncellensin)
    const interval = setInterval(loadUserData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Load earned badges
  useEffect(() => {
    const loadEarnedBadges = async () => {
      try {
        const userBadges = await getUserBadges();
        // Map to match ALL_BADGES structure
        const earned = userBadges.map(badge => {
          const badgeDef = ALL_BADGES.find(b => b.id === badge.id);
          // Convert BadgeTier enum to number (1-5)
          const tierMap: Record<string, number> = {
            'bronze': 1,
            'silver': 2,
            'gold': 3,
            'platinum': 4,
            'diamond': 5,
          };
          const tierNumber = typeof badge.tier === 'string' 
            ? tierMap[badge.tier] || badgeDef?.tier || 1
            : badgeDef?.tier || 1;
          
          return {
            id: badge.id,
            name: badge.name,
            emoji: badge.icon || badgeDef?.emoji || '🏆',
            tier: tierNumber,
          };
        });
        setEarnedBadges(earned);
      } catch (error) {
        console.error('Error loading earned badges:', error);
      }
    };
    
    loadEarnedBadges();
  }, [newBadge]); // Reload when new badge is earned

  // Yeni rozet geldiğinde popup aç (sadece daha önce gösterilmemişse)
  useEffect(() => {
    if (newBadge && !shownBadgeIdsRef.current.has(newBadge.id)) {
      // Mark as shown immediately to prevent duplicate popups
      shownBadgeIdsRef.current.add(newBadge.id);
      
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
            <Text style={styles.avatarText}>{userName}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{userDisplayName}</Text>
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

      {/* Badges - Horizontal Scroll (Only earned badges) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesScroll}
      >
        {earnedBadges.length > 0 ? (
          earnedBadges.map((badge, index) => {
            // Tek kelimeye kısalt
            const shortName = badge.name.split(' ')[0];
            
            // Yeni rozet ise animasyonlu göster
            const isNewBadge = newBadge && newBadge.id === badge.id;
            
            return (
              <Animated.View
                key={badge.id}
                style={[
                  styles.badge,
                  { backgroundColor: `${getBadgeTierColor(badge.tier as 1 | 2 | 3 | 4 | 5)}20` },
                  isNewBadge && {
                    transform: [{ translateX: badgeSlideAnim }],
                  },
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.emoji}</Text>
                <Text style={[styles.badgeLabel, { color: getBadgeTierColor(badge.tier as 1 | 2 | 3 | 4 | 5) }]}>
                  {shortName}
                </Text>
                {isNewBadge && (
                  <View style={styles.newBadgeIndicator}>
                    <Text style={styles.newBadgeText}>YENİ!</Text>
                  </View>
                )}
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.noBadgesContainer}>
            <Text style={styles.noBadgesText}>Henüz rozet yok</Text>
          </View>
        )}
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
    backgroundColor: 'transparent', // ✅ Dikdörtgen container yok, şeffaf
    borderRadius: 0, // ✅ Border radius yok (overlay'de var)
    padding: 12,
    marginHorizontal: 16, // ✅ Yatay margin korundu
    marginTop: 0, // ✅ Üst margin kaldırıldı (overlay padding var)
    marginBottom: 0, // ✅ Alt margin kaldırıldı
    borderWidth: 0, // ✅ Border yok
    borderColor: 'transparent',
    // ✅ Shadow ve elevation kaldırıldı (overlay'de var)
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
    gap: 8,
  },
  noBadgesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noBadgesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
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
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
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
