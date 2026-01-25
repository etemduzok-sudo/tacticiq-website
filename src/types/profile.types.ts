// =====================================================
// Unified Profile Types - Web & Mobile Shared
// =====================================================

/**
 * Birleşik Kullanıcı Profili
 * Web ve mobil uygulama için ortak veri yapısı
 * Supabase user_profiles tablosuyla uyumlu
 */
export interface UnifiedUserProfile {
  // Temel Bilgiler
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  
  // Üyelik
  plan: 'free' | 'pro';
  
  // Oyun İstatistikleri
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  dayStreak: number;
  
  // Seviye ve XP
  level: number;
  xp: number;
  
  // Sıralama
  countryRank: number;
  globalRank: number;
  country: string;
  
  // Takımlar
  nationalTeam?: string;
  clubTeams: string[];
  favoriteTeams: string[];
  
  // Rozetler
  badges: string[];
  
  // Tercihler
  preferredLanguage: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  notificationsEnabled: boolean;
  
  // Zaman Damgaları
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/**
 * Profil Güncelleme için Partial Tip
 */
export type ProfileUpdate = Partial<Omit<UnifiedUserProfile, 'id' | 'email' | 'createdAt'>>;

/**
 * Supabase user_profiles tablosu sütun adları (snake_case)
 */
export interface SupabaseUserProfile {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  plan: string;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  day_streak: number;
  level: number;
  xp: number;
  country_rank: number;
  global_rank: number;
  country: string;
  national_team?: string;
  club_teams: string[];
  favorite_teams: string[];
  badges: string[];
  preferred_language: string;
  theme: string;
  timezone: string;
  notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

/**
 * Supabase formatından uygulama formatına dönüştür
 */
export function fromSupabaseProfile(data: SupabaseUserProfile): UnifiedUserProfile {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    nickname: data.nickname,
    avatar: data.avatar,
    plan: data.plan === 'pro' ? 'pro' : 'free',
    totalPoints: data.total_points || 0,
    totalPredictions: data.total_predictions || 0,
    correctPredictions: data.correct_predictions || 0,
    accuracy: data.accuracy || 0,
    currentStreak: data.current_streak || 0,
    bestStreak: data.best_streak || 0,
    dayStreak: data.day_streak || 0,
    level: data.level || 1,
    xp: data.xp || 0,
    countryRank: data.country_rank || 0,
    globalRank: data.global_rank || 0,
    country: data.country || 'TR',
    nationalTeam: data.national_team,
    clubTeams: data.club_teams || [],
    favoriteTeams: data.favorite_teams || [],
    badges: data.badges || [],
    preferredLanguage: data.preferred_language || 'tr',
    theme: (data.theme as 'light' | 'dark' | 'system') || 'dark',
    timezone: data.timezone || 'Europe/Istanbul',
    notificationsEnabled: data.notifications_enabled ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastLoginAt: data.last_login_at,
  };
}

/**
 * Uygulama formatından Supabase formatına dönüştür
 * NOT: nickname sütunu Supabase'de mevcut olmalı
 * Yoksa supabase/add_nickname_column.sql dosyasını çalıştırın
 */
export function toSupabaseProfile(data: ProfileUpdate): Partial<SupabaseUserProfile> {
  const result: Partial<SupabaseUserProfile> = {};
  
  if (data.name !== undefined) result.name = data.name;
  // ✅ nickname sütunu - supabase/add_nickname_column.sql çalıştırıldıktan sonra aktif
  if (data.nickname !== undefined) result.nickname = data.nickname;
  if (data.avatar !== undefined) result.avatar = data.avatar;
  if (data.plan !== undefined) result.plan = data.plan;
  if (data.totalPoints !== undefined) result.total_points = data.totalPoints;
  if (data.totalPredictions !== undefined) result.total_predictions = data.totalPredictions;
  if (data.correctPredictions !== undefined) result.correct_predictions = data.correctPredictions;
  if (data.currentStreak !== undefined) result.current_streak = data.currentStreak;
  if (data.bestStreak !== undefined) result.best_streak = data.bestStreak;
  if (data.dayStreak !== undefined) result.day_streak = data.dayStreak;
  if (data.level !== undefined) result.level = data.level;
  if (data.xp !== undefined) result.xp = data.xp;
  if (data.country !== undefined) result.country = data.country;
  if (data.nationalTeam !== undefined) result.national_team = data.nationalTeam;
  if (data.clubTeams !== undefined) result.club_teams = data.clubTeams;
  if (data.favoriteTeams !== undefined) result.favorite_teams = data.favoriteTeams;
  if (data.badges !== undefined) result.badges = data.badges;
  if (data.preferredLanguage !== undefined) result.preferred_language = data.preferredLanguage;
  if (data.theme !== undefined) result.theme = data.theme;
  if (data.timezone !== undefined) result.timezone = data.timezone;
  if (data.notificationsEnabled !== undefined) result.notifications_enabled = data.notificationsEnabled;
  
  result.updated_at = new Date().toISOString();
  
  return result;
}

/**
 * Varsayılan profil değerleri
 */
export const DEFAULT_PROFILE: Omit<UnifiedUserProfile, 'id' | 'email'> = {
  name: '',
  nickname: '',
  avatar: undefined,
  plan: 'free',
  totalPoints: 0,
  totalPredictions: 0,
  correctPredictions: 0,
  accuracy: 0,
  currentStreak: 0,
  bestStreak: 0,
  dayStreak: 0,
  level: 1,
  xp: 0,
  countryRank: 0,
  globalRank: 0,
  country: 'TR',
  nationalTeam: undefined,
  clubTeams: [],
  favoriteTeams: [],
  badges: [],
  preferredLanguage: 'tr',
  theme: 'dark',
  timezone: 'Europe/Istanbul',
  notificationsEnabled: true,
};

/**
 * Oyuncu sayısı bilgisi
 */
export interface PlayerCounts {
  countryTotal: number;
  globalTotal: number;
}

/**
 * Top yüzdelik hesaplama
 */
export function calculateTopPercent(rank: number, total: number): string {
  if (rank <= 0 || total <= 0) return '';
  const percent = (rank / total) * 100;
  if (percent <= 1) return 'Top %1';
  if (percent <= 5) return 'Top %5';
  if (percent <= 10) return 'Top %10';
  if (percent <= 25) return 'Top %25';
  if (percent <= 50) return 'Top %50';
  return `Top %${Math.ceil(percent)}`;
}
