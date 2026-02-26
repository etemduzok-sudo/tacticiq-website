// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase Configuration
// Project: jxdgiskusjljlpzvrzau
// Dashboard: https://supabase.com/dashboard/project/jxdgiskusjljlpzvrzau
const SUPABASE_URL = 'https://jxdgiskusjljlpzvrzau.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Qjep7tf9H98yk5UBgcPtVw_x4iQUixY';

// ✅ Web'de session'ın kesin kalıcı olması için localStorage adapter (önceki davranış)
const webStorage = typeof window !== 'undefined' && window.localStorage
  ? {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(window.localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(window.localStorage.removeItem(key)),
    }
  : undefined;

const authStorage = Platform.OS === 'web' && webStorage ? webStorage : AsyncStorage;

// Create Supabase client with platform-appropriate storage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // ✅ Web OAuth için URL'deki session token'larını algıla
    detectSessionInUrl: Platform.OS === 'web',
    // ✅ Web için implicit flow kullan (PKCE yerine, daha basit)
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
  },
});

// Database Tables Interface
export interface Database {
  users: {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    created_at: string;
    total_points: number;
    current_streak: number;
    best_streak: number;
    accuracy: number;
    rank: number;
    is_premium: boolean;
    premium_until?: string;
    favorite_teams: string[];
  };
  predictions: {
    id: string;
    user_id: string;
    match_id: string;
    prediction_type: 'match_result' | 'score' | 'scorer' | 'cards';
    prediction_value: any;
    points_earned?: number;
    is_correct?: boolean;
    created_at: string;
  };
  squads: {
    id: string;
    user_id: string;
    match_id: string;
    formation: string;
    selected_players: any;
    created_at: string;
  };
  ratings: {
    id: string;
    user_id: string;
    match_id: string;
    team: 'home' | 'away';
    category: string;
    rating: number;
    created_at: string;
  };
  achievements: {
    id: string;
    user_id: string;
    achievement_type: string;
    unlocked_at: string;
  };
  notifications: {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'match_start' | 'result' | 'achievement' | 'premium';
    read: boolean;
    created_at: string;
  };
}

// Type-safe database operations
export type Tables = Database[keyof Database];
