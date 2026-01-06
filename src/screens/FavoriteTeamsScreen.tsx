import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SafeIcon from '../components/SafeIcon';
import { BRAND, TYPOGRAPHY, SPACING, DARK_MODE } from '../theme/theme';
import { Button } from '../components/atoms';

interface FavoriteTeamsScreenProps {
  onComplete: (selectedTeams: string[]) => void;
  onBack?: () => void;
}

interface Team {
  id: string;
  name: string;
  league: string;
  country: string;
  colors: string[]; // Sol kenardaki renkli şerit için
  type: 'club' | 'national';
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
  },
  {
    id: '2',
    name: 'Fenerbahçe',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#FFFF00', '#000080'], // Sarı-Lacivert
    type: 'club',
  },
  {
    id: '3',
    name: 'Beşiktaş',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#000000', '#FFFFFF'], // Siyah-Beyaz
    type: 'club',
  },
  {
    id: '4',
    name: 'Trabzonspor',
    league: 'Süper Lig',
    country: 'Türkiye',
    colors: ['#800020', '#0000FF'], // Bordo-Mavi
    type: 'club',
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
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedNational, setSelectedNational] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isPremium = false; // Free Plan simülasyonu

  const clubTeams = TEAMS.filter((t) => t.type === 'club');
  const nationalTeams = TEAMS.filter((t) => t.type === 'national');

  const handleContinue = () => {
    if (!selectedClub) {
      Alert.alert('Uyarı', 'Lütfen en az bir kulüp seçin');
      return;
    }
    
    const teams = [selectedClub, selectedNational].filter(Boolean) as string[];
    onComplete(teams);
  };

  const filterTeams = (teams: Team[]) => {
    if (searchQuery.length < 3) return teams;
    return teams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleClubSelect = (teamId: string) => {
    // Free Plan: Sadece 1 kulüp seçilebilir
    if (selectedClub === teamId) {
      setSelectedClub(null);
    } else if (selectedClub === null || isPremium) {
      setSelectedClub(teamId);
    }
  };

  const handleNationalSelect = (teamId: string) => {
    if (selectedNational === teamId) {
      setSelectedNational(null);
    } else {
      setSelectedNational(teamId);
    }
  };

  // handleContinue already defined above

  const clubCount = selectedClub ? 1 : 0;
  const nationalCount = selectedNational ? 1 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backButton}
          >
            <SafeIcon name="chevron-back" size={24} color={BRAND.white} />
            <Text style={styles.backText}>Favori Takımlarınız</Text>
          </TouchableOpacity>

          <Text style={styles.mainTitle}>Takımlarınızı Seçin</Text>
          <Text style={styles.subtitle}>Favori kulüpleriniz ve milli takımınızı belirleyin</Text>

          {/* Status Badges */}
          <View style={styles.badgesContainer}>
            <View style={[styles.badge, clubCount === 1 && styles.badgeActive]}>
              <Text style={styles.badgeText}>Kulüp: {clubCount}/1</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Milli: {nationalCount}/1 (opsiyonel)</Text>
            </View>
            <View style={[styles.badge, styles.badgePremium]}>
              <SafeIcon name="star" size={12} color={BRAND.gold} />
              <Text style={[styles.badgeText, { color: BRAND.gold }]}>Free Plan</Text>
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
            <Text style={styles.sectionCount}>{clubCount}/1 seçili</Text>
          </View>

          {filterTeams(clubTeams).map((team) => {
            const isSelected = selectedClub === team.id;
            const isLocked = !isSelected && selectedClub !== null && !isPremium;

            return (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, isSelected && styles.teamCardSelected]}
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

        {/* Milli Takım Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milli Takım</Text>
            <Text style={styles.sectionOptional}>Opsiyonel</Text>
          </View>

          {filterTeams(nationalTeams).map((team) => {
            const isSelected = selectedNational === team.id;

            return (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamCard, isSelected && styles.teamCardSelected]}
                onPress={() => handleNationalSelect(team.id)}
                activeOpacity={0.7}
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
                {isSelected ? (
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
          disabled={!selectedClub}
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
  header: {
    paddingTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backText: {
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    marginLeft: SPACING.xs,
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
