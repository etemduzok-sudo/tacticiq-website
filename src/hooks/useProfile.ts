// =====================================================
// useProfile Hook - Unified Profile Management
// Web ve mobil senkronize profil yönetimi
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { 
  UnifiedUserProfile, 
  ProfileUpdate, 
  PlayerCounts,
  calculateTopPercent,
  DEFAULT_PROFILE 
} from '../types/profile.types';

export interface UseProfileReturn {
  // State
  profile: UnifiedUserProfile | null;
  loading: boolean;
  error: string | null;
  playerCounts: PlayerCounts;
  
  // Computed values
  isPro: boolean;
  topPercentCountry: string;
  topPercentGlobal: string;
  successRate: number;
  
  // Actions
  updateProfile: (updates: ProfileUpdate) => Promise<{ success: boolean; error?: string }>;
  updateNickname: (nickname: string) => Promise<{ success: boolean; error?: string }>;
  updateNationalTeam: (team: string) => Promise<{ success: boolean; error?: string }>;
  updateClubTeams: (teams: string[]) => Promise<{ success: boolean; error?: string }>;
  updateFavoriteTeams: (teams: string[]) => Promise<{ success: boolean; error?: string }>;
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<{ success: boolean; error?: string }>;
  updateLanguage: (language: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  recordPredictionResult: (isCorrect: boolean, points: number) => Promise<void>;
  recordDailyLogin: () => Promise<void>;
}

/**
 * useProfile Hook
 * Profil verilerini yönetir ve senkronize tutar
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerCounts, setPlayerCounts] = useState<PlayerCounts>({ 
    countryTotal: 5000, 
    globalTotal: 50000 
  });

  // =====================================================
  // Initial Load
  // =====================================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await profileService.getProfile();
      setProfile(profileData);

      if (profileData) {
        // Günlük giriş kaydı
        await profileService.recordDailyLogin();
        
        // Oyuncu sayılarını yükle
        const counts = await profileService.getPlayerCounts();
        setPlayerCounts(counts);
      }
    } catch (err: any) {
      console.error('[useProfile] Load error:', err);
      setError(err.message || 'Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Computed Values
  // =====================================================

  const isPro = profile?.plan === 'pro';

  const topPercentCountry = profile?.countryRank && playerCounts.countryTotal
    ? calculateTopPercent(profile.countryRank, playerCounts.countryTotal)
    : '';

  const topPercentGlobal = profile?.globalRank && playerCounts.globalTotal
    ? calculateTopPercent(profile.globalRank, playerCounts.globalTotal)
    : '';

  const successRate = profile?.totalPredictions && profile.totalPredictions > 0
    ? Math.round((profile.correctPredictions / profile.totalPredictions) * 100)
    : 0;

  // =====================================================
  // Actions
  // =====================================================

  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    const result = await profileService.updateProfile(updates);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return result;
  }, []);

  const updateNickname = useCallback(async (nickname: string) => {
    const result = await profileService.updateNickname(nickname);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, nickname } : null);
    }
    return result;
  }, []);

  const updateNationalTeam = useCallback(async (team: string) => {
    const result = await profileService.updateNationalTeam(team);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, nationalTeam: team } : null);
    }
    return result;
  }, []);

  const updateClubTeams = useCallback(async (teams: string[]) => {
    const result = await profileService.updateClubTeams(teams);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, clubTeams: teams } : null);
    }
    return result;
  }, []);

  const updateFavoriteTeams = useCallback(async (teams: string[]) => {
    const result = await profileService.updateFavoriteTeams(teams);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, favoriteTeams: teams } : null);
    }
    return result;
  }, []);

  const updateTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
    const result = await profileService.updateTheme(theme);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, theme } : null);
    }
    return result;
  }, []);

  const updateLanguage = useCallback(async (language: string) => {
    const result = await profileService.updateLanguage(language);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, preferredLanguage: language } : null);
    }
    return result;
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    const freshProfile = await profileService.refreshProfile();
    setProfile(freshProfile);
    setLoading(false);
  }, []);

  const recordPredictionResult = useCallback(async (isCorrect: boolean, points: number) => {
    await profileService.recordPredictionResult(isCorrect, points);
    // Profili güncelle
    const freshProfile = profileService.getCachedProfile();
    if (freshProfile) {
      setProfile(freshProfile);
    }
  }, []);

  const recordDailyLogin = useCallback(async () => {
    await profileService.recordDailyLogin();
  }, []);

  // =====================================================
  // Return
  // =====================================================

  return {
    // State
    profile,
    loading,
    error,
    playerCounts,
    
    // Computed
    isPro,
    topPercentCountry,
    topPercentGlobal,
    successRate,
    
    // Actions
    updateProfile,
    updateNickname,
    updateNationalTeam,
    updateClubTeams,
    updateFavoriteTeams,
    updateTheme,
    updateLanguage,
    refreshProfile,
    recordPredictionResult,
    recordDailyLogin,
  };
}

export default useProfile;
