// TacticIQ - Canlı Değişiklik Oylama Komponenti
// Kullanıcılar canlı maç sırasında değişiklik önerileri yapabilir ve oy verebilir

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/theme';

interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  photo?: string;
  rating?: number;
}

interface SubstitutionSuggestion {
  id: string;
  outPlayer: Player;
  inPlayer: Player;
  voteCount: number;
  votePercentage: number;
  hasUserVoted: boolean;
  reason?: string;
  createdAt: Date;
  topVoters?: string[];
}

interface LiveSubstitutionVoteProps {
  // Şu anki 11
  currentXI: Player[];
  // Yedekler
  reserves: Player[];
  // Mevcut değişiklik önerileri
  suggestions: SubstitutionSuggestion[];
  // Toplam oy veren sayısı
  totalVoters: number;
  // Maç dakikası
  matchMinute: number;
  // Kullanıcı oy verdiğinde
  onVote: (suggestionId: string) => void;
  // Yeni öneri eklendiğinde
  onAddSuggestion: (outPlayerId: number, inPlayerId: number, reason?: string) => void;
  // Kullanıcının kalan oy hakkı
  remainingVotes: number;
  // Takım bilgisi
  teamName: string;
  teamLogo?: string;
  // Aktif mi (maç canlıysa)
  isActive: boolean;
}

/**
 * Değişiklik önerileri - gerçek topluluk verisi gelene kadar boş döner.
 * Gerçek veri substitutionVoteService.ts üzerinden Supabase'den gelecek.
 */
export function generateMockSubstitutionSuggestions(
  _currentXI: Player[],
  _reserves: Player[],
  _matchMinute: number
): SubstitutionSuggestion[] {
  return [];
}

// Tek bir öneri kartı
const SuggestionCard: React.FC<{
  suggestion: SubstitutionSuggestion;
  onVote: () => void;
  canVote: boolean;
  isTopSuggestion: boolean;
}> = ({ suggestion, onVote, canVote, isTopSuggestion }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity
      style={[
        styles.suggestionCard,
        isTopSuggestion && styles.suggestionCardTop,
        suggestion.hasUserVoted && styles.suggestionCardVoted,
      ]}
      onPress={canVote && !suggestion.hasUserVoted ? onVote : undefined}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.9}
      disabled={!canVote || suggestion.hasUserVoted}
    >
      {/* Progress bar arka planı */}
      <View
        style={[
          styles.voteProgressBar,
          { width: `${suggestion.votePercentage}%` },
          isTopSuggestion && styles.voteProgressBarTop,
        ]}
      />
      
      <View style={styles.suggestionContent}>
        {/* Çıkan Oyuncu */}
        <View style={styles.playerColumn}>
          <View style={styles.playerImageContainer}>
            {suggestion.outPlayer.photo ? (
              <Image source={{ uri: suggestion.outPlayer.photo }} style={styles.playerImage} />
            ) : (
              <View style={styles.playerImagePlaceholder}>
                <Text style={styles.playerNumber}>{suggestion.outPlayer.number}</Text>
              </View>
            )}
            <View style={styles.outBadge}>
              <Ionicons name="arrow-down" size={10} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>
            {suggestion.outPlayer.name.split(' ').pop()}
          </Text>
        </View>
        
        {/* Ok işareti */}
        <View style={styles.arrowContainer}>
          <Ionicons name="swap-horizontal" size={20} color="#1FA2A6" />
        </View>
        
        {/* Giren Oyuncu */}
        <View style={styles.playerColumn}>
          <View style={styles.playerImageContainer}>
            {suggestion.inPlayer.photo ? (
              <Image source={{ uri: suggestion.inPlayer.photo }} style={styles.playerImage} />
            ) : (
              <View style={styles.playerImagePlaceholder}>
                <Text style={styles.playerNumber}>{suggestion.inPlayer.number}</Text>
              </View>
            )}
            <View style={styles.inBadge}>
              <Ionicons name="arrow-up" size={10} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.playerName} numberOfLines={1}>
            {suggestion.inPlayer.name.split(' ').pop()}
          </Text>
        </View>
        
        {/* Oy bilgisi */}
        <View style={styles.voteInfo}>
          <Text style={[styles.voteCount, isTopSuggestion && styles.voteCountTop]}>
            {suggestion.voteCount.toLocaleString()}
          </Text>
          <Text style={styles.votePercentage}>%{suggestion.votePercentage}</Text>
        </View>
        
        {/* Oy butonu */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            suggestion.hasUserVoted && styles.voteButtonVoted,
            !canVote && !suggestion.hasUserVoted && styles.voteButtonDisabled,
          ]}
          onPress={canVote && !suggestion.hasUserVoted ? onVote : undefined}
          disabled={!canVote || suggestion.hasUserVoted}
        >
          <Ionicons
            name={suggestion.hasUserVoted ? 'checkmark' : 'thumbs-up-outline'}
            size={16}
            color={suggestion.hasUserVoted ? '#FFFFFF' : '#1FA2A6'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Sebep (varsa) */}
      {suggestion.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText}>{suggestion.reason}</Text>
        </View>
      )}
      
      {/* En popüler rozeti */}
      {isTopSuggestion && (
        <View style={styles.topBadge}>
          <Ionicons name="flame" size={10} color="#FFFFFF" />
          <Text style={styles.topBadgeText}>En Popüler</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function LiveSubstitutionVote({
  currentXI,
  reserves,
  suggestions,
  totalVoters,
  matchMinute,
  onVote,
  onAddSuggestion,
  remainingVotes,
  teamName,
  teamLogo,
  isActive,
}: LiveSubstitutionVoteProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOutPlayer, setSelectedOutPlayer] = useState<Player | null>(null);
  const [selectedInPlayer, setSelectedInPlayer] = useState<Player | null>(null);
  const [reason, setReason] = useState('');
  
  // En popüler öneri
  const topSuggestion = useMemo(() => {
    if (suggestions.length === 0) return null;
    return suggestions.reduce((prev, curr) => (curr.voteCount > prev.voteCount ? curr : prev));
  }, [suggestions]);
  
  const handleAddSuggestion = () => {
    if (selectedOutPlayer && selectedInPlayer) {
      onAddSuggestion(selectedOutPlayer.id, selectedInPlayer.id, reason || undefined);
      setShowAddModal(false);
      setSelectedOutPlayer(null);
      setSelectedInPlayer(null);
      setReason('');
    }
  };
  
  if (!isActive) {
    return (
      <View style={styles.inactiveContainer}>
        <Ionicons name="time-outline" size={24} color="#6B7280" />
        <Text style={styles.inactiveText}>
          Değişiklik önerileri maç başladığında aktif olacak
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {teamLogo && <Image source={{ uri: teamLogo }} style={styles.teamLogo} />}
          <View>
            <Text style={styles.headerTitle}>Değişiklik Önerileri</Text>
            <Text style={styles.headerSubtitle}>{totalVoters.toLocaleString()} kullanıcı oy verdi</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.votesRemaining}>
            <Text style={styles.votesRemainingText}>
              {remainingVotes} oy hakkın
            </Text>
          </View>
        </View>
      </View>
      
      {/* Öneriler Listesi */}
      <ScrollView
        style={styles.suggestionsList}
        showsVerticalScrollIndicator={false}
      >
        {suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal-outline" size={32} color="#6B7280" />
            <Text style={styles.emptyText}>Henüz değişiklik önerisi yok</Text>
            <Text style={styles.emptySubtext}>İlk öneriyi sen yap!</Text>
          </View>
        ) : (
          suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onVote={() => onVote(suggestion.id)}
              canVote={remainingVotes > 0}
              isTopSuggestion={topSuggestion?.id === suggestion.id}
            />
          ))
        )}
      </ScrollView>
      
      {/* Yeni Öneri Butonu */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Yeni Öneri</Text>
      </TouchableOpacity>
      
      {/* Yeni Öneri Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Değişiklik Öner</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            {/* Çıkacak Oyuncu Seçimi */}
            <Text style={styles.modalSectionTitle}>Çıkacak Oyuncu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerSelectScroll}>
              {currentXI.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerSelectItem,
                    selectedOutPlayer?.id === player.id && styles.playerSelectItemActive,
                  ]}
                  onPress={() => setSelectedOutPlayer(player)}
                >
                  <View style={styles.playerSelectNumber}>
                    <Text style={styles.playerSelectNumberText}>{player.number}</Text>
                  </View>
                  <Text style={styles.playerSelectName} numberOfLines={1}>
                    {player.name.split(' ').pop()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Ok */}
            <View style={styles.modalArrow}>
              <Ionicons name="arrow-down" size={24} color="#1FA2A6" />
            </View>
            
            {/* Girecek Oyuncu Seçimi */}
            <Text style={styles.modalSectionTitle}>Girecek Oyuncu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playerSelectScroll}>
              {reserves.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerSelectItem,
                    selectedInPlayer?.id === player.id && styles.playerSelectItemActiveIn,
                  ]}
                  onPress={() => setSelectedInPlayer(player)}
                >
                  <View style={styles.playerSelectNumber}>
                    <Text style={styles.playerSelectNumberText}>{player.number}</Text>
                  </View>
                  <Text style={styles.playerSelectName} numberOfLines={1}>
                    {player.name.split(' ').pop()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Onay Butonu */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedOutPlayer || !selectedInPlayer) && styles.confirmButtonDisabled,
              ]}
              onPress={handleAddSuggestion}
              disabled={!selectedOutPlayer || !selectedInPlayer}
            >
              <Text style={styles.confirmButtonText}>Öner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  inactiveContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inactiveText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  votesRemaining: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  votesRemainingText: {
    fontSize: 11,
    color: '#1FA2A6',
    fontWeight: '600',
  },
  suggestionsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionCardTop: {
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  suggestionCardVoted: {
    borderColor: '#1FA2A6',
  },
  voteProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
  },
  voteProgressBarTop: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  playerColumn: {
    alignItems: 'center',
    width: 60,
  },
  playerImageContainer: {
    position: 'relative',
  },
  playerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'center',
  },
  voteInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  voteCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voteCountTop: {
    color: '#F59E0B',
  },
  votePercentage: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  voteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1FA2A6',
  },
  voteButtonVoted: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  voteButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: '#6B7280',
  },
  reasonContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  reasonText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  topBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    gap: 3,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1FA2A6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginTop: SPACING.sm,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  playerSelectScroll: {
    marginBottom: SPACING.md,
  },
  playerSelectItem: {
    alignItems: 'center',
    marginRight: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 60,
  },
  playerSelectItemActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  playerSelectItemActiveIn: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  playerSelectNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerSelectNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerSelectName: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalArrow: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: '#1FA2A6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  confirmButtonDisabled: {
    backgroundColor: '#374151',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
