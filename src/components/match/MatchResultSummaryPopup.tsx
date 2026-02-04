/**
 * MatchResultSummaryPopup - Biten maç özeti bottom sheet
 * Alttan yukarı kayarak açılır, oyuncu özellikleri popup'ı gibi
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { MatchResultSummary } from './MatchResultSummary';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface MatchResultSummaryPopupProps {
  visible: boolean;
  matchId: string | null;
  onClose: () => void;
}

export function MatchResultSummaryPopup({
  visible,
  matchId,
  onClose,
}: MatchResultSummaryPopupProps) {
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && matchId) {
      loadMatchData();
    } else {
      setMatchData(null);
      setError(null);
    }
  }, [visible, matchId]);

  const loadMatchData = async () => {
    if (!matchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.matches.getMatchDetails(parseInt(matchId));
      if (res?.success && res?.data) {
        setMatchData(res.data);
      } else {
        setError('Maç verisi yüklenemedi');
      }
    } catch (err: any) {
      setError(err?.message || 'Yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const summaryMatchData = matchData ? {
    ...matchData,
    teams: matchData.teams || { home: matchData.homeTeam, away: matchData.awayTeam },
    goals: matchData?.goals || { home: 0, away: 0 },
  } : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          entering={isWeb ? undefined : SlideInDown.duration(300)}
          exiting={isWeb ? undefined : SlideOutDown.duration(200)}
          style={styles.container}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.contentWrap}
          >
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Maç Özeti</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1FA2A6" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadMatchData}>
                  <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                </TouchableOpacity>
              </View>
            ) : summaryMatchData && matchId ? (
              <View style={styles.summaryWrapper}>
                <MatchResultSummary
                  matchId={matchId}
                  matchData={summaryMatchData}
                />
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0A1A14',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  contentWrap: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  summaryWrapper: {
    flex: 1,
    maxHeight: height * 0.75,
    minHeight: 300,
  },
});

export default MatchResultSummaryPopup;
