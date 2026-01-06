// MatchPredictionScreen.tsx - React Native FULL COMPLETE VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Path, 
} from 'react-native-svg';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

interface MatchPredictionScreenProps {
  matchData: any;
}

// Mock Formation Data
const mockFormation = {
  id: '4-3-3',
  name: '4-3-3 (Atak)',
  positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW'],
};

// Mock Players with Full Details
const mockPlayers = [
  { 
    id: 1, 
    name: 'Muslera', 
    position: 'GK', 
    rating: 85, 
    number: 1, 
    form: 92,
    stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40, defending: 25, physical: 78 }
  },
  { 
    id: 5, 
    name: 'Kazımcan', 
    position: 'LB', 
    rating: 78, 
    number: 5, 
    form: 78,
    stats: { pace: 82, shooting: 60, passing: 75, dribbling: 78, defending: 76, physical: 72 }
  },
  { 
    id: 3, 
    name: 'Nelsson', 
    position: 'CB', 
    rating: 80, 
    number: 3, 
    form: 85,
    stats: { pace: 65, shooting: 40, passing: 70, dribbling: 55, defending: 84, physical: 82 }
  },
  { 
    id: 4, 
    name: 'Abdülkerim', 
    position: 'CB', 
    rating: 79, 
    number: 4, 
    form: 82,
    stats: { pace: 70, shooting: 45, passing: 72, dribbling: 60, defending: 83, physical: 80 }
  },
  { 
    id: 2, 
    name: 'Dubois', 
    position: 'RB', 
    rating: 82, 
    number: 2, 
    form: 80,
    stats: { pace: 85, shooting: 65, passing: 78, dribbling: 75, defending: 77, physical: 74 }
  },
  { 
    id: 12, 
    name: 'Oliveira', 
    position: 'CM', 
    rating: 77, 
    number: 8, 
    form: 76,
    stats: { pace: 72, shooting: 70, passing: 80, dribbling: 75, defending: 68, physical: 70 }
  },
  { 
    id: 7, 
    name: 'Sara', 
    position: 'CM', 
    rating: 81, 
    number: 20, 
    form: 84,
    stats: { pace: 78, shooting: 75, passing: 85, dribbling: 82, defending: 72, physical: 76 }
  },
  { 
    id: 15, 
    name: 'Demirbay', 
    position: 'CM', 
    rating: 79, 
    number: 17, 
    form: 85,
    stats: { pace: 70, shooting: 78, passing: 84, dribbling: 76, defending: 65, physical: 68 }
  },
  { 
    id: 8, 
    name: 'Zaha', 
    position: 'LW', 
    rating: 84, 
    number: 14, 
    form: 88,
    stats: { pace: 88, shooting: 82, passing: 78, dribbling: 90, defending: 42, physical: 76 }
  },
  { 
    id: 11, 
    name: 'Icardi', 
    position: 'ST', 
    rating: 85, 
    number: 9, 
    form: 88,
    stats: { pace: 78, shooting: 92, passing: 75, dribbling: 82, defending: 35, physical: 80 }
  },
  { 
    id: 10, 
    name: 'Barış Alper', 
    position: 'RW', 
    rating: 80, 
    number: 7, 
    form: 82,
    stats: { pace: 86, shooting: 78, passing: 75, dribbling: 84, defending: 40, physical: 72 }
  },
];

// Substitute Players
const substitutePlayers = [
  { id: 101, name: 'Günay', position: 'GK', rating: 72, number: 25 },
  { id: 102, name: 'Boey', position: 'RB', rating: 76, number: 93 },
  { id: 103, name: 'Sanchez', position: 'CB', rating: 78, number: 6 },
  { id: 104, name: 'Torreira', position: 'CM', rating: 79, number: 34 },
  { id: 105, name: 'Mertens', position: 'CAM', rating: 80, number: 10 },
  { id: 106, name: 'Tetê', position: 'RW', rating: 77, number: 11 },
  { id: 107, name: 'Batshuayi', position: 'ST', rating: 78, number: 23 },
];

// Formation Positions
const mockPositions = [
  { x: 50, y: 82 }, // GK - moved higher
  { x: 10, y: 64 }, { x: 35, y: 66 }, { x: 65, y: 66 }, { x: 90, y: 64 }, // Defense - V, wider
  { x: 25, y: 42 }, { x: 50, y: 44 }, { x: 75, y: 42 }, // Midfield - V, wider
  { x: 10, y: 16 }, { x: 50, y: 10 }, { x: 90, y: 16 }, // Attack - V, wider
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

export const MatchPrediction: React.FC<MatchPredictionScreenProps> = ({
  matchData,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [playerPredictions, setPlayerPredictions] = useState<{[key: number]: any}>({});
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [substituteType, setSubstituteType] = useState<'normal' | 'injury'>('normal');
  const [substituteForPlayer, setSubstituteForPlayer] = useState<typeof mockPlayers[0] | null>(null);
  
  // Match predictions state - COMPLETE
  const [predictions, setPredictions] = useState({
    firstHalfHomeScore: null as number | null,
    firstHalfAwayScore: null as number | null,
    firstHalfInjuryTime: null as string | null,
    secondHalfHomeScore: null as number | null,
    secondHalfAwayScore: null as number | null,
    secondHalfInjuryTime: null as string | null,
    totalGoals: null as string | null,
    firstGoalTime: null as string | null,
    yellowCards: null as string | null,
    redCards: null as string | null,
    possession: '50' as string,
    totalShots: null as string | null,
    shotsOnTarget: null as string | null,
    totalCorners: null as string | null,
    tempo: null as string | null,
    scenario: null as string | null,
  });

  const handlePlayerPredictionChange = (category: string, value: string | boolean) => {
    if (!selectedPlayer) return;
    
    setPlayerPredictions(prev => {
      const currentPredictions = prev[selectedPlayer.id] || {};
      const newPredictions = {
        ...currentPredictions,
        [category]: currentPredictions[category] === value ? null : value
      };
      
      // ✅ 2. Sarıdan Kırmızı seçilirse, otomatik Sarı Kart da seçilsin
      if (category === 'secondYellowRed' && value === true) {
        newPredictions.yellowCard = true;
      }
      
      return {
        ...prev,
        [selectedPlayer.id]: newPredictions
      };
    });
  };

  const handlePredictionChange = (category: string, value: string | number) => {
    setPredictions(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === value ? null : value
    }));
  };

  const handleScoreChange = (category: 'firstHalfHomeScore' | 'firstHalfAwayScore' | 'secondHalfHomeScore' | 'secondHalfAwayScore', value: number) => {
    setPredictions(prev => ({
      ...prev,
      [category]: prev[category] === value ? null : value
    }));
  };

  const currentPlayerPredictions = selectedPlayer ? playerPredictions[selectedPlayer.id] || {} : {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Football Field with Players */}
        <FootballField style={styles.mainField}>
          <View style={styles.playersContainer}>
            {mockPositions.map((pos, index) => {
              const player = mockPlayers[index];
              const positionLabel = mockFormation.positions[index] || '';
              const hasPredictions = playerPredictions[player.id] && 
                Object.keys(playerPredictions[player.id]).length > 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.playerSlot,
                    { left: `${pos.x}%`, top: `${pos.y}%` },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.playerCard,
                      hasPredictions && styles.playerCardPredicted,
                    ]}
                    onPress={() => setSelectedPlayer(player)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#1E293B', '#0F172A']}
                      style={styles.playerCardGradient}
                    >
                      {/* Prediction Alert - Top Right */}
                      {hasPredictions && (
                        <View style={styles.alertBadge}>
                          <View style={styles.alertDot} />
                        </View>
                      )}

                      {/* Rating Badge - Top Center - BIG */}
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{player.rating}</Text>
                      </View>

                      {/* Player Name - Center */}
                      <Text style={styles.playerName} numberOfLines={2} ellipsizeMode="tail">
                        {player.name}
                      </Text>

                      {/* Position - Bottom */}
                      <Text style={styles.playerPosition}>{player.position}</Text>

                      {/* Prediction glow effect */}
                      {hasPredictions && <View style={styles.predictionGlow} />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </FootballField>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>
            Tahmin yapmak için oyuncu kartlarına tıklayın ve ekranı aşağı kaydırın
          </Text>
        </View>

        {/* PREDICTION CATEGORIES - COMPLETE */}
        <View style={styles.predictionsSection}>
          {/* 1. İlk Yarı Tahminleri */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⏱️ İlk Yarı Tahminleri</Text>
            
            {/* İlk Yarı Skoru */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⚽ İlk Yarı Skoru</Text>
              <Text style={styles.categoryHint}>Ev sahibi - Deplasman</Text>
              
              <View style={styles.scorePickerContainer}>
                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Ev Sahibi Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.firstHalfHomeScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('firstHalfHomeScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.firstHalfHomeScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.scoreSeparator}>
                  <Text style={styles.scoreSeparatorText}>-</Text>
                </View>

                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Deplasman Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.firstHalfAwayScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('firstHalfAwayScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.firstHalfAwayScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* İlk Yarı Uzatma Süresi */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⏱️ İlk Yarı Uzatma Süresi</Text>
              <View style={styles.buttonRow}>
                {['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5+ dk'].map((time) => (
                  <TouchableOpacity 
                    key={time} 
                    style={[
                      styles.optionButton,
                      predictions.firstHalfInjuryTime === time && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('firstHalfInjuryTime', time)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.firstHalfInjuryTime === time && styles.optionTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 2. Maç Sonu Tahminleri */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⏱️ Maç Sonu Tahminleri</Text>
            
            {/* Maç Sonu Skoru */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⚽ Maç Sonu Skoru</Text>
              <Text style={styles.categoryHint}>Ev sahibi - Deplasman</Text>
              
              <View style={styles.scorePickerContainer}>
                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Ev Sahibi Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.secondHalfHomeScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('secondHalfHomeScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.secondHalfHomeScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.scoreSeparator}>
                  <Text style={styles.scoreSeparatorText}>-</Text>
                </View>

                <View style={styles.scorePickerColumn}>
                  <Text style={styles.scorePickerLabel}>Deplasman Golü</Text>
                  <View style={styles.scoreButtons}>
                    {[0, 1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={[
                          styles.scoreButton,
                          predictions.secondHalfAwayScore === score && styles.scoreButtonActive
                        ]}
                        onPress={() => handleScoreChange('secondHalfAwayScore', score)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.scoreButtonText,
                          predictions.secondHalfAwayScore === score && styles.scoreButtonTextActive
                        ]}>
                          {score === 5 ? '5+' : score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* İkinci Yarı Uzatma Süresi */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⏱️ İkinci Yarı Uzatma Süresi</Text>
              <View style={styles.buttonRow}>
                {['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5+ dk'].map((time) => (
                  <TouchableOpacity 
                    key={time} 
                    style={[
                      styles.optionButton,
                      predictions.secondHalfInjuryTime === time && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('secondHalfInjuryTime', time)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.secondHalfInjuryTime === time && styles.optionTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 3. Toplam Gol Sayısı */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🧮 Toplam Gol Sayısı</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⚽ Toplam Gol Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-1 gol', '2-3 gol', '4-5 gol', '6+ gol'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.totalGoals === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalGoals', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.totalGoals === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 4. İlk Gol Zamanı */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⏰ İlk Gol Zamanı</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⏰ İlk Gol Zamanı</Text>
              <View style={styles.buttonGrid}>
                {['1-15 dk', '16-30 dk', '31-45 dk', '46-60 dk', '61-75 dk', '76-90+ dk'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButtonGrid,
                      predictions.firstGoalTime === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('firstGoalTime', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.firstGoalTime === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 5. Disiplin Tahminleri */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🟨🟥 Disiplin Tahminleri</Text>
            
            {/* Toplam Sarı Kart */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🟨 Toplam Sarı Kart Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-2', '3-4', '5-6', '7+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.yellowCards === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('yellowCards', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.yellowCards === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toplam Kırmızı Kart */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🟥 Toplam Kırmızı Kart Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0', '1', '2', '3+'].map((count) => (
                  <TouchableOpacity 
                    key={count} 
                    style={[
                      styles.optionButton,
                      predictions.redCards === count && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('redCards', count)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.redCards === count && styles.optionTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 6. Oyun Kontrolü - Topa Sahip Olma */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>📊 Oyun Kontrolü – Topa Sahip Olma</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🔵 Ev Sahibi / Deplasman Topa Sahip Olma (%)</Text>
              
              {/* Display Values */}
              <View style={styles.possessionDisplay}>
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>Ev Sahibi</Text>
                  <Text style={styles.possessionTeamValue}>
                    {predictions.possession}%
                  </Text>
                </View>
                
                <Text style={styles.possessionVs}>vs</Text>
                
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>Deplasman</Text>
                  <Text style={styles.possessionTeamValue}>
                    {100 - parseInt(predictions.possession)}%
                  </Text>
                </View>
              </View>

              {/* Slider */}
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={30}
                  maximumValue={70}
                  step={5}
                  value={parseInt(predictions.possession)}
                  onValueChange={(value) => handlePredictionChange('possession', value.toString())}
                  minimumTrackTintColor="#059669"
                  maximumTrackTintColor="rgba(100, 116, 139, 0.3)"
                  thumbTintColor="#FFFFFF"
                />
                
                {/* Labels */}
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelLeft}>← Ev Sahibi Üstünlüğü</Text>
                  <Text style={styles.sliderLabelRight}>Deplasman Üstünlüğü →</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 7. Toplam ve İsabetli Şut Sayıları */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🎯 Toplam ve İsabetli Şut Sayıları</Text>
            
            {/* Toplam Şut Sayısı */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>⚽ Toplam Şut Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-10', '11-20', '21-30', '31+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.totalShots === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalShots', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.totalShots === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* İsabetli Şut Sayısı */}
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🎯 İsabetli Şut Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-5', '6-10', '11-15', '16+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.shotsOnTarget === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('shotsOnTarget', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.shotsOnTarget === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 8. Toplam Korner Aralığı */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⚽ Toplam Korner Aralığı</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🚩 Toplam Korner Sayısı</Text>
              <View style={styles.buttonRow}>
                {['0-6', '7-12', '12+'].map((range) => (
                  <TouchableOpacity 
                    key={range} 
                    style={[
                      styles.optionButton,
                      predictions.totalCorners === range && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('totalCorners', range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.totalCorners === range && styles.optionTextActive
                    ]}>
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 9. Maçın Genel Temposu */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>⚡ Maçın Genel Temposu</Text>
            
            <View style={styles.categoryCard}>
              <Text style={styles.categoryLabel}>🏃‍♂️ Oyun Hızı / Tempo</Text>
              <View style={styles.buttonRow}>
                {['Düşük tempo', 'Orta tempo', 'Yüksek tempo'].map((tempo) => (
                  <TouchableOpacity 
                    key={tempo} 
                    style={[
                      styles.optionButton,
                      predictions.tempo === tempo && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('tempo', tempo)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      predictions.tempo === tempo && styles.optionTextActive
                    ]}>
                      {tempo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 10. Maç Senaryosu */}
          <View style={styles.predictionCategory}>
            <Text style={styles.categoryTitle}>🧠 Maç Senaryosu (Makro)</Text>
            
            <View style={styles.categoryCard}>
              <View style={styles.buttonGrid}>
                {[
                  'Kontrollü oyun',
                  'Baskılı oyun',
                  'Geçiş oyunu ağırlıklı',
                  'Duran toplar belirleyici olur'
                ].map((scenario) => (
                  <TouchableOpacity 
                    key={scenario} 
                    style={[
                      styles.optionButtonGrid,
                      predictions.scenario === scenario && styles.optionButtonActive
                    ]}
                    onPress={() => handlePredictionChange('scenario', scenario)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionTextSmall,
                      predictions.scenario === scenario && styles.optionTextActive
                    ]}>
                      {scenario}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Tahminleri Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Player Prediction Modal */}
      {selectedPlayer && (
        <PlayerPredictionModal
          player={selectedPlayer}
          predictions={currentPlayerPredictions}
          onClose={() => setSelectedPlayer(null)}
          onPredictionChange={handlePlayerPredictionChange}
          onOpenSubstitute={(type) => {
            setSubstituteType(type);
            setSubstituteForPlayer(selectedPlayer);
            setShowSubstituteModal(true);
          }}
        />
      )}

      {/* Substitute Selection Modal */}
      <SubstituteModal
        visible={showSubstituteModal}
        players={substitutePlayers}
        type={substituteType}
        playerName={substituteForPlayer?.name || ''}
        selectedSubstitute={
          substituteForPlayer && substituteType === 'normal' 
            ? playerPredictions[substituteForPlayer.id]?.substitutePlayer 
            : substituteForPlayer 
              ? playerPredictions[substituteForPlayer.id]?.injurySubstitutePlayer
              : null
        }
        onSelect={(playerId) => {
          if (!substituteForPlayer) return;
          
          const category = substituteType === 'normal' ? 'substitutePlayer' : 'injurySubstitutePlayer';
          
          // Update predictions for the specific player
          setPlayerPredictions(prev => ({
            ...prev,
            [substituteForPlayer.id]: {
              ...(prev[substituteForPlayer.id] || {}),
              [category]: playerId.toString()
            }
          }));
          
          setShowSubstituteModal(false);
        }}
        onClose={() => setShowSubstituteModal(false)}
      />
    </SafeAreaView>
  );
};

// Player Prediction Modal Component - FULL
const PlayerPredictionModal = ({ 
  player, 
  predictions, 
  onClose, 
  onPredictionChange,
  onOpenSubstitute,
}: any) => (
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
        style={styles.playerModalContent}
      >
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.playerModalHeader}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.playerModalInfo}>
            <View style={styles.playerNumberCircle}>
              <Text style={styles.playerNumberLarge}>{player.number}</Text>
              <View style={styles.playerRatingCircle}>
                <Text style={styles.playerRatingSmall}>{player.rating}</Text>
              </View>
            </View>

            <View style={styles.playerDetails}>
              <Text style={styles.playerNameLarge}>{player.name}</Text>
              <Text style={styles.playerPosition}>
                {player.position} • Form: <Text style={styles.formText}>{player.form}%</Text>
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.playerPredictionsScroll}
          contentContainerStyle={styles.playerPredictionsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Gol Atar */}
          <View style={styles.predictionGroup}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.willScore && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('willScore', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.willScore && styles.predictionButtonTextActive,
              ]}>
                ⚽ Gol Atar
              </Text>
            </TouchableOpacity>

            <View style={styles.subOptions}>
              <Text style={styles.subOptionsLabel}>Kaç gol?</Text>
              <View style={styles.subOptionsRow}>
                {['1', '2', '3+'].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.subOptionButton,
                      predictions.goalCount === count && styles.subOptionButtonActive,
                    ]}
                    onPress={() => onPredictionChange('goalCount', count)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.subOptionText,
                      predictions.goalCount === count && styles.subOptionTextActive,
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Asist Yapar */}
          <View style={styles.predictionGroup}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.willAssist && styles.predictionButtonActive,
              ]}
              onPress={() => onPredictionChange('willAssist', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.willAssist && styles.predictionButtonTextActive,
              ]}>
                🅰️ Asist Yapar
              </Text>
            </TouchableOpacity>

            <View style={styles.subOptions}>
              <Text style={styles.subOptionsLabel}>Kaç asist?</Text>
              <View style={styles.subOptionsRow}>
                {['1', '2', '3+'].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.subOptionButton,
                      predictions.assistCount === count && styles.subOptionButtonActive,
                    ]}
                    onPress={() => onPredictionChange('assistCount', count)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.subOptionText,
                      predictions.assistCount === count && styles.subOptionTextActive,
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Sarı Kart */}
          <TouchableOpacity
            style={[
              styles.predictionButton,
              predictions.yellowCard && styles.predictionButtonActive,
            ]}
            onPress={() => onPredictionChange('yellowCard', true)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.predictionButtonText,
              predictions.yellowCard && styles.predictionButtonTextActive,
            ]}>
              🟨 Sarı Kart Görür
            </Text>
          </TouchableOpacity>

          {/* 2. Sarıdan Kırmızı */}
          <TouchableOpacity
            style={[
              styles.predictionButton,
              predictions.secondYellowRed && styles.predictionButtonActive,
            ]}
            onPress={() => onPredictionChange('secondYellowRed', true)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.predictionButtonText,
              predictions.secondYellowRed && styles.predictionButtonTextActive,
            ]}>
              🟨🟥 2. Sarıdan Kırmızı
            </Text>
          </TouchableOpacity>

          {/* Direkt Kırmızı */}
          <TouchableOpacity
            style={[
              styles.predictionButton,
              predictions.directRedCard && styles.predictionButtonActive,
            ]}
            onPress={() => onPredictionChange('directRedCard', true)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.predictionButtonText,
              predictions.directRedCard && styles.predictionButtonTextActive,
            ]}>
              🟥 Direkt Kırmızı Kart
            </Text>
          </TouchableOpacity>

          {/* Oyundan Çıkar */}
          <View style={styles.predictionGroup}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.substitutedOut && styles.predictionButtonActive,
              ]}
              onPress={() => {
                onPredictionChange('substitutedOut', true);
                onOpenSubstitute('normal');
              }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.substitutedOut && styles.predictionButtonTextActive,
              ]}>
                {predictions.substitutePlayer ? (
                  `🔄 ${player.name} çıkar - ${substitutePlayers.find(p => p.id.toString() === predictions.substitutePlayer)?.name} girer`
                ) : (
                  '🔄 Oyundan Çıkar'
                )}
              </Text>
            </TouchableOpacity>

            {predictions.substitutePlayer && (
              <View style={styles.selectedSubstitute}>
                <TouchableOpacity onPress={() => onOpenSubstitute('normal')}>
                  <Text style={styles.changeSubstituteButton}>Değiştir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sakatlanarak Çıkar */}
          <View style={styles.predictionGroup}>
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.injuredOut && styles.predictionButtonActive,
              ]}
              onPress={() => {
                onPredictionChange('injuredOut', true);
                onOpenSubstitute('injury');
              }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.injuredOut && styles.predictionButtonTextActive,
              ]}>
                {predictions.injurySubstitutePlayer ? (
                  `🚑 ${player.name} çıkar - ${substitutePlayers.find(p => p.id.toString() === predictions.injurySubstitutePlayer)?.name} girer`
                ) : (
                  '🚑 Sakatlanarak Çıkar'
                )}
              </Text>
            </TouchableOpacity>

            {predictions.injurySubstitutePlayer && (
              <View style={styles.selectedSubstitute}>
                <TouchableOpacity onPress={() => onOpenSubstitute('injury')}>
                  <Text style={styles.changeSubstituteButton}>Değiştir</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.playerModalActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>İptal Et</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  </Modal>
);

// Substitute Selection Modal - FULL
const SubstituteModal = ({ visible, players, type, playerName, selectedSubstitute, onSelect, onClose }: any) => (
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
        style={styles.substituteModalContent}
      >
        <View style={styles.substituteModalHeader}>
          <View>
            <Text style={styles.substituteModalTitle}>
              {type === 'normal' ? 'Yerine Kim Girer?' : 'Sakatlık Yedeği'}
            </Text>
            {playerName && (
              <Text style={styles.substituteModalSubtitle}>
                {playerName} için yedek seçin
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isSelected = selectedSubstitute === item.id.toString();
            
            return (
              <TouchableOpacity
                style={[
                  styles.substituteItem,
                  isSelected && styles.substituteItemSelected
                ]}
                onPress={() => onSelect(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.substituteItemLeft}>
                  <View style={styles.substituteNumber}>
                    <Text style={styles.substituteNumberText}>{item.number}</Text>
                  </View>
                  <View style={styles.substituteInfo}>
                    <Text style={styles.substituteName}>{item.name}</Text>
                    <Text style={styles.substitutePosition}>
                      {item.position} • {item.rating}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"} 
                  size={24} 
                  color={isSelected ? "#059669" : "#6B7280"} 
                />
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.substituteList}
        />
      </Animated.View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  
  // Football Field
  fieldContainer: {
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
    marginTop: 16,
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
  playersContainer: {
    flex: 1,
    position: 'relative',
  },
  mainField: {
    marginBottom: 16,
  },
  
  // Player Slot
  playerSlot: {
    position: 'absolute',
    transform: [{ translateX: -36 }, { translateY: -42 }],
    zIndex: 1,
  },
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
  playerCardPredicted: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  playerCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    padding: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.5)',
  },
  predictionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
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
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
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
  
  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    flex: 1,
  },
  
  // Predictions Section
  predictionsSection: {
    padding: 16,
    gap: 24,
  },
  predictionCategory: {
    gap: 12,
  },
  categoryTitle: {
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
    borderColor: 'rgba(5, 150, 105, 0.3)',
    gap: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Score Picker
  scorePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scorePickerColumn: {
    flex: 1,
    gap: 8,
  },
  scorePickerLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scoreButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  scoreButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  scoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  scoreButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scoreSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSeparatorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  
  // Button Rows & Grids
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 60,
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  optionButtonGrid: {
    width: '48%',
    height: 48,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  optionButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    transform: [{ scale: 1.05 }],
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  optionTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  // Possession Slider
  possessionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  possessionTeam: {
    flex: 1,
    alignItems: 'center',
  },
  possessionTeamLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  possessionTeamValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
  },
  possessionVs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
    paddingHorizontal: 16,
  },
  sliderContainer: {
    gap: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelLeft: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  sliderLabelRight: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  
  // Submit Button
  submitButton: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Player Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  playerModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  playerModalHeader: {
    padding: 16,
    paddingBottom: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    zIndex: 10,
  },
  playerModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerNumberCircle: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerNumberLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerRatingCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  playerRatingSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerPosition: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  formText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  
  // Player Predictions
  playerPredictionsScroll: {
    flex: 1,
  },
  playerPredictionsContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  predictionGroup: {
    gap: 8,
  },
  predictionButton: {
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  predictionButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    transform: [{ scale: 1.02 }],
  },
  predictionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionButtonTextActive: {
    fontWeight: 'bold',
  },
  subOptions: {
    paddingLeft: 12,
    gap: 6,
  },
  subOptionsLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  subOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subOptionButton: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  subOptionButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  subOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  subOptionTextActive: {
    color: '#FFFFFF',
  },
  selectedSubstitute: {
    paddingLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    gap: 6,
  },
  selectedSubstituteLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  selectedSubstituteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSubstituteValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  changeSubstituteButton: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  
  // Player Modal Actions
  playerModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E293B',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Substitute Modal
  substituteModalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
  },
  substituteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  substituteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  substituteModalSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  substituteList: {
    paddingBottom: 20,
  },
  substituteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  substituteItemSelected: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  substituteItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  substituteNumber: {
    width: 40,
    height: 40,
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
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substitutePosition: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
