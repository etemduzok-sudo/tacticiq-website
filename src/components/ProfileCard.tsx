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
import { profileService } from '../services/profileService';
import { UnifiedUserProfile } from '../types/profile.types';

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
  const badgeSlideAnim = useRef(new Animated.Value(-100)).current;
  const popupScaleAnim = useRef(new Animated.Value(0)).current;
  const shownBadgeIdsRef = useRef<Set<string>>(new Set());
  const cardPulseAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ Profil bilgilerini yükle
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [userName, setUserName] = useState('TQ');
  const [userDisplayName, setUserDisplayName] = useState('TacticIQ User');
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [countryRank, setCountryRank] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(1000);
  
  // ✅ Profil verilerini yükle
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userProfile = await profileService.getProfile();
        if (userProfile) {
          setProfile(userProfile);
          
          // İsim ve avatar bilgileri
          const displayName = userProfile.fullName || userProfile.firstName || userProfile.email || 'TacticIQ User';
          setUserDisplayName(displayName);
          
          // Avatar için initials
          const nameParts = displayName.trim().split(' ').filter((n: string) => n.length > 0);
          if (nameParts.length >= 2) {
            const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            setUserName(initials);
          } else if (nameParts.length === 1) {
            setUserName(nameParts[0].substring(0, 2).toUpperCase());
          }
          
          // Puan ve level
          setUserPoints(userProfile.points || 0);
          setUserLevel(userProfile.level || 1);
          
          // Sıralama bilgileri
          setCountryRank(userProfile.countryRank || 0);
          setTotalPlayers(userProfile.totalPlayers || 1000);
        }
      } catch (error) {
        console.error('Error loading profile data in ProfileCard:', error);
      }
    };
    
    loadProfileData();
    
    // Her 5 saniyede bir yeniden yükle
    const interval = setInterval(loadProfileData, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ✅ Kart pulse animasyonu (her 10 saniyede bir)
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(cardPulseAnim, {
          toValue: 1.02,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardPulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 10000);
    
    return () => clearInterval(pulseInterval);
  }, []);
  
  // ✅ Her 2 saniyede bir AsyncStorage'ı kontrol et (fallback - backward compatibility)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const userDataStr = await AsyncStorage.getItem('fan-manager-user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.name) {
            setUserDisplayName(userData.name);
            const nameParts = userData.name.trim().split(' ').filter((n: string) => n.length > 0);
            if (nameParts.length >= 2) {
              const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
              setUserName(initials);
            } else if (nameParts.length === 1) {
              setUserName(nameParts[0].substring(0, 2).toUpperCase());
            }
          } else if (userData.username) {
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
        console.error('Error loading user data from AsyncStorage:', error);
      }
    };
    
    loadUserData();
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
      <Animated.View style={[{ transform: [{ scale: cardPulseAnim }] }]}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {/* Modern gradient background with shadow */}
          <LinearGradient
            colors={['rgba(15, 42, 36, 0.95)', 'rgba(31, 162, 166, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            <View style={styles.profileContainer}>
              <View style={styles.profileLeft}>
                {/* Avatar with glow effect */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#1FA2A6', '#C9A44C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{userName}</Text>
                  </LinearGradient>
                  {profile?.isPro && (
                    <View style={styles.proIndicator}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                    </View>
                  )}
                </View>
                
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.profileName}>{userDisplayName}</Text>
                    {profile?.isPro && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statsRow}>
                    <Ionicons name="trending-up" size={11} color="#1FA2A6" />
                    <Text style={styles.profileStats}>
                      Level {userLevel} • {userPoints.toLocaleString()} Puan
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.profileRight}>
                <View style={styles.rankingCard}>
                  <Text style={styles.rankingLabel}>Türkiye Sıralaması</Text>
                  <View style={styles.rankingValueContainer}>
                    <LinearGradient
                      colors={['#F59E0B', '#C9A44C']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.rankingGradient}
                    >
                      <Ionicons name="trophy" size={12} color="#0F172A" />
                      <Text style={styles.rankingValue}>
                        #{countryRank || '–'} / {totalPlayers.toLocaleString()}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </View>

            {/* Badges - Horizontal Scroll with modern design */}
            <View style={styles.badgesContainer}>
              <View style={styles.badgesHeader}>
                <Ionicons name="ribbon" size={14} color="#C9A44C" />
                <Text style={styles.badgesTitle}>Rozetlerim</Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{earnedBadges.length}</Text>
                </View>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesScroll}
              >
                {earnedBadges.length > 0 ? (
                  earnedBadges.map((badge, index) => {
                    const shortName = badge.name.split(' ')[0];
                    const isNewBadge = newBadge && newBadge.id === badge.id;
                    const tierColor = getBadgeTierColor(badge.tier as 1 | 2 | 3 | 4 | 5);
                    
                    return (
                      <Animated.View
                        key={badge.id}
                        style={[
                          styles.badge,
                          isNewBadge && {
                            transform: [{ translateX: badgeSlideAnim }],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={[`${tierColor}25`, `${tierColor}10`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.badgeGradient}
                        >
                          <View style={[styles.badgeBorder, { borderColor: `${tierColor}60` }]}>
                            <Text style={styles.badgeIcon}>{badge.emoji}</Text>
                            <Text style={[styles.badgeLabel, { color: tierColor }]}>
                              {shortName}
                            </Text>
                            {isNewBadge && (
                              <View style={styles.newBadgeIndicator}>
                                <Text style={styles.newBadgeText}>YENİ!</Text>
                              </View>
                            )}
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    );
                  })
                ) : (
                  <View style={styles.noBadgesContainer}>
                    <Ionicons name="lock-closed" size={16} color="#64748B" />
                    <Text style={styles.noBadgesText}>Henüz rozet yok</Text>
                    <Text style={styles.noBadgesHint}>Tahmin yaparak rozet kazan!</Text>
                  </View>
                )}
              </ScrollView>
            </View>
            
            {/* Bottom accent line */}
            <LinearGradient
              colors={['transparent', '#1FA2A6', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accentLine}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

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
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1FA2A6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(31, 162, 166, 0.25), 0 0 0 1px rgba(31, 162, 166, 0.1)',
      },
    }),
  },
  gradientContainer: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9A44C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(201, 164, 76, 0.4)',
      },
    }),
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    ...Platform.select({
      web: {
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  proIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F2A24',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFB',
    marginRight: 8,
    ...Platform.select({
      web: {
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)',
      },
    }),
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileStats: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  profileRight: {
    alignItems: 'flex-end',
  },
  rankingCard: {
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    minWidth: 140,
  },
  rankingLabel: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankingValueContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  rankingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  rankingValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  badgesContainer: {
    marginTop: 8,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  badgesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E6E6E6',
    marginLeft: 6,
    flex: 1,
  },
  badgeCount: {
    backgroundColor: 'rgba(201, 164, 76, 0.2)',
    borderRadius: 10,
    minWidth: 24,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.4)',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C9A44C',
  },
  badgesScroll: {
    paddingRight: 12,
    gap: 10,
  },
  badge: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  badgeGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    minHeight: 72,
  },
  badgeBorder: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  newBadgeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.6)',
      },
    }),
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  noBadgesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderStyle: 'dashed',
    minWidth: 200,
  },
  noBadgesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 8,
  },
  noBadgesHint: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  accentLine: {
    height: 2,
    marginTop: 12,
    borderRadius: 1,
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
