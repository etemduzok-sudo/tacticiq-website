import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Platform,
  ViewStyle,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage as changeI18nLanguage } from '../i18n';
import { setUserTimezone } from '../utils/timezoneUtils';
import { getFallbackClubTeamsForProfile, getTeamById } from '../data/staticTeamsData';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, FadeIn, FadeOut } from 'react-native-reanimated';
import { usersDb, predictionsDb } from '../services/databaseService';
import { STORAGE_KEYS, isSuperAdmin } from '../config/constants';
import { AnalysisCluster } from '../types/prediction.types';
import { getAllAvailableBadges } from '../services/badgeService';
import { Badge, getBadgeColor, getBadgeTierName } from '../types/badges.types';
import { ALL_BADGES } from '../constants/badges';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import { logger } from '../utils/logger';
import { profileService } from '../services/profileService';
import { setFavoriteTeams as saveFavoriteTeamsToStorage } from '../utils/storageUtils';
import { calculateTopPercent } from '../types/profile.types';
import { teamsApi } from '../services/api';
import { SPACING, TYPOGRAPHY, BRAND, COLORS, SIZES, SHADOWS } from '../theme/theme';
import { StandardHeader, ScreenLayout } from '../components/layouts';
import { useTheme } from '../contexts/ThemeContext';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import authService from '../services/authService';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import { translateCountry, getCountryFlag, getCountryFlagUrl, getCountryRankingLabel, getCountryFromCode } from '../utils/countryUtils';
import { getDeviceCountryCode } from '../utils/deviceCountry';
import { formatWorldRankingDisplay } from '../types/profile.types';


interface ProfileScreenProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade: () => void;
  onDatabaseTest?: () => void;
  onTeamSelect?: (teamId: number, teamName: string) => void; // ✅ Takım seçildiğinde o takımın maçlarını göster
  onTeamsChange?: () => void; // ✅ Takım değiştiğinde App.tsx'e bildir (maç verilerini güncelle)
  setAllFavoriteTeamsFromApp?: (teams: Array<{ id: number; name: string; logo: string; colors?: string[]; type?: 'club' | 'national' }>) => Promise<boolean>; // ✅ App.tsx'teki hook ile aynı state'i kullan
  initialTab?: 'profile' | 'badges'; // Initial tab to show
}

// ✅ TÜM MİLLİ TAKIMLAR - 50+ ülke
const FALLBACK_NATIONAL_TEAMS = [
  // Türkiye önce
  { id: 777, name: 'Türkiye', country: 'Turkey', type: 'national' as const, colors: ['#E30A17', '#FFFFFF'], flag: 'https://flagcdn.com/w80/tr.png' },
  // UEFA - Avrupa
  { id: 25, name: 'Germany', country: 'Germany', type: 'national' as const, colors: ['#000000', '#DD0000', '#FFCC00'], flag: 'https://flagcdn.com/w80/de.png' },
  { id: 2, name: 'France', country: 'France', type: 'national' as const, colors: ['#002395', '#FFFFFF', '#ED2939'], flag: 'https://flagcdn.com/w80/fr.png' },
  { id: 10, name: 'England', country: 'England', type: 'national' as const, colors: ['#FFFFFF', '#CF081F'], flag: 'https://flagcdn.com/w80/gb-eng.png' },
  { id: 9, name: 'Spain', country: 'Spain', type: 'national' as const, colors: ['#AA151B', '#F1BF00'], flag: 'https://flagcdn.com/w80/es.png' },
  { id: 768, name: 'Italy', country: 'Italy', type: 'national' as const, colors: ['#009246', '#FFFFFF', '#CE2B37'], flag: 'https://flagcdn.com/w80/it.png' },
  { id: 27, name: 'Portugal', country: 'Portugal', type: 'national' as const, colors: ['#006600', '#FF0000'], flag: 'https://flagcdn.com/w80/pt.png' },
  { id: 1, name: 'Belgium', country: 'Belgium', type: 'national' as const, colors: ['#000000', '#FFCD00', '#FF0000'], flag: 'https://flagcdn.com/w80/be.png' },
  { id: 4, name: 'Netherlands', country: 'Netherlands', type: 'national' as const, colors: ['#FF6600', '#FFFFFF'], flag: 'https://flagcdn.com/w80/nl.png' },
  { id: 3, name: 'Croatia', country: 'Croatia', type: 'national' as const, colors: ['#FF0000', '#FFFFFF', '#0000FF'], flag: 'https://flagcdn.com/w80/hr.png' },
  { id: 24, name: 'Poland', country: 'Poland', type: 'national' as const, colors: ['#FFFFFF', '#DC143C'], flag: 'https://flagcdn.com/w80/pl.png' },
  { id: 772, name: 'Ukraine', country: 'Ukraine', type: 'national' as const, colors: ['#005BBB', '#FFD500'], flag: 'https://flagcdn.com/w80/ua.png' },
  { id: 15, name: 'Austria', country: 'Austria', type: 'national' as const, colors: ['#ED2939', '#FFFFFF'], flag: 'https://flagcdn.com/w80/at.png' },
  { id: 14, name: 'Switzerland', country: 'Switzerland', type: 'national' as const, colors: ['#FF0000', '#FFFFFF'], flag: 'https://flagcdn.com/w80/ch.png' },
  { id: 21, name: 'Denmark', country: 'Denmark', type: 'national' as const, colors: ['#C8102E', '#FFFFFF'], flag: 'https://flagcdn.com/w80/dk.png' },
  { id: 29, name: 'Wales', country: 'Wales', type: 'national' as const, colors: ['#C8102E', '#FFFFFF'], flag: 'https://flagcdn.com/w80/gb-wls.png' },
  { id: 30, name: 'Scotland', country: 'Scotland', type: 'national' as const, colors: ['#0065BF', '#FFFFFF'], flag: 'https://flagcdn.com/w80/gb-sct.png' },
  { id: 31, name: 'Ireland', country: 'Ireland', type: 'national' as const, colors: ['#169B62', '#FFFFFF', '#FF883E'], flag: 'https://flagcdn.com/w80/ie.png' },
  { id: 32, name: 'Sweden', country: 'Sweden', type: 'national' as const, colors: ['#006AA7', '#FECC00'], flag: 'https://flagcdn.com/w80/se.png' },
  { id: 33, name: 'Norway', country: 'Norway', type: 'national' as const, colors: ['#EF2B2D', '#002868'], flag: 'https://flagcdn.com/w80/no.png' },
  { id: 34, name: 'Finland', country: 'Finland', type: 'national' as const, colors: ['#003580', '#FFFFFF'], flag: 'https://flagcdn.com/w80/fi.png' },
  { id: 35, name: 'Czech Republic', country: 'Czech Republic', type: 'national' as const, colors: ['#D7141A', '#11457E'], flag: 'https://flagcdn.com/w80/cz.png' },
  { id: 36, name: 'Hungary', country: 'Hungary', type: 'national' as const, colors: ['#CD2A3E', '#436F4D'], flag: 'https://flagcdn.com/w80/hu.png' },
  { id: 37, name: 'Romania', country: 'Romania', type: 'national' as const, colors: ['#002B7F', '#FCD116', '#CE1126'], flag: 'https://flagcdn.com/w80/ro.png' },
  { id: 38, name: 'Serbia', country: 'Serbia', type: 'national' as const, colors: ['#C6363C', '#0C4076'], flag: 'https://flagcdn.com/w80/rs.png' },
  { id: 39, name: 'Greece', country: 'Greece', type: 'national' as const, colors: ['#0D5EAF', '#FFFFFF'], flag: 'https://flagcdn.com/w80/gr.png' },
  { id: 40, name: 'Russia', country: 'Russia', type: 'national' as const, colors: ['#FFFFFF', '#0039A6', '#D52B1E'], flag: 'https://flagcdn.com/w80/ru.png' },
  { id: 41, name: 'Slovenia', country: 'Slovenia', type: 'national' as const, colors: ['#005DA4', '#ED1C24'], flag: 'https://flagcdn.com/w80/si.png' },
  { id: 42, name: 'Slovakia', country: 'Slovakia', type: 'national' as const, colors: ['#0B4EA2', '#EE1C25'], flag: 'https://flagcdn.com/w80/sk.png' },
  { id: 43, name: 'Albania', country: 'Albania', type: 'national' as const, colors: ['#E41E20', '#000000'], flag: 'https://flagcdn.com/w80/al.png' },
  { id: 44, name: 'North Macedonia', country: 'North Macedonia', type: 'national' as const, colors: ['#D20000', '#FFE600'], flag: 'https://flagcdn.com/w80/mk.png' },
  { id: 45, name: 'Georgia', country: 'Georgia', type: 'national' as const, colors: ['#FFFFFF', '#FF0000'], flag: 'https://flagcdn.com/w80/ge.png' },
  { id: 46, name: 'Iceland', country: 'Iceland', type: 'national' as const, colors: ['#02529C', '#DC1E35'], flag: 'https://flagcdn.com/w80/is.png' },
  // CONMEBOL - Güney Amerika
  { id: 6, name: 'Brazil', country: 'Brazil', type: 'national' as const, colors: ['#009C3B', '#FFDF00'], flag: 'https://flagcdn.com/w80/br.png' },
  { id: 26, name: 'Argentina', country: 'Argentina', type: 'national' as const, colors: ['#74ACDF', '#FFFFFF'], flag: 'https://flagcdn.com/w80/ar.png' },
  { id: 47, name: 'Uruguay', country: 'Uruguay', type: 'national' as const, colors: ['#0038A8', '#FFFFFF'], flag: 'https://flagcdn.com/w80/uy.png' },
  { id: 48, name: 'Colombia', country: 'Colombia', type: 'national' as const, colors: ['#FCD116', '#003893', '#CE1126'], flag: 'https://flagcdn.com/w80/co.png' },
  { id: 49, name: 'Chile', country: 'Chile', type: 'national' as const, colors: ['#D52B1E', '#0039A6'], flag: 'https://flagcdn.com/w80/cl.png' },
  { id: 50, name: 'Peru', country: 'Peru', type: 'national' as const, colors: ['#D91023', '#FFFFFF'], flag: 'https://flagcdn.com/w80/pe.png' },
  { id: 51, name: 'Ecuador', country: 'Ecuador', type: 'national' as const, colors: ['#FFD100', '#0033A0'], flag: 'https://flagcdn.com/w80/ec.png' },
  { id: 52, name: 'Paraguay', country: 'Paraguay', type: 'national' as const, colors: ['#D52B1E', '#0038A8'], flag: 'https://flagcdn.com/w80/py.png' },
  { id: 53, name: 'Venezuela', country: 'Venezuela', type: 'national' as const, colors: ['#FCE300', '#003DA5', '#EF3340'], flag: 'https://flagcdn.com/w80/ve.png' },
  { id: 54, name: 'Bolivia', country: 'Bolivia', type: 'national' as const, colors: ['#D52B1E', '#F9E300', '#007934'], flag: 'https://flagcdn.com/w80/bo.png' },
  // CONCACAF - Kuzey/Orta Amerika
  { id: 22, name: 'USA', country: 'USA', type: 'national' as const, colors: ['#002868', '#BF0A30'], flag: 'https://flagcdn.com/w80/us.png' },
  { id: 16, name: 'Mexico', country: 'Mexico', type: 'national' as const, colors: ['#006847', '#FFFFFF', '#CE1126'], flag: 'https://flagcdn.com/w80/mx.png' },
  { id: 55, name: 'Canada', country: 'Canada', type: 'national' as const, colors: ['#FF0000', '#FFFFFF'], flag: 'https://flagcdn.com/w80/ca.png' },
  { id: 56, name: 'Costa Rica', country: 'Costa Rica', type: 'national' as const, colors: ['#002B7F', '#CE1126'], flag: 'https://flagcdn.com/w80/cr.png' },
  { id: 57, name: 'Jamaica', country: 'Jamaica', type: 'national' as const, colors: ['#009B3A', '#FED100', '#000000'], flag: 'https://flagcdn.com/w80/jm.png' },
  { id: 58, name: 'Panama', country: 'Panama', type: 'national' as const, colors: ['#005293', '#D21034'], flag: 'https://flagcdn.com/w80/pa.png' },
  // CAF - Afrika
  { id: 59, name: 'Nigeria', country: 'Nigeria', type: 'national' as const, colors: ['#008751', '#FFFFFF'], flag: 'https://flagcdn.com/w80/ng.png' },
  { id: 60, name: 'South Africa', country: 'South Africa', type: 'national' as const, colors: ['#007749', '#FFB81C', '#000000'], flag: 'https://flagcdn.com/w80/za.png' },
  { id: 61, name: 'Egypt', country: 'Egypt', type: 'national' as const, colors: ['#CE1126', '#FFFFFF', '#000000'], flag: 'https://flagcdn.com/w80/eg.png' },
  { id: 62, name: 'Morocco', country: 'Morocco', type: 'national' as const, colors: ['#C1272D', '#006233'], flag: 'https://flagcdn.com/w80/ma.png' },
  { id: 63, name: 'Senegal', country: 'Senegal', type: 'national' as const, colors: ['#00853F', '#FDEF42', '#E31B23'], flag: 'https://flagcdn.com/w80/sn.png' },
  { id: 64, name: 'Algeria', country: 'Algeria', type: 'national' as const, colors: ['#006233', '#FFFFFF', '#D21034'], flag: 'https://flagcdn.com/w80/dz.png' },
  { id: 65, name: 'Tunisia', country: 'Tunisia', type: 'national' as const, colors: ['#E70013', '#FFFFFF'], flag: 'https://flagcdn.com/w80/tn.png' },
  { id: 66, name: 'Cameroon', country: 'Cameroon', type: 'national' as const, colors: ['#007A5E', '#CE1126', '#FCD116'], flag: 'https://flagcdn.com/w80/cm.png' },
  { id: 67, name: 'Ghana', country: 'Ghana', type: 'national' as const, colors: ['#006B3F', '#FCD116', '#CE1126'], flag: 'https://flagcdn.com/w80/gh.png' },
  { id: 68, name: 'Ivory Coast', country: 'Ivory Coast', type: 'national' as const, colors: ['#F77F00', '#FFFFFF', '#009E60'], flag: 'https://flagcdn.com/w80/ci.png' },
  { id: 69, name: 'DR Congo', country: 'DR Congo', type: 'national' as const, colors: ['#007FFF', '#CE1021', '#F7D618'], flag: 'https://flagcdn.com/w80/cd.png' },
  { id: 70, name: 'Mali', country: 'Mali', type: 'national' as const, colors: ['#14B53A', '#FCD116', '#CE1126'], flag: 'https://flagcdn.com/w80/ml.png' },
  // AFC - Asya
  { id: 12, name: 'Japan', country: 'Japan', type: 'national' as const, colors: ['#FFFFFF', '#BC002D'], flag: 'https://flagcdn.com/w80/jp.png' },
  { id: 17, name: 'South Korea', country: 'South Korea', type: 'national' as const, colors: ['#FFFFFF', '#C60C30'], flag: 'https://flagcdn.com/w80/kr.png' },
  { id: 23, name: 'Australia', country: 'Australia', type: 'national' as const, colors: ['#00843D', '#FFCD00'], flag: 'https://flagcdn.com/w80/au.png' },
  { id: 28, name: 'Saudi Arabia', country: 'Saudi Arabia', type: 'national' as const, colors: ['#006C35', '#FFFFFF'], flag: 'https://flagcdn.com/w80/sa.png' },
  { id: 71, name: 'Iran', country: 'Iran', type: 'national' as const, colors: ['#239F40', '#FFFFFF', '#DA0000'], flag: 'https://flagcdn.com/w80/ir.png' },
  { id: 72, name: 'Qatar', country: 'Qatar', type: 'national' as const, colors: ['#8D1B3D', '#FFFFFF'], flag: 'https://flagcdn.com/w80/qa.png' },
  { id: 73, name: 'UAE', country: 'UAE', type: 'national' as const, colors: ['#00732F', '#FFFFFF', '#FF0000', '#000000'], flag: 'https://flagcdn.com/w80/ae.png' },
  { id: 74, name: 'China', country: 'China', type: 'national' as const, colors: ['#DE2910', '#FFDE00'], flag: 'https://flagcdn.com/w80/cn.png' },
  { id: 75, name: 'India', country: 'India', type: 'national' as const, colors: ['#FF9933', '#FFFFFF', '#138808'], flag: 'https://flagcdn.com/w80/in.png' },
  { id: 76, name: 'Iraq', country: 'Iraq', type: 'national' as const, colors: ['#007A3D', '#FFFFFF', '#CE1126', '#000000'], flag: 'https://flagcdn.com/w80/iq.png' },
  { id: 77, name: 'Uzbekistan', country: 'Uzbekistan', type: 'national' as const, colors: ['#1EB53A', '#0099B5', '#FFFFFF'], flag: 'https://flagcdn.com/w80/uz.png' },
  // OFC - Okyanusya
  { id: 78, name: 'New Zealand', country: 'New Zealand', type: 'national' as const, colors: ['#000000', '#FFFFFF'], flag: 'https://flagcdn.com/w80/nz.png' },
];

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/İ/g, 'i').replace(/Ğ/g, 'g').replace(/Ü/g, 'u')
    .replace(/Ş/g, 's').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[ß]/g, 'ss').replace(/[æ]/g, 'ae').replace(/[œ]/g, 'oe')
    .replace(/[ÀÁÂÃÄÅ]/g, 'a').replace(/[ÈÉÊË]/g, 'e')
    .replace(/[ÌÍÎÏ]/g, 'i').replace(/[ÒÓÔÕÖ]/g, 'o')
    .replace(/[ÙÚÛÜ]/g, 'u').replace(/[Ñ]/g, 'n');
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onSettings,
  onProUpgrade,
  onDatabaseTest,
  onTeamSelect,
  onTeamsChange,
  setAllFavoriteTeamsFromApp,
  initialTab = 'profile',
}) => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [languageKey, setLanguageKey] = useState(0); // Dil değişikliği için key
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ✅ OTOMATİK KAYDETME STATE
  const [autoSaveMessage, setAutoSaveMessage] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const nicknameCheckTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const profileIdRef = React.useRef<string | null>(null);
  
  // 📝 PROFILE EDITING STATE
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  
  // 🏆 BADGE SYSTEM STATE
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>(initialTab);
  
  // Update activeTab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  
  // ⚽ FAVORITE TEAMS STATE - useFavoriteTeams hook'unu kullan
  const { favoriteTeams, addFavoriteTeam, removeFavoriteTeam, setAllFavoriteTeams, isFavorite, refetch, bulkDownloadProgress, isBulkDownloading } = useFavoriteTeams();
  
  // ✅ Takım seçim state'leri
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string; flag?: string } | null>(null);
  const [selectedClubTeams, setSelectedClubTeams] = useState<Array<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null>>([null, null, null, null, null]);
  
  // ✅ useFavoriteTeams hook'undan gelen verilerle state'leri senkronize et
  useEffect(() => {
    if (favoriteTeams && favoriteTeams.length > 0) {
      console.log('🔄 Syncing favoriteTeams to state:', favoriteTeams.map(t => ({ name: t.name, type: t.type, id: t.id })));
      
      // Milli takımı bul
      const nationalTeam = favoriteTeams.find((t: any) => t.type === 'national');
      if (nationalTeam) {
        const country = (nationalTeam as any).country || 'Milli Takım';
        setSelectedNationalTeam({
          id: nationalTeam.id,
          name: nationalTeam.name,
          colors: nationalTeam.colors || ['#1E40AF', '#FFFFFF'],
          country,
          league: (nationalTeam as any).league || 'UEFA',
          coach: (nationalTeam as any).coach || 'Bilinmiyor',
          flag: (nationalTeam as any).flag || getCountryFlagUrl(country),
        });
      }
      
      // Kulüp takımlarını bul
      const clubTeams = favoriteTeams.filter((t: any) => t.type === 'club').slice(0, 5);
      const clubArray: Array<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null> = [null, null, null, null, null];
      clubTeams.forEach((team: any, idx: number) => {
        if (idx < 5) {
          clubArray[idx] = {
            id: team.id,
            name: team.name,
            colors: team.colors || ['#1E40AF', '#FFFFFF'],
            country: team.country || 'Unknown',
            league: team.league || 'Unknown',
            coach: team.coach || 'Bilinmiyor',
          };
        }
      });
      setSelectedClubTeams(clubArray);
      
      console.log('✅ State synced:', { 
        national: nationalTeam?.name || 'none', 
        clubs: clubTeams.map((t: any) => t.name) 
      });
    }
  }, [favoriteTeams]);
  const [openDropdown, setOpenDropdown] = useState<'national' | 'club' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiTeams, setApiTeams] = useState<Array<{ id: number; name: string; colors: string[]; country: string; league: string; type: 'club' | 'national'; coach?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const clubDropdownScrollRef = React.useRef<ScrollView>(null);
  const nationalDropdownScrollRef = React.useRef<ScrollView>(null);
  
  // Tüm liglerden kulüp takımları - staticTeamsData'dan (tek kaynak)
  const FALLBACK_CLUB_TEAMS = getFallbackClubTeamsForProfile();

  // normalizeText component dışında tanımlı (pure function)

  // ✅ Fallback takımları filtrele ve göster - GELİŞTİRİLMİŞ
  const useFallbackTeams = useCallback((query: string, type: 'club' | 'national') => {
    const fallbackList = type === 'national' ? FALLBACK_NATIONAL_TEAMS : FALLBACK_CLUB_TEAMS;
    
    if (!query || query.length === 0) {
      // Boş sorgu - tüm fallback takımları göster
      setApiTeams(fallbackList.map(team => ({
        id: team.id,
        name: team.name,
        country: team.country || 'Unknown',
        league: (team as any).league || '',
        type: team.type,
        colors: team.colors || ['#1E40AF', '#FFFFFF'],
        coach: undefined,
        flag: (team as any).flag || getCountryFlagUrl(team.country),
      })));
    } else {
      // Normalize edilmiş sorgu
      const normalizedQuery = normalizeText(query);
      
      // Türkiye için özel kontrol
      const isTurkeySearch = ['turk', 'türk', 'turkey', 'türkiye'].some(t => 
        normalizedQuery.includes(normalizeText(t))
      );
      
      // Sorguya göre filtrele - TÜM DİLLER + kelime bazlı (palme → Palmeiras, boca → Boca)
      const filtered = fallbackList.filter(team => {
        const normalizedName = normalizeText(team.name);
        const normalizedLeague = normalizeText((team as any).league || '');
        const normalizedCountry = normalizeText(team.country || '');
        
        // Türkiye araması ise Türk milli takımlarını dahil et
        if (isTurkeySearch && team.country === 'Turkey' && type === 'national') {
          return true;
        }
        
        // 1. Tam takım adı eşleşmesi
        if (normalizedName === normalizedQuery) return true;
        
        // 2. Takım adı başlangıç eşleşmesi (boca → Boca Juniors)
        if (normalizedName.startsWith(normalizedQuery)) return true;
        
        // 3. Kelimelerin herhangi biri sorgu ile başlıyorsa (Boca Juniors → "jun" matches "Juniors")
        const words = normalizedName.split(/[\s\-\/]+/);
        if (words.some((w: string) => w.startsWith(normalizedQuery))) return true;
        
        // 4. Sorgu takım adının herhangi bir yerinde geçiyorsa (palme → Palmeiras)
        if (normalizedName.includes(normalizedQuery)) return true;
        
        // 5. Lig adında ara (Brasileirão, Süper Lig vb.) - 3+ karakter gerekli
        if (normalizedQuery.length >= 3 && normalizedLeague.includes(normalizedQuery)) return true;
        
        // 6. Ülke adında ara
        if (normalizedQuery.length >= 2 && normalizedCountry.includes(normalizedQuery)) return true;
        
        return false;
      });
      
      // GELİŞTİRİLMİŞ Relevans sıralaması:
      // 1. Tam eşleşme en üstte
      // 2. İsim başlangıç eşleşmesi
      // 3. Kelime başlangıç eşleşmesi (Boca → Boca Juniors)
      // 4. İçerme eşleşmesi
      const sorted = [...filtered].sort((a, b) => {
        const nameA = normalizeText(a.name);
        const nameB = normalizeText(b.name);
        const wordsA = nameA.split(/[\s\-\/]+/);
        const wordsB = nameB.split(/[\s\-\/]+/);
        
        // Tam eşleşme (en yüksek öncelik)
        const aExact = nameA === normalizedQuery;
        const bExact = nameB === normalizedQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // İsim başlangıç eşleşmesi
        const aNameStarts = nameA.startsWith(normalizedQuery);
        const bNameStarts = nameB.startsWith(normalizedQuery);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;
        
        // Kelime başlangıç eşleşmesi (boca → "Boca" Juniors)
        const aWordStarts = wordsA.some((w: string) => w.startsWith(normalizedQuery));
        const bWordStarts = wordsB.some((w: string) => w.startsWith(normalizedQuery));
        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;
        
        // Eşit öncelik: alfabetik sırala
        return nameA.localeCompare(nameB);
      });
      
      setApiTeams(sorted.map(team => ({
        id: team.id,
        name: team.name,
        country: team.country || 'Unknown',
        league: (team as any).league || '',
        type: team.type,
        colors: team.colors || ['#1E40AF', '#FFFFFF'],
        coach: undefined,
        flag: (team as any).flag || getCountryFlagUrl(team.country),
      })));
    }
  }, [normalizeText]);
  
  // ✅ Dropdown açıldığında varsayılan takımları HEMEN göster (fallback'ten)
  useEffect(() => {
    if (openDropdown) {
      setSearchQuery('');
          const type = openDropdown === 'national' ? 'national' : 'club';
      // Hemen fallback takımları göster (sıçrama olmasın)
      useFallbackTeams('', type);
      setIsSearching(false);
    } else {
      setApiTeams([]);
    }
  }, [openDropdown, useFallbackTeams]);

  // ✅ Arama sonuçları değişince scroll'u en üste al (tüm filtrelemede)
  useEffect(() => {
    if (!openDropdown || apiTeams.length === 0) return;
    const ref = openDropdown === 'club' ? clubDropdownScrollRef : nationalDropdownScrollRef;
    setTimeout(() => ref.current?.scrollTo?.({ y: 0, animated: true }), 50);
  }, [apiTeams, openDropdown]);

  // ✅ Arama debounce - sıçramayı önler (150ms gecikme)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSearchTypeRef = React.useRef<'club' | 'national'>('club');
  
  const handleTeamSearch = useCallback((query: string, type: 'club' | 'national') => {
    lastSearchTypeRef.current = type;
    
    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce: 150ms sonra ara (sıçramayı önler)
    searchTimeoutRef.current = setTimeout(() => {
      useFallbackTeams(query, type);
    }, 150);
  }, [useFallbackTeams]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // 🌙 TEMA STATE - ThemeContext'ten al
  const { theme: currentTheme, setTheme: setAppTheme } = useTheme();
  const isDarkMode = currentTheme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  // Rozetler: mobilde 4 sütun, web'de 8 sütun
  const badgeColumnCount = screenWidth < 600 ? 4 : 8;

  // 🎨 Dinamik stiller - tema değişince yeniden oluştur
  const styles = useMemo(() => createStyles(isDarkMode), [isDarkMode]);
  const theme = useMemo(() => isDarkMode ? COLORS.dark : COLORS.light, [isDarkMode]);
  
  // 📊 USER STATS STATE
  const [user, setUser] = useState<{
    name: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
    points: number;
    countryRank: number;
    globalRank: number;
    totalPlayers: number;
    country: string;
    avgMatchRating: number;
    xpGainThisWeek: number;
    stats: { success: number; total: number; streak: number };
    provider?: string;
  }>({
    name: 'Kullanıcı',
    username: '@kullanici',
    email: 'user@example.com',
    avatar: '',
    level: 1,
    points: 0,
    countryRank: 0,
    globalRank: 0,
    totalPlayers: 0,
    country: 'Türkiye',
    avgMatchRating: 0,
    xpGainThisWeek: 0,
    stats: {
      success: 0,
      total: 0,
      streak: 0,
    },
    provider: 'email',
  });

  // 🎯 BEST CLUSTER STATE
  const [bestCluster, setBestCluster] = useState<{
    name: string;
    accuracy: number;
    icon: string;
  } | null>(null);

  // ⚙️ SETTINGS STATE - Web ile aynı
  // Dil kodu normalize et (en-US -> en)
  const normalizeLangCode = (lng: string) => (lng || 'tr').split('-')[0];
  const [selectedLanguage, setSelectedLanguage] = useState(normalizeLangCode(i18nInstance.language || 'tr'));
  
  // i18n dil değişikliğini dinle + başlangıçta storage'dan senkronize et
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setSelectedLanguage(normalizeLangCode(lng));
    };
    
    // Mevcut dil ile senkronize et
    setSelectedLanguage(normalizeLangCode(i18nInstance.language || 'tr'));
    
    i18nInstance.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Istanbul');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [campaignNotifications, setCampaignNotifications] = useState(true);
  const [pushNotificationPermission, setPushNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default');
  
  // 🔒 SECURITY STATE
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Dil ve saat dilimini storage'dan yükle - i18n ile senkronize et (bayrak+dil uyumsuzluğunu önler)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        let lang: string | null = null;
        let tz: string | null = null;
        if (Platform.OS === 'web' && typeof window?.localStorage !== 'undefined') {
          lang = window.localStorage.getItem('tacticiq-language') || window.localStorage.getItem('@user_language');
          tz = window.localStorage.getItem('@user_timezone');
        } else {
          [lang, tz] = await Promise.all([
            AsyncStorage.getItem('tacticiq-language'),
            AsyncStorage.getItem('@user_timezone'),
          ]);
        }
        if (lang) {
          const norm = normalizeLangCode(lang);
          setSelectedLanguage(norm);
          // i18n dilini de güncelle - t() doğru dilde dönsün
          if (i18nInstance.language !== norm) {
            await changeI18nLanguage(norm);
          }
        }
        if (tz) setSelectedTimezone(tz);
      } catch (e) {
        // ignore
      }
    };
    loadSettings();
  }, []);

  // Push notification permission kontrolü
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      setPushNotificationPermission(Notification.permission as 'default' | 'granted' | 'denied');
    } else if (Platform.OS !== 'web') {
      // React Native için expo-notifications kullanılabilir
      // Şimdilik default olarak bırakıyoruz
    }
  }, []);

  // 🏆 LOAD BADGES - Hemen ALL_BADGES'i göster, sonra earned durumunu güncelle
  const loadBadges = async () => {
    try {
      // ✅ Hemen ALL_BADGES'i göster (yükleniyor... mesajını önle)
      const initialBadges = ALL_BADGES.map((badgeDef) => ({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.emoji,
        tier: badgeDef.tier as any,
        earned: false, // Başlangıçta hepsi kilitli
        earnedAt: undefined,
        requirement: badgeDef.howToEarn,
        category: 'PREDICTION_GOD' as any,
        color: badgeDef.color,
      }));
      
      setAllBadges(initialBadges as any);
      logger.info(`Badges initialized: ${ALL_BADGES.length} total`, { total: ALL_BADGES.length }, 'BADGES');
      
      // ✅ Arka planda earned durumunu güncelle
      try {
        const availableBadges = await getAllAvailableBadges();
        
        const badgesWithStatus = ALL_BADGES.map((badgeDef) => {
          const earnedBadge = availableBadges.find(b => b.id === badgeDef.id);
          return {
            id: badgeDef.id,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.emoji,
            tier: badgeDef.tier as any,
            earned: earnedBadge?.earned || false,
            earnedAt: earnedBadge?.earnedAt,
            requirement: badgeDef.howToEarn,
            category: earnedBadge?.category || 'PREDICTION_GOD' as any,
            color: badgeDef.color,
          };
        });
        
        setAllBadges(badgesWithStatus as any);
        const earnedCount = badgesWithStatus.filter(b => b.earned).length;
        setBadgeCount(earnedCount);
        logger.info(`Badges updated: ${earnedCount} earned`, { earned: earnedCount }, 'BADGES');
      } catch (err) {
        logger.warn('Failed to fetch earned badges', { error: err }, 'BADGES');
      }
    } catch (error) {
      logger.error('Error loading badges', { error }, 'BADGES');
      // Fallback: Yine de ALL_BADGES'i göster
      const fallbackBadges = ALL_BADGES.map((badgeDef) => ({
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.emoji,
        tier: badgeDef.tier as any,
        earned: false,
        earnedAt: undefined,
        requirement: badgeDef.howToEarn,
        category: 'PREDICTION_GOD' as any,
        color: badgeDef.color,
      }));
      setAllBadges(fallbackBadges as any);
      setBadgeCount(0);
    }
  };

  // 🔄 FETCH USER DATA FROM SUPABASE (Unified Profile Service)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // 🆕 Unified Profile Service kullan (Web ile senkronize)
        // ProfileService artık OAuth verilerini de normalize ediyor
        const unifiedProfile = await profileService.getProfile();
        
if (unifiedProfile) {
          profileIdRef.current = unifiedProfile.id;
          logger.info('Unified profile loaded', {
            id: unifiedProfile.id,
            plan: unifiedProfile.plan,
            firstName: unifiedProfile.firstName,
            lastName: unifiedProfile.lastName,
            avatar: unifiedProfile.avatar ? 'exists' : 'none',
            provider: unifiedProfile.provider
          }, 'PROFILE');
          
          // ✅ ProfileService normalize edilmiş veriyi döndürüyor
          // Artık ayrıca AsyncStorage okumaya gerek yok
          setFirstName(unifiedProfile.firstName || '');
          setLastName(unifiedProfile.lastName || '');
          setNickname(unifiedProfile.nickname || '');
          
          setUser({
            name: unifiedProfile.name || unifiedProfile.fullName || 'Kullanıcı',
            username: unifiedProfile.nickname ? `@${unifiedProfile.nickname}` : '@kullanici',
            email: unifiedProfile.email,
            avatar: unifiedProfile.avatar || '',
            level: unifiedProfile.level || 1,
            points: unifiedProfile.totalPoints || 0,
            countryRank: unifiedProfile.countryRank || 0,
            globalRank: unifiedProfile.globalRank || 0,
            totalPlayers: 5000, // TODO: Backend'den çekilecek
            country: unifiedProfile.country === 'TR' ? 'Türkiye' : unifiedProfile.country || 'Türkiye',
            avgMatchRating: (unifiedProfile.accuracy || 0) / 10,
            xpGainThisWeek: unifiedProfile.xp || 0,
            stats: {
              success: unifiedProfile.accuracy || 0,
              total: unifiedProfile.totalPredictions || 0,
              streak: unifiedProfile.currentStreak || 0,
            },
            provider: (unifiedProfile as any).provider || 'email',
          });
          
          // Pro durumu - birden fazla alan kontrol et + isSuperAdmin
          const userIsPro = isSuperAdmin(unifiedProfile.email) ||
                        unifiedProfile.plan === 'pro' || 
                        (unifiedProfile as any).is_pro === true || 
                        (unifiedProfile as any).isPro === true ||
                        (unifiedProfile as any).is_premium === true ||
                        (unifiedProfile as any).isPremium === true;
          setIsPro(userIsPro);
          logger.debug(`User is ${userIsPro ? 'PRO' : 'FREE'}`, { 
            email: unifiedProfile.email,
            isSuperAdmin: isSuperAdmin(unifiedProfile.email),
            plan: unifiedProfile.plan, 
            is_pro: (unifiedProfile as any).is_pro,
            isPremium: (unifiedProfile as any).isPremium 
          }, 'PROFILE');
          
          // Milli takım
          if (unifiedProfile.nationalTeam) {
            // Basit format: "🇹🇷 Türkiye" -> parse et
            setSelectedNationalTeam({
              id: 0,
              name: unifiedProfile.nationalTeam,
              colors: ['#E30A17', '#FFFFFF'],
              country: unifiedProfile.nationalTeam,
              league: 'UEFA',
            });
          }
          
          // Kulüp takımları
          if (unifiedProfile.clubTeams && unifiedProfile.clubTeams.length > 0) {
            const clubArray: Array<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null> = [null, null, null, null, null];
            unifiedProfile.clubTeams.forEach((teamName: string, idx: number) => {
              if (idx < 5 && teamName) {
                clubArray[idx] = {
                  id: idx,
                  name: teamName,
                  colors: ['#1E40AF', '#FFFFFF'],
                  country: 'Unknown',
                  league: 'Unknown',
                };
              }
            });
            setSelectedClubTeams(clubArray);
          }

          // Settings state'lerini profil verilerinden al
          setSelectedLanguage(unifiedProfile.preferredLanguage || 'tr');
          setSelectedTimezone(unifiedProfile.timezone || 'Europe/Istanbul');
          // TODO: Bildirim ayarları profil verilerinden alınacak
          
          // ✅ Rozetleri yükle (erken return'den önce!)
          await loadBadges();
          
          // ✅ Unified profile bulundu, loading'i kapat ve çık
          setLoading(false);
          return;
        }

        // Fallback: ProfileService veri döndüremediyse AsyncStorage'dan dene
        logger.warn('ProfileService returned null, trying AsyncStorage fallback', undefined, 'PROFILE');
        
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        
        if (userData) {
          // ProfileService'in normalizeProfile fonksiyonunu simüle et
          const displayName = userData.displayName || userData.name || '';
          const nameParts = displayName.trim().split(' ').filter((p: string) => p.length > 0);
          const fName = userData.firstName || nameParts[0] || '';
          const lName = userData.lastName || nameParts.slice(1).join(' ') || '';
          const nick = userData.nickname || userData.username || userData.email?.split('@')[0] || '';
          const avatarUrl = userData.photoURL || userData.avatar || '';
          
          setFirstName(fName);
          setLastName(lName);
          setNickname(nick);
          
          setUser(prev => ({
            ...prev,
            name: displayName || `${fName} ${lName}`.trim() || prev.name,
            username: nick ? `@${nick}` : prev.username,
            avatar: avatarUrl || prev.avatar,
          }));
          
          logger.info('Fallback profile loaded from AsyncStorage', { provider: userData.provider }, 'PROFILE');
        }
        
        // UUID formatında değilse null gönder (Supabase UUID bekliyor)
        const userId = userData?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id) 
          ? userData.id 
          : null;
        
        // Load badges
        await loadBadges();
        
        // ✅ Favorite teams artık useFavoriteTeams hook'undan useEffect ile senkronize ediliyor
        // Ayrıca storage'dan okumaya gerek yok - hook otomatik yüklüyor
        console.log('📦 Favorite teams will be synced from useFavoriteTeams hook');

        // Check is_pro from AsyncStorage first (for development/testing)
        // ✅ Pro kontrolü: isSuperAdmin, is_pro, isPro, isPremium, plan === 'pro' veya plan === 'premium'
        const userEmail = userData?.email?.toLowerCase() || '';
        const storedIsPro = isSuperAdmin(userEmail) || userData?.is_pro === true || userData?.isPro === true || userData?.isPremium === true || userData?.plan === 'pro' || userData?.plan === 'premium';
        if (storedIsPro) {
          setIsPro(true);
          logger.debug('User is PRO', { email: userEmail, isSuperAdmin: isSuperAdmin(userEmail), is_pro: userData?.is_pro, isPro: userData?.isPro, isPremium: userData?.isPremium, plan: userData?.plan }, 'PROFILE');
        } else {
          setIsPro(false);
          logger.debug('User is NOT PRO', { email: userEmail, is_pro: userData?.is_pro, isPro: userData?.isPro, isPremium: userData?.isPremium, plan: userData?.plan }, 'PROFILE');
        }

        // Fetch user profile from Supabase (sadece geçerli UUID varsa)
        if (!userId) {
          logger.debug('No valid UUID found, skipping Supabase fetch', undefined, 'PROFILE');
          // Use AsyncStorage data if available
          if (userData) {
            // ✅ OAuth'tan gelen displayName, photoURL, firstName, lastName, nickname'i kontrol et
            const fullName = userData.displayName || userData.name || userData.username || 'Kullanıcı';
            const avatarUrl = userData.photoURL || userData.avatar || userData.avatar_url || '';
            const nick = userData.nickname || userData.username || '';
            
            // ✅ firstName/lastName varsa kullan, yoksa fullName'den ayır
            const nameParts = fullName.trim().split(' ').filter((p: string) => p.length > 0);
            const fName = userData.firstName || nameParts[0] || '';
            const lName = userData.lastName || nameParts.slice(1).join(' ') || '';
            
            // State'leri set et
            setFirstName(fName);
            setLastName(lName);
            setNickname(nick);
            
            setUser({
              name: fullName,
              username: `@${nick || 'kullanici'}`,
              email: userData.email || 'user@example.com',
              avatar: avatarUrl,
              level: 1,
              points: 0,
              countryRank: 0,
              totalPlayers: 1000,
              country: 'Türkiye',
              avgMatchRating: 0,
              xpGainThisWeek: 0,
              stats: {
                success: 0,
                total: 0,
                streak: 0,
              },
            });
          }
          setLoading(false);
          return;
        }
        
        const userResponse = await usersDb.getUserById(userId);
        if (userResponse.success && userResponse.data) {
          const dbUser = userResponse.data;
          setUser({
            name: dbUser.username || 'Kullanıcı',
            username: `@${dbUser.username || 'kullanici'}`,
            email: dbUser.email || 'user@example.com',
            avatar: dbUser.avatar_url || '',
            level: Math.floor((dbUser.total_points || 0) / 500) + 1,
            points: dbUser.total_points || 0,
            countryRank: dbUser.rank || 0,
            totalPlayers: 1000, // TODO: Get from database
            country: 'Türkiye',
            avgMatchRating: (dbUser.accuracy || 0) / 10,
            xpGainThisWeek: 0, // TODO: Calculate
            stats: {
              success: dbUser.accuracy || 0,
              total: dbUser.total_predictions || 0,
              streak: dbUser.current_streak || 0,
            },
          });
          // Use isSuperAdmin, Supabase is_pro or fallback to AsyncStorage
          const userEmail = dbUser.email || userData?.email || '';
          setIsPro(isSuperAdmin(userEmail) || dbUser.is_pro || storedIsPro || false);
        }

        // Fetch user predictions to calculate best cluster
        const predictionsResponse = await predictionsDb.getUserPredictions(userId, 100);
        if (predictionsResponse.success && predictionsResponse.data) {
          const predictions = predictionsResponse.data;
          
          // Calculate cluster performance
          const clusterStats: Record<AnalysisCluster, { correct: number; total: number }> = {
            [AnalysisCluster.TEMPO_FLOW]: { correct: 0, total: 0 },
            [AnalysisCluster.PHYSICAL_FATIGUE]: { correct: 0, total: 0 },
            [AnalysisCluster.DISCIPLINE]: { correct: 0, total: 0 },
            [AnalysisCluster.INDIVIDUAL]: { correct: 0, total: 0 },
          };

          predictions.forEach((pred: any) => {
            // TODO: Map prediction_type to cluster and calculate accuracy
            // This requires actual match results to compare
          });

          // Find best cluster (mock for now)
          setBestCluster({
            name: 'Tempo & Akış',
            accuracy: 75,
            icon: '⚡',
          });
        }

      } catch (error) {
        logger.error('Error fetching user data', { error, userId }, 'PROFILE');
      } finally {
        // ✅ Her durumda loading'i kapat
        setLoading(false);
      }
    };

    fetchUserData();
    
    // ✅ Her 3 saniyede bir AsyncStorage'ı kontrol et (Settings'den dönünce güncellensin)
    const interval = setInterval(async () => {
      try {
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        if (userData) {
          setUser(prev => ({
            ...prev,
            name: userData.name || prev.name,
            username: userData.username ? `@${userData.username}` : prev.username,
            avatar: userData.avatar || prev.avatar,
          }));
        }
      } catch (error) {
        logger.error('Error refreshing user data', { error }, 'PROFILE');
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // 📷 Fotoğraf Çekme
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profileSetup.permissionRequired'), t('profile.cameraPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), t('profile.cameraError'));
    }
  };

  // 🖼️ Galeriden Fotoğraf Seçme
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profileSetup.permissionRequired'), t('profile.galleryPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('profile.galleryError'));
    }
  };

  // 🗑️ Fotoğrafı Kaldırma
  const handleRemovePhoto = async () => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            await saveProfilePhoto('');
          },
        },
      ]
    );
  };

  // 💾 Fotoğrafı Kaydetme
  const saveProfilePhoto = async (photoUri: string) => {
    try {
      // Try new key first, fallback to legacy
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const parsedData = JSON.parse(userData);
        const updatedData = {
          ...parsedData,
          avatar: photoUri,
        };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedData));
        
        // State'i güncelle
        setUser(prev => ({ ...prev, avatar: photoUri }));
        setShowAvatarPicker(false);
        
        console.log('✅ Profile photo saved:', photoUri ? 'Photo set' : 'Photo removed');
      }
    } catch (error) {
      console.error('Error saving profile photo:', error);
      Alert.alert(t('common.error'), t('profile.savePhotoError'));
    }
  };

  // ✅ Takım seçildiğinde kaydet - DÜZELTILMIŞ
  const handleTeamSelect = useCallback(async (
    team: { id: number; name: string; colors: string[]; country: string; league: string; flag?: string },
    type: 'national' | 'club',
    index?: number
  ) => {
    console.log('🎯 handleTeamSelect called:', { team: team.name, type, index });
    
    // ÖNCE modal'ı kapat ve state'i güncelle
    setOpenDropdown(null);
    setSearchQuery('');
    setApiTeams([]);
    
    // Güncel seçili takımları hesapla
    let newNationalTeam = selectedNationalTeam;
    let newClubTeams = [...selectedClubTeams];
    
    // State'i hemen güncelle
    if (type === 'national') {
      newNationalTeam = { ...team, flag: team.flag || getCountryFlagUrl(team.country) };
      setSelectedNationalTeam(newNationalTeam);
      console.log('✅ National team state updated:', team.name);
    } else if (type === 'club' && index !== undefined && index >= 0 && index < 5) {
      newClubTeams[index] = team;
      setSelectedClubTeams(newClubTeams);
      console.log('✅ Club team state updated at index', index, ':', team.name);
    }
    
    // ✅ Tüm takımları birleştir ve ANINDA kaydet
    const allTeams: Array<{ id: number; name: string; logo: string; colors?: string[]; type?: 'club' | 'national' }> = [];
    
    // Milli takım ekle (type: 'national')
    if (newNationalTeam) {
      allTeams.push({
        id: newNationalTeam.id,
        name: newNationalTeam.name,
        logo: `https://media.api-sports.io/football/teams/${newNationalTeam.id}.png`,
        colors: newNationalTeam.colors,
        type: 'national',
      });
    }
    
    // Kulüp takımları ekle (type: 'club')
    newClubTeams.filter(Boolean).forEach(clubTeam => {
      if (clubTeam) {
        allTeams.push({
          id: clubTeam.id,
          name: clubTeam.name,
          logo: `https://media.api-sports.io/football/teams/${clubTeam.id}.png`,
          colors: clubTeam.colors,
          type: 'club',
        });
      }
    });
    
    // ✅ ANINDA App.tsx'teki hook state'ini güncelle - bu filtre barını da anında güncelleyecek
    // Eğer App.tsx'ten gelen fonksiyon varsa onu kullan (aynı state), yoksa local hook'u kullan
    const saveFunc = setAllFavoriteTeamsFromApp || setAllFavoriteTeams;
    const success = await saveFunc(allTeams);
    console.log('✅ Favorite teams saved via App hook:', success, allTeams.map(t => ({ name: t.name, type: t.type })));
    
    // Profil servisine de kaydet (arka planda)
    try {
      if (type === 'national') {
        await profileService.updateNationalTeam(team.name);
        const clubTeamNames = newClubTeams.filter(Boolean).map(t => t!.name);
        await profileService.updateFavoriteTeams([team.name, ...clubTeamNames]);
      } else if (type === 'club' && index !== undefined) {
        const nationalTeamName = newNationalTeam?.name || '';
        const clubTeamNames = newClubTeams.filter(Boolean).map(t => t!.name);
        await profileService.updateFavoriteTeams([nationalTeamName, ...clubTeamNames].filter(Boolean));
        await profileService.updateClubTeams(clubTeamNames);
      }
      console.log('✅ Team saved to profile service:', team.name);
    } catch (error) {
      console.warn('⚠️ Error saving to profile service:', error);
    }
    
    // ✅ App.tsx'e bildir ki maç verileri de güncellensin
    onTeamsChange?.();
    
    // ✅ Kaydedildi mesajı göster
    setAutoSaveMessage('✓ Takım kaydedildi');
    setTimeout(() => setAutoSaveMessage(null), 2000);
  }, [selectedClubTeams, selectedNationalTeam, setAllFavoriteTeams, setAllFavoriteTeamsFromApp, onTeamsChange]);

  // ✅ TAKIM SİLME FONKSİYONU
  const handleRemoveClubTeam = useCallback(async (indexToRemove: number) => {
    console.log('🗑️ Removing club team at index:', indexToRemove);
    
    // State'i güncelle
    const newClubTeams = [...selectedClubTeams];
    const removedTeam = newClubTeams[indexToRemove];
    newClubTeams[indexToRemove] = null;
    setSelectedClubTeams(newClubTeams);
    
    // ✅ Tüm takımları birleştir
    const allTeams: Array<{ id: number; name: string; logo: string; colors?: string[]; type?: 'club' | 'national' }> = [];
    
    // Milli takım ekle
    if (selectedNationalTeam) {
      allTeams.push({
        id: selectedNationalTeam.id,
        name: selectedNationalTeam.name,
        logo: `https://media.api-sports.io/football/teams/${selectedNationalTeam.id}.png`,
        colors: selectedNationalTeam.colors,
        type: 'national',
      });
    }
    
    // Kalan kulüp takımlarını ekle (silinen hariç)
    newClubTeams.filter(Boolean).forEach(clubTeam => {
      if (clubTeam) {
        allTeams.push({
          id: clubTeam.id,
          name: clubTeam.name,
          logo: `https://media.api-sports.io/football/teams/${clubTeam.id}.png`,
          colors: clubTeam.colors,
          type: 'club',
        });
      }
    });
    
    // ✅ ANINDA App.tsx'teki hook state'ini güncelle
    const saveFunc = setAllFavoriteTeamsFromApp || setAllFavoriteTeams;
    await saveFunc(allTeams);
    console.log('✅ Team removed:', removedTeam?.name);
    
    // ProfileService'e de kaydet (arka planda)
    try {
      await profileService.updateProfile({
        nationalTeam: selectedNationalTeam?.name || '',
        clubTeams: newClubTeams.filter(Boolean).map(t => t!.name),
      });
    } catch (error) {
      console.warn('⚠️ Error updating profile service:', error);
    }
    
    // ✅ App.tsx'e bildir ki maç verileri de güncellensin
    onTeamsChange?.();
    
    // ✅ Silindi mesajı göster
    setAutoSaveMessage('✓ Takım silindi');
    setTimeout(() => setAutoSaveMessage(null), 2000);
  }, [selectedClubTeams, selectedNationalTeam, setAllFavoriteTeams, setAllFavoriteTeamsFromApp, onTeamsChange]);

  // ✅ OTOMATİK KAYDETME FONKSİYONU
  const autoSaveProfile = useCallback(async (fieldsToSave: { nickname?: string; firstName?: string; lastName?: string }) => {
    if (saving) return;
    
    setSaving(true);
    try {
      const fullName = [fieldsToSave.firstName || firstName, fieldsToSave.lastName || lastName].filter(Boolean).join(' ').trim();
      const nicknameToSave = fieldsToSave.nickname || nickname;
      
      if (nicknameToSave.trim().length < 3) {
        setSaving(false);
        return;
      }
      
      await profileService.updateProfile({
        name: fullName || nicknameToSave,
        nickname: nicknameToSave,
      });
      
      // Başarılı mesajı göster
      setAutoSaveMessage('✓ Kaydedildi');
      setTimeout(() => setAutoSaveMessage(null), 2000);
      
      setIsEditing(false);
      console.log('✅ Profile auto-saved:', { fullName, nickname: nicknameToSave });
    } catch (error) {
      console.error('❌ Auto-save error:', error);
      setAutoSaveMessage('✗ Kaydetme hatası');
      setTimeout(() => setAutoSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, nickname, saving]);

  // ✅ NICKNAME DEĞİŞİKLİĞİ: uygunluk kontrolü (yeşil tik) + debounce ile otomatik kaydet
  const handleNicknameChange = useCallback((text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
    setNickname(sanitized);
    setIsEditing(true);
    setNicknameError(null);
    setNicknameStatus('idle');

    if (sanitized.length > 0 && sanitized.length < 3) {
      setNicknameError('En az 3 karakter gerekli');
      return;
    }
    if (sanitized.length > 20) {
      setNicknameError('En fazla 20 karakter olabilir');
      return;
    }

    if (nicknameCheckTimeoutRef.current) clearTimeout(nicknameCheckTimeoutRef.current);
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    if (sanitized.length < 3) return;

    // Anlık uygunluk kontrolü (debounce 500ms)
    nicknameCheckTimeoutRef.current = setTimeout(async () => {
      setNicknameChecking(true);
      setNicknameStatus('checking');
      const { available, error: checkError } = await profileService.checkNicknameAvailability(
        sanitized,
        profileIdRef.current || undefined
      );
      setNicknameChecking(false);
      setNicknameStatus(available ? 'available' : 'taken');
      if (!available && checkError) setNicknameError(checkError);
      if (available) setNicknameError(null);
    }, 500);

    // Otomatik kaydet (1.5s debounce) – sadece müsaitse kaydet
    autoSaveTimeoutRef.current = setTimeout(async () => {
      const { available } = await profileService.checkNicknameAvailability(
        sanitized,
        profileIdRef.current || undefined
      );
      if (available) {
        autoSaveProfile({ nickname: sanitized });
      }
    }, 1500);
  }, [autoSaveProfile]);

  // ✅ İSİM DEĞİŞİKLİĞİNDE OTOMATİK KAYDET
  const handleFirstNameChange = useCallback((text: string) => {
    setFirstName(text);
    setIsEditing(true);
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveProfile({ firstName: text });
    }, 1500);
  }, [autoSaveProfile]);

  const handleLastNameChange = useCallback((text: string) => {
    setLastName(text);
    setIsEditing(true);
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveProfile({ lastName: text });
    }, 1500);
  }, [autoSaveProfile]);

  // ✅ OTOMATİK NICKNAME OLUŞTUR (TacticIQxxx)
  const generateAutoNickname = useCallback(() => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `TacticIQ${randomNum}`;
  }, []);

  // ✅ Nickname sadece İLK KEZ (boşken) otomatik set edilir
  // Sonraki değişikliklere karışılmaz - kullanıcı istediği gibi değiştirebilir
  const nicknameSetOnceRef = useRef(false);
  
  useEffect(() => {
    const checkAndSetNickname = async () => {
      // Zaten bir kez set edildiyse veya loading'deyse çık
      if (nicknameSetOnceRef.current || loading) return;
      
      // Nickname zaten varsa hiçbir şey yapma
      if (nickname && nickname.trim().length > 0) {
        nicknameSetOnceRef.current = true;
        return;
      }
      
      // Provider bilgisini kontrol et
      const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const provider = userData?.provider || 'email';
      
      // Sadece bir kez çalış
      nicknameSetOnceRef.current = true;
      
      // OAuth kullanıcıları: önce email prefix dene; alınmışsa (örn. user1@gmail vs user1@hotmail) alternatif ver
      if (provider !== 'email' && provider !== 'unknown') {
        if (userData?.email) {
          const emailPrefix = (userData.email.split('@')[0] || '').replace(/[^a-zA-Z0-9_]/g, '');
          const prefixOk = emailPrefix.length >= 3;
          if (prefixOk) {
            const { available } = await profileService.checkNicknameAvailability(
              emailPrefix,
              profileIdRef.current || undefined
            );
            if (available) {
              setNickname(emailPrefix);
              console.log('👤 [Profile] OAuth nickname set from email (once):', emailPrefix);
            } else {
              const fallback = generateAutoNickname();
              setNickname(fallback);
              autoSaveProfile({ nickname: fallback });
              console.log('👤 [Profile] OAuth prefix taken, fallback:', fallback);
            }
          } else {
            const fallback = generateAutoNickname();
            setNickname(fallback);
            autoSaveProfile({ nickname: fallback });
          }
        }
        return;
      }
      
      // Email kullanıcıları için TacticIQxxxx oluştur
      const autoNickname = generateAutoNickname();
      setNickname(autoNickname);
      autoSaveProfile({ nickname: autoNickname });
      console.log('👤 [Profile] Auto nickname generated for email user:', autoNickname);
    };
    
    checkAndSetNickname();
  }, [loading, nickname, generateAutoNickname, autoSaveProfile]);

  /** Son kazanılan 3 rozet (en yeni önce - earnedAt'e göre) */
  const last3EarnedBadges = useMemo(() => {
    const earned = allBadges.filter((b) => b.earned && b.earnedAt);
    return earned
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, 3);
  }, [allBadges]);

  const rankPercentage = ((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100;
  const topPercentage = ((user.countryRank / user.totalPlayers) * 100).toFixed(1);

  // Cihaz ülkesi - sıralama etiketi dinamik (TR→Türkiye, FR→Fransa, BR→Brezilya, GH→Gana vs.)
  const deviceCountryCode = getDeviceCountryCode();
  const countryRankingLabel = getCountryRankingLabel(deviceCountryCode);
  const countryDisplayName = getCountryFromCode(deviceCountryCode) || deviceCountryCode;
  const countryFlagUrl = getCountryFlagUrl(countryDisplayName);

  // Show loading state
  if (loading) {
    return (
      <ScreenLayout safeArea={true} scrollable={false}>
          <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Profil yükleniyor...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout safeArea={true} scrollable={false}>
      {/* Header kaldırıldı - footer navigation kullanılacak */}
      
      <View style={styles.container}>
        {/* Grid Pattern artık ScreenLayout'tan geliyor - tekrar ekleme */}
        
        {/* Profile Content - Tab bar kaldırıldı */}
          <ScrollView
          key={`profile-lang-${languageKey}`}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!showLanguageDropdown && !showTimezoneDropdown}
        >
          <View style={styles.scrollContentInner}>
          {/* Profile Header Card - Web ile uyumlu profesyonel tasarım */}
          <Animated.View
            entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(0)}
            style={styles.profileHeaderCard}
          >
            {/* Gradient Background Banner - Web ile aynı */}
            <LinearGradient
              colors={[
                theme.secondary + '33',  // secondary/20 opacity (20%)
                theme.accent + '1A',      // accent/10 opacity (10%)
                theme.secondary + '33',  // secondary/20 opacity (20%)
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.profileHeaderBanner}
            />
            
            <View style={styles.profileHeaderContent}>
              {/* Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={() => setShowAvatarPicker(true)}
                  style={styles.avatarContainer}
                >
                  <View style={[styles.avatar, { borderColor: theme.card, borderWidth: 4 }, SHADOWS.lg]}>
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                      <LinearGradient
                        colors={[theme.secondary, theme.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradient}
                      >
                        <Text style={styles.avatarText}>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                  <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={16} color={theme.primaryForeground} />
                  </View>
                </TouchableOpacity>

                {/* Name & Plan Badge - Web ile aynı */}
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.name}>{user.name || user.email}</Text>
                  {isPro ? (
                    <LinearGradient
                      colors={['#F59E0B', '#FCD34D']} // amber-500 to yellow-400
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.proBadge}
                    >
                      <Ionicons name="star" size={12} color="#000" />
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Free</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.emailText}>{user.email}</Text>

                {/* Ranking Table - Web ile aynı tablo formatı */}
                <View style={styles.rankingTableContainer}>
                  {/* Table Header */}
                  <View style={styles.rankingTableHeader}>
                    <View style={styles.rankingTableHeaderCell}>
                      <Ionicons name="flag" size={16} color={theme.mutedForeground} />
                      <Text style={styles.rankingTableHeaderText}>Ülke</Text>
                    </View>
                    <View style={styles.rankingTableHeaderCell}>
                      <Ionicons name="trophy" size={16} color={theme.secondary} />
                      <Text style={styles.rankingTableHeaderText}>{countryRankingLabel}</Text>
                    </View>
                    <View style={styles.rankingTableHeaderCell}>
                      <Ionicons name="globe" size={16} color={theme.primary} />
                      <Text style={styles.rankingTableHeaderText}>Dünya Sırası</Text>
                    </View>
                  </View>
                  
                  {/* Table Row */}
                  <View style={styles.rankingTableRow}>
                    {/* Ülke Cell - bayrak + ülke adı */}
                    <View style={styles.rankingTableCell}>
                      {countryFlagUrl ? (
                        <Image source={{ uri: countryFlagUrl }} style={{ width: 24, height: 18, marginRight: 6, borderRadius: 2 }} resizeMode="cover" />
                      ) : (
                        <Text style={styles.flagEmoji}>{getCountryFlag(countryDisplayName) || '🏳️'}</Text>
                      )}
                      <Text style={styles.rankingTableCountryText}>{deviceCountryCode} {translateCountry(countryDisplayName)}</Text>
                    </View>
                    
                    {/* Ülke Sırası Cell */}
                    <View style={styles.rankingTableCell}>
                      {user.countryRank > 0 ? (
                        <View style={styles.rankingTableCellContent}>
                          <View style={[styles.rankingBadge, { backgroundColor: theme.secondary + '33', borderColor: theme.secondary + '4D' }]}>
                            <Text style={[styles.rankingBadgeText, { color: theme.secondary }]}>
                              {calculateTopPercent(user.countryRank, user.totalPlayers || 5000)}
                            </Text>
                          </View>
                          <Text style={styles.rankingTableValue}>
                            {user.countryRank.toLocaleString()} / {(user.totalPlayers || 5000).toLocaleString()}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.rankingTableEmptyText}>Tahmin yapınca sıralamanız burada görünecek</Text>
                      )}
                    </View>
                    
                    {/* Dünya Sırası Cell - İlk 100 sıra, diğerleri yüzdelik */}
                    <View style={styles.rankingTableCell}>
                      {user.globalRank > 0 ? (
                        <View style={styles.rankingTableCellContent}>
                          <View style={[styles.rankingBadge, { backgroundColor: theme.primary + '33', borderColor: theme.primary + '4D' }]}>
                            <Text style={[styles.rankingBadgeText, { color: theme.primary }]}>
                              {formatWorldRankingDisplay(user.globalRank, 50000)}
                            </Text>
                          </View>
                          <Text style={styles.rankingTableValue}>
                            {user.globalRank.toLocaleString()} / 50,000
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.rankingTableEmptyText}>Tahmin yapınca sıralamanız burada görünecek</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Son Başarımlar - Son 3 rozet, konteynere sığar */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(100)} style={[styles.card, styles.cardContentCentered, { overflow: 'hidden' }]}>
            <View style={[styles.cardHeader, styles.cardHeaderCentered]}>
              <Ionicons name="star" size={20} color={theme.accent} />
              <Text style={styles.cardTitle}>Son Başarımlar</Text>
            </View>
            <View style={styles.latestBadgesRow}>
              {last3EarnedBadges.length > 0 ? (
                last3EarnedBadges.map((badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    style={[styles.latestBadgeCard, { borderColor: (badge.color || theme.accent) + '44' }]}
                    onPress={() => setSelectedBadge(badge)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.latestBadgeIcon}>{badge.icon}</Text>
                    <Text style={styles.latestBadgeName} numberOfLines={1}>
                      {t(`badges.names.${badge.id}`, { defaultValue: badge.name })}
                    </Text>
                    <Text style={styles.latestBadgeDescription} numberOfLines={1}>
                      {t(`badges.descriptions.${badge.id}`, { defaultValue: badge.description })}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.latestBadgesEmpty}>
                  <Ionicons name="trophy-outline" size={32} color={theme.mutedForeground} />
                  <Text style={styles.latestBadgesEmptyText}>{t('badges.notEarnedYet')}</Text>
                  <Text style={styles.latestBadgesEmptyHint}>{t('badges.earnByPredicting')}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Performance Card - Web ile aynı */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(150)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color={theme.secondary} />
              <Text style={styles.cardTitle}>Performans</Text>
            </View>

            <View style={styles.performanceGrid}>
              <View style={[styles.performanceItem, { backgroundColor: theme.secondary + '1A', borderColor: theme.secondary + '33' }]}>
                <Text style={[styles.performanceValue, { color: theme.secondary }]}>
                  {user.stats.success}%
                </Text>
                <Text style={styles.performanceLabel}>Başarı Oranı</Text>
              </View>
              <View style={[styles.performanceItem, { backgroundColor: theme.muted + '80', borderColor: theme.border }]}>
                <Text style={[styles.performanceValue, { color: theme.foreground }]}>
                  {user.stats.total}
                </Text>
                <Text style={styles.performanceLabel}>Toplam Tahmin</Text>
              </View>
              <View style={[styles.performanceItem, { backgroundColor: theme.accent + '1A', borderColor: theme.accent + '33' }]}>
                <Text style={[styles.performanceValue, { color: theme.accent }]}>
                  {user.stats.streak}
                </Text>
                <Text style={styles.performanceLabel}>Günlük Seri</Text>
              </View>
            </View>

            {/* Puan Gelişimi - Web ile aynı */}
            <View style={[styles.xpGainCard, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '1A' }]}>
              <View style={styles.xpGainHeader}>
                <Text style={[styles.xpGainLabel, { color: theme.mutedForeground }]}>Bu Hafta Kazanılan XP</Text>
                <Ionicons name="flash" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.xpGainValue, { color: theme.primary }]}>
                +{user.xpGainThisWeek}
              </Text>
              <Text style={[styles.xpGainTotal, { color: theme.mutedForeground }]}>
                {t('profile.totalPoints')}: {user.points.toLocaleString()}
              </Text>
            </View>
          </Animated.View>

          {/* Favori Takımlar Card - Web ile uyumlu */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(200)} style={[styles.card, styles.cardFavoriteTeams]}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={20} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Favori Takımlar</Text>
                <Text style={[styles.cardSubtitle, { color: theme.mutedForeground }]}>Milli takım ve en fazla 5 kulüp takımı seçin</Text>
              </View>
            </View>

            {/* Milli Takım Seçimi */}
            <View style={[styles.formField, { marginTop: 4 }]}>
              <Text style={styles.formLabel}>Milli Takım <Text style={styles.requiredStar}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  selectedNationalTeam && styles.dropdownButtonSelected
                ]}
                onPress={() => setOpenDropdown(openDropdown === 'national' ? null : 'national')}
              >
                {selectedNationalTeam ? (
                  <View style={styles.dropdownSelectedContent}>
                    {(selectedNationalTeam.flag || getCountryFlagUrl(selectedNationalTeam.country)) ? (
                      <Image source={{ uri: selectedNationalTeam.flag || getCountryFlagUrl(selectedNationalTeam.country)! }} style={{ width: 24, height: 18, borderRadius: 2 }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="flag" size={18} color={theme.secondary} />
                    )}
                    <Text style={styles.dropdownButtonTextSelected}>{selectedNationalTeam.name}</Text>
                    <View style={styles.searchHintInline}>
                      <Ionicons name="search" size={12} color={theme.mutedForeground} />
                      <Text style={styles.searchHintText}>Değiştir...</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.dropdownSelectedContent}>
                    <Ionicons name="search" size={16} color={theme.mutedForeground} />
                    <Text style={styles.dropdownButtonTextPlaceholder}>Milli takım adı yazarak ara...</Text>
                  </View>
                )}
                <Ionicons 
                  name={openDropdown === 'national' ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={selectedNationalTeam ? theme.secondary : theme.mutedForeground} 
                />
              </TouchableOpacity>
              <Text style={styles.formHint}>Bir milli takım seçmeniz zorunludur</Text>

              {/* Dropdown Modal */}
              {openDropdown === 'national' && (
                <Modal
                  visible={true}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setOpenDropdown(null)}
                >
                  <View style={styles.dropdownModalOverlay}>
                    <View style={styles.dropdownModalContent}>
                      <View style={styles.dropdownModalHeader}>
                        <Text style={styles.dropdownModalTitle}>Milli Takım Seç</Text>
                        <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                          <Ionicons name="close" size={24} color={theme.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                      
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder={t('teamSelection.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          handleTeamSearch(text, 'national');
                          nationalDropdownScrollRef.current?.scrollTo?.({ y: 0, animated: true });
                        }}
                        placeholderTextColor={theme.mutedForeground}
                        autoFocus={true}
                      />
                      
                      {isSearching && (
                        <ActivityIndicator size="small" color={theme.primary} style={styles.dropdownLoading} />
                      )}
                      
                      <ScrollView 
                        ref={nationalDropdownScrollRef}
                        style={styles.dropdownList}
                        keyboardShouldPersistTaps="always"
                        nestedScrollEnabled={true}
                      >
                        {apiTeams.map((team, idx) => {
                          const teamColor = (team as any).colors?.[0] || getTeamById(team.id)?.colors?.[0] || theme.primary;
                          return (
                            <TouchableOpacity
                              key={`${team.id}-${team.name}-${idx}`}
                              style={styles.dropdownItem}
                              activeOpacity={0.7}
                              onPress={() => {
                                const teamToAdd = {
                                  id: team.id,
                                  name: team.name,
                                  colors: (team as any).colors || ['#1E40AF', '#FFFFFF'],
                                  country: team.country || 'Unknown',
                                  league: team.league || '',
                                  flag: (team as any).flag || getCountryFlagUrl(team.country),
                                };
                                handleTeamSelect(teamToAdd, 'national');
                              }}
                            >
                              <View style={[styles.dropdownItemColorStrip, { backgroundColor: teamColor }]} />
                              <View style={styles.dropdownItemContent}>
                                {(team as any).flag || getCountryFlagUrl(team.country) ? (
                                  <Image source={{ uri: (team as any).flag || getCountryFlagUrl(team.country)! }} style={styles.teamFlagImage} resizeMode="cover" />
                                ) : (
                                  <Ionicons name="flag" size={20} color={theme.mutedForeground} />
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.dropdownItemName}>{team.name}</Text>
                                  <Text style={styles.dropdownItemMeta}>{translateCountry(team.country)}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              )}
            </View>

            {/* Kulüp Takımları Seçimi */}
            {isPro && (
              <View style={[styles.formField, { marginTop: SPACING.md }]}>
                <Text style={styles.formLabel}>
                  {t('teamSelection.clubTeamsLabel')} <Text style={styles.formHint}>{t('teamSelection.maxFiveHint')}</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    selectedClubTeams.filter(Boolean).length > 0 && styles.dropdownButtonSelected
                  ]}
                  onPress={() => setOpenDropdown(openDropdown === 'club' ? null : 'club')}
                  disabled={selectedClubTeams.filter(Boolean).length >= 5}
                >
                  {selectedClubTeams.filter(Boolean).length > 0 ? (
                    <View style={styles.dropdownSelectedContent}>
                      <Ionicons name="football" size={18} color={theme.accent} />
                      <Text style={styles.dropdownButtonTextSelected}>
                        {selectedClubTeams.filter(Boolean).length}/5 seçildi
                      </Text>
                      {selectedClubTeams.filter(Boolean).length < 5 && (
                        <View style={styles.searchHintInline}>
                          <Ionicons name="search" size={12} color={theme.mutedForeground} />
                          <Text style={styles.searchHintText}>Takım ara...</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.dropdownSelectedContent}>
                      <Ionicons name="search" size={16} color={theme.mutedForeground} />
                      <Text style={styles.dropdownButtonTextPlaceholder}>Takım adı yazarak ara...</Text>
                    </View>
                  )}
                  <Ionicons 
                    name={openDropdown === 'club' ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={selectedClubTeams.filter(Boolean).length > 0 ? theme.accent : theme.mutedForeground} 
                  />
                </TouchableOpacity>
                
                {/* Seçilen Takımlar - Badge olarak (tıklanabilir silme) */}
                {selectedClubTeams.filter(Boolean).length > 0 && (
                  <View style={styles.selectedTeamsBadges}>
                    {selectedClubTeams.map((team, idx) => {
                      if (!team) return null;
                      const teamColor = (team as any).colors?.[0] || getTeamById(team.id)?.colors?.[0] || theme.primary;
                      return (
                        <TouchableOpacity
                          key={team.id || idx}
                          style={[
                            styles.teamBadge,
                            {
                              backgroundColor: teamColor + '22',
                              borderColor: teamColor + '66',
                            },
                          ]}
                          onPress={() => handleRemoveClubTeam(idx)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="football" size={14} color={teamColor} />
                          <Text style={styles.teamBadgeText}>{team.name}</Text>
                          <View style={[styles.teamBadgeRemove, { backgroundColor: teamColor }]}>
                            <Ionicons name="close" size={12} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.formHint}>
                  {selectedClubTeams.filter(Boolean).length} / 5 kulüp takımı seçildi
                </Text>

                {/* Dropdown Modal */}
                {openDropdown === 'club' && (
                  <Modal
                    visible={true}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setOpenDropdown(null)}
                  >
                    <View style={styles.dropdownModalOverlay}>
                      <View style={styles.dropdownModalContent}>
                        <View style={styles.dropdownModalHeader}>
                          <Text style={styles.dropdownModalTitle}>
                            {selectedClubTeams.filter(Boolean).length === 0 
                              ? t('teamSelection.selectClubTeam')
                              : selectedClubTeams.filter(Boolean).length === 1
                                ? t('teamSelection.selectClubTeam2')
                                : selectedClubTeams.filter(Boolean).length === 2
                                  ? t('teamSelection.selectClubTeam3')
                                  : selectedClubTeams.filter(Boolean).length === 3
                                    ? t('teamSelection.selectClubTeam4')
                                    : t('teamSelection.selectClubTeam5')
                            }
                          </Text>
                          <TouchableOpacity onPress={() => setOpenDropdown(null)}>
                            <Ionicons name="close" size={24} color={theme.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                        
                        <TextInput
                          style={styles.dropdownSearchInput}
                          placeholder={t('teamSelection.searchPlaceholder')}
                          value={searchQuery}
                          onChangeText={(text) => {
                            setSearchQuery(text);
                            handleTeamSearch(text, 'club');
                            clubDropdownScrollRef.current?.scrollTo?.({ y: 0, animated: true });
                          }}
                          placeholderTextColor={theme.mutedForeground}
                          autoFocus={true}
                        />
                        
                        {isSearching && (
                          <ActivityIndicator size="small" color={theme.primary} style={styles.dropdownLoading} />
                        )}
                        
                        <ScrollView 
                          ref={clubDropdownScrollRef}
                          style={styles.dropdownList}
                          keyboardShouldPersistTaps="always"
                          nestedScrollEnabled={true}
                        >
                          {apiTeams.filter(t => !selectedClubTeams.some(ct => ct && ct.id === t.id)).map((team, idx) => {
                            const teamColor = (team as any).colors?.[0] || getTeamById(team.id)?.colors?.[0] || theme.primary;
                            return (
                              <TouchableOpacity
                                key={`${team.id}-${team.name}-${idx}`}
                                style={styles.dropdownItem}
                                activeOpacity={0.7}
                                onPress={() => {
                                  const emptyIndex = selectedClubTeams.findIndex(t => t === null);
                                  if (emptyIndex === -1) {
                                    Alert.alert(t('profile.warning'), t('profile.maxFiveClubs'));
                                    return;
                                  }
                                  const teamToAdd = {
                                    id: team.id,
                                    name: team.name,
                                    colors: (team as any).colors || ['#1E40AF', '#FFFFFF'],
                                    country: team.country || 'Unknown',
                                    league: team.league || '',
                                  };
                                  handleTeamSelect(teamToAdd, 'club', emptyIndex);
                                }}
                                disabled={selectedClubTeams.filter(Boolean).length >= 5}
                              >
                                <View style={[styles.dropdownItemColorStrip, { backgroundColor: teamColor }]} />
                                <View style={styles.dropdownItemContent}>
                                  <Ionicons name="football" size={20} color={teamColor} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.dropdownItemName}>{team.name}</Text>
                                    <Text style={styles.dropdownItemMeta}>{team.league ? `${team.league} • ${translateCountry(team.country)}` : translateCountry(team.country)}</Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                )}
              </View>
            )}

            {/* Pro değilse kulüp takımları kilitli */}
            {!isPro && (
              <View style={styles.lockedSection}>
                <Ionicons name="lock-closed" size={32} color={theme.accent} />
                <Text style={styles.lockedTitle}>Pro Üye Gerekli</Text>
                <Text style={styles.lockedText}>5 kulüp takımı seçmek için Pro üye olun</Text>
                <TouchableOpacity style={styles.proButton} onPress={onProUpgrade}>
                  <LinearGradient
                    colors={['#F59E0B', '#FCD34D']}
                    style={styles.proButtonGradient}
                  >
                    <Ionicons name="star" size={18} color="#000" />
                    <Text style={styles.proButtonText}>Pro Üye Ol</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Kişisel Bilgiler Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(250)} style={[styles.card, styles.cardPersonalInfo]}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
              {saving && (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t('profileEdit.firstName')}</Text>
              <TextInput
                style={[styles.formInput, styles.formInputEditable]}
                value={firstName}
                onChangeText={handleFirstNameChange}
                placeholder={t('profileEdit.firstName')}
                placeholderTextColor={theme.mutedForeground}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t('profileEdit.lastName')}</Text>
              <TextInput
                style={[styles.formInput, styles.formInputEditable]}
                value={lastName}
                onChangeText={handleLastNameChange}
                placeholder={t('profileEdit.lastName')}
                placeholderTextColor={theme.mutedForeground}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t('profileEdit.nickname')} <Text style={styles.requiredStar}>*</Text></Text>
              <View style={{ position: 'relative' }}>
<TextInput
                  style={[
                    styles.formInput,
                    styles.formInputEditable,
                    nicknameError && { borderColor: '#EF4444', borderWidth: 1 },
                    nicknameStatus === 'available' && { borderColor: '#22C55E', borderWidth: 1 }
                  ]}
                value={nickname}
                  onChangeText={handleNicknameChange}
                  placeholder="TacticIQ1234"
                placeholderTextColor={theme.mutedForeground}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {nicknameChecking && (
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  />
                )}
                {!nicknameChecking && nicknameStatus === 'available' && (
                  <Text style={{ position: 'absolute', right: 12, top: 12, fontSize: 18 }}>✅</Text>
                )}
                {!nicknameChecking && nicknameStatus === 'taken' && (
                  <Text style={{ position: 'absolute', right: 12, top: 12, fontSize: 18 }}>❌</Text>
                )}
            </View>
              {nicknameError ? (
                <Text style={[styles.formHint, { color: '#EF4444' }]}>{nicknameError}</Text>
              ) : nicknameStatus === 'available' ? (
                <Text style={[styles.formHint, { color: '#22C55E' }]>Kullanıcı adı uygun. Otomatik kaydedilir.</Text>
              ) : (
                <Text style={styles.formHint}>Sadece harf, rakam ve alt çizgi. Otomatik kaydedilir.</Text>
              )}
              {!nickname && (
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: 'rgba(31, 162, 166, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => {
                    const autoNick = generateAutoNickname();
                    handleNicknameChange(autoNick);
                  }}
                >
                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>
                    Otomatik Kullanıcı Adı Oluştur
                  </Text>
                </TouchableOpacity>
              )}
            </View>

          </Animated.View>

          {/* ✅ ROZETLERİM BÖLÜMÜ - Kişisel Bilgilerin altında, Ayarların üstünde (5 sütun) */}
          <Animated.View
            entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(275)}
            style={styles.badgesSectionCard}
          >
            {/* Header */}
            <View style={styles.badgesSectionHeader}>
              <View style={styles.badgesSectionTitleRow}>
                <Ionicons name="trophy" size={22} color="#F59E0B" />
                <Text style={styles.badgesSectionTitle}>{t('badges.myBadges')}</Text>
              </View>
              <View style={styles.badgesSectionProgress}>
                <Text style={styles.badgesSectionCount}>
                  {allBadges.filter(b => b.earned).length} / {allBadges.length}
                </Text>
                <View style={styles.badgesSectionProgressBar}>
                  <LinearGradient
                    colors={['#F59E0B', '#FCD34D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.badgesSectionProgressFill,
                      { width: `${(allBadges.filter(b => b.earned).length / Math.max(allBadges.length, 1)) * 100}%` }
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Badges Grid - 4 sütun x 10 satır mobilde */}
            <View style={styles.badgesGridInline}>
              {allBadges.map((badge, index) => (
                <TouchableOpacity
                  key={badge.id}
                  style={[
                    styles.badgeItemInline,
                    badge.earned 
                      ? styles.badgeItemEarned 
                      : styles.badgeItemLocked,
                    badgeColumnCount === 4 
                      ? styles.badgeItem4Col 
                      : styles.badgeItem8Col,
                  ]}
                  onPress={() => setSelectedBadge(badge)}
                  activeOpacity={0.7}
                >
                  {/* Lock Icon (kilitli rozetler için) - daha belirgin */}
                  {!badge.earned && (
                    <View style={styles.badgeLockOverlay}>
                      <Ionicons name="lock-closed" size={10} color="#E2E8F0" />
                    </View>
                  )}

                  {/* Checkmark (kazanılmış rozetler için) */}
                  {badge.earned && (
                    <View style={styles.badgeEarnedCheck}>
                      <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                    </View>
                  )}

                  {/* Badge Icon */}
                  <Text style={[
                    styles.badgeEmojiInline,
                    !badge.earned && styles.badgeEmojiLocked
                  ]}>
                    {badge.icon}
                  </Text>

                  {/* Badge Name */}
                  <Text
                    style={[
                      styles.badgeNameInline,
                      !badge.earned && styles.badgeNameLocked
                    ]}
                    numberOfLines={2}
                  >
                    {t(`badges.names.${badge.id}`, { defaultValue: badge.name })}
                  </Text>
              </TouchableOpacity>
              ))}
            </View>

            {/* Rozet yoksa */}
            {allBadges.length === 0 && (
              <View style={styles.noBadgesInline}>
                <Ionicons name="trophy-outline" size={48} color="#64748B" />
                <Text style={styles.noBadgesText}>{t('common.loading')}</Text>
              </View>
            )}
          </Animated.View>

          {/* Ayarlar Card - Web ile aynı */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>{t('profile.settings')}</Text>
            </View>

            {/* Dil ve Saat Dilimi - Web uyumlu */}
            <View style={styles.settingsGrid}>
              <TouchableOpacity 
                style={styles.settingsField}
                onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <Text style={styles.formLabel}>{t('settings.language')}</Text>
                <View style={styles.settingsValue}>
                  <Image
                    source={{ uri: (() => {
                      const lng = i18nInstance.language?.split('-')[0] || selectedLanguage;
                      const map: Record<string, string> = { tr: 'tr', en: 'gb', de: 'de', es: 'es', fr: 'fr', it: 'it', ar: 'sa', zh: 'cn', ru: 'ru', hi: 'in' };
                      return `https://flagcdn.com/w40/${map[lng] || 'tr'}.png`;
                    })()}}
                    style={{ width: 24, height: 18, borderRadius: 2, marginRight: 8 }}
                    resizeMode="cover"
                  />
                  <Text style={styles.settingsValueText}>
                    {(() => {
                      const lng = i18nInstance.language?.split('-')[0] || selectedLanguage;
                      const names: Record<string, string> = { tr: 'Türkçe', en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano', ar: 'العربية', zh: '中文', ru: 'Русский', hi: 'हिन्दी' };
                      return names[lng] || 'Türkçe';
                    })()}
                  </Text>
                  <Ionicons name={showLanguageDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.mutedForeground} />
                </View>
              </TouchableOpacity>
              
              {/* Dil Dropdown - Modal içinde (overlay tıklamayı engelleme) */}
              <Modal
                visible={showLanguageDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguageDropdown(false)}
              >
                <View style={styles.modalOverlay}>
                  <Pressable 
                    style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                    onPress={() => setShowLanguageDropdown(false)}
                  />
                  <ScrollView 
                    style={[styles.languageDropdownModal, { zIndex: 1 }]}
                    contentContainerStyle={styles.languageDropdownContent}
                    onStartShouldSetResponder={() => true}
                    showsVerticalScrollIndicator={true}
                  >
                    {[
                      { code: 'tr', name: 'Türkçe', flagUrl: 'https://flagcdn.com/w40/tr.png' },
                      { code: 'en', name: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
                      { code: 'de', name: 'Deutsch', flagUrl: 'https://flagcdn.com/w40/de.png' },
                      { code: 'es', name: 'Español', flagUrl: 'https://flagcdn.com/w40/es.png' },
                      { code: 'fr', name: 'Français', flagUrl: 'https://flagcdn.com/w40/fr.png' },
                      { code: 'it', name: 'Italiano', flagUrl: 'https://flagcdn.com/w40/it.png' },
                      { code: 'ar', name: 'العربية', flagUrl: 'https://flagcdn.com/w40/sa.png' },
                      { code: 'zh', name: '中文', flagUrl: 'https://flagcdn.com/w40/cn.png' },
                      { code: 'ru', name: 'Русский', flagUrl: 'https://flagcdn.com/w40/ru.png' },
                      { code: 'hi', name: 'हिन्दी', flagUrl: 'https://flagcdn.com/w40/in.png' },
                    ].map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.languageOption,
                          selectedLanguage === lang.code && styles.languageOptionSelected
                        ]}
                        onPress={async () => {
                          setShowLanguageDropdown(false);
                          if (lang.code === selectedLanguage) return;

                          try {
                            // changeI18nLanguage zaten storage'a kaydediyor ve languageChanged event'i tetikliyor
                            // handleLanguageChange listener (satır 439-451) selectedLanguage'ı otomatik güncelleyecek
                            await changeI18nLanguage(lang.code);
                            
                            // Profile'ı güncelle (async, hata olursa devam et)
                            profileService.updateProfile({ preferredLanguage: lang.code }).catch(() => {});
                          } catch (error) {
                            console.error('Error changing language:', error);
                          }
                        }}
                      >
                        <Image source={{ uri: lang.flagUrl }} style={{ width: 28, height: 20, borderRadius: 2, marginRight: 10 }} resizeMode="cover" />
                        <Text style={[
                          styles.languageName,
                          selectedLanguage === lang.code && styles.languageNameSelected
                        ]}>{lang.name}</Text>
                        {selectedLanguage === lang.code && (
                          <Ionicons name="checkmark" size={18} color={theme.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Modal>
              <TouchableOpacity
                style={styles.settingsField}
                onPress={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
              >
                <Text style={styles.formLabel}>{t('settings.timezone')}</Text>
                <View style={styles.settingsValue}>
                  <Text style={styles.settingsValueText}>
                    {selectedTimezone === 'Europe/Istanbul' ? 'İstanbul (UTC+3)' :
                     selectedTimezone === 'Europe/London' ? 'Londra (UTC+0)' :
                     selectedTimezone === 'Europe/Berlin' ? 'Berlin (UTC+1)' :
                     selectedTimezone === 'Europe/Paris' ? 'Paris (UTC+1)' :
                     selectedTimezone === 'Europe/Rome' ? 'Roma (UTC+1)' :
                     selectedTimezone === 'Europe/Madrid' ? 'Madrid (UTC+1)' :
                     selectedTimezone === 'Europe/Moscow' ? 'Moskova (UTC+3)' :
                     selectedTimezone === 'Asia/Dubai' ? 'Dubai (UTC+4)' :
                     selectedTimezone === 'Asia/Kolkata' ? 'Mumbai (UTC+5:30)' :
                     selectedTimezone === 'Asia/Shanghai' ? 'Şangay (UTC+8)' :
                     selectedTimezone === 'Asia/Tokyo' ? 'Tokyo (UTC+9)' :
                     selectedTimezone === 'America/New_York' ? 'New York (UTC-5)' :
                     selectedTimezone === 'America/Chicago' ? 'Chicago (UTC-6)' :
                     selectedTimezone === 'America/Denver' ? 'Denver (UTC-7)' :
                     selectedTimezone === 'America/Los_Angeles' ? 'Los Angeles (UTC-8)' :
                     selectedTimezone === 'America/Sao_Paulo' ? 'São Paulo (UTC-3)' :
                     selectedTimezone === 'America/Mexico_City' ? 'Mexico City (UTC-6)' :
                     selectedTimezone === 'Australia/Sydney' ? 'Sydney (UTC+10)' :
                     selectedTimezone === 'Pacific/Auckland' ? 'Auckland (UTC+12)' :
                     selectedTimezone}
                  </Text>
                  <Ionicons name={showTimezoneDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.mutedForeground} />
                </View>
              </TouchableOpacity>
              
              {/* Saat Dilimi Dropdown - Modal içinde (overlay tıklamayı engelleme) */}
              <Modal
                visible={showTimezoneDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTimezoneDropdown(false)}
              >
                <View style={styles.modalOverlay}>
                  <Pressable 
                    style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                    onPress={() => setShowTimezoneDropdown(false)}
                  />
                  <ScrollView 
                    style={[styles.languageDropdownModal, { zIndex: 1 }]}
                    contentContainerStyle={styles.languageDropdownContent}
                    onStartShouldSetResponder={() => true}
                    showsVerticalScrollIndicator={true}
                  >
                    {[
                      { id: 'Europe/Istanbul', name: 'İstanbul (UTC+3)' },
                      { id: 'Europe/London', name: 'Londra (UTC+0)' },
                      { id: 'Europe/Berlin', name: 'Berlin (UTC+1)' },
                      { id: 'Europe/Paris', name: 'Paris (UTC+1)' },
                      { id: 'Europe/Rome', name: 'Roma (UTC+1)' },
                      { id: 'Europe/Madrid', name: 'Madrid (UTC+1)' },
                      { id: 'Europe/Moscow', name: 'Moskova (UTC+3)' },
                      { id: 'Asia/Dubai', name: 'Dubai (UTC+4)' },
                      { id: 'Asia/Kolkata', name: 'Mumbai (UTC+5:30)' },
                      { id: 'Asia/Shanghai', name: 'Şangay (UTC+8)' },
                      { id: 'Asia/Tokyo', name: 'Tokyo (UTC+9)' },
                      { id: 'America/New_York', name: 'New York (UTC-5)' },
                      { id: 'America/Chicago', name: 'Chicago (UTC-6)' },
                      { id: 'America/Denver', name: 'Denver (UTC-7)' },
                      { id: 'America/Los_Angeles', name: 'Los Angeles (UTC-8)' },
                      { id: 'America/Sao_Paulo', name: 'São Paulo (UTC-3)' },
                      { id: 'America/Mexico_City', name: 'Mexico City (UTC-6)' },
                      { id: 'Australia/Sydney', name: 'Sydney (UTC+10)' },
                      { id: 'Pacific/Auckland', name: 'Auckland (UTC+12)' },
                    ].map((tz) => (
                      <TouchableOpacity
                        key={tz.id}
                        style={[
                          styles.languageOption,
                          selectedTimezone === tz.id && styles.languageOptionSelected
                        ]}
                        onPress={async () => {
                          setSelectedTimezone(tz.id);
                          setShowTimezoneDropdown(false);
                          await setUserTimezone(tz.id);
                          await profileService.updateProfile({ timezone: tz.id }).catch(() => {});
                        }}
                      >
                        <Text style={[
                          styles.languageName,
                          selectedTimezone === tz.id && styles.languageNameSelected
                        ]}>{tz.name}</Text>
                        {selectedTimezone === tz.id && (
                          <Ionicons name="checkmark" size={18} color={theme.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Modal>
            </View>

            {/* Tema Seçimi - Açık/Koyu Mod */}
            <View style={styles.themeToggleContainer}>
              <View style={styles.themeToggleLeft}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.primary} />
                <Text style={styles.themeToggleLabel}>{t('settings.theme')}</Text>
              </View>
              <View style={styles.themeToggleButtons}>
                <TouchableOpacity
                  style={[styles.themeButton, !isDarkMode && styles.themeButtonActive]}
                  onPress={() => setAppTheme('light')}
                >
                  <Ionicons name="sunny" size={16} color={!isDarkMode ? '#000' : theme.mutedForeground} />
                  <Text style={[styles.themeButtonText, !isDarkMode && styles.themeButtonTextActive]}>{t('settings.light')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.themeButton, isDarkMode && styles.themeButtonActive]}
                  onPress={() => setAppTheme('dark')}
                >
                  <Ionicons name="moon" size={16} color={isDarkMode ? '#000' : theme.mutedForeground} />
                  <Text style={[styles.themeButtonText, isDarkMode && styles.themeButtonTextActive]}>{t('settings.dark')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingsDivider} />

            {/* Bildirimler - Web ile aynı, çalışır Switch'ler */}
            <View style={styles.notificationsSection}>
              <Text style={styles.sectionTitle}>{t('settings.mobileNotifications')}</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.settingRow_left}>
                  <Text style={styles.settingRow_title}>{t('settings.emailNotifications')}</Text>
                  <Text style={styles.settingRow_desc}>{t('settings.emailNotificationsDesc')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.settingRow_switch,
                    emailNotifications
                      ? { backgroundColor: theme.primary, justifyContent: 'flex-end' }
                      : { backgroundColor: theme.muted, justifyContent: 'flex-start' }
                  ]}
                  onPress={async () => {
                    const newValue = !emailNotifications;
                    setEmailNotifications(newValue);
                    // Supabase'e kaydet
                    await profileService.updateProfile({ notificationsEnabled: newValue });
                    Alert.alert(
                      t('common.success'),
                      newValue ? t('settings.emailEnabled') : t('settings.emailDisabled')
                    );
                  }}
                >
                  <View style={styles.settingRow_switchThumb} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingRow_left}>
                  <Text style={styles.settingRow_title}>{t('settings.weeklySummary')}</Text>
                  <Text style={styles.settingRow_desc}>{t('settings.weeklySummaryDesc')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.settingRow_switch, 
                    weeklySummary 
                      ? { backgroundColor: theme.primary, justifyContent: 'flex-end' }
                      : { backgroundColor: theme.muted, justifyContent: 'flex-start' }
                  ]}
                  onPress={async () => {
                    const newValue = !weeklySummary;
                    setWeeklySummary(newValue);
                    // TODO: Supabase'e özel notification settings tablosuna kaydet
                    Alert.alert(
                      t('common.success'),
                      newValue ? t('settings.weeklyEnabled') : t('settings.weeklyDisabled')
                    );
                  }}
                >
                  <View style={styles.settingRow_switchThumb} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingRow_left}>
                  <Text style={styles.settingRow_title}>{t('settings.campaignNotifications')}</Text>
                  <Text style={styles.settingRow_desc}>{t('settings.campaignNotificationsDesc')}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.settingRow_switch, 
                    campaignNotifications 
                      ? { backgroundColor: theme.primary, justifyContent: 'flex-end' }
                      : { backgroundColor: theme.muted, justifyContent: 'flex-start' }
                  ]}
                  onPress={async () => {
                    const newValue = !campaignNotifications;
                    setCampaignNotifications(newValue);
                    // TODO: Supabase'e özel notification settings tablosuna kaydet
                    Alert.alert(
                      t('common.success'),
                      newValue ? t('settings.campaignEnabled') : t('settings.campaignDisabled')
                    );
                  }}
                >
                  <View style={styles.settingRow_switchThumb} />
                </TouchableOpacity>
              </View>

              {/* Push Notification Permission - Web ile aynı */}
              {(Platform.OS === 'web' || Platform.OS === 'ios' || Platform.OS === 'android') && (
                <>
                  <View style={styles.settingsDivider} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingRow_left}>
                      <Text style={styles.settingRow_title}>{t('settings.liveNotifications')}</Text>
                      <Text style={styles.settingRow_desc}>
                        {Platform.OS === 'web' 
                          ? t('settings.liveNotificationsDescWeb')
                          : t('settings.liveNotificationsDescMobile')}
                      </Text>
                    </View>
                    {pushNotificationPermission === 'granted' ? (
                      <View style={[styles.pushNotificationBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        <Text style={styles.pushNotificationBadgeText}>{t('settings.permissionActive')}</Text>
                      </View>
                    ) : pushNotificationPermission === 'denied' ? (
                      <View style={[styles.pushNotificationBadge, { backgroundColor: theme.destructive }]}>
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                        <Text style={styles.pushNotificationBadgeText}>{t('settings.permissionDenied')}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.pushNotificationButton, { borderColor: theme.border }]}
                        onPress={async () => {
                          try {
                            if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
                              const permission = await Notification.requestPermission();
                              setPushNotificationPermission(permission);
                              
                              if (permission === 'granted') {
                                Alert.alert(t('common.success'), t('settings.permissionGrantedAlert'));
                                // Test notification gönder
                                new Notification('TacticIQ', {
                                  body: t('settings.liveNotificationTestBody'),
                                  icon: '/favicon.ico',
                                });
                              } else if (permission === 'denied') {
                                Alert.alert(t('settings.permissionDeniedAlertTitle'), t('settings.permissionDeniedAlert'));
                              }
                            } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
                              // React Native için expo-notifications kullanılabilir
                              Alert.alert(t('settings.permissionDeniedAlertTitle'), t('settings.permissionMobileInfo'));
                            }
                          } catch (error: any) {
                            console.error('Notification permission error:', error);
                            Alert.alert(t('settings.permissionErrorTitle'), t('settings.permissionError'));
                          }
                        }}
                      >
                        <Ionicons name="flash" size={16} color={theme.primary} />
                        <Text style={[styles.pushNotificationButtonText, { color: theme.primary }]}>{t('settings.permissionAllow')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {pushNotificationPermission === 'denied' && (
                    <Text style={styles.pushNotificationHint}>
                      {Platform.OS === 'web' 
                        ? t('settings.permissionHintWeb')
                        : t('settings.permissionHintMobile')}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.settingsDivider} />

            {/* Yasal Bilgilendirmeler */}
            <TouchableOpacity 
              style={styles.legalButton}
              onPress={() => setShowLegalModal(true)}
            >
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
              <Text style={styles.legalButtonText}>{t('profile.legalInfo')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Güvenlik ve Hesap Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(350)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>{t('profile.securityAndAccount')}</Text>
            </View>

            {/* Şifre Değiştir - Web ile aynı */}
            <TouchableOpacity 
              style={styles.securityButton}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
              <Text style={styles.securityButtonText}>{t('changePassword.title')}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
            </TouchableOpacity>

            {/* Çıkış Yap - Web ve Mobile: Özel modal (açık/koyu mod uyumlu) */}
            <TouchableOpacity 
              style={[styles.securityButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
              onPress={() => setShowLogoutModal(true)}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.securityButtonText, { color: '#EF4444' }]}>{t('profile.logout')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>

            {/* Hesabı Sil - Web ile aynı (collapsible) */}
            <View style={styles.deleteSection}>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => setShowDeleteAccountDialog(true)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.destructive} />
                <Text style={styles.deleteButtonText}>{t('profile.deleteAccount')}</Text>
                <Ionicons name="warning-outline" size={20} color={theme.destructive} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Çıkış Yap Onay Modal - Web & Mobile, açık/koyu mod uyumlu */}
          <Modal
            visible={showLogoutModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowLogoutModal(false)}
          >
            <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setShowLogoutModal(false)}>
              <View style={{ width: '90%', maxWidth: 400, alignSelf: 'center' }} onStartShouldSetResponder={() => true}>
                <Animated.View entering={FadeInDown} style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.foreground }]}>{t('profile.logout')}</Text>
                  <Text style={[styles.modalDescription, { color: theme.mutedForeground }]}>
                    {t('profile.logoutConfirmMessage')}
                  </Text>
                  <View style={[styles.modalActions, { flexDirection: 'row', gap: SPACING.md }]}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonCancel, { borderColor: theme.border, backgroundColor: theme.muted }]}
                      onPress={() => setShowLogoutModal(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalButtonCancelText, { color: theme.foreground }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#EF4444', flex: 1, height: 48, borderRadius: SIZES.radiusLg, alignItems: 'center', justifyContent: 'center' }]}
                    onPress={async () => {
                      setShowLogoutModal(false);
                      try {
                        if (Platform.OS === 'web' && typeof window !== 'undefined') {
                          window.localStorage.clear();
                          window.sessionStorage?.clear();
                          authService.signOut().catch(() => {});
                          window.location.href = '/?logout=' + Date.now();
                          return;
                        }
                        await authService.signOut();
                        Alert.alert(t('common.success'), t('profile.logoutSuccess'));
                        onBack();
                      } catch (error: any) {
                        Alert.alert(t('common.error'), error.message || t('profile.logoutFailed'));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonDeleteText}>{t('profile.logout')}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
              </View>
            </Pressable>
          </Modal>

          {/* Şifre Değiştir Modal - OAuth (Google/Apple) kullanıcılarında mevcut şifre istenmez, sadece "şifre belirle" */}
          <ChangePasswordModal
            visible={showChangePasswordModal}
            onClose={() => setShowChangePasswordModal(false)}
            isOAuth={user.provider === 'google' || user.provider === 'apple'}
          />

          {/* Yasal Bilgilendirmeler Modal */}
          <Modal
            visible={showLegalModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowLegalModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: theme.background }}>
              <LegalDocumentScreen
                onBack={() => setShowLegalModal(false)}
              />
            </View>
          </Modal>

          {/* Hesabı Sil Dialog - Web ile aynı */}
          <Modal
            visible={showDeleteAccountDialog}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeleteAccountDialog(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Ionicons name="alert-triangle" size={24} color={theme.destructive} />
                    <Text style={styles.modalTitle}>Hesabı Sil</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    setShowDeleteAccountDialog(false);
                    setDeleteConfirmText('');
                  }}>
                    <Ionicons name="close" size={24} color={theme.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalDescription}>
                  Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
                </Text>
                <Text style={styles.modalWarning}>
                  Onay için aşağıya "sil" veya "delete" yazın:
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder="sil veya delete yazın"
                  placeholderTextColor={theme.mutedForeground}
                  autoCapitalize="none"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowDeleteAccountDialog(false);
                      setDeleteConfirmText('');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonDelete]}
                    onPress={async () => {
                      const confirmText = deleteConfirmText.toLowerCase().trim();
                      if (confirmText !== 'sil' && confirmText !== 'delete') {
                        Alert.alert(t('common.error'), t('profile.typeToConfirm'));
                        return;
                      }

                      setDeleting(true);
                      try {
                        const { supabase } = await import('../config/supabase');
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                          Alert.alert(t('common.error'), t('profile.sessionNotFound'));
                          return;
                        }

                        // Profil sil
                        await supabase
                          .from('user_profiles')
                          .delete()
                          .eq('id', user.id);

                        // Auth user sil (admin API gerekli, yoksa signOut yap)
                        try {
                          await supabase.auth.admin.deleteUser(user.id);
                        } catch (error) {
                          // Admin API yoksa sadece signOut yap
                          await supabase.auth.signOut();
                        }

                        await AsyncStorage.clear();
                        Alert.alert(t('common.success'), t('profile.accountDeleted'));
                        setShowDeleteAccountDialog(false);
                        setDeleteConfirmText('');
                        onBack();
                      } catch (error: any) {
                        Alert.alert(t('common.error'), error.message || t('profile.accountDeleteFailed'));
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="trash" size={18} color="#FFFFFF" />
                        <Text style={styles.modalButtonDeleteText}>Hesabı Sil</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Eski duplicate içerik tamamen kaldırıldı */}

          {/* Duplicate Kişisel Bilgiler Card kaldırıldı - yukarıda zaten var */}

          {/* 🎯 EN İYİ OLDUĞU KÜME KARTI */}
          {bestCluster && (
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(250)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.clusterIcon}>{bestCluster.icon}</Text>
                <Text style={styles.cardTitle}>En İyi Olduğun Küme</Text>
              </View>

              <View style={styles.bestClusterContainer}>
                <LinearGradient
                  colors={['rgba(5, 150, 105, 0.2)', 'rgba(5, 150, 105, 0.05)']}
                  style={styles.bestClusterCard}
                >
                  <Text style={styles.bestClusterName}>{bestCluster.name}</Text>
                  <View style={styles.bestClusterStats}>
                    <View style={styles.bestClusterStat}>
                      <Text style={styles.bestClusterLabel}>{t('bestCluster.accuracy')}</Text>
                      <Text style={styles.bestClusterValue}>{bestCluster.accuracy}%</Text>
                    </View>
                    <View style={styles.bestClusterBadge}>
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                      <Text style={styles.bestClusterBadgeText}>{t('bestCluster.expert')}</Text>
                    </View>
                  </View>
                  <Text style={styles.bestClusterHint}>
                    {t('bestCluster.hint')}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* Duplicate Achievements Card kaldırıldı - profile tab'ında zaten var */}

          {/* Duplicate Settings ve Security Card kaldırıldı - yukarıda zaten var */}

          {/* Database Test Button kaldırıldı - Web Admin Panel'e taşındı */}

          {/* ✅ Kaydet butonu kaldırıldı - Otomatik kaydetme aktif */}
          <View style={{ marginBottom: 120 }} />
          </View>
        </ScrollView>

        {/* Badge showcase removed - badges shown inline in ProfileCard */}

        {/* 🔍 BADGE DETAIL MODAL */}
        <Modal
          visible={selectedBadge !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedBadge(null)}
          >
            <Animated.View entering={ZoomIn.duration(300)} style={styles.badgeDetailModal}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                {selectedBadge && (
                  <>
                    {/* Badge Icon */}
                    <View
                      style={[
                        styles.badgeDetailIconContainer,
                        {
                          backgroundColor: selectedBadge.earned
                            ? `${getBadgeColor(selectedBadge.tier)}20`
                            : 'rgba(51, 65, 85, 0.3)',
                        },
                      ]}
                    >
                      <Text style={styles.badgeDetailIcon}>
                        {selectedBadge.earned ? selectedBadge.icon : '🔒'}
                      </Text>
                    </View>

                    {/* Badge Name */}
                    <Text style={styles.badgeDetailName}>{t(`badges.names.${selectedBadge.id}`, { defaultValue: selectedBadge.name })}</Text>

                    {/* Badge Tier */}
                    {selectedBadge.earned && (
                      <View
                        style={[
                          styles.badgeDetailTier,
                          { backgroundColor: `${getBadgeColor(selectedBadge.tier)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeDetailTierText,
                            { color: getBadgeColor(selectedBadge.tier) },
                          ]}
                        >
                          {t(`badges.tierLabels.${selectedBadge.tier}`, { defaultValue: getBadgeTierName(selectedBadge.tier) })}
                        </Text>
                      </View>
                    )}

                    {/* Badge Description */}
                    <Text style={styles.badgeDetailDescription}>
                      {t(`badges.descriptions.${selectedBadge.id}`, { defaultValue: selectedBadge.description })}
                    </Text>

                    {/* Requirement */}
                    <View style={styles.badgeDetailRequirement}>
                      <Ionicons
                        name={selectedBadge.earned ? 'checkmark-circle' : 'information-circle'}
                        size={20}
                        color={selectedBadge.earned ? '#22C55E' : '#F59E0B'}
                      />
                      <Text style={styles.badgeDetailRequirementText}>
                        {selectedBadge.earned
                          ? `${t('badges.earnedDateLabel')} ${new Date(selectedBadge.earnedAt!).toLocaleDateString()}`
                          : `${t('badges.howToEarnLabel')} ${t(`badges.descriptions.${selectedBadge.id}`, { defaultValue: selectedBadge.requirement || selectedBadge.description })}`}
                      </Text>
                    </View>

                    {/* Progress Bar (for locked badges) */}
                    {!selectedBadge.earned && (
                      <View style={styles.badgeProgressSection}>
                        <View style={styles.badgeProgressHeader}>
                          <Text style={styles.badgeProgressLabel}>{t('badges.progressLabel')}</Text>
                          <Text style={styles.badgeProgressValue}>12 / 20</Text>
                        </View>
                        <View style={styles.badgeProgressBarContainer}>
                          <LinearGradient
                            colors={[getBadgeColor(selectedBadge.tier), `${getBadgeColor(selectedBadge.tier)}80`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.badgeProgressBarFill, { width: '60%' }]}
                          />
                        </View>
                        <Text style={styles.badgeProgressHint}>🎯 8 {t('badges.progressHintExample')}</Text>
                      </View>
                    )}

                    {/* Close Button */}
                    <TouchableOpacity
                      style={styles.badgeDetailCloseButton}
                      onPress={() => setSelectedBadge(null)}
                    >
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        style={styles.badgeDetailCloseGradient}
                      >
                        <Text style={styles.badgeDetailCloseText}>{t('badges.close')}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>

        {/* Avatar Picker Modal */}
        <Modal
          visible={showAvatarPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAvatarPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.changePhoto')}</Text>
                <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#059669" />
                <Text style={styles.modalOptionText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handlePickImage}
              >
                <Ionicons name="images" size={24} color="#059669" />
                <Text style={styles.modalOptionText}>Galeriden Seç</Text>
              </TouchableOpacity>
              {user.avatar && (
                <TouchableOpacity 
                  style={[styles.modalOption, styles.modalOptionDanger]}
                  onPress={handleRemovePhoto}
                >
                  <Ionicons name="trash" size={24} color="#EF4444" />
                  <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Fotoğrafı Kaldır</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

      </View>

      {/* ✅ Kaydedildi mesajı - tek, şık toast (üst orta) */}
      {autoSaveMessage && (
        <Animated.View 
          entering={Platform.OS === 'web' ? FadeIn : FadeIn.duration(200)}
          exiting={Platform.OS === 'web' ? FadeOut : FadeOut.duration(200)}
          style={[
            styles.savedToast,
            autoSaveMessage.includes('✗') && styles.savedToastError,
          ]}
        >
          <Ionicons 
            name={autoSaveMessage.includes('✗') ? 'close-circle' : 'checkmark-circle'} 
            size={20} 
            color={autoSaveMessage.includes('✗') ? '#FEE2E2' : '#ECFDF5'} 
          />
          <Text style={[
            styles.savedToastText,
            autoSaveMessage.includes('✗') && styles.savedToastTextError,
          ]}>{autoSaveMessage}</Text>
        </Animated.View>
      )}

      {/* ✅ Bulk Data Download Progress - Takım seçimi sonrası veri indirme */}
      {bulkDownloadProgress && bulkDownloadProgress.phase !== 'complete' && (
        <Animated.View
          entering={Platform.OS === 'web' ? FadeIn : FadeIn.duration(300)}
          exiting={Platform.OS === 'web' ? FadeOut : FadeOut.duration(300)}
          style={{
            position: 'absolute',
            bottom: 80,
            left: 16,
            right: 16,
            backgroundColor: bulkDownloadProgress.phase === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1000,
          }}
        >
          {bulkDownloadProgress.phase !== 'error' && (
            <ActivityIndicator size="small" color="#FFFFFF" />
          )}
          {bulkDownloadProgress.phase === 'error' && (
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
              {bulkDownloadProgress.message}
            </Text>
            {bulkDownloadProgress.phase !== 'error' && (
              <View style={{ 
                height: 3, 
                backgroundColor: 'rgba(255,255,255,0.3)', 
                borderRadius: 2, 
                marginTop: 6,
                overflow: 'hidden',
              }}>
                <View style={{ 
                  height: '100%', 
                  width: `${bulkDownloadProgress.progress}%`, 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: 2,
                }} />
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Otomatik kaydetme aktif - banner kaldırıldı */}
    </ScreenLayout>
  );
};

const createStyles = (isDark: boolean = true) => {
  const theme = isDark ? COLORS.dark : COLORS.light;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Grid pattern ScreenLayout'tan geliyor
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: isDark
          ? `linear-gradient(to right, rgba(31, 162, 166, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(31, 162, 166, 0.08) 1px, transparent 1px)`
          : `linear-gradient(to right, rgba(15, 42, 36, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 42, 36, 0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 245 : 235, // Kişi kartı + favori takım barı (overlay ile aynı yükseklik)
    paddingBottom: 96 + SIZES.tabBarHeight,
    alignItems: 'center',
  },
  scrollContentInner: {
    width: '100%',
    maxWidth: Math.min(Dimensions.get('window').width, 560),
    alignSelf: 'center',
  },

  // Profile Header Card - açık modda grid'den ayrılsın (hafif koyu ton + çerçeve)
  profileHeaderCard: {
    backgroundColor: isDark ? theme.card : 'rgba(242,245,244,0.98)',
    borderRadius: SIZES.radiusXl,
    borderWidth: isDark ? 1 : 1.5,
    borderColor: isDark ? theme.border : 'rgba(15, 42, 36, 0.18)',
    marginBottom: SPACING.base,
    overflow: 'visible',
    zIndex: 5,
    position: 'relative',
    ...(!isDark && Platform.OS === 'web' ? { boxShadow: '0 1px 3px rgba(15,42,36,0.08)' } : {}),
  },
  profileHeaderBanner: {
    height: 80,
    width: '100%',
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  profileHeaderContent: {
    paddingTop: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -48, // Avatar banner üzerine çıkıyor
    zIndex: 10, // Badge'lerin üstünde görünmesi için
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 15, // Badge'lerin üstünde görünmesi için
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: SIZES.radiusFull / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.base,
  },
  name: {
    ...TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.cardForeground,
  },
  emailText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
  },

  // Badges
  crownEmoji: {
    fontSize: 16,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.bold,
    color: '#000000', // Web ile aynı (black text)
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: 'transparent',
  },
  freeBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.mutedForeground,
  },

  rankingCard_single: {
    width: '100%',
    backgroundColor: isDark ? theme.card + '80' : 'rgba(242,245,244,0.96)',
    borderWidth: isDark ? 1 : 1.5,
    borderColor: isDark ? theme.border : 'rgba(15, 42, 36, 0.18)',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  rankingTableContainer: {
    width: '100%',
    backgroundColor: isDark ? theme.card + '80' : 'rgba(242,245,244,0.96)',
    borderWidth: isDark ? 1 : 1.5,
    borderColor: isDark ? theme.border : 'rgba(15, 42, 36, 0.18)',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  rankingTableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.muted + '4D', // 30% opacity
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingVertical: SPACING.md,
  },
  rankingTableHeaderCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  rankingTableHeaderText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.foreground,
  },
  rankingTableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.base,
  },
  rankingTableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  rankingTableCellContent: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rankingTableCountryText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.foreground,
    marginTop: SPACING.xs,
  },
  rankingTableValue: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
  },
  rankingTableEmptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: SPACING.xs,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
  },
  rankingRow_left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rankingRow_label: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.cardForeground,
  },
  rankingRow_right: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  rankingValue: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
  },
  rankingEmptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    fontStyle: 'italic',
    textAlign: 'right',
    maxWidth: 180,
  },
  rankingDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: SPACING.base,
  },
  flagEmoji: {
    fontSize: 20,
  },
  rankingCountryText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.cardForeground,
  },
  rankingBadge: {
    backgroundColor: theme.secondary + '33', // 20% opacity
    borderWidth: 1,
    borderColor: theme.secondary + '4D', // 30% opacity
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  rankingBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.secondary,
  },
  rankingBadgeEmpty: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  rankingBadgeEmptyText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.mutedForeground,
  },

  // Achievements Grid - 4 sütun, taşma yok
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  achievementCard: {
    width: '23%',
    minWidth: 72,
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: theme.accent + '1A',
    borderWidth: 1,
    borderColor: theme.accent + '33',
    borderRadius: SIZES.radiusMd,
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: SPACING.xs,
  },
  achievementName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.cardForeground,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  achievementDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    textAlign: 'center',
  },

  // Son Başarımlar - son 3 rozet, diğer rozetlerle aynı boyut
  latestBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: SPACING.sm,
    width: '100%',
  },
  latestBadgeCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '33%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.accent + '1A',
    borderWidth: 1,
    borderColor: theme.accent + '33',
    borderRadius: SIZES.radiusMd,
  },
  latestBadgeIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  latestBadgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.cardForeground,
    marginBottom: 4,
    textAlign: 'center',
  },
  latestBadgeDescription: {
    fontSize: 11,
    color: theme.mutedForeground,
    textAlign: 'center',
    lineHeight: 14,
  },
  latestBadgesEmpty: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  latestBadgesEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.mutedForeground,
    marginTop: 8,
  },
  latestBadgesEmptyHint: {
    fontSize: 12,
    color: theme.mutedForeground,
    marginTop: 4,
  },

  // Level & Points
  levelPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statValueGreen: {
    ...TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: theme.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Card - açık modda grid'den ayrılsın: bir tık koyu zemin (en zemin yapıdan belirgin ayrım)
  card: {
    backgroundColor: isDark ? theme.card : 'rgba(242,245,244,0.98)',
    borderWidth: isDark ? 1 : 1.5,
    borderColor: isDark ? theme.border : 'rgba(15, 42, 36, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary + '99',
    borderRadius: SIZES.radiusLg,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: isDark ? '#000' : theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.06 : 0.1,
        shadowRadius: 6,
      },
      android: { elevation: isDark ? 2 : 3 },
      web: { boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 12px rgba(15,42,36,0.12)' },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '40', // Subtle divider
  },
  cardContentCentered: {
    alignItems: 'center',
  },
  cardHeaderCentered: {
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.foreground,
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  cardFavoriteTeams: {
    borderLeftColor: (theme.accent || '#F59E0B') + 'CC',
    backgroundColor: isDark ? theme.card : 'rgba(245, 158, 11, 0.05)',
  },
  cardPersonalInfo: {
    borderLeftColor: '#6366F1' + 'AA',
    backgroundColor: isDark ? theme.card : 'rgba(99, 102, 241, 0.04)',
  },

  // Performance
  performanceGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  performanceItem: {
    flex: 1,
    backgroundColor: theme.muted,
    borderRadius: SIZES.radiusMd,
    padding: SPACING.base,
    alignItems: 'center',
  },
  performanceValue: {
    ...TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: theme.foreground,
    marginBottom: SPACING.xs,
  },
  performanceValueGreen: {
    ...TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: theme.primary,
    marginBottom: SPACING.xs,
  },
  performanceValueGold: {
    ...TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: theme.accent,
    marginBottom: SPACING.xs,
  },
  performanceLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    textAlign: 'center',
  },

  // XP Gain Card - Web ile aynı
  xpGainCard: {
    marginTop: SPACING.base,
    padding: SPACING.base,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
  },
  xpGainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  xpGainLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.medium,
  },
  xpGainValue: {
    ...TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.xs,
  },
  xpGainTotal: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: SPACING.xs,
  },

  // Ranking
  rankingCard: {
    padding: SPACING.base,
    backgroundColor: theme.primary + '20', // 20% opacity
    borderWidth: 1,
    borderColor: theme.primary + '30', // 30% opacity
    borderRadius: SIZES.radiusMd,
    marginBottom: SPACING.base,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rankingSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  rankingRank: {
    ...TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.primary,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  topPercentage: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  topPercentageHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  topPercentBadge: {
    backgroundColor: theme.primary + '20', // 20% opacity
    paddingHorizontal: 10,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusMd,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  topPercentBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.primary,
  },
  rankingNoRank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  metricText: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Teams
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 20,
  },
  // ✅ Yeni takım seçim stilleri
  teamsSelectionContainer: {
    gap: 12,
  },
  teamSelectWrapper: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 4, // Dropdown için boşluk
  },
  teamSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    minHeight: 60,
  },
  teamSelectButtonSelected: {
    borderColor: 'rgba(5, 150, 105, 0.6)',
    borderWidth: 2,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  teamSelectButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F8FAFB',
  },
  selectedTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  colorStripe: {
    width: 6,
    height: 50,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.3)' },
    }),
  },
  colorStripeSecondary: {
    width: '100%',
    height: '50%',
  },
  teamInfo: {
    flex: 1,
  },
  selectedTeamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFB',
    marginBottom: 2,
  },
  selectedTeamDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: '#1A3A34',
    borderWidth: 1.5,
    borderColor: 'rgba(31, 162, 166, 0.4)',
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
      web: { boxShadow: '0 6px 12px rgba(0,0,0,0.4)' },
    }),
  },
  searchInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 12,
    fontSize: 14,
    color: '#F8FAFB',
  },
  loadingIndicator: {
    marginVertical: 8,
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.1)',
    gap: 12,
  },
  colorStripeSmall: {
    width: 5,
    height: 42,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  colorStripeSmallSecondary: {
    width: '100%',
    height: '50%',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFB',
    marginBottom: 2,
  },
  dropdownItemDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  freePlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  freePlanText: {
    fontSize: 13,
    color: '#F59E0B',
    flex: 1,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  teamName: {
    fontSize: 14,
    color: '#059669',
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
  },
  achievementIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Database Test Button
  dbTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#1A3A34',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.4)',
  },
  dbTestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },

  // PRO Card
  proCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 24,
    marginBottom: 24,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  proSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  proFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  proFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  proFeatureText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  proButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modal - Web ile aynı (merkeze alınmış)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusXl,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
  },
  modalDescription: {
    ...TYPOGRAPHY.body,
    color: theme.mutedForeground,
    marginBottom: SPACING.base,
    lineHeight: 20,
  },
  modalWarning: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginBottom: SPACING.sm,
  },
  modalInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: theme.foreground,
    marginBottom: SPACING.base,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.base,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radiusSm,
  },
  modalButtonCancel: {
    backgroundColor: theme.muted,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtonCancelText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
  },
  modalButtonDelete: {
    backgroundColor: theme.destructive,
  },
  modalButtonDeleteText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: '#FFFFFF',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    gap: 12,
  },
  modalOptionDanger: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalOptionText: {
    fontSize: 16,
    flex: 1,
    color: '#FFFFFF',
  },
  modalOptionTextDanger: {
    color: '#EF4444',
  },

  // Loading State
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // ✅ Saved Toast - tek, üst ortada pill
  savedToast: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)' },
    }),
  } as ViewStyle,
  savedToastError: {
    backgroundColor: '#DC2626',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)' },
    }),
  } as ViewStyle,
  savedToastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ECFDF5',
    marginLeft: 10,
  },
  savedToastTextError: {
    color: '#FEE2E2',
  },
  
  // ✅ Rozetlerim Section - Diğer kartlarla aynı genişlik, ortalı (%75 azaltılmış boşluk)
  badgesSectionCard: {
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: SPACING.base,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  badgesSectionHeader: {
    marginBottom: SPACING.sm,
    alignItems: 'center',
    width: '100%',
  },
  badgesSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badgesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.foreground,
  },
  badgesSectionProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  badgesSectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  badgesSectionProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.muted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  badgesSectionProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgesGridInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  badgeItemInline: {
    marginBottom: 8,
    aspectRatio: 0.83, // 1/1.2 = yükseklik %20 artırıldı
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeItemEarned: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  badgeItemLocked: {
    borderColor: 'rgba(100, 116, 139, 0.4)',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  // 4 sütun için: %23 genişlik (4x23=92, kalan 8% boşluk olarak dağılır)
  badgeItem4Col: {
    width: '23%' as any,
    maxWidth: '23%' as any,
  },
  // 8 sütun için: %11.5 genişlik
  badgeItem8Col: {
    width: '11.5%' as any,
    maxWidth: '11.5%' as any,
  },
  badgeLockOverlay: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEarnedCheck: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmojiInline: {
    fontSize: 24,
    marginBottom: 3,
  },
  badgeEmojiLocked: {
    // ✅ Grayscale ve opacity kaldırıldı - rozetler renkli görünecek
    // Sadece kilit ikonu ile "kilitli" olduğu anlaşılacak
    opacity: 0.85, // Hafif soluk ama renkli
  } as any,
  badgeNameInline: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.foreground,
    textAlign: 'center',
    lineHeight: 12,
  },
  badgeNameLocked: {
    color: '#94A3B8', // Biraz daha okunabilir renk
  },
  noBadgesInline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noBadgesText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.mutedForeground,
  },
  
  // Best Cluster Card
  clusterIcon: {
    fontSize: 20,
  },
  bestClusterContainer: {
    marginTop: 12,
  },
  bestClusterCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  bestClusterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bestClusterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestClusterStat: {
    flex: 1,
  },
  bestClusterLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  bestClusterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  bestClusterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 20,
  },
  bestClusterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  bestClusterHint: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  // Ad Container
  adContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // 🏆 TAB NAVIGATION STYLES
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.muted,
    borderRadius: SIZES.radiusMd,
    padding: 4,
    marginHorizontal: 0, // Header kaldırıldığı için margin yok
    marginTop: 0, // ScrollContent'te padding var
    marginBottom: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: SIZES.radiusSm,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: theme.card,
    ...SHADOWS.sm,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.mutedForeground,
  },
  tabTextActive: {
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.medium,
  },
  badgeCountBubble: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeCountText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.bold,
    color: theme.accentForeground,
  },
  statValueGold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },

  // ⚽ MATCH CARD STYLES
  matchCard: {
    backgroundColor: '#1A3A34',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchLeague: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  matchTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  matchDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeam: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    paddingHorizontal: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  liveMinute: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyMatchesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyMatchesText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },

  // 🏆 BADGE SHOWCASE STYLES - Web ile aynı stil ve renk hiyerarşisi
  badgeShowcaseContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  badgeShowcaseContent: {
    padding: SPACING.base,
    paddingBottom: 100,
  },
  // Badge Progress Card - Web ile aynı (bg-muted/50)
  badgeProgressCard: {
    backgroundColor: theme.muted + '80', // 50% opacity (bg-muted/50)
    borderRadius: SIZES.radiusMd,
    padding: SPACING.base,
    marginBottom: SPACING.base,
  },
  badgeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeProgressCount: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
  },
  badgeProgressPercent: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
  },
  badgeProgressBarContainer: {
    height: 8,
    backgroundColor: theme.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Badges Grid - 4 sütun x 10 satır, yeterince büyük kartlar
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'flex-start',
  },
  badgeCard: {
    width: '23%' as const,
    minWidth: 80,
    aspectRatio: 1.05,
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    ...Platform.select({
      web: { flexBasis: '23%' as const, maxWidth: '23%' as const },
      default: {},
    }),
  },
  badgeCardEarned: {
    borderColor: '#F59E0B80', // amber-500/50 (web ile aynı)
    backgroundColor: '#F59E0B0D', // amber-500/5 (web ile aynı)
  },
  badgeCardLocked: {
    borderColor: 'rgba(230, 230, 230, 0.5)', // border/50 (web ile aynı) - fixed invalid color format
    backgroundColor: theme.card,
    opacity: 0.8,
  },
  badgeEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  badgeName: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    lineHeight: 14,
  },
  // Badge Tier Labels - Web ile aynı renkler
  badgeTierLabel: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeTierBronze: {
    backgroundColor: 'transparent',
    borderColor: '#EA580C4D', // orange-600/30
  },
  badgeTierSilver: {
    backgroundColor: 'transparent',
    borderColor: '#94A3B84D', // slate-400/30
  },
  badgeTierGold: {
    backgroundColor: 'transparent',
    borderColor: '#F59E0B4D', // amber-500/30
  },
  badgeTierPlatinum: {
    backgroundColor: 'transparent',
    borderColor: '#A855F74D', // purple-500/30
  },
  badgeTierDiamond: {
    backgroundColor: 'transparent',
    borderColor: '#22D3EE4D', // cyan-400/30
  },
  badgeTierText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.bold,
  },
  badgeTierTextBronze: {
    color: '#EA580C', // orange-600
  },
  badgeTierTextSilver: {
    color: '#94A3B8', // slate-400
  },
  badgeTierTextGold: {
    color: '#F59E0B', // amber-500
  },
  badgeTierTextPlatinum: {
    color: '#A855F7', // purple-500
  },
  badgeTierTextDiamond: {
    color: '#22D3EE', // cyan-400
  },
  // Lock Icon - Web ile aynı
  badgeLockIcon: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.muted,
    borderWidth: 1,
    borderColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Checkmark - Web ile aynı
  badgeCheckmark: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E', // green-500 (web ile aynı)
    borderWidth: 1,
    borderColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.md,
  },
  badgeCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold,
  },
  emptyBadgeState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyBadgeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBadgeText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  // 🔍 BADGE DETAIL MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDetailModal: {
    backgroundColor: '#1A3A34',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  badgeDetailIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badgeDetailIcon: {
    fontSize: 60,
  },
  badgeDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeDetailTier: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeDetailTierText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeDetailDescription: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  badgeDetailRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeDetailRequirementText: {
    flex: 1,
    fontSize: 14,
    color: '#F8FAFB',
    lineHeight: 20,
    fontWeight: '600',
  },
  badgeDetailCloseButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeDetailCloseGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgeDetailCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Badge Progress Bar
  badgeProgressSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.2)',
  },
  badgeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  badgeProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFB',
  },
  badgeProgressBarContainer: {
    height: 8,
    backgroundColor: '#0F2A24',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  badgeProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgeProgressHint: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },

  // ✅ FAVORITE TEAM CARD STYLES - Modernized & Standardized
  favoriteTeamCard: {
    position: 'relative',
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Glassmorphism - FavoriteTeamsScreen ile aynı
    borderRadius: 16, // Daha yuvarlak köşeler
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.15)', // Yumuşak border
    minHeight: 110,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' },
    }),
  },
  sideStripeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6, // FavoriteTeamsScreen ile aynı
    zIndex: 0,
    opacity: 0.85, // Biraz daha yumuşak
  },
  sideStripeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6, // FavoriteTeamsScreen ile aynı
    zIndex: 0,
    opacity: 0.85, // Biraz daha yumuşak
  },
  favoriteTeamContent: {
    padding: SPACING.base,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    zIndex: 1, // Gradient şeritlerin üstünde
  },
  favoriteTeamLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  favoriteTeamName: {
    ...TYPOGRAPHY.h3,
    fontSize: 17, // FavoriteTeamsScreen ile aynı
    fontWeight: '700',
    color: BRAND.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  favoriteTeamCoach: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12, // FavoriteTeamsScreen ile aynı
    color: 'rgba(5, 150, 105, 0.9)', // Yumuşak emerald
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic', // FavoriteTeamsScreen ile aynı
  },
  favoriteTeamMeta: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11, // FavoriteTeamsScreen ile aynı
    color: 'rgba(148, 163, 184, 0.7)', // Yumuşak muted
    textAlign: 'center',
    fontWeight: '400',
  },
  emptyFavorites: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFavoritesText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ✏️ EDIT BUTTON
  editButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },

  // 👥 TEAM EDITING STYLES
  teamsEditContainer: {
    gap: SPACING.base,
  },
  teamSelectSection: {
    gap: SPACING.sm,
  },
  teamSelectLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.foreground,
  },
  teamSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    minHeight: SIZES.inputHeight,
  },
  teamSelectButtonText: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    flex: 1,
  },
  teamDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    maxHeight: 200,
    zIndex: 1000,
    ...SHADOWS.lg,
  },
  teamSearchInput: {
    ...TYPOGRAPHY.body,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.inputBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    color: theme.foreground,
  },
  searchLoading: {
    padding: SPACING.sm,
  },
  teamDropdownList: {
    maxHeight: 150,
  },
  teamDropdownItem: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  teamDropdownItemName: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.medium,
  },
  teamDropdownItemMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: 2,
  },
  clubTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  removeTeamButton: {
    padding: SPACING.xs,
  },
  teamSelectHint: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
  },
  lockedClubTeams: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: theme.muted,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: theme.accent + '30',
  },
  lockedClubTeamsTitle: {
    ...TYPOGRAPHY.h3,
    color: theme.accent,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  lockedClubTeamsText: {
    ...TYPOGRAPHY.body,
    color: theme.mutedForeground,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  proUpgradeButton: {
    borderRadius: SIZES.radiusSm,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  proUpgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  proUpgradeButtonText: {
    ...TYPOGRAPHY.button,
    color: theme.accentForeground,
    fontWeight: TYPOGRAPHY.semibold,
  },

  // 📝 PROFILE FORM STYLES
  profileForm: {
    gap: SPACING.base,
  },
  profileInfo: {
    gap: SPACING.base,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  profileInfoLabel: {
    ...TYPOGRAPHY.body,
    color: theme.mutedForeground,
    fontWeight: TYPOGRAPHY.medium,
  },
  profileInfoValue: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.base,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    backgroundColor: theme.muted,
  },
  editProfileButtonText: {
    ...TYPOGRAPHY.button,
    color: theme.primary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  formRow: {
    gap: SPACING.xs,
  },
  formLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.foreground,
    marginBottom: SPACING.xs,
  },
  formInput: {
    ...TYPOGRAPHY.body,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    color: theme.foreground,
    minHeight: SIZES.inputHeight,
  },
  formHint: {
    ...TYPOGRAPHY.caption,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.base,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radiusSm,
    minHeight: SIZES.buttonHeight,
  },
  formButtonSave: {
    backgroundColor: theme.primary,
  },
  formButtonCancel: {
    backgroundColor: theme.muted,
    borderWidth: 1,
    borderColor: theme.border,
  },
  formButtonText: {
    ...TYPOGRAPHY.button,
    color: theme.primaryForeground,
    fontWeight: TYPOGRAPHY.semibold,
  },

  // ⚙️ SETTINGS STYLES
  settingsContainer: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.medium,
  },
  settingItemSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: 2,
  },
  securityContainer: {
    gap: 0,
  },
  deleteAccountItem: {
    borderBottomWidth: 0,
  },

  // ===== YENİ STİLLER - WEB İLE UYUMLU =====
  
  // Form Fields
  formField: {
    marginBottom: SPACING.lg,
  },
  requiredStar: {
    color: theme.accent,
    fontWeight: TYPOGRAPHY.bold,
    fontSize: 14,
  },
  
  // Dropdown Button
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: theme.border + '80',
    borderRadius: 10,
    backgroundColor: theme.card,
  },
  dropdownButtonSelected: {
    borderColor: theme.primary + '99',
    backgroundColor: theme.primary + '0F',
  },
  dropdownSelectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  searchHintInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  searchHintText: {
    fontSize: 12,
    color: theme.mutedForeground,
    fontStyle: 'italic',
  },
  dropdownButtonTextSelected: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.semibold,
  },
  dropdownButtonTextPlaceholder: {
    ...TYPOGRAPHY.body,
    color: theme.mutedForeground,
  },

  // Dropdown Modal
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: { alignItems: 'center' },
    }),
  },
  dropdownModalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '80%',
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: theme.secondary + '30',
    borderBottomWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: theme.secondary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: `0 -4px 24px ${theme.secondary}25`,
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
      },
    }),
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '60',
    backgroundColor: theme.primary + '12',
  },
  dropdownModalTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.bold,
  },
  dropdownSearchInput: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.base,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: theme.secondary + '40',
    borderRadius: SIZES.radiusMd,
    backgroundColor: theme.background,
    color: theme.foreground,
    ...TYPOGRAPHY.body,
  },
  dropdownLoading: {
    marginVertical: SPACING.base,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '50',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56,
  },
  dropdownItemColorStrip: {
    width: 4,
    borderRadius: 0,
  },
  dropdownItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  dropdownItemName: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    fontWeight: TYPOGRAPHY.medium,
  },
  dropdownItemMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.secondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  teamFlagImage: {
    width: 28,
    height: 20,
    borderRadius: 3,
  },

  // Selected Teams Badges - Estetik Tasarım
  selectedTeamsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: SPACING.md,
    paddingVertical: 4,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(31, 162, 166, 0.12)',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(31, 162, 166, 0.35)',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(31, 162, 166, 0.15)',
        transition: 'all 0.2s ease',
      },
      ios: {
        shadowColor: '#1FA2A6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  teamBadgeText: {
    fontSize: 13,
    color: isDark ? '#E2E8F0' : '#0F2A24',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  teamBadgeRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Locked Section
  lockedSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: theme.muted + '4D',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: theme.border,
  },
  lockedTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.mutedForeground,
    marginTop: SPACING.sm,
  },
  lockedText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  proButton: {
    marginTop: SPACING.base,
  },
  proButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: SIZES.radiusMd,
  },
  proButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.semibold,
    color: '#000000',
  },

  // Edit Button
  editButton_main: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    marginTop: SPACING.base,
  },
  editButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.primary,
  },

  // Save/Cancel Buttons - Web ile aynı
  saveButton: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: SIZES.radiusSm,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    minHeight: SIZES.buttonHeight,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.primaryForeground,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    backgroundColor: theme.muted,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    minHeight: SIZES.buttonHeight,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.button,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
  },

  // Editable input field styling
  formInputEditable: {
    borderColor: theme.primary + '40',
    backgroundColor: theme.background,
  },
  
  // Permanent save button (always visible)
  saveButtonPermanent: {
    marginTop: SPACING.md,
    overflow: 'hidden',
    borderRadius: SIZES.radiusSm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },

  // Settings
  settingsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.base,
  },
  settingsField: {
    flex: 1,
    minHeight: 60, // Kayma önleme - her iki field aynı yükseklikte
  },
  settingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    minHeight: 24, // Değer alanı için minimum yükseklik
  },
  settingsValueText: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
  },
  // Language Dropdown Styles
  languageDropdown: {
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageDropdownModal: {
    backgroundColor: theme.card,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 280,
    maxWidth: 320,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10, // Dropdown backdrop üstünde olsun
  },
  languageDropdownContent: {
    padding: SPACING.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border + '40',
  },
  languageOptionSelected: {
    backgroundColor: theme.primary + '15',
  },
  languageFlag: {
    fontSize: 20,
  },
  languageName: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    flex: 1,
  },
  languageNameSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: theme.border,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  themeToggleLabel: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
    fontWeight: '500',
  },
  themeToggleButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  themeButtonActive: {
    backgroundColor: BRAND.primary,
  },
  themeButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: '#000',
    fontWeight: '600',
    marginVertical: SPACING.base,
  },
  notificationsSection: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.mutedForeground,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  settingRow_left: {
    flex: 1,
  },
  settingRow_title: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
  },
  settingRow_desc: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
  },
  settingRow_switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRow_switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 2px rgba(0,0,0,0.2)' },
    }),
  },
  // Push Notification Styles
  pushNotificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
  },
  pushNotificationBadgeText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.semibold,
  },
  pushNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
  },
  pushNotificationButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: TYPOGRAPHY.medium,
  },
  pushNotificationHint: {
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },

  // Legal Button
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    backgroundColor: theme.card,
  },
  legalButtonText: {
    ...TYPOGRAPHY.body,
    color: theme.foreground,
  },

  // Security Buttons - Web ile aynı stil (outline variant)
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusSm,
    backgroundColor: 'transparent', // Web'deki outline variant gibi
    marginBottom: SPACING.sm,
    minHeight: SIZES.buttonHeight,
    width: '100%',
  },
  securityButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
    flex: 1,
  },
  deleteSection: {
    marginTop: SPACING.base,
    borderWidth: 1,
    borderColor: theme.destructive + '33',
    borderRadius: SIZES.radiusMd,
    overflow: 'hidden',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.base,
    backgroundColor: theme.destructive + '0D',
  },
  deleteButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: TYPOGRAPHY.medium,
    color: theme.destructive,
    flex: 1,
    marginLeft: SPACING.sm,
  },
});
};

// Varsayılan stiller - Component içinde dinamik olarak override edilecek
const defaultStyles = createStyles(true);
