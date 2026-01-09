import React, { useState, useEffect } from 'react';
import { LogBox, View, Text, StyleSheet, Platform, UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import { MAINTENANCE_CONFIG, logVersionInfo } from './src/config/AppVersion';

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
  const handleFavoriteTeamsComplete = async (selectedTeams: string[]) => {
    console.log('✅ [FAVORITE TEAMS] Selected:', selectedTeams);
    if (selectedTeams.length === 0) {
      console.warn('⚠️ No teams selected!');
      return;
    }
    
    // Takım ID'lerini isimle eşleştir (API-Football'da isimle arama yapacağız)
    const teamNames: { [key: string]: string } = {
      '1': 'Galatasaray',
      '2': 'Fenerbahce',
      '3': 'Besiktas',
      '4': 'Trabzonspor',
      '5': 'Istanbul Basaksehir',
      '6': 'Antalyaspor',
      '7': 'Konyaspor',
      '8': 'Sivasspor',
      '9': 'Alanyaspor',
      '10': 'Kasimpasa',
      '11': 'Gaziantep',
      '12': 'Kayserispor',
      '13': 'Rizespor',
      '14': 'Hatayspor',
      '15': 'Adana Demirspor',
      '16': 'Fatih Karagumruk',
      '17': 'Giresunspor',
      '18': 'Umraniyespor',
      // Avrupa takımları
      '19': 'Real Madrid',
      '20': 'Barcelona',
      '21': 'Manchester United',
      '22': 'Liverpool',
      '23': 'Bayern Munich',
      '24': 'Paris Saint Germain',
      '25': 'Juventus',
      '26': 'Inter',
      '27': 'Milan',
      '28': 'Arsenal',
      '29': 'Chelsea',
      '30': 'Manchester City',
      // Milli takımlar
      '101': 'Turkey',
      '102': 'Brazil',
      '103': 'Germany',
      '104': 'Argentina',
    };
    
    const favoriteTeamsData = selectedTeams.map(teamId => ({
      id: parseInt(teamId),
      name: teamNames[teamId] || 'Unknown',
      logo: '',
    }));
    
    await AsyncStorage.setItem('fan-manager-favorite-clubs', JSON.stringify(favoriteTeamsData));
    console.log('💾 Saved favorite teams:', favoriteTeamsData);
    
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
        setActiveTab('profile');
        setCurrentScreen('profile');
        break;
      case 'matches':
        setActiveTab('matches');
        setCurrentScreen('matches');
        break;
      case 'match-detail':
        if (params?.id) {
          setSelectedMatchId(params.id);
          setCurrentScreen('match-detail');
        }
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
            />
          );
        
        case 'matches':
          return (
            <MatchListScreen
              onMatchSelect={handleMatchSelect}
              onMatchResultSelect={handleMatchResultSelect}
              onProfileClick={handleProfileClick}
            />
          );
        
        case 'leaderboard':
          return <Leaderboard />;
        
        case 'match-detail':
          if (!selectedMatchId) {
            console.error('No matchId for MatchDetail');
            setCurrentScreen('home');
            return null;
          }
          return (
            <MatchDetail
              matchId={selectedMatchId}
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
          return (
            <ProfileScreen
              onBack={() => {
                setActiveTab('home');
                setCurrentScreen('home');
              }}
              onSettings={handleProfileSettings}
              onProUpgrade={handleProUpgrade}
              onDatabaseTest={() => setCurrentScreen('database-test')}
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
              
              {/* Bottom Navigation - Only show on main screens */}
              {shouldShowBottomNav && (
                <BottomNavigation
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              )}
            </View>
          )}
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
});
