// Navigation Types - Screen definitions
export type Screen =
  | 'splash'
  | 'onboarding'
  | 'language'
  | 'age-gate'
  | 'auth'
  | 'register'
  | 'forgot-password'
  | 'home'
  | 'finished'
  | 'matches'
  | 'badges'
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

// Navigation State Type
export interface NavigationState {
  currentScreen: Screen;
  previousScreen: Screen | null;
  selectedMatchId: string | null;
  selectedTeamIds: number[];
  activeTab: string;
  legalDocumentType: string;
  isMaintenanceMode: boolean;
  isProcessingOAuth: boolean;
  oauthCompleted: boolean;
}

// Navigation Actions Type
export interface NavigationActions {
  setCurrentScreen: (screen: Screen) => void;
  setPreviousScreen: (screen: Screen | null) => void;
  setSelectedMatchId: (id: string | null) => void;
  setSelectedTeamIds: (ids: number[]) => void;
  setActiveTab: (tab: string) => void;
  setLegalDocumentType: (type: string) => void;
  setIsProcessingOAuth: (processing: boolean) => void;
  setOauthCompleted: (completed: boolean) => void;
}
