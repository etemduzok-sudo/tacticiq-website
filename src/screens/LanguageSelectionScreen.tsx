import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn,
} from 'react-native-reanimated';
import { AUTH_GRADIENT } from '../theme/gradients';
import { BRAND, TYPOGRAPHY, SPACING, SIZES, OPACITY } from '../theme/theme';

// Import Flag Components
import { FlagTR, FlagGB, FlagDE, FlagES, FlagFR, FlagIT } from '../components/flags';

// ============================================
// LAYOUT CONSTANTS (Language screen has larger brand zone)
// ============================================
const LAYOUT = {
  screenPadding: 24,
  
  // Brand Zone (larger for language screen - welcome screen)
  brandZoneMarginBottom: 48,
  logoSize: 80,
  titleFontSize: 32,
  titleLineHeight: 40,
  ballEmojiSize: 22,
  subtitleFontSize: 14,
  subtitleMarginTop: 12,
};

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelect,
  onBack,
}: LanguageSelectionScreenProps) {

  // Scrolling welcome text animation
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const welcomeTexts = [
    'Welcome',      // İngilizce
    'Hoş Geldiniz', // Türkçe
    'Bienvenido',   // İspanyolca
    'Bienvenue',    // Fransızca
    'Willkommen',   // Almanca
    'Benvenuto',    // İtalyanca
  ];
  const welcomeString = welcomeTexts.join('  •  ') + '  •  ';
  // More accurate width calculation (8.5px per character average for fontSize 14)
  const textWidth = welcomeString.length * 8.5;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.timing(scrollX, {
        toValue: -textWidth,
        duration: 20000, // 20 saniyede tam tur
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

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
        <View style={styles.screenContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              entering={FadeIn.duration(300)}
              style={styles.content}
            >
            {/* [B] BRAND ZONE (Larger for welcome screen) */}
            <View style={styles.brandZone}>
              <Text style={styles.logoText}>FM 2026</Text>
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

            {/* Scrolling Welcome Message */}
            <View style={styles.welcomeContainer}>
              <RNAnimated.View
                style={[
                  styles.welcomeScrollView,
                  {
                    transform: [{ translateX: scrollX }],
                  },
                ]}
              >
                <Text style={styles.welcomeMessage} numberOfLines={1} ellipsizeMode="clip">
                  {welcomeString}
                </Text>
                <Text style={styles.welcomeMessage} numberOfLines={1} ellipsizeMode="clip">
                  {welcomeString}
                </Text>
              </RNAnimated.View>
            </View>
            </Animated.View>
          </ScrollView>

          {/* [H] FOOTER ZONE - FIXED AT BOTTOM (OUTSIDE SCROLLABLE CONTENT) */}
          <View style={styles.footerZone}>
            <Text style={styles.footer}>
              © 2026. Tüm hakları saklıdır.
            </Text>
          </View>
        </View>
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
  screenContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // [B] BRAND ZONE (Larger for welcome/language screen)
  brandZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: LAYOUT.brandZoneMarginBottom,
    height: 200, // Fixed height to prevent jumping between screens
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: BRAND.white,
    letterSpacing: 4,
  },
  
  // Language Grid
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  languageButton: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
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
    gap: 12,
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
  
  // Welcome Message
  welcomeContainer: {
    width: '100%',
    height: 24,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeScrollView: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  welcomeMessage: {
    fontSize: 14,
    lineHeight: 24,
    color: `rgba(255, 255, 255, ${OPACITY[40]})`,
    marginRight: 32,
    includeFontPadding: false,
  },
  
  // [H] FOOTER ZONE - FIXED AT BOTTOM (GLOBAL FOOTER)
  footerZone: {
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    fontSize: 12,
    color: '#6B7280', // Same color as all other screens
    textAlign: 'center',
  },
});
