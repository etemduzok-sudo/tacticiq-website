// Sinyal tipleri export
export * from './signals.types';

export interface Team {
  id: string;
  name: string;
  logo?: string;
  shortName?: string;
}

export interface Match {
  id: string;
  homeTeam: Team & { score?: number };
  awayTeam: Team & { score?: number };
  date: string;
  time?: string;
  status: 'live' | 'upcoming' | 'finished';
  competition: string;
  venue?: string;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photo?: string;
  team?: Team;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoriteTeams?: Team[];
  isPro?: boolean;
}

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Auth: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  FavoriteTeams: undefined;
  MainTabs: undefined;
  MatchDetail: { matchId: string };
  ProfileSettings: undefined;
  Notifications: undefined;
  ProUpgrade: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  LegalDocuments: undefined;
  LegalDocument: { documentId: string; title: string };
};

export type TabParamList = {
  Home: undefined;
  Matches: undefined;
  Predictions: undefined;
  Profile: undefined;
};
