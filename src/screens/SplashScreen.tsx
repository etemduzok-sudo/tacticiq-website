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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AUTH_GRADIENT,
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
  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(-180);
  const loadingOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const brandingOpacity = useSharedValue(0);

  // Loading dots animations
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);

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

    // Logo animation (spring effect)
    logoScale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    logoRotation.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
    });

    // Loading dots animation
    loadingOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    
    // Dots bouncing
    dot1Y.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
    
    dot2Y.value = withDelay(
      1350,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
    
    dot3Y.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );

    // Tagline animation
    taglineOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));

    // Branding animation
    brandingOpacity.value = withDelay(2500, withTiming(1, { duration: 800 }));

    // ✅ Background circles animation kaldırıldı (baloncuklar)
          ),
          -1,
          false
        )
      );
    });

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

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));


  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1Y.value }],
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2Y.value }],
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3Y.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const brandingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: brandingOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={AUTH_GRADIENT.colors}
        style={styles.container}
        start={AUTH_GRADIENT.start}
        end={AUTH_GRADIENT.end}
      >
        {/* ✅ Animated Background Pattern kaldırıldı (baloncuklar) */}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Loading Indicator */}
          <Animated.View style={[styles.loadingContainer, loadingAnimatedStyle]}>
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, dot1AnimatedStyle]} />
              <Animated.View style={[styles.dot, dot2AnimatedStyle]} />
              <Animated.View style={[styles.dot, dot3AnimatedStyle]} />
            </View>
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={taglineAnimatedStyle}>
            <Text style={styles.tagline}>Predict • Compete • Win</Text>
          </Animated.View>
        </View>

        {/* Bottom Branding */}
        <Animated.View style={[styles.brandingContainer, brandingAnimatedStyle]}>
          <Text style={styles.brandingText}>Powered by Football Passion</Text>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AUTH_GRADIENT.colors[0],
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: Z_INDEX.sticky,
  },
  
  // Logo
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 160,
    height: 160,
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
