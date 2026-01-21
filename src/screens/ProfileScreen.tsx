import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn, FadeIn } from 'react-native-reanimated';
import { AdBanner } from '../components/ads/AdBanner';
import { usersDb, predictionsDb } from '../services/databaseService';
import { STORAGE_KEYS } from '../config/constants';
import ScoringEngine from '../logic/ScoringEngine';
import { AnalysisCluster } from '../types/prediction.types';
import { getAllAvailableBadges, getUserBadges } from '../services/badgeService';
import { Badge, getBadgeColor, getBadgeTierName } from '../types/badges.types';
import { ALL_BADGES, BadgeDefinition, getBadgeById } from '../constants/badges';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import { logger } from '../utils/logger';
import { profileService } from '../services/profileService';
import { calculateTopPercent } from '../types/profile.types';
import { teamsApi } from '../services/api';
import { SPACING, TYPOGRAPHY, BRAND, DARK_MODE, COLORS, SIZES, SHADOWS } from '../theme/theme';
import { StandardHeader, ScreenLayout } from '../components/layouts';
import { containerStyles } from '../utils/styleHelpers';

// Theme colors (Dark mode - mobil varsayılan olarak dark mode kullanıyor)
const theme = COLORS.dark;

// Helper: StyleSheet için theme-aware styles
const createStyles = () => {
  const theme = COLORS.dark;
  return StyleSheet.create({

interface ProfileScreenProps {
  onBack: () => void;
  onSettings: () => void;
  onProUpgrade: () => void;
  onDatabaseTest?: () => void;
  onTeamSelect?: (teamId: number, teamName: string) => void; // ✅ Takım seçildiğinde o takımın maçlarını göster
  initialTab?: 'profile' | 'badges'; // Initial tab to show
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onSettings,
  onProUpgrade,
  onDatabaseTest,
  onTeamSelect,
  initialTab = 'profile',
}) => {
  const { t } = useTranslation();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
  const { favoriteTeams, addFavoriteTeam, removeFavoriteTeam, isFavorite, refetch } = useFavoriteTeams();
  
  // ✅ Takım seçim state'leri
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null>(null);
  const [selectedClubTeams, setSelectedClubTeams] = useState<Array<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null>>([null, null, null, null, null]);
  const [openDropdown, setOpenDropdown] = useState<'national' | 'club1' | 'club2' | 'club3' | 'club4' | 'club5' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiTeams, setApiTeams] = useState<Array<{ id: number; name: string; colors: string[]; country: string; league: string; type: 'club' | 'national'; coach?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 📊 USER STATS STATE
  const [user, setUser] = useState({
    name: 'Kullanıcı',
    username: '@kullanici',
    email: 'user@example.com',
    avatar: '',
    level: 1,
    points: 0,
    countryRank: 0,
    totalPlayers: 0,
    country: 'Türkiye',
    avgMatchRating: 0,
    xpGainThisWeek: 0,
    stats: {
      success: 0,
      total: 0,
      streak: 0,
    },
  });

  // 🎯 BEST CLUSTER STATE
  const [bestCluster, setBestCluster] = useState<{
    name: string;
    accuracy: number;
    icon: string;
  } | null>(null);

  // 🏆 LOAD BADGES
  const loadBadges = async () => {
    try {
      // Get all available badges (earned + locked)
      const availableBadges = await getAllAvailableBadges();
      
      // Map ALL_BADGES to include earned status from availableBadges
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
      
      // Count earned badges
      const earnedCount = badgesWithStatus.filter(b => b.earned).length;
      setBadgeCount(earnedCount);
      
      logger.info(`Loaded badges: ${ALL_BADGES.length} total, ${earnedCount} earned`, { total: ALL_BADGES.length, earned: earnedCount }, 'BADGES');
      
      // Initialize test badges in background (non-blocking)
      if (earnedCount === 0) {
        // Only initialize if no badges exist
        setTimeout(async () => {
          try {
            const badgeService = await import('../services/badgeService');
            if (badgeService.initializeTestBadges) {
              await badgeService.initializeTestBadges();
              // Reload badges after initialization
              const updatedBadges = await getAllAvailableBadges();
              const updatedStatus = ALL_BADGES.map((badgeDef) => {
                const earnedBadge = updatedBadges.find(b => b.id === badgeDef.id);
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
              setAllBadges(updatedStatus as any);
              setBadgeCount(updatedStatus.filter(b => b.earned).length);
            }
          } catch (err) {
            logger.warn('Background badge init failed', { error: err }, 'BADGES');
          }
        }, 1000);
      }
    } catch (error) {
      logger.error('Error loading badges', { error }, 'BADGES');
      // Fallback: show empty badges
      setAllBadges([]);
      setBadgeCount(0);
    }
  };

  // 🔄 FETCH USER DATA FROM SUPABASE (Unified Profile Service)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // 🆕 Unified Profile Service kullan (Web ile senkronize)
        const unifiedProfile = await profileService.getProfile();
        
        if (unifiedProfile) {
          logger.info('Unified profile loaded', { id: unifiedProfile.id, plan: unifiedProfile.plan }, 'PROFILE');
          
          // Unified profile'dan verileri state'e aktar
          const fullName = unifiedProfile.name || unifiedProfile.nickname || 'Kullanıcı';
          const nameParts = fullName.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setNickname(unifiedProfile.nickname || nameParts[0] || '');
          
          setUser({
            name: fullName,
            username: unifiedProfile.nickname ? `@${unifiedProfile.nickname}` : '@kullanici',
            email: unifiedProfile.email,
            avatar: unifiedProfile.avatar || '',
            level: unifiedProfile.level || 1,
            points: unifiedProfile.totalPoints || 0,
            countryRank: unifiedProfile.countryRank || 0,
            totalPlayers: 5000, // TODO: Backend'den çekilecek
            country: unifiedProfile.country === 'TR' ? 'Türkiye' : unifiedProfile.country || 'Türkiye',
            avgMatchRating: (unifiedProfile.accuracy || 0) / 10,
            xpGainThisWeek: unifiedProfile.xp || 0,
            stats: {
              success: unifiedProfile.accuracy || 0,
              total: unifiedProfile.totalPredictions || 0,
              streak: unifiedProfile.currentStreak || 0,
            },
          });
          
          // Pro durumu - birden fazla alan kontrol et
          const isPro = unifiedProfile.plan === 'pro' || 
                        (unifiedProfile as any).is_pro === true || 
                        (unifiedProfile as any).isPro === true ||
                        (unifiedProfile as any).is_premium === true ||
                        (unifiedProfile as any).isPremium === true;
          setIsPro(isPro);
          logger.debug(`User is ${isPro ? 'PRO' : 'FREE'}`, { 
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
        }

        // Fallback: AsyncStorage'dan yükle (eski sistem)
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        
        // ✅ Kullanıcı adı ve ismini AsyncStorage'dan yükle (fallback)
        if (!unifiedProfile && userData) {
          setUser(prev => ({
            ...prev,
            name: userData.name || prev.name,
            username: userData.username ? `@${userData.username}` : prev.username,
            avatar: userData.avatar || prev.avatar,
          }));
        }
        
        // UUID formatında değilse null gönder (Supabase UUID bekliyor)
        const userId = userData?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id) 
          ? userData.id 
          : null;
        
        // Load badges
        await loadBadges();
        
        // ✅ Favorite teams artık useFavoriteTeams hook'undan geliyor
        // Mevcut favori takımları yükle ve state'e aktar
        const favoriteTeamsStr = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_TEAMS);
        if (favoriteTeamsStr) {
          const teams = JSON.parse(favoriteTeamsStr);
          // Milli takım ve kulüp takımlarını ayır
          const nationalTeam = teams.find((t: any) => t.type === 'national');
          const clubTeams = teams.filter((t: any) => t.type === 'club').slice(0, 5);
          
          if (nationalTeam) {
            setSelectedNationalTeam({
              id: nationalTeam.id,
              name: nationalTeam.name,
              colors: nationalTeam.colors || ['#1E40AF', '#FFFFFF'],
              country: nationalTeam.country || 'Milli Takım',
              league: nationalTeam.league || 'UEFA',
              coach: nationalTeam.coach || nationalTeam.manager || 'Bilinmiyor',
            });
          }
          
          // Kulüp takımlarını sırayla yerleştir
          const clubArray: Array<{ id: number; name: string; colors: string[]; country: string; league: string; coach?: string } | null> = [null, null, null, null, null];
          clubTeams.forEach((team: any, idx: number) => {
            if (idx < 5) {
              clubArray[idx] = {
                id: team.id,
                name: team.name,
                colors: team.colors || ['#1E40AF', '#FFFFFF'],
                country: team.country || 'Unknown',
                league: team.league || 'Unknown',
                coach: team.coach || team.manager || 'Bilinmiyor',
              };
            }
          });
          setSelectedClubTeams(clubArray);
        }

        // Check is_pro from AsyncStorage first (for development/testing)
        // ✅ Pro kontrolü: is_pro, isPro, isPremium, plan === 'pro' veya plan === 'premium'
        const storedIsPro = userData?.is_pro === true || userData?.isPro === true || userData?.isPremium === true || userData?.plan === 'pro' || userData?.plan === 'premium';
        if (storedIsPro) {
          setIsPro(true);
          logger.debug('User is PRO (from AsyncStorage)', { is_pro: userData?.is_pro, isPro: userData?.isPro, isPremium: userData?.isPremium, plan: userData?.plan }, 'PROFILE');
        } else {
          setIsPro(false);
          logger.debug('User is NOT PRO', { is_pro: userData?.is_pro, isPro: userData?.isPro, isPremium: userData?.isPremium, plan: userData?.plan }, 'PROFILE');
        }

        // Fetch user profile from Supabase (sadece geçerli UUID varsa)
        if (!userId) {
          logger.debug('No valid UUID found, skipping Supabase fetch', undefined, 'PROFILE');
          // Use AsyncStorage data if available
          if (userData) {
            setUser({
              name: userData.name || userData.username || 'Kullanıcı',
              username: `@${userData.username || 'kullanici'}`,
              email: userData.email || 'user@example.com',
              avatar: userData.avatar || '',
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
          // Use Supabase is_pro or fallback to AsyncStorage
          setIsPro(dbUser.is_pro || storedIsPro || false);
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

        setLoading(false);
      } catch (error) {
        logger.error('Error fetching user data', { error, userId }, 'PROFILE');
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
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
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
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  // 🖼️ Galeriden Fotoğraf Seçme
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
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
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
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
      const userData = await AsyncStorage.getItem('fan-manager-user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const updatedData = {
          ...parsedData,
          avatar: photoUri,
        };
        await AsyncStorage.setItem('fan-manager-user', JSON.stringify(updatedData));
        
        // State'i güncelle
        setUser(prev => ({ ...prev, avatar: photoUri }));
        setShowAvatarPicker(false);
        
        console.log('✅ Profile photo saved:', photoUri ? 'Photo set' : 'Photo removed');
      }
    } catch (error) {
      console.error('Error saving profile photo:', error);
      Alert.alert('Hata', 'Fotoğraf kaydedilirken bir hata oluştu.');
    }
  };

  // ✅ Backend'den takım arama fonksiyonu
  const searchTeamsFromBackend = useCallback(async (query: string, type: 'club' | 'national' = 'club') => {
    if (query.length < 3) {
      setApiTeams([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await teamsApi.searchTeams(query);
      if (response.success && response.data && Array.isArray(response.data)) {
        // ✅ Takım ismine göre forma renkleri fonksiyonu
        const getTeamColors = (teamName: string): string[] => {
          const name = teamName.toLowerCase();
          if (name.includes('galatasaray') || name.includes('gs')) return ['#FFA500', '#FF0000'];
          if (name.includes('fenerbahçe') || name.includes('fenerbahce')) return ['#FFFF00', '#000080'];
          if (name.includes('beşiktaş') || name.includes('besiktas')) return ['#000000', '#FFFFFF'];
          if (name.includes('trabzonspor')) return ['#800020', '#0000FF'];
          if (name.includes('real madrid')) return ['#FFFFFF', '#FFD700'];
          if (name.includes('barcelona')) return ['#A50044', '#004D98'];
          if (name.includes('türkiye') || name.includes('turkey')) return ['#E30A17', '#FFFFFF'];
          if (name.includes('milan')) return ['#FB090B', '#000000'];
          return ['#1E40AF', '#FFFFFF'];
        };

        // API'den gelen takımları filtrele (milli takım veya kulüp)
        // Backend response formatı: { success: true, data: [{ team: {...}, league: {...} }] }
        const filteredTeams = response.data
          .filter((item: any) => {
            // API-Football response formatı: item.team veya direkt item
            const team = item.team || item;
            const isNational = team.national === true;
            return type === 'national' ? isNational : !isNational;
          })
          .map((item: any) => {
            // API-Football response formatı: item.team veya direkt item
            const team = item.team || item;
            const league = item.league || {};
            return {
              id: team.id,
              name: team.name,
              country: team.country || 'Unknown',
              colors: getTeamColors(team.name), // Forma renklerini takım isminden çıkar
              league: league.name || 'Unknown',
              type: team.national ? 'national' : 'club' as 'club' | 'national',
            };
          });
        
        setApiTeams(filteredTeams);
        console.log(`✅ Backend'den ${filteredTeams.length} ${type === 'national' ? 'milli takım' : 'kulüp'} bulundu`);
      } else {
        setApiTeams([]);
      }
    } catch (error) {
      console.error('❌ Error searching teams:', error);
      setApiTeams([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ✅ Takım seçildiğinde kaydet - Web ile senkronize (profileService kullan)
  const handleTeamSelect = useCallback(async (
    team: { id: number; name: string; colors: string[]; country: string; league: string },
    type: 'national' | 'club',
    index?: number
  ) => {
    try {
      const currentProfile = await profileService.getProfile();
      
      if (type === 'national') {
        // Milli takımı güncelle
        setSelectedNationalTeam(team);
        await profileService.updateNationalTeam(team.name);
        
        // Favorite teams'i güncelle (milli takım + kulüp takımları)
        const clubTeamNames = selectedClubTeams.filter(Boolean).map(t => t!.name);
        await profileService.updateFavoriteTeams([team.name, ...clubTeamNames]);
      } else if (type === 'club' && index !== undefined && index >= 0 && index < 5) {
        // Kulüp takımını ekle/güncelle
        const newClubTeams = [...selectedClubTeams];
        newClubTeams[index] = team;
        setSelectedClubTeams(newClubTeams);
        
        // Favorite teams'i güncelle
        const nationalTeamName = selectedNationalTeam?.name || currentProfile?.nationalTeam || '';
        const clubTeamNames = newClubTeams.filter(Boolean).map(t => t!.name);
        await profileService.updateFavoriteTeams([nationalTeamName, ...clubTeamNames].filter(Boolean));
        await profileService.updateClubTeams(clubTeamNames);
      }
      
      refetch();
      logger.info('Team selected and saved', { type, index, team: team.name }, 'PROFILE');
    } catch (error) {
      logger.error('Error saving team', { error }, 'PROFILE');
      Alert.alert('Hata', 'Takım kaydedilemedi');
    }
    
    setOpenDropdown(null);
    setSearchQuery('');
    setApiTeams([]);
  }, [selectedClubTeams, selectedNationalTeam, refetch]);

  const achievements = [
    { id: 'winner', icon: '🏆', name: 'Winner', description: '10 doğru tahmin' },
    { id: 'streak', icon: '🔥', name: 'Streak Master', description: '5 gün üst üste' },
    { id: 'expert', icon: '⭐', name: 'Expert', description: 'Level 10\'a ulaştı' },
  ];

  const rankPercentage = ((user.totalPlayers - user.countryRank) / user.totalPlayers) * 100;
  const topPercentage = ((user.countryRank / user.totalPlayers) * 100).toFixed(1);

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
      <StandardHeader
        title={t('profile.title')}
        onBack={onBack}
        rightAction={{
          icon: 'settings-outline',
          onPress: () => {
            // Ayarlar artık ProfileScreen içinde - sadece scroll yap
            // veya modal açılabilir (web'de Sheet olarak açılıyor)
            // Şimdilik scroll yap (sonra modal eklenebilir)
            Alert.alert('Ayarlar', 'Ayarlar bölümüne scroll yapın');
          },
        }}
      />

      <View style={styles.container}>
        {/* 🏆 TAB NAVIGATION */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person"
              size={20}
              color={activeTab === 'profile' ? theme.primary : theme.mutedForeground}
            />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
              {t('profile.title')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
            onPress={() => setActiveTab('badges')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trophy"
              size={20}
              color={activeTab === 'badges' ? theme.accent : theme.mutedForeground}
            />
            <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              {t('badges.title')}
            </Text>
            {badgeCount > 0 && (
              <View style={styles.badgeCountBubble}>
                <Text style={styles.badgeCountText}>{badgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'profile' ? (
          <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <Animated.View
            entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(0)}
            style={styles.profileHeaderCard}
          >
            <LinearGradient
              colors={[theme.primary + '20', 'transparent']} // 20% opacity
              style={styles.profileGradient}
            >
              {/* Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  onPress={() => setShowAvatarPicker(true)}
                  style={styles.avatarContainer}
                >
                  <View style={[styles.avatar, { borderColor: theme.primary }]}>
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={[styles.cameraButton, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={16} color={theme.primaryForeground} />
                  </View>
                </TouchableOpacity>

                {/* Name & Username */}
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>{user.username}</Text>

                {/* Plan Badge */}
                {isPro ? (
                  <LinearGradient
                    colors={[theme.accent, theme.accent + 'CC']} // Accent rengi + opacity
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proBadge}
                  >
                    <Text style={styles.crownEmoji}>👑</Text>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Free</Text>
                  </View>
                )}

                {/* Level, Points & Badges */}
                <View style={styles.levelPointsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Level</Text>
                    <Text style={styles.statValueGreen}>{user.level}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Badges</Text>
                    <Text style={styles.statValueGold}>{badgeCount}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Points</Text>
                    <Text style={styles.statValue}>{user.points.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Performance Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(100)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Performance</Text>
            </View>

            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValueGreen}>
                  {user.stats.success}%
                </Text>
                <Text style={styles.performanceLabel}>Success Rate</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>{user.stats.total}</Text>
                <Text style={styles.performanceLabel}>Total Predictions</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValueGold}>{user.stats.streak}</Text>
                <Text style={styles.performanceLabel}>Day Streak</Text>
              </View>
            </View>

            {/* Country Ranking */}
            <View style={styles.rankingCard}>
              <View style={styles.rankingHeader}>
                <View>
                  <Text style={styles.rankingSubtext}>{user.country} Sıralaması</Text>
                  {user.countryRank > 0 ? (
                    <>
                      <Text style={styles.rankingRank}>
                        #{user.countryRank.toLocaleString()}
                      </Text>
                      <View style={styles.topPercentBadge}>
                        <Text style={styles.topPercentBadgeText}>
                          {calculateTopPercent(user.countryRank, user.totalPlayers)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.rankingNoRank}>Sıralama Yok</Text>
                  )}
                </View>
                <View style={styles.rankingRight}>
                  <Text style={styles.rankingSubtext}>Toplam Oyuncu</Text>
                  <Text style={styles.rankingTotal}>
                    {user.totalPlayers.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {user.countryRank > 0 && (
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={[theme.primary, theme.primaryDark || theme.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBar, { width: `${rankPercentage}%` }]}
                  />
                </View>
              )}
              {user.countryRank > 0 ? (
                <Text style={styles.topPercentage}>
                  {user.countryRank.toLocaleString()} / {user.totalPlayers.toLocaleString()} oyuncu
                </Text>
              ) : (
                <Text style={styles.topPercentageHint}>Tahmin yaparak sıralamaya gir!</Text>
              )}
            </View>

            {/* Additional Metrics */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricBox}>
                <Ionicons name="medal" size={16} color={theme.accent} />
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>Avg Rating</Text>
                  <Text style={styles.metricValue}>{user.avgMatchRating}</Text>
                </View>
              </View>
              <View style={styles.metricBox}>
                <Ionicons name="flash" size={16} color={theme.primary} />
                <View style={styles.metricText}>
                  <Text style={styles.metricLabel}>XP This Week</Text>
                  <Text style={styles.metricValue}>+{user.xpGainThisWeek}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Favorite Teams Card - Web ile uyumlu, düzenlenebilir */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Favori Takımlar</Text>
              {!isEditing && (
                <TouchableOpacity 
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View style={styles.teamsEditContainer}>
                {/* Milli Takım Seçimi */}
                <View style={styles.teamSelectSection}>
                  <Text style={styles.teamSelectLabel}>Milli Takım *</Text>
                  <TouchableOpacity
                    style={styles.teamSelectButton}
                    onPress={() => setOpenDropdown(openDropdown === 'national' ? null : 'national')}
                  >
                    <Text style={styles.teamSelectButtonText}>
                      {selectedNationalTeam ? selectedNationalTeam.name : 'Milli takım seçin...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.mutedForeground} />
                  </TouchableOpacity>
                  
                  {openDropdown === 'national' && (
                    <View style={styles.teamDropdown}>
                      <TextInput
                        style={styles.teamSearchInput}
                        placeholder="Ara... (min 3 karakter)"
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          if (text.length >= 3) {
                            searchTeamsFromBackend(text, 'national');
                          } else {
                            setApiTeams([]);
                          }
                        }}
                        autoFocus
                      />
                      {isSearching && (
                        <ActivityIndicator size="small" color={theme.primary} style={styles.searchLoading} />
                      )}
                      <ScrollView style={styles.teamDropdownList} nestedScrollEnabled>
                        {apiTeams.map(team => (
                          <TouchableOpacity
                            key={team.id}
                            style={styles.teamDropdownItem}
                            onPress={() => {
                              setSelectedNationalTeam(team);
                              handleTeamSelect(team, 'national');
                              setOpenDropdown(null);
                              setSearchQuery('');
                            }}
                          >
                            <Text style={styles.teamDropdownItemName}>{team.name}</Text>
                            <Text style={styles.teamDropdownItemMeta}>{team.country}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Kulüp Takımları Seçimi (Sadece Pro) */}
                {isPro && (
                  <View style={styles.teamSelectSection}>
                    <Text style={styles.teamSelectLabel}>Kulüp Takımları (Maksimum 5)</Text>
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <View key={idx} style={styles.clubTeamRow}>
                        <TouchableOpacity
                          style={styles.teamSelectButton}
                          onPress={() => {
                            const key = `club${idx + 1}` as 'club1' | 'club2' | 'club3' | 'club4' | 'club5';
                            setOpenDropdown(openDropdown === key ? null : key);
                          }}
                        >
                          <Text style={styles.teamSelectButtonText}>
                            {selectedClubTeams[idx] ? selectedClubTeams[idx]!.name : 'Kulüp takımı seçin...'}
                          </Text>
                          <Ionicons name="chevron-down" size={20} color={theme.mutedForeground} />
                        </TouchableOpacity>
                        {selectedClubTeams[idx] && (
                          <TouchableOpacity
                            onPress={() => {
                              const newTeams = [...selectedClubTeams];
                              newTeams[idx] = null;
                              setSelectedClubTeams(newTeams);
                              handleTeamSelect(selectedClubTeams[idx]!, 'club', idx);
                            }}
                            style={styles.removeTeamButton}
                          >
                            <Ionicons name="close-circle" size={20} color={theme.destructive} />
                          </TouchableOpacity>
                        )}
                        
                        {openDropdown === `club${idx + 1}` && (
                          <View style={styles.teamDropdown}>
                            <TextInput
                              style={styles.teamSearchInput}
                              placeholder="Ara... (min 3 karakter)"
                              value={searchQuery}
                              onChangeText={(text) => {
                                setSearchQuery(text);
                                if (text.length >= 3) {
                                  searchTeamsFromBackend(text, 'club');
                                } else {
                                  setApiTeams([]);
                                }
                              }}
                              autoFocus
                            />
                            {isSearching && (
                              <ActivityIndicator size="small" color={theme.primary} style={styles.searchLoading} />
                            )}
                            <ScrollView style={styles.teamDropdownList} nestedScrollEnabled>
                              {apiTeams.filter(t => !selectedClubTeams.includes(t)).map(team => (
                                <TouchableOpacity
                                  key={team.id}
                                  style={styles.teamDropdownItem}
                                  onPress={() => {
                                    const newTeams = [...selectedClubTeams];
                                    newTeams[idx] = team;
                                    setSelectedClubTeams(newTeams);
                                    handleTeamSelect(team, 'club', idx);
                                    setOpenDropdown(null);
                                    setSearchQuery('');
                                  }}
                                >
                                  <Text style={styles.teamDropdownItemName}>{team.name}</Text>
                                  <Text style={styles.teamDropdownItemMeta}>{team.league || team.country}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ))}
                    <Text style={styles.teamSelectHint}>
                      {selectedClubTeams.filter(Boolean).length} / 5 kulüp takımı seçildi
                    </Text>
                  </View>
                )}

                {/* Pro değilse kulüp takımları kilitli */}
                {!isPro && (
                  <View style={styles.lockedClubTeams}>
                    <Ionicons name="lock-closed" size={32} color={theme.accent} />
                    <Text style={styles.lockedClubTeamsTitle}>Pro Üye Gerekli</Text>
                    <Text style={styles.lockedClubTeamsText}>5 kulüp takımı seçmek için Pro üye olun</Text>
                    <TouchableOpacity
                      style={styles.proUpgradeButton}
                      onPress={onProUpgrade}
                    >
                      <LinearGradient
                        colors={[theme.accent, theme.accent + 'CC']}
                        style={styles.proUpgradeButtonGradient}
                      >
                        <Ionicons name="crown" size={18} color={theme.accentForeground} />
                        <Text style={styles.proUpgradeButtonText}>Pro Üye Ol</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.teamsSelectionContainer}>
                {/* Milli takım önce, ardından kulüpler - görüntüleme modu */}
                {selectedNationalTeam && (
                <View style={styles.favoriteTeamCard}>
                  <LinearGradient
                    colors={selectedNationalTeam.colors}
                    style={styles.sideStripeLeft}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <LinearGradient
                    colors={selectedNationalTeam.colors.slice().reverse()}
                    style={styles.sideStripeRight}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <View style={styles.favoriteTeamContent}>
                    <Text style={styles.favoriteTeamName}>{selectedNationalTeam.name}</Text>
                    <Text style={styles.favoriteTeamCoach}>
                      {selectedNationalTeam.coach || 'Teknik direktör bilinmiyor'}
                    </Text>
                    <Text style={styles.favoriteTeamMeta}>
                      {selectedNationalTeam.country || 'Unknown'} • {selectedNationalTeam.league || 'Unknown'}
                    </Text>
                  </View>
                </View>
              )}

              {selectedClubTeams.filter(Boolean).map((team, idx) => (
                <View key={team?.id || idx} style={styles.favoriteTeamCard}>
                  <LinearGradient
                    colors={team!.colors}
                    style={styles.sideStripeLeft}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <LinearGradient
                    colors={team!.colors.slice().reverse()}
                    style={styles.sideStripeRight}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <View style={styles.favoriteTeamContent}>
                    <Text style={styles.favoriteTeamName}>{team!.name}</Text>
                    <Text style={styles.favoriteTeamCoach}>
                      {team!.coach || 'Teknik direktör bilinmiyor'}
                    </Text>
                    <Text style={styles.favoriteTeamMeta}>
                      {team!.country || 'Unknown'} • {team!.league || 'Unknown'}
                    </Text>
                  </View>
                </View>
              ))}

                {!selectedNationalTeam && selectedClubTeams.filter(Boolean).length === 0 && (
                  <View style={styles.emptyFavorites}>
                    <Text style={styles.emptyFavoritesText}>
                      Henüz favori takım seçilmemiş. Düzenle butonuna tıklayarak takımlarınızı seçin.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Profil Düzenleme Card - Web ile uyumlu */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(250)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
            </View>

            {isEditing ? (
              <View style={styles.profileForm}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>İsim</Text>
                  <TextInput
                    style={styles.formInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="İsim"
                    placeholderTextColor={theme.mutedForeground}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Soyisim</Text>
                  <TextInput
                    style={styles.formInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Soyisim"
                    placeholderTextColor={theme.mutedForeground}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Nickname *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="Kullanıcı adı"
                    placeholderTextColor={theme.mutedForeground}
                  />
                  <Text style={styles.formHint}>Email ile kayıt olanlar için zorunludur</Text>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.formButtonSave]}
                    onPress={async () => {
                      setSaving(true);
                      try {
                        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || nickname;
                        await profileService.updateProfile({
                          name: fullName,
                          nickname: nickname,
                        });
                        setIsEditing(false);
                        Alert.alert('Başarılı', 'Profil güncellendi');
                      } catch (error) {
                        Alert.alert('Hata', 'Profil güncellenemedi');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !nickname.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={theme.primaryForeground} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={theme.primaryForeground} />
                        <Text style={styles.formButtonText}>Kaydet</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.formButtonCancel]}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={[styles.formButtonText, { color: theme.foreground }]}>İptal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoLabel}>İsim</Text>
                  <Text style={styles.profileInfoValue}>{firstName || '-'}</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoLabel}>Soyisim</Text>
                  <Text style={styles.profileInfoValue}>{lastName || '-'}</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoLabel}>Nickname</Text>
                  <Text style={styles.profileInfoValue}>{nickname || '-'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editProfileButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                  <Text style={styles.editProfileButtonText}>Düzenle</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

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
                      <Text style={styles.bestClusterLabel}>Doğruluk Oranı</Text>
                      <Text style={styles.bestClusterValue}>{bestCluster.accuracy}%</Text>
                    </View>
                    <View style={styles.bestClusterBadge}>
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                      <Text style={styles.bestClusterBadgeText}>Uzman</Text>
                    </View>
                  </View>
                  <Text style={styles.bestClusterHint}>
                    Bu alanda çok güçlüsün! Devam et! 💪
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* Achievements Card */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star" size={20} color={theme.accent} />
              <Text style={styles.cardTitle}>Achievements</Text>
            </View>

            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Ayarlar Card - Web ile uyumlu */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(350)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Ayarlar</Text>
            </View>

            <View style={styles.settingsContainer}>
              {/* Dil seçimi - Placeholder (i18n hook ile bağlanacak) */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  // TODO: Dil seçim modalı açılacak
                  Alert.alert('Dil Seçimi', 'Dil seçim ekranı yakında eklenecek');
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="language-outline" size={20} color={theme.mutedForeground} />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Dil</Text>
                    <Text style={styles.settingItemSubtitle}>Türkçe</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
              </TouchableOpacity>

              {/* Bildirimler */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  // TODO: Bildirimler ekranı açılacak
                  Alert.alert('Bildirimler', 'Bildirim ayarları yakında eklenecek');
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="notifications-outline" size={20} color={theme.mutedForeground} />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Bildirimler</Text>
                    <Text style={styles.settingItemSubtitle}>Maç uyarıları, haberler</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Güvenlik ve Hesap Card - Web ile uyumlu */}
          <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
              <Text style={styles.cardTitle}>Güvenlik ve Hesap</Text>
            </View>

            <View style={styles.securityContainer}>
              {/* Şifre Değiştir */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  // TODO: Şifre değiştir ekranına yönlendir
                  Alert.alert('Şifre Değiştir', 'Şifre değiştirme ekranı yakında eklenecek');
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.mutedForeground} />
                  <Text style={styles.settingItemTitle}>Şifre Değiştir</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
              </TouchableOpacity>

              {/* Çıkış Yap */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  Alert.alert(
                    'Çıkış Yap',
                    'Çıkış yapmak istediğinizden emin misiniz?',
                    [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Çıkış Yap',
                        style: 'destructive',
                        onPress: async () => {
                          // TODO: Logout işlemi
                          try {
                            await AsyncStorage.clear();
                            Alert.alert('Başarılı', 'Çıkış yapıldı');
                            // Navigation reset gerekebilir
                          } catch (error) {
                            Alert.alert('Hata', 'Çıkış yapılamadı');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="log-out-outline" size={20} color={theme.destructive} />
                  <Text style={[styles.settingItemTitle, { color: theme.destructive }]}>Çıkış Yap</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
              </TouchableOpacity>

              {/* Hesabı Sil */}
              <TouchableOpacity
                style={[styles.settingItem, styles.deleteAccountItem]}
                onPress={() => {
                  Alert.alert(
                    'Hesabı Sil',
                    'Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.',
                    [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: () => {
                          // TODO: Hesap silme işlemi
                          Alert.alert('Hesap Silme', 'Hesap silme işlemi yakında eklenecek');
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name="trash-outline" size={20} color={theme.destructive} />
                  <Text style={[styles.settingItemTitle, { color: theme.destructive }]}>Hesabı Sil</Text>
                </View>
                <Ionicons name="alert-circle-outline" size={20} color={theme.destructive} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Database Test Button (Dev Only) */}
          {__DEV__ && onDatabaseTest && (
            <Animated.View entering={Platform.OS === 'web' ? FadeInDown : FadeInDown.delay(500)} style={styles.card}>
              <TouchableOpacity onPress={onDatabaseTest} style={styles.dbTestButton}>
                <Ionicons name="server" size={20} color="#059669" />
                <Text style={styles.dbTestText}>🧪 Database Test</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>
        ) : (
          /* 🏆 BADGE SHOWCASE TAB */
          <View style={styles.badgeShowcaseContainer}>
            <FlatList
              data={allBadges}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.badgeGrid}
              columnWrapperStyle={styles.badgeRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Animated.View entering={Platform.OS === 'web' ? ZoomIn : ZoomIn.delay(index * 30)}>
                  <Pressable
                    style={[
                      styles.badgeCard,
                      !item.earned && styles.badgeCardLocked,
                      { borderColor: item.earned ? getBadgeColor(item.tier) : '#475569' },
                      { backgroundColor: item.earned ? 'rgba(30, 41, 59, 0.8)' : 'rgba(30, 41, 59, 0.4)' },
                    ]}
                    onPress={() => setSelectedBadge(item)}
                    // @ts-ignore - Web için title attribute (tooltip)
                    {...(Platform.OS === 'web' && {
                      title: item.earned 
                        ? `${item.name} - Kazanıldı: ${item.earnedAt ? new Date(item.earnedAt).toLocaleDateString('tr-TR') : ''}` 
                        : `${item.name} - Nasıl Kazanılır: ${item.requirement || item.description}`,
                    })}
                  >
                    {/* Lock Icon (Top Right) - Kilitli rozetlerde */}
                    {!item.earned && (
                      <View style={styles.lockIcon}>
                        <Ionicons name="lock-closed" size={14} color="#F59E0B" />
                      </View>
                    )}

                    {/* Sparkle for earned badges (Top Right) */}
                    {item.earned && (
                      <Animated.View
                        entering={Platform.OS === 'web' ? FadeIn : FadeIn.delay(index * 30 + 200)}
                        style={styles.sparkle}
                      >
                        <Text style={styles.sparkleText}>✨</Text>
                      </Animated.View>
                    )}

                    {/* Badge Icon - Kazanılan renkli, diğerleri gri */}
                    <Text style={[
                      styles.badgeEmoji,
                      !item.earned && styles.badgeEmojiLocked,
                    ]}>
                      {item.icon}
                    </Text>

                    {/* Badge Name - Daha okunabilir */}
                    <Text
                      style={[
                        styles.badgeName,
                        !item.earned && styles.badgeNameLocked,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    {/* Badge Tier - Her zaman göster */}
                    <View
                      style={[
                        styles.badgeTierLabel,
                        { backgroundColor: `${getBadgeColor(item.tier)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeTierText,
                          { color: getBadgeColor(item.tier) },
                        ]}
                      >
                        {getBadgeTierName(item.tier)}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBadgeState}>
                  <Ionicons name="trophy-outline" size={64} color="#64748B" />
                  <Text style={styles.emptyBadgeTitle}>{t('badges.noBadges')}</Text>
                  <Text style={styles.emptyBadgeText}>
                    {t('badges.startPredicting')}
                  </Text>
                </View>
              }
            />
          </View>
        )}

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
                    <Text style={styles.badgeDetailName}>{selectedBadge.name}</Text>

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
                          {getBadgeTierName(selectedBadge.tier)}
                        </Text>
                      </View>
                    )}

                    {/* Badge Description */}
                    <Text style={styles.badgeDetailDescription}>
                      {selectedBadge.description}
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
                          ? `Kazanıldı: ${new Date(selectedBadge.earnedAt!).toLocaleDateString('tr-TR')}`
                          : `Nasıl Kazanılır: ${selectedBadge.requirement}`}
                      </Text>
                    </View>

                    {/* Progress Bar (for locked badges) */}
                    {!selectedBadge.earned && (
                      <View style={styles.badgeProgressSection}>
                        <View style={styles.badgeProgressHeader}>
                          <Text style={styles.badgeProgressLabel}>İlerleme</Text>
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
                        <Text style={styles.badgeProgressHint}>🎯 8 maç daha kazanman gerekiyor!</Text>
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
                        <Text style={styles.badgeDetailCloseText}>Kapat</Text>
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
                <Text style={styles.modalTitle}>Profil Fotoğrafı Değiştir</Text>
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
    </ScreenLayout>
  );
};

const createStyles = () => {
  const theme = COLORS.dark;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16, // ✅ Yatay padding (24 → 16, standart)
    paddingTop: 0, // ✅ Üst padding yok (tab marginBottom zaten var)
    paddingBottom: 96,
  },

  // Profile Header Card
  profileHeaderCard: {
    borderRadius: SIZES.radiusXl,
    borderWidth: 1,
    borderColor: theme.primary + '30', // 30% opacity
    marginBottom: SPACING.base, // ✅ Alt boşluk (standart: 24 → 16)
    overflow: 'hidden',
  },
  profileGradient: {
    padding: SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: SIZES.radiusFull / 2,
    borderWidth: 4,
    backgroundColor: theme.primary, // Will be overridden by inline style
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 36,
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Badges
  crownEmoji: {
    fontSize: 16,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  freeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 12,
  },
  freeBadgeText: {
    color: '#9CA3AF',
    fontWeight: '600',
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

  // Card
  card: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: SIZES.radiusXl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: TYPOGRAPHY.semibold,
    color: theme.cardForeground,
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
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    borderRadius: 12,
    maxHeight: 300,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16, // ✅ Header altı boşluk (standart)
    marginBottom: 16, // ✅ Tab altı boşluk (standart: 8 → 16)
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badgeCountBubble: {
    position: 'absolute',
    top: 6,
    right: 20,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValueGold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },

  // ⚽ MATCH CARD STYLES
  matchCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
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

  // 🏆 BADGE SHOWCASE STYLES
  badgeShowcaseContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  badgeGrid: {
    paddingHorizontal: 8,
    paddingTop: 0, // ✅ Tab marginBottom zaten 16px, ekstra padding yok
    paddingBottom: 100,
  },
  badgeRow: {
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: 80, // ✅ SABIT genişlik (kesinlikle sabit)
    height: 120, // ✅ SABIT yükseklik (kesinlikle sabit)
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    marginBottom: 8,
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    opacity: 0.7,
  },
  badgeEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
    filter: 'grayscale(100%)',
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 13,
  },
  badgeNameLocked: {
    color: '#94A3B8',
    opacity: 0.6,
  },
  badgeTierLabel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTierText: {
    fontSize: 7,
    fontWeight: '700',
  },
  lockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    padding: 3,
  },
  sparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  sparkleText: {
    fontSize: 12,
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
    backgroundColor: '#1E293B',
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
    borderColor: '#334155',
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
    backgroundColor: '#1E293B',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: TYPOGRAPHY.medium,
    color: theme.foreground,
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
    ...TYPOGRAPHY.bodySmall,
    color: theme.mutedForeground,
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
});
};

const styles = createStyles();
