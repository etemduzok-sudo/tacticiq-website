import React, { useState, useEffect, useRef } from 'react';
import { LogBox, View, Text, StyleSheet, Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { PredictionProvider } from './src/contexts/PredictionContext';
import { MatchProvider } from './src/contexts/MatchContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import { MAINTENANCE_CONFIG, logVersionInfo } from './src/config/AppVersion';
import { useFavoriteTeamMatches } from './src/hooks/useFavoriteTeamMatches';
import { useFavoriteTeams } from './src/hooks/useFavoriteTeams';
import { ProfileCard } from './src/components/ProfileCard';
import { DARK_MODE } from './src/theme/theme';
import { hasBadgeBeenShown, markBadgeAsShown } from './src/services/badgeService';
import { logger, logNavigation } from './src/utils/logger';
import socialAuthService from './src/services/socialAuthService';
// Web için React Native'in built-in Animated API'sini kullan, native için reanimated
import { Animated as RNAnimated } from 'react-native';

// Web için reanimated'i import etme - sadece native için
let Animated: any;
let FadeIn: any, FadeOut: any, SlideInRight: any, SlideOutLeft: any;
let FadeInDown: any, FadeInUp: any, FadeInLeft: any, FadeInRight: any;
let ZoomIn: any, ZoomOut: any, Layout: any;

if (Platform.OS === 'web') {
  // Web için basit Animated wrapper
  Animated = {
    View: RNAnimated.View,
    Text: RNAnimated.Text,
    Image: RNAnimated.Image,
    ScrollView: RNAnimated.ScrollView,
    FlatList: RNAnimated.FlatList,
    SectionList: RNAnimated.SectionList,
    createAnimatedComponent: (component: any) => component,
  };
  // Web için basit animasyon hook'ları (no-op)
  const noop = () => ({});
  FadeIn = { duration: noop, delay: noop, springify: noop };
  FadeOut = { duration: noop, delay: noop, springify: noop };
  SlideInRight = { duration: noop, delay: noop, springify: noop };
  SlideOutLeft = { duration: noop, delay: noop, springify: noop };
  FadeInDown = { duration: noop, delay: noop, springify: noop };
  FadeInUp = { duration: noop, delay: noop, springify: noop };
  FadeInLeft = { duration: noop, delay: noop, springify: noop };
  FadeInRight = { duration: noop, delay: noop, springify: noop };
  ZoomIn = { duration: noop, delay: noop, springify: noop };
  ZoomOut = { duration: noop, delay: noop, springify: noop };
  Layout = { duration: noop, delay: noop, springify: noop };
} else {
  // Native için reanimated kullan - dynamic import ile
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default || Reanimated;
    FadeIn = Reanimated.FadeIn || { duration: () => ({}) };
    FadeOut = Reanimated.FadeOut || { duration: () => ({}) };
    SlideInRight = Reanimated.SlideInRight || { duration: () => ({}) };
    SlideOutLeft = Reanimated.SlideOutLeft || { duration: () => ({}) };
    FadeInDown = Reanimated.FadeInDown || { duration: () => ({}) };
    FadeInUp = Reanimated.FadeInUp || { duration: () => ({}) };
    FadeInLeft = Reanimated.FadeInLeft || { duration: () => ({}) };
    FadeInRight = Reanimated.FadeInRight || { duration: () => ({}) };
    ZoomIn = Reanimated.ZoomIn || { duration: () => ({}) };
    ZoomOut = Reanimated.ZoomOut || { duration: () => ({}) };
    Layout = Reanimated.Layout || { duration: () => ({}) };
  } catch (e) {
    // Fallback: React Native Animated kullan
    Animated = { View: RNAnimated.View };
    const noop = () => ({});
    FadeIn = { duration: noop, delay: noop, springify: noop };
    FadeOut = { duration: noop, delay: noop, springify: noop };
    SlideInRight = { duration: noop, delay: noop, springify: noop };
    SlideOutLeft = { duration: noop, delay: noop, springify: noop };
    FadeInDown = { duration: noop, delay: noop, springify: noop };
    FadeInUp = { duration: noop, delay: noop, springify: noop };
    FadeInLeft = { duration: noop, delay: noop, springify: noop };
    FadeInRight = { duration: noop, delay: noop, springify: noop };
    ZoomIn = { duration: noop, delay: noop, springify: noop };
    ZoomOut = { duration: noop, delay: noop, springify: noop };
    Layout = { duration: noop, delay: noop, springify: noop };
  }
}
import './src/i18n'; // Initialize i18n

// Web için UIManager polyfills
if (Platform.OS === 'web') {
  if (!UIManager || typeof UIManager.focus !== 'function') {
    // @ts-ignore - Web için UIManager polyfills
    if (typeof UIManager === 'object') {
      UIManager.focus = () => {
        logger.warn('UIManager.focus is not supported on web', undefined, 'UIManager');
      };
      UIManager.measure = (node: any, callback: Function) => {
        if (callback) {
          // Return dummy measurements for web
          requestAnimationFrame(() => {
            callback(0, 0, 0, 0, 0, 0);
          });
        }
      };
      UIManager.measureInWindow = (node: any, callback: Function) => {
        if (callback) {
          requestAnimationFrame(() => {
            callback(0, 0, 0, 0);
          });
        }
      };
    }
  }
  
  // Web için zoom engelleme - ÇOK AGRESİF ÇÖZÜM
  if (typeof document !== 'undefined') {
    // Meta viewport tag'ini kontrol et ve ekle
    const setViewportMeta = () => {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.getElementsByTagName('head')[0].appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    };
    
    // CSS ile zoom'u tamamen engelle
    const addZoomPreventionCSS = () => {
      const styleId = 'zoom-prevention-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          * {
            touch-action: manipulation !important;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            user-select: none !important;
          }
          input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
          }
          html, body {
            zoom: 1 !important;
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
          }
          #root {
            zoom: 1 !important;
            transform: scale(1) !important;
            -webkit-transform: scale(1) !important;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    // Zoom seviyesini sürekli kontrol et ve sıfırla
    const preventZoom = () => {
      // Meta viewport'u kontrol et
      setViewportMeta();
      
      // Document zoom'unu kontrol et
      if (document.documentElement.style.zoom !== '1') {
        document.documentElement.style.zoom = '1';
      }
      if (document.body.style.zoom !== '1') {
        document.body.style.zoom = '1';
      }
      
      // Visual viewport scale'i kontrol et
      if (window.visualViewport && window.visualViewport.scale !== 1) {
        try {
          window.visualViewport.scale = 1;
        } catch (e) {
          // Ignore
        }
      }
      
      // Root element transform'unu kontrol et
      const root = document.getElementById('root');
      if (root) {
        const computedStyle = window.getComputedStyle(root);
        const transform = computedStyle.transform;
        if (transform && transform !== 'none' && !transform.includes('scale(1)')) {
          root.style.transform = 'scale(1) !important';
          root.style.webkitTransform = 'scale(1) !important';
        }
        // Root'un zoom'unu da kontrol et
        if (root.style.zoom !== '1') {
          root.style.zoom = '1';
        }
      }
      
      // Tüm elementlerin zoom'unu kontrol et
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el: any) => {
        if (el.style && el.style.zoom && el.style.zoom !== '1') {
          el.style.zoom = '1';
        }
      });
    };
    
    // İlk yüklemede çalıştır
    setViewportMeta();
    addZoomPreventionCSS();
    preventZoom();
    
    // Her 25ms'de bir kontrol et (daha sık)
    setInterval(preventZoom, 25);
    
    // Event listener'lar
    window.addEventListener('resize', preventZoom);
    window.addEventListener('focus', preventZoom);
    window.addEventListener('blur', preventZoom);
    document.addEventListener('DOMContentLoaded', preventZoom);
    window.addEventListener('load', preventZoom);
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('touchend', preventZoom, { passive: false });
    
    // Çift tıklama engelle (çok agresif)
    document.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      preventZoom();
      return false;
    }, true);
    
    // Wheel zoom engelle
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        preventZoom();
        return false;
      }
    }, { passive: false });
    
    // Touch zoom engelle
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
        e.stopPropagation();
        preventZoom();
        return false;
      }
      lastTouchEnd = now;
    }, { passive: false });
  }
}

// Screens
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import { AgeGateScreen } from './src/screens/AgeGateScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import { MatchListScreen } from './src/screens/MatchListScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ProfileSettingsScreen } from './src/screens/ProfileSettingsScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { DeleteAccountScreen } from './src/screens/DeleteAccountScreen';
import { LegalDocumentScreen } from './src/screens/LegalDocumentScreen';
import ProUpgradeScreen from './src/screens/ProUpgradeScreen';
import { Dashboard } from './src/components/Dashboard';
import { BottomNavigation } from './src/components/BottomNavigation';
import { MatchDetail } from './src/components/MatchDetail';
import { MatchResultSummaryScreen } from './src/screens/MatchResultSummaryScreen';
import { Leaderboard } from './src/components/Leaderboard';
import { DatabaseTestScreen } from './src/screens/DatabaseTestScreen';

// Screen Types
type Screen =
  | 'splash'
  | 'onboarding'
  | 'language'
  | 'age-gate'
  | 'auth'
  | 'register'
  | 'forgot-password'
  | 'home'
  | 'matches'
  | 'match-detail'
  | 'match-result-summary'
  | 'leaderboard'
  | 'tournaments'
  | 'profile'
  | 'profile-settings'
  | 'change-password'
  | 'notifications'
  | 'delete-account'
  | 'legal'
  | 'pro-upgrade'
  | 'database-test'
  | 'profile-setup';

// Ignore warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [legalDocumentType, setLegalDocumentType] = useState<string>('terms');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]); // ✅ Çoklu takım seçimi
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState<boolean>(false); // OAuth işleniyor mu?
  
  // ✅ Favori takımlar hook'u - ProfileCard'a aktarılacak
  const { favoriteTeams, loading: teamsLoading, refetch: refetchFavoriteTeams } = useFavoriteTeams();

  // 🎉 Yeni Rozet State (Test için başlangıçta bir rozet gösterelim)
  const [newBadge, setNewBadge] = useState<{ id: string; name: string; emoji: string; description: string; tier: number } | null>(null);
  const badgeShownRef = useRef<Set<string>>(new Set()); // Track shown badges in this session using ref
  const testBadgeTimerRef = useRef<NodeJS.Timeout | null>(null); // Track test badge timer
  
  // ✅ OAuth Callback Detection - App başlarken HEMEN kontrol et
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (Platform.OS !== 'web') return;
      
      // URL'de OAuth token veya code var mı kontrol et
      const hash = window.location.hash;
      const search = window.location.search;
      const url = window.location.href;
      
      const hasAccessToken = hash.includes('access_token');
      const hasCode = search.includes('code=') || url.includes('code=');
      const hasError = hash.includes('error') || search.includes('error=');
      
      console.log('🔍 [App] OAuth check:', { 
        hash: hash.substring(0, 50), 
        hasAccessToken, 
        hasCode, 
        hasError,
        url: url.substring(0, 100)
      });
      
      if (hasAccessToken || hasCode || hasError) {
        console.log('🔄 [App] OAuth callback algılandı!');
        setIsProcessingOAuth(true);
        
        try {
          // Supabase'in URL'yi işlemesini bekle (detectSessionInUrl: true)
          // PKCE flow için daha uzun bekle
          console.log('⏳ [App] Supabase session bekleniyor...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Session'ı kontrol et
          const result = await socialAuthService.checkSession();
          console.log('📋 [App] Session check result:', result.success, result.user?.email);
          
          if (result.success && result.user) {
            console.log('✅ [App] OAuth başarılı, ana sayfaya yönlendiriliyor...');
            
            // URL'yi tamamen temizle
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.origin + window.location.pathname);
            }
            
            // Direkt ana sayfaya git
            setCurrentScreen('home');
          } else {
            console.log('⚠️ [App] OAuth session bulunamadı');
            
            // URL'yi temizle
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.origin + window.location.pathname);
            }
            
            // Splash'a devam et (normal akış)
            setIsProcessingOAuth(false);
          }
        } catch (error) {
          console.error('❌ [App] OAuth callback error:', error);
          setIsProcessingOAuth(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, []);
  
  // ✅ OAuth Auth State Listener - Google/Apple giriş callback'lerini handle et
  useEffect(() => {
    console.log('🔐 [App] Initializing auth state listener...');
    socialAuthService.initAuthStateListener();
  }, []);

  // 🧪 TEST: Auto-set user as Pro on mount (for testing)
  useEffect(() => {
    if (__DEV__) {
      const autoSetPro = async () => {
        try {
          const { STORAGE_KEYS } = await import('./src/config/constants');
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            // Only set if not already Pro
            if (!userData.isPro && !userData.is_pro) {
              userData.is_pro = true;
              userData.isPro = true;
              userData.isPremium = true;
              userData.plan = 'pro';
              await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
              await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
              console.log('✅ [TEST] User automatically set as Pro!');
            }
          }
        } catch (error) {
          console.log('Auto-set Pro skipped:', error);
        }
      };
      // Run after a short delay to ensure app is initialized
      setTimeout(autoSetPro, 1000);
    }
  }, []);

  // TEST: 5 saniye sonra yeni rozet göster (gerçekte maç sonunda kazanılacak)
  // Sadece bir kez çalışacak şekilde düzeltildi
  useEffect(() => {
    // Clear any existing timer
    if (testBadgeTimerRef.current) {
      clearTimeout(testBadgeTimerRef.current);
      testBadgeTimerRef.current = null;
    }

    // Check if badge has already been shown
    const checkAndShowTestBadge = async () => {
      if (currentScreen === 'home' && !badgeShownRef.current.has('first_blood')) {
        // Also check AsyncStorage to see if it was shown before
        const alreadyShown = await hasBadgeBeenShown('first_blood');
        
        if (!alreadyShown) {
          testBadgeTimerRef.current = setTimeout(() => {
        setNewBadge({
          id: 'first_blood',
          name: '🎯 İlk Kan',
          emoji: '🎯',
          description: 'İlk tahminini yaptın! Analiz yolculuğun başladı.',
          tier: 1,
        });
            // Mark as shown in this session
            badgeShownRef.current.add('first_blood');
            testBadgeTimerRef.current = null;
    }, 5000); // 5 saniye sonra
        }
      }
    };

    checkAndShowTestBadge();

    // Cleanup function
    return () => {
      if (testBadgeTimerRef.current) {
        clearTimeout(testBadgeTimerRef.current);
        testBadgeTimerRef.current = null;
      }
    };
  }, [currentScreen]); // Only depend on currentScreen

  // Global match data - shared across all screens
  const matchData = useFavoriteTeamMatches();

  // ==========================================
  // INITIALIZATION
  // ==========================================
  useEffect(() => {
    // Log version info on startup
    logVersionInfo();

    // Check maintenance mode
    setIsMaintenanceMode(MAINTENANCE_CONFIG.isActive);
  }, []);

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  // 1. Onboarding Complete (replaces splash, language, age-gate flow)
  const handleOnboardingComplete = async () => {
    logger.info('Onboarding complete', undefined, 'ONBOARDING');
    
    try {
      // Navigate to auth
      logNavigation('auth');
      setPreviousScreen(currentScreen);
      setCurrentScreen('auth');
    } catch (error) {
      logger.error('Error in onboarding complete', { error }, 'ONBOARDING');
      setPreviousScreen(currentScreen);
      setCurrentScreen('auth');
    }
  };

  // 1.5. Splash Complete (legacy - for existing users)
  const handleSplashComplete = async (hasUser: boolean) => {
    logger.info('Splash complete', { hasUser }, 'SPLASH');
    
    try {
      if (hasUser) {
        // 🎁 DEV: Set user as PRO automatically (ALWAYS)
        const userDataStr = await AsyncStorage.getItem('tacticiq-user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          // Her zaman Pro yap (kontrol olmadan)
          userData.is_pro = true;
          userData.isPro = true;
          userData.isPremium = true;
          userData.plan = 'pro';
          await AsyncStorage.setItem('tacticiq-user', JSON.stringify(userData));
          logger.debug('User set as PRO automatically', undefined, 'DEV');
          
          // ✅ Eğer profil kurulumu tamamlanmışsa direkt home'a git
          if (userData.profileSetupComplete === true) {
            logger.info('Profile setup complete, navigating to home', undefined, 'SPLASH');
            logNavigation('home');
            setPreviousScreen(currentScreen);
            setCurrentScreen('home');
            return;
          }
        } else {
          // User yoksa oluştur ve Pro yap
          const newUserData = {
            authenticated: true,
            is_pro: true,
            isPro: true,
            isPremium: true,
            plan: 'pro',
          };
          await AsyncStorage.setItem('tacticiq-user', JSON.stringify(newUserData));
          logger.debug('New user created and set as PRO', undefined, 'DEV');
        }
        
        // ✅ Profil kurulumu tamamlanmamışsa onboarding'e git (favorite-teams artık kullanılmıyor)
        logger.info('Profile setup not complete, navigating to onboarding', undefined, 'SPLASH');
        logNavigation('onboarding');
        setPreviousScreen(currentScreen);
        setCurrentScreen('onboarding');
      } else {
        // No user → Onboarding (new unified flow)
        logNavigation('onboarding');
        setPreviousScreen(currentScreen);
        setCurrentScreen('onboarding');
      }
    } catch (error) {
      logger.error('Error in splash complete', { error }, 'SPLASH');
      setPreviousScreen(currentScreen);
      setCurrentScreen('onboarding');
    }
  };

  // 2. Language Selection
  const handleLanguageSelect = async (lang: string) => {
    logger.info('Language selected', { lang }, 'LANGUAGE');
    await AsyncStorage.setItem('fan-manager-language', lang);
    
    // ✅ Her zaman age-gate'e yönlendir (yaş ve yasal bilgilendirme tek ekranda)
    logNavigation('age-gate');
    setPreviousScreen(currentScreen);
    setCurrentScreen('age-gate');
  };

  // 2.5. Age Gate & Consent Complete (Birleştirilmiş ekran)
  const handleAgeGateComplete = async (isMinor: boolean) => {
    logger.info('Age gate and consent complete', { isMinor }, 'AGE_GATE');
    console.log('✅ App.tsx: handleAgeGateComplete called', { isMinor, currentScreen });
    try {
      // Artık AgeGateScreen içinde consent de var, direkt auth'a yönlendir
      logNavigation('auth');
      setPreviousScreen(currentScreen);
      setCurrentScreen('auth');
      console.log('✅ App.tsx: Navigated to auth screen');
    } catch (error) {
      console.error('❌ App.tsx: Error in handleAgeGateComplete', error);
      logger.error('Error in age gate complete', { error }, 'AGE_GATE');
    }
  };

  // 3. Auth → Login Success
  const handleLoginSuccess = async () => {
    logger.info('Login success', undefined, 'AUTH');
    // ✅ Her zaman Pro yap
    const { STORAGE_KEYS } = await import('./src/config/constants');
    const existingUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    const userData = existingUser ? JSON.parse(existingUser) : {};
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ 
      ...userData,
      authenticated: true,
      is_pro: true,
      isPro: true,
      isPremium: true,
      plan: 'pro'
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
    logger.debug('User set as PRO after login', undefined, 'AUTH');
    
    // Giriş yap → Ana sayfaya git (takım kontrolü yapmadan)
    logNavigation('home');
    setPreviousScreen(currentScreen);
    setCurrentScreen('home');
  };

  // 4. Auth → Forgot Password
  const handleForgotPassword = () => {
    logNavigation('forgot-password');
    setCurrentScreen('forgot-password');
  };

  // 5. Auth → Register
  const handleRegister = () => {
    logNavigation('register');
    setCurrentScreen('register');
  };

  // 6. Register → Success → Profile Setup
  const handleRegisterSuccess = async () => {
    logger.info('Register success', undefined, 'REGISTER');
    // ✅ Her zaman Pro yap
    await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ 
      authenticated: true,
      is_pro: true,
      isPro: true,
      isPremium: true,
      plan: 'pro'
    }));
    logger.debug('User set as PRO after registration', undefined, 'REGISTER');
    logNavigation('profile-setup');
    setCurrentScreen('profile-setup');
  };
  
  // 6.5. Profile Setup → Complete → Dashboard
  const handleProfileSetupComplete = async () => {
    logger.info('Profile setup complete', undefined, 'PROFILE_SETUP');
    logNavigation('home');
    setPreviousScreen(currentScreen);
    setCurrentScreen('home');
  };

  // 7. Forgot Password → Back to Auth
  const handleForgotPasswordBack = () => {
    logNavigation('auth');
    setCurrentScreen('auth');
  };

  // 8. Register → Back to Auth
  const handleRegisterBack = () => {
    logNavigation('auth');
    setCurrentScreen('auth');
  };


  // 10. Matches → Profile
  const handleProfileClick = () => {
    logNavigation('profile');
    setCurrentScreen('profile');
  };

  // 11. Bottom Navigation Tab Change
  const handleTabChange = (tab: string) => {
    logger.debug('Tab changed', { tab }, 'NAVIGATION');
    setActiveTab(tab);
    setCurrentScreen(tab as Screen);
  };

  // 12. Matches → Match Detail
  const handleMatchSelect = (matchId: string) => {
    logNavigation('match-detail', { matchId });
    setSelectedMatchId(matchId);
    setCurrentScreen('match-detail');
  };

  // 12b. Matches → Match Result Summary (for finished matches)
  const handleMatchResultSelect = (matchId: string) => {
    logNavigation('match-result-summary', { matchId });
    setSelectedMatchId(matchId);
    setCurrentScreen('match-result-summary');
  };

  // 13. Dashboard Navigation
  const handleDashboardNavigate = (screen: string, params?: any) => {
    logNavigation(screen, params);
    
    switch (screen) {
      case 'notifications':
        setCurrentScreen('notifications');
        break;
      case 'matches':
        // ✅ Takım seçildiğinde o takımın maçlarını göster
        if (params?.teamId) {
          setSelectedTeamIds(prev => prev.includes(params.teamId) ? prev : [...prev, params.teamId]);
          // Parametreleri window'a kaydet (matches ekranında kullanmak için)
          (window as any).__matchParams = {
            teamId: params.teamId,
            teamName: params.teamName,
          };
          logger.debug(`Navigating to matches with team: ${params.teamName}`, { teamId: params.teamId }, 'DASHBOARD');
        }
        setCurrentScreen('matches');
        break;
      case 'profile':
        // If navigating from Dashboard "Tüm Rozetlerimi Gör" button, show badges tab
        const showBadgesTab = params?.showBadges === true;
        setActiveTab(showBadgesTab ? 'badges' : 'profile');
        setCurrentScreen('profile');
        break;
      case 'matches':
        setActiveTab('matches');
        setCurrentScreen('matches');
        break;
      case 'finished':
        setActiveTab('finished');
        setCurrentScreen('finished');
        break;
      case 'match-detail':
        if (params?.id) {
          setSelectedMatchId(params.id);
          // Store params for MatchDetail component to access
          (window as any).__matchDetailParams = {
            initialTab: params?.initialTab || 'squad',
            focus: params?.focus,
          };
          setCurrentScreen('match-detail');
        }
        break;
      case 'home':
        setCurrentScreen('home');
        break;
      case 'achievements':
        // TODO: Achievements page
        logger.debug('Achievements page navigation', undefined, 'DASHBOARD');
        break;
      default:
        logger.warn('Unknown navigation target', { screen }, 'DASHBOARD');
    }
  };

  // 12. Profile → Settings
  const handleProfileSettings = () => {
    logNavigation('profile-settings');
    setCurrentScreen('profile-settings');
  };

  // 13. Profile → Pro Upgrade
  // 16. Navigate to PRO Upgrade
  const handleProUpgrade = () => {
    logNavigation('pro-upgrade');
    setCurrentScreen('pro-upgrade');
  };

  // 17. PRO Upgrade Success
  const handleUpgradeSuccess = async () => {
    logger.info('PRO upgrade success', undefined, 'PRO_UPGRADE');
    // Save PRO status to AsyncStorage
    const { STORAGE_KEYS } = await import('./src/config/constants');
    const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      userData.is_pro = true;
      userData.isPro = true; // Both formats for compatibility
      userData.isPremium = true;
      userData.plan = 'pro';
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      logger.debug('PRO status saved to AsyncStorage', undefined, 'PRO_UPGRADE');
    }
    await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
    logNavigation('profile');
    setCurrentScreen('profile');
  };
  
  // 🧪 TEST: Set user as Pro (for testing)
  const setUserProForTest = async () => {
    try {
      const { STORAGE_KEYS } = await import('./src/config/constants');
      const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.is_pro = true;
        userData.isPro = true;
        userData.isPremium = true;
        userData.plan = 'pro';
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
        console.log('✅ User set as Pro! You can now select club teams.');
        alert('✅ Pro olarak ayarlandınız! Artık kulüp takımları seçebilirsiniz.');
        // Refresh current screen
        if (currentScreen === 'profile') {
          setCurrentScreen('profile');
        }
      } else {
        alert('❌ Kullanıcı bulunamadı. Lütfen önce giriş yapın.');
      }
    } catch (error) {
      console.error('Error setting user as Pro:', error);
      alert('Hata: ' + error);
    }
  };
  
  // Make it available globally for testing
  if (typeof window !== 'undefined') {
    (window as any).setUserPro = setUserProForTest;
  }

  // 14. Profile Settings → Change Password
  const handleNavigateToChangePassword = () => {
    logNavigation('change-password');
    setCurrentScreen('change-password');
  };

  // 15. Profile Settings → Notifications
  const handleNavigateToNotifications = () => {
    logNavigation('notifications');
    setCurrentScreen('notifications');
  };

  // 16. Profile Settings → Delete Account
  const handleNavigateToDeleteAccount = () => {
    logNavigation('delete-account');
    setCurrentScreen('delete-account');
  };

  // 17. Profile Settings → Logout
  const handleLogout = async () => {
    logger.info('Logging out', undefined, 'AUTH');
    try {
      // Sadece user session'ı temizle - dil ve takım seçimini koru
      await AsyncStorage.removeItem('fan-manager-user');
      logger.debug('User session cleared', undefined, 'AUTH');
      logNavigation('auth');
      setCurrentScreen('auth');
    } catch (error) {
      logger.error('Logout error', { error }, 'AUTH');
      // Hata olsa bile auth'a git
      setCurrentScreen('auth');
    }
  };

  // 18. Delete Account → Confirm
  const handleDeleteAccountConfirm = async () => {
    logger.info('Account deleted', undefined, 'DELETE_ACCOUNT');
    await AsyncStorage.clear();
    logNavigation('splash');
    setCurrentScreen('splash');
  };

  // 19. Navigate to Legal Document
  const handleNavigateToLegal = (documentType: string) => {
    logNavigation('legal', { documentType });
    setLegalDocumentType(documentType);
    setCurrentScreen('legal');
  };

  // ==========================================
  // SCREEN RENDERING
  // ==========================================

  // Helper to wrap screen with animation
  const wrapWithAnimation = (screen: React.ReactNode, key: string) => {
    const isForward = previousScreen && (
      (previousScreen === 'splash' && currentScreen !== 'splash') ||
      (previousScreen === 'language' && currentScreen === 'auth') ||
      (previousScreen === 'auth' && currentScreen === 'register') ||
      (previousScreen === 'home' && currentScreen !== 'home')
    );
    
    return (
      <Animated.View
        key={key}
        {...(Platform.OS !== 'web' ? {
          entering: isForward ? SlideInRight.duration(300) : FadeIn.duration(250),
          exiting: isForward ? SlideOutLeft.duration(250) : FadeOut.duration(200),
        } : {})}
        style={{ flex: 1 }}
      >
        {screen}
      </Animated.View>
    );
  };

  const renderScreen = () => {
    try {
      // ✅ OAuth işlenirken splash gösterme - bekle
      if (isProcessingOAuth) {
        return (
          <View style={{ flex: 1, backgroundColor: '#0a1612', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#1FA2A6', fontSize: 18, marginBottom: 10 }}>Giriş yapılıyor...</Text>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Lütfen bekleyin</Text>
          </View>
        );
      }
      
      switch (currentScreen) {
        case 'splash':
          return wrapWithAnimation(<SplashScreen onComplete={handleSplashComplete} />, 'splash');
        
        case 'onboarding':
          return wrapWithAnimation(
            <OnboardingScreen
              onComplete={handleOnboardingComplete}
            />,
            'onboarding'
          );
        
        case 'language':
          return wrapWithAnimation(
            <LanguageSelectionScreen
              onLanguageSelect={handleLanguageSelect}
            />,
            'language'
          );
        
        case 'age-gate':
          return wrapWithAnimation(
            <AgeGateScreen
              onComplete={handleAgeGateComplete}
            />,
            'age-gate'
          );
        
        case 'auth':
          return wrapWithAnimation(
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              onForgotPassword={handleForgotPassword}
              onRegister={handleRegister}
              onBack={() => {
                setPreviousScreen(currentScreen);
                setCurrentScreen('onboarding');
              }}
            />,
            'auth'
          );
        
        case 'register':
          return (
            <RegisterScreen
              onRegisterSuccess={handleRegisterSuccess}
              onBack={handleRegisterBack}
              onNavigateToLegal={handleNavigateToLegal}
            />
          );
        
        case 'forgot-password':
          return (
            <ForgotPasswordScreen
              onBack={handleForgotPasswordBack}
            />
          );
        
        case 'profile-setup':
          return (
            <ProfileSetupScreen
              onComplete={handleProfileSetupComplete}
              onBack={() => setCurrentScreen('auth')}
            />
          );
        
        case 'home':
          return (
            <Dashboard
              onNavigate={handleDashboardNavigate}
              matchData={matchData}
              selectedTeamIds={selectedTeamIds}
            />
          );
        
        case 'matches':
          // ✅ Dashboard'dan gelen teamId parametresini kontrol et
          const matchParams = (window as any).__matchParams || {};
          const teamIdFromParams = matchParams.teamId;
          const teamNameFromParams = matchParams.teamName;
          
          // Eğer parametre varsa, selectedTeamIds'yi güncelle
          if (teamIdFromParams && !selectedTeamIds.includes(teamIdFromParams)) {
            setSelectedTeamIds(prev => [...prev, teamIdFromParams]);
          }
          
          return (
            <MatchListScreen
              onMatchSelect={handleMatchSelect}
              onMatchResultSelect={handleMatchResultSelect}
              onProfileClick={handleProfileClick}
              matchData={matchData}
              selectedTeamId={selectedTeamIds[0] || teamIdFromParams} // ✅ İlk seçilen takım (backward compat)
              selectedTeamName={teamNameFromParams} // ✅ Takım adı (başlık için)
              onBack={selectedTeamIds.length > 0 || teamIdFromParams ? () => {
                setSelectedTeamIds([]); // Takım filtresini temizle
                (window as any).__matchParams = {}; // Parametreleri temizle
                setCurrentScreen('home'); // Ana sayfaya geri dön
              } : undefined}
            />
          );
        
        case 'finished':
          // ✅ Biten maçlar sekmesi
          return (
            <MatchListScreen
              onMatchSelect={handleMatchSelect}
              onMatchResultSelect={handleMatchResultSelect}
              onProfileClick={handleProfileClick}
              matchData={matchData}
              selectedTeamId={selectedTeamIds[0]}
              showOnlyFinished={true} // ✅ Sadece biten maçları göster
            />
          );
        
        case 'leaderboard':
          return <Leaderboard onNavigate={handleProfileClick} />;
        
        case 'match-detail':
          if (!selectedMatchId) {
            logger.error('No matchId for MatchDetail', undefined, 'NAVIGATION');
            setCurrentScreen('home');
            return null;
          }
          // Get initialTab from navigation params (if any)
          const matchDetailParams = (window as any).__matchDetailParams || {};
          return (
            <MatchDetail
              matchId={selectedMatchId}
              initialTab={matchDetailParams.initialTab || 'squad'}
              onBack={() => {
                setSelectedMatchId(null);
                setCurrentScreen('home');
              }}
            />
          );
        
        case 'match-result-summary':
          if (!selectedMatchId) {
            logger.error('No matchId for MatchResultSummary', undefined, 'NAVIGATION');
            setCurrentScreen('home');
            return null;
          }
          return (
            <MatchResultSummaryScreen
              matchData={{ id: selectedMatchId }}
              onBack={() => {
                setSelectedMatchId(null);
                setCurrentScreen('matches');
              }}
            />
          );
        
        case 'profile':
          // Check if we should show badges tab (from Dashboard button)
          // activeTab will be 'badges' if navigated from Dashboard button
          const shouldShowBadgesTab = activeTab === 'badges';
          return (
            <ProfileScreen
              onBack={() => {
                setActiveTab('home');
                setCurrentScreen('home');
              }}
              onSettings={handleProfileSettings}
              onTeamSelect={(teamId, teamName) => {
                // ✅ Takım seçildiğinde o takımın maçlarını göster
                logger.debug(`Team selected: ${teamName}`, { teamId }, 'PROFILE');
                setSelectedTeamId(teamId); // Takım ID'sini kaydet
                setCurrentScreen('matches'); // Matches ekranına git, orada filtreleme yapılacak
              }}
              onTeamsChange={() => {
                // ✅ Takım değiştiğinde ProfileCard'daki listeyi de güncelle
                refetchFavoriteTeams();
              }}
              onProUpgrade={handleProUpgrade}
              onDatabaseTest={() => setCurrentScreen('database-test')}
              initialTab={shouldShowBadgesTab ? 'badges' : 'profile'}
            />
          );
        
        case 'profile-settings':
          return (
            <ProfileSettingsScreen
              onBack={() => setCurrentScreen('profile')}
              onNavigateToLanguage={() => setCurrentScreen('language')}
              onLogout={handleLogout}
              onNavigateToChangePassword={handleNavigateToChangePassword}
              onNavigateToNotifications={handleNavigateToNotifications}
              onNavigateToDeleteAccount={handleNavigateToDeleteAccount}
              onNavigateToProUpgrade={handleProUpgrade}
            />
          );
        
        case 'change-password':
          return (
            <ChangePasswordScreen
              onBack={() => setCurrentScreen('profile-settings')}
            />
          );
        
        case 'notifications':
          return (
            <NotificationsScreen
              onBack={() => setCurrentScreen('profile-settings')}
            />
          );
        
        case 'delete-account':
          return (
            <DeleteAccountScreen
              onBack={() => setCurrentScreen('profile-settings')}
              onDeleteConfirm={handleDeleteAccountConfirm}
            />
          );
        
        case 'legal':
          return (
            <LegalDocumentScreen
              documentType={legalDocumentType}
              onBack={() => setCurrentScreen('register')}
            />
          );
        
        case 'pro-upgrade':
          return (
            <ProUpgradeScreen
              onBack={() => setCurrentScreen('profile')}
              onUpgradeSuccess={handleUpgradeSuccess}
            />
          );
        
        case 'database-test':
          return (
            <DatabaseTestScreen
              onBack={() => setCurrentScreen('profile')}
            />
          );
        
        default:
          return <SplashScreen onComplete={handleSplashComplete} />;
      }
    } catch (error) {
      logger.error('Screen render error', { error, screen: currentScreen }, 'APP');
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error loading screen</Text>
          <Text style={styles.errorDetails}>{String(error)}</Text>
        </View>
      );
    }
  };
  
  // Check if current screen should show bottom navigation
  const shouldShowBottomNav = ['home', 'matches', 'finished', 'leaderboard', 'tournaments', 'profile'].includes(currentScreen);

  // Web için debug log
  if (Platform.OS === 'web' && __DEV__) {
    logger.debug('App rendering', { currentScreen, platform: Platform.OS }, 'APP');
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <PredictionProvider>
            <MatchProvider>
              {/* Maintenance Mode Check */}
              {isMaintenanceMode ? (
                <MaintenanceScreen />
              ) : (
                <View style={{ flex: 1, backgroundColor: '#0F2A24' }}>
                  {renderScreen()}
                  
                  {/* Fixed Profile Card Overlay - Only on home, matches, leaderboard */}
                  {['home', 'matches', 'finished', 'leaderboard', 'profile'].includes(currentScreen) && (
                    <View style={styles.profileCardOverlay}>
                      <ProfileCard 
                        onPress={() => handleDashboardNavigate('profile')} 
                        newBadge={newBadge}
                        onBadgePopupClose={async () => {
                          // Mark badge as shown when popup is closed
                          if (newBadge) {
                            await markBadgeAsShown(newBadge.id);
                            badgeShownRef.current.add(newBadge.id);
                          }
                          setNewBadge(null);
                        }}
                        // ✅ Takım filtre props'ları - home ve matches ekranlarında göster
                        favoriteTeams={favoriteTeams}
                        selectedTeamIds={selectedTeamIds}
                        onTeamSelect={(teamId) => {
                          if (teamId === null) {
                            // Tümü seçildi - filtreyi temizle
                            setSelectedTeamIds([]);
                          } else {
                            // Toggle: seçili ise kaldır, değilse ekle
                            setSelectedTeamIds(prev => 
                              prev.includes(teamId) 
                                ? prev.filter(id => id !== teamId)
                                : [...prev, teamId]
                            );
                          }
                        }}
                        showTeamFilter={['home', 'matches', 'finished', 'leaderboard', 'profile'].includes(currentScreen)}
                      />
                    </View>
                  )}
                  
                  {/* Bottom Navigation - Only show on main screens */}
                  {shouldShowBottomNav && (
                    <BottomNavigation
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                    />
                  )}
                </View>
              )}
            </MatchProvider>
          </PredictionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: DARK_MODE.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  profileCardOverlay: {
    position: 'absolute',
    top: 0, // Ekranın en üstüne kadar
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    backgroundColor: 'transparent',
    paddingTop: 0, // Üst padding kaldırıldı - her ekran kendi padding'ini yönetir
    paddingBottom: 8,
    paddingHorizontal: 0,
    pointerEvents: 'box-none',
    // Gölge ve border efektleri kaldırıldı
  },
});
