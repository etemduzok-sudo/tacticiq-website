// MatchPredictionSummaryCard.tsx
// Biten maçların altında gösterilen kompakt tahmin özeti
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../../config/constants';

// Web için reanimated animasyonları desteklenmiyor
const isWeb = Platform.OS === 'web';
let Animated: any;
let FadeInDown: any;
let FadeIn: any;

if (isWeb) {
  // Web için React Native Animated kullan (animasyon yok)
  const RNAnimated = require('react-native').Animated;
  Animated = { View: RNAnimated.View };
  FadeInDown = undefined;
  FadeIn = undefined;
} else {
  // Native için reanimated kullan
  const Reanimated = require('react-native-reanimated');
  Animated = Reanimated.default || Reanimated;
  FadeInDown = Reanimated.FadeInDown;
  FadeIn = Reanimated.FadeIn;
}

const { width } = Dimensions.get('window');

interface MatchPredictionSummaryCardProps {
  matchId: number;
  matchData: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
  };
  onViewDetails?: () => void;
}

interface PredictionResult {
  totalPoints: number;
  maxPoints: number;
  successRate: number;
  breakdown: {
    matchPredictions: number;
    playerPredictions: number;
    bonusPoints: number;
    penalties: number;
  };
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
}

export function MatchPredictionSummaryCard({ matchId, matchData, onViewDetails }: MatchPredictionSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasPrediction, setHasPrediction] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictionData();
  }, [matchId]);

  const loadPredictionData = async () => {
    try {
      // Tahmin verisini yükle
      const predKey = `${STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const legacyPredKey = `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const predData = await AsyncStorage.getItem(predKey) || await AsyncStorage.getItem(legacyPredKey);
      
      if (predData) {
        setHasPrediction(true);
        const parsed = JSON.parse(predData);
        
        // Tahmin sonuçlarını hesapla (mock - gerçek implementasyonda ScoringEngine kullanılacak)
        // TODO: Gerçek skor hesaplaması için ScoringEngine entegrasyonu
        const result: PredictionResult = {
          totalPoints: Math.floor(Math.random() * 100) + 50, // Mock
          maxPoints: 180,
          successRate: Math.floor(Math.random() * 40) + 50, // Mock
          breakdown: {
            matchPredictions: Math.floor(Math.random() * 50) + 20,
            playerPredictions: Math.floor(Math.random() * 30) + 10,
            bonusPoints: Math.floor(Math.random() * 20),
            penalties: 0,
          },
          correctCount: Math.floor(Math.random() * 4) + 2,
          wrongCount: Math.floor(Math.random() * 3),
          emptyCount: Math.floor(Math.random() * 2),
        };
        setPredictionResult(result);
      } else {
        setHasPrediction(false);
      }
    } catch (error) {
      console.error('Error loading prediction data:', error);
      setHasPrediction(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Loading sırasında hiçbir şey gösterme
  }

  if (!hasPrediction) {
    return null; // Tahmin yoksa hiçbir şey gösterme
  }

  const successColor = predictionResult && predictionResult.successRate >= 70 
    ? '#10B981' 
    : predictionResult && predictionResult.successRate >= 50 
      ? '#F59E0B' 
      : '#EF4444';

  return (
    <Animated.View 
      entering={!isWeb && FadeInDown ? FadeInDown.delay(100).springify() : undefined}
      style={styles.container}
    >
      {/* Kompakt Özet Bar */}
      <TouchableOpacity 
        style={styles.summaryBar}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          <View style={styles.starBadge}>
            <Ionicons name="star" size={12} color="#EAB308" />
          </View>
          <Text style={styles.summaryText}>Tahmin Yapıldı</Text>
        </View>
        
        <View style={styles.rightSection}>
          {predictionResult && (
            <>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{predictionResult.totalPoints}</Text>
                <Text style={styles.pointsLabel}>puan</Text>
              </View>
              <View style={[styles.percentBadge, { backgroundColor: `${successColor}20` }]}>
                <Text style={[styles.percentText, { color: successColor }]}>
                  %{predictionResult.successRate}
                </Text>
              </View>
            </>
          )}
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#64748B" 
          />
        </View>
      </TouchableOpacity>

      {/* Genişletilmiş Detay */}
      {expanded && predictionResult && (
        <Animated.View 
          entering={!isWeb && FadeIn ? FadeIn.duration(200) : undefined}
          style={styles.expandedContent}
        >
          {/* Puan Detayları */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="football-outline" size={16} color="#1FA2A6" />
              <Text style={styles.detailValue}>{predictionResult.breakdown.matchPredictions}</Text>
              <Text style={styles.detailLabel}>Maç</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color="#8B5CF6" />
              <Text style={styles.detailValue}>{predictionResult.breakdown.playerPredictions}</Text>
              <Text style={styles.detailLabel}>Oyuncu</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="gift-outline" size={16} color="#10B981" />
              <Text style={styles.detailValue}>+{predictionResult.breakdown.bonusPoints}</Text>
              <Text style={styles.detailLabel}>Bonus</Text>
            </View>
          </View>

          {/* Doğru/Yanlış Sayıları */}
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <View style={[styles.resultDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.resultText}>{predictionResult.correctCount} Doğru</Text>
            </View>
            <View style={styles.resultItem}>
              <View style={[styles.resultDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.resultText}>{predictionResult.wrongCount} Yanlış</Text>
            </View>
            {predictionResult.emptyCount > 0 && (
              <View style={styles.resultItem}>
                <View style={[styles.resultDot, { backgroundColor: '#64748B' }]} />
                <Text style={styles.resultText}>{predictionResult.emptyCount} Boş</Text>
              </View>
            )}
          </View>

          {/* Detay Butonu */}
          {onViewDetails && (
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={onViewDetails}
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailsText}>Detaylı Görüntüle</Text>
              <Ionicons name="arrow-forward" size={14} color="#1FA2A6" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFB',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1FA2A6',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.1)',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1FA2A6',
  },
});
