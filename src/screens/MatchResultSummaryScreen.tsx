// MatchResultSummaryScreen.tsx - React Native FULL VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn,
  ZoomIn,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MatchResultSummaryScreenProps {
  matchData: any;
  onBack: () => void;
}

// Mock data - Final Result
const matchResult = {
  status: 'FT',
  homeTeam: {
    name: 'Beşiktaş',
    color: ['#000000', '#FFFFFF'],
    score: 2,
    scorers: [
      { player: 'Cenk Tosun', minute: 28, type: 'goal' },
      { player: 'Cenk Tosun', minute: 67, type: 'goal', assist: 'Redmond' },
    ],
  },
  awayTeam: {
    name: 'Trabzonspor',
    color: ['#781132', '#7C9ECC'],
    score: 1,
    scorers: [
      { player: 'Edin Visca', minute: 52, type: 'goal', assist: 'Bardhi' },
    ],
  },
  halfTimeScore: { home: 1, away: 0 },
  date: '6 Ocak 2026',
  time: '19:00',
  venue: 'Vodafone Park',
  attendance: '41,000',
  referee: 'Halil Umut Meler',
};

// Match Timeline - Key Events
const matchTimeline = [
  { minute: 67, type: 'goal', team: 'home', player: 'Cenk Tosun', assist: 'Redmond', score: '2-1' },
  { minute: 65, type: 'substitution', team: 'away', playerOut: 'Orsic', playerIn: 'Visca' },
  { minute: 58, type: 'yellow', team: 'home', player: 'Masuaku' },
  { minute: 52, type: 'goal', team: 'away', player: 'Visca', assist: 'Bardhi', score: '1-1' },
  { minute: 45, type: 'half-time', description: 'İlk Yarı' },
  { minute: 34, type: 'yellow', team: 'away', player: 'Denswil' },
  { minute: 28, type: 'goal', team: 'home', player: 'Cenk Tosun', score: '1-0' },
  { minute: 22, type: 'yellow', team: 'away', player: 'Vitor Hugo' },
  { minute: 1, type: 'kickoff', description: 'Maç Başladı' },
];

// Match Statistics Summary
const matchStats = [
  { label: 'Topla Oynama', home: 58, away: 42, unit: '%' },
  { label: 'Toplam Şut', home: 12, away: 8, unit: '' },
  { label: 'İsabetli Şut', home: 5, away: 3, unit: '' },
  { label: 'Korner', home: 6, away: 4, unit: '' },
  { label: 'Sarı Kart', home: 2, away: 3, unit: '' },
  { label: 'Pas İsabeti', home: 86, away: 81, unit: '%' },
];

// Man of the Match
const manOfTheMatch = {
  name: 'Cenk Tosun',
  team: 'home',
  number: 23,
  position: 'ST',
  rating: 9.2,
  stats: {
    goals: 2,
    assists: 0,
    shots: 5,
    passAccuracy: 87,
  },
  votes: 1247,
};

// Top Performers
const topPerformers = {
  home: [
    { name: 'Cenk Tosun', rating: 9.2, position: 'ST' },
    { name: 'Redmond', rating: 8.5, position: 'LW' },
    { name: 'Gedson', rating: 7.8, position: 'CM' },
  ],
  away: [
    { name: 'Visca', rating: 7.9, position: 'RW' },
    { name: 'Bardhi', rating: 7.3, position: 'CAM' },
    { name: 'Vitor Hugo', rating: 6.8, position: 'CB' },
  ],
};

// League Table Impact
const leagueImpact = {
  home: {
    oldPosition: 3,
    newPosition: 3,
    oldPoints: 28,
    newPoints: 31,
    change: 0,
  },
  away: {
    oldPosition: 4,
    newPosition: 4,
    oldPoints: 26,
    newPoints: 26,
    change: 0,
  },
};

export const MatchResultSummaryScreen: React.FC<MatchResultSummaryScreenProps> = ({
  matchData,
  onBack,
}) => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'timeline' | 'stats'>('summary');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#F8FAFB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maç Özeti</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('summary')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'summary' && styles.tabTextActive
          ]}>
            📊 Özet
          </Text>
          {selectedTab === 'summary' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('timeline')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'timeline' && styles.tabTextActive
          ]}>
            ⏱️ Zaman Çizelgesi
          </Text>
          {selectedTab === 'timeline' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('stats')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'stats' && styles.tabTextActive
          ]}>
            📈 İstatistikler
          </Text>
          {selectedTab === 'stats' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'summary' && (
          <View style={styles.summaryContainer}>
            {/* Final Score Card */}
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.scoreCard}
            >
              <LinearGradient
                colors={['rgba(5, 150, 105, 0.15)', 'rgba(5, 150, 105, 0.05)']}
                style={styles.scoreGradient}
              >
                {/* Home Team Color Bar - Left */}
                <LinearGradient
                  colors={matchResult.homeTeam.color}
                  style={[styles.colorBar, styles.colorBarLeft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                {/* Away Team Color Bar - Right */}
                <LinearGradient
                  colors={matchResult.awayTeam.color}
                  style={[styles.colorBar, styles.colorBarRight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                {/* Status Badge */}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>MAÇ BİTTİ</Text>
                </View>

                {/* Teams & Score */}
                <View style={styles.scoreRow}>
                  {/* Home Team */}
                  <Animated.View 
                    entering={SlideInLeft.delay(200)}
                    style={styles.teamContainer}
                  >
                    <Text style={styles.teamName}>{matchResult.homeTeam.name}</Text>
                  </Animated.View>

                  {/* Score */}
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreValue}>
                        {matchResult.homeTeam.score}
                      </Text>
                      <Text style={styles.scoreSeparator}>-</Text>
                      <Text style={styles.scoreValue}>
                        {matchResult.awayTeam.score}
                      </Text>
                    </View>
                    <Text style={styles.htScore}>
                      HT: {matchResult.halfTimeScore.home}-{matchResult.halfTimeScore.away}
                    </Text>
                  </View>

                  {/* Away Team */}
                  <Animated.View 
                    entering={SlideInRight.delay(200)}
                    style={styles.teamContainer}
                  >
                    <Text style={styles.teamName}>{matchResult.awayTeam.name}</Text>
                  </Animated.View>
                </View>

                {/* Match Info */}
                <View style={styles.matchInfo}>
                  <Text style={styles.matchInfoText}>
                    📅 {matchResult.date} • {matchResult.time}
                  </Text>
                  <Text style={styles.matchInfoText}>
                    🏟️ {matchResult.venue}
                  </Text>
                  <Text style={styles.matchInfoText}>
                    👥 {matchResult.attendance} • 👨‍⚖️ {matchResult.referee}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Goal Scorers */}
            <Animated.View
              entering={FadeIn.delay(300)}
              style={styles.scorersCard}
            >
              <Text style={styles.cardTitle}>⚽ Gol Atan Oyuncular</Text>

              <View style={styles.scorersContainer}>
                {/* Home Scorers */}
                <View style={styles.scorersTeam}>
                  {matchResult.homeTeam.scorers.map((scorer, index) => (
                    <View key={index} style={styles.scorerItem}>
                      <View style={styles.scorerInfo}>
                        <Text style={styles.scorerName}>{scorer.player}</Text>
                        {scorer.assist && (
                          <Text style={styles.scorerAssist}>({scorer.assist})</Text>
                        )}
                      </View>
                      <View style={styles.scorerMinute}>
                        <Text style={styles.scorerMinuteText}>{scorer.minute}'</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.scorersDivider} />

                {/* Away Scorers */}
                <View style={styles.scorersTeam}>
                  {matchResult.awayTeam.scorers.map((scorer, index) => (
                    <View key={index} style={[styles.scorerItem, styles.scorerItemAway]}>
                      <View style={styles.scorerMinute}>
                        <Text style={styles.scorerMinuteText}>{scorer.minute}'</Text>
                      </View>
                      <View style={[styles.scorerInfo, styles.scorerInfoAway]}>
                        <Text style={styles.scorerName}>{scorer.player}</Text>
                        {scorer.assist && (
                          <Text style={styles.scorerAssist}>({scorer.assist})</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* Man of the Match */}
            <Animated.View
              entering={ZoomIn.delay(400)}
              style={styles.motmCard}
            >
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.motmGradient}
              >
                <View style={styles.motmHeader}>
                  <Text style={styles.motmBadge}>🌟 MAN OF THE MATCH</Text>
                </View>

                <View style={styles.motmContent}>
                  <View style={styles.motmPlayer}>
                    <View style={styles.motmNumberBadge}>
                      <Text style={styles.motmNumber}>{manOfTheMatch.number}</Text>
                    </View>
                    <View style={styles.motmPlayerInfo}>
                      <Text style={styles.motmName}>{manOfTheMatch.name}</Text>
                      <Text style={styles.motmPosition}>{manOfTheMatch.position}</Text>
                    </View>
                    <View style={styles.motmRating}>
                      <Text style={styles.motmRatingValue}>{manOfTheMatch.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.motmStats}>
                    <View style={styles.motmStatItem}>
                      <Text style={styles.motmStatValue}>{manOfTheMatch.stats.goals}</Text>
                      <Text style={styles.motmStatLabel}>Gol</Text>
                    </View>
                    <View style={styles.motmStatItem}>
                      <Text style={styles.motmStatValue}>{manOfTheMatch.stats.assists}</Text>
                      <Text style={styles.motmStatLabel}>Asist</Text>
                    </View>
                    <View style={styles.motmStatItem}>
                      <Text style={styles.motmStatValue}>{manOfTheMatch.stats.shots}</Text>
                      <Text style={styles.motmStatLabel}>Şut</Text>
                    </View>
                    <View style={styles.motmStatItem}>
                      <Text style={styles.motmStatValue}>{manOfTheMatch.stats.passAccuracy}%</Text>
                      <Text style={styles.motmStatLabel}>Pas İsabeti</Text>
                    </View>
                  </View>

                  <Text style={styles.motmVotes}>
                    👥 {manOfTheMatch.votes.toLocaleString()} oy
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Top Performers */}
            <Animated.View
              entering={FadeIn.delay(500)}
              style={styles.performersCard}
            >
              <Text style={styles.cardTitle}>⭐ En İyi Performanslar</Text>

              <View style={styles.performersContainer}>
                {/* Home Performers */}
                <View style={styles.performersTeam}>
                  <Text style={styles.performersTeamTitle}>
                    {matchResult.homeTeam.name}
                  </Text>
                  {topPerformers.home.map((player, index) => (
                    <View key={index} style={styles.performerItem}>
                      <View style={styles.performerRank}>
                        <Text style={styles.performerRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.performerInfo}>
                        <Text style={styles.performerName}>{player.name}</Text>
                        <Text style={styles.performerPosition}>{player.position}</Text>
                      </View>
                      <View style={styles.performerRating}>
                        <Text style={styles.performerRatingText}>{player.rating}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.performersDivider} />

                {/* Away Performers */}
                <View style={styles.performersTeam}>
                  <Text style={styles.performersTeamTitle}>
                    {matchResult.awayTeam.name}
                  </Text>
                  {topPerformers.away.map((player, index) => (
                    <View key={index} style={styles.performerItem}>
                      <View style={styles.performerRank}>
                        <Text style={styles.performerRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.performerInfo}>
                        <Text style={styles.performerName}>{player.name}</Text>
                        <Text style={styles.performerPosition}>{player.position}</Text>
                      </View>
                      <View style={styles.performerRating}>
                        <Text style={styles.performerRatingText}>{player.rating}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>

            {/* League Impact */}
            <Animated.View
              entering={FadeIn.delay(600)}
              style={styles.leagueCard}
            >
              <Text style={styles.cardTitle}>🏆 Puan Durumuna Etkisi</Text>

              <View style={styles.leagueImpactContainer}>
                {/* Home Impact */}
                <View style={styles.leagueImpactTeam}>
                  <Text style={styles.leagueTeamName}>
                    {matchResult.homeTeam.name}
                  </Text>
                  <View style={styles.leagueImpactStats}>
                    <View style={styles.leagueImpactStat}>
                      <Text style={styles.leagueImpactLabel}>Sıralama</Text>
                      <View style={styles.leagueImpactValue}>
                        <Text style={styles.leaguePosition}>{leagueImpact.home.newPosition}</Text>
                        {leagueImpact.home.change !== 0 && (
                          <Text style={[
                            styles.leagueChange,
                            leagueImpact.home.change > 0 ? styles.leagueChangeUp : styles.leagueChangeDown
                          ]}>
                            {leagueImpact.home.change > 0 ? '↑' : '↓'} {Math.abs(leagueImpact.home.change)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.leagueImpactStat}>
                      <Text style={styles.leagueImpactLabel}>Puan</Text>
                      <Text style={styles.leaguePoints}>{leagueImpact.home.newPoints}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.leagueImpactDivider} />

                {/* Away Impact */}
                <View style={styles.leagueImpactTeam}>
                  <Text style={styles.leagueTeamName}>
                    {matchResult.awayTeam.name}
                  </Text>
                  <View style={styles.leagueImpactStats}>
                    <View style={styles.leagueImpactStat}>
                      <Text style={styles.leagueImpactLabel}>Sıralama</Text>
                      <View style={styles.leagueImpactValue}>
                        <Text style={styles.leaguePosition}>{leagueImpact.away.newPosition}</Text>
                        {leagueImpact.away.change !== 0 && (
                          <Text style={[
                            styles.leagueChange,
                            leagueImpact.away.change > 0 ? styles.leagueChangeUp : styles.leagueChangeDown
                          ]}>
                            {leagueImpact.away.change > 0 ? '↑' : '↓'} {Math.abs(leagueImpact.away.change)}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.leagueImpactStat}>
                      <Text style={styles.leagueImpactLabel}>Puan</Text>
                      <Text style={styles.leaguePoints}>{leagueImpact.away.newPoints}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        {selectedTab === 'timeline' && (
          <View style={styles.timelineContainer}>
            {/* Timeline Events */}
            {matchTimeline.map((event, index) => {
              const isCentered = event.type === 'kickoff' || event.type === 'half-time';
              const isHome = event.team === 'home';

              if (isCentered) {
                return (
                  <Animated.View
                    key={index}
                    entering={FadeIn.delay(index * 50)}
                    style={styles.timelineCenteredEvent}
                  >
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineCenteredCard}>
                      <Text style={styles.timelineCenteredText}>{event.description}</Text>
                      <Text style={styles.timelineCenteredMinute}>{event.minute}'</Text>
                    </View>
                  </Animated.View>
                );
              }

              return (
                <View key={index} style={styles.timelineEventRow}>
                  <View style={styles.timelineDot} />
                  
                  <Animated.View
                    entering={FadeIn.delay(index * 50)}
                    style={[
                      styles.timelineEventCard,
                      isHome ? styles.timelineEventLeft : styles.timelineEventRight
                    ]}
                  >
                    <View style={styles.timelineEventHeader}>
                      <Text style={styles.timelineMinute}>{event.minute}'</Text>
                      <Text style={styles.timelineIcon}>
                        {event.type === 'goal' && '⚽'}
                        {event.type === 'yellow' && '🟨'}
                        {event.type === 'substitution' && '🔁'}
                      </Text>
                    </View>

                    {event.type === 'goal' && (
                      <View style={styles.timelineEventContent}>
                        <Text style={styles.timelineEventTitle}>GOL!</Text>
                        <Text style={styles.timelineEventPlayer}>{event.player}</Text>
                        {event.assist && (
                          <Text style={styles.timelineEventAssist}>Asist: {event.assist}</Text>
                        )}
                        <Text style={styles.timelineEventScore}>{event.score}</Text>
                      </View>
                    )}

                    {event.type === 'yellow' && (
                      <View style={styles.timelineEventContent}>
                        <Text style={styles.timelineEventTitle}>Sarı Kart</Text>
                        <Text style={styles.timelineEventPlayer}>{event.player}</Text>
                      </View>
                    )}

                    {event.type === 'substitution' && (
                      <View style={styles.timelineEventContent}>
                        <Text style={styles.timelineEventTitle}>Değişiklik</Text>
                        <Text style={styles.timelineEventPlayerOut}>↓ {event.playerOut}</Text>
                        <Text style={styles.timelineEventPlayerIn}>↑ {event.playerIn}</Text>
                      </View>
                    )}
                  </Animated.View>
                </View>
              );
            })}
          </View>
        )}

        {selectedTab === 'stats' && (
          <View style={styles.statsContainer}>
            {/* Match Stats */}
            {matchStats.map((stat, index) => {
              const total = stat.home + stat.away;
              const homePercent = stat.unit === '%' ? stat.home : (stat.home / total) * 100;
              const awayPercent = stat.unit === '%' ? stat.away : (stat.away / total) * 100;

              return (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 80)}
                  style={styles.statCard}
                >
                  {/* Values */}
                  <View style={styles.statValues}>
                    <Text style={[
                      styles.statValue,
                      stat.home > stat.away && styles.statValueWinner
                    ]}>
                      {stat.home}{stat.unit}
                    </Text>

                    <Text style={styles.statLabel}>{stat.label}</Text>

                    <Text style={[
                      styles.statValue,
                      stat.away > stat.home && styles.statValueWinnerAway
                    ]}>
                      {stat.away}{stat.unit}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.statProgressContainer}>
                    <View style={styles.statProgressBar}>
                      <View 
                        style={[
                          styles.statProgressHome,
                          { width: `${homePercent}%` }
                        ]}
                      />
                      <View 
                        style={[
                          styles.statProgressAway,
                          { width: `${awayPercent}%` }
                        ]}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Stats Summary */}
            <Animated.View
              entering={FadeIn.delay(600)}
              style={styles.statsSummaryCard}
            >
              <LinearGradient
                colors={['rgba(5, 150, 105, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                style={styles.statsSummaryGradient}
              >
                <Text style={styles.statsSummaryEmoji}>📊</Text>
                <Text style={styles.statsSummaryTitle}>İstatistik Özeti</Text>
                <Text style={styles.statsSummaryText}>
                  {matchResult.homeTeam.name} üstün oyun sergiledi ve maçın %58'inde topa sahip oldu. 
                  Toplam 12 şut çeken ev sahibi takım, 5 isabetli şutla rakibine karşı etkili bir performans gösterdi.
                </Text>
              </LinearGradient>
            </Animated.View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5, 150, 105, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFB',
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
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textAlign: 'center',
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Summary Container
  summaryContainer: {
    gap: 16,
  },

  // Score Card
  scoreCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  scoreGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
  },
  colorBarLeft: {
    left: 0,
  },
  colorBarRight: {
    right: 0,
  },
  statusBadge: {
    alignSelf: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  htScore: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  matchInfo: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  matchInfoText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Scorers Card
  scorersCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  scorersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scorersTeam: {
    flex: 1,
    gap: 8,
  },
  scorerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  scorerItemAway: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  scorerInfo: {
    flex: 1,
    gap: 2,
  },
  scorerInfoAway: {
    alignItems: 'flex-end',
  },
  scorerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scorerAssist: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  scorerMinute: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorerMinuteText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scorersDivider: {
    width: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },

  // Man of the Match
  motmCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  motmGradient: {
    padding: 20,
  },
  motmHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  motmBadge: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  motmContent: {
    gap: 16,
  },
  motmPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motmNumberBadge: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motmNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  motmPlayerInfo: {
    flex: 1,
    gap: 4,
  },
  motmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motmPosition: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  motmRating: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  motmRatingValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F59E0B',
  },
  motmStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  motmStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  motmStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  motmStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  motmVotes: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Top Performers
  performersCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  performersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  performersTeam: {
    flex: 1,
    gap: 8,
  },
  performersTeamTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  performerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  performerRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  performerInfo: {
    flex: 1,
    gap: 2,
  },
  performerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  performerPosition: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  performerRating: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  performerRatingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  performersDivider: {
    width: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },

  // League Impact
  leagueCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  leagueImpactContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  leagueImpactTeam: {
    flex: 1,
    gap: 12,
  },
  leagueTeamName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  leagueImpactStats: {
    gap: 8,
  },
  leagueImpactStat: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  leagueImpactLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  leagueImpactValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaguePosition: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  leaguePoints: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
  },
  leagueChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  leagueChangeUp: {
    color: '#22C55E',
  },
  leagueChangeDown: {
    color: '#EF4444',
  },
  leagueImpactDivider: {
    width: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },

  // Timeline
  timelineContainer: {
    gap: 16,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '50%',
    top: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#0F172A',
    transform: [{ translateX: -6 }],
    zIndex: 10,
  },
  timelineCenteredEvent: {
    alignItems: 'center',
    position: 'relative',
  },
  timelineCenteredCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  timelineCenteredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timelineCenteredMinute: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  timelineEventRow: {
    position: 'relative',
  },
  timelineEventCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 12,
    width: '47%',
    gap: 8,
  },
  timelineEventLeft: {
    alignSelf: 'flex-start',
  },
  timelineEventRight: {
    alignSelf: 'flex-end',
  },
  timelineEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineMinute: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  timelineIcon: {
    fontSize: 16,
  },
  timelineEventContent: {
    gap: 4,
  },
  timelineEventTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timelineEventPlayer: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  timelineEventAssist: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  timelineEventScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  timelineEventPlayerOut: {
    fontSize: 10,
    color: '#EF4444',
  },
  timelineEventPlayerIn: {
    fontSize: 10,
    color: '#22C55E',
  },

  // Stats
  statsContainer: {
    gap: 16,
  },
  statCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statValueWinner: {
    color: '#059669',
    textAlign: 'left',
  },
  statValueWinnerAway: {
    color: '#F59E0B',
    textAlign: 'right',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 2,
    textAlign: 'center',
  },
  statProgressContainer: {
    height: 8,
  },
  statProgressBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statProgressHome: {
    backgroundColor: '#059669',
    height: '100%',
  },
  statProgressAway: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },

  // Stats Summary
  statsSummaryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  statsSummaryGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  statsSummaryEmoji: {
    fontSize: 32,
  },
  statsSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsSummaryText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
