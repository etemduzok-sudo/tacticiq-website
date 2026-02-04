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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../services/api';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';

// Platform-safe animation helper (web doesn't support .delay().springify())
const getEnteringAnimation = (index: number = 0, baseDelay: number = 150) => {
  if (Platform.OS === 'web') {
    return FadeInDown;
  }
  return FadeInDown.delay(baseDelay + index * 50).springify();
};
import { logger } from '../utils/logger';
import { translateCountry } from '../utils/countryUtils';
import { getTeamColors as getTeamColorsUtil } from '../utils/teamColors';
import { useMatchesWithPredictions } from '../hooks/useMatchesWithPredictions';
import { MatchPredictionSummaryCard } from '../components/match/MatchPredictionSummaryCard';

const { width } = Dimensions.get('window');

interface MatchListScreenProps {
  onMatchSelect: (matchId: string, options?: { initialTab?: string }) => void;
  onMatchResultSelect?: (matchId: string) => void;
  onNavigate?: (screen: string) => void;
  onProfileClick?: () => void;
  /** Tümü: boş array → tüm favori takımların maçları. Tek/çoklu: sadece seçili takımların maçları. */
  selectedTeamIds?: number[];
  showOnlyFinished?: boolean;
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
  selectedTeamIds = [],
  showOnlyFinished = false,
  matchData,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const matchCardPositions = useRef<{ [key: string]: number }>({});
  const { favoriteTeams } = useFavoriteTeams();
  const { liveMatches = [], pastMatches = [], loading, error, hasLoadedOnce } = matchData;

  // ✅ Takım filtresi: boş = tüm favoriler, dolu = sadece seçili takımların maçları
  // ID tip tutarlılığı: API bazen number bazen string dönebilir, hepsini number ile karşılaştır
  const filterByTeamIds = React.useCallback((matches: any[], teamIds: number[]) => {
    if (!matches.length) return [];
    const ids = teamIds.length === 0 ? favoriteTeams.map(t => Number(t.id)) : teamIds.map(id => Number(id));
    const idSet = new Set(ids);
    return matches.filter(m => {
      const matchId = m.fixture?.id || m.id;
      if (matchId === 999999) return true; // ✅ Mock maç her zaman görünsün
      if (favoriteTeams.length === 0) return true;
      const homeId = m.teams?.home?.id != null ? Number(m.teams.home.id) : null;
      const awayId = m.teams?.away?.id != null ? Number(m.teams.away.id) : null;
      return (homeId != null && idSet.has(homeId)) || (awayId != null && idSet.has(awayId));
    });
  }, [favoriteTeams]);

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

  // ✅ Helper: Takım renklerini al (Global utility kullan - tutarlılık için)
  const getTeamColors = (teamName: string): string[] => {
    return getTeamColorsUtil(teamName);
  };

  // ✅ Teknik direktör ismini al (2026 Ocak güncel)
  const getCoachName = (teamName: string): string => {
    const name = teamName.toLowerCase();
    // ✅ Fallback liste - Ocak 2026 güncel (web search ile doğrulandı)
    const coaches: Record<string, string> = {
      // Türk Takımları (2026 Ocak güncel)
      'galatasaray': 'Okan Buruk',
      'fenerbahçe': 'Domenico Tedesco', // ✅ Mourinho ayrıldı, Tedesco geldi
      'fenerbahce': 'Domenico Tedesco',
      'beşiktaş': 'Sergen Yalçın', // ✅ Solskjaer ayrıldı, Sergen geldi
      'besiktas': 'Sergen Yalçın',
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
  
  // ✅ Mock data KALDIRILDI - sadece gerçek API verisi kullanılıyor
  // Canlı maç yoksa boş array gösterilecek

  // ✅ Canlı maçları selectedTeamIds ile filtrele (Tümü = boş → tüm favoriler, tek/çoklu = seçili takımlar)
  // ✅ SADECE gerçekten canlı olan maçları göster (status: 1H, 2H, HT, ET, BT, P, LIVE)
  const filteredLiveMatches = React.useMemo(() => {
    const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
    
    // Önce gerçekten canlı olanları filtrele
    const actuallyLive = liveMatches.filter(m => {
      const status = m.fixture?.status?.short || '';
      const matchId = m.fixture?.id || m.id;
      // Mock maç (999999) her zaman canlı kabul edilsin
      if (matchId === 999999) return true;
      return LIVE_STATUSES.includes(status);
    });
    
    const filtered = filterByTeamIds(actuallyLive, selectedTeamIds);
    const unique = filtered.reduce((acc: any[], m) => {
      const id = m.fixture?.id;
      if (id && !acc.some(x => x.fixture?.id === id)) acc.push(m);
      return acc;
    }, []);
    return unique.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
  }, [liveMatches, selectedTeamIds, filterByTeamIds]);

  // ✅ Biten maçları selectedTeamIds ile filtrele
  const filteredFinishedMatches = React.useMemo(() => {
    const filtered = filterByTeamIds(pastMatches, selectedTeamIds);
    const unique = filtered.reduce((acc: any[], m) => {
      const id = m.fixture?.id;
      if (id && !acc.some(x => x.fixture?.id === id)) acc.push(m);
      return acc;
    }, []);
    return unique.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);
  }, [pastMatches, selectedTeamIds, filterByTeamIds]);

  const allMatchIds = React.useMemo(() => {
    const live = (filteredLiveMatches || []).map(m => m.fixture?.id ?? m.id).filter(Boolean) as number[];
    const finished = (filteredFinishedMatches || []).map(m => m.fixture?.id ?? m.id).filter(Boolean) as number[];
    return [...new Set([...live, ...finished])];
  }, [filteredLiveMatches, filteredFinishedMatches]);
  const { matchIdsWithPredictions, clearPredictionForMatch } = useMatchesWithPredictions(allMatchIds);
  
  useEffect(() => {
    if (filteredLiveMatches.length > 0) {
      const interval = setInterval(() => {
        setCountdownTicker(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [filteredLiveMatches.length]);

  // ✅ Maç kartı bileşeni (Dashboard'daki gibi) – tahmin belirteci ve silme seçeneği
  const MatchCardComponent = React.memo(({ match, status, onPress, hasPrediction, matchId, onDeletePrediction }: { 
    match: any; 
    status: 'upcoming' | 'live' | 'finished'; 
    onPress?: () => void;
    hasPrediction?: boolean;
    matchId?: number;
    onDeletePrediction?: (matchId: number) => void;
  }) => {
    const homeColors = getTeamColors(match.teams.home.name);
    const awayColors = getTeamColors(match.teams.away.name);
    
    const handleLongPress = () => {
      if (hasPrediction && matchId != null && onDeletePrediction) {
        Alert.alert(
          'Tahmini sil',
          'Bu maça yaptığınız tahmini silmek istiyor musunuz? Maç detayına girerek kadro ve tahminleri tekrar kurabilir veya güncelleyebilirsiniz.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => onDeletePrediction(matchId) },
          ]
        );
      }
    };
    
    // Pulse animasyonu (canlı maçlar için)
    const pulseAnim = React.useRef(new RNAnimated.Value(1)).current;
    
    React.useEffect(() => {
      if (status === 'live') {
        const animation = RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(pulseAnim, {
              toValue: 0.3,
              duration: 750,
              useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
            }),
            RNAnimated.timing(pulseAnim, {
              toValue: 1,
              duration: 750,
              useNativeDriver: Platform.OS !== 'web', // ✅ Web için false
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
        onLongPress={handleLongPress}
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
                  
                  {/* Saat veya Canlı Dakika */}
                  <LinearGradient
                    colors={status === 'live' ? ['#dc2626', '#b91c1c'] : ['#10b981', '#059669']}
                    style={matchCardStyles.matchCardTimeBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[matchCardStyles.matchCardTimeText, status === 'live' && matchCardStyles.matchCardTimeTextLive]}>
                      {status === 'live' && match.fixture?.status?.elapsed != null
                        ? `${match.fixture.status.elapsed}'`
                        : api.utils.formatMatchTime(match.fixture.timestamp)}
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
                  <Text style={matchCardStyles.matchCardLiveText}>OYNANIYOR</Text>
                </LinearGradient>
              </View>
            ) : status === 'finished' ? (
              /* ✅ Biten maçlar için bilgi notu */
              <View style={matchCardStyles.matchCardFinishedHint}>
                <Ionicons name="stats-chart" size={12} color="#64748B" />
                <Text style={matchCardStyles.matchCardFinishedHintText}>
                  İstatistikler ve maç özeti için tıklayın
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#64748B" />
              </View>
            ) : null}
          </View>
          {/* Tahmin yaptınız: sarı yıldız — en üstte (son child) ki tıklanabilsin */}
          {hasPrediction && matchId != null && onDeletePrediction && (
            <TouchableOpacity
              style={matchCardStyles.matchCardPredictionStarHitArea}
              onPress={(e) => {
                e?.stopPropagation?.();
                Alert.alert(
                  'Tahmini sil',
                  'Bu maça yaptığınız tahmini silmek istiyor musunuz?',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Sil', style: 'destructive', onPress: () => onDeletePrediction(matchId) },
                  ]
                );
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={1}
            >
              <Ionicons name="star" size={20} color="#fbbf24" />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  });

  const renderMatchCard = (match: any, status: 'upcoming' | 'live' | 'finished', onPress?: () => void) => {
    const mid = match.fixture?.id ?? match.id;
    return (
      <MatchCardComponent
        match={match}
        status={status}
        onPress={onPress}
        hasPrediction={mid != null ? matchIdsWithPredictions.has(mid) : false}
        matchId={mid}
        onDeletePrediction={clearPredictionForMatch}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Grid Pattern Background - Dashboard ile aynı */}
        <View style={styles.gridPattern} />

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
                {showOnlyFinished ? 'Biten maçlar yükleniyor...' : 'Oynanıyor maçlar yükleniyor...'}
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
                    {selectedTeamIds.length > 0
                      ? 'Seçili takımların biten maçı yok'
                      : 'Biten maç yok'}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {selectedTeamIds.length > 0
                      ? 'Seçili takımların biten maçı yok'
                      : 'Maçlar sekmesine dön'}
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
                      <Text style={styles.emptyStateButtonText}>Maçlar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Finished Matches + Tahmin Özeti */}
              {filteredFinishedMatches.length > 0 && (
                <View style={styles.section}>
                  {filteredFinishedMatches.map((match, index) => {
                    const matchId = String(match.fixture?.id || match.id);
                    const numericMatchId = match.fixture?.id || parseInt(match.id);
                    const hasPrediction = numericMatchId != null && matchIdsWithPredictions.has(numericMatchId);
                    
                    return (
                      <View key={matchId}>
                        <Animated.View 
                          entering={getEnteringAnimation(index)} 
                          style={styles.liveMatchCardWrapper}
                          onLayout={(event) => {
                            const { y } = event.nativeEvent.layout;
                            matchCardPositions.current[matchId] = y;
                          }}
                        >
                        {renderMatchCard(match, 'finished', () => {
                          // Biten maçlar için: MatchResultSummary (match-detail stats)
                          if (onMatchResultSelect) {
                            onMatchResultSelect(matchId);
                          } else {
                            onMatchSelect(matchId, { initialTab: 'stats' });
                          }
                        })}
                        </Animated.View>
                        
                        {/* ✅ Tahmin yapıldıysa özet kartı göster */}
                        {hasPrediction && (
                          <MatchPredictionSummaryCard
                            matchId={numericMatchId}
                            matchData={{
                              homeTeam: match.teams?.home?.name || 'Ev Sahibi',
                              awayTeam: match.teams?.away?.name || 'Deplasman',
                              homeScore: match.goals?.home ?? 0,
                              awayScore: match.goals?.away ?? 0,
                              status: match.fixture?.status?.short || 'FT',
                            }}
                            onViewDetails={() => {
                              // Detaylı bilgi için İstatistik sekmesine git
                              onMatchSelect(matchId, { initialTab: 'stats' });
                            }}
                          />
                        )}
                      </View>
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
                    {selectedTeamIds.length > 0
                      ? 'Seçili takımların oynanıyor maçı yok'
                      : 'Oynanıyor maç yok'}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {selectedTeamIds.length > 0
                      ? 'Seçili takımların şu an oynanıyor maçı yok'
                      : 'Maçlar sekmesine dön'}
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
                      <Text style={styles.emptyStateButtonText}>Maçlar</Text>
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
                          const cardY = matchCardPositions.current[matchId];
                          if (cardY !== undefined && scrollViewRef.current) {
                            scrollViewRef.current.scrollTo({
                              y: cardY - 20,
                              animated: true,
                            });
                          }
                          const hasPred = (match.fixture?.id != null && matchIdsWithPredictions.has(match.fixture.id));
                          onMatchSelect(matchId, hasPred ? { initialTab: 'prediction' } : undefined);
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
  matchCardPredictionStarHitArea: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
    padding: 6,
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
  matchCardTimeTextLive: {
    color: '#ffffff', // Kırmızı arka plan üzerinde beyaz text
    fontWeight: '900',
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
  matchCardFinishedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 8,
  },
  matchCardFinishedHintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
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
