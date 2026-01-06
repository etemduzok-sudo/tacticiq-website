import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
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
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const yearOpacity = useSharedValue(0);
  const loadingOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const brandingOpacity = useSharedValue(0);

  // Loading dots animations
  const dot1Y = useSharedValue(0);
  const dot2Y = useSharedValue(0);
  const dot3Y = useSharedValue(0);

  // Background circles animations (20 circles)
  const circleAnimations = Array.from({ length: 20 }, () => ({
    opacity: useSharedValue(0),
    scale: useSharedValue(0),
  }));

  useEffect(() => {
    // Logo animation (spring effect)
    logoScale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
    logoRotation.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
    });

    // Title animation
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    titleY.value = withDelay(500, withTiming(0, { duration: 800 }));

    // Year animation
    yearOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

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

    // Background circles animation
    circleAnimations.forEach((circle, i) => {
      circle.opacity.value = withDelay(
        i * 200,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1500 }),
            withTiming(0, { duration: 1500 })
          ),
          -1,
          false
        )
      );
      
      circle.scale.value = withDelay(
        i * 200,
        withRepeat(
          withSequence(
            withTiming(1.5, { duration: 1500 }),
            withTiming(2, { duration: 1500 })
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

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const yearAnimatedStyle = useAnimatedStyle(() => ({
    opacity: yearOpacity.value,
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
        {/* Animated Background Pattern */}
        <View style={styles.backgroundPattern}>
          {circleAnimations.map((circle, index) => {
            const circleStyle = useAnimatedStyle(() => ({
              opacity: circle.opacity.value * 0.1,
              transform: [{ scale: circle.scale.value }],
            }));

            const randomLeft = Math.random() * 100;
            const randomTop = Math.random() * 100;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.backgroundCircle,
                  circleStyle,
                  {
                    left: `${randomLeft}%`,
                    top: `${randomTop}%`,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚽</Text>
            </View>
          </Animated.View>

          {/* App Name */}
          <Animated.View style={titleAnimatedStyle}>
            <Text style={styles.titleText}>Fan Manager</Text>
          </Animated.View>

          <Animated.View style={yearAnimatedStyle}>
            <Text style={styles.yearText}>2026</Text>
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
  
  // Background Pattern
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: BRAND.white,
  },
  
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
  logoCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xl,
  },
  logoEmoji: {
    fontSize: 60,
  },
  
  // Title
  titleText: {
    ...TYPOGRAPHY.h1Splash,
    color: BRAND.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  yearText: {
    ...TYPOGRAPHY.h2,
    color: `rgba(255, 255, 255, ${OPACITY[90]})`,
    textAlign: 'center',
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
