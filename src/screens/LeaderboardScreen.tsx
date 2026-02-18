// TacticIQ - Sıralama Sekmesi
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  LeaderboardEntry,
  LeaderboardFilterType,
  LeaderboardTimeFilter,
  LEVEL_THRESHOLDS,
} from '../types/scoring.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock leaderboard data
const generateMockLeaderboard = (filter: LeaderboardFilterType): LeaderboardEntry[] => {
  const names = [
    'AhmetPro', 'FutbolKurdu', 'TahminciAli', 'MaçUzmanı', 'GoalMaster',
    'AnalystKing', 'ProTahmin', 'GolcüAvcı', 'TaktikUs', 'ScoreWizard',
    'DerbiKralı', 'LigEfsanesi', 'TopçuBaba', 'FormAnaliz', 'SkorCanavarı',
  ];
  
  return names.map((name, idx) => {
    const points = 12847 - (idx * 847) + Math.floor(Math.random() * 100);
    const level = Math.min(10, Math.floor(points / 1000) + 1);
    const levelData = LEVEL_THRESHOLDS[level - 1];
    
    return {
      rank: idx + 1,
      userId: `user${idx}`,
      username: name,
      totalPoints: points,
      level,
      levelTitle: levelData?.title || 'Çaylak',
      currentStreak: idx < 5 ? 12 - idx * 2 : Math.floor(Math.random() * 5),
      isPro: idx < 3,
      isCurrentUser: false,
      rankChange: Math.floor(Math.random() * 50) - 20,
    };
  });
};

// Mock current user data
const MOCK_CURRENT_USER: LeaderboardEntry = {
  rank: 312,
  userId: 'currentUser',
  username: 'Etem Düzok',
  totalPoints: 847.5,
  level: 6,
  levelTitle: 'Profesyonel',
  currentStreak: 4,
  isPro: true,
  isCurrentUser: true,
  rankChange: 23,
};

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  
  const [regionFilter, setRegionFilter] = useState<LeaderboardFilterType>('turkey');
  const [timeFilter, setTimeFilter] = useState<LeaderboardTimeFilter>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry>(MOCK_CURRENT_USER);
  const [weeklyRisers, setWeeklyRisers] = useState<LeaderboardEntry[]>([]);
  
  useEffect(() => {
    // Load leaderboard data
    const data = generateMockLeaderboard(regionFilter);
    setLeaderboard(data);
    
    // Weekly risers - top 3 who gained most points
    setWeeklyRisers([
      { ...data[8], rankChange: 89, username: 'RisingStar', totalPoints: 847 },
      { ...data[9], rankChange: 67, username: 'NewKing', totalPoints: 723 },
      { ...data[10], rankChange: 45, username: 'ComingUp', totalPoints: 612 },
    ]);
  }, [regionFilter]);
  
  const getFilterLabel = (filter: LeaderboardFilterType): string => {
    switch (filter) {
      case 'turkey': return 'Türkiye';
      case 'world': return 'Dünya';
      case 'team': return 'Takım';
      default: return 'Türkiye';
    }
  };
  
  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: '', color: '#9CA3AF' };
  };
  
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rankBadge = getRankBadge(item.rank);
    const isTopThree = item.rank <= 3;
    const levelData = LEVEL_THRESHOLDS[item.level - 1];
    
    return (
      <View
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && styles.leaderboardItemCurrent,
          isTopThree && styles.leaderboardItemTop,
        ]}
      >
        {/* Rank */}
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.rankEmoji}>{rankBadge.emoji}</Text>
          ) : (
            <Text style={[styles.rankNumber, item.isCurrentUser && styles.rankNumberCurrent]}>
              {item.rank}
            </Text>
          )}
        </View>
        
        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, item.isCurrentUser && styles.userNameCurrent]}>
              {item.username}
            </Text>
            {item.isCurrentUser && <Ionicons name="star" size={14} color="#C9A44C" style={{ marginLeft: 4 }} />}
            {item.isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.levelText, { color: levelData?.color || '#9CA3AF' }]}>
            {item.levelTitle}
          </Text>
        </View>
        
        {/* Points & Streak */}
        <View style={styles.statsContainer}>
          <Text style={[styles.pointsText, item.isCurrentUser && styles.pointsTextCurrent]}>
            {item.totalPoints.toLocaleString()}
          </Text>
          {item.currentStreak >= 3 && (
            <View style={styles.streakBadgeSmall}>
              <Ionicons name="flame" size={10} color="#F59E0B" />
              <Text style={styles.streakTextSmall}>{item.currentStreak}</Text>
            </View>
          )}
        </View>
        
        {/* Rank Change */}
        {item.rankChange !== 0 && (
          <View style={styles.rankChangeContainer}>
            <Ionicons
              name={item.rankChange > 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={item.rankChange > 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.rankChangeText, { color: item.rankChange > 0 ? '#10B981' : '#EF4444' }]}>
              {Math.abs(item.rankChange)}
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Build display list with current user context
  const displayList = React.useMemo(() => {
    // Show top 10 + separator + users around current user
    const top10 = leaderboard.slice(0, 10);
    const currentUserSection = [
      { ...MOCK_CURRENT_USER, rank: 311, username: 'Üstümdeki', isCurrentUser: false, totalPoints: 849.1, rankChange: 0 },
      currentUser,
      { ...MOCK_CURRENT_USER, rank: 313, username: 'Altımdaki', isCurrentUser: false, totalPoints: 845.2, rankChange: 0 },
    ];
    
    return [...top10, { rank: -1 } as any, ...currentUserSection]; // -1 rank = separator
  }, [leaderboard, currentUser]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sıralama</Text>
        <Ionicons name="trophy" size={24} color="#C9A44C" />
      </View>
      
      {/* Region Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['turkey', 'world'] as LeaderboardFilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                regionFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setRegionFilter(filter)}
            >
              <Text style={styles.filterTabEmoji}>
                {filter === 'turkey' ? '🇹🇷' : '🌍'}
              </Text>
              <Text style={[
                styles.filterTabText,
                regionFilter === filter && styles.filterTabTextActive,
              ]}>
                {getFilterLabel(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Current User Position Banner */}
      <LinearGradient
        colors={['#1A2E2A', '#0F2420']}
        style={styles.currentUserBanner}
      >
        <View style={styles.currentUserLeft}>
          <Text style={styles.currentUserLabel}>Senin Sıran</Text>
          <Text style={styles.currentUserRank}>#{currentUser.rank}</Text>
        </View>
        <View style={styles.currentUserRight}>
          {currentUser.rankChange !== 0 && (
            <View style={styles.rankChangeBanner}>
              <Ionicons
                name={currentUser.rankChange > 0 ? 'arrow-up' : 'arrow-down'}
                size={16}
                color={currentUser.rankChange > 0 ? '#10B981' : '#EF4444'}
              />
              <Text style={[styles.rankChangeBannerText, { color: currentUser.rankChange > 0 ? '#10B981' : '#EF4444' }]}>
                {Math.abs(currentUser.rankChange)} sıra {currentUser.rankChange > 0 ? 'yükseldin' : 'düştün'}
              </Text>
            </View>
          )}
          <Text style={styles.currentUserPeriod}>Son 7 gün</Text>
        </View>
      </LinearGradient>
      
      {/* Leaderboard List */}
      <FlatList
        data={displayList}
        renderItem={({ item, index }) => {
          // Separator
          if (item.rank === -1) {
            return (
              <View style={styles.listSeparator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>···</Text>
                <View style={styles.separatorLine} />
              </View>
            );
          }
          return renderLeaderboardItem({ item, index });
        }}
        keyExtractor={(item, index) => item.rank === -1 ? `sep-${index}` : item.userId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => (
          <>
            {/* Weekly Risers Section */}
            <View style={styles.weeklyRisersContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Haftalık Yükselenler
              </Text>
              {weeklyRisers.map((riser, idx) => (
                <View key={idx} style={styles.riserItem}>
                  <Text style={styles.riserRank}>{idx + 1}.</Text>
                  <Text style={styles.riserName}>{riser.username}</Text>
                  <Text style={styles.riserPoints}>+{riser.totalPoints} puan</Text>
                  <View style={styles.riserChange}>
                    <Ionicons name="arrow-up" size={12} color="#10B981" />
                    <Text style={styles.riserChangeText}>{riser.rankChange} sıra</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterTabsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 10,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    borderWidth: 1,
    borderColor: '#1FA2A6',
  },
  filterTabEmoji: {
    fontSize: 16,
  },
  filterTabText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#1FA2A6',
    fontWeight: '600',
  },
  currentUserBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentUserLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  currentUserRank: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  rankChangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankChangeBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  currentUserPeriod: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  leaderboardItemCurrent: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderWidth: 1,
    borderColor: '#1FA2A6',
  },
  leaderboardItemTop: {
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  rankNumberCurrent: {
    color: '#1FA2A6',
  },
  userInfoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userNameCurrent: {
    color: '#1FA2A6',
  },
  levelText: {
    fontSize: 11,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: '#C9A44C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsTextCurrent: {
    color: '#1FA2A6',
  },
  streakBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  streakTextSmall: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
  rankChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
    gap: 2,
  },
  rankChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  separatorText: {
    color: '#6B7280',
    fontSize: 16,
    marginHorizontal: 12,
  },
  weeklyRisersContainer: {
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  riserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  riserRank: {
    width: 24,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  riserName: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  riserPoints: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 12,
  },
  riserChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  riserChangeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
});
