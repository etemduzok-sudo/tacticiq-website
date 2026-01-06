// MatchRatingsScreen.tsx - React Native FULL VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

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
    color: '#059669'
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
          entering={FadeIn.duration(400)}
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
                      stroke="#059669"
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
        >
          <LinearGradient
            colors={['#059669', '#047857']}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    color: '#059669',
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
    color: '#059669',
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
    color: '#059669',
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
});
