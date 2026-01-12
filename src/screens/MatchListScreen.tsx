import React, { useState, useRef, memo, useEffect } from 'react';
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
  onNavigate?: (screen: string) => void;
  onProfileClick?: () => void;
  selectedTeamId?: number | null; // ✅ Seçilen takım ID'si (kulüp takımlarının maçlarını göstermek için)
  selectedTeamName?: string; // ✅ Takım adı (başlık için)
  onBack?: () => void; // ✅ Geri butonu (takım filtresi aktifse göster)
  matchData: {
    pastMatches?: any[];
    liveMatches: any[];
    upcomingMatches?: any[];
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
  onProfileClick,
  selectedTeamId,
  selectedTeamName,
  onBack,
  matchData,
}) => {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<number | 'all'>('all');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // ✅ Takım maçları için state
  const [teamUpcomingMatches, setTeamUpcomingMatches] = useState<any[]>([]);
  const [teamPastMatches, setTeamPastMatches] = useState<any[]>([]);
  const [teamMatchesLoading, setTeamMatchesLoading] = useState(false);
  const [teamMatchesError, setTeamMatchesError] = useState<string | null>(null);

  const { liveMatches, loading, error, hasLoadedOnce } = matchData;
  
  // ✅ Eğer selectedTeamId varsa, otomatik olarak filtrele ve takım maçlarını çek
  useEffect(() => {
    if (selectedTeamId) {
      setSelectedTeamFilter(selectedTeamId);
      fetchTeamMatches(selectedTeamId);
    } else {
      // Takım seçimi yoksa, normal maçları göster
      setTeamUpcomingMatches([]);
      setTeamPastMatches([]);
    }
  }, [selectedTeamId]);
  
  // ✅ Backend'den takım maçlarını çek (yaklaşan ve geçmiş)
  const fetchTeamMatches = async (teamId: number) => {
    setTeamMatchesLoading(true);
    setTeamMatchesError(null);
    
    try {
      const baseUrl = api.getBaseUrl();
      console.log(`🔍 Fetching matches for team ${teamId} from ${baseUrl}`);
      
      // ✅ Yaklaşan maçları çek
      try {
        const upcomingResponse = await fetch(`${baseUrl}/matches/team/${teamId}/upcoming?limit=15`);
        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          if (upcomingData.success && upcomingData.data && Array.isArray(upcomingData.data)) {
            setTeamUpcomingMatches(upcomingData.data);
            console.log(`✅ Fetched ${upcomingData.data.length} upcoming matches for team ${teamId}`);
          } else {
            console.warn(`⚠️ No upcoming matches data for team ${teamId}`);
            setTeamUpcomingMatches([]);
          }
        } else {
          const errorText = await upcomingResponse.text();
          console.error(`❌ Failed to fetch upcoming matches: ${upcomingResponse.status} - ${errorText}`);
        }
      } catch (upcomingErr: any) {
        console.error('❌ Error fetching upcoming matches:', upcomingErr);
      }
      
      // ✅ Geçmiş maçları çek
      try {
        const pastResponse = await fetch(`${baseUrl}/matches/team/${teamId}/last?limit=15`);
        if (pastResponse.ok) {
          const pastData = await pastResponse.json();
          if (pastData.success && pastData.data && Array.isArray(pastData.data)) {
            setTeamPastMatches(pastData.data);
            console.log(`✅ Fetched ${pastData.data.length} past matches for team ${teamId}`);
          } else {
            console.warn(`⚠️ No past matches data for team ${teamId}`);
            setTeamPastMatches([]);
          }
        } else {
          const errorText = await pastResponse.text();
          console.error(`❌ Failed to fetch past matches: ${pastResponse.status} - ${errorText}`);
        }
      } catch (pastErr: any) {
        console.error('❌ Error fetching past matches:', pastErr);
      }
    } catch (err: any) {
      console.error('❌ Error fetching team matches:', err);
      setTeamMatchesError(err.message || 'Takım maçları yüklenemedi. Backend bağlantısını kontrol edin.');
    } finally {
      setTeamMatchesLoading(false);
    }
  };

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
        {/* ✅ Geri Butonu (takım filtresi aktifse göster) */}
        {selectedTeamId && onBack && (
          <View style={styles.backHeader}>
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>
            <Text style={styles.teamFilterTitle}>
              {selectedTeamName || 'Takım'} Maçları
            </Text>
          </View>
        )}
        
        {/* ✅ Takım seçilmediyse Team Filter göster */}
        {!selectedTeamId && (
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
        )}

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ✅ TAKIM MAÇLARI (selectedTeamId varsa) */}
          {selectedTeamId ? (
            <>
              {/* Loading State */}
              {teamMatchesLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.loadingText}>Takım maçları yükleniyor...</Text>
                </View>
              )}

              {/* Error State */}
              {teamMatchesError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>❌ {teamMatchesError}</Text>
                </View>
              )}

              {/* ✅ YAKLAŞAN MAÇLAR (ÜSTTE) */}
              {!teamMatchesLoading && teamUpcomingMatches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
                  </View>
                  {teamUpcomingMatches.map((match) => {
                    const transformed = transformMatch(match);
                    return (
                      <TouchableOpacity
                        key={match.fixture?.id || match.id}
                        style={styles.matchCard}
                        onPress={() => onMatchSelect(transformed.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.matchContent}>
                          <View style={styles.team}>
                            <Text style={styles.teamNameText}>{transformed.homeTeam.name}</Text>
                            <Text style={styles.teamLogo}>{transformed.homeTeam.logo}</Text>
                          </View>
                          <View style={styles.matchScore}>
                            <Text style={styles.scoreText}>VS</Text>
                            <Text style={styles.liveMinute}>
                              {new Date(match.fixture?.date || match.date).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          <View style={styles.team}>
                            <Text style={styles.teamNameText}>{transformed.awayTeam.name}</Text>
                            <Text style={styles.teamLogo}>{transformed.awayTeam.logo}</Text>
                          </View>
                        </View>
                        <Text style={styles.leagueText}>{transformed.league}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ✅ GEÇMİŞ MAÇLAR (ALTTA) */}
              {!teamMatchesLoading && teamPastMatches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="time-outline" size={20} color="#64748B" />
                    <Text style={styles.sectionTitle}>Geçmiş Maçlar</Text>
                  </View>
                  {teamPastMatches.map((match) => {
                    const transformed = transformMatch(match);
                    return (
                      <TouchableOpacity
                        key={match.fixture?.id || match.id}
                        style={styles.matchCard}
                        onPress={() => onMatchSelect(transformed.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.matchContent}>
                          <View style={styles.team}>
                            <Text style={styles.teamNameText}>{transformed.homeTeam.name}</Text>
                            <Text style={styles.teamLogo}>{transformed.homeTeam.logo}</Text>
                          </View>
                          <View style={styles.matchScore}>
                            <Text style={styles.scoreText}>
                              {transformed.homeTeam.score} - {transformed.awayTeam.score}
                            </Text>
                            <Text style={styles.liveMinute}>
                              {new Date(match.fixture?.date || match.date).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </Text>
                          </View>
                          <View style={styles.team}>
                            <Text style={styles.teamNameText}>{transformed.awayTeam.name}</Text>
                            <Text style={styles.teamLogo}>{transformed.awayTeam.logo}</Text>
                          </View>
                        </View>
                        <Text style={styles.leagueText}>{transformed.league}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Empty State - No Team Matches */}
              {!teamMatchesLoading && teamUpcomingMatches.length === 0 && teamPastMatches.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="football-outline" size={64} color="#64748B" />
                  </View>
                  <Text style={styles.emptyStateTitle}>Takım maçı bulunamadı</Text>
                  <Text style={styles.emptyStateText}>
                    Bu takım için henüz maç kaydı yok
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* ✅ NORMAL CANLI MAÇLAR (takım seçilmediyse) */}
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
            </>
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
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  teamFilterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
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
