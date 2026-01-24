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

interface FavoriteTeam {
  id: number;
  name: string;
  colors?: string[];
  type?: 'club' | 'national';
}

interface ProfileCardProps {
  onPress: () => void;
  newBadge?: { id: string; name: string; emoji: string; description: string; tier: number } | null;
  onBadgePopupClose?: () => void;
  // Takım filtre için
  favoriteTeams?: FavoriteTeam[];
  selectedTeamIds?: number[];
  onTeamSelect?: (teamId: number | null) => void;
  showTeamFilter?: boolean;
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

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  onPress, 
  newBadge, 
  onBadgePopupClose,
  favoriteTeams = [],
  selectedTeamIds = [],
  onTeamSelect,
  showTeamFilter = false,
}) => {
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
  
  // ✅ Profil verilerini yükle (SINGLE SOURCE OF TRUTH: profileService)
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userProfile = await profileService.getProfile();
        if (userProfile) {
          setProfile(userProfile);
          
          // İsim ve avatar bilgileri - ProfileScreen ile AYNI mantık
          // Öncelik: name > nickname > fullName > firstName > email
          const displayName = userProfile.name || userProfile.nickname || userProfile.fullName || userProfile.firstName || userProfile.email || 'TacticIQ User';
          setUserDisplayName(displayName);
          
          // Avatar için initials
          const nameParts = displayName.trim().split(' ').filter((n: string) => n.length > 0);
          if (nameParts.length >= 2) {
            const initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            setUserName(initials);
          } else if (nameParts.length === 1) {
            setUserName(nameParts[0].substring(0, 2).toUpperCase());
          }
          
          // Puan ve level - totalPoints alanını da kontrol et
          setUserPoints(userProfile.totalPoints || userProfile.points || 0);
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
    
    // Her 3 saniyede bir yeniden yükle (daha hızlı senkronizasyon)
    const interval = setInterval(loadProfileData, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Pulse animasyonu kaldırıldı
  // NOT: AsyncStorage yüklemesi kaldırıldı - profileService tek veri kaynağı olarak kullanılıyor

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
      <View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onPress}
          activeOpacity={1}
        >
          {/* Profile card container with grid pattern */}
            <View style={styles.cardWrapper}>
              {/* Grid Pattern Background */}
              <View style={styles.gridPattern} />
              <View style={styles.whiteCard}>
            <View style={styles.profileContainer}>
              <View style={styles.profileLeft}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userName}</Text>
                  </View>
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
                    <Ionicons name="trending-up" size={11} color="#F79F1B" />
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
                    <View style={styles.rankingGradient}>
                      <Ionicons name="trophy" size={12} color="#F79F1B" />
                      <Text style={styles.rankingValue}>
                        #{countryRank || '–'} / {totalPlayers.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Badges - Horizontal Scroll with modern design */}
            <View style={styles.badgesContainer}>
              <View style={styles.badgesHeader}>
                <Ionicons name="ribbon" size={14} color="#F79F1B" />
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

            {/* ✅ Takım Filtre Barı - Profil kartına entegre */}
            {showTeamFilter && (
              <View style={styles.teamFilterSection}>
                <View style={styles.teamFilterHeader}>
                  <Ionicons name="football" size={14} color="#1FA2A6" />
                  <Text style={styles.teamFilterTitle}>Takımlarım</Text>
                  <View style={styles.teamFilterCount}>
                    <Text style={styles.teamFilterCountText}>{favoriteTeams.length}</Text>
                  </View>
                </View>
                
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teamFilterScroll}
                >
                  {/* Tümü Chip */}
                  <TouchableOpacity
                    style={[
                      styles.teamChip,
                      selectedTeamIds.length === 0 && styles.teamChipActive
                    ]}
                    onPress={() => onTeamSelect?.(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="apps" 
                      size={14} 
                      color={selectedTeamIds.length === 0 ? '#FFFFFF' : '#94A3B8'} 
                    />
                    <Text style={[
                      styles.teamChipText,
                      selectedTeamIds.length === 0 && styles.teamChipTextActive
                    ]}>
                      Tümü
                    </Text>
                  </TouchableOpacity>

                  {/* Favori Takım Chip'leri */}
                  {favoriteTeams.slice(0, 6).map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    return (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamChip,
                          isSelected && styles.teamChipActive,
                          { borderColor: team.colors?.[0] || '#1FA2A6' }
                        ]}
                        onPress={() => onTeamSelect?.(team.id)}
                        activeOpacity={0.8}
                      >
                        {team.colors && team.colors.length > 0 && (
                          <View style={styles.teamChipBadge}>
                            <View style={[styles.teamChipStripe, { backgroundColor: team.colors[0] }]} />
                            {team.colors[1] && (
                              <View style={[styles.teamChipStripe, { backgroundColor: team.colors[1] }]} />
                            )}
                          </View>
                        )}
                        <Text 
                          style={[
                            styles.teamChipText,
                            isSelected && styles.teamChipTextActive
                          ]}
                          numberOfLines={1}
                        >
                          {team.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.teamChipCheck}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Takım yoksa bilgi */}
                  {favoriteTeams.length === 0 && (
                    <View style={styles.noTeamsContainer}>
                      <Ionicons name="heart-outline" size={14} color="#64748B" />
                      <Text style={styles.noTeamsText}>Profilde takım seçin</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

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
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  // Card wrapper with grid pattern background - Üst köşeler düz (ekranın en üstüne kadar)
  cardWrapper: {
    position: 'relative',
    borderTopLeftRadius: 0, // Üst sol köşe düz
    borderTopRightRadius: 0, // Üst sağ köşe düz
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F2A24', // Koyu yeşil taban
  },
  // Grid Pattern Background - Splash screen ile uyumlu (40px, flu)
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  whiteCard: {
    backgroundColor: '#0F2A24', // Koyu yeşil arka plan - eski haline döndürüldü
    borderTopLeftRadius: 0, // Üst köşeler düz
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 44 + 12 : 12, // Safe area + normal padding
    zIndex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F2A24', // Solid dark green instead of turquoise gradient
    borderWidth: 1.5,
    borderColor: 'rgba(15, 42, 36, 0.5)',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  proIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F2A24',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 6,
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  profileStats: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  profileRight: {
    alignItems: 'flex-end',
  },
  rankingCard: {
    backgroundColor: '#1E3A3A',
    padding: 8,
    borderRadius: 10,
    borderWidth: 0,
  },
  rankingLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rankingValueContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  rankingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 3,
  },
  rankingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgesContainer: {
    marginTop: 2,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 4,
    flex: 1,
  },
  badgeCount: {
    backgroundColor: '#F79F1B',
    borderRadius: 8,
    minWidth: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 0,
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgesScroll: {
    paddingRight: 8,
    gap: 8,
  },
  badge: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  badgeGradient: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 50,
  },
  badgeBorder: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  badgeIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  newBadgeIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noBadgesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderStyle: 'dashed',
  },
  noBadgesText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  noBadgesHint: {
    fontSize: 9,
    color: '#64748B',
  },
  // ✅ Takım Filtre Stilleri
  teamFilterSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.15)',
  },
  teamFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamFilterTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    marginLeft: 4,
    flex: 1,
  },
  teamFilterCount: {
    backgroundColor: '#1FA2A6',
    borderRadius: 8,
    minWidth: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  teamFilterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teamFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(75, 85, 99, 0.4)',
  },
  teamChipActive: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  teamChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    maxWidth: 80,
  },
  teamChipTextActive: {
    color: '#FFFFFF',
  },
  teamChipBadge: {
    flexDirection: 'row',
    width: 12,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  teamChipStripe: {
    flex: 1,
    height: '100%',
  },
  teamChipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  noTeamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderStyle: 'dashed',
  },
  noTeamsText: {
    fontSize: 11,
    color: '#64748B',
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
