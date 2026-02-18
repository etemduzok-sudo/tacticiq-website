// TacticIQ - 3 Saha Görünümü Komponenti
// Maç başladıktan sonra: Kullanıcı Kadrosu | Topluluk Kadrosu | Gerçek Kadro
// Sadece atak formasyonu gösterilir, defans formasyonu puan hesaplamasında kullanılır

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIELD_WIDTH = SCREEN_WIDTH - 32; // Tam genişlik - padding
const FIELD_HEIGHT = FIELD_WIDTH * 0.75; // 4:3 oran

interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  photo?: string;
  rating?: number;
}

interface ThreeFieldViewProps {
  // Kullanıcının tahmini
  userSquad: {
    players: Player[];
    formation: string;
    defenseFormation?: string;
  };
  // Topluluk tercihi
  communitySquad: {
    players: Player[];
    formation: string;
    defenseFormation?: string;
    voterCount: number;
  };
  // Gerçek kadro
  actualSquad: {
    players: Player[];
    formation: string;
    defenseFormation?: string;
  };
  // Maç bilgileri
  homeTeam: {
    id: number;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo?: string;
  };
  isMatchLive: boolean;
  isMatchFinished: boolean;
  matchMinute?: number;
  // Değişiklik önerisi callback'i
  onSubstitutionVote?: (outPlayerId: number, inPlayerId: number) => void;
  // Detaylı modal açma
  onOpenDetailModal?: (type: 'user' | 'community' | 'actual') => void;
}

// Formasyon pozisyonları
const FORMATION_POSITIONS: Record<string, { x: number; y: number }[]> = {
  '4-3-3': [
    // GK
    { x: 50, y: 90 },
    // Defans: LB, CB, CB, RB
    { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
    // Orta Saha: LM, CM, RM
    { x: 25, y: 50 }, { x: 50, y: 45 }, { x: 75, y: 50 },
    // Forvet: LW, ST, RW
    { x: 20, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 20 },
  ],
  '4-4-2': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
    { x: 15, y: 45 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 45 },
    { x: 35, y: 18 }, { x: 65, y: 18 },
  ],
  '3-5-2': [
    { x: 50, y: 90 },
    { x: 25, y: 72 }, { x: 50, y: 75 }, { x: 75, y: 72 },
    { x: 10, y: 48 }, { x: 30, y: 52 }, { x: 50, y: 45 }, { x: 70, y: 52 }, { x: 90, y: 48 },
    { x: 35, y: 18 }, { x: 65, y: 18 },
  ],
  '4-2-3-1': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
    { x: 35, y: 55 }, { x: 65, y: 55 },
    { x: 20, y: 35 }, { x: 50, y: 30 }, { x: 80, y: 35 },
    { x: 50, y: 12 },
  ],
  // Default fallback
  'default': [
    { x: 50, y: 90 },
    { x: 15, y: 70 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 70 },
    { x: 25, y: 50 }, { x: 50, y: 45 }, { x: 75, y: 50 },
    { x: 20, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 20 },
  ],
};

// Saha render komponenti
const MiniField: React.FC<{
  players: Player[];
  formation: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle?: string;
  isActive?: boolean;
  correctCount?: number;
  totalCount?: number;
  onPress?: () => void;
}> = ({
  players,
  formation,
  badge,
  badgeColor,
  title,
  subtitle,
  isActive,
  correctCount,
  totalCount,
  onPress,
}) => {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['default'];
  
  return (
    <TouchableOpacity
      style={[styles.miniFieldContainer, isActive && styles.miniFieldActive]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header */}
      <View style={styles.miniFieldHeader}>
        <View style={[styles.badgeContainer, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.miniFieldTitle}>{title}</Text>
          {subtitle && <Text style={styles.miniFieldSubtitle}>{subtitle}</Text>}
        </View>
        {correctCount !== undefined && totalCount !== undefined && (
          <View style={styles.accuracyBadge}>
            <Text style={styles.accuracyText}>{correctCount}/{totalCount}</Text>
          </View>
        )}
      </View>
      
      {/* Mini Saha */}
      <LinearGradient
        colors={['#1A3A1A', '#0D2E0D']}
        style={styles.miniField}
      >
        {/* Saha çizgileri */}
        <View style={styles.fieldLines}>
          <View style={styles.centerCircle} />
          <View style={styles.penaltyArea} />
          <View style={styles.goalArea} />
        </View>
        
        {/* Oyuncular */}
        {players.slice(0, 11).map((player, index) => {
          const pos = positions[index] || { x: 50, y: 50 };
          const isCorrect = player.rating ? player.rating > 0 : false; // Mock: gerçekte karşılaştırma yapılır
          
          return (
            <View
              key={player.id}
              style={[
                styles.playerDot,
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: [{ translateX: -12 }, { translateY: -12 }],
                },
              ]}
            >
              {player.photo ? (
                <Image
                  source={{ uri: player.photo }}
                  style={styles.playerDotImage}
                />
              ) : (
                <View style={styles.playerDotNumber}>
                  <Text style={styles.playerDotNumberText}>{player.number}</Text>
                </View>
              )}
              <Text style={styles.playerDotName} numberOfLines={1}>
                {player.name.split(' ').pop()?.substring(0, 6) || ''}
              </Text>
            </View>
          );
        })}
        
        {/* Formasyon etiketi */}
        <View style={styles.formationBadge}>
          <Text style={styles.formationBadgeText}>{formation}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function ThreeFieldView({
  userSquad,
  communitySquad,
  actualSquad,
  homeTeam,
  awayTeam,
  isMatchLive,
  isMatchFinished,
  matchMinute,
  onSubstitutionVote,
  onOpenDetailModal,
}: ThreeFieldViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Kullanıcı kadrosu doğruluk hesabı (gerçekle karşılaştır)
  const userAccuracy = useMemo(() => {
    const actualIds = new Set(actualSquad.players.map(p => p.id));
    const correct = userSquad.players.filter(p => actualIds.has(p.id)).length;
    return { correct, total: 11 };
  }, [userSquad.players, actualSquad.players]);
  
  // Topluluk kadrosu doğruluk hesabı
  const communityAccuracy = useMemo(() => {
    const actualIds = new Set(actualSquad.players.map(p => p.id));
    const correct = communitySquad.players.filter(p => actualIds.has(p.id)).length;
    return { correct, total: 11 };
  }, [communitySquad.players, actualSquad.players]);
  
  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / FIELD_WIDTH);
    setCurrentIndex(index);
  };
  
  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * FIELD_WIDTH, animated: true });
    setCurrentIndex(index);
  };
  
  return (
    <View style={styles.container}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kadro Karşılaştırması</Text>
        {isMatchLive && matchMinute && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>{matchMinute}'</Text>
          </View>
        )}
        {isMatchFinished && (
          <View style={styles.finishedBadge}>
            <Text style={styles.finishedText}>Bitti</Text>
          </View>
        )}
      </View>
      
      {/* Tab Göstergeleri */}
      <View style={styles.tabIndicators}>
        <TouchableOpacity
          style={[styles.tabIndicator, currentIndex === 0 && styles.tabIndicatorActive]}
          onPress={() => scrollToIndex(0)}
        >
          <Text style={styles.tabIndicatorEmoji}>👤</Text>
          <Text style={[styles.tabIndicatorText, currentIndex === 0 && styles.tabIndicatorTextActive]}>
            Senin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabIndicator, currentIndex === 1 && styles.tabIndicatorActive]}
          onPress={() => scrollToIndex(1)}
        >
          <Text style={styles.tabIndicatorEmoji}>👥</Text>
          <Text style={[styles.tabIndicatorText, currentIndex === 1 && styles.tabIndicatorTextActive]}>
            Topluluk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabIndicator, currentIndex === 2 && styles.tabIndicatorActive]}
          onPress={() => scrollToIndex(2)}
        >
          <Text style={styles.tabIndicatorEmoji}>✓</Text>
          <Text style={[styles.tabIndicatorText, currentIndex === 2 && styles.tabIndicatorTextActive]}>
            Gerçek
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Yatay Scroll Sahalar */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Kullanıcı Kadrosu */}
        <MiniField
          players={userSquad.players}
          formation={userSquad.formation}
          badge="👤"
          badgeColor="#3B82F6"
          title="Senin Tahmininin"
          subtitle={`Atak: ${userSquad.formation}`}
          isActive={currentIndex === 0}
          correctCount={userAccuracy.correct}
          totalCount={userAccuracy.total}
          onPress={() => onOpenDetailModal?.('user')}
        />
        
        {/* 2. Topluluk Kadrosu */}
        <MiniField
          players={communitySquad.players}
          formation={communitySquad.formation}
          badge="👥"
          badgeColor="#8B5CF6"
          title="Topluluk Tercihi"
          subtitle={`${communitySquad.voterCount.toLocaleString()} oy`}
          isActive={currentIndex === 1}
          correctCount={communityAccuracy.correct}
          totalCount={communityAccuracy.total}
          onPress={() => onOpenDetailModal?.('community')}
        />
        
        {/* 3. Gerçek Kadro */}
        <MiniField
          players={actualSquad.players}
          formation={actualSquad.formation}
          badge="✓"
          badgeColor="#10B981"
          title="Gerçek Kadro"
          subtitle={`Atak: ${actualSquad.formation}`}
          isActive={currentIndex === 2}
          onPress={() => onOpenDetailModal?.('actual')}
        />
      </ScrollView>
      
      {/* Sayfa Göstergeleri */}
      <View style={styles.pageIndicators}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.pageIndicator,
              currentIndex === index && styles.pageIndicatorActive,
            ]}
          />
        ))}
      </View>
      
      {/* Sonuç Özeti (Maç bittiyse) */}
      {isMatchFinished && (
        <View style={styles.resultSummary}>
          <View style={styles.resultItem}>
            <Text style={styles.resultEmoji}>👤</Text>
            <Text style={styles.resultLabel}>Sen</Text>
            <Text style={[styles.resultValue, { color: userAccuracy.correct >= 7 ? '#10B981' : '#F59E0B' }]}>
              {userAccuracy.correct}/11
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultItem}>
            <Text style={styles.resultEmoji}>👥</Text>
            <Text style={styles.resultLabel}>Topluluk</Text>
            <Text style={[styles.resultValue, { color: communityAccuracy.correct >= 7 ? '#10B981' : '#F59E0B' }]}>
              {communityAccuracy.correct}/11
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Fark</Text>
            <Text style={[
              styles.resultValue,
              { color: userAccuracy.correct > communityAccuracy.correct ? '#10B981' : 
                       userAccuracy.correct < communityAccuracy.correct ? '#EF4444' : '#9CA3AF' }
            ]}>
              {userAccuracy.correct > communityAccuracy.correct ? '+' : ''}
              {userAccuracy.correct - communityAccuracy.correct}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  finishedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  finishedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  tabIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  tabIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  tabIndicatorActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    borderWidth: 1,
    borderColor: '#1FA2A6',
  },
  tabIndicatorEmoji: {
    fontSize: 12,
  },
  tabIndicatorText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabIndicatorTextActive: {
    color: '#1FA2A6',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  miniFieldContainer: {
    width: FIELD_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniFieldActive: {
    borderColor: '#1FA2A6',
  },
  miniFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  badgeContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  miniFieldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  miniFieldSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  accuracyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  miniField: {
    width: '100%',
    height: FIELD_HEIGHT,
    position: 'relative',
  },
  fieldLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  centerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  penaltyArea: {
    position: 'absolute',
    width: '60%',
    height: 60,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    bottom: 0,
    left: '20%',
    borderBottomWidth: 0,
  },
  goalArea: {
    position: 'absolute',
    width: '30%',
    height: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    bottom: 0,
    left: '35%',
    borderBottomWidth: 0,
  },
  playerDot: {
    position: 'absolute',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  playerDotImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  playerDotNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerDotNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D2E0D',
  },
  playerDotName: {
    fontSize: 7,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
  formationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  pageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pageIndicatorActive: {
    width: 18,
    backgroundColor: '#1FA2A6',
  },
  resultSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    gap: 12,
  },
  resultItem: {
    alignItems: 'center',
    gap: 2,
  },
  resultEmoji: {
    fontSize: 16,
  },
  resultLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
