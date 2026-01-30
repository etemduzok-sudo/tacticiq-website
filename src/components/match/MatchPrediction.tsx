// MatchPredictionScreen.tsx - React Native FULL COMPLETE VERSION
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
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
import { SCORING, TEXT, STORAGE_KEYS } from '../../config/constants';
import { handleError, ErrorType, ErrorSeverity } from '../../utils/GlobalErrorHandler';
import { predictionsDb } from '../../services/databaseService';
import { ConfirmModal, ConfirmButton } from '../ui/ConfirmModal';
import { ANALYSIS_FOCUSES, type AnalysisFocus, type AnalysisFocusType } from '../AnalysisFocusModal';

// 🌟 Her analiz odağının kapsadığı tahmin kategorileri
// Bir kategori SADECE BİR odağa ait olabilir (karşılıklı dışlama)
const FOCUS_CATEGORY_MAPPING: Record<AnalysisFocusType, string[]> = {
  defense: ['yellowCards', 'redCards'], // Savunma: Sarı/kırmızı kartlar
  offense: ['firstHalfHomeScore', 'firstHalfAwayScore', 'secondHalfHomeScore', 'secondHalfAwayScore', 'totalGoals', 'firstGoalTime', 'goal'], // Hücum: Skorlar, goller
  midfield: ['assist', 'possession'], // Orta saha: Asistler, top hakimiyeti
  physical: ['firstHalfInjuryTime', 'secondHalfInjuryTime'], // Fiziksel: Uzatma süreleri
  tactical: ['tempo', 'scenario'], // Taktik: Maç temposu, senaryo
  player: ['substitutedOut', 'injuredOut', 'substitutePlayer', 'injurySubstitutePlayer'], // Oyuncu: Değişiklikler
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
const PLAYER_RELATED_CATEGORIES = ['goal', 'assist', 'yellowCards', 'redCards', 'substitutedOut', 'injuredOut', 'substitutePlayer', 'injurySubstitutePlayer'];

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
  // Web'de basit bir input range kullan
  Slider = ({ value, onValueChange, minimumValue, maximumValue, step, ...props }: any) => {
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
          height: 4,
          borderRadius: 2,
          outline: 'none',
          ...props.style,
        }}
      />
    );
  };
} else {
  Slider = SliderNative;
}

const { width, height } = Dimensions.get('window');

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
        <Rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Circle cx="50" cy="75" r="1" fill="white" opacity="0.3" />
        <Rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Circle cx="50" cy="17.3" r="0.8" fill="white" opacity="0.3" />
        <Rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <Circle cx="50" cy="132.7" r="0.8" fill="white" opacity="0.3" />
        <Path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
        <Path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
        <Path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
        <Path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
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
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [playerPredictions, setPlayerPredictions] = useState<{[key: number]: any}>({});

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
  const squadStorageKey = React.useMemo(
    () => (matchId && predictionTeamId != null ? `fan-manager-squad-${matchId}-${predictionTeamId}` : matchId ? `fan-manager-squad-${matchId}` : null),
    [matchId, predictionTeamId]
  );
  const predictionStorageKey = React.useMemo(
    () => (matchData?.id && predictionTeamId != null ? `${STORAGE_KEYS.PREDICTIONS}${matchData.id}-${predictionTeamId}` : matchData?.id ? `${STORAGE_KEYS.PREDICTIONS}${matchData.id}` : null),
    [matchData?.id, predictionTeamId]
  );

  // ✅ Load attack squad from AsyncStorage
  const [attackPlayersArray, setAttackPlayersArray] = useState<any[]>([]);
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [squadLoaded, setSquadLoaded] = useState(false);
  const [isSquadCompleted, setIsSquadCompleted] = useState(false); // ✅ Tamamla basıldı mı?
  
  // 🌟 STRATEGIC FOCUS SYSTEM
  const [selectedAnalysisFocus, setSelectedAnalysisFocus] = useState<AnalysisFocusType | null>(null);
  const [focusedPredictions, setFocusedPredictions] = useState<FocusPrediction[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    buttons: ConfirmButton[];
  } | null>(null);
  // Load squad data on mount – Kadro tamamlandıysa (isCompleted) atak/defans hiç boş gelmemeli
  React.useEffect(() => {
    const loadSquad = async () => {
      try {
        const key = squadStorageKey;
        if (!key) { setSquadLoaded(true); return; }
        const squadData = await AsyncStorage.getItem(key);
        if (squadData) {
          const parsed = JSON.parse(squadData);
          if (parsed.isCompleted === true) {
            let arr: any[] = [];
            if (parsed.attackPlayersArray && Array.isArray(parsed.attackPlayersArray) && parsed.attackPlayersArray.length >= 11) {
              arr = parsed.attackPlayersArray;
            } else if (parsed.attackPlayers && typeof parsed.attackPlayers === 'object') {
              arr = Object.values(parsed.attackPlayers).filter(Boolean);
            }
            if (arr.length >= 11) {
              setAttackPlayersArray(arr);
              setAttackFormation(parsed.attackFormation || null);
              setIsSquadCompleted(true);
            }
          }
          setSquadLoaded(true);
        } else {
          setSquadLoaded(true);
        }
      } catch (error) {
        console.error('Error loading squad:', error);
        setSquadLoaded(true);
      }
    };
    loadSquad();
  }, [squadStorageKey]);

  React.useEffect(() => {
    if (__DEV__) console.log('📌 MatchPrediction mounted (build: focus+confirm+tamamla-fix)');
  }, []);

  // Match predictions state - COMPLETE
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
        const altKey = predictionTeamId != null ? `fan-manager-predictions-${matchData?.id}-${predictionTeamId}` : `fan-manager-predictions-${matchData?.id}`;
        const data = await AsyncStorage.getItem(predictionStorageKey) || await AsyncStorage.getItem(altKey);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.matchPredictions) setPredictions(prev => ({ ...prev, ...parsed.matchPredictions }));
        if (parsed.playerPredictions && typeof parsed.playerPredictions === 'object') setPlayerPredictions(parsed.playerPredictions);
        if (Array.isArray(parsed.focusedPredictions)) setFocusedPredictions(parsed.focusedPredictions);
        if (parsed.selectedAnalysisFocus) setSelectedAnalysisFocus(parsed.selectedAnalysisFocus);
      } catch (_) {}
    };
    load();
  }, [predictionStorageKey, matchData?.id, predictionTeamId]);

  const handlePlayerPredictionChange = (category: string, value: string | boolean) => {
    if (!selectedPlayer) return;
    
    setPlayerPredictions(prev => {
      const currentPredictions = prev[selectedPlayer.id] ?? prev[String(selectedPlayer.id)] ?? {};
      const newPredictions = {
        ...currentPredictions,
        [category]: currentPredictions[category] === value ? null : value
      };
      
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
    try {
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


        // Execute all database saves
        const results = await Promise.allSettled(predictionPromises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ Predictions saved: ${successCount} success, ${failCount} failed`);
        
        if (failCount > 0) {
          console.warn('⚠️ Some predictions failed to save to database, but local backup is available');
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        handleError(dbError as Error, {
          type: ErrorType.DATABASE,
          severity: ErrorSeverity.MEDIUM,
          context: { matchId: matchData.id, action: 'save_predictions' },
        });
        // Continue even if database save fails (we have local backup)
      }
      
      Alert.alert(
        'Tahminler Kaydedildi! 🎉',
        'Tahminleriniz başarıyla kaydedildi. Maç başladığında puanlarınız hesaplanacak!',
        [{ text: 'Tamam' }]
      );
      // ✅ MatchDetail'da yıldızı güncelle
      onPredictionsSaved?.();
      // ✅ İki favori maçta diğer takım teklifi için hangi takım kaydedildi
      if (predictionTeamId != null) onPredictionsSavedForTeam?.(predictionTeamId);
    } catch (error) {
      console.error('Error saving predictions:', error);
      handleError(error as Error, {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.HIGH,
        context: { matchId: matchData.id, action: 'save_predictions' },
      });
      Alert.alert('Hata!', 'Tahminler kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handlePredictionChange = (category: string, value: string | number) => {
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Football Field with Players – Kadro sekmesindeki saha ile aynı boyut */}
        <FootballField style={styles.mainField}>
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

                return (
                  <View
                    key={player ? `prediction-player-${player.id}-${index}` : `prediction-slot-${index}`} // ✅ Stable key - sıçramayı önler
                    style={[
                      styles.playerSlot,
                      { left: `${pos.x}%`, top: `${pos.y}%` }, // ✅ Sabit pozisyon
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.playerCard,
                        hasPredictions && styles.playerCardPredicted,
                        player.rating >= 85 && styles.playerCardElite,
                        player.position === 'GK' && styles.playerCardGK,
                      ]}
                      onPress={() => setSelectedPlayer(player)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#1E3A3A', '#0F2A24']}
                        style={styles.playerCardGradient}
                      >
                        {hasPredictions && (
                          <View style={styles.predictionCheckBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                        {hasSubstitution && (
                          <View style={styles.substitutionBadge}>
                            <Ionicons name="swap-horizontal" size={10} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={styles.jerseyNumberBadge}>
                          <Text style={styles.jerseyNumberText}>
                            {player.number || player.id}
                          </Text>
                        </View>
                        <Text style={styles.playerName} numberOfLines={1}>
                          {player.name.split(' ').pop()}
                        </Text>
                        <View style={styles.playerBottomRow}>
                          <Text style={styles.playerRatingBottom}>{player.rating}</Text>
                          <Text style={styles.playerPositionBottom}>{positionLabel}</Text>
                        </View>
                        {hasPredictions && <View style={styles.predictionGlow} />}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                );
              }).filter(Boolean);
            })()}
          </View>
        </FootballField>

        {/* ✅ Bildirim: Oyuncu kartlarına tıklayın ve aşağı kaydırın – her zaman gösterilir */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>
            Tahmin yapmak için oyuncu kartlarına tıklayın ve aşağı kaydırın
          </Text>
        </View>

        {/* PREDICTION CATEGORIES - COMPLETE */}
        <View style={styles.predictionsSection}>
          {/* Maça ait tahminler – İlk yarı skoru */}
          <View style={styles.predictionCategory}>
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View>
                  <Text style={styles.categoryLabel}>⚽ İlk Yarı Skoru</Text>
                </View>
                <View style={[styles.focusButtonWrap, { pointerEvents: 'box-none' }]} collapsable={false}>
                  <Pressable
                    onPress={() => toggleFocus('firstHalfHomeScore')}
                    style={({ pressed }) => [styles.focusButton, pressed && styles.focusButtonPressed]}
                    hitSlop={16}
                    accessibilityLabel="Odak yıldızı (ilk yarı ev sahibi gol)"
                  >
                    <Ionicons
                      name={isFocused('firstHalfHomeScore') ? 'star' : 'star-outline'}
                      size={24}
                      color={isFocused('firstHalfHomeScore') ? '#F59E0B' : '#6B7280'}
                    />
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.scorePickerContainer}>
                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Ev Sahibi Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.firstHalfHomeScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('firstHalfHomeScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.firstHalfHomeScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.scoreSeparator}>
                  <Text style={styles.scoreSeparatorText}>-</Text>
                </View>

                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Deplasman Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.firstHalfAwayScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('firstHalfAwayScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.firstHalfAwayScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* İlk Yarı Uzatma Süresi - İlk yarı skoru altında */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>⏱️ İlk Yarı Uzatma Süresi</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('firstHalfInjuryTime')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('firstHalfInjuryTime') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('firstHalfInjuryTime') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              {(() => {
                const row1 = ['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5 dk'];
                const row2 = ['+6 dk', '+7 dk', '+8 dk', '+9 dk', '+10 dk'];
                return (
                  <View style={styles.injuryTimeGrid}>
                    <View style={styles.injuryTimeRow}>{row1.map((time) => {
                      const isSelected = predictions.firstHalfInjuryTime === time;
                      return (
                        <TouchableOpacity key={time} style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, styles.injuryTimeButtonPadding, isSelected && styles.minuteRangeButtonCompactSelected]} onPress={() => handlePredictionChange('firstHalfInjuryTime', time)} activeOpacity={0.7}>
                          <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>{time.replace(' dk', '')}</Text>
                          {isSelected && <View style={styles.minuteRangeCheckmark}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>}
                        </TouchableOpacity>
                      );
                    })}</View>
                    <View style={styles.injuryTimeRow}>{row2.map((time) => {
                      const isSelected = predictions.firstHalfInjuryTime === time;
                      return (
                        <TouchableOpacity key={time} style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, styles.injuryTimeButtonPadding, isSelected && styles.minuteRangeButtonCompactSelected]} onPress={() => handlePredictionChange('firstHalfInjuryTime', time)} activeOpacity={0.7}>
                          <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>{time.replace(' dk', '')}</Text>
                          {isSelected && <View style={styles.minuteRangeCheckmark}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>}
                        </TouchableOpacity>
                      );
                    })}</View>
                  </View>
                );
              })()}
            </View>

          </View>

          {/* 2. Maç Sonu Tahminleri */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⚽ Maç Sonu Tahminleri</Text>
            
            {/* Maç Sonu Skoru - İlk yarı skorunun altı seçilemez (en az ilk yarı kadar olmalı) */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>⚽ Maç Sonu Skoru</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('fullTimeHomeScore')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('fullTimeHomeScore') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('fullTimeHomeScore') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.scorePickerContainer}>
                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Ev Sahibi Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => {
                      const minHome = predictions.firstHalfHomeScore ?? 0;
                      const isDisabled = score < minHome;
                      return (
                        <TouchableOpacity
                          key={score}
                          style={[
                            styles.scoreButton,
                            predictions.secondHalfHomeScore === score && styles.scoreButtonActive,
                            isDisabled && styles.scoreButtonDisabled
                          ]}
                          onPress={() => !isDisabled && handleScoreChange('secondHalfHomeScore', score)}
                          activeOpacity={0.7}
                          disabled={isDisabled}
                        >
                          <Text style={[
                            styles.scoreButtonText,
                            predictions.secondHalfHomeScore === score && styles.scoreButtonTextActive,
                            isDisabled && styles.scoreButtonTextDisabled
                          ]}>
                            {score === 5 ? '5+' : score}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.scoreSeparator}>
                  <Text style={styles.scoreSeparatorText}>-</Text>
                </View>

                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Deplasman Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => {
                      const minAway = predictions.firstHalfAwayScore ?? 0;
                      const isDisabled = score < minAway;
                      return (
                        <TouchableOpacity
                          key={score}
                          style={[
                            styles.scoreButton,
                            predictions.secondHalfAwayScore === score && styles.scoreButtonActive,
                            isDisabled && styles.scoreButtonDisabled
                          ]}
                          onPress={() => !isDisabled && handleScoreChange('secondHalfAwayScore', score)}
                          activeOpacity={0.7}
                          disabled={isDisabled}
                        >
                          <Text style={[
                            styles.scoreButtonText,
                            predictions.secondHalfAwayScore === score && styles.scoreButtonTextActive,
                            isDisabled && styles.scoreButtonTextDisabled
                          ]}>
                            {score === 5 ? '5+' : score}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Maç Sonu Uzatma Süresi - Maç sonu skoru altında (sadece ikinci yarı) */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>⏱️ Maç Sonu Uzatma Süresi</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('secondHalfInjuryTime')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('secondHalfInjuryTime') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('secondHalfInjuryTime') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              {(() => {
                const row1 = ['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5 dk'];
                const row2 = ['+6 dk', '+7 dk', '+8 dk', '+9 dk', '+10 dk'];
                return (
                  <View style={styles.injuryTimeGrid}>
                    <View style={styles.injuryTimeRow}>{row1.map((time) => {
                      const isSelected = predictions.secondHalfInjuryTime === time;
                      return (
                        <TouchableOpacity key={time} style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, styles.injuryTimeButtonPadding, isSelected && styles.minuteRangeButtonCompactSelected]} onPress={() => handlePredictionChange('secondHalfInjuryTime', time)} activeOpacity={0.7}>
                          <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>{time.replace(' dk', '')}</Text>
                          {isSelected && <View style={styles.minuteRangeCheckmark}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>}
                        </TouchableOpacity>
                      );
                    })}</View>
                    <View style={styles.injuryTimeRow}>{row2.map((time) => {
                      const isSelected = predictions.secondHalfInjuryTime === time;
                      return (
                        <TouchableOpacity key={time} style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, styles.injuryTimeButtonPadding, isSelected && styles.minuteRangeButtonCompactSelected]} onPress={() => handlePredictionChange('secondHalfInjuryTime', time)} activeOpacity={0.7}>
                          <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>{time.replace(' dk', '')}</Text>
                          {isSelected && <View style={styles.minuteRangeCheckmark}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>}
                        </TouchableOpacity>
                      );
                    })}</View>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* 3. Toplam Gol Sayısı - başlık ve yıldız konteyner dışında */}
          <View style={styles.predictionCategory}>
            <View style={styles.categoryTitleRow}>
              <Text style={styles.categoryTitle}>🧮 Toplam Gol Sayısı</Text>
              <Pressable
                onPress={() => showFocusExplanationModal('totalGoals')}
                style={({ pressed }) => [styles.focusButton, pressed && styles.focusButtonPressed]}
                hitSlop={16}
                accessibilityLabel="Tahmin odağı (toplam gol) – açıklama ve değiştir"
              >
                <Ionicons
                  name={isFocused('totalGoals') ? 'star' : 'star-outline'}
                  size={24}
                  color={isFocused('totalGoals') ? '#F59E0B' : '#6B7280'}
                />
              </Pressable>
            </View>
            <View style={styles.categoryCard}>
              <View style={styles.buttonRow}>
                {TOTAL_GOALS_RANGES.map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      effectiveTotalGoals === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalGoals', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      effectiveTotalGoals === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 4. İlk Gol Zamanı - Kompakt Grid */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⏰ İlk Gol Zamanı</Text>
            
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>⏰ İlk Gol Zamanı</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('firstGoalTime')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('firstGoalTime') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('firstGoalTime') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.firstGoalTimeGrid}>
                {(() => {
                  const row1 = MATCH_TIME_RANGES.slice(0, 4);
                  const row2 = MATCH_TIME_RANGES.slice(4, 8);
                  return (
                    <>
                      <View style={styles.injuryTimeRow}>
                        {row1.map((range) => {
                          const isSelected = predictions.firstGoalTime === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => handlePredictionChange('firstGoalTime', range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>
                                {range.label}
                              </Text>
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.injuryTimeRow}>
                        {row2.map((range) => {
                          const isSelected = predictions.firstGoalTime === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.injuryTimeButton, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => handlePredictionChange('firstGoalTime', range.value)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, styles.injuryTimeButtonText, isSelected && styles.minuteRangeTextCompactSelected]} numberOfLines={1}>
                                {range.label}
                              </Text>
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>

          {/* 5. Disiplin Tahminleri */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🟨🟥 Disiplin Tahminleri</Text>
            
            {/* Toplam Sarı Kart */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>🟨 Toplam Sarı Kart Sayısı</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('yellowCards')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('yellowCards') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('yellowCards') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.buttonRow}>
                {['0-2', '3-4', '5-6', '7+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.yellowCards === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('yellowCards', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.yellowCards === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toplam Kırmızı Kart */}
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>🟥 Toplam Kırmızı Kart Sayısı</Text>
                <TouchableOpacity 
                  onPress={() => showFocusExplanationModal('redCard')}
                  style={styles.focusButton}
                >
                  <Ionicons 
                    name={isFocused('redCard') ? 'star' : 'star-outline'}
                    size={24} 
                    color={isFocused('redCard') ? '#F59E0B' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.buttonRow}>
                {['0', '1', '2', '3+'].map((count) => (
                  <TouchableOpacity 
                    key={count} 
                    style={[
                      styles.optionButton,
                      predictions.redCards === count && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('redCards', count)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.redCards === count && styles.optionTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 6. Oyun Kontrolü - Topa Sahip Olma */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>📊 Oyun Kontrolü – Topa Sahip Olma</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🔵 Ev Sahibi / Deplasman Topa Sahip Olma (%)</Text>
              
              {/* Display Values */}
              <View style={styles.possessionDisplay}>
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>Ev Sahibi</Text>
                  <Text style={styles.possessionTeamValue}>
                    {predictions.possession}%
                  </Text>
                </View>
                
                <Text style={styles.possessionVs}>vs</Text>
                
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>Deplasman</Text>
                  <Text style={styles.possessionTeamValue}>
                    {100 - parseInt(predictions.possession)}%
                  </Text>
                </View>
              </View>

              {/* Slider */}
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={30}
                  maximumValue={70}
                  step={5}
                  value={parseInt(predictions.possession)}
                  onValueChange={(value) => handlePredictionChange('possession', value.toString())}
                  minimumTrackTintColor="#1FA2A6"
                  maximumTrackTintColor="rgba(100, 116, 139, 0.3)"
                  thumbTintColor="#FFFFFF"
                />
                
                {/* Labels */}
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelLeft}>← Ev Sahibi Üstünlüğü</Text>
                  <Text style={styles.sliderLabelRight}>Deplasman Üstünlüğü →</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 7. Toplam ve İsabetli Şut Sayıları */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🎯 Toplam ve İsabetli Şut Sayıları</Text>
            
            {/* Toplam Şut Sayısı */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⚽ Toplam Şut Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-10', '11-20', '21-30', '31+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.totalShots === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalShots', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.totalShots === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* İsabetli Şut Sayısı */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🎯 İsabetli Şut Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-5', '6-10', '11-15', '16+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.shotsOnTarget === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('shotsOnTarget', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.shotsOnTarget === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 8. Toplam Korner Aralığı */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⚽ Toplam Korner Aralığı</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🚩 Toplam Korner Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-6', '7-12', '12+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.totalCorners === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalCorners', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.totalCorners === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 9. Maçın Genel Temposu */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⚡ Maçın Genel Temposu</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🏃‍♂️ Oyun Hızı / Tempo</Text>
              <View style={styles.buttonRow}>
                {['Düşük tempo', 'Orta tempo', 'Yüksek tempo'].map((tempo) => (
                  <TouchableOpacity 
                    key={tempo} 
                    style={[
                      styles.optionButton,
                      predictions.tempo === tempo && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('tempo', tempo)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.tempo === tempo && styles.optionTextActive
                    ]}>
                      {tempo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 10. Maç Senaryosu */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🧠 Maç Senaryosu (Makro)</Text>
            
            <View style={styles.categoryCard}>
              <View style={styles.buttonGrid}>
                {[
                  'Kontrollü oyun',
                  'Baskılı oyun',
                  'Geçiş oyunu ağırlıklı',
                  'Duran toplar belirleyici olur'
                ].map((scenario) => (
                  <TouchableOpacity 
                    key={scenario} 
                    style={[
                      styles.optionButtonGrid,
                      predictions.scenario === scenario && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('scenario', scenario)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionTextSmall,
                      predictions.scenario === scenario && styles.optionTextActive
                    ]}>
                      {scenario}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Analiz odağı – 6 odak kartı (sadece görsel, değiştirilemez) + açıklama */}
          <View style={styles.predictionCategory}>
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.focusExplanationRow}>
                  <Ionicons name="star" size={24} color="#F59E0B" />
                  <Text style={styles.categoryLabel}>
                    Analiz odağı
                  </Text>
                </View>
              </View>
              <View style={styles.focusExplanationContent}>
                <Text style={styles.focusExplanationText}>
                  {focusedPredictions.length > 0
                    ? `${focusedPredictions.length} / ${SCORING_CONSTANTS.MAX_FOCUS} odak seçildi. Doğru tahmin 2x puan.`
                    : `En fazla ${SCORING_CONSTANTS.MAX_FOCUS} tahmine odaklanabilirsiniz. Doğru tahmin 2x puan.`}
                </Text>
              </View>
              {/* 6 analiz odağı – seçim ekranındaki butonların ve içeriklerin aynısı, sadece görsel (bu aşamada değiştirilemez) */}
              <View style={styles.focusDisplayGrid} pointerEvents="none">
                {ANALYSIS_FOCUSES.map((focus: AnalysisFocus) => (
                  <View
                    key={focus.id}
                    style={[
                      styles.focusDisplayCard,
                      { borderColor: focus.borderColor, backgroundColor: focus.backgroundColor },
                    ]}
                  >
                    <View style={styles.focusDisplayIconRow}>
                      <View style={[styles.focusDisplayIconContainer, { borderColor: `${focus.color}40` }]}>
                        <Ionicons name={focus.icon} size={14} color={focus.color} />
                      </View>
                    </View>
                    <View style={styles.focusDisplayTitleRow}>
                      <Text style={styles.focusDisplayTitle} numberOfLines={2}>{focus.title}</Text>
                    </View>
                    <View style={styles.focusDisplayBadgeRow}>
                      <View style={[styles.focusDisplayBonusBadge, { borderColor: focus.color, backgroundColor: `${focus.color}15` }]}>
                        <Text style={[styles.focusDisplayBonusText, { color: focus.color }]}>{focus.bonus}</Text>
                      </View>
                    </View>
                    <View style={styles.focusDisplayDescriptionRow}>
                      <Text style={styles.focusDisplayDescription} numberOfLines={3}>{focus.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            activeOpacity={0.8}
            onPress={handleSavePredictions}
          >
            <LinearGradient
              colors={['#1FA2A6', '#047857']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Tahminleri Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Player Prediction Modal - inline dropdown hemen butonların altında */}
      {selectedPlayer && (
        <PlayerPredictionModal
          player={selectedPlayer}
          predictions={currentPlayerPredictions}
          onClose={() => setSelectedPlayer(null)}
          onPredictionChange={handlePlayerPredictionChange}
          startingXI={attackPlayersArray}
          reservePlayers={allSquadPlayers}
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
                [minuteCategory]: minute,
                [outCategory]: true,
              };
              
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

    </SafeAreaView>
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
  onPredictionChange,
  startingXI = [],
  reservePlayers = [],
  onSubstituteConfirm,
}: {
  player: any;
  predictions: any;
  onClose: () => void;
  onPredictionChange: (category: string, value: string | boolean) => void;
  startingXI?: any[];
  reservePlayers?: any[];
  onSubstituteConfirm?: (type: 'normal' | 'injury', playerId: string, minute: string) => void;
}) => {
  const [expandedSubstituteType, setExpandedSubstituteType] = useState<'normal' | 'injury' | null>(null);
  const [localSubstituteId, setLocalSubstituteId] = useState<string | null>(null);
  const [localMinuteRange, setLocalMinuteRange] = useState<string | null>(null);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // ✅ Çıkan oyuncunun pozisyonuna göre uygun yedekleri filtrele
  const availableSubstitutes = useMemo(() => {
    const startingXIIds = new Set((startingXI || []).map((p: any) => p.id));
    const allReserves = (reservePlayers || []).filter((p: any) => !startingXIIds.has(p.id));
    
    // Çıkan oyuncu kaleci ise sadece kalecileri, oyuncu ise sadece oyuncuları göster
    const isPlayerGK = isGoalkeeperPlayer(player);
    return allReserves.filter((p: any) => {
      const isSubstituteGK = isGoalkeeperPlayer(p);
      return isPlayerGK === isSubstituteGK; // Aynı tip olmalı
    });
  }, [startingXI, reservePlayers, player]);

  const getSubstituteName = (id: string | null) =>
    id ? (reservePlayers || []).find((p: any) => p.id.toString() === id)?.name : null;

  const openDropdown = (type: 'normal' | 'injury') => {
    if (expandedSubstituteType === type) {
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    // ✅ Karşılıklı dışlama: Diğer seçeneği temizle
    if (type === 'normal' && predictions.injuredOut) {
      // Sakatlık seçiliyse, önce onu temizle
      onPredictionChange('injuredOut', false);
      onPredictionChange('injurySubstitutePlayer', null);
      onPredictionChange('injurySubstituteMinute', null);
    } else if (type === 'injury' && predictions.substitutedOut) {
      // Normal değişiklik seçiliyse, önce onu temizle
      onPredictionChange('substitutedOut', false);
      onPredictionChange('substitutePlayer', null);
      onPredictionChange('substituteMinute', null);
    }
    
    setExpandedSubstituteType(type);
    setShowPlayerDropdown(false); // Diğer dropdown'ı kapat
    const currentId = type === 'normal' ? predictions.substitutePlayer : predictions.injurySubstitutePlayer;
    const currentMin = type === 'normal' ? predictions.substituteMinute : predictions.injurySubstituteMinute;
    setLocalSubstituteId(currentId || null);
    setLocalMinuteRange(currentMin || null);
  };

  // ✅ Otomatik kaydet - hem oyuncu hem dakika seçildiğinde
  React.useEffect(() => {
    if (expandedSubstituteType && localSubstituteId && localMinuteRange && onSubstituteConfirm) {
      // Kısa bir gecikme ile otomatik kaydet (kullanıcı seçimini görebilsin)
      const timer = setTimeout(() => {
        onSubstituteConfirm(expandedSubstituteType, localSubstituteId, localMinuteRange);
        // Dropdown'ı kapat ama seçimi göster
        setExpandedSubstituteType(null);
        setShowPlayerDropdown(false);
        // Local state'i temizleme - kaydedildiğini göstermek için
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [expandedSubstituteType, localSubstituteId, localMinuteRange, onSubstituteConfirm]);

  // ✅ Tek satır bildirim metni - Çıkar: x Girer: x dk 1-15 formatında
  const buttonLabelNormal = predictions.substitutePlayer && predictions.substituteMinute
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
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.substituteMinute}</Text>
          </View>
        </View>
      )
    : 'Oyundan Çıkar';
  const buttonLabelInjury = predictions.injurySubstitutePlayer && predictions.injurySubstituteMinute
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
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.injurySubstituteMinute}</Text>
          </View>
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
                <Text style={styles.playerPosition}>
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
                ]}
                onPress={() => openDropdown('normal')}
                hitSlop={16}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.substitutedOut && styles.predictionButtonTextActive,
                  ]}>
                    🔄 {buttonLabelNormal}
                  </Text>
                ) : (
                  buttonLabelNormal
                )}
              </Pressable>

              {expandedSubstituteType === 'normal' && (
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
                                  {isSelected && <Ionicons name="checkmark" size={18} color="#1FA2A6" />}
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

                  {/* Dakika Aralığı - 2 satır (4+4) */}
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
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
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
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                  
                  {/* Bilgilendirme: Seçim yapıldığında otomatik kaydedilir */}
                  {localSubstituteId && localMinuteRange && (
                    <View style={styles.autoSaveInfo}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.autoSaveInfoText}>Seçim otomatik kaydedildi</Text>
                    </View>
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
                ]}
                onPress={() => openDropdown('injury')}
                hitSlop={16}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.injuredOut && styles.predictionButtonTextActive,
                  ]}>
                    🚑 {buttonLabelInjury}
                  </Text>
                ) : (
                  buttonLabelInjury
                )}
              </Pressable>

              {expandedSubstituteType === 'injury' && (
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
                                  {isSelected && <Ionicons name="checkmark" size={18} color="#1FA2A6" />}
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

                  {/* Dakika Aralığı - 2 satır (4+4) */}
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
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
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
                              {isSelected && (
                                <View style={styles.minuteRangeCheckmark}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                  
                  {/* Bilgilendirme: Seçim yapıldığında otomatik kaydedilir */}
                  {localSubstituteId && localMinuteRange && (
                    <View style={styles.autoSaveInfo}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.autoSaveInfoText}>Seçim otomatik kaydedildi</Text>
                    </View>
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
                ]}
                onPress={() => openDropdown('normal')}
                hitSlop={16}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.substitutedOut && styles.predictionButtonTextActive,
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
                ]}
                onPress={() => openDropdown('injury')}
                hitSlop={16}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.injuredOut && styles.predictionButtonTextActive,
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onClose} activeOpacity={0.8}>
              <LinearGradient colors={['#1FA2A6', '#047857']} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
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
    paddingBottom: 80,
    paddingHorizontal: 12,
  },

  // Football Field – Kadro ile AYNI boyut, yükseklik (y) %5 artırıldı
  fieldContainer: {
    width: width - 24,
    height: (width - 24) * 1.35 * 1.05 * 1.02, // ✅ Kadro sekmesiyle aynı oran, y ekseni +5% +2%
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
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
  squadIncompleteWarning: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -60 }],
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  squadIncompleteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
  },
  squadIncompleteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  mainField: {
    width: width - 24,
    height: (width - 24) * 1.35 * 1.05 * 1.02, // ✅ Kadro sekmesiyle aynı oran, y ekseni +5% +2%
    alignSelf: 'center',
    marginBottom: 8,
  },
  // 🌟 Saha üzerinde analiz odağı yıldızı - sağ üst köşe
  fieldFocusStarContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 42, 36, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(31, 162, 166, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      },
      default: {
        elevation: 5,
      },
    }),
  },
  // Oyuncu kartları – Kadro ile aynı boyut (64x76) ve yerleşim
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -32 }, { translateY: -38 }],
    zIndex: 1,
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
    borderColor: '#3B82F6', // Blue border for goalkeepers
    borderWidth: 2,
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
    justifyContent: 'space-between',
    gap: 1,
    padding: 4,
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
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 'auto',
    flexShrink: 0,
  },
  playerRatingBottom: {
    fontSize: 8,
    fontWeight: '700',
    color: '#C9A44C',
  },
  playerPositionBottom: {
    fontSize: 8,
    fontWeight: '600',
    color: '#9CA3AF',
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
  playerName: {
    fontSize: 9,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
    flexShrink: 1,
    flexGrow: 0,
    maxHeight: 22,
    paddingHorizontal: 2,
    letterSpacing: 0.3,
  },
  playerPosition: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 2,
  },
  
  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    flex: 1,
  },
  
  // Predictions Section
  predictionsSection: {
    padding: 16,
    gap: 24,
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
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
  },
  categoryHint: {
    fontSize: 12,
    color: '#9CA3AF', // ✅ Design System: Muted foreground (gri ton)
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
    fontSize: 11,
    color: '#9CA3AF', // ✅ Design System: Muted foreground (gri ton)
    textAlign: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
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
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
    textAlign: 'center',
  },
  optionTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Possession Slider
  possessionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  possessionTeam: {
    flex: 1,
    alignItems: 'center',
  },
  possessionTeamLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  possessionTeamValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1FA2A6',
  },
  possessionVs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    paddingHorizontal: 16,
  },
  sliderContainer: {
    gap: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelLeft: {
    fontSize: 11,
    color: '#1FA2A6',
    fontWeight: '600',
  },
  sliderLabelRight: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  
  // Submit Button
  submitButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  playerPosition: {
    fontSize: 11,
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
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
    transform: [{ scale: 1.02 }],
  },
  predictionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionButtonTextActive: {
    fontWeight: 'bold',
  },
  subOptions: {
    paddingLeft: 10,
    gap: 4,
  },
  subOptionsLabel: {
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 11,
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
    minWidth: 0,
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
  
  // 🌟 Focus Info Banner
  focusInfoBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  focusInfoText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
    flex: 1,
  },
});
