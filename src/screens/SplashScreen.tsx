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
  BRAND,
  SPACING,
  Z_INDEX,
  COLORS,
  LIGHT_MODE,
  DARK_MODE,
} from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: (hasUser: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const bgColor = isLight ? LIGHT_MODE.background : DARK_MODE.background;
  const gradientColors = isLight
    ? ['#fafaf9', '#E8E8E6', '#f5f7f6']
    : ['#0a1612', '#0F2A24', '#0a1612'];
  const gridOpacity = isLight ? 'rgba(15, 42, 36, 0.12)' : 'rgba(31, 162, 166, 0.12)';

  useEffect(() => {
    // Web için OAuth callback ve session kontrolü
    if (Platform.OS === 'web') {
      const checkAuthAndComplete = async () => {
        try {
          console.log('🔍 [Splash] Web auth check başlıyor...');
          
          // ✅ LOGOUT kontrolü - URL'de logout parametresi varsa session kontrolünü atla
          const urlParams = new URLSearchParams(window.location.search);
          const isLogout = urlParams.has('logout');
          
          if (isLogout) {
            console.log('🚪 [Splash] Logout detected, clearing all storage and going to onboarding...');
            // Tüm storage'ı temizle
            window.localStorage.clear();
            window.sessionStorage?.clear();
            try {
              await AsyncStorage.clear();
            } catch (e) {
              console.warn('⚠️ [Splash] AsyncStorage clear error:', e);
            }
            // URL'den logout parametresini temizle (tarih için)
            window.history.replaceState({}, '', '/');
            console.log('✅ [Splash] Storage cleared, going to login');
            onComplete(false);
            return;
          }
          
          // ✅ OAuth callback kontrolü - URL'de hash varsa App.tsx hallediyor, burada skip et
          const hasAuthHash = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('error');
          
          if (hasAuthHash) {
            console.log('🔄 [Splash] OAuth callback var, App.tsx halledecek, bekleniyor...');
            // App.tsx OAuth'u handle edecek, burada bekle
            return;
          }
          
          // ✅ AsyncStorage kontrolü (hızlı ve güvenilir)
          const userToken = await AsyncStorage.getItem('tacticiq-user');
          
          if (userToken) {
            try {
              const userData = JSON.parse(userToken);
              console.log('🔍 [Splash] AsyncStorage user found:', userData.email || 'no-email');
              onComplete(true);
              return;
            } catch (e) {
              console.warn('⚠️ [Splash] Invalid user data in storage');
            }
          }
          
          // ✅ Supabase session kontrolü (fallback) - timeout ile
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session check timeout')), 3000)
            );
            
            const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
            
            if (session?.user) {
              console.log('✅ [Splash] Supabase session bulundu:', session.user.email);
              onComplete(true);
              return;
            }
          } catch (sessionError) {
            console.warn('⚠️ [Splash] Session check failed/timeout:', sessionError);
          }
          
          console.log('🔍 [Splash] No user found, going to onboarding');
          onComplete(false);
        } catch (error) {
          console.error('❌ [Splash] Auth check error:', error);
          onComplete(false);
        }
      };
      
      // Web için 2 saniye splash göster, sonra auth check
      const timer = setTimeout(checkAuthAndComplete, 2000);
      return () => clearTimeout(timer);
    }

    // ✅ Tüm animasyonlar kaldırıldı (sıçrama yok, standart görünüm)

    // Check user status and navigate
    const checkUserStatus = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 saniye
        
        // 🧪 TEST MODE: Set "pro" user if not exists and save to DB
        if (__DEV__) {
          const existingUser = await AsyncStorage.getItem('tacticiq-user');
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
            await AsyncStorage.setItem('tacticiq-user', JSON.stringify(testUser));
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
        
        const userToken = await AsyncStorage.getItem('tacticiq-user');
        // ✅ SECURITY: Don't log full token
        console.log('🔍 User authenticated:', !!userToken);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Grid Pattern Background - tema uyumlu */}
        <View style={[styles.gridPattern, Platform.OS === 'web' && isLight && {
          backgroundImage: `linear-gradient(to right, ${gridOpacity} 1px, transparent 1px), linear-gradient(to bottom, ${gridOpacity} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }]} />

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

        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.primary,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  
  // Grid Pattern Background - Websitesi ile uyumlu
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  
  // Main Content - Tam ortada
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Tam ortada
    paddingHorizontal: SPACING.xl,
    zIndex: Z_INDEX.sticky,
  },
  
  // Logo - Büyük boyut, tam ortada
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 450, // %50 büyütüldü (300 * 1.5)
    height: 450,
  },
  
});

export default SplashScreen;
