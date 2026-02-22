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
import { PlayerRatingSlider } from './PlayerRatingSlider';

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
import { STORAGE_KEYS, TEXT } from '../../config/constants';
import { handleError, ErrorType } from '../../utils/GlobalErrorHandler';
import { checkAndAwardBadges, UserStats, BadgeAwardResult } from '../../services/badgeService';
import { getBadgeColor, getBadgeTierName } from '../../types/badges.types';

const { width, height } = Dimensions.get('window');

interface MatchRatingsScreenProps {
  matchData: any;
  lineups?: any;
  favoriteTeamIds?: number[];
  /** Kullanıcı bu maç için kadro tahmini yapmış mı? (izleme modu için) */
  hasPrediction?: boolean;
}

interface Player {
  id: number;
  number: number;
  name: string;
  position: string;
  photo?: string | null;
  isStarter?: boolean; // İlk 11'de mi?
  isSubstitute?: boolean; // Yedek mi?
  playedInMatch?: boolean; // Maçta oynadı mı? (starter veya oyuna girdi)
  minutesPlayed?: number; // Oynadığı dakika
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

// ⚽ Saha oyuncusu değerlendirme kategorileri (9 Kategori)
const OUTFIELD_RATING_CATEGORIES = [
  { id: 'shooting', emoji: '🎯', title: 'Şut', color: '#EF4444', apiFields: ['shots.total', 'shots.on'] },
  { id: 'passing', emoji: '🎨', title: 'Pas', color: '#3B82F6', apiFields: ['passes.total', 'passes.accuracy', 'passes.key'] },
  { id: 'dribbling', emoji: '🌀', title: 'Dribling', color: '#F59E0B', apiFields: ['dribbles.attempts', 'dribbles.success'] },
  { id: 'defending', emoji: '🛡️', title: 'Savunma', color: '#8B5CF6', apiFields: ['tackles.total', 'tackles.blocks', 'tackles.interceptions'] },
  { id: 'duels', emoji: '⚔️', title: 'İkili Mücadele', color: '#06B6D4', apiFields: ['duels.total', 'duels.won'] },
  { id: 'discipline', emoji: '🟨', title: 'Disiplin', color: '#FBBF24', apiFields: ['cards.yellow', 'cards.red', 'fouls.committed'] },
  { id: 'tactical', emoji: '🧠', title: 'Taktik', color: '#10B981', apiFields: [] },
  { id: 'mental', emoji: '💪', title: 'Mental', color: '#6366F1', apiFields: [] },
  { id: 'fitness', emoji: '❤️', title: 'Sağlık', color: '#EC4899', apiFields: [] },
];

// 🧤 Kaleci değerlendirme kategorileri (9 Kategori)
const GK_RATING_CATEGORIES = [
  { id: 'saves', emoji: '🧤', title: 'Kurtarış', color: '#22C55E', apiFields: ['goalkeeper.saves', 'goals.conceded'] },
  { id: 'penalty', emoji: '🥅', title: 'Penaltı', color: '#EF4444', apiFields: ['penalty.saved'] },
  { id: 'aerial', emoji: '✈️', title: 'Hava Topu', color: '#3B82F6', apiFields: [] },
  { id: 'reflexes', emoji: '⚡', title: 'Refleks', color: '#F59E0B', apiFields: [] },
  { id: 'rushing', emoji: '🏃', title: 'Çıkış', color: '#8B5CF6', apiFields: [] },
  { id: 'discipline', emoji: '🟨', title: 'Disiplin', color: '#FBBF24', apiFields: ['cards.yellow', 'cards.red', 'fouls.committed'] },
  { id: 'tactical', emoji: '🧠', title: 'Taktik', color: '#10B981', apiFields: [] },
  { id: 'mental', emoji: '💪', title: 'Mental', color: '#6366F1', apiFields: [] },
  { id: 'fitness', emoji: '❤️', title: 'Sağlık', color: '#EC4899', apiFields: [] },
];

// Kaleci mi kontrolü - API'den G, GK, Goalkeeper vb. gelebilir
const isGoalkeeperPosition = (pos: string) => {
  if (!pos) return false;
  const p = String(pos).toUpperCase();
  return p === 'GK' || p === 'G' || pos.toLowerCase().includes('goalkeeper');
};

// Pozisyona göre kategori seçici - kaleciye GK yetenekleri, sahaya futbolcu yetenekleri
const getRatingCategories = (position: string) => 
  isGoalkeeperPosition(position) ? GK_RATING_CATEGORIES : OUTFIELD_RATING_CATEGORIES;

export const MatchRatings: React.FC<MatchRatingsScreenProps> = ({
  matchData,
  lineups,
  favoriteTeamIds = [],
  hasPrediction = true, // ✅ Varsayılan true - eski maçlar için geriye uyumluluk
}) => {
  // ✅ İZLEME MODU: Kadro tahmini yapılmadıysa değerlendirme yapılamaz
  const isViewOnlyMode = !hasPrediction;
  // ⚽ Takım kadrosu state
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [squadLoading, setSquadLoading] = useState(false);
  
  // 🗑️ Silme onay modal state
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<{ id: number; name: string } | null>(null);
  
  // 🔒 Kilit popup state
  const [showLockPopup, setShowLockPopup] = useState(false);
  const [lockPopupType, setLockPopupType] = useState<'coach' | 'player'>('coach');
  const [lockedPlayerInfo, setLockedPlayerInfo] = useState<{ name: string; reason: string } | null>(null);
  
  // 👁️ İzleme modu popup state
  const [showViewOnlyPopup, setShowViewOnlyPopup] = useState(false);
  const [viewOnlyPopupShownOnEntry, setViewOnlyPopupShownOnEntry] = useState(false); // İlk giriş
  const [viewOnlyPopupShownOnTabSwitch, setViewOnlyPopupShownOnTabSwitch] = useState(false); // İlk sekme değişikliği
  
  // ✅ KİLİT MEKANİZMASI - Maç bitmeden kilitli, bittikten sonra 24 saat açık
  const ratingTimeInfo = useMemo(() => {
    // Maç bitiş zamanını al (fixture.timestamp + maç süresi yaklaşık 2 saat)
    const matchTimestamp = matchData?.fixture?.timestamp 
      ? matchData.fixture.timestamp * 1000 
      : matchData?.timestamp 
        ? new Date(matchData.timestamp).getTime()
        : null;
    
    // Maç durumu kontrolü
    const status = matchData?.fixture?.status?.short || matchData?.status || '';
    const isFinished = status === 'FT' || status === 'AET' || status === 'PEN' || status === 'finished';
    const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'].includes(status);
    const isNotStarted = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status);
    
    // Maç başlamadıysa veya devam ediyorsa → KİLİTLİ
    if (isNotStarted) {
      return { 
        isLocked: true, 
        lockReason: 'not_started' as const,
        hoursRemaining: 0, 
        message: 'Maç henüz başlamadı',
        unlockTime: matchTimestamp ? new Date(matchTimestamp + (2 * 60 * 60 * 1000)).toISOString() : null,
        expireTime: null
      };
    }
    
    if (isLive) {
      return { 
        isLocked: true, 
        lockReason: 'live' as const,
        hoursRemaining: 0, 
        message: 'Maç devam ediyor',
        unlockTime: null,
        expireTime: null
      };
    }
    
    // Maç bitmemişse veya timestamp yoksa → KİLİTLİ
    if (!isFinished || !matchTimestamp) {
      return { 
        isLocked: true, 
        lockReason: 'unknown' as const,
        hoursRemaining: 0, 
        message: '',
        unlockTime: null,
        expireTime: null
      };
    }
    
    // Maç bitti → 24 saat hesapla
    // Mock test için: matchId 888001 veya 888002 ise maç 112 saniye'de biter (simülasyon)
    const isMockMatch = matchData?.id === 888001 || matchData?.id === 888002 || 
                        matchData?.fixture?.id === 888001 || matchData?.fixture?.id === 888002;
    const matchDuration = isMockMatch ? 112 * 1000 : 2 * 60 * 60 * 1000; // Mock: 112 sn, Gerçek: 2 saat
    const matchEndTime = matchTimestamp + matchDuration;
    const now = Date.now();
    const hoursSinceEnd = (now - matchEndTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursSinceEnd);
    
    // 24 saat geçtiyse → KİLİTLİ
    const isExpired = hoursSinceEnd >= 24;
    
    let message = '';
    if (isExpired) {
      message = 'Değerlendirme süresi doldu (24 saat)';
    } else if (hoursRemaining <= 1) {
      message = `Son ${Math.ceil(hoursRemaining * 60)} dakika!`;
    } else {
      message = `Kalan süre: ${Math.floor(hoursRemaining)} saat`;
    }
    
    return { 
      isLocked: isExpired, 
      lockReason: (isExpired ? 'expired' : 'open') as 'expired' | 'open',
      hoursRemaining, 
      message,
      unlockTime: null,
      expireTime: new Date(matchEndTime + (24 * 60 * 60 * 1000)).toISOString()
    };
  }, [matchData]);
  
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

  // Lineups'tan oyuncuları çıkar (favori takım) - oynayan/oynamayan bilgisi ile
  const getPlayersFromLineups = useMemo((): Player[] => {
    if (!lineups) return [];
    
    const lineupsArray = Array.isArray(lineups) ? lineups : (lineups as any)?.data;
    if (!lineupsArray?.length) return [];
    
    // Favori takımın lineup'ını bul
    const teamLineup = lineupsArray.find((l: any) => l.team?.id === targetTeamId) || lineupsArray[0];
    if (!teamLineup) return [];
    
    const players: Player[] = [];
    
    // İlk 11 - hepsi oynamış sayılır
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
            isStarter: true,
            isSubstitute: false,
            playedInMatch: true, // Starter → kesinlikle oynadı
            minutesPlayed: 90, // Varsayılan
          });
        }
      });
    }
    
    // Yedekler - sadece oyuna girenler değerlendirilebilir
    // API'den events çekildiğinde güncellenir, şimdilik hepsi "oynamadı" kabul
    if (teamLineup.substitutes) {
      teamLineup.substitutes.forEach((item: any, idx: number) => {
        const p = item.player || item;
        if (p) {
          // API'den minutes bilgisi varsa kullan, yoksa 0 (oynamadı)
          const minutes = p.minutes || p.statistics?.[0]?.games?.minutes || 0;
          players.push({
            id: p.id || 100 + idx,
            number: p.number || 12 + idx,
            name: p.name || 'Bilinmiyor',
            position: p.pos || p.position || 'MF',
            photo: p.photo || null,
            isStarter: false,
            isSubstitute: true,
            playedInMatch: minutes > 0, // Dakika varsa oynadı
            minutesPlayed: minutes,
          });
        }
      });
    }
    
    return players;
  }, [lineups, targetTeamId]);

  // ⚽ Kadro kaynağı: 1) Lineups, 2) DB cache (useFavoriteSquads), 3) Backend API, 4) Fallback
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
    
    // 3) Backend API'den kadro çek (DB'de yoksa)
    const fetchFromBackend = async () => {
      try {
        console.log('🌐 [Ratings] Backend API\'den kadro çekiliyor: team', targetTeamId);
        const response = await api.getTeamSquad(targetTeamId);
        if (response?.players && response.players.length > 0) {
          const normalized = response.players.map((p: any, idx: number) => ({
            id: p.id ?? idx + 1,
            number: p.number ?? idx + 1,
            name: p.name ?? 'Bilinmiyor',
            position: p.position || 'MF',
            photo: p.photo ?? null,
            isStarter: true, // Kadro listesi - hepsi potansiyel starter
            isSubstitute: false,
            playedInMatch: false,
          }));
          console.log('✅ [Ratings] Kadro: Backend API →', normalized.length, 'oyuncu');
          setSquadPlayers(normalized);
          return;
        }
      } catch (e) {
        console.log('⚠️ [Ratings] Backend API hatası:', e);
      }
      
      // 4) Backend'de de yoksa fallback
      if (FALLBACK_SQUADS[targetTeamId]) {
        console.log('⚠️ [Ratings] Kadro: fallback → team', targetTeamId);
        setSquadPlayers(FALLBACK_SQUADS[targetTeamId]);
      } else {
        console.log('❌ [Ratings] Kadro bulunamadı: team', targetTeamId);
      }
    };
    
    fetchFromBackend();
  }, [targetTeamId, getPlayersFromLineups, getCachedSquad, favoriteSquadsVersion, favoriteSquadsLoading, FALLBACK_SQUADS]);
  
  // Önce squad API'den, yoksa lineups'tan al
  const playersFromLineups = squadPlayers.length > 0 ? squadPlayers : getPlayersFromLineups;
  // Tab state
  const [activeTab, setActiveTab] = useState<'coach' | 'player'>('coach');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [pendingTab, setPendingTab] = useState<'coach' | 'player' | null>(null);
  
  // ✅ İZLEME MODU: İlk giriş popup gösterimi
  React.useEffect(() => {
    if (isViewOnlyMode && !viewOnlyPopupShownOnEntry) {
      // İlk girişte popup göster
      const timer = setTimeout(() => {
        setShowViewOnlyPopup(true);
        setViewOnlyPopupShownOnEntry(true);
      }, 300); // Kısa gecikme ile smooth geçiş
      return () => clearTimeout(timer);
    }
  }, [isViewOnlyMode, viewOnlyPopupShownOnEntry]);
  
  // ✅ İZLEME MODU: İlk sekme değişikliğinde popup gösterimi
  const previousTabRef = React.useRef(activeTab);
  React.useEffect(() => {
    if (isViewOnlyMode && previousTabRef.current !== activeTab) {
      // Sekme değişti
      if (!viewOnlyPopupShownOnTabSwitch) {
        // İlk sekme değişikliği - popup göster
        setShowViewOnlyPopup(true);
        setViewOnlyPopupShownOnTabSwitch(true);
      }
      previousTabRef.current = activeTab;
    }
  }, [activeTab, isViewOnlyMode, viewOnlyPopupShownOnTabSwitch]);
  
  // Değişiklik takibi (ref = tıklamada her zaman güncel, stale closure önlenir)
  const [coachRatingsChanged, setCoachRatingsChanged] = useState(false);
  const [playerRatingsChanged, setPlayerRatingsChanged] = useState(false);
  const coachRatingsChangedRef = useRef(false);
  const playerRatingsChangedRef = useRef(false);
  coachRatingsChangedRef.current = coachRatingsChanged;
  playerRatingsChangedRef.current = playerRatingsChanged;
  
  // Topluluk verileri - gerçek veri gelene kadar boş başlar
  const communityRatingsDefault: {[key: number]: number} = {};
  const [hasCommunityData, setHasCommunityData] = useState(false);
  
  // Coach rating state - kullanıcı kendi puanını verir
  const initialCoachRatings = useRef<{[key: number]: number}>({});
  const [coachRatings, setCoachRatings] = useState<{[key: number]: number}>({});

  // ⚽ Player rating state
  const [expandedPlayerId, setExpandedPlayerId] = useState<number | null>(null);
  const [playerRatings, setPlayerRatings] = useState<{[playerId: number]: {[categoryId: string]: number}}>({});
  
  // 🎯 Yeni UI: Seçili kategori ve oyuncu
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('shooting');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hasUnsavedPlayerChanges, setHasUnsavedPlayerChanges] = useState(false);
  const [initialPlayerRatings, setInitialPlayerRatings] = useState<{[playerId: number]: {[categoryId: string]: number}}>({});
  const [categoryViewMode, setCategoryViewMode] = useState<'outfield' | 'goalkeeper'>('outfield');
  const [ratingMode, setRatingMode] = useState<'detailed' | 'quick'>('detailed'); // Detaylı veya Hızlı değerlendirme
  
  // ✅ KAYIT KİLİDİ: Reyting kaydedildikten sonra değiştirilemez
  const [isCoachRatingsSaved, setIsCoachRatingsSaved] = useState(false); // TD reytingi kaydedildi mi?
  const [isPlayerRatingsSaved, setIsPlayerRatingsSaved] = useState(false); // Oyuncu reytingi kaydedildi mi?
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false); // Kaydetme onay modal'ı
  const [saveConfirmType, setSaveConfirmType] = useState<'coach' | 'player'>('coach'); // Hangi kayıt için onay
  
  // Scroll ref ve player card pozisyonları
  const scrollViewRef = useRef<ScrollView>(null);
  const playerCardRefs = useRef<{[playerId: number]: number}>({});
  
  // Futbolcuları grupla ve sırala: İlk 11 > Sonradan Girenler > Yedekler
  const { starters, substitutesPlayed, substitutesNotPlayed, allPlayersSorted } = useMemo(() => {
    // İlk 11 (starter)
    const startersArr = playersFromLineups
      .filter(p => p.isStarter)
      .sort((a, b) => a.number - b.number);
    
    // Sonradan oyuna girenler (substitute ama oynadı)
    const subsPlayedArr = playersFromLineups
      .filter(p => p.isSubstitute && p.playedInMatch)
      .sort((a, b) => a.number - b.number);
    
    // Yedekler (oyuna girmedi)
    const subsNotPlayedArr = playersFromLineups
      .filter(p => p.isSubstitute && !p.playedInMatch)
      .sort((a, b) => a.number - b.number);
    
    return { 
      starters: startersArr, 
      substitutesPlayed: subsPlayedArr, 
      substitutesNotPlayed: subsNotPlayedArr,
      allPlayersSorted: [...startersArr, ...subsPlayedArr, ...subsNotPlayedArr]
    };
  }, [playersFromLineups]);
  
  // Eski uyumluluk için
  const sortedPlayers = allPlayersSorted;
  
  // Eski değişkenler (geriye uyumluluk)
  const { goalkeepers, fieldPlayers, allPlayers } = useMemo(() => {
    const gks = playersFromLineups.filter(p => isGoalkeeperPosition(p.position)).sort((a, b) => a.number - b.number);
    const fps = playersFromLineups.filter(p => !isGoalkeeperPosition(p.position)).sort((a, b) => a.number - b.number);
    return { goalkeepers: gks, fieldPlayers: fps, allPlayers: [...gks, ...fps] };
  }, [playersFromLineups]);

  // 🎨 Oyuncu satırı render fonksiyonu
  const renderPlayerItem = useCallback((player: any, isDisabled = false) => {
    const isGK = isGoalkeeperPosition(player.position || '');
    const currentRating = playerRatings[player.id]?.[selectedCategoryId] || 5;
    const hasRating = playerRatings[player.id]?.[selectedCategoryId] !== undefined;
    const isSelected = selectedPlayerId === player.id;
    const apiRating = ((player.id % 30) / 10 + 6).toFixed(1);
    
    // 🔒 Kategori uyumsuzluğu kontrolü: Kaleci toggle açıkken sadece kaleciler, Oyuncu toggle açıkken sadece saha oyuncuları
    const isCategoryMismatch = (categoryViewMode === 'goalkeeper' && !isGK) || 
                                (categoryViewMode === 'outfield' && isGK);
    const isEffectivelyDisabled = isDisabled || isCategoryMismatch;
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerListItem2Row,
          isSelected && styles.playerListItemSelected,
          isEffectivelyDisabled && styles.playerListItemDisabled
        ]}
        onPress={() => {
          // ✅ İzleme modu - işlem yapılmaz (popup sadece kilit ikonundan)
          if (isViewOnlyMode) {
            return;
          }
          if (ratingTimeInfo.isLocked) {
            setLockPopupType('player');
            setShowLockPopup(true);
            return;
          }
          if (isDisabled) {
            setLockedPlayerInfo({ name: player.name, reason: 'Oyuna girmedi' });
            return;
          }
          if (isCategoryMismatch) {
            const reason = categoryViewMode === 'goalkeeper' 
              ? 'Kaleci kategorileri sadece kaleciler için geçerlidir' 
              : 'Oyuncu kategorileri kaleciler için geçerli değildir';
            setLockedPlayerInfo({ name: player.name, reason });
            return;
          }
          setSelectedPlayerId(player.id);
        }}
        activeOpacity={0.7}
      >
        {/* Satır 1: Oyuncu Bilgisi + API + Kullanıcı Puanı */}
        <View style={styles.playerListRow1}>
          <LinearGradient
            colors={isGK ? ['#C9A44C', '#8B6914'] : ['#1FA2A6', '#0F2A24']}
            style={[styles.playerListJersey, isEffectivelyDisabled && { opacity: 0.5 }]}
          >
            <Text style={styles.playerListJerseyText}>{player.number}</Text>
          </LinearGradient>
          
          <View style={styles.playerListInfo}>
            <Text style={[styles.playerListName, isEffectivelyDisabled && { color: '#64748B' }]} numberOfLines={1}>
              {player.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.playerListPosition}>{isGK ? 'GK' : player.position}</Text>
              {isCategoryMismatch && (
                <Text style={{ fontSize: 8, color: '#F97316' }}>
                  {categoryViewMode === 'goalkeeper' ? '(Kaleci değil)' : '(Kaleci)'}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.playerListScoreSection}>
            <View style={styles.playerListApiScore}>
              <Text style={styles.playerListApiLabel2}>API</Text>
              <Text style={[styles.playerListApiScoreText, isEffectivelyDisabled && { opacity: 0.5 }]}>{apiRating}</Text>
            </View>
            
            <View style={styles.playerListUserScore}>
              <Text style={styles.playerListUserLabel2}>Siz</Text>
              <Text style={[
                styles.playerListUserScoreText,
                { color: hasRating ? '#1FA2A6' : '#64748B' },
                isEffectivelyDisabled && { opacity: 0.5 }
              ]}>
                {isEffectivelyDisabled ? '—' : (hasRating ? currentRating.toFixed(1) : '—')}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Satır 2: Slider */}
        {!isEffectivelyDisabled && (
          <View style={styles.playerListRow2}>
            <PlayerRatingSlider
              value={currentRating}
              onChange={(val) => {
                // ✅ İzleme modu veya kilit durumu kontrolü (kayıt kilidi dahil)
                if (ratingTimeInfo.isLocked || isViewOnlyMode || isPlayerRatingsSaved) return;
                setPlayerRatings(prev => ({
                  ...prev,
                  [player.id]: {
                    ...(prev[player.id] || {}),
                    [selectedCategoryId]: val
                  }
                }));
                setHasUnsavedPlayerChanges(true);
                setSelectedPlayerId(player.id);
              }}
              disabled={ratingTimeInfo.isLocked || isViewOnlyMode || isPlayerRatingsSaved}
              showValue={false}
              trackHeight={8}
              thumbSize={26}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [playerRatings, selectedCategoryId, selectedPlayerId, ratingTimeInfo.isLocked, categoryViewMode, setLockPopupType, setShowLockPopup, setLockedPlayerInfo, setSelectedPlayerId, setPlayerRatings, setHasUnsavedPlayerChanges]);

  // Topluluk değerlendirme verileri - gerçek veri gelene kadar boş
  const getPlayerCommunityData = useCallback((_playerId: number, _position?: string) => {
    return {
      voters: 0,
      communityAvg: 0,
      categoryRatings: {} as Record<string, number>,
      hasSufficientData: false,
    };
  }, []);

  // ✅ Oyuncu seçildiğinde varsayılan değerler = Topluluk verileri
  // Kullanıcı henüz bu oyuncu için değerlendirme yapmadıysa, topluluk verileriyle başla
  React.useEffect(() => {
    if (!selectedPlayerId) return;
    if (isViewOnlyMode) return; // İzleme modunda değerlendirme yapılamaz
    
    // Bu oyuncu için zaten değerlendirme var mı?
    const existingRatings = playerRatings[selectedPlayerId];
    if (existingRatings && Object.keys(existingRatings).length > 0) return;
    
    // Oyuncunun pozisyonunu bul
    const player = allPlayersSorted.find(p => p.id === selectedPlayerId);
    if (!player) return;
    
    // Topluluk verilerini al ve varsayılan değer olarak ata
    const communityData = getPlayerCommunityData(selectedPlayerId, player.position);
    
    setPlayerRatings(prev => ({
      ...prev,
      [selectedPlayerId]: { ...communityData.categoryRatings }
    }));
    
    // Initial values'ı da kaydet (değişiklik takibi için)
    setInitialPlayerRatings(prev => ({
      ...prev,
      [selectedPlayerId]: { ...communityData.categoryRatings }
    }));
  }, [selectedPlayerId, isViewOnlyMode, playerRatings, allPlayersSorted, getPlayerCommunityData]);

  // Futbolcuya tıklandığında kartı ekranın üstüne scroll et
  const handlePlayerToggle = useCallback((playerId: number, isCurrentlyExpanded: boolean, player?: Player) => {
    // ✅ Kayıt kilidi kontrolü
    if (isPlayerRatingsSaved) {
      Alert.alert(
        'Değerlendirme Kilitli',
        'Futbolcu değerlendirmeleriniz daha önce kaydedildi ve artık değiştirilemez.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    // 🔒 Kilit kontrolü - maç başlamadıysa veya süre dolduysa
    if (ratingTimeInfo.isLocked) {
      setLockPopupType('player');
      setShowLockPopup(true);
      return;
    }
    
    // 🔒 Oynamayan oyuncu kontrolü
    if (player && player.isSubstitute && !player.playedInMatch) {
      setLockedPlayerInfo({ 
        name: player.name, 
        reason: 'oyuna girmedi' 
      });
      return;
    }
    
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
  }, [ratingTimeInfo.isLocked]);

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
  
  // Kaydet ve geç (silent + skipConfirm çünkü zaten başka bir popup'tan geliyoruz)
  const handleSaveAndSwitch = async () => {
    if (activeTab === 'coach') {
      await handleSaveRatings(true, true); // silent save, skipConfirm
    } else {
      await handleSavePlayerRatings(true, true); // silent save, skipConfirm
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
  
  // ✅ Kayıtlı reyting kilidi durumunu yükle
  React.useEffect(() => {
    const loadSavedRatingsLockStatus = async () => {
      try {
        // TD reytingi kontrol et
        const coachRatingsStr = await AsyncStorage.getItem(`${STORAGE_KEYS.RATINGS}${matchData.id}`);
        if (coachRatingsStr) {
          const coachData = JSON.parse(coachRatingsStr);
          if (coachData.isLocked === true) {
            setIsCoachRatingsSaved(true);
            // Kaydedilmiş değerleri yükle
            if (coachData.coachRatings) {
              setCoachRatings(coachData.coachRatings);
              initialCoachRatings.current = coachData.coachRatings;
            }
          }
        }
        
        // Oyuncu reytingi kontrol et
        const playerRatingsStr = await AsyncStorage.getItem(`${STORAGE_KEYS.RATINGS}${matchData.id}_players`);
        if (playerRatingsStr) {
          const playerData = JSON.parse(playerRatingsStr);
          if (playerData.isLocked === true) {
            setIsPlayerRatingsSaved(true);
            // Kaydedilmiş değerleri yükle
            if (playerData.playerRatings) {
              setPlayerRatings(playerData.playerRatings);
              setInitialPlayerRatings(playerData.playerRatings);
            }
          }
        }
      } catch (e) {
        console.warn('Reyting kilit durumu yüklenemedi:', e);
      }
    };
    
    loadSavedRatingsLockStatus();
  }, [matchData.id]);

  const loadPredictionsAndCalculateScores = async () => {
    try {
      const predictionDataStr = await AsyncStorage.getItem(`${STORAGE_KEYS.PREDICTIONS}${matchData.id}`);
      
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

  const handleSaveRatings = async (silent = false, skipConfirm = false) => {
    // ✅ Zaten kaydedilmişse (kilitli) işlem yapma
    if (isCoachRatingsSaved) {
      if (!silent) {
        Alert.alert(
          'Değerlendirme Kilitli',
          'Teknik direktör değerlendirmeniz daha önce kaydedildi ve artık değiştirilemez.',
          [{ text: 'Tamam' }]
        );
      }
      return;
    }
    
    // ✅ 24 saat kilit kontrolü
    if (ratingTimeInfo.isLocked) {
      if (!silent) {
        Alert.alert(
          'Süre Doldu',
          'Değerlendirme süresi sona erdi. Maç bittikten sonra 24 saat içinde değerlendirme yapabilirsiniz.',
          [{ text: 'Tamam' }]
        );
      }
      return;
    }
    
    // ✅ Onay modal'ı göster (skipConfirm false ise)
    if (!skipConfirm && !silent) {
      setSaveConfirmType('coach');
      setShowSaveConfirmModal(true);
      return;
    }
    
    try {
      // Calculate average rating
      const ratingsArray = Object.values(coachRatings);
      const averageRating = ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length;

      // Save ratings to AsyncStorage - ✅ isLocked: true ekle
      const ratingsData = {
        matchId: matchData.id,
        coachRatings: coachRatings,
        averageRating: averageRating.toFixed(1),
        timestamp: new Date().toISOString(),
        isLocked: true, // ✅ KALİCİ KİLİT
        savedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.RATINGS}${matchData.id}`,
        JSON.stringify(ratingsData)
      );
      
      console.log('✅ Coach ratings saved and LOCKED!', ratingsData);
      initialCoachRatings.current = { ...coachRatings };
      setCoachRatingsChanged(false);
      setIsCoachRatingsSaved(true); // ✅ Kilitle
      
      // 🏆 CHECK AND AWARD BADGES
      await checkAndAwardBadgesForMatch();
      
      if (!silent) {
        Alert.alert(
          'Değerlendirmeler Kaydedildi ve Kilitlendi! ⭐',
          `Teknik direktöre ortalama ${averageRating.toFixed(1)} puan verdiniz. Bu değerlendirme artık değiştirilemez.`,
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
  const handleSavePlayerRatings = async (silent = false, skipConfirm = false) => {
    // ✅ Zaten kaydedilmişse (kilitli) işlem yapma
    if (isPlayerRatingsSaved) {
      if (!silent) {
        Alert.alert(
          'Değerlendirme Kilitli',
          'Futbolcu değerlendirmeleriniz daha önce kaydedildi ve artık değiştirilemez.',
          [{ text: 'Tamam' }]
        );
      }
      return;
    }
    
    // ✅ 24 saat kilit kontrolü
    if (ratingTimeInfo.isLocked) {
      if (!silent) {
        Alert.alert(
          'Süre Doldu',
          'Değerlendirme süresi sona erdi. Maç bittikten sonra 24 saat içinde değerlendirme yapabilirsiniz.',
          [{ text: 'Tamam' }]
        );
      }
      return;
    }
    
    // ✅ Onay modal'ı göster (skipConfirm false ise ve silent değilse)
    if (!skipConfirm && !silent) {
      setSaveConfirmType('player');
      setShowSaveConfirmModal(true);
      return;
    }
    
    try {
      const playerRatingsData = {
        matchId: matchData.id,
        playerRatings: playerRatings,
        timestamp: new Date().toISOString(),
        isLocked: true, // ✅ KALİCİ KİLİT
        savedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.RATINGS}${matchData.id}_players`,
        JSON.stringify(playerRatingsData)
      );
      
      console.log('✅ Player ratings saved and LOCKED!', playerRatingsData);
      setPlayerRatingsChanged(false);
      setIsPlayerRatingsSaved(true); // ✅ Kilitle
      setInitialPlayerRatings({...playerRatings});
      
      if (!silent) {
        Alert.alert(
          'Değerlendirmeler Kaydedildi ve Kilitlendi! ⚽',
          'Futbolcu değerlendirmeleriniz kaydedildi. Bu değerlendirme artık değiştirilemez.',
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

  const communityRatings = communityRatingsDefault;
  const totalVoters = 0;

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

  // ✅ Yarım puan sistemi: 1 tık = 0.5 puan artışı, aynı kutuya 2. tık = 1 tam puan
  // Kutuya tıklayınca: eğer mevcut değer < star - 0.5 → star - 0.5 (yarım)
  //                    eğer mevcut değer = star - 0.5 → star (tam)
  //                    eğer mevcut değer >= star → star - 0.5 (yarıma geri dön)
  const handleRatingChange = (categoryId: number, star: number) => {
    // ✅ İZLEME MODU - işlem yapılmaz (popup sadece kilit ikonundan)
    if (isViewOnlyMode) {
      return;
    }
    // ✅ Kayıt kilidi kontrolü
    if (isCoachRatingsSaved) {
      Alert.alert(
        'Değerlendirme Kilitli',
        'Teknik direktör değerlendirmeniz daha önce kaydedildi ve artık değiştirilemez.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    // 🔒 Kilit kontrolü (24 saat)
    if (ratingTimeInfo.isLocked) {
      setLockPopupType('coach');
      setShowLockPopup(true);
      return;
    }
    
    setCoachRatings(prev => {
      const currentRating = prev[categoryId] || 5;
      const halfValue = star - 0.5;
      const fullValue = star;
      
      let newRating: number;
      
      if (currentRating < halfValue) {
        // Mevcut değer bu kutunun yarımından küçük → yarıma git
        newRating = halfValue;
      } else if (currentRating === halfValue) {
        // Zaten yarımda → tama git
        newRating = fullValue;
      } else if (currentRating === fullValue) {
        // Zaten tamda → yarıma geri dön
        newRating = halfValue;
      } else {
        // Mevcut değer bu kutunun üstünde → yarıma git
        newRating = halfValue;
      }
      
      // 0.5 ile 10 arasında sınırla
      newRating = Math.max(0.5, Math.min(10, newRating));
      
      return {
        ...prev,
        [categoryId]: newRating
      };
    });
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

      {/* ✅ İZLEME MODU: Kırmızı kilit ikonu */}
      {isViewOnlyMode && (
        <TouchableOpacity 
          style={styles.viewOnlyLockRow}
          onPress={() => setShowViewOnlyPopup(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" size={16} color="#EF4444" />
          <Text style={styles.viewOnlyLockText}>İzleme Modu</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
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
            {/* 🔒 Kilit İkonu - Ortalanmış */}
            {/* TD İsim + Kilit - Aynı Satır */}
            <View style={styles.coachHeaderRow}>
              <View style={styles.coachHeaderLeft}>
                <Text style={styles.headerTitle}>
                  {targetTeamInfo.manager || 'Teknik Direktör'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {targetTeamInfo.name} Teknik Direktörü
                </Text>
              </View>
              
              {/* Kilit İkonu - Sağda (İzleme modunda gösterilmez) */}
              {!isViewOnlyMode && (
                <TouchableOpacity
                  onPress={() => {
                    setLockPopupType('coach');
                    setShowLockPopup(true);
                  }}
                  activeOpacity={0.7}
                  style={styles.coachLockBtn}
                >
                  <Ionicons 
                    name={ratingTimeInfo.isLocked ? 'lock-closed' : 'lock-open'} 
                    size={18} 
                    color={ratingTimeInfo.isLocked ? '#EF4444' : '#10B981'} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Score Comparison - Premium Design */}
            <View style={styles.scoreComparisonCard}>
              <LinearGradient
                colors={['rgba(31, 162, 166, 0.1)', 'rgba(15, 42, 36, 0.3)', 'rgba(201, 164, 76, 0.1)']} // ✅ Design System
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scoreComparisonGradient}
              >
                {/* User Score - İzleme modunda gri/boş */}
                <View style={[styles.scoreColumn, isViewOnlyMode && styles.scoreColumnDisabled]}>
                  <View style={styles.scoreLabelRow}>
                    <Ionicons name="person" size={12} color={isViewOnlyMode ? '#64748B' : '#1FA2A6'} />
                    <Text style={[styles.scoreLabel, { color: isViewOnlyMode ? '#64748B' : '#1FA2A6' }]}>
                      {isViewOnlyMode ? 'DEĞERLENDİRME YOK' : 'SİZİN PUANINIZ'}
                    </Text>
                  </View>
                  {isViewOnlyMode ? (
                    <View style={styles.scoreCircleDisabled}>
                      <Text style={styles.scoreTextDisabled}>—</Text>
                    </View>
                  ) : (
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
                  )}
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
                    <Ionicons name="people" size={12} color="#C9A44C" />
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
                {totalVoters > 0 ? `${totalVoters.toLocaleString()} kullanıcı değerlendirdi` : 'Henüz topluluk değerlendirmesi yok'}
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
                <View style={[styles.ratingContainer, isViewOnlyMode && { opacity: 0.7 }]}>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                      // İzleme modunda: Topluluk puanına göre altın sarısı göster
                      if (isViewOnlyMode) {
                        const isActiveByCommunity = star <= communityRating;
                        return (
                          <View key={star} style={styles.starButton}>
                            <View style={[
                              styles.star, 
                              { backgroundColor: isActiveByCommunity ? '#C9A44C' : 'rgba(100, 116, 139, 0.2)' }
                            ]}>
                              <Text style={[styles.starText, isActiveByCommunity && styles.starTextActive]}>
                                {star}
                              </Text>
                            </View>
                          </View>
                        );
                      }
                      
                      // Yarım puan durumu: star - 0.5 = userRating ise yarım dolu
                      const isFullyActive = star <= userRating;
                      const isHalfActive = !isFullyActive && (star - 0.5) === userRating;
                      const isActive = isFullyActive || isHalfActive;
                      
                      return (
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
                              { 
                                backgroundColor: isFullyActive 
                                  ? category.color 
                                  : isHalfActive 
                                    ? 'rgba(100, 116, 139, 0.2)' 
                                    : 'rgba(100, 116, 139, 0.2)',
                                overflow: 'hidden',
                                position: 'relative'
                              }
                            ]}
                          >
                            {/* Yarım doluluk göstergesi */}
                            {isHalfActive && (
                              <View style={[
                                styles.halfFill,
                                { backgroundColor: category.color }
                              ]} />
                            )}
                            <Text style={[
                              styles.starText,
                              isActive && styles.starTextActive,
                              { zIndex: 1 }
                            ]}>
                              {star}
                            </Text>
                          </Animated.View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Score Comparison */}
                <View style={styles.comparisonContainer}>
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                      <Text style={[styles.comparisonLabel, isViewOnlyMode && { color: '#64748B' }]}>Sizin:</Text>
                      <Text style={[styles.comparisonValueUser, isViewOnlyMode && { color: '#64748B' }]}>
                        {isViewOnlyMode ? '—' : userRating.toFixed(1)}
                      </Text>
                    </View>
                    
                    <View style={styles.comparisonDivider} />
                    
                    <View style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>Topluluk:</Text>
                      <Text style={styles.comparisonValueCommunity}>{communityRating.toFixed(1)}</Text>
                    </View>

                    <View style={styles.comparisonDivider} />

                    <View style={styles.comparisonItem}>
                      <Text style={[styles.comparisonLabel, isViewOnlyMode && { color: '#64748B' }]}>Fark:</Text>
                      <Text style={[
                        styles.comparisonValueDiff,
                        isViewOnlyMode 
                          ? { color: '#64748B' }
                          : difference > 0 ? styles.comparisonPositive : difference < 0 ? styles.comparisonNegative : styles.comparisonNeutral
                      ]}>
                        {isViewOnlyMode ? '—' : (difference > 0 ? '+' : '') + difference.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: isViewOnlyMode ? '0%' : `${(userRating / 10) * 100}%`, 
                            backgroundColor: isViewOnlyMode ? '#64748B' : category.color 
                          }
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

        {/* Info Note - İzleme modunda gizle */}
        {!isViewOnlyMode && (
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteEmoji}>💡</Text>
            <Text style={styles.infoNoteText}>
              Değişiklik yaptıktan sonra sekmeden çıkarken kaydetme seçeneği sunulur.
            </Text>
          </View>
        )}
        
        {/* TD KAYDET FOOTER - İzleme modunda gizle */}
        {!isViewOnlyMode && (
          <View style={styles.coachSaveFooter}>
            <LinearGradient
              colors={['#0F2A24', '#1E3A3A']}
              style={styles.coachSaveFooterGradient}
            >
              {/* Ortalama Puan */}
              <View style={styles.coachSaveInfo}>
                <Text style={styles.coachSaveLabel}>Ortalama Puan</Text>
                <Text style={[styles.coachSaveScore, { color: getRatingColor(userScore) }]}>
                  {userScore}
                </Text>
              </View>
              
              {/* ✅ Kaydedilmişse "Kilitli" göster */}
              {isCoachRatingsSaved ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}>
                  <Ionicons name="lock-closed" size={18} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>
                    Değerlendirme Kilitli
                  </Text>
                </View>
              ) : (
                /* Butonlar */
                <View style={styles.coachSaveButtons}>
                  <TouchableOpacity
                    style={styles.coachSaveBtnCancel}
                    onPress={() => {
                      // Değişiklikleri geri al
                      setCoachRatings({ ...initialCoachRatings.current });
                      setCoachRatingsChanged(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#EF4444" />
                    <Text style={styles.coachSaveBtnCancelText}>İptal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.coachSaveBtnSave}
                    onPress={() => handleSaveRatings(false)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#1FA2A6', '#059669']}
                      style={styles.coachSaveBtnSaveGradient}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                      <Text style={styles.coachSaveBtnSaveText}>Kaydet</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </View>
        )}
        </>
        ) : (
          /* ⚽ FUTBOLCU DEĞERLENDİRMELERİ SEKMESİ - YENİ TASARIM */
          <View style={styles.playerRatingContainer}>

            {/* ⏳ Kadro yükleniyorsa loading göster */}
            {sortedPlayers.length === 0 && favoriteSquadsLoading && (
              <View style={styles.noPlayersContainer}>
                <Ionicons name="hourglass-outline" size={48} color="#1FA2A6" />
                <Text style={styles.noPlayersTitle}>Kadro Yükleniyor...</Text>
                <Text style={styles.noPlayersText}>
                  Oyuncu bilgileri getiriliyor, lütfen bekleyin.
                </Text>
              </View>
            )}
            
            {/* Oyuncu yoksa bilgi mesajı (yükleme bitti ama veri yok) */}
            {sortedPlayers.length === 0 && !favoriteSquadsLoading && (
              <View style={styles.noPlayersContainer}>
                <Ionicons name="people-outline" size={48} color="#64748B" />
                <Text style={styles.noPlayersTitle}>Kadro Bilgisi Yok</Text>
                <Text style={styles.noPlayersText}>
                  Bu maç için kadro bilgisi henüz yayınlanmadı.{'\n'}Maç yaklaştığında kadro görünecektir.
                </Text>
              </View>
            )}

            {sortedPlayers.length > 0 && (
              <>
                {/* 🎯 HEADER: Başlık + Kilit */}
                <View style={styles.playerRatingHeader}>
                  <View style={styles.playerRatingHeaderLeft}>
                    <Text style={styles.playerRatingHeaderTitle}>⚽ Oyuncu Değerlendirmeleri</Text>
                    <Text style={styles.playerRatingHeaderSubtitle}>
                      {starters.length} İlk 11 • {substitutesPlayed.length} Oyuna Girdi
                    </Text>
                  </View>
                  
                  {/* Kilit İkonu (İzleme modunda gösterilmez) */}
                  {!isViewOnlyMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setLockPopupType('player');
                        setShowLockPopup(true);
                      }}
                      activeOpacity={0.7}
                      style={styles.categoryLockBtn}
                    >
                      <Ionicons 
                        name={ratingTimeInfo.isLocked ? 'lock-closed' : 'lock-open'} 
                        size={18} 
                        color={ratingTimeInfo.isLocked ? '#EF4444' : '#10B981'} 
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 👤 OYUNCU KARTLARI - YATAY SCROLL */}
                <View style={styles.playerCardsHorizontalContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.playerCardsHorizontalScroll}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {/* İlk 11 + Oyuna Girenler - Tümü değerlendirilebilir */}
                    {[...starters, ...substitutesPlayed].map((player) => {
                      const isGK = isGoalkeeperPosition(player.position || '');
                      const isSelected = selectedPlayerId === player.id;
                      const hasRatings = playerRatings[player.id] && Object.keys(playerRatings[player.id]).length > 0;
                      
                      // Ortalama puan hesapla
                      const ratings = playerRatings[player.id] || {};
                      const ratingValues = Object.values(ratings);
                      const avgRating = ratingValues.length > 0 
                        ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length 
                        : 0;
                      
                      return (
                        <View key={player.id} style={styles.playerCardMiniWrapper}>
                          {/* Silme Butonu - Kartın dışında, en üstte */}
                          {hasRatings && (
                            <TouchableOpacity
                              style={styles.playerCardMiniDelete}
                              onPress={(e) => {
                                e.stopPropagation();
                                setPlayerRatings(prev => {
                                  const newRatings = { ...prev };
                                  delete newRatings[player.id];
                                  return newRatings;
                                });
                                setPlayerRatingsChanged(true);
                                if (selectedPlayerId === player.id) {
                                  setSelectedPlayerId(null);
                                }
                              }}
                              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                            >
                              <Ionicons name="close" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity
                            style={[
                              styles.playerCardMini,
                              isSelected && styles.playerCardMiniSelected,
                              isGK && styles.playerCardMiniGK,
                            ]}
                            onPress={() => {
                              // ✅ İzleme modunda da oyuncu seçilebilmeli (topluluk verileri gösterilir)
                              if (ratingTimeInfo.isLocked && !isViewOnlyMode) {
                                setLockPopupType('player');
                                setShowLockPopup(true);
                                return;
                              }
                              // Oyuncu seçildiğinde otomatik olarak pozisyonuna göre kategori ayarla
                              setSelectedPlayerId(player.id);
                              if (isGK) {
                                setCategoryViewMode('goalkeeper');
                                // Mevcut kategori kaleci kategorisi değilse ilk kaleci kategorisini seç
                                if (!GK_RATING_CATEGORIES.find(c => c.id === selectedCategoryId)) {
                                  setSelectedCategoryId('saves');
                                }
                              } else {
                                setCategoryViewMode('outfield');
                                // Mevcut kategori saha oyuncusu kategorisi değilse ilk saha kategorisini seç
                                if (!OUTFIELD_RATING_CATEGORIES.find(c => c.id === selectedCategoryId)) {
                                  setSelectedCategoryId('shooting');
                                }
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <LinearGradient
                              colors={['#1E3A3A', '#0F2A24']}
                              style={styles.playerCardMiniGradient}
                            >
                              {/* Forma Numarası Badge - Üstte */}
                              <View style={[
                                styles.playerCardMiniJerseyBadge,
                                isGK && styles.playerCardMiniJerseyBadgeGK,
                              ]}>
                                <Text style={styles.playerCardMiniNumber}>{player.number}</Text>
                              </View>
                              
                              {/* İsim */}
                              <Text 
                                style={styles.playerCardMiniName} 
                                numberOfLines={1}
                              >
                                {player.name.split(' ').pop()}
                              </Text>
                              
                              {/* Alt Satır: Puan + Status */}
                              <View style={styles.playerCardMiniBottom}>
                                {/* Puan Badge */}
                                {avgRating > 0 ? (
                                  <View style={[styles.playerCardMiniBadge, { backgroundColor: getRatingColor(avgRating) }]}>
                                    <Text style={styles.playerCardMiniBadgeText}>{avgRating.toFixed(1)}</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.playerCardMiniStatus, player.isSubstitute && { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                                    <Text style={[styles.playerCardMiniStatusText, player.isSubstitute && { color: '#F97316' }]}>
                                      {player.isSubstitute ? '🔄' : '⚽'}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    
                    {/* Yedekler (Grayed out) */}
                    {substitutesNotPlayed.map((player) => {
                      const isGK = isGoalkeeperPosition(player.position || '');
                      return (
                        <View key={player.id} style={styles.playerCardMiniWrapper}>
                          <TouchableOpacity
                            style={[styles.playerCardMini, styles.playerCardMiniDisabled]}
                            onPress={() => {
                              setLockedPlayerInfo({ name: player.name, reason: 'Oyuna girmedi' });
                            }}
                            activeOpacity={0.5}
                          >
                            <LinearGradient
                              colors={['#334155', '#1E293B']}
                              style={styles.playerCardMiniGradient}
                            >
                              {/* Forma Numarası Badge */}
                              <View style={[styles.playerCardMiniJerseyBadge, { backgroundColor: '#475569', opacity: 0.6 }]}>
                                <Text style={[styles.playerCardMiniNumber, { opacity: 0.7 }]}>{player.number}</Text>
                              </View>
                              
                              {/* İsim */}
                              <Text style={[styles.playerCardMiniName, { color: '#64748B' }]} numberOfLines={1}>
                                {player.name.split(' ').pop()}
                              </Text>
                              
                              {/* Alt Satır: Status */}
                              <View style={styles.playerCardMiniBottom}>
                                <View style={[styles.playerCardMiniStatus, { backgroundColor: 'rgba(100, 116, 139, 0.2)' }]}>
                                  <Text style={[styles.playerCardMiniStatusText, { color: '#64748B' }]}>🪑</Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 📊 SEÇİLİ OYUNCU DEĞERLENDİRME ALANI */}
                {selectedPlayerId && (() => {
                  const selectedPlayer = sortedPlayers.find(p => p.id === selectedPlayerId);
                  if (!selectedPlayer) return null;
                  
                  const isGK = isGoalkeeperPosition(selectedPlayer.position || '');
                  const categories = isGK ? GK_RATING_CATEGORIES : OUTFIELD_RATING_CATEGORIES;
                  const communityData = getPlayerCommunityData(selectedPlayerId, selectedPlayer.position);
                  const playerCategoryRatings = isViewOnlyMode 
                    ? communityData.categoryRatings 
                    : (playerRatings[selectedPlayerId] || {});
                  const ratingValues = Object.values(playerCategoryRatings);
                  const avgRating = ratingValues.length > 0 
                    ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length 
                    : (isViewOnlyMode ? communityData.communityAvg : 0);
                  
                  return (
                    <View style={styles.selectedPlayerPanel}>
                      {/* Oyuncu Başlık */}
                      <View style={styles.selectedPlayerHeader}>
                        <LinearGradient
                          colors={isGK ? ['#C9A44C', '#8B6914'] : ['#1FA2A6', '#0F2A24']}
                          style={styles.selectedPlayerHeaderJersey}
                        >
                          <Text style={styles.selectedPlayerHeaderNumber}>{selectedPlayer.number}</Text>
                        </LinearGradient>
                        <View style={styles.selectedPlayerHeaderInfo}>
                          <Text style={styles.selectedPlayerHeaderName}>{selectedPlayer.name}</Text>
                          <Text style={styles.selectedPlayerHeaderPos}>
                            {isGK ? '🧤 Kaleci' : `⚽ ${selectedPlayer.position}`}
                          </Text>
                        </View>
                        <View style={styles.selectedPlayerHeaderAvg}>
                          <Text style={[
                            styles.selectedPlayerHeaderAvgLabel, 
                            isViewOnlyMode && { color: '#C9A44C' }
                          ]}>
                            {isViewOnlyMode ? 'Topluluk' : 'Ortalama'}
                          </Text>
                          <Text style={[
                            styles.selectedPlayerHeaderAvgValue, 
                            { color: isViewOnlyMode ? '#C9A44C' : getRatingColor(avgRating) }
                          ]}>
                            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* 🔀 Değerlendirme Modu Toggle - İzleme modunda gizle */}
                      {isViewOnlyMode ? (
                        <View style={styles.viewOnlyCommunityBadge}>
                          <Ionicons name="people" size={14} color="#C9A44C" />
                          <Text style={styles.viewOnlyCommunityText}>
                            Topluluk Değerlendirmesi • {communityData.voters} oy
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.ratingModeToggle}>
                          <TouchableOpacity
                            style={[
                              styles.ratingModeBtn,
                              ratingMode === 'detailed' && styles.ratingModeBtnActive
                            ]}
                            onPress={() => setRatingMode('detailed')}
                            activeOpacity={0.7}
                          >
                            <Ionicons 
                              name="options-outline" 
                              size={16} 
                              color={ratingMode === 'detailed' ? '#1FA2A6' : '#64748B'} 
                            />
                            <Text style={[
                              styles.ratingModeBtnText,
                              ratingMode === 'detailed' && styles.ratingModeBtnTextActive
                            ]}>Detaylı</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.ratingModeBtn,
                              ratingMode === 'quick' && styles.ratingModeBtnActive
                            ]}
                            onPress={() => setRatingMode('quick')}
                            activeOpacity={0.7}
                          >
                            <Ionicons 
                              name="flash-outline" 
                              size={16} 
                              color={ratingMode === 'quick' ? '#F59E0B' : '#64748B'} 
                            />
                            <Text style={[
                              styles.ratingModeBtnText,
                              ratingMode === 'quick' && { color: '#F59E0B' }
                            ]}>Hızlı</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {/* 📊 DETAYLI DEĞERLENDİRME */}
                      {ratingMode === 'detailed' && (
                        <>
                          {/* Kategori Kartları - Topluluk + Kullanıcı Puanı */}
                          {(() => {
                            const communityData = getPlayerCommunityData(selectedPlayerId, selectedPlayer.position);
                            return (
                              <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.categoryCardsScroll}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={true}
                                style={{ marginBottom: 12 }}
                              >
                                {categories.map((category) => {
                                  const isSelected = selectedCategoryId === category.id;
                                  const userRating = playerCategoryRatings[category.id];
                                  const commRating = communityData.categoryRatings[category.id];
                                  return (
                                    <TouchableOpacity
                                      key={category.id}
                                      style={[
                                        styles.categoryCardFixed,
                                        isSelected && styles.categoryCardSelected,
                                        isSelected && { borderColor: category.color }
                                      ]}
                                      onPress={() => setSelectedCategoryId(category.id)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.categoryCardEmojiLarge}>{category.emoji}</Text>
                                      <Text style={[
                                        styles.categoryCardTitleFixed,
                                        isSelected && { color: category.color }
                                      ]}>{category.title}</Text>
                                      
                                      {/* Topluluk + Kullanıcı Puanları */}
                                      <View style={styles.categoryCardScores}>
                                        {/* Topluluk Puanı */}
                                        <View style={styles.categoryCardScoreRow}>
                                          <Text style={styles.categoryCardScoreLabel}>👥</Text>
                                          <Text style={[styles.categoryCardScoreValue, { color: '#C9A44C' }]}>
                                            {commRating?.toFixed(1) || '—'}
                                          </Text>
                                        </View>
                                        {/* Kullanıcı - İzleme modunda gri */}
                                        {!isViewOnlyMode && (
                                          <View style={styles.categoryCardScoreRow}>
                                            <Text style={styles.categoryCardScoreLabel}>👤</Text>
                                            <Text style={[
                                              styles.categoryCardScoreValue, 
                                              { color: userRating !== undefined ? getRatingColor(userRating) : '#64748B' }
                                            ]}>
                                              {userRating !== undefined ? userRating.toFixed(1) : '—'}
                                            </Text>
                                          </View>
                                        )}
                                      </View>
                                      {/* İzleme modunda: Oy sayısı ve % */}
                                      {isViewOnlyMode && (
                                        <View style={styles.categoryCardVoterInfo}>
                                          <Text style={styles.categoryCardVoterText}>
                                            {communityData.voters} oy
                                          </Text>
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            );
                          })()}
                          
                          {/* Slider - İzleme modunda gizle */}
                          {!isViewOnlyMode && (
                            <View style={styles.selectedPlayerSliderContainer}>
                              <Text style={styles.selectedPlayerSliderLabel}>
                                {categories.find(c => c.id === selectedCategoryId)?.title || 'Kategori Seçin'}
                              </Text>
                              <PlayerRatingSlider
                                value={playerCategoryRatings[selectedCategoryId] || 5}
                                onChange={(val) => {
                                  if (ratingTimeInfo.isLocked) return;
                                  setPlayerRatings(prev => ({
                                    ...prev,
                                    [selectedPlayerId]: {
                                      ...(prev[selectedPlayerId] || {}),
                                      [selectedCategoryId]: val
                                    }
                                  }));
                                  setPlayerRatingsChanged(true);
                                  setHasUnsavedPlayerChanges(true);
                                }}
                                disabled={ratingTimeInfo.isLocked}
                              />
                            </View>
                          )}
                        </>
                      )}

                      {/* ⚡ HIZLI DEĞERLENDİRME - İzleme modunda gizle */}
                      {ratingMode === 'quick' && !isViewOnlyMode && (
                        <View style={styles.quickRatingContainer}>
                          {/* Tek İkon + Açıklama */}
                          <View style={styles.quickRatingHeader}>
                            <Ionicons name="star" size={18} color={isViewOnlyMode ? '#C9A44C' : '#F59E0B'} />
                            <Text style={styles.quickRatingLabel}>
                              {isViewOnlyMode ? 'Topluluk ortalaması' : 'Tüm kategorilere aynı puanı ver'}
                            </Text>
                          </View>
                          
                          {/* 1-10 Tek Satır - İzleme modunda topluluk verisiyle dolu */}
                          <View style={styles.quickRatingButtonsSingle}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                              // İzleme modunda topluluk ortalamasına göre doldur
                              const communityAvgRounded = isViewOnlyMode ? Math.round(communityData.communityAvg) : 0;
                              const isSelected = isViewOnlyMode ? score <= communityAvgRounded : avgRating === score;
                              const isExactMatch = isViewOnlyMode ? score === communityAvgRounded : avgRating === score;
                              
                              return (
                                <TouchableOpacity
                                  key={score}
                                  disabled={isViewOnlyMode}
                                  style={[
                                    styles.quickRatingBtnSmall,
                                    isSelected && styles.quickRatingBtnSmallSelected,
                                    isViewOnlyMode && isSelected && { backgroundColor: '#C9A44C', borderColor: '#C9A44C' },
                                    !isViewOnlyMode && isExactMatch && { backgroundColor: getRatingColor(score), borderColor: getRatingColor(score) }
                                  ]}
                                  onPress={() => {
                                    if (ratingTimeInfo.isLocked || isViewOnlyMode || isPlayerRatingsSaved) return;
                                    const newRatings: Record<string, number> = {};
                                    categories.forEach(cat => { newRatings[cat.id] = score; });
                                    setPlayerRatings(prev => ({ ...prev, [selectedPlayerId]: newRatings }));
                                    setPlayerRatingsChanged(true);
                                    setHasUnsavedPlayerChanges(true);
                                  }}
                                  activeOpacity={isViewOnlyMode ? 1 : 0.7}
                                >
                                  <Text style={[
                                    styles.quickRatingBtnSmallText, 
                                    { color: isSelected ? '#FFFFFF' : (isViewOnlyMode ? '#64748B' : getRatingColor(score)) }
                                  ]}>{score}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                      
                      {/* Kaydet Footer - İzleme modunda gizle */}
                      {!isViewOnlyMode && (
                        <View style={styles.selectedPlayerFooter}>
                          <LinearGradient
                            colors={['#0F2A24', '#1E3A3A']}
                            style={styles.selectedPlayerFooterGradient}
                          >
                            <View style={styles.selectedPlayerInfo}>
                              <Text style={styles.selectedPlayerAvg}>
                                {selectedPlayer.name} - Ort: {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                              </Text>
                            </View>
                            
                            {/* ✅ Kaydedilmişse "Kilitli" göster */}
                            {isPlayerRatingsSaved ? (
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                              }}>
                                <Ionicons name="lock-closed" size={16} color="#EF4444" />
                                <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 12 }}>
                                  Kilitli
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.selectedPlayerButtons}>
                                <TouchableOpacity
                                  style={styles.selectedPlayerBtnCancel}
                                  onPress={() => {
                                    // Bu oyuncunun puanlarını sil
                                    setPlayerRatings(prev => {
                                      const newRatings = { ...prev };
                                      delete newRatings[selectedPlayerId];
                                      return newRatings;
                                    });
                                    setHasUnsavedPlayerChanges(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                  <Text style={styles.selectedPlayerBtnCancelText}>Sil</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  style={styles.selectedPlayerBtnSave}
                                  onPress={() => {
                                    handleSavePlayerRatings(true, true); // silent save, skipConfirm
                                    setInitialPlayerRatings({...playerRatings});
                                    setHasUnsavedPlayerChanges(false);
                                    
                                    // ✅ Kartı kapat - yeni oyuncuya hazır
                                    setSelectedPlayerId(null);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <LinearGradient
                                    colors={['#1FA2A6', '#059669']}
                                    style={styles.selectedPlayerBtnSaveGradient}
                                  >
                                    <Ionicons name="checkmark" size={18} color="#FFF" />
                                    <Text style={styles.selectedPlayerBtnSaveText}>Kaydet</Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              </View>
                            )}
                          </LinearGradient>
                        </View>
                      )}
                    </View>
                  );
                })()}
                
                {/* Oyuncu seçilmemişse info mesajı */}
                {!selectedPlayerId && (
                  <View style={styles.selectPlayerPrompt}>
                    <Ionicons name="hand-left-outline" size={32} color="#64748B" />
                    <Text style={styles.selectPlayerPromptText}>
                      Değerlendirmek için yukarıdan bir oyuncu seçin
                    </Text>
                  </View>
                )}
                
                {/* ✅ DEĞERLENDİRİLMİŞ OYUNCULAR LİSTESİ */}
                {(() => {
                  const ratedPlayers = [...starters, ...substitutesPlayed].filter(p => 
                    playerRatings[p.id] && Object.keys(playerRatings[p.id]).length > 0
                  );
                  
                  if (ratedPlayers.length === 0) return null;
                  
                  return (
                    <View style={styles.ratedPlayersSection}>
                      <View style={styles.ratedPlayersHeader}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.ratedPlayersTitle}>
                          Değerlendirilen Oyuncular ({ratedPlayers.length})
                        </Text>
                      </View>
                      
                      {ratedPlayers.map((player) => {
                        const isGK = isGoalkeeperPosition(player.position || '');
                        const ratings = playerRatings[player.id] || {};
                        const ratingValues = Object.values(ratings);
                        const avg = ratingValues.length > 0 
                          ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length 
                          : 0;
                        
                        return (
                          <TouchableOpacity
                            key={player.id}
                            style={styles.ratedPlayerRow}
                            onPress={() => {
                              setSelectedPlayerId(player.id);
                              const playerIsGK = isGoalkeeperPosition(player.position || '');
                              setCategoryViewMode(playerIsGK ? 'goalkeeper' : 'outfield');
                              setSelectedCategoryId(playerIsGK ? 'saves' : 'shooting');
                            }}
                            activeOpacity={0.7}
                          >
                            <LinearGradient
                              colors={isGK ? ['#C9A44C', '#8B6914'] : ['#1FA2A6', '#0F2A24']}
                              style={styles.ratedPlayerJersey}
                            >
                              <Text style={styles.ratedPlayerNumber}>{player.number}</Text>
                            </LinearGradient>
                            
                            <View style={styles.ratedPlayerInfo}>
                              <Text style={styles.ratedPlayerName}>{player.name}</Text>
                              <Text style={styles.ratedPlayerPos}>{isGK ? 'Kaleci' : player.position}</Text>
                            </View>
                            
                            <View style={[styles.ratedPlayerScore, { backgroundColor: getRatingColor(avg) }]}>
                              <Text style={styles.ratedPlayerScoreText}>{avg.toFixed(1)}</Text>
                            </View>
                            
                            <Ionicons name="chevron-forward" size={16} color="#64748B" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}
                
                {/* Alt boşluk - sayfa sığması için */}
                <View style={{ height: 100 }} />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* 🗑️ SİLME ONAY POPUP */}
      {/* 🔒 KİLİT BİLGİ POPUP */}
      <Modal
        visible={showLockPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLockPopup(false)}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => setShowLockPopup(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.lockPopupContainer}>
            {/* Icon */}
            <View style={[styles.lockPopupIcon, {
              backgroundColor: ratingTimeInfo.isLocked 
                ? 'rgba(239, 68, 68, 0.15)' 
                : 'rgba(16, 185, 129, 0.15)',
            }]}>
              <Ionicons 
                name={ratingTimeInfo.isLocked ? 'lock-closed' : 'lock-open'} 
                size={32} 
                color={ratingTimeInfo.isLocked ? '#EF4444' : '#10B981'} 
              />
            </View>

            {/* Title */}
            <Text style={[styles.lockPopupTitle, {
              color: ratingTimeInfo.isLocked ? '#EF4444' : '#10B981',
            }]}>
              {ratingTimeInfo.isLocked ? 'Değerlendirme Kilitli' : 'Değerlendirme Açık'}
            </Text>

            {/* Description */}
            <Text style={styles.lockPopupDesc}>
              {ratingTimeInfo.lockReason === 'not_started' && (
                <>Maç henüz başlamadı. Değerlendirme, maç bittikten sonra <Text style={{ fontWeight: '700', color: '#10B981' }}>24 saat</Text> boyunca açık olacak.</>
              )}
              {ratingTimeInfo.lockReason === 'live' && (
                <>Maç devam ediyor. Değerlendirme, maç bittikten sonra <Text style={{ fontWeight: '700', color: '#10B981' }}>24 saat</Text> boyunca açık olacak.</>
              )}
              {ratingTimeInfo.lockReason === 'expired' && (
                <>Değerlendirme süresi doldu. Maç bittikten sonra <Text style={{ fontWeight: '700', color: '#EF4444' }}>24 saat</Text> içinde değerlendirme yapabilirsiniz.</>
              )}
              {ratingTimeInfo.lockReason === 'open' && (
                <>Değerlendirme açık! Kalan süre: <Text style={{ fontWeight: '700', color: '#10B981' }}>{ratingTimeInfo.message}</Text>. Bu süre içinde TD ve oyuncuları değerlendirebilirsiniz.</>
              )}
              {ratingTimeInfo.lockReason === 'unknown' && (
                <>Maç durumu belirsiz. Lütfen daha sonra tekrar deneyin.</>
              )}
            </Text>

            {/* Info Cards */}
            <View style={styles.lockPopupInfoCards}>
              <View style={styles.lockPopupInfoCard}>
                <Ionicons name="timer-outline" size={20} color="#1FA2A6" />
                <Text style={styles.lockPopupInfoCardTitle}>Kilit Açılışı</Text>
                <Text style={styles.lockPopupInfoCardDesc}>Maç bitiş düdüğü</Text>
              </View>
              <View style={styles.lockPopupInfoCard}>
                <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
                <Text style={styles.lockPopupInfoCardTitle}>Süre</Text>
                <Text style={styles.lockPopupInfoCardDesc}>24 saat</Text>
              </View>
              <View style={styles.lockPopupInfoCard}>
                <Ionicons name="lock-closed-outline" size={20} color="#EF4444" />
                <Text style={styles.lockPopupInfoCardTitle}>Kilit Kapanışı</Text>
                <Text style={styles.lockPopupInfoCardDesc}>24 saat sonra</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.lockPopupCloseBtn}
              onPress={() => setShowLockPopup(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.lockPopupCloseBtnText}>Anladım</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 🔒 OYUNCU KİLİT POPUP - Oynamayan oyuncular için */}
      <Modal
        visible={lockedPlayerInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedPlayerInfo(null)}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => setLockedPlayerInfo(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.lockPopupContainer}>
            {/* Icon */}
            <View style={[styles.lockPopupIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="person-remove" size={32} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={[styles.lockPopupTitle, { color: '#EF4444' }]}>
              Oyuncu Değerlendirilemez
            </Text>

            {/* Description */}
            <Text style={styles.lockPopupDesc}>
              <Text style={{ fontWeight: '700', color: '#F1F5F9' }}>{lockedPlayerInfo?.name}</Text> bu maçta {lockedPlayerInfo?.reason}.
              {'\n\n'}
              Sadece maçta oynayan oyuncular (ilk 11 + sonradan oyuna giren) değerlendirilebilir.
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.lockPopupCloseBtn}
              onPress={() => setLockedPlayerInfo(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.lockPopupCloseBtnText}>Anladım</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 👁️ İZLEME MODU POPUP - Birleşik (Kırmızı izleme modu + 24 saat kuralı) */}
      <Modal
        visible={showViewOnlyPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewOnlyPopup(false)}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => setShowViewOnlyPopup(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.lockPopupContainer}>
            {/* Icon */}
            <View style={[styles.lockPopupIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="eye-off" size={32} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={[styles.lockPopupTitle, { color: '#EF4444' }]}>
              İzleme Modu
            </Text>

            {/* Description */}
            <Text style={styles.lockPopupDesc}>
              <Text style={{ fontWeight: '700', color: '#EF4444' }}>Kadro tahmini yapmadığınız</Text> için bu maç için değerlendirme yapamazsınız.
              {'\n\n'}
              Topluluk puanlarını görüntüleyebilir ancak kendi değerlendirmenizi yapamazsınız.
            </Text>

            {/* 24 Saat Kuralı Info Card */}
            <View style={styles.viewOnlyRuleCard}>
              <View style={styles.viewOnlyRuleHeader}>
                <Ionicons name="time-outline" size={18} color="#10B981" />
                <Text style={styles.viewOnlyRuleTitle}>Değerlendirme Kuralı</Text>
              </View>
              <Text style={styles.viewOnlyRuleText}>
                Bu maça kadro tahmini yapan kullanıcılar, maç bittikten sonra{' '}
                <Text style={{ fontWeight: '700', color: '#10B981' }}>{ratingTimeInfo.hoursRemaining} saat</Text>{' '}
                boyunca TD ve oyuncuları değerlendirebilir.
              </Text>
            </View>

            {/* Gelecek Maçlar Info Card */}
            <View style={styles.viewOnlyInfoCard}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.viewOnlyInfoText}>
                Gelecek maçlarda değerlendirme yapabilmek için maç başlamadan önce kadro tahmini yapmalısınız.
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.lockPopupCloseBtn}
              onPress={() => setShowViewOnlyPopup(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.lockPopupCloseBtnText}>Anladım, İzlemeye Devam Et</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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

      {/* ✅ KAYDETME ONAY MODAL'I - Kaydet = Kilitle */}
      <Modal
        visible={showSaveConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveConfirmModal(false)}
      >
        <Pressable
          style={styles.savePopupOverlay}
          onPress={() => setShowSaveConfirmModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.savePopupContainer}>
            {/* Icon */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="warning-outline" size={36} color="#F59E0B" />
            </View>
            
            {/* Title */}
            <Text style={[styles.savePopupTitle, { color: '#F59E0B' }]}>
              Değerlendirmeyi Kaydet?
            </Text>
            
            {/* Description */}
            <Text style={styles.savePopupDesc}>
              {saveConfirmType === 'coach' 
                ? 'Teknik direktör değerlendirmeniz kaydedilecek ve artık değiştirilemeyecek.'
                : 'Futbolcu değerlendirmeleriniz kaydedilecek ve artık değiştirilemeyecek.'
              }
            </Text>
            
            <Text style={[styles.savePopupDesc, { color: '#94A3B8', marginTop: 8, fontSize: 11 }]}>
              ⚠️ Bu işlem geri alınamaz. Değerlendirmelerinizi kontrol ettiniz mi?
            </Text>
            
            {/* Buttons */}
            <View style={styles.savePopupBtns}>
              <TouchableOpacity
                style={styles.savePopupBtnCancel}
                onPress={() => setShowSaveConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.savePopupBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.savePopupBtnSave}
                onPress={async () => {
                  setShowSaveConfirmModal(false);
                  if (saveConfirmType === 'coach') {
                    await handleSaveRatings(false, true); // not silent, skipConfirm
                  } else {
                    await handleSavePlayerRatings(false, true); // not silent, skipConfirm
                  }
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.savePopupBtnSaveGradient}
                >
                  <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                  <Text style={styles.savePopupBtnSaveText}>Kaydet ve Kilitle</Text>
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
  
  // ✅ İzleme Modu - Kilit Satırı
  viewOnlyLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 2,
    paddingVertical: 6,
  },
  viewOnlyLockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  
  // ✅ İzleme Modu Popup - 24 Saat Kuralı Kartı
  viewOnlyRuleCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  viewOnlyRuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  viewOnlyRuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  viewOnlyRuleText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
  
  // ✅ İzleme Modu Popup Info Card
  viewOnlyInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    marginBottom: 16, // ✅ Buton ile arasında boşluk
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  viewOnlyInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#94A3B8',
  },
  
  // Eski stiller (kullanılmıyor ama backward compat için kalabilir)
  viewOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  viewOnlyText: {
    flex: 1,
    fontSize: 12,
    color: '#F87171',
    lineHeight: 16,
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
    paddingBottom: 180, // ✅ Bottom navigation bar + içerik için yeterli boşluk
  },
  
  // Oyuncu Değerlendirmesi
  playerRatingContainer: {
    flex: 1,
    padding: 0,
  },
  
  // 📊 YENİ UI - Kategori Kartları
  // 🎯 PLAYER RATING HEADER
  playerRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  playerRatingHeaderLeft: {
    flex: 1,
  },
  playerRatingHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  playerRatingHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  
  // 👤 YATAY OYUNCU KARTLARI - Kadro sekmesi stili
  playerCardsHorizontalContainer: {
    marginBottom: 16,
  },
  playerCardsHorizontalScroll: {
    paddingHorizontal: 4,
    paddingTop: 10,
    gap: 12,
  },
  playerCardMiniWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  playerCardMini: {
    width: 72,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  playerCardMiniSelected: {
    borderColor: '#1FA2A6',
    borderWidth: 2.5,
  },
  playerCardMiniMismatch: {
    opacity: 0.5,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  playerCardMiniDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  playerCardMiniGK: {
    borderColor: '#3B82F6',
  },
  playerCardMiniGradient: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  playerCardMiniDelete: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  playerCardMiniJerseyBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerCardMiniJerseyBadgeGK: {
    backgroundColor: '#C9A44C',
  },
  playerCardMiniNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerCardMiniName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
    width: '100%',
  },
  playerCardMiniBottom: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  playerCardMiniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  playerCardMiniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerCardMiniStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
  },
  playerCardMiniStatusText: {
    fontSize: 8,
    color: '#1FA2A6',
  },
  
  // 📊 SEÇİLİ OYUNCU PANELİ
  selectedPlayerPanel: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)',
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    padding: 14,
  },
  selectedPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  selectedPlayerHeaderJersey: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPlayerHeaderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedPlayerHeaderInfo: {
    flex: 1,
  },
  selectedPlayerHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  selectedPlayerHeaderPos: {
    fontSize: 11,
    color: '#94A3B8',
  },
  selectedPlayerHeaderAvg: {
    alignItems: 'flex-end',
  },
  selectedPlayerHeaderAvgLabel: {
    fontSize: 9,
    color: '#94A3B8',
  },
  selectedPlayerHeaderAvgValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  // 👁️ İzleme Modu - Topluluk Badge
  viewOnlyCommunityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 164, 76, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 76, 0.3)',
  },
  viewOnlyCommunityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9A44C',
  },
  // 🔀 Değerlendirme Modu Toggle
  ratingModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  ratingModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ratingModeBtnActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
  },
  ratingModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  ratingModeBtnTextActive: {
    color: '#1FA2A6',
  },
  
  // ⚡ Hızlı Değerlendirme
  quickRatingContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  quickRatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  quickRatingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  quickRatingButtonsSingle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  quickRatingBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRatingBtnSmallSelected: {
    borderWidth: 2,
  },
  quickRatingBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  selectedPlayerSliderContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedPlayerSliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryCardRatingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryCardRatingText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryCardScores: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  categoryCardScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  categoryCardScoreLabel: {
    fontSize: 10,
  },
  categoryCardScoreValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryCardVoterInfo: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 164, 76, 0.2)',
    alignItems: 'center',
  },
  categoryCardVoterText: {
    fontSize: 8,
    color: '#C9A44C',
    fontWeight: '500',
  },
  selectPlayerPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  selectPlayerPromptText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // ✅ Değerlendirilen Oyuncular Listesi
  ratedPlayersSection: {
    marginTop: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  ratedPlayersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  ratedPlayersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  ratedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  ratedPlayerJersey: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratedPlayerNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ratedPlayerInfo: {
    flex: 1,
  },
  ratedPlayerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  ratedPlayerPos: {
    fontSize: 10,
    color: '#94A3B8',
  },
  ratedPlayerScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratedPlayerScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  categoryCardsContainer: {
    marginBottom: 16,
  },
  categoryCardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  categoryCardsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    display: 'none',
  },
  categoryToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 8,
    padding: 2,
    flex: 1,
  },
  categoryToggleContainerLeft: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 42, 36, 0.7)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  categoryToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryToggleBtnActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
  },
  categoryToggleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryToggleEmoji: {
    fontSize: 18,
  },
  categoryToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryToggleBtnTextActive: {
    color: '#1FA2A6',
  },
  categoryLockBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  categoryCardsScroll: {
    paddingRight: 16,
    gap: 6,
  },
  categoryCard: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderRadius: 12,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  categoryCardFixed: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderWidth: 2,
  },
  categoryCardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryCardEmojiLarge: {
    fontSize: 26,
    marginBottom: 6,
  },
  categoryCardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  categoryCardTitleFixed: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  categoryCardApiBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 4,
  },
  categoryCardApiText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#10B981',
  },
  
  // 📋 Oyuncu Listesi
  playerListContainer: {
    backgroundColor: 'rgba(15, 42, 36, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.1)',
  },
  playerListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.1)',
  },
  playerListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  playerListHeaderRight: {
    flexDirection: 'row',
    gap: 24,
  },
  playerListApiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  playerListUserLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  playerListScroll: {
    maxHeight: 320,
  },
  playerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.05)',
    gap: 8,
  },
  playerListItem2Row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.08)',
  },
  playerListRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  playerListRow2: {
    paddingLeft: 38,
  },
  playerListScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  playerListApiLabel2: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 2,
  },
  playerListUserScore: {
    alignItems: 'center',
  },
  playerListUserLabel2: {
    fontSize: 8,
    color: '#1FA2A6',
    fontWeight: '500',
    marginBottom: 2,
  },
  playerListUserScoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerListItemSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.12)',
    borderRadius: 8,
  },
  playerListItemDisabled: {
    opacity: 0.6,
  },
  playerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  playerGroupBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playerGroupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  playerGroupLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  playerListJersey: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerListJerseyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerListInfo: {
    flex: 1,
    minWidth: 60,
  },
  playerListName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  playerListPosition: {
    fontSize: 9,
    color: '#64748B',
  },
  playerListApiScore: {
    alignItems: 'center',
  },
  playerListApiScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  playerListApiScoreTextOld: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  playerListSliderContainer: {
    flex: 1,
    maxWidth: 120,
  },
  
  // 🦶 Seçili Oyuncu Footer
  // 👔 TD KAYDET FOOTER
  coachSaveFooter: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coachSaveFooterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  coachSaveInfo: {
    alignItems: 'flex-start',
  },
  coachSaveLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  coachSaveScore: {
    fontSize: 22,
    fontWeight: '700',
  },
  coachSaveButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  coachSaveBtnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  coachSaveBtnCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  coachSaveBtnSave: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  coachSaveBtnSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  coachSaveBtnSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // ⚽ OYUNCU KAYDET FOOTER
  selectedPlayerFooter: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedPlayerFooterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  selectedPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedPlayerJersey: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPlayerJerseyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  selectedPlayerAvg: {
    fontSize: 11,
    color: '#1FA2A6',
    fontWeight: '500',
  },
  selectedPlayerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedPlayerBtnCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  selectedPlayerBtnCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  selectedPlayerBtnSave: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedPlayerBtnSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedPlayerBtnSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  coachHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  coachHeaderLeft: {
    flex: 1,
  },
  coachLockBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'left',
    marginBottom: 0,
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
  scoreColumnDisabled: {
    opacity: 0.6,
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
  scoreCircleDisabled: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 55,
    borderWidth: 6,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  scoreTextDisabled: {
    fontSize: 32,
    fontWeight: '700',
    color: '#64748B',
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
  // Yarım puan doluluk göstergesi
  halfFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
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

  // 🔒 LOCK POPUP STYLES
  lockPopupContainer: {
    backgroundColor: '#1E3A3A',
    borderRadius: 20,
    padding: 24,
    width: width * 0.88,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
  },
  lockPopupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockPopupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockPopupDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  lockPopupInfoCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    width: '100%',
  },
  lockPopupInfoCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
  },
  lockPopupInfoCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 6,
    textAlign: 'center',
  },
  lockPopupInfoCardDesc: {
    fontSize: 9,
    color: '#7A9A94',
    marginTop: 2,
    textAlign: 'center',
  },
  lockPopupCloseBtn: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
  },
  lockPopupCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1FA2A6',
  },

  // 🗑️ DELETE CONFIRM POPUP STYLES
  deleteConfirmContainer: {
    backgroundColor: '#1E3A3A', // ✅ Design System
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360, // ✅ STANDART popup genişliği
    marginHorizontal: 16,
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
