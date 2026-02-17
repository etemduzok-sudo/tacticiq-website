// MatchPredictionScreen.tsx - React Native FULL COMPLETE VERSION
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formationPositions, formationLabels } from './MatchSquad';
import Animated, { 
  FadeIn,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Path, 
} from 'react-native-svg';
import { Platform } from 'react-native';
import { FocusPrediction, SCORING_CONSTANTS } from '../../types/prediction.types';
import { SCORING, TEXT, STORAGE_KEYS, LEGACY_STORAGE_KEYS, PITCH_LAYOUT } from '../../config/constants';
import { handleError, ErrorType, ErrorSeverity } from '../../utils/GlobalErrorHandler';
import { predictionsDb } from '../../services/databaseService';
import { ConfirmModal, ConfirmButton } from '../ui/ConfirmModal';
import { ANALYSIS_FOCUSES, type AnalysisFocus, type AnalysisFocusType } from '../AnalysisFocusModal';
import { isMockTestMatch, MOCK_MATCH_IDS, getMatch1Start, getMatch2Start, getMockUserTeamId, getMockCommunitySignals } from '../../data/mockTestData';
import { 
  SIGNAL_COLORS, 
  SIGNAL_EMOJIS, 
  SIGNAL_LABELS,
  PlayerSignals,
  PlayerSignal,
  getSignalBorderStyle,
  getDominantSignal,
  SIGNAL_BONUS_POINTS,
  checkSignalConflict,
  MIN_USERS_FOR_PERCENTAGE,
  MIN_USERS_FOR_PERCENTAGE_MOCK,
} from '../../types/signals.types';
import {
  calculatePredictionTiming,
  getMatchPhase,
  getOccurredEvents,
  getTimingBadgeProps,
  TIMING_LABELS,
  type MatchPhase,
  type MatchEvent as TimingMatchEvent,
} from '../../utils/predictionTiming';

// 🌟 Her analiz odağının BİRİNCİL tahmin kategorileri (UI gösterimi için)
// Merkezi mapping: src/config/analysisFocusMapping.ts
// NOT: Tempo hem Orta Saha hem Fiziksel'de birincil (her ikisinde de bonus!)
const FOCUS_CATEGORY_MAPPING: Record<AnalysisFocusType, string[]> = {
  // 🛡️ Savunma: Disiplin, sertlik (kartlar)
  defense: ['yellowCards', 'redCards', 'yellowCard', 'redCard', 'secondYellowRed', 'directRedCard'],
  // ⚔️ Hücum: Gol, skor, bitiricilik
  offense: ['firstHalfHomeScore', 'firstHalfAwayScore', 'secondHalfHomeScore', 'secondHalfAwayScore', 'totalGoals', 'firstGoalTime', 'goal', 'willScore'],
  // 🎯 Orta Saha: Oyun kontrolü, pas, top hakimiyeti
  midfield: ['possession', 'tempo'],
  // 🏃 Fiziksel: Tempo, yorgunluk, değişiklikler (tempo burada da birincil!)
  physical: ['tempo', 'injuredOut', 'injurySubstitutePlayer', 'substitutedOut', 'substitutePlayer'],
  // ♟️ Taktik: Maç planı, senaryo, uzatma tahminleri
  tactical: ['scenario', 'firstHalfInjuryTime', 'secondHalfInjuryTime'],
  // 👤 Oyuncu: MVP, gol, asist
  player: ['manOfTheMatch', 'goal', 'assist', 'willScore', 'willAssist'],
};

// Bir kategorinin hangi odağa ait olduğunu bul
const getCategoryFocus = (category: string): AnalysisFocusType | null => {
  for (const [focusId, categories] of Object.entries(FOCUS_CATEGORY_MAPPING)) {
    if (categories.includes(category)) {
      return focusId as AnalysisFocusType;
    }
  }
  return null;
};

// Oyuncu tahminleri ile ilgili tüm kategoriler (saha yıldızı için)
// Oyuncu odaklı: MVP, gol, asist (birincil) + kart, değişiklik, sakatlanma (ikincil)
const PLAYER_RELATED_CATEGORIES = [
  'manOfTheMatch', 'goal', 'assist', 'willScore', 'willAssist',  // Birincil
  'yellowCard', 'redCard', 'secondYellowRed', 'directRedCard',   // İkincil (kart)
  'substitutedOut', 'injuredOut', 'substitutePlayer', 'injurySubstitutePlayer', // İkincil (değişiklik)
];

// Seçili odağın oyuncu tahminlerini kapsayıp kapsamadığını kontrol et
const doesFocusIncludePlayerPredictions = (focusType: AnalysisFocusType | null): boolean => {
  if (!focusType) return false;
  const focusCategories = FOCUS_CATEGORY_MAPPING[focusType] || [];
  return PLAYER_RELATED_CATEGORIES.some(cat => focusCategories.includes(cat));
};

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

// Web için Slider polyfill
import SliderNative from '@react-native-community/slider';

let Slider: any;
if (Platform.OS === 'web') {
  // Web'de basit bir input range kullan - ince track
  Slider = ({ value, onValueChange, minimumValue, maximumValue, step, minimumTrackTintColor, maximumTrackTintColor, ...props }: any) => {
    const percent = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
    return (
      <input
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step}
        value={value}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 2,
          borderRadius: 1,
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, ${minimumTrackTintColor || '#F59E0B'} 0%, ${minimumTrackTintColor || '#F59E0B'} ${percent}%, ${maximumTrackTintColor || 'rgba(100,116,139,0.1)'} ${percent}%, ${maximumTrackTintColor || 'rgba(100,116,139,0.1)'} 100%)`,
          ...props.style,
        }}
      />
    );
  };
} else {
  Slider = SliderNative;
}

// Kadro ile aynı genişlik hesabı (web'de cap, mobilde tam ekran) – isWeb yukarıda tanımlı
const screenDimensions = Dimensions.get('window');
const width = isWeb ? Math.min(screenDimensions.width, 500) : screenDimensions.width;
const height = screenDimensions.height;

/** API'den gelen tüm kaleci varyantlarını tanı (G, GK, Goalkeeper vb.) */
function isGoalkeeperPlayer(p: { position?: string; pos?: string } | null | undefined): boolean {
  if (!p) return false;
  const pos = (p.position ?? p.pos ?? '') as string;
  if (!pos) return false;
  const lower = pos.toLowerCase();
  return pos === 'GK' || pos === 'G' || lower === 'goalkeeper' || lower.startsWith('goalkeeper');
}

// ✅ Pozisyon isimlerini kısaltmaya çevir (MatchSquad ile uyumlu)
function getPositionAbbreviation(position: string): string {
  if (!position) return '';
  
  const pos = position.toUpperCase().trim();
  
  // Zaten kısaltma ise olduğu gibi döndür
  if (pos.length <= 3 && /^[A-Z]+$/.test(pos)) {
    return pos;
  }
  
  // Tam isimleri kısaltmaya çevir
  const lower = position.toLowerCase();
  
  // Kaleci
  if (lower.includes('goalkeeper') || lower === 'gk' || lower === 'g') {
    return 'GK';
  }
  
  // Savunma
  if (lower.includes('defender') || lower.includes('defence') || lower.includes('defense')) {
    // Spesifik pozisyonları kontrol et
    if (lower.includes('left') && lower.includes('back')) return 'LB';
    if (lower.includes('right') && lower.includes('back')) return 'RB';
    if (lower.includes('centre') || lower.includes('center')) return 'CB';
    if (lower.includes('left') && lower.includes('wing')) return 'LWB';
    if (lower.includes('right') && lower.includes('wing')) return 'RWB';
    return 'DEF'; // Genel savunma
  }
  
  // Orta saha
  if (lower.includes('midfielder') || lower.includes('midfield')) {
    if (lower.includes('defensive')) return 'CDM';
    if (lower.includes('attacking') || lower.includes('attack')) return 'CAM';
    if (lower.includes('left')) return 'LM';
    if (lower.includes('right')) return 'RM';
    if (lower.includes('centre') || lower.includes('center')) return 'CM';
    return 'MID'; // Genel orta saha
  }
  
  // Hücum
  if (lower.includes('attacker') || lower.includes('forward') || lower.includes('striker')) {
    if (lower.includes('left') && lower.includes('wing')) return 'LW';
    if (lower.includes('right') && lower.includes('wing')) return 'RW';
    if (lower.includes('centre') || lower.includes('center') || lower.includes('forward')) return 'CF';
    return 'ST'; // Genel forvet
  }
  
  // Bilinmeyen pozisyonlar için ilk 3 harfi büyük harfle döndür
  return position.substring(0, 3).toUpperCase();
}

interface MatchPredictionScreenProps {
  matchData: any;
  matchId?: string;
  /** İki favori takım maçında hangi takım için tahmin; verilirse tahmin bu takıma özel saklanır. */
  predictionTeamId?: number;
  /** Tahminler kaydedildiğinde çağrılır (MatchDetail'da yıldızı güncellemek için) */
  onPredictionsSaved?: () => void;
  /** İki favori maçta tahmin kaydedildiğinde hangi takım için kaydedildiği (diğer takım teklifi için) */
  onPredictionsSavedForTeam?: (teamId: number) => void;
  /** Analiz odağı – Dashboard/Modal'dan seçildiğinde yıldızlar otomatik işaretlenir */
  initialAnalysisFocus?: AnalysisFocusType | null;
  /** Kaydedilmemiş değişiklik var mı callback'i - MatchDetail tab değiştiğinde sormak için */
  onHasUnsavedChanges?: (hasChanges: boolean, saveFn: () => Promise<void>) => void;
  /** Maç kadrosu (lineups) - yedek oyuncular için */
  lineups?: any[];
  /** Favori takım ID'leri */
  favoriteTeamIds?: number[];
  /** Canlı maç (sadece bilgi (i) ikonu gösterilir, replace/remove yok) */
  isMatchLive?: boolean;
  /** Biten maç */
  isMatchFinished?: boolean;
  /** Kullanıcı bu maç için tahmin yapmış mı (topluluk verileri görünürlüğü için) */
  hasPrediction?: boolean;
}

// Mock Formation Data
const mockFormation = {
  id: '4-3-3',
  name: '4-3-3 (Atak)',
  positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
};

// Mock Players with Full Details
const mockPlayers = [
  { 
    id: 1, 
    name: 'Muslera', 
    position: 'GK', 
    rating: 85, 
    number: 1, 
    form: 92,
    stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40, defending: 25, physical: 78 }
  },
  { 
    id: 5, 
    name: 'Kazımcan', 
    position: 'LB', 
    rating: 78, 
    number: 5, 
    form: 78,
    stats: { pace: 82, shooting: 60, passing: 75, dribbling: 78, defending: 76, physical: 72 }
  },
  { 
    id: 3, 
    name: 'Nelsson', 
    position: 'CB', 
    rating: 80, 
    number: 3, 
    form: 85,
    stats: { pace: 65, shooting: 40, passing: 70, dribbling: 55, defending: 84, physical: 82 }
  },
  { 
    id: 4, 
    name: 'Abdülkerim', 
    position: 'CB', 
    rating: 79, 
    number: 4, 
    form: 82,
    stats: { pace: 70, shooting: 45, passing: 72, dribbling: 60, defending: 83, physical: 80 }
  },
  { 
    id: 2, 
    name: 'Dubois', 
    position: 'RB', 
    rating: 82, 
    number: 2, 
    form: 80,
    stats: { pace: 85, shooting: 65, passing: 78, dribbling: 75, defending: 77, physical: 74 }
  },
  { 
    id: 12, 
    name: 'Oliveira', 
    position: 'CM', 
    rating: 77, 
    number: 8, 
    form: 76,
    stats: { pace: 72, shooting: 70, passing: 80, dribbling: 75, defending: 68, physical: 70 }
  },
  { 
    id: 7, 
    name: 'Sara', 
    position: 'CM', 
    rating: 81, 
    number: 20, 
    form: 84,
    stats: { pace: 78, shooting: 75, passing: 85, dribbling: 82, defending: 72, physical: 76 }
  },
  { 
    id: 15, 
    name: 'Demirbay', 
    position: 'CM', 
    rating: 79, 
    number: 17, 
    form: 85,
    stats: { pace: 70, shooting: 78, passing: 84, dribbling: 76, defending: 65, physical: 68 }
  },
  { 
    id: 8, 
    name: 'Zaha', 
    position: 'LW', 
    rating: 84, 
    number: 14, 
    form: 88,
    stats: { pace: 88, shooting: 82, passing: 78, dribbling: 90, defending: 42, physical: 76 }
  },
  { 
    id: 11, 
    name: 'Icardi', 
    position: 'ST', 
    rating: 85, 
    number: 9, 
    form: 88,
    stats: { pace: 78, shooting: 92, passing: 75, dribbling: 82, defending: 35, physical: 80 }
  },
  { 
    id: 10, 
    name: 'Barış Alper', 
    position: 'RW', 
    rating: 80, 
    number: 7, 
    form: 82,
    stats: { pace: 86, shooting: 78, passing: 75, dribbling: 84, defending: 40, physical: 72 }
  },
];

// Substitute Players (Yedek kadro)
const substitutePlayers = [
  { id: 101, name: 'Günay', position: 'GK', rating: 72, number: 25 },
  { id: 102, name: 'Boey', position: 'RB', rating: 76, number: 93 },
  { id: 103, name: 'Sanchez', position: 'CB', rating: 78, number: 6 },
  { id: 104, name: 'Torreira', position: 'CM', rating: 79, number: 34 },
  { id: 105, name: 'Mertens', position: 'CAM', rating: 80, number: 10 },
  { id: 106, name: 'Tetê', position: 'RW', rating: 77, number: 11 },
  { id: 107, name: 'Batshuayi', position: 'ST', rating: 78, number: 23 },
];

// Tüm takım kadrosu (ilk 11 + yedekler) - oyuncu değişikliği için kullanılır
const allSquadPlayers = [...mockPlayers, ...substitutePlayers];

// Formation Positions
const mockPositions = [
  { x: 50, y: 82 }, // GK - moved higher
  { x: 10, y: 64 }, { x: 35, y: 66 }, { x: 65, y: 66 }, { x: 90, y: 64 }, // Defense - V, wider
  { x: 25, y: 42 }, { x: 50, y: 44 }, { x: 75, y: 42 }, // Midfield - V, wider
  { x: 10, y: 16 }, { x: 50, y: 10 }, { x: 90, y: 16 }, // Attack - V, wider
];

// Football Field Component
const FootballField = ({ children, style }: any) => (
  <View style={[styles.fieldContainer, style]}>
    <LinearGradient
      colors={['#16A34A', '#22C55E', '#16A34A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fieldGradient}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 150" preserveAspectRatio="none" style={styles.fieldSvg}>
        <Rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Circle cx="50" cy="75" r="1" fill="white" opacity="0.15" />
        <Rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Circle cx="50" cy="17.3" r="0.8" fill="white" opacity="0.15" />
        <Rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.4" opacity="0.15" />
        <Circle cx="50" cy="132.7" r="0.8" fill="white" opacity="0.15" />
        <Path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.4" fill="none" opacity="0.15" />
        <Path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.4" fill="none" opacity="0.15" />
        <Path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.4" fill="none" opacity="0.15" />
        <Path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.4" fill="none" opacity="0.15" />
      </Svg>
      {children}
    </LinearGradient>
  </View>
);

export const MatchPrediction: React.FC<MatchPredictionScreenProps> = ({
  matchData,
  matchId,
  predictionTeamId,
  onPredictionsSaved,
  onPredictionsSavedForTeam,
  initialAnalysisFocus,
  onHasUnsavedChanges,
  lineups,
  favoriteTeamIds = [],
  hasPrediction = false,
  isMatchLive = false,
  isMatchFinished = false,
}) => {
  const { width: winW, height: winH } = useWindowDimensions();
  
  // Kadro ile BİREBİR aynı hesaplama (runtime'da)
  const fieldWidth = isWeb ? Math.min(winW, 500) - PITCH_LAYOUT.H_PADDING : winW - PITCH_LAYOUT.H_PADDING;
  const fieldHeight = isWeb 
    ? Math.min(PITCH_LAYOUT.WEB_HEIGHT, Math.max(320, winH - 320))
    : fieldWidth * PITCH_LAYOUT.ASPECT_RATIO;
  
  const fieldDynamicStyle: { width: number; height: number; maxWidth?: number; maxHeight?: number } = {
    width: fieldWidth,
    height: fieldHeight,
  };
  if (isWeb) {
    fieldDynamicStyle.maxWidth = PITCH_LAYOUT.WEB_MAX_WIDTH;
    fieldDynamicStyle.maxHeight = Math.min(PITCH_LAYOUT.WEB_HEIGHT, Math.max(0, winH - 320));
  }

  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [playerPredictions, setPlayerPredictions] = useState<{[key: number]: any}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // ✅ Kaydedilmemiş değişiklik var mı?
  const [initialPredictionsLoaded, setInitialPredictionsLoaded] = useState(false); // ✅ İlk yükleme tamamlandı mı?

  /** Oyuncu tahmin objesinde en az bir gerçek (anlamlı) tahmin var mı? Boş/null/false değerler sayılmaz. */
  const hasAnyRealPlayerPrediction = (preds: Record<string, any> | null | undefined): boolean => {
    if (!preds || typeof preds !== 'object') return false;
    return Object.entries(preds).some(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'boolean') return v === true;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    });
  };
  
  // ✅ İki favori maçta takıma özel anahtarlar
  // ✅ Mock maçlar için de getMockUserTeamId kullan (MatchSquad ile aynı mantık)
  const matchIdNum = React.useMemo(() => (matchId ? (typeof matchId === 'string' ? parseInt(matchId, 10) : matchId) : null), [matchId]);
  const effectivePredictionTeamId = React.useMemo(() => {
    if (predictionTeamId != null) return predictionTeamId;
    if (matchIdNum && isMockTestMatch(matchIdNum)) {
      return getMockUserTeamId(matchIdNum) ?? undefined;
    }
    return undefined;
  }, [matchIdNum, predictionTeamId]);
  
  const squadStorageKey = React.useMemo(
    () => (matchId && effectivePredictionTeamId != null ? `${STORAGE_KEYS.SQUAD}${matchId}-${effectivePredictionTeamId}` : matchId ? `${STORAGE_KEYS.SQUAD}${matchId}` : null),
    [matchId, effectivePredictionTeamId]
  );
  const legacySquadStorageKey = React.useMemo(
    () => (matchId && effectivePredictionTeamId != null ? `${LEGACY_STORAGE_KEYS.SQUAD}${matchId}-${effectivePredictionTeamId}` : matchId ? `${LEGACY_STORAGE_KEYS.SQUAD}${matchId}` : null),
    [matchId, effectivePredictionTeamId]
  );
  // ✅ predictionStorageKey: matchId ve effectivePredictionTeamId kullan (MatchSquad ile tutarlı)
  const predictionStorageKey = React.useMemo(
    () => (matchId && effectivePredictionTeamId != null ? `${STORAGE_KEYS.PREDICTIONS}${matchId}-${effectivePredictionTeamId}` : matchId ? `${STORAGE_KEYS.PREDICTIONS}${matchId}` : null),
    [matchId, effectivePredictionTeamId]
  );

  // ✅ Load attack squad from AsyncStorage
  const [attackPlayersArray, setAttackPlayersArray] = useState<any[]>([]);
  const [allTeamPlayers, setAllTeamPlayers] = useState<any[]>([]); // ✅ Tüm takım kadrosu (yedekler dahil)
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [squadLoaded, setSquadLoaded] = useState(false);
  const [isSquadCompleted, setIsSquadCompleted] = useState(false); // ✅ Tamamla basıldı mı?
  const [isSaving, setIsSaving] = useState(false); // ✅ Kaydetme işlemi devam ediyor mu?
  const [isPredictionLocked, setIsPredictionLocked] = useState(false); // ✅ Tahminler kilitli mi? (kırmızı kilit)
  const [showLockedWarningModal, setShowLockedWarningModal] = useState(false); // ✅ Web için kilitli uyarı modal'ı
  const [showViewOnlyWarningModal, setShowViewOnlyWarningModal] = useState(false); // ✅ İzleme modu uyarı modal'ı
  const [viewOnlyPopupShown, setViewOnlyPopupShown] = useState(false); // ✅ İlk giriş popup gösterildi mi?
  
  // ✅ TOPLULUK VERİLERİ KİLİTLEME SİSTEMİ
  const [hasViewedCommunityData, setHasViewedCommunityData] = useState(false); // ✅ Topluluk verilerini gördü mü? (kalıcı kilit)
  const [showCommunityConfirmModal, setShowCommunityConfirmModal] = useState(false); // ✅ Topluluk verileri görmek için onay modal'ı
  const [independentPredictionBonus, setIndependentPredictionBonus] = useState(true); // ✅ Bağımsız tahmin bonusu aktif mi?
  
  // ✅ OYUNCU BİLGİ POPUP - Web için Alert yerine Modal
  const [playerInfoPopup, setPlayerInfoPopup] = useState<{
    playerName: string;
    position: string;
    rating: number | null;
    userPredictions: string[];
    communityData: {
      totalUsers: number;
      goal: number;
      assist: number;
      yellowCard: number;
      redCard: number;
      substitutedOut: number;
      injuredOut: number;
    } | null;
    showCommunityData: boolean;
  } | null>(null);
  
  // ✅ BÖLÜM TOPLULUK POPUP - Gol/Asist/Kart bölümleri için
  const [sectionInfoPopup, setSectionInfoPopup] = useState<{
    title: string;
    description: string;
    stats: { label: string; value: string; percentage: number }[];
  } | null>(null);
  // ✅ 120 saniyelik timeout kaldırıldı - predictionTimeoutRef artık kullanılmıyor
  
  // 🌟 STRATEGIC FOCUS SYSTEM
  const [selectedAnalysisFocus, setSelectedAnalysisFocus] = useState<AnalysisFocusType | null>(null);
  const [focusedPredictions, setFocusedPredictions] = useState<FocusPrediction[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    buttons: ConfirmButton[];
  } | null>(null);
  
  // ✅ TOPLULUK TAHMİN VERİLERİ (Backend'den gelecek, şimdilik mock)
  // Her oyuncu için topluluk tahmin oranları (0.0 - 1.0)
  const [communityPredictions, setCommunityPredictions] = useState<Record<number, {
    goal: number;          // Gol atar oranı
    assist: number;        // Asist yapar oranı
    yellowCard: number;    // Sarı kart görür oranı
    redCard: number;       // Kırmızı kart görür oranı
    substitutedOut: number; // Oyundan çıkar oranı
    injuredOut: number;    // Sakatlanarak çıkar oranı
    totalPredictions: number; // Kaç kullanıcı tahmin yaptı
  }>>({});
  
  // ✅ TOPLULUK VERİLERİ GÖRÜNÜRLüK KONTROLÜ
  // YENİ KURAL: Topluluk verileri SADECE kullanıcı bilinçli olarak görmek istediğinde görünür
  // 1. Tahmin kaydedildikten sonra kullanıcı "Topluluk Verilerini Gör" butonuna basarsa
  // 2. VEYA maç canlı/bitmiş ise (izleme modu)
  // DİKKAT: hasViewedCommunityData = true ise tüm tahminler KALİCİ KİLİTLİ
  const communityDataVisible = hasViewedCommunityData || isMatchLive || isMatchFinished;
  
  // ✅ TOPLULUK TAHMİN VERİLERİ (Mock - Backend'den gelecek)
  // İzleme modunda bu veriler öntanımlı olarak gösterilecek
  const [communityMatchPredictions] = useState({
    // İlk Yarı Skor
    firstHalf: {
      mostPopularScore: { home: 1, away: 0, percentage: 28 },
      homeLeading: 42,
      awayLeading: 35,
      draw: 23,
      avgHomeGoals: 0.8,
      avgAwayGoals: 0.5,
    },
    // Maç Sonu Skor
    fullTime: {
      mostPopularScore: { home: 2, away: 1, percentage: 18 },
      homeWin: 45,
      awayWin: 27,
      draw: 28,
      avgHomeGoals: 1.8,
      avgAwayGoals: 1.2,
    },
    // Gol Tahminleri
    goals: {
      ranges: [
        { range: '0-2', percentage: 32 },
        { range: '3-4', percentage: 45 },
        { range: '5+', percentage: 23 },
      ],
      avgTotal: 2.8,
      mostPopularFirstGoalTime: '16-30',
      firstGoalTimePercentage: 35,
    },
    // Disiplin
    discipline: {
      yellowCards: [
        { range: '0-3', percentage: 28 },
        { range: '4-6', percentage: 52 },
        { range: '7+', percentage: 20 },
      ],
      avgYellow: 4.2,
      redCardExpected: 15,
    },
    // Top Hakimiyeti
    possession: {
      homeDominant: 38, // 55%+
      balanced: 42, // 45-55%
      awayDominant: 20,
      avgHomePossession: 52,
    },
    // Şut İstatistikleri
    shots: {
      totalRanges: [
        { range: '0-10', percentage: 15 },
        { range: '11-20', percentage: 45 },
        { range: '21-30', percentage: 32 },
        { range: '31+', percentage: 8 },
      ],
      avgTotal: 18,
      onTargetPercentage: 35,
    },
    // Taktik
    tactics: {
      tempo: [
        { type: 'Düşük', percentage: 22 },
        { type: 'Orta', percentage: 48 },
        { type: 'Yüksek', percentage: 30 },
      ],
      mostPopularScenario: 'Dengeli maç',
      scenarioPercentage: 38,
    },
    totalUsers: Math.floor(Math.random() * 3000) + 1500,
  });
  
  // ✅ İZLEME MODUNDA: Topluluk tahminlerini öntanımlı olarak yükle
  const isViewOnlyMode = !hasPrediction && (isMatchLive || isMatchFinished);
  
  // ✅ İZLEME MODU: İlk giriş popup gösterimi
  React.useEffect(() => {
    if (isViewOnlyMode && !viewOnlyPopupShown) {
      const timer = setTimeout(() => {
        setShowViewOnlyWarningModal(true);
        setViewOnlyPopupShown(true);
      }, 500); // Kısa gecikme ile smooth geçiş
      return () => clearTimeout(timer);
    }
  }, [isViewOnlyMode, viewOnlyPopupShown]);
  
  // ✅ TOPLULUK EN POPÜLER TAHMİNLERİ - UI'da işaretlenecek değerler
  const communityTopPredictions = React.useMemo(() => ({
    totalGoals: '3-4', // En popüler toplam gol aralığı
    firstGoalTime: communityMatchPredictions.goals.mostPopularFirstGoalTime,
    yellowCards: '3-4', // En popüler sarı kart aralığı (UI'da 0-2, 3-4, 5-6, 7+)
    redCards: '0', // Çoğu maçta kırmızı kart yok
    totalShots: '11-20', // En popüler şut aralığı
    shotsOnTarget: '6-10', // En popüler isabetli şut (UI'da 0-5, 6-10, 11-15, 16+ var)
    totalCorners: '7-10', // En popüler korner aralığı
    tempo: 'Orta tempo', // En popüler tempo
    scenario: 'Dengeli maç', // En popüler senaryo
    possession: communityMatchPredictions.possession.avgHomePossession,
  }), [communityMatchPredictions]);
  
  React.useEffect(() => {
    // Sadece izleme modunda ve predictions henüz yüklenmemişse
    if (isViewOnlyMode && !initialPredictionsLoaded) {
      console.log('📊 [VIEW_ONLY] Topluluk tahminleri öntanımlı olarak yükleniyor...');
      
      // Topluluk verilerine göre en popüler tahminleri ayarla
      setPredictions(prev => ({
        ...prev,
        // İlk yarı - en popüler skor
        firstHalfHomeScore: communityMatchPredictions.firstHalf.mostPopularScore.home,
        firstHalfAwayScore: communityMatchPredictions.firstHalf.mostPopularScore.away,
        firstHalfInjuryTime: '+3',
        // Maç sonu - ilk yarı + 1 gol ekle
        secondHalfHomeScore: communityMatchPredictions.fullTime.mostPopularScore.home,
        secondHalfAwayScore: communityMatchPredictions.fullTime.mostPopularScore.away,
        secondHalfInjuryTime: '+5',
        // Gol tahminleri
        totalGoals: communityTopPredictions.totalGoals,
        firstGoalTime: communityTopPredictions.firstGoalTime,
        // Disiplin
        yellowCards: communityTopPredictions.yellowCards,
        redCards: communityTopPredictions.redCards,
        // Top hakimiyeti
        possession: String(communityTopPredictions.possession),
        // Şut istatistikleri
        totalShots: communityTopPredictions.totalShots,
        shotsOnTarget: communityTopPredictions.shotsOnTarget,
        totalCorners: communityTopPredictions.totalCorners,
        // Taktik
        tempo: communityTopPredictions.tempo,
        scenario: communityTopPredictions.scenario,
      }));
      
      setInitialPredictionsLoaded(true);
    }
  }, [isViewOnlyMode, initialPredictionsLoaded, communityMatchPredictions, communityTopPredictions]);
  
  // ✅ MAÇ DURUMU VE TIMING SİSTEMİ
  // Maç phase'i ve gerçekleşen olayları hesapla (predictionTiming.ts kullanarak)
  const matchPhase = useMemo<MatchPhase>(() => {
    const status = matchData?.status || matchData?.fixture?.status?.short || 'NS';
    const elapsed = matchData?.fixture?.status?.elapsed || null;
    return getMatchPhase(status, elapsed);
  }, [matchData?.status, matchData?.fixture?.status?.short, matchData?.fixture?.status?.elapsed]);
  
  // ✅ Gerçekleşen olayları takip et (mock veya API'den)
  const [occurredEvents, setOccurredEvents] = useState<TimingMatchEvent[]>([]);
  
  // ✅ Maç olaylarını izle ve güncelle
  React.useEffect(() => {
    if (!isMatchLive && !isMatchFinished) {
      setOccurredEvents([]);
      return;
    }
    
    // Mock maçlar için olayları simüle et
    const matchIdNum = matchId ? Number(matchId) : null;
    if (matchIdNum && isMockTestMatch(matchIdNum)) {
      const mockEvents: { type: string; detail?: string }[] = [];
      // Mock eventleri oluştur (gerçek API'den gelecek)
      const events = getOccurredEvents(mockEvents, matchPhase);
      setOccurredEvents(events);
    } else {
      // Gerçek maçlar için matchData.events kullan
      const realEvents = matchData?.events || [];
      const events = getOccurredEvents(realEvents.map((e: any) => ({
        type: e.type || '',
        detail: e.detail || '',
      })), matchPhase);
      setOccurredEvents(events);
    }
  }, [matchPhase, isMatchLive, isMatchFinished, matchId, matchData?.events]);
  
  // ✅ Tahmin kategorisi için timing badge bilgisi al
  const getTimingInfo = React.useCallback((category: string) => {
    return getTimingBadgeProps(category, matchPhase, occurredEvents);
  }, [matchPhase, occurredEvents]);
  
  // ✅ GERÇEK MAÇ SONUÇLARI (Tahmin doğruluk kontrolü için)
  // Maç canlı veya bitmişse gerçek sonuçları takip et
  const [actualResults, setActualResults] = useState<{
    // Skor tahminleri
    firstHalfHomeScore: number | null;
    firstHalfAwayScore: number | null;
    secondHalfHomeScore: number | null;
    secondHalfAwayScore: number | null;
    fullTimeHomeScore: number | null;
    fullTimeAwayScore: number | null;
    // Kart ve gol istatistikleri
    totalYellowCards: number | null;
    totalRedCards: number | null;
    totalGoals: number | null;
    firstGoalMinute: number | null;
    // Oyuncu bazlı sonuçlar
    playerEvents: Record<number, {
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      substitutedOut: boolean;
      substituteMinute: number | null;
    }>;
  }>({
    firstHalfHomeScore: null,
    firstHalfAwayScore: null,
    secondHalfHomeScore: null,
    secondHalfAwayScore: null,
    fullTimeHomeScore: null,
    fullTimeAwayScore: null,
    totalYellowCards: null,
    totalRedCards: null,
    totalGoals: null,
    firstGoalMinute: null,
    playerEvents: {},
  });
  
  // ✅ Gerçek sonuçları güncelle (maç canlı veya bitmişse)
  React.useEffect(() => {
    if (!isMatchLive && !isMatchFinished) return;
    
    // Mock maçlar için sonuçları simüle et
    const matchIdNum = matchId ? Number(matchId) : null;
    if (matchIdNum && isMockTestMatch(matchIdNum)) {
      // Mock sonuçlar - gerçek API'den gelecek
      const mockResults = {
        firstHalfHomeScore: matchPhase !== 'first_half' && matchPhase !== 'not_started' ? 1 : null,
        firstHalfAwayScore: matchPhase !== 'first_half' && matchPhase !== 'not_started' ? 0 : null,
        secondHalfHomeScore: isMatchFinished ? 2 : null,
        secondHalfAwayScore: isMatchFinished ? 1 : null,
        fullTimeHomeScore: isMatchFinished ? 3 : null,
        fullTimeAwayScore: isMatchFinished ? 1 : null,
        totalYellowCards: isMatchFinished ? 4 : null,
        totalRedCards: isMatchFinished ? 0 : null,
        totalGoals: isMatchFinished ? 4 : null,
        firstGoalMinute: 23,
        playerEvents: {},
      };
      setActualResults(mockResults);
    } else {
      // Gerçek maç - matchData'dan al
      const homeScore = matchData?.goals?.home ?? matchData?.score?.home ?? null;
      const awayScore = matchData?.goals?.away ?? matchData?.score?.away ?? null;
      const htHome = matchData?.score?.halftime?.home ?? null;
      const htAway = matchData?.score?.halftime?.away ?? null;
      
      setActualResults({
        firstHalfHomeScore: htHome,
        firstHalfAwayScore: htAway,
        secondHalfHomeScore: homeScore !== null && htHome !== null ? homeScore - htHome : null,
        secondHalfAwayScore: awayScore !== null && htAway !== null ? awayScore - htAway : null,
        fullTimeHomeScore: homeScore,
        fullTimeAwayScore: awayScore,
        totalYellowCards: null, // API'den çekilecek
        totalRedCards: null,
        totalGoals: homeScore !== null && awayScore !== null ? homeScore + awayScore : null,
        firstGoalMinute: null,
        playerEvents: {},
      });
    }
  }, [matchPhase, isMatchLive, isMatchFinished, matchId, matchData]);
  
  // ✅ Tahmin doğruluğunu kontrol et
  const checkPredictionAccuracy = React.useCallback((category: string, predictedValue: any): { isCorrect: boolean | null; actualValue: any } => {
    if (!isMatchLive && !isMatchFinished) {
      return { isCorrect: null, actualValue: null };
    }
    
    let actualValue: any = null;
    let isCorrect: boolean | null = null;
    
    switch (category) {
      case 'firstHalfHomeScore':
        actualValue = actualResults.firstHalfHomeScore;
        if (actualValue !== null) {
          isCorrect = Number(predictedValue) === actualValue;
        }
        break;
      case 'firstHalfAwayScore':
        actualValue = actualResults.firstHalfAwayScore;
        if (actualValue !== null) {
          isCorrect = Number(predictedValue) === actualValue;
        }
        break;
      case 'totalGoals':
        actualValue = actualResults.totalGoals;
        if (actualValue !== null && predictedValue) {
          // Range kontrolü: '0-1 gol', '2-3 gol', '4-5 gol', '6+ gol'
          const ranges: Record<string, [number, number]> = {
            '0-1 gol': [0, 1],
            '2-3 gol': [2, 3],
            '4-5 gol': [4, 5],
            '6+ gol': [6, 100],
          };
          const range = ranges[predictedValue];
          if (range) {
            isCorrect = actualValue >= range[0] && actualValue <= range[1];
          }
        }
        break;
      // Diğer kategoriler için benzer kontroller eklenebilir
      default:
        break;
    }
    
    return { isCorrect, actualValue };
  }, [actualResults, isMatchLive, isMatchFinished]);
  
  // ✅ Tahmin karşılaştırma popup state'i
  const [comparisonModal, setComparisonModal] = useState<{
    category: string;
    categoryLabel: string;
    predicted: any;
    actual: any;
    isCorrect: boolean;
  } | null>(null);
  
  // ✅ CANLI MAÇ SİNYALLERİ (Community Signals)
  // Sadece canlı maçlarda aktif - her oyuncu için sinyal verileri
  const [liveSignals, setLiveSignals] = useState<Record<number, PlayerSignals>>({});
  
  // ✅ Sinyal detay popup state'i
  const [signalPopupPlayer, setSignalPopupPlayer] = useState<{
    playerId: number;
    playerName: string;
    positionLabel: string;
    signals: PlayerSignals | null;
  } | null>(null);
  // ✅ Sinyal için "Katıl / Kendi tahminim" nested modal (ör. Kırmızı kart görecek tıklanınca)
  const [signalJoinModal, setSignalJoinModal] = useState<{
    signal: PlayerSignal;
    signalLabel: string;
  } | null>(null);
  const [ownPredictionNote, setOwnPredictionNote] = useState('');
  
  // ✅ Topluluk verilerini yükle (mock - backend hazır olunca API'den çekilecek)
  React.useEffect(() => {
    if (!attackPlayersArray || attackPlayersArray.length === 0) return;
    
    // Mock community data - her oyuncu için rastgele oranlar
    const mockCommunity: Record<number, any> = {};
    attackPlayersArray.forEach((player: any) => {
      // Forvet/hücumcular için gol/asist oranı yüksek
      const isForward = ['ST', 'CF', 'LW', 'RW', 'SS'].includes(player.position?.toUpperCase()) || 
                        player.position?.toLowerCase().includes('forward') ||
                        player.position?.toLowerCase().includes('striker');
      // Orta saha için asist oranı yüksek
      const isMidfielder = ['CAM', 'CM', 'CDM', 'RM', 'LM', 'AM'].includes(player.position?.toUpperCase()) ||
                           player.position?.toLowerCase().includes('midfield');
      // Defans için kart oranı yüksek
      const isDefender = ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(player.position?.toUpperCase()) ||
                         player.position?.toLowerCase().includes('back') ||
                         player.position?.toLowerCase().includes('defender');
      
      mockCommunity[player.id] = {
        goal: isForward ? 0.15 + Math.random() * 0.35 : isMidfielder ? 0.05 + Math.random() * 0.15 : Math.random() * 0.08,
        assist: isForward ? 0.10 + Math.random() * 0.20 : isMidfielder ? 0.15 + Math.random() * 0.25 : Math.random() * 0.10,
        yellowCard: isDefender ? 0.15 + Math.random() * 0.25 : isMidfielder ? 0.10 + Math.random() * 0.15 : Math.random() * 0.12,
        redCard: Math.random() * 0.08,
        substitutedOut: 0.15 + Math.random() * 0.25, // Herkes için benzer
        injuredOut: Math.random() * 0.05,
        totalPredictions: Math.floor(50 + Math.random() * 200),
      };
    });
    setCommunityPredictions(mockCommunity);
  }, [attackPlayersArray]);
  
  // ✅ Canlı maç sinyallerini yükle (sadece canlı maçlarda)
  React.useEffect(() => {
    if (!isMatchLive || !attackPlayersArray || attackPlayersArray.length === 0) {
      setLiveSignals({});
      return;
    }
    
    // Mock sinyal verileri oluştur
    const signalsMap: Record<number, PlayerSignals> = {};
    attackPlayersArray.forEach((player: any) => {
      const isGoalkeeper = player.position?.toUpperCase() === 'GK' || 
                           player.position?.toLowerCase().includes('goalkeeper');
      const teamId = predictionTeamId || 611; // Default FB
      
      signalsMap[player.id] = getMockCommunitySignals(
        player.id,
        player.name,
        isGoalkeeper,
        teamId,
        45 // Mock dakika
      );
    });
    setLiveSignals(signalsMap);
    
    // Her 30 saniyede güncelle (canlı maç simülasyonu)
    const interval = setInterval(() => {
      const updatedSignals: Record<number, PlayerSignals> = {};
      attackPlayersArray.forEach((player: any) => {
        const isGoalkeeper = player.position?.toUpperCase() === 'GK' || 
                             player.position?.toLowerCase().includes('goalkeeper');
        const teamId = predictionTeamId || 611;
        
        updatedSignals[player.id] = getMockCommunitySignals(
          player.id,
          player.name,
          isGoalkeeper,
          teamId,
          45
        );
      });
      setLiveSignals(updatedSignals);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isMatchLive, attackPlayersArray, predictionTeamId]);
  
  // ✅ Topluluk oranına göre çerçeve kalınlığı hesapla (0-4)
  const getCommunityBorderWidth = (rate: number): number => {
    if (rate < 0.10) return 0;      // %10 altı: çerçeve yok
    if (rate < 0.20) return 1;      // %10-20: ince
    if (rate < 0.35) return 2;      // %20-35: orta
    if (rate < 0.50) return 3;      // %35-50: kalın
    return 4;                        // %50+: çok kalın
  };
  
  // ✅ Topluluk tahminlerine göre en baskın renk ve kalınlık hesapla
  const getCommunityBorderStyle = (playerId: number): { color: string; width: number; type: string } | null => {
    const community = communityPredictions[playerId];
    if (!community) return null;
    
    // Renk öncelikleri ve eşikleri
    const predictions = [
      { type: 'goal', rate: community.goal, color: '#10B981', minThreshold: 0.10 },        // Yeşil - Gol
      { type: 'assist', rate: community.assist, color: '#3B82F6', minThreshold: 0.10 },    // Mavi - Asist
      { type: 'yellowCard', rate: community.yellowCard, color: '#F59E0B', minThreshold: 0.15 }, // Sarı - Sarı kart
      { type: 'redCard', rate: community.redCard, color: '#EF4444', minThreshold: 0.05 },  // Kırmızı - Kırmızı kart
      { type: 'substitutedOut', rate: community.substitutedOut, color: '#F97316', minThreshold: 0.20 }, // Turuncu - Değişiklik
      { type: 'injuredOut', rate: community.injuredOut, color: '#8B5CF6', minThreshold: 0.03 }, // Mor - Sakatlık
    ];
    
    // En yüksek orana sahip tahmini bul (eşik üzerindeyse)
    const validPredictions = predictions.filter(p => p.rate >= p.minThreshold);
    if (validPredictions.length === 0) return null;
    
    const topPrediction = validPredictions.reduce((max, p) => p.rate > max.rate ? p : max, validPredictions[0]);
    const width = getCommunityBorderWidth(topPrediction.rate);
    
    if (width === 0) return null;
    
    return {
      color: topPrediction.color,
      width: width,
      type: topPrediction.type,
    };
  };
  
  // Load squad data on mount – Atak 11 tamamsa yükle (defans formasyonu değişince isCompleted false olsa da tahminler kaybolmasın)
  React.useEffect(() => {
    const loadSquad = async () => {
      try {
        const key = squadStorageKey;
        if (!key) { setSquadLoaded(true); return; }
        
        // ✅ Önce normal key'i kontrol et
        let squadData = await AsyncStorage.getItem(key);
        
        // ✅ Eğer bulunamazsa legacy key'i de kontrol et
        if (!squadData && legacySquadStorageKey) {
          squadData = await AsyncStorage.getItem(legacySquadStorageKey);
        }
        
        if (squadData) {
          const parsed = JSON.parse(squadData);
          let arr: any[] = [];
          if (parsed.attackPlayersArray && Array.isArray(parsed.attackPlayersArray) && parsed.attackPlayersArray.length >= 11) {
            arr = parsed.attackPlayersArray;
          } else if (parsed.attackPlayers && typeof parsed.attackPlayers === 'object') {
            arr = Object.values(parsed.attackPlayers).filter(Boolean);
          }
          // ✅ Atak kadrosu 11 ise yükle - isCompleted kontrolü yapma, sadece 11 oyuncu varsa göster
          if (arr.length >= 11 && parsed.attackFormation) {
            console.log('✅ [MatchPrediction] Kadro yüklendi:', arr.length, 'oyuncu, formasyon:', parsed.attackFormation);
            setAttackPlayersArray(arr);
            setAttackFormation(parsed.attackFormation || null);
            // ✅ isCompleted kontrolü yapma - 11 oyuncu varsa kadro tamamlanmış sayılır
            setIsSquadCompleted(true);
            // ✅ Tüm takım kadrosunu yükle (yedek oyuncu seçimi için)
            if (parsed.allTeamPlayers && Array.isArray(parsed.allTeamPlayers)) {
              setAllTeamPlayers(parsed.allTeamPlayers);
            }
          } else {
            console.log('⚠️ [MatchPrediction] Kadro yüklenemedi - yetersiz oyuncu veya formasyon yok:', { 
              oyuncuSayisi: arr.length, 
              formasyon: parsed.attackFormation,
              key 
            });
          }
          setSquadLoaded(true);
        } else {
          console.log('⚠️ [MatchPrediction] Kadro bulunamadı:', { key, legacyKey: legacySquadStorageKey });
          setSquadLoaded(true);
        }
      } catch (error) {
        console.error('❌ [MatchPrediction] Error loading squad:', error);
        setSquadLoaded(true);
      }
    };
    loadSquad();
  }, [squadStorageKey, legacySquadStorageKey]);

  // ✅ Yedek oyuncuları hesapla (tüm kadro - ilk 11)
  const reserveTeamPlayers = React.useMemo(() => {
    // İlk 11'deki oyuncu ID'leri
    const startingXIIds = new Set(attackPlayersArray.map(p => p.id));
    
    // 1. Önce AsyncStorage'dan gelen allTeamPlayers'ı dene
    if (allTeamPlayers.length > 0) {
      return allTeamPlayers.filter(p => !startingXIIds.has(p.id));
    }
    
    // 2. allTeamPlayers yoksa lineups'tan yedekleri çıkar
    // ✅ effectivePredictionTeamId kullan (mock maçlar için de doğru takımı bul)
    const resolvedTeamId = effectivePredictionTeamId ?? predictionTeamId;
    if (lineups && lineups.length > 0 && resolvedTeamId) {
      // Tahmin yapılan takımın lineup'ını bul
      const teamLineup = lineups.find((lineup: any) => lineup.team?.id === resolvedTeamId);
      
      if (teamLineup?.substitutes) {
        return teamLineup.substitutes.map((item: any) => {
          const player = item.player || item;
          return {
            id: player.id,
            name: player.name,
            position: player.pos || player.position,
            rating: player.rating || 70,
            number: player.number,
            teamId: predictionTeamId,
          };
        });
      }
    }
    
    // 3. Eğer predictionTeamId yoksa, ilk lineup'tan yedekleri al (favoriteTeamIds'e göre)
    if (lineups && lineups.length > 0 && favoriteTeamIds.length > 0) {
      // Önce ev sahibi favori mi kontrol et
      const homeLineup = lineups.find((lineup: any, index: number) => index === 0);
      const awayLineup = lineups.find((lineup: any, index: number) => index === 1);
      
      const targetLineup = 
        homeLineup?.team?.id && favoriteTeamIds.includes(homeLineup.team.id) ? homeLineup :
        awayLineup?.team?.id && favoriteTeamIds.includes(awayLineup.team.id) ? awayLineup :
        homeLineup;
      
      if (targetLineup?.substitutes) {
        return targetLineup.substitutes.map((item: any) => {
          const player = item.player || item;
          return {
            id: player.id,
            name: player.name,
            position: player.pos || player.position,
            rating: player.rating || 70,
            number: player.number,
            teamId: targetLineup.team?.id,
          };
        });
      }
    }
    
    return [];
  }, [allTeamPlayers, attackPlayersArray, lineups, predictionTeamId, favoriteTeamIds]);

  React.useEffect(() => {
    if (__DEV__) console.log('📌 MatchPrediction mounted (build: focus+confirm+tamamla-fix)');
  }, []);

  // Match predictions state - COMPLETE (skorlar varsayılan 0-0)
  const [predictions, setPredictions] = useState({
    firstHalfHomeScore: 0 as number | null,
    firstHalfAwayScore: 0 as number | null,
    firstHalfInjuryTime: null as string | null,
    secondHalfHomeScore: 0 as number | null,
    secondHalfAwayScore: 0 as number | null,
    secondHalfInjuryTime: null as string | null,
    totalGoals: null as string | null,
    firstGoalTime: null as string | null,
    yellowCards: null as string | null,
    redCards: null as string | null,
    possession: '50' as string,
    totalShots: null as string | null,
    shotsOnTarget: null as string | null,
    totalCorners: null as string | null,
    tempo: null as string | null,
    scenario: null as string | null,
  });

  // ✅ Tahminleri storage'dan yükle (tekrar maça girildiğinde; iki favori maçta takıma özel anahtar)
  React.useEffect(() => {
    if (!predictionStorageKey) return;
    const load = async () => {
      try {
        const altKey = predictionTeamId != null ? `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchData?.id}-${predictionTeamId}` : `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
        const data = await AsyncStorage.getItem(predictionStorageKey) || await AsyncStorage.getItem(altKey);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.matchPredictions) {
          const loaded = parsed.matchPredictions as Record<string, unknown>;
          setPredictions(prev => ({
            ...prev,
            ...loaded,
            firstHalfHomeScore: loaded.firstHalfHomeScore != null ? (loaded.firstHalfHomeScore as number) : 0,
            firstHalfAwayScore: loaded.firstHalfAwayScore != null ? (loaded.firstHalfAwayScore as number) : 0,
            secondHalfHomeScore: loaded.secondHalfHomeScore != null ? (loaded.secondHalfHomeScore as number) : 0,
            secondHalfAwayScore: loaded.secondHalfAwayScore != null ? (loaded.secondHalfAwayScore as number) : 0,
          }));
        }
        if (parsed.playerPredictions && typeof parsed.playerPredictions === 'object') setPlayerPredictions(parsed.playerPredictions);
        if (Array.isArray(parsed.focusedPredictions)) setFocusedPredictions(parsed.focusedPredictions);
        if (parsed.selectedAnalysisFocus) setSelectedAnalysisFocus(parsed.selectedAnalysisFocus);
        // ✅ Tahmin kilidi durumunu yükle
        // Kullanıcı manuel olarak kilidi açmadığı sürece, kaydedilmiş tahminler kilitli kalmalı
        // AsyncStorage'da isPredictionLocked değeri varsa onu kullan (kullanıcı manuel olarak değiştirmişse)
        // Eğer isPredictionLocked belirtilmemişse ama tahminler varsa, varsayılan olarak kilitli yap
        const hasPredictions = (parsed.matchPredictions && Object.values(parsed.matchPredictions).some(v => v !== null)) || 
                               (parsed.playerPredictions && Object.keys(parsed.playerPredictions).length > 0);
        
        if (parsed.isPredictionLocked !== undefined) {
          // ✅ AsyncStorage'da açıkça belirtilmişse onu kullan (kullanıcı manuel olarak değiştirmiş)
          setIsPredictionLocked(parsed.isPredictionLocked === true);
        } else if (hasPredictions) {
          // ✅ Tahminler varsa ama kilit durumu belirtilmemişse, varsayılan olarak kilitli yap
          // Bu durumda AsyncStorage'a da kaydet ki bir sonraki girişte kilitli gelsin
          setIsPredictionLocked(true);
          // AsyncStorage'a kilit durumunu kaydet
          try {
            parsed.isPredictionLocked = true;
            await AsyncStorage.setItem(predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`, JSON.stringify(parsed));
          } catch (e) {
            console.warn('Kilit durumu kaydedilemedi:', e);
          }
        } else {
          // Tahmin yoksa kilitli değil
          setIsPredictionLocked(false);
        }
        
        // ✅ TOPLULUK VERİLERİ KİLİTLEME - hasViewedCommunityData yükle
        // Bu değer true ise kullanıcı topluluk verilerini görmüş demek, tahminleri kalıcı kilitli
        if (parsed.hasViewedCommunityData !== undefined) {
          setHasViewedCommunityData(parsed.hasViewedCommunityData === true);
          // Eğer topluluk verilerini gördüyse, bağımsız tahmin bonusu yok
          if (parsed.hasViewedCommunityData === true) {
            setIndependentPredictionBonus(false);
          }
        }
        // ✅ İlk yükleme tamamlandı - artık değişiklikleri takip edebiliriz
        setTimeout(() => setInitialPredictionsLoaded(true), 100);
      } catch (_) {
        setInitialPredictionsLoaded(true);
      }
    };
    load();
  }, [predictionStorageKey, matchData?.id, predictionTeamId]);

  // ✅ Analiz odağına göre yıldızlar işaretlensin – Dashboard/Modal'dan gelen focus kullanılır
  React.useEffect(() => {
    if (initialAnalysisFocus) {
      setSelectedAnalysisFocus(initialAnalysisFocus);
    }
  }, [initialAnalysisFocus]);

  // ✅ İlk yarı ve maç sonu skorları seçildiğinde toplam golü otomatik hesapla
  React.useEffect(() => {
    // Eğer tahminler kilitliyse veya ilk yükleme tamamlanmamışsa, otomatik güncelleme yapma
    if (isPredictionLocked || !initialPredictionsLoaded) return;
    
    // Maç sonu skorları kontrol et
    const hasFullTimeScore = predictions.secondHalfHomeScore !== null && predictions.secondHalfAwayScore !== null;
    
    if (hasFullTimeScore) {
      // Maç sonu skorlarından toplam golü hesapla
      const home = predictions.secondHalfHomeScore ?? 0;
      const away = predictions.secondHalfAwayScore ?? 0;
      const sum = home + away;
      
      let calculatedRange: string | null = null;
      if (sum <= 1) calculatedRange = '0-1 gol';
      else if (sum <= 3) calculatedRange = '2-3 gol';
      else if (sum <= 5) calculatedRange = '4-5 gol';
      else calculatedRange = '6+ gol';
      
      // Otomatik hesaplanan değeri kontrol et
      const derivedValue = getDerivedTotalGoals();
      
      // Eğer kullanıcı manuel olarak toplam gol seçmemişse (null ise) veya 
      // mevcut değer otomatik hesaplanan değerle eşleşiyorsa, otomatik güncelle
      if (predictions.totalGoals === null || predictions.totalGoals === derivedValue) {
        setPredictions(prev => {
          // Eğer zaten aynı değerse güncelleme yapma (sonsuz döngüyü önle)
          if (prev.totalGoals === calculatedRange) return prev;
          return {
            ...prev,
            totalGoals: calculatedRange
          };
        });
        setHasUnsavedChanges(true);
      }
    }
    // Skorlar boşsa: Kullanıcı manuel seçim yapabilir, otomatik temizleme yapma
  }, [predictions.secondHalfHomeScore, predictions.secondHalfAwayScore, isPredictionLocked, initialPredictionsLoaded]);

  const handlePlayerPredictionChange = (category: string, value: string | boolean) => {
    if (!selectedPlayer) return;
    
    // ✅ TOPLULUK VERİLERİ GÖRÜLDÜYse TÜM TAHMİNLER KALİCİ KİLİTLİ
    if (hasViewedCommunityData) {
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Tahminler kilitliyse ama topluluk verilerini görmemişse:
    // Oyuncu tahminleri analiz odağında değilse kilitli
    if (isPredictionLocked && !isMatchLive && !isMatchFinished) {
      // Oyuncu tahmin kategorisini belirle
      const playerCategory = `player_${category}`; // örn: player_willScore, player_willAssist
      const isInAnalysisFocus = isCategoryInSelectedFocus(playerCategory) || isCategoryInSelectedFocus(category);
      if (!isInAnalysisFocus) {
        setShowLockedWarningModal(true);
        return;
      }
    } else if (isPredictionLocked) {
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Değişiklik yapıldı - kaydedilmemiş değişiklik var
    if (initialPredictionsLoaded) setHasUnsavedChanges(true);
    
    setPlayerPredictions(prev => {
      const currentPredictions = prev[selectedPlayer.id] ?? prev[String(selectedPlayer.id)] ?? {};
      const newPredictions = {
        ...currentPredictions,
        [category]: currentPredictions[category] === value ? null : value
      };
      
      // ✅ Gol sayısı seçildiğinde otomatik olarak "Gol Atar" da aktif olsun
      if (category === 'goalCount' && value) {
        newPredictions.willScore = true;
      }
      // ✅ "Gol Atar" kapatılırsa gol sayısı da sıfırlansın
      if (category === 'willScore' && currentPredictions.willScore === true) {
        newPredictions.goalCount = null;
      }
      
      // ✅ Asist sayısı seçildiğinde otomatik olarak "Asist Yapar" da aktif olsun
      if (category === 'assistCount' && value) {
        newPredictions.willAssist = true;
      }
      // ✅ "Asist Yapar" kapatılırsa asist sayısı da sıfırlansın
      if (category === 'willAssist' && currentPredictions.willAssist === true) {
        newPredictions.assistCount = null;
      }
      
      // ✅ 2. Sarıdan Kırmızı seçilirse, otomatik Sarı Kart da seçilsin
      if (category === 'secondYellowRed' && value === true) {
        newPredictions.yellowCard = true;
        newPredictions.directRedCard = null; // Direkt kırmızı ile aynı anda seçilemez
      }
      // ✅ Direkt Kırmızı seçilirse, 2. Sarıdan Kırmızı sönsün
      if (category === 'directRedCard' && value === true) {
        newPredictions.secondYellowRed = null;
      }
      // ✅ Oyundan Çıkar seçilirse, Sakatlanarak Çıkar sönsün (karşılıklı dışlama)
      if (category === 'substitutedOut' && value === true) {
        newPredictions.injuredOut = null;
        newPredictions.injurySubstitutePlayer = null;
        newPredictions.injurySubstituteMinute = null;
      }
      // ✅ Sakatlanarak Çıkar seçilirse, Oyundan Çıkar sönsün (karşılıklı dışlama)
      if (category === 'injuredOut' && value === true) {
        newPredictions.substitutedOut = null;
        newPredictions.substitutePlayer = null;
        newPredictions.substituteMinute = null;
      }
      
      return {
        ...prev,
        [selectedPlayer.id]: newPredictions
      };
    });
  };

  const handleSavePredictions = async () => {
    if (isSaving) return; // Zaten kaydediliyor, tekrar basılmasın
    
    try {
      // ✅ YENİ KURAL: 120 saniyelik kısıtlama kaldırıldı
      // Tahminler maç boyunca yapılabilir, sadece puan etkisi değişir (predictionTiming.ts)
      // Maç bittikten sonra da tahmin yapılabilir (çok düşük puan ile)
      
      // Check if at least some predictions are made
      const hasMatchPredictions = Object.values(predictions).some(v => v !== null);
      const cleanedPlayerPredictions = Object.fromEntries(
        Object.entries(playerPredictions).filter(([, predData]) => hasAnyRealPlayerPrediction(predData))
      );
      const hasPlayerPredictions = Object.keys(cleanedPlayerPredictions).length > 0;

      if (!hasMatchPredictions && !hasPlayerPredictions) {
        Alert.alert('Uyarı!', 'Lütfen en az bir tahmin yapın.');
        return;
      }
      
      setIsSaving(true); // ✅ Kaydetme başladı

      // Toplam gol: kullanıcı elle seçmediyse maç sonu skorundan türetilen değer kullanılır
      const matchPredictionsToSave = {
        ...predictions,
        totalGoals: predictions.totalGoals ?? (() => {
          const h = predictions.secondHalfHomeScore ?? 0;
          const a = predictions.secondHalfAwayScore ?? 0;
          if (predictions.secondHalfHomeScore === null && predictions.secondHalfAwayScore === null) return null;
          const sum = h + a;
          if (sum <= 1) return '0-1 gol';
          if (sum <= 3) return '2-3 gol';
          if (sum <= 5) return '4-5 gol';
          return '6+ gol';
        })(),
      };

      // Prepare prediction data (boş oyuncu tahminleri kaydedilmez)
      const predictionData = {
        matchId: matchData.id,
        matchPredictions: matchPredictionsToSave,
        playerPredictions: cleanedPlayerPredictions,
        focusedPredictions: focusedPredictions, // 🌟 Strategic Focus
        selectedAnalysisFocus: selectedAnalysisFocus, // 🎯 Seçilen analiz odağı
        isPredictionLocked: true, // ✅ Kaydedildi = kilitli
        hasViewedCommunityData: hasViewedCommunityData, // ✅ Topluluk verileri görüldü mü?
        independentPredictionBonus: !hasViewedCommunityData, // ✅ Bağımsız tahmin bonusu (+%10)
        timestamp: new Date().toISOString(),
      };
      
      // 💾 SAVE TO ASYNCSTORAGE (Local backup) – takıma özel anahtar kullan (iki favori maç)
      const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(predictionData));
      setPlayerPredictions(cleanedPlayerPredictions);
      
      // 🗄️ SAVE TO SUPABASE (Database)
      try {
        // Get user ID from AsyncStorage
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id || 'anonymous';

        // Save each prediction to database
        const predictionPromises: Promise<any>[] = [];

        // Save match predictions (toplam gol dahil efektif değerler)
        Object.entries(matchPredictionsToSave).forEach(([type, value]) => {
          if (value !== null && value !== undefined) {
            predictionPromises.push(
              predictionsDb.createPrediction({
                user_id: userId,
                match_id: String(matchData.id),
                prediction_type: type,
                prediction_value: value,
              })
            );
          }
        });

        // Save player predictions (sadece anlamlı tahminleri kaydet)
        Object.entries(cleanedPlayerPredictions).forEach(([playerId, predData]) => {
          Object.entries(predData).forEach(([type, value]) => {
            if (value !== null && value !== undefined) {
              predictionPromises.push(
                predictionsDb.createPrediction({
                  user_id: userId,
                  match_id: String(matchData.id),
                  prediction_type: `player_${playerId}_${type}`,
                  prediction_value: value,
                })
              );
            }
          });
        });

        // Save focus and training metadata
        if (focusedPredictions.length > 0) {
          predictionPromises.push(
            predictionsDb.createPrediction({
              user_id: userId,
              match_id: String(matchData.id),
              prediction_type: 'focused_predictions',
              prediction_value: focusedPredictions,
            })
          );
        }


        // Execute all database saves with timeout (5 saniye)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        );
        
        try {
          const results = await Promise.race([
            Promise.allSettled(predictionPromises),
            timeoutPromise
          ]) as PromiseSettledResult<any>[];
          
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failCount = results.filter(r => r.status === 'rejected').length;
          console.log(`✅ Predictions saved: ${successCount} success, ${failCount} failed`);
        } catch (timeoutErr) {
          console.warn('⚠️ Database save timed out, but local backup is available');
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        // Continue even if database save fails (we have local backup)
      }
      
      setIsSaving(false); // ✅ Kaydetme tamamlandı
      setHasUnsavedChanges(false); // ✅ Değişiklikler kaydedildi
      setIsPredictionLocked(true); // ✅ Tahminler kaydedildi, kilitle (kırmızı kilit)
      
      // ✅ TOPLULUK VERİLERİ MODAL - Kayıt sonrası kullanıcıya sor
      // Eğer daha önce topluluk verilerini görmemişse, görmek isteyip istemediğini sor
      if (!hasViewedCommunityData) {
        setShowCommunityConfirmModal(true);
      } else {
        // Zaten görmüşse, normal mesaj göster
        Alert.alert(
          'Tahminler Güncellendi!',
          'Tahminleriniz güncellendi.',
          [{ text: 'Tamam' }]
        );
      }
      
      // ✅ MatchDetail'da yıldızı güncelle
      onPredictionsSaved?.();
      // ✅ İki favori maçta diğer takım teklifi için hangi takım kaydedildi
      if (predictionTeamId != null) onPredictionsSavedForTeam?.(predictionTeamId);
    } catch (error) {
      setIsSaving(false); // ✅ Hata durumunda da kapat
      console.error('Error saving predictions:', error);
      handleError(error as Error, {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.HIGH,
        context: { matchId: matchData.id, action: 'save_predictions' },
      });
      Alert.alert('Hata!', 'Tahminler kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  // ✅ handleSavePredictions'ı ref'te tut - sonsuz döngüyü önle
  const handleSavePredictionsRef = React.useRef(handleSavePredictions);
  React.useEffect(() => {
    handleSavePredictionsRef.current = handleSavePredictions;
  });
  
  // ✅ Stable wrapper function - ref üzerinden çağırır
  const stableSavePredictions = React.useCallback(async () => {
    return handleSavePredictionsRef.current();
  }, []);
  
  // ✅ Kaydedilmemiş değişiklik durumunu parent'a bildir (tab değiştiğinde sorulması için)
  // Kilit kırmızı (kilitli/kaydedilmiş) ise → kaydedilmemiş değişiklik YOK
  React.useEffect(() => {
    if (onHasUnsavedChanges) {
      const effectiveUnsaved = isPredictionLocked ? false : hasUnsavedChanges;
      onHasUnsavedChanges(effectiveUnsaved, stableSavePredictions);
    }
  }, [hasUnsavedChanges, isPredictionLocked, onHasUnsavedChanges, stableSavePredictions]);

  // ✅ 120 saniyelik timeout mantığı kaldırıldı - tahminler maç boyunca yapılabilir
  // Event bazlı puan sistemi predictionTiming.ts'te tanımlı

  const handlePredictionChange = (category: string, value: string | number) => {
    // ✅ İzleme modunda değişiklik yapılamaz - popup göster
    if (isViewOnlyMode) {
      setShowViewOnlyWarningModal(true);
      return;
    }
    
    // ✅ TOPLULUK VERİLERİ GÖRÜLDÜYse TÜM TAHMİNLER KALİCİ KİLİTLİ
    // Kullanıcı topluluk verilerini gördüyse, artık hiçbir tahmin değiştiremez
    if (hasViewedCommunityData) {
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Tahminler kilitliyse ama topluluk verilerini görmemişse:
    // SADECE ANALİZ ODAĞI KATEGORİLERİ değiştirilebilir (maç başlayana kadar)
    if (isPredictionLocked && !isMatchLive && !isMatchFinished) {
      const isInAnalysisFocus = isCategoryInSelectedFocus(category);
      if (!isInAnalysisFocus) {
        // Analiz odağı dışındaki kategoriler için kilit uyarısı göster
        setShowLockedWarningModal(true);
        return;
      }
      // Analiz odağındaki kategoriler değiştirilebilir - devam et
    } else if (isPredictionLocked) {
      // Maç başladıysa veya bittiyse, tüm tahminler kilitli
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Değişiklik yapıldı - kaydedilmemiş değişiklik var
    if (initialPredictionsLoaded) setHasUnsavedChanges(true);
    
    setPredictions(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === value ? null : value
    }));
  };

  // 🎯 Analiz odağı seçildiğinde çağrılır - otomatik olarak o odağa ait kategoriler odaklanır
  const handleAnalysisFocusSelect = (focusType: AnalysisFocusType) => {
    setSelectedAnalysisFocus(focusType);
    
    // O odağa ait kategorileri otomatik olarak odakla
    const categories = FOCUS_CATEGORY_MAPPING[focusType] || [];
    const newFocusedPredictions: FocusPrediction[] = categories.map(category => ({
      category,
      playerId: undefined,
      isFocused: true,
    }));
    
    setFocusedPredictions(newFocusedPredictions);
  };

  // 🌟 Bir kategorinin seçili analiz odağına ait olup olmadığını kontrol et
  const isCategoryInSelectedFocus = (category: string): boolean => {
    if (!selectedAnalysisFocus) return false;
    const categories = FOCUS_CATEGORY_MAPPING[selectedAnalysisFocus] || [];
    return categories.includes(category);
  };

  // ✅ INFO BUTONU İŞLEYİCİ - Topluluk verileri görülebilir mi kontrol et
  // Tahmin kaydedilmeden önce: Genel bilgi + "Önce tahmininizi kaydedin" uyarısı göster
  // Tahmin kaydedildikten sonra: Topluluk verilerini görmek için onay iste (görmezse bağımsız bonus kalır)
  const handleSectionInfoPress = (sectionData: {
    title: string;
    communityDescription: string;
    generalDescription: string;
    communityStats: { label: string; value: string; percentage: number }[];
  }) => {
    // ✅ Topluluk verileri zaten görünürse (hasViewedCommunityData true veya maç canlı/bitmiş)
    if (communityDataVisible) {
      setSectionInfoPopup({
        title: sectionData.title,
        description: sectionData.communityDescription,
        stats: sectionData.communityStats,
      });
      return;
    }
    
    // ✅ Tahmin kaydedilmişse ama topluluk verilerini görmemişse
    // "Topluluk verilerini görmek ister misiniz?" sor
    if (hasPrediction && !hasViewedCommunityData) {
      setSectionInfoPopup({
        title: sectionData.title,
        description: sectionData.generalDescription + '\n\n📊 Topluluk verilerini görmek için "Topluluk Verilerini Gör" butonuna basın.\n\n⚠️ DİKKAT: Topluluk verilerini görürseniz tahminleriniz kalıcı olarak kilitlenir!',
        stats: [], // Topluluk verileri gizli
      });
      return;
    }
    
    // ✅ Tahmin henüz kaydedilmemişse
    // Genel bilgi + "Önce tahmininizi kaydedin" uyarısı göster
    setSectionInfoPopup({
      title: sectionData.title,
      description: sectionData.generalDescription + '\n\n📝 Topluluk tahminlerini görmek için önce kendi tahminlerinizi kaydedin.',
      stats: [], // Topluluk verileri gizli - henüz tahmin yok
    });
  };

  // 🌟 Toggle Focus (Star) – uygulama içi ConfirmModal popup (tarayıcı confirm/alert yok)
  const toggleFocus = (category: string, playerId?: number) => {
    const isCurrentlyFocused = focusedPredictions.some(
      fp => fp.category === category && fp.playerId === playerId
    );
    if (__DEV__) console.log('🌟 toggleFocus', category, 'focused=', isCurrentlyFocused);

    if (isCurrentlyFocused) {
      setConfirmModal({
        title: 'Odaktan çıkar',
        message:
          'Bu tahmini odaktan çıkarmak istiyor musunuz? Doğru tahmin 2x puan avantajı kaybolur.',
        buttons: [
          { text: 'İptal', style: 'cancel', onPress: () => {} },
          {
            text: 'Çıkar',
            style: 'destructive',
            onPress: () => {
              setFocusedPredictions(prev =>
                prev.filter(fp => !(fp.category === category && fp.playerId === playerId))
              );
            },
          },
        ],
      });
      return;
    }

    if (focusedPredictions.length >= SCORING_CONSTANTS.MAX_FOCUS) {
      setConfirmModal({
        title: 'Maksimum Odak Sayısı! ⭐',
        message: `En fazla ${SCORING_CONSTANTS.MAX_FOCUS} tahmine odaklanabilirsiniz. Başka bir tahmini odaktan çıkarın.`,
        buttons: [{ text: 'Tamam', onPress: () => {} }],
      });
      return;
    }

    setFocusedPredictions(prev => [...prev, { category, playerId, isFocused: true }]);
  };

  // Check if a prediction is focused
  // 1. Manuel olarak focusedPredictions'a eklenmişse
  // 2. VEYA seçili analiz odağının kategorileri arasındaysa (otomatik)
  const isFocused = (category: string, playerId?: number): boolean => {
    // Manuel odaklanma kontrolü
    const manuallyFocused = focusedPredictions.some(
      fp => fp.category === category && fp.playerId === playerId
    );
    if (manuallyFocused) return true;
    
    // Analiz odağına göre otomatik odaklanma kontrolü
    if (selectedAnalysisFocus) {
      const focusCategories = FOCUS_CATEGORY_MAPPING[selectedAnalysisFocus] || [];
      // Oyuncu tahminleri için playerId varsa ve kategori oyuncu odağındaysa
      if (playerId !== undefined) {
        // Oyuncu tahminleri: player veya defense odağında
        return focusCategories.includes(category);
      }
      // Genel kategoriler için
      return focusCategories.includes(category);
    }
    
    return false;
  };

  /** Yıldıza tıklanınca: tahmin odağı açıklaması + odakla / odaktan çıkar seçeneği */
  const showFocusExplanationModal = (category: string, playerId?: number) => {
    const focused = isFocused(category, playerId);
    const atMax = focusedPredictions.length >= SCORING_CONSTANTS.MAX_FOCUS;
    const explanation =
      'Odakladığınız tahmin doğru bilindiğinde 2x puan kazanırsınız. En fazla ' +
      SCORING_CONSTANTS.MAX_FOCUS +
      ' tahmine odaklanabilirsiniz.';

    if (focused) {
      setConfirmModal({
        title: 'Tahmin odağı',
        message: explanation + '\n\nBu tahmin şu an odakta. Odaktan çıkarmak ister misiniz?',
        buttons: [
          { text: 'Tamam', style: 'cancel', onPress: () => setConfirmModal(null) },
          {
            text: 'Odaktan çıkar',
            style: 'destructive',
            onPress: () => {
              setFocusedPredictions(prev =>
                prev.filter(fp => !(fp.category === category && fp.playerId === playerId))
              );
              setConfirmModal(null);
            },
          },
        ],
      });
      return;
    }
    if (atMax) {
      setConfirmModal({
        title: 'Tahmin odağı',
        message: explanation + '\n\nEn fazla ' + SCORING_CONSTANTS.MAX_FOCUS + ' tahmine odaklanabilirsiniz. Başka bir tahmini odaktan çıkarın.',
        buttons: [{ text: 'Tamam', onPress: () => setConfirmModal(null) }],
      });
      return;
    }
    setConfirmModal({
      title: 'Tahmin odağı',
      message: explanation + '\n\nBu tahmini odaklamak ister misiniz?',
      buttons: [
        { text: 'İptal', style: 'cancel', onPress: () => setConfirmModal(null) },
        {
          text: 'Odakla',
          onPress: () => {
            setFocusedPredictions(prev => [...prev, { category, playerId, isFocused: true }]);
            setConfirmModal(null);
          },
        },
      ],
    });
  };

  const handleScoreChange = (category: 'firstHalfHomeScore' | 'firstHalfAwayScore' | 'secondHalfHomeScore' | 'secondHalfAwayScore', value: number) => {
    // ✅ İzleme modunda değişiklik yapılamaz - popup göster
    if (isViewOnlyMode) {
      setShowViewOnlyWarningModal(true);
      return;
    }
    
    // ✅ TOPLULUK VERİLERİ GÖRÜLDÜYse TÜM TAHMİNLER KALİCİ KİLİTLİ
    if (hasViewedCommunityData) {
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Tahminler kilitliyse ama topluluk verilerini görmemişse:
    // Skor tahminleri analiz odağında değilse kilitli
    if (isPredictionLocked && !isMatchLive && !isMatchFinished) {
      // Skor tahminleri genelde analiz odağına dahil değil - kontrol et
      const scoreCategory = category.includes('firstHalf') ? 'firstHalfScore' : 'fullTimeScore';
      const isInAnalysisFocus = isCategoryInSelectedFocus(scoreCategory);
      if (!isInAnalysisFocus) {
        setShowLockedWarningModal(true);
        return;
      }
    } else if (isPredictionLocked) {
      setShowLockedWarningModal(true);
      return;
    }
    
    // ✅ Değişiklik yapıldı - kaydedilmemiş değişiklik var
    if (initialPredictionsLoaded) setHasUnsavedChanges(true);
    
    setPredictions(prev => {
      const minHome = prev.firstHalfHomeScore ?? 0;
      const minAway = prev.firstHalfAwayScore ?? 0;
      if (category === 'secondHalfHomeScore' && value < minHome) return prev;
      if (category === 'secondHalfAwayScore' && value < minAway) return prev;

      let next = { ...prev, [category]: prev[category] === value ? null : value };

      // İlk yarı değişince maç sonu ön tanımlı olarak ilk yarı skoruna getirilir (veya ilk yarının altındaysa düzeltilir)
      if (category === 'firstHalfHomeScore' && next.firstHalfHomeScore != null) {
        if (next.secondHalfHomeScore == null || next.secondHalfHomeScore < next.firstHalfHomeScore)
          next = { ...next, secondHalfHomeScore: next.firstHalfHomeScore };
      }
      if (category === 'firstHalfAwayScore' && next.firstHalfAwayScore != null) {
        if (next.secondHalfAwayScore == null || next.secondHalfAwayScore < next.firstHalfAwayScore)
          next = { ...next, secondHalfAwayScore: next.firstHalfAwayScore };
      }

      return next;
    });
  };

  // Maç sonu skorundan türetilen toplam gol aralığı (kullanıcı toplam golü elle seçmediyse bu kullanılır)
  const TOTAL_GOALS_RANGES = ['0-1 gol', '2-3 gol', '4-5 gol', '6+ gol'] as const;
  const getDerivedTotalGoals = (): string | null => {
    const home = predictions.secondHalfHomeScore ?? 0;
    const away = predictions.secondHalfAwayScore ?? 0;
    if (predictions.secondHalfHomeScore === null && predictions.secondHalfAwayScore === null) return null;
    const sum = home + away; // 5+ butonu 5 olarak saklanıyor
    if (sum <= 1) return '0-1 gol';
    if (sum <= 3) return '2-3 gol';
    if (sum <= 5) return '4-5 gol';
    return '6+ gol';
  };
  const effectiveTotalGoals = predictions.totalGoals ?? getDerivedTotalGoals();

  // ✅ Kayıtlı tahminlerde anahtar string olabilir (AsyncStorage); hem number hem string ile oku
  const currentPlayerPredictions = selectedPlayer
    ? (playerPredictions[selectedPlayer.id] ?? playerPredictions[String(selectedPlayer.id)] ?? {})
    : {};

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Football Field with Players – Kadro sekmesindeki saha ile birebir aynı boyut */}
        <FootballField style={[styles.mainField, fieldDynamicStyle]}>
          {/* 🌟 Saha Üzerinde Analiz Odağı Yıldızı - Sağ üst köşe */}
          <TouchableOpacity 
            style={styles.fieldFocusStarContainer}
            onPress={() => {
              const isPlayerFocused = doesFocusIncludePlayerPredictions(selectedAnalysisFocus);
              const focusName = selectedAnalysisFocus 
                ? ANALYSIS_FOCUSES.find(f => f.id === selectedAnalysisFocus)?.title || selectedAnalysisFocus
                : null;
              setConfirmModal({
                title: 'Oyuncu Tahminleri Odağı',
                message: isPlayerFocused 
                  ? `Analiz odağınız "${focusName}" olduğu için bu oyuncu tahminleri 2x puan kazandırır.`
                  : 'Oyuncu tahminlerinden 2x puan kazanmak için ilgili analiz odağını seçmelisiniz (Hücum, Savunma, Orta Saha veya Oyuncu Odaklı).',
                buttons: [{ text: 'Tamam', onPress: () => setConfirmModal(null) }],
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={doesFocusIncludePlayerPredictions(selectedAnalysisFocus) ? 'star' : 'star-outline'} 
              size={20} 
              color={doesFocusIncludePlayerPredictions(selectedAnalysisFocus) ? '#F59E0B' : '#6B7280'} 
            />
          </TouchableOpacity>
          <View style={styles.playersContainer}>
            {(() => {
              // ✅ SADECE Tamamla basıldıysa ve 11 oyuncu varsa kartları göster
              const showPlayers = isSquadCompleted && attackPlayersArray.length === 11 && attackFormation;
              
              if (!showPlayers) {
                // ✅ Kadro tamamlanmadıysa uyarı göster
                return (
                  <View style={styles.squadIncompleteWarning}>
                    <Ionicons name="football-outline" size={48} color="rgba(31, 162, 166, 0.6)" />
                    <Text style={styles.squadIncompleteTitle}>Kadro Tamamlanmadı</Text>
                    <Text style={styles.squadIncompleteText}>
                      Tahmin yapabilmek için önce Kadro sekmesinden{'\n'}formasyonunuzu ve 11 oyuncunuzu seçin.
                    </Text>
                  </View>
                );
              }
              
              // ✅ isViewOnlyMode zaten üstte tanımlandı (component seviyesinde)
              
              const positions = formationPositions[attackFormation] || mockPositions;
              // ✅ Kadro ile aynı: formasyon slot etiketi (GK, LB, CB, CDM, ...) kullan
              const slotLabels = formationLabels[attackFormation] || [];
              
              return positions.map((pos, index) => {
                const player = attackPlayersArray[index];
                if (!player) return null;
                // Kadro sekmesiyle aynı pozisyon etiketi (formasyon slot: GK, LB, CB, RB, CDM, CAM, ST vb.)
                const positionLabel = slotLabels[index] || getPositionAbbreviation(player.position || '');
                const playerPreds = playerPredictions[player.id] || playerPredictions[String(player.id)] || {};
                const hasPredictions = hasAnyRealPlayerPrediction(playerPreds);
                const hasSubstitution = !!(playerPreds.substitutedOut || playerPreds.injuredOut);
                const hasRedCard = !!(playerPreds.redCard || playerPreds.directRedCard || playerPreds.secondYellowRed);
                const hasYellowCard = !!(playerPreds.yellowCard) && !hasRedCard;
                const hasGoal = !!(playerPreds.goal || playerPreds.willScore);
                const hasAssist = !!(playerPreds.assist || playerPreds.willAssist);
                const hasInjury = !!(playerPreds.injuredOut);
                
                // ✅ Topluluk çerçeve stili - sadece canlı/bitmiş maçlarda göster (maç öncesi sadece elit çerçeve ve glow)
                const communityBorder = (isMatchLive || isMatchFinished) ? getCommunityBorderStyle(player.id) : null;
                
                // ✅ CANLI MAÇ SİNYAL ÇERÇEVESİ - Topluluk sinyallerine göre dinamik çerçeve
                const playerSignals = liveSignals[player.id];
                const signalBorderStyle = isMatchLive && playerSignals?.dominantSignal 
                  ? getSignalBorderStyle(playerSignals.dominantSignal)
                  : null;

                return (
                  <View
                    key={player ? `prediction-player-${player.id}-${index}` : `prediction-slot-${index}`} // ✅ Stable key - sıçramayı önler
                    style={[
                      styles.playerSlot,
                      { left: `${pos.x}%`, top: `${pos.y}%` }, // ✅ Sabit pozisyon
                    ]}
                  >
                    {/* ✅ "i" ikonu: KIRMIZI DAİRE - Her zaman görünür */}
                    <TouchableOpacity
                      style={styles.predictionCardInfoIconRed}
                      onPress={() => {
                        console.log('📋 [INFO] Oyuncu bilgi popup açılıyor:', player.name);
                        
                        // ✅ CANLI MAÇ: Sinyal popup'ını aç
                        if (isMatchLive && playerSignals && playerSignals.signals.length > 0) {
                          setSignalPopupPlayer({
                            playerId: player.id,
                            playerName: player.name,
                            positionLabel,
                            signals: playerSignals,
                          });
                          return;
                        }
                        
                        // ✅ OYUNCU BİLGİ POPUP - Web için Modal kullan
                        const community = communityPredictions[player.id];
                        const userPredictionsList: string[] = [];
                        if (playerPreds) {
                          if (playerPreds.goal) userPredictionsList.push('⚽ Gol atar');
                          if (playerPreds.assist) userPredictionsList.push('🅰️ Asist yapar');
                          if (playerPreds.yellowCard) userPredictionsList.push('🟨 Sarı kart');
                          if (playerPreds.redCard) userPredictionsList.push('🟥 Kırmızı kart');
                          if (playerPreds.substitutedOut) userPredictionsList.push(`🔄 ${playerPreds.substitutedOutMinute || '?'}. dk çıkar`);
                          if (playerPreds.injuredOut) userPredictionsList.push('🏥 Sakatlanır');
                        }
                        
                        setPlayerInfoPopup({
                          playerName: player.name,
                          position: positionLabel,
                          rating: player.rating ?? null,
                          userPredictions: userPredictionsList,
                          communityData: community ? {
                            totalUsers: community.totalPredictions,
                            goal: community.goal,
                            assist: community.assist,
                            yellowCard: community.yellowCard,
                            redCard: community.redCard,
                            substitutedOut: community.substitutedOut,
                            injuredOut: community.injuredOut,
                          } : null,
                          showCommunityData: communityDataVisible || isViewOnlyMode,
                        });
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.infoIconText}>i</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.playerCard,
                        // 1️⃣ Tahmin yapılmış oyuncular - glow efekti (arka plan ışığı)
                        hasPredictions && styles.playerCardPredicted,
                        // 2️⃣ Maç öncesi: Elit oyuncular (85+) altın çerçeve, kaleciler mavi çerçeve
                        !(isMatchLive || isMatchFinished) && player.rating >= 85 && styles.playerCardElite,
                        !(isMatchLive || isMatchFinished) && player.rating < 85 && (player.position === 'GK' || isGoalkeeperPlayer(player)) && styles.playerCardGK,
                        // 3️⃣ CANLI MAÇ: Sinyal çerçevesi (şık, ince + glow efekti)
                        signalBorderStyle && {
                          borderColor: signalBorderStyle.borderColor,
                          borderWidth: signalBorderStyle.borderWidth,
                          // Web için boxShadow ile glow efekti
                          ...(Platform.OS === 'web' && signalBorderStyle.glowColor ? {
                            boxShadow: `0 0 ${signalBorderStyle.glowRadius || 6}px ${signalBorderStyle.glowColor}`,
                          } : {}),
                        },
                        // 4️⃣ Canlı/bitmiş maç: Topluluk çerçevesi (sinyal yoksa)
                        !signalBorderStyle && communityBorder && {
                          borderColor: communityBorder.color,
                          borderWidth: communityBorder.width,
                        },
                        // 5️⃣ Canlı/bitmiş maç fallback (topluluk verisi yoksa)
                        !signalBorderStyle && !communityBorder && (isMatchLive || isMatchFinished) && (positionLabel === 'GK' || isGoalkeeperPlayer(player)) && styles.playerCardGKCommunity,
                        !signalBorderStyle && !communityBorder && (isMatchLive || isMatchFinished) && (positionLabel === 'ST' || (player.position && String(player.position).toUpperCase() === 'ST')) && styles.playerCardSTCommunity,
                        // 6️⃣ İzleme modu: Kadro tahmini yapılmadıysa hafif soluk görünüm
                        isViewOnlyMode && { opacity: 0.85 },
                      ]}
                      onPress={() => {
                        // ✅ İZLEME MODU: Kadro tahmini yapılmadıysa bilgi popup'ı aç ("i" butonu gibi)
                        if (isViewOnlyMode) {
                          const community = communityPredictions[player.id];
                          const userPredictionsList: string[] = [];
                          if (playerPreds) {
                            if (playerPreds.goal) userPredictionsList.push('⚽ Gol atar');
                            if (playerPreds.assist) userPredictionsList.push('🅰️ Asist yapar');
                            if (playerPreds.yellowCard) userPredictionsList.push('🟨 Sarı kart');
                            if (playerPreds.redCard) userPredictionsList.push('🟥 Kırmızı kart');
                            if (playerPreds.substitutedOut) userPredictionsList.push(`🔄 ${playerPreds.substitutedOutMinute || '?'}. dk çıkar`);
                            if (playerPreds.injuredOut) userPredictionsList.push('🏥 Sakatlanır');
                          }
                          
                          setPlayerInfoPopup({
                            playerName: player.name,
                            position: positionLabel,
                            rating: player.rating ?? null,
                            userPredictions: userPredictionsList,
                            communityData: community ? {
                              totalUsers: community.totalPredictions,
                              goal: community.goal,
                              assist: community.assist,
                              yellowCard: community.yellowCard,
                              redCard: community.redCard,
                              substitutedOut: community.substitutedOut,
                              injuredOut: community.injuredOut,
                            } : null,
                            showCommunityData: true,
                          });
                          return;
                        }
                        // ✅ Kilit kontrolü: Tahminler kilitliyken bilgilendirme göster
                        if (isPredictionLocked) {
                          // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                          setShowLockedWarningModal(true);
                          return;
                        }
                        // ✅ Kilit açıksa modal'ı aç
                        setSelectedPlayer(player);
                      }}
                      activeOpacity={isViewOnlyMode ? 1 : 0.8}
                    >
                      <LinearGradient
                        colors={['#1E3A3A', '#0F2A24']}
                        style={styles.playerCardGradient}
                      >
                        <View style={[
                          styles.jerseyNumberBadge,
                          player.rating >= 85 && { backgroundColor: '#C9A44C' },
                          player.rating < 85 && (player.position === 'GK' || isGoalkeeperPlayer(player)) && { backgroundColor: '#3B82F6' },
                        ]}>
                          <Text style={styles.jerseyNumberText}>
                            {player.number || player.id}
                          </Text>
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player.name.split(' ').pop()}
                        </Text>
                        {hasPredictions && <View style={styles.predictionGlow} />}
                      </LinearGradient>
                    </TouchableOpacity>
                    {/* ✅ Tik badge - tahmin yapıldı göstergesi */}
                    {hasPredictions && (
                      <View style={styles.predictionCheckBadgeTopRight}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                    {/* Sinyal bilgisi kurallara göre sadece "i" ikonuna tıklanınca popup'ta gösterilir */}
                  </View>
                );
              }).filter(Boolean);
            })()}
          </View>
        </FootballField>

        {/* ✅ Bildirim: Oyuncu kartlarına tıklayın + kilit bilgisi VEYA izleme modu mesajı */}
        {!hasPrediction && (isMatchLive || isMatchFinished) ? (
          <View style={[styles.infoNote, { backgroundColor: 'rgba(31, 162, 166, 0.15)', borderColor: 'rgba(31, 162, 166, 0.3)' }]}>
            <Ionicons name="eye-outline" size={14} color="#1FA2A6" style={{ flexShrink: 0 }} />
            <Text style={[styles.infoText, { color: '#5EEAD4', fontSize: 11 }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              Kadro tahmini yapmadığınız için tahmin yapamazsınız. Topluluk verilerini görmek için oyuncu kartlarına tıklayın.
            </Text>
          </View>
        ) : (
          <View style={styles.infoNote}>
            <Ionicons name="information-circle" size={16} color="#9CA3AF" />
            <Text style={styles.infoText} numberOfLines={2}>
              Tahmin yapmak için oyuncu kartlarına tıklayın ve aşağı kaydırın. Tahminleri değiştirmek için kilidi açın
            </Text>
            <Ionicons name="lock-open" size={14} color="#10B981" style={{ marginLeft: 4 }} />
          </View>
        )}

        {/* PREDICTION CATEGORIES - COMPLETE */}
        {/* ✅ İZLEME MODU: Kadro tahmini yapılmadıysa tahmin alanları hafif soluk (ama tıklanabilir - i butonları için) */}
        <View style={[
          styles.predictionsSection,
          !hasPrediction && (isMatchLive || isMatchFinished) && styles.predictionsSectionViewOnly
        ]}>
          {/* ═══════════════════════════════════════════════════════════
              1. İLK YARI - Skor + Uzatma Süresi (Kombine Kart)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardFirstHalf]}
            activeOpacity={1}
            onPress={() => {
              // ✅ İzleme modu kontrolü - sessizce yoksay
              if (!hasPrediction && (isMatchLive || isMatchFinished)) return;
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentFirstHalf} />
            
            {/* Kart Başlığı */}
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <View style={[styles.cardIconSmall, styles.cardIconFirstHalf]}>
                    <Text style={styles.cardEmoji}>⏱️</Text>
                  </View>
                  <Text style={styles.combinedCardTitle}>İlk Yarı</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && isCategoryInSelectedFocus('firstHalfHomeScore') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'İlk Yarı Skor Tahmini',
                    generalDescription: 'İlk yarı skorunu tahmin edin. Ev sahibi ve deplasman takımının ilk yarı sonundaki skor durumunu öngörün.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının ilk yarı tahminleri:`,
                    communityStats: [
                      { label: 'Berabere', value: `%${communityMatchPredictions.firstHalf.draw}`, percentage: communityMatchPredictions.firstHalf.draw },
                      { label: 'Ev sahibi önde', value: `%${communityMatchPredictions.firstHalf.homeLeading}`, percentage: communityMatchPredictions.firstHalf.homeLeading },
                      { label: 'Deplasman önde', value: `%${communityMatchPredictions.firstHalf.awayLeading}`, percentage: communityMatchPredictions.firstHalf.awayLeading },
                      { label: 'En popüler skor', value: `${communityMatchPredictions.firstHalf.mostPopularScore.home}-${communityMatchPredictions.firstHalf.mostPopularScore.away} (%${communityMatchPredictions.firstHalf.mostPopularScore.percentage})`, percentage: communityMatchPredictions.firstHalf.mostPopularScore.percentage },
                      { label: 'Ort. ev sahibi gol', value: communityMatchPredictions.firstHalf.avgHomeGoals.toFixed(1), percentage: Math.round(communityMatchPredictions.firstHalf.avgHomeGoals * 50) },
                      { label: 'Ort. deplasman gol', value: communityMatchPredictions.firstHalf.avgAwayGoals.toFixed(1), percentage: Math.round(communityMatchPredictions.firstHalf.avgAwayGoals * 50) },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Minimalist Skor Seçici */}
            <View style={styles.scoreDisplayMinimal}>
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFirstHalf]}>EV</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn} 
                    onPress={() => handleScoreChange('firstHalfHomeScore', Math.max(0, (predictions.firstHalfHomeScore ?? 0) - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFirstHalf]}>{predictions.firstHalfHomeScore ?? 0}</Text>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfHomeScore', Math.min(9, (predictions.firstHalfHomeScore ?? 0) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.scoreDashMinimal}>
                <Text style={styles.scoreDashTextMinimal}>:</Text>
              </View>
              
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFirstHalf]}>DEP</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfAwayScore', Math.max(0, (predictions.firstHalfAwayScore ?? 0) - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFirstHalf]}>{predictions.firstHalfAwayScore ?? 0}</Text>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfAwayScore', Math.min(9, (predictions.firstHalfAwayScore ?? 0) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, styles.cardDividerFirstHalf]} />
            
            {/* Uzatma Süresi Slider */}
            <View style={styles.sliderSectionCombined}>
              <View style={styles.sliderHeaderCombined}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={styles.sliderLabelCombined}>Uzatma Süresi</Text>
                <View style={[styles.sliderValueBadgeCombined, styles.sliderValueBadgeFirstHalf]}>
                  <Text style={styles.sliderValueTextCombined}>
                    +{(() => {
                      const val = predictions.firstHalfInjuryTime;
                      if (!val) return '0';
                      const num = parseInt(val.replace(/[^0-9]/g, ''));
                      return num >= 10 ? '10+' : num;
                    })()}
                  </Text>
                </View>
              </View>
              <View style={styles.sliderTrackContainer}>
                <Slider
                  value={(() => {
                    const val = predictions.firstHalfInjuryTime;
                    if (!val) return 0;
                    return parseInt(val.replace(/[^0-9]/g, '')) || 0;
                  })()}
                  onValueChange={(v: number) => handlePredictionChange('firstHalfInjuryTime', `+${Math.round(v)} dk`)}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  minimumTrackTintColor="rgba(234, 179, 8, 0.5)"
                  maximumTrackTintColor="rgba(148, 163, 184, 0.1)"
                  thumbTintColor="#EAB308"
                  style={styles.sliderCombined}
                />
                <View style={styles.sliderMarksCombined}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
                    <TouchableOpacity
                      key={String(mark)}
                      onPress={() => handlePredictionChange('firstHalfInjuryTime', `+${mark} dk`)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sliderMarkCombined}>{mark === 10 ? '10+' : mark}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
              2. MAÇ SONU - Skor + Uzatma Süresi (Kombine Kart)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardFullTime]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentFullTime} />
            
            {/* Kart Başlığı */}
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <View style={[styles.cardIconSmall, styles.cardIconFullTime]}>
                    <Text style={styles.cardEmoji}>🏆</Text>
                  </View>
                  <Text style={styles.combinedCardTitle}>Maç Sonu</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && isCategoryInSelectedFocus('secondHalfHomeScore') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Maç Sonu Skor Tahmini',
                    generalDescription: 'Maç sonu skorunu tahmin edin. 90 dakika sonundaki nihai skoru öngörün.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının maç sonu tahminleri:`,
                    communityStats: [
                      { label: 'Ev sahibi kazanır', value: `%${communityMatchPredictions.fullTime.homeWin}`, percentage: communityMatchPredictions.fullTime.homeWin },
                      { label: 'Berabere', value: `%${communityMatchPredictions.fullTime.draw}`, percentage: communityMatchPredictions.fullTime.draw },
                      { label: 'Deplasman kazanır', value: `%${communityMatchPredictions.fullTime.awayWin}`, percentage: communityMatchPredictions.fullTime.awayWin },
                      { label: 'En popüler skor', value: `${communityMatchPredictions.fullTime.mostPopularScore.home}-${communityMatchPredictions.fullTime.mostPopularScore.away} (%${communityMatchPredictions.fullTime.mostPopularScore.percentage})`, percentage: communityMatchPredictions.fullTime.mostPopularScore.percentage },
                      { label: 'Ort. ev sahibi gol', value: communityMatchPredictions.fullTime.avgHomeGoals.toFixed(1), percentage: Math.round(communityMatchPredictions.fullTime.avgHomeGoals * 25) },
                      { label: 'Ort. deplasman gol', value: communityMatchPredictions.fullTime.avgAwayGoals.toFixed(1), percentage: Math.round(communityMatchPredictions.fullTime.avgAwayGoals * 25) },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Minimalist Skor Seçici */}
            <View style={styles.scoreDisplayMinimal}>
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFullTime]}>EV</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn} 
                    onPress={() => {
                      const minHome = predictions.firstHalfHomeScore ?? 0;
                      const newVal = Math.max(minHome, (predictions.secondHalfHomeScore ?? 0) - 1);
                      handleScoreChange('secondHalfHomeScore', newVal);
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFullTime]}>{predictions.secondHalfHomeScore ?? 0}</Text>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('secondHalfHomeScore', Math.min(9, (predictions.secondHalfHomeScore ?? 0) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.scoreDashMinimal}>
                <Text style={styles.scoreDashTextMinimal}>:</Text>
              </View>
              
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFullTime]}>DEP</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => {
                      const minAway = predictions.firstHalfAwayScore ?? 0;
                      const newVal = Math.max(minAway, (predictions.secondHalfAwayScore ?? 0) - 1);
                      handleScoreChange('secondHalfAwayScore', newVal);
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFullTime]}>{predictions.secondHalfAwayScore ?? 0}</Text>
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('secondHalfAwayScore', Math.min(9, (predictions.secondHalfAwayScore ?? 0) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, styles.cardDividerFullTime]} />
            
            {/* Uzatma Süresi Slider */}
            <View style={styles.sliderSectionCombined}>
              <View style={styles.sliderHeaderCombined}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={styles.sliderLabelCombined}>Uzatma Süresi</Text>
                <View style={[styles.sliderValueBadgeCombined, styles.sliderValueBadgeFullTime]}>
                  <Text style={styles.sliderValueTextCombined}>
                    +{(() => {
                      const val = predictions.secondHalfInjuryTime;
                      if (!val) return '0';
                      const num = parseInt(val.replace(/[^0-9]/g, ''));
                      return num >= 10 ? '10+' : num;
                    })()}
                  </Text>
                </View>
              </View>
              <View style={styles.sliderTrackContainer}>
                <Slider
                  value={(() => {
                    const val = predictions.secondHalfInjuryTime;
                    if (!val) return 0;
                    return parseInt(val.replace(/[^0-9]/g, '')) || 0;
                  })()}
                  onValueChange={(v: number) => handlePredictionChange('secondHalfInjuryTime', `+${Math.round(v)} dk`)}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  minimumTrackTintColor="rgba(59, 130, 246, 0.5)"
                  maximumTrackTintColor="rgba(148, 163, 184, 0.1)"
                  thumbTintColor="#60A5FA"
                  style={styles.sliderCombined}
                />
                <View style={styles.sliderMarksCombined}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((mark) => (
                    <TouchableOpacity
                      key={String(mark)}
                      onPress={() => handlePredictionChange('secondHalfInjuryTime', `+${mark} dk`)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sliderMarkCombined}>{mark === 10 ? '10+' : mark}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
              3. GOL TAHMİNLERİ - Toplam Gol + İlk Gol Zamanı (Kombine Kart)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardGoal]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentGoal} />
            
            {/* Kart Başlığı */}
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <Ionicons name="football-outline" size={18} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.combinedCardTitle}>Gol Tahminleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('totalGoals') || isCategoryInSelectedFocus('firstGoalTime')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Gol Tahminleri',
                    generalDescription: 'Maçta atılacak toplam gol sayısını ve ilk golün atılacağı zaman dilimini tahmin edin.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının gol tahminleri:`,
                    communityStats: [
                      ...communityMatchPredictions.goals.ranges.map(r => ({
                        label: `${r.range} gol`,
                        value: `%${r.percentage}`,
                        percentage: r.percentage,
                      })),
                      { label: 'Ortalama tahmin', value: `${communityMatchPredictions.goals.avgTotal} gol`, percentage: Math.round(communityMatchPredictions.goals.avgTotal * 15) },
                      { label: 'İlk gol zamanı', value: `${communityMatchPredictions.goals.mostPopularFirstGoalTime} (%${communityMatchPredictions.goals.firstGoalTimePercentage})`, percentage: communityMatchPredictions.goals.firstGoalTimePercentage },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Toplam Gol - Disiplin Tarzı Zarif */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={styles.disciplineBarTitle}>Toplam Gol</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#10B981' }]}>{effectiveTotalGoals || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {TOTAL_GOALS_RANGES.map((range) => {
                  const isSelected = effectiveTotalGoals === range;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.totalGoals === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveEmerald,
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('totalGoals', range)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, styles.cardDividerGoal]} />
            
            {/* İlk Gol Zamanı */}
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRow}>
                <View style={[styles.cardIconSmall, styles.cardIconTime]}>
                  <Text style={styles.cardEmoji}>⏰</Text>
                </View>
                <Text style={styles.combinedCardTitle}>İlk Gol Zamanı</Text>
              </View>
            </View>
            
            <View style={styles.firstGoalTimeline}>
              {/* 1. Yarı (1-15', 16-30', 31-45', 45+) */}
              <View style={styles.timelineRow}>
                <Text style={styles.timelineRowLabel}>1Y</Text>
                <View style={styles.timelineRowButtons}>
                  {[
                    { label: "1-15'", value: '1-15' },
                    { label: "16-30'", value: '16-30' },
                    { label: "31-45'", value: '31-45' },
                    { label: "45+'", value: '45+' },
                  ].map((t) => {
                    const isSelected = predictions.firstGoalTime === t.value;
                    const isCommunityTop = isViewOnlyMode && communityTopPredictions.firstGoalTime === t.value;
                    const isActive = isSelected || isCommunityTop;
                    return (
                      <TouchableOpacity 
                        key={t.value} 
                        style={[
                          styles.timelineBtnCompact,
                          isActive && styles.timelineBtnCompactActiveFirst,
                        ]}
                        onPress={() => !isViewOnlyMode && handlePredictionChange('firstGoalTime', t.value)}
                        activeOpacity={isViewOnlyMode ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <Text style={[styles.timelineBtnTextCompact, isActive && styles.timelineBtnTextCompactActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* 2. Yarı (46-60', 61-75', 76-90', 90+) */}
              <View style={styles.timelineRow}>
                <Text style={styles.timelineRowLabel}>2Y</Text>
                <View style={styles.timelineRowButtons}>
                  {[
                    { label: "46-60'", value: '46-60' },
                    { label: "61-75'", value: '61-75' },
                    { label: "76-90'", value: '76-90' },
                    { label: "90+'", value: '90+' },
                  ].map((t) => {
                    const isSelected = predictions.firstGoalTime === t.value;
                    const isCommunityTop = isViewOnlyMode && communityTopPredictions.firstGoalTime === t.value;
                    const isActive = isSelected || isCommunityTop;
                    return (
                      <TouchableOpacity 
                        key={t.value} 
                        style={[
                          styles.timelineBtnCompact,
                          isActive && styles.timelineBtnCompactActiveSecond,
                        ]}
                        onPress={() => !isViewOnlyMode && handlePredictionChange('firstGoalTime', t.value)}
                        activeOpacity={isViewOnlyMode ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <Text style={[styles.timelineBtnTextCompact, isActive && styles.timelineBtnTextCompactActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Gol Yok Olabilir */}
              <TouchableOpacity 
                style={[styles.noGoalBtn, predictions.firstGoalTime === 'no_goal' && styles.noGoalBtnActive]}
                onPress={() => !isViewOnlyMode && handlePredictionChange('firstGoalTime', 'no_goal')}
                activeOpacity={isViewOnlyMode ? 1 : 0.7}
                disabled={isViewOnlyMode}
              >
                <Ionicons name="close-circle-outline" size={12} color={predictions.firstGoalTime === 'no_goal' ? '#FFF' : '#94A3B8'} />
                <Text style={[styles.noGoalBtnText, predictions.firstGoalTime === 'no_goal' && styles.noGoalBtnTextActive]}>Gol yok</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
              5. DİSİPLİN TAHMİNLERİ - Dikey Çubuklar (Soldan Sağa Artan)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardDiscipline]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentDiscipline} />
            
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <Ionicons name="card-outline" size={18} color="#FBBF24" style={{ marginRight: 4 }} />
                  <Text style={styles.combinedCardTitle}>Disiplin</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('yellowCards') || isCategoryInSelectedFocus('redCards')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Disiplin Tahminleri',
                    generalDescription: 'Maçta gösterilecek sarı ve kırmızı kart sayısını tahmin edin.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının kart tahminleri:`,
                    communityStats: [
                      ...communityMatchPredictions.discipline.yellowCards.map(r => ({
                        label: `Sarı kart (${r.range})`,
                        value: `%${r.percentage}`,
                        percentage: r.percentage,
                      })),
                      { label: 'Ortalama sarı kart', value: communityMatchPredictions.discipline.avgYellow.toFixed(1), percentage: Math.round(communityMatchPredictions.discipline.avgYellow * 10) },
                      { label: 'Kırmızı kart beklentisi', value: `%${communityMatchPredictions.discipline.redCardExpected}`, percentage: communityMatchPredictions.discipline.redCardExpected },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.disciplineColumnsContainer}>
              {/* Sarı Kart - Dikey Çubuklar */}
              <View style={styles.disciplineColumn}>
                <View style={styles.disciplineColumnHeader}>
                  <Text style={styles.disciplineColumnTitle}>Sarı Kart</Text>
                  {!isViewOnlyMode && <Text style={[styles.disciplineColumnValue, { color: '#FBBF24' }]}>{predictions.yellowCards || '?'}</Text>}
                </View>
                <View style={styles.verticalBarsContainer}>
                  {[
                    { label: '0-2', height: 20, color: '#FBBF24' },
                    { label: '3-4', height: 32, color: '#FBBF24' },
                    { label: '5-6', height: 44, color: '#FBBF24' },
                    { label: '7+', height: 56, color: '#FBBF24' },
                  ].map((item) => {
                    const isSelected = predictions.yellowCards === item.label;
                    const isCommunityTop = isViewOnlyMode && communityTopPredictions.yellowCards === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={styles.verticalBarWrapper}
                        onPress={() => !isViewOnlyMode && handlePredictionChange('yellowCards', item.label)}
                        activeOpacity={isViewOnlyMode ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <View 
                          style={[
                            styles.verticalBar,
                            { height: item.height, backgroundColor: isSelected || isCommunityTop ? item.color : 'rgba(251, 191, 36, 0.2)' },
                            (isSelected || isCommunityTop) && { borderWidth: 0 }
                          ]}
                        />
                        <Text style={[styles.verticalBarLabel, (isSelected || isCommunityTop) && { color: '#FBBF24', fontWeight: '600' }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Ayırıcı Çizgi */}
              <View style={styles.disciplineColumnDivider} />
              
              {/* Kırmızı Kart - Dikey Çubuklar */}
              <View style={styles.disciplineColumn}>
                <View style={styles.disciplineColumnHeader}>
                  <Text style={styles.disciplineColumnTitle}>Kırmızı Kart</Text>
                  {!isViewOnlyMode && <Text style={[styles.disciplineColumnValue, { color: '#F87171' }]}>{predictions.redCards || '?'}</Text>}
                </View>
                <View style={styles.verticalBarsContainer}>
                  {[
                    { label: '0', height: 16, color: '#F87171' },
                    { label: '1', height: 28, color: '#F87171' },
                    { label: '2', height: 44, color: '#F87171' },
                    { label: '3+', height: 56, color: '#F87171' },
                  ].map((item) => {
                    const isSelected = predictions.redCards === item.label;
                    const isCommunityTop = isViewOnlyMode && communityTopPredictions.redCards === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={styles.verticalBarWrapper}
                        onPress={() => !isViewOnlyMode && handlePredictionChange('redCards', item.label)}
                        activeOpacity={isViewOnlyMode ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <View 
                          style={[
                            styles.verticalBar,
                            { height: item.height, backgroundColor: isSelected || isCommunityTop ? item.color : 'rgba(248, 113, 113, 0.2)' },
                            (isSelected || isCommunityTop) && { borderWidth: 0 }
                          ]}
                        />
                        <Text style={[styles.verticalBarLabel, (isSelected || isCommunityTop) && { color: '#F87171', fontWeight: '600' }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* 6. Oyun Kontrolü - Topa Sahip Olma */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardPossession]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentPossession} />
            
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <View style={[styles.cardIconSmall, styles.cardIconPossession]}>
                    <Text style={styles.cardEmoji}>📊</Text>
                  </View>
                  <Text style={styles.combinedCardTitle}>Topa Sahip Olma</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && isCategoryInSelectedFocus('possession') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Top Hakimiyeti',
                    generalDescription: 'Maç boyunca topa sahip olma oranını tahmin edin. Hangi takım daha fazla topa sahip olacak?',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının top hakimiyeti tahminleri:`,
                    communityStats: [
                      { label: 'Ev sahibi dominant (55%+)', value: `%${communityMatchPredictions.possession.homeDominant}`, percentage: communityMatchPredictions.possession.homeDominant },
                      { label: 'Dengeli (45-55%)', value: `%${communityMatchPredictions.possession.balanced}`, percentage: communityMatchPredictions.possession.balanced },
                      { label: 'Deplasman dominant', value: `%${communityMatchPredictions.possession.awayDominant}`, percentage: communityMatchPredictions.possession.awayDominant },
                      { label: 'Ortalama tahmin (ev)', value: `%${communityMatchPredictions.possession.avgHomePossession}`, percentage: communityMatchPredictions.possession.avgHomePossession },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Zarif Display */}
            <View style={styles.possessionDisplayElegant}>
              <View style={styles.possessionTeamElegant}>
                <Text style={styles.possessionTeamLabelElegant}>EV</Text>
                <Text style={styles.possessionTeamValueElegant}>
                  {predictions.possession}%
                </Text>
              </View>
              
              <View style={styles.possessionBarContainer}>
                <View style={[styles.possessionBarSegment, styles.possessionBarHome, { flex: parseInt(predictions.possession) }]} />
                <View style={[styles.possessionBarSegment, styles.possessionBarAway, { flex: 100 - parseInt(predictions.possession) }]} />
              </View>
              
              <View style={styles.possessionTeamElegant}>
                <Text style={styles.possessionTeamLabelElegant}>DEP</Text>
                <Text style={[styles.possessionTeamValueElegant, { color: '#94A3B8' }]}>
                  {100 - parseInt(predictions.possession)}%
                </Text>
              </View>
            </View>

            {/* Minimalist Slider */}
            <View style={[styles.sliderSectionCombined, isViewOnlyMode && { opacity: 0.7 }]}>
              <View style={styles.sliderTrackContainer}>
                <Slider
                  value={parseInt(predictions.possession)}
                  onValueChange={(value) => !isViewOnlyMode && handlePredictionChange('possession', value.toString())}
                  minimumValue={30}
                  maximumValue={70}
                  step={5}
                  minimumTrackTintColor="rgba(45, 212, 191, 0.5)"
                  maximumTrackTintColor="rgba(148, 163, 184, 0.12)"
                  thumbTintColor="#5EEAD4"
                  style={styles.sliderCombined}
                  disabled={isViewOnlyMode}
                />
                <View style={styles.sliderMarksCombined}>
                  {[30, 35, 40, 45, 50, 55, 60, 65, 70].map((mark) => (
                    <Text key={String(mark)} style={styles.sliderMarkCombined}>{mark}</Text>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
              7. ŞUT TAHMİNLERİ - Disiplin Tarzı Zarif Barlar
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardShots]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentShots} />
            
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <View style={[styles.cardIconSmall, styles.cardIconShots]}>
                    <Text style={styles.cardEmoji}>🎯</Text>
                  </View>
                  <Text style={styles.combinedCardTitle}>Şut İstatistikleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('totalShots') || isCategoryInSelectedFocus('shotsOnTarget')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Şut İstatistikleri',
                    generalDescription: 'Maçtaki toplam şut sayısı ve isabetli şut oranını tahmin edin.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının şut tahminleri:`,
                    communityStats: [
                      ...communityMatchPredictions.shots.totalRanges.map(r => ({
                        label: `Toplam şut (${r.range})`,
                        value: `%${r.percentage}`,
                        percentage: r.percentage,
                      })),
                      { label: 'Ortalama toplam şut', value: String(communityMatchPredictions.shots.avgTotal), percentage: Math.round(communityMatchPredictions.shots.avgTotal * 2.5) },
                      { label: 'İsabetli şut oranı', value: `%${communityMatchPredictions.shots.onTargetPercentage}`, percentage: communityMatchPredictions.shots.onTargetPercentage },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Toplam Şut - Disiplin Tarzı */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={styles.disciplineBarTitle}>Toplam Şut</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#60A5FA' }]}>{predictions.totalShots || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-10', '11-20', '21-30', '31+'].map((range) => {
                  const isSelected = predictions.totalShots === range;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.totalShots === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveBlue,
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('totalShots', range)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} />
            
            {/* İsabetli Şut - Disiplin Tarzı */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={styles.disciplineBarTitle}>İsabetli Şut</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#34D399' }]}>{predictions.shotsOnTarget || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-5', '6-10', '11-15', '16+'].map((range) => {
                  const isSelected = predictions.shotsOnTarget === range;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.shotsOnTarget === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveGreen,
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('shotsOnTarget', range)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} />
            
            {/* Korner - Disiplin Tarzı */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={styles.disciplineBarTitle}>Toplam Korner</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#F59E0B' }]}>{predictions.totalCorners || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-6', '7-10', '11-14', '15+'].map((range) => {
                  const isSelected = predictions.totalCorners === range;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.totalCorners === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveOrange
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('totalCorners', range)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
                        {range}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>

          {/* ═══════════════════════════════════════════════════════════
              9. TAKTİK TAHMİNLERİ - Tempo + Senaryo (Kombine Kart)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardTactical]}
            activeOpacity={1}
            onPress={() => {
              // ✅ Kilitliyse bildirim göster
              if (isPredictionLocked) {
                // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
                setShowLockedWarningModal(true);
              }
            }}
          >
            <View style={styles.cardAccentTactical} />
            
            <View style={styles.combinedCardHeader}>
              <View style={styles.combinedCardTitleRowWithInfo}>
                <View style={styles.combinedCardTitleRow}>
                  <Ionicons name="bulb-outline" size={18} color="#F59E0B" style={{ marginRight: 4 }} />
                  <Text style={styles.combinedCardTitle}>Taktik Tahminleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('tempo') || isCategoryInSelectedFocus('scenario')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {/* ✅ Info butonu - Topluluk istatistikleri */}
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Taktik Tahminleri',
                    generalDescription: 'Maçın taktik yapısını tahmin edin. Oyun temposu ve maç senaryosunu öngörün.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının taktik tahminleri:`,
                    communityStats: [
                      ...communityMatchPredictions.tactics.tempo.map(t => ({
                        label: `${t.type} tempo`,
                        value: `%${t.percentage}`,
                        percentage: t.percentage,
                      })),
                      { label: 'En popüler senaryo', value: `${communityMatchPredictions.tactics.mostPopularScenario} (%${communityMatchPredictions.tactics.scenarioPercentage})`, percentage: communityMatchPredictions.tactics.scenarioPercentage },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.sectionInfoButtonText}>i</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Tempo - İkonlu Butonlar */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Ionicons name="speedometer-outline" size={14} color="#F59E0B" />
                <Text style={styles.disciplineBarTitle}>Oyun Temposu</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#F59E0B' }]}>{predictions.tempo ? predictions.tempo.split(' ')[0] : '?'}</Text>}
              </View>
              <View style={styles.tempoButtonRow}>
                {[
                  { label: 'Düşük', value: 'Düşük tempo', icon: 'remove-circle-outline', color: '#60A5FA' },
                  { label: 'Orta', value: 'Orta tempo', icon: 'pause-circle-outline', color: '#FBBF24' },
                  { label: 'Yüksek', value: 'Yüksek tempo', icon: 'flash-outline', color: '#F87171' },
                ].map((item) => {
                  const isSelected = predictions.tempo === item.value;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.tempo === item.value;
                  const isActive = isSelected || isCommunityTop;
                  return (
                    <TouchableOpacity 
                      key={item.value} 
                      style={[
                        styles.tempoBtn,
                        isActive && [styles.tempoBtnActive, { borderColor: item.color, backgroundColor: `${item.color}15` }],
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('tempo', item.value)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Ionicons name={item.icon as any} size={16} color={isActive ? item.color : '#64748B'} />
                      <Text style={[styles.tempoBtnText, isActive && { color: item.color }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} />
            
            {/* Senaryo - İkonlu Grid */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Ionicons name="git-branch-outline" size={14} color="#A78BFA" />
                <Text style={styles.disciplineBarTitle}>Maç Senaryosu</Text>
              </View>
              <View style={styles.scenarioGrid}>
                {[
                  { label: 'Kontrollü', value: 'Kontrollü oyun', icon: 'shield-checkmark-outline', color: '#60A5FA' },
                  { label: 'Baskılı', value: 'Baskılı oyun', icon: 'arrow-forward-circle-outline', color: '#F87171' },
                  { label: 'Geçiş oyunu', value: 'Geçiş oyunu ağırlıklı', icon: 'swap-horizontal-outline', color: '#34D399' },
                  { label: 'Dengeli maç', value: 'Dengeli maç', icon: 'scale-outline', color: '#A78BFA' },
                ].map((item) => {
                  const isSelected = predictions.scenario === item.value;
                  const isCommunityTop = isViewOnlyMode && communityTopPredictions.scenario === item.value;
                  const isActive = isSelected || isCommunityTop;
                  return (
                    <TouchableOpacity 
                      key={item.value} 
                      style={[
                        styles.scenarioBtn,
                        isActive && [styles.scenarioBtnActive, { borderColor: item.color, backgroundColor: `${item.color}15` }]
                      ]}
                      onPress={() => !isViewOnlyMode && handlePredictionChange('scenario', item.value)}
                      activeOpacity={isViewOnlyMode ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Ionicons name={item.icon as any} size={18} color={isActive ? item.color : '#64748B'} />
                      <Text style={[styles.scenarioBtnText, isActive && { color: item.color }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>

          {/* ✅ Tahmin Kaydet Toolbar - Kadro sekmesiyle tutarlı: [Kilit] [Kaydet Butonu] */}
          {isViewOnlyMode ? (
            // İzleme Modu - Sadece görüntüleme (Kırmızı tema)
            <View style={styles.predictionToolbar}>
              <View style={[styles.submitButton, { flex: 1 }]}>
                <LinearGradient
                  colors={['#7F1D1D', '#450A0A']}
                  style={styles.submitButtonGradient}
                >
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="eye-off" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={[styles.submitButtonText, { color: '#EF4444' }]}>İzleme Modu</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          ) : (
            // Normal Mod - Kilit ve Kaydet butonları
            <View style={styles.predictionToolbar}>
              {/* Kilit Butonu - Solda (sadece aç/kapat, kaydetme yapmaz) */}
              <TouchableOpacity
                style={[
                  styles.predictionLockButton,
                  isPredictionLocked ? styles.predictionLockButtonLocked : styles.predictionLockButtonOpen
                ]}
                onPress={async () => {
                  // ✅ Kilit durumunu değiştir ve AsyncStorage'a kaydet
                  const newLockState = !isPredictionLocked;
                  setIsPredictionLocked(newLockState);
                  
                  // ✅ AsyncStorage'a kilit durumunu kaydet
                  try {
                    const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData.id}`;
                    const existing = await AsyncStorage.getItem(storageKey);
                    if (existing) {
                      const parsed = JSON.parse(existing);
                      parsed.isPredictionLocked = newLockState;
                      await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
                    }
                  } catch (error) {
                    console.warn('Kilit durumu kaydedilemedi:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isPredictionLocked ? "lock-closed" : "lock-open"} 
                  size={20} 
                  color={isPredictionLocked ? '#EF4444' : '#10B981'} 
                />
              </TouchableOpacity>

              {/* Kaydet Butonu - Sağda (flex: 1) */}
              {/* ✅ Bağımsız Tahmin Bonusu Badge */}
              {independentPredictionBonus && !hasViewedCommunityData && hasPrediction && (
                <View style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>+10%</Text>
                </View>
              )}

              {/* Kaydet Butonu - Sağda (flex: 1) */}
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  (isSaving || isPredictionLocked) && styles.submitButtonDisabled
                ]}
                activeOpacity={0.8}
                onPress={handleSavePredictions}
                disabled={isSaving || isPredictionLocked}
              >
                <LinearGradient
                  colors={(isSaving || isPredictionLocked) ? ['#4B5563', '#374151'] : ['#1FA2A6', '#047857']}
                  style={styles.submitButtonGradient}
                >
                  {isSaving ? (
                    <View style={styles.submitButtonLoading}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Kaydediliyor...</Text>
                    </View>
                  ) : isPredictionLocked ? (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="lock-closed" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.submitButtonTextLocked}>Tahminler Kilitli</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Tahminleri Kaydet</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Player Prediction Modal - inline dropdown hemen butonların altında */}
      {selectedPlayer && (
        <PlayerPredictionModal
          player={selectedPlayer}
          predictions={currentPlayerPredictions}
          isPredictionLocked={isPredictionLocked}
          onShowLockedWarning={() => setShowLockedWarningModal(true)}
          onClose={() => setSelectedPlayer(null)}
          onCancel={() => {
            // ✅ İptal Et: Onay dialog'u göster
            if (!selectedPlayer) return;
            
            // Oyuncuya ait tahmin var mı kontrol et
            const hasPredictions = currentPlayerPredictions && Object.keys(currentPlayerPredictions).some(key => {
              const value = currentPlayerPredictions[key];
              return value !== null && value !== undefined && value !== false;
            });
            
            if (hasPredictions) {
              // Tahmin varsa onay iste
              Alert.alert(
                'Tahmini Sil',
                `${selectedPlayer.name} için yaptığınız tüm tahminleri silmek istediğinize emin misiniz?`,
                [
                  {
                    text: 'Vazgeç',
                    style: 'cancel',
                    onPress: () => {} // Hiçbir şey yapma, modal açık kalsın
                  },
                  {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                      // ✅ Onaylandı: Oyuncuya ait tüm tahminleri temizle
                      setPlayerPredictions(prev => {
                        const newPredictions = { ...prev };
                        // Bu oyuncuya ait tüm tahminleri kaldır
                        delete newPredictions[selectedPlayer.id];
                        return newPredictions;
                      });
                      setSelectedPlayer(null);
                      // Kaydedilmemiş değişiklik var
                      if (initialPredictionsLoaded) setHasUnsavedChanges(true);
                    }
                  }
                ],
                { cancelable: true }
              );
            } else {
              // Tahmin yoksa direkt kapat
              setSelectedPlayer(null);
            }
          }}
          onPredictionChange={handlePlayerPredictionChange}
          startingXI={attackPlayersArray}
          reservePlayers={reserveTeamPlayers.length > 0 ? reserveTeamPlayers : allTeamPlayers}
          allPlayerPredictions={playerPredictions}
          onSubstituteConfirm={(type, playerId, minute) => {
            if (!selectedPlayer) return;
            const category = type === 'normal' ? 'substitutePlayer' : 'injurySubstitutePlayer';
            const minuteCategory = type === 'normal' ? 'substituteMinute' : 'injurySubstituteMinute';
            const outCategory = type === 'normal' ? 'substitutedOut' : 'injuredOut';
            
            setPlayerPredictions(prev => {
              const currentPreds = prev[selectedPlayer.id] || {};
              const newPreds: any = {
                ...currentPreds,
                [category]: playerId.toString(),
                [outCategory]: true,
              };
              
              // ✅ Dakika opsiyonel - sadece seçildiyse kaydet
              if (minute) {
                newPreds[minuteCategory] = minute;
              } else {
                newPreds[minuteCategory] = null;
              }
              
              // ✅ Karşılıklı dışlama: Normal değişiklik seçilirse sakatlık temizlenir
              if (type === 'normal') {
                newPreds.injuredOut = null;
                newPreds.injurySubstitutePlayer = null;
                newPreds.injurySubstituteMinute = null;
              }
              // ✅ Karşılıklı dışlama: Sakatlık seçilirse normal değişiklik temizlenir
              if (type === 'injury') {
                newPreds.substitutedOut = null;
                newPreds.substitutePlayer = null;
                newPreds.substituteMinute = null;
              }
              
              return {
                ...prev,
                [selectedPlayer.id]: newPreds
              };
            });
          }}
        />
      )}

      {/* Uygulama içi onay popup (yıldız odaktan çıkar / maksimum odak) */}
      {confirmModal && (
        <ConfirmModal
          visible={true}
          title={confirmModal.title}
          message={confirmModal.message}
          buttons={confirmModal.buttons}
          onRequestClose={() => setConfirmModal(null)}
        />
      )}

      {/* ✅ TAHMİN KARŞILAŞTIRMA POPUP'I - Yeşil/Kırmızı sonuç gösterimi */}
      {comparisonModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setComparisonModal(null)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}>
            <View style={{
              backgroundColor: '#1A2E2A',
              borderRadius: 16,
              width: '100%',
              maxWidth: 400,
              padding: 20,
              borderWidth: 2,
              borderColor: comparisonModal.isCorrect ? '#10B981' : '#EF4444',
            }}>
              {/* Başlık */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons 
                  name={comparisonModal.isCorrect ? 'checkmark-circle' : 'close-circle'} 
                  size={28} 
                  color={comparisonModal.isCorrect ? '#10B981' : '#EF4444'} 
                />
                <Text style={{ 
                  color: comparisonModal.isCorrect ? '#10B981' : '#EF4444', 
                  fontSize: 18, 
                  fontWeight: '700',
                  marginLeft: 8,
                }}>
                  {comparisonModal.isCorrect ? 'Doğru Tahmin!' : 'Yanlış Tahmin'}
                </Text>
              </View>
              
              {/* Kategori */}
              <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 12 }}>
                {comparisonModal.categoryLabel}
              </Text>
              
              {/* Karşılaştırma */}
              <View style={{ 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: 12, 
                padding: 16,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Senin Tahminin</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
                      {comparisonModal.predicted ?? '-'}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#334155' }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Gerçek Sonuç</Text>
                    <Text style={{ 
                      color: comparisonModal.isCorrect ? '#10B981' : '#EF4444', 
                      fontSize: 20, 
                      fontWeight: '700' 
                    }}>
                      {comparisonModal.actual ?? '-'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Kapat butonu */}
              <TouchableOpacity
                onPress={() => setComparisonModal(null)}
                style={{
                  backgroundColor: 'rgba(31, 162, 166, 0.2)',
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1FA2A6', fontSize: 16, fontWeight: '600' }}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ CANLI MAÇ SİNYAL POPUP'I – Scroll yok, 2 sütunlu grid */}
      {signalPopupPlayer && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setSignalPopupPlayer(null)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'flex-end',
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSignalPopupPlayer(null)}
            />
            <View style={{
              backgroundColor: '#0F2A24',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(31, 162, 166, 0.3)',
              paddingBottom: 24,
            }}>
              {/* Header – kompakt */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.1)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pulse" size={22} color="#F59E0B" />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                      {signalPopupPlayer.playerName}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {signalPopupPlayer.positionLabel} – Canlı Sinyaller
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSignalPopupPlayer(null)} hitSlop={12}>
                  <Ionicons name="close-circle" size={26} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Sinyaller – 2 sütun, scroll yok */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                padding: 10,
                justifyContent: 'space-between',
              }}>
                {signalPopupPlayer.signals?.signals
                  .sort((a, b) => b.percentage - a.percentage)
                  .slice(0, 6)
                  .map((signal, idx) => (
                    <TouchableOpacity
                      key={`signal-row-${signal.type}-${idx}`}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (signal.isRealized) return;
                        setSignalJoinModal({
                          signal,
                          signalLabel: SIGNAL_LABELS[signal.type],
                        });
                        setOwnPredictionNote('');
                      }}
                      style={{
                        width: '48%',
                        marginBottom: 8,
                        padding: 10,
                        backgroundColor: signal.isRealized
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        borderWidth: signal.isRealized ? 2 : 1,
                        borderColor: signal.isRealized
                          ? '#10B981'
                          : signal.percentage >= 50 ? SIGNAL_COLORS[signal.type] + '80' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      {signal.isRealized && (
                        <View style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: '#10B981',
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          borderRadius: 6,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 2,
                        }}>
                          <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" />
                          <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>GERÇEKLEŞTİ</Text>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16 }}>{SIGNAL_EMOJIS[signal.type]}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: signal.isRealized ? '#10B981' : '#FFFFFF', marginLeft: 6, flex: 1 }} numberOfLines={1}>
                          {SIGNAL_LABELS[signal.type]}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>
                        {signal.totalVotes} kullanıcı
                        {signal.isRealized && signal.userParticipated && (
                          <Text style={{ color: '#10B981' }}> • +{SIGNAL_BONUS_POINTS[signal.type] ?? 5} puan</Text>
                        )}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{
                          backgroundColor: SIGNAL_COLORS[signal.type] + '30',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: SIGNAL_COLORS[signal.type] }}>
                            %{signal.percentage}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#6B7280' }}>Son 15dk: %{signal.percentageLast15Min}</Text>
                      </View>
                      {!signal.isRealized && (
                        <View style={{
                          marginTop: 6,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: signal.userParticipated ? SIGNAL_COLORS[signal.type] : 'rgba(255,255,255,0.1)',
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: SIGNAL_COLORS[signal.type],
                          alignSelf: 'flex-start',
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: signal.userParticipated ? '#0F2A24' : SIGNAL_COLORS[signal.type] }}>
                            {signal.userParticipated ? '✓ Katıldın' : 'Katıl / Kendi tahminim'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Bilgi notu – Kurallar Bölüm 11 & 13 */}
              <View style={{
                marginHorizontal: 16,
                marginTop: 4,
                padding: 10,
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(249, 115, 22, 0.25)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="information-circle" size={14} color="#F59E0B" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>Sinyal kuralları</Text>
                </View>
                <Text style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 14 }}>
                  • Yüzde ve "Son 15dk" topluluk verisidir. Sinyaller 15 dk geçerlidir (Bölüm 11).{'\n'}
                  • En az {isMockTestMatch(Number(matchId)) ? MIN_USERS_FOR_PERCENTAGE_MOCK : MIN_USERS_FOR_PERCENTAGE} kullanıcı ile anlamlıdır.{'\n'}
                  • "Katıl" ile oylamaya katılın; gerçekleşirse bonus puan alırsınız (Bölüm 13). Çelişkili tahminlerde uyarı gösterilir.{'\n'}
                  • Oyundan çıkma tahmininde dakika +/-5 dk toleranslıdır.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ Sinyal için nested modal: Topluluk verisine katıl VEYA kendi tahminim */}
      {signalJoinModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSignalJoinModal(null)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }} onPress={() => setSignalJoinModal(null)}>
            <Pressable style={{ width: '100%', maxWidth: 340, backgroundColor: '#1A2E2A', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(31, 162, 166, 0.3)', padding: 20 }} onPress={e => e.stopPropagation()}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                {signalJoinModal.signalLabel}
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
                Topluluk verisine katılabilir veya kendi tahmininizi girebilirsiniz.
              </Text>

              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: SIGNAL_COLORS[signalJoinModal.signal.type] + '25',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: SIGNAL_COLORS[signalJoinModal.signal.type],
                  marginBottom: 10,
                }}
                onPress={() => {
                  // Kurallar Bölüm 11: Çelişki kontrolü – katılmadan önce uyarı/engel
                  const participatedTypes = (signalPopupPlayer?.signals?.signals ?? [])
                    .filter(s => s.userParticipated && s.type !== signalJoinModal.signal.type)
                    .map(s => s.type);
                  let conflictResult: { hasConflict: boolean; message: string; blocked: boolean } | null = null;
                  for (const otherType of participatedTypes) {
                    const r = checkSignalConflict(signalJoinModal.signal.type, otherType);
                    if (r) {
                      conflictResult = r;
                      break;
                    }
                  }
                  if (conflictResult?.hasConflict) {
                    Alert.alert(
                      'Çelişkili tahmin',
                      conflictResult.message + (conflictResult.blocked ? '\n\nBu sinyale katılamazsınız.' : '\n\nYine de katılmak istiyor musunuz?'),
                      conflictResult.blocked
                        ? [{ text: 'Tamam' }]
                        : [
                            { text: 'İptal', style: 'cancel' },
                            { text: 'Yine de katıl', onPress: () => { console.log('Sinyal topluluk katılımı:', signalJoinModal.signal.type); setSignalJoinModal(null); } },
                          ]
                    );
                    return;
                  }
                  console.log('Sinyal topluluk katılımı:', signalJoinModal.signal.type);
                  setSignalJoinModal(null);
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: SIGNAL_COLORS[signalJoinModal.signal.type], textAlign: 'center' }}>
                  Topluluk verisine katıl
                </Text>
              </TouchableOpacity>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>Kendi tahminimi gireceğim</Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#FFFFFF',
                    minHeight: 44,
                  }}
                  placeholder="Örn: Bu oyuncu kırmızı kart görecek (isteğe bağlı not)"
                  placeholderTextColor="#64748B"
                  value={ownPredictionNote}
                  onChangeText={setOwnPredictionNote}
                  multiline
                />
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    paddingVertical: 10,
                    backgroundColor: '#1FA2A6',
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    // Kurallar Bölüm 11: Çelişki kontrolü – kendi tahmininde de uyarı
                    const participatedTypes = (signalPopupPlayer?.signals?.signals ?? [])
                      .filter(s => s.userParticipated && s.type !== signalJoinModal.signal.type)
                      .map(s => s.type);
                    let conflictResult: { hasConflict: boolean; message: string; blocked: boolean } | null = null;
                    for (const otherType of participatedTypes) {
                      const r = checkSignalConflict(signalJoinModal.signal.type, otherType);
                      if (r) {
                        conflictResult = r;
                        break;
                      }
                    }
                    if (conflictResult?.hasConflict) {
                      Alert.alert(
                        'Çelişkili tahmin',
                        conflictResult.message + (conflictResult.blocked ? '\n\nBu tahmin kaydedilemez.' : '\n\nYine de kaydetmek istiyor musunuz?'),
                        conflictResult.blocked
                          ? [{ text: 'Tamam' }]
                          : [
                              { text: 'İptal', style: 'cancel' },
                              { text: 'Yine de kaydet', onPress: () => { console.log('Kendi tahmini kaydedildi:', signalJoinModal.signal.type, ownPredictionNote); setSignalJoinModal(null); setOwnPredictionNote(''); } },
                            ]
                      );
                      return;
                    }
                    console.log('Kendi tahmini kaydedildi:', signalJoinModal.signal.type, ownPredictionNote);
                    setSignalJoinModal(null);
                    setOwnPredictionNote('');
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Kaydet</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={{ paddingVertical: 8, alignItems: 'center' }} onPress={() => setSignalJoinModal(null)}>
                <Text style={{ fontSize: 13, color: '#64748B' }}>İptal</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ✅ Web için kilitli uyarı modal'ı (Alert.alert web'de çalışmıyor) */}
      {showLockedWarningModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLockedWarningModal(false)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowLockedWarningModal(false)}
            />
            <View style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              overflow: 'hidden',
              padding: 24,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="lock-closed" size={40} color="#EF4444" />
              </View>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#EF4444',
                textAlign: 'center',
                marginBottom: 12,
              }}>Tahminler Kilitli</Text>
              <Text style={{
                fontSize: 15,
                color: '#E5E7EB',
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 24,
              }}>Oyunculara ve maça ait tahminlerde değişiklik yapmak için sayfanın en altındaki kilidi açın.</Text>
              
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.3)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.6)',
                }}
                onPress={() => setShowLockedWarningModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* 👁️ İZLEME MODU UYARI POPUP - Değiştirme denemesinde gösterilir */}
      {showViewOnlyWarningModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowViewOnlyWarningModal(false)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowViewOnlyWarningModal(false)}
            />
            <View style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.4)',
              overflow: 'hidden',
              padding: 24,
            }}>
              {/* Icon */}
              <View style={{ 
                alignItems: 'center', 
                marginBottom: 16,
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                alignSelf: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="eye-off" size={32} color="#EF4444" />
              </View>

              {/* Title */}
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#EF4444',
                textAlign: 'center',
                marginBottom: 12,
              }}>İzleme Modu</Text>

              {/* Description */}
              <Text style={{
                fontSize: 15,
                color: '#E5E7EB',
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontWeight: '700', color: '#EF4444' }}>Kadro tahmini yapmadığınız</Text> için bu maç için tahmin yapamazsınız.
              </Text>

              {/* Rule Card */}
              <View style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.2)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="time-outline" size={18} color="#10B981" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>Değerlendirme Kuralı</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#94A3B8', lineHeight: 18 }}>
                  Bu maça kadro tahmini yapan kullanıcılar, maç bittikten sonra{' '}
                  <Text style={{ fontWeight: '700', color: '#10B981' }}>24 saat</Text>{' '}
                  boyunca TD ve oyuncuları değerlendirebilir.
                </Text>
              </View>

              {/* Tip Card */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                <Text style={{ flex: 1, fontSize: 13, color: '#94A3B8', lineHeight: 18 }}>
                  Gelecek maçlarda değerlendirme yapabilmek için maç başlamadan önce kadro tahmini yapmalısınız.
                </Text>
              </View>
              
              {/* Close Button */}
              <TouchableOpacity
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                }}
                onPress={() => setShowViewOnlyWarningModal(false)}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}>Anladım, İzlemeye Devam Et</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ OYUNCU BİLGİ POPUP - Kırmızı "i" butonuna tıklanınca açılır */}
      {playerInfoPopup && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setPlayerInfoPopup(null)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPlayerInfoPopup(null)}
            />
            <View style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(31, 162, 166, 0.3)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <View style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(239, 68, 68, 0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontStyle: 'italic' }}>i</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {playerInfoPopup.playerName}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPlayerInfoPopup(null)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={{ padding: 16 }}>
                {/* Pozisyon & Rating */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(31, 162, 166, 0.15)',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Pozisyon</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1FA2A6' }}>{playerInfoPopup.position}</Text>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Reyting</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#F59E0B' }}>{playerInfoPopup.rating ?? '–'}</Text>
                  </View>
                </View>

                {/* Kullanıcı Tahminleri */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981', marginBottom: 8 }}>
                    ✅ Sizin Tahminleriniz
                  </Text>
                  {playerInfoPopup.userPredictions.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      {playerInfoPopup.userPredictions.map((pred, idx) => (
                        <Text key={idx} style={{ fontSize: 14, color: '#E2E8F0' }}>{pred}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                      Bu oyuncu için tahmin yapmadınız
                    </Text>
                  )}
                </View>

                {/* Topluluk Verileri */}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B82F6', marginBottom: 8 }}>
                    📊 Topluluk Tahminleri
                  </Text>
                  {playerInfoPopup.communityData ? (
                    playerInfoPopup.showCommunityData ? (
                      <View style={{ gap: 8 }}>
                        <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
                          {playerInfoPopup.communityData.totalUsers} kullanıcı tahmin yaptı
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {[
                            { label: '⚽ Gol', value: playerInfoPopup.communityData.goal, color: '#10B981' },
                            { label: '🅰️ Asist', value: playerInfoPopup.communityData.assist, color: '#3B82F6' },
                            { label: '🟨 Sarı', value: playerInfoPopup.communityData.yellowCard, color: '#F59E0B' },
                            { label: '🟥 Kırmızı', value: playerInfoPopup.communityData.redCard, color: '#EF4444' },
                          ].map((item, idx) => (
                            <View key={idx} style={{
                              backgroundColor: `${item.color}15`,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: `${item.color}30`,
                            }}>
                              <Text style={{ fontSize: 12, color: '#94A3B8' }}>{item.label}</Text>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: item.color }}>
                                %{Math.round(item.value * 100)}
                              </Text>
                            </View>
                          ))}
                        </View>
                        
                        {/* ✅ Değişiklik Detayları - Çıkar ve Kim Girer */}
                        {playerInfoPopup.communityData.substitutedOut > 0.05 && (
                          <View style={{
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(249, 115, 22, 0.2)',
                            marginTop: 8,
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <Ionicons name="swap-horizontal" size={16} color="#F97316" />
                              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316' }}>
                                Değişiklik Tahmini (%{Math.round(playerInfoPopup.communityData.substitutedOut * 100)})
                              </Text>
                            </View>
                            <View style={{ gap: 6 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
                                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Çıkar:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#E2E8F0' }}>{playerInfoPopup.playerName}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
                                <Text style={{ fontSize: 12, color: '#94A3B8' }}>En çok tahmin edilen giren:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>Yedek Oyuncu</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="time" size={14} color="#60A5FA" />
                                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Tahmin edilen dakika:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#60A5FA' }}>60-75'</Text>
                              </View>
                            </View>
                          </View>
                        )}
                        
                        {/* ✅ Sakatlık Detayları */}
                        {playerInfoPopup.communityData.injuredOut > 0.02 && (
                          <View style={{
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            padding: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(139, 92, 246, 0.2)',
                            marginTop: 8,
                          }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <Ionicons name="medkit" size={16} color="#8B5CF6" />
                              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B5CF6' }}>
                                Sakatlık Riski (%{Math.round(playerInfoPopup.communityData.injuredOut * 100)})
                              </Text>
                            </View>
                            <View style={{ gap: 6 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Risk seviyesi:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: playerInfoPopup.communityData.injuredOut > 0.1 ? '#EF4444' : '#F59E0B' }}>
                                  {playerInfoPopup.communityData.injuredOut > 0.1 ? 'Yüksek' : 'Düşük-Orta'}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
                                <Text style={{ fontSize: 12, color: '#94A3B8' }}>Yerine girer:</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>Acil yedek</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.1)',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}>
                        <Ionicons name="lock-closed" size={20} color="#64748B" />
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
                          Tahminlerinizi kaydedin ve topluluk verilerini görün!
                        </Text>
                      </View>
                    )
                  ) : (
                    <Text style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                      Henüz topluluk verisi yok
                    </Text>
                  )}
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  margin: 16,
                  marginTop: 0,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(31, 162, 166, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(31, 162, 166, 0.4)',
                  alignItems: 'center',
                }}
                onPress={() => setPlayerInfoPopup(null)}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1FA2A6' }}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ BÖLÜM TOPLULUK POPUP - Tahmin bölümlerinin "i" butonlarına tıklanınca */}
      {sectionInfoPopup && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setSectionInfoPopup(null)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSectionInfoPopup(null)}
            />
            <View style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <View style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(239, 68, 68, 0.2)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontStyle: 'italic', fontSize: 13 }}>i</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    {sectionInfoPopup.title}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSectionInfoPopup(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14, lineHeight: 18 }}>
                  {sectionInfoPopup.description}
                </Text>

                {/* Stats */}
                <View style={{ gap: 10 }}>
                  {sectionInfoPopup.stats.map((stat, idx) => (
                    <View key={idx} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      padding: 12,
                      borderRadius: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: stat.percentage > 0 ? '#3B82F6' : '#64748B',
                    }}>
                      <Text style={{ fontSize: 14, color: '#E2E8F0', flex: 1 }}>{stat.label}</Text>
                      <Text style={{ 
                        fontSize: 15, 
                        fontWeight: '700', 
                        color: stat.percentage > 40 ? '#10B981' : stat.percentage > 25 ? '#3B82F6' : '#94A3B8',
                      }}>
                        {stat.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Info Note */}
                <View style={{
                  marginTop: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(100, 116, 139, 0.1)',
                  padding: 10,
                  borderRadius: 8,
                }}>
                  <Ionicons name="people" size={16} color="#64748B" />
                  <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }}>
                    Bu veriler tüm TacticIQ kullanıcılarının tahminlerinden hesaplanmıştır.
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  margin: 16,
                  marginTop: 0,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  alignItems: 'center',
                }}
                onPress={() => setSectionInfoPopup(null)}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ TOPLULUK VERİLERİ ONAY MODAL'I */}
      {/* Kayıt sonrası kullanıcıya topluluk verilerini görmek isteyip istemediğini sorar */}
      {showCommunityConfirmModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCommunityConfirmModal(false)}
          statusBarTranslucent
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowCommunityConfirmModal(false)}
            />
            <View style={{
              width: '100%',
              maxWidth: 380,
              backgroundColor: '#1E3A3A',
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}>
              {/* Header */}
              <LinearGradient
                colors={['#065F46', '#064E3B']}
                style={{ padding: 18 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                      Tahminler Kaydedildi!
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowCommunityConfirmModal(false)}>
                    <Ionicons name="close" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Content */}
              <View style={{ padding: 18 }}>
                <Text style={{ fontSize: 15, color: '#E2E8F0', lineHeight: 22, marginBottom: 16 }}>
                  Tahminleriniz başarıyla kaydedildi. Şimdi ne yapmak istersiniz?
                </Text>

                {/* Option 1: View Community Data */}
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                  onPress={async () => {
                    // Topluluk verilerini gör - tahminleri kalıcı kilitle
                    setHasViewedCommunityData(true);
                    setIndependentPredictionBonus(false);
                    setShowCommunityConfirmModal(false);
                    
                    // AsyncStorage'a kaydet
                    try {
                      const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
                      const existingData = await AsyncStorage.getItem(storageKey);
                      if (existingData) {
                        const parsed = JSON.parse(existingData);
                        parsed.hasViewedCommunityData = true;
                        parsed.independentPredictionBonus = false;
                        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
                      }
                    } catch (e) {
                      console.warn('Topluluk verileri durumu kaydedilemedi:', e);
                    }
                    
                    Alert.alert(
                      'Topluluk Verileri Aktif',
                      'Artık topluluk tahminlerini görebilirsiniz. Tahminleriniz kalıcı olarak kilitlendi.',
                      [{ text: 'Tamam' }]
                    );
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="people" size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#3B82F6' }}>
                        Topluluk Verilerini Gör
                      </Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                        Diğer kullanıcıların tahminlerini görün
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    marginTop: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    padding: 8,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Ionicons name="warning" size={14} color="#EF4444" />
                    <Text style={{ fontSize: 11, color: '#EF4444', flex: 1 }}>
                      DİKKAT: Tahminleriniz kalıcı olarak kilitlenecek!
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Continue Without */}
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  }}
                  onPress={() => {
                    setShowCommunityConfirmModal(false);
                    Alert.alert(
                      'Bağımsız Tahmin Bonusu Aktif!',
                      'Topluluk verilerini görmeden devam ediyorsunuz. Maç başlayana kadar analiz odağı tahminlerinizi değiştirebilirsiniz. Doğru tahminlerde +%10 bonus kazanırsınız!',
                      [{ text: 'Harika!' }]
                    );
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#10B981' }}>
                        Bağımsız Devam Et
                      </Text>
                      <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                        Topluluk verilerini görmeden devam et
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    marginTop: 10,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    padding: 8,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={{ fontSize: 11, color: '#F59E0B', flex: 1 }}>
                      +%10 Bağımsız Tahmin Bonusu kazanırsınız!
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Info Note */}
                <View style={{
                  marginTop: 14,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  backgroundColor: 'rgba(100, 116, 139, 0.1)',
                  padding: 10,
                  borderRadius: 8,
                }}>
                  <Ionicons name="information-circle" size={16} color="#64748B" style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1, lineHeight: 16 }}>
                    Bağımsız devam ederseniz maç başlayana kadar sadece analiz odağı tahminlerinizi değiştirebilirsiniz.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
};

// Dakika aralıkları (inline dropdown ile ortak) - 8 dilim: 0+ dan 90+ ya kadar
const SUBSTITUTE_MINUTE_RANGES = [
  { label: '0-15', value: '0-15' },
  { label: '16-30', value: '16-30' },
  { label: '31-45', value: '31-45' },
  { label: '45+', value: '45+' },
  { label: '46-60', value: '46-60' },
  { label: '61-75', value: '61-75' },
  { label: '76-90', value: '76-90' },
  { label: '90+', value: '90+' },
];

// Maç tahminleri için zaman aralıkları - aynı stil (8 dilim)
const MATCH_TIME_RANGES = [
  { label: '0-15', value: '0-15 dk' },
  { label: '16-30', value: '16-30 dk' },
  { label: '31-45', value: '31-45 dk' },
  { label: '45+', value: '45+ dk' },
  { label: '46-60', value: '46-60 dk' },
  { label: '61-75', value: '61-75 dk' },
  { label: '76-90', value: '76-90 dk' },
  { label: '90+', value: '90+ dk' },
];

// Player Prediction Modal - inline dropdown hemen "Oyundan Çıkar" / "Sakatlanarak Çıkar" butonlarının altında
const PlayerPredictionModal = ({
  player,
  predictions,
  onClose,
  onCancel,
  onPredictionChange,
  startingXI = [],
  reservePlayers = [],
  onSubstituteConfirm,
  allPlayerPredictions = {},
  isPredictionLocked = false,
  onShowLockedWarning,
}: {
  player: any;
  predictions: any;
  onClose: () => void;
  onCancel?: () => void;
  onPredictionChange: (category: string, value: string | boolean) => void;
  startingXI?: any[];
  reservePlayers?: any[];
  onSubstituteConfirm?: (type: 'normal' | 'injury', playerId: string, minute: string) => void;
  allPlayerPredictions?: Record<string | number, any>;
  isPredictionLocked?: boolean;
  onShowLockedWarning?: () => void;
}) => {
  const [expandedSubstituteType, setExpandedSubstituteType] = useState<'normal' | 'injury' | null>(null);
  const [localSubstituteId, setLocalSubstituteId] = useState<string | null>(null);
  const [localMinuteRange, setLocalMinuteRange] = useState<string | null>(null);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const saveButtonRef = useRef<TouchableOpacity>(null);

  // ✅ Çıkan oyuncunun pozisyonuna göre uygun yedekleri filtrele
  // Zaten başka bir oyuncunun yerine girecek olarak seçilmiş oyuncuları da çıkar
  const availableSubstitutes = useMemo(() => {
    const startingXIIds = new Set((startingXI || []).map((p: any) => p.id));
    const allReserves = (reservePlayers || []).filter((p: any) => !startingXIIds.has(p.id));
    
    // ✅ Zaten başka bir oyuncunun yedeği olarak seçilmiş oyuncuları topla
    const alreadySelectedAsSubstitute = new Set<string>();
    Object.entries(allPlayerPredictions || {}).forEach(([playerId, preds]) => {
      // Bu oyuncunun kendi tahmini değilse, yedek olarak seçileni bul
      if (String(playerId) !== String(player.id)) {
        if (preds?.substitutePlayer) alreadySelectedAsSubstitute.add(String(preds.substitutePlayer));
        if (preds?.injurySubstitutePlayer) alreadySelectedAsSubstitute.add(String(preds.injurySubstitutePlayer));
      }
    });
    
    // Çıkan oyuncu kaleci ise sadece kalecileri, oyuncu ise sadece oyuncuları göster
    const isPlayerGK = isGoalkeeperPlayer(player);
    return allReserves.filter((p: any) => {
      const isSubstituteGK = isGoalkeeperPlayer(p);
      if (isPlayerGK !== isSubstituteGK) return false; // Aynı tip olmalı
      // ✅ Zaten başka birinin yerine girecekse gösterme
      if (alreadySelectedAsSubstitute.has(String(p.id))) return false;
      return true;
    });
  }, [startingXI, reservePlayers, player, allPlayerPredictions]);

  const getSubstituteName = (id: string | null) =>
    id ? (reservePlayers || []).find((p: any) => p.id.toString() === id)?.name : null;

  const openDropdown = (type: 'normal' | 'injury') => {
    // ✅ Kilit kontrolü: Tahminler kilitliyken bilgilendirme göster
    if (isPredictionLocked) {
      // Web için özel modal kullan (Alert.alert web'de çalışmıyor)
      if (onShowLockedWarning) {
        onShowLockedWarning();
      }
      return;
    }
    
    // ✅ Eğer aynı tip tahmin zaten varsa, tahmini geri al (sarı kart gibi toggle)
    // Dakika opsiyonel - sadece oyuncu seçildiyse de toggle çalışır
    if (type === 'normal' && predictions.substitutePlayer) {
      // Normal değişiklik tahmini varsa, geri al
      onPredictionChange('substitutedOut', false);
      onPredictionChange('substitutePlayer', null);
      onPredictionChange('substituteMinute', null);
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    if (type === 'injury' && predictions.injurySubstitutePlayer) {
      // Sakatlık tahmini varsa, geri al
      onPredictionChange('injuredOut', false);
      onPredictionChange('injurySubstitutePlayer', null);
      onPredictionChange('injurySubstituteMinute', null);
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    // ✅ Dropdown açık/kapalı toggle
    if (expandedSubstituteType === type) {
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    // ✅ Karşılıklı dışlama: Diğer seçeneği temizle (önce temizle, sonra dropdown aç)
    let shouldClearLocalState = false;
    if (type === 'normal' && (predictions.injuredOut || predictions.injurySubstitutePlayer)) {
      // Sakatlık seçiliyse, önce onu temizle
      onPredictionChange('injuredOut', false);
      onPredictionChange('injurySubstitutePlayer', null);
      onPredictionChange('injurySubstituteMinute', null);
      shouldClearLocalState = true;
    } else if (type === 'injury' && (predictions.substitutedOut || predictions.substitutePlayer)) {
      // Normal değişiklik seçiliyse, önce onu temizle
      onPredictionChange('substitutedOut', false);
      onPredictionChange('substitutePlayer', null);
      onPredictionChange('substituteMinute', null);
      shouldClearLocalState = true;
    }
    
    // ✅ Dropdown'ı aç ve mevcut tahmin varsa göster
    setExpandedSubstituteType(type);
    setShowPlayerDropdown(false); // Diğer dropdown'ı kapat
    
    // Eğer karşılıklı dışlama nedeniyle temizlendiyse, local state'i de temizle
    if (shouldClearLocalState) {
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
    } else {
      // Mevcut tahmin varsa göster
      const currentId = type === 'normal' ? predictions.substitutePlayer : predictions.injurySubstitutePlayer;
      const currentMin = type === 'normal' ? predictions.substituteMinute : predictions.injurySubstituteMinute;
      setLocalSubstituteId(currentId || null);
      setLocalMinuteRange(currentMin || null);
    }
  };

  // ✅ Dropdown açıldığında kaydet butonuna scroll yap (onLayout ile daha hassas kontrol)
  React.useEffect(() => {
    if (expandedSubstituteType && scrollViewRef.current) {
      // Kısa bir gecikme ile scroll yap (dropdown render olsun)
      // onLayout daha hassas kontrol sağlar ama bu da yedek olarak çalışır
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [expandedSubstituteType]);

  // ✅ Otomatik kaydet - hem oyuncu hem dakika seçildiğinde (kullanıcıya seçim değiştirme şansı vermek için)
  React.useEffect(() => {
    if (!isPredictionLocked && expandedSubstituteType && localSubstituteId && localMinuteRange && onSubstituteConfirm) {
      // Hem oyuncu hem dakika seçildiğinde otomatik kaydet (kullanıcı seçimini değiştirebilmesi için daha uzun gecikme)
      const timer = setTimeout(() => {
        onSubstituteConfirm(expandedSubstituteType, localSubstituteId, localMinuteRange);
        // Dropdown'ı kapat ama seçimi göster
        setExpandedSubstituteType(null);
        setShowPlayerDropdown(false);
        // Local state'i temizleme - kaydedildiğini göstermek için
      }, 2000); // 2 saniye gecikme - kullanıcıya seçim değiştirme şansı ver
      return () => clearTimeout(timer);
    }
  }, [isPredictionLocked, expandedSubstituteType, localSubstituteId, localMinuteRange, onSubstituteConfirm]);

  // ✅ Tek satır bildirim metni - Çıkar: x Girer: x dk 1-15 formatında (dakika opsiyonel)
  const buttonLabelNormal = predictions.substitutePlayer
    ? (
        <View style={styles.substituteButtonSingleLine}>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-down" size={14} color="#EF4444" />
            <Text style={styles.substituteButtonLabel}>Çıkar:</Text>
            <Text style={styles.substituteButtonPlayerNameSingle}>{player.name.split(' ').pop()}</Text>
          </View>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-up" size={14} color="#10B981" />
            <Text style={styles.substituteButtonLabel}>Girer:</Text>
            <Text style={styles.substituteButtonSubstituteNameSingle}>{getSubstituteName(predictions.substitutePlayer)?.split(' ').pop()}</Text>
          </View>
          {predictions.substituteMinute && (
            <View style={styles.substituteButtonSingleRow}>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.substituteMinute}</Text>
            </View>
          )}
        </View>
      )
    : 'Oyundan Çıkar';
  const buttonLabelInjury = predictions.injurySubstitutePlayer
    ? (
        <View style={styles.substituteButtonSingleLine}>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-down" size={14} color="#EF4444" />
            <Text style={styles.substituteButtonLabel}>Çıkar:</Text>
            <Text style={styles.substituteButtonPlayerNameSingle}>{player.name.split(' ').pop()}</Text>
          </View>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-up" size={14} color="#10B981" />
            <Text style={styles.substituteButtonLabel}>Girer:</Text>
            <Text style={styles.substituteButtonSubstituteNameSingle}>{getSubstituteName(predictions.injurySubstitutePlayer)?.split(' ').pop()}</Text>
          </View>
          {predictions.injurySubstituteMinute && (
            <View style={styles.substituteButtonSingleRow}>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.injurySubstituteMinute}</Text>
            </View>
          )}
        </View>
      )
    : 'Sakatlanarak Çıkar';

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={isWeb ? undefined : SlideInDown.duration(300)}
          exiting={isWeb ? undefined : SlideOutDown.duration(300)}
          style={styles.playerModalContent}
        >
          <LinearGradient
            colors={['#1E3A3A', '#0F2A24']}
            style={styles.playerModalHeader}
          >
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerModalInfo}>
              <View style={styles.playerNumberCircle}>
                <Text style={styles.playerNumberLarge}>{player.number}</Text>
                <View style={styles.playerRatingCircle}>
                  <Text style={styles.playerRatingSmall}>{player.rating}</Text>
                </View>
              </View>

              <View style={styles.playerDetails}>
                <Text style={styles.playerNameLarge}>{player.name}</Text>
                <Text style={styles.playerPositionModal}>
                  {player.position} • Form: <Text style={styles.formText}>{player.form}%</Text>
                </Text>
              </View>
            </View>
            {/* Tahmin yapılan oyuncu her zaman görünsün */}
            <View style={styles.tahminYapilanOyuncuBar}>
              <Ionicons name="person" size={14} color="#1FA2A6" />
              <Text style={styles.tahminYapilanOyuncuText}>Tahmin: {player.name}</Text>
            </View>
          </LinearGradient>

          {expandedSubstituteType ? (
            <ScrollView
              ref={scrollViewRef}
              style={styles.playerPredictionsScroll}
              contentContainerStyle={styles.playerPredictionsContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {/* Gol Atar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willScore && styles.predictionButtonActive,
                ]}
                onPress={() => onPredictionChange('willScore', true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.willScore && styles.predictionButtonTextActive,
                ]}>
                  ⚽ Gol Atar
                </Text>
              </TouchableOpacity>

              <View style={styles.subOptions}>
                <Text style={styles.subOptionsLabel}>Kaç gol?</Text>
                <View style={styles.subOptionsRow}>
                  {['1', '2', '3+'].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.subOptionButton,
                        predictions.goalCount === count && styles.subOptionButtonActive,
                      ]}
                      onPress={() => onPredictionChange('goalCount', count)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.subOptionText,
                        predictions.goalCount === count && styles.subOptionTextActive,
                      ]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Asist Yapar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willAssist && styles.predictionButtonActive,
                ]}
                onPress={() => onPredictionChange('willAssist', true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.willAssist && styles.predictionButtonTextActive,
                ]}>
                  🅰️ Asist Yapar
                </Text>
              </TouchableOpacity>

              <View style={styles.subOptions}>
                <Text style={styles.subOptionsLabel}>Kaç asist?</Text>
                <View style={styles.subOptionsRow}>
                  {['1', '2', '3+'].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.subOptionButton,
                        predictions.assistCount === count && styles.subOptionButtonActive,
                      ]}
                      onPress={() => onPredictionChange('assistCount', count)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.subOptionText,
                        predictions.assistCount === count && styles.subOptionTextActive,
                      ]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Sarı Kart */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.yellowCard && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('yellowCard', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.yellowCard && styles.predictionButtonTextActive,
              ]}>
                🟨 Sarı Kart Görür
              </Text>
            </TouchableOpacity>

            {/* 2. Sarıdan Kırmızı */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.secondYellowRed && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('secondYellowRed', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.secondYellowRed && styles.predictionButtonTextActive,
              ]}>
                🟨🟥 2. Sarıdan Kırmızı
              </Text>
            </TouchableOpacity>

            {/* Direkt Kırmızı */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.directRedCard && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('directRedCard', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.directRedCard && styles.predictionButtonTextActive,
              ]}>
                🟥 Direkt Kırmızı Kart
              </Text>
            </TouchableOpacity>

            {/* Oyundan Çıkar - butonun hemen altında dropdown */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.substitutedOut && styles.predictionButtonActive,
                  isPredictionLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => openDropdown('normal')}
                hitSlop={16}
                disabled={isPredictionLocked}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <View style={styles.predictionButtonContent}>
                    {isPredictionLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[
                      styles.predictionButtonText,
                      predictions.substitutedOut && styles.predictionButtonTextActive,
                      isPredictionLocked && styles.predictionButtonTextDisabled,
                    ]}>
                      🔄 {buttonLabelNormal}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.predictionButtonContent}>
                    {isPredictionLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    {buttonLabelNormal}
                  </View>
                )}
              </Pressable>

              {expandedSubstituteType === 'normal' && !isPredictionLocked && (
                <View style={styles.inlineSubstituteDropdown}>
                  <Text style={styles.inlineSubstituteTitle}>Yerine girecek oyuncu & dakika aralığı</Text>
                  
                  {/* Oyuncu Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Yerine Girecek Oyuncu</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownButtonContent}>
                        {localSubstituteId ? (
                          <>
                            <View style={styles.dropdownSelectedPlayer}>
                              <View style={styles.dropdownPlayerNumber}>
                                <Text style={styles.dropdownPlayerNumberText}>
                                  {availableSubstitutes.find((p: any) => p.id.toString() === localSubstituteId)?.number || ''}
                                </Text>
                              </View>
                              <Text style={styles.dropdownSelectedText}>
                                {getSubstituteName(localSubstituteId)}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.dropdownPlaceholder}>Oyuncu seçin...</Text>
                        )}
                        <Ionicons 
                          name={showPlayerDropdown ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showPlayerDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableSubstitutes.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                            <Text style={styles.dropdownEmptyText}>
                              {isGoalkeeperPlayer(player) 
                                ? 'Yedek kaleci bulunamadı. Kaleci sadece kaleci ile değiştirilebilir.'
                                : 'Yedek oyuncu bulunamadı. Oyuncu sadece oyuncu ile değiştirilebilir.'}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={availableSubstitutes}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                              const isSelected = localSubstituteId === item.id.toString();
                              return (
                                <TouchableOpacity
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemSelected]}
                                  onPress={() => {
                                    setLocalSubstituteId(item.id.toString());
                                    setShowPlayerDropdown(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownMenuItemContent}>
                                    <View style={styles.dropdownPlayerNumberSmall}>
                                      <Text style={styles.dropdownPlayerNumberTextSmall}>{item.number}</Text>
                                    </View>
                                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextSelected]}>
                                      {item.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            }}
                            style={styles.dropdownMenuList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Dakika Aralığı - seçim sadece renkle gösterilir */}
                  <View style={styles.minuteRangeContainer}>
                    <Text style={styles.dropdownLabel}>Değişiklik Dakikası</Text>
                    <View style={styles.minuteRanges2RowGridCompact}>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(0, 4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => setLocalMinuteRange(range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => setLocalMinuteRange(range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                  
                  {/* Bilgilendirme: Seçim durumu */}
                  {localSubstituteId && (
                    <View style={styles.autoSaveInfo}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.autoSaveInfoText}>
                        {localMinuteRange 
                          ? 'Hem oyuncu hem dakika seçildi - otomatik kaydedilecek' 
                          : 'Oyuncu seçildi - dakika seçebilir veya kaydet butonuna basabilirsiniz'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Manuel Kaydet Butonu - Sadece oyuncu seçildiyse göster */}
                  {localSubstituteId && (
                    <TouchableOpacity
                      ref={expandedSubstituteType === 'normal' ? saveButtonRef : null}
                      style={[
                        styles.manualSaveButton,
                        isPredictionLocked && styles.manualSaveButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isPredictionLocked && onSubstituteConfirm && expandedSubstituteType === 'normal' && localSubstituteId) {
                          onSubstituteConfirm('normal', localSubstituteId, localMinuteRange || null);
                          setExpandedSubstituteType(null);
                          setShowPlayerDropdown(false);
                        }
                      }}
                      onLayout={() => {
                        // Kaydet butonu render olduğunda scroll yap
                        if (expandedSubstituteType === 'normal' && scrollViewRef.current) {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }
                      }}
                      activeOpacity={isPredictionLocked ? 1 : 0.7}
                      disabled={isPredictionLocked}
                    >
                      <Text style={[
                        styles.manualSaveButtonText,
                        isPredictionLocked && styles.manualSaveButtonTextDisabled,
                      ]}>Kaydet</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Sakatlanarak Çıkar - butonun hemen altında dropdown */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.injuredOut && styles.predictionButtonActive,
                  isPredictionLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => openDropdown('injury')}
                hitSlop={16}
                disabled={isPredictionLocked}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <View style={styles.predictionButtonContent}>
                    {isPredictionLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[
                      styles.predictionButtonText,
                      predictions.injuredOut && styles.predictionButtonTextActive,
                      isPredictionLocked && styles.predictionButtonTextDisabled,
                    ]}>
                      🚑 {buttonLabelInjury}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.predictionButtonContent}>
                    {isPredictionLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    {buttonLabelInjury}
                  </View>
                )}
              </Pressable>

              {expandedSubstituteType === 'injury' && !isPredictionLocked && (
                <View style={styles.inlineSubstituteDropdown}>
                  <Text style={styles.inlineSubstituteTitle}>Yerine girecek oyuncu & dakika aralığı</Text>
                  
                  {/* Oyuncu Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Yerine Girecek Oyuncu</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownButtonContent}>
                        {localSubstituteId ? (
                          <>
                            <View style={styles.dropdownSelectedPlayer}>
                              <View style={styles.dropdownPlayerNumber}>
                                <Text style={styles.dropdownPlayerNumberText}>
                                  {availableSubstitutes.find((p: any) => p.id.toString() === localSubstituteId)?.number || ''}
                                </Text>
                              </View>
                              <Text style={styles.dropdownSelectedText}>
                                {getSubstituteName(localSubstituteId)}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.dropdownPlaceholder}>Oyuncu seçin...</Text>
                        )}
                        <Ionicons 
                          name={showPlayerDropdown ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showPlayerDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableSubstitutes.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                            <Text style={styles.dropdownEmptyText}>
                              {isGoalkeeperPlayer(player) 
                                ? 'Yedek kaleci bulunamadı. Kaleci sadece kaleci ile değiştirilebilir.'
                                : 'Yedek oyuncu bulunamadı. Oyuncu sadece oyuncu ile değiştirilebilir.'}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={availableSubstitutes}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                              const isSelected = localSubstituteId === item.id.toString();
                              return (
                                <TouchableOpacity
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemSelected]}
                                  onPress={() => {
                                    setLocalSubstituteId(item.id.toString());
                                    setShowPlayerDropdown(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownMenuItemContent}>
                                    <View style={styles.dropdownPlayerNumberSmall}>
                                      <Text style={styles.dropdownPlayerNumberTextSmall}>{item.number}</Text>
                                    </View>
                                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextSelected]}>
                                      {item.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            }}
                            style={styles.dropdownMenuList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Dakika Aralığı - seçim sadece renkle gösterilir */}
                  <View style={styles.minuteRangeContainer}>
                    <Text style={styles.dropdownLabel}>Değişiklik Dakikası</Text>
                    <View style={styles.minuteRanges2RowGridCompact}>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(0, 4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => setLocalMinuteRange(range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => setLocalMinuteRange(range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                  
                  {/* Bilgilendirme: Seçim durumu */}
                  {localSubstituteId && (
                    <View style={styles.autoSaveInfo}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.autoSaveInfoText}>
                        {localMinuteRange 
                          ? 'Hem oyuncu hem dakika seçildi - otomatik kaydedilecek' 
                          : 'Oyuncu seçildi - dakika seçebilir veya kaydet butonuna basabilirsiniz'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Manuel Kaydet Butonu - Sadece oyuncu seçildiyse göster */}
                  {localSubstituteId && (
                    <TouchableOpacity
                      ref={expandedSubstituteType === 'injury' ? saveButtonRef : null}
                      style={[
                        styles.manualSaveButton,
                        isPredictionLocked && styles.manualSaveButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isPredictionLocked && onSubstituteConfirm && expandedSubstituteType === 'injury' && localSubstituteId) {
                          onSubstituteConfirm('injury', localSubstituteId, localMinuteRange || null);
                          setExpandedSubstituteType(null);
                          setShowPlayerDropdown(false);
                        }
                      }}
                      onLayout={() => {
                        // Kaydet butonu render olduğunda scroll yap
                        if (expandedSubstituteType === 'injury' && scrollViewRef.current) {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }
                      }}
                      activeOpacity={isPredictionLocked ? 1 : 0.7}
                      disabled={isPredictionLocked}
                    >
                      <Text style={[
                        styles.manualSaveButtonText,
                        isPredictionLocked && styles.manualSaveButtonTextDisabled,
                      ]}>Kaydet</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            </ScrollView>
          ) : (
            <View style={styles.playerPredictionsScroll}>
              <View style={styles.playerPredictionsContent}>
            {/* Gol Atar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willScore && styles.predictionButtonActive,
                ]}
                onPress={() => onPredictionChange('willScore', true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.willScore && styles.predictionButtonTextActive,
                ]}>
                  ⚽ Gol Atar
                </Text>
              </TouchableOpacity>

              <View style={styles.subOptions}>
                <Text style={styles.subOptionsLabel}>Kaç gol?</Text>
                <View style={styles.subOptionsRow}>
                  {['1', '2', '3+'].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.subOptionButton,
                        predictions.goalCount === count && styles.subOptionButtonActive,
                      ]}
                      onPress={() => onPredictionChange('goalCount', count)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.subOptionText,
                        predictions.goalCount === count && styles.subOptionTextActive,
                      ]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Asist Yapar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willAssist && styles.predictionButtonActive,
                ]}
                onPress={() => onPredictionChange('willAssist', true)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.willAssist && styles.predictionButtonTextActive,
                ]}>
                  🅰️ Asist Yapar
                </Text>
              </TouchableOpacity>

              <View style={styles.subOptions}>
                <Text style={styles.subOptionsLabel}>Kaç asist?</Text>
                <View style={styles.subOptionsRow}>
                  {['1', '2', '3+'].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.subOptionButton,
                        predictions.assistCount === count && styles.subOptionButtonActive,
                      ]}
                      onPress={() => onPredictionChange('assistCount', count)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.subOptionText,
                        predictions.assistCount === count && styles.subOptionTextActive,
                      ]}>
                        {count}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Sarı Kart */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.yellowCard && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('yellowCard', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.yellowCard && styles.predictionButtonTextActive,
              ]}>
                🟨 Sarı Kart Görür
              </Text>
            </TouchableOpacity>

            {/* 2. Sarıdan Kırmızı */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.secondYellowRed && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('secondYellowRed', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.secondYellowRed && styles.predictionButtonTextActive,
              ]}>
                🟨🟥 2. Sarıdan Kırmızı
              </Text>
            </TouchableOpacity>

            {/* Direkt Kırmızı */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.directRedCard && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('directRedCard', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.directRedCard && styles.predictionButtonTextActive,
              ]}>
                🟥 Direkt Kırmızı Kart
              </Text>
            </TouchableOpacity>

            {/* Oyundan Çıkar */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.substitutedOut && styles.predictionButtonActive,
                  isPredictionLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => openDropdown('normal')}
                hitSlop={16}
                disabled={isPredictionLocked}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.substitutedOut && styles.predictionButtonTextActive,
                    isPredictionLocked && styles.predictionButtonTextDisabled,
                  ]}>
                    🔄 {buttonLabelNormal}
                  </Text>
                ) : (
                  buttonLabelNormal
                )}
              </Pressable>
            </View>

            {/* Sakatlanarak Çıkar */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.injuredOut && styles.predictionButtonActive,
                  isPredictionLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => openDropdown('injury')}
                hitSlop={16}
                disabled={isPredictionLocked}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.injuredOut && styles.predictionButtonTextActive,
                    isPredictionLocked && styles.predictionButtonTextDisabled,
                  ]}>
                    🚑 {buttonLabelInjury}
                  </Text>
                ) : (
                  buttonLabelInjury
                )}
              </Pressable>
            </View>
              </View>
            </View>
          )}

          <View style={styles.playerModalActions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                // ✅ İptal Et: Oyuncuya ait tüm tahminleri temizle ve modal'ı kapat
                if (onCancel) {
                  onCancel();
                } else {
                  onClose();
                }
              }} 
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                isPredictionLocked && styles.saveButtonDisabled,
              ]} 
              onPress={isPredictionLocked ? undefined : onClose} 
              activeOpacity={isPredictionLocked ? 1 : 0.8}
              disabled={isPredictionLocked}
            >
              <LinearGradient 
                colors={isPredictionLocked ? ['#4B5563', '#374151'] : ['#1FA2A6', '#047857']} 
                style={styles.saveButtonGradient}
              >
                {isPredictionLocked ? (
                  <View style={styles.saveButtonContent}>
                    <Ionicons name="lock-closed" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.saveButtonTextLocked}>
                      Tahminler Kilitli
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>
                    Kaydet
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Substitute Selection Modal - Yedek seçimi + Dakika seçimi + Kaydet/İptal
const SubstituteModal = ({ visible, players, startingXI = [], type, playerName, selectedSubstitute, selectedMinute, onSave, onClose }: any) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(selectedSubstitute || null);
  const [selectedMinuteRange, setSelectedMinuteRange] = useState<string | null>(selectedMinute || null);

  // ✅ İlk 11'deki oyuncuları filtrele - sadece yedekler gösterilsin
  const availableSubstitutes = useMemo(() => {
    const startingXIIds = new Set(startingXI.map((p: any) => p.id));
    return players.filter((p: any) => !startingXIIds.has(p.id));
  }, [players, startingXI]);

  // ✅ Dakika aralıkları (10 dakikalık)
  const minuteRanges = [
    { label: '1-10', value: '1-10' },
    { label: '11-20', value: '11-20' },
    { label: '21-30', value: '21-30' },
    { label: '31-40', value: '31-40' },
    { label: '41-50', value: '41-50' },
    { label: '51-60', value: '51-60' },
    { label: '61-70', value: '61-70' },
    { label: '71-80', value: '71-80' },
    { label: '81-90+', value: '81-90+' },
  ];

  React.useEffect(() => {
    if (visible) {
      setSelectedPlayerId(selectedSubstitute || null);
      setSelectedMinuteRange(selectedMinute || null);
    }
  }, [visible, selectedSubstitute, selectedMinute]);

  const handleSave = () => {
    if (selectedPlayerId && selectedMinuteRange) {
      onSave(selectedPlayerId, selectedMinuteRange);
    }
  };

  return (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <Animated.View 
        entering={isWeb ? undefined : SlideInDown.duration(300)}
        exiting={isWeb ? undefined : SlideOutDown.duration(300)}
        style={styles.substituteModalContent}
      >
        <View style={styles.substituteModalHeader}>
          <View>
            <Text style={styles.substituteModalTitle}>
              {type === 'normal' ? 'Oyundan Çıkar' : 'Sakatlanarak Çıkar'}
            </Text>
            {playerName && (
              <Text style={styles.substituteModalSubtitle}>
                {playerName} için yedek ve dakika seçin
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.substituteModalScroll}
          contentContainerStyle={styles.substituteModalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Yerine Kim Girer? */}
          <View style={styles.substituteSection}>
            <Text style={styles.substituteSectionTitle}>Yerine Kim Girer?</Text>
            <Text style={styles.substituteSectionHint}>Yedeklerden seçin (İlk 11'dekiler listede yok)</Text>
            {availableSubstitutes.length === 0 ? (
              <View style={styles.noSubstitutes}>
                <Ionicons name="alert-circle" size={24} color="#64748B" />
                <Text style={styles.noSubstitutesText}>Yedek oyuncu bulunamadı</Text>
              </View>
            ) : (
              <View style={styles.substituteList}>
                {availableSubstitutes.map((item: any) => {
                  const isSelected = selectedPlayerId === item.id.toString();
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.substituteItem,
                        isSelected && styles.substituteItemSelected
                      ]}
                      onPress={() => setSelectedPlayerId(item.id.toString())}
                      activeOpacity={0.7}
                    >
                      <View style={styles.substituteItemLeft}>
                        <View style={styles.substituteNumber}>
                          <Text style={styles.substituteNumberText}>{item.number}</Text>
                        </View>
                        <View style={styles.substituteInfo}>
                          <Text style={styles.substituteName}>{item.name}</Text>
                          <Text style={styles.substitutePosition}>
                            {item.position} • {item.rating}
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name={isSelected ? "checkmark-circle" : "add-circle-outline"} 
                        size={24} 
                        color={isSelected ? "#1FA2A6" : "#6B7280"} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Değişiklik Dakikası - 2 satır halinde */}
          <View style={styles.substituteSection}>
            <Text style={styles.substituteSectionTitle}>Değişiklik Dakikası</Text>
            <View style={styles.minuteRanges2RowGrid}>
              {/* İlk satır: 0-45 (ilk yarı) */}
              <View style={styles.minuteRangesRow}>
                {minuteRanges.slice(0, 5).map((range) => {
                  const isSelected = selectedMinuteRange === range.value;
                  return (
                    <TouchableOpacity
                      key={range.value}
                      style={[
                        styles.minuteRangeButton2Row,
                        isSelected && styles.minuteRangeButtonSelected
                      ]}
                      onPress={() => setSelectedMinuteRange(range.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.minuteRangeText,
                        isSelected && styles.minuteRangeTextSelected
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* İkinci satır: 46-90+ (ikinci yarı) */}
              <View style={styles.minuteRangesRow}>
                {minuteRanges.slice(5).map((range) => {
                  const isSelected = selectedMinuteRange === range.value;
                  return (
                    <TouchableOpacity
                      key={range.value}
                      style={[
                        styles.minuteRangeButton2Row,
                        isSelected && styles.minuteRangeButtonSelected
                      ]}
                      onPress={() => setSelectedMinuteRange(range.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.minuteRangeText,
                        isSelected && styles.minuteRangeTextSelected
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Kaydet / İptal Butonları */}
        <View style={styles.substituteModalFooter}>
          <TouchableOpacity
            style={styles.substituteCancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.substituteCancelButtonText}>İptal Et</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.substituteSaveButton,
              (!selectedPlayerId || !selectedMinuteRange) && styles.substituteSaveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!selectedPlayerId || !selectedMinuteRange}
            activeOpacity={0.7}
          >
            <Text style={styles.substituteSaveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  </Modal>
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
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },

  // Football Field – Kadro ile birebir aynı (PITCH_LAYOUT + web maxWidth/WEB_HEIGHT)
  fieldContainer: {
    width: isWeb ? '100%' : width - PITCH_LAYOUT.H_PADDING,
    maxWidth: isWeb ? PITCH_LAYOUT.WEB_MAX_WIDTH : undefined,
    height: isWeb ? PITCH_LAYOUT.WEB_HEIGHT : (width - PITCH_LAYOUT.H_PADDING) * PITCH_LAYOUT.ASPECT_RATIO,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)' },
    }),
  },
  fieldGradient: {
    flex: 1,
  },
  fieldSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playersContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  // ✅ Kadro sekmesindeki emptyStateContent ile AYNI stil (sıçrama önlenir)
  squadIncompleteWarning: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    margin: 40,
  },
  squadIncompleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  squadIncompleteText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  mainField: {
    width: isWeb ? '100%' : width - PITCH_LAYOUT.H_PADDING,
    maxWidth: isWeb ? PITCH_LAYOUT.WEB_MAX_WIDTH : undefined,
    height: isWeb ? PITCH_LAYOUT.WEB_HEIGHT : (width - PITCH_LAYOUT.H_PADDING) * PITCH_LAYOUT.ASPECT_RATIO,
    alignSelf: 'center',
    marginBottom: 0,
  },
  // 🌟 Saha üzerinde analiz odağı yıldızı - sağ üst köşe (daire yok, sadece yıldız)
  fieldFocusStarContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  // Oyuncu kartları – Kadro ile aynı boyut (64x76) ve yerleşim
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -32 }, { translateY: -38 }],
    zIndex: 5,
    elevation: 5,
    overflow: 'visible', // ✅ Tik badge taşması için
  },
  predictionCardInfoIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },
      android: { elevation: 3 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' },
    }),
  },
  // ✅ İZLEME MODU: Tahmin yapılmamış maçlarda "i" butonu daha belirgin
  predictionCardInfoIconHighlighted: {
    width: 30,
    height: 30,
    borderRadius: 15,
    top: -10,
    right: -10,
    backgroundColor: '#3B82F6', // Parlak mavi
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { 
        boxShadow: '0 0 12px rgba(59, 130, 246, 0.9), 0 0 24px rgba(59, 130, 246, 0.5), inset 0 0 4px rgba(255,255,255,0.3)',
        cursor: 'pointer',
      },
    }),
  },
  // ✅ KIRMIZI DAİRE İÇİNDE "i" BUTONU - Oyuncu kartları için
  predictionCardInfoIconRed: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 15,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444', // Kırmızı
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4 },
      android: { elevation: 6 },
      web: { 
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.7), 0 2px 4px rgba(0,0,0,0.3)',
        cursor: 'pointer',
      },
    }),
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  // ✅ BÖLÜM INFO BUTONU - Sağ üst köşe
  sectionInfoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    ...Platform.select({
      ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 3 },
      android: { elevation: 4 },
      web: { 
        boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
        cursor: 'pointer',
      },
    }),
  },
  sectionInfoButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  // ✅ BAŞLIK SATIRI - Info butonu ile birlikte
  combinedCardTitleRowWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  playerCard: {
    width: 64,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
    }),
  },
  playerCardElite: {
    borderColor: '#C9A44C', // Gold border for elite players (85+)
    borderWidth: 2,
  },
  playerCardGK: {
    borderColor: '#3B82F6', // Blue border for goalkeepers (maç öncesi)
    borderWidth: 2,
  },
  // Oynanan/canlı maç: topluluk %26 değişiklik istiyor → kalın kırmızı çerçeve
  playerCardGKCommunity: {
    borderColor: '#EF4444',
    borderWidth: 4,
  },
  // Oynanan/canlı maç: topluluk %10 değişiklik istiyor → ince kırmızı çerçeve
  playerCardSTCommunity: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  playerCardPredicted: {
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 0 16px rgba(245, 158, 11, 0.6)' },
    }),
  },
  playerCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    padding: 6,
  },
  predictionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
  },
  jerseyNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  jerseyNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerBottomRow: {
    position: 'absolute',
    bottom: 3,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerRatingBottom: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C9A44C',
  },
  playerPositionBottom: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // ✅ Tahmin İkonları Satırı - Oyuncu kartının altında
  predictionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 'auto',
    paddingHorizontal: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  predictionIconBadge: {
    width: 14,
    height: 14,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionIconText: {
    fontSize: 8,
  },
  predictionIconGoal: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)', // Yeşil - Gol
  },
  predictionIconAssist: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // Mavi - Asist
  },
  predictionIconYellow: {
    backgroundColor: '#F59E0B', // Sarı - Sarı kart
  },
  predictionIconRed: {
    backgroundColor: '#EF4444', // Kırmızı - Kırmızı kart
  },
  predictionIconSub: {
    backgroundColor: '#F97316', // Turuncu - Değişiklik
  },
  predictionIconInjury: {
    backgroundColor: '#8B5CF6', // Mor - Sakatlık
  },
  alertBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  predictionCheckBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  // ✅ Tahmin yapıldı tik - Kadro X butonu ile aynı stilde (yeşil versiyon)
  predictionCheckBadgeTopRight: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.4)' },
    }),
  },
  // ✅ Canlı maç sinyal badge'leri container
  signalBadgesContainer: {
    position: 'absolute',
    top: -6,
    left: -6,
    flexDirection: 'row',
    gap: 2,
    zIndex: 9998,
  },
  // ✅ Tekil sinyal badge
  signalBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 2px rgba(0,0,0,0.3)' },
    }),
  },
  signalBadgeEmoji: {
    fontSize: 10,
  },
  substitutionBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  redCardBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '8deg' }],
  },
  yellowCardBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '8deg' }],
  },
  playerName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
    flexShrink: 1,
    flexGrow: 0,
    maxHeight: 22,
    letterSpacing: 0.3,
  },
  playerPosition: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Info Note - Kadro sekmesindeki selectFormationButton ile AYNI yükseklik ve margin
  // Sıçramayı önlemek için aynı dikey alan kullanılıyor
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50, // ✅ selectFormationButton ile aynı yükseklik
    paddingHorizontal: 16,
    marginTop: 16, // ✅ selectFormationButton ile aynı marginTop
    marginBottom: 0,
    backgroundColor: '#1E3A3A',
    borderRadius: 12, // ✅ selectFormationButton ile aynı borderRadius
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  infoText: {
    fontSize: 12,
    color: '#E6E6E6', // ✅ Daha okunabilir beyaz
    flex: 1,
    flexShrink: 1,
  },
  
  // Predictions Section
  predictionsSection: {
    padding: 16,
    gap: 24,
  },
  // ✅ İZLEME MODU: Tahmin yapılmamış maçlarda hafif soluk ama tıklanabilir (i butonları için)
  predictionsSectionViewOnly: {
    opacity: 0.85, // 0.5'ten 0.85'e yükseltildi - daha az flu
    // pointerEvents kaldırıldı - i butonlarına tıklanabilsin
  },
  focusInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  focusInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    flex: 1,
  },
  focusInfoHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  predictionCategory: {
    gap: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: '#1E3A3A', // ✅ Design System: Primary tonu (koyu yeşil kart)
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System: Secondary opacity
    gap: 12,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // KOMBİNE KART STİLLERİ - Zarif Glass Morphism
  // ═══════════════════════════════════════════════════════════════════════════
  categoryCardCombined: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { backdropFilter: 'blur(8px)', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' },
    }),
  },
  categoryCardFirstHalf: {
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  categoryCardFullTime: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  categoryCardGoal: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  cardAccentFirstHalf: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#EAB308',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardAccentFullTime: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardAccentGoal: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  combinedCardHeader: {
    marginBottom: 10,
  },
  combinedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  // 🌟 Bonus Badge - Analiz odağında olan tahminler için
  focusBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  focusBonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  cardIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconFirstHalf: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  cardIconFullTime: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  cardIconGoal: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  cardIconTime: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  cardEmoji: {
    fontSize: 14,
  },
  combinedCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.2,
  },
  cardDividerCombined: {
    height: 0.5,
    marginVertical: 12,
  },
  cardDividerFirstHalf: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
  },
  cardDividerFullTime: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  cardDividerGoal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  
  // Zarif Skor Gösterimi
  scoreDisplayMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTeamMinimal: {
    alignItems: 'center',
    flex: 1,
  },
  scoreTeamLabelMinimal: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.8,
    opacity: 0.7,
  },
  scoreTeamLabelFirstHalf: {
    color: '#EAB308',
  },
  scoreTeamLabelFullTime: {
    color: '#60A5FA',
  },
  scoreValueContainerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreAdjustBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  scoreValueMinimal: {
    fontSize: 24,
    fontWeight: '200',
    minWidth: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scoreValueFirstHalf: {
    color: '#EAB308',
  },
  scoreValueFullTime: {
    color: '#60A5FA',
  },
  scoreDashMinimal: {
    paddingHorizontal: 12,
  },
  scoreDashTextMinimal: {
    fontSize: 20,
    fontWeight: '200',
    color: '#475569',
  },
  
  // Zarif Slider Stilleri
  sliderSectionCombined: {
    gap: 4,
  },
  sliderHeaderCombined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabelCombined: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
    flex: 1,
  },
  sliderValueBadgeCombined: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sliderValueBadgeFirstHalf: {
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
  },
  sliderValueBadgeFullTime: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  sliderValueTextCombined: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  sliderTrackContainer: {
    gap: 0,
  },
  sliderCombined: {
    width: '100%',
    height: 16,
  },
  sliderMarksCombined: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 6,
    marginHorizontal: 0,
  },
  sliderMarkCombined: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    width: 20,
    textAlign: 'center',
  },
  
  // Zarif Gol Sayısı Stilleri
  goalCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalCountBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  goalCountBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.9)',
  },
  goalCountNumber: {
    fontSize: 14,
    fontWeight: '400',
    color: '#34D399',
    letterSpacing: -0.3,
  },
  goalCountNumberActive: {
    color: '#FFF',
  },
  goalCountLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  goalCountLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Zarif İlk Gol Zamanı Timeline Stilleri
  firstGoalTimeline: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    width: 24,
    textAlign: 'center',
  },
  timelineRowButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  timelineBtnCompact: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
  },
  timelineBtnCompactActiveFirst: {
    backgroundColor: 'rgba(234, 179, 8, 0.85)',
    borderColor: 'rgba(234, 179, 8, 0.85)',
  },
  timelineBtnCompactActiveSecond: {
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    borderColor: 'rgba(59, 130, 246, 0.85)',
  },
  timelineBtnTextCompact: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CBD5E1',
    letterSpacing: -0.2,
  },
  timelineBtnTextCompactActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  noGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  noGoalBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderColor: 'rgba(239, 68, 68, 0.85)',
  },
  noGoalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  noGoalBtnTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  timelineTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    overflow: 'hidden',
  },
  timelineGradient: {
    flex: 1,
    borderRadius: 1,
    opacity: 0.7,
  },
  timelineButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  timelineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  timelineBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderColor: 'rgba(245, 158, 11, 0.9)',
  },
  timelineBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: -0.2,
  },
  timelineBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  timelinePeriod: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  timelinePeriodActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  timelineExtras: {
    flexDirection: 'row',
    gap: 6,
  },
  timelineExtraBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  timelineExtraBtnAlt: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  timelineExtraBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderColor: 'rgba(245, 158, 11, 0.9)',
  },
  timelineExtraBtnNoGoalActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: 'rgba(239, 68, 68, 0.9)',
  },
  timelineExtraBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  timelineExtraBtnTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DİSİPLİN KARTLARI - Zarif Horizontal Bar Stilleri
  // ═══════════════════════════════════════════════════════════════════════════
  categoryCardDiscipline: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  cardAccentDiscipline: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardIconDiscipline: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  disciplineBarSection: {
    gap: 6,
  },
  disciplineBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disciplineBarEmoji: {
    fontSize: 14,
  },
  disciplineBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1,
  },
  disciplineBarValue: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  disciplineBarTrack: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  disciplineBarSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    marginHorizontal: 2,
    borderRadius: 6,
  },
  disciplineBarSegmentActiveYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
    borderColor: 'rgba(251, 191, 36, 0.85)',
  },
  disciplineBarSegmentActiveRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.85)',
    borderColor: 'rgba(248, 113, 113, 0.85)',
  },
  disciplineBarSegmentActiveBlue: {
    backgroundColor: 'rgba(96, 165, 250, 0.85)',
    borderColor: 'rgba(96, 165, 250, 0.85)',
  },
  disciplineBarSegmentActiveGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.85)',
    borderColor: 'rgba(52, 211, 153, 0.85)',
  },
  disciplineBarSegmentActiveOrange: {
    backgroundColor: 'rgba(251, 191, 36, 0.85)',
    borderColor: 'rgba(251, 191, 36, 0.85)',
  },
  disciplineBarSegmentActiveEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.9)',
  },
  disciplineBarSegmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  disciplineBarSegmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  // ✅ TOPLULUK TAHMİNİ - Segment işareti
  disciplineBarSegmentCommunity: {
    borderWidth: 2,
    borderColor: '#8B5CF6', // Mor renk - topluluk tahmini
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  // ✅ TOPLULUK BADGE - Mini ikon
  communityBadgeMini: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    zIndex: 10,
  },
  communityBadgeMiniTempo: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    zIndex: 10,
  },
  // ✅ TIMELINE BUTONU - Topluluk işareti
  timelineBtnCommunity: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  // ✅ TEMPO BUTONU - Topluluk işareti
  tempoBtnCommunity: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  // ✅ VERTICAL BAR - Topluluk işareti
  verticalBarWrapperCommunity: {
    // wrapper stil
  },
  verticalBarCommunity: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  
  // Dikey Çubuk Stilleri (Disiplin için)
  disciplineColumnsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  disciplineColumn: {
    flex: 1,
  },
  disciplineColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  disciplineColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    flex: 1,
  },
  disciplineColumnValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  disciplineColumnDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  verticalBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 70,
  },
  verticalBarWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  verticalBar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  verticalBarInactiveYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  verticalBarActiveYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  verticalBarInactiveRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  verticalBarActiveRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.9)',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  verticalBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  
  // Tempo & Senaryo Stilleri
  categoryCardTactical: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  cardAccentTactical: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#F59E0B',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  tempoButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tempoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  tempoBtnActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  tempoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scenarioBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  scenarioBtnActive: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  scenarioBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ŞUT TAHMİNLERİ - Zarif Horizontal Bar Stilleri
  // ═══════════════════════════════════════════════════════════════════════════
  categoryCardShots: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  cardAccentShots: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardIconShots: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  horizontalBarSection: {
    gap: 8,
  },
  horizontalBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  horizontalBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    flex: 1,
  },
  horizontalBarValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60A5FA',
    minWidth: 36,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  horizontalBarTrack: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  horizontalBarSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(100, 116, 139, 0.1)',
  },
  horizontalBarSegmentActiveBlue: {
    backgroundColor: 'rgba(96, 165, 250, 0.8)',
  },
  horizontalBarSegmentActiveGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.8)',
  },
  horizontalBarSegmentActiveOrange: {
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
  },
  horizontalBarSegmentActiveEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  horizontalBarSegmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: -0.2,
  },
  horizontalBarSegmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  focusButtonWrap: {
    zIndex: 10,
    elevation: 10,
  },
  focusStarPlaceholder: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  focusButtonPressed: {
    opacity: 0.7,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6E6E6',
  },
  categoryHint: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  focusExplanationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusExplanationContent: {
    marginTop: 0,
  },
  focusExplanationText: {
    fontSize: 14,
    color: '#E6E6E6',
    lineHeight: 20,
  },
  focusDisplayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  focusDisplayCard: {
    width: width > 600 ? '32%' : '48%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  focusDisplayIconRow: {
    marginBottom: 6,
  },
  focusDisplayIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  focusDisplayTitleRow: {
    marginBottom: 6,
    overflow: 'hidden',
  },
  focusDisplayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 14,
  },
  focusDisplayBadgeRow: {
    marginBottom: 6,
    overflow: 'hidden',
  },
  focusDisplayBonusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  focusDisplayBonusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  focusDisplayDescriptionRow: {
    overflow: 'hidden',
  },
  focusDisplayDescription: {
    fontSize: 9,
    color: '#94A3B8',
    lineHeight: 12,
  },

  // Score Picker
  scorePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scorePickerColumn: {
    flex: 1,
    gap: 8,
  },
  scorePickerLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scoreButton: {
    width: 36,
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // ✅ Design System: Primary opacity
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System: Secondary opacity
  },
  scoreButtonActive: {
    backgroundColor: '#1FA2A6', // ✅ Design System: Secondary
    borderColor: '#1FA2A6',
  },
  scoreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6E6E6',
  },
  scoreButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scoreButtonDisabled: {
    backgroundColor: 'rgba(15, 42, 36, 0.35)',
    borderColor: 'rgba(31, 162, 166, 0.15)',
    opacity: 0.6,
  },
  scoreButtonTextDisabled: {
    color: '#6B7280',
  },
  scoreSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSeparatorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1FA2A6', // ✅ Design System: Secondary (turkuaz)
  },
  
  // Button Rows & Grids
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 60,
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // ✅ Design System: Primary opacity
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System: Secondary opacity
  },
  optionButtonGrid: {
    width: '48%',
    height: 48,
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // ✅ Design System: Primary opacity
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System: Secondary opacity
  },
  optionButtonActive: {
    backgroundColor: '#1FA2A6', // ✅ Design System: Secondary
    borderColor: '#1FA2A6',
    transform: [{ scale: 1.05 }],
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6E6E6',
    textAlign: 'center',
  },
  optionTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E6E6E6',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Possession - Zarif Stil
  categoryCardPossession: {
    backgroundColor: 'rgba(31, 162, 166, 0.18)',
    borderColor: 'rgba(31, 162, 166, 0.45)',
  },
  cardAccentPossession: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#2DD4BF',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardIconPossession: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  possessionDisplayElegant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  possessionTeamElegant: {
    alignItems: 'center',
    minWidth: 44,
  },
  possessionTeamLabelElegant: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  possessionTeamValueElegant: {
    fontSize: 18,
    fontWeight: '300',
    color: '#2DD4BF',
    letterSpacing: -0.5,
  },
  possessionBarContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  possessionBarSegment: {
    height: '100%',
  },
  possessionBarHome: {
    backgroundColor: 'rgba(45, 212, 191, 0.6)',
  },
  possessionBarAway: {
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  
  // ✅ Tahmin Toolbar (Kilit + Kaydet)
  predictionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  predictionLockButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionLockButtonLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  predictionLockButtonOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  // Submit Button
  submitButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submitButtonTextLocked: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Player Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  playerModalContent: {
    backgroundColor: '#1E3A3A', // ✅ Design System
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    flex: 1,
  },
  playerModalHeader: {
    padding: 12,
    paddingBottom: 10,
  },
  tahminYapilanOyuncuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.3)',
  },
  tahminYapilanOyuncuText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    zIndex: 10,
  },
  playerModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerNumberCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerNumberLarge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerRatingCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerRatingSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F2A24',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameLarge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerPositionModal: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  formText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  
  // Player Predictions (tek sayfa, scroll yok)
  playerPredictionsScroll: {
    flex: 1,
    minHeight: 0,
  },
  playerPredictionsContent: {
    padding: 12,
    gap: 6,
    paddingBottom: 12,
  },
  predictionGroup: {
    gap: 4,
  },
  predictionButton: {
    height: 44,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  predictionButtonActive: {
    backgroundColor: '#3B82F6', // ✅ Mavi renk
    borderColor: '#3B82F6',
    transform: [{ scale: 1.02 }],
  },
  predictionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionButtonTextActive: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  predictionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  predictionButtonTextDisabled: {
    opacity: 0.6,
  },
  predictionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subOptions: {
    paddingLeft: 10,
    gap: 4,
  },
  subOptionsLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  subOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subOptionButton: {
    flex: 1,
    height: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  subOptionButtonActive: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  subOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  subOptionTextActive: {
    color: '#FFFFFF',
  },
  selectedSubstitute: {
    paddingLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    gap: 6,
  },
  selectedSubstituteLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  selectedSubstituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSubstituteValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  changeSubstituteButton: {
    fontSize: 13,
    color: '#1FA2A6',
    fontWeight: '600',
  },
  
  // Player Modal Actions
  playerModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.2)',
    backgroundColor: '#1E3A3A', // ✅ Design System
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButtonTextLocked: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 1,
  },
  saveButtonTextDisabled: {
    opacity: 1,
  },
  
  // Substitute Modal
  substituteModalContent: {
    backgroundColor: '#1E3A3A', // ✅ Design System
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
  },
  substituteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  substituteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  substituteModalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  substituteModalScroll: {
    flex: 1,
  },
  substituteModalScrollContent: {
    paddingBottom: 20,
  },
  substituteSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  substituteSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  substituteSectionHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  inlineSubstituteDropdown: {
    marginTop: 4,
    padding: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    gap: 8,
  },
  inlineSubstituteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
    marginBottom: 4,
  },
  inlineSubstituteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 10,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectedPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownPlayerNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownPlayerNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    maxHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.4)' },
    }),
  },
  dropdownMenuList: {
    maxHeight: 160,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  dropdownMenuItemSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
  },
  dropdownMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownPlayerNumberSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownPlayerNumberTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#E6E6E6',
    flex: 1,
  },
  dropdownMenuItemTextSelected: {
    color: '#1FA2A6',
    fontWeight: '600',
  },
  dropdownEmptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Tek Satır Bildirim Buton Stilleri - Çıkar: x Girer: x dk 1-15
  substituteButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  substituteButtonSingleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  substituteButtonSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  substituteButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  substituteButtonPlayerNameSingle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substituteButtonSubstituteNameSingle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substituteButtonTimeTextSingle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E7EB',
    marginLeft: 2,
  },
  autoSaveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  autoSaveInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  manualSaveButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manualSaveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#4B5563',
  },
  manualSaveButtonTextDisabled: {
    opacity: 0.6,
    color: '#9CA3AF',
  },
  // Minute Range Compact Styles
  minuteRangeContainer: {
    marginBottom: 16,
  },
  minuteRangesGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  minuteRanges2RowGridCompact: {
    gap: 8,
    width: '100%',
  },
  minuteRangesRowCompact: {
    flexDirection: 'row',
    gap: 6,
  },
  minuteRangeButtonCompact2Row: {
    flex: 1,
    minWidth: 0,
  },
  minuteRangeButtonCompactGridItem: {
    flex: 1,
    minWidth: 0,
  },
  injuryTimeGrid: {
    gap: 4,
    width: '100%',
  },
  firstGoalTimeGrid: {
    gap: 6,
    width: '100%',
  },
  injuryTimeSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  injuryTimeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
    width: '100%',
  },
  injuryTimeButton: {
    flex: 1,
    minWidth: 36,
  },
  injuryTimeButtonText: {
    fontSize: 13,
  },
  injuryTimeButtonPadding: {
    paddingHorizontal: 6,
  },
  minuteRangeButtonCompact: {
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexDirection: 'row',
    gap: 6,
  },
  minuteRangeButtonCompactSelected: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
    borderWidth: 2,
  },
  minuteRangeTextCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
  },
  minuteRangeTextCompactSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  minuteRangeCheckmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSubstitutes: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noSubstitutesText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  substituteList: {
    gap: 8,
  },
  minuteRangesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  minuteRanges2RowGrid: {
    gap: 8,
    marginTop: 8,
  },
  minuteRangesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  minuteRangeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    minWidth: 70,
    alignItems: 'center',
  },
  minuteRangeButton2Row: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
  },
  minuteRangeButtonSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    borderColor: '#1FA2A6',
    borderWidth: 2,
  },
  minuteRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  minuteRangeTextSelected: {
    color: '#1FA2A6',
  },
  substituteModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  substituteCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  substituteSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteSaveButtonDisabled: {
    backgroundColor: 'rgba(31, 162, 166, 0.3)',
    opacity: 0.5,
  },
  substituteSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substituteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  substituteItemSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#1FA2A6',
  },
  substituteItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  substituteNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substitutePosition: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
