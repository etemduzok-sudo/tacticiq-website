/**
 * MatchPrediction - PREMIUM ELİT TASARIM v2
 * Minimalist slider'lar + Kombine konteynerlar
 */
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
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { PITCH_LAYOUT } from '../../config/constants';
import { formatPlayerDisplayName } from '../../utils/playerNameUtils';

const { width } = Dimensions.get('window');

// Web için slider polyfill veya native slider
const SliderComponent = Platform.OS === 'web' 
  ? ({ value, onValueChange, minimumValue, maximumValue, step, minimumTrackTintColor, maximumTrackTintColor, thumbTintColor, style }: any) => {
      return (
        <input
          type="range"
          min={minimumValue}
          max={maximumValue}
          step={step}
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            height: 8,
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, ${minimumTrackTintColor} 0%, ${minimumTrackTintColor} ${(value / maximumValue) * 100}%, ${maximumTrackTintColor} ${(value / maximumValue) * 100}%, ${maximumTrackTintColor} 100%)`,
            borderRadius: 4,
            cursor: 'pointer',
            ...style,
          }}
        />
      );
    }
  : require('@react-native-community/slider').default;

// Premium Football Field
const FootballField = ({ children, style }: any) => (
  <View style={[styles.fieldContainer, style]}>
    <LinearGradient
      colors={['#0D4A2B', '#15803D', '#22C55E', '#15803D', '#0D4A2B']}
      locations={[0, 0.2, 0.5, 0.8, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.fieldGradient}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 150" preserveAspectRatio="none" style={styles.fieldSvg}>
        <Defs>
          <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="white" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="75" r="25" fill="url(#centerGlow)" />
        <Rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" rx="2" />
        <Line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
        <Circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
        <Circle cx="50" cy="75" r="1.5" fill="rgba(255,255,255,0.5)" />
        <Rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" rx="1" />
        <Rect x="35" y="3" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
        <Circle cx="50" cy="16" r="1" fill="rgba(255,255,255,0.4)" />
        <Rect x="22" y="125" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" rx="1" />
        <Rect x="35" y="139" width="30" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
        <Circle cx="50" cy="134" r="1" fill="rgba(255,255,255,0.4)" />
      </Svg>
      {children}
    </LinearGradient>
  </View>
);

// Mock pozisyonlar (4-3-3)
const mockPositions = [
  { x: 50, y: 90 },
  { x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 },
  { x: 30, y: 52 }, { x: 50, y: 48 }, { x: 70, y: 52 },
  { x: 22, y: 28 }, { x: 50, y: 22 }, { x: 78, y: 28 },
];

const mockPlayers = [
  { name: 'Muslera', number: 1, rating: 85, position: 'GK' },
  { name: 'Boey', number: 2, rating: 78, position: 'RB' },
  { name: 'Nelsson', number: 4, rating: 82, position: 'CB' },
  { name: 'Bardakçı', number: 42, rating: 80, position: 'CB' },
  { name: 'Angeliño', number: 19, rating: 81, position: 'LB' },
  { name: 'Torreira', number: 34, rating: 83, position: 'CDM' },
  { name: 'Mertens', number: 14, rating: 84, position: 'CAM' },
  { name: 'Ziyech', number: 10, rating: 82, position: 'CM' },
  { name: 'Akgün', number: 11, rating: 79, position: 'LW' },
  { name: 'Icardi', number: 9, rating: 86, position: 'ST' },
  { name: 'Yılmaz', number: 17, rating: 77, position: 'RW' },
];

// Kategori renk şeması
const CARD_THEMES = {
  firstHalf: { bg: 'rgba(251, 191, 36, 0.08)', border: '#F59E0B', accent: '#FBBF24', glow: 'rgba(251, 191, 36, 0.25)' },
  fullTime: { bg: 'rgba(139, 92, 246, 0.08)', border: '#8B5CF6', accent: '#A78BFA', glow: 'rgba(139, 92, 246, 0.25)' },
  goal: { bg: 'rgba(16, 185, 129, 0.08)', border: '#10B981', accent: '#34D399', glow: 'rgba(16, 185, 129, 0.25)' },
  card: { bg: 'rgba(239, 68, 68, 0.08)', border: '#EF4444', accent: '#F87171', glow: 'rgba(239, 68, 68, 0.25)' },
  control: { bg: 'rgba(59, 130, 246, 0.08)', border: '#3B82F6', accent: '#60A5FA', glow: 'rgba(59, 130, 246, 0.25)' },
  tactical: { bg: 'rgba(31, 162, 166, 0.08)', border: '#1FA2A6', accent: '#2DD4BF', glow: 'rgba(31, 162, 166, 0.25)' },
};

// Minimalist Score Display Component
const ScoreDisplay = ({ homeScore, awayScore, onHomeChange, onAwayChange, accentColor }: any) => (
  <View style={styles.scoreDisplay}>
    <View style={styles.scoreTeam}>
      <Text style={[styles.scoreTeamLabel, { color: accentColor }]}>EV</Text>
      <View style={styles.scoreValueContainer}>
        <TouchableOpacity 
          style={styles.scoreAdjustBtn} 
          onPress={() => onHomeChange(Math.max(0, homeScore - 1))}
        >
          <Ionicons name="remove" size={18} color="#64748B" />
        </TouchableOpacity>
        <Text style={[styles.scoreValue, { color: accentColor }]}>{homeScore}</Text>
        <TouchableOpacity 
          style={styles.scoreAdjustBtn}
          onPress={() => onHomeChange(Math.min(9, homeScore + 1))}
        >
          <Ionicons name="add" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
    
    <View style={styles.scoreDash}>
      <Text style={styles.scoreDashText}>:</Text>
    </View>
    
    <View style={styles.scoreTeam}>
      <Text style={[styles.scoreTeamLabel, { color: accentColor }]}>DEP</Text>
      <View style={styles.scoreValueContainer}>
        <TouchableOpacity 
          style={styles.scoreAdjustBtn}
          onPress={() => onAwayChange(Math.max(0, awayScore - 1))}
        >
          <Ionicons name="remove" size={18} color="#64748B" />
        </TouchableOpacity>
        <Text style={[styles.scoreValue, { color: accentColor }]}>{awayScore}</Text>
        <TouchableOpacity 
          style={styles.scoreAdjustBtn}
          onPress={() => onAwayChange(Math.min(9, awayScore + 1))}
        >
          <Ionicons name="add" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Minimalist Slider Component
const MinimalistSlider = ({ value, onChange, label, accentColor, maxValue = 10 }: any) => (
  <View style={styles.sliderSection}>
    <View style={styles.sliderHeader}>
      <Ionicons name="time-outline" size={16} color="#64748B" />
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={[styles.sliderValueBadge, { backgroundColor: accentColor }]}>
        <Text style={styles.sliderValueText}>+{value === maxValue ? `${maxValue}+` : value}</Text>
      </View>
    </View>
    <View style={styles.sliderTrackContainer}>
      <SliderComponent
        value={value}
        onValueChange={onChange}
        minimumValue={0}
        maximumValue={maxValue}
        step={1}
        minimumTrackTintColor={accentColor}
        maximumTrackTintColor="rgba(100, 116, 139, 0.2)"
        thumbTintColor={accentColor}
        style={styles.slider}
      />
      <View style={styles.sliderMarks}>
        {[0, 2, 4, 6, 8, 10].map((mark) => (
          <Text key={mark} style={styles.sliderMark}>{mark === 10 ? '10+' : mark}</Text>
        ))}
      </View>
    </View>
  </View>
);

export function MatchPredictionVisualOnly() {
  // State for demo
  const [firstHalfHome, setFirstHalfHome] = useState(1);
  const [firstHalfAway, setFirstHalfAway] = useState(0);
  const [firstHalfInjury, setFirstHalfInjury] = useState(4);
  
  const [fullTimeHome, setFullTimeHome] = useState(2);
  const [fullTimeAway, setFullTimeAway] = useState(1);
  const [fullTimeInjury, setFullTimeInjury] = useState(5);
  
  const [possession, setPossession] = useState(55);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════
            FUTBOL SAHASI
        ═══════════════════════════════════════════════════════════ */}
        <FootballField style={styles.mainField}>
          <TouchableOpacity style={styles.fieldFocusIcon} activeOpacity={0.7}>
            <Ionicons name="star" size={22} color="#F59E0B" />
          </TouchableOpacity>
          
          <View style={styles.playersContainer}>
            {mockPositions.map((pos, index) => {
              const player = mockPlayers[index];
              const isElite = player.rating >= 85;
              const isGK = player.position === 'GK';
              const hasPrediction = index < 3;
              
              return (
                <View key={index} style={[styles.playerSlot, { left: `${pos.x}%`, top: `${pos.y}%` }]}>
                  <TouchableOpacity 
                    style={[
                      styles.playerCard,
                      isElite && styles.playerCardElite,
                      isGK && styles.playerCardGK,
                      hasPrediction && styles.playerCardPredicted,
                    ]} 
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={isGK ? ['#1E3A5F', '#0F2A44'] : ['#1E3A3A', '#0F2A24']}
                      style={styles.playerCardGradient}
                    >
                      {hasPrediction && (
                        <View style={styles.predictionBadge}>
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        </View>
                      )}
                      
                      <LinearGradient
                        colors={isGK ? ['#3B82F6', '#1D4ED8'] : ['#1FA2A6', '#0D9488']}
                        style={styles.jerseyBadge}
                      >
                        <Text style={styles.jerseyNumber}>{player.number}</Text>
                      </LinearGradient>
                      
                      <Text style={styles.playerName} numberOfLines={1}>{formatPlayerDisplayName(player)}</Text>
                      
                      <View style={styles.playerFooter}>
                        <Text style={[styles.playerRating, isElite && styles.playerRatingElite]}>
                          {player.rating}
                        </Text>
                        <Text style={styles.playerPosition}>{player.position}</Text>
                      </View>
                      
                      {hasPrediction && <View style={styles.predictionGlow} />}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </FootballField>

        <View style={styles.infoNote}>
          <Ionicons name="hand-left-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>Oyuncu kartlarına dokunun</Text>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            TAHMİN KARTLARI
        ═══════════════════════════════════════════════════════════ */}
        <View style={styles.predictionsSection}>
          
          {/* ─────────────────────────────────────────────────────────
              1. İLK YARI - Skor + Uzatma Süresi (Kombine)
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.firstHalf.bg, borderColor: CARD_THEMES.firstHalf.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.firstHalf.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.firstHalf.glow }]}>
                  <Text style={styles.cardEmoji}>⏱️</Text>
                </View>
                <Text style={styles.cardTitle}>İlk Yarı</Text>
              </View>
            </View>
            
            {/* Skor */}
            <ScoreDisplay 
              homeScore={firstHalfHome}
              awayScore={firstHalfAway}
              onHomeChange={setFirstHalfHome}
              onAwayChange={setFirstHalfAway}
              accentColor={CARD_THEMES.firstHalf.accent}
            />
            
            <View style={styles.cardDivider} />
            
            {/* Uzatma Slider */}
            <MinimalistSlider 
              value={firstHalfInjury}
              onChange={setFirstHalfInjury}
              label="Uzatma Süresi"
              accentColor={CARD_THEMES.firstHalf.border}
            />
          </View>

          {/* ─────────────────────────────────────────────────────────
              2. MAÇ SONU - Skor + Uzatma Süresi (Kombine)
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.fullTime.bg, borderColor: CARD_THEMES.fullTime.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.fullTime.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.fullTime.glow }]}>
                  <Text style={styles.cardEmoji}>🏆</Text>
                </View>
                <Text style={styles.cardTitle}>Maç Sonu</Text>
              </View>
            </View>
            
            {/* Skor */}
            <ScoreDisplay 
              homeScore={fullTimeHome}
              awayScore={fullTimeAway}
              onHomeChange={setFullTimeHome}
              onAwayChange={setFullTimeAway}
              accentColor={CARD_THEMES.fullTime.accent}
            />
            
            <View style={styles.cardDivider} />
            
            {/* Uzatma Slider */}
            <MinimalistSlider 
              value={fullTimeInjury}
              onChange={setFullTimeInjury}
              label="Uzatma Süresi"
              accentColor={CARD_THEMES.fullTime.border}
            />
          </View>

          {/* ─────────────────────────────────────────────────────────
              3. GOL TAHMİNLERİ - Toplam Gol + İlk Gol Zamanı (Kombine)
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.goal.bg, borderColor: CARD_THEMES.goal.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.goal.border }]} />
            
            {/* Toplam Gol */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.goal.glow }]}>
                  <Text style={styles.cardEmoji}>⚽</Text>
                </View>
                <Text style={styles.cardTitle}>Toplam Gol</Text>
              </View>
            </View>
            
            <View style={styles.goalCountRow}>
              {['0-1', '2-3', '4-5', '6+'].map((r, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.goalCountBtn,
                    r === '2-3' && [styles.goalCountBtnActive, { backgroundColor: CARD_THEMES.goal.border }]
                  ]}
                >
                  <Text style={[styles.goalCountNumber, { color: CARD_THEMES.goal.accent }, r === '2-3' && styles.goalCountNumberActive]}>
                    {r}
                  </Text>
                  <Text style={[styles.goalCountLabel, r === '2-3' && { color: 'rgba(255,255,255,0.8)' }]}>gol</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={[styles.cardDivider, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]} />
            
            {/* İlk Gol Zamanı */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: 'rgba(251, 191, 36, 0.25)' }]}>
                  <Text style={styles.cardEmoji}>⏰</Text>
                </View>
                <Text style={styles.cardTitle}>İlk Gol Zamanı</Text>
              </View>
            </View>
            
            <View style={styles.firstGoalTimeline}>
              {/* Zaman çizgisi */}
              <View style={styles.timelineTrack}>
                <LinearGradient
                  colors={['#F59E0B', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.timelineGradient}
                />
              </View>
              
              {/* Zaman dilimleri */}
              <View style={styles.timelineButtons}>
                {[
                  { label: "1-15'", period: '1Y' },
                  { label: "16-30'", period: '1Y' },
                  { label: "31-45'", period: '1Y' },
                  { label: "46-60'", period: '2Y' },
                  { label: "61-75'", period: '2Y' },
                  { label: "76-90'", period: '2Y' },
                ].map((t, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.timelineBtn,
                      t.label === "16-30'" && styles.timelineBtnActive
                    ]}
                  >
                    <Text style={[styles.timelineBtnText, t.label === "16-30'" && styles.timelineBtnTextActive]}>
                      {t.label}
                    </Text>
                    <Text style={[styles.timelinePeriod, t.label === "16-30'" && { color: '#FFF' }]}>
                      {t.period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Uzatma & Gol Yok */}
              <View style={styles.timelineExtras}>
                <TouchableOpacity style={styles.timelineExtraBtn}>
                  <Text style={styles.timelineExtraBtnText}>90+'</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.timelineExtraBtn, styles.timelineExtraBtnAlt]}>
                  <Ionicons name="close-circle-outline" size={14} color="#64748B" />
                  <Text style={styles.timelineExtraBtnText}>Gol yok</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ─────────────────────────────────────────────────────────
              5. DİSİPLİN
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.card.bg, borderColor: CARD_THEMES.card.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.card.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: 'rgba(251, 191, 36, 0.25)' }]}>
                  <Text style={styles.cardEmoji}>🟨</Text>
                </View>
                <Text style={styles.cardTitle}>Sarı Kart</Text>
              </View>
            </View>
            
            <View style={styles.optionButtonsRow}>
              {['1-2', '3-4', '5-6', '7+'].map((r, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.optionBtn,
                    r === '3-4' && [styles.optionBtnActive, { backgroundColor: '#F59E0B' }]
                  ]}
                >
                  <Text style={[styles.optionBtnText, { color: '#FBBF24' }, r === '3-4' && styles.optionBtnTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.cardDivider} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.card.glow }]}>
                  <Text style={styles.cardEmoji}>🟥</Text>
                </View>
                <Text style={styles.cardTitle}>Kırmızı Kart</Text>
              </View>
            </View>
            
            <View style={styles.optionButtonsRow}>
{['1', '2', '3', '4+'].map((r, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.optionBtn,
                      r === '1' && [styles.optionBtnActive, { backgroundColor: CARD_THEMES.card.border }]
                    ]}
                  >
                    <Text style={[styles.optionBtnText, { color: CARD_THEMES.card.accent }, r === '1' && styles.optionBtnTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          {/* ─────────────────────────────────────────────────────────
              6. TOP HAKİMİYETİ - Minimalist Slider
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.control.bg, borderColor: CARD_THEMES.control.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.control.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.control.glow }]}>
                  <Text style={styles.cardEmoji}>📊</Text>
                </View>
                <Text style={styles.cardTitle}>Top Hakimiyeti</Text>
              </View>
            </View>
            
            <View style={styles.possessionContainer}>
              <View style={styles.possessionValues}>
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>EV</Text>
                  <Text style={[styles.possessionPercent, { color: CARD_THEMES.control.accent }]}>{possession}%</Text>
                </View>
                <Text style={styles.possessionVs}>vs</Text>
                <View style={styles.possessionTeam}>
                  <Text style={styles.possessionTeamLabel}>DEP</Text>
                  <Text style={[styles.possessionPercent, { color: '#94A3B8' }]}>{100 - possession}%</Text>
                </View>
              </View>
              
              <View style={styles.possessionSliderContainer}>
                <SliderComponent
                  value={possession}
                  onValueChange={setPossession}
                  minimumValue={20}
                  maximumValue={80}
                  step={5}
                  minimumTrackTintColor={CARD_THEMES.control.border}
                  maximumTrackTintColor="rgba(100, 116, 139, 0.2)"
                  thumbTintColor={CARD_THEMES.control.accent}
                  style={styles.slider}
                />
                <View style={styles.possessionLabels}>
                  <Text style={[styles.possessionLabelText, { color: CARD_THEMES.control.accent }]}>← Ev</Text>
                  <View style={styles.possessionCenterMark} />
                  <Text style={styles.possessionLabelText}>Dep →</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ─────────────────────────────────────────────────────────
              7. MAÇ TEMPOSU
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.tactical.bg, borderColor: CARD_THEMES.tactical.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.tactical.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.tactical.glow }]}>
                  <Text style={styles.cardEmoji}>⚡</Text>
                </View>
                <Text style={styles.cardTitle}>Maç Temposu</Text>
              </View>
            </View>
            
            <View style={styles.tempoRow}>
              {[
                { label: 'Düşük', icon: '🐢' },
                { label: 'Orta', icon: '⚖️' },
                { label: 'Yüksek', icon: '🚀' },
              ].map((t, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.tempoBtn,
                    t.label === 'Orta' && [styles.tempoBtnActive, { backgroundColor: CARD_THEMES.tactical.border }]
                  ]}
                >
                  <Text style={styles.tempoEmoji}>{t.icon}</Text>
                  <Text style={[styles.tempoBtnText, { color: CARD_THEMES.tactical.accent }, t.label === 'Orta' && styles.tempoBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─────────────────────────────────────────────────────────
              8. MAÇ SENARYOSU
          ───────────────────────────────────────────────────────── */}
          <View style={[styles.categoryCard, { backgroundColor: CARD_THEMES.tactical.bg, borderColor: CARD_THEMES.tactical.border }]}>
            <View style={[styles.cardAccent, { backgroundColor: CARD_THEMES.tactical.border }]} />
            
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={[styles.cardIconSmall, { backgroundColor: CARD_THEMES.tactical.glow }]}>
                  <Text style={styles.cardEmoji}>🧠</Text>
                </View>
                <Text style={styles.cardTitle}>Maç Senaryosu</Text>
              </View>
            </View>
            
            <View style={styles.scenarioGrid}>
              {[
                { label: 'Kontrollü', icon: '🎯' },
                { label: 'Baskılı', icon: '⚔️' },
                { label: 'Geçiş', icon: '💨' },
                { label: 'Set Piece', icon: '🎪' },
              ].map((s, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.scenarioBtn,
                    s.label === 'Baskılı' && [styles.scenarioBtnActive, { backgroundColor: CARD_THEMES.tactical.border }]
                  ]}
                >
                  <Text style={styles.scenarioEmoji}>{s.icon}</Text>
                  <Text style={[styles.scenarioBtnText, { color: CARD_THEMES.tactical.accent }, s.label === 'Baskılı' && styles.scenarioBtnTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1A14' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 8, paddingHorizontal: 16 }, // ✅ Kadro sekmesiyle aynı

  // Field
  fieldContainer: {
    width: width - PITCH_LAYOUT.H_PADDING, height: (width - PITCH_LAYOUT.H_PADDING) * PITCH_LAYOUT.ASPECT_RATIO, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginTop: 12,
    borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.4)',
    ...Platform.select({
      ios: { shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 12 },
      web: { boxShadow: '0 0 30px rgba(34, 197, 94, 0.25)' },
    }),
  },
  fieldGradient: { flex: 1 },
  fieldSvg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mainField: { width: width - PITCH_LAYOUT.H_PADDING, height: (width - PITCH_LAYOUT.H_PADDING) * PITCH_LAYOUT.ASPECT_RATIO, alignSelf: 'center', marginBottom: 12 },
  fieldFocusIcon: {
    position: 'absolute', top: 14, right: 14, zIndex: 100,
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8 },
      web: { filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' },
    }),
  },

  // Players
  playersContainer: { flex: 1, position: 'relative' },
  playerSlot: { position: 'absolute', transform: [{ translateX: -30 }, { translateY: -38 }], zIndex: 1 },
  playerCard: {
    width: 60, height: 76, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(100, 116, 139, 0.4)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
      android: { elevation: 6 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.4)' },
    }),
  },
  playerCardElite: { borderColor: '#C9A44C', borderWidth: 2 },
  playerCardGK: { borderColor: '#3B82F6', borderWidth: 2 },
  playerCardPredicted: {
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 10 },
      android: { elevation: 10 },
      web: { boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)' },
    }),
  },
  playerCardGradient: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 4 },
  predictionBadge: {
    position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF', zIndex: 10,
  },
  jerseyBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  jerseyNumber: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  playerName: { fontSize: 8, fontWeight: '600', color: '#FFF', textAlign: 'center', marginTop: 2 },
  playerFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4, marginTop: 'auto' },
  playerRating: { fontSize: 9, fontWeight: '800', color: '#9CA3AF' },
  playerRatingElite: { color: '#FBBF24' },
  playerPosition: { fontSize: 8, fontWeight: '600', color: '#64748B' },
  predictionGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 10 },

  // Info
  infoNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  infoText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Cards
  predictionsSection: { gap: 14, paddingTop: 8 },
  categoryCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { backdropFilter: 'blur(10px)', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' },
    }),
  },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconSmall: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', letterSpacing: 0.2 },
  cardDivider: { height: 1, backgroundColor: 'rgba(100, 116, 139, 0.15)', marginVertical: 14 },

  // Score Display
  scoreDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scoreTeam: { alignItems: 'center', flex: 1 },
  scoreTeamLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  scoreValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreAdjustBtn: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  scoreValue: { fontSize: 36, fontWeight: '900', minWidth: 40, textAlign: 'center' },
  scoreDash: { paddingHorizontal: 16 },
  scoreDashText: { fontSize: 28, fontWeight: '300', color: '#64748B' },

  // Slider
  sliderSection: { gap: 8 },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500', flex: 1 },
  sliderValueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sliderValueText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  sliderTrackContainer: { gap: 6 },
  slider: { width: '100%', height: 32 },
  sliderMarks: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  sliderMark: { fontSize: 9, color: '#64748B', fontWeight: '500' },

  // Option Buttons
  optionButtonsRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  optionBtnActive: { borderWidth: 0 },
  optionBtnText: { fontSize: 15, fontWeight: '700' },
  optionBtnTextActive: { color: '#FFF' },

  // Goal Count Row (Toplam Gol)
  goalCountRow: { flexDirection: 'row', gap: 10 },
  goalCountBtn: {
    flex: 1, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  goalCountBtnActive: { borderWidth: 0 },
  goalCountNumber: { fontSize: 18, fontWeight: '900' },
  goalCountNumberActive: { color: '#FFF' },
  goalCountLabel: { fontSize: 9, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // First Goal Timeline (İlk Gol Zamanı)
  firstGoalTimeline: { gap: 12 },
  timelineTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(100, 116, 139, 0.2)', overflow: 'hidden' },
  timelineGradient: { flex: 1, borderRadius: 2 },
  timelineButtons: { flexDirection: 'row', gap: 6 },
  timelineBtn: {
    flex: 1, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  timelineBtnActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  timelineBtnText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  timelineBtnTextActive: { color: '#FFF' },
  timelinePeriod: { fontSize: 8, color: '#64748B', fontWeight: '500', marginTop: 2 },
  timelineExtras: { flexDirection: 'row', gap: 8 },
  timelineExtraBtn: {
    flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  timelineExtraBtnAlt: { borderColor: 'rgba(239, 68, 68, 0.3)' },
  timelineExtraBtnText: { fontSize: 11, fontWeight: '600', color: '#64748B' },

  // Time Range Grid (eski - kullanılmıyor artık)
  timeRangeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeRangeBtn: {
    width: '23%', height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)',
    flexGrow: 1,
  },
  timeRangeBtnActive: { borderWidth: 0 },
  timeRangeBtnText: { fontSize: 12, fontWeight: '600' },
  timeRangeBtnTextActive: { color: '#FFF', fontWeight: '700' },

  // Possession
  possessionContainer: { gap: 12 },
  possessionValues: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  possessionTeam: { alignItems: 'center' },
  possessionTeamLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
  possessionPercent: { fontSize: 28, fontWeight: '900' },
  possessionVs: { fontSize: 14, color: '#475569', fontWeight: '600' },
  possessionSliderContainer: { gap: 6 },
  possessionLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  possessionLabelText: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  possessionCenterMark: { width: 2, height: 8, backgroundColor: '#475569', borderRadius: 1 },

  // Tempo
  tempoRow: { flexDirection: 'row', gap: 10 },
  tempoBtn: {
    flex: 1, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  tempoBtnActive: { borderWidth: 0 },
  tempoEmoji: { fontSize: 20, marginBottom: 4 },
  tempoBtnText: { fontSize: 11, fontWeight: '600' },
  tempoBtnTextActive: { color: '#FFF', fontWeight: '700' },

  // Scenario
  scenarioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scenarioBtn: {
    width: '47%', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.5)', borderWidth: 1, borderColor: 'rgba(100, 116, 139, 0.2)', flexGrow: 1,
  },
  scenarioBtnActive: { borderWidth: 0 },
  scenarioEmoji: { fontSize: 18 },
  scenarioBtnText: { fontSize: 12, fontWeight: '600' },
  scenarioBtnTextActive: { color: '#FFF', fontWeight: '700' },
});
