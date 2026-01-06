import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND, TYPOGRAPHY, SPACING, OPACITY } from '../theme/theme';
import { SPLASH_GRADIENT } from '../theme/gradients';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Wait 2.5 seconds for splash animation, then call onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={[styles.container, { backgroundColor: '#059669' }]}>
      {/* GEÇICI: LinearGradient yerine düz yeşil arka plan */}
      {/* Logo + Başlık (Merkez) */}
      <View style={styles.centerContent}>
        {/* Logo - Shield Icon (Altın Sarısı Outline) */}
        <View style={styles.logoContainer}>
          <View style={styles.shield}>
            <View style={styles.shieldInner} />
          </View>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>Fan Manager 2⚽26</Text>
        
        {/* Slogan */}
        <Text style={styles.slogan}>Premium Football Management Experience</Text>
      </View>

      {/* Alt Kısım (Footer) */}
      <View style={styles.footer}>
        {/* Loading Spinner */}
        <ActivityIndicator 
          size="small" 
          color={BRAND.emerald} 
          style={styles.spinner}
        />
        
        {/* Copyright - text-white/60 */}
        <Text style={styles.copyright}>© 2026 Fan Manager. Tüm hak saklıdır.        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // ===== MERKEZ İÇERİK =====
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.base, // 16px
  },
  
  // Logo Container
  logoContainer: {
    width: 140,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg, // 24px
  },
  
  // Shield (Kalkan) Logo
  shield: {
    width: 120,
    height: 140,
    borderWidth: 5,
    borderColor: BRAND.gold, // Altın Sarısı Outline (#F59E0B)
    borderRadius: 20,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  shieldInner: {
    width: 90,
    height: 110,
    borderWidth: 3,
    borderColor: BRAND.gold,
    borderRadius: 15,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    opacity: OPACITY[50], // 0.5
  },
  
  // Başlık - h1Splash (48px, bold)
  title: {
    ...TYPOGRAPHY.h1Splash, // 48px, fontWeight: '700'
    color: BRAND.white,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: SPACING.base, // 16px
  },
  
  // Slogan - bodyMedium (14px)
  slogan: {
    ...TYPOGRAPHY.bodyMedium, // 14px
    fontWeight: '500', // Medium
    color: `rgba(255, 255, 255, ${OPACITY[80]})`, // text-white/80
    textAlign: 'center',
    marginTop: SPACING.sm, // 8px
    letterSpacing: 0.5,
  },
  
  // ===== FOOTER =====
  footer: {
    alignItems: 'center',
    paddingBottom: 40, // Ekran altından 40px
    gap: SPACING.base, // 16px
  },
  
  // Loading Spinner
  spinner: {
    marginBottom: SPACING.base, // 16px
  },
  
  // Copyright - text-white/60 (Design System)
  copyright: {
    ...TYPOGRAPHY.bodySmall, // 12px
    color: `rgba(255, 255, 255, ${OPACITY[60]})`, // text-white/60
    textAlign: 'center',
  },
});
