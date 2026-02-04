// MatchResultSummary.tsx - Biten Maçlar İçin Özet Sayfası
// 2 Sekme: Maç İstatistikleri, Oyuncu İstatistikleri
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useFavoriteTeams } from '../../hooks/useFavoriteTeams';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Animasyonları conditional import
let Animated: any;
let FadeInDown: any;
let FadeIn: any;

if (isWeb) {
  const RNAnimated = require('react-native').Animated;
  Animated = { View: RNAnimated.View };
  FadeInDown = undefined;
  FadeIn = undefined;
} else {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default || Reanimated;
    FadeInDown = Reanimated.FadeInDown;
    FadeIn = Reanimated.FadeIn;
  } catch (_e) {
    const RNAnimated = require('react-native').Animated;
    Animated = { View: RNAnimated.View };
    FadeInDown = undefined;
    FadeIn = undefined;
  }
}

interface MatchResultSummaryProps {
  matchId: number | string;
  matchData: any;
}

// Tab tipleri
type TabType = 'match' | 'players';

// İstatistik tipi
interface MatchStat {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

// Oyuncu istatistik tipi - genişletilmiş
interface PlayerStat {
  id: number;
  name: string;
  number?: number;
  position: string;
  rating?: number;
  photo?: string;
  team: 'home' | 'away';
  stats: {
    minutes?: number;
    goals?: number;
    assists?: number;
    shots?: number;
    shotsOnTarget?: number;
    shotsInsideBox?: number;
    shotsOutsideBox?: number;
    passes?: number;
    passAccuracy?: number;
    keyPasses?: number;
    longBalls?: number;
    longBallsAccuracy?: number;
    tackles?: number;
    interceptions?: number;
    duelsWon?: number;
    duelsTotal?: number;
    aerialDuelsWon?: number;
    aerialDuelsTotal?: number;
    dribbleAttempts?: number;
    dribbleSuccess?: number;
    dispossessed?: number;
    foulsCommitted?: number;
    wasFouled?: number;
    clearances?: number;
    blockedShots?: number;
    saves?: number;
    yellowCards?: number;
    redCards?: number;
  };
}

export function MatchResultSummary({ matchId, matchData }: MatchResultSummaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [loading, setLoading] = useState(true);
  const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set());

  // Favori takımları al
  const { favoriteTeams } = useFavoriteTeams();
  const favoriteTeamIds = favoriteTeams.map(t => t.id);

  const homeTeam = matchData?.teams?.home;
  const awayTeam = matchData?.teams?.away;
  const homeScore = matchData?.goals?.home ?? 0;
  const awayScore = matchData?.goals?.away ?? 0;

  // Hangi takımlar favori?
  const isHomeFavorite = favoriteTeamIds.includes(homeTeam?.id);
  const isAwayFavorite = favoriteTeamIds.includes(awayTeam?.id);
  const bothFavorite = isHomeFavorite && isAwayFavorite;

  // Verileri yükle
  useEffect(() => {
    loadAllData();
  }, [matchId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMatchStats(),
        loadPlayerStats(),
      ]);
    } catch (error) {
      console.error('Error loading match result data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Maç istatistiklerini yükle
  const loadMatchStats = async () => {
    try {
      const matchIdNum = typeof matchId === 'string' ? parseInt(matchId) : matchId;
      
      // Mock maç için mock data
      if (matchIdNum === 999999) {
        setMatchStats(generateMockMatchStats());
        return;
      }

      const response = await api.matches.getMatchStatistics(matchIdNum);
      if (response?.statistics) {
        setMatchStats(response.statistics);
      } else {
        setMatchStats(generateMockMatchStats());
      }
    } catch (error) {
      console.error('Error loading match stats:', error);
      setMatchStats(generateMockMatchStats());
    }
  };

  // Oyuncu istatistiklerini yükle
  const loadPlayerStats = async () => {
    try {
      const matchIdNum = typeof matchId === 'string' ? parseInt(matchId) : matchId;
      
      // Mock maç için mock data
      if (matchIdNum === 999999) {
        setPlayerStats(generateMockPlayerStats());
        return;
      }

      const response = await api.matches.getMatchDetails(matchIdNum);
      if (response?.players) {
        setPlayerStats(response.players);
      } else {
        setPlayerStats(generateMockPlayerStats());
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
      setPlayerStats(generateMockPlayerStats());
    }
  };

  // Mock maç istatistikleri
  const generateMockMatchStats = (): MatchStat[] => [
    { type: 'Ball Possession', home: '58%', away: '42%' },
    { type: 'Total Shots', home: 14, away: 8 },
    { type: 'Shots on Goal', home: 6, away: 3 },
    { type: 'Shots off Goal', home: 5, away: 3 },
    { type: 'Blocked Shots', home: 3, away: 2 },
    { type: 'Corner Kicks', home: 7, away: 4 },
    { type: 'Offsides', home: 2, away: 3 },
    { type: 'Fouls', home: 11, away: 14 },
    { type: 'Yellow Cards', home: 2, away: 3 },
    { type: 'Red Cards', home: 0, away: 0 },
    { type: 'Goalkeeper Saves', home: 2, away: 4 },
    { type: 'Total Passes', home: 487, away: 356 },
    { type: 'Passes Accurate', home: 421, away: 298 },
    { type: 'Passes %', home: '86%', away: '84%' },
  ];

  // Mock oyuncu istatistikleri - detaylı
  const generateMockPlayerStats = (): PlayerStat[] => [
    {
      id: 1001, name: 'Mock Striker', number: 9, position: 'ST', rating: 8.5, team: 'home',
      stats: { minutes: 90, goals: 1, assists: 1, shots: 5, shotsOnTarget: 3, shotsInsideBox: 4, shotsOutsideBox: 1,
        passes: 28, passAccuracy: 85, keyPasses: 3, longBalls: 2, longBallsAccuracy: 1,
        duelsWon: 8, duelsTotal: 12, aerialDuelsWon: 3, aerialDuelsTotal: 5,
        dribbleAttempts: 6, dribbleSuccess: 4, dispossessed: 2, foulsCommitted: 1, wasFouled: 3,
        tackles: 0, interceptions: 0, clearances: 0, blockedShots: 0 }
    },
    {
      id: 1002, name: 'Mock Midfielder', number: 10, position: 'CAM', rating: 8.2, team: 'home',
      stats: { minutes: 90, goals: 1, assists: 0, shots: 3, shotsOnTarget: 2, shotsInsideBox: 2,
        passes: 65, passAccuracy: 91, keyPasses: 5, longBalls: 8, longBallsAccuracy: 6,
        duelsWon: 6, duelsTotal: 10, aerialDuelsWon: 1, aerialDuelsTotal: 2,
        dribbleAttempts: 4, dribbleSuccess: 3, dispossessed: 1, foulsCommitted: 0, wasFouled: 2,
        tackles: 2, interceptions: 1, clearances: 0, blockedShots: 1 }
    },
    {
      id: 1003, name: 'Mock Winger', number: 7, position: 'LW', rating: 7.8, team: 'home',
      stats: { minutes: 78, goals: 0, assists: 1, shots: 2, shotsOnTarget: 1, shotsInsideBox: 1,
        passes: 42, passAccuracy: 82, keyPasses: 4, longBalls: 1, longBallsAccuracy: 1,
        duelsWon: 7, duelsTotal: 14, aerialDuelsWon: 0, aerialDuelsTotal: 1,
        dribbleAttempts: 10, dribbleSuccess: 7, dispossessed: 3, foulsCommitted: 1, wasFouled: 4,
        tackles: 1, interceptions: 0, clearances: 0, blockedShots: 0 }
    },
    {
      id: 1004, name: 'Mock Defender', number: 4, position: 'CB', rating: 7.5, team: 'home',
      stats: { minutes: 90, goals: 0, assists: 0, shots: 1, shotsOnTarget: 0, shotsInsideBox: 0,
        passes: 58, passAccuracy: 88, keyPasses: 0, longBalls: 12, longBallsAccuracy: 9,
        duelsWon: 9, duelsTotal: 11, aerialDuelsWon: 6, aerialDuelsTotal: 8,
        dribbleAttempts: 0, dribbleSuccess: 0, dispossessed: 0, foulsCommitted: 2, wasFouled: 1,
        tackles: 4, interceptions: 3, clearances: 8, blockedShots: 2 }
    },
    {
      id: 2001, name: 'Away Forward', number: 11, position: 'ST', rating: 7.2, team: 'away',
      stats: { minutes: 90, goals: 1, assists: 0, shots: 4, shotsOnTarget: 2, shotsInsideBox: 3,
        passes: 22, passAccuracy: 78, keyPasses: 1, longBalls: 0, longBallsAccuracy: 0,
        duelsWon: 5, duelsTotal: 12, aerialDuelsWon: 2, aerialDuelsTotal: 4,
        dribbleAttempts: 5, dribbleSuccess: 3, dispossessed: 4, foulsCommitted: 2, wasFouled: 2,
        tackles: 0, interceptions: 0, clearances: 0, blockedShots: 0 }
    },
    {
      id: 2002, name: 'Away Midfielder', number: 8, position: 'CM', rating: 6.8, team: 'away',
      stats: { minutes: 90, goals: 0, assists: 1, shots: 1, shotsOnTarget: 0, shotsInsideBox: 0,
        passes: 48, passAccuracy: 83, keyPasses: 2, longBalls: 5, longBallsAccuracy: 3,
        duelsWon: 4, duelsTotal: 9, aerialDuelsWon: 1, aerialDuelsTotal: 2,
        dribbleAttempts: 2, dribbleSuccess: 1, dispossessed: 2, foulsCommitted: 1, wasFouled: 1,
        tackles: 3, interceptions: 2, clearances: 1, blockedShots: 0 }
    },
  ];

  // İstatistik label çevirisi
  const translateStatLabel = (type: string): string => {
    const translations: Record<string, string> = {
      'Ball Possession': 'Topa Sahip Olma',
      'Total Shots': 'Toplam Şut',
      'Shots on Goal': 'İsabetli Şut',
      'Shots off Goal': 'İsabetsiz Şut',
      'Blocked Shots': 'Bloke Edilen Şut',
      'Corner Kicks': 'Korner',
      'Offsides': 'Ofsayt',
      'Fouls': 'Faul',
      'Yellow Cards': 'Sarı Kart',
      'Red Cards': 'Kırmızı Kart',
      'Goalkeeper Saves': 'Kaleci Kurtarışı',
      'Total Passes': 'Toplam Pas',
      'Passes Accurate': 'Başarılı Pas',
      'Passes %': 'Pas İsabeti',
      'expected_goals': 'Beklenen Gol (xG)',
    };
    return translations[type] || type;
  };

  // Oyuncu kartını genişlet/daralt
  const togglePlayerExpand = (playerId: number) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  // Tab butonları
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'match', label: 'Maç İstatistikleri', icon: 'stats-chart-outline' },
    { id: 'players', label: 'Oyuncu İstatistikleri', icon: 'people-outline' },
  ];

  // ==================== RENDER FUNCTIONS ====================

  // Maç istatistikleri tab'ı
  const renderMatchStatsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Skor Kartı */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreTeamName} numberOfLines={1} ellipsizeMode="tail">{homeTeam?.name || 'Ev Sahibi'}</Text>
          <Text style={styles.scoreValue}>{homeScore}</Text>
        </View>
        <View style={styles.scoreDivider}>
          <Text style={styles.scoreVs}>-</Text>
          <Text style={styles.scoreStatus}>Maç Sonu</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreTeamName} numberOfLines={1} ellipsizeMode="tail">{awayTeam?.name || 'Deplasman'}</Text>
          <Text style={styles.scoreValue}>{awayScore}</Text>
        </View>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Maç İstatistikleri</Text>
        {matchStats.map((stat, index) => {
          const homeVal = typeof stat.home === 'string' ? parseInt(stat.home) || 0 : (stat.home ?? 0);
          const awayVal = typeof stat.away === 'string' ? parseInt(stat.away) || 0 : (stat.away ?? 0);
          const total = homeVal + awayVal;
          const homePercent = total > 0 ? (homeVal / total) * 100 : 50;
          const awayPercent = total > 0 ? (awayVal / total) * 100 : 50;
          const homeLeads = homeVal > awayVal;
          const awayLeads = awayVal > homeVal;

          return (
            <View key={index} style={styles.statRow}>
              <Text style={[styles.statValue, homeLeads && styles.statValueHighlight]}>
                {stat.home ?? '-'}
              </Text>
              <View style={styles.statCenter}>
                <Text style={styles.statLabel}>{translateStatLabel(stat.type)}</Text>
                <View style={styles.statBarContainer}>
                  <View style={[styles.statBarHome, { width: `${homePercent}%` }, homeLeads && styles.statBarHighlight]} />
                  <View style={[styles.statBarAway, { width: `${awayPercent}%` }, awayLeads && styles.statBarHighlightAway]} />
                </View>
              </View>
              <Text style={[styles.statValue, awayLeads && styles.statValueHighlightAway]}>
                {stat.away ?? '-'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Maç Isı Haritası - API desteği geldiğinde */}
      <View style={styles.heatMapPlaceholder}>
        <Ionicons name="map-outline" size={32} color="#64748B" />
        <Text style={styles.heatMapTitle}>Maç Isı Haritası</Text>
        <Text style={styles.heatMapSubtitle}>
          API desteği eklendiğinde takımların sahada yoğunluk dağılımı burada görüntülenecek
        </Text>
      </View>
    </ScrollView>
  );

  // Oyuncu istatistikleri tab'ı
  const renderPlayersTab = () => {
    const homePlayers = playerStats.filter(p => p.team === 'home').sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const awayPlayers = playerStats.filter(p => p.team === 'away').sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const renderPlayerCard = (player: PlayerStat) => {
      const isExpanded = expandedPlayers.has(player.id);
      const ratingColor = (player.rating || 0) >= 8 ? '#10B981' : (player.rating || 0) >= 7 ? '#F59E0B' : '#EF4444';

      return (
        <TouchableOpacity 
          key={player.id} 
          style={styles.playerCard}
          onPress={() => togglePlayerExpand(player.id)}
          activeOpacity={0.7}
        >
          <View style={styles.playerHeader}>
            <View style={styles.playerInfo}>
              <View style={styles.playerNumberBadge}>
                <Text style={styles.playerNumber}>{player.number || '-'}</Text>
              </View>
              <View>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
              </View>
            </View>
            <View style={styles.playerRatingContainer}>
              <View style={[styles.playerRatingBadge, { backgroundColor: `${ratingColor}20`, borderColor: ratingColor }]}>
                <Text style={[styles.playerRating, { color: ratingColor }]}>{player.rating?.toFixed(1) || '-'}</Text>
              </View>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
            </View>
          </View>

          {/* Kısa İstatistikler */}
          <View style={styles.playerQuickStats}>
            {player.stats.goals !== undefined && player.stats.goals > 0 && (
              <View style={styles.quickStatItem}>
                <Ionicons name="football" size={12} color="#10B981" />
                <Text style={styles.quickStatText}>{player.stats.goals}</Text>
              </View>
            )}
            {player.stats.assists !== undefined && player.stats.assists > 0 && (
              <View style={styles.quickStatItem}>
                <Ionicons name="git-branch" size={12} color="#3B82F6" />
                <Text style={styles.quickStatText}>{player.stats.assists}</Text>
              </View>
            )}
            {player.stats.yellowCards !== undefined && player.stats.yellowCards > 0 && (
              <View style={styles.quickStatItem}>
                <View style={[styles.cardIcon, { backgroundColor: '#FBBF24' }]} />
                <Text style={styles.quickStatText}>{player.stats.yellowCards}</Text>
              </View>
            )}
            {player.stats.minutes !== undefined && (
              <View style={styles.quickStatItem}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={styles.quickStatText}>{player.stats.minutes}'</Text>
              </View>
            )}
          </View>

          {/* Genişletilmiş Detaylı İstatistikler - Geliştirilmiş Görünüm */}
          {isExpanded && (
            <View style={styles.playerExpandedStats}>
              {/* Hücum - Yeşil tema */}
              <View style={[styles.statGroupCard, styles.statGroupAttack]}>
                <View style={styles.statGroupHeader}>
                  <Ionicons name="flash" size={16} color="#10B981" />
                  <Text style={[styles.statGroupTitle, { color: '#10B981' }]}>Hücum</Text>
                </View>
                <View style={styles.statRows}>
                  {player.stats.shots !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="football-outline" size={14} color="#10B981" />
                      <Text style={styles.statRowLabel}>Şut</Text>
                      <Text style={styles.statRowValue}>{player.stats.shots}</Text>
                    </View>
                  )}
                  {player.stats.shotsOnTarget !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="locate-outline" size={14} color="#10B981" />
                      <Text style={styles.statRowLabel}>İsabetli</Text>
                      <Text style={styles.statRowValue}>{player.stats.shotsOnTarget}</Text>
                    </View>
                  )}
                  {player.stats.shotsInsideBox !== undefined && player.stats.shotsInsideBox > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="navigate-outline" size={14} color="#10B981" />
                      <Text style={styles.statRowLabel}>Ceza Sahası</Text>
                      <Text style={styles.statRowValue}>{player.stats.shotsInsideBox}</Text>
                    </View>
                  )}
                  {player.stats.dribbleAttempts !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="swap-horizontal-outline" size={14} color="#10B981" />
                      <Text style={styles.statRowLabel}>Dripling</Text>
                      <View style={styles.statRowRight}>
                        <View style={styles.miniBarBg}>
                          <View style={[styles.miniBarFill, { width: `${((player.stats.dribbleSuccess ?? 0) / player.stats.dribbleAttempts) * 100}%`, backgroundColor: '#10B981' }]} />
                        </View>
                        <Text style={styles.statRowValue}>{player.stats.dribbleSuccess ?? 0}/{player.stats.dribbleAttempts}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Pas - Mavi tema */}
              <View style={[styles.statGroupCard, styles.statGroupPass]}>
                <View style={styles.statGroupHeader}>
                  <Ionicons name="git-branch-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.statGroupTitle, { color: '#3B82F6' }]}>Pas</Text>
                </View>
                <View style={styles.statRows}>
                  {player.stats.passes !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="arrow-redo-outline" size={14} color="#3B82F6" />
                      <Text style={styles.statRowLabel}>Toplam</Text>
                      <Text style={styles.statRowValue}>{player.stats.passes}</Text>
                    </View>
                  )}
                  {player.stats.passAccuracy !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="analytics-outline" size={14} color="#3B82F6" />
                      <Text style={styles.statRowLabel}>İsabet</Text>
                      <View style={styles.statRowRight}>
                        <View style={styles.miniBarBg}>
                          <View style={[styles.miniBarFill, { width: `${player.stats.passAccuracy}%`, backgroundColor: '#3B82F6' }]} />
                        </View>
                        <Text style={styles.statRowValue}>{player.stats.passAccuracy}%</Text>
                      </View>
                    </View>
                  )}
                  {player.stats.keyPasses !== undefined && player.stats.keyPasses > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="key-outline" size={14} color="#3B82F6" />
                      <Text style={styles.statRowLabel}>Kilit Pas</Text>
                      <Text style={styles.statRowValue}>{player.stats.keyPasses}</Text>
                    </View>
                  )}
                  {player.stats.longBalls !== undefined && player.stats.longBalls > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="arrow-up-outline" size={14} color="#3B82F6" />
                      <Text style={styles.statRowLabel}>Uzun Top</Text>
                      <Text style={styles.statRowValue}>{player.stats.longBallsAccuracy ?? 0}/{player.stats.longBalls}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Mücadele - Turuncu tema */}
              <View style={[styles.statGroupCard, styles.statGroupDuels]}>
                <View style={styles.statGroupHeader}>
                  <Ionicons name="shield-outline" size={16} color="#F59E0B" />
                  <Text style={[styles.statGroupTitle, { color: '#F59E0B' }]}>Mücadele</Text>
                </View>
                <View style={styles.statRows}>
                  {player.stats.duelsWon !== undefined && player.stats.duelsTotal !== undefined && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="body-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>İkili</Text>
                      <View style={styles.statRowRight}>
                        <View style={styles.miniBarBg}>
                          <View style={[styles.miniBarFill, { width: `${(player.stats.duelsWon / player.stats.duelsTotal) * 100}%`, backgroundColor: '#F59E0B' }]} />
                        </View>
                        <Text style={styles.statRowValue}>{player.stats.duelsWon}/{player.stats.duelsTotal}</Text>
                      </View>
                    </View>
                  )}
                  {player.stats.aerialDuelsWon !== undefined && player.stats.aerialDuelsTotal !== undefined && player.stats.aerialDuelsTotal > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="airplane-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Havada</Text>
                      <Text style={styles.statRowValue}>{player.stats.aerialDuelsWon}/{player.stats.aerialDuelsTotal}</Text>
                    </View>
                  )}
                  {player.stats.tackles !== undefined && player.stats.tackles > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="hand-left-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Müdahale</Text>
                      <Text style={styles.statRowValue}>{player.stats.tackles}</Text>
                    </View>
                  )}
                  {player.stats.interceptions !== undefined && player.stats.interceptions > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="repeat-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Top Kapma</Text>
                      <Text style={styles.statRowValue}>{player.stats.interceptions}</Text>
                    </View>
                  )}
                  {player.stats.clearances !== undefined && player.stats.clearances > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="trash-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Temizlik</Text>
                      <Text style={styles.statRowValue}>{player.stats.clearances}</Text>
                    </View>
                  )}
                  {player.stats.dispossessed !== undefined && player.stats.dispossessed > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="remove-circle-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Top Kaybı</Text>
                      <Text style={styles.statRowValue}>{player.stats.dispossessed}</Text>
                    </View>
                  )}
                  {player.stats.foulsCommitted !== undefined && player.stats.foulsCommitted > 0 && (
                    <View style={styles.statRowItem}>
                      <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                      <Text style={styles.statRowLabel}>Faul</Text>
                      <Text style={styles.statRowValue}>{player.stats.foulsCommitted}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Isı Haritası Placeholder */}
              <View style={styles.playerHeatMapPlaceholder}>
                <Ionicons name="thermometer-outline" size={22} color="#1FA2A6" />
                <Text style={styles.playerHeatMapText}>
                  {player.name} — Isı haritası API desteği eklendiğinde görüntülenecek
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    // Sadece favori takımın oyuncularını göster
    // İki takım da favoriyse, her ikisini de göster
    const showHomePlayers = isHomeFavorite || (!isHomeFavorite && !isAwayFavorite);
    const showAwayPlayers = isAwayFavorite || (!isHomeFavorite && !isAwayFavorite);

    // Hiç favori yoksa (örneğin mock maç) ev sahibini göster
    const hasAnyFavorite = isHomeFavorite || isAwayFavorite;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* İki favori takım bilgilendirmesi */}
        {bothFavorite && (
          <View style={styles.bothFavoriteNotice}>
            <Ionicons name="heart" size={16} color="#EF4444" />
            <Text style={styles.bothFavoriteText}>
              Her iki takım da favorilerinizde! Her iki takımın oyuncu istatistikleri aşağıda.
            </Text>
          </View>
        )}

        {/* Ev Sahibi Oyuncular - sadece favori ise veya hiç favori yoksa */}
        {(showHomePlayers || !hasAnyFavorite) && (
          <View style={styles.teamPlayersSection}>
            <View style={styles.teamHeader}>
              <View style={[styles.teamColorBar, { backgroundColor: '#22D3EE' }]} />
              <Text style={styles.teamTitle}>{homeTeam?.name || 'Ev Sahibi'}</Text>
              {isHomeFavorite && (
                <View style={styles.favoriteIndicator}>
                  <Ionicons name="heart" size={12} color="#EF4444" />
                </View>
              )}
            </View>
            {homePlayers.length > 0 ? (
              homePlayers.map(renderPlayerCard)
            ) : (
              <Text style={styles.noPlayersText}>Oyuncu verisi bulunamadı</Text>
            )}
          </View>
        )}

        {/* Deplasman Oyuncuları - sadece favori ise */}
        {showAwayPlayers && isAwayFavorite && (
          <View style={styles.teamPlayersSection}>
            <View style={styles.teamHeader}>
              <View style={[styles.teamColorBar, { backgroundColor: '#FB923C' }]} />
              <Text style={styles.teamTitle}>{awayTeam?.name || 'Deplasman'}</Text>
              {isAwayFavorite && (
                <View style={styles.favoriteIndicator}>
                  <Ionicons name="heart" size={12} color="#EF4444" />
                </View>
              )}
            </View>
            {awayPlayers.length > 0 ? (
              awayPlayers.map(renderPlayerCard)
            ) : (
              <Text style={styles.noPlayersText}>Oyuncu verisi bulunamadı</Text>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  // Tab içeriğini render et (loading durumunda loading göster)
  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.tabContentLoading}>
          <ActivityIndicator size="large" color="#1FA2A6" />
          <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
        </View>
      );
    }
    
    if (activeTab === 'match') return renderMatchStatsTab();
    if (activeTab === 'players') return renderPlayersTab();
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher - Her zaman göster */}
      <View style={styles.tabSwitcher}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} 
            />
            <Text style={[styles.tabButtonText, activeTab === tab.id && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content - Loading durumunda da göster */}
      <View style={styles.tabContentWrapper}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1A14',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1A14',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  
  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0F2A24',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#1FA2A6',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Tab Content
  tabContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabContentWrapper: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  heatMapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
    backgroundColor: 'rgba(31, 162, 166, 0.08)',
    borderRadius: 12,
    marginHorizontal: 0,
  },
  heatMapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 8,
  },
  heatMapSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  playerHeatMapPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  playerHeatMapText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
  },
  expandedGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  statGroupCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  statGroupAttack: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderLeftColor: '#10B981',
  },
  statGroupPass: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderLeftColor: '#3B82F6',
  },
  statGroupDuels: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftColor: '#F59E0B',
  },
  statGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statRows: {
    gap: 6,
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 8,
    gap: 10,
  },
  statRowLabel: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
  },
  statRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBarBg: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Score Card
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#0F2A24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  scoreTeam: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  scoreTeamName: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreDivider: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  scoreVs: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
  },
  scoreStatus: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  
  // Stats Section
  statsSection: {
    backgroundColor: '#0F2A24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  statValueHighlight: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  statValueHighlightAway: {
    color: '#FB923C',
    fontWeight: '700',
  },
  statCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 6,
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#1E3A34',
  },
  statBarHome: {
    height: '100%',
    backgroundColor: '#22D3EE50',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  statBarAway: {
    height: '100%',
    backgroundColor: '#FB923C50',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  statBarHighlight: {
    backgroundColor: '#22D3EE',
  },
  statBarHighlightAway: {
    backgroundColor: '#FB923C',
  },
  
  // Team Players Section
  teamPlayersSection: {
    marginBottom: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamColorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  favoriteIndicator: {
    marginLeft: 8,
  },
  bothFavoriteNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  bothFavoriteText: {
    flex: 1,
    fontSize: 12,
    color: '#F87171',
    lineHeight: 18,
  },
  noPlayersText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Player Card
  playerCard: {
    backgroundColor: '#0F2A24',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1E3A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerPosition: {
    fontSize: 11,
    color: '#64748B',
  },
  playerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerRatingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  playerRating: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerQuickStats: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardIcon: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  playerExpandedStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E3A34',
  },
  expandedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expandedStatItem: {
    width: '23%',
    backgroundColor: '#1E3A34',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  expandedStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expandedStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  
  // No Points
  noPointsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noPointsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  noPointsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  
  // Total Points Card
  totalPointsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  totalPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  totalPointsLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  totalPointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalPointsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1FA2A6',
  },
  totalPointsMax: {
    fontSize: 18,
    color: '#64748B',
  },
  successRateContainer: {
    marginTop: 16,
  },
  successRateBar: {
    height: 8,
    backgroundColor: '#1E3A34',
    borderRadius: 4,
    overflow: 'hidden',
  },
  successRateFill: {
    height: '100%',
    borderRadius: 4,
  },
  successRateText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  
  // Points Section
  pointsSection: {
    backgroundColor: '#0F2A24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pointsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A34',
  },
  pointItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pointIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIconCorrect: {
    backgroundColor: '#10B981',
  },
  pointIconWrong: {
    backgroundColor: '#EF4444',
  },
  pointItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointItemDetail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pointItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  pointItemValuePositive: {
    color: '#10B981',
  },
});

export default MatchResultSummary;
