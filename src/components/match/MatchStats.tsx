// MatchStatsScreen.tsx - Maç İstatistikleri + Oyuncu İstatistikleri (canlı veri API ile)
import React, { useState, useEffect } from 'react';
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
import { BRAND, DARK_MODE } from '../../theme/theme';
import { isMockTestMatch, getMockMatchStatistics, getMockPlayerStatistics } from '../../data/mockTestData';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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
  'Shots off Goal': 'İsabetsiz Şut',
  'Blocked Shots': 'Şut Dışı',
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
};

interface MatchStatsScreenProps {
  matchData: any;
  matchId?: string;
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

function getStatIconForLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('topla oynama') || l.includes('possession')) return 'pie-chart';
  if (l.includes('şut')) return 'locate';
  if (l.includes('korner')) return 'flag';
  if (l.includes('ofsayt')) return 'hand-left';
  if (l.includes('faul')) return 'warning';
  if (l.includes('kart')) return 'card';
  if (l.includes('kurtarış') || l.includes('save')) return 'hand-right';
  if (l.includes('pas')) return 'arrow-forward';
  if (l.includes('gol')) return 'football';
  return 'stats-chart';
}

const topPlayers = {
  home: [
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
      tackles: 1,
      duelsTotal: 14,
      duelsWon: 8,
      aerialDuels: 8,
      aerialWon: 5,
    },
  ],
};

// Maç başlamadı mı kontrolü
const NOT_STARTED_STATUSES = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];

export const MatchStats: React.FC<MatchStatsScreenProps> = ({
  matchData,
  matchId,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'players'>('match');
  const [matchStats, setMatchStats] = useState<DisplayStat[]>(defaultDetailedStats);
  // ✅ Oyuncu kartları açılır/kapanır state
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  
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
  const matchStatus = matchData?.fixture?.status?.short || matchData?.status?.short || matchData?.statusShort || '';
  const fixtureId = matchId ? parseInt(matchId, 10) : null;
  
  // ✅ Mock maçlarda istatistik varsa göster (maç canlı demektir)
  const hasMockStats = fixtureId ? isMockTestMatch(fixtureId) && getMockMatchStatistics(fixtureId) !== null : false;
  const isMatchNotStarted = !hasMockStats && (NOT_STARTED_STATUSES.includes(matchStatus) || matchStatus === '');

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
        const response = await api.matches.getMatchStatistics(id);
        if (cancelled) return;
        if (response?.statistics && Array.isArray(response.statistics) && response.statistics.length > 0) {
          setMatchStats(apiStatsToDisplay(response.statistics));
        }
      } catch (_e) {
        if (!cancelled) setMatchStats(defaultDetailedStats);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matchId]);

  // ✅ Maç henüz başlamadıysa - ScrollView kullanmadan sabit konteyner (Canlı sekmesiyle aynı)
  if (isMatchNotStarted) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Tabs - her zaman göster */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'match' && styles.tabActive]}
            onPress={() => setActiveTab('match')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'match' && styles.tabTextActive
            ]}>
              📊 Maç İstatistikleri
            </Text>
            {activeTab === 'match' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'players' && styles.tabActive]}
            onPress={() => setActiveTab('players')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'players' && styles.tabTextActive
            ]}>
              ⭐ Oyuncu İstatistikleri
            </Text>
            {activeTab === 'players' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Maç başlamadı bildirimi - sabit konteyner */}
        <View style={styles.notStartedContainer}>
          <View style={styles.notStartedCard}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons 
                name={activeTab === 'match' ? 'stats-chart-outline' : 'people-outline'} 
                size={48} 
                color={BRAND.accent} 
              />
            </View>
            <Text style={styles.notStartedTitle}>
              {activeTab === 'match' ? 'Maç İstatistikleri' : 'Oyuncu İstatistikleri'}
            </Text>
            <Text style={styles.notStartedSubtitle}>
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
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'match' && styles.tabActive]}
          onPress={() => setActiveTab('match')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'match' && styles.tabTextActive
          ]}>
            📊 Maç İstatistikleri
          </Text>
          {activeTab === 'match' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'players' && styles.tabActive]}
          onPress={() => setActiveTab('players')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'players' && styles.tabTextActive
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
                <Text style={styles.statsLoadingText}>Maç istatistikleri yükleniyor...</Text>
              </View>
            ) : (
              matchStats.map((stat, index) => {
                const total = stat.home + stat.away || 1;
                const homePercent = (stat.home / total) * 100;
                const awayPercent = (stat.away / total) * 100;
                const iconName = getStatIconForLabel(stat.label);

                return (
                  <Animated.View
                    key={`${stat.label}-${index}`}
                    entering={isWeb ? undefined : FadeIn.delay(index * 30)}
                    style={styles.statRowCard}
                  >
                    <View style={styles.statValues}>
                      <View style={styles.statValueLeft}>
                        <Text style={[
                          styles.statValueText,
                          stat.home > stat.away && styles.statValueTextWinner
                        ]}>
                          {stat.homeDisplay}
                        </Text>
                      </View>
                      <View style={styles.statLabel}>
                        <View style={styles.statIconWrap}>
                          <Ionicons name={iconName as any} size={14} color={BRAND.secondary} />
                        </View>
                        <Text style={styles.statLabelText}>{stat.label}</Text>
                        {stat.home > stat.away && (
                          <Text style={styles.statTrendIcon}>📈</Text>
                        )}
                      </View>
                      <View style={styles.statValueRight}>
                        <Text style={[
                          styles.statValueText,
                          stat.away > stat.home && styles.statValueTextWinnerAway
                        ]}>
                          {stat.awayDisplay}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <Animated.View
                          entering={isWeb ? undefined : FadeIn.delay(index * 30 + 200).duration(600)}
                          style={[
                            styles.progressBarHome,
                            { width: `${homePercent}%` },
                            stat.home > stat.away && styles.progressBarHomeHighlight
                          ]}
                        />
                        <View style={styles.progressBarDivider} />
                        <Animated.View
                          entering={isWeb ? undefined : FadeIn.delay(index * 30 + 200).duration(600)}
                          style={[
                            styles.progressBarAway,
                            { width: `${awayPercent}%` },
                            stat.away > stat.home && styles.progressBarAwayHighlight
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                );
              })
            )}

            {/* Takım Isı Haritası */}
            <Animated.View
              entering={isWeb ? undefined : FadeIn.delay(300)}
              style={styles.teamHeatmapSection}
            >
              <View style={styles.teamHeatmapHeader}>
                <Ionicons name="flame" size={18} color="#F59E0B" />
                <Text style={styles.teamHeatmapTitle}>Takım Isı Haritaları</Text>
              </View>
              
              <View style={styles.teamHeatmapContainer}>
                {/* Ev Sahibi Isı Haritası */}
                <View style={styles.teamHeatmapCard}>
                  <View style={styles.teamHeatmapCardHeader}>
                    <Text style={styles.teamHeatmapTeamName}>{matchData?.homeName || 'Ev Sahibi'}</Text>
                    <View style={styles.teamHeatmapAttack}>
                      <Text style={styles.teamHeatmapAttackLabel}>Atak</Text>
                      <Ionicons name="arrow-forward" size={10} color="#1FA2A6" />
                    </View>
                  </View>
                  <View style={styles.teamHeatmapField}>
                    <View style={styles.teamHeatmapFieldLines}>
                      <View style={styles.teamHeatmapCenterLine} />
                    </View>
                    {/* Ev sahibi ısı noktaları - sağ tarafa yoğunlaşma (atak yönü) */}
                    <View style={[styles.teamHeatPoint, { left: '60%', top: '50%', opacity: 0.9, backgroundColor: 'rgba(31, 162, 166, 0.8)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '70%', top: '35%', opacity: 0.7, backgroundColor: 'rgba(31, 162, 166, 0.6)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '70%', top: '65%', opacity: 0.7, backgroundColor: 'rgba(31, 162, 166, 0.6)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '50%', top: '50%', opacity: 0.5, backgroundColor: 'rgba(31, 162, 166, 0.4)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '80%', top: '50%', opacity: 0.6, backgroundColor: 'rgba(239, 68, 68, 0.7)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '40%', top: '40%', opacity: 0.3, backgroundColor: 'rgba(31, 162, 166, 0.3)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '40%', top: '60%', opacity: 0.3, backgroundColor: 'rgba(31, 162, 166, 0.3)' }]} />
                  </View>
                </View>
                
                {/* Deplasman Isı Haritası */}
                <View style={styles.teamHeatmapCard}>
                  <View style={styles.teamHeatmapCardHeader}>
                    <Text style={[styles.teamHeatmapTeamName, { color: '#F59E0B' }]}>{matchData?.awayName || 'Deplasman'}</Text>
                    <View style={styles.teamHeatmapAttack}>
                      <Ionicons name="arrow-back" size={10} color="#F59E0B" />
                      <Text style={[styles.teamHeatmapAttackLabel, { color: '#F59E0B' }]}>Atak</Text>
                    </View>
                  </View>
                  <View style={styles.teamHeatmapField}>
                    <View style={styles.teamHeatmapFieldLines}>
                      <View style={styles.teamHeatmapCenterLine} />
                    </View>
                    {/* Deplasman ısı noktaları - sol tarafa yoğunlaşma (atak yönü) */}
                    <View style={[styles.teamHeatPoint, { left: '40%', top: '50%', opacity: 0.8, backgroundColor: 'rgba(245, 158, 11, 0.7)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '30%', top: '35%', opacity: 0.6, backgroundColor: 'rgba(245, 158, 11, 0.5)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '30%', top: '65%', opacity: 0.6, backgroundColor: 'rgba(245, 158, 11, 0.5)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '50%', top: '50%', opacity: 0.4, backgroundColor: 'rgba(245, 158, 11, 0.3)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '20%', top: '50%', opacity: 0.5, backgroundColor: 'rgba(239, 68, 68, 0.6)' }]} />
                    <View style={[styles.teamHeatPoint, { left: '60%', top: '45%', opacity: 0.3, backgroundColor: 'rgba(245, 158, 11, 0.3)' }]} />
                  </View>
                </View>
              </View>
              
              <View style={styles.heatmapLegend}>
                <Text style={styles.heatmapLegendText}>🔴 Yoğun Aktivite</Text>
                <Text style={styles.heatmapLegendText}>🟡 Orta Aktivite</Text>
                <Text style={styles.heatmapLegendText}>⚪ Düşük Aktivite</Text>
              </View>
            </Animated.View>
          </View>
        ) : (
          // OYUNCU PERFORMANSLARI - Açılır/Kapanır Kartlar
          <View style={styles.playersContainer}>
            {/* Home Team Players */}
            <View style={styles.teamSection}>
              {topPlayers.home.map((player, index) => {
                const playerId = `home-${player.number}`;
                const isExpanded = expandedPlayers.has(playerId);
                
                return (
                  <Animated.View
                    key={playerId}
                    entering={isWeb ? undefined : FadeIn.delay(index * 50)}
                    style={[styles.playerCard, isExpanded && styles.playerCardExpanded]}
                  >
                    {/* Player Header - Tıklanabilir */}
                    <TouchableOpacity 
                      style={styles.playerHeader}
                      onPress={() => togglePlayerExpand(playerId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNumberBadge}>
                          <Text style={styles.playerNumberText}>{player.number}</Text>
                          {player.rating >= 8.5 && (
                            <View style={styles.starBadge}>
                              <Text style={styles.starBadgeText}>⭐</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.playerDetails}>
                          <View style={styles.playerNameRow}>
                            <Text style={styles.playerName}>{player.name}</Text>
                            {player.goals >= 2 && <Text style={styles.fireEmoji}>🔥</Text>}
                          </View>
                          <Text style={styles.playerPosition}>
                            {player.position} • {player.minutesPlayed}'
                          </Text>
                        </View>
                      </View>

                      {/* Rating Circle + Expand Icon */}
                      <View style={styles.headerRight}>
                        <View style={styles.ratingCircle}>
                          <Svg width={44} height={44} style={styles.ratingSvg}>
                            <Circle
                              cx="22"
                              cy="22"
                              r="14"
                              stroke="rgba(100, 116, 139, 0.2)"
                              strokeWidth="2"
                              fill="none"
                            />
                            <Circle
                              cx="22"
                              cy="22"
                              r="14"
                              stroke={player.rating >= 8 ? '#10B981' : player.rating >= 7 ? '#1FA2A6' : '#F59E0B'}
                              strokeWidth="2.5"
                              fill="none"
                              strokeDasharray={`${(player.rating / 10) * 88} 88`}
                              strokeLinecap="round"
                              rotation="-90"
                              origin="22, 22"
                            />
                          </Svg>
                          <View style={styles.ratingValue}>
                            <Text style={[styles.ratingText, player.rating >= 8 && { color: '#10B981' }]}>{player.rating}</Text>
                          </View>
                        </View>
                        <Ionicons 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={18} 
                          color="#1FA2A6" 
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Quick Stats - Herzaman görünür */}
                    <View style={styles.quickStats}>
                      <View style={styles.quickStatHome}>
                        <Text style={styles.quickStatValueHome}>{player.goals}</Text>
                        <Text style={styles.quickStatLabel}>Gol</Text>
                      </View>
                      <View style={styles.quickStatHome}>
                        <Text style={styles.quickStatValueHome}>{player.assists}</Text>
                        <Text style={styles.quickStatLabel}>Asist</Text>
                      </View>
                      <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{player.shots}</Text>
                        <Text style={styles.quickStatLabel}>Şut</Text>
                      </View>
                      <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{player.passAccuracy}%</Text>
                        <Text style={styles.quickStatLabel}>Pas</Text>
                      </View>
                    </View>

                    {/* Expanded Content - Sadece açıkken görünür */}
                    {isExpanded && (
                      <Animated.View entering={FadeIn.duration(200)}>
                        {/* Isı Haritası - Mock Veri */}
                        <View style={styles.heatmapContainer}>
                          <View style={styles.heatmapHeader}>
                            <Ionicons name="flame" size={16} color="#F59E0B" />
                            <Text style={styles.heatmapTitle}>Isı Haritası</Text>
                            <View style={styles.heatmapAttackDirection}>
                              <Text style={styles.heatmapAttackText}>Atak Yönü</Text>
                              <Ionicons name="arrow-forward" size={12} color="#10B981" />
                            </View>
                          </View>
                          <View style={styles.heatmapFieldReal}>
                            {/* Saha çizgileri */}
                            <View style={styles.heatmapFieldLines}>
                              <View style={styles.heatmapCenterLine} />
                              <View style={styles.heatmapCenterCircle} />
                              <View style={styles.heatmapPenaltyAreaLeft} />
                              <View style={styles.heatmapPenaltyAreaRight} />
                            </View>
                            {/* Isı noktaları - Mock veri pozisyona göre */}
                            {(() => {
                              const pos = player.position?.toUpperCase() || '';
                              const isGK = pos.includes('GK') || pos.includes('G');
                              const isDef = pos.includes('CB') || pos.includes('LB') || pos.includes('RB') || pos.includes('DEF');
                              const isMid = pos.includes('CM') || pos.includes('CDM') || pos.includes('CAM') || pos.includes('MID');
                              const isWing = pos.includes('LW') || pos.includes('RW') || pos.includes('LM') || pos.includes('RM');
                              const isFwd = pos.includes('ST') || pos.includes('CF') || pos.includes('FWD');
                              
                              // Pozisyona göre ısı noktaları oluştur
                              const heatPoints = [];
                              if (isGK) {
                                heatPoints.push({ x: 8, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 15, y: 45, intensity: 0.4 });
                                heatPoints.push({ x: 15, y: 55, intensity: 0.4 });
                              } else if (isDef) {
                                heatPoints.push({ x: 25, y: 50, intensity: 0.8 });
                                heatPoints.push({ x: 30, y: 35, intensity: 0.6 });
                                heatPoints.push({ x: 30, y: 65, intensity: 0.6 });
                                heatPoints.push({ x: 40, y: 50, intensity: 0.3 });
                              } else if (isMid) {
                                heatPoints.push({ x: 50, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 45, y: 35, intensity: 0.5 });
                                heatPoints.push({ x: 55, y: 65, intensity: 0.5 });
                                heatPoints.push({ x: 60, y: 50, intensity: 0.6 });
                                heatPoints.push({ x: 35, y: 50, intensity: 0.4 });
                              } else if (isWing) {
                                const isLeft = pos.includes('L');
                                heatPoints.push({ x: 65, y: isLeft ? 20 : 80, intensity: 0.9 });
                                heatPoints.push({ x: 55, y: isLeft ? 25 : 75, intensity: 0.6 });
                                heatPoints.push({ x: 75, y: isLeft ? 15 : 85, intensity: 0.7 });
                                heatPoints.push({ x: 80, y: isLeft ? 30 : 70, intensity: 0.4 });
                              } else if (isFwd) {
                                heatPoints.push({ x: 80, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 75, y: 35, intensity: 0.5 });
                                heatPoints.push({ x: 75, y: 65, intensity: 0.5 });
                                heatPoints.push({ x: 85, y: 50, intensity: 0.7 });
                                heatPoints.push({ x: 65, y: 50, intensity: 0.3 });
                              } else {
                                // Varsayılan - orta alan
                                heatPoints.push({ x: 50, y: 50, intensity: 0.7 });
                                heatPoints.push({ x: 40, y: 40, intensity: 0.4 });
                                heatPoints.push({ x: 60, y: 60, intensity: 0.4 });
                              }
                              
                              return heatPoints.map((point, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.heatPoint,
                                    {
                                      left: `${point.x}%`,
                                      top: `${point.y}%`,
                                      opacity: point.intensity,
                                      transform: [{ scale: 0.5 + point.intensity * 0.5 }],
                                    }
                                  ]}
                                />
                              ));
                            })()}
                          </View>
                        </View>

                        {/* Detailed Stats */}
                        <View style={styles.detailedStats}>
                          {/* Gol & Şut - Anlamlı Akış */}
                          {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>⚽</Text>
                                <Text style={styles.statSectionTitle}>Hücum Performansı</Text>
                              </View>
                              {/* Gol-Asist Ana Satır */}
                              <View style={styles.goalAssistRow}>
                                <View style={styles.goalBox}>
                                  <Text style={styles.goalBoxValue}>{player.goals}</Text>
                                  <Text style={styles.goalBoxLabel}>GOL</Text>
                                </View>
                                <View style={styles.goalPlusDivider}>
                                  <Text style={styles.goalPlusText}>+</Text>
                                </View>
                                <View style={styles.assistBox}>
                                  <Text style={styles.assistBoxValue}>{player.assists}</Text>
                                  <Text style={styles.assistBoxLabel}>ASİST</Text>
                                </View>
                                <View style={styles.goalContribDivider}>
                                  <Text style={styles.goalContribEquals}>=</Text>
                                </View>
                                <View style={styles.contribBox}>
                                  <Text style={styles.contribValue}>{player.goals + player.assists}</Text>
                                  <Text style={styles.contribLabel}>G+A</Text>
                                </View>
                              </View>
                              {/* Şut Detay */}
                              <View style={styles.shotDetailRow}>
                                <View style={styles.shotItem}>
                                  <Text style={styles.shotItemValue}>{player.shots}</Text>
                                  <Text style={styles.shotItemLabel}>Şut</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#475569" />
                                <View style={styles.shotItem}>
                                  <Text style={[styles.shotItemValue, { color: '#10B981' }]}>{player.shotsOnTarget}</Text>
                                  <Text style={styles.shotItemLabel}>İsabetli</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#475569" />
                                <View style={styles.shotItem}>
                                  <Text style={[styles.shotItemValue, { color: '#F59E0B' }]}>{player.shotsInsideBox}</Text>
                                  <Text style={styles.shotItemLabel}>Ceza Sahası</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Pas & Oyun Kurma - Anlamlı Akış */}
                          {player.totalPasses > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>🎯</Text>
                                <Text style={styles.statSectionTitle}>Pas İstatistikleri</Text>
                              </View>
                              {/* Pas Özet Satırı */}
                              <View style={styles.passSummaryRow}>
                                <View style={styles.passSummaryItem}>
                                  <Text style={styles.passSummaryValue}>{player.totalPasses}</Text>
                                  <Text style={styles.passSummaryLabel}>Toplam Pas</Text>
                                </View>
                                <View style={styles.passDivider}>
                                  <Ionicons name="arrow-forward" size={16} color="#64748B" />
                                </View>
                                <View style={styles.passSummaryItem}>
                                  <Text style={[styles.passSummaryValue, { color: '#10B981' }]}>{Math.round(player.totalPasses * player.passAccuracy / 100)}</Text>
                                  <Text style={styles.passSummaryLabel}>İsabetli</Text>
                                </View>
                                <View style={styles.passDivider}>
                                  <Text style={styles.passPercentText}>{player.passAccuracy}%</Text>
                                </View>
                              </View>
                              {/* Pas Detay Kartları */}
                              <View style={styles.passDetailGrid}>
                                <View style={styles.passDetailCard}>
                                  <View style={styles.passDetailIconWrap}>
                                    <Ionicons name="key" size={14} color="#8B5CF6" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.keyPasses}</Text>
                                  <Text style={styles.passDetailLabel}>Kilit Pas</Text>
                                </View>
                                <View style={styles.passDetailCard}>
                                  <View style={[styles.passDetailIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <Ionicons name="resize" size={14} color="#3B82F6" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.longPasses}</Text>
                                  <Text style={styles.passDetailLabel}>Uzun Pas</Text>
                                </View>
                                <View style={styles.passDetailCard}>
                                  <View style={[styles.passDetailIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Ionicons name="flash" size={14} color="#F59E0B" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.assists}</Text>
                                  <Text style={styles.passDetailLabel}>Asist</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Dribbling & Hücum */}
                          {player.dribbleAttempts > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>🏃</Text>
                                <Text style={styles.statSectionTitle}>Dribling</Text>
                              </View>
                              <View style={styles.statSectionGrid}>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.dribbleSuccess}/{player.dribbleAttempts}
                                  </Text>
                                  <Text style={styles.statItemLabel}>Başarılı</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>{player.dispossessed}</Text>
                                  <Text style={styles.statItemLabel}>Kayıp</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* İkili Mücadele */}
                          {player.duelsTotal > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>⚔️</Text>
                                <Text style={styles.statSectionTitle}>Mücadele</Text>
                              </View>
                              <View style={styles.statSectionGrid}>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.duelsWon}/{player.duelsTotal}
                                  </Text>
                                  <Text style={styles.statItemLabel}>İkili</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.aerialWon}/{player.aerialDuels}
                                  </Text>
                                  <Text style={styles.statItemLabel}>Hava</Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Away Team Divider */}
            <View style={styles.teamDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Deplasman</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Away Team Players - Açılır/Kapanır */}
            <View style={styles.teamSection}>
              {topPlayers.away.map((player, index) => {
                const playerId = `away-${player.number}`;
                const isExpanded = expandedPlayers.has(playerId);
                
                return (
                  <Animated.View
                    key={playerId}
                    entering={isWeb ? undefined : FadeIn.delay(index * 50)}
                    style={[styles.playerCard, styles.playerCardAway, isExpanded && styles.playerCardExpanded]}
                  >
                    {/* Player Header - Tıklanabilir */}
                    <TouchableOpacity 
                      style={styles.playerHeader}
                      onPress={() => togglePlayerExpand(playerId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNumberBadgeAway}>
                          <Text style={styles.playerNumberText}>{player.number}</Text>
                          {player.rating >= 8.5 && (
                            <View style={styles.starBadgeAway}>
                              <Text style={styles.starBadgeText}>⭐</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.playerDetails}>
                          <View style={styles.playerNameRow}>
                            <Text style={styles.playerName}>{player.name}</Text>
                            {player.goals >= 2 && <Text style={styles.fireEmoji}>🔥</Text>}
                          </View>
                          <Text style={styles.playerPosition}>
                            {player.position} • {player.minutesPlayed}'
                          </Text>
                        </View>
                      </View>

                      {/* Rating Circle + Expand Icon */}
                      <View style={styles.headerRight}>
                        <View style={styles.ratingCircle}>
                          <Svg width={44} height={44} style={styles.ratingSvg}>
                            <Circle
                              cx="22"
                              cy="22"
                              r="14"
                              stroke="rgba(100, 116, 139, 0.2)"
                              strokeWidth="2"
                              fill="none"
                            />
                            <Circle
                              cx="22"
                              cy="22"
                              r="14"
                              stroke={player.rating >= 8 ? '#10B981' : player.rating >= 7 ? '#F59E0B' : '#EF4444'}
                              strokeWidth="2.5"
                              fill="none"
                              strokeDasharray={`${(player.rating / 10) * 88} 88`}
                              strokeLinecap="round"
                              rotation="-90"
                              origin="22, 22"
                            />
                          </Svg>
                          <View style={styles.ratingValue}>
                            <Text style={[styles.ratingTextAway, player.rating >= 8 && { color: '#10B981' }]}>{player.rating}</Text>
                          </View>
                        </View>
                        <Ionicons 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={18} 
                          color="#F59E0B" 
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Quick Stats - Herzaman görünür */}
                    <View style={styles.quickStats}>
                      <View style={styles.quickStatAway}>
                        <Text style={styles.quickStatValueAway}>{player.goals}</Text>
                        <Text style={styles.quickStatLabel}>Gol</Text>
                      </View>
                      <View style={styles.quickStatAway}>
                        <Text style={styles.quickStatValueAway}>{player.assists}</Text>
                        <Text style={styles.quickStatLabel}>Asist</Text>
                      </View>
                      <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{player.shots}</Text>
                        <Text style={styles.quickStatLabel}>Şut</Text>
                      </View>
                      <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{player.passAccuracy}%</Text>
                        <Text style={styles.quickStatLabel}>Pas</Text>
                      </View>
                    </View>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <Animated.View entering={FadeIn.duration(200)}>
                        {/* Isı Haritası - Mock Veri (Away) */}
                        <View style={[styles.heatmapContainer, styles.heatmapContainerAway]}>
                          <View style={styles.heatmapHeader}>
                            <Ionicons name="flame" size={16} color="#F59E0B" />
                            <Text style={styles.heatmapTitle}>Isı Haritası</Text>
                            <View style={styles.heatmapAttackDirection}>
                              <Ionicons name="arrow-back" size={12} color="#F59E0B" />
                              <Text style={[styles.heatmapAttackText, { color: '#F59E0B' }]}>Atak Yönü</Text>
                            </View>
                          </View>
                          <View style={styles.heatmapFieldReal}>
                            {/* Saha çizgileri */}
                            <View style={styles.heatmapFieldLines}>
                              <View style={styles.heatmapCenterLine} />
                              <View style={styles.heatmapCenterCircle} />
                              <View style={styles.heatmapPenaltyAreaLeft} />
                              <View style={styles.heatmapPenaltyAreaRight} />
                            </View>
                            {/* Isı noktaları - Away atak yönü sola */}
                            {(() => {
                              const pos = player.position?.toUpperCase() || '';
                              const isGK = pos.includes('GK') || pos.includes('G');
                              const isDef = pos.includes('CB') || pos.includes('LB') || pos.includes('RB') || pos.includes('DEF');
                              const isMid = pos.includes('CM') || pos.includes('CDM') || pos.includes('CAM') || pos.includes('MID');
                              const isWing = pos.includes('LW') || pos.includes('RW') || pos.includes('LM') || pos.includes('RM');
                              const isFwd = pos.includes('ST') || pos.includes('CF') || pos.includes('FWD');
                              
                              const heatPoints = [];
                              // Away için atak yönü sola - koordinatları çevir
                              if (isGK) {
                                heatPoints.push({ x: 92, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 85, y: 45, intensity: 0.4 });
                                heatPoints.push({ x: 85, y: 55, intensity: 0.4 });
                              } else if (isDef) {
                                heatPoints.push({ x: 75, y: 50, intensity: 0.8 });
                                heatPoints.push({ x: 70, y: 35, intensity: 0.6 });
                                heatPoints.push({ x: 70, y: 65, intensity: 0.6 });
                                heatPoints.push({ x: 60, y: 50, intensity: 0.3 });
                              } else if (isMid) {
                                heatPoints.push({ x: 50, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 55, y: 35, intensity: 0.5 });
                                heatPoints.push({ x: 45, y: 65, intensity: 0.5 });
                                heatPoints.push({ x: 40, y: 50, intensity: 0.6 });
                                heatPoints.push({ x: 65, y: 50, intensity: 0.4 });
                              } else if (isWing) {
                                const isLeft = pos.includes('L');
                                heatPoints.push({ x: 35, y: isLeft ? 20 : 80, intensity: 0.9 });
                                heatPoints.push({ x: 45, y: isLeft ? 25 : 75, intensity: 0.6 });
                                heatPoints.push({ x: 25, y: isLeft ? 15 : 85, intensity: 0.7 });
                                heatPoints.push({ x: 20, y: isLeft ? 30 : 70, intensity: 0.4 });
                              } else if (isFwd) {
                                heatPoints.push({ x: 20, y: 50, intensity: 0.9 });
                                heatPoints.push({ x: 25, y: 35, intensity: 0.5 });
                                heatPoints.push({ x: 25, y: 65, intensity: 0.5 });
                                heatPoints.push({ x: 15, y: 50, intensity: 0.7 });
                                heatPoints.push({ x: 35, y: 50, intensity: 0.3 });
                              } else {
                                heatPoints.push({ x: 50, y: 50, intensity: 0.7 });
                                heatPoints.push({ x: 60, y: 40, intensity: 0.4 });
                                heatPoints.push({ x: 40, y: 60, intensity: 0.4 });
                              }
                              
                              return heatPoints.map((point, idx) => (
                                <View
                                  key={idx}
                                  style={[
                                    styles.heatPointAway,
                                    {
                                      left: `${point.x}%`,
                                      top: `${point.y}%`,
                                      opacity: point.intensity,
                                      transform: [{ scale: 0.5 + point.intensity * 0.5 }],
                                    }
                                  ]}
                                />
                              ));
                            })()}
                          </View>
                        </View>

                        {/* Detailed Stats - Away */}
                        <View style={styles.detailedStats}>
                          {/* Gol & Şut - Anlamlı Akış */}
                          {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>⚽</Text>
                                <Text style={styles.statSectionTitle}>Hücum Performansı</Text>
                              </View>
                              <View style={styles.goalAssistRow}>
                                <View style={[styles.goalBox, styles.goalBoxAway]}>
                                  <Text style={styles.goalBoxValue}>{player.goals}</Text>
                                  <Text style={styles.goalBoxLabel}>GOL</Text>
                                </View>
                                <View style={styles.goalPlusDivider}>
                                  <Text style={styles.goalPlusText}>+</Text>
                                </View>
                                <View style={[styles.assistBox, styles.assistBoxAway]}>
                                  <Text style={styles.assistBoxValue}>{player.assists}</Text>
                                  <Text style={styles.assistBoxLabel}>ASİST</Text>
                                </View>
                                <View style={styles.goalContribDivider}>
                                  <Text style={styles.goalContribEquals}>=</Text>
                                </View>
                                <View style={[styles.contribBox, styles.contribBoxAway]}>
                                  <Text style={styles.contribValue}>{player.goals + player.assists}</Text>
                                  <Text style={styles.contribLabel}>G+A</Text>
                                </View>
                              </View>
                              <View style={styles.shotDetailRow}>
                                <View style={styles.shotItem}>
                                  <Text style={styles.shotItemValue}>{player.shots}</Text>
                                  <Text style={styles.shotItemLabel}>Şut</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#475569" />
                                <View style={styles.shotItem}>
                                  <Text style={[styles.shotItemValue, { color: '#10B981' }]}>{player.shotsOnTarget}</Text>
                                  <Text style={styles.shotItemLabel}>İsabetli</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#475569" />
                                <View style={styles.shotItem}>
                                  <Text style={[styles.shotItemValue, { color: '#F59E0B' }]}>{player.shotsInsideBox}</Text>
                                  <Text style={styles.shotItemLabel}>Ceza Sahası</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Pas İstatistikleri - Anlamlı Akış */}
                          {player.totalPasses > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>🎯</Text>
                                <Text style={styles.statSectionTitle}>Pas İstatistikleri</Text>
                              </View>
                              <View style={styles.passSummaryRow}>
                                <View style={styles.passSummaryItem}>
                                  <Text style={styles.passSummaryValue}>{player.totalPasses}</Text>
                                  <Text style={styles.passSummaryLabel}>Toplam Pas</Text>
                                </View>
                                <View style={styles.passDivider}>
                                  <Ionicons name="arrow-forward" size={16} color="#64748B" />
                                </View>
                                <View style={styles.passSummaryItem}>
                                  <Text style={[styles.passSummaryValue, { color: '#10B981' }]}>{Math.round(player.totalPasses * player.passAccuracy / 100)}</Text>
                                  <Text style={styles.passSummaryLabel}>İsabetli</Text>
                                </View>
                                <View style={styles.passDivider}>
                                  <Text style={styles.passPercentText}>{player.passAccuracy}%</Text>
                                </View>
                              </View>
                              <View style={styles.passDetailGrid}>
                                <View style={styles.passDetailCard}>
                                  <View style={styles.passDetailIconWrap}>
                                    <Ionicons name="key" size={14} color="#8B5CF6" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.keyPasses}</Text>
                                  <Text style={styles.passDetailLabel}>Kilit Pas</Text>
                                </View>
                                <View style={styles.passDetailCard}>
                                  <View style={[styles.passDetailIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <Ionicons name="resize" size={14} color="#3B82F6" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.longPasses}</Text>
                                  <Text style={styles.passDetailLabel}>Uzun Pas</Text>
                                </View>
                                <View style={styles.passDetailCard}>
                                  <View style={[styles.passDetailIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Ionicons name="flash" size={14} color="#F59E0B" />
                                  </View>
                                  <Text style={styles.passDetailValue}>{player.assists}</Text>
                                  <Text style={styles.passDetailLabel}>Asist</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {player.dribbleAttempts > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>🏃</Text>
                                <Text style={styles.statSectionTitle}>Dribling</Text>
                              </View>
                              <View style={styles.statSectionGrid}>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.dribbleSuccess}/{player.dribbleAttempts}
                                  </Text>
                                  <Text style={styles.statItemLabel}>Başarılı</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>{player.dispossessed}</Text>
                                  <Text style={styles.statItemLabel}>Kayıp</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {player.duelsTotal > 0 && (
                            <View style={styles.statSection}>
                              <View style={styles.statSectionHeader}>
                                <Text style={styles.statSectionEmoji}>⚔️</Text>
                                <Text style={styles.statSectionTitle}>Mücadele</Text>
                              </View>
                              <View style={styles.statSectionGrid}>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.duelsWon}/{player.duelsTotal}
                                  </Text>
                                  <Text style={styles.statItemLabel}>İkili</Text>
                                </View>
                                <View style={styles.statItem}>
                                  <Text style={styles.statItemValue}>
                                    {player.aerialWon}/{player.aerialDuels}
                                  </Text>
                                  <Text style={styles.statItemLabel}>Hava</Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
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
  statRowCard: {
    backgroundColor: 'rgba(30, 58, 58, 0.6)', // ✅ Tema uyumlu arka plan
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.15)',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
    }),
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statValueLeft: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  statValueRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  statValueText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  statValueTextWinner: {
    color: BRAND.secondary,
  },
  statValueTextWinnerAway: {
    color: '#F59E0B',
  },
  statLabel: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: `${BRAND.secondary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  statTrendIcon: {
    fontSize: 12,
  },
  progressBarContainer: {
    height: 12,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  progressBarHome: {
    backgroundColor: 'rgba(31, 162, 166, 0.5)',
    height: '100%',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  progressBarHomeHighlight: {
    backgroundColor: BRAND.secondary,
  },
  progressBarDivider: {
    width: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  progressBarAway: {
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    height: '100%',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
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
    backgroundColor: 'rgba(71, 85, 105, 0.2)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
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
    borderTopColor: 'rgba(71, 85, 105, 0.2)',
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
    color: '#64748B',
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
    color: '#64748B',
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
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
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
});
