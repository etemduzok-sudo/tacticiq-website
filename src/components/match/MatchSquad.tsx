// src/components/match/MatchSquad.tsx - COMPLETE VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  Modal,
  FlatList,
  Alert,
  Platform,
  InteractionManager,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS, PITCH_LAYOUT } from '../../config/constants';
import { squadPredictionsApi, teamsApi, matchesApi } from '../../services/api';
import { predictionsDb } from '../../services/databaseService';
import { ConfirmModal, ConfirmButton } from '../ui/ConfirmModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Path,
} from 'react-native-svg';
import { CommunitySignalPopup } from './CommunitySignalPopup';

// Web için dinamik boyutlandırma
const isWeb = Platform.OS === 'web';
const screenDimensions = Dimensions.get('window');
// Web'de max 500px, mobilde ekran genişliği
const width = isWeb ? Math.min(screenDimensions.width, 500) : screenDimensions.width;
const height = screenDimensions.height;

// Helper function to get color based on stat value
const getStatColor = (value: number): string => {
  if (value >= 85) return '#10B981'; // Green - Excellent
  if (value >= 70) return '#1FA2A6'; // Teal - Good
  if (value >= 50) return '#F59E0B'; // Yellow - Average
  return '#EF4444'; // Red - Poor
};

interface MatchSquadProps {
  matchData: any;
  matchId: string;
  lineups?: any[];
  /** Sadece bu takım(lar)ın kadrosu gösterilir; rakip gizlenir. Boşsa tüm kadro gösterilir. */
  favoriteTeamIds?: number[];
  /** İki favori takım maçında hangi takım için kadro seçildiği; verilirse kadro/tahmin bu takıma özel saklanır. */
  predictionTeamId?: number;
  onComplete: () => void;
  /** Atak formasyonu değişikliği onaylandıktan sonra (tahminler silindikten sonra) çağrılır – örn. Dashboard'a dönüp analiz odağı seçimi gösterilsin */
  onAttackFormationChangeConfirmed?: () => void;
  /** Kadro sekmesi görünür olduğunda true – Tahmin'den geri dönüldüğünde storage'dan tekrar yüklenir */
  isVisible?: boolean;
  /** Biten maç: ilk 11 sabit, oyuncu çıkarma (çarpı) gösterilmez */
  isMatchFinished?: boolean;
  /** Canlı maç: Kadro VIEW-ONLY (sadece oynanan/canlı maç detayında kilit) */
  isMatchLive?: boolean;
  /** Kaydedilmemiş değişiklik olduğunda çağrılır - parent component'e bildirir */
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

/** API'den gelen tüm kaleci varyantlarını tanı (G, GK, Goalkeeper vb.) */
function isGoalkeeperPlayer(p: { position?: string; pos?: string } | null | undefined): boolean {
  if (!p) return false;
  const pos = (p.position ?? p.pos ?? '') as string;
  if (!pos) return false;
  const lower = pos.toLowerCase();
  return pos === 'GK' || pos === 'G' || lower === 'goalkeeper' || lower.startsWith('goalkeeper');
}

/** Kadro oluştururken pozisyonu normalize et – kaleciler her yerde 'GK' olsun */
function normalizePosition(pos: string | undefined): string {
  const raw = pos ?? '';
  const lower = raw.toLowerCase();
  if (raw === 'G' || raw === 'GK' || lower === 'goalkeeper' || lower.startsWith('goalkeeper')) return 'GK';
  return raw || 'SUB';
}

// 26 FIFA/Wikipedia Standard Formations - COMPLETE
const formations = [
  { 
    id: '2-3-5',
    name: '2-3-5 (Classic WM)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'RW', 'ST', 'ST', 'ST'],
    description: 'Klasik WM dizilişi. Futbol tarihinden. Beşli atak!',
    pros: ['Maksimum atak', 'Nostalji', 'Çok sayıda hücum oyuncusu'],
    cons: ['Savunma yok denecek kadar az', 'Modern futbola uygun değil', 'İntihar taktiği'],
    bestFor: 'Eğlence maçları, çaresiz durumlar, risk alma'
  },
  { 
    id: '3-3-3-1',
    name: '3-3-3-1',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'CAM', 'RW', 'ST'],
    description: 'Yaratıcı üçlü hücum arkasında tek forvet.',
    pros: ['Esnek hücum', 'Yaratıcılık', 'Pozisyon değişimi'],
    cons: ['3 stoper riski', 'Savunma zayıf'],
    bestFor: 'Yaratıcı kanat oyuncuları, akıllı forvet'
  },
  { 
    id: '3-3-4',
    name: '3-3-4 (Ultra Attack)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'CM', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
    description: 'Topyekün saldırı. Dörtlü atak hattı.',
    pros: ['Maksimum hücum gücü', 'Çok sayıda gol yolu', 'Baskı'],
    cons: ['Savunma çok zayıf', 'Kontraya açık', 'Çok riskli'],
    bestFor: 'Gol şart, zayıf rakipler, oyun sonu riski'
  },
  { 
    id: '3-4-1-2',
    name: '3-4-1-2',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'ST', 'ST'],
    description: 'Kompakt atak dizilişi. 10 numara arkasında çift forvet.',
    pros: ['Güçlü forvet ikilisi', '10 numara destek', 'Dar alan etkinliği'],
    cons: ['Kanat oyunu yok', '3 stoper riski'],
    bestFor: 'Güçlü forvet ikilisi, teknik 10 numara'
  },
  { 
    id: '3-4-2-1',
    name: '3-4-2-1 (Diamond)',
    type: 'balanced',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'CAM', 'ST'],
    description: 'Elmas orta saha yapısı. İkili 10 numara.',
    pros: ['Yaratıcı oyun', 'Orta saha yoğunluğu', 'Esnek pozisyonlar'],
    cons: ['3 stoper riski', 'Kanat zayıflığı'],
    bestFor: 'Yaratıcı oyuncular, dar alan kombinasyonları'
  },
  { 
    id: '3-4-3',
    name: '3-4-3 (Attacking)',
    type: 'attack',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'RM', 'LW', 'ST', 'RW'],
    description: 'Agresif hücum düzeni. Üçlü forvet hattı.',
    pros: ['Çok sayıda hücum oyuncusu', 'Baskı yapabilme', 'Geniş alan kullanımı'],
    cons: ['Savunmada sayısal dezavantaj', 'Yüksek risk'],
    bestFor: 'Gol gereken durumlar, zayıf savunmalı rakipler'
  },
  { 
    id: '3-5-2',
    name: '3-5-2 (Wing Back)',
    type: 'balanced',
    positions: ['GK', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST'],
    description: 'Kanat beklerle geniş alan kullanımı. Esnek yapı.',
    pros: ['Güçlü kanat oyunu', 'Orta saha üstünlüğü', 'Çift forvet'],
    cons: ['Kanat beklere yüksek yük', '3 stoperle risk'],
    bestFor: 'Çok yönlü kanat oyuncuları, fiziksel kadrolar'
  },
  { 
    id: '3-6-1',
    name: '3-6-1 (Control)',
    type: 'defense',
    positions: ['GK', 'CB', 'CB', 'CB', 'LM', 'CM', 'CM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Top hakimiyeti odaklı. Altılı orta saha bloku.',
    pros: ['Mutlak orta saha kontrolü', 'Top sahipliği', 'Rakip baskısını kırma'],
    cons: ['Atak potansiyeli düşük', 'Monoton oyun'],
    bestFor: 'Teknik kadrolar, tempo kontrolü'
  },
  { 
    id: '4-1-2-3',
    name: '4-1-2-3',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Tek pivot arkasında yaratıcı ikili.',
    pros: ['Yaratıcı orta saha', 'Geniş atak', 'Tek pivot kontrolü'],
    cons: ['Pivot üzerinde yük', 'Orta sahada sayısal dezavantaj'],
    bestFor: 'Güçlü pivot, yaratıcı orta saha oyuncuları'
  },
  { 
    id: '4-1-3-2',
    name: '4-1-3-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CAM', 'RM', 'ST', 'ST'],
    description: 'Dar alan oyununda etkili. Çift forvet.',
    pros: ['Yaratıcı 10 numara', 'Çift forvet ikilisi', 'Pivot güvenliği'],
    cons: ['Kanat oyunu sınırlı', 'Geniş alanlarda zorlanabilir'],
    bestFor: 'Teknik 10 numara, güçlü forvet ikilisi'
  },
  { 
    id: '4-1-4-1',
    name: '4-1-4-1',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Kompakt savunma. Dörtlü orta saha bloku.',
    pros: ['Güçlü savunma', 'Orta saha yoğunluğu', 'Kolay öğrenilir'],
    cons: ['Forvet yalnız kalır', 'Atak potansiyeli düşük'],
    bestFor: 'Savunma odaklı oyun, güçlü forvet'
  },
  { 
    id: '4-2-2-2',
    name: '4-2-2-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'CAM', 'CAM', 'ST', 'ST'],
    description: 'Dengeli yapı. Çift pivot, çift 10, çift forvet.',
    pros: ['Dengeli savunma-atak', 'Çift forvet avantajı', 'Yaratıcı ikili'],
    cons: ['Kanat oyunu yok', 'Dar alan kombinasyonları gerektirir'],
    bestFor: 'Teknik oyuncular, dar alan ustası kadrolar'
  },
  { 
    id: '4-2-3-1',
    name: '4-2-3-1',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CDM', 'LM', 'CAM', 'RM', 'ST'],
    description: 'Modern futbolun en popüler dizilişi. Çift pivot güvenliği.',
    pros: ['Çift pivot güvenliği', 'Yaratıcı 10 numara', 'Dengeli yapı'],
    cons: ['Tek forvet yük', 'Teknik oyuncular gerektirir'],
    bestFor: 'Yaratıcı 10 numara, güçlü forvet'
  },
  { 
    id: '4-3-1-2',
    name: '4-3-1-2',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'CAM', 'ST', 'ST'],
    description: 'Dar alan dominasyonu. 10 numara arkasında ikili forvet.',
    pros: ['Güçlü orta saha kontrolü', 'Çift forvet avantajı', 'Dar alan oyununda etkili'],
    cons: ['Kanat oyununda zayıf', 'Teknik oyuncular gerektirir'],
    bestFor: 'Teknik kadrolar, dar alan kombinasyonları'
  },
  { 
    id: '4-3-2-1',
    name: '4-3-2-1 (Christmas Tree)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'CAM', 'CAM', 'ST'],
    description: 'Çam ağacı dizilişi. İkili 10 numara desteği.',
    pros: ['Yaratıcı oyun', 'Orta saha üstünlüğü', 'Esnek pozisyonlar'],
    cons: ['Tek forvet yalnız', 'Kanat oyunu yok'],
    bestFor: 'Yaratıcı oyuncular, teknik forvet'
  },
  { 
    id: '4-3-3',
    name: '4-3-3 (Attack)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Dengeli ve esnek formasyon. Modern futbolun klasiği.',
    pros: ['Dengeli savunma-atak', 'Geniş alan kullanımı', 'Esnek yapı'],
    cons: ['Orta sahada sayısal dezavantaj olabilir', 'Kanat beklere yük'],
    bestFor: 'Hızlı kanat oyuncuları, teknik orta saha'
  },
  { 
    id: '4-3-3-holding',
    name: '4-3-3 (Holding)',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'ST', 'RW'],
    description: 'Savunma odaklı 4-3-3. Tek pivot ile güvenlik.',
    pros: ['Savunma güvenliği', 'Geniş alan kullanımı', 'Dengeli'],
    cons: ['Atak potansiyeli düşük', 'Pivot üzerinde yük'],
    bestFor: 'Savunma oyunu, güçlü pivot oyuncu'
  },
  { 
    id: '4-3-3-false9',
    name: '4-3-3 (False 9)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'CF', 'RW'],
    description: 'Klasik forvet yok. Sahte dokuzlu ile yaratıcılık.',
    pros: ['Rakip savunma şaşırtma', 'Top hakimiyeti', 'Yaratıcı oyun'],
    cons: ['Klasik forvet yok', 'Gol bulmak zor', 'Yüksek IQ gerektirir'],
    bestFor: 'Teknik kadrolar, akıllı oyuncular'
  },
  { 
    id: '4-4-1-1',
    name: '4-4-1-1',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'CAM', 'ST'],
    description: 'Kompakt orta saha. 10 numara desteği.',
    pros: ['Orta saha kontrolü', 'Yaratıcı 10 numara', 'Savunma güvenliği'],
    cons: ['Tek forvet yük', 'Atak seçenekleri sınırlı'],
    bestFor: 'Yaratıcı 10 numara, fiziksel forvet'
  },
  { 
    id: '4-4-2',
    name: '4-4-2 (Classic)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'],
    description: 'Futbolun en klasik dizilişi. Her duruma uygun.',
    pros: ['Kolay öğrenilir', 'Dengeli savunma-atak', 'Çift forvet avantajı'],
    cons: ['Orta sahada sayısal dezavantaj', 'Modern takımlara karşı zorlanabilir'],
    bestFor: 'Dengeli oyun tarzı, takım kimyası yüksek kadrolar'
  },
  { 
    id: '4-4-2-diamond',
    name: '4-4-2 (Diamond)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'LM', 'RM', 'CAM', 'ST', 'ST'],
    description: 'Elmas orta saha. Çift forvet desteği.',
    pros: ['Orta saha kontrolü', 'Yaratıcı oyun', 'Çift forvet'],
    cons: ['Kanat oyunu zayıf', 'Kanat beklere yük'],
    bestFor: 'Teknik orta saha, güçlü forvet ikilisi'
  },
  { 
    id: '4-5-1',
    name: '4-5-1 (Defensive)',
    type: 'defense',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Savunma kalelenmesi. Beşli orta saha bloku.',
    pros: ['Maksimum savunma', 'Orta saha yoğunluğu', 'Kontra atak'],
    cons: ['Atak potansiyeli çok düşük', 'Forvet yalnız', 'Pasif oyun'],
    bestFor: 'Skor koruma, savunma oyunu, zayıf kadrolar'
  },
  { 
    id: '4-5-1-attack',
    name: '4-5-1 (Attack)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CAM', 'CAM', 'RM', 'ST'],
    description: 'Ofansif 4-5-1. İkili 10 numara desteği.',
    pros: ['Yaratıcı orta saha', 'Kanat oyunu', 'Savunma güvenliği'],
    cons: ['Tek forvet yük', 'Karmaşık yapı'],
    bestFor: 'Yaratıcı oyuncular, teknik forvet'
  },
  { 
    id: '5-3-2',
    name: '5-3-2 (Wing Back)',
    type: 'defense',
    positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
    description: 'Beşli savunma. Kanat bekleriyle geniş alan.',
    pros: ['Maksimum savunma güvenliği', 'Kanat oyunu', 'Çift forvet'],
    cons: ['Çok savunmacı', 'Kanat beklere yüksek yük', 'Atak potansiyeli düşük'],
    bestFor: 'Savunma oyunu, güçlü kanat bekleri'
  },
  { 
    id: '5-4-1',
    name: '5-4-1 (Ultra Defense)',
    type: 'defense',
    positions: ['GK', 'LWB', 'CB', 'CB', 'CB', 'RWB', 'LM', 'CM', 'CM', 'RM', 'ST'],
    description: 'Maksimum savunma kalelenmesi. Dokuzlu savunma bloku.',
    pros: ['Maksimum savunma', 'Kolay organize edilir', 'Skor koruma'],
    cons: ['Neredeyse sıfır atak', 'Forvet tamamen yalnız', 'Çok pasif'],
    bestFor: 'Skor koruma, savunma kalelenmesi, zayıf kadrolar'
  },
  { 
    id: '4-2-4',
    name: '4-2-4 (Total Attack)',
    type: 'attack',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW'],
    description: 'Topyekün hücum. Dörtlü atak hattı ile maksimum gol tehdidi.',
    pros: ['Maksimum atak gücü', 'Geniş hücum alanı', 'Çok sayıda gol yolu'],
    cons: ['Orta saha çok zayıf', 'Kontraya açık', 'Savunma riski'],
    bestFor: 'Gol şart durumlar, zayıf rakipler, son dakika baskısı'
  },
  { 
    id: '4-1-2-1-2',
    name: '4-1-2-1-2 (Narrow)',
    type: 'balanced',
    positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'ST', 'ST'],
    description: 'Dar elmas dizilişi. Orta saha hakimiyeti ile çift forvet.',
    pros: ['Güçlü orta saha', 'Çift forvet', 'Kompakt yapı'],
    cons: ['Kanat oyunu yok', 'Beklere yük biner', 'Dar alan gerektirir'],
    bestFor: 'Teknik orta saha, güçlü forvet ikilisi'
  },
];

/** Formasyon ID → pozisyon etiketleri (GK, LB, CB, ...) – Kadro ve Tahmin aynı gösterim için */
export const formationLabels: Record<string, string[]> = formations.reduce(
  (acc, f) => {
    acc[f.id] = f.positions;
    return acc;
  },
  {} as Record<string, string[]>
);

// Formation Positions - ALL 26 FORMATIONS - Optimized spacing to prevent overlap
// Minimum horizontal gap: 20%, Edge padding: 12-88%, GK max y: 88%
export const formationPositions: Record<string, Array<{ x: number; y: number }>> = {
  '2-3-5': [
    { x: 50, y: 88 }, // GK
    { x: 30, y: 70 }, { x: 70, y: 70 }, // 2 defenders - wider
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield - wider
    { x: 12, y: 25 }, { x: 88, y: 25 }, // Wide attackers
    { x: 30, y: 12 }, { x: 50, y: 8 }, { x: 70, y: 12 }, // 3 strikers
  ],
  '3-3-3-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders - wider
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield
    { x: 12, y: 28 }, { x: 50, y: 25 }, { x: 88, y: 28 }, // 3 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '3-3-4': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // 3 midfield
    { x: 12, y: 20 }, { x: 37, y: 12 }, { x: 63, y: 12 }, { x: 88, y: 20 }, // 4 attackers
  ],
  '3-4-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 50 }, { x: 37, y: 52 }, { x: 63, y: 52 }, { x: 88, y: 50 }, // 4 midfield
    { x: 50, y: 32 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '3-4-2-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 50 }, { x: 37, y: 52 }, { x: 63, y: 52 }, { x: 88, y: 50 }, // 4 midfield
    { x: 32, y: 28 }, { x: 68, y: 28 }, // 2 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '3-4-3': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 68 }, { x: 50, y: 70 }, { x: 78, y: 68 }, // 3 defenders
    { x: 12, y: 48 }, { x: 37, y: 50 }, { x: 63, y: 50 }, { x: 88, y: 48 }, // 4 midfield
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '3-5-2': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 68 }, { x: 50, y: 70 }, { x: 78, y: 68 }, // 3 defenders
    { x: 12, y: 45 }, { x: 32, y: 48 }, { x: 50, y: 50 }, { x: 68, y: 48 }, { x: 88, y: 45 }, // 5 midfield
    { x: 35, y: 15 }, { x: 65, y: 15 }, // 2 strikers
  ],
  '3-6-1': [
    { x: 50, y: 88 }, // GK
    { x: 22, y: 70 }, { x: 50, y: 72 }, { x: 78, y: 70 }, // 3 defenders
    { x: 12, y: 52 }, { x: 28, y: 48 }, { x: 42, y: 45 }, { x: 58, y: 45 }, { x: 72, y: 48 }, { x: 88, y: 52 }, // 6 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-1-2-3': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 32, y: 40 }, { x: 68, y: 40 }, // 2 CM
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-1-3-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 12, y: 38 }, { x: 50, y: 35 }, { x: 88, y: 38 }, // 3 CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-1-4-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 12, y: 40 }, { x: 37, y: 42 }, { x: 63, y: 42 }, { x: 88, y: 40 }, // 4 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-2-2-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 32, y: 55 }, { x: 68, y: 55 }, // 2 CDM
    { x: 32, y: 35 }, { x: 68, y: 35 }, // 2 CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-2-3-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 32, y: 52 }, { x: 68, y: 52 }, // 2 CDM
    { x: 12, y: 30 }, { x: 50, y: 28 }, { x: 88, y: 30 }, // 3 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '4-3-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 52 }, { x: 50, y: 54 }, { x: 75, y: 52 }, // 3 midfield
    { x: 50, y: 32 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-3-2-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 52 }, { x: 50, y: 54 }, { x: 75, y: 52 }, // 3 midfield
    { x: 32, y: 28 }, { x: 68, y: 28 }, // 2 CAM
    { x: 50, y: 8 }, // 1 striker
  ],
  '4-3-3': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 25, y: 45 }, { x: 50, y: 48 }, { x: 75, y: 45 }, // 3 midfield
    { x: 12, y: 18 }, { x: 50, y: 10 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-3-3-holding': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 32, y: 40 }, { x: 68, y: 40 }, // 2 CM
    { x: 12, y: 18 }, { x: 50, y: 12 }, { x: 88, y: 18 }, // 3 attackers
  ],
  '4-3-3-false9': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 25, y: 48 }, { x: 50, y: 45 }, { x: 75, y: 48 }, // 3 midfield
    { x: 12, y: 18 }, { x: 50, y: 25 }, { x: 88, y: 18 }, // 3 attackers (false 9)
  ],
  '4-4-1-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // Defense - V
    { x: 12, y: 46 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 88, y: 46 }, // Midfield - V
    { x: 50, y: 26 }, // CAM
    { x: 50, y: 10 }, // ST
  ],
  '4-4-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 12, y: 45 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 88, y: 45 }, // 4 midfield
    { x: 35, y: 15 }, { x: 65, y: 15 }, // 2 strikers
  ],
  '4-4-2-diamond': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 25, y: 42 }, { x: 75, y: 42 }, // 2 CM
    { x: 50, y: 28 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
  '4-5-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 12, y: 45 }, { x: 32, y: 48 }, { x: 50, y: 50 }, { x: 68, y: 48 }, { x: 88, y: 45 }, // 5 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-5-1-attack': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // 4 defenders
    { x: 12, y: 48 }, { x: 32, y: 50 }, { x: 50, y: 38 }, { x: 68, y: 50 }, { x: 88, y: 48 }, // 5 midfield
    { x: 50, y: 10 }, // 1 striker
  ],
  '5-3-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 30, y: 70 }, { x: 50, y: 72 }, { x: 70, y: 70 }, { x: 88, y: 68 }, // 5 defenders
    { x: 25, y: 48 }, { x: 50, y: 50 }, { x: 75, y: 48 }, // 3 midfield
    { x: 35, y: 18 }, { x: 65, y: 18 }, // 2 strikers
  ],
  '5-4-1': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 66 }, { x: 30, y: 68 }, { x: 50, y: 70 }, { x: 70, y: 68 }, { x: 88, y: 66 }, // 5 defenders
    { x: 15, y: 45 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 45 }, // 4 midfield
    { x: 50, y: 12 }, // 1 striker
  ],
  '4-2-4': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 35, y: 48 }, { x: 65, y: 48 }, // 2 CM
    { x: 12, y: 18 }, { x: 37, y: 12 }, { x: 63, y: 12 }, { x: 88, y: 18 }, // 4 attackers
  ],
  '4-1-2-1-2': [
    { x: 50, y: 88 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // 4 defenders
    { x: 50, y: 55 }, // CDM
    { x: 30, y: 42 }, { x: 70, y: 42 }, // 2 CM
    { x: 50, y: 28 }, // CAM
    { x: 35, y: 12 }, { x: 65, y: 12 }, // 2 strikers
  ],
};

// Mock Players - COMPLETE WITH ALL STATS (truncated for brevity)
const players = [
  { id: 1, name: 'Alisson Becker', position: 'GK', rating: 89, team: 'Liverpool', form: 8, injury: false, number: 1,
    age: 30, nationality: 'Brazil', stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40, defending: 25, physical: 78 }
  },
  { id: 2, name: 'Virgil van Dijk', position: 'CB', rating: 90, team: 'Liverpool', form: 9, injury: false, number: 4,
    age: 32, nationality: 'Netherlands', stats: { pace: 75, shooting: 60, passing: 71, dribbling: 72, defending: 91, physical: 86 }
  },
  { id: 3, name: 'Trent Alexander-Arnold', position: 'RB', rating: 87, team: 'Liverpool', form: 8, injury: false, number: 66,
    age: 25, nationality: 'England', stats: { pace: 76, shooting: 66, passing: 89, dribbling: 74, defending: 76, physical: 71 }
  },
  { id: 4, name: 'Andrew Robertson', position: 'LB', rating: 87, team: 'Liverpool', form: 8, injury: false, number: 26,
    age: 29, nationality: 'Scotland', stats: { pace: 81, shooting: 58, passing: 81, dribbling: 78, defending: 82, physical: 77 }
  },
  { id: 5, name: 'Joël Matip', position: 'CB', rating: 85, team: 'Liverpool', form: 7, injury: false, number: 32,
    age: 32, nationality: 'Cameroon', stats: { pace: 68, shooting: 45, passing: 69, dribbling: 65, defending: 85, physical: 84 }
  },
  { id: 6, name: 'Fabinho', position: 'CDM', rating: 87, team: 'Liverpool', form: 8, injury: false, number: 3,
    age: 30, nationality: 'Brazil', stats: { pace: 67, shooting: 70, passing: 75, dribbling: 72, defending: 84, physical: 82 }
  },
  { id: 7, name: 'Jordan Henderson', position: 'CM', rating: 84, team: 'Liverpool', form: 7, injury: false, number: 14,
    age: 33, nationality: 'England', stats: { pace: 68, shooting: 72, passing: 78, dribbling: 73, defending: 74, physical: 77 }
  },
  { id: 8, name: 'Thiago Alcântara', position: 'CM', rating: 86, team: 'Liverpool', form: 7, injury: true, number: 6,
    age: 32, nationality: 'Spain', stats: { pace: 64, shooting: 74, passing: 89, dribbling: 84, defending: 68, physical: 64 }
  },
  { id: 9, name: 'Mohamed Salah', position: 'RW', rating: 90, team: 'Liverpool', form: 9, injury: false, number: 11,
    age: 31, nationality: 'Egypt', stats: { pace: 90, shooting: 87, passing: 81, dribbling: 90, defending: 45, physical: 75 }
  },
  { id: 10, name: 'Sadio Mané', position: 'LW', rating: 89, team: 'Liverpool', form: 8, injury: false, number: 10,
    age: 31, nationality: 'Senegal', stats: { pace: 90, shooting: 83, passing: 80, dribbling: 87, defending: 44, physical: 77 }
  },
  { id: 11, name: 'Roberto Firmino', position: 'ST', rating: 86, team: 'Liverpool', form: 7, injury: false, number: 9,
    age: 32, nationality: 'Brazil', stats: { pace: 76, shooting: 82, passing: 83, dribbling: 86, defending: 59, physical: 76 }
  },
  { id: 12, name: 'Diogo Jota', position: 'ST', rating: 85, team: 'Liverpool', form: 8, injury: false, number: 20,
    age: 27, nationality: 'Portugal', stats: { pace: 85, shooting: 83, passing: 73, dribbling: 85, defending: 34, physical: 73 }
  },
  { id: 13, name: 'Luis Díaz', position: 'LW', rating: 84, team: 'Liverpool', form: 9, injury: false, number: 7,
    age: 26, nationality: 'Colombia', stats: { pace: 91, shooting: 76, passing: 75, dribbling: 88, defending: 38, physical: 72 }
  },
  { id: 14, name: 'Curtis Jones', position: 'CM', rating: 78, team: 'Liverpool', form: 7, injury: false, number: 17,
    age: 22, nationality: 'England', stats: { pace: 74, shooting: 68, passing: 74, dribbling: 79, defending: 60, physical: 68 }
  },
  { id: 15, name: 'Harvey Elliott', position: 'CAM', rating: 76, team: 'Liverpool', form: 8, injury: false, number: 19,
    age: 20, nationality: 'England', stats: { pace: 78, shooting: 65, passing: 76, dribbling: 82, defending: 45, physical: 58 }
  },
  { id: 16, name: 'Darwin Núñez', position: 'ST', rating: 82, team: 'Liverpool', form: 7, injury: false, number: 27,
    age: 24, nationality: 'Uruguay', stats: { pace: 88, shooting: 80, passing: 68, dribbling: 77, defending: 35, physical: 82 }
  },
  { id: 17, name: 'Cody Gakpo', position: 'LW', rating: 81, team: 'Liverpool', form: 8, injury: false, number: 18,
    age: 24, nationality: 'Netherlands', stats: { pace: 82, shooting: 78, passing: 76, dribbling: 82, defending: 40, physical: 75 }
  },
];

// Substitute Players (Yedekler)
const substitutePlayers = [
  { id: 101, name: 'Caoimhin Kelleher', position: 'GK', rating: 76, number: 62 },
  { id: 102, name: 'Joe Gomez', position: 'CB', rating: 80, number: 2 },
  { id: 103, name: 'Ibrahima Konaté', position: 'CB', rating: 83, number: 5 },
  { id: 104, name: 'Kostas Tsimikas', position: 'LB', rating: 79, number: 21 },
  { id: 105, name: 'Stefan Bajčetić', position: 'CM', rating: 72, number: 43 },
  { id: 106, name: 'Alexis Mac Allister', position: 'CM', rating: 82, number: 10 },
  { id: 107, name: 'Dominik Szoboszlai', position: 'CAM', rating: 80, number: 8 },
  { id: 108, name: 'Ben Doak', position: 'RW', rating: 68, number: 50 },
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

export function MatchSquad({ matchData, matchId, lineups, favoriteTeamIds = [], predictionTeamId, onComplete, onAttackFormationChangeConfirmed, isVisible = true, isMatchFinished = false, isMatchLive: isMatchLiveProp, onHasUnsavedChanges }: MatchSquadProps) {
  const { width: winW, height: winH } = useWindowDimensions();
  
  // Saha boyutları - Tahmin ile BİREBİR aynı hesaplama (runtime'da)
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

  // ✅ Takım ID'lerini matchData'dan al
  const homeTeamId = matchData?.teams?.home?.id || matchData?.homeTeam?.id;
  const awayTeamId = matchData?.teams?.away?.id || matchData?.awayTeam?.id;
  const homeTeamName = matchData?.teams?.home?.name || matchData?.homeTeam?.name || 'Ev Sahibi';
  const awayTeamName = matchData?.teams?.away?.name || matchData?.awayTeam?.name || 'Deplasman';

  // ✅ İki favori maçta takıma özel kadro anahtarı
  const squadStorageKey = React.useMemo(
    () => (predictionTeamId != null ? `${STORAGE_KEYS.SQUAD}${matchId}-${predictionTeamId}` : `${STORAGE_KEYS.SQUAD}${matchId}`),
    [matchId, predictionTeamId]
  );
  // Legacy key for backward compatibility
  const legacySquadStorageKey = React.useMemo(
    () => (predictionTeamId != null ? `${LEGACY_STORAGE_KEYS.SQUAD}${matchId}-${predictionTeamId}` : `${LEGACY_STORAGE_KEYS.SQUAD}${matchId}`),
    [matchId, predictionTeamId]
  );

  // ✅ Takım kadrosu için state (lineups yoksa API'den çekilecek)
  const [squadPlayers, setSquadPlayers] = React.useState<any[]>([]);
  const [isLoadingSquad, setIsLoadingSquad] = React.useState(false);
  const [squadRetryKey, setSquadRetryKey] = React.useState(0);

  // ✅ Topluluk "oyundan çıksın" verisi (subOutRate = subOutVotes / totalPredictors)
  // Mock 999999: API yoksa client-side fallback ile her zaman göster
  const MOCK_999999_SUBOUT: { totalPredictors: number; players: Record<string | number, { subOutVotes: number; replacementName?: string | null }> } = {
    totalPredictors: 580,
    players: {
      9000: { subOutVotes: 151, replacementName: 'T. Polat' },   // %26 kaleci
      9009: { subOutVotes: 58, replacementName: 'T. Polat' },   // %10 santrafor
    },
  };
  const [subOutData, setSubOutData] = React.useState<{ totalPredictors: number; players: Record<string | number, { subOutVotes: number; replacementName?: string | null }> } | null>(null);
  React.useEffect(() => {
    if (!matchId || !isVisible) return;
    const isMock999999 = String(matchId) === '999999';
    let cancelled = false;
    matchesApi.getCommunityStats(String(matchId))
      .then((res: any) => {
        if (cancelled) return;
        if (res?.data?.subOutByPlayer) {
          setSubOutData({
            totalPredictors: res.data.subOutByPlayer.totalPredictors || 0,
            players: res.data.subOutByPlayer.players || {},
          });
        } else if (isMock999999) {
          setSubOutData(MOCK_999999_SUBOUT);
        }
      })
      .catch(() => {
        if (!cancelled && isMock999999) setSubOutData(MOCK_999999_SUBOUT);
      });
    return () => { cancelled = true; };
  }, [matchId, isVisible]);

  const retrySquadFetch = React.useCallback(() => {
    setSquadRetryKey((k) => k + 1);
  }, []);

  // ✅ Lineups yoksa API'den her iki takımın kadrosunu çek
  React.useEffect(() => {
    const fetchSquads = async () => {
      if (lineups && lineups.length > 0) return;
      if (!homeTeamId || !awayTeamId) {
        console.log('⚠️ No team IDs for squad fetch');
        return;
      }

      setIsLoadingSquad(true);
      console.log('📥 Fetching team squads...', { homeTeamId, awayTeamId });

      try {
        const homePromise = teamsApi.getTeamSquad(homeTeamId).then((json) => json).catch((err) => {
          console.error('❌ Home squad fetch exception:', err.message);
          return null;
        });
        const awayPromise = teamsApi.getTeamSquad(awayTeamId).then((json) => json).catch((err) => {
          console.error('❌ Away squad fetch exception:', err.message);
          return null;
        });

        const [homeRes, awayRes] = await Promise.all([homePromise, awayPromise]);

        const allPlayers: any[] = [];

        if (homeRes?.data?.players && Array.isArray(homeRes.data.players)) {
          homeRes.data.players.forEach((p: any) => {
            allPlayers.push({
              id: p.id, name: p.name, position: normalizePosition(p.position), 
              rating: p.rating || 75, // ✅ Backend'den gelen gerçek rating
              number: p.number, team: homeTeamName, teamId: homeTeamId,
              form: 7, injury: p.injured || false, age: p.age || 25,
              nationality: p.nationality || 'Unknown', photo: p.photo,
              stats: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 }
            });
          });
        }
        if (awayRes?.data?.players && Array.isArray(awayRes.data.players)) {
          awayRes.data.players.forEach((p: any) => {
            allPlayers.push({
              id: p.id, name: p.name, position: normalizePosition(p.position), 
              rating: p.rating || 75, // ✅ Backend'den gelen gerçek rating
              number: p.number, team: awayTeamName, teamId: awayTeamId,
              form: 7, injury: p.injured || false, age: p.age || 25,
              nationality: p.nationality || 'Unknown', photo: p.photo,
              stats: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 }
            });
          });
        }

        if (allPlayers.length === 0) {
          console.warn('⚠️ No squad players loaded. Backend may be down or API-Football has no data.');
          if (!homeRes && !awayRes) {
            console.error('❌ Both API calls failed - Backend may not be running on port 3001');
          }
        } else {
          console.log('✅ Squad players loaded:', allPlayers.length);
        }
        setSquadPlayers(allPlayers);
      } catch (err: any) {
        console.error('❌ Squad fetch error:', err?.message || err);
        setSquadPlayers([]); // Hata durumunda boş array set et
      } finally {
        setIsLoadingSquad(false);
      }
    };

    fetchSquads();
  }, [lineups, homeTeamId, awayTeamId, homeTeamName, awayTeamName, squadRetryKey]);

  // ✅ GERÇEK VERİ: Önce lineups, yoksa squadPlayers kullan
  const realPlayers = React.useMemo(() => {
    // 1. Lineups varsa kullan (maç kadrosu)
    if (lineups && lineups.length > 0) {
    
    // Her iki takımın oyuncularını birleştir
    const allPlayers: any[] = [];
    lineups.forEach((lineup: any, index: number) => {
      const lineupTeamId = lineup.team?.id;
      const lineupTeamName = lineup.team?.name || 'Unknown';
      const teamColors = lineup.team?.colors; // Backend'den gelen team colors
      
      // ✅ Takım ID'yi doğrula ve eşleştir
      let finalTeamId = lineupTeamId;
      let finalTeamName = lineupTeamName;
      
      // Eğer lineup team.id matchData ile eşleşiyorsa kullan
      if (lineupTeamId === homeTeamId) {
        finalTeamId = homeTeamId;
        finalTeamName = homeTeamName;
      } else if (lineupTeamId === awayTeamId) {
        finalTeamId = awayTeamId;
        finalTeamName = awayTeamName;
      } else {
        // Eşleşme yoksa, lineup sırasına göre ata (ilk = home, ikinci = away)
        if (index === 0 && homeTeamId) {
          finalTeamId = homeTeamId;
          finalTeamName = homeTeamName;
          console.warn(`⚠️ Lineup[0] team ID mismatch: lineup.team.id=${lineupTeamId}, assigning to HOME (${homeTeamId})`);
        } else if (index === 1 && awayTeamId) {
          finalTeamId = awayTeamId;
          finalTeamName = awayTeamName;
          console.warn(`⚠️ Lineup[1] team ID mismatch: lineup.team.id=${lineupTeamId}, assigning to AWAY (${awayTeamId})`);
        } else {
          console.error(`❌ Cannot match lineup[${index}] team ID ${lineupTeamId} to home (${homeTeamId}) or away (${awayTeamId})`);
        }
      }
      
      // Başlangıç 11'i ekle
      if (lineup.startXI) {
        lineup.startXI.forEach((item: any) => {
          // Backend enriched format: doğrudan player objesi
          // Eski format: item.player içinde
          const player = item.player || item;
          allPlayers.push({
            id: player.id,
            name: player.name,
            position: normalizePosition(player.pos || player.position),
            rating: player.rating || 75, // ✅ Backend'den gelen gerçek rating
            number: player.number,
            team: finalTeamName, // ✅ Doğrulanmış takım adı
            teamId: finalTeamId, // ✅ Doğrulanmış takım ID
            teamColors: teamColors,
            form: 7,
            injury: false,
            age: player.age || 25,
            nationality: player.nationality || 'Unknown',
            grid: player.grid,
            stats: player.stats || { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 } // ✅ Backend'den gelen stats varsa kullan
          });
        });
      }
      
      // Yedekleri ekle
      if (lineup.substitutes) {
        lineup.substitutes.forEach((item: any) => {
          const player = item.player || item;
          allPlayers.push({
            id: player.id,
            name: player.name,
            position: normalizePosition(player.pos || player.position),
            rating: player.rating || 70, // ✅ Backend'den gelen gerçek rating
            number: player.number,
            team: finalTeamName, // ✅ Doğrulanmış takım adı
            teamId: finalTeamId, // ✅ Doğrulanmış takım ID
            teamColors: teamColors,
            form: 6,
            injury: false,
            age: player.age || 25,
            nationality: player.nationality || 'Unknown',
            grid: player.grid,
            stats: player.stats || { pace: 65, shooting: 65, passing: 65, dribbling: 65, defending: 65, physical: 65 } // ✅ Backend'den gelen stats varsa kullan
          });
        });
      }
    });

      // ✅ Debug: Takım dağılımını kontrol et
      const homePlayers = allPlayers.filter((p: any) => p.teamId === homeTeamId);
      const awayPlayers = allPlayers.filter((p: any) => p.teamId === awayTeamId);
      console.log(`🔍 Lineups team check: homeTeamId=${homeTeamId} (${homeTeamName}) → ${homePlayers.length} players, awayTeamId=${awayTeamId} (${awayTeamName}) → ${awayPlayers.length} players`);

      // ✅ Mock maç (999999) için tüm oyuncuları göster, favori filtresi uygulama
      // ✅ FIX: matchId string veya number olabilir, her iki durumu da kontrol et
      const isMockMatch = matchId === 999999 || matchId === '999999' || String(matchId) === '999999';
      const filtered = (isMockMatch || favoriteTeamIds.length === 0)
        ? allPlayers
        : allPlayers.filter((p: any) => p.teamId != null && favoriteTeamIds.includes(p.teamId));
      console.log('✅ Real players loaded from LINEUPS:', filtered.length, (isMockMatch ? '(mock - all players)' : favoriteTeamIds.length ? '(favori only)' : ''));
      return filtered;
    }

    // 2. Lineups yoksa squadPlayers kullan (takım kadrosu – fetch zaten favoriye göre filtrelenmiş)
    if (squadPlayers.length > 0) {
      console.log('✅ Real players loaded from SQUAD API:', squadPlayers.length);
      return squadPlayers;
    }

    // 3. Hiçbiri yoksa boş array
    console.log('⚠️ No players available');
    return [];
  }, [lineups, squadPlayers, favoriteTeamIds]);

  // ✅ Atak kadrosu = favori takım. Favori ev sahibi veya deplasman fark etmez, her zaman favori takımın kadrosu gelir.
  const attackTeamId = React.useMemo(() => {
    // İki favori maçta (predictionTeamId varsa) onu kullan
    if (predictionTeamId != null) return predictionTeamId;
    
    if (!homeTeamId || !awayTeamId) return homeTeamId || awayTeamId;
    
    // ✅ Mock maç (999999) için her zaman ev sahibi takımı kullan
    const isMockMatch = matchId === 999999 || matchId === '999999' || String(matchId) === '999999';
    if (isMockMatch) {
      console.log('🎯 Mock maç için homeTeamId kullanılıyor:', homeTeamId);
      return homeTeamId;
    }
    
    // ✅ KRİTİK: Favori takımlardan biri maçta oynuyorsa, O TAKIM SEÇİLİR (ev sahibi veya deplasman fark etmez!)
    // Önce ev sahibi favori mi kontrol et
    if (favoriteTeamIds.includes(homeTeamId)) return homeTeamId;
    
    // Sonra deplasman favori mi kontrol et
    if (favoriteTeamIds.includes(awayTeamId)) return awayTeamId;
    
    // Hiçbir favori maçta değilse fallback olarak ev sahibi (bu durum normalde olmamalı)
    console.warn('⚠️ No favorite team found in match, falling back to home team');
    return homeTeamId;
  }, [homeTeamId, awayTeamId, favoriteTeamIds, predictionTeamId, matchId]);

  // ✅ Atak modunda sadece atak takımının oyuncuları (rakip atanamaz)
  const attackTeamPlayers = React.useMemo(() => {
    if (!attackTeamId) return realPlayers;
    
    // ✅ Mock maç için özel kontrol
    const isMockMatch = matchId === 999999 || matchId === '999999' || String(matchId) === '999999';
    
    const filtered = realPlayers.filter((p: any) => p.teamId === attackTeamId);
    
    // Mock maçta eğer filtreleme sonucu boş ise, ilk takımın (home) oyuncularını döndür
    if (isMockMatch && filtered.length === 0 && realPlayers.length > 0) {
      // realPlayers'daki ilk takımın ID'sini bul ve o takımın oyuncularını döndür
      const firstTeamId = realPlayers[0]?.teamId;
      if (firstTeamId) {
        const homeFiltered = realPlayers.filter((p: any) => p.teamId === firstTeamId);
        console.log('🎯 Mock maç: attackTeamId eşleşmedi, ilk takımın oyuncuları kullanılıyor:', homeFiltered.length);
        return homeFiltered;
      }
    }
    
    console.log(`📋 attackTeamPlayers: attackTeamId=${attackTeamId}, filtered=${filtered.length}/${realPlayers.length}`);
    return filtered;
  }, [realPlayers, attackTeamId, matchId]);

  // ✅ Attack & Defense Formation States
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [defenseFormation, setDefenseFormation] = useState<string | null>(null);
  const [attackPlayers, setAttackPlayers] = useState<Record<number, typeof players[0] | null>>({});
  const [defensePlayers, setDefensePlayers] = useState<Record<number, typeof players[0] | null>>({});
  
  // ✅ Current editing mode: 'attack' or 'defense'
  const [editingMode, setEditingMode] = useState<'attack' | 'defense'>('attack');
  
  // ✅ Oynanan maçta karşılaştırma görünümü: kullanıcı tahmini / gerçek 11 / topluluk tercihleri
  type ViewSource = 'user' | 'actual' | 'community';
  const [viewSource, setViewSource] = useState<ViewSource>('community'); // Varsayılan: topluluk
  
  // ✅ Gerçek ilk 11 (API lineup'tan) - atak ve defans formasyonları
  const [actualAttackFormation, setActualAttackFormation] = useState<string | null>(null);
  const [actualAttackPlayers, setActualAttackPlayers] = useState<Record<number, any>>({});
  const [actualDefenseFormation, setActualDefenseFormation] = useState<string | null>(null);
  const [actualDefensePlayers, setActualDefensePlayers] = useState<Record<number, any>>({});
  
  // ✅ Confirmation modal for defense formation
  const [showDefenseConfirmModal, setShowDefenseConfirmModal] = useState(false);
  const [formationConfirmModal, setFormationConfirmModal] = useState<{ formationId: string } | null>(null);
  
  // ✅ Track if defense confirmation was already shown
  const [defenseConfirmShown, setDefenseConfirmShown] = useState(false);
  
  // ✅ State restore edildi mi?
  const [stateRestored, setStateRestored] = useState(false);
  
  // ✅ Sadece oynanan/canlı maçta kadro kilitli (MatchDetail'den gelen prop öncelikli)
  const isMatchLive = React.useMemo(() => {
    if (typeof isMatchLiveProp === 'boolean') return isMatchLiveProp;
    const status = matchData?.fixture?.status?.short || matchData?.status || '';
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
    return liveStatuses.includes(status);
  }, [isMatchLiveProp, matchData]);

  // Kadro sekmesinde kilit: sadece canlı veya biten maçta (oynanan maç kartına girince)
  const isKadroLocked = isMatchLive || isMatchFinished;
  const KADRO_LOCKED_MESSAGE = 'Maç başladığı için şu an kadro kurulumu yapılamaz.';
  const showKadroLockedToast = () => Alert.alert('Kadro kilitli', KADRO_LOCKED_MESSAGE);

  // ✅ Kaydedilmemiş değişiklikleri takip et ve parent'a bildir
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  // ✅ Kilit açıldıktan sonra gerçekten değişiklik yapıldı mı?
  const [hasModifiedSinceUnlock, setHasModifiedSinceUnlock] = React.useState(false);
  // ✅ Önceki kilit durumu - kilit açıldığında reset flag
  const prevSquadLockedRef = React.useRef(isSquadLocked);
  
  React.useEffect(() => {
    // Kilit açıldığında modified flag'i sıfırla
    if (prevSquadLockedRef.current === true && isSquadLocked === false) {
      setHasModifiedSinceUnlock(false);
    }
    prevSquadLockedRef.current = isSquadLocked;
  }, [isSquadLocked]);
  
  React.useEffect(() => {
    // Canlı/biten maçlarda değişiklik yapılamaz
    if (isKadroLocked) {
      setHasUnsavedChanges(false);
      onHasUnsavedChanges?.(false);
      return;
    }
    
    // ✅ Kadro kilitli ise (Tamamla basıldı) = kaydedilmiş, değişiklik yok
    if (isSquadLocked) {
      setHasUnsavedChanges(false);
      onHasUnsavedChanges?.(false);
      return;
    }
    
    // Formasyon seçilmiş ve en az 1 oyuncu atanmışsa
    const attackPlayerCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
    const hasFormationAndPlayers = attackFormation !== null && attackPlayerCount > 0;
    
    // ✅ Değişiklik yapıldıysa uyarı göster
    // hasModifiedSinceUnlock: formasyon seçimi, oyuncu ekleme/çıkarma
    const hasChanges = hasFormationAndPlayers && hasModifiedSinceUnlock;
    
    setHasUnsavedChanges(hasChanges);
    onHasUnsavedChanges?.(hasChanges);
  }, [attackFormation, attackPlayers, isKadroLocked, isSquadLocked, hasModifiedSinceUnlock, onHasUnsavedChanges]);

  // ✅ Mount ve Kadro sekmesi görünür olduğunda AsyncStorage'dan yükle (Tahmin'den geri dönünce kadro görünsün)
  // ✅ Tamamla basılmadan geri dönüldüyse (isCompleted !== true): HİÇBİR ŞEY yükleme - formasyon seçiminden başla
  // ✅ Kullanıcı "Tamamla" butonu ile kadroyu tamamlayana kadar formasyon ve oyuncular gösterilmez
  const runRestore = React.useCallback(async () => {
    if (isMatchFinished) {
      setStateRestored(true);
      return;
    }
    try {
      const key = squadStorageKey;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isCompleted = parsed.isCompleted === true;
        const isAutoApplied = parsed.isAutoApplied === true;
        const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
        const isLive = liveStatuses.includes(matchData?.fixture?.status?.short || matchData?.status || '');

        // ✅ SADECE "Tamamla" basıldıysa VEYA canlı maçta auto-apply yapıldıysa formasyon ve oyuncuları yükle
        // Tamamla basılmadan çıkıldıysa HİÇBİR veri yüklenme - kullanıcı formasyon seçiminden başlar
        if (isCompleted || (isLive && isAutoApplied)) {
          if (parsed.attackFormation) setAttackFormation(parsed.attackFormation);
          if (parsed.attackPlayers) setAttackPlayers(parsed.attackPlayers);
          if (parsed.defenseFormation) setDefenseFormation(parsed.defenseFormation);
          if (parsed.defensePlayers) setDefensePlayers(parsed.defensePlayers);
          // editingMode'u restore ET AMA sadece sayfa ilk yüklenirken
          if (parsed.editingMode && !stateRestored) setEditingMode(parsed.editingMode);
          setDefenseConfirmShown(parsed.defenseFormation ? true : (parsed.defenseConfirmShown || false));
          // ✅ Tamamlanmış kadro kilitli olarak gelir
          setIsSquadLocked(isCompleted);
        } else {
          // ✅ Tamamla basılmadıysa: HİÇ formasyon/oyuncu yükleme - sıfırdan başla
          // Kullanıcı formasyon seçmeli ve oyuncuları atayıp Tamamla basmalı
          setAttackFormation(null);
          setAttackPlayers({});
          setDefenseFormation(null);
          setDefensePlayers({});
          if (!stateRestored) setEditingMode('attack');
          setDefenseConfirmShown(false);
        }
      }
    } catch (e) {
      console.warn('State restore failed', e);
    }
    setStateRestored(true);
  }, [squadStorageKey, matchData, isMatchFinished, stateRestored]);

  // ✅ MAÇ CANLI VE FORMASYON SEÇİLMEMİŞSE: En popüler formasyonu otomatik uygula
  const [autoFormationApplied, setAutoFormationApplied] = React.useState(false);
  // ✅ BİTEN MAÇ: İlk 11'i en çok tercih edilen formasyona göre bir kez yerleştir
  const [finishedFormationApplied, setFinishedFormationApplied] = React.useState(false);
  
  React.useEffect(() => {
    // Sadece maç canlıysa, restore tamamlandıysa, formasyon yoksa ve henüz auto-apply yapılmadıysa
    if (!isMatchLive || !stateRestored || attackFormation || autoFormationApplied) return;
    if (attackTeamPlayers.length === 0) return; // Oyuncular yüklenmeden bekle
    
    const applyPopularFormation = async () => {
      try {
        console.log('🎯 Maç canlı - en popüler formasyon otomatik uygulanıyor...');
        console.log('📋 Mevcut oyuncular:', attackTeamPlayers.length);
        
        // Mock 999999: Kullanıcıların çoğu atak 3-5-2, defans 3-6-1 seçmiş (farklı olmalı)
        const isMock999999 = String(matchId) === '999999';
        let popularFormationId = isMock999999 ? '3-5-2' : '4-3-3';
        let popularDefenseFormationId = isMock999999 ? '3-6-1' : '4-3-3';
        if (!isMock999999) {
          try {
            const popularRes = await squadPredictionsApi.getPopularFormations('attack');
            if (popularRes.success && popularRes.data && popularRes.data.length > 0) {
              popularFormationId = popularRes.data[0].formation;
            }
            const defRes = await squadPredictionsApi.getPopularFormations('defense');
            if (defRes?.success && defRes.data?.length > 0) {
              popularDefenseFormationId = defRes.data[0].formation;
            }
          } catch (apiErr) {
            console.log('⚠️ Popular formations API failed, using default');
          }
          // Kullanıcıların çoğu atak ve defansı aynı yapmışsa her iki formasyon da aynı görünür
        }
        console.log('📊 En popüler formasyon (atak/defans):', popularFormationId, popularDefenseFormationId);
        
        const formation = formations.find(f => f.id === popularFormationId) || formations.find(f => f.id === '4-3-3');
        if (!formation) {
          console.log('❌ Formation not found:', popularFormationId);
          return;
        }
        
        // Formasyonu uygula
        setAttackFormation(formation.id);
        
        // Oyuncuları pozisyonlara otomatik yerleştir
        const autoPlayers: Record<number, typeof players[0] | null> = {};
        const usedPlayerIds = new Set<number>();
        
        // Her slot için en uygun oyuncuyu bul
        // ✅ FIX: formation.positions sadece string array (e.g., ['GK', 'CB', 'CB', ...])
        formation.positions.forEach((positionType: string, slotIndex: number) => {
          const slotPos = (positionType || '').toUpperCase();
          
          // Bu pozisyon için uygun oyuncuları filtrele
          let candidates = attackTeamPlayers.filter((p: any) => {
            if (usedPlayerIds.has(p.id)) return false;
            
            const playerPos = (p.position || p.pos || '').toUpperCase();
            
            // Kaleci sadece kaleci slotuna (slot 0 ve pozisyon GK)
            if (slotPos === 'GK' || slotPos === 'G') {
              return isGoalkeeperPlayer(p);
            }
            // Kaleci olmayan slotlara kaleci konamaz
            if (isGoalkeeperPlayer(p)) return false;
            
            // Pozisyon eşleştirme - slot pozisyonuna göre
            // Defans: CB, LB, RB, LWB, RWB
            if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slotPos)) {
              return playerPos.includes('D') || playerPos.includes('DEF') || playerPos.includes('BACK') || playerPos === 'CB' || playerPos === 'LB' || playerPos === 'RB';
            }
            // Orta saha: CM, CDM, CAM, LM, RM, DM, AM
            if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(slotPos)) {
              return playerPos.includes('M') || playerPos.includes('MID') || playerPos === 'CM' || playerPos === 'CDM' || playerPos === 'CAM';
            }
            // Forvet: ST, LW, RW, CF
            if (['ST', 'LW', 'RW', 'CF'].includes(slotPos)) {
              return playerPos.includes('F') || playerPos.includes('ATT') || playerPos.includes('ST') || playerPos.includes('W') || playerPos === 'LW' || playerPos === 'RW';
            }
            
            return true; // Eşleşme yoksa herkes aday
          });
          
          // Rating'e göre sırala ve en iyiyi seç
          candidates.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
          
          if (candidates.length > 0) {
            autoPlayers[slotIndex] = candidates[0];
            usedPlayerIds.add(candidates[0].id);
            console.log(`✅ Slot ${slotIndex} (${slotPos}): ${candidates[0].name}`);
          } else {
            // Eşleşen oyuncu bulunamadıysa, kalan herhangi bir oyuncuyu ata
            const remaining = attackTeamPlayers.filter((p: any) => !usedPlayerIds.has(p.id) && !isGoalkeeperPlayer(p));
            if (remaining.length > 0) {
              remaining.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
              autoPlayers[slotIndex] = remaining[0];
              usedPlayerIds.add(remaining[0].id);
              console.log(`⚠️ Slot ${slotIndex} (${slotPos}): Fallback -> ${remaining[0].name}`);
            }
          }
        });
        
        setAttackFormation(formation.id);
        setAttackPlayers(autoPlayers);
        const defenseForm = formations.find(f => f.id === popularDefenseFormationId) || formation;
        const defenseAutoPlayers: Record<number, typeof players[0] | null> = {};
        const defUsed = new Set<number>();
        (defenseForm.positions || formation.positions).forEach((positionType: string, slotIndex: number) => {
          const slotPos = (positionType || '').toUpperCase();
          let candidates = attackTeamPlayers.filter((p: any) => {
            if (defUsed.has(p.id)) return false;
            const playerPos = (p.position || p.pos || '').toUpperCase();
            if (slotPos === 'GK' || slotPos === 'G') return isGoalkeeperPlayer(p);
            if (isGoalkeeperPlayer(p)) return false;
            if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slotPos)) return playerPos.includes('D') || playerPos.includes('DEF') || playerPos === 'CB' || playerPos === 'LB' || playerPos === 'RB';
            if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(slotPos)) return playerPos.includes('M') || playerPos === 'CM' || playerPos === 'CDM' || playerPos === 'CAM';
            if (['ST', 'LW', 'RW', 'CF'].includes(slotPos)) return playerPos.includes('F') || playerPos.includes('ST') || playerPos.includes('W') || playerPos === 'LW' || playerPos === 'RW';
            return true;
          });
          candidates.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
          if (candidates.length > 0) {
            defenseAutoPlayers[slotIndex] = candidates[0];
            defUsed.add(candidates[0].id);
          } else {
            const remaining = attackTeamPlayers.filter((p: any) => !defUsed.has(p.id) && !isGoalkeeperPlayer(p));
            if (remaining.length > 0) {
              remaining.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
              defenseAutoPlayers[slotIndex] = remaining[0];
              defUsed.add(remaining[0].id);
            }
          }
        });
        setDefenseFormation(defenseForm.id);
        setDefensePlayers(defenseAutoPlayers);
        setAutoFormationApplied(true);
        
        const key = squadStorageKey;
        const raw = await AsyncStorage.getItem(key);
        const existing = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(key, JSON.stringify({
          ...existing,
          matchId,
          attackFormation: formation.id,
          attackPlayers: autoPlayers,
          defenseFormation: defenseForm.id,
          defensePlayers: defenseAutoPlayers,
          isAutoApplied: true,
        }));
        
        console.log('✅ Popüler formasyon ve kadro otomatik uygulandı (Atak:', formation.id, 'Defans:', defenseForm.id, ')');
      } catch (err) {
        console.error('❌ Auto formation apply error:', err);
      }
    };
    
    // Kısa bir gecikme ile uygula (oyuncuların yüklenmesini bekle)
    const timer = setTimeout(applyPopularFormation, 500);
    return () => clearTimeout(timer);
  }, [isMatchLive, stateRestored, attackFormation, autoFormationApplied, attackTeamPlayers, squadStorageKey, matchId]);

  // ✅ BİTEN MAÇ: İlk 11'i en çok tercih edilen atak/defans formasyonuna göre yerleştir (lineups startXI)
  React.useEffect(() => {
    if (!isMatchFinished || !stateRestored || attackTeamPlayers.length < 11 || finishedFormationApplied) return;
    
    const applyFinishedMatchFormation = async () => {
      try {
        let popularFormationId = '4-3-3';
        try {
          const popularRes = await squadPredictionsApi.getPopularFormations('attack');
          if (popularRes.success && popularRes.data && popularRes.data.length > 0) {
            popularFormationId = popularRes.data[0].formation;
          }
        } catch (_) {
          // Varsayılan 4-3-3
        }
        const formation = formations.find(f => f.id === popularFormationId) || formations.find(f => f.id === '4-3-3');
        if (!formation) return;
        
        setAttackFormation(formation.id);
        setDefenseFormation(formation.id);
        
        const autoPlayers: Record<number, typeof players[0] | null> = {};
        const usedPlayerIds = new Set<number>();
        
        formation.positions.forEach((positionType: string, slotIndex: number) => {
          const slotPos = (positionType || '').toUpperCase();
          let candidates = attackTeamPlayers.filter((p: any) => {
            if (usedPlayerIds.has(p.id)) return false;
            const playerPos = (p.position || p.pos || '').toUpperCase();
            if (slotPos === 'GK' || slotPos === 'G') return isGoalkeeperPlayer(p);
            if (isGoalkeeperPlayer(p)) return false;
            if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slotPos)) {
              return playerPos.includes('D') || playerPos.includes('DEF') || playerPos === 'CB' || playerPos === 'LB' || playerPos === 'RB';
            }
            if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(slotPos)) {
              return playerPos.includes('M') || playerPos === 'CM' || playerPos === 'CDM' || playerPos === 'CAM';
            }
            if (['ST', 'LW', 'RW', 'CF'].includes(slotPos)) {
              return playerPos.includes('F') || playerPos.includes('ST') || playerPos.includes('W') || playerPos === 'LW' || playerPos === 'RW';
            }
            return true;
          });
          candidates.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
          if (candidates.length > 0) {
            autoPlayers[slotIndex] = candidates[0];
            usedPlayerIds.add(candidates[0].id);
          } else {
            const remaining = attackTeamPlayers.filter((p: any) => !usedPlayerIds.has(p.id) && !isGoalkeeperPlayer(p));
            if (remaining.length > 0) {
              remaining.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
              autoPlayers[slotIndex] = remaining[0];
              usedPlayerIds.add(remaining[0].id);
            }
          }
        });
        
        setAttackPlayers(autoPlayers);
        setDefensePlayers(autoPlayers);
        setFinishedFormationApplied(true);
      } catch (err) {
        console.warn('Finished match formation apply failed', err);
        setFinishedFormationApplied(true);
      }
    };
    
    const t = setTimeout(applyFinishedMatchFormation, 400);
    return () => clearTimeout(t);
  }, [isMatchFinished, stateRestored, attackTeamPlayers, finishedFormationApplied]);

  // ✅ GERÇEK İLK 11: Lineup API'den gelen formation ve startXI'yı actualAttack/DefenseFormation state'ine yaz
  React.useEffect(() => {
    if (!isKadroLocked || !lineups || lineups.length === 0) return;
    
    // Favori takımın lineup'ını bul
    const targetLineup = lineups.find((l: any) => l.team?.id === attackTeamId) || lineups[0];
    if (!targetLineup?.startXI || targetLineup.startXI.length < 11) return;
    
    // API formation string'ini (e.g. "3-5-2") al veya varsayılan
    const apiFormation = targetLineup.formation || '4-3-3';
    const formObj = formations.find(f => f.id === apiFormation) || formations.find(f => f.id === '4-3-3');
    if (!formObj) return;
    
    // İlk 11 oyuncuları formasyon pozisyonlarına yerleştir
    const actualPlayers: Record<number, any> = {};
    const usedIds = new Set<number>();
    
    formObj.positions.forEach((posType: string, slotIdx: number) => {
      const slotPos = (posType || '').toUpperCase();
      const startXI = targetLineup.startXI.map((item: any) => {
        const p = item.player || item;
        return { ...p, position: normalizePosition(p.pos || p.position), rating: p.rating || 75, number: p.number };
      });
      
      let candidates = startXI.filter((p: any) => {
        if (usedIds.has(p.id)) return false;
        const pPos = (p.position || '').toUpperCase();
        if (slotPos === 'GK' || slotPos === 'G') return isGoalkeeperPlayer(p);
        if (isGoalkeeperPlayer(p)) return false;
        if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slotPos)) return pPos.includes('D') || pPos === 'CB' || pPos === 'LB' || pPos === 'RB';
        if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM'].includes(slotPos)) return pPos.includes('M') || pPos === 'CM' || pPos === 'CDM' || pPos === 'CAM';
        if (['ST', 'LW', 'RW', 'CF'].includes(slotPos)) return pPos.includes('F') || pPos.includes('ST') || pPos.includes('W');
        return true;
      });
      candidates.sort((a: any, b: any) => (b.rating || 75) - (a.rating || 75));
      if (candidates.length > 0) {
        actualPlayers[slotIdx] = candidates[0];
        usedIds.add(candidates[0].id);
      } else {
        const remaining = startXI.filter((p: any) => !usedIds.has(p.id) && !isGoalkeeperPlayer(p));
        if (remaining.length > 0) {
          actualPlayers[slotIdx] = remaining[0];
          usedIds.add(remaining[0].id);
        }
      }
    });
    
    setActualAttackFormation(formObj.id);
    setActualAttackPlayers(actualPlayers);
    // Gerçek maçta defans formasyonu ayrı gelmez, aynı lineup'ı kullan
    setActualDefenseFormation(formObj.id);
    setActualDefensePlayers(actualPlayers);
    
    console.log('✅ Gerçek İlk 11 yüklendi:', formObj.id, Object.keys(actualPlayers).length, 'oyuncu');
  }, [isKadroLocked, lineups, attackTeamId]);

  React.useEffect(() => {
    runRestore();
  }, [squadStorageKey]);

  const prevIsVisibleRef = React.useRef<boolean>(false);
  // ✅ Kadro sekmesine geçildiğinde tekrar yükle; sayfa/tab değişip geri dönülünce sadece o an Atak'ta başla (Defans'ta kalmayı bozma)
  React.useEffect(() => {
    if (isVisible) {
      runRestore();
      const becameVisible = !prevIsVisibleRef.current;
      prevIsVisibleRef.current = true;
      if (becameVisible) setEditingMode('attack'); // Sadece sekme görünür olduğu anda Atak'a dön
    } else {
      prevIsVisibleRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runRestore değişince tekrar Atak'a dönmesin; sadece isVisible değişince
  }, [isVisible]);
  
  // ✅ Her state değişikliğinde AsyncStorage'a kaydet (sekme değişimlerinde korunsun)
  // Kadro tamamlandıysa (isCompleted) attackPlayersArray/defensePlayersArray asla silinmez.
  // ✅ Oynanan/canlı maçta atak dizilişi asla kaybolmasın: existing'de geçerli atak varsa boş/eksik state ile ezme.
  React.useEffect(() => {
    if (!stateRestored) return; // İlk yüklemede kaydetme
    
    const savePartialState = async () => {
      try {
        const key = squadStorageKey;
        const raw = await AsyncStorage.getItem(key);
        const existing = raw ? JSON.parse(raw) : {};
        const wasCompleted = existing.isCompleted === true;
        const existingAttackCount = existing.attackPlayers && typeof existing.attackPlayers === 'object'
          ? Object.keys(existing.attackPlayers).filter((k: string) => existing.attackPlayers[k]).length
          : 0;
        const existingHasAttackArray = existing.attackPlayersArray && Array.isArray(existing.attackPlayersArray) && existing.attackPlayersArray.length >= 11;
        const currentAttackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
        // Restore sonrası ilk save: state henüz güncellenmemişse (current boş, existing dolu) mevcut kadroyu koru
        const preserveRestored = wasCompleted && existingAttackCount >= 11 && currentAttackCount < 11;
        // ✅ Canlı/oynanan maç: Storage'da geçerli atak varsa (11 oyuncu veya isAutoApplied) asla boş/eksik ile ezme
        const existingHasValidAttack = existing.attackFormation && (existingAttackCount >= 11 || existingHasAttackArray || existing.isAutoApplied === true);
        const preserveAttackForLive = isMatchLive && existingHasValidAttack && currentAttackCount < 11;
        const preserve = preserveRestored || preserveAttackForLive;
        // ✅ Kadro sekmesine dönüldüğünde veya canlı maçta atak korunacaksa state'e de yansıt
        // ⚠️ editingMode'u burada DEĞİŞTİRME - kullanıcı Defans'a tıkladıysa orada kalsın
        if (preserve && existing.attackFormation) {
          setAttackFormation(existing.attackFormation);
          setAttackPlayers(existing.attackPlayers || {});
          setDefenseFormation(existing.defenseFormation ?? null);
          setDefensePlayers(existing.defensePlayers || {});
          // editingMode kullanıcı tarafından kontrol edilir, preserve'de override etme
          setDefenseConfirmShown(existing.defenseConfirmShown ?? false);
        }
        
        const updated: Record<string, any> = {
          ...existing,
          matchId,
          attackFormation: preserve ? existing.attackFormation : attackFormation,
          defenseFormation: preserve ? existing.defenseFormation : defenseFormation,
          attackPlayers: preserve ? existing.attackPlayers : attackPlayers,
          defensePlayers: preserve ? existing.defensePlayers : defensePlayers,
          editingMode: preserve ? (existing.editingMode || 'attack') : editingMode,
          defenseConfirmShown: preserve ? (existing.defenseConfirmShown ?? false) : defenseConfirmShown,
          isCompleted: wasCompleted || false,
        };
        
        // ✅ Kadro tamamlandıysa veya canlı maçta atak doluysa Tamamla alanlarını koru
        if (wasCompleted || (isMatchLive && existingHasValidAttack)) {
          if (existing.attackPlayersArray && existing.attackPlayersArray.length >= 11) {
            updated.attackPlayersArray = existing.attackPlayersArray;
          } else {
            const arr = preserve && existing.attackPlayersArray?.length >= 11
              ? existing.attackPlayersArray
              : Object.values(attackPlayers).filter(Boolean);
            if (arr.length >= 11) updated.attackPlayersArray = arr;
          }
          if (existing.defensePlayersArray && existing.defensePlayersArray.length >= 11) {
            updated.defensePlayersArray = existing.defensePlayersArray;
          } else if (updated.defensePlayersArray == null) {
            const defArr = Object.values(defensePlayers).filter(Boolean);
            if (defArr.length >= 11) updated.defensePlayersArray = defArr;
          }
          if (existing.attackFormationName) updated.attackFormationName = existing.attackFormationName;
        }
        
        await AsyncStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Partial state save failed', e);
      }
    };
    savePartialState();
  }, [attackFormation, defenseFormation, attackPlayers, defensePlayers, editingMode, defenseConfirmShown, stateRestored, matchId, squadStorageKey, isMatchLive]);
  
  // ✅ Kullanıcı tahmin yapmış mı? (storage'da isCompleted === true)
  const [hasPrediction, setHasPrediction] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(squadStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setHasPrediction(parsed.isCompleted === true);
        }
      } catch (_) {}
    })();
  }, [squadStorageKey]);
  
  // ✅ Oynanan maçta viewSource: tahmin varsa → user varsayılan, yoksa → community varsayılan
  React.useEffect(() => {
    if (isKadroLocked) {
      setViewSource(hasPrediction ? 'user' : 'community');
    }
  }, [isKadroLocked, hasPrediction]);
  
  // ✅ viewSource + editingMode'a göre gösterilecek formasyon ve oyuncular
  const selectedFormation = React.useMemo(() => {
    if (isKadroLocked) {
      if (viewSource === 'actual') {
        return editingMode === 'attack' ? actualAttackFormation : (actualDefenseFormation ?? actualAttackFormation);
      }
      if (viewSource === 'community') {
        // community = auto-applied formasyon (mevcut attackFormation/defenseFormation = popüler formasyon)
        return editingMode === 'attack' ? attackFormation : (defenseFormation ?? attackFormation);
      }
      // viewSource === 'user' → kullanıcının tahmini (aynı state ama sadece hasPrediction ise göster)
      return editingMode === 'attack' ? attackFormation : (defenseFormation ?? attackFormation);
    }
    // Maç başlamadıysa (eski mantık)
    // ✅ Defans modunda defans formasyonu yoksa atak formasyonunu göster (boş state'e düşmeyi önle)
    return editingMode === 'attack'
      ? attackFormation
      : (defenseFormation ?? attackFormation ?? null);
  }, [isKadroLocked, viewSource, editingMode, attackFormation, defenseFormation, actualAttackFormation, actualDefenseFormation]);
  
  const defensePlayerCount = Object.keys(defensePlayers).filter(k => defensePlayers[parseInt(k)]).length;
  
  const selectedPlayers = React.useMemo(() => {
    if (isKadroLocked) {
      if (viewSource === 'actual') {
        return editingMode === 'attack' ? actualAttackPlayers : (Object.keys(actualDefensePlayers).length > 0 ? actualDefensePlayers : actualAttackPlayers);
      }
      // community ve user: mevcut attack/defense players
      return editingMode === 'attack' ? attackPlayers : defensePlayers;
    }
    // ✅ Maç başlamadıysa: Defans modunda HER ZAMAN defensePlayers göster (boş bile olsa)
    // Kullanıcı defans kadrosunu ayrı seçer
    return editingMode === 'attack' ? attackPlayers : defensePlayers;
  }, [isKadroLocked, viewSource, editingMode, attackPlayers, defensePlayers, actualAttackPlayers, actualDefensePlayers]);
  
  const setSelectedPlayers = editingMode === 'attack' ? setAttackPlayers : setDefensePlayers;
  
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [formationType, setFormationType] = useState<'attack' | 'defense' | 'balanced'>('attack');
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<typeof players[0] | null>(null);
  const [isSaving, setIsSaving] = useState(false); // ✅ Kaydediliyor... göstergesi için
  const [isSquadLocked, setIsSquadLocked] = useState(false); // ✅ Kadro kilitli mi? (Tamamla sonrası)
  
  // ✅ Community Signal Popup State
  const [showCommunitySignal, setShowCommunitySignal] = useState(false);
  const [communitySignalPlayer, setCommunitySignalPlayer] = useState<{ id: number; name: string; position: string } | null>(null);
  // Session-based spam prevention: track which players have been shown signal in this session
  const communitySignalShownRef = React.useRef<Set<number>>(new Set());
  
  // ✅ editingMode değiştiğinde formationType'ı senkronize et
  React.useEffect(() => {
    if (editingMode === 'defense') {
      setFormationType('defense');
    } else if (editingMode === 'attack') {
      setFormationType('attack');
    }
  }, [editingMode]);
  
  // Player Predictions State
  const [playerPredictions, setPlayerPredictions] = useState<Record<number, any>>({});
  
  // ✅ Get attack squad players for defense selection
  const attackSquadPlayers = React.useMemo(() => {
    return Object.values(attackPlayers).filter(Boolean) as typeof players;
  }, [attackPlayers]);
  
  // ✅ Show defense confirmation when attack squad is complete (11 players)
  React.useEffect(() => {
    if (!stateRestored) return; // State restore edilene kadar bekle
    
    const attackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
    
    // Show confirmation only when:
    // 1. Attack squad has 11 players
    // 2. Defense formation not yet selected
    // 3. Confirmation not already shown
    // 4. We're in attack mode
    // 5. Match not live (canlı maçta kadro kilitli, defans modalı gösterme)
    if (attackCount === 11 && !defenseFormation && !defenseConfirmShown && editingMode === 'attack' && !isKadroLocked) {
      setDefenseConfirmShown(true);
      setTimeout(() => {
        setShowDefenseConfirmModal(true);
      }, 500);
    }
  }, [attackPlayers, defenseFormation, defenseConfirmShown, editingMode, stateRestored, isKadroLocked]);

  // Pulsing ball animation
  const scale = useSharedValue(1);
  
  React.useEffect(() => {
    if (!isWeb) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, []);

  const animatedBallStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isWeb ? 1 : scale.value }],
  }));

  const applyFormationChange = (formationId: string, mode?: 'attack' | 'defense') => {
    const formation = formations.find(f => f.id === formationId);
    // ✅ formationType state'ini kullan (modal'dan seçim yapılırken güncel)
    const effectiveMode = mode || formationType;
    
    if (effectiveMode === 'attack') {
      setAttackFormation(formationId);
      setAttackPlayers({});
      setDefenseFormation(null);
      setDefensePlayers({});
      setDefenseConfirmShown(false);
      setHasModifiedSinceUnlock(true); // ✅ Formasyon değişti
      setShowFormationModal(false);
      Alert.alert('Atak Formasyonu Seçildi!', `${formation?.name}\n\nŞimdi 11 oyuncunuzu pozisyonlara yerleştirin.`);
    } else {
      // ✅ Defans formasyonu seçildiğinde: SADECE kaleci otomatik atanır, diğer 10 pozisyon boş kalır
      setDefenseFormation(formationId);
      
      const defFormation = formations.find((f: any) => f.id === formationId);
      const defPlayers: Record<number, typeof players[0] | null> = {};
      
      // ✅ Önce atak kadrosundaki kaleci'yi bul
      let goalkeeper: typeof players[0] | null = null;
      Object.entries(attackPlayers).forEach(([slot, p]) => {
        if (p && isGoalkeeperPlayer(p)) {
          goalkeeper = p;
        }
      });
      
      // ✅ SADECE kaleci defans formasyonunun GK slotuna otomatik atanır
      // Diğer 10 pozisyon BOŞ kalır - kullanıcı atak kadrosundan seçerek doldurur
      if (goalkeeper && defFormation) {
        const gkSlot = defFormation.positions.findIndex((pos: string) => pos === 'GK');
        if (gkSlot !== -1) {
          defPlayers[gkSlot] = goalkeeper;
        }
      }
      
      setDefensePlayers(defPlayers); // SADECE kaleci atanmış, diğer 10 pozisyon boş
      setEditingMode('defense');
      setHasModifiedSinceUnlock(true); // ✅ Formasyon değişti
      
      setShowFormationModal(false);
      Alert.alert(
        'Defans Formasyonu Seçildi',
        `${formation?.name}\n\n✅ Kaleci otomatik olarak defans kalesine atandı.\n\n📋 Şimdi atak kadronuzdan 10 oyuncuyu defans pozisyonlarına yerleştirin.`
      );
    }
    // isCompleted sadece ATAK formasyonu değiştiğinde sıfırlanır (defans değişikliği tahminleri silmez)
    if (effectiveMode === 'attack') {
      (async () => {
        try {
          const key = squadStorageKey;
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.isCompleted = false;
            await AsyncStorage.setItem(key, JSON.stringify(parsed));
          }
        } catch (e) { console.warn('isCompleted reset failed', e); }
      })();
    } else {
      // Defans formasyonu: isCompleted sıfırla (defans yerleştirmesi gerekiyor) ama tahminler silinmez
      (async () => {
        try {
          const key = squadStorageKey;
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.isCompleted = false;
            parsed.attackPlayersArray = Object.values(attackPlayers).filter(Boolean);
            parsed.attackFormation = attackFormation;
            await AsyncStorage.setItem(key, JSON.stringify(parsed));
          }
        } catch (e) { console.warn('Defense formation state save failed', e); }
      })();
    }
  };

  const handleFormationSelect = async (formationId: string) => {
    // ✅ Uyarı SADECE atak formasyonu değiştiğinde: modal'da "Atak" sekmesindeyken farklı formasyon seçilirse.
    // Defans formasyonu seçildiğinde bu uyarı hiç gelmez (defans aynı 11'i kullanır, tahminler silinmez).
    const isAttackFormationChange =
      formationType === 'attack' &&
      attackFormation != null &&
      formationId !== attackFormation;

    if (isAttackFormationChange) {
      // ✅ Uyarı SADECE kadro "Tamamla" ile tamamlanmışsa gösterilir (oyuncu atanmış + Tamamla basılmış)
      let squadIsCompleted = false;
      try {
        const squadRaw = await AsyncStorage.getItem(squadStorageKey);
        if (squadRaw) {
          const squad = JSON.parse(squadRaw);
          squadIsCompleted = squad?.isCompleted === true;
        }
      } catch (_) {}

      if (squadIsCompleted) {
        const clearAndApply = async () => {
          try {
            if (predictionTeamId != null) {
              await AsyncStorage.removeItem(`${STORAGE_KEYS.PREDICTIONS}${matchId}-${predictionTeamId}`);
              await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}-${predictionTeamId}`);
            } else {
              await AsyncStorage.removeItem(STORAGE_KEYS.PREDICTIONS + matchId);
              await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`);
            }
            const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;
            if (userId) {
              await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
            }
            const key = squadStorageKey;
            const raw = await AsyncStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.isCompleted = false;
              await AsyncStorage.setItem(key, JSON.stringify(parsed));
            }
          } catch (e) { console.warn('Clear predictions failed', e); }
          applyFormationChange(formationId);
        };

        setFormationConfirmModal({ formationId });
        return;
      }
    }

    applyFormationChange(formationId);
  };

  const runFormationChangeConfirm = async () => {
    const id = formationConfirmModal?.formationId;
    if (!id) return;
    try {
      if (predictionTeamId != null) {
        await AsyncStorage.removeItem(`${STORAGE_KEYS.PREDICTIONS}${matchId}-${predictionTeamId}`);
        await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}-${predictionTeamId}`);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PREDICTIONS + matchId);
        await AsyncStorage.removeItem(`${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchId}`);
      }
      const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?.id;
      if (userId) await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
      const raw = await AsyncStorage.getItem(squadStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.isCompleted = false;
        await AsyncStorage.setItem(squadStorageKey, JSON.stringify(parsed));
      }
    } catch (e) { console.warn('Clear predictions failed', e); }
    applyFormationChange(id);
    setFormationConfirmModal(null);
    setShowFormationModal(false);
    // ✅ Analiz odağı seçimi tekrar gösterilsin: Dashboard'a dön; kullanıcı maça tıklayınca analiz odağı modal açılır
    onAttackFormationChangeConfirmed?.();
  };
  
  // ✅ Handle defense confirmation
  const handleDefenseConfirmYes = () => {
    setShowDefenseConfirmModal(false);
    setEditingMode('defense');
    setFormationType('defense');
    if (isKadroLocked) return; // Oynanan/canlı maçta formasyon modalı açma (VIEW-ONLY)
    setTimeout(() => {
      setShowFormationModal(true);
    }, 300);
  };
  
  const handleDefenseConfirmNo = () => {
    setShowDefenseConfirmModal(false);
    
    // ✅ Copy attack formation and players to defense (same system for both)
    if (attackFormation) {
      setDefenseFormation(attackFormation);
      setDefensePlayers({ ...attackPlayers }); // ✅ Aynı oyuncular defans için de kopyalanıyor
      
      const formation = formations.find(f => f.id === attackFormation);
      Alert.alert(
        'Kadro Tamamlandı! ⚽',
        `Atak ve defans için aynı formasyon kullanılacak:\n\n${formation?.name}\n\n⚠️ ÖNEMLİ: Bu sayfadan ayrılmadan önce değişiklikleri kaydetmek için "Tamamla" butonuna basmanız gerekiyor.\n\nTamamla'ya basmadan çıkarsanız değişiklikler kaydedilmez!`,
        [
          {
            text: 'Anladım',
            style: 'default',
          }
        ]
      );
    }
  };

  const handlePlayerSelect = (player: typeof players[0]) => {
    // ✅ Sakat veya cezalı oyuncu kadroya eklenemez (kısıt kalkınca tekrar eklenebilir)
    if (player.eligible_for_selection === false || player.injured || player.suspended) {
      Alert.alert(
        'Kadroya Eklenemez',
        'Bu oyuncu sakat veya cezalı. Kadroya ekleyemezsiniz. Sakatlık/ceza kalkınca tekrar ekleyebilirsiniz.'
      );
      return;
    }
    if (selectedSlot !== null) {
      const currentFormation = editingMode === 'attack' ? attackFormation : defenseFormation;
      const formationData = formations.find(f => f.id === currentFormation);
      const slotPosition = formationData?.positions[selectedSlot];
      
      const isGK = isGoalkeeperPlayer(player);
      // ✅ Kaleci yalnızca kale pozisyonuna, saha oyuncusu yalnızca saha pozisyonlarına
      if (isGK && slotPosition !== 'GK') {
        Alert.alert('Kaleci Kısıtlaması', 'Kaleci sadece kale pozisyonuna yerleştirilebilir.');
        return;
      }
      if (slotPosition === 'GK' && !isGK) {
        Alert.alert('Kale Pozisyonu', 'Kale pozisyonuna sadece kaleci yerleştirilebilir.');
        return;
      }
      
      if (editingMode === 'attack') {
        const newAttack = { ...attackPlayers, [selectedSlot]: player };
        setAttackPlayers(newAttack);
        // ✅ ATAK OYUNCUSU DEFANSA OTOMATİK ATANMAZ
        // Kullanıcı defans kadrosunu ayrı seçer
      } else {
        setDefensePlayers({ ...defensePlayers, [selectedSlot]: player });
      }
      
      // ✅ Değişiklik yapıldı - kilit açıldıysa uyarı gösterilecek
      setHasModifiedSinceUnlock(true);
      
      setSelectedSlot(null);
      setShowPlayerModal(false);
      
      const modeText = editingMode === 'attack' ? 'atak' : 'defans';
      Alert.alert('Oyuncu Yerleştirildi!', `${player.name} ${modeText} kadronuza eklendi`);
    }
  };

  const handleRemovePlayer = async (slotIndex: number) => {
    const player = selectedPlayers[slotIndex];
    if (player) {
      setSelectedPlayers({ ...selectedPlayers, [slotIndex]: null });
      
      // ✅ Değişiklik yapıldı - kilit açıldıysa uyarı gösterilecek
      setHasModifiedSinceUnlock(true);
      
      // ✅ Atak modunda oyuncu çıkarılırsa: defans kadrosu ETKİLENMEZ
      // Kullanıcı her kadroyu ayrı yönetir
      
      // Kadro artık 10 kişi (eksik) → isCompleted sıfırla
      try {
        const key = squadStorageKey;
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.isCompleted = false;
          await AsyncStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (e) { console.warn('isCompleted reset failed', e); }
    }
  };

  const handleComplete = async () => {
    const attackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
    const defenseCount = Object.keys(defensePlayers).filter(k => defensePlayers[parseInt(k)]).length;
    
    console.log('🔍 handleComplete called', { attackCount, defenseCount, defenseFormation, editingMode });
    
    // Check if attack squad is complete
    if (attackCount < 11) {
      Alert.alert('Atak Kadrosu Eksik!', `Atak için ${11 - attackCount} oyuncu daha seçmelisiniz.`);
      setEditingMode('attack');
      return;
    }
    
    // If defense formation was selected, check if defense squad is complete
    if (defenseFormation && defenseCount < 11) {
      Alert.alert('Defans Kadrosu Eksik!', `Defans için ${11 - defenseCount} oyuncu daha yerleştirmelisiniz.`);
      setEditingMode('defense');
      return;
    }
    
    // ✅ Kaydediliyor... göster
    setIsSaving(true);
    
    try {
      // Save squad data to AsyncStorage (local backup)
      // Convert Record to array for easier access in MatchPrediction
      const attackPlayersArray = Object.values(attackPlayers).filter(Boolean);
      const defensePlayersArray = defenseFormation 
        ? Object.values(defensePlayers).filter(Boolean)
        : attackPlayersArray;
      
      const formationName = formations.find(f => f.id === attackFormation)?.name || attackFormation;
      const squadData = {
        matchId: matchId,
        attackFormation: attackFormation,
        attackFormationName: formationName,
        defenseFormation: defenseFormation || attackFormation,
        attackPlayers: attackPlayers,
        attackPlayersArray: attackPlayersArray,
        defensePlayers: defenseFormation ? defensePlayers : attackPlayers,
        defensePlayersArray: defensePlayersArray,
        playerPredictions: playerPredictions,
        timestamp: new Date().toISOString(),
        isCompleted: true, // ✅ Tamamla basıldı – Tahmin sekmesinde oyuncular görünecek
        // ✅ Tüm takım kadrosu (yedekler dahil) - MatchPrediction'da oyuncu değişikliği için
        allTeamPlayers: attackTeamPlayers,
      };
      
      await AsyncStorage.setItem(
        squadStorageKey,
        JSON.stringify(squadData)
      );
      
      console.log('✅ Squad saved to local storage!', squadData);
      
      // ✅ Backend'e arka planda kaydet (başarısız olsa da sekme geçişi yapılacak)
      (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const authToken = sessionData?.session?.access_token;
          if (authToken) {
            const result = await squadPredictionsApi.saveSquadPrediction({
              matchId: matchId,
              attackFormation: attackFormation!,
              attackPlayers: attackPlayers,
              defenseFormation: defenseFormation || attackFormation!,
              defensePlayers: defenseFormation ? defensePlayers : attackPlayers,
              analysisFocus: matchData.analysisFocus || 'balanced',
            }, authToken);
            if (result.success) console.log('✅ Squad saved to backend!');
            else console.warn('⚠️ Backend save failed:', result.message);
          }
        } catch (e) {
          console.warn('⚠️ Backend save failed (local OK):', e);
        }
      })();
      
      // ✅ Kadroyu kilitle
      setIsSquadLocked(true);
      
      // ✅ 1 saniye bekle ve Tahmin sekmesine geç
      setTimeout(() => {
        setIsSaving(false);
        if (__DEV__) console.log('🔄 Switching to Prediction tab...');
        InteractionManager.runAfterInteractions(() => {
          if (__DEV__) console.log('🔄 onComplete() called');
          onComplete();
        });
      }, 1000);
    } catch (error) {
      console.error('Error saving squad:', error);
      Alert.alert('Hata!', 'Kadro kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const positions = selectedFormation ? formationPositions[selectedFormation] || formationPositions['4-3-3'] : null;
  const formation = formations.find(f => f.id === selectedFormation);
  const selectedCount = Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length;
  
  // Calculate attack and defense counts for button activation
  const attackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
  const defenseCount = Object.keys(defensePlayers).filter(k => defensePlayers[parseInt(k)]).length;
  
  // Tamamla: atak 11 VE (defans yok VEYA defans 11) olduğunda aktif
  const isCompleteButtonActive = attackCount === 11 && (!defenseFormation || defenseCount === 11);

  // Empty State (No Formation Selected) - saha aynı minHeight ile küçülmesin
  if (!selectedFormation) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <FootballField style={[styles.mainField, fieldDynamicStyle]}>
            <View style={styles.emptyStateContent}>
              <Animated.View style={[styles.emptyStateBall, animatedBallStyle]}>
                <Text style={styles.emptyStateBallEmoji}>⚽</Text>
              </Animated.View>
              <Text style={styles.emptyStateTitle}>Kadro Oluştur</Text>
              <Text style={styles.emptyStateSubtitle}>
                Tahminlerinize başlamak için atak ve defans formasyonlarını seçip oyuncuları pozisyonlarına atayın
              </Text>
            </View>
          </FootballField>

          <TouchableOpacity
            style={styles.selectFormationButton}
            onPress={() => {
              if (isKadroLocked) { showKadroLockedToast(); return; }
              setShowFormationModal(true);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1FA2A6', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Formasyon Seç</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Formation Modal - Boş state'te de defans seçilebilir (atak 11 tamamlandıysa) */}
        <FormationModal
          visible={showFormationModal}
          formations={formations}
          formationType={formationType}
          onSelect={handleFormationSelect}
          onClose={() => setShowFormationModal(false)}
          onTabChange={setFormationType}
          canSelectDefense={attackFormation != null && attackCount === 11}
          currentAttackFormation={attackFormation}
          currentDefenseFormation={defenseFormation}
        />
      </View>
    );
  }

  // Main Squad Screen (Formation Selected)
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Football Field with Players */}
        <FootballField style={[styles.mainField, fieldDynamicStyle]}>
          <View style={styles.playersContainer}>
            {positions?.map((pos, index) => {
              const player = selectedPlayers[index];
              const positionLabel = formation?.positions[index] || '';

              return (
                <View
                  key={player ? `player-${player.id}-${index}` : `slot-${index}`} // ✅ Stable key - sıçramayı önler
                  style={[
                    styles.playerSlot,
                    { left: `${pos.x}%`, top: `${pos.y}%` }, // ✅ Sabit pozisyon - animasyon yok
                  ]}
                >
                  {player ? (() => {
                    const subOut = subOutData?.players[player.id] ?? subOutData?.players[String(player.id)];
                    const total = subOutData?.totalPredictors ?? 1;
                    const subOutRate = subOut ? subOut.subOutVotes / total : 0;
                    const replacementName = subOut?.replacementName ?? null;
                    const showSubOut = subOutRate >= 0.10;
                    const subOutTier = subOutRate >= 0.30 ? 'high' : subOutRate >= 0.20 ? 'mid' : 'low';
                    const showSubOutAlert = () => {
                      const pct = Math.round(subOutRate * 100);
                      let msg = `Kullanıcıların %${pct}'i bu oyuncunun oyundan çıkması gerektiğini düşünüyor.`;
                      if (replacementName) msg += `\n\nBu görüşte olanların bir kısmı yerine ${replacementName} girmeli diyor.`;
                      Alert.alert('Topluluk görüşü', msg);
                    };
                    return (
                    <View style={[
                      styles.playerCardWrapper,
                      showSubOut && styles.subOutOuter,
                      showSubOut && subOutTier === 'low' && styles.subOutBorderThin,
                      showSubOut && subOutTier === 'mid' && styles.subOutBorderThick,
                      showSubOut && subOutTier === 'high' && styles.subOutBorderPulse,
                    ]}>
                        {showSubOut && (
                          <TouchableOpacity
                            style={styles.subOutInfoIcon}
                            onPress={showSubOutAlert}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="information-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                        {/* Remove button - Top Right (Değiştir ikonu kaldırıldı) */}
                        {/* ✅ Kilit açıksa ve maç kilitli değilse göster */}
                        {!isKadroLocked && !isSquadLocked && (
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemovePlayer(index)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}

                        {/* Player Card - Main */}
                        <TouchableOpacity
                          style={[
                            styles.playerCard,
                            // Gold border for elite players (85+)
                            player.rating >= 85 && styles.playerCardElite,
                            // Blue border for goalkeepers
                            isGoalkeeperPlayer(player) && styles.playerCardGK,
                          ]}
                          onPress={() => setSelectedPlayerForDetail(player)}
                          onLongPress={isKadroLocked ? undefined : () => handleRemovePlayer(index)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#1E3A3A', '#0F2A24']} // ✅ Design System
                            style={styles.playerCardGradient}
                          >
                            {/* Injury/Alert Badge - Top Right */}
                            {player.injury && (
                              <View style={styles.alertBadge}>
                                <View style={styles.alertDot} />
                              </View>
                            )}

                            {/* Jersey Number Badge - Top Center */}
                            <View style={styles.jerseyNumberBadge}>
                              <Text style={styles.jerseyNumberText}>
                                {player.number || player.id}
                              </Text>
                            </View>

                            {/* Player Name - Center */}
                            <Text style={styles.playerName} numberOfLines={1}>
                              {player.name.split(' ').pop()}
                            </Text>

                            {/* Rating and Position - Same row, bottom */}
                            <View style={styles.playerBottomRow}>
                              <Text style={styles.playerRatingBottom}>{player.rating}</Text>
                              <Text style={styles.playerPositionBottom}>{positionLabel}</Text>
                            </View>

                            {/* Form indicator - Subtle glow */}
                            {player.form >= 8 && (
                              <View style={styles.formGlow} />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    );
                  })() : (
                    <TouchableOpacity
                      style={styles.emptySlot}
                      onPress={() => {
                        if (isKadroLocked) { showKadroLockedToast(); return; }
                        // ✅ Kullanıcı kilidi kontrolü
                        if (isSquadLocked) {
                          Alert.alert(
                            '🔒 Kadro Kilitli',
                            'Kadro tamamlandı ve kilitli. Değişiklik yapmak için kilidi açın.',
                            [
                              { text: 'İptal', style: 'cancel' },
                              { text: 'Kilidi Aç', style: 'destructive', onPress: () => setIsSquadLocked(false) },
                            ]
                          );
                          return;
                        }
                        setSelectedSlot(index);
                        setShowPlayerModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.emptySlotContent}>
                        <Ionicons name="add" size={20} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.emptySlotText}>{positionLabel}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </FootballField>

        {/* Bottom Info Bar – oynanan maçta tek satır: Tahminin/Gerçek 11/Topluluk + Atak/Defans */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            {isKadroLocked ? (
              <>
                <View style={styles.unifiedToolbarRow}>
                  <View style={styles.viewSourceRow}>
                    {hasPrediction && (
                      <TouchableOpacity
                        style={[styles.viewSourcePill, viewSource === 'user' && styles.viewSourcePillActive]}
                        onPress={() => setViewSource('user')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="person" size={12} color={viewSource === 'user' ? '#FFFFFF' : '#9CA3AF'} />
                        <Text style={[styles.viewSourceText, viewSource === 'user' && styles.viewSourceTextActive]}>Tahminin</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.viewSourcePill, viewSource === 'actual' && styles.viewSourcePillActive]}
                      onPress={() => setViewSource('actual')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="football" size={12} color={viewSource === 'actual' ? '#FFFFFF' : '#9CA3AF'} />
                      <Text style={[styles.viewSourceText, viewSource === 'actual' && styles.viewSourceTextActive]}>Gerçek 11</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewSourcePill, viewSource === 'community' && styles.viewSourcePillActive]}
                      onPress={() => setViewSource('community')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="people" size={12} color={viewSource === 'community' ? '#FFFFFF' : '#9CA3AF'} />
                      <Text style={[styles.viewSourceText, viewSource === 'community' && styles.viewSourceTextActive]}>Topluluk</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.viewToggleRow}>
                    <TouchableOpacity
                      style={[styles.viewTogglePill, editingMode === 'attack' && styles.viewTogglePillActive]}
                      onPress={() => setEditingMode('attack')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.viewToggleText, editingMode === 'attack' && styles.viewToggleTextActive]}>Atak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewTogglePill, editingMode === 'defense' && styles.viewTogglePillActive]}
                      onPress={() => setEditingMode('defense')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.viewToggleText, editingMode === 'defense' && styles.viewToggleTextActive]}>Defans</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.changeFormationText} numberOfLines={1}>{formation?.name}</Text>
              </>
            ) : (
              // ✅ SİMETRİK TOOLBAR: [2 Satırlı Formasyon] | 🔓 | [Tamamla]
              <View style={styles.symmetricToolbar}>
                {/* Sol: 2 Satırlı Formasyon Butonu */}
                <TouchableOpacity
                  style={styles.dualLineFormationButton}
                  onPress={() => {
                    // Henüz formasyon seçilmediyse atak modal'ı aç
                    setFormationType('attack');
                    setShowFormationModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Satır 1: Atak */}
                  <View style={[
                    styles.formationLine,
                    editingMode === 'attack' && styles.formationLineActive
                  ]}>
                    <Ionicons name="flash" size={14} color={editingMode === 'attack' ? '#F59E0B' : '#1FA2A6'} />
                    <Text style={[
                      styles.formationLineText,
                      editingMode === 'attack' && styles.formationLineTextActive
                    ]} numberOfLines={1}>
                      {attackFormation 
                        ? formations.find(f => f.id === attackFormation)?.name || attackFormation
                        : ''}
                    </Text>
                  </View>
                  {/* Satır 2: Defans */}
                  <View style={[
                    styles.formationLine,
                    editingMode === 'defense' && styles.formationLineActive
                  ]}>
                    <Ionicons name="shield" size={14} color={editingMode === 'defense' ? '#3B82F6' : '#1FA2A6'} />
                    <Text style={[
                      styles.formationLineText,
                      editingMode === 'defense' && styles.formationLineTextActive
                    ]} numberOfLines={1}>
                      {defenseFormation 
                        ? formations.find(f => f.id === defenseFormation)?.name || defenseFormation
                        : ''}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Orta: Kilit */}
                {!isKadroLocked && (
                  <TouchableOpacity
                    style={[
                      styles.lockButtonCenter,
                      isSquadLocked ? styles.lockButtonCenterLocked : (isCompleteButtonActive ? styles.lockButtonCenterOpen : styles.lockButtonCenterDisabled)
                    ]}
                    onPress={() => {
                      if (isSquadLocked) {
                        Alert.alert(
                          'Kadro Kilidi',
                          'Kadro kilitli. Kilidi açarak değişiklik yapabilirsiniz.\n\nKilidi açmak istiyor musunuz?',
                          [
                            { text: 'İptal', style: 'cancel' },
                            { text: 'Kilidi Aç', style: 'destructive', onPress: () => setIsSquadLocked(false) },
                          ]
                        );
                      } else if (isCompleteButtonActive) {
                        Alert.alert('Kadro Açık', 'Değişiklikleri kaydetmek için "Tamamla" butonuna basın.', [{ text: 'Tamam' }]);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={isSquadLocked ? "lock-closed" : "lock-open"} 
                      size={20} 
                      color={isSquadLocked ? '#EF4444' : (isCompleteButtonActive ? '#10B981' : '#64748B')} 
                    />
                  </TouchableOpacity>
                )}

                {/* Sağ: Tamamla - Sol butonla simetrik boyut */}
                {!isKadroLocked && !isSquadLocked && (
                  <TouchableOpacity
                    style={[
                      styles.completeButtonSymmetric,
                      !isCompleteButtonActive && styles.completeButtonSymmetricDisabled,
                    ]}
                    onPress={handleComplete}
                    disabled={!isCompleteButtonActive}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.completeButtonSymmetricText}>Tamamla</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Player Selection Modal - Defans: sadece atak 11'i. Canlı maçta atak: sadece mevcut 11 (formasyon/yerleşim değişikliği aynı 11 ile). */}
      <PlayerModal
        visible={showPlayerModal}
        players={editingMode === 'defense' && attackSquadPlayers.length === 11
          ? attackSquadPlayers.filter((p: any) =>
              !Object.entries(defensePlayers).some(([i, pl]) => Number(i) !== selectedSlot && pl?.id === p.id)
            )
          : editingMode === 'attack' && isMatchLive && attackSquadPlayers.length === 11
            ? attackSquadPlayers.filter((p: any) =>
                !Object.entries(attackPlayers).some(([i, pl]) => Number(i) !== selectedSlot && pl?.id === p.id)
              )
            : attackTeamPlayers}
        selectedPlayers={selectedPlayers}
        positionLabel={selectedSlot !== null ? formation?.positions[selectedSlot] : ''}
        onSelect={handlePlayerSelect}
        onClose={() => {
          setShowPlayerModal(false);
          setSelectedSlot(null);
        }}
        isDefenseMode={editingMode === 'defense'}
        isLoadingSquad={isLoadingSquad}
        hasBackendError={!isLoadingSquad && squadPlayers.length === 0 && !lineups?.length && editingMode === 'attack'}
        onRetrySquad={retrySquadFetch}
      />

      {/* ✅ Community Signal Popup - Shows when user initiates player replacement */}
      <CommunitySignalPopup
        visible={showCommunitySignal}
        onClose={() => setShowCommunitySignal(false)}
        onSelectReplacement={(player) => {
          // When user selects a replacement from community suggestions
          if (selectedSlot !== null) {
            handlePlayerSelect(player);
          }
          setShowCommunitySignal(false);
        }}
        matchId={parseInt(matchId, 10) || 0}
        teamId={predictionTeamId || attackTeamId || 0}
        currentPlayer={communitySignalPlayer}
        userLineup={selectedPlayers}
        formationId={selectedFormation || '4-3-3'}
        availablePlayers={editingMode === 'defense' || (isMatchLive && attackSquadPlayers.length === 11) ? attackSquadPlayers : attackTeamPlayers}
      />

      {/* Formation Modal - Defans sekmesi sadece atak formasyonu seçilip 11 oyuncu yerleştirildiyse aktif */}
      <FormationModal
        visible={showFormationModal}
        formations={formations}
        formationType={formationType}
        onSelect={handleFormationSelect}
        onClose={() => setShowFormationModal(false)}
        onTabChange={setFormationType}
        canSelectDefense={attackFormation != null && attackCount === 11}
        currentAttackFormation={attackFormation}
        currentDefenseFormation={defenseFormation}
      />

      {/* Player Detail Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          player={selectedPlayerForDetail}
          onClose={() => setSelectedPlayerForDetail(null)}
          matchId={matchId}
          positionLabel={selectedSlot !== null ? formation?.positions[selectedSlot] : selectedPlayerForDetail?.position}
        />
      )}

      {/* ✅ Defense Confirmation Modal */}
      <Modal
        visible={showDefenseConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDefenseConfirmModal(false)}
      >
        <View style={styles.defenseConfirmOverlay}>
          <View style={styles.defenseConfirmModal}>
            {/* Icon */}
            <View style={styles.defenseConfirmIcon}>
              <Ionicons name="shield-checkmark" size={48} color="#1FA2A6" />
            </View>
            
            {/* Title */}
            <Text style={styles.defenseConfirmTitle}>Defans Formasyonu</Text>
            
            {/* Description */}
            <Text style={styles.defenseConfirmDesc}>
              Atak kadronuz tamamlandı! Defans için farklı bir formasyon kullanmak ister misiniz?
            </Text>
            
            {/* Info Box */}
            <View style={styles.defenseConfirmInfo}>
              <Ionicons name="information-circle" size={18} color="#F59E0B" />
              <Text style={styles.defenseConfirmInfoText}>
                <Text style={{ fontWeight: '700' }}>Evet:</Text> Defans formasyonu seçip sadece kaleci otomatik kalır, diğer 10 oyuncuyu defans pozisyonlarına manuel yerleştirirsiniz.{'\n'}
                <Text style={{ fontWeight: '700' }}>Hayır:</Text> Atak formasyonu ve oyuncuları defans için de aynen kullanılır.
              </Text>
            </View>
            
            {/* Buttons */}
            <View style={styles.defenseConfirmButtons}>
              <TouchableOpacity
                style={styles.defenseConfirmNoBtn}
                onPress={handleDefenseConfirmNo}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                <Text style={styles.defenseConfirmNoText}>Hayır, Devam Et</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.defenseConfirmYesBtn}
                onPress={handleDefenseConfirmYes}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.defenseConfirmYesGradient}
                >
                  <Ionicons name="shield" size={20} color="#FFFFFF" />
                  <Text style={styles.defenseConfirmYesText}>Evet, Seç</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Atak formasyonu değişikliği – uygulama içi onay popup */}
      {formationConfirmModal && (
        <ConfirmModal
          visible={true}
          title="Atak formasyonu değişikliği"
          message="Sadece ATAK formasyonu değişiyor – tüm tahmin verileriniz silinecek. Defans formasyonu veya oyuncu değişikliği bu uyarıyı göstermez. Devam?"
          buttons={[
            {
              text: 'İptal',
              style: 'cancel',
              onPress: () => {
                setShowFormationModal(false);
                setFormationConfirmModal(null);
              },
            },
            {
              text: 'Onayla',
              style: 'destructive',
              onPress: () => runFormationChangeConfirm(),
            },
          ]}
          onRequestClose={() => {
            setShowFormationModal(false);
            setFormationConfirmModal(null);
          }}
        />
      )}
      
      {/* ✅ Kaydediliyor... Overlay */}
      {isSaving && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.savingOverlay}>
            <View style={styles.savingContainer}>
              <ActivityIndicator size="large" color="#1FA2A6" />
              <Text style={styles.savingText}>Kaydediliyor...</Text>
              <Text style={styles.savingSubtext}>Kadronuz kaydediliyor, lütfen bekleyin</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Formation Modal Component - 3 COLUMN GRID
const FormationModal = ({ visible, formations, formationType, onSelect, onClose, onTabChange, canSelectDefense = true, currentAttackFormation, currentDefenseFormation }: any) => {
  // ✅ Mevcut sekmede seçili formasyon
  const currentSelectedFormation = formationType === 'defense' ? currentDefenseFormation : currentAttackFormation;
  const [selectedFormationForDetail, setSelectedFormationForDetail] = useState<any>(null);
  const [hoveredFormation, setHoveredFormation] = useState<any>(null); // ✅ Önizleme için
  
  // ✅ Formasyon popülerlik verileri (API'den gelecek, şimdilik mock)
  const [formationPopularity, setFormationPopularity] = React.useState<Record<string, number>>({});
  const [popularityLoading, setPopularityLoading] = React.useState(true);
  
  // ✅ Formasyon popülerlik verilerini yükle
  React.useEffect(() => {
    if (!visible) return;
    
    const loadPopularity = async () => {
      setPopularityLoading(true);
      try {
        // TODO: Gerçek API entegrasyonu
        // const result = await squadPredictionsApi.getFormationPopularity(formationType);
        
        // ✅ Mock data - Toplam %100 olacak şekilde dağıtılmış (formationType'a göre)
        // Atak için popüler formasyonlar
        const attackPopularity: Record<string, number> = {
          '4-3-3': 18,
          '4-2-3-1': 14,
          '4-4-2': 11,
          '3-4-3': 9,
          '4-1-2-3': 8,
          '3-5-2': 7,
          '4-3-3-holding': 6,
          '4-3-3-false9': 5,
          '4-1-4-1': 4,
          '4-3-1-2': 4,
          '3-4-1-2': 3,
          '4-2-2-2': 3,
          '4-4-2-diamond': 2,
          '4-2-4': 2,
          '2-3-5': 1,
          '3-3-3-1': 1,
          '3-3-4': 1,
          '3-4-2-1': 1,
        };
        
        // Defans için popüler formasyonlar
        const defensePopularity: Record<string, number> = {
          '5-4-1': 16,
          '5-3-2': 14,
          '4-5-1': 12,
          '4-4-2': 10,
          '4-1-4-1': 9,
          '3-5-2': 8,
          '4-2-3-1': 6,
          '4-3-3-holding': 5,
          '5-2-3': 4,
          '4-4-1-1': 4,
          '4-3-2-1': 3,
          '4-1-3-2': 3,
          '3-6-1': 2,
          '4-3-3': 2,
          '3-4-3': 1,
          '4-3-1-2': 1,
        };
        
        // Seçilen tipe göre popülerlik dağılımı
        const baseData = formationType === 'defense' ? defensePopularity : attackPopularity;
        const mockData: Record<string, number> = { ...baseData };
        
        // Eksik formasyonlara düşük değer ver (toplam %100 olsun)
        let totalAssigned = Object.values(mockData).reduce((a, b) => a + b, 0);
        const remaining = 100 - totalAssigned;
        const unassignedFormations = formations.filter((f: any) => !mockData[f.id]);
        
        if (unassignedFormations.length > 0 && remaining > 0) {
          const perFormation = Math.floor(remaining / unassignedFormations.length);
          unassignedFormations.forEach((f: any, i: number) => {
            mockData[f.id] = i === unassignedFormations.length - 1 
              ? remaining - (perFormation * (unassignedFormations.length - 1)) // Son formasyona kalanı ver
              : perFormation;
          });
        }
        
        setFormationPopularity(mockData);
      } catch (error) {
        console.warn('Formation popularity load failed', error);
      }
      setPopularityLoading(false);
    };
    
    loadPopularity();
  }, [visible, formationType, formations]);
  
  // ✅ Defans sekmesi sadece atak formasyonu seçilip 11 oyuncu yerleştirildiyse seçilebilir
  React.useEffect(() => {
    if (visible && formationType === 'defense' && !canSelectDefense) {
      onTabChange('attack');
    }
  }, [visible, formationType, canSelectDefense, onTabChange]);
  
  // ✅ Tüm formasyonları göster (filtreleme yok - kullanıcı istediği formasyonu seçebilir)
  const filteredFormations = formations;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={Platform.OS === 'web' ? undefined : SlideInDown.duration(300)}
            exiting={Platform.OS === 'web' ? undefined : SlideOutDown.duration(300)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>
                  {formationType === 'defense' ? 'Defans Formasyonu Seçin' : 'Atak Formasyonu Seçin'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formationType === 'defense' ? 'Defans için formasyon seçiniz' : 'Atak için formasyon seçin'}
                </Text>
              </View>
            </View>

            {/* ✅ Atak / Defans sekme butonları */}
            <View style={styles.formationModalTabs}>
              <TouchableOpacity
                style={[styles.formationModalTab, formationType === 'attack' && styles.formationModalTabActive]}
                onPress={() => onTabChange('attack')}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color={formationType === 'attack' ? '#FFFFFF' : '#1FA2A6'} />
                <Text style={[styles.formationModalTabText, formationType === 'attack' && styles.formationModalTabTextActive]}>
                  Atak
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formationModalTab,
                  formationType === 'defense' && styles.formationModalTabActive,
                  !canSelectDefense && styles.formationModalTabDisabled,
                ]}
                onPress={() => {
                  if (!canSelectDefense) {
                    Alert.alert(
                      'Önce Atak Kadrosu',
                      'Defans formasyonu seçebilmek için önce atak formasyonunu seçin ve 11 oyuncuyu yerleştirin.'
                    );
                    return;
                  }
                  onTabChange('defense');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={18} color={formationType === 'defense' ? '#FFFFFF' : canSelectDefense ? '#3B82F6' : '#6B7280'} />
                <Text style={[styles.formationModalTabText, formationType === 'defense' && styles.formationModalTabTextActive, !canSelectDefense && formationType !== 'defense' && styles.formationModalTabTextDisabled]}>
                  Defans
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button - Absolute Position */}
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButtonAbsolute}>
              <Ionicons name="close" size={22} color="#1FA2A6" />
            </TouchableOpacity>

            {/* Formations Grid - 3 Columns */}
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.formationGridContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredFormations.map((formation: any) => {
                const isCurrentlySelected = formation.id === currentSelectedFormation;
                return (
                <View key={formation.id} style={styles.formationGridItem}>
                  <TouchableOpacity
                    style={[
                      styles.formationCard,
                      hoveredFormation?.id === formation.id && styles.formationCardSelected,
                      isCurrentlySelected && styles.formationCardCurrentlySelected,
                    ]}
                    onPress={() => setHoveredFormation(formation)}
                    activeOpacity={0.8}
                  >
                    {/* ✅ Seçili Formasyon Tik İşareti */}
                    {isCurrentlySelected && (
                      <View style={styles.formationSelectedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      </View>
                    )}
                    {/* Formation ID */}
                    <Text style={[
                      styles.formationCardId,
                      hoveredFormation?.id === formation.id && { color: '#1FA2A6' },
                      isCurrentlySelected && { color: '#10B981' },
                    ]}>
                      {formation.id.replace(/-holding|-false9|-diamond|-attack/g, '')}
                    </Text>

                    {/* Formation Subtitle - From parentheses */}
                    <Text style={[
                      styles.formationCardSubtitle,
                      isCurrentlySelected && { color: '#10B981' },
                    ]} numberOfLines={1}>
                      {(() => {
                        const parts = formation.name.split('(');
                        if (parts.length > 1) {
                          return parts[1].replace(')', '').trim();
                        }
                        // If no parentheses, show type or formation style
                        return formation.type === 'attack' ? 'Attack' : 
                               formation.type === 'defense' ? 'Defense' : 'Balanced';
                      })()}
                    </Text>
                  </TouchableOpacity>
                </View>
              );})}
            </ScrollView>
            
          </Animated.View>
        </View>
      </Modal>

      {/* ✅ Formation Preview Modal - Ayrı popup olarak açılıyor */}
      {hoveredFormation && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setHoveredFormation(null)}
        >
          <View style={styles.formationPreviewOverlay}>
            <View style={styles.formationPreviewModal}>
              {/* Header */}
              <View style={styles.formationPreviewHeader}>
                <View style={styles.formationPreviewTitleRow}>
                  <Text style={styles.formationPreviewName}>{hoveredFormation.name}</Text>
                  <TouchableOpacity 
                    onPress={() => setHoveredFormation(null)}
                    style={styles.formationPreviewCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
                <View style={[
                  styles.formationPreviewTypeBadge,
                  { backgroundColor: hoveredFormation.type === 'attack' ? 'rgba(239, 68, 68, 0.2)' : 
                    hoveredFormation.type === 'defense' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)' }
                ]}>
                  <Text style={[
                    styles.formationPreviewTypeText,
                    { color: hoveredFormation.type === 'attack' ? '#EF4444' : 
                      hoveredFormation.type === 'defense' ? '#3B82F6' : '#F59E0B' }
                  ]}>
                    {hoveredFormation.type === 'attack' ? '⚔️ Atak' : 
                     hoveredFormation.type === 'defense' ? '🛡️ Defans' : '⚖️ Dengeli'}
                  </Text>
                </View>
                {formationType === 'defense' && (
                  <Text style={styles.formationPreviewContextHint}>
                    🛡️ Bu formasyon defans dizilişi için seçiliyor
                  </Text>
                )}
              </View>

              {/* Description */}
              <Text style={styles.formationPreviewDesc}>
                {hoveredFormation.description}
              </Text>

              {/* Pros */}
              <View style={styles.formationPreviewSection}>
                <Text style={styles.formationPreviewSectionTitle}>✅ Avantajlar</Text>
                {hoveredFormation.pros?.map((pro: string, index: number) => (
                  <View key={index} style={styles.formationPreviewListItem}>
                    <View style={styles.formationPreviewBullet} />
                    <Text style={styles.formationPreviewListText}>{pro}</Text>
                  </View>
                ))}
              </View>

              {/* Cons */}
              <View style={styles.formationPreviewSection}>
                <Text style={styles.formationPreviewSectionTitle}>❌ Dezavantajlar</Text>
                {hoveredFormation.cons?.map((con: string, index: number) => (
                  <View key={index} style={styles.formationPreviewListItem}>
                    <View style={[styles.formationPreviewBullet, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.formationPreviewListText}>{con}</Text>
                  </View>
                ))}
              </View>

              {/* Best For */}
              <View style={styles.formationPreviewBestFor}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
                <Text style={styles.formationPreviewBestForText}>
                  <Text style={styles.formationPreviewBestForLabel}>En İyi: </Text>
                  {hoveredFormation.bestFor}
                </Text>
              </View>
              
              {/* ✅ Topluluk Tercihi - Formasyon Popülerliği - DİKKAT ÇEKİCİ */}
              <View style={styles.formationPopularitySection}>
                <View style={styles.formationPopularityHeader}>
                  <Ionicons name="flame" size={18} color="#F97316" />
                  <Text style={styles.formationPopularitySectionTitle}>🔥 Topluluk Tercihi</Text>
                </View>
                {popularityLoading ? (
                  <Text style={styles.formationPopularityLoading}>Yükleniyor...</Text>
                ) : (
                  <View style={styles.formationPopularityContent}>
                    <Text style={styles.formationPopularityText}>
                      Kullanıcıların <Text style={styles.formationPopularityHighlight}>%{formationPopularity[hoveredFormation.id] || 0}</Text>'i {formationType === 'defense' ? 'defans' : 'atak'} için bu formasyonun olması gerektiğini düşünüyor
                    </Text>
                    <View style={styles.formationPopularityBarBg}>
                      <View 
                        style={[
                          styles.formationPopularityBarFill,
                          { 
                            width: `${formationPopularity[hoveredFormation.id] || 0}%`,
                            backgroundColor: (formationPopularity[hoveredFormation.id] || 0) >= 50 ? '#F97316' : 
                              (formationPopularity[hoveredFormation.id] || 0) >= 25 ? '#FB923C' : '#FDBA74' // Turuncu tonları
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>
              
              {/* Buttons */}
              <View style={styles.formationPreviewButtons}>
                <TouchableOpacity
                  style={styles.formationPreviewCancelBtn}
                  onPress={() => setHoveredFormation(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formationPreviewCancelText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.formationPreviewSelectBtn}
                  onPress={() => {
                    onSelect(hoveredFormation.id);
                    setHoveredFormation(null);
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#1FA2A6', '#0D9488', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.formationPreviewSelectGradient}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.formationPreviewSelectText}>
                      {formationType === 'defense' ? 'Bu Defans Dizilişini Seç' : 'Bu Dizilişi Seç'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

// Formation Detail Modal Component
const FormationDetailModal = ({ formation, onClose, onSelect }: any) => (
  <Modal
    visible={true}
    animationType="fade"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.formationDetailOverlay}>
      <Animated.View 
        entering={isWeb ? undefined : ZoomIn.duration(300)}
        style={styles.formationDetailContent}
      >
        {/* Header - Fixed at top */}
        <View style={styles.formationDetailHeader}>
          <View style={styles.formationDetailHeaderLeft}>
            <Text style={styles.formationDetailTitle}>{formation.name}</Text>
            <View style={styles.formationDetailTypeBadge}>
              <Text style={styles.formationDetailTypeText}>
                {formation.type === 'attack' ? '⚔️ Atak' : formation.type === 'defense' ? '🛡️ Defans' : '⚖️ Dengeli'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.formationDetailCloseButton}>
            <Ionicons name="close-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.formationDetailScrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={styles.formationDetailDescription}>{formation.description}</Text>

          {/* Pros */}
          <View style={styles.formationDetailSection}>
            <Text style={styles.formationDetailSectionTitle}>✅ Artılar</Text>
            {formation.pros.map((pro: string, index: number) => (
              <View key={index} style={styles.formationDetailListItem}>
                <View style={styles.formationDetailBullet} />
                <Text style={styles.formationDetailListText}>{pro}</Text>
              </View>
            ))}
          </View>

          {/* Cons */}
          <View style={styles.formationDetailSection}>
            <Text style={styles.formationDetailSectionTitle}>❌ Eksiler</Text>
            {formation.cons.map((con: string, index: number) => (
              <View key={index} style={styles.formationDetailListItem}>
                <View style={styles.formationDetailBullet} />
                <Text style={styles.formationDetailListText}>{con}</Text>
              </View>
            ))}
          </View>

          {/* Best For */}
          <View style={styles.formationDetailBestFor}>
            <Ionicons name="trophy" size={20} color="#F59E0B" />
            <View style={styles.formationDetailBestForContent}>
              <Text style={styles.formationDetailBestForLabel}>En İyi Kullanım:</Text>
              <Text style={styles.formationDetailBestForText}>{formation.bestFor}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Select Button - Fixed at bottom */}
        <TouchableOpacity
          onPress={() => {
            console.log('✅ Formasyon seçildi:', formation.id);
            onSelect(formation);
          }}
          style={styles.formationDetailSelectButton}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1FA2A6', '#0D9488', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.formationDetailSelectGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.formationDetailSelectText}>Bu Formasyonu Seç</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </Modal>
);

// Player Modal Component - COMPLETE
// Kaleci pozisyonuna yalnızca kaleci, saha pozisyonlarına yalnızca saha oyuncusu atanabilir.
const PlayerModal = ({ visible, players, selectedPlayers, positionLabel, onSelect, onClose, isDefenseMode, isLoadingSquad = false, hasBackendError = false, onRetrySquad }: any) => {
  const [previewPlayer, setPreviewPlayer] = useState<any>(null);
  
  // ✅ Preview oyuncusu için topluluk istatistikleri
  const [previewCommunityStats, setPreviewCommunityStats] = React.useState<{
    inStartingXI: number;
    inThisPosition: number;
    loading: boolean;
  }>({ inStartingXI: 0, inThisPosition: 0, loading: true });
  
  // ✅ Preview oyuncusu değiştiğinde topluluk istatistiklerini yükle
  React.useEffect(() => {
    if (!previewPlayer) {
      setPreviewCommunityStats({ inStartingXI: 0, inThisPosition: 0, loading: true });
      return;
    }
    
    const loadStats = async () => {
      setPreviewCommunityStats(prev => ({ ...prev, loading: true }));
      try {
        // TODO: Gerçek API entegrasyonu
        // Mock data - rating'e göre gerçekçi değerler
        const baseXI = previewPlayer.rating >= 85 ? 78 : previewPlayer.rating >= 80 ? 62 : previewPlayer.rating >= 75 ? 48 : 32;
        const basePosition = previewPlayer.rating >= 85 ? 68 : previewPlayer.rating >= 80 ? 52 : previewPlayer.rating >= 75 ? 38 : 24;
        const variance = Math.floor(Math.random() * 12);
        
        // Kısa bir gecikme ile daha gerçekçi görünsün
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setPreviewCommunityStats({
          inStartingXI: Math.min(95, baseXI + variance),
          inThisPosition: Math.min(90, basePosition + variance),
          loading: false,
        });
      } catch (error) {
        setPreviewCommunityStats({ inStartingXI: 0, inThisPosition: 0, loading: false });
      }
    };
    
    loadStats();
  }, [previewPlayer]);

  const isGKPosition = positionLabel === 'GK';

  // Check if player can be assigned to current slot (GK slot → only GK, field → only field)
  const isPlayerEligible = (player: any) =>
    isGKPosition ? isGoalkeeperPlayer(player) : !isGoalkeeperPlayer(player);

  // Filter: not already selected AND eligible for this position (sakat/cezalı listede görünsün ama pasif)
  const eligiblePlayers = players.filter(
    (p: any) =>
      !Object.values(selectedPlayers).some((sp: any) => sp?.id === p.id) && isPlayerEligible(p)
  );
  const canAddToSquad = (p: any) => p.eligible_for_selection !== false && !p.injured && !p.suspended;

  // Forma numarasına göre küçükten büyüğe sırala (yoksa sonda)
  const sortedPlayers = [...eligiblePlayers].sort((a, b) => {
    const na = a.number != null ? Number(a.number) : 999;
    const nb = b.number != null ? Number(b.number) : 999;
    return na - nb;
  });

  const handlePlayerSelect = (player: any) => {
    setPreviewPlayer(null);
    if (player.eligible_for_selection === false || player.injured || player.suspended) {
      Alert.alert(
        'Kadroya Eklenemez',
        'Bu oyuncu sakat veya cezalı. Kadroya ekleyemezsiniz. Sakatlık/ceza kalkınca tekrar ekleyebilirsiniz.'
      );
      return;
    }
    onSelect(player);
  };

  return (
    <>
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
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.playerModalHeader}>
              <View style={styles.playerModalHeaderText}>
                <Text style={styles.modalTitle}>
                  {isDefenseMode ? '🛡️ Defans Oyuncusu Seç' : 'Oyuncu Seç'}
                </Text>
                <Text style={styles.modalSubtitle}>Pozisyon: {positionLabel}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.playerModalCloseBtnTopRight}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            {/* Defense Mode Info */}
            {isDefenseMode && (
              <View style={styles.defenseModeInfo}>
                <Ionicons name="information-circle" size={16} color="#3B82F6" />
                <Text style={styles.defenseModeInfoText}>
                  Sadece atak kadronuzdaki 11 oyuncudan seçim yapabilirsiniz.
                </Text>
              </View>
            )}

            {/* Players List – sadece uygun oyuncular, forma no küçükten büyüğe */}
            <FlatList
              data={sortedPlayers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const getBorderColor = () => {
                  if (item.rating >= 85) return '#C9A44C'; // Gold for elite
                  if (isGoalkeeperPlayer(item)) return '#3B82F6'; // Blue for GK
                  return '#4B5563'; // Gray for others
                };
                return (
                  <TouchableOpacity
                    style={[
                      styles.playerItem,
                      { borderLeftWidth: 3, borderLeftColor: getBorderColor() },
                    ]}
                    onPress={() => setPreviewPlayer(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playerItemLeft}>
                      <View style={[
                        styles.playerItemJerseyNumber,
                        { backgroundColor: item.rating >= 85 ? '#C9A44C' : '#1FA2A6' }
                      ]}>
                        <Text style={styles.playerItemJerseyNumberText}>{item.number ?? item.id}</Text>
                      </View>
                      <View style={styles.playerItemInfo}>
                        <View style={styles.playerItemNameRow}>
                          <Text style={styles.playerItemName}>{item.name}</Text>
                          {item.form >= 8 && (
                            <Ionicons name="flame" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
                          )}
                          {item.injury && (
                            <Ionicons name="warning" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <View style={styles.playerItemBottomRow}>
                          <Text style={styles.playerItemRatingBottom}>{item.rating}</Text>
                          <Text style={styles.playerItemPosition}>
                            {item.position} • {item.team}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handlePlayerSelect(item)}
                      style={styles.playerItemAddBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle" size={28} color="#1FA2A6" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playersList}
              ListEmptyComponent={() => {
                const noData = !players || players.length === 0;
                return (
                  <View style={{ alignItems: 'center', padding: 32, marginTop: 40 }}>
                    {isLoadingSquad ? (
                      <>
                        <Ionicons name="hourglass-outline" size={48} color="rgba(31, 162, 166, 0.5)" />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginTop: 16 }}>
                          Kadro Yükleniyor...
                        </Text>
                        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                          Takım kadrosu API'den çekiliyor. Lütfen bekleyin...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="football-outline" size={48} color="rgba(31, 162, 166, 0.5)" />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginTop: 16 }}>
                          {hasBackendError ? 'Backend Bağlantı Hatası' : noData ? 'Kadro Bilgisi Yok' : 'Bu Pozisyon İçin Uygun Oyuncu Yok'}
                        </Text>
                        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                          {hasBackendError
                            ? 'Backend servisi çalışmıyor olabilir. Lütfen backend\'in port 3001\'de çalıştığından emin olun.'
                            : noData
                            ? 'Kadro henüz yüklenmedi. Backend kadroyu çekiyor olabilir. Yeniden deneyin.'
                            : (isGKPosition ? 'Kadroda kaleci yok veya hepsi seçildi. Önce kalecinizi kale pozisyonuna yerleştirin.' : 'Kadroda saha oyuncusu yok veya hepsi seçildi.')}
                        </Text>
                        {(noData || hasBackendError) && onRetrySquad && (
                          <TouchableOpacity
                            onPress={onRetrySquad}
                            style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(31, 162, 166, 0.3)', borderRadius: 8 }}
                          >
                            <Text style={{ color: '#1FA2A6', fontWeight: '600' }}>Yeniden Dene</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                );
              }}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Player Preview Modal - FIFA Card Style */}
      {previewPlayer && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setPreviewPlayer(null)}
        >
          <View style={styles.playerCardOverlay}>
            <Animated.View 
              entering={isWeb ? undefined : ZoomIn.duration(200)}
              style={styles.playerCardContainer}
            >
              {/* Card Header with Gradient */}
              <LinearGradient
                colors={previewPlayer.rating >= 85 ? ['#C9A44C', '#A67C00'] : ['#1FA2A6', '#0D7377']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playerCardHeader}
              >
                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.playerCardCloseBtn}
                  onPress={() => setPreviewPlayer(null)}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Jersey Number Circle */}
                <View style={styles.playerCardRatingCircle}>
                  <Text style={styles.playerCardRatingText}>{previewPlayer.number || previewPlayer.id}</Text>
                </View>

                {/* Player Name & Position */}
                <Text style={styles.playerCardName}>{previewPlayer.name}</Text>
                <View style={styles.playerCardPositionRow}>
                  <View style={styles.playerCardPositionBadge}>
                    <Text style={styles.playerCardPositionText}>{previewPlayer.position}</Text>
                  </View>
                  <Text style={styles.playerCardTeam}>{previewPlayer.team}</Text>
                </View>

                {/* Nationality & Age with Rating */}
                <View style={styles.playerCardInfoRow}>
                  <Text style={styles.playerCardInfoText}>
                    {previewPlayer.nationality || 'Unknown'} • {previewPlayer.age || '?'} yaş
                  </Text>
                  <Text style={styles.playerCardRatingBottom}>{previewPlayer.rating}</Text>
                </View>
              </LinearGradient>

              {/* Card Body */}
              <View style={styles.playerCardBody}>
                {/* Status Row */}
                <View style={styles.playerCardStatusRow}>
                  {/* Form */}
                  <View style={[
                    styles.playerCardStatusItem,
                    { borderColor: previewPlayer.form >= 8 ? '#10B981' : previewPlayer.form >= 5 ? '#F59E0B' : '#EF4444' }
                  ]}>
                    <Ionicons 
                      name={previewPlayer.form >= 8 ? "flame" : previewPlayer.form >= 5 ? "remove-circle" : "arrow-down-circle"} 
                      size={20} 
                      color={previewPlayer.form >= 8 ? "#10B981" : previewPlayer.form >= 5 ? "#F59E0B" : "#EF4444"} 
                    />
                    <Text style={styles.playerCardStatusLabel}>Form</Text>
                    <Text style={[
                      styles.playerCardStatusValue,
                      { color: previewPlayer.form >= 8 ? "#10B981" : previewPlayer.form >= 5 ? "#F59E0B" : "#EF4444" }
                    ]}>{previewPlayer.form}/10</Text>
                  </View>

                  {/* Health */}
                  <View style={[
                    styles.playerCardStatusItem,
                    { borderColor: previewPlayer.injury ? '#EF4444' : '#10B981' }
                  ]}>
                    <Ionicons 
                      name={previewPlayer.injury ? "medical" : "heart"} 
                      size={20} 
                      color={previewPlayer.injury ? "#EF4444" : "#10B981"} 
                    />
                    <Text style={styles.playerCardStatusLabel}>Sağlık</Text>
                    <Text style={[
                      styles.playerCardStatusValue,
                      { color: previewPlayer.injury ? "#EF4444" : "#10B981" }
                    ]}>{previewPlayer.injury ? 'Sakat' : 'Fit'}</Text>
                  </View>
                </View>

                {/* Stats Grid - 2x3 */}
                {previewPlayer.stats && (
                  <View style={styles.playerCardStatsGrid}>
                    {[
                      { label: 'HIZ', value: previewPlayer.stats.pace ?? 70, icon: 'flash' },
                      { label: 'ŞUT', value: previewPlayer.stats.shooting ?? 70, icon: 'football' },
                      { label: 'PAS', value: previewPlayer.stats.passing ?? 70, icon: 'swap-horizontal' },
                      { label: 'DRİBLİNG', value: previewPlayer.stats.dribbling ?? 70, icon: 'walk' },
                      { label: 'DEFANS', value: previewPlayer.stats.defending ?? 70, icon: 'shield' },
                      { label: 'FİZİK', value: previewPlayer.stats.physical ?? 70, icon: 'fitness' },
                    ].map((stat, index) => (
                      <View key={index} style={styles.playerCardStatItem}>
                        <View style={[
                          styles.playerCardStatCircle,
                          { borderColor: getStatColor(stat.value) }
                        ]}>
                          <Text style={[styles.playerCardStatValue, { color: getStatColor(stat.value) }]}>
                            {stat.value}
                          </Text>
                        </View>
                        <Text style={styles.playerCardStatLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ✅ Topluluk Tercihleri - DİKKAT ÇEKİCİ */}
                <View style={styles.playerPreviewCommunitySection}>
                  <View style={styles.playerPreviewCommunityHeader}>
                    <Ionicons name="people" size={16} color="#F97316" />
                    <Text style={styles.playerPreviewCommunityTitle}>🔥 Topluluk Tercihi</Text>
                  </View>
                  {previewCommunityStats.loading ? (
                    <Text style={styles.playerPreviewCommunityLoading}>Yükleniyor...</Text>
                  ) : (
                    <View style={styles.playerPreviewCommunityContent}>
                      {/* İlk 11'e seçim */}
                      <View style={styles.playerPreviewCommunityRow}>
                        <Ionicons name="football" size={14} color="#1FA2A6" />
                        <Text style={styles.playerPreviewCommunityText}>
                          Kullanıcıların <Text style={styles.playerPreviewCommunityHighlight}>%{previewCommunityStats.inStartingXI}</Text>'i bu oyuncuyu ilk 11'e seçti
                        </Text>
                      </View>
                      {/* Bu pozisyona atama */}
                      <View style={styles.playerPreviewCommunityRow}>
                        <Ionicons name="locate" size={14} color="#3B82F6" />
                        <Text style={styles.playerPreviewCommunityText}>
                          Bunların <Text style={styles.playerPreviewCommunityHighlight}>%{previewCommunityStats.inThisPosition}</Text>'i {positionLabel} pozisyonuna atadı
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Position Assignment Info */}
                <View style={styles.playerCardAssignInfo}>
                  <Ionicons name="locate" size={16} color="#1FA2A6" />
                  <Text style={styles.playerCardAssignText}>
                    <Text style={{ color: '#1FA2A6', fontWeight: '700' }}>{positionLabel}</Text> pozisyonuna atanacak
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.playerCardActions}>
                  <TouchableOpacity
                    style={styles.playerCardCancelBtn}
                    onPress={() => setPreviewPlayer(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.playerCardCancelText}>Vazgeç</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.playerCardAddBtn}
                    onPress={() => handlePlayerSelect(previewPlayer)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={previewPlayer.injury ? ['#64748B', '#475569'] : ['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.playerCardAddGradient}
                    >
                      <Ionicons name="person-add" size={18} color="#FFFFFF" />
                      <Text style={styles.playerCardAddText}>Kadroya Al</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Injury Warning */}
                {previewPlayer.injury && (
                  <View style={styles.playerCardWarning}>
                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                    <Text style={styles.playerCardWarningText}>
                      Sakatlık nedeniyle performansı düşük olabilir
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

// Player Detail Modal - FULL STATS + Community Stats
const PlayerDetailModal = ({ player, onClose, matchId, positionLabel }: any) => {
  // ✅ Kullanıcı istatistikleri state
  const [communityStats, setCommunityStats] = React.useState<{
    inStartingXI: number; // % kaçı ilk 11'de görmek istiyor
    inThisPosition: number; // % kaçı bu pozisyonda görmek istiyor
    loading: boolean;
  }>({ inStartingXI: 0, inThisPosition: 0, loading: true });
  
  // ✅ Mock kullanıcı istatistiklerini yükle (gerçek API gelince değiştirilecek)
  React.useEffect(() => {
    const loadCommunityStats = async () => {
      try {
        // TODO: Gerçek API entegrasyonu yapılacak
        // const result = await squadPredictionsApi.getPlayerCommunityStats(matchId, player.id, positionLabel);
        // Mock data - rating'e göre daha gerçekçi değerler
        const baseXI = player.rating >= 85 ? 75 : player.rating >= 80 ? 60 : player.rating >= 75 ? 45 : 30;
        const basePosition = player.rating >= 85 ? 65 : player.rating >= 80 ? 50 : player.rating >= 75 ? 35 : 20;
        const variance = Math.floor(Math.random() * 15);
        
        setCommunityStats({
          inStartingXI: Math.min(95, baseXI + variance),
          inThisPosition: Math.min(90, basePosition + variance),
          loading: false,
        });
      } catch (error) {
        console.warn('Community stats load failed', error);
        setCommunityStats({ inStartingXI: 0, inThisPosition: 0, loading: false });
      }
    };
    
    loadCommunityStats();
  }, [player.id, player.rating, matchId, positionLabel]);
  
  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={Platform.OS === 'web' ? undefined : SlideInDown.duration(300)}
          exiting={Platform.OS === 'web' ? undefined : SlideOutDown.duration(300)}
          style={styles.playerDetailModal}
        >
          {/* Header */}
          <LinearGradient
            colors={player.rating >= 85 ? ['#C9A44C', '#8B6914'] : ['#1E3A3A', '#0F2A24']} // ✅ Elit oyuncular için altın gradient
            style={[
              styles.playerDetailHeader,
              player.rating >= 85 && styles.playerDetailHeaderElite, // Altın kenarlık
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerDetailHeaderContent}>
              <View style={[
                styles.playerDetailRating,
                { backgroundColor: (player.rating || 75) >= 85 ? '#C9A44C' : '#1FA2A6' } // ✅ Design System
              ]}>
                <Text style={styles.playerDetailRatingText}>
                  {Math.max(65, Math.min(95, player.rating || 75))}
                </Text>
              </View>

              <View style={styles.playerDetailInfo}>
                <Text style={styles.playerDetailName}>{player.name}</Text>
                <Text style={styles.playerDetailMeta}>
                  {player.position} • {player.team} • {player.age} yaş
                </Text>
                <View style={styles.playerDetailBadges}>
                  <View style={styles.nationalityBadge}>
                    <Ionicons name="flag" size={12} color="#FFFFFF" />
                    <Text style={styles.nationalityText}>{player.nationality}</Text>
                  </View>
                  {player.form >= 8 && (
                    <View style={styles.formBadgeLarge}>
                      <Ionicons name="flame" size={12} color="#F59E0B" />
                      <Text style={styles.formTextLarge}>Form Yüksek</Text>
                    </View>
                  )}
                  {player.injury && (
                    <View style={styles.injuryBadgeLarge}>
                      <Ionicons name="warning" size={12} color="#EF4444" />
                      <Text style={styles.injuryTextLarge}>Sakatlık</Text>
                    </View>
                  )}
                  {/* Elite badge for 85+ */}
                  {player.rating >= 85 && (
                    <View style={styles.eliteBadgeLarge}>
                      <Ionicons name="star" size={12} color="#C9A44C" />
                      <Text style={styles.eliteTextLarge}>Elit</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Stats & Predictions */}
          <ScrollView style={styles.playerDetailContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.playerDetailSectionTitle}>📊 Oyuncu İstatistikleri</Text>
            
            <View style={styles.statsGrid}>
              {Object.entries(player.stats || {}).map(([key, value]: [string, any]) => {
                const statNames: Record<string, string> = {
                  pace: 'Hız',
                  shooting: 'Şut',
                  passing: 'Pas',
                  dribbling: 'Dribling',
                  defending: 'Savunma',
                  physical: 'Fizik'
                };
                
                // ✅ Stats değerini clamp et: minimum 50, maximum 99
                const clampedValue = Math.max(50, Math.min(99, Number(value) || 70));
                const statColor = clampedValue >= 80 ? '#1FA2A6' : clampedValue >= 70 ? '#F59E0B' : '#9CA3AF';
                
                return (
                  <View key={key} style={styles.statItem}>
                    <Text style={styles.statLabel}>{statNames[key]}</Text>
                    <View style={styles.statBarContainer}>
                      <View style={styles.statBarBackground}>
                        <View 
                          style={[
                            styles.statBarFill, 
                            { width: `${clampedValue}%`, backgroundColor: statColor }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.statValue, { color: statColor }]}>{clampedValue}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Additional Info */}
            <View style={styles.additionalInfo}>
              <View style={styles.infoCard}>
                <Ionicons name="fitness" size={20} color="#1FA2A6" />
                <Text style={styles.infoCardLabel}>Form</Text>
                <Text style={styles.infoCardValue}>{player.form}/10</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="shirt" size={20} color="#1FA2A6" />
                <Text style={styles.infoCardLabel}>Pozisyon</Text>
                <Text style={styles.infoCardValue}>{player.position}</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="person" size={20} color="#1FA2A6" />
                <Text style={styles.infoCardLabel}>Yaş</Text>
                <Text style={styles.infoCardValue}>{player.age}</Text>
              </View>
            </View>
            
            {/* ✅ Topluluk Tercihleri - Kullanıcı istatistikleri */}
            <View style={styles.communityStatsSection}>
              <Text style={styles.playerDetailSectionTitle}>👥 Topluluk Tercihleri</Text>
              
              {communityStats.loading ? (
                <View style={styles.communityStatsLoading}>
                  <Text style={styles.communityStatsLoadingText}>Yükleniyor...</Text>
                </View>
              ) : (
                <View style={styles.communityStatsContainer}>
                  {/* İlk 11'de görmek isteyenler */}
                  <View style={styles.communityStatRow}>
                    <View style={styles.communityStatIcon}>
                      <Ionicons name="football" size={18} color="#1FA2A6" />
                    </View>
                    <View style={styles.communityStatContent}>
                      <Text style={styles.communityStatLabel}>
                        Kullanıcıların <Text style={styles.communityStatHighlight}>%{communityStats.inStartingXI}</Text>'i bu oyuncuyu ilk 11'de görmek istiyor
                      </Text>
                      <View style={styles.communityStatBarBg}>
                        <View 
                          style={[
                            styles.communityStatBarFill, 
                            { 
                              width: `${communityStats.inStartingXI}%`,
                              backgroundColor: communityStats.inStartingXI >= 60 ? '#10B981' : communityStats.inStartingXI >= 40 ? '#F59E0B' : '#64748B'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                  
                  {/* Bu pozisyona atanmasını isteyenler */}
                  {positionLabel && (
                    <View style={styles.communityStatRow}>
                      <View style={styles.communityStatIcon}>
                        <Ionicons name="locate" size={18} color="#3B82F6" />
                      </View>
                      <View style={styles.communityStatContent}>
                        <Text style={styles.communityStatLabel}>
                          Bunların <Text style={styles.communityStatHighlight}>%{communityStats.inThisPosition}</Text>'i oyuncunun {positionLabel} pozisyonunda oynamasını istiyor
                        </Text>
                        <View style={styles.communityStatBarBg}>
                          <View 
                            style={[
                              styles.communityStatBarFill, 
                              { 
                                width: `${communityStats.inThisPosition}%`,
                                backgroundColor: communityStats.inThisPosition >= 50 ? '#3B82F6' : communityStats.inThisPosition >= 30 ? '#F59E0B' : '#64748B'
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Close Button */}
          <View style={styles.playerDetailActions}>
            <TouchableOpacity
              style={styles.playerDetailCloseButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1FA2A6', '#047857']}
                style={styles.playerDetailCloseButtonGradient}
              >
                <Text style={styles.playerDetailCloseButtonText}>Kapat</Text>
              </LinearGradient>
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
  
  
  // Empty State
  emptyStateContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyStateContent: {
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
  emptyStateBall: {
    marginBottom: 16,
  },
  emptyStateBallEmoji: {
    fontSize: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  selectFormationButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  
  // Football Field – boyutlar PITCH_LAYOUT (config/constants) tek kaynak
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
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
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
  
  // Main Container – y ekseni boşlukları azaltıldı, saha yüksekliği arttı
  mainContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  mainField: {
    width: isWeb ? '100%' : width - PITCH_LAYOUT.H_PADDING,
    maxWidth: isWeb ? PITCH_LAYOUT.WEB_MAX_WIDTH : undefined,
    height: isWeb ? PITCH_LAYOUT.WEB_HEIGHT : (width - PITCH_LAYOUT.H_PADDING) * PITCH_LAYOUT.ASPECT_RATIO,
    alignSelf: 'center',
    marginBottom: 0,
  },
  playersContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible', // ✅ Kartların kesilmemesi için
  },
  
  // Player Slot - Centered on position
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -32 }, { translateY: -38 }], // Half of card size
    zIndex: 5,
    elevation: 5,
  },
  playerCardWrapper: {
    position: 'relative',
    zIndex: 10,
    elevation: 10,
    overflow: 'visible',
  },
  subOutOuter: {
    borderRadius: 10,
  },
  subOutBorderThin: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  subOutBorderThick: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  subOutBorderPulse: {
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
  },
  subOutInfoIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 12,
    padding: 2,
  },
  // X butonu her zaman oyuncu kartının ÜSTÜNDE (kartın altında kalmamalı)
  
  // Player Card - Reduced size to prevent overflow (64x76)
  playerCard: {
    width: 64,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.3)', // Default gray border
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  playerCardElite: {
    borderColor: '#C9A44C', // Gold border for elite players (85+)
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: '#C9A44C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 0 12px rgba(201, 164, 76, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  playerCardGK: {
    borderColor: '#3B82F6', // Blue border for goalkeepers
    borderWidth: 2,
  },
  playerCardGradient: {
    flex: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#EF4444',
    borderRadius: 13,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 999,
      },
      web: {
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
      },
    }),
  },
  replaceButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#0F2A24',
    borderRadius: 13,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1FA2A6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 999,
      },
      web: {
        boxShadow: '0 2px 8px rgba(31, 162, 166, 0.4)',
      },
    }),
  },
  jerseyNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1FA2A6', // ✅ Design System
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  jerseyNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ratingBadgeSmall: {
    width: 18,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(201, 164, 76, 0.3)', // Gold tint for rating
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.5)',
  },
  ratingTextSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C9A44C',
  },
  alertBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    zIndex: 50,
  },
  playerName: {
    fontSize: 9,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 2,
    letterSpacing: 0.2,
    flexShrink: 1,
    flexGrow: 0,
    maxHeight: 20, // Prevent overflow
  },
  playerPosition: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 1,
  },
  playerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 'auto', // Push to bottom
    flexShrink: 0, // Prevent shrinking
  },
  playerRatingBottom: {
    fontSize: 8,
    fontWeight: '700',
    color: '#C9A44C', // Gold color for rating
  },
  playerPositionBottom: {
    fontSize: 8,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  formGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
  },
  formBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  injuryBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  
  // Empty Slot
  emptySlot: {
    width: 64,
    height: 76,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotContent: {
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  
  // ✅ Kompakt toolbar - Tahmin sekmesi ile uyumlu yükseklik
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#1E3A3A',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    marginTop: 4,
    marginBottom: 6,
    minHeight: 42, // ✅ Sabit yükseklik - sıçrama önlenir
  },
  bottomBarLeft: {
    flex: 1,
  },
  // ✅ Tek satır: Tahminin/Gerçek 11/Topluluk + Atak/Defans (saha boyutu için kompakt)
  unifiedToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  // ✅ Karşılaştırma sekmeleri (unifiedToolbarRow içinde kullanıldığında kompakt)
  viewSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  comparisonHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  comparisonHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  viewSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  viewSourcePillActive: {
    backgroundColor: '#1FA2A6',
  },
  viewSourceText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  viewSourceTextActive: {
    color: '#FFFFFF',
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  viewTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
  },
  viewTogglePillActive: {
    backgroundColor: '#1FA2A6',
  },
  viewToggleText: {
    fontSize: 12,
    color: '#1FA2A6',
    fontWeight: '500',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },
  changeFormationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeFormationText: {
    fontSize: 12,
    color: '#1FA2A6', // ✅ Design System: Secondary (turkuaz)
    fontWeight: '500',
    flex: 1,
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E6E6E6', // ✅ Design System: DARK_MODE.foreground
  },
  completeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // ✅ Kilit Butonları
  lockButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginRight: 8,
  },
  lockButtonOpen: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginRight: 8,
  },
  
  // ✅ Simetrik Toolbar: [Formasyon 2 satır] | 🔓 | [Tamamla]
  symmetricToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  // 2 Satırlı Formasyon Butonu
  dualLineFormationButton: {
    flexDirection: 'column',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    minWidth: 110,
    gap: 2,
  },
  formationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  formationLineActive: {
    // Aktif satır için ek stil (isteğe bağlı)
  },
  formationLineText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  formationLineTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Kilit Butonu - Ortada
  lockButtonCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButtonCenterLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  lockButtonCenterOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  lockButtonCenterDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  // Tamamla Butonu - Sol ile simetrik
  completeButtonSymmetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    minWidth: 110,
  },
  completeButtonSymmetricDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  completeButtonSymmetricText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Modal - Design System uyumlu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2E2A', // ✅ Design System: Slightly lighter than primary for better contrast
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.92, // ✅ Daha yüksek - scroll azalt
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    padding: 16,
    paddingRight: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFB',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  formationModalTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  formationModalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
  },
  formationModalTabActive: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  formationModalTabDisabled: {
    opacity: 0.6,
  },
  formationModalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  formationModalTabTextActive: {
    color: '#FFFFFF',
  },
  formationModalTabTextDisabled: {
    color: '#6B7280',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  defenseModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  defenseModeInfoText: {
    fontSize: 12,
    color: '#93C5FD',
    flex: 1,
  },
  modalCloseButtonAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 162, 166, 0.15)', // ✅ Design System
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    zIndex: 1000,
  },
  modalTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.08)', // ✅ Design System
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  modalTabActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.25)', // ✅ Aktif tab
    borderWidth: 1,
    borderColor: '#1FA2A6',
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalTabTextActive: {
    color: '#1FA2A6',
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  
  // Formation Grid - 3 Columns COMPACT - Eşit boşluklar
  formationGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8, // ✅ Eşit sağ-sol boşluk
    paddingTop: 4,
    paddingBottom: 8,
    justifyContent: 'space-between', // ✅ Eşit dağılım
  },
  formationGridItem: {
    width: '32%', // 3 columns
    marginBottom: 6, // ✅ Alt boşluk
    marginBottom: 2,
  },
  formationCard: {
    backgroundColor: '#1E3A3A', // ✅ Design System: Standard card background (not blue)
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Turkuaz border
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52, // ✅ Daha kompakt
    position: 'relative',
  },
  formationCardId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  formationCardSubtitle: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
  },
  formationCardSelected: {
    borderColor: '#1FA2A6',
    borderWidth: 2,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
  },
  // ✅ Seçili formasyon (mevcut atak/defans formasyonu)
  formationCardCurrentlySelected: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  formationSelectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0F2A24',
    borderRadius: 10,
    padding: 2,
    zIndex: 10,
  },
  
  // ✅ Formation Preview Modal - Ayrı popup
  formationPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formationPreviewModal: {
    backgroundColor: '#1A3D37', // ✅ Daha açık ton - belirgin
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#1FA2A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 4px 24px rgba(31, 162, 166, 0.25)',
      },
    }),
  },
  formationPreviewHeader: {
    marginBottom: 12,
  },
  formationPreviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formationPreviewName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  formationPreviewCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 16,
  },
  formationPreviewTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  formationPreviewTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formationPreviewContextHint: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 8,
    fontWeight: '500',
  },
  formationPreviewDesc: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 16,
  },
  formationPreviewSection: {
    marginBottom: 12,
  },
  formationPreviewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formationPreviewListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  formationPreviewBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1FA2A6',
    marginTop: 6,
  },
  formationPreviewListText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 18,
  },
  formationPreviewBestFor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  formationPreviewBestForLabel: {
    fontWeight: '700',
    color: '#F59E0B',
  },
  formationPreviewBestForText: {
    fontSize: 12,
    color: '#FDE68A',
    flex: 1,
    lineHeight: 18,
  },
  // ✅ Formasyon Popülerlik Stilleri - DİKKAT ÇEKİCİ TASARIM
  formationPopularitySection: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Kırmızımsı arka plan
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.6)', // Turuncu border
    ...Platform.select({
      ios: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  formationPopularityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.2)', // Turuncu header arka planı
    padding: 8,
    borderRadius: 8,
    marginHorizontal: -6,
    marginTop: -6,
  },
  formationPopularitySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316', // Turuncu başlık
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formationPopularityLoading: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 8,
  },
  formationPopularityContent: {
    gap: 10,
  },
  formationPopularityText: {
    fontSize: 13,
    color: '#F1F5F9', // Daha parlak text
    lineHeight: 20,
    fontWeight: '500',
  },
  formationPopularityHighlight: {
    fontWeight: '800',
    color: '#F97316', // Turuncu vurgu
    fontSize: 16,
  },
  formationPopularityBarBg: {
    height: 8, // Daha kalın bar
    backgroundColor: 'rgba(100, 116, 139, 0.4)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  formationPopularityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  formationPreviewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formationPreviewCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  formationPreviewCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formationPreviewSelectBtn: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1FA2A6', // ✅ Opak turkuaz – açıklama popup’ı ile aynı, mavi/şeffaf görünmesin
  },
  formationPreviewSelectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    opacity: 1,
  },
  formationPreviewSelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // ✅ Defense Confirmation Modal Styles
  defenseConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  defenseConfirmModal: {
    backgroundColor: '#1A3D37',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#1FA2A6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(31, 162, 166, 0.25)',
      },
    }),
  },
  defenseConfirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  defenseConfirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  defenseConfirmDesc: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  defenseConfirmInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  defenseConfirmInfoText: {
    fontSize: 12,
    color: '#FDE68A',
    flex: 1,
    lineHeight: 18,
  },
  defenseConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  defenseConfirmNoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
  },
  defenseConfirmNoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  defenseConfirmYesBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  defenseConfirmYesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  defenseConfirmYesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  

  // Formation Detail Modal
  formationDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formationDetailContent: {
    backgroundColor: '#1E3A3A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  formationDetailScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  formationDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formationDetailHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  formationDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formationDetailTypeBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  formationDetailTypeText: {
    fontSize: 12,
    color: '#1FA2A6',
    fontWeight: '600',
  },
  formationDetailCloseButton: {
    marginLeft: 12,
  },
  formationDetailDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },
  formationDetailSection: {
    marginBottom: 16,
  },
  formationDetailSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  formationDetailListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  formationDetailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1FA2A6',
    marginTop: 6,
  },
  formationDetailListText: {
    fontSize: 13,
    color: '#D1D5DB',
    flex: 1,
    lineHeight: 18,
  },
  formationDetailBestFor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  formationDetailBestForContent: {
    flex: 1,
    gap: 4,
  },
  formationDetailBestForLabel: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  formationDetailBestForText: {
    fontSize: 13,
    color: '#FDE68A',
    lineHeight: 18,
  },
  formationDetailSelectButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1FA2A6', // ✅ Açıklama popup’ı ile aynı opak turkuaz
  },
  formationDetailSelectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    opacity: 1,
  },
  formationDetailSelectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Player Item
  playersList: {
    paddingBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerItemRating: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerItemRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // ✅ Jersey Number Badge - Circular
  playerItemJerseyNumber: {
    width: 40,
    height: 40,
    borderRadius: 20, // Fully circular
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerItemJerseyNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerItemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  playerItemRatingBottom: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C9A44C', // Gold color for rating
  },
  playerItemPosition: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  playerItemAddBtn: {
    padding: 4,
  },
  playerItemLocked: {
    opacity: 0.5,
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
  },
  playerItemNameLocked: {
    color: '#6B7280',
  },
  playerItemPositionLocked: {
    color: '#4B5563',
  },
  playerItemLockedIcon: {
    padding: 4,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ✅ Player Modal Close Button
  playerModalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  playerModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  playerModalHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  playerModalCloseBtnTopRight: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },

  // ✅ Player Card Modal - FIFA Style
  playerCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  playerCardContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F2027',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  playerCardHeader: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  playerCardCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playerCardRatingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  playerCardRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerCardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: { textShadow: '0px 1px 2px rgba(0,0,0,0.3)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  playerCardPositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  playerCardPositionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playerCardPositionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerCardTeam: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  playerCardInfoRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  playerCardInfoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  playerCardRatingBottom: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9A44C', // Gold color for rating
  },
  playerCardBody: {
    backgroundColor: '#0F2027',
    padding: 20,
  },
  playerCardStatusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  playerCardStatusItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
  },
  playerCardStatusLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  playerCardStatusValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  playerCardStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerCardStatItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerCardStatCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  playerCardStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerCardStatLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  // ✅ Oyuncu Preview - Topluluk Tercihleri Stilleri
  playerPreviewCommunitySection: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  playerPreviewCommunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  playerPreviewCommunityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  playerPreviewCommunityLoading: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 4,
  },
  playerPreviewCommunityContent: {
    gap: 8,
  },
  playerPreviewCommunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerPreviewCommunityText: {
    fontSize: 11,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 16,
  },
  playerPreviewCommunityHighlight: {
    fontWeight: '700',
    color: '#F97316',
    fontSize: 12,
  },
  
  playerCardAssignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  playerCardAssignText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  playerCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playerCardCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  playerCardCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  playerCardAddBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  playerCardAddGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  playerCardAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerCardWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  playerCardWarningText: {
    fontSize: 11,
    color: '#FDE68A',
    flex: 1,
  },
  
  // Player Detail Modal
  playerDetailModal: {
    backgroundColor: '#1E3A3A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  playerDetailHeader: {
    padding: 20,
    paddingTop: 16,
  },
  playerDetailHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  playerDetailRating: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerDetailRatingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerDetailInfo: {
    flex: 1,
  },
  playerDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerDetailMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  playerDetailBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  nationalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nationalityText: {
    fontSize: 11,
    color: '#1FA2A6',
    fontWeight: '600',
  },
  formBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formTextLarge: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '600',
  },
  injuryBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  injuryTextLarge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  // ✅ Elit oyuncu badge
  eliteBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 164, 76, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.4)',
  },
  eliteTextLarge: {
    fontSize: 11,
    color: '#C9A44C',
    fontWeight: '700',
  },
  // ✅ Elit oyuncu header stili
  playerDetailHeaderElite: {
    borderWidth: 2,
    borderColor: '#C9A44C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  playerDetailContent: {
    flex: 1,
    padding: 20,
  },
  playerDetailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statItem: {
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'right',
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerDetailActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerDetailCloseButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playerDetailCloseButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerDetailCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // ✅ Topluluk istatistikleri stilleri
  communityStatsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  communityStatsLoading: {
    alignItems: 'center',
    padding: 20,
  },
  communityStatsLoadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  communityStatsContainer: {
    gap: 16,
  },
  communityStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  communityStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityStatContent: {
    flex: 1,
    gap: 8,
  },
  communityStatLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  communityStatHighlight: {
    color: '#1FA2A6',
    fontWeight: '700',
    fontSize: 14,
  },
  communityStatBarBg: {
    height: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  communityStatBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Button Gradient
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // ✅ Kaydediliyor... Overlay Stilleri
  savingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#1FA2A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  savingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  savingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
