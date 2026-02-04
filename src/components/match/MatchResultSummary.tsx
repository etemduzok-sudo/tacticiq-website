// MatchResultSummary.tsx - Biten Maçlar İçin Özet Sayfası
// 3 Ana Bölüm: Maç İstatistikleri, Oyuncu İstatistikleri, Kullanıcı Puanları
import React, { useState, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../../config/constants';

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
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default || Reanimated;
  FadeInDown = Reanimated.FadeInDown;
  FadeIn = Reanimated.FadeIn;
}

interface MatchResultSummaryProps {
  matchId: number | string;
  matchData: any;
}

// Tab tipleri
type TabType = 'match' | 'players' | 'points';

// İstatistik tipi
interface MatchStat {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

// Oyuncu istatistik tipi
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
    passes?: number;
    passAccuracy?: number;
    keyPasses?: number;
    tackles?: number;
    interceptions?: number;
    duelsWon?: number;
    duelsTotal?: number;
    fouls?: number;
    yellowCards?: number;
    redCards?: number;
    saves?: number;
  };
}

// Kullanıcı puan detayları
interface UserPointsBreakdown {
  hasPrediction: boolean;
  totalPoints: number;
  maxPossiblePoints: number;
  breakdown: {
    scorePrediction: { points: number; correct: boolean; predicted: string; actual: string };
    goalsPrediction: { points: number; correct: boolean; predicted: string; actual: string };
    firstGoalPrediction: { points: number; correct: boolean; predicted: string; actual: string };
    halftimePrediction: { points: number; correct: boolean; predicted: string; actual: string };
    playerPredictions: {
      goalScorers: { points: number; correct: number; total: number };
      assists: { points: number; correct: number; total: number };
      cards: { points: number; correct: number; total: number };
      mvp: { points: number; correct: boolean; predicted: string; actual: string };
    };
    bonusPoints: number;
    timingBonus: number;
  };
}

export function MatchResultSummary({ matchId, matchData }: MatchResultSummaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('match');
  const [loading, setLoading] = useState(true);
  const [matchStats, setMatchStats] = useState<MatchStat[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [userPoints, setUserPoints] = useState<UserPointsBreakdown | null>(null);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<number>>(new Set());

  const homeTeam = matchData?.teams?.home;
  const awayTeam = matchData?.teams?.away;
  const homeScore = matchData?.goals?.home ?? 0;
  const awayScore = matchData?.goals?.away ?? 0;

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
        loadUserPoints(),
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

  // Kullanıcı puanlarını yükle
  const loadUserPoints = async () => {
    try {
      const predKey = `${STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const legacyPredKey = `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const predData = await AsyncStorage.getItem(predKey) || await AsyncStorage.getItem(legacyPredKey);
      
      if (predData) {
        const parsed = JSON.parse(predData);
        // Gerçek puan hesaplaması yapılacak - şimdilik mock
        setUserPoints(calculateUserPoints(parsed, matchData));
      } else {
        setUserPoints(null);
      }
    } catch (error) {
      console.error('Error loading user points:', error);
      setUserPoints(null);
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

  // Mock oyuncu istatistikleri
  const generateMockPlayerStats = (): PlayerStat[] => [
    {
      id: 1001, name: 'Mock Striker', number: 9, position: 'ST', rating: 8.5, team: 'home',
      stats: { minutes: 90, goals: 1, assists: 1, shots: 5, shotsOnTarget: 3, passes: 28, passAccuracy: 85, keyPasses: 3, duelsWon: 8, duelsTotal: 12 }
    },
    {
      id: 1002, name: 'Mock Midfielder', number: 10, position: 'CAM', rating: 8.2, team: 'home',
      stats: { minutes: 90, goals: 1, assists: 0, shots: 3, shotsOnTarget: 2, passes: 65, passAccuracy: 91, keyPasses: 5, duelsWon: 6, duelsTotal: 10 }
    },
    {
      id: 1003, name: 'Mock Winger', number: 7, position: 'LW', rating: 7.8, team: 'home',
      stats: { minutes: 78, goals: 0, assists: 1, shots: 2, shotsOnTarget: 1, passes: 42, passAccuracy: 82, keyPasses: 4, duelsWon: 7, duelsTotal: 14 }
    },
    {
      id: 1004, name: 'Mock Defender', number: 4, position: 'CB', rating: 7.5, team: 'home',
      stats: { minutes: 90, goals: 0, assists: 0, shots: 1, shotsOnTarget: 0, passes: 58, passAccuracy: 88, tackles: 4, interceptions: 3, duelsWon: 9, duelsTotal: 11 }
    },
    {
      id: 2001, name: 'Away Forward', number: 11, position: 'ST', rating: 7.2, team: 'away',
      stats: { minutes: 90, goals: 1, assists: 0, shots: 4, shotsOnTarget: 2, passes: 22, passAccuracy: 78, keyPasses: 1, duelsWon: 5, duelsTotal: 12 }
    },
    {
      id: 2002, name: 'Away Midfielder', number: 8, position: 'CM', rating: 6.8, team: 'away',
      stats: { minutes: 90, goals: 0, assists: 1, shots: 1, shotsOnTarget: 0, passes: 48, passAccuracy: 83, keyPasses: 2, duelsWon: 4, duelsTotal: 9 }
    },
  ];

  // Kullanıcı puanlarını hesapla (mock)
  const calculateUserPoints = (prediction: any, match: any): UserPointsBreakdown => {
    // Gerçek hesaplama için ScoringEngine kullanılacak
    // Şimdilik mock değerler
    const totalPoints = Math.floor(Math.random() * 80) + 40;
    const maxPossible = 180;
    
    return {
      hasPrediction: true,
      totalPoints,
      maxPossiblePoints: maxPossible,
      breakdown: {
        scorePrediction: {
          points: prediction.score === `${homeScore}-${awayScore}` ? 30 : 0,
          correct: prediction.score === `${homeScore}-${awayScore}`,
          predicted: prediction.score || '-',
          actual: `${homeScore}-${awayScore}`,
        },
        goalsPrediction: {
          points: 15,
          correct: true,
          predicted: prediction.totalGoals || '-',
          actual: `${homeScore + awayScore} gol`,
        },
        firstGoalPrediction: {
          points: 10,
          correct: true,
          predicted: prediction.firstGoal || 'Ev Sahibi',
          actual: 'Ev Sahibi',
        },
        halftimePrediction: {
          points: 0,
          correct: false,
          predicted: prediction.halftime || '-',
          actual: '1-0',
        },
        playerPredictions: {
          goalScorers: { points: 20, correct: 2, total: 3 },
          assists: { points: 10, correct: 1, total: 2 },
          cards: { points: 5, correct: 1, total: 2 },
          mvp: { points: 15, correct: true, predicted: 'Mock Striker', actual: 'Mock Striker' },
        },
        bonusPoints: 10,
        timingBonus: 5,
      },
    };
  };

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
    { id: 'match', label: 'Maç', icon: 'football-outline' },
    { id: 'players', label: 'Oyuncular', icon: 'people-outline' },
    { id: 'points', label: 'Puanlarım', icon: 'trophy-outline' },
  ];

  // ==================== RENDER FUNCTIONS ====================

  // Maç istatistikleri tab'ı
  const renderMatchStatsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Skor Kartı */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreTeamName} numberOfLines={1}>{homeTeam?.name || 'Ev Sahibi'}</Text>
          <Text style={styles.scoreValue}>{homeScore}</Text>
        </View>
        <View style={styles.scoreDivider}>
          <Text style={styles.scoreVs}>-</Text>
          <Text style={styles.scoreStatus}>Maç Sonu</Text>
        </View>
        <View style={styles.scoreTeam}>
          <Text style={styles.scoreTeamName} numberOfLines={1}>{awayTeam?.name || 'Deplasman'}</Text>
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

          {/* Genişletilmiş İstatistikler */}
          {isExpanded && (
            <View style={styles.playerExpandedStats}>
              <View style={styles.expandedStatsGrid}>
                {player.stats.shots !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.shots}</Text>
                    <Text style={styles.expandedStatLabel}>Şut</Text>
                  </View>
                )}
                {player.stats.shotsOnTarget !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.shotsOnTarget}</Text>
                    <Text style={styles.expandedStatLabel}>İsabetli</Text>
                  </View>
                )}
                {player.stats.passes !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.passes}</Text>
                    <Text style={styles.expandedStatLabel}>Pas</Text>
                  </View>
                )}
                {player.stats.passAccuracy !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.passAccuracy}%</Text>
                    <Text style={styles.expandedStatLabel}>Pas %</Text>
                  </View>
                )}
                {player.stats.keyPasses !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.keyPasses}</Text>
                    <Text style={styles.expandedStatLabel}>Kilit Pas</Text>
                  </View>
                )}
                {player.stats.duelsWon !== undefined && player.stats.duelsTotal !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.duelsWon}/{player.stats.duelsTotal}</Text>
                    <Text style={styles.expandedStatLabel}>İkili Mücadele</Text>
                  </View>
                )}
                {player.stats.tackles !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.tackles}</Text>
                    <Text style={styles.expandedStatLabel}>Müdahale</Text>
                  </View>
                )}
                {player.stats.interceptions !== undefined && (
                  <View style={styles.expandedStatItem}>
                    <Text style={styles.expandedStatValue}>{player.stats.interceptions}</Text>
                    <Text style={styles.expandedStatLabel}>Top Kapma</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Ev Sahibi Oyuncular */}
        <View style={styles.teamPlayersSection}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamColorBar, { backgroundColor: '#22D3EE' }]} />
            <Text style={styles.teamTitle}>{homeTeam?.name || 'Ev Sahibi'}</Text>
          </View>
          {homePlayers.map(renderPlayerCard)}
        </View>

        {/* Deplasman Oyuncuları */}
        <View style={styles.teamPlayersSection}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamColorBar, { backgroundColor: '#FB923C' }]} />
            <Text style={styles.teamTitle}>{awayTeam?.name || 'Deplasman'}</Text>
          </View>
          {awayPlayers.map(renderPlayerCard)}
        </View>
      </ScrollView>
    );
  };

  // Kullanıcı puanları tab'ı
  const renderPointsTab = () => {
    if (!userPoints?.hasPrediction) {
      return (
        <View style={styles.noPointsContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#64748B" />
          <Text style={styles.noPointsTitle}>Tahmin Yapılmadı</Text>
          <Text style={styles.noPointsSubtitle}>
            Bu maç için tahmin yapmadınız. Gelecek maçlarda tahmin yaparak puan kazanabilirsiniz!
          </Text>
        </View>
      );
    }

    const { breakdown, totalPoints, maxPossiblePoints } = userPoints;
    const successRate = Math.round((totalPoints / maxPossiblePoints) * 100);
    const successColor = successRate >= 70 ? '#10B981' : successRate >= 50 ? '#F59E0B' : '#EF4444';

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Toplam Puan Kartı */}
        <LinearGradient
          colors={['#0F2A24', '#1A3D35']}
          style={styles.totalPointsCard}
        >
          <View style={styles.totalPointsHeader}>
            <Ionicons name="trophy" size={32} color="#EAB308" />
            <Text style={styles.totalPointsLabel}>Toplam Puan</Text>
          </View>
          <View style={styles.totalPointsRow}>
            <Text style={styles.totalPointsValue}>{totalPoints}</Text>
            <Text style={styles.totalPointsMax}>/ {maxPossiblePoints}</Text>
          </View>
          <View style={styles.successRateContainer}>
            <View style={styles.successRateBar}>
              <View style={[styles.successRateFill, { width: `${successRate}%`, backgroundColor: successColor }]} />
            </View>
            <Text style={[styles.successRateText, { color: successColor }]}>%{successRate} Başarı</Text>
          </View>
        </LinearGradient>

        {/* Maç Tahminleri */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsSectionTitle}>Maç Tahminleri</Text>
          
          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <View style={[styles.pointIcon, breakdown.scorePrediction.correct ? styles.pointIconCorrect : styles.pointIconWrong]}>
                <Ionicons name={breakdown.scorePrediction.correct ? 'checkmark' : 'close'} size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.pointItemTitle}>Skor Tahmini</Text>
                <Text style={styles.pointItemDetail}>
                  Tahmin: {breakdown.scorePrediction.predicted} | Sonuç: {breakdown.scorePrediction.actual}
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.scorePrediction.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.scorePrediction.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <View style={[styles.pointIcon, breakdown.goalsPrediction.correct ? styles.pointIconCorrect : styles.pointIconWrong]}>
                <Ionicons name={breakdown.goalsPrediction.correct ? 'checkmark' : 'close'} size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.pointItemTitle}>Toplam Gol</Text>
                <Text style={styles.pointItemDetail}>
                  Tahmin: {breakdown.goalsPrediction.predicted} | Sonuç: {breakdown.goalsPrediction.actual}
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.goalsPrediction.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.goalsPrediction.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <View style={[styles.pointIcon, breakdown.firstGoalPrediction.correct ? styles.pointIconCorrect : styles.pointIconWrong]}>
                <Ionicons name={breakdown.firstGoalPrediction.correct ? 'checkmark' : 'close'} size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.pointItemTitle}>İlk Gol</Text>
                <Text style={styles.pointItemDetail}>
                  Tahmin: {breakdown.firstGoalPrediction.predicted} | Sonuç: {breakdown.firstGoalPrediction.actual}
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.firstGoalPrediction.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.firstGoalPrediction.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <View style={[styles.pointIcon, breakdown.halftimePrediction.correct ? styles.pointIconCorrect : styles.pointIconWrong]}>
                <Ionicons name={breakdown.halftimePrediction.correct ? 'checkmark' : 'close'} size={14} color="#FFF" />
              </View>
              <View>
                <Text style={styles.pointItemTitle}>İlk Yarı Skoru</Text>
                <Text style={styles.pointItemDetail}>
                  Tahmin: {breakdown.halftimePrediction.predicted} | Sonuç: {breakdown.halftimePrediction.actual}
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.halftimePrediction.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.halftimePrediction.points}
            </Text>
          </View>
        </View>

        {/* Oyuncu Tahminleri */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsSectionTitle}>Oyuncu Tahminleri</Text>
          
          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <Ionicons name="football" size={18} color="#10B981" />
              <View>
                <Text style={styles.pointItemTitle}>Gol Atacaklar</Text>
                <Text style={styles.pointItemDetail}>
                  {breakdown.playerPredictions.goalScorers.correct}/{breakdown.playerPredictions.goalScorers.total} doğru
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.playerPredictions.goalScorers.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.playerPredictions.goalScorers.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <Ionicons name="git-branch" size={18} color="#3B82F6" />
              <View>
                <Text style={styles.pointItemTitle}>Asist Yapacaklar</Text>
                <Text style={styles.pointItemDetail}>
                  {breakdown.playerPredictions.assists.correct}/{breakdown.playerPredictions.assists.total} doğru
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.playerPredictions.assists.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.playerPredictions.assists.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <View style={[styles.cardIcon, { backgroundColor: '#FBBF24', marginRight: 8 }]} />
              <View>
                <Text style={styles.pointItemTitle}>Kart Görecekler</Text>
                <Text style={styles.pointItemDetail}>
                  {breakdown.playerPredictions.cards.correct}/{breakdown.playerPredictions.cards.total} doğru
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.playerPredictions.cards.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.playerPredictions.cards.points}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <Ionicons name="star" size={18} color="#EAB308" />
              <View>
                <Text style={styles.pointItemTitle}>MVP Tahmini</Text>
                <Text style={styles.pointItemDetail}>
                  Tahmin: {breakdown.playerPredictions.mvp.predicted}
                </Text>
              </View>
            </View>
            <Text style={[styles.pointItemValue, breakdown.playerPredictions.mvp.points > 0 && styles.pointItemValuePositive]}>
              +{breakdown.playerPredictions.mvp.points}
            </Text>
          </View>
        </View>

        {/* Bonus Puanlar */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsSectionTitle}>Bonus Puanlar</Text>
          
          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <Ionicons name="gift" size={18} color="#8B5CF6" />
              <Text style={styles.pointItemTitle}>Erken Tahmin Bonusu</Text>
            </View>
            <Text style={[styles.pointItemValue, styles.pointItemValuePositive]}>
              +{breakdown.timingBonus}
            </Text>
          </View>

          <View style={styles.pointItem}>
            <View style={styles.pointItemLeft}>
              <Ionicons name="sparkles" size={18} color="#EC4899" />
              <Text style={styles.pointItemTitle}>Ek Bonuslar</Text>
            </View>
            <Text style={[styles.pointItemValue, styles.pointItemValuePositive]}>
              +{breakdown.bonusPoints}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1FA2A6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
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

      {/* Tab Content */}
      {activeTab === 'match' && renderMatchStatsTab()}
      {activeTab === 'players' && renderPlayersTab()}
      {activeTab === 'points' && renderPointsTab()}
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
