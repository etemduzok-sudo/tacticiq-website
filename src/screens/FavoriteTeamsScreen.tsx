import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import SafeIcon from '../components/SafeIcon';
import { BRAND, TYPOGRAPHY, SPACING, DARK_MODE } from '../theme/theme';
import { Button } from '../components/atoms';
import { getUserLimits, canAddTeam, isNationalTeam } from '../constants/userLimits';
import { teamsApi } from '../services/api';
import api from '../services/api';
import { StandardHeader, ScreenLayout } from '../components/layouts';
import { logger } from '../utils/logger';
import { Ionicons } from '@expo/vector-icons';
import {
  WEBSITE_BRAND_COLORS,
  WEBSITE_DARK_COLORS,
  WEBSITE_BORDER_RADIUS,
  WEBSITE_SPACING as WDS_SPACING,
  WEBSITE_ICON_SIZES,
  WEBSITE_TYPOGRAPHY as WDS_TYPOGRAPHY,
} from '../config/WebsiteDesignSystem';

interface FavoriteTeamsScreenProps {
  onComplete: (selectedTeams: Array<{ id: number; name: string; colors: string[]; league?: string; country?: string; type?: 'club' | 'national' }>) => void;
  onBack?: () => void;
}

interface Team {
  id: string;
  name: string;
  league: string;
  country: string;
  colors: string[]; // Sol kenardaki renkli şerit için
  type: 'club' | 'national';
  apiId?: number; // API-Football ID
}

const TEAMS: Team[] = [
  // Kulüpler
  {
    id: '1',
    name: 'Galatasaray',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#FFA500', '#FF0000'], // Sarı-Kırmızı
    type: 'club',
    apiId: 645, // API-Football ID
  },
  {
    id: '2',
    name: 'Fenerbahçe',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#FFFF00', '#000080'], // Sarı-Lacivert
    type: 'club',
    apiId: 611, // API-Football ID (FIXED: was 548 = Real Sociedad)
  },
  {
    id: '3',
    name: 'Beşiktaş',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#000000', '#FFFFFF'], // Siyah-Beyaz
    type: 'club',
    apiId: 644, // API-Football ID
  },
  {
    id: '4',
    name: 'Trabzonspor',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#800020', '#0000FF'], // Bordo-Mavi
    type: 'club',
    apiId: 643, // API-Football ID
  },
  {
    id: '5',
    name: 'Real Madrid',
    league: 'La Liga',
    country: 'İspanya',
    colors: ['#FFFFFF', '#FFD700'], // Beyaz-Altın
    type: 'club',
  },
  {
    id: '6',
    name: 'Barcelona',
    league: 'La Liga',
    country: 'İspanya',
    colors: ['#A50044', '#004D98'], // Kırmızı-Mavi
    type: 'club',
  },
  {
    id: '7',
    name: 'AC Milan',
    league: 'Serie A',
    country: 'İtalya',
    colors: ['#FF0000', '#000000'], // Kırmızı-Siyah
    type: 'club',
  },
  // Milli Takımlar
  {
    id: '101',
    name: 'Türkiye',
    league: 'UEFA',
    country: 'Milli Takım',
    colors: ['#E30A17', '#FFFFFF'], // Kırmızı-Beyaz
    type: 'national',
    apiId: 777, // API-Football National Team ID (Turkey Men's) - FIXED: Found correct men's team ID
  },
  {
    id: '102',
    name: 'Almanya',
    league: 'UEFA',
    country: 'Milli Takım',
    colors: ['#000000', '#DD0000', '#FFCE00'], // Siyah-Kırmızı-Altın
    type: 'national',
    apiId: 25, // API-Football National Team ID (Germany) - FIXED: Using API search result
  },
  {
    id: '103',
    name: 'Brezilya',
    league: 'CONMEBOL',
    country: 'Milli Takım',
    colors: ['#009C3B', '#FFDF00'], // Yeşil-Sarı
    type: 'national',
    apiId: 6, // API-Football National Team ID (Brazil) - FIXED: Using API search result
  },
  {
    id: '104',
    name: 'Arjantin',
    league: 'CONMEBOL',
    country: 'Milli Takım',
    colors: ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
    type: 'national',
    apiId: 26, // API-Football National Team ID (Argentina) - FIXED: Using API search result
  },
];

type TeamOption = {
  id: number;
  name: string;
  country: string;
  league: string;
  colors: string[];
  type: 'club' | 'national';
};

export default function FavoriteTeamsScreen({ onComplete, onBack }: FavoriteTeamsScreenProps) {
  const [selectedClubTeams, setSelectedClubTeams] = useState<Array<TeamOption | null>>([null, null, null, null, null]); // Pro için 5 slot
  const [selectedNationalTeam, setSelectedNationalTeam] = useState<TeamOption | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<'national' | 'club1' | 'club2' | 'club3' | 'club4' | 'club5' | 'clubs-list' | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<'club' | 'national' | 'all'>('all'); // 'all' = hem milli hem kulüp
  
  // ✅ Backend'den çekilen takımlar (API-Football'a direkt bağlanmıyor!)
  const [apiTeams, setApiTeams] = useState<Array<{
    id: number;
    name: string;
    country: string;
    type: 'club' | 'national';
    league?: string;
    colors?: string[]; // Forma renkleri (logo yerine kullanılacak)
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Plan ve dil bilgisini yükle
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // ✅ ÖNCE favori takımları yükle (AsyncStorage'dan) - profil ekranından gelen seçimler
      const favoriteTeamsStr = await AsyncStorage.getItem('fan-manager-favorite-clubs');
      if (favoriteTeamsStr) {
        try {
          const favoriteTeams = JSON.parse(favoriteTeamsStr);
          logger.debug('Loaded from storage', { favoriteTeams }, 'FAVORITE_TEAMS');
          
          // Milli takım ve kulüp takımlarını ayır
          const nationalTeam = favoriteTeams.find((t: any) => t.type === 'national');
          const clubTeams = favoriteTeams.filter((t: any) => t.type === 'club').slice(0, 5);
          
          if (nationalTeam) {
            setSelectedNationalTeam({
              id: nationalTeam.id,
              name: nationalTeam.name,
              country: nationalTeam.country || 'Unknown',
              league: nationalTeam.league || 'Unknown',
              colors: nationalTeam.colors || ['#1E40AF', '#FFFFFF'],
              type: 'national',
            });
            logger.debug('Loaded national team', { name: nationalTeam.name }, 'FAVORITE_TEAMS');
          }
          
          // Kulüp takımlarını sırayla yerleştir
          const clubArray: Array<TeamOption | null> = [null, null, null, null, null];
          clubTeams.forEach((team: any, idx: number) => {
            if (idx < 5) {
              clubArray[idx] = {
                id: team.id,
                name: team.name,
                country: team.country || 'Unknown',
                league: team.league || 'Unknown',
                colors: team.colors || ['#1E40AF', '#FFFFFF'],
                type: 'club',
              };
              logger.debug(`Loaded club team ${idx + 1}`, { name: team.name, index: idx + 1 }, 'FAVORITE_TEAMS');
            }
          });
          setSelectedClubTeams(clubArray);
        } catch (parseError) {
          logger.error('Error parsing favorite teams', { error: parseError }, 'FAVORITE_TEAMS');
        }
      }

      // Dil seçimini yükle
      const lang = await AsyncStorage.getItem('fan-manager-language');
      if (lang) {
        setSelectedLanguage(lang);
      }

      // Plan bilgisini yükle (Free/Pro)
      const userData = await AsyncStorage.getItem('fan-manager-user');
      if (userData) {
        const parsed = JSON.parse(userData);
        // ✅ Pro kontrolü: is_pro, isPro, isPremium, plan === 'pro' veya plan === 'premium'
        const isPremiumUser = parsed.is_pro === true || parsed.isPro === true || parsed.isPremium === true || parsed.plan === 'pro' || parsed.plan === 'premium';
        setIsPremium(isPremiumUser);
        logger.debug('User Pro status', { isPremiumUser, is_pro: parsed.is_pro, isPro: parsed.isPro, isPremium: parsed.isPremium, plan: parsed.plan }, 'FAVORITE_TEAMS');
      }
    } catch (error) {
      logger.error('Kullanıcı verisi yüklenemedi', { error }, 'FAVORITE_TEAMS');
    }
  };


  // Dil seçimine göre takımları önceliklendir
  const sortTeamsByLanguage = (teams: Team[]) => {
    const priorityCountry: Record<string, string> = {
      'tr': 'Türkiye',
      'en': 'İngiltere',
      'es': 'İspanya',
      'de': 'Almanya',
      'fr': 'Fransa',
      'it': 'İtalya',
    };

    const priority = priorityCountry[selectedLanguage] || 'Türkiye';

    return [...teams].sort((a, b) => {
      // Önce seçili dil ülkesi
      if (a.country === priority && b.country !== priority) return -1;
      if (a.country !== priority && b.country === priority) return 1;
      // Sonra alfabetik
      return a.name.localeCompare(b.name, 'tr');
    });
  };

  const clubTeams = sortTeamsByLanguage(TEAMS.filter((t) => t.type === 'club'));
  const nationalTeams = sortTeamsByLanguage(TEAMS.filter((t) => t.type === 'national'));

  const handleContinue = () => {
    const maxClubs = isPremium ? 5 : 0;
    const selectedClubs = selectedClubTeams.filter(Boolean) as TeamOption[];

    // ✅ Free: sadece milli takım seçilebilir (opsiyonel)
    // ✅ Pro: milli takım (opsiyonel) + en fazla 5 kulüp
    if (!isPremium && selectedClubs.length > 0) {
      Alert.alert('Kulüp Seçimi Kilitli', 'Free kullanıcılar kulüp takımı seçemez.');
        return;
      }

    // ✅ Pro: en fazla 5 kulüp
    if (isPremium && selectedClubs.length > maxClubs) {
      Alert.alert('Maksimum Limit', `En fazla ${maxClubs} kulüp seçebilirsiniz.`);
      return;
    }

    // ✅ En az bir takım seçilmeli
    if (!selectedNationalTeam && selectedClubs.length === 0) {
      Alert.alert('Takım Seçimi Gerekli', 'Lütfen en az bir takım seçin.');
      return;
    }

    const payload = [
      selectedNationalTeam,
      ...selectedClubs,
    ].filter(Boolean).map(team => ({
      id: team.id,
        name: team.name,
      colors: team.colors || ['#1E40AF', '#FFFFFF'],
        league: team.league,
      country: team.country,
      type: team.type,
    }));

    if (payload.length === 0) {
      Alert.alert('Hata', 'Hiç takım seçilmedi.');
      return;
    }

    onComplete(payload);
  };

  // ✅ Backend'den takım arama (API-Football'a direkt bağlanmıyor!)
  const searchTeamsFromBackend = useCallback(async (query: string, type: 'club' | 'national') => {
    if (query.length < 3) {
      setApiTeams([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // ✅ Backend'den çek (backend API-Football'a bağlanır)
      const response = await teamsApi.searchTeams(query);
      
      if (response.success && response.data) {
        // ✅ Filtreleme: Gereksiz verileri kaldır
        const filterUnwantedData = (item: any) => {
          const team = item.team || item;
          const league = item.league || {};
          const leagueName = (league.name || '').toLowerCase();
          const teamName = (team.name || '').toLowerCase();
          
          // ❌ U18, U21, U23, Youth, Gençlik takımlarını filtrele
          if (teamName.includes('u18') || teamName.includes('u21') || teamName.includes('u23') || 
              teamName.includes('youth') || teamName.includes('gençlik') || teamName.includes('under')) {
            return false;
          }
          
          // ❌ Kadın takımlarını filtrele
          if (teamName.includes('women') || teamName.includes('kadın') || teamName.includes('female')) {
            return false;
          }
          
          // ✅ Milli takımlar için: Sadece A milli erkek futbol takımları
          if (team.national) {
            // Milli takım isimleri genelde ülke isimleriyle aynıdır (Türkiye, Germany, Brazil vs)
            // U18, U21 gibi ekler yoksa A milli takımıdır
            return true;
          }
          
          // ✅ Kulüpler için: Sadece en üst klasman ligler ve kupalar
          // En üst klasman ligler
          const topLeagues = [
            'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
            'süper lig', 'super lig', 'superliga', 'eredivisie', 'primeira liga',
            'scottish premiership', 'belgian pro league', 'austrian bundesliga',
            'swiss super league', 'russian premier league', 'turkish super lig'
          ];
          
          // UEFA ve FIFA kupaları
          const uefaFifaCompetitions = [
            'uefa', 'champions league', 'europa league', 'europa conference',
            'fifa', 'world cup', 'euro', 'copa america', 'africa cup',
            'asian cup', 'concacaf', 'gold cup'
          ];
          
          // Yerel kupalar
          const localCups = [
            'cup', 'kupa', 'copa', 'coupe', 'pokal', 'coppa', 'fa cup',
            'türkiye kupası', 'türkiye kupa', 'tff kupa'
          ];
          
          const isTopLeague = topLeagues.some(league => leagueName.includes(league));
          const isUefaFifa = uefaFifaCompetitions.some(comp => leagueName.includes(comp));
          const isLocalCup = localCups.some(cup => leagueName.includes(cup));
          
          return isTopLeague || isUefaFifa || isLocalCup;
        };
        
        // API response formatını dönüştür ve filtrele
        const transformedTeams = response.data
          .filter(filterUnwantedData) // ✅ Önce gereksiz verileri filtrele
          .map((item: any) => {
            const team = item.team || item;
            const league = item.league || {};
            return {
              id: team.id,
              name: team.name,
              country: team.country || 'Unknown',
              league: league.name || 'Unknown',
              type: team.national ? 'national' : 'club' as 'club' | 'national',
              colors: getTeamColorsFromName(team.name), // Logo yerine forma renkleri
            };
          })
          .filter((t: any) => t.type === type); // Yalnızca ilgili tip
        
        setApiTeams(transformedTeams);
        console.log(`✅ Backend'den ${transformedTeams.length} ${type === 'national' ? 'milli takım' : 'kulüp'} bulundu`);
      } else {
        setApiTeams([]);
        setSearchError('Takım bulunamadı');
      }
    } catch (error: any) {
      logger.error('Backend takım arama hatası', { error, query, type }, 'FAVORITE_TEAMS');
      // Network hatası kontrolü
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        setSearchError('Backend bağlantısı kurulamadı. Lütfen backend sunucusunun çalıştığından emin olun.');
      } else {
        setSearchError(error.message || 'Arama başarısız');
      }
      setApiTeams([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Arama sorgusu değiştiğinde backend'den ara
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchTeamsFromBackend(searchQuery, searchType);
      } else {
        setApiTeams([]);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchTeamsFromBackend, searchType]);

  // Takım ismine göre forma renkleri (logo yerine kullanılacak)
  const getTeamColorsFromName = (teamName: string): string[] => {
    const name = teamName.toLowerCase();
    // Bilinen takımların forma renkleri
    if (name.includes('galatasaray') || name.includes('gs')) return ['#FFA500', '#FF0000'];
    if (name.includes('fenerbahçe') || name.includes('fenerbahce')) return ['#FFFF00', '#000080'];
    if (name.includes('beşiktaş') || name.includes('besiktas')) return ['#000000', '#FFFFFF'];
    if (name.includes('trabzonspor')) return ['#800020', '#0000FF'];
    if (name.includes('real madrid')) return ['#FFFFFF', '#FFD700'];
    if (name.includes('barcelona')) return ['#A50044', '#004D98'];
    if (name.includes('türkiye') || name.includes('turkey')) return ['#E30A17', '#FFFFFF'];
    if (name.includes('paris') && name.includes('saint') && name.includes('germain')) return ['#004170', '#ED1C24'];
    if (name.includes('paris fc')) return ['#0066CC', '#FFFFFF'];
    if (name.includes('manchester') && name.includes('united')) return ['#DA020E', '#000000'];
    if (name.includes('liverpool')) return ['#C8102E', '#00B2A9'];
    if (name.includes('chelsea')) return ['#034694', '#FFFFFF'];
    if (name.includes('arsenal')) return ['#EF0107', '#FFFFFF'];
    if (name.includes('juventus')) return ['#000000', '#FFFFFF'];
    if (name.includes('bayern') || name.includes('munich')) return ['#DC052D', '#0066B2'];
    if (name.includes('psg')) return ['#004170', '#ED1C24'];
    if (name.includes('almanya') || name.includes('germany')) return ['#000000', '#DD0000'];
    if (name.includes('brezilya') || name.includes('brazil')) return ['#009C3B', '#FFDF00'];
    if (name.includes('arjantin') || name.includes('argentina')) return ['#74ACDF', '#FFFFFF'];
    if (name.includes('fransa') || name.includes('france')) return ['#002654', '#FFFFFF'];
    if (name.includes('italya') || name.includes('italy')) return ['#009246', '#FFFFFF'];
    if (name.includes('ispanya') || name.includes('spain')) return ['#AA151B', '#F1BF00'];
    if (name.includes('portekiz') || name.includes('portugal')) return ['#006600', '#FF0000'];
    // Varsayılan renkler
    return ['#1E40AF', '#FFFFFF'];
  };

  const getDropdownOptions = (type: 'club' | 'national') => {
    const baseTeams = type === 'club' ? clubTeams : nationalTeams;

    // ✅ En az 3 karakter yazılmadan hiçbir takım gösterilmez
    if (searchQuery.length < 3) return [];

    // ✅ Kulüp takımları seçilirken milli takımlar görünmemeli
    // Eğer arama yapılıyorsa ve backend sonuçları varsa önce onları göster
    const backendResults = apiTeams
      .filter(t => {
        // ✅ Kulüp takımları seçilirken sadece kulüp takımları göster
        if (type === 'club') {
          return t.type === 'club';
        }
        // ✅ Milli takım seçilirken sadece milli takımlar göster
        return t.type === 'national';
      })
      .map((apiTeam) => ({
        id: apiTeam.id.toString(),
        name: apiTeam.name,
        league: apiTeam.league || 'Unknown',
        country: apiTeam.country,
        colors: apiTeam.colors || getTeamColorsFromName(apiTeam.name),
        type: apiTeam.type,
        apiId: apiTeam.id,
      }));

    if (backendResults.length > 0) return backendResults;

    const query = searchQuery.toLowerCase().trim();
    // ✅ Kulüp takımları seçilirken milli takımlar filtrelenir
    const filteredBaseTeams = baseTeams.filter(team => {
      // ✅ Kulüp takımları seçilirken sadece kulüp takımları göster
      if (type === 'club') {
        return team.type === 'club';
      }
      // ✅ Milli takım seçilirken sadece milli takımlar göster
      return team.type === 'national';
    });
    
    const scoredTeams = filteredBaseTeams
      .map((team) => {
        const teamName = team.name.toLowerCase();
        let score = 0;
        if (teamName.startsWith(query)) score = 100;
        else if (teamName.split(' ').some(word => word.startsWith(query))) score = 50;
        else if (teamName.includes(query)) score = 10;
        return { team, score };
      })
      .filter(({ score }) => score > 0);
    
    scoredTeams.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.team.name.localeCompare(b.team.name, 'tr');
    });
    
    return scoredTeams.map(({ team }) => team);
  };

  const handleSelectTeam = (team: any, type: 'club' | 'national', index?: number) => {
    const mapped: TeamOption = {
      id: team.apiId || parseInt(team.id, 10),
      name: team.name,
      country: team.country || 'Unknown',
      league: team.league || 'Unknown',
      colors: team.colors || getTeamColorsFromName(team.name),
      type,
    };

    if (type === 'national') {
      // ✅ Eğer aynı takım seçiliyse, seçimi kaldır (sil)
      if (selectedNationalTeam?.id === mapped.id) {
        setSelectedNationalTeam(null);
        logger.debug('Removed national team', { name: mapped.name }, 'FAVORITE_TEAMS');
    } else {
        setSelectedNationalTeam(mapped);
        console.log('✅ [FAVORITE TEAMS] Selected national team:', mapped.name);
      }
    } else if (type === 'club' && typeof index === 'number') {
      if (!isPremium) {
        Alert.alert('🔒 PRO Özellik', 'Kulüp takımı seçmek için PRO üyelik gereklidir.');
        return;
      }
      const next = [...selectedClubTeams];
      // ✅ Eğer aynı takım seçiliyse, seçimi kaldır (sil)
      if (next[index]?.id === mapped.id) {
        next[index] = null;
        console.log('✅ [FAVORITE TEAMS] Removed club team:', mapped.name);
      } else {
        next[index] = mapped;
        console.log('✅ [FAVORITE TEAMS] Selected club team:', mapped.name);
      }
      setSelectedClubTeams(next);
    }

    setOpenDropdown(null);
    setSearchQuery('');
    setApiTeams([]);
  };

  const clubCount = selectedClubTeams.filter(Boolean).length;
  const nationalCount = selectedNationalTeam ? 1 : 0;
  const maxClubs = isPremium ? 5 : 0;

  const renderSelectionButton = (
    label: string,
    selected: TeamOption | null,
    type: 'club' | 'national',
    index?: number,
    locked?: boolean,
  ) => {
    const isOpen =
      (type === 'national' && openDropdown === 'national') ||
      (type === 'club' && openDropdown === `club${(index ?? 0) + 1}` as any);

  return (
      <View style={{ marginBottom: SPACING.md }}>
          <TouchableOpacity 
          style={[
            styles.selectButton,
            selected && styles.selectButtonSelected,
            locked && styles.selectButtonLocked,
            isOpen && styles.selectButtonOpen,
          ]}
          activeOpacity={0.8}
          onPress={() => {
            if (locked) return;
            const key = type === 'national' ? 'national' : (`club${(index ?? 0) + 1}` as any);
            const wasOpen = isOpen;
            setOpenDropdown(wasOpen ? null : key);
            setSearchType(type);
            setSearchQuery('');
            setApiTeams([]);
            // ✅ Dropdown açıldığında TextInput'a focus yap
            if (!wasOpen) {
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 100);
            }
          }}
          disabled={locked}
        >
          {/* ✅ Sol kenar gradient şerit - butonun soluna yapışık */}
          {selected && selected.colors.length > 0 && (
            <LinearGradient
              colors={selected.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectColorStripeLeft}
            />
          )}
          
          {/* ✅ Sağ kenar gradient şerit - butonun sağına yapışık */}
          {selected && selected.colors.length > 0 && (
            <LinearGradient
              colors={[...selected.colors].reverse()}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.selectColorStripeRight}
            />
          )}

          <View style={styles.selectButtonContent}>
            {selected ? (
              <>
                {/* ✅ Takım ismi ortalanmış */}
                <Text style={styles.selectTeamName} numberOfLines={1}>
                  {selected.name}
              </Text>
                {/* ✅ Teknik direktör - küçük, yatık */}
                {(() => {
                  const getCoachName = (teamName: string): string => {
                    const name = teamName.toLowerCase();
                    const coaches: Record<string, string> = {
                      'galatasaray': 'Okan Buruk',
                      'fenerbahçe': 'İsmail Kartal',
                      'fenerbahce': 'İsmail Kartal',
                      'beşiktaş': 'Fernando Santos',
                      'besiktas': 'Fernando Santos',
                      'trabzonspor': 'Abdullah Avcı',
                      'real madrid': 'Carlo Ancelotti',
                      'barcelona': 'Xavi Hernández',
                      'türkiye': 'Vincenzo Montella',
                      'turkey': 'Vincenzo Montella',
                      'almanya': 'Julian Nagelsmann',
                      'germany': 'Julian Nagelsmann',
                      'brezilya': 'Dorival Júnior',
                      'brazil': 'Dorival Júnior',
                      'arjantin': 'Lionel Scaloni',
                      'argentina': 'Lionel Scaloni',
                      'fransa': 'Didier Deschamps',
                      'france': 'Didier Deschamps',
                      'italya': 'Luciano Spalletti',
                      'italy': 'Luciano Spalletti',
                      'ispanya': 'Luis de la Fuente',
                      'spain': 'Luis de la Fuente',
                      'portekiz': 'Roberto Martínez',
                      'portugal': 'Roberto Martínez',
                      'paris saint germain': 'Luis Enrique',
                      'psg': 'Luis Enrique',
                      'manchester united': 'Erik ten Hag',
                      'liverpool': 'Jürgen Klopp',
                      'chelsea': 'Mauricio Pochettino',
                      'arsenal': 'Mikel Arteta',
                      'juventus': 'Massimiliano Allegri',
                      'bayern': 'Thomas Tuchel',
                      'bayern munich': 'Thomas Tuchel',
                    };
                    for (const [key, coach] of Object.entries(coaches)) {
                      if (name.includes(key)) return coach;
                    }
                    return 'Bilinmiyor';
                  };
                  const coachName = getCoachName(selected.name);
                  return (
                    <Text style={styles.selectCoachItalic} numberOfLines={1}>
                      {coachName}
              </Text>
                  );
                })()}
                {/* ✅ Turnuvalar - tek satır, küçük */}
                <Text style={styles.selectTournaments} numberOfLines={1}>
                  {selected.league || 'Bilinmiyor'} • {selected.country || 'Unknown'}
              </Text>
              </>
            ) : (
              <Text style={styles.selectPlaceholder}>
                {locked ? '🔒 PRO gereklidir' : 'Seçim yapın'}
              </Text>
            )}
        </View>

            {/* ✅ Çarpı işareti - sağ üstte (güzelleştirilmiş) */}
            {selected && !locked && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation(); // Dropdown açılmasını engelle
                  if (type === 'national') {
                    setSelectedNationalTeam(null);
                  } else if (index !== undefined) {
                    const newClubs = [...selectedClubTeams];
                    newClubs[index] = null;
                    setSelectedClubTeams(newClubs);
                  }
                }}
                activeOpacity={0.5}
              >
                <SafeIcon name="close-circle" size={20} color="rgba(239, 68, 68, 0.8)" />
              </TouchableOpacity>
            )}
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownContainer}>
          <View style={styles.dropdown}>
        <View style={styles.searchContainer}>
              <SafeIcon name="search" size={18} color={DARK_MODE.mutedForeground} />
          <TextInput
                ref={searchInputRef}
            style={styles.searchInput}
                placeholder="En az 3 karakter yazın (Backend'den aranır)..."
            placeholderTextColor={DARK_MODE.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
                autoFocus={true}
          />
              {isSearching && <ActivityIndicator size="small" color={BRAND.emerald} style={{ marginLeft: 8 }} />}
        </View>
            {searchError && (
              <Text style={[styles.errorText, { marginHorizontal: SPACING.sm }]}>⚠️ {searchError}</Text>
            )}

            {/* ✅ En az 3 karakter yazılmadan takım gösterilmez */}
            {searchQuery.length < 3 && (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchText}>
                  🔍 En az 3 karakter yazarak takım arayın
                </Text>
          </View>
            )}

            {searchQuery.length >= 3 && getDropdownOptions(type).length === 0 && !isSearching && (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchText}>
                  ❌ Aradığınız kriterlere uygun takım bulunamadı
                </Text>
              </View>
            )}

            {getDropdownOptions(type).map((team, optionIdx) => {
              // ✅ Teknik direktör bilgisi (mock - gerçek API'den gelecek)
              const getCoachName = (teamName: string): string => {
                const name = teamName.toLowerCase();
                const coaches: Record<string, string> = {
                  'galatasaray': 'Okan Buruk',
                  'fenerbahçe': 'İsmail Kartal',
                  'fenerbahce': 'İsmail Kartal',
                  'beşiktaş': 'Fernando Santos',
                  'besiktas': 'Fernando Santos',
                  'trabzonspor': 'Abdullah Avcı',
                  'real madrid': 'Carlo Ancelotti',
                  'barcelona': 'Xavi Hernández',
                  'türkiye': 'Vincenzo Montella',
                  'turkey': 'Vincenzo Montella',
                };
                for (const [key, coach] of Object.entries(coaches)) {
                  if (name.includes(key)) return coach;
                }
                return 'Bilinmiyor';
              };

              const coachName = getCoachName(team.name);
              const tournamentInfo = team.league || 'Bilinmiyor';

            return (
              <TouchableOpacity
                  key={team.id.toString() + optionIdx}
                  style={styles.dropdownItem}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTeam(team, type, index)}
                >
                  {/* ✅ Sol kenar gradient şerit */}
                  {team.colors && team.colors.length > 0 && (
                    <LinearGradient
                      colors={team.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.dropdownStripeLeft}
                    />
                  )}

                  {/* ✅ Sağ kenar gradient şerit */}
                  {team.colors && team.colors.length > 0 && (
                    <LinearGradient
                      colors={[...team.colors].reverse()}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.dropdownStripeRight}
                    />
                  )}

                  <View style={styles.dropdownContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName}>{team.name}</Text>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => {
                          // ✅ Teknik direktör bilgisi tıklanabilir (gelecekte detay sayfasına gidebilir)
                          Alert.alert('Teknik Direktör', `${team.name} - ${coachName}`, [{ text: 'Tamam' }]);
                        }}
                      >
                        <Text style={styles.dropdownCoach}>
                          👤 {coachName}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={() => {
                          // ✅ Turnuva bilgisi tıklanabilir (gelecekte lig detayına gidebilir)
                          Alert.alert('Turnuva Bilgisi', `${team.name} - ${tournamentInfo}`, [{ text: 'Tamam' }]);
                        }}
                      >
                        <Text style={styles.dropdownTournament}>
                          🏆 {tournamentInfo} • {team.country}
                        </Text>
                      </TouchableOpacity>
                  </View>
                    {(() => {
                      const isSelected = (type === 'national' && selectedNationalTeam?.id === team.id) ||
                        (type === 'club' && index !== undefined && selectedClubTeams[index]?.id === team.id);
                      return isSelected ? (
                        <Ionicons name="checkmark-circle" size={24} color={WEBSITE_BRAND_COLORS.secondary} />
                      ) : (
                        <Ionicons name="add-circle-outline" size={24} color={BRAND.emerald} />
                      );
                    })()}
                  </View>
              </TouchableOpacity>
            );
          })}
        </View>
        </View>
        )}
          </View>
    );
  };

            return (
    <ScreenLayout safeArea>
      {/* Watermark Background - Futbol Topları */}
      <View style={styles.watermarkContainer}>
        <Text style={[styles.ballWatermark, styles.ball1]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball2]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball3]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball4]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball5]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball6]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball7]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball8]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball9]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball10]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball11]}>⚽</Text>
        <Text style={[styles.ballWatermark, styles.ball12]}>⚽</Text>
      </View>

      {/* Back Button - Sol üst köşe */}
      {onBack && (
        <TouchableOpacity style={styles.backButtonTop} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={WEBSITE_ICON_SIZES.lg} color={WEBSITE_BRAND_COLORS.white} />
        </TouchableOpacity>
      )}
      
      <View style={styles.mainContainer}>
      <View style={styles.container}>
        {/* Plan Info Card - Kompakt */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderCompact}>
            <View style={styles.planHeaderLeftCompact}>
              <SafeIcon 
                name={isPremium ? 'star' : 'star-outline'} 
                size={16} 
                color={isPremium ? BRAND.gold : DARK_MODE.mutedForeground} 
              />
              <Text style={styles.planTitleCompact}>
                {isPremium ? 'Pro Plan' : 'Free Plan'}
              </Text>
              {isPremium && (
                <View style={styles.proBadgeCompact}>
                  <Text style={styles.proBadgeTextCompact}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.planDescriptionCompact}>
              {isPremium 
                ? '1 milli takım + 5 kulüp'
                : 'Sadece 1 milli takım'}
            </Text>
                </View>

          {/* Status Indicators - Kompakt */}
          <View style={styles.statusContainerCompact}>
            <View style={styles.statusItemCompact}>
              <SafeIcon name="flag" size={12} color={nationalCount > 0 ? BRAND.emerald : DARK_MODE.mutedForeground} />
              <View style={styles.statusProgressCompact}>
                <View style={[styles.progressBarCompact, { width: `${(nationalCount / 1) * 100}%` }]} />
              </View>
              <Text style={[styles.statusCountCompact, nationalCount > 0 && styles.statusCountActive]}>
                {nationalCount}/1
                  </Text>
                </View>

            <View style={styles.statusItemCompact}>
              <SafeIcon name="trophy" size={12} color={clubCount > 0 ? BRAND.emerald : DARK_MODE.mutedForeground} />
              <View style={styles.statusProgressCompact}>
                <View style={[styles.progressBarCompact, { width: `${(clubCount / maxClubs) * 100}%` }]} />
                  </View>
              <Text style={[styles.statusCountCompact, clubCount > 0 && styles.statusCountActive]}>
                {clubCount}/{maxClubs}
              </Text>
            </View>
          </View>
        </View>
      </View>

        {/* ✅ Milli takım dropdown - Sadece milli takım dropdown açıkken veya hiçbiri açık değilken görünür */}
        {(!openDropdown || openDropdown === 'national') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milli Takım</Text>
            {renderSelectionButton('1 Milli Takım Seçin', selectedNationalTeam, 'national')}
          </View>
        )}

        {/* ✅ Kulüp dropdownları - Sadece kulüp dropdown açıkken veya hiçbiri açık değilken görünür */}
        {(!openDropdown || openDropdown?.startsWith('club')) && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => {
                // ✅ Kulüpler başlığına tıklayınca seçili takımların listesini göster/gizle
                if (openDropdown === 'clubs-list') {
                  setOpenDropdown(null);
                } else {
                  setOpenDropdown('clubs-list');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>Kulüpler</Text>
              <Text style={styles.sectionCount}>{clubCount}/{maxClubs} seçili</Text>
            </TouchableOpacity>
            
            {/* ✅ Seçili takımların listesi - Kulüpler başlığına tıklayınca görünür */}
            {openDropdown === 'clubs-list' && (
              <View style={styles.selectedTeamsList}>
                {selectedClubTeams.filter(Boolean).length > 0 ? (
                  selectedClubTeams.filter(Boolean).map((team, index) => (
                    <View key={index} style={styles.selectedTeamItem}>
                      <Text style={styles.selectedTeamName}>{team.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noTeamsText}>Henüz takım seçilmedi</Text>
                )}
              </View>
            )}
            
            {/* ✅ 5 tane takım seçmek için alanlar */}
            {[0,1,2,3,4].map((i) =>
              renderSelectionButton(
                `${i + 1}. Favori Kulüp`,
                selectedClubTeams[i],
                'club',
                i,
                !isPremium
              )
            )}
          </View>
        )}

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <Button
          title="Kaydet & Devam Et"
          onPress={handleContinue}
          variant="solid"
          fullWidth
          disabled={!selectedNationalTeam && selectedClubTeams.filter(Boolean).length === 0}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />

        {/* Progress Indicator - 5 noktalı (Language, Age, Legal, Auth/Register, FavoriteTeams) */}
        <View style={styles.progressRow}>
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
      </View>
      </View>
          </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Watermark Background
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        pointerEvents: 'none',
      },
    }),
  },
  ballWatermark: {
    position: 'absolute',
    opacity: 0.06, // Çok silik
    color: 'rgba(31, 162, 166, 1)', // Turkuaz renk
    // X eksenine paralel, rotasyon yok
  },
  ball1: {
    top: 60,
    left: '10%',
    fontSize: 45,
  },
  ball2: {
    top: 60,
    left: '50%',
    fontSize: 68,
  },
  ball3: {
    top: 60,
    left: '85%',
    fontSize: 52,
  },
  ball4: {
    top: 180,
    left: -20,
    fontSize: 58,
  },
  ball5: {
    top: 180,
    left: '35%',
    fontSize: 74,
  },
  ball6: {
    top: 280,
    left: '20%',
    fontSize: 61,
  },
  ball7: {
    top: 280,
    left: '65%',
    fontSize: 48,
  },
  ball8: {
    top: 400,
    left: '5%',
    fontSize: 56,
  },
  ball9: {
    top: 400,
    left: '45%',
    fontSize: 70,
  },
  ball10: {
    top: 520,
    left: '30%',
    fontSize: 54,
  },
  ball11: {
    top: 520,
    left: '75%',
    fontSize: 65,
  },
  ball12: {
    top: 650,
    left: '55%',
    fontSize: 59,
  },
  // Back Button - Sol üst köşe (standardize)
  backButtonTop: {
    position: 'absolute',
    top: WDS_SPACING.xl,
    left: WDS_SPACING.xl,
    width: WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
    height: WEBSITE_ICON_SIZES.xl + WDS_SPACING.md,
    borderRadius: WEBSITE_BORDER_RADIUS.lg,
    backgroundColor: 'rgba(15, 42, 36, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(31, 162, 166, 0.3)',
    borderWidth: 1,
    borderColor: `rgba(31, 162, 166, ${0.2})`,
  },
  mainContainer: {
    flex: 1,
    paddingTop: WDS_SPACING.xl + WEBSITE_ICON_SIZES.xl + WDS_SPACING.md + WDS_SPACING.lg,
    paddingBottom: 140, // Footer için yeterli boşluk (buton + progress + padding)
    zIndex: 1, // Watermark'ın üstünde olması için
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.base, // ✅ STANDART (SPACING.lg=24 → SPACING.base=16)
    paddingTop: SPACING.base, // ✅ Header altı boşluk (STANDART: 16px)
  },
  // Plan Info Card - Kompakt
  planCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  planHeaderCompact: {
    marginBottom: SPACING.xs,
  },
  planHeaderLeftCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  planTitleCompact: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 14,
    color: DARK_MODE.foreground,
    fontWeight: '600',
  },
  planDescriptionCompact: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    color: DARK_MODE.mutedForeground,
  },
  proBadgeCompact: {
    backgroundColor: BRAND.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: SPACING.xs,
  },
  proBadgeTextCompact: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
  },
  statusContainerCompact: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  statusItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  statusProgressCompact: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarCompact: {
    height: '100%',
    backgroundColor: BRAND.emerald,
    borderRadius: 2,
  },
  statusCountCompact: {
    fontSize: 11,
    color: DARK_MODE.mutedForeground,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  statusCountActive: {
    color: BRAND.emerald,
    fontWeight: '600',
  },
  badgeText: {
    ...TYPOGRAPHY.bodySmall, // 12px
    color: BRAND.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    outlineStyle: 'none', // Web'de outline'ı kaldır
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#EF4444',
  },
  searchResultsHeader: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: BRAND.emerald,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchResultsText: {
    ...TYPOGRAPHY.bodySmall,
    color: BRAND.emerald,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3, // 18px, Bold
    color: BRAND.white,
  },
  sectionCount: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
  },
  sectionOptional: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
  },
  sectionOptionalLocked: {
    color: BRAND.gold,
  },
  // ✅ Seçili takımların listesi
  selectedTeamsList: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: DARK_MODE.border,
  },
  selectedTeamItem: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
  },
  selectedTeamName: {
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    fontSize: 14,
  },
  noTeamsText: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DARK_MODE.card, // #1e293b
    borderRadius: 12,
    marginBottom: SPACING.md,
    paddingRight: SPACING.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden', // Renkli şeridi kesmek için
  },
  teamCardSelected: {
    borderColor: BRAND.emerald,
    borderWidth: 2,
  },
  teamCardLocked: {
    opacity: 0.6,
  },
  colorStripe: {
    width: 4,
    alignSelf: 'stretch', // Kartın tüm yüksekliğini kapla
    flexDirection: 'column', // Renkler dikey olarak
  },
  colorStripeSegment: {
    width: 4,
  },
  teamInfo: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  teamName: {
    ...TYPOGRAPHY.bodyLargeSemibold, // 16px, Semibold
    color: BRAND.white,
    marginBottom: SPACING.xs,
  },
  teamLeague: {
    ...TYPOGRAPHY.bodySmall, // 12px
    color: DARK_MODE.mutedForeground,
  },
  lockedText: {
    opacity: 0.5,
  },
  proRequiredBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DARK_MODE.border,
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#121826',
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
    zIndex: 100, // Tıklanabilir olması için
  },
  continueButton: {
    backgroundColor: BRAND.emerald,
    borderRadius: 12,
    height: 56,
    marginBottom: 8, // Progress ile arasına boşluk
  },
  continueButtonText: {
    color: BRAND.white,
    ...TYPOGRAPHY.button,
  },

  /* ✅ Yeni dropdown tabanlı seçim stilleri */
  selectButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Ortala
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Glassmorphism efekti
    borderRadius: 12, // ✅ 16 → 12 (profil kartıyla aynı)
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm, // ✅ md → sm (daha kompakt)
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 60, // ✅ 80 → 60 (profil kartıyla benzer)
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
      },
    }),
  },
  selectButtonSelected: {
    borderColor: 'rgba(5, 150, 105, 0.5)',
    borderWidth: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.8)', // Antrasit ton
    ...Platform.select({
      web: {
        boxShadow: '0 6px 12px rgba(5, 150, 105, 0.25)',
      },
      default: {
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
      },
    }),
  },
  selectButtonOpen: {
    borderColor: 'rgba(5, 150, 105, 0.5)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 12px rgba(5, 150, 105, 0.3)',
      },
      default: {
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
      },
    }),
  },
  selectButtonLocked: {
    opacity: 0.5,
  },
  selectButtonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Gradient şeritlerin üstünde olması için
    paddingVertical: SPACING.xs,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // ✅ Hafif arka plan (görünürlük için)
    // ✅ Güzelleştirilmiş çarpı ikonu
  },
  selectTeamName: {
    ...TYPOGRAPHY.h3, // 18px, Bold
    fontSize: 17,
    color: BRAND.white,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  selectCoachItalic: {
    ...TYPOGRAPHY.bodySmall, // 12px
    fontSize: 12,
    color: 'rgba(5, 150, 105, 0.9)', // Daha yumuşak emerald
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 6,
    fontWeight: '500',
  },
  selectTournaments: {
    ...TYPOGRAPHY.bodySmall, // 12px
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.7)', // Daha yumuşak muted
    textAlign: 'center',
    fontWeight: '400',
  },
  selectPlaceholder: {
    ...TYPOGRAPHY.bodyMedium,
    color: DARK_MODE.mutedForeground,
    textAlign: 'center',
  },
  selectButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
    zIndex: 1, // Gradient şeritlerin üstünde olması için
  },
  // ✅ Sol kenar gradient şerit - butonun soluna yapışık
  selectColorStripeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 0,
    opacity: 0.85, // Biraz daha yumuşak
  },
  // ✅ Sağ kenar gradient şerit - butonun sağına yapışık
  selectColorStripeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 0,
    opacity: 0.85, // Biraz daha yumuşak
  },
  selectColorStripe: {
    width: 10,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
  },
  selectColorHalf: {
    flex: 1,
  },
  selectColorPlaceholder: {
    width: 10,
    height: 44,
    borderRadius: 6,
    backgroundColor: DARK_MODE.border,
  },
  selectLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
    marginBottom: 4,
  },
  selectValue: {
    ...TYPOGRAPHY.bodyLargeSemibold,
    color: BRAND.white,
  },
  selectMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
    marginTop: 4,
  },
  selectCoach: {
    ...TYPOGRAPHY.bodySmall,
    color: BRAND.emerald,
    marginTop: 4,
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
  },
  dropdown: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Glassmorphism
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    padding: SPACING.md,
    gap: SPACING.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
      },
    }),
  },
  dropdownItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Glassmorphism
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    overflow: 'hidden',
    minHeight: 95,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
      },
    }),
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 1, // Gradient şeritlerin üstünde olması için
    paddingLeft: SPACING.sm,
  },
  // ✅ Sol kenar gradient şerit - dropdown item'ın soluna yapışık
  dropdownStripeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6, // Butonlarla aynı
    zIndex: 0,
    opacity: 0.85, // Yumuşak
  },
  // ✅ Sağ kenar gradient şerit - dropdown item'ın sağına yapışık
  dropdownStripeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 6, // Butonlarla aynı
    zIndex: 0,
    opacity: 0.85, // Yumuşak
  },
  dropdownStripe: {
    width: 8,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: SPACING.md,
    flexDirection: 'column',
  },
  dropdownStripeHalf: {
    flex: 1,
  },
  dropdownName: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    color: BRAND.white,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dropdownCoach: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12,
    color: 'rgba(5, 150, 105, 0.9)', // Yumuşak emerald
    marginBottom: 6,
    fontWeight: '500',
    fontStyle: 'italic', // Butonlarla aynı
  },
  dropdownTournament: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.7)', // Yumuşak muted
    fontWeight: '400',
  },
  emptySearchContainer: {
    padding: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  emptySearchText: {
    ...TYPOGRAPHY.bodyMedium,
    color: DARK_MODE.mutedForeground,
    textAlign: 'center',
  },
  dropdownMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: DARK_MODE.mutedForeground,
    marginTop: 2,
  },
  
  // Progress Indicator
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0, // continueButton'dan marginBottom ile boşluk var
    marginBottom: 8, // Footer bottom padding
    height: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: WEBSITE_BRAND_COLORS.secondary,
    borderColor: WEBSITE_BRAND_COLORS.secondary,
  },
  progressLine: {
    width: 28,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
});
