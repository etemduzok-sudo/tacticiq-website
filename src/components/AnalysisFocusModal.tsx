// AnalysisFocusModal.tsx - Maç Analiz Odağı Seçimi (Web Tasarımı)
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SPACING, SIZES } from '../theme/theme';
import { ANALYSIS_FOCUS_PREDICTIONS } from '../config/analysisFocusMapping';

const { width, height } = Dimensions.get('window');

/** Tahmin kategorisinin okunabilir etiketi */
const CATEGORY_LABELS: Record<string, string> = {
  // Maç tahminleri
  yellowCards: 'Sarı Kart',
  redCards: 'Kırmızı Kart',
  shotsOnTarget: 'İsabetli Şut',
  totalShots: 'Toplam Şut',
  firstHalfHomeScore: 'İlk Yarı Skor',
  firstHalfAwayScore: 'İlk Yarı Skor',
  secondHalfHomeScore: 'Maç Sonu Skor',
  secondHalfAwayScore: 'Maç Sonu Skor',
  totalGoals: 'Toplam Gol',
  firstGoalTime: 'İlk Gol',
  possession: 'Top Hakimiyeti',
  tempo: 'Tempo',
  scenario: 'Maç Senaryosu',
  totalCorners: 'Korner',
  firstHalfInjuryTime: 'Uzatma Süresi',
  secondHalfInjuryTime: 'Maç Sonu Uzatma',
  // Oyuncu tahminleri
  willScore: 'Gol Atar',
  willAssist: 'Asist Yapar',
  manOfTheMatch: 'MVP',
  yellowCard: 'Sarı Kart (Oyuncu)',
  redCard: 'Kırmızı Kart (Oyuncu)',
  secondYellowRed: '2. Sarıdan Kırmızı',
  directRedCard: 'Direkt Kırmızı',
  substitutedOut: 'Oyundan Çıkar',
  injuredOut: 'Sakatlanarak Çıkar',
  substitutePlayer: 'Değişen Oyuncu',
  injurySubstitutePlayer: 'Sakatlık Değişikliği',
};

const getBonusLabels = (focusId: string): string => {
  const m = ANALYSIS_FOCUS_PREDICTIONS[focusId as keyof typeof ANALYSIS_FOCUS_PREDICTIONS];
  if (!m) return '';
  const primary = m.primary.slice(0, 4).map((c) => CATEGORY_LABELS[c] || c).join(', ');
  return primary + (m.primary.length > 4 ? '...' : '');
};

export type AnalysisFocusType = 
  | 'defense' 
  | 'offense' 
  | 'midfield' 
  | 'physical' 
  | 'tactical' 
  | 'player';

export interface AnalysisFocus {
  id: AnalysisFocusType;
  title: string;
  bonus: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  borderColor: string;
  backgroundColor: string; // Kart zemin rengi
}

// Web tasarımına uygun renkler - daha canlı ve okunabilir
export const ANALYSIS_FOCUSES: AnalysisFocus[] = [
  {
    id: 'defense',
    title: 'Savunma Odaklı Analiz',
    bonus: '+20% Defansif',
    description: 'Sarı/kırmızı kartlar, isabetli şutlar',
    icon: 'shield-outline',
    color: '#93C5FD', // ✅ Daha parlak mavi
    borderColor: '#3B82F6',
    backgroundColor: '#0F172A', // ✅ Daha derin koyu mavi
  },
  {
    id: 'offense',
    title: 'Hücum Odaklı Analiz',
    bonus: '+20% Ofansif',
    description: 'Gol tahminleri, ilk gol, toplam şut',
    icon: 'flash-outline',
    color: '#FCA5A5', // ✅ Daha parlak kırmızı
    borderColor: '#EF4444',
    backgroundColor: '#1F0A0A', // ✅ Daha derin koyu kırmızı
  },
  {
    id: 'midfield',
    title: 'Orta Saha Odaklı Analiz',
    bonus: '+15% Orta Saha',
    description: 'Top hakimiyeti, pas, anahtar pas',
    icon: 'radio-button-on-outline',
    color: '#D8B4FE', // ✅ Daha parlak mor
    borderColor: '#A855F7',
    backgroundColor: '#1E1033', // ✅ Daha derin koyu mor
  },
  {
    id: 'physical',
    title: 'Fiziksel Odaklı Analiz',
    bonus: '+15% Fiziksel',
    description: 'Maç temposu, koşu, sprint sayısı',
    icon: 'pulse-outline',
    color: '#86EFAC', // ✅ Daha parlak yeşil
    borderColor: '#22C55E',
    backgroundColor: '#052E16', // ✅ Derin yeşil
  },
  {
    id: 'tactical',
    title: 'Taktik Odaklı Analiz',
    bonus: '+25% Taktiksel',
    description: 'Formasyon, maç senaryosu, strateji',
    icon: 'layers-outline',
    color: '#FDE047', // ✅ Daha parlak sarı
    borderColor: '#EAB308',
    backgroundColor: '#1C1A05', // ✅ Derin sarı-kahve
  },
  {
    id: 'player',
    title: 'Oyuncu Odaklı Analiz',
    bonus: '+30% Bireysel',
    description: 'Golcü, asist kralı, maçın oyuncusu',
    icon: 'people-outline',
    color: '#FDBA74', // ✅ Daha parlak turuncu
    borderColor: '#F97316',
    backgroundColor: '#1C1006', // ✅ Derin turuncu-kahve
  },
];

interface AnalysisFocusModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectFocus: (focus: AnalysisFocusType) => void;
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    date: string;
  };
}

export const AnalysisFocusModal: React.FC<AnalysisFocusModalProps> = ({
  visible,
  onClose,
  onSelectFocus,
  matchInfo,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<AnalysisFocusType | null>(null);

  const handleSelectFocus = (focus: AnalysisFocus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFocus(focus.id);
    
    // ✅ Anında geçiş - gecikme yok
    onSelectFocus(focus.id);
    setSelectedFocus(null);
  };

  const renderFocusCard = (focus: AnalysisFocus) => {
    const isSelected = selectedFocus === focus.id;
    
    return (
      <TouchableOpacity
        key={focus.id}
        style={[
          styles.focusCard, 
          { 
            borderColor: focus.borderColor,
            backgroundColor: focus.backgroundColor,
          },
          isSelected && styles.focusCardSelected
        ]}
        onPress={() => handleSelectFocus(focus)}
        activeOpacity={0.85}
      >
        {/* İkon */}
        <View style={styles.iconRow}>
          <View style={[styles.focusIconContainer, { borderColor: `${focus.color}60`, backgroundColor: `${focus.color}15` }]}>
            <Ionicons name={focus.icon} size={16} color={focus.color} />
          </View>
        </View>
        
        {/* Başlık - Sabit yükseklik (2 satır için) */}
        <View style={styles.titleRow}>
          <Text style={styles.focusTitle} numberOfLines={2}>{focus.title}</Text>
        </View>
        
        {/* Bonus Badge - Sabit yükseklik */}
        <View style={styles.badgeRow}>
          <View style={[styles.bonusBadge, { borderColor: focus.color, backgroundColor: `${focus.color}15` }]}>
            <Text style={[styles.bonusText, { color: focus.color }]}>{focus.bonus}</Text>
          </View>
        </View>
        
        {/* Açıklama - Esnek alan */}
        <View style={styles.descriptionRow}>
          <Text style={styles.focusDescription} numberOfLines={2}>{focus.description}</Text>
          <Text style={[styles.focusBonusLabel, { color: focus.color }]}>
            ⭐ Bonus: {getBonusLabels(focus.id)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* ✅ Grid Pattern Background */}
        <View style={styles.gridPattern} />
        
        {/* Kapatma için overlay'e tıklama */}
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analiz Odağı Sistemi</Text>
            <Text style={styles.subtitle}>
              Maç öncesi analiz odağınızı seçin ve belirli kategorilerde bonus kazanın
            </Text>
          </View>
          
          {/* Focus Cards Grid - 2 sütun 3 satır */}
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {ANALYSIS_FOCUSES.map(renderFocusCard)}
            </View>
          </View>
          
          {/* Örnek Bilgi */}
          <View style={styles.infoBox}>
            <Ionicons name="bulb" size={14} color="#FBBF24" />
            <Text style={styles.infoText}>
              Örnek: Savunma odaklı analiz seçerseniz ve sarı kart sayısını doğru tahmin ederseniz, normal puanın %20 fazlasını kazanırsınız
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0F2A24', // ✅ Design System: Koyu yeşil taban
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  // ✅ Grid Pattern Background - Dashboard ile aynı
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 700,
    maxHeight: '90%', // ✅ Ekran taşmasını önle
    backgroundColor: '#0F2A24', // ✅ Design System: Koyu yeşil zemin
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(31, 162, 166, 0.25)', // ✅ Turkuaz border
    zIndex: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(31, 162, 166, 0.1)',
      },
      default: {
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md, // ✅ Daha kompakt
  },
  title: {
    fontSize: 22, // ✅ Daha küçük başlık
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#CBD5E1', // ✅ Daha okunabilir
    textAlign: 'center',
    lineHeight: 18,
  },
  gridContainer: {
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  focusCard: {
    // Responsive: Geniş ekranda 3 sütun, dar ekranda 2 sütun
    width: width > 600 ? '32%' : '48%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10, // ✅ Sabit padding
    marginBottom: 8,
    // ✅ Sabit yükseklik YOK - içerik kadar uzasın
    overflow: 'hidden', // ✅ Taşmayı önle
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  focusCardSelected: {
    borderColor: '#1FA2A6',
    borderWidth: 2,
    transform: [{ scale: 0.97 }],
    backgroundColor: 'rgba(31, 162, 166, 0.1)',
  },
  // Satır stilleri - Esnek yapı
  iconRow: {
    marginBottom: 6,
  },
  titleRow: {
    marginBottom: 6,
    overflow: 'hidden', // ✅ Taşma önle
  },
  badgeRow: {
    marginBottom: 6,
    overflow: 'hidden', // ✅ Taşma önle
  },
  descriptionRow: {
    overflow: 'hidden', // ✅ Taşma önle
  },
  focusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  focusTitle: {
    fontSize: 12, // ✅ Daha okunabilir başlık
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  bonusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bonusText: {
    fontSize: 10, // ✅ Daha okunabilir bonus
    fontWeight: '700',
  },
  focusDescription: {
    fontSize: 10, // ✅ Daha okunabilir açıklama
    color: '#CBD5E1', // ✅ Daha parlak gri - okunabilirlik artırıldı
    lineHeight: 13,
  },
  focusBonusLabel: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: '700',
    opacity: 0.9,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#FDE68A', // ✅ Daha parlak sarı - okunabilirlik
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AnalysisFocusModal;
