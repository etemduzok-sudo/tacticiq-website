// src/components/ads/AdBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import authService from '../../services/authService';

// Web için AdMob mock
let AdMobBanner: any = null;
if (Platform.OS !== 'web') {
  try {
    AdMobBanner = require('expo-ads-admob').AdMobBanner;
  } catch (e) {
    console.warn('expo-ads-admob not available');
  }
}

interface AdBannerProps {
  adUnitID?: string;
  position?: 'top' | 'bottom';
  style?: any;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  adUnitID,
  position = 'bottom',
  style,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user && user.is_premium) {
        setIsPremium(true);
        setShowAd(false);
      } else {
        setIsPremium(false);
        setShowAd(true);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      // Hata durumunda reklam göster (güvenli taraf)
      setShowAd(true);
    }
  };

  // Premium kullanıcılar için reklam gösterme
  if (isPremium || !showAd) {
    return null;
  }

  // Web'de reklam gösterme (mock) - Development sırasında gizli
  if (Platform.OS === 'web') {
    // Web'de reklam göstermeyelim (development)
    // Production'da web için farklı reklam sistemi kullanılabilir (Google AdSense vb.)
    return null;
  }

  // Native platformlarda gerçek reklam
  if (!AdMobBanner) {
    return null;
  }

  // Test Ad Unit IDs (Gerçek uygulamada değiştirilecek)
  const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
  const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
  
  // Gerçek Ad Unit ID (app.json'dan gelecek veya prop olarak)
  const bannerAdUnitId = adUnitID || (Platform.OS === 'android' 
    ? TEST_BANNER_ANDROID 
    : TEST_BANNER_IOS);

  return (
    <View style={[styles.container, position === 'top' && styles.topContainer, style]}>
      <AdMobBanner
        bannerSize="banner"
        adUnitID={bannerAdUnitId}
        servePersonalizedAds={true}
        onDidFailToReceiveAdWithError={(error) => {
          console.warn('Ad failed to load:', error);
        }}
        style={styles.banner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  topContainer: {
    marginTop: 8,
  },
  banner: {
    width: '100%',
  },
  // Web Ad Mock
  webAdMock: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webAdPlaceholder: {
    width: 320,
    height: 50,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webAdText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
});
