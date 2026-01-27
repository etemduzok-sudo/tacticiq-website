// src/components/match/MatchSquad.tsx - COMPLETE VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';
import { squadPredictionsApi } from '../../services/api';
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

const { width, height } = Dimensions.get('window');

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

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
  onComplete: () => void;
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

// Formation Positions - ALL 26 FORMATIONS - Optimized spacing to prevent overlap
// Minimum horizontal gap: 20%, Edge padding: 12-88%, GK max y: 88%
const formationPositions: Record<string, Array<{ x: number; y: number }>> = {
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
  { id: 1, name: 'Alisson Becker', position: 'GK', rating: 89, team: 'Liverpool', form: 8, injury: false,
    age: 30, nationality: 'Brazil', stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40, defending: 25, physical: 78 }
  },
  { id: 2, name: 'Virgil van Dijk', position: 'CB', rating: 90, team: 'Liverpool', form: 9, injury: false,
    age: 32, nationality: 'Netherlands', stats: { pace: 75, shooting: 60, passing: 71, dribbling: 72, defending: 91, physical: 86 }
  },
  { id: 3, name: 'Trent Alexander-Arnold', position: 'RB', rating: 87, team: 'Liverpool', form: 8, injury: false,
    age: 25, nationality: 'England', stats: { pace: 76, shooting: 66, passing: 89, dribbling: 74, defending: 76, physical: 71 }
  },
  { id: 4, name: 'Andrew Robertson', position: 'LB', rating: 87, team: 'Liverpool', form: 8, injury: false,
    age: 29, nationality: 'Scotland', stats: { pace: 81, shooting: 58, passing: 81, dribbling: 78, defending: 82, physical: 77 }
  },
  { id: 5, name: 'Joël Matip', position: 'CB', rating: 85, team: 'Liverpool', form: 7, injury: false,
    age: 32, nationality: 'Cameroon', stats: { pace: 68, shooting: 45, passing: 69, dribbling: 65, defending: 85, physical: 84 }
  },
  { id: 6, name: 'Fabinho', position: 'CDM', rating: 87, team: 'Liverpool', form: 8, injury: false,
    age: 30, nationality: 'Brazil', stats: { pace: 67, shooting: 70, passing: 75, dribbling: 72, defending: 84, physical: 82 }
  },
  { id: 7, name: 'Jordan Henderson', position: 'CM', rating: 84, team: 'Liverpool', form: 7, injury: false,
    age: 33, nationality: 'England', stats: { pace: 68, shooting: 72, passing: 78, dribbling: 73, defending: 74, physical: 77 }
  },
  { id: 8, name: 'Thiago Alcântara', position: 'CM', rating: 86, team: 'Liverpool', form: 7, injury: true,
    age: 32, nationality: 'Spain', stats: { pace: 64, shooting: 74, passing: 89, dribbling: 84, defending: 68, physical: 64 }
  },
  { id: 9, name: 'Mohamed Salah', position: 'RW', rating: 90, team: 'Liverpool', form: 9, injury: false,
    age: 31, nationality: 'Egypt', stats: { pace: 90, shooting: 87, passing: 81, dribbling: 90, defending: 45, physical: 75 }
  },
  { id: 10, name: 'Sadio Mané', position: 'LW', rating: 89, team: 'Liverpool', form: 8, injury: false,
    age: 31, nationality: 'Senegal', stats: { pace: 90, shooting: 83, passing: 80, dribbling: 87, defending: 44, physical: 77 }
  },
  { id: 11, name: 'Roberto Firmino', position: 'ST', rating: 86, team: 'Liverpool', form: 7, injury: false,
    age: 32, nationality: 'Brazil', stats: { pace: 76, shooting: 82, passing: 83, dribbling: 86, defending: 59, physical: 76 }
  },
  { id: 12, name: 'Diogo Jota', position: 'ST', rating: 85, team: 'Liverpool', form: 8, injury: false,
    age: 27, nationality: 'Portugal', stats: { pace: 85, shooting: 83, passing: 73, dribbling: 85, defending: 34, physical: 73 }
  },
  { id: 13, name: 'Luis Díaz', position: 'LW', rating: 84, team: 'Liverpool', form: 9, injury: false,
    age: 26, nationality: 'Colombia', stats: { pace: 91, shooting: 76, passing: 75, dribbling: 88, defending: 38, physical: 72 }
  },
  { id: 14, name: 'Curtis Jones', position: 'CM', rating: 78, team: 'Liverpool', form: 7, injury: false,
    age: 22, nationality: 'England', stats: { pace: 74, shooting: 68, passing: 74, dribbling: 79, defending: 60, physical: 68 }
  },
  { id: 15, name: 'Harvey Elliott', position: 'CAM', rating: 76, team: 'Liverpool', form: 8, injury: false,
    age: 20, nationality: 'England', stats: { pace: 78, shooting: 65, passing: 76, dribbling: 82, defending: 45, physical: 58 }
  },
  { id: 16, name: 'Darwin Núñez', position: 'ST', rating: 82, team: 'Liverpool', form: 7, injury: false,
    age: 24, nationality: 'Uruguay', stats: { pace: 88, shooting: 80, passing: 68, dribbling: 77, defending: 35, physical: 82 }
  },
  { id: 17, name: 'Cody Gakpo', position: 'LW', rating: 81, team: 'Liverpool', form: 8, injury: false,
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

export function MatchSquad({ matchData, matchId, lineups, onComplete }: MatchSquadProps) {
  // ✅ GERÇEK VERİ: Lineups'tan oyuncuları çek
  const realPlayers = React.useMemo(() => {
    if (!lineups || lineups.length === 0) {
      console.log('⚠️ No lineups data, using empty array');
      return [];
    }
    
    // Her iki takımın oyuncularını birleştir
    const allPlayers: any[] = [];
    lineups.forEach((lineup: any) => {
      const teamName = lineup.team?.name || 'Unknown';
      
      // Başlangıç 11'i ekle
      if (lineup.startXI) {
        lineup.startXI.forEach((item: any) => {
          const player = item.player;
          allPlayers.push({
            id: player.id,
            name: player.name,
            position: player.pos || 'SUB',
            rating: 75, // Default rating (gerçek rating API'den gelmez)
            number: player.number,
            team: teamName,
            form: 7,
            injury: false,
            age: 25,
            nationality: 'Unknown',
            stats: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 }
          });
        });
      }
      
      // Yedekleri ekle
      if (lineup.substitutes) {
        lineup.substitutes.forEach((item: any) => {
          const player = item.player;
          allPlayers.push({
            id: player.id,
            name: player.name,
            position: player.pos || 'SUB',
            rating: 70,
            number: player.number,
            team: teamName,
            form: 6,
            injury: false,
            age: 25,
            nationality: 'Unknown',
            stats: { pace: 65, shooting: 65, passing: 65, dribbling: 65, defending: 65, physical: 65 }
          });
        });
      }
    });
    
    console.log('✅ Real players loaded from lineups:', allPlayers.length);
    return allPlayers;
  }, [lineups]);
  
  // ✅ Attack & Defense Formation States
  const [attackFormation, setAttackFormation] = useState<string | null>(null);
  const [defenseFormation, setDefenseFormation] = useState<string | null>(null);
  const [attackPlayers, setAttackPlayers] = useState<Record<number, typeof players[0] | null>>({});
  const [defensePlayers, setDefensePlayers] = useState<Record<number, typeof players[0] | null>>({});
  
  // ✅ Current editing mode: 'attack' or 'defense'
  const [editingMode, setEditingMode] = useState<'attack' | 'defense'>('attack');
  
  // ✅ Confirmation modal for defense formation
  const [showDefenseConfirmModal, setShowDefenseConfirmModal] = useState(false);
  
  // Legacy compatibility (will be mapped to attack/defense)
  const selectedFormation = editingMode === 'attack' ? attackFormation : defenseFormation;
  const selectedPlayers = editingMode === 'attack' ? attackPlayers : defensePlayers;
  const setSelectedPlayers = editingMode === 'attack' ? setAttackPlayers : setDefensePlayers;
  
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [formationType, setFormationType] = useState<'attack' | 'defense' | 'balanced'>('attack');
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<typeof players[0] | null>(null);
  
  // Player Predictions State
  const [playerPredictions, setPlayerPredictions] = useState<Record<number, any>>({});
  
  // ✅ Get attack squad players for defense selection
  const attackSquadPlayers = React.useMemo(() => {
    return Object.values(attackPlayers).filter(Boolean) as typeof players;
  }, [attackPlayers]);
  
  // ✅ Track if defense confirmation was already shown
  const [defenseConfirmShown, setDefenseConfirmShown] = React.useState(false);
  
  // ✅ Show defense confirmation when attack squad is complete (11 players)
  React.useEffect(() => {
    const attackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
    
    // Show confirmation only when:
    // 1. Attack squad has 11 players
    // 2. Defense formation not yet selected
    // 3. Confirmation not already shown
    // 4. We're in attack mode
    if (attackCount === 11 && !defenseFormation && !defenseConfirmShown && editingMode === 'attack') {
      setDefenseConfirmShown(true);
      // Small delay to let the last player animation complete
      setTimeout(() => {
        setShowDefenseConfirmModal(true);
      }, 500);
    }
  }, [attackPlayers, defenseFormation, defenseConfirmShown, editingMode]);

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

  const handleFormationSelect = (formationId: string) => {
    const formation = formations.find(f => f.id === formationId);
    
    if (editingMode === 'attack') {
      // ✅ Attack formation selected - Start placing players
      setAttackFormation(formationId);
      setAttackPlayers({});
      setShowFormationModal(false);
      Alert.alert('Atak Formasyonu Seçildi!', `${formation?.name}\n\nŞimdi 11 oyuncunuzu pozisyonlara yerleştirin.`);
      // Defense confirmation will be shown after 11 players are selected
    } else {
      // ✅ Defense formation selected
      setDefenseFormation(formationId);
      // ✅ Pre-fill defense players with attack squad (same 11 players, different positions)
      const defFormation = formations.find(f => f.id === formationId);
      if (defFormation && Object.keys(attackPlayers).length === 11) {
        // Map attack players to defense positions
        const defPlayers: Record<number, typeof players[0] | null> = {};
        const attackPlayersList = Object.values(attackPlayers).filter(Boolean) as typeof players;
        
        // 1. Find goalkeeper from attack squad and assign to GK position (index 0)
        const goalkeeper = attackPlayersList.find(p => p?.position === 'GK');
        if (goalkeeper) {
          defPlayers[0] = goalkeeper;
        }
        
        // 2. Get all outfield players from attack squad (excluding GK)
        const outfieldPlayers = attackPlayersList.filter(p => p?.position !== 'GK');
        
        // 3. Assign outfield players to defense positions (index 1-10)
        // Map attack players to defense positions sequentially
        outfieldPlayers.forEach((player, idx) => {
          const defenseSlotIndex = idx + 1; // Defense slots start from index 1 (0 is GK)
          if (defenseSlotIndex < 11) { // Ensure we don't exceed 11 slots
            defPlayers[defenseSlotIndex] = player;
          }
        });
        
        setDefensePlayers(defPlayers);
        // Set editing mode to defense so user can see and edit defense squad
        setEditingMode('defense');
      }
      setShowFormationModal(false);
      Alert.alert('Defans Formasyonu Seçildi!', `${formation?.name}\n\nAtak kadronuzdaki oyuncular defans pozisyonlarına otomatik yerleştirildi. Gerekirse düzenleyebilirsiniz.`);
    }
  };
  
  // ✅ Handle defense confirmation
  const handleDefenseConfirmYes = () => {
    setShowDefenseConfirmModal(false);
    setEditingMode('defense');
    setFormationType('defense');
    setTimeout(() => {
      setShowFormationModal(true);
    }, 300);
  };
  
  const handleDefenseConfirmNo = () => {
    setShowDefenseConfirmModal(false);
    
    // ✅ Copy attack formation and players to defense (same system for both)
    if (attackFormation) {
      setDefenseFormation(attackFormation);
      setDefensePlayers({ ...attackPlayers });
      
      const formation = formations.find(f => f.id === attackFormation);
      Alert.alert(
        'Kadro Tamamlandı! ⚽',
        `Atak ve defans için aynı sistem kullanılacak:\n\n${formation?.name}\n\nKadronuz kaydedilmeye hazır.`
      );
    }
  };

  const handlePlayerSelect = (player: typeof players[0]) => {
    if (selectedSlot !== null) {
      const currentFormation = editingMode === 'attack' ? attackFormation : defenseFormation;
      const formationData = formations.find(f => f.id === currentFormation);
      const slotPosition = formationData?.positions[selectedSlot];
      
      // ✅ Goalkeeper validation - GK can only go to GK position
      if (player.position === 'GK' && slotPosition !== 'GK') {
        Alert.alert('Kaleci Kısıtlaması', 'Kaleci sadece kale pozisyonuna yerleştirilebilir.');
        return;
      }
      
      // ✅ GK position can only have goalkeeper
      if (slotPosition === 'GK' && player.position !== 'GK') {
        Alert.alert('Kale Pozisyonu', 'Kale pozisyonuna sadece kaleci yerleştirilebilir.');
        return;
      }
      
      if (editingMode === 'attack') {
        setAttackPlayers({ ...attackPlayers, [selectedSlot]: player });
      } else {
        setDefensePlayers({ ...defensePlayers, [selectedSlot]: player });
      }
      
      setSelectedSlot(null);
      setShowPlayerModal(false);
      
      const modeText = editingMode === 'attack' ? 'atak' : 'defans';
      Alert.alert('Oyuncu Yerleştirildi!', `${player.name} ${modeText} kadronuza eklendi`);
    }
  };

  const handleRemovePlayer = (slotIndex: number) => {
    const player = selectedPlayers[slotIndex];
    if (player) {
      // Directly remove player without confirmation for smoother UX
      setSelectedPlayers({ ...selectedPlayers, [slotIndex]: null });
    }
  };

  const handleComplete = async () => {
    const attackCount = Object.keys(attackPlayers).filter(k => attackPlayers[parseInt(k)]).length;
    const defenseCount = Object.keys(defensePlayers).filter(k => defensePlayers[parseInt(k)]).length;
    
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
    
    try {
      // Save squad data to AsyncStorage (local backup)
      const squadData = {
        matchId: matchData.id,
        attackFormation: attackFormation,
        defenseFormation: defenseFormation || attackFormation, // If no defense, use attack
        attackPlayers: attackPlayers,
        defensePlayers: defenseFormation ? defensePlayers : attackPlayers, // If no defense, use attack players
        playerPredictions: playerPredictions,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `fan-manager-squad-${matchData.id}`,
        JSON.stringify(squadData)
      );
      
      console.log('✅ Squad saved to local storage!', squadData);
      
      // ✅ Save to backend for statistics tracking
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authToken = sessionData?.session?.access_token;
        
        if (authToken) {
          const result = await squadPredictionsApi.saveSquadPrediction({
            matchId: matchData.id,
            attackFormation: attackFormation!,
            attackPlayers: attackPlayers,
            defenseFormation: defenseFormation || attackFormation!,
            defensePlayers: defenseFormation ? defensePlayers : attackPlayers,
            analysisFocus: matchData.analysisFocus || 'balanced',
          }, authToken);
          
          if (result.success) {
            console.log('✅ Squad saved to backend for statistics!');
          } else {
            console.warn('⚠️ Backend save failed:', result.message);
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend save failed (continuing with local):', backendError);
      }
      
      const message = defenseFormation 
        ? 'Atak ve defans kadronuz başarıyla kaydedildi.'
        : 'Kadronuz başarıyla kaydedildi.';
      
      Alert.alert(
        'Kadro Kaydedildi! 🎉',
        message,
        [{ text: 'Devam Et', onPress: onComplete }]
      );
    } catch (error) {
      console.error('Error saving squad:', error);
      Alert.alert('Hata!', 'Kadro kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const positions = selectedFormation ? formationPositions[selectedFormation] || formationPositions['4-3-3'] : null;
  const formation = formations.find(f => f.id === selectedFormation);
  const selectedCount = Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length;

  // Empty State (No Formation Selected)
  if (!selectedFormation) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <FootballField>
            <View style={styles.emptyStateContent}>
              <Animated.View style={[styles.emptyStateBall, animatedBallStyle]}>
                <Text style={styles.emptyStateBallEmoji}>⚽</Text>
              </Animated.View>
              <Text style={styles.emptyStateTitle}>Stratejini Belirle</Text>
              <Text style={styles.emptyStateSubtitle}>
                Devam etmek için bir formasyon seçiniz
              </Text>
            </View>
          </FootballField>

          <TouchableOpacity
            style={styles.selectFormationButton}
            onPress={() => setShowFormationModal(true)}
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

        {/* Formation Modal */}
        <FormationModal
          visible={showFormationModal}
          formations={formations}
          formationType={formationType}
          onSelect={handleFormationSelect}
          onClose={() => setShowFormationModal(false)}
          onTabChange={setFormationType}
        />
      </View>
    );
  }

  // Main Squad Screen (Formation Selected)
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Football Field with Players */}
        <FootballField style={styles.mainField}>
          <View style={styles.playersContainer}>
            {positions?.map((pos, index) => {
              const player = selectedPlayers[index];
              const positionLabel = formation?.positions[index] || '';

              return (
                <View
                  key={index}
                  style={[
                    styles.playerSlot,
                    { left: `${pos.x}%`, top: `${pos.y}%` },
                  ]}
                >
                  {player ? (
                    <Animated.View entering={isWeb ? undefined : ZoomIn.duration(300)}>
                      <View style={styles.playerCardWrapper}>
                        {/* Remove button - Top Right */}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemovePlayer(index)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Player Card - Main */}
                        <TouchableOpacity
                          style={styles.playerCard}
                          onPress={() => setSelectedPlayerForDetail(player)}
                          onLongPress={() => handleRemovePlayer(index)}
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

                            {/* Rating Badge - Top Center - BIG */}
                            <View style={styles.ratingBadge}>
                              <Text style={styles.ratingText}>{player.rating}</Text>
                            </View>

                            {/* Player Name - Center */}
                            <Text style={styles.playerName} numberOfLines={1}>
                              {player.name.split(' ').pop()}
                            </Text>

                            {/* Position - Bottom */}
                            <Text style={styles.playerPosition}>{positionLabel}</Text>

                            {/* Form indicator - Subtle glow */}
                            {player.form >= 8 && (
                              <View style={styles.formGlow} />
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptySlot}
                      onPress={() => {
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

        {/* Bottom Info Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <TouchableOpacity
              style={styles.changeFormationButton}
              onPress={() => setShowFormationModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={16} color="#1FA2A6" />
              <Text style={styles.changeFormationText} numberOfLines={1}>{formation?.name}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBarRight}>
            <Text style={styles.playerCount}>
              {selectedCount}/11
            </Text>
            <TouchableOpacity
              style={[
                styles.completeButton,
                selectedCount !== 11 && styles.completeButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={selectedCount !== 11}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedCount === 11 ? ['#1FA2A6', '#047857'] : ['#374151', '#374151']}
                style={styles.completeButtonGradient}
              >
                <Text style={styles.completeButtonText}>Tamamla</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Player Selection Modal */}
      <PlayerModal
        visible={showPlayerModal}
        players={editingMode === 'defense' && attackSquadPlayers.length === 11 
          ? attackSquadPlayers 
          : (realPlayers.length > 0 ? realPlayers : players)}
        selectedPlayers={selectedPlayers}
        positionLabel={selectedSlot !== null ? formation?.positions[selectedSlot] : ''}
        onSelect={handlePlayerSelect}
        onClose={() => {
          setShowPlayerModal(false);
          setSelectedSlot(null);
        }}
        isDefenseMode={editingMode === 'defense'}
      />

      {/* Formation Modal */}
      <FormationModal
        visible={showFormationModal}
        formations={formations}
        formationType={formationType}
        onSelect={handleFormationSelect}
        onClose={() => setShowFormationModal(false)}
        onTabChange={setFormationType}
      />

      {/* Player Detail Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          player={selectedPlayerForDetail}
          onClose={() => setSelectedPlayerForDetail(null)}
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
                <Text style={{ fontWeight: '700' }}>Evet:</Text> Defans formasyonu seçip aynı 11 oyuncuyu yeniden konumlandırırsınız.{'\n'}
                <Text style={{ fontWeight: '700' }}>Hayır:</Text> Atak sistemi defans için de kullanılır.
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
    </View>
  );
}

// Formation Modal Component - 3 COLUMN GRID
const FormationModal = ({ visible, formations, formationType, onSelect, onClose, onTabChange }: any) => {
  const [selectedFormationForDetail, setSelectedFormationForDetail] = useState<any>(null);
  const [hoveredFormation, setHoveredFormation] = useState<any>(null); // ✅ Önizleme için
  
  // Filter formations based on type (attack or defense)
  const filteredFormations = formations.filter((f: any) => 
    formationType === 'defense' ? f.type === 'defense' : f.type === 'attack'
  );

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
              {filteredFormations.map((formation: any) => (
                <View key={formation.id} style={styles.formationGridItem}>
                  <TouchableOpacity
                    style={[
                      styles.formationCard,
                      hoveredFormation?.id === formation.id && styles.formationCardSelected,
                    ]}
                    onPress={() => setHoveredFormation(formation)}
                    activeOpacity={0.8}
                  >
                    {/* Formation ID */}
                    <Text style={[
                      styles.formationCardId,
                      hoveredFormation?.id === formation.id && { color: '#1FA2A6' },
                    ]}>
                      {formation.id.replace(/-holding|-false9|-diamond|-attack/g, '')}
                    </Text>

                    {/* Formation Subtitle - From parentheses */}
                    <Text style={styles.formationCardSubtitle} numberOfLines={1}>
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
              ))}
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
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#1FA2A6', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.formationPreviewSelectGradient}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.formationPreviewSelectText}>Bu Dizilişi Seç</Text>
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
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1FA2A6', '#047857']}
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
const PlayerModal = ({ visible, players, selectedPlayers, positionLabel, onSelect, onClose, isDefenseMode }: any) => {
  const [previewPlayer, setPreviewPlayer] = useState<any>(null);
  
  // Filter out already selected players
  const availablePlayers = players.filter(
    (p: any) => !Object.values(selectedPlayers).some((sp: any) => sp?.id === p.id)
  );

  // Check if player can be assigned to position
  const isPlayerEligible = (player: any) => {
    const isGKPosition = positionLabel === 'GK';
    const isGoalkeeper = player.position === 'GK';
    
    // GK position can only have goalkeepers, field positions can only have field players
    return isGKPosition ? isGoalkeeper : !isGoalkeeper;
  };

  // Sort players: eligible first, then locked
  const sortedPlayers = [...availablePlayers].sort((a, b) => {
    const aEligible = isPlayerEligible(a);
    const bEligible = isPlayerEligible(b);
    if (aEligible && !bEligible) return -1;
    if (!aEligible && bEligible) return 1;
    return b.rating - a.rating; // Sort by rating within each group
  });

  const handlePlayerSelect = (player: any) => {
    if (!isPlayerEligible(player)) return; // Prevent selection of ineligible players
    setPreviewPlayer(null);
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

            {/* Players List */}
            <FlatList
              data={sortedPlayers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const eligible = isPlayerEligible(item);
                // Border colors: Elite = Gold, GK = Blue, Others = Gray
                const getBorderColor = () => {
                  if (!eligible) return '#4B5563';
                  if (item.rating >= 85) return '#C9A44C'; // Gold for elite
                  if (item.position === 'GK') return '#3B82F6'; // Blue for GK
                  return '#4B5563'; // Gray for others
                };
                return (
                  <TouchableOpacity
                    style={[
                      styles.playerItem,
                      { borderLeftWidth: 3, borderLeftColor: getBorderColor() },
                      !eligible && styles.playerItemLocked
                    ]}
                    onPress={() => eligible ? setPreviewPlayer(item) : null}
                    activeOpacity={eligible ? 0.7 : 1}
                    disabled={!eligible}
                  >
                    <View style={styles.playerItemLeft}>
                      <View style={[
                        styles.playerItemRating,
                        { backgroundColor: eligible 
                          ? (item.rating >= 85 ? '#C9A44C' : '#1FA2A6') 
                          : '#4B5563' }
                      ]}>
                        <Text style={[
                          styles.playerItemRatingText,
                          !eligible && { opacity: 0.5 }
                        ]}>{item.rating}</Text>
                      </View>
                      <View style={styles.playerItemInfo}>
                        <View style={styles.playerItemNameRow}>
                          <Text style={[
                            styles.playerItemName,
                            !eligible && styles.playerItemNameLocked
                          ]}>{item.name}</Text>
                          {item.form >= 8 && eligible && (
                            <Ionicons name="flame" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
                          )}
                          {item.injury && (
                            <Ionicons name="warning" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Text style={[
                          styles.playerItemPosition,
                          !eligible && styles.playerItemPositionLocked
                        ]}>
                          {item.position} • {item.team}
                        </Text>
                      </View>
                    </View>
                    {/* Lock icon for ineligible, + button for eligible */}
                    {eligible ? (
                      <TouchableOpacity
                        onPress={() => handlePlayerSelect(item)}
                        style={styles.playerItemAddBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle" size={28} color="#1FA2A6" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.playerItemLockedIcon}>
                        <Ionicons name="lock-closed" size={20} color="#6B7280" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.playersList}
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

                {/* Rating Circle */}
                <View style={styles.playerCardRatingCircle}>
                  <Text style={styles.playerCardRatingText}>{previewPlayer.rating}</Text>
                </View>

                {/* Player Name & Position */}
                <Text style={styles.playerCardName}>{previewPlayer.name}</Text>
                <View style={styles.playerCardPositionRow}>
                  <View style={styles.playerCardPositionBadge}>
                    <Text style={styles.playerCardPositionText}>{previewPlayer.position}</Text>
                  </View>
                  <Text style={styles.playerCardTeam}>{previewPlayer.team}</Text>
                </View>

                {/* Nationality & Age */}
                <View style={styles.playerCardInfoRow}>
                  <Text style={styles.playerCardInfoText}>
                    {previewPlayer.nationality || 'Unknown'} • {previewPlayer.age || '?'} yaş
                  </Text>
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
                      { label: 'HIZ', value: previewPlayer.stats.pace, icon: 'flash' },
                      { label: 'ŞUT', value: previewPlayer.stats.shooting, icon: 'football' },
                      { label: 'PAS', value: previewPlayer.stats.passing, icon: 'swap-horizontal' },
                      { label: 'DRİBLİNG', value: previewPlayer.stats.dribbling, icon: 'walk' },
                      { label: 'DEFANS', value: previewPlayer.stats.defending, icon: 'shield' },
                      { label: 'FİZİK', value: previewPlayer.stats.physical, icon: 'fitness' },
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

// Player Detail Modal - FULL STATS
const PlayerDetailModal = ({ player, onClose }: any) => {
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
            colors={['#1E3A3A', '#0F2A24']} // ✅ Design System
            style={styles.playerDetailHeader}
          >
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerDetailHeaderContent}>
              <View style={[
                styles.playerDetailRating,
                { backgroundColor: player.rating >= 85 ? '#C9A44C' : '#1FA2A6' } // ✅ Design System
              ]}>
                <Text style={styles.playerDetailRatingText}>{player.rating}</Text>
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
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Stats & Predictions */}
          <ScrollView style={styles.playerDetailContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.playerDetailSectionTitle}>📊 Oyuncu İstatistikleri</Text>
            
            <View style={styles.statsGrid}>
              {Object.entries(player.stats).map(([key, value]: [string, any]) => {
                const statNames: Record<string, string> = {
                  pace: 'Hız',
                  shooting: 'Şut',
                  passing: 'Pas',
                  dribbling: 'Dribling',
                  defending: 'Savunma',
                  physical: 'Fizik'
                };
                
                const statColor = value >= 80 ? '#1FA2A6' : value >= 70 ? '#F59E0B' : '#9CA3AF';
                
                return (
                  <View key={key} style={styles.statItem}>
                    <Text style={styles.statLabel}>{statNames[key]}</Text>
                    <View style={styles.statBarContainer}>
                      <View style={styles.statBarBackground}>
                        <View 
                          style={[
                            styles.statBarFill, 
                            { width: `${value}%`, backgroundColor: statColor }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.statValue, { color: statColor }]}>{value}</Text>
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
  
  // Football Field
  fieldContainer: {
    flex: 1,
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
  
  // Main Container
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  mainField: {
    flex: 1,
    marginBottom: 8,
  },
  playersContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // Player Slot - Centered on position
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -32 }, { translateY: -38 }], // Half of card size
    zIndex: 1,
  },
  playerCardWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  
  // Player Card - Reduced size to prevent overflow (64x76)
  playerCard: {
    width: 64,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
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
  playerCardGradient: {
    flex: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 100,
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
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  ratingBadge: {
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
  ratingText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
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
  },
  playerPosition: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 1,
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
  
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  bottomBarLeft: {
    flex: 1,
    marginRight: 12,
  },
  changeFormationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeFormationText: {
    fontSize: 12,
    color: '#1FA2A6',
    fontWeight: '500',
    flex: 1,
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  completeButtonText: {
    fontSize: 14,
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
    backgroundColor: '#0F2A24', // ✅ Design System: Primary
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
    backgroundColor: '#0F2A24', // ✅ Design System: Primary
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
  },
  formationPreviewSelectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
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
  },
  formationDetailSelectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
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
  playerItemPosition: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
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
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  },
  playerCardInfoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
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
});
