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
import { FlagDE, FlagGB, FlagES, FlagFR, FlagIT, FlagTR, FlagAR, FlagCN } from '../components/flags';

// Logo
const logoImage = require('../../assets/logo.png');

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: string) => void;
  onBack?: () => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelect,
  onBack,
}: LanguageSelectionScreenProps) {

  // Scrolling welcome text animation (8 languages, tek satırda yanyana)
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const welcomeTexts = [
    'Welcome',      // English
    'Hoş Geldiniz', // Türkçe
    'Willkommen',   // Deutsch
    'Bienvenido',   // Español
    'Bienvenue',    // Français
    'Benvenuto',    // Italiano
    'مرحبا',        // Arabic
    '欢迎',          // Chinese
  ];
  // ✅ 8 dilde tek satırda yanyana, her dil arasında " • " ayırıcı
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

  // ✅ SVG Flag Components
  const FlagComponent = ({ code }: { code: string }) => {
    switch (code) {
      case 'de': return <FlagDE size={48} />;
      case 'en': return <FlagGB size={48} />;
      case 'es': return <FlagES size={48} />;
      case 'fr': return <FlagFR size={48} />;
      case 'it': return <FlagIT size={48} />;
      case 'tr': return <FlagTR size={48} />;
      case 'ar': return <FlagAR size={48} />;
      case 'zh': return <FlagCN size={48} />;
      default: return null;
    }
  };

  const languages = [
    // İlk 6 dil (3 satır)
    { code: 'de', name: 'Deutsch' },      // Almanya
    { code: 'en', name: 'English' },     // İngiltere
    { code: 'es', name: 'Español' },     // İspanya
    { code: 'fr', name: 'Français' },    // Fransa
    { code: 'it', name: 'Italiano' },    // İtalya
    { code: 'tr', name: 'Türkçe' },      // Türkiye
    // Son 2 dil (4. satır - en altta)
    { code: 'ar', name: 'العربية' },     // Arapça - Suudi Arabistan
    { code: 'zh', name: '中文' },         // Çince - Çin
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
                  <Image 
                    source={logoImage} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
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
                          <FlagComponent code={lang.code} />
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
    height: 85, // ✅ Yükseklik azaltıldı (100'den 85'e)
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10, // ✅ Gap de azaltıldı
  },
  flagContainer: {
    width: 48,
    height: 32, // ✅ SVG bayrak için yükseklik (aspect ratio korunur)
    alignItems: 'center',
    justifyContent: 'center',
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
