export type Language = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'it';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  league: string;
}

export interface Match {
  id: string;
  homeTeam: {
    name: string;
    logo: string;
    score?: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score?: number;
  };
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'finished';
  league: string;
  minute?: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  photo: string;
  number: number;
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  badges: Badge[];
  isPro: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'match' | 'achievement' | 'news' | 'system';
}
