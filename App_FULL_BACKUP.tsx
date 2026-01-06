import React, { useState, useEffect } from 'react';
import { LogBox, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import FavoriteTeamsScreen from './src/screens/FavoriteTeamsScreen';
import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';

// Screen Types (from documentation)
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
  | 'profile'
  | 'profile-settings';

// Ignore warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [returnScreen, setReturnScreen] = useState<Screen>('auth');

  // ==========================================
  // NAVIGATION HANDLERS (from documentation)
  // ==========================================

  // A) Onboarding Handlers
  const handleSplashComplete = async () => {
    try {
      const user = await AsyncStorage.getItem('fan-manager-user');
      console.log('🔍 [SPLASH] User in AsyncStorage:', user);
      
      if (user) {
        console.log('✅ [SPLASH] User EXISTS → Going to HOME');
        setCurrentScreen('home');
      } else {
        console.log('❌ [SPLASH] User NOT EXISTS → Going to LANGUAGE');
        setCurrentScreen('language');
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setCurrentScreen('language');
    }
  };

  const handleLanguageSelect = async (lang: string) => {
    try {
      await AsyncStorage.setItem('fan-manager-language', lang);
      setCurrentScreen('auth');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleAuthComplete = async () => {
    try {
      await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ authenticated: true }));
      const hasTeams = await AsyncStorage.getItem('fan-manager-favorite-clubs');
      
      if (hasTeams) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('favorite-teams');
      }
    } catch (error) {
      console.error('Error in auth complete:', error);
    }
  };

  const handleFavoriteTeamsComplete = async (selectedTeams: string[]) => {
    try {
      if (selectedTeams.length === 0) {
        // Show error (would use toast in production)
        console.warn('No teams selected');
        return;
      }
      
      await AsyncStorage.setItem('fan-manager-favorite-clubs', JSON.stringify(selectedTeams));
      await AsyncStorage.setItem('fan-manager-user', JSON.stringify({ authenticated: true }));
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error saving favorite teams:', error);
    }
  };

  // B) Main App Handlers
  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    setCurrentScreen('match-detail');
  };

  const handleProfileClick = () => {
    setCurrentScreen('profile');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleBackToMatches = () => {
    setCurrentScreen('matches');
  };

  // C) Settings Handlers
  const handleSettingsClick = () => {
    setCurrentScreen('profile-settings');
  };

  const handleBackToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleNavigateToFavoriteTeams = () => {
    setReturnScreen('profile-settings');
    setCurrentScreen('favorite-teams');
  };

  const handleNavigateToLanguage = () => {
    setReturnScreen('profile-settings');
    setCurrentScreen('language');
  };

  // D) Special Handlers
  const handleAuthBack = () => {
    setCurrentScreen('language');
  };

  const handleForgotPassword = () => {
    setCurrentScreen('forgot-password');
  };

  const handleForgotPasswordBack = () => {
    setCurrentScreen('auth');
  };

  const handleRegister = () => {
    setCurrentScreen('register');
  };

  const handleRegisterBack = () => {
    setCurrentScreen('auth');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('fan-manager-user');
      setCurrentScreen('splash');
      // Simulate re-check
      setTimeout(() => setCurrentScreen('language'), 1000);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // ==========================================
  // SCREEN RENDERING (Conditional)
  // ==========================================

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      
      case 'language':
        return (
          <LanguageSelectionScreen
            onLanguageSelect={handleLanguageSelect}
            onBack={returnScreen === 'profile-settings' ? handleBackToProfile : undefined}
          />
        );
      
      case 'auth':
        return (
          <AuthScreen
            onLoginSuccess={handleAuthComplete}
            onForgotPassword={handleForgotPassword}
            onRegister={handleRegister}
            onBack={handleAuthBack}
          />
        );
      
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={handleAuthComplete}
            onBack={handleRegisterBack}
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
            onBack={returnScreen === 'profile-settings' ? handleBackToProfile : handleRegisterBack}
          />
        );
      
      case 'home':
        return (
          <HomeScreen
            onMatchSelect={handleMatchSelect}
            onProfileClick={handleProfileClick}
          />
        );
      
      case 'matches':
        return (
          <MatchesScreen
            onMatchSelect={handleMatchSelect}
            onBack={handleBackToHome}
          />
        );
      
      case 'match-detail':
        return (
          <MatchDetailScreen
            matchId={selectedMatchId}
            onBack={handleBackToHome}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen
            onSettingsClick={handleSettingsClick}
            onBack={handleBackToHome}
          />
        );
      
      case 'profile-settings':
        return (
          <ProfileSettingsScreen
            onBack={handleBackToProfile}
            onNavigateToFavoriteTeams={handleNavigateToFavoriteTeams}
            onNavigateToLanguage={handleNavigateToLanguage}
            onLogout={handleLogout}
          />
        );
      
      default:
        return <SplashScreen onComplete={handleSplashComplete} />;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <View style={styles.container}>
            {renderScreen()}
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
