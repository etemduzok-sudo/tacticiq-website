/**
 * Community Signal Popup
 * Oyuncu değişikliği sırasında topluluk önerilerini gösteren bottom sheet
 * 
 * Trigger: Kullanıcı bir oyuncuyu seçip "Değiştir" dediğinde gösterilir
 * NOT: Otomatik açılmaz, spam yapmaz
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  SlideInDown, 
  SlideOutDown,
  FadeIn,
  FadeOut 
} from 'react-native-reanimated';
import { CommunitySignalData, getCommunitySignal } from '../../services/communitySignalService';
import { formatPlayerDisplayName } from '../../utils/playerNameUtils';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface CommunitySignalPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelectReplacement?: (player: any) => void;
  // Match/Team context
  matchId: number | string;
  teamId: number;
  // Current player being replaced
  currentPlayer: {
    id: number;
    name: string;
    position: string;
  } | null;
  // User's current lineup
  userLineup: Record<number, any>;
  formationId: string;
  // Available players for replacement
  availablePlayers: any[];
}

export const CommunitySignalPopup: React.FC<CommunitySignalPopupProps> = ({
  visible,
  onClose,
  onSelectReplacement,
  matchId,
  teamId,
  currentPlayer,
  userLineup,
  formationId,
  availablePlayers,
}) => {
  const [loading, setLoading] = useState(true);
  const [signalData, setSignalData] = useState<(CommunitySignalData & { lineupCompatibility: number }) | null>(null);

  useEffect(() => {
    if (visible && currentPlayer) {
      loadCommunitySignal();
    }
  }, [visible, currentPlayer?.id]);

  const loadCommunitySignal = async () => {
    if (!currentPlayer) return;
    
    setLoading(true);
    try {
      const data = await getCommunitySignal(
        matchId,
        teamId,
        currentPlayer.id,
        currentPlayer.position,
        userLineup,
        formationId,
        availablePlayers
      );
      setSignalData(data);
    } catch (error) {
      console.warn('Community signal load error:', error);
      setSignalData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReplacement = (player: any) => {
    onSelectReplacement?.(player);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View
          entering={isWeb ? undefined : SlideInDown.duration(300)}
          exiting={isWeb ? undefined : SlideOutDown.duration(200)}
          style={styles.container}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="people" size={20} color="#1FA2A6" />
                <Text style={styles.headerTitle}>Topluluk Sinyali</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1FA2A6" />
                <Text style={styles.loadingText}>Topluluk verileri yükleniyor...</Text>
              </View>
            ) : !signalData?.hasSufficientData ? (
              <View style={styles.noDataContainer}>
                <Ionicons name="analytics-outline" size={32} color="#64748B" />
                <Text style={styles.noDataTitle}>Henüz yeterli veri yok</Text>
                <Text style={styles.noDataSubtitle}>
                  Topluluk önerileri için daha fazla kullanıcı kadro tahmini yapmalı
                </Text>
              </View>
            ) : (
              <>
                {/* Lineup Compatibility Score */}
                <View style={styles.compatibilitySection}>
                  <View style={styles.compatibilityHeader}>
                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    <Text style={styles.sectionTitle}>Kadro Uyumluluğu</Text>
                  </View>
                  <View style={styles.compatibilityScore}>
                    <Text style={styles.scoreValue}>%{signalData.lineupCompatibility}</Text>
                    <Text style={styles.scoreLabel}>topluluk kadroları ile uyumlu</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${signalData.lineupCompatibility}%` }
                      ]} 
                    />
                  </View>
                </View>

                {/* Replacement Signal */}
                {currentPlayer && (
                  <View style={styles.replacementSection}>
                    <View style={styles.replacementHeader}>
                      <Ionicons name="swap-horizontal" size={18} color="#F59E0B" />
                      <Text style={styles.sectionTitle}>Değişiklik Sinyali</Text>
                    </View>
                    <Text style={styles.replacementInfo}>
                      <Text style={styles.highlightText}>%{signalData.replacementPercentage}</Text>
                      {' '}kullanıcı {currentPlayer.name} yerine başka oyuncu tercih etti
                    </Text>
                  </View>
                )}

                {/* Top Replacement Suggestions */}
                {signalData.topReplacements.length > 0 && (
                  <View style={styles.suggestionsSection}>
                    <Text style={styles.suggestionsTitle}>En Popüler Alternatifler</Text>
                    {signalData.topReplacements.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.player.id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectReplacement(suggestion.player)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestionRank}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName}>{formatPlayerDisplayName(suggestion.player)}</Text>
                          <Text style={styles.suggestionPosition}>
                            {suggestion.player.position}
                            {suggestion.player.number ? ` • #${suggestion.player.number}` : ''}
                          </Text>
                        </View>
                        <View style={styles.suggestionPercentage}>
                          <Text style={styles.percentageText}>%{suggestion.percentage}</Text>
                          <Ionicons name="chevron-forward" size={16} color="#64748B" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Sample Size Info */}
                <View style={styles.sampleInfo}>
                  <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                  <Text style={styles.sampleText}>
                    {signalData.sampleSize} kullanıcı kadrosuna dayalı
                  </Text>
                </View>
              </>
            )}

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              Bu öneriler sadece bilgi amaçlıdır. Kendi tercihlerinizi yapabilirsiniz.
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: height * 0.7,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  noDataSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  compatibilitySection: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compatibilityScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  scoreLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  replacementSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  replacementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  replacementInfo: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  suggestionRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  suggestionPosition: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  suggestionPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  sampleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sampleText: {
    fontSize: 12,
    color: '#64748B',
  },
  disclaimer: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CommunitySignalPopup;
