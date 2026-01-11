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
import { ProfileCard } from './src/components/ProfileCard';

// Web için UIManager polyfills
if (Platform.OS === 'web') {
  if (!UIManager || typeof UIManager.focus !== 'function') {
    // @ts-ignore - Web için UIManager polyfills
    if (typeof UIManager === 'object') {
      UIManager.focus = () => {
        console.warn('UIManager.focus is not supported on web');
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
  
  // Web için zoom engelleme - Agresif çözüm
  if (typeof document !== 'undefined') {
    // Zoom seviyesini sürekli kontrol et ve sıfırla
    const preventZoom = () => {
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
          root.style.transform = 'scale(1)';
          root.style.webkitTransform = 'scale(1)';
        }
      }
    };
    
    // Her 50ms'de bir kontrol et
    setInterval(preventZoom, 50);
    
    // Event listener'lar
    window.addEventListener('resize', preventZoom);
    window.addEventListener('focus', preventZoom);
    document.addEventListener('DOMContentLoaded', preventZoom);
    window.addEventListener('load', preventZoom);
    
    // Çift tıklama engelle
    document.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      preventZoom();
      return false;
    }, true);
  }
}

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import FavoriteTeamsScreen from './src/screens/FavoriteTeamsScreen';
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
  | 'language'
  | 'auth'
  | 'register'
  | 'forgot-password'
  | 'favorite-teams'
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
  | 'database-test';

// Ignore warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [legalDocumentType, setLegalDocumentType] = useState<string>('terms');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);

  // 🎉 Yeni Rozet State (Test için başlangıçta bir rozet gösterelim)
  const [newBadge, setNewBadge] = useState<{ id: string; name: string; emoji: string; description: string; tier: number } | null>(null);
  const badgeShownRef = useRef<Set<string>>(new Set()); // Track shown badges in this session using ref
  const testBadgeTimerRef = useRef<NodeJS.Timeout | null>(null); // Track test badge timer

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
        const { hasBadgeBeenShown } = await import('./src/services/badgeService');
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

  // 1. Splash Complete
  const handleSplashComplete = async (hasUser: boolean) => {
    console.log('✅ [SPLASH] Complete! Has user:', hasUser);
    
    try {
      if (hasUser) {
        // User exists → Go to Home (or check favorite teams)
        const hasTeams = await AsyncStorage.getItem('fan-manager-favorite-clubs');
        if (hasTeams) {
          console.log('→ Going to HOME');
          setCurrentScreen('home');
        } else {
          console.log('→ Going to FAVORITE TEAMS');
          setCurrentScreen('favorite-teams');
        }
      } else {
        // No user → Language Selection
        console.log('→ Going to LANGUAGE SELECTION');
        setCurrentScreen('language');
      }
    } catch (error) {
      console.error('Error in splash complete:', error);
      setCurrentScreen('language');
    }
  };

  // 2. Language Selection
  const handleLanguageSelect = async (lang: string) => {
    console.log('✅ [LANGUAGE] Selected:', lang);
    await AsyncStorage.setItem('fan-manager-language', lang);
    console.log('→ Going to AUTH');
    setCurrentScreen('auth');
  };

  // 3. Auth → Login Success
  const handleLoginSuccess = async () => {
    console.log('✅ [AUTH] Login Success!');
    await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ authenticated: true }));
    
    const hasTeams = await AsyncStorage.getItem('fan-manager-favorite-clubs');
    if (hasTeams) {
      console.log('→ Going to HOME');
      setCurrentScreen('home');
    } else {
      console.log('→ Going to FAVORITE TEAMS');
      setCurrentScreen('favorite-teams');
    }
  };

  // 4. Auth → Forgot Password
  const handleForgotPassword = () => {
    console.log('→ Going to FORGOT PASSWORD');
    setCurrentScreen('forgot-password');
  };

  // 5. Auth → Register
  const handleRegister = () => {
    console.log('→ Going to REGISTER');
    setCurrentScreen('register');
  };

  // 6. Register → Success
  const handleRegisterSuccess = async () => {
    console.log('✅ [REGISTER] Success!');
    await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ authenticated: true }));
    console.log('→ Going to FAVORITE TEAMS');
    setCurrentScreen('favorite-teams');
  };

  // 7. Forgot Password → Back to Auth
  const handleForgotPasswordBack = () => {
    console.log('→ Back to AUTH');
    setCurrentScreen('auth');
  };

  // 8. Register → Back to Auth
  const handleRegisterBack = () => {
    console.log('→ Back to AUTH');
    setCurrentScreen('auth');
  };

  // 9. Favorite Teams → Complete
  const handleFavoriteTeamsComplete = async (selectedTeams: Array<{ id: number; name: string; logo: string; league?: string }>) => {
    console.log('✅ [FAVORITE TEAMS] Selected with IDs:', selectedTeams);
    if (selectedTeams.length === 0) {
      console.warn('⚠️ No teams selected!');
      return;
    }
    
    // Artık takımlar doğrudan API ID'leriyle geliyor
    const favoriteTeamsData = selectedTeams.map(team => ({
      id: team.id,
      name: team.name,
      logo: team.logo,
      league: team.league,
    }));
    
    await AsyncStorage.setItem('fan-manager-favorite-clubs', JSON.stringify(favoriteTeamsData));
    console.log('💾 Saved favorite teams with IDs:', favoriteTeamsData);
    
    // Takım seçimi sonrası MainTabs'a geç (Home tab default)
    // Kullanıcı profil ekranını görmek için tab menüsünden Profile'a tıklayabilir
    console.log('→ Going to MainTabs (Home tab)');
    setActiveTab('home');
    setCurrentScreen('home');
  };

  // 10. Matches → Profile
  const handleProfileClick = () => {
    console.log('→ Going to PROFILE');
    setCurrentScreen('profile');
  };

  // 11. Bottom Navigation Tab Change
  const handleTabChange = (tab: string) => {
    console.log('→ Tab changed:', tab);
    setActiveTab(tab);
    setCurrentScreen(tab as Screen);
  };

  // 12. Matches → Match Detail
  const handleMatchSelect = (matchId: string) => {
    console.log('→ Match selected:', matchId);
    setSelectedMatchId(matchId);
    setCurrentScreen('match-detail');
  };

  // 12b. Matches → Match Result Summary (for finished matches)
  const handleMatchResultSelect = (matchId: string) => {
    console.log('→ Finished match selected:', matchId);
    setSelectedMatchId(matchId);
    setCurrentScreen('match-result-summary');
  };

  // 13. Dashboard Navigation
  const handleDashboardNavigate = (screen: string, params?: any) => {
    console.log('→ Dashboard navigate:', screen, params);
    
    switch (screen) {
      case 'notifications':
        setCurrentScreen('notifications');
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
        console.log('Achievements page');
        break;
      default:
        console.log('Unknown navigation target:', screen);
    }
  };

  // 12. Profile → Settings
  const handleProfileSettings = () => {
    console.log('→ Going to PROFILE SETTINGS');
    setCurrentScreen('profile-settings');
  };

  // 13. Profile → Pro Upgrade
  // 16. Navigate to PRO Upgrade
  const handleProUpgrade = () => {
    console.log('→ Going to PRO UPGRADE');
    setCurrentScreen('pro-upgrade');
  };

  // 17. PRO Upgrade Success
  const handleUpgradeSuccess = async () => {
    console.log('✅ [PRO UPGRADE] Success!');
    // TODO: Save PRO status to AsyncStorage
    await AsyncStorage.setItem('fan-manager-pro-status', 'true');
    console.log('→ Going back to PROFILE');
    setCurrentScreen('profile');
  };

  // 14. Profile Settings → Change Password
  const handleNavigateToChangePassword = () => {
    console.log('→ Going to CHANGE PASSWORD');
    setCurrentScreen('change-password');
  };

  // 15. Profile Settings → Notifications
  const handleNavigateToNotifications = () => {
    console.log('→ Going to NOTIFICATIONS');
    setCurrentScreen('notifications');
  };

  // 16. Profile Settings → Delete Account
  const handleNavigateToDeleteAccount = () => {
    console.log('→ Going to DELETE ACCOUNT');
    setCurrentScreen('delete-account');
  };

  // 17. Profile Settings → Logout
  const handleLogout = async () => {
    console.log('🚪 [LOGOUT] Logging out...');
    try {
      // Sadece user session'ı temizle - dil ve takım seçimini koru
      await AsyncStorage.removeItem('fan-manager-user');
      console.log('✅ User session cleared');
      console.log('→ Going to AUTH');
      setCurrentScreen('auth');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Hata olsa bile auth'a git
      setCurrentScreen('auth');
    }
  };

  // 18. Delete Account → Confirm
  const handleDeleteAccountConfirm = async () => {
    console.log('🗑️ [DELETE ACCOUNT] Account deleted');
    await AsyncStorage.clear();
    console.log('→ Going to SPLASH');
    setCurrentScreen('splash');
  };

  // 19. Navigate to Legal Document
  const handleNavigateToLegal = (documentType: string) => {
    console.log('→ Going to LEGAL DOCUMENT:', documentType);
    setLegalDocumentType(documentType);
    setCurrentScreen('legal');
  };

  // ==========================================
  // SCREEN RENDERING
  // ==========================================

  const renderScreen = () => {
    try {
      switch (currentScreen) {
        case 'splash':
          return <SplashScreen onComplete={handleSplashComplete} />;
        
        case 'language':
          return (
            <LanguageSelectionScreen
              onLanguageSelect={handleLanguageSelect}
            />
          );
        
        case 'auth':
          return (
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              onForgotPassword={handleForgotPassword}
              onRegister={handleRegister}
              onBack={() => setCurrentScreen('language')}
            />
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
        
        case 'favorite-teams':
          return (
            <FavoriteTeamsScreen
              onComplete={handleFavoriteTeamsComplete}
              onBack={() => setCurrentScreen('auth')}
            />
          );
        
        case 'home':
          return (
            <Dashboard
              onNavigate={handleDashboardNavigate}
              matchData={matchData}
            />
          );
        
        case 'matches':
          return (
            <MatchListScreen
              onMatchSelect={handleMatchSelect}
              onMatchResultSelect={handleMatchResultSelect}
              onProfileClick={handleProfileClick}
              matchData={matchData}
            />
          );
        
        case 'leaderboard':
          return <Leaderboard onNavigate={handleProfileClick} />;
        
        case 'match-detail':
          if (!selectedMatchId) {
            console.error('No matchId for MatchDetail');
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
            console.error('No matchId for MatchResultSummary');
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
              onProUpgrade={handleProUpgrade}
              onDatabaseTest={() => setCurrentScreen('database-test')}
              initialTab={shouldShowBadgesTab ? 'badges' : 'profile'}
            />
          );
        
        case 'profile-settings':
          return (
            <ProfileSettingsScreen
              onBack={() => setCurrentScreen('profile')}
              onNavigateToFavoriteTeams={() => setCurrentScreen('favorite-teams')}
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
      console.error('❌ Screen render error:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error loading screen</Text>
          <Text style={styles.errorDetails}>{String(error)}</Text>
        </View>
      );
    }
  };
  
  // Check if current screen should show bottom navigation
  const shouldShowBottomNav = ['home', 'matches', 'leaderboard', 'tournaments', 'profile'].includes(currentScreen);

  // Web için console log
  if (Platform.OS === 'web' && __DEV__) {
    console.log('🚀 App rendering, currentScreen:', currentScreen);
    console.log('📱 Platform:', Platform.OS);
    console.log('🎨 ThemeProvider:', ThemeProvider);
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
                <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
                  {Platform.OS === 'web' && __DEV__ && (
                    <View style={{ padding: 10, backgroundColor: '#1E293B' }}>
                      <Text style={{ color: '#FFF', fontSize: 12 }}>
                        Debug: Screen = {currentScreen}
                      </Text>
                    </View>
                  )}
                  {renderScreen()}
                  
                  {/* Fixed Profile Card Overlay - Only on home, matches, leaderboard */}
                  {['home', 'matches', 'leaderboard'].includes(currentScreen) && (
                    <View style={styles.profileCardOverlay}>
                      <ProfileCard 
                        onPress={() => handleDashboardNavigate('profile')} 
                        newBadge={newBadge}
                        onBadgePopupClose={async () => {
                          // Mark badge as shown when popup is closed
                          if (newBadge) {
                            const { markBadgeAsShown } = await import('./src/services/badgeService');
                            await markBadgeAsShown(newBadge.id);
                            badgeShownRef.current.add(newBadge.id);
                          }
                          setNewBadge(null);
                        }}
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
    backgroundColor: '#0F172A',
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
    top: 10, // 10px aşağı kaydırıldı
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
});
