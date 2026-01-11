import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeIcon from '../components/SafeIcon';
import { BRAND, TYPOGRAPHY, SPACING, DARK_MODE } from '../theme/theme';
import { Button } from '../components/atoms';
import { getUserLimits, canAddTeam, isNationalTeam } from '../constants/userLimits';

interface FavoriteTeamsScreenProps {
  onComplete: (selectedTeams: Array<{ id: number; name: string; logo: string; league?: string }>) => void;
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
  },
  {
    id: '102',
    name: 'Almanya',
    league: 'UEFA',
    country: 'Milli Takım',
    colors: ['#000000', '#DD0000', '#FFCE00'], // Siyah-Kırmızı-Altın
    type: 'national',
  },
  {
    id: '103',
    name: 'Brezilya',
    league: 'CONMEBOL',
    country: 'Milli Takım',
    colors: ['#009C3B', '#FFDF00'], // Yeşil-Sarı
    type: 'national',
  },
  {
    id: '104',
    name: 'Arjantin',
    league: 'CONMEBOL',
    country: 'Milli Takım',
    colors: ['#74ACDF', '#FFFFFF'], // Mavi-Beyaz
    type: 'national',
  },
];

export default function FavoriteTeamsScreen({ onComplete, onBack }: FavoriteTeamsScreenProps) {
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]); // Pro plan için multiple seçim
  const [selectedNational, setSelectedNational] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // Plan ve dil bilgisini yükle
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Dil seçimini yükle
      const lang = await AsyncStorage.getItem('fan-manager-language');
      if (lang) {
        setSelectedLanguage(lang);
      }

      // Plan bilgisini yükle (Free/Pro)
      const userData = await AsyncStorage.getItem('fan-manager-user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setIsPremium(parsed.isPremium === true || parsed.plan === 'pro' || parsed.plan === 'premium');
      }
    } catch (error) {
      console.error('Kullanıcı verisi yüklenemedi:', error);
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
    // 🔥 FREE USER: Sadece milli takım seçmeli
    if (!isPremium) {
      if (!selectedNational) {
        Alert.alert('Uyarı', 'Lütfen bir milli takım seçin');
        return;
      }
    } else {
      // PRO USER: En az 1 kulüp veya milli takım seçmeli
      if (selectedClubs.length === 0 && !selectedNational) {
        Alert.alert('Uyarı', 'Lütfen en az bir takım seçin');
        return;
      }
    }
    
    // Seçili takımları ID'leriyle birlikte hazırla
    const selectedTeamIds = [...selectedClubs, selectedNational].filter(Boolean) as string[];
    const selectedTeamsData = TEAMS
      .filter(team => selectedTeamIds.includes(team.id))
      .map(team => ({
        id: team.apiId || parseInt(team.id), // API ID varsa onu kullan, yoksa string ID'yi number'a çevir
        name: team.name,
        logo: `https://media.api-sports.io/football/teams/${team.apiId || team.id}.png`,
        league: team.league,
      }));
    
    console.log('✅ Seçili takımlar (ID ile):', selectedTeamsData);
    onComplete(selectedTeamsData);
  };

  const filterTeams = (teams: Team[]) => {
    if (searchQuery.length < 3) return teams;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Takımları filtrele ve skorla
    const scoredTeams = teams
      .map((team) => {
        const teamName = team.name.toLowerCase();
        let score = 0;
        
        // İlk harften başlıyorsa en yüksek skor
        if (teamName.startsWith(query)) {
          score = 100;
        }
        // Kelime başında eşleşme
        else if (teamName.split(' ').some(word => word.startsWith(query))) {
          score = 50;
        }
        // Herhangi bir yerde eşleşme
        else if (teamName.includes(query)) {
          score = 10;
        }
        
        return { team, score };
      })
      .filter(({ score }) => score > 0); // Sadece eşleşenleri al
    
    // Skoruna göre sırala (yüksekten düşüğe), sonra alfabetik
    scoredTeams.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.team.name.localeCompare(b.team.name, 'tr');
    });
    
    return scoredTeams.map(({ team }) => team);
  };

  const handleClubSelect = (teamId: string) => {
    const isSelected = selectedClubs.includes(teamId);
    
    if (isSelected) {
      // Seçimi kaldır
      setSelectedClubs(selectedClubs.filter(id => id !== teamId));
    } else {
      // 🔥 FREE USER: Kulüp seçemez!
      if (!isPremium) {
        Alert.alert(
          '🔒 PRO Özellik',
          'Kulüp takımı seçmek için PRO üyelik gereklidir.\n\n✅ PRO ile 5 kulüp + 1 milli takım seçebilirsiniz!',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'PRO Ol', onPress: () => {
              // TODO: Navigate to PRO upgrade screen
              Alert.alert('PRO Üyelik', 'PRO üyelik sayfası yakında açılacak!');
            }},
          ]
        );
        return;
      }
      
      // PRO USER: Check limits (5 kulüp max)
      const maxClubs = 5;
      if (selectedClubs.length >= maxClubs) {
        Alert.alert('Maksimum Limit', `En fazla ${maxClubs} kulüp seçebilirsiniz.`);
        return;
      }
      
      setSelectedClubs([...selectedClubs, teamId]);
    }
  };

  const handleNationalSelect = (teamId: string) => {
    // Free Plan: Milli takım seçilemez
    if (!isPremium) {
      Alert.alert(
        'Pro Plan Gerekli',
        'Milli takım seçimi Pro plan özelliğidir. Pro plana geçerek milli takımınızı seçebilirsiniz.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    if (selectedNational === teamId) {
      setSelectedNational(null);
    } else {
      setSelectedNational(teamId);
    }
  };

  const clubCount = selectedClubs.length;
  const nationalCount = selectedNational ? 1 : 0;
  const maxClubs = isPremium ? 5 : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back Button - Üst kısımda belirgin */}
        {onBack && (
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.topBackButton}
            activeOpacity={0.7}
          >
            <SafeIcon name="chevron-back" size={24} color={BRAND.white} />
            <Text style={styles.topBackText}>Geri</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Takımlarınızı Seçin</Text>
          <Text style={styles.subtitle}>Favori kulüpleriniz ve milli takımınızı belirleyin</Text>

          {/* Status Badges */}
          <View style={styles.badgesContainer}>
            <View style={[styles.badge, clubCount > 0 && styles.badgeActive]}>
              <Text style={styles.badgeText}>
                Kulüp: {clubCount}/{maxClubs}
              </Text>
            </View>
            <View style={[styles.badge, !isPremium && styles.badgeDisabled]}>
              <Text style={[styles.badgeText, !isPremium && styles.badgeTextDisabled]}>
                Milli: {nationalCount}/1 {!isPremium && '(Pro)'}
              </Text>
            </View>
            <View style={[styles.badge, isPremium ? styles.badgePremium : styles.badgeFree]}>
              <SafeIcon name={isPremium ? "star" : "star-outline"} size={12} color={isPremium ? BRAND.gold : DARK_MODE.mutedForeground} />
              <Text style={[styles.badgeText, isPremium && { color: BRAND.gold }]}>
                {isPremium ? 'Pro Plan' : 'Free Plan'}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SafeIcon name="search" size={20} color={DARK_MODE.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="En az 3 karakter yazın..."
            placeholderTextColor={DARK_MODE.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Kulüpler Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kulüpler</Text>
            <Text style={styles.sectionCount}>{clubCount}/{maxClubs} seçili</Text>
          </View>

          {filterTeams(clubTeams).map((team) => {
            const isSelected = selectedClubs.includes(team.id);
            // 🔥 FREE USER: Tüm kulüpler kilitli
            const isLocked = !isPremium || (!isSelected && selectedClubs.length >= maxClubs);

            return (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, isSelected && styles.teamCardSelected, isLocked && styles.teamCardLocked]}
                onPress={() => handleClubSelect(team.id)}
                activeOpacity={0.7}
                disabled={isLocked}
              >
                {/* Left Color Stripe */}
                <View style={styles.colorStripe}>
                  {team.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[
                        styles.colorStripeSegment,
                        { backgroundColor: color, flex: 1 / team.colors.length },
                      ]}
                    />
                  ))}
                </View>

                {/* Team Info */}
                <View style={styles.teamInfo}>
                  <Text style={[styles.teamName, isLocked && styles.lockedText]}>{team.name}</Text>
                  <Text style={[styles.teamLeague, isLocked && styles.lockedText]}>
                    {team.country} • {team.league}
                  </Text>
                  {/* 🔥 FREE USER: PRO badge göster */}
                  {!isPremium && (
                    <Text style={styles.proRequiredBadge}>🔒 PRO</Text>
                  )}
                </View>

                {/* Right Icon */}
                {isLocked ? (
                  <SafeIcon name="lock-closed" size={24} color="#F59E0B" />
                ) : isSelected ? (
                  <View style={styles.checkIconContainer}>
                    <SafeIcon name="checkmark-circle" size={28} color={BRAND.emerald} />
                  </View>
                ) : (
                  <View style={styles.emptyCircle} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Milli Takım Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milli Takım</Text>
            <Text style={[styles.sectionOptional, !isPremium && styles.sectionOptionalLocked]}>
              {isPremium ? 'Opsiyonel' : 'Pro Plan Gerekli'}
            </Text>
          </View>

          {filterTeams(nationalTeams).map((team) => {
            const isSelected = selectedNational === team.id;
            const isLocked = !isPremium;

            return (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, isSelected && styles.teamCardSelected, isLocked && styles.teamCardLocked]}
                onPress={() => handleNationalSelect(team.id)}
                activeOpacity={0.7}
                disabled={false} // Her zaman tıklanabilir (uyarı göstermek için)
              >
                {/* Left Color Stripe */}
                <View style={styles.colorStripe}>
                  {team.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[
                        styles.colorStripeSegment,
                        { backgroundColor: color, flex: 1 / team.colors.length },
                      ]}
                    />
                  ))}
                </View>

                {/* Team Info */}
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamLeague}>
                    {team.country} • {team.league}
                  </Text>
                </View>

                {/* Right Icon */}
                {isLocked ? (
                  <SafeIcon name="lock-closed" size={24} color={DARK_MODE.mutedForeground} />
                ) : isSelected ? (
                  <View style={styles.checkIconContainer}>
                    <SafeIcon name="checkmark-circle" size={28} color={BRAND.emerald} />
                  </View>
                ) : (
                  <View style={styles.emptyCircle} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <Button
          title="Devam Et"
          onPress={handleContinue}
          variant="solid"
          fullWidth
          disabled={selectedClubs.length === 0}
          style={styles.continueButton}
          textStyle={styles.continueButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121826', // Koyu lacivert/siyah arka plan
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Footer için boşluk
  },
  topBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
  },
  topBackText: {
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  mainTitle: {
    ...TYPOGRAPHY.h1, // 28px, Bold
    color: BRAND.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium, // 14px
    color: DARK_MODE.mutedForeground,
    marginBottom: SPACING.lg,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: DARK_MODE.card, // #1e293b
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    gap: SPACING.xs,
  },
  badgeActive: {
    borderColor: BRAND.emerald,
    backgroundColor: 'rgba(5, 150, 105, 0.1)', // Zümrüt şeffaf
  },
  badgePremium: {
    borderColor: BRAND.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // Altın şeffaf
  },
  badgeFree: {
    borderColor: DARK_MODE.border,
    backgroundColor: DARK_MODE.card,
  },
  badgeDisabled: {
    opacity: 0.5,
  },
  badgeTextDisabled: {
    color: DARK_MODE.mutedForeground,
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
    padding: SPACING.lg,
    backgroundColor: '#121826',
    borderTopWidth: 1,
    borderTopColor: DARK_MODE.border,
  },
  continueButton: {
    backgroundColor: BRAND.emerald,
    borderRadius: 12,
    height: 56,
  },
  continueButtonText: {
    color: BRAND.white,
    ...TYPOGRAPHY.button,
  },
});
