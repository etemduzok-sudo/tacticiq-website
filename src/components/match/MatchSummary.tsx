// MatchSummary.tsx - React Native Version - Özet Sekmesi (6 sekmeden biri)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Web için animasyonları devre dışı bırak
const isWeb = Platform.OS === 'web';

interface MatchSummaryProps {
  matchData: any;
}

// Mock data - gerçek API'den gelecek
const predictionResults = {
  totalPoints: 128,
  maxPoints: 180,
  successRate: 71,
  breakdown: {
    matchPredictions: 68,
    playerPredictions: 45,
    bonusPoints: 15,
    penalties: 0,
  },
  predictions: [
    {
      name: "Toplam Gol",
      prediction: "2-3 gol",
      actual: "3 gol",
      status: "correct",
      points: 20,
      explanation: "Maç 2-1 bitti, tahmin aralığı tuttu",
    },
    {
      name: "İlk Golü Kim Atar",
      prediction: "Mauro Icardi",
      actual: "Mauro Icardi",
      status: "correct",
      points: 25,
      explanation: "İcardi 3. dakikada golü attı",
    },
    {
      name: "Maçın Adamı",
      prediction: "Mauro Icardi",
      actual: "Wilfried Zaha",
      status: "wrong",
      points: 0,
      explanation: "Zaha 1 gol 2 asist yaptı ve maçın adamı seçildi",
    },
    {
      name: "Sarı Kart Sayısı",
      prediction: "2-3",
      actual: "3",
      status: "correct",
      points: 15,
      explanation: "Toplam 3 sarı kart gösterildi",
    },
    {
      name: "İlk Yarı Skor",
      prediction: "1-1",
      actual: "1-1",
      status: "correct",
      points: 30,
      explanation: "İlk yarı 1-1 beraberlikle tamamlandı",
    },
    {
      name: "Toplam Korner",
      prediction: "8-10",
      actual: "6",
      status: "wrong",
      points: 0,
      explanation: "Maçta toplam 6 korner kullanıldı",
    },
  ],
  timingBonus: {
    predictionTime: "2 saat önce",
    bonusPoints: 10,
    hasBonus: true,
  },
};

const userComparison = {
  betterThan: 68,
  worseThan: 32,
  averagePoints: 95,
  topPoints: 165,
  userRank: 142,
  totalUsers: 2365,
  distribution: [
    { range: "0-30", count: 120 },
    { range: "30-60", count: 285 },
    { range: "60-90", count: 620 },
    { range: "90-120", count: 580 },
    { range: "120-150", count: 420 },
    { range: "150-180", count: 340 },
  ],
};

const performanceTags = [
  { label: "Analist Seviye Okuma", icon: "🎯" },
  { label: "Oyuncu Tahminlerinde Güçlü", icon: "⭐" },
];

const recentMatches = [
  { opponent: "vs Beşiktaş", points: 145, date: "21 Ara" },
  { opponent: "vs Trabzonspor", points: 112, date: "18 Ara" },
  { opponent: "vs Fenerbahçe", points: 98, date: "15 Ara" },
  { opponent: "vs Alanyaspor", points: 133, date: "12 Ara" },
  { opponent: "vs Sivasspor", points: 107, date: "9 Ara" },
];

const teamStandings = {
  league: "Süper Lig",
  rank: 1,
  totalTeams: 19,
  stats: {
    played: 17,
    won: 12,
    draw: 3,
    lost: 2,
    goalsFor: 38,
    goalsAgainst: 15,
    goalDiff: 23,
    points: 39,
  },
  homeStats: {
    played: 9,
    won: 7,
    draw: 1,
    lost: 1,
    goalsFor: 22,
    goalsAgainst: 7,
  },
  awayStats: {
    played: 8,
    won: 5,
    draw: 2,
    lost: 1,
    goalsFor: 16,
    goalsAgainst: 8,
  },
  form: ["W", "W", "D", "W", "W"],
  nextOpponent: "Fenerbahçe",
  streakType: "win",
  streakCount: 2,
};

export function MatchSummary({ matchData }: MatchSummaryProps) {
  const [showAllPredictions, setShowAllPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'standings'>('summary');

  const correctCount = predictionResults.predictions.filter(p => p.status === "correct").length;
  const wrongCount = predictionResults.predictions.filter(p => p.status === "wrong").length;
  const averageRecent = Math.round(recentMatches.reduce((sum, m) => sum + m.points, 0) / recentMatches.length);
  const performanceDiff = predictionResults.totalPoints - averageRecent;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            🏆 Tahmin Özeti
          </Text>
          {activeTab === 'summary' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'standings' && styles.tabActive]}
          onPress={() => setActiveTab('standings')}
        >
          <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
            📊 Takım Durumu
          </Text>
          {activeTab === 'standings' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'summary' ? (
          <>
            <Animated.View entering={isWeb ? undefined : FadeIn} style={styles.section}>
              <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']} style={styles.pointsCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Bu Maçtan Alınan Puanlar</Text>
                </View>
                <View style={styles.pointsSummary}>
                  <View style={styles.pointsRow}>
                    <View>
                      <Text style={styles.pointsLabel}>TOPLAM PUAN</Text>
                      <View style={styles.pointsValueContainer}>
                        <Text style={styles.pointsValue}>{predictionResults.totalPoints}</Text>
                        <Text style={styles.pointsMax}> / {predictionResults.maxPoints}</Text>
                      </View>
                    </View>
                    <View style={styles.successContainer}>
                      <Text style={styles.pointsLabel}>BAŞARI</Text>
                      <Text style={styles.successValue}>{predictionResults.successRate}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View entering={isWeb ? undefined : FadeIn.delay(200)} style={[styles.progressBar, { width: `${predictionResults.successRate}%` }]}>
                      <LinearGradient colors={['#059669', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    </Animated.View>
                  </View>
                </View>
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownValue}>{predictionResults.breakdown.matchPredictions}</Text>
                    <Text style={styles.breakdownLabel}>Maç Tahminleri</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownValue}>{predictionResults.breakdown.playerPredictions}</Text>
                    <Text style={styles.breakdownLabel}>Oyuncu Tahminleri</Text>
                  </View>
                  <View style={[styles.breakdownItem, styles.breakdownItemBonus]}>
                    <Text style={styles.breakdownValueBonus}>+{predictionResults.breakdown.bonusPoints}</Text>
                    <Text style={styles.breakdownLabel}>Bonus</Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownValue}>{predictionResults.breakdown.penalties}</Text>
                    <Text style={styles.breakdownLabel}>Ceza</Text>
                  </View>
                </View>
                <View style={styles.accuracyGrid}>
                  <View style={styles.accuracyItemCorrect}>
                    <View style={styles.accuracyIconRow}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" />
                      <Text style={styles.accuracyValueCorrect}>{correctCount}</Text>
                    </View>
                    <Text style={styles.accuracyLabel}>Doğru</Text>
                  </View>
                  <View style={styles.accuracyItem}>
                    <View style={styles.accuracyIconRow}>
                      <Ionicons name="close-circle" size={14} color="#64748B" />
                      <Text style={styles.accuracyValue}>{wrongCount}</Text>
                    </View>
                    <Text style={styles.accuracyLabel}>Yanlış</Text>
                  </View>
                  <View style={styles.accuracyItem}>
                    <View style={styles.accuracyIconRow}>
                      <View style={styles.emptyCircle} />
                      <Text style={styles.accuracyValue}>0</Text>
                    </View>
                    <Text style={styles.accuracyLabel}>Boş</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(100)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={20} color="#059669" />
                    <Text style={styles.sectionTitle}>Tahmin Analizi</Text>
                  </View>
                  {predictionResults.timingBonus.hasBonus && (
                    <View style={styles.bonusBadge}>
                      <Ionicons name="flash" size={12} color="#059669" />
                      <Text style={styles.bonusBadgeText}>+{predictionResults.timingBonus.bonusPoints} Erken Bonus</Text>
                    </View>
                  )}
                </View>
                <View style={styles.predictionsList}>
                  {predictionResults.predictions.slice(0, showAllPredictions ? undefined : 3).map((pred, index) => (
                    <Animated.View key={index} entering={isWeb ? undefined : FadeInLeft.delay(index * 50).springify()}>
                      <View style={[styles.predictionCard, pred.status === 'correct' ? styles.predictionCardCorrect : styles.predictionCardWrong]}>
                        <View style={styles.predictionContent}>
                          <View style={styles.predictionHeader}>
                            <Ionicons name={pred.status === 'correct' ? 'checkmark-circle' : 'close-circle'} size={18} color={pred.status === 'correct' ? '#059669' : '#64748B'} />
                            <Text style={styles.predictionName}>{pred.name}</Text>
                          </View>
                          <View style={styles.predictionDetails}>
                            <Text style={styles.predictionDetailText}>Tahmin: <Text style={styles.predictionDetailValue}>{pred.prediction}</Text></Text>
                            <Text style={styles.predictionDetailDot}>•</Text>
                            <Text style={styles.predictionDetailText}>Sonuç: <Text style={styles.predictionDetailValue}>{pred.actual}</Text></Text>
                          </View>
                          <Text style={styles.predictionExplanation}>{pred.explanation}</Text>
                        </View>
                        <Text style={[styles.predictionPoints, pred.status === 'correct' ? styles.predictionPointsCorrect : styles.predictionPointsWrong]}>
                          {pred.points > 0 ? `+${pred.points}` : '0'}
                        </Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
                {predictionResults.predictions.length > 3 && (
                  <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllPredictions(!showAllPredictions)}>
                    <Text style={styles.showMoreText}>{showAllPredictions ? 'Daha Az Göster' : `${predictionResults.predictions.length - 3} Tahmin Daha Göster`}</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.timingInfo}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.timingText}>Tahminler maçtan <Text style={styles.timingBold}>{predictionResults.timingBonus.predictionTime}</Text> yapıldı</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(200)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color="#059669" />
                  <Text style={styles.sectionTitle}>Kullanıcı Karşılaştırması</Text>
                </View>
                <View style={styles.comparisonCard}>
                  <Text style={styles.comparisonText}>
                    <Text style={styles.comparisonHighlight}>{userComparison.betterThan}%</Text> kullanıcıdan daha iyi performans gösterdin!
                  </Text>
                  <View style={styles.comparisonStats}>
                    <View style={styles.comparisonStatItem}>
                      <Text style={styles.comparisonStatLabel}>Sıralama</Text>
                      <Text style={styles.comparisonStatValue}>#{userComparison.userRank}</Text>
                      <Text style={styles.comparisonStatSub}>/ {userComparison.totalUsers.toLocaleString()}</Text>
                    </View>
                    <View style={styles.comparisonStatItem}>
                      <Text style={styles.comparisonStatLabel}>Ortalama</Text>
                      <Text style={styles.comparisonStatValue}>{userComparison.averagePoints}</Text>
                      <Text style={styles.comparisonStatSub}>puan</Text>
                    </View>
                    <View style={styles.comparisonStatItem}>
                      <Text style={styles.comparisonStatLabel}>En Yüksek</Text>
                      <Text style={styles.comparisonStatValueGold}>{userComparison.topPoints}</Text>
                      <Text style={styles.comparisonStatSub}>puan</Text>
                    </View>
                  </View>
                  <View style={styles.distribution}>
                    <Text style={styles.distributionTitle}>PUAN DAĞILIMI</Text>
                    {userComparison.distribution.map((dist, index) => {
                      const maxCount = Math.max(...userComparison.distribution.map(d => d.count));
                      const widthPercent = (dist.count / maxCount) * 100;
                      const isUserRange = index === 3;
                      return (
                        <View key={index} style={styles.distributionRow}>
                          <Text style={styles.distributionRange}>{dist.range}</Text>
                          <View style={styles.distributionBarContainer}>
                            <Animated.View entering={isWeb ? undefined : FadeIn.delay(300 + index * 50)} style={[styles.distributionBar, { width: `${widthPercent}%` }, isUserRange && styles.distributionBarUser]}>
                              {isUserRange && <LinearGradient colors={['#059669', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
                              {isUserRange && <Text style={styles.distributionUserLabel}>SEN</Text>}
                            </Animated.View>
                          </View>
                          <Text style={styles.distributionCount}>{dist.count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(300)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="ribbon" size={20} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Performans Etiketleri</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {performanceTags.map((tag, index) => (
                    <Animated.View key={index} entering={isWeb ? undefined : FadeIn.delay(350 + index * 100).springify()}>
                      <View style={styles.tag}>
                        <Text style={styles.tagIcon}>{tag.icon}</Text>
                        <Text style={styles.tagLabel}>{tag.label}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
                <Text style={styles.tagNote}>Bu etiketler performansına göre otomatik oluşturuldu ve profil istatistiklerinde görünecek</Text>
              </View>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(400)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trending-up" size={20} color="#059669" />
                  <Text style={styles.sectionTitle}>Geçmiş Performans</Text>
                </View>
                <View style={styles.performanceComparison}>
                  <View style={styles.performanceRow}>
                    <Text style={styles.performanceLabel}>Son 5 Maç Ortalaması</Text>
                    <Text style={styles.performanceValue}>{averageRecent} puan</Text>
                  </View>
                  <View style={styles.performanceRow}>
                    <Text style={styles.performanceLabel}>Bu Maç</Text>
                    <View style={styles.performanceValueRow}>
                      <Text style={styles.performanceValue}>{predictionResults.totalPoints} puan</Text>
                      <Text style={[styles.performanceDiff, performanceDiff > 0 ? styles.performanceDiffPositive : styles.performanceDiffNegative]}>
                        {performanceDiff > 0 ? '+' : ''}{performanceDiff}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.recentMatches}>
                  {recentMatches.map((match, index) => (
                    <View key={index} style={styles.recentMatchRow}>
                      <View style={styles.recentMatchLeft}>
                        <View style={[styles.recentMatchDot, match.points >= averageRecent && styles.recentMatchDotActive]} />
                        <Text style={styles.recentMatchOpponent}>{match.opponent}</Text>
                      </View>
                      <View style={styles.recentMatchRight}>
                        <Text style={styles.recentMatchDate}>{match.date}</Text>
                        <Text style={styles.recentMatchPoints}>{match.points}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.extremesGrid}>
                  <View style={styles.extremeItemBest}>
                    <Text style={styles.extremeLabel}>En İyi</Text>
                    <Text style={styles.extremeValueBest}>145</Text>
                  </View>
                  <View style={styles.extremeItem}>
                    <Text style={styles.extremeLabel}>En Düşük</Text>
                    <Text style={styles.extremeValue}>98</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyText}>🔒 Gizlilik: Diğer kullanıcıların tahminleri görünmez. Karşılaştırmalar anonim ve istatistikseldir.</Text>
            </View>
          </>
        ) : (
          <>
            <Animated.View entering={isWeb ? undefined : FadeIn} style={styles.section}>
              <LinearGradient colors={['#059669', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View>
                    <Text style={styles.heroLeague}>{teamStandings.league}</Text>
                    <Text style={styles.heroRank}>{teamStandings.rank}.</Text>
                    <Text style={styles.heroSubtext}>Sırada • {teamStandings.totalTeams} Takım</Text>
                  </View>
                  <View style={styles.heroIcon}>
                    <Ionicons name="shield" size={32} color="#FFF" />
                  </View>
                </View>
                <View style={styles.heroStatsGrid}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{teamStandings.stats.played}</Text>
                    <Text style={styles.heroStatLabel}>Maç</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{teamStandings.stats.won}</Text>
                    <Text style={styles.heroStatLabel}>Galibiyet</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{teamStandings.stats.draw}</Text>
                    <Text style={styles.heroStatLabel}>Beraberlik</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{teamStandings.stats.lost}</Text>
                    <Text style={styles.heroStatLabel}>Mağlubiyet</Text>
                  </View>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroGoalsGrid}>
                  <View style={styles.heroGoalItem}>
                    <Text style={styles.heroGoalLabel}>Atılan</Text>
                    <Text style={styles.heroGoalValue}>{teamStandings.stats.goalsFor}</Text>
                  </View>
                  <View style={styles.heroDividerVertical} />
                  <View style={styles.heroGoalItem}>
                    <Text style={styles.heroGoalLabel}>Averaj</Text>
                    <Text style={styles.heroGoalValueGold}>+{teamStandings.stats.goalDiff}</Text>
                  </View>
                  <View style={styles.heroDividerVertical} />
                  <View style={styles.heroGoalItem}>
                    <Text style={styles.heroGoalLabel}>Yenilen</Text>
                    <Text style={styles.heroGoalValue}>{teamStandings.stats.goalsAgainst}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(100)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.standingsHeader}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Puan Durumu</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeValue}>{teamStandings.stats.points}</Text>
                    <Text style={styles.pointsBadgeLabel}>Puan</Text>
                  </View>
                </View>
                <View style={styles.standingsTable}>
                  {[
                    { rank: 1, team: matchData.homeTeam.name, played: 17, won: 12, draw: 3, lost: 2, gd: 23, points: 39, isUser: true },
                    { rank: 2, team: "Fenerbahçe", played: 17, won: 11, draw: 4, lost: 2, gd: 19, points: 37, isUser: false },
                    { rank: 3, team: "Beşiktaş", played: 17, won: 10, draw: 5, lost: 2, gd: 15, points: 35, isUser: false },
                    { rank: 4, team: "Trabzonspor", played: 17, won: 9, draw: 4, lost: 4, gd: 8, points: 31, isUser: false },
                    { rank: 5, team: "Başakşehir", played: 17, won: 8, draw: 5, lost: 4, gd: 6, points: 29, isUser: false },
                  ].map((team, index) => (
                    <Animated.View key={index} entering={isWeb ? undefined : FadeInLeft.delay(100 + index * 50).springify()}>
                      <View style={[styles.standingRow, team.isUser && styles.standingRowUser]}>
                        <View style={[styles.standingRank, team.isUser && styles.standingRankUser]}>
                          <Text style={[styles.standingRankText, team.isUser && styles.standingRankTextUser]}>{team.rank}</Text>
                        </View>
                        <Text style={styles.standingTeam} numberOfLines={1}>{team.team}</Text>
                        <Text style={styles.standingStat}>{team.played}</Text>
                        <Text style={styles.standingStat}>{team.gd > 0 ? '+' : ''}{team.gd}</Text>
                        <Text style={styles.standingPoints}>{team.points}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
                <View style={styles.tableLegend}>
                  <Text style={styles.tableLegendText}>O: Oynanan</Text>
                  <Text style={styles.tableLegendDot}>•</Text>
                  <Text style={styles.tableLegendText}>A: Averaj</Text>
                  <Text style={styles.tableLegendDot}>•</Text>
                  <Text style={styles.tableLegendText}>P: Puan</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(200)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bar-chart" size={20} color="#059669" />
                  <Text style={styles.sectionTitle}>Form Durumu</Text>
                </View>
                <View style={styles.formContainer}>
                  <Text style={styles.formLabel}>Son 5 Maç</Text>
                  <View style={styles.formBadges}>
                    {teamStandings.form.map((result, index) => (
                      <View key={index} style={[styles.formBadge, result === 'W' && styles.formBadgeWin, result === 'D' && styles.formBadgeDraw, result === 'L' && styles.formBadgeLoss]}>
                        <Text style={[styles.formBadgeText, result === 'W' && styles.formBadgeTextWin, result === 'D' && styles.formBadgeTextDraw, result === 'L' && styles.formBadgeTextLoss]}>{result}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.streakCard}>
                  <Ionicons name="flame" size={24} color="#F59E0B" />
                  <View style={styles.streakContent}>
                    <Text style={styles.streakValue}>{teamStandings.streakCount} Maç</Text>
                    <Text style={styles.streakLabel}>Galibiyet Serisi</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={isWeb ? undefined : FadeInDown.delay(300)} style={styles.section}>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="home" size={20} color="#059669" />
                  <Text style={styles.sectionTitle}>İç Saha / Dış Saha</Text>
                </View>
                <View style={styles.venueStatsContainer}>
                  <View style={styles.venueCard}>
                    <View style={styles.venueHeader}>
                      <Ionicons name="home" size={16} color="#059669" />
                      <Text style={styles.venueTitle}>İç Saha</Text>
                    </View>
                    <View style={styles.venueStats}>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Maç</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.homeStats.played}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Galibiyet</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.homeStats.won}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Atılan</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.homeStats.goalsFor}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Yenilen</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.homeStats.goalsAgainst}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.venueCard}>
                    <View style={styles.venueHeader}>
                      <Ionicons name="airplane" size={16} color="#F59E0B" />
                      <Text style={styles.venueTitle}>Dış Saha</Text>
                    </View>
                    <View style={styles.venueStats}>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Maç</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.awayStats.played}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Galibiyet</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.awayStats.won}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Atılan</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.awayStats.goalsFor}</Text>
                      </View>
                      <View style={styles.venueStat}>
                        <Text style={styles.venueStatLabel}>Yenilen</Text>
                        <Text style={styles.venueStatValue}>{teamStandings.awayStats.goalsAgainst}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: 'rgba(100, 116, 139, 0.3)' },
  tab: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  tabTextActive: { color: '#059669' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#059669' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 16 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.3)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#F1F5F9' },
  pointsCard: { borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#F59E0B' },
  pointsSummary: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 8, padding: 16, marginBottom: 12 },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  pointsLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  pointsValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
  pointsValue: { fontSize: 32, fontWeight: 'bold', color: '#F59E0B' },
  pointsMax: { fontSize: 16, color: '#64748B' },
  successContainer: { alignItems: 'flex-end' },
  successValue: { fontSize: 24, fontWeight: 'bold', color: '#059669' },
  progressBarContainer: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%' },
  breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  breakdownItem: { flex: 1, minWidth: '47%', backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 12, alignItems: 'center' },
  breakdownItemBonus: { backgroundColor: 'rgba(5, 150, 105, 0.2)', borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.4)' },
  breakdownValue: { fontSize: 18, fontWeight: 'bold', color: '#F1F5F9', marginBottom: 4 },
  breakdownValueBonus: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 4 },
  breakdownLabel: { fontSize: 9, color: '#64748B', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  accuracyGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  accuracyItem: { flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 8, alignItems: 'center' },
  accuracyItemCorrect: { flex: 1, backgroundColor: 'rgba(5, 150, 105, 0.2)', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.4)' },
  accuracyIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  accuracyValue: { fontSize: 16, fontWeight: 'bold', color: '#F1F5F9' },
  accuracyValueCorrect: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  accuracyLabel: { fontSize: 8, color: '#64748B', textTransform: 'uppercase' },
  emptyCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(100, 116, 139, 0.4)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bonusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5, 150, 105, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bonusBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#059669' },
  predictionsList: { gap: 8 },
  predictionCard: { borderRadius: 8, padding: 12, borderWidth: 1, flexDirection: 'row', gap: 12 },
  predictionCardCorrect: { backgroundColor: 'rgba(5, 150, 105, 0.2)', borderColor: 'rgba(5, 150, 105, 0.4)' },
  predictionCardWrong: { backgroundColor: 'rgba(71, 85, 105, 0.3)', borderColor: 'rgba(100, 116, 139, 0.3)' },
  predictionContent: { flex: 1 },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  predictionName: { fontSize: 14, fontWeight: 'bold', color: '#F1F5F9', flex: 1 },
  predictionDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  predictionDetailText: { fontSize: 10, color: '#94A3B8' },
  predictionDetailValue: { fontWeight: '600', color: '#F1F5F9' },
  predictionDetailDot: { fontSize: 10, color: '#64748B' },
  predictionExplanation: { fontSize: 9, color: '#64748B', fontStyle: 'italic' },
  predictionPoints: { fontSize: 16, fontWeight: 'bold' },
  predictionPointsCorrect: { color: '#F59E0B' },
  predictionPointsWrong: { color: '#64748B' },
  showMoreButton: { marginTop: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  showMoreText: { fontSize: 10, fontWeight: 'bold', color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 },
  timingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  timingText: { fontSize: 10, color: '#64748B' },
  timingBold: { fontWeight: '600' },
  comparisonCard: { backgroundColor: 'rgba(5, 150, 105, 0.2)', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.4)' },
  comparisonText: { fontSize: 14, color: '#F1F5F9', marginBottom: 12 },
  comparisonHighlight: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  comparisonStats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  comparisonStatItem: { flex: 1, alignItems: 'center' },
  comparisonStatLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  comparisonStatValue: { fontSize: 16, fontWeight: 'bold', color: '#F1F5F9' },
  comparisonStatValueGold: { fontSize: 16, fontWeight: 'bold', color: '#F59E0B' },
  comparisonStatSub: { fontSize: 9, color: '#64748B' },
  distribution: { marginTop: 12 },
  distributionTitle: { fontSize: 9, color: '#64748B', fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  distributionRange: { fontSize: 9, color: '#64748B', width: 48 },
  distributionBarContainer: { flex: 1, height: 20, backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  distributionBar: { height: '100%', backgroundColor: 'rgba(100, 116, 139, 0.5)', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8 },
  distributionBarUser: {},
  distributionUserLabel: { fontSize: 8, fontWeight: 'bold', color: '#FFF' },
  distributionCount: { fontSize: 9, color: '#64748B', width: 32, textAlign: 'right' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(5, 150, 105, 0.2)', borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.4)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  tagIcon: { fontSize: 14 },
  tagLabel: { fontSize: 10, fontWeight: 'bold', color: '#F1F5F9' },
  tagNote: { fontSize: 9, color: '#64748B', fontStyle: 'italic' },
  performanceComparison: { backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 12, marginBottom: 12 },
  performanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  performanceLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  performanceValue: { fontSize: 14, fontWeight: 'bold', color: '#F1F5F9' },
  performanceValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  performanceDiff: { fontSize: 12, fontWeight: 'bold' },
  performanceDiffPositive: { color: '#059669' },
  performanceDiffNegative: { color: '#EF4444' },
  recentMatches: { gap: 6 },
  recentMatchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 8 },
  recentMatchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentMatchDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8' },
  recentMatchDotActive: { backgroundColor: '#10B981' },
  recentMatchOpponent: { fontSize: 11, color: '#F1F5F9' },
  recentMatchRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentMatchDate: { fontSize: 9, color: '#94A3B8' },
  recentMatchPoints: { fontSize: 12, fontWeight: 'bold', color: '#F1F5F9' },
  extremesGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  extremeItem: { flex: 1, backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 8, alignItems: 'center' },
  extremeItemBest: { flex: 1, backgroundColor: 'rgba(5, 150, 105, 0.2)', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(5, 150, 105, 0.4)' },
  extremeLabel: { fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 },
  extremeValue: { fontSize: 16, fontWeight: 'bold', color: '#F1F5F9' },
  extremeValueBest: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  privacyNote: { backgroundColor: 'rgba(71, 85, 105, 0.3)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.3)', borderStyle: 'dashed', borderRadius: 8, padding: 12 },
  privacyText: { fontSize: 9, color: '#64748B', textAlign: 'center', lineHeight: 14 },
  heroCard: { borderRadius: 16, padding: 24 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLeague: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4 },
  heroRank: { fontSize: 40, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  heroSubtext: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  heroStatsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  heroStatLabel: { fontSize: 9, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginVertical: 16 },
  heroGoalsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroGoalItem: { flex: 1, alignItems: 'center' },
  heroGoalLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4 },
  heroGoalValue: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  heroGoalValueGold: { fontSize: 24, fontWeight: 'bold', color: '#F59E0B' },
  heroDividerVertical: { width: 1, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  standingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pointsBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pointsBadgeValue: { fontSize: 18, fontWeight: 'bold', color: '#F59E0B' },
  pointsBadgeLabel: { fontSize: 10, color: '#64748B' },
  standingsTable: { gap: 6 },
  standingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, backgroundColor: 'rgba(71, 85, 105, 0.3)' },
  standingRowUser: { backgroundColor: 'rgba(5, 150, 105, 0.2)', borderLeftWidth: 3, borderLeftColor: '#10B981' },
  standingRank: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(71, 85, 105, 0.5)', justifyContent: 'center', alignItems: 'center' },
  standingRankUser: { backgroundColor: '#10B981' },
  standingRankText: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  standingRankTextUser: { color: '#FFF' },
  standingTeam: { flex: 1, fontSize: 12, fontWeight: '600', color: '#F1F5F9' },
  standingStat: { fontSize: 12, fontWeight: '600', color: '#94A3B8', width: 32, textAlign: 'center' },
  standingPoints: { fontSize: 14, fontWeight: 'bold', color: '#F1F5F9', width: 32, textAlign: 'center' },
  tableLegend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  tableLegendText: { fontSize: 10, color: '#64748B' },
  tableLegendDot: { fontSize: 10, color: '#64748B' },
  formContainer: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  formBadges: { flexDirection: 'row', gap: 6 },
  formBadge: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  formBadgeWin: { backgroundColor: 'rgba(5, 150, 105, 0.1)', borderColor: '#059669' },
  formBadgeDraw: { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#94A3B8' },
  formBadgeLoss: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' },
  formBadgeText: { fontSize: 14, fontWeight: 'bold' },
  formBadgeTextWin: { color: '#059669' },
  formBadgeTextDraw: { color: '#94A3B8' },
  formBadgeTextLoss: { color: '#EF4444' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  streakContent: { flex: 1 },
  streakValue: { fontSize: 18, fontWeight: 'bold', color: '#F1F5F9', marginBottom: 2 },
  streakLabel: { fontSize: 12, color: '#94A3B8' },
  venueStatsContainer: { gap: 12 },
  venueCard: { backgroundColor: 'rgba(71, 85, 105, 0.3)', borderRadius: 8, padding: 12 },
  venueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  venueTitle: { fontSize: 14, fontWeight: 'bold', color: '#F1F5F9' },
  venueStats: { flexDirection: 'row', gap: 12 },
  venueStat: { flex: 1, alignItems: 'center' },
  venueStatLabel: { fontSize: 10, color: '#94A3B8', marginBottom: 4 },
  venueStatValue: { fontSize: 16, fontWeight: 'bold', color: '#F1F5F9' },
});
