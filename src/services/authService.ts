// src/services/authService.ts
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  total_points: number;
  current_streak: number;
  best_streak: number;
  accuracy: number;
  rank: number;
  is_premium: boolean;
  premium_until?: string;
  favorite_teams: string[];
}

class AuthService {
  // Check if username is available
  async checkUsernameAvailability(username: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;

      return { 
        success: true, 
        available: !data, // If no data found, username is available
        message: data ? 'Bu kullanıcı adı zaten kullanılıyor' : 'Kullanıcı adı uygun'
      };
    } catch (error: any) {
      console.error('Username check error:', error);
      return { success: false, available: false, error: error.message };
    }
  }

  // Check if email is already registered
  async checkEmailAvailability(email: string) {
    try {
      console.log('🔍 [authService] Email kontrolü başladı:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      console.log('📊 [authService] Supabase yanıtı:', { data, error });

      if (error) {
        console.error('❌ [authService] Supabase hatası:', error);
        throw error;
      }

      const result = { 
        success: true, 
        available: !data,
        message: data ? 'Bu e-posta adresi zaten kayıtlı' : 'E-posta uygun'
      };
      
      console.log('✅ [authService] Kontrol sonucu:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [authService] Email check error:', error);
      return { success: false, available: false, error: error.message };
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, username: string) {
    try {
      // 1. Check username availability
      const usernameCheck = await this.checkUsernameAvailability(username);
      if (!usernameCheck.available) {
        throw new Error(usernameCheck.message || 'Bu kullanıcı adı zaten kullanılıyor');
      }

      // 2. Check email availability
      const emailCheck = await this.checkEmailAvailability(email);
      if (!emailCheck.available) {
        throw new Error(emailCheck.message || 'Bu e-posta adresi zaten kayıtlı');
      }

      // 3. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 4. Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          total_points: 0,
          current_streak: 0,
          best_streak: 0,
          accuracy: 0,
          is_premium: false,
          favorite_teams: [],
        });

      if (profileError) throw profileError;

      // 5. Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        id: authData.user.id,
        email,
        username,
        authenticated: true,
      }));

      return { success: true, user: authData.user };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        ...profile,
        authenticated: true,
      }));

      return { success: true, user: profile };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      // Supabase signOut - hata olsa bile devam et
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.warn('Supabase signOut warning:', supabaseError);
        // Supabase hatası olsa bile AsyncStorage'ı temizle
      }

      // Clear AsyncStorage - HER ZAMAN çalışmalı
      // ✅ Hem eski hem yeni key'leri temizle (geriye dönük uyumluluk)
      await AsyncStorage.multiRemove([
        // Yeni key'ler (STORAGE_KEYS)
        'tacticiq-user',
        'tacticiq-language',
        'tacticiq-theme',
        'tacticiq-favorite-clubs',
        'tacticiq-onboarding-complete',
        'tacticiq-pro-status',
        'tacticiq-profile-setup',
        'tacticiq_user_profile',
        'tacticiq_player_counts',
        // Eski key'ler (geriye dönük uyumluluk)
        'fan-manager-user',
        'fan-manager-language',
        'fan-manager-favorite-clubs',
      ]);

      // ProfileService cache'ini temizle
      try {
        const { profileService } = await import('./profileService');
        profileService.clearCache();
      } catch (e) {
        // Ignore cache clear error
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Son çare olarak yine de AsyncStorage'ı temizlemeye çalış
      try {
        await AsyncStorage.clear();
      } catch (e) {
        // Ignore
      }
      return { success: false, error: error.message };
    }
  }

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { success: true, session: data.session };
    } catch (error: any) {
      console.error('Get session error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return profile as AuthUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<AuthUser>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update AsyncStorage
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
          ...parsedUser,
          ...updates,
        }));
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Password reset
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tacticiq://reset-password',
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete user profile (cascade will delete related data)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Sign out
      await this.signOut();

      return { success: true };
    } catch (error: any) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update favorite teams
  async updateFavoriteTeams(teams: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update({ favorite_teams: teams })
        .eq('id', user.id);

      if (error) throw error;

      // Update AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_TEAMS, JSON.stringify(teams));

      return { success: true };
    } catch (error: any) {
      console.error('Update favorite teams error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();
