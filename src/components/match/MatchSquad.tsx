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

interface MatchSquadProps {
  matchData: any;
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
];

// Formation Positions - ALL 26 FORMATIONS (truncated for brevity, keeping structure)
const formationPositions: Record<string, Array<{ x: number; y: number }>> = {
  '2-3-5': [
    { x: 50, y: 95 }, { x: 35, y: 75 }, { x: 65, y: 75 },
    { x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 },
    { x: 15, y: 25 }, { x: 85, y: 25 },
    { x: 35, y: 15 }, { x: 50, y: 10 }, { x: 65, y: 15 },
  ],
  '3-3-3-1': [
    { x: 50, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
    { x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 },
    { x: 15, y: 30 }, { x: 50, y: 25 }, { x: 85, y: 30 },
    { x: 50, y: 10 },
  ],
  '3-3-4': [
    { x: 50, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
    { x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 },
    { x: 15, y: 20 }, { x: 38, y: 15 }, { x: 62, y: 15 }, { x: 85, y: 20 },
  ],
  '3-4-1-2': [
    { x: 50, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
    { x: 10, y: 55 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 90, y: 55 },
    { x: 50, y: 35 },
    { x: 35, y: 15 }, { x: 65, y: 15 },
  ],
  '3-4-2-1': [
    { x: 50, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
    { x: 10, y: 55 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 90, y: 55 },
    { x: 35, y: 30 }, { x: 65, y: 30 },
    { x: 50, y: 10 },
  ],
  '3-4-3': [
    { x: 50, y: 85 }, // GK
    { x: 22, y: 69 }, { x: 50, y: 71 }, { x: 78, y: 69 }, // Defense - V (3)
    { x: 8, y: 48 }, { x: 32, y: 50 }, { x: 68, y: 50 }, { x: 92, y: 48 }, // Midfield - V (4)
    { x: 12, y: 18 }, { x: 50, y: 12 }, { x: 88, y: 18 }, // Attack - V (3)
  ],
  '3-5-2': [
    { x: 50, y: 82 }, // GK
    { x: 20, y: 65 }, { x: 50, y: 67 }, { x: 80, y: 65 }, // Defense - V (3), wider
    { x: 6, y: 42 }, { x: 28, y: 44 }, { x: 50, y: 46 }, { x: 72, y: 44 }, { x: 94, y: 42 }, // Midfield - V (5), wider
    { x: 32, y: 14 }, { x: 68, y: 14 }, // Attack (2), wider
  ],
  '3-6-1': [
    { x: 50, y: 95 }, { x: 25, y: 75 }, { x: 50, y: 75 }, { x: 75, y: 75 },
    { x: 10, y: 55 }, { x: 28, y: 50 }, { x: 42, y: 50 }, { x: 58, y: 50 }, { x: 72, y: 50 }, { x: 90, y: 55 },
    { x: 50, y: 15 },
  ],
  '4-1-2-3': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 50, y: 60 },
    { x: 35, y: 45 }, { x: 65, y: 45 },
    { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 85, y: 20 },
  ],
  '4-1-3-2': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 50, y: 60 },
    { x: 15, y: 40 }, { x: 50, y: 35 }, { x: 85, y: 40 },
    { x: 35, y: 15 }, { x: 65, y: 15 },
  ],
  '4-1-4-1': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 50, y: 60 },
    { x: 15, y: 45 }, { x: 38, y: 45 }, { x: 62, y: 45 }, { x: 85, y: 45 },
    { x: 50, y: 15 },
  ],
  '4-2-2-2': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 35, y: 60 }, { x: 65, y: 60 },
    { x: 35, y: 35 }, { x: 65, y: 35 },
    { x: 35, y: 15 }, { x: 65, y: 15 },
  ],
  '4-2-3-1': [
    { x: 50, y: 82 }, // GK
    { x: 10, y: 64 }, { x: 35, y: 66 }, { x: 65, y: 66 }, { x: 90, y: 64 }, // Defense - V, wider
    { x: 32, y: 50 }, { x: 68, y: 50 }, // CDM - flat, wider
    { x: 10, y: 28 }, { x: 50, y: 26 }, { x: 90, y: 28 }, // CAM - V, wider
    { x: 50, y: 8 }, // ST
  ],
  '4-3-1-2': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 },
    { x: 50, y: 35 },
    { x: 35, y: 15 }, { x: 65, y: 15 },
  ],
  '4-3-2-1': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 30, y: 55 }, { x: 50, y: 55 }, { x: 70, y: 55 },
    { x: 35, y: 30 }, { x: 65, y: 30 },
    { x: 50, y: 10 },
  ],
  '4-3-3': [
    { x: 50, y: 82 }, // GK - moved higher to be visible
    { x: 10, y: 64 }, { x: 35, y: 66 }, { x: 65, y: 66 }, { x: 90, y: 64 }, // Defense - V, wider spread
    { x: 25, y: 42 }, { x: 50, y: 44 }, { x: 75, y: 42 }, // Midfield - V, wider spread
    { x: 10, y: 16 }, { x: 50, y: 10 }, { x: 90, y: 16 }, // Attack - V, wider spread
  ],
  '4-3-3-holding': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 50, y: 60 },
    { x: 35, y: 45 }, { x: 65, y: 45 },
    { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 85, y: 20 },
  ],
  '4-3-3-false9': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 },
    { x: 15, y: 20 }, { x: 50, y: 25 }, { x: 85, y: 20 },
  ],
  '4-4-1-1': [
    { x: 50, y: 85 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // Defense - V
    { x: 12, y: 46 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 88, y: 46 }, // Midfield - V
    { x: 50, y: 26 }, // CAM
    { x: 50, y: 10 }, // ST
  ],
  '4-4-2': [
    { x: 50, y: 82 }, // GK
    { x: 10, y: 64 }, { x: 35, y: 66 }, { x: 65, y: 66 }, { x: 90, y: 64 }, // Defense - V, wider
    { x: 10, y: 42 }, { x: 35, y: 44 }, { x: 65, y: 44 }, { x: 90, y: 42 }, // Midfield - V, wider
    { x: 32, y: 14 }, { x: 68, y: 14 }, // Attack - flat, wider
  ],
  '4-4-2-diamond': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 50, y: 60 },
    { x: 25, y: 45 }, { x: 75, y: 45 },
    { x: 50, y: 30 },
    { x: 35, y: 15 }, { x: 65, y: 15 },
  ],
  '4-5-1': [
    { x: 50, y: 85 }, // GK
    { x: 12, y: 68 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 88, y: 68 }, // Defense - V
    { x: 8, y: 44 }, { x: 30, y: 47 }, { x: 50, y: 48 }, { x: 70, y: 47 }, { x: 92, y: 44 }, // Midfield - V (5)
    { x: 50, y: 12 }, // ST
  ],
  '4-5-1-attack': [
    { x: 50, y: 95 }, { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 },
    { x: 15, y: 50 }, { x: 35, y: 50 }, { x: 50, y: 40 }, { x: 65, y: 50 }, { x: 85, y: 50 },
    { x: 38, y: 30 }, { x: 62, y: 30 },
    { x: 50, y: 10 },
  ],
  '5-3-2': [
    { x: 50, y: 95 }, { x: 10, y: 75 }, { x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }, { x: 90, y: 75 },
    { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 },
    { x: 35, y: 20 }, { x: 65, y: 20 },
  ],
  '5-4-1': [
    { x: 50, y: 85 }, // GK
    { x: 8, y: 67 }, { x: 28, y: 69 }, { x: 50, y: 71 }, { x: 72, y: 69 }, { x: 92, y: 67 }, // Defense - V (5)
    { x: 15, y: 46 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 46 }, // Midfield - V (4)
    { x: 50, y: 12 }, // ST
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

export function MatchSquad({ matchData, onComplete }: MatchSquadProps) {
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Record<number, typeof players[0] | null>>({});
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [formationType, setFormationType] = useState<'attack' | 'defense' | 'balanced'>('attack');
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<typeof players[0] | null>(null);
  
  // Player Predictions State
  const [playerPredictions, setPlayerPredictions] = useState<Record<number, any>>({});

  // Pulsing ball animation
  const scale = useSharedValue(1);
  
  React.useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedBallStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFormationSelect = (formationId: string) => {
    setSelectedFormation(formationId);
    setSelectedPlayers({});
    setShowFormationModal(false);
    Alert.alert('Formasyon Seçildi!', formations.find(f => f.id === formationId)?.name);
  };

  const handlePlayerSelect = (player: typeof players[0]) => {
    if (selectedSlot !== null) {
      setSelectedPlayers({ ...selectedPlayers, [selectedSlot]: player });
      setSelectedSlot(null);
      setShowPlayerModal(false);
      Alert.alert('Oyuncu Eklendi!', `${player.name} kadronuza eklendi`);
    }
  };

  const handleRemovePlayer = (slotIndex: number) => {
    const player = selectedPlayers[slotIndex];
    if (player) {
      Alert.alert(
        'Oyuncu Çıkar',
        `${player.name} yedeğe gönderilsin mi?`,
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Çıkar', 
            style: 'destructive',
            onPress: () => {
              setSelectedPlayers({ ...selectedPlayers, [slotIndex]: null });
            }
          }
        ]
      );
    }
  };

  const handleComplete = () => {
    const selectedCount = Object.keys(selectedPlayers).filter(k => selectedPlayers[parseInt(k)]).length;
    if (selectedCount === 11) {
      Alert.alert(
        'Kadro Tamamlandı! 🎉',
        'Tahmin ekranına yönlendiriliyorsunuz...',
        [{ text: 'Tamam', onPress: onComplete }]
      );
    } else {
      Alert.alert('Kadro Eksik!', `${11 - selectedCount} oyuncu daha seçmelisiniz.`);
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
              colors={['#059669', '#047857']}
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
                    <Animated.View entering={ZoomIn.duration(300)}>
                      <View style={styles.playerCardWrapper}>
                        {/* Remove button - Top Right */}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemovePlayer(index)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Player Card - Main */}
                        <TouchableOpacity
                          style={styles.playerCard}
                          onPress={() => setSelectedPlayerForDetail(player)}
                          onLongPress={() => handleRemovePlayer(index)}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#1E293B', '#0F172A']}
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
              <Ionicons name="swap-horizontal" size={16} color="#059669" />
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
                colors={selectedCount === 11 ? ['#059669', '#047857'] : ['#374151', '#374151']}
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
        players={players}
        selectedPlayers={selectedPlayers}
        positionLabel={selectedSlot !== null ? formation?.positions[selectedSlot] : ''}
        onSelect={handlePlayerSelect}
        onClose={() => {
          setShowPlayerModal(false);
          setSelectedSlot(null);
        }}
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
          predictions={playerPredictions[selectedPlayerForDetail.id] || {}}
          onPredictionChange={(type, value) => {
            setPlayerPredictions(prev => ({
              ...prev,
              [selectedPlayerForDetail.id]: {
                ...(prev[selectedPlayerForDetail.id] || {}),
                [type]: value
              }
            }));
          }}
          onClose={() => setSelectedPlayerForDetail(null)}
        />
      )}
    </View>
  );
}

// Formation Modal Component - 3 COLUMN GRID
const FormationModal = ({ visible, formations, formationType, onSelect, onClose, onTabChange }: any) => {
  const [selectedFormationForDetail, setSelectedFormationForDetail] = useState<any>(null);
  
  // Show all formations in both tabs
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
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(300)}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Defans Dizilişini Belirleyin</Text>
                <Text style={styles.modalSubtitle}>
                  Defans için aynı formasyon seçin veya atak formasyonunuzla aynı kalın
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[styles.modalTab, formationType === 'attack' && styles.modalTabActive]}
                onPress={() => onTabChange('attack')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalTabText,
                  formationType === 'attack' && styles.modalTabTextActive,
                ]}>
                  Atak
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalTab, formationType === 'defense' && styles.modalTabActive]}
                onPress={() => onTabChange('defense')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalTabText,
                  formationType === 'defense' && styles.modalTabTextActive,
                ]}>
                  Defans
                </Text>
              </TouchableOpacity>
            </View>

            {/* Formations Grid - 3 Columns */}
            <ScrollView 
              style={styles.modalScroll} 
              contentContainerStyle={styles.formationGridContainer}
              showsVerticalScrollIndicator={false}
            >
              {filteredFormations.map((formation: any) => (
                <View key={formation.id} style={styles.formationGridItem}>
                  <TouchableOpacity
                    style={styles.formationCard}
                    onPress={() => onSelect(formation.id)}
                    activeOpacity={0.8}
                  >
                    {/* Info Button - Top Right Corner */}
                    <TouchableOpacity
                      style={styles.formationInfoButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedFormationForDetail(formation);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="information-circle" size={14} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Formation ID - Clean (only numbers) */}
                    <Text style={styles.formationCardId}>
                      {formation.id.split('-').slice(0, 3).join('-')}
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

            {/* Info Note */}
            <View style={styles.formationInfoNote}>
              <Ionicons name="information-circle" size={16} color="#9CA3AF" />
              <Text style={styles.formationInfoNoteText}>
                Defans dizilişi seçimi farklı dizilişi seç
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Formation Detail Modal */}
      {selectedFormationForDetail && (
        <FormationDetailModal
          formation={selectedFormationForDetail}
          onClose={() => setSelectedFormationForDetail(null)}
          onSelect={(formation: any) => {
            setSelectedFormation(formation);
            setSelectedFormationForDetail(null);
            setShowFormationModal(false);
          }}
        />
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
        entering={ZoomIn.duration(300)}
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
            colors={['#059669', '#047857']}
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
const PlayerModal = ({ visible, players, selectedPlayers, positionLabel, onSelect, onClose }: any) => {
  const availablePlayers = players.filter(
    (p: any) => !Object.values(selectedPlayers).some((sp: any) => sp?.id === p.id)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Oyuncu Seç</Text>
              <Text style={styles.modalSubtitle}>Pozisyon: {positionLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Players List */}
          <FlatList
            data={availablePlayers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playerItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.playerItemLeft}>
                  <View style={[
                    styles.playerItemRating,
                    { backgroundColor: item.rating >= 85 ? '#F59E0B' : '#059669' }
                  ]}>
                    <Text style={styles.playerItemRatingText}>{item.rating}</Text>
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
                    <Text style={styles.playerItemPosition}>
                      {item.position} • {item.team}
                    </Text>
                  </View>
                </View>
                <Ionicons name="add-circle" size={24} color="#059669" />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.playersList}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Player Detail Modal - FULL STATS WITH PREDICTIONS
const PlayerDetailModal = ({ player, predictions, onPredictionChange, onClose }: any) => {
  const [showSubstituteSection, setShowSubstituteSection] = useState(false);
  const [showInjurySubstituteSection, setShowInjurySubstituteSection] = useState(false);

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={styles.playerDetailModal}
        >
          {/* Header */}
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.playerDetailHeader}
          >
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerDetailHeaderContent}>
              <View style={[
                styles.playerDetailRating,
                { backgroundColor: player.rating >= 85 ? '#F59E0B' : '#059669' }
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
                
                const statColor = value >= 80 ? '#059669' : value >= 70 ? '#F59E0B' : '#9CA3AF';
                
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
                <Ionicons name="fitness" size={20} color="#059669" />
                <Text style={styles.infoCardLabel}>Form</Text>
                <Text style={styles.infoCardValue}>{player.form}/10</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="shirt" size={20} color="#059669" />
                <Text style={styles.infoCardLabel}>Pozisyon</Text>
                <Text style={styles.infoCardValue}>{player.position}</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="person" size={20} color="#059669" />
                <Text style={styles.infoCardLabel}>Yaş</Text>
                <Text style={styles.infoCardValue}>{player.age}</Text>
              </View>
            </View>

            {/* Prediction Section */}
            <View style={styles.predictionSection}>
              <Text style={styles.playerDetailSectionTitle}>🔮 Oyuncu Tahminleri</Text>
              
              {/* Oyundan Çıkar */}
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.substitutedOut && styles.predictionButtonActive
                ]}
                onPress={() => {
                  onPredictionChange('substitutedOut', !predictions.substitutedOut);
                  setShowSubstituteSection(!showSubstituteSection);
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.substitutedOut && styles.predictionButtonTextActive
                ]}>
                  {predictions.substitutePlayer ? (
                    `🔄 ${player.name} çıkar - ${substitutePlayers.find(p => p.id === predictions.substitutePlayer)?.name} girer`
                  ) : (
                    '🔄 Oyundan Çıkar'
                  )}
                </Text>
              </TouchableOpacity>

              {/* Substitute Player Selection */}
              {showSubstituteSection && (
                <Animated.View entering={SlideInDown.duration(300)} style={styles.substituteSelectionArea}>
                  <Text style={styles.substituteSelectionTitle}>Yerine Girecek Oyuncu:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {substitutePlayers.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.substituteCard,
                          predictions.substitutePlayer === sub.id && styles.substituteCardSelected
                        ]}
                        onPress={() => {
                          onPredictionChange('substitutePlayer', sub.id);
                          setShowSubstituteSection(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.substituteNumber}>
                          <Text style={styles.substituteNumberText}>{sub.number}</Text>
                        </View>
                        <Text style={styles.substituteName}>{sub.name}</Text>
                        <Text style={styles.substitutePosition}>{sub.position} • {sub.rating}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Sakatlanarak Çıkar */}
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.injuredOut && styles.predictionButtonActive
                ]}
                onPress={() => {
                  onPredictionChange('injuredOut', !predictions.injuredOut);
                  setShowInjurySubstituteSection(!showInjurySubstituteSection);
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.predictionButtonText,
                  predictions.injuredOut && styles.predictionButtonTextActive
                ]}>
                  {predictions.injurySubstitutePlayer ? (
                    `🚑 ${player.name} çıkar - ${substitutePlayers.find(p => p.id === predictions.injurySubstitutePlayer)?.name} girer`
                  ) : (
                    '🚑 Sakatlanarak Çıkar'
                  )}
                </Text>
              </TouchableOpacity>

              {/* Injury Substitute Player Selection */}
              {showInjurySubstituteSection && (
                <Animated.View entering={SlideInDown.duration(300)} style={styles.substituteSelectionArea}>
                  <Text style={styles.substituteSelectionTitle}>Sakatlık Yedeği:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {substitutePlayers.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.substituteCard,
                          predictions.injurySubstitutePlayer === sub.id && styles.substituteCardSelected
                        ]}
                        onPress={() => {
                          onPredictionChange('injurySubstitutePlayer', sub.id);
                          setShowInjurySubstituteSection(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.substituteNumber}>
                          <Text style={styles.substituteNumberText}>{sub.number}</Text>
                        </View>
                        <Text style={styles.substituteName}>{sub.name}</Text>
                        <Text style={styles.substitutePosition}>{sub.position} • {sub.rating}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
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
                colors={['#059669', '#047857']}
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
    backgroundColor: '#0F172A',
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
  
  // Player Slot
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -36 }, { translateY: -42 }],
    zIndex: 1,
  },
  playerCardWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  
  // Player Card - Optimized size (72x84)
  playerCard: {
    width: 72,
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playerCardGradient: {
    flex: 1,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 100,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ratingBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingText: {
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
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
    width: 72,
    height: 84,
    borderRadius: 10,
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
    fontSize: 9,
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
    color: '#059669',
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
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  modalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalTabActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  modalTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  modalTabTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  
  // Formation Grid - 3 Columns COMPACT
  formationGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingBottom: 20,
    gap: 3,
    justifyContent: 'space-between',
  },
  formationGridItem: {
    width: '32%', // 3 columns with smaller gap
    marginBottom: 3,
  },
  formationCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
    position: 'relative',
  },
  formationInfoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  formationCardId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  formationCardSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  formationInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  formationInfoNoteText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
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
    backgroundColor: '#1E293B',
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
    color: '#059669',
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
    backgroundColor: '#059669',
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
  
  // Player Detail Modal
  playerDetailModal: {
    backgroundColor: '#1E293B',
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
    color: '#059669',
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

  // Prediction Section
  predictionSection: {
    marginTop: 20,
    gap: 12,
  },
  predictionButton: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 14,
  },
  predictionButtonActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: '#059669',
  },
  predictionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  predictionButtonTextActive: {
    color: '#059669',
  },

  // Substitute Selection Area
  substituteSelectionArea: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  substituteSelectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  substituteCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  substituteCardSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: '#059669',
  },
  substituteNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  substituteName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  substitutePosition: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
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
