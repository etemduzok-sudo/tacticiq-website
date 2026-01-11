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
import api from '../services/api';
import { AdBanner } from './ads/AdBanner';

const { width } = Dimensions.get('window');

interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
  matchData: {
    pastMatches: any[];
    liveMatches: any[];
    upcomingMatches: any[];
    loading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
  };
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
  { id: '3', icon: 'checkmark-circle', label: 'Doğruluk', value: '%68', color: '#059669' },
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

export const Dashboard = React.memo(function Dashboard({ onNavigate, matchData }: DashboardProps) {
  // Always use props from App.tsx
  const { 
    pastMatches, 
    liveMatches, 
    upcomingMatches: realUpcomingMatches, 
    loading, 
    error,
    hasLoadedOnce
  } = matchData;

  console.log('🔍 Dashboard state:', { 
    loading, 
    hasLoadedOnce,
    hasMatches: pastMatches.length + liveMatches.length + realUpcomingMatches.length 
  });

  // Show loading ONLY on first load (prevent flickering on refresh)
  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
      </View>
    );
  }

  // Show error (but not if it's just "no favorite teams")
  if (error && error !== 'Favori takım seçilmemiş') {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Veriler yüklenemedi</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  // Use real data if available, otherwise show empty state
  const displayMatches = realUpcomingMatches.length > 0 ? realUpcomingMatches : [];
  
  console.log('📊 Dashboard rendering:', {
    past: pastMatches.length,
    live: liveMatches.length,
    upcoming: realUpcomingMatches.length,
    displaying: displayMatches.length
  });

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions - Navigate to Matches */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => onNavigate('matches')}
            style={styles.quickActionCard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="football" size={32} color="#FFFFFF" />
              <Text style={styles.quickActionTitle}>Maçları Gör</Text>
              <Text style={styles.quickActionSubtitle}>
                {displayMatches.length} yaklaşan maç
              </Text>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" style={styles.quickActionArrow} />
            </LinearGradient>
          </TouchableOpacity>
        </View>


        {/* Ad Banner - Free users only */}
        <View style={styles.adContainer}>
          <AdBanner position="bottom" />
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
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
    marginHorizontal: 16,
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
  
  // Quick Action Card
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  quickActionGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  quickActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -12,
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
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
