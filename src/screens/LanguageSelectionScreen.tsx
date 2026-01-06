import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { AUTH_GRADIENT } from '../theme/gradients';
import { BRAND, TYPOGRAPHY, SPACING, SIZES, OPACITY } from '../theme/theme';

// Import Flag Components
import { FlagTR, FlagGB, FlagDE, FlagES, FlagFR, FlagIT } from '../components/flags';

const { width } = Dimensions.get('window');

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelect,
  onBack,
}: LanguageSelectionScreenProps) {
  // Rotating ball animation
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedBallStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const languages = [
    { code: 'de', name: 'Deutsch', FlagComponent: FlagDE },
    { code: 'en', name: 'English', FlagComponent: FlagGB },
    { code: 'es', name: 'Español', FlagComponent: FlagES },
    { code: 'fr', name: 'Français', FlagComponent: FlagFR },
    { code: 'it', name: 'Italiano', FlagComponent: FlagIT },
    { code: 'tr', name: 'Türkçe', FlagComponent: FlagTR },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.content}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Ionicons name="shield" size={96} color="#F59E0B" />
              
              {/* Title with rotating ball */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Fan Manager 2</Text>
                <Animated.Text style={[styles.ballEmoji, animatedBallStyle]}>
                  ⚽
                </Animated.Text>
                <Text style={styles.titleText}>26</Text>
              </View>
              
              <Text style={styles.subtitle}>
                Premium Football Management Experience
              </Text>
            </View>

            {/* Language Selection Grid */}
            <View style={styles.languageGrid}>
              {languages.map((lang, index) => {
                const isLeftColumn = index % 2 === 0;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageButton,
                      isLeftColumn && styles.languageButtonLeft,
                    ]}
                    onPress={() => onLanguageSelect(lang.code)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.8)']}
                      style={styles.languageButtonGradient}
                    >
                      <View style={styles.flagContainer}>
                        <lang.FlagComponent size={48} />
                      </View>
                      <Text style={styles.languageName}>{lang.name}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Welcome Message */}
            <Text style={styles.welcomeMessage}>Benvenuto • Welcome • Bienvenue</Text>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2026 Fan Manager. Tüm hakları saklıdır.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_GRADIENT.colors[0],
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  content: {
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  
  // ===== LOGO SECTION =====
  logoSection: {
    alignItems: 'center',
    marginBottom: 64,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  titleText: {
    fontSize: 36,
    color: BRAND.white,
    fontWeight: 'bold',
  },
  ballEmoji: {
    fontSize: 25,
    marginHorizontal: -2,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: `rgba(255, 255, 255, ${OPACITY[60]})`,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  
  // ===== LANGUAGE GRID =====
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.sm,
    marginBottom: SPACING.xl,
  },
  languageButton: {
    width: '50%',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.base,
  },
  languageButtonLeft: {
    // Optional: Add specific left column styles
  },
  languageButtonGradient: {
    height: 100,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: `rgba(5, 150, 105, ${OPACITY[30]})`,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    // Shadow (inactive by default)
    shadowColor: BRAND.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  flagContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  languageName: {
    ...TYPOGRAPHY.bodyMedium,
    color: BRAND.white,
    fontWeight: '500',
  },
  
  // ===== WELCOME MESSAGE =====
  welcomeMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: `rgba(255, 255, 255, ${OPACITY[40]})`,
    textAlign: 'center',
  },
  
  // ===== FOOTER =====
  footer: {
    ...TYPOGRAPHY.bodySmall,
    color: `rgba(255, 255, 255, ${OPACITY[40]})`,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingBottom: SPACING.base,
  },
});
