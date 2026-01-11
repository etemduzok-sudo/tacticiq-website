import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface MatchListScreenProps {
  onMatchSelect: (matchId: string) => void;
  onNavigate: (screen: string) => void;
  matchData: {
    pastMatches: any[];
    liveMatches: any[];
    upcomingMatches: any[];
    loading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
  };
}

const teams = [
  { id: 'all', name: 'Tümü', logo: '⚽' },
  { id: 611, name: 'Fenerbahçe', logo: '🐤' },
  { id: 645, name: 'Galatasaray', logo: '🦁' },
  { id: 635, name: 'Beşiktaş', logo: '🦅' },
  { id: 609, name: 'Trabzonspor', logo: '⚡' },
];

export const MatchListScreen: React.FC<MatchListScreenProps> = memo(({
  onMatchSelect,
  onNavigate,
  matchData,
}) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<number | 'all'>('all');
  const scrollViewRef = useRef<ScrollView>(null);

  const { liveMatches, loading, error, hasLoadedOnce } = matchData;

  // Transform API data to component format
  function transformMatch(apiMatch: any) {
    const isLive = api.utils.isMatchLive(apiMatch.fixture.status.short);
    
    return {
      id: apiMatch.fixture.id.toString(),
      homeTeam: {
        name: apiMatch.teams.home.name,
        logo: apiMatch.teams.home.logo || '⚽',
        score: apiMatch.goals.home || 0,
      },
      awayTeam: {
        name: apiMatch.teams.away.name,
        logo: apiMatch.teams.away.logo || '⚽',
        score: apiMatch.goals.away || 0,
      },
      league: apiMatch.league.name,
      minute: apiMatch.fixture.status.elapsed || 0,
    };
  }

  // Filter matches by team
  const filterByTeam = (matches: any[]) => {
    if (selectedTeamFilter === 'all') return matches;
    return matches.filter(match => 
      match.teams.home.id === selectedTeamFilter || 
      match.teams.away.id === selectedTeamFilter
    );
  };

  const filteredLiveMatches = filterByTeam(liveMatches);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Header: Team Filter */}
        <View style={styles.fixedHeader}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.teamFilterScroll}
            contentContainerStyle={styles.teamFilterContent}
          >
            {teams.map((team) => {
              const isSelected = selectedTeamFilter === team.id;
              return (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamChip,
                    isSelected && styles.teamChipSelected,
                  ]}
                  onPress={() => setSelectedTeamFilter(team.id as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.teamLogo}>{team.logo}</Text>
                  <Text
                    style={[
                      styles.teamName,
                      isSelected && styles.teamNameSelected,
                    ]}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scrollable Content: Canlı Maçlar */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Loading State */}
          {loading && !hasLoadedOnce && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Canlı maçlar yükleniyor...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ Bir hata oluştu: {error}</Text>
            </View>
          )}

          {/* Empty State - No Live Matches */}
          {!loading && hasLoadedOnce && filteredLiveMatches.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="radio-outline" size={64} color="#64748B" />
              </View>
              <Text style={styles.emptyStateTitle}>Şuan canlı maç yok</Text>
              <Text style={styles.emptyStateText}>
                Yaklaşan maçları görmek için{'\n'}Ana Sayfa'ya dön
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => onNavigate('home')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  style={styles.emptyStateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyStateButtonText}>Ana Sayfa</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Live Matches */}
          {filteredLiveMatches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.liveSectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.liveSectionTitle}>Canlı Maçlar ({filteredLiveMatches.length})</Text>
              </View>
              {filteredLiveMatches.map((match) => {
                const transformed = transformMatch(match);
                return (
                  <TouchableOpacity
                    key={transformed.id}
                    style={[styles.matchCard, styles.liveMatchCard]}
                    onPress={() => onMatchSelect(transformed.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchHeader}>
                      <Text style={styles.matchLeague}>{transformed.league}</Text>
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>CANLI</Text>
                      </View>
                    </View>
                    <View style={styles.matchContent}>
                      <View style={styles.team}>
                        <Text style={styles.teamLogo}>{transformed.homeTeam.logo}</Text>
                        <Text style={styles.teamNameText}>{transformed.homeTeam.name}</Text>
                      </View>
                      <View style={styles.matchScore}>
                        <Text style={styles.scoreText}>
                          {transformed.homeTeam.score} - {transformed.awayTeam.score}
                        </Text>
                        <Text style={styles.liveMinute}>{transformed.minute}'</Text>
                      </View>
                      <View style={styles.team}>
                        <Text style={styles.teamLogo}>{transformed.awayTeam.logo}</Text>
                        <Text style={styles.teamNameText}>{transformed.awayTeam.name}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  fixedHeader: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  teamFilterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  teamFilterContent: {
    paddingTop: 12,
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    gap: 6,
  },
  teamChipSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderColor: '#059669',
  },
  teamLogo: {
    fontSize: 16,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  teamNameSelected: {
    color: '#059669',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  liveSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  matchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveMatchCard: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchLeague: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    textAlign: 'center',
  },
  matchScore: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  liveMinute: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
