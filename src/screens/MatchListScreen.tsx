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
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../services/api';

// Platform-safe animation helper (web doesn't support .delay().springify())
const getEnteringAnimation = (index: number = 0, baseDelay: number = 150) => {
  if (Platform.OS === 'web') {
    return FadeInDown;
  }
  return FadeInDown.delay(baseDelay + index * 50).springify();
};
import { logger } from '../utils/logger';
import { translateCountry } from '../utils/countryUtils';

const { width } = Dimensions.get('window');

interface MatchListScreenProps {
  onMatchSelect: (matchId: string) => void;
  onMatchResultSelect?: (matchId: string) => void; // ✅ Biten maç detayı
  onNavigate?: (screen: string) => void;
  onProfileClick?: () => void;
  selectedTeamId?: number | null; // ✅ Seçilen takım ID'si (kulüp takımlarının maçlarını göstermek için)
  selectedTeamName?: string; // ✅ Takım adı (başlık için)
  onBack?: () => void; // ✅ Geri butonu (takım filtresi aktifse göster)
  showOnlyFinished?: boolean; // ✅ Sadece biten maçları göster
  matchData: {
    pastMatches?: any[];
    liveMatches: any[];
    upcomingMatches?: any[];
    loading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
  };
}

export const MatchListScreen: React.FC<MatchListScreenProps> = memo(({
  onMatchSelect,
  onMatchResultSelect,
  onNavigate,
  onProfileClick,
  selectedTeamId,
  selectedTeamName,
  onBack,
  showOnlyFinished = false, // ✅ Varsayılan: false (canlı maçları göster)
  matchData,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const matchCardPositions = useRef<{ [key: string]: number }>({});
  
  // ✅ Takım maçları için state
  const [teamUpcomingMatches, setTeamUpcomingMatches] = useState<any[]>([]);
  const [teamPastMatches, setTeamPastMatches] = useState<any[]>([]);
  const [teamMatchesLoading, setTeamMatchesLoading] = useState(false);
  const [teamMatchesError, setTeamMatchesError] = useState<string | null>(null);

  const { liveMatches, pastMatches = [], loading, error, hasLoadedOnce } = matchData;
  
  // ✅ Eğer selectedTeamId varsa, takım maçlarını çek
  useEffect(() => {
    if (selectedTeamId) {
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
      logger.debug(`Fetching matches for team ${teamId}`, { teamId, baseUrl }, 'MATCH_LIST');
      
      // ✅ Yaklaşan maçları çek
      try {
        const upcomingResponse = await fetch(`${baseUrl}/matches/team/${teamId}/upcoming?limit=15`);
        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          if (upcomingData.success && upcomingData.data && Array.isArray(upcomingData.data)) {
            setTeamUpcomingMatches(upcomingData.data);
            logger.info(`Fetched ${upcomingData.data.length} upcoming matches for team ${teamId}`, { teamId, count: upcomingData.data.length }, 'MATCH_LIST');
          } else {
            logger.warn(`No upcoming matches data for team ${teamId}`, { teamId }, 'MATCH_LIST');
            setTeamUpcomingMatches([]);
          }
        } else {
          const errorText = await upcomingResponse.text();
          logger.error(`Failed to fetch upcoming matches: ${upcomingResponse.status}`, { teamId, status: upcomingResponse.status, errorText }, 'MATCH_LIST');
        }
      } catch (upcomingErr: any) {
        logger.error('Error fetching upcoming matches', { teamId, error: upcomingErr }, 'MATCH_LIST');
      }
      
      // ✅ Geçmiş maçları çek
      try {
        const pastResponse = await fetch(`${baseUrl}/matches/team/${teamId}/last?limit=15`);
        if (pastResponse.ok) {
          const pastData = await pastResponse.json();
          if (pastData.success && pastData.data && Array.isArray(pastData.data)) {
            setTeamPastMatches(pastData.data);
            logger.info(`Fetched ${pastData.data.length} past matches for team ${teamId}`, { teamId, count: pastData.data.length }, 'MATCH_LIST');
          } else {
            logger.warn(`No past matches data for team ${teamId}`, { teamId }, 'MATCH_LIST');
            setTeamPastMatches([]);
          }
        } else {
          const errorText = await pastResponse.text();
          logger.error(`Failed to fetch past matches: ${pastResponse.status}`, { teamId, status: pastResponse.status, errorText }, 'MATCH_LIST');
        }
      } catch (pastErr: any) {
        logger.error('Error fetching past matches', { teamId, error: pastErr }, 'MATCH_LIST');
      }
    } catch (err: any) {
      logger.error('Error fetching team matches', { teamId, error: err }, 'MATCH_LIST');
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

  // ✅ Helper: Takım renklerini al
  const getTeamColors = (teamName: string): string[] => {
    const name = teamName.toLowerCase();
    const teamColors: Record<string, string[]> = {
      'fenerbahçe': ['#FFD700', '#0066CC'], // Sarı-Mavi
      'fenerbahce': ['#FFD700', '#0066CC'],
      'galatasaray': ['#FF0000', '#FFD700'], // Kırmızı-Sarı
      'beşiktaş': ['#000000', '#FFFFFF'], // Siyah-Beyaz
      'besiktas': ['#000000', '#FFFFFF'],
      'trabzonspor': ['#800020', '#0000FF'], // Bordo-Mavi
      'real madrid': ['#FFFFFF', '#FFD700'], // Beyaz-Altın
      'barcelona': ['#A50044', '#004D98'], // Kırmızı-Mavi
      'paris saint germain': ['#004170', '#ED1C24'], // Mavi-Kırmızı
      'psg': ['#004170', '#ED1C24'],
      'türkiye': ['#E30A17', '#FFFFFF'], // Kırmızı-Beyaz
      'turkey': ['#E30A17', '#FFFFFF'],
      'almanya': ['#000000', '#DD0000', '#FFCE00'], // Siyah-Kırmızı-Altın
      'germany': ['#000000', '#DD0000', '#FFCE00'],
      'brezilya': ['#009C3B', '#FFDF00'], // Yeşil-Sarı
      'brazil': ['#009C3B', '#FFDF00'],
      'arjantin': ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
      'argentina': ['#74ACDF', '#FFFFFF'],
      'fethiyespor': ['#0066CC', '#FFD700'],
      'bayern munich': ['#DC052D', '#FFFFFF'],
    };
    
    for (const [key, colors] of Object.entries(teamColors)) {
      if (name.includes(key)) return colors;
    }
    
    // Varsayılan renkler
    return ['#1E40AF', '#FFFFFF'];
  };

  // ✅ Teknik direktör ismini al (2026 güncel)
  const getCoachName = (teamName: string): string => {
    const name = teamName.toLowerCase();
    const coaches: Record<string, string> = {
      // Türk Takımları
      'galatasaray': 'Okan Buruk',
      'fenerbahçe': 'José Mourinho',
      'fenerbahce': 'José Mourinho',
      'beşiktaş': 'Giovanni van Bronckhorst',
      'besiktas': 'Giovanni van Bronckhorst',
      'trabzonspor': 'Şenol Güneş',
      'başakşehir': 'Çağdaş Atan',
      'basaksehir': 'Çağdaş Atan',
      // La Liga
      'real madrid': 'Carlo Ancelotti',
      'barcelona': 'Hansi Flick',
      'atletico madrid': 'Diego Simeone',
      'sevilla': 'García Pimienta',
      'villarreal': 'Marcelino',
      'real sociedad': 'Imanol Alguacil',
      // Premier League
      'manchester city': 'Pep Guardiola',
      'arsenal': 'Mikel Arteta',
      'liverpool': 'Arne Slot',
      'manchester united': 'Ruben Amorim',
      'chelsea': 'Enzo Maresca',
      'tottenham': 'Ange Postecoglou',
      // Bundesliga
      'bayern munich': 'Vincent Kompany',
      'bayern': 'Vincent Kompany',
      'borussia dortmund': 'Nuri Şahin',
      'dortmund': 'Nuri Şahin',
      'rb leipzig': 'Marco Rose',
      'leverkusen': 'Xabi Alonso',
      'bayer leverkusen': 'Xabi Alonso',
      // Serie A
      'juventus': 'Thiago Motta',
      'inter': 'Simone Inzaghi',
      'milan': 'Paulo Fonseca',
      'ac milan': 'Paulo Fonseca',
      'napoli': 'Antonio Conte',
      'roma': 'Claudio Ranieri',
      // Ligue 1
      'paris saint germain': 'Luis Enrique',
      'psg': 'Luis Enrique',
      'marseille': 'Roberto De Zerbi',
      // Milli Takımlar
      'türkiye': 'Vincenzo Montella',
      'turkey': 'Vincenzo Montella',
      'almanya': 'Julian Nagelsmann',
      'germany': 'Julian Nagelsmann',
      'brezilya': 'Dorival Júnior',
      'brazil': 'Dorival Júnior',
      'arjantin': 'Lionel Scaloni',
      'argentina': 'Lionel Scaloni',
      'fransa': 'Didier Deschamps',
      'france': 'Didier Deschamps',
      'ingiltere': 'Thomas Tuchel',
      'england': 'Thomas Tuchel',
      'ispanya': 'Luis de la Fuente',
      'spain': 'Luis de la Fuente',
      'italya': 'Luciano Spalletti',
      'italy': 'Luciano Spalletti',
      'portekiz': 'Roberto Martínez',
      'portugal': 'Roberto Martínez',
      'hollanda': 'Ronald Koeman',
      'netherlands': 'Ronald Koeman',
      'belçika': 'Domenico Tedesco',
      'belgium': 'Domenico Tedesco',
    };
    for (const [key, coach] of Object.entries(coaches)) {
      if (name.includes(key)) return coach;
    }
    return 'Bilinmiyor';
  };

  // ✅ Takım adını çevir (milli takımlar için)
  const getDisplayTeamName = (teamName: string): string => {
    const nationalTeamNames = [
      'Turkey', 'Germany', 'France', 'England', 'Spain', 'Italy', 'Brazil', 
      'Argentina', 'Portugal', 'Netherlands', 'Belgium', 'Croatia', 'Poland',
      'Ukraine', 'Russia', 'Sweden', 'Austria', 'Switzerland', 'USA', 'Mexico',
      'Japan', 'South-Korea', 'Australia', 'Saudi-Arabia', 'Czech Republic',
      'Georgia', 'Scotland', 'Wales', 'Serbia', 'Denmark', 'Norway', 'Finland',
      'Greece', 'Romania', 'Hungary', 'Morocco', 'Nigeria', 'Senegal', 'Egypt',
      'Ghana', 'Cameroon', 'South Africa', 'Iran', 'Iraq', 'Qatar',
      'China', 'India', 'Indonesia', 'Thailand', 'Vietnam'
    ];
    
    if (nationalTeamNames.includes(teamName)) {
      return translateCountry(teamName);
    }
    return teamName;
  };

  // ✅ Countdown ticker için state (canlı maçlar için pulse animasyonu)
  const [countdownTicker, setCountdownTicker] = useState(0);
  
  // Mock canlı maçlar (canlı maç yoksa göster)
  const mockLiveMatches = React.useMemo(() => {
    if (liveMatches.length > 0) return [];
    
    const now = Date.now() / 1000;
    return [
      {
        fixture: {
          id: 999901,
          timestamp: now - 3600,
          date: new Date((now - 3600) * 1000).toISOString(),
          status: { short: '1H', long: 'First Half', elapsed: 45 },
          venue: { name: 'Sükrü Saracoğlu Stadyumu', city: 'İstanbul' },
        },
        league: { id: 203, name: 'Süper Lig', country: 'Turkey', logo: null },
        teams: {
          home: { id: 611, name: 'Fenerbahçe', logo: null },
          away: { id: 610, name: 'Galatasaray', logo: null },
        },
        goals: { home: 2, away: 1 },
        score: {
          halftime: { home: 1, away: 0 },
          fulltime: { home: null, away: null },
        },
      },
      {
        fixture: {
          id: 999902,
          timestamp: now - 2700,
          date: new Date((now - 2700) * 1000).toISOString(),
          status: { short: '1H', long: 'First Half', elapsed: 65 },
          venue: { name: 'Türk Telekom Stadyumu', city: 'İstanbul' },
        },
        league: { id: 203, name: 'Süper Lig', country: 'Turkey', logo: null },
        teams: {
          home: { id: 612, name: 'Beşiktaş', logo: null },
          away: { id: 613, name: 'Trabzonspor', logo: null },
        },
        goals: { home: 0, away: 1 },
        score: {
          halftime: { home: 0, away: 1 },
          fulltime: { home: null, away: null },
        },
      },
      {
        fixture: {
          id: 999903,
          timestamp: now - 1800,
          date: new Date((now - 1800) * 1000).toISOString(),
          status: { short: '2H', long: 'Second Half', elapsed: 72 },
          venue: { name: 'Rams Park', city: 'İstanbul' },
        },
        league: { id: 61, name: 'Champions League', country: 'Europe', logo: null },
        teams: {
          home: { id: 85, name: 'Real Madrid', logo: null },
          away: { id: 81, name: 'Bayern Munich', logo: null },
        },
        goals: { home: 1, away: 1 },
        score: {
          halftime: { home: 1, away: 0 },
          fulltime: { home: null, away: null },
        },
      },
      {
        fixture: {
          id: 999904,
          timestamp: now - 900,
          date: new Date((now - 900) * 1000).toISOString(),
          status: { short: '2H', long: 'Second Half', elapsed: 85 },
          venue: { name: 'Camp Nou', city: 'Barcelona' },
        },
        league: { id: 61, name: 'Champions League', country: 'Europe', logo: null },
        teams: {
          home: { id: 529, name: 'Barcelona', logo: null },
          away: { id: 85, name: 'Real Madrid', logo: null },
        },
        goals: { home: 3, away: 2 },
        score: {
          halftime: { home: 2, away: 1 },
          fulltime: { home: null, away: null },
        },
      },
    ];
  }, [liveMatches]);

  // ✅ Canlı maçları filtrele ve sırala - en son başlayan en üstte
  const allLiveMatches = liveMatches.length > 0 ? liveMatches : mockLiveMatches;
  const filteredLiveMatches = React.useMemo(() => {
    let matches = allLiveMatches;
    
    // Takım filtresi varsa uygula
    if (selectedTeamId) {
      matches = matches.filter(match => {
        const homeId = match.teams?.home?.id;
        const awayId = match.teams?.away?.id;
        return homeId === selectedTeamId || awayId === selectedTeamId;
      });
    }
    
    // En son başlayan en üstte (timestamp azalan)
    return [...matches].sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
  }, [allLiveMatches, selectedTeamId]);

  // ✅ Biten maçları filtrele ve sırala - en son biten en üstte
  const filteredFinishedMatches = React.useMemo(() => {
    let matches = [...pastMatches];
    
    // Takım filtresi varsa uygula
    if (selectedTeamId) {
      matches = matches.filter(match => {
        const homeId = match.teams?.home?.id;
        const awayId = match.teams?.away?.id;
        return homeId === selectedTeamId || awayId === selectedTeamId;
      });
    }
    
    // En son biten en üstte (timestamp azalan)
    return matches.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
  }, [pastMatches, selectedTeamId]);
  
  useEffect(() => {
    if (filteredLiveMatches.length > 0) {
      const interval = setInterval(() => {
        setCountdownTicker(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [filteredLiveMatches.length]);

  // ✅ Maç kartı bileşeni (Dashboard'daki gibi)
  const MatchCardComponent = React.memo(({ match, status, onPress }: { match: any; status: 'upcoming' | 'live' | 'finished'; onPress?: () => void }) => {
    const homeColors = getTeamColors(match.teams.home.name);
    const awayColors = getTeamColors(match.teams.away.name);
    
    // Pulse animasyonu (canlı maçlar için)
    const pulseAnim = React.useRef(new RNAnimated.Value(1)).current;
    
    React.useEffect(() => {
      if (status === 'live') {
        const animation = RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(pulseAnim, {
              toValue: 0.3,
              duration: 750,
              useNativeDriver: true,
            }),
            RNAnimated.timing(pulseAnim, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ])
        );
        animation.start();
        return () => animation.stop();
      } else {
        pulseAnim.setValue(1);
      }
    }, [status]);
    
    return (
      <TouchableOpacity
        style={matchCardStyles.matchCardContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1A3A34', '#162E29', '#122520']}
          style={matchCardStyles.matchCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Sol kenar gradient şerit */}
          <LinearGradient
            colors={homeColors}
            style={matchCardStyles.matchCardLeftStrip}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          {/* Sağ kenar gradient şerit */}
          <LinearGradient
            colors={[...awayColors].reverse()}
            style={matchCardStyles.matchCardRightStrip}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          
          <View style={matchCardStyles.matchCardContent}>
            {/* Turnuva Badge - En Üstte Ortada */}
            <View style={matchCardStyles.matchCardTournamentBadge}>
              <Ionicons name="trophy" size={9} color="#34d399" />
              <Text style={matchCardStyles.matchCardTournamentText}>{match.league.name}</Text>
            </View>
            
            {/* Stadyum Bilgisi - Turnuva Badge'in Altında */}
            {(() => {
              const venueName = (match.fixture as any)?.venue?.name || 
                                (match as any)?.venue?.name || 
                                (match as any)?.venue_name ||
                                null;
              return venueName ? (
                <View style={matchCardStyles.matchCardVenueContainer}>
                  <Ionicons name="location" size={9} color="#94a3b8" />
                  <Text style={matchCardStyles.matchCardVenueText} numberOfLines={1}>
                    {venueName}
                  </Text>
                </View>
              ) : null;
            })()}
            
            {/* Takımlar Bölümü */}
            <View style={matchCardStyles.matchCardTeamsContainer}>
              {/* Ev Sahibi Takım */}
              <View style={matchCardStyles.matchCardTeamLeft}>
                <Text style={matchCardStyles.matchCardTeamName} numberOfLines={1}>{getDisplayTeamName(match.teams.home.name)}</Text>
                <Text style={matchCardStyles.matchCardCoachName}>{getCoachName(match.teams.home.name)}</Text>
                {(status === 'live' || status === 'finished') && (
                  <View style={status === 'live' ? matchCardStyles.matchCardScoreBoxLive : matchCardStyles.matchCardScoreBox}>
                    <Text style={status === 'live' ? matchCardStyles.matchCardScoreTextLive : matchCardStyles.matchCardScoreText}>{match.goals?.home ?? 0}</Text>
                  </View>
                )}
              </View>
              
              {/* Ortada Maç Bilgileri */}
              <View style={matchCardStyles.matchCardCenterInfo}>
                <View style={matchCardStyles.matchCardMatchInfoCard}>
                  {/* Tarih */}
                  <View style={matchCardStyles.matchCardInfoRow}>
                    <Ionicons name="time" size={9} color="#94a3b8" />
                    <Text style={matchCardStyles.matchCardInfoTextBold}>
                      {new Date(match.fixture.date).toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                  
                  {/* Saat */}
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={matchCardStyles.matchCardTimeBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={matchCardStyles.matchCardTimeText}>
                      {api.utils.formatMatchTime(match.fixture.timestamp)}
                    </Text>
                  </LinearGradient>
                </View>
              </View>
              
              {/* Deplasman Takım */}
              <View style={matchCardStyles.matchCardTeamRight}>
                <Text style={[matchCardStyles.matchCardTeamName, matchCardStyles.matchCardTeamNameRight]} numberOfLines={1}>{getDisplayTeamName(match.teams.away.name)}</Text>
                <Text style={matchCardStyles.matchCardCoachNameAway}>{getCoachName(match.teams.away.name)}</Text>
                {(status === 'live' || status === 'finished') && (
                  <View style={status === 'live' ? matchCardStyles.matchCardScoreBoxLive : matchCardStyles.matchCardScoreBox}>
                    <Text style={status === 'live' ? matchCardStyles.matchCardScoreTextLive : matchCardStyles.matchCardScoreText}>{match.goals?.away ?? 0}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Durum Badge'i (Canlı) */}
            {status === 'live' ? (
              <View style={matchCardStyles.matchCardLiveContainer}>
                <LinearGradient
                  colors={['#dc2626', '#b91c1c']}
                  style={matchCardStyles.matchCardLiveBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <RNAnimated.View style={[matchCardStyles.matchCardLiveDot, { opacity: pulseAnim }]} />
                  <Text style={matchCardStyles.matchCardLiveText}>ŞUAN OYNANIYOR</Text>
                </LinearGradient>
                
                {match.fixture.status?.elapsed && (
                  <View style={matchCardStyles.matchCardLiveMinuteBadge}>
                    <Ionicons name="time" size={14} color="#10b981" />
                    <Text style={matchCardStyles.matchCardLiveMinuteText}>{match.fixture.status.elapsed}'</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  });

  // Wrapper function for backward compatibility
  const renderMatchCard = (match: any, status: 'upcoming' | 'live' | 'finished', onPress?: () => void) => {
    return <MatchCardComponent match={match} status={status} onPress={onPress} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Grid Pattern Background - Dashboard ile aynı */}
        <View style={styles.gridPattern} />
        
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
        

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ✅ SADECE CANLI MAÇLAR - Takım seçiliyse filtreli */}
          
          {/* Loading State */}
          {loading && !hasLoadedOnce && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>
                {showOnlyFinished ? 'Biten maçlar yükleniyor...' : 'Canlı maçlar yükleniyor...'}
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ Bir hata oluştu: {error}</Text>
            </View>
          )}

          {/* ✅ Biten Maçlar Modu */}
          {showOnlyFinished ? (
            <>
              {/* Empty State - No Finished Matches */}
              {!loading && hasLoadedOnce && filteredFinishedMatches.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="checkmark-done-outline" size={64} color="#64748B" />
                  </View>
                  <Text style={styles.emptyStateTitleLive}>
                    {selectedTeamId ? 'Bu takımın biten maçı yok' : 'Henüz biten maç yok'}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    Yaklaşan maçları görmek için{'\n'}Ana Sayfa'ya dön
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => onNavigate?.('home')}
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

              {/* Finished Matches */}
              {filteredFinishedMatches.length > 0 && (
                <View style={styles.section}>
                  {filteredFinishedMatches.map((match, index) => {
                    const matchId = String(match.fixture?.id || match.id);
                    return (
                      <Animated.View 
                        key={matchId} 
                        entering={getEnteringAnimation(index)} 
                        style={styles.liveMatchCardWrapper}
                        onLayout={(event) => {
                          const { y } = event.nativeEvent.layout;
                          matchCardPositions.current[matchId] = y;
                        }}
                      >
                        {renderMatchCard(match, 'finished', () => {
                          onMatchResultSelect?.(matchId) || onMatchSelect(matchId);
                        })}
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Empty State - No Live Matches */}
              {!loading && hasLoadedOnce && filteredLiveMatches.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="radio-outline" size={64} color="#64748B" />
                  </View>
                  <Text style={styles.emptyStateTitleLive}>
                    {selectedTeamId ? 'Bu takımın canlı maçı yok' : 'Şuan canlı maç yok'}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    Yaklaşan maçları görmek için{'\n'}Ana Sayfa'ya dön
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => onNavigate?.('home')}
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

              {/* Live Matches - Başlık yok, direkt maçlar */}
              {filteredLiveMatches.length > 0 && (
                <View style={styles.section}>
                  {filteredLiveMatches.map((match, index) => {
                    const matchId = String(match.fixture?.id || match.id);
                    return (
                      <Animated.View 
                        key={matchId} 
                        entering={getEnteringAnimation(index)} 
                        style={styles.liveMatchCardWrapper}
                        onLayout={(event) => {
                          // Maç kartı pozisyonunu kaydet
                          const { y } = event.nativeEvent.layout;
                          matchCardPositions.current[matchId] = y;
                        }}
                      >
                        {renderMatchCard(match, 'live', () => {
                          // Maç kartına scroll yap
                          const cardY = matchCardPositions.current[matchId];
                          if (cardY !== undefined && scrollViewRef.current) {
                            scrollViewRef.current.scrollTo({
                              y: cardY - 20,
                              animated: true,
                            });
                          }
                          onMatchSelect(matchId);
                        })}
                      </Animated.View>
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
    backgroundColor: '#0F2A24', // Koyu yeşil zemin - Dashboard ile aynı
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
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
    backgroundColor: '#0F2A24', // Koyu yeşil zemin
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 245 : 235, // ✅ Dashboard ile aynı - ProfileCard + team filter
    paddingHorizontal: 16,
    paddingBottom: 100,
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
    backgroundColor: '#1A3A34', // Koyu yeşil
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
  emptyStateTitleLive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
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
    backgroundColor: '#1A3A34', // Koyu yeşil - Dashboard ile uyumlu
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

// Match Card Styles (Dashboard'daki renderMatchCard için)
const matchCardStyles = StyleSheet.create({
  matchCardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  matchCard: {
    width: '100%',
    maxWidth: 768,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  matchCardLeftStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 8,
    height: '100%',
    zIndex: 0,
  },
  matchCardRightStrip: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: '100%',
    zIndex: 0,
  },
  matchCardContent: {
    padding: 12,
    zIndex: 1,
  },
  matchCardTournamentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 4,
  },
  matchCardTournamentText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#34d399',
  },
  matchCardVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  matchCardVenueText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  matchCardTeamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  matchCardTeamLeft: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  matchCardTeamRight: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  matchCardTeamName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  matchCardTeamNameRight: {
    textAlign: 'right',
  },
  matchCardCoachName: {
    fontSize: 10,
    color: '#94a3b8',
  },
  matchCardCoachNameAway: {
    fontSize: 10,
    color: '#fb923c',
    textAlign: 'right',
  },
  matchCardCenterInfo: {
    alignItems: 'center',
    minWidth: 140,
    maxWidth: 160,
  },
  matchCardMatchInfoCard: {
    width: '100%',
    alignItems: 'center',
    gap: 3,
  },
  matchCardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  matchCardInfoTextBold: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  matchCardTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
      },
    }),
  },
  matchCardTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  matchCardLiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    marginTop: 2,
  },
  matchCardLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
      },
    }),
  },
  matchCardLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  matchCardLiveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  matchCardLiveMinuteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  matchCardLiveMinuteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  matchCardScoreBox: {
    marginTop: 4,
    backgroundColor: '#0F2A24',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 45,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  matchCardScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    ...Platform.select({
      web: {
        textShadow: '1px 1px 0px #1FA2A6',
      },
      default: {
        textShadowColor: '#1FA2A6',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  matchCardScoreBoxLive: {
    marginTop: 4,
    backgroundColor: '#0F2A24',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 45,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  matchCardScoreTextLive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    ...Platform.select({
      web: {
        textShadow: '1px 1px 0px #1FA2A6',
      },
      default: {
        textShadowColor: '#1FA2A6',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});
