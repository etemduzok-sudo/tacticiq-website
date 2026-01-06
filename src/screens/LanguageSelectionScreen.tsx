import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, DARK_MODE } from '../theme/theme';
import { AUTH_GRADIENT } from '../theme/gradients';

interface Language {
  code: string;
  name: string;
  flag: string;
  greeting: string;
}

interface LanguageSelectionScreenProps {
  onLanguageSelect: (lang: string) => void;
  onBack?: () => void;
}

const LANGUAGES: Language[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', greeting: 'Willkommen' },
  { code: 'en', name: 'English', flag: '🇬🇧', greeting: 'Welcome' },
  { code: 'es', name: 'Español', flag: '🇪🇸', greeting: 'Bienvenido' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', greeting: 'Bienvenue' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', greeting: 'Benvenuto' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', greeting: 'Hoş Geldiniz' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SPACING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_SPACING * 3) / 2;

export default function LanguageSelectionScreen({ onLanguageSelect, onBack }: LanguageSelectionScreenProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');

  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);
  const greeting = selectedLang?.greeting || 'Welcome';

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    // Auto navigate after selection
    setTimeout(() => {
      onLanguageSelect(code);
    }, 500);
  };

  return (
    <LinearGradient
      {...AUTH_GRADIENT}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          {/* Shield Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.shield}>
              <View style={styles.shieldInner} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Fan Manager 2⚽26</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>Premium Football Management Experience</Text>
        </View>

        {/* Language Grid */}
        <View style={styles.languageGrid}>
          {LANGUAGES.map((language) => {
            const isSelected = selectedLanguage === language.code;
            
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.7}
              >
                {/* Flag */}
                <Text style={styles.flag}>{language.flag}</Text>
                
                {/* Language Name */}
                <Text style={[
                  styles.languageName,
                  isSelected && styles.languageNameSelected,
                ]}>
                  {language.name}
                </Text>

                {/* Checkmark for selected */}
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Greeting Text */}
        <Text style={styles.greeting}>{greeting}</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  
  // ===== LOGO SECTION =====
  logoSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 30,
  },
  shield: {
    width: 100,
    height: 115,
    borderWidth: 4,
    borderColor: BRAND.gold, // Altın sarısı
    borderRadius: 16,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldInner: {
    width: 75,
    height: 90,
    borderWidth: 3,
    borderColor: BRAND.gold,
    borderRadius: 13,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    opacity: 0.5,
  },
  
  // Title & Subtitle
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.white,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  
  // ===== LANGUAGE GRID =====
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  languageCard: {
    width: CARD_WIDTH,
    height: 110,
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  languageCardSelected: {
    borderColor: BRAND.emerald,
    backgroundColor: DARK_MODE.card,
  },
  
  // Flag
  flag: {
    fontSize: 56, // BÜYÜK bayrak
    marginBottom: 12,
  },
  
  // Language Name
  languageName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.white,
  },
  languageNameSelected: {
    color: BRAND.white,
  },
  
  // Checkmark
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    color: BRAND.white,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // ===== GREETING =====
  greeting: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.3)', // Çok silik
    textAlign: 'center',
    marginTop: 20,
  },
});
