import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '../navigation/types';
import { logger, logNavigation } from '../utils/logger';
import { STORAGE_KEYS } from '../config/constants';
import socialAuthService from '../services/socialAuthService';
import { MAINTENANCE_CONFIG, logVersionInfo } from '../config/AppVersion';

// Web specific types
declare const window: any;

export function useAppNavigation() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [legalDocumentType, setLegalDocumentType] = useState<string>('terms');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState<boolean>(() => {
    // Check OAuth initiating flag on load
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const oauthInitiating = window.localStorage.getItem('tacticiq_oauth_initiating');
      if (oauthInitiating === 'true') {
        console.log('🔄 [Nav] OAuth initiating detected on startup');
        return true;
      }
    }
    return false;
  });
  const [oauthCompleted, setOauthCompleted] = useState<boolean>(false);

  // Refs
  const oauthCheckedRef = useRef(false);

  // Initialize
  useEffect(() => {
    // Log version info on startup
    logVersionInfo();

    // Check maintenance mode
    setIsMaintenanceMode(MAINTENANCE_CONFIG.isActive);
  }, []);

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  // 1. Onboarding Complete
  const handleOnboardingComplete = useCallback(async () => {
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
  }, [currentScreen]);

  // 1.5. Splash Complete
  const handleSplashComplete = useCallback(async (hasUser: boolean) => {
    if (oauthCompleted) {
      console.log('🛡️ [Nav] OAuth already completed, skipping splash complete');
      return;
    }
    
    logger.info('Splash complete', { hasUser }, 'SPLASH');
    
    try {
      if (hasUser) {
        // Check stored user data
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          
          // Ensure Pro status (DEV/Legacy)
          if (!userData.isPro) {
            userData.is_pro = true;
            userData.isPro = true;
            userData.isPremium = true;
            userData.plan = 'pro';
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          }
          
          // Navigate based on profile setup
          if (userData.profileSetupComplete === true) {
            logger.info('Profile setup complete, navigating to home', undefined, 'SPLASH');
            logNavigation('home');
            setPreviousScreen(currentScreen);
            setCurrentScreen('home');
            return;
          }
        }
        
        logger.info('Profile setup not complete, navigating to onboarding', undefined, 'SPLASH');
        logNavigation('onboarding');
        setPreviousScreen(currentScreen);
        setCurrentScreen('onboarding');
      } else {
        logNavigation('onboarding');
        setPreviousScreen(currentScreen);
        setCurrentScreen('onboarding');
      }
    } catch (error) {
      logger.error('Error in splash complete', { error }, 'SPLASH');
      setPreviousScreen(currentScreen);
      setCurrentScreen('onboarding');
    }
  }, [oauthCompleted, currentScreen]);

  // 2. Language Selection
  const handleLanguageSelect = useCallback(async (lang: string) => {
    logger.info('Language selected', { lang }, 'LANGUAGE');
    await AsyncStorage.setItem('fan-manager-language', lang);
    logNavigation('age-gate');
    setPreviousScreen(currentScreen);
    setCurrentScreen('age-gate');
  }, [currentScreen]);

  // 2.5. Age Gate Complete
  const handleAgeGateComplete = useCallback(async (isMinor: boolean) => {
    logger.info('Age gate complete', { isMinor }, 'AGE_GATE');
    try {
      logNavigation('auth');
      setPreviousScreen(currentScreen);
      setCurrentScreen('auth');
    } catch (error) {
      logger.error('Error in age gate complete', { error }, 'AGE_GATE');
    }
  }, [currentScreen]);

  // 3. Auth Handlers
  const handleLoginSuccess = useCallback(async () => {
    logger.info('Login success', undefined, 'AUTH');
    
    // Ensure Pro status
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
    
    logNavigation('home');
    setPreviousScreen(currentScreen);
    setCurrentScreen('home');
  }, [currentScreen]);

  const handleForgotPassword = useCallback(() => {
    logNavigation('forgot-password');
    setCurrentScreen('forgot-password');
  }, []);

  const handleRegister = useCallback(() => {
    logNavigation('register');
    setCurrentScreen('register');
  }, []);

  const handleRegisterSuccess = useCallback(async () => {
    logger.info('Register success', undefined, 'REGISTER');
    // Ensure Pro status
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ 
      authenticated: true,
      is_pro: true,
      isPro: true,
      isPremium: true,
      plan: 'pro'
    }));
    logNavigation('profile-setup');
    setCurrentScreen('profile-setup');
  }, []);

  const handleProfileSetupComplete = useCallback(async () => {
    logger.info('Profile setup complete', undefined, 'PROFILE_SETUP');
    logNavigation('home');
    setPreviousScreen(currentScreen);
    setCurrentScreen('home');
  }, [currentScreen]);

  // Back Handlers
  const handleForgotPasswordBack = useCallback(() => {
    logNavigation('auth');
    setCurrentScreen('auth');
  }, []);

  const handleRegisterBack = useCallback(() => {
    logNavigation('auth');
    setCurrentScreen('auth');
  }, []);

  // Navigation Logic
  const handleProfileClick = useCallback(() => {
    logNavigation('profile');
    setCurrentScreen('profile');
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    logger.debug('Tab changed', { tab }, 'NAVIGATION');
    setActiveTab(tab);
    setCurrentScreen(tab as Screen);
  }, []);

  const handleMatchSelect = useCallback((matchId: string, options?: { initialTab?: string }) => {
    logNavigation('match-detail', { matchId, ...options });
    setSelectedMatchId(matchId);
    const matchParams = { initialTab: options?.initialTab || 'squad' };
    if (typeof global !== 'undefined') (global as any).__matchDetailParams = matchParams;
    if (typeof window !== 'undefined') (window as any).__matchDetailParams = matchParams;
    setCurrentScreen('match-detail');
  }, []);

  const handleMatchResultSelect = useCallback((matchId: string) => {
    logNavigation('match-result-summary', { matchId });
    setSelectedMatchId(matchId);
    setCurrentScreen('match-result-summary');
  }, []);

  const handleDashboardNavigate = useCallback((screen: string, params?: any) => {
    logNavigation(screen, params);
    
    switch (screen) {
      case 'notifications':
        setCurrentScreen('notifications');
        break;
      case 'matches':
        if (params?.teamId) {
          setSelectedTeamIds(prev => prev.includes(params.teamId) ? prev : [...prev, params.teamId]);
          if (Platform.OS === 'web') {
            (window as any).__matchParams = {
              teamId: params.teamId,
              teamName: params.teamName,
            };
          }
        }
        setCurrentScreen('matches');
        break;
      case 'profile':
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
          };
          if (typeof global !== 'undefined') (global as any).__matchDetailParams = matchParams;
          if (typeof window !== 'undefined') (window as any).__matchDetailParams = matchParams;
          setCurrentScreen('match-detail');
        }
        break;
      case 'home':
        setCurrentScreen('home');
        break;
      default:
        logger.warn('Unknown navigation target', { screen }, 'DASHBOARD');
    }
  }, []);

  // Profile Settings Handlers
  const handleProfileSettings = useCallback(() => {
    logNavigation('profile-settings');
    setCurrentScreen('profile-settings');
  }, []);

  const handleProUpgrade = useCallback(() => {
    logNavigation('pro-upgrade');
    setCurrentScreen('pro-upgrade');
  }, []);

  const handleUpgradeSuccess = useCallback(async () => {
    logger.info('PRO upgrade success', undefined, 'PRO_UPGRADE');
    const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      userData.is_pro = true;
      userData.isPro = true;
      userData.isPremium = true;
      userData.plan = 'pro';
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }
    await AsyncStorage.setItem(STORAGE_KEYS.PRO_STATUS, 'true');
    logNavigation('profile');
    setCurrentScreen('profile');
  }, []);

  const handleNavigateToChangePassword = useCallback(() => {
    logNavigation('change-password');
    setCurrentScreen('change-password');
  }, []);

  const handleNavigateToNotifications = useCallback(() => {
    logNavigation('notifications');
    setCurrentScreen('notifications');
  }, []);

  const handleNavigateToDeleteAccount = useCallback(() => {
    logNavigation('delete-account');
    setCurrentScreen('delete-account');
  }, []);

  const handleLogout = useCallback(async () => {
    logger.info('Logging out', undefined, 'AUTH');
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      logNavigation('auth');
      setCurrentScreen('auth');
    } catch (error) {
      logger.error('Logout error', { error }, 'AUTH');
      setCurrentScreen('auth');
    }
  }, []);

  const handleDeleteAccountConfirm = useCallback(async () => {
    logger.info('Account deleted', undefined, 'DELETE_ACCOUNT');
    await AsyncStorage.clear();
    logNavigation('splash');
    setCurrentScreen('splash');
  }, []);

  const handleNavigateToLegal = useCallback((documentType: string) => {
    logNavigation('legal', { documentType });
    setLegalDocumentType(documentType);
    setCurrentScreen('legal');
  }, []);

  return {
    state: {
      currentScreen,
      previousScreen,
      legalDocumentType,
      activeTab,
      selectedMatchId,
      selectedTeamIds,
      isMaintenanceMode,
      isProcessingOAuth,
      oauthCompleted
    },
    actions: {
      setCurrentScreen,
      setPreviousScreen,
      setLegalDocumentType,
      setActiveTab,
      setSelectedMatchId,
      setSelectedTeamIds,
      setIsProcessingOAuth,
      setOauthCompleted
    },
    handlers: {
      handleOnboardingComplete,
      handleSplashComplete,
      handleLanguageSelect,
      handleAgeGateComplete,
      handleLoginSuccess,
      handleForgotPassword,
      handleRegister,
      handleRegisterSuccess,
      handleProfileSetupComplete,
      handleForgotPasswordBack,
      handleRegisterBack,
      handleProfileClick,
      handleTabChange,
      handleMatchSelect,
      handleMatchResultSelect,
      handleDashboardNavigate,
      handleProfileSettings,
      handleProUpgrade,
      handleUpgradeSuccess,
      handleNavigateToChangePassword,
      handleNavigateToNotifications,
      handleNavigateToDeleteAccount,
      handleLogout,
      handleDeleteAccountConfirm,
      handleNavigateToLegal
    },
    refs: {
      oauthCheckedRef
    }
  };
}
