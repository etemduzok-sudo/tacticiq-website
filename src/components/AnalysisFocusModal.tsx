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

const { width, height } = Dimensions.get('window');

export type AnalysisFocusType = 
  | 'defense' 
  | 'offense' 
  | 'midfield' 
  | 'physical' 
  | 'tactical' 
  | 'player';

interface AnalysisFocus {
  id: AnalysisFocusType;
  title: string;
  bonus: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  borderColor: string;
  backgroundColor: string; // Kart zemin rengi
}

// Web tasarımına uygun renkler - her kart farklı zemin
const ANALYSIS_FOCUSES: AnalysisFocus[] = [
  {
    id: 'defense',
    title: 'Savunma Odaklı Analiz',
    bonus: '+20% Defansif Kategoriler',
    description: 'Sarı kartlar, kırmızı kartlar, isabetli şutlar kategorilerinde bonus puan',
    icon: 'shield-outline',
    color: '#60A5FA', // Mavi
    borderColor: '#1E40AF',
    backgroundColor: '#0C1929', // Koyu mavi zemin
  },
  {
    id: 'offense',
    title: 'Hücum Odaklı Analiz',
    bonus: '+20% Ofansif Kategoriler',
    description: 'Gol tahminleri, ilk gol zamanı, toplam şut kategorilerinde bonus puan',
    icon: 'flash-outline',
    color: '#F87171', // Kırmızı
    borderColor: '#991B1B',
    backgroundColor: '#1C0A0A', // Koyu kırmızı zemin
  },
  {
    id: 'midfield',
    title: 'Orta Saha Odaklı Analiz',
    bonus: '+15% Orta Saha Kategoriler',
    description: 'Top hakimiyeti, pas sayısı, anahtar pas kategorilerinde bonus puan',
    icon: 'radio-button-on-outline',
    color: '#C084FC', // Mor
    borderColor: '#7C3AED',
    backgroundColor: '#1A0A2E', // Koyu mor zemin
  },
  {
    id: 'physical',
    title: 'Fiziksel Odaklı Analiz',
    bonus: '+15% Fiziksel Kategoriler',
    description: 'Maç temposu, koşu mesafesi, sprint sayısı kategorilerinde bonus puan',
    icon: 'pulse-outline',
    color: '#4ADE80', // Yeşil
    borderColor: '#16A34A',
    backgroundColor: '#052E16', // Koyu yeşil zemin
  },
  {
    id: 'tactical',
    title: 'Taktik Odaklı Analiz',
    bonus: '+25% Taktiksel Kategoriler',
    description: 'Formasyon tahmini, maç senaryosu, stratejik odak kategorilerinde bonus puan',
    icon: 'layers-outline',
    color: '#FBBF24', // Sarı/Turuncu
    borderColor: '#B45309',
    backgroundColor: '#1C1708', // Koyu sarı/kahve zemin
  },
  {
    id: 'player',
    title: 'Oyuncu Odaklı Analiz',
    bonus: '+30% Bireysel Kategoriler',
    description: 'Golcü performansı, asist kralı, maçın oyuncusu kategorilerinde bonus puan',
    icon: 'people-outline',
    color: '#FB923C', // Turuncu
    borderColor: '#C2410C',
    backgroundColor: '#1C0F08', // Koyu turuncu zemin
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
    
    // Kısa bir gecikme ile seçimi gönder (animasyon için)
    setTimeout(() => {
      onSelectFocus(focus.id);
      setSelectedFocus(null);
    }, 200);
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
        {/* İkon - Sabit yükseklik */}
        <View style={styles.iconRow}>
          <View style={[styles.focusIconContainer, { borderColor: `${focus.color}40` }]}>
            <Ionicons name={focus.icon} size={24} color={focus.color} />
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
          <Text style={styles.focusDescription} numberOfLines={3}>{focus.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Koyu lacivert overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 700,
    backgroundColor: '#0F1F1B', // Web tasarımındaki koyu yeşil zemin
    borderRadius: 16,
    padding: SPACING.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
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
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    minHeight: width > 600 ? 160 : 140,
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
  // Satır stilleri - Yatay hizalama için
  iconRow: {
    height: 44,
    marginBottom: 6,
  },
  titleRow: {
    height: 36, // 2 satır için sabit yükseklik
    marginBottom: 4,
  },
  badgeRow: {
    height: 24,
    marginBottom: 4,
  },
  descriptionRow: {
    flex: 1,
  },
  focusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  bonusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  focusDescription: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#FBBF24',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default AnalysisFocusModal;
