// MatchPredictionScreen.tsx - React Native FULL COMPLETE VERSION
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { showAlert, showConfirm, showInfo, showError } from '../../utils/alertHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formations, formationPositions, formationLabels } from '../../constants/formations';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Path, 
} from 'react-native-svg';
import { FocusPrediction, SCORING_CONSTANTS } from '../../types/prediction.types';
import { STORAGE_KEYS, PITCH_LAYOUT } from '../../config/constants';
import { handleError, ErrorType, ErrorSeverity } from '../../utils/GlobalErrorHandler';
import { scoringApi } from '../../services/api';
import { predictionsDb } from '../../services/databaseService';
import { ConfirmModal, ConfirmButton } from '../ui/ConfirmModal';
import { ANALYSIS_FOCUSES, type AnalysisFocusType } from '../AnalysisFocusModal';
import { FOCUS_CATEGORY_MAPPING, doesFocusIncludePlayerPredictions } from '../../constants/predictionConstants';
import { isMockTestMatch, MOCK_MATCH_IDS, getMatch1Start, getMatch2Start, getMockUserTeamId, getMockCommunitySignals, getMockLineup } from '../../data/mockTestData';
import { formatPlayerDisplayName } from '../../utils/playerNameUtils';
import PlayerPredictionModal from './PlayerPredictionModal';
import { 
  SIGNAL_COLORS, 
  SIGNAL_EMOJIS, 
  SIGNAL_LABELS,
  PlayerSignals,
  PlayerSignal,
  getSignalBorderStyle,
  SIGNAL_BONUS_POINTS,
  checkSignalConflict,
  MIN_USERS_FOR_PERCENTAGE,
  MIN_USERS_FOR_PERCENTAGE_MOCK,
} from '../../types/signals.types';
import {
  getMatchPhase,
  getOccurredEvents,
  getTimingBadgeProps,
  type MatchPhase,
  type MatchEvent as TimingMatchEvent,
} from '../../utils/predictionTiming';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../theme/theme';


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

// ✅ Reytingi 0–100 tam puan üzerinden göster; yuvarlayıp farkları kaybetme (60–70 arası anlamlı)
// API: 0–10 (maç reytingi) → ×10 (6.7 → 67). Zaten 11–100 ise olduğu gibi (tam sayı).
function normalizeRatingTo100(rating: number | null | undefined): number | null {
  if (rating == null || Number(rating) <= 0) return null;
  const r = Number(rating);
  if (r > 0 && r <= 10) return Math.min(100, Math.round(r * 10)); // 6.7 → 67
  if (r > 10 && r <= 100) return Math.round(r); // 72.4 → 72 (tam sayı, ondalık yok)
  return Math.min(100, Math.max(0, Math.round(r)));
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
  /** Tahmin kilidi açıldı/kapandığında çağrılır (MatchDetail kadro düzenlemeyi kilitlemek için) */
  onPredictionLockedChange?: (locked: boolean) => void;
  /** İki favori maçta tahmin kaydedildiğinde hangi takım için kaydedildiği (diğer takım teklifi için) */
  onPredictionsSavedForTeam?: (teamId: number) => void;
  /** Analiz odağı – Dashboard/Modal'dan seçildiğinde yıldızlar otomatik işaretlenir */
  initialAnalysisFocus?: AnalysisFocusType | null;
  /** Kaydedilmemiş değişiklik var mı callback'i - MatchDetail tab değiştiğinde sormak için */
  onHasUnsavedChanges?: (hasChanges: boolean, saveFn: () => Promise<void>) => void;
  /** Maç kadrosu (lineups) - yedek oyuncular için */
  lineups?: any[];
  /** Canlı maç event'leri (goller, kartlar, değişiklikler) */
  liveEvents?: any[];
  /** Canlı maç istatistikleri (şut, korner, top hakimiyeti – API'den periyodik güncellenir) */
  liveStatistics?: any;
  /** Favori takım ID'leri */
  favoriteTeamIds?: number[];
  /** Canlı maç (sadece bilgi (i) ikonu gösterilir, replace/remove yok) */
  isMatchLive?: boolean;
  /** Biten maç */
  isMatchFinished?: boolean;
  /** Kullanıcı bu maç için tahmin yapmış mı (topluluk verileri görünürlüğü için) */
  hasPrediction?: boolean;
  /** ✅ Topluluk verilerini gördüğünde MatchDetail'a bildir (kadro kilidi için) */
  onViewedCommunityData?: () => void;
  /** Kadro sekmesinden "Tahmin > Topluluk/Gerçek" ile gelindiyse açılacak alt sekme: 1 = Topluluk, 2 = Gerçek */
  initialPredictionSubIndex?: number | null;
  /** initialPredictionSubIndex uygulandıktan sonra çağrılır (MatchDetail state temizler) */
  onInitialPredictionSubIndexApplied?: () => void;
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
  onPredictionLockedChange,
  onPredictionsSavedForTeam,
  initialAnalysisFocus,
  onHasUnsavedChanges,
  lineups,
  liveEvents = [],
  liveStatistics,
  favoriteTeamIds = [],
  hasPrediction = false,
  isMatchLive = false,
  isMatchFinished = false,
  onViewedCommunityData,
  initialPredictionSubIndex,
  onInitialPredictionSubIndexApplied,
}) => {
  const { width: winW, height: winH } = useWindowDimensions();
  const [scrollViewWidth, setScrollViewWidth] = useState(0); // ✅ Yatay scroll gerçek genişlik (enlemesine ortalı snap için)
  const pageWidth = Math.floor(winW) || 400;
  // Ondalıksız kullanma – viewport ile içerik aynı ölçüde olsun, sürükleyip bırakınca tam otursun
  const effectivePageWidth = scrollViewWidth > 0 ? scrollViewWidth : pageWidth;
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;
  const cardTitleColor = isLight ? themeColors.foreground : '#F1F5F9';
  const cardLabelColor = isLight ? themeColors.mutedForeground : '#CBD5E1';
  const segmentBg = isLight ? 'rgba(15, 42, 36, 0.08)' : 'rgba(15, 23, 42, 0.4)';
  const segmentBorder = isLight ? 'rgba(15, 42, 36, 0.15)' : 'rgba(100, 116, 139, 0.35)';

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
  // ✅ predictionStorageKey: matchId ve effectivePredictionTeamId kullan (MatchSquad ile tutarlı)
  const predictionStorageKey = React.useMemo(
    () => (matchId && effectivePredictionTeamId != null ? `${STORAGE_KEYS.PREDICTIONS}${matchId}-${effectivePredictionTeamId}` : matchId ? `${STORAGE_KEYS.PREDICTIONS}${matchId}` : null),
    [matchId, effectivePredictionTeamId]
  );

  // ✅ Load attack squad from AsyncStorage
  const [attackPlayersArray, setAttackPlayersArray] = useState<any[]>([]);
  const [allTeamPlayers, setAllTeamPlayers] = useState<any[]>([]); // ✅ Tüm takım kadrosu (yedekler dahil)
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [defenseFormation, setDefenseFormation] = useState<string | null>(null);
  const [squadLoaded, setSquadLoaded] = useState(false);
  const [isSquadCompleted, setIsSquadCompleted] = useState(false); // ✅ Tamamla basıldı mı?
  const [isSaving, setIsSaving] = useState(false); // ✅ Kaydetme işlemi devam ediyor mu?
  const [isPredictionLocked, setIsPredictionLocked] = useState(false); // ✅ (Eski/global – geriye uyum; artık ana mantık lockedPlayerIds)
  const [lockedPlayerIds, setLockedPlayerIds] = useState<number[]>([]); // ✅ Oyuncu bazlı kilit – her oyuncu ayrı kilitlenip açılır
  const [showLockedWarningModal, setShowLockedWarningModal] = useState(false); // ✅ Web için kilitli uyarı modal'ı
  const [lockedWarningReason, setLockedWarningReason] = useState<'unlock_at_bottom' | 'match_started' | 'community_viewed' | 'real_lineup_viewed' | 'master_then_player'>('unlock_at_bottom');
  const [showViewOnlyWarningModal, setShowViewOnlyWarningModal] = useState(false); // ✅ İzleme modu uyarı modal'ı
  const [viewOnlyPopupShown, setViewOnlyPopupShown] = useState(false); // ✅ İlk giriş popup gösterildi mi?
  const [liveReactionPlayer, setLiveReactionPlayer] = useState<any>(null); // ✅ Canlı maç reaction popup
  // ✅ row1 (Çok İyi/Kötü), row2 (Gol Atar/Çıkmalı), row3 (Sarı/Kırmızı Kart), row4 (Maçın adamı)
  type LiveReactionRow = { row1?: 'good'|'bad'; row2?: 'goal'|'sub'; row3?: 'yellowcard'|'redcard'; row4?: 'motm' };
  const [liveReactions, setLiveReactions] = useState<{[playerId: number]: LiveReactionRow | string}>({});
  const normalizeLiveReaction = (v: LiveReactionRow | string | undefined): LiveReactionRow => {
    if (!v) return {};
    if (typeof v === 'string') {
      if (['good','bad'].includes(v)) return { row1: v as 'good'|'bad' };
      if (['goal','sub'].includes(v)) return { row2: v as 'goal'|'sub' };
      if (['yellowcard','redcard'].includes(v)) return { row3: v as 'yellowcard'|'redcard' };
      if (v === 'motm') return { row4: 'motm' };
      return {};
    }
    return v;
  };
  const getReactionBorderColor = (r: LiveReactionRow): string | undefined => {
    if (r.row1 === 'good') return '#10B981';
    if (r.row1 === 'bad') return '#EF4444';
    if (r.row2 === 'goal') return '#3B82F6';
    if (r.row2 === 'sub') return '#8B5CF6';
    if (r.row3 === 'yellowcard') return '#FBBF24';
    if (r.row3 === 'redcard') return '#DC2626';
    if (r.row4 === 'motm') return '#EAB308';
    return undefined;
  };
  const hasAnyReaction = (r: LiveReactionRow): boolean => !!(r.row1 || r.row2 || r.row3 || r.row4);
  const [teamPerformance, setTeamPerformance] = useState<number>(5); // ✅ Takım performans puanı (1-10), sayfaya dönünce gösterilir
  const [previousTeamPerformance, setPreviousTeamPerformance] = useState<number | null>(null); // ✅ Bir önceki verilen not (modalda farklı renkte gösterilir)
  const [showTeamPerfPopup, setShowTeamPerfPopup] = useState(false); // ✅ Takım performansı seçimi popup (alttan kesilme + bilgi + seçim tek yerde)
  const [communityTeamPerformanceAvg, setCommunityTeamPerformanceAvg] = useState<number | null>(null); // ✅ Topluluk ortalaması (API'den gelecek)
  const [showCommunityAvgTooltip, setShowCommunityAvgTooltip] = useState(false); // ✅ Kırmızı çizgiye tıklanınca konuşma balonu
  const [teamPerfBubbleViewCount, setTeamPerfBubbleViewCount] = useState<number>(0); // ✅ Balon kaç kez gösterildi (max 3)
  const teamPerfBubbleViewCountRef = useRef(0);
  const motmScaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motmScaleAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(motmScaleAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      { iterations: 6 }
    );
    loop.start();
    return () => loop.stop();
  }, [motmScaleAnim]);
  const [playerCardHintDismissed, setPlayerCardHintDismissed] = useState(false); // ✅ "Oyuncu kartlarına tıklayın" ipucu kapatıldı mı
  const [playerCardHintViewCount, setPlayerCardHintViewCount] = useState<number>(0); // ✅ İpucu kaç kez gösterildi (max 3)
  const [threeFieldActiveIndex, setThreeFieldActiveIndex] = useState(0); // ✅ 3 saha görünümünde aktif sayfa
  const threeFieldScrollRef = useRef<ScrollView>(null); // ✅ Horizontal saha scroll ref
  const mainScrollRef = useRef<ScrollView>(null); // ✅ Dikey scroll – kayıt sonrası en alta kaydırma
  const initialPlayerPredictionsRef = useRef<string | null>(null); // ✅ Popup açıldığında oyuncu tahmininin snapshot'ı (kaydedilmeden çıkış uyarısı için)
  const [predictionViewIndex, setPredictionViewIndex] = useState(0); // ✅ 0: Benim Tahminim, 1: Topluluk, 2: Gerçek

  // ✅ Kadro sekmesinden "Tahmin > Topluluk/Gerçek" ile gelindiyse ilgili alt sekmeyi aç
  React.useEffect(() => {
    if (initialPredictionSubIndex != null && (initialPredictionSubIndex === 1 || initialPredictionSubIndex === 2)) {
      setPredictionViewIndex(initialPredictionSubIndex);
      setThreeFieldActiveIndex(initialPredictionSubIndex);
      onInitialPredictionSubIndexApplied?.();
    }
  }, [initialPredictionSubIndex]);

  // ✅ Takım performansı balonu / oyuncu kartı ipucu gösterim sayılarını yükle (en fazla birkaç kez göster)
  const TEAM_PERF_BUBBLE_MAX = 3;
  const PLAYER_CARD_HINT_MAX = 3;
  const showTeamPerfBubbleIfAllowed = React.useCallback(() => {
    if (teamPerfBubbleViewCountRef.current >= TEAM_PERF_BUBBLE_MAX) return;
    setShowCommunityAvgTooltip(true);
    const newCount = teamPerfBubbleViewCountRef.current + 1;
    teamPerfBubbleViewCountRef.current = newCount;
    setTeamPerfBubbleViewCount(newCount);
    AsyncStorage.setItem('tacticiq_team_perf_bubble_views', String(newCount)).catch(() => {});
  }, []);
  React.useEffect(() => {
    (async () => {
      try {
        const bubbleCount = await AsyncStorage.getItem('tacticiq_team_perf_bubble_views');
        const hintCount = await AsyncStorage.getItem('tacticiq_team_perf_player_hint_views');
        const b = bubbleCount != null ? parseInt(bubbleCount, 10) || 0 : 0;
        const h = hintCount != null ? parseInt(hintCount, 10) || 0 : 0;
        setTeamPerfBubbleViewCount(b);
        teamPerfBubbleViewCountRef.current = b;
        setPlayerCardHintViewCount(h);
      } catch (_) {}
    })();
  }, []);

  // ✅ Popup açıldığında mevcut tahminleri snapshot'la (kaydedilmeden çıkışta karşılaştırma için)
  React.useEffect(() => {
    if (selectedPlayer) initialPlayerPredictionsRef.current = JSON.stringify(playerPredictions[selectedPlayer.id] ?? playerPredictions[String(selectedPlayer.id)] ?? {});
    else initialPlayerPredictionsRef.current = null;
  }, [selectedPlayer?.id]);

  // ✅ Sadece genişlik (layout) değişince snap düzelt; viewport ile aynı ölçü kullan
  useEffect(() => {
    if (scrollViewWidth <= 0) return;
    const page = Math.max(0, Math.min(threeFieldActiveIndex, 2));
    const targetX = page * scrollViewWidth;
    threeFieldScrollRef.current?.scrollTo({ x: targetX, animated: false });
  }, [scrollViewWidth]);

  // ✅ Her zaman tam sayfa snap: arada kalmayı önlemek için anında (animated: false) konuma getir
  const snapToPage = (targetX: number, page: number) => {
    const safePage = Math.max(0, Math.min(page, 2));
    const w = scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth;
    const safeX = w > 0 ? Math.max(0, Math.min(safePage * w, w * 2)) : 0;
    setThreeFieldActiveIndex(safePage);
    setPredictionViewIndex(safePage);
    const ref = threeFieldScrollRef.current;
    if (ref?.scrollTo && (w > 0)) {
      requestAnimationFrame(() => {
        ref.scrollTo({ x: safeX, animated: false });
      });
    }
  };

  // ✅ TOPLULUK VERİLERİ KİLİTLEME SİSTEMİ
  const [hasViewedCommunityData, setHasViewedCommunityData] = useState(false); // ✅ Topluluk verilerini gördü mü? (kalıcı kilit)
  
  // ✅ MAÇ PUANI GÖSTERİMİ (KİLİTLİ KURAL)
  // Maç bittikten sonra tahmin yapılmışsa otomatik olarak puanı çeker ve gösterir
  const [predictionScore, setPredictionScore] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const scoreFetchedRef = useRef(false);
  
  // ✅ ThreeFieldView için veri hazırlama (tüm maçlar için 3 saha görünümü)
  const threeFieldData = useMemo(() => {
    
    // Kullanıcı kadrosu - storage'dan yüklü tam kadro varsa göster (hasPrediction yanı sıra kadro tamamlanmışsa da)
    const userSquad = (attackPlayersArray.length >= 11 && attackFormation) ? {
      players: attackPlayersArray.map((p: any) => ({
        id: p.id,
        name: p.name,
        number: p.number || p.jersey_number || 0,
        position: p.position || '',
        photo: p.photo,
        rating: p.rating,
      })),
      formation: attackFormation,
      defenseFormation: defenseFormation || attackFormation,
    } : null;
    
    // Grid sırası: "row:col" (örn. 1:1 = kaleci, 2:x = defans, 3:x = orta, 4:x = forvet) → formasyon slot sırası
    const sortByGrid = (list: { grid?: string | null }[]) => {
      return [...list].sort((a, b) => {
        const parse = (g: string | null | undefined) => {
          if (!g || typeof g !== 'string') return { row: 99, col: 99 };
          const [r, c] = g.split(':').map(Number);
          return { row: Number.isNaN(r) ? 99 : r, col: Number.isNaN(c) ? 99 : c };
        };
        const pa = parse(a.grid);
        const pb = parse(b.grid);
        if (pa.row !== pb.row) return pa.row - pb.row;
        return pa.col - pb.col;
      });
    };

    // Gerçek kadro (lineups'tan) – formasyon slot sırasına göre (grid)
    // Pozisyon/formasyon API'den gelmeli; gelmediyse kadro "hazır" sayılmaz, "henüz netleşmedi" gösterilir
    const resolvedTeamId = effectivePredictionTeamId ?? predictionTeamId;
    let actualPlayers: any[] = [];
    let actualFormation = '4-3-3';
    let hasLineupButNoFormation = false;
    const homeTeamId = matchData?.homeTeam?.id;
    const awayTeamId = matchData?.awayTeam?.id;

    const resolveTargetLineup = (lineupList: any[]) => {
      if (resolvedTeamId != null) {
        const found = lineupList.find((l: any) => l.team?.id === resolvedTeamId);
        if (found) return found;
      }
      // predictionTeamId yoksa: favori takım varsa onun kadrosunu göster (Juventus değil Galatasaray)
      if (favoriteTeamIds?.length && homeTeamId != null && awayTeamId != null) {
        if (favoriteTeamIds.includes(awayTeamId))
          return lineupList.find((l: any) => l.team?.id === awayTeamId) ?? lineupList[0];
        if (favoriteTeamIds.includes(homeTeamId))
          return lineupList.find((l: any) => l.team?.id === homeTeamId) ?? lineupList[0];
      }
      return lineupList[0];
    };

    // Önce lineups'tan dene – kadroyu sadece API'den formasyon da geldiyse doldur
    if (lineups && lineups.length > 0) {
      const targetLineup = resolveTargetLineup(lineups);
      const hasStartXI = (targetLineup?.startXI?.length ?? 0) >= 11;
      const hasFormationFromApi = !!(targetLineup?.formation);

      if (hasStartXI && !hasFormationFromApi) {
        hasLineupButNoFormation = true;
      }
      if (targetLineup?.startXI && targetLineup?.formation) {
        const mapped = targetLineup.startXI.map((item: any) => {
          const player = item.player || item;
          return {
            id: player.id,
            name: player.name,
            number: player.number || 0,
            position: player.pos || player.position || '',
            photo: player.photo,
            rating: player.rating,
            grid: player.grid ?? item.grid,
          };
        });
        actualPlayers = sortByGrid(mapped);
        actualFormation = targetLineup.formation;
      }
    }

    // ✅ Sadece test maçı (888001) için mock kadro – gerçek maçlarda asla mock kullanılmaz (sakat/yanlış oyuncu riski)
    const matchIdNum = matchId ? Number(matchId) : null;
    if (actualPlayers.length === 0 && matchIdNum && isMockTestMatch(matchIdNum)) {
      const rawMock = getMockLineup(matchIdNum);
      const mockList = Array.isArray(rawMock) ? rawMock : (rawMock?.away ? [rawMock.away] : rawMock?.home ? [rawMock.home] : []);
      if (mockList.length > 0) {
        const targetLineup = resolveTargetLineup(mockList);

        if (targetLineup?.startXI) {
          const mapped = targetLineup.startXI.map((item: any) => {
            const player = item.player || item;
            return {
              id: player.id,
              name: player.name,
              number: player.number || 0,
              position: player.pos || player.position || '',
              photo: player.photo,
              rating: player.rating,
              grid: player.grid ?? item.grid,
            };
          });
          actualPlayers = sortByGrid(mapped);
          actualFormation = targetLineup.formation || '4-3-3';
        }
      }
    }
    
    // ✅ CANLI MAÇ: Substitution event'lerini gerçek sahaya yansıt
    // KİLİTLİ KURAL: Oyuncu değişikliği olduğunda çıkan oyuncu yerine giren oyuncu sahada gösterilir
    const displayTeamId = resolvedTeamId ?? (favoriteTeamIds?.length && awayTeamId != null && favoriteTeamIds.includes(awayTeamId) ? awayTeamId : homeTeamId) ?? homeTeamId;
    if (actualPlayers.length > 0 && liveEvents && liveEvents.length > 0) {
      const targetTeamId = displayTeamId;
      const substitutions = liveEvents.filter((e: any) => {
        const eventType = (e.type || '').toLowerCase();
        const isSubst = eventType === 'subst' || eventType === 'substitution';
        if (!isSubst) return false;
        const eventTeamId = e.team?.id;
        return eventTeamId === targetTeamId;
      });
      
      for (const sub of substitutions) {
        const playerOut = sub.player?.id || sub.player?.name;
        const playerIn = sub.assist || {};
        const playerInData = {
          id: typeof playerIn === 'object' ? playerIn.id : 0,
          name: typeof playerIn === 'object' ? playerIn.name : (typeof playerIn === 'string' ? playerIn : ''),
          number: 0,
          position: '',
          photo: null,
          rating: null,
          grid: null,
          isSubstitute: true,
          substitutedFor: typeof sub.player === 'object' ? sub.player.name : sub.player,
          subMinute: sub.time?.elapsed || 0,
        };
        
        const outIdx = actualPlayers.findIndex((p: any) => {
          if (typeof playerOut === 'number') return p.id === playerOut;
          return p.name === playerOut;
        });
        
        if (outIdx >= 0 && playerInData.id) {
          const outPlayer = actualPlayers[outIdx];
          playerInData.grid = outPlayer.grid;
          playerInData.position = outPlayer.position;
          actualPlayers[outIdx] = playerInData;
        }
      }
    }

    // Topluluk kadrosu: gerçek API verisi yoksa test için mock (kullanıcı kadrosu kopyası veya placeholder 11)
    const communityPlayers = (() => {
      if (userSquad && userSquad.players.length >= 11) {
        return userSquad.players.map((p: any) => ({ ...p }));
      }
      const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'];
      return positions.map((pos, i) => ({ id: 9000 + i, name: `Oyuncu ${i + 1}`, number: i + 1, position: pos, rating: 70 + (i % 20), photo: null }));
    })();
    
    return {
      userSquad,
      communitySquad: {
        players: communityPlayers,
        formation: (userSquad?.formation || actualFormation),
        voterCount: 1516,
      },
      actualSquad: {
        players: actualPlayers,
        formation: actualFormation,
      },
      hasLineupButNoFormation,
      homeTeam: {
        id: matchData?.homeTeam?.id || 0,
        name: matchData?.homeTeam?.name || '',
        logo: matchData?.homeTeam?.logo,
      },
      awayTeam: {
        id: matchData?.awayTeam?.id || 0,
        name: matchData?.awayTeam?.name || '',
        logo: matchData?.awayTeam?.logo,
      },
    };
  }, [hasPrediction, attackPlayersArray, attackFormation, defenseFormation, lineups, liveEvents, effectivePredictionTeamId, predictionTeamId, matchData, matchId, favoriteTeamIds]);
  const [showCommunityConfirmModal, setShowCommunityConfirmModal] = useState(false); // ✅ Topluluk verileri görmek için onay modal'ı
  const [lockConfirmType, setLockConfirmType] = useState<'community' | 'real' | null>(null); // ✅ Saha içi "Gör" butonuna basınca: Emin misiniz? popup
  const [showNoCommunityDataBanner, setShowNoCommunityDataBanner] = useState(false); // ✅ "Topluluk Verilerini Gör"e basıldı, veri yok → topluluk renklerinde bildirim
  const [independentPredictionBonus, setIndependentPredictionBonus] = useState(true); // ✅ Bağımsız tahmin bonusu aktif mi?
  const [madeAfterCommunityViewed, setMadeAfterCommunityViewed] = useState(false); // ✅ Topluluk verilerini gördükten sonra silip yeni tahmin yaptı mı? (%80 puan kaybı)
  const [hasChosenIndependentAfterSave, setHasChosenIndependentAfterSave] = useState(false); // ✅ "Tahminler Kaydedildi" popup'ta "Bağımsız Devam Et" seçildi mi? (Bu seçilmeden "Bağımsız Tahmin Modundasınız" gösterilmez)
  
  // ✅ OYUNCU BİLGİ POPUP - Web için Alert yerine Modal (editPlayer: "i" ile açıldığında tahmin düzenlemek için)
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
      penalty: number;       // Penaltıdan gol atar oranı
      substitutedOut: number;
      injuredOut: number;
    } | null;
    showCommunityData: boolean;
    editPlayer?: any;
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
  /** Oyuncu tahmini silme onayı – native confirm yerine uygulama içi popup (resim 1) */
  const [deletePlayerPredictionModal, setDeletePlayerPredictionModal] = useState<{
    playerName: string;
    onConfirm: () => void;
  } | null>(null);
  
  // ✅ TOPLULUK TAHMİN VERİLERİ (Backend'den gelecek, şimdilik mock)
  // Her oyuncu için topluluk tahmin oranları (0.0 - 1.0)
  const [communityPredictions, setCommunityPredictions] = useState<Record<number, {
    goal: number;          // Gol atar oranı
    assist: number;        // Asist yapar oranı
    yellowCard: number;    // Sarı kart görür oranı
    redCard: number;       // Kırmızı kart görür oranı
    penalty: number;       // Penaltıdan gol atar oranı
    substitutedOut: number; // Oyundan çıkar oranı
    injuredOut: number;    // Sakatlanarak çıkar oranı
    totalPredictions: number; // Kaç kullanıcı tahmin yaptı
  }>>({});

  /** Gerçek maçlarda topluluk verisi yoksa kullanılan nötr değer (mock veri gösterilmez) */
  const EMPTY_COMMUNITY_DATA = { goal: 0, assist: 0, yellowCard: 0, redCard: 0, penalty: 0, substitutedOut: 0, injuredOut: 0, totalPredictions: 0 };
  /** Topluluk kartı/popup için mock tahmin oranları — sadece mock maçlarda kullanılır; gerçek maçlarda EMPTY_COMMUNITY_DATA kullan */
  const getMockCommunityDataForPlayer = (player: any): { goal: number; assist: number; yellowCard: number; redCard: number; penalty: number; substitutedOut: number; injuredOut: number; totalPredictions: number } => {
    const pos = (player?.position || player?.pos || '').toUpperCase();
    const id = Number(player?.id) || 0;
    const seed = id % 7;
    const isGK = pos === 'GK' || pos === 'G';
    const isDef = pos.includes('D') || pos === 'CB' || pos === 'LB' || pos === 'RB';
    const isMid = pos.includes('M') || pos === 'CM' || pos === 'CDM' || pos === 'CAM';
    if (isGK) {
      return { goal: 0.02, assist: 0.01, yellowCard: 0.08, redCard: 0.01, penalty: 0.15, substitutedOut: 0.05, injuredOut: 0.02, totalPredictions: 800 + seed * 100 };
    }
    if (isDef) {
      return { goal: 0.08 + seed * 0.02, assist: 0.12 + seed * 0.02, yellowCard: 0.25 + seed * 0.03, redCard: 0.02, penalty: 0.05, substitutedOut: 0.18 + seed * 0.02, injuredOut: 0.03, totalPredictions: 900 + seed * 80 };
    }
    if (isMid) {
      return { goal: 0.22 + seed * 0.03, assist: 0.35 + seed * 0.04, yellowCard: 0.18 + seed * 0.02, redCard: 0.01, penalty: 0.12 + seed * 0.02, substitutedOut: 0.28 + seed * 0.02, injuredOut: 0.04, totalPredictions: 1100 + seed * 90 };
    }
    return { goal: 0.42 + seed * 0.05, assist: 0.28 + seed * 0.03, yellowCard: 0.12, redCard: 0.01, penalty: 0.25 + seed * 0.03, substitutedOut: 0.22, injuredOut: 0.02, totalPredictions: 1200 + seed * 100 };
  };

  // ✅ TOPLULUK VERİLERİ GÖRÜNÜRLüK KONTROLÜ
  // KİLİTLİ KURAL - ONAY ALINMADAN DEĞİŞTİRME:
  // 1. Tahmin kaydedildikten sonra kullanıcı "Topluluk Verilerini Gör" butonuna basarsa
  // 2. VEYA maç canlı/bitmiş ise (izleme modu)
  // DİKKAT: hasViewedCommunityData = true ise tüm tahminler KALİCİ KİLİTLİ
  const communityDataVisible = hasViewedCommunityData || isMatchLive || isMatchFinished;

  // ✅ GERÇEK KADRO GÖRÜNÜRLüK KONTROLÜ
  // KİLİTLİ KURAL - ONAY ALINMADAN DEĞİŞTİRME:
  // A) Maç canlı/bitmiş → Gerçek tab her zaman görünür (tüm kullanıcılar için)
  // B) Maç başlamadı + tahmin yapmamış → Gerçek tab ASLA gösterilmez (spoiler koruması)
  // C) Maç başlamadı + tahmin yapmış + lineup var → "Gerçek Kadroyu Gör" butonu gösterilir
  //    Butona basınca: gerçek kadro açılır + tahminler KALİCİ KİLİTLENİR
  const [hasViewedRealLineup, setHasViewedRealLineup] = useState(false);
  const hasRealLineupData = lineups && Array.isArray(lineups) && lineups.length > 0 && lineups.some((l: any) => l?.startXI?.length > 0);
  // 🔒 KİLİTLİ KURAL: realLineupVisible = isMatchLive || isMatchFinished || hasViewedRealLineup
  // ✅ Tahmin yapılsın ya da yapılmasın, canlı/bitmiş maçta Gerçek sekmesi + takım performansı barı + balon/ipucu aynı şekilde gösterilir.
  const realLineupVisible = isMatchLive || isMatchFinished || hasViewedRealLineup;
  React.useEffect(() => {
    if (!__DEV__ || !matchData?.id) return;
    const lineupCount = Array.isArray(lineups) ? lineups.length : 0;
    const withStartXI = Array.isArray(lineups) ? lineups.filter((l: any) => l?.startXI?.length > 0).length : 0;
    console.log('[LINEUP] Gerçek kadro API/DB:', { matchId: matchData.id, lineupCount, withStartXI, kadroAciklandi: hasRealLineupData });
  }, [matchData?.id, lineups, hasRealLineupData]);
  const canShowRealLineupButton = !isMatchLive && !isMatchFinished && hasPrediction && hasRealLineupData && !hasViewedRealLineup;

  // ✅ MAÇ BİTTİKTEN SONRA PUAN HESAPLAMA (KİLİTLİ KURAL)
  React.useEffect(() => {
    if (!isMatchFinished || !hasPrediction || scoreFetchedRef.current) return;
    scoreFetchedRef.current = true;
    
    const fetchScore = async () => {
      setScoreLoading(true);
      try {
        const matchId = matchData?.id;
        if (!matchId) return;
        const result = await scoringApi.getMatchScores(matchId);
        if (result.success && result.data?.length > 0) {
          setPredictionScore(result.data[0]);
        }
      } catch (e) {
        console.warn('Puan yüklenemedi:', e);
      } finally {
        setScoreLoading(false);
      }
    };
    fetchScore();
  }, [isMatchFinished, hasPrediction, matchData?.id]);

  // ✅ Topluluk verisi oluşturulmaya başladığında ortalamalar hesaplanır
  // hasRealCommunityData = true → en az 1 katılımcı verisi var; ortalamalar bu veriden hesaplanır
  const hasRealCommunityData = useMemo(() => {
    const entries = Object.values(communityPredictions);
    return entries.length > 0 && entries.some((c) => c && c.totalPredictions >= 1);
  }, [communityPredictions]);

  // ✅ TOPLULUK TAHMİN VERİLERİ (Backend'den gelecek - şu an kullanılmıyor)
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
    // Korner İstatistikleri (topluluk tahmini)
    corners: {
      totalRanges: [
        { range: '0-6', percentage: 18 },
        { range: '7-10', percentage: 42 },
        { range: '11-14', percentage: 28 },
        { range: '15+', percentage: 12 },
      ],
      avgTotal: 9,
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
    totalUsers: 1516,
    // Topluluk formasyon dağılımı (atak / defans)
    attackFormations: [
      { name: '4-3-3', percentage: 42 },
      { name: '4-4-2', percentage: 28 },
      { name: '3-5-2', percentage: 18 },
      { name: 'Diğer', percentage: 12 },
    ],
    defenseFormations: [
      { name: '4-4-2', percentage: 28 },
      { name: '4-3-3', percentage: 24 },
      { name: '3-5-2', percentage: 22 },
      { name: 'Diğer', percentage: 26 },
    ],
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
    yellowCards: '3-4', // En popüler sarı kart aralığı (UI'da 1-2, 3-4, 5-6, 7+)
    redCards: '1', // Çoğu maçta 0 kırmızı; UI 1, 2, 3, 4+ (seçim yoksa 0 sayılır)
    totalShots: '11-20', // En popüler şut aralığı
    shotsOnTarget: '6-10', // En popüler isabetli şut (UI'da 0-5, 6-10, 11-15, 16+ var)
    totalCorners: '7-10', // En popüler korner aralığı
    tempo: 'Orta tempo', // En popüler tempo
    scenario: 'Dengeli maç', // En popüler senaryo
    possession: communityMatchPredictions.possession.avgHomePossession,
  }), [communityMatchPredictions]);
  
  React.useEffect(() => {
    if (isViewOnlyMode && !initialPredictionsLoaded) {
      console.log('📊 [VIEW_ONLY] Tahmin yapılmamış maç — Topluluk sekmesi aktif edilecek');
      setPredictionViewIndex(1);
      setInitialPredictionsLoaded(true);
    }
  }, [isViewOnlyMode, initialPredictionsLoaded]);
  
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

  // ✅ Gerçek kadro görüldükten sonra takım performansı topluluk ortalaması: 5 dk'da bir güncelleme (API hazır olduğunda bağlanacak)
  useEffect(() => {
    if (!matchId || (!isMatchLive && !isMatchFinished)) return;
    const fetchCommunityAvg = () => {
      // Topluluk verisi oluşturulmaya başladığında ortalamayı hesapla
      // TODO: scoringApi.getCommunityTeamPerformance(matchId, teamId) → { avg, participantCount }
      // participantCount >= 1 ise setCommunityTeamPerformanceAvg(avg) ve gerekirse setCommunityPredictions(...)
      // Şu an backend endpoint yok; eklendiğinde burada çağrılacak.
    };
    fetchCommunityAvg();
    const interval = setInterval(fetchCommunityAvg, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [matchId, isMatchLive, isMatchFinished]);

  // ✅ Mock test maçı: topluluk verisi ve takım performans ortalaması seed'le (test için)
  useEffect(() => {
    const matchIdNum = matchId ? Number(matchId) : null;
    if (!matchIdNum || !isMockTestMatch(matchIdNum)) return;
    const total = 100;
    setCommunityPredictions({
      101: { goal: 24, assist: 12, yellowCard: 15, redCard: 3, penalty: 2, substitutedOut: 35, injuredOut: 5, totalPredictions: total },
      102: { goal: 18, assist: 22, yellowCard: 8, redCard: 1, penalty: 0, substitutedOut: 12, injuredOut: 2, totalPredictions: total },
      103: { goal: 8, assist: 5, yellowCard: 25, redCard: 2, penalty: 1, substitutedOut: 45, injuredOut: 8, totalPredictions: total },
      104: { goal: 14, assist: 18, yellowCard: 10, redCard: 0, penalty: 0, substitutedOut: 20, injuredOut: 3, totalPredictions: total },
      105: { goal: 6, assist: 10, yellowCard: 12, redCard: 1, penalty: 0, substitutedOut: 28, injuredOut: 4, totalPredictions: total },
      106: { goal: 10, assist: 8, yellowCard: 6, redCard: 0, penalty: 0, substitutedOut: 15, injuredOut: 2, totalPredictions: total },
      107: { goal: 2, assist: 4, yellowCard: 18, redCard: 0, penalty: 0, substitutedOut: 22, injuredOut: 5, totalPredictions: total },
      108: { goal: 0, assist: 2, yellowCard: 14, redCard: 1, penalty: 0, substitutedOut: 18, injuredOut: 3, totalPredictions: total },
      109: { goal: 1, assist: 3, yellowCard: 20, redCard: 0, penalty: 0, substitutedOut: 25, injuredOut: 6, totalPredictions: total },
      110: { goal: 0, assist: 1, yellowCard: 8, redCard: 0, penalty: 0, substitutedOut: 10, injuredOut: 2, totalPredictions: total },
      111: { goal: 0, assist: 0, yellowCard: 2, redCard: 0, penalty: 0, substitutedOut: 5, injuredOut: 1, totalPredictions: total },
      112: { goal: 12, assist: 6, yellowCard: 11, redCard: 0, penalty: 0, substitutedOut: 30, injuredOut: 4, totalPredictions: total },
    });
    setCommunityTeamPerformanceAvg(6.2);
  }, [matchId]);
  
  // ✅ Tahmin kategorisi için timing badge bilgisi al
  const getTimingInfo = React.useCallback((category: string) => {
    return getTimingBadgeProps(category, matchPhase, occurredEvents);
  }, [matchPhase, occurredEvents]);
  
  // ✅ Canlı maç istatistikleri (API'den – şut, korner, top hakimiyeti; event dışı)
  const [liveStatsFromApi, setLiveStatsFromApi] = useState<{
    possessionHome: number | null;
    totalShots: number | null;
    shotsOnTarget: number | null;
    totalCorners: number | null;
  }>({ possessionHome: null, totalShots: null, shotsOnTarget: null, totalCorners: null });

  React.useEffect(() => {
    if (!liveStatistics || (!isMatchLive && !isMatchFinished)) return;
    const raw = Array.isArray(liveStatistics) ? liveStatistics : (liveStatistics?.data ?? liveStatistics?.statistics);
    if (!raw || !Array.isArray(raw) || raw.length < 2) return;
    const homeStats = (raw[0]?.statistics || []) as { type?: string; value?: string | number }[];
    const awayStats = (raw[1]?.statistics || []) as { type?: string; value?: string | number }[];
    const getVal = (arr: { type?: string; value?: string | number }[], type: string): number | null => {
      const s = arr.find((x: any) => x.type === type);
      if (s?.value == null) return null;
      const v = typeof s.value === 'string' ? parseInt(s.value.replace(/%/g, ''), 10) : Number(s.value);
      return Number.isNaN(v) ? null : v;
    };
    const homePoss = getVal(homeStats, 'Ball Possession');
    const awayPoss = getVal(awayStats, 'Ball Possession');
    const homeShots = getVal(homeStats, 'Total Shots');
    const awayShots = getVal(awayStats, 'Total Shots');
    const homeSog = getVal(homeStats, 'Shots on Goal');
    const awaySog = getVal(awayStats, 'Shots on Goal');
    const homeCorners = getVal(homeStats, 'Corner Kicks');
    const awayCorners = getVal(awayStats, 'Corner Kicks');
    setLiveStatsFromApi({
      possessionHome: homePoss ?? (awayPoss != null ? 100 - awayPoss : null),
      totalShots: (homeShots != null && awayShots != null) ? homeShots + awayShots : homeShots ?? awayShots,
      shotsOnTarget: (homeSog != null && awaySog != null) ? homeSog + awaySog : homeSog ?? awaySog,
      totalCorners: (homeCorners != null && awayCorners != null) ? homeCorners + awayCorners : homeCorners ?? awayCorners,
    });
  }, [liveStatistics, isMatchLive, isMatchFinished]);

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
      // Gerçek maç - matchData'dan al (MatchDetail homeScore/awayScore/halftimeScore ile geçiriyor)
      const homeScore = matchData?.goals?.home ?? matchData?.score?.home ?? (matchData?.homeScore != null ? matchData.homeScore : null);
      const awayScore = matchData?.goals?.away ?? matchData?.score?.away ?? (matchData?.awayScore != null ? matchData.awayScore : null);
      let htHome = matchData?.score?.halftime?.home ?? matchData?.halftimeScore?.home ?? null;
      let htAway = matchData?.score?.halftime?.away ?? matchData?.halftimeScore?.away ?? null;
      
      // Event'lerden kart ve gol bilgilerini çıkar; ilk yarı skoru yoksa eventlerden hesapla
      let totalYellowCards: number | null = null;
      let totalRedCards: number | null = null;
      let firstGoalMinute: number | null = null;
      const playerEventsMap: Record<number, { goals: number; assists: number; yellowCards: number; redCards: number; substitutedOut: boolean; substituteMinute: number | null }> = {};
      const homeTeamId = matchData?.teams?.home?.id ?? matchData?.homeTeam?.id;
      const awayTeamId = matchData?.teams?.away?.id ?? matchData?.awayTeam?.id;
      
      if (liveEvents && liveEvents.length > 0) {
        let yellowCount = 0;
        let redCount = 0;
        let firstGoalMin: number | null = null;
        let firstHalfHome = 0;
        let firstHalfAway = 0;
        
        for (const evt of liveEvents) {
          const evtType = (evt.type || '').toLowerCase();
          const playerId = evt.player?.id;
          const assistId = evt.assist?.id;
          const minute = evt.time?.elapsed || 0;
          const extra = evt.time?.extra ?? 0;
          const isFirstHalf = minute < 45 || (minute === 45 && extra <= 0);
          
          if (evtType === 'goal') {
            if (firstGoalMin === null) firstGoalMin = minute;
            if (isFirstHalf) {
              const evtTeamId = evt.team?.id;
              const isOwnGoal = (evt.detail || '').toLowerCase().includes('own goal');
              if (evtTeamId === homeTeamId) {
                firstHalfHome += isOwnGoal ? 0 : 1;
                firstHalfAway += isOwnGoal ? 1 : 0;
              } else if (evtTeamId === awayTeamId) {
                firstHalfAway += isOwnGoal ? 0 : 1;
                firstHalfHome += isOwnGoal ? 1 : 0;
              }
            }
            if (playerId) {
              if (!playerEventsMap[playerId]) playerEventsMap[playerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOut: false, substituteMinute: null };
              playerEventsMap[playerId].goals++;
            }
            if (assistId) {
              if (!playerEventsMap[assistId]) playerEventsMap[assistId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOut: false, substituteMinute: null };
              playerEventsMap[assistId].assists++;
            }
          } else if (evtType === 'card') {
            const detail = (evt.detail || '').toLowerCase();
            if (detail.includes('yellow')) {
              yellowCount++;
              if (playerId) {
                if (!playerEventsMap[playerId]) playerEventsMap[playerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOut: false, substituteMinute: null };
                playerEventsMap[playerId].yellowCards++;
              }
            }
            if (detail.includes('red')) {
              redCount++;
              if (playerId) {
                if (!playerEventsMap[playerId]) playerEventsMap[playerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOut: false, substituteMinute: null };
                playerEventsMap[playerId].redCards++;
              }
            }
          } else if (evtType === 'subst' || evtType === 'substitution') {
            if (playerId) {
              if (!playerEventsMap[playerId]) playerEventsMap[playerId] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0, substitutedOut: false, substituteMinute: null };
              playerEventsMap[playerId].substitutedOut = true;
              playerEventsMap[playerId].substituteMinute = minute;
            }
          }
        }
        
        totalYellowCards = yellowCount;
        totalRedCards = redCount;
        firstGoalMinute = firstGoalMin;
        if (htHome === null && liveEvents.length > 0) htHome = firstHalfHome;
        if (htAway === null && liveEvents.length > 0) htAway = firstHalfAway;
      }
      
      setActualResults({
        firstHalfHomeScore: htHome,
        firstHalfAwayScore: htAway,
        secondHalfHomeScore: homeScore !== null && htHome !== null ? homeScore - htHome : null,
        secondHalfAwayScore: awayScore !== null && htAway !== null ? awayScore - htAway : null,
        fullTimeHomeScore: homeScore,
        fullTimeAwayScore: awayScore,
        totalYellowCards,
        totalRedCards,
        totalGoals: homeScore !== null && awayScore !== null ? homeScore + awayScore : null,
        firstGoalMinute,
        playerEvents: playerEventsMap,
      });
    }
  }, [matchPhase, isMatchLive, isMatchFinished, matchId, matchData, liveEvents]);

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
  
  // ✅ KİLİTLİ KURAL: Mock topluluk oyuncu verileri KALDIRILDI
  // Backend topluluk API'si hazır olduğunda burası gerçek verilerle doldurulacak
  // setCommunityPredictions(realDataFromBackend);
  
  // ✅ Canlı maç sinyallerini yükle (sadece canlı maçlarda). Gerçek maçlarda mock sinyal yok — sadece API verisi veya boş.
  React.useEffect(() => {
    if (!isMatchLive || !attackPlayersArray || attackPlayersArray.length === 0) {
      setLiveSignals({});
      return;
    }
    const isMock = matchIdNum != null && isMockTestMatch(matchIdNum);
    if (!isMock) {
      setLiveSignals({});
      return;
    }
    // Sadece mock maçlarda mock sinyal verileri
    const signalsMap: Record<number, PlayerSignals> = {};
    attackPlayersArray.forEach((player: any) => {
      const isGoalkeeper = player.position?.toUpperCase() === 'GK' || 
                           player.position?.toLowerCase().includes('goalkeeper');
      const teamId = predictionTeamId || 611;
      signalsMap[player.id] = getMockCommunitySignals(
        player.id,
        player.name,
        isGoalkeeper,
        teamId,
        45
      );
    });
    setLiveSignals(signalsMap);
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
  }, [isMatchLive, attackPlayersArray, predictionTeamId, matchIdNum]);
  
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
        
        if (squadData) {
          const parsed = JSON.parse(squadData);
          // ✅ Slot sırası kesin: önce attackPlayersBySlot (açık slot), yoksa array/object (geriye uyumlu)
          let arr: any[] = Array.from({ length: 11 }, (_, i) => null);
          if (parsed.attackPlayersBySlot && Array.isArray(parsed.attackPlayersBySlot)) {
            for (let i = 0; i < 11; i++) {
              const entry = parsed.attackPlayersBySlot.find((x: { slot: number }) => x.slot === i);
              arr[i] = entry?.player ?? null;
            }
          } else if (parsed.attackPlayersArray && Array.isArray(parsed.attackPlayersArray)) {
            for (let i = 0; i < 11; i++) arr[i] = parsed.attackPlayersArray[i] ?? null;
          } else if (parsed.attackPlayers && typeof parsed.attackPlayers === 'object') {
            for (let i = 0; i < 11; i++) arr[i] = parsed.attackPlayers[i] ?? parsed.attackPlayers[String(i)] ?? null;
          }
          const filledCount = arr.filter(Boolean).length;
          // ✅ Atak kadrosu 11 ise yükle - isCompleted kontrolü yapma, sadece 11 oyuncu varsa göster
          if (filledCount >= 11 && parsed.attackFormation) {
            const rawKey = String(parsed.attackFormation).trim();
            // Kadro ile aynı slot/pozisyon: formasyon id'sini formations listesine göre normalize et
            const formationKey = formations.find((f: { id: string }) => f.id === rawKey)?.id ?? rawKey;
            console.log('✅ [MatchPrediction] Kadro yüklendi:', arr.length, 'oyuncu, formasyon:', formationKey);
            setAttackPlayersArray(arr);
            setAttackFormation(formationKey || null);
            if (parsed.defenseFormation) setDefenseFormation(parsed.defenseFormation);
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
          console.log('⚠️ [MatchPrediction] Kadro bulunamadı:', { key });
          setSquadLoaded(true);
        }
      } catch (error) {
        console.error('❌ [MatchPrediction] Error loading squad:', error);
        setSquadLoaded(true);
      }
    };
    loadSquad();
  }, [squadStorageKey]);

  // ✅ Yedek oyuncuları hesapla (tüm kadro - ilk 11)
  const reserveTeamPlayers = React.useMemo(() => {
    // İlk 11'deki oyuncu ID'leri (null slot'lara karşı güvenli)
    const startingXIIds = new Set(attackPlayersArray.filter(Boolean).map((p: any) => p.id));
    
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

  // Match predictions state - tahmin yapılmadıysa tüm alanlar null/boş
  const [predictions, setPredictions] = useState({
    firstHalfHomeScore: null as number | null,
    firstHalfAwayScore: null as number | null,
    firstHalfInjuryTime: null as string | null,
    secondHalfHomeScore: null as number | null,
    secondHalfAwayScore: null as number | null,
    secondHalfInjuryTime: null as string | null,
    totalGoals: null as string | null,
    firstGoalTime: null as string | null,
    yellowCards: null as string | null,
    redCards: null as string | null,
    possession: null as string | null,
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
        const data = await AsyncStorage.getItem(predictionStorageKey);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.matchPredictions) {
          const loaded = parsed.matchPredictions as Record<string, unknown>;
          setPredictions(prev => ({
            ...prev,
            ...loaded,
            firstHalfHomeScore: loaded.firstHalfHomeScore != null ? (loaded.firstHalfHomeScore as number) : null,
            firstHalfAwayScore: loaded.firstHalfAwayScore != null ? (loaded.firstHalfAwayScore as number) : null,
            secondHalfHomeScore: loaded.secondHalfHomeScore != null ? (loaded.secondHalfHomeScore as number) : null,
            secondHalfAwayScore: loaded.secondHalfAwayScore != null ? (loaded.secondHalfAwayScore as number) : null,
          }));
        }
        if (parsed.playerPredictions && typeof parsed.playerPredictions === 'object') setPlayerPredictions(parsed.playerPredictions);
        if (Array.isArray(parsed.focusedPredictions)) setFocusedPredictions(parsed.focusedPredictions);
        if (parsed.selectedAnalysisFocus) setSelectedAnalysisFocus(parsed.selectedAnalysisFocus);
        // Oyuncu bazlı kilit listesi (her oyuncu ayrı kilitlenir/açılır)
        if (Array.isArray(parsed.lockedPlayerIds)) setLockedPlayerIds(parsed.lockedPlayerIds.map((id: any) => Number(id)));
        // Global kilit: geriye uyum + maç canlı/bitmişte tüm tahminler kilitli
        setIsPredictionLocked(parsed.isPredictionLocked === true || isMatchLive || isMatchFinished);
        
        // ✅ TOPLULUK VERİLERİ KİLİTLEME - hasViewedCommunityData yükle
        // Bu değer true ise kullanıcı topluluk verilerini görmüş demek, tahminleri kalıcı kilitli
        if (parsed.hasViewedCommunityData !== undefined) {
          setHasViewedCommunityData(parsed.hasViewedCommunityData === true);
          if (parsed.hasViewedCommunityData === true) {
            setIndependentPredictionBonus(false);
          }
        }
        
        // ✅ GERÇEK KADRO KİLİTLEME - hasViewedRealLineup yükle
        // Bu değer true ise kullanıcı gerçek kadroyu görmüş, tahminler kalıcı kilitli
        if (parsed.hasViewedRealLineup === true) {
          setHasViewedRealLineup(true);
        }
        
        // ✅ TOPLULUK GÖRDÜKTEN SONRA YENİ TAHMİN - madeAfterCommunityViewed yükle
        // Bu değer true ise kullanıcı topluluk verilerini gördükten sonra silip yeni tahmin yapmış
        if (parsed.madeAfterCommunityViewed !== undefined) {
          setMadeAfterCommunityViewed(parsed.madeAfterCommunityViewed === true);
        }
        // ✅ Bağımsız Devam Et seçildi mi? (Tahminler Kaydedildi popup'tan sonra)
        if (parsed.hasChosenIndependentAfterSave === true) {
          setHasChosenIndependentAfterSave(true);
        }
        // ✅ Takım performans puanı – sayfaya dönünce göster
        if (parsed.teamPerformance != null && typeof parsed.teamPerformance === 'number') {
          setTeamPerformance(Math.max(1, Math.min(10, Math.round(parsed.teamPerformance))));
        }
        // ✅ İlk yükleme tamamlandı - artık değişiklikleri takip edebiliriz
        setTimeout(() => setInitialPredictionsLoaded(true), 100);
      } catch (_) {
        // ✅ Tahmin verisi yoksa, kullanıcı daha önce topluluk verilerini görüp silmiş mi kontrol et
        // Eğer görüp silmişse, yeni tahmin %80 puan kaybına uğrar
        try {
          const communityViewedKey = `community_viewed_${matchData?.id}${predictionTeamId != null ? `-${predictionTeamId}` : ''}`;
          const communityViewedData = await AsyncStorage.getItem(communityViewedKey);
          if (communityViewedData) {
            const parsed = JSON.parse(communityViewedData);
            if (parsed.hadViewedCommunityData === true) {
              setMadeAfterCommunityViewed(true);
              setIndependentPredictionBonus(false);
              console.log('⚠️ Kullanıcı topluluk verilerini gördükten sonra tahmini silmiş - yeni tahmin %80 puan kaybı');
            }
          }
        } catch (__) {}
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
    if (isPredictionLocked || !initialPredictionsLoaded) return;
    
    const hasFullTimeScore = predictions.secondHalfHomeScore !== null && predictions.secondHalfAwayScore !== null;
    
    if (hasFullTimeScore) {
      const home = predictions.secondHalfHomeScore ?? 0;
      const away = predictions.secondHalfAwayScore ?? 0;
      const sum = home + away;
      
      let calculatedRange: string | null = null;
      if (sum <= 1) calculatedRange = '0-1 gol';
      else if (sum <= 3) calculatedRange = '2-3 gol';
      else if (sum <= 5) calculatedRange = '4-5 gol';
      else calculatedRange = '6+ gol';
      
      // Skor değiştiğinde toplam gol her zaman eşleşmeli
      setPredictions(prev => {
        if (prev.totalGoals === calculatedRange) return prev;
        return {
          ...prev,
          totalGoals: calculatedRange
        };
      });
      setHasUnsavedChanges(true);
    }
  }, [predictions.secondHalfHomeScore, predictions.secondHalfAwayScore, isPredictionLocked, initialPredictionsLoaded]);

  // ✅ OYUNCU TAHMİNLERİNDEN OTOMATİK KART/GOL HESAPLAMA
  // Kullanıcı oyuncu bazında kart/gol tahmini yaptığında, toplam kart/gol değerlerini otomatik doldur
  React.useEffect(() => {
    if (isPredictionLocked || !initialPredictionsLoaded) return;
    if (Object.keys(playerPredictions).length === 0) return;
    
    // Oyuncu tahminlerinden toplam sayıları hesapla
    let totalYellowCards = 0;
    let totalRedCards = 0;
    let totalGoals = 0;
    let hasAnyCardPrediction = false;
    let hasAnyGoalPrediction = false;
    
    Object.values(playerPredictions).forEach((pred: any) => {
      if (!pred) return;
      
      // Sarı kart tahmini
      if (pred.yellowCard === true) {
        totalYellowCards++;
        hasAnyCardPrediction = true;
      }
      
      // Kırmızı kart tahmini (direkt veya çift sarı)
      if (pred.redCard === true || pred.directRedCard === true || pred.secondYellowRed === true) {
        totalRedCards++;
        hasAnyCardPrediction = true;
      }
      
      // Gol tahmini
      if (pred.willScore === true || pred.goal === true) {
        // Gol sayısı belirtilmişse onu kullan
        const goalCount = pred.goalCount ? parseInt(pred.goalCount, 10) : 1;
        totalGoals += goalCount || 1;
        hasAnyGoalPrediction = true;
      }
    });
    
    // ✅ Sarı kart aralığını belirle (1-2, 3-4, 5-6, 7+)
    if (hasAnyCardPrediction) {
      let yellowCardRange: string;
      if (totalYellowCards <= 2) yellowCardRange = '1-2';
      else if (totalYellowCards <= 4) yellowCardRange = '3-4';
      else if (totalYellowCards <= 6) yellowCardRange = '5-6';
      else yellowCardRange = '7+';
      
      // Kullanıcı manuel seçim yapmamışsa otomatik güncelle
      if (predictions.yellowCards === null) {
        setPredictions(prev => {
          if (prev.yellowCards === yellowCardRange) return prev;
          return { ...prev, yellowCards: yellowCardRange };
        });
      }
      
      // Kırmızı kart: 1, 2, 3, 4+ (seçim yoksa puanlamada 0 kırmızı sayılır)
      if (totalRedCards >= 1) {
        let redCardRange: string;
        if (totalRedCards === 1) redCardRange = '1';
        else if (totalRedCards === 2) redCardRange = '2';
        else if (totalRedCards === 3) redCardRange = '3';
        else redCardRange = '4+';
        if (predictions.redCards === null) {
          setPredictions(prev => {
            if (prev.redCards === redCardRange) return prev;
            return { ...prev, redCards: redCardRange };
          });
        }
      }
    }
    
    // ✅ Gol aralığını belirle (oyuncu tahminlerinden)
    // NOT: Maç skoru tahmininden ayrı, oyuncu bazlı tahminlerden de hesaplanabilir
    // Ancak maç skoru tahmini daha öncelikli olduğu için burada onu ezmiyoruz
    // Sadece maç skoru tahmini yapılmamışsa oyuncu tahminlerinden türet
    if (hasAnyGoalPrediction && predictions.secondHalfHomeScore === null && predictions.secondHalfAwayScore === null) {
      let goalRange: string;
      if (totalGoals <= 1) goalRange = '0-1 gol';
      else if (totalGoals <= 3) goalRange = '2-3 gol';
      else if (totalGoals <= 5) goalRange = '4-5 gol';
      else goalRange = '6+ gol';
      
      if (predictions.totalGoals === null) {
        setPredictions(prev => {
          if (prev.totalGoals === goalRange) return prev;
          return { ...prev, totalGoals: goalRange };
        });
      }
    }
  }, [playerPredictions, isPredictionLocked, initialPredictionsLoaded, predictions.yellowCards, predictions.redCards, predictions.totalGoals, predictions.secondHalfHomeScore, predictions.secondHalfAwayScore]);

  // ✅ Oyuncu kartlarındaki tahminlere göre toplam sarı/kırmızı kart sayıları (Disiplin bölümünde gösterilir)
  const disciplineTotalsFromPlayers = React.useMemo(() => {
    let yellow = 0;
    let red = 0;
    Object.values(playerPredictions).forEach((pred: any) => {
      if (!pred) return;
      if (pred.yellowCard === true) yellow++;
      if (pred.redCard === true || pred.directRedCard === true || pred.secondYellowRed === true) red++;
    });
    return { yellow, red };
  }, [playerPredictions]);

  const handlePlayerPredictionChange = (category: string, value: string | boolean) => {
    if (!selectedPlayer) return;
    // ✅ Master kilit: Tahminler kaydedilip kilitlendiyse oyuncu tahmininde değişiklik yok
    if (isPredictionLocked) {
      setLockedWarningReason('match_started');
      setShowLockedWarningModal(true);
      return;
    }
    // ✅ TOPLULUK VERİLERİ GÖRÜLDÜYse TÜM TAHMİNLER KALİCİ KİLİTLİ
    if (hasViewedCommunityData) {
      setLockedWarningReason('unlock_at_bottom');
      setShowLockedWarningModal(true);
      return;
    }
    
    // Maç başladıysa/bittiyse tahmin değiştirilemez
    if (isMatchLive || isMatchFinished) {
      setLockedWarningReason('match_started');
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
      
      // ✅ Penaltıdan Gol Atacak seçilirse, Gol Atar + 1 gol otomatik seçilsin
      if (category === 'penaltyScored' && value === true) {
        newPredictions.willScore = true;
        if (!newPredictions.goalCount) newPredictions.goalCount = 1;
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

  // ✅ TAKIM PERFORMANSI DEĞERLENDİRME (1-10)
  const handleTeamPerformanceChange = React.useCallback((value: number) => {
    setTeamPerformance(value);
  }, []);

  const handleSavePredictions = async () => {
    if (isSaving) return;
    
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
        showInfo(
          'Tahmin Yapılmadı',
          'Henüz hiçbir tahmin yapmadınız.\n\nAşağıdakilerden en az birini yapabilirsiniz:\n\n• Maç sonu skoru tahmini\n• Toplam gol tahmini\n• Kadro oluşturup oyuncu tahminleri'
        );
        return;
      }
      
      setIsSaving(true); // ✅ Kaydetme başladı
      // ✅ Master kilit hemen görünsün (buton ve kilit ikonu kırmızı)
      setIsPredictionLocked(true);
      onPredictionLockedChange?.(true);

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
        lockedPlayerIds: lockedPlayerIds, // ✅ Oyuncu bazlı kilit listesi
        focusedPredictions: focusedPredictions, // 🌟 Strategic Focus
        selectedAnalysisFocus: selectedAnalysisFocus, // 🎯 Seçilen analiz odağı
        teamPerformance, // ✅ Takım performans puanı (1-10), sayfaya dönünce gösterilir
        isPredictionLocked: true, // Kaydet sonrası kilitli (geriye uyum)
        hasViewedCommunityData: hasViewedCommunityData, // ✅ Topluluk verileri görüldü mü?
        hasChosenIndependentAfterSave: hasChosenIndependentAfterSave,
        independentPredictionBonus: !hasViewedCommunityData && !madeAfterCommunityViewed, // ✅ Bağımsız tahmin bonusu (+%10) - topluluk görüp silip yaptıysa yok
        madeAfterCommunityViewed: madeAfterCommunityViewed, // ✅ Topluluk gördükten sonra silip yeni tahmin yaptı mı? (%80 puan kaybı)
        timestamp: new Date().toISOString(),
      };
      
      // 💾 SAVE TO ASYNCSTORAGE (Local backup) – takıma özel anahtar kullan (iki favori maç)
      const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(predictionData));
      setPlayerPredictions(cleanedPlayerPredictions);
      setHasUnsavedChanges(false);
      
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


        // Execute all database saves with timeout (8 saniye – ağ yavaşsa kilit yine local'de kalır, kullanıcı daha çabuk yanıt alır)
        const timeoutMs = 8000;
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), timeoutMs)
        );
        
        try {
          const results = await Promise.race([
            Promise.allSettled(predictionPromises),
            timeoutPromise
          ]) as PromiseSettledResult<any>[] | undefined;
          
          if (Array.isArray(results)) {
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failCount = results.filter(r => r.status === 'rejected').length;
            console.log(`✅ Predictions saved: ${successCount} success, ${failCount} failed`);
          } else {
            console.warn('⚠️ Database save timed out, but local backup is available');
          }
        } catch (timeoutErr) {
          console.warn('⚠️ Database save timed out, but local backup is available');
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        // Continue even if database save fails (we have local backup)
      }
      
      setIsSaving(false);

      // ✅ Şerit/toast bildirimi kaldırıldı – zaten "Tahminler Kaydedildi!" popup gösteriliyor

      // ✅ TOPLULUK VERİLERİ MODAL - Kayıt sonrası kullanıcıya sor (bağımsız devam edebilir)
      if (!hasViewedCommunityData) {
        setShowCommunityConfirmModal(true);
      }
      
      // ✅ Sayfanın en altına kaydır – bağımsız/topluluk/gerçek bildirimi görünsün
      setTimeout(() => mainScrollRef.current?.scrollToEnd({ animated: true }), 400);
      
      // ✅ MatchDetail'da yıldızı güncelle
      onPredictionsSaved?.();
      // ✅ İki favori maçta diğer takım teklifi için hangi takım kaydedildi
      if (predictionTeamId != null) onPredictionsSavedForTeam?.(predictionTeamId);
    } catch (error) {
      setIsSaving(false);
      setIsPredictionLocked(false); // ✅ Hata durumunda kilidi geri aç
      onPredictionLockedChange?.(false);
      console.error('Error saving predictions:', error);
      handleError(error as Error, {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.HIGH,
        context: { matchId: matchData.id, action: 'save_predictions' },
      });
      showError('Hata!', 'Tahminler kaydedilemedi. Lütfen tekrar deneyin.');
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

  // ✅ Sadece bu oyuncunun tahminini kaydet ve bu oyuncuyu kilitle (popup Kaydet)
  const saveSinglePlayerAndLock = React.useCallback(async (playerId: number) => {
    const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
    if (!storageKey) return;
    setPlayerPredictions(prev => prev); // flush state
    const currentPlayerPreds = playerPredictions[playerId] ?? playerPredictions[String(playerId)] ?? {};
    if (!hasAnyRealPlayerPrediction(currentPlayerPreds)) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const mergedPlayerPredictions = { ...(parsed.playerPredictions || {}), [playerId]: currentPlayerPreds };
      const nextLocked = parsed.lockedPlayerIds && Array.isArray(parsed.lockedPlayerIds)
        ? (parsed.lockedPlayerIds.includes(playerId) ? parsed.lockedPlayerIds : [...parsed.lockedPlayerIds, playerId])
        : [playerId];
      const toSave = {
        ...parsed,
        matchId: matchData?.id,
        playerPredictions: mergedPlayerPredictions,
        lockedPlayerIds: nextLocked,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(toSave));
      setLockedPlayerIds(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
      setPlayerPredictions(prev => ({ ...prev, [playerId]: currentPlayerPreds }));
      setHasUnsavedChanges(false);
    } catch (e) {
      console.warn('Oyuncu tahmini kaydedilemedi:', e);
    }
  }, [predictionStorageKey, matchData?.id, playerPredictions]);

  // ✅ Sadece bu oyuncunun kilidini aç (popup Kilidi Aç)
  const unlockSinglePlayer = React.useCallback(async (playerId: number) => {
    const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
    if (!storageKey) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const nextLocked = (parsed.lockedPlayerIds && Array.isArray(parsed.lockedPlayerIds))
        ? parsed.lockedPlayerIds.filter((id: number) => Number(id) !== Number(playerId))
        : [];
      await AsyncStorage.setItem(storageKey, JSON.stringify({ ...parsed, lockedPlayerIds: nextLocked }));
      setLockedPlayerIds(prev => prev.filter(id => id !== playerId));
    } catch (e) {
      console.warn('Oyuncu kilidi açılamadı:', e);
    }
  }, [predictionStorageKey, matchData?.id]);

  // ✅ Sadece bu oyuncuyu kilitle (X ile kapatılınca tekrar açıldığında kilitli görünsün)
  const lockSinglePlayer = React.useCallback(async (playerId: number) => {
    const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
    if (!storageKey) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const nextLocked = parsed.lockedPlayerIds && Array.isArray(parsed.lockedPlayerIds)
        ? (parsed.lockedPlayerIds.includes(playerId) ? parsed.lockedPlayerIds : [...parsed.lockedPlayerIds, playerId])
        : [playerId];
      await AsyncStorage.setItem(storageKey, JSON.stringify({ ...parsed, lockedPlayerIds: nextLocked }));
      setLockedPlayerIds(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
    } catch (e) {
      console.warn('Oyuncu kilidi kaydedilemedi:', e);
    }
  }, [predictionStorageKey, matchData?.id]);

  const isPlayerLocked = React.useCallback((id: number) => {
    return lockedPlayerIds.includes(Number(id));
  }, [lockedPlayerIds]);

  // ✅ Popup kapatılmak istenince: kaydedilmemiş değişiklik varsa uyarı göster, Kaydet’e yönlendir
  const tryClosePlayerModal = React.useCallback((by: 'close' | 'cancel') => {
    if (!selectedPlayer) return;
    const playerId = selectedPlayer.id;
    if (isMatchLive || isMatchFinished) {
      setSelectedPlayer(null);
      return;
    }
    // Çarpı / Vazgeç: tahminleri açılış anına döndür, kilitle, kapat (kaydedilmez, mevcut hali korunur)
    const closeAndLock = () => {
      const initialStr = initialPlayerPredictionsRef.current;
      let initialObj: Record<string, unknown> = {};
      if (initialStr) try { initialObj = JSON.parse(initialStr); } catch (_) {}
      setPlayerPredictions(prev => ({ ...prev, [playerId]: initialObj }));
      (async () => {
        const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
        if (storageKey) {
          try {
            const raw = await AsyncStorage.getItem(storageKey);
            const parsed = raw ? JSON.parse(raw) : {};
            const pp = { ...(parsed.playerPredictions || {}) };
            pp[playerId] = initialObj;
            await AsyncStorage.setItem(storageKey, JSON.stringify({ ...parsed, playerPredictions: pp }));
          } catch (_) {}
        }
        await lockSinglePlayer(playerId);
        setSelectedPlayer(null);
        setConfirmModal(null);
      })();
    };
    // İptal yolu: tahminleri tamamen sil, oyuncu kilidini aç (tahmin kalmadığı için tekrar Kaydet ile tahmin yapılabilir)
    const clearPlayerAndClose = () => {
      setPlayerPredictions(prev => {
        const next = { ...prev };
        delete next[playerId];
        delete next[String(playerId)];
        return next;
      });
      setLockedPlayerIds(prev => prev.filter(id => Number(id) !== Number(playerId)));
      (async () => {
        const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
        if (storageKey) {
          try {
            const raw = await AsyncStorage.getItem(storageKey);
            const parsed = raw ? JSON.parse(raw) : {};
            const pp = { ...(parsed.playerPredictions || {}) };
            delete pp[playerId];
            delete pp[String(playerId)];
            const nextLocked = (parsed.lockedPlayerIds && Array.isArray(parsed.lockedPlayerIds))
              ? parsed.lockedPlayerIds.filter((id: number) => Number(id) !== Number(playerId))
              : [];
            await AsyncStorage.setItem(storageKey, JSON.stringify({ ...parsed, playerPredictions: pp, lockedPlayerIds: nextLocked }));
          } catch (_) {}
        }
        setSelectedPlayer(null);
        setConfirmModal(null);
      })();
    };
    if (by === 'cancel') {
      const currentPreds = playerPredictions[playerId] ?? playerPredictions[String(playerId)] ?? {};
      if (!hasAnyRealPlayerPrediction(currentPreds)) {
        setSelectedPlayer(null);
        setConfirmModal(null);
        return;
      }
      if (isPredictionLocked) {
        showInfo(
          'Master Kilit Kapalı',
          'Oyuncu tahminlerini silmek için önce sayfa altındaki master kilidi açmanız gerekir. Master kilit açıldıktan sonra bu oyuncu kartında "Tahminler Kilitli" butonuna basıp oyuncu kilidini açın, ardından İptal Et ile silebilirsiniz.'
        );
        return;
      }
      setConfirmModal({
        title: 'Tahminler Silinecek',
        message: 'Oyuncu için yaptığınız tüm tahminler silinecek. Devam etmek istiyor musunuz?',
        buttons: [
          { text: 'Vazgeç', style: 'cancel', onPress: () => setConfirmModal(null) },
          { text: 'Tamam', onPress: clearPlayerAndClose },
        ],
      });
      return;
    }
    const initial = initialPlayerPredictionsRef.current;
    const current = JSON.stringify(playerPredictions[playerId] ?? playerPredictions[String(playerId)] ?? {});
    const hasUnsaved = initial !== current;
    if (hasUnsaved) {
      setConfirmModal({
        title: 'Tahmin Kaydedilmedi',
        message: 'Tahmininiz kaydedilmeyecek. Kaydetmek ister misiniz?',
        buttons: [
          { text: 'Vazgeç', style: 'cancel', onPress: closeAndLock },
          { text: 'Kaydet', onPress: async () => {
            await saveSinglePlayerAndLock(playerId);
            setSelectedPlayer(null);
            setConfirmModal(null);
          } },
        ],
      });
    } else {
      closeAndLock();
    }
  }, [selectedPlayer, playerPredictions, isPredictionLocked, saveSinglePlayerAndLock, lockSinglePlayer, predictionStorageKey, matchData?.id]);

  const handleLockToggle = React.useCallback(async () => {
    // ✅ Popup açıksa ve bu oyuncu kilitliyse: sadece bu oyuncunun kilidini aç
    if (selectedPlayer && isPlayerLocked(selectedPlayer.id)) {
      if (isMatchLive || isMatchFinished) {
        showInfo('🔒 Kilit Açılamaz', 'Maç başladığı veya bittiği için tahmin kilidi artık açılamaz.');
        return;
      }
      await unlockSinglePlayer(selectedPlayer.id);
      return;
    }
    if (hasViewedCommunityData) {
      setLockedWarningReason('community_viewed');
      setShowLockedWarningModal(true);
      return;
    }
    if (hasViewedRealLineup) {
      setLockedWarningReason('real_lineup_viewed');
      setShowLockedWarningModal(true);
      return;
    }
    // ✅ Maç başladıysa veya bittiyse kilit asla açılamaz
    if ((isMatchLive || isMatchFinished) && isPredictionLocked) {
      showInfo('🔒 Kilit Açılamaz', 'Maç başladığı veya bittiği için tahmin kilidi artık açılamaz.');
      return;
    }
    const hasAnyPrediction = hasPrediction || 
      Object.values(predictions).some(v => v !== null) ||
      (playerPredictions && Object.keys(playerPredictions).length > 0);
    if (!hasAnyPrediction && !isPredictionLocked) {
      showInfo(
        '⚠️ Tahmin Yapılmadı',
        'Henüz hiçbir tahmin yapmadınız. Kilitlemek için önce tahmin yapmanız gerekir.\n\n• Maç tahminlerini yapın veya\n• Kadro oluşturun veya\n• Oyuncu tahminlerini yapın'
      );
      return;
    }
    const newLockState = !isPredictionLocked;
    setIsPredictionLocked(newLockState);
    onPredictionLockedChange?.(newLockState);
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
  }, [selectedPlayer, isPlayerLocked, unlockSinglePlayer, hasViewedCommunityData, hasViewedRealLineup, hasPrediction, predictions, playerPredictions, isPredictionLocked, predictionStorageKey, matchData?.id, isMatchLive, isMatchFinished, onPredictionLockedChange]);
  
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
    // ✅ Master kilit: Tahminler kaydedilip kilitlendiyse maç tahmininde değişiklik yok
    if (isPredictionLocked) {
      setLockedWarningReason('match_started');
      setShowLockedWarningModal(true);
      return;
    }
    // ✅ TOPLULUK VERİLERİ GÖRÜLDÜYse TÜM TAHMİNLER KALİCİ KİLİTLİ
    if (hasViewedCommunityData) {
      setLockedWarningReason('unlock_at_bottom');
      setShowLockedWarningModal(true);
      return;
    }
    // ✅ Maç başladıysa veya bittiyse - tüm tahminler kilitli
    if (isMatchLive || isMatchFinished) {
      setLockedWarningReason('match_started');
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
        description: sectionData.generalDescription + '\n\n📊 Bağımsız tahmin modundasınız. Topluluk verilerini görmek için Topluluk sekmesini veya sayfa altındaki butonu kullanın.\n\n⚠️ DİKKAT: Topluluk verilerini görürseniz tahminleriniz kalıcı olarak kilitlenir!',
        stats: [],
      });
      return;
    }
    
    setSectionInfoPopup({
      title: sectionData.title,
      description: sectionData.generalDescription + '\n\n📝 Topluluk tahminlerini görmek için önce kendi tahminlerinizi kaydedin.',
      stats: [],
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
      setLockedWarningReason('unlock_at_bottom');
      setShowLockedWarningModal(true);
      return;
    }
    
    // Maç başladıysa/bittiyse tahmin değiştirilemez
    if (isMatchLive || isMatchFinished) {
      setLockedWarningReason('match_started');
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

  // View-based display values: 0=user predictions, 1=community top, 2=actual results
  const isCardReadOnly = predictionViewIndex === 1 || predictionViewIndex === 2 || isViewOnlyMode || isPredictionLocked;
  
  const displayValues = useMemo(() => {
    if (predictionViewIndex === 1) {
      // Topluluk verileri gizliyken kartlarda hiç veri gösterme
      if (!communityDataVisible) {
        return {
          firstHalfHomeScore: null as number | null,
          firstHalfAwayScore: null as number | null,
          secondHalfHomeScore: null as number | null,
          secondHalfAwayScore: null as number | null,
          firstHalfInjuryTime: null as string | null,
          secondHalfInjuryTime: null as string | null,
          totalGoals: null as string | null,
          firstGoalTime: null as string | null,
          yellowCards: null as string | null,
          redCards: null as string | null,
          possession: null as string | null,
          totalShots: null as string | null,
          shotsOnTarget: null as string | null,
          totalCorners: null as string | null,
          tempo: null as string | null,
          scenario: null as string | null,
        };
      }
      // Topluluk: en çok tahmin edilen değerler (% olarak)
      const cp = communityMatchPredictions;
      return {
        firstHalfHomeScore: cp.firstHalf.mostPopularScore.home,
        firstHalfAwayScore: cp.firstHalf.mostPopularScore.away,
        secondHalfHomeScore: cp.fullTime.mostPopularScore.home,
        secondHalfAwayScore: cp.fullTime.mostPopularScore.away,
        firstHalfInjuryTime: null as string | null,
        secondHalfInjuryTime: null as string | null,
        totalGoals: (() => {
          const tg = communityTopPredictions.totalGoals;
          if (!tg) return null;
          if (tg === '0-1' || tg === '0-2') return '0-1 gol';
          if (tg === '2-3' || tg === '3-4') return '2-3 gol';
          if (tg === '4-5') return '4-5 gol';
          return '6+ gol';
        })(),
        firstGoalTime: communityTopPredictions.firstGoalTime,
        yellowCards: communityTopPredictions.yellowCards,
        redCards: communityTopPredictions.redCards,
        possession: String(cp.possession.avgHomePossession),
        totalShots: communityTopPredictions.totalShots,
        shotsOnTarget: communityTopPredictions.shotsOnTarget,
        totalCorners: communityTopPredictions.totalCorners,
        tempo: communityTopPredictions.tempo,
        scenario: communityTopPredictions.scenario,
      };
    }
    if (predictionViewIndex === 2) {
      // Gerçek sonuçlar (event + canlı maç istatistikleri)
      const ar = actualResults;
      const live = liveStatsFromApi;
      const totalGoalsVal = ar.totalGoals;
      let totalGoalsRange: string | null = null;
      if (totalGoalsVal != null) {
        if (totalGoalsVal <= 1) totalGoalsRange = '0-1 gol';
        else if (totalGoalsVal <= 3) totalGoalsRange = '2-3 gol';
        else if (totalGoalsVal <= 5) totalGoalsRange = '4-5 gol';
        else totalGoalsRange = '6+ gol';
      }
      const fgm = ar.firstGoalMinute;
      let firstGoalTimeRange: string | null = null;
      if (fgm != null) {
        if (fgm <= 15) firstGoalTimeRange = '1-15';
        else if (fgm <= 30) firstGoalTimeRange = '16-30';
        else if (fgm <= 45) firstGoalTimeRange = '31-45';
        else if (fgm <= 50) firstGoalTimeRange = '45+';
        else if (fgm <= 60) firstGoalTimeRange = '46-60';
        else if (fgm <= 75) firstGoalTimeRange = '61-75';
        else if (fgm <= 90) firstGoalTimeRange = '76-90';
        else firstGoalTimeRange = '90+';
      }
      const yc = ar.totalYellowCards;
      let yellowRange: string | null = null;
      if (yc != null) {
        if (yc <= 2) yellowRange = '1-2';
        else if (yc <= 4) yellowRange = '3-4';
        else if (yc <= 6) yellowRange = '5-6';
        else yellowRange = '7+';
      }
      const rc = ar.totalRedCards;
      let redRange: string | null = null;
      if (rc != null) {
        if (rc === 1) redRange = '1';
        else if (rc === 2) redRange = '2';
        else if (rc === 3) redRange = '3';
        else if (rc >= 4) redRange = '4+';
        else redRange = null; // 0 kırmızı → tahmin aralığı yok (skorda 0 sayılır)
      }
      // İlk yarı uzatma: liveEvents'tan dakika<=45 olan eventlerdeki max extra; yoksa mevcut yarı 45'teyse matchData.extraTime
      const firstHalfExtraFromEvents = (liveEvents || []).reduce((max: number, e: any) => {
        const min = e.time?.elapsed ?? e.minute ?? 0;
        if (min > 45) return max;
        const ex = e.time?.extra ?? e.extraTime ?? 0;
        return Math.max(max, typeof ex === 'number' ? ex : 0);
      }, 0);
      const firstHalfET: string | null =
        firstHalfExtraFromEvents > 0
          ? `+${firstHalfExtraFromEvents}`
          : (matchData?.minute != null && matchData.minute <= 45 && matchData?.extraTime != null)
            ? `+${matchData.extraTime}`
            : null;
      // İkinci yarı uzatma: 90+ eventlerdeki max extra; veya maç 90+ dakikadaysa matchData.extraTime
      const secondHalfExtraFromEvents = (liveEvents || []).reduce((max: number, e: any) => {
        const min = e.time?.elapsed ?? e.minute ?? 0;
        if (min < 90) return max;
        const ex = e.time?.extra ?? e.extraTime ?? 0;
        return Math.max(max, typeof ex === 'number' ? ex : 0);
      }, 0);
      const currentExtra = matchData?.extraTime ?? null;
      const secondHalfET: string | null =
        secondHalfExtraFromEvents > 0
          ? `+${secondHalfExtraFromEvents}`
          : (matchData?.minute != null && matchData.minute > 45 && currentExtra != null)
            ? `+${currentExtra}`
            : null;
      const possessionStr = live.possessionHome != null ? String(live.possessionHome) : null;
      const totalShotsRange = live.totalShots != null
        ? (live.totalShots <= 10 ? '0-10' : live.totalShots <= 20 ? '11-20' : live.totalShots <= 30 ? '21-30' : '31+')
        : null;
      const shotsOnTargetRange = live.shotsOnTarget != null
        ? (live.shotsOnTarget <= 5 ? '0-5' : live.shotsOnTarget <= 10 ? '6-10' : live.shotsOnTarget <= 15 ? '11-15' : '16+')
        : null;
      const totalCornersRange = live.totalCorners != null
        ? (live.totalCorners <= 6 ? '0-6' : live.totalCorners <= 10 ? '7-10' : live.totalCorners <= 14 ? '11-14' : '15+')
        : null;
      return {
        firstHalfHomeScore: ar.firstHalfHomeScore,
        firstHalfAwayScore: ar.firstHalfAwayScore,
        secondHalfHomeScore: ar.fullTimeHomeScore,
        secondHalfAwayScore: ar.fullTimeAwayScore,
        firstHalfInjuryTime: firstHalfET,
        secondHalfInjuryTime: secondHalfET,
        totalGoals: totalGoalsRange,
        firstGoalTime: firstGoalTimeRange,
        yellowCards: yellowRange,
        redCards: redRange,
        possession: possessionStr,
        totalShots: totalShotsRange,
        shotsOnTarget: shotsOnTargetRange,
        totalCorners: totalCornersRange,
        tempo: null as string | null,
        scenario: null as string | null,
      };
    }
    // View 0: user predictions
    return predictions;
  }, [predictionViewIndex, predictions, communityMatchPredictions, communityTopPredictions, actualResults, liveStatsFromApi, matchData, liveEvents, communityDataVisible]);

  // Effective total goals for the current view
  const displayTotalGoals = useMemo(() => {
    if (predictionViewIndex === 0) return effectiveTotalGoals;
    return displayValues.totalGoals;
  }, [predictionViewIndex, effectiveTotalGoals, displayValues.totalGoals]);

  return (
    <View style={styles.container}>
      {/* ✅ Sadece Gerçek sekmesinde (3. sayfa) altta içerik yok ve scroll kapalı; Benim Tahminim ve Topluluk’ta İlk Yarı/Maç Sonucu vb. görünsün */}
      <Modal visible={!!(showCommunityAvgTooltip && communityTeamPerformanceAvg != null)} transparent animationType="fade" onRequestClose={() => setShowCommunityAvgTooltip(false)} statusBarTranslucent>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }} activeOpacity={1} onPress={() => setShowCommunityAvgTooltip(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ maxWidth: 320, width: '100%' }}>
            <View style={{ backgroundColor: 'rgba(15, 23, 42, 0.98)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 16 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 20, textAlign: 'center', marginBottom: 8 }}>Bu çizgi, canlı maç sırasında kullanıcıların takım performansına verdiği oyların ortalamasını gösterir.</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18, textAlign: 'center' }}>Takım performansı maç boyunca güncellenebilir; topluluk ortalaması da kullanıcıların anlık değerlendirmesini yansıtır. Bara veya oyuncu kartlarına tıklayarak bilgi alabilirsiniz.</Text>
              <TouchableOpacity onPress={() => setShowCommunityAvgTooltip(false)} style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 8 }}><Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>Tamam</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <ScrollView
        ref={mainScrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentOuter}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!threeFieldData || predictionViewIndex !== 2}
      >
      {threeFieldData && (
        <View style={[styles.multiFieldFixedSection, { position: 'relative', paddingBottom: 36 }]}>
          <View style={[styles.multiFieldContainer, { minHeight: fieldHeight + 45 }]}>
            <ScrollView
              ref={threeFieldScrollRef}
              horizontal
              pagingEnabled
              bounces={false}
              overScrollMode="never"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 0 }}
              style={{ width: '100%', maxWidth: '100%', borderBottomWidth: 0 }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - scrollViewWidth) > 0.5) setScrollViewWidth(w);
              }}
              decelerationRate="fast"
              snapToInterval={scrollViewWidth > 0 ? scrollViewWidth : undefined}
              snapToAlignment="start"
              snapToOffsets={scrollViewWidth > 0 ? [0, scrollViewWidth, scrollViewWidth * 2] : undefined}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const w = scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth;
                const newIndex = w > 0 ? Math.round(offsetX / w) : 0;
                const clamped = Math.max(0, Math.min(newIndex, 2));
                if (clamped !== threeFieldActiveIndex) {
                  setThreeFieldActiveIndex(clamped);
                  setPredictionViewIndex(clamped);
                }
              }}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const w = scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth;
                const page = w > 0 ? Math.max(0, Math.min(2, Math.round(offsetX / w))) : 0;
                if (w > 0) snapToPage(page * w, page);
              }}
              onScrollEndDrag={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const w = scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth;
                const page = w > 0 ? Math.max(0, Math.min(2, Math.round(offsetX / w))) : 0;
                if (w > 0) snapToPage(page * w, page);
              }}
              scrollEventThrottle={16}
            >
              <View style={{ flexDirection: 'row', width: (scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth) * 3, alignItems: 'stretch' }}>
              {/* 1. Kullanıcı Tahmini – Kadro ile aynı padding; üç sekme aynı yükseklikte */}
              <View style={[styles.multiFieldWrapper, styles.multiFieldWrapperKadroMatch, { width: scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth, minHeight: fieldHeight + 45 }]}>
                <FootballField style={[styles.mainField, fieldDynamicStyle]}>
                  {threeFieldData.userSquad && threeFieldData.userSquad.players.length > 0 ? (
                    <View style={styles.playersContainer}>
                      {(() => {
                        const userFormation = (threeFieldData.userSquad?.formation || '4-3-3').trim();
                        const positions = formationPositions[userFormation] || formationPositions['4-3-3'] || mockPositions;
                        const slotLabels = formationLabels[userFormation] || [];
                        return threeFieldData.userSquad?.players.slice(0, 11).map((player: any, index: number) => {
                          const pos = positions[index] || { x: 50, y: 50 };
                          const positionLabel = slotLabels[index] || getPositionAbbreviation(player.position || '');
                          const playerPreds = playerPredictions[player.id] || playerPredictions[String(player.id)] || {};
                          const hasPredictions = hasAnyRealPlayerPrediction(playerPreds);
                          return (
                            <View
                              key={`user-field-${player.id}-${index}`}
                              style={[styles.playerSlot, { left: `${pos.x}%`, top: `${pos.y}%` }]}
                            >
                              <TouchableOpacity style={styles.predictionCardInfoIconRed} onPress={() => setSelectedPlayer(player)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
                                <Text style={styles.infoIconText}>i</Text>
                              </TouchableOpacity>
                              <View style={styles.playerCardWrapper}>
                                {hasPredictions && <View style={styles.predictionGlowBehind} />}
                                <TouchableOpacity
                                  style={[styles.playerCard, hasPredictions && styles.playerCardPredicted, (normalizeRatingTo100(player.rating) ?? 0) >= 85 && styles.playerCardElite, (player.position === 'GK' || (player.position && String(player.position).toUpperCase() === 'GK')) && styles.playerCardGK]}
                                  onPress={() => setSelectedPlayer(player)}
                                  activeOpacity={0.8}
                                >
                                  <LinearGradient colors={['#1E3A3A', '#0F2A24']} style={styles.playerCardGradient}>
                                    <View style={[styles.jerseyNumberBadge, (normalizeRatingTo100(player.rating) ?? 0) >= 85 && { backgroundColor: '#C9A44C' }, (player.position === 'GK' || (player.position && String(player.position).toUpperCase() === 'GK')) && { backgroundColor: '#3B82F6' }]}>
                                      <Text style={styles.jerseyNumberText}>
                                        {(player.number ?? player.jersey_number ?? (player as any).shirt_number) != null && (player.number ?? player.jersey_number ?? (player as any).shirt_number) > 0 ? (player.number ?? player.jersey_number ?? (player as any).shirt_number) : '-'}
                                      </Text>
                                    </View>
                                    <Text style={styles.playerName} numberOfLines={1}>
                                        {formatPlayerDisplayName(player)}
                                      </Text>
                                    <View style={styles.playerBottomRow}>
                                      <Text style={styles.playerRatingBottom}>{normalizeRatingTo100(player.rating) != null ? String(normalizeRatingTo100(player.rating)) : '–'}</Text>
                                      <Text style={styles.playerPositionBottom} numberOfLines={1}>{positionLabel}</Text>
                                    </View>
                                  </LinearGradient>
                                </TouchableOpacity>
                              </View>
                              {hasPredictions && (
                                <View style={styles.predictionCheckBadgeTopRight}>
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                </View>
                              )}
                            </View>
                          );
                        });
                      })()}
                    </View>
                  ) : (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, zIndex: 20 }}>
                      <View style={{ width: 280, minHeight: 368, borderRadius: 24, overflow: 'hidden', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 }}>
                        <LinearGradient colors={isLight ? ['rgba(30, 41, 59, 0.96)', 'rgba(51, 65, 85, 0.92)'] : ['rgba(18, 45, 38, 0.9)', 'rgba(28, 55, 47, 0.86)']} style={{ paddingVertical: 32, paddingHorizontal: 28, width: '100%', minHeight: 368, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(96, 165, 250, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Ionicons name="person-outline" size={24} color="#60A5FA" />
                          </View>
                          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.4 }}>
                            Kadro Tahmini Yapılmadı
                          </Text>
                          <Text style={{ color: 'rgba(241, 245, 249, 0.78)', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
                            Bu maç için kadro ve oyuncu tahmini yapılmadı
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  )}
                    <View style={styles.fieldInnerLabel}>
                      <Ionicons name="person" size={10} color="#60A5FA" />
                      <Text style={[styles.fieldInnerLabelText, { color: '#60A5FA', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }]}>Benim Tahminim</Text>
                    </View>
                  </FootballField>
                  <View style={{ height: 0 }} />
                  {/* Saha 0 altı – Benim Tahminim */}
                  <View style={[styles.fieldBelowContent, { height: 45, justifyContent: 'flex-end' }]}>
                    {!(threeFieldData.userSquad && threeFieldData.userSquad.players.length > 0) ? (
                      <View style={[styles.infoNote, { marginTop: 0, overflow: 'hidden', position: 'relative', paddingLeft: 10 }]}>
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#60A5FA' }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
                          <Text style={[styles.fieldBelowNoteText, { color: '#FFFFFF', flex: 1 }]} numberOfLines={1}>Kadro sekmesinden formasyon seçin, sonra burada tahmin yapın.</Text>
                        </View>
                      </View>
                    ) : !hasPrediction && (isMatchLive || isMatchFinished) ? (
                      <View style={[styles.infoNote, { backgroundColor: 'rgba(96, 165, 250, 0.2)', borderColor: 'rgba(96, 165, 250, 0.5)', overflow: 'hidden', position: 'relative', paddingLeft: 10 }]}>
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#60A5FA' }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <Ionicons name="eye-outline" size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
                          <Text style={[styles.fieldBelowNoteText, { color: '#FFFFFF', flex: 1 }]} numberOfLines={1}>Kadro yok. Topluluk için oyuncu kartına tıklayın.</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.infoNote, { marginTop: 0, overflow: 'hidden', position: 'relative', paddingLeft: 10 }]}>
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#60A5FA' }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
                          <Text style={[styles.fieldBelowNoteText, { color: '#FFFFFF', flex: 1 }]} numberOfLines={1}>Oyuncu kartına tıklayıp tahmin girin ve aşağı kaydırın.</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              
              {/* 2. Topluluk Kadrosu – üç sekme aynı yükseklikte */}
              <View style={[styles.multiFieldWrapper, { width: scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth, minHeight: fieldHeight + 45 }]}>
                <FootballField style={[styles.mainField, fieldDynamicStyle]}>
                  <View style={[
                    styles.playersContainer,
                  ]}>
                    {communityDataVisible && threeFieldData.communitySquad.players.length >= 11 && (() => {
                      const commFormation = threeFieldData.communitySquad.formation || '4-3-3';
                      const positions = formationPositions[commFormation] || formationPositions['4-3-3'] || mockPositions;
                      return threeFieldData.communitySquad.players.slice(0, 11).map((player: any, index: number) => {
                        const pos = positions[index] || { x: 50, y: 50 };
                        const community = communityPredictions[player.id] || (matchIdNum && isMockTestMatch(matchIdNum) ? getMockCommunityDataForPlayer(player) : EMPTY_COMMUNITY_DATA);
                        const goalPct = Math.round(community.goal * 100);
                        const assistPct = Math.round(community.assist * 100);
                        return (
                          <View
                            key={`community-field-${player.id}-${index}`}
                            style={[styles.playerSlot, { left: `${pos.x}%`, top: `${pos.y}%` }]}
                          >
                            <TouchableOpacity 
                              style={[styles.playerCard, player.rating >= 85 && styles.playerCardElite]}
                              onPress={() => {
                                if (!communityDataVisible) return;
                                const data = communityPredictions[player.id] || (matchIdNum && isMockTestMatch(matchIdNum) ? getMockCommunityDataForPlayer(player) : EMPTY_COMMUNITY_DATA);
                                setPlayerInfoPopup({
                                  playerName: formatPlayerDisplayName(player),
                                  position: player.position || '',
                                  rating: player.rating ?? null,
                                  userPredictions: [],
                                  communityData: {
                                    totalUsers: data.totalPredictions,
                                    goal: data.goal,
                                    assist: data.assist,
                                    yellowCard: data.yellowCard,
                                    redCard: data.redCard,
                                    penalty: data.penalty,
                                    substitutedOut: data.substitutedOut,
                                    injuredOut: data.injuredOut,
                                  },
                                  showCommunityData: true,
                                });
                              }}
                              activeOpacity={communityDataVisible ? 0.7 : 1}
                            >
                              <LinearGradient colors={['#1E3A3A', '#0F2A24']} style={styles.playerCardGradient}>
                                <View style={[styles.jerseyNumberBadge, (normalizeRatingTo100(player.rating) ?? 0) >= 85 && { backgroundColor: '#C9A44C' }]}>
                                  <Text style={styles.jerseyNumberText}>{(player.number ?? player.jersey_number ?? (player as any).shirt_number) != null && (player.number ?? player.jersey_number ?? (player as any).shirt_number) > 0 ? (player.number ?? player.jersey_number ?? (player as any).shirt_number) : '-'}</Text>
                                </View>
                                <Text style={styles.playerName} numberOfLines={1}>
                                  {formatPlayerDisplayName(player)}
                                </Text>
                                <View style={styles.playerBottomRow}>
                                  <Text style={styles.playerRatingBottom}>{normalizeRatingTo100(player.rating) != null ? String(normalizeRatingTo100(player.rating)) : '–'}</Text>
                                  <Text style={styles.playerPositionBottom} numberOfLines={1}>{getPositionAbbreviation(player.position || '')}</Text>
                                </View>
                                {/* Topluluk: tek satırda Gol/Asist + belirteç, üst üste binme yok */}
                                <View style={{ marginTop: 2, paddingTop: 3, borderTopWidth: 1, borderTopColor: 'rgba(31, 162, 166, 0.3)', alignItems: 'center', justifyContent: 'center' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', gap: 4 }}>
                                    <Text style={{ fontSize: 8, color: '#10B981' }}>⚽%{goalPct}</Text>
                                    <Text style={{ fontSize: 8, color: '#3B82F6' }}>🅰️%{assistPct}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(31, 162, 166, 0.5)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                                      <Ionicons name="people" size={8} color="#FFF" />
                                      <Text style={{ fontSize: 7, fontWeight: '600', color: '#FFF', marginLeft: 2 }}>Topl.</Text>
                                    </View>
                                  </View>
                                </View>
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        );
                      });
                    })()}
                  </View>
                  {/* Resim 1 bildirimi kaldırıldı: "Topluluk verileri oluştu" kartı yok; onay için resim 2 (Emin misiniz?) kullanılıyor */}
                  {!hasPrediction && !communityDataVisible && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, zIndex: 15 }}>
                      <View style={{ width: 280, minHeight: 368, borderRadius: 24, overflow: 'hidden', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 }}>
                        <LinearGradient colors={isLight ? ['rgba(30, 41, 59, 0.96)', 'rgba(51, 65, 85, 0.92)'] : ['rgba(18, 45, 38, 0.9)', 'rgba(28, 55, 47, 0.86)']} style={{ paddingVertical: 32, paddingHorizontal: 28, width: '100%', minHeight: 368, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Ionicons name="lock-closed" size={24} color="#F59E0B" />
                          </View>
                          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.4 }}>
                            Topluluk Tahminleri Gizli
                          </Text>
                          <Text style={{ color: 'rgba(241, 245, 249, 0.78)', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
                            Önce tahminlerinizi yapın ve kaydedin
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  )}
                  {/* Şerit bildirimi kaldırıldı: topluluk verisi yokken saha içinde ayrı mesaj gösterilmiyor */}
                  <View style={styles.fieldInnerLabel}>
                    <Ionicons name="people" size={10} color="#F59E0B" />
                    <Text style={[styles.fieldInnerLabelText, { color: '#F59E0B' }]}>Topluluk</Text>
                  </View>
                </FootballField>
                <View style={{ height: 0 }} />
                {/* Saha 1 altı – Topluluk */}
                {hasViewedCommunityData ? (
                <View style={[styles.fieldBelowContent, { height: 45, justifyContent: 'flex-end' }]}>
                  <View style={[styles.fieldBelowSection, { overflow: 'hidden', position: 'relative', paddingLeft: 13 }]}>
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#F59E0B' }} />
                    {!communityDataVisible ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 6, width: '100%', minWidth: 0 }}>
                        <Ionicons name="lock-closed" size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
                        <Text style={[styles.fieldBelowNoteText, { color: '#F59E0B', flex: 1, minWidth: 0 }]} numberOfLines={1}>Maç başlayınca açılır</Text>
                      </View>
                    ) : (
                      <View style={styles.communityStatsRowHorizontal}>
                        <View style={styles.communityStatsChip}>
                          <Ionicons name="people" size={14} color="#1FA2A6" />
                          <Text style={styles.communityStatsChipValue} numberOfLines={1}>
                            {communityMatchPredictions.totalUsers.toLocaleString()}
                          </Text>
                          <Text style={styles.communityStatsChipLabel} numberOfLines={1}>kullanıcı</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.communityStatsChip}
                          onPress={() => handleSectionInfoPress({
                            title: 'Atak Formasyonu – Topluluk',
                            generalDescription: 'Topluluğun en çok tercih ettiği atak formasyonları.',
                            communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının tercihleri:`,
                            communityStats: communityMatchPredictions.attackFormations?.map((f: { name: string; percentage: number }) => ({ label: f.name, value: `%${f.percentage}`, percentage: f.percentage })) ?? [
                              { label: '4-3-3', value: '%42', percentage: 42 },
                              { label: '4-4-2', value: '%28', percentage: 28 },
                              { label: '3-5-2', value: '%18', percentage: 18 },
                              { label: 'Diğer', value: '%12', percentage: 12 },
                            ],
                          })}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="flash" size={12} color="#F59E0B" />
                          <Text style={styles.communityStatsChipValue} numberOfLines={1}>
                            {communityMatchPredictions.attackFormations?.[0]?.name ?? '4-3-3'} %{communityMatchPredictions.attackFormations?.[0]?.percentage ?? 42}
                          </Text>
                          <Text style={styles.communityStatsChipLabel} numberOfLines={1}>Atak</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.communityStatsChip}
                          onPress={() => handleSectionInfoPress({
                            title: 'Defans Formasyonu – Topluluk',
                            generalDescription: 'Topluluğun en çok tercih ettiği defans formasyonları.',
                            communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının tercihleri:`,
                            communityStats: communityMatchPredictions.defenseFormations?.map((f: { name: string; percentage: number }) => ({ label: f.name, value: `%${f.percentage}`, percentage: f.percentage })) ?? [
                              { label: '4-4-2', value: '%28', percentage: 28 },
                              { label: '4-3-3', value: '%24', percentage: 24 },
                              { label: '3-5-2', value: '%22', percentage: 22 },
                              { label: 'Diğer', value: '%26', percentage: 26 },
                            ],
                          })}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="shield" size={12} color="#3B82F6" />
                          <Text style={styles.communityStatsChipValue} numberOfLines={1}>
                            {communityMatchPredictions.defenseFormations?.[0]?.name ?? '4-4-2'} %{communityMatchPredictions.defenseFormations?.[0]?.percentage ?? 28}
                          </Text>
                          <Text style={styles.communityStatsChipLabel} numberOfLines={1}>Defans</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                ) : (
                <View style={[styles.fieldBelowContent, { height: 45, justifyContent: 'flex-end' }]}>
                  <View style={[styles.fieldBelowSection, { overflow: 'hidden', position: 'relative', paddingLeft: 13 }]}>
                    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#F59E0B' }} />
                    <View style={{ minHeight: 28 }} />
                  </View>
                </View>
                )}
              </View>
              
              {/* 3. Gerçek Kadro (API) – üç sekme aynı yükseklikte */}
              <View style={[styles.multiFieldWrapper, { width: scrollViewWidth > 0 ? scrollViewWidth : effectivePageWidth, minHeight: fieldHeight + 45 }]}>
                <FootballField style={[styles.mainField, fieldDynamicStyle]}>
                  {(!hasRealLineupData || threeFieldData.actualSquad.players.length === 0) ? (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, zIndex: 20 }}>
                      <View style={{ width: 280, minHeight: 368, borderRadius: 24, overflow: 'hidden', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 }}>
                        <LinearGradient colors={isLight ? ['rgba(30, 41, 59, 0.96)', 'rgba(51, 65, 85, 0.92)'] : ['rgba(18, 45, 38, 0.9)', 'rgba(28, 55, 47, 0.86)']} style={{ paddingVertical: 32, paddingHorizontal: 28, width: '100%', minHeight: 368, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(148, 163, 184, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Ionicons name={threeFieldData.hasLineupButNoFormation ? 'help-circle-outline' : 'time-outline'} size={26} color="#94A3B8" />
                          </View>
                          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6, letterSpacing: 0.4 }}>
                            {threeFieldData.hasLineupButNoFormation ? 'Kadro ve formasyon bilgisi henüz netleşmedi' : 'Gerçek kadrolar henüz açıklanmadı'}
                          </Text>
                          <Text style={{ color: 'rgba(241, 245, 249, 0.78)', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
                            {threeFieldData.hasLineupButNoFormation
                              ? 'İlk 11 bilgisi gelmiş ancak formasyon/pozisyon bilgisi API\'den henüz gelmedi. Netleşince burada gösterilecek.'
                              : 'Bu maçın gerçek kadroları henüz açıklanmadı. Kadrolar açıklanınca burada gösterilecek.'}
                          </Text>
                        </LinearGradient>
                      </View>
                    </View>
                  ) : (realLineupVisible || isMatchLive || isMatchFinished) ? (
                    <View style={styles.playersContainer}>
                      {(() => {
                        // Gerçek kadro: API'den gelen formasyon ile formationPositions tablosundan yerleşim al
                        // Oyuncular zaten grid'e göre sıralı (sortByGrid); index sırası formationPositions slot sırasıyla eşleşir
                        const actualFormation = threeFieldData.actualSquad.formation || '4-3-3';
                        const knownPositions = formationPositions[actualFormation];
                        
                        // API formasyonu tabloda yoksa → formasyon string'inden dinamik kademeli yerleşim üret
                        let positions: Array<{ x: number; y: number }>;
                        if (knownPositions) {
                          positions = knownPositions;
                        } else {
                          const parts = actualFormation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
                          if (parts.length >= 2) {
                            const rows = [1, ...parts]; // GK (1) + formasyon satırları
                            const yValues = rows.map((_, ri) => 88 - (ri / (rows.length - 1)) * 78);
                            const generated: Array<{ x: number; y: number }> = [];
                            rows.forEach((count, ri) => {
                              const y = yValues[ri];
                              for (let ci = 0; ci < count; ci++) {
                                const x = count === 1 ? 50 : 12 + (ci / (count - 1)) * 76;
                                // Hafif kademeli ofset: kenar oyuncuları 2-3% yukarı (düz çizgi olmasın)
                                const edgeOffset = count > 2 ? (ci === 0 || ci === count - 1 ? -2 : ci === Math.floor(count / 2) ? 2 : 0) : 0;
                                generated.push({ x, y: y + edgeOffset });
                              }
                            });
                            positions = generated.length === 11 ? generated : (formationPositions['4-3-3'] || mockPositions);
                          } else {
                            positions = formationPositions['4-3-3'] || mockPositions;
                          }
                        }
                        const LIVE_REACTION_ICONS = [
                          { key: 'good', icon: '🔥', isCard: false },
                          { key: 'bad', icon: '👎', isCard: false },
                          { key: 'goal', icon: '⚽', isCard: false },
                          { key: 'yellowcard', icon: 'card', isCard: true, color: '#FBBF24' },
                          { key: 'redcard', icon: 'card', isCard: true, color: '#DC2626' },
                          { key: 'sub', icon: '🔄', isCard: false },
                        ];
                        return threeFieldData.actualSquad.players.slice(0, 11).map((player: any, index: number) => {
                          const pos = positions[index] || { x: 50, y: 50 };
                          const community = communityPredictions[player.id];
                          const totalVotes = community ? Math.max(1, community.totalPredictions) : 0;
                          const reactionPcts = community ? [
                            Math.round((community.goal + community.assist) / totalVotes * 50),
                            Math.round(community.substitutedOut / totalVotes * 100),
                            Math.round(community.goal / totalVotes * 100),
                            Math.round(community.yellowCard / totalVotes * 100),
                            Math.round(community.redCard / totalVotes * 100),
                            Math.round(community.substitutedOut / totalVotes * 100),
                          ] : [0, 0, 0, 0, 0, 0];
                          const showIcon = (i: number) => reactionPcts[i] > 10;
                          const hasAnyIcons = reactionPcts.some((p) => p > 10);
                          const playerReaction = normalizeLiveReaction(liveReactions[player.id]);
                          const userVoted = hasAnyReaction(playerReaction);
                          const ICON_SIZE = 18; const CARD_ICON_W = 10; const CARD_ICON_H = 14; // %25 büyük (14->18, 8x10->10x14)
                          const BADGE_SIZE = 25;
                          const BADGE_INSET = 0;
                          const BADGE_TOP_INSET = 3; // Üst rozetler: ortaya doğru 2-3px
                          const BADGE_TOP = -13;   // Üst rozet: kartın üstüne taşar
                          // Alt 3 rozet: sarı/kırmızı 2px yukarı, maçın adamı 3px daha yukarı ve %10 büyük
                          const BADGE_BOTTOM = -21;      // Sarı ve kırmızı kart
                          const BADGE_BOTTOM_MOTM = -16; // Maçın adamı — 3px daha yukarı
                          const BADGE_SIZE_MOTM = 28;    // Maçın adamı rozeti %10 büyük (25→28)
                          const BADGE_BOTTOM_INSET = 0;  // Sarı sol kenar, kırmızı sağ kenar
                          return (
                            <View
                              key={`actual-field-${player.id}-${index}`}
                              style={[styles.playerSlot, { left: `${pos.x}%`, top: `${pos.y}%` }]}
                            >
                              {player.isSubstitute && (
                                <View style={{ position: 'absolute', top: -6, right: -6, zIndex: 30, backgroundColor: '#10B981', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="arrow-up" size={10} color="#fff" />
                                </View>
                              )}
                              {/* Üst sol: Çok İyi/Kötü — üst sağ: Gol Atar/Çıkmalı (ortaya 3px) */}
                              {hasAnyIcons && (
                                <>
                                  <View style={{ position: 'absolute', top: BADGE_TOP, left: BADGE_TOP_INSET, flexDirection: 'row', gap: 2, alignItems: 'center', zIndex: 11 }}>
                                    {LIVE_REACTION_ICONS.slice(0, 2).map((r, i) => (
                                      showIcon(i) ? (
                                        <View key={r.key} style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, zIndex: 11, borderColor: r.key === 'good' ? '#10B981' : '#EF4444' }]}>
                                          {r.isCard ? <View style={{ width: CARD_ICON_W-2, height: CARD_ICON_H-2, borderRadius: 2, backgroundColor: r.color }} /> : <Text style={{ fontSize: 13 }}>{r.icon}</Text>}
                                        </View>
                                      ) : null
                                    ))}
                                  </View>
                                  <View style={{ position: 'absolute', top: BADGE_TOP, right: BADGE_TOP_INSET, flexDirection: 'row', gap: 2, alignItems: 'center', zIndex: 11 }}>
                                    {[LIVE_REACTION_ICONS[2], LIVE_REACTION_ICONS[5]].map((r, i) => (
                                      showIcon(i === 0 ? 2 : 5) ? (
                                        <View key={r.key} style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, zIndex: 11, borderColor: r.key === 'goal' ? '#3B82F6' : '#8B5CF6' }]}>
                                          {r.isCard ? <View style={{ width: CARD_ICON_W-2, height: CARD_ICON_H-2, borderRadius: 2, backgroundColor: r.color }} /> : <Text style={{ fontSize: 13 }}>{r.icon}</Text>}
                                        </View>
                                      ) : null
                                    ))}
                                  </View>
                                  {/* Alt 3 alan: sol = Sarı Kart, orta = Maçın adamı, sağ = Kırmızı Kart — aynı hizada, simetrik */}
                                  {showIcon(3) && (
                                    <View style={{ position: 'absolute', bottom: BADGE_BOTTOM, left: BADGE_BOTTOM_INSET, width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 11 }}>
                                      <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, zIndex: 11, borderColor: '#FBBF24', position: 'relative', top: 0, left: 0 }]}>
                                        <View style={{ width: CARD_ICON_W, height: CARD_ICON_H, borderRadius: 2, backgroundColor: '#FBBF24' }} />
                                      </View>
                                    </View>
                                  )}
                                  <View style={{ position: 'absolute', bottom: BADGE_BOTTOM_MOTM, left: '50%', marginLeft: -BADGE_SIZE_MOTM/2, width: BADGE_SIZE_MOTM, height: BADGE_SIZE_MOTM, alignItems: 'center', justifyContent: 'center', zIndex: 11 }} />
                                  {showIcon(4) && (
                                    <View style={{ position: 'absolute', bottom: BADGE_BOTTOM, right: BADGE_BOTTOM_INSET, width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 11 }}>
                                      <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, zIndex: 11, borderColor: '#DC2626', position: 'relative', top: 0, left: 0 }]}>
                                        <View style={{ width: CARD_ICON_W, height: CARD_ICON_H, borderRadius: 2, backgroundColor: '#DC2626' }} />
                                      </View>
                                    </View>
                                  )}
                                </>
                              )}
                              {/* Kullanıcı seçimleri: üst rozetler ortaya 3px */}
                              {playerReaction.row1 && (
                                <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, zIndex: 12, top: BADGE_TOP, left: BADGE_TOP_INSET, borderColor: playerReaction.row1 === 'good' ? '#10B981' : '#EF4444' }]}>
                                  {playerReaction.row1 === 'good' ? <Text style={{ fontSize: 13 }}>🔥</Text> : <Text style={{ fontSize: 13 }}>👎</Text>}
                                </View>
                              )}
                              {playerReaction.row2 && (
                                <View style={{ position: 'absolute', top: BADGE_TOP, right: BADGE_TOP_INSET, width: BADGE_SIZE, height: BADGE_SIZE, zIndex: 12, alignItems: 'center', justifyContent: 'center' }}>
                                  <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, borderColor: playerReaction.row2 === 'goal' ? '#3B82F6' : '#8B5CF6', position: 'relative', top: 0, left: 0 }]}>
                                    {playerReaction.row2 === 'goal' ? <Text style={{ fontSize: 13 }}>⚽</Text> : <Text style={{ fontSize: 12 }}>🔄</Text>}
                                  </View>
                                </View>
                              )}
                              {/* Alt 3 rozet: sarı sol, maçın adamı orta, kırmızı sağ — aynı hizada, simetrik */}
                              {playerReaction.row3 === 'yellowcard' && (
                                <View style={{ position: 'absolute', bottom: BADGE_BOTTOM, left: BADGE_BOTTOM_INSET, width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 12 }}>
                                  <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, borderColor: '#FBBF24', position: 'relative', top: 0, left: 0 }]}>
                                    <View style={{ width: CARD_ICON_W, height: CARD_ICON_H, borderRadius: 2, backgroundColor: '#FBBF24' }} />
                                  </View>
                                </View>
                              )}
                              {playerReaction.row4 === 'motm' && (
                                <Animated.View style={{ position: 'absolute', bottom: BADGE_BOTTOM_MOTM, left: '50%', marginLeft: -BADGE_SIZE_MOTM/2, width: BADGE_SIZE_MOTM, height: BADGE_SIZE_MOTM, alignItems: 'center', justifyContent: 'center', zIndex: 14, transform: [{ scale: motmScaleAnim }] }}>
                                  <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE_MOTM, height: BADGE_SIZE_MOTM, borderRadius: BADGE_SIZE_MOTM/2, borderColor: '#EAB308', position: 'relative', top: 0, left: 0 }]}>
                                    <Ionicons name="star" size={15} color="#EAB308" />
                                  </View>
                                </Animated.View>
                              )}
                              {playerReaction.row3 === 'redcard' && (
                                <View style={{ position: 'absolute', bottom: BADGE_BOTTOM, right: BADGE_BOTTOM_INSET, width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 12 }}>
                                  <View style={[styles.liveReactionBadgeOuter, { width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE/2, borderColor: '#DC2626', position: 'relative', top: 0, left: 0 }]}>
                                    <View style={{ width: CARD_ICON_W, height: CARD_ICON_H, borderRadius: 2, backgroundColor: '#DC2626' }} />
                                  </View>
                                </View>
                              )}
                              <View style={{ position: 'relative' }}>
                                {userVoted && (
                                  <View style={[styles.predictionGlowBehind, { backgroundColor: 'rgba(234, 179, 8, 0.4)', zIndex: 0 }]} />
                                )}
                                <TouchableOpacity 
                                  style={[
                                  styles.playerCard,
                                  (normalizeRatingTo100(player.rating) ?? 0) >= 85 && styles.playerCardElite,
                                  player.isSubstitute && { borderColor: '#10B981', borderWidth: 1.5 },
                                  getReactionBorderColor(playerReaction) && { borderColor: getReactionBorderColor(playerReaction), borderWidth: 2 },
                                  userVoted && !getReactionBorderColor(playerReaction) && { borderColor: '#EAB308', borderWidth: 2 },
                                ]}
                                onPress={() => { setLiveReactionPlayer(player); showTeamPerfBubbleIfAllowed(); }}
                                activeOpacity={0.7}
                              >
                                <LinearGradient colors={['#1E3A3A', '#0F2A24']} style={styles.playerCardGradient}>
                                  <View style={[styles.jerseyNumberBadge, (normalizeRatingTo100(player.rating) ?? 0) >= 85 && { backgroundColor: '#C9A44C' }]}>
                                    <Text style={styles.jerseyNumberText}>{(player.number ?? player.jersey_number ?? (player as any).shirt_number) != null && (player.number ?? player.jersey_number ?? (player as any).shirt_number) > 0 ? (player.number ?? player.jersey_number ?? (player as any).shirt_number) : '-'}</Text>
                                  </View>
                                  <Text style={styles.playerName} numberOfLines={1}>
                                    {formatPlayerDisplayName(player)}
                                  </Text>
                                  <View style={styles.playerBottomRow}>
                                    <Text style={styles.playerRatingBottom}>{normalizeRatingTo100(player.rating) != null ? String(normalizeRatingTo100(player.rating)) : '–'}</Text>
                                    <Text style={styles.playerPositionBottom} numberOfLines={1}>{getPositionAbbreviation(player.position || '')}</Text>
                                  </View>
                                </LinearGradient>
                              </TouchableOpacity>
                              </View>
                            </View>
                          );
                        });
                      })()}
                    </View>
                  ) : (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, zIndex: 20 }}>
                      <View style={{ width: 280, minHeight: 368, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12 }}>
                        <LinearGradient colors={isLight ? ['rgba(30, 41, 59, 0.96)', 'rgba(51, 65, 85, 0.92)'] : ['rgba(18, 45, 38, 0.9)', 'rgba(28, 55, 47, 0.86)']} style={{ paddingVertical: 24, paddingHorizontal: 22, width: '100%', minHeight: 368, alignItems: 'center', justifyContent: 'flex-start' }}>
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Ionicons name="football" size={22} color="#EF4444" />
                          </View>
                          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 2 }}>
                            Gerçek kadro hazır!
                          </Text>
                          <ScrollView style={{ maxHeight: 140 }} contentContainerStyle={{ paddingHorizontal: 4 }} showsVerticalScrollIndicator={false}>
                            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 19, marginBottom: 8 }}>
                              Maçın kadrosunu görmeden önce kadro oluşturunuz ve oyunculara ve maça ait tahminlerinizi yapınız.
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 19 }}>
                              Tahminlerinizi görmeden önce maç kadrosunu görmek isterseniz bu maç için{' '}
                              <Text style={{ color: '#EF4444', fontWeight: '600' }}>artık tahmin yapamayacaksınız.</Text>
                            </Text>
                          </ScrollView>
                          <View style={{ marginTop: 16, alignItems: 'center', width: '100%' }}>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', borderRadius: 999, paddingVertical: 11, paddingHorizontal: 24, minWidth: 160, borderWidth: 1.5, borderColor: '#EF4444' }}
                              onPress={() => setLockConfirmType('real')}
                              activeOpacity={0.88}
                            >
                              <Ionicons name="eye-outline" size={18} color="#EF4444" />
                              <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Kadroyu gör</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 16 }}
                              onPress={() => {
                                setPredictionViewIndex(0);
                                setThreeFieldActiveIndex(0);
                                threeFieldScrollRef.current?.scrollTo({ x: 0, animated: true });
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '500', color: '#94A3B8' }}>Vazgeç</Text>
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </View>
                    </View>
                  )}
                  {threeFieldData.actualSquad.players.length > 0 && (realLineupVisible || isMatchLive || isMatchFinished) && (
                    <View style={styles.fieldFormationBadge}>
                      <Text style={styles.fieldFormationText}>{threeFieldData.actualSquad.formation}</Text>
                    </View>
                  )}
                  {/* Performans barı saha altına taşındı (dikey bar kaldırıldı) */}
                  <View style={styles.fieldInnerLabel}>
                    <Ionicons name="football" size={10} color="#EF4444" />
                    <Text style={[styles.fieldInnerLabelText, { color: '#EF4444' }]}>Gerçek</Text>
                    {isMatchLive && (
                      <>
                        <View style={styles.fieldInnerLiveDot} />
                        <Text style={styles.fieldInnerLiveText}>Canlı</Text>
                      </>
                    )}
                  </View>
                </FootballField>
                <View style={{ height: 0 }} />
                {/* Gerçek sekmesi altı: Takım performansı – 45px diğer sekmelerle aynı hizada */}
                <View style={[styles.fieldBelowContent, { height: 45, justifyContent: 'flex-end', overflow: 'hidden' }]}>
                  <TouchableOpacity
                    onPress={() => setShowTeamPerfPopup(true)}
                    activeOpacity={0.78}
                    style={[styles.fieldBelowSection, styles.fieldBelowSectionTeamPerf, {
                      flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', width: '100%', minWidth: 0,
                      borderRadius: 12, overflow: 'hidden',
                      backgroundColor: '#263E3C',
                      borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)',
                      shadowColor: '#2DD4BF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
                      paddingVertical: 6, paddingRight: 8, paddingLeft: 0,
                    }, (threeFieldData.actualSquad.players.length === 0 || !realLineupVisible) && { opacity: 0.5 }, { pointerEvents: threeFieldData.actualSquad.players.length > 0 && realLineupVisible ? 'auto' : 'none' }]}
                  >
                    <View style={{ width: 5, height: '100%', backgroundColor: '#EF4444', position: 'absolute', left: 0 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, flex: 1, minWidth: 0 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(45,212,191,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
                        <Ionicons name="stats-chart" size={14} color="#5EEAD4" />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '400', color: '#E2E8F0', letterSpacing: 0.2, flex: 1 }} numberOfLines={1} ellipsizeMode="tail">Takım oyun performansı</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(45,212,191,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(45,212,191,0.5)', flexShrink: 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: '400', color: '#A78BFA', marginRight: 6 }} numberOfLines={1}>
                        {communityMatchPredictions.totalUsers > 0 ? `${communityMatchPredictions.totalUsers.toLocaleString()} kişi` : '—'}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '400', color: '#F0FDFA' }}>{communityTeamPerformanceAvg != null ? communityTeamPerformanceAvg.toFixed(1) : '—'}/10</Text>
                      <Ionicons name="chevron-forward" size={16} color="#5EEAD4" style={{ marginLeft: 6 }} />
                    </View>
                  </TouchableOpacity>
                </View>
                {/* Takım performansı popup: bilgi + 1–10 seçimi; ScrollView ile üst/alt kesilme önlenir */}
                <Modal visible={showTeamPerfPopup} transparent animationType="fade" statusBarTranslucent>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 }} activeOpacity={1} onPress={() => setShowTeamPerfPopup(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, maxHeight: '88%' }}>
                      <ScrollView style={{ maxHeight: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                        <View style={{ backgroundColor: '#0F1F1F', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)' }}>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: '#F1F5F9', textAlign: 'center', marginBottom: 10 }}>Oyun içi takım ve oyuncu performansı</Text>
                          <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 14, lineHeight: 18 }}>
                            Takımınızın maçtaki performansını 1–10 arası puanlayın. Maç boyunca istediğiniz an güncelleyebilirsiniz; topluluk ortalaması da anlık değerlendirmeyi yansıtır.
                          </Text>
                          {communityTeamPerformanceAvg != null && (
                            <Text style={{ fontSize: 12, color: '#5EEAD4', fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
                              Topluluk ort.: {Math.floor(communityTeamPerformanceAvg)} tam, 10'da {Math.round((communityTeamPerformanceAvg - Math.floor(communityTeamPerformanceAvg)) * 10)} ({communityTeamPerformanceAvg.toFixed(1)}/10)
                            </Text>
                          )}
                          <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 8 }}>Oyuncu kartlarına dokunarak şu oyları da verebilirsiniz:</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10, gap: 6 }}>
                            <View style={{ backgroundColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#34D399' }}>Çok İyi</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(239,68,68,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#F87171' }}>Kötü</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(59,130,246,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#60A5FA' }}>Gol Atar</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(139,92,246,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#A78BFA' }}>Çıkmalı</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(251,191,36,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251,191,36,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#FBBF24' }}>Sarı Kart</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(220,38,38,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(220,38,38,0.5)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#F87171' }}>Kırmızı Kart</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(234,179,8,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(234,179,8,0.6)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#EAB308' }}>Maçın adamı</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 10, color: '#64748B', textAlign: 'center', marginBottom: 18, lineHeight: 14 }}>Tüm tercihleriniz canlı maç boyunca her an değiştirilebilir.</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                              const isSelected = teamPerformance === n;
                              const isPrevious = previousTeamPerformance != null && previousTeamPerformance === n;
                              return (
                                <TouchableOpacity
                                  key={n}
                                  onPress={() => {
                                    setPreviousTeamPerformance(teamPerformance);
                                    setTeamPerformance(n);
                                    setShowTeamPerfPopup(false);
                                  }}
                                  style={{
                                    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.5)' : isPrevious ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255,255,255,0.08)',
                                    borderWidth: isSelected ? 2 : 1,
                                    borderColor: isSelected ? '#10B981' : isPrevious ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? '#10B981' : isPrevious ? '#FBBF24' : 'rgba(255,255,255,0.8)' }}>{n}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {previousTeamPerformance != null && (
                            <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 12 }}>
                              Turuncu: önceki puanınız ({previousTeamPerformance}/10)
                            </Text>
                          )}
                          <TouchableOpacity onPress={() => setShowTeamPerfPopup(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }} activeOpacity={0.8}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#94A3B8' }}>Kapat</Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              </View>
              </View>
            </ScrollView>
          </View>
          {/* ✅ 3 nokta: konteyner altında */}
          <View style={[styles.multiFieldPageIndicatorsFixed, { position: 'absolute', left: 0, right: 0, bottom: 21, zIndex: 20, pointerEvents: 'box-none' }]}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.multiFieldPageDot, threeFieldActiveIndex === i && styles.multiFieldPageDotActive]} />
            ))}
          </View>
        </View>
      )}
      {/* Gerçek sekmesinde (predictionViewIndex === 2) altta içerik gösterme; Benim Tahminim ve Topluluk’ta göster */}
      {(!threeFieldData || predictionViewIndex !== 2) && (
      <View style={styles.scrollContent}>
            {/* ✅ Üç saha görünürken altta tekrar saha YOK – tek saha fallback sadece threeFieldData varken kadro yoksa */}
            {(() => {
              if (!threeFieldData) return null;
              const showFieldBelow = threeFieldData.userSquad && threeFieldData.userSquad.players.length > 0;
              if (showFieldBelow) return null;
              // ✅ 3-saha görünümü varken altta tekrar "Kadro Oluşturulmadı" sahası gösterme (ilk sayfa zaten boş durumu gösteriyor)
              if (threeFieldData) return null;
              return (
        <View style={styles.fieldCenterContainer}>
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
              // ✅ SADECE Tamamla basıldıysa ve 11 oyuncu (11 slot dolu) varsa kartları göster
              const filledCount = attackPlayersArray.filter(Boolean).length;
              const showPlayers = isSquadCompleted && filledCount >= 11 && attackFormation;
              
              if (!showPlayers) {
                // ✅ Kadro tamamlanmadıysa boş saha göster (bilgi mesajı ile)
                // Kullanıcı yine de aşağıdaki "Maça Ait Tahminler" bölümünü kullanabilir
                return (
                  <View style={styles.squadIncompleteWarning}>
                    <Ionicons name="football-outline" size={40} color="rgba(31, 162, 166, 0.4)" />
                    <Text style={[styles.squadIncompleteTitle, { fontSize: 14, marginTop: 8 }]}>Kadro Oluşturulmadı</Text>
                    <Text style={[styles.squadIncompleteText, { fontSize: 11, opacity: 0.7 }]}>
                      Oyuncu tahminleri için Kadro sekmesinden{'\n'}kadronuzu oluşturun (isteğe bağlı)
                    </Text>
                  </View>
                );
              }
              
              // ✅ isViewOnlyMode zaten üstte tanımlandı (component seviyesinde)
              
              // Kadro sekmesi ile aynı pozisyonlar: index = slot (0..10), geçerli formasyon key
              const positions = formationPositions[attackFormation] || formationPositions['4-3-3'] || mockPositions;
              const slotLabels = formationLabels[attackFormation] || formationLabels['4-3-3'] || [];
              // ✅ 11 slot garanti: index i = slot i (sıçrama olmasın)
              const slots = Array.from({ length: 11 }, (_, i) => attackPlayersArray[i] ?? null);
              
              return positions.map((pos, index) => {
                const player = slots[index];
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
                    {/* ✅ "i" butonu: Gerçek sekmesi + canlı/bitmiş → canlı tahmin + topluluk popup; aksi halde tahmin modalı */}
                    <TouchableOpacity
                      style={styles.predictionCardInfoIconRed}
                      onPress={() => {
                        if (predictionViewIndex === 2 && (isMatchLive || isMatchFinished)) {
                          setLiveReactionPlayer(player);
                          showTeamPerfBubbleIfAllowed();
                        } else {
                          setSelectedPlayer(player);
                        }
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.infoIconText}>i</Text>
                    </TouchableOpacity>
                    {/* ✅ Tahmin yapılan oyuncu: kartın arkasında parlak sarı glow */}
                    <View style={styles.playerCardWrapper}>
                      {hasPredictions && <View style={styles.predictionGlowBehind} />}
                      <TouchableOpacity
                        style={[
                          styles.playerCard,
                          hasPredictions && styles.playerCardPredicted,
                          hasSubstitution && { borderColor: '#EF4444', borderWidth: 3 },
                          !(isMatchLive || isMatchFinished) && (normalizeRatingTo100(player.rating) ?? 0) >= 85 && styles.playerCardElite,
                          !(isMatchLive || isMatchFinished) && (normalizeRatingTo100(player.rating) ?? 0) < 85 && (player.position === 'GK' || isGoalkeeperPlayer(player)) && styles.playerCardGK,
                          signalBorderStyle && !hasSubstitution && { borderColor: signalBorderStyle.borderColor, borderWidth: signalBorderStyle.borderWidth, ...(Platform.OS === 'web' && signalBorderStyle.glowColor ? { boxShadow: `0 0 ${signalBorderStyle.glowRadius || 6}px ${signalBorderStyle.glowColor}` } : {}) },
                          !signalBorderStyle && communityBorder && !hasSubstitution && { borderColor: communityBorder.color, borderWidth: communityBorder.width },
                          !signalBorderStyle && !communityBorder && (isMatchLive || isMatchFinished) && (positionLabel === 'GK' || isGoalkeeperPlayer(player)) && styles.playerCardGKCommunity,
                          !signalBorderStyle && !communityBorder && (isMatchLive || isMatchFinished) && (positionLabel === 'ST' || (player.position && String(player.position).toUpperCase() === 'ST')) && styles.playerCardSTCommunity,
                          isViewOnlyMode && { opacity: 0.85 },
                        ]}
                        onPress={() => {
                          if (predictionViewIndex === 2 && (isMatchLive || isMatchFinished)) {
                            setLiveReactionPlayer(player);
                            showTeamPerfBubbleIfAllowed();
                          } else {
                            setSelectedPlayer(player);
                          }
                        }}
                        activeOpacity={isViewOnlyMode ? 1 : 0.8}
                      >
                        <LinearGradient colors={['#1E3A3A', '#0F2A24']} style={styles.playerCardGradient}>
                          <View style={[
                            styles.jerseyNumberBadge,
                            (normalizeRatingTo100(player.rating) ?? 0) >= 85 && { backgroundColor: '#C9A44C' },
                            (normalizeRatingTo100(player.rating) ?? 0) < 85 && (player.position === 'GK' || isGoalkeeperPlayer(player)) && { backgroundColor: '#3B82F6' },
                          ]}>
                            <Text style={styles.jerseyNumberText}>
                              {(player.number ?? player.jersey_number ?? (player as any).shirt_number) != null && (player.number ?? player.jersey_number ?? (player as any).shirt_number) > 0 ? (player.number ?? player.jersey_number ?? (player as any).shirt_number) : '-'}
                            </Text>
                          </View>
                          <Text style={styles.playerName} numberOfLines={1}>
                            {formatPlayerDisplayName(player)}
                          </Text>
                          {/* Kadro sekmesi ile aynı: reyting sol alt, pozisyon sağ alt */}
                          <View style={styles.playerBottomRow}>
                            <Text style={styles.playerRatingBottom}>{normalizeRatingTo100(player.rating) != null ? String(normalizeRatingTo100(player.rating)) : '–'}</Text>
                            <Text style={styles.playerPositionBottom} numberOfLines={1}>{positionLabel}</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                    {/* ✅ Tik badge - tahmin yapıldı göstergesi (sol üst, "i" sağda kalır – üst üste binmez) */}
                    {hasPredictions && (
                      <View style={styles.predictionCheckBadgeTopLeft}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                    {/* Sinyal bilgisi kurallara göre sadece "i" ikonuna tıklanınca popup'ta gösterilir */}
                  </View>
                );
              }).filter(Boolean);
            })()}
          </View>
        </FootballField>
        </View>
        );
            })()}

        {/* ✅ Bildirim: Kadro saha altı konteyneri ile aynı boşluk (marginTop 16) – geçişte sıçrama olmasın */}
        {!threeFieldData && (
          <View style={{ marginTop: 16 }}>
            {!hasPrediction && (isMatchLive || isMatchFinished) ? (
              <View style={styles.infoNote}>
                <Ionicons name="eye-outline" size={14} color="#1FA2A6" style={{ flexShrink: 0 }} />
                <Text style={[styles.infoText, { color: '#5EEAD4', fontSize: 11 }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
                  Kadro tahmini yapmadığınız için tahmin yapamazsınız. Topluluk verilerini görmek için oyuncu kartlarına tıklayın.
                </Text>
              </View>
            ) : (
              <View style={styles.infoNote}>
                <Ionicons name="information-circle" size={16} color="#9CA3AF" />
                <Text style={styles.infoText} numberOfLines={2}>
                  Tahmin yapmak için oyuncu kartlarına tıklayın ve aşağı kaydırın.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ✅ MAÇ PUANI KARTI - KİLİTLİ KURAL: Maç bittikten sonra tahmin yapılmışsa göster */}
        {isMatchFinished && hasPrediction && (predictionScore || scoreLoading) && (
          <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#0F2A24', '#1A3A32', '#0F2A24']}
              style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}
            >
              {scoreLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 8 }}>Puan hesaplanıyor...</Text>
                </View>
              ) : predictionScore ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="trophy" size={20} color="#F59E0B" />
                      <Text style={{ color: '#F1F5F9', fontSize: 16, fontWeight: '700' }}>Tahmin Puanın</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' }}>
                      <Text style={{ color: '#34D399', fontSize: 22, fontWeight: '800' }}>{predictionScore.total_score}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    {[
                      { label: 'Tempo', score: predictionScore.tempo_score, color: '#3B82F6' },
                      { label: 'Disiplin', score: predictionScore.disiplin_score, color: '#F59E0B' },
                      { label: 'Fiziksel', score: predictionScore.fiziksel_score, color: '#EF4444' },
                      { label: 'Bireysel', score: predictionScore.bireysel_score, color: '#8B5CF6' },
                    ].map(cluster => (
                      <View key={cluster.label} style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingVertical: 8 }}>
                        <Text style={{ color: cluster.color, fontSize: 10, fontWeight: '600', marginBottom: 4 }}>{cluster.label}</Text>
                        <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700' }}>{cluster.score ?? 0}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                      Doğruluk: {predictionScore.correct_predictions}/{predictionScore.total_predictions} ({parseFloat(predictionScore.accuracy_percentage).toFixed(0)}%)
                    </Text>
                    {predictionScore.focus_bonus !== 0 && (
                      <Text style={{ color: predictionScore.focus_bonus > 0 ? '#34D399' : '#EF4444', fontSize: 11, fontWeight: '600' }}>
                        Odak: {predictionScore.focus_bonus > 0 ? '+' : ''}{predictionScore.focus_bonus}
                      </Text>
                    )}
                  </View>
                </>
              ) : null}
            </LinearGradient>
          </View>
        )}

        {/* PREDICTION CATEGORIES - Swipeable tab views */}
        {/* ✅ Tahmin görünüm sekmeleri: Benim Tahminim | Topluluk | Gerçek */}
        <View style={styles.predictionViewTabs}>
          {[
            { label: 'Benim Tahminim', icon: 'person' as const, color: '#FFFFFF' },
            { label: 'Topluluk', icon: 'people' as const, color: '#F59E0B' },
            ...((isMatchLive || isMatchFinished || hasRealLineupData) ? [{ label: 'Gerçek', icon: 'football' as const, color: '#EF4444' }] : []),
          ].map((tab, idx) => (
            <TouchableOpacity
              key={tab.label}
              style={styles.predictionViewTab}
              onPress={() => {
                setPredictionViewIndex(idx);
                setThreeFieldActiveIndex(idx);
                threeFieldScrollRef.current?.scrollTo({ x: idx * winW, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={tab.icon} size={14} color={predictionViewIndex === idx ? tab.color : '#64748B'} />
              <Text style={[
                styles.predictionViewTabText,
                predictionViewIndex === idx && { color: tab.color, fontWeight: '600' },
              ]}>
                {tab.label}
              </Text>
              {isMatchLive && tab.label === 'Gerçek' && (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tüm viewler için aynı kart formatı: 0=Benim, 1=Topluluk (readonly), 2=Gerçek (readonly+live) */}
        {/* Topluluk verileri görüldüyse "Bağımsız Tahmin Modundasınız" bildirimi gösterilmez; sadece veri görülmemişken empty state */}
        {predictionViewIndex === 1 && !communityDataVisible && !hasViewedCommunityData && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: hasViewedRealLineup ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name={hasViewedRealLineup ? 'lock-closed' : 'people'} size={32} color={hasViewedRealLineup ? '#EF4444' : '#F59E0B'} />
            </View>
            <Text style={{ color: cardTitleColor, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
              {hasViewedRealLineup
                ? 'Artık tahmin yapamazsınız'
                : hasPrediction && hasChosenIndependentAfterSave
                  ? 'Bağımsız Tahmin Modundasınız'
                  : 'Topluluk Verileri Kilitli'}
            </Text>
            <Text style={{ color: cardLabelColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              {hasViewedRealLineup
                ? 'Topluluk tercihleri ve/veya canlı takım dizilişini gördünüz. Tahminleriniz kalıcı olarak kilitlidir.'
                : hasPrediction && hasChosenIndependentAfterSave
                  ? 'Topluluk tahminlerini görmek için ekranın en altındaki butonu kullanabilirsiniz. Maç başladığında topluluk verileri otomatik açılacak ve +%10 bağımsız tahmin bonusu kazanacaksınız.'
                  : hasPrediction
                    ? 'Topluluk tahminlerini görmek için ekranın en altındaki butonu kullanabilirsiniz.'
                    : 'Topluluk tahminlerini görmek için önce kendi tahminlerinizi yapın ve kaydedin.'}
            </Text>
          </View>
        )}
        {/* Topluluk/gerçek veri yok mesajları artık sadece saha içi overlay'de gösteriliyor; şerit kaldırıldı */}
        {/* Alttaki konteynerlar (İlk Yarı, Maç Sonucu vb.) her sekmede gösterilir – Benim Tahminim / Topluluk / Gerçek aynı hizada, kartlar hep görünsün */}
        {(predictionViewIndex === 0 || predictionViewIndex === 1 || predictionViewIndex === 2) && (
        <View style={[
          styles.predictionsSection,
        ]}>
          {/* ═══════════════════════════════════════════════════════════
              1. İLK YARI - Skor + Uzatma Süresi (Kombine Kart)
          ═══════════════════════════════════════════════════════════ */}
          <TouchableOpacity 
            style={[styles.categoryCardCombined, styles.categoryCardFirstHalf]}
            activeOpacity={1}
            onPress={() => {
              if (isCardReadOnly) return;
              if (!hasPrediction && (isMatchLive || isMatchFinished)) return;
              if (isPredictionLocked) {
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>İlk Yarı</Text>
                  {predictionViewIndex === 0 && !isViewOnlyMode && isCategoryInSelectedFocus('firstHalfHomeScore') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'İlk Yarı Skor Tahmini',
                    generalDescription: 'İlk yarı skorunu tahmin edin.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının tahminleri:`,
                    communityStats: [
                      { label: 'Berabere', value: `%${communityMatchPredictions.firstHalf.draw}`, percentage: communityMatchPredictions.firstHalf.draw },
                      { label: 'Ev sahibi önde', value: `%${communityMatchPredictions.firstHalf.homeLeading}`, percentage: communityMatchPredictions.firstHalf.homeLeading },
                      { label: 'Deplasman önde', value: `%${communityMatchPredictions.firstHalf.awayLeading}`, percentage: communityMatchPredictions.firstHalf.awayLeading },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Minimalist Skor Seçici */}
            <View style={styles.scoreDisplayMinimal}>
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFirstHalf, { color: cardLabelColor }]}>EV</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn} 
                    onPress={() => handleScoreChange('firstHalfHomeScore', Math.max(0, (predictions.firstHalfHomeScore ?? 1) - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFirstHalf, { color: cardTitleColor }]}>{displayValues.firstHalfHomeScore != null ? displayValues.firstHalfHomeScore : 0}</Text>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfHomeScore', Math.min(9, (predictions.firstHalfHomeScore ?? -1) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.scoreDashMinimal}>
                <Text style={[styles.scoreDashTextMinimal, { color: cardTitleColor }]}>:</Text>
              </View>
              
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFirstHalf, { color: cardLabelColor }]}>DEP</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfAwayScore', Math.max(0, (predictions.firstHalfAwayScore ?? 1) - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFirstHalf, { color: cardTitleColor }]}>{displayValues.firstHalfAwayScore != null ? displayValues.firstHalfAwayScore : 0}</Text>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('firstHalfAwayScore', Math.min(9, (predictions.firstHalfAwayScore ?? -1) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, styles.cardDividerFirstHalf]} />
            
            {/* Uzatma Süresi Slider */}
            <View style={styles.sliderSectionCombined}>
              <View style={styles.sliderHeaderCombined}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={[styles.sliderLabelCombined, { color: cardLabelColor }]}>Uzatma Süresi</Text>
                <View style={[styles.sliderValueBadgeCombined, styles.sliderValueBadgeFirstHalf]}>
                  <Text style={[styles.sliderValueTextCombined, isLight && { color: themeColors.foreground }]}>
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
                  onValueChange={(v: number) => !isCardReadOnly && handlePredictionChange('firstHalfInjuryTime', `+${Math.round(v)} dk`)}
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
                      <Text style={[styles.sliderMarkCombined, { color: cardLabelColor }]}>{mark === 10 ? '10+' : mark}</Text>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Maç Sonu</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && isCategoryInSelectedFocus('secondHalfHomeScore') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
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
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Minimalist Skor Seçici */}
            <View style={styles.scoreDisplayMinimal}>
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFullTime, { color: cardLabelColor }]}>EV</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn} 
                    onPress={() => {
                      const minHome = predictions.firstHalfHomeScore ?? 0;
                      const newVal = Math.max(minHome, (predictions.secondHalfHomeScore ?? 1) - 1);
                      handleScoreChange('secondHalfHomeScore', newVal);
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFullTime, { color: cardTitleColor }]}>{displayValues.secondHalfHomeScore != null ? displayValues.secondHalfHomeScore : 0}</Text>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('secondHalfHomeScore', Math.min(9, (predictions.secondHalfHomeScore ?? -1) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <View style={styles.scoreDashMinimal}>
                <Text style={[styles.scoreDashTextMinimal, { color: cardTitleColor }]}>:</Text>
              </View>
              
              <View style={styles.scoreTeamMinimal}>
                <Text style={[styles.scoreTeamLabelMinimal, styles.scoreTeamLabelFullTime, { color: cardLabelColor }]}>DEP</Text>
                <View style={styles.scoreValueContainerMinimal}>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => {
                      const minAway = predictions.firstHalfAwayScore ?? 0;
                      const newVal = Math.max(minAway, (predictions.secondHalfAwayScore ?? 1) - 1);
                      handleScoreChange('secondHalfAwayScore', newVal);
                    }}
                  >
                    <Ionicons name="remove" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                  <Text style={[styles.scoreValueMinimal, styles.scoreValueFullTime, { color: cardTitleColor }]}>{displayValues.secondHalfAwayScore != null ? displayValues.secondHalfAwayScore : 0}</Text>
                  {!isCardReadOnly && (
                  <TouchableOpacity 
                    style={styles.scoreAdjustBtn}
                    onPress={() => handleScoreChange('secondHalfAwayScore', Math.min(9, (predictions.secondHalfAwayScore ?? -1) + 1))}
                  >
                    <Ionicons name="add" size={18} color="#64748B" />
                  </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
            
            <View style={[styles.cardDividerCombined, styles.cardDividerFullTime]} />
            
            {/* Uzatma Süresi Slider */}
            <View style={styles.sliderSectionCombined}>
              <View style={styles.sliderHeaderCombined}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={[styles.sliderLabelCombined, { color: cardLabelColor }]}>Uzatma Süresi</Text>
                <View style={[styles.sliderValueBadgeCombined, styles.sliderValueBadgeFullTime]}>
                  <Text style={[styles.sliderValueTextCombined, isLight && { color: themeColors.foreground }]}>
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
                  onValueChange={(v: number) => !isCardReadOnly && handlePredictionChange('secondHalfInjuryTime', `+${Math.round(v)} dk`)}
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
                      <Text style={[styles.sliderMarkCombined, { color: cardLabelColor }]}>{mark === 10 ? '10+' : mark}</Text>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Gol Tahminleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('totalGoals') || isCategoryInSelectedFocus('firstGoalTime')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
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
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Toplam Gol - Disiplin Tarzı Zarif */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>Toplam Gol</Text>
                {!isCardReadOnly && !isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: isLight ? themeColors.foreground : '#10B981' }]}>{effectiveTotalGoals || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {TOTAL_GOALS_RANGES.map((range) => {
                  const isSelected = isCardReadOnly ? displayTotalGoals === range : effectiveTotalGoals === range;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.totalGoals === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        !(isSelected || isCommunityTop) && { backgroundColor: segmentBg, borderColor: segmentBorder },
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveEmerald,
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('totalGoals', range)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isCardReadOnly}
                    >
                      <Text style={[styles.disciplineBarSegmentText, { color: cardLabelColor }, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
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
                <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>İlk Gol Zamanı</Text>
              </View>
            </View>
            
            <View style={styles.firstGoalTimeline}>
              {/* 1. Yarı (1-15', 16-30', 31-45', 45+) */}
              <View style={styles.timelineRow}>
                <Text style={[styles.timelineRowLabel, { color: cardLabelColor }]}>1Y</Text>
                <View style={styles.timelineRowButtons}>
                  {[
                    { label: "1-15'", value: '1-15' },
                    { label: "16-30'", value: '16-30' },
                    { label: "31-45'", value: '31-45' },
                    { label: "45+'", value: '45+' },
                  ].map((t) => {
                    const isSelected = isCardReadOnly ? displayValues.firstGoalTime === t.value : predictions.firstGoalTime === t.value;
                    const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.firstGoalTime === t.value;
                    const isActive = isSelected || isCommunityTop;
                    return (
                      <TouchableOpacity 
                        key={t.value} 
                        style={[
                          styles.timelineBtnCompact,
                          !isActive && { backgroundColor: segmentBg, borderColor: segmentBorder },
                          isActive && styles.timelineBtnCompactActiveFirst,
                        ]}
                        onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('firstGoalTime', t.value)}
                        activeOpacity={isCardReadOnly ? 1 : 0.7}
                        disabled={isCardReadOnly}
                      >
                        <Text style={[styles.timelineBtnTextCompact, { color: cardLabelColor }, isActive && styles.timelineBtnTextCompactActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* 2. Yarı (46-60', 61-75', 76-90', 90+) */}
              <View style={styles.timelineRow}>
                <Text style={[styles.timelineRowLabel, { color: cardLabelColor }]}>2Y</Text>
                <View style={styles.timelineRowButtons}>
                  {[
                    { label: "46-60'", value: '46-60' },
                    { label: "61-75'", value: '61-75' },
                    { label: "76-90'", value: '76-90' },
                    { label: "90+'", value: '90+' },
                  ].map((t) => {
                    const isSelected = isCardReadOnly ? displayValues.firstGoalTime === t.value : predictions.firstGoalTime === t.value;
                    const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.firstGoalTime === t.value;
                    const isActive = isSelected || isCommunityTop;
                    return (
                      <TouchableOpacity 
                        key={t.value} 
                        style={[
                          styles.timelineBtnCompact,
                          !isActive && { backgroundColor: segmentBg, borderColor: segmentBorder },
                          isActive && styles.timelineBtnCompactActiveSecond,
                        ]}
                        onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('firstGoalTime', t.value)}
                        activeOpacity={isCardReadOnly ? 1 : 0.7}
                        disabled={isCardReadOnly}
                      >
                        <Text style={[styles.timelineBtnTextCompact, { color: cardLabelColor }, isActive && styles.timelineBtnTextCompactActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Gol Yok Olabilir */}
              <TouchableOpacity 
                style={[styles.noGoalBtn, (isCardReadOnly ? displayValues.firstGoalTime : predictions.firstGoalTime) !== 'no_goal' && { backgroundColor: segmentBg, borderColor: segmentBorder }, (isCardReadOnly ? displayValues.firstGoalTime : predictions.firstGoalTime) === 'no_goal' && styles.noGoalBtnActive]}
                onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('firstGoalTime', 'no_goal')}
                activeOpacity={isCardReadOnly ? 1 : 0.7}
                disabled={isViewOnlyMode}
              >
                <Ionicons name="close-circle-outline" size={12} color={(isCardReadOnly ? displayValues.firstGoalTime : predictions.firstGoalTime) === 'no_goal' ? '#FFF' : '#94A3B8'} />
                <Text style={[styles.noGoalBtnText, { color: cardLabelColor }, (isCardReadOnly ? displayValues.firstGoalTime : predictions.firstGoalTime) === 'no_goal' && styles.noGoalBtnTextActive]}>Gol yok</Text>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Disiplin</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('yellowCards') || isCategoryInSelectedFocus('redCards')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
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
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.disciplineColumnsContainer}>
              {/* Sarı Kart - Event varsa gerçek sayı, yoksa tahmin aralığı; oyuncu tahminlerinden toplam gösterilir */}
              <View style={styles.disciplineColumn}>
                <View style={styles.disciplineColumnHeader}>
                  <View style={styles.disciplineColumnTitleRow}>
                    <Text style={styles.disciplineColumnTitle}>Sarı Kart</Text>
                    {disciplineTotalsFromPlayers.yellow > 0 && predictionViewIndex !== 1 && (
                      <Text style={[styles.disciplineColumnTotalBadge, { color: '#FBBF24' }]}>
                        {disciplineTotalsFromPlayers.yellow}
                      </Text>
                    )}
                  </View>
                  {!isViewOnlyMode && (
                    <Text style={[styles.disciplineColumnValue, { color: '#FBBF24' }]}>
                      {(isMatchLive || isMatchFinished) && actualResults.totalYellowCards != null
                        ? String(actualResults.totalYellowCards)
                        : (isCardReadOnly ? displayValues.yellowCards : predictions.yellowCards) || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.verticalBarsContainer}>
                  {[
                    { label: '1-2', height: 20, color: '#FBBF24' },
                    { label: '3-4', height: 32, color: '#FBBF24' },
                    { label: '5-6', height: 44, color: '#FBBF24' },
                    { label: '7+', height: 56, color: '#FBBF24' },
                  ].map((item) => {
                    const isSelected = isCardReadOnly ? displayValues.yellowCards === item.label : predictions.yellowCards === item.label;
                    const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.yellowCards === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={styles.verticalBarWrapper}
                        onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('yellowCards', item.label)}
                        activeOpacity={isCardReadOnly ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <View 
                          style={[
                            styles.verticalBar,
                            { height: item.height, backgroundColor: isSelected || isCommunityTop ? item.color : 'rgba(251, 191, 36, 0.2)' },
                            (isSelected || isCommunityTop) && { borderWidth: 0 }
                          ]}
                        />
                        <Text style={[styles.verticalBarLabel, { color: cardLabelColor }, (isSelected || isCommunityTop) && { color: '#FBBF24', fontWeight: '600' }]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Ayırıcı Çizgi */}
              <View style={styles.disciplineColumnDivider} />
              
              {/* Kırmızı Kart - Event varsa gerçek sayı, yoksa tahmin; oyuncu tahminlerinden toplam gösterilir */}
              <View style={styles.disciplineColumn}>
                <View style={styles.disciplineColumnHeader}>
                  <View style={styles.disciplineColumnTitleRow}>
                    <Text style={styles.disciplineColumnTitle}>Kırmızı Kart</Text>
                    {disciplineTotalsFromPlayers.red > 0 && predictionViewIndex !== 1 && (
                      <Text style={[styles.disciplineColumnTotalBadge, { color: '#F87171' }]}>
                        {disciplineTotalsFromPlayers.red}
                      </Text>
                    )}
                  </View>
                  {!isViewOnlyMode && (
                    <Text style={[styles.disciplineColumnValue, { color: '#F87171' }]}>
                      {(isMatchLive || isMatchFinished) && actualResults.totalRedCards != null
                        ? String(actualResults.totalRedCards)
                        : (isCardReadOnly ? displayValues.redCards : predictions.redCards) || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.verticalBarsContainer}>
                  {[
                    { label: '1', height: 24, color: '#F87171' },
                    { label: '2', height: 36, color: '#F87171' },
                    { label: '3', height: 48, color: '#F87171' },
                    { label: '4+', height: 56, color: '#F87171' },
                  ].map((item) => {
                    const isSelected = isCardReadOnly ? displayValues.redCards === item.label : predictions.redCards === item.label;
                    const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.redCards === item.label;
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={styles.verticalBarWrapper}
                        onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('redCards', item.label)}
                        activeOpacity={isCardReadOnly ? 1 : 0.7}
                        disabled={isViewOnlyMode}
                      >
                        <View 
                          style={[
                            styles.verticalBar,
                            { height: item.height, backgroundColor: isSelected || isCommunityTop ? item.color : 'rgba(248, 113, 113, 0.2)' },
                            (isSelected || isCommunityTop) && { borderWidth: 0 }
                          ]}
                        />
                        <Text style={[styles.verticalBarLabel, { color: cardLabelColor }, (isSelected || isCommunityTop) && { color: '#F87171', fontWeight: '600' }]}>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Topa Sahip Olma</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && isCategoryInSelectedFocus('possession') && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
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
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Zarif Display */}
            <View style={styles.possessionDisplayElegant}>
              <View style={styles.possessionTeamElegant}>
                <Text style={[styles.possessionTeamLabelElegant, { color: cardLabelColor }]}>EV</Text>
                <Text style={styles.possessionTeamValueElegant}>
                  {(isCardReadOnly ? displayValues.possession : predictions.possession) ? `${isCardReadOnly ? displayValues.possession : predictions.possession}%` : '-'}
                </Text>
              </View>
              
              <View style={styles.possessionBarContainer}>
                <View style={[styles.possessionBarSegment, styles.possessionBarHome, { flex: parseInt((isCardReadOnly ? displayValues.possession : predictions.possession) || '50') }]} />
                <View style={[styles.possessionBarSegment, styles.possessionBarAway, { flex: 100 - parseInt((isCardReadOnly ? displayValues.possession : predictions.possession) || '50') }]} />
              </View>
              
              <View style={styles.possessionTeamElegant}>
                <Text style={[styles.possessionTeamLabelElegant, { color: cardLabelColor }]}>DEP</Text>
                <Text style={[styles.possessionTeamValueElegant, { color: cardLabelColor }]}>
                  {(isCardReadOnly ? displayValues.possession : predictions.possession) ? `${100 - parseInt((isCardReadOnly ? displayValues.possession : predictions.possession) || '50')}%` : '-'}
                </Text>
              </View>
            </View>

            {/* Minimalist Slider */}
            <View style={[styles.sliderSectionCombined, isViewOnlyMode && { opacity: 0.7 }]}>
              <View style={styles.sliderTrackContainer}>
                <Slider
                  value={parseInt((isCardReadOnly ? displayValues.possession : predictions.possession) || '50')}
                  onValueChange={(value) => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('possession', value.toString())}
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
                    <Text key={String(mark)} style={[styles.sliderMarkCombined, { color: cardLabelColor }]}>{mark}</Text>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Şut İstatistikleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('totalShots') || isCategoryInSelectedFocus('shotsOnTarget')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
                <TouchableOpacity
                  style={styles.sectionInfoButton}
                  onPress={() => handleSectionInfoPress({
                    title: 'Şut İstatistikleri',
                    generalDescription: 'Maçtaki toplam şut, korner sayısı ve isabetli şut oranını tahmin edin.',
                    communityDescription: `${communityMatchPredictions.totalUsers.toLocaleString()} kullanıcının şut ve korner tahminleri:`,
                    communityStats: [
                      ...communityMatchPredictions.shots.totalRanges.map(r => ({
                        label: `Toplam şut (${r.range})`,
                        value: `%${r.percentage}`,
                        percentage: r.percentage,
                      })),
                      { label: 'Ortalama toplam şut', value: String(communityMatchPredictions.shots.avgTotal), percentage: Math.round(communityMatchPredictions.shots.avgTotal * 2.5) },
                      { label: 'İsabetli şut oranı', value: `%${communityMatchPredictions.shots.onTargetPercentage}`, percentage: communityMatchPredictions.shots.onTargetPercentage },
                      { label: '——— Korner ———', value: '', percentage: 0 },
                      ...communityMatchPredictions.corners.totalRanges.map(r => ({
                        label: `Toplam korner (${r.range})`,
                        value: `%${r.percentage}`,
                        percentage: r.percentage,
                      })),
                      { label: 'Ortalama toplam korner', value: String(communityMatchPredictions.corners.avgTotal), percentage: Math.round(communityMatchPredictions.corners.avgTotal * 3) },
                    ],
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Toplam Şut - Disiplin Tarzı */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>Toplam Şut</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#60A5FA' }]}>{predictions.totalShots || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-10', '11-20', '21-30', '31+'].map((range) => {
                  const isSelected = isCardReadOnly ? displayValues.totalShots === range : predictions.totalShots === range;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.totalShots === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        !(isSelected || isCommunityTop) && { backgroundColor: segmentBg, borderColor: segmentBorder },
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveBlue,
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('totalShots', range)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, { color: cardLabelColor }, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
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
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>İsabetli Şut</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#34D399' }]}>{predictions.shotsOnTarget || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-5', '6-10', '11-15', '16+'].map((range) => {
                  const isSelected = isCardReadOnly ? displayValues.shotsOnTarget === range : predictions.shotsOnTarget === range;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.shotsOnTarget === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        !(isSelected || isCommunityTop) && { backgroundColor: segmentBg, borderColor: segmentBorder },
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveGreen,
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('shotsOnTarget', range)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, { color: cardLabelColor }, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
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
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>Toplam Korner</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#F59E0B' }]}>{predictions.totalCorners || '?'}</Text>}
              </View>
              <View style={styles.disciplineBarTrack}>
                {['0-6', '7-10', '11-14', '15+'].map((range) => {
                  const isSelected = isCardReadOnly ? displayValues.totalCorners === range : predictions.totalCorners === range;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.totalCorners === range;
                  return (
                    <TouchableOpacity
                      key={range}
                      style={[
                        styles.disciplineBarSegment,
                        !(isSelected || isCommunityTop) && { backgroundColor: segmentBg, borderColor: segmentBorder },
                        (isSelected || isCommunityTop) && styles.disciplineBarSegmentActiveOrange
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('totalCorners', range)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Text style={[styles.disciplineBarSegmentText, { color: cardLabelColor }, (isSelected || isCommunityTop) && styles.disciplineBarSegmentTextActive]}>
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
                  <Text style={[styles.combinedCardTitle, { color: cardTitleColor }]}>Taktik Tahminleri</Text>
                  {/* Bonus badge sadece normal modda */}
                  {!isViewOnlyMode && (isCategoryInSelectedFocus('tempo') || isCategoryInSelectedFocus('scenario')) && (
                    <View style={styles.focusBonusBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.focusBonusText}>+Bonus</Text>
                    </View>
                  )}
                </View>
                {predictionViewIndex === 1 && (
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
                  <Text style={[styles.sectionInfoButtonText, { color: cardLabelColor }]}>i</Text>
                </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Tempo - İkonlu Butonlar */}
            <View style={styles.disciplineBarSection}>
              <View style={styles.disciplineBarHeader}>
                <Ionicons name="speedometer-outline" size={14} color="#F59E0B" />
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>Oyun Temposu</Text>
                {!isViewOnlyMode && <Text style={[styles.disciplineBarValue, { color: '#F59E0B' }]}>{predictions.tempo ? predictions.tempo.split(' ')[0] : '?'}</Text>}
              </View>
              <View style={styles.tempoButtonRow}>
                {[
                  { label: 'Düşük', value: 'Düşük tempo', icon: 'remove-circle-outline', color: '#60A5FA' },
                  { label: 'Orta', value: 'Orta tempo', icon: 'pause-circle-outline', color: '#FBBF24' },
                  { label: 'Yüksek', value: 'Yüksek tempo', icon: 'flash-outline', color: '#F87171' },
                ].map((item) => {
                  const isSelected = isCardReadOnly ? displayValues.tempo === item.value : predictions.tempo === item.value;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.tempo === item.value;
                  const isActive = isSelected || isCommunityTop;
                  return (
                    <TouchableOpacity 
                      key={item.value} 
                      style={[
                        styles.tempoBtn,
                        isActive && [styles.tempoBtnActive, { borderColor: item.color, backgroundColor: `${item.color}15` }],
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('tempo', item.value)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Ionicons name={item.icon as any} size={16} color={isActive ? item.color : (isLight ? themeColors.mutedForeground : '#64748B')} />
                      <Text style={[styles.tempoBtnText, !isActive && { color: cardLabelColor }, isActive && { color: item.color }]}>
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
                <Text style={[styles.disciplineBarTitle, { color: cardLabelColor }]}>Maç Senaryosu</Text>
              </View>
              <View style={styles.scenarioGrid}>
                {[
                  { label: 'Kontrollü', value: 'Kontrollü oyun', icon: 'shield-checkmark-outline', color: '#60A5FA' },
                  { label: 'Baskılı', value: 'Baskılı oyun', icon: 'arrow-forward-circle-outline', color: '#F87171' },
                  { label: 'Geçiş oyunu', value: 'Geçiş oyunu ağırlıklı', icon: 'swap-horizontal-outline', color: '#34D399' },
                  { label: 'Dengeli maç', value: 'Dengeli maç', icon: 'scale-outline', color: '#A78BFA' },
                ].map((item) => {
                  const isSelected = isCardReadOnly ? displayValues.scenario === item.value : predictions.scenario === item.value;
                  const isCommunityTop = !isCardReadOnly && isViewOnlyMode && communityTopPredictions.scenario === item.value;
                  const isActive = isSelected || isCommunityTop;
                  return (
                    <TouchableOpacity 
                      key={item.value} 
                      style={[
                        styles.scenarioBtn,
                        isActive && [styles.scenarioBtnActive, { borderColor: item.color, backgroundColor: `${item.color}15` }]
                      ]}
                      onPress={() => !isCardReadOnly && !isViewOnlyMode && handlePredictionChange('scenario', item.value)}
                      activeOpacity={isCardReadOnly ? 1 : 0.7}
                      disabled={isViewOnlyMode}
                    >
                      <Ionicons name={item.icon as any} size={18} color={isActive ? item.color : (isLight ? themeColors.mutedForeground : '#64748B')} />
                      <Text style={[styles.scenarioBtnText, !isActive && { color: cardLabelColor }, isActive && { color: item.color }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>

        </View>
        )}

        {/* Eski ayrı Topluluk/Gerçek görünümleri kaldırıldı - artık tüm viewler yukarıdaki aynı kart formatını kullanıyor */}

        {/* ✅ Tahmin Kaydet Toolbar (tüm view'larda görünür) */}
        <View style={styles.predictionsSection}>
          {/* Topluluk sekmesi kilitli: ekranın en altında sadece Topluluk Verilerini Gör + Vazgeç + uyarı; kilit/bonus/kaydet yok */}
          {predictionViewIndex === 1 && !communityDataVisible && hasPrediction && !hasViewedCommunityData && !hasViewedRealLineup ? (
            <View style={styles.predictionToolbar}>
              <View style={{ flex: 1, paddingHorizontal: 12, gap: 10 }}>
                {showNoCommunityDataBanner ? (
                  <View style={{ backgroundColor: 'rgba(31, 162, 166, 0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(31, 162, 166, 0.35)', paddingVertical: 14, paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="people-outline" size={20} color="#F59E0B" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#F1F5F9' }}>Henüz yeterli topluluk verisi yok</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: 'rgba(241, 245, 249, 0.85)', lineHeight: 18, marginBottom: 12 }}>
                      Topluluk verisi oluşturulmaya başladığı anda ortalamalar hesaplanacak ve burada görünecek. Tahminleriniz şu an düzenlenebilir.
                    </Text>
                    <TouchableOpacity style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(31, 162, 166, 0.4)', borderRadius: 8 }} onPress={() => setShowNoCommunityDataBanner(false)} activeOpacity={0.8}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#F1F5F9' }}>Tamam</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: isLight ? 'rgba(59, 130, 246, 0.9)' : 'rgba(217, 119, 6, 0.92)',
                        borderRadius: 999,
                        paddingVertical: 12,
                        paddingHorizontal: 28,
                        minWidth: 180,
                      }}
                      onPress={() => setLockConfirmType('community')}
                      activeOpacity={0.88}
                    >
                      <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Topluluk Verilerini Gör</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.35)', backgroundColor: 'rgba(148, 163, 184, 0.08)', alignItems: 'center' }}
                      onPress={() => {
                        setPredictionViewIndex(0);
                        setThreeFieldActiveIndex(0);
                        threeFieldScrollRef.current?.scrollTo({ x: 0, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#94A3B8' }}>Vazgeç</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={{ fontSize: 11, color: isLight ? '#B91C1C' : '#FCA5A5', textAlign: 'center' }}>Topluluk verilerini görürseniz tahminleriniz kalıcı olarak kilitlenir</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          ) : predictionViewIndex === 2 ? (
          /* Gerçek sekmesi: sadece kırmızı kilit, kaydet/bonus yok */
            <View style={styles.predictionToolbar}>
              <View style={[styles.predictionLockButton, styles.predictionLockButtonLocked, { opacity: 1 }]}>
                <Ionicons name="lock-closed" size={20} color="#EF4444" />
              </View>
            </View>
          ) : isViewOnlyMode ? (
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
              {/* ✅ Topluluk verileri görüldüyse kilit kalıcı olarak kilitli - buton devre dışı */}
              <TouchableOpacity
                style={[
                  styles.predictionLockButton,
                  isPredictionLocked ? styles.predictionLockButtonLocked : styles.predictionLockButtonOpen,
                  (hasViewedCommunityData || hasViewedRealLineup || ((isMatchLive || isMatchFinished) && isPredictionLocked)) && { opacity: 0.5 }
                ]}
                onPress={handleLockToggle}
                activeOpacity={(hasViewedCommunityData || hasViewedRealLineup || ((isMatchLive || isMatchFinished) && isPredictionLocked)) ? 1 : 0.7}
              >
                <Ionicons 
                  name={isPredictionLocked ? "lock-closed" : "lock-open"} 
                  size={20} 
                  color={isPredictionLocked ? '#EF4444' : '#10B981'} 
                />
              </TouchableOpacity>

              {/* Kaydet Butonu - Sağda (flex: 1) */}
              {/* ✅ Bağımsız Tahmin Bonusu Badge */}
              {independentPredictionBonus && !hasViewedCommunityData && !madeAfterCommunityViewed && hasPrediction && (
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
              
              {/* ⚠️ Topluluk Verilerini Gördükten Sonra Yeni Tahmin - %80 Puan Kaybı Uyarısı */}
              {madeAfterCommunityViewed && (
                <View style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Ionicons name="warning" size={14} color="#EF4444" />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#EF4444' }}>%80 Puan Kaybı</Text>
                </View>
              )}

              {/* Kaydet / Tahminler Kilitli: Kayıttan sonra her zaman "Tahminler Kilitli" gösterilir. Topluluk verileri modal/saha içinden açılır. */}
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  (isSaving || isPredictionLocked) && styles.submitButtonDisabled
                ]}
                activeOpacity={0.85}
                onPress={handleSavePredictions}
                disabled={isSaving || isPredictionLocked}
              >
                <LinearGradient
                  colors={(isSaving || isPredictionLocked) ? ['rgba(71, 85, 105, 0.9)', 'rgba(51, 65, 85, 0.95)'] : ['rgba(20, 184, 166, 0.95)', 'rgba(13, 148, 136, 0.95)']}
                  style={styles.submitButtonGradient}
                >
                  {isSaving ? (
                    <View style={styles.submitButtonLoading}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Kaydediliyor...</Text>
                    </View>
                  ) : isPredictionLocked ? (
                    <View style={styles.submitButtonContent}>
                      <Ionicons name="lock-closed" size={18} color="rgba(248, 113, 113, 0.95)" style={{ marginRight: 6 }} />
                      <Text style={[styles.submitButtonTextLocked, { color: 'rgba(254, 202, 202, 0.98)' }]}>Tahminler Kilitli</Text>
                    </View>
                  ) : (
                    <Text style={[styles.submitButtonText, { fontWeight: '600', letterSpacing: 0.2 }]}>Tahminleri Kaydet</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Resim 3 bildirimi kaldırıldı: Bağımsız Tahmin Modundasınız / Gerçek Kadro Görüntülendi kartı yok */}

      </View>
      )}
      </ScrollView>

      {/* Player Prediction Modal - inline dropdown hemen butonların altında */}
      {selectedPlayer && (
        <PlayerPredictionModal
          player={selectedPlayer}
          predictions={currentPlayerPredictions}
          isPredictionLocked={isPredictionLocked || (hasAnyRealPlayerPrediction(currentPlayerPredictions) && isPlayerLocked(selectedPlayer.id))}
          isThisPlayerLocked={hasAnyRealPlayerPrediction(currentPlayerPredictions) && isPlayerLocked(selectedPlayer.id)}
          isMasterLocked={isPredictionLocked}
          onShowLockedWarning={(reason) => {
            const effectiveReason = reason === 'master_then_player'
              ? (hasViewedCommunityData ? 'community_viewed' : hasViewedRealLineup ? 'real_lineup_viewed' : (isMatchLive || isMatchFinished) ? 'match_started' : 'master_then_player')
              : reason;
            setLockedWarningReason(effectiveReason);
            setShowLockedWarningModal(true);
          }}
          onUnlockLock={(!isMatchLive && !isMatchFinished && !isPredictionLocked) ? () => unlockSinglePlayer(selectedPlayer.id) : undefined}
          onSaveAndLock={async () => {
            await saveSinglePlayerAndLock(selectedPlayer.id);
            setSelectedPlayer(null);
          }}
          onClose={() => tryClosePlayerModal('close')}
          onCancel={() => tryClosePlayerModal('cancel')}
          onPredictionChange={handlePlayerPredictionChange}
          startingXI={attackPlayersArray}
          reservePlayers={reserveTeamPlayers.length > 0 ? reserveTeamPlayers : allTeamPlayers}
          allPlayerPredictions={playerPredictions}
          onSubstituteConfirm={(type, playerId, minute) => {
            if (!selectedPlayer || isPredictionLocked) return;
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

      {/* Tahmini Sil – uygulama içi popup (native confirm yerine, resim 1) */}
      {deletePlayerPredictionModal && (
        <ConfirmModal
          visible={true}
          title="Tahmini Sil"
          message={`${deletePlayerPredictionModal.playerName} için yaptığınız tüm tahminleri silmek istediğinize emin misiniz?`}
          buttons={[
            { text: 'İptal', style: 'cancel', onPress: () => setDeletePlayerPredictionModal(null) },
            { text: 'Tamam', style: 'destructive', onPress: deletePlayerPredictionModal.onConfirm },
          ]}
          onRequestClose={() => setDeletePlayerPredictionModal(null)}
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
              backgroundColor: themeColors.popover,
              borderRadius: 16,
              width: '100%',
              maxWidth: 380, // ✅ STANDART: 380px genişlik
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
              <Text style={{ color: themeColors.mutedForeground, fontSize: 14, marginBottom: 12 }}>
                {comparisonModal.categoryLabel}
              </Text>
              
              {/* Karşılaştırma */}
              <View style={{ 
                backgroundColor: isLight ? themeColors.muted : 'rgba(0,0,0,0.3)', 
                borderRadius: 12, 
                padding: 16,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: themeColors.mutedForeground, fontSize: 12, marginBottom: 4 }}>Senin Tahminin</Text>
                    <Text style={{ color: themeColors.foreground, fontSize: 20, fontWeight: '700' }}>
                      {comparisonModal.predicted ?? '-'}
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: themeColors.border }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: themeColors.mutedForeground, fontSize: 12, marginBottom: 4 }}>Gerçek Sonuç</Text>
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
              backgroundColor: themeColors.popover,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: themeColors.border,
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
                borderBottomColor: themeColors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pulse" size={22} color="#F59E0B" />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: themeColors.foreground }}>
                      {signalPopupPlayer.playerName}
                    </Text>
                    <Text style={{ fontSize: 11, color: themeColors.mutedForeground }}>
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
                    if (conflictResult.blocked) {
                      showInfo('Çelişkili tahmin', conflictResult.message + '\n\nBu sinyale katılamazsınız.');
                    } else {
                      showConfirm(
                        'Çelişkili tahmin',
                        conflictResult.message + '\n\nYine de katılmak istiyor musunuz?',
                        () => { console.log('Sinyal topluluk katılımı:', signalJoinModal.signal.type); setSignalJoinModal(null); },
                        undefined,
                        'Yine de katıl',
                        'İptal'
                      );
                    }
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
                      if (conflictResult.blocked) {
                        showInfo('Çelişkili tahmin', conflictResult.message + '\n\nBu tahmin kaydedilemez.');
                      } else {
                        showConfirm(
                          'Çelişkili tahmin',
                          conflictResult.message + '\n\nYine de kaydetmek istiyor musunuz?',
                          () => { console.log('Kendi tahmini kaydedildi:', signalJoinModal.signal.type, ownPredictionNote); setSignalJoinModal(null); setOwnPredictionNote(''); },
                          undefined,
                          'Yine de kaydet',
                          'İptal'
                        );
                      }
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
              maxWidth: 380, // ✅ STANDART: 380px genişlik
              backgroundColor: themeColors.popover,
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
                color: themeColors.foreground,
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 24,
              }}>
                {lockedWarningReason === 'match_started'
                  ? 'Maç başladığı veya bittiği için artık tahminlerde değişiklik yapamazsınız.'
                  : lockedWarningReason === 'community_viewed'
                  ? 'Topluluk verilerini gördüğünüz için tahmin kilidi artık açılamaz. Tahminleriniz kalıcı olarak kilitlidir.'
                  : lockedWarningReason === 'real_lineup_viewed'
                  ? 'Gerçek kadroyu gördüğünüz için tahmin kilidi artık açılamaz. Tahminleriniz kalıcı olarak kilitlidir.'
                  : lockedWarningReason === 'master_then_player'
                  ? 'Önce sayfa altındaki master kilidi açın. Sonra oyuncu kartına gelerek "Tahminler Kilitli" butonuna basıp oyuncu kilidini açın.'
                  : 'Oyunculara ve maça ait tahminlerde değişiklik yapmak için sayfanın en altındaki kilidi açın.'}
              </Text>
              
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

      {/* 🔒 SAHA İÇİ "GÖR" ONAY – Emin misiniz? Artık tahmininizi değiştiremeyeceksiniz */}
      {lockConfirmType && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLockConfirmType(null)} statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setLockConfirmType(null)} />
            <View style={{ width: '100%', maxWidth: 320, backgroundColor: lockConfirmType === 'real' ? '#152d28' : '#1E3A3A', borderRadius: 16, borderWidth: 1, borderColor: lockConfirmType === 'real' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(31, 162, 166, 0.4)', padding: 22 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: lockConfirmType === 'real' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14 }}>
                <Ionicons name="lock-closed" size={24} color={lockConfirmType === 'real' ? '#EF4444' : '#F59E0B'} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }}>
                {lockConfirmType === 'real' ? 'Kadroyu görmek istediğinize emin misiniz?' : 'Emin misiniz?'}
              </Text>
              <Text style={{ fontSize: 13, color: '#94A3B8', lineHeight: 20, textAlign: 'center', marginBottom: 20 }}>
                {lockConfirmType === 'real'
                  ? 'Artık tahmin yapamayacak ve puan kazanmayacaksınız. Bu işlem geri alınamaz.'
                  : 'Artık tahmininizi değiştiremeyeceksiniz. Bu işlem geri alınamaz.'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(71, 85, 105, 0.5)', alignItems: 'center' }}
                  onPress={() => setLockConfirmType(null)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#E2E8F0' }}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: lockConfirmType === 'community' ? '#3B82F6' : 'transparent',
                    borderWidth: lockConfirmType === 'real' ? 1.5 : 0,
                    borderColor: lockConfirmType === 'real' ? '#EF4444' : 'transparent',
                  }}
                  onPress={async () => {
                    const wasCommunity = lockConfirmType === 'community';
                    const wasReal = lockConfirmType === 'real';
                    if (wasCommunity) {
                      setHasViewedCommunityData(true);
                      setIndependentPredictionBonus(false);
                      onViewedCommunityData?.();
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
                    } else if (wasReal) {
                      setHasViewedRealLineup(true);
                      setIsPredictionLocked(true);
                      try {
                        const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
                        const existingData = await AsyncStorage.getItem(storageKey);
                        if (existingData) {
                          const parsed = JSON.parse(existingData);
                          parsed.hasViewedRealLineup = true;
                          parsed.isPredictionLocked = true;
                          await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
                        }
                      } catch (e) {
                        console.warn('Gerçek kadro durumu kaydedilemedi:', e);
                      }
                    }
                    setLockConfirmType(null);
                    if (wasCommunity) {
                      setPredictionViewIndex(1);
                      setThreeFieldActiveIndex(1);
                      setTimeout(() => {
                        mainScrollRef.current?.scrollToEnd({ animated: true });
                        threeFieldScrollRef.current?.scrollTo({ x: effectivePageWidth * 1, animated: true });
                      }, 300);
                    } else if (wasReal) {
                      setPredictionViewIndex(2);
                      setThreeFieldActiveIndex(2);
                      setTimeout(() => {
                        // Gerçek sekmesinde saha üstten kesilmesin: dikey scroll en alta değil, en üste (saha görünsün)
                        mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                        threeFieldScrollRef.current?.scrollTo({ x: effectivePageWidth * 2, animated: true });
                      }, 300);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: lockConfirmType === 'real' ? '#EF4444' : '#FFFFFF' }}>
                    {lockConfirmType === 'real' ? 'Kadroyu gör' : 'Eminim'}
                  </Text>
                </TouchableOpacity>
              </View>
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
              maxWidth: 380, // ✅ STANDART: 380px genişlik
              backgroundColor: themeColors.popover,
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
                color: themeColors.foreground,
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
              {/* Header: Topluluk verisi ise teal/people, değilse kırmızı i */}
              <View style={{
                backgroundColor: playerInfoPopup.showCommunityData ? 'rgba(31, 162, 166, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: playerInfoPopup.showCommunityData ? 'rgba(31, 162, 166, 0.35)' : 'rgba(239, 68, 68, 0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: playerInfoPopup.showCommunityData ? '#1FA2A6' : '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {playerInfoPopup.showCommunityData ? (
                      <Ionicons name="people" size={16} color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '700', fontStyle: 'italic' }}>i</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                    {playerInfoPopup.playerName}
                  </Text>
                  {playerInfoPopup.showCommunityData && (
                    <View style={{ backgroundColor: 'rgba(31, 162, 166, 0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#5EEAD4' }}>Topluluk</Text>
                    </View>
                  )}
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

                {/* Topluluk Verileri */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="people" size={18} color="#1FA2A6" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1FA2A6' }}>
                      Topluluk Tahminleri
                    </Text>
                  </View>
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
                            { label: '⏺️ Penaltı', value: playerInfoPopup.communityData.penalty, color: '#A855F7' },
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
              maxWidth: 380, // ✅ STANDART: 380px genişlik
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

              {/* Content - yüksek kontrast, okunaklı */}
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 16, color: '#F1F5F9', lineHeight: 24, marginBottom: 18, fontWeight: '500' }}>
                  Tahminleriniz başarıyla kaydedildi. Şimdi ne yapmak istersiniz?
                </Text>

                {/* Option 1: Topluluk veya gerçek verileri gör – görülürse maç kalıcı kilitlenir */}
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                  }}
                  onPress={() => {
                    setConfirmModal({
                      title: 'Emin misiniz?',
                      message: 'Topluluk veya gerçek verileri görürseniz bu maça ait tahminler kalıcı olarak kilitlenir. Tahminleriniz silinemez ve değiştirilemez. Kazara tıklamadıysanız devam edin.',
                      buttons: [
                        { text: 'Vazgeç', style: 'cancel', onPress: () => setConfirmModal(null) },
                        {
                          text: 'Evet, Gör',
                          onPress: async () => {
                            setConfirmModal(null);
                            setShowCommunityConfirmModal(false);
                            if (hasRealCommunityData) {
                              setHasViewedCommunityData(true);
                              setIndependentPredictionBonus(false);
                              onViewedCommunityData?.();
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
                              setPredictionViewIndex(1);
                              setThreeFieldActiveIndex(1);
                              setTimeout(() => {
                                mainScrollRef.current?.scrollToEnd({ animated: true });
                                threeFieldScrollRef.current?.scrollTo({ x: effectivePageWidth * 1, animated: true });
                              }, 300);
                            } else {
                              showInfo(
                                'Bu maç için henüz yeterli topluluk verisi yok',
                                'Topluluk verisi oluşturulmaya başladığı anda ortalamalar hesaplanacak ve topluluk sekmesinde görünecek. Tahminleriniz şu an düzenlenebilir.'
                              );
                            }
                          },
                        },
                      ],
                    });
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
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#60A5FA' }}>
                        Topluluk veya Gerçek Verileri Gör
                      </Text>
                      <Text style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4 }}>
                        Topluluk tahminleri veya gerçek kadro verilerini görün
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    marginTop: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="warning" size={16} color="#EF4444" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>
                        GERİ DÖNÜŞÜ YOK!
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#FECACA', lineHeight: 18 }}>
                      Topluluk veya gerçek verileri görürseniz bu maça ait tahminler kalıcı olarak kilitlenir. Tahminleriniz silinemez ve değiştirilemez; kadro seçiminiz dahil tüm tahminler donar.
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
                  onPress={async () => {
                    setShowCommunityConfirmModal(false);
                    setHasChosenIndependentAfterSave(true);
                    // ✅ Kilit açılmaz: Kayıttan hemen sonra kırmızı kilit ve "Tahminler Kilitli" görünsün. Düzenlemek için kullanıcı kilidi açabilir.
                    try {
                      const storageKey = predictionStorageKey || `${STORAGE_KEYS.PREDICTIONS}${matchData?.id}`;
                      const existingData = await AsyncStorage.getItem(storageKey);
                      if (existingData) {
                        const parsed = JSON.parse(existingData);
                        parsed.hasChosenIndependentAfterSave = true;
                        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
                      }
                    } catch (e) {
                      console.warn('Bağımsız mod durumu kaydedilemedi:', e);
                    }
                    setTimeout(() => mainScrollRef.current?.scrollToEnd({ animated: true }), 300);
                    // ✅ Şerit/toast bildirimi kaldırıldı – "Bağımsız Tahmin Modundasınız" metni sayfada zaten gösteriliyor
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
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#34D399' }}>
                        Bağımsız Devam Et
                      </Text>
                      <Text style={{ fontSize: 13, color: '#CBD5E1', marginTop: 4 }}>
                        Topluluk verilerini görmeden devam et
                      </Text>
                    </View>
                  </View>
                  <View style={{
                    marginTop: 10,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>
                        +%10 Bağımsız Tahmin Bonusu
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 17 }}>
                      Şimdi düzenle → Maç başlasın → Otomatik kilitle + Topluluk verileri açılır
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
                  <Ionicons name="information-circle" size={18} color="#94A3B8" style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 13, color: '#94A3B8', flex: 1, lineHeight: 19 }}>
                    Topluluk veya gerçek verileri görürseniz bu maça ait tahminler kalıcı kilitlenir; silinemez ve değiştirilemez. Bağımsız devam ederseniz maç başlayana kadar tüm tahminlerinizi düzenleyebilirsiniz.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ CANLI MAÇ REACTION MODAL - KİLİTLİ KURAL: Canlı/bitmiş maçta tüm kullanıcılar erişebilir */}
      {liveReactionPlayer && (isMatchLive || isMatchFinished) && (() => {
        const pId = liveReactionPlayer.id;
        const pName = liveReactionPlayer.name || '';
        const community = communityPredictions[pId];
        const isGK = (liveReactionPlayer.position || '').toUpperCase() === 'GK' || (liveReactionPlayer.position || '').toUpperCase() === 'G' || String(liveReactionPlayer.position || '').toLowerCase().includes('goalkeeper');
        
        // ✅ Oyuncunun maç içi performansını event'lerden çıkar
        const playerEvents = (liveEvents || []).filter((e: any) => {
          const eName = typeof e.player === 'object' ? e.player?.name : e.player;
          const aName = typeof e.assist === 'object' ? e.assist?.name : e.assist;
          return (eName && pName && eName.toLowerCase().includes(pName.split(' ').pop()?.toLowerCase() || '')) ||
                 (aName && pName && aName.toLowerCase().includes(pName.split(' ').pop()?.toLowerCase() || '')) ||
                 (e.player?.id === pId) || (e.assist?.id === pId);
        });
        
        const goals = playerEvents.filter((e: any) => (e.type || '').toLowerCase() === 'goal' && e.player?.id === pId && (e.detail || '').toLowerCase() !== 'own goal').length;
        const assists = playerEvents.filter((e: any) => (e.type || '').toLowerCase() === 'goal' && (e.assist?.id === pId || (typeof e.assist === 'object' && e.assist?.name?.toLowerCase().includes(pName.split(' ').pop()?.toLowerCase() || '')))).length;
        const yellowCards = playerEvents.filter((e: any) => (e.type || '').toLowerCase() === 'card' && (e.detail || '').toLowerCase().includes('yellow') && e.player?.id === pId).length;
        const redCards = playerEvents.filter((e: any) => (e.type || '').toLowerCase() === 'card' && (e.detail || '').toLowerCase().includes('red') && e.player?.id === pId).length;
        const wasSubbedOut = playerEvents.some((e: any) => ((e.type || '').toLowerCase() === 'subst' || (e.type || '').toLowerCase() === 'substitution') && e.player?.id === pId);
        const wasSubbedIn = liveReactionPlayer.isSubstitute === true;
        const subMinute = wasSubbedIn ? liveReactionPlayer.subMinute : playerEvents.find((e: any) => ((e.type || '').toLowerCase() === 'subst' || (e.type || '').toLowerCase() === 'substitution') && e.player?.id === pId)?.time?.elapsed;
        
        const hasPerformanceData = goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0 || wasSubbedOut || wasSubbedIn;
        
        const totalVotes = community ? Math.max(1, community.totalPredictions) : 0;
        // row1: Çok İyi/Kötü, row2: Gol Atar/Çıkmalı, row3: Sarı/Kırmızı Kart, row4: Maçın adamı
        const reactions = [
          { key: 'good', icon: '🔥', label: 'Çok İyi', color: '#10B981', count: community ? (community.goal + community.assist) : 0, pct: community ? Math.round((community.goal + community.assist) / totalVotes * 50) : 0 },
          { key: 'bad', icon: '👎', label: 'Kötü', color: '#EF4444', count: community ? community.substitutedOut : 0, pct: community ? Math.round(community.substitutedOut / totalVotes * 100) : 0 },
          { key: 'goal', icon: '⚽', label: isGK ? 'Gol Yer' : 'Gol Atar', color: '#3B82F6', count: community ? community.goal : 0, pct: community ? Math.round(community.goal / totalVotes * 100) : 0 },
          { key: 'sub', icon: '🔄', label: 'Çıkmalı', color: '#8B5CF6', count: community ? community.substitutedOut : 0, pct: community ? Math.round(community.substitutedOut / totalVotes * 100) : 0 },
          { key: 'yellowcard', icon: 'card', label: 'Sarı Kart', color: '#FBBF24', count: community ? community.yellowCard : 0, pct: community ? Math.round(community.yellowCard / totalVotes * 100) : 0 },
          { key: 'redcard', icon: 'card', label: 'Kırmızı Kart', color: '#DC2626', count: community ? community.redCard : 0, pct: community ? Math.round(community.redCard / totalVotes * 100) : 0 },
          { key: 'motm', icon: 'star', label: 'Maçın adamı', color: '#EAB308', count: 0, pct: 0 },
        ];
        return (
        <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 0 }} activeOpacity={1} onPress={() => setLiveReactionPlayer(null)}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '92%', maxWidth: 400, maxHeight: '90%', alignSelf: 'center' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} style={{ maxHeight: '100%' }}>
            <View style={{
              backgroundColor: '#0F1F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: 28, borderTopWidth: 2, borderColor: 'rgba(16,185,129,0.4)',
            }}>
              <View style={{ alignItems: 'center', marginBottom: hasPerformanceData ? 12 : 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#F1F5F9' }}>
                  {pName}
                </Text>
                <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '500' }}>
                  {isMatchFinished ? 'Maç Sonu Değerlendirme' : 'Canlı Değerlendirme'}
                </Text>
                <Text style={{ fontSize: 11, color: '#1FA2A6', marginTop: 6, fontWeight: '600' }}>
                  Canlı tahminler ve topluluk verileri
                </Text>
              </View>

              {/* ✅ OYUNCU MAÇ İÇİ PERFORMANSI - Event'lerden çıkarılan gerçek veriler */}
              {hasPerformanceData && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Maç Performansı</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {goals > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Text style={{ fontSize: 14 }}>⚽</Text>
                        <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: '700' }}>{goals} Gol</Text>
                      </View>
                    )}
                    {assists > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Text style={{ fontSize: 14 }}>👟</Text>
                        <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '700' }}>{assists} Asist</Text>
                      </View>
                    )}
                    {yellowCards > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <View style={{ width: 10, height: 14, borderRadius: 2, backgroundColor: '#FBBF24' }} />
                        <Text style={{ color: '#FBBF24', fontSize: 12, fontWeight: '700' }}>Sarı Kart</Text>
                      </View>
                    )}
                    {redCards > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(220,38,38,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <View style={{ width: 10, height: 14, borderRadius: 2, backgroundColor: '#DC2626' }} />
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Kırmızı Kart</Text>
                      </View>
                    )}
                    {wasSubbedOut && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Çıktı {subMinute ? `(${subMinute}')` : ''}</Text>
                      </View>
                    )}
                    {wasSubbedIn && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                        <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>Girdi {subMinute ? `(${subMinute}')` : ''}{liveReactionPlayer.substitutedFor ? ` ↔ ${liveReactionPlayer.substitutedFor.split(' ').pop()}` : ''}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {community && totalVotes > 0 ? (
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10, textAlign: 'center' }}>
                  {totalVotes.toLocaleString()} kişi bu oyuncu için tahmin yaptı · Tahminler arasındaki yüzdeler aşağıda
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10, textAlign: 'center' }}>
                  Henüz topluluk verisi yok · Aşağıdan oy verebilirsiniz
                </Text>
              )}
              {/* Eski görünüm: 6 kart tek grid, satır bazlı seçim (row1/row2/row3) */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                {reactions.map(reaction => {
                  const current = normalizeLiveReaction(liveReactions[pId]);
                  const isActive = (reaction.key === 'good' || reaction.key === 'bad') ? current.row1 === reaction.key
                    : (reaction.key === 'goal' || reaction.key === 'sub') ? current.row2 === reaction.key
                    : reaction.key === 'motm' ? current.row4 === 'motm'
                    : current.row3 === reaction.key;
                  const isCardIcon = reaction.icon === 'card';
                  const isYellow = reaction.key === 'yellowcard';
                  const onPress = () => {
                    if (reaction.key === 'good' || reaction.key === 'bad') {
                      setLiveReactions(prev => ({ ...prev, [pId]: { ...normalizeLiveReaction(prev[pId]), row1: (normalizeLiveReaction(prev[pId]).row1 === reaction.key ? undefined : reaction.key) as 'good'|'bad' } }));
                    } else if (reaction.key === 'goal' || reaction.key === 'sub') {
                      setLiveReactions(prev => ({ ...prev, [pId]: { ...normalizeLiveReaction(prev[pId]), row2: (normalizeLiveReaction(prev[pId]).row2 === reaction.key ? undefined : reaction.key) as 'goal'|'sub' } }));
                    } else if (reaction.key === 'motm') {
                      // Maçın adamı için tek oy: sadece bu oyuncuda motm kalsın, diğerlerinden kaldır
                      setLiveReactions(prev => {
                        const cur = normalizeLiveReaction(prev[pId]);
                        const setMotm = cur.row4 !== 'motm';
                        const next: typeof prev = {};
                        Object.keys(prev).forEach(pid => {
                          const numPid = Number(pid);
                          const r = normalizeLiveReaction(prev[numPid]);
                          if (numPid === pId) {
                            next[numPid] = { ...r, row4: setMotm ? 'motm' : undefined };
                          } else {
                            next[numPid] = r.row4 ? { ...r, row4: undefined } : prev[numPid];
                          }
                        });
                        if (setMotm && prev[pId] == null) next[pId] = { row4: 'motm' };
                        return next;
                      });
                    } else {
                      setLiveReactions(prev => ({ ...prev, [pId]: { ...normalizeLiveReaction(prev[pId]), row3: (normalizeLiveReaction(prev[pId]).row3 === reaction.key ? undefined : reaction.key) as 'yellowcard'|'redcard' } }));
                    }
                  };
                  const btnStyle = {
                    alignItems: 'center' as const,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: isActive ? `${reaction.color}25` : 'rgba(255,255,255,0.08)',
                    borderWidth: isActive ? 2.5 : 1,
                    borderColor: isActive ? reaction.color : 'rgba(255,255,255,0.12)',
                    minWidth: reaction.key === 'motm' ? undefined : 72,
                    flex: reaction.key === 'motm' ? 1 : undefined,
                    width: reaction.key === 'motm' ? '100%' as const : undefined,
                  };
                  const btnContent = (
                    <>
                      {reaction.key === 'motm' ? (
                        <Ionicons name="star" size={24} color={reaction.color} style={{ marginBottom: 4 }} />
                      ) : isCardIcon ? (
                        <View style={{ width: 22, height: 28, borderRadius: 3, backgroundColor: isYellow ? '#FBBF24' : '#DC2626', borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)', marginBottom: 4 }} />
                      ) : (
                        <Text style={{ fontSize: 24, marginBottom: 2 }}>{reaction.icon}</Text>
                      )}
                      <Text style={{ fontSize: 11, color: reaction.color, fontWeight: '700' }}>{reaction.label}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '600' }}>{reaction.count} kişi</Text>
                      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 0, fontWeight: '600' }}>%{reaction.pct} (tahminler arası)</Text>
                    </>
                  );
                  if (reaction.key === 'motm') {
                    return (
                      <View key={reaction.key} style={{ width: '100%', marginTop: 4 }}>
                        <Animated.View style={{ transform: [{ scale: motmScaleAnim }] }}>
                          <TouchableOpacity
                            style={btnStyle}
                            onPress={onPress}
                            activeOpacity={0.7}
                          >
                            {btnContent}
                          </TouchableOpacity>
                        </Animated.View>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={reaction.key}
                      style={btnStyle}
                      onPress={onPress}
                      activeOpacity={0.7}
                    >
                      {btnContent}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {normalizeLiveReaction(liveReactions[pId]).row2 === 'sub' && (() => {
                const isPlayerGK = (p: any) => {
                  const pos = String(p?.position || '').toUpperCase();
                  return pos === 'GK' || pos === 'G' || pos.includes('GOALKEEPER');
                };
                const targetTeamId = effectivePredictionTeamId ?? predictionTeamId ?? matchData?.homeTeam?.id;
                const substitutedInIds = new Set<number>();
                if (liveEvents && liveEvents.length > 0 && targetTeamId) {
                  for (const e of liveEvents) {
                    const t = (e.type || '').toLowerCase();
                    if (t === 'subst' || t === 'substitution') {
                      if (e.team?.id === targetTeamId) {
                        const playerIn = e.assist ?? e.substitute;
                        const id = typeof playerIn === 'object' ? playerIn?.id : null;
                        if (id) substitutedInIds.add(Number(id));
                      }
                    }
                  }
                }
                const eligibleSubs = reserveTeamPlayers.filter((p: any) => {
                  if (!p || p.id === pId) return false;
                  if (substitutedInIds.has(Number(p.id))) return false;
                  if (isGK) return isPlayerGK(p);
                  return !isPlayerGK(p);
                });
                // Topluluk "yerine X girmeli" yüzdesi (API'den substituteVotePct doldurulacak)
                const substituteVotePct: Record<number, number> = {};
                const maxSubPct = eligibleSubs.length > 0 ? Math.max(...eligibleSubs.map((s: any) => substituteVotePct[s.id] ?? 0)) : 0;
                const isTopSub = (subId: number) => maxSubPct > 0 && (substituteVotePct[subId] ?? 0) === maxSubPct;
                return (
                <View style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' }}>
                  <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '600', marginBottom: 8 }}>Yerine kim girmeli?</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 8 }}
                    style={{ marginHorizontal: -4 }}
                  >
                    {eligibleSubs.map((sub: any) => {
                      const pct = substituteVotePct[sub.id] ?? 0;
                      const top = isTopSub(sub.id);
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 8,
                            minWidth: 72,
                            alignItems: 'center',
                            marginRight: 8,
                            backgroundColor: top ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.08)',
                            borderWidth: top ? 2 : 0,
                            borderColor: top ? '#10B981' : 'transparent',
                          }}
                          onPress={() => {
                            setLiveReactions(prev => ({ ...prev, [pId]: { ...normalizeLiveReaction(prev[pId]), row2: 'sub' } }));
                            setLiveReactionPlayer(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: top ? '#34D399' : '#E2E8F0', fontSize: 11, fontWeight: '600' }}>{sub.name?.split(' ').pop()}</Text>
                          <Text style={{ color: top ? '#6EE7B7' : '#94A3B8', fontSize: 9, marginTop: 4, fontWeight: '500' }}>
                            %{pct} girmeli
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                );
              })()}
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: 'rgba(148,163,184,0.5)',
                }}
                onPress={() => setLiveReactionPlayer(null)}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#64748B', fontSize: 13 }}>Kapat</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
        );
      })()}

    </View>
  );
};


/* PlayerPredictionModal extracted to ./PlayerPredictionModal.tsx - see import above */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Grid pattern görünsün - MatchDetail'den geliyor
    maxWidth: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    maxWidth: '100%',
  },
  // ✅ Tek scroll için dış wrapper: 3 saha + alttaki tüm içerik (sekmeler, Maça ait tahminler)
  scrollContentOuter: {
    paddingBottom: 12,
    maxWidth: '100%',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 12, // ✅ Kadro mainContainer ile birebir aynı – sekme geçişinde sıçrama yok
    maxWidth: '100%',
  },

  // Multi-Field Container - Saha + spacer (3 nokta) + fieldBelowContent; alttan kesilmesin
  multiFieldContainer: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'visible',
    marginBottom: 0,
  },
  multiFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  multiFieldTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  multiFieldLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  multiFieldLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  multiFieldLiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  multiFieldFinishedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  multiFieldFinishedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  multiFieldTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  multiFieldTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  multiFieldTabEmoji: {
    fontSize: 12,
  },
  multiFieldTabText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  multiFieldScrollContent: {
    // Her saha ortada durması için padding (ekran genişliği - saha genişliği) / 2
    paddingHorizontal: isWeb ? (500 - PITCH_LAYOUT.WEB_MAX_WIDTH) / 2 : (width - (width - PITCH_LAYOUT.H_PADDING)) / 2,
    // ✅ Web/mobil: Sahaların yan yana gelmesi için flexDirection row (alt alta gelme sorunu)
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  // ✅ Kadro mainContainer ile aynı: paddingHorizontal 12 – saha ortalı, kesilmeden tam görünsün
  multiFieldWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    overflow: 'visible',
  },
  multiFieldWrapperKadroMatch: {},
  // ✅ Kadro ile aynı üst boşluk için fixedSection 0; wrapper'da paddingTop 8 (toplam 8px – sıçrama kalmasın)
  multiFieldFixedSection: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  // ✅ 3 nokta: sahanın 5px altında, çizgi/şerit yok (backgroundColor kaldırıldı)
  multiFieldPageIndicatorsFixed: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 24,
  },
  // Formasyon etiketi (saha sağ alt - Atak/Defans üst üste)
  fieldFormationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fieldFormationBadgeStack: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  fieldFormationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldFormationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    minWidth: 44,
  },
  fieldFormationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ✅ Saha içi başlık (sol alt köşe overlay)
  fieldInnerLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  fieldInnerLabelText: {
    fontSize: 10,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  fieldInnerLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
    marginLeft: 4,
  },
  fieldInnerLiveText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Canlı göstergesi (saha üstünde)
  fieldLiveIndicator: {
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
  fieldLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  fieldLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // 3 nokta: saha ile konteyner arasında
  multiFieldPageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  multiFieldPageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  multiFieldPageDotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#1FA2A6',
  },
  // ✅ 3 konteyner: saha altında; ~%20 kısaltıldı, iç kutular 40px
  fieldBelowContent: {
    marginTop: 2,
    paddingHorizontal: 0,
    width: '100%',
    minHeight: 48,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  fieldBelowSection: {
    backgroundColor: '#1E3A3A',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    height: 40,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldBelowSectionTeamPerf: {
    height: 40,
    minHeight: 40,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  fieldBelowSectionTeamPerfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
  },
  fieldBelowSectionLabel: {
    marginRight: 10,
    justifyContent: 'center',
    minWidth: 32,
  },
  fieldBelowSectionBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    gap: 2,
    minWidth: 0,
  },
  teamPerfButton: {
    flex: 1,
    minWidth: 0,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityAvgLine: {
    position: 'absolute',
    marginLeft: -2,
    width: 4,
    height: 22,
    borderRadius: 2,
    top: 0,
  },
  communityAvgLabelInline: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 6,
    flexShrink: 0,
  },
  communityStatsCardInner: {
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
    minHeight: 28,
  },
  communityStatsRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    minHeight: 36,
    flexWrap: 'nowrap',
  },
  communityStatsChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(31, 162, 166, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  communityStatsChipValue: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  communityStatsChipLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '400',
    marginTop: 0,
  },
  communityStatsLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  communityStatsUserCount: {
    color: '#1FA2A6',
    fontSize: 15,
    fontWeight: '700',
  },
  communityStatsUserLabel: {
    color: '#6B7280',
    fontSize: 9,
    marginTop: 0,
  },
  communityStatsRight: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 2,
    justifyContent: 'center',
  },
  communityStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 4,
  },
  communityStatsRowLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    width: 42,
  },
  communityStatsRowValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  fieldBelowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldBelowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  fieldBelowBtnPrimary: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  fieldBelowBtnLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  fieldBelowBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  fieldBelowHint: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  fieldBelowStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fieldBelowStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  fieldBelowStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldBelowStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  fieldBelowStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  fieldBelowLiveEvents: {
    gap: 8,
  },
  fieldBelowLiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldBelowLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  fieldBelowLiveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fieldBelowEventsScroll: {
    flexGrow: 0,
  },
  fieldBelowEventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  fieldBelowEventText: {
    fontSize: 10,
    color: '#E5E7EB',
    maxWidth: 80,
  },
  fieldBelowNoEvents: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ✅ 3 Saha başlıkları satırı
  threeFieldTitlesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  threeFieldTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  threeFieldTitleBadgeActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderColor: 'rgba(31, 162, 166, 0.4)',
  },
  threeFieldTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  threeFieldTitleTextActive: {
    color: '#1FA2A6',
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
  // ✅ Kadro ile birebir aynı: padding yok, yüzde konumlar aynı sahada (sıçrama/boşluk farkı olmasın)
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
  horizontalFieldScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PITCH_LAYOUT.H_PADDING / 2,
  },
  fieldCenterContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: PITCH_LAYOUT.H_PADDING / 2,
    marginBottom: 0,
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
  // ✅ KIRMIZI DAİRE İÇİNDE "i" BUTONU - Oyuncu kartının sağ üst köşesi
  predictionCardInfoIconRed: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 15,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
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
  // ✅ Kadro sekmesi ile birebir aynı (64x76, overflow: hidden, aynı gölge)
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
      web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)' },
    }),
  },
  playerCardElite: {
    borderColor: '#C9A44C',
    borderWidth: 2.5,
    ...Platform.select({
      ios: { shadowColor: '#C9A44C', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0 0 12px rgba(201, 164, 76, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)' },
    }),
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
  // ✅ Kadro ile aynı: padding 4, paddingBottom 18, gap 1
  playerCardGradient: {
    flex: 1,
    padding: 4,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1,
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
  playerCardWrapper: {
    position: 'relative',
    width: 64,
    height: 76,
  },
  liveReactionBadgeOuter: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A1A1A',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
    elevation: 12,
  },
  // Tahmin yapılan oyuncu kartının arkasında hafif sarı hale (eskisi gibi daha yumuşak)
  predictionGlowBehind: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 0 10px rgba(245, 158, 11, 0.35)' },
    }),
  },
  jerseyNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 1,
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
  // ✅ Tahmin yapıldı tik - sol üst (sağdaki "i" ile üst üste binmesin)
  predictionCheckBadgeTopLeft: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
    elevation: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2 },
      android: { elevation: 6 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.4)' },
    }),
  },
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
  playerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  playerCardRating: {
    fontSize: 10,
    fontWeight: '800',
  },
  playerCardPosition: {
    fontSize: 9,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  playerPosition: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    minHeight: 40,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: '#263E3C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
  },
  infoText: {
    fontSize: 11,
    color: '#E6E6E6',
    flex: 1,
    flexShrink: 1,
  },
  // Konteyner bilgi metni – ortalı, okunaklı
  fieldBelowNoteText: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
    flexShrink: 1,
    textAlign: 'center',
  },
  
  // Prediction View Tabs
  predictionViewTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  predictionViewTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  predictionViewTabText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  disciplineColumnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  disciplineColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  disciplineColumnTotalBadge: {
    fontSize: 14,
    fontWeight: '700',
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
  
  // ✅ Tahmin Toolbar (Kilit + Kaydet) – daha yumuşak görünüm
  predictionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 18,
    paddingHorizontal: 18,
  },
  predictionLockButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionLockButtonLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  predictionLockButtonOpen: {
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 191, 0.45)',
  },
  // Submit Button – daha az kaba, teal tonları
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
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
  
  // Player Modal - Kompakt tasarım
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  playerModalContent: {
    backgroundColor: '#1E3A3A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    width: 380,
    maxWidth: 380,
    maxHeight: (height * 0.9),
    alignSelf: 'center',
  },
  playerModalHeader: {
    padding: 10,
    paddingBottom: 8,
  },
  tahminYapilanOyuncuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.3)',
  },
  tahminYapilanOyuncuText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    zIndex: 10,
  },
  playerModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerNumberLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerRatingCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  playerRatingSmall: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F2A24',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameLarge: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerPositionModal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 1,
  },
  formText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  
  // Player Predictions - Kompakt
  playerPredictionsScroll: {
    flex: 1,
    minHeight: 0,
  },
  playerPredictionsContent: {
    padding: 10,
    gap: 4,
    paddingBottom: 10,
  },
  // Penaltı/Kart bölümü başlıkları - daha kompakt
  penaltySectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  penaltySectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  penaltySectionTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predictionGroup: {
    gap: 3,
  },
  predictionButton: {
    height: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  predictionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  predictionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionButtonTextActive: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  predictionButtonDisabled: {
    opacity: 0.9,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  predictionButtonTextDisabled: {
    opacity: 0.9,
  },
  predictionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subOptions: {
    paddingLeft: 8,
    gap: 2,
  },
  subOptionsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  subOptionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  subOptionButton: {
    flex: 1,
    height: 28,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 6,
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
  // Grid butonları - Penaltı ve Kart için
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    paddingVertical: 4,
  },
  gridButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  gridButtonEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  gridButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gridButtonTextActive: {
    fontWeight: 'bold',
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
  
  // Player Modal Actions - Kompakt
  playerModalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.2)',
    backgroundColor: '#1E3A3A',
  },
  cancelButton: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButtonTextLocked: {
    fontSize: 13,
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
});
