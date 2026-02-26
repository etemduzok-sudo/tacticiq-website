// TacticIQ - Puanlama Sekmesi
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  LEVEL_THRESHOLDS,
  ANALYSIS_FOCUS_MULTIPLIERS,
  BASE_SCORES,
  STREAK_BONUSES,
  MatchScoreDetail,
  UserScoringProfile,
  AnalysisFocusType,
} from '../types/scoring.types';
import { calculateLevel, getShortTeamName } from '../services/scoringService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EMPTY_USER_PROFILE: UserScoringProfile = {
  userId: '',
  totalPoints: 0,
  level: 1,
  levelTitle: 'Çaylak',
  levelProgress: 0,
  rankTurkey: 0,
  rankWorld: 0,
  totalUsersTurkey: 0,
  totalUsersWorld: 0,
  successRates: {
    score: 0,
    squad: 0,
    player: 0,
  },
  currentStreak: 0,
  bestStreak: 0,
  recentMatches: [],
};

// Gerçek veri gelene kadar boş - backend'den çekilecek

export default function ScoringScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  
  const [userProfile, setUserProfile] = useState<UserScoringProfile>(EMPTY_USER_PROFILE);
  const [recentMatches, setRecentMatches] = useState<MatchScoreDetail[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(0);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [leagueFilter, setLeagueFilter] = useState<'all' | string>('all');
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  
  const matchScrollRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: userProfile.levelProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [userProfile.levelProgress]);
  
  const levelInfo = calculateLevel(userProfile.totalPoints);
  
  const handleMatchSelect = (index: number) => {
    setSelectedMatchIndex(index);
    setExpandedMatch(index);
  };
  
  const renderMatchCard = ({ item, index }: { item: MatchScoreDetail; index: number }) => {
    const isSelected = index === selectedMatchIndex;
    const focusConfig = ANALYSIS_FOCUS_MULTIPLIERS[item.analysisFocus as AnalysisFocusType];
    const shortHome = getShortTeamName(item.homeTeam);
    const shortAway = getShortTeamName(item.awayTeam);
    
    return (
      <TouchableOpacity
        style={[
          styles.matchCard,
          isSelected && styles.matchCardSelected,
          { backgroundColor: isSelected ? 'rgba(31, 162, 166, 0.2)' : 'rgba(255, 255, 255, 0.05)' },
        ]}
        onPress={() => handleMatchSelect(index)}
        activeOpacity={0.7}
      >
        <Text style={styles.matchCardTeams}>{shortHome}-{shortAway}</Text>
        <Text style={[styles.matchCardScore, { color: item.totalScore >= 30 ? '#10B981' : item.totalScore >= 15 ? '#F59E0B' : '#9CA3AF' }]}>
          +{item.totalScore.toFixed(1)}
        </Text>
        <View style={styles.matchCardFocusBadge}>
          <Text style={styles.matchCardFocusEmoji}>{focusConfig?.emoji || '⚖️'}</Text>
        </View>
        <View style={styles.matchCardSuccessIndicator}>
          {item.baseScores.scoreCorrect > 0 && <Text style={styles.successDot}>✓</Text>}
          {item.baseScores.squadCorrect > 3 && <Text style={styles.successDot}>✓</Text>}
          {item.playerPredictions.some(p => p.isCorrect) && <Text style={styles.successDot}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };
  
  const selectedMatch = recentMatches[selectedMatchIndex];
  const selectedFocusConfig = selectedMatch ? ANALYSIS_FOCUS_MULTIPLIERS[selectedMatch.analysisFocus as AnalysisFocusType] : null;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('scoring.title')}</Text>
          <Ionicons name="stats-chart" size={24} color={colors.primary || '#1FA2A6'} />
        </View>
        
        {/* Profile Summary Card - açık temada açık kart + koyu metin */}
        {theme === 'light' ? (
          <View style={[styles.profileCard, { backgroundColor: colors.card || '#FFFFFF', borderWidth: 1, borderColor: colors.border || 'rgba(15,42,36,0.1)' }]}>
            <View style={styles.profileMainRow}>
              <View style={styles.profilePointsSection}>
                <Text style={[styles.profilePointsValue, { color: colors.text }]}>{userProfile.totalPoints.toFixed(1)}</Text>
                <Text style={[styles.profilePointsLabel, { color: colors.textSecondary }]}>{t('scoring.points')}</Text>
              </View>
              <View style={styles.profileLevelSection}>
                <View style={[styles.levelBadge, { backgroundColor: colors.muted || '#E6E6E6' }]}>
                  <Text style={[styles.levelBadgeText, { color: levelInfo.color }]}>Seviye {levelInfo.level}</Text>
                </View>
                <Text style={[styles.levelTitle, { color: levelInfo.color }]}>{levelInfo.title}</Text>
                <View style={[styles.progressBarContainer, { backgroundColor: colors.muted || '#E6E6E6' }]}>
                  <Animated.View
                    style={[styles.progressBarFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                      backgroundColor: levelInfo.color,
                    }]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>{userProfile.levelProgress}%</Text>
              </View>
            </View>
            <View style={[styles.rankingsRow, { borderTopColor: colors.border || 'rgba(15,42,36,0.1)' }]}>
              <View style={styles.rankingItem}>
                <Text style={styles.rankingFlag}>🇹🇷</Text>
                <Text style={[styles.rankingValue, { color: colors.text }]}>#{userProfile.rankTurkey.toLocaleString()}</Text>
                <Text style={[styles.rankingTotal, { color: colors.textSecondary }]}>/ {(userProfile.totalUsersTurkey / 1000).toFixed(1)}K</Text>
              </View>
              <View style={[styles.rankingDivider, { backgroundColor: colors.border || 'rgba(15,42,36,0.2)' }]} />
              <View style={styles.rankingItem}>
                <Text style={styles.rankingFlag}>🌍</Text>
                <Text style={[styles.rankingValue, { color: colors.text }]}>#{userProfile.rankWorld.toLocaleString()}</Text>
                <Text style={[styles.rankingTotal, { color: colors.textSecondary }]}>/ {(userProfile.totalUsersWorld / 1000).toFixed(0)}K</Text>
              </View>
            </View>
          </View>
        ) : (
          <LinearGradient colors={['#1A2E2A', '#0F2420']} style={styles.profileCard}>
            <View style={styles.profileMainRow}>
              <View style={styles.profilePointsSection}>
                <Text style={styles.profilePointsValue}>{userProfile.totalPoints.toFixed(1)}</Text>
                <Text style={styles.profilePointsLabel}>{t('scoring.points')}</Text>
              </View>
              <View style={styles.profileLevelSection}>
                <View style={styles.levelBadge}>
                  <Text style={[styles.levelBadgeText, { color: levelInfo.color }]}>Seviye {levelInfo.level}</Text>
                </View>
                <Text style={[styles.levelTitle, { color: levelInfo.color }]}>{levelInfo.title}</Text>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[styles.progressBarFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                      backgroundColor: levelInfo.color,
                    }]}
                  />
                </View>
                <Text style={styles.progressText}>{userProfile.levelProgress}%</Text>
              </View>
            </View>
            <View style={styles.rankingsRow}>
              <View style={styles.rankingItem}>
                <Text style={styles.rankingFlag}>🇹🇷</Text>
                <Text style={styles.rankingValue}>#{userProfile.rankTurkey.toLocaleString()}</Text>
                <Text style={styles.rankingTotal}>/ {(userProfile.totalUsersTurkey / 1000).toFixed(1)}K</Text>
              </View>
              <View style={styles.rankingDivider} />
              <View style={styles.rankingItem}>
                <Text style={styles.rankingFlag}>🌍</Text>
                <Text style={styles.rankingValue}>#{userProfile.rankWorld.toLocaleString()}</Text>
                <Text style={styles.rankingTotal}>/ {(userProfile.totalUsersWorld / 1000).toFixed(0)}K</Text>
              </View>
            </View>
          </LinearGradient>
        )}
        
        {/* Nasıl puan kazanılır? - Puanlama mantığı */}
        <View style={[styles.howItWorksCard, { backgroundColor: colors.card || 'rgba(255,255,255,0.03)' }]}>
          <TouchableOpacity
            style={styles.howItWorksHeader}
            onPress={() => setHowItWorksExpanded(!howItWorksExpanded)}
            activeOpacity={0.7}
          >
            <Ionicons name="help-buoy" size={20} color={colors.primary || '#1FA2A6'} />
            <Text style={[styles.howItWorksTitle, { color: colors.text }]}>{t('scoring.howItWorks')}</Text>
            <Ionicons name={howItWorksExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary || '#9CA3AF'} />
          </TouchableOpacity>
          {howItWorksExpanded && (
            <View style={styles.howItWorksBody}>
              <Text style={[styles.howItWorksDesc, { color: colors.textSecondary }]}>{t('scoring.howItWorksDesc')}</Text>
              <View style={styles.howItWorksGrid}>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.scoreExact')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.SCORE_EXACT}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.scoreGoalDiff')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.SCORE_GOAL_DIFF}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.scoreWinner')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.SCORE_WINNER}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.goalsExact')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.TOTAL_GOALS_EXACT}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.goalsClose')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.TOTAL_GOALS_CLOSE}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.squadPerPlayer')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.SQUAD_PER_PLAYER}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.baseScores.formationExact')}</Text>
                  <Text style={styles.howItWorksValue}>+{BASE_SCORES.ATTACK_FORMATION_EXACT}/{BASE_SCORES.DEFENSE_FORMATION_EXACT}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.focusMultipliers')}</Text>
                  <Text style={styles.howItWorksValue}>×1.2–2.0</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.timeBonusDesc')}</Text>
                </View>
                <View style={styles.howItWorksRow}>
                  <Text style={[styles.howItWorksLabel, { color: colors.text }]}>{t('scoring.streakBonusDesc')}</Text>
                  <Text style={styles.howItWorksValue}>(+{STREAK_BONUSES.STREAK_3}/+{STREAK_BONUSES.STREAK_5}/+{STREAK_BONUSES.STREAK_7}/+{STREAK_BONUSES.STREAK_10})</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Success Rates */}
        <View style={[styles.successRatesContainer, { backgroundColor: colors.card || 'rgba(255,255,255,0.03)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('scoring.successRates')}</Text>
          <View style={styles.successRatesRow}>
            <View style={styles.successRateItem}>
              <Text style={[styles.successRateLabel, { color: colors.textSecondary }]}>{t('scoring.score')}</Text>
              <Text style={[styles.successRateValue, { color: userProfile.successRates.score >= 40 ? '#10B981' : '#F59E0B' }]}>
                %{userProfile.successRates.score}
              </Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${userProfile.successRates.score}%`, backgroundColor: '#10B981' }]} />
              </View>
            </View>
            <View style={styles.successRateItem}>
              <Text style={[styles.successRateLabel, { color: colors.textSecondary }]}>{t('scoring.squad')}</Text>
              <Text style={[styles.successRateValue, { color: userProfile.successRates.squad >= 60 ? '#10B981' : '#F59E0B' }]}>
                %{userProfile.successRates.squad}
              </Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${userProfile.successRates.squad}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
            <View style={styles.successRateItem}>
              <Text style={[styles.successRateLabel, { color: colors.textSecondary }]}>{t('scoring.player')}</Text>
              <Text style={[styles.successRateValue, { color: userProfile.successRates.player >= 40 ? '#10B981' : '#F59E0B' }]}>
                %{userProfile.successRates.player}
              </Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${userProfile.successRates.player}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
            </View>
          </View>
          
          {/* Streak */}
          {userProfile.currentStreak >= 3 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakText}>{t('scoring.activeStreak')}: {userProfile.currentStreak} {t('scoring.matches')}</Text>
            </View>
          )}
        </View>
        
        {/* Match History */}
        <View style={styles.matchHistoryContainer}>
          <View style={styles.matchHistoryHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('scoring.matchHistory')}</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]}
                onPress={() => setTimeFilter('week')}
              >
                <Text style={[styles.filterButtonText, timeFilter === 'week' && styles.filterButtonTextActive]}>{t('scoring.thisWeek')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setTimeFilter('all')}
              >
                <Text style={[styles.filterButtonText, timeFilter === 'all' && styles.filterButtonTextActive]}>{t('scoring.all')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Horizontal Match Scroll */}
          <FlatList
            ref={matchScrollRef}
            data={recentMatches}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.matchId.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchScrollContent}
          />
          
          {/* Selected Match Detail */}
          {selectedMatch && (
            <View style={[styles.matchDetailContainer, { backgroundColor: colors.card || 'rgba(255,255,255,0.03)' }]}>
              <View style={styles.matchDetailHeader}>
                <Text style={styles.matchDetailTitle}>
                  {selectedMatch.homeTeam} {selectedMatch.baseScores.scoreCorrect === 10 ? '✓' : ''} vs {selectedMatch.awayTeam}
                </Text>
                <View style={styles.matchDetailFocusBadge}>
                  <Text style={styles.matchDetailFocusEmoji}>{selectedFocusConfig?.emoji}</Text>
                  <Text style={styles.matchDetailFocusText}>{selectedFocusConfig?.label}</Text>
                </View>
              </View>
              
              {/* Base Scores */}
              <View style={styles.scoreBreakdownSection}>
                <Text style={[styles.scoreBreakdownTitle, { color: colors.textSecondary }]}>{t('scoring.basePredictions')}</Text>
                <View style={styles.scoreBreakdownRow}>
                  <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>🎯 {t('scoring.exactScore')}</Text>
                  <Text style={[styles.scoreBreakdownValue, { color: selectedMatch.baseScores.scoreCorrect > 0 ? '#10B981' : '#9CA3AF' }]}>
                    {selectedMatch.baseScores.scoreCorrect > 0 ? `+${selectedMatch.baseScores.scoreCorrect}` : '0'}
                  </Text>
                </View>
                <View style={styles.scoreBreakdownRow}>
                  <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>⚽ {t('scoring.totalGoals')}</Text>
                  <Text style={[styles.scoreBreakdownValue, { color: selectedMatch.baseScores.totalGoalsCorrect > 0 ? '#10B981' : '#9CA3AF' }]}>
                    {selectedMatch.baseScores.totalGoalsCorrect > 0 ? `+${selectedMatch.baseScores.totalGoalsCorrect}` : '0'}
                  </Text>
                </View>
                <View style={styles.scoreBreakdownRow}>
                  <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>👥 {t('scoring.squad')}</Text>
                  <Text style={[styles.scoreBreakdownValue, { color: '#3B82F6' }]}>
                    +{selectedMatch.baseScores.squadCorrect}
                  </Text>
                </View>
                <View style={styles.scoreBreakdownRow}>
                  <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>📋 {t('scoring.formation')}</Text>
                  <Text style={[styles.scoreBreakdownValue, { color: '#8B5CF6' }]}>
                    +{(selectedMatch.baseScores.attackFormationCorrect + selectedMatch.baseScores.defenseFormationCorrect).toFixed(1)}
                  </Text>
                </View>
              </View>
              
              {/* Player Predictions */}
              {selectedMatch.playerPredictions.length > 0 && (
                <View style={styles.scoreBreakdownSection}>
                  <Text style={[styles.scoreBreakdownTitle, { color: colors.textSecondary }]}>{t('scoring.playerPredictions')}</Text>
                  {selectedMatch.playerPredictions.map((pred, idx) => (
                    <View key={idx} style={styles.scoreBreakdownRow}>
                      <Text style={styles.scoreBreakdownLabel}>
                        {pred.playerName} {pred.predictionType === 'goal' ? '⚽' : pred.predictionType === 'assist' ? '🎯' : '🟨'}
                      </Text>
                      <Text style={[styles.scoreBreakdownValue, { color: pred.isCorrect ? '#10B981' : '#EF4444' }]}>
                        {pred.isCorrect ? `+${pred.points}` : '0'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Bonuses */}
              <View style={styles.scoreBreakdownSection}>
                <Text style={[styles.scoreBreakdownTitle, { color: colors.textSecondary }]}>{t('scoring.bonuses')}</Text>
                {selectedMatch.multipliers.timeBonusMultiplier !== 1 && (
                  <View style={styles.scoreBreakdownRow}>
                    <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>⏰ {t('scoring.timeBonus')}</Text>
                    <Text style={[styles.scoreBreakdownValue, { color: selectedMatch.multipliers.timeBonusMultiplier > 1 ? '#10B981' : '#EF4444' }]}>
                      ×{selectedMatch.multipliers.timeBonusMultiplier.toFixed(2)}
                    </Text>
                  </View>
                )}
                {selectedMatch.multipliers.streakBonus > 0 && (
                  <View style={styles.scoreBreakdownRow}>
                    <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>🔥 {t('scoring.streakBonus')}</Text>
                    <Text style={[styles.scoreBreakdownValue, { color: '#F59E0B' }]}>
                      +{selectedMatch.multipliers.streakBonus}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Total */}
              <View style={styles.totalScoreContainer}>
                <Text style={styles.totalScoreLabel}>{t('scoring.total')}</Text>
                <Text style={styles.totalScoreValue}>{selectedMatch.totalScore.toFixed(1)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: SPACING.md,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  profileMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profilePointsSection: {
    alignItems: 'center',
  },
  profilePointsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profilePointsLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  profileLevelSection: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: SPACING.lg,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  progressBarContainer: {
    width: 120,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  rankingsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingFlag: {
    fontSize: 16,
  },
  rankingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rankingTotal: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rankingDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.lg,
  },
  howItWorksCard: {
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    padding: 0,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 10,
  },
  howItWorksTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  howItWorksBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  howItWorksDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  howItWorksGrid: {
    gap: 6,
  },
  howItWorksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  howItWorksLabel: {
    fontSize: 13,
    flex: 1,
  },
  howItWorksValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1FA2A6',
    marginLeft: 8,
  },
  successRatesContainer: {
    marginHorizontal: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  successRatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successRateItem: {
    flex: 1,
    alignItems: 'center',
  },
  successRateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  successRateValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  miniProgressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: SPACING.md,
    gap: 6,
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  matchHistoryContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  matchHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  filterButtonTextActive: {
    color: '#1FA2A6',
    fontWeight: '600',
  },
  matchScrollContent: {
    paddingVertical: SPACING.sm,
    gap: 10,
  },
  matchCard: {
    width: 90,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchCardSelected: {
    borderColor: '#1FA2A6',
    borderWidth: 2,
  },
  matchCardTeams: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  matchCardScore: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  matchCardFocusBadge: {
    marginTop: 4,
  },
  matchCardFocusEmoji: {
    fontSize: 12,
  },
  matchCardSuccessIndicator: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  successDot: {
    fontSize: 8,
    color: '#10B981',
  },
  matchDetailContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  matchDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchDetailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  matchDetailFocusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  matchDetailFocusEmoji: {
    fontSize: 12,
  },
  matchDetailFocusText: {
    fontSize: 11,
    color: '#1FA2A6',
    fontWeight: '500',
  },
  scoreBreakdownSection: {
    marginBottom: SPACING.md,
  },
  scoreBreakdownTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  scoreBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scoreBreakdownLabel: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  scoreBreakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.3)',
  },
  totalScoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  totalScoreValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1FA2A6',
  },
});
