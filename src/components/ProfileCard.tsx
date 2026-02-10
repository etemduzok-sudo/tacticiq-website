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
import { getUserBadges, getCachedBadges } from '../services/badgeService';
import { profileService } from '../services/profileService';
import { UnifiedUserProfile } from '../types/profile.types';
import { getTeamColors } from '../utils/teamColors';
import { useTranslation } from '../hooks/useTranslation';
import { getCountryRankingLabel } from '../utils/countryUtils';
import { getDeviceCountryCode } from '../utils/deviceCountry';

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
  const { t } = useTranslation();
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  
  // ✅ Rozetleri cache'den anında başlat (2 aşamalı yükleme önleme)
  const getInitialBadges = () => {
    const cached = getCachedBadges();
    if (cached.length === 0) return [];
    const earnedIds = new Set(cached.map(b => b.id));
    return ALL_BADGES
      .filter(badgeDef => earnedIds.has(badgeDef.id))
      .map(badgeDef => ({
        id: badgeDef.id,
        name: badgeDef.name,
        emoji: badgeDef.emoji,
        tier: badgeDef.tier,
      }));
  };
  
  const [earnedBadges, setEarnedBadges] = useState<Array<{ id: string; name: string; emoji: string; tier: number }>>(getInitialBadges);
  const [badgesLoading, setBadgesLoading] = useState(getInitialBadges().length === 0); // ✅ Cache varsa loading=false
  const badgeSlideAnim = useRef(new Animated.Value(-100)).current;
  const popupScaleAnim = useRef(new Animated.Value(0)).current;
  const shownBadgeIdsRef = useRef<Set<string>>(new Set());
  const cardPulseAnim = useRef(new Animated.Value(1)).current;
  
  // ✅ Profil bilgilerini yükle - ANINDA cache'den başlat (2 aşamalı yükleme önleme)
  // Helper: Profil'den state değerlerini çıkar
  const extractProfileData = (userProfile: UnifiedUserProfile | null) => {
    if (!userProfile) {
      return { displayName: 'TacticIQ User', initials: 'TQ', level: 1, points: 0, rank: 0, total: 1000, isPro: false };
    }
    const displayName = userProfile.name || userProfile.nickname || userProfile.fullName || userProfile.firstName || userProfile.email || 'TacticIQ User';
    const nameParts = displayName.trim().split(' ').filter((n: string) => n.length > 0);
    let initials = 'TQ';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0].substring(0, 2).toUpperCase();
    }
    return {
      displayName,
      initials,
      level: userProfile.level || 1,
      points: userProfile.totalPoints || userProfile.points || 0,
      rank: userProfile.countryRank || 0,
      total: userProfile.totalPlayers || 1000,
      isPro: userProfile.isPro || false,
    };
  };
  
  // ✅ Senkron cache'den başlangıç değerlerini al (boş görünme önlenir)
  const cachedProfile = profileService.getCachedProfile();
  const initialData = extractProfileData(cachedProfile);
  
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(cachedProfile);
  const [userName, setUserName] = useState(initialData.initials);
  const [userDisplayName, setUserDisplayName] = useState(initialData.displayName);
  const [userLevel, setUserLevel] = useState(initialData.level);
  const [userPoints, setUserPoints] = useState(initialData.points);
  const [countryRank, setCountryRank] = useState(initialData.rank);
  const [totalPlayers, setTotalPlayers] = useState(initialData.total);
  
  // ✅ Profil verilerini yükle (SINGLE SOURCE OF TRUTH: profileService)
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userProfile = await profileService.getProfile();
        if (userProfile) {
          setProfile(userProfile);
          const data = extractProfileData(userProfile);
          setUserDisplayName(data.displayName);
          setUserName(data.initials);
          setUserPoints(data.points);
          setUserLevel(data.level);
          setCountryRank(data.rank);
          setTotalPlayers(data.total);
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

  // Load earned badges - ProfileScreen ile aynı mantık
  useEffect(() => {
    const loadEarnedBadges = async () => {
      try {
        const userBadges = await getUserBadges();
        const earnedIds = new Set(userBadges.map(b => b.id));
        
        // ✅ Tüm rozetleri ALL_BADGES'den al, earned durumunu kontrol et
        // Sadece kazanılmış olanları göster (ProfileScreen'den farklı)
        const earned = ALL_BADGES
          .filter(badgeDef => earnedIds.has(badgeDef.id))
          .map(badgeDef => ({
            id: badgeDef.id,
            name: t(`badges.names.${badgeDef.id}`, { defaultValue: badgeDef.name }),
            emoji: badgeDef.emoji,
            tier: badgeDef.tier,
          }));
        
        setEarnedBadges(earned);
      } catch (error) {
        console.error('Error loading earned badges:', error);
      } finally {
        setBadgesLoading(false); // ✅ Yükleme tamamlandı
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
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }).start();

      // Rozet kartına slide animasyonu (soldan sağa)
      Animated.timing(badgeSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
      }).start();
    }
  }, [newBadge]);

  const handleClosePopup = () => {
    Animated.timing(popupScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
    }).start(() => {
      setShowBadgePopup(false);
      if (onBadgePopupClose) onBadgePopupClose();
    });
  };

  return (
    <>
      <View>
        <View style={styles.profileButton}>
          {/* Profile card container with grid pattern */}
            <View style={styles.cardWrapper}>
              {/* Grid Pattern Background */}
              <View style={styles.gridPattern} />
              <View style={styles.whiteCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={1} style={{ flex: 1 }}>
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
                      {t('profile.level', { defaultValue: 'Level' })} {userLevel} • {userPoints.toLocaleString()} {t('profile.points', { defaultValue: 'Puan' })}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.profileRight}>
                <View style={styles.rankingCard}>
                  <Text style={styles.rankingLabel}>
                    {t(`profile.countryRanking.${getDeviceCountryCode()?.toUpperCase() || 'TR'}`, { 
                      defaultValue: getCountryRankingLabel(getDeviceCountryCode()) 
                    })}
                  </Text>
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
                <Text style={styles.badgesTitle}>{t('badges.myBadges')}</Text>
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{earnedBadges.length}</Text>
                </View>
              </View>
              
              {earnedBadges.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.badgesScroll}
                >
                  {earnedBadges.map((badge, index) => {
                    // i18n'den badge ismini çek, yoksa fallback olarak badge.name kullan
                    const badgeName = t(`badges.names.${badge.id}`, { defaultValue: badge.name });
                    const shortName = badgeName.split(' ')[0];
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
                                <Text style={styles.newBadgeText}>{t('common.new', { defaultValue: 'YENİ!' })}</Text>
                              </View>
                            )}
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              ) : badgesLoading ? (
                // ✅ Yüklenirken placeholder rozetler göster (sıçrama önleme)
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.badgesScroll}
                  scrollEnabled={false}
                >
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <View
                      key={`placeholder-${index}`}
                      style={[styles.badgeItem, { opacity: 0.3 }]}
                    >
                      <View style={[styles.badgeGradient, { backgroundColor: 'rgba(100, 116, 139, 0.2)' }]}>
                        <View style={[styles.badgeBorder, { borderColor: 'rgba(100, 116, 139, 0.3)' }]}>
                          <Text style={styles.badgeIcon}>🏆</Text>
                          <Text style={[styles.badgeLabel, { color: '#64748B' }]}>...</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noBadgesWrapper}>
                  <View style={styles.noBadgesContainer}>
                    <View style={styles.noBadgesIconWrapper}>
                      <LinearGradient
                        colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                        style={styles.noBadgesIconGradient}
                      >
                        <Ionicons name="trophy" size={20} color="#F59E0B" />
                      </LinearGradient>
                    </View>
                    <View style={styles.noBadgesTextContainer}>
                      <Text style={styles.noBadgesText}>{t('badges.comingSoon')}</Text>
                      <Text style={styles.noBadgesHint}>{t('badges.earnByPredicting')}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
            </TouchableOpacity>

            {/* ✅ Takım Filtre Barı - Modern pill tasarımı */}
            {showTeamFilter && favoriteTeams.length > 0 && (
              <View style={styles.teamFilterSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.teamFilterScroll}
                >
                  {/* Tümü Pill */}
                  <TouchableOpacity
                    style={[
                      styles.teamFilterChip,
                      selectedTeamIds.length === 0 && styles.teamFilterChipActive,
                    ]}
                    onPress={() => onTeamSelect?.(null)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.teamChipIconWrap,
                      selectedTeamIds.length === 0 && { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}>
                      <Ionicons 
                        name="apps" 
                        size={12} 
                        color={selectedTeamIds.length === 0 ? '#FFFFFF' : '#64748B'} 
                      />
                    </View>
                    <Text style={[
                      styles.teamFilterChipText,
                      selectedTeamIds.length === 0 && styles.teamFilterChipTextActive,
                    ]}>
                      {t('common.all')}
                    </Text>
                  </TouchableOpacity>

                  {/* Favori Takım Pill'leri */}
                  {favoriteTeams.map((team) => {
                    const isSelected = selectedTeamIds.includes(team.id);
                    const colors = getTeamColors(team.name);
                    return (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamFilterChip,
                          isSelected && {
                            backgroundColor: `${colors[0]}22`,
                            borderColor: colors[0],
                          },
                        ]}
                        onPress={() => onTeamSelect?.(team.id)}
                        activeOpacity={0.7}
                      >
                        {/* Takım renk rozeti - dikey iki şerit */}
                        <View style={[
                          styles.teamChipBadge,
                          isSelected && { 
                            borderWidth: 1.5,
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                        ]}>
                          <View style={[styles.teamChipStripe, { backgroundColor: colors[0] }]} />
                          <View style={[styles.teamChipStripe, { backgroundColor: colors[1] }]} />
                        </View>
                        <Text 
                          style={[
                            styles.teamFilterChipText,
                            isSelected && { color: '#F1F5F9' },
                          ]} 
                          numberOfLines={1}
                        >
                          {team.name.length > 13 ? team.name.substring(0, 11) + '..' : team.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.teamChipCheck, { backgroundColor: colors[0] }]}>
                            <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            </View>
          </View>
        </View>
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
              <Text style={styles.congratsText}>🎉 {t('badges.congrats')}</Text>
              <Text style={styles.badgeNamePopup}>{newBadge ? t(`badges.names.${newBadge.id}`, { defaultValue: newBadge.name }) : ''}</Text>
              <Text style={styles.badgeDescriptionPopup}>{newBadge ? t(`badges.descriptions.${newBadge.id}`, { defaultValue: newBadge.description }) : ''}</Text>

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
                  <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
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
  // Card wrapper - takım filtresi dahil
  cardWrapper: {
    position: 'relative',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F2A24',
    // maxHeight kaldırıldı - takım filtresi barı için alan gerekli
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
    minHeight: 70, // ✅ Sabit minimum yükseklik - sıçrama önleme
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
  noBadgesWrapper: {
    width: '100%',
  },
  noBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    width: '100%',
  },
  noBadgesIconWrapper: {
    marginRight: 10,
  },
  noBadgesIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  noBadgesTextContainer: {
    flex: 1,
  },
  noBadgesText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 2,
  },
  noBadgesHint: {
    fontSize: 9,
    color: '#94A3B8',
  },
  // ✅ Takım Filtre Stilleri - Modern pill tasarım
  teamFilterSection: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.1)',
  },
  teamFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
    paddingBottom: 2,
  },
  teamFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  teamFilterChipActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderColor: '#1FA2A6',
  },
  teamFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    maxWidth: 90,
  },
  teamFilterChipTextActive: {
    color: '#FFFFFF',
  },
  teamChipIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamChipBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  teamChipStripe: {
    flex: 1,
    height: '100%',
  },
  teamChipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
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
