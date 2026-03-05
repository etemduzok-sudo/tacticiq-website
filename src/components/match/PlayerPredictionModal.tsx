import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../theme/theme';
import { formatPlayerDisplayName } from '../../utils/playerNameUtils';

const isWeb = Platform.OS === 'web';
const { height } = Dimensions.get('window');

function isGoalkeeperPlayer(p: { position?: string; pos?: string } | null | undefined): boolean {
  if (!p) return false;
  const pos = (p.position ?? p.pos ?? '') as string;
  if (!pos) return false;
  const lower = pos.toLowerCase();
  return pos === 'GK' || pos === 'G' || lower === 'goalkeeper' || lower.startsWith('goalkeeper');
}

const SUBSTITUTE_MINUTE_RANGES = [
  { label: '0-15', value: '0-15' },
  { label: '16-30', value: '16-30' },
  { label: '31-45', value: '31-45' },
  { label: '45+', value: '45+' },
  { label: '46-60', value: '46-60' },
  { label: '61-75', value: '61-75' },
  { label: '76-90', value: '76-90' },
  { label: '90+', value: '90+' },
];

export interface PlayerPredictionModalProps {
  player: any;
  predictions: any;
  onClose: () => void;
  onCancel?: () => void;
  onPredictionChange: (category: string, value: string | boolean) => void;
  startingXI?: any[];
  reservePlayers?: any[];
  onSubstituteConfirm?: (type: 'normal' | 'injury', playerId: string, minute: string) => void;
  allPlayerPredictions?: Record<string | number, any>;
  isPredictionLocked?: boolean;
  /** Sadece bu oyuncu kilitli (master kilit değil) */
  isThisPlayerLocked?: boolean;
  /** Sayfa altı master kilit kilitli */
  isMasterLocked?: boolean;
  /** Kilit uyarısı – reason: 'master_then_player' = iki aşamalı mesaj; kalıcı kilit nedenleri popup'ta dinamik mesaj için */
  onShowLockedWarning?: (reason?: 'master_then_player' | 'community_viewed' | 'real_lineup_viewed' | 'community_and_lineup_viewed') => void;
  /** Topluluk/gerçek kadro görüldüyse kalıcı kilit – alttaki kırmızı bildirim gizlenir, her tıklamada uyarı popup'ı gösterilir */
  permanentLockReason?: 'community_viewed' | 'real_lineup_viewed' | 'community_and_lineup_viewed' | null;
  onUnlockLock?: () => void;
  onSaveAndLock?: () => void | Promise<void>;
}

const PlayerPredictionModal = ({
  player,
  predictions,
  onClose,
  onCancel,
  onPredictionChange,
  startingXI = [],
  reservePlayers = [],
  onSubstituteConfirm,
  allPlayerPredictions = {},
  isPredictionLocked = false,
  isThisPlayerLocked = false,
  isMasterLocked = false,
  onShowLockedWarning,
  onUnlockLock,
  onSaveAndLock,
  permanentLockReason = null,
}: PlayerPredictionModalProps) => {
  const isLocked = isPredictionLocked ?? (isThisPlayerLocked || isMasterLocked);
  const showPermanentLockOverlay = Boolean(permanentLockReason);
  const { theme } = useTheme();
  const themeColors = theme === 'light' ? COLORS.light : COLORS.dark;
  const isLight = theme === 'light';
  const [expandedSubstituteType, setExpandedSubstituteType] = useState<'normal' | 'injury' | null>(null);
  const [localSubstituteId, setLocalSubstituteId] = useState<string | null>(null);
  const [localMinuteRange, setLocalMinuteRange] = useState<string | null>(null);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const saveButtonRef = useRef<TouchableOpacity>(null);

  const availableSubstitutes = useMemo(() => {
    const startingXIIds = new Set((startingXI || []).map((p: any) => p.id));
    const allReserves = (reservePlayers || []).filter((p: any) => !startingXIIds.has(p.id));
    
    const alreadySelectedAsSubstitute = new Set<string>();
    Object.entries(allPlayerPredictions || {}).forEach(([playerId, preds]) => {
      if (String(playerId) !== String(player.id)) {
        if (preds?.substitutePlayer) alreadySelectedAsSubstitute.add(String(preds.substitutePlayer));
        if (preds?.injurySubstitutePlayer) alreadySelectedAsSubstitute.add(String(preds.injurySubstitutePlayer));
      }
    });
    
    const isPlayerGK = isGoalkeeperPlayer(player);
    return allReserves.filter((p: any) => {
      const isSubstituteGK = isGoalkeeperPlayer(p);
      if (isPlayerGK !== isSubstituteGK) return false;
      if (alreadySelectedAsSubstitute.has(String(p.id))) return false;
      return true;
    });
  }, [startingXI, reservePlayers, player, allPlayerPredictions]);

  const getSubstituteName = (id: string | null) =>
    id ? (reservePlayers || []).find((p: any) => p.id.toString() === id)?.name : null;

  /** Kilitliyken tahmin değiştirmeyi engelle. Kalıcı kilit (topluluk/gerçek kadro) varsa o sebep; yoksa master_then_player. */
  const showLockWarning = () => onShowLockedWarning?.(permanentLockReason ?? 'master_then_player');

  const handlePredictionChange = (category: string, value: string | boolean) => {
    if (isLocked) {
      showLockWarning();
      return;
    }
    onPredictionChange(category, value);
  };

  const openDropdown = (type: 'normal' | 'injury') => {
    if (isLocked) {
      showLockWarning();
      return;
    }
    
    if (type === 'normal' && predictions.substitutePlayer) {
      onPredictionChange('substitutedOut', false);
      onPredictionChange('substitutePlayer', null);
      onPredictionChange('substituteMinute', null);
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    if (type === 'injury' && predictions.injurySubstitutePlayer) {
      onPredictionChange('injuredOut', false);
      onPredictionChange('injurySubstitutePlayer', null);
      onPredictionChange('injurySubstituteMinute', null);
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    if (expandedSubstituteType === type) {
      setExpandedSubstituteType(null);
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
      setShowPlayerDropdown(false);
      return;
    }
    
    let shouldClearLocalState = false;
    if (type === 'normal' && (predictions.injuredOut || predictions.injurySubstitutePlayer)) {
      onPredictionChange('injuredOut', false);
      onPredictionChange('injurySubstitutePlayer', null);
      onPredictionChange('injurySubstituteMinute', null);
      shouldClearLocalState = true;
    } else if (type === 'injury' && (predictions.substitutedOut || predictions.substitutePlayer)) {
      onPredictionChange('substitutedOut', false);
      onPredictionChange('substitutePlayer', null);
      onPredictionChange('substituteMinute', null);
      shouldClearLocalState = true;
    }
    
    setExpandedSubstituteType(type);
    setShowPlayerDropdown(false);
    
    if (shouldClearLocalState) {
      setLocalSubstituteId(null);
      setLocalMinuteRange(null);
    } else {
      const currentId = type === 'normal' ? predictions.substitutePlayer : predictions.injurySubstitutePlayer;
      const currentMin = type === 'normal' ? predictions.substituteMinute : predictions.injurySubstituteMinute;
      setLocalSubstituteId(currentId || null);
      setLocalMinuteRange(currentMin || null);
    }
  };

  // Mevcut tahminle modal açıldığında "Yerine kim girmeli?" seçimini göster
  React.useEffect(() => {
    if (predictions.substitutedOut && predictions.substitutePlayer) {
      setLocalSubstituteId(String(predictions.substitutePlayer));
      setLocalMinuteRange(predictions.substituteMinute ?? null);
    }
    if (predictions.injuredOut && predictions.injurySubstitutePlayer) {
      setLocalSubstituteId(String(predictions.injurySubstitutePlayer));
      setLocalMinuteRange(predictions.injurySubstituteMinute ?? null);
    }
  }, [player?.id, predictions.substitutedOut, predictions.substitutePlayer, predictions.substituteMinute, predictions.injuredOut, predictions.injurySubstitutePlayer, predictions.injurySubstituteMinute]);

  React.useEffect(() => {
    if (expandedSubstituteType && scrollViewRef.current) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [expandedSubstituteType]);

  React.useEffect(() => {
    if (!isLocked && expandedSubstituteType && localSubstituteId && localMinuteRange && onSubstituteConfirm) {
      const timer = setTimeout(() => {
        onSubstituteConfirm(expandedSubstituteType, localSubstituteId, localMinuteRange);
        setExpandedSubstituteType(null);
        setShowPlayerDropdown(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLocked, expandedSubstituteType, localSubstituteId, localMinuteRange, onSubstituteConfirm]);

  const buttonLabelNormal = predictions.substitutePlayer
    ? (
        <View style={styles.substituteButtonSingleLine}>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-down" size={14} color="#EF4444" />
            <Text style={styles.substituteButtonLabel}>Çıkar:</Text>
            <Text style={styles.substituteButtonPlayerNameSingle}>{formatPlayerDisplayName(player).split(' ').pop() ?? ''}</Text>
          </View>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-up" size={14} color="#10B981" />
            <Text style={styles.substituteButtonLabel}>Girer:</Text>
            <Text style={styles.substituteButtonSubstituteNameSingle}>{getSubstituteName(predictions.substitutePlayer)?.split(' ').pop()}</Text>
          </View>
          {predictions.substituteMinute && (
            <View style={styles.substituteButtonSingleRow}>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.substituteMinute}</Text>
            </View>
          )}
        </View>
      )
    : 'Oyundan Çıkar';
  const buttonLabelInjury = predictions.injurySubstitutePlayer
    ? (
        <View style={styles.substituteButtonSingleLine}>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-down" size={14} color="#EF4444" />
            <Text style={styles.substituteButtonLabel}>Çıkar:</Text>
            <Text style={styles.substituteButtonPlayerNameSingle}>{formatPlayerDisplayName(player).split(' ').pop() ?? ''}</Text>
          </View>
          <View style={styles.substituteButtonSingleRow}>
            <Ionicons name="arrow-up" size={14} color="#10B981" />
            <Text style={styles.substituteButtonLabel}>Girer:</Text>
            <Text style={styles.substituteButtonSubstituteNameSingle}>{getSubstituteName(predictions.injurySubstitutePlayer)?.split(' ').pop()}</Text>
          </View>
          {predictions.injurySubstituteMinute && (
            <View style={styles.substituteButtonSingleRow}>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" />
              <Text style={styles.substituteButtonTimeTextSingle}>dk {predictions.injurySubstituteMinute}</Text>
            </View>
          )}
        </View>
      )
    : 'Sakatlanarak Çıkar';

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={isWeb ? undefined : SlideInDown.duration(300)}
          exiting={isWeb ? undefined : SlideOutDown.duration(300)}
          style={[styles.playerModalContent, { backgroundColor: themeColors.popover }]}
        >
          <LinearGradient
            colors={isLight ? [themeColors.muted, themeColors.card] : ['#1E3A3A', '#0F2A24']}
            style={styles.playerModalHeader}
          >
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={themeColors.foreground} />
            </TouchableOpacity>

            <View style={styles.playerModalInfo}>
              <View style={styles.playerNumberCircle}>
                <Text style={[styles.playerNumberLarge, { color: themeColors.foreground }]}>{player.number ?? player.shirt_number ?? player.jersey_number ?? '-'}</Text>
                <View style={styles.playerRatingCircle}>
                  <Text style={styles.playerRatingSmall}>{player.rating}</Text>
                </View>
              </View>

              <View style={styles.playerDetails}>
                <Text style={[styles.playerNameLarge, { color: themeColors.foreground }]}>{formatPlayerDisplayName(player)}</Text>
                <Text style={[styles.playerPositionModal, { color: themeColors.mutedForeground }]}>
                  {player.position} • Form: <Text style={styles.formText}>{player.form}%</Text>
                </Text>
              </View>
            </View>
            {/* Tahmin yapılan oyuncu her zaman görünsün */}
            <View style={styles.tahminYapilanOyuncuBar}>
              <Ionicons name="person" size={14} color="#1FA2A6" />
              <Text style={styles.tahminYapilanOyuncuText}>Tahmin: {formatPlayerDisplayName(player)}</Text>
            </View>
          </LinearGradient>

          {expandedSubstituteType ? (
            <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.playerPredictionsScroll}
              contentContainerStyle={styles.playerPredictionsContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {/* Gol Atar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willScore && styles.predictionButtonActive,
                ]}
                onPress={() => handlePredictionChange('willScore', true)}
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
                      onPress={() => handlePredictionChange('goalCount', count)}
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
                onPress={() => handlePredictionChange('willAssist', true)}
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
                      onPress={() => handlePredictionChange('assistCount', count)}
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

            {/* ===== PENALTI TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Penaltı Tahminleri</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Penaltı butonları - 3'lü grid */}
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.penaltyTaker && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('penaltyTaker', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>🥅</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.penaltyTaker && styles.gridButtonTextActive,
                ]}>Kullanacak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.penaltyScored && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('penaltyScored', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>✅</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.penaltyScored && styles.gridButtonTextActive,
                ]}>Gol Atacak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.penaltyMissed && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('penaltyMissed', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>❌</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.penaltyMissed && styles.gridButtonTextActive,
                ]}>Kaçıracak</Text>
              </TouchableOpacity>
            </View>

            {/* ===== KART TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Kart Tahminleri</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Kart butonları - 3'lü grid */}
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.yellowCard && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('yellowCard', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>🟨</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.yellowCard && styles.gridButtonTextActive,
                ]}>Sarı Kart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.secondYellowRed && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('secondYellowRed', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>🟨🟥</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.secondYellowRed && styles.gridButtonTextActive,
                ]}>2. Sarıdan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridButton,
                  predictions.directRedCard && styles.gridButtonActive,
                ]}
                onPress={() => handlePredictionChange('directRedCard', true)}
                activeOpacity={0.8}
              >
                <Text style={styles.gridButtonEmoji}>🟥</Text>
                <Text style={[
                  styles.gridButtonText,
                  predictions.directRedCard && styles.gridButtonTextActive,
                ]}>Direkt Kırmızı</Text>
              </TouchableOpacity>
            </View>

            {/* ===== DEĞİŞİKLİK TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Değişiklik Tahmini</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Oyundan Çıkar - butonun hemen altında dropdown; kilitliyken tıklanınca resim 2 bildirimi */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.substitutedOut && styles.predictionButtonActive,
                  isLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => {
                  if (isLocked) {
                    showLockWarning();
                    return;
                  }
                  openDropdown('normal');
                }}
                hitSlop={16}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <View style={styles.predictionButtonContent}>
                    {isLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[
                      styles.predictionButtonText,
                      predictions.substitutedOut && styles.predictionButtonTextActive,
                      isLocked && styles.predictionButtonTextDisabled,
                    ]}>
                      🔄 {buttonLabelNormal}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.predictionButtonContent}>
                    {isLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    {buttonLabelNormal}
                  </View>
                )}
              </Pressable>

              {expandedSubstituteType === 'normal' && !isLocked && (
                <View style={styles.inlineSubstituteDropdown}>
                  <Text style={styles.inlineSubstituteTitle}>Yerine girecek oyuncu & dakika aralığı</Text>
                  
                  {/* Oyuncu Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Yerine Girecek Oyuncu</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownButtonContent}>
                        {localSubstituteId ? (
                          <>
                            <View style={styles.dropdownSelectedPlayer}>
                              <View style={styles.dropdownPlayerNumber}>
                                <Text style={styles.dropdownPlayerNumberText}>
                                  {availableSubstitutes.find((p: any) => p.id.toString() === localSubstituteId)?.number || ''}
                                </Text>
                              </View>
                              <Text style={styles.dropdownSelectedText}>
                                {getSubstituteName(localSubstituteId)}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.dropdownPlaceholder}>Oyuncu seçin...</Text>
                        )}
                        <Ionicons 
                          name={showPlayerDropdown ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showPlayerDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableSubstitutes.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                            <Text style={styles.dropdownEmptyText}>
                              {isGoalkeeperPlayer(player) 
                                ? 'Yedek kaleci bulunamadı. Kaleci sadece kaleci ile değiştirilebilir.'
                                : 'Yedek oyuncu bulunamadı. Oyuncu sadece oyuncu ile değiştirilebilir.'}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={availableSubstitutes}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                              const isSelected = localSubstituteId === item.id.toString();
                              return (
                                <TouchableOpacity
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemSelected]}
                                  onPress={() => {
                                    setLocalSubstituteId(item.id.toString());
                                    setShowPlayerDropdown(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownMenuItemContent}>
                                    <View style={styles.dropdownPlayerNumberSmall}>
                                      <Text style={styles.dropdownPlayerNumberTextSmall}>{item.number}</Text>
                                    </View>
                                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextSelected]}>
                                      {item.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            }}
                            style={styles.dropdownMenuList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Dakika Aralığı */}
                  <View style={styles.minuteRangeContainer}>
                    <Text style={styles.dropdownLabel}>Değişiklik Dakikası</Text>
                    <View style={styles.minuteRanges2RowGridCompact}>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(0, 4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && expandedSubstituteType === 'normal' && !isLocked) {
                                  onSubstituteConfirm('normal', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && expandedSubstituteType === 'normal' && !isLocked) {
                                  onSubstituteConfirm('normal', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Sakatlanarak Çıkar - butonun hemen altında dropdown; kilitliyken tıklanınca resim 2 bildirimi */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.injuredOut && styles.predictionButtonActive,
                  isLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => {
                  if (isLocked) {
                    showLockWarning();
                    return;
                  }
                  openDropdown('injury');
                }}
                hitSlop={16}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <View style={styles.predictionButtonContent}>
                    {isLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[
                      styles.predictionButtonText,
                      predictions.injuredOut && styles.predictionButtonTextActive,
                      isLocked && styles.predictionButtonTextDisabled,
                    ]}>
                      🚑 {buttonLabelInjury}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.predictionButtonContent}>
                    {isLocked && (
                      <Ionicons name="lock-closed" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    )}
                    {buttonLabelInjury}
                  </View>
                )}
              </Pressable>

              {expandedSubstituteType === 'injury' && !isLocked && (
                <View style={styles.inlineSubstituteDropdown}>
                  <Text style={styles.inlineSubstituteTitle}>Yerine girecek oyuncu & dakika aralığı</Text>
                  
                  {/* Oyuncu Dropdown */}
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Yerine Girecek Oyuncu</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownButtonContent}>
                        {localSubstituteId ? (
                          <>
                            <View style={styles.dropdownSelectedPlayer}>
                              <View style={styles.dropdownPlayerNumber}>
                                <Text style={styles.dropdownPlayerNumberText}>
                                  {availableSubstitutes.find((p: any) => p.id.toString() === localSubstituteId)?.number || ''}
                                </Text>
                              </View>
                              <Text style={styles.dropdownSelectedText}>
                                {getSubstituteName(localSubstituteId)}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.dropdownPlaceholder}>Oyuncu seçin...</Text>
                        )}
                        <Ionicons 
                          name={showPlayerDropdown ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showPlayerDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableSubstitutes.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                            <Text style={styles.dropdownEmptyText}>
                              {isGoalkeeperPlayer(player) 
                                ? 'Yedek kaleci bulunamadı. Kaleci sadece kaleci ile değiştirilebilir.'
                                : 'Yedek oyuncu bulunamadı. Oyuncu sadece oyuncu ile değiştirilebilir.'}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={availableSubstitutes}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                              const isSelected = localSubstituteId === item.id.toString();
                              return (
                                <TouchableOpacity
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemSelected]}
                                  onPress={() => {
                                    setLocalSubstituteId(item.id.toString());
                                    setShowPlayerDropdown(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownMenuItemContent}>
                                    <View style={styles.dropdownPlayerNumberSmall}>
                                      <Text style={styles.dropdownPlayerNumberTextSmall}>{item.number}</Text>
                                    </View>
                                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextSelected]}>
                                      {item.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            }}
                            style={styles.dropdownMenuList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Dakika Aralığı */}
                  <View style={styles.minuteRangeContainer}>
                    <Text style={styles.dropdownLabel}>Değişiklik Dakikası</Text>
                    <View style={styles.minuteRanges2RowGridCompact}>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(0, 4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && expandedSubstituteType === 'injury' && !isLocked) {
                                  onSubstituteConfirm('injury', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && expandedSubstituteType === 'injury' && !isLocked) {
                                  onSubstituteConfirm('injury', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
            </ScrollView>
            {showPermanentLockOverlay && (
              <Pressable style={StyleSheet.absoluteFill} onPress={showLockWarning} />
            )}
            </View>
          ) : (
            <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.playerPredictionsScroll}
              contentContainerStyle={styles.playerPredictionsContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
            {/* Gol Atar */}
            <View style={styles.predictionGroup}>
              <TouchableOpacity
                style={[
                  styles.predictionButton,
                  predictions.willScore && styles.predictionButtonActive,
                ]}
                onPress={() => handlePredictionChange('willScore', true)}
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
                      onPress={() => handlePredictionChange('goalCount', count)}
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
                onPress={() => handlePredictionChange('willAssist', true)}
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
                      onPress={() => handlePredictionChange('assistCount', count)}
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

            {/* ===== PENALTI TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Penaltı Tahminleri</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Penaltı Kullanacak */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.penaltyTaker && styles.predictionButtonActive,
              ]}
              onPress={() => handlePredictionChange('penaltyTaker', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.penaltyTaker && styles.predictionButtonTextActive,
              ]}>
                🥅 Penaltı Kullanacak
              </Text>
            </TouchableOpacity>

            {/* Penaltıdan Gol Atacak */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.penaltyScored && styles.predictionButtonActive,
              ]}
              onPress={() => handlePredictionChange('penaltyScored', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.penaltyScored && styles.predictionButtonTextActive,
              ]}>
                ✅ Penaltıdan Gol Atacak
              </Text>
            </TouchableOpacity>

            {/* Penaltı Kaçıracak */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.penaltyMissed && styles.predictionButtonActive,
              ]}
              onPress={() => handlePredictionChange('penaltyMissed', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.penaltyMissed && styles.predictionButtonTextActive,
              ]}>
                ❌ Penaltı Kaçıracak
              </Text>
            </TouchableOpacity>

            {/* ===== KART TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Kart Tahminleri</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Sarı Kart */}
            <TouchableOpacity
              style={[
                styles.predictionButton,
                predictions.yellowCard && styles.predictionButtonActive,
              ]}
              onPress={() => handlePredictionChange('yellowCard', true)}
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
              onPress={() => handlePredictionChange('secondYellowRed', true)}
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
              onPress={() => handlePredictionChange('directRedCard', true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.predictionButtonText,
                predictions.directRedCard && styles.predictionButtonTextActive,
              ]}>
                🟥 Direkt Kırmızı Kart
              </Text>
            </TouchableOpacity>

            {/* ===== DEĞİŞİKLİK TAHMİNLERİ ===== */}
            <View style={styles.penaltySectionDivider}>
              <View style={styles.penaltySectionLine} />
              <Text style={styles.penaltySectionTitle}>Değişiklik Tahmini</Text>
              <View style={styles.penaltySectionLine} />
            </View>

            {/* Oyundan Çıkar - kilitliyken tıklanınca resim 2 bildirimi */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.substitutedOut && styles.predictionButtonActive,
                  isLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => {
                  if (isLocked) {
                    showLockWarning();
                    return;
                  }
                  openDropdown('normal');
                }}
                hitSlop={16}
              >
                {typeof buttonLabelNormal === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.substitutedOut && styles.predictionButtonTextActive,
                    isLocked && styles.predictionButtonTextDisabled,
                  ]}>
                    🔄 {buttonLabelNormal}
                  </Text>
                ) : (
                  buttonLabelNormal
                )}
              </Pressable>

              {/* Yerine kim girmeli? – varsayılan görünümde de göster (seçim yapılabilsin) */}
              {(predictions.substitutedOut || expandedSubstituteType === 'normal') && !isLocked && (
                <View style={styles.inlineSubstituteDropdown}>
                  <Text style={styles.inlineSubstituteTitle}>Yerine girecek oyuncu & dakika aralığı</Text>
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownLabel}>Yerine Girecek Oyuncu</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownButtonContent}>
                        {localSubstituteId ? (
                          <>
                            <View style={styles.dropdownSelectedPlayer}>
                              <View style={styles.dropdownPlayerNumber}>
                                <Text style={styles.dropdownPlayerNumberText}>
                                  {availableSubstitutes.find((p: any) => p.id.toString() === localSubstituteId)?.number || ''}
                                </Text>
                              </View>
                              <Text style={styles.dropdownSelectedText}>
                                {getSubstituteName(localSubstituteId)}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <Text style={styles.dropdownPlaceholder}>Oyuncu seçin...</Text>
                        )}
                        <Ionicons
                          name={showPlayerDropdown ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                    </TouchableOpacity>
                    {showPlayerDropdown && (
                      <View style={styles.dropdownMenu}>
                        {availableSubstitutes.length === 0 ? (
                          <View style={styles.dropdownEmptyState}>
                            <Ionicons name="alert-circle" size={24} color="#9CA3AF" />
                            <Text style={styles.dropdownEmptyText}>
                              {isGoalkeeperPlayer(player)
                                ? 'Yedek kaleci bulunamadı. Kaleci sadece kaleci ile değiştirilebilir.'
                                : 'Yedek oyuncu bulunamadı. Oyuncu sadece oyuncu ile değiştirilebilir.'}
                            </Text>
                          </View>
                        ) : (
                          <FlatList
                            data={availableSubstitutes}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                              const isSelected = localSubstituteId === item.id.toString();
                              return (
                                <TouchableOpacity
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemSelected]}
                                  onPress={() => {
                                    setLocalSubstituteId(item.id.toString());
                                    setShowPlayerDropdown(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownMenuItemContent}>
                                    <View style={styles.dropdownPlayerNumberSmall}>
                                      <Text style={styles.dropdownPlayerNumberTextSmall}>{item.number}</Text>
                                    </View>
                                    <Text style={[styles.dropdownMenuItemText, isSelected && styles.dropdownMenuItemTextSelected]}>
                                      {item.name}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            }}
                            style={styles.dropdownMenuList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.minuteRangeContainer}>
                    <Text style={styles.dropdownLabel}>Değişiklik Dakikası</Text>
                    <View style={styles.minuteRanges2RowGridCompact}>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(0, 4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && !isLocked) {
                                  onSubstituteConfirm('normal', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.minuteRangesRowCompact}>
                        {SUBSTITUTE_MINUTE_RANGES.slice(4).map((range) => {
                          const isSelected = localMinuteRange === range.value;
                          return (
                            <TouchableOpacity
                              key={range.value}
                              style={[styles.minuteRangeButtonCompact, styles.minuteRangeButtonCompact2Row, isSelected && styles.minuteRangeButtonCompactSelected]}
                              onPress={() => {
                                setLocalMinuteRange(range.value);
                                if (localSubstituteId && onSubstituteConfirm && !isLocked) {
                                  onSubstituteConfirm('normal', localSubstituteId, range.value);
                                  setExpandedSubstituteType(null);
                                  setLocalSubstituteId(null);
                                  setLocalMinuteRange(null);
                                  setShowPlayerDropdown(false);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.minuteRangeTextCompact, isSelected && styles.minuteRangeTextCompactSelected]}>
                                {range.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Sakatlanarak Çıkar - kilitliyken tıklanınca resim 2 bildirimi */}
            <View style={styles.predictionGroup}>
              <Pressable
                style={[
                  styles.predictionButton,
                  predictions.injuredOut && styles.predictionButtonActive,
                  isLocked && styles.predictionButtonDisabled,
                ]}
                onPress={() => {
                  if (isLocked) {
                    showLockWarning();
                    return;
                  }
                  openDropdown('injury');
                }}
                hitSlop={16}
              >
                {typeof buttonLabelInjury === 'string' ? (
                  <Text style={[
                    styles.predictionButtonText,
                    predictions.injuredOut && styles.predictionButtonTextActive,
                    isLocked && styles.predictionButtonTextDisabled,
                  ]}>
                    🚑 {buttonLabelInjury}
                  </Text>
                ) : (
                  buttonLabelInjury
                )}
              </Pressable>
            </View>
            </ScrollView>
            {showPermanentLockOverlay && (
              <Pressable style={StyleSheet.absoluteFill} onPress={showLockWarning} />
            )}
            </View>
          )}

          {isLocked && !permanentLockReason && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)', borderTopWidth: 1, borderTopColor: 'rgba(239, 68, 68, 0.2)' }}>
              <Text style={{ fontSize: 12, color: isLight ? '#B91C1C' : '#FCA5A5', textAlign: 'center', lineHeight: 18 }}>
                {isMasterLocked
                  ? 'Önce sayfa altındaki master kilidi açın. Sonra bu oyuncu kartına gelerek "Tahminler Kilitli" butonuna basıp oyuncu kilidini açın.'
                  : 'Değiştirmek için alttaki "Tahminler Kilitli" butonuna basarak bu oyuncunun kilidini açın.'}
              </Text>
            </View>
          )}

          <View style={[styles.playerModalActions, { backgroundColor: themeColors.popover, borderTopColor: themeColors.border }]}>
            <TouchableOpacity 
              style={[styles.cancelButton, isMasterLocked && { opacity: 0.5 }]} 
              onPress={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  onClose();
                }
              }} 
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.foreground }]}>İptal Et</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                isLocked && styles.saveButtonDisabled,
              ]} 
              onPress={() => {
                if (isLocked) {
                  if (isThisPlayerLocked && !isMasterLocked && !permanentLockReason && onUnlockLock) {
                    onUnlockLock();
                    return;
                  }
                  showLockWarning();
                  return;
                }
                if (onSaveAndLock) onSaveAndLock(); else onClose();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={isLocked ? ['#4B5563', '#374151'] : ['#1FA2A6', '#047857']} 
                style={styles.saveButtonGradient}
              >
                {isLocked ? (
                  <View style={styles.saveButtonContent}>
                    <Ionicons name="lock-closed" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.saveButtonTextLocked}>Tahminler Kilitli</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PlayerPredictionModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  playerModalContent: {
    backgroundColor: '#1E3A3A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    width: 380,
    maxWidth: 380,
    maxHeight: (height * 0.9),
    alignSelf: 'center',
  },
  playerModalHeader: {
    padding: 10,
    paddingBottom: 8,
  },
  tahminYapilanOyuncuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.3)',
  },
  tahminYapilanOyuncuText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1FA2A6',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    zIndex: 10,
  },
  playerModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerNumberLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerRatingCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  playerRatingSmall: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F2A24',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameLarge: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerPositionModal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 1,
  },
  formText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  playerPredictionsScroll: {
    flex: 1,
    minHeight: 0,
  },
  playerPredictionsContent: {
    padding: 10,
    gap: 4,
    paddingBottom: 10,
  },
  penaltySectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  penaltySectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  penaltySectionTitle: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predictionGroup: {
    gap: 3,
  },
  predictionButton: {
    height: 38,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  predictionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  predictionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  predictionButtonTextActive: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  predictionButtonDisabled: {
    opacity: 0.9,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  predictionButtonTextDisabled: {
    opacity: 0.9,
  },
  predictionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subOptions: {
    paddingLeft: 8,
    gap: 2,
  },
  subOptionsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  subOptionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  subOptionButton: {
    flex: 1,
    height: 28,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  subOptionButtonActive: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
  },
  subOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  subOptionTextActive: {
    color: '#FFFFFF',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gridButton: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
    paddingVertical: 4,
  },
  gridButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  gridButtonEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  gridButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gridButtonTextActive: {
    fontWeight: 'bold',
  },
  playerModalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.2)',
    backgroundColor: '#1E3A3A',
  },
  cancelButton: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.5)',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButtonTextLocked: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 1,
  },
  inlineSubstituteDropdown: {
    marginTop: 4,
    padding: 8,
    backgroundColor: 'rgba(15, 42, 36, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    gap: 8,
  },
  inlineSubstituteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
    marginBottom: 4,
  },
  dropdownContainer: {
    marginBottom: 10,
    zIndex: 10,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectedPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownPlayerNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownPlayerNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    maxHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.4)' },
    }),
  },
  dropdownMenuList: {
    maxHeight: 160,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
  },
  dropdownMenuItemSelected: {
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
  },
  dropdownMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownPlayerNumberSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1FA2A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownPlayerNumberTextSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dropdownMenuItemText: {
    fontSize: 14,
    color: '#E6E6E6',
    flex: 1,
  },
  dropdownMenuItemTextSelected: {
    color: '#1FA2A6',
    fontWeight: '600',
  },
  dropdownEmptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  substituteButtonSingleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  substituteButtonSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  substituteButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E5E7EB',
  },
  substituteButtonPlayerNameSingle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substituteButtonSubstituteNameSingle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  substituteButtonTimeTextSingle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E7EB',
    marginLeft: 2,
  },
  autoSaveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  autoSaveInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  manualSaveButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manualSaveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#4B5563',
  },
  manualSaveButtonTextDisabled: {
    opacity: 0.6,
    color: '#9CA3AF',
  },
  minuteRangeContainer: {
    marginBottom: 16,
  },
  minuteRanges2RowGridCompact: {
    gap: 8,
    width: '100%',
  },
  minuteRangesRowCompact: {
    flexDirection: 'row',
    gap: 6,
  },
  minuteRangeButtonCompact2Row: {
    flex: 1,
    minWidth: 0,
  },
  minuteRangeButtonCompact: {
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 42, 36, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexDirection: 'row',
    gap: 6,
  },
  minuteRangeButtonCompactSelected: {
    backgroundColor: '#1FA2A6',
    borderColor: '#1FA2A6',
    borderWidth: 2,
  },
  minuteRangeTextCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6E6E6',
  },
  minuteRangeTextCompactSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
