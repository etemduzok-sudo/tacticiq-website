// TacticIQ - 3 Saha Görünümü Komponenti
// Maç başladıktan sonra: Kullanıcı Kadrosu | Topluluk Kadrosu | Gerçek Kadro
// Sadece sahalar gösterilir - Kadro sekmesiyle aynı boyut

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/theme';
import { PITCH_LAYOUT } from '../../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
// Kadro sekmesiyle AYNI boyut oranları
const FIELD_WIDTH = isWeb 
  ? PITCH_LAYOUT.WEB_MAX_WIDTH 
  : SCREEN_WIDTH - PITCH_LAYOUT.H_PADDING;
const FIELD_HEIGHT = isWeb 
  ? PITCH_LAYOUT.WEB_HEIGHT 
  : FIELD_WIDTH * PITCH_LAYOUT.ASPECT_RATIO;
// Snap için tam saha genişliği + padding
const SNAP_INTERVAL = FIELD_WIDTH;

interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  photo?: string;
  rating?: number;
}

interface ThreeFieldViewProps {
  // Kullanıcının tahmini (opsiyonel - tahmin yapılmadıysa null)
  userSquad?: {
    players: Player[];
    formation: string;
    defenseFormation?: string;
  } | null;
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
  // Event verileri
  matchEvents?: Array<{
    type: 'goal' | 'card' | 'subst' | 'var';
    playerId?: number;
    playerName?: string;
    minute: number;
    detail?: string;
  }>;
  // Oylama verileri
  substitutionVotes?: Record<number, { outVotes: number; inVotes: number }>;
  // Değişiklik önerisi callback'i
  onSubstitutionVote?: (outPlayerId: number, inPlayerId: number) => void;
  // Detaylı modal açma
  onOpenDetailModal?: (type: 'user' | 'community' | 'actual') => void;
  // Oyuncu kartına tıklama
  onPlayerPress?: (player: Player, fieldType: 'user' | 'community' | 'actual') => void;
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

// Event tipi için emoji mapping
const EVENT_EMOJI: Record<string, string> = {
  goal: '⚽',
  card: '🟨',
  redCard: '🟥',
  subst: '🔄',
  var: '📺',
};

// Saha render komponenti - Kadro sekmesiyle aynı boyut ve görünüm
const FieldCard: React.FC<{
  players: Player[];
  formation: string;
  isMatchLive?: boolean;
  playerEvents?: Record<number, Array<{ type: string; minute: number; detail?: string }>>;
  playerVotes?: Record<number, { outVotes: number; inVotes: number }>;
  onPlayerPress?: (player: Player) => void;
  isActualField?: boolean;
}> = ({
  players,
  formation,
  isMatchLive,
  playerEvents,
  playerVotes,
  onPlayerPress,
  isActualField,
}) => {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['default'];
  
  // Oyuncu için vote göstergesi rengi hesapla
  const getVoteBorderColor = (playerId: number) => {
    if (!playerVotes || !isActualField || !isMatchLive) return null;
    const votes = playerVotes[playerId];
    if (!votes) return null;
    
    const netSentiment = votes.outVotes - votes.inVotes;
    const totalVotes = votes.outVotes + votes.inVotes;
    if (totalVotes < 3) return null;
    
    if (netSentiment > 3) return 'rgba(239, 68, 68, 0.8)';
    if (netSentiment < -3) return 'rgba(16, 185, 129, 0.8)';
    return null;
  };
  
  return (
    <View style={styles.fieldCard}>
      {/* Saha - Kadro sekmesiyle aynı boyut */}
      <LinearGradient
        colors={['#1A3A1A', '#0D2E0D']}
        style={styles.field}
      >
        {/* Saha çizgileri */}
        <View style={styles.fieldLines}>
          <View style={styles.centerLine} />
          <View style={styles.centerCircle} />
          <View style={styles.penaltyAreaTop} />
          <View style={styles.penaltyAreaBottom} />
          <View style={styles.goalAreaTop} />
          <View style={styles.goalAreaBottom} />
        </View>
        
        {/* Oyuncular */}
        {players.slice(0, 11).map((player, index) => {
          const pos = positions[index] || { x: 50, y: 50 };
          const voteBorderColor = getVoteBorderColor(player.id);
          const events = playerEvents?.[player.id] || [];
          const hasEvents = events.length > 0;
          
          return (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: [{ translateX: -22 }, { translateY: -22 }],
                },
                voteBorderColor && {
                  borderWidth: 2,
                  borderColor: voteBorderColor,
                },
              ]}
              onPress={() => isActualField && onPlayerPress?.(player)}
              activeOpacity={isActualField ? 0.7 : 1}
              disabled={!isActualField}
            >
              {player.photo ? (
                <Image
                  source={{ uri: player.photo }}
                  style={styles.playerImage}
                />
              ) : (
                <View style={styles.playerNumber}>
                  <Text style={styles.playerNumberText}>{player.number}</Text>
                </View>
              )}
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name.split(' ').pop()?.substring(0, 8) || ''}
              </Text>
              
              {/* Event badge'leri */}
              {hasEvents && (
                <View style={styles.eventBadgeContainer}>
                  {events.slice(0, 2).map((event, i) => (
                    <Text key={i} style={styles.eventBadgeEmoji}>
                      {EVENT_EMOJI[event.type] || '📌'}
                    </Text>
                  ))}
                </View>
              )}
              
              {/* Vote göstergesi */}
              {isActualField && isMatchLive && playerVotes?.[player.id] && (
                <View style={styles.voteBadge}>
                  <Text style={styles.voteBadgeText}>
                    {playerVotes[player.id].outVotes > playerVotes[player.id].inVotes ? '↓' : '↑'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* Formasyon etiketi */}
        <View style={styles.formationBadge}>
          <Text style={styles.formationBadgeText}>{formation}</Text>
        </View>
        
        {/* Canlı maç göstergesi */}
        {isActualField && isMatchLive && (
          <View style={styles.liveIndicatorSmall}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>Canlı</Text>
          </View>
        )}
      </LinearGradient>
    </View>
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
  matchEvents,
  substitutionVotes,
  onSubstitutionVote,
  onOpenDetailModal,
  onPlayerPress,
}: ThreeFieldViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Kullanıcı kadrosu var mı?
  const hasUserSquad = userSquad && userSquad.players.length > 0;
  
  // Gösterilecek saha sayısı
  const fieldCount = hasUserSquad ? 3 : 2;
  
  // Oyuncu event'lerini map formatına dönüştür
  const playerEventsMap = useMemo(() => {
    if (!matchEvents) return {};
    const map: Record<number, Array<{ type: string; minute: number; detail?: string }>> = {};
    matchEvents.forEach(event => {
      if (event.playerId) {
        if (!map[event.playerId]) map[event.playerId] = [];
        map[event.playerId].push({
          type: event.type,
          minute: event.minute,
          detail: event.detail,
        });
      }
    });
    return map;
  }, [matchEvents]);
  
  // Oylama verilerini map formatına dönüştür
  const playerVotesMap = useMemo(() => {
    return substitutionVotes || {};
  }, [substitutionVotes]);
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SNAP_INTERVAL);
    const clampedIndex = Math.max(0, Math.min(index, fieldCount - 1));
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  };
  
  // Scroll sonrası merkeze snap et
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const targetIndex = Math.round(x / SNAP_INTERVAL);
    const clampedIndex = Math.max(0, Math.min(targetIndex, fieldCount - 1));
    scrollRef.current?.scrollTo({ x: clampedIndex * SNAP_INTERVAL, animated: true });
    setCurrentIndex(clampedIndex);
  };
  
  return (
    <View style={styles.container}>
      {/* Yatay Scroll Sahalar - Başlık ve tab YOK */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        onMomentumScrollEnd={handleScrollEnd}
      >
        {/* 1. Kullanıcı Kadrosu (opsiyonel) */}
        {hasUserSquad && userSquad && (
          <View style={styles.fieldWrapper}>
            <FieldCard
              players={userSquad.players}
              formation={userSquad.formation}
            />
          </View>
        )}
        
        {/* 2. Topluluk Kadrosu */}
        <View style={styles.fieldWrapper}>
          <FieldCard
            players={communitySquad.players}
            formation={communitySquad.formation}
          />
        </View>
        
        {/* 3. Gerçek Kadro */}
        <View style={styles.fieldWrapper}>
          <FieldCard
            players={actualSquad.players}
            formation={actualSquad.formation}
            isActualField={true}
            isMatchLive={isMatchLive}
            playerEvents={playerEventsMap}
            playerVotes={playerVotesMap}
            onPlayerPress={(player) => {
              console.log('🗳️ Player pressed for voting:', player.name);
              onPlayerPress?.(player, 'actual');
            }}
          />
        </View>
      </ScrollView>
      
      {/* Sayfa Göstergeleri (nokta gösterge) */}
      <View style={styles.pageIndicators}>
        {Array.from({ length: fieldCount }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pageIndicator,
              currentIndex === index && styles.pageIndicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  scrollContent: {
    // Her saha ortada durması için padding
    paddingHorizontal: (SCREEN_WIDTH - FIELD_WIDTH) / 2,
  },
  fieldWrapper: {
    width: FIELD_WIDTH,
    alignItems: 'center',
  },
  fieldCard: {
    width: FIELD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  field: {
    width: '100%',
    height: FIELD_HEIGHT,
    position: 'relative',
  },
  fieldLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF',
    top: '50%',
  },
  centerCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -35 }],
  },
  penaltyAreaTop: {
    position: 'absolute',
    width: '55%',
    height: 70,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    top: 0,
    left: '22.5%',
    borderTopWidth: 0,
  },
  penaltyAreaBottom: {
    position: 'absolute',
    width: '55%',
    height: 70,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    bottom: 0,
    left: '22.5%',
    borderBottomWidth: 0,
  },
  goalAreaTop: {
    position: 'absolute',
    width: '28%',
    height: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    top: 0,
    left: '36%',
    borderTopWidth: 0,
  },
  goalAreaBottom: {
    position: 'absolute',
    width: '28%',
    height: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    bottom: 0,
    left: '36%',
    borderBottomWidth: 0,
  },
  playerCard: {
    position: 'absolute',
    alignItems: 'center',
    width: 44,
    backgroundColor: 'rgba(15, 42, 36, 0.85)',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
  },
  playerImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  playerNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(31, 162, 166, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  eventBadgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    gap: 1,
  },
  eventBadgeEmoji: {
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: 2,
  },
  voteBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(31, 162, 166, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveIndicatorSmall: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  formationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.md,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pageIndicatorActive: {
    width: 24,
    backgroundColor: '#1FA2A6',
  },
});
