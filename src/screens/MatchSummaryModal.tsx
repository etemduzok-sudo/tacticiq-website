// MatchSummaryModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface MatchSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  match: any;
}

// Mock maç özet verisi
const getMatchSummary = (matchId: string) => {
  const summaries: Record<string, any> = {
    '1': {
      goals: [
        {
          minute: 23,
          team: 'home',
          player: 'Mauro Icardi',
          assist: 'Dries Mertens',
          type: 'goal',
        },
        {
          minute: 34,
          team: 'away',
          player: 'Edin Džeko',
          assist: null,
          type: 'goal',
        },
        {
          minute: 67,
          team: 'home',
          player: 'Wilfried Zaha',
          assist: 'Icardi',
          type: 'goal',
        },
      ],
      cards: [
        {
          minute: 18,
          team: 'away',
          player: 'Bright Osayi-Samuel',
          type: 'yellow',
        },
        {
          minute: 45,
          team: 'home',
          player: 'Lucas Torreira',
          type: 'yellow',
        },
        {
          minute: 78,
          team: 'away',
          player: 'Ferdi Kadıoğlu',
          type: 'yellow',
        },
      ],
      substitutions: [
        {
          minute: 56,
          team: 'home',
          playerOut: 'Kerem Aktürkoğlu',
          playerIn: 'Barış Alper Yılmaz',
        },
        {
          minute: 62,
          team: 'away',
          playerOut: 'İrfan Can Kahveci',
          playerIn: 'Michy Batshuayi',
        },
        {
          minute: 74,
          team: 'home',
          playerOut: 'Dries Mertens',
          playerIn: 'Kerem Demirbay',
        },
      ],
      stats: {
        possession: { home: 58, away: 42 },
        shots: { home: 16, away: 11 },
        shotsOnTarget: { home: 7, away: 4 },
        corners: { home: 7, away: 5 },
        fouls: { home: 12, away: 14 },
      },
    },
    '2': {
      goals: [
        {
          minute: 12,
          team: 'home',
          player: 'Vincent Aboubakar',
          assist: 'Rashica',
          type: 'goal',
        },
        {
          minute: 56,
          team: 'away',
          player: 'Trezeguet',
          assist: 'Mahmoud Trezeguet',
          type: 'goal',
        },
      ],
      cards: [
        { minute: 34, team: 'away', player: 'Eren Elmalı', type: 'yellow' },
        {
          minute: 67,
          team: 'home',
          player: 'Gedson Fernandes',
          type: 'yellow',
        },
      ],
      substitutions: [
        {
          minute: 60,
          team: 'home',
          playerOut: 'Necip Uysal',
          playerIn: 'Salih Uçan',
        },
        {
          minute: 68,
          team: 'away',
          playerOut: 'Vitor Hugo',
          playerIn: 'Enis Bardhi',
        },
      ],
      stats: {
        possession: { home: 52, away: 48 },
        shots: { home: 13, away: 10 },
        shotsOnTarget: { home: 5, away: 4 },
        corners: { home: 6, away: 4 },
        fouls: { home: 11, away: 13 },
      },
    },
  };

  return summaries[matchId] || summaries['1'];
};

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  visible,
  onClose,
  match,
}) => {
  if (!match) return null;

  const summary = getMatchSummary(match.id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <Animated.View entering={FadeIn} style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Maç Özeti</Text>

            {/* Match Score Header */}
            <View style={styles.matchScoreHeader}>
              <View style={styles.teamScoreContainer}>
                <Text style={styles.teamNameHeader}>
                  {match.homeTeam.name}
                </Text>
                <Text style={styles.scoreHeader}>{match.homeTeam.score}</Text>
              </View>

              <View style={styles.scoreSeparator}>
                <Text style={styles.scoreSeparatorText}>-</Text>
              </View>

              <View style={styles.teamScoreContainer}>
                <Text style={styles.teamNameHeader}>
                  {match.awayTeam.name}
                </Text>
                <Text style={styles.scoreHeader}>{match.awayTeam.score}</Text>
              </View>
            </View>

            {/* Match Info */}
            <View style={styles.matchInfoHeader}>
              <View style={styles.matchInfoItem}>
                <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.matchInfoTextHeader}>{match.date}</Text>
              </View>
              <Text style={styles.matchInfoSeparator}>•</Text>
              <View style={styles.matchInfoItem}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.matchInfoTextHeader}>{match.time}</Text>
              </View>
              <Text style={styles.matchInfoSeparator}>•</Text>
              <View style={styles.matchInfoItem}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.matchInfoTextHeader} numberOfLines={1}>
                  {match.stadium}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Goller */}
            {summary.goals && summary.goals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>Goller</Text>
                </View>

                {summary.goals.map((goal: any, index: number) => (
                  <Animated.View
                    key={index}
                    entering={FadeInLeft.delay(index * 50)}
                    style={[
                      styles.goalItem,
                      {
                        backgroundColor:
                          goal.team === 'home'
                            ? 'rgba(5, 150, 105, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                        borderLeftColor:
                          goal.team === 'home' ? '#059669' : '#F59E0B',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.minuteBadge,
                        {
                          backgroundColor:
                            goal.team === 'home' ? '#059669' : '#F59E0B',
                        },
                      ]}
                    >
                      <Text style={styles.minuteText}>{goal.minute}'</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalPlayer}>⚽ {goal.player}</Text>
                      {goal.assist && (
                        <Text style={styles.goalAssist}>
                          Asist: {goal.assist}
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Kartlar */}
            {summary.cards && summary.cards.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Kartlar</Text>
                </View>

                {summary.cards.map((card: any, index: number) => (
                  <Animated.View
                    key={index}
                    entering={FadeInLeft.delay(index * 50)}
                    style={styles.cardItem}
                  >
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardIcon}>
                        {card.type === 'yellow' ? '🟨' : '🟥'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardPlayer}>{card.player}</Text>
                      <Text style={styles.cardTeam}>
                        {card.team === 'home'
                          ? match.homeTeam.name
                          : match.awayTeam.name}
                      </Text>
                    </View>
                    <Text style={styles.cardMinute}>{card.minute}'</Text>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Oyuncu Değişiklikleri */}
            {summary.substitutions && summary.substitutions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>
                    Oyuncu Değişiklikleri
                  </Text>
                </View>

                {summary.substitutions.map((sub: any, index: number) => (
                  <Animated.View
                    key={index}
                    entering={FadeInLeft.delay(index * 50)}
                    style={styles.subItem}
                  >
                    <View style={styles.subMinuteBadge}>
                      <Text style={styles.subMinuteText}>{sub.minute}'</Text>
                    </View>
                    <View style={styles.subInfo}>
                      <View style={styles.subRow}>
                        <Text style={styles.subArrowOut}>↓</Text>
                        <Text style={styles.subPlayerOut} numberOfLines={1}>
                          {sub.playerOut}
                        </Text>
                      </View>
                      <View style={styles.subRow}>
                        <Text style={styles.subArrowIn}>↑</Text>
                        <Text style={styles.subPlayerIn} numberOfLines={1}>
                          {sub.playerIn}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Maç İstatistikleri */}
            {summary.stats && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="analytics" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>Maç İstatistikleri</Text>
                </View>

                {/* Top Kontrolü */}
                <View style={styles.statSection}>
                  <View style={styles.statHeaderRow}>
                    <Text style={styles.statTeamName}>
                      {match.homeTeam.name}
                    </Text>
                    <Text style={styles.statLabel}>Top Kontrolü</Text>
                    <Text style={styles.statTeamName}>
                      {match.awayTeam.name}
                    </Text>
                  </View>

                  <View style={styles.possessionRow}>
                    <Text style={styles.possessionValue}>
                      {summary.stats.possession.home}%
                    </Text>
                    <View style={styles.possessionBar}>
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.possessionFill,
                          {
                            width: `${summary.stats.possession.home}%`,
                          },
                        ]}
                      />
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.possessionFill,
                          {
                            width: `${summary.stats.possession.away}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.possessionValue}>
                      {summary.stats.possession.away}%
                    </Text>
                  </View>
                </View>

                {/* Diğer İstatistikler */}
                <View style={styles.otherStatsContainer}>
                  {[
                    {
                      label: 'Şutlar',
                      home: summary.stats.shots.home,
                      away: summary.stats.shots.away,
                    },
                    {
                      label: 'İsabetli Şutlar',
                      home: summary.stats.shotsOnTarget.home,
                      away: summary.stats.shotsOnTarget.away,
                    },
                    {
                      label: 'Kornerler',
                      home: summary.stats.corners.home,
                      away: summary.stats.corners.away,
                    },
                    {
                      label: 'Faul',
                      home: summary.stats.fouls.home,
                      away: summary.stats.fouls.away,
                    },
                  ].map((stat, index) => (
                    <View key={index} style={styles.statRow}>
                      <Text style={styles.statValue}>{stat.home}</Text>
                      <Text style={styles.statRowLabel}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.away}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Modal Container
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  // Close Button
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  // Match Score Header
  matchScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamScoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamNameHeader: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  scoreHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSeparator: {
    paddingHorizontal: 12,
  },
  scoreSeparatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Match Info Header
  matchInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  matchInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchInfoTextHeader: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  matchInfoSeparator: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Goal Item
  goalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 2,
    marginBottom: 8,
  },
  minuteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalInfo: {
    flex: 1,
  },
  goalPlayer: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalAssist: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Card Item
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    marginBottom: 8,
  },
  cardBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
  },
  cardPlayer: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardTeam: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardMinute: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },

  // Substitution Item
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    marginBottom: 8,
  },
  subMinuteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subMinuteText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subInfo: {
    flex: 1,
    gap: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subArrowOut: {
    fontSize: 14,
    color: '#EF4444',
  },
  subArrowIn: {
    fontSize: 14,
    color: '#059669',
  },
  subPlayerOut: {
    fontSize: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  subPlayerIn: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },

  // Stats
  statSection: {
    marginBottom: 16,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statTeamName: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },

  // Possession Bar
  possessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  possessionValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
  },
  possessionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  possessionFill: {
    height: '100%',
  },

  // Other Stats
  otherStatsContainer: {
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
  },
  statRowLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
});
