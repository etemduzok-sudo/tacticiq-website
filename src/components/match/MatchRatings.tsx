// MatchRatingsScreen.tsx - React Native FULL VERSION
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';
import {
  generateMatchAnalysisReport,
  getClusterName,
  getClusterIcon,
} from '../../services/predictionScoringService';
import { TrainingType, FocusPrediction, AnalysisCluster } from '../../types/prediction.types';
import ScoringEngine from '../../logic/ScoringEngine';
import { STORAGE_KEYS, TEXT } from '../../config/constants';
import { handleError, ErrorType } from '../../utils/GlobalErrorHandler';
import { checkAndAwardBadges, UserStats, BadgeAwardResult } from '../../services/badgeService';
import { getBadgeColor, getBadgeTierName } from '../../types/badges.types';

const { width, height } = Dimensions.get('window');

interface MatchRatingsScreenProps {
  matchData: any;
}

// Coach Rating Categories
const coachCategories = [
  { 
    id: 1,
    emoji: '⚽',
    title: 'Sonuç & Beklenti Yönetimi', 
    weight: 20,
    description: 'Maç sonucu, favori-underdog farkı, skor yönetimi',
    color: '#1FA2A6'
  },
  { 
    id: 2,
    emoji: '🧩',
    title: 'İlk 11 & Diziliş Kararı', 
    weight: 18,
    description: 'Pozisyon, oyuncu-rol uyumu, rakibe göre diziliş',
    color: '#3B82F6'
  },
  { 
    id: 3,
    emoji: '🔁',
    title: 'Oyuncu Değişiklikleri', 
    weight: 17,
    description: 'Zamanlama, giren oyuncunun katkısı, skora etki',
    color: '#A855F7'
  },
  { 
    id: 4,
    emoji: '⏱️',
    title: 'Maç İçi Reaksiyon', 
    weight: 15,
    description: 'Gole tepki, tempo kontrolü, kritik anlar',
    color: '#F97316'
  },
  { 
    id: 5,
    emoji: '🟨',
    title: 'Disiplin & Takım Kontrolü', 
    weight: 10,
    description: 'Kart sayısı, gereksiz kartlar, oyun kontrolü',
    color: '#EAB308'
  },
  { 
    id: 6,
    emoji: '🧠',
    title: 'Maç Sonu Yönetimi', 
    weight: 10,
    description: 'Skoru koruma, son dakika hamleleri, risk dengesi',
    color: '#6366F1'
  },
  { 
    id: 7,
    emoji: '🎤',
    title: 'Basınla İlişkiler & Sempati', 
    weight: 10,
    description: 'Basın toplantısı, röportaj tavrı, kamuoyu yönetimi',
    color: '#14B8A6'
  },
];

export const MatchRatings: React.FC<MatchRatingsScreenProps> = ({
  matchData,
}) => {
  // Coach rating state
  const [coachRatings, setCoachRatings] = useState<{[key: number]: number}>({
    1: 7.5,
    2: 8.0,
    3: 6.5,
    4: 7.0,
    5: 8.5,
    6: 7.5,
    7: 8.0,
  });

  // 🌟 PREDICTION SCORING STATE
  const [predictionReport, setPredictionReport] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // 🏆 BADGE AWARD STATE
  const [newBadges, setNewBadges] = useState<BadgeAwardResult[]>([]);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  // Load predictions and calculate scores
  React.useEffect(() => {
    loadPredictionsAndCalculateScores();
  }, []);

  const loadPredictionsAndCalculateScores = async () => {
    try {
      const predictionDataStr = await AsyncStorage.getItem(
        `fan-manager-predictions-${matchData.id}`
      );
      
      if (!predictionDataStr) return;
      
      const predictionData = JSON.parse(predictionDataStr);
      const { matchPredictions, focusedPredictions } = predictionData;
      
      // Mock actual results (in production, this would come from API)
      const actualResults = {
        firstHalfHomeScore: 1,
        firstHalfAwayScore: 0,
        totalGoals: '2-3 gol',
        yellowCards: '3-4 kart',
        // ... other actual results
      };
      
      // Generate analysis report
      const report = generateMatchAnalysisReport(
        matchPredictions,
        actualResults,
        null, // Training focus removed
        focusedPredictions as FocusPrediction[]
      );
      
      setPredictionReport(report);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const handleSaveRatings = async () => {
    try {
      // Calculate average rating
      const ratingsArray = Object.values(coachRatings);
      const averageRating = ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length;

      // Save ratings to AsyncStorage
      const ratingsData = {
        matchId: matchData.id,
        coachRatings: coachRatings,
        averageRating: averageRating.toFixed(1),
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `fan-manager-ratings-${matchData.id}`,
        JSON.stringify(ratingsData)
      );
      
      console.log('✅ Ratings saved successfully!', ratingsData);
      
      // 🏆 CHECK AND AWARD BADGES
      await checkAndAwardBadgesForMatch();
      
      Alert.alert(
        'Değerlendirmeler Kaydedildi! ⭐',
        `Teknik direktöre ortalama ${averageRating.toFixed(1)} puan verdiniz.`,
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('Error saving ratings:', error);
      Alert.alert('Hata!', 'Değerlendirmeler kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  // 🏆 CHECK AND AWARD BADGES
  const checkAndAwardBadgesForMatch = async () => {
    try {
      if (!predictionReport) return;

      // Build user stats from prediction report
      const userStats: UserStats = {
        totalPredictions: predictionReport.totalPredictions || 0,
        correctPredictions: predictionReport.correctPredictions || 0,
        accuracy: predictionReport.accuracy || 0,
        currentStreak: 5, // TODO: Get from AsyncStorage
        longestStreak: 10, // TODO: Get from AsyncStorage
        leagueStats: {
          '203': { // Süper Lig (example)
            total: predictionReport.totalPredictions || 0,
            correct: predictionReport.correctPredictions || 0,
            accuracy: predictionReport.accuracy || 0,
          },
        },
        clusterStats: {
          [AnalysisCluster.TEMPO_FLOW]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.accuracy || 0,
          },
          [AnalysisCluster.DISCIPLINE]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.accuracy || 0,
          },
          [AnalysisCluster.PHYSICAL_WEAR]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.accuracy || 0,
          },
          [AnalysisCluster.INDIVIDUAL_PERFORMANCE]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.accuracy || 0,
          },
        },
        perfectMatches: predictionReport.accuracy === 100 ? 1 : 0,
      };

      // Check for new badges
      const awardedBadges = await checkAndAwardBadges(userStats);

      if (awardedBadges.length > 0) {
        console.log('🎉 New badges awarded:', awardedBadges);
        setNewBadges(awardedBadges);
        setCurrentBadgeIndex(0);
        setShowBadgePopup(true);
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // 🏆 SHOW NEXT BADGE
  const showNextBadge = () => {
    if (currentBadgeIndex < newBadges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      setShowBadgePopup(false);
      setNewBadges([]);
      setCurrentBadgeIndex(0);
    }
  };

  // Community average ratings (mock data)
  const communityRatings: {[key: number]: number} = {
    1: 8.2,
    2: 7.3,
    3: 7.8,
    4: 6.9,
    5: 7.5,
    6: 8.1,
    7: 7.7,
  };

  const totalVoters = 1247;

  // Calculate total weighted score
  const calculateTotalScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (coachRatings[category.id] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  const calculateCommunityScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (communityRatings[category.id] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  const handleRatingChange = (categoryId: number, rating: number) => {
    setCoachRatings(prev => ({
      ...prev,
      [categoryId]: rating
    }));
  };

  const userScore = parseFloat(calculateTotalScore());
  const communityScore = parseFloat(calculateCommunityScore());

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card - Total Score */}
        <Animated.View 
          entering={isWeb ? undefined : FadeIn.duration(400)}
          style={styles.headerCard}
        >
          <LinearGradient
            colors={['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0.05)']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Teknik Direktör Değerlendirmesi</Text>
            <Text style={styles.headerSubtitle}>Okan Buruk • Galatasaray</Text>

            {/* Total Score Display */}
            <View style={styles.totalScoreContainer}>
              <View style={styles.scoreColumn}>
                <Text style={styles.scoreLabel}>Sizin Puanınız</Text>
                <View style={styles.scoreCircle}>
                  <Svg width={100} height={100} style={styles.scoreSvg}>
                    <Circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(100, 116, 139, 0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <Circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1FA2A6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(userScore / 10) * 251.2} 251.2`}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="50, 50"
                    />
                  </Svg>
                  <View style={styles.scoreValue}>
                    <Text style={styles.scoreText}>{userScore}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                  </View>
                </View>
              </View>

              <View style={styles.scoreDivider}>
                <View style={styles.scoreDividerLine} />
                <Text style={styles.scoreDividerText}>vs</Text>
                <View style={styles.scoreDividerLine} />
              </View>

              <View style={styles.scoreColumn}>
                <Text style={styles.scoreLabel}>Topluluk Ortalaması</Text>
                <View style={styles.scoreCircle}>
                  <Svg width={100} height={100} style={styles.scoreSvg}>
                    <Circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(100, 116, 139, 0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <Circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F59E0B"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(communityScore / 10) * 251.2} 251.2`}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="50, 50"
                    />
                  </Svg>
                  <View style={styles.scoreValue}>
                    <Text style={styles.scoreTextCommunity}>{communityScore}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.votersText}>
              👥 {totalVoters.toLocaleString()} kullanıcı oy verdi
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* 🌟 PREDICTION ANALYSIS CARD */}
        {predictionReport && (
          <Animated.View entering={isWeb ? undefined : FadeIn.delay(200)} style={styles.analysisCard}>
            <TouchableOpacity
              onPress={() => setShowAnalysis(!showAnalysis)}
              activeOpacity={0.8}
            >
              <View style={styles.analysisHeader}>
                <View style={styles.analysisHeaderLeft}>
                  <Ionicons name="analytics" size={24} color="#F59E0B" />
                  <View>
                    <Text style={styles.analysisTitle}>Tahmin Analizi</Text>
                    <Text style={styles.analysisSubtitle}>
                      Toplam {predictionReport.totalPoints} Puan
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={showAnalysis ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>

            {showAnalysis && (
              <Animated.View entering={FadeIn.duration(300)}>
                {/* Analyst Note */}
                <View style={styles.analystNote}>
                  <Text style={styles.analystNoteTitle}>📊 Maç Sonu Analist Notu</Text>
                  <Text style={styles.analystNoteText}>
                    {predictionReport.analystNote}
                  </Text>
                </View>

                {/* Cluster Scores */}
                <View style={styles.clusterScoresContainer}>
                  <Text style={styles.clusterScoresTitle}>Küme Bazlı Puanlar</Text>
                  {predictionReport.clusterScores.map((cluster: any, index: number) => (
                    <Animated.View
                      key={cluster.cluster}
                      entering={FadeIn.delay(index * 100)}
                      style={styles.clusterScoreCard}
                    >
                      <View style={styles.clusterScoreHeader}>
                        <Text style={styles.clusterIcon}>
                          {getClusterIcon(cluster.cluster)}
                        </Text>
                        <Text style={styles.clusterName}>
                          {getClusterName(cluster.cluster)}
                        </Text>
                      </View>
                      <View style={styles.clusterScoreStats}>
                        <View style={styles.clusterStat}>
                          <Text style={styles.clusterStatLabel}>Puan</Text>
                          <Text style={styles.clusterStatValue}>
                            {cluster.totalPoints}
                          </Text>
                        </View>
                        <View style={styles.clusterStat}>
                          <Text style={styles.clusterStatLabel}>Doğruluk</Text>
                          <Text style={styles.clusterStatValue}>
                            %{cluster.accuracy}
                          </Text>
                        </View>
                        <View style={styles.clusterStat}>
                          <Text style={styles.clusterStatLabel}>Tahmin</Text>
                          <Text style={styles.clusterStatValue}>
                            {cluster.correctPredictions}/{cluster.totalPredictions}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>

                {/* Focused Predictions Stats */}
                {predictionReport.focusedPredictions.total > 0 && (
                  <View style={styles.focusedStatsCard}>
                    <View style={styles.focusedStatsHeader}>
                      <Ionicons name="star" size={20} color="#F59E0B" />
                      <Text style={styles.focusedStatsTitle}>
                        Odaklanılan Tahminler
                      </Text>
                    </View>
                    <View style={styles.focusedStatsRow}>
                      <View style={styles.focusedStat}>
                        <Text style={styles.focusedStatValue}>
                          {predictionReport.focusedPredictions.correct}
                        </Text>
                        <Text style={styles.focusedStatLabel}>Doğru (2x)</Text>
                      </View>
                      <View style={styles.focusedStat}>
                        <Text style={[styles.focusedStatValue, styles.focusedStatValueWrong]}>
                          {predictionReport.focusedPredictions.wrong}
                        </Text>
                        <Text style={styles.focusedStatLabel}>Yanlış (-1.5x)</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 📊 KÜME BAZINDA PUAN DAĞILIMI TABLOSU */}
                {predictionReport && predictionReport.clusterScores.length > 0 && (
                  <Animated.View entering={FadeIn.delay(300)} style={styles.clusterBreakdownCard}>
                    <View style={styles.clusterBreakdownHeader}>
                      <Ionicons name="bar-chart" size={20} color="#1FA2A6" />
                      <Text style={styles.clusterBreakdownTitle}>Küme Bazında Puan Dağılımı</Text>
                    </View>

                    {predictionReport.clusterScores.map((cluster, index) => {
                      const clusterIcon = getClusterIcon(cluster.cluster);
                      const clusterName = getClusterName(cluster.cluster);
                      const accuracyColor = cluster.accuracy >= 70 ? '#22C55E' : cluster.accuracy >= 50 ? '#F59E0B' : '#EF4444';

                      return (
                        <Animated.View 
                          key={cluster.cluster} 
                          entering={FadeIn.delay(320 + index * 50)}
                          style={styles.clusterRow}
                        >
                          <View style={styles.clusterRowLeft}>
                            <Text style={styles.clusterRowIcon}>{clusterIcon}</Text>
                            <View style={styles.clusterRowInfo}>
                              <Text style={styles.clusterRowName}>{clusterName}</Text>
                              <Text style={styles.clusterRowStats}>
                                {cluster.correctPredictions}/{cluster.totalPredictions} doğru
                              </Text>
                            </View>
                          </View>

                          <View style={styles.clusterRowRight}>
                            <View style={styles.clusterRowPoints}>
                              <Text style={styles.clusterRowPointsValue}>+{cluster.totalPoints}</Text>
                              <Text style={styles.clusterRowPointsLabel}>puan</Text>
                            </View>
                            <View style={[styles.clusterRowAccuracy, { backgroundColor: `${accuracyColor}20` }]}>
                              <Text style={[styles.clusterRowAccuracyText, { color: accuracyColor }]}>
                                %{cluster.accuracy}
                              </Text>
                            </View>
                          </View>
                        </Animated.View>
                      );
                    })}

                    {/* Analist Notu */}
                    <View style={styles.analystNoteContainer}>
                      <View style={styles.analystNoteHeader}>
                        <Ionicons name="chatbox-ellipses" size={18} color="#3B82F6" />
                        <Text style={styles.analystNoteHeaderText}>Maç Sonu Analist Notu</Text>
                      </View>
                      <Text style={styles.analystNoteText}>
                        {predictionReport.analystNote}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Rating Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>

          {coachCategories.map((category, index) => {
            const userRating = coachRatings[category.id];
            const communityRating = communityRatings[category.id];
            const difference = userRating - communityRating;

            return (
              <Animated.View
                key={category.id}
                entering={FadeIn.delay(index * 80)}
                style={styles.categoryCard}
              >
                {/* Category Header */}
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View style={styles.categoryTitleContainer}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryWeight}>
                    <Text style={styles.categoryWeightText}>{category.weight}%</Text>
                  </View>
                </View>

                {/* Rating Stars */}
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <TouchableOpacity
                        key={star}
                        style={styles.starButton}
                        onPress={() => handleRatingChange(category.id, star)}
                        activeOpacity={0.7}
                      >
                        <Animated.View
                          entering={ZoomIn.delay(star * 30)}
                          style={[
                            styles.star,
                            star <= userRating && styles.starActive,
                            { backgroundColor: star <= userRating ? category.color : 'rgba(100, 116, 139, 0.2)' }
                          ]}
                        >
                          <Text style={[
                            styles.starText,
                            star <= userRating && styles.starTextActive
                          ]}>
                            {star}
                          </Text>
                        </Animated.View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Score Comparison */}
                <View style={styles.comparisonContainer}>
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Sizin:</Text>
                      <Text style={styles.comparisonValueUser}>{userRating.toFixed(1)}</Text>
                    </View>
                    
                    <View style={styles.comparisonDivider} />
                    
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Topluluk:</Text>
                      <Text style={styles.comparisonValueCommunity}>{communityRating.toFixed(1)}</Text>
                    </View>

                    <View style={styles.comparisonDivider} />

                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Fark:</Text>
                      <Text style={[
                        styles.comparisonValueDiff,
                        difference > 0 ? styles.comparisonPositive : difference < 0 ? styles.comparisonNegative : styles.comparisonNeutral
                      ]}>
                        {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${(userRating / 10) * 100}%`, backgroundColor: category.color }
                        ]}
                      />
                    </View>
                    <View style={[styles.progressBar, styles.progressBarCommunity]}>
                      <View 
                        style={[
                          styles.progressFillCommunity,
                          { width: `${(communityRating / 10) * 100}%` }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.8}
          onPress={handleSaveRatings}
        >
          <LinearGradient
            colors={['#1FA2A6', '#047857']}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>Değerlendirmeyi Kaydet</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteEmoji}>💡</Text>
          <Text style={styles.infoNoteText}>
            Puanlamalarınız kaydedildikten sonra değiştirilemez. Teknik direktörün performansını adil bir şekilde değerlendirin.
          </Text>
        </View>
      </ScrollView>

      {/* 🎉 BADGE AWARD POPUP */}
      <Modal
        visible={showBadgePopup && newBadges.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBadgePopup(false)}
      >
        <Pressable
          style={styles.badgePopupOverlay}
          onPress={() => setShowBadgePopup(false)}
        >
          <Animated.View entering={ZoomIn.duration(400)} style={styles.badgePopupContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {newBadges[currentBadgeIndex] && (
                <>
                  {/* Confetti Effect */}
                  <View style={styles.confettiContainer}>
                    <Text style={styles.confetti}>🎉</Text>
                    <Text style={styles.confetti}>✨</Text>
                    <Text style={styles.confetti}>🎊</Text>
                    <Text style={styles.confetti}>⭐</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.badgePopupTitle}>YENİ ROZET KAZANDIN!</Text>

                  {/* Badge Icon */}
                  <Animated.View
                    entering={ZoomIn.delay(200).springify()}
                    style={[
                      styles.badgePopupIconContainer,
                      {
                        backgroundColor: `${getBadgeColor(newBadges[currentBadgeIndex].badge.tier)}20`,
                        borderColor: getBadgeColor(newBadges[currentBadgeIndex].badge.tier),
                      },
                    ]}
                  >
                    <Text style={styles.badgePopupIcon}>
                      {newBadges[currentBadgeIndex].badge.icon}
                    </Text>
                  </Animated.View>

                  {/* Badge Name */}
                  <Text style={styles.badgePopupName}>
                    {newBadges[currentBadgeIndex].badge.name}
                  </Text>

                  {/* Badge Tier */}
                  <View
                    style={[
                      styles.badgePopupTier,
                      {
                        backgroundColor: `${getBadgeColor(newBadges[currentBadgeIndex].badge.tier)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgePopupTierText,
                        { color: getBadgeColor(newBadges[currentBadgeIndex].badge.tier) },
                      ]}
                    >
                      {getBadgeTierName(newBadges[currentBadgeIndex].badge.tier)}
                    </Text>
                  </View>

                  {/* Badge Description */}
                  <Text style={styles.badgePopupDescription}>
                    {newBadges[currentBadgeIndex].badge.description}
                  </Text>

                  {/* Badge Counter */}
                  {newBadges.length > 1 && (
                    <Text style={styles.badgePopupCounter}>
                      {currentBadgeIndex + 1} / {newBadges.length}
                    </Text>
                  )}

                  {/* Buttons */}
                  <View style={styles.badgePopupButtons}>
                    <TouchableOpacity
                      style={styles.badgePopupButtonSecondary}
                      onPress={() => setShowBadgePopup(false)}
                    >
                      <Text style={styles.badgePopupButtonSecondaryText}>Kapat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.badgePopupButtonPrimary}
                      onPress={showNextBadge}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        style={styles.badgePopupButtonGradient}
                      >
                        <Text style={styles.badgePopupButtonPrimaryText}>
                          {currentBadgeIndex < newBadges.length - 1 ? 'Sonraki' : 'Harika!'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Grid pattern görünsün - MatchDetail'den geliyor
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Header Card
  headerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  headerGradient: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSvg: {
    position: 'absolute',
  },
  scoreValue: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1FA2A6',
  },
  scoreTextCommunity: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F59E0B',
  },
  scoreMax: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -4,
  },
  scoreDivider: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  scoreDividerLine: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  scoreDividerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  votersText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Categories
  categoriesContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitleContainer: {
    flex: 1,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  categoryWeight: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  categoryWeightText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },

  // Rating Stars
  ratingContainer: {
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  starButton: {
    width: '18%',
  },
  star: {
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  starActive: {
    borderColor: 'transparent',
    transform: [{ scale: 1.05 }],
  },
  starText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  starTextActive: {
    color: '#FFFFFF',
  },

  // Comparison
  comparisonContainer: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  comparisonLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonValueUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  comparisonValueCommunity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  comparisonValueDiff: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  comparisonPositive: {
    color: '#22C55E',
  },
  comparisonNegative: {
    color: '#EF4444',
  },
  comparisonNeutral: {
    color: '#9CA3AF',
  },
  comparisonDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },

  // Progress Bars
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarCommunity: {
    opacity: 0.6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressFillCommunity: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },

  // Submit Button
  submitButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
  },
  submitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoNoteEmoji: {
    fontSize: 16,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // 🌟 PREDICTION ANALYSIS STYLES
  analysisCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  analysisSubtitle: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
  },
  analystNote: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  analystNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  analystNoteText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  clusterScoresContainer: {
    marginTop: 16,
    gap: 12,
  },
  clusterScoresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  clusterScoreCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  clusterScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clusterIcon: {
    fontSize: 20,
  },
  clusterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clusterScoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  clusterStat: {
    alignItems: 'center',
  },
  clusterStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  clusterStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  focusedStatsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  focusedStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  focusedStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  focusedStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  focusedStat: {
    alignItems: 'center',
  },
  focusedStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1FA2A6',
    marginBottom: 4,
  },
  focusedStatValueWrong: {
    color: '#EF4444',
  },
  focusedStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // 📊 Cluster Breakdown Styles
  clusterBreakdownCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  clusterBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  clusterBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  clusterRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  clusterRowIcon: {
    fontSize: 24,
  },
  clusterRowInfo: {
    flex: 1,
  },
  clusterRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  clusterRowStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clusterRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clusterRowPoints: {
    alignItems: 'flex-end',
  },
  clusterRowPointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  clusterRowPointsLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  clusterRowAccuracy: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clusterRowAccuracyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  analystNoteContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  analystNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  analystNoteHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // 🎉 BADGE POPUP STYLES
  badgePopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePopupContainer: {
    backgroundColor: '#1E3A3A',
    borderRadius: 32,
    padding: 40,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  confetti: {
    fontSize: 32,
  },
  badgePopupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  badgePopupIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
  },
  badgePopupIcon: {
    fontSize: 70,
  },
  badgePopupName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgePopupTier: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgePopupTierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgePopupDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  badgePopupCounter: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  badgePopupButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  badgePopupButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  badgePopupButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgePopupButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgePopupButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgePopupButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
