// MatchStatsScreen.tsx - React Native FULL VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  Layout,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface MatchStatsScreenProps {
  matchData: any;
}

const detailedStats = [
  { label: 'Topla Oynama (%)', home: 58, away: 42 },
  { label: 'Toplam Şut', home: 12, away: 8 },
  { label: 'İsabetli Şut', home: 5, away: 3 },
  { label: 'İsabetsiz Şut', home: 3, away: 2 },
  { label: 'Şut Dışı', home: 10, away: 7 },
  { label: 'Korner', home: 6, away: 4 },
  { label: 'Ofsayt', home: 3, away: 5 },
  { label: 'Pas İsabeti (%)', home: 86, away: 81 },
  { label: 'Toplam Pas', home: 412, away: 298 },
  { label: 'İsabetli Pas', home: 356, away: 241 },
  { label: 'Dripling Başarısı', home: 12, away: 8 },
  { label: 'Top Kaybı', home: 52, away: 68 },
  { label: 'Tehlikeli Atak', home: 28, away: 19 },
  { label: 'Toplam Atak', home: 67, away: 52 },
  { label: 'Faul', home: 8, away: 11 },
  { label: 'Sarı Kart', home: 2, away: 3 },
  { label: 'Kırmızı Kart', home: 0, away: 0 },
  { label: 'Kaleci Kurtarışı', home: 3, away: 4 },
];

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

export const MatchStats: React.FC<MatchStatsScreenProps> = ({
  matchData,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'players'>('match');

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
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
          style={styles.tab}
          onPress={() => setActiveTab('players')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'players' && styles.tabTextActive
          ]}>
            ⭐ Oyuncular
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
          // MAÇ İSTATİSTİKLERİ
          <View style={styles.statsContainer}>
            {detailedStats.map((stat, index) => {
              const total = stat.home + stat.away;
              const homePercent = (stat.home / total) * 100;
              const awayPercent = (stat.away / total) * 100;

              return (
                <Animated.View
                  key={stat.label}
                  entering={FadeIn.delay(index * 30)}
                  style={styles.statRow}
                >
                  {/* Values Row */}
                  <View style={styles.statValues}>
                    <View style={styles.statValueLeft}>
                      <Text style={[
                        styles.statValueText,
                        stat.home > stat.away && styles.statValueTextWinner
                      ]}>
                        {stat.home}
                      </Text>
                    </View>

                    <View style={styles.statLabel}>
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
                        {stat.away}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View
                        entering={FadeIn.delay(index * 30 + 200).duration(600)}
                        style={[
                          styles.progressBarHome,
                          { width: `${homePercent}%` }
                        ]}
                      />
                      <Animated.View
                        entering={FadeIn.delay(index * 30 + 200).duration(600)}
                        style={[
                          styles.progressBarAway,
                          { width: `${awayPercent}%` }
                        ]}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Momentum Badge */}
            <Animated.View
              entering={FadeIn.delay(300)}
              style={styles.momentumBadge}
            >
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.8)', 'rgba(100, 116, 139, 0.3)']}
                style={styles.momentumGradient}
              >
                <Text style={styles.momentumEmoji}>🔥</Text>
                <Text style={styles.momentumText}>
                  Isı haritası ve pozisyon analizi yakında...
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>
        ) : (
          // OYUNCU PERFORMANSLARI
          <View style={styles.playersContainer}>
            {/* Home Team Players */}
            <View style={styles.teamSection}>
              {topPlayers.home.map((player, index) => (
                <Animated.View
                  key={`home-${player.number}`}
                  entering={FadeIn.delay(index * 50)}
                  style={styles.playerCard}
                >
                  {/* Player Header */}
                  <View style={styles.playerHeader}>
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

                    {/* Rating Circle */}
                    <View style={styles.ratingCircle}>
                      <Svg width={48} height={48} style={styles.ratingSvg}>
                        <Circle
                          cx="24"
                          cy="24"
                          r="15"
                          stroke="rgba(100, 116, 139, 0.2)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <Circle
                          cx="24"
                          cy="24"
                          r="15"
                          stroke="#059669"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${(player.rating / 10) * 94.2} 94.2`}
                          strokeLinecap="round"
                          rotation="-90"
                          origin="24, 24"
                        />
                      </Svg>
                      <View style={styles.ratingValue}>
                        <Text style={styles.ratingText}>{player.rating}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Quick Stats Grid */}
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

                  {/* Detailed Stats */}
                  <View style={styles.detailedStats}>
                    {/* Gol & Şut */}
                    {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>⚽</Text>
                          <Text style={styles.statSectionTitle}>Gol & Şut</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.goals}</Text>
                            <Text style={styles.statItemLabel}>Gol</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.assists}</Text>
                            <Text style={styles.statItemLabel}>Asist</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.shotsOnTarget}</Text>
                            <Text style={styles.statItemLabel}>İsabetli Şut</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.shotsInsideBox}</Text>
                            <Text style={styles.statItemLabel}>Kale Önü</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Pas & Oyun Kurma */}
                    {player.totalPasses > 0 && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>🧠</Text>
                          <Text style={styles.statSectionTitle}>Pas & Oyun Kurma</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.passAccuracy}%</Text>
                            <Text style={styles.statItemLabel}>İsabet</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.keyPasses}</Text>
                            <Text style={styles.statItemLabel}>Kilit Pas</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.longPasses}</Text>
                            <Text style={styles.statItemLabel}>Uzun Pas</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.totalPasses}</Text>
                            <Text style={styles.statItemLabel}>Toplam</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Dribbling & Hücum */}
                    {player.dribbleAttempts > 0 && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>🏃</Text>
                          <Text style={styles.statSectionTitle}>Dribling & Hücum</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>
                              {player.dribbleSuccess}/{player.dribbleAttempts}
                            </Text>
                            <Text style={styles.statItemLabel}>Dribling</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.dispossessed}</Text>
                            <Text style={styles.statItemLabel}>Top Kaybı</Text>
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
              ))}
            </View>

            {/* Away Team Divider */}
            <View style={styles.teamDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Deplasman</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Away Team Players */}
            <View style={styles.teamSection}>
              {topPlayers.away.map((player, index) => (
                <Animated.View
                  key={`away-${player.number}`}
                  entering={FadeIn.delay(index * 50)}
                  style={styles.playerCard}
                >
                  {/* Player Header */}
                  <View style={styles.playerHeader}>
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

                    {/* Rating Circle Away */}
                    <View style={styles.ratingCircle}>
                      <Svg width={48} height={48} style={styles.ratingSvg}>
                        <Circle
                          cx="24"
                          cy="24"
                          r="15"
                          stroke="rgba(100, 116, 139, 0.2)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <Circle
                          cx="24"
                          cy="24"
                          r="15"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${(player.rating / 10) * 94.2} 94.2`}
                          strokeLinecap="round"
                          rotation="-90"
                          origin="24, 24"
                        />
                      </Svg>
                      <View style={styles.ratingValue}>
                        <Text style={styles.ratingTextAway}>{player.rating}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Quick Stats Grid - Away */}
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

                  {/* Detailed Stats - Same structure as home */}
                  <View style={styles.detailedStats}>
                    {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>⚽</Text>
                          <Text style={styles.statSectionTitle}>Gol & Şut</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.goals}</Text>
                            <Text style={styles.statItemLabel}>Gol</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.assists}</Text>
                            <Text style={styles.statItemLabel}>Asist</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.shotsOnTarget}</Text>
                            <Text style={styles.statItemLabel}>İsabetli Şut</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.shotsInsideBox}</Text>
                            <Text style={styles.statItemLabel}>Kale Önü</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {player.totalPasses > 0 && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>🧠</Text>
                          <Text style={styles.statSectionTitle}>Pas & Oyun Kurma</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.passAccuracy}%</Text>
                            <Text style={styles.statItemLabel}>İsabet</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.keyPasses}</Text>
                            <Text style={styles.statItemLabel}>Kilit Pas</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.longPasses}</Text>
                            <Text style={styles.statItemLabel}>Uzun Pas</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.totalPasses}</Text>
                            <Text style={styles.statItemLabel}>Toplam</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {player.dribbleAttempts > 0 && (
                      <View style={styles.statSection}>
                        <View style={styles.statSectionHeader}>
                          <Text style={styles.statSectionEmoji}>🏃</Text>
                          <Text style={styles.statSectionTitle}>Dribling & Hücum</Text>
                        </View>
                        <View style={styles.statSectionGrid}>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>
                              {player.dribbleSuccess}/{player.dribbleAttempts}
                            </Text>
                            <Text style={styles.statItemLabel}>Dribling</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statItemValue}>{player.dispossessed}</Text>
                            <Text style={styles.statItemLabel}>Top Kaybı</Text>
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
              ))}
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
    backgroundColor: '#0F172A',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.3)',
  },
  tab: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#059669',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#059669',
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  
  // Match Stats
  statsContainer: {
    padding: 16,
    gap: 24,
  },
  statRow: {
    gap: 8,
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statValueLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValueRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statValueTextWinner: {
    color: '#059669',
  },
  statValueTextWinnerAway: {
    color: '#F59E0B',
  },
  statLabel: {
    flex: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  statLabelText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statTrendIcon: {
    fontSize: 12,
  },
  progressBarContainer: {
    height: 8,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarHome: {
    backgroundColor: '#059669',
    height: '100%',
  },
  progressBarAway: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  
  // Momentum Badge
  momentumBadge: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  momentumGradient: {
    padding: 32,
    alignItems: 'center',
  },
  momentumEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  momentumText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Players
  playersContainer: {
    padding: 16,
    gap: 12,
  },
  teamSection: {
    gap: 12,
  },
  teamDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  dividerText: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Player Card
  playerCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  playerNumberBadgeAway: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: '#059669',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fireEmoji: {
    fontSize: 12,
  },
  playerPosition: {
    fontSize: 10,
    color: '#9CA3AF',
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  ratingTextAway: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  quickStatHome: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.1)',
  },
  quickStatAway: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
  },
  quickStat: {
    flex: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  quickStatValueHome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  quickStatValueAway: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontSize: 7,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  
  // Detailed Stats
  detailedStats: {
    gap: 6,
  },
  statSection: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderRadius: 8,
    padding: 10,
  },
  statSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statSectionEmoji: {
    fontSize: 14,
  },
  statSectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statSectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '48%',
    gap: 2,
  },
  statItemValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statItemLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});
