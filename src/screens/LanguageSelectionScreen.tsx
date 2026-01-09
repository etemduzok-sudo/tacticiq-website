import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated as RNAnimated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Try to import logo, fallback to text
let logoImage: any = null;
try {
  logoImage = require('../assets/images/brand/fan_manager_shield.png');
} catch (e) {
  console.warn('Logo image not found, using text fallback');
}

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelect,
  onBack,
}: LanguageSelectionScreenProps) {

  // Scrolling welcome text animation (6 languages, no abbreviations)
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const welcomeTexts = [
    'Welcome',      // English
    'Hoş Geldiniz', // Türkçe
    'Willkommen',   // Deutsch
    'Bienvenido',   // Español
    'Bienvenue',    // Français
    'Benvenuto',    // Italiano
  ];
  const welcomeString = welcomeTexts.join('  •  ') + '  •  ';
  const textWidth = welcomeString.length * 9;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.timing(scrollX, {
        toValue: -textWidth,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.screenContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.brandZone}>
                {logoImage ? (
                  <Image 
                    source={logoImage} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.logoText}>FM 2026</Text>
                )}
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
                        <Text style={styles.flagEmoji}>{lang.flag}</Text>
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
            </View>
          </ScrollView>

          {/* Footer */}
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
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 24,
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
  
  // Brand Zone
  brandZone: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    height: 200,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 4,
  },
  logoImage: {
    width: 120,
    height: 120,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  flagEmoji: {
    fontSize: 48,
    lineHeight: 48,
  },
  languageName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Welcome Message
  welcomeContainer: {
    width: '100%',
    height: 28,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeScrollView: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  welcomeMessage: {
    fontSize: 16,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 40,
    includeFontPadding: false,
    fontWeight: '400',
  },
  
  // Footer
  footerZone: {
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});
