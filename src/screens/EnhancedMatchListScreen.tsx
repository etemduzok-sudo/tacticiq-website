// Enhanced Match List Screen - With All Advanced Features
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// React Query
import { useLiveMatches, useMatchesByDate } from '../hooks/queries/useMatchesQuery';

// Services
import { analyticsService } from '../services/analyticsService';
import { performanceService } from '../services/performanceService';
import { useFeatureFlag } from '../services/featureFlagService';

// Components
import { MatchCard } from '../components/MatchCard';
import { AdBanner } from '../components/ads/AdBanner';

interface EnhancedMatchListScreenProps {
  onMatchSelect: (matchId: string) => void;
  onMatchResultSelect: (matchId: string) => void;
  onProfileClick: () => void;
}

export const EnhancedMatchListScreen: React.FC<EnhancedMatchListScreenProps> = ({
  onMatchSelect,
  onMatchResultSelect,
  onProfileClick,
}) => {
  // Feature flags
  const showAdvancedStats = useFeatureFlag('advancedStatistics');
  const enableAnimations = useFeatureFlag('animatedTransitions');
  const showSocialSharing = useFeatureFlag('socialSharing');

  // React Query hooks
  const { 
    data: liveMatches, 
    isLoading: loadingLive,
    error: errorLive,
    refetch: refetchLive 
  } = useLiveMatches(true); // Filter by favorites

  const {
    data: todayMatches,
    isLoading: loadingToday,
    error: errorToday,
    refetch: refetchToday
  } = useMatchesByDate(undefined, true); // Today's matches, filtered by favorites

  // Performance monitoring
  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('MatchList', 'EnhancedMatchListScreen');

    // Monitor screen load performance
    const stopMonitoring = performanceService.monitorScreenLoad('MatchList');

    return () => {
      stopMonitoring();
    };
  }, []);

  // Handle match click
  const handleMatchClick = (match: any) => {
    // Track analytics
    analyticsService.logMatchView(match.id, match.league?.name || 'Unknown');

    // Performance trace
    performanceService.startTrace('match_detail_navigation');

    // Navigate based on status
    if (match.status === 'finished') {
      onMatchResultSelect(match.id);
    } else {
      onMatchSelect(match.id);
    }

    performanceService.stopTrace('match_detail_navigation');
  };

  // Handle refresh
  const handleRefresh = () => {
    analyticsService.logEvent({
      name: 'matches_refresh',
      params: { source: 'manual' },
    });

    refetchLive();
    refetchToday();
  };

  // Loading state
  if (loadingLive && loadingToday) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (errorLive && errorToday) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Bir Hata Oluştu</Text>
          <Text style={styles.errorMessage}>
            {(errorLive as Error).message || 'Maçlar yüklenemedi'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const allMatches = [...(liveMatches || []), ...(todayMatches || [])];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Maçlar</Text>
            <Text style={styles.headerSubtitle}>
              {liveMatches?.length || 0} canlı • {todayMatches?.length || 0} bugün
            </Text>
          </View>
          <TouchableOpacity onPress={onProfileClick} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Feature Flag Demo */}
        {__DEV__ && (
          <View style={styles.featureFlagBanner}>
            <Text style={styles.featureFlagText}>
              🚩 Advanced Stats: {showAdvancedStats ? 'ON' : 'OFF'} | 
              Animations: {enableAnimations ? 'ON' : 'OFF'} | 
              Social: {showSocialSharing ? 'ON' : 'OFF'}
            </Text>
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#059669" />
          <Text style={styles.refreshButtonText}>Yenile</Text>
        </TouchableOpacity>

        {/* Match List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Live Matches Section */}
          {liveMatches && liveMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveIndicator} />
                  <Text style={styles.sectionTitle}>CANLI MAÇLAR</Text>
                </View>
                <Text style={styles.sectionCount}>{liveMatches.length}</Text>
              </View>
              {liveMatches.map((match, index) => (
                <MatchCard
                  key={match.fixture.id}
                  match={match}
                  index={index}
                  onPress={() => handleMatchClick(match)}
                  showAdvancedStats={showAdvancedStats}
                />
              ))}
            </View>
          )}

          {/* Today's Matches Section */}
          {todayMatches && todayMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>BUGÜNKÜ MAÇLAR</Text>
                <Text style={styles.sectionCount}>{todayMatches.length}</Text>
              </View>
              {todayMatches.map((match, index) => (
                <React.Fragment key={match.fixture.id}>
                  <MatchCard
                    match={match}
                    index={index}
                    onPress={() => handleMatchClick(match)}
                    showAdvancedStats={showAdvancedStats}
                  />
                  {/* Ad every 5 matches */}
                  {(index + 1) % 5 === 0 && (
                    <View style={styles.adContainer}>
                      <AdBanner position="bottom" />
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Empty State */}
          {allMatches.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="football-outline" size={64} color="#64748B" />
              <Text style={styles.emptyTitle}>Maç Bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                Favori takımlarınızın bugün maçı yok
              </Text>
            </View>
          )}
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  featureFlagBanner: {
    backgroundColor: '#1E293B',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  featureFlagText: {
    fontSize: 10,
    color: '#F59E0B',
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  adContainer: {
    marginVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
