import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ProfileScreenProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onSettings,
  onProUpgrade,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const isPro = false; // Set to true for PRO users

  const user = {
    name: 'Ahmet Yılmaz',
    username: '@ahmetyilmaz',
    email: 'ahmet@example.com',
    avatar: '',
    level: 12,
    points: 3450,
    countryRank: 156,
    totalPlayers: 2365,
    country: 'Türkiye',
    avgMatchRating: 7.8,
    xpGainThisWeek: 245,
    stats: {
      success: 68.5,
      total: 142,
      streak: 5,
    },
  };

  const achievements = [
    { id: 'winner', icon: '🏆', name: 'Winner', description: '10 doğru tahmin' },
    { id: 'streak', icon: '🔥', name: 'Streak Master', description: '5 gün üst üste' },
    { id: 'expert', icon: '⭐', name: 'Expert', description: 'Level 10\'a ulaştı' },
  ];

  const favoriteTeams = [
    { id: 'gs', name: 'Galatasaray' },
    { id: 'rm', name: 'Real Madrid' },
    { id: 'tr', name: 'Türkiye' },
  ];

  const rankPercentage = ((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100;
  const topPercentage = ((user.countryRank / user.totalPlayers) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={onSettings} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
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

                {/* Level & Points */}
                <View style={styles.levelPointsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Level</Text>
                    <Text style={styles.statValueGreen}>{user.level}</Text>
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
                  <View style={styles.teamDot} />
                  <Text style={styles.teamName}>{team.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

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

          {/* PRO Upgrade Card */}
          {!isPro && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)', 'transparent']}
                style={styles.proCard}
              >
                <View style={styles.proHeader}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.proIcon}
                  >
                    <Ionicons name="crown" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.proTitle}>Upgrade to PRO</Text>
                    <Text style={styles.proSubtitle}>Unlock premium features</Text>
                  </View>
                </View>

                <View style={styles.proFeatures}>
                  {['3 favorite clubs', 'Advanced statistics', 'Exclusive badges', 'Priority support'].map((feature) => (
                    <View key={feature} style={styles.proFeatureItem}>
                      <View style={styles.proDot} />
                      <Text style={styles.proFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity onPress={onProUpgrade} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.proButton}
                  >
                    <Text style={styles.proButtonText}>Learn More</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

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
});
