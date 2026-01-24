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
import {
  WEBSITE_BRAND_COLORS,
  WEBSITE_SPACING as WDS_SPACING,
} from '../config/WebsiteDesignSystem';
import { supabase } from '../config/supabase';
import socialAuthService from '../services/socialAuthService';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: (hasUser: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  // ✅ Logo animasyonları kaldırıldı (sıçrama yok)
  // ✅ Loading dots animasyonları kaldırıldı (sadece görünür)
  // ✅ Background circles kaldırıldı (baloncuklar)

  useEffect(() => {
    // Web için OAuth callback ve session kontrolü
    if (Platform.OS === 'web') {
      const checkAuthAndComplete = async () => {
        try {
          console.log('🔍 [Splash] Web auth check başlıyor...');
          
          // ✅ OAuth callback kontrolü - URL'de hash varsa bekle
          const hasAuthHash = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('error');
          
          if (hasAuthHash) {
            console.log('🔄 [Splash] OAuth callback algılandı, Supabase session bekleniyor...');
            
            // Supabase'in URL'deki token'ları parse etmesini bekle
            // detectSessionInUrl: true olduğu için otomatik yapacak
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // URL hash'i temizle (loop önleme)
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
          
          // ✅ Supabase session kontrolü (öncelikli)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ [Splash] Supabase session bulundu:', session.user.email);
            
            // Kullanıcıyı local storage'a senkronize et
            const provider = session.user.app_metadata?.provider || 'email';
            await socialAuthService.checkSession(); // Bu sync yapacak
            
            onComplete(true);
            return;
          }
          
          // ✅ AsyncStorage fallback
          const userToken = await AsyncStorage.getItem('tacticiq-user');
          const hasUser = !!userToken;
          console.log('🔍 [Splash] AsyncStorage user:', hasUser);
          
          onComplete(hasUser);
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
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0a1612', '#0F2A24', '#0a1612']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Grid Pattern Background */}
        <View style={styles.gridPattern} />

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
    backgroundColor: WEBSITE_BRAND_COLORS.primary,
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
