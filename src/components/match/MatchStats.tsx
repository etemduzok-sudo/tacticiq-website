// MatchStatsScreen.tsx - Maç İstatistikleri + Oyuncu İstatistikleri (canlı veri API ile)
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { BRAND, DARK_MODE, COLORS } from '../../theme/theme';
import { isMockTestMatch, getMockMatchStatistics, getMockPlayerStatistics } from '../../data/mockTestData';
import { PITCH_LAYOUT } from '../../config/constants';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Isı haritası saha boyutları - YATAY görünüm (kuş bakışı)
// Kadro/Tahmin dikey saha kullanıyor, ısı haritası yatay (90 derece döndürülmüş)
// Gerçek futbol sahası oranı: ~105m x 68m = 1.54:1 (genişlik > yükseklik)
// Yatay saha: genişlik / yükseklik ≈ 1.54
const HEATMAP_FIELD_RATIO = 1.54; // Genişlik / Yükseklik
const HEATMAP_FIELD_WIDTH = 350;
const HEATMAP_FIELD_HEIGHT = Math.round(HEATMAP_FIELD_WIDTH / HEATMAP_FIELD_RATIO); // ~227

// API'den gelen istatistik tipi
interface ApiMatchStat {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

// Gösterim için: label + sayısal değerler (bar için)
interface DisplayStat {
  label: string;
  home: number;
  away: number;
  homeDisplay: string | number;
  awayDisplay: string | number;
}

const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Topla Oynama (%)',
  'Total Shots': 'Toplam Şut',
  'Shots on Goal': 'İsabetli Şut',
  // 'Shots off Goal' ve 'Blocked Shots' kullanıcı isteği ile kaldırıldı
  'Corner Kicks': 'Korner',
  'Offsides': 'Ofsayt',
  'Fouls': 'Faul',
  'Yellow Cards': 'Sarı Kart',
  'Red Cards': 'Kırmızı Kart',
  'Goalkeeper Saves': 'Kaleci Kurtarışı',
  'Total Passes': 'Toplam Pas',
  'Passes Accurate': 'İsabetli Pas',
  'Passes %': 'Pas İsabeti (%)',
  'Pass Accuracy': 'Pas İsabeti (%)',
  'expected_goals': 'Gol Beklentisi (xG)', // xG eklendi
};

// ═══════════════════════════════════════════════════════════════════
// xG (Expected Goals) - API'den gelen değeri kullan, yoksa hesapla
// ═══════════════════════════════════════════════════════════════════
function calculateXG(stats: DisplayStat[]): { home: number; away: number } {
  const getStat = (label: string): { home: number; away: number } => {
    const found = stats.find(s => s.label.toLowerCase().includes(label.toLowerCase()));
    return found ? { home: found.home, away: found.away } : { home: 0, away: 0 };
  };
  
  // ✅ Önce API'den gelen xG değerini ara
  const xgStat = stats.find(s => 
    s.label.toLowerCase().includes('xg') || 
    s.label.toLowerCase().includes('gol beklentisi') ||
    s.label.toLowerCase().includes('expected')
  );
  
  // API'den xG geldiyse onu kullan
  if (xgStat && (xgStat.home > 0 || xgStat.away > 0)) {
    return {
      home: xgStat.home,
      away: xgStat.away,
    };
  }
  
  // API'den gelmediyse hesapla (fallback)
  const shotsOnGoal = getStat('İsabetli Şut');
  const totalShots = getStat('Toplam Şut');
  const corners = getStat('Korner');
  
  // xG formülü: İsabetli şut ağırlıklı + toplam şut + korner katkısı
  const homeXG = (shotsOnGoal.home * 0.35) + (totalShots.home * 0.08) + (corners.home * 0.024);
  const awayXG = (shotsOnGoal.away * 0.35) + (totalShots.away * 0.08) + (corners.away * 0.024);
  
  return {
    home: Math.round(homeXG * 100) / 100,
    away: Math.round(awayXG * 100) / 100,
  };
}

interface MatchStatsScreenProps {
  matchData: any;
  matchId?: string;
  favoriteTeamIds?: number[];
  events?: any[]; // ✅ Substitution bilgileri için event'ler
  /** Canlı maçta parent'ın her 15 sn çektiği güncel istatistikler - varsa bunları göster */
  liveStatistics?: any;
  /** Maç canlı mı - canlıysa kendi polling'ini de çalıştır */
  isMatchLive?: boolean;
}

// ✅ Oyuncu giriş/çıkış bilgisi için helper
interface SubstitutionInfo {
  playerId: number;
  playerName: string;
  minuteIn?: number;   // Oyuna girdiği dakika (yedekten giren)
  minuteOut?: number;  // Oyundan çıktığı dakika (değişen)
  replacedBy?: string; // Yerine kim girdi
  replacedFor?: string; // Kimin yerine girdi
}

// Canlı/API yoksa kullanılacak varsayılan veri
const defaultDetailedStats: DisplayStat[] = [
  { label: 'Topla Oynama (%)', home: 58, away: 42, homeDisplay: 58, awayDisplay: 42 },
  { label: 'Toplam Şut', home: 12, away: 8, homeDisplay: 12, awayDisplay: 8 },
  { label: 'İsabetli Şut', home: 5, away: 3, homeDisplay: 5, awayDisplay: 3 },
  { label: 'Korner', home: 6, away: 4, homeDisplay: 6, awayDisplay: 4 },
  { label: 'Ofsayt', home: 3, away: 5, homeDisplay: 3, awayDisplay: 5 },
  { label: 'Pas İsabeti (%)', home: 86, away: 81, homeDisplay: 86, awayDisplay: 81 },
  { label: 'Toplam Pas', home: 412, away: 298, homeDisplay: 412, awayDisplay: 298 },
  { label: 'Faul', home: 8, away: 11, homeDisplay: 8, awayDisplay: 11 },
  { label: 'Sarı Kart', home: 2, away: 3, homeDisplay: 2, awayDisplay: 3 },
  { label: 'Kırmızı Kart', home: 0, away: 0, homeDisplay: 0, awayDisplay: 0 },
  { label: 'Kaleci Kurtarışı', home: 3, away: 4, homeDisplay: 3, awayDisplay: 4 },
];

function parseStatValue(v: number | string | null): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/%/g, ''));
  return isNaN(n) ? 0 : n;
}

function apiStatsToDisplay(stats: ApiMatchStat[]): DisplayStat[] {
  return stats.map((s) => {
    const homeNum = parseStatValue(s.home);
    const awayNum = parseStatValue(s.away);
    const label = STAT_LABELS[s.type] || s.type;
    return {
      label,
      home: homeNum,
      away: awayNum,
      homeDisplay: s.home ?? '-',
      awayDisplay: s.away ?? '-',
    };
  }).filter((d) => d.label);
}

function getStatIconForLabel(label: string): { icon: string; color: string } {
  const l = label.toLowerCase();
  if (l.includes('xg') || l.includes('gol beklentisi') || l.includes('expected')) return { icon: 'analytics', color: '#22D3EE' };
  if (l.includes('topla oynama') || l.includes('possession')) return { icon: 'pie-chart', color: '#8B5CF6' };
  if (l.includes('isabetli şut') || l.includes('shots on')) return { icon: 'checkmark-circle', color: '#10B981' };
  if (l.includes('şut')) return { icon: 'locate', color: '#3B82F6' };
  if (l.includes('korner')) return { icon: 'flag', color: '#F59E0B' };
  if (l.includes('ofsayt')) return { icon: 'hand-left', color: '#EC4899' };
  if (l.includes('faul')) return { icon: 'warning', color: '#F97316' };
  if (l.includes('sarı')) return { icon: 'card', color: '#EAB308' };
  if (l.includes('kırmızı')) return { icon: 'card', color: '#DC2626' };
  if (l.includes('kart')) return { icon: 'card', color: '#EAB308' };
  if (l.includes('kurtarış') || l.includes('save')) return { icon: 'hand-right', color: '#06B6D4' };
  if (l.includes('pas')) return { icon: 'arrow-forward', color: '#14B8A6' };
  if (l.includes('gol')) return { icon: 'football', color: '#22C55E' };
  return { icon: 'stats-chart', color: '#7A9A94' };
}

const topPlayers = {
  home: [
    {
      name: 'Fernando Muslera',
      number: 25,
      position: 'GK',
      rating: 7.5,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      shotsInsideBox: 0,
      totalPasses: 28,
      passesCompleted: 22,
      passAccuracy: 79,
      keyPasses: 0,
      longPasses: 8,
      dribbleAttempts: 0,
      dribbleSuccess: 0,
      dispossessed: 0,
      tackles: 0,
      duelsTotal: 2,
      duelsWon: 1,
      aerialDuels: 2,
      aerialWon: 2,
      // Ek detaylar
      blocks: 0,
      interceptions: 0,
      foulsDrawn: 0,
      foulsCommitted: 0,
      yellowCards: 0,
      redCards: 0,
      penaltyWon: 0,
      penaltyScored: 0,
      penaltyMissed: 0,
      // Kaleci özel istatistikler
      isGoalkeeper: true,
      saves: 5,
      goalsAgainst: 2,
      penaltySaved: 1, // API: penalty.saved
    },
    {
      name: 'Mauro Icardi',
      number: 9,
      position: 'FW',
      rating: 8.7,
      minutesPlayed: 67,
      goals: 2,
      assists: 1,
      shots: 5,
      shotsOnTarget: 3,
      shotsInsideBox: 4,
      totalPasses: 23,
      passesCompleted: 20,
      passAccuracy: 87,
      keyPasses: 2,
      longPasses: 3,
      dribbleAttempts: 8,
      dribbleSuccess: 6,
      dispossessed: 2,
      tackles: 0,
      duelsTotal: 12,
      duelsWon: 8,
      aerialDuels: 5,
      aerialWon: 3,
      // Ek detaylar
      blocks: 0,
      interceptions: 0,
      foulsDrawn: 3,
      foulsCommitted: 1,
      yellowCards: 0,
      redCards: 0,
      penaltyWon: 1,
      penaltyScored: 1,
      penaltyMissed: 0,
    },
    {
      name: 'Wilfried Zaha',
      number: 14,
      position: 'LW',
      rating: 8.3,
      minutesPlayed: 90,
      goals: 1,
      assists: 2,
      shots: 4,
      shotsOnTarget: 2,
      shotsInsideBox: 3,
      totalPasses: 45,
      passesCompleted: 38,
      passAccuracy: 84,
      keyPasses: 4,
      longPasses: 2,
      dribbleAttempts: 12,
      dribbleSuccess: 9,
      dispossessed: 3,
      tackles: 2,
      duelsTotal: 15,
      duelsWon: 11,
      aerialDuels: 3,
      aerialWon: 2,
      // Ek detaylar
      blocks: 1,
      interceptions: 2,
      foulsDrawn: 4,
      foulsCommitted: 2,
      yellowCards: 1,
      redCards: 0,
      penaltyWon: 0,
      penaltyScored: 0,
      penaltyMissed: 0,
    },
  ],
  away: [
    {
      name: 'Edin Dzeko',
      number: 9,
      position: 'ST',
      rating: 7.8,
      minutesPlayed: 90,
      goals: 1,
      assists: 0,
      shots: 6,
      shotsOnTarget: 2,
      shotsInsideBox: 4,
      totalPasses: 18,
      passesCompleted: 14,
      passAccuracy: 78,
      keyPasses: 1,
      longPasses: 2,
      dribbleAttempts: 4,
      dribbleSuccess: 2,
      dispossessed: 3,
      // Ek detaylar
      blocks: 0,
      interceptions: 1,
      foulsDrawn: 2,
      foulsCommitted: 3,
      yellowCards: 1,
      redCards: 0,
      penaltyWon: 0,
      penaltyScored: 0,
      penaltyMissed: 0,
      tackles: 1,
      duelsTotal: 14,
      duelsWon: 8,
      aerialDuels: 8,
      aerialWon: 5,
    },
    {
      name: 'Dominik Livakovic',
      number: 1,
      position: 'GK',
      rating: 7.2,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      shots: 0,
      shotsOnTarget: 0,
      shotsInsideBox: 0,
      totalPasses: 24,
      passesCompleted: 19,
      passAccuracy: 79,
      keyPasses: 0,
      longPasses: 6,
      dribbleAttempts: 0,
      dribbleSuccess: 0,
      dispossessed: 0,
      tackles: 0,
      duelsTotal: 3,
      duelsWon: 2,
      aerialDuels: 3,
      aerialWon: 3,
      // Ek detaylar
      blocks: 0,
      interceptions: 0,
      foulsDrawn: 0,
      foulsCommitted: 1,
      yellowCards: 0,
      redCards: 0,
      penaltyWon: 0,
      penaltyScored: 0,
      penaltyMissed: 0,
      // Kaleci özel istatistikler
      isGoalkeeper: true,
      saves: 4,
      goalsAgainst: 3,
      penaltySaved: 0, // API: penalty.saved
    },
  ],
};

// Maç başlamadı mı kontrolü
const NOT_STARTED_STATUSES = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];

// ✅ Oyuncu istatistikleri tipi (API'den gelen)
interface PlayerStats {
  id: number;
  name: string;
  photo?: string;
  number: number;
  position: string;
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  shotsInsideBox: number;
  totalPasses: number;
  passesCompleted: number;
  passAccuracy: number;
  keyPasses: number;
  longPasses: number;
  dribbleAttempts: number;
  dribbleSuccess: number;
  dispossessed: number;
  tackles: number;
  blocks: number;
  interceptions: number;
  duelsTotal: number;
  duelsWon: number;
  aerialDuels: number;
  aerialWon: number;
  foulsDrawn: number;
  foulsCommitted: number;
  yellowCards: number;
  redCards: number;
  penaltyWon: number;
  penaltyScored: number;
  penaltyMissed: number;
  penaltySaved?: number;
  isGoalkeeper: boolean;
  saves: number;
  goalsAgainst: number;
  savePercentage?: number;
  teamId?: number;
  teamName?: string;
}

export const MatchStats: React.FC<MatchStatsScreenProps> = ({
  matchData,
  matchId,
  favoriteTeamIds = [],
  events = [],
  liveStatistics,
  isMatchLive = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;

  // ✅ Substitution bilgilerini parse et
  const substitutionMap = useMemo(() => {
    const map: Record<number, SubstitutionInfo> = {};
    
    if (!events || events.length === 0) return map;
    
    events.forEach((event: any) => {
      if (event.type === 'subst' || event.type === 'Subst' || 
          event.detail?.toLowerCase().includes('substitution')) {
        const minute = event.time?.elapsed || event.minute || 0;
        
        // Çıkan oyuncu
        if (event.player?.id) {
          map[event.player.id] = {
            playerId: event.player.id,
            playerName: event.player.name,
            minuteOut: minute,
            replacedBy: event.assist?.name || '',
          };
        }
        
        // Giren oyuncu
        if (event.assist?.id) {
          map[event.assist.id] = {
            playerId: event.assist.id,
            playerName: event.assist.name,
            minuteIn: minute,
            replacedFor: event.player?.name || '',
          };
        }
      }
    });
    
    console.log('🔄 [MatchStats] Substitution map:', Object.keys(map).length, 'oyuncu');
    return map;
  }, [events]);
  // ✅ Debug: matchData yapısını logla
  console.log('📊 [MatchStats] RENDER - matchData:', {
    id: matchId,
    status: matchData?.status,
    isLive: matchData?.isLive,
    minute: matchData?.minute,
    fixtureStatus: matchData?.fixture?.status,
  });
  
  const [activeTab, setActiveTab] = useState<'match' | 'players'>('match');
  const [matchStats, setMatchStats] = useState<DisplayStat[]>(defaultDetailedStats);
  // ✅ Oyuncu kartları açılır/kapanır state
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  // ✅ API'den gelen oyuncu istatistikleri
  const [playerStats, setPlayerStats] = useState<{ home: PlayerStats[]; away: PlayerStats[] }>({ home: [], away: [] });
  const [playersLoading, setPlayersLoading] = useState(false);
  
  // ✅ API'den gelen ısı haritası verileri
  interface HeatmapZones {
    defense: number;
    midfield: number;
    attack: number;
    leftFlank: number;
    center: number;
    rightFlank: number;
  }
  interface HeatmapPoint {
    x: number;
    y: number;
    intensity: number;
    type: string; // 'position' | 'pass' | 'shot' | 'tackle'
  }
  interface PlayerHeatmapData {
    playerId: number;
    playerName: string;
    position: string;
    points: HeatmapPoint[];
    zones: {
      defenseLeft: number;
      defenseCenter: number;
      defenseRight: number;
      midfieldLeft: number;
      midfieldCenter: number;
      midfieldRight: number;
      attackLeft: number;
      attackCenter: number;
      attackRight: number;
    };
  }
  const [heatmapData, setHeatmapData] = useState<{
    home: { teamName: string; aggregatedZones: HeatmapZones; players?: PlayerHeatmapData[] } | null;
    away: { teamName: string; aggregatedZones: HeatmapZones; players?: PlayerHeatmapData[] } | null;
  }>({ home: null, away: null });
  
  const togglePlayerExpand = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };
  const [statsLoading, setStatsLoading] = useState(!!matchId);
  
  // ✅ Maç durumu kontrolü
  // matchData.status direkt string olarak MatchDetail'dan geliyor
  const matchStatus = typeof matchData?.status === 'string' 
    ? matchData.status 
    : (matchData?.fixture?.status?.short || matchData?.status?.short || matchData?.statusShort || '');
  const fixtureId = matchId ? parseInt(matchId, 10) : null;
  
  // ✅ Canlı maç durumlarını tanımla
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'];
  const isLiveStatus = LIVE_STATUSES.includes(matchStatus);
  
  console.log('📊 [MatchStats] matchStatus:', matchStatus, 'isLive:', matchData?.isLive, 'isLiveStatus:', isLiveStatus);
  
  // ✅ Mock maçlarda istatistik varsa göster (maç canlı demektir)
  const hasMockStats = fixtureId ? isMockTestMatch(fixtureId) && getMockMatchStatistics(fixtureId) !== null : false;
  
  // ✅ Canlı maç kontrolü - matchData.isLive veya canlı status varsa maç başlamış demektir
  // NOT: Boş status + isLive=true = canlı maç (cache stale olabilir)
  const isMatchNotStarted = !hasMockStats && !matchData?.isLive && !isLiveStatus && (NOT_STARTED_STATUSES.includes(matchStatus) || matchStatus === '');

  // ✅ CANLI İSTATİSTİK: Parent (MatchDetail) her 15 sn çekiyor; gelen liveStatistics ile maç istatistiklerini güncelle
  useEffect(() => {
    if (!liveStatistics || !isLiveStatus) return;
    const rawData = Array.isArray(liveStatistics) ? liveStatistics : (liveStatistics?.data ?? liveStatistics?.statistics);
    if (!rawData || !Array.isArray(rawData) || rawData.length < 2) return;
    const homeStats = rawData[0]?.statistics || [];
    const awayStats = rawData[1]?.statistics || [];
    const mergedStats: ApiMatchStat[] = [];
    const statTypes = new Set([...homeStats.map((s: any) => s.type), ...awayStats.map((s: any) => s.type)]);
    statTypes.forEach((type: string) => {
      const homeStat = homeStats.find((s: any) => s.type === type);
      const awayStat = awayStats.find((s: any) => s.type === type);
      mergedStats.push({
        type,
        home: homeStat?.value ?? null,
        away: awayStat?.value ?? null,
      });
    });
    if (mergedStats.length > 0) {
      setMatchStats(apiStatsToDisplay(mergedStats));
      console.log('📊 [MatchStats] Canlı maç istatistikleri güncellendi (parent)', mergedStats.length);
    }
  }, [liveStatistics, isLiveStatus]);

  useEffect(() => {
    if (!matchId) return;
    const id = parseInt(matchId, 10);
    if (isNaN(id)) {
      setStatsLoading(false);
      return;
    }
    
    // ✅ Mock maç kontrolü
    if (isMockTestMatch(id)) {
      const mockStats = getMockMatchStatistics(id);
      if (mockStats) {
        setMatchStats(apiStatsToDisplay(mockStats));
        setStatsLoading(false);
        console.log('📊 [MatchStats] Mock maç istatistikleri yüklendi:', id);
        return;
      }
    }
    
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        // Canlı maçta ilk yüklemede de refresh=1 ile taze veri al
        const response = await api.matches.getMatchStatistics(id, !!isLiveStatus);
        if (cancelled) return;
        
        // ✅ API response.data içinde takım bazlı istatistikler döner
        // Her takım için: { team: {...}, statistics: [{type, value}, ...] }
        // Biz bunu birleştirip home/away formatına çeviriyoruz
        const rawData = response?.data || response?.statistics;
        
        if (rawData && Array.isArray(rawData) && rawData.length >= 2) {
          // API format: [{team: {...}, statistics: [...]}, {team: {...}, statistics: [...]}]
          const homeStats = rawData[0]?.statistics || [];
          const awayStats = rawData[1]?.statistics || [];
          
          // İstatistikleri birleştir
          const mergedStats: ApiMatchStat[] = [];
          const statTypes = new Set([
            ...homeStats.map((s: any) => s.type),
            ...awayStats.map((s: any) => s.type)
          ]);
          
          statTypes.forEach(type => {
            const homeStat = homeStats.find((s: any) => s.type === type);
            const awayStat = awayStats.find((s: any) => s.type === type);
            mergedStats.push({
              type,
              home: homeStat?.value ?? null,
              away: awayStat?.value ?? null,
            });
          });
          
          console.log('📊 [MatchStats] API istatistikleri yüklendi:', { 
            matchId: id, 
            statCount: mergedStats.length,
            sample: mergedStats.slice(0, 3)
          });
          
          setMatchStats(apiStatsToDisplay(mergedStats));
        } else if (response?.statistics && Array.isArray(response.statistics)) {
          // Eski format desteği
          setMatchStats(apiStatsToDisplay(response.statistics));
        }
      } catch (_e) {
        console.log('📊 [MatchStats] API hatası, varsayılan veriler kullanılıyor:', _e);
        if (!cancelled) setMatchStats(defaultDetailedStats);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matchId, isLiveStatus]);

  // ✅ CANLI MAÇ: Maç ve oyuncu istatistiklerini 10 saniyede bir tazele (anlık veri, refresh=1 ile API'den)
  useEffect(() => {
    if (!matchId || !isLiveStatus) return;
    const id = parseInt(matchId, 10);
    if (isNaN(id)) return;
    if (isMockTestMatch(id)) return;

    let cancelled = false;

    const fetchLiveStats = async () => {
      if (cancelled) return;
      try {
        const [statsRes, playersRes] = await Promise.all([
          api.matches.getMatchStatistics(id, true), // refresh=1: her seferinde taze veri
          api.matches.getMatchPlayers(id),
        ]);
        if (cancelled) return;

        const rawData = statsRes?.data ?? statsRes?.statistics;
        if (rawData && Array.isArray(rawData) && rawData.length >= 2) {
          const homeStats = rawData[0]?.statistics || [];
          const awayStats = rawData[1]?.statistics || [];
          const mergedStats: ApiMatchStat[] = [];
          const statTypes = new Set([
            ...homeStats.map((s: any) => s.type),
            ...awayStats.map((s: any) => s.type),
          ]);
          statTypes.forEach((type: string) => {
            const homeStat = homeStats.find((s: any) => s.type === type);
            const awayStat = awayStats.find((s: any) => s.type === type);
            mergedStats.push({
              type,
              home: homeStat?.value ?? null,
              away: awayStat?.value ?? null,
            });
          });
          if (mergedStats.length > 0) setMatchStats(apiStatsToDisplay(mergedStats));
        }

        const rawPlayers = playersRes?.data;
        if (rawPlayers?.home && rawPlayers?.away) {
          const filterPlayed = (players: any[]) =>
            players.filter((p: any) => (p.minutesPlayed && p.minutesPlayed > 0) || (p.rating && p.rating > 0));
          setPlayerStats({
            home: filterPlayed(rawPlayers.home || []),
            away: filterPlayed(rawPlayers.away || []),
          });
        }
      } catch (_e) {
        // sessiz
      }
    };

    fetchLiveStats(); // İlk çağrı hemen
    const interval = setInterval(fetchLiveStats, 10000);
    console.log('📊 [MatchStats] Canlı maç istatistik polling başlatıldı (10s)');
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matchId, isLiveStatus]);

  // ✅ Oyuncu istatistiklerini API'den çek
  useEffect(() => {
    if (!matchId) return;
    const id = parseInt(matchId, 10);
    if (isNaN(id)) return;
    
    // Mock maç kontrolü
    if (isMockTestMatch(id)) {
      const mockPlayerStats = getMockPlayerStatistics(id);
      if (mockPlayerStats) {
        setPlayerStats(mockPlayerStats as any);
        console.log('⭐ [MatchStats] Mock oyuncu istatistikleri yüklendi:', id);
        return;
      }
    }
    
    let cancelled = false;
    (async () => {
      try {
        setPlayersLoading(true);
        const response = await api.matches.getMatchPlayers(id);
        if (cancelled) return;
        
        // API format: { data: { home: [...], away: [...] } }
        const rawData = response?.data;
        
        if (rawData?.home && rawData?.away) {
          // Sadece oynayan oyuncuları filtrele (minutesPlayed > 0 veya rating > 0)
          const filterPlayed = (players: any[]) => 
            players.filter((p: any) => (p.minutesPlayed && p.minutesPlayed > 0) || (p.rating && p.rating > 0));
          
          const homePlayers = filterPlayed(rawData.home || []);
          const awayPlayers = filterPlayed(rawData.away || []);
          
          console.log('⭐ [MatchStats] Oyuncu istatistikleri yüklendi:', { 
            matchId: id, 
            homeCount: homePlayers.length,
            awayCount: awayPlayers.length,
            sampleHome: homePlayers[0]?.name
          });
          
          setPlayerStats({
            home: homePlayers,
            away: awayPlayers
          });
        }
      } catch (_e) {
        console.log('⭐ [MatchStats] Oyuncu API hatası:', _e);
        // Hata durumunda boş bırak; yanlış veri göstermek güven kaybına yol açar
        setPlayerStats({ home: [], away: [] });
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matchId]);

  // ✅ Isı haritası verilerini API'den çek
  useEffect(() => {
    if (!matchId) return;
    const id = parseInt(matchId, 10);
    if (isNaN(id)) return;
    
    // Mock maçlar için skip
    if (isMockTestMatch(id)) return;
    
    let cancelled = false;
    
    const fetchHeatmaps = async () => {
      try {
        const response = await api.matches.getMatchHeatmaps(id);
        if (cancelled) return;
        
        if (response?.success && response?.data) {
          setHeatmapData({
            home: response.data.home || null,
            away: response.data.away || null,
          });
          console.log('🔥 [MatchStats] Isı haritası verileri yüklendi:', {
            homeZones: response.data.home?.aggregatedZones,
            awayZones: response.data.away?.aggregatedZones,
            homePlayersCount: response.data.home?.players?.length,
            awayPlayersCount: response.data.away?.players?.length,
          });
        }
      } catch (_e) {
        console.log('🔥 [MatchStats] Isı haritası API hatası:', _e);
      }
    };
    
    // İlk yükleme
    fetchHeatmaps();
    
    // ✅ Canlı maçlarda 30 saniyede bir güncelle (ısı haritaları daha az sık güncellenir)
    const matchStatus = matchData?.status || matchData?.fixture?.status?.short || '';
    const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT', 'INT'].includes(matchStatus);
    
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLive) {
      interval = setInterval(fetchHeatmaps, 30000); // 30 saniye
      console.log('🔥 [MatchStats] Canlı ısı haritası güncelleme başlatıldı (30s interval)');
    }
    
    return () => { 
      cancelled = true; 
      if (interval) clearInterval(interval);
    };
  }, [matchId, matchData?.status, matchData?.fixture?.status?.short]);

  // ✅ Maç henüz başlamadıysa - ScrollView kullanmadan sabit konteyner (Canlı sekmesiyle aynı)
  if (isMatchNotStarted) {
    return (
      <SafeAreaView style={[styles.container, isLight && { backgroundColor: themeColors.background }]}>
        {/* Tabs - her zaman göster; açık temada okunaklı */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'match' && styles.tabActive,
              isLight && { backgroundColor: activeTab === 'match' ? 'rgba(31, 162, 166, 0.12)' : themeColors.muted, borderColor: activeTab === 'match' ? BRAND.secondary : themeColors.border },
            ]}
            onPress={() => setActiveTab('match')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'match' && styles.tabTextActive,
              isLight && { color: activeTab === 'match' ? BRAND.secondary : themeColors.foreground },
            ]}>
              📊 Maç İstatistikleri
            </Text>
            {activeTab === 'match' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'players' && styles.tabActive,
              isLight && { backgroundColor: activeTab === 'players' ? 'rgba(31, 162, 166, 0.12)' : themeColors.muted, borderColor: activeTab === 'players' ? BRAND.secondary : themeColors.border },
            ]}
            onPress={() => setActiveTab('players')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'players' && styles.tabTextActive,
              isLight && { color: activeTab === 'players' ? BRAND.secondary : themeColors.foreground },
            ]}>
              ⭐ Oyuncu İstatistikleri
            </Text>
            {activeTab === 'players' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Maç başlamadı bildirimi - açık temada açık kart + koyu metin */}
        <View style={styles.notStartedContainer}>
          <View style={[styles.notStartedCard, isLight && { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons 
                name={activeTab === 'match' ? 'stats-chart-outline' : 'people-outline'} 
                size={48} 
                color={BRAND.accent} 
              />
            </View>
            <Text style={[styles.notStartedTitle, isLight && { color: themeColors.foreground }]}>
              {activeTab === 'match' ? 'Maç İstatistikleri' : 'Oyuncu İstatistikleri'}
            </Text>
            <Text style={[styles.notStartedSubtitle, isLight && { color: themeColors.mutedForeground }]}>
              {activeTab === 'match' 
                ? 'Maç başladığında canlı istatistikler\nburada görünecek'
                : 'Maç başladığında canlı oyuncu performansları\nburada görünecek'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isLight && { backgroundColor: themeColors.background }]}>
      {/* Tabs - açık temada okunaklı */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'match' && styles.tabActive,
            isLight && { backgroundColor: activeTab === 'match' ? 'rgba(31, 162, 166, 0.12)' : themeColors.muted, borderColor: activeTab === 'match' ? BRAND.secondary : themeColors.border },
          ]}
          onPress={() => setActiveTab('match')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'match' && styles.tabTextActive,
            isLight && { color: activeTab === 'match' ? BRAND.secondary : themeColors.foreground },
          ]}>
            📊 Maç İstatistikleri
          </Text>
          {activeTab === 'match' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'players' && styles.tabActive,
            isLight && { backgroundColor: activeTab === 'players' ? 'rgba(31, 162, 166, 0.12)' : themeColors.muted, borderColor: activeTab === 'players' ? BRAND.secondary : themeColors.border },
          ]}
          onPress={() => setActiveTab('players')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'players' && styles.tabTextActive,
            isLight && { color: activeTab === 'players' ? BRAND.secondary : themeColors.foreground },
          ]}>
            ⭐ Oyuncu İstatistikleri
          </Text>
          {activeTab === 'players' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'match' ? (
          // MAÇ İSTATİSTİKLERİ (canlı API verisi veya varsayılan)
          <View style={styles.statsContainer}>
            {statsLoading ? (
              <View style={styles.statsLoadingWrap}>
                <ActivityIndicator size="large" color={BRAND.secondary} />
                <Text style={[styles.statsLoadingText, isLight && { color: themeColors.mutedForeground }]}>Maç istatistikleri yükleniyor...</Text>
              </View>
            ) : (
              <>
                {/* xG (Gol Beklentisi) - Öne Çıkan Kart */}
                {(() => {
                  const xg = calculateXG(matchStats);
                  const homeWins = xg.home > xg.away;
                  const awayWins = xg.away > xg.home;
                  
                  return (
                    <Animated.View
                      entering={isWeb ? undefined : FadeIn.delay(50)}
                      style={styles.xgCard}
                    >
                      <View style={styles.xgHeader}>
                        <View style={styles.xgIconWrap}>
                          <Ionicons name="analytics" size={18} color="#22D3EE" />
                        </View>
                        <Text style={styles.xgTitle}>Gol Beklentisi (xG)</Text>
                        <TouchableOpacity style={styles.xgInfoBtn}>
                          <Ionicons name="information-circle-outline" size={16} color="#7A9A94" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.xgContent}>
                        <View style={[styles.xgValueBox, homeWins && styles.xgValueBoxWinner]}>
                          <Text style={[styles.xgValue, homeWins && styles.xgValueWinner]}>{xg.home.toFixed(2)}</Text>
                          <Text style={styles.xgTeamLabel}>Ev Sahibi</Text>
                        </View>
                        <View style={styles.xgVsContainer}>
                          <Text style={styles.xgVsText}>vs</Text>
                        </View>
                        <View style={[styles.xgValueBox, awayWins && styles.xgValueBoxWinnerAway]}>
                          <Text style={[styles.xgValue, awayWins && styles.xgValueWinnerAway]}>{xg.away.toFixed(2)}</Text>
                          <Text style={styles.xgTeamLabel}>Deplasman</Text>
                        </View>
                      </View>
                      <Text style={styles.xgFormula}>
                        xG = (İsabetli Şut × 0.35) + (Toplam Şut × 0.08) + (Korner × 0.024)
                      </Text>
                    </Animated.View>
                  );
                })()}
                
                {/* Diğer Maç İstatistikleri */}
                {matchStats.map((stat, index) => {
                const total = stat.home + stat.away || 1;
                const homePercent = (stat.home / total) * 100;
                const awayPercent = (stat.away / total) * 100;
                const { icon: iconName, color: iconColor } = getStatIconForLabel(stat.label);

                return (
                  <Animated.View
                    key={`${stat.label}-${index}`}
                    entering={isWeb ? undefined : FadeIn.delay(index * 25)}
                    style={[
                      styles.statRowCard,
                      isLight && { backgroundColor: themeColors.card, borderBottomColor: themeColors.border, borderBottomWidth: 1 },
                    ]}
                  >
                    {/* Üst: Değerler ve Label - açık temada okunaklı */}
                    <View style={styles.statHeader}>
                      <Text style={[
                        styles.statValueText,
                        stat.home > stat.away && styles.statValueTextWinner,
                        isLight && { color: themeColors.foreground },
                        isLight && stat.home > stat.away && { color: '#10B981' },
                      ]}>
                        {stat.homeDisplay}
                      </Text>
                      
                      <View style={styles.statLabelCenter}>
                        <View style={[styles.statIconBg, { backgroundColor: `${iconColor}40` }]}>
                          <Ionicons name={iconName as any} size={16} color={iconColor} />
                        </View>
                        <Text style={[styles.statLabelText, isLight && { color: themeColors.mutedForeground }]}>{stat.label}</Text>
                      </View>
                      
                      <Text style={[
                        styles.statValueText,
                        stat.away > stat.home && styles.statValueTextWinnerAway,
                        isLight && { color: themeColors.foreground },
                        isLight && stat.away > stat.home && { color: '#F59E0B' },
                      ]}>
                        {stat.awayDisplay}
                      </Text>
                    </View>
                    
                    {/* Alt: Progress Bar */}
                    <View style={[styles.progressBarContainer, isLight && { backgroundColor: themeColors.muted }]}>
                      <Animated.View
                        entering={isWeb ? undefined : FadeIn.delay(index * 25 + 80).duration(500)}
                        style={[
                          styles.progressBarHome,
                          { width: `${homePercent}%` },
                          stat.home > stat.away && styles.progressBarHomeHighlight
                        ]}
                      />
                      <Animated.View
                        entering={isWeb ? undefined : FadeIn.delay(index * 25 + 80).duration(500)}
                        style={[
                          styles.progressBarAway,
                          { width: `${awayPercent}%` },
                          stat.away > stat.home && styles.progressBarAwayHighlight
                        ]}
                      />
                    </View>
                  </Animated.View>
                );
              })}
              </>
            )}

            {/* Takım Isı Haritaları - Favori takım önce, alt alta yerleşim */}
            {(() => {
              // Favori takım hangisi? Home mu Away mi?
              const homeTeamId = matchData?.homeId || matchData?.teams?.home?.id;
              const awayTeamId = matchData?.awayId || matchData?.teams?.away?.id;
              const homeName = matchData?.homeName || matchData?.teams?.home?.name || 'Ev Sahibi';
              const awayName = matchData?.awayName || matchData?.teams?.away?.name || 'Deplasman';
              
              const isFavoriteHome = favoriteTeamIds.includes(homeTeamId);
              const isFavoriteAway = favoriteTeamIds.includes(awayTeamId);
              
              // Favori takımı önce göster
              const firstTeam = isFavoriteAway ? { name: awayName, id: awayTeamId, isFavorite: true, isHome: false } 
                              : { name: homeName, id: homeTeamId, isFavorite: isFavoriteHome, isHome: true };
              const secondTeam = isFavoriteAway ? { name: homeName, id: homeTeamId, isFavorite: false, isHome: true }
                               : { name: awayName, id: awayTeamId, isFavorite: false, isHome: false };
              
              // ✅ API'den gelen zone verilerine göre ısı noktaları oluştur
              const renderHeatPoints = (isFavorite: boolean, isHome: boolean) => {
                const color = isFavorite ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)';
                const colorMid = isFavorite ? 'rgba(16, 185, 129, 0.6)' : 'rgba(245, 158, 11, 0.6)';
                const colorLow = isFavorite ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)';
                const hotZone = 'rgba(239, 68, 68, 0.8)';
                
                // Atak yönüne göre (home sağa atar, away sola atar)
                const attackRight = isHome;
                
                // ✅ API'den gelen zone verilerini al
                const zones = isHome ? heatmapData.home?.aggregatedZones : heatmapData.away?.aggregatedZones;
                
                // Zone yüzdelerine göre boyut hesapla (min 12, max 40)
                const calcSize = (percentage: number) => Math.max(12, Math.min(40, 12 + (percentage * 0.5)));
                
                // Varsayılan değerler (API yoksa)
                const defenseSize = zones ? calcSize(zones.defense) : 18;
                const midfieldSize = zones ? calcSize(zones.midfield) : 28;
                const attackSize = zones ? calcSize(zones.attack) : 32;
                const leftFlankSize = zones ? calcSize(zones.leftFlank) : 20;
                const rightFlankSize = zones ? calcSize(zones.rightFlank) : 20;
                
                // Yoğunluğa göre renk seç
                const getZoneColor = (percentage: number) => {
                  if (percentage >= 40) return hotZone;
                  if (percentage >= 30) return color;
                  if (percentage >= 20) return colorMid;
                  return colorLow;
                };
                
                return (
                  <>
                    {/* Orta saha yoğunluk */}
                    <View style={[styles.heatPointNew, { 
                      left: '50%', top: '50%', 
                      width: midfieldSize, height: midfieldSize, borderRadius: midfieldSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.midfield) : colorMid 
                    }]} />
                    
                    {/* Atak bölgesi */}
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '72%' : '28%', top: '50%', 
                      width: attackSize, height: attackSize, borderRadius: attackSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.attack) : color 
                    }]} />
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '68%' : '32%', top: '30%', 
                      width: attackSize * 0.7, height: attackSize * 0.7, borderRadius: attackSize * 0.35, 
                      backgroundColor: zones ? getZoneColor(zones.attack * 0.8) : colorMid 
                    }]} />
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '68%' : '32%', top: '70%', 
                      width: attackSize * 0.7, height: attackSize * 0.7, borderRadius: attackSize * 0.35, 
                      backgroundColor: zones ? getZoneColor(zones.attack * 0.8) : colorMid 
                    }]} />
                    
                    {/* Ceza alanı - atak yoğunluğuna göre renk (veri yoksa yoğun kırmızı) */}
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '85%' : '15%', top: '50%', 
                      width: attackSize * 0.8, height: attackSize * 0.8, borderRadius: attackSize * 0.4, 
                      backgroundColor: zones ? getZoneColor(Math.max(zones.attack, 35)) : hotZone 
                    }]} />
                    
                    {/* Savunma bölgesi */}
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '25%' : '75%', top: '40%', 
                      width: defenseSize, height: defenseSize, borderRadius: defenseSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.defense) : colorLow 
                    }]} />
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '25%' : '75%', top: '60%', 
                      width: defenseSize, height: defenseSize, borderRadius: defenseSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.defense) : colorLow 
                    }]} />
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '18%' : '82%', top: '50%', 
                      width: defenseSize * 1.1, height: defenseSize * 1.1, borderRadius: defenseSize * 0.55, 
                      backgroundColor: zones ? getZoneColor(zones.defense) : colorLow 
                    }]} />
                    
                    {/* Kanat aktiviteleri */}
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '55%' : '45%', top: '15%', 
                      width: leftFlankSize, height: leftFlankSize, borderRadius: leftFlankSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.leftFlank) : colorMid 
                    }]} />
                    <View style={[styles.heatPointNew, { 
                      left: attackRight ? '55%' : '45%', top: '85%', 
                      width: rightFlankSize, height: rightFlankSize, borderRadius: rightFlankSize / 2, 
                      backgroundColor: zones ? getZoneColor(zones.rightFlank) : colorMid 
                    }]} />
                  </>
                );
              };
              
              return (
                <Animated.View
                  entering={isWeb ? undefined : FadeIn.delay(300)}
                  style={styles.teamHeatmapSectionNew}
                >
                  <View style={styles.teamHeatmapHeaderNew}>
                    <Ionicons name="flame" size={20} color="#F59E0B" />
                    <Text style={styles.teamHeatmapTitleNew}>Takım Isı Haritaları</Text>
                  </View>
                  
                  {/* Favori Takım - İlk */}
                  <View style={[styles.heatmapCardNew, firstTeam.isFavorite && styles.heatmapCardFavorite]}>
                    <View style={styles.heatmapCardHeaderNew}>
                      <View style={styles.heatmapTeamInfoNew}>
                        {firstTeam.isFavorite && (
                          <View style={styles.favoriteStarBadge}>
                            <Text style={styles.favoriteStarText}>⭐</Text>
                          </View>
                        )}
                        <Text style={[styles.heatmapTeamNameNew, firstTeam.isFavorite && styles.heatmapTeamNameFavorite]}>
                          {firstTeam.name}
                        </Text>
                      </View>
                      <View style={styles.heatmapAttackDirNew}>
                        {firstTeam.isHome ? (
                          <>
                            <Text style={styles.heatmapAttackTextNew}>Atak</Text>
                            <Ionicons name="arrow-forward" size={14} color={firstTeam.isFavorite ? '#10B981' : '#1FA2A6'} />
                          </>
                        ) : (
                          <>
                            <Ionicons name="arrow-back" size={14} color={firstTeam.isFavorite ? '#10B981' : '#F59E0B'} />
                            <Text style={styles.heatmapAttackTextNew}>Atak</Text>
                          </>
                        )}
                      </View>
                    </View>
                    
                    {/* Detaylı Saha */}
                    <View style={styles.heatmapFieldNew}>
                      {/* Saha çizgileri */}
                      <View style={styles.fieldBorderNew} />
                      
                      {/* Orta çizgi */}
                      <View style={styles.centerLineNew} />
                      
                      {/* Orta daire */}
                      <View style={styles.centerCircleNew} />
                      <View style={styles.centerDotNew} />
                      
                      {/* Sol penaltı alanı */}
                      <View style={styles.penaltyAreaLeftNew} />
                      <View style={styles.goalAreaLeftNew} />
                      <View style={styles.penaltySpotLeftNew} />
                      
                      {/* Sağ penaltı alanı */}
                      <View style={styles.penaltyAreaRightNew} />
                      <View style={styles.goalAreaRightNew} />
                      <View style={styles.penaltySpotRightNew} />
                      
                      {/* Kale çizgileri */}
                      <View style={styles.goalLeftNew} />
                      <View style={styles.goalRightNew} />
                      
                      {/* Isı noktaları */}
                      {renderHeatPoints(firstTeam.isFavorite, firstTeam.isHome)}
                    </View>
                  </View>
                  
                  {/* Rakip Takım - İkinci */}
                  <View style={styles.heatmapCardNew}>
                    <View style={styles.heatmapCardHeaderNew}>
                      <View style={styles.heatmapTeamInfoNew}>
                        <Text style={[styles.heatmapTeamNameNew, { color: '#F59E0B' }]}>
                          {secondTeam.name}
                        </Text>
                      </View>
                      <View style={styles.heatmapAttackDirNew}>
                        {secondTeam.isHome ? (
                          <>
                            <Text style={[styles.heatmapAttackTextNew, { color: '#F59E0B' }]}>Atak</Text>
                            <Ionicons name="arrow-forward" size={14} color="#F59E0B" />
                          </>
                        ) : (
                          <>
                            <Ionicons name="arrow-back" size={14} color="#F59E0B" />
                            <Text style={[styles.heatmapAttackTextNew, { color: '#F59E0B' }]}>Atak</Text>
                          </>
                        )}
                      </View>
                    </View>
                    
                    {/* Detaylı Saha */}
                    <View style={styles.heatmapFieldNew}>
                      {/* Saha çizgileri */}
                      <View style={styles.fieldBorderNew} />
                      
                      {/* Orta çizgi */}
                      <View style={styles.centerLineNew} />
                      
                      {/* Orta daire */}
                      <View style={styles.centerCircleNew} />
                      <View style={styles.centerDotNew} />
                      
                      {/* Sol penaltı alanı */}
                      <View style={styles.penaltyAreaLeftNew} />
                      <View style={styles.goalAreaLeftNew} />
                      <View style={styles.penaltySpotLeftNew} />
                      
                      {/* Sağ penaltı alanı */}
                      <View style={styles.penaltyAreaRightNew} />
                      <View style={styles.goalAreaRightNew} />
                      <View style={styles.penaltySpotRightNew} />
                      
                      {/* Kale çizgileri */}
                      <View style={styles.goalLeftNew} />
                      <View style={styles.goalRightNew} />
                      
                      {/* Isı noktaları */}
                      {renderHeatPoints(false, secondTeam.isHome)}
                    </View>
                  </View>
                  
                  {/* Isı haritası açıklaması */}
                  <View style={styles.heatmapLegendNew}>
                    <View style={styles.legendItemNew}>
                      <View style={[styles.legendDotNew, { backgroundColor: '#EF4444' }]} />
                      <Text style={styles.legendTextNew}>Yoğun Aktivite</Text>
                    </View>
                    <View style={styles.legendItemNew}>
                      <View style={[styles.legendDotNew, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.legendTextNew}>Orta Aktivite</Text>
                    </View>
                    <View style={styles.legendItemNew}>
                      <View style={[styles.legendDotNew, { backgroundColor: 'rgba(148, 163, 184, 0.5)' }]} />
                      <Text style={styles.legendTextNew}>Düşük Aktivite</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })()}
          </View>
        ) : (
          // OYUNCU PERFORMANSLARI - Sadece Favori Takım
          <View style={styles.playersContainerNew}>
            {playersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BRAND.accent} />
                <Text style={styles.loadingText}>Oyuncu istatistikleri yükleniyor...</Text>
              </View>
            ) : (() => {
              // Favori takım hangisi?
              const homeTeamId = matchData?.homeId || matchData?.teams?.home?.id;
              const awayTeamId = matchData?.awayId || matchData?.teams?.away?.id;
              const isFavoriteHome = favoriteTeamIds.includes(homeTeamId);
              const isFavoriteAway = favoriteTeamIds.includes(awayTeamId);
              
              // Favori takımın oyuncularını seç - API'den gelen veriler kullan
              const favoriteTeamName = isFavoriteAway 
                ? (matchData?.awayName || 'Deplasman')
                : (matchData?.homeName || 'Ev Sahibi');
              
              // ✅ Sadece API'den gelen veriyi kullan; anlamsız/yanlış veri göstermek güven kaybına yol açar
              const apiPlayers = isFavoriteAway ? playerStats.away : playerStats.home;
              const rawPlayers = apiPlayers;
              // Veri yoksa yükleniyor/veri yok mesajı göster, asla sahte oyuncu listesi gösterme
              if (rawPlayers.length === 0) {
                return (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="stats-chart-outline" size={48} color={BRAND.accent} style={{ marginBottom: 12 }} />
                    <Text style={styles.loadingText}>Oyuncu istatistikleri henüz mevcut değil.</Text>
                    <Text style={[styles.loadingText, { fontSize: 13, opacity: 0.8, marginTop: 4 }]}>
                      Maç başladıktan sonra veriler güncellenir.
                    </Text>
                  </View>
                );
              }
              // Kaleci her zaman en üstte olsun
              const favoritePlayers = [...rawPlayers].sort((a, b) => {
                if (a.isGoalkeeper && !b.isGoalkeeper) return -1;
                if (!a.isGoalkeeper && b.isGoalkeeper) return 1;
                return 0;
              });
              const teamColor = isFavoriteHome ? '#10B981' : '#F59E0B';
              
              return (
                <>
                  {favoritePlayers.map((player: any, index: number) => {
              // Player ID - API'den gelen id veya fallback olarak number
              const playerId = `player-${player.id || player.number}-${index}`;
              const isExpanded = expandedPlayers.has(playerId);
              const ratingColor = player.rating >= 8 ? '#10B981' : player.rating >= 7 ? '#1FA2A6' : player.rating >= 6 ? '#F59E0B' : '#EF4444';
              
              return (
                <Animated.View
                  key={playerId}
                  entering={isWeb ? undefined : FadeIn.delay(index * 40)}
                  style={styles.playerDropdown}
                >
                  {/* Dropdown Header */}
                  <TouchableOpacity 
                    style={[styles.dropdownHeader, isExpanded && styles.dropdownHeaderActive]}
                    onPress={() => togglePlayerExpand(playerId)}
                    activeOpacity={0.7}
                  >
                    {/* Sol: Numara + İsim + Pozisyon + Giriş/Çıkış */}
                    <View style={styles.playerInfoNew}>
                      <View style={[styles.playerNumberNew, { borderColor: ratingColor }]}>
                        <Text style={styles.playerNumberTextNew}>{player.number}</Text>
                      </View>
                      <View style={styles.playerNameBlock}>
                        <Text style={styles.playerNameNew}>{player.name}</Text>
                        <Text style={styles.playerPosNew}>
                          {player.position} • {player.minutesPlayed}'
                          {/* ✅ Giriş/Çıkış bilgisi */}
                          {substitutionMap[player.id]?.minuteIn && (
                            <Text style={{ color: '#10B981' }}> (↑{substitutionMap[player.id].minuteIn}')</Text>
                          )}
                          {substitutionMap[player.id]?.minuteOut && (
                            <Text style={{ color: '#EF4444' }}> (↓{substitutionMap[player.id].minuteOut}')</Text>
                          )}
                        </Text>
                        {/* ✅ Kimin yerine girdi / yerine kim girdi */}
                        {substitutionMap[player.id]?.replacedFor && (
                          <Text style={[styles.playerPosNew, { color: '#10B981', fontSize: 10 }]}>
                            ↑ {substitutionMap[player.id].replacedFor} yerine
                          </Text>
                        )}
                        {substitutionMap[player.id]?.replacedBy && (
                          <Text style={[styles.playerPosNew, { color: '#EF4444', fontSize: 10 }]}>
                            ↓ {substitutionMap[player.id].replacedBy} girdi
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Sağ: Özet istatistik + Reyting + Chevron */}
                    <View style={styles.playerRightNew}>
                      <View style={styles.quickStatsRow}>
                        {player.goals > 0 && (
                          <View style={styles.quickStatBadge}>
                            <Text style={styles.quickStatBadgeText}>⚽ {player.goals}</Text>
                          </View>
                        )}
                        {player.assists > 0 && (
                          <View style={[styles.quickStatBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                            <Text style={[styles.quickStatBadgeText, { color: '#A78BFA' }]}>👟 {player.assists}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.ratingBadgeNew, { backgroundColor: `${ratingColor}20`, borderColor: ratingColor }]}>
                        <Text style={[styles.ratingTextNew, { color: ratingColor }]}>{player.rating}</Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={isExpanded ? '#10B981' : '#7A9A94'} 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Dropdown Content */}
                  {isExpanded && (
                    <Animated.View entering={FadeIn.duration(250)} style={styles.dropdownContent}>
                      {/* Ana İstatistik Kartları - Kaleci vs Saha Oyuncusu */}
                      <View style={styles.statsGridNew}>
                        {player.isGoalkeeper ? (
                          // KALECİ İSTATİSTİKLERİ - Kaleciye özel metrikler
                          <>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="hand-right" size={18} color="#10B981" />
                              </View>
                              <Text style={styles.statCardValue}>{player.saves || 0}</Text>
                              <Text style={styles.statCardLabel}>Kurtarış</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                                <Ionicons name="stats-chart" size={18} color="#22D3EE" />
                              </View>
                              <Text style={styles.statCardValue}>
                                {typeof player.savePercentage === 'number'
                                  ? player.savePercentage + '%'
                                  : (player.saves || 0) + (player.goalsAgainst || 0) > 0
                                    ? Math.round(((player.saves || 0) / ((player.saves || 0) + (player.goalsAgainst || 0))) * 100) + '%'
                                    : '0%'}
                              </Text>
                              <Text style={styles.statCardLabel}>Kurtarış %</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <Ionicons name="football" size={18} color="#EF4444" />
                              </View>
                              <Text style={styles.statCardValue}>{player.goalsAgainst || 0}</Text>
                              <Text style={styles.statCardLabel}>Gol Yedi</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                                <Ionicons name="shield-checkmark" size={18} color="#8B5CF6" />
                              </View>
                              <Text style={styles.statCardValue}>{player.penaltySaved || 0}</Text>
                              <Text style={styles.statCardLabel}>Penaltı Kurtarış</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                                <Ionicons name="arrow-forward" size={18} color="#14B8A6" />
                              </View>
                              <Text style={styles.statCardValue}>{player.totalPasses || 0}</Text>
                              <Text style={styles.statCardLabel}>Toplam Pas</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                                <Ionicons name="checkmark-circle" size={18} color="#7A9A94" />
                              </View>
                              <Text style={styles.statCardValue}>{player.passAccuracy || 0}%</Text>
                              <Text style={styles.statCardLabel}>Pas İsabeti</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Ionicons name="time" size={18} color="#F59E0B" />
                              </View>
                              <Text style={styles.statCardValue}>{player.minutesPlayed}'</Text>
                              <Text style={styles.statCardLabel}>Dakika</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: (player.redCards || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)' }]}>
                                <Ionicons name="card" size={18} color={(player.redCards || 0) > 0 ? '#EF4444' : '#EAB308'} />
                              </View>
                              <Text style={styles.statCardValue}>{player.yellowCards || 0}/{player.redCards || 0}</Text>
                              <Text style={styles.statCardLabel}>Sarı/Kırmızı</Text>
                            </View>
                            {(player.minutesPlayed > 0 && (player.saves ?? 0) === 0 && (player.goalsAgainst ?? 0) === 0) && (
                              <View style={styles.gkStatsNote}>
                                <Ionicons name="information-circle-outline" size={14} color="#7A9A94" />
                                <Text style={styles.gkStatsNoteText}>Canlı maçta kaleci istatistikleri maç sonuna doğru güncellenir.</Text>
                              </View>
                            )}
                          </>
                        ) : (
                          // SAHA OYUNCUSU İSTATİSTİKLERİ
                          <>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Ionicons name="football" size={18} color="#10B981" />
                              </View>
                              <Text style={styles.statCardValue}>{player.goals}</Text>
                              <Text style={styles.statCardLabel}>Gol</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                                <Ionicons name="git-branch" size={18} color="#8B5CF6" />
                              </View>
                              <Text style={styles.statCardValue}>{player.assists}</Text>
                              <Text style={styles.statCardLabel}>Asist</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                <Ionicons name="locate" size={18} color="#3B82F6" />
                              </View>
                              <Text style={styles.statCardValue}>{player.shotsOnTarget}/{player.shots}</Text>
                              <Text style={styles.statCardLabel}>Şut (İsabetli)</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                                <Ionicons name="arrow-forward" size={18} color="#14B8A6" />
                              </View>
                              <Text style={styles.statCardValue}>{player.passAccuracy}%</Text>
                              <Text style={styles.statCardLabel}>Pas İsabeti</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Ionicons name="flash" size={18} color="#F59E0B" />
                              </View>
                              <Text style={styles.statCardValue}>{player.keyPasses}</Text>
                              <Text style={styles.statCardLabel}>Kilit Pas</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                                <Ionicons name="walk" size={18} color="#EC4899" />
                              </View>
                              <Text style={styles.statCardValue}>{player.dribbleSuccess}/{player.dribbleAttempts}</Text>
                              <Text style={styles.statCardLabel}>Dribling</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <Ionicons name="shield" size={18} color="#EF4444" />
                              </View>
                              <Text style={styles.statCardValue}>{player.duelsWon}/{player.duelsTotal}</Text>
                              <Text style={styles.statCardLabel}>İkili Mücadele</Text>
                            </View>
                            <View style={styles.statCardNew}>
                              <View style={[styles.statCardIcon, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                                <Ionicons name="airplane" size={18} color="#7A9A94" />
                              </View>
                              <Text style={styles.statCardValue}>{player.aerialWon}/{player.aerialDuels}</Text>
                              <Text style={styles.statCardLabel}>Hava Topu</Text>
                            </View>
                          </>
                        )}
                      </View>
                      
                      {/* Oyuncu Isı Haritası - API verilerinden veya pozisyon bazlı çizim */}
                      <View style={styles.playerHeatmapSection}>
                        <View style={styles.playerHeatmapHeader}>
                          <Ionicons name="flame" size={16} color="#F59E0B" />
                          <Text style={styles.playerHeatmapTitle}>Oyuncu Isı Haritası</Text>
                        </View>
                        <View style={styles.playerHeatmapField}>
                          {/* Saha çizgileri */}
                          <View style={styles.fieldBorderNew} />
                          <View style={styles.centerLineNew} />
                          <View style={styles.centerCircleNew} />
                          <View style={styles.centerDotNew} />
                          <View style={styles.penaltyAreaLeftNew} />
                          <View style={styles.goalAreaLeftNew} />
                          <View style={styles.penaltySpotLeftNew} />
                          <View style={styles.penaltyAreaRightNew} />
                          <View style={styles.goalAreaRightNew} />
                          <View style={styles.penaltySpotRightNew} />
                          <View style={styles.goalLeftNew} />
                          <View style={styles.goalRightNew} />
                          
                          {/* ✅ API'den gelen oyuncu ısı haritası verileri veya pozisyon bazlı fallback */}
                          {(() => {
                            // Oyuncunun takımını bul
                            const isPlayerHome = player.teamId === matchData?.teams?.home?.id || 
                                                 player.teamName === matchData?.teams?.home?.name;
                            const playerHeatmapSource = isPlayerHome ? heatmapData.home?.players : heatmapData.away?.players;
                            const playerApiData = playerHeatmapSource?.find(p => p.playerId === player.id);
                            
                            // API'den veri varsa onu kullan – gradient renk (kırmızı→turuncu→sarı→yeşil)
                            if (playerApiData && playerApiData.points && playerApiData.points.length > 0) {
                              const getPointColor = (intensity: number) => {
                                const a = Math.max(0.35, Math.min(1, intensity + 0.2));
                                if (intensity >= 0.75) return `rgba(239, 68, 68, ${a})`;   // Kırmızı
                                if (intensity >= 0.5) return `rgba(249, 115, 22, ${a})`;   // Turuncu
                                if (intensity >= 0.3) return `rgba(234, 179, 8, ${a})`;    // Sarı
                                if (intensity >= 0.15) return `rgba(34, 197, 94, ${a * 0.9})`; // Yeşil
                                return `rgba(34, 197, 94, ${a * 0.5})`; // Açık yeşil
                              };
                              const getPointSize = (intensity: number) => {
                                return Math.max(10, Math.min(24, 8 + intensity * 16));
                              };
                              
                              // ✅ Koordinat dönüşümü: 
                              // Backend: x=saha genişliği (0-100), y=saha uzunluğu (0=home kale, 100=away kale)
                              // Frontend (yatay saha): left=saha uzunluğu (0=sol/home kale), top=saha genişliği
                              // API zaten takım yönüne göre veriyor: home y=5 (kendi kalesi), away y=95 (kendi kalesi)
                              const transformCoords = (apiX: number, apiY: number) => {
                                // Saha yatay gösterimde:
                                // - API y (0=home kale, 100=away kale) → left (0=sol, 100=sağ)
                                // - API x (0-100 genişlik) → top (0=üst, 100=alt)
                                // Backend zaten takım bazlı koordinat veriyor, direkt kullan
                                const fieldLeft = apiY;
                                const fieldTop = apiX;
                                return { left: fieldLeft, top: fieldTop };
                              };
                              
                              return playerApiData.points.map((point, i) => {
                                const { left, top } = transformCoords(point.x, point.y);
                                const size = getPointSize(point.intensity);
                                return (
                                  <View
                                    key={i}
                                    style={[
                                      styles.heatPointNew,
                                      {
                                        left: `${left}%`,
                                        top: `${top}%`,
                                        width: size,
                                        height: size,
                                        borderRadius: size / 2,
                                        backgroundColor: getPointColor(point.intensity),
                                        marginLeft: -size / 2,
                                        marginTop: -size / 2,
                                      }
                                    ]}
                                  />
                                );
                              });
                            }
                            
                            // Fallback: Pozisyon bazlı ısı haritası (referans: kaleci ceza sahası gradient, saha oyuncusu bölge)
                            const pos = player.position?.toUpperCase() || '';
                            const isGK = pos.includes('GK') || pos === 'G';
                            const isDef = pos.includes('CB') || pos.includes('LB') || pos.includes('RB') || pos === 'D' || pos.includes('DEF');
                            const isMid = pos.includes('CM') || pos.includes('CDM') || pos.includes('CAM') || pos === 'M' || pos.includes('MID');
                            const isWing = pos.includes('LW') || pos.includes('RW') || pos.includes('LM') || pos.includes('RM');
                            const isFwd = pos.includes('ST') || pos.includes('CF') || pos === 'F' || pos.includes('FWD') || pos.includes('FW');
                            const isPlayerHomeTeam = player.teamId === matchData?.teams?.home?.id || player.teamName === matchData?.teams?.home?.name;

                            const points: { x: number; y: number; size: number; color: string }[] = [];

                            if (isGK) {
                              // Kaleci: gerçekçi ısı – ceza sahasında dağınık noktalar, kale çizgisi sıcak, dışarı yumuşak geçiş
                              const gkLeftStart = isPlayerHomeTeam ? 2 : 82;
                              const gkLeftEnd = isPlayerHomeTeam ? 20 : 98;
                              const gkTopMin = 22;
                              const gkTopMax = 78;
                              const numPoints = 120;
                              for (let i = 0; i < numPoints; i++) {
                                const x = gkLeftStart + Math.random() * (gkLeftEnd - gkLeftStart);
                                const y = gkTopMin + Math.random() * (gkTopMax - gkTopMin);
                                const distFromGoal = isPlayerHomeTeam
                                  ? (x - gkLeftStart) / (gkLeftEnd - gkLeftStart)
                                  : (gkLeftEnd - x) / (gkLeftEnd - gkLeftStart);
                                const centerBias = 1 - 0.3 * Math.abs(y - 50) / 28;
                                let intensity = (1 - distFromGoal * 0.8) * centerBias;
                                intensity = Math.max(0.15, Math.min(0.95, intensity + (Math.random() - 0.5) * 0.12));
                                const size = 10 + intensity * 16;
                                let color: string;
                                if (intensity >= 0.7) color = `rgba(239, 68, 68, ${0.45 + intensity * 0.5})`;
                                else if (intensity >= 0.45) color = `rgba(249, 115, 22, ${0.4 + intensity * 0.45})`;
                                else if (intensity >= 0.25) color = `rgba(234, 179, 8, ${0.35 + intensity * 0.45})`;
                                else color = `rgba(34, 197, 94, ${0.25 + intensity * 0.4})`;
                                points.push({ x, y, size, color });
                              }
                            } else if (isDef) {
                              points.push({ x: 22, y: 50, size: 26, color: 'rgba(59, 130, 246, 0.85)' });
                              points.push({ x: 28, y: 32, size: 20, color: 'rgba(59, 130, 246, 0.6)' });
                              points.push({ x: 28, y: 68, size: 20, color: 'rgba(59, 130, 246, 0.6)' });
                              points.push({ x: 38, y: 50, size: 16, color: 'rgba(59, 130, 246, 0.4)' });
                            } else if (isMid) {
                              points.push({ x: 50, y: 50, size: 28, color: 'rgba(139, 92, 246, 0.9)' });
                              points.push({ x: 42, y: 35, size: 20, color: 'rgba(139, 92, 246, 0.55)' });
                              points.push({ x: 58, y: 65, size: 20, color: 'rgba(139, 92, 246, 0.55)' });
                              points.push({ x: 62, y: 50, size: 18, color: 'rgba(139, 92, 246, 0.5)' });
                              points.push({ x: 35, y: 50, size: 16, color: 'rgba(139, 92, 246, 0.4)' });
                            } else if (isWing) {
                              const isLeft = pos.includes('L');
                              points.push({ x: 68, y: isLeft ? 18 : 82, size: 28, color: 'rgba(245, 158, 11, 0.9)' });
                              points.push({ x: 55, y: isLeft ? 22 : 78, size: 20, color: 'rgba(245, 158, 11, 0.6)' });
                              points.push({ x: 78, y: isLeft ? 28 : 72, size: 22, color: 'rgba(245, 158, 11, 0.7)' });
                              points.push({ x: 85, y: isLeft ? 38 : 62, size: 18, color: 'rgba(239, 68, 68, 0.7)' });
                            } else if (isFwd) {
                              points.push({ x: 82, y: 50, size: 30, color: 'rgba(239, 68, 68, 0.9)' });
                              points.push({ x: 75, y: 32, size: 20, color: 'rgba(16, 185, 129, 0.6)' });
                              points.push({ x: 75, y: 68, size: 20, color: 'rgba(16, 185, 129, 0.6)' });
                              points.push({ x: 88, y: 50, size: 22, color: 'rgba(239, 68, 68, 0.75)' });
                              points.push({ x: 65, y: 50, size: 16, color: 'rgba(16, 185, 129, 0.4)' });
                            } else {
                              points.push({ x: 50, y: 50, size: 24, color: 'rgba(100, 116, 139, 0.7)' });
                              points.push({ x: 40, y: 40, size: 16, color: 'rgba(100, 116, 139, 0.45)' });
                              points.push({ x: 60, y: 60, size: 16, color: 'rgba(100, 116, 139, 0.45)' });
                            }
                            
                            return points.map((p, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.heatPointNew,
                                  {
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    width: p.size,
                                    height: p.size,
                                    borderRadius: p.size / 2,
                                    backgroundColor: p.color,
                                    marginLeft: -p.size / 2,
                                    marginTop: -p.size / 2,
                                  }
                                ]}
                              />
                            ));
                          })()}
                        </View>
                      </View>
                      
                      {/* Ek Detaylar Bölümü - Ana kartlarla aynı boyut */}
                      <View style={styles.extraDetailsSection}>
                        <View style={styles.extraDetailsHeader}>
                          <Ionicons name="list" size={16} color="#7A9A94" />
                          <Text style={styles.extraDetailsTitle}>Ek Detaylar</Text>
                        </View>
                        <View style={styles.extraDetailsGrid}>
                          {/* Müdahale */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                              <Ionicons name="footsteps" size={18} color="#3B82F6" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.tackles}</Text>
                            <Text style={styles.extraDetailLabel}>Müdahale</Text>
                          </View>
                          {/* Blok */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                              <Ionicons name="stop" size={18} color="#8B5CF6" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.blocks || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Blok</Text>
                          </View>
                          {/* Top Kapma */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                              <Ionicons name="hand-left" size={18} color="#10B981" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.interceptions || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Top Kapma</Text>
                          </View>
                          {/* Faul Kazanılan */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                              <Ionicons name="add-circle" size={18} color="#22D3EE" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.foulsDrawn || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Faul Kazanılan</Text>
                          </View>
                          {/* Faul Yapılan */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                              <Ionicons name="warning" size={18} color="#F97316" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.foulsCommitted || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Faul Yapılan</Text>
                          </View>
                          {/* Sarı Kart */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                              <Ionicons name="card" size={18} color="#EAB308" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.yellowCards || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Sarı Kart</Text>
                          </View>
                          {/* Kırmızı Kart */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]}>
                              <Ionicons name="card" size={18} color="#DC2626" />
                            </View>
                            <Text style={styles.extraDetailValue}>{player.redCards || 0}</Text>
                            <Text style={styles.extraDetailLabel}>Kırmızı Kart</Text>
                          </View>
                          {/* Penaltı - Kaleci için Kurtarış, Oyuncu için Gol */}
                          <View style={styles.extraDetailItem}>
                            <View style={[styles.statCardIcon, { backgroundColor: player.isGoalkeeper ? 'rgba(16, 185, 129, 0.15)' : 'rgba(236, 72, 153, 0.15)' }]}>
                              <Ionicons name={player.isGoalkeeper ? "hand-right" : "flag"} size={18} color={player.isGoalkeeper ? "#10B981" : "#EC4899"} />
                            </View>
                            <Text style={styles.extraDetailValue}>
                              {player.isGoalkeeper 
                                ? (player.penaltySaved || 0)
                                : (player.penaltyScored || 0)}
                            </Text>
                            <Text style={styles.extraDetailLabel}>
                              {player.isGoalkeeper ? 'Penaltı Kurtarış' : 'Penaltı Gol'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // ✅ Grid pattern görünsün - MatchDetail'den geliyor
  },
  
  // Tabs - Design System uyumlu, tamamen saydam
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
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: BRAND.secondary,
    fontWeight: '700',
  },
  tabActive: {
    backgroundColor: 'rgba(31, 162, 166, 0.2)', // ✅ Aktif tab - daha belirgin
    borderColor: BRAND.secondary,
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
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // ✅ Bottom navigation bar için yeterli boşluk
  },
  
  // Match Stats
  statsContainer: {
    padding: 16,
    gap: 24,
  },
  statsLoadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  statsLoadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // ✅ Maç henüz başlamadı - Canlı sekmesiyle aynı stil (sabit boyut, sıçrama önleme)
  notStartedContainer: {
    flex: 1, // Tüm alanı kapla
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notStartedCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    width: 300, // Sabit genişlik
    height: 240, // Sabit yükseklik - sıçrama önleme
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
  // ═══════════════════════════════════════════════════════════════════
  // xG (Gol Beklentisi) Kartı - Öne Çıkan
  // ═══════════════════════════════════════════════════════════════════
  xgCard: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
  },
  xgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  xgIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xgTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#22D3EE',
    letterSpacing: 0.3,
  },
  xgInfoBtn: {
    padding: 4,
  },
  xgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  xgValueBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.75)', // Marka yeşili - daha az transparan
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)', // Turkuaz border
  },
  xgValueBoxWinner: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  xgValueBoxWinnerAway: {
    borderColor: 'rgba(245, 158, 11, 0.6)',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  xgValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  xgValueWinner: {
    color: '#10B981',
  },
  xgValueWinnerAway: {
    color: '#F59E0B',
  },
  xgTeamLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7A9A94',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xgVsContainer: {
    paddingHorizontal: 8,
  },
  xgVsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
  },
  xgFormula: {
    fontSize: 9,
    color: '#7A9A94',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // ELİT İSTATİSTİK BARLARI - Şık, minimal, modern
  // ═══════════════════════════════════════════════════════════════════
  statRowCard: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(15, 42, 36, 0.7)', // Daha az transparan arka plan
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabelCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
    minWidth: 40,
    textAlign: 'center',
  },
  statValueTextWinner: {
    color: '#10B981',
    fontWeight: '800',
  },
  statValueTextWinnerAway: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7A9A94',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(51, 65, 85, 0.25)',
  },
  progressBarHome: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    height: '100%',
  },
  progressBarHomeHighlight: {
    backgroundColor: '#10B981',
  },
  progressBarAway: {
    backgroundColor: 'rgba(245, 158, 11, 0.35)',
    height: '100%',
  },
  progressBarAwayHighlight: {
    backgroundColor: '#F59E0B',
  },
  
  // Momentum Badge - elite
  momentumBadge: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    backgroundColor: DARK_MODE.card,
  },
  momentumGradient: {
    padding: 28,
    alignItems: 'center',
  },
  momentumEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  momentumText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Players
  playersContainer: {
    padding: 16,
    gap: 14,
  },
  teamSection: {
    gap: 14,
  },
  teamDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DARK_MODE.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  
  // Player Card - elite - açılır/kapanır yapı
  playerCard: {
    backgroundColor: 'rgba(30, 58, 58, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    }),
  },
  playerCardAway: {
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  playerCardExpanded: {
    borderColor: 'rgba(31, 162, 166, 0.4)',
    backgroundColor: 'rgba(30, 58, 58, 0.85)',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  playerNumberBadgeAway: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starBadgeAway: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starBadgeText: {
    fontSize: 8,
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  fireEmoji: {
    fontSize: 12,
  },
  playerPosition: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  ratingCircle: {
    width: 48,
    height: 48,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSvg: {
    position: 'absolute',
  },
  ratingValue: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND.secondary,
  },
  ratingTextAway: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F59E0B',
  },
  
  // Quick Stats - elite
  quickStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  quickStatHome: {
    flex: 1,
    backgroundColor: `${BRAND.secondary}18`,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${BRAND.secondary}30`,
  },
  quickStatAway: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  quickStatValueHome: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND.secondary,
  },
  quickStatValueAway: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F59E0B',
  },
  quickStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    fontWeight: '600',
  },
  
  // Isı Haritası - Placeholder
  heatmapContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
    backgroundColor: 'rgba(31, 162, 166, 0.05)',
  },
  heatmapContainerAway: {
    borderColor: 'rgba(245, 158, 11, 0.2)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  heatmapTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  heatmapField: {
    height: 60,
    position: 'relative',
  },
  heatmapGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapPlaceholder: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  
  // Isı Haritası - Gerçek görünüm
  heatmapAttackDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heatmapAttackText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  heatmapFieldReal: {
    height: 80,
    position: 'relative',
    backgroundColor: 'rgba(34, 87, 55, 0.6)',
    borderRadius: 4,
    margin: 8,
    overflow: 'hidden',
  },
  heatmapFieldLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heatmapCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heatmapCenterCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heatmapPenaltyAreaLeft: {
    position: 'absolute',
    left: 0,
    top: '20%',
    width: '12%',
    height: '60%',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heatmapPenaltyAreaRight: {
    position: 'absolute',
    right: 0,
    top: '20%',
    width: '12%',
    height: '60%',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heatPoint: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(31, 162, 166, 0.7)',
    marginLeft: -12,
    marginTop: -12,
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(31, 162, 166, 0.6)' },
      default: {},
    }),
  },
  heatPointAway: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.7)',
    marginLeft: -12,
    marginTop: -12,
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)' },
      default: {},
    }),
  },
  
  // Takım Isı Haritası Bölümü
  teamHeatmapSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  teamHeatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  teamHeatmapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  teamHeatmapContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  teamHeatmapCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  teamHeatmapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  teamHeatmapTeamName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1FA2A6',
    textTransform: 'uppercase',
  },
  teamHeatmapAttack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  teamHeatmapAttackLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#1FA2A6',
    textTransform: 'uppercase',
  },
  teamHeatmapField: {
    height: 70,
    backgroundColor: 'rgba(34, 87, 55, 0.6)',
    position: 'relative',
  },
  teamHeatmapFieldLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  teamHeatmapCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  teamHeatPoint: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    ...Platform.select({
      web: { boxShadow: '0 0 8px currentColor' },
      default: {},
    }),
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.15)',
  },
  heatmapLegendText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Gol & Şut - Anlamlı Akış Stilleri
  goalAssistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  goalBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  goalBoxAway: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  goalBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  goalBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  goalPlusDivider: {
    paddingHorizontal: 4,
  },
  goalPlusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A9A94',
  },
  assistBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  assistBoxAway: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  assistBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  assistBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: 2,
  },
  goalContribDivider: {
    paddingHorizontal: 4,
  },
  goalContribEquals: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A9A94',
  },
  contribBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(31, 162, 166, 0.5)',
  },
  contribBoxAway: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  contribValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1FA2A6',
  },
  contribLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1FA2A6',
    marginTop: 2,
  },
  shotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    padding: 10,
    borderRadius: 8,
  },
  shotItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  shotItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  shotItemLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  
  // Pas İstatistikleri - Anlamlı Akış Stilleri
  passSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  passSummaryItem: {
    alignItems: 'center',
  },
  passSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  passSummaryLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  passDivider: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  passPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passDetailGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  passDetailCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  passDetailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  passDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  passDetailLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  
  // Detailed Stats - elite
  detailedStats: {
    gap: 10,
  },
  statSection: {
    backgroundColor: 'rgba(51, 65, 85, 0.25)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  statSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statSectionEmoji: {
    fontSize: 14,
  },
  statSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statSectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statItem: {
    width: '47%',
    gap: 2,
  },
  statItemValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  statItemLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // YENİ ISI HARİTASI STİLLERİ - Alt alta, detaylı saha, favori takım önce
  // ═══════════════════════════════════════════════════════════════════
  teamHeatmapSectionNew: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  teamHeatmapHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  teamHeatmapTitleNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.5,
  },
  heatmapCardNew: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  heatmapCardFavorite: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 2,
  },
  heatmapCardHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  heatmapTeamInfoNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteStarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteStarText: {
    fontSize: 12,
  },
  heatmapTeamNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1FA2A6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heatmapTeamNameFavorite: {
    color: '#10B981',
  },
  heatmapAttackDirNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heatmapAttackTextNew: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  
  // Detaylı Saha Stilleri - Gerçek futbol sahası oranı (105m x 68m ≈ 1.54:1)
  heatmapFieldNew: {
    width: '100%',
    aspectRatio: HEATMAP_FIELD_RATIO, // 1.54 - Oyuncu ısı haritasıyla aynı oran
    alignSelf: 'center',
    backgroundColor: '#1a5f3c',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    // Çim deseni efekti
    ...Platform.select({
      web: {
        backgroundImage: 'repeating-linear-gradient(0deg, #1a5f3c, #1a5f3c 10px, #1d6840 10px, #1d6840 20px)',
      },
      default: {},
    }),
  },
  fieldBorderNew: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
  },
  centerLineNew: {
    position: 'absolute',
    left: '50%',
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginLeft: -1,
  },
  centerCircleNew: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginLeft: -25,
    marginTop: -25,
  },
  centerDotNew: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginLeft: -3,
    marginTop: -3,
  },
  // Sol penaltı alanı
  penaltyAreaLeftNew: {
    position: 'absolute',
    left: 4,
    top: '20%',
    width: '16%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  goalAreaLeftNew: {
    position: 'absolute',
    left: 4,
    top: '35%',
    width: '7%',
    height: '30%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 0,
  },
  penaltySpotLeftNew: {
    position: 'absolute',
    left: '12%',
    top: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: -2,
  },
  // Sağ penaltı alanı
  penaltyAreaRightNew: {
    position: 'absolute',
    right: 4,
    top: '20%',
    width: '16%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRightWidth: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  goalAreaRightNew: {
    position: 'absolute',
    right: 4,
    top: '35%',
    width: '7%',
    height: '30%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRightWidth: 0,
  },
  penaltySpotRightNew: {
    position: 'absolute',
    right: '12%',
    top: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: -2,
  },
  // Kale çizgileri
  goalLeftNew: {
    position: 'absolute',
    left: 0,
    top: '40%',
    width: 4,
    height: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  goalRightNew: {
    position: 'absolute',
    right: 0,
    top: '40%',
    width: 4,
    height: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  // Isı noktaları
  heatPointNew: {
    position: 'absolute',
    marginLeft: -14,
    marginTop: -14,
    ...Platform.select({
      web: {
        boxShadow: '0 0 18px currentColor',
        filter: 'blur(2px)',
      },
      default: {},
    }),
  },
  // Legend
  heatmapLegendNew: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.2)',
  },
  legendItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotNew: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextNew: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // YENİ OYUNCU İSTATİSTİKLERİ - Elit Dropdown Tasarım
  // ═══════════════════════════════════════════════════════════════════
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  playersContainerNew: {
    padding: 16,
    gap: 8,
  },
  teamHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.15)',
  },
  teamHeaderBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  favoriteTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favoriteTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerDropdown: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)', // Turkuaz border
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dropdownHeaderActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
  },
  dropdownHeaderActiveAway: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  playerInfoNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playerNumberNew: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'rgba(15, 42, 36, 0.7)', // Marka yeşili
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumberTextNew: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  playerNameBlock: {
    flex: 1,
  },
  playerNameNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  playerPosNew: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7A9A94',
    marginTop: 2,
  },
  playerRightNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickStatBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickStatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  ratingBadgeNew: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTextNew: {
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownContent: {
    padding: 14,
    gap: 16,
  },
  
  // Reyting Detayları
  ratingSection: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili
    borderRadius: 12,
    padding: 14,
  },
  ratingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingSectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  overallRatingBig: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overallRatingText: {
    fontSize: 16,
    fontWeight: '800',
  },
  ratingGrid: {
    gap: 10,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingItemLabel: {
    width: 70,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(31, 162, 166, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingItemValue: {
    width: 32,
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'right',
  },
  
  // İstatistik Kartları Grid - 2 satır × 4 sütun
  statsGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  statCardNew: {
    width: '23.5%',
    backgroundColor: 'rgba(15, 42, 36, 0.85)', // Marka yeşili - daha az transparan
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.25)', // Secondary turkuaz border
  },
  gkStatsNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(122, 154, 148, 0.12)',
    borderRadius: 8,
  },
  gkStatsNoteText: {
    fontSize: 12,
    color: '#7A9A94',
    marginLeft: 6,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#7A9A94',
    textAlign: 'center',
  },
  
  // Oyuncu Isı Haritası
  playerHeatmapSection: {
    backgroundColor: 'rgba(15, 42, 36, 0.5)', // Marka yeşili - #0F2A24
    borderRadius: 12,
    padding: 12,
  },
  playerHeatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  playerHeatmapTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  playerHeatmapField: {
    width: '100%',
    aspectRatio: HEATMAP_FIELD_RATIO, // Takım ısı haritasıyla aynı oran (1.54)
    backgroundColor: '#1a5f3c',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backgroundImage: 'repeating-linear-gradient(0deg, #1a5f3c, #1a5f3c 10px, #1d6840 10px, #1d6840 20px)',
      },
      default: {},
    }),
  },
  
  // ═══════════════════════════════════════════════════════════════════
  // EK DETAYLAR BÖLÜMÜ - Oyuncu dropdown içinde (Ana kartlarla aynı boyut)
  // ═══════════════════════════════════════════════════════════════════
  extraDetailsSection: {
    backgroundColor: 'rgba(15, 42, 36, 0.4)', // Marka yeşili
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  extraDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz border
  },
  extraDetailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  extraDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  extraDetailItem: {
    width: '23.5%',
    backgroundColor: 'rgba(15, 42, 36, 0.6)', // Marka yeşili - statCardNew ile aynı
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)', // Turkuaz border
  },
  extraDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  extraDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  extraDetailLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#7A9A94', // Yeşil muted text
    textAlign: 'center',
  },
});
