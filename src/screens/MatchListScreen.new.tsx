import React, { useState, useRef, useEffect } from 'react';
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
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import api from '../services/api';
import { ProfileCard } from '../components/ProfileCard';

interface MatchListScreenProps {
  onMatchSelect: (matchId: string) => void;
  onMatchResultSelect: (matchId: string) => void;
  onProfileClick: () => void;
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

export const MatchListScreen: React.FC<MatchListScreenProps> = ({
  onMatchSelect,
  onMatchResultSelect,
  onProfileClick,
  matchData,
}) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<number | 'all'>('all');
  const scrollViewRef = useRef<ScrollView>(null);
  const { favoriteTeams } = useFavoriteTeams();

  const { pastMatches, liveMatches, upcomingMatches, loading, error, hasLoadedOnce } = matchData;

  // Auto-scroll to live match or first upcoming match
  useEffect(() => {
    if (hasLoadedOnce && scrollViewRef.current) {
      setTimeout(() => {
        if (liveMatches.length > 0) {
          // Scroll to live match
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        } else if (upcomingMatches.length > 0) {
          // Scroll to first upcoming match
          scrollViewRef.current?.scrollTo({ y: 200, animated: true });
        }
      }, 500);
    }
  }, [hasLoadedOnce, liveMatches.length, upcomingMatches.length]);

  // Transform API data to component format
  const transformMatch = (apiMatch: any) => {
    const isLive = api.utils.isMatchLive(apiMatch.fixture.status.short);
    const isFinished = api.utils.isMatchFinished(apiMatch.fixture.status.short);
    
    return {
      id: apiMatch.fixture.id.toString(),
      status: isLive ? 'live' : isFinished ? 'finished' : 'upcoming',
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
      date: new Date(apiMatch.fixture.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: api.utils.formatMatchTime(apiMatch.fixture.timestamp),
      minute: apiMatch.fixture.status.elapsed || 0,
      period: apiMatch.fixture.status.short,
    };
  };

  // Filter matches by team
  const filterByTeam = (matches: any[]) => {
    if (selectedTeamFilter === 'all') return matches;
    return matches.filter(match => 
      match.teams.home.id === selectedTeamFilter || 
      match.teams.away.id === selectedTeamFilter
    );
  };

  const filteredPastMatches = filterByTeam(pastMatches);
  const filteredLiveMatches = filterByTeam(liveMatches);
  const filteredUpcomingMatches = filterByTeam(upcomingMatches);

  // Loading state
  if (loading && !hasLoadedOnce) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !hasLoadedOnce) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Header: Profile Card */}
        <View style={styles.fixedHeader}>
          <ProfileCard onPress={onProfileClick} />

          {/* Team Filter - Horizontal Scroll */}
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

        {/* Scrollable Content: All Matches */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Past Matches */}
          {filteredPastMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Geçmiş Maçlar ({filteredPastMatches.length})</Text>
              {filteredPastMatches.map((match) => {
                const transformed = transformMatch(match);
                return (
                  <TouchableOpacity
                    key={transformed.id}
                    style={styles.matchCard}
                    onPress={() => onMatchResultSelect(transformed.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchHeader}>
                      <Text style={styles.matchLeague}>{transformed.league}</Text>
                      <Text style={styles.matchDate}>{transformed.date}</Text>
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
                        <Text style={styles.statusText}>MS</Text>
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

          {/* Upcoming Matches */}
          {filteredUpcomingMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gelecek Maçlar ({filteredUpcomingMatches.length})</Text>
              {filteredUpcomingMatches.map((match) => {
                const transformed = transformMatch(match);
                return (
                  <TouchableOpacity
                    key={transformed.id}
                    style={styles.matchCard}
                    onPress={() => onMatchSelect(transformed.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchHeader}>
                      <Text style={styles.matchLeague}>{transformed.league}</Text>
                      <Text style={styles.matchDate}>{transformed.date}</Text>
                    </View>
                    <View style={styles.matchContent}>
                      <View style={styles.team}>
                        <Text style={styles.teamLogo}>{transformed.homeTeam.logo}</Text>
                        <Text style={styles.teamNameText}>{transformed.homeTeam.name}</Text>
                      </View>
                      <View style={styles.matchScore}>
                        <Text style={styles.matchTime}>{transformed.time}</Text>
                        <Text style={styles.vsText}>VS</Text>
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

          {/* Empty State */}
          {filteredPastMatches.length === 0 && filteredLiveMatches.length === 0 && filteredUpcomingMatches.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#64748B" />
              <Text style={styles.emptyText}>Maç bulunamadı</Text>
              <Text style={styles.emptySubtext}>
                {selectedTeamFilter !== 'all' 
                  ? 'Seçili takım için maç bulunamadı'
                  : 'Favori takımlarınız için maç bulunamadı'}
              </Text>
            </View>
          )}

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
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
  fixedHeader: {
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  teamFilterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  teamFilterContent: {
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  teamChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  teamLogo: {
    fontSize: 16,
    marginRight: 6,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  teamNameSelected: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFB',
    marginBottom: 12,
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  matchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveMatchCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
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
  },
  matchDate: {
    fontSize: 12,
    color: '#64748B',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    marginTop: 4,
  },
  matchScore: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  statusText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  liveMinute: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  matchTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  vsText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
