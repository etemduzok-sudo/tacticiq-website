import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, FadeIn } from 'react-native-reanimated';
import { AdBanner } from '../components/ads/AdBanner';
import { usersDb, predictionsDb } from '../services/databaseService';
import { STORAGE_KEYS } from '../config/constants';
import ScoringEngine from '../logic/ScoringEngine';
import { AnalysisCluster } from '../types/prediction.types';
import { getAllAvailableBadges, getUserBadges } from '../services/badgeService';
import { Badge, getBadgeColor, getBadgeTierName } from '../types/badges.types';
import { ALL_BADGES, BadgeDefinition, getBadgeById } from '../constants/badges';

interface ProfileScreenProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade: () => void;
  onDatabaseTest?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onSettings,
  onProUpgrade,
  onDatabaseTest,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  
  // 🏆 BADGE SYSTEM STATE
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  
  // ⚽ FAVORITE TEAMS STATE
  const [favoriteTeams, setFavoriteTeams] = useState<Array<{ id: number; name: string; logo: string }>>([]);
  
  // 📊 USER STATS STATE
  const [user, setUser] = useState({
    name: 'Kullanıcı',
    username: '@kullanici',
    email: 'user@example.com',
    avatar: '',
    level: 1,
    points: 0,
    countryRank: 0,
    totalPlayers: 0,
    country: 'Türkiye',
    avgMatchRating: 0,
    xpGainThisWeek: 0,
    stats: {
      success: 0,
      total: 0,
      streak: 0,
    },
  });

  // 🎯 BEST CLUSTER STATE
  const [bestCluster, setBestCluster] = useState<{
    name: string;
    accuracy: number;
    icon: string;
  } | null>(null);

  // 🏆 LOAD BADGES
  const loadBadges = async () => {
    try {
      // 🔥 TEST MODE: Tüm rozetleri kazanılmış olarak göster
      const badgesWithStatus = ALL_BADGES.map((badgeDef) => {
        return {
          id: badgeDef.id,
          name: badgeDef.name,
          description: badgeDef.description,
          icon: badgeDef.emoji,
          tier: badgeDef.tier as any,
          earned: true, // ✅ Tüm rozetler kazanılmış
          earnedAt: new Date().toISOString(),
          requirement: badgeDef.howToEarn,
        };
      });
      
      setAllBadges(badgesWithStatus as any);
      setBadgeCount(ALL_BADGES.length); // 20 rozet
      
      console.log('✅ Loaded badges:', ALL_BADGES.length, 'Earned:', ALL_BADGES.length);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  // 🔄 FETCH USER DATA FROM SUPABASE
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get user ID from AsyncStorage
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id || 'anonymous';
        
        // Load badges
        await loadBadges();
        
        // Load favorite teams
        console.log('🔍 [PROFILE] Loading favorite teams from AsyncStorage...');
        const favoriteTeamsStr = await AsyncStorage.getItem('fan-manager-favorite-clubs');
        console.log('🔍 [PROFILE] Raw storage data:', favoriteTeamsStr);
        
        if (favoriteTeamsStr) {
          const teams = JSON.parse(favoriteTeamsStr);
          setFavoriteTeams(teams);
          console.log('✅ [PROFILE] Loaded favorite teams:', teams);
        } else {
          console.log('⚠️ [PROFILE] No favorite teams found in storage');
          setFavoriteTeams([]);
        }

        // Fetch user profile from Supabase
        const userResponse = await usersDb.getUserById(userId);
        if (userResponse.success && userResponse.data) {
          const dbUser = userResponse.data;
          setUser({
            name: dbUser.username || 'Kullanıcı',
            username: `@${dbUser.username || 'kullanici'}`,
            email: dbUser.email || 'user@example.com',
            avatar: dbUser.avatar_url || '',
            level: Math.floor((dbUser.total_points || 0) / 500) + 1,
            points: dbUser.total_points || 0,
            countryRank: dbUser.rank || 0,
            totalPlayers: 1000, // TODO: Get from database
            country: 'Türkiye',
            avgMatchRating: (dbUser.accuracy || 0) / 10,
            xpGainThisWeek: 0, // TODO: Calculate
            stats: {
              success: dbUser.accuracy || 0,
              total: dbUser.total_predictions || 0,
              streak: dbUser.current_streak || 0,
            },
          });
          setIsPro(dbUser.is_pro || false);
        }

        // Fetch user predictions to calculate best cluster
        const predictionsResponse = await predictionsDb.getUserPredictions(userId, 100);
        if (predictionsResponse.success && predictionsResponse.data) {
          const predictions = predictionsResponse.data;
          
          // Calculate cluster performance
          const clusterStats: Record<AnalysisCluster, { correct: number; total: number }> = {
            [AnalysisCluster.TEMPO_FLOW]: { correct: 0, total: 0 },
            [AnalysisCluster.PHYSICAL_FATIGUE]: { correct: 0, total: 0 },
            [AnalysisCluster.DISCIPLINE]: { correct: 0, total: 0 },
            [AnalysisCluster.INDIVIDUAL]: { correct: 0, total: 0 },
          };

          predictions.forEach((pred: any) => {
            // TODO: Map prediction_type to cluster and calculate accuracy
            // This requires actual match results to compare
          });

          // Find best cluster (mock for now)
          setBestCluster({
            name: 'Tempo & Akış',
            accuracy: 75,
            icon: '⚡',
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const achievements = [
    { id: 'winner', icon: '🏆', name: 'Winner', description: '10 doğru tahmin' },
    { id: 'streak', icon: '🔥', name: 'Streak Master', description: '5 gün üst üste' },
    { id: 'expert', icon: '⭐', name: 'Expert', description: 'Level 10\'a ulaştı' },
  ];

  const rankPercentage = ((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100;
  const topPercentage = ((user.countryRank / user.totalPlayers) * 100).toFixed(1);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => {/* TODO: Navigate to notifications */}} style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#F8FAFB" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSettings} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🏆 TAB NAVIGATION */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={20}
              color={activeTab === 'profile' ? '#059669' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
              Profil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
            onPress={() => setActiveTab('badges')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trophy"
              size={20}
              color={activeTab === 'badges' ? '#F59E0B' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              Rozetlerim
            </Text>
            {badgeCount > 0 && (
              <View style={styles.badgeCountBubble}>
                <Text style={styles.badgeCountText}>{badgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'profile' ? (
          <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <Animated.View
            entering={FadeInDown.delay(0)}
            style={styles.profileHeaderCard}
          >
            <LinearGradient
              colors={['rgba(5, 150, 105, 0.1)', 'transparent']}
              style={styles.profileGradient}
            >
              {/* Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={() => setShowAvatarPicker(true)}
                  style={styles.avatarContainer}
                >
                  <View style={styles.avatar}>
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={styles.cameraButton}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Name & Username */}
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>{user.username}</Text>

                {/* Plan Badge */}
                {isPro ? (
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proBadge}
                  >
                    <Ionicons name="crown" size={16} color="#FFFFFF" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Free</Text>
                  </View>
                )}

                {/* Level, Points & Badges */}
                <View style={styles.levelPointsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Level</Text>
                    <Text style={styles.statValueGreen}>{user.level}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Badges</Text>
                    <Text style={styles.statValueGold}>{badgeCount}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Points</Text>
                    <Text style={styles.statValue}>{user.points.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Performance Card */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Performance</Text>
            </View>

            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValueGreen}>
                  {user.stats.success}%
                </Text>
                <Text style={styles.performanceLabel}>Success Rate</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>{user.stats.total}</Text>
                <Text style={styles.performanceLabel}>Total Predictions</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValueGold}>{user.stats.streak}</Text>
                <Text style={styles.performanceLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Country Ranking */}
            <View style={styles.rankingCard}>
              <View style={styles.rankingHeader}>
                <View>
                  <Text style={styles.rankingSubtext}>{user.country} Sıralaması</Text>
                  <Text style={styles.rankingRank}>
                    #{user.countryRank.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.rankingRight}>
                  <Text style={styles.rankingSubtext}>Toplam Oyuncu</Text>
                  <Text style={styles.rankingTotal}>
                    {user.totalPlayers.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBar, { width: `${rankPercentage}%` }]}
                />
              </View>
              <Text style={styles.topPercentage}>Top {topPercentage}%</Text>
            </View>

            {/* Additional Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricBox}>
                <Ionicons name="medal" size={16} color="#F59E0B" />
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>Avg Rating</Text>
                  <Text style={styles.metricValue}>{user.avgMatchRating}</Text>
                </View>
              </View>
              <View style={styles.metricBox}>
                <Ionicons name="flash" size={16} color="#059669" />
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>XP This Week</Text>
                  <Text style={styles.metricValue}>+{user.xpGainThisWeek}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Favorite Teams Card */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Favorite Teams</Text>
            </View>

            <View style={styles.teamsContainer}>
              {favoriteTeams.map((team) => (
                <View key={team.id} style={styles.teamChip}>
                  {team.logo ? (
                    <Image
                      source={{ uri: team.logo }}
                      style={styles.teamLogo}
                    />
                  ) : (
                    <View style={styles.teamDot} />
                  )}
                  <Text style={styles.teamName}>{team.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* 🎯 EN İYİ OLDUĞU KÜME KARTI */}
          {bestCluster && (
            <Animated.View entering={FadeInDown.delay(250)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.clusterIcon}>{bestCluster.icon}</Text>
                <Text style={styles.cardTitle}>En İyi Olduğun Küme</Text>
              </View>

              <View style={styles.bestClusterContainer}>
                <LinearGradient
                  colors={['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0.05)']}
                  style={styles.bestClusterCard}
                >
                  <Text style={styles.bestClusterName}>{bestCluster.name}</Text>
                  <View style={styles.bestClusterStats}>
                    <View style={styles.bestClusterStat}>
                      <Text style={styles.bestClusterLabel}>Doğruluk Oranı</Text>
                      <Text style={styles.bestClusterValue}>{bestCluster.accuracy}%</Text>
                    </View>
                    <View style={styles.bestClusterBadge}>
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                      <Text style={styles.bestClusterBadgeText}>Uzman</Text>
                    </View>
                  </View>
                  <Text style={styles.bestClusterHint}>
                    Bu alanda çok güçlüsün! Devam et! 💪
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* Achievements Card */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.cardTitle}>Achievements</Text>
            </View>

            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Database Test Button (Dev Only) */}
          {__DEV__ && onDatabaseTest && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
              <TouchableOpacity onPress={onDatabaseTest} style={styles.dbTestButton}>
                <Ionicons name="server" size={20} color="#059669" />
                <Text style={styles.dbTestText}>🧪 Database Test</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>
        ) : (
          /* 🏆 BADGE SHOWCASE TAB */
          <View style={styles.badgeShowcaseContainer}>
            <FlatList
              data={allBadges}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.badgeGrid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Animated.View entering={ZoomIn.delay(index * 30)}>
                  <Pressable
                    style={[
                      styles.badgeCard,
                      { borderColor: item.earned ? getBadgeColor(item.tier) : '#334155' },
                    ]}
                    onPress={() => setSelectedBadge(item)}
                  >
                    {/* Lock Icon (Top Right) - Kilitli rozetlerde */}
                    {!item.earned && (
                      <View style={styles.lockIcon}>
                        <Ionicons name="lock-closed" size={14} color="#F59E0B" />
                      </View>
                    )}

                    {/* Sparkle for earned badges (Top Right) */}
                    {item.earned && (
                      <Animated.View
                        entering={FadeIn.delay(index * 30 + 200)}
                        style={styles.sparkle}
                      >
                        <Text style={styles.sparkleText}>✨</Text>
                      </Animated.View>
                    )}

                    {/* Badge Icon - Her zaman net görünsün */}
                    <Text style={styles.badgeEmoji}>
                      {item.icon}
                    </Text>

                    {/* Badge Name - Daha okunabilir */}
                    <Text
                      style={[
                        styles.badgeName,
                        !item.earned && styles.badgeNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    {/* Badge Tier - Her zaman göster */}
                    <View
                      style={[
                        styles.badgeTierLabel,
                        { backgroundColor: `${getBadgeColor(item.tier)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeTierText,
                          { color: getBadgeColor(item.tier) },
                        ]}
                      >
                        {getBadgeTierName(item.tier)}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBadgeState}>
                  <Ionicons name="trophy-outline" size={64} color="#64748B" />
                  <Text style={styles.emptyBadgeTitle}>Henüz rozet yok</Text>
                  <Text style={styles.emptyBadgeText}>
                    Maçlara tahmin yap ve rozetleri kazan!
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* 🔍 BADGE DETAIL MODAL */}
        <Modal
          visible={selectedBadge !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedBadge(null)}
          >
            <Animated.View entering={ZoomIn.duration(300)} style={styles.badgeDetailModal}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                {selectedBadge && (
                  <>
                    {/* Badge Icon */}
                    <View
                      style={[
                        styles.badgeDetailIconContainer,
                        {
                          backgroundColor: selectedBadge.earned
                            ? `${getBadgeColor(selectedBadge.tier)}20`
                            : 'rgba(51, 65, 85, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.badgeDetailIcon}>
                        {selectedBadge.earned ? selectedBadge.icon : '🔒'}
                      </Text>
                    </View>

                    {/* Badge Name */}
                    <Text style={styles.badgeDetailName}>{selectedBadge.name}</Text>

                    {/* Badge Tier */}
                    {selectedBadge.earned && (
                      <View
                        style={[
                          styles.badgeDetailTier,
                          { backgroundColor: `${getBadgeColor(selectedBadge.tier)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeDetailTierText,
                            { color: getBadgeColor(selectedBadge.tier) },
                          ]}
                        >
                          {getBadgeTierName(selectedBadge.tier)}
                        </Text>
                      </View>
                    )}

                    {/* Badge Description */}
                    <Text style={styles.badgeDetailDescription}>
                      {selectedBadge.description}
                    </Text>

                    {/* Requirement */}
                    <View style={styles.badgeDetailRequirement}>
                      <Ionicons
                        name={selectedBadge.earned ? 'checkmark-circle' : 'information-circle'}
                        size={20}
                        color={selectedBadge.earned ? '#22C55E' : '#F59E0B'}
                      />
                      <Text style={styles.badgeDetailRequirementText}>
                        {selectedBadge.earned
                          ? `Kazanıldı: ${new Date(selectedBadge.earnedAt!).toLocaleDateString('tr-TR')}`
                          : `Nasıl Kazanılır: ${selectedBadge.requirement}`}
                      </Text>
                    </View>

                    {/* Progress Bar (for locked badges) */}
                    {!selectedBadge.earned && (
                      <View style={styles.badgeProgressSection}>
                        <View style={styles.badgeProgressHeader}>
                          <Text style={styles.badgeProgressLabel}>İlerleme</Text>
                          <Text style={styles.badgeProgressValue}>12 / 20</Text>
                        </View>
                        <View style={styles.badgeProgressBarContainer}>
                          <LinearGradient
                            colors={[getBadgeColor(selectedBadge.tier), `${getBadgeColor(selectedBadge.tier)}80`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.badgeProgressBarFill, { width: '60%' }]}
                          />
                        </View>
                        <Text style={styles.badgeProgressHint}>🎯 8 maç daha kazanman gerekiyor!</Text>
                      </View>
                    )}

                    {/* Close Button */}
                    <TouchableOpacity
                      style={styles.badgeDetailCloseButton}
                      onPress={() => setSelectedBadge(null)}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        style={styles.badgeDetailCloseGradient}
                      >
                        <Text style={styles.badgeDetailCloseText}>Kapat</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Avatar Picker Modal */}
        <Modal
          visible={showAvatarPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAvatarPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profil Fotoğrafı Değiştir</Text>
                <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>📷 Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>🖼️ Galeriden Seç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption}>
                <Text style={styles.modalOptionText}>🎨 Avatar Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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

  // Profile Header Card
  profileHeaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#059669',
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Badges
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  freeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 12,
  },
  freeBadgeText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Level & Points
  levelPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statValueGreen: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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

  // Performance
  performanceGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  performanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  performanceValueGreen: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  performanceValueGold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Ranking
  rankingCard: {
    padding: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rankingSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  rankingRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  topPercentage: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  metricText: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Teams
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 20,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  teamName: {
    fontSize: 14,
    color: '#059669',
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
  },
  achievementIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Database Test Button
  dbTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  dbTestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },

  // PRO Card
  proCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 24,
    marginBottom: 24,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  proFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  proFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  proFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  proButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOption: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Loading State
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // Best Cluster Card
  clusterIcon: {
    fontSize: 20,
  },
  bestClusterContainer: {
    marginTop: 12,
  },
  bestClusterCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  bestClusterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bestClusterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestClusterStat: {
    flex: 1,
  },
  bestClusterLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  bestClusterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  bestClusterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 20,
  },
  bestClusterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  bestClusterHint: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Ad Container
  adContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // 🏆 TAB NAVIGATION STYLES
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badgeCountBubble: {
    position: 'absolute',
    top: 6,
    right: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValueGold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },

  // 🏆 BADGE SHOWCASE STYLES
  badgeShowcaseContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  badgeGrid: {
    padding: 16,
    paddingBottom: 100,
  },
  badgeCard: {
    width: 80,
    height: 120,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 2,
    margin: 4,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 13,
  },
  badgeNameLocked: {
    color: '#94A3B8',
  },
  badgeTierLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTierText: {
    fontSize: 7,
    fontWeight: '700',
  },
  lockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    padding: 3,
  },
  sparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sparkleText: {
    fontSize: 12,
  },
  emptyBadgeState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyBadgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBadgeText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // 🔍 BADGE DETAIL MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDetailModal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  badgeDetailIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badgeDetailIcon: {
    fontSize: 60,
  },
  badgeDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeDetailTier: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeDetailTierText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeDetailDescription: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  badgeDetailRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeDetailRequirementText: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFB',
    lineHeight: 20,
    fontWeight: '600',
  },
  badgeDetailCloseButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeDetailCloseGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgeDetailCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Badge Progress Bar
  badgeProgressSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  badgeProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  badgeProgressBarContainer: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  badgeProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeProgressHint: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
});
