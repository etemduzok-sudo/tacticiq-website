// MatchPredictionSummaryCard.tsx
// Biten maçların altında gösterilen kompakt tahmin özeti - Sadece buton olarak
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { STORAGE_KEYS } from '../../config/constants';

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

export function MatchPredictionSummaryCard({ matchId, matchData, onViewDetails }: MatchPredictionSummaryCardProps) {
  const [hasPrediction, setHasPrediction] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictionData();
  }, [matchId]);

  const loadPredictionData = async () => {
    try {
      // Tahmin verisini yükle
      const predKey = `${STORAGE_KEYS.PREDICTIONS}${matchId}`;
      const predData = await AsyncStorage.getItem(predKey);
      
      setHasPrediction(!!predData);
    } catch (error) {
      console.error('Error loading prediction data:', error);
      setHasPrediction(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasPrediction) {
    return null;
  }

  // Sadece "İstatistikler ve maç özeti için tıklayın" butonu göster
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="bar-chart-outline" size={14} color="#1FA2A6" />
        </View>
        <Text style={styles.text}>İstatistikler ve maç özeti için tıklayın</Text>
        <Ionicons name="chevron-forward" size={14} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginHorizontal: 12,
    marginBottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
  },
});
