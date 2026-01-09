// components/Dashboard.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoriteTeamMatches } from '../hooks/useFavoriteTeamMatches';
import api from '../services/api';
import { AdBanner } from './ads/AdBanner';

const { width } = Dimensions.get('window');

interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

const userStats = {
  level: 12,
  points: 2845,
  rank: 156,
  totalPlayers: 2365,
  weeklyPoints: 340,
  accuracy: 68,
  streak: 5,
  xp: 650,
  nextLevelXp: 1000,
};

const quickStats = [
  { id: '1', icon: 'flame', label: 'Seri', value: '5', color: '#EF4444' },
  { id: '2', icon: 'trophy', label: 'Kazanç', value: '+340', color: '#F59E0B' },
  { id: '3', icon: 'target', label: 'Doğruluk', value: '%68', color: '#059669' },
  { id: '4', icon: 'flash', label: 'Seviye', value: '12', color: '#3B82F6' },
];

const activePredictions = [
  {
    id: '1',
    homeTeam: 'Galatasaray',
    awayTeam: 'Fenerbahçe',
    prediction: 'Galatasaray',
    score: '2-1',
    confidence: 85,
    status: 'live',
    minute: 67,
  },
  {
    id: '2',
    homeTeam: 'Beşiktaş',
    awayTeam: 'Trabzonspor',
    prediction: 'Berabere',
    score: '1-1',
    confidence: 70,
    status: 'correct',
    points: 50,
  },
];

const upcomingMatches = [
  {
    id: '1',
    homeTeam: { name: 'Galatasaray', logo: '🦁', colors: ['#FDB913', '#E30613'], manager: 'Okan Buruk' },
    awayTeam: { name: 'Real Madrid', logo: '👑', colors: ['#FFFFFF', '#001C58'], manager: 'Carlo Ancelotti' },
    date: '8 Oca 2026',
    time: '22:45',
    league: 'Şampiyonlar Ligi',
    predicted: false,
    countdown: '2 gün',
  },
  {
    id: '2',
    homeTeam: { name: 'Fenerbahçe', logo: '🐤', colors: ['#FCCF1E', '#001A70'], manager: 'İsmail Kartal' },
    awayTeam: { name: 'Beşiktaş', logo: '🦅', colors: ['#000000', '#FFFFFF'], manager: 'Şenol Güneş' },
    date: '10 Oca 2026',
    time: '19:00',
    league: 'Süper Lig',
    predicted: true,
    countdown: '4 gün',
  },
];

const achievements = [
  { id: '1', icon: 'star', title: 'İlk Gol', unlocked: true, color: '#F59E0B' },
  { id: '2', icon: 'trophy', title: 'Şampiyon', unlocked: true, color: '#059669' },
  { id: '3', icon: 'flame', title: '10 Seri', unlocked: false, color: '#64748B', progress: 50 },
  { id: '4', icon: 'ribbon', title: 'Profesyonel', unlocked: false, color: '#64748B', progress: 75 },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  // Fetch favorite team matches (past, live, upcoming)
  const { pastMatches, liveMatches, upcomingMatches, loading, error } = useFavoriteTeamMatches();

  // Show loading
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
      </View>
    );
  }

  // Show error
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Veriler yüklenemedi</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, 👋</Text>
          <Text style={styles.username}>Futbol Aşığı</Text>
        </View>

        <TouchableOpacity
          onPress={() => onNavigate('notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color="#F8FAFB" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Stats Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <TouchableOpacity
            onPress={() => onNavigate('profile')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsCard}
            >
              {/* Level & Points */}
              <View style={styles.statsRow}>
                <View style={styles.levelBadge}>
                  <Ionicons name="flash" size={16} color="#F59E0B" />
                  <Text style={styles.levelText}>Seviye {userStats.level}</Text>
                </View>
                <Text style={styles.pointsText}>{userStats.points} Puan</Text>
              </View>

              {/* Rank */}
              <View style={styles.rankContainer}>
                <View style={styles.rankIcon}>
                  <Ionicons name="trophy" size={32} color="#F59E0B" />
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankLabel}>Türkiye Sıralaması</Text>
                  <Text style={styles.rankValue}>
                    #{userStats.rank} / {userStats.totalPlayers.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {userStats.xp} / {userStats.nextLevelXp} XP
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          {quickStats.map((stat, index) => (
            <Animated.View
              key={stat.id}
              entering={FadeInLeft.delay(index * 100).springify()}
              style={styles.quickStatCard}
            >
              <View
                style={[
                  styles.quickStatIcon,
                  { backgroundColor: `${stat.color}20` },
                ]}
              >
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.quickStatValue}>{stat.value}</Text>
              <Text style={styles.quickStatLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Active Predictions */}
        {activePredictions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Aktif Tahminler</Text>
              <TouchableOpacity onPress={() => onNavigate('matches')}>
                <Text style={styles.sectionLink}>Tümü</Text>
              </TouchableOpacity>
            </View>

            {/* Live Matches */}
            {liveMatches.slice(0, 3).map((match, index) => (
              <Animated.View
                key={match.fixture.id}
                entering={FadeInDown.delay(200 + index * 100).springify()}
              >
                <TouchableOpacity
                  onPress={() => onNavigate('match-detail', { id: match.fixture.id })}
                  style={styles.predictionCard}
                  activeOpacity={0.8}
                >
                  {/* Live Badge */}
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>CANLI</Text>
                    <Text style={styles.liveMinute}>{match.fixture.status.elapsed}'</Text>
                  </View>

                  <Text style={styles.predictionMatch}>
                    {match.teams.home.name} vs {match.teams.away.name}
                  </Text>

                  <View style={styles.predictionFooter}>
                    <View style={styles.predictionInfo}>
                      <Text style={styles.predictionLabel}>Skor:</Text>
                      <Text style={styles.predictionValue}>
                        {match.goals.home} - {match.goals.away}
                      </Text>
                    </View>

                    <View style={styles.confidenceBadge}>
                      <Ionicons name="flame" size={14} color="#F59E0B" />
                      <Text style={styles.confidenceText}>Canlı</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Upcoming Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
            <TouchableOpacity onPress={() => onNavigate('matches')}>
              <Text style={styles.sectionLink}>Tümü</Text>
            </TouchableOpacity>
          </View>

          {upcomingMatches.map((match) => (
            <Animated.View
              key={match.fixture?.id || match.id}
              entering={FadeInDown.delay(300).springify()}
            >
              <TouchableOpacity
                onPress={() => onNavigate('match-detail', { id: match.fixture?.id || match.id })}
                style={styles.matchCard}
                activeOpacity={0.8}
              >
                {/* Home Team Color Bar - Left */}
                <LinearGradient
                  colors={match.homeTeam?.colors || match.teams?.home?.colors || ['#059669', '#047857']}
                  style={[styles.colorBar, styles.colorBarLeft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                {/* Away Team Color Bar - Right */}
                <LinearGradient
                  colors={match.awayTeam?.colors || match.teams?.away?.colors || ['#F59E0B', '#D97706']}
                  style={[styles.colorBar, styles.colorBarRight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                {/* League */}
                <View style={styles.matchLeague}>
                  <Ionicons name="trophy" size={12} color="#059669" />
                  <Text style={styles.matchLeagueText}>{match.league?.name || match.league || 'League'}</Text>
                </View>

                {/* Teams */}
                <View style={styles.matchTeams}>
                  <View style={styles.team}>
                    <Text style={styles.teamName}>
                      {match.homeTeam?.name || match.teams?.home?.name || 'Home Team'}
                    </Text>
                    <Text style={styles.managerName}>
                      {match.homeTeam?.manager || 'TBA'}
                    </Text>
                  </View>

                  <View style={styles.matchInfo}>
                    <Text style={styles.matchVs}>VS</Text>
                    <Text style={styles.matchTime}>
                      {match.time || new Date(match.fixture?.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.matchDate}>
                      {match.date || new Date(match.fixture?.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>

                  <View style={styles.team}>
                    <Text style={styles.teamName}>
                      {match.awayTeam?.name || match.teams?.away?.name || 'Away Team'}
                    </Text>
                    <Text style={styles.managerName}>
                      {match.awayTeam?.manager || 'TBA'}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.matchFooter}>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    <Text style={styles.countdownText}>{match.countdown || 'Yakında'}</Text>
                  </View>

                  {match.predicted ? (
                    <View style={styles.predictedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.predictedText}>Tahmin yapıldı</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#059669', '#047857']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.predictButton}
                    >
                      <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.predictButtonText}>Tahmin Yap</Text>
                    </LinearGradient>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Achievements */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Başarımlar</Text>
            <TouchableOpacity onPress={() => onNavigate('achievements')}>
              <Text style={styles.sectionLink}>Tümü</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <Animated.View
                key={achievement.id}
                entering={FadeInDown.delay(400).springify()}
                style={styles.achievementCardWrapper}
              >
                <TouchableOpacity
                  onPress={() => onNavigate('achievements')}
                  style={[
                    styles.achievementCard,
                    !achievement.unlocked && styles.achievementLocked,
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      {
                        backgroundColor: achievement.unlocked
                          ? `${achievement.color}20`
                          : '#1E293B',
                      },
                    ]}
                  >
                    <Ionicons
                      name={achievement.icon as any}
                      size={28}
                      color={achievement.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {achievement.title}
                  </Text>

                  {!achievement.unlocked && achievement.progress && (
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBar}>
                        <View
                          style={[
                            styles.achievementProgressFill,
                            { width: `${achievement.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress}%
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Ad Banner - Free users only */}
        <View style={styles.adContainer}>
          <AdBanner position="bottom" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  greeting: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  rankIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  rankValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  predictionCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  liveMinute: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  correctBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  correctText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  predictionMatch: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFB',
    marginBottom: 8,
    paddingRight: 100,
  },
  predictionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFB',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  matchCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  matchLeague: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  matchLeagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
  },
  colorBarLeft: {
    left: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  colorBarRight: {
    right: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  matchInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  matchVs: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  matchDate: {
    fontSize: 12,
    color: '#64748B',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  predictedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  predictedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  predictButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  achievementCardWrapper: {
    width: '50%',
    padding: 6,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#64748B',
  },
  achievementProgress: {
    width: '100%',
    marginTop: 8,
    gap: 4,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Ad Container
  adContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  
  // Loading & Error States
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
