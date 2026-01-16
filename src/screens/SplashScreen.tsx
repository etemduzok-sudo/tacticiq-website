import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// ✅ Animasyon import'ları kaldırıldı (sıçrama yok)
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SPLASH_GRADIENT,
} from '../theme/gradients';
import {
  BRAND,
  TYPOGRAPHY,
  SPACING,
  SIZES,
  SHADOWS,
  OPACITY,
  Z_INDEX,
} from '../theme/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: (hasUser: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  // ✅ Logo animasyonları kaldırıldı (sıçrama yok)
  // ✅ Loading dots animasyonları kaldırıldı (sadece görünür)
  // ✅ Background circles kaldırıldı (baloncuklar)

  useEffect(() => {
    // Web için animasyonları atla
    if (Platform.OS === 'web') {
      // Web'de direkt splash'i tamamla
      const timer = setTimeout(async () => {
        try {
          const userToken = await AsyncStorage.getItem('fan-manager-user');
          const hasUser = !!userToken;
          console.log('🔍 User token:', userToken);
          onComplete(hasUser);
        } catch (error) {
          console.error('❌ Error checking user:', error);
          onComplete(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    // ✅ Tüm animasyonlar kaldırıldı (sıçrama yok, standart görünüm)

    // Check user status and navigate
    const checkUserStatus = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye (test için kısaltıldı)
        
        // 🧪 TEST MODE: Set "pro" user if not exists and save to DB
        if (__DEV__) {
          const existingUser = await AsyncStorage.getItem('fan-manager-user');
          if (!existingUser) {
            const { usersDb } = await import('../services/databaseService');
            
            const testUser = {
              id: 'pro-test-user-id-' + Date.now(),
              username: 'pro',
              email: 'pro@test.com',
              authenticated: true,
              isPro: true,
              createdAt: new Date().toISOString(),
            };
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('fan-manager-user', JSON.stringify(testUser));
            console.log('✅ Test user "pro" set up in AsyncStorage');
            
            // Save to Database
            try {
              const dbResult = await usersDb.createUser({
                id: testUser.id,
                username: testUser.username,
                email: testUser.email,
                is_pro: testUser.isPro,
              });
              
              if (dbResult.success) {
                console.log('✅ Test user "pro" saved to database');
              } else {
                console.warn('⚠️ Could not save user to database:', dbResult.error);
              }
            } catch (dbError) {
              console.warn('⚠️ Database save error (continuing anyway):', dbError);
            }
          } else {
            // User exists, check if in DB and sync if needed
            const parsedUser = JSON.parse(existingUser);
            const { usersDb } = await import('../services/databaseService');
            
            try {
              const dbUser = await usersDb.getUserById(parsedUser.id);
              if (!dbUser.success) {
                // User not in DB, create it
                const dbResult = await usersDb.createUser({
                  id: parsedUser.id,
                  username: parsedUser.username || 'pro',
                  email: parsedUser.email || 'pro@test.com',
                  is_pro: parsedUser.isPro || false,
                });
                if (dbResult.success) {
                  console.log('✅ Existing user synced to database');
                }
              }
            } catch (syncError) {
              console.warn('⚠️ User sync error (continuing anyway):', syncError);
            }
          }
        }
        
        const userToken = await AsyncStorage.getItem('fan-manager-user');
        console.log('🔍 User token:', userToken);
        onComplete(userToken !== null);
      } catch (error) {
        console.error('❌ Error checking user status:', error);
        onComplete(false);
      }
    };

    checkUserStatus();
  }, []);

  // ✅ Tüm animated style'lar kaldırıldı (standart görünüm)

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={SPLASH_GRADIENT.colors}
        style={styles.container}
        start={SPLASH_GRADIENT.start}
        end={SPLASH_GRADIENT.end}
      >
        {/* ✅ Animated Background Pattern kaldırıldı (baloncuklar) */}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo - Standart boyut, animasyon yok (sıçrama yok) */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Loading Indicator - Standart görünüm (animasyon yok) */}
          <View style={styles.loadingContainer}>
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          {/* Tagline - Standart görünüm */}
          <View>
            <Text style={styles.tagline}>Predict • Compete • Win</Text>
          </View>
        </View>

        {/* Bottom Branding - Standart görünüm */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>Powered by Football Passion</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SPLASH_GRADIENT.colors[0],
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  
  // ✅ Background pattern ve circles kaldırıldı (baloncuklar)
  
  // Main Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120, // %30 azaltıldı (yaklaşık 170 * 0.7) - logo'yu yukarı taşımak için
    paddingHorizontal: SPACING.xl,
    zIndex: Z_INDEX.sticky,
  },
  
  // Logo - Standart boyut (96x96), animasyon yok
  logoContainer: {
    marginTop: 0,
    marginBottom: 22, // %30 azaltıldı (32 * 0.7)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 96,
    height: 96,
  },
  
  // Loading Dots
  loadingContainer: {
    marginTop: SPACING.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND.white,
  },
  
  // Tagline
  tagline: {
    ...TYPOGRAPHY.bodySmall,
    color: `rgba(255, 255, 255, ${OPACITY[80]})`,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  
  // Bottom Branding
  brandingContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  brandingText: {
    ...TYPOGRAPHY.bodySmall,
    color: `rgba(255, 255, 255, ${OPACITY[60]})`,
    textAlign: 'center',
  },
});

export default SplashScreen;
