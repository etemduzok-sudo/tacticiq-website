// src/components/ads/AdInterstitial.tsx
import { AdMobInterstitial } from 'expo-ads-admob';
import { Platform } from 'react-native';
import authService from '../../services/authService';

class AdInterstitialService {
  private isInitialized = false;
  private adUnitId: string;

  constructor() {
    // Test Ad Unit IDs
    const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
    const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
    
    this.adUnitId = Platform.OS === 'android' 
      ? TEST_INTERSTITIAL_ANDROID 
      : TEST_INTERSTITIAL_IOS;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await AdMobInterstitial.setAdUnitID(this.adUnitId);
      await AdMobInterstitial.setTestDeviceID('EMULATOR');
      this.isInitialized = true;
      console.log('✅ Interstitial Ad initialized');
    } catch (error) {
      console.error('❌ Interstitial Ad initialization failed:', error);
    }
  }

  async loadAd() {
    try {
      await this.initialize();
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      console.log('✅ Interstitial Ad loaded');
    } catch (error) {
      console.error('❌ Interstitial Ad load failed:', error);
    }
  }

  async showAd(): Promise<boolean> {
    try {
      // Premium kontrolü
      const user = await authService.getCurrentUser();
      if (user && user.is_premium) {
        return false; // Premium kullanıcılar için reklam gösterme
      }

      // Reklam yüklü mü kontrol et
      const isReady = await AdMobInterstitial.getIsReadyAsync();
      if (!isReady) {
        // Reklam yüklü değilse yükle
        await this.loadAd();
        // Biraz bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await AdMobInterstitial.showAdAsync();
      console.log('✅ Interstitial Ad shown');
      
      // Reklam gösterildikten sonra yeni reklam yükle
      this.loadAd();
      
      return true;
    } catch (error) {
      console.error('❌ Interstitial Ad show failed:', error);
      return false;
    }
  }

  // Belirli ekranlardan önce reklam göster
  async showAdBeforeScreen(screenName: string) {
    // Önemli ekranlardan önce reklam göster
    const importantScreens = ['match-detail', 'profile', 'leaderboard'];
    
    if (importantScreens.includes(screenName)) {
      // %30 şansla reklam göster (kullanıcı deneyimini bozmamak için)
      if (Math.random() < 0.3) {
        await this.showAd();
      }
    }
  }
}

export default new AdInterstitialService();
