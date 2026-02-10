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
  
  // 🗑️ Silme onay modal state
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<{ id: number; name: string } | null>(null);
  
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
  const getPlayerCommunityData = useCallback((playerId: number, position?: string) => {
    // Her oyuncu için rastgele ama tutarlı mock veri
    const seed = playerId % 100;
    const voters = 200 + (seed * 13) % 800;
    
    // Pozisyona göre doğru kategori ID'lerini kullan
    const isGK = position === 'GK';
    
    // Her kategori için topluluk puanı - tutarlı olması için seed bazlı
    // ✅ Kategori ID'leri OUTFIELD_RATING_CATEGORIES ve GK_RATING_CATEGORIES ile eşleşmeli
    const categoryRatings: Record<string, number> = isGK ? {
      // Kaleci kategorileri
      reflexes: 5.0 + ((seed * 3) % 40) / 10,
      positioning: 4.8 + ((seed * 5) % 45) / 10,
      rushing: 5.2 + ((seed * 4) % 38) / 10,
      handling: 5.0 + ((seed * 6) % 42) / 10,
      communication: 5.5 + ((seed * 2) % 35) / 10,
      longball: 5.3 + ((seed * 7) % 40) / 10,
    } : {
      // Saha oyuncusu kategorileri
      pace: 5.0 + ((seed * 3) % 40) / 10,
      shooting: 4.8 + ((seed * 5) % 45) / 10,
      passing: 5.2 + ((seed * 4) % 38) / 10,
      dribbling: 5.0 + ((seed * 6) % 42) / 10,
      defending: 5.5 + ((seed * 2) % 35) / 10,
      physical: 5.3 + ((seed * 7) % 40) / 10,
    };
    
    // Ortalama: kategorilerin gerçek ortalaması
    const categoryValues = Object.values(categoryRatings);
    const communityAvg = categoryValues.reduce((a, b) => a + b, 0) / categoryValues.length;
    
    return {
      voters,
      communityAvg: Math.min(9.5, communityAvg),
      categoryRatings,
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

  // Puan rengini hesapla - Design System uyumlu
  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#1FA2A6'; // ✅ Turkuaz (iyi)
    if (rating >= 6) return '#C9A44C'; // ✅ Altın (orta-iyi)
    if (rating >= 4) return '#F59E0B'; // Sarı (orta)
    return '#8C3A3A'; // ✅ Design System: Error rengi (kötü)
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
            colors={['rgba(15, 42, 36, 0.95)', 'rgba(31, 162, 166, 0.15)', 'rgba(15, 42, 36, 0.95)']} // ✅ Design System
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
                colors={['rgba(31, 162, 166, 0.1)', 'rgba(15, 42, 36, 0.3)', 'rgba(201, 164, 76, 0.1)']} // ✅ Design System
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
                        rotation={-90}
                        originX={55}
                        originY={55}
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
                    <Ionicons name="people" size={12} color="#C9A44C" /> {/* ✅ Altın */}
                    <Text style={[styles.scoreLabel, { color: '#C9A44C' }]}>TOPLULUK</Text>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Svg width={110} height={110} style={styles.scoreSvg}>
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="rgba(201, 164, 76, 0.15)" /* ✅ Altın */
                        strokeWidth="6"
                        fill="none"
                      />
                      <Circle
                        cx="55"
                        cy="55"
                        r="45"
                        stroke="#C9A44C" /* ✅ Altın */
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${(communityScore / 10) * 282.7} 282.7`}
                        strokeLinecap="round"
                        rotation={-90}
                        originX={55}
                        originY={55}
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
                      colors={isGK ? ['#C9A44C', '#8B6914'] : ['#1FA2A6', '#0F2A24']} // ✅ Design System
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

                    {/* Score Badges + Arrow */}
                    <View style={styles.playerRightSection}>
                      {/* Topluluk Puanı (Sol) */}
                      <View style={styles.communityScoreBadge}>
                        <Ionicons name="people" size={10} color="#C9A44C" />
                        <Text style={styles.communityScoreText}>
                          {getPlayerCommunityData(player.id, player.position).communityAvg.toFixed(1)}
                        </Text>
                      </View>
                      
                      {/* Kullanıcı Puanı (Sağ) - Silme butonu ile */}
                      <View style={styles.userScoreBadgeWrapper}>
                        {hasRatings && !isExpanded && (
                          <TouchableOpacity
                            style={styles.deleteRatingBtnCorner}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.6}
                            onPress={() => {
                              console.log('🗑️ Delete rating button pressed for:', player.name);
                              setDeleteConfirmPlayer({ id: player.id, name: player.name });
                            }}
                          >
                            <Ionicons name="close" size={12} color="#FFF" />
                          </TouchableOpacity>
                        )}
                        <View style={[
                          styles.userScoreBadge, 
                          hasRatings 
                            ? { backgroundColor: `${getRatingColor(avgRating)}25`, borderColor: getRatingColor(avgRating) }
                            : { backgroundColor: 'rgba(71, 85, 105, 0.3)', borderColor: '#475569' }
                        ]}>
                          <Text style={[
                            styles.userScoreText, 
                            { color: hasRatings ? getRatingColor(avgRating) : '#64748B' }
                          ]}>
                            {hasRatings ? avgRating.toFixed(1) : '—'}
                          </Text>
                        </View>
                      </View>
                      
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isExpanded ? BRAND.secondary : '#64748B'}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Rating Panel - FIFA Style */}
                  {isExpanded && (
                    <Animated.View
                      entering={!isWeb && FadeIn ? FadeIn.duration(200) : undefined}
                      style={styles.fifaRatingPanel}
                    >
                      {(() => {
                        const communityData = getPlayerCommunityData(player.id, player.position);
                        const userScore = hasRatings ? avgRating : 0;
                        const communityScore = communityData.communityAvg;
                        
                        return (
                          <View style={styles.fifaContainer}>
                            {/* 🏆 ÜST: BÜYÜK PUAN KARTI - FIFA Stili */}
                            <LinearGradient
                              colors={['#0F2A24', '#1E3A3A', '#0F2A24']} // ✅ Design System
                              style={styles.fifaScoreCard}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              {/* Sol: Kullanıcı Puanı */}
                              <View style={styles.fifaScoreSide}>
                                <Text style={styles.fifaScoreLabel}>SİZİN PUANINIZ</Text>
                                <Text style={[styles.fifaScoreBig, { color: hasRatings ? getRatingColor(userScore) : '#475569' }]}>
                                  {hasRatings ? userScore.toFixed(1) : '—'}
                                </Text>
                                <View style={styles.fifaScoreStars}>
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Ionicons
                                      key={star}
                                      name={userScore >= star * 2 ? 'star' : userScore >= star * 2 - 1 ? 'star-half' : 'star-outline'}
                                      size={12}
                                      color={userScore >= star * 2 - 1 ? '#FFD700' : '#475569'}
                                    />
                                  ))}
                                </View>
                              </View>

                              {/* Orta: VS Badge */}
                              <View style={styles.fifaVsBadge}>
                                <Text style={styles.fifaVsText}>VS</Text>
                              </View>

                              {/* Sağ: Topluluk Puanı */}
                              <View style={styles.fifaScoreSide}>
                                <Text style={styles.fifaScoreLabel}>TOPLULUK</Text>
                                <Text style={[styles.fifaScoreBig, { color: '#C9A44C' }]}>
                                  {communityScore.toFixed(1)}
                                </Text>
                                <View style={styles.fifaVotersBadge}>
                                  <Ionicons name="people" size={10} color="#C9A44C" />
                                  <Text style={styles.fifaVotersText}>{communityData.voters}</Text>
                                </View>
                              </View>
                            </LinearGradient>

                            {/* ⚡ HIZLI PUAN SEÇİCİ - Slider Stili */}
                            <View style={styles.fifaQuickPicker}>
                              <Text style={styles.fifaQuickLabel}>⚡ HIZLI PUAN</Text>
                              <View style={styles.fifaQuickSlider}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                                  const isActive = hasRatings && Math.round(avgRating) === score;
                                  const getScoreGradient = (s: number): [string, string] => {
                                    if (s >= 9) return ['#00F260', '#0575E6'];
                                    if (s >= 7) return ['#11998e', '#38ef7d'];
                                    if (s >= 5) return ['#F7971E', '#FFD200'];
                                    if (s >= 3) return ['#f12711', '#f5af19'];
                                    return ['#CB356B', '#BD3F32'];
                                  };
                                  
                                  return (
                                    <TouchableOpacity
                                      key={score}
                                      onPress={() => setAllRatings(player.id, player.position, score)}
                                      style={styles.fifaQuickBtnWrap}
                                    >
                                      {isActive ? (
                                        <LinearGradient
                                          colors={getScoreGradient(score)}
                                          style={styles.fifaQuickBtnActive}
                                        >
                                          <Text style={styles.fifaQuickBtnTextActive}>{score}</Text>
                                        </LinearGradient>
                                      ) : (
                                        <View style={styles.fifaQuickBtn}>
                                          <Text style={styles.fifaQuickBtnText}>{score}</Text>
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>

                            {/* 📊 KATEGORİLER - Hexagon Radar Stili */}
                            <View style={styles.fifaCategorySection}>
                              <Text style={styles.fifaCategoryTitle}>📊 YETENEKLERİ PUANLA</Text>
                              
                              {/* 2 Satır x 3 Sütun Grid */}
                              <View style={styles.fifaCategoryGrid}>
                                {categories.map((category) => {
                                  const currentRating = playerRatings[player.id]?.[category.id] || 5;
                                  const communityRating = communityData.categoryRatings[category.id] || 5;
                                  const percentage = (currentRating / 10) * 100;
                                  
                                  return (
                                    <View key={category.id} style={styles.fifaCategoryCard}>
                                      {/* Kategori Başlığı */}
                                      <View style={styles.fifaCatHeader}>
                                        <Text style={styles.fifaCatEmoji}>{category.emoji}</Text>
                                        <View style={styles.fifaCatTitleWrap}>
                                          <Text style={styles.fifaCatTitle}>{category.title}</Text>
                                          <Text style={[styles.fifaCatScore, { color: category.color }]}>
                                            {currentRating.toFixed(1)}
                                          </Text>
                                        </View>
                                      </View>
                                      
                                      {/* Progress Bar - Gradient */}
                                      <View style={styles.fifaCatBarContainer}>
                                        <View style={styles.fifaCatBarBg}>
                                          <LinearGradient
                                            colors={[category.color, `${category.color}88`]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.fifaCatBarFill, { width: `${percentage}%` }]}
                                          />
                                          {/* Topluluk İşareti */}
                                          <View style={[styles.fifaCatCommunityMarker, { left: `${(communityRating / 10) * 100}%` }]}>
                                            <View style={styles.fifaCatCommunityDot} />
                                          </View>
                                        </View>
                                        <Text style={styles.fifaCatCommunityScore}>{communityRating.toFixed(1)}</Text>
                                      </View>
                                      
                                      {/* +/- Butonları */}
                                      <View style={styles.fifaCatBtnRow}>
                                        <TouchableOpacity
                                          style={styles.fifaCatBtnMinus}
                                          onPress={() => updatePlayerRating(player.id, category.id, Math.max(1, currentRating - 0.5))}
                                        >
                                          <Text style={styles.fifaCatBtnMinusText}>−</Text>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                          style={styles.fifaCatBtnPlus}
                                          onPress={() => updatePlayerRating(player.id, category.id, Math.min(10, currentRating + 0.5))}
                                        >
                                          <Text style={styles.fifaCatBtnPlusText}>+</Text>
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          </View>
                        );
                      })()}

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

      {/* 🗑️ SİLME ONAY POPUP */}
      <Modal
        visible={deleteConfirmPlayer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmPlayer(null)}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => setDeleteConfirmPlayer(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.deleteConfirmContainer}>
            {/* Icon */}
            <View style={styles.deleteConfirmIcon}>
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={styles.deleteConfirmTitle}>Değerlendirmeyi Sil</Text>

            {/* Description */}
            <Text style={styles.deleteConfirmDesc}>
              <Text style={{ fontWeight: '600', color: '#F1F5F9' }}>{deleteConfirmPlayer?.name}</Text> için verdiğiniz puanları silmek istiyor musunuz?
            </Text>

            {/* Buttons */}
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={styles.deleteConfirmBtnCancel}
                onPress={() => setDeleteConfirmPlayer(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteConfirmBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtnDelete}
                onPress={() => {
                  if (deleteConfirmPlayer) {
                    console.log('🗑️ Deleting ratings for:', deleteConfirmPlayer.id);
                    setPlayerRatings(prev => {
                      const updated = { ...prev };
                      delete updated[deleteConfirmPlayer.id];
                      return updated;
                    });
                    setPlayerRatingsChanged(true);
                  }
                  setDeleteConfirmPlayer(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={16} color="#FFF" />
                <Text style={styles.deleteConfirmBtnDeleteText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                        colors={['#C9A44C', '#8B6914']} // ✅ Design System: Altın accent
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
  
  // Tab Bar - Design System uyumlu, tamamen saydam
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent', // ✅ Grid pattern tamamen görünsün
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 10,
    backgroundColor: 'rgba(30, 58, 58, 0.6)', // ✅ Yarı saydam
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)', // ✅ Aktif tab - daha belirgin
    borderColor: BRAND.secondary,
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
    paddingBottom: 140, // ✅ Bottom navigation bar için yeterli boşluk (tab bar + safe area)
  },
  
  // Oyuncu Değerlendirmesi
  playerRatingContainer: {
    flex: 1,
    padding: 0,
  },
  // (Player section header removed - score comparison now inside each player card)
  notStartedCard: {
    backgroundColor: '#1E3A3A', // ✅ Design System: Card background
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
    width: 300,
    height: 240,
    justifyContent: 'center',
  },
  notStartedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 164, 76, 0.15)', // ✅ Altın accent (biraz daha belirgin)
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
    borderColor: 'rgba(31, 162, 166, 0.15)', // ✅ Design System
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
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
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
    backgroundColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System
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
    backgroundColor: 'rgba(30, 58, 58, 0.8)', // ✅ Design System: Yeşil tonlu card
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
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
    borderColor: 'rgba(31, 162, 166, 0.3)', // ✅ Design System
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
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(31, 162, 166, 0.2)', // ✅ Design System
  },

  // Progress Bars
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(31, 162, 166, 0.15)', // ✅ Design System
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
    backgroundColor: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System: Secondary
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
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
    backgroundColor: 'rgba(30, 58, 58, 0.8)', // ✅ Design System
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.3)', // ✅ Altın accent
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
    color: '#C9A44C', // ✅ Altın accent
    marginTop: 2,
  },
  analystNote: {
    backgroundColor: 'rgba(201, 164, 76, 0.1)', // ✅ Altın accent
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.2)',
  },
  analystNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // ✅ Design System: Primary tonlu
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
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
    backgroundColor: 'rgba(201, 164, 76, 0.1)', // ✅ Altın accent
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.2)',
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
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(30, 58, 58, 0.6)', // ✅ Design System
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
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
    backgroundColor: 'rgba(30, 58, 58, 0.4)', // ✅ Design System
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
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
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System: Secondary
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
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
    color: '#1FA2A6', // ✅ Design System: Secondary
  },

  // 🗑️ DELETE CONFIRM POPUP STYLES
  deleteConfirmContainer: {
    backgroundColor: '#1E3A3A', // ✅ Design System
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(140, 58, 58, 0.3)', // ✅ Error rengi
  },
  deleteConfirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(140, 58, 58, 0.2)', // ✅ Error rengi
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  deleteConfirmDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  deleteConfirmBtnCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  deleteConfirmBtnDelete: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#8C3A3A', // ✅ Design System: Error rengi
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteConfirmBtnDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // 💾 SAVE POPUP STYLES
  savePopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savePopupContainer: {
    backgroundColor: '#1E3A3A', // ✅ Design System
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
    backgroundColor: 'rgba(140, 58, 58, 0.15)', // ✅ Design System: Error rengi
    borderWidth: 1,
    borderColor: 'rgba(140, 58, 58, 0.3)',
  },
  savePopupBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C3A3A', // ✅ Design System: Error rengi
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
    backgroundColor: '#1E3A3A', // ✅ Design System: Zaten doğru
    borderRadius: 32,
    padding: 40,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C9A44C', // ✅ Altın accent
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
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: '#0F2A24', // ✅ Design System: Primary
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
    backgroundColor: 'rgba(30, 58, 58, 0.6)', // ✅ Design System
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.1)',
    gap: 12,
  },
  playerCardExpanded: {
    borderColor: `${BRAND.secondary}60`,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(30, 58, 58, 0.9)', // ✅ Design System
  },
  playerJerseyGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerJerseyNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  playerInfoContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 3,
  },
  playerPositionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerPositionBadge: {
    backgroundColor: 'rgba(31, 162, 166, 0.12)', // ✅ Design System
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerPositionBadgeGK: {
    backgroundColor: 'rgba(201, 164, 76, 0.15)', // ✅ Altın accent
  },
  playerPositionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  playerPositionTextGK: {
    color: '#C9A44C', // ✅ Altın accent
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
    backgroundColor: 'rgba(15, 42, 36, 0.95)', // ✅ Design System: Primary tonlu
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
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // ✅ Design System
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.08)',
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
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // ✅ Design System
    marginBottom: 4,
  },
  ratingCircleValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  ratingMiniBar: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(31, 162, 166, 0.15)', // ✅ Design System
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
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
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
    borderTopColor: 'rgba(31, 162, 166, 0.12)', // ✅ Design System
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
    backgroundColor: 'rgba(31, 162, 166, 0.1)', // ✅ Design System
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.12)',
  },
  quickRatingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  quickRatingBtnTextActive: {
    color: '#FFFFFF',
  },

  // 🏷️ TOPLULUK PUAN BADGE (Sol) - Zarif
  communityScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 164, 76, 0.1)', // ✅ Altın accent
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.2)',
  },
  communityScoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9A44C', // ✅ Altın accent
  },
  
  // 🏷️ KULLANICI PUAN BADGE WRAPPER (Sağ) - X butonu ile
  userScoreBadgeWrapper: {
    position: 'relative',
  },
  userScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  userScoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // ❌ DELETE RATING BUTTON (Sol Üst Köşe) - Tıklanabilir
  deleteRatingBtnCorner: {
    position: 'absolute',
    top: -7,
    left: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8C3A3A', // ✅ Design System: Error rengi
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#0F2A24', // ✅ Design System: Primary
    elevation: 5,
  },
  
  // 🎮 FIFA STİLİ RATING PANEL - Zarif, Ferah, Ekrana Tam Sığar
  fifaRatingPanel: {
    backgroundColor: 'rgba(15, 42, 36, 0.95)', // ✅ Design System: Primary tonlu
    borderRadius: 14,
    marginTop: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  fifaContainer: {
    padding: 14,
    gap: 12,
  },
  
  // 🏆 PUAN KARTI - Zarif & Ferah
  fifaScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  fifaScoreSide: {
    alignItems: 'center',
    flex: 1,
  },
  fifaScoreLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fifaScoreBig: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  fifaScoreStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  fifaVsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 164, 76, 0.1)', // ✅ Altın accent
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.4)',
  },
  fifaVsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C9A44C', // ✅ Altın accent
  },
  fifaVotersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    backgroundColor: 'rgba(201, 164, 76, 0.08)', // ✅ Altın accent
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fifaVotersText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#C9A44C', // ✅ Altın accent
  },
  
  // ⚡ HIZLI PUAN SEÇİCİ - Ferah
  fifaQuickPicker: {
    backgroundColor: 'rgba(15, 42, 36, 0.4)', // ✅ Design System
    borderRadius: 10,
    padding: 10,
  },
  fifaQuickLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  fifaQuickSlider: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  fifaQuickBtnWrap: {
    flex: 1,
    maxWidth: 30,
  },
  fifaQuickBtn: {
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 58, 58, 0.4)', // ✅ Design System
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.12)',
  },
  fifaQuickBtnActive: {
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fifaQuickBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  fifaQuickBtnTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // 📊 KATEGORİ BÖLÜMÜ - Ferah Grid
  fifaCategorySection: {
    gap: 8,
  },
  fifaCategoryTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  fifaCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fifaCategoryCard: {
    width: '31.5%',
    backgroundColor: 'rgba(15, 42, 36, 0.4)', // ✅ Design System
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.08)',
  },
  fifaCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fifaCatEmoji: {
    fontSize: 16,
  },
  fifaCatTitleWrap: {
    flex: 1,
  },
  fifaCatTitle: {
    fontSize: 8,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fifaCatScore: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 0,
  },
  fifaCatBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fifaCatBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(31, 162, 166, 0.15)', // ✅ Design System
    borderRadius: 2.5,
    overflow: 'hidden',
    position: 'relative',
  },
  fifaCatBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  fifaCatCommunityMarker: {
    position: 'absolute',
    top: -1,
    marginLeft: -3,
  },
  fifaCatCommunityDot: {
    width: 7,
    height: 7,
    backgroundColor: '#C9A44C', // ✅ Altın accent
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  fifaCatCommunityScore: {
    fontSize: 9,
    fontWeight: '600',
    color: '#C9A44C', // ✅ Altın accent
    width: 20,
    textAlign: 'right',
  },
  fifaCatBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fifaCatBtnMinus: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  fifaCatBtnMinusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: -1,
  },
  fifaCatBtnPlus: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  fifaCatBtnPlusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#22C55E',
    marginTop: -1,
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
    backgroundColor: 'rgba(31, 162, 166, 0.08)', // ✅ Design System
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
