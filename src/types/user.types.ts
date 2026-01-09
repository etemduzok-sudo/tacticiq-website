// User Types - Type Safety Improvement

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level: number;
  points: number;
  rank: number;
  xp: number;
  isPro: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  weeklyPoints: number;
  streak: number;
  longestStreak: number;
  totalPoints: number;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  notifications: {
    matchStart: boolean;
    matchEnd: boolean;
    goals: boolean;
    predictions: boolean;
  };
}

export interface FavoriteTeam {
  id: number;
  name: string;
  logo: string;
  league?: string;
}

export interface UserProfile extends User {
  stats: UserStats;
  preferences: UserPreferences;
  favoriteTeams: FavoriteTeam[];
}

// Prediction Types
export interface Prediction {
  id: string;
  userId: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  confidence: number;
  points?: number;
  isCorrect?: boolean;
  createdAt: string;
}

export interface PlayerPrediction {
  playerId: number;
  willScore: boolean;
  willAssist: boolean;
  willGetCard: boolean;
  willBeSubstituted: boolean;
}

export interface MatchPrediction extends Prediction {
  playerPredictions?: PlayerPrediction[];
  formationId?: string;
  coachRating?: number;
}
