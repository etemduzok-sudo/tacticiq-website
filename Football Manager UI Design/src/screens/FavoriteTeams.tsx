import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/theme';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

type FavoriteTeamsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FavoriteTeams'
>;

interface Team {
  id: string;
  name: string;
  league: string;
  logo: string;
}

const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Manchester United', league: 'Premier League', logo: '🔴' },
  { id: '2', name: 'Real Madrid', league: 'La Liga', logo: '⚪' },
  { id: '3', name: 'Bayern München', league: 'Bundesliga', logo: '🔴' },
  { id: '4', name: 'Paris Saint-Germain', league: 'Ligue 1', logo: '🔵' },
  { id: '5', name: 'Juventus', league: 'Serie A', logo: '⚫' },
  { id: '6', name: 'Barcelona', league: 'La Liga', logo: '🔵' },
  { id: '7', name: 'Liverpool', league: 'Premier League', logo: '🔴' },
  { id: '8', name: 'Galatasaray', league: 'Süper Lig', logo: '🟡' },
  { id: '9', name: 'Fenerbahçe', league: 'Süper Lig', logo: '🟡' },
  { id: '10', name: 'Beşiktaş', league: 'Süper Lig', logo: '⚫' },
];

export default function FavoriteTeams() {
  const navigation = useNavigation<FavoriteTeamsNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const filteredTeams = MOCK_TEAMS.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.league.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTeam = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleContinue = () => {
    navigation.replace('MainTabs');
  };

  const handleSkip = () => {
    navigation.replace('MainTabs');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Favori Takımlarınız
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Takip etmek istediğiniz takımları seçin (En az 1)
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Takım veya lig ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Teams Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.teamsGrid}
        showsVerticalScrollIndicator={false}
      >
        {filteredTeams.map((team) => {
          const isSelected = selectedTeams.includes(team.id);
          return (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.teamCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
                isSelected && SHADOWS.medium,
              ]}
              onPress={() => toggleTeam(team.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.teamLogo}>{team.logo}</Text>
              <Text
                style={[
                  styles.teamName,
                  {
                    color: isSelected ? colors.primary : colors.text,
                  },
                ]}
                numberOfLines={2}
              >
                {team.name}
              </Text>
              <Text
                style={[styles.teamLeague, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {team.league}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.checkmark,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerContent}>
          <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
            {selectedTeams.length} takım seçildi
          </Text>
          <View style={styles.footerButtons}>
            <Button
              title="Atla"
              onPress={handleSkip}
              variant="ghost"
              style={styles.skipButton}
            />
            <Button
              title="Devam Et"
              onPress={handleContinue}
              disabled={selectedTeams.length === 0}
              style={styles.continueButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
  },
  title: {
    ...TYPOGRAPHY.h1,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.xs,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
  },
  searchInput: {
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  teamsGrid: {
    padding: SPACING.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  teamLogo: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  teamName: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  teamLeague: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  footerContent: {
    paddingHorizontal: SPACING.lg,
  },
  selectedCount: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});
