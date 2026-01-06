import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/ui/Button';

type LanguageSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LanguageSelection'
>;

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

const { width } = Dimensions.get('window');
const cardWidth = (width - SPACING.md * 3) / 2;

export default function LanguageSelection() {
  const navigation = useNavigation<LanguageSelectionNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const handleContinue = () => {
    if (selectedLanguage) {
      navigation.replace('Auth');
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.background]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Ionicons name="shield" size={100} color={colors.accent} />
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Fan Manager 2⚽26
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Premium Football Management Experience
          </Text>
        </View>

        {/* Language Grid */}
        <View style={styles.languageGrid}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    selectedLanguage === language.code
                      ? colors.primary
                      : colors.border,
                  borderWidth: selectedLanguage === language.code ? 2 : 1,
                },
                selectedLanguage === language.code && SHADOWS.medium,
              ]}
              onPress={() => setSelectedLanguage(language.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <Text
                style={[
                  styles.languageName,
                  {
                    color:
                      selectedLanguage === language.code
                        ? colors.primary
                        : colors.text,
                  },
                ]}
              >
                {language.nativeName}
              </Text>
              {selectedLanguage === language.code && (
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
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Devam Et"
            onPress={handleContinue}
            disabled={!selectedLanguage}
            fullWidth
          />
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          © 2026 Fan Manager. Tüm hakları saklıdır.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  titleContainer: {
    marginTop: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  languageCard: {
    width: cardWidth,
    height: 120,
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  flag: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  languageName: {
    ...TYPOGRAPHY.bodyMedium,
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
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  footer: {
    ...TYPOGRAPHY.small,
    textAlign: 'center',
  },
});
