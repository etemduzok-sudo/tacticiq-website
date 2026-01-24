// =====================================================
// Unified Profile Service - Mobile App
// Supabase user_profiles tablosu ile senkronize
// =====================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { STORAGE_KEYS } from '../config/constants';
import {
  UnifiedUserProfile,
  ProfileUpdate,
  PlayerCounts,
  fromSupabaseProfile,
  toSupabaseProfile,
  DEFAULT_PROFILE,
  SupabaseUserProfile,
} from '../types/profile.types';

// ✅ Tek bir storage key kullan - tutarlılık için
const STORAGE_KEY = STORAGE_KEYS.USER;  // 'tacticiq-user'
const PLAYER_COUNTS_KEY = 'tacticiq_player_counts';

// Legacy key'ler (migration için)
const LEGACY_KEYS = [
  'fan-manager-user',
  'tacticiq_user_profile',
];

/**
 * Profile Service - Singleton
 * Web ve mobil arasında senkronize profil yönetimi
 */
class ProfileService {
  private cachedProfile: UnifiedUserProfile | null = null;
  private cachedPlayerCounts: PlayerCounts | null = null;

  // =====================================================
  // Profil Okuma
  // =====================================================

  /**
   * Mevcut kullanıcı profilini getir
   * Önce cache, sonra AsyncStorage (ana key + legacy), en son Supabase
   */
  async getProfile(): Promise<UnifiedUserProfile | null> {
    try {
      // 1. Memory cache kontrolü
      if (this.cachedProfile) {
        // Arka planda güncelle
        this.refreshProfileInBackground();
        return this.cachedProfile;
      }

      // 2. Ana AsyncStorage key kontrolü
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cachedProfile = JSON.parse(stored);
        // Arka planda güncelle
        this.refreshProfileInBackground();
        return this.cachedProfile;
      }

      // 3. Legacy key'lerden migration
      for (const legacyKey of LEGACY_KEYS) {
        const legacyData = await AsyncStorage.getItem(legacyKey);
        if (legacyData) {
          console.log(`[ProfileService] Legacy key migration: ${legacyKey}`);
          const userData = JSON.parse(legacyData);
          
          // Legacy format'ı UnifiedUserProfile'a çevir
          const profile: UnifiedUserProfile = {
            ...DEFAULT_PROFILE,
            id: userData.id || 'local_user',
            email: userData.email || '',
            name: userData.displayName || userData.name || userData.nickname || '',
            nickname: userData.nickname || userData.username || userData.email?.split('@')[0] || 'User',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            fullName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            avatar: userData.photoURL || userData.avatar || '',
            plan: userData.is_pro || userData.isPro || userData.isPremium ? 'pro' : 'free',
            totalPoints: userData.points || userData.totalPoints || 0,
            level: userData.level || 1,
            countryRank: userData.countryRank || 0,
            globalRank: userData.globalRank || 0,
            accuracy: userData.accuracy || 0,
            totalPredictions: userData.totalPredictions || 0,
            nationalTeam: userData.nationalTeam || '',
            clubTeams: userData.clubTeams || [],
            // OAuth provider bilgisi
            provider: userData.provider || 'email',
          };
          
          this.cachedProfile = profile;
          
          // Yeni key'e kaydet
          await this.saveToCache(profile);
          
          // Legacy key'i temizle (migration tamamlandı)
          await AsyncStorage.removeItem(legacyKey);
          console.log(`[ProfileService] Legacy key cleaned: ${legacyKey}`);
          
          return profile;
        }
      }

      // 4. Supabase'den çek
      return await this.fetchProfileFromSupabase();
    } catch (error) {
      console.error('[ProfileService] getProfile error:', error);
      return null;
    }
  }

  /**
   * Supabase veya AsyncStorage'dan profil çek
   */
  async fetchProfileFromSupabase(): Promise<UnifiedUserProfile | null> {
    try {
      // Önce Supabase auth kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      
      // Supabase auth yoksa, local storage'dan kontrol et
      if (!user) {
        // Ana key'den kontrol et
        const localData = await AsyncStorage.getItem(STORAGE_KEY);
        if (localData) {
          const profile = JSON.parse(localData);
          return profile as UnifiedUserProfile;
        }
        
        // Hiç kullanıcı yok
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('[ProfileService] Fetch error:', error.message);
        
        // Profil yoksa oluştur
        if (error.code === 'PGRST116') {
          return await this.createProfile(user.id, user.email || '');
        }
        return null;
      }

      const profile = fromSupabaseProfile(data as SupabaseUserProfile);
      await this.saveToCache(profile);
      return profile;
    } catch (error) {
      console.error('[ProfileService] fetchProfileFromSupabase error:', error);
      return null;
    }
  }

  /**
   * Arka planda profili güncelle
   */
  private async refreshProfileInBackground(): Promise<void> {
    try {
      const profile = await this.fetchProfileFromSupabase();
      if (profile) {
        this.cachedProfile = profile;
      }
    } catch (error) {
      // Sessizce hata yut
    }
  }

  // =====================================================
  // Profil Oluşturma
  // =====================================================

  /**
   * Yeni profil oluştur
   */
  async createProfile(userId: string, email: string, initialData?: Partial<ProfileUpdate>): Promise<UnifiedUserProfile> {
    const newProfile: UnifiedUserProfile = {
      ...DEFAULT_PROFILE,
      id: userId,
      email,
      nickname: email.split('@')[0],
      ...initialData,
    };

    try {
      const supabaseData = toSupabaseProfile(newProfile);
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email,
          ...supabaseData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('[ProfileService] Create error:', error.message);
      }

      await this.saveToCache(newProfile);
      return newProfile;
    } catch (error) {
      console.error('[ProfileService] createProfile error:', error);
      return newProfile;
    }
  }

  // =====================================================
  // Profil Güncelleme
  // =====================================================

  /**
   * Profili güncelle
   * Supabase + AsyncStorage (her zaman ikisine de kaydet)
   */
  async updateProfile(updates: ProfileUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // ✅ Supabase auth varsa Supabase'e kaydet
      if (user) {
        const supabaseUpdates = toSupabaseProfile(updates);
        const { error } = await supabase
          .from('user_profiles')
          .update(supabaseUpdates)
          .eq('id', user.id);

        if (error) {
          console.warn('[ProfileService] Supabase update error:', error.message);
          // Hata olsa bile local'e kaydet
        } else {
          console.log('[ProfileService] Supabase profile updated');
        }
      }

      // ✅ Her zaman local cache'i güncelle (tek key)
      if (this.cachedProfile) {
        this.cachedProfile = { 
          ...this.cachedProfile, 
          ...updates,
          // Özel alanları da güncelle
          fullName: updates.name || this.cachedProfile.fullName,
          profileSetupComplete: true,
        };
      } else {
        // Cache yoksa yeni oluştur
        this.cachedProfile = {
          ...DEFAULT_PROFILE,
          ...updates,
          profileSetupComplete: true,
        };
      }
      
      await this.saveToCache(this.cachedProfile);
      console.log('[ProfileService] Profile updated successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('[ProfileService] updateProfile error:', error);
      return { success: false, error: error.message || 'Profil güncellenemedi' };
    }
  }

  /**
   * Nickname güncelle (benzersizlik kontrolü ile)
   */
  async updateNickname(nickname: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Benzersizlik kontrolü
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', this.cachedProfile?.id || '')
        .single();

      if (existing) {
        return { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor' };
      }

      return await this.updateProfile({ nickname });
    } catch (error: any) {
      // PGRST116 = no rows, yani nickname müsait
      if (error?.code === 'PGRST116') {
        return await this.updateProfile({ nickname });
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Favori takımları güncelle
   */
  async updateFavoriteTeams(teams: string[]): Promise<{ success: boolean; error?: string }> {
    return await this.updateProfile({ favoriteTeams: teams });
  }

  /**
   * Milli takım seç
   */
  async updateNationalTeam(team: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateProfile({ nationalTeam: team });
  }

  /**
   * Kulüp takımlarını güncelle
   */
  async updateClubTeams(teams: string[]): Promise<{ success: boolean; error?: string }> {
    return await this.updateProfile({ clubTeams: teams });
  }

  /**
   * Tema güncelle
   */
  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<{ success: boolean; error?: string }> {
    return await this.updateProfile({ theme });
  }

  /**
   * Dil güncelle
   */
  async updateLanguage(language: string): Promise<{ success: boolean; error?: string }> {
    return await this.updateProfile({ preferredLanguage: language });
  }

  // =====================================================
  // Oyun İstatistikleri
  // =====================================================

  /**
   * Tahmin sonucu kaydet ve istatistikleri güncelle
   */
  async recordPredictionResult(isCorrect: boolean, points: number): Promise<void> {
    if (!this.cachedProfile) {
      await this.getProfile();
    }
    
    if (!this.cachedProfile) return;

    const updates: ProfileUpdate = {
      totalPredictions: (this.cachedProfile.totalPredictions || 0) + 1,
      correctPredictions: (this.cachedProfile.correctPredictions || 0) + (isCorrect ? 1 : 0),
      totalPoints: (this.cachedProfile.totalPoints || 0) + points,
      currentStreak: isCorrect ? (this.cachedProfile.currentStreak || 0) + 1 : 0,
      bestStreak: isCorrect
        ? Math.max(this.cachedProfile.bestStreak || 0, (this.cachedProfile.currentStreak || 0) + 1)
        : this.cachedProfile.bestStreak || 0,
    };

    await this.updateProfile(updates);
  }

  /**
   * Günlük giriş kaydı
   */
  async recordDailyLogin(): Promise<void> {
    if (!this.cachedProfile) {
      await this.getProfile();
    }
    
    if (!this.cachedProfile) return;

    const lastLogin = this.cachedProfile.lastLoginAt 
      ? new Date(this.cachedProfile.lastLoginAt) 
      : null;
    const now = new Date();
    
    // Aynı gün mü kontrol et
    if (lastLogin && lastLogin.toDateString() === now.toDateString()) {
      return; // Bugün zaten giriş yapmış
    }

    // Dün mü kontrol et (streak devamı için)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isConsecutiveDay = lastLogin && lastLogin.toDateString() === yesterday.toDateString();
    
    const updates: ProfileUpdate = {
      dayStreak: isConsecutiveDay ? (this.cachedProfile.dayStreak || 0) + 1 : 1,
    };

    await this.updateProfile(updates);
  }

  // =====================================================
  // Oyuncu Sayıları
  // =====================================================

  /**
   * Toplam oyuncu sayılarını getir
   */
  async getPlayerCounts(): Promise<PlayerCounts> {
    try {
      // Cache kontrolü
      if (this.cachedPlayerCounts) {
        this.refreshPlayerCountsInBackground();
        return this.cachedPlayerCounts;
      }

      // AsyncStorage kontrolü
      const stored = await AsyncStorage.getItem(PLAYER_COUNTS_KEY);
      if (stored) {
        this.cachedPlayerCounts = JSON.parse(stored);
        this.refreshPlayerCountsInBackground();
        return this.cachedPlayerCounts!;
      }

      return await this.fetchPlayerCounts();
    } catch (error) {
      console.error('[ProfileService] getPlayerCounts error:', error);
      return { countryTotal: 5000, globalTotal: 50000 }; // Fallback
    }
  }

  private async fetchPlayerCounts(): Promise<PlayerCounts> {
    try {
      const { data, error } = await supabase
        .from('player_counts')
        .select('*');

      if (error || !data) {
        return { countryTotal: 5000, globalTotal: 50000 };
      }

      const countryData = data.find(d => d.country === (this.cachedProfile?.country || 'TR'));
      const globalData = data.find(d => d.country === 'GLOBAL');

      const counts: PlayerCounts = {
        countryTotal: countryData?.total_players || 5000,
        globalTotal: globalData?.total_players || 50000,
      };

      this.cachedPlayerCounts = counts;
      await AsyncStorage.setItem(PLAYER_COUNTS_KEY, JSON.stringify(counts));

      return counts;
    } catch (error) {
      return { countryTotal: 5000, globalTotal: 50000 };
    }
  }

  private async refreshPlayerCountsInBackground(): Promise<void> {
    try {
      await this.fetchPlayerCounts();
    } catch (error) {
      // Sessizce hata yut
    }
  }

  // =====================================================
  // Cache Yönetimi
  // =====================================================

  private async saveToCache(profile: UnifiedUserProfile): Promise<void> {
    this.cachedProfile = profile;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  /**
   * Cache temizle (çıkış yapıldığında)
   */
  async clearCache(): Promise<void> {
    this.cachedProfile = null;
    this.cachedPlayerCounts = null;
    await AsyncStorage.multiRemove([STORAGE_KEY, PLAYER_COUNTS_KEY]);
  }

  /**
   * Profili yeniden yükle
   */
  async refreshProfile(): Promise<UnifiedUserProfile | null> {
    this.cachedProfile = null;
    return await this.fetchProfileFromSupabase();
  }

  // =====================================================
  // Yardımcı Metodlar
  // =====================================================

  /**
   * Pro üyelik kontrolü
   */
  isPro(): boolean {
    return this.cachedProfile?.plan === 'pro';
  }

  /**
   * Cached profile getter
   */
  getCachedProfile(): UnifiedUserProfile | null {
    return this.cachedProfile;
  }
}

// Singleton instance
export const profileService = new ProfileService();
export default profileService;
