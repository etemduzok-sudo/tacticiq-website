import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme/theme';

interface ProfileSettingsScreenProps {
  onBack: () => void;
  onNavigateToFavoriteTeams: () => void;
  onNavigateToLanguage: () => void;
  onLogout: () => void;
}

export default function ProfileSettingsScreen({ 
  onBack, 
  onNavigateToFavoriteTeams, 
  onNavigateToLanguage, 
  onLogout 
}: ProfileSettingsScreenProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={[styles.backButton, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Settings options would go here */}
        <TouchableOpacity onPress={onNavigateToFavoriteTeams} activeOpacity={0.8}>
          <View style={[styles.option, { borderBottomColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>Favori Takımlar</Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onNavigateToLanguage} activeOpacity={0.8}>
          <View style={[styles.option, { borderBottomColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>Dil Seçimi</Text>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={onLogout} activeOpacity={0.8}>
          <View style={[styles.option, { borderBottomColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.error }]}>Çıkış Yap</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
  },
  content: { 
    padding: SPACING.base 
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
  },
  arrow: {
    fontSize: 20,
  },
});
