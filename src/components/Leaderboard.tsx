// components/Leaderboard.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, BadgeTier, getBadgeColor, getBadgeTierName } from '../types/badges.types';

const { width } = Dimensions.get('window');

// Leaderboard Data with Badges
const leaderboardData = {
  overall: [
    { id: '1', rank: 1, username: 'GalatasaraylıEfe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', points: 15420, level: 42, badges: 28, streak: 15, change: 0, team: '🦁', topBadges: ['🇹🇷', '⚡', '🔥'] },
    { id: '2', rank: 2, username: 'FenerliAhmet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', points: 14890, level: 41, badges: 25, streak: 12, change: 1, team: '🐤', topBadges: ['🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🟨', '💯'] },
    { id: '3', rank: 3, username: 'BJKaralı', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', points: 14320, level: 40, badges: 24, streak: 10, change: -1, team: '🦅', topBadges: ['🇹🇷', '💪', '🎯'] },
    { id: '4', rank: 4, username: 'MehmetGS', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', points: 13750, level: 39, badges: 22, streak: 8, change: 2, team: '🦁' },
    { id: '5', rank: 5, username: 'AliTrabzon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', points: 13210, level: 38, badges: 21, streak: 7, change: 0, team: '⚡' },
    { id: 'current', rank: 12, username: 'Sen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', points: 9850, level: 32, badges: 15, streak: 5, change: 3, team: '🦁', isCurrentUser: true },
    { id: '6', rank: 6, username: 'EmreBasakFB', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', points: 12680, level: 37, badges: 20, streak: 6, change: -2, team: '🐤' },
    { id: '7', rank: 7, username: 'CanBJK', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', points: 12150, level: 36, badges: 19, streak: 4, change: 1, team: '🦅' },
    { id: '8', rank: 8, username: 'SerkanGS', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', points: 11620, level: 35, badges: 18, streak: 9, change: 0, team: '🦁' },
    { id: '9', rank: 9, username: 'BurakFB', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9', points: 11090, level: 34, badges: 17, streak: 3, change: -1, team: '🐤' },
    { id: '10', rank: 10, username: 'OğuzTrabzon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10', points: 10560, level: 33, badges: 16, streak: 11, change: 2, team: '⚡' },
  ],
  weekly: [
    { id: '1', rank: 1, username: 'AliTrabzon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', points: 1520, level: 38, badges: 3, streak: 7, change: 0, team: '⚡' },
    { id: '2', rank: 2, username: 'GalatasaraylıEfe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', points: 1480, level: 42, badges: 4, streak: 15, change: 1, team: '🦁' },
    { id: 'current', rank: 8, username: 'Sen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', points: 985, level: 32, badges: 2, streak: 5, change: -2, team: '🦁', isCurrentUser: true },
    { id: '3', rank: 3, username: 'BJKaralı', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', points: 1320, level: 40, badges: 3, streak: 10, change: 2, team: '🦅' },
  ],
  monthly: [
    { id: '1', rank: 1, username: 'FenerliAhmet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', points: 5890, level: 41, badges: 12, streak: 12, change: 0, team: '🐤' },
    { id: 'current', rank: 5, username: 'Sen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', points: 3850, level: 32, badges: 7, streak: 5, change: 1, team: '🦁', isCurrentUser: true },
    { id: '2', rank: 2, username: 'GalatasaraylıEfe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', points: 5420, level: 42, badges: 11, streak: 15, change: 1, team: '🦁' },
  ],
  friends: [
    { id: '1', rank: 1, username: 'MehmetGS', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', points: 13750, level: 39, badges: 22, streak: 8, change: 0, team: '🦁' },
    { id: 'current', rank: 2, username: 'Sen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user', points: 9850, level: 32, badges: 15, streak: 5, change: 0, team: '🦁', isCurrentUser: true },
    { id: '2', rank: 3, username: 'EmreBasakFB', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', points: 8680, level: 30, badges: 14, streak: 6, change: 1, team: '🐤' },
    { id: '3', rank: 4, username: 'CanBJK', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', points: 7150, level: 28, badges: 12, streak: 4, change: -1, team: '🦅' },
  ],
};

const tabs = [
  { id: 'overall', label: 'Genel', icon: 'globe' },
  { id: 'weekly', label: 'Haftalık', icon: 'calendar' },
  { id: 'monthly', label: 'Aylık', icon: 'calendar-outline' },
];

interface LeaderboardProps {
  onNavigate?: (screen: string) => void;
}

export function Leaderboard({ onNavigate }: LeaderboardProps = {}) {
  const [activeTab, setActiveTab] = useState<'overall' | 'weekly' | 'monthly' | 'friends'>('overall');
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Yükleme animasyonu
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // 0.8 saniye yükleme animasyonu
    return () => clearTimeout(timer);
  }, []);

  // ✅ MEMOIZED: Only recalculate when activeTab changes
  const currentData = useMemo(() => {
    return leaderboardData[activeTab];
  }, [activeTab]);

  // ✅ MEMOIZED: Only find user when data changes
  const currentUserData = useMemo(() => {
    return currentData.find(u => u.isCurrentUser);
  }, [currentData]);

  // ✅ MEMOIZED: Pure functions don't need to be recreated
  const getRankColor = useCallback((rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#64748B';
  }, []);

  const getRankGradient = useCallback((rank: number) => {
    if (rank === 1) return ['#FFD700', '#FFA500'];
    if (rank === 2) return ['#E8E8E8', '#C0C0C0'];
    if (rank === 3) return ['#CD7F32', '#8B4513'];
    return ['#1A3A34', '#162E29']; // Koyu yeşil gradient
  }, []);

  const getChangeIcon = useCallback((change: number) => {
    if (change > 0) return { name: 'arrow-up', color: '#10B981' };
    if (change < 0) return { name: 'arrow-down', color: '#EF4444' };
    return { name: 'remove', color: '#64748B' };
  }, []);

  // ✅ Yükleme ekranı
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.gridPattern} />
        <View style={styles.loadingContainer}>
          <Animated.View entering={ZoomIn.springify()}>
            <View style={styles.loadingIconContainer}>
              <Ionicons name="trophy" size={48} color="#FFD700" />
            </View>
          </Animated.View>
          <ActivityIndicator size="large" color="#1FA2A6" style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Sıralama yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Grid Pattern Background - Dashboard ile aynı */}
      <View style={styles.gridPattern} />
      
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Sıralama</Text>
        <Text style={styles.headerSubtitle}>En iyilerle yarış!</Text>

        {/* Current User Stats Card */}
        {currentUserData && (
          <Animated.View entering={ZoomIn.delay(100).springify()}>
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.currentUserCard}
            >
              <View style={styles.currentUserLeft}>
                <Image source={{ uri: currentUserData.avatar }} style={styles.currentUserAvatar} />
                <View>
                  <Text style={styles.currentUserName}>{currentUserData.username}</Text>
                  <View style={styles.currentUserStats}>
                    <View style={styles.currentUserStat}>
                      <Ionicons name="trophy" size={12} color="#FFF" />
                      <Text style={styles.currentUserStatText}>#{currentUserData.rank}</Text>
                    </View>
                    <View style={styles.currentUserStat}>
                      <Ionicons name="star" size={12} color="#FFF" />
                      <Text style={styles.currentUserStatText}>{currentUserData.points.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.currentUserRight}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Lvl {currentUserData.level}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.8}
              >
                <Ionicons name={tab.icon as any} size={18} color={isActive ? '#059669' : '#64748B'} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Top 3 Podium */}
      {activeTab === 'overall' && (
        <Animated.View entering={FadeIn.delay(200)} style={styles.podiumContainer}>
          <View style={styles.podium}>
            {/* 2nd Place */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.podiumItem}>
              <LinearGradient
                colors={getRankGradient(2)}
                style={styles.podiumAvatarContainer}
              >
                <Image source={{ uri: currentData[1].avatar }} style={styles.podiumAvatar} />
                <View style={styles.podiumRankBadge}>
                  <Text style={styles.podiumRankText}>2</Text>
                </View>
              </LinearGradient>
              <Text style={styles.podiumName} numberOfLines={1}>{currentData[1].username}</Text>
              <Text style={styles.podiumPoints}>{currentData[1].points.toLocaleString()}</Text>
              <View style={[styles.podiumPlatform, { height: 80 }]}>
                <Ionicons name="medal" size={24} color="#C0C0C0" />
              </View>
            </Animated.View>

            {/* 1st Place */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.podiumItem, styles.podiumFirst]}>
              <View style={styles.crownContainer}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
              </View>
              <LinearGradient
                colors={getRankGradient(1)}
                style={[styles.podiumAvatarContainer, styles.podiumAvatarFirst]}
              >
                <Image source={{ uri: currentData[0].avatar }} style={styles.podiumAvatar} />
                <View style={styles.podiumRankBadge}>
                  <Text style={styles.podiumRankText}>1</Text>
                </View>
              </LinearGradient>
              <Text style={styles.podiumName} numberOfLines={1}>{currentData[0].username}</Text>
              <Text style={styles.podiumPoints}>{currentData[0].points.toLocaleString()}</Text>
              <View style={[styles.podiumPlatform, styles.podiumPlatformFirst, { height: 100 }]}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
              </View>
            </Animated.View>

            {/* 3rd Place */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.podiumItem}>
              <LinearGradient
                colors={getRankGradient(3)}
                style={styles.podiumAvatarContainer}
              >
                <Image source={{ uri: currentData[2].avatar }} style={styles.podiumAvatar} />
                <View style={styles.podiumRankBadge}>
                  <Text style={styles.podiumRankText}>3</Text>
                </View>
              </LinearGradient>
              <Text style={styles.podiumName} numberOfLines={1}>{currentData[2].username}</Text>
              <Text style={styles.podiumPoints}>{currentData[2].points.toLocaleString()}</Text>
              <View style={[styles.podiumPlatform, { height: 60 }]}>
                <Ionicons name="medal" size={24} color="#CD7F32" />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.leaderboardList}
        contentContainerStyle={styles.leaderboardListContent}
        showsVerticalScrollIndicator={false}
      >
        {currentData.map((user, index) => {
          const changeIcon = getChangeIcon(user.change);
          const isTopThree = user.rank <= 3 && activeTab === 'overall';
          
          if (isTopThree) return null; // Skip top 3 in list for overall tab

          return (
            <Animated.View
              key={user.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <View
                style={[
                  styles.leaderboardItem,
                  user.isCurrentUser && styles.leaderboardItemCurrent,
                ]}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(user.rank)}20` }]}>
                    <Text style={[styles.rankText, { color: getRankColor(user.rank) }]}>
                      {user.rank}
                    </Text>
                  </View>
                  <Ionicons
                    name={changeIcon.name as any}
                    size={14}
                    color={changeIcon.color}
                    style={styles.changeIcon}
                  />
                </View>

                {/* User Info */}
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <View style={styles.userNameContainer}>
                    <Text style={[styles.userName, user.isCurrentUser && styles.userNameCurrent]}>
                      {user.username}
                    </Text>
                    <Text style={styles.userTeam}>{user.team}</Text>
                  </View>
                  
                  {/* 🏆 TOP BADGES - Uzmanlık Rozetleri */}
                  {(user as any).topBadges && (user as any).topBadges.length > 0 && (
                    <View style={styles.badgesRow}>
                      {(user as any).topBadges.slice(0, 3).map((badge: string, idx: number) => (
                        <View key={idx} style={styles.badgeIcon}>
                          <Text style={styles.badgeIconText}>{badge}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.userStatsRow}>
                    <View style={styles.userStatMini}>
                      <Ionicons name="layers" size={10} color="#64748B" />
                      <Text style={styles.userStatMiniText}>Lvl {user.level}</Text>
                    </View>
                    <View style={styles.userStatMini}>
                      <Ionicons name="medal" size={10} color="#F59E0B" />
                      <Text style={styles.userStatMiniText}>{user.badges}</Text>
                    </View>
                    <View style={styles.userStatMini}>
                      <Ionicons name="flame" size={10} color="#EF4444" />
                      <Text style={styles.userStatMiniText}>{user.streak}</Text>
                    </View>
                  </View>
                </View>

                {/* Points */}
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsValue}>{user.points.toLocaleString()}</Text>
                  <Text style={styles.pointsLabel}>puan</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Empty State for Friends */}
        {activeTab === 'friends' && currentData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#64748B" />
            <Text style={styles.emptyStateTitle}>Henüz arkadaşın yok</Text>
            <Text style={styles.emptyStateText}>Arkadaş ekle ve onlarla yarış!</Text>
            <TouchableOpacity style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>Arkadaş Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2A24', // Koyu yeşil zemin - Dashboard ile aynı
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 250 : 240, // ✅ ProfileCard + team filter için standart padding
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  currentUserCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  currentUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentUserStats: {
    flexDirection: 'row',
    gap: 12,
  },
  currentUserStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentUserStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  tabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#059669',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#059669',
  },
  podiumContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumFirst: {
    marginTop: -20,
  },
  crownContainer: {
    marginBottom: 8,
  },
  podiumAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  podiumAvatarFirst: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  podiumAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F2A24', // Koyu yeşil
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFB',
    marginBottom: 2,
  },
  podiumPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  podiumPlatform: {
    width: '100%',
    backgroundColor: '#1A3A34', // Koyu yeşil
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  podiumPlatformFirst: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
  },
  leaderboardList: {
    flex: 1,
  },
  leaderboardListContent: {
    paddingTop: 200, // ✅ Space for ProfileCard overlay + safe area (52px safe + 148px card = 200px)
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A34', // Koyu yeşil
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)', // Turkuaz border
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  leaderboardItemCurrent: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: '#059669',
    borderWidth: 2,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 36,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  changeIcon: {
    marginTop: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFB',
  },
  userNameCurrent: {
    color: '#059669',
  },
  userTeam: {
    fontSize: 14,
  },
  userStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  userStatMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userStatMiniText: {
    fontSize: 11,
    color: '#64748B',
  },
  
  // 🏆 Badge Styles
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  badgeIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeIconText: {
    fontSize: 12,
  },
  
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
