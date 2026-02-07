// Navigation Handler Functions
// Extracted from App.tsx to reduce component complexity

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger, logNavigation } from '../utils/logger';
import { Screen } from './types';
import { STORAGE_KEYS } from '../config/constants';

/**
 * 1. Onboarding Complete (replaces splash, language, age-gate flow)
 */
export const handleOnboardingComplete = async (
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Onboarding complete', undefined, 'ONBOARDING');
  
  try {
    logNavigation('auth');
    setPreviousScreen(currentScreen);
    setCurrentScreen('auth');
  } catch (error) {
    logger.error('Error in onboarding complete', { error }, 'ONBOARDING');
    setPreviousScreen(currentScreen);
    setCurrentScreen('auth');
  }
};

/**
 * 1.5. Splash Complete (legacy - for existing users)
 */
export const handleSplashComplete = async (
  hasUser: boolean,
  oauthCompleted: boolean,
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  // ✅ OAuth zaten tamamlandıysa bu callback'i yoksay
  if (oauthCompleted) {
    console.log('🛡️ [App] OAuth zaten tamamlandı, handleSplashComplete atlanıyor');
    return;
  }
  
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
      
      // ✅ Profil kurulumu tamamlanmamışsa onboarding'e git
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

/**
 * 2. Language Selection
 */
export const handleLanguageSelect = async (
  lang: string,
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Language selected', { lang }, 'LANGUAGE');
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  
  logNavigation('age-gate');
  setPreviousScreen(currentScreen);
  setCurrentScreen('age-gate');
};

/**
 * 2.5. Age Gate & Consent Complete (Birleştirilmiş ekran)
 */
export const handleAgeGateComplete = async (
  isMinor: boolean,
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Age gate and consent complete', { isMinor }, 'AGE_GATE');
  console.log('✅ App.tsx: handleAgeGateComplete called', { isMinor, currentScreen });
  try {
    logNavigation('auth');
    setPreviousScreen(currentScreen);
    setCurrentScreen('auth');
    console.log('✅ App.tsx: Navigated to auth screen');
  } catch (error) {
    console.error('❌ App.tsx: Error in handleAgeGateComplete', error);
    logger.error('Error in age gate complete', { error }, 'AGE_GATE');
  }
};

/**
 * 3. Auth → Login Success
 */
export const handleLoginSuccess = async (
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Login success', undefined, 'AUTH');
  // ✅ Her zaman Pro yap
  const { STORAGE_KEYS } = await import('../config/constants');
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

/**
 * 4. Auth → Forgot Password
 */
export const handleForgotPassword = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('forgot-password');
  setCurrentScreen('forgot-password');
};

/**
 * 5. Auth → Register
 */
export const handleRegister = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('register');
  setCurrentScreen('register');
};

/**
 * 6. Register → Success → Profile Setup
 */
export const handleRegisterSuccess = async (
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Register success', undefined, 'REGISTER');
  // ✅ Her zaman Pro yap
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ 
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

/**
 * 6.5. Profile Setup → Complete → Dashboard
 */
export const handleProfileSetupComplete = async (
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Profile setup complete', undefined, 'PROFILE_SETUP');
  logNavigation('home');
  setPreviousScreen(currentScreen);
  setCurrentScreen('home');
};

/**
 * 7. Forgot Password → Back to Auth
 */
export const handleForgotPasswordBack = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('auth');
  setCurrentScreen('auth');
};

/**
 * 8. Register → Back to Auth
 */
export const handleRegisterBack = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('auth');
  setCurrentScreen('auth');
};

/**
 * 10. Matches → Profile
 */
export const handleProfileClick = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('profile');
  setCurrentScreen('profile');
};

/**
 * 11. Bottom Navigation Tab Change
 */
export const handleTabChange = (
  tab: string,
  setActiveTab: (tab: string) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.debug('Tab changed', { tab }, 'NAVIGATION');
  setActiveTab(tab);
  setCurrentScreen(tab as Screen);
};

/**
 * 12. Matches → Match Detail
 */
export const handleMatchSelect = (
  matchId: string,
  setSelectedMatchId: (id: string | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('match-detail', { matchId });
  setSelectedMatchId(matchId);
  setCurrentScreen('match-detail');
};

/**
 * 12b. Matches → Match Result Summary (for finished matches)
 */
export const handleMatchResultSelect = (
  matchId: string,
  setSelectedMatchId: (id: string | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('match-result-summary', { matchId });
  setSelectedMatchId(matchId);
  setCurrentScreen('match-result-summary');
};

/**
 * 13. Dashboard Navigation
 */
export const handleDashboardNavigate = (
  screen: string,
  params: any,
  selectedTeamIds: number[],
  setSelectedTeamIds: (ids: number[]) => void,
  setActiveTab: (tab: string) => void,
  setCurrentScreen: (screen: Screen) => void,
  setSelectedMatchId: (id: string | null) => void
) => {
  logNavigation(screen, params);
  
  switch (screen) {
    case 'notifications':
      setCurrentScreen('notifications');
      break;
    case 'matches':
      // ✅ "Oynanan" sekmesi kaldırıldı - canlı maçlar artık Dashboard'da
      if (params?.teamId) {
        setSelectedTeamIds(prev => prev.includes(params.teamId) ? prev : [...prev, params.teamId]);
        (window as any).__matchParams = {
          teamId: params.teamId,
          teamName: params.teamName,
        };
        logger.debug(`Navigating to home (matches merged) with team: ${params.teamName}`, { teamId: params.teamId }, 'DASHBOARD');
      }
      setActiveTab('home');
      setCurrentScreen('home');
      break;
    case 'profile':
      // If navigating from Dashboard "Tüm Rozetlerimi Gör" button, show badges tab
      const showBadgesTab = params?.showBadges === true;
      setActiveTab(showBadgesTab ? 'badges' : 'profile');
      setCurrentScreen('profile');
      break;
    case 'finished':
      setActiveTab('finished');
      setCurrentScreen('finished');
      break;
    case 'match-detail':
      if (params?.id) {
        setSelectedMatchId(params.id);
        const matchParams = {
          initialTab: params?.initialTab || 'squad',
          analysisFocus: params?.analysisFocus,
          matchData: params?.matchData,
          predictionTeamId: params?.predictionTeamId,
        };
        if (typeof global !== 'undefined') (global as any).__matchDetailParams = matchParams;
        if (typeof window !== 'undefined') (window as any).__matchDetailParams = matchParams;
        setCurrentScreen('match-detail');
      }
      break;
    case 'home':
      setCurrentScreen('home');
      break;
    case 'achievements':
      logger.debug('Achievements page navigation', undefined, 'DASHBOARD');
      break;
    default:
      logger.warn('Unknown navigation target', { screen }, 'DASHBOARD');
  }
};

/**
 * 12. Profile → Settings
 */
export const handleProfileSettings = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('profile-settings');
  setCurrentScreen('profile-settings');
};

/**
 * 13. Profile → Pro Upgrade
 */
export const handleProUpgrade = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('pro-upgrade');
  setCurrentScreen('pro-upgrade');
};

/**
 * 17. PRO Upgrade Success
 */
export const handleUpgradeSuccess = async (
  currentScreen: Screen,
  setPreviousScreen: (screen: Screen | null) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('PRO upgrade success', undefined, 'PRO_UPGRADE');
  // Save PRO status to AsyncStorage
  const { STORAGE_KEYS } = await import('../config/constants');
  const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (userDataStr) {
    const userData = JSON.parse(userDataStr);
    userData.is_pro = true;
    userData.isPro = true;
    userData.isPremium = true;
    userData.plan = 'pro';
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    logger.debug('PRO status saved to AsyncStorage', undefined, 'PRO_UPGRADE');
  }
  await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
  logNavigation('profile');
  setCurrentScreen('profile');
};

/**
 * 14. Profile Settings → Change Password
 */
export const handleNavigateToChangePassword = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('change-password');
  setCurrentScreen('change-password');
};

/**
 * 15. Profile Settings → Notifications
 */
export const handleNavigateToNotifications = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('notifications');
  setCurrentScreen('notifications');
};

/**
 * 16. Profile Settings → Delete Account
 */
export const handleNavigateToDeleteAccount = (
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('delete-account');
  setCurrentScreen('delete-account');
};

/**
 * 17. Profile Settings → Logout
 */
export const handleLogout = async (
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Logging out', undefined, 'AUTH');
  try {
    // Sadece user session'ı temizle - dil ve takım seçimini koru
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    logger.debug('User session cleared', undefined, 'AUTH');
    logNavigation('auth');
    setCurrentScreen('auth');
  } catch (error) {
    logger.error('Logout error', { error }, 'AUTH');
    // Hata olsa bile auth'a git
    setCurrentScreen('auth');
  }
};

/**
 * 18. Delete Account → Confirm
 */
export const handleDeleteAccountConfirm = async (
  setCurrentScreen: (screen: Screen) => void
) => {
  logger.info('Account deleted', undefined, 'DELETE_ACCOUNT');
  await AsyncStorage.clear();
  logNavigation('splash');
  setCurrentScreen('splash');
};

/**
 * 19. Navigate to Legal Document
 */
export const handleNavigateToLegal = (
  documentType: string,
  setLegalDocumentType: (type: string) => void,
  setCurrentScreen: (screen: Screen) => void
) => {
  logNavigation('legal', { documentType });
  setLegalDocumentType(documentType);
  setCurrentScreen('legal');
};
