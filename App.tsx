import React, { useState, useEffect, useRef } from 'react';
import { LogBox, View, Text, StyleSheet, Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { PredictionProvider } from './src/contexts/PredictionContext';
import { MatchProvider } from './src/contexts/MatchContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import { useFavoriteTeamMatches } from './src/hooks/useFavoriteTeamMatches';
import { useFavoriteTeams } from './src/hooks/useFavoriteTeams';
import { ProfileCard } from './src/components/ProfileCard';
import { DARK_MODE } from './src/theme/theme';
import { markBadgeAsShown } from './src/services/badgeService';
import { logger } from './src/utils/logger';
import { useAppNavigation } from './src/hooks/useAppNavigation';
import { useOAuth } from './src/hooks/useOAuth';
import { initWebZoomPrevention } from './src/utils/webZoomPrevention';
import { getUserTimezone } from './src/utils/timezoneUtils';

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
import i18n from './src/i18n';
import { useTranslation } from 'react-i18next';

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
  
  // Initialize Web Zoom Prevention
  initWebZoomPrevention();
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

// Ignore warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const { i18n: i18nInstance } = useTranslation();
  
  // 🌍 Dil değişikliğini zorla algıla - useTranslation + manuel listener
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  
  useEffect(() => {
    const handler = (lng: string) => {
      console.log('[App] Language changed to:', lng);
      setForceUpdateKey(prev => prev + 1);
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);
  
  // i18n.language her zaman güncel dili verir
  const currentLang = i18nInstance?.language?.split('-')[0] || i18n.language || 'en';

  // Use Navigation Hook
  const { state: navState, actions: navActions, handlers: navHandlers, refs: navRefs } = useAppNavigation();
  const { 
    currentScreen, previousScreen, activeTab, selectedMatchId, 
    selectedTeamIds, isMaintenanceMode, isProcessingOAuth, oauthCompleted 
  } = navState;

  // Use OAuth Hook
  useOAuth({ navActions, navRefs });

  // ✅ Favori takımlar hook'u - ProfileCard'a aktarılacak ve ProfileScreen ile paylaşılacak
  const { favoriteTeams, loading: teamsLoading, refetch: refetchFavoriteTeams, setAllFavoriteTeams } = useFavoriteTeams();

  // 🎉 Yeni Rozet State (Test için başlangıçta bir rozet gösterelim)
  const [newBadge, setNewBadge] = useState<{ id: string; name: string; emoji: string; description: string; tier: number } | null>(null);
  const badgeShownRef = useRef<Set<string>>(new Set()); // Track shown badges in this session using ref
  const testBadgeTimerRef = useRef<NodeJS.Timeout | null>(null); // Track test badge timer
  
  // TEST: 5 saniye sonra yeni rozet göster (gerçekte maç sonunda kazanılacak)
  useEffect(() => {
    // Clear any existing timer
    if (testBadgeTimerRef.current) {
      clearTimeout(testBadgeTimerRef.current);
      testBadgeTimerRef.current = null;
    }

    // Cleanup function
    return () => {
      if (testBadgeTimerRef.current) {
        clearTimeout(testBadgeTimerRef.current);
        testBadgeTimerRef.current = null;
      }
    };
  }, [currentScreen]);

  // Global match data - shared across all screens
  // ✅ favoriteTeams'i doğrudan geçiyoruz, böylece güncellenince maçlar da güncellenir
  const matchData = useFavoriteTeamMatches(favoriteTeams);
  
  // 🔍 DEBUG: Favori takımlar ve maç durumunu logla
  // Saat dilimi cache'ini uygulama başında yükle (maç saatleri doğru gösterilsin)
  useEffect(() => {
    getUserTimezone().catch(() => {});
  }, []);

  useEffect(() => {
    if (favoriteTeams && favoriteTeams.length > 0) {
      console.log('✅ Favori takımlar yüklendi:', favoriteTeams.map(t => `${t.name} (${t.id})`));
      console.log('📊 Maç durumu:', {
        past: matchData.pastMatches.length,
        live: matchData.liveMatches.length,
        upcoming: matchData.upcomingMatches.length,
        loading: matchData.loading,
        error: matchData.error
      });
    } else {
      console.log('⚠️ Henüz favori takım yok veya yükleniyor...', { teamsLoading });
    }
  }, [favoriteTeams, matchData.pastMatches.length, matchData.liveMatches.length, matchData.upcomingMatches.length]);

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
          return wrapWithAnimation(<SplashScreen onComplete={navHandlers.handleSplashComplete} />, 'splash');
        
        case 'onboarding':
          return wrapWithAnimation(
            <OnboardingScreen
              onComplete={navHandlers.handleOnboardingComplete}
            />,
            'onboarding'
          );
        
        case 'language':
          return wrapWithAnimation(
            <LanguageSelectionScreen
              onLanguageSelect={navHandlers.handleLanguageSelect}
            />,
            'language'
          );
        
        case 'age-gate':
          return wrapWithAnimation(
            <AgeGateScreen
              onComplete={navHandlers.handleAgeGateComplete}
            />,
            'age-gate'
          );
        
        case 'auth':
          return wrapWithAnimation(
            <AuthScreen
              onLoginSuccess={navHandlers.handleLoginSuccess}
              onForgotPassword={navHandlers.handleForgotPassword}
              onRegister={navHandlers.handleRegister}
              onBack={() => {
                navActions.setPreviousScreen(currentScreen);
                navActions.setCurrentScreen('onboarding');
              }}
            />,
            'auth'
          );
        
        case 'register':
          return (
            <RegisterScreen
              onRegisterSuccess={navHandlers.handleRegisterSuccess}
              onBack={navHandlers.handleRegisterBack}
              onNavigateToLegal={navHandlers.handleNavigateToLegal}
            />
          );
        
        case 'forgot-password':
          return (
            <ForgotPasswordScreen
              onBack={navHandlers.handleForgotPasswordBack}
            />
          );
        
        case 'profile-setup':
          return (
            <ProfileSetupScreen
              onComplete={navHandlers.handleProfileSetupComplete}
              onBack={() => navActions.setCurrentScreen('auth')}
            />
          );
        
        case 'home':
          return (
            <Dashboard
              onNavigate={navHandlers.handleDashboardNavigate}
              matchData={matchData}
              selectedTeamIds={selectedTeamIds}
            />
          );
        
        case 'matches':
          return (
            <MatchListScreen
              onMatchSelect={navHandlers.handleMatchSelect}
              onMatchResultSelect={navHandlers.handleMatchResultSelect}
              onProfileClick={navHandlers.handleProfileClick}
              matchData={matchData}
              selectedTeamIds={selectedTeamIds}
            />
          );
        
        case 'finished':
          return (
            <MatchListScreen
              onMatchSelect={navHandlers.handleMatchSelect}
              onMatchResultSelect={navHandlers.handleMatchResultSelect}
              onProfileClick={navHandlers.handleProfileClick}
              matchData={matchData}
              selectedTeamIds={selectedTeamIds}
              showOnlyFinished={true}
            />
          );
        
        case 'leaderboard':
          return <Leaderboard onNavigate={navHandlers.handleProfileClick} />;
        
        case 'match-detail':
          if (!selectedMatchId) {
            logger.error('No matchId for MatchDetail', undefined, 'NAVIGATION');
            navActions.setCurrentScreen('home');
            return null;
          }
          // Get initialTab and analysisFocus from navigation params (web + native)
          const matchDetailParams = (typeof global !== 'undefined' && (global as any).__matchDetailParams) || (typeof window !== 'undefined' && (window as any).__matchDetailParams) || {};
          return (
            <MatchDetail
              matchId={selectedMatchId}
              initialTab={matchDetailParams.initialTab || 'squad'}
              analysisFocus={matchDetailParams.analysisFocus}
              preloadedMatch={matchDetailParams.matchData}
              onBack={() => {
                navActions.setSelectedMatchId(null);
                if (typeof global !== 'undefined') (global as any).__matchDetailParams = {};
                if (typeof window !== 'undefined') (window as any).__matchDetailParams = {};
                navActions.setCurrentScreen('home');
              }}
            />
          );
        
        case 'match-result-summary':
          if (!selectedMatchId) {
            logger.error('No matchId for MatchResultSummary', undefined, 'NAVIGATION');
            navActions.setCurrentScreen('home');
            return null;
          }
          return (
            <MatchResultSummaryScreen
              matchData={{ id: selectedMatchId }}
              onBack={() => {
                navActions.setSelectedMatchId(null);
                navActions.setCurrentScreen('matches');
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
                navActions.setActiveTab('home');
                navActions.setCurrentScreen('home');
              }}
              onSettings={navHandlers.handleProfileSettings}
              onTeamSelect={(teamId, teamName) => {
                // ✅ Takım seçildiğinde o takımın maçlarını göster
                logger.debug(`Team selected: ${teamName}`, { teamId }, 'PROFILE');
                navActions.setSelectedTeamIds([teamId]); // Takım ID'sini kaydet (artık array)
                navActions.setCurrentScreen('matches'); // Matches ekranına git, orada filtreleme yapılacak
              }}
              onTeamsChange={() => {
                // ✅ Takım değiştiğinde maç verilerini güncelle (state zaten güncel)
                logger.info('Teams changed, refreshing matches...', undefined, 'APP');
                matchData.refetch();
              }}
              setAllFavoriteTeamsFromApp={setAllFavoriteTeams}
              onProUpgrade={navHandlers.handleProUpgrade}
              onDatabaseTest={() => navActions.setCurrentScreen('database-test')}
              initialTab={shouldShowBadgesTab ? 'badges' : 'profile'}
            />
          );
        
        case 'profile-settings':
          return (
            <ProfileSettingsScreen
              onBack={() => navActions.setCurrentScreen('profile')}
              onNavigateToLanguage={() => navActions.setCurrentScreen('language')}
              onLogout={navHandlers.handleLogout}
              onNavigateToChangePassword={navHandlers.handleNavigateToChangePassword}
              onNavigateToNotifications={navHandlers.handleNavigateToNotifications}
              onNavigateToDeleteAccount={navHandlers.handleNavigateToDeleteAccount}
              onNavigateToProUpgrade={navHandlers.handleProUpgrade}
            />
          );
        
        case 'change-password':
          return (
            <ChangePasswordScreen
              onBack={() => navActions.setCurrentScreen('profile-settings')}
            />
          );
        
        case 'notifications':
          return (
            <NotificationsScreen
              onBack={() => navActions.setCurrentScreen('profile-settings')}
            />
          );
        
        case 'delete-account':
          return (
            <DeleteAccountScreen
              onBack={() => navActions.setCurrentScreen('profile-settings')}
              onDeleteConfirm={navHandlers.handleDeleteAccountConfirm}
            />
          );
        
        case 'legal':
          return (
            <LegalDocumentScreen
              documentType={legalDocumentType}
              onBack={() => navActions.setCurrentScreen('register')}
            />
          );
        
        case 'pro-upgrade':
          return (
            <ProUpgradeScreen
              onBack={() => navActions.setCurrentScreen('profile')}
              onUpgradeSuccess={navHandlers.handleUpgradeSuccess}
            />
          );
        
        case 'database-test':
          return (
            <DatabaseTestScreen
              onBack={() => navActions.setCurrentScreen('profile')}
            />
          );
        
        default:
          return <SplashScreen onComplete={navHandlers.handleSplashComplete} />;
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
                <View key={`content-${currentLang}-${forceUpdateKey}`} style={{ flex: 1, backgroundColor: '#0F2A24' }}>
                  {renderScreen()}
                  
                  {/* Fixed Profile Card Overlay - Only on home, matches, leaderboard */}
                  {['home', 'matches', 'finished', 'leaderboard', 'profile'].includes(currentScreen) && (
                    <View style={styles.profileCardOverlay}>
                      <ProfileCard 
                        onPress={() => navHandlers.handleDashboardNavigate('profile')} 
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
                          if (teamId === null || teamId === undefined) {
                            navActions.setSelectedTeamIds([]);
                            return;
                          }
                          const id = Number(teamId);
                          if (Number.isNaN(id)) return;
                          // Functional update: stale closure önlenir, toggle güvenilir çalışır
                          navActions.setSelectedTeamIds((prev: number[]) =>
                            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                          );
                        }}
                        showTeamFilter={['home', 'matches', 'finished', 'leaderboard', 'profile'].includes(currentScreen)}
                      />
                    </View>
                  )}
                  
                  {/* Bottom Navigation - Only show on main screens */}
                  {shouldShowBottomNav && (
                    <BottomNavigation
                      activeTab={activeTab}
                      onTabChange={navHandlers.handleTabChange}
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
