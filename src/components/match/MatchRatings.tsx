// MatchRatingsScreen.tsx - React Native FULL VERSION
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import api from '../../services/api';
import { supabase } from '../../config/supabase';
import { useFavoriteSquads } from '../../hooks/useFavoriteSquads';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

// Web için reanimated animasyonları desteklenmiyor
let Animated: any;
let FadeIn: any;
let ZoomIn: any;

if (isWeb) {
  // Web için React Native Animated kullan (animasyon yok)
  Animated = { View: RNAnimated.View };
  FadeIn = undefined;
  ZoomIn = undefined;
} else {
  // Native için reanimated kullan; yüklenemezse fallback
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default || Reanimated;
    FadeIn = Reanimated.FadeIn;
    ZoomIn = Reanimated.ZoomIn;
  } catch (_e) {
    Animated = { View: RNAnimated.View };
    FadeIn = undefined;
    ZoomIn = undefined;
  }
}
import {
  generateMatchAnalysisReport,
  getClusterName,
  getClusterIcon,
} from '../../services/predictionScoringService';
import { TrainingType, FocusPrediction, AnalysisCluster } from '../../types/prediction.types';
import ScoringEngine from '../../logic/ScoringEngine';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS, TEXT } from '../../config/constants';
import { handleError, ErrorType } from '../../utils/GlobalErrorHandler';
import { checkAndAwardBadges, UserStats, BadgeAwardResult } from '../../services/badgeService';
import { getBadgeColor, getBadgeTierName } from '../../types/badges.types';

const { width, height } = Dimensions.get('window');

interface MatchRatingsScreenProps {
  matchData: any;
  lineups?: any;
  favoriteTeamIds?: number[];
}

interface Player {
  id: number;
  number: number;
  name: string;
  position: string;
  photo?: string | null;
}

// Coach Rating Categories
const coachCategories = [
  { 
    id: 1,
    emoji: '⚽',
    title: 'Sonuç & Beklenti Yönetimi', 
    weight: 20,
    description: 'Maç sonucu, favori-underdog farkı, skor yönetimi',
    color: '#1FA2A6'
  },
  { 
    id: 2,
    emoji: '🧩',
    title: 'İlk 11 & Diziliş Kararı', 
    weight: 18,
    description: 'Pozisyon, oyuncu-rol uyumu, rakibe göre diziliş',
    color: '#3B82F6'
  },
  { 
    id: 3,
    emoji: '🔁',
    title: 'Oyuncu Değişiklikleri', 
    weight: 17,
    description: 'Zamanlama, giren oyuncunun katkısı, skora etki',
    color: '#A855F7'
  },
  { 
    id: 4,
    emoji: '⏱️',
    title: 'Maç İçi Reaksiyon', 
    weight: 15,
    description: 'Gole tepki, tempo kontrolü, kritik anlar',
    color: '#F97316'
  },
  { 
    id: 5,
    emoji: '🟨',
    title: 'Disiplin & Takım Kontrolü', 
    weight: 10,
    description: 'Kart sayısı, gereksiz kartlar, oyun kontrolü',
    color: '#EAB308'
  },
  { 
    id: 6,
    emoji: '🧠',
    title: 'Maç Sonu Yönetimi', 
    weight: 10,
    description: 'Skoru koruma, son dakika hamleleri, risk dengesi',
    color: '#6366F1'
  },
  { 
    id: 7,
    emoji: '🎤',
    title: 'Basınla İlişkiler & Sempati', 
    weight: 10,
    description: 'Basın toplantısı, röportaj tavrı, kamuoyu yönetimi',
    color: '#14B8A6'
  },
];

import { BRAND, DARK_MODE } from '../../theme/theme';

// ⚽ Saha oyuncusu değerlendirme kategorileri
const OUTFIELD_RATING_CATEGORIES = [
  { id: 'pace', emoji: '⚡', title: 'Hız', color: '#22C55E' },
  { id: 'shooting', emoji: '🎯', title: 'Şut', color: '#EF4444' },
  { id: 'passing', emoji: '🎨', title: 'Pas', color: '#3B82F6' },
  { id: 'dribbling', emoji: '🌀', title: 'Dribling', color: '#F59E0B' },
  { id: 'defending', emoji: '🛡️', title: 'Savunma', color: '#8B5CF6' },
  { id: 'physical', emoji: '💪', title: 'Fizik', color: '#06B6D4' },
];

// 🧤 Kaleci değerlendirme kategorileri
const GK_RATING_CATEGORIES = [
  { id: 'reflexes', emoji: '⚡', title: 'Refleks', color: '#22C55E' },
  { id: 'positioning', emoji: '📐', title: 'Pozisyon', color: '#3B82F6' },
  { id: 'rushing', emoji: '🏃', title: 'Çıkış', color: '#EF4444' },
  { id: 'handling', emoji: '🧤', title: 'El Becerisi', color: '#F59E0B' },
  { id: 'communication', emoji: '📢', title: 'İletişim', color: '#8B5CF6' },
  { id: 'longball', emoji: '🦶', title: 'Uzun Top', color: '#06B6D4' },
];

// Pozisyona göre kategori seçici
const getRatingCategories = (position: string) => 
  position === 'GK' ? GK_RATING_CATEGORIES : OUTFIELD_RATING_CATEGORIES;

export const MatchRatings: React.FC<MatchRatingsScreenProps> = ({
  matchData,
  lineups,
  favoriteTeamIds = [],
}) => {
  // ⚽ Takım kadrosu state
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [squadLoading, setSquadLoading] = useState(false);
  
  // Favori takım ID'sini belirle (önce favori takım, yoksa ev sahibi)
  const homeTeamId = matchData?.homeTeam?.id || matchData?.teams?.home?.id;
  const awayTeamId = matchData?.awayTeam?.id || matchData?.teams?.away?.id;
  
  // Favori takımı bul - eğer maçtaki takımlardan biri favoriyse onu kullan
  const targetTeamId = useMemo(() => {
    if (favoriteTeamIds.length > 0) {
      if (homeTeamId && favoriteTeamIds.includes(homeTeamId)) return homeTeamId;
      if (awayTeamId && favoriteTeamIds.includes(awayTeamId)) return awayTeamId;
    }
    return homeTeamId; // Favori yoksa ev sahibi
  }, [homeTeamId, awayTeamId, favoriteTeamIds]);

  // Favori takımın bilgileri (TD adı, takım adı)
  const targetTeamInfo = useMemo(() => {
    const isHomeTeam = targetTeamId === homeTeamId;
    const teamData = isHomeTeam 
      ? (matchData?.homeTeam || matchData?.teams?.home)
      : (matchData?.awayTeam || matchData?.teams?.away);
    
    return {
      name: teamData?.name || 'Takım',
      manager: teamData?.manager || '',
      logo: teamData?.logo || '⚽',
    };
  }, [targetTeamId, homeTeamId, matchData]);

  // Favori kadro: DB'den (Supabase team_squads) yüklenir
  const { getSquad: getCachedSquad, squads: favoriteSquads, loading: favoriteSquadsLoading, version: favoriteSquadsVersion } = useFavoriteSquads(favoriteTeamIds);

  // Fallback kadroları (DB'de veri yoksa) - 2025/26 sezonu güncel
  const FALLBACK_SQUADS: Record<number, Player[]> = useMemo(() => ({
    // Galatasaray (645)
    645: [
      { id: 1, number: 1, name: 'F. Muslera', position: 'GK' },
      { id: 2, number: 97, name: 'G. Güveli', position: 'GK' },
      { id: 3, number: 2, name: 'D. Sanchez', position: 'DF' },
      { id: 4, number: 3, name: 'A. Nelsson', position: 'DF' },
      { id: 5, number: 4, name: 'Abdülkerim', position: 'DF' },
      { id: 6, number: 22, name: 'S. Jakobs', position: 'DF' },
      { id: 7, number: 42, name: 'K. Ayhan', position: 'DF' },
      { id: 8, number: 55, name: 'Y. Sağlam', position: 'DF' },
      { id: 9, number: 6, name: 'L. Torreira', position: 'MF' },
      { id: 10, number: 7, name: 'K. Aktürkoğlu', position: 'MF' },
      { id: 11, number: 8, name: 'B. Yılmaz', position: 'MF' },
      { id: 12, number: 10, name: 'D. Mertens', position: 'MF' },
      { id: 13, number: 14, name: 'Sergio Oliveira', position: 'MF' },
      { id: 14, number: 20, name: 'Y. Kutlu', position: 'MF' },
      { id: 15, number: 52, name: 'J. Sara', position: 'MF' },
      { id: 16, number: 9, name: 'M. Icardi', position: 'FW' },
      { id: 17, number: 11, name: 'H. Oğuz', position: 'FW' },
      { id: 18, number: 18, name: 'D. Mata', position: 'FW' },
      { id: 19, number: 19, name: 'E. Elmas', position: 'MF' },
      { id: 20, number: 23, name: 'M. Demirbay', position: 'MF' },
      { id: 21, number: 70, name: 'B. Yılmaz', position: 'FW' },
      { id: 22, number: 77, name: 'E. Kılınç', position: 'FW' },
      { id: 23, number: 89, name: 'O. Bulut', position: 'FW' },
    ],
    // Fenerbahçe (611)
    611: [
      { id: 101, number: 1, name: 'D. Livakovic', position: 'GK' },
      { id: 102, number: 98, name: 'I. Bayındır', position: 'GK' },
      { id: 103, number: 3, name: 'S. Aziz', position: 'DF' },
      { id: 104, number: 4, name: 'C. Söyüncü', position: 'DF' },
      { id: 105, number: 22, name: 'B. Osterwolde', position: 'DF' },
      { id: 106, number: 24, name: 'B. Kadioglu', position: 'DF' },
      { id: 107, number: 33, name: 'R. Becao', position: 'DF' },
      { id: 108, number: 77, name: 'M. Djiku', position: 'DF' },
      { id: 109, number: 5, name: 'F. Kadıoğlu', position: 'MF' },
      { id: 110, number: 6, name: 'İ. Kahveci', position: 'MF' },
      { id: 111, number: 8, name: 'M. Fred', position: 'MF' },
      { id: 112, number: 10, name: 'D. Szymanski', position: 'MF' },
      { id: 113, number: 14, name: 'İ. Yüksek', position: 'MF' },
      { id: 114, number: 20, name: 'B. Arao', position: 'MF' },
      { id: 115, number: 7, name: 'C. Ünder', position: 'FW' },
      { id: 116, number: 9, name: 'E. Dzeko', position: 'FW' },
      { id: 117, number: 11, name: 'M. Tadic', position: 'FW' },
      { id: 118, number: 17, name: 'Y. En-Nesyri', position: 'FW' },
      { id: 119, number: 19, name: 'S. Saint-Maximin', position: 'FW' },
      { id: 120, number: 23, name: 'B. Yıldırım', position: 'FW' },
      { id: 121, number: 99, name: 'E. Valencia', position: 'FW' },
    ],
    // Beşiktaş (549)
    549: [
      { id: 201, number: 1, name: 'M. Günok', position: 'GK' },
      { id: 202, number: 3, name: 'A. Uçan', position: 'DF' },
      { id: 203, number: 4, name: 'G. Paulista', position: 'DF' },
      { id: 204, number: 13, name: 'F. Toprak', position: 'DF' },
      { id: 205, number: 22, name: 'E. Matic', position: 'DF' },
      { id: 206, number: 8, name: 'G. Fernandes', position: 'MF' },
      { id: 207, number: 10, name: 'R. Ghezzal', position: 'MF' },
      { id: 208, number: 14, name: 'C. Tosun', position: 'FW' },
      { id: 209, number: 17, name: 'M. Muleka', position: 'FW' },
      { id: 210, number: 70, name: 'S. Güler', position: 'FW' },
    ],
    // Trabzonspor (607)
    607: [
      { id: 301, number: 1, name: 'U. Çakır', position: 'GK' },
      { id: 302, number: 3, name: 'Eren E.', position: 'DF' },
      { id: 303, number: 4, name: 'B. Denswil', position: 'DF' },
      { id: 304, number: 22, name: 'M. Cham', position: 'DF' },
      { id: 305, number: 6, name: 'A. Bardakçı', position: 'MF' },
      { id: 306, number: 10, name: 'E. Visca', position: 'MF' },
      { id: 307, number: 23, name: 'T. Trezeguet', position: 'MF' },
      { id: 308, number: 9, name: 'P. Onuachu', position: 'FW' },
      { id: 309, number: 11, name: 'A. Ömür', position: 'FW' },
      { id: 310, number: 17, name: 'M. Bakasetas', position: 'FW' },
    ],
  }), []);

  // Lineups'tan oyuncuları çıkar (favori takım)
  const getPlayersFromLineups = useMemo((): Player[] => {
    if (!lineups) return [];
    
    const lineupsArray = Array.isArray(lineups) ? lineups : (lineups as any)?.data;
    if (!lineupsArray?.length) return [];
    
    // Favori takımın lineup'ını bul
    const teamLineup = lineupsArray.find((l: any) => l.team?.id === targetTeamId) || lineupsArray[0];
    if (!teamLineup) return [];
    
    const players: Player[] = [];
    
    if (teamLineup.startXI) {
      teamLineup.startXI.forEach((item: any, idx: number) => {
        const p = item.player || item;
        if (p) {
          players.push({
            id: p.id || idx + 1,
            number: p.number || idx + 1,
            name: p.name || 'Bilinmiyor',
            position: p.pos || p.position || 'MF',
            photo: p.photo || null,
          });
        }
      });
    }
    
    if (teamLineup.substitutes) {
      teamLineup.substitutes.forEach((item: any, idx: number) => {
        const p = item.player || item;
        if (p) {
          players.push({
            id: p.id || 100 + idx,
            number: p.number || 12 + idx,
            name: p.name || 'Bilinmiyor',
            position: p.pos || p.position || 'MF',
            photo: p.photo || null,
          });
        }
      });
    }
    
    return players;
  }, [lineups, targetTeamId]);

  // ⚽ Kadro kaynağı: 1) Lineups, 2) DB cache (useFavoriteSquads), 3) Fallback
  useEffect(() => {
    if (!targetTeamId) return;
    
    // 1) Maç günü kadrosu (lineups varsa)
    if (getPlayersFromLineups.length > 0) {
      console.log('✅ [Ratings] Kadro: lineups →', getPlayersFromLineups.length, 'oyuncu');
      setSquadPlayers(getPlayersFromLineups);
      return;
    }
    
    // 2) DB'den yüklenmiş kadro (useFavoriteSquads hook)
    const cached = getCachedSquad(targetTeamId);
    if (cached && cached.length > 0) {
      console.log('✅ [Ratings] Kadro: DB cache →', cached.length, 'oyuncu (team', targetTeamId, ')');
      setSquadPlayers(cached);
      return;
    }
    
    // DB yüklemesi devam ediyorsa bekle
    if (favoriteSquadsLoading) {
      console.log('⏳ [Ratings] DB cache yükleniyor, bekleniyor...');
      return;
    }
    
    // 3) DB'de yoksa fallback
    if (FALLBACK_SQUADS[targetTeamId]) {
      console.log('⚠️ [Ratings] Kadro: fallback → team', targetTeamId);
      setSquadPlayers(FALLBACK_SQUADS[targetTeamId]);
    } else {
      console.log('❌ [Ratings] Kadro bulunamadı: team', targetTeamId);
    }
  }, [targetTeamId, getPlayersFromLineups, getCachedSquad, favoriteSquadsVersion, favoriteSquadsLoading, FALLBACK_SQUADS]);
  
  // Önce squad API'den, yoksa lineups'tan al
  const playersFromLineups = squadPlayers.length > 0 ? squadPlayers : getPlayersFromLineups;
  // Tab state
  const [activeTab, setActiveTab] = useState<'coach' | 'player'>('coach');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [pendingTab, setPendingTab] = useState<'coach' | 'player' | null>(null);
  
  // Değişiklik takibi (ref = tıklamada her zaman güncel, stale closure önlenir)
  const [coachRatingsChanged, setCoachRatingsChanged] = useState(false);
  const [playerRatingsChanged, setPlayerRatingsChanged] = useState(false);
  const coachRatingsChangedRef = useRef(false);
  const playerRatingsChangedRef = useRef(false);
  coachRatingsChangedRef.current = coachRatingsChanged;
  playerRatingsChangedRef.current = playerRatingsChanged;
  
  // Coach rating state
  const initialCoachRatings = useRef<{[key: number]: number}>({
    1: 7.5,
    2: 8.0,
    3: 6.5,
    4: 7.0,
    5: 8.5,
    6: 7.5,
    7: 8.0,
  });
  const [coachRatings, setCoachRatings] = useState<{[key: number]: number}>({
    1: 7.5,
    2: 8.0,
    3: 6.5,
    4: 7.0,
    5: 8.5,
    6: 7.5,
    7: 8.0,
  });

  // ⚽ Player rating state
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [playerRatings, setPlayerRatings] = useState<{[playerId: number]: {[categoryId: string]: number}}>({});
  
  // Scroll ref ve player card pozisyonları
  const scrollViewRef = useRef<ScrollView>(null);
  const playerCardRefs = useRef<{[playerId: number]: number}>({});
  
  // Futbolcuları forma numarasına göre sırala
  const sortedPlayers = [...playersFromLineups].sort((a, b) => a.number - b.number);

  // Topluluk değerlendirme verileri (mock - ileride API'den gelecek)
  const getPlayerCommunityData = useCallback((playerId: number) => {
    // Her oyuncu için rastgele ama tutarlı mock veri
    const seed = playerId % 100;
    const voters = 200 + (seed * 13) % 800;
    const communityAvg = 5.5 + ((seed * 7) % 35) / 10;
    return {
      voters,
      communityAvg: Math.min(9.5, communityAvg),
    };
  }, []);

  // Futbolcuya tıklandığında kartı ekranın üstüne scroll et
  const handlePlayerToggle = useCallback((playerId: number, isCurrentlyExpanded: boolean) => {
    if (isCurrentlyExpanded) {
      // Kapatıyoruz
      setExpandedPlayerId(null);
    } else {
      // Açıyoruz
      setExpandedPlayerId(playerId);
      // Kısa gecikme ile scroll et (expanded panel renderlansin)
      setTimeout(() => {
        const cardY = playerCardRefs.current[playerId];
        if (cardY !== undefined && scrollViewRef.current) {
          // cardY: container içindeki offset
          // scrollContent padding 16px, üstten 6px boşluk bırak
          const scrollTarget = cardY + 10;
          scrollViewRef.current.scrollTo({ y: Math.max(0, scrollTarget), animated: true });
        }
      }, 120);
    }
  }, []);

  // Futbolcu değerlendirme güncelleme
  const updatePlayerRating = (playerId: number, categoryId: string, value: number) => {
    setPlayerRatings(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [categoryId]: value,
      }
    }));
    setPlayerRatingsChanged(true);
  };

  // Tüm kategorilere aynı puanı ver
  const setAllRatings = (playerId: number, position: string, score: number) => {
    const categories = getRatingCategories(position);
    const newRatings: {[key: string]: number} = {};
    categories.forEach(cat => { newRatings[cat.id] = score; });
    setPlayerRatings(prev => ({ ...prev, [playerId]: newRatings }));
    setPlayerRatingsChanged(true);
  };
  
  // 🔄 TAB DEĞİŞTİRME - kaydetme kontrolü (ref ile güncel değer, popup kesin çıkar)
  const handleTabSwitch = useCallback((newTab: 'coach' | 'player') => {
    if (newTab === activeTab) return;
    
    const coachChanged = coachRatingsChangedRef.current;
    const playerChanged = playerRatingsChangedRef.current;
    const hasUnsavedChanges = activeTab === 'coach' ? coachChanged : playerChanged;
    
    if (hasUnsavedChanges) {
      setPendingTab(newTab);
      setShowSavePopup(true);
    } else {
      setActiveTab(newTab);
    }
  }, [activeTab]);
  
  // Kaydet ve geç
  const handleSaveAndSwitch = async () => {
    if (activeTab === 'coach') {
      await handleSaveRatings(true); // silent save
    } else {
      await handleSavePlayerRatings(true); // silent save
    }
    setShowSavePopup(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };
  
  // Kaydetmeden geç
  const handleDiscardAndSwitch = () => {
    setShowSavePopup(false);
    if (pendingTab) {
      // Değişiklikleri sıfırla
      if (activeTab === 'coach') {
        setCoachRatings({ ...initialCoachRatings.current });
        setCoachRatingsChanged(false);
      } else {
        setPlayerRatingsChanged(false);
      }
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  // Futbolcu ortalama puanı hesapla (tüm kategoriler için, varsayılan 5.0)
  const getPlayerAverageRating = useCallback((playerId: number, position?: string): number => {
    const ratings = playerRatings[playerId];
    if (!ratings || Object.keys(ratings).length === 0) return 0;
    
    // Pozisyona göre kategorileri al
    const playerPosition = position || sortedPlayers.find(p => p.id === playerId)?.position || 'MF';
    const categories = getRatingCategories(playerPosition);
    
    // Tüm kategorilerin ortalamasını al (puanlanmamış için 5.0)
    let total = 0;
    categories.forEach(cat => {
      total += ratings[cat.id] ?? 5.0; // Varsayılan 5.0
    });
    
    return total / categories.length;
  }, [playerRatings, sortedPlayers]);

  // Puan rengini hesapla
  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#22C55E';
    if (rating >= 6) return '#F59E0B';
    if (rating >= 4) return '#F97316';
    return '#EF4444';
  };

  // 🌟 PREDICTION SCORING STATE
  const [predictionReport, setPredictionReport] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // 🏆 BADGE AWARD STATE
  const [newBadges, setNewBadges] = useState<BadgeAwardResult[]>([]);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  // Load predictions and calculate scores
  React.useEffect(() => {
    loadPredictionsAndCalculateScores();
  }, []);

  const loadPredictionsAndCalculateScores = async () => {
    try {
      // Try new key first, fallback to legacy key
      const predictionDataStr = await AsyncStorage.getItem(
        `${STORAGE_KEYS.PREDICTIONS}${matchData.id}`
      ) || await AsyncStorage.getItem(
        `${LEGACY_STORAGE_KEYS.PREDICTIONS}${matchData.id}`
      );
      
      if (!predictionDataStr) return;
      
      const predictionData = JSON.parse(predictionDataStr);
      const { matchPredictions, focusedPredictions } = predictionData;
      
      // Mock actual results (in production, this would come from API)
      const actualResults = {
        firstHalfHomeScore: 1,
        firstHalfAwayScore: 0,
        totalGoals: '2-3 gol',
        yellowCards: '3-4 kart',
        // ... other actual results
      };
      
      // Generate analysis report
      const report = generateMatchAnalysisReport(
        matchPredictions,
        actualResults,
        null, // Training focus removed
        focusedPredictions as FocusPrediction[]
      );
      
      setPredictionReport(report);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const handleSaveRatings = async (silent = false) => {
    try {
      // Calculate average rating
      const ratingsArray = Object.values(coachRatings);
      const averageRating = ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length;

      // Save ratings to AsyncStorage
      const ratingsData = {
        matchId: matchData.id,
        coachRatings: coachRatings,
        averageRating: averageRating.toFixed(1),
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.RATINGS}${matchData.id}`,
        JSON.stringify(ratingsData)
      );
      
      console.log('✅ Coach ratings saved!', ratingsData);
      initialCoachRatings.current = { ...coachRatings };
      setCoachRatingsChanged(false);
      
      // 🏆 CHECK AND AWARD BADGES
      await checkAndAwardBadgesForMatch();
      
      if (!silent) {
        Alert.alert(
          'Değerlendirmeler Kaydedildi! ⭐',
          `Teknik direktöre ortalama ${averageRating.toFixed(1)} puan verdiniz.`,
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error saving ratings:', error);
      if (!silent) {
        Alert.alert('Hata!', 'Değerlendirmeler kaydedilemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // ⚽ Futbolcu değerlendirmelerini kaydet
  const handleSavePlayerRatings = async (silent = false) => {
    try {
      const playerRatingsData = {
        matchId: matchData.id,
        playerRatings: playerRatings,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.RATINGS}${matchData.id}_players`,
        JSON.stringify(playerRatingsData)
      );
      
      console.log('✅ Player ratings saved!', playerRatingsData);
      setPlayerRatingsChanged(false);
      
      if (!silent) {
        Alert.alert(
          'Değerlendirmeler Kaydedildi! ⚽',
          'Futbolcu değerlendirmeleriniz kaydedildi.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error saving player ratings:', error);
      if (!silent) {
        Alert.alert('Hata!', 'Değerlendirmeler kaydedilemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // 🏆 CHECK AND AWARD BADGES
  const checkAndAwardBadgesForMatch = async () => {
    try {
      if (!predictionReport) return;

      // Build user stats from prediction report
      const userStats: UserStats = {
        totalPredictions: predictionReport.totalPredictions || 0,
        correctPredictions: predictionReport.correctPredictions || 0,
        accuracy: predictionReport.accuracy || 0,
        currentStreak: 5, // TODO: Get from AsyncStorage
        longestStreak: 10, // TODO: Get from AsyncStorage
        leagueStats: {
          '203': { // Süper Lig (example)
            total: predictionReport.totalPredictions || 0,
            correct: predictionReport.correctPredictions || 0,
            accuracy: predictionReport.accuracy || 0,
          },
        },
        clusterStats: {
          [AnalysisCluster.TEMPO_FLOW]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.TEMPO_FLOW)?.accuracy || 0,
          },
          [AnalysisCluster.DISCIPLINE]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.DISCIPLINE)?.accuracy || 0,
          },
          [AnalysisCluster.PHYSICAL_WEAR]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.PHYSICAL_WEAR)?.accuracy || 0,
          },
          [AnalysisCluster.INDIVIDUAL_PERFORMANCE]: {
            total: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.totalPredictions || 0,
            correct: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.correctPredictions || 0,
            accuracy: predictionReport.clusterScores.find((c: any) => c.cluster === AnalysisCluster.INDIVIDUAL_PERFORMANCE)?.accuracy || 0,
          },
        },
        perfectMatches: predictionReport.accuracy === 100 ? 1 : 0,
      };

      // Check for new badges
      const awardedBadges = await checkAndAwardBadges(userStats);

      if (awardedBadges.length > 0) {
        console.log('🎉 New badges awarded:', awardedBadges);
        setNewBadges(awardedBadges);
        setCurrentBadgeIndex(0);
        setShowBadgePopup(true);
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // 🏆 SHOW NEXT BADGE
  const showNextBadge = () => {
    if (currentBadgeIndex < newBadges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      setShowBadgePopup(false);
      setNewBadges([]);
      setCurrentBadgeIndex(0);
    }
  };

  // Community average ratings (mock data)
  const communityRatings: {[key: number]: number} = {
    1: 8.2,
    2: 7.3,
    3: 7.8,
    4: 6.9,
    5: 7.5,
    6: 8.1,
    7: 7.7,
  };

  const totalVoters = 1247;

  // Calculate total weighted score
  const calculateTotalScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (coachRatings[category.id] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  const calculateCommunityScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (communityRatings[category.id] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  const handleRatingChange = (categoryId: number, rating: number) => {
    setCoachRatings(prev => ({
      ...prev,
      [categoryId]: rating
    }));
    setCoachRatingsChanged(true);
  };

  const userScore = parseFloat(calculateTotalScore());
  const communityScore = parseFloat(calculateCommunityScore());

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Bar - İstatistik sekmesiyle aynı stil */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coach' && styles.tabActive]}
          onPress={() => handleTabSwitch('coach')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'coach' && styles.tabTextActive
          ]}>
            👔 TD Değerlendirmesi
          </Text>
          {activeTab === 'coach' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'player' && styles.tabActive]}
          onPress={() => handleTabSwitch('player')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'player' && styles.tabTextActive
          ]}>
            ⚽ Futbolcu Değerlendirmeleri
          </Text>
          {activeTab === 'player' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'coach' ? (
        <>
        {/* Premium Header Card */}
        <Animated.View 
          entering={isWeb ? undefined : FadeIn.duration(400)}
          style={styles.headerCard}
        >
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.95)', 'rgba(5, 150, 105, 0.15)', 'rgba(15, 23, 42, 0.95)']}
            style={styles.headerGradient}
          >
            {/* Premium Badge */}
            <View style={styles.premiumBadge}>
              <LinearGradient
                colors={['rgba(31, 162, 166, 0.3)', 'rgba(5, 150, 105, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumBadgeGradient}
              >
                <Text style={styles.premiumBadgeText}>👔 TD DEĞERLENDİRMESİ</Text>
              </LinearGradient>
            </View>

            <Text style={styles.headerTitle}>
              {targetTeamInfo.manager || 'Teknik Direktör'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {targetTeamInfo.name} Teknik Direktörü
            </Text>

            {/* Score Comparison - Premium Design */}
            <View style={styles.scoreComparisonCard}>
              <LinearGradient
                colors={['rgba(31, 162, 166, 0.08)', 'rgba(0, 0, 0, 0.2)', 'rgba(245, 158, 11, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scoreComparisonGradient}
              >
                {/* User Score */}
                <View style={styles.scoreColumn}>
                  <View style={styles.scoreLabelRow}>
                    <Ionicons name="person" size={12} color="#1FA2A6" />
                    <Text style={[styles.scoreLabel, { color: '#1FA2A6' }]}>SİZİN PUANINIZ</Text>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Svg width={110} height={110} style={styles.scoreSvg}>
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="rgba(31, 162, 166, 0.12)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="#1FA2A6"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(userScore / 10) * 282.7} 282.7`}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="55, 55"
                      />
                    </Svg>
                    <View style={styles.scoreValue}>
                      <Text style={styles.scoreText}>{userScore}</Text>
                      <Text style={styles.scoreMax}>/10</Text>
                    </View>
                  </View>
                </View>

                {/* VS Divider */}
                <View style={styles.scoreDivider}>
                  <View style={styles.scoreDividerDiamond}>
                    <Text style={styles.scoreDividerText}>VS</Text>
                  </View>
                </View>

                {/* Community Score */}
                <View style={styles.scoreColumn}>
                  <View style={styles.scoreLabelRow}>
                    <Ionicons name="people" size={12} color="#F59E0B" />
                    <Text style={[styles.scoreLabel, { color: '#F59E0B' }]}>TOPLULUK</Text>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Svg width={110} height={110} style={styles.scoreSvg}>
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="rgba(245, 158, 11, 0.12)"
                        strokeWidth="6"
                        fill="none"
                      />
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="#F59E0B"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(communityScore / 10) * 282.7} 282.7`}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="55, 55"
                      />
                    </Svg>
                    <View style={styles.scoreValue}>
                      <Text style={styles.scoreTextCommunity}>{communityScore}</Text>
                      <Text style={styles.scoreMax}>/10</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Voters Row */}
            <View style={styles.votersRow}>
              <View style={styles.votersDot} />
              <Text style={styles.votersText}>
                {totalVoters.toLocaleString()} kullanıcı değerlendirdi
              </Text>
              <View style={styles.votersDot} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Rating Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>

          {coachCategories.map((category, index) => {
            const userRating = coachRatings[category.id];
            const communityRating = communityRatings[category.id];
            const difference = userRating - communityRating;

            return (
              <Animated.View
                key={category.id}
                entering={!isWeb && FadeIn ? FadeIn.delay(index * 80) : undefined}
                style={styles.categoryCard}
              >
                {/* Category Header */}
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View style={styles.categoryTitleContainer}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryWeight}>
                    <Text style={styles.categoryWeightText}>{category.weight}%</Text>
                  </View>
                </View>

                {/* Rating Stars */}
                <View style={styles.ratingContainer}>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <TouchableOpacity
                        key={star}
                        style={styles.starButton}
                        onPress={() => handleRatingChange(category.id, star)}
                        activeOpacity={0.7}
                      >
                        <Animated.View
                          entering={!isWeb && ZoomIn ? ZoomIn.delay(star * 30) : undefined}
                          style={[
                            styles.star,
                            star <= userRating && styles.starActive,
                            { backgroundColor: star <= userRating ? category.color : 'rgba(100, 116, 139, 0.2)' }
                          ]}
                        >
                          <Text style={[
                            styles.starText,
                            star <= userRating && styles.starTextActive
                          ]}>
                            {star}
                          </Text>
                        </Animated.View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Score Comparison */}
                <View style={styles.comparisonContainer}>
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Sizin:</Text>
                      <Text style={styles.comparisonValueUser}>{userRating.toFixed(1)}</Text>
                    </View>
                    
                    <View style={styles.comparisonDivider} />
                    
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Topluluk:</Text>
                      <Text style={styles.comparisonValueCommunity}>{communityRating.toFixed(1)}</Text>
                    </View>

                    <View style={styles.comparisonDivider} />

                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Fark:</Text>
                      <Text style={[
                        styles.comparisonValueDiff,
                        difference > 0 ? styles.comparisonPositive : difference < 0 ? styles.comparisonNegative : styles.comparisonNeutral
                      ]}>
                        {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${(userRating / 10) * 100}%`, backgroundColor: category.color }
                        ]}
                      />
                    </View>
                    <View style={[styles.progressBar, styles.progressBarCommunity]}>
                      <View 
                        style={[
                          styles.progressFillCommunity,
                          { width: `${(communityRating / 10) * 100}%` }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteEmoji}>💡</Text>
          <Text style={styles.infoNoteText}>
            Değişiklik yaptıktan sonra sekmeden çıkarken kaydetme seçeneği sunulur.
          </Text>
        </View>
        </>
        ) : (
          /* ⚽ FUTBOLCU DEĞERLENDİRMELERİ SEKMESİ */
          <View
            style={styles.playerRatingContainer}
          >

            {/* Oyuncu yoksa bilgi mesajı */}
            {sortedPlayers.length === 0 && (
              <View style={styles.noPlayersContainer}>
                <Ionicons name="people-outline" size={48} color="#64748B" />
                <Text style={styles.noPlayersTitle}>Kadro Bilgisi Yok</Text>
                <Text style={styles.noPlayersText}>
                  Bu maç için kadro bilgisi henüz yayınlanmadı.{'\n'}Maç yaklaştığında kadro görünecektir.
                </Text>
              </View>
            )}

            {/* Players List */}
            {sortedPlayers.map((player, index) => {
              const isExpanded = expandedPlayerId === player.id;
              const avgRating = getPlayerAverageRating(player.id, player.position);
              const hasRatings = Object.keys(playerRatings[player.id] || {}).length > 0;
              const categories = getRatingCategories(player.position);
              const isGK = player.position === 'GK';

              return (
                <Animated.View
                  key={player.id}
                  entering={!isWeb && FadeIn ? FadeIn.delay(Math.min(index * 30, 300)) : undefined}
                  style={styles.playerCardWrapper}
                  onLayout={(e: any) => {
                    playerCardRefs.current[player.id] = e.nativeEvent.layout.y;
                  }}
                >
                  {/* Player Card Header */}
                  <TouchableOpacity
                    style={[
                      styles.playerCard,
                      isExpanded && styles.playerCardExpanded,
                      hasRatings && !isExpanded && { borderColor: `${getRatingColor(avgRating)}30` }
                    ]}
                    onPress={() => handlePlayerToggle(player.id, isExpanded)}
                    activeOpacity={0.7}
                  >
                    {/* Jersey Number */}
                    <LinearGradient
                      colors={isGK ? ['#F59E0B', '#92400E'] : ['#1FA2A6', '#0F2A24']}
                      style={styles.playerJerseyGradient}
                    >
                      <Text style={styles.playerJerseyNumber}>{player.number}</Text>
                    </LinearGradient>

                    {/* Player Info */}
                    <View style={styles.playerInfoContainer}>
                      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                      <View style={styles.playerPositionRow}>
                        <View style={[styles.playerPositionBadge, isGK && styles.playerPositionBadgeGK]}>
                          <Text style={[styles.playerPositionText, isGK && styles.playerPositionTextGK]}>
                            {isGK ? '🧤 GK' : player.position}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Score Badge + Arrow */}
                    <View style={styles.playerRightSection}>
                      {hasRatings && (
                        <View style={[styles.playerScoreBadge, { backgroundColor: `${getRatingColor(avgRating)}20`, borderColor: `${getRatingColor(avgRating)}40` }]}>
                          <Text style={[styles.playerScoreText, { color: getRatingColor(avgRating) }]}>
                            {avgRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={isExpanded ? BRAND.secondary : '#64748B'}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Rating Panel - Premium */}
                  {isExpanded && (
                    <Animated.View
                      entering={!isWeb && FadeIn ? FadeIn.duration(200) : undefined}
                      style={styles.playerRatingPanel}
                    >
                      {/* Sizin Puanınız vs Topluluk Puanı */}
                      {(() => {
                        const communityData = getPlayerCommunityData(player.id);
                        return (
                          <View style={styles.playerScoreComparisonCard}>
                            <View style={styles.playerScoreCompRow}>
                              {/* Sizin Puanınız */}
                              <View style={styles.playerScoreCompCol}>
                                <View style={styles.playerScoreCompIconRow}>
                                  <Ionicons name="person" size={11} color="#1FA2A6" />
                                  <Text style={styles.playerScoreCompLabel}>Sizin Puanınız</Text>
                                </View>
                                <Text style={[styles.playerScoreCompValue, { color: hasRatings ? getRatingColor(avgRating) : '#475569' }]}>
                                  {hasRatings ? avgRating.toFixed(1) : '—'}
                                </Text>
                              </View>

                              {/* VS */}
                              <View style={styles.playerScoreCompVs}>
                                <Text style={styles.playerScoreCompVsText}>vs</Text>
                              </View>

                              {/* Topluluk Puanı */}
                              <View style={styles.playerScoreCompCol}>
                                <View style={styles.playerScoreCompIconRow}>
                                  <Ionicons name="people" size={11} color="#F59E0B" />
                                  <Text style={styles.playerScoreCompLabel}>Topluluk</Text>
                                </View>
                                <Text style={[styles.playerScoreCompValue, { color: '#F59E0B' }]}>
                                  {communityData.communityAvg.toFixed(1)}
                                </Text>
                              </View>
                            </View>
                            {/* Voters */}
                            <View style={styles.playerScoreCompVotersRow}>
                              <Ionicons name="people-outline" size={11} color="#64748B" />
                              <Text style={styles.playerScoreCompVotersText}>
                                {communityData.voters.toLocaleString()} kişi değerlendirdi
                              </Text>
                            </View>
                          </View>
                        );
                      })()}

                      {/* Rating Categories - Premium Grid */}
                      <View style={styles.ratingGrid}>
                        {categories.map((category) => {
                          const currentRating = playerRatings[player.id]?.[category.id] || 5;
                          
                          return (
                            <View key={category.id} style={styles.ratingGridItem}>
                              {/* Category Header */}
                              <View style={[styles.ratingGridIconBg, { backgroundColor: `${category.color}15` }]}>
                                <Text style={styles.ratingGridEmoji}>{category.emoji}</Text>
                              </View>
                              <Text style={styles.ratingGridTitle}>{category.title}</Text>
                              
                              {/* Rating Value */}
                              <View style={[styles.ratingCircle, { borderColor: `${category.color}50`, backgroundColor: `${category.color}08` }]}>
                                <Text style={[styles.ratingCircleValue, { color: category.color }]}>
                                  {currentRating.toFixed(0) === '10' ? '10' : currentRating.toFixed(1)}
                                </Text>
                              </View>
                              
                              {/* Mini Progress Bar */}
                              <View style={styles.ratingMiniBar}>
                                <View style={[styles.ratingMiniBarFill, { width: `${(currentRating / 10) * 100}%`, backgroundColor: category.color }]} />
                              </View>
                              
                              {/* +/- Controls */}
                              <View style={styles.ratingMiniButtons}>
                                <TouchableOpacity
                                  style={[styles.ratingMiniBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                                  onPress={() => updatePlayerRating(player.id, category.id, Math.max(1, currentRating - 0.5))}
                                >
                                  <Text style={styles.ratingMiniBtnTextMinus}>−</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.ratingMiniBtn, { borderColor: 'rgba(74, 222, 128, 0.3)' }]}
                                  onPress={() => updatePlayerRating(player.id, category.id, Math.min(10, currentRating + 0.5))}
                                >
                                  <Text style={styles.ratingMiniBtnTextPlus}>+</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Quick Rating - Premium */}
                      <View style={styles.quickRatingSection}>
                        <View style={styles.quickRatingHeader}>
                          <Ionicons name="flash" size={14} color="#F59E0B" />
                          <Text style={styles.quickRatingLabel}>Hızlı Puan</Text>
                        </View>
                        <View style={styles.quickRatingRow}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                            const isActive = hasRatings && Math.round(avgRating) === score;
                            const scoreColor = score >= 8 ? '#22C55E' : score >= 6 ? '#F59E0B' : score >= 4 ? '#F97316' : '#EF4444';
                            return (
                              <TouchableOpacity
                                key={score}
                                style={[
                                  styles.quickRatingBtn,
                                  isActive && { backgroundColor: scoreColor, borderColor: scoreColor, transform: [{ scale: 1.1 }] }
                                ]}
                                onPress={() => setAllRatings(player.id, player.position, score)}
                              >
                                <Text style={[
                                  styles.quickRatingBtnText,
                                  isActive && styles.quickRatingBtnTextActive
                                ]}>{score}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* empty - score comparison moved to top */}
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}

            {/* Info Note */}
            {sortedPlayers.length > 0 && (
              <View style={styles.playerInfoNote}>
                <Ionicons name="information-circle-outline" size={14} color="#64748B" />
                <Text style={styles.playerInfoNoteText}>
                  Futbolcuya dokunarak detaylı puan verin. Çıkarken kaydetme seçeneği sunulur.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 💾 KAYDETME POPUP */}
      <Modal
        visible={showSavePopup}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowSavePopup(false); setPendingTab(null); }}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => { setShowSavePopup(false); setPendingTab(null); }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.savePopupContainer}>
            {/* Icon */}
            <View style={styles.savePopupIconContainer}>
              <Ionicons name="save-outline" size={32} color="#1FA2A6" />
            </View>

            {/* Title */}
            <Text style={styles.savePopupTitle}>Değişiklikleri Kaydet</Text>

            {/* Description */}
            <Text style={styles.savePopupDescription}>
              {activeTab === 'coach' 
                ? 'TD değerlendirmenizdeki değişiklikler kaydedilmedi. Kaydetmek istiyor musunuz?'
                : 'Futbolcu değerlendirmelerinizdeki değişiklikler kaydedilmedi. Kaydetmek istiyor musunuz?'
              }
            </Text>

            {/* Buttons */}
            <View style={styles.savePopupButtons}>
              <TouchableOpacity
                style={styles.savePopupBtnCancel}
                onPress={handleDiscardAndSwitch}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.savePopupBtnCancelText}>Kaydetme</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.savePopupBtnSave}
                onPress={handleSaveAndSwitch}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#1FA2A6', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.savePopupBtnSaveGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.savePopupBtnSaveText}>Kaydet</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 🎉 BADGE AWARD POPUP */}
      <Modal
        visible={showBadgePopup && newBadges.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBadgePopup(false)}
      >
        <Pressable
          style={styles.badgePopupOverlay}
          onPress={() => setShowBadgePopup(false)}
        >
          <Animated.View entering={!isWeb && ZoomIn ? ZoomIn.duration(400) : undefined} style={styles.badgePopupContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {newBadges[currentBadgeIndex] && (
                <>
                  {/* Confetti Effect */}
                  <View style={styles.confettiContainer}>
                    <Text style={styles.confetti}>🎉</Text>
                    <Text style={styles.confetti}>✨</Text>
                    <Text style={styles.confetti}>🎊</Text>
                    <Text style={styles.confetti}>⭐</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.badgePopupTitle}>YENİ ROZET KAZANDIN!</Text>

                  {/* Badge Icon */}
                  <Animated.View
                    entering={!isWeb && ZoomIn ? ZoomIn.delay(200).springify() : undefined}
                    style={[
                      styles.badgePopupIconContainer,
                      {
                        backgroundColor: `${getBadgeColor(newBadges[currentBadgeIndex].badge.tier)}20`,
                        borderColor: getBadgeColor(newBadges[currentBadgeIndex].badge.tier),
                      },
                    ]}
                  >
                    <Text style={styles.badgePopupIcon}>
                      {newBadges[currentBadgeIndex].badge.icon}
                    </Text>
                  </Animated.View>

                  {/* Badge Name */}
                  <Text style={styles.badgePopupName}>
                    {newBadges[currentBadgeIndex].badge.name}
                  </Text>

                  {/* Badge Tier */}
                  <View
                    style={[
                      styles.badgePopupTier,
                      {
                        backgroundColor: `${getBadgeColor(newBadges[currentBadgeIndex].badge.tier)}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgePopupTierText,
                        { color: getBadgeColor(newBadges[currentBadgeIndex].badge.tier) },
                      ]}
                    >
                      {getBadgeTierName(newBadges[currentBadgeIndex].badge.tier)}
                    </Text>
                  </View>

                  {/* Badge Description */}
                  <Text style={styles.badgePopupDescription}>
                    {newBadges[currentBadgeIndex].badge.description}
                  </Text>

                  {/* Badge Counter */}
                  {newBadges.length > 1 && (
                    <Text style={styles.badgePopupCounter}>
                      {currentBadgeIndex + 1} / {newBadges.length}
                    </Text>
                  )}

                  {/* Buttons */}
                  <View style={styles.badgePopupButtons}>
                    <TouchableOpacity
                      style={styles.badgePopupButtonSecondary}
                      onPress={() => setShowBadgePopup(false)}
                    >
                      <Text style={styles.badgePopupButtonSecondaryText}>Kapat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.badgePopupButtonPrimary}
                      onPress={showNextBadge}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        style={styles.badgePopupButtonGradient}
                      >
                        <Text style={styles.badgePopupButtonPrimaryText}>
                          {currentBadgeIndex < newBadges.length - 1 ? 'Sonraki' : 'Harika!'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Grid pattern görünsün - MatchDetail'den geliyor
  },
  
  // Tab Bar - İstatistik sekmesiyle aynı stil
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B', // Solid arka plan - grid görünmesin
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
    backgroundColor: '#334155', // Solid arka plan - grid görünmesin
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#1D4044', // Solid arka plan - grid görünmesin (secondary tonu)
    borderColor: `${BRAND.secondary}40`,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: BRAND.secondary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: BRAND.secondary,
    borderRadius: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8, // ✅ Kadro sekmesiyle aynı
  },
  
  // Oyuncu Değerlendirmesi
  playerRatingContainer: {
    flex: 1,
    padding: 0,
  },
  // (Player section header removed - score comparison now inside each player card)
  notStartedCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    width: 300,
    height: 240,
    justifyContent: 'center',
  },
  notStartedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notStartedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  notStartedSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Header Card - Premium
  headerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 16,
  },
  premiumBadge: {
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1FA2A6',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  scoreComparisonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
    marginBottom: 12,
  },
  scoreComparisonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 110,
    height: 110,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSvg: {
    position: 'absolute',
  },
  scoreValue: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1FA2A6',
    letterSpacing: -1,
  },
  scoreTextCommunity: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -4,
    fontWeight: '600',
  },
  scoreDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  scoreDividerDiamond: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  votersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  votersDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  votersText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Categories
  categoriesContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitleContainer: {
    flex: 1,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  categoryWeight: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  categoryWeightText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },

  // Rating Stars
  ratingContainer: {
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  starButton: {
    width: '18%',
  },
  star: {
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  starActive: {
    borderColor: 'transparent',
    transform: [{ scale: 1.05 }],
  },
  starText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  starTextActive: {
    color: '#FFFFFF',
  },

  // Comparison
  comparisonContainer: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  comparisonLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comparisonValueUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1FA2A6',
  },
  comparisonValueCommunity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  comparisonValueDiff: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  comparisonPositive: {
    color: '#22C55E',
  },
  comparisonNegative: {
    color: '#EF4444',
  },
  comparisonNeutral: {
    color: '#9CA3AF',
  },
  comparisonDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },

  // Progress Bars
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarCommunity: {
    opacity: 0.6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressFillCommunity: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },

  // Submit Button
  submitButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
  },
  submitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  infoNoteEmoji: {
    fontSize: 16,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // 🌟 PREDICTION ANALYSIS STYLES
  analysisCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  analysisSubtitle: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
  },
  analystNote: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  analystNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  analystNoteText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  clusterScoresContainer: {
    marginTop: 16,
    gap: 12,
  },
  clusterScoresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  clusterScoreCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  clusterScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clusterIcon: {
    fontSize: 20,
  },
  clusterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clusterScoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  clusterStat: {
    alignItems: 'center',
  },
  clusterStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  clusterStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  focusedStatsCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  focusedStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  focusedStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  focusedStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  focusedStat: {
    alignItems: 'center',
  },
  focusedStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1FA2A6',
    marginBottom: 4,
  },
  focusedStatValueWrong: {
    color: '#EF4444',
  },
  focusedStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // 📊 Cluster Breakdown Styles
  clusterBreakdownCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  clusterBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  clusterBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  clusterRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  clusterRowIcon: {
    fontSize: 24,
  },
  clusterRowInfo: {
    flex: 1,
  },
  clusterRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  clusterRowStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clusterRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clusterRowPoints: {
    alignItems: 'flex-end',
  },
  clusterRowPointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1FA2A6',
  },
  clusterRowPointsLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  clusterRowAccuracy: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clusterRowAccuracyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  analystNoteContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  analystNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  analystNoteHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // 💾 SAVE POPUP STYLES
  savePopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePopupContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  savePopupIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(31, 162, 166, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
  },
  savePopupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  savePopupDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  savePopupButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  savePopupBtnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  savePopupBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  savePopupBtnSave: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  savePopupBtnSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  savePopupBtnSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 🎉 BADGE POPUP STYLES
  badgePopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePopupContainer: {
    backgroundColor: '#1E3A3A',
    borderRadius: 32,
    padding: 40,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  confetti: {
    fontSize: 32,
  },
  badgePopupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  badgePopupIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
  },
  badgePopupIcon: {
    fontSize: 70,
  },
  badgePopupName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgePopupTier: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgePopupTierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgePopupDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  badgePopupCounter: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  badgePopupButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  badgePopupButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  badgePopupButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgePopupButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgePopupButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgePopupButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ⚽ FUTBOLCU DEĞERLENDİRME STİLLERİ
  playerCardWrapper: {
    marginBottom: 6,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
    gap: 12,
  },
  playerCardExpanded: {
    borderColor: `${BRAND.secondary}60`,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
  playerJerseyGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  playerJerseyNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  playerInfoContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  playerPositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerPositionBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerPositionBadgeGK: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  playerPositionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  playerPositionTextGK: {
    color: '#F59E0B',
  },
  playerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  playerScoreText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ⚽ EXPANDED RATING PANEL - Premium & Compact
  playerRatingPanel: {
    backgroundColor: 'rgba(10, 18, 35, 0.92)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: `${BRAND.secondary}40`,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 10,
    paddingTop: 8,
  },

  // ⚽ RATING GRID (3x2) - Compact
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  ratingGridItem: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.08)',
  },
  ratingGridIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  ratingGridEmoji: {
    fontSize: 13,
  },
  ratingGridTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  ratingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 4,
  },
  ratingCircleValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  ratingMiniBar: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  ratingMiniBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  ratingMiniButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingMiniBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  ratingMiniBtnTextMinus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F87171',
    lineHeight: 18,
  },
  ratingMiniBtnTextPlus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ADE80',
    lineHeight: 18,
  },

  // ⚡ QUICK RATING - Compact
  quickRatingSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.12)',
  },
  quickRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 6,
  },
  quickRatingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  quickRatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  quickRatingBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.15)',
  },
  quickRatingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  quickRatingBtnTextActive: {
    color: '#FFFFFF',
  },

  // ⭐ PLAYER SCORE COMPARISON (per player in expanded card)
  playerScoreComparisonCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.1)',
  },
  playerScoreCompRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerScoreCompCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  playerScoreCompIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerScoreCompLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  playerScoreCompValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  playerScoreCompVs: {
    paddingHorizontal: 8,
  },
  playerScoreCompVsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  playerScoreCompVotersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.1)',
  },
  playerScoreCompVotersText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },

  // 🚫 NO PLAYERS
  noPlayersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noPlayersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
  },
  noPlayersText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 💾 SAVE & INFO
  savePlayerRatingsBtn: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  savePlayerRatingsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    width: '100%',
  },
  savePlayerRatingsBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    borderRadius: 10,
    marginTop: 4,
  },
  playerInfoNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
